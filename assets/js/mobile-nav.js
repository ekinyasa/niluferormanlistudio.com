'use strict';

/**
 * mobile-nav.js
 * Nilüfer Ormanlı Studio LLC — Corporate Website
 *
 * Handles the responsive hamburger navigation toggle.
 * Closes on: outside click, Escape key, or when a nav link is followed.
 */

(function () {

  var toggle = document.querySelector('.nav-toggle');
  var menu   = document.getElementById('nav-menu');

  if (!toggle || !menu) { return; }

  /* ── Toggle open/close ── */
  toggle.addEventListener('click', function () {
    var expanded = this.getAttribute('aria-expanded') === 'true';
    setOpen(!expanded);
  });

  /* ── Close on outside click ── */
  document.addEventListener('click', function (e) {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      setOpen(false);
    }
  });

  /* ── Close on Escape ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  /* ── Close when a nav link is activated ── */
  menu.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      setOpen(false);
    });
  });

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    /* Prevent body scroll while menu is open on mobile */
    document.body.style.overflow = open ? 'hidden' : '';
  }

})();
