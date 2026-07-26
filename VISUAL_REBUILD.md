# Visual Rebuild — borrowing the Everyday^ *vibe*, keeping our own structure

Reference for **feel only**: https://everyday.io (via siteinspire)
Written 2026-07-25, revised same day after Robert's note: *"I want to fit the
vibe, not the actual structure."*

**Scope rule for this document:** every section of the homepage stays where it
is. Nothing gets deleted, nothing gets reordered, no new sections get invented.
What changes is type, light, air, motion, and the fact that materials appear at
all.

---

## 0. Why the site reads as AI-built

Ten tells, all in our own code:

| # | Tell | Where |
|---|---|---|
| 1 | **Zero photographs.** `public/` contains two files: `__forms.html`, `robots.txt`. Not one image on the entire site. | — |
| 2 | **No human face** on a site selling perception. | — |
| 3 | `01/02/03` mono indices in three consecutive sections | `Services.tsx`, `Process.tsx`, `Industries.tsx` |
| 4 | Identical eyebrow scaffold (✦ + uppercase tracked label) five times running | every section |
| 5 | One-word serif-italic swap, five times: *feeling, leads, trade, trade company, people see you* | `<span className="serif accent">` |
| 6 | Formula copy — em-dash per sentence, "You don't have an X problem…", triads | Hero, Services |
| 7 | Perfect symmetry: 2-up, 4-up, 5-row, 3-up. Nothing off-grid or hand-placed. | all grids |
| 8 | `↗` / `↓` glyphs on every CTA | Hero, Portfolio, ClosingCTA |
| 9 | One animation applied uniformly (`fade-up`, `delay={i * 90}`) | `Reveal.tsx` |
| 10 | Three typefaces fighting: slab serif + sans + mono, plus italic swaps | `globals.css` |

**#1 is the root cause.** Type-only sites read as machine-made *because AI can't
take photographs* — so every AI-built site is type-only. The rest are symptoms.

---

## 1. Splitting the reference into vibe and structure

I pulled everyday.io's live DOM. Here's the honest split.

### ✅ The vibe — transferable, this is what we take

| | What it is |
|---|---|
| **One weight** | Every heading on their site is weight **500**. Not one bold, not one light. |
| **A tiny named size scale** | Five sizes, full stop: 64 / 37 / 26 / 18 / 14px at 800px wide. Nothing in between. |
| **No type ornament** | No eyebrows. No uppercase tracking. No mono. No italic. No indices. |
| **Label = statement** | "Hardware" and the line under it are the *same size and weight* — separated only by opacity. |
| **Materials carry the colour** | No brand accent anywhere. Oak, bone, concrete, brushed steel, black. Colour comes from things, not fills. |
| **One hard light** | Single directional source, real shadow falloff, matte surfaces. Nothing is flat-lit. |
| **Abstract macro** | You cannot identify the hero object. Texture and edge, not product shots. Zero people. |
| **Air** | 1053px of height for a 28-word sentence. Emptiness is the design. |
| **Quiet UI** | Frosted translucent buttons, low contrast, small. Text links with no arrows and no icons. |
| **Plate treatment** | 8px page inset, ~6px radius, so media floats on paper with a hairline around it. |
| **Calm motion** | Fade **+ blur**, slow. No translate-up cascade, no staggered delays. |
| **Fewer words** | Two-line statements, `text-wrap: balance`, deliberate breaks. |

### ❌ The structure — **not taking any of this**

Sticky-pinned scroll crossfades · video bookends top and bottom · the carousel
with dot indicators · their 8-plate architecture · one-sentence-per-viewport
pacing · text mandatorily sitting *on* media · and — from my first draft —
deleting Process and Industries, inventing a before/after section, inventing an
artifacts section, inventing a founder section. **All of that is out.** Our
sections are our sections.

---

## 2. What this means for our identity

The vibe layer says "one typeface, one weight, no accent." Taken literally that
deletes Green Star. So, the negotiated version:

