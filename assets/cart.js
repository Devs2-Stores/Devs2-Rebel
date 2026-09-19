(function() {
  'use strict';

  class CartTemplate extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      this.sectionId = this.getSectionId();
      this.pendingUpdate = null;
      this.updateController = null;
      this.cacheElements();

      var cartEvents = (themeConfig.cart && themeConfig.cart.events) || {};
      this.quantityEvent = cartEvents.quantity_changed || 'cart-quantity-changed';
      this.updatedEvent = cartEvents.updated || 'cart:updated';

      this.addEventListener(this.quantityEvent, this.handleQuantityChange.bind(this));
      this.addEventListener(cartEvents.item_delete || 'cart-item-deleted', this.handleDelete.bind(this));
      this.addEventListener('change', this.handleFieldChange.bind(this));
      document.addEventListener(this.updatedEvent, this.handleExternalUpdate.bind(this));
    }

    cacheElements() {
      this.cartData = this.querySelector('.cart-template__data');
      this.cartEmpty = this.querySelector('.cart-template__empty');
      this.noteInput = this.querySelector('#cart-template__note-input');
      this.invoiceInputs = this.querySelectorAll("[name^='attributes[invoice']");
    }

    getSectionId() {
      var section = this.closest('.shopify-section');
      return section ? section.id.replace('shopify-section-', '') : null;
    }

    getCartRoute(endpoint) {
      var routes = themeConfig.routes || {};
      if (endpoint === 'change') return routes.cart_change_url || '/cart/change.js';
      if (endpoint === 'update') return routes.cart_update_url || '/cart/update.js';
      return routes.cart_url || '/cart';
    }

    getString(key) {
      return ((themeConfig.strings || {}).cart || {})[key] || '';
    }

    handleQuantityChange(event) {
      if (!event.detail) return;
      clearTimeout(this.pendingUpdate);
      var detail = event.detail;
      var self = this;
      this.pendingUpdate = setTimeout(function() {
        self.updateCart(detail);
      }, 400);
    }

    handleDelete(event) {
      if (event.detail) this.updateCart(event.detail);
    }

    handleFieldChange(event) {
      if (event.target.matches('#cart-template__note-input')) this.updateNote();
      if (event.target.matches("[name^='attributes[invoice']")) this.updateInvoice();
    }

    handleExternalUpdate(event) {
      if (!event.detail || event.detail.source === this || !event.detail.cart) return;
      this.refreshSection().catch(function(error) {
        this.showError(error.message);
      }.bind(this));
    }

    async updateCart(params) {
      var line = Number(params.line);
      var quantity = Number(params.quantity);
      if (!line || Number.isNaN(quantity)) return;

      if (this.updateController) this.updateController.abort();
      this.updateController = new AbortController();
      var controller = this.updateController;
      this.setUpdating(true);

      try {
        var config = fetchConfig();
        config.signal = controller.signal;
        config.body = JSON.stringify({ line: line, quantity: quantity });
        var response = await fetch(this.getCartRoute('change'), config);
        var cart = await this.parseCartResponse(response);
        var updatedItem = cart.items[line - 1];

        if (quantity > 0 && updatedItem && updatedItem.quantity !== quantity) {
          this.showQuantityError(updatedItem.quantity);
        }

        await this.refreshSection(controller.signal);
        await updateCartData(cart, { source: this });
      } catch (error) {
        if (error.name === 'AbortError') return;
        this.restoreQuantity(line);
        this.showError(error.message || this.getString('error'));
      } finally {
        if (this.updateController === controller) {
          this.updateController = null;
          this.setUpdating(false);
        }
      }
    }

    async refreshSection(signal) {
      if (!this.sectionId) throw new Error(this.getString('error'));
      var separator = this.getCartRoute().indexOf('?') === -1 ? '?' : '&';
      var response = await fetch(this.getCartRoute() + separator + 'section_id=' + encodeURIComponent(this.sectionId), {
        headers: { Accept: 'text/html' },
        signal: signal
      });
      if (!response.ok) throw new Error(this.getString('error'));
      this.renderSection(await response.text());
    }

    async updateNote() {
      if (!this.noteInput) return;
      await this.updateCartFields({ note: this.noteInput.value }, 'noteError');
    }

    async updateInvoice() {
      var attributes = {};
      this.invoiceInputs.forEach(function(input) {
        var key = input.name.replace('attributes[', '').replace(']', '');
        attributes[key] = input.value;
      });
      await this.updateCartFields({ attributes: attributes }, 'invoiceError');
    }

    async updateCartFields(body, errorKey) {
      try {
        var config = fetchConfig();
        config.body = JSON.stringify(body);
        var response = await fetch(this.getCartRoute('update'), config);
        var cart = await this.parseCartResponse(response);
        await updateCartData(cart, { source: this });
      } catch (error) {
        this.showError(error.message || this.getString(errorKey));
      }
    }

    async parseCartResponse(response) {
      var data = await response.json();
      if (!response.ok) throw new Error(data.description || data.message || this.getString('error'));
      return data;
    }

    renderSection(sectionHtml) {
      var documentFragment = new DOMParser().parseFromString(sectionHtml, 'text/html');
      var newContent = documentFragment.querySelector('cart-template');
      if (!newContent) throw new Error(this.getString('error'));

      var noteValue = this.noteInput ? this.noteInput.value : null;
      var invoiceValues = {};
      this.invoiceInputs.forEach(function(input) {
        invoiceValues[input.name] = input.value;
      });

      this.innerHTML = newContent.innerHTML;
      this.cacheElements();

      if (this.noteInput && noteValue !== null) this.noteInput.value = noteValue;
      this.invoiceInputs.forEach(function(input) {
        if (invoiceValues[input.name] !== undefined) input.value = invoiceValues[input.name];
      });
    }

    restoreQuantity(line) {
      var lineItem = this.querySelector('[data-line-item="' + line + '"]');
      var input = lineItem ? lineItem.querySelector('input[type="number"]') : null;
      if (input && input.dataset.confirmedValue) input.value = input.dataset.confirmedValue;
    }

    showQuantityError(quantity) {
      this.showError(this.getString('quantityError').replace('[quantity]', quantity));
    }

    showError(message) {
      if (typeof showToast === 'function') showToast(message || this.getString('error'), 'error', 3000);
    }

    setUpdating(isUpdating) {
      this.classList.toggle('is-updating', isUpdating);
      this.setAttribute('aria-busy', String(isUpdating));
    }
  }
  if (!customElements.get('cart-template')) customElements.define('cart-template', CartTemplate);

  class CartItem extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      var self = this;
      this.querySelectorAll("[data-action='delete-item']").forEach(function(button) {
        button.addEventListener('click', function(event) {
          self.handleDelete(event);
        });
      });
    }

    handleDelete(event) {
      event.preventDefault();
      var message = ((themeConfig.strings || {}).cart || {}).removeConfirm;
      if (message && !window.confirm(message)) return;
      var line = Number(this.dataset.lineItem);
      if (!line) return;
      var eventName = ((themeConfig.cart || {}).events || {}).item_delete || 'cart-item-deleted';
      this.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        detail: { line: line, quantity: 0 }
      }));
    }
  }
  if (!customElements.get('cart-item')) customElements.define('cart-item', CartItem);
})();
