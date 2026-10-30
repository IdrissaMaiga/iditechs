import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { detectDevice, detectSource, isBot, resolveDestination } from "@/lib/campaigns";
import { countryOf } from "@/lib/geo";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const home = publicUrl("/", req);
  const slug = (params.slug || "").toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return NextResponse.redirect(home, 302);

  const campaign = await db.campaign.findUnique({ where: { slug } }).catch(() => null);
  if (!campaign) return NextResponse.redirect(home, 302);

  const ua = req.headers.get("user-agent");
  const referer = req.headers.get("referer");
  const device = detectDevice(ua);
  const channel = detectSource(req.nextUrl.searchParams.get("c"), ua, referer);
  const dest = resolveDestination(campaign, device, channel);

  if (!isBot(ua)) {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const ipHash = ip ? createHash("sha256").update(`${process.env.NEXTAUTH_SECRET || ""}:${ip}`).digest("hex") : null;
    await db.campaignClick
      .create({
        data: {
          campaignId: campaign.id, device, channel,
          country: await countryOf(ip).catch(() => null),
          referer: referer?.slice(0, 500) || null,
          ipHash,
        },
      })
      .catch(() => {});
  }

  // no-store so in-app browsers re-hit /go on every tap instead of replaying a cached redirect
  const res = NextResponse.redirect(dest ?? home.toString(), 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
