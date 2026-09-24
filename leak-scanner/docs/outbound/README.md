# Greenstar Outbound Engine

A lean prospecting machine inside the Leak Scanner app, admin-only at `/outbound`.
**Import leads → analyze their websites → draft personalized outreach →
review → send safely → follow up automatically → catch replies → push
interested prospects into GoHighLevel → notify Robert.**

It shares the scanner's hardened website fetcher (SSRF guard, timeouts, size
caps), database, auth, and email adapter. The paid-ads "Brand + Revenue Leak
Score" funnel already exists in this app (`/scanner`), so both acquisition
paths run on one website-analysis engine.

## Architecture

```
CSV / manual entry ──► outbound_leads (NEW)
                         │  queue ("Analyze")
                         ▼
   scheduler tick ──► website-analysis ── lib/scanner/extractor (fetch ≤5 pages, SSRF-safe)
   (n8n/cron every      │   signals.ts   deterministic customer's-eye signals + scores
    2–5 min, or         │   observations deterministic, evidence-backed observations
    "Run now")          │   analyze.ts   LLM phrases/picks observations (optional, validated)
                        ▼
                     lead-scoring ── priorityScore 0–100 + stored reasons → READY / DISQUALIFIED
                        │  add to campaign
                        ▼
                     personalization ── LLM draft → lint → retry once → template fallback
                        │  (DRAFT → you approve → APPROVED)
                        ▼
                     sending/scheduler ── window, daily caps, spacing, suppression,
                        │                 reply check, atomic claim → email provider
                        ▼
   provider webhook ─► replies/handle ── dedupe → reply-classification (rules → LLM)
   or manual paste       │                 → stop sequences → suppress if opt-out
                         ├─► ghl/service  (contact, tags, note, opportunity)
                         └─► notify       (email to you)
```

| Module (`lib/outbound/`) | Responsibility |
|---|---|
| `leads/` | RFC-4180 CSV parser, header aliases, normalization, dedupe, import report |
| `website-analysis/` | Signals, internal scores, observations, LLM analysis, queue service |
| `lead-scoring/` | `computePriority()` — pure, every point explained |
| `personalization/` | Sequence config, linter, template fallback, LLM generation, footer |
| `email/` | Provider adapters: `mock`, `n8n`, `smartlead` |
| `sending/` | Send window math, scheduler tick, the single `stopLeadSequences()` choke point |
| `reply-classification/` | Deterministic rules first, LLM second |
| `replies/` | Inbound handling, bounce/unsubscribe, suppression, webhook normalizer, notifications |
| `ghl/` | The only code that talks to GoHighLevel |
| `llm/` | Provider-agnostic `generateJson()` (Anthropic, any OpenAI-compatible, or none) |
| `core/` | Activity log/error codes, DB lease lock, HTTP retry helper, settings |

Data: `outbound_leads`, `outbound_lead_analyses`, `outbound_campaigns`,
`outbound_campaign_leads`, `outbound_messages`, `outbound_replies`,
`outbound_activities`, `outbound_suppressions`, `outbound_settings`,
`outbound_locks` (migration `0004_outbound_engine`, applied automatically on boot).

## Day-to-day use

1. **Leads → Import CSV** (keep "Queue for website analysis" checked).
2. **Run now** (or let n8n tick). Leads become READY (priority ≥ threshold) or
   DISQUALIFIED (no email, parked site, low priority), with reasons on the lead page.
3. **Campaigns → New campaign**, then add READY leads. Drafts generate on the next tick.
4. Review drafts on each lead page (edit freely; the linter flags generic
   phrasing, stats, meeting asks, and missing CTAs) → **Approve** (or
   "Approve all drafted" on the campaign).
5. **Launch.** One email per campaign per tick, inside the send window, under
   the campaign's and the mailbox's daily limits. Follow-ups go out on day 3/7/12.
6. Replies arrive via webhook (or paste them on the lead page). Any human
   reply stops the sequence; opt-outs are suppressed; high-confidence
   "interested" replies go to GHL, and you get an email.

## Safety & compliance guarantees (enforced in code, covered by tests)

