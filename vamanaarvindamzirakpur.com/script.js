(function () {
  'use strict';

  var LEADS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzNC3OJcfzy2rOKHTqT0m3OGmWZ_R_OlMIv0X-ImnHhgk_4OnMsJ3Fzv6cnblgMjrM2-g/exec';
  var PROJECT_NAME = 'Vamana Arvindam';
  var WHATSAPP_NUMBER = '917888913402';
  var CALL_NUMBER = '+917888913402';

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
    'tour-inline': { title: 'Unlock the 3D Virtual Tour', subtext: 'Share your details to view the interactive tour.' },
    'tour-fullscreen': { title: 'Unlock the 3D Virtual Tour', subtext: "Share your details and we'll open the full-screen tour." }
  };

  function openModal(action, unitType) {
    pendingAction = action;
    pendingUnitType = unitType || '';
    var copy = MODAL_COPY[action] || MODAL_COPY.enquire;
    modalTitle.textContent = copy.title;
    modalSubtext.textContent = copy.subtext;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('modalName').focus();
  }
  function closeModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = '';
    pendingAction = null;
    pendingUnitType = '';
  }
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('modalName').value.trim();
    var phone = document.getElementById('modalPhone').value.trim();
    if (!name || !/^\d{10}$/.test(phone)) {
      showToast('Please enter a valid name and 10-digit mobile number.');
      return;
    }
    submitLead(name, phone, { source: 'lead-modal', action: pendingAction, unitType: pendingUnitType });
    var action = pendingAction;
    closeModal();
    modalForm.reset();
    if (action === 'call') {
      window.location.href = 'tel:' + CALL_NUMBER;
      showToast('Thank you! Connecting you now.');
    } else if (action === 'whatsapp') {
      var msg = encodeURIComponent('Hi, I\'m ' + name + '. I\'m interested in Vamana Arvindam, Zirakpur. Please share more details.');
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
      showToast('Thank you! Connecting you now.');
    } else if (action === 'brochure') {
      var brochureMsg = encodeURIComponent('Hi, I\'m ' + name + '. Could you please share the Vamana Arvindam brochure?');
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + brochureMsg, '_blank');
      showToast('Thank you! Opening WhatsApp to send your brochure.');
    } else if (action === 'tour-inline') {
      var overlay = document.getElementById('tourGateOverlay');
      if (overlay) overlay.remove();
      showToast('Thank you! Enjoy the tour.');
    } else if (action === 'tour-fullscreen') {
      window.open('https://my.matterport.com/show/?m=rdCmhpWsQH5', '_blank');
      showToast('Thank you! Opening the full tour.');
    } else {
      showToast('Thank you! Our team will call you shortly.');
    }
  });

  /* ---------------- Global action router ---------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');

    if (action === 'call' || action === 'whatsapp' || action === 'enquire' || action === 'brochure' || action === 'tour-inline' || action === 'tour-fullscreen') {
      e.preventDefault();
      openModal(action, btn.getAttribute('data-unit-type'));
    }
  });

  /* ---------------- Hero & Contact lead forms ---------------- */
  function wireForm(formId, sourceLabel) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('input[name="name"]').value.trim();
      var phone = form.querySelector('input[name="phone"]').value.trim();
      if (!name || !/^\d{10}$/.test(phone)) {
        showToast('Please enter a valid name and 10-digit mobile number.');
        return;
      }
      submitLead(name, phone, { source: sourceLabel, action: 'form-submit' });
      form.reset();
      showToast('Thank you! Our team will call you shortly.');
    });
  }
  wireForm('heroForm', 'hero-form');
  wireForm('contactForm', 'contact-form');

  /* ---------------- Escape key closes overlays ---------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modalOverlay.hidden) closeModal();
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
