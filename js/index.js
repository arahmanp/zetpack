/* ============================================================
   index.js — Zetpack
   JS khusus halaman About (index.html)
   ============================================================ */

$(function () {

  // ── Theme Toggle ──
  const $html = $('html');
  const $themeIcon = $('#themeIcon');

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    $html.attr('data-bs-theme', theme);
    $themeIcon.attr('class', theme === 'dark' ? 'bi bi-moon' : 'bi bi-sun');
    localStorage.setItem('zetpack-theme', theme);
  }

  // Init theme
  const saved = localStorage.getItem('zetpack-theme');
  applyTheme(saved || getSystemTheme());

  // Toggle on click
  $('#themeToggle').on('click', function () {
    const current = $html.attr('data-bs-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Follow system preference changes (only if user hasn't manually set)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem('zetpack-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

});