- Nothing sends without an ACTIVE campaign **and** approved copy (when approval is on, the default).
- Before every send: lead status, suppression list, "has replied", and message state are re-checked; the message is atomically claimed so it can't send twice.
- Replies, bounces, unsubscribes and do-not-contact stop **all** open sequences for that lead, locally first, then at the provider.
- Opt-outs and bounces go on the suppression list, which is also checked at import and when a lead is added to a campaign.
- Every email carries a signature, your postal address, and a working opt-out link (`/u/<token>`, a button press so link scanners can't trigger it). Non-mock providers refuse to launch without `OUTBOUND_SENDER_ADDRESS`.
- RFC 8058 one-click unsubscribe endpoint for the `List-Unsubscribe` header (n8n provider).
- No SMS, no calling. Retries are bounded (analysis ×2, send ×2, provider enroll ×2).
- Observations are phrased as what a visitor can see ("I couldn't find…"), never claims about internal systems; no statistics.

## What you need to provide

| To turn on… | Set | Notes |
|---|---|---|
| AI analysis + drafts | `ANTHROPIC_API_KEY` (or `OUTBOUND_LLM_PROVIDER=openai` + `OPENAI_API_KEY`) | Without it: deterministic analysis + rotating templates (works, less varied) |
| Real sending | `OUTBOUND_SENDER_ADDRESS`, `NEXT_PUBLIC_APP_URL` (public URL), and a provider (below) | CAN-SPAM postal address is mandatory |
| Provider: your mailbox via n8n | `OUTBOUND_N8N_SEND_WEBHOOK_URL`, `OUTBOUND_WEBHOOK_SECRET` | See `n8n.md` |
| Provider: Smartlead | `SMARTLEAD_API_KEY` + a Smartlead campaign built with `{{gs_subject_1}}`/`{{gs_body_N}}` fields | See "Smartlead setup" below |
| Scheduler | `OUTBOUND_CRON_SECRET` + n8n/cron hitting `POST /api/outbound/tick` | Or press "Run now" |
| Inbound replies | `OUTBOUND_WEBHOOK_SECRET` + provider/n8n webhook to `/api/outbound/webhooks/email` | Or paste replies manually |
| GoHighLevel | `GHL_API_TOKEN` (Private Integration), `GHL_LOCATION_ID`, `GHL_PIPELINE_ID`, `GHL_STAGE_INTERESTED_ID`, optional `GHL_STAGE_BOOKED_ID` | Scopes: contacts + opportunities read/write |
| Notifications | `RESEND_API_KEY`, `OUTBOUND_NOTIFY_EMAIL` (or `ADMIN_NOTIFICATION_EMAIL`) | Without Resend they're logged, not delivered |

### Smartlead setup (sequence_push mode)

Smartlead runs the timing itself, so Greenstar pushes each approved lead once
with every step as custom fields. In Smartlead, create a campaign whose steps are:

| Step | Delay | Subject | Body |
|---|---|---|---|
| 1 | 0 days | `{{gs_subject_1}}` | `{{gs_body_1}}` |
| 2 | 3 days | *(blank = same thread)* | `{{gs_body_2}}` |
| 3 | 4 days | *(blank)* | `{{gs_body_3}}` |
| 4 | 5 days | *(blank)* | `{{gs_body_4}}` |

Paste its campaign id into the Greenstar campaign, and add a Smartlead webhook
(EMAIL_SENT, EMAIL_REPLY, EMAIL_BOUNCE, LEAD_UNSUBSCRIBED) pointing to
`https://<app>/api/outbound/webhooks/email?secret=<OUTBOUND_WEBHOOK_SECRET>`.
Warmup, mailbox rotation and per-mailbox limits are Smartlead's job.

> **Unverified:** the add-leads call follows Smartlead's current API docs. The
> pause-lead / campaign-status endpoints and the webhook field names come from
> their reference but haven't been run against a live account. Enroll one test
> lead first. Unrecognized webhook payloads are logged as `WEBHOOK_REJECTED`,
> with a sample, on the dashboard.

## Error codes (dashboard → Automation problems, and each lead's timeline)

`WEBSITE_FETCH_FAILED` · `ANALYSIS_FAILED` · `MESSAGE_GENERATION_FAILED` ·
`EMAIL_SEND_FAILED` · `CRM_SYNC_FAILED` · `REPLY_CLASSIFICATION_FAILED` ·
`WEBHOOK_REJECTED` · `NOTIFICATION_FAILED` (plus `SEND_HELD` when a follow-up
isn't approved).

## Known limits

- Static HTML only: script-rendered widgets that load no recognizable script host can be missed. Observations about absence are hedged, and "no form" is low confidence so it never leads an email.
- Daily limits use a rolling 24h window, not calendar days.
- One send per campaign per tick: at a 3-minute tick that's up to ~160/8h window, well above sensible cold volumes.
- Single-instance design (DB lease lock). Fine on one Railway service.
