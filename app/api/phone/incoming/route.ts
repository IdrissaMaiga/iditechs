import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { verifySign } from "@/lib/phone/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["sms", "call", "app"]);
const MAX_BODY = 64 * 1024;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : typeof v === "number" ? String(v) : "");

// Webhook for SmsForwarder (Android). One sender per kind: POST /api/phone/incoming?kind=sms|call|app
// with the JSON template shown on /phone-notification. Requests must carry a valid [timestamp]/[sign].
export async function POST(req: NextRequest) {
  const secret = process.env.PHONE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });

  const kind = req.nextUrl.searchParams.get("kind") ?? "sms";
  if (!KINDS.has(kind)) return NextResponse.json({ ok: false, error: "bad kind" }, { status: 400 });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: "too large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!verifySign(body.timestamp, body.sign, secret)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  const from = str(body.from, 200).trim() || "unknown";
  const content = str(body.content, 8000);
  const parsed = Date.parse(str(body.receive_time, 40).replace(" ", "T"));
  const receivedAt = Number.isFinite(parsed) ? new Date(parsed) : new Date(Number(body.timestamp));
  // SmsForwarder retries on failure: the same message must not appear twice
  const dedupKey = createHash("sha256").update(`${kind}|${from}|${content}|${receivedAt.toISOString()}`).digest("hex");

  await db.phoneEvent.upsert({
    where: { dedupKey },
    update: {},
    create: {
      kind,
      from,
      content,
      simInfo: str(body.card_slot, 200) || null,
      device: str(body.device_mark, 200) || null,
      receivedAt,
      dedupKey,
    },
  });
  return NextResponse.json({ ok: true });
}
