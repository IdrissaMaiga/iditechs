import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { parseCampaignInput, smartLink } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db.campaign.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { clicks: true } } } });
  return NextResponse.json({
    campaigns: list.map(({ _count, ...c }) => ({ ...c, clicks: _count.clicks, link: smartLink(c.slug) })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  const parsed = parseCampaignInput(raw, false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const c = await db.campaign.create({ data: parsed.data as Prisma.CampaignCreateInput });
    return NextResponse.json({ campaign: c, link: smartLink(c.slug) }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    throw e;
  }
}
