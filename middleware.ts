import { NextResponse, type NextRequest } from "next/server";
import { isCompanyHost } from "@/lib/company";
import { publicUrl } from "@/lib/public-url";

// iditechs.com is served by this project, but only the company page exists on that host:
// "/" renders app/company, every other page (blog, mail, stats, ...) is sent back to "/".
export function middleware(req: NextRequest) {
  if (!isCompanyHost(req.headers.get("host"))) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "/company") {
    const url = req.nextUrl.clone();
    url.pathname = "/company";
    return NextResponse.rewrite(url);
  }
  // Marketing smart links and the link-in-bio page are shared by both hosts.
  if (pathname === "/links" || pathname.startsWith("/go/")) return NextResponse.next();
  return NextResponse.redirect(publicUrl("/", req), 308);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|logos/).*)"],
};
