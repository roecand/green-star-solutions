import { mockProvider } from "./mock";
import { n8nProvider } from "./n8n";
import { smartleadProvider } from "./smartlead";
import type { OutboundEmailProvider } from "./types";

const PROVIDERS: Record<string, OutboundEmailProvider> = {
  mock: mockProvider,
  n8n: n8nProvider,
  smartlead: smartleadProvider,
};

export function getEmailProvider(id: string): OutboundEmailProvider {
  return PROVIDERS[id] ?? mockProvider;
}

/** Providers selectable in the UI, with whether their env config is present. */
export function listEmailProviders(): Array<{ id: string; label: string; configured: boolean; mode: string }> {
  return [
    { id: "mock", label: mockProvider.label, configured: true, mode: mockProvider.mode },
    { id: "n8n", label: n8nProvider.label, configured: !!process.env.OUTBOUND_N8N_SEND_WEBHOOK_URL, mode: n8nProvider.mode },
    { id: "smartlead", label: smartleadProvider.label, configured: !!process.env.SMARTLEAD_API_KEY, mode: smartleadProvider.mode },
  ];
}

export type { OutboundEmailProvider } from "./types";
