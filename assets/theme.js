(function() {
  'use strict';

  /* -------------------------------------------------------------------------- */
  /*                                THEME UTILS                                 */
  /* -------------------------------------------------------------------------- */

  const ThemeUtils = {
    qs: (root, selector) => root ? root.querySelector(selector) : null,
    qsa: (root, selector) => root ? Array.from(root.querySelectorAll(selector)) : [],
    toggleClass: (el, className, state) => {
      if (el) el.classList.toggle(className, state);
    },
    setText: (el, text) => {
      if (el) el.textContent = text;
    },
    setHTML: (el, html) => {
      if (el) el.innerHTML = html;
    },

    request: async (input, options) => {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      var method = options && options.method ? options.method : (input && input.method ? input.method : 'GET');
      var body = options && options.body ? options.body : (input && input.body ? input.body : undefined);
      var parser = options && options.parser ? options.parser : (input && input.parser ? input.parser : 'json');
      var rawConfig = options && options.rawConfig ? options.rawConfig : (input && input.rawConfig ? input.rawConfig : false);

      var config = {
        method: method || 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
      if (typeof body !== 'undefined') {
        if (typeof body === 'string') {
          config.headers['Content-Type'] = 'application/json';
          config.body = body;
        } else {
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          config.body = new URLSearchParams(body).toString();
        }
      } else {
        config.headers['Content-Type'] = 'application/json';
      }

      if (rawConfig) return config;

      const res = await fetch(url, config);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      if (parser === 'text') return res.text();
      return res.json();
    },

    remToPx: (rem) => {
      return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    },

    getParameter: (url, name) => {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    debounce: (fn, wait) => {
      var t;
      return function() {
        var args = arguments;
        var self = this;
        clearTimeout(t);
        t = setTimeout(function() {
          fn.apply(self, args);
        }, wait);
      };
    },

    formatMoney: (cents, format) => {
      if (cents == null) return '0‚«';
      cents = cents / 100;
      if (typeof cents === 'string') cents = cents.replace(/\./g, '');
      var formatString = format || (typeof themeConfig !== 'undefined' && themeConfig.formatMoney) || '{{amount_no_decimals}}‚«';
      var patt = /\{\{\s*(\w+)\s*\}\}/;
      var match = formatString.match(patt);
      if (!match) return cents + '‚«';

      function floatToStr(num, dec) {
        var fixed = parseFloat(num).toFixed(dec);
        return fixed;
      }
      function addCommas(str) {
        return str.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      }

      var value = '';
      switch (match[1]) {
        case 'amount':
          value = addCommas(floatToStr(cents, 0));
          break;
        case 'amount_no_decimals':
          value = addCommas(floatToStr(cents, 0));
          break;
        case 'amount_with_comma_separator':
          value = floatToStr(cents, 2).replace(/\./, ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = addCommas(floatToStr(cents, 0)).replace(/\./, ',');
          break;
        default:
          value = addCommas(floatToStr(cents, 0));
      }
      return formatString.replace(patt, value);
    },

    resizeImage: (src) => src,

    getScrollbarWidth: () => {
      return window.innerWidth - document.documentElement.clientWidth;
    },

    lockScroll: () => {
      if (document.body.classList.contains('scroll-locked')) return;
      var scrollbarWidth = ThemeUtils.getScrollbarWidth();
      document.body.dataset.prevPaddingRight = document.body.style.paddingRight;
      document.body.style.paddingRight = scrollbarWidth + 'px';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('scroll-locked');
    },

    unlockScroll: () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = document.body.dataset.prevPaddingRight || '';
      delete document.body.dataset.prevPaddingRight;
      document.body.classList.remove('scroll-locked');
    },

    trapFocus: (container, triggerEl) => {
      var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      var handler = function(e) {
        if (e.key !== 'Tab') return;
        var focusables = Array.from(container.querySelectorAll(focusableSelector)).filter(function(el) {
          return el.offsetParent !== null;
        });
        if (focusables.length === 0) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      container.addEventListener('keydown', handler);
      container._focusTrapHandler = handler;
      container._focusTrapTrigger = triggerEl || document.activeElement;
      var firstFocusable = container.querySelector(focusableSelector);
      if (firstFocusable) firstFocusable.focus();
    },

    releaseFocus: (container) => {
      if (container._focusTrapHandler) {
        container.removeEventListener('keydown', container._focusTrapHandler);
        delete container._focusTrapHandler;
      }
      if (container._focusTrapTrigger) {
        container._focusTrapTrigger.focus();
        delete container._focusTrapTrigger;
      }
    },

    updateCartCount: (number) => {
      var cartCountEl = document.querySelectorAll(".cart-count");
      if (cartCountEl.length) cartCountEl.forEach(function(el) {
        el.innerText = number;
      });
    },

    updateCartMoney: (price) => {
      var cartPriceEl = document.querySelectorAll(".cart-price");
      if (cartPriceEl.length) cartPriceEl.forEach(function(el) {
        el.innerText = ThemeUtils.formatMoney(price);
      });
    },

    updateCartData: async (cart) => {
      try {
        if (!cart || (!cart.item_count && cart.item_count !== 0) || (!cart.total_price && cart.total_price !== 0)) {
          if (themeConfig.routes && themeConfig.routes.get_cart_url) {
            cart = await ThemeUtils.request({
              url: themeConfig.routes.get_cart_url,
              method: 'GET'
            });
          }
        }
        ThemeUtils.updateCartCount(cart.item_count);
        ThemeUtils.updateCartMoney(cart.total_price);
      } catch (e) {
        console.error('updateCartData failed:', e);
      }
    }
  };

  // Expose to window for compatibility (use ThemeUtils namespace to avoid conflicts)
  window.ThemeUtils = ThemeUtils;

  // Expose individual functions for backward compatibility
  window.getParameter = ThemeUtils.getParameter;
  window.debounce = ThemeUtils.debounce;
  window.formatMoney = ThemeUtils.formatMoney;
  window.updateCartCount = ThemeUtils.updateCartCount;
  window.updateCartMoney = ThemeUtils.updateCartMoney;
  window.updateCartData = ThemeUtils.updateCartData;
  window.remToPx = ThemeUtils.remToPx;
  window.fetchConfig = function() {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  };


})();
