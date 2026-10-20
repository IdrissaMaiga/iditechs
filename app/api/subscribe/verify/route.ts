import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const action = req.nextUrl.searchParams.get("action");

  if (!token) {
    return NextResponse.redirect(publicUrl("/?subscribe=error", req));
  }

  const subscriber = await db.subscriber.findUnique({ where: { token } });
  if (!subscriber) {
    return NextResponse.redirect(publicUrl("/?subscribe=not-found", req));
  }

  if (action === "unsubscribe") {
    await db.subscriber.delete({ where: { token } });
    return NextResponse.redirect(publicUrl("/?subscribe=unsubscribed", req));
  }

  await db.subscriber.update({
    where: { token },
    data: { verified: true },
  });

  return NextResponse.redirect(publicUrl("/?subscribe=confirmed", req));
}
