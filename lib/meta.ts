/* eslint-disable @typescript-eslint/no-explicit-any */
// Meta Graph API publisher for the IDITECHS Facebook Page and Instagram account.
// Auth: a non-expiring system user token from the IDITECHS business portfolio.
import type { Campaign } from "@prisma/client";
import { smartLink } from "@/lib/campaigns";

const VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;

function cfg() {
  const token = process.env.META_SYSTEM_USER_TOKEN || "";
  const pageId = process.env.META_PAGE_ID || "";
  const igUserId = process.env.META_IG_USER_ID || "";
  if (!token) throw new Error("META_SYSTEM_USER_TOKEN is not set");
  return { token, pageId, igUserId };
}

async function graph(method: "GET" | "POST", path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params);
  const url = method === "GET" ? `${GRAPH}/${path}?${qs}` : `${GRAPH}/${path}`;
  const res = await fetch(url, {
    method,
    headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
    body: method === "POST" ? qs.toString() : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    const e = json?.error;
    throw new Error(`Graph ${path}: ${e?.message || res.status}${e?.code ? ` (code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""})` : ""}`);
  }
  return json;
}

let pageTokenCache: { token: string; at: number } | null = null;
async function pageToken(): Promise<string> {
  const { token, pageId } = cfg();
  if (!pageId) throw new Error("META_PAGE_ID is not set");
  if (pageTokenCache && Date.now() - pageTokenCache.at < 30 * 60_000) return pageTokenCache.token;
  const r = await graph("GET", pageId, { fields: "access_token", access_token: token });
  if (!r.access_token) throw new Error("system user has no access to the Page (assign the Page to the system user)");
  pageTokenCache = { token: r.access_token, at: Date.now() };
  return r.access_token;
}

export async function publishToFacebook(c: Campaign): Promise<string> {
  const { pageId } = cfg();
  const access_token = await pageToken();
  const link = smartLink(c.slug, "facebook");
  if (c.mediaType === "image" && c.mediaUrl) {
    const r = await graph("POST", `${pageId}/photos`, { url: c.mediaUrl, caption: `${c.body}\n\n${link}`, access_token });
    return r.post_id || r.id;
  }
  if (c.mediaType === "video" && c.mediaUrl) {
    const r = await graph("POST", `${pageId}/videos`, { file_url: c.mediaUrl, description: `${c.body}\n\n${link}`, title: c.title, access_token });
    return r.id;
  }
  const r = await graph("POST", `${pageId}/feed`, { message: c.body, link, access_token });
  return r.id;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function publishToInstagram(c: Campaign): Promise<string> {
  const { token, igUserId } = cfg();
  if (!igUserId) throw new Error("META_IG_USER_ID is not set");
  if (!c.mediaUrl || c.mediaType === "none") throw new Error("Instagram needs an image or video (mediaUrl)");
  const caption = `${c.body}\n\nLien dans la bio`;
  const create: Record<string, string> = { caption, access_token: token };
  if (c.mediaType === "video") { create.media_type = "REELS"; create.video_url = c.mediaUrl; }
  else create.image_url = c.mediaUrl;
  const container = await graph("POST", `${igUserId}/media`, create);

  if (c.mediaType === "video") {
    for (let i = 0; i < 40; i++) {
      const s = await graph("GET", container.id, { fields: "status_code,status", access_token: token });
      if (s.status_code === "FINISHED") break;
      if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Instagram video processing ${s.status_code}: ${s.status || ""}`);
      if (i === 39) throw new Error("Instagram video still processing after ~4 minutes; retry publish later");
      await sleep(6000);
    }
  }
  const r = await graph("POST", `${igUserId}/media_publish`, { creation_id: container.id, access_token: token });
  return r.id;
}

export async function getPostInsights(c: Campaign): Promise<{ facebook?: any; instagram?: any }> {
  const out: { facebook?: any; instagram?: any } = {};
  if (c.fbPostId) {
    const access_token = await pageToken();
    out.facebook = await graph("GET", c.fbPostId, {
      fields: "created_time,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)",
      access_token,
    }).catch((e: Error) => ({ error: e.message }));
  }
  if (c.igMediaId) {
    const { token } = cfg();
    out.instagram = await graph("GET", c.igMediaId, { fields: "permalink,like_count,comments_count,timestamp", access_token: token })
      .catch((e: Error) => ({ error: e.message }));
  }
  return out;
}
