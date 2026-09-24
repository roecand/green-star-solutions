import { db, schema } from "@/lib/db";
import { emailDomain } from "../leads/normalize";

export type SuppressionReason = "unsubscribed" | "bounced" | "do_not_contact" | "manual";

/** Values are lowercase emails, or "@domain.com" for a domain-wide block. */
export async function loadSuppressionSet(): Promise<Set<string>> {
  const rows = await db.select({ value: schema.outboundSuppressions.value }).from(schema.outboundSuppressions).all();
  return new Set(rows.map((r) => r.value));
}

export function isSuppressed(email: string | null, set: Set<string>): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  const domain = emailDomain(lower);
  return set.has(lower) || (domain ? set.has(`@${domain}`) : false);
}

export async function suppress(value: string, reason: SuppressionReason, source: string): Promise<void> {
  await db
    .insert(schema.outboundSuppressions)
    .values({ value: value.trim().toLowerCase(), reason, source })
    .onConflictDoNothing()
    .run();
}

export async function isEmailSuppressed(email: string | null): Promise<boolean> {
  return isSuppressed(email, await loadSuppressionSet());
}
