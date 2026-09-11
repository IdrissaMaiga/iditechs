# Portfolio Platform — Idrissa Maiga

## Project
Next.js 14 portfolio with 3D (Three.js/R3F), AI chatbot (Gemini), R2-backed blog, LinkedIn integration, Cloudflare R2 storage, and MCP server.

## Key Info
- **Live**: https://idrissamaiga.iditechs.com (portfolio) · https://iditechs.com and https://www.iditechs.com (IDITECHS company page, same Vercel project, served from `app/company` by the host guard in `middleware.ts`)
- **Email**: idrissa.maiga@iditechs.com
- **GitHub**: IdrissaMaiga/portfolio
- **Vercel team**: idrissamaigas-projects
- **R2 bucket**: portfolio-uploads
- **R2 public**: https://pub-5dbae7ae21f345449868f710152b690e.r2.dev

## Company site (iditechs.com)
This project also serves the IDITECHS company site. `middleware.ts` host-guards `iditechs.com` / `www.iditechs.com`: `/` and `/company` render the company page, every other path 308-redirects to `/`. The matcher excludes `_next/`, `api/`, `favicon.ico`, `robots.txt`, `sitemap.xml` and `logos/`. `www` 308s to the apex. `idrissamaiga.iditechs.com` is unaffected: blog, mail and stats exist only there.
- **Page**: `app/company/page.tsx` (French landing page, OG metadata + JSON-LD)
- **Identity**: `lib/company.ts` (brand, RCCM, NIF, address, phones, `isCompanyHost()`, `legalLine()` — the portfolio footer reads it too)
- **Chrome separation**: every portfolio page lives in the `app/(portfolio)` route group, whose `layout.tsx` owns the navbar, chat button, `loading.tsx` and Person JSON-LD. `app/company` sits outside that group, so it cannot inherit them. Do not move that chrome back into `app/layout.tsx` and do not add a root-level `loading.tsx`/`error.tsx`
- **OG image**: `company/og.png` on R2
- **SEO**: `app/robots.ts` and `app/sitemap.ts` branch on `isCompanyHost()`, so each host serves its own robots and sitemap. Both are dynamic (`ƒ`) as a result — that is intentional, do not make them static again
- **DNS** (Cloudflare, DNS-only, never proxied): `A iditechs.com -> 76.76.21.21`, `CNAME www -> cname.vercel-dns.com`. Leave MX/TXT alone or `mail.iditechs.com` (72.62.150.35) breaks. DNS calls need `CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY`; the scoped `CLOUDFLARE_API_TOKEN` is R2-only
- **A rewrite keeps the pathname**, so `usePathname()` returns `/` on the company host and cannot be used to hide chrome there. That is why the split is structural (route group) rather than a runtime check
- Page metadata merges down the layout chain, so anything in `app/layout.tsx` reaches iditechs.com. Portfolio metadata lives in `app/(portfolio)/layout.tsx`; the root keeps only `metadataBase` and a neutral title
- Host routing lives in `middleware.ts`, not `next.config.mjs`. This repo is the only copy of the site; there is no standalone static version
- Hosting decided 2026-09-10: this Vercel project. Vercel Pro or the VPS (same repo code) are fallbacks only

## Blog Architecture
Blog posts are stored entirely on Cloudflare R2. No local MDX files.
- **Index**: `blog/index.json` on R2 (post metadata array)
- **Content**: `blog/posts/<slug>.json` on R2 (post content)
- **Images**: `blog/<slug>.jpg` or `.png` on R2 (extension follows what Gemini returns; use the URL from the upload response)
- All CRUD via `/api/admin/blog` (reads/writes R2), or directly against R2 with the Cloudflare API
- Blog pages are `force-dynamic` (fetch from R2 on each request)
- `index.json` must stay a plain JSON array; content is MDX (no raw `{ }` or `<tag` in prose)

## Common Tasks

Use the `portfolio` skill (`/portfolio`, files in `C:\Users\user\.claude\skills\portfolio\`). Its `scripts/portfolio.py` publishes, generates images, shares to LinkedIn, edits and checks status without needing the production admin key.

### Publish a blog post
1. `python "C:/Users/user/.claude/skills/portfolio/scripts/portfolio.py" lint post.md`
2. `... image "<prompt>" <slug>` (Gemini generateContent; Imagen `:predict` is retired)
3. `... publish --slug <slug> --title ... --description ... --tags a,b --image <url> --content post.md` (writes R2 directly, no subscriber email)
4. `... share --slug <slug> --text linkedin.md --mark`
5. No deploy needed for new posts (R2-backed, dynamic rendering)

Known: the production `ADMIN_API_KEY` differs from `.env.local` (all `/api/admin/*` calls to production return 401 until resynced), and `app/api/admin/upload/route.ts` carries an uncommitted fix for the retired Imagen model. See the skill for the fixes.

Mail server is `mail.iditechs.com` everywhere (code, `.env.local`, Vercel `SMTP_HOST`); the old `mail.agenticareer.com` name no longer exists. IMAP/SMTP clients must log in with the mailbox name (`idrissa`, `admin`), never the full address: Stalwart rejects `name@iditechs.com`. `/mail` → "Configurer un appareil" shows the settings and password for the selected mailbox.

### Deploy (code changes only)
```bash
git add -A && git commit -m "msg" && git push origin main
VERCEL_TOKEN=$(grep 'VERCEL_TOKEN=' .env.local | cut -d'=' -f2 | tr -d '\r\n ')
npx vercel deploy --prod --token "$VERCEL_TOKEN" --scope idrissamaigas-projects --yes --no-wait
```
A local `next build` needs `NEXTAUTH_URL` exported in the shell: `.env.production.local` (pulled from Vercel) sets it to `""` and build prefers it over `.env.local`.

### Admin API auth
All admin routes require header: `x-admin-key: <ADMIN_API_KEY from .env.local>`

## Rules
- Never expose maigadrisking@gmail.com in user-facing code. Use idrissa.maiga@iditechs.com
- Dark theme only. No light mode toggle
- Blog posts should sound natural, not AI-generated. No em dashes
- All nav links use `/#section` format except Blog which is `/blog`
- Section IDs: home, story, projects, skills, insights, connect
- Git email must be maigadrisking@gmail.com (not the noreply one) or Vercel blocks deploys
- Blog images go to R2 only. Never store in public/logos/
- No local MDX files. All blog content lives on R2
- This repo also serves iditechs.com: `middleware.ts` + `lib/company.ts` route that host to `app/company`. Never delete `middleware.ts` or narrow its matcher/`companyHosts` (takes iditechs.com down or leaks the portfolio onto it)
- One deploy ships the portfolio and iditechs.com. Check `/company` after deploying code
