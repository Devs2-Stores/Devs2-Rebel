(function() {
  'use strict';

  class CartRecommendations extends HTMLElement {
    connectedCallback() {
      this.lifecycle = new AbortController();
      this.updatedEvent = (((themeConfig.cart || {}).events || {}).updated || 'cart:updated');
      document.addEventListener(this.updatedEvent, this.handleCartUpdate.bind(this), { signal: this.lifecycle.signal });
      if (this._initialized) return;
      this._initialized = true;
      this.productId = this.dataset.productId || '';
      this.loadId = 0;
      this.load(this.productId);
    }

    disconnectedCallback() {
      if (this.lifecycle) this.lifecycle.abort();
    }

    handleCartUpdate(event) {
      var cart = event.detail && event.detail.cart;
      var productId = cart && cart.items && cart.items[0] ? String(cart.items[0].product_id) : '';
      if (productId === this.productId) return;
      this.productId = productId;
      this.load(productId);
    }

    async load(productId) {
      var requestId = ++this.loadId;
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
        var text = await response.text();
        if (requestId !== this.loadId) return;
        var documentFragment = new DOMParser().parseFromString(text, 'text/html');
        var source = documentFragment.querySelector('cart-recommendations');
        var products = source ? source.querySelector('[data-recommendation-products]') : null;
        this.innerHTML = products ? source.innerHTML : '';
        this.hidden = !products;
      } catch (error) {
        if (requestId !== this.loadId) return;
        this.innerHTML = '';
        this.hidden = true;
      }
    }
  }
  if (!customElements.get('cart-recommendations')) customElements.define('cart-recommendations', CartRecommendations);
})();
