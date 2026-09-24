import { describe, expect, it } from "vitest";
import { buildFallbackSequence, industryLabel } from "@/lib/outbound/personalization/fallback";
import { generateSequence } from "@/lib/outbound/personalization/generate";
import { lintMessage, wordCount } from "@/lib/outbound/personalization/lint";
import { renderEmailText, textToHtml } from "@/lib/outbound/personalization/render";
import { DEFAULT_SEQUENCE, sequenceSchema } from "@/lib/outbound/personalization/sequence";
import type { AnalysisObservation } from "@/lib/outbound/website-analysis/types";

const observations: AnalysisObservation[] = [
  { type: "brand", observation: "The site mentions 180+ reviews, but they don't show up until well down the homepage — someone comparing a few companies may never scroll that far.", evidence: "x", confidence: "high" },
  { type: "brand", observation: "The footer still says © 2014, which can make the site read as unmaintained.", evidence: "x", confidence: "high" },
  { type: "followup", observation: "I couldn't find an obvious way to text the business or get an instant reply — there may be an opportunity to respond to new inquiries faster.", evidence: "x", confidence: "medium" },
];
const ctx = { companyName: "Mike's Heating", sequence: DEFAULT_SEQUENCE };

describe("fallback sequence", () => {
  it("passes lint for every rotation variant", () => {
    for (const id of ["a", "b", "c", "lead-123", "zz-9"]) {
      const messages = buildFallbackSequence({ id, companyName: "Mike's Heating", contactFirstName: "mike", industry: "hvac", city: "Reno" }, observations, DEFAULT_SEQUENCE);
      expect(messages).toHaveLength(4);
      for (const m of messages) expect(lintMessage(m, ctx), `${id} step ${m.step}: ${m.body}`).toEqual([]);
      expect(messages[0].body.startsWith("Hey Mike —")).toBe(true);
      expect(messages[1].subject).toBe(`Re: ${messages[0].subject}`);
    }
  });

  it("uses a neutral greeting without a first name and still names the company", () => {
    const [first] = buildFallbackSequence({ id: "x", companyName: "Acme Roofing", contactFirstName: null, industry: "roofing", city: null }, observations, DEFAULT_SEQUENCE);
    expect(first.body.startsWith("Hi there —")).toBe(true);
    expect(first.body).toContain("Acme Roofing");
    expect(wordCount(first.body)).toBeGreaterThanOrEqual(60);
    expect(wordCount(first.body)).toBeLessThanOrEqual(130);
  });

  it("formats industries", () => {
    expect(industryLabel("hvac")).toBe("HVAC");
    expect(industryLabel(null)).toBe("local");
  });
});

describe("lintMessage", () => {
  const good = buildFallbackSequence({ id: "a", companyName: "Mike's Heating", contactFirstName: "Mike", industry: "hvac", city: null }, observations, DEFAULT_SEQUENCE)[0];
  it("flags generic AI-agency phrasing", () => {
    const issues = lintMessage({ ...good, body: `I hope this email finds you well. We're an AI automation agency. ${good.body}` }, ctx);
    expect(issues.some((i) => i.includes("hope this email finds you well"))).toBe(true);
    expect(issues.some((i) => i.includes("ai automation agency"))).toBe(true);
  });
  it("flags statistics, meeting asks, placeholders, scores and missing CTA", () => {
    expect(lintMessage({ ...good, body: good.body.replace("Hey Mike", "Hey Mike, you lose 40% of calls") }, ctx).join()).toContain("statistic");
    expect(lintMessage({ ...good, body: `${good.body}\n\nAre you free Tuesday at 3pm?` }, ctx).join()).toContain("meeting");
    expect(lintMessage({ ...good, body: good.body.replace("Mike", "{{first_name}}") }, ctx).join()).toContain("placeholder");
    expect(lintMessage({ ...good, body: `${good.body} Your brand score is 40/100?` }, ctx).join()).toContain("scores");
    expect(lintMessage({ ...good, body: good.body.replace(/\?$/, ".") }, ctx).join()).toContain("question CTA");
  });
  it("enforces the 60–130 word range on the initial email", () => {
    expect(lintMessage({ ...good, body: "Hey Mike — Mike's Heating site is dated. Want a mockup?" }, ctx).join()).toContain("target 60–130");
  });
});

