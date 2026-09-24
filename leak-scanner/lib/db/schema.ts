import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  // The session token itself (random 256-bit hex); treated as a secret.
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

export const organizations = sqliteTable("organizations", {
  id: id(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["free", "starter", "growth", "pro"] })
    .notNull()
    .default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export const businesses = sqliteTable("businesses", {
  id: id(),
  // Null for anonymous public scans; set when a user claims/creates the business.
  organizationId: text("organization_id").references(() => organizations.id),
  businessName: text("business_name").notNull(),
  // Null = no website (a scannable signal in its own right).
  websiteUrl: text("website_url"),
  industry: text("industry").notNull(),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  email: text("email"),
  primaryGoal: text("primary_goal"),
  createdAt: createdAt(),
});

export const scans = sqliteTable("scans", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed", "failed_partial"],
  })
    .notNull()
    .default("pending"),
  // Unguessable token for the public shareable report URL.
  shareToken: text("share_token").notNull().unique(),
  // Null = the business told us they have no website (scored as a leak).
  websiteUrl: text("website_url"),
  industry: text("industry").notNull(),
  city: text("city"),
  state: text("state"),
  // Ladder funnel: everyone starts quick; answering the deep questions on the
  // report upgrades the scan to comprehensive.
  depth: text("depth", { enum: ["quick", "comprehensive"] })
    .notNull()
    .default("quick"),
  // Self-reported deep-audit answers (IntakeAnswers). Never affects scores —
  // generates labeled "based on what you told us" insights.
  intakeJson: text("intake_json"),
  // Rough per-customer value, captured in the quick scan (single tap). Powers
  // the hedged opportunity-cost framing in the report hero — their number,
  // clearly labeled as self-reported.
  customerValue: text("customer_value", {
    enum: ["under_100", "v100_500", "v500_2000", "over_2000", "not_sure"],
  }),
  progressStage: text("progress_stage"),
  rawHtmlSnapshot: text("raw_html_snapshot"),
  extractedText: text("extracted_text"),
  extractedMetadataJson: text("extracted_metadata_json"),
  deterministicFindingsJson: text("deterministic_findings_json"),
  aiReportJson: text("ai_report_json"),
  aiSource: text("ai_source", { enum: ["ai", "fallback"] }),
  revenueLeakScore: integer("revenue_leak_score"),
  websiteConversionScore: integer("website_conversion_score"),
  localVisibilityScore: integer("local_visibility_score"),
  aiVisibilityScore: integer("ai_visibility_score"),
  trustProofScore: integer("trust_proof_score"),
  followUpReadinessScore: integer("follow_up_readiness_score"),
  errorMessage: text("error_message"),
  createdAt: createdAt(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const competitors = sqliteTable("competitors", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id),
  competitorUrl: text("competitor_url").notNull(),
  createdAt: createdAt(),
});

export const scanCompetitorResults = sqliteTable("scan_competitor_results", {
  id: id(),
  scanId: text("scan_id")
    .notNull()
    .references(() => scans.id),
  competitorUrl: text("competitor_url").notNull(),
  extractedMetadataJson: text("extracted_metadata_json"),
  comparisonJson: text("comparison_json"),
  createdAt: createdAt(),
});

export const LEAD_LIFECYCLE_STATUSES = [
  "new",
  "viewed_report",
  "requested_help",
  "contacted",
  "booked_call",
  "proposal_sent",
  "won",
  "lost",
] as const;

export const leads = sqliteTable("leads", {
  id: id(),
  scanId: text("scan_id")
    .notNull()
    .references(() => scans.id),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  websiteUrl: text("website_url"),
  industry: text("industry").notNull(),
  city: text("city"),
  state: text("state"),
  score: integer("score"),
  lifecycleStatus: text("lifecycle_status", { enum: LEAD_LIFECYCLE_STATUSES })
    .notNull()
    .default("new"),
  source: text("source", { enum: ["self_serve", "outreach", "demo"] })
    .notNull()
    .default("self_serve"),
  // Marketing attribution (utm_source / ?src=) captured at scan time, if any.
  utmSource: text("utm_source"),
  // Denormalized report highlights so the lead row is self-contained for
  // outreach + future CRM/webhook sync without re-joining scans.
  weakestCategory: text("weakest_category"),
  topProblemsJson: text("top_problems_json"),
  reportUrl: text("report_url"),
  isOutreachTarget: integer("is_outreach_target", { mode: "boolean" })
    .notNull()
    .default(false),
  hotScore: integer("hot_score").notNull().default(0),
  createdAt: createdAt(),
});

