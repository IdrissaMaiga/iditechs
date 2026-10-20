import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { detectDevice, resolveDestination } from "@/lib/campaigns";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const home = publicUrl("/", req);
  const slug = (params.slug || "").toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return NextResponse.redirect(home, 302);

  const campaign = await db.campaign.findUnique({ where: { slug } }).catch(() => null);
  if (!campaign) return NextResponse.redirect(home, 302);

  const device = detectDevice(req.headers.get("user-agent"));
  const channelRaw = req.nextUrl.searchParams.get("c");
  const channel = channelRaw && /^[a-z0-9_-]{1,32}$/i.test(channelRaw) ? channelRaw.toLowerCase() : null;
  const dest = resolveDestination(campaign, device, channel);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const ipHash = ip ? createHash("sha256").update(`${process.env.NEXTAUTH_SECRET || ""}:${ip}`).digest("hex") : null;
  await db.campaignClick
    .create({
      data: {
        campaignId: campaign.id, device, channel,
        country: req.headers.get("x-vercel-ip-country")?.slice(0, 8) || null,
        referer: req.headers.get("referer")?.slice(0, 500) || null,
        ipHash,
      },
    })
    .catch(() => {});

  return NextResponse.redirect(dest ?? home.toString(), 302);
}
