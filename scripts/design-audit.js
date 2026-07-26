/**
 * In-page design audit — paste into the browser console on any site.
 * Prints the scorecard fields used in DESIGN-STANDARD.md §1.
 *
 * Scroll the whole page first (or run the scrub helper at the bottom) so lazy
 * content and scroll-revealed elements are actually in the DOM.
 */
(() => {
  const vw = innerWidth, vh = innerHeight;
  const docH = document.documentElement.scrollHeight;
  const screens = docH / vh;

  const vis = (e) => {
    const c = getComputedStyle(e);
    if (c.display === "none" || c.visibility === "hidden") return false;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const rgb = (s) => { const m = (s || "").match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const hsl = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    const l = (mx + mn) / 2;
    return [Math.round(h), Math.round((d ? d / (1 - Math.abs(2 * l - 1)) : 0) * 100), Math.round(l * 100)];
  };
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const all = [...document.querySelectorAll("*")];

  // ---- colour: area-weighted surfaces ----
  const surf = new Map();
  all.filter(vis).forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width * r.height < 40000) return;
    const cs = getComputedStyle(e).backgroundColor;
    const c = rgb(cs); if (!c) return;
    const a = cs.match(/[\d.]+/g);
    if (a && a.length > 3 && Number(a[3]) < 0.5) return;
    surf.set(c.join(","), (surf.get(c.join(",")) || 0) + r.width * r.height);
  });
  const totA = [...surf.values()].reduce((x, y) => x + y, 0) || 1;
  const surfaces = top(surf, 6).map(([k, a]) => ({
    rgb: k, hsl: hsl(k.split(",").map(Number)), areaShare: +(a / totA * 100).toFixed(1),
  }));
  const lightShare = surfaces.filter((s) => s.hsl[2] > 55).reduce((a, s) => a + s.areaShare, 0);

  // ---- accents: saturated colours anywhere ----
  const acc = new Map();
  all.filter(vis).forEach((e) => {
    const s = getComputedStyle(e);
    [s.backgroundColor, s.color].forEach((v) => {
      const c = rgb(v); if (!c) return;
      const q = hsl(c);
      if (q[1] > 45 && q[2] > 12 && q[2] < 88) acc.set(c.join(","), (acc.get(c.join(",")) || 0) + 1);
    });
  });

  // ---- form ----
  const radii = new Map(); const shadows = [];
  all.filter(vis).forEach((e) => {
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    if (r.width > 40 && r.height > 20) {
      const br = c.borderTopLeftRadius;
      if (br && br !== "0px") radii.set(br, (radii.get(br) || 0) + 1);
      if (c.boxShadow && c.boxShadow !== "none") shadows.push(c.boxShadow);
    }
  });

  // ---- motion ----
  let kf = 0;
  for (const ss of document.styleSheets) {
    try {
      for (const r of ss.cssRules) {
        if (r.type === CSSRule.KEYFRAMES_RULE) kf++;
        if (r.cssRules) for (const r2 of r.cssRules) if (r2.type === CSSRule.KEYFRAMES_RULE) kf++;
      }
    } catch (e) { /* cross-origin sheet */ }
  }
  const durs = new Map(), eases = new Map(), props = new Map();
  all.forEach((e) => {
    const c = getComputedStyle(e);
    if (!c.transitionDuration || c.transitionDuration === "0s") return;
    c.transitionDuration.split(",").forEach((d) => durs.set(d.trim(), (durs.get(d.trim()) || 0) + 1));
    c.transitionTimingFunction.split(/,(?![^(]*\))/).forEach((f) =>
      eases.set(f.trim(), (eases.get(f.trim()) || 0) + 1));
    c.transitionProperty.split(",").forEach((p) => props.set(p.trim(), (props.get(p.trim()) || 0) + 1));
  });

  // ---- hover vocabulary (the highest-leverage metric) ----
  let hoverRules = 0;
  for (const ss of document.styleSheets) {
    try {
      for (const r of ss.cssRules) {
        if (r.selectorText && r.selectorText.includes(":hover")) hoverRules++;
        if (r.cssRules) for (const r2 of r.cssRules)
          if (r2.selectorText && r2.selectorText.includes(":hover")) hoverRules++;
      }
    } catch (e) { /* cross-origin sheet */ }
  }

  // ---- media + density ----
  const imgs = [...document.querySelectorAll("img")].filter(vis);
  const vids = [...document.querySelectorAll("video")].filter(vis);
  const canv = [...document.querySelectorAll("canvas")].filter(vis);
  let mediaArea = 0;
  [...imgs, ...vids, ...canv].forEach((e) => {
    const r = e.getBoundingClientRect(); mediaArea += r.width * r.height;
  });
  const inter = [...document.querySelectorAll("a,button,[role=button],input,select")].filter(vis);
  const words = document.body.innerText.replace(/\s+/g, " ").trim().split(" ").length;
  let textArea = 0;
  [...document.querySelectorAll("p,li,h1,h2,h3,h4,span,a")].filter(vis).forEach((e) => {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const r = e.getBoundingClientRect(); textArea += r.width * r.height;
  });

  const out = {
    site: location.hostname,
    screensTall: +screens.toFixed(1),
    colour: {
      surfaces,
      lightVsDarkAreaSplit: `${Math.round(lightShare)} : ${Math.round(100 - lightShare)}`,
      accents: top(acc, 4).map(([k, n]) => ({ rgb: k, hsl: hsl(k.split(",").map(Number)), uses: n })),
    },
    form: { radii: top(radii, 6), shadowCount: shadows.length },
    motion: {
      cssKeyframesDefined: kf,
      durations: top(durs, 5),
      easings: top(eases, 4),
      properties: top(props, 5),
      videos: vids.length, canvas: canv.length,
    },
    interaction: {
      authoredHoverRules: hoverRules,
      interactiveEls: inter.length,
      perScreen: +(inter.length / screens).toFixed(1),
    },
    density: {
      words, wordsPerScreen: Math.round(words / screens),
      textAreaPct: +(textArea / (vw * docH) * 100).toFixed(1),
      mediaAreaPct: +(mediaArea / (vw * docH) * 100).toFixed(1),
    },
  };
  console.log(JSON.stringify(out, null, 1));
  return out;
})();

/* Scrub helper — run first on lazy-loading sites, wait ~4s, then run the audit:
(() => { const se = document.scrollingElement; let i = 0;
  const t = setInterval(() => { se.scrollTop = i; i += 700;
    if (i > document.documentElement.scrollHeight) { clearInterval(t); se.scrollTop = 0; } }, 50);
})();
*/
