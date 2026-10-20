// Behind Caddy, req.url points at the internal listener (localhost:3420), so absolute
// redirects are built from the forwarded host. TLS ends at Caddy (which strips
// X-Forwarded-Proto, see the Caddyfile), so public hosts are always https.
export function publicUrl(path: string, req: { headers: Headers }): URL {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "idrissamaiga.iditechs.com").split(",")[0].trim();
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return new URL(path, `${local ? "http" : "https"}://${host}`);
}
