# Greenstar Revenue Leak Scanner — Project Rules

Self-serve diagnostic SaaS + lead engine for Greenstar Solutions. Read
`docs/rfc-mvp.md` first. This file is the working contract: update it whenever a
project decision is made. Also read @AGENTS.md — this project runs Next.js 16,
which has breaking changes vs older versions (docs in `node_modules/next/dist/docs/`).

## What this app is / is not

- IS: a fast, honest revenue-leak diagnostic with a clear score, clear report, and
  a clear reason to hire Greenstar.
- IS NOT: an SEO platform, a CRM, or a generic website grader. Reject scope creep.
- Every feature must serve revenue-leak diagnosis or Greenstar lead generation.

## Architecture decisions (with why)

| Decision | Why |
|---|---|
| Next.js 16 App Router, TS, Tailwind v4 | one deployable, stable, spec-preferred |
| libSQL/SQLite + Drizzle (not Supabase) | `@libsql/client`: local file for dev/tests, hosted **Turso** in prod (free, survives Render's disk-less free tier). Driver auto-switches on `TURSO_DATABASE_URL`. All db calls are async (`await db…`); `dbReady()` awaits migrate-on-boot. |
| Hand-rolled shadcn-style `components/ui/` | same look, no CLI/registry dependency |
| DB-session auth (scrypt + httpOnly cookie) | no external auth service; simple, auditable |
| Scans run inline in the API route | no queue infra needed at MVP volume; revisit at scale |
| Internal `analytics_events` table (not PostHog) | one fewer external dep; 1:1 mappable later |
| Anthropic adapter behind `AIReportProvider` | provider-swappable; deterministic fallback required |
| Stripe/Resend/Anthropic all degrade to mock modes | app must run with zero env keys |
| Migrations auto-apply on db boot (`lib/db/index.ts`) | dev/tests/prod stay in sync with no manual step |
| e2e runs a production build in `.next-e2e` with its own SQLite db | dev-server HMR/hydration flake eliminated; never collides with a running dev server |
| `SCANNER_ALLOW_PRIVATE=1` env relaxes the SSRF guard | e2e scans a fixture page served by the app itself; never set in production |

## Hard rules

1. **Scores are deterministic.** AI never sets or adjusts scores. The scoring
   engine (`lib/scoring/`) is pure functions over extracted signals.
2. **AI never invents facts.** It only explains structured findings. Missing data
   = "not detected". Hedged language for AI visibility claims ("may struggle to
   recommend", "based on your website's visible content").
3. **No fake anything.** No fake testimonials, guaranteed revenue claims, fake
   platform rankings, fabricated completion states in the UI.
4. **Safe fetching.** All outbound fetches go through `lib/scanner/fetcher.ts`:
   URL validation, private-IP/SSRF block, 10s timeout, 2MB cap, max 5 pages.
5. **Validate all inputs with Zod** at every API boundary.
6. **Tenant isolation.** Every authenticated query filters by the session user's
   organization. Admin routes check `users.role === 'admin'`.
7. **No TODO placeholders in core user flows.**
8. Free scan must show real value before any payment or signup wall.

## Naming conventions

- Files: kebab-case (`scan-pipeline.ts`); React components: PascalCase exports.
- DB: snake_case tables/columns; Drizzle schema in `lib/db/schema.ts`.
- Scores: `websiteConversionScore`, `localVisibilityScore`, `aiVisibilityScore`,
  `trustProofScore`, `followUpReadinessScore`, `revenueLeakScore` (0–100 ints).
- Findings: `{ id, category, label, detected, weight, evidence }`.
- Routes: public `/`, `/scanner`, `/pricing`, `/demo`, `/report/[token]`;
  app `/app/*`; admin `/admin/*`; API `app/api/*`.

## Layout map

- `lib/db/` — schema, client, migrations, seed
- `lib/scanner/` — url validation, fetcher, extractor, pipeline
- `lib/scoring/` — rules, weights, engine, verdicts
- `lib/ai/` — provider interface, anthropic adapter, fallback, report schema
- `lib/services/` — Greenstar service catalog, recommendation mapping
- `lib/billing/` — stripe client, plans, limits
- `lib/email/` — resend adapter, templates
- `lib/auth/` — sessions, passwords, guards
- `components/ui/` — shared primitives; `components/report/` — report UI
- `tests/` — vitest unit; `e2e/` — playwright

## Mistakes to avoid

- Don't let report copy overpromise (compliance section of RFC).
- Don't fetch competitor sites without the same SSRF guards.
- Don't store raw HTML by default (only extracted text + metadata).
- Don't block report rendering on AI (fallback copy must always work).
- Don't add plan checks in the UI only — enforce server-side.
- Tailwind v4: theme config lives in CSS `@theme`, no `tailwind.config.js`.
- Next 16: `params`/`searchParams`/`cookies()`/`headers()` are async — always
  await. `middleware.ts` is now `proxy.ts` (nodejs runtime only).
- `next.config.ts` MUST keep `turbopack.root` — the parent directory has
  another project's lockfile and Next otherwise infers the wrong workspace
  root, resolving React from the wrong node_modules (breaks hydration).
- Playwright: prefer role-based locators; plain `getByText` collides with the
  Next route announcer in strict mode.

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run lint` / `npm run typecheck` / `npm run test` (vitest) / `npm run e2e`
- `npm run db:push` — apply schema; `npm run db:seed` — demo data

## Milestone checklist

- [x] M1 Planning & scaffolding (RFC, CLAUDE.md, scaffold, deps, checks)
- [x] M2 Database & auth
- [x] M3 Extraction & scoring engine (31 unit tests)
- [x] M4 Public scanner flow
- [x] M5 AI report generation (schema + retry + fallback)
- [x] M6 Report page (score rings, gating, CTA panel, print view)
- [x] M7 User dashboard
- [x] M8 Admin dashboard (hot leads, outreach tools, notes)
- [x] M9 Stripe billing (checkout/portal/webhooks + mock mode)
- [x] M10 Emails & notifications (Resend adapter + mock)
- [x] M11 Analytics, marketing, legal, demo, docs, e2e (48 unit + 5 e2e)
- [x] M12 Final hardening & summary
