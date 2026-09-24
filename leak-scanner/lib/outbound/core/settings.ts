import { db, schema } from "@/lib/db";

/**
 * Non-secret knobs editable from /outbound/settings. Secrets (API keys,
 * tokens) are env-only and never stored here or sent to the browser.
 */
export interface OutboundSettings {
  /** Hard cap across ALL campaigns for the sending mailbox/account per day. */
  mailboxDailyLimit: number;
  /** Leads analyzed per scheduler tick (each is several HTTP fetches + an LLM call). */
  analysisBatchSize: number;
  /** Campaign leads drafted per tick. */
  draftBatchSize: number;
  /** Leads scoring below this are DISQUALIFIED instead of READY. */
  minPriorityScore: number;
  /** Comma-separated industries Greenstar targets (lowercase match). */
  targetIndustries: string[];
}

export const DEFAULT_SETTINGS: OutboundSettings = {
  mailboxDailyLimit: 40,
  analysisBatchSize: 5,
  draftBatchSize: 5,
  minPriorityScore: 50,
  targetIndustries: [
    "hvac",
    "plumbing",
    "roofing",
    "electrical",
    "landscaping",
    "med spa",
    "dental",
    "pest control",
    "garage door",
    "pool",
    "solar",
    "remodeling",
    "restoration",
  ],
};

export async function getOutboundSettings(): Promise<OutboundSettings> {
  const rows = await db.select().from(schema.outboundSettings).all();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: keyof OutboundSettings, fallback: number) => {
    const n = Number(map.get(key));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const industries = map.get("targetIndustries");
  return {
    mailboxDailyLimit: num("mailboxDailyLimit", DEFAULT_SETTINGS.mailboxDailyLimit),
    analysisBatchSize: Math.max(1, num("analysisBatchSize", DEFAULT_SETTINGS.analysisBatchSize)),
    draftBatchSize: Math.max(1, num("draftBatchSize", DEFAULT_SETTINGS.draftBatchSize)),
    minPriorityScore: num("minPriorityScore", DEFAULT_SETTINGS.minPriorityScore),
    targetIndustries: industries
      ? industries.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : DEFAULT_SETTINGS.targetIndustries,
  };
}

export async function saveOutboundSettings(settings: OutboundSettings): Promise<void> {
  const entries: Array<[string, string]> = [
    ["mailboxDailyLimit", String(settings.mailboxDailyLimit)],
    ["analysisBatchSize", String(settings.analysisBatchSize)],
    ["draftBatchSize", String(settings.draftBatchSize)],
    ["minPriorityScore", String(settings.minPriorityScore)],
    ["targetIndustries", settings.targetIndustries.join(",")],
  ];
  for (const [key, value] of entries) {
    await db
      .insert(schema.outboundSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.outboundSettings.key, set: { value, updatedAt: new Date() } })
      .run();
  }
}
