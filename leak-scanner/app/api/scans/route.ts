import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte, count } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { normalizeUrl, UnsafeUrlError } from "@/lib/scanner/url";
import { createScanRecords, runScanPipeline } from "@/lib/scanner/pipeline";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";
import { getSessionUser, getUserOrganization } from "@/lib/auth/session";
import { scanLimitFor } from "@/lib/billing/plans";
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
  primaryGoal: z
    .enum(["more_calls", "more_bookings", "more_form_leads", "more_reviews", "more_visibility"])
    .optional(),
  competitorUrls: z.array(z.string().max(500)).max(3).optional(),
});

export async function POST(request: Request) {
  const ip = clientIpFrom(request);
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

  // Plan limit enforcement. Anonymous scans: 1 free scan per email.
  const user = await getSessionUser();
  const organization = user ? getUserOrganization(user.id) : null;

  if (organization) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orgBusinessIds = db
      .select({ id: schema.businesses.id })
      .from(schema.businesses)
      .where(eq(schema.businesses.organizationId, organization.id))
      .all()
      .map((b) => b.id);
    let recentScans = 0;
    for (const businessId of orgBusinessIds) {
      const row = db
        .select({ n: count() })
        .from(schema.scans)
        .where(and(eq(schema.scans.businessId, businessId), gte(schema.scans.createdAt, since)))
        .get();
      recentScans += row?.n ?? 0;
    }
    const limit = scanLimitFor(organization.plan);
    if (recentScans >= limit) {
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
  } else if (input.email) {
    const priorLead = db
      .select({ id: schema.leads.id })
      .from(schema.leads)
      .where(eq(schema.leads.email, input.email))
      .get();
    if (priorLead) {
      return NextResponse.json(
        {
          error:
            "This email has already used its free scan. Create an account or upgrade to run more scans.",
          upgrade: true,
        },
        { status: 402 }
      );
    }
  }

  const { scan } = createScanRecords({
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
  });

  trackEvent({ eventType: "scanner_start", scanId: scan.id, userId: user?.id });

  // Run the pipeline without blocking the response; the client polls status.
  runScanPipeline(scan.id).catch((error) =>
    console.error(`pipeline crash for scan ${scan.id}`, error)
  );

  return NextResponse.json({ scanId: scan.id, shareToken: scan.shareToken });
}
