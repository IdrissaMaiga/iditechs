import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { getPostInsights } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await db.campaign.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });

  const clicks = await db.campaignClick.findMany({ where: { campaignId: c.id }, select: { at: true, device: true, channel: true, country: true } });
  const tally = (key: (x: (typeof clicks)[number]) => string) =>
    clicks.reduce<Record<string, number>>((acc, x) => { const k = key(x); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});

  const meta = req.nextUrl.searchParams.get("meta") === "1" ? await getPostInsights(c).catch((e: Error) => ({ error: e.message })) : undefined;
  return NextResponse.json({
    total: clicks.length,
    byDevice: tally((x) => x.device),
    byChannel: tally((x) => x.channel ?? "direct"),
    byCountry: tally((x) => x.country ?? "unknown"),
    byDay: tally((x) => x.at.toISOString().slice(0, 10)),
    meta,
  });
}
