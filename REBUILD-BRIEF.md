# Rebuild brief — Green Star Solutions

**Handoff for a fresh session.** Written 2026-07-26 at the end of a long
working session. Everything needed to continue is here or linked from here.

**Goal:** rebuild / finish the site so it does not read as AI-built, using the
measured standard in `DESIGN-STANDARD.md` and the reference agencies below.

> **A `/site` skill exists** (taste → emil-kowalski-design → impeccable-design,
> then browser verification). Worth invoking for the next pass. Read
> `DESIGN-STANDARD.md` first regardless — it holds the measured thresholds this
> project is being held to, which a generic skill won't know.

---

## 1. State of the repo — read this first

| | |
|---|---|
| Local `HEAD` | `46a3fa4` "Apply DESIGN-STANDARD" |
| `origin/main` | `d622ce9` — **one commit behind** |
| Working tree | clean |
| **Nothing is pushed.** | `46a3fa4` exists only locally |

### ⚠ There is a live bug on production right now

`origin/main` (`d622ce9`) ships a closing-CTA scrim at **66%/80%** opacity that
renders the section **flat green with no photograph visible at all**. It was an
over-correction chasing AAA contrast on a display headline that only needs 3:1.

**Fixed in the unpushed commit** — back to 44/66 with solid-paper sub-copy,
which still measures 5.57:1 for both headline and sub-copy. Pushing `46a3fa4`
fixes it. Until then, the live closing section is broken.

Push auto-deploys to green-starsolutions.com via Netlify. **Do not push without
asking Robert.**

---

## 2. What this project is

Marketing site for **Green Star Solutions** — a "perception studio for the
trades" in Las Vegas (HVAC, plumbing, electrical, roofing, landscaping). Owner:
Robert Candelaria.

Stack: Next.js 16.2.9 App Router · React 19 · Tailwind v4 · TypeScript · static
export (`output: "export"`, `images: { unoptimized: true }`, `trailingSlash`).
Deploys to Netlify on push to `main`.

Dev server: `preview_start {name: "green-star"}` — **the config is named
`green-star`, not `dev`**, despite what `BUILD_BRIEF.md` says.

---

## 3. The documents, in reading order

1. **`DESIGN-STANDARD.md`** ← the important one. Measured thresholds, two
   playbooks, per-discipline commitments, structure/copy tells, process rules,
   pre-ship checklist. Everything in it came from instrumenting real pages.
2. `BUILD_BRIEF.md` — the previous session's handoff. Still broadly accurate on
   project background and repo gotchas. **Two things in it are now wrong:** the
   launch config name (`green-star`, not `dev`), and its instruction to "de-box
   the nav" which caused a shipped regression (see §6).
3. `VISUAL_REBUILD.md` — original reasoning and image-generation history.
4. `REDESIGN_PLAN.md`, `START_HERE.md` — superseded scratch from planning.

### Tools left behind

- `scripts/design-audit.js` — paste into any browser console. Prints colour,
  radii, motion, hover and density metrics. Run it on the reference sites and
  on ours; compare against `DESIGN-STANDARD.md` §1.
- `scripts/design-audit.mjs` — `node scripts/design-audit.mjs <url|path> …`
  Image-pixel metrics (saturation, lightness, dynamic range, busyness,
  background uniformity, subject isolation) with pass/fail flags.
- `scripts/media.mjs` — PNG → jpg/webp conversion for `public/media/`.

---

## 4. The reference set and the measured gap

Instrumented 2026-07-26: **clay.global**, **ideo.com**, **uxstudioteam.com**.

| | Clay | IDEO | UX Studio | Green Star (live) |
|---|---|---|---|---|
| media % of page area | 82.8 | 70.4 | 18.7 | 19.9 |
| corner radii | ~none | **zero** | committed round | **6px ×17 + 999px ×14** |
| easing | 1 curve ×264 | `ease` | `ease` | `ease` ×66 + 2 more |
| accent | none | 100% sat, 1.2% area | 100% sat, 3.2% | 68% sat, dark |
| image lightness | 59.1 | 53.0 | 38.8 | **27.4** |
| subject isolation | **3.1** | 1.1 | 1.6 | **1.5** |
| authored `:hover` rules | **102** | 57 | **81** | **20** |
| words / screen | 92 | 351 | 85 | 112 |

