import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Failure codes surfaced in the dashboard log. Keep these stable — they are
 * what you grep for when something in the pipeline goes wrong.
 */
export const OUTBOUND_ERROR_CODES = [
  "WEBSITE_FETCH_FAILED",
  "ANALYSIS_FAILED",
  "MESSAGE_GENERATION_FAILED",
  "EMAIL_SEND_FAILED",
  "CRM_SYNC_FAILED",
  "REPLY_CLASSIFICATION_FAILED",
  "WEBHOOK_REJECTED",
  "NOTIFICATION_FAILED",
] as const;
export type OutboundErrorCode = (typeof OUTBOUND_ERROR_CODES)[number];

export interface ActivityInput {
  leadId?: string | null;
  campaignId?: string | null;
  type: string;
  level?: "info" | "warn" | "error";
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records a timeline/log entry. Never throws — logging must not take down the
 * pipeline step it is describing.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  const level = input.level ?? "info";
  if (level === "error") {
    console.error(`[outbound] ${input.type}: ${input.message ?? ""}`, input.metadata ?? "");
  }
  try {
    await db
      .insert(schema.outboundActivities)
      .values({
        leadId: input.leadId ?? null,
        campaignId: input.campaignId ?? null,
        type: input.type,
        level,
        message: input.message ?? null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      })
      .run();
    if (input.leadId) {
      await db
        .update(schema.outboundLeads)
        .set({ lastActivityAt: new Date() })
        .where(eq(schema.outboundLeads.id, input.leadId))
        .run();
    }
  } catch (error) {
    console.error("[outbound] activity log write failed", error);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
