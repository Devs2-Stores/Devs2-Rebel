(function() {
  'use strict';

  window.ProductModel = {
    loadShopifyXR() {
      if (typeof Shopify === 'undefined' || !Shopify.loadFeatures) return;
      Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: this.setupShopifyXR.bind(this),
        },
      ]);
    },

    setupShopifyXR(errors) {
      if (errors) return;

      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function() {
          window.ProductModel.setupShopifyXR();
        });
        return;
      }

      document.querySelectorAll('[id^="ModelJson-"], [id^="ProductJSON-"]').forEach(function(modelJSON) {
        try {
          window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
          modelJSON.remove();
        } catch (e) {}
      });
      window.ShopifyXR.setupXRElements();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (window.ProductModel) window.ProductModel.loadShopifyXR();
    });
  } else {
    if (window.ProductModel) window.ProductModel.loadShopifyXR();
  }
})();
