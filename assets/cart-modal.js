/* -------------------------------------------------------------------------- */
/*                                CART MODAL                                  */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

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
        if (this.itemsContainer) ThemeUtils.setHTML(this.itemsContainer, '<div class="text-center text-red-500 py-8">' + (themeConfig.strings.cart.error || 'Error loading cart') + '</div>');
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
          showToast(themeConfig.strings.cart.error || 'Could not update cart. Please try again.', 'error', 3000);
        } else {
          alert(themeConfig.strings.cart.error || 'An error occurred. Please try again.');
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
          showToast(themeConfig.strings.cart.removeConfirm || 'Item removed from cart.', 'success', 2000);
        }
      } catch (e) {
        if (item) item.style.opacity = '1';
        console.error('Cart remove error:', e);
        if (typeof showToast === 'function') {
          showToast(themeConfig.strings.cart.error || 'Could not remove item. Please try again.', 'error', 3000);
        } else {
          alert(themeConfig.strings.cart.error || 'An error occurred. Please try again.');
        }
      }
    }

    updateTotals(cart) {
      ThemeUtils.setText(this.countEl, cart.item_count || 0);
      if (this.totalEl) this.totalEl.textContent = cart.total_price === 0 ? ((themeConfig.strings.variant || {}).contact || 'Contact') : (typeof formatMoney === 'function' ? formatMoney(cart.total_price) : cart.total_price);
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
})();
