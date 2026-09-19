(function() {
  'use strict';

  class CartRecommendations extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      this.productId = this.dataset.productId || '';
      this.updatedEvent = (((themeConfig.cart || {}).events || {}).updated || 'cart:updated');
      this.boundCartUpdate = this.handleCartUpdate.bind(this);
      document.addEventListener(this.updatedEvent, this.boundCartUpdate);
      this.load(this.productId);
    }

    disconnectedCallback() {
      document.removeEventListener(this.updatedEvent, this.boundCartUpdate);
    }

    handleCartUpdate(event) {
      var cart = event.detail && event.detail.cart;
      var productId = cart && cart.items && cart.items[0] ? String(cart.items[0].product_id) : '';
      if (productId === this.productId) return;
      this.productId = productId;
      this.load(productId);
    }

    async load(productId) {
      if (!productId) {
        this.innerHTML = '';
        this.hidden = true;
        return;
      }

      try {
        var url = new URL(this.dataset.url, window.location.origin);
        url.searchParams.set('section_id', this.dataset.sectionId);
        url.searchParams.set('product_id', productId);
        url.searchParams.set('limit', this.dataset.limit || '4');
        url.searchParams.set('intent', this.dataset.intent || 'related');
        var response = await fetch(url.toString(), { headers: { Accept: 'text/html' } });
        if (!response.ok) throw new Error('Recommendations unavailable');
        var documentFragment = new DOMParser().parseFromString(await response.text(), 'text/html');
        var source = documentFragment.querySelector('cart-recommendations');
        var products = source ? source.querySelector('[data-recommendation-products]') : null;
        this.innerHTML = products ? source.innerHTML : '';
        this.hidden = !products;
      } catch (error) {
        this.innerHTML = '';
        this.hidden = true;
      }
    }
  }
  if (!customElements.get('cart-recommendations')) customElements.define('cart-recommendations', CartRecommendations);
})();
