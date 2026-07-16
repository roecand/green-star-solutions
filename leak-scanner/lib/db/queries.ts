import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Business, Scan } from "@/lib/db/schema";

/**
 * Tenant-isolation helpers: every org-scoped read goes through here so the
 * organization filter can't be forgotten at call sites.
 */

export async function businessesForOrg(organizationId: string): Promise<Business[]> {
  return db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.organizationId, organizationId))
    .orderBy(desc(schema.businesses.createdAt))
    .all();
}

export async function scansForOrg(
  organizationId: string
): Promise<Array<Scan & { businessName: string }>> {
  const businesses = await businessesForOrg(organizationId);
  if (businesses.length === 0) return [];
  const nameById = new Map(businesses.map((b) => [b.id, b.businessName]));
  const scans = await db
    .select()
    .from(schema.scans)
    .where(inArray(schema.scans.businessId, businesses.map((b) => b.id)))
    .orderBy(desc(schema.scans.createdAt))
    .all();
  return scans.map((scan) => ({
    ...scan,
    businessName: nameById.get(scan.businessId) ?? "Unknown business",
  }));
}

export async function scanForOrg(
  organizationId: string,
  scanId: string
): Promise<(Scan & { businessName: string }) | null> {
  return (await scansForOrg(organizationId)).find((s) => s.id === scanId) ?? null;
}

export async function businessForOrg(
  organizationId: string,
  businessId: string
): Promise<Business | null> {
  const business = await db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId))
    .get();
  return business && business.organizationId === organizationId ? business : null;
}
