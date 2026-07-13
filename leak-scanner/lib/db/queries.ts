import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Business, Scan } from "@/lib/db/schema";

/**
 * Tenant-isolation helpers: every org-scoped read goes through here so the
 * organization filter can't be forgotten at call sites.
 */

export function businessesForOrg(organizationId: string): Business[] {
  return db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.organizationId, organizationId))
    .orderBy(desc(schema.businesses.createdAt))
    .all();
}

export function scansForOrg(organizationId: string): Array<Scan & { businessName: string }> {
  const businesses = businessesForOrg(organizationId);
  if (businesses.length === 0) return [];
  const nameById = new Map(businesses.map((b) => [b.id, b.businessName]));
  const scans = db
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

export function scanForOrg(
  organizationId: string,
  scanId: string
): (Scan & { businessName: string }) | null {
  return scansForOrg(organizationId).find((s) => s.id === scanId) ?? null;
}

export function businessForOrg(organizationId: string, businessId: string): Business | null {
  const business = db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId))
    .get();
  return business && business.organizationId === organizationId ? business : null;
}
