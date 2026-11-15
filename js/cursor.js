/* Deskspace — a small, soft circle that follows the mouse (mouse only, never touch) */
(function () {
  'use strict';
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var css = '.ds-cur{position:fixed;left:0;top:0;z-index:2147483000;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
    'background:rgba(79,156,232,.2);box-shadow:inset 0 0 0 1px rgba(79,156,232,.38);pointer-events:none;opacity:0;transition:opacity .3s ease;will-change:transform}' +
    '.ds-cur.on{opacity:1}' +
    ':root[data-theme="dark"] .ds-cur{background:rgba(170,212,255,.16);box-shadow:inset 0 0 0 1px rgba(170,212,255,.34)}';
  var HOT = 'a,button,input,select,textarea,label,summary,[role="tab"],[role="slider"],[data-cursor="hot"],.pd-screen,.film-frame';

  function start() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    var el = document.createElement('div');
    el.className = 'ds-cur';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);

    var x = 0, y = 0, tx = 0, ty = 0, s = 1, ts = 1, raf = 0, shown = false, down = false, hot = false;
    function frame() {
      x += (tx - x) * 0.28; y += (ty - y) * 0.28; s += (ts - s) * 0.22;
      el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + s.toFixed(3) + ')';
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.08 || Math.abs(ts - s) > 0.002) raf = requestAnimationFrame(frame);
      else raf = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function target() { ts = down ? 0.72 : hot ? 1.7 : 1; kick(); }
    function hide() { shown = false; el.classList.remove('on'); }

    addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') { hide(); return; }
      tx = e.clientX; ty = e.clientY;
      if (!shown) { x = tx; y = ty; shown = true; el.classList.add('on'); }
      hot = !!(e.target && e.target.closest && e.target.closest(HOT));
      target();
    }, { passive: true });
    addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { down = true; target(); } }, { passive: true });
    addEventListener('pointerup', function () { down = false; target(); }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) hide(); });
    addEventListener('blur', hide);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
