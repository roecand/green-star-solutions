import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashPassword } from "./password";
import type { User } from "@/lib/db/schema";

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
  }
}

/**
 * Creates a user plus their organization. The first admin is bootstrapped by
 * setting ADMIN_EMAIL; any signup with that email gets the admin role.
 */
export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();
  if (existing) throw new EmailTakenError();

  const isAdmin =
    !!process.env.ADMIN_EMAIL &&
    email === process.env.ADMIN_EMAIL.trim().toLowerCase();

  const user = await db
    .insert(schema.users)
    .values({
      email,
      name: input.name?.trim() || null,
      passwordHash: hashPassword(input.password),
      role: isAdmin ? "admin" : "user",
    })
    .returning()
    .get();

  const organization = await db
    .insert(schema.organizations)
    .values({
      ownerUserId: user.id,
      name: input.name?.trim() || email,
      plan: "free",
    })
    .returning()
    .get();

  // Claim any anonymous scans that were run with this email, so the report
  // history is waiting when a visitor signs up after a free scan.
  await db
    .update(schema.businesses)
    .set({ organizationId: organization.id })
    .where(and(eq(schema.businesses.email, email), isNull(schema.businesses.organizationId)))
    .run();

  await db
    .insert(schema.auditEvents)
    .values({
      actorUserId: user.id,
      eventType: "user_registered",
      entityType: "user",
      entityId: user.id,
    })
    .run();

  return user;
}
