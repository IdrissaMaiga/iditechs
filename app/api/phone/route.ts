import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function GET(req: NextRequest) {
  if (!(await getOwner())) return json({ ok: false }, 401);
  const sp = req.nextUrl.searchParams;
  // The signing secret is only sent when the owner opens the setup panel
  if (sp.get("setup") === "1") return json({ ok: true, secret: process.env.PHONE_WEBHOOK_SECRET ?? null });
  const kind = sp.get("kind");
  const q = sp.get("q")?.trim();
  const limit = Math.min(Number(sp.get("limit")) || 200, 500);
  const where = {
    ...(kind && kind !== "all" ? { kind } : {}),
    ...(q
      ? { OR: [{ from: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] }
      : {}),
  };
  const [events, unread] = await Promise.all([
    db.phoneEvent.findMany({ where, orderBy: { receivedAt: "desc" }, take: limit }),
    db.phoneEvent.groupBy({ by: ["kind"], where: { read: false }, _count: { _all: true } }),
  ]);
  return json({
    ok: true,
    events,
    unread: Object.fromEntries(unread.map((u) => [u.kind, u._count._all])),
  });
}

export async function POST(req: NextRequest) {
  if (!(await getOwner())) return json({ ok: false }, 401);
  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string; kind?: string };
  const ids = body.id ? { id: body.id } : {};
  const kind = body.kind && body.kind !== "all" ? { kind: body.kind } : {};

  if (body.action === "read") {
    await db.phoneEvent.updateMany({ where: { ...ids, ...kind, read: false }, data: { read: true } });
    return json({ ok: true });
  }
  if (body.action === "unread" && body.id) {
    await db.phoneEvent.update({ where: { id: body.id }, data: { read: false } });
    return json({ ok: true });
  }
  if (body.action === "delete" && body.id) {
    await db.phoneEvent.delete({ where: { id: body.id } });
    return json({ ok: true });
  }
  return json({ ok: false, error: "unknown action" }, 400);
}
