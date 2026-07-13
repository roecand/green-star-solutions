import { assertPublicHost, normalizeUrl, UnsafeUrlError } from "./url";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB per page
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const USER_AGENT =
  "GreenstarLeakScanner/1.0 (+https://greenstarsolutions.com; website diagnostic, contact to opt out)";

export class FetchFailedError extends Error {}

export interface FetchedPage {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  status: number;
}

/**
 * Fetches a single public web page with SSRF protection, manual redirect
 * handling (re-validating each hop), a hard timeout, and a response size cap.
 * Never executes scripts — we only ever read the HTML text.
 */
export async function fetchPage(inputUrl: string): Promise<FetchedPage> {
  let url = normalizeUrl(inputUrl);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicHost(url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof UnsafeUrlError) throw error;
      if ((error as Error).name === "AbortError") {
        throw new FetchFailedError("The website took too long to respond.");
      }
      throw new FetchFailedError(
        "We couldn't reach the website. It may be down or blocking automated checks."
      );
    }

    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timer);
      const location = response.headers.get("location");
      if (!location) throw new FetchFailedError("The website redirected without a destination.");
      url = new URL(location, url).toString();
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new UnsafeUrlError("The website redirected to an unsupported address.");
      }
      continue;
    }

    if (!response.ok) {
      clearTimeout(timer);
      throw new FetchFailedError(
        `The website responded with an error (HTTP ${response.status}).`
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      clearTimeout(timer);
      throw new FetchFailedError("That address doesn't serve a readable web page.");
    }

    try {
      const html = await readBodyWithLimit(response, MAX_BYTES);
      return { requestedUrl: inputUrl, finalUrl: url, html, status: response.status };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new FetchFailedError("The website took too long to respond.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new FetchFailedError("The website redirected too many times.");
}

async function readBodyWithLimit(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) {
      await reader.cancel();
      break; // Keep what we have — a truncated page still yields signals.
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
