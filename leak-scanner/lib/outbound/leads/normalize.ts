import { z } from "zod";

/** Canonical lead fields accepted by CSV import and manual entry. */
export interface LeadInput {
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
}

type Field = keyof LeadInput;

/** Header aliases (lowercased, non-alphanumerics stripped) → canonical field. */
const HEADER_ALIASES: Record<string, Field> = {
  companyname: "companyName",
  company: "companyName",
  businessname: "companyName",
  business: "companyName",
  organization: "companyName",
  name: "companyName",
  firstname: "contactFirstName",
  first: "contactFirstName",
  contactfirstname: "contactFirstName",
  lastname: "contactLastName",
  last: "contactLastName",
  contactlastname: "contactLastName",
  email: "email",
  emailaddress: "email",
  contactemail: "email",
  phone: "phone",
  phonenumber: "phone",
  telephone: "phone",
  website: "website",
  websiteurl: "website",
  url: "website",
  domain: "website",
  site: "website",
  city: "city",
  state: "state",
  region: "state",
  industry: "industry",
  niche: "industry",
  category: "industry",
  vertical: "industry",
  source: "source",
  leadsource: "source",
};

export function canonicalHeader(header: string): Field | null {
  return HEADER_ALIASES[header.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? null;
}

const emailSchema = z.string().email();

export function normalizeEmail(raw: string | null | undefined): string | null {
  const value = raw?.trim().toLowerCase().replace(/^mailto:/, "") ?? "";
  if (!value) return null;
  return emailSchema.safeParse(value).success ? value : null;
}

/** "www.Foo.com/path" → "https://www.foo.com/path"; junk → null. */
export function normalizeWebsite(raw: string | null | undefined): string | null {
  let value = raw?.trim() ?? "";
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function websiteDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function emailDomain(email: string | null): string | null {
  return email ? email.split("@")[1] ?? null : null;
}

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 300) : null;
};

export type RowResult =
  | { ok: true; lead: LeadInput; warnings: string[] }
  | { ok: false; error: string };

/** Maps one CSV record (arbitrary headers) to a LeadInput. */
export function normalizeRecord(record: Record<string, string>, defaultSource = "csv"): RowResult {
  const mapped: Partial<Record<Field, string>> = {};
  for (const [header, value] of Object.entries(record)) {
    const field = canonicalHeader(header);
    if (field && value && !mapped[field]) mapped[field] = value;
  }
  // "contact name" / "full name" columns split into first/last.
  if (!mapped.contactFirstName) {
    const full = Object.entries(record).find(([h]) =>
      /^(contact ?name|full ?name|owner|owner ?name)$/i.test(h.trim())
    )?.[1];
    if (full) {
      const [first, ...rest] = full.trim().split(/\s+/);
      mapped.contactFirstName = first;
      if (rest.length && !mapped.contactLastName) mapped.contactLastName = rest.join(" ");
    }
  }

  const warnings: string[] = [];
  const email = normalizeEmail(mapped.email);
  if (mapped.email && !email) warnings.push(`invalid email "${mapped.email}"`);
  const website = normalizeWebsite(mapped.website);
  if (mapped.website && !website) warnings.push(`invalid website "${mapped.website}"`);

  let companyName = clean(mapped.companyName);
  if (!companyName && website) companyName = websiteDomain(website);
  if (!companyName) return { ok: false, error: "missing company name and website" };
  if (!email && !website) return { ok: false, error: "needs at least an email or a website" };

  return {
    ok: true,
    warnings,
    lead: {
      companyName,
      contactFirstName: clean(mapped.contactFirstName),
      contactLastName: clean(mapped.contactLastName),
      email,
      phone: clean(mapped.phone),
      website,
      industry: clean(mapped.industry)?.toLowerCase() ?? null,
      city: clean(mapped.city),
      state: clean(mapped.state),
      source: clean(mapped.source) ?? defaultSource,
    },
  };
}

/** Dedupe key: email when present, else website domain. */
export function dedupeKey(lead: Pick<LeadInput, "email" | "website">): string | null {
  if (lead.email) return `email:${lead.email}`;
  const domain = websiteDomain(lead.website);
  return domain ? `domain:${domain}` : null;
}
