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

## Tracked links (campaigns)
A campaign is one tracked link, not a social post: posts are made by hand on any of our socials (no Meta/Facebook/Instagram API, removed 2026-10-30), and each copy carries `https://iditechs.com/go/<slug>?c=<platform>`. `app/go/[slug]/route.ts` logs the click (device, source, referer, country, hashed IP; link-preview bots are redirected but not logged) in `campaign_clicks` and 302s to the goal (web / app store by device / WhatsApp / form). Source = the `?c=` tag, else the in-app browser in the user agent, else the referer host (`detectSource` in `lib/campaigns.ts`). Admin API: `/api/admin/campaigns` (CRUD, returns `links` per platform) and `/api/admin/campaigns/<id>/stats`. Country comes from the local DB-IP Country Lite file `/opt/iditechs-web/geo/country.mmdb` (mounted at `/geo`, `lib/geo.ts`, refreshed by `/etc/cron.monthly/iditechs-geoip`). `listed: true` shows it on `/links`, which passes its own `?c=` on (put `/links?c=tiktok` etc. in each bio).

## IDITECHS Pay (payment gateway)
The payment gateway of **IDITECHS's own applications** (Djarabi `app_81EComJP`, Yorognini `app_2T6Uof8v`); each of our apps chooses to use it, then talks to IDITECHS Pay, which talks to the providers. It only records money collected through itself: sales made through other channels (Google Play, App Store, WhatsApp) are counted by each application, never in IDITECHS Pay. For our own applications only: collecting money for another company's app would make IDITECHS a payment service provider (BCEAO licence). Code in `lib/pay/` (one file per provider in `lib/pay/connectors/`, listed in `connectors/index.ts`; adding Moov, PayDunya etc. needs no app change), routes under `app/api/pay/`, tables `pay_apps`, `pay_payments`, `pay_events`, `pay_deliveries` (`prisma/migrations/20261102000000_pay`, applied on VPS2 2026-11-02).
- **Screen**: https://idrissamaiga.iditechs.com/pay (owner login, like `/mail` and `/whatsapp`; `app/(portfolio)/pay`). Tabs: Overview (money received today/month/all time, per app, per status; on/off switch per provider), Payments (filters, detail with provider history and app notifications), Apps (create, block, edit webhook, replace key or secret; secrets shown once), Notifications (undelivered, retry now). All `/api/admin/pay/*` routes accept the owner session or `x-admin-key`: `payments` (list + totals), `payments/<id>`, `deliveries` (GET undelivered, POST `{id}` retry), `apps/<id>` (PATCH `{active, webhook_url}`, POST `{rotate: api_key|webhook_secret}`).
- **Owner switch per provider**: `GET /api/admin/pay/providers` (each provider: `configured` = keys set, `switched_on`, `available`), `PUT` `{"provider":"wave","on":false}`. Off = no app can start a new payment with it; payments already started still finish (webhooks/refresh keep working). Stored in `app_settings` key `pay.providers.off`; until that row exists, Orange Money and Wave are off (`lib/pay/switches.ts`).
- **App credentials**: `POST /api/admin/pay/apps` `{name, webhook_url}` (admin key) returns `api_key` + `webhook_secret` once; `GET` lists apps. Apps call with `Authorization: Bearer ik_live_...` and only see their own payments.
- **App API** (`/api/pay/v1`): `GET providers` (connectors whose keys are set), `POST payments` `{provider, amount, currency=XOF, reference, description, return_url, cancel_url?, customer?, metadata?}` -> `checkout_url`; `GET payments/:id`, `GET payments?reference=`, `POST payments/:id/refresh` (asks the provider). Same `reference` again returns the same payment (no double charge). `amount` is in the smallest unit (FCFA for XOF).
- **Provider callbacks**: `/api/pay/webhooks/wave`, `/api/pay/webhooks/stripe` (register in their dashboards), Orange per payment at `/api/pay/webhooks/orange_money/<id>`. Wave/Stripe are signature-checked (5-minute window) and a success must match the stored amount and currency; Orange's unsigned notification must carry that payment's `notif_token` and is re-checked with `transactionstatus`. Wave's `checkout.session.payment_failed` is only logged (the customer can retry in the same session).
- **Refunds and card disputes** (2026-11-02): Stripe `charge.refunded` and `charge.dispute.*` are matched to our payment by Stripe's `payment_intent` (stored in `provider_data` when the checkout completes; else the PaymentIntent's `iditechs_pay` tag is checked) and recorded on the payment (`amount_refunded`, `dispute_status`, `dispute_amount`, migration `20261102010000_pay_refunds`). The app gets `payment.refunded`, `payment.disputed` or `payment.dispute_closed` with `amount_returned` = refunds + the dispute while open or lost (not if won), capped at the amount; it takes back that share of what it delivered and gives it back if a dispute is won. `/pay` totals are net of that. Wave and Orange refunds are not followed yet.
- **Status rules**: `succeeded` is final. `failed`/`expired`/`cancelled` can still become `succeeded` if the provider later reports the money (never lose a real payment), so apps must treat `payment.succeeded` as final even after a `payment.failed`/`expired`. `refresh` works on any payment not yet succeeded. Provider calls time out after 15 s and answer 502; a provider error frees the `reference` for a retry.
- **App notifications**: `payment.succeeded|failed|expired|cancelled` POSTed to the app's `webhook_url` with `Iditechs-Signature: t=<unix>,v1=HMAC-SHA256(webhook_secret, "<t>.<body>")`, sent at once; failures are retried by `POST /api/pay/deliveries` (admin key; needs a cron every minute on VPS2, 8 attempts over about an hour).
- **Env** (`/opt/iditechs-web/.env`): `PAY_PUBLIC_URL` (default `https://iditechs.com/api/pay`), `ORANGE_CLIENT_ID`, `ORANGE_CLIENT_SECRET`, `ORANGE_MERCHANT_KEY`, `ORANGE_COUNTRY` (`dev` = sandbox, currency OUV; production code comes with the Orange contract), `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. A provider is off until its keys are set.
- **Stripe (LIVE since 2026-11-02)**: tested on the Iditechs sandbox (acct_1UVZuNF4gcoIeJIa) first (XOF checkout paid with the 4242 card, webhook accepted, app notified). Live: own webhook `we_1UXLMUF3egNLsXMOBArzCxd1` -> `https://iditechs.com/api/pay/webhooks/stripe` (4 checkout.session events, made with `istripe.py webhook-add`); `STRIPE_SECRET_KEY` is the same key as AgentiCareer (owner's choice; it is a full `sk_live_` key, not restricted, so rotating it means updating both `/opt/autoapplier/.env` and `/opt/iditechs-web/.env`), `STRIPE_WEBHOOK_SECRET` and `PAY_PUBLIC_URL` in `/opt/iditechs-web/.env` (backup `.env.bak-before-pay-*`). Checkout passes `managed_payments[enabled]=false` (IDITECHS is the merchant). Retry cron: `/etc/cron.d/iditechs-pay` runs `/opt/iditechs-web/pay-deliveries.sh` every minute. Tables applied on VPS2 2026-11-02.
- **Shared Stripe account**: the live IDITECHS account (acct_1UW0hRF3egNLsXMO) is also used directly by other applications (today AgentiCareer, own webhook `agenticareer.com/api/webhooks/stripe`, and the istripe back office; any future one the same way). Stripe sends every event to every endpoint. The ONLY way to know a payment went through IDITECHS Pay is the tag: every object it creates carries metadata `iditechs_pay=1`, `payment_id`, `pay_app_id`; anything without the tag is ignored and never stored, whichever application it belongs to (refunds/disputes, which carry no tag themselves, are matched by the payment_intent of one of our tagged checkouts, or by the PaymentIntent's own tag). Other applications must likewise only act on their own tagged objects. Owner's decision 2026-11-02: one Stripe account, separated by tags (no separate account for the gateway). Keep the tag check; never remove it. Checked 2026-11-02, point by point: the gateway only calls `POST /v1/checkout/sessions` and `GET /v1/checkout/sessions/:id` (never products, prices, customers, refunds, settings or other webhooks); its checkouts create no Stripe customer and no visible product (price_data is inline); its idempotency keys are prefixed `iditechs-pay-`; it has its own webhook endpoint (to add) next to AgentiCareer's `we_1UW2hdF3egNLsXMOxppkc48r`, which it never touches; on AgentiCareer's side a gateway checkout is skipped (no `type=credits`), and refunds/disputes on gateway charges match no AgentiCareer user (no customer, no invoice, no `type=credits`). To protect the shared Stripe rate limit: max 30 payments per app per minute (429), and `refresh` calls the provider at most once per payment every 10 s.
- **Status (2026-11-02)**: logic reviewed and tested end to end locally against a mock Wave (provider down, no link, retry in session, wrong amount, late success after expiry, final success, bad/old signatures, signed app notifications); no provider has been called for real yet. Orange Money awaits KYC (asked 2026-10-30), Wave Business awaits API access, Stripe is live.

## Company site (iditechs.com)
This project also serves the IDITECHS company site. `middleware.ts` host-guards `iditechs.com` / `www.iditechs.com`: `/` renders the company page (French) and `/en` its English version; `/company`, `/company/en`, `/fr` and `?lang=en` 308 to the canonical URLs; `/privacy`, `/terms` and `/en/privacy`, `/en/terms` are the company legal pages (`app/company/legal-page.tsx`, text in `legal-copy.ts`); every other path is rewritten into `app/company/[...rest]` and returns a real 404 (`app/company/not-found.tsx`). Page copy for both languages lives in `app/company/copy.ts`. The matcher excludes `_next/`, `api/`, `favicon.ico`, `robots.txt`, `sitemap.xml` and `logos/`. `www` 308s to the apex. `idrissamaiga.iditechs.com` is unaffected: blog, mail and stats exist only there.
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
- `/whatsapp` is a screen on `wa.iditechs.com`, a domain on the `idrissamaiga-wa` container on projexel-main (nginx site `wa-iditechs.conf`; `wa.projexel.eu` is the same service). It lists only instances created from it (now `inst_e715928d`, `iditechs-wa1`, for Yorognini and Djarabi). The same service holds the owner's personal instance `inst_5c81b3da` (`idrissa-personal`), not listed here: ask the owner before using it. `/api/whatsapp` is owner-only
