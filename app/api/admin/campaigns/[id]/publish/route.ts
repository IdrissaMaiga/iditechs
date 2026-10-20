import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { publishToFacebook, publishToInstagram } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await db.campaign.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!c.channels.length) return NextResponse.json({ error: "campaign has no channels" }, { status: 400 });

  const results: Record<string, { ok: boolean; id?: string; error?: string }> = {};
  const update: { fbPostId?: string; igMediaId?: string } = {};
  if (c.channels.includes("facebook") && !c.fbPostId) {
    try { update.fbPostId = await publishToFacebook(c); results.facebook = { ok: true, id: update.fbPostId }; }
    catch (e) { results.facebook = { ok: false, error: (e as Error).message }; }
  }
  if (c.channels.includes("instagram") && !c.igMediaId) {
    try { update.igMediaId = await publishToInstagram(c); results.instagram = { ok: true, id: update.igMediaId }; }
    catch (e) { results.instagram = { ok: false, error: (e as Error).message }; }
  }

  const errors = Object.entries(results).filter(([, r]) => !r.ok).map(([ch, r]) => `${ch}: ${r.error}`);
  const anyOk = Object.values(results).some((r) => r.ok) || !!c.fbPostId || !!c.igMediaId;
  const saved = await db.campaign.update({
    where: { id: c.id },
    data: {
      ...update,
      status: anyOk ? "published" : "failed",
      publishedAt: anyOk ? c.publishedAt ?? new Date() : c.publishedAt,
      lastError: errors.length ? errors.join(" | ") : null,
    },
  });
  return NextResponse.json({ results, campaign: saved }, { status: errors.length && !anyOk ? 502 : 200 });
}
