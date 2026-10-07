/**
 * Regressions from scanning a real one-page trades-agency site: the report
 * said "your city isn't mentioned" (it was in the title), contradicted itself
 * about the contact form, and missed the in-page contact section.
 */
import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/scanner/extractor";
import { runScoringEngine } from "@/lib/scoring/engine";
import type { ExtractedSite } from "@/lib/scanner/types";

const HTML = `<html><head><title>Acme Roofing | Las Vegas, NV</title>
<meta name="description" content="Roof repair for Las Vegas homeowners."></head>
<body>
  <nav><a href="#work">Work</a><a href="#contact">Contact</a><a href="#">Top</a></nav>
  <h1>Roofs that outlast the desert.</h1>
  <section id="contact"><h2>Start a project</h2>
    <div class="form"><input placeholder="Business name"><input placeholder="City"><input placeholder="https://"><button type="button">Continue</button></div>
  </section>
</body></html>`;

function scan(html: string) {
  const page = extractPage(html, "https://acme.example.com/", "home");
  const site: ExtractedSite = { inputUrl: page.url, finalUrl: page.url, fetchedAt: "", pages: [page], combinedText: page.text, fetchErrors: [] };
  const { findings } = runScoringEngine(site, { businessName: "Acme", industry: "Roofing", city: "Las Vegas", state: "NV" });
  return Object.fromEntries(findings.map((f) => [f.id, f]));
}

describe("scanner accuracy on one-page sites", () => {
  const f = scan(HTML);

  it("finds the city in the title/meta even when body copy omits it", () => {
    expect(f.local_city_state.detected).toBe(true);
    expect(f.local_city_state.evidence).toMatch(/title|meta/);
  });

  it("never reports 'no lead form' alongside a detected contact form", () => {
    expect(f.conv_contact_form.detected).toBe(true);
    expect(f.followup_form.detected).toBe(true);
  });

  it("counts an in-page #contact section as a contact path, but ignores bare '#'", () => {
    expect(f.conv_contact_page.detected).toBe(true);
    const page = extractPage(HTML, "https://acme.example.com/", "home");
    expect(page.links.some((l) => l.href.endsWith("#contact"))).toBe(true);
    expect(page.links.some((l) => l.href === "https://acme.example.com/#")).toBe(false);
  });

  it("still fails all three on a site that genuinely lacks them", () => {
    const g = scan(`<html><head><title>Acme</title></head><body><h1>Roofing</h1><p>${"We fix roofs well. ".repeat(20)}</p></body></html>`);
    expect(g.local_city_state.detected).toBe(false);
    expect(g.followup_form.detected).toBe(false);
    expect(g.conv_contact_page.detected).toBe(false);
  });
});

describe("quote path consistency", () => {
  it("a 'Free quote' CTA satisfies both the conversion CTA and follow-up quote checks", () => {
    const f = scan(`<html><head><title>Acme | Las Vegas</title></head><body><h1>Roofing in Las Vegas</h1><a class="btn" href="#contact">Get a free quote</a><p>${"Roof repair done right. ".repeat(10)}</p></body></html>`);
    expect(f.conv_primary_cta.detected).toBe(true);
    expect(f.followup_quote_cta.detected).toBe(true);
    const g = scan(`<html><body><h1>Acme</h1><a class="btn" href="/x">Free inspection</a></body></html>`);
    expect(g.followup_quote_cta.detected).toBe(true);
  });
});

describe("minified HTML", () => {
  it("keeps adjacent elements' words apart", () => {
    const page = extractPage(`<html><body><h1>Roofing</h1><a href="/q">Get a free quote</a><p>Serving Las Vegas</p></body></html>`, "https://a.example.com/", "home");
    expect(page.text).toBe("Roofing Get a free quote Serving Las Vegas");
  });
});
