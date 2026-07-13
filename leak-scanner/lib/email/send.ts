import { db, schema } from "@/lib/db";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  eventType: string;
  scanId?: string;
  leadId?: string;
  organizationId?: string;
}

/**
 * Sends via Resend when RESEND_API_KEY is set; otherwise logs and records a
 * mocked email event so flows stay testable with zero keys. Email must never
 * break a user-facing flow.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  let status: "sent" | "mocked" | "failed" = "mocked";
  let providerMessageId: string | null = null;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Greenstar Scanner <onboarding@resend.dev>",
        to: message.to,
        subject: message.subject,
        html: message.html,
      });
      if (result.error) throw new Error(result.error.message);
      status = "sent";
      providerMessageId = result.data?.id ?? null;
    } catch (error) {
      console.error("email send failed", error);
      status = "failed";
    }
  } else {
    console.log(`[email mocked] to=${message.to} subject="${message.subject}"`);
  }

  try {
    db.insert(schema.emailEvents)
      .values({
        eventType: message.eventType,
        scanId: message.scanId,
        leadId: message.leadId,
        organizationId: message.organizationId,
        providerMessageId,
        status,
      })
      .run();
  } catch (error) {
    console.error("email event record failed", error);
  }
}

export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
