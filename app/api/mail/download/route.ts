import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/mail/owner";
import { adminCreds, getBlob } from "@/lib/mail/jmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await getOwner())) return NextResponse.json({ ok: false }, { status: 401 });
  const account = req.nextUrl.searchParams.get("account") ?? "";
  const blobId = req.nextUrl.searchParams.get("blobId") ?? "";
  const name = req.nextUrl.searchParams.get("name") ?? "file";
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  if (!account || !blobId) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  const blob = await getBlob(adminCreds(), account, blobId, name);
  if (!blob) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return new NextResponse(new Uint8Array(blob.bytes), {
    headers: {
      "Content-Type": blob.type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name.replace(/["\r\n]/g, "")}"`,
      "Content-Length": String(blob.bytes.length),
    },
  });
}
