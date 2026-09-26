/* BidMate site. Plain JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ramp = (v, a, b) => clamp((v - a) / (b - a));
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  /* ---------- Nav ---------- */
  const nav = $('[data-nav]');
  const onNav = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onNav, { passive: true });
  onNav();

  /* ---------- Hero: the drawn sheet ---------- */
  const plan = $('[data-plan]');
  const circuits = [];

  function buildPlan() {
    const g = el('g', {}, plan);
    for (let x = 0; x <= 1600; x += 50) el('line', { x1: x, y1: 0, x2: x, y2: 1000, class: 'grid' }, g);
    for (let y = 0; y <= 1000; y += 50) el('line', { x1: 0, y1: y, x2: 1600, y2: y, class: 'grid' }, g);

    const rooms = [
      [200, 150, 600, 450], [600, 150, 1000, 450], [1000, 150, 1400, 450],
      [200, 550, 520, 850], [520, 550, 880, 850], [880, 550, 1150, 850], [1150, 550, 1400, 850]
    ];
    el('rect', { x: 200, y: 150, width: 1200, height: 700, class: 'wall' }, g);
    rooms.forEach(([x1, y1, x2, y2]) => el('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, class: 'wall-thin' }, g));
    el('path', { d: 'M200 450H1400M200 550H1400', class: 'wall' }, g);
    // doors
    rooms.forEach(([x1, y1, x2, y2]) => {
      const cx = (x1 + x2) / 2, top = y1 < 500;
      const y = top ? 450 : 550, r = 34, dir = top ? -1 : 1;
      el('path', { d: `M${cx - r} ${y}A${r} ${r} 0 0 ${top ? 1 : 0} ${cx} ${y + dir * r}V${y}`, class: 'wall-thin' }, g);
    });

    const panel = [250, 500];
    el('rect', { x: panel[0] - 22, y: panel[1] - 14, width: 44, height: 28, rx: 3, class: 'panel' }, g);

    const runs = el('g', {}, plan);
    const fxLayer = el('g', {}, plan);

    rooms.forEach(([x1, y1, x2, y2], i) => {
      const cols = Math.max(2, Math.round((x2 - x1) / 130));
      const rowsN = 2;
      const pts = [];
      for (let r = 0; r < rowsN; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push([x1 + (x2 - x1) * (c + .5) / cols, y1 + (y2 - y1) * (r + .5) / rowsN]);
        }
        const top = y1 < 500;
        // snake so the run starts near the door
        const order = top ? rowsN - 1 - r : r;
        pts[order] = (order % 2) ? row.reverse() : row;
      }
      const fixtures = pts.flat();
      const top = y1 < 500;
      const doorX = (x1 + x2) / 2;
      const verts = [panel, [panel[0], 500], [doorX, 500], [doorX, fixtures[0][1]], [fixtures[0][0], fixtures[0][1]]];
      fixtures.slice(1).forEach(([fx, fy]) => {
        const last = verts[verts.length - 1];
        if (last[1] !== fy) verts.push([last[0], fy]);
        verts.push([fx, fy]);
      });
      // cumulative lengths to place each fixture's glow moment
      let total = 0; const cum = [0];
      for (let k = 1; k < verts.length; k++) {
        total += Math.hypot(verts[k][0] - verts[k - 1][0], verts[k][1] - verts[k - 1][1]);
        cum.push(total);
      }
      const d = 'M' + verts.map(v => v.join(' ')).join('L');
      el('path', { d, class: 'run-ghost' }, runs);
      const path = el('path', { d, class: 'run', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, runs);

      const fxEls = fixtures.map(([fx, fy]) => {
        const glow = el('circle', { cx: fx, cy: fy, r: 20, class: 'fx-glow' }, fxLayer);
        const sym = el('g', { class: 'fx' }, fxLayer);
        el('circle', { cx: fx, cy: fy, r: 14 }, sym);
        el('path', { d: `M${fx - 10} ${fy - 10}l20 20M${fx + 10} ${fy - 10}l-20 20` }, sym);
        const vi = verts.findIndex(v => v[0] === fx && v[1] === fy);
        return { glow, sym, at: cum[vi] / total, on: false };
      });

      // receptacles along the walls, drawn but never lit
      const ry = top ? y1 + 16 : y2 - 16;
      for (let k = 1; k < 3; k++) {
        const rx = x1 + (x2 - x1) * k / 3;
        const s = el('g', { class: 'fx' }, fxLayer);
        el('circle', { cx: rx, cy: ry, r: 8 }, s);
        el('path', { d: `M${rx - 3} ${ry - 5}v10M${rx + 3} ${ry - 5}v10` }, s);
      }

      circuits.push({ path, fx: fxEls, a: .1 + i * .095, b: .1 + i * .095 + .17, last: -1 });
    });
  }

  function drawPlan(p) {
    // camera glide: steep and close, easing to a calm overview
    const e = 1 - Math.pow(1 - p, 2);
    const rx = 58 - e * 24, rz = -16 + e * 11, sc = 1.32 - e * .3;
    const tx = 9 - e * 5, ty = 7 - e * 7;
    plan.style.transform = `translate(-50%,-50%) translate3d(${tx}%,${ty}%,0) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${sc})`;
    circuits.forEach(c => {
      const k = Math.round(ramp(p, c.a, c.b) * 1000) / 1000;
      if (k === c.last) return;
      c.last = k;
      c.path.setAttribute('stroke-dashoffset', 1 - k);
      c.fx.forEach(f => {
        const on = k >= f.at - .001 && k > 0;
        if (on !== f.on) {
          f.on = on;
          f.sym.classList.toggle('on', on);
          f.glow.classList.toggle('on', on);
        }
      });
    });
  }

  buildPlan();

  /* ---------- Split headings into words for the rising, unblurring entrance ---------- */
  function splitWords(root) {
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const parts = ch.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = t; s.style.setProperty('--wi', i++);
            frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    };
    walk(root);
  }
  $$('[data-reveal="mask"], .band h1, .band h2, .band-line').forEach(splitWords);

  /* ---------- The film: one image sequence behind the whole site ----------
     Frames are plain images drawn to a fixed canvas, so they work in every
     browser and on phones. The hero plays most of the shot; the rest of the
     page keeps it moving slowly, so every section sits inside the same scene. */
  const hero = $('[data-hero]');
  const bands = $$('[data-band]').map(b => ({ el: b, a: +b.dataset.in, b: +b.dataset.out, o: -1 }));
  const root = document.documentElement;
  const staticHero = reduced;
  const FILM = small ? { dir: 'm', n: 75 } : { dir: 'd', n: 150 };
  const HERO_SHARE = .64;           // share of the shot played inside the hero
  const canvas = $('[data-film]'), ctx = canvas.getContext('2d'), veil = $('[data-veil]');
  const frames = new Array(FILM.n);
  let filmReady = false, drawnIdx = -1, cw = 0, ch = 0;

  const noFilm = () => root.classList.add('no-film');
  if (staticHero) { root.classList.add('static-hero'); drawPlan(1); }

  function sizeCanvas() {
    const dpr = Math.min(small ? 2 : 1.5, devicePixelRatio || 1);
    cw = Math.round(innerWidth * dpr); ch = Math.round(innerHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; drawnIdx = -1; }
  }
  function nearest(i) {
    for (let d = 0; d < FILM.n; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  }
  function paint(im, alpha) {
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    const x = (cw - w) * (small ? .62 : .5), y = (ch - h) / 2;   // phones keep the lit circuit in view
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, x, y, w, h);
    ctx.globalAlpha = 1;
  }
  // Float frame position: the two neighbouring frames are cross-blended,
  // so motion stays smooth however slowly the page is scrolled.
  function drawFrame(fi) {
    const i0 = Math.floor(fi), i1 = Math.min(FILM.n - 1, i0 + 1), frac = fi - i0;
    const key = i0 + Math.round(frac * 24) / 24;
    if (key === drawnIdx) return;
    const a = frames[i0], b = frames[i1];
    if (a && b) {
      drawnIdx = key;
      paint(a, 1);
      if (frac > .02 && i1 !== i0) paint(b, frac);
      return;
    }
    const k = nearest(Math.round(fi));
    if (k < 0) return;
    drawnIdx = -2 - k;
    paint(frames[k], 1);
  }

  function loadFrame(i) {
    return new Promise(res => {
      if (frames[i]) return res();
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { frames[i] = im; res(); };
      im.onerror = () => res();
      im.src = `assets/film/${FILM.dir}/${String(i + 1).padStart(3, '0')}.webp`;
    });
  }
  async function loadFilm() {
    const loader = $('[data-loader]'), bar = $('[data-loader-bar]');
    const showTimer = setTimeout(() => { loader.hidden = false; }, 600);
    await loadFrame(0);
    if (!frames[0]) { clearTimeout(showTimer); loader.hidden = true; noFilm(); render(true); return; }
    sizeCanvas();
    filmReady = true;
    root.classList.add('has-film');
    render(true);
    if (staticHero) {                       // reduced motion: rest on the finished frame
      await loadFrame(FILM.n - 1); drawnIdx = -1; drawFrame(FILM.n - 1);
      clearTimeout(showTimer); loader.hidden = true; return;
    }
    // coarse pass first so scrubbing works almost at once, then fill the gaps
    const order = [], seen = new Set([0]);
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < FILM.n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    if (!seen.has(FILM.n - 1)) order.push(FILM.n - 1);
    const firstPass = Math.ceil(FILM.n / 8);
    let done = 0, next = 0;
    const worker = async () => {
      while (next < order.length) {
        await loadFrame(order[next++]);
        done++;
        if (done <= firstPass) bar.style.strokeDashoffset = 1 - done / firstPass;
        if (done === firstPass) { clearTimeout(showTimer); loader.hidden = true; }
        drawnIdx = -1; render(true);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    clearTimeout(showTimer); loader.hidden = true;
  }

  bands.forEach(bd => {
    bd.words = $$('.w', bd.el);
    bd.rest = Array.from(bd.el.children).filter(c => !c.querySelector('.w') && !c.classList.contains('w'));
  });
  function renderBands(p) {
    bands.forEach(bd => {
      const inP = bd.a <= 0 ? 1 : ramp(p, bd.a, bd.a + .075);
      const outP = bd.b > 1 ? 0 : ramp(p, bd.b - .06, bd.b);
      const key = Math.round(inP * 500) + ':' + Math.round(outP * 500);
      if (key === bd.o) return;
      bd.o = key;
      const n = Math.max(1, bd.words.length);
      bd.words.forEach((w, k) => {
        const t = clamp(inP * 1.7 - (k / n) * .7);
        w.style.opacity = t.toFixed(3);
        w.style.transform = `translateY(${((1 - t) * .5).toFixed(3)}em)`;
        w.style.filter = t < 1 ? `blur(${((1 - t) * 10).toFixed(1)}px)` : 'none';
      });
      const r = clamp(inP * 1.7 - .7);
      bd.rest.forEach(c => { c.style.opacity = r.toFixed(3); c.style.transform = `translateY(${((1 - r) * 16).toFixed(1)}px)`; });
      bd.el.style.opacity = (1 - outP).toFixed(3);
      bd.el.style.transform = `translateY(calc(-50% - ${(outP * 40).toFixed(1)}px))`;
      bd.el.style.filter = outP > 0 ? `blur(${(outP * 8).toFixed(1)}px)` : 'none';
      const vis = inP > .5 && outP < .5;
      bd.el.setAttribute('aria-hidden', vis ? 'false' : 'true');
    });
  }

  // Scroll position mapped to: hero progress, film position, veil and camera drift
  function scene() {
    const heroSpan = Math.max(1, hero.offsetHeight - innerHeight);
    const pageSpan = Math.max(heroSpan + 1, document.documentElement.scrollHeight - innerHeight);
    const y = scrollY;
    const hp = clamp(y / heroSpan);
    const rp = clamp((y - heroSpan) / (pageSpan - heroSpan));
    return { y, hp, rp };
  }
  let target = scene(), shown = { ...target }, running = false, last = {};
  const lerp = (a, b, t) => a + (b - a) * t;

  function render(force) {
    const { hp, rp } = shown;
    if (force || hp !== last.hp) { renderBands(hp); if (!filmReady) drawPlan(hp); }
    if (!filmReady || staticHero) { last = { hp, rp }; return; }
    // film: most of the shot in the hero, the rest spread over the page
    const f = hp < 1 ? hp * HERO_SHARE : HERO_SHARE + rp * (1 - HERO_SHARE);
    drawFrame(f * (FILM.n - 1));
    if (force || rp !== last.rp || hp !== last.hp) {
      // the scene dims behind reading sections and opens up again at the final ask
      const into = ramp(hp, .9, 1);
      const v = hp < 1 ? into * .5 : lerp(.5, .66, ramp(rp, 0, .12)) - ramp(rp, .84, 1) * .26;
      veil.style.opacity = v.toFixed(3);
      const sc = 1 + rp * .22, tx = -rp * 4, ty = rp * 3;
      canvas.style.transform = `translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0) scale(${sc.toFixed(4)})`;
    }
    last = { hp, rp };
  }
  function tick() {
    const k = reduced ? 1 : .14;
    let settled = true;
    for (const key of ['hp', 'rp']) {
      const d = target[key] - shown[key];
      if (Math.abs(d) < .0004) shown[key] = target[key]; else { shown[key] += d * k; settled = false; }
    }
    render(false);
    if (!settled) requestAnimationFrame(tick); else running = false;
  }
  function onScroll() {
    target = scene();
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { sizeCanvas(); onScroll(); render(true); });
  render(true);
  if (saveData) noFilm(); else loadFilm();

  /* ---------- Reveals ---------- */
  $$('.step-art .draw > *').forEach(n => n.setAttribute('pathLength', 1));
  const groups = new Map();
  $$('[data-reveal]').forEach(n => {
    const list = groups.get(n.parentElement) || [];
    list.push(n); groups.set(n.parentElement, list);
    n.style.setProperty('--d', (list.length - 1) * .08 + 's');
  });
  if (reduced || !('IntersectionObserver' in window)) {
    $$('[data-reveal]').forEach(n => n.classList.add('in'));
  } else {
    // A masked element has no visible area yet, so it is triggered by its parent.
    const targets = new Map();
    $$('[data-reveal]').forEach(n => {
      const t = n.dataset.reveal === 'mask' ? n.parentElement : n;
      targets.set(t, (targets.get(t) || []).concat(n));
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        (targets.get(en.target) || []).forEach(n => n.classList.add('in'));
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    targets.forEach((_, t) => io.observe(t));
  }

  /* ---------- Stat numbers count up once, from a visible resting value ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    const nums = $$('[data-count]');
    const run = n => {
      const end = +n.dataset.count, t0 = performance.now(), dur = 1300;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        n.textContent = Math.round(end * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const so = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      so.unobserve(en.target);
      $$('[data-count]', en.target).forEach(run);
    }), { threshold: .4 });
    $$('.stat').forEach(s => so.observe(s));
  }

  /* ---------- The copper thread down the page ---------- */
  const rest = $('.rest'), thread = $('[data-thread]'), tpath = $('[data-thread-path]');
  let nodes = [];
  function layoutThread() {
    if (getComputedStyle(thread).display === 'none') return;
    const rr = rest.getBoundingClientRect();
    const wrap = $('.section .wrap:not(.narrow)') || $('.section .wrap');
    const wx = wrap.getBoundingClientRect().left - rr.left;
    const x = Math.max(18, wx - 34);
    thread.setAttribute('viewBox', `0 0 ${rr.width} ${rest.offsetHeight}`);
    $$('circle', thread).forEach(c => c.remove());
    let d = `M${x} 0`;
    nodes = $$('[data-node]').map(sec => {
      const eb = $('.eyebrow', sec) || sec;
      const y = eb.getBoundingClientRect().top - rr.top + 7;
      d += `V${y}h14m-14 0`;
      const c = el('circle', { cx: x, cy: y, r: 4.5, fill: '#0E1A26', stroke: '#D9955A', 'stroke-width': 1.5, opacity: .35 }, thread);
      return { y, c, on: false };
    });
    d += `V${rest.offsetHeight - 40}`;
    tpath.setAttribute('d', d);
    onThread();
  }
  function onThread() {
    if (!nodes.length) return;
    const rr = rest.getBoundingClientRect();
    const reach = innerHeight * .62 - rr.top;
    tpath.style.strokeDashoffset = 1 - clamp(reach / rest.offsetHeight);
    nodes.forEach(n => {
      const on = reach >= n.y;
      if (on !== n.on) { n.on = on; n.c.setAttribute('opacity', on ? 1 : .35); n.c.setAttribute('fill', on ? '#D9955A' : '#0E1A26'); }
    });
  }
  addEventListener('scroll', onThread, { passive: true });
  addEventListener('resize', layoutThread);
  addEventListener('load', layoutThread);
  if (document.fonts) document.fonts.ready.then(layoutThread);
  layoutThread();

  /* ---------- Dust: whisper-level drift ---------- */
  const cv = $('.dust');
  if (!reduced && cv.getContext) {
    const ctx = cv.getContext('2d');
    let w, h, dots = [], dpr = Math.min(2, devicePixelRatio || 1), live = true;
    const size = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: small ? 18 : 42 }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .3,
        vx: (Math.random() - .5) * .08, vy: -Math.random() * .12 - .02, a: Math.random() * .35 + .08,
        warm: Math.random() < .25
      }));
    };
    const frame = () => {
      if (!live) return;
      ctx.clearRect(0, 0, w, h);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
        if (d.x < -4) d.x = w + 4; else if (d.x > w + 4) d.x = -4;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = d.warm ? '#D9955A' : '#9CC6DD';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      });
      requestAnimationFrame(frame);
    };
    size(); addEventListener('resize', size);
    document.addEventListener('visibilitychange', () => {
      live = !document.hidden; if (live) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  /* ---------- Try the review ---------- */
  const STATUS = {
    ready: { label: 'Ready to review', icon: 'i-ready' },
    missing: { label: 'Missing information', icon: 'i-missing' },
    approved: { label: 'Estimator approved', icon: 'i-approved' }
  };
  const seed = () => [
    { id: 'a', name: 'LED troffer, 2x4, Type A', sheet: 'E-101', qty: 48, unit: 'ea', status: 'ready', kind: 'fx',
      pts: [[150, 90], [250, 90], [150, 170], [250, 170], [400, 90], [500, 90]] },
    { id: 'b', name: 'Duplex receptacle, 20A', sheet: 'E-101', qty: 112, unit: 'ea', status: 'ready', kind: 'rec',
      pts: [[90, 140], [320, 40], [560, 150], [120, 350], [470, 350]] },
    { id: 'c', name: 'Exit sign, Type X', sheet: 'E-101', qty: 9, unit: 'ea', status: 'approved', kind: 'fx',
      pts: [[300, 235], [520, 235]] },
    { id: 'd', name: 'Branch conduit, 3/4" EMT', sheet: 'E-201', qty: null, unit: 'ft', status: 'missing', kind: 'run',
      pts: [[560, 380]], run: 'M70 235H560V300H400V330', fixQty: 1240,
      warning: {
        title: 'Scale missing on E-201',
        found: 'Sheet E-201 has no drawing scale.',
        why: "Conduit lengths on this sheet can't be measured, so that footage stays out of your total.",
        fix: 'Confirm the scale in the title block, or ask the architect.',
        where: 'Sheet E-201, title block, lower right.'
      } },
    { id: 'e', name: 'Panelboard, 225A', sheet: 'E-601', qty: 2, unit: 'ea', status: 'ready', kind: 'panel',
      pts: [[70, 235]] },
    { id: 'f', name: 'Occupancy sensor, ceiling', sheet: 'E-101', qty: 31, unit: 'ea', status: 'ready', kind: 'fx',
      pts: [[200, 300], [340, 300], [520, 300]] }
  ];
  let items = seed(), focusId = null, measured = false, finished = false;
  const hiddenLayers = new Set();
  const sheet = $('[data-sheet]'), list = $('[data-lines]'), warnBox = $('[data-warning]');
  const note = $('[data-layer-note]');
  const colorOf = s => ({ ready: '#7FB3CF', missing: '#E6B24C', approved: '#7CC49A' })[s];

  function drawSheet() {
    sheet.textContent = '';
    el('path', { d: 'M40 20H580V380H40Z', class: 'w' }, sheet);
    el('path', { d: 'M40 210H580M40 260H580M300 20V210M200 260V380M380 260V380', class: 'w2' }, sheet);
    el('rect', { x: 500, y: 350, width: 76, height: 26, class: 'w2' }, sheet);
    items.forEach(it => {
      const g = el('g', { class: 'mk', 'data-id': it.id }, sheet);
      const c = colorOf(it.status);
      if (it.kind === 'run' && measured) {
        el('path', { d: it.run, class: 'meas' + (it.status === 'approved' ? '' : ' unverified'), stroke: c }, g);
        el('path', { d: it.run, class: 'halo', 'stroke-width': 8, opacity: 0 }, g);
      }
      const pts = it.kind === 'run' && measured ? [] : it.pts;
      pts.forEach(([x, y]) => {
        el('circle', { cx: x, cy: y, r: 17, class: 'halo' }, g);
        if (it.status === 'missing') {
          el('path', { d: `M${x} ${y - 11}L${x + 11} ${y + 8}H${x - 11}Z`, fill: 'rgba(230,178,76,.15)', stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
          el('path', { d: `M${x} ${y - 3}v4`, stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
        } else if (it.status === 'approved') {
          el('circle', { cx: x, cy: y, r: 10, fill: c }, g);
          el('path', { d: `M${x - 4.5} ${y}l3 3 6-6.5`, fill: 'none', stroke: '#0E1A26', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        } else if (it.kind === 'panel') {
          el('rect', { x: x - 12, y: y - 8, width: 24, height: 16, rx: 2, fill: 'none', stroke: c, 'stroke-width': 2 }, g);
        } else {
          el('circle', { cx: x, cy: y, r: 9, fill: 'none', stroke: c, 'stroke-width': 2 }, g);
          if (it.kind === 'fx') el('path', { d: `M${x - 6} ${y - 6}l12 12m0-12-12 12`, stroke: c, 'stroke-width': 1.4 }, g);
          if (it.kind === 'rec') el('path', { d: `M${x - 3} ${y - 5}v10M${x + 3} ${y - 5}v10`, stroke: c, 'stroke-width': 1.4 }, g);
        }
      });
      g.addEventListener('click', () => setFocus(it.id));
    });
    applyMarkerState();
  }

  function applyMarkerState() {
    $$('.mk', sheet).forEach(g => {
      const it = items.find(i => i.id === g.dataset.id);
      g.classList.toggle('is-hidden', hiddenLayers.has(it.status));
      g.classList.toggle('is-focus', focusId === it.id);
      g.classList.toggle('is-dim', !!focusId && focusId !== it.id);
    });
  }

  const fmtQty = it => it.qty == null ? 'Not measured' : it.qty.toLocaleString('en-US') + ' ' + it.unit;

  function drawLines() {
    list.textContent = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'line' + (focusId === it.id ? ' is-focus' : '');
      li.tabIndex = 0;
      li.dataset.id = it.id;
      const st = STATUS[it.status];
      const unverified = it.kind === 'run' && measured && it.status !== 'approved';
      li.innerHTML =
        `<span class="line-name"></span>
         <span class="line-qty${unverified ? ' dashed' : ''}" title="${unverified ? 'Measured, not yet verified' : ''}"></span>
         <span class="line-meta"><span class="chip s-${it.status}"><svg><use href="#${st.icon}"/></svg>${st.label}</span><span>${it.sheet}</span></span>
         <span class="line-act"></span>`;
      $('.line-name', li).textContent = it.name;
      $('.line-qty', li).textContent = fmtQty(it);
      const act = $('.line-act', li);
      const btn = document.createElement('button');
      btn.type = 'button';
      if (it.status === 'ready') { btn.className = 'mini primary'; btn.textContent = 'Approve'; btn.onclick = e => { e.stopPropagation(); setStatus(it, 'approved'); }; }
      else if (it.status === 'approved') { btn.className = 'mini quiet'; btn.textContent = 'Undo'; btn.onclick = e => { e.stopPropagation(); setStatus(it, 'ready'); }; }
      else { btn.className = 'mini'; btn.textContent = 'See why'; btn.onclick = e => { e.stopPropagation(); setFocus(it.id); }; }
      if (finished) btn.disabled = true;
      act.appendChild(btn);
      li.addEventListener('click', () => setFocus(focusId === it.id ? null : it.id));
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { if (e.target === li) { e.preventDefault(); setFocus(focusId === it.id ? null : it.id); } } });
      list.appendChild(li);
    });
  }

  function drawWarning() {
    const it = items.find(i => i.id === focusId);
    if (!it || it.status !== 'missing') { warnBox.hidden = true; warnBox.textContent = ''; return; }
    const w = it.warning;
    warnBox.hidden = false;
    warnBox.innerHTML = `<h4><svg><use href="#i-missing"/></svg><span></span></h4>
      <dl><div><dt>What we found</dt><dd></dd></div><div><dt>Why it matters</dt><dd></dd></div>
      <div><dt>What to check</dt><dd></dd></div><div><dt>Where it is</dt><dd></dd></div></dl>
      <button type="button" class="mini primary">Add the scale from the title block</button>`;
    $('h4 span', warnBox).textContent = w.title;
    const dds = $$('dd', warnBox);
    [w.found, w.why, w.fix, w.where].forEach((t, i) => { dds[i].textContent = t; });
    $('button', warnBox).onclick = () => {
      measured = true; it.qty = it.fixQty; it.status = 'ready';
      renderBench(true);
    };
  }

  function drawTotals(bump) {
    const approved = items.filter(i => i.status === 'approved');
    const devices = approved.filter(i => i.unit === 'ea').reduce((s, i) => s + i.qty, 0);
    const a = $('[data-count-approved]'), dv = $('[data-count-devices]');
    const prevA = a.textContent, prevD = dv.textContent;
    a.textContent = approved.length;
    $('[data-count-total]').textContent = items.length;
    dv.textContent = devices.toLocaleString('en-US');
    if (bump) {
      [[a.parentElement, prevA !== a.textContent], [dv, prevD !== dv.textContent]].forEach(([n, changed]) => {
        if (!changed) return;
        n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump');
      });
    }
    const missing = items.filter(i => i.status === 'missing').length;
    const open = items.filter(i => i.status === 'ready').length;
    const stateEl = $('[data-finish-state]'), fin = $('[data-finish]');
    let icon, text;
    if (finished) { icon = 'i-approved'; text = 'Takeoff finished. Every number has a name on it.'; }
    else if (missing) { icon = 'i-missing'; text = `Blocked. ${missing} line has missing information.`; }
    else if (open) { icon = 'i-ready'; text = `${open} line${open > 1 ? 's' : ''} still to review.`; }
    else { icon = 'i-approved'; text = 'Every line approved. Ready to bid.'; }
    stateEl.innerHTML = `<svg class="s-${icon.slice(2)}"><use href="#${icon}"/></svg><span></span>`;
    $('span', stateEl).textContent = text;
    fin.disabled = finished || missing > 0 || open > 0;
    fin.textContent = finished ? 'Start over' : 'Finish takeoff';
    if (finished) fin.disabled = false;
  }

  function renderBench(bump) {
    drawSheet(); drawLines(); drawWarning(); drawTotals(bump);
  }
  function setFocus(id) {
    focusId = id;
    $$('.line', list).forEach(li => li.classList.toggle('is-focus', li.dataset.id === id));
    applyMarkerState(); drawWarning();
  }
  function setStatus(it, s) {
    it.status = s;
    const keep = document.activeElement && document.activeElement.closest('.line') ? it.id : null;
    renderBench(true);
    if (keep) { const li = $(`.line[data-id="${keep}"] button`, list); if (li) li.focus(); }
  }

  $('[data-finish]').addEventListener('click', () => {
    if (finished) { items = seed(); measured = false; finished = false; focusId = null; renderBench(true); return; }
    finished = true; focusId = null; renderBench(true);
  });

  let noteTimer;
  $$('[data-layer]').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) hiddenLayers.delete(cb.dataset.layer); else hiddenLayers.add(cb.dataset.layer);
    applyMarkerState();
    if (!cb.checked) {
      note.classList.add('show');
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => note.classList.remove('show'), 2400);
    }
  }));

  renderBench(false);

  /* ---------- Bid day, two ways: the problem made hands-on ---------- */
  const bd = $('[data-bidday]');
  if (bd) {
    const PROFIT = 72000;
    const ITEMS = [
      { name: 'Disconnects on the roof plan', sheet: 'E-501', cost: 3400 },
      { name: 'Home runs from panel LP-2', sheet: 'E-201', cost: 6800 },
      { name: 'Type B fixtures on a rough scan', sheet: 'E-102', cost: 7900 },
      { name: 'Feeders to the rooftop units', sheet: 'E-601', cost: 3500 }
    ];
    const ICON = { missed: 'i-x', found: 'i-ready', ok: 'i-approved' };
    const money = v => '$' + Math.round(v).toLocaleString('en-US');
    const list = $('[data-bd-items]', bd), profitEl = $('[data-bd-profit]', bd);
    const fill = $('[data-bd-fill]', bd), note = $('[data-bd-note]', bd), all = $('[data-bd-all]', bd);
    let mode = 'hand', state = ITEMS.map(() => 'missed'), shownProfit = null;

    const tweenProfit = to => {
      const from = shownProfit == null ? to : shownProfit;
      shownProfit = to;
      if (reduced || from === to) { profitEl.textContent = money(to); return; }
      const t0 = performance.now(), dur = 800;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        profitEl.textContent = money(from + (to - from) * e);
        if (k < 1 && shownProfit === to) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    function draw(flashIdx) {
      list.textContent = '';
      ITEMS.forEach((it, i) => {
        const s = state[i];
        const li = document.createElement('li');
        li.className = 'bd-item s-' + s + (i === flashIdx ? ' flash' : '');
        const label = s === 'missed' ? 'Never counted' : s === 'found' ? `Ready to review · found on ${it.sheet}` : 'Estimator approved';
        const amt = s === 'missed' ? '\u2212' + money(it.cost) : s === 'ok' ? '+' + money(it.cost) : money(it.cost);
        li.innerHTML = `<svg class="ico"><use href="#${ICON[s]}"/></svg><span class="nm"></span><span class="amt"></span><span class="st"></span><span class="act"></span>`;
        $('.nm', li).textContent = it.name;
        $('.amt', li).textContent = amt;
        $('.st', li).textContent = label;
        if (mode === 'bm') {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = s === 'ok' ? 'mini quiet' : 'mini primary';
          b.textContent = s === 'ok' ? 'Undo' : 'Approve';
          b.onclick = () => { state[i] = s === 'ok' ? 'found' : 'ok'; draw(i); };
          $('.act', li).appendChild(b);
        }
        list.appendChild(li);
      });
      const lost = ITEMS.reduce((sum, it, i) => sum + (state[i] === 'ok' ? 0 : it.cost), 0);
      const profit = PROFIT - lost;
      tweenProfit(profit);
      fill.style.width = (profit / PROFIT * 100).toFixed(1) + '%';
      const full = lost === 0;
      bd.classList.toggle('is-full', full);
      bd.classList.toggle('is-bm', mode === 'bm');
      const waiting = state.filter(x => x === 'found').length;
      if (mode === 'hand') {
        note.innerHTML = `<strong class="bad">${money(lost)}</strong> of work never made it into the bid. Nobody knew until the job was underway. <strong>Now flip the switch to With BidMate.</strong>`;
      } else if (full) {
        note.innerHTML = `<strong class="good">Every item caught and approved.</strong> The full ${money(PROFIT)} margin is protected.`;
      } else {
        note.innerHTML = `BidMate found all four. <strong>${waiting} still need${waiting === 1 ? 's' : ''} your approval</strong>. Nothing counts until you approve it.`;
      }
      all.hidden = mode !== 'bm' || full;
    }
    $$('[data-mode]', bd).forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      $$('[data-mode]', bd).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      state = ITEMS.map(() => (mode === 'hand' ? 'missed' : 'found'));
      draw();
    }));
    all.addEventListener('click', () => { state = ITEMS.map(() => 'ok'); draw(); });
    draw();
  }

  /* ---------- Demo form: posts to Formspree when data-endpoint is set ---------- */
  const form = $('[data-form]');
  const errEl = $('[data-form-error]');
  const errText = errEl.textContent;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const req = ['name', 'company', 'email'].map(n => form.elements[n]);
    let ok = true;
    req.forEach(inp => {
      const bad = !inp.value.trim() || (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()));
      inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) ok = false;
    });
    errEl.textContent = errText;
    errEl.hidden = ok;
    if (!ok) { req.find(i => i.getAttribute('aria-invalid') === 'true').focus(); return; }
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      const btn = $('button[type=submit]', form);
      btn.disabled = true; btn.textContent = 'Sending';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('send failed');
      } catch (_) {
        btn.disabled = false; btn.textContent = 'Book a demo';
        errEl.textContent = "That didn't send. Check your connection and try again.";
        errEl.hidden = false;
        return;
      }
    }
    $('.form-fields', form).hidden = true;
    const done = $('[data-form-done]');
    done.hidden = false;
    done.focus();
  });
})();
