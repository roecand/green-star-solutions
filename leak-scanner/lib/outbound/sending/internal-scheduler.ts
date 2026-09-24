const globalForScheduler = globalThis as unknown as { __outboundScheduler?: NodeJS.Timeout };

/** setInterval-driven ticks; never overlaps itself and never throws out. */
export function startInternalScheduler(intervalSeconds: number): void {
  if (globalForScheduler.__outboundScheduler) return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { dbReady } = await import("@/lib/db");
      await dbReady();
      const { runOutboundTick } = await import("./scheduler");
      const report = await runOutboundTick();
      if (report.analyzed || report.analysisFailed || report.drafted || report.sent || report.enrolled) {
        console.log(`[outbound scheduler] ${JSON.stringify(report)}`);
      }
    } catch (error) {
      console.error("[outbound scheduler] tick failed", error);
    } finally {
      running = false;
    }
  };
  // First tick shortly after boot (migrations run first), then on the interval.
  setTimeout(() => void tick(), 30_000).unref();
  globalForScheduler.__outboundScheduler = setInterval(() => void tick(), intervalSeconds * 1000);
  globalForScheduler.__outboundScheduler.unref();
  console.log(`[outbound scheduler] running every ${intervalSeconds}s`);
}
