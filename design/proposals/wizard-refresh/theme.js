/* Light/dark toggle (from the bake-off): remembers the choice, follows the system until one is made. */
(function () {
  var k = 'automailr-theme', root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : mq.matches; }
  function sync() {
    var d = isDark();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(d));
      b.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
      b.title = d ? 'Switch to light theme' : 'Switch to dark theme';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(k, next); } catch (err) {}
    sync();
  });
  if (mq.addEventListener) mq.addEventListener('change', sync);
  sync();

  /* Mockup only: aria-disabled buttons do nothing when pressed. */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[aria-disabled="true"]');
    if (d) e.preventDefault();
  });

  /* Segmented controls switch their pressed state. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.seg button');
    if (!b) return;
    b.parentElement.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });

  /* Avatar menus: open and close with click and Escape (they start open in the mockup). */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-menu-btn]');
    if (!t) return;
    var m = document.getElementById(t.getAttribute('aria-controls'));
    var open = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', String(open));
    m.hidden = !open;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-menu-btn][aria-expanded="true"]').forEach(function (t) {
      t.setAttribute('aria-expanded', 'false');
      document.getElementById(t.getAttribute('aria-controls')).hidden = true;
    });
  });
})();
