/**
 * VENDOR PAGE — Stats, testimonials, event history, FAQ accordion
 */
document.addEventListener('DOMContentLoaded', async function() {
  'use strict';
  const U = window.BudsUtils;
  if (!U) return;

  // ── Static FAQ Data (easy to edit) ──
  const faqs = [
    {
      q: "Do you take card requests / want lists?",
      a: "Yes! If you're hunting for something specific, send a want list through the contact form or DM on Instagram. Bud actively sources inventory and will reach out if a match turns up before the next show."
    },
    {
      q: "Can I put a card on hold?",
      a: "At shows, yes — short holds (typically 15-30 minutes) are no problem if you need to grab cash or think it over. Online, holds are handled on a case-by-case basis depending on demand for the item."
    },
    {
      q: "Do you grade cards or send cards out for grading?",
      a: "Bud doesn't offer in-house grading services, but can point you toward reputable submission services (PSA, BGS, CGC, SGC) and is happy to talk through whether a card looks gradeable."
    },
    {
      q: "What if I think a price is too high?",
      a: "Most items are priced near PriceCharting value. Items marked 'OBO' (or best offer) are open to negotiation — just ask. Items without OBO are generally firm, but reasonable offers are always considered."
    },
    {
      q: "How do bulk buying offers work?",
      a: "Bring your collection (or photos/list if remote) and Bud will give an honest, same-day offer based on current market conditions. No lowballing — if a collection isn't a good fit, you'll be told why upfront rather than getting a junk offer."
    },
    {
      q: "Do you ship cards purchased at shows?",
      a: "In-person purchases go home with you at the show. For online inquiries leading to a sale, yes — shipping is available via USPS or UPS, typically within 1-3 business days of payment."
    },
    {
      q: "Is authenticity guaranteed?",
      a: "Absolutely. Every card sold is guaranteed authentic. Graded slabs include cert numbers you can verify directly with the grading company (PSA, BGS, CGC, SGC) before or after purchase."
    },
    {
      q: "Can I trade cards from multiple games in one trade?",
      a: "Yes — mixed-game trades are common and welcome. Values are calculated per-card based on market price regardless of which game each card is from, then balanced out."
    }
  ];

  renderFAQ(faqs);

  // ── Load data ──
  try {
    const [showsRes, invRes, testRes] = await Promise.all([
      fetch('/Buds-Collectibles/data/shows.json').catch(() => null),
      fetch('/Buds-Collectibles/data/inventory.json').catch(() => null),
      fetch('/Buds-Collectibles/data/testimonials.json').catch(() => null)
    ]);

    if (showsRes && showsRes.ok) {
      const data = await showsRes.json();
      const shows = data.shows || [];
      setEl('vs-shows', shows.filter(s => s.status === 'completed' || s.status === 'attending').length || shows.length);
      renderEventHistory(shows);
    }

    if (invRes && invRes.ok) {
      const data = await invRes.json();
      setEl('vs-items', (data.items || []).filter(i => !i.sold).length);
    }

    if (testRes && testRes.ok) {
      const data = await testRes.json();
      renderTestimonials(data.testimonials || []);
    }
  } catch (err) {
    console.error('Vendor page data error:', err);
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderEventHistory(shows) {
    const container = document.getElementById('event-history');
    if (!container) return;

    const sorted = [...shows].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    if (sorted.length === 0) {
      container.innerHTML = '<p class="text-muted">No event history yet.</p>';
      return;
    }

    container.innerHTML = sorted.map(show => `
      <div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);flex-wrap:wrap">
        <span class="badge ${show.status === 'completed' ? 'badge-completed' : 'badge-upcoming'}">${U.escapeHtml(show.status)}</span>
        <div style="flex:1;min-width:200px">
          <div style="font-weight:600;font-size:.92rem">${U.escapeHtml(show.name)}</div>
          <div style="font-size:.78rem;color:var(--text-muted);font-family:var(--font-mono)">${U.escapeHtml(show.city)}, ${U.escapeHtml(show.state)} · ${U.formatDateShort(show.date)}</div>
        </div>
        <a href="/Buds-Collectibles/shows/?event=${U.escapeHtml(show.id)}" style="font-size:.8rem;color:var(--accent-primary)">View →</a>
      </div>
    `).join('');
  }

  function renderTestimonials(testimonials) {
    const container = document.getElementById('vendor-testimonials');
    if (!container) return;

    if (testimonials.length === 0) {
      container.innerHTML = '<p class="text-muted text-center">No testimonials yet.</p>';
      return;
    }

    container.innerHTML = testimonials.map(t => {
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

  function renderFAQ(faqs) {
    const container = document.getElementById('faq-list');
    if (!container) return;

    container.innerHTML = faqs.map((faq, i) => `
      <div class="faq-item" id="faq-${i}">
        <button class="faq-question" aria-expanded="false" data-faq="${i}">
          ${U.escapeHtml(faq.q)}
          <svg class="faq-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="faq-answer">${U.escapeHtml(faq.a)}</div>
      </div>
    `).join('');

    container.addEventListener('click', function(e) {
      const btn = e.target.closest('.faq-question');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen);
    });
  }
});
