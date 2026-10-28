import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { getMcp } from "@/lib/whatsapp/mcp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  if (!(await getOwner())) return json({ ok: false }, 401);
  const instances = await db.waInstance.findMany({ orderBy: { createdAt: "desc" } });
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
      const instanceId = (result.instanceId ?? result.id ?? name) as string;
      const instance = await db.waInstance.create({
        data: { instanceId, name, channel: channel as string, status: "created" },
      });
      return json({ ok: true, instance, result });
    }

    if (action === "connect") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = await mcp.call("wa_connect_instance", { instanceId: inst.instanceId });
      await db.waInstance.update({ where: { id }, data: { status: "connecting" } });
      return json({ ok: true, result });
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
      const result = await mcp.call("wa_delete_instance", { instanceId: inst.instanceId });
      await db.waInstance.delete({ where: { id } });
      return json({ ok: true, result });
    }

    if (action === "qr") {
      const { id } = body as { id: string };
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = await mcp.call("wa_get_qr_code", { instanceId: inst.instanceId });
      return json({ ok: true, result });
    }

    if (action === "pair") {
      const { id, phoneNumber } = body as { id: string; phoneNumber: string };
      if (!phoneNumber) return json({ ok: false, error: "phoneNumber required" }, 400);
      const inst = await db.waInstance.findUnique({ where: { id } });
      if (!inst) return json({ ok: false, error: "not found" }, 404);
      const result = await mcp.call("wa_get_pairing_code", {
        instanceId: inst.instanceId,
        phoneNumber,
      });
      await db.waInstance.update({ where: { id }, data: { phoneNumber, status: "pairing" } });
      return json({ ok: true, result });
    }

    if (action === "assign") {
      const { id, app } = body as { id: string; app: string | null };
      await db.waInstance.update({ where: { id }, data: { app } });
      return json({ ok: true });
    }

    if (action === "update-status") {
      const { id, status } = body as { id: string; status: string };
      await db.waInstance.update({ where: { id }, data: { status } });
      return json({ ok: true });
    }

    return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "error" }, 500);
  }
}
