import * as cheerio from "cheerio";
import type {
  ExtractedForm,
  ExtractedLink,
  ExtractedPage,
  ExtractedSite,
  PageKind,
} from "./types";
import { fetchPage } from "./fetcher";

const PHONE_REGEX =
  /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "yelp.com",
  "nextdoor.com",
];

const PAGE_KIND_PATTERNS: Array<{ kind: PageKind; pattern: RegExp }> = [
  { kind: "contact", pattern: /contact|get-in-touch|reach-us|quote|estimate/i },
  { kind: "reviews", pattern: /review|testimonial|feedback/i },
  { kind: "about", pattern: /about|our-story|our-team|who-we-are|meet/i },
  { kind: "services", pattern: /service|what-we-do|treatment|repair|offering/i },
];

export function classifyPath(pathOrText: string): PageKind {
  for (const { kind, pattern } of PAGE_KIND_PATTERNS) {
    if (pattern.test(pathOrText)) return kind;
  }
  return "other";
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Parses one HTML document into structured signals. Pure — no network. */
export function extractPage(html: string, pageUrl: string, kind: PageKind): ExtractedPage {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe").remove();

  const title = normalizeWhitespace($("title").first().text()) || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;

  const grabHeadings = (sel: string) =>
    $(sel)
      .map((_, el) => normalizeWhitespace($(el).text()))
      .get()
      .filter(Boolean)
      .slice(0, 30);

  const paragraphs = $("p, li")
    .map((_, el) => normalizeWhitespace($(el).text()))
    .get()
    .filter((t) => t.length > 20)
    .slice(0, 400);

  let origin: string | null = null;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    origin = null;
  }

  const links: ExtractedLink[] = [];
  const socialLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const hrefRaw = $(el).attr("href") ?? "";
    const text = normalizeWhitespace($(el).text()).slice(0, 120);
    if (!hrefRaw || hrefRaw.startsWith("#") || hrefRaw.startsWith("javascript:")) return;
    let resolved: URL;
    try {
      resolved = new URL(hrefRaw, pageUrl);
    } catch {
      return;
    }
    const host = resolved.hostname.replace(/^www\./, "");
    if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))) {
      socialLinks.push(resolved.toString());
    }
    links.push({
      href: resolved.toString(),
      text,
      internal: origin !== null && resolved.origin === origin,
    });
  });

  const buttons = [
    ...$("button")
      .map((_, el) => normalizeWhitespace($(el).text()))
      .get(),
    ...$('input[type="submit"], input[type="button"]')
      .map((_, el) => normalizeWhitespace($(el).attr("value") ?? ""))
      .get(),
    ...$("a[class]")
      .filter((_, el) => /btn|button|cta/i.test($(el).attr("class") ?? ""))
      .map((_, el) => normalizeWhitespace($(el).text()))
      .get(),
  ]
    .filter(Boolean)
    .slice(0, 60);

  const forms: ExtractedForm[] = $("form")
    .map((_, formEl) => {
      const $form = $(formEl);
      const fields = $form.find("input:not([type=hidden]), select, textarea");
      const fieldNames = fields
        .map((_, f) => `${$(f).attr("type") ?? ""} ${$(f).attr("name") ?? ""} ${$(f).attr("id") ?? ""}`)
        .get()
        .join(" ")
        .toLowerCase();
      return {
        fieldCount: fields.length,
        hasEmailField: /email/.test(fieldNames),
        hasPhoneField: /phone|tel/.test(fieldNames),
        hasTextarea: $form.find("textarea").length > 0,
        action: $form.attr("action") ?? null,
      };
    })
    .get();

  const bodyText = normalizeWhitespace($("body").text()).slice(0, 60_000);
  const telLinks = $('a[href^="tel:"]')
    .map((_, el) => ($(el).attr("href") ?? "").replace("tel:", ""))
    .get();
  const mailtoLinks = $('a[href^="mailto:"]')
    .map((_, el) => ($(el).attr("href") ?? "").replace("mailto:", "").split("?")[0])
    .get();

  const phones = dedupe([...telLinks, ...(bodyText.match(PHONE_REGEX) ?? [])]).slice(0, 10);
  const emails = dedupe([...mailtoLinks, ...(bodyText.match(EMAIL_REGEX) ?? [])])
    .filter((e) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e))
    .slice(0, 10);

  const imageAlts = $("img[alt]")
    .map((_, el) => normalizeWhitespace($(el).attr("alt") ?? ""))
    .get()
    .filter((alt) => alt.length > 2)
    .slice(0, 100);

  // Scripts were removed above for text extraction; re-parse the raw HTML
  // only to read JSON-LD structured data (never executed).
  const schemaTypes: string[] = [];
  const $raw = cheerio.load(html);
  $raw('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($raw(el).text());
      collectSchemaTypes(parsed, schemaTypes);
    } catch {
      // ignore malformed JSON-LD
    }
  });
  $raw("[itemtype]").each((_, el) => {
    const itemtype = $raw(el).attr("itemtype");
    if (itemtype) schemaTypes.push(itemtype.split("/").pop() ?? itemtype);
  });

  return {
    url: pageUrl,
    kind,
    title,
    metaDescription,
    h1: grabHeadings("h1"),
    h2: grabHeadings("h2"),
    h3: grabHeadings("h3"),
    paragraphs,
    links: links.slice(0, 300),
    buttons,
    forms,
    phones,
    emails,
    imageAlts,
    hasViewportMeta,
    schemaTypes: dedupe(schemaTypes).slice(0, 20),
    socialLinks: dedupe(socialLinks).slice(0, 20),
    text: bodyText,
    wordCount: bodyText ? bodyText.split(" ").length : 0,
  };
}

