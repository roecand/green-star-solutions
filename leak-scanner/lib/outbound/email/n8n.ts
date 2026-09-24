import { z } from "zod";
import { fetchJson, HttpError } from "../core/http";
import { ProviderError, type PerMessageProvider } from "./types";

const responseSchema = z.object({ providerMessageId: z.string().min(1) }).or(z.object({ id: z.string().min(1) }));

/**
 * Sends through an n8n workflow (Webhook → Gmail/Outlook/SMTP node → Respond
 * to Webhook with {"providerMessageId": "..."}). Lets you send from your real
 * Google Workspace mailbox without building SMTP infrastructure here.
 * See docs/outbound/n8n.md.
 */
export const n8nProvider: PerMessageProvider = {
  id: "n8n",
  label: "n8n webhook (your mailbox via n8n)",
  mode: "per_message",
  simulated: false,
  async send(email) {
    const url = process.env.OUTBOUND_N8N_SEND_WEBHOOK_URL;
    if (!url) throw new ProviderError("OUTBOUND_N8N_SEND_WEBHOOK_URL is not set", false);
    try {
      const raw = await fetchJson(url, {
        method: "POST",
        maxRetries: 1,
        headers: process.env.OUTBOUND_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.OUTBOUND_WEBHOOK_SECRET}` }
          : {},
        body: {
          to: email.to,
          toName: email.toName,
          subject: email.subject,
          text: email.text,
          html: email.html,
          headers: {
            "List-Unsubscribe": `<${email.oneClickUnsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          threadProviderMessageId: email.threadProviderMessageId,
          greenstarMessageId: email.messageId,
          leadId: email.leadId,
          sequenceStep: email.sequenceStep,
        },
      });
      const parsed = responseSchema.parse(raw);
      return { providerMessageId: "providerMessageId" in parsed ? parsed.providerMessageId : parsed.id };
    } catch (error) {
      if (error instanceof HttpError) {
        throw new ProviderError(`n8n send failed: ${error.message} ${error.body}`, error.status === 0 || error.status >= 500 || error.status === 429);
      }
      throw new ProviderError(`n8n send failed: ${(error as Error).message}`, false);
    }
  },
};
