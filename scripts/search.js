/**
 * SEARCH ENGINE — Client-side search using in-memory index
 * Searches inventory, shows, and page content
 * Uses a simple but fast custom implementation (no dependencies)
 */
(function() {
  'use strict';

  let searchIndex = null;
  let searchData = [];
  let searchLoaded = false;

  const searchToggle = document.getElementById('search-toggle');
  const navSearch = document.getElementById('nav-search');
  const searchInput = document.getElementById('global-search');
  const searchResults = document.getElementById('search-results');

  if (!searchToggle || !navSearch || !searchInput) return;

  // ── Toggle Search Panel ──
  searchToggle.addEventListener('click', function() {
    const isHidden = navSearch.hidden;
    navSearch.hidden = !isHidden;
    if (!isHidden) {
      searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '';
    } else {
      searchInput.focus();
      if (!searchLoaded) loadSearchData();
    }
  });

  // ── Close on ESC ──
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !navSearch.hidden) {
      navSearch.hidden = true;
      searchToggle.focus();
    }
  });

  // ── Load Search Data ──
  async function loadSearchData() {
    if (searchLoaded) return;
    searchLoaded = true;

    try {
      const [inventoryRes, showsRes] = await Promise.all([
        fetch('/Buds-Collectibles/data/inventory.json').catch(() => null),
        fetch('/Buds-Collectibles/data/shows.json').catch(() => null)
      ]);

      if (inventoryRes && inventoryRes.ok) {
        const data = await inventoryRes.json();
        data.items.filter(i => !i.sold).forEach(item => {
          searchData.push({
            type: 'inventory',
            title: item.name,
            subtitle: item.set + ' · ' + item.category,
            url: '/Buds-Collectibles/inventory/?search=' + encodeURIComponent(item.name),
            keywords: [item.name, item.set, item.category, item.type, ...(item.tags || [])].join(' ').toLowerCase()
          });
        });
      }

      if (showsRes && showsRes.ok) {
        const data = await showsRes.json();
        data.shows.forEach(show => {
          searchData.push({
            type: 'show',
            title: show.name,
            subtitle: show.city + ', ' + show.state + ' · ' + formatDate(show.date),
            url: '/Buds-Collectibles/shows/?event=' + show.id,
            keywords: [show.name, show.city, show.state, show.venue, show.status].join(' ').toLowerCase()
          });
        });
      }

      // Static pages
      const pages = [
        { title: "Buy, Sell & Trade", subtitle: "How to buy, sell, or trade cards with Bud", url: "/Buds-Collectibles/buy-sell-trade/", keywords: "buy sell trade shipping payment" },
        { title: "Inventory", subtitle: "Browse all available cards and sealed product", url: "/Buds-Collectibles/inventory/", keywords: "inventory cards pokemon magic yugioh singles sealed graded" },
        { title: "Show Schedule", subtitle: "Upcoming card show appearances", url: "/Buds-Collectibles/shows/", keywords: "shows events schedule calendar" },
        { title: "Vendor Info", subtitle: "About Bud's vendor setup and background", url: "/Buds-Collectibles/vendor/", keywords: "vendor about story mission testimonials" },
        { title: "Contact", subtitle: "Get in touch with Bud's Collectibles", url: "/Buds-Collectibles/contact/", keywords: "contact email message inquiry" },
        { title: "QR Hub", subtitle: "Card show companion page", url: "/Buds-Collectibles/qr/", keywords: "qr code show social links" },
      ];
      pages.forEach(p => {
        searchData.push({ type: 'page', ...p });
      });

    } catch (err) {
      console.error('Search data load error:', err);
    }
  }

  // ── Search Input Handler ──
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
      performSearch(searchInput.value.trim());
    }, 200);
  });

  function performSearch(query) {
    if (!searchResults) return;
    if (!query || query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = searchData
      .map(item => {
        let score = 0;
        terms.forEach(term => {
          if (item.title.toLowerCase().includes(term)) score += 10;
          if (item.subtitle && item.subtitle.toLowerCase().includes(term)) score += 5;
          if (item.keywords && item.keywords.includes(term)) score += 3;
        });
        return { ...item, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (results.length === 0) {
      searchResults.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;padding:.5rem 0">No results for "' + escapeHtml(query) + '"</p>';
      return;
    }

    searchResults.innerHTML = results.map(r => `
      <a href="${r.url}" class="search-result-item">
        <span class="search-result-icon">${typeIcon(r.type)}</span>
        <span>
          <span class="search-result-title">${highlight(r.title, terms)}</span>
          <span class="search-result-type">${r.subtitle || r.type}</span>
        </span>
      </a>
    `).join('');
  }

  function typeIcon(type) {
    const icons = { inventory: '📦', show: '📅', page: '📄' };
    return icons[type] || '🔍';
  }

  function highlight(text, terms) {
    let result = escapeHtml(text);
    terms.forEach(term => {
      const regex = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      result = result.replace(regex, '<mark style="background:var(--accent-primary-dim);color:var(--accent-primary);border-radius:2px;padding:0 2px">$1</mark>');
    });
    return result;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

})();
