/* ============================================================
   archieve.js — Zetpack
   JS khusus halaman Archive (archieve.html)
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

  // ── State ──
  let allPackages = [];
  let activeJenjang = 'Semua';
  let activeSumber  = 'Semua';
  let searchQuery   = '';

  // ── Fetch Data ──
  $.getJSON('data/packages.json', function (data) {
    allPackages = data.packages;
    updateFilterCounts();
    renderPackages();
  });

  // ── Filter Logic ──
  function getFiltered() {
    return allPackages.filter(function (p) {
      const matchJenjang = activeJenjang === 'Semua' || p.jenjang === activeJenjang;
      const matchSumber  = activeSumber  === 'Semua' || p.sumber  === activeSumber;
      const matchSearch  = searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery) ||
        p.sumber.toLowerCase().includes(searchQuery) ||
        String(p.tahun).includes(searchQuery);
      return matchJenjang && matchSumber && matchSearch;
    });
  }

  // ── Update filter counts ──
  function updateFilterCounts() {
    // Jenjang counts
    ['SD', 'SMP', 'SMA', 'Mahasiswa'].forEach(function (j) {
      const count = allPackages.filter(p => p.jenjang === j).length;
      $('[data-jenjang="' + j + '"] .filter-count').text(count);
    });

    // Sumber counts
    ['UTBK SNBT', 'SIMAK UI', 'OSNK Matematika', 'SAT'].forEach(function (s) {
      const count = allPackages.filter(p => p.sumber === s).length;
      $('[data-sumber="' + s + '"] .filter-count').text(count);
    });

    // Total
    $('[data-jenjang="Semua"] .filter-count').text(allPackages.length);
  }

  // ── Render Package List ──
  function renderPackages() {
    const filtered = getFiltered();
    const $list    = $('#packageList');
    const $empty   = $('#emptyState');
    const $count   = $('#resultCount');
    const $tags    = $('#activeTags');

    $list.empty();
    $tags.empty();

    // Result count
    $count.html('<span>' + filtered.length + '</span> paket soal ditemukan');

    // Active filter tags
    if (activeJenjang !== 'Semua') {
      $tags.append('<span class="filter-tag"><i class="bi bi-mortarboard"></i>' + activeJenjang + '</span>');
    }
    if (activeSumber !== 'Semua') {
      $tags.append('<span class="filter-tag"><i class="bi bi-collection"></i>' + activeSumber + '</span>');
    }
    if (searchQuery !== '') {
      $tags.append('<span class="filter-tag"><i class="bi bi-search"></i>"' + searchQuery + '"</span>');
    }

    if (filtered.length === 0) {
      $list.hide();
      $empty.show();
      return;
    }

    $empty.hide();
    $list.show();

    filtered.forEach(function (p) {
      const item = `
        <div class="package-item" data-id="${p.id}">
          <div class="package-item-icon">
            <i class="bi bi-file-earmark-pdf"></i>
          </div>
          <div class="package-item-body">
            <div class="package-item-title">${p.title}</div>
            <div class="package-item-meta">
              <span class="package-meta-tag"><i class="bi bi-calendar3"></i>${p.tahun}</span>
              <span class="package-meta-tag"><i class="bi bi-question-circle"></i>${p.jumlah_soal} soal</span>
              <span class="package-meta-tag"><i class="bi bi-file-earmark"></i>${p.ukuran}</span>
            </div>
          </div>
          <div class="package-item-badges">
            <span class="badge-pill">${p.jenjang}</span>
            <span class="badge-pill">${p.kategori}</span>
          </div>
        </div>`;
      $list.append(item);
    });
  }

  // ── Filter: Jenjang ──
  $(document).on('change', 'input[name="filterJenjang"]', function () {
    activeJenjang = $(this).val();
    renderPackages();
  });

  // ── Filter: Sumber ──
  $(document).on('change', 'input[name="filterSumber"]', function () {
    activeSumber = $(this).val();
    renderPackages();
  });

  // ── Search ──
  $('#searchInput').on('input', function () {
    searchQuery = $(this).val().trim().toLowerCase();
    renderPackages();
  });

  // ── Mobile Sidebar Toggle ──
  $('#filterToggleBtn').on('click', function () {
    const $sidebar = $('#archiveSidebar');
    $sidebar.toggleClass('open');
    const isOpen = $sidebar.hasClass('open');
    $(this).find('.toggle-icon').attr('class', 'toggle-icon bi ' + (isOpen ? 'bi-chevron-up' : 'bi-chevron-down'));
  });

  // ── Modal: Buka detail paket ──
  const modal = new bootstrap.Modal(document.getElementById('packageModal'));

  $(document).on('click', '.package-item', function () {
    const id  = parseInt($(this).data('id'));
    const pkg = allPackages.find(p => p.id === id);
    if (!pkg) return;

    // Populate modal
    $('#modalTitle').text(pkg.title);
    $('#modalSource').html('<i class="bi bi-collection me-1"></i>' + pkg.sumber + ' &nbsp;·&nbsp; <i class="bi bi-globe me-1"></i>' + pkg.kategori);
    $('#modalJenjang').text(pkg.jenjang);
    $('#modalTahun').text(pkg.tahun);
    $('#modalJumlahSoal').text(pkg.jumlah_soal + ' soal');
    $('#modalUkuran').text(pkg.ukuran);
    $('#modalKategori').text(pkg.kategori);
    $('#modalDeskripsi').text(pkg.deskripsi);
    $('#modalDownloadBtn').attr('href', pkg.file).attr('download', '');

    modal.show();
  });

});