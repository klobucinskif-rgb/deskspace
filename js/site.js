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
    setTimeout(done, 3100);
    var skip = function () { if (!intro.parentNode) return; intro.classList.add('skip'); ready(); setTimeout(done, 320); };
    intro.addEventListener('click', skip);
    addEventListener('keydown', function onKey() { removeEventListener('keydown', onKey); skip(); });
  }

  /* ---------- nav: glass after the top, hides while scrolling down ---------- */
  var nav = $('#nav'), lastY = scrollY;
  function onNav() {
    var y = scrollY;
    nav.classList.toggle('scrolled', y > 10);
    nav.classList.toggle('hide', y > 640 && y > lastY + 4);
    if (y < lastY - 4 || y < 640) nav.classList.remove('hide');
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
    ['review', 'flow', 'product', 'pricing', 'faq', 'hero', 'problem', 'film', 'cta'].forEach(function (id) { var el = document.getElementById(id); if (el) secIO.observe(el); });
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
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

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

  /* ---------- problem: scattered vs sorted ---------- */
  var board = $('#board'), sorter = $('#sorter'), touched = false;
  function setSorted(on) {
    board.classList.toggle('sorted', on);
    sorter.setAttribute('aria-pressed', String(on));
  }
  if (board && sorter) {
    sorter.addEventListener('click', function () { touched = true; setSorted(!board.classList.contains('sorted')); });
    if ('IntersectionObserver' in window) {
      var bIO = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        bIO.disconnect();
        setTimeout(function () { if (!touched) setSorted(true); }, 1600);
      }, { threshold: 0.6 });
      bIO.observe(board);
    }
  }

  /* ---------- review: scrub the cut, notes pop on their frame ---------- */
  var DUR = 42;
  var SEGS = [[0, 'bridge-wide'], [12, 'bridge-arm'], [22, 'walk'], [32, 'walk-close']];
  var NOTES = [
    { t: 4, who: 'Ana', role: 'Editor', c: '#4f9ce8', text: 'New cut is up. Tighter bridge scene and a new grade.' },
    { t: 12, who: 'Maren', role: 'Client', c: '#6c7fd8', text: 'Trim the intro here.' },
    { t: 27, who: 'Leo', role: 'Editor', c: '#e07a6c', text: 'Hold the canal shot one beat longer?' },
    { t: 36, who: 'Maren', role: 'Client', c: '#6c7fd8', text: 'The logo can be a little smaller at the end.' }
  ];
  var pd = $('#pd');
  if (pd) {
    var track = $('#pd-track'), img = $('#pd-img'), fill = $('#pd-fill'), head = $('#pd-head'), tcEl = $('#pd-tc'), pop = $('#pd-pop'), playBtn = $('#pd-play'), notesEl = $('#pd-notes');
    var t = 0, playing = false, raf = 0, last = 0, cur = -1, autoPlayed = false;
    SEGS.forEach(function (s) { var im = new Image(); im.src = 'img/' + s[1] + '.jpg'; });
    var fmt = function (x) { x = Math.max(0, Math.floor(x)); return (x < 10 ? '00:0' : '00:') + x; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    NOTES.forEach(function (n, i) {
      var pin = document.createElement('button');
      pin.type = 'button'; pin.className = 'pd-pin'; pin.style.left = (n.t / DUR * 100) + '%'; pin.style.background = n.c;
      pin.setAttribute('aria-label', n.who + ' at ' + fmt(n.t) + ': ' + n.text);
      pin.innerHTML = '<span>' + n.who.charAt(0) + '</span>';
      pin.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      pin.addEventListener('click', function (e) { e.stopPropagation(); stop(); setT(n.t); });
      track.appendChild(pin); n.pin = pin;
      var row = document.createElement('button');
      row.type = 'button'; row.className = 'pd-n';
      row.innerHTML = '<span class="av" style="background:' + n.c + '">' + n.who.charAt(0) + '</span><span><b>' + esc(n.who) + ' <em>' + n.role + '</em><span class="tc">' + fmt(n.t) + '</span></b>' + esc(n.text) + '</span>';
      row.addEventListener('click', function () { stop(); setT(n.t); });
      notesEl.appendChild(row); n.row = row;
    });
    var setT = function (x) {
      t = Math.max(0, Math.min(DUR, x));
      var pct = t / DUR * 100;
      fill.style.width = pct + '%'; head.style.left = pct + '%';
      tcEl.textContent = fmt(t); track.setAttribute('aria-valuenow', Math.round(t));
      var seg = SEGS[0][1];
      SEGS.forEach(function (s) { if (t >= s[0]) seg = s[1]; });
      var want = 'img/' + seg + '.jpg';
      if (img.getAttribute('src') !== want) img.setAttribute('src', want);
      var hit = -1;
      NOTES.forEach(function (n, i) { if (t >= n.t - 0.4 && t <= n.t + 3) hit = i; });
      if (hit !== cur) {
        cur = hit;
        NOTES.forEach(function (n, i) { n.pin.classList.toggle('on', i === hit); n.row.classList.toggle('on', i === hit); });
        if (hit > -1) {
          var n = NOTES[hit];
          pop.innerHTML = '<span class="av" style="background:' + n.c + '">' + n.who.charAt(0) + '</span><span><b>' + esc(n.who) + ' · ' + fmt(n.t) + '</b>' + esc(n.text) + '</span>';
          pop.classList.add('on');
          if (innerWidth > 1100) n.row.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        } else pop.classList.remove('on');
      }
    };
    var stop = function () { playing = false; cancelAnimationFrame(raf); pd.classList.remove('playing'); playBtn.innerHTML = '<svg><use href="#i-play"/></svg>'; playBtn.setAttribute('aria-label', 'Play'); };
    var play = function () {
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
    var drag = false;
    var at = function (e) { var r = track.getBoundingClientRect(); setT((e.clientX - r.left) / r.width * DUR); };
    track.addEventListener('pointerdown', function (e) { drag = true; autoPlayed = true; stop(); try { track.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } at(e); });
    track.addEventListener('pointermove', function (e) { if (drag) at(e); });
    track.addEventListener('pointerup', function () { drag = false; });
    track.addEventListener('pointercancel', function () { drag = false; });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { stop(); setT(t + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { stop(); setT(t - 1); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { playing ? stop() : play(); e.preventDefault(); }
    });
    setT(0);
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !autoPlayed) { autoPlayed = true; setTimeout(play, 700); }
        if (!es[0].isIntersecting && playing) stop();
      }, { threshold: 0.55 }).observe(pd);
    }
  }

  /* ---------- flow: steps light up as they reach the middle ---------- */
  var steps = $$('.fs'), fc = $('#fc'), fp = $('#fp');
  if (steps.length && 'IntersectionObserver' in window) {
    var stepIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = steps.indexOf(e.target);
        steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
        var n = e.target.getAttribute('data-n');
        if (fc.textContent !== n) { fc.textContent = n; fc.classList.remove('flip'); void fc.offsetWidth; fc.classList.add('flip'); }
        fp.style.width = ((i + 1) / steps.length * 100) + '%';
      });
    }, { rootMargin: '-42% 0px -42% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
  } else steps.forEach(function (s) { s.classList.add('on'); });

  /* ---------- product rows: one open at a time ---------- */
  var rows = $$('.rx'), hoverTimer;
  function openRow(r) {
    rows.forEach(function (x) { var on = x === r; x.classList.toggle('open', on); $('.rx-h', x).setAttribute('aria-expanded', String(on)); });
  }
  rows.forEach(function (r) {
    $('.rx-h', r).addEventListener('click', function () { r.classList.contains('open') ? (r.classList.remove('open'), $('.rx-h', r).setAttribute('aria-expanded', 'false')) : openRow(r); });
    if (hover) {
      r.addEventListener('mouseenter', function () { clearTimeout(hoverTimer); hoverTimer = setTimeout(function () { openRow(r); }, 160); });
      r.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
    }
  });

  /* ---------- film ---------- */
  var film = $('#film-v'), filmBtn = $('#film-play');
  if (film && filmBtn) {
    filmBtn.addEventListener('click', function () {
      film.muted = false; film.controls = true; film.currentTime = 0;
      var pr = film.play(); if (pr && pr.catch) pr.catch(function () {});
      film.parentNode.classList.add('playing');
    });
    film.addEventListener('ended', function () { film.parentNode.classList.remove('playing'); film.controls = false; });
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

  /* ---------- cta: the glow follows the pointer ---------- */
  var cta = $('#cta'), glow = $('#cta-glow');
  if (cta && glow && hover && !reduce) {
    cta.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      glow.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      glow.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });
    cta.addEventListener('pointerleave', function () { glow.style.setProperty('--gx', '50%'); glow.style.setProperty('--gy', '55%'); });
  }

  onScroll();
})();
