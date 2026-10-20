import type { Campaign } from "@prisma/client";

export const GOALS = ["web", "app", "whatsapp", "form"] as const;
export const CHANNELS = ["facebook", "instagram"] as const;
export const MEDIA_TYPES = ["none", "image", "video"] as const;
export const STATUSES = ["draft", "scheduled", "published", "failed"] as const;
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

function withUtm(url: string, c: Campaign, channel: string | null): string {
  const u = new URL(url);
  if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", channel || c.utmSource);
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
const URL_FIELDS = ["webUrl", "iosUrl", "androidUrl", "formUrl", "mediaUrl"] as const;
const STR_FIELDS = ["title", "body", "whatsappText", "utmSource", "utmMedium", "utmCampaign"] as const;

/** Validates create/patch input; returns the clean data or an error message. */
export function parseCampaignInput(raw: Input, partial: boolean): { data: Record<string, unknown> } | { error: string } {
  const d: Record<string, unknown> = {};
  if (raw.slug !== undefined || !partial) {
    if (typeof raw.slug !== "string" || !/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(raw.slug)) return { error: "slug must be lowercase letters, digits and dashes" };
    d.slug = raw.slug;
  }
  if (!partial && (typeof raw.title !== "string" || !raw.title.trim())) return { error: "title required" };
  if (!partial && typeof raw.body !== "string") return { error: "body required" };
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
  if (raw.mediaType !== undefined) {
    if (!MEDIA_TYPES.includes(raw.mediaType as never)) return { error: `mediaType must be one of ${MEDIA_TYPES.join(", ")}` };
    d.mediaType = raw.mediaType;
  }
  if (raw.status !== undefined) {
    if (!STATUSES.includes(raw.status as never)) return { error: `status must be one of ${STATUSES.join(", ")}` };
    d.status = raw.status;
  }
  if (raw.channels !== undefined) {
    if (!Array.isArray(raw.channels) || raw.channels.some((c) => !CHANNELS.includes(c as never))) return { error: `channels must be a subset of ${CHANNELS.join(", ")}` };
    d.channels = Array.from(new Set(raw.channels as string[]));
  }
  if (raw.scheduledAt !== undefined) {
    if (raw.scheduledAt === null) d.scheduledAt = null;
    else {
      const t = new Date(String(raw.scheduledAt));
      if (isNaN(t.getTime())) return { error: "scheduledAt must be an ISO date" };
      d.scheduledAt = t;
    }
  }
  return { data: d };
}
