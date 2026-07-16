# Greenstar Revenue Leak Scanner

Self-serve diagnostic SaaS for local businesses — and the lead-generation
front door for **Greenstar Solutions**. A visitor enters their website and a
few basics; the app safely reads their public pages, runs ~50 deterministic
checks, and produces a **Revenue Leak Score** (0–100) with five category
scores, plain-English top leaks, a prioritized fix roadmap, and a mapping of
every finding to a Greenstar service.

> Your business may not have a traffic problem. It may have a revenue leak problem.

## Quick start

```bash
npm install
npm run db:seed     # creates the SQLite db, admin user, and 5 demo reports
npm run dev         # http://localhost:3000
```

That's it — **no external accounts or API keys are required to run locally.**
Stripe, Resend, and Anthropic all degrade to safe mock/fallback modes.

- Landing page: `/` · Scanner: `/scanner` · Demo reports: `/demo`
- Admin login: `admin@greenstar.local` / `greenstar-admin` (change via
  `ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` before seeding)

## Environment variables

Copy `.env.example` to `.env.local`. Everything is optional for local dev:

| Variable | Unlocks |
|---|---|
| `ANTHROPIC_API_KEY` (+ `AI_MODEL`) | AI-written report copy (otherwise deterministic fallback copy) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Real Stripe checkout/portal/webhooks (otherwise clearly-labeled test-mode plan changes) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Real email delivery (otherwise logged + recorded as `mocked`) |
| `ADMIN_NOTIFICATION_EMAIL` | New-lead and help-request emails to Greenstar |
| `ADMIN_EMAIL` | Signups with this email get the admin role |
| `NEXT_PUBLIC_APP_URL` | Absolute URLs in emails/share links |
| `NEXT_PUBLIC_BOOKING_URL` | "Book Strategy Call" destination (Calendly etc.) |
| `DATABASE_PATH` | SQLite file location (default `./data/greenstar.db`) |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `start` | production build / serve |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright e2e tests (`npx playwright install` first) |
| `npm run db:seed` | seed admin + demo data (idempotent) |
| `npm run db:push` | push schema directly (dev only; migrations run automatically on boot) |

## How a scan works

```
POST /api/scans → create business + scan + lead rows
  → SSRF-safe fetch of homepage + up to 4 detected pages (contact/about/services/reviews)
  → cheerio extraction (headings, links, forms, phones, schema, text)
  → deterministic scoring engine (lib/scoring) → findings + 6 scores
  → recommendations mapped to the Greenstar service catalog
  → AI report provider (Anthropic) explains findings — strict Zod schema,
    one retry, deterministic fallback. AI never sets scores.
  → emails (owner report + admin lead notification)
Client polls /api/scans/:id/status for progress stages, then loads /report/:shareToken
```

Scoring is fully documented in [docs/scoring.md](docs/scoring.md).

## Project docs

- [docs/rfc-mvp.md](docs/rfc-mvp.md) — what/why, architecture decisions
- [docs/architecture.md](docs/architecture.md) — module map and data flow
- [docs/data-model.md](docs/data-model.md) — every table and field
- [docs/api.md](docs/api.md) — API routes
- [docs/security.md](docs/security.md) — SSRF guards, tenant isolation, rate limits
- [docs/deployment.md](docs/deployment.md) — production deployment guide
- [docs/launch-checklist.md](docs/launch-checklist.md) — pre-launch runbook
- [docs/greenstar-service-mapping.md](docs/greenstar-service-mapping.md) — finding → service map
- [marketing/](marketing/) — landing copy, UGC hooks, outreach templates, sales outline

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · libSQL/Drizzle ORM
(local SQLite file in dev, hosted Turso in prod) · cookie-session auth (scrypt) ·
Stripe · Resend · Anthropic (swappable via `AIReportProvider`) · Zod · Vitest ·
Playwright. Deploys free on Render + Turso — see [docs/deployment.md](docs/deployment.md).

Deviations from the original spec preference (Supabase → SQLite+Drizzle,
shadcn CLI → hand-rolled shadcn-style components, PostHog → internal events
table) are documented with reasons in [CLAUDE.md](CLAUDE.md) and the RFC.
