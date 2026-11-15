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
      paintFlow();
      paintSky();
      paintFloat();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });


  /* ---------- dark sky: lighter at the top, deep navy at the end ---------- */
  var sky = $('.page-bg');
  var SKY_A = [[34, 70, 111], [8, 18, 36]], SKY_B = [[18, 39, 63], [3, 7, 15]];
  var mix = function (a, b, k) { return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(',') + ')'; };
  function paintSky() {
    if (!sky) return;
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    var k = Math.max(0, Math.min(1, scrollY / max));
    k = k * k * (3 - 2 * k);
    sky.style.setProperty('--pg-a', mix(SKY_A[0], SKY_A[1], k));
    sky.style.setProperty('--pg-b', mix(SKY_B[0], SKY_B[1], k));
    sky.style.setProperty('--pg-g', (0.32 * (1 - k) + 0.06).toFixed(3));
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

  /* ---------- product: pick a feature, the preview follows ---------- */
  var fx = $('#fx');
  if (fx) {
    var fxIts = $$('.fx-it', fx), fxPanes = $$('.fx-pane', fx), fxK = 0;
    var fxSel = function (i, focus) {
      fxK = i;
      fxIts.forEach(function (b, j) { var on = j === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      fxPanes.forEach(function (p, j) { p.classList.toggle('on', j === i); });
      if (focus) fxIts[i].focus();
    };
    fxIts.forEach(function (b, i) {
      b.addEventListener('click', function () { fxSel(i); });
      $('.fx-bar i', b).addEventListener('animationend', function () { if (fxK === i) fxSel((i + 1) % fxIts.length); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); fxSel((i + d + fxIts.length) % fxIts.length, true); }
      });
    });
    if (hover) {
      fx.addEventListener('mouseenter', function () { fx.classList.add('hold'); });
      fx.addEventListener('mouseleave', function () { fx.classList.remove('hold'); });
    }
    fx.addEventListener('focusin', function () { fx.classList.add('hold'); });
    fx.addEventListener('focusout', function () { fx.classList.remove('hold'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { fx.classList.toggle('live', es[0].isIntersecting); }, { threshold: 0.4 }).observe(fx);
    }
    // calendar days for the preview (November 2026 starts on a Sunday)
    var days = $('#pc-days');
    if (days) {
      var html = '';
      for (var c = 0; c < 42; c++) {
        var d = c - 5, label, cl = '';
        if (d < 1) { label = 31 + d; cl = 'o'; } else if (d > 30) { label = d - 30; cl = 'o'; } else label = d;
        if (d === 15) cl = 't';
        html += '<span class="' + cl + '">' + (cl === 't' ? '<b>' + label + '</b>' : label) + '</span>';
      }
      days.innerHTML = html;
    }
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
