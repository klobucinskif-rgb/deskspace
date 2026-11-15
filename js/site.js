/* Deskspace — landing page interactions */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var body = document.body;

  /* ---------- intro: the mark, the letters, then the page ---------- */
  var intro = $('#intro');
  function ready() { body.classList.add('ready'); body.classList.remove('lock'); }
  function done() { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); ready(); }
  if (reduce || !intro) done();
  else {
    setTimeout(ready, 2250);
    setTimeout(done, 3150);
    var skip = function () { if (!intro.parentNode) return; intro.classList.add('skip'); ready(); setTimeout(done, 320); };
    intro.addEventListener('click', skip);
    addEventListener('keydown', function onKey() { removeEventListener('keydown', onKey); skip(); });
  }

  /* ---------- nav: always on top, deeper tint after the top, scroll progress ---------- */
  var nav = $('#nav'), lastY = scrollY;
  function onNav() {
    var y = scrollY;
    nav.classList.toggle('scrolled', y > 10);
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    nav.style.setProperty('--sp', Math.min(1, y / max).toFixed(4));
    lastY = y;
  }
  var links = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['review', 'flow', 'product', 'pricing', 'faq', 'hero', 'problem', 'time', 'film', 'cta'].forEach(function (id) { var el = document.getElementById(id); if (el) secIO.observe(el); });
  }

  /* ---------- reveal on scroll ---------- */
  var revIO = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); if (e.target.id === 'plans') countPrices(); } });
  }, { threshold: 0.14 }) : null;
  $$('.rv').forEach(function (el) { if (revIO) revIO.observe(el); else { el.classList.add('in'); } });
  if (!revIO) countPrices(true);

  /* ---------- hero: the window flattens as you scroll, chips drift ---------- */
  var win = $('#win'), chips = $$('.chip'), ticking = false;
  function onScroll() {
    onNav();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = scrollY;
      if (win && !reduce) {
        var p = Math.max(0, Math.min(1, y / (innerHeight * 0.55)));
        win.style.setProperty('--p', p.toFixed(3));
        chips.forEach(function (c, i) { c.style.setProperty('--cy', (-y * [0.12, 0.06, 0.16][i]).toFixed(1) + 'px'); });
      }
      paintStatement();
      paintFlow();
      paintSky();
      paintFloat();
      paintMess();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });


  /* ---------- dark sky: lighter at the top, deep navy at the end ---------- */
  var sky = $('.page-bg');
  var SKY = {
    dark: { a: [[34, 70, 111], [15, 29, 52]], b: [[18, 39, 63], [7, 14, 28]], g: [0.32, 0.1] },
    light: { a: [[198, 225, 251], [226, 239, 253]], b: [[238, 246, 255], [196, 222, 250]], g: [0.55, 0.25] }
  };
  var mix = function (a, b, k) { return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(',') + ')'; };
  function paintSky() {
    if (!sky) return;
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    var k = Math.max(0, Math.min(1, scrollY / max));
    k = k * k * (3 - 2 * k);
    var t = SKY[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    sky.style.setProperty('--pg-a', mix(t.a[0], t.a[1], k));
    sky.style.setProperty('--pg-b', mix(t.b[0], t.b[1], k));
    sky.style.setProperty('--pg-g', (t.g[0] + (t.g[1] - t.g[0]) * k).toFixed(3));
  }

  /* ---------- floating: cards drift at their own pace while you scroll ---------- */
  var floats = reduce ? [] : $$('[data-float]').map(function (el) { return { el: el, s: parseFloat(el.getAttribute('data-float')) || 0, y: 0 }; });
  function paintFloat() {
    var vh = innerHeight, k = innerWidth < 700 ? 0.5 : 1;
    floats.forEach(function (f) {
      var r = f.el.getBoundingClientRect(), top = r.top - f.y;
      if (top > vh + 200 || top + r.height < -200) return;
      var y = Math.max(-70, Math.min(70, ((top + r.height / 2) - vh / 2) * -f.s * k));
      f.y = y;
      f.el.style.translate = '0 ' + y.toFixed(1) + 'px';
    });
  }

  /* ---------- hero: a light passes across the wordmark ---------- */
  var hl = $('.hl');
  function measureWord() {
    if (!hl) return;
    hl.style.setProperty('--hw', hl.offsetWidth + 'px');
    var x0 = hl.getBoundingClientRect().left;
    $$('.hl > span').forEach(function (s) { s.style.setProperty('--o', (s.getBoundingClientRect().left - x0).toFixed(1) + 'px'); });
  }
  measureWord();
  addEventListener('resize', measureWord);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureWord);

  /* ---------- interactive touches: window, glow, tilt ---------- */
  new MutationObserver(function () { paintSky(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (hover && !reduce) {
    // the window tilts a touch toward the pointer
    var heroEl = $('#hero');
    if (heroEl && win) {
      heroEl.addEventListener('pointermove', function (e) {
        var hr = heroEl.getBoundingClientRect();
        win.style.setProperty('--wx', (((e.clientX - hr.left) / hr.width - 0.5) * 6).toFixed(2) + 'deg');
        win.style.setProperty('--wy', (-((e.clientY - hr.top) / hr.height - 0.5) * 4).toFixed(2) + 'deg');
      });
      heroEl.addEventListener('pointerleave', function () { win.style.setProperty('--wx', '0deg'); win.style.setProperty('--wy', '0deg'); });
    }
    // a soft light follows the pointer across cards
    $$('[data-glow]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (el.hasAttribute('data-tilt')) {
          var big = 7;
          el.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * big).toFixed(2) + 'deg');
          el.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * big).toFixed(2) + 'deg');
        }
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (hover && !reduce) {
    $$('.mag').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
    });
  }

  /* ---------- problem: the chaos sorts itself while you scroll ---------- */
  // [x, y] = centre as a share of the screen, [w, h] in px, rotation, pointer depth
  var CHAOS = [
    [0.70, 0.17, 300, 76, -7, 40], [0.93, 0.44, 280, 66, 8, 60], [0.57, 0.62, 280, 70, 5, 30],
    [0.80, 0.84, 290, 70, -9, 50], [0.12, 0.86, 170, 116, -10, 70], [0.38, 0.11, 230, 66, 6, 35],
    [0.07, 0.22, 220, 66, -8, 55], [0.47, 0.90, 230, 64, 7, 45], [0.95, 0.12, 170, 104, 9, 65],
    [0.28, 0.95, 270, 66, -4, 30], [0.62, 0.33, 180, 128, -6, 50], [0.45, 0.76, 260, 64, 10, 60]
  ];
  var MOBILE_CHAOS = [
    [0.3, 0.52, 0, 0, -6], [0.72, 0.57, 0, 0, 8], [0.24, 0.64, 0, 0, 5], [0.76, 0.69, 0, 0, -8], [0.22, 0.87, 0, 0, -10], [0.62, 0.49, 0, 0, 7], [0.8, 0.81, 0, 0, -6], [0.46, 0.94, 0, 0, 6], [0.9, 0.62, 0, 0, 9], [0.33, 0.76, 0, 0, -4], [0.64, 0.88, 0, 0, -7], [0.52, 0.71, 0, 0, 9]
  ];
  var ORDER = [1, 3, 5, 7, 9, 11, 0, 2, 4, 6, 8, 10];
  var mess = $('#problem'), mStage = $('#mess-stage'), mItems = $$('#mess-items .mc'), mSlots = $$('.bd-slots i'), board = $('#board'), sorter = $('#sorter');
  var pmx = 0, pmy = 0, messQueued = false;
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  mItems.forEach(function (el, i) { el.style.setProperty('--fd', (5 + (i % 4) * 1.3) + 's'); el.style.setProperty('--fdl', (-i * 0.9) + 's'); });
  function paintMess() {
    messQueued = false;
    if (!mess) return;
    var r = mess.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -50 || r.top > vh + 50) return;
    var p = clamp01(-r.top / Math.max(1, r.height - vh));
    var sr = mStage.getBoundingClientRect(), W = sr.width, H = sr.height, small = W < 900;
    var k = small ? 0.56 : Math.max(0.7, Math.min(1, W / 1350));
    var br = board.getBoundingClientRect();
    var bx = br.left - sr.left, by = br.top - sr.top;
    var slots = mSlots.map(function (s) { var b = s.getBoundingClientRect(); return [b.left - sr.left, b.top - sr.top, b.width, b.height]; });
    mItems.forEach(function (el, i) {
      var c = CHAOS[i], pos = small ? MOBILE_CHAOS[i] : c;
      var w0 = c[2] * k, h0 = c[3] * k;
      var t = ease(clamp01((p - 0.1 - ORDER[i] * 0.035) / 0.42));
      var free = 1 - t, depth = (c[5] || 40) * (small ? 0 : 1);
      var x0 = pos[0] * W - w0 / 2 + pmx * depth, y0 = pos[1] * H - h0 / 2 + pmy * depth;
      var x, y, w = w0, h = h0, s = 1, o = 1;
      if (i < 5) {
        var sl = slots[i];
        x = lerp(x0, sl[0], t); y = lerp(y0, sl[1], t); w = lerp(w0, sl[2], t); h = lerp(h0, sl[3], t);
        el.style.setProperty('--cb', clamp01((t - 0.55) / 0.35).toFixed(3));
      } else {
        x = lerp(x0, bx + br.width / 2 - w0 / 2, t); y = lerp(y0, by + 34 - h0 / 2, t);
        s = 1 - 0.75 * t; o = 1 - clamp01((t - 0.55) / 0.4);
      }
      el.style.width = w.toFixed(1) + 'px'; el.style.height = h.toFixed(1) + 'px';
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (pos[4] * free).toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = i < 5 ? 2 : 1;
      el.style.setProperty('--amp', (free * 14).toFixed(1) + 'px');
    });
    var sorted = p > 0.6;
    board.classList.toggle('sorted', sorted);
    sorter.setAttribute('aria-pressed', String(sorted));
    mess.classList.toggle('done', p > 0.15);
  }
  function queueMess() { if (!messQueued) { messQueued = true; requestAnimationFrame(paintMess); } }
  if (mess) {
    sorter.addEventListener('click', function () {
      var top = mess.getBoundingClientRect().top + scrollY;
      scrollTo({ top: board.classList.contains('sorted') ? top : top + mess.offsetHeight - innerHeight, behavior: reduce ? 'auto' : 'smooth' });
    });
    if (hover && !reduce) {
      mStage.addEventListener('pointermove', function (e) {
        var sr = mStage.getBoundingClientRect();
        pmx = (e.clientX - sr.left) / sr.width - 0.5; pmy = (e.clientY - sr.top) / sr.height - 0.5;
        queueMess();
      });
      mStage.addEventListener('pointerleave', function () { pmx = 0; pmy = 0; queueMess(); });
    }
    addEventListener('resize', queueMess);
    addEventListener('load', queueMess);
  }

  /* ---------- your time: hours back ---------- */
  var clP = $('#cl-p'), clR = $('#cl-r'), clT = $('#cl-t');
  if (clP) {
    var clShown = 0, clRaf = 0, clLive = false;
    var clCalc = function () {
      var pj = +clP.value, rd = +clR.value, tm = +clT.value;
      [clP, clR, clT].forEach(function (inp) { inp.style.setProperty('--v', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%'); });
      $('#cl-pv').textContent = pj; $('#cl-rv').textContent = rd; $('#cl-tv').textContent = tm;
      if (!clLive) return;
      var without = pj * (rd * 55 + 30) / 60 * (1 + (tm - 1) * 0.12);
      var withD = pj * (rd * 12 + 5) / 60 * (1 + (tm - 1) * 0.04);
      var saved = without - withD;
      $('#cl-w1').textContent = Math.round(without) + ' h';
      $('#cl-w2').textContent = Math.round(withD) + ' h';
      $('#cl-b1').style.width = '100%';
      $('#cl-b2').style.width = (withD / without * 100).toFixed(1) + '%';
      $('#cl-d').textContent = (saved / 8).toFixed(1);
      cancelAnimationFrame(clRaf);
      var from = clShown, t0 = performance.now(), D = reduce ? 0 : 650;
      (function step(now) {
        var q = D ? Math.min(1, (now - t0) / D) : 1, e = 1 - Math.pow(1 - q, 3);
        clShown = from + (saved - from) * e;
        $('#cl-h').textContent = Math.round(clShown);
        if (q < 1) clRaf = requestAnimationFrame(step);
      })(t0);
    };
    [clP, clR, clT].forEach(function (inp) { inp.addEventListener('input', clCalc); });
    clCalc();
    var clStart = function () { if (clLive) return; clLive = true; clCalc(); };
    if ('IntersectionObserver' in window) {
      var clIO = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { clIO.disconnect(); setTimeout(clStart, 400); } }, { threshold: 0.45 });
      clIO.observe($('.calc-card'));
    } else clStart();
  }

  /* ---------- review: scrub, leave a note on the frame, approve ---------- */
  var DUR = 42;
  var SEGS = [0, 12, 22, 32];
  var SEG_IMG = ['bridge-wide', 'bridge-arm', 'walk', 'walk-close'];
  var NOTES = [
    { t: 4, x: 52, y: 42, who: 'Ana', role: 'Editor', c: '#4f9ce8', text: 'New cut is up. Tighter bridge scene and a new grade.' },
    { t: 12, x: 34, y: 40, who: 'Maren', role: 'Client', c: '#6c7fd8', text: 'Trim the intro here.' },
    { t: 27, x: 64, y: 56, who: 'Leo', role: 'Editor', c: '#e07a6c', text: 'Hold the canal shot one beat longer?' },
    { t: 36, x: 80, y: 74, who: 'Maren', role: 'Client', c: '#6c7fd8', text: 'The logo can be a little smaller at the end.' }
  ];
  var fmt = function (x) { x = Math.max(0, Math.floor(x)); return (x < 10 ? '00:0' : '00:') + x; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pd = $('#pd');
  if (pd) {
    var track = $('#pd-track'), screen = $('#pd-screen'), frames = $$('.pd-frames img'), fill = $('#pd-fill'), head = $('#pd-head'), tcEl = $('#pd-tc'),
      pop = $('#pd-pop'), mark = $('#pd-mark'), playBtn = $('#pd-play'), notesEl = $('#pd-notes'), countEl = $('#pd-count'), hint = $('#pd-hint'),
      prev = $('#pd-prev'), comp = $('#pd-compose'), compIn = $('#pc-in'), compTc = $('#pc-tc'), statusEl = $('#pd-status'),
      approveBtn = $('#pd-approve'), changesBtn = $('#pd-changes'), tries = $$('.rev-try li');
    var t = 0, playing = false, raf = 0, last = 0, cur = -1, autoPlayed = false, draft = null, state = 'review';
    var segAt = function (x) { var k = 0; SEGS.forEach(function (s, i) { if (x >= s) k = i; }); return k; };
    var tried = function (i) { if (tries[i]) tries[i].classList.add('done'); };
    if (!hover) hint.lastChild.textContent = 'Tap the frame to leave a note';
    var place = function (el, x, y) {
      el.style.setProperty('--x', x + '%');
      el.style.setProperty('--y', Math.max(16, Math.min(84, y)) + '%');
      el.classList.toggle('flip', x > 52);
    };
    var bump = function () { countEl.textContent = NOTES.length; countEl.classList.remove('re-pop'); void countEl.offsetWidth; countEl.classList.add('re-pop'); };

    function addNote(n, fresh) {
      var pin = document.createElement('button');
      pin.type = 'button'; pin.className = 'pd-pin' + (fresh ? ' new' : ''); pin.style.left = (n.t / DUR * 100) + '%'; pin.style.background = n.c;
      pin.setAttribute('aria-label', n.who + ' at ' + fmt(n.t) + ': ' + n.text);
      pin.innerHTML = '<span>' + n.who.charAt(0) + '</span>';
      pin.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      pin.addEventListener('click', function (e) { e.stopPropagation(); stop(); setT(n.t); });
      track.appendChild(pin); n.pin = pin;
      var row = document.createElement('button');
      row.type = 'button'; row.className = 'pd-n' + (n.me ? ' me' : '') + (fresh ? ' new' : '');
      row.innerHTML = '<span class="av" style="background:' + n.c + '">' + n.who.charAt(0) + '</span><span><b>' + esc(n.who) + ' <em>' + n.role + '</em><span class="tc">' + fmt(n.t) + '</span></b>' + esc(n.text) + '</span>';
      row.addEventListener('click', function () { stop(); setT(n.t); });
      n.row = row;
      var after = null;
      NOTES.forEach(function (m) { if (!after && m !== n && m.row && m.t > n.t) after = m; });
      notesEl.insertBefore(row, after ? after.row : null);
      if (NOTES.indexOf(n) < 0) { NOTES.push(n); NOTES.sort(function (a, b) { return a.t - b.t; }); }
    }
    NOTES.slice().forEach(function (n) { addNote(n, false); });
    countEl.textContent = NOTES.length;

    var setT = function (x) {
      t = Math.max(0, Math.min(DUR, x));
      var pct = t / DUR * 100;
      fill.style.width = pct + '%'; head.style.left = pct + '%';
      tcEl.textContent = fmt(t); track.setAttribute('aria-valuenow', Math.round(t));
      var k = segAt(t);
      frames.forEach(function (im, i) { im.classList.toggle('on', i === k); });
      if (draft) return;
      var hit = -1;
      NOTES.forEach(function (n, i) { if (t >= n.t - 0.4 && t <= n.t + 3) hit = i; });
      if (hit !== cur) {
        cur = hit;
        NOTES.forEach(function (n, i) { n.pin.classList.toggle('on', i === hit); n.row.classList.toggle('on', i === hit); });
        if (hit > -1) {
          var n = NOTES[hit];
          pop.innerHTML = '<span class="av" style="background:' + n.c + '">' + n.who.charAt(0) + '</span><span><b>' + esc(n.who) + ' · ' + fmt(n.t) + '</b>' + esc(n.text) + '</span>';
          place(pop, n.x, n.y); place(mark, n.x, n.y);
          pop.classList.add('on'); mark.classList.add('on');
          if (innerWidth > 1100) n.row.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        } else { pop.classList.remove('on'); mark.classList.remove('on'); }
      }
    };
    var stop = function () { playing = false; cancelAnimationFrame(raf); pd.classList.remove('playing'); playBtn.innerHTML = '<svg><use href="#i-play"/></svg>'; playBtn.setAttribute('aria-label', 'Play'); };
    var play = function () {
      closeCompose();
      if (t >= DUR - 0.1) setT(0);
      playing = true; pd.classList.add('playing'); last = performance.now();
      playBtn.innerHTML = '<svg><use href="#i-pause"/></svg>'; playBtn.setAttribute('aria-label', 'Pause');
      (function step(now) {
        if (!playing) return;
        setT(t + (now - last) / 1000 * 2.4); last = now;
        if (t >= DUR) { stop(); return; }
        raf = requestAnimationFrame(step);
      })(last);
    };
    playBtn.addEventListener('click', function () { autoPlayed = true; playing ? stop() : play(); });

    // timeline: drag, keys, hover preview
    var drag = false;
    var at = function (e) { var r = track.getBoundingClientRect(); setT((e.clientX - r.left) / r.width * DUR); };
    track.addEventListener('pointerdown', function (e) { drag = true; autoPlayed = true; stop(); closeCompose(); try { track.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } at(e); });
    track.addEventListener('pointermove', function (e) {
      if (drag) { at(e); tried(0); }
      if (!hover) return;
      var r = track.getBoundingClientRect(), x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      prev.style.left = Math.max(80, Math.min(r.width - 80, x * r.width)) + 'px';
      var src = 'img/' + SEG_IMG[segAt(x * DUR)] + '.jpg', im = prev.firstChild;
      if (im.getAttribute('src') !== src) im.setAttribute('src', src);
      prev.lastChild.textContent = fmt(x * DUR);
      prev.classList.add('on');
    });
    track.addEventListener('pointerleave', function () { prev.classList.remove('on'); });
    track.addEventListener('pointerup', function () { if (drag) tried(0); drag = false; });
    track.addEventListener('pointercancel', function () { drag = false; });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { stop(); setT(t + 1); tried(0); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { stop(); setT(t - 1); tried(0); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { playing ? stop() : play(); e.preventDefault(); }
    });

    // click the frame to write a note there
    function openCompose(x, y, ph) {
      stop(); autoPlayed = true;
      draft = { x: x, y: y, t: Math.round(t) };
      cur = -1; pop.classList.remove('on');
      NOTES.forEach(function (n) { n.pin.classList.remove('on'); n.row.classList.remove('on'); });
      place(mark, x, y); mark.classList.add('on');
      place(comp, x, y); compTc.textContent = fmt(draft.t);
      compIn.placeholder = ph || 'Write a note for this frame';
      comp.classList.add('on'); hint.classList.add('off');
      compIn.value = '';
      setTimeout(function () { try { compIn.focus({ preventScroll: true }); } catch (err) { compIn.focus(); } }, 60);
    }
    function closeCompose() {
      if (!draft) return;
      draft = null; comp.classList.remove('on'); mark.classList.remove('on');
      cur = -1; setT(t);
    }
    screen.addEventListener('click', function (e) {
      if (e.target.closest('.pd-compose')) return;
      if (state === 'approved') return;
      if (draft) { closeCompose(); return; }
      var r = screen.getBoundingClientRect();
      openCompose((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    });
    comp.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = compIn.value.trim();
      if (!text) { comp.classList.remove('shake'); void comp.offsetWidth; comp.classList.add('shake'); compIn.focus(); return; }
      var n = { t: draft.t, x: draft.x, y: draft.y, who: 'You', role: 'Client', c: '#1f6fd0', text: text, me: true };
      draft = null; comp.classList.remove('on');
      addNote(n, true); bump(); tried(1);
      cur = -1; setT(n.t);
      if (innerWidth > 1100) n.row.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      else notesEl.scrollTo({ left: n.row.offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth' });
    });
    compIn.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closeCompose(); } });

    // approve / request changes
    var LABEL = { review: ['In Review', 'review'], changes: ['Changes requested', 'changes'], approved: ['Approved', 'approved'] };
    function setStatus(s) {
      state = s; pd.setAttribute('data-state', s);
      statusEl.textContent = LABEL[s][0];
      statusEl.className = 'pill pd-status ' + LABEL[s][1];
      void statusEl.offsetWidth; statusEl.classList.add('re-pop');
      approveBtn.lastChild.textContent = s === 'approved' ? 'Approved' : 'Approve v3';
      changesBtn.textContent = s === 'changes' ? 'Changes requested' : 'Request changes';
    }
    approveBtn.addEventListener('click', function () {
      autoPlayed = true; stop(); closeCompose();
      if (state === 'approved') return;
      setStatus('approved'); tried(2);
    });
    changesBtn.addEventListener('click', function () {
      autoPlayed = true;
      setStatus(state === 'changes' ? 'review' : 'changes');
      if (state === 'changes') openCompose(46, 46, 'What should change?');
    });

    setT(0);
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !autoPlayed) { autoPlayed = true; setTimeout(function () { if (!draft && state !== 'approved') play(); }, 700); }
        if (!es[0].isIntersecting && playing) stop();
      }, { threshold: 0.55 }).observe(pd);
    }
  }

  /* ---------- flow: a live scene that plays each step ---------- */
  var scene = $('#scene'), steps = $$('.fs'), flowCol = $('.flow-col'), flLine = $('.fl-line'), flFill = $('#fl-fill');
  var STEP_LBL = ['Upload', 'Share', 'Revise', 'Approve', 'Deliver'];
  var STEP_PILL = [['Uploading', ''], ['In Review', ''], ['v4 uploaded', ''], ['Approved', 'ok'], ['Delivered', 'ok']];
  var STEP_CUR = ['.sc-th', '.sc-btn', '.sc-cm .ok', '.sc-th', '.dl-ic'];
  var STEP_CLICK = [1700, 850, 950, 750, 750];
  var sIdx = -1, upRaf = 0, curTimer = 0;
  var rip = null, cursor = scene ? $('.sc-cur', scene) : null;
  if (scene) { rip = document.createElement('span'); rip.className = 'sc-rip'; scene.appendChild(rip); }
  function reAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function runUpload() {
    cancelAnimationFrame(upRaf);
    var pctEl = $('#sc-pct'), bar = $('#sc-bar'), t0 = performance.now(), D = reduce ? 0 : 1600;
    scene.classList.remove('up-done');
    (function step(now) {
      var k = D ? Math.min(1, (now - t0) / D) : 1, e = 1 - Math.pow(1 - k, 2.2);
      pctEl.textContent = Math.round(e * 100) + '%'; bar.style.width = (e * 100) + '%';
      if (k < 1) upRaf = requestAnimationFrame(step);
      else setTimeout(function () { if (sIdx === 0) scene.classList.add('up-done'); }, 250);
    })(t0);
  }
  function moveCursor(i) {
    clearTimeout(curTimer);
    var target = $(STEP_CUR[i], scene);
    if (!target || !cursor) return;
    var sr = scene.getBoundingClientRect(), r = target.getBoundingClientRect();
    var x = r.left - sr.left + r.width / 2, y = r.top - sr.top + r.height / 2;
    cursor.style.left = (x - 5) + 'px'; cursor.style.top = (y - 3) + 'px';
    curTimer = setTimeout(function () {
      if (sIdx !== i) return;
      reAnim(cursor, 'clk');
      rip.style.left = x + 'px'; rip.style.top = y + 'px'; reAnim(rip, 'go');
    }, STEP_CLICK[i]);
  }
  function setStep(i) {
    if (i === sIdx) return;
    sIdx = i;
    steps.forEach(function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); });
    if (!scene) return;
    var cls = 'scene s-' + (i + 1);
    for (var k = 1; k <= i + 1; k++) cls += ' at' + k;
    scene.className = cls;
    var fc = $('#fc'), fl = $('#fl'), pill = $('#sc-pill');
    fc.textContent = '0' + (i + 1); reAnim(fc, 're-in');
    fl.textContent = STEP_LBL[i]; reAnim(fl, 're-in');
    pill.textContent = STEP_PILL[i][0]; pill.className = 'sc-pill ' + STEP_PILL[i][1]; reAnim(pill, 're-in');
    $('#fp').style.width = ((i + 1) / 5 * 100) + '%';
    if (i === 0) runUpload(); else { cancelAnimationFrame(upRaf); $('#sc-pct').textContent = '100%'; $('#sc-bar').style.width = '100%'; }
    moveCursor(i);
  }
  if (steps.length && 'IntersectionObserver' in window) {
    var stepIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setStep(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
  } else steps.forEach(function (s) { s.classList.add('on'); });
  function sizeLine() {
    if (!flLine || !steps.length) return;
    var a = steps[0].offsetTop + 10, b = steps[steps.length - 1].offsetTop + 10;
    flLine.style.top = a + 'px'; flLine.style.height = (b - a) + 'px';
  }
  function paintFlow() {
    if (!flowCol || !flFill) return;
    var r = flLine.getBoundingClientRect();
    var p = r.height ? Math.max(0, Math.min(1, (innerHeight * 0.5 - r.top) / r.height)) : 0;
    flFill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
  }
  sizeLine();
  addEventListener('resize', function () { sizeLine(); paintFlow(); if (sIdx > -1) moveCursor(sIdx); });
  addEventListener('load', sizeLine);

  /* ---------- product: a bento of small live demos ---------- */
  var bento = $('#bento');
  if (bento) {
    var used = function (el) { var t = el.closest('.bt'); if (t) t.classList.add('used'); };
    var again = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    // each tile plays its entrance when it comes into view, and again next time
    var panes = $$('.bt .fx-pane', bento);
    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && e.intersectionRatio > 0.3) e.target.classList.add('on');
          else if (!e.isIntersecting) e.target.classList.remove('on');
        });
      }, { threshold: [0, 0.3] });
      panes.forEach(function (p) { bio.observe(p); });
    } else panes.forEach(function (p) { p.classList.add('on'); });

    // files: pick a version
    var pvTop = $('.pv-c.k0'), pvNote = $('#pv-note'), pvBtns = $$('.pv-vs button');
    var PV = { 1: 'v1 · rough cut', 2: 'v2 · new music', 3: 'v3 · colour pass', 4: 'v4 · final grade' };
    pvBtns.forEach(function (bt) {
      bt.addEventListener('click', function () {
        var v = bt.getAttribute('data-v');
        pvBtns.forEach(function (x) { x.classList.toggle('on', x === bt); });
        pvTop.setAttribute('data-v', v); pvNote.textContent = PV[v];
        again(pvTop, 'swap'); used(bt);
      });
    });

    // approval: approve the teaser, the finals grow
    var paGo = $('.pa-go'), paSum = $('#pa-sum'), paDl = $('.pa-dl');
    if (paGo) paGo.addEventListener('click', function () {
      var on = paGo.getAttribute('aria-pressed') !== 'true';
      paGo.setAttribute('aria-pressed', String(on));
      var pill = $('.pill', paGo);
      pill.className = 'pill ' + (on ? 'approved' : 'review'); pill.textContent = on ? 'Approved' : 'In Review';
      $('small', paGo).textContent = on ? 'v1 · Maren · just now' : 'v1 · waiting on client';
      paSum.textContent = on ? '3 files · 2.3 GB · original quality' : '2 files · 1.9 GB · original quality';
      again(pill, 'again'); again(paDl, 'again'); used(paGo);
    });

    // team: quick replies land in the feed
    var feed = $('#pt-feed');
    $$('.pt-qr button').forEach(function (bt) {
      bt.addEventListener('click', function () {
        var m = document.createElement('div');
        m.className = 'pt-m me new';
        m.innerHTML = '<span class="bb"></span>';
        m.firstChild.textContent = bt.textContent;
        feed.appendChild(m);
        while (feed.children.length > 3) feed.removeChild(feed.firstElementChild);
        used(bt);
      });
    });

    // review: click the frame to place the note, approve or ask for changes
    var pr = $('#pr'), prF = $('#pr-f'), prTl = $('#pr-tl');
    if (pr && prF) {
      var ring = $('.pr-ring', prF), bub = $('.pr-bub', prF), txt = $('.pr-txt', prF), tc = $('.tc', prF), fill = $('.pr-fill', prTl);
      var NOTES = ['Warmer here, please.', 'Logo a bit smaller.', 'Hold this shot longer.', 'Trim the intro here.'], nk = 0;
      prF.addEventListener('click', function (e) {
        var r = prF.getBoundingClientRect();
        var x = Math.min(90, Math.max(8, (e.clientX - r.left) / r.width * 100)), y = Math.min(86, Math.max(14, (e.clientY - r.top) / r.height * 100));
        ring.style.left = x + '%'; ring.style.top = y + '%';
        bub.style.left = 'calc(' + x + '% + 34px)'; bub.style.top = y + '%';
        bub.classList.toggle('left', x > 52);
        txt.textContent = NOTES[nk++ % NOTES.length];
        var sec = Math.round(4 + x / 100 * 26);
        tc.textContent = '00:' + (sec < 10 ? '0' : '') + sec;
        fill.style.width = x + '%';
        var pin = document.createElement('span'); pin.className = 'pin m new'; pin.textContent = 'M'; pin.style.left = x + '%';
        prTl.appendChild(pin);
        while ($$('.pin', prTl).length > 6) prTl.removeChild($('.pin', prTl));
        again(bub, 'again'); pr.classList.remove('ok'); used(prF);
      });
      $('#pr-ok').addEventListener('click', function () {
        var on = !pr.classList.contains('ok');
        pr.classList.toggle('ok', on); pr.classList.remove('ch');
        $('#pr-ok span').textContent = on ? 'Approved' : 'Approve'; used(pr);
      });
      $('#pr-ch').addEventListener('click', function () {
        pr.classList.toggle('ch'); pr.classList.remove('ok'); $('#pr-ok span').textContent = 'Approve'; used(pr);
      });
    }

    // calendar days (November 2026 starts on a Sunday); click to pick one
    var days = $('#pc-days');
    if (days) {
      var html = '';
      for (var c = 0; c < 42; c++) {
        var d = c - 5, label, cl = '';
        if (d < 1) { label = 31 + d; cl = 'o'; } else if (d > 30) { label = d - 30; cl = 'o'; } else label = d;
        if (d === 15) cl = 't';
        html += '<span class="' + cl + '"><b>' + label + '</b></span>';
      }
      days.innerHTML = html;
      days.addEventListener('click', function (e) {
        var s = e.target.closest('span');
        if (!s || s.classList.contains('o')) return;
        $$('span', days).forEach(function (x) { x.classList.remove('t'); });
        s.classList.add('t'); used(days);
      });
    }

    // tasks: tick them off
    var pkN = $('#pk-n'), pkT = $$('.pk-t');
    pkT.forEach(function (t) {
      t.addEventListener('click', function () {
        t.classList.toggle('done');
        var open = pkT.filter(function (x) { return !x.classList.contains('done'); }).length;
        pkN.textContent = open ? open + ' open' : 'All done';
        used(t);
      });
    });
  }

  /* ---------- film: plays muted when it scrolls into view ---------- */
  var film = $('#film-v'), filmFrame = film ? film.parentNode : null, filmPP = $('#film-pp'), filmSnd = $('#film-snd'), filmProg = $('#film-prog');
  if (film) {
    var userPaused = false;
    var fPlay = function () { var pr = film.play(); if (pr && pr.catch) pr.catch(function () { filmFrame.classList.add('paused'); }); };
    var syncPP = function () {
      var paused = film.paused;
      filmFrame.classList.toggle('paused', paused);
      filmPP.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    };
    film.addEventListener('play', syncPP); film.addEventListener('pause', syncPP);
    film.addEventListener('timeupdate', function () { if (film.duration) filmProg.style.width = (film.currentTime / film.duration * 100) + '%'; });
    var togglePlay = function () { if (film.paused) { userPaused = false; fPlay(); } else { userPaused = true; film.pause(); } };
    filmPP.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
    film.addEventListener('click', togglePlay);
    filmSnd.addEventListener('click', function (e) {
      e.stopPropagation();
      film.muted = !film.muted;
      filmSnd.setAttribute('aria-pressed', String(!film.muted));
      filmSnd.lastChild.textContent = film.muted ? 'Sound on' : 'Sound off';
      if (!film.muted && film.paused) { userPaused = false; fPlay(); }
    });
    syncPP();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) film.preload = 'auto'; }, { rootMargin: '600px 0px' }).observe(filmFrame);
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!userPaused && !reduce) fPlay(); }
        else if (!film.paused) film.pause();
      }, { threshold: 0.35 }).observe(filmFrame);
    }
  }

  /* ---------- statement: words light up while scrolling ---------- */
  var st = $('#st'), words = [];
  if (st) {
    st.innerHTML = st.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w' + (w === 'Every' ? ' k' : '') + '">' + w + '</span>'; }).join(' ');
    words = $$('.w', st);
  }
  function paintStatement() {
    if (!words.length) return;
    if (reduce) { words.forEach(function (w) { w.classList.add('on'); }); return; }
    var r = st.getBoundingClientRect(), vh = innerHeight;
    var prog = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    var n = Math.round(prog * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  }

  /* ---------- pricing: prices count down to the real price ---------- */
  var counted = false;
  function countPrices(now) {
    if (counted) return; counted = true;
    $$('.price span[data-to]').forEach(function (el, i) {
      var to = parseFloat(el.getAttribute('data-to')), from = to ? Math.round(to * 1.7) + 0.99 : 9;
      var out = function (v) { el.textContent = '€' + (to % 1 ? v.toFixed(2) : Math.round(v)); };
      if (now || reduce) { out(to); return; }
      out(from);
      setTimeout(function () {
        var t0 = performance.now();
        (function step(x) { var k = Math.min(1, (x - t0) / 1100), e = 1 - Math.pow(1 - k, 4); out(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
      }, 250 + i * 90);
    });
  }

  /* ---------- cta: the spotlight stays, the words drift a touch ---------- */
  var cta = $('#cta'), ctaIn = $('.cta-in');
  if (cta && ctaIn && hover && !reduce) {
    cta.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      ctaIn.style.setProperty('--cx', (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(1) + 'px');
      ctaIn.style.setProperty('--cy', (((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1) + 'px');
    });
    cta.addEventListener('pointerleave', function () { ctaIn.style.setProperty('--cx', '0px'); ctaIn.style.setProperty('--cy', '0px'); });
  }

  onScroll();
})();
