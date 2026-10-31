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
    escapeHtml: (str) => {
      if (!str) return '';
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(String(str)));
      return div.innerHTML;
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
      if (!res.ok) {
        const failure = new Error('HTTP ' + res.status + ' for ' + url);
        failure.status = res.status;
        failure.description = await res.json().then((data) => (data && typeof data.description === 'string' ? data.description : ''), () => '');
        throw failure;
      }
      if (parser === 'text') return res.text();
      return res.json();
    },

    storage: {
      get: (key) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
      },
      set: (key, value) => {
        try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
      },
      getJSON: (key) => {
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
      }
    },

    parseJSON: (text) => {
      try { return JSON.parse(text); } catch (e) { return null; }
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

    debounceKeyed: (fn, wait) => {
      var timers = new Map();
      var run = function(key) {
        var args = Array.prototype.slice.call(arguments, 1);
        var self = this;
        clearTimeout(timers.get(key));
        timers.set(key, setTimeout(function() {
          timers.delete(key);
          fn.apply(self, args);
        }, wait));
      };
      run.cancel = function(key) {
        if (arguments.length) {
          clearTimeout(timers.get(key));
          timers.delete(key);
          return;
        }
        timers.forEach(clearTimeout);
        timers.clear();
      };
      return run;
    },

    formatMoney: (cents, format) => {
      if (cents == null) return '0';
      if (typeof cents === 'string') cents = cents.replace('.', '');
      var formatString = format || (typeof themeConfig !== 'undefined' && (themeConfig.priceFormat || themeConfig.formatMoney)) || '{{amount}}';
      var patt = /\{\{\s*(\w+)\s*\}\}/;
      var match = formatString.match(patt);
      if (!match) return String(cents);

      function withDelimiters(amount, precision, thousands, decimal) {
        var number = parseFloat(amount);
        if (isNaN(number)) return '0';
        var parts = (number / 100).toFixed(precision).split('.');
        var whole = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands);
        return parts[1] ? whole + decimal + parts[1] : whole;
      }

      var value;
      switch (match[1]) {
        case 'amount_no_decimals':
          value = withDelimiters(cents, 0, ',', '.');
          break;
        case 'amount_with_comma_separator':
          value = withDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = withDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_with_apostrophe_separator':
          value = withDelimiters(cents, 2, "'", '.');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = withDelimiters(cents, 0, ' ', '.');
          break;
        case 'amount_with_space_separator':
          value = withDelimiters(cents, 2, ' ', ',');
          break;
        case 'amount_with_period_and_space_separator':
          value = withDelimiters(cents, 2, ' ', '.');
          break;
        default:
          value = withDelimiters(cents, 2, ',', '.');
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
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('scroll-locked');
    },

    unlockScroll: () => {
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = document.body.dataset.prevPaddingRight || '';
      delete document.body.dataset.prevPaddingRight;
      document.body.classList.remove('scroll-locked');
    },

    trapFocus: (container, triggerEl) => {
      var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      var isUsable = function(el) {
        return el.tabIndex >= 0 && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      var collect = function(root, list) {
        Array.prototype.forEach.call(root.querySelectorAll('*'), function(el) {
          if (el.closest('[inert]')) return;
          if (el.matches(focusableSelector) && isUsable(el)) list.push(el);
          if (el.shadowRoot) collect(el.shadowRoot, list);
        });
        return list;
      };
      var getFocusables = function() {
        return collect(container, []);
      };
      var deepActive = function() {
        var active = document.activeElement;
        while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
        return active;
      };
      var handler = function(e) {
        if (e.key !== 'Tab') return;
        var focusables = getFocusables();
        if (focusables.length === 0) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (deepActive() === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (deepActive() === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      container.addEventListener('keydown', handler);
      container._focusTrapHandler = handler;
      container._focusTrapTrigger = triggerEl || document.activeElement;
      var firstFocusable = getFocusables()[0];
      if (firstFocusable) firstFocusable.focus();
    },

    releaseFocus: (container) => {
      if (container._focusTrapHandler) {
        container.removeEventListener('keydown', container._focusTrapHandler);
        delete container._focusTrapHandler;
      }
      var trigger = container._focusTrapTrigger;
      if (trigger) {
        trigger.focus();
        if (document.activeElement !== trigger && trigger.isConnected && getComputedStyle(trigger).visibility === 'hidden') {
          var prevVisibility = trigger.style.visibility;
          var prevTransition = trigger.style.transition;
          trigger.style.transition = 'none';
          trigger.style.visibility = 'visible';
          trigger.focus();
          trigger.style.visibility = prevVisibility;
          trigger.style.transition = prevTransition;
        }
        delete container._focusTrapTrigger;
      }
    },

    bindTablistKeys: (tabList) => {
      var tabs = Array.from(tabList);
      if (tabs.length === 0) return;
      var sync = function() {
        var enabled = tabs.filter(function(t) { return !t.disabled; });
        var selected = enabled.find(function(t) { return t.getAttribute('aria-selected') === 'true'; }) || enabled[0];
        tabs.forEach(function(t) { t.tabIndex = t === selected ? 0 : -1; });
      };
      tabs.forEach(function(tab) {
        tab.addEventListener('click', sync);
        tab.addEventListener('keydown', function(e) {
          var enabled = tabs.filter(function(t) { return !t.disabled; });
          var i = enabled.indexOf(tab);
          if (i < 0) return;
          var next = e.key === 'ArrowRight' ? (i + 1) % enabled.length
            : e.key === 'ArrowLeft' ? (i - 1 + enabled.length) % enabled.length
            : e.key === 'Home' ? 0
            : e.key === 'End' ? enabled.length - 1
            : -1;
          if (next < 0) return;
          e.preventDefault();
          enabled[next].focus();
          enabled[next].click();
        });
      });
      sync();
    },

    updateCartCount: (number) => {
      var cartCountEl = document.querySelectorAll("[data-cart-count]");
      if (cartCountEl.length) cartCountEl.forEach(function(el) {
        el.innerText = number;
        if (el.classList.contains('cart-count')) el.toggleAttribute('data-empty', Number(number) === 0);
      });
    },

    updateCartMoney: (price) => {
      var cartPriceEl = document.querySelectorAll(".cart-price");
      if (cartPriceEl.length) cartPriceEl.forEach(function(el) {
        el.innerText = ThemeUtils.formatMoney(price, themeConfig.priceFormat);
      });
    },

    updateCartData: async (cart, options) => {
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
        document.dispatchEvent(new CustomEvent(((themeConfig.cart || {}).events || {}).updated || 'cart:updated', {
          detail: {
            cart: cart,
            source: options && options.source ? options.source : null
          }
        }));
      } catch (e) {
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
