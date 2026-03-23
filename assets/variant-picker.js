/* -------------------------------------------------------------------------- */
/*                         PRODUCT VARIANT PICKER                             */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class ProductVariantPicker extends HTMLElement {
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
          console.warn('ProductVariantPicker: Failed to parse JSON', e);
        }
      }

      if (!product) {
        console.warn('ProductVariantPicker: Product data is empty');
        return;
      }

      this.selects = this.querySelectorAll('product-variant-picker-item');
      if (this.selects.length == 0) {
        console.warn('ProductVariantPicker: No variant picker items found');
        return;
      }

      if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
        console.warn('ProductVariantPicker: No variants found');
        return;
      }

      if (!product.options || !Array.isArray(product.options) || product.options.length === 0) {
        console.warn('ProductVariantPicker: No options found');
        return;
      }

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
      var self = this;
      this.selects.forEach(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        var selectedValueSpan = select.querySelector('[data-selected-value]');

        if (selectedValueSpan) {
          if (checkedInput && checkedInput.value) {
            selectedValueSpan.textContent = checkedInput.value;
          } else {
            selectedValueSpan.textContent = '';
          }
        }
      });
    }

    selectFirstAvailableVariant() {
      if (!this.variants || !Array.isArray(this.variants) || this.variants.length === 0) {
        return;
      }

      var firstAvailableVariant = this.variants.find(function(variant) {
        return variant && variant.available;
      });

      if (firstAvailableVariant) {
        this.selectVariantByOptions(firstAvailableVariant);
      }
    }

    selectVariantByOptions(variant) {
      if (!variant || !this.selects || this.selects.length === 0) return;

      var optionValues = [];
      for (var i = 1; i <= this.optionsCount; i++) {
        var optionKey = 'option' + i;
        if (variant[optionKey]) {
          optionValues.push(String(variant[optionKey]));
        }
      }

      if (optionValues.length !== this.selects.length) {
        console.warn('ProductVariantPicker: Option values count mismatch');
        return;
      }

      var needsUpdate = false;
      var self = this;
      this.selects.forEach(function(select, index) {
        if (optionValues[index]) {
          var escapedValue = CSS.escape(optionValues[index]);
          var input = select.querySelector('input[type="radio"][value="' + escapedValue + '"]');

          if (input) {
            if (!input.checked) {
              var groupName = input.name;
              select.querySelectorAll('input[name="' + groupName + '"]').forEach(function(radio) {
                radio.checked = false;
              });

              input.checked = true;
              needsUpdate = true;
            }
          } else {
            console.warn('ProductVariantPicker: Radio button not found for value "' + optionValues[index] + '"');
          }
        }
      });

      if (needsUpdate) {
        setTimeout(function() {
          self.handleChange();
        }, 50);
      }
    }

    getSelectedVariant() {
      if (!this.selects || this.selects.length === 0) return null;
      if (!this.variants || !Array.isArray(this.variants)) return null;

      var selectedValues = Array.from(this.selects).map(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        return checkedInput ? checkedInput.value : null;
      });

      if (selectedValues.includes(null)) {
        return null;
      }

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          var index = idx + 1;
          var optionKey = 'option' + index;
          return val == variant[optionKey];
        });
      });

      return matched || null;
    }

    handleChange() {
      if (!this.selects || this.selects.length === 0) return;
      if (!this.variants || !Array.isArray(this.variants)) return;

      var selectedValues = Array.from(this.selects).map(function(select) {
        var checkedInput = select.querySelector('input[type="radio"]:checked');
        return checkedInput ? checkedInput.value : null;
      });

      this.updateAvailability(selectedValues);

      if (selectedValues.includes(null)) {
        return;
      }

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          var index = idx + 1;
          var optionKey = 'option' + index;
          return val == variant[optionKey];
        });
      });

      if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.events) {
        // Check if inside quickview - don't bubble to prevent affecting main product page
        var isInQuickview = this.closest('[data-quickview-product]') !== null;

        this.dispatchEvent(new CustomEvent(themeConfig.product.events.variant_change, {
          detail: matched || null,
          bubbles: !isInQuickview, // Only bubble if NOT in quickview
        }));
      } else {
        console.warn('ProductVariantPicker: Cannot dispatch variant_change event');
      }
    }

    updateAvailability(selectedValues) {
      if (!this.selects || this.selects.length === 0) return;
      if (!this.variants || !Array.isArray(this.variants)) return;
      if (!selectedValues || !Array.isArray(selectedValues)) return;

      var selectedCount = selectedValues.filter(function(val) {
        return val !== null;
      }).length;

      var self = this;
      this.selects.forEach(function(select, optionIndex) {
        var allInputs = select.querySelectorAll('input[type="radio"]');
        if (!allInputs || allInputs.length === 0) return;

        allInputs.forEach(function(input) {
          if (!input || !input.value) return;

          var value = input.value;
          var testCombo = selectedValues.slice();
          testCombo[optionIndex] = value;

          var hasAvailable = self.variants.some(function(variant) {
            if (!variant) return false;
            if (variant.available !== true) return false;

            if (selectedCount === 0) {
              var optionKey = 'option' + (optionIndex + 1);
              return variant[optionKey] == value;
            }

            return testCombo.every(function(val, idx) {
              var index = idx + 1;
              var optionKey = 'option' + index;
              return val == null || variant[optionKey] == val;
            });
          });

          var item = input.closest('.variant-picker__item');
          if (!item) return;

          if (!hasAvailable) {
            item.classList.add('sold_out');

          } else {
            item.classList.remove('sold_out');

          }
        });
      });
    }
  }
  if (!customElements.get('product-variant-picker')) customElements.define('product-variant-picker', ProductVariantPicker);

  /* -------------------------------------------------------------------------- */
  /*                         PRODUCT VARIANT SELECT                             */
  /* -------------------------------------------------------------------------- */

  class ProductVariantSelect extends HTMLElement {
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
          console.warn('ProductVariantSelect: Failed to parse JSON', e);
        }
      }

      if (!product) {
        // Fallback to themeConfig
        if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data) {
          product = themeConfig.product.data;
        }
      }

      if (!product || !product.variants || !product.options) return;

      this.selects = this.querySelectorAll('product-variant-select-item');
      if (this.selects.length == 0) return;

      this.variants = product.variants;
      this.optionsCount = product.options.length;
      this.crossOutUnavailable = this.hasAttribute('data-cross-out-unavailable');

      var self = this;
      this.querySelectorAll('select').forEach(function(selectEl) {
        selectEl.addEventListener('change', function() {
          self.handleChange();
        });
      });

      // Select first available variant
      setTimeout(function() {
        self.selectFirstAvailableVariant();
        self.updateAvailability();
      }, 100);
    }

    selectFirstAvailableVariant() {
      if (!this.variants || this.variants.length === 0) return;

      var firstAvailable = this.variants.find(function(v) { return v && v.available; });
      if (!firstAvailable) return;

      var self = this;
      this.selects.forEach(function(selectItem, index) {
        var selectEl = selectItem.querySelector('select');
        var optionKey = 'option' + (index + 1);
        if (selectEl && firstAvailable[optionKey]) {
          selectEl.value = firstAvailable[optionKey];
        }
      });

      this.handleChange();
    }

    handleChange() {
      var selectedValues = Array.from(this.selects).map(function(selectItem) {
        var selectEl = selectItem.querySelector('select');
        return selectEl ? selectEl.value || null : null;
      });

      this.updateAvailability();

      if (selectedValues.includes(null)) return;

      var matched = this.variants.find(function(variant) {
        if (!variant) return false;
        return selectedValues.every(function(val, idx) {
          var index = idx + 1;
          return val === variant['option' + index];
        });
      });

      if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.events) {
        var isInQuickview = this.closest('[data-quickview-product]') !== null;
        this.dispatchEvent(new CustomEvent(themeConfig.product.events.variant_change, {
          detail: matched || null,
          bubbles: !isInQuickview,
        }));
      }
    }

    updateAvailability() {
      if (!this.crossOutUnavailable) return;
      if (!this.selects || !this.variants) return;

      var self = this;
      var selectedValues = Array.from(this.selects).map(function(selectItem) {
        var selectEl = selectItem.querySelector('select');
        return selectEl ? selectEl.value || null : null;
      });

      this.selects.forEach(function(selectItem, optionIndex) {
        var selectEl = selectItem.querySelector('select');
        if (!selectEl) return;

        var options = selectEl.querySelectorAll('option');
        options.forEach(function(optionEl) {
          var value = optionEl.value;
          var testCombo = selectedValues.slice();
          testCombo[optionIndex] = value;

          var hasAvailable = self.variants.some(function(variant) {
            if (!variant || !variant.available) return false;
            return testCombo.every(function(val, idx) {
              return val == null || variant['option' + (idx + 1)] == val;
            });
          });

          if (!hasAvailable) {
            optionEl.setAttribute('data-unavailable', '');
            optionEl.disabled = true;
          } else {
            optionEl.removeAttribute('data-unavailable');
            optionEl.disabled = false;
          }
        });
      });
    }
  }
  if (!customElements.get('product-variant-select')) customElements.define('product-variant-select', ProductVariantSelect);

  /* -------------------------------------------------------------------------- */
  /*                      PRODUCT VARIANT PICKER IMAGE                          */
  /* -------------------------------------------------------------------------- */

  class ProductVariantPickerImage extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.option = this.dataset.option;
      this.value = this.dataset.value;

      if (typeof themeConfig === 'undefined' || !themeConfig.product || !themeConfig.product.data) {
        var self = this;
        setTimeout(function() {
          self.buildImage();
        }, 100);
        return;
      }

      this.buildImage();
    }

    buildImage() {
      var isInQuickview = this.closest('[data-quickview-product]') !== null;
      var product = null;

      if (isInQuickview) {
        if (typeof themeConfig !== 'undefined' && themeConfig.quickview && themeConfig.quickview.data) {
          product = themeConfig.quickview.data;
        }
      } else {
        if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data) {
          product = themeConfig.product.data;
        }
      }

      if (!product || !product.variants) return;

      var self = this;
      var variant = product.variants.find(function(v) {
        return v[self.option] == self.value && v.image;
      });

      var imageSrc = null;
      if (variant && variant.image) {
        if (typeof variant.image === 'string') {
          imageSrc = variant.image;
        } else if (variant.image.src) {
          imageSrc = variant.image.src;
        } else if (variant.image.url) {
          imageSrc = variant.image.url;
        }
      }

      if (!imageSrc) {
        if (typeof themeConfig !== 'undefined' && themeConfig.no_image_product) {
          imageSrc = themeConfig.no_image_product;
        } else {
          return;
        }
      }

      var finalSrc = ThemeUtils.resizeImage(imageSrc);

      var safeAlt = (this.value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      this.innerHTML = '<img width="40" height="40" src="' + finalSrc + '" alt="' + safeAlt + '" loading="lazy" decoding="async"/>';
    }
  }
  if (!customElements.get('product-variant-picker-image')) customElements.define('product-variant-picker-image', ProductVariantPickerImage);
})();
