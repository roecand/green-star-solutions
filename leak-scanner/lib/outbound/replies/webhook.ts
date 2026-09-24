import { z } from "zod";

/**
 * Normalizes inbound provider webhooks into one event shape. Two formats:
 *
 * 1. Greenstar generic (used by n8n Gmail/IMAP triggers, or anything you
 *    wire up yourself):
 *    { "type": "reply"|"bounce"|"unsubscribe"|"sent", "email": "...",
 *      "content": "...", "subject": "...", "id": "...", "step": 2 }
 *
 * 2. Smartlead webhooks (event_type EMAIL_REPLY / EMAIL_BOUNCE /
 *    LEAD_UNSUBSCRIBED / EMAIL_SENT). Smartlead's field names vary between
 *    events and versions, so several aliases are accepted — confirm against a
 *    real payload (they're logged on rejection).
 */
export type NormalizedEvent =
  | { type: "reply"; email: string; content: string; subject: string | null; ref: string | null; receivedAt: Date | null }
  | { type: "bounce"; email: string; detail: string | null }
  | { type: "unsubscribe"; email: string }
  | { type: "sent"; email: string; step: number | null; ref: string | null }
  | { type: "ignored"; reason: string };

const genericSchema = z.object({
  type: z.enum(["reply", "bounce", "unsubscribe", "sent"]),
  email: z.string().email(),
  content: z.string().optional(),
  subject: z.string().optional().nullable(),
  id: z.union([z.string(), z.number()]).optional().nullable(),
  step: z.coerce.number().int().optional().nullable(),
  detail: z.string().optional().nullable(),
  receivedAt: z.string().optional().nullable(),
});

const pick = (obj: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const parts = key.split(".");
    let value: unknown = obj;
    for (const p of parts) value = value && typeof value === "object" ? (value as Record<string, unknown>)[p] : undefined;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
};

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeWebhook(body: unknown): NormalizedEvent {
  if (!body || typeof body !== "object") return { type: "ignored", reason: "empty body" };
  const generic = genericSchema.safeParse(body);
  if (generic.success) {
    const g = generic.data;
    const ref = g.id === undefined || g.id === null ? null : String(g.id);
    if (g.type === "reply") {
      if (!g.content?.trim()) return { type: "ignored", reason: "reply without content" };
      return { type: "reply", email: g.email, content: g.content, subject: g.subject ?? null, ref, receivedAt: g.receivedAt ? new Date(g.receivedAt) : null };
    }
    if (g.type === "bounce") return { type: "bounce", email: g.email, detail: g.detail ?? null };
    if (g.type === "unsubscribe") return { type: "unsubscribe", email: g.email };
    return { type: "sent", email: g.email, step: g.step ?? null, ref };
  }

  const b = body as Record<string, unknown>;
  const event = pick(b, ["event_type", "eventType", "event"])?.toUpperCase();
  if (!event) return { type: "ignored", reason: "unrecognized payload" };
  const email = pick(b, ["sl_lead_email", "lead_email", "to_email", "lead.email", "email"]);
  if (!email) return { type: "ignored", reason: `${event} without a lead email` };
  const stepRaw = pick(b, ["sequence_number", "seq_number", "step"]);
  const ref = pick(b, ["message_id", "reply_message.message_id", "stats_id", "event_id", "id"]);

  switch (event) {
    case "EMAIL_REPLY": {
      const html = pick(b, ["reply_message.html", "reply_body", "reply_message.text", "email_body", "preview_text"]);
      if (!html) return { type: "ignored", reason: "EMAIL_REPLY without body" };
      return {
        type: "reply",
        email,
        content: /<[a-z][\s\S]*>/i.test(html) ? htmlToText(html) : html,
        subject: pick(b, ["subject", "reply_message.subject"]),
        ref: ref ? `smartlead:${ref}` : null,
        receivedAt: null,
      };
    }
    case "EMAIL_BOUNCE":
    case "EMAIL_BOUNCED":
      return { type: "bounce", email, detail: pick(b, ["bounce_reason", "reason", "message"]) };
    case "LEAD_UNSUBSCRIBED":
    case "UNSUBSCRIBED":
      return { type: "unsubscribe", email };
    case "EMAIL_SENT":
      return { type: "sent", email, step: stepRaw ? Number(stepRaw) : null, ref };
    default:
      return { type: "ignored", reason: `event ${event} not handled` };
  }
}
