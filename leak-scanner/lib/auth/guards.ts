import { redirect } from "next/navigation";
import { getSessionUser, getUserOrganization } from "./session";
import type { Organization, User } from "@/lib/db/schema";

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireUserWithOrg(): Promise<{
  user: User;
  organization: Organization;
}> {
  const user = await requireUser();
  const organization = getUserOrganization(user.id);
  if (!organization) redirect("/login");
  return { user, organization };
}

export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/app/dashboard");
  return user;
}

/** API-route variants: return null instead of redirecting. */
export async function apiUser(): Promise<User | null> {
  return getSessionUser();
}

export async function apiAdmin(): Promise<User | null> {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}
