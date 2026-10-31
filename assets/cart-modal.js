(function() {
  'use strict';

  class CartModal extends HTMLElement {
    connectedCallback() {
      this.documentLifecycle = new AbortController();
      var signal = this.documentLifecycle.signal;
      var self = this;
      var cartEvents = (themeConfig.cart && themeConfig.cart.events) || {};
      this.updatedEvent = cartEvents.updated || 'cart:updated';
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && self.isOpen) self.close();
      }, { signal: signal });
      document.addEventListener(this.updatedEvent, function(event) {
        if (!self.isOpen || !event.detail || event.detail.source === self || !event.detail.cart) return;
        self.renderCart(event.detail.cart).catch(function(error) {
          self.showError(error.message);
        });
      }, { signal: signal });
      if (this._initialized) return;
      this._initialized = true;
      this.isOpen = false;
      this.isLoading = false;
      this.updateController = null;
      this.cacheElements();

      this.quantityEvent = cartEvents.quantity_changed || 'cart-quantity-changed';
      this.updateQueue = Promise.resolve();
      this.queueChange = function(key, quantity) {
        self.updateQueue = self.updateQueue.then(function() {
          return self.changeLine(key, quantity);
        }).catch(function(error) {
          self.showError(error && error.message);
        });
      };
      this.debouncedUpdateQuantity = ThemeUtils.debounceKeyed(this.queueChange, 400);

      this.addEventListener('click', function(event) {
        var closeButton = event.target.closest('[data-action="close-cart-modal"]');
        var removeButton = event.target.closest('[data-action="remove-cart-item"]');
        if (closeButton) self.close();
        if (removeButton) {
          event.preventDefault();
          var removeLine = removeButton.closest('[data-line-item]');
          var removeKey = removeLine ? removeLine.dataset.lineKey : null;
          if (removeKey) {
            self.debouncedUpdateQuantity.cancel(removeKey);
            self.queueChange(removeKey, 0);
          }
        }
      });
      this.addEventListener('change', function(event) {
        if (event.target.matches('#cart-modal-note')) self.updateNote();
      });
      this.addEventListener(this.quantityEvent, function(event) {
        if (!event.detail || !event.detail.key) return;
        if (event.detail.quantity < 1) {
          self.debouncedUpdateQuantity.cancel(event.detail.key);
          self.queueChange(event.detail.key, 0);
        } else self.debouncedUpdateQuantity(event.detail.key, event.detail.key, event.detail.quantity);
      });
    }

    disconnectedCallback() {
      if (this.documentLifecycle) this.documentLifecycle.abort();
      if (this.debouncedUpdateQuantity) this.debouncedUpdateQuantity.cancel();
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
        if (cart.item_count === 0) this.announce(this.liveText('empty'));
        await updateCartData(cart, { source: this });
      } catch (error) {
        this.showError(this.getString('error'));
      } finally {
        this.isLoading = false;
        this.toggleLoading(false);
      }
    }

    async renderCart(cart) {
      this.updateTotals(cart);
      var discount = this.querySelector('cart-discount');
      if (discount && typeof discount.renderCodes === 'function') discount.renderCodes(cart);
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
      var response;
      try {
        response = await fetch(cartUrl + separator + 'section_id=main-cart-items', {
          headers: { Accept: 'text/html' }
        });
      } catch (error) {
        throw new Error(this.getString('error'));
      }
      if (!response.ok) throw new Error(this.getString('error'));
      var html = (await response.text()).trim();
      if (!html || html.charAt(0) === '{' || html.charAt(0) === '[') throw new Error(this.getString('error'));
      return html;
    }

    async changeLine(key, quantity) {
      if (!key || Number.isNaN(quantity)) return;
      var lineItem = this.lineByKey(key);
      if (!lineItem) return;
      var line = Number(lineItem.dataset.lineItem);
      this.updateController = new AbortController();
      var controller = this.updateController;
      this.classList.add('is-updating');
      var titleEl = lineItem.querySelector('.cart-modal-item__title');
      var title = titleEl ? titleEl.textContent.trim() : '';
      var focusSelector = this.focusSelector(document.activeElement);

      try {
        var cart = await this.postCart((themeConfig.routes && themeConfig.routes.cart_change_url) || '/cart/change.js', { id: key, quantity: quantity }, 'error', controller.signal);
        var updatedItem = cart.items.find(function(item) {
          return item.key === key;
        });
        if (quantity > 0 && updatedItem && updatedItem.quantity !== quantity) this.showQuantityError(updatedItem.quantity);
        await this.renderCart(cart);
        this.restoreFocus(key, line, quantity === 0, focusSelector);
        this.announceChange(cart, quantity === 0 ? title : (updatedItem ? updatedItem.product_title : title), quantity === 0 ? null : (updatedItem ? updatedItem.quantity : quantity));
        await updateCartData(cart, { source: this });
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.restoreQuantity(key);
          this.showError(error.message);
        }
      } finally {
        if (this.updateController === controller) {
          this.updateController = null;
          this.classList.remove('is-updating');
        }
      }
    }

    lineElement(line) {
      return this.itemsContainer ? this.itemsContainer.querySelector('[data-line-item="' + line + '"]') : null;
    }

    lineByKey(key) {
      return this.itemsContainer ? this.itemsContainer.querySelector('[data-line-key="' + key + '"]') : null;
    }

    focusSelector(element) {
      if (!element || !this.itemsContainer || !this.itemsContainer.contains(element)) return null;
      if (element.dataset.action) return '[data-action="' + element.dataset.action + '"]';
      if (element.matches('.quantity-selector__input')) return '.quantity-selector__input';
      return null;
    }

    restoreFocus(key, line, removed, selector) {
      var heading = this.querySelector('#cart-modal-title');
      var item = removed ? this.lineElement(line) : this.lineByKey(key);
      var target = null;
      if (removed) {
        target = item ? item.querySelector('[data-action="remove-cart-item"]') : null;
      } else if (item && selector) {
        target = item.querySelector(selector);
        if (target && target.disabled) target = item.querySelector('.quantity-selector__input');
      }
      if (target) {
        target.focus();
        return;
      }
      if (document.activeElement === document.body || !this.contains(document.activeElement)) heading.focus();
    }

    liveText(key) {
      var region = this.querySelector('[data-cart-live]');
      return region ? region.dataset[key] || '' : '';
    }

    announce(text) {
      var region = this.querySelector('[data-cart-live]');
      if (!region || !text) return;
      region.textContent = '';
      clearTimeout(region.announceTimer);
      region.announceTimer = setTimeout(function() {
        region.textContent = text;
      }, 60);
    }

    announceChange(cart, title, quantity) {
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
      this.announce(message + ' ' + tail);
    }

    async updateNote() {
      if (!this.noteInput) return;
      if (this.noteStatus) this.noteStatus.textContent = '';
      try {
        var cart = await this.postCart((themeConfig.routes && themeConfig.routes.cart_update_url) || '/cart/update.js', { note: this.noteInput.value }, 'noteError');
        if (this.noteStatus) this.noteStatus.textContent = this.getString('noteSaved');
        await updateCartData(cart, { source: this });
      } catch (error) {
        this.showError(error.message);
      }
    }

    async postCart(url, body, fallbackKey, signal) {
      var response;
      var data = null;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
          signal: signal
        });
        data = await response.json();
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error(this.getString(fallbackKey));
      }
      if (!response.ok || !data) throw new Error((data && typeof data.description === 'string' && data.description) || this.getString(fallbackKey));
      return data;
    }

    restoreQuantity(key) {
      var item = this.lineByKey(key);
      var input = item ? item.querySelector('input[type="number"]') : null;
      if (input && input.dataset.confirmedValue) input.value = input.dataset.confirmedValue;
    }

    updateTotals(cart) {
      ThemeUtils.setText(this.countEl, cart.item_count || 0);
      if (this.totalEl) this.totalEl.textContent = formatMoney(cart.total_price || 0, themeConfig.priceFormat);
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
    if (config.type === 'page') {
      window.location.href = themeConfig.routes.cart_url;
      return;
    }
    if (config.type === 'notification') {
      if (typeof window.showToast === 'function') window.showToast((themeConfig.strings.cart || {}).itemAdded, 'success');
      return;
    }
    if (config.auto_open_modal || config.auto_open_sidebar) window.openCartModal();
  });

  document.addEventListener('click', function(event) {
    var button = event.target.closest('[data-action="open-cart-modal"], [data-action="open-cart-sidebar"]');
    if (!button) return;
    event.preventDefault();
    window.openCartModal();
  });
})();
