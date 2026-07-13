import dns from "node:dns/promises";
import net from "node:net";

export class UnsafeUrlError extends Error {}

/**
 * Normalizes user input into an https URL. Accepts "example.com",
 * "www.example.com/path", "http://example.com" etc.
 */
export function normalizeUrl(input: string): string {
  let raw = input.trim();
  if (!raw) throw new UnsafeUrlError("Please enter a website URL.");
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a valid website URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https websites can be scanned.");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with credentials are not allowed.");
  }
  if (!url.hostname.includes(".") || url.hostname.endsWith(".")) {
    throw new UnsafeUrlError("Please enter a full website address like yourbusiness.com.");
  }

  url.hash = "";
  return url.toString();
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // Loopback, link-local, unique-local, unspecified, IPv4-mapped.
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd"))
      return true;
    if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7));
    return false;
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

/**
 * SSRF guard: rejects localhost/private/reserved targets. Resolves DNS and
 * checks every returned address. Call again after each redirect.
 *
 * SCANNER_ALLOW_PRIVATE=1 disables the guard so e2e tests can scan a fixture
 * page served by the app itself. Never set it in production.
 */
export async function assertPublicHost(urlString: string): Promise<void> {
  if (process.env.SCANNER_ALLOW_PRIVATE === "1") return;
  const url = new URL(urlString);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError("That address cannot be scanned.");
  }
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new UnsafeUrlError("That address cannot be scanned.");
    return;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError(
      "We couldn't find that website. Double-check the address and try again."
    );
  }
  if (addresses.length === 0) {
    throw new UnsafeUrlError("We couldn't find that website.");
  }
  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new UnsafeUrlError("That address cannot be scanned.");
    }
  }
}

export { isPrivateIp };
