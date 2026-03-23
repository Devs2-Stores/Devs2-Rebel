/* -------------------------------------------------------------------------- */
/*                    QUICKVIEW VARIANT PICKER (SEPARATE)                     */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class QuickviewVariantPicker extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.init();
    }

    init() {
      var product = null;
      var scriptTag = this.querySelector('script[type="application/json"]');

      if (scriptTag && scriptTag.textContent) {
        try {
          product = JSON.parse(scriptTag.textContent.trim());
        } catch (e) {
          console.warn('QuickviewVariantPicker: Failed to parse JSON', e);
        }
      }

      if (!product) return;

      this.selects = this.querySelectorAll('quickview-variant-picker-item');
      if (this.selects.length == 0) return;

      if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) return;
      if (!product.options || !Array.isArray(product.options) || product.options.length === 0) return;

      this.variants = product.variants;
      this.optionsCount = product.options.length;

      var self = this;
      this.querySelectorAll('input[type="radio"]').forEach(function(input) {
        input.addEventListener('change', function() {
          self.handleChange();
          self.updateSelectedValueDisplay();
        });
      });

      var emptySelectedValues = Array(this.optionsCount).fill(null);
      this.updateAvailability(emptySelectedValues);

      setTimeout(function() {
        self.selectFirstAvailableVariant();
        setTimeout(function() {
          var selectedValues = Array.from(self.selects).map(function(select) {
            var checkedInput = select.querySelector('input[type="radio"]:checked');
            return checkedInput ? checkedInput.value : null;
          });
          self.updateAvailability(selectedValues);
          self.updateSelectedValueDisplay();
        }, 50);
      }, 100);
    }

    updateSelectedValueDisplay() {
      this.selects.forEach(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        var selectedValueSpan = select.querySelector('[data-selected-value]');
        if (selectedValueSpan) {
          selectedValueSpan.textContent = checkedInput && checkedInput.value ? checkedInput.value : '';
        }
      });
    }

    selectFirstAvailableVariant() {
      if (!this.variants || this.variants.length === 0) return;

      var firstAvailableVariant = this.variants.find(function(v) {
        return v && v.available;
      });
      if (firstAvailableVariant) {
        this.selectVariantByOptions(firstAvailableVariant);
      }
    }

    selectVariantByOptions(variant) {
      if (!variant || !this.selects || this.selects.length === 0) return;

      var optionValues = [];
      for (var i = 1; i <= this.optionsCount; i++) {
        if (variant['option' + i]) optionValues.push(String(variant['option' + i]));
      }

      var self = this;
      var needsUpdate = false;
      this.selects.forEach(function(select, index) {
        if (optionValues[index]) {
          var escapedValue = CSS.escape(optionValues[index]);
          var input = select.querySelector('input[type="radio"][value="' + escapedValue + '"]');
          if (input && !input.checked) {
            var groupName = input.name;
            select.querySelectorAll('input[name="' + groupName + '"]').forEach(function(r) {
              r.checked = false;
            });
            input.checked = true;
            needsUpdate = true;
          }
        }
      });
      if (needsUpdate) {
        var that = this;
        setTimeout(function() {
          that.handleChange();
        }, 50);
      }
    }

    handleChange() {
      if (!this.selects || this.selects.length === 0) return;
      if (!this.variants || !Array.isArray(this.variants)) return;

      var selectedValues = Array.from(this.selects).map(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        return checkedInput ? checkedInput.value : null;
      });

      this.updateAvailability(selectedValues);
      if (selectedValues.includes(null)) return;

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          return val == variant['option' + (idx + 1)];
        });
      });

      this.dispatchEvent(new CustomEvent('quickview:variant_change', {
        detail: matched || null,
        bubbles: true,
      }));
    }

    updateAvailability(selectedValues) {
      if (!this.variants || !this.selects) return;
      var self = this;

      this.selects.forEach(function(select, selectIndex) {
        var inputs = select.querySelectorAll('input[type="radio"]');
        inputs.forEach(function(input) {
          var value = input.value;
          var testValues = selectedValues.slice();
          testValues[selectIndex] = value;

          var isAvailable = self.variants.some(function(variant) {
            if (!variant) return false;
            var matchesSelected = testValues.every(function(val, idx) {
              if (val === null) return true;
              return val == variant['option' + (idx + 1)];
            });
            return matchesSelected && variant.available;
          });

          var item = input.closest('.variant-picker__item');
          if (item) {
            if (isAvailable) {
              item.classList.remove('variant-picker__item--sold-out', 'sold_out');
            } else {
              item.classList.add('variant-picker__item--sold-out', 'sold_out');
            }
          }
        });
      });
    }
  }
  customElements.define('quickview-variant-picker', QuickviewVariantPicker);

  class QuickviewVariantPickerItem extends HTMLElement {
    constructor() {
      super();
    }
  }
  customElements.define('quickview-variant-picker-item', QuickviewVariantPickerItem);

  class QuickviewVariantPickerImage extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.option = this.dataset.option;
      this.value = this.dataset.value;
      this.retryCount = 0;
      this.maxRetries = 10;
      var self = this;
      setTimeout(function() {
        self.buildImage();
      }, 50);
    }

    buildImage() {
      var self = this;

      var picker = this.closest('quickview-variant-picker');
      var product = null;

      if (picker) {
        var scriptTag = picker.querySelector('script[type="application/json"]');
        if (scriptTag && scriptTag.textContent) {
          try {
            product = JSON.parse(scriptTag.textContent.trim());
          } catch (e) {
            console.warn('QuickviewVariantPickerImage: Failed to parse JSON', e);
          }
        }
      }

      if (!product && typeof themeConfig !== 'undefined' && themeConfig.quickview && themeConfig.quickview.data) {
        product = themeConfig.quickview.data;
      }

      if (!product || !product.variants) {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(function() {
            self.buildImage();
          }, 200);
        }
        return;
      }

      var variant = product.variants.find(function(v) {
        return v[self.option] == self.value && v.image;
      });

      var imageSrc = null;
      if (variant && variant.image) {
        if (typeof variant.image === 'string') imageSrc = variant.image;
        else if (variant.image.src) imageSrc = variant.image.src;
        else if (variant.image.url) imageSrc = variant.image.url;
      }

      if (!imageSrc) {
        if (typeof themeConfig !== 'undefined' && themeConfig.no_image_product) {
          imageSrc = themeConfig.no_image_product;
        } else return;
      }

      var finalSrc = ThemeUtils.resizeImage(imageSrc);

      var safeAlt = (this.value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      this.innerHTML = '<img width="40" height="40" src="' + finalSrc + '" alt="' + safeAlt + '" loading="lazy" decoding="async"/>';
    }
  }
  customElements.define('quickview-variant-picker-image', QuickviewVariantPickerImage);
})();
