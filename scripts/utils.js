/**
 * SHARED UTILITIES — Used across all pages
 */
(function(window) {
  'use strict';

  // ── Deployment base path ──
  // This site is deployed as a GitHub Pages PROJECT site at /Buds-Collectibles/.
  // If you ever rename the repo to <username>.github.io (root hosting) or add a
  // custom domain, change this one line to '' and the whole site adjusts —
  // no need to touch individual JSON entries.
  const BASE_PATH = '/Buds-Collectibles';

  // ── Resolve a path from JSON data (e.g. an inventory item's "image" field)
  // against the deployment base path. Authors can keep writing simple
  // root-style paths like "/images/inventory/foo.jpg" in the JSON files;
  // this is the single place that adapts them to wherever the site is hosted.
  function imgSrc(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path; // external URL, leave as-is
    if (path.startsWith(BASE_PATH + '/')) return path; // already prefixed
    if (path.startsWith('/')) return BASE_PATH + path;
    return path;
  }

  // ── Format currency ──
  function formatPrice(num) {
    if (num === null || num === undefined) return 'N/A';
    return '$' + Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ── Format date ──
  function formatDate(dateStr, opts) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const options = opts || { month: 'long', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  // ── Format date short ──
  function formatDateShort(dateStr) {
    return formatDate(dateStr, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Format date range ──
  function formatDateRange(start, end) {
    if (!end) return formatDateShort(start);
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
        '–' + e.getDate() + ', ' + e.getFullYear();
    }
    return formatDateShort(start) + ' – ' + formatDateShort(end);
  }

  // ── Escape HTML ──
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Category badge HTML ──
  function categoryBadge(cat) {
    const labels = {
      pokemon: 'Pokémon', magic: 'Magic', yugioh: 'Yu-Gi-Oh!',
      onepiece: 'One Piece', lorcana: 'Lorcana', sports: 'Sports', other: 'Other'
    };
    const label = labels[cat] || cat;
    return `<span class="badge badge-${escapeHtml(cat)}">${escapeHtml(label)}</span>`;
  }

  // ── Type badge HTML ──
  function typeBadge(type) {
    const icons = { single: '🃏', sealed: '📦', graded: '🏅' };
    return `<span class="badge badge-${escapeHtml(type)}">${icons[type] || ''} ${escapeHtml(type)}</span>`;
  }

  // ── Condition label ──
  function conditionLabel(cond) {
    const labels = {
      'mint': 'M', 'near-mint': 'NM', 'lightly-played': 'LP',
      'moderately-played': 'MP', 'heavily-played': 'HP', 'damaged': 'DMG'
    };
    return labels[cond] || cond;
  }

  // ── Stars HTML ──
  function starsHtml(rating) {
    const filled = Math.round(rating || 0);
    return '<span class="stars" aria-label="' + filled + ' out of 5 stars">' +
      '★'.repeat(filled) + '☆'.repeat(5 - filled) + '</span>';
  }

  // ── Show toast notification ──
  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--color-success)' :
      type === 'error' ? 'var(--color-danger)' : 'var(--accent-primary)';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
  }

  // ── Get URL param ──
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ── Debounce ──
  function debounce(fn, delay) {
    let t;
    return function() {
      clearTimeout(t);
      t = setTimeout(fn.apply.bind(fn, this, arguments), delay);
    };
  }

  // ── Lazy-load images with IntersectionObserver ──
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('img[data-src]').forEach(function(img) {
        img.src = img.dataset.src;
      });
      return;
    }
    const obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('img[data-src]').forEach(function(img) { obs.observe(img); });
  }

  // ── Render skeleton cards ──
  function renderSkeletons(container, count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<div class="card" style="overflow:hidden"><div class="skeleton" style="height:200px"></div><div class="card-body"><div class="skeleton" style="height:1rem;width:60%;margin-bottom:.5rem"></div><div class="skeleton" style="height:.75rem;width:40%"></div></div></div>';
    }
    container.innerHTML = html;
  }

  // ── Export ──
  window.BudsUtils = {
    formatPrice, formatDate, formatDateShort, formatDateRange,
    escapeHtml, categoryBadge, typeBadge, conditionLabel,
    starsHtml, showToast, getParam, debounce, initLazyImages, renderSkeletons,
    BASE_PATH, imgSrc
  };

  // ── Init lazy images on load ──
  document.addEventListener('DOMContentLoaded', initLazyImages);

})(window);
