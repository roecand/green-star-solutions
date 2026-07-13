# RFC: Greenstar Revenue Leak Scanner — MVP

Status: Accepted
Author: Claude (Fable 5) for Robert / Greenstar Solutions
Date: 2026-07-09

## 1. Summary

A self-serve diagnostic SaaS that scans a local business's website and produces a
**Revenue Leak Score** (0–100) plus five category scores, a plain-English report of
the biggest leaks, a prioritized fix roadmap, and a mapping of every finding to a
Greenstar Solutions service. It is the self-serve front door into Greenstar: the free
scan generates leads, and paid plans ($19/$49/$99) add recurring monitoring, history,
competitor comparison, and PDF export.

**What it is:** a fast, beautiful, honest diagnostic that makes hiring Greenstar the
obvious next step.

**What it is not:** an SEO platform, a CRM, or a generic website grader.

## 2. Goals

1. A visitor can run a free scan with just a business name + website URL (plus a few
   easy questions) and see a genuinely useful report in minutes.
2. Every scan produces a lead for Greenstar with hot-lead scoring.
3. Deterministic, transparent scoring — AI explains, it never invents.
4. Simple MRR: Stripe subscriptions with clear plan limits.
5. Shippable: runs locally with zero external accounts; all third-party services
   (Stripe, Resend, Anthropic) degrade gracefully to mock/fallback modes.

## 3. Non-goals (explicitly out of MVP)

Full CRM, SMS automation, Google Business Profile login, Search Console integration,
deep crawling, Chrome extension, multi-user teams, white label, AI chatbot, ads
manager, social scheduler, backlink analysis, keyword rank tracking.

## 4. Architecture

- **Next.js 16 App Router + TypeScript + Tailwind CSS v4** — single deployable app;
  public pages, authenticated app, admin, and API routes all in one place.
- **UI components:** shadcn-style components implemented directly in
  `components/ui/` (no CLI dependency; same look/feel, fewer moving parts).
- **Database: SQLite via Drizzle ORM** (`better-sqlite3`).
  - *Deviation from the Supabase preference, documented:* Supabase requires an
    external hosted project + keys before anything runs. SQLite gives a fully
    working local/self-hosted MVP with zero setup, and the Drizzle schema is
    portable to Postgres (Supabase/Neon) with a driver swap when scale demands it.
    The data layer is isolated in `lib/db/` so the swap is contained.
- **Auth:** email + password with scrypt hashing and DB-backed session tokens in an
  httpOnly cookie. No third-party auth dependency. Admin is a role flag on `users`.
- **Website scanning:** safe server-side fetcher (SSRF-guarded, size/time-limited)
  → cheerio extraction → deterministic rule-based scoring engine → structured
  findings.
- **AI reports:** `AIReportProvider` interface with an Anthropic adapter. Input is
  the structured findings only. Output validated with a strict Zod schema; one
  retry, then deterministic fallback copy. **Scores never come from AI.**
- **Billing:** Stripe Checkout + customer portal + webhook. Mock mode when keys are
  absent (plan changes recorded directly, clearly labeled test behavior).
- **Email:** Resend adapter; logs to console/`email_events` table when no key.
- **Analytics:** internal `analytics_events` table (PostHog deferred — one fewer
  external dependency; the events schema maps 1:1 if added later).
- **Tests:** Vitest (unit: URL validation, extraction, scoring, schema validation,
  plan limits) + Playwright (e2e: scan → report → lead → admin).

## 5. Core flow

```
Visitor → / (landing) → /scanner (multi-step form)
  → POST /api/scans (creates scan + lead, kicks off pipeline)
  → progress states (reading site → conversion → local → AI → trust → roadmap)
  → /report/[shareToken]  (public shareable report)
      → CTA: Book call / Request fix plan / Email report / Create account
  → /signup → /app/dashboard (history, rescans per plan)
  → /pricing → Stripe checkout → plan limits unlocked
Admin → /admin (leads, hot-lead scoring, statuses, outreach tools)
```

## 6. Scan pipeline

1. Validate + normalize URL (Zod; block localhost/private IPs; http(s) only).
2. Fetch homepage (10s timeout, 2MB cap, ≤5 redirects, no script execution).
3. Detect and fetch up to 4 more internal pages (contact/about/services/reviews).
4. Extract: title, meta, headings, paragraphs, links, buttons, forms, tel/mailto,
   CTA phrases, schema.org markers, image alts.
5. Run deterministic rules → finding objects `{id, category, detected, weight, evidence}`.
6. Compute 5 category scores (weighted rules, 0–100) + Revenue Leak Score
   (weighted average: conversion 25%, local 20%, AI 20%, trust 20%, follow-up 15%).
7. Generate recommendations mapped to the Greenstar service catalog.
8. AI provider turns findings into plain-English report JSON (or fallback copy).
9. Persist everything on the `scans` row; create/update `leads`; send emails.

Scans run inline in the API route with streamed progress (SQLite + serverless-style
queue is overkill for MVP; documented as a scale-later item).

## 7. Data model

See `docs/data-model.md`. Tables: users, sessions, organizations, businesses, scans,
competitors, scan_competitor_results, leads, recommendations, subscriptions,
email_events, admin_notes, audit_events, analytics_events.

## 8. Pricing / plan limits

| Plan | Price | Scans | Businesses | Features |
|---|---|---|---|---|
| Free | $0 | 1 total | 1 | report preview, Greenstar CTA |
| Starter | $19/mo | 1/month | 1 | history, email report |
| Growth | $49/mo | weekly | 1 | competitor comparison, PDF, deeper recs |
| Pro | $99/mo | weekly | 5 | + priority alerts, strategy-call CTA |

Free scan shows real value (full scores + top 3 leaks); deeper roadmap detail and
exports are gated. Never force payment before value.

## 9. Honesty constraints

- AI visibility language is hedged ("may struggle to recommend", "based on your
  website's visible content"). We never claim to know actual AI/search rankings.
- No fabricated reviews, rankings, revenue impact, or guarantees.
- Missing data is reported as "not detected", never invented.

## 10. Milestones

M1 scaffolding/docs → M2 DB+auth → M3 extraction+scoring engine → M4 scanner flow →
M5 AI reports → M6 report page → M7 user dashboard → M8 admin → M9 Stripe →
M10 email → M11 analytics/marketing/legal → M12 hardening. Lint + typecheck + tests
after each milestone.

## 11. Risks & mitigations

- **Sites that block fetchers / JS-only sites:** report gracefully ("we couldn't
  read your site — that itself hurts AI visibility"), mark scan `failed_partial`,
  still capture the lead.
- **AI output drift:** strict Zod schema, retry once, deterministic fallback.
- **Abuse of public endpoint:** per-IP rate limit + free-scan-per-email limit.
- **SSRF:** IP/hostname denylist, DNS resolution check, redirect re-validation.
