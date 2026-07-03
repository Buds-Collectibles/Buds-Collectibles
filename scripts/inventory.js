/**
 * INVENTORY PAGE — Client-side search, filter, sort, modal
 */
document.addEventListener('DOMContentLoaded', async function() {
  'use strict';
  const U = window.BudsUtils;
  if (!U) return;

  let allItems = [];
  let filtered = [];
  let currentCat = 'all';
  let currentType = 'all';
  let currentSort = 'newest';
  let currentSearch = '';
  let isListView = false;
  const PAGE_SIZE = 24;
  let visibleCount = PAGE_SIZE;

  const grid = document.getElementById('inventory-grid');
  const noResults = document.getElementById('inv-no-results');
  const resultsCount = document.getElementById('inv-results-count');
  const clearBtn = document.getElementById('clear-filters');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadMoreWrap = document.getElementById('inv-load-more');

  // ── Apply URL params ──
  const params = new URLSearchParams(window.location.search);
  if (params.get('cat')) currentCat = params.get('cat');
  if (params.get('type')) currentType = params.get('type');
  if (params.get('search')) currentSearch = params.get('search');

  // ── Render skeletons while loading ──
  if (grid) U.renderSkeletons(grid, 8);

  // ── Load inventory ──
  try {
    const res = await fetch('/Buds-Collectibles/data/inventory.json');
    if (!res.ok) throw new Error('Failed to load inventory');
    const data = await res.json();
    allItems = (data.items || []).filter(i => !i.sold);
    updateStats(allItems);
    applyFilters();
    syncFilterUI();
    if (currentSearch) {
      const searchEl = document.getElementById('inv-search');
      if (searchEl) searchEl.value = currentSearch;
    }
  } catch (err) {
    if (grid) grid.innerHTML = '<p class="text-center text-muted" style="grid-column:1/-1;padding:3rem">Failed to load inventory. Please refresh.</p>';
    console.error(err);
  }

  // ── Stats ──
  function updateStats(items) {
    const avail = items.filter(i => !i.sold);
    setEl('stat-total',   avail.length);
    setEl('stat-singles', avail.filter(i => i.type === 'single').length);
    setEl('stat-sealed',  avail.filter(i => i.type === 'sealed').length);
    setEl('stat-graded',  avail.filter(i => i.type === 'graded').length);
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Filter + Sort + Search ──
  function applyFilters() {
    filtered = allItems.filter(item => {
      const catMatch = currentCat === 'all' || item.category === currentCat;
      const typeMatch = currentType === 'all' || item.type === currentType;
      const searchMatch = !currentSearch || matchesSearch(item, currentSearch.toLowerCase());
      return catMatch && typeMatch && searchMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      if (currentSort === 'newest')     return new Date(b.dateAdded) - new Date(a.dateAdded);
      if (currentSort === 'price-asc')  return (a.price||0) - (b.price||0);
      if (currentSort === 'price-desc') return (b.price||0) - (a.price||0);
      if (currentSort === 'alpha')      return a.name.localeCompare(b.name);
      return 0;
    });

    visibleCount = PAGE_SIZE;
    renderItems();
    updateResultsUI();
  }

  function matchesSearch(item, query) {
    const fields = [item.name, item.set, item.category, item.type, ...(item.tags || [])];
    return fields.some(f => f && f.toLowerCase().includes(query));
  }

  function renderItems() {
    if (!grid) return;
    const slice = filtered.slice(0, visibleCount);

    if (slice.length === 0) {
      grid.innerHTML = '';
      if (noResults) noResults.hidden = false;
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    if (noResults) noResults.hidden = true;

    const catEmoji = { pokemon:'⚡', magic:'🔮', yugioh:'🐉', onepiece:'☠️', lorcana:'✨', sports:'🏆', other:'🃏' };

    grid.innerHTML = slice.map(item => {
      const emoji = catEmoji[item.category] || '🃏';
      return `
        <div class="inv-item ${item.featured ? 'featured-item' : ''}" tabindex="0" role="listitem"
             onclick="openModal('${U.escapeHtml(item.id)}')" onkeydown="if(event.key==='Enter')openModal('${U.escapeHtml(item.id)}')">
          ${item.featured ? '<div class="inv-item-featured-badge">★ Featured</div>' : ''}
          <div class="inv-item-img">
            ${item.image
              ? `<img data-src="${U.escapeHtml(U.imgSrc(item.image))}" src="/Buds-Collectibles/images/placeholder.svg" alt="${U.escapeHtml(item.name)}" />`
              : `<div class="inv-item-img-placeholder">${emoji}</div>`}
            <div class="inv-item-badges">
              ${U.categoryBadge(item.category)}
            </div>
          </div>
          <div class="inv-item-body">
            <div class="inv-item-name">${U.escapeHtml(item.name)}</div>
            <div class="inv-item-set">${U.escapeHtml(item.set || '')}</div>
            ${item.gradeScore ? `<div class="inv-item-grade">${U.escapeHtml(item.gradeCompany||'GRADED')} ${U.escapeHtml(item.gradeScore)}</div>` : ''}
            <div class="inv-item-footer">
              <div>
                <div class="inv-item-price">${U.formatPrice(item.price)}</div>
                ${item.priceNegotiable ? '<div class="inv-item-obo">OBO</div>' : ''}
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                ${U.typeBadge(item.type)}
                <div class="inv-item-cond">${U.conditionLabel(item.condition)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Apply list view class
    if (isListView) grid.classList.add('list-view');
    else grid.classList.remove('list-view');

    // Load more button
    if (loadMoreWrap) {
      loadMoreWrap.style.display = filtered.length > visibleCount ? 'block' : 'none';
    }

    U.initLazyImages();
  }

  function updateResultsUI() {
    if (resultsCount) {
      resultsCount.textContent = `Showing ${Math.min(filtered.length, visibleCount)} of ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
    }
    const hasFilters = currentCat !== 'all' || currentType !== 'all' || currentSearch;
    if (clearBtn) clearBtn.style.display = hasFilters ? 'inline-flex' : 'none';
  }

  // ── Sync filter chips to URL params ──
  function syncFilterUI() {
    document.querySelectorAll('[data-cat]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === currentCat);
    });
    document.querySelectorAll('[data-type]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === currentType);
    });
    const sortEl = document.getElementById('inv-sort');
    if (sortEl) sortEl.value = currentSort;
  }

  // ── Event Listeners ──
  const catFilters = document.getElementById('cat-filters');
  if (catFilters) {
    catFilters.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      currentCat = btn.dataset.cat;
      updateUrlParam('cat', currentCat === 'all' ? null : currentCat);
      syncFilterUI();
      applyFilters();
    });
  }

  const typeFilters = document.getElementById('type-filters');
  if (typeFilters) {
    typeFilters.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      currentType = btn.dataset.type;
      updateUrlParam('type', currentType === 'all' ? null : currentType);
      syncFilterUI();
      applyFilters();
    });
  }

  const sortEl = document.getElementById('inv-sort');
  if (sortEl) {
    sortEl.addEventListener('change', function() {
      currentSort = this.value;
      applyFilters();
    });
  }

  const searchEl = document.getElementById('inv-search');
  if (searchEl) {
    searchEl.addEventListener('input', U.debounce(function() {
      currentSearch = this.value.trim();
      updateUrlParam('search', currentSearch || null);
      applyFilters();
    }, 250));
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      currentCat = 'all'; currentType = 'all'; currentSearch = '';
      if (searchEl) searchEl.value = '';
      window.history.replaceState({}, '', window.location.pathname);
      syncFilterUI();
      applyFilters();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      visibleCount += PAGE_SIZE;
      renderItems();
      updateResultsUI();
    });
  }

  // View toggle
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');
  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', function() {
      isListView = false;
      gridBtn.classList.add('active'); listBtn.classList.remove('active');
      renderItems();
    });
    listBtn.addEventListener('click', function() {
      isListView = true;
      listBtn.classList.add('active'); gridBtn.classList.remove('active');
      renderItems();
    });
  }

  // ── URL param helper ──
  function updateUrlParam(key, value) {
    const url = new URL(window.location);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
  }

  // ── Modal ──
  window.openModal = function(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('item-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    const catEmoji = { pokemon:'⚡', magic:'🔮', yugioh:'🐉', onepiece:'☠️', lorcana:'✨', sports:'🏆', other:'🃏' };
    const emoji = catEmoji[item.category] || '🃏';

    content.innerHTML = `
      ${item.image
        ? `<img class="modal-img" src="${U.escapeHtml(U.imgSrc(item.image))}" alt="${U.escapeHtml(item.name)}" />`
        : `<div class="modal-img-placeholder">${emoji}</div>`}
      <div class="modal-body">
        <div class="modal-badges">
          ${U.categoryBadge(item.category)}
          ${U.typeBadge(item.type)}
          ${item.featured ? '<span class="badge" style="background:var(--accent-primary-dim);color:var(--accent-primary);border:1px solid var(--accent-primary)">★ Featured</span>' : ''}
        </div>
        <h2 class="modal-title" id="modal-title">${U.escapeHtml(item.name)}</h2>
        <div class="modal-set">${U.escapeHtml(item.set || '')} ${item.language ? '· ' + U.escapeHtml(item.language) : ''}</div>
        ${item.description ? `<p class="modal-desc">${U.escapeHtml(item.description)}</p>` : ''}
        <div class="modal-details">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Condition</span>
            <span class="modal-detail-value">${U.escapeHtml(item.condition || 'N/A')}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Quantity</span>
            <span class="modal-detail-value">${item.quantity || 1} available</span>
          </div>
          ${item.gradeCompany ? `
          <div class="modal-detail-item">
            <span class="modal-detail-label">Grading Co.</span>
            <span class="modal-detail-value">${U.escapeHtml(item.gradeCompany)}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Grade</span>
            <span class="modal-detail-value" style="color:var(--color-info);font-weight:700">${U.escapeHtml(item.gradeScore || '')}</span>
          </div>` : ''}
          ${item.certNumber ? `
          <div class="modal-detail-item">
            <span class="modal-detail-label">Cert #</span>
            <span class="modal-detail-value">${U.escapeHtml(item.certNumber)}</span>
          </div>` : ''}
          <div class="modal-detail-item">
            <span class="modal-detail-label">Added</span>
            <span class="modal-detail-value">${U.formatDateShort(item.dateAdded)}</span>
          </div>
        </div>
        ${item.tags && item.tags.length ? `
        <div class="inv-tags">
          ${item.tags.map(t => `<span class="inv-tag">${U.escapeHtml(t)}</span>`).join('')}
        </div>` : ''}
        <div class="modal-price-row">
          <div>
            <div class="modal-price">${U.formatPrice(item.price)}</div>
            ${item.priceNegotiable ? '<div style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted)">Or Best Offer</div>' : ''}
          </div>
          <div class="modal-actions">
            <a href="/Buds-Collectibles/contact/?inquiry=${encodeURIComponent(item.name)}" class="btn btn-primary">
              Inquire About This Item
            </a>
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.focus();
  };

  window.closeModal = function() {
    const modal = document.getElementById('item-modal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  };

  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', window.closeModal);

  const modalOverlay = document.getElementById('item-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) window.closeModal();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeModal();
  });

});
