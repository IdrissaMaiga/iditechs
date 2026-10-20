import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { parseCampaignInput, smartLink } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await db.campaign.findUnique({ where: { id: params.id }, include: { _count: { select: { clicks: true } } } });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { _count, ...rest } = c;
  return NextResponse.json({ campaign: { ...rest, clicks: _count.clicks, link: smartLink(c.slug) } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  const parsed = parseCampaignInput(raw, true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const c = await db.campaign.update({ where: { id: params.id }, data: parsed.data as Prisma.CampaignUpdateInput });
    return NextResponse.json({ campaign: c });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "not found" }, { status: 404 });
      if (e.code === "P2002") return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await db.campaign.deleteMany({ where: { id: params.id } });
  if (!r.count) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
