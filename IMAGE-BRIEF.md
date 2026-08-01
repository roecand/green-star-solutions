# Image brief — Green Star Solutions

Every photograph the redesigned site needs, with a prompt you can paste into
ChatGPT. Written 2026-07-27.

All nine positions are **currently filled with holding images** so the live
site does not read as unfinished. Every one of them fails the measured targets
below and should be replaced.

**Do these three first.** The hero van, the perception polo and the closing van
all visibly carry the four-point ✦ sparkle: on the van door, embroidered on the
polo chest, and on the van flank respectively. That is the exact glyph this
redesign removed from the brand, so the site currently argues against itself in
its three largest photographs. Everything else on this list is a quality
upgrade; these three are a correctness fix.

---

## The targets, and why the old images miss them

`DESIGN-STANDARD.md` §3 sets these from a teardown of clay.global, ideo.com
and uxstudioteam.com. We are on the **studio** route, not the documentary one.

| | Target (studio) | Current images |
|---|---|---|
| subject isolation | **> 2.5** | 1.4 |
| background brightness | **> 140** | 92 |
| background uniformity (SD) | **< 40** | high |
| image lightness | **~50-60** | 27 |
| image vs page brightness gap | **< 45 points** | 67 points |

The page ground is lightness ~94. Images at lightness 27 read as heavy
holes punched in paper, which is the single largest remaining visual gap.

**What that means in plain language:** every current image is *atmosphere* —
dark, moody, nothing clearly the subject, everything vibe. That is the AI
image default, and it is the visual equivalent of hedged writing. We want one
obvious subject, sharp, sitting on a bright clean background.

**Rules for every prompt below:**

- One subject. Bright, clean, uncluttered background.
- Hard directional daylight. Real shadows with defined edges.
- No visible faces. No readable logos, brand names, or signage.
- No text anywhere in the image.
- Nothing purple, teal, or gradient-lit. Neutral daylight colour only.
- Landscape unless stated.

---

## 1. HERO — the band under the headline

**Slot id:** `HERO` · **Size:** 2400 x 1000 (21:9) · **File:**
`public/media/hero-plate.jpg`

> A single white commercial work van parked on a residential street in Las
> Vegas, photographed three-quarter front from a low angle. Hard late-afternoon
> desert sunlight from the left, casting a crisp defined shadow on the asphalt.
> The van is sharply in focus and clearly the subject, isolated against a
> bright pale stucco garage wall that fills the background. The background wall
> is smooth, evenly lit and almost featureless. Bright, high-key, sunlit
> exposure — the overall image should feel light, not moody. No people, no
> visible text, no logos or lettering on the van, no clutter in frame.
> Photographic, shot on a 50mm lens, sharp, editorial commercial photography.

**Why this shot:** it is the first thing a visitor sees and it has to carry the
whole "this company is established" claim in one frame. A clean van against a
bright wall is the trades equivalent of a product shot on white.

**Current holding image:** a green and white van on open desert at sunset,
mountains behind. Dark, no isolated subject, and it has the retired sparkle on
the door. Highest-priority replacement on the site.

---

## 2. DEPT-A — the Perception panel

**Slot id:** `DEPT-A` · **Size:** 1600 x 900 (16:9) · **File:**
`public/media/dept-perception.jpg`

> A neatly folded dark forest-green work polo shirt with a matching cap resting
> on top, squared up and centred on a smooth pale concrete surface.
> Photographed straight down from directly above. Hard morning sidelight from
> the right creating one crisp, well-defined shadow. The clothing is the only
> object in frame and is sharply in focus. The concrete background is bright,
> smooth and evenly toned. High-key, bright exposure. No text, no logos, no
> embroidery, no branding of any kind. Photographic, editorial product
> photography, sharp detail in the fabric weave.

**Current holding image:** the right composition already, but the polo has the
retired four-point sparkle embroidered on the chest. "No embroidery, no
branding of any kind" in the prompt above is there specifically to stop that
recurring.

---

## 3. DEPT-B — the Conversion panel

**Slot id:** `DEPT-B` · **Size:** 1600 x 900 (16:9) · **File:**
`public/media/dept-conversion.jpg`

> A modern smartphone lying face-up on the light grey fabric passenger seat of
> a pickup truck, screen lit and glowing, showing a blank plain interface with
> no readable text. Shot from above at a slight angle. Bright daylight coming
> through the passenger window fills the cabin. The phone is sharply in focus
> and clearly the subject; the seat and interior fall away softly. Overall
> bright and clean rather than dark or night-time. No people, no hands, no
> readable text or app icons, no logos. Photographic, shallow depth of field,
> editorial.

