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
      if (cents == null) return '0₫';
      cents = cents / 100;
      if (typeof cents === 'string') cents = cents.replace(/\./g, '');
      var formatString = format || (typeof themeConfig !== 'undefined' && themeConfig.formatMoney) || '{{amount_no_decimals}}₫';
      var patt = /\{\{\s*(\w+)\s*\}\}/;
      var match = formatString.match(patt);
      if (!match) return cents + '₫';

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

  /* -------------------------------------------------------------------------- */
  /*                           ANNOUNCEMENT BAR                                 */
  /* -------------------------------------------------------------------------- */

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.initSwiper();
    }
    initSwiper() {
      var swiperEl = this.querySelector('.announcement-bar__swiper');
      if (!swiperEl) return;
      var slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
      if (slideCount === 0) return;
      if (typeof Swiper === 'undefined') {
        if (!this._retryCount) this._retryCount = 0;
        if (this._retryCount++ < 50) {
          setTimeout(function() {
            this.initSwiper();
          }.bind(this), 100);
        }
        return;
      }
      new Swiper(swiperEl, {
        loop: slideCount > 1,
        speed: 600,
        autoplay: slideCount > 1 ? {
          delay: 4000,
          disableOnInteraction: false,
        } : false,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        navigation: {
          nextEl: '.announcement-bar__nav--next',
          prevEl: '.announcement-bar__nav--prev',
        },
        allowTouchMove: false
      });
    }
  }
  customElements.define('announcement-bar', AnnouncementBar);

  /* -------------------------------------------------------------------------- */
  /*                                  HEADER                                    */
  /* -------------------------------------------------------------------------- */

  class Header extends HTMLElement {
    connectedCallback() {
      this.setHeightToRoot();
    }
    setHeightToRoot() {
      var headerh = this.getBoundingClientRect().height;
      var isSticky = this.dataset.sticky === 'true';
      document.documentElement.style.setProperty('--header-height', headerh + 'px');
      if (isSticky) document.documentElement.style.setProperty('--header-height-sticky', headerh + 'px');
    }
  }
  customElements.define('global-header', Header);

  /* -------------------------------------------------------------------------- */
  /*                                MEGA MENU                                   */
  /* -------------------------------------------------------------------------- */

  class MegaMenu extends HTMLElement {
    connectedCallback() {
      this.container = this.querySelector('.megamenu__container');
      this.list = this.querySelector('.megamenu__list');
      this.arrowLeft = this.querySelector('.megamenu__arrow--left');
      this.arrowRight = this.querySelector('.megamenu__arrow--right');
      this.scrollStep = 200;
      this.scrollOffset = 0;

      if (!this.container || !this.list) return;

      this.bindEvents();
      this.checkOverflow();
    }

    bindEvents() {
      var self = this;

      if (this.arrowLeft) {
        this.arrowLeft.addEventListener('click', function() {
          self.scroll('left');
        });
      }

      if (this.arrowRight) {
        this.arrowRight.addEventListener('click', function() {
          self.scroll('right');
        });
      }

      // Check overflow on resize
      window.addEventListener('resize', ThemeUtils.debounce(function() {
        self.checkOverflow();
        self.checkAllDropdowns();
      }, 150));

      // Handle dropdown overflow - flip to left if menu item is past 2/3 of viewport
      this.addEventListener('mouseenter', function(e) {
        // Check main dropdown
        var menuItem = e.target.closest('.megamenu__item');
        if (menuItem) {
          self.checkDropdownOverflow(menuItem);
        }

        // Check submenu
        var parent = e.target.closest('.megamenu__simple-parent, .megamenu__link-parent');
        if (parent) {
          self.checkSubmenuOverflow(parent);
        }
      }, true);

      // Initial check for all dropdowns
      this.checkAllDropdowns();
    }

    checkAllDropdowns() {
      var self = this;
      this.querySelectorAll('.megamenu__item').forEach(function(item) {
        self.checkDropdownOverflow(item);
      });
    }

    checkDropdownOverflow(menuItem) {
      var dropdown = menuItem.querySelector('.megamenu__dropdown');
      if (!dropdown) return;

      // Reset first
      dropdown.classList.remove('is-flipped');

      // Get positions
      var itemRect = menuItem.getBoundingClientRect();
      var viewportWidth = window.innerWidth;
      var triggerCenter = itemRect.left + itemRect.width / 2;

      // Default: right: 0 (dropdown extends LEFT from menu item) - good for right-side items
      // Flipped: left: 0 (dropdown extends RIGHT from menu item) - good for left-side items
      // Only flip for menu items in the LEFT 1/3 of viewport
      var oneThirdPoint = viewportWidth / 3;
      if (itemRect.left < oneThirdPoint) {
        dropdown.classList.add('is-flipped');
        // Arrow offset from left edge = trigger center - dropdown left (which is item left)
        dropdown.style.setProperty('--arrow-offset', Math.round(triggerCenter - itemRect.left) + 'px');
      } else {
        // Arrow offset from right edge = dropdown right (which is item right) - trigger center
        dropdown.style.setProperty('--arrow-offset', Math.round(itemRect.right - triggerCenter) + 'px');
      }
    }

    checkSubmenuOverflow(parent) {
      var submenu = parent.querySelector('.megamenu__simple-sub, .megamenu__sublinks');
      if (!submenu) return;

      // Reset first
      submenu.classList.remove('is-flipped');
      parent.classList.remove('is-sub-flipped');

      // Get positions
      var parentRect = parent.getBoundingClientRect();
      var viewportWidth = window.innerWidth;

      // Submenu default: left: 100% (opens to RIGHT)
      // Submenu flipped: right: 100% (opens to LEFT)
      // Flip when parent is past 2/3 of viewport (near right edge)
      var twoThirdsPoint = viewportWidth * (2 / 3);
      if (parentRect.left > twoThirdsPoint) {
        submenu.classList.add('is-flipped');
        parent.classList.add('is-sub-flipped');
      }
    }

    checkOverflow() {
      if (!this.list || !this.container) return;

      var containerWidth = this.container.clientWidth;

      // Calculate actual content width based on last item position
      var items = this.list.querySelectorAll('.megamenu__item');
      var lastItem = items.length > 0 ? items[items.length - 1] : null;
      var listWidth;

      if (lastItem) {
        // Get the right edge of the last item relative to the list
        var listRect = this.list.getBoundingClientRect();
        var lastItemRect = lastItem.getBoundingClientRect();
        listWidth = (lastItemRect.right - listRect.left) + this.scrollOffset;
      } else {
        listWidth = this.list.scrollWidth;
      }

      var isOverflowing = listWidth > containerWidth;
      var maxScroll = Math.max(0, listWidth - containerWidth);

      // Clamp scroll offset
      if (this.scrollOffset > maxScroll) {
        this.scrollOffset = maxScroll;
        this.applyScroll();
      }

      this.updateArrows(isOverflowing, maxScroll);
    }

    updateArrows(isOverflowing, maxScroll) {
      if (!this.arrowLeft || !this.arrowRight) return;

      if (!isOverflowing) {
        this.arrowLeft.hidden = true;
        this.arrowRight.hidden = true;
        this.scrollOffset = 0;
        this.applyScroll();
        return;
      }

      // Show/hide left arrow
      this.arrowLeft.hidden = this.scrollOffset <= 0;

      // Show/hide right arrow (add 5px buffer for rounding)
      this.arrowRight.hidden = this.scrollOffset >= maxScroll - 5;
    }

    applyScroll() {
      if (!this.list) return;
      this.list.style.transform = this.scrollOffset > 0 ? 'translateX(-' + this.scrollOffset + 'px)' : '';
    }

    scroll(direction) {
      if (!this.list || !this.container) return;

      var containerWidth = this.container.clientWidth;

      // Calculate actual content width based on last item position
      var items = this.list.querySelectorAll('.megamenu__item');
      var lastItem = items.length > 0 ? items[items.length - 1] : null;
      var listWidth;

      if (lastItem) {
        var listRect = this.list.getBoundingClientRect();
        var lastItemRect = lastItem.getBoundingClientRect();
        listWidth = (lastItemRect.right - listRect.left) + this.scrollOffset;
      } else {
        listWidth = this.list.scrollWidth;
      }

      var maxScroll = Math.max(0, listWidth - containerWidth);

      if (direction === 'left') {
        this.scrollOffset = Math.max(0, this.scrollOffset - this.scrollStep);
      } else {
        this.scrollOffset = Math.min(maxScroll, this.scrollOffset + this.scrollStep);
      }

      this.applyScroll();
      this.updateArrows(true, maxScroll);
    }
  }
  customElements.define('mega-menu', MegaMenu);

  /* -------------------------------------------------------------------------- */
  /*                              MOBILE MENU                                   */
  /* -------------------------------------------------------------------------- */

  class MobileMenu extends HTMLElement {
    connectedCallback() {
      this.overlay = this.querySelector('.mobile-menu__overlay');
      this.closeBtn = this.querySelector('.mobile-menu__close');
      this.drawer = this.querySelector('.mobile-menu__drawer');
      this.body = this.querySelector('.mobile-menu__body');

      this.bindEvents();
    }

    bindEvents() {
      // Close events
      if (this.overlay) {
        this.overlay.addEventListener('click', this.close.bind(this));
      }
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', this.close.bind(this));
      }

      // Submenu triggers
      this.querySelectorAll('.mobile-menu__trigger').forEach(function(trigger) {
        trigger.addEventListener('click', this.openSubmenu.bind(this));
      }.bind(this));

      // Back buttons
      this.querySelectorAll('.mobile-menu__back-btn').forEach(function(btn) {
        btn.addEventListener('click', this.closeSubmenu.bind(this));
      }.bind(this));

      // Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && this.classList.contains('show')) {
          this.close();
        }
      }.bind(this));
    }

    open() {
      this.classList.add('show');
      ThemeUtils.lockScroll();
      this.setAttribute('aria-hidden', 'false');
      ThemeUtils.trapFocus(this);
    }

    close() {
      this.classList.remove('show');
      ThemeUtils.unlockScroll();
      this.setAttribute('aria-hidden', 'true');
      ThemeUtils.releaseFocus(this);
      // Reset all submenus
      this.querySelectorAll('.mobile-menu__submenu.is-open').forEach(function(submenu) {
        submenu.classList.remove('is-open');
      });
    }

    openSubmenu(e) {
      var trigger = e.currentTarget;
      var item = trigger.closest('.mobile-menu__item');
      var submenu = item ? item.querySelector('.mobile-menu__submenu') : null;
      if (submenu) {
        submenu.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }

    closeSubmenu(e) {
      var btn = e.currentTarget;
      var submenu = btn.closest('.mobile-menu__submenu');
      if (submenu) {
        submenu.classList.remove('is-open');
        var item = submenu.closest('.mobile-menu__item');
        var trigger = item ? item.querySelector('.mobile-menu__trigger') : null;
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      }
    }
  }
  customElements.define('mobile-menu', MobileMenu);

  // Mobile menu open handler
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="open-mobile-menu"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var mobileMenu = document.querySelector('mobile-menu');
        if (mobileMenu && typeof mobileMenu.open === 'function') {
          mobileMenu.open();
        }
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                               TOAST MANAGER                                */
  /* -------------------------------------------------------------------------- */

  var ToastManager = {
    container: null,
    toasts: [],
    maxToasts: 5,
    defaultDuration: 3000,

    init: function() {
      if (!document.querySelector('.toast-container')) {
        var container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        this.container = container;
      } else {
        this.container = document.querySelector('.toast-container');
      }
    },

    show: function(message, type, duration) {
      var self = this;
      type = type || 'default';
      duration = duration || this.defaultDuration;

      if (!this.container) this.init();

      if (this.toasts.length >= this.maxToasts) {
        this.remove(this.toasts[0]);
      }

      var toast = this.createToast(message, type);
      this.container.appendChild(toast);
      this.toasts.push(toast);

      requestAnimationFrame(function() {
        toast.classList.add('toast-show');
      });

      if (duration > 0) {
        setTimeout(function() {
          self.remove(toast);
        }, duration);
      }

      return toast;
    },

    createToast: function(message, type) {
      var self = this;
      var wrapper = document.createElement('div');
      wrapper.className = 'toast-wrapper';

      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;

      var messageEl = document.createElement('div');
      messageEl.className = 'toast-message';
      messageEl.textContent = message;

      var closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', 'Đóng');
      closeBtn.innerHTML = '×';
      closeBtn.addEventListener('click', function() {
        self.remove(wrapper);
      });

      toast.appendChild(messageEl);
      toast.appendChild(closeBtn);
      wrapper.appendChild(toast);

      return wrapper;
    },

    remove: function(toast) {
      var self = this;
      if (!toast || !toast.parentNode) return;

      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');

      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        var index = self.toasts.indexOf(toast);
        if (index > -1) {
          self.toasts.splice(index, 1);
        }
      }, 300);
    }
  };

  // Global showToast helper
  window.showToast = function(message, type, duration) {
    return ToastManager.show(message, type, duration);
  };

  window.Toast = ToastManager;

  /* -------------------------------------------------------------------------- */
  /*                                CART MODAL                                  */
  /* -------------------------------------------------------------------------- */

  class CartModal extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.isLoading = false;
    }

    connectedCallback() {
      var self = this;
      this.overlay = ThemeUtils.qs(this, '.cart-modal-overlay');
      this.panel = ThemeUtils.qs(this, '.cart-modal-panel');
      this.itemsContainer = ThemeUtils.qs(this, '.cart-modal-items-list');
      this.itemsLoading = ThemeUtils.qs(this, '.cart-modal-items-loading');
      this.itemsEmpty = ThemeUtils.qs(this, '.cart-modal-items-empty');
      this.countEl = ThemeUtils.qs(this, '.cart-modal-count');
      this.totalEl = ThemeUtils.qs(this, '.cart-modal-total');

      this.debouncedUpdateQuantity = ThemeUtils.debounce(function(line, quantity) {
        self._updateQuantity(line, quantity);
      }, 300);

      this.querySelectorAll('[data-action="close-cart-modal"]').forEach(function(el) {
        el.addEventListener('click', function() {
          self.close();
        });
      });

      if (this.overlay) {
        this.overlay.addEventListener('click', function(e) {
          if (e.target === self.overlay) self.close();
        });
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });

      var cartEvents = (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.events) || {};
      var qtyEvent = cartEvents.quantity_changed || 'cart-quantity-changed';

      if (this.itemsContainer) {
        this.itemsContainer.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-action="remove-cart-item"]');
          if (btn) {
            e.preventDefault();
            self.removeItem(parseInt(btn.dataset.line));
          }
        });
      }

      document.addEventListener(qtyEvent, function(e) {
        if (e.target.closest('cart-modal') === self && e.detail && e.detail.line && e.detail.quantity !== undefined) {
          self.updateQuantity(e.detail.line, e.detail.quantity);
        }
      });
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.classList.add('show');
      ThemeUtils.lockScroll();
      ThemeUtils.trapFocus(this);
      this.loadCart();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.classList.remove('show');
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(this);
    }

    async loadCart() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.toggleLoading(true);

      try {
        const cart = await ThemeUtils.request({
          url: '/cart.js',
          method: 'GET'
        });
        this.updateTotals(cart);

        if (this.itemsContainer) {
          const itemHtml = await ThemeUtils.request({
            url: '/cart?view=item',
            method: 'GET',
            parser: 'text'
          });
          this.itemsContainer.innerHTML = itemHtml;
          const isEmpty = cart.item_count === 0;
          ThemeUtils.toggleClass(this.itemsContainer, 'hidden', isEmpty);
          if (this.itemsEmpty) ThemeUtils.toggleClass(this.itemsEmpty, 'hidden', !isEmpty);
        }

        if (typeof updateCartData === 'function') await updateCartData(cart);
      } catch (e) {
        if (this.itemsContainer) ThemeUtils.setHTML(this.itemsContainer, '<div class="text-center text-red-500 py-8">Lỗi tải giỏ hàng</div>');
      } finally {
        this.isLoading = false;
        this.toggleLoading(false);
      }
    }

    updateQuantity(line, quantity) {
      if (quantity < 1) return this.removeItem(line);
      this.debouncedUpdateQuantity(line, quantity);
    }

    async _updateQuantity(line, quantity) {
      const item = this.itemsContainer ? this.itemsContainer.querySelector('[data-line-item="' + line + '"]') : null;
      if (item) item.style.opacity = '0.5';

      try {
        const cart = await ThemeUtils.request({
          url: '/cart/change.js',
          method: 'POST',
          body: {
            line: line,
            quantity: quantity
          }
        });
        this.updateTotals(cart);

        if (item) {
          const updatedItem = cart.items[line - 1];
          if (updatedItem) {
            const priceEl = item.querySelector('.price-regular');
            if (priceEl && typeof formatMoney === 'function') {
              priceEl.textContent = formatMoney(updatedItem.line_price);
            }
          }
          item.style.opacity = '1';
        }

        if (typeof updateCartData === 'function') await updateCartData(cart);
      } catch (e) {
        if (item) item.style.opacity = '1';
        console.error('Cart update error:', e);
        if (typeof showToast === 'function') {
          showToast('Không thể cập nhật giỏ hàng. Vui lòng thử lại.', 'error', 3000);
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    }

    async removeItem(line) {
      var self = this;

      const item = this.itemsContainer ? this.itemsContainer.querySelector('[data-line-item="' + line + '"]') : null;
      if (item) item.style.opacity = '0.5';

      try {
        const cart = await ThemeUtils.request({
          url: '/cart/change.js',
          method: 'POST',
          body: {
            line: line,
            quantity: 0
          }
        });
        this.updateTotals(cart);

        if (item) {
          item.style.transition = 'all 0.3s';
          item.style.opacity = '0';
          item.style.height = item.offsetHeight + 'px';
          setTimeout(function() {
            item.style.height = '0';
            item.style.padding = '0';
            item.style.margin = '0';
            setTimeout(function() {
              item.remove();
            }, 300);
          }, 10);
        }

        if (cart.item_count === 0) {
          setTimeout(function() {
            if (self.itemsContainer) self.itemsContainer.classList.add('hidden');
            if (self.itemsEmpty) self.itemsEmpty.classList.remove('hidden');
          }, 350);
        }

        if (typeof updateCartData === 'function') await updateCartData(cart);
        if (typeof showToast === 'function') {
          showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'success', 2000);
        }
      } catch (e) {
        if (item) item.style.opacity = '1';
        console.error('Cart remove error:', e);
        if (typeof showToast === 'function') {
          showToast('Không thể xóa sản phẩm. Vui lòng thử lại.', 'error', 3000);
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    }

    updateTotals(cart) {
      ThemeUtils.setText(this.countEl, cart.item_count || 0);
      if (this.totalEl) this.totalEl.textContent = cart.total_price === 0 ? 'Liên hệ' : (typeof formatMoney === 'function' ? formatMoney(cart.total_price) : cart.total_price);
      document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = cart.item_count || 0;
      });
    }

    toggleLoading(show) {
      ThemeUtils.toggleClass(this.itemsLoading, 'hidden', !show);
      if (show) {
        if (this.itemsContainer) this.itemsContainer.classList.add('hidden');
        if (this.itemsEmpty) this.itemsEmpty.classList.add('hidden');
      }
    }
  }
  customElements.define('cart-modal', CartModal);

  function openCartModal() {
    const modal = document.querySelector('cart-modal');
    if (modal) modal.open();
  }
  window.openCartModal = openCartModal;

  document.addEventListener('cart:item_added', function() {
    var config = typeof themeConfig !== 'undefined' ? themeConfig.cart : {};
    var openModal = config && config.auto_open_modal;
    var openSidebar = config && config.auto_open_sidebar;
    if (openModal || openSidebar) openCartModal();
  });

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="open-cart-modal"], [data-action="open-cart-sidebar"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openCartModal();
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                SEARCH MODAL                                */
  /* -------------------------------------------------------------------------- */

  class SearchModal extends HTMLElement {
    constructor() {
      super();
      this.searchTimeout = null;
      this.debounceDelay = 300;
      this.searchController = null;
    }

    connectedCallback() {
      this.input = this.querySelector('.search-modal-input');
      this.resultsContainer = this.querySelector('.search-modal-results-content');
      this.loadingEl = this.querySelector('.search-modal-loading');
      this.form = this.querySelector('.search-modal-form');
      this.bindEvents();
    }

    bindEvents() {
      var self = this;

      document.addEventListener('click', function(e) {
        var openTrigger = e.target.closest('[data-action="open-search-modal"]');
        var closeTrigger = e.target.closest('[data-action="close-search-modal"]');
        var overlay = e.target.closest('.search-modal-overlay');

        if (openTrigger) {
          e.preventDefault();
          self.open();
        }
        if (closeTrigger || overlay) self.close();
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen()) self.close();
      });

      if (this.input) {
        this.input.addEventListener('input', function(e) {
          self.handleSearch(e.target.value);
        });

        if (this.form) {
          this.form.addEventListener('submit', function(e) {
            if (self.input.value.trim().length === 0) e.preventDefault();
          });
        }
      }
    }

    open() {
      var self = this;
      this.classList.add('show');
      setTimeout(function() {
        if (self.input) self.input.focus();
      }, 100);
      ThemeUtils.lockScroll();
      ThemeUtils.trapFocus(this);
    }

    close() {
      this.classList.remove('show');
      if (this.input) this.input.value = '';
      this.clearResults();
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(this);
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }
      if (this.searchController) {
        this.searchController.abort();
        this.searchController = null;
      }
    }

    isOpen() {
      return this.classList.contains('show');
    }

    handleSearch(query) {
      var self = this;
      var trimmedQuery = query.trim();
      if (this.searchTimeout) clearTimeout(this.searchTimeout);

      if (trimmedQuery.length < 2) {
        this.clearResults();
        return;
      }

      this.searchTimeout = setTimeout(function() {
        self.performSearch(trimmedQuery);
      }, this.debounceDelay);
    }

    performSearch(query) {
      var self = this;
      if (!this.resultsContainer) return;
      this.showLoading();

      if (this.searchController) {
        this.searchController.abort();
      }
      this.searchController = new AbortController();

      fetch('/search?type=product&q=' + encodeURIComponent(query) + '&view=smart', { signal: this.searchController.signal })
        .then(function(response) {
          if (!response.ok) throw new Error('Search request failed');
          return response.text();
        })
        .then(function(html) {
          self.displayResults(html);
        })
        .catch(function(error) {
          if (error.name === 'AbortError') return;
          console.error('Search error:', error);
          self.displayError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.');
        })
        .finally(function() {
          if (self.searchController && self.searchController.signal.aborted) {
            return;
          }
          self.hideLoading();
          self.searchController = null;
        });
    }

    displayResults(html) {
      var self = this;
      if (!this.resultsContainer) return;
      this.resultsContainer.innerHTML = html;

      this.resultsContainer.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          self.close();
        });
      });
    }

    displayError(message) {
      if (!this.resultsContainer) return;
      this.resultsContainer.innerHTML = '<div class="search-modal-error"><p>' + message + '</p></div>';
    }

    clearResults() {
      if (!this.resultsContainer) return;
      this.resultsContainer.innerHTML = '<div class="search-modal-empty"><p>Nhập từ khóa để tìm kiếm sản phẩm...</p></div>';
    }

    showLoading() {
      if (this.loadingEl) this.loadingEl.classList.remove('hidden');
    }

    hideLoading() {
      if (this.loadingEl) this.loadingEl.classList.add('hidden');
    }
  }
  customElements.define('search-modal', SearchModal);

  /* -------------------------------------------------------------------------- */
  /*                                SHARE BUTTONS                               */
  /* -------------------------------------------------------------------------- */
  class ShareButtons extends HTMLElement {
    connectedCallback() {
      this.bindEvents();
    }

    bindEvents() {
      var self = this;

      this.querySelectorAll('.share-buttons__copy').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var url = this.dataset.url;
          self.copyToClipboard(url, this);
        });
      });
    }

    copyToClipboard(text, button) {
      var self = this;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(function() {
            self.showCopiedState(button);
          })
          .catch(function() {
            self.fallbackCopy(text, button);
          });
      } else {
        this.fallbackCopy(text, button);
      }
    }

    fallbackCopy(text, button) {
      var input = document.createElement('input');
      input.value = text;
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showCopiedState(button);
    }

    showCopiedState(button) {
      button.classList.add('copied');
      button.setAttribute('aria-label', 'Đã sao chép liên kết');

      if (typeof showToast === 'function') {
        showToast('Đã sao chép liên kết', 'success');
      }
      setTimeout(function() {
        button.classList.remove('copied');
        button.setAttribute('aria-label', 'Sao chép liên kết bài viết');
      }, 2000);
    }
  }
  customElements.define('share-buttons', ShareButtons);

  /* -------------------------------------------------------------------------- */
  /*                                 CONTENT TOC                                */
  /* -------------------------------------------------------------------------- */
  class ContentToc extends HTMLElement {
    connectedCallback() {
      this.contentSelector = this.getAttribute('content-selector') || '[itemprop="articleBody"]';
      this.headingLevels = this.getAttribute('data-heading-levels') || 'h2h3';
      this.showNumbers = this.hasAttribute('data-show-numbers');
      this.collapsed = this.hasAttribute('data-collapsed');
      this.headings = [];
      this.buildToc();
      this.bindEvents();
      if (this.collapsed) this.setupCollapse();
    }

    getHeadingSelector() {
      switch (this.headingLevels) {
        case 'h2':
          return 'h2';
        case 'h2h3h4':
          return 'h2, h3, h4';
        default:
          return 'h2, h3';
      }
    }

    buildToc() {
      var self = this;
      var content = document.querySelector(this.contentSelector);
      if (!content) return;

      var headings = content.querySelectorAll(this.getHeadingSelector());
      if (headings.length === 0) {
        this.style.display = 'none';
        return;
      }

      var tocList = document.createElement('ul');
      tocList.className = 'toc__list';

      var h2Count = 0;
      var h3Count = 0;
      var h4Count = 0;

      headings.forEach(function(heading, index) {
        var id = heading.id || 'toc-' + index;
        heading.id = id;
        self.headings.push(heading);

        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + id;
        link.className = 'toc__link';

        var text = heading.textContent;
        if (self.showNumbers) {
          var num = '';
          if (heading.tagName === 'H2') {
            h2Count++;
            h3Count = 0;
            h4Count = 0;
            num = h2Count + '. ';
          } else if (heading.tagName === 'H3') {
            h3Count++;
            h4Count = 0;
            num = h2Count + '.' + h3Count + '. ';
          } else {
            h4Count++;
            num = h2Count + '.' + h3Count + '.' + h4Count + '. ';
          }
          text = num + text;
        }
        link.textContent = text;

        if (heading.tagName === 'H2') {
          li.className = 'toc__item toc__item--h2';
        } else if (heading.tagName === 'H3') {
          li.className = 'toc__item toc__item--h3';
        } else {
          li.className = 'toc__item toc__item--h4';
        }

        li.appendChild(link);
        tocList.appendChild(li);
      });

      var title = this.querySelector('.toc__title');
      if (title) {
        title.insertAdjacentElement('afterend', tocList);
      } else {
        this.appendChild(tocList);
      }
    }

    bindEvents() {
      var self = this;

      this.querySelectorAll('.toc__link').forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          var targetId = this.getAttribute('href').substring(1);
          var target = document.getElementById(targetId);
          if (target) {
            var offset = 100;
            var top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
              top: top,
              behavior: 'smooth'
            });
            history.pushState(null, null, '#' + targetId);
          }
        });
      });

      this._throttledUpdate = ThemeUtils.debounce(function() {
        self.updateActiveState();
      }, 100);
      window.addEventListener('scroll', this._throttledUpdate);
    }

    disconnectedCallback() {
      if (this._throttledUpdate) {
        window.removeEventListener('scroll', this._throttledUpdate);
      }
    }

    updateActiveState() {
      var self = this;
      var scrollPos = window.scrollY + 120;
      var activeIndex = -1;

      this.headings.forEach(function(heading, index) {
        if (heading.offsetTop <= scrollPos) {
          activeIndex = index;
        }
      });

      this.querySelectorAll('.toc__item').forEach(function(item, index) {
        if (index === activeIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    setupCollapse() {
      var self = this;
      var title = this.querySelector('.toc__title');
      var list = this.querySelector('.toc__list');
      if (!title || !list) return;

      title.classList.add('toc__title--collapsible');
      list.style.display = 'none';
      this.classList.add('collapsed');

      title.addEventListener('click', function() {
        if (self.classList.contains('collapsed')) {
          list.style.display = '';
          self.classList.remove('collapsed');
        } else {
          list.style.display = 'none';
          self.classList.add('collapsed');
        }
      });
    }
  }
  customElements.define('content-toc', ContentToc);

  /* -------------------------------------------------------------------------- */
  /*                                TOC FLOATING                                */
  /* -------------------------------------------------------------------------- */

  class TocFloating extends HTMLElement {
    connectedCallback() {
      var self = this;
      // Wait for content-toc build
      setTimeout(function() {
        self.inlineToc = document.querySelector('content-toc:not([floating])');
        self.isOpen = false;
        self.buildFloating();
        self.bindEvents();
      }, 100);
    }

    buildFloating() {
      var self = this;
      if (!this.inlineToc) {
        this.style.display = 'none';
        return;
      }

      this.trigger = this.querySelector('.toc-floating__trigger');
      this.panel = this.querySelector('.toc-floating__panel');
      this.overlay = this.querySelector('.toc-floating__overlay');

      if (!this.trigger || !this.panel) return;

      var tocContent = this.inlineToc.querySelector('.toc__list');
      if (tocContent) {
        var clonedList = tocContent.cloneNode(true);
        clonedList.style.display = '';
        this.panel.appendChild(clonedList);
      }
    }

    bindEvents() {
      var self = this;

      if (this.trigger) {
        this.trigger.addEventListener('click', function() {
          self.toggle();
        });
      }

      if (this.overlay) {
        this.overlay.addEventListener('click', function() {
          self.close();
        });
      }

      var closeBtn = this.querySelector('.toc-floating__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          self.close();
        });
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });

      this._scrollCheck = ThemeUtils.debounce(function() {
        self.checkVisibility();
      }, 100);
      window.addEventListener('scroll', this._scrollCheck);

      if (this.panel) {
        this.panel.querySelectorAll('.toc__link').forEach(function(link) {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = this.getAttribute('href').substring(1);
            var target = document.getElementById(targetId);
            if (target) {
              self.close();
              var offset = 100;
              var top = target.getBoundingClientRect().top + window.scrollY - offset;
              window.scrollTo({
                top: top,
                behavior: 'smooth'
              });
              history.pushState(null, null, '#' + targetId);
            }
          });
        });
      }
    }

    checkVisibility() {
      if (!this.inlineToc) return;
      var tocBottom = this.inlineToc.offsetTop + this.inlineToc.offsetHeight;
      if (window.scrollY > tocBottom) {
        this.classList.add('visible');
      } else {
        this.classList.remove('visible');
        this.close();
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.classList.add('open');
      ThemeUtils.lockScroll();
    }

    close() {
      this.isOpen = false;
      this.classList.remove('open');
      ThemeUtils.unlockScroll();
    }
  }
  customElements.define('toc-floating', TocFloating);

  /* -------------------------------------------------------------------------- */
  /*                              NEWSLETTER MODAL                              */
  /* -------------------------------------------------------------------------- */

  class NewsletterModal extends HTMLElement {
    constructor() {
      super();
      this.storageKey = 'newsletter_popup_closed';
      this.timeToShow = 3000;
    }

    connectedCallback() {
      this.overlay = this.closest('.newsletter-popup-wrapper') || this.querySelector('.newsletter-popup-wrapper');
      this.popup = this.querySelector('#newsletter-popup');
      this.closeButton = this.querySelector('[data-action="close-newsletter-popup"]');
      this.form = this.querySelector('form');
      this.emailInput = this.querySelector('input[name="contact[email]"]');

      if (this.popup) {
        this.bindEvents();
        this.checkPopupStatus();
      }
    }

    bindEvents() {
      var self = this;
      if (this.closeButton) {
        this.closeButton.addEventListener('click', function() {
          self.closePopup();
        });
      }
      if (this.form) {
        this.form.addEventListener('submit', function(e) {
          self.handleFormSubmit(e);
        });
      }
    }

    checkPopupStatus() {
      var self = this;
      var isClosed = localStorage.getItem(this.storageKey);
      if (!isClosed) {
        setTimeout(function() {
          self.showPopup();
        }, this.timeToShow);
      }
    }

    showPopup() {
      if (this.popup) {
        this.popup.classList.add('active');
        ThemeUtils.lockScroll();
        ThemeUtils.trapFocus(this.popup);
      }
    }

    closePopup() {
      if (this.popup) {
        this.popup.classList.remove('active');
        ThemeUtils.unlockScroll();
        ThemeUtils.releaseFocus(this.popup);
      }
      localStorage.setItem(this.storageKey, 'true');
    }

    handleFormSubmit(event) {
      var email = this.emailInput.value.trim();
      if (this.validateEmail(email)) {
        this.closePopup();
        // Allow form submission normally
      } else {
        event.preventDefault();
        alert('Vui lòng nhập địa chỉ email hợp lệ.');
      }
    }

    validateEmail(email) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    }
  }
  customElements.define('newsletter-modal', NewsletterModal);

  /* -------------------------------------------------------------------------- */
  /*                                QUICKVIEW MODAL                             */
  /* -------------------------------------------------------------------------- */
  class QuickviewModal extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.isLoading = false;
      this.currentProduct = null;
      this.currentProductHandle = null;
      this.currentVariantId = null;
    }

    connectedCallback() {
      var self = this;
      this.overlay = this.querySelector('.quickview-modal-overlay');
      this.panel = this.querySelector('.quickview-modal-panel');
      this.content = this.querySelector('.quickview-modal-body');
      this.loading = this.querySelector('.quickview-modal-loading');

      // Bind events
      this.querySelectorAll('[data-action="close-quickview"]').forEach(function(el) {
        el.addEventListener('click', function() {
          self.close();
        });
      });

      // Close on overlay click
      if (this.overlay) {
        this.overlay.addEventListener('click', function(e) {
          if (e.target === self.overlay) {
            self.close();
          }
        });
      }

      // Close on ESC key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) {
          self.close();
        }
      });

      // Handle thumbnail clicks
      if (this.content) {
        this.content.addEventListener('click', function(e) {
          const thumbnail = e.target.closest('.quickview-thumbnail');
          if (thumbnail) {
            e.preventDefault();
            const imageSrc = thumbnail.dataset.imageSrc;
            const imageAlt = thumbnail.dataset.imageAlt;
            if (imageSrc) {
              self.updateFeaturedImage(imageSrc, imageAlt);
              // Update active thumbnail
              document.querySelectorAll('.quickview-thumbnail').forEach(function(thumb) {
                thumb.classList.remove('border-gray-600', 'dark:border-gray-400');
                thumb.classList.add('border-transparent');
              });
              thumbnail.classList.remove('border-transparent');
              thumbnail.classList.add('border-gray-600', 'dark:border-gray-400');
            }
          }
        });

        // Handle variant changes from radio inputs
        this.content.addEventListener('change', function(e) {
          if (e.target.closest('product-variant-picker')) {
            // Small delay to ensure variant picker has processed the change
            setTimeout(function() {
              self.handleVariantChange();
            }, 50);
          }
        });

        // Handle add to cart
        this.content.addEventListener('click', function(e) {
          const addBtn = e.target.closest('[data-product-add]');
          if (addBtn && !addBtn.disabled) {
            e.preventDefault();
            self.handleAddToCart();
          }
        });

        // Handle quickview variant change
        this.content.addEventListener('quickview:variant_change', function(e) {
          self.handleQuickviewVariantChange(e.detail);
        });
      }
    }

    handleQuickviewVariantChange(variant) {
      if (!this.content) return;

      // Update price - use formatPrice like ProductTemplate
      var priceEl = this.content.querySelector('[data-product-price]');
      var compareEl = this.content.querySelector('[data-product-compare]');
      var saleEl = this.content.querySelector('[data-product-sale]');

      if (variant && variant.price !== undefined) {
        if (priceEl) {
          if (variant.price === 0) {
            priceEl.textContent = 'Liên hệ';
          } else {
            priceEl.textContent = typeof formatPrice === 'function' ? formatPrice(variant.price) : (typeof formatMoney === 'function' ? formatMoney(variant.price) : variant.price);
          }
        }

        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          if (compareEl) {
            compareEl.style.display = 'block';
            compareEl.textContent = typeof formatPrice === 'function' ? formatPrice(variant.compare_at_price) : (typeof formatMoney === 'function' ? formatMoney(variant.compare_at_price) : variant.compare_at_price);
          }
          if (saleEl) {
            saleEl.style.display = 'block';
            var percent = Math.round((variant.compare_at_price - variant.price) * 100 / variant.compare_at_price);
            saleEl.textContent = '-' + percent + '%';
          }
        } else {
          if (compareEl) compareEl.style.display = 'none';
          if (saleEl) saleEl.style.display = 'none';
        }
      }

      // Update availability
      var availableEl = this.content.querySelector('[data-product-available]');
      var addBtn = this.content.querySelector('[data-product-add]');
      var addText = this.content.querySelector('[data-add-text]');

      if (variant) {
        if (availableEl) {
          availableEl.textContent = variant.available ? 'Còn hàng' : 'Hết hàng';
          availableEl.className = variant.available ? 'quickview-product__status--available' : 'quickview-product__status--unavailable';
        }
        if (addBtn) {
          addBtn.disabled = !variant.available;
        }
        if (addText) {
          addText.textContent = variant.available ? 'Thêm vào giỏ' : 'Hết hàng';
        }

        // Update current variant id
        this.currentVariantId = variant.id;
      }

      // Update SKU
      var skuEl = this.content.querySelector('[data-product-sku]');
      if (skuEl && variant && variant.sku) {
        skuEl.textContent = variant.sku;
      }

      // Update Swiper slide to variant image - same logic as ProductTemplate
      if (variant && variant.image && this.quickviewSwiper) {
        var imageSrc = typeof variant.image === 'string' ? variant.image : (variant.image.src || variant.image.url);
        if (!imageSrc) return;

        var self = this;
        var slides = this.content.querySelectorAll('.quickview-product__slider .swiper-slide img');
        var getFilename = function(url) {
          return url.split('/').pop().split('?')[0].replace(/(_\d+x\d+)/, '');
        };

        for (var i = 0; i < slides.length; i++) {
          if (getFilename(slides[i].src) === getFilename(imageSrc)) {
            this.quickviewSwiper.slideTo(i);
            break;
          }
        }
      }
    }

    async open(productHandle) {
      var self = this;
      if (this.isOpen && this.currentProductHandle === productHandle) return;
      // Close viewed modal if open
      var viewedModal = document.querySelector('viewed-modal');
      if (viewedModal && viewedModal.close && typeof viewedModal.close === 'function') {
        viewedModal.close();
      }

      this.currentProductHandle = productHandle;
      this.isOpen = true;
      this.classList.remove('hidden');
      ThemeUtils.lockScroll();
      ThemeUtils.trapFocus(this);

      // Trigger animation
      setTimeout(function() {
        if (self.panel) {
          self.panel.classList.remove('scale-95', 'opacity-0');
          self.panel.classList.add('scale-100', 'opacity-100');
        }
      }, 10);

      // Load product
      await this.loadProduct(productHandle);
    }

    close() {
      var self = this;
      if (!this.isOpen) return;

      this.isOpen = false;
      if (this.panel) {
        this.panel.classList.remove('scale-100', 'opacity-100');
        this.panel.classList.add('scale-95', 'opacity-0');
      }
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(this);

      // Clean up document-level variant:change listener
      if (this.documentVariantChangeHandler) {
        document.removeEventListener('variant:change', this.documentVariantChangeHandler, true);
        this.documentVariantChangeHandler = null;
      }

      setTimeout(function() {
        self.classList.add('hidden');
        if (self.content) self.content.innerHTML = '';
        self.currentProductHandle = null;
        self.currentVariantId = null;
        self.currentProduct = null;
      }, 300);
    }

    async loadProduct(handle) {
      if (this.isLoading) return;
      this.isLoading = true;
      this.showLoading();

      try {
        const html = await ThemeUtils.request({
          url: '/search?q=filter=(handle:product=' + encodeURIComponent(handle) + ')&view=quickview',
          method: 'GET',
          parser: 'text'
        });
        if (this.content) this.content.innerHTML = html;

        var scriptTag = this.content ? (this.content.querySelector('script[type="application/json"][id="quickview-product-json"]') || this.content.querySelector('script[type="application/json"][id="quickview-variant-json"]')) : null;
        if (!scriptTag) {
          scriptTag = this.content ? this.content.querySelector('script[type="application/json"]') : null;
        }
        if (scriptTag && scriptTag.textContent) {
          try {
            this.currentProduct = JSON.parse(scriptTag.textContent.trim());
            if (typeof themeConfig !== 'undefined' && themeConfig.quickview && themeConfig.quickview.data) {
              themeConfig.quickview.data = this.currentProduct;
            }
          } catch (e) {
            console.warn('ProductVariantPicker: Failed to parse JSON from script tag', e);
          }
        }

        await new Promise(function(resolve) {
          setTimeout(resolve, 200);
        });

        if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length > 1) {
          await this.initializeVariantPicker();
        } else if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length === 1) {
          this.currentVariantId = this.currentProduct.variants[0].id;
        }

        this.initializeQuantitySelector();
        this.initializeSwiper();
      } catch (error) {
        console.error('Error loading product:', error);
        if (this.content) this.content.innerHTML = '<div class="text-center text-red-500 py-12">Có lỗi xảy ra khi tải sản phẩm</div>';
      } finally {
        this.isLoading = false;
        this.hideLoading();
      }
    }

    async initializeVariantPicker() {
      var self = this;
      if (!this.content) return;
      const variantPicker = this.content.querySelector('product-variant-picker, quickview-variant-picker');
      if (!variantPicker) {
        console.warn('Quickview: Variant picker not found');
        return;
      }
      if (variantPicker && typeof variantPicker.init === 'function') variantPicker.init();
      if (!variantPicker.variants || variantPicker.variants.length === 0) {
        if (typeof variantPicker.connectedCallback === 'function') {
          variantPicker.connectedCallback();
        }
        // Wait for initialization to complete
        await new Promise(function(resolve) {
          setTimeout(resolve, 200);
        });

        // Verify variants were set correctly
        if (!variantPicker.variants || variantPicker.variants.length === 0) {
          console.warn('Quickview: Variant picker variants not set after initialization');
          // Try to set variants directly
          if (themeConfig.quickview.data && themeConfig.quickview.data.variants) {
            variantPicker.variants = themeConfig.quickview.data.variants;
            variantPicker.optionsCount = themeConfig.quickview.data.options ? themeConfig.quickview.data.options.length : 0;
          }
        }

        // Force select first available variant
        if (typeof variantPicker.selectFirstAvailableVariant === 'function') {
          variantPicker.selectFirstAvailableVariant();
        }
      } else {
        // Already initialized, just select first variant
        if (typeof variantPicker.selectFirstAvailableVariant === 'function') {
          variantPicker.selectFirstAvailableVariant();
        }
      }

      // Wait a bit more for custom elements to be ready
      await new Promise(function(resolve) {
        setTimeout(resolve, 100);
      });

      // Initialize variant picker images (must be before restore)
      this.initializeVariantPickerImages();

      // Ensure first option is checked and styled correctly (must be before restore)
      this.ensureFirstVariantSelected();

      // Wait a bit for ensureFirstVariantSelected to complete
      await new Promise(function(resolve) {
        setTimeout(resolve, 100);
      });

      // Force update availability one more time before restoring
      // This ensures all options are properly marked based on current selections
      if (typeof variantPicker.updateAvailability === 'function' && variantPicker.selects && variantPicker.variants) {
        const selectedValues = Array.from(variantPicker.selects).map(function(select) {
          const checkedInput = select.querySelector('input[type="radio"]:checked');
          return checkedInput ? checkedInput.value : null;
        });
        // Call updateAvailability with current selected values
        variantPicker.updateAvailability(selectedValues);
      }

      // Restore original product data AFTER all initialization is complete
      // Variant picker already has variants stored in its instance, so it will continue working
      if (this.currentProduct) {
        if (themeConfig.product) themeConfig.product.data = this.currentProduct;
      } else if (themeConfig.product && themeConfig.product.data === themeConfig.quickview.data) {
        // Only clear if we set it (don't clear if it was already set to something else)
        delete themeConfig.product.data;
      }

      // Set initial variant ID
      const quickviewProduct = themeConfig.quickview.data;
      const firstVariant = variantPicker.getSelectedVariant ? variantPicker.getSelectedVariant() : null;
      if (firstVariant) {
        this.currentVariantId = firstVariant.id;
        // Update initial price and availability
        this.updatePrice(firstVariant.price, firstVariant.compare_at_price);
        this.updateAvailability(firstVariant.available);
        this.updateAddToCartButton(firstVariant.available, firstVariant.price);
      } else if (quickviewProduct.variants && quickviewProduct.variants.length > 0) {
        this.currentVariantId = quickviewProduct.variants[0].id;
      }

      // Listen for variant change events directly on variant picker
      const variantChangeHandler = function(e) {
        // Event detail contains the variant object
        if (e.detail) {
          self.handleVariantChange(e.detail);
        } else {
          // Fallback: get variant from picker
          self.handleVariantChange();
        }
      };

      // Remove old listener if exists
      if (this.variantChangeHandler) {
        variantPicker.removeEventListener('variant:change', this.variantChangeHandler);
      }

      this.variantChangeHandler = variantChangeHandler;
      variantPicker.addEventListener('variant:change', variantChangeHandler);

      // Also listen on document as fallback
      const documentVariantChangeHandler = function(e) {
        // Only handle if event originated from this quickview's variant picker
        if (e.target && self.content && self.content.contains(e.target)) {
          if (e.detail) {
            self.handleVariantChange(e.detail);
          } else {
            self.handleVariantChange();
          }
        }
      };

      if (this.documentVariantChangeHandler) {
        document.removeEventListener('variant:change', this.documentVariantChangeHandler);
      }
      this.documentVariantChangeHandler = documentVariantChangeHandler;
      document.addEventListener('variant:change', documentVariantChangeHandler, true);
    }

    /**
     * Handle variant change
     */
    handleVariantChange(variantFromEvent = null) {
      if (typeof themeConfig === 'undefined' || !themeConfig.quickview || !themeConfig.quickview.data) return;

      const variantPicker = this.content ? this.content.querySelector('product-variant-picker') : null;
      if (!variantPicker) return;

      // Get selected variant - prefer variant from event, otherwise get from picker
      let selectedVariant = variantFromEvent;
      if (!selectedVariant && variantPicker.getSelectedVariant) {
        selectedVariant = variantPicker.getSelectedVariant();
      }

      if (!selectedVariant) {
        console.warn('Quickview: No variant selected');
        return;
      }

      this.currentVariantId = selectedVariant.id;

      // Update price
      this.updatePrice(selectedVariant.price, selectedVariant.compare_at_price);

      // Update availability
      this.updateAvailability(selectedVariant.available);

      // Update image if variant has image
      if (selectedVariant.featured_image) {
        const imageSrc = typeof selectedVariant.featured_image === 'string' ?
          selectedVariant.featured_image :
          (selectedVariant.featured_image.src || selectedVariant.featured_image);
        const quickviewProduct = themeConfig.quickview.data;
        const imageAlt = typeof selectedVariant.featured_image === 'object' && selectedVariant.featured_image.alt ?
          selectedVariant.featured_image.alt :
          (quickviewProduct.title || '');
        this.updateFeaturedImage(imageSrc, imageAlt);
      }

      // Update add to cart button
      this.updateAddToCartButton(selectedVariant.available, selectedVariant.price);
    }

    /**
     * Update price display
     */
    updatePrice(price, comparePrice) {
      if (!this.content) return;
      const priceCurrent = this.content.querySelector('.quickview-price-current');
      const priceCompare = this.content.querySelector('.quickview-price-compare');
      const priceBadge = this.content.querySelector('.quickview-price-badge');

      if (priceCurrent) {
        if (price === 0) {
          priceCurrent.textContent = 'Liên hệ';
          priceCurrent.className = 'text-xl font-bold text-red-500';
        } else {
          priceCurrent.textContent = ThemeUtils.formatMoney(price);
          priceCurrent.className = 'quickview-price-current text-2xl font-bold text-red-500 dark:text-red-400';
        }
      }

      if (comparePrice && comparePrice > price) {
        if (priceCompare) {
          priceCompare.textContent = ThemeUtils.formatMoney(comparePrice);
          priceCompare.classList.remove('hidden');
        }

        if (priceBadge) {
          const discount = Math.round((comparePrice - price) * 100 / comparePrice);
          priceBadge.textContent = '-' + discount + '%';
          priceBadge.classList.remove('hidden');
        }
      } else {
        if (priceCompare) priceCompare.classList.add('hidden');
        if (priceBadge) priceBadge.classList.add('hidden');
      }
    }

    /**
     * Update availability display
     */
    updateAvailability(available) {
      if (!this.content) return;
      const availabilityEl = this.content.querySelector('.quickview-product-availability');
      if (!availabilityEl) return;

      if (available) {
        availabilityEl.innerHTML = '<span class="inline-flex items-center gap-2 text-green-600 dark:text-green-400">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' +
          '</svg>' +
          'Còn hàng' +
          '</span>';
      } else {
        availabilityEl.innerHTML = '<span class="inline-flex items-center gap-2 text-red-600 dark:text-red-400">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' +
          '</svg>' +
          'Tạm hết hàng' +
          '</span>';
      }
    }

    /**
     * Update featured image
     */
    updateFeaturedImage(src, alt) {
      if (!this.content) return;
      const featuredImage = this.content.querySelector('#quickview-featured-image');
      if (featuredImage) {
        featuredImage.src = src;
        featuredImage.alt = alt || '';
      }
    }

    /**
     * Update add to cart button
     */
    updateAddToCartButton(available, price) {
      if (!this.content) return;
      const addBtn = this.content.querySelector('[data-action="quickview-add-to-cart"]');
      const addBtnText = this.content.querySelector('.quickview-add-to-cart-text');

      if (!addBtn) return;

      if (price === 0) {
        addBtn.disabled = false;
        if (addBtnText) addBtnText.textContent = 'Liên hệ';
      } else if (available) {
        addBtn.disabled = false;
        if (addBtnText) addBtnText.textContent = 'Thêm vào giỏ';
      } else {
        addBtn.disabled = true;
        if (addBtnText) addBtnText.textContent = 'Tạm hết hàng';
      }
    }

    /**
     * Initialize variant picker images
     */
    initializeVariantPickerImages() {
      if (!this.content) return;
      // Find all variant picker image elements
      const imageElements = this.content.querySelectorAll('product-variant-picker-image');
      if (imageElements.length === 0) return;

      // Ensure themeConfig.quickview is set
      if (typeof themeConfig === 'undefined' || !themeConfig.quickview || !themeConfig.quickview.data) {
        console.warn('Quickview: Cannot initialize variant picker images - themeConfig.quickview not set');
        return;
      }

      // Temporarily set product data for variant picker image compatibility
      const originalProductData = themeConfig.product ? themeConfig.product.data : null;
      themeConfig.product = themeConfig.product || {};
      themeConfig.product.data = themeConfig.quickview.data;

      // Force initialize each image element
      imageElements.forEach(function(imgEl) {
        // Check if already initialized
        if (imgEl.innerHTML && imgEl.innerHTML.trim() !== '') {
          return; // Already has content
        }

        // Force call connectedCallback if available
        if (typeof imgEl.connectedCallback === 'function') {
          imgEl.connectedCallback();
        } else if (typeof imgEl.buildImage === 'function') {
          // Direct call to buildImage if available
          imgEl.buildImage();
        } else {
          // Manual initialization
          const option = imgEl.dataset.option;
          const value = imgEl.dataset.value;
          const quickviewProduct = themeConfig.quickview.data;
          if (option && value && quickviewProduct && quickviewProduct.variants) {
            // Find variant with matching option value that has an image
            const variant = quickviewProduct.variants.find(function(v) {
              if (!v || !v[option]) return false;
              return v[option] == value && v.image;
            });

            if (variant && variant.image) {
              let imageSrc = null;
              if (typeof variant.image === 'string') {
                imageSrc = variant.image.trim();
              } else if (variant.image && typeof variant.image === 'object') {
                imageSrc = variant.image.src || variant.image.url || null;
              }

              if (imageSrc) {
                // Normalize image source
                try {
                  imageSrc = ThemeUtils.resizeImage(imageSrc);
                } catch (e) {
                  console.warn('Quickview: Error resizing image', e);
                }

                imgEl.innerHTML = '<img width="40" height="40" src="' + imageSrc + '" alt="' + value + '" loading="lazy" decoding="async"/>';
              }
            }
          }
        }
      });

      // Restore original product data
      if (originalProductData) {
        themeConfig.product.data = originalProductData;
      } else if (themeConfig.product.data === themeConfig.quickview.data) {
        delete themeConfig.product.data;
      }
    }

    /**
     * Ensure first variant option is selected and styled
     */
    ensureFirstVariantSelected() {
      if (!this.content) return;
      const variantPicker = this.content.querySelector('product-variant-picker');
      if (!variantPicker) return;

      // Check if variant picker has selectFirstAvailableVariant method
      if (typeof variantPicker.selectFirstAvailableVariant === 'function') {
        variantPicker.selectFirstAvailableVariant();
      } else {
        // Fallback: manually check first radio in each group
        const pickerItems = variantPicker.querySelectorAll('product-variant-picker-item');
        pickerItems.forEach(function(item) {
          // Check if any radio is already checked in this group
          const checkedRadio = item.querySelector('input[type="radio"]:checked');
          if (!checkedRadio) {
            // Find first available (not sold_out) radio input in this group
            const radios = item.querySelectorAll('input[type="radio"]');
            for (let radio of radios) {
              const itemEl = radio.closest('.variant-picker__item');
              if (itemEl && !itemEl.classList.contains('sold_out')) {
                radio.checked = true;
                // Trigger change event to update UI
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
            // If no available option, check first one anyway
            if (radios.length > 0 && !item.querySelector('input[type="radio"]:checked')) {
              radios[0].checked = true;
              radios[0].dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      }
    }

    /**
     * Initialize quantity selector
     */
    initializeQuantitySelector() {
      if (!this.content) return;
      const quantitySelector = this.content.querySelector('quantity-selector');
      if (quantitySelector && quantitySelector.connectedCallback) {
        quantitySelector.connectedCallback();
      }
    }

    /**
     * Handle add to cart
     */
    async handleAddToCart() {
      // Use currentVariantId (already set by handleQuickviewVariantChange)
      if (!this.currentVariantId) {
        // Fallback: get from quickview data
        const quickviewProduct = themeConfig.quickview ? themeConfig.quickview.data : null;
        if (quickviewProduct && quickviewProduct.variants && quickviewProduct.variants.length > 0) {
          const firstAvailable = quickviewProduct.variants.find(function(v) {
            return v.available;
          });
          const fallbackVariant = firstAvailable || quickviewProduct.variants[0];
          this.currentVariantId = fallbackVariant.id;
        }
      }

      if (!this.currentVariantId) {
        if (typeof showToast === 'function') showToast('Vui lòng chọn đầy đủ các tùy chọn sản phẩm', 'error');
        return;
      }

      // Get quantity
      const quantityInput = this.content ? this.content.querySelector('quantity-selector input') : null;
      const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

      // Get add button
      const addBtn = this.content ? this.content.querySelector('[data-product-add]') : null;
      const addBtnText = this.content ? this.content.querySelector('[data-add-text]') : null;
      const originalText = addBtnText ? addBtnText.textContent : '';

      // Disable button and show loading
      if (addBtn) {
        addBtn.disabled = true;
        if (addBtnText) addBtnText.textContent = 'Đang thêm...';
      }

      try {
        const data = await ThemeUtils.request({
          url: '/cart/add.js',
          method: 'POST',
          body: {
            id: this.currentVariantId,
            quantity: quantity
          }
        });

        // Update cart data
        if (typeof ThemeUtils !== 'undefined' && typeof ThemeUtils.updateCartData === 'function') {
          await ThemeUtils.updateCartData(data);
        } else if (typeof updateCartData === 'function') {
          await updateCartData(data);
        }

        // Dispatch event
        document.dispatchEvent(new CustomEvent('cart:item_added', { detail: data }));

        // Open cart sidebar if enabled
        if (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.auto_open_sidebar) {
          if (typeof openCartSidebar === 'function') {
            openCartSidebar();
          } else if (typeof openCartModal === 'function') {
            openCartModal();
          }
        }

        // Close quickview
        this.close();

      } catch (error) {
        console.error('Add to cart error:', error);
        if (typeof showToast === 'function') showToast('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau', 'error');
      } finally {
        // Re-enable button
        if (addBtn) {
          addBtn.disabled = false;
          if (addBtnText) addBtnText.textContent = originalText;
        }
      }
    }

    /**
     * Show loading state
     */
    showLoading() {
      if (this.loading) {
        this.loading.classList.remove('hidden');
      }
      if (this.content) {
        this.content.classList.add('hidden');
      }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
      if (this.loading) {
        this.loading.classList.add('hidden');
      }
      if (this.content) {
        this.content.classList.remove('hidden');
      }
    }

    initializeSwiper() {
      if (!this.content || typeof Swiper === 'undefined') return;

      var self = this;
      var mainEl = this.content.querySelector('.quickview-product__slider');
      var thumbsEl = this.content.querySelector('.quickview-product__thumbs');

      if (!mainEl) return;

      // Init thumbs first if exists
      var thumbsSwiper = null;
      if (thumbsEl) {
        thumbsSwiper = new Swiper(thumbsEl, {
          spaceBetween: 8,
          slidesPerView: 4.5,
          freeMode: true,
          watchSlidesProgress: true,
          slideToClickedSlide: true,
          breakpoints: {
            768: {
              slidesPerView: 4.5,
              spaceBetween: 10
            }
          }
        });
      }

      // Init main swiper
      this.quickviewSwiper = new Swiper(mainEl, {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: false,
        navigation: {
          nextEl: mainEl.querySelector('.swiper-button-next'),
          prevEl: mainEl.querySelector('.swiper-button-prev')
        },
        thumbs: { swiper: thumbsSwiper }
      });
    }
  }
  customElements.define('quickview-modal', QuickviewModal);

  // Global function to open quickview
  function openQuickview(productHandle) {
    const quickviewModal = document.querySelector('quickview-modal');
    if (quickviewModal) {
      quickviewModal.open(productHandle);
    }
  }
  window.openQuickview = openQuickview;

  // Handle quickview button clicks
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
      const quickviewBtn = e.target.closest('[data-action="open-quickview"]');
      if (quickviewBtn) {
        e.preventDefault();
        var productHandleEl = quickviewBtn.closest('[data-product-handle]');
        const productHandle = quickviewBtn.dataset.productHandle || (productHandleEl ? productHandleEl.dataset.productHandle : null);
        if (productHandle) {
          openQuickview(productHandle);
        }
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                              PRODUCT CARD                                  */
  /* -------------------------------------------------------------------------- */

  class ProductCard extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.submitButton = this.querySelector('[type="submit"]');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');

      const formData = new FormData(this.form);
      ThemeUtils.request({
          url: themeConfig.routes.add_cart_url,
          method: 'POST',
          body: Object.fromEntries(formData)
        })
        .then(function() {
          window.showToast && window.showToast('Thêm vào giỏ thành công', 'success');
          document.dispatchEvent(new CustomEvent('cart:item_added', { bubbles: true }));
        })
        .catch(function(e) {
          console.error(e);
          window.showToast && window.showToast('Không thể thêm vào giỏ. Vui lòng thử lại.', 'error');
        })
        .finally(async () => {
          await ThemeUtils.updateCartData();
          this.submitButton.setAttribute('aria-disabled', false);
          this.submitButton.classList.remove('loading');
        });
    }
  }
  customElements.define('product-card', ProductCard);

  /* -------------------------------------------------------------------------- */
  /*                         PRODUCT VARIANT PICKER                             */
  /* -------------------------------------------------------------------------- */

  class ProductVariantPicker extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.init();
    }

    init() {
      var product = null;
      var scriptTag = this.querySelector('script[type="application/json"]');

      if (scriptTag && scriptTag.textContent) {
        try {
          product = JSON.parse(scriptTag.textContent.trim());
        } catch (e) {
          console.warn('ProductVariantPicker: Failed to parse JSON', e);
        }
      }

      if (!product) {
        console.warn('ProductVariantPicker: Product data is empty');
        return;
      }

      this.selects = this.querySelectorAll('product-variant-picker-item');
      if (this.selects.length == 0) {
        console.warn('ProductVariantPicker: No variant picker items found');
        return;
      }

      if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
        console.warn('ProductVariantPicker: No variants found');
        return;
      }

      if (!product.options || !Array.isArray(product.options) || product.options.length === 0) {
        console.warn('ProductVariantPicker: No options found');
        return;
      }

      this.variants = product.variants;
      this.optionsCount = product.options.length;

      var self = this;
      this.querySelectorAll('input[type="radio"]').forEach(function(input) {
        input.addEventListener('change', function() {
          self.handleChange();
          self.updateSelectedValueDisplay();
        });
      });

      var emptySelectedValues = Array(this.optionsCount).fill(null);
      this.updateAvailability(emptySelectedValues);

      setTimeout(function() {
        self.selectFirstAvailableVariant();
        setTimeout(function() {
          var selectedValues = Array.from(self.selects).map(function(select) {
            var checkedInput = select.querySelector('input[type="radio"]:checked');
            return checkedInput ? checkedInput.value : null;
          });
          self.updateAvailability(selectedValues);
          self.updateSelectedValueDisplay();
        }, 50);
      }, 100);
    }

    updateSelectedValueDisplay() {
      var self = this;
      this.selects.forEach(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        var selectedValueSpan = select.querySelector('[data-selected-value]');

        if (selectedValueSpan) {
          if (checkedInput && checkedInput.value) {
            selectedValueSpan.textContent = checkedInput.value;
          } else {
            selectedValueSpan.textContent = '';
          }
        }
      });
    }

    selectFirstAvailableVariant() {
      if (!this.variants || !Array.isArray(this.variants) || this.variants.length === 0) {
        return;
      }

      var firstAvailableVariant = this.variants.find(function(variant) {
        return variant && variant.available;
      });

      if (firstAvailableVariant) {
        this.selectVariantByOptions(firstAvailableVariant);
      }
    }

    selectVariantByOptions(variant) {
      if (!variant || !this.selects || this.selects.length === 0) return;

      var optionValues = [];
      for (var i = 1; i <= this.optionsCount; i++) {
        var optionKey = 'option' + i;
        if (variant[optionKey]) {
          optionValues.push(String(variant[optionKey]));
        }
      }

      if (optionValues.length !== this.selects.length) {
        console.warn('ProductVariantPicker: Option values count mismatch');
        return;
      }

      var needsUpdate = false;
      var self = this;
      this.selects.forEach(function(select, index) {
        if (optionValues[index]) {
          var escapedValue = CSS.escape(optionValues[index]);
          var input = select.querySelector('input[type="radio"][value="' + escapedValue + '"]');

          if (input) {
            if (!input.checked) {
              var groupName = input.name;
              select.querySelectorAll('input[name="' + groupName + '"]').forEach(function(radio) {
                radio.checked = false;
              });

              input.checked = true;
              needsUpdate = true;
            }
          } else {
            console.warn('ProductVariantPicker: Radio button not found for value "' + optionValues[index] + '"');
          }
        }
      });

      if (needsUpdate) {
        setTimeout(function() {
          self.handleChange();
        }, 50);
      }
    }

    getSelectedVariant() {
      if (!this.selects || this.selects.length === 0) return null;
      if (!this.variants || !Array.isArray(this.variants)) return null;

      var selectedValues = Array.from(this.selects).map(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        return checkedInput ? checkedInput.value : null;
      });

      if (selectedValues.includes(null)) {
        return null;
      }

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          var index = idx + 1;
          var optionKey = 'option' + index;
          return val == variant[optionKey];
        });
      });

      return matched || null;
    }

    handleChange() {
      if (!this.selects || this.selects.length === 0) return;
      if (!this.variants || !Array.isArray(this.variants)) return;

      var selectedValues = Array.from(this.selects).map(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        return checkedInput ? checkedInput.value : null;
      });

      this.updateAvailability(selectedValues);

      if (selectedValues.includes(null)) {
        return;
      }

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          var index = idx + 1;
          var optionKey = 'option' + index;
          return val == variant[optionKey];
        });
      });

      if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.events) {
        // Check if inside quickview - don't bubble to prevent affecting main product page
        var isInQuickview = this.closest('[data-quickview-product]') !== null;

        this.dispatchEvent(new CustomEvent(themeConfig.product.events.variant_change, {
          detail: matched || null,
          bubbles: !isInQuickview, // Only bubble if NOT in quickview
        }));
      } else {
        console.warn('ProductVariantPicker: Cannot dispatch variant_change event');
      }
    }

    updateAvailability(selectedValues) {
      if (!this.selects || this.selects.length === 0) return;
      if (!this.variants || !Array.isArray(this.variants)) return;
      if (!selectedValues || !Array.isArray(selectedValues)) return;

      var selectedCount = selectedValues.filter(function(val) {
        return val !== null;
      }).length;

      var self = this;
      this.selects.forEach(function(select, optionIndex) {
        var allInputs = select.querySelectorAll('input[type="radio"]');
        if (!allInputs || allInputs.length === 0) return;

        allInputs.forEach(function(input) {
          if (!input || !input.value) return;

          var value = input.value;
          var testCombo = selectedValues.slice();
          testCombo[optionIndex] = value;

          var hasAvailable = self.variants.some(function(variant) {
            if (!variant) return false;
            if (variant.available !== true) return false;

            if (selectedCount === 0) {
              var optionKey = 'option' + (optionIndex + 1);
              return variant[optionKey] == value;
            }

            return testCombo.every(function(val, idx) {
              var index = idx + 1;
              var optionKey = 'option' + index;
              return val == null || variant[optionKey] == val;
            });
          });

          var item = input.closest('.variant-picker__item');
          if (!item) return;

          if (!hasAvailable) {
            item.classList.add('sold_out');

          } else {
            item.classList.remove('sold_out');

          }
        });
      });
    }
  }
  customElements.define('product-variant-picker', ProductVariantPicker);

  /* -------------------------------------------------------------------------- */
  /*                         PRODUCT VARIANT SELECT                             */
  /* -------------------------------------------------------------------------- */

  class ProductVariantSelect extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      if (!themeConfig.product || !themeConfig.product.data) return;
      var product = themeConfig.product.data;
      this.selects = this.querySelectorAll('product-variant-select-item');
      if (this.selects.length == 0) return;
      this.variants = product.variants;
      this.optionsCount = product.options.length;
      var self = this;
      this.querySelectorAll('select').forEach(function(select) {
        select.addEventListener('change', function() {
          self.handleChange();
        });
      });
    }

    handleChange() {
      var selectedValues = Array.from(this.selects).map(function(select) {
        return select.querySelector('select').value || null;
      });

      if (selectedValues.includes(null)) return;

      var self = this;
      var matched = this.variants.find(function(variant) {
        return selectedValues.every(function(val, idx) {
          var index = idx + 1;
          return val === variant['option' + index];
        });
      });

      if (matched) {
        this.dispatchEvent(new CustomEvent(themeConfig.product.events.variant_change, {
          detail: matched,
          bubbles: true,
        }));
      }
    }
  }
  customElements.define('product-variant-select', ProductVariantSelect);

  /* -------------------------------------------------------------------------- */
  /*                      PRODUCT VARIANT PICKER IMAGE                          */
  /* -------------------------------------------------------------------------- */

  class ProductVariantPickerImage extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.option = this.dataset.option;
      this.value = this.dataset.value;

      if (typeof themeConfig === 'undefined' || !themeConfig.product || !themeConfig.product.data) {
        var self = this;
        setTimeout(function() {
          self.buildImage();
        }, 100);
        return;
      }

      this.buildImage();
    }

    buildImage() {
      var isInQuickview = this.closest('[data-quickview-product]') !== null;
      var product = null;

      if (isInQuickview) {
        if (typeof themeConfig !== 'undefined' && themeConfig.quickview && themeConfig.quickview.data) {
          product = themeConfig.quickview.data;
        }
      } else {
        if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data) {
          product = themeConfig.product.data;
        }
      }

      if (!product || !product.variants) return;

      var self = this;
      var variant = product.variants.find(function(v) {
        return v[self.option] == self.value && v.image;
      });

      var imageSrc = null;
      if (variant && variant.image) {
        if (typeof variant.image === 'string') {
          imageSrc = variant.image;
        } else if (variant.image.src) {
          imageSrc = variant.image.src;
        } else if (variant.image.url) {
          imageSrc = variant.image.url;
        }
      }

      if (!imageSrc) {
        if (typeof themeConfig !== 'undefined' && themeConfig.no_image_product) {
          imageSrc = themeConfig.no_image_product;
        } else {
          return;
        }
      }

      var finalSrc = ThemeUtils.resizeImage(imageSrc);

      var safeAlt = (this.value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      this.innerHTML = '<img width="40" height="40" src="' + finalSrc + '" alt="' + safeAlt + '" loading="lazy" decoding="async"/>';
    }
  }
  customElements.define('product-variant-picker-image', ProductVariantPickerImage);

  /* -------------------------------------------------------------------------- */
  /*                    QUICKVIEW VARIANT PICKER (SEPARATE)                     */
  /* -------------------------------------------------------------------------- */

  class QuickviewVariantPicker extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.init();
    }

    init() {
      var product = null;
      var scriptTag = this.querySelector('script[type="application/json"]');

      if (scriptTag && scriptTag.textContent) {
        try {
          product = JSON.parse(scriptTag.textContent.trim());
        } catch (e) {
          console.warn('QuickviewVariantPicker: Failed to parse JSON', e);
        }
      }

      if (!product) return;

      this.selects = this.querySelectorAll('quickview-variant-picker-item');
      if (this.selects.length == 0) return;

      if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) return;
      if (!product.options || !Array.isArray(product.options) || product.options.length === 0) return;

      this.variants = product.variants;
      this.optionsCount = product.options.length;

      var self = this;
      this.querySelectorAll('input[type="radio"]').forEach(function(input) {
        input.addEventListener('change', function() {
          self.handleChange();
          self.updateSelectedValueDisplay();
        });
      });

      var emptySelectedValues = Array(this.optionsCount).fill(null);
      this.updateAvailability(emptySelectedValues);

      setTimeout(function() {
        self.selectFirstAvailableVariant();
        setTimeout(function() {
          var selectedValues = Array.from(self.selects).map(function(select) {
            var checkedInput = select.querySelector('input[type="radio"]:checked');
            return checkedInput ? checkedInput.value : null;
          });
          self.updateAvailability(selectedValues);
          self.updateSelectedValueDisplay();
        }, 50);
      }, 100);
    }

    updateSelectedValueDisplay() {
      this.selects.forEach(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        var selectedValueSpan = select.querySelector('[data-selected-value]');
        if (selectedValueSpan) {
          selectedValueSpan.textContent = checkedInput && checkedInput.value ? checkedInput.value : '';
        }
      });
    }

    selectFirstAvailableVariant() {
      if (!this.variants || this.variants.length === 0) return;

      var firstAvailableVariant = this.variants.find(function(v) {
        return v && v.available;
      });
      if (firstAvailableVariant) {
        this.selectVariantByOptions(firstAvailableVariant);
      }
    }

    selectVariantByOptions(variant) {
      if (!variant || !this.selects || this.selects.length === 0) return;

      var optionValues = [];
      for (var i = 1; i <= this.optionsCount; i++) {
        if (variant['option' + i]) optionValues.push(String(variant['option' + i]));
      }

      var self = this;
      var needsUpdate = false;
      this.selects.forEach(function(select, index) {
        if (optionValues[index]) {
          var escapedValue = CSS.escape(optionValues[index]);
          var input = select.querySelector('input[type="radio"][value="' + escapedValue + '"]');
          if (input && !input.checked) {
            var groupName = input.name;
            select.querySelectorAll('input[name="' + groupName + '"]').forEach(function(r) {
              r.checked = false;
            });
            input.checked = true;
            needsUpdate = true;
          }
        }
      });
      if (needsUpdate) {
        var that = this;
        setTimeout(function() {
          that.handleChange();
        }, 50);
      }
    }

    handleChange() {
      if (!this.selects || this.selects.length === 0) return;
      if (!this.variants || !Array.isArray(this.variants)) return;

      var selectedValues = Array.from(this.selects).map(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        return checkedInput ? checkedInput.value : null;
      });

      this.updateAvailability(selectedValues);
      if (selectedValues.includes(null)) return;

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          return val == variant['option' + (idx + 1)];
        });
      });

      // Dispatch event for quickview (separate event name, can bubble)
      this.dispatchEvent(new CustomEvent('quickview:variant_change', {
        detail: matched || null,
        bubbles: true,
      }));
    }

    updateAvailability(selectedValues) {
      if (!this.variants || !this.selects) return;
      var self = this;

      this.selects.forEach(function(select, selectIndex) {
        var inputs = select.querySelectorAll('input[type="radio"]');
        inputs.forEach(function(input) {
          var value = input.value;
          var testValues = selectedValues.slice();
          testValues[selectIndex] = value;

          var isAvailable = self.variants.some(function(variant) {
            if (!variant) return false;
            var matchesSelected = testValues.every(function(val, idx) {
              if (val === null) return true;
              return val == variant['option' + (idx + 1)];
            });
            return matchesSelected && variant.available;
          });

          var item = input.closest('.variant-picker__item');
          if (item) {
            if (isAvailable) {
              item.classList.remove('variant-picker__item--sold-out', 'sold_out');
            } else {
              item.classList.add('variant-picker__item--sold-out', 'sold_out');
            }
          }
        });
      });
    }
  }
  customElements.define('quickview-variant-picker', QuickviewVariantPicker);

  class QuickviewVariantPickerItem extends HTMLElement {
    constructor() {
      super();
    }
  }
  customElements.define('quickview-variant-picker-item', QuickviewVariantPickerItem);

  class QuickviewVariantPickerImage extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.option = this.dataset.option;
      this.value = this.dataset.value;
      this.retryCount = 0;
      this.maxRetries = 10;
      var self = this;
      setTimeout(function() {
        self.buildImage();
      }, 50);
    }

    buildImage() {
      var self = this;

      // Get product data from script tag in parent quickview-variant-picker
      var picker = this.closest('quickview-variant-picker');
      var product = null;

      if (picker) {
        var scriptTag = picker.querySelector('script[type="application/json"]');
        if (scriptTag && scriptTag.textContent) {
          try {
            product = JSON.parse(scriptTag.textContent.trim());
          } catch (e) {
            console.warn('QuickviewVariantPickerImage: Failed to parse JSON', e);
          }
        }
      }

      // Fallback to themeConfig
      if (!product && typeof themeConfig !== 'undefined' && themeConfig.quickview && themeConfig.quickview.data) {
        product = themeConfig.quickview.data;
      }

      // Retry if still no data
      if (!product || !product.variants) {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(function() {
            self.buildImage();
          }, 200);
        }
        return;
      }

      var variant = product.variants.find(function(v) {
        return v[self.option] == self.value && v.image;
      });

      var imageSrc = null;
      if (variant && variant.image) {
        if (typeof variant.image === 'string') imageSrc = variant.image;
        else if (variant.image.src) imageSrc = variant.image.src;
        else if (variant.image.url) imageSrc = variant.image.url;
      }

      if (!imageSrc) {
        if (typeof themeConfig !== 'undefined' && themeConfig.no_image_product) {
          imageSrc = themeConfig.no_image_product;
        } else return;
      }

      var finalSrc = ThemeUtils.resizeImage(imageSrc);

      var safeAlt = (this.value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      this.innerHTML = '<img width="40" height="40" src="' + finalSrc + '" alt="' + safeAlt + '" loading="lazy" decoding="async"/>';
    }
  }
  customElements.define('quickview-variant-picker-image', QuickviewVariantPickerImage);

  /* -------------------------------------------------------------------------- */
  /*                           QUANTITY SELECTOR                                */
  /* -------------------------------------------------------------------------- */

  class QuantitySelector extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      // Prevent duplicate initialization
      if (this._initialized) return;
      this._initialized = true;

      this.input = this.querySelector('input');
      if (!this.input) return;

      this.min = parseInt(this.input.min) || 1;
      this.step = parseInt(this.input.step) || 1;

      var self = this;
      this.input.addEventListener('change', function() {
        self.handleInputChange();
      });
      this.querySelectorAll('[data-action]').forEach(function(button) {
        button.addEventListener('click', function(e) {
          self.handleButtonClick(e);
        });
      });
      this.onButtonUpdates();
    }

    handleButtonClick(event) {
      event.preventDefault();
      var previousValue = parseInt(this.input.value);
      var action = event.currentTarget.dataset.action;

      if (action === 'increase') {
        this.input.stepUp();
      } else if (action === 'decrease') {
        var currentValue = parseInt(this.input.value) || this.min;
        if (currentValue < this.min) this.input.value = this.min;
        else this.input.stepDown();
      }
      var current = parseInt(this.input.value);
      if (previousValue !== current) this.handleInputChange();
    }

    handleInputChange(event) {
      var currentValue = parseInt(this.input.value);
      if (isNaN(currentValue) || currentValue < this.min) {
        this.input.value = this.min;
      }
      this.onButtonUpdates();

      var lineItemEl = this.closest('[data-line-item]');
      var lineItem = lineItemEl ? parseInt(lineItemEl.dataset.lineItem) : null;

      this.dispatchEvent(new CustomEvent(themeConfig.cart.events.quantity_changed, {
        bubbles: true,
        detail: {
          line: lineItem,
          quantity: parseInt(this.input.value)
        }
      }));
    }

    onButtonUpdates() {
      var decreaseBtn = this.querySelector('[data-action="decrease"]');
      if (decreaseBtn) {
        var currentValue = parseInt(this.input.value) || this.min;
        decreaseBtn.disabled = currentValue <= this.min;
      }
    }
  }
  customElements.define('quantity-selector', QuantitySelector);

  /* -------------------------------------------------------------------------- */
  /*                           FOOTER MENU ACCORDION                            */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                           FLOAT SOCIAL BUTTON                              */
  /* -------------------------------------------------------------------------- */

  customElements.define('float-social', class extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('.float-social__toggle');
      this.panel = this.querySelector('.float-social__panel');
      this.isOpen = false;
      if (!this.toggle || !this.panel) return;
      this.toggle.addEventListener('click', () => this.handleToggle());
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.contains(e.target)) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });
    }
    handleToggle() {
      this.isOpen ? this.close() : this.open();
    }
    open() {
      this.isOpen = true;
      this.classList.add('is-open');
      this.toggle.setAttribute('aria-expanded', 'true');
      this.panel.setAttribute('aria-hidden', 'false');
    }
    close() {
      this.isOpen = false;
      this.classList.remove('is-open');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.panel.setAttribute('aria-hidden', 'true');
    }
  });

  /* Back to Top */
  var backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          backToTopBtn.classList.toggle('is-visible', window.scrollY > 400);
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