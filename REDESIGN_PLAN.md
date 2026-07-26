# Green Star Solutions — Repositioning Redesign Plan

**Goal:** Reposition the site from "GoHighLevel-style ops agency" to **premium perception studio for the trades** — and make the site itself the proof of the taste being sold.

**Deadline:** Ship within 2 weeks (before Robert's job starts). Live-and-good beats local-and-perfect.

**The contract:** The day this ships, one outreach message goes out pointing at it. The redesign exists to be *used*, not admired locally.

---

## 1. The positioning shift

**Old pitch (current site):** "More Calls. More Jobs. Less Busy Work." — an operations/admin-relief pitch. Identical to thousands of GHL-reseller agencies. Competes on price.

**New pitch:** *"We redesign the feeling people get when they look at your business."*
Green Star sells **perception transformation** — brand, site, socials, ads that make a trade company look like the one homeowners trust with the $15,000 job — with a conversion backend attached so none of the new demand leaks.

**Why:** Robert's actual edge is taste (see Summit Climate / Silver State concept sites). The current site leads with the commodity (ops) and hides the rare thing (design). Perception raises the client's *prices* (revenue conversation); ops saves them *admin* (cost conversation). Sell the first, attach the second.

## 2. The two-department story (core narrative of the new site)

Frame every service under two departments, presented as a diagnosis:

> "You don't have a leads problem — you have a perception problem and a follow-up problem."

- **Dept 1 — Perception** (the premium project fee, ~$8–15k anchor):
  brand, website, photography/content direction, socials, ads.
  Job: change what a homeowner feels in the 8 seconds they look at the company.
- **Dept 2 — Conversion** (the monthly retainer):
  AI follow-up, missed-call text back, appointment automation, CRM, reputation, SOPs.
  Job: every lead Dept 1 creates gets contacted, followed up, closed.

Sell order: Perception is the lead offer; Conversion is the obvious add-on ("you're about to get more calls — want us to make sure they all get answered?"). Never lead with ops.

## 3. Page-by-page changes

### Hero (`components/Hero.tsx`)
- New headline: **"We redesign the feeling people get when they look at your business."** (or a tightened variant — keep "feeling" and "look at your business"; that sentence is the positioning)
- Sub: better calls from people pre-sold on premium prices — and a backend that makes sure none of them slip away.
- Keep CTA "Book a Free Strategy Call"; secondary CTA should jump straight to the portfolio proof.
- Keep target industries visible (HVAC · Plumbing · Electrical · Roofing · Landscaping).

### Proof / Portfolio (`components/Portfolio.tsx`, `app/portfolio/`)
- Portfolio system already exists: 4 concept sites in `public/concepts/<slug>/index.html`, all rendered from the `projects` array in `lib/projects.ts` (Rio Verde Plumbing, Agave & Stone, Golden Hour Bakehouse, Caprock Roofing). Homepage shows `slice(0,3)`.
- **Add Summit Climate (`~/summit-climate/index.html`) and Silver State HVAC (`~/silver-state-hvac/index.html`) as concept entries** — copy into `public/concepts/`, add ribbon + `projects` entries like the others. They're the two strongest taste proofs and currently aren't in the portfolio at all.
- Move portfolio proof into the first scroll of the homepage — "this is what we do to a trade company."
- Frame concept sites confidently: "We built these to show what's possible" — concept-as-pitch is a feature, not a disclaimer.
- Note: concept iframe URLs must point at `/concepts/<slug>/index.html` explicitly (`next dev` doesn't serve directory-index for public/ paths; Netlify does).

### Services (`components/Services.tsx`)
- Restructure the flat 7-service list into the two departments (Perception / Conversion). Same services, new hierarchy and story.

### Pricing anchors (new section or within Services)
- Visible anchors: "Brand transformations from $X · Growth retainers from $Y/mo."
  Robert sets the numbers; the point is filtering tire-kickers and signaling premium. Even ranges work.

### Process (`components/Process.tsx`)
- Rewrite steps to match the diagnosis framing: Perception audit → Transformation → Conversion system → Ongoing growth.

### Design language (site-wide)
- The site itself must scream taste: quiet, expensive, confident — **Summit Climate quality** (reference: `~/summit-climate/index.html`, the "Apple of HVAC" register; also `~/silver-state-hvac/index.html`).
- Generous whitespace, restrained palette, editorial typography, no agency-template energy.
- Consider the `frontend-design` skill for the aesthetic pass.
- "Built by Green Star — yes, this site too" footer line: keep it. It's the best line on the current site.

## 4. Technical notes

- **Next.js 16.2.9** — per `AGENTS.md`, this version has breaking changes vs training data. **Read `node_modules/next/dist/docs/` before writing code.**
- Tailwind v4 (PostCSS plugin), React 19, TypeScript, **static export** (`output:"export"` → build emits `./out`).
- Deployed via **Netlify** (project `taupe-paprenjak-82b1ab`), continuous deploy on push to main. Repo is PUBLIC on github.com/roecand/green-star-solutions. **Do NOT add the `Co-Authored-By: Claude` commit trailer in this repo** (it counts as a 2nd contributor on Netlify's free plan). Direct pushes to main have been blocked before — if so, branch + PR and let Robert merge. Check whether PR #2 (spec previews) is still open/unmerged before starting.
- Forms: Netlify Forms, name `strategy-call` — `public/__forms.html` is the source of truth for detection; `NetlifyFormDetect.tsx` + `ProjectForm.tsx` field names must stay in sync. Keep it working.
- Existing components are well-factored — this is a **copy + hierarchy + design-polish** job, not a rebuild. Reuse `Reveal.tsx`, `ProjectCard.tsx`, `SitePreview.tsx`, `StarMark.tsx`.
- Design tokens at top of `app/globals.css` (warm paper `#f7f5f0`, ink `#16201b`, forest `#0e4a33`; Zilla Slab / Work Sans / JetBrains Mono). Evolve, don't nuke — the palette already reads premium.
- Gotchas: never name a CSS class `.invert` (Tailwind v4 filter collision — dark sections use `.surface-forest`); Turbopack can serve stale CSS (`rm -rf .next` + restart if styles look wrong).
- Verify with the preview tools (launch config may need `.claude/launch.json` in that repo) and screenshot at mobile + desktop before calling it done.

## 5. Out of scope (do not let these creep in)

- No new backend features, no CRM integrations, no blog.
- No UGC-creator program pages yet (that's the month-4 offer).
- No Paradise Lost anything — different company, different session.
- Don't gold-plate: two weeks, then ship. Perfection is the failure mode (Virgo rising, we know).

## 6. Definition of done

1. New positioning live on green-starsolutions.com (Netlify deploy green).
2. Summit Climate + Silver State featured in first scroll.
3. Two-department services structure + pricing anchors visible.
4. Site passes the squint test: "would a homeowner believe this company designs $15k-job-worthy brands?"
5. Robert sends one outreach message linking the new site. **The redesign is not done until that message is sent.**
   → **10 personalized cold-email drafts already exist in Robert's Gmail** (created 2026-07-01, each with a verified site-weakness hook + concept link; sending rules in `~/green-star-ops/playbook.md`, prospect tracker in `~/green-star-ops/pipeline.md`). Ship day = send at least one of them. The rep is already written; it just has to leave Drafts.
