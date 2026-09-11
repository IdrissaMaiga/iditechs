import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { adminCreds, listEmails } from "@/lib/mail/jmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await getOwner())) return NextResponse.json({ ok: false }, { status: 401 });
  const account = req.nextUrl.searchParams.get("account") ?? "";
  const mailboxId = req.nextUrl.searchParams.get("mailbox") ?? "";
  const position = parseInt(req.nextUrl.searchParams.get("position") ?? "0", 10) || 0;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  if (!account || !mailboxId) return NextResponse.json({ ok: false, error: "account and mailbox required" }, { status: 400 });
  try {
    const { emails, total } = await listEmails(adminCreds(), account, mailboxId, { limit: 40, position, q });
    return NextResponse.json({ ok: true, emails, total, position });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