function collectSchemaTypes(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaTypes(item, out);
    return;
  }
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    const type = record["@type"];
    if (typeof type === "string") out.push(type);
    if (Array.isArray(type)) out.push(...type.filter((t): t is string => typeof t === "string"));
    if (record["@graph"]) collectSchemaTypes(record["@graph"], out);
  }
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.map((i) => i.trim()).filter(Boolean))];
}

const MAX_PAGES = 5;

/**
 * Fetches the homepage plus up to four detected internal pages
 * (contact/about/services/reviews). Progress callback drives the scanner UI.
 */
export async function extractSite(
  inputUrl: string,
  onProgress?: (stage: string) => void
): Promise<ExtractedSite> {
  onProgress?.("Reading website");
  const home = await fetchPage(inputUrl);
  const homePage = extractPage(home.html, home.finalUrl, "home");

  const pages: ExtractedPage[] = [homePage];
  const fetchErrors: Array<{ url: string; error: string }> = [];

  // Pick one internal link per interesting page kind.
  const targets = new Map<PageKind, string>();
  for (const link of homePage.links) {
    if (!link.internal) continue;
    let path: string;
    try {
      path = new URL(link.href).pathname;
    } catch {
      continue;
    }
    if (path === "/" || path === "") continue;
    const kind = classifyPath(`${path} ${link.text}`);
    if (kind !== "other" && !targets.has(kind)) {
      targets.set(kind, link.href.split("#")[0]);
    }
    if (targets.size >= MAX_PAGES - 1) break;
  }

  for (const [kind, url] of targets) {
    if (pages.length >= MAX_PAGES) break;
    try {
      const fetched = await fetchPage(url);
      pages.push(extractPage(fetched.html, fetched.finalUrl, kind));
    } catch (error) {
      fetchErrors.push({ url, error: (error as Error).message });
    }
  }

  return {
    inputUrl,
    finalUrl: home.finalUrl,
    fetchedAt: new Date().toISOString(),
    pages,
    combinedText: pages.map((p) => p.text).join(" \n "),
    fetchErrors,
  };
}
