import { timingSafeEqual } from "node:crypto";

/** Constant-time bearer/secret check for machine-to-machine endpoints. */
export function secretMatches(provided: string | null | undefined, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Accepts "Authorization: Bearer <secret>", "x-greenstar-secret", or ?secret= (for providers that can't set headers). */
export function requestSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-greenstar-secret") ?? new URL(request.url).searchParams.get("secret");
}
