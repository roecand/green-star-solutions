import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Acquires a named lease in the database. Returns false if another holder's
 * lease has not expired. The lease self-expires, so a crashed tick can never
 * wedge the scheduler.
 */
export async function acquireLock(name: string, ttlMs: number): Promise<boolean> {
  const now = Date.now();
  const until = new Date(now + ttlMs);
  await db
    .insert(schema.outboundLocks)
    .values({ name, lockedUntil: new Date(0) })
    .onConflictDoNothing()
    .run();
  const result = await db
    .update(schema.outboundLocks)
    .set({ lockedUntil: until })
    .where(and(eq(schema.outboundLocks.name, name), lt(schema.outboundLocks.lockedUntil, new Date(now))))
    .run();
  return result.rowsAffected === 1;
}

export async function releaseLock(name: string): Promise<void> {
  await db
    .update(schema.outboundLocks)
    .set({ lockedUntil: new Date(0) })
    .where(eq(schema.outboundLocks.name, name))
    .run();
}
