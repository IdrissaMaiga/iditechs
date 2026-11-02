import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { getMcp, liveInstances, WA_API_URL } from "@/lib/whatsapp/mcp";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Statuses come from the WhatsApp server itself (read-only resource), never from probing calls:
// connected, connecting, qr_pending, disconnected, offline (down for over 2 minutes) or gone.
async function syncStatuses<T extends { id: string; instanceId: string; status: string }>(
  mcp: Awaited<ReturnType<typeof getMcp>>,
  instances: T[],
): Promise<Array<T & { lastConnected: string | number | null }>> {
  const live = await liveInstances(mcp);
  return Promise.all(
    instances.map(async (inst) => {
      const l = live.get(inst.instanceId);
      const status = l?.status ?? "gone";
      if (status !== inst.status) await db.waInstance.update({ where: { id: inst.id }, data: { status } });
      return { ...inst, status, lastConnected: l?.lastConnected ?? null };
    }),
  );
}

// After WhatsApp drops a device the server may be between reconnects, or stuck: it answers "already
// connecting" while its socket is gone. QR and pairing calls then fail with "not connected". Keep
// asking; if it is still unreachable after 6 s, restart that instance once (fresh socket; its login is
// already gone, so nothing is lost) and keep asking for up to 40 s in total.
async function whenReady<T>(fn: () => Promise<T>, restart: () => Promise<unknown>): Promise<T> {
  const started = Date.now();
  let restarted = false;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (!/not connected|Connection Closed|not initialized/i.test(msg) || Date.now() - started > 40_000) throw e;
      if (!restarted && Date.now() - started > 6_000) {
        restarted = true;
        await restart().catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function liveStatus(mcp: Awaited<ReturnType<typeof getMcp>>, instanceId: string) {
  return (await liveInstances(mcp)).get(instanceId)?.status ?? "gone";
}

export async function GET(req: NextRequest) {
  if (!(await getOwner())) return json({ ok: false }, 401);
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");

  if (tag) {
    let instances = await db.waInstance.findMany({
      where: { tags: { has: tag } },
      select: { id: true, instanceId: true, name: true, phoneNumber: true, status: true, webhookUrl: true, tags: true },
    });
    try {
      instances = await syncStatuses(await getMcp(), instances);
    } catch {
      // WhatsApp server unreachable: last known statuses
    }
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

  const instances = await db.waInstance.findMany({ orderBy: { createdAt: "desc" } });

  try {
    return json({ ok: true, live: true, instances: await syncStatuses(await getMcp(), instances) });
  } catch {
    // WhatsApp server unreachable: last known statuses, flagged so the page can say so
    return json({ ok: true, live: false, instances });
  }
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
      if ((await liveStatus(mcp, inst.instanceId)) !== "connected") {
        await mcp.call("wa_connect_instance", { instanceId: inst.instanceId }).catch(() => {});
      }
      const result = (await whenReady(
        () => mcp.call("wa_get_qr_code", { instanceId: inst.instanceId }),
        () => mcp.call("wa_restart_instance", { instanceId: inst.instanceId }),
      )) as Record<string, unknown>;
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
      if ((await liveStatus(mcp, inst.instanceId)) !== "connected") {
        await mcp.call("wa_connect_instance", { instanceId: inst.instanceId }).catch(() => {});
      }
      const result = (await whenReady(
        () => mcp.call("wa_get_pairing_code", { instanceId: inst.instanceId, phoneNumber: clean }),
        () => mcp.call("wa_restart_instance", { instanceId: inst.instanceId }),
      )) as Record<string, unknown>;
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
      const status = await liveStatus(mcp, inst.instanceId);
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
