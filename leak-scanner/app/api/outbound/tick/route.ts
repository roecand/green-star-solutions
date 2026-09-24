import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/auth/guards";
import { dbReady } from "@/lib/db";
import { requestSecret, secretMatches } from "@/lib/outbound/core/auth";
import { runOutboundTick } from "@/lib/outbound/sending/scheduler";

// Analysis fetches several pages + an LLM call per lead.
export const maxDuration = 300;

/**
 * Scheduler entry point. n8n / cron: POST with
 * "Authorization: Bearer $OUTBOUND_CRON_SECRET" every 2–5 minutes.
 * Also callable by a signed-in admin (the dashboard "Run now" button).
 */
export async function POST(request: Request) {
  const machine = secretMatches(requestSecret(request), process.env.OUTBOUND_CRON_SECRET);
  if (!machine && !(await apiAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbReady();
  const report = await runOutboundTick();
  return NextResponse.json(report);
}
