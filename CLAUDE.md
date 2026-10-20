# Portfolio Platform — Idrissa Maiga

## Project
Next.js 14 portfolio with 3D (Three.js/R3F), AI chatbot (Gemini), S3-backed blog (self-hosted Garage), LinkedIn integration, marketing campaigns with smart links, and MCP server. Hosted on our own VPS since 2026-10-20 (Docker + Caddy), no longer on Vercel.

## Key Info
- **Live**: https://idrissamaiga.iditechs.com (portfolio) · https://iditechs.com and https://www.iditechs.com (IDITECHS company page, same app, served from `app/company` by the host guard in `middleware.ts`)
- **Email**: idrissa.maiga@iditechs.com
- **GitHub**: IdrissaMaiga/iditechs
- **Server**: VPS2 `projexel-vps2` (76.13.13.52): container `iditechs_web` (127.0.0.1:3420, `/opt/iditechs-web`, env in `/opt/iditechs-web/.env`, root-only), Caddy `/etc/caddy/Caddyfile`
- **Database**: PostgreSQL 17 container `iditechs_postgres` on VPS2 (127.0.0.1:5439, db `iditechs`, `/opt/iditechs-db`); nightly dump 03:17 to `/opt/iditechs-db/backups` (14 days). Neon is the old database, frozen since 2026-10-20
- **Storage**: Garage S3 bucket `portfolio-uploads` on VPS2. Public read: https://media.iditechs.com (read-only). Signed writes: https://s3.iditechs.com from outside, `http://127.0.0.1:3910` from the app. Code: `lib/storage.ts`. The old R2 bucket (`pub-5dbae7ae21f345449868f710152b690e.r2.dev`) is a frozen rollback copy
- **Vercel**: no longer used. Project, domains and token deleted on 2026-10-20

## Company site (iditechs.com)
This project also serves the IDITECHS company site. `middleware.ts` host-guards `iditechs.com` / `www.iditechs.com`: `/` and `/company` render the company page, every other path 308-redirects to `/`. The matcher excludes `_next/`, `api/`, `favicon.ico`, `robots.txt`, `sitemap.xml` and `logos/`. `www` 308s to the apex. `idrissamaiga.iditechs.com` is unaffected: blog, mail and stats exist only there.
- **Page**: `app/company/page.tsx` (French landing page, OG metadata + JSON-LD)
- **Identity**: `lib/company.ts` (brand, RCCM, NIF, address, phones, `isCompanyHost()`, `legalLine()` — the portfolio footer reads it too)
- **Chrome separation**: every portfolio page lives in the `app/(portfolio)` route group, whose `layout.tsx` owns the navbar, chat button, `loading.tsx` and Person JSON-LD. `app/company` sits outside that group, so it cannot inherit them. Do not move that chrome back into `app/layout.tsx` and do not add a root-level `loading.tsx`/`error.tsx`
- **OG image**: `company/og.png` on media.iditechs.com
- **SEO**: `app/robots.ts` and `app/sitemap.ts` branch on `isCompanyHost()`, so each host serves its own robots and sitemap. Both are dynamic (`ƒ`) as a result — that is intentional, do not make them static again
- **DNS** (Cloudflare, DNS-only, never proxied): `A iditechs.com`, `A www.iditechs.com`, `A idrissamaiga.iditechs.com`, `A media`, `A s3` all -> 76.13.13.52. Caddy 308s `www` to the apex. Leave MX/TXT alone or `mail.iditechs.com` breaks (Stalwart also runs on VPS2, 76.13.13.52). DNS calls need `CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY`; the scoped `CLOUDFLARE_API_TOKEN` is R2-only
- **A rewrite keeps the pathname**, so `usePathname()` returns `/` on the company host and cannot be used to hide chrome there. That is why the split is structural (route group) rather than a runtime check
- Page metadata merges down the layout chain, so anything in `app/layout.tsx` reaches iditechs.com. Portfolio metadata lives in `app/(portfolio)/layout.tsx`; the root keeps only `metadataBase` and a neutral title
- Host routing lives in `middleware.ts`, not `next.config.mjs`. This repo is the only copy of the site; there is no standalone static version
- Hosting: VPS2 since 2026-10-20 (was Vercel). Behind Caddy, `req.url` is `localhost:3420`: build absolute redirects with `publicUrl()` from `lib/public-url.ts`, never `new URL(path, req.url)`, and keep `header_up -X-Forwarded-Proto` in the Caddy block (Next standalone turns the company-page rewrite into a failing proxy when it sees https)

