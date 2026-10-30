import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { refererHost } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await db.campaign.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });

  const clicks = await db.campaignClick.findMany({ where: { campaignId: c.id }, select: { at: true, device: true, channel: true, country: true, referer: true, ipHash: true } });
  const tally = (key: (x: (typeof clicks)[number]) => string) =>
    clicks.reduce<Record<string, number>>((acc, x) => { const k = key(x); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});

  return NextResponse.json({
    total: clicks.length,
    uniqueVisitors: new Set(clicks.map((x) => x.ipHash).filter(Boolean)).size,
    byDevice: tally((x) => x.device),
    byChannel: tally((x) => x.channel ?? "direct"),
    byCountry: tally((x) => x.country ?? "unknown"),
    byReferer: tally((x) => refererHost(x.referer) ?? "none"),
    byDay: tally((x) => x.at.toISOString().slice(0, 10)),
  });
}
