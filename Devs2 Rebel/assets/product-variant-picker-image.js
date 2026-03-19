class ProductVariantPickerImage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.option = this.dataset.option;
    this.value = this.dataset.value;

    // Wait for themeConfig to be available
    if (typeof themeConfig === 'undefined' || !themeConfig.product || !themeConfig.product.data) {
      // Retry after a short delay if themeConfig is not ready
      setTimeout(() => this.buildImage(), 100);
      return;
    }

    this.buildImage();
  }

  /**
   * Build and display variant picker image
   * Finds the first variant with matching option value that has an image
   */
  buildImage() {
    // Check if themeConfig is available
    if (typeof themeConfig === 'undefined' || !themeConfig.product || !themeConfig.product.data) {
      return;
    }

    const product = themeConfig.product.data;
    if (!product || !product.variants) return;

    // Find variant with matching option value that has an image
    const variant = product.variants.find(v => {
      return v[this.option] == this.value && v.image;
    });

    // Determine image source
    let imageSrc = null;
    if (variant && variant.image) {
      // Handle different image formats
      if (typeof variant.image === 'string') {
        imageSrc = variant.image;
      } else if (variant.image.src) {
        imageSrc = variant.image.src;
      } else if (variant.image.url) {
        imageSrc = variant.image.url;
      }
    }

    // Fallback to no_image if no variant image found
    if (!imageSrc) {
      if (typeof themeConfig !== 'undefined' && themeConfig.no_image_product) {
        imageSrc = themeConfig.no_image_product;
      } else {
        // Don't render anything if no image available
        return;
      }
    }

    // Normalize image source
    let finalSrc = imageSrc;
    if (window.ThemeUtils && typeof window.ThemeUtils.resizeImage === 'function') {
      finalSrc = window.ThemeUtils.resizeImage(imageSrc);
    }

    // Render image
    this.innerHTML = `<img width="40" height="40" src="${finalSrc}" alt="${this.value || ''}" loading="lazy" decoding="async"/>`;
  }
}
if (!customElements.get('product-variant-picker-image')) {
  customElements.define('product-variant-picker-image', ProductVariantPickerImage);
}