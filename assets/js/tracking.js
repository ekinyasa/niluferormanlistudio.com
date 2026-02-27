'use strict';

/**
 * tracking.js
 * Centralised loader for Google Analytics (gtag.js).
 * Ensures every static page loads the same snippet by referencing this file.
 */

(function () {
  var GA_MEASUREMENT_ID = 'G-LW7P2Q90X4';
  if (!GA_MEASUREMENT_ID) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  var gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(gaScript);

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
})();
