(function() {
  'use strict';

  class CartModal extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      this.isOpen = false;
      this.isLoading = false;
      this.updateController = null;
      this.cacheElements();

      var self = this;
      var cartEvents = (themeConfig.cart && themeConfig.cart.events) || {};
      this.quantityEvent = cartEvents.quantity_changed || 'cart-quantity-changed';
      this.updatedEvent = cartEvents.updated || 'cart:updated';
      this.debouncedUpdateQuantity = ThemeUtils.debounce(function(line, quantity) {
        self.changeLine(line, quantity);
      }, 400);

      this.addEventListener('click', function(event) {
        var closeButton = event.target.closest('[data-action="close-cart-modal"]');
        var removeButton = event.target.closest('[data-action="remove-cart-item"]');
        if (closeButton) self.close();
        if (removeButton) {
          event.preventDefault();
          self.changeLine(Number(removeButton.dataset.line), 0);
        }
      });
      this.addEventListener('change', function(event) {
        if (event.target.matches('#cart-modal-note')) self.updateNote();
      });
      this.addEventListener(this.quantityEvent, function(event) {
        if (!event.detail || !event.detail.line) return;
        if (event.detail.quantity < 1) self.changeLine(event.detail.line, 0);
        else self.debouncedUpdateQuantity(event.detail.line, event.detail.quantity);
      });

      this.boundKeydown = function(event) {
        if (event.key === 'Escape' && self.isOpen) self.close();
      };
      this.boundExternalUpdate = function(event) {
        if (!self.isOpen || !event.detail || event.detail.source === self || !event.detail.cart) return;
        self.renderCart(event.detail.cart).catch(function(error) {
          self.showError(error.message);
        });
      };
      document.addEventListener('keydown', this.boundKeydown);
      document.addEventListener(this.updatedEvent, this.boundExternalUpdate);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.boundKeydown);
      document.removeEventListener(this.updatedEvent, this.boundExternalUpdate);
    }

    cacheElements() {
      this.itemsContainer = this.querySelector('.cart-modal-items-list');
      this.itemsLoading = this.querySelector('.cart-modal-items-loading');
      this.itemsEmpty = this.querySelector('.cart-modal-items-empty');
      this.countEl = this.querySelector('.cart-modal-count');
      this.totalEl = this.querySelector('.cart-modal-total');
      this.discountsEl = this.querySelector('.cart-modal-discounts');
      this.noteInput = this.querySelector('#cart-modal-note');
      this.noteStatus = this.querySelector('[data-note-status]');
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.classList.add('show');
      this.setAttribute('aria-hidden', 'false');
      ThemeUtils.lockScroll();
      ThemeUtils.trapFocus(this);
      this.loadCart();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.classList.remove('show');
      this.setAttribute('aria-hidden', 'true');
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(this);
    }

    async loadCart() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.toggleLoading(true);
      try {
        var cart = await ThemeUtils.request({
          url: (themeConfig.routes && themeConfig.routes.get_cart_url) || '/cart.js',
          method: 'GET'
        });
        await this.renderCart(cart);
        await updateCartData(cart, { source: this });
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.isLoading = false;
        this.toggleLoading(false);
      }
    }

    async renderCart(cart) {
      this.updateTotals(cart);
      if (this.noteInput && document.activeElement !== this.noteInput) this.noteInput.value = cart.note || '';

      var isEmpty = cart.item_count === 0;
      if (this.itemsContainer) {
        this.itemsContainer.innerHTML = isEmpty ? '' : await this.fetchCartItemsHtml();
        ThemeUtils.toggleClass(this.itemsContainer, 'hidden', isEmpty);
      }
      if (this.itemsEmpty) ThemeUtils.toggleClass(this.itemsEmpty, 'hidden', !isEmpty);
      this.classList.toggle('is-empty', isEmpty);
    }

    async fetchCartItemsHtml() {
      var cartUrl = (themeConfig.routes && themeConfig.routes.cart_url) || '/cart';
      var separator = cartUrl.indexOf('?') === -1 ? '?' : '&';
      var response = await fetch(cartUrl + separator + 'section_id=main-cart-items', {
        headers: { Accept: 'text/html' }
      });
      if (!response.ok) throw new Error(this.getString('error'));
      var html = (await response.text()).trim();
      if (!html || html.charAt(0) === '{' || html.charAt(0) === '[') throw new Error(this.getString('error'));
      return html;
    }

    async changeLine(line, quantity) {
      if (!line || Number.isNaN(quantity)) return;
      if (this.updateController) this.updateController.abort();
      this.updateController = new AbortController();
      var controller = this.updateController;
      this.classList.add('is-updating');

      try {
        var response = await fetch((themeConfig.routes && themeConfig.routes.cart_change_url) || '/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ line: line, quantity: quantity }),
          signal: controller.signal
        });
        var cart = await this.parseCartResponse(response);
        var updatedItem = cart.items[line - 1];
        if (quantity > 0 && updatedItem && updatedItem.quantity !== quantity) this.showQuantityError(updatedItem.quantity);
        await this.renderCart(cart);
        await updateCartData(cart, { source: this });
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.restoreQuantity(line);
          this.showError(error.message);
        }
      } finally {
        if (this.updateController === controller) {
          this.updateController = null;
          this.classList.remove('is-updating');
        }
      }
    }

    async updateNote() {
      if (!this.noteInput) return;
      if (this.noteStatus) this.noteStatus.textContent = '';
      try {
        var response = await fetch((themeConfig.routes && themeConfig.routes.cart_update_url) || '/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ note: this.noteInput.value })
        });
        var cart = await this.parseCartResponse(response);
        if (this.noteStatus) this.noteStatus.textContent = this.getString('noteSaved');
        await updateCartData(cart, { source: this });
      } catch (error) {
        this.showError(error.message || this.getString('noteError'));
      }
    }

    async parseCartResponse(response) {
      var data = await response.json();
      if (!response.ok) throw new Error(data.description || data.message || this.getString('error'));
      return data;
    }

    restoreQuantity(line) {
      var item = this.itemsContainer ? this.itemsContainer.querySelector('[data-line-item="' + line + '"]') : null;
      var input = item ? item.querySelector('input[type="number"]') : null;
      if (input && input.dataset.confirmedValue) input.value = input.dataset.confirmedValue;
    }

    updateTotals(cart) {
      ThemeUtils.setText(this.countEl, cart.item_count || 0);
      if (this.totalEl) this.totalEl.textContent = formatMoney(cart.total_price || 0);
      if (this.discountsEl) {
        this.discountsEl.replaceChildren();
        (cart.cart_level_discount_applications || []).forEach(function(discount) {
          var item = document.createElement('li');
          var title = document.createElement('span');
          var amount = document.createElement('strong');
          title.textContent = discount.title;
          amount.textContent = '-' + formatMoney(discount.total_allocated_amount || 0);
          item.append(title, amount);
          this.discountsEl.append(item);
        }, this);
        this.discountsEl.hidden = this.discountsEl.childElementCount === 0;
      }
    }

    getString(key) {
      return ((themeConfig.strings || {}).cart || {})[key] || '';
    }

    showQuantityError(quantity) {
      var message = this.getString('quantityError').replace('[quantity]', quantity);
      this.showError(message);
    }

    showError(message) {
      if (typeof showToast === 'function') showToast(message || this.getString('error'), 'error', 3000);
    }

    toggleLoading(show) {
      ThemeUtils.toggleClass(this.itemsLoading, 'hidden', !show);
      if (show) {
        ThemeUtils.toggleClass(this.itemsContainer, 'hidden', true);
        ThemeUtils.toggleClass(this.itemsEmpty, 'hidden', true);
      }
    }
  }
  if (!customElements.get('cart-modal')) customElements.define('cart-modal', CartModal);

  window.openCartModal = function() {
    var modal = document.querySelector('cart-modal');
    if (modal) modal.open();
  };

  document.addEventListener('cart:item_added', function() {
    var config = themeConfig.cart || {};
    if (config.auto_open_modal || config.auto_open_sidebar) window.openCartModal();
  });

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="open-cart-modal"], [data-action="open-cart-sidebar"]').forEach(function(button) {
      button.addEventListener('click', function(event) {
        event.preventDefault();
        window.openCartModal();
      });
    });
  });
})();
