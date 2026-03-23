/* -------------------------------------------------------------------------- */
/*                           FOOTER MENU ACCORDION                            */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var footerMenus = document.querySelectorAll('.footer-actions-menu');
    footerMenus.forEach(function(menu) {
      var title = menu.querySelector('.footer-actions-menu__title');
      if (title) {
        title.addEventListener('click', function() {
          if (window.innerWidth < 768) {
            menu.classList.toggle('active');
          }
        });
      }
    });
  });
})();
