(function() {
  'use strict';

  class CartTemplate extends HTMLElement {
    connectedCallback() {
      this.lifecycle = new AbortController();
      var signal = this.lifecycle.signal;
      this.sectionId = this.getSectionId();
      this.updateController = null;
      this.updateQueue = Promise.resolve();
      this.cacheElements();

      var self = this;
      var cartEvents = (themeConfig.cart && themeConfig.cart.events) || {};
      this.quantityEvent = cartEvents.quantity_changed || 'cart-quantity-changed';
      this.updatedEvent = cartEvents.updated || 'cart:updated';
      this.debouncedUpdate = ThemeUtils.debounceKeyed(function(detail) {
        self.enqueueUpdate(detail);
      }, 400);

      this.addEventListener(this.quantityEvent, this.handleQuantityChange.bind(this), { signal: signal });
      this.addEventListener(cartEvents.item_delete || 'cart-item-deleted', this.handleDelete.bind(this), { signal: signal });
      this.addEventListener('change', this.handleFieldChange.bind(this), { signal: signal });
      document.addEventListener(this.updatedEvent, this.handleExternalUpdate.bind(this), { signal: signal });
    }

    disconnectedCallback() {
      if (this.lifecycle) this.lifecycle.abort();
      if (this.debouncedUpdate) this.debouncedUpdate.cancel();
      if (this.updateController) this.updateController.abort();
    }

    enqueueUpdate(detail) {
      var self = this;
      this.updateQueue = this.updateQueue.then(function() {
        return self.updateCart(detail);
      }).catch(function(error) {
        self.showError(error && error.message);
      });
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
      if (!event.detail || !event.detail.key) return;
      this.debouncedUpdate(event.detail.key, event.detail);
    }

    handleDelete(event) {
      if (!event.detail || !event.detail.key) return;
      this.debouncedUpdate.cancel(event.detail.key);
      this.enqueueUpdate(event.detail);
    }

    handleFieldChange(event) {
      if (event.target.matches('#cart-template__note-input')) this.updateNote();
      if (event.target.matches("[name^='attributes[invoice']")) this.updateInvoice();
    }

    handleExternalUpdate(event) {
      if (!event.detail || event.detail.source === this || !event.detail.cart) return;
      var cart = event.detail.cart;
      var fromDiscount = event.detail.source && event.detail.source.localName === 'cart-discount';
      this.refreshSection().then(function() {
        if (fromDiscount) this.syncDiscounts(cart);
      }.bind(this)).catch(function(error) {
        this.showError(error.message);
      }.bind(this));
    }

    syncDiscounts(cart) {
      var discount = this.querySelector('cart-discount');
      if (discount && typeof discount.renderCodes === 'function') discount.renderCodes(cart);
      var subtotal = this.querySelector('.cart-total__subtotal');
      if (subtotal) {
        this.querySelectorAll('.cart-total__discount-code').forEach(function(row) {
          row.remove();
        });
        var rows = (cart.cart_level_discount_applications || []).map(function(application) {
          var row = document.createElement('li');
          var title = document.createElement('span');
          var amount = document.createElement('strong');
          row.className = 'cart-total__discount-code';
          title.textContent = application.title + ':';
          amount.textContent = '-' + formatMoney(application.total_allocated_amount || 0);
          row.append(title, amount);
          return row;
        });
        subtotal.after.apply(subtotal, rows);
      }
      updateCartMoney(cart.total_price || 0);
    }

    async updateCart(params) {
      var key = params.key;
      var quantity = Number(params.quantity);
      if (!key || Number.isNaN(quantity)) return;

      var lineItem = this.findLine(key);
      if (!lineItem) return;
      var line = Number(lineItem.dataset.lineItem);
      this.updateController = new AbortController();
      var controller = this.updateController;
      this.setUpdating(true);
      var titleEl = lineItem.querySelector('.cart-item__title');
      var title = titleEl ? titleEl.textContent.trim() : '';
      var focusSelector = this.focusSelector(document.activeElement);

      try {
        var cart = await this.requestCart(this.getCartRoute('change'), { id: key, quantity: quantity }, 'error', controller.signal);
        var updatedItem = cart.items.find(function(item) {
          return item.key === key;
        });

        if (quantity > 0 && updatedItem && updatedItem.quantity !== quantity) {
          this.showQuantityError(updatedItem.quantity);
        }

        await this.refreshSection(controller.signal);
        this.restoreFocus(key, line, quantity === 0, focusSelector);
        this.announceChange(cart, quantity === 0 ? title : (updatedItem ? updatedItem.product_title : title), quantity === 0 ? null : (updatedItem ? updatedItem.quantity : quantity));
        await updateCartData(cart, { source: this });
      } catch (error) {
        if (error.name === 'AbortError') return;
        this.restoreQuantity(key);
        this.showError(error.message || this.getString('error'));
      } finally {
        if (this.updateController === controller) {
          this.updateController = null;
          this.setUpdating(false);
        }
      }
    }

    findLine(key) {
      return this.querySelector('cart-item[data-line-key="' + key + '"]');
    }

    async refreshSection(signal) {
      if (!this.sectionId) throw new Error(this.getString('error'));
      var separator = this.getCartRoute().indexOf('?') === -1 ? '?' : '&';
      var response;
      try {
        response = await fetch(this.getCartRoute() + separator + 'section_id=' + encodeURIComponent(this.sectionId), {
          headers: { Accept: 'text/html' },
          signal: signal
        });
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error(this.getString('error'));
      }
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
        var cart = await this.requestCart(this.getCartRoute('update'), body, errorKey);
        await updateCartData(cart, { source: this });
      } catch (error) {
        this.showError(error.message);
      }
    }

    async requestCart(url, body, fallbackKey, signal) {
      var config = fetchConfig();
      config.body = JSON.stringify(body);
      if (signal) config.signal = signal;
      var response;
      var data = null;
      try {
        response = await fetch(url, config);
        data = await response.json();
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error(this.getString(fallbackKey));
      }
      if (!response.ok || !data) throw new Error((data && typeof data.description === 'string' && data.description) || this.getString(fallbackKey));
      return data;
    }

    renderSection(sectionHtml) {
      var documentFragment = new DOMParser().parseFromString(sectionHtml, 'text/html');
      var newContent = documentFragment.querySelector('cart-template');
      if (!newContent) throw new Error(this.getString('error'));

      var activeId = this.contains(document.activeElement) ? document.activeElement.id : '';
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
      if (activeId) {
        var restored = document.getElementById(activeId);
        if (restored) restored.focus();
      }
    }

    visible(item, selector) {
      return Array.prototype.find.call(item.querySelectorAll(selector), function(element) {
        return element.getClientRects().length > 0;
      }) || null;
    }

    focusSelector(element) {
      if (!element || !this.contains(element) || !element.closest('cart-item')) return null;
      if (element.dataset.action) return '[data-action="' + element.dataset.action + '"]';
      if (element.matches('.quantity-selector__input')) return '.quantity-selector__input';
      return null;
    }

    restoreFocus(key, line, removed, selector) {
      var heading = this.querySelector('.cart-template__title');
      var item = removed ? this.querySelector('cart-item[data-line-item="' + line + '"]') : this.findLine(key);
      var target = null;
      if (removed) {
        target = item ? this.visible(item, '[data-action="delete-item"]') : null;
      } else if (item && selector) {
        target = this.visible(item, selector);
        if (target && target.disabled) target = this.visible(item, '.quantity-selector__input');
      }
      if (target) {
        target.focus();
        return;
      }
      if (document.activeElement === document.body || !this.contains(document.activeElement)) heading.focus();
    }

    liveText(key) {
      var region = this.liveRegion();
      return region ? region.dataset[key] || '' : '';
    }

    liveRegion() {
      var section = this.closest('.shopify-section');
      return section ? section.querySelector('[data-cart-live]') : null;
    }

    announceChange(cart, title, quantity) {
      var region = this.liveRegion();
      if (!region) return;
      var fill = function(template, values) {
        return Object.keys(values).reduce(function(text, key) {
          return text.split('[' + key + ']').join(values[key]);
        }, template);
      };
      var message = quantity === null
        ? fill(this.liveText('itemRemoved'), { title: title })
        : fill(this.liveText('quantityChanged'), { title: title, quantity: quantity });
      var tail = cart.item_count === 0
        ? this.liveText('empty')
        : fill(this.liveText('total'), { total: formatMoney(cart.total_price || 0, themeConfig.priceFormat) });
      region.textContent = '';
      clearTimeout(region.announceTimer);
      region.announceTimer = setTimeout(function() {
        region.textContent = message + ' ' + tail;
      }, 60);
    }

    restoreQuantity(key) {
      var lineItem = this.findLine(key);
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
      var key = this.dataset.lineKey;
      if (!key) return;
      var eventName = ((themeConfig.cart || {}).events || {}).item_delete || 'cart-item-deleted';
      this.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        detail: { key: key, quantity: 0 }
      }));
    }
  }
  if (!customElements.get('cart-item')) customElements.define('cart-item', CartItem);
})();
