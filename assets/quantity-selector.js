/* -------------------------------------------------------------------------- */
/*                           QUANTITY SELECTOR                                */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

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
})();