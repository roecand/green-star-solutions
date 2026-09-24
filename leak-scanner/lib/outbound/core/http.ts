/**
 * JSON-over-HTTP helper for third-party APIs (GHL, Smartlead, LLM gateways):
 * hard timeout, bounded retries on 429/5xx honoring Retry-After, never an
 * unbounded loop.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
  }
}

export interface FetchJsonOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  maxRetries?: number;
  /** Injected in tests. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1000, 30_000);
  return Math.min(500 * 2 ** attempt, 8_000);
}

export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxRetries = options.maxRetries ?? 3;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      if (attempt < maxRetries) {
        await sleep(retryDelayMs(attempt, null));
        continue;
      }
      throw new HttpError(`Network error: ${(error as Error).message}`, 0, "");
    }
    clearTimeout(timer);

    const text = await response.text();
    if (response.ok) {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new HttpError("Response was not valid JSON", response.status, text.slice(0, 500));
      }
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < maxRetries) {
      await sleep(retryDelayMs(attempt, response.headers.get("retry-after")));
      continue;
    }
    throw new HttpError(
      `HTTP ${response.status} from ${new URL(url).host}`,
      response.status,
      text.slice(0, 500)
    );
  }
}
