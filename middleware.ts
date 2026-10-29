import { NextResponse, type NextRequest } from "next/server";
import { isCompanyHost } from "@/lib/company";
import { publicUrl } from "@/lib/public-url";

// iditechs.com is served by this project, but only the company page exists on that host:
// "/" renders app/company, "/en" its English version, "/links" and "/go/*" are shared with the
// portfolio, and every other path is a real 404 (rewritten into app/company/[...rest]).
const redirects: Record<string, string> = { "/company": "/", "/company/en": "/en", "/fr": "/" };

export function middleware(req: NextRequest) {
  if (!isCompanyHost(req.headers.get("host"))) return NextResponse.next();
  const { pathname, searchParams } = req.nextUrl;

  if (redirects[pathname]) return NextResponse.redirect(publicUrl(redirects[pathname], req), 308);
  if (pathname === "/" && searchParams.get("lang") === "en") return NextResponse.redirect(publicUrl("/en", req), 308);
  if (pathname === "/links" || pathname.startsWith("/go/")) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (pathname === "/") url.pathname = "/company";
  else if (pathname === "/en") url.pathname = "/company/en";
  else url.pathname = `/company${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|logos/).*)"],
};
