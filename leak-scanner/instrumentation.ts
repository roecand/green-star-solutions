/**
 * Runs once per server start. Starts the outbound scheduler in-process when
 * OUTBOUND_SCHEDULER_INTERVAL_SECONDS is set (production on Railway), so no
 * external cron/n8n is needed. The DB lease in runOutboundTick keeps this
 * safe even if an external cron also calls /api/outbound/tick.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const seconds = Number(process.env.OUTBOUND_SCHEDULER_INTERVAL_SECONDS);
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const { startInternalScheduler } = await import("./lib/outbound/sending/internal-scheduler");
  startInternalScheduler(Math.max(60, seconds));
}
