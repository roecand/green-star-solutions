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
  // Before scripts/iframes are stripped: note which third-party widgets load
  // (chat, booking, review embeds). Hostnames only — nothing is executed.
  const thirdPartyScripts = collectThirdPartyHosts($, pageUrl);
  $("script, style, noscript, svg, iframe").remove();
  // <br> carries no text; without this "decide<br>in" reads as "decidein".
  $("br").replaceWith(" ");

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
    // Hidden forms (e.g. Netlify's build-time detection copy of a JS form)
    // aren't what visitors see — counting them produced false "long form" claims.
    .filter((_, formEl) => !isHiddenElement($, formEl))
    .map((_, formEl) => {
      const $form = $(formEl);
      const fields = $form
        .find("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")
        .filter((_, f) => !HONEYPOT_NAME.test($(f).attr("name") ?? "") && !isHiddenElement($, f));
      // A radio/checkbox group is one question, not one field per option.
      const groups = new Set<string>();
      let fieldCount = 0;
      fields.each((_, f) => {
        const type = ($(f).attr("type") ?? "").toLowerCase();
        if (type === "radio" || type === "checkbox") {
          const key = $(f).attr("name") ?? `__${type}${fieldCount}`;
          if (groups.has(key)) return;
          groups.add(key);
        }
        fieldCount++;
      });
      const fieldNames = fields
        .map((_, f) => `${$(f).attr("type") ?? ""} ${$(f).attr("name") ?? ""} ${$(f).attr("id") ?? ""}`)
        .get()
        .join(" ")
        .toLowerCase();
      return {
        fieldCount,
        hasEmailField: /email/.test(fieldNames),
        hasPhoneField: /phone|tel/.test(fieldNames),
        hasTextarea: $form.find("textarea").length > 0,
        action: $form.attr("action") ?? null,
      };
    })
    .get();

  // JS-built forms (div + inputs, submitted by script) have no <form> tag;
  // treat 2+ visible inputs outside any form as one form so we don't claim
  // "no contact form" about a site that has one.
  const orphanFields = $("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=search]), select, textarea")
    .filter((_, f) => $(f).closest("form").length === 0 && !HONEYPOT_NAME.test($(f).attr("name") ?? "") && !isHiddenElement($, f))
    .toArray();
  if (orphanFields.length >= 2) {
    const names = orphanFields.map((f) => `${$(f).attr("type") ?? ""} ${$(f).attr("name") ?? ""} ${$(f).attr("id") ?? ""}`).join(" ").toLowerCase();
    forms.push({
      fieldCount: orphanFields.length,
      hasEmailField: /email/.test(names),
      hasPhoneField: /phone|tel/.test(names),
      hasTextarea: orphanFields.some((f) => $(f).is("textarea")),
      action: null,
    });
  }

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
    thirdPartyScripts,
  };
}

const HONEYPOT_NAME = /bot[-_]?field|honeypot|^_?gotcha$|^hp[-_]|^website[-_]?url[-_]?confirm/i;

const HIDDEN_STYLE = /display\s*:\s*none|visibility\s*:\s*hidden/i;

/** True when the element or an ancestor is hidden via attribute or inline style. */
function isHiddenElement($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0]): boolean {
  const $el = $(el);
  const hidden = (node: ReturnType<typeof $>) =>
    node.is("[hidden]") || node.attr("aria-hidden") === "true" || HIDDEN_STYLE.test(node.attr("style") ?? "");
  return hidden($el) || $el.parents().toArray().some((p) => hidden($(p)));
}

function collectThirdPartyHosts($: cheerio.CheerioAPI, pageUrl: string): string[] {
  let ownHost = "";
  try {
    ownHost = new URL(pageUrl).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }
  const hosts: string[] = [];
  $("script[src], iframe[src]").each((_, el) => {
    try {
      const host = new URL($(el).attr("src") ?? "", pageUrl).hostname.replace(/^www\./, "");
      if (host && host !== ownHost) hosts.push(host);
    } catch {
      /* ignore */
    }
  });
  // Inline loaders (e.g. widget snippets that inject a script at runtime).
  $("script:not([src])").each((_, el) => {
    const matches = $(el).text().match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
    for (const m of matches.slice(0, 10)) {
      const host = m.replace(/^https?:\/\//i, "").replace(/^www\./, "").toLowerCase();
      if (host !== ownHost) hosts.push(host);
    }
  });
  return dedupe(hosts).slice(0, 60);
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
