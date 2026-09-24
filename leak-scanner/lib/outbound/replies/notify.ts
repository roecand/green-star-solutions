import { sendEmail } from "@/lib/email/send";
import { logActivity } from "../core/activity";

/**
 * Notifies Robert. Uses the app's existing Resend adapter (logged + recorded
 * as "mocked" when RESEND_API_KEY is unset), to OUTBOUND_NOTIFY_EMAIL or
 * ADMIN_NOTIFICATION_EMAIL.
 */
export async function notifyOwner(input: { leadId: string; subject: string; lines: string[] }): Promise<void> {
  const to = process.env.OUTBOUND_NOTIFY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const link = `${appUrl}/outbound/leads/${input.leadId}`;
  await logActivity({ leadId: input.leadId, type: "OWNER_NOTIFIED", message: input.subject });
  if (!to) return;
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  try {
    await sendEmail({
      to,
      subject: input.subject,
      eventType: "outbound_owner_notification",
      html: `${input.lines.map((l) => `<p style="white-space:pre-wrap">${escape(l)}</p>`).join("")}<p><a href="${link}">Open lead in Greenstar →</a></p>`,
    });
  } catch (error) {
    await logActivity({ leadId: input.leadId, type: "NOTIFICATION_FAILED", level: "error", message: (error as Error).message });
  }
}