**The core finding:** every reference site sits at an *extreme* of each
distribution. Green Star sat in the *middle* of nearly all of them. AI output
doesn't make bad choices — it makes average ones, consistently. See
`DESIGN-STANDARD.md` §0.

**Correcting two intuitions that don't survive measurement:**

- *"Premium sites use moving abstract animations, not static images."* False for
  2 of 3. IDEO: 0 video, 0 canvas, 4 keyframes. UX Studio: 0 video, 1 keyframe.
  Only Clay is motion-heavy. **Do not chase canvas/WebGL** — most expensive,
  least load-bearing item available.
- *"Premium sites are sparse."* False for IDEO: 351 words/screen, 49% of page
  area is text, still reads premium. Density is a playbook choice, not a
  quality signal.

---

## 5. What the unpushed commit already did

Applied to the whole site (homepage + `/portfolio` + `/portfolio/[slug]` + 404):

- **Square.** `--radius: 0` and `--plate-radius: 0`. Every pill, card, input,
  chip and the nav toggle. Measured: 3 radius languages → **0**.
- **No accent.** Forest demoted from accent to dark *surface* only. Primary
  button is ink. Mint on dark surfaces → paper at 72%. Saturated accents
  **12 uses → 0**. Surface colours **5 → 4**.
- **One easing curve.** `--ease: cubic-bezier(0.16, 1, 0.3, 1)` on every
  transition and keyframe. **201 uses, `ease` → 0.**
- **Motion moves.** Buttons gained a transform-based wipe fill.
  `transform` animated: **2 → 31**.
- **Hover vocabulary 20 → 62**, built from four repeated gestures (media scale,
  hairline darken, row indent, underline wipe) so the page reads as one object.
- **✦ reduced to the nav and footer lockups only.** It had also been a
  decorative bullet, a form tick and a footer ornament.
- Fixed: closing scrim opacity (see §1), and project-card style labels that
  were right-aligning and splitting across ragged lines.

All verified against a live audit of both versions, at desktop and 375px, with
4 `prefers-reduced-motion` blocks and no horizontal overflow.

---

## 6. Bugs I shipped, and the methodology that hid them

Read this before trusting your own verification.

**The transparent sticky nav.** `BUILD_BRIEF.md` said "de-box it — remove the
background, backdrop-filter and border." Applied literally to a
`position: sticky` nav, that put ink links over page text across **75% of the
scroll range**, and made the nav measure **1.13:1** over the dark sections and
**1.00:1** over the footer — i.e. invisible. Fixed by making the nav
non-sticky. If it ever becomes sticky again it needs a background *and*
dark-surface inversion. There's a comment in `components/Nav.tsx` saying so.

**Why the verification missed it:** every check rendered each section in
isolation, which places the nav *above* content rather than *over* it. Section-
by-section review is structurally incapable of catching an overlay bug.

**The fix that generalises:** prefer a DOM sweep that tests the whole class of
problem over a screenshot that proves one viewport. The check that caught it:

```js
// for every scroll position, does any text element intersect the nav band?
```

**Alt text for images I hadn't opened** — 4 of 6 were wrong when checked against
actual pixels. Never write alt text from a filename.

**A contrast measurement that returned a reassuring lie** — the canvas was
sampling an all-black image because the source was `loading="lazy"` and had
never entered the viewport. Force-decode before measuring pixels.

---

## 7. Repo gotchas — these will bite

1. **Turbopack serves stale CSS.** It cost two false verifications this session.
   **Stop the dev server *before* `rm -rf .next`** — clearing it underneath a
   running server destroys its manifests and returns 500s until restart.
2. **Never name a CSS class `.invert`** — collides with a Tailwind v4 utility.
   Dark sections use `.surface-forest`.
3. **No `Co-Authored-By: Claude` trailer on commits.** Netlify's free plan
   counts it as a second contributor. Keep commits single-author.
4. `next dev` doesn't serve directory-index for `public/` paths (Netlify does).
   Concept-site URLs must point at `/concepts/<slug>/index.html`.
5. Nav and footer anchors are path-prefixed (`/#services`) so they work from
   subpages. **Keep them that way** — the lint rule complaining about
   `<a>` vs `<Link>` there is a false positive.
