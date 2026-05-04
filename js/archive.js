/* ============================================================
   archive.js — Zetpack
   JS khusus halaman Archive (archive.html)
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

  // ── Constants ──
  const PAGE_SIZE = 20;

  // ── State ──
  let allPackages  = [];
  let activeJenjang = 'Semua';
  let activeSumber  = 'Semua';
  let searchQuery   = '';
  let sortOrder     = 'newest';   // 'newest' | 'oldest'
  let currentPage   = 1;

  // ── Helpers ──
  function formatDate(dateStr) {
    // dateStr: "YYYY-MM-DD"
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  }

  // ── Fetch Data ──
  $.getJSON('data/packages.json', function (data) {
    allPackages = data.packages;
    updateFilterCounts();
    renderAll();
  });

  // ── Filter + Sort Logic ──
  function getFiltered() {
    let result = allPackages.filter(function (p) {
      const matchJenjang = activeJenjang === 'Semua' || p.jenjang === activeJenjang;
      const matchSumber  = activeSumber  === 'Semua' || p.sumber  === activeSumber;
      const matchSearch  = searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery) ||
        p.sumber.toLowerCase().includes(searchQuery) ||
        String(p.tahun).includes(searchQuery);
      return matchJenjang && matchSumber && matchSearch;
    });

    // Sort by tgl_upload
    result.sort(function (a, b) {
      const da = new Date(a.tgl_upload);
      const db = new Date(b.tgl_upload);
      return sortOrder === 'newest' ? db - da : da - db;
    });

    return result;
  }

  // ── Update filter counts ──
  function updateFilterCounts() {
    ['SD', 'SMP', 'SMA', 'Mahasiswa'].forEach(function (j) {
      const count = allPackages.filter(p => p.jenjang === j).length;
      $('[data-jenjang="' + j + '"] .filter-count').text(count);
    });

    ['UTBK SNBT', 'SIMAK UI', 'OSNK Matematika', 'OSN Matematika', 'SAT'].forEach(function (s) {
      const count = allPackages.filter(p => p.sumber === s).length;
      $('[data-sumber="' + s + '"] .filter-count').text(count);
    });

    $('[data-jenjang="Semua"] .filter-count').text(allPackages.length);
    $('[data-sumber="Semua"] .filter-count').text(allPackages.length);
  }

  // ── Render all (list + pagination) ──
  function renderAll() {
    const filtered   = getFiltered();
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    // Clamp currentPage
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, totalItems);
    const pageItems = filtered.slice(start, end);

    renderMeta(totalItems, start, end);
    renderList(pageItems);
    renderPagination(totalPages, totalItems, start, end);
  }

  // ── Render result meta ──
  function renderMeta(total, start, end) {
    const $count = $('#resultCount');
    const $tags  = $('#activeTags');

    $tags.empty();

    if (total === 0) {
      $count.html('<span>0</span> paket soal ditemukan');
    } else {
      $count.html('Menampilkan <span>' + (start + 1) + '–' + end + '</span> dari <span>' + total + '</span> paket soal');
    }

    if (activeJenjang !== 'Semua') {
      $tags.append('<span class="filter-tag"><i class="bi bi-mortarboard"></i> ' + activeJenjang + '</span>');
    }
    if (activeSumber !== 'Semua') {
      $tags.append('<span class="filter-tag"><i class="bi bi-collection"></i> ' + activeSumber + '</span>');
    }
    if (searchQuery !== '') {
      $tags.append('<span class="filter-tag"><i class="bi bi-search"></i> "' + searchQuery + '"</span>');
    }
  }

  // ── Render package list ──
  function renderList(items) {
    const $list  = $('#packageList');
    const $empty = $('#emptyState');

    $list.empty();

    if (items.length === 0) {
      $list.hide();
      $empty.show();
      return;
    }

    $empty.hide();
    $list.show();

    items.forEach(function (p) {
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
              <span class="package-meta-tag"><i class="bi bi-upload"></i>${formatDate(p.tgl_upload)}</span>
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

  // ── Render pagination ──
  function renderPagination(totalPages, totalItems, start, end) {
    const $wrap = $('#paginationWrap');
    $wrap.empty();

    if (totalItems === 0) return;

    // Info text
    const $info = $('<p class="pagination-info mb-0"></p>');
    $info.html('Halaman <span>' + currentPage + '</span> dari <span>' + totalPages + '</span>');

    // Controls
    const $controls = $('<div class="pagination-controls"></div>');

    // Prev button
    const $prev = $('<button class="page-btn" title="Sebelumnya"><i class="bi bi-chevron-left"></i></button>');
    if (currentPage <= 1) $prev.prop('disabled', true);
    $prev.on('click', function () {
      if (currentPage > 1) { currentPage--; renderAll(); scrollToTop(); }
    });
    $controls.append($prev);

    // Page number buttons with ellipsis logic
    const pages = buildPageNumbers(currentPage, totalPages);
    pages.forEach(function (p) {
      if (p === '...') {
        $controls.append('<span class="page-btn ellipsis">…</span>');
      } else {
        const $btn = $('<button class="page-btn">' + p + '</button>');
        if (p === currentPage) $btn.addClass('active');
        $btn.on('click', function () {
          currentPage = p;
          renderAll();
          scrollToTop();
        });
        $controls.append($btn);
      }
    });

    // Next button
    const $next = $('<button class="page-btn" title="Berikutnya"><i class="bi bi-chevron-right"></i></button>');
    if (currentPage >= totalPages) $next.prop('disabled', true);
    $next.on('click', function () {
      if (currentPage < totalPages) { currentPage++; renderAll(); scrollToTop(); }
    });
    $controls.append($next);

    $wrap.append($info, $controls);
  }

  // ── Build page number array dengan ellipsis ──
  function buildPageNumbers(current, total) {
    if (total <= 7) {
      // Show all pages
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    // Always show first, last, current, and neighbors
    const neighbors = 1; // pages on each side of current

    const left  = Math.max(2, current - neighbors);
    const right = Math.min(total - 1, current + neighbors);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('...');
    pages.push(total);

    return pages;
  }

  // ── Scroll to top of content ──
  function scrollToTop() {
    $('html, body').animate({ scrollTop: $('.archive-content').offset().top - 80 }, 200);
  }

  // ── Reset page on filter/search change ──
  function resetAndRender() {
    currentPage = 1;
    renderAll();
  }

  // ── Event: Filter Jenjang ──
  $(document).on('change', 'input[name="filterJenjang"]', function () {
    activeJenjang = $(this).val();
    resetAndRender();
  });

  // ── Event: Filter Sumber ──
  $(document).on('change', 'input[name="filterSumber"]', function () {
    activeSumber = $(this).val();
    resetAndRender();
  });

  // ── Event: Search ──
  $('#searchInput').on('input', function () {
    searchQuery = $(this).val().trim().toLowerCase();
    resetAndRender();
  });

  // ── Event: Sort ──
  $('#sortSelect').on('change', function () {
    sortOrder = $(this).val();
    currentPage = 1;
    renderAll();
  });

  // ── Event: Mobile Sidebar Toggle ──
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

    $('#modalTitle').text(pkg.title);
    $('#modalSource').html('<i class="bi bi-collection me-1"></i>' + pkg.sumber + ' &nbsp;·&nbsp; <i class="bi bi-globe me-1"></i>' + pkg.kategori);
    $('#modalJenjang').text(pkg.jenjang);
    $('#modalTahun').text(pkg.tahun);
    $('#modalJumlahSoal').text(pkg.jumlah_soal + ' soal');
    $('#modalUkuran').text(pkg.ukuran);
    $('#modalKategori').text(pkg.kategori);
    $('#modalTglUpload').text(formatDate(pkg.tgl_upload));
    $('#modalDeskripsi').text(pkg.deskripsi);
    $('#modalDownloadBtn').attr('href', pkg.file).attr('download', '');

    modal.show();
  });

});