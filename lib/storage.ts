// Object storage on the self-hosted Garage S3 endpoint (bucket portfolio-uploads).
// Public reads go through MEDIA_PUBLIC_URL (https://media.iditechs.com); writes, deletes
// and server-side reads use SigV4-signed requests to S3_ENDPOINT.
import crypto from "crypto";

const ENDPOINT = (process.env.S3_ENDPOINT || "http://127.0.0.1:3910").replace(/\/$/, "");
const BUCKET = process.env.S3_BUCKET || "portfolio-uploads";
const REGION = process.env.S3_REGION || "us-east-1";
const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || "";
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
export const MEDIA_PUBLIC_URL = (process.env.MEDIA_PUBLIC_URL || "https://media.iditechs.com").replace(/\/$/, "");

const sha256 = (data: Buffer | string) => crypto.createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string) => crypto.createHmac("sha256", key).update(data).digest();
const encodeKey = (key: string) =>
  key.split("/").map((s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())).join("/");

async function signedFetch(method: "GET" | "PUT" | "DELETE", key: string, body?: Buffer, contentType?: string) {
  if (!ACCESS_KEY || !SECRET_KEY) throw new Error("storage_not_configured");
  const url = new URL(`${ENDPOINT}/${BUCKET}/${encodeKey(key)}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? "");
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  const names = Object.keys(headers).sort();
  const canonical = [
    method,
    url.pathname,
    "",
    names.map((n) => `${n}:${headers[n]}\n`).join(""),
    names.join(";"),
    payloadHash,
  ].join("\n");
  const scope = `${day}/${REGION}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const kSign = hmac(hmac(hmac(hmac("AWS4" + SECRET_KEY, day), REGION), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", kSign).update(toSign).digest("hex");
  const sent = { ...headers };
  delete sent.host;
  return fetch(url, {
    method,
    headers: {
      ...sent,
      Authorization: `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`,
    },
    body: body ? new Uint8Array(body) : undefined,
    cache: "no-store",
  });
}

export function publicUrl(key: string): string {
  return `${MEDIA_PUBLIC_URL}/${key}`;
}

export async function putObject(key: string, body: Buffer | Uint8Array | string, contentType = "image/png"): Promise<string> {
  const buf = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
  const res = await signedFetch("PUT", key, buf, contentType);
  if (!res.ok) throw new Error(`storage upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return publicUrl(key);
}

export async function getObjectText(key: string): Promise<string | null> {
  const res = await signedFetch("GET", key);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`storage read failed (${res.status})`);
  return res.text();
}

export async function deleteObject(key: string): Promise<void> {
  const res = await signedFetch("DELETE", key);
  if (!res.ok && res.status !== 404) throw new Error(`storage delete failed (${res.status})`);
}
