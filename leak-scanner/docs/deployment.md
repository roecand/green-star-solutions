# Deployment

The scanner is a Next.js **server** app (API routes + a database), so it can't
run on the same static Netlify deploy as the Greenstar marketing site. The
setup below is **100% free**: Render's free web service + Turso's free database,
served at a subdomain of green-starsolutions.com.

## The free stack

| Piece | Free tier | Notes |
|---|---|---|
| **Render** (web service) | free plan | spins down after ~15 min idle, cold-starts in ~1 min; 750 instance-hours/mo |
| **Turso** (database) | free plan | hosted SQLite; 5 GB, 500M row reads/mo — far beyond MVP needs. Data persists across Render spin-downs (Render's free tier has no disk) |
| **Subdomain** | free | `scan.green-starsolutions.com` — just a DNS record, no new domain to buy |

The database driver auto-switches: with `TURSO_DATABASE_URL` set it uses Turso;
without it, a local SQLite file (`lib/db/index.ts`). Same schema either way.

## One-time setup

### 1. Create the Turso database (free)
```bash
# install the CLI: https://docs.turso.tech/cli/installation
turso auth signup
turso db create greenstar
turso db show greenstar --url            # -> TURSO_DATABASE_URL (libsql://...)
turso db tokens create greenstar         # -> TURSO_AUTH_TOKEN
```

### 2. Seed the production database once
Migrations apply automatically on first boot, but run the seed locally against
Turso to create the admin user + demo reports:
```bash
cd leak-scanner
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
  ADMIN_EMAIL=you@greenstarsolutions.com SEED_ADMIN_PASSWORD='a-strong-password' \
  npm run db:seed
```

### 3. Deploy on Render
This repo has a [`render.yaml`](../../render.yaml) blueprint at its root.
- Render dashboard → **New → Blueprint** → connect `roecand/green-star-solutions`.
- Render reads `render.yaml`, creates the `greenstar-leak-scanner` service
  (rootDir `leak-scanner`, build `npm ci && npm run build`, start `npm run start`).
- After the first deploy, set the secret env vars in the dashboard (they're
  marked `sync:false`): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
  `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, and any optional
  Anthropic/Resend/Stripe/booking keys.
- Set `NEXT_PUBLIC_APP_URL` to the Render URL first (e.g.
  `https://greenstar-leak-scanner.onrender.com`), redeploy, confirm it works.

### 4. Point the subdomain (free)
- In Render: service → **Settings → Custom Domains** → add
  `scan.green-starsolutions.com`. Render shows a CNAME target.
- In your DNS provider (wherever green-starsolutions.com is managed): add a
  **CNAME** record `scan` → the Render target. TLS is issued automatically.
- Update `NEXT_PUBLIC_APP_URL=https://scan.green-starsolutions.com` and redeploy.
- Optional: link it from the agency site nav ("Free Scan").

### 5. Stripe webhook (only if using live billing)
Add endpoint `https://scan.green-starsolutions.com/api/stripe/webhook` with
events `checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`; put the signing secret in
`STRIPE_WEBHOOK_SECRET`. Without Stripe keys, billing runs in mock mode.

## The one free-tier tradeoff

Render's free service sleeps after ~15 minutes of no traffic, so the first
visitor after a quiet spell waits ~1 minute for a cold start. Fine for early
outreach-driven traffic. Two ways to remove it later:
- A free uptime pinger (e.g. a cron that hits `/` every 10 min) keeps it warm.
- Render's paid Starter (~$7/mo) never sleeps — the upgrade path when volume
  justifies it.

## Alternative: Vercel

Vercel also has no persistent disk, but with Turso set via the same
`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` env vars it works too — import the
repo, set the project root to `leak-scanner`, add the env vars. Render is
documented as the primary path because its free tier doesn't require a
serverless-function cold-start tuning pass.

## Notes

- Migrations run automatically on boot (`dbReady()` in `lib/db/index.ts`),
  idempotent, so deploys need no separate migrate step.
- Scans run in-process; a burst shares the Node event loop. At sustained
  volume move `runScanPipeline` behind a queue — it's already one function.
- The in-memory rate limiter is per-instance; the free tier is single-instance,
  so it works as-is.
