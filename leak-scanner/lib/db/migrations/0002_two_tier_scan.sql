PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`business_name` text NOT NULL,
	`website_url` text,
	`industry` text NOT NULL,
	`city` text,
	`state` text,
	`phone` text,
	`email` text,
	`primary_goal` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_businesses`("id", "organization_id", "business_name", "website_url", "industry", "city", "state", "phone", "email", "primary_goal", "created_at") SELECT "id", "organization_id", "business_name", "website_url", "industry", "city", "state", "phone", "email", "primary_goal", "created_at" FROM `businesses`;--> statement-breakpoint
DROP TABLE `businesses`;--> statement-breakpoint
ALTER TABLE `__new_businesses` RENAME TO `businesses`;--> statement-breakpoint
CREATE TABLE `__new_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`scan_id` text NOT NULL,
	`business_name` text NOT NULL,
	`contact_name` text,
	`email` text,
	`phone` text,
	`website_url` text,
	`industry` text NOT NULL,
	`city` text,
	`state` text,
	`score` integer,
	`lifecycle_status` text DEFAULT 'new' NOT NULL,
	`source` text DEFAULT 'self_serve' NOT NULL,
	`utm_source` text,
	`weakest_category` text,
	`top_problems_json` text,
	`report_url` text,
	`is_outreach_target` integer DEFAULT false NOT NULL,
	`hot_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`scan_id`) REFERENCES `scans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_leads`("id", "scan_id", "business_name", "contact_name", "email", "phone", "website_url", "industry", "city", "state", "score", "lifecycle_status", "source", "utm_source", "weakest_category", "top_problems_json", "report_url", "is_outreach_target", "hot_score", "created_at") SELECT "id", "scan_id", "business_name", "contact_name", "email", "phone", "website_url", "industry", "city", "state", "score", "lifecycle_status", "source", "utm_source", "weakest_category", "top_problems_json", "report_url", "is_outreach_target", "hot_score", "created_at" FROM `leads`;--> statement-breakpoint
DROP TABLE `leads`;--> statement-breakpoint
ALTER TABLE `__new_leads` RENAME TO `leads`;--> statement-breakpoint
CREATE TABLE `__new_scans` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`share_token` text NOT NULL,
	`website_url` text,
	`industry` text NOT NULL,
	`city` text,
	`state` text,
	`depth` text DEFAULT 'quick' NOT NULL,
	`intake_json` text,
	`progress_stage` text,
	`raw_html_snapshot` text,
	`extracted_text` text,
	`extracted_metadata_json` text,
	`deterministic_findings_json` text,
	`ai_report_json` text,
	`ai_source` text,
	`revenue_leak_score` integer,
	`website_conversion_score` integer,
	`local_visibility_score` integer,
	`ai_visibility_score` integer,
	`trust_proof_score` integer,
	`follow_up_readiness_score` integer,
	`error_message` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_scans`("id", "business_id", "status", "share_token", "website_url", "industry", "city", "state", "depth", "intake_json", "progress_stage", "raw_html_snapshot", "extracted_text", "extracted_metadata_json", "deterministic_findings_json", "ai_report_json", "ai_source", "revenue_leak_score", "website_conversion_score", "local_visibility_score", "ai_visibility_score", "trust_proof_score", "follow_up_readiness_score", "error_message", "created_at", "completed_at") SELECT "id", "business_id", "status", "share_token", "website_url", "industry", "city", "state", 'quick', NULL, "progress_stage", "raw_html_snapshot", "extracted_text", "extracted_metadata_json", "deterministic_findings_json", "ai_report_json", "ai_source", "revenue_leak_score", "website_conversion_score", "local_visibility_score", "ai_visibility_score", "trust_proof_score", "follow_up_readiness_score", "error_message", "created_at", "completed_at" FROM `scans`;--> statement-breakpoint
DROP TABLE `scans`;--> statement-breakpoint
ALTER TABLE `__new_scans` RENAME TO `scans`;--> statement-breakpoint
CREATE UNIQUE INDEX `scans_share_token_unique` ON `scans` (`share_token`);--> statement-breakpoint
PRAGMA foreign_keys=ON;