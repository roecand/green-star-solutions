import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { intakeSchema } from "@/lib/scoring/intake";
import { computeHotScore } from "@/lib/leads/hot-score";
import { trackEvent } from "@/lib/analytics/track";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

const deepenSchema = z.object({ answers: intakeSchema });

/**
 * Upgrades a quick scan to the comprehensive audit: stores the lead's
 * self-reported answers and flips the report depth. Answers never change the
 * deterministic scores — they unlock the full report + personalized insights.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = clientIpFrom(request);
  if (!rateLimit(`deepen:${ip}`, 20, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = deepenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please answer all the questions." },
      { status: 400 }
    );
  }

  const scan = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.shareToken, token))
    .get();
  if (!scan) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (scan.status !== "completed") {
    return NextResponse.json(
      { error: "The scan is still running — try again in a moment." },
      { status: 409 }
    );
  }

  await db
    .update(schema.scans)
    .set({
      depth: "comprehensive",
      intakeJson: JSON.stringify(parsed.data.answers),
    })
    .where(eq(schema.scans.id, scan.id))
    .run();

  // Completing the deep audit is a strong buying signal — reheat the lead.
  const lead = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.scanId, scan.id))
    .get();
  if (lead) {
    const recommendations = await db
      .select({ severity: schema.recommendations.severity })
      .from(schema.recommendations)
      .where(eq(schema.recommendations.scanId, scan.id))
      .all();
    const hotScore = computeHotScore({
      revenueLeakScore: scan.revenueLeakScore,
      emailProvided: !!lead.email,
      clickedCta: true,
      requestedHelp: lead.lifecycleStatus === "requested_help",
      viewedReport: true,
      industry: lead.industry,
      websiteReachable: !!scan.websiteUrl,
      recommendations,
    });
    await db
      .update(schema.leads)
      .set({ hotScore })
      .where(eq(schema.leads.id, lead.id))
      .run();
  }

  trackEvent({
    eventType: "scan_deepened",
    scanId: scan.id,
    leadId: lead?.id,
    metadata: { industry: scan.industry, goal: parsed.data.answers.mainGoal },
  });

  return NextResponse.json({ ok: true });
}
