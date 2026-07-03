/**
 * NAVIGATION — Mobile menu, active page highlighting, scroll behavior
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // ── Mobile Menu Toggle ──
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconMenu = menuToggle && menuToggle.querySelector('.icon-menu');
  const iconClose = menuToggle && menuToggle.querySelector('.icon-close');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
      const isOpen = !mobileMenu.hidden;
      mobileMenu.hidden = isOpen;
      menuToggle.setAttribute('aria-expanded', !isOpen);
      if (iconMenu) iconMenu.style.display = isOpen ? '' : 'none';
      if (iconClose) iconClose.style.display = isOpen ? 'none' : '';
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!mobileMenu.hidden && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        mobileMenu.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
        if (iconMenu) iconMenu.style.display = '';
        if (iconClose) iconClose.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // ── Active Nav Link ──
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    } else if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    }
  });

  // ── Back to Top ──
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Footer Year ──
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Scroll Effect on Nav ──
  const nav = document.querySelector('.site-nav');
  if (nav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 20) {
        nav.style.borderBottomColor = 'var(--border-default)';
      } else {
        nav.style.borderBottomColor = 'var(--border-subtle)';
      }
    }, { passive: true });
  }
});
