import { createHmac, timingSafeEqual } from "crypto";

// SmsForwarder signs every webhook like DingTalk: Base64(HmacSHA256(key=secret, "<timestamp>\n<secret>")),
// URL-encoded, with the timestamp in milliseconds. Phone clocks drift, so allow 10 minutes either way.
const MAX_SKEW_MS = 10 * 60 * 1000;

export function expectedSign(timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}\n${secret}`, "utf8").digest("base64");
}

export function verifySign(timestamp: unknown, sign: unknown, secret: string, now = Date.now()): boolean {
  if (typeof timestamp !== "string" && typeof timestamp !== "number") return false;
  if (typeof sign !== "string" || !sign) return false;
  const ts = String(timestamp);
  if (!/^\d{10,16}$/.test(ts) || Math.abs(now - Number(ts)) > MAX_SKEW_MS) return false;
  let given: string;
  try {
    given = decodeURIComponent(sign);
  } catch {
    return false;
  }
  const a = Buffer.from(given);
  const b = Buffer.from(expectedSign(ts, secret));
  return a.length === b.length && timingSafeEqual(a, b);
}
