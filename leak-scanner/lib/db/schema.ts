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
  websiteUrl: text("website_url").notNull(),
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
  websiteUrl: text("website_url").notNull(),
  industry: text("industry").notNull(),
  city: text("city"),
  state: text("state"),
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
  websiteUrl: text("website_url").notNull(),
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
