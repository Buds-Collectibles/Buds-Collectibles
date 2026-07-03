/**
 * HOME PAGE — Dynamic content loader
 */
document.addEventListener('DOMContentLoaded', async function() {
  'use strict';
  const U = window.BudsUtils;
  if (!U) return;

  // ── Floating card decoration ──
  initFloatingCards();

  // ── Load all data in parallel ──
  try {
    const [invRes, showsRes, testRes] = await Promise.all([
      fetch('/Buds-Collectibles/data/inventory.json').catch(() => null),
      fetch('/Buds-Collectibles/data/shows.json').catch(() => null),
      fetch('/Buds-Collectibles/data/testimonials.json').catch(() => null)
    ]);

    const invData   = invRes   && invRes.ok   ? await invRes.json()   : null;
    const showsData = showsRes && showsRes.ok ? await showsRes.json() : null;
    const testData  = testRes  && testRes.ok  ? await testRes.json()  : null;

    if (invData)   renderFeaturedInventory(invData.items || []);
    if (showsData) renderUpcomingShows(showsData.shows || []);
    if (invData)   renderTicker(invData.items || []);
    if (testData)  renderTestimonials(testData.testimonials || []);

    // Update hero stats
    if (invData) {
      const available = (invData.items || []).filter(i => !i.sold);
      const countEl = document.getElementById('hero-inv-count');
      if (countEl) animateCount(countEl, available.length);
    }
    if (showsData) {
      const thisYear = new Date().getFullYear();
      const yearShows = (showsData.shows || []).filter(s => new Date(s.date).getFullYear() === thisYear);
      const showCountEl = document.getElementById('hero-show-count');
      if (showCountEl) animateCount(showCountEl, yearShows.length);
    }
  } catch (err) {
    console.error('Home page data load error:', err);
  }
});

