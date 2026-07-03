/**
 * QR HUB PAGE — Detect if there's a show today/this weekend and surface it
 */
document.addEventListener('DOMContentLoaded', async function() {
  'use strict';

  try {
    const res = await fetch('/Buds-Collectibles/data/shows.json');
    if (!res.ok) return;
    const data = await res.json();
    const shows = data.shows || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find a show happening today or within its date range
    const activeShow = shows.find(show => {
      const start = new Date(show.date + 'T00:00:00');
      const end = show.dateEnd ? new Date(show.dateEnd + 'T00:00:00') : start;
      return today >= start && today <= end;
    });

    if (activeShow) {
      const card = document.getElementById('qr-today-card');
      const nameEl = document.getElementById('qr-today-name');
      const metaEl = document.getElementById('qr-today-meta');

      if (card && nameEl && metaEl) {
        nameEl.textContent = activeShow.name;
        metaEl.textContent = `${activeShow.venue} · Table ${activeShow.tableNumber || 'TBD'}`;
        card.hidden = false;
      }
    }
  } catch (err) {
    console.error('QR hub show check error:', err);
  }
});
