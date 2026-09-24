import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvRecords } from "@/lib/outbound/leads/csv";
import { dedupeKey, normalizeRecord, normalizeWebsite, websiteDomain } from "@/lib/outbound/leads/normalize";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, embedded commas/newlines, CRLF and BOM", () => {
    const csv = '﻿name,notes\r\n"Mike\'s Heating, LLC","said ""hi""\nthen left"\r\nABC,plain\r\n\r\n';
    expect(parseCsv(csv)).toEqual([
      ["name", "notes"],
      ["Mike's Heating, LLC", 'said "hi"\nthen left'],
      ["ABC", "plain"],
    ]);
  });

  it("maps rows to header-keyed records and pads short rows", () => {
    const { headers, records } = parseCsvRecords("a,b,c\n1,2\n");
    expect(headers).toEqual(["a", "b", "c"]);
    expect(records).toEqual([{ a: "1", b: "2", c: "" }]);
  });
});

describe("normalizeRecord", () => {
  it("accepts header aliases and normalizes values", () => {
    const result = normalizeRecord({
      "Company Name": "ABC Heating",
      "First Name": "Mike",
      "Email Address": " Mike@ABCHeating.com ",
      URL: "www.abcheating.com",
      Niche: "HVAC",
      City: "Reno",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lead).toMatchObject({
      companyName: "ABC Heating",
      contactFirstName: "Mike",
      email: "mike@abcheating.com",
      website: "https://www.abcheating.com/",
      industry: "hvac",
      city: "Reno",
      source: "csv",
    });
  });

  it("splits a full-name column", () => {
    const result = normalizeRecord({ company: "X Roofing", "Contact Name": "Jane Q Public", email: "jane@x.com" });
    expect(result.ok && result.lead.contactFirstName).toBe("Jane");
    expect(result.ok && result.lead.contactLastName).toBe("Q Public");
  });

  it("falls back to the domain as company name", () => {
    const result = normalizeRecord({ website: "https://www.bestroof.com" });
    expect(result.ok && result.lead.companyName).toBe("bestroof.com");
  });

  it("rejects rows with neither email nor website, and warns on bad email", () => {
    expect(normalizeRecord({ company: "Nothing Inc" }).ok).toBe(false);
    const warned = normalizeRecord({ company: "Y", email: "not-an-email", website: "y.com" });
    expect(warned.ok && warned.lead.email).toBeNull();
    expect(warned.ok && warned.warnings[0]).toContain("invalid email");
  });
});

describe("website helpers", () => {
  it("normalizes and extracts domains", () => {
    expect(normalizeWebsite("foo")).toBeNull();
    expect(websiteDomain("https://WWW.Foo.com/x")).toBe("foo.com");
    expect(dedupeKey({ email: null, website: "https://www.foo.com" })).toBe("domain:foo.com");
    expect(dedupeKey({ email: "a@b.com", website: "https://foo.com" })).toBe("email:a@b.com");
  });
});
