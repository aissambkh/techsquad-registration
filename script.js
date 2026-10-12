/* ═══════════════════════════════════════════════════════════
   TECHSQUAD × ESSA TLEMCEN — REGISTRATIONS 2026/2027
   script.js — Countdown | Form | Google Sheets
   ───────────────────────────────────────────────────────────
   TO CONFIGURE (CONFIG section below):
   1. The two Google Apps Script URLs (new registrations / re-registrations)
   2. The registration deadline
   Step-by-step Google Sheets guide: see GOOGLE_SHEETS_SETUP.md
   ═══════════════════════════════════════════════════════════ */

// ── CONFIG ─────────────────────────────────────────────────
const GOOGLE_SHEETS_URLS = {
  new:            'https://script.google.com/macros/s/AKfycbyQMxDw8C-smrXCn8lvsEWXzqAQZTRZxZVelApXyOy_7ZxUoDk-Kq3ohWj5MjXGeiyP/exec',
  reregistration: 'https://script.google.com/macros/s/AKfycby_qjxOBpu3E7ne3zRHHY_tooHW4DEJOZF2QKsqRpSu2e4mmubmHsZY9v-YghZuqhfYDg/exec',
};

// Registrations open on 13/10/2026 and last one week
const REGISTRATION_DEADLINE = '2026-10-20T23:59:59';

const TYPE_LABELS = {
  new:            'New registration',
  reregistration: 'Re-registration',
};

// ══════════════════════════════════════════════════════════
// COUNTDOWN
// ══════════════════════════════════════════════════════════
(function initCountdown() {
  const target = new Date(REGISTRATION_DEADLINE).getTime();
  const pad = n => String(n).padStart(2, '0');
  const ids = ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'];

  function set(values) {
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = pad(values[i]);
    });
  }

  function tick() {
    const diff = target - Date.now();
    if (isNaN(diff) || diff <= 0) { set([0, 0, 0, 0]); return; }
    set([
      Math.floor(diff / 86400000),
      Math.floor((diff % 86400000) / 3600000),
      Math.floor((diff % 3600000) / 60000),
      Math.floor((diff % 60000) / 1000),
    ]);
  }

  tick();
  setInterval(tick, 1000);
})();

// ══════════════════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════════════════
const form = document.getElementById('reg-form');
const submitBtn = document.getElementById('submit-btn');
const formError = document.getElementById('form-error');
const FIELD_IDS = ['firstname', 'lastname', 'email', 'phone', 'year'];

function validateForm() {
  let valid = true;

  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    const err = document.getElementById(`err-${id}`);
    const value = el.value.trim();
    el.classList.remove('error');
    err.textContent = '';

    if (!value) {
      err.textContent = 'This field is required.';
    } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      err.textContent = 'Invalid email address.';
    } else if (id === 'phone' && !/^\+?[\d\s\-().]{8,}$/.test(value)) {
      err.textContent = 'Invalid phone number.';
    }

    if (err.textContent) {
      el.classList.add('error');
      valid = false;
    }
  });

  return valid;
}

// Clear an error as soon as the user fixes the field
FIELD_IDS.forEach(id => {
  const el = document.getElementById(id);
  const clear = () => {
    el.classList.remove('error');
    document.getElementById(`err-${id}`).textContent = '';
  };
  el.addEventListener('input', clear);
  el.addEventListener('change', clear);
});

// ══════════════════════════════════════════════════════════
// SUBMISSION → GOOGLE SHEETS
// ══════════════════════════════════════════════════════════
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  formError.textContent = '';

  if (Date.now() > new Date(REGISTRATION_DEADLINE).getTime()) {
    formError.textContent = 'Registrations are now closed. Thank you for your interest!';
    return;
  }

  if (!validateForm()) return;

  const type = document.querySelector('input[name="registration_type"]:checked').value;
  const url = GOOGLE_SHEETS_URLS[type];

  if (!url || url.startsWith('PASTE_')) {
    formError.textContent = '⚠️ Missing configuration: the Google Sheets URL has not been set in script.js yet.';
    return;
  }

  const payload = {
    timestamp:         new Date().toISOString(),
    registration_type: TYPE_LABELS[type],
    firstname:         document.getElementById('firstname').value.trim(),
    lastname:          document.getElementById('lastname').value.trim(),
    email:             document.getElementById('email').value.trim().toLowerCase(),
    phone:             document.getElementById('phone').value.trim(),
    year:              document.getElementById('year').value,
  };

  // Block double submissions
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').style.display = 'none';
  submitBtn.querySelector('.btn-loader').style.display = 'inline-flex';

  try {
    // With no-cors the response is opaque: if fetch doesn't throw,
    // the request was sent and Apps Script records it server-side.
    await fetch(url, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify(payload),
    });
    showSuccess(payload.firstname, TYPE_LABELS[type]);
  } catch (err) {
    console.warn('Submission error:', err);
    formError.textContent = 'Oops, sending failed. Please check your internet connection and try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').style.display = 'inline';
    submitBtn.querySelector('.btn-loader').style.display = 'none';
  }
});

function showSuccess(firstname, typeLabel) {
  form.style.display = 'none';
  document.getElementById('success-name').textContent = firstname;
  document.getElementById('success-type').textContent = typeLabel;
  document.getElementById('success-state').style.display = 'block';
  document.getElementById('register').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  form.reset();
  form.style.display = 'block';
  formError.textContent = '';
  document.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.getElementById('success-state').style.display = 'none';
}

// ══════════════════════════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════════════════════════
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const targets = document.querySelectorAll('.card, .stat, .step-card, .faq-item, .form-card');
  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.translate = '0 28px';
    el.style.transition = 'opacity 0.5s ease, translate 0.5s ease, transform 0.2s ease, box-shadow 0.2s ease';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.translate = '0 0';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
}