## Blog Architecture
Blog posts are stored entirely in the Garage bucket `portfolio-uploads`. No local MDX files.
- **Index**: `blog/index.json` (post metadata array)
- **Content**: `blog/posts/<slug>.json` (post content)
- **Images**: `blog/<slug>.jpg` or `.png`, served from https://media.iditechs.com (extension follows what Gemini returns; use the URL from the upload response)
- All CRUD via `/api/admin/blog`, or directly with signed S3 requests to s3.iditechs.com (`S3_*` keys in `.env.local`; the portfolio CLI does this)
- Blog pages are `force-dynamic` (read the bucket on each request)
- `index.json` must stay a plain JSON array; content is MDX (no raw `{ }` or `<tag` in prose)

## Common Tasks

Use the `portfolio` skill (`/portfolio`, files in `C:\Users\user\.claude\skills\portfolio\`). Its `scripts/portfolio.py` publishes, generates images, shares to LinkedIn, edits and checks status without needing the production admin key.

### Publish a blog post
1. `python "C:/Users/user/.claude/skills/portfolio/scripts/portfolio.py" lint post.md`
2. `... image "<prompt>" <slug>` (Gemini generateContent; Imagen `:predict` is retired)
3. `... publish --slug <slug> --title ... --description ... --tags a,b --image <url> --content post.md` (writes the bucket directly, no subscriber email)
4. `... share --slug <slug> --text linkedin.md --mark`
5. No deploy needed for new posts (bucket-backed, dynamic rendering)

Production uses the same `ADMIN_API_KEY` as `.env.local` since the move to VPS2.

Mail server is `mail.iditechs.com` everywhere (code, `.env.local`, server `SMTP_HOST`), Stalwart on VPS2; the old `mail.agenticareer.com` name no longer exists. IMAP/SMTP clients must log in with the mailbox name (`idrissa`, `admin`), never the full address: Stalwart rejects `name@iditechs.com`. `/mail` → "Configurer un appareil" shows the settings and password for the selected mailbox.

### Deploy (code changes only)
```bash
git add <files> && git commit -m "msg" && git push origin main
bash scripts/deploy-vps.sh   # uploads the tree, rebuilds the Docker image on VPS2 (~3 min), restarts, smoke-tests
```
The script prints a one-line rollback to the previous image (`iditechs-web:previous`). Env changes: edit `/opt/iditechs-web/.env` on VPS2 (root, chmod 600), then rerun the script or restart the container. A local `next build` needs `NEXTAUTH_URL` exported in the shell. Schema changes: write the SQL in `prisma/migrations/` and apply it with `docker exec -i iditechs_postgres psql`; there is no migration history table, so never run `prisma migrate deploy`.

### Rollback
There is no Vercel fallback any more (deleted 2026-10-20). Code rollback: the previous Docker image (`iditechs-web:previous`, see the deploy script). Data rollback: the nightly dumps in `/opt/iditechs-db/backups`. Neon and R2 still hold a frozen copy as of 2026-10-20.

### Admin API auth
All admin routes require header: `x-admin-key: <ADMIN_API_KEY from .env.local>`

## Rules
- Never expose maigadrisking@gmail.com in user-facing code. Use idrissa.maiga@iditechs.com
- Dark theme only. No light mode toggle
- Blog posts should sound natural, not AI-generated. No em dashes
- All nav links use `/#section` format except Blog which is `/blog`
- Section IDs: home, story, projects, skills, insights, connect
- Git email must be maigadrisking@gmail.com (not the noreply one)
- Blog images go to the bucket (media.iditechs.com) only. Never store in public/logos/
- No local MDX files. All blog content lives in the bucket
- This repo also serves iditechs.com: `middleware.ts` + `lib/company.ts` route that host to `app/company`. Never delete `middleware.ts` or narrow its matcher/`companyHosts` (takes iditechs.com down or leaks the portfolio onto it)
- One deploy ships the portfolio and iditechs.com. Check `/company` after deploying code
