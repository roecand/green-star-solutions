import { randomBytes } from "node:crypto";
import type { PerMessageProvider } from "./types";

/** Default provider: records the send, delivers nothing. */
export const mockProvider: PerMessageProvider = {
  id: "mock",
  label: "Mock (simulated — nothing is sent)",
  mode: "per_message",
  simulated: true,
  async send(email) {
    console.log(`[outbound mock send] to=${email.to} step=${email.sequenceStep} subject="${email.subject}"`);
    return { providerMessageId: `mock_${randomBytes(8).toString("hex")}` };
  },
};