// ── Render Featured Inventory ──
function renderFeaturedInventory(items) {
  const container = document.getElementById('featured-inventory');
  if (!container) return;
  const U = window.BudsUtils;

  const featured = items.filter(i => i.featured && !i.sold).slice(0, 4);
  if (featured.length === 0) {
    container.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1;padding:2rem">No featured items right now — check back soon!</p>';
    return;
  }

  container.innerHTML = featured.map(item => {
    const catEmoji = { pokemon:'⚡', magic:'🔮', yugioh:'🐉', onepiece:'☠️', lorcana:'✨', sports:'🏆', other:'🃏' };
    const emoji = catEmoji[item.category] || '🃏';
    return `
      <div class="inventory-card ${item.featured ? 'card-featured' : ''}">
        <div class="inventory-card-img">
          ${item.image
            ? `<img data-src="${U.escapeHtml(U.imgSrc(item.image))}" src="/Buds-Collectibles/images/placeholder.svg" alt="${U.escapeHtml(item.name)}" loading="lazy" />`
            : `<div class="inventory-card-img-placeholder">${emoji}</div>`
          }
          <div class="inventory-card-badges">
            ${U.categoryBadge(item.category)}
            ${U.typeBadge(item.type)}
          </div>
        </div>
        <div class="inventory-card-body">
          <div class="inventory-card-name">${U.escapeHtml(item.name)}</div>
          <div class="inventory-card-set">${U.escapeHtml(item.set || '')}</div>
          ${item.gradeScore ? `<div style="font-size:.8rem;color:var(--color-info);font-family:var(--font-mono)">${U.escapeHtml(item.gradeCompany || 'GRADED')} ${U.escapeHtml(item.gradeScore)}</div>` : ''}
          <div class="inventory-card-footer">
            <div>
              <div class="price-tag">${U.formatPrice(item.price)}</div>
              ${item.priceNegotiable ? `<div class="price-negotiable">OBO</div>` : ''}
            </div>
            <div class="inventory-card-condition">${U.conditionLabel(item.condition)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Re-init lazy images
  if (U.initLazyImages) U.initLazyImages();
}

// ── Render Upcoming Shows ──
function renderUpcomingShows(shows) {
  const container = document.getElementById('upcoming-shows-list');
  if (!container) return;
  const U = window.BudsUtils;

  const upcoming = shows
    .filter(s => s.status === 'upcoming')
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><p>No upcoming shows scheduled yet. Check back soon!</p></div>`;
    return;
  }

  container.innerHTML = upcoming.map(show => {
    const d = new Date(show.date + 'T00:00:00');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();

    return `
      <a href="/Buds-Collectibles/shows/?event=${U.escapeHtml(show.id)}" class="show-preview-card ${show.featured ? 'featured-show' : ''}">
        <div class="show-date-block">
          <span class="show-date-month">${month}</span>
          <span class="show-date-day">${day}</span>
        </div>
        <div class="show-preview-info">
          <div class="show-preview-name">${U.escapeHtml(show.name)}</div>
          <div class="show-preview-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${U.escapeHtml(show.venue)} · ${U.escapeHtml(show.city)}, ${U.escapeHtml(show.state)}
          </div>
          <div class="show-preview-meta">
            ${show.dateEnd ? U.formatDateRange(show.date, show.dateEnd) : U.formatDateShort(show.date)}
            ${show.timeOpen ? ' · ' + show.timeOpen : ''}
            ${show.tableNumber ? ' · Table ' + U.escapeHtml(show.tableNumber) : ''}
          </div>
        </div>
        <div class="show-preview-actions">
          <span class="badge badge-upcoming">Upcoming</span>
          ${show.featured ? `<span class="badge" style="background:var(--accent-primary-dim);color:var(--accent-primary);border:1px solid var(--accent-primary)">★ Featured</span>` : ''}
        </div>
      </a>
    `;
  }).join('');
}

// ── Render Ticker ──
function renderTicker(items) {
  const ticker = document.getElementById('recent-ticker');
  if (!ticker) return;
  const U = window.BudsUtils;

  const recent = [...items]
    .filter(i => !i.sold)
    .sort((a,b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, 10);

  if (recent.length === 0) {
    ticker.closest('.recent-additions-section').style.display = 'none';
    return;
  }

  // Double the items for seamless loop
  const allItems = [...recent, ...recent];
  ticker.innerHTML = allItems.map(item => `
    <span class="ticker-item">
      <span class="ticker-item-dot"></span>
      ${U.escapeHtml(item.name)}
      <span style="color:var(--accent-primary);font-weight:600">${U.formatPrice(item.price)}</span>
    </span>
  `).join('');
}

// ── Render Testimonials ──
function renderTestimonials(testimonials) {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;
  const U = window.BudsUtils;

  const featured = testimonials.filter(t => t.featured).slice(0, 3);
  const toShow = featured.length > 0 ? featured : testimonials.slice(0, 3);

  if (toShow.length === 0) {
    container.closest('section').style.display = 'none';
    return;
  }

  container.innerHTML = toShow.map(t => {
    const initials = t.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    return `
      <div class="testimonial-card">
        <div class="testimonial-quote">"</div>
        <p class="testimonial-text">${U.escapeHtml(t.text)}</p>
        <div class="testimonial-footer">
          <div class="testimonial-avatar">${initials}</div>
          <div>
            <div class="testimonial-meta-name">${U.escapeHtml(t.name)}</div>
            <div class="testimonial-meta-loc">${U.escapeHtml(t.location || '')} · ${U.starsHtml(t.rating)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Animate counter ──
function animateCount(el, target) {
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(function() {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}

// ── Floating cards decoration ──
function initFloatingCards() {
  const container = document.getElementById('hero-cards');
  if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (let i = 0; i < 8; i++) {
    const card = document.createElement('div');
    card.className = 'hero-card-deco';
    const x = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = 12 + Math.random() * 10;
    const rot = -20 + Math.random() * 40;
    card.style.cssText = `left:${x}%;bottom:-100px;--rot:${rot}deg;animation-duration:${duration}s;animation-delay:${delay}s`;
    container.appendChild(card);
  }
}
