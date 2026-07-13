# Architecture

One Next.js 16 App Router deployable. No queues, no workers, no external
infra beyond optional Stripe/Resend/Anthropic keys.

## Module map

```
app/
  page.tsx                     landing
  scanner/                     multi-step public scan form
  report/[token]/              public shareable report (token = unguessable share token)
  demo/                        seeded demo reports
  pricing/ services/ contact/ privacy/ terms/
  login/ signup/
  app/                         authenticated user area (layout enforces session + org)
    dashboard/ scans/ scans/[id]/ businesses/ businesses/[id]/ settings/ billing/
  admin/                       Greenstar admin (layout enforces role=admin)
    page.tsx leads/ leads/[id]/ scans/ scans/[id]/ settings/
  api/
    auth/{signup,login,logout}
    scans/                     POST create scan (rate limited, plan limited)
    scans/[id]/status          GET progress polling
    report/[token]/action      POST cta clicks / help requests / email report
    checkout/                  POST stripe checkout (mock mode without keys)
    billing/portal/            POST stripe customer portal
    stripe/webhook/            POST signature-verified webhook
    admin/leads/[id]           PATCH status/outreach/notes (admin only)

lib/
  db/          schema.ts (Drizzle), index.ts (client + migrate-on-boot),
               migrations/, seed.ts, demo-fixtures.ts, queries.ts (tenant-scoped reads)
  scanner/     url.ts (normalize + SSRF guard), fetcher.ts (safe fetch),
               extractor.ts (cheerio → ExtractedSite), pipeline.ts (orchestrator), types.ts
  scoring/     rules.ts (50 weighted rules), engine.ts (scores + verdicts),
               recommendations.ts (failed rule → plain-English rec + service)
  ai/          provider.ts (interface + retry/fallback), anthropic.ts,
               fallback.ts (deterministic copy), report-schema.ts (strict Zod)
  services/    catalog.ts (7 Greenstar services)
  billing/     plans.ts (definitions + limits), stripe.ts, webhook-handlers.ts
  email/       send.ts (Resend or mock), templates.ts
  auth/        password.ts (scrypt), session.ts (DB sessions + cookie),
               guards.ts (requireUser/requireAdmin/apiUser), register.ts
  leads/       hot-score.ts
  analytics/   track.ts (internal events table)
  rate-limit.ts
```

## Key flows

**Scan** — `POST /api/scans` validates with Zod, normalizes/SSRF-checks URLs,
enforces rate + plan limits, inserts business/scan/lead, then runs
`runScanPipeline` without awaiting. The client polls status; the pipeline
updates `scans.progress_stage` as it goes and never throws (failures land in
`scans.error_message` with a friendly message).

**Report** — server component looks up the scan by share token, parses the
stored `ai_report_json` (already schema-validated when written), applies plan
gating (free = top 3 leaks + first roadmap column), marks the lead
`viewed_report`, and tracks a `report_view` event.

**Auth** — email+password (scrypt), 256-bit session tokens stored in the
`sessions` table, httpOnly cookie. Layouts call `requireUser`/`requireAdmin`;
API routes use the non-redirecting `apiUser`/`apiAdmin`. On signup, anonymous
businesses with the same email are claimed into the new organization.

**Billing** — with Stripe keys: Checkout + customer portal + webhook (plan
changes only happen server-side from webhook events). Without keys: "mock
mode" applies the plan instantly and labels it test mode everywhere.

## Decisions and trade-offs

| Choice | Trade-off accepted |
|---|---|
| SQLite + Drizzle instead of Supabase | zero-setup local/single-host MVP; swap driver for Postgres at scale (data layer isolated) |
| Pipeline runs in the request process | fine at MVP volume; a queue is the first scale upgrade |
| In-memory rate limiter | resets on deploy, per-instance only; move to a shared store when horizontal |
| Sessions in DB, no JWT | trivially revocable, one fewer secret |
| Internal analytics table | no consent banner complexity, 1:1 exportable to PostHog later |
| Print-to-PDF via `@media print` | no server PDF dependency; report route is print-clean |
