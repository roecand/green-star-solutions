import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export interface OutboundMetrics {
  leadsImported: number;
  leadsAnalyzed: number;
  activeSequences: number;
  emailsSent: number;
  leadsContacted: number;
  leadsReplied: number;
  positiveReplies: number;
  booked: number;
  responseRate: number | null;
  positiveResponseRate: number | null;
  statusCounts: Record<string, number>;
  awaitingReview: number;
}

const count = (expr = sql<number>`count(*)`) => ({ n: expr });

/** Rates only count replies from leads we actually emailed. */
const contactedLeadIds = () =>
  db
    .selectDistinct({ id: schema.outboundMessages.leadId })
    .from(schema.outboundMessages)
    .where(inArray(schema.outboundMessages.status, ["SENT", "QUEUED_AT_PROVIDER"]));

export function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export async function getOutboundMetrics(): Promise<OutboundMetrics> {
  const [imported, analyzed, active, sent, contacted, replied, positive, byStatus, awaiting] = await Promise.all([
    db.select(count()).from(schema.outboundLeads).get(),
    db.select(count(sql<number>`count(distinct ${schema.outboundLeadAnalyses.leadId})`)).from(schema.outboundLeadAnalyses).get(),
    db.select(count()).from(schema.outboundCampaignLeads).where(eq(schema.outboundCampaignLeads.status, "ACTIVE")).get(),
    db.select(count()).from(schema.outboundMessages).where(eq(schema.outboundMessages.status, "SENT")).get(),
    db
      .select(count(sql<number>`count(distinct ${schema.outboundMessages.leadId})`))
      .from(schema.outboundMessages)
      .where(eq(schema.outboundMessages.status, "SENT"))
      .get(),
    db
      .select(count(sql<number>`count(distinct ${schema.outboundReplies.leadId})`))
      .from(schema.outboundReplies)
      .where(and(ne(schema.outboundReplies.classification, "OUT_OF_OFFICE"), inArray(schema.outboundReplies.leadId, contactedLeadIds())))
      .get(),
    db
      .select(count(sql<number>`count(distinct ${schema.outboundReplies.leadId})`))
      .from(schema.outboundReplies)
      .where(and(eq(schema.outboundReplies.classification, "INTERESTED"), inArray(schema.outboundReplies.leadId, contactedLeadIds())))
      .get(),
    db
      .select({ status: schema.outboundLeads.status, n: sql<number>`count(*)` })
      .from(schema.outboundLeads)
      .groupBy(schema.outboundLeads.status)
      .all(),
    db.select(count()).from(schema.outboundCampaignLeads).where(eq(schema.outboundCampaignLeads.status, "DRAFTED")).get(),
  ]);
  const statusCounts = Object.fromEntries(byStatus.map((r) => [r.status, Number(r.n)]));
  const n = (row: { n: number } | undefined) => Number(row?.n ?? 0);
  const booked = (statusCounts.BOOKED ?? 0) + (statusCounts.CUSTOMER ?? 0);
  return {
    leadsImported: n(imported),
    leadsAnalyzed: n(analyzed),
    activeSequences: n(active),
    emailsSent: n(sent),
    leadsContacted: n(contacted),
    leadsReplied: n(replied),
    positiveReplies: n(positive),
    booked,
    responseRate: rate(n(replied), n(contacted)),
    positiveResponseRate: rate(n(positive), n(contacted)),
    statusCounts,
    awaitingReview: n(awaiting),
  };
}

export async function recentActivity(limit = 15, onlyErrors = false) {
  return db
    .select({
      id: schema.outboundActivities.id,
      type: schema.outboundActivities.type,
      level: schema.outboundActivities.level,
      message: schema.outboundActivities.message,
      createdAt: schema.outboundActivities.createdAt,
      leadId: schema.outboundActivities.leadId,
      companyName: schema.outboundLeads.companyName,
    })
    .from(schema.outboundActivities)
    .leftJoin(schema.outboundLeads, eq(schema.outboundLeads.id, schema.outboundActivities.leadId))
    .where(onlyErrors ? inArray(schema.outboundActivities.level, ["error", "warn"]) : undefined)
    .orderBy(desc(schema.outboundActivities.createdAt))
    .limit(limit)
    .all();
}

export async function interestedLeads(limit = 10) {
  return db
    .select()
    .from(schema.outboundLeads)
    .where(and(inArray(schema.outboundLeads.status, ["INTERESTED", "REPLIED"])))
    .orderBy(desc(schema.outboundLeads.lastActivityAt))
    .limit(limit)
    .all();
}
