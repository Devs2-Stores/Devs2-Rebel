/* -------------------------------------------------------------------------- */
/*                              PRODUCT CARD                                  */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

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
          url: themeConfig.routes.cart_add_url,
          method: 'POST',
          body: Object.fromEntries(formData)
        })
        .then(function() {
          window.showToast && window.showToast((themeConfig.strings.cart || {}).itemAdded || 'Added to cart', 'success');
          document.dispatchEvent(new CustomEvent('cart:item_added', { bubbles: true }));
        })
        .catch(function(e) {
          console.error(e);
          window.showToast && window.showToast((themeConfig.strings.cart || {}).itemError || 'Could not add to cart', 'error');
        })
        .finally(async () => {
          await ThemeUtils.updateCartData();
          this.submitButton.setAttribute('aria-disabled', false);
          this.submitButton.classList.remove('loading');
        });
    }
  }
  customElements.define('product-card', ProductCard);
})();
