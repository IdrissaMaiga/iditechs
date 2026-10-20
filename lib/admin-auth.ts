import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export function isAdmin(req: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY || "";
  const got = req.headers.get("x-admin-key") || "";
  if (!key || got.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(key));
}
