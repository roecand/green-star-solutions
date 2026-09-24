CREATE TABLE `outbound_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text,
	`campaign_id` text,
	`type` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text,
	`metadata_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `outbound_leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `outbound_campaign_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`lead_id` text NOT NULL,
	`status` text DEFAULT 'PENDING_DRAFT' NOT NULL,
	`current_step` integer DEFAULT 0 NOT NULL,
	`next_send_at` integer,
	`last_contacted_at` integer,
	`stop_reason` text,
	`provider_lead_ref` text,
	`draft_attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `outbound_campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_id`) REFERENCES `outbound_leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `outbound_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`niche` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`provider` text DEFAULT 'mock' NOT NULL,
	`provider_campaign_ref` text,
	`sequence_json` text NOT NULL,
	`daily_limit` integer DEFAULT 30 NOT NULL,
	`send_window_start` integer DEFAULT 8 NOT NULL,
	`send_window_end` integer DEFAULT 16 NOT NULL,
	`timezone` text DEFAULT 'America/Los_Angeles' NOT NULL,
	`send_days_json` text DEFAULT '[1,2,3,4,5]' NOT NULL,
	`min_delay_seconds` integer DEFAULT 180 NOT NULL,
	`require_approval` integer DEFAULT true NOT NULL,
	`launched_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outbound_lead_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`website_summary` text NOT NULL,
	`brand_score` integer NOT NULL,
	`conversion_score` integer NOT NULL,
	`followup_opportunity_score` integer NOT NULL,
	`observations_json` text NOT NULL,
	`recommended_angle` text NOT NULL,
	`signals_json` text NOT NULL,
	`source` text NOT NULL,
	`model` text,
	`analyzed_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `outbound_leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `outbound_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`contact_first_name` text,
	`contact_last_name` text,
	`email` text,
	`phone` text,
	`website` text,
	`website_domain` text,
	`industry` text,
	`city` text,
	`state` text,
	`source` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`priority_score` integer,
	`priority_reasons_json` text,
	`unsubscribe_token` text NOT NULL,
	`analysis_attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`last_activity_at` integer,
	`ghl_contact_id` text,
	`ghl_opportunity_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_leads_unsubscribe_token_unique` ON `outbound_leads` (`unsubscribe_token`);--> statement-breakpoint
CREATE TABLE `outbound_locks` (
	`name` text PRIMARY KEY NOT NULL,
	`locked_until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outbound_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`campaign_lead_id` text NOT NULL,
	`sequence_step` integer NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`generation_source` text NOT NULL,
	`lint_json` text,
	`provider_message_id` text,
	`error` text,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `outbound_leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `outbound_campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_lead_id`) REFERENCES `outbound_campaign_leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `outbound_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`campaign_id` text,
	`from_email` text,
	`subject` text,
	`content` text NOT NULL,
	`classification` text NOT NULL,
	`classification_source` text NOT NULL,
	`confidence` text NOT NULL,
	`provider_ref` text,
	`received_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `outbound_leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `outbound_campaigns`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_replies_provider_ref_unique` ON `outbound_replies` (`provider_ref`);--> statement-breakpoint
CREATE TABLE `outbound_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outbound_suppressions` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`reason` text NOT NULL,
	`source` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_suppressions_value_unique` ON `outbound_suppressions` (`value`);--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_campaign_leads_campaign_lead_unique` ON `outbound_campaign_leads` (`campaign_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `outbound_campaign_leads_due_idx` ON `outbound_campaign_leads` (`status`,`next_send_at`);--> statement-breakpoint
CREATE INDEX `outbound_leads_status_idx` ON `outbound_leads` (`status`);--> statement-breakpoint
CREATE INDEX `outbound_leads_email_idx` ON `outbound_leads` (`email`);--> statement-breakpoint
CREATE INDEX `outbound_messages_campaign_lead_idx` ON `outbound_messages` (`campaign_lead_id`,`sequence_step`);--> statement-breakpoint
CREATE INDEX `outbound_activities_lead_idx` ON `outbound_activities` (`lead_id`,`created_at`);
