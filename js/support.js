/* ============================================================
   support.js — Zetpack
   JS khusus halaman Support (support.html)
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

  const saved = localStorage.getItem('zetpack-theme');
  applyTheme(saved || getSystemTheme());

  $('#themeToggle').on('click', function () {
    const current = $html.attr('data-bs-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem('zetpack-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // ── Feedback Form — mailto fallback ──
  $('#feedbackForm').on('submit', function (e) {
    e.preventDefault();

    const name    = $('#inputName').val().trim();
    const type    = $('#inputType').val();
    const message = $('#inputMessage').val().trim();

    if (!message) return;

    const subject = encodeURIComponent('[Zetpack] ' + type + (name ? ' dari ' + name : ''));
    const body    = encodeURIComponent(
      (name ? 'Dari: ' + name + '\n' : '') +
      'Jenis: ' + type + '\n\n' +
      message
    );

    window.location.href = 'mailto:zetpack.id@gmail.com?subject=' + subject + '&body=' + body;
  });

});