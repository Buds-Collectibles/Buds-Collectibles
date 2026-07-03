/**
 * SHOWS PAGE — Loads events from JSON, renders upcoming/past, countdown timer
 */
document.addEventListener('DOMContentLoaded', async function () {
  'use strict';
  const U = window.BudsUtils;
  if (!U) return;

  let allShows = [];

  try {
    const res = await fetch('/Buds-Collectibles/data/shows.json');
    if (!res.ok) throw new Error('Failed to load shows');
    const data = await res.json();
    allShows = data.shows || [];

    const upcoming = allShows
      .filter(s => s.status === 'upcoming')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const past = allShows
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    renderNextShowBanner(upcoming[0] || null);
    renderShows('upcoming-shows', upcoming, false);
    renderShows('past-shows', past, true);

    // If URL has ?event=id, auto-expand that card
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    if (eventId) {
      setTimeout(function () {
        const card = document.querySelector(`[data-show-id="${eventId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const btn = card.querySelector('.show-expand-btn');
          if (btn) btn.click();
        }
      }, 300);
    }

  } catch (err) {
    console.error('Shows load error:', err);
    ['upcoming-shows', 'past-shows'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="text-muted text-center">Failed to load shows data. Please refresh.</p>';
    });
  }

  // ── Next Show Banner ──
  function renderNextShowBanner(show) {
    const banner = document.getElementById('next-show-banner');
    const inner = document.getElementById('next-show-inner');
    if (!banner || !inner) return;

    if (!show) {
      banner.style.display = 'none';
      return;
    }

    const d = new Date(show.date + 'T00:00:00');
    const now = new Date();
    const diff = d - now;
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const mins = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

    inner.innerHTML = `
      <div>
        <div class="next-show-label">⚡ Next Show</div>
        <div class="next-show-name">${U.escapeHtml(show.name)}</div>
        <div class="next-show-meta">
          <span>📍 ${U.escapeHtml(show.city)}, ${U.escapeHtml(show.state)}</span>
          <span>📅 ${U.formatDateShort(show.date)}</span>
          ${show.tableNumber ? `<span>🪑 Table ${U.escapeHtml(show.tableNumber)}</span>` : ''}
        </div>
      </div>
      <div class="next-show-countdown" aria-label="Countdown to next show">
        <div class="countdown-block"><span class="countdown-num" id="cd-days">${days}</span><span class="countdown-label">Days</span></div>
        <div class="countdown-block"><span class="countdown-num" id="cd-hours">${hours}</span><span class="countdown-label">Hrs</span></div>
        <div class="countdown-block"><span class="countdown-num" id="cd-mins">${mins}</span><span class="countdown-label">Min</span></div>
      </div>
    `;

    // Live countdown
    setInterval(function () {
      const remaining = new Date(show.date + 'T00:00:00') - new Date();
      if (remaining <= 0) return;
      const d2 = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const h2 = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m2 = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setCD('cd-days', d2); setCD('cd-hours', h2); setCD('cd-mins', m2);
    }, 60000);
  }

  function setCD(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Render Show List ──
  function renderShows(containerId, shows, isPast) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (shows.length === 0) {
      container.innerHTML = `
        <div class="shows-empty">
          <div class="shows-empty-icon">${isPast ? '📜' : '📅'}</div>
          <h3>${isPast ? 'No past shows yet.' : 'No upcoming shows scheduled yet.'}</h3>
          <p>${isPast ? 'Check back after the first event!' : 'Follow on social media for announcements.'}</p>
        </div>`;
      return;
    }

    container.innerHTML = shows.map(show => renderShowCard(show, isPast)).join('');

    // Attach expand toggles
    container.querySelectorAll('.show-expand-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const body = this.closest('.show-card').querySelector('.show-card-body');
        const isOpen = body.classList.contains('open');
        body.classList.toggle('open', !isOpen);
        this.classList.toggle('open', !isOpen);
        this.querySelector('.show-expand-text').textContent = isOpen ? 'Details & Recap' : 'Hide Details';
      });
    });
  }

  function renderShowCard(show, isPast) {
    const d = new Date(show.date + 'T00:00:00');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();

    const statusBadge = isPast
      ? '<span class="badge badge-completed">Completed</span>'
      : '<span class="badge badge-upcoming">Upcoming</span>';

    const featuredBadge = show.featured
      ? '<span class="badge" style="background:var(--accent-primary-dim);color:var(--accent-primary);border:1px solid var(--accent-primary)">★ Featured</span>'
      : '';

    const tags = (show.tags || []).map(t =>
      `<span class="inv-tag">${U.escapeHtml(t)}</span>`
    ).join('');

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(show.address || show.venue + ' ' + show.city + ' ' + show.state)}`;

    return `
      <div class="show-card ${show.featured ? 'featured-show' : ''}" data-show-id="${U.escapeHtml(show.id)}">
        <div class="show-card-header">
          <div class="show-date-block-lg ${isPast ? 'past' : ''}">
            <span class="show-month">${month}</span>
            <span class="show-day">${day}</span>
            <span class="show-year">${year}</span>
          </div>
          <div class="show-card-info">
            <div class="show-card-badges">${statusBadge}${featuredBadge}</div>
            <div class="show-card-name">${U.escapeHtml(show.name)}</div>
            <div class="show-card-venue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${U.escapeHtml(show.venue)}, ${U.escapeHtml(show.city)}, ${U.escapeHtml(show.state)}
            </div>
            <div class="show-card-meta-row">
              ${show.dateEnd
                ? `<span class="show-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${U.formatDateRange(show.date, show.dateEnd)}</span>`
                : `<span class="show-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${U.formatDateShort(show.date)}</span>`
              }
              ${show.timeOpen ? `<span class="show-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${U.escapeHtml(show.timeOpen)}${show.timeClose ? ' – ' + show.timeClose : ''}</span>` : ''}
              ${show.tableNumber ? `<span class="show-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>Table ${U.escapeHtml(show.tableNumber)}</span>` : ''}
              ${show.admission ? `<span class="show-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>${U.escapeHtml(show.admission)}</span>` : ''}
              ${show.tableSize ? `<span class="show-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>${U.escapeHtml(show.tableSize)} table</span>` : ''}
            </div>
            ${tags ? `<div class="show-card-tags">${tags}</div>` : ''}
          </div>
          <div class="show-card-actions">
            ${!isPast && show.website ? `<a href="${U.escapeHtml(show.website)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Show Website ↗</a>` : ''}
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="show-directions-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Get Directions
            </a>
          </div>
        </div>

        ${(show.description || show.recap) ? `
          <button class="show-expand-btn" aria-expanded="false">
            <svg class="show-expand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            <span class="show-expand-text">Details &amp; Recap</span>
          </button>
          <div class="show-card-body">
            ${show.description ? `<p class="show-card-desc">${U.escapeHtml(show.description)}</p>` : ''}
            ${show.recap ? `
              <div class="show-recap">
                <div class="show-recap-label">📝 Event Recap</div>
                <div class="show-recap-text">${U.escapeHtml(show.recap)}</div>
              </div>` : ''}
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="show-directions-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Get Directions to ${U.escapeHtml(show.venue)}
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }
});
