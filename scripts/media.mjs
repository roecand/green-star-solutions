/**
 * Convert the source PNGs in public/media/ to shipping .jpg + .webp.
 *
 * The site is a static export with `images: { unoptimized: true }`, so
 * next/image optimises nothing — whatever sits in public/ is exactly what
 * users download. The ChatGPT-generated PNGs are ~2 MB each; unprocessed
 * they would be a worse problem than the one the rebuild is fixing.
 *
 *   node scripts/media.mjs          convert
 *   node scripts/media.mjs --prune  convert, then delete the source PNGs
 *
 * Sources move to media-src/ (outside public/) once pruned, so re-running is
 * possible without regenerating anything.
 */
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const MEDIA = path.join(process.cwd(), "public", "media");
// Sources live OUTSIDE public/ — everything under public/ is copied verbatim
// into out/ by the static export, so 20 MB of source PNGs would ship too.
const SRC = path.join(process.cwd(), "media-src");

/** width = the widest CSS pixel box the image occupies, x2 for retina where cheap. */
const PLAN = [
  // Full-bleed hero plate. Upscaled past its native 1916 so it holds on wide
  // displays — it is the first thing anyone sees.
  { file: "hero-plate", width: 2400, quality: 74, budget: 320 },
  // 4:5 department images, roughly half-column each.
  { file: "dept-perception", width: 1100, quality: 76, budget: 250 },
  { file: "dept-conversion", width: 1100, quality: 76, budget: 250 },
  // Full-bleed plate behind the closing CTA.
  { file: "closing-plate", width: 1672, quality: 74, budget: 300 },
  // Industry row thumbnails — they render at 120px, so 320px covers retina
  // with room to spare. Small on the page, small on the wire.
  { file: "ind-hvac", width: 320, quality: 78, budget: 30 },
  { file: "ind-plumbing", width: 320, quality: 78, budget: 30 },
  { file: "ind-electrical", width: 320, quality: 78, budget: 30 },
  { file: "ind-roofing", width: 320, quality: 78, budget: 30 },
  // Dense foliage — high entropy, so it needs a lower quality to hit the same
  // budget, and hides the artifacts better than any other image here.
  { file: "ind-landscaping", width: 320, quality: 70, budget: 30 },
];

const kb = (bytes) => Math.round(bytes / 1024);

/** Sources start beside the outputs and move to src/ on first prune. */
async function resolveSource(name) {
  for (const dir of [SRC, MEDIA]) {
    const p = path.join(dir, `${name}.png`);
    if (existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const prune = process.argv.includes("--prune");
  await mkdir(SRC, { recursive: true });

  let totalOut = 0;
  let over = 0;

  for (const { file, width, quality, budget } of PLAN) {
    const src = await resolveSource(file);
    if (!src) {
      console.log(`  ${file.padEnd(18)} SOURCE MISSING — skipped`);
      continue;
    }

    const input = await readFile(src);
    const meta = await sharp(input).metadata();

    // Never upscale beyond 1.3x native — past that the softness shows more
    // than the extra pixels help.
    const target = Math.min(width, Math.round(meta.width * 1.3));

    const base = sharp(input).resize({
      width: target,
      withoutEnlargement: false,
      kernel: "lanczos3",
    });

    const jpg = await base
      .clone()
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();

    const webp = await base.clone().webp({ quality: quality - 2 }).toBuffer();

    await writeFile(path.join(MEDIA, `${file}.jpg`), jpg);
    await writeFile(path.join(MEDIA, `${file}.webp`), webp);

    totalOut += jpg.length;
    const flag = kb(jpg.length) > budget ? " ⚠ OVER BUDGET" : "";
    if (flag) over++;

    console.log(
      `  ${file.padEnd(18)} ${String(target).padStart(4)}px  ` +
        `jpg ${String(kb(jpg.length)).padStart(4)} KB  ` +
        `webp ${String(kb(webp.length)).padStart(4)} KB  ` +
        `(budget ${budget} KB)${flag}`
    );

    if (prune && path.dirname(src) === MEDIA) {
      await rename(src, path.join(SRC, `${file}.png`));
    }
  }

  console.log(
    `\n  jpg payload: ${kb(totalOut)} KB across ${PLAN.length} images` +
      (over ? `  — ${over} over budget` : "  — all within budget")
  );
  if (prune) console.log(`  sources moved to media-src/ (outside public/, not shipped)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