6. **`media-src/` is 20 MB of gitignored source PNGs that exist on Robert's Mac
   and nowhere else.** They are ChatGPT output and not reproducible. He has been
   asked twice to back them up. Ask again.
7. **The browser preview pane only composites reliably at scroll 0 on a fresh
   load.** Scrolled screenshots frequently return blank frames. Workaround: hide
   preceding sections with `display:none` so the target sits at the top. Do not
   conclude "the image is broken" from a blank screenshot — verify via
   `getComputedStyle` / canvas pixel sampling first.
8. `npm run lint` reports ~40,000 problems because it walks nested build output
   (`leak-scanner/.next-e2e/`). Not real. A task was spawned to scope it.

---

## 8. What is left — in order of leverage

### 1. Evidence. Not a design problem, outranks everything below.
The site has **zero** real client names, hard numbers, dates, or third-party
quotes. Every reference site leads with them — Clay names Slack and Snapchat,
IDEO opens a case study on *"20 Overture deposits made by American Airlines."*
Green Star says, in its own words, *"Concept builds for fictional companies."*

**One real client name and one real number would move the needle further than
any amount of CSS.** This needs Robert, not an agent.

### 2. Imagery — the largest remaining measurable gap
Current: subject isolation **1.4**, lightness **32**, background brightness
**92**, dynamic range **179**. That is "atmosphere" — the AI-image default,
where nothing is the subject and everything is mood.

Two valid targets (pick one, don't blend):
- **Studio** — isolation **>2.5**, background brightness **>140**, background
  SD **<40**. This is Clay's look and the closest to what Robert described.
- **Documentary** — isolation ~1.0–1.2, busyness **>40**. This is IDEO's.

Also: page background is lightness 95, images are lightness 27. That **68-point
gap** is why the plates read as heavy holes punched in paper. Keep it under ~45.

Verify any new image with `node scripts/design-audit.mjs <path>` before wiring.

### 3. Copy structure
Project pages still use scaffolding headings — *Overview / Design goals /
Features implemented / Design gallery / Before & after*. Those could head any
project on earth, which is why they read generated. Clay's equivalents:
*"Waiting Made Entertaining" / "Simplified Product Search."* Rewrite each to
name what's actually in the section. And add at least one unrepeatable,
engagement-specific detail per project.

### 4. Typography
Two Google fonts (Zilla Slab + Work Sans). A licensed or custom face is an
unfakeable cost signal — Clay commissioned UniversalSans, IDEO uses Fhoscar.
This is a purchase decision for Robert.

### 5. Open identity question, raised three times, never resolved
**The ✦ is the universal AI-sparkle glyph** — the icon Gemini, Copilot and every
"generate with AI" button uses. On a site whose entire complaint is looking
AI-built, the logo is the AI logo. Now reduced to the nav and footer lockups,
but the underlying question stands. **Robert's call, not an agent's.**

---

## 9. Hard constraints — do not violate

- **Every section stays where it is.** No deletions, no reordering, no new
  sections, no rewriting Robert's copy. He corrected this once already. Type,
  light, air, motion and imagery only.
  Current order: Hero → Portfolio → Services → Process → Industries →
  ClosingCTA → ProjectForm → Footer.
- **Do not touch form field `name` attributes** in `components/ProjectForm.tsx`.
  Netlify form detection depends on them matching `public/__forms.html`. Form
  name is `strategy-call`.
- **The live concept-site iframes in `Portfolio` stay.** Nobody else embeds
  working sites; it is the one place the site shows rather than tells, and the
  strongest asset on the page.
- **Never AI-generate a human face.** If a person appears it must be a real
  photograph. A shooting brief for Robert is in `VISUAL_REBUILD.md` §6.
- **Do not push or deploy without asking.**

---

## 10. First moves for the new session

1. Read `DESIGN-STANDARD.md`.
2. `preview_start {name: "green-star"}`, load the site, and **scroll the whole
   page once, continuously**, before changing anything.
3. Run `scripts/design-audit.js` in the console to confirm the current baseline
   matches §5 (all square, one curve ×201, 62 hover rules, 4 surfaces, 0
   accents).
4. Ask Robert about: pushing `46a3fa4` (it fixes a live bug), backing up
   `media-src/`, the ✦, and whether he can supply one real client reference.
5. Then the highest-leverage build work is §8.2 — imagery with a subject.
