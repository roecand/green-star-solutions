# API

All bodies are JSON, validated with Zod. Errors return `{ error: string }`
with an appropriate status. Auth is a `gs_session` httpOnly cookie.

## Public

### POST /api/scans
Create a scan (rate limit: 5/hour/IP).

Body: `businessName, websiteUrl, industry, city?, state?, email?, contactName?, phone?, primaryGoal? (more_calls|more_bookings|more_form_leads|more_reviews|more_visibility), competitorUrls? (≤3)`

- URLs are normalized and SSRF-checked (400 on unsafe/invalid).
- Plan limits: logged-in orgs get `scanLimitFor(plan)` per rolling 30 days;
  anonymous scans get 1 free scan per email. Exceeding returns **402** with
  `{ error, upgrade: true }`.
- Returns `{ scanId, shareToken }` immediately; pipeline runs async.

### GET /api/scans/:id/status
`{ id, status, progressStage, shareToken, errorMessage, revenueLeakScore }` — polled by the scanner UI.

### POST /api/report/:token/action
Report CTA actions (rate limit 20/hour/IP).
Body: `{ action: book_call | request_fix_plan | email_report | cta_click, email? }`
- `book_call` / `request_fix_plan` → lead becomes `requested_help`, hot score
  recomputed, admin notified.
- `email_report` → sends the report link to `email` (or the lead's email).

## Auth

### POST /api/auth/signup
`{ email, password (≥8), name? }` → creates user + org, claims anonymous
scans by email, sets session. 409 if email taken. `ADMIN_EMAIL` signups get
the admin role.

### POST /api/auth/login
`{ email, password }` → `{ ok, isAdmin }`. 401 on bad credentials.

### POST /api/auth/logout
Destroys the session.

## Billing (session required)

### POST /api/checkout
`{ plan: starter|growth|pro }` →
- Stripe configured: `{ redirect: <checkout url> }`
- Mock mode: applies plan instantly, `{ mock: true, redirect: "/app/billing?upgraded=mock" }`
- 401 with `redirect: "/signup?next=/pricing"` when logged out.

### POST /api/billing/portal
`{ redirect: <portal url> }` — requires Stripe + existing customer.

### POST /api/stripe/webhook
Signature-verified (`STRIPE_WEBHOOK_SECRET`). Handles
`checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`. Plan changes only happen here (or in mock
mode). Handlers are unit-tested in `tests/db-flows.test.ts`.

## Admin (admin role required)

### PATCH /api/admin/leads/:id
`{ lifecycleStatus?, isOutreachTarget?, note? }` — updates lead lifecycle,
toggles outreach targeting, and/or appends an admin note. Writes an audit event.
