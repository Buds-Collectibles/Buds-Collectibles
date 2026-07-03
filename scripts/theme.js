/**
 * THEME MANAGER — Dark/Light mode with localStorage persistence
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'buds-theme';
  const html = document.documentElement;

  // Apply theme before paint to avoid flash
  const saved = localStorage.getItem(STORAGE_KEY);
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = saved || preferred;
  html.setAttribute('data-theme', theme);

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const sunIcon = btn.querySelector('.icon-sun');
    const moonIcon = btn.querySelector('.icon-moon');

    function updateIcons(t) {
      if (t === 'light') {
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = '';
      } else {
        if (sunIcon) sunIcon.style.display = '';
        if (moonIcon) moonIcon.style.display = 'none';
      }
    }

    updateIcons(html.getAttribute('data-theme'));

    btn.addEventListener('click', function() {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY, next);
      updateIcons(next);
    });
  });
})();
