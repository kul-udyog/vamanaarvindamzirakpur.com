(function () {
  'use strict';

  var LEADS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzNC3OJcfzy2rOKHTqT0m3OGmWZ_R_OlMIv0X-ImnHhgk_4OnMsJ3Fzv6cnblgMjrM2-g/exec';
  var PROJECT_NAME = 'Vamana Arvindam';
  var WHATSAPP_NUMBER = '917888913402';
  var CALL_NUMBER = '+917888913402';
  var LEAD_STORAGE_KEY = 'vamanaArvindamLead';

  // Accepts 10-digit numbers with or without +91 / 91 / 0 prefixes, spaces,
  // dashes, or parentheses, and normalizes down to a plain 10-digit string.
  function normalizePhone(raw) {
    var digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.indexOf('91') === 0) return digits.slice(2);
    if (digits.length === 11 && digits.indexOf('0') === 0) return digits.slice(1);
    if (digits.length === 13 && digits.indexOf('091') === 0) return digits.slice(3);
    return null;
  }

  function getStoredLead() {
    try {
      var raw = localStorage.getItem(LEAD_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
  }
  function storeLead(name, phone) {
    try {
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify({ name: name, phone: phone, submittedAt: new Date().toISOString() }));
    } catch (err) { /* ignore — storage may be unavailable, not critical */ }
  }
  function formatSubmittedAt(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (err) { return ''; }
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- Mobile section-nav toggle ---------------- */
  var navToggle = document.getElementById('navToggle');
  var siteNav = document.getElementById('siteNav');
  function closeNav() {
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
  }
  navToggle.addEventListener('click', function () {
    var isOpen = siteNav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  siteNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  /* ---------------- Sticky header shadow on scroll ---------------- */
  var header = document.getElementById('siteHeader');
  window.addEventListener('scroll', function () {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ---------------- Toast ---------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200);
  }

  /* ---------------- Lead submission (shared Apps Script pipeline) ---------------- */
  function submitLead(name, phone, opts) {
    opts = opts || {};
    var payload = {
      project: PROJECT_NAME,
      name: name,
      phone: phone,
      unitType: opts.unitType || '',
      source: opts.source || '',
      action: opts.action || '',
      page: window.location.href,
      timestamp: new Date().toISOString()
    };
    // no-cors POST — Apps Script Web Apps commonly require this from static frontends
    fetch(LEADS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(function () { /* fail silently, still proceed with UX */ });
  }

  /* ---------------- Config tabs (3 BHK / 3+1 BHK / 4+1 BHK) ---------------- */
  var tabs = document.querySelectorAll('.config-tab');
  var panels = document.querySelectorAll('.config-panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-config');
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var match = p.getAttribute('data-panel') === target;
        p.classList.toggle('is-active', match);
        p.hidden = !match;
      });
    });
  });

  /* ---------------- Lead-capture modal (call, WhatsApp, and Enquire Now all use this) ---------------- */
  var modalOverlay = document.getElementById('modalOverlay');
  var modalClose = document.getElementById('modalClose');
  var modalForm = document.getElementById('modalForm');
  var modalTitle = document.getElementById('modalTitle');
  var modalSubtext = document.getElementById('modalSubtext');
  var pendingAction = null; // 'call' | 'whatsapp' | 'enquire'
  var pendingUnitType = '';

  var MODAL_COPY = {
    call: { title: 'Share your details to continue', subtext: "We'll connect your call right after." },
    whatsapp: { title: 'Share your details to continue', subtext: "We'll open WhatsApp right after." },
    enquire: { title: 'Get Price Details & Callback', subtext: 'Share your details and our team will reach out shortly.' },
    brochure: { title: 'Get the Brochure on WhatsApp', subtext: "Share your details and we'll send the brochure to you on WhatsApp." },
    'tour-fullscreen': { title: 'Unlock the 3D Virtual Tour', subtext: "Share your details and we'll open the full-screen tour." }
  };

  var modalHistoryPushed = false;

  // Runs the actual outcome of an action once we have a name + valid phone,
  // whether that came from the modal form just now or from a stored lead
  // on a repeat visit. Kept separate from modal open/close so tel:/WhatsApp
  // navigation is never delayed or interrupted by history cleanup.
  function performAction(action, unitType, name, phone, isReturning, submittedAt) {
    submitLead(name, phone, { source: isReturning ? 'returning-visitor' : 'lead-modal', action: action, unitType: unitType });
    if (!isReturning) {
      storeLead(name, phone);
    }
    if (action === 'call') {
      window.location.href = 'tel:' + CALL_NUMBER;
      if (!isReturning) showToast('Thank you! Connecting you now.');
    } else if (action === 'whatsapp') {
      var msg = encodeURIComponent('Hi, I\'m ' + name + '. I\'m interested in Vamana Arvindam, Zirakpur. Please share more details.');
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
      if (!isReturning) showToast('Thank you! Connecting you now.');
    } else if (action === 'brochure') {
      var brochureMsg = encodeURIComponent('Hi, I\'m ' + name + '. Could you please share the Vamana Arvindam brochure?');
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + brochureMsg, '_blank');
      if (!isReturning) showToast('Thank you! Opening WhatsApp to send your brochure.');
    } else if (action === 'tour-fullscreen') {
      window.open('https://my.matterport.com/show/?m=rdCmhpWsQH5', '_blank');
      if (!isReturning) showToast('Thank you! Opening the full tour.');
    } else if (!isReturning) {
      showToast('Thank you! Our team will call you shortly.');
    }
    if (isReturning) openThankYouPopup();
  }

  /* ---------------- Returning-visitor thank-you popup ---------------- */
  var thankYouOverlay = document.getElementById('thankYouOverlay');
  var thankYouClose = document.getElementById('thankYouClose');
  var thankYouHistoryPushed = false;

  function openThankYouPopup() {
    thankYouOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    history.pushState({ thankYouPopup: true }, '');
    thankYouHistoryPushed = true;
  }
  function dismissThankYouPopup(fromPopState) {
    thankYouOverlay.hidden = true;
    document.body.style.overflow = '';
    if (thankYouHistoryPushed) {
      thankYouHistoryPushed = false;
      if (!fromPopState) history.back();
    }
  }
  thankYouClose.addEventListener('click', function () { dismissThankYouPopup(); });
  thankYouOverlay.addEventListener('click', function (e) {
    if (e.target === thankYouOverlay) dismissThankYouPopup();
  });

  function hideModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = '';
    pendingAction = null;
    pendingUnitType = '';
  }

  function openModal(action, unitType) {
    // Returning visitor who already gave us their details once — skip the
    // form entirely and go straight to the outcome. No repeat interruptions.
    var stored = getStoredLead();
    if (stored && stored.name && stored.phone) {
      performAction(action, unitType, stored.name, stored.phone, true, stored.submittedAt);
      return;
    }
    pendingAction = action;
    pendingUnitType = unitType || '';
    var copy = MODAL_COPY[action] || MODAL_COPY.enquire;
    modalTitle.textContent = copy.title;
    modalSubtext.textContent = copy.subtext;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('modalName').focus();
    history.pushState({ leadModal: true }, '');
    modalHistoryPushed = true;
  }

  // Explicit "I don't want to continue" dismissal (X button, backdrop click,
  // Escape, or the browser back button) — unwinds the synthetic history
  // entry so back-button behavior stays clean.
  function dismissModal(fromPopState) {
    hideModal();
    if (modalHistoryPushed) {
      modalHistoryPushed = false;
      if (!fromPopState) history.back();
    }
  }
  window.addEventListener('popstate', function () {
    if (!modalOverlay.hidden) dismissModal(true);
    if (!thankYouOverlay.hidden) dismissThankYouPopup(true);
  });
  modalClose.addEventListener('click', function () { dismissModal(); });
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) dismissModal();
  });

  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('modalName').value.trim();
    var phone = normalizePhone(document.getElementById('modalPhone').value);
    if (!name || !phone) {
      showToast('Please enter a valid name and mobile number.');
      return;
    }
    var action = pendingAction;
    var unitType = pendingUnitType;
    // Hide immediately (without the history.back() unwind) so a tel: or
    // wa.me navigation right after isn't raced or cancelled by it. The
    // harmless leftover history entry is a no-op if the user later hits back.
    hideModal();
    modalHistoryPushed = false;
    modalForm.reset();
    performAction(action, unitType, name, phone, false);
  });

  /* ---------------- Global action router ---------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');

    if (action === 'call' || action === 'whatsapp' || action === 'enquire' || action === 'brochure' || action === 'tour-fullscreen') {
      e.preventDefault();
      openModal(action, btn.getAttribute('data-unit-type'));
    }
  });

  /* ---------------- Hero & Contact lead forms ---------------- */
  function renderAlreadySubmitted(form, submittedAt) {
    form.innerHTML =
      '<div class="already-submitted">' +
        '<span class="already-submitted-check" aria-hidden="true">&#10003;</span>' +
        '<p class="already-submitted-title">You\'re all set!</p>' +
        '<p class="already-submitted-text">Your enquiry was submitted on ' + formatSubmittedAt(submittedAt) + '. Our team will contact you shortly.</p>' +
      '</div>';
  }

  function wireForm(formId, sourceLabel) {
    var form = document.getElementById(formId);
    if (!form) return;
    var stored = getStoredLead();
    if (stored && stored.name && stored.phone) {
      renderAlreadySubmitted(form, stored.submittedAt);
      return;
    }
    var nameInput = form.querySelector('input[name="name"]');
    var phoneInput = form.querySelector('input[name="phone"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      var phone = normalizePhone(phoneInput.value);
      if (!name || !phone) {
        showToast('Please enter a valid name and mobile number.');
        return;
      }
      submitLead(name, phone, { source: sourceLabel, action: 'form-submit' });
      storeLead(name, phone);
      var submittedAt = new Date().toISOString();
      renderAlreadySubmitted(form, submittedAt);
      showToast('Thank you! Our team will call you shortly.');
    });
  }
  wireForm('heroForm', 'hero-form');
  wireForm('contactForm', 'contact-form');

  /* ---------------- Escape key closes overlays ---------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modalOverlay.hidden) dismissModal();
      if (!thankYouOverlay.hidden) dismissThankYouPopup();
      closeNav();
    }
  });

  /* ---------------- Scroll-reveal for sections (IntersectionObserver) ---------------- */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revealTargets = document.querySelectorAll('.highlight-grid li, .config-panel-grid, .club-gallery-item, .location-col, .faq-item, .photo-gallery-item, .why-choose-card, .quick-fact, .testimonial-card');
    revealTargets.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 500ms ease-out, transform 500ms ease-out';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }
})();
