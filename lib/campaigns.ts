import type { Campaign } from "@prisma/client";

// A campaign is one tracked link: the same post goes out by hand on any of our socials, each
// copy carries /go/<slug>?c=<platform>, and every click is logged before the redirect.
// No social media API is called from here.
export const GOALS = ["web", "app", "whatsapp", "form"] as const;
export const PLATFORMS = ["instagram", "facebook", "tiktok", "x", "youtube", "linkedin", "whatsapp"] as const;
export type Device = "ios" | "android" | "desktop" | "other";

export function isHttpUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function detectDevice(ua: string | null): Device {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "other";
  if (/iphone|ipad|ipod/.test(s)) return "ios";
  if (/android/.test(s)) return "android";
  if (/windows|macintosh|linux|cros/.test(s)) return "desktop";
  return "other";
}

export function siteOrigin(): string {
  return (process.env.CAMPAIGN_LINK_ORIGIN || "https://iditechs.com").replace(/\/$/, "");
}

export function smartLink(slug: string, channel?: string): string {
  return `${siteOrigin()}/go/${slug}${channel ? `?c=${encodeURIComponent(channel)}` : ""}`;
}

/** One ready-to-paste link per platform, so each copy of the post reports where the click came from. */
export function platformLinks(slug: string): Record<string, string> {
  return Object.fromEntries(PLATFORMS.map((p) => [p, smartLink(slug, p)]));
}

const IN_APP: [RegExp, string][] = [
  [/instagram/i, "instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/, "facebook"],
  [/musical_ly|BytedanceWebview|TikTok/i, "tiktok"],
  [/LinkedInApp/i, "linkedin"],
  [/Twitter/i, "x"],
];

// Pasting a link into a post makes each platform fetch it once for the preview card; those
// fetches still get redirected but must not be counted as clicks.
const BOTS = /facebookexternalhit|facebookcatalog|meta-externalagent|Facebot|Twitterbot|LinkedInBot|WhatsApp\/|TelegramBot|Slackbot|Discordbot|Pinterestbot|Applebot|Googlebot|bingbot|YandexBot|Bytespider|TikTokSpider|SkypeUriPreview|Embedly|HeadlessChrome|curl\/|wget|python-requests|Go-http-client|axios|node-fetch|\b(bot|crawler|spider)\b/i;

export function isBot(ua: string | null): boolean {
  return !ua || BOTS.test(ua);
}

const REFERER_HOSTS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "x"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
];

export function refererHost(referer: string | null): string | null {
  try {
    return referer ? new URL(referer).hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Where a click came from: the ?c= tag on the link wins, then the in-app browser named in the
 * user agent, then the referer host. Null means direct (typed, copied, or the source hid itself).
 */
export function detectSource(tag: string | null, ua: string | null, referer: string | null): string | null {
  if (tag && /^[a-z0-9_-]{1,32}$/i.test(tag)) return tag.toLowerCase();
  for (const [re, name] of IN_APP) if (re.test(ua ?? "")) return name;
  const host = refererHost(referer);
  if (host) for (const [re, name] of REFERER_HOSTS) if (re.test(host)) return name;
  return null;
}

function withUtm(url: string, c: Campaign, channel: string | null): string {
  const u = new URL(url);
  if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", channel || "direct");
  if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", c.utmMedium);
  if (!u.searchParams.has("utm_campaign")) u.searchParams.set("utm_campaign", c.utmCampaign || c.slug);
  if (channel && !u.searchParams.has("utm_content")) u.searchParams.set("utm_content", channel);
  return u.toString();
}

/** Where a click on this campaign should land, or null if the campaign has no usable destination. */
export function resolveDestination(c: Campaign, device: Device, channel: string | null): string | null {
  const web = isHttpUrl(c.webUrl) ? withUtm(c.webUrl, c, channel) : null;
  switch (c.goal) {
    case "app":
      if (device === "ios" && isHttpUrl(c.iosUrl)) return c.iosUrl;
      if (device === "android" && isHttpUrl(c.androidUrl)) return c.androidUrl;
      return web ?? (isHttpUrl(c.androidUrl) ? c.androidUrl : isHttpUrl(c.iosUrl) ? c.iosUrl : null);
    case "whatsapp": {
      const digits = (c.whatsappNumber ?? "").replace(/\D/g, "");
      if (!digits) return web;
      return `https://wa.me/${digits}${c.whatsappText ? `?text=${encodeURIComponent(c.whatsappText)}` : ""}`;
    }
    case "form":
      return isHttpUrl(c.formUrl) ? c.formUrl : web;
    default:
      return web;
  }
}

type Input = Record<string, unknown>;
const URL_FIELDS = ["webUrl", "iosUrl", "androidUrl", "formUrl"] as const;
const STR_FIELDS = ["title", "body", "whatsappText", "utmMedium", "utmCampaign"] as const;

/** Validates create/patch input; returns the clean data or an error message. */
export function parseCampaignInput(raw: Input, partial: boolean): { data: Record<string, unknown> } | { error: string } {
  const d: Record<string, unknown> = {};
  if (raw.slug !== undefined || !partial) {
    if (typeof raw.slug !== "string" || !/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(raw.slug)) return { error: "slug must be lowercase letters, digits and dashes" };
    d.slug = raw.slug;
  }
  if ((raw.title !== undefined || !partial) && (typeof raw.title !== "string" || !raw.title.trim())) return { error: "title required" };
  if (raw.utmMedium !== undefined && (typeof raw.utmMedium !== "string" || !raw.utmMedium.trim())) return { error: "utmMedium must be a non-empty string" };
  for (const f of STR_FIELDS) {
    if (raw[f] === undefined) continue;
    if (raw[f] !== null && typeof raw[f] !== "string") return { error: `${f} must be a string` };
    d[f] = raw[f];
  }
  for (const f of URL_FIELDS) {
    if (raw[f] === undefined) continue;
    if (raw[f] === null || raw[f] === "") { d[f] = null; continue; }
    if (!isHttpUrl(raw[f])) return { error: `${f} must be an http(s) URL` };
    d[f] = raw[f];
  }
  if (raw.whatsappNumber !== undefined) {
    const digits = String(raw.whatsappNumber ?? "").replace(/\D/g, "");
    if (raw.whatsappNumber && !/^\d{8,15}$/.test(digits)) return { error: "whatsappNumber must be 8-15 digits with country code" };
    d.whatsappNumber = digits || null;
  }
  if (raw.goal !== undefined) {
    if (!GOALS.includes(raw.goal as never)) return { error: `goal must be one of ${GOALS.join(", ")}` };
    d.goal = raw.goal;
  }
  if (raw.listed !== undefined) {
    if (typeof raw.listed !== "boolean") return { error: "listed must be true or false" };
    d.listed = raw.listed;
  }
  return { data: d };
}
