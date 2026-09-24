import { randomBytes } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { logActivity } from "../core/activity";
import { isSuppressed, loadSuppressionSet } from "../replies/suppression";
import { parseCsvRecords } from "./csv";
import { dedupeKey, normalizeRecord, websiteDomain, type LeadInput } from "./normalize";

export interface ImportReport {
  totalRows: number;
  imported: number;
  duplicates: number;
  suppressed: number;
  invalid: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
  leadIds: string[];
}

export const MAX_IMPORT_ROWS = 2000;

export async function importLeadsFromCsv(csv: string, source = "csv"): Promise<ImportReport> {
  const { records } = parseCsvRecords(csv);
  if (records.length > MAX_IMPORT_ROWS) {
    throw new Error(`CSV has ${records.length} rows; the limit per import is ${MAX_IMPORT_ROWS}.`);
  }
  const report: ImportReport = {
    totalRows: records.length,
    imported: 0,
    duplicates: 0,
    suppressed: 0,
    invalid: [],
    warnings: [],
    leadIds: [],
  };

  const valid: Array<{ row: number; lead: LeadInput }> = [];
  records.forEach((record, index) => {
    const row = index + 2; // 1-based + header row
    const result = normalizeRecord(record, source);
    if (!result.ok) {
      report.invalid.push({ row, error: result.error });
      return;
    }
    result.warnings.forEach((warning) => report.warnings.push({ row, warning }));
    valid.push({ row, lead: result.lead });
  });

  const inserted = await insertLeads(valid.map((v) => v.lead));
  report.imported = inserted.leadIds.length;
  report.duplicates = inserted.duplicates;
  report.suppressed = inserted.suppressed;
  report.leadIds = inserted.leadIds;
  return report;
}

/**
 * Inserts leads, skipping duplicates (within the batch and against the DB)
 * and flagging suppressed addresses DO_NOT_CONTACT on the way in.
 */
export async function insertLeads(leads: LeadInput[]): Promise<{
  leadIds: string[];
  duplicates: number;
  suppressed: number;
}> {
  const existing = await existingKeys(leads);
  const suppressions = await loadSuppressionSet();
  const seen = new Set<string>();
  const leadIds: string[] = [];
  let duplicates = 0;
  let suppressed = 0;

  for (const lead of leads) {
    const key = dedupeKey(lead);
    if (key && (seen.has(key) || existing.has(key))) {
      duplicates++;
      continue;
    }
    if (key) seen.add(key);
    const isBlocked = isSuppressed(lead.email, suppressions);
    if (isBlocked) suppressed++;

    const row = await db
      .insert(schema.outboundLeads)
      .values({
        ...lead,
        websiteDomain: websiteDomain(lead.website),
        status: isBlocked ? "DO_NOT_CONTACT" : "NEW",
        unsubscribeToken: randomBytes(18).toString("base64url"),
      })
      .returning({ id: schema.outboundLeads.id })
      .get();
    leadIds.push(row.id);
    await logActivity({
      leadId: row.id,
      type: "LEAD_IMPORTED",
      message: isBlocked ? "Imported — address is on the suppression list" : `Imported from ${lead.source ?? "manual"}`,
    });
  }
  return { leadIds, duplicates, suppressed };
}

async function existingKeys(leads: LeadInput[]): Promise<Set<string>> {
  const emails = leads.map((l) => l.email).filter((e): e is string => !!e);
  const domains = leads
    .filter((l) => !l.email)
    .map((l) => websiteDomain(l.website))
    .filter((d): d is string => !!d);
  const keys = new Set<string>();
  for (let i = 0; i < emails.length; i += 500) {
    const rows = await db
      .select({ email: schema.outboundLeads.email })
      .from(schema.outboundLeads)
      .where(inArray(schema.outboundLeads.email, emails.slice(i, i + 500)))
      .all();
    rows.forEach((r) => r.email && keys.add(`email:${r.email}`));
  }
  for (let i = 0; i < domains.length; i += 500) {
    const rows = await db
      .select({ domain: schema.outboundLeads.websiteDomain })
      .from(schema.outboundLeads)
      .where(inArray(schema.outboundLeads.websiteDomain, domains.slice(i, i + 500)))
      .all();
    rows.forEach((r) => r.domain && keys.add(`domain:${r.domain}`));
  }
  return keys;
}
