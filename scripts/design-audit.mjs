/**
 * Image-style audit — measures the pixel qualities that separate art-directed
 * photography from AI "atmosphere". See DESIGN-STANDARD.md §3 (Imagery).
 *
 *   node scripts/design-audit.mjs <imageUrl> [<imageUrl> …]
 *   node scripts/design-audit.mjs --site https://example.com/a.jpg,https://…/b.jpg
 *
 * Targets (studio route):  isolation > 2.5 · bgBrightness > 140 · bgSD < 40
 * Targets (documentary):   isolation ~1.0–1.2 · busyness > 40
 * Always:                  lightness within ~45 points of the page background
 */
import sharp from "sharp";

const N = 96;

const toHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  const l = (mx + mn) / 2;
  return [h, (d ? d / (1 - Math.abs(2 * l - 1)) : 0) * 100, l * 100];
};

async function load(src) {
  if (/^https?:/.test(src)) {
    const res = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return src; // local path — sharp accepts it directly
}

export async function analyse(src) {
  const input = await load(src);
  const base = sharp(input).removeAlpha();
  const meta = await base.metadata();

  // colour stats from RGB
  const { data: rgbData } = await base.clone().resize(64, 64, { fit: "fill" })
    .raw().toBuffer({ resolveWithObject: true });
  let sat = 0, lig = 0, n = 0;
  const lums = [];
  for (let i = 0; i < rgbData.length; i += 3) {
    const [r, g, b] = [rgbData[i], rgbData[i + 1], rgbData[i + 2]];
    const [, s, l] = toHsl(r, g, b);
    sat += s; lig += l; n++;
    lums.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  lums.sort((a, b) => a - b);
  const pct = (q) => lums[Math.floor(lums.length * q)];

  // structure stats from greyscale
  const { data } = await base.clone().resize(N, N, { fit: "fill" })
    .greyscale().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => data[y * N + x];

  let grad = 0, gn = 0, cg = 0, cn = 0, eg = 0, en = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const m = Math.hypot(at(x + 1, y) - at(x - 1, y), at(x, y + 1) - at(x, y - 1));
      grad += m; gn++;
      const centre = x > N * 0.25 && x < N * 0.75 && y > N * 0.25 && y < N * 0.75;
      if (centre) { cg += m; cn++; } else { eg += m; en++; }
    }
  }

  const ring = [];
  const b = Math.round(N * 0.12);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
    if (x < b || y < b || x >= N - b || y >= N - b) ring.push(at(x, y));
  const rm = ring.reduce((a, c) => a + c, 0) / ring.length;
  const ringSD = Math.sqrt(ring.reduce((a, c) => a + (c - rm) ** 2, 0) / ring.length);

  return {
    src: String(src).split("/").pop().slice(0, 34),
    px: `${meta.width}x${meta.height}`,
    saturation: +(sat / n).toFixed(1),
    lightness: +(lig / n).toFixed(1),
    dynamicRange: Math.round(pct(0.98) - pct(0.02)),
    busyness: +(grad / gn).toFixed(1),
    bgBrightness: +rm.toFixed(1),
    bgSD: +ringSD.toFixed(1),
    isolation: +((cg / cn) / ((eg / en) || 1)).toFixed(2),
  };
}

const flag = (r) => {
  const w = [];
  if (r.isolation < 2.5 && r.busyness < 40) w.push("no clear subject (atmosphere)");
  if (r.bgBrightness < 120 && r.isolation < 2.5) w.push("dark, uncommitted background");
  if (r.dynamicRange < 180) w.push("flat");
  if (r.lightness < 35) w.push("very dark — check gap vs page bg");
  return w.length ? "  ⚠ " + w.join("; ") : "  ok";
};

const args = process.argv.slice(2);
const urls = args.flatMap((a) => a.replace(/^--site\s*/, "").split(","))
  .map((s) => s.trim()).filter(Boolean);

if (!urls.length) {
  console.error("usage: node scripts/design-audit.mjs <imageUrl|path> [...]");
  process.exit(1);
}

const rows = [];
for (const u of urls) {
  try { const r = await analyse(u); rows.push(r); console.log(r.src.padEnd(36), JSON.stringify(r).slice(0, 0) + flag(r)); }
  catch (e) { console.log(String(u).slice(-34).padEnd(36), "  ✗", e.message); }
}
if (rows.length) {
  const avg = (k) => +(rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(1);
  console.log(`\nMEAN over ${rows.length} images`);
  for (const k of ["saturation", "lightness", "dynamicRange", "busyness", "bgBrightness", "bgSD", "isolation"])
    console.log(`  ${k.padEnd(14)} ${avg(k)}`);
}
