/* Deskspace — light / dark theme. Loaded in <head> so the right theme is set before first paint. */
(function () {
  var KEY = 'deskspace-theme', root = document.documentElement;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    if (t === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#111a28' : meta.getAttribute('data-light') || meta.getAttribute('content'));
  }
  var meta0 = document.querySelector('meta[name="theme-color"]');
  if (meta0) meta0.setAttribute('data-light', meta0.getAttribute('content'));
  apply(read() === 'dark' ? 'dark' : 'light');

  window.deskspaceTheme = {
    get: function () { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    set: function (t) {
      root.classList.add('theming');
      apply(t);
      try { localStorage.setItem(KEY, t); } catch (e) { /* storage unavailable */ }
      clearTimeout(window.deskspaceTheme._t);
      window.deskspaceTheme._t = setTimeout(function () { root.classList.remove('theming'); }, 420);
    },
    toggle: function () { this.set(this.get() === 'dark' ? 'light' : 'dark'); }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (b) window.deskspaceTheme.toggle();
  });
})();
