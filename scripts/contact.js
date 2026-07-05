/**
 * CONTACT PAGE — Inquiry tabs, dynamic fields, form validation, Formspree submit
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  const tabs = document.querySelectorAll('.inquiry-tab');
  const dynamicFields = document.querySelectorAll('.dynamic-field');
  const typeInput = document.getElementById('form-type');
  const subjectInput = document.getElementById('form-subject');
  const form = document.getElementById('contact-form');
  const statusBox = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  const subjectMap = {
    general: "New general inquiry — Bud's Collectibles",
    wantlist: "New want list request — Bud's Collectibles",
    selling: "New sell inquiry — Bud's Collectibles",
    trade: "New trade proposal — Bud's Collectibles",
    business: "New business inquiry — Bud's Collectibles"
  };

  // ── Pre-fill from URL param (e.g. from inventory modal "Inquire") ──
  const urlInquiry = new URLSearchParams(window.location.search).get('inquiry');
  if (urlInquiry) {
    const msgEl = document.getElementById('contact-message');
    if (msgEl) msgEl.value = `Hi! I'm interested in: ${urlInquiry}\n\n`;
  }

  // ── Inquiry Tab Switching ──
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      const type = this.dataset.type;
      if (typeInput) typeInput.value = type;
      if (subjectInput) subjectInput.value = subjectMap[type] || subjectMap.general;

      dynamicFields.forEach(field => { field.hidden = true; });
      const targetField = document.getElementById('field-' + type);
      if (targetField) targetField.hidden = false;
    });
  });

  // ── Form Validation + Submission ──
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Clear previous errors
      document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

      let valid = true;
      const name = document.getElementById('contact-name');
      const email = document.getElementById('contact-email');
      const message = document.getElementById('contact-message');

      if (!name.value.trim()) {
        setError('err-name', 'Please enter your name');
        valid = false;
      }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        setError('err-email', 'Please enter a valid email address');
        valid = false;
      }
      if (!message.value.trim() || message.value.trim().length < 10) {
        setError('err-message', 'Please include a message (at least 10 characters)');
        valid = false;
      }

      if (!valid) return;

      // Formspree endpoint is configured — proceed with submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      showStatus('sending', 'Sending your message...');

      try {
        const formData = new FormData(form);
        const res = await fetch(action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          showStatus('success', '✅ Message sent! Bud will get back to you within 24 hours.');
          form.reset();
          if (window.BudsUtils) window.BudsUtils.showToast('Message sent successfully!', 'success');
        } else {
          throw new Error('Form submission failed');
        }
      } catch (err) {
        showStatus('error', '❌ Something went wrong. Please try again or email budcollectibles@gmail.com directly.');
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Message`;
      }
    });
  }

  function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function showStatus(type, msg) {
    if (!statusBox) return;
    statusBox.hidden = false;
    statusBox.className = 'form-status ' + type;
    statusBox.textContent = msg;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
