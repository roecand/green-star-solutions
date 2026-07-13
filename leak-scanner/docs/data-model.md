# Data model

SQLite via Drizzle ORM. Schema source of truth: `lib/db/schema.ts`.
Migrations in `lib/db/migrations/` apply automatically on boot.
All ids are UUIDs; timestamps are epoch-ms integers.

## users
`id, email (unique), name, password_hash (scrypt salt:hash), role (user|admin), created_at`

## sessions
`id (the 256-bit token), user_id → users, expires_at, created_at` — deleted on logout/expiry.

## organizations
`id, owner_user_id → users, name, plan (free|starter|growth|pro), stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at`
One org per user in MVP (owner model).

## businesses
`id, organization_id → organizations (NULL for anonymous public scans), business_name, website_url, industry, city, state, phone, email, primary_goal, created_at`
Anonymous businesses are claimed by email match at signup.

## scans
`id, business_id → businesses, status (pending|running|completed|failed|failed_partial), share_token (unique — public report URL), website_url, industry, city, state, progress_stage, raw_html_snapshot (unused by default — we deliberately don't store raw HTML), extracted_text, extracted_metadata_json (pages fetched, fetch errors), deterministic_findings_json (Finding[]), ai_report_json (schema-validated AIReport), ai_source (ai|fallback), revenue_leak_score, website_conversion_score, local_visibility_score, ai_visibility_score, trust_proof_score, follow_up_readiness_score, error_message, created_at, completed_at`

## competitors
`id, business_id → businesses, competitor_url, created_at` — captured at scan
time; competitor comparison rendering is a Growth-plan roadmap item.

## scan_competitor_results
`id, scan_id → scans, competitor_url, extracted_metadata_json, comparison_json, created_at`

## leads
`id, scan_id → scans, business_name, contact_name, email, phone, website_url, industry, city, state, score (copy of revenue_leak_score), lifecycle_status (new|viewed_report|requested_help|contacted|booked_call|proposal_sent|won|lost), source (self_serve|outreach|demo), is_outreach_target (bool), hot_score (0–100, see lib/leads/hot-score.ts), created_at`

## recommendations
`id, scan_id → scans, category (conversion|local|ai_visibility|trust|follow_up), severity (critical|high|medium|low), title, explanation, recommended_fix, greenstar_service (catalog id), priority (this_week|this_month|later), created_at`

## subscriptions
`id, organization_id → organizations, plan, status (active|mock_active|canceled|…), current_period_end, created_at` — append-only history; current plan lives on the org.

## email_events
`id, organization_id?, scan_id?, lead_id?, event_type, provider_message_id, status (sent|mocked|failed), created_at`

## admin_notes
`id, lead_id → leads, note, created_at`

## audit_events
`id, organization_id?, actor_user_id?, event_type, entity_type, entity_id, payload_json, created_at`

## analytics_events
`id, event_type (landing_visit|scanner_start|scanner_complete|report_view|cta_click|signup|upgrade|help_request|email_report_request), path?, scan_id?, lead_id?, user_id?, metadata_json?, created_at`

## Porting to Postgres/Supabase
Drizzle schema is dialect-portable: swap `sqlite-core` column builders for
`pg-core` equivalents, change the driver in `lib/db/index.ts`, regenerate
migrations. No query-level changes needed (all queries go through Drizzle).
