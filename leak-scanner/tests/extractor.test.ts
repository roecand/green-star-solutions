import { describe, expect, it } from "vitest";
import { classifyPath, extractPage } from "@/lib/scanner/extractor";
import { STRONG_HOME_HTML, WEAK_HOME_HTML } from "./fixtures/strong-site";

describe("extractPage", () => {
  const page = extractPage(STRONG_HOME_HTML, "https://desertair.com/", "home");

  it("extracts title and meta description", () => {
    expect(page.title).toContain("HVAC Repair in Las Vegas");
    expect(page.metaDescription).toContain("Licensed and insured");
  });

  it("extracts headings", () => {
    expect(page.h1).toEqual(["Fast, Honest HVAC Repair in Las Vegas"]);
    expect(page.h2.length).toBeGreaterThanOrEqual(5);
  });

  it("finds phone numbers including tel: links", () => {
    expect(page.phones.length).toBeGreaterThan(0);
    expect(page.phones.join(" ")).toContain("7025550142");
  });

  it("finds emails", () => {
    expect(page.emails).toContain("info@desertair.com");
  });

  it("classifies internal vs external links", () => {
    const internal = page.links.filter((l) => l.internal);
    const external = page.links.filter((l) => !l.internal);
    expect(internal.some((l) => l.href.includes("/contact"))).toBe(true);
    expect(external.some((l) => l.href.includes("facebook.com"))).toBe(true);
  });

  it("detects forms with field metadata", () => {
    expect(page.forms).toHaveLength(1);
    expect(page.forms[0].hasEmailField).toBe(true);
    expect(page.forms[0].hasPhoneField).toBe(true);
    expect(page.forms[0].hasTextarea).toBe(true);
  });

  it("detects viewport meta and schema types", () => {
    expect(page.hasViewportMeta).toBe(true);
    expect(page.schemaTypes).toContain("HVACBusiness");
  });

  it("collects social links and image alts", () => {
    expect(page.socialLinks.some((l) => l.includes("facebook"))).toBe(true);
    expect(page.imageAlts.length).toBeGreaterThanOrEqual(5);
  });

  it("collects button/cta text from styled anchors", () => {
    expect(page.buttons.join(" | ")).toContain("Get a Free Quote");
  });

  it("handles a weak page without crashing", () => {
    const weak = extractPage(WEAK_HOME_HTML, "https://weak.example.com/", "home");
    expect(weak.h1).toHaveLength(0);
    expect(weak.phones).toHaveLength(0);
    expect(weak.forms).toHaveLength(0);
    expect(weak.hasViewportMeta).toBe(false);
  });
});

describe("classifyPath", () => {
  it("maps common paths to page kinds", () => {
    expect(classifyPath("/contact-us Contact")).toBe("contact");
    expect(classifyPath("/about-us")).toBe("about");
    expect(classifyPath("/our-services")).toBe("services");
    expect(classifyPath("/testimonials")).toBe("reviews");
    expect(classifyPath("/blog/post-1")).toBe("other");
  });
});