- **Keep** paper `#f7f5f0` · ink `#16201b` · forest `#0e4a33` · the ✦ mark.
- **Keep Zilla Slab**, but restrict it to the two largest sizes only. It stops
  being a texture applied everywhere and becomes a deliberate accent.
- **Work Sans 500** carries everything else. Establish the five-size scale.
- **Drop JetBrains Mono from the homepage.** It is the direct engine of tells
  #3 and #4 — the mono indices and the eyebrows both come from it. Keep it for
  the leak-scanner app if you want it there.
- **Delete all five serif-italic word swaps.** Every one.
- **Demote forest to near-zero:** the primary button, the ✦, and one hairline
  rule. Nowhere else. Colour comes from the photographs now.

**The load-bearing risk:** their austerity works *because* the pictures carry
everything. If we strip the type ornament and the imagery is mediocre, the page
goes calm-and-dead instead of calm-and-expensive — worse than today. Image
quality decides this. §4 and §5 are about that, and they're the parts to read
twice.

---

## 3. Section by section — same structure, new atmosphere

Token set to add at the top of `globals.css`:

```css
:root {
  --inset: 8px;                                 /* plates float on paper */
  --plate-radius: 6px;
  --t-display: clamp(2.6rem, 6.5vw, 5rem);      /* Zilla Slab — 2 sizes only */
  --t-2xl:     clamp(1.75rem, 4.4vw, 3.1rem);   /* Zilla Slab */
  --t-xl:      clamp(1.3rem, 3vw, 2.1rem);      /* Work Sans 500 from here down */
  --t-l:       clamp(1.02rem, 2.2vw, 1.4rem);
  --t-s:       0.875rem;
}
/* every heading: font-weight 500 · line-height 1.16 · text-wrap: balance */
```

Delete from `globals.css`: `.eyebrow`, `.eyebrow--ink`, `.mono`, `.pull`,
`.h-xl/.h-lg/.h-md` (superseded by the scale), and the `--font-mono` token.

### `Nav.tsx`
De-box it. Kill the `nav--scrolled` background, blur, and border — let it sit on
the page unstyled. Links stay at `--t-s`. The CTA goes from a solid forest pill
to a **frosted glass** button (`background: rgba(22,32,27,.08)`,
`backdrop-filter: blur(10px)`, 1px hairline). Same links, same order.

### `Hero.tsx` — where the vibe lands hardest
Keep the three-line headline in Robert's voice. Keep the `hero__meta` aside;
that column is genuinely distinctive and nothing like a template.

**The one change:** a full-bleed material plate directly beneath the hero, at
`--inset`, ~62vh. The headline still sits on paper — but the first thing you
scroll into is a big calm macro of a real surface. That's the everyday.io feeling
without adopting their video-hero structure.
- Asset **#1** `hero-plate.jpg` (+ optional **#2** `hero-plate.mp4`)
- Strip the `↗` from the primary CTA and the `↓` from "See the transformations"
- `hero__eyebrow` becomes plain `--t-s` text at 62% opacity — no ✦, no uppercase, no tracking

*Bolder option if you want it:* overlay the headline on the plate instead. The
asset prompt reserves negative space on the left either way, so you can decide
after you see it.

### `Portfolio.tsx` (The Work) — **no new assets needed**
The live iframes are the strongest, most honest thing on the site — real working
sites, not renders. Keep them. Vibe pass only:
- Cards become plates: `--plate-radius`, no border, hairline of paper between
- Kill the `work__note` mono line → `--t-s`, 55% opacity, no ✦
- Delete `↗` from "Explore all six concepts"

### `Services.tsx` (the two departments)
Keep both rungs, keep the copy, keep the pricing anchors.
- **Delete `rung__no`** (the `01`/`02`) — this is tell #3
- `rung__kicker` and `rung__title` become the same size (`--t-l`), differentiated
  by opacity only — 62% and 100%. That's the everyday.io label-equals-statement move.
- Each rung gets a material image beside it: assets **#3** and **#4**
- `rung__tags` lose their pill borders → plain comma-free list at `--t-s`, muted
- `rung__price` loses the ✦ and the mono

