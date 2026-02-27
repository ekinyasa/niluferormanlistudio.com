'use strict';

/**
 * page-renderer.js
 * Nilüfer Ormanlı Studio LLC — Corporate Website
 *
 * Fetches the YAML content file corresponding to the current page URL,
 * parses it with js-yaml, and renders typed sections into #content-root.
 *
 * Dependencies: js-yaml (global `jsyaml`)
 */

(function () {

  /* ──────────────────────────────────────────
     URL → YAML CONTENT MAP
     Maps normalised URL pathnames to content files.
  ────────────────────────────────────────── */
  var CONTENT_MAP = {
    '/':                        'content/home.yml',
    '/about':                   'content/about.yml',
    '/activities':              'content/activities.yml',
    '/management':              'content/management.yml',
    '/contact':                 'content/contact.yml',
    '/legal':                   'content/legal/index.yml',
    '/legal/privacy-policy':    'content/legal/privacy-policy.yml',
    '/legal/terms-of-use':      'content/legal/terms-of-use.yml',
    '/legal/cookie-notice':     'content/legal/cookie-notice.yml',
    '/legal/ip-notice':         'content/legal/ip-notice.yml'
  };
  var NAV_CONFIG_PATH = 'content/nav.yml';
  var navConfigPromise = null;

  /* ──────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────── */

  /** Normalise pathname: strip trailing slash, lower-case, fallback to '/'. */
  function normalisePath(pathname) {
    var p = pathname.replace(/\/+$/, '').toLowerCase();
    return p === '' ? '/' : p;
  }

  /** Escape HTML to prevent XSS from YAML string values (basic guard). */
  function esc(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * For body fields that intentionally contain HTML (legal-document),
   * we trust the content as it comes from internal YAML files.
   * All other string fields are escaped.
   */

  /* ──────────────────────────────────────────
     SECTION RENDERERS
     Each returns an HTMLElement for a section type.
  ────────────────────────────────────────── */

  var renderers = {

    /* ---- hero ---- */
    hero: function (s) {
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          '<h1 class="hero-heading">' + esc(s.heading || '') + '</h1>' +
          (s.subheading
            ? '<p class="hero-subheading">' + esc(s.subheading) + '</p>'
            : '') +
        '</div>';
      return el;
    },

    /* ---- page-header ---- */
    'page-header': function (s) {
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          '<h1 class="page-heading">' + esc(s.heading || '') + '</h1>' +
          (s.subheading
            ? '<p class="page-subheading">' + esc(s.subheading) + '</p>'
            : '') +
        '</div>';
      return el;
    },

    /* ---- summary (key/value pairs) ---- */
    summary: function (s) {
      var items = (s.items || []).map(function (item) {
        return '<div class="summary-item">' +
          '<dt class="summary-term">' + esc(item.label) + '</dt>' +
          '<dd class="summary-value">' + esc(item.value) + '</dd>' +
        '</div>';
      }).join('');
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<dl class="summary-list">' + items + '</dl>' +
        '</div>';
      return el;
    },

    /* ---- statement (prominent paragraph) ---- */
    statement: function (s) {
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          '<p class="statement-body">' + esc(s.body || '') + '</p>' +
        '</div>';
      return el;
    },

    /* ---- text-block ---- */
    'text-block': function (s) {
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<div class="text-body">' + esc(s.body || '').replace(/\n/g, '<br>') + '</div>' +
        '</div>';
      return el;
    },

    /* ---- definition-list ---- */
    'definition-list': function (s) {
      var items = (s.items || []).map(function (item) {
        return '<div class="def-item">' +
          '<dt class="def-term">' + esc(item.term) + '</dt>' +
          '<dd class="def-value">' + esc(item.definition) + '</dd>' +
        '</div>';
      }).join('');
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<dl class="def-list">' + items + '</dl>' +
        '</div>';
      return el;
    },

    /* ---- activity-list ---- */
    'activity-list': function (s) {
      var items = (s.items || []).map(function (item) {
        return '<div class="activity-item">' +
          '<h2 class="activity-heading">' + esc(item.heading) + '</h2>' +
          '<p class="activity-description">' + esc(item.description) + '</p>' +
        '</div>';
      }).join('');
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<div class="activity-list">' + items + '</div>' +
        '</div>';
      return el;
    },

    /* ---- persons ---- */
    persons: function (s) {
      var items = (s.items || []).map(function (item) {
        return '<article class="person-item">' +
          '<h2 class="person-name">' + esc(item.name) + '</h2>' +
          (item.title
            ? '<p class="person-title">' + esc(item.title) + '</p>'
            : '') +
          (item.bio
            ? '<p class="person-bio">' + esc(item.bio) + '</p>'
            : '') +
        '</article>';
      }).join('');
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<div class="persons-list">' + items + '</div>' +
        '</div>';
      return el;
    },

    /* ---- contact-block ---- */
    'contact-block': function (s) {
      var items = (s.items || []).map(function (item) {
        var val = item.href
          ? '<a href="' + esc(item.href) + '">' + esc(item.value) + '</a>'
          : esc(item.value);
        return '<div class="contact-item">' +
          '<dt class="contact-method">' + esc(item.method) + '</dt>' +
          '<dd class="contact-value">' + val + '</dd>' +
        '</div>';
      }).join('');
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<dl class="contact-list">' + items + '</dl>' +
        '</div>';
      return el;
    },

    /* ---- link (single CTA — "Visit Official Website" only) ---- */
    link: function (s) {
      var target = s.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          '<a href="' + esc(s.url || '#') + '" class="official-link"' + target + '>' +
            esc(s.label || 'Visit Official Website') +
          '</a>' +
        '</div>';
      return el;
    },

    /* ---- back-link (breadcrumb-style nav) ---- */
    'back-link': function (s) {
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          '<a href="' + esc(s.url || '/legal/') + '" class="back-link">' +
            esc(s.label || 'Back') +
          '</a>' +
        '</div>';
      return el;
    },

    /* ---- legal-nav (index of legal docs) ---- */
    'legal-nav': function (s) {
      var items = (s.items || []).map(function (item) {
        return '<li>' +
          '<a href="' + esc(item.url) + '" class="legal-nav-link">' +
            esc(item.label) +
          '</a>' +
        '</li>';
      }).join('');
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          sectionLabel(s.label) +
          '<ul class="legal-nav-list" role="list">' + items + '</ul>' +
        '</div>';
      return el;
    },

    /* ---- legal-document (long-form, HTML body from YAML) ---- */
    'legal-document': function (s) {
      var el = createSection(s);
      el.innerHTML =
        '<div class="section-inner">' +
          (s.last_updated
            ? '<p class="legal-updated">Last updated: ' + esc(s.last_updated) + '</p>'
            : '') +
          '<div class="legal-body">' + (s.body || '') + '</div>' +
        '</div>';
      return el;
    }

  };

  /* ──────────────────────────────────────────
     UTILITY FUNCTIONS
  ────────────────────────────────────────── */

  function createSection(s) {
    var el = document.createElement('section');
    el.className = 'section section--' + (s.type || 'text');
    if (s.id) { el.id = s.id; }
    return el;
  }

  function sectionLabel(label) {
    return label
      ? '<h2 class="section-label">' + esc(label) + '</h2>'
      : '';
  }

  function renderSection(section) {
    var renderer = renderers[section.type];
    if (renderer) {
      return renderer(section);
    }
    /* Fallback for unknown types */
    var el = createSection(section);
    el.innerHTML =
      '<div class="section-inner">' +
        (section.body ? '<p>' + esc(section.body) + '</p>' : '') +
      '</div>';
    return el;
  }

  /* ──────────────────────────────────────────
     ACTIVE NAV STATE
  ────────────────────────────────────────── */

  function setActiveNav() {
    var currentPath = normalisePath(window.location.pathname);
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var href = normalisePath(link.getAttribute('href') || '');
      var isActive =
        href === currentPath ||
        (href !== '/' && currentPath.indexOf(href) === 0);
      if (isActive) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ──────────────────────────────────────────
     MAIN INITIALISER
  ────────────────────────────────────────── */

  function init() {
    loadNavConfig().then(applySiteChrome).catch(function () {
      /* already logged inside loadNavConfig */
    });

    var root = document.getElementById('content-root');
    if (!root) { return; }

    var pathname = normalisePath(window.location.pathname);
    var yamlPath = CONTENT_MAP[pathname];

    if (!yamlPath) {
      root.setAttribute('aria-busy', 'false');
      root.innerHTML =
        '<section class="section"><div class="section-inner">' +
          '<h1 class="page-heading">Page Not Found</h1>' +
          '<p style="margin-top:1rem;color:var(--c-text-2)">The requested page does not exist.</p>' +
        '</div></section>';
      return;
    }

    fetch(yamlPath)
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status + ': ' + yamlPath); }
        return res.text();
      })
      .then(function (text) {
        var data = jsyaml.load(text);

        /* Update document title */
        if (data.meta && data.meta.title) {
          document.title = data.meta.title + ' — Nilüfer Ormanlı Studio LLC';
        }

        /* Update meta description */
        if (data.meta && data.meta.description) {
          var metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) { metaDesc.setAttribute('content', data.meta.description); }
        }

        /* Render sections */
        var fragment = document.createDocumentFragment();
        (data.sections || []).forEach(function (section) {
          fragment.appendChild(renderSection(section));
        });

        root.setAttribute('aria-busy', 'false');
        root.innerHTML = '';
        root.appendChild(fragment);

        setActiveNav();
      })
      .catch(function (err) {
        console.error('[page-renderer] Failed to load content:', err);
        root.setAttribute('aria-busy', 'false');
        root.innerHTML =
          '<section class="section"><div class="section-inner">' +
            '<p style="color:var(--c-text-2)">Content could not be loaded.</p>' +
          '</div></section>';
      });
  }

  /* ──────────────────────────────────────────
     BOOT
  ────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ──────────────────────────────────────────
     SITE CHROME (NAV + FOOTER) HELPERS
  ────────────────────────────────────────── */

  function loadNavConfig() {
    if (!navConfigPromise) {
      navConfigPromise = fetch(NAV_CONFIG_PATH)
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status + ': ' + NAV_CONFIG_PATH); }
          return res.text();
        })
        .then(function (text) {
          return jsyaml.load(text);
        })
        .catch(function (err) {
          console.error('[page-renderer] Failed to load nav config:', err);
          return null;
        });
    }
    return navConfigPromise;
  }

  function applySiteChrome(navData) {
    if (!navData) { return; }
    applyFooter(navData);
  }

  function applyFooter(navData) {
    var footerCfg = navData.footer || {};
    var siteCfg = navData.site || {};
    var entityName = footerCfg.entity_name || siteCfg.name || 'Nilüfer Ormanlı Studio LLC';

    var nameEl = document.querySelector('.footer-name');
    if (nameEl) {
      nameEl.textContent = entityName;
    }

    var stateText = footerCfg.state_of_registration || footerCfg.state;
    var stateEl = document.querySelector('.footer-state');
    if (stateEl && stateText) {
      stateEl.textContent = 'Registered in ' + stateText;
    }

    var email = footerCfg.business_email;
    var emailEl = document.querySelector('.footer-email');
    if (emailEl && email) {
      emailEl.textContent = email;
      emailEl.setAttribute('href', 'mailto:' + email);
    }

    var year = footerCfg.copyright_year || new Date().getFullYear();
    var copyrightEl = document.querySelector('.footer-copyright');
    if (copyrightEl) {
      copyrightEl.innerHTML =
        '&copy; ' + esc(String(year)) + ' ' + esc(entityName) + '. All rights reserved.';
    }
  }

})();
