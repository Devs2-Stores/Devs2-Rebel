/* -------------------------------------------------------------------------- */
/*                           FOOTER MENU ACCORDION                            */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  function initFooterMenu() {
    var footerMenus = document.querySelectorAll('.footer-actions-menu');
    footerMenus.forEach(function(menu) {
      var toggle = menu.querySelector('.footer-actions-menu__toggle');
      if (!toggle || toggle.dataset.bound) return;
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', function() {
        var open = menu.classList.toggle('active');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function initLocalizationSelectors() {
    var selectors = document.querySelectorAll('[data-localization-select]');
    selectors.forEach(function(sel) {
      if (sel.dataset.bound) return;
      sel.dataset.bound = '1';
      sel.addEventListener('change', function() {
        var form = this.closest('form');
        if (form) form.submit();
      });
    });
  }

  function initAll() {
    initFooterMenu();
    initLocalizationSelectors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', initAll);
})();
