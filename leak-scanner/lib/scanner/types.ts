export type PageKind =
  | "home"
  | "contact"
  | "about"
  | "services"
  | "reviews"
  | "other";

export interface ExtractedForm {
  fieldCount: number;
  hasEmailField: boolean;
  hasPhoneField: boolean;
  hasTextarea: boolean;
  action: string | null;
}

export interface ExtractedLink {
  href: string;
  text: string;
  internal: boolean;
}

export interface ExtractedPage {
  url: string;
  kind: PageKind;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  paragraphs: string[];
  links: ExtractedLink[];
  buttons: string[];
  forms: ExtractedForm[];
  phones: string[];
  emails: string[];
  imageAlts: string[];
  hasViewportMeta: boolean;
  schemaTypes: string[];
  socialLinks: string[];
  /** All visible text, whitespace-normalized. */
  text: string;
  wordCount: number;
}

export interface ExtractedSite {
  inputUrl: string;
  finalUrl: string;
  fetchedAt: string;
  pages: ExtractedPage[];
  /** Concatenated visible text of all fetched pages. */
  combinedText: string;
  /** Pages we tried to fetch but could not. */
  fetchErrors: Array<{ url: string; error: string }>;
}

export interface ScanContext {
  businessName: string;
  industry: string;
  city?: string | null;
  state?: string | null;
  primaryGoal?: string | null;
}

export type FindingCategory =
  | "conversion"
  | "local"
  | "ai_visibility"
  | "trust"
  | "follow_up";

export interface Finding {
  id: string;
  category: FindingCategory;
  label: string;
  detected: boolean;
  weight: number;
  /** Short quoted/paraphrased evidence from the site; null when not detected. */
  evidence: string | null;
}

export interface CategoryScores {
  websiteConversionScore: number;
  localVisibilityScore: number;
  aiVisibilityScore: number;
  trustProofScore: number;
  followUpReadinessScore: number;
  revenueLeakScore: number;
}

export interface ScoringResult extends CategoryScores {
  findings: Finding[];
}
