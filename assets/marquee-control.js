(function () {
  if (window.__marqueeControl) return;
  window.__marqueeControl = true;

  var reveal = function (scope) {
    var buttons = (scope || document).querySelectorAll('[data-marquee-toggle][hidden]');
    for (var i = 0; i < buttons.length; i++) buttons[i].hidden = false;
  };

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-marquee-toggle]');
    if (!button) return;
    var root = button.closest('[data-marquee]');
    if (!root) return;
    var paused = root.classList.toggle('is-paused');
    button.setAttribute('aria-label', paused ? button.getAttribute('data-label-play') : button.getAttribute('data-label-pause'));
  });

  document.addEventListener('shopify:section:load', function (event) {
    reveal(event.target);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { reveal(); });
  } else {
    reveal();
  }
})();
