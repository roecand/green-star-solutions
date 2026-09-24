import { describe, expect, it } from "vitest";
import { classifyReply } from "@/lib/outbound/reply-classification/classify";
import { classifyByRules, stripQuoted } from "@/lib/outbound/reply-classification/rules";
import { normalizeWebhook } from "@/lib/outbound/replies/webhook";

const cases: Array<[string, string]> = [
  ["Yes please, send it over.", "INTERESTED"],
  ["sure", "INTERESTED"],
  ["I'd love to see the mockup", "INTERESTED"],
  ["Sounds good but how much does this cost?", "QUESTION"],
  ["Who is this?", "QUESTION"],
  ["Not interested, thanks.", "NOT_INTERESTED"],
  ["We're all set with our current web guy.", "NOT_INTERESTED"],
  ["Busy season right now — reach out in a few months.", "NOT_NOW"],
  ["Please remove me from your list.", "DO_NOT_CONTACT"],
  ["Not interested. Stop emailing me.", "DO_NOT_CONTACT"],
  ["STOP", "DO_NOT_CONTACT"],
  ["I am currently out of the office and will return on Monday.", "OUT_OF_OFFICE"],
];

describe("classifyByRules", () => {
  for (const [text, expected] of cases) {
    it(`"${text}" → ${expected}`, () => {
      expect(classifyByRules(text)?.classification).toBe(expected);
    });
  }

  it("ignores quoted history when classifying", () => {
    const reply = "No thanks.\n\nOn Tue, Sep 22, 2026 at 9:14 AM Robert <robert@greenstar.com> wrote:\n> Want me to send it? Yes?";
    expect(stripQuoted(reply)).toBe("No thanks.");
    expect(classifyByRules(reply)?.classification).toBe("NOT_INTERESTED");
  });

  it("returns null for ambiguous text so the LLM decides", () => {
    expect(classifyByRules("Forwarding this to my office manager Jen.")).toBeNull();
  });
});

describe("classifyReply", () => {
  it("never lets the LLM override a high-confidence opt-out", async () => {
    const llm = { provider: "t", model: "t", complete: async () => '{"classification":"INTERESTED","confidence":"high","reason":"x"}' };
    expect((await classifyReply("unsubscribe", llm)).classification).toBe("DO_NOT_CONTACT");
  });
  it("uses the LLM for ambiguous replies and UNKNOWN without one", async () => {
    const llm = { provider: "t", model: "t", complete: async () => '{"classification":"QUESTION","confidence":"medium","reason":"routing"}' };
    const ai = await classifyReply("Forwarding this to my office manager Jen.", llm);
    expect(ai).toMatchObject({ classification: "QUESTION", source: "ai" });
    expect((await classifyReply("Forwarding this to Jen.", null)).classification).toBe("UNKNOWN");
  });
});

describe("normalizeWebhook", () => {
  it("parses the generic format", () => {
    expect(normalizeWebhook({ type: "reply", email: "a@b.com", content: "yes", id: 7 })).toMatchObject({ type: "reply", ref: "7" });
    expect(normalizeWebhook({ type: "bounce", email: "a@b.com" })).toMatchObject({ type: "bounce" });
  });
  it("parses Smartlead events with field aliases", () => {
    const reply = normalizeWebhook({ event_type: "EMAIL_REPLY", sl_lead_email: "a@b.com", reply_message: { html: "<p>Yes, send it</p><p>Thanks</p>", message_id: "m1" } });
    expect(reply).toMatchObject({ type: "reply", email: "a@b.com", ref: "smartlead:m1" });
    expect(reply.type === "reply" && reply.content).toContain("Yes, send it");
    expect(normalizeWebhook({ event_type: "LEAD_UNSUBSCRIBED", lead_email: "a@b.com" })).toMatchObject({ type: "unsubscribe" });
    expect(normalizeWebhook({ event_type: "EMAIL_SENT", to_email: "a@b.com", sequence_number: 2 })).toMatchObject({ type: "sent", step: 2 });
    expect(normalizeWebhook({ event_type: "EMAIL_OPEN", to_email: "a@b.com" }).type).toBe("ignored");
    expect(normalizeWebhook({ foo: 1 }).type).toBe("ignored");
  });
});