describe("generateSequence", () => {
  const lead = { id: "l1", companyName: "Mike's Heating", contactFirstName: "Mike", industry: "hvac", city: "Reno" };
  const base = { lead, observations, recommendedAngle: "Lead with reviews", websiteSummary: "HVAC company", sequence: DEFAULT_SEQUENCE };

  it("uses the template fallback with no LLM", async () => {
    const out = await generateSequence({ ...base, llm: null });
    expect(out.source).toBe("fallback");
    expect(out.messages).toHaveLength(4);
  });

  it("retries once with lint feedback, then accepts clean LLM output", async () => {
    const fallback = buildFallbackSequence({ ...lead, id: "q" }, observations, DEFAULT_SEQUENCE);
    const prompts: string[] = [];
    const llm = {
      provider: "t",
      model: "t",
      complete: async ({ prompt }: { prompt: string }) => {
        prompts.push(prompt);
        const msgs = prompts.length === 1 ? fallback.map((m) => ({ ...m, body: `I hope this finds you well. ${m.body}` })) : fallback;
        return JSON.stringify({ messages: msgs });
      },
    };
    const out = await generateSequence({ ...base, llm });
    expect(out.source).toBe("ai");
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("failed review");
  });

  it("falls back after two failing drafts", async () => {
    const llm = { provider: "t", model: "t", complete: async () => JSON.stringify({ messages: [{ step: 1, subject: "hi", body: "We're an AI automation agency that will 10x your leads." }] }) };
    const out = await generateSequence({ ...base, llm });
    expect(out.source).toBe("fallback");
    expect(out.llmError).toContain("lint");
  });
});

describe("render", () => {
  it("appends signature, postal address and opt-out link", () => {
    const text = renderEmailText("Body here?", "tok123", { name: "Robert", company: "Greenstar Solutions", postalAddress: "123 Main St, Las Vegas, NV", appUrl: "https://app.example.com" });
    expect(text).toContain("123 Main St");
    expect(text).toContain("https://app.example.com/u/tok123");
    expect(textToHtml("a < b\n\nhttps://x.com/u/1")).toContain('<a href="https://x.com/u/1">');
    expect(textToHtml("a < b")).toContain("&lt;");
  });
});

describe("sequenceSchema", () => {
  it("accepts the default and rejects bad ordering", () => {
    expect(sequenceSchema.safeParse(DEFAULT_SEQUENCE).success).toBe(true);
    expect(sequenceSchema.safeParse([{ step: 1, dayOffset: 3, intent: "initial" }]).success).toBe(false);
    expect(sequenceSchema.safeParse([{ step: 1, dayOffset: 0, intent: "initial" }, { step: 2, dayOffset: 0, intent: "bump" }]).success).toBe(false);
  });
});

describe("follow-up-led fallback", () => {
  it("offers a follow-up example, not a website mockup, and passes lint", () => {
    const onlyFollowup = observations.filter((o) => o.type === "followup");
    for (const id of ["a", "b", "c"]) {
      const msgs = buildFallbackSequence({ id, companyName: "Green Star Solutions", contactFirstName: "Robert", industry: "hvac", city: null }, onlyFollowup, DEFAULT_SEQUENCE);
      expect(msgs[0].body).not.toMatch(/mockup/i);
      for (const m of msgs) expect(lintMessage(m, { companyName: "Green Star Solutions", sequence: DEFAULT_SEQUENCE }), m.body).toEqual([]);
    }
  });
});
