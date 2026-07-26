# START HERE — visual rebuild handoff

Reference card for kicking off the build session. Written 2026-07-25.

---

## 1. Open the new session in the right folder

**The new session must be started in `~/green-star-solutions`** — not in
`~/micro saas app`, which is where the planning session ran. If the working
directory is wrong, every file path below will miss.

```
cd ~/green-star-solutions
```

Then start Claude Code there.

---

## 2. Paste this as the opening prompt

```
Working in ~/green-star-solutions — the Green Star Solutions marketing site
(Next.js 16, Tailwind v4, static export, deploys to green-starsolutions.com).

Read BUILD_BRIEF.md in the repo root first. It's a complete handoff from a
planning session and contains everything: the problem, the design system to
implement, component-by-component changes, the image manifest, and the repo
gotchas. VISUAL_REBUILD.md has the fuller reasoning if you want it.

Short version: the site reads as AI-built, mainly because it had zero
photographs. I've generated nine images and they're already in public/media/
with correct names. Your job is to convert and compress them, wire them in, and
apply the typographic and motion pass described in the brief.

The single most important constraint, and I've already had to correct this
once: fit the VIBE of the reference (everyday.io), not its structure. Every
section of my homepage stays exactly where it is. No deletions, no reordering,
no new sections, no rewriting my copy. Type, light, air, motion, and imagery
only.

Start by verifying which image files actually landed in public/media/, then
give me your plan before you touch anything.
```

That's the only thing you need to copy. The prompt points the session at
`BUILD_BRIEF.md`, which points at everything else.

**Alternative:** if you'd rather use a file reference than paste the whole
thing, `@BUILD_BRIEF.md` works once the session's working directory is the repo
root — but you'd still want to say the vibe-not-structure line out loud, since
it's the one thing a session is most likely to get wrong.

---

## 3. The three documents, and what each is for

| File | Purpose | Who reads it |
|---|---|---|
| **`START_HERE.md`** | This card. The prompt and the current state. | You |
| **`BUILD_BRIEF.md`** | The spec. Design tokens, component-by-component changes, asset manifest, repo gotchas, definition of done. | The build session — this is the one that matters |
| **`VISUAL_REBUILD.md`** | The reasoning. Reference-site analysis, the ten AI tells, the full image-generation history and every prompt used. | Optional background, or if you generate more assets |

They're deliberately split so there's one source of truth per thing. If a detail
changes, it changes in `BUILD_BRIEF.md`.

---

## 4. State as of handoff

### ✅ Done
- Nine images generated, named, verified by eye, and sitting in `public/media/`
- Full build spec written
- Design token system and per-component changes specified

### 📦 Assets in `public/media/`

| File | Ratio | Goes where |
|---|---|---|
| `hero-plate.png` | 21:9 | Full-bleed plate below the Hero |
| `dept-perception.png` | 4:5 | Services rung 01 |
| `dept-conversion.png` | 4:5 | Services rung 02 |
| `closing-plate.png` | 16:9 | Behind the closing CTA |
| `ind-hvac.png` | 1:1 | Industries row 1 |
| `ind-plumbing.png` | 1:1 | Industries row 2 |
| `ind-electrical.png` | 1:1 | Industries row 3 |
| `ind-roofing.png` | 1:1 | Industries row 4 |
| `ind-landscaping.png` | 1:1 | Industries row 5 |

### ⚠ Known gaps — expect the session to raise these

1. **`process-texture` was never generated.** The dark concrete underlay for the
   "How it works" section. Not a blocker — that section just stays a flat dark
   fill. The prompt for it is in `VISUAL_REBUILD.md` §7 (#5) if you want to make
   it later.
2. **The images are PNGs, ~20 MB total.** Converting and compressing them is the
   first build task, not cleanup. The site is a static export with image
   optimisation off, so whatever is in `public/` is exactly what ships.
3. **The ✦ mark is the universal "AI sparkle"** — the icon Gemini, Copilot, and
   every AI button uses. On a site whose whole complaint is "it looks AI-built,"
   the logo is literally the AI logo. Unresolved, and it's your call. Flagged in
   the brief as a question, not an action.
4. **No human face anywhere on the site.** A real photo of you was planned then
   deferred. Shooting brief is in `VISUAL_REBUILD.md` §6. If it happens it must
   be a real photo — never AI-generated.

---

## 5. Two things to hold the session to

- **Verify in the browser, not just typecheck.** There's a `.claude/launch.json`
  config named `dev` — the session should actually run the site and send you
  screenshots, including mobile at 375px.
- **Don't let it push or deploy without asking.** `main` auto-deploys straight
  to the live site via Netlify.
