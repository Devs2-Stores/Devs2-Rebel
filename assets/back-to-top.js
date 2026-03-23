/* -------------------------------------------------------------------------- */
/*                               BACK TO TOP                                  */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  var backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var isVisible = window.scrollY > 400;
          backToTopBtn.classList.toggle('is-visible', isVisible);
          backToTopBtn.setAttribute('aria-hidden', String(!isVisible));
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
