# Portfolio Platform — Idrissa Maiga

## Project
Next.js 14 portfolio with 3D (Three.js/R3F), AI chatbot (Gemini), R2-backed blog, LinkedIn integration, Cloudflare R2 storage, and MCP server.

## Key Info
- **Live**: https://idrissamaiga.iditechs.com
- **Email**: idrissa.maiga@iditechs.com
- **GitHub**: IdrissaMaiga/portfolio
- **Vercel team**: idrissamaigas-projects
- **R2 bucket**: portfolio-uploads
- **R2 public**: https://pub-5dbae7ae21f345449868f710152b690e.r2.dev

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

Known: the production `ADMIN_API_KEY` differs from `.env.local` (all `/api/admin/*` calls to production return 401 until resynced), `SMTP_HOST` must be changed to `mail.iditechs.com` (old host no longer resolves), and `app/api/admin/upload/route.ts` carries an uncommitted fix for the retired Imagen model. See the skill for the fixes.

### Deploy (code changes only)
```bash
git add -A && git commit -m "msg" && git push origin main
VERCEL_TOKEN=$(grep 'VERCEL_TOKEN=' .env.local | cut -d'=' -f2 | tr -d '\r\n ')
npx vercel deploy --prod --token "$VERCEL_TOKEN" --scope idrissamaigas-projects --yes --no-wait
```

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
