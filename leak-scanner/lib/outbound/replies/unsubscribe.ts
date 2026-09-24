import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { handleUnsubscribe } from "./handle";

export async function leadByUnsubscribeToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return undefined;
  return db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.unsubscribeToken, token)).get();
}

/** Idempotent. Returns false for an unknown token. */
export async function unsubscribeByToken(token: string, source: string): Promise<boolean> {
  const lead = await leadByUnsubscribeToken(token);
  if (!lead) return false;
  if (lead.status !== "DO_NOT_CONTACT") await handleUnsubscribe(lead, source);
  return true;
}
