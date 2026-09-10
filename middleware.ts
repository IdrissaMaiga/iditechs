import { NextResponse, type NextRequest } from "next/server";
import { isCompanyHost } from "@/lib/company";

// iditechs.com is served by this project, but only the company page exists on that host:
// "/" renders app/company, every other page (blog, mail, stats, ...) is sent back to "/".
export function middleware(req: NextRequest) {
  if (!isCompanyHost(req.headers.get("host"))) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "/company") {
    return NextResponse.rewrite(new URL("/company", req.url));
  }
  return NextResponse.redirect(new URL("/", req.url), 308);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|logos/).*)"],
};