export const recommendations = sqliteTable("recommendations", {
  id: id(),
  scanId: text("scan_id")
    .notNull()
    .references(() => scans.id),
  category: text("category", {
    enum: ["conversion", "local", "ai_visibility", "trust", "follow_up"],
  }).notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull(),
  title: text("title").notNull(),
  explanation: text("explanation").notNull(),
  recommendedFix: text("recommended_fix").notNull(),
  greenstarService: text("greenstar_service").notNull(),
  priority: text("priority", { enum: ["this_week", "this_month", "later"] }).notNull(),
  createdAt: createdAt(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  plan: text("plan", { enum: ["free", "starter", "growth", "pro"] }).notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export const emailEvents = sqliteTable("email_events", {
  id: id(),
  organizationId: text("organization_id").references(() => organizations.id),
  scanId: text("scan_id").references(() => scans.id),
  leadId: text("lead_id").references(() => leads.id),
  eventType: text("event_type").notNull(),
  providerMessageId: text("provider_message_id"),
  status: text("status", { enum: ["sent", "mocked", "failed"] }).notNull(),
  createdAt: createdAt(),
});

export const adminNotes = sqliteTable("admin_notes", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id),
  note: text("note").notNull(),
  createdAt: createdAt(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: id(),
  organizationId: text("organization_id").references(() => organizations.id),
  actorUserId: text("actor_user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  payloadJson: text("payload_json"),
  createdAt: createdAt(),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: id(),
  eventType: text("event_type").notNull(),
  path: text("path"),
  scanId: text("scan_id"),
  leadId: text("lead_id"),
  userId: text("user_id"),
  metadataJson: text("metadata_json"),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type Plan = Organization["plan"];
export type LeadLifecycleStatus = (typeof LEAD_LIFECYCLE_STATUSES)[number];

// ===========================================================================
// Outbound prospecting engine (lib/outbound/*). Namespaced `outbound_` so it
// stays independent of the public scanner funnel's `leads` table and can be
// extracted into its own service later without a data migration.
// ===========================================================================

export const OUTBOUND_LEAD_STATUSES = [
  "NEW",
  "QUEUED",
  "ANALYZING",
  "ANALYSIS_FAILED",
  "READY",
  "DISQUALIFIED",
  "ACTIVE_SEQUENCE",
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "DO_NOT_CONTACT",
  "BOUNCED",
  "BOOKED",
  "CUSTOMER",
] as const;

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const outboundLeads = sqliteTable("outbound_leads", {
  id: id(),
  companyName: text("company_name").notNull(),
  contactFirstName: text("contact_first_name"),
  contactLastName: text("contact_last_name"),
  // Lowercased. Null allowed on import (lead is then disqualified for email).
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  // Bare hostname (no www) — dedupe key when email is missing.
  websiteDomain: text("website_domain"),
  industry: text("industry"),
  city: text("city"),
  state: text("state"),
  source: text("source"),
  status: text("status", { enum: OUTBOUND_LEAD_STATUSES }).notNull().default("NEW"),
  priorityScore: integer("priority_score"),
  priorityReasonsJson: text("priority_reasons_json"),
  // Random token for the public unsubscribe link.
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  analysisAttempts: integer("analysis_attempts").notNull().default(0),
  lastError: text("last_error"),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp_ms" }),
  ghlContactId: text("ghl_contact_id"),
  ghlOpportunityId: text("ghl_opportunity_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const outboundLeadAnalyses = sqliteTable("outbound_lead_analyses", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => outboundLeads.id, { onDelete: "cascade" }),
  websiteSummary: text("website_summary").notNull(),
  brandScore: integer("brand_score").notNull(),
  conversionScore: integer("conversion_score").notNull(),
  followupOpportunityScore: integer("followup_opportunity_score").notNull(),
  // AnalysisObservation[]
  observationsJson: text("observations_json").notNull(),
  recommendedAngle: text("recommended_angle").notNull(),
  // Deterministic WebsiteSignals the observations were grounded in.
  signalsJson: text("signals_json").notNull(),
  source: text("source", { enum: ["ai", "fallback"] }).notNull(),
  model: text("model"),
  analyzedAt: integer("analyzed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const OUTBOUND_CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"] as const;

export const outboundCampaigns = sqliteTable("outbound_campaigns", {
  id: id(),
  name: text("name").notNull(),
  niche: text("niche"),
  status: text("status", { enum: OUTBOUND_CAMPAIGN_STATUSES }).notNull().default("DRAFT"),
  // Outbound email provider id (see lib/outbound/email) + its campaign ref.
  provider: text("provider").notNull().default("mock"),
  providerCampaignRef: text("provider_campaign_ref"),
  // SequenceStep[] — day offsets + step intent.
  sequenceJson: text("sequence_json").notNull(),
  dailyLimit: integer("daily_limit").notNull().default(30),
  sendWindowStart: integer("send_window_start").notNull().default(8),
  sendWindowEnd: integer("send_window_end").notNull().default(16),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  // JSON array of ISO weekdays (1 = Mon … 7 = Sun).
  sendDaysJson: text("send_days_json").notNull().default("[1,2,3,4,5]"),
  minDelaySeconds: integer("min_delay_seconds").notNull().default(180),
  requireApproval: integer("require_approval", { mode: "boolean" }).notNull().default(true),
  launchedAt: integer("launched_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const OUTBOUND_CAMPAIGN_LEAD_STATUSES = [
  "PENDING_DRAFT", // waiting for personalized messages to be generated
  "DRAFTED", // messages generated, awaiting review
  "APPROVED", // reviewed; starts when the campaign is ACTIVE
  "ACTIVE", // in sequence
  "COMPLETED", // every step sent, no reply
  "STOPPED", // reply / bounce / unsubscribe / manual
  "FAILED",
] as const;

export const outboundCampaignLeads = sqliteTable("outbound_campaign_leads", {
  id: id(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => outboundCampaigns.id, { onDelete: "cascade" }),
  leadId: text("lead_id")
    .notNull()
    .references(() => outboundLeads.id, { onDelete: "cascade" }),
  status: text("status", { enum: OUTBOUND_CAMPAIGN_LEAD_STATUSES })
    .notNull()
    .default("PENDING_DRAFT"),
  // 0 = nothing sent yet; N = step N was the last one sent.
  currentStep: integer("current_step").notNull().default(0),
  nextSendAt: integer("next_send_at", { mode: "timestamp_ms" }),
  lastContactedAt: integer("last_contacted_at", { mode: "timestamp_ms" }),
  stopReason: text("stop_reason"),
  providerLeadRef: text("provider_lead_ref"),
  draftAttempts: integer("draft_attempts").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const OUTBOUND_MESSAGE_STATUSES = [
  "DRAFT",
  "APPROVED",
  "SENDING",
  "QUEUED_AT_PROVIDER",
  "SENT",
  "FAILED",
  "CANCELLED",
] as const;

export const outboundMessages = sqliteTable("outbound_messages", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => outboundLeads.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => outboundCampaigns.id, { onDelete: "cascade" }),
  campaignLeadId: text("campaign_lead_id")
    .notNull()
    .references(() => outboundCampaignLeads.id, { onDelete: "cascade" }),
  sequenceStep: integer("sequence_step").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: OUTBOUND_MESSAGE_STATUSES }).notNull().default("DRAFT"),
  generationSource: text("generation_source", { enum: ["ai", "fallback", "manual"] }).notNull(),
  // Personalization lint issues found at generation time (string[]).
  lintJson: text("lint_json"),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const OUTBOUND_REPLY_CLASSIFICATIONS = [
  "INTERESTED",
  "QUESTION",
  "NOT_NOW",
  "NOT_INTERESTED",
  "DO_NOT_CONTACT",
  "OUT_OF_OFFICE",
  "UNKNOWN",
] as const;

export const outboundReplies = sqliteTable("outbound_replies", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => outboundLeads.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id").references(() => outboundCampaigns.id, {
    onDelete: "set null",
  }),
  fromEmail: text("from_email"),
  subject: text("subject"),
  content: text("content").notNull(),
  classification: text("classification", { enum: OUTBOUND_REPLY_CLASSIFICATIONS }).notNull(),
  classificationSource: text("classification_source", {
    enum: ["rule", "ai", "manual"],
  }).notNull(),
  confidence: text("confidence", { enum: ["high", "medium", "low"] }).notNull(),
  // Provider event id — dedupes webhook retries.
  providerRef: text("provider_ref").unique(),
  receivedAt: integer("received_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

export const outboundActivities = sqliteTable("outbound_activities", {
  id: id(),
  leadId: text("lead_id").references(() => outboundLeads.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id"),
  // e.g. LEAD_IMPORTED, ANALYSIS_COMPLETED, EMAIL_SENT, WEBSITE_FETCH_FAILED…
  type: text("type").notNull(),
  level: text("level", { enum: ["info", "warn", "error"] }).notNull().default("info"),
  message: text("message"),
  metadataJson: text("metadata_json"),
  createdAt: createdAt(),
});

export const outboundSuppressions = sqliteTable("outbound_suppressions", {
  id: id(),
  // Lowercased email, or "@domain.com" for a whole-domain block.
  value: text("value").notNull().unique(),
  reason: text("reason", {
    enum: ["unsubscribed", "bounced", "do_not_contact", "manual"],
  }).notNull(),
  source: text("source"),
  createdAt: createdAt(),
});

/** Non-secret runtime settings editable from /outbound/settings. */
export const outboundSettings = sqliteTable("outbound_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: updatedAt(),
});

/** Cross-request mutex so overlapping cron ticks never double-send. */
export const outboundLocks = sqliteTable("outbound_locks", {
  name: text("name").primaryKey(),
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }).notNull(),
});

export type OutboundLead = typeof outboundLeads.$inferSelect;
export type OutboundLeadStatus = (typeof OUTBOUND_LEAD_STATUSES)[number];
export type OutboundLeadAnalysis = typeof outboundLeadAnalyses.$inferSelect;
export type OutboundCampaign = typeof outboundCampaigns.$inferSelect;
export type OutboundCampaignLead = typeof outboundCampaignLeads.$inferSelect;
export type OutboundMessage = typeof outboundMessages.$inferSelect;
export type OutboundReply = typeof outboundReplies.$inferSelect;
export type ReplyClassification = (typeof OUTBOUND_REPLY_CLASSIFICATIONS)[number];
