/* ============================================================
   <signature-intro>  ·  v2
   A dot enters from the side, bounces, and opens the page.

   Drop-in, framework-agnostic, zero dependencies, no CSS file.
   Everything lives in a shadow root, so it cannot collide with
   your styles and your styles cannot break it.

     <head><script src="signature-intro.js"></script></head>
     <body>
       <signature-intro color="#c8102e" background="#faf8f5"></signature-intro>
       ...

   PLACE IT AS THE FIRST ELEMENT INSIDE <body>. It covers the page
   the instant the parser reaches it; put it lower and whatever is
   above it may flash before the veil lands.
   ============================================================ */
(function () {
  'use strict';

  /* The reveal tweens a <length> inside a gradient mask. That only
     animates where the property is registered — otherwise the hole
     would pop open instead of growing. */
  var CAN_ANIMATE_LENGTH = false;
  try {
    CSS.registerProperty({
      name: '--si-r', syntax: '<length>', inherits: true, initialValue: '0px'
    });
    CAN_ANIMATE_LENGTH = true;
  } catch (e) {
    // already registered by a second copy of this script — still fine
    CAN_ANIMATE_LENGTH = /already/i.test(String(e && e.message));
  }

  /* ---- physics presets --------------------------------------
     entry/kick/r are heights in vh; the keyframe TIMING is derived
     from them with t proportional to sqrt(h), so bounce counts other
     than 3 stay physically believable without hand-tuning. */
  var FEELS = {
    snappy: {   // kicked higher than it arrived — reads quick and cheeky
      bounce: 1500, entry: 22, kick: 1.09, r: .458, squash: 1.42,
      fall: 'cubic-bezier(.5,0,1,1)', rise: 'cubic-bezier(0,0,.5,1)',
      travel: 'cubic-bezier(.1,.78,.22,1)',
      crouch: 140, crouchScale: .45, gap: 80,
      expand: 820, expandEase: 'cubic-bezier(.85,0,.15,1)',
      revealLag: 90, reveal: 760, revealEase: 'cubic-bezier(.82,0,.12,1)',
      liftLag: 470, lift: 700
    },
    classic: {  // measured and confident
      bounce: 1700, entry: 34, kick: .56, r: .42, squash: 1.28,
      fall: 'cubic-bezier(.42,0,1,1)', rise: 'cubic-bezier(0,0,.55,1)',
      travel: 'cubic-bezier(.14,.62,.26,1)',
      crouch: 180, crouchScale: .6, gap: 180,
      expand: 940, expandEase: 'cubic-bezier(.72,0,.2,1)',
      revealLag: 130, reveal: 840, revealEase: 'cubic-bezier(.66,0,.16,1)',
      liftLag: 550, lift: 820
    },
    weighted: { // heavy, deliberate, luxury
      bounce: 1900, entry: 42, kick: .38, r: .375, squash: 1.36,
      fall: 'cubic-bezier(.36,0,1,1)', rise: 'cubic-bezier(0,0,.6,1)',
      travel: 'cubic-bezier(.2,.55,.2,1)',
      crouch: 210, crouchScale: .7, gap: 160,
      expand: 940, expandEase: 'cubic-bezier(.6,0,.1,1)',
      revealLag: 120, reveal: 820, revealEase: 'cubic-bezier(.5,0,.12,1)',
      liftLag: 500, lift: 900
    }
  };

  function num(v, dflt, min, max) {
    var n = parseFloat(v);
    if (isNaN(n)) return dflt;
    return Math.min(max, Math.max(min, n));
  }
  function bool(v, dflt) {
    if (v === null || v === undefined || v === '') return dflt;
    return !(v === 'false' || v === '0' || v === 'no');
  }

  /* ---- keyframe generation ---------------------------------- */
  function buildBounce(F, bounces) {
    var apexes = [], h = F.entry * F.kick, i;
    for (i = 0; i < bounces - 1; i++) { apexes.push(h); h *= F.r; }
    // Final micro-hop before it rests. With no apexes (bounces=1) it decays
    // off the entry height instead, or the hop reads as a second bounce.
    var settle = (apexes.length ? apexes[apexes.length - 1] * F.r
                                : F.entry * F.r * F.r) * .6;

    // t ∝ sqrt(height): one segment per half-arc
    var seg = [Math.sqrt(F.entry)];
    apexes.forEach(function (a) { seg.push(Math.sqrt(a), Math.sqrt(a)); });
    seg.push(Math.sqrt(settle), Math.sqrt(settle));
    var T = seg.reduce(function (a, b) { return a + b; }, 0);

    var pts = [{ p: 0, y: -F.entry, e: F.fall }];
    var acc = seg[0], k = 1;
    pts.push({ p: acc / T * 100, y: 0, e: F.rise });
    apexes.forEach(function (a) {
      acc += seg[k++]; pts.push({ p: acc / T * 100, y: -a, e: F.fall });
      acc += seg[k++]; pts.push({ p: acc / T * 100, y: 0, e: F.rise });
    });
    acc += seg[k++];
    pts.push({ p: acc / T * 100, y: -settle, e: F.fall });
    pts.push({ p: 100, y: 0, e: null });

    var css = pts.map(function (pt) {
      return pt.p.toFixed(2) + '%{translate:0 ' + pt.y.toFixed(2) + 'vh;' +
             (pt.e ? 'animation-timing-function:' + pt.e + ';' : '') + '}';
    }).join('');

    return { css: css, impacts: pts.filter(function (p) { return p.y === 0; }).map(function (p) { return p.p; }) };
  }

  function buildSquash(F, impacts, bounces) {
    var base = F.squash - 1;
    var flight = function (d) { return { sx: 1 - d * .28, sy: 1 + d * .28 }; };
    var rows = [{ p: 0, s: flight(base) }];

    impacts.slice(0, bounces).forEach(function (p, i) {
      var d = base * Math.pow(.7, i);
      rows.push({ p: Math.max(0, p - 6), s: flight(d) });
      rows.push({ p: p, s: { sx: 1 + d, sy: 1 - d * .9 } });        // contact
      rows.push({ p: Math.min(99, p + 6), s: flight(base * Math.pow(.7, i + 1)) });
    });
    rows.push({ p: 100, s: { sx: 1, sy: 1 } });

    // keep percentages strictly increasing — overlaps happen at high bounce counts
    rows.sort(function (a, b) { return a.p - b.p; });
    var out = [], seen = -1;
    rows.forEach(function (r) { if (r.p > seen) { out.push(r); seen = r.p; } });

    return out.map(function (r) {
      return r.p.toFixed(2) + '%{scale:' + r.s.sx.toFixed(3) + ' ' + r.s.sy.toFixed(3) + ';}';
    }).join('');
  }

  /* ---- the element ------------------------------------------ */
  var LIFT_STYLE_ID = 'si-lift-style';

  class SignatureIntro extends HTMLElement {
    connectedCallback() {
      if (this._started) return;
      this._started = true;

      var self = this;
      var A = function (n) { return self.getAttribute(n); };

      // --- bail conditions ---------------------------------
      // Every one of these runs BEFORE anything is covered, so a bail
      // can never strand a blank page.
      //
      // Add ?intro to any URL to force it to play and to have any skip
      // explain itself in the console. Nothing else turns that logging on,
      // so it stays silent for real visitors.
      var force = /[?&]intro(&|=|$)/.test(location.search);
      var skip = function (why) {
        if (force) console.warn('[signature-intro] skipped: ' + why);
        self.remove();
        return true;
      };

      // Not overridable: without these the animation would misrender rather
      // than merely be unwanted.
      if (!CAN_ANIMATE_LENGTH) return skip('browser cannot animate @property lengths');
      if (!(CSS.supports('mask-image', 'radial-gradient(circle,#000 0,#000 1px)') ||
            CSS.supports('-webkit-mask-image', 'radial-gradient(circle,#000 0,#000 1px)')))
        return skip('browser lacks gradient masks');

      if (!force && matchMedia('(prefers-reduced-motion: reduce)').matches)
        return skip('OS "reduce motion" is on');

      var homeOnly = bool(A('home-only'), true);
      if (!force && homeOnly &&
          location.pathname !== '/' && !/\/index\.html?$/.test(location.pathname))
        return skip('home-only, and this is ' + location.pathname);

      var once = bool(A('once'), true);
      var key = 'si-seen:' + (A('key') || 'default');
      try {
        if (!force && once && sessionStorage.getItem(key) === '1')
          return skip('already shown in this tab session');
      } catch (e) {}

      // --- config -------------------------------------------
      var feel = FEELS[A('feel')] ? A('feel') : 'snappy';
      var F = FEELS[feel];
      var size    = num(A('size'), 15, 2, 200);
      var color   = A('color') || '#0a0a0a';
      var bg      = A('background') || '#ffffff';
      var speed   = num(A('speed'), 1, .25, 4);
      var bounces = Math.round(num(A('bounces'), 3, 1, 6));
      var dir     = (A('from') === 'right') ? 1 : -1;
      var travel  = num(A('distance'), 62, 10, 120);

      var s = 1 / speed;
      var B  = F.bounce * s;
      var C  = F.crouch * s;
      var expandDelay = B + C + F.gap * s;
      var expandDur   = F.expand * s;
      var revealDelay = expandDelay + F.revealLag * s;
      var revealDur   = F.reveal * s;
      var liftDelay   = revealDelay + F.liftLag * s;
      var liftDur     = F.lift * s;
      var total = Math.max(expandDelay + expandDur, revealDelay + revealDur, liftDelay + liftDur);
      var teardown = total + 420 * s;

      var bounce = buildBounce(F, bounces);
      var squash = buildSquash(F, bounce.impacts, bounces);

      // --- lock scroll --------------------------------------
      var htmlEl = document.documentElement;
      var prevOverflow = htmlEl.style.overflow;
      htmlEl.style.overflow = 'hidden';

      // --- opt-in content lift (light DOM, so it needs a real
      //     stylesheet in the document, not the shadow root) ---
      // Injected unconditionally: this element is the first node in <body>,
      // so no [data-si-lift] target has been parsed yet and testing for one
      // here would always come up empty.
      if (!document.getElementById(LIFT_STYLE_ID)) {
        var ls = document.createElement('style');
        ls.id = LIFT_STYLE_ID;
        ls.textContent =
          'html.si-run [data-si-lift]{animation:si-lift ' + liftDur + 'ms cubic-bezier(.16,1,.3,1) ' +
            'calc(' + liftDelay + 'ms + var(--si-i,0) * ' + (90 * s) + 'ms) both}' +
          '@keyframes si-lift{from{opacity:0;transform:translateY(24px) scale(.985)}to{opacity:1;transform:none}}';
        document.head.appendChild(ls);
      }
      htmlEl.classList.add('si-run');

      // --- shadow root --------------------------------------
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' +
        ':host{position:fixed;inset:0;z-index:2147483000;display:block;pointer-events:auto}' +

        /* The page is revealed by a HOLE masked through this whole stack —
           not by clipping the page. Clipping the page would create a clip
           context that breaks its position:fixed headers while running. */
        '.veil{position:absolute;inset:0;background:' + bg + ';--si-r:0px;' +
          '-webkit-mask-image:radial-gradient(circle at 50% 50%,transparent 0 calc(var(--si-r) - .5px),#000 var(--si-r));' +
          'mask-image:radial-gradient(circle at 50% 50%,transparent 0 calc(var(--si-r) - .5px),#000 var(--si-r));' +
          'animation:si-reveal ' + revealDur + 'ms ' + F.revealEase + ' ' + revealDelay + 'ms forwards}' +
        '@keyframes si-reveal{from{--si-r:0px}to{--si-r:150vmax}}' +

        /* three nested elements so travel, bounce and squash each own one
           transform and never overwrite each other */
        '.x{position:absolute;left:50%;top:50%;width:0;height:0;' +
          'animation:si-travel ' + B + 'ms ' + F.travel + ' both}' +
        '@keyframes si-travel{from{translate:' + (dir * travel) + 'vw 0}to{translate:0 0}}' +
        '.y{position:absolute;inset:0;animation:si-bounce ' + B + 'ms linear both}' +
        '@keyframes si-bounce{' + bounce.css + '}' +
        '.d{position:absolute;left:0;top:0;width:' + size + 'px;height:' + size + 'px;' +
          'margin-left:' + (-size / 2) + 'px;margin-top:' + (-size / 2) + 'px;' +
          'border-radius:50%;background:' + color + ';' +
          'animation:si-squash ' + B + 'ms linear both,' +
                    'si-crouch ' + C + 'ms cubic-bezier(.3,0,.2,1) ' + B + 'ms forwards}' +
        '@keyframes si-squash{' + squash + '}' +
        '@keyframes si-crouch{from{scale:1}to{scale:' + F.crouchScale + '}}' +

        /* The opening is a clip-path circle, NOT a scaled-up dot: scaling a
           15px circle ~100x makes Chrome stretch a 15px raster and the edge
           turns to mush. It starts at exactly the dot's crouched radius, so
           the handoff stays seamless at any size. */
        '.bloom{position:absolute;inset:0;background:' + color + ';' +
          'clip-path:circle(0px at 50% 50%);' +
          'animation:si-bloom ' + expandDur + 'ms ' + F.expandEase + ' ' + expandDelay + 'ms forwards}' +
        '@keyframes si-bloom{from{clip-path:circle(' + (size * F.crouchScale / 2).toFixed(2) + 'px at 50% 50%)}' +
          'to{clip-path:circle(150vmax at 50% 50%)}}' +
        '</style>' +
        '<div class="veil"><div class="x"><div class="y"><div class="d"></div></div></div><div class="bloom"></div></div>';

      this.setAttribute('aria-hidden', 'true');
      try { if (once) sessionStorage.setItem(key, '1'); } catch (e) {}

      var done = function () {
        htmlEl.style.overflow = prevOverflow;
        htmlEl.classList.remove('si-run');
        var ls = document.getElementById(LIFT_STYLE_ID);
        if (ls) ls.remove();
        // Dispatch BEFORE removing: a detached node can't bubble, and
        // listeners on document are the useful way to consume this.
        self.dispatchEvent(new CustomEvent('si:done', { bubbles: true }));
        self.remove();
      };

      var t = setTimeout(done, teardown);
      // Hard safety net: if anything throws or the tab is backgrounded at
      // the wrong moment, the page must never stay covered.
      setTimeout(function () { clearTimeout(t); done(); }, teardown + 5000);
    }
  }

  if (!customElements.get('signature-intro')) {
    customElements.define('signature-intro', SignatureIntro);
  }
})();
