import crypto from 'node:crypto';

/**
 * Header format shared by Stripe, Wave and our own app webhooks: "t=<unix seconds>,v1=<hex hmac>[,v1=...]".
 * `message` builds the signed string from the timestamp and the raw body, since each provider joins them differently.
 */
export function verifyTimestampedSignature(
  header: string | undefined,
  secret: string,
  message: (t: string) => string,
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !signatures.length) return false;
  const age = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(message(t)).digest('hex'));
  return signatures.some((s) => {
    const given = Buffer.from(s ?? '');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

export function sign(secret: string, body: string, now = Math.floor(Date.now() / 1000)): string {
  const v1 = crypto.createHmac('sha256', secret).update(`${now}.${body}`).digest('hex');
  return `t=${now},v1=${v1}`;
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
