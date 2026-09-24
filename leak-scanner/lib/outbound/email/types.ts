/**
 * Outbound email provider adapters. Two shapes, because cold-email platforms
 * genuinely work two ways:
 *
 * - per_message: WE own the schedule; the provider sends one email when told
 *   (mock, n8n → Gmail/Workspace/SMTP node). Our send windows, daily caps,
 *   delays and stop rules apply directly.
 * - sequence_push: the PLATFORM owns the schedule (Smartlead/Instantly). We
 *   push the lead once with every personalized step as custom fields; the
 *   platform handles timing, mailbox rotation and warmup; webhooks report
 *   sends/replies/bounces back; we stop the lead via API on reply/opt-out.
 */
export interface RenderedEmail {
  to: string;
  toName: string | null;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl: string;
  /** RFC 8058 one-click endpoint for the List-Unsubscribe header (POST). */
  oneClickUnsubscribeUrl: string;
  /** Our outbound_messages.id — idempotency key for the provider. */
  messageId: string;
  leadId: string;
  sequenceStep: number;
  /** Provider id of the first email in the thread, for threading follow-ups. */
  threadProviderMessageId: string | null;
}

export interface PerMessageProvider {
  id: string;
  label: string;
  mode: "per_message";
  /** true = nothing actually leaves the building. */
  simulated: boolean;
  send(email: RenderedEmail): Promise<{ providerMessageId: string }>;
}

export interface PushedStep {
  step: number;
  subject: string;
  text: string;
  html: string;
}

export interface SequencePushProvider {
  id: string;
  label: string;
  mode: "sequence_push";
  simulated: false;
  enrollLead(args: {
    providerCampaignRef: string;
    lead: { email: string; firstName: string | null; lastName: string | null; companyName: string; website: string | null; phone: string | null };
    steps: PushedStep[];
  }): Promise<{ providerLeadRef: string | null }>;
  stopLead(args: { providerCampaignRef: string; providerLeadRef: string | null; email: string }): Promise<void>;
  setCampaignPaused?(providerCampaignRef: string, paused: boolean): Promise<void>;
}

export type OutboundEmailProvider = PerMessageProvider | SequencePushProvider;

export class ProviderError extends Error {
  constructor(
    message: string,
    /** false = retrying will not help (bad address, auth, validation). */
    readonly retryable: boolean
  ) {
    super(message);
  }
}
