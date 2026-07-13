# Deployment

The app is a standard Next.js server app with a SQLite file database, so it
needs a host with **persistent disk**. Recommended paths, simplest first:

## Option A (recommended): single VPS / Fly.io / Railway / Render

1. Provision Node 20+ with a persistent volume.
2. `npm ci && npm run build`
3. Set env vars (see below). Point `DATABASE_PATH` at the persistent volume,
   e.g. `/data/greenstar.db`.
4. `npm run start` behind a reverse proxy with HTTPS.
5. First boot auto-applies migrations. Run `npm run db:seed` once to create
   the admin user (set `ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` first!).
6. Add the Stripe webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
   with events `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Put the signing secret in
   `STRIPE_WEBHOOK_SECRET`.
7. Back up the SQLite file (e.g. Litestream or a nightly volume snapshot).

Fly.io sketch: `fly launch` → add a volume → mount at `/data` →
`DATABASE_PATH=/data/greenstar.db` → `fly deploy`.

## Option B: Vercel (requires the Postgres port)

Vercel has no persistent disk, so SQLite won't work there. Port the data
layer first (see docs/data-model.md "Porting to Postgres/Supabase" — swap
Drizzle's sqlite-core for pg-core + a Postgres driver against Neon/Supabase),
then deploy normally. This is the planned scale path, not an MVP blocker.

## Production environment variables

Required:
- `NEXT_PUBLIC_APP_URL=https://yourdomain.com` (emails + share links)
- `ADMIN_EMAIL=robert@greenstarsolutions.com`
- `DATABASE_PATH=/data/greenstar.db` (on the persistent volume)

Strongly recommended:
- `ANTHROPIC_API_KEY` + `AI_MODEL=claude-sonnet-5` — AI report copy
- `RESEND_API_KEY` + `EMAIL_FROM="Greenstar Scanner <scanner@yourdomain.com>"`
  (verify the domain in Resend) + `ADMIN_NOTIFICATION_EMAIL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
  (create three monthly prices in Stripe: $19 / $49 / $99)
- `NEXT_PUBLIC_BOOKING_URL` — Calendly (or similar) link for strategy calls

Optional: `SEED_ADMIN_PASSWORD` (before running seed in production).

## Go-live sequence

1. Deploy with Stripe in **test mode**; run through checkout with 4242 card.
2. Run `npm run db:seed` for demo reports (powers `/demo`).
3. Send a test scan against your own site; confirm report email arrives.
4. Flip Stripe to live keys; re-verify webhook.
5. Work through docs/launch-checklist.md.

## Operational notes

- Scans run in-process; a burst of scans shares the Node event loop. At
  sustained volume, move `runScanPipeline` behind a queue (BullMQ + Redis)
  — the pipeline is already a single self-contained function.
- The rate limiter is in-memory (per instance). Fine for one instance;
  use Redis if you scale horizontally.
- Logs: email sends, scan failures, and webhook errors all `console.error`
  with context — pipe stdout to your log drain.
