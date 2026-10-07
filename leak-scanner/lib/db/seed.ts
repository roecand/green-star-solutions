/**
 * Seeds demo data: an admin user (from ADMIN_EMAIL, default password below),
 * plus five fictional demo businesses run through the REAL extraction +
 * scoring + fallback-report pipeline so demo reports are genuine outputs.
 *
 * Run: npm run db:seed   (idempotent — safe to re-run)
 */
import { eq } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { seedDemoBusinesses } from "./demo-seed";

const DEFAULT_ADMIN_PASSWORD = "greenstar-admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@greenstar.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function ensureAdmin(): Promise<string | null> {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL))
    .get();
  if (existing) {
    if (existing.role !== "admin") {
      await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, existing.id)).run();
    }
    return existing.id;
  }

  // Never create a known-default admin credential in production. Either set
  // SEED_ADMIN_PASSWORD, or just sign up with ADMIN_EMAIL (that account is
  // auto-promoted to admin by lib/auth/register.ts).
  if (IS_PRODUCTION && ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
    console.warn(
      `Skipping admin creation in production: set SEED_ADMIN_PASSWORD, or sign up at /signup with ${ADMIN_EMAIL} to get the admin role.`
    );
    return null;
  }
  const user = await db
    .insert(schema.users)
    .values({
      email: ADMIN_EMAIL,
      name: "Greenstar Admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
    })
    .returning()
    .get();
  await db
    .insert(schema.organizations)
    .values({ ownerUserId: user.id, name: "Greenstar Solutions", plan: "pro" })
    .run();
  console.log(`created admin user ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);
  return user.id;
}

async function main() {
  await dbReady();
  await ensureAdmin();
  await seedDemoBusinesses();
  console.log("seed complete");
}

main().catch((error) => {
  console.error("seed failed", error);
  process.exit(1);
});
