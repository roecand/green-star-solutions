# Deployment (Railway)

The scanner is a Next.js **server** app (API routes + a SQLite database), so it
runs separately from the Netlify-hosted Green Star marketing site. This never
touches the Netlify site or the main domain.

Database stays **local SQLite on a persistent Railway volume** — no Turso, no
Postgres. (The driver is `@libsql/client` in file mode, i.e. an on-disk SQLite
file. If `TURSO_DATABASE_URL` is unset it uses the file at `DATABASE_PATH`.)

## Architecture on Railway

| Piece | Value |
|---|---|
| Service root directory | `leak-scanner` |
| Builder | Nixpacks (`railway.json`) |
| Build command | `npm ci && npm run build` |
| Start command | `npx next start -H 0.0.0.0 -p ${PORT:-3000}` |
| Health check | `GET /` |
| Database file | `DATABASE_PATH` on a mounted volume, e.g. `/data/greenstar.db` |
| Volume mount | `/data` |
| Migrations | auto-applied on boot (`dbReady()` in `lib/db/index.ts`) |

Because migrations run on first boot, the volume starts empty and the schema is
created automatically on the first request. No build-time DB access happens (the
landing page is static-safe and the only DB-reading public page, `/demo`, is
`force-dynamic`), so the build succeeds before the volume is mounted.

## One-time setup

### 1. Create the project + service
- Railway dashboard → **New Project → Deploy from GitHub repo** →
  `roecand/green-star-solutions`.
- In the service **Settings → Source**, set **Root Directory** to `leak-scanner`.
  Railway will pick up `leak-scanner/railway.json`.

### 2. Add a persistent volume
- Service → **Settings → Volumes → New Volume**.
- Mount path: `/data`.

### 3. Set environment variables
Service → **Variables**:

Required:
- `DATABASE_PATH=/data/greenstar.db`
- `NEXT_PUBLIC_APP_URL=https://<your-service>.up.railway.app`
  (update to `https://scan.green-starsolutions.com` after DNS, then redeploy)
- `ADMIN_EMAIL=<your admin email>` — sign up with this email to get the admin role

Recommended (all optional — app runs without them in mock/fallback mode):
- `NEXT_PUBLIC_BOOKING_URL=<your scheduler link>` — the report's "Get My
  Personalized Fix Plan" button opens this. Without it the button still captures
  the lead and shows a "we'll reach out" confirmation.
- `RESEND_API_KEY` + `EMAIL_FROM="Green Star Scanner <scanner@green-starsolutions.com>"`
  + `ADMIN_NOTIFICATION_EMAIL=<inbox Robert checks>` — real report + lead emails.
- `ANTHROPIC_API_KEY` (+ `AI_MODEL=claude-sonnet-5`) — AI-written report copy
  (deterministic fallback copy otherwise).
- `LEAD_WEBHOOK_URL` — optional GoHighLevel-style webhook fired per completed scan.

Do NOT set: `NEXT_PUBLIC_BILLING_ENABLED` (leave unset — billing stays hidden),
`SCANNER_ALLOW_PRIVATE` (test-only; must never be set in production),
`TURSO_*` (using the file + volume).

> `NEXT_PUBLIC_*` vars are inlined at build time — after changing them, trigger
> a redeploy so the new value is baked in.

### 4. First admin login (no default credentials in production)
The seed refuses to create the default-password admin in production. Instead,
after deploy, go to `https://<service>/signup` and register with the exact
`ADMIN_EMAIL` — that account is auto-promoted to admin. Then use `/admin`.

Demo reports (`/demo`) are optional; to populate them, run the seed once against
the volume via a Railway one-off shell: `npm run db:seed`.

### 5. Verify persistence
- Load `/`, run a scan, note a lead in `/admin`.
- Railway → **Deployments → Redeploy** (or restart).
- Confirm the lead is still there after the restart (data lives on `/data`).

### 6. Custom domain
- Service → **Settings → Networking → Custom Domain** → add
  `scan.green-starsolutions.com`.
- Railway shows a **CNAME target**. Add that CNAME at your DNS host (a `scan`
  record). Railway issues TLS automatically. This only adds a subdomain record
  and does not touch the apex domain or Netlify.

## Notes / limitations

- Free/Trial Railway plans may sleep or cap usage; the Hobby plan ($5/mo) keeps
  it always-on. The app itself is plan-agnostic.
- Single instance is assumed (the in-memory rate limiter is per-process, and the
  SQLite file is single-writer). Fine for the lead-gen launch; revisit if you
  scale horizontally.
- Scans run in-process; a burst shares the event loop. Move `runScanPipeline`
  behind a queue if volume grows — it's already one self-contained function.