### `Process.tsx` (How it works)
Keep all four steps. It's already on `surface-forest`, which suits the vibe.
- **Delete `pstep__no`** (the `01`–`04`) — tell #3 again
- Add one wide atmospheric image as the section backdrop at 18% opacity behind
  the forest, so the dark surface has texture instead of being a flat fill:
  asset **#5**
- Kill the ✦ in the eyebrow

### `Industries.tsx`
Keep the editorial five-row list — it's the most designed thing on the page.
- **Delete `ind-row__no`** and `ind-row__star`
- Optional, P2: a small material thumbnail per row that fades in on hover
  (assets **#7–11**). The section reads fine without them; do these last.

### `ClosingCTA.tsx`
- Add one full-bleed plate behind it: asset **#6**
- Drop `star--spin` — the spinning mark is fussy against this vibe. The ✦ can
  stay, still.
- Strip the `↗`

### `ProjectForm.tsx`
No assets. Typographic pass only: the five-size scale, weight 500, no mono on
the step indicators, frosted buttons. **Don't touch the field names** — Netlify
form detection depends on them matching `public/__forms.html`.

### `Footer.tsx`
`--inset` padding, strip the mono, `--t-s` throughout.

### `Reveal.tsx`
Change the animation from `translateY(22px)` to **fade + `blur(6px)` → `blur(0)`**
over 0.9s. Remove the `delay={i * N}` stagger from every call site — everything
in a group arrives together. That single change kills tell #9.

---

## 4. Asset manifest — 6 to ship

All under `public/media/`. **#1, #3, #4, #5, #6 ship the whole redesign.**

| # | File | Ratio | Target | Where | Pri |
|---|---|---|---|---|---|
| 1 | `hero-plate.jpg` | 21:9 | < 320 KB | below Hero | **P0** |
| 2 | `hero-plate.mp4` | 21:9 | < 4 MB | same, progressive enhancement | P1 |
| 3 | `dept-perception.jpg` | 4:5 | < 250 KB | Services rung 01 | **P0** |
| 4 | `dept-conversion.jpg` | 4:5 | < 250 KB | Services rung 02 | **P0** |
| 5 | `process-texture.jpg` | 16:9 | < 280 KB | Process backdrop | **P0** |
| 6 | `closing-plate.jpg` | 16:9 | < 300 KB | ClosingCTA | **P0** |
| 7–11 | `ind-{hvac,plumbing,electrical,roofing,landscaping}.jpg` | 1:1 | < 120 KB ea | Industries hover | P2 |
| 12 | `og.jpg` | 1.91:1 | < 300 KB | metadata | P1 |
| 13 | `robert.jpg` | 4:5 | < 250 KB | Footer / ClosingCTA — **optional, real photo only** | P1 |

Generate at 2× display size and hand them over uncompressed — I'll run the
`sharp`/`ffmpeg` pass on drop-in. Don't hand-optimise.

---

## 5. Prompt hygiene — read before generating

AI imagery usually makes a site look *more* machine-made, because these models
default to plastic, over-lit, hyper-symmetrical HDR. Every prompt below carries
the antidotes; know them so you can push back on a bad generation:

1. **Name a camera, lens, and film stock.** Kills the HDR-plastic look better
   than anything else.
2. **Name exactly one hard light source**, demand real shadow falloff. Flat
   ambient light reads synthetic instantly.
3. **Demand a flaw** — dust, a fingerprint, a scuff, one blown highlight, a
   slight vignette. Perfection is the tell.
4. **Forbid the signatures:** no lens flare, no bokeh balls, no HDR, no
   oversaturation, no glossy plastic, no perfect symmetry, no watermark.
5. **No people, no hands, no faces** on any material plate. Hands are where
   these models fail hardest, and one bad hand discredits the page.
6. **State the palette in hex**, say *muted, desaturated, warm neutral*.
7. **State the ratio in the prompt AND the tool setting.** Prompt text alone is
   unreliable.

### Model routing — **ChatGPT for everything** (Robert's call, 2026-07-25)

All stills are being made in ChatGPT. #2 (video) is optional and would need Veo
or Sora separately; skip it for now.

**The consistency problem, and how to beat it in ChatGPT.** Gemini locks a look
by taking a reference image. ChatGPT is weaker at faithfully matching an
attached reference — it tends to reinterpret. The workaround is conversational
memory:

> **Generate all six images in ONE unbroken ChatGPT conversation.**

Within a single thread the model holds the visual context of what it just made
and matches it far better than it will match an uploaded file in a fresh chat.
Between images, say *"same grade, same light direction, same film stock as the
last one"* rather than re-describing the look from scratch.

If the thread drifts — and it will after four or five images — paste #1 back in
and say *"reset to this grade."* Don't start a new conversation to fix drift;
you'll lose the thread's memory and it'll get worse.

Six images generated independently look like six stock photos. Six from one
thread look like a commissioned shoot. That difference is the entire point.

### ⚠ #1 is locked — and it overrides the prompt text

`hero-plate.jpg` came out **warmer and more golden** than the written prompts
describe. It's good, and it's now the reference for the whole set. So for #3–#6:

- **Delete the phrase "strictly muted desaturated" from the remaining prompts.**
  Left in, it will pull them cooler than #1 and the set won't agree.
- Replace it with: *"warm golden low-sun grade matching the previous image."*
- Where a prompt names a *subject* colour (forest green, concrete) keep it —
  it's the overall temperature that needs to follow #1, not the materials.

**The image wins over the text.** If a prompt below contradicts what #1 actually
looks like, follow #1.

---

## 6. ⚠ Never generate

**#13 `robert.jpg` must be a real photograph of you.**

An AI portrait of the founder, on a page whose whole argument is authenticity,
is the fastest thing to get caught on. It's optional in this plan — but if it
goes in, it's real. Phone brief:

- **When:** within 45 min of sunset, or fully overcast. Never midday.
- **Where:** outdoors, plain warm wall — stucco, block, garage door. No logos, no cars.
- **Frame:** portrait orientation, chest-up, camera at eye level, ~4 ft back.
  **Use the 2× lens, not the wide** — the wide distorts faces.
- **Light:** sun behind and to one side; face lit by sky, not sun. Sun on your
  face means squinting, which reads as a driver's licence photo.
- **Wear:** what you'd wear to a $10k pitch. Solid colour, no pattern.
- **Do:** 30 frames, look slightly off-lens on half, don't grin.
- **Don't:** portrait mode, beauty filter, flash.
- Send all 30 — picking the frame is part of the design.

Also never: fake technicians, fake customers, fake reviews, or any legible real
business name in an image.

---

## 7. The prompts

Palette in every prompt: `#f7f5f0` warm paper · `#16201b` green-black ·
`#0e4a33` forest · `#8c8678` stone.

---

### #1 · `hero-plate.jpg` — ChatGPT · 21:9 — **generate first**

## ✅ **#1 APPROVED at v4** (2026-07-25, four rounds)

Final image: wide 21:9 desert establishing shot at golden hour. An ordinary
high-roof cargo work van, three-quarter front, in the right 55% of frame; open
desert, scrub, mountains and sky in the left 40%. Matte forest-green cab meeting
warm off-white cargo body on a clean vertical break, ✦ four-pointed star on the
front door, honest road dust on the rockers and wheels. Low sun from camera left.

**This is now the grade reference for the entire set.** Warm golden low sun,
matte surfaces, Portra-400 grain, muted but warm — *not* the "strictly muted
desaturated" language the original prompts used.

**Build note:** the left 40% is bright (warm sky + sun glow at the horizon), so
white overlay text will not hold contrast there. Set the hero headline in ink
above the plate, or overlay in ink — not white-on-image.

**Open:** delivered at 1919px wide. A full-bleed 21:9 hero wants ~2600px+.
Upscale on drop-in if no larger native export is available.

### What the four rounds taught us

| v | Approach | Outcome |
|---|---|---|
| 1 | Extreme macro of a vinyl edge | *"I don't know what that is"* |
| 2 | Pulled back to door seam + wheel arch | *"still don't know what this is"* |
| 3 | Wide shot, whole van | Composition solved — but a futuristic EV concept van, glossy, no dust |
| 4 | Same frame, ordinary work van, flat matte, clean wrap break, ✦, dust | **Approved** |

Two lessons worth carrying into every remaining image:
1. **Legible beats abstract.** (v1→v2)
2. **Specify the ordinary.** Left to itself the model reaches for futuristic and
   glossy every time. Name the mundane version explicitly, and name "flat matte,
   zero specular reflection" or you'll get a car commercial. (v3→v4)

---

<details>
<summary>Full iteration history and superseded prompts</summary>

**Status 2026-07-25:** v1 generated and approved for light, grade, texture, and
composition — but Robert's reaction was *"I don't know what that's supposed to
be."* Fair: everyday.io can afford total abstraction because their site
eventually reveals the product, so the mystery resolves. Ours never shows a
product, so an abstract hero is a tease with no payoff. **Decision: pull back to
"somewhere between"** — readable as a vehicle panel in about a second, still
cropped tight enough that the whole van is never visible.

**v2 failed too.** Pulled back to show a door seam and wheel arch; Robert's
response was still *"I don't know what this is supposed to be."* Two rounds is
enough evidence — the premise was wrong, not the execution.

**Why the abstraction was never going to work here.** Withholding only pays off
when there's a known object being withheld. everyday.io's macro is a tease for
*their own product*, which the site later reveals — the crop resolves. A van
panel has nothing to reveal; it's just a surface, so there's no click moment.
I over-fit to their imagery instead of their *principles* (hard light, matte
materials, restraint, air), which are what actually transfer.

**v3 — the real direction: a legible, wide establishing shot.** Show the whole
van. It's also better on-message: "We redesign how people see you" beside a
company that visibly looks expensive is a complete argument a trade owner reads
in a tenth of a second.

```
New shot, same world. Keep the warm golden low-sun grade, the same film stock
and grain, the same matte surfaces and hard low sun from the left, and the same
21:9 framing as the previous images. Same desert location with the distant
mountains.

Pull all the way back to a wide establishing shot: the entire commercial service
van, seen in a three-quarter front view, parked at the edge of a desert road
outside Las Vegas at golden hour. The van sits in the right 55% of the frame.
The left 40% is open desert floor, low scrub, and sky — clean, quiet negative
space with nothing in it.

The van is wrapped in matte deep forest green (#0e4a33) over warm off-white
(#f7f5f0), immaculate and freshly applied, with one small abstract geometric
mark on the door — no letters, no words, no readable text of any kind. Hard low
sun from the left rakes across the side of the van and throws one long soft
shadow across the ground to the right.

35mm lens, T5.6, camera at chest height, shot on Portra 400 with subtle grain
and a slight vignette. An honest photograph, not a car commercial: a film of
road dust along the lower rocker panel, one faint reflection of the landscape in
the panel, the scrub not manicured. Matte throughout — absolutely no showroom
gloss, no wet-look reflections, no polished chrome.

No people, no hands, no faces, no other vehicles, no readable text, no real
logos, no license plate numbers, no lens flare, no bokeh balls, no HDR, no
oversaturation, no watermark.
```

**Failure mode is now the opposite:** this will want to look like a truck
commercial — glossy, wet, over-lit, low hero angle. If it comes back shiny:
*"matte, not glossy — flat paint finish, no reflections, more dust."*

<details>
<summary>v2 prompt (superseded)</summary>

```
Keep everything about that last image — same warm golden low-sun grade, same
film stock and grain, same matte surfaces, same hard light direction from the
left, same 21:9 framing, same calm negative space across the left 40% of frame.

One change: pull the camera back. Go from a 100mm macro to roughly a 65mm lens,
far enough that it reads unmistakably as the side of a commercial service van
within about a second — I want to see the gentle crown and curve of the body
panel, a clean vertical door seam, and the top arc of a wheel arch curving away
at the bottom of frame. Still cropped tight enough that the whole vehicle is
never visible and there's no window, no mirror, no door handle, no badge.

Keep the crisp cut edge of the matte bone-white vinyl where it meets the
brushed aluminium trim, keep the slightly irregular hand-trimmed wobble in that
edge, keep the small nick in it, keep the fine dust on the panel, and keep the
sliver of dusk desert and distant mountains softly out of focus at the far
right. No people, no hands, no text, no logos, no license plates, no lens
flare, no HDR, no oversaturation, no glossy showroom sheen, no watermark.
```

</details>

<details>
<summary>v1 prompt (superseded)</summary>

```
Photorealistic extreme macro still, ultra-wide 21:9. The crisp cut edge of
freshly applied matte bone-white vinyl on the body panel of a commercial service
van, meeting a strip of brushed aluminium trim, with a narrow sliver of dusk
desert sky at the far right of frame. The left 40% of the frame is a calm
uninterrupted expanse of the panel surface, deliberately reserved as negative
space. 100mm macro lens, T2.8. One hard low sun from the left raking across the
panel, revealing fine vinyl texture, falling off into deep green-black shadow
(#16201b) across the right third. Strictly muted desaturated palette: warm paper
#f7f5f0, warm grey, green-black, one faint cool sky highlight. Matte surfaces
only. Fine dust on the panel, one honest scuff near the vinyl edge, slight lens
vignette, one nearly-blown highlight on the aluminium. Shot on Portra 400,
subtle 35mm grain. No people, no hands, no faces, no text, no logos, no license
plates, no lens flare, no bokeh balls, no HDR, no oversaturation, no glossy
plastic, no perfect symmetry, no watermark.
```
</details>


</details>

### ⚠ Knock-on: rewrite #3–#11 as legible photographs

The two failed hero attempts invalidate the framing of every remaining prompt —
they all say "extreme macro" and "abstract, hard to identify at a glance." Drop
that language everywhere. **Every image should be immediately readable as the
thing it is.**

| # | Was | Now |
|---|---|---|
| 3 | Macro of a collar and embroidery | A folded forest-green work polo and cap, whole, on concrete |
| 4 | Illegible phone glow on a van seat | A phone on the seat of a van at dusk, clearly a phone, screen content still unreadable |
| 5 | Abstract dark surface study | Keep abstract — it's a *texture underlay* at 18% opacity, not a picture. The one exception. |
| 6 | Already legible | No change |
| 7–11 | Extreme macro, "abstract and hard to identify" | Normal close-up product shots: a condenser unit, a copper fitting, an open panel, a shingle edge, a stone border |

What carries the everyday.io feel is **hard directional light, matte surfaces,
no gloss, a muted warm grade, generous negative space, and one honest
imperfection** — none of which requires the subject to be a puzzle. Keep all of
that; drop the mystery.

---

### #2 · `hero-plate.mp4` — Veo 3.1 · 21:9 · 8s loop — *attach #1 as reference*

```
[Attach hero-plate.jpg as the reference / first frame.]

An extremely slow 8-second push-in on this exact frame. The camera moves only 4%
closer over the whole clip — almost imperceptible. Locked tripod: no handheld
shake, no parallax, no rack focus, no pan. Light, grade, and framing stay
identical to the reference throughout. First and last frames nearly identical so
it loops seamlessly. Subtle 35mm film grain. No people, no hands, no text, no
logos, no lens flare, no HDR, no oversaturation, no music, no sound design.
```

---

### #3 · `dept-perception.jpg` — Gemini 3 Pro Image · 4:5 — *attach #1 as reference*

```
[Attach hero-plate.jpg as a reference for grade and light direction.]

Photorealistic extreme macro still, vertical 4:5, same warm-neutral grade and
same hard light direction as the reference. The folded collar and placket of a
dark forest-green (#0e4a33) work polo, with a small tight embroidered mark on
the chest — abstract, unreadable, no legible letters. Beside it, out of focus,
the brim of a matching cap. Laid on raw concrete. 90mm macro, T4. One hard
raking light from the upper left revealing the knit texture of the fabric and
the raised thread of the embroidery; deep soft shadow to the lower right. Muted
desaturated palette: forest green, warm paper #f7f5f0, warm concrete grey,
green-black #16201b. Matte fabric, no sheen. One or two loose fibres, a faint
fold crease, fine concrete dust. Shot on Portra 400, subtle grain, slight
vignette. No people, no hands, no faces, no readable text, no logos, no lens
flare, no bokeh balls, no HDR, no oversaturation, no glossy plastic, no
watermark.
```

---

### #4 · `dept-conversion.jpg` — Gemini 3 Pro Image · 4:5 — *attach #1 as reference*

```
[Attach hero-plate.jpg as a reference for grade.]

Photorealistic macro still, vertical 4:5. The glow of a phone screen resting
face-up on the worn cloth passenger seat of a work van at night, seen at a steep
angle so the screen content is completely illegible — only the cool light and one
soft green glow (#0e4a33) read. Everything beyond the phone falls into deep
green-black shadow (#16201b). 50mm lens, T2.0, shallow focus on the phone edge.
The screen is the only light source in frame. Muted palette: green-black, warm
grey cloth, one cool screen highlight, one small green glow. Visible seat fabric
weave, a faint dust layer, one crumb. Shot on Cinestill 800T, subtle grain,
natural halation around the screen edge only. No people, no hands, no faces, no
readable text, no app icons, no logos, no lens flare, no bokeh balls, no HDR, no
oversaturation, no watermark.
```

---

### #5 · `process-texture.jpg` — Gemini 3 Pro Image · 16:9 — *attach #1 as reference*

```
[Attach hero-plate.jpg as a reference for grade and light direction.]

Photorealistic abstract macro still, 16:9. A large flat expanse of dark
green-black matte surface (#16201b) — the deep-shadow side of a wrapped panel —
filling the entire frame, with one hard raking light entering from the upper
left and dying out before it reaches the right edge. Almost no subject: this is
a study of one surface, its fine texture, a shallow diagonal seam running through
the lower third, and the gradient of light falling off across it. 100mm macro,
T5.6. Strictly muted and very dark: green-black throughout, one narrow band of
warm grey where the light lands, a barely-there hint of forest green (#0e4a33).
Matte, absolutely no gloss or reflection. Fine dust caught in the raking light,
one faint scuff, slight lens vignette. Shot on Portra 400, subtle grain. Low
contrast in the shadows so text can sit legibly on top. No people, no hands, no
text, no logos, no lens flare, no bokeh balls, no HDR, no oversaturation, no
glossy plastic, no perfect symmetry, no watermark.
```

*Sits behind `surface-forest` at ~18% opacity — it should read as texture, not
as a picture. If it looks like a photograph, it's too busy; ask for "even less
subject, more surface."*

---

### #6 · `closing-plate.jpg` — Gemini 3 Pro Image · 16:9 — *attach #1 as reference*

```
[Attach hero-plate.jpg as a reference for grade.]

Photorealistic cinematic still, 16:9. A quiet suburban Las Vegas residential
street at blue hour just after sunset, shot from across the street at a low
angle. In the middle distance, a forest-green (#0e4a33) and warm-white
(#f7f5f0) wrapped commercial service van sits in a driveway; one warm tungsten
light glows in the house window behind it. Desert landscaping and a low block
wall in the foreground, softly out of focus. 35mm lens, T2.8. The van's wrap
carries only an abstract geometric mark — no legible letters or words. Muted
cinematic blue-hour palette: deep blue-grey sky, forest green, warm white, one
warm window highlight, green-black shadow #16201b. An honest photograph, not a
render: road dust on the lower rocker, a crack in the driveway concrete, the
landscaping not manicured. Shot on Portra 400, subtle grain, slight vignette,
one nearly-blown highlight in the window. No people, no hands, no faces, no
moving cars, no readable text, no real logos, no license plate numbers, no lens
flare, no bokeh balls, no HDR, no oversaturation, no watermark.
```

---

### #7–11 · `ind-*.jpg` — ChatGPT / GPT Image · 1:1 · P2

One prompt, five runs. Swap the bracketed subject each time. **Attach #1 as a
reference every run** so all five match.

```
Photorealistic extreme macro still, square 1:1, muted warm-neutral grade.
[SUBJECT]. Shot at very close range so the object is abstract and hard to
identify at a glance — texture and edge, not a product shot. 90mm macro, T4.
One hard raking light from the upper left, deep soft shadow to the lower right.
Strictly muted desaturated palette: warm paper #f7f5f0, warm grey, green-black
#16201b, one faint forest-green note #0e4a33. Matte surfaces only. Fine dust,
one honest scuff or imperfection. Shot on Portra 400, subtle grain, slight
vignette. No people, no hands, no faces, no text, no logos, no lens flare, no
bokeh balls, no HDR, no oversaturation, no glossy plastic, no perfect symmetry,
no watermark.
```

| # | File | `[SUBJECT]` |
|---|---|---|
| 7 | `ind-hvac.jpg` | The fin stack of a condenser coil, seen edge-on, with one clean copper line crossing it |
| 8 | `ind-plumbing.jpg` | A brushed brass compression fitting joining two copper lines on a concrete slab |
| 9 | `ind-electrical.jpg` | The exposed bus bar and neat copper conductors inside an open electrical panel |
| 10 | `ind-roofing.jpg` | The stepped edge of new architectural asphalt shingles against a clean metal drip edge |
| 11 | `ind-landscaping.jpg` | The cut edge of a dry-stacked stone border meeting raked desert gravel and one agave leaf |

---

### #12 · `og.jpg` — Gemini 3 Pro Image · 1.91:1 — *attach #1 as reference*

```
[Attach hero-plate.jpg as a reference.]

Photorealistic still, 1.91:1. Extreme macro of the crisp cut edge of matte
forest-green (#0e4a33) vinyl meeting warm paper white (#f7f5f0) on a flat panel,
filling the left two-thirds of frame, with deep green-black shadow (#16201b)
across the right third — deliberately leaving the right third as clean negative
space for a text overlay. 100mm macro, T5.6, one hard raking light from the
upper left. Muted desaturated palette. Fine dust, one small scuff near the vinyl
edge, subtle grain, slight vignette. Shot on Portra 400. No people, no hands, no
text, no logos, no lens flare, no HDR, no oversaturation, no glossy plastic, no
watermark.
```

---

## 8. Order of operations

1. **You:** generate **#1**. Iterate until it's genuinely good — everything else
   references it, so this is the one worth spending attempts on.
2. **You:** #3, #4, #5, #6 with #1 attached as reference each time.
3. **Check the five together** before handing over. If they don't look shot by
   the same person on the same day, regenerate the outliers against #1 rather
   than accepting them.
4. **Drop into** `public/media/` at full resolution, uncompressed.
5. **Me:** compression pass → the typographic pass across `globals.css` and all
   nine components (scale, weight 500, kill mono/eyebrows/indices/italic swaps/
   arrows) → wire the five plates → the `Reveal` blur change → verify in the
   browser and send you screenshots.
6. Then P1/P2 (#2, #7–13) as a second pass. The site ships without them.

**Reject and regenerate** anything with: a visible person or hand, legible text,
a lens flare, glossy plastic sheen, perfect symmetry, or that oversharp
over-lit HDR look. Those are precisely what would make this worse than what we
have now.

---

## 9. Note on the parts that are still worth doing later

Cut from this plan because they were structural, but worth revisiting once the
vibe pass is live and you can judge it in context:

- **A before/after of one fictional company** — the strongest possible proof for
  a perception studio, since it demonstrates rather than describes. Needs a new
  section, so it's a separate decision.
- **"Beyond the website"** — the brand-artifact spread (wrap panel, polo, cards,
  yard sign, invoice, social grid). This is what makes an $8,500 fee legible
  instead of arbitrary. Also a new section.
- **Your face somewhere on the page** — tell #2 doesn't get fixed by any of the
  above, and it's the one an actual prospect is most likely to feel.
