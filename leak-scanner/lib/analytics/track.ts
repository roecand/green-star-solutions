import { db, schema } from "@/lib/db";

export type AnalyticsEventType =
  | "landing_visit"
  // Canonical funnel events (traffic → scan → report → deep audit → fix-plan booking).
  | "scan_started"
  | "scan_completed"
  | "scan_deepened"
  | "fix_plan_clicked"
  | "report_view"
  | "cta_click"
  | "signup"
  | "upgrade"
  | "help_request"
  | "email_report_request";

/**
 * Internal analytics: one row per event. Fire-and-forget — analytics must
 * never break a user-facing flow.
 */
export function trackEvent(event: {
  eventType: AnalyticsEventType;
  path?: string;
  scanId?: string;
  leadId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): void {
  db.insert(schema.analyticsEvents)
    .values({
      eventType: event.eventType,
      path: event.path,
      scanId: event.scanId,
      leadId: event.leadId,
      userId: event.userId,
      metadataJson: event.metadata ? JSON.stringify(event.metadata) : null,
    })
    .run()
    .catch((error) => console.error("analytics tracking failed", error));
}
