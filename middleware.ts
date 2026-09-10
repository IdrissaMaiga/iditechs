import { NextResponse, type NextRequest } from "next/server";

const companyHosts = new Set(["iditechs.com", "www.iditechs.com"]);

// iditechs.com is served by this project, but only the company page exists on that host:
// "/" renders app/company, every other page (blog, mail, stats, ...) is sent back to "/".
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!companyHosts.has(host)) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "/company") {
    return NextResponse.rewrite(new URL("/company", req.url));
  }
  return NextResponse.redirect(new URL("/", req.url), 308);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|logos/).*)"],
};
