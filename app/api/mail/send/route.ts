import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { adminCreds, listAccounts, sendEmail, uploadBlob, type SendAttachment } from "@/lib/mail/jmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseAddrs(s: string): { name: null; email: string }[] {
  return String(s ?? "")
    .split(/[,;]/).map((x) => x.trim())
    .filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))
    .map((email) => ({ name: null, email }));
}

const MAX_TOTAL = 4.4 * 1024 * 1024; // Vercel serverless request-body limit (~4.5 MB)

export async function POST(req: NextRequest) {
  if (!(await getOwner())) return NextResponse.json({ ok: false }, { status: 401 });
  const form = await req.formData();
  const account = String(form.get("account") ?? "");
  if (!account) return NextResponse.json({ ok: false, error: "account required" }, { status: 400 });
  const toList = parseAddrs(String(form.get("to") ?? ""));
  if (!toList.length) return NextResponse.json({ ok: false, error: "no_recipient" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  let totalSize = 0;
  for (const f of files) totalSize += f.size;
  if (totalSize > MAX_TOTAL) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });

  try {
    const attachments: SendAttachment[] = [];
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const up = await uploadBlob(adminCreds(), account, buf, f.type || "application/octet-stream");
      attachments.push({ blobId: up.blobId, type: up.type, name: f.name || "fichier" });
    }
    const acct = (await listAccounts()).find((a) => a.accountId === account);
    await sendEmail(adminCreds(), account, {
      to: toList,
      cc: parseAddrs(String(form.get("cc") ?? "")),
      subject: String(form.get("subject") ?? "").trim() || "(sans objet)",
      text: String(form.get("text") ?? ""),
      attachments,
      from: acct?.email ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
