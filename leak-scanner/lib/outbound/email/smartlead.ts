import { z } from "zod";
import { fetchJson, HttpError } from "../core/http";
import { ProviderError, type SequencePushProvider } from "./types";

/**
 * Smartlead adapter (sequence_push). Setup, once per Greenstar campaign:
 * create a Smartlead campaign whose sequence steps use the custom fields
 *   subject: {{gs_subject_1}}   body: {{gs_body_1}}
 *   subject: (blank → threads)  body: {{gs_body_2}}   delay 3 days
 *   … one step per Greenstar sequence step, same day offsets …
 * then paste its numeric campaign id into the Greenstar campaign.
 *
 * API: https://server.smartlead.ai/api/v1, auth via ?api_key=.
 * NOTE: add-leads is verified against Smartlead's docs; the pause-lead and
 * campaign-status endpoints are from their API reference but have NOT been
 * exercised against a live account yet — test with one lead first.
 */
const BASE = "https://server.smartlead.ai/api/v1";

const addLeadsResponse = z.object({
  added_count: z.number().optional(),
  skipped_count: z.number().optional(),
  lead_ids: z.array(z.union([z.number(), z.string(), z.object({ id: z.union([z.number(), z.string()]) }).passthrough()])).optional(),
  message: z.string().optional(),
}).passthrough();

function apiUrl(path: string): string {
  const key = process.env.SMARTLEAD_API_KEY;
  if (!key) throw new ProviderError("SMARTLEAD_API_KEY is not set", false);
  return `${BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(key)}`;
}

function wrap(error: unknown, action: string): never {
  if (error instanceof ProviderError) throw error;
  if (error instanceof HttpError) {
    throw new ProviderError(`Smartlead ${action} failed: ${error.message} ${error.body}`, error.status === 0 || error.status === 429 || error.status >= 500);
  }
  throw new ProviderError(`Smartlead ${action} failed: ${(error as Error).message}`, false);
}

export const smartleadProvider: SequencePushProvider = {
  id: "smartlead",
  label: "Smartlead (sequence runs in Smartlead)",
  mode: "sequence_push",
  simulated: false,

  async enrollLead({ providerCampaignRef, lead, steps }) {
    const customFields: Record<string, string> = {};
    for (const step of steps) {
      customFields[`gs_subject_${step.step}`] = step.subject;
      customFields[`gs_body_${step.step}`] = step.html;
    }
    try {
      const raw = await fetchJson(apiUrl(`/campaigns/${encodeURIComponent(providerCampaignRef)}/leads`), {
        method: "POST",
        body: {
          lead_list: [
            {
              email: lead.email,
              first_name: lead.firstName ?? "",
              last_name: lead.lastName ?? "",
              company_name: lead.companyName,
              website: lead.website ?? "",
              phone_number: lead.phone ?? "",
              custom_fields: customFields,
            },
          ],
          settings: {
            // Always honor Smartlead's block/unsubscribe lists too.
            ignore_global_block_list: false,
            ignore_unsubscribe_list: false,
            ignore_duplicate_leads_in_other_campaign: false,
            return_lead_ids: true,
          },
        },
      });
      const parsed = addLeadsResponse.parse(raw);
      if (parsed.added_count === 0) {
        throw new ProviderError(`Smartlead skipped the lead (${parsed.message ?? "duplicate or blocked"})`, false);
      }
      const first = parsed.lead_ids?.[0];
      const ref = first === undefined ? null : typeof first === "object" ? String(first.id) : String(first);
      return { providerLeadRef: ref };
    } catch (error) {
      wrap(error, "add lead");
    }
  },

  async stopLead({ providerCampaignRef, providerLeadRef }) {
    if (!providerLeadRef) {
      throw new ProviderError("No Smartlead lead id stored — pause this lead manually in Smartlead", false);
    }
    try {
      await fetchJson(
        apiUrl(`/campaigns/${encodeURIComponent(providerCampaignRef)}/leads/${encodeURIComponent(providerLeadRef)}/pause`),
        { method: "POST", body: {} }
      );
    } catch (error) {
      wrap(error, "pause lead");
    }
  },

  async setCampaignPaused(providerCampaignRef, paused) {
    try {
      await fetchJson(apiUrl(`/campaigns/${encodeURIComponent(providerCampaignRef)}/status`), {
        method: "POST",
        body: { status: paused ? "PAUSED" : "START" },
      });
    } catch (error) {
      wrap(error, "set campaign status");
    }
  },
};
