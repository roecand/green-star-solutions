# Build brief — visual rebuild of the Green Star Solutions homepage

**Handoff document.** Written 2026-07-25 at the end of the planning/asset session.
Everything needed to execute is here — you should not need the prior conversation.

Companion doc: **`VISUAL_REBUILD.md`** (same directory) has the full reasoning,
the reference-site analysis, and the image-generation history. Read it if you
want the *why*. This file is the *what*.

---

## 1. The project

Marketing site for **Green Star Solutions** — a "perception studio for the
trades" in Las Vegas (HVAC, plumbing, electrical, roofing, landscaping). Owner:
Robert Candelaria. Positioning: *"We redesign the feeling people get when they
look at your business."*

| | |
|---|---|
| Repo | `~/green-star-solutions` (own repo, public on GitHub) |
| Stack | Next.js 16.2.9 App Router · React 19 · Tailwind v4 · TypeScript |
| Output | **Static export** — `output: "export"`, `images: { unoptimized: true }`, `trailingSlash: true` |
| Dev | `npm run dev` → port 3000. A `.claude/launch.json` config named **`dev`** already exists — use `preview_start {name: "dev"}` |
| Live | green-starsolutions.com, Netlify (`taupe-paprenjak-82b1ab`), auto-deploys on push to `main` |
| Fonts | Zilla Slab (`--font-display`), Work Sans (`--font-body`), JetBrains Mono (`--font-mono`) — all via `next/font/google` in `app/layout.tsx`, all with weight 500 already loaded |

---

## 2. The problem being solved

Robert's words: **the site "looks like it was built by AI."** He's right, and the
root cause is concrete: **`public/` contained zero images.** A type-only site
reads as machine-made because AI can't take photographs, so every AI-built site
is type-only. Everything else is a symptom of that.

The full ten-tell diagnosis is in `VISUAL_REBUILD.md` §0. The short version, all
verifiable in this codebase:

- `01/02/03` mono indices in three consecutive sections
- The same ✦-plus-uppercase-tracked-label eyebrow scaffold five times running
- A one-word serif-italic swap five times (`<span className="serif accent">`)
- Perfect symmetry everywhere, nothing hand-placed
- `↗`/`↓` glyphs on every CTA
- One animation applied uniformly with a `delay={i * 90}` stagger
- Three typefaces fighting each other

---

## 3. Reference and — critically — its scope

The visual reference is **https://everyday.io**.

> ### ⚠ Robert's explicit constraint: **"I want to fit the vibe, not the actual structure."**
>
> An earlier draft of this plan cloned everyday.io's section architecture and
> proposed deleting `Process` and `Industries`. **He rejected that.**
>
> **Every existing section stays exactly where it is. No deletions, no
> reordering, no new sections, no rewriting his copy.** What changes is type,
> light, air, motion, and the presence of imagery. Nothing else.

What we're taking from the reference: one font weight (500) everywhere · a tiny
five-size scale · no eyebrows, no mono, no italic, no uppercase tracking · label
and statement at the same size differentiated only by opacity · colour coming
from photographs rather than brand fills · hard directional light and matte
materials · generous air · quiet frosted low-contrast buttons · an 8px page
inset so media floats on paper · fade-plus-blur motion instead of translate-up.

What we are **not** taking: sticky-pinned scroll crossfades, video bookends,
carousels with dot indicators, their plate architecture, or text mandatorily
sitting on top of media.

---

## 4. The assets

Robert generated these in ChatGPT. **They are in `public/media/`, already named
correctly, and verified by eye against their intended slots** (2026-07-25).

> **They are `.png`, not `.jpg`** — nine files, ~20 MB total, roughly 2 MB each.
> Straight off ChatGPT, untouched. **Converting and compressing them is the
> first build task**, not an afterthought: the site is a static export with
> `images: { unoptimized: true }`, so whatever sits in `public/` is exactly what
> ships to users. 20 MB of PNG on a marketing homepage would be a worse problem
> than the one we're fixing.

| File (in `public/media/`) | Actual px | Ratio | Placement |
|---|---|---|---|
| `hero-plate.png` | 1916×821 | 21:9 | Full-bleed plate directly below `Hero` |
| `dept-perception.png` | 1122×1402 | 4:5 | Beside Services rung 01 |
| `dept-conversion.png` | 1122×1402 | 4:5 | Beside Services rung 02 |
| `closing-plate.png` | 1672×941 | 16:9 | Plate behind `ClosingCTA` |
| `ind-hvac.png` | 1254×1254 | 1:1 | Industries row 1 |
| `ind-plumbing.png` | 1254×1254 | 1:1 | Industries row 2 |
| `ind-electrical.png` | 1254×1254 | 1:1 | Industries row 3 |
| `ind-roofing.png` | 1254×1254 | 1:1 | Industries row 4 |
| `ind-landscaping.png` | 1254×1254 | 1:1 | Industries row 5 |

### ⚠ `process-texture` was never generated

The dark-concrete texture underlay for the `Process` section **does not exist**.
Two options — raise it with Robert rather than deciding alone:
1. Build `Process` without it. `.surface-forest` stays a flat dark fill, exactly
   as it is today. Nothing breaks; the section just doesn't gain texture.
