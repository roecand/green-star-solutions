# Security

## SSRF protection (the big one — we fetch user-supplied URLs)
All outbound fetching goes through `lib/scanner/url.ts` + `fetcher.ts`:
- http/https only; no credentials in URLs; hostname must contain a dot.
- Blocked hostnames: `localhost`, `*.local`, `*.internal`, cloud metadata hosts.
- DNS resolution of every hostname; **every** returned address checked against
  private/reserved ranges (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16
  incl. metadata IP, 0/8, 100.64/10 CGNAT, multicast, IPv6 loopback/link-local/
  unique-local/v4-mapped).
- Redirects followed manually (≤5) and **re-validated at every hop**.
- 10s timeout, 2MB response cap, HTML content types only, max 5 pages/scan.
- Scripts are never executed — HTML is parsed as text with cheerio.
- Competitor URLs pass through the identical path.
- Tests: `tests/url.test.ts`.

Residual risk: DNS rebinding between check and fetch (accepted at MVP;
mitigation would be a pinned-IP agent or an egress proxy).

## Authentication & sessions
- scrypt password hashing (per-user salt, timing-safe compare).
- 256-bit random session tokens, stored server-side, httpOnly + SameSite=Lax
  + Secure-in-production cookie, 30-day expiry, deleted on logout.

## Authorization & tenant isolation
- `/app/*` layouts call `requireUserWithOrg()`; `/admin/*` requires `role=admin`.
- API routes use `apiUser()`/`apiAdmin()` and return 401/403.
- Org-scoped reads go through `lib/db/queries.ts` so the organization filter
  lives in one place. Reports are only reachable via unguessable 128-bit
  share tokens (by design shareable).

## Input validation & abuse
- Every API boundary validates with Zod (lengths, enums, email formats).
- Rate limits: scans 5/hour/IP, report actions 20/hour/IP, plus 1 free scan
  per email and per-plan scan limits enforced server-side.
- Extracted website text is stored as plain text (tags stripped), rendered
  through React's default escaping — no `dangerouslySetInnerHTML` anywhere.
- Email templates HTML-escape all interpolated values.

## Payments & secrets
- Stripe webhook signature verification; plan changes only via verified
  webhook (or explicit, labeled mock mode when Stripe is unconfigured).
- No card data touches the app. Secrets only via env vars; `.env*` gitignored.

## Data minimization & honesty
- Raw HTML snapshots are NOT stored (only extracted text + structured metadata).
- Reports never claim guaranteed revenue or actual AI-platform rankings;
  copy is generated from detected/not-detected findings only.
- Privacy policy and terms pages shipped at `/privacy` and `/terms`.
