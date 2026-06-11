/* -------------------------------------------------------------------------- */
/*                           FOOTER MENU ACCORDION                            */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  function initFooterMenu() {
    var footerMenus = document.querySelectorAll('.footer-actions-menu');
    footerMenus.forEach(function(menu) {
      var title = menu.querySelector('.footer-actions-menu__title');
      if (!title || title.dataset.bound) return;
      title.dataset.bound = '1';
      title.addEventListener('click', function() {
        if (window.innerWidth < 768) {
          menu.classList.toggle('active');
        }
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
})();
