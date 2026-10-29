(function() {
  'use strict';

  var observer = null;

  function isPending(el) {
    var rect = el.getBoundingClientRect();
    return rect.top > (window.innerHeight || document.documentElement.clientHeight);
  }

  function init(root) {
    var scope = root || document.getElementById('MainContent');
    if (!scope || !('IntersectionObserver' in window)) return;

    var targets = Array.prototype.filter.call(
      scope.querySelectorAll('.shopify-section'),
      isPending
    );
    if (targets.length === 0) return;

    if (!observer) {
      observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          entry.target.classList.add('is-revealed');
        });
      }, { rootMargin: '0px 0px -8% 0px' });
    }

    targets.forEach(function(el) {
      el.classList.add('reveal-item');
      observer.observe(el);
    });
    document.body.classList.add('reveal-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); });
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function(event) {
    if (event.target) init(event.target);
  });
})();
