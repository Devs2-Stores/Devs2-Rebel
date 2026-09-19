(function() {
  'use strict';

  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      var productId = this.dataset.productId;
      if (!productId) return;

      var url = new URL(this.dataset.url, window.location.origin);
      url.searchParams.set('section_id', this.dataset.sectionId);
      url.searchParams.set('product_id', productId);
      url.searchParams.set('limit', this.dataset.limit || '4');
      if (this.dataset.intent) url.searchParams.set('intent', this.dataset.intent);

      fetch(url.toString(), { headers: { Accept: 'text/html' } })
        .then(function(response) {
          if (!response.ok) throw new Error('Recommendations unavailable');
          return response.text();
        })
        .then(function(text) {
          var documentFragment = new DOMParser().parseFromString(text, 'text/html');
          var source = documentFragment.querySelector('product-recommendations');
          var products = source ? source.querySelector('[data-recommendation-products]') : null;
          if (!products) {
            this.remove();
            return;
          }
          this.innerHTML = source.innerHTML;
          this.hidden = false;
        }.bind(this))
        .catch(function() {
          this.remove();
        }.bind(this));
    }
  }

  if (!customElements.get('product-recommendations')) {
    customElements.define('product-recommendations', ProductRecommendations);
  }
})();
