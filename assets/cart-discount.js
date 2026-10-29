(function() {
  'use strict';

  function fill(template, values) {
    return Object.keys(values).reduce(function(text, key) {
      return text.split('[' + key + ']').join(values[key]);
    }, template || '');
  }

  function normalize(code) {
    return String(code).trim().toLowerCase();
  }

  class CartDiscount extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      this.pending = false;
      this.input = this.querySelector('.cart-discount__input');
      this.applyButton = this.querySelector('[data-action="apply-discount"]');
      this.list = this.querySelector('.cart-discount__list');

      var self = this;
      this.addEventListener('click', function(event) {
        var removeButton = event.target.closest('[data-action="remove-discount"]');
        if (event.target.closest('[data-action="apply-discount"]')) {
          event.preventDefault();
          self.apply();
        } else if (removeButton) {
          event.preventDefault();
          self.remove(removeButton.closest('.cart-discount__chip'));
        }
      });
      this.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter' || event.target !== self.input) return;
        event.preventDefault();
        self.apply();
      });
    }

    codes() {
      return Array.prototype.map.call(this.querySelectorAll('.cart-discount__chip'), function(chip) {
        return chip.dataset.discountCode;
      });
    }

    async apply() {
      if (this.pending || !this.input) return;
      var value = this.input.value.trim();
      this.clearErrors();
      if (!value) {
        this.input.focus();
        return;
      }
      var existing = this.codes();
      if (existing.some(function(code) { return normalize(code) === normalize(value); })) {
        this.input.value = '';
        return;
      }

      this.setPending(true);
      try {
        var cart = await this.update(existing.concat(value));
        this.input.value = '';
        var entry = (cart.discount_codes || []).find(function(discount) {
          return normalize(discount.code) === normalize(value);
        });
        if (!entry || entry.applicable === false) {
          this.showError('invalid');
          return;
        }
        var shown = (cart.discount_applications || []).some(function(application) {
          return application.type === 'discount_code' && normalize(application.title) === normalize(value);
        });
        if (!shown) {
          this.showError('shipping');
          return;
        }
        this.announce('discountApplied', value, cart);
        await this.publish(cart);
      } catch (error) {
        this.showFailure();
      } finally {
        this.setPending(false);
      }
    }

    async remove(chip) {
      if (this.pending || !chip) return;
      var code = chip.dataset.discountCode;
      var remaining = this.codes().filter(function(existing) { return existing !== code; });
      this.clearErrors();
      this.setPending(true);
      try {
        var cart = await this.update(remaining);
        if (this.applyButton) this.applyButton.focus();
        this.announce('discountRemoved', code, cart);
        await this.publish(cart);
      } catch (error) {
        this.showFailure();
      } finally {
        this.setPending(false);
      }
    }

    async update(codes) {
      var config = fetchConfig();
      config.body = JSON.stringify({ discount: codes.join(',') });
      var url = ((themeConfig.routes && themeConfig.routes.cart_update_url) || '/cart/update').replace(/\.js$/, '') + '.js';
      var response = await fetch(url, config);
      var data = await response.json();
      if (!response.ok || !data || !Array.isArray(data.items)) throw new Error('cart-discount');
      return data;
    }

    async publish(cart) {
      await updateCartData(cart, { source: this });
    }

    renderCodes(cart) {
      if (!this.list) return;
      var label = this.dataset.removeLabel || '';
      var seen = {};
      this.list.replaceChildren();
      (cart.discount_applications || []).forEach(function(application) {
        if (application.type !== 'discount_code' || seen[normalize(application.title)]) return;
        seen[normalize(application.title)] = true;
        var chip = document.createElement('li');
        var code = document.createElement('span');
        var remove = document.createElement('button');
        var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        chip.className = 'cart-discount__chip';
        chip.dataset.discountCode = application.title;
        code.className = 'cart-discount__code';
        code.textContent = application.title;
        remove.type = 'button';
        remove.className = 'cart-discount__remove';
        remove.dataset.action = 'remove-discount';
        remove.setAttribute('aria-label', fill(label, { code: application.title }));
        icon.setAttribute('class', 'icon icon-close');
        icon.setAttribute('width', '12');
        icon.setAttribute('height', '12');
        icon.setAttribute('aria-hidden', 'true');
        use.setAttribute('href', '#icon-close');
        icon.append(use);
        remove.append(icon);
        chip.append(code, remove);
        this.list.append(chip);
      }, this);
      this.list.hidden = this.list.childElementCount === 0;
    }

    announce(key, code, cart) {
      var region = (this.closest('cart-modal') || this.closest('.shopify-section') || document).querySelector('[data-cart-live]');
      if (!region) return;
      var message = fill(region.dataset[key], { code: code }) + ' ' +
        fill(region.dataset.total, { total: formatMoney(cart.total_price || 0, themeConfig.priceFormat) });
      region.textContent = '';
      clearTimeout(region.announceTimer);
      region.announceTimer = setTimeout(function() {
        region.textContent = message;
      }, 60);
    }

    showError(type) {
      var message = this.querySelector('[data-error="' + type + '"]');
      if (!message) return;
      message.hidden = false;
      if (type === 'invalid' && this.input) this.input.setAttribute('aria-invalid', 'true');
      if (this.input) this.input.focus();
    }

    clearErrors() {
      this.querySelectorAll('[data-error]').forEach(function(message) {
        message.hidden = true;
      });
      if (this.input) this.input.removeAttribute('aria-invalid');
    }

    showFailure() {
      var strings = (themeConfig.strings || {}).cart || {};
      if (typeof showToast === 'function') showToast(strings.error, 'error', 3000);
    }

    setPending(isPending) {
      this.pending = isPending;
      this.setAttribute('aria-busy', String(isPending));
      if (this.applyButton) this.applyButton.setAttribute('aria-disabled', String(isPending));
    }
  }
  if (!customElements.get('cart-discount')) customElements.define('cart-discount', CartDiscount);
})();
