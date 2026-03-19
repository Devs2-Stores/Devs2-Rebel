class QuantitySelector extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.input = this.querySelector('input');
    if (!this.input) return;

    this.min = parseInt(this.input.min) || 1;
    this.step = parseInt(this.input.step) || 1;

    this.input.addEventListener('change', () => this.handleInputChange());
    this.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => this.handleButtonClick(e));
    });
    this.onButtonUpdates();
  }
  handleButtonClick(event) {
    event.preventDefault();
    const previousValue = parseInt(this.input.value);
    const action = event.currentTarget.dataset.action;

    if (action === 'increase') {
      this.input.stepUp()
    } else if (action === 'decrease') {
      const currentValue = parseInt(this.input.value) || this.min;
      if (currentValue < this.min) this.input.value = this.min;
      else this.input.stepDown();
    }
    const current = parseInt(this.input.value);
    if (previousValue !== current) this.handleInputChange();
  }
  handleInputChange(event) {
    const currentValue = parseInt(this.input.value);
    if (isNaN(currentValue) || currentValue < this.min) {
      this.input.value = this.min;
    }
    this.onButtonUpdates();
    this.dispatchEvent(new CustomEvent(themeConfig.cart.events.quantity_changed, {
      bubbles: true,
      detail: {
        line: parseInt(this.closest('[data-line-item]')?.dataset.lineItem),
        quantity: parseInt(this.input.value)
      }
    }));
  }
  onButtonUpdates() {
    const decreaseBtn = this.querySelector('[data-action="decrease"]');
    if (decreaseBtn) {
      const currentValue = parseInt(this.input.value) || this.min;
      decreaseBtn.disabled = currentValue <= this.min;
    }
  }
}
if (!customElements.get('quantity-selector')) {
  customElements.define('quantity-selector', QuantitySelector);
}