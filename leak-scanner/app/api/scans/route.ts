import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte, count } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { normalizeUrl, UnsafeUrlError } from "@/lib/scanner/url";
import { createScanRecords, runScanPipeline } from "@/lib/scanner/pipeline";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";
import { getSessionUser, getUserOrganization } from "@/lib/auth/session";
import { scanLimitFor } from "@/lib/billing/plans";
import { billingEnabled } from "@/lib/flags";
import { trackEvent } from "@/lib/analytics/track";

const createScanSchema = z.object({
  businessName: z.string().min(1).max(160),
  websiteUrl: z.string().min(3).max(500),
  industry: z.string().min(2).max(80),
  city: z.string().max(80).optional(),
  state: z.string().max(60).optional(),
  email: z.string().email().max(254).optional().or(z.literal("")),
  contactName: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  source: z.string().max(120).optional(),
  primaryGoal: z
    .enum(["more_calls", "more_bookings", "more_form_leads", "more_reviews", "more_visibility"])
    .optional(),
  // Retained for backward compatibility; not collected in the current funnel.
  competitorUrls: z.array(z.string().max(500)).max(3).optional(),
});

export async function POST(request: Request) {
  const ip = clientIpFrom(request);
  // Abuse protection: cap scans per connection.
  const limited = rateLimit(`scan:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many scans from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form — some fields are missing or invalid." },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Soft per-email cap so one address can't spam scans (no upgrade messaging).
  if (input.email) {
    const emailLimit = rateLimit(`scan-email:${input.email.toLowerCase()}`, 5, 24 * 60 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "You've run several scans recently. Please try again tomorrow." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } }
      );
    }
  }

  let websiteUrl: string;
  const competitorUrls: string[] = [];
  try {
    websiteUrl = normalizeUrl(input.websiteUrl);
    for (const raw of input.competitorUrls ?? []) {
      if (raw.trim()) competitorUrls.push(normalizeUrl(raw));
    }
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const user = await getSessionUser();
  const organization = user ? await getUserOrganization(user.id) : null;

  // Paid-plan scan limits only apply when the SaaS billing surface is enabled.
  // As a free lead-gen funnel, scans are unrestricted beyond the rate limits above.
  if (billingEnabled() && organization) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orgBusinessRows = await db
      .select({ id: schema.businesses.id })
      .from(schema.businesses)
      .where(eq(schema.businesses.organizationId, organization.id))
      .all();
    const orgBusinessIds = orgBusinessRows.map((b) => b.id);
    let recentScans = 0;
    for (const businessId of orgBusinessIds) {
      const row = await db
        .select({ n: count() })
        .from(schema.scans)
        .where(and(eq(schema.scans.businessId, businessId), gte(schema.scans.createdAt, since)))
        .get();
      recentScans += row?.n ?? 0;
    }
    if (recentScans >= scanLimitFor(organization.plan)) {
      return NextResponse.json(
        {
          error:
            organization.plan === "free"
              ? "Your free scan has been used. Upgrade to keep monitoring your score."
              : "You've reached this month's scan limit for your plan.",
          upgrade: true,
        },
        { status: 402 }
      );
    }
  }

  const { scan } = await createScanRecords({
    businessName: input.businessName,
    websiteUrl,
    industry: input.industry,
    city: input.city,
    state: input.state,
    email: input.email || undefined,
    contactName: input.contactName,
    phone: input.phone,
    primaryGoal: input.primaryGoal,
    competitorUrls,
    organizationId: organization?.id ?? null,
    utmSource: input.source ?? null,
  });

  trackEvent({
    eventType: "scan_started",
    scanId: scan.id,
    userId: user?.id,
    metadata: { industry: input.industry, source: input.source ?? null },
  });

  // Run the pipeline without blocking the response; the client polls status.
  runScanPipeline(scan.id).catch((error) =>
    console.error(`pipeline crash for scan ${scan.id}`, error)
  );

  return NextResponse.json({ scanId: scan.id, shareToken: scan.shareToken });
}