**Current holding image:** a phone lit on a truck seat at dusk. It is the only
one of the four large photographs with no retired sparkle in it, so it is the
least urgent, but it still measures lightness 27. Daylight is a deliberate
change.

---

## 4. CLOSING — the full-bleed band above the form

**Currently filled** with `closing-plate.jpg`. **Replace it.**

**Size:** 2400 x 1350 (16:9) · **File:** `public/media/closing-plate.jpg`

> A white commercial work van parked in the driveway of a single-storey Las
> Vegas home at golden hour, photographed from a low three-quarter rear angle.
> Warm low sun raking across the scene from the left. The van is clearly the
> subject and sharply in focus. The sky occupies the upper third and is bright
> and open. Rich but not dark — detail visible everywhere in the frame. No
> people, no readable text, no logos or lettering on the van, no graphics on
> the vehicle at all. Photographic, cinematic, editorial commercial
> photography.

> **Replace this one specifically.** The current image has a four-point
> sparkle logo painted on the side of the van — the exact glyph we just removed
> from the brand for looking machine-generated. It is small but it is there,
> and it is on the largest image on the page.

**You can swap this one freely.** The copy no longer sits directly on the
photograph: it sits on a solid forest card floating over it, so contrast is a
constant 8.9:1 no matter what the image does. The scrim underneath is light
(0.20 to 0.42) and exists for depth and colour unity only.

That structure came out of measuring this exact failure. A scrim heavy enough
to make copy legible *directly over* this photo needed 0.46/0.76, and even
then reached only 4.33:1 while flattening the plate to near-solid green — the
same regression that shipped from this file once before. Do not "fix" a future
image by darkening the scrim. The card is the fix.

---

## 5-9. TRADE THUMBNAILS

**Currently filled** and working, but all five are dark and low-isolation.
Replace when you get a chance; the page reviews fine without it.

**Size:** 800 x 800 (square) · **Files:** `public/media/ind-*.jpg`

Shared prefix for all five — paste this, then the specific line:

> Square format. One object, centred, sharply in focus, photographed against a
> bright smooth pale wall in hard directional daylight with one crisp shadow.
> High-key bright exposure. No people, no text, no logos, no clutter.
> Photographic, editorial, sharp.

| File | Add this line |
|---|---|
| `ind-hvac.jpg` | A clean outdoor air-conditioning condenser unit standing beside a pale stucco wall. |
| `ind-plumbing.jpg` | A neat assembly of new copper and brass pipework and fittings, standing upright. |
| `ind-electrical.jpg` | An open electrical breaker panel with neatly dressed, colour-coded wiring. |
| `ind-roofing.jpg` | A close view of new asphalt shingles along a clean gutter edge in raking light. |
| `ind-landscaping.jpg` | A single mature agave planted in pale gravel beside a stacked stone wall. |

---

## After you generate them

1. Drop the `.jpg` into `public/media/` using the exact filename above.
2. **Check it before wiring it up:**
   ```
   node scripts/design-audit.mjs public/media/hero-plate.jpg
   ```
   It prints isolation, lightness, background brightness and uniformity with
   pass/fail flags against the table at the top of this file. If it fails,
   regenerate rather than shipping it — this is the exact step that was skipped
   last time.
3. Generate the `.webp` twin:
   ```
   node scripts/media.mjs
   ```
4. For the three slot positions, pass the file to the component. In
   `components/Hero.tsx`:
   ```tsx
   <Slot id="HERO" spec="..." src="/media/hero-plate.jpg" alt="..." priority />
   ```
   The slot becomes the photograph with no other change. Same for `DEPT-A` and
   `DEPT-B` in `components/Departments.tsx`.
5. **Write the alt text from the actual pixels, not from this brief.** Four of
   six alt strings were wrong last time because they were written from
   filenames. Open the image first.

---

## Two things not to generate

- **Never AI-generate a human face.** If a person appears on this site it has
  to be a real photograph of a real person. There is a shooting brief for
  Robert in `VISUAL_REBUILD.md` §6.
- **`media-src/` is 20 MB of gitignored source PNGs that exist on one Mac and
  nowhere else.** They are not reproducible. Back them up before generating
  anything new that lands in the same folder.
