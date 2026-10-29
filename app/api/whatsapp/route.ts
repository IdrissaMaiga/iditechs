import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { getMcp, WA_API_URL } from "@/lib/whatsapp/mcp";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

type Probe = { instanceId: string; status: string; phoneNumber: string | null };

// wa_connect_instance answers "connecting" even when the socket is already up, so liveness is
// probed with a lookup that only succeeds on a connected instance. Returns null for "no change".
async function probeStatus(mcp: Awaited<ReturnType<typeof getMcp>>, inst: Probe): Promise<string | null> {
  if (inst.status === "disconnected" || inst.status === "gone") return null;
  try {
    if (inst.phoneNumber) {
      await mcp.call("wa_check_number_exists", { instanceId: inst.instanceId, phoneNumber: inst.phoneNumber });
      return "open";
    }
    const r = (await mcp.call("wa_connect_instance", { instanceId: inst.instanceId })) as Record<string, unknown>;
    return (r.status as string) || null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not found")) return "gone";
    if (/not initialized|not connected|closed/i.test(msg) && (inst.status === "open" || inst.status === "connected")) return "closed";
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");

  if (tag) {
    const instances = await db.waInstance.findMany({
      where: { tags: { has: tag } },
      select: { instanceId: true, name: true, phoneNumber: true, status: true, webhookUrl: true, tags: true },
    });
    return json({
      ok: true,
      apiUrl: WA_API_URL,
      instances: instances.map((i) => ({
        instanceId: i.instanceId,
        name: i.name,
        phoneNumber: i.phoneNumber,
        status: i.status,
        webhookUrl: i.webhookUrl,
        tags: i.tags,
      })),
    });
  }

  if (!(await getOwner())) return json({ ok: false }, 401);
  const instances = await db.waInstance.findMany({ orderBy: { createdAt: "desc" } });

  try {
    const mcp = await getMcp();
    await Promise.all(
      instances.map(async (inst) => {
        const live = await probeStatus(mcp, inst);
        if (live && live !== inst.status) {
          await db.waInstance.update({ where: { id: inst.id }, data: { status: live } });
          inst.status = live;
        }
      })
    );
  } catch {
    // MCP unreachable — return stale statuses rather than failing
  }

  return json({ ok: true, instances });
}

export async function POST(req: NextRequest) {
  if (!(await getOwner())) return json({ ok: false }, 401);
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const { action } = body as { action: string };

  try {
    const mcp = await getMcp();

    if (action === "create") {
      const { name, channel = "baileys" } = body as { name: string; channel?: string };
      if (!name) return json({ ok: false, error: "name required" }, 400);
      const result = (await mcp.call("wa_create_instance", { name, channel })) as Record<string, unknown>;
      const instanceId = (result.id ?? result.instanceId ?? name) as string;
      await mcp.call("wa_connect_instance", { instanceId }).catch(() => {});
      const instance = await db.waInstance.create({
        data: { instanceId, name, channel: channel as string, status: "connecting" },
      });
      return json({ ok: true, instance, raw: result });
    }

    if (action === "connect") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = (await mcp.call("wa_connect_instance", { instanceId: inst.instanceId })) as Record<string, unknown>;
      const status = (result.status as string) || "connecting";
      await db.waInstance.update({ where: { id }, data: { status } });
      return json({ ok: true, result, status });
    }

    if (action === "disconnect") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = await mcp.call("wa_disconnect_instance", { instanceId: inst.instanceId });
      await db.waInstance.update({ where: { id }, data: { status: "disconnected" } });
      return json({ ok: true, result });
    }

    if (action === "restart") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = await mcp.call("wa_restart_instance", { instanceId: inst.instanceId });
      return json({ ok: true, result });
    }

    if (action === "delete") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = await mcp.call("wa_delete_instance", { instanceId: inst.instanceId }).catch((e: unknown) => {
        if (e instanceof Error && e.message.includes("not found")) return { alreadyGone: true };
        throw e;
      });
      await db.waInstance.delete({ where: { id } });
      return json({ ok: true, result });
    }

    if (action === "qr") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      if (inst.status !== "connected" && inst.status !== "open") {
        await mcp.call("wa_connect_instance", { instanceId: inst.instanceId }).catch(() => {});
      }
      const result = (await mcp.call("wa_get_qr_code", { instanceId: inst.instanceId })) as Record<string, unknown>;
      const rawQr = (result.qrCode ?? result.qr ?? result.code ?? "") as string;
      let qrImage = rawQr;
      if (rawQr && !rawQr.startsWith("data:") && !rawQr.startsWith("http")) {
        qrImage = await QRCode.toDataURL(rawQr, { width: 300, margin: 2 });
      }
      return json({ ok: true, qrImage });
    }

    if (action === "pair") {
      const { id, phoneNumber } = body as { id: string; phoneNumber: string };
      if (!phoneNumber) return json({ ok: false, error: "phoneNumber required" }, 400);
      const clean = phoneNumber.replace(/\D/g, "");
      if (clean.length < 5) return json({ ok: false, error: "Phone number too short. Use country code + number, digits only (e.g. 22377374782)" }, 400);
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      if (inst.status !== "connected" && inst.status !== "open") {
        await mcp.call("wa_connect_instance", { instanceId: inst.instanceId }).catch(() => {});
      }
      const result = (await mcp.call("wa_get_pairing_code", {
        instanceId: inst.instanceId,
        phoneNumber: clean,
      })) as Record<string, unknown>;
      const pairingCode = (result.pairingCode ?? result.code ?? "") as string;
      await db.waInstance.update({ where: { id }, data: { phoneNumber: clean, status: "pairing" } });
      return json({ ok: true, pairingCode });
    }

    if (action === "tags") {
      const { id, tags } = body as { id: string; tags: string[] };
      await db.waInstance.update({ where: { id }, data: { tags: tags ?? [] } });
      return json({ ok: true });
    }

    if (action === "webhook") {
      const { id, webhookUrl } = body as { id: string; webhookUrl: string | null };
      await db.waInstance.update({ where: { id }, data: { webhookUrl } });
      return json({ ok: true });
    }

    if (action === "refresh-status") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const status = (await probeStatus(mcp, inst)) ?? inst.status;
      if (status !== inst.status) {
        await db.waInstance.update({ where: { id }, data: { status } });
      }
      return json({ ok: true, status });
    }

    return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) {
    console.error("[whatsapp]", action, e);
    return json({ ok: false, error: e instanceof Error ? e.message : "error" }, 500);
  }
}
