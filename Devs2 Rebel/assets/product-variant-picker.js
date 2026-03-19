class ProductVariantPicker extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    // Try to get product data from script tag first (preferred method)
    let product = null;
    const scriptTag = this.querySelector('script[type="application/json"]');

    if (scriptTag && scriptTag.textContent) {
      try {
        product = JSON.parse(scriptTag.textContent.trim());
      } catch (e) {
        console.warn('ProductVariantPicker: Failed to parse JSON from script tag', e);
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

    // Validate variants and options
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

    // Bind change events
    this.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => this.handleChange());
    });

    // Initialize availability states with all nulls (no options selected yet)
    // This will mark all options as available initially (only check if option value exists)
    const emptySelectedValues = Array(this.optionsCount).fill(null);
    this.updateAvailability(emptySelectedValues);

    const hasCheckedInput = this.querySelector('input[type="radio"]:checked') !== null;
    let hasUrlVariant = false;
    try {
      const url = new URL(window.location.href);
      hasUrlVariant = !!url.searchParams.get('variant');
    } catch (e) {
      hasUrlVariant = false;
    }

    // Auto-select first available variant on page load
    // Skip when URL variant is provided or user selection already exists
    // Delay slightly to ensure all variant picker images are connected
    setTimeout(() => {
      if (!hasCheckedInput && !hasUrlVariant) {
        this.selectFirstAvailableVariant();
      }
      // After selecting first variant, update availability again with actual selected values
      setTimeout(() => {
        const selectedValues = Array.from(this.selects).map((select) => {
          const checkedInput = select.querySelector('input[type="radio"]:checked');
          return checkedInput ? checkedInput.value : null;
        });
        this.updateAvailability(selectedValues);
      }, 50);
    }, 100);
  }

  /**
   * Automatically select the first available variant when page loads
   * This ensures users always see an in-stock variant by default
   */
  selectFirstAvailableVariant() {
    // Validate variants array
    if (!this.variants || !Array.isArray(this.variants) || this.variants.length === 0) {
      return;
    }

    // Find first available variant
    const firstAvailableVariant = this.variants.find(variant => variant && variant.available === true);

    if (!firstAvailableVariant) {
      // If no variants are available, check if there's a default selected variant
      const defaultVariant = this.variants.find(variant => variant && variant.selected === true);
      if (defaultVariant) {
        // Use default variant if available
        this.selectVariantByOptions(defaultVariant);
      }
      return;
    }

    // Select variant by its option values
    this.selectVariantByOptions(firstAvailableVariant);
  }

  /**
   * Select variant by matching its option values to radio buttons
   */
  selectVariantByOptions(variant) {
    if (!variant || !this.selects || this.selects.length === 0) return;

    // Get option values of the variant
    const optionValues = [];
    for (let i = 1; i <= this.optionsCount; i++) {
      const optionKey = `option${i}`;
      if (variant[optionKey]) {
        optionValues.push(String(variant[optionKey]));
      }
    }

    // Validate option values match selects count
    if (optionValues.length !== this.selects.length) {
      console.warn('ProductVariantPicker: Option values count does not match selects count');
      return;
    }

    // Select corresponding radio buttons
    let needsUpdate = false;
    this.selects.forEach((select, index) => {
      if (optionValues[index]) {
        // Escape special characters for CSS selector
        const escapedValue = CSS.escape(optionValues[index]);
        const input = select.querySelector(`input[type="radio"][value="${escapedValue}"]`);

        if (input) {
          if (!input.checked) {
            // Uncheck other inputs in the same group
            const groupName = input.name;
            select.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
              radio.checked = false;
            });

            // Check the new input
            input.checked = true;
            needsUpdate = true;
          }
        } else {
          console.warn(`ProductVariantPicker: Radio button not found for value "${optionValues[index]}"`);
        }
      }
    });

    // If new variant was selected, trigger handleChange to update entire UI
    if (needsUpdate) {
      // Small delay to ensure DOM is updated and variant picker images are built
      setTimeout(() => {
        this.handleChange();
      }, 50);
    }
  }

  /**
   * Get currently selected variant
   * @returns {Object|null} Selected variant object or null
   */
  getSelectedVariant() {
    if (!this.selects || this.selects.length === 0) return null;
    if (!this.variants || !Array.isArray(this.variants)) return null;

    const selectedValues = Array.from(this.selects).map((select) => {
      const checkedInput = select.querySelector('input[type="radio"]:checked');
      return checkedInput ? checkedInput.value : null;
    });

    // If any option is not selected, return null
    if (selectedValues.includes(null)) {
      return null;
    }

    // Find matching variant using option1, option2, option3
    const matched = this.variants.find(variant => {
      if (!variant) return false;
      return selectedValues.every((val, idx) => {
        const index = idx + 1;
        const optionKey = `option${index}`;
        // Use loose equality to handle type mismatches (string vs number)
        return val == variant[optionKey];
      });
    });

    return matched || null;
  }

  /**
   * Handle variant selection change
   * Updates availability states and dispatches variant_change event
   */
  handleChange() {
    if (!this.selects || this.selects.length === 0) return;
    if (!this.variants || !Array.isArray(this.variants)) return;

    const selectedValues = Array.from(this.selects).map((select) => {
      const checkedInput = select.querySelector('input[type="radio"]:checked');
      return checkedInput ? checkedInput.value : null;
    });

    // Update availability states
    this.updateAvailability(selectedValues);

    // If any option is not selected, don't dispatch event
    if (selectedValues.includes(null)) {
      return;
    }

    // Find matching variant
    const matched = this.variants.find(variant => {
      if (!variant) return false;
      return selectedValues.every((val, idx) => {
        const index = idx + 1;
        const optionKey = `option${index}`;
        // Use loose equality to handle type mismatches (string vs number)
        return val == variant[optionKey];
      });
    });

    // Dispatch event only if themeConfig is available
    if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.events) {
      this.dispatchEvent(new CustomEvent(themeConfig.product.events.variant_change, {
        detail: matched || null,
        bubbles: true,
      }));
    } else {
      console.warn('ProductVariantPicker: Cannot dispatch variant_change event - themeConfig.product.events not available');
    }
  }

  /**
   * Update availability states for all variant options
   * Marks options as sold_out if no available variants exist with that combination
   */
  updateAvailability(selectedValues) {
    if (!this.selects || this.selects.length === 0) return;
    if (!this.variants || !Array.isArray(this.variants)) return;
    if (!selectedValues || !Array.isArray(selectedValues)) return;

    // Count how many options are already selected
    const selectedCount = selectedValues.filter(val => val !== null).length;

    this.selects.forEach((select, optionIndex) => {
      const allInputs = select.querySelectorAll('input[type="radio"]');
      if (!allInputs || allInputs.length === 0) return;

      allInputs.forEach(input => {
        if (!input || !input.value) return;

        const value = input.value;
        const testCombo = [...selectedValues];
        testCombo[optionIndex] = value;

        // Check if any variant is available with this combination
        const hasAvailable = this.variants.some(variant => {
          if (!variant) return false;

          // If checking the first option (no other options selected yet)
          // Just check if this option value exists in any variant
          if (selectedCount === 0) {
            const optionKey = `option${optionIndex + 1}`;
            return variant[optionKey] == value;
          }

          // If variant is not available, skip it
          if (variant.available !== true) return false;

          // Check if variant matches the test combination
          return testCombo.every((val, idx) => {
            const index = idx + 1;
            const optionKey = `option${index}`;
            // If value is null, skip check (any value is valid)
            // Use loose equality to handle type mismatches
            return val == null || variant[optionKey] == val;
          });
        });

        const item = input.closest('.variant-picker__item');
        if (!item) return;

        if (!hasAvailable) {
          item.classList.add('variant-picker__item--sold-out');
        } else {
          item.classList.remove('variant-picker__item--sold-out');
        }
      });
    });
  }
}
if (!customElements.get('product-variant-picker')) {
  customElements.define('product-variant-picker', ProductVariantPicker);
}
