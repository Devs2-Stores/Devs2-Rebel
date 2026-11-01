/* -------------------------------------------------------------------------- */
/*                              PRODUCT CARD                                  */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class ProductCard extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', this.onSwatchClick.bind(this));
      this.form = this.querySelector('form');
      if (!this.form) return;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.submitButton = this.querySelector('[type="submit"]');
    }

    onSwatchClick(evt) {
      const swatch = evt.target.closest('[data-swatch-image]');
      if (!swatch || !this.contains(swatch)) return;
      if (evt.defaultPrevented || evt.button > 0 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;
      const img = this.querySelector('.product-card__img-primary');
      if (!img) return;
      evt.preventDefault();

      img.src = swatch.dataset.imageSrc;
      img.srcset = swatch.dataset.imageSrcset;
      img.alt = swatch.dataset.imageAlt;
      img.width = swatch.dataset.imageWidth;
      img.height = swatch.dataset.imageHeight;
      const frame = img.closest('.product-card__media-image');
      if (frame) frame.classList.add('is-variant-image');

      this.querySelectorAll('.product-card__swatch[aria-current]').forEach(function(el) {
        el.removeAttribute('aria-current');
      });
      swatch.setAttribute('aria-current', 'true');

      const href = swatch.getAttribute('href');
      this.querySelectorAll('.product-card__media-inner, .product-card__title a').forEach(function(link) {
        link.setAttribute('href', href);
      });
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
          document.dispatchEvent(new CustomEvent('cart:item_added', { bubbles: true }));
        })
        .catch(function(e) {
          window.showToast && window.showToast((e && e.description) || (themeConfig.strings.cart || {}).itemError, 'error');
        })
        .finally(async () => {
          await ThemeUtils.updateCartData();
          this.submitButton.setAttribute('aria-disabled', false);
          this.submitButton.classList.remove('loading');
        });
    }
  }
  if (!customElements.get('product-card')) customElements.define('product-card', ProductCard);
})();
