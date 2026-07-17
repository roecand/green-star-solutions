import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { trackEvent } from "@/lib/analytics/track";
import { computeHotScore } from "@/lib/leads/hot-score";
import { sendEmail, appUrl } from "@/lib/email/send";
import { helpRequestEmail, reportReadyEmail } from "@/lib/email/templates";
import { verdictForScore } from "@/lib/scoring/engine";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

const actionSchema = z.object({
  action: z.enum(["book_call", "request_fix_plan", "email_report", "cta_click"]),
  email: z.string().email().max(254).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = clientIpFrom(request);
  if (!rateLimit(`report-action:${ip}`, 20, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { action, email } = parsed.data;

  const scan = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.shareToken, token))
    .get();
  if (!scan) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const lead = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.scanId, scan.id))
    .get();

  if (lead) {
    const isHelpRequest = action === "book_call" || action === "request_fix_plan";
    const recommendations = await db
      .select({ severity: schema.recommendations.severity })
      .from(schema.recommendations)
      .where(eq(schema.recommendations.scanId, scan.id))
      .all();

    const nextStatus =
      isHelpRequest && ["new", "viewed_report"].includes(lead.lifecycleStatus)
        ? "requested_help"
        : lead.lifecycleStatus;

    const hotScore = computeHotScore({
      revenueLeakScore: scan.revenueLeakScore,
      emailProvided: !!(lead.email || email),
      clickedCta: true,
      requestedHelp: isHelpRequest || lead.lifecycleStatus === "requested_help",
      viewedReport: true,
      industry: lead.industry,
      websiteReachable: scan.status === "completed",
      recommendations,
    });

    await db.update(schema.leads)
      .set({
        lifecycleStatus: nextStatus,
        hotScore,
        email: lead.email ?? email ?? null,
      })
      .where(eq(schema.leads.id, lead.id))
      .run();

    if (isHelpRequest && process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Help request: ${lead.businessName}`,
        html: helpRequestEmail({
          businessName: lead.businessName,
          email: lead.email ?? email ?? null,
          requestType: action === "book_call" ? "Book Strategy Call" : "Request Fix Plan",
          score: scan.revenueLeakScore,
          adminUrl: appUrl(`/admin/leads/${lead.id}`),
        }),
        eventType: "help_request",
        scanId: scan.id,
        leadId: lead.id,
      });
    }

    if (isHelpRequest) {
      // Canonical funnel event: the money step (traffic → scan → report → this).
      trackEvent({
        eventType: "fix_plan_clicked",
        scanId: scan.id,
        leadId: lead.id,
        metadata: { action, industry: lead.industry },
      });
    }
    trackEvent({
      eventType: isHelpRequest ? "help_request" : action === "email_report" ? "email_report_request" : "cta_click",
      scanId: scan.id,
      leadId: lead.id,
      metadata: { action },
    });
  }

  if (action === "email_report") {
    const to = email ?? lead?.email;
    if (!to) {
      return NextResponse.json(
        { error: "Enter an email address to receive the report." },
        { status: 400 }
      );
    }
    await sendEmail({
      to,
      subject: `Your Revenue Leak Report for ${lead?.businessName ?? "your business"}`,
      html: reportReadyEmail({
        businessName: lead?.businessName ?? "your business",
        score: scan.revenueLeakScore ?? 0,
        verdict: verdictForScore(scan.revenueLeakScore ?? 0),
        reportUrl: appUrl(`/report/${token}`),
      }),
      eventType: "report_emailed",
      scanId: scan.id,
      leadId: lead?.id,
    });
  }

  return NextResponse.json({ ok: true });
}