2. He generates it later from the prompt in `VISUAL_REBUILD.md` §7 (#5) and it
   gets dropped in as a follow-up.

**Do not substitute another image for it.** It's a low-opacity underlay, not a
picture — any of the other assets used there would read as a photograph behind
text and look like a mistake.

### The five industry squares are a bonus

An earlier draft deferred these as P2 and assumed they didn't exist. **They do.**
They're intended as small thumbnails on the five `Industries` rows, ideally
revealed on hover. Treat them as optional polish: if they complicate that
section's editorial list layout, ship without them and say so.

**`og.jpg` does not exist and should not be requested** — crop it from
`hero-plate` at 1.91:1 during the compression pass.

### What the approved images look like (so you can art-direct around them)

- **`hero-plate.jpg`** — wide desert establishing shot at golden hour. An
  ordinary high-roof cargo work van, three-quarter front, occupying the **right
  55%** of frame. Open desert, scrub, mountains and sky fill the **left 40%**.
  Matte forest-green cab meeting warm off-white cargo body on a clean vertical
  break, ✦ four-pointed star on the door, road dust on the rockers. Low sun from
  camera left.
- **`dept-perception.jpg`** — a folded forest-green work polo and matching cap on
  raw cracked concrete, hard raking light from upper left, ✦ embroidered in
  off-white on the chest.

### ⚠ Two hard constraints from the imagery

1. **The left 40% of `hero-plate.jpg` is bright** (warm sky plus sun glow at the
   horizon). **White overlay text will not hold contrast there.** Set the hero
   headline in ink *above* the plate, or overlay in ink — never white-on-image.
   Check the actual rendered contrast; don't assume.
2. **`process-texture.jpg` is not a picture.** It goes behind `.surface-forest`
   at roughly **18% opacity** purely to give that flat dark fill some texture.
   If it reads as a photograph on the page, drop the opacity further.

### Compression

`next.config.ts` sets `images: { unoptimized: true }` and the site is a static
export, so **`next/image` will not optimise anything** — files ship exactly as
they sit in `public/`. Compress manually (`sharp` or `ffmpeg`) before wiring
them in. Targets: hero < 320 KB, the 4:5 pair < 250 KB each, texture < 280 KB,
closing < 300 KB. Source files are ~1900px wide; upscale the hero toward
~2600px if it looks soft full-bleed, and emit `.webp` alongside `.jpg` with a
`<picture>` fallback.

---

## 5. The typographic system to implement

Add to the top of `app/globals.css`:

```css
:root {
  --inset: 8px;                                 /* plates float on paper */
  --plate-radius: 6px;
  --t-display: clamp(2.6rem, 6.5vw, 5rem);      /* Zilla Slab — 2 uses max/page */
  --t-2xl:     clamp(1.75rem, 4.4vw, 3.1rem);   /* Zilla Slab */
  --t-xl:      clamp(1.3rem, 3vw, 2.1rem);      /* Work Sans 500 from here down */
  --t-l:       clamp(1.02rem, 2.2vw, 1.4rem);
  --t-s:       0.875rem;
}
```

**Every heading:** `font-weight: 500`, `line-height: 1.16`, `text-wrap: balance`.

**Delete from `globals.css`:** `.eyebrow`, `.eyebrow--ink`, `.mono`, `.pull`,
`.h-xl`/`.h-lg`/`.h-md`, and the `--font-mono` token.

**In `app/layout.tsx`:** remove the `JetBrains_Mono` import and its `mono`
variable from the `<html>` className. Also drop `style: ["normal", "italic"]`
from `Zilla_Slab` — the italic swaps are being deleted, so the italic face is
dead weight on a static export.

**Identity rules** (the negotiated version — the reference has one typeface and
no accent colour, which taken literally would delete Green Star's identity):
- Keep paper `#f7f5f0` · ink `#16201b` · forest `#0e4a33` · the ✦ mark.
- **Zilla Slab only at `--t-display` and `--t-2xl`.** Work Sans 500 everywhere else.
- **Delete all five serif-italic word swaps** (`<span className="serif accent">`
  around *feeling, leads, trade, trade company, people see you*).
- **Demote forest to near-zero:** the primary button, the ✦, one hairline rule.
  Nowhere else. Colour comes from the photographs now.

---

## 6. Component-by-component

### `components/Nav.tsx`
De-box it — remove the `nav--scrolled` background, `backdrop-filter`, and
border. Links at `--t-s`. Primary CTA changes from a solid forest pill to
frosted glass: `background: rgba(22,32,27,.08)`, `backdrop-filter: blur(10px)`,
1px hairline border. Same links, same order, same hrefs.

### `components/Hero.tsx`
Keep the three-line headline (Robert's voice) and keep the `hero__meta` aside —
that column is distinctive and shouldn't be touched.
- **Add** a full-bleed `hero-plate.jpg` plate directly below the hero, at
  `--inset`, roughly 62vh, `object-fit: cover`, `--plate-radius`.
- Strip `↗` from the primary CTA and `↓` from "See the transformations".
- `hero__eyebrow` becomes plain `--t-s` at 62% opacity — no ✦, no uppercase, no
  letter-spacing.

### `components/Portfolio.tsx` — **no new assets**
The live concept-site iframes are the most honest, strongest thing on the site.
Keep them. Vibe pass only: cards become plates (`--plate-radius`, no border,
hairline of paper between), `work__note` drops to `--t-s` at 55% opacity with no
✦, and `↗` comes off "Explore all six concepts".

### `components/Services.tsx`
Keep both rungs, the copy, and the pricing anchors.
- **Delete `rung__no`** (the `01`/`02`).
- `rung__kicker` and `rung__title` become the **same size** (`--t-l`),
  differentiated by opacity only — 62% and 100%.
- Add `dept-perception.jpg` to rung 01 and `dept-conversion.jpg` to rung 02.
- `rung__tags` lose their pill borders → plain muted list at `--t-s`.
- `rung__price` loses the ✦ and the mono.

### `components/Process.tsx`
Keep all four steps.
- **Delete `pstep__no`** (the `01`–`04`).
- Add `process-texture.jpg` as a background layer behind `.surface-forest` at
  ~18% opacity.
- Remove the ✦ from the eyebrow.

### `components/Industries.tsx`
Keep the five-row editorial list — it's the best-designed thing on the page.
- **Delete `ind-row__no`** and `ind-row__star`.
- The five `ind-*.png` squares exist. Add them as small thumbnails on each row,
  revealed on hover (fade + blur, matching `Reveal`). Keep them genuinely small
  — the row is an editorial list, not a card grid. If they fight the layout,
  ship without them and flag it.

### `components/Process.tsx` — texture asset missing
See §4. Build the section without the underlay unless Robert supplies
`process-texture`. Everything else in the Process pass still applies.

### `components/ClosingCTA.tsx`
- Add `closing-plate.jpg` as a full-bleed plate behind it.
- Remove `star--spin` — the spinning mark is fussy against this vibe. The ✦ itself can stay.
- Strip the `↗`.

### `components/ProjectForm.tsx`
Typographic pass only — the size scale, weight 500, no mono on step indicators,
frosted buttons.

> **⚠ Do not touch the field `name` attributes.** Netlify form detection depends
> on them matching `public/__forms.html` exactly. Form name is `strategy-call`.

### `components/Footer.tsx`
`--inset` padding, strip the mono, `--t-s` throughout.

### `components/Reveal.tsx`
Change from `translateY(22px)` to **fade + `blur(6px)` → `blur(0)`** over 0.9s.
**Remove the `delay={i * N}` stagger from every call site** — everything in a
group arrives together. This single change kills one of the ten tells.

### `components/Audience.tsx`
Already unused (not imported by `app/page.tsx`). Leave it alone or delete it —
Robert's call, don't decide unilaterally.

---

## 7. Repo gotchas — these will bite

1. **Never name a CSS class `.invert`.** It collides with Tailwind v4's `invert`
   filter utility and visually inverts colours. Dark sections use `.surface-forest`.
2. **Turbopack serves stale CSS after edits.** If styles look wrong, `rm -rf .next`
   and restart before debugging anything else.
3. **Do NOT add a `Co-Authored-By: Claude` trailer to commits in this repo.**
   Netlify's free plan allows one contributor on private repos and the trailer
   counted as a second — it's why the repo had to be made public. Keep commits
   single-author.
4. **`next dev` does not serve directory-index for `public/` paths** (Netlify
   does). Concept-site URLs must point at `/concepts/<slug>/index.html` explicitly.
5. Nav and footer anchors are path-prefixed (`/#services`) so they work from
   subpages. Keep them that way.
6. Static export: no server components doing runtime work, no API routes.

---

## 8. Definition of done

1. All five images compressed, in `public/media/`, wired to their plates.
2. Every item in §5 and §6 applied.
3. **Verified in the browser, not just typechecked.** Start the dev server with
   `preview_start {name: "dev"}`, then check: console clean, no layout shift,
   hero headline contrast against the bright left side of the plate, mobile at
   375px, `prefers-reduced-motion`, and the Reveal blur actually firing.
4. `npm run build` succeeds and emits `./out`.
5. Screenshots sent to Robert.
6. **Do not push or deploy without asking.** Push to `main` auto-deploys to the
   live site.

---

## 9. Open questions to raise with Robert (don't decide these alone)

- **The ✦ mark is the universal "AI sparkle"** — the icon Gemini, Copilot, and
  every AI feature button uses. On a site whose entire complaint is "it looks
  AI-built," the logo is literally the AI logo. This was raised late in the
  planning session and left unresolved. Worth revisiting, but it's an identity
  decision and it's his.
- **No human face anywhere on the site.** A real photograph of Robert was
  planned, then deferred. A shooting brief is in `VISUAL_REBUILD.md` §6. If it
  ever happens it **must be a real photo** — never AI-generated.
- Two deferred section ideas that were cut for being structural: a before/after
  transformation, and a "beyond the website" brand-artifact spread. Both are in
  `VISUAL_REBUILD.md` §9.
