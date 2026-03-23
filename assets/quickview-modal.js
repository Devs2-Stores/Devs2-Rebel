/* ============================================================================
   QUICKVIEW MODAL — Component JS
   Extracted from theme.js for code splitting
   Dependencies: ThemeUtils, themeConfig (loaded via theme.js)
   ============================================================================ */

(function() {
  'use strict';

  class QuickviewModal extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.isLoading = false;
      this.currentProduct = null;
      this.currentProductHandle = null;
      this.currentVariantId = null;
    }

    connectedCallback() {
      var self = this;
      this.overlay = this.querySelector('.quickview-modal-overlay');
      this.panel = this.querySelector('.quickview-modal-panel');
      this.content = this.querySelector('.quickview-modal-body');
      this.loading = this.querySelector('.quickview-modal-loading');

      // Bind events
      this.querySelectorAll('[data-action="close-quickview"]').forEach(function(el) {
        el.addEventListener('click', function() {
          self.close();
        });
      });

      // Close on overlay click
      if (this.overlay) {
        this.overlay.addEventListener('click', function(e) {
          if (e.target === self.overlay) {
            self.close();
          }
        });
      }

      // Close on ESC key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) {
          self.close();
        }
      });

      // Handle thumbnail clicks
      if (this.content) {
        this.content.addEventListener('click', function(e) {
          const thumbnail = e.target.closest('.quickview-thumbnail');
          if (thumbnail) {
            e.preventDefault();
            const imageSrc = thumbnail.dataset.imageSrc;
            const imageAlt = thumbnail.dataset.imageAlt;
            if (imageSrc) {
              self.updateFeaturedImage(imageSrc, imageAlt);
              // Update active thumbnail
              document.querySelectorAll('.quickview-thumbnail').forEach(function(thumb) {
                thumb.classList.remove('border-gray-600', 'dark:border-gray-400');
                thumb.classList.add('border-transparent');
              });
              thumbnail.classList.remove('border-transparent');
              thumbnail.classList.add('border-gray-600', 'dark:border-gray-400');
            }
          }
        });

        // Handle variant changes from radio inputs
        this.content.addEventListener('change', function(e) {
          if (e.target.closest('product-variant-picker')) {
            // Small delay to ensure variant picker has processed the change
            setTimeout(function() {
              self.handleVariantChange();
            }, 50);
          }
        });

        // Handle add to cart
        this.content.addEventListener('click', function(e) {
          const addBtn = e.target.closest('[data-product-add]');
          if (addBtn && !addBtn.disabled) {
            e.preventDefault();
            self.handleAddToCart();
          }
        });

        // Handle quickview variant change
        this.content.addEventListener('quickview:variant_change', function(e) {
          self.handleQuickviewVariantChange(e.detail);
        });
      }
    }

    handleQuickviewVariantChange(variant) {
      if (!this.content) return;

      // Update price - use formatPrice like ProductTemplate
      var priceEl = this.content.querySelector('[data-product-price]');
      var compareEl = this.content.querySelector('[data-product-compare]');
      var saleEl = this.content.querySelector('[data-product-sale]');

      if (variant && variant.price !== undefined) {
        if (priceEl) {
          if (variant.price === 0) {
            priceEl.textContent = (themeConfig.strings.variant || {}).contact || 'Contact';
          } else {
            priceEl.textContent = typeof formatPrice === 'function' ? formatPrice(variant.price) : (typeof formatMoney === 'function' ? formatMoney(variant.price) : variant.price);
          }
        }

        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          if (compareEl) {
            compareEl.style.display = 'block';
            compareEl.textContent = typeof formatPrice === 'function' ? formatPrice(variant.compare_at_price) : (typeof formatMoney === 'function' ? formatMoney(variant.compare_at_price) : variant.compare_at_price);
          }
          if (saleEl) {
            saleEl.style.display = 'block';
            var percent = Math.round((variant.compare_at_price - variant.price) * 100 / variant.compare_at_price);
            saleEl.textContent = '-' + percent + '%';
          }
        } else {
          if (compareEl) compareEl.style.display = 'none';
          if (saleEl) saleEl.style.display = 'none';
        }
      }

      // Update availability
      var availableEl = this.content.querySelector('[data-product-available]');
      var addBtn = this.content.querySelector('[data-product-add]');
      var addText = this.content.querySelector('[data-add-text]');

      if (variant) {
        if (availableEl) {
          availableEl.textContent = variant.available ? ((themeConfig.strings.variant || {}).inStock || 'In stock') : ((themeConfig.strings.variant || {}).soldOut || 'Sold out');
          availableEl.className = variant.available ? 'quickview-product__status--available' : 'quickview-product__status--unavailable';
        }
        if (addBtn) {
          addBtn.disabled = !variant.available;
        }
        if (addText) {
          addText.textContent = variant.available ? ((themeConfig.strings.variant || {}).addToCart || 'Add to cart') : ((themeConfig.strings.variant || {}).soldOut || 'Sold out');
        }

        // Update current variant id
        this.currentVariantId = variant.id;
      }

      // Update SKU
      var skuEl = this.content.querySelector('[data-product-sku]');
      if (skuEl && variant && variant.sku) {
        skuEl.textContent = variant.sku;
      }

      // Update Swiper slide to variant image - same logic as ProductTemplate
      if (variant && variant.image && this.quickviewSwiper) {
        var imageSrc = typeof variant.image === 'string' ? variant.image : (variant.image.src || variant.image.url);
        if (!imageSrc) return;

        var self = this;
        var slides = this.content.querySelectorAll('.quickview-product__slider .swiper-slide img');
        var getFilename = function(url) {
          return url.split('/').pop().split('?')[0].replace(/(_\d+x\d+)/, '');
        };

        for (var i = 0; i < slides.length; i++) {
          if (getFilename(slides[i].src) === getFilename(imageSrc)) {
            this.quickviewSwiper.slideTo(i);
            break;
          }
        }
      }
    }

    async open(productHandle) {
      var self = this;
      if (this.isOpen && this.currentProductHandle === productHandle) return;
      // Close viewed modal if open
      var viewedModal = document.querySelector('viewed-modal');
      if (viewedModal && viewedModal.close && typeof viewedModal.close === 'function') {
        viewedModal.close();
      }

      this.currentProductHandle = productHandle;
      this.isOpen = true;
      this.classList.remove('hidden');
      ThemeUtils.lockScroll();
      ThemeUtils.trapFocus(this);

      // Trigger animation
      setTimeout(function() {
        if (self.panel) {
          self.panel.classList.remove('scale-95', 'opacity-0');
          self.panel.classList.add('scale-100', 'opacity-100');
        }
      }, 10);

      // Load product
      await this.loadProduct(productHandle);
    }

    close() {
      var self = this;
      if (!this.isOpen) return;

      this.isOpen = false;
      if (this.panel) {
        this.panel.classList.remove('scale-100', 'opacity-100');
        this.panel.classList.add('scale-95', 'opacity-0');
      }
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(this);

      // Clean up document-level variant:change listener
      if (this.documentVariantChangeHandler) {
        document.removeEventListener('variant:change', this.documentVariantChangeHandler, true);
        this.documentVariantChangeHandler = null;
      }

      setTimeout(function() {
        self.classList.add('hidden');
        if (self.content) self.content.innerHTML = '';
        self.currentProductHandle = null;
        self.currentVariantId = null;
        self.currentProduct = null;
      }, 300);
    }

    async loadProduct(handle) {
      if (this.isLoading) return;
      this.isLoading = true;
      this.showLoading();

      try {
        const html = await ThemeUtils.request({
          url: '/search?q=filter=(handle:product=' + encodeURIComponent(handle) + ')&view=quickview',
          method: 'GET',
          parser: 'text'
        });
        if (this.content) this.content.innerHTML = html;

        var scriptTag = this.content ? (this.content.querySelector('script[type="application/json"][id="quickview-product-json"]') || this.content.querySelector('script[type="application/json"][id="quickview-variant-json"]')) : null;
        if (!scriptTag) {
          scriptTag = this.content ? this.content.querySelector('script[type="application/json"]') : null;
        }
        if (scriptTag && scriptTag.textContent) {
          try {
            this.currentProduct = JSON.parse(scriptTag.textContent.trim());
            if (typeof themeConfig !== 'undefined' && themeConfig.quickview && themeConfig.quickview.data) {
              themeConfig.quickview.data = this.currentProduct;
            }
          } catch (e) {
            console.warn('ProductVariantPicker: Failed to parse JSON from script tag', e);
          }
        }

        await new Promise(function(resolve) {
          setTimeout(resolve, 200);
        });

        if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length > 1) {
          await this.initializeVariantPicker();
        } else if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length === 1) {
          this.currentVariantId = this.currentProduct.variants[0].id;
        }

        this.initializeQuantitySelector();
        this.initializeSwiper();
      } catch (error) {
        console.error('Error loading product:', error);
        if (this.content) this.content.innerHTML = '<div class="text-center text-red-500 py-12">' + ((themeConfig.strings.variant || {}).loadError || 'Error loading product') + '</div>';
      } finally {
        this.isLoading = false;
        this.hideLoading();
      }
    }

    async initializeVariantPicker() {
      var self = this;
      if (!this.content) return;
      const variantPicker = this.content.querySelector('product-variant-picker, quickview-variant-picker');
      if (!variantPicker) {
        console.warn('Quickview: Variant picker not found');
        return;
      }
      if (variantPicker && typeof variantPicker.init === 'function') variantPicker.init();
      if (!variantPicker.variants || variantPicker.variants.length === 0) {
        if (typeof variantPicker.connectedCallback === 'function') {
          variantPicker.connectedCallback();
        }
        // Wait for initialization to complete
        await new Promise(function(resolve) {
          setTimeout(resolve, 200);
        });

        // Verify variants were set correctly
        if (!variantPicker.variants || variantPicker.variants.length === 0) {
          console.warn('Quickview: Variant picker variants not set after initialization');
          // Try to set variants directly
          if (themeConfig.quickview.data && themeConfig.quickview.data.variants) {
            variantPicker.variants = themeConfig.quickview.data.variants;
            variantPicker.optionsCount = themeConfig.quickview.data.options ? themeConfig.quickview.data.options.length : 0;
          }
        }

        // Force select first available variant
        if (typeof variantPicker.selectFirstAvailableVariant === 'function') {
          variantPicker.selectFirstAvailableVariant();
        }
      } else {
        // Already initialized, just select first variant
        if (typeof variantPicker.selectFirstAvailableVariant === 'function') {
          variantPicker.selectFirstAvailableVariant();
        }
      }

      // Wait a bit more for custom elements to be ready
      await new Promise(function(resolve) {
        setTimeout(resolve, 100);
      });

      // Initialize variant picker images (must be before restore)
      this.initializeVariantPickerImages();

      // Ensure first option is checked and styled correctly (must be before restore)
      this.ensureFirstVariantSelected();

      // Wait a bit for ensureFirstVariantSelected to complete
      await new Promise(function(resolve) {
        setTimeout(resolve, 100);
      });

      // Force update availability one more time before restoring
      // This ensures all options are properly marked based on current selections
      if (typeof variantPicker.updateAvailability === 'function' && variantPicker.selects && variantPicker.variants) {
        const selectedValues = Array.from(variantPicker.selects).map(function(select) {
          const checkedInput = select.querySelector('input[type="radio"]:checked');
          return checkedInput ? checkedInput.value : null;
        });
        // Call updateAvailability with current selected values
        variantPicker.updateAvailability(selectedValues);
      }

      // Restore original product data AFTER all initialization is complete
      // Variant picker already has variants stored in its instance, so it will continue working
      if (this.currentProduct) {
        if (themeConfig.product) themeConfig.product.data = this.currentProduct;
      } else if (themeConfig.product && themeConfig.product.data === themeConfig.quickview.data) {
        // Only clear if we set it (don't clear if it was already set to something else)
        delete themeConfig.product.data;
      }

      // Set initial variant ID
      const quickviewProduct = themeConfig.quickview.data;
      const firstVariant = variantPicker.getSelectedVariant ? variantPicker.getSelectedVariant() : null;
      if (firstVariant) {
        this.currentVariantId = firstVariant.id;
        // Update initial price and availability
        this.updatePrice(firstVariant.price, firstVariant.compare_at_price);
        this.updateAvailability(firstVariant.available);
        this.updateAddToCartButton(firstVariant.available, firstVariant.price);
      } else if (quickviewProduct.variants && quickviewProduct.variants.length > 0) {
        this.currentVariantId = quickviewProduct.variants[0].id;
      }

      // Listen for variant change events directly on variant picker
      const variantChangeHandler = function(e) {
        // Event detail contains the variant object
        if (e.detail) {
          self.handleVariantChange(e.detail);
        } else {
          // Fallback: get variant from picker
          self.handleVariantChange();
        }
      };

      // Remove old listener if exists
      if (this.variantChangeHandler) {
        variantPicker.removeEventListener('variant:change', this.variantChangeHandler);
      }

      this.variantChangeHandler = variantChangeHandler;
      variantPicker.addEventListener('variant:change', variantChangeHandler);

      // Also listen on document as fallback
      const documentVariantChangeHandler = function(e) {
        // Only handle if event originated from this quickview's variant picker
        if (e.target && self.content && self.content.contains(e.target)) {
          if (e.detail) {
            self.handleVariantChange(e.detail);
          } else {
            self.handleVariantChange();
          }
        }
      };

      if (this.documentVariantChangeHandler) {
        document.removeEventListener('variant:change', this.documentVariantChangeHandler);
      }
      this.documentVariantChangeHandler = documentVariantChangeHandler;
      document.addEventListener('variant:change', documentVariantChangeHandler, true);
    }

    /**
     * Handle variant change
     */
    handleVariantChange(variantFromEvent = null) {
      if (typeof themeConfig === 'undefined' || !themeConfig.quickview || !themeConfig.quickview.data) return;

      const variantPicker = this.content ? this.content.querySelector('product-variant-picker') : null;
      if (!variantPicker) return;

      // Get selected variant - prefer variant from event, otherwise get from picker
      let selectedVariant = variantFromEvent;
      if (!selectedVariant && variantPicker.getSelectedVariant) {
        selectedVariant = variantPicker.getSelectedVariant();
      }

      if (!selectedVariant) {
        console.warn('Quickview: No variant selected');
        return;
      }

      this.currentVariantId = selectedVariant.id;

      // Update price
      this.updatePrice(selectedVariant.price, selectedVariant.compare_at_price);

      // Update availability
      this.updateAvailability(selectedVariant.available);

      // Update image if variant has image
      if (selectedVariant.featured_image) {
        const imageSrc = typeof selectedVariant.featured_image === 'string' ?
          selectedVariant.featured_image :
          (selectedVariant.featured_image.src || selectedVariant.featured_image);
        const quickviewProduct = themeConfig.quickview.data;
        const imageAlt = typeof selectedVariant.featured_image === 'object' && selectedVariant.featured_image.alt ?
          selectedVariant.featured_image.alt :
          (quickviewProduct.title || '');
        this.updateFeaturedImage(imageSrc, imageAlt);
      }

      // Update add to cart button
      this.updateAddToCartButton(selectedVariant.available, selectedVariant.price);
    }

    /**
     * Update price display
     */
    updatePrice(price, comparePrice) {
      if (!this.content) return;
      const priceCurrent = this.content.querySelector('.quickview-price-current');
      const priceCompare = this.content.querySelector('.quickview-price-compare');
      const priceBadge = this.content.querySelector('.quickview-price-badge');

      if (priceCurrent) {
        if (price === 0) {
          priceCurrent.textContent = (themeConfig.strings.variant || {}).contact || 'Contact';
          priceCurrent.className = 'text-xl font-bold text-red-500';
        } else {
          priceCurrent.textContent = ThemeUtils.formatMoney(price);
          priceCurrent.className = 'quickview-price-current text-2xl font-bold text-red-500 dark:text-red-400';
        }
      }

      if (comparePrice && comparePrice > price) {
        if (priceCompare) {
          priceCompare.textContent = ThemeUtils.formatMoney(comparePrice);
          priceCompare.classList.remove('hidden');
        }

        if (priceBadge) {
          const discount = Math.round((comparePrice - price) * 100 / comparePrice);
          priceBadge.textContent = '-' + discount + '%';
          priceBadge.classList.remove('hidden');
        }
      } else {
        if (priceCompare) priceCompare.classList.add('hidden');
        if (priceBadge) priceBadge.classList.add('hidden');
      }
    }

    /**
     * Update availability display
     */
    updateAvailability(available) {
      if (!this.content) return;
      const availabilityEl = this.content.querySelector('.quickview-product-availability');
      if (!availabilityEl) return;

      if (available) {
        availabilityEl.innerHTML = '<span class="inline-flex items-center gap-2 text-green-600 dark:text-green-400">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' +
          '</svg>' +
          ((themeConfig.strings.variant || {}).inStock || 'In stock') +
          '</span>';
      } else {
        availabilityEl.innerHTML = '<span class="inline-flex items-center gap-2 text-red-600 dark:text-red-400">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' +
          '</svg>' +
          ((themeConfig.strings.variant || {}).soldOut || 'Sold out') +
          '</span>';
      }
    }

    /**
     * Update featured image
     */
    updateFeaturedImage(src, alt) {
      if (!this.content) return;
      const featuredImage = this.content.querySelector('#quickview-featured-image');
      if (featuredImage) {
        featuredImage.src = src;
        featuredImage.alt = alt || '';
      }
    }

    /**
     * Update add to cart button
     */
    updateAddToCartButton(available, price) {
      if (!this.content) return;
      const addBtn = this.content.querySelector('[data-action="quickview-add-to-cart"]');
      const addBtnText = this.content.querySelector('.quickview-add-to-cart-text');

      if (!addBtn) return;

      if (price === 0) {
        addBtn.disabled = false;
        if (addBtnText) addBtnText.textContent = (themeConfig.strings.variant || {}).contact || 'Contact';
      } else if (available) {
        addBtn.disabled = false;
        if (addBtnText) addBtnText.textContent = (themeConfig.strings.variant || {}).addToCart || 'Add to cart';
      } else {
        addBtn.disabled = true;
        if (addBtnText) addBtnText.textContent = (themeConfig.strings.variant || {}).soldOut || 'Sold out';
      }
    }

    /**
     * Initialize variant picker images
     */
    initializeVariantPickerImages() {
      if (!this.content) return;
      // Find all variant picker image elements
      const imageElements = this.content.querySelectorAll('product-variant-picker-image');
      if (imageElements.length === 0) return;

      // Ensure themeConfig.quickview is set
      if (typeof themeConfig === 'undefined' || !themeConfig.quickview || !themeConfig.quickview.data) {
        console.warn('Quickview: Cannot initialize variant picker images - themeConfig.quickview not set');
        return;
      }

      // Temporarily set product data for variant picker image compatibility
      const originalProductData = themeConfig.product ? themeConfig.product.data : null;
      themeConfig.product = themeConfig.product || {};
      themeConfig.product.data = themeConfig.quickview.data;

      // Force initialize each image element
      imageElements.forEach(function(imgEl) {
        // Check if already initialized
        if (imgEl.innerHTML && imgEl.innerHTML.trim() !== '') {
          return; // Already has content
        }

        // Force call connectedCallback if available
        if (typeof imgEl.connectedCallback === 'function') {
          imgEl.connectedCallback();
        } else if (typeof imgEl.buildImage === 'function') {
          // Direct call to buildImage if available
          imgEl.buildImage();
        } else {
          // Manual initialization
          const option = imgEl.dataset.option;
          const value = imgEl.dataset.value;
          const quickviewProduct = themeConfig.quickview.data;
          if (option && value && quickviewProduct && quickviewProduct.variants) {
            // Find variant with matching option value that has an image
            const variant = quickviewProduct.variants.find(function(v) {
              if (!v || !v[option]) return false;
              return v[option] == value && v.image;
            });

            if (variant && variant.image) {
              let imageSrc = null;
              if (typeof variant.image === 'string') {
                imageSrc = variant.image.trim();
              } else if (variant.image && typeof variant.image === 'object') {
                imageSrc = variant.image.src || variant.image.url || null;
              }

              if (imageSrc) {
                // Normalize image source
                try {
                  imageSrc = ThemeUtils.resizeImage(imageSrc);
                } catch (e) {
                  console.warn('Quickview: Error resizing image', e);
                }

                imgEl.innerHTML = '<img width="40" height="40" src="' + imageSrc + '" alt="' + value + '" loading="lazy" decoding="async"/>';
              }
            }
          }
        }
      });

      // Restore original product data
      if (originalProductData) {
        themeConfig.product.data = originalProductData;
      } else if (themeConfig.product.data === themeConfig.quickview.data) {
        delete themeConfig.product.data;
      }
    }

    /**
     * Ensure first variant option is selected and styled
     */
    ensureFirstVariantSelected() {
      if (!this.content) return;
      const variantPicker = this.content.querySelector('product-variant-picker');
      if (!variantPicker) return;

      // Check if variant picker has selectFirstAvailableVariant method
      if (typeof variantPicker.selectFirstAvailableVariant === 'function') {
        variantPicker.selectFirstAvailableVariant();
      } else {
        // Fallback: manually check first radio in each group
        const pickerItems = variantPicker.querySelectorAll('product-variant-picker-item');
        pickerItems.forEach(function(item) {
          // Check if any radio is already checked in this group
          const checkedRadio = item.querySelector('input[type="radio"]:checked');
          if (!checkedRadio) {
            // Find first available (not sold_out) radio input in this group
            const radios = item.querySelectorAll('input[type="radio"]');
            for (let radio of radios) {
              const itemEl = radio.closest('.variant-picker__item');
              if (itemEl && !itemEl.classList.contains('sold_out')) {
                radio.checked = true;
                // Trigger change event to update UI
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
            // If no available option, check first one anyway
            if (radios.length > 0 && !item.querySelector('input[type="radio"]:checked')) {
              radios[0].checked = true;
              radios[0].dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      }
    }

    /**
     * Initialize quantity selector
     */
    initializeQuantitySelector() {
      if (!this.content) return;
      const quantitySelector = this.content.querySelector('quantity-selector');
      if (quantitySelector && quantitySelector.connectedCallback) {
        quantitySelector.connectedCallback();
      }
    }

    /**
     * Handle add to cart
     */
    async handleAddToCart() {
      // Use currentVariantId (already set by handleQuickviewVariantChange)
      if (!this.currentVariantId) {
        // Fallback: get from quickview data
        const quickviewProduct = themeConfig.quickview ? themeConfig.quickview.data : null;
        if (quickviewProduct && quickviewProduct.variants && quickviewProduct.variants.length > 0) {
          const firstAvailable = quickviewProduct.variants.find(function(v) {
            return v.available;
          });
          const fallbackVariant = firstAvailable || quickviewProduct.variants[0];
          this.currentVariantId = fallbackVariant.id;
        }
      }

      if (!this.currentVariantId) {
        if (typeof showToast === 'function') showToast((themeConfig.strings.variant || {}).selectAllOptions || 'Please select all options', 'error');
        return;
      }

      // Get quantity
      const quantityInput = this.content ? this.content.querySelector('quantity-selector input') : null;
      const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

      // Get add button
      const addBtn = this.content ? this.content.querySelector('[data-product-add]') : null;
      const addBtnText = this.content ? this.content.querySelector('[data-add-text]') : null;
      const originalText = addBtnText ? addBtnText.textContent : '';

      // Disable button and show loading
      if (addBtn) {
        addBtn.disabled = true;
        if (addBtnText) addBtnText.textContent = (themeConfig.strings.variant || {}).adding || 'Adding...';
      }

      try {
        const data = await ThemeUtils.request({
          url: '/cart/add.js',
          method: 'POST',
          body: {
            id: this.currentVariantId,
            quantity: quantity
          }
        });

        // Update cart data
        if (typeof ThemeUtils !== 'undefined' && typeof ThemeUtils.updateCartData === 'function') {
          await ThemeUtils.updateCartData(data);
        } else if (typeof updateCartData === 'function') {
          await updateCartData(data);
        }

        // Dispatch event
        document.dispatchEvent(new CustomEvent('cart:item_added', { detail: data }));

        // Open cart sidebar if enabled
        if (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.auto_open_sidebar) {
          if (typeof openCartSidebar === 'function') {
            openCartSidebar();
          } else if (typeof openCartModal === 'function') {
            openCartModal();
          }
        }

        // Close quickview
        this.close();

      } catch (error) {
        console.error('Add to cart error:', error);
        if (typeof showToast === 'function') showToast((themeConfig.strings.cart || {}).itemError || 'Could not add to cart', 'error');
      } finally {
        // Re-enable button
        if (addBtn) {
          addBtn.disabled = false;
          if (addBtnText) addBtnText.textContent = originalText;
        }
      }
    }

    /**
     * Show loading state
     */
    showLoading() {
      if (this.loading) {
        this.loading.classList.remove('hidden');
      }
      if (this.content) {
        this.content.classList.add('hidden');
      }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
      if (this.loading) {
        this.loading.classList.add('hidden');
      }
      if (this.content) {
        this.content.classList.remove('hidden');
      }
    }

    initializeSwiper() {
      if (!this.content || typeof Swiper === 'undefined') return;

      var self = this;
      var mainEl = this.content.querySelector('.quickview-product__slider');
      var thumbsEl = this.content.querySelector('.quickview-product__thumbs');

      if (!mainEl) return;

      // Init thumbs first if exists
      var thumbsSwiper = null;
      if (thumbsEl) {
        thumbsSwiper = new Swiper(thumbsEl, {
          spaceBetween: 8,
          slidesPerView: 4.5,
          freeMode: true,
          watchSlidesProgress: true,
          slideToClickedSlide: true,
          breakpoints: {
            768: {
              slidesPerView: 4.5,
              spaceBetween: 10
            }
          }
        });
      }

      // Init main swiper
      this.quickviewSwiper = new Swiper(mainEl, {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: false,
        navigation: {
          nextEl: mainEl.querySelector('.swiper-button-next'),
          prevEl: mainEl.querySelector('.swiper-button-prev')
        },
        thumbs: { swiper: thumbsSwiper }
      });
    }
  }
  customElements.define('quickview-modal', QuickviewModal);

  // Global function to open quickview
  function openQuickview(productHandle) {
    const quickviewModal = document.querySelector('quickview-modal');
    if (quickviewModal) {
      quickviewModal.open(productHandle);
    }
  }
  window.openQuickview = openQuickview;

  // Handle quickview button clicks
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
      const quickviewBtn = e.target.closest('[data-action="open-quickview"]');
      if (quickviewBtn) {
        e.preventDefault();
        var productHandleEl = quickviewBtn.closest('[data-product-handle]');
        const productHandle = quickviewBtn.dataset.productHandle || (productHandleEl ? productHandleEl.dataset.productHandle : null);
        if (productHandle) {
          openQuickview(productHandle);
        }
      }
    });
  });

})();
