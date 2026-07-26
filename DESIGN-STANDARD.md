# Design standard — how to build a site that doesn't read as AI-made

**Purpose.** A reusable reference for every site built here. Derived from a
measured teardown (2026-07-26) of three agency sites that read as expensively
human — [clay.global](https://clay.global), [ideo.com](https://www.ideo.com),
[uxstudioteam.com](https://www.uxstudioteam.com) — against a site that read as
AI-made. Every threshold below came from instrumenting real pages, not from
opinion. Re-run `scripts/design-audit.js` to reproduce or extend it.

---

## 0. The principle everything else follows from

> **AI doesn't make bad choices. It makes average ones, and it makes them
> consistently. A design reads as human when someone committed to something a
> model wouldn't have picked, and then held that commitment everywhere.**

A model returns the likeliest option. The likeliest border-radius is `8px`. The
likeliest easing is `ease`. The likeliest accent is a medium-saturation version
of the logo colour used moderately. Each of those is individually defensible.
Two hundred of them stacked together produce a page where nothing is wrong and
nothing is *chosen* — and that is precisely what "looks AI-built" means.

**Design is a sequence of commitments. Generation is a sequence of averages.**

So the test for any decision is not *"is this good?"* but **"is this the middle
of the distribution?"** If yes, push it to an end.

---

## 1. The measured scorecard

Run the audit on the reference sites and on yours. Numbers from 2026-07-26:

| | Clay | IDEO | UX Studio | AI-built baseline |
|---|---|---|---|---|
| corner radii in use | ~none | **zero** | 1000/70/60/24px | **6px ×17 + 999px ×14** |
| dominant easing | one curve **×264** | `ease` | `ease` | **`ease` ×66** + 2 others |
| accent saturation | none | 100% | 100% | **68%** |
| accent area share | 0% | 1.2% | 3.2% | ~0.5% |
| light : dark area | 70:30 | **48:47** | 86:11 | 85:15 |
| image lightness | 59.1 | 53.0 | 38.8 | **27.4** |
| image dynamic range | 181 | 196 | 221 | **169** |
| subject isolation | **3.1** | 1.1 | 1.6 | **1.5** |
| authored `:hover` rules | **102** | 57 | **81** | **20** |
| interactive els / screen | 4.0 | 10.9 | 5.6 | **3.8** |
| words / screen | 92 | 351 | 85 | 112 |

**Read the extremes, not the averages.** Every reference site sits at an end of
each distribution. The AI-built column sits in the middle of nearly all of them.

---

## 2. Two valid playbooks — pick one, don't blend

Blending them is itself a tell.

### A — The Studio  *(Clay, UX Studio)*
Sparse text (**85–95 words/screen**, text ≤20% of page area) · isolated subjects
on bright clean ground · dense hover vocabulary · authored motion · media-heavy
(Clay is 82.8% media by area).

### B — The Institution  *(IDEO)*
Dense text (**~350 words/screen**, text ~50% of page area) · full-frame
documentary photography · near-zero motion (4 keyframes, 0 video) · hard
colour-blocked sections (48:47 light:dark) · very large type.

Decide which you are **before** writing CSS. Most marketing sites for small
businesses belong in A.

---

## 3. Non-negotiable commitments

### Form
- **Pick square or round. Never both.** Either radii ≈ `0` everywhere, or a
  committed round scale. Running `6px` and `999px` at similar volume is the
  clearest "nobody decided" signal in the whole audit.
- **One radius token.** If round, one value plus pills. If square, zero.
- **Shadows: default to none.** All three reference sites are at 0–3 shadows
  total. Depth via colour blocking and scale, not blur.

### Colour
- **Either no accent at all, or a loud one used rarely.** Clay: none, colour
  comes entirely from client work. IDEO/UX Studio: **100% saturation on 1–3% of
  page area.** A 68%-saturation mid-dark accent is the hedge — too quiet to
  punch, too coloured to read as structure.
- **Four surface colours maximum.** All three references use exactly four.
- **Decide the light:dark rhythm.** Either commit to alternating blocks (IDEO's
  48:47) or commit to a light page with rare dark sections. Don't drift.

### Motion
- **One easing curve, used everywhere.** Clay commits `cubic-bezier(.16,1,.3,1)`
  **264 times**. If your most-used easing is `ease`, you have not chosen one —
  that's the browser default.
- **Animate `transform`, not just `opacity`.** Opacity-and-blur alone reads as
  things *appearing*; transform reads as things *moving*.
- **Never apply a uniform stagger.** `delay={i * 90}` across every grid is the
  single most recognisable AI tell in code. A person staggers three cards and
  leaves the fourth because it looked better. The uniformity reveals that a
  *rule* was the artifact, not the page.
- **Motion is optional.** Two of three reference sites have effectively none
  (IDEO: 4 keyframes, 0 video, 0 canvas; UX Studio: 1 keyframe). Do not chase
  canvas/video/Lottie believing it signals quality — it signals *house style*.
  It is the most expensive and least load-bearing item on this list.

### Interaction — the highest-leverage gap
- **Target 60+ authored `:hover` rules** on a marketing site. The measured gap
  between premium and AI-built was 102/81/57 vs **20**.
- Everything a cursor can reach should acknowledge it: cards, rows, nav links,
  footer links, tags, thumbnails, logos, form chips.
- Humans build hover states because they *use* the thing while making it. AI
  builds a document, not an object you touch.

### Imagery
- **Have a subject.** Target **isolation > 2.5**, background brightness **> 140**,
  background uniformity SD **< 40** (studio route) — or commit fully to
  documentary full-frame (IDEO's isolation 1.1, busyness 44).
- **Atmosphere is the AI default.** Isolation ~1.5 with a dark, non-uniform
  background means nothing is the subject and everything is vibe. That is the
  visual equivalent of hedged prose.
- **Watch image-vs-page brightness gap.** Images at lightness 27 punched into a
  page at lightness 95 read as heavy holes. Keep the gap under ~45 points.
- **Never AI-generate a human face.** If a person appears, it must be a real
  photograph of a real person.

### Typography
- Custom or licensed typefaces are an unfakeable cost signal (Clay: UniversalSans;
  IDEO: Fhoscar). Two Google fonts is the default answer.
- One weight is a commitment. Five weights is a fallback.
- Hierarchy from **size and opacity**, not from weight + case + tracking + family
  stacked together.
- **Opacity floor: 62%** for body-size text on paper (measures 4.58:1). Below
  that fails AA — 55% gives 3.70:1, 45% gives 2.78:1.

---

## 4. Structure and copy tells

These matter more than any CSS and are usually skipped.

1. **Name findings, not containers.** *"Overview / Design goals / Features
   implemented / Design gallery"* could head any project on earth — that's why it
   reads generated. Clay's headings: *"Waiting Made Entertaining" / "Illustrated
   in 3D" / "Simplified Product Search."* Write the section title **after** you
   know what's in it.

2. **Include something unrepeatable.** Clay: *"Since stores can be loud from the
   blenders and music, this design helps employees identify people for order
   pickups."* That sentence cannot be generated — it's residue from having been
   present. Every human-made page carries at least one detail that could only
   come from that specific engagement. Find yours and put it in.

3. **Evidence over capability.** Premium sites show what *happened*; AI sites
   describe what's *possible*. Named clients, hard numbers, dates, an attributed
   quote from someone who isn't you, a link to a shipped artifact. IDEO opens a
   case study on *"20 Overture deposits made by American Airlines."*

4. **One real number outranks any amount of design work.** Prices you set
   yourself are the one kind of number that costs nothing to state and therefore
   proves nothing.

5. **Kill the scaffolding vocabulary.** Repeated eyebrow labels, `01/02/03`
   indices on every section, a serif-italic swap on one word per heading, an
   arrow glyph on every CTA. Any device that appears on *every* instance of a
   thing was applied by rule, not by judgment.

6. **The ✦ four-point sparkle is the AI logo.** It is the glyph Gemini, Copilot,
   and every "generate with AI" button uses. Avoid it entirely on sites whose
   credibility depends on not looking machine-made.

---

## 5. Process rules (how the work goes wrong)

Written from a real failure on this repo. Every one of these produced a shipped
bug.

- **Look at the whole page in one continuous scroll before calling it done.**
  Section-by-section verification is exactly the methodology that hides a sticky
  overlay. A transparent sticky nav shipped here that collided with text across
  **75% of the page**, because every check rendered the nav *above* content
  rather than *over* it.
- **Never write alt text for an image you haven't opened.** Four of six were
  wrong when checked against the actual pixels.
- **Instructions have consequences the instruction-writer didn't model.** "De-box
  the nav" was correct in isolation and catastrophic combined with
  `position: sticky`. Always ask what the element will then be sitting on.
- **Measure contrast against real pixels**, not against assumed background
  colours — and force lazy images to decode first, or you'll measure a black
  canvas and get a reassuring, meaningless number.
- **A verification that can't fail isn't a verification.** Prefer a DOM sweep
  that would catch the whole class of problem (e.g. test every text element's
  page-Y range against the nav band across the entire scroll) over a screenshot
  that only proves one viewport.

---

## 6. Pre-ship checklist

- [ ] Playbook A or B chosen and not blended
- [ ] Radii: one language (square **or** round), one token
- [ ] Accent: absent, or 100% saturation on ≤3% of area
- [ ] ≤4 surface colours
- [ ] One easing curve; `ease` appears zero times
- [ ] `transform` animated, not just opacity
- [ ] No uniform `delay={i * n}` stagger anywhere
- [ ] 60+ authored hover rules; everything clickable responds
- [ ] Images: subject isolation >2.5 **or** committed documentary
- [ ] Image/page brightness gap <45 points
- [ ] No text below 62% opacity at body size
- [ ] Section headings name findings, not containers
- [ ] At least one unrepeatable, engagement-specific detail
- [ ] At least one real name, number, date, or third-party quote
- [ ] No ✦ sparkle, no per-instance eyebrow/index/italic-swap/arrow devices
- [ ] Whole page reviewed in one continuous scroll, at desktop and 375px
- [ ] `prefers-reduced-motion` honoured for every animation and hidden-by-default state

---

## 7. Running the audit

```
node scripts/design-audit.mjs <url> [<url> …]     # image-pixel metrics
```

For the in-page metrics (colour, radii, motion, hover, density), paste
`scripts/design-audit.js` into the browser console on any site — yours or a
reference. It prints the same fields as the scorecard in §1.

Compare against §1. Anything sitting in the middle of a distribution is a
decision you haven't made yet.
