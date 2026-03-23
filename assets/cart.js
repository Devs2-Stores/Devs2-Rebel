/**
 * Cart Template — Main cart page component
 * Uses Cart API with Section Rendering for dynamic updates.
 */
class CartTemplate extends HTMLElement {
  connectedCallback() {
    this.cartData = this.querySelector(".cart-template__data");
    this.cartEmpty = this.querySelector(".cart-template__empty");
    this.cartTitle = this.querySelector(".cart-template__title");
    this.noteInput = this.querySelector("#cart-template__note-input");
    this.invoiceInputs = this.querySelectorAll("[name^='invoice']");
    this.pendingUpdate = null;
    this.updatingLine = null;
    this.sectionId = this.getSectionId();

    var cartEvents = (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.events)
      ? themeConfig.cart.events
      : { quantity_changed: 'cart-quantity-changed', item_delete: 'cart-item-deleted' };

    var self = this;

    this.addEventListener(cartEvents.quantity_changed, function(e) {
      self.debouncedUpdate(e.detail);
    });
    this.addEventListener(cartEvents.item_delete, function(e) {
      self.updateCart(e.detail);
    });

    if (this.noteInput) {
      this.noteInput.addEventListener("change", function() {
        self.updateNote();
      });
    }

    if (this.invoiceInputs.length) {
      this.invoiceInputs.forEach(function(input) {
        input.addEventListener("change", function() {
          self.updateInvoice();
        });
      });
    }
  }

  /**
   * Get the section ID for Section Rendering API
   */
  getSectionId() {
    var sectionEl = this.closest('.shopify-section');
    if (sectionEl) return sectionEl.id.replace('shopify-section-', '');
    return null;
  }

  /**
   * Get locale-aware cart route
   */
  getCartRoute(endpoint) {
    if (typeof themeConfig !== 'undefined' && themeConfig.routes) {
      switch (endpoint) {
        case 'change': return themeConfig.routes.cart_change_url;
        case 'update': return themeConfig.routes.cart_update_url;
        default: return themeConfig.routes.cart_url;
      }
    }
    // Fallback to Shopify.routes.root
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
    return root + 'cart/' + endpoint + '.js';
  }

  /**
   * Get i18n strings
   */
  getString(key) {
    if (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.cart) {
      return themeConfig.strings.cart[key] || '';
    }
    return '';
  }

  debouncedUpdate(detail) {
    this.updatingLine = detail.line;
    clearTimeout(this.pendingUpdate);
    var self = this;
    this.pendingUpdate = setTimeout(function() {
      self.updateCart(detail);
    }, 400);
  }

  updateCart(params) {
    var line = params.line;
    var quantity = params.quantity;
    if (!line || isNaN(quantity)) return;

    var body = {
      line: line,
      quantity: quantity
    };

    // Request Section Rendering for re-render
    if (this.sectionId) {
      body.sections = [this.sectionId];
    }

    var config = fetchConfig();
    config.body = JSON.stringify(body);
    var self = this;

    fetch(this.getCartRoute('change'), config)
      .then(function(res) {
        if (!res.ok) throw new Error("Cart update failed");
        return res.json();
      })
      .then(function(cart) {
        if (cart.sections && self.sectionId && cart.sections[self.sectionId]) {
          self.renderSection(cart.sections[self.sectionId]);
        } else {
          self.refreshUI(cart);
        }
        self.updatingLine = null;
        // Update global cart count/money
        updateCartCount(cart.item_count);
        updateCartMoney(cart.total_price);
      })
      .catch(function(err) {
        console.error("Cart error:", err);
        if (typeof showToast === 'function') {
          showToast(self.getString('error') || 'Cart update error', 'error');
        }
      });
  }

  updateNote() {
    var note = this.noteInput.value;
    var config = fetchConfig();
    config.body = JSON.stringify({ note: note });
    var self = this;

    fetch(this.getCartRoute('update'), config)
      .then(function(res) {
        if (!res.ok) throw new Error("Cart update failed");
        return res.json();
      })
      .catch(function(err) {
        console.error("Cart error:", err);
        if (typeof showToast === 'function') {
          showToast(self.getString('noteError') || 'Could not save note', 'error');
        }
      });
  }

  updateInvoice() {
    var attributes = {};
    this.invoiceInputs.forEach(function(input) {
      var name = input.name.replace("invoice[", "").replace("]", "");
      attributes["invoice_" + name] = input.value;
    });

    var config = fetchConfig();
    config.body = JSON.stringify({ attributes: attributes });
    var self = this;

    fetch(this.getCartRoute('update'), config)
      .then(function(res) {
        if (!res.ok) throw new Error("Cart update failed");
        return res.json();
      })
      .catch(function(err) {
        console.error("Cart error:", err);
        if (typeof showToast === 'function') {
          showToast(self.getString('invoiceError') || 'Could not save info', 'error');
        }
      });
  }

  /**
   * Render section HTML from Section Rendering API response
   */
  renderSection(sectionHtml) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(sectionHtml, 'text/html');
    var newContent = doc.querySelector('cart-template');

    if (newContent) {
      // Preserve note input value if user is typing
      var noteValue = this.noteInput ? this.noteInput.value : null;
      var invoiceValues = {};
      this.invoiceInputs.forEach(function(input) {
        invoiceValues[input.name] = input.value;
      });

      // Replace inner HTML
      this.innerHTML = newContent.innerHTML;

      // Re-query DOM references
      this.cartData = this.querySelector(".cart-template__data");
      this.cartEmpty = this.querySelector(".cart-template__empty");
      this.cartTitle = this.querySelector(".cart-template__title");
      this.noteInput = this.querySelector("#cart-template__note-input");
      this.invoiceInputs = this.querySelectorAll("[name^='invoice']");

      // Restore form values
      if (this.noteInput && noteValue !== null) {
        this.noteInput.value = noteValue;
      }
      var self = this;
      this.invoiceInputs.forEach(function(input) {
        if (invoiceValues[input.name] !== undefined) {
          input.value = invoiceValues[input.name];
        }
      });

      // Re-bind events
      if (this.noteInput) {
        this.noteInput.addEventListener("change", function() {
          self.updateNote();
        });
      }
      if (this.invoiceInputs.length) {
        this.invoiceInputs.forEach(function(input) {
          input.addEventListener("change", function() {
            self.updateInvoice();
          });
        });
      }
    }
  }

  /**
   * Fallback: manual DOM refresh when Section Rendering unavailable
   */
  refreshUI(cart) {
    var lineItems = this.querySelectorAll("[data-line-item]");
    lineItems.forEach(function(el, i) {
      el.dataset.lineItem = String(i + 1);
    });

    this.updateTitleCount(cart.item_count);

    var self = this;
    cart.items.forEach(function(item, index) {
      var lineNum = index + 1;
      var lineEl = self.querySelector("[data-line-item='" + lineNum + "']");
      if (!lineEl) return;

      var priceEl = lineEl.querySelector(".cart-item__price");
      if (priceEl) priceEl.textContent = formatMoney(item.line_price);

      var input = lineEl.querySelector("input[type='number']");
      if (input && lineNum !== self.updatingLine) {
        input.value = item.quantity;
      }
    });

    if (cart.item_count === 0) {
      this.cartData.style.display = "none";
      this.cartEmpty.style.display = "block";
    } else {
      this.cartData.style.display = "block";
      this.cartEmpty.style.display = "none";
    }
  }

  updateTitleCount(count) {
    var countSpan = this.cartTitle ? this.cartTitle.querySelector("span") : null;
    if (!countSpan) return;

    // Use i18n caption from Liquid-rendered template
    var caption = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.cart && themeConfig.strings.cart.caption)
      ? themeConfig.strings.cart.caption
      : 'items';
    countSpan.textContent = "(" + count + " " + caption + ")";
  }
}
customElements.define("cart-template", CartTemplate);

/**
 * Cart Item — Individual line item with delete functionality
 */
class CartItem extends HTMLElement {
  connectedCallback() {
    this.buttonsDelete = this.querySelectorAll("[data-action='delete-item']");
    if (this.buttonsDelete.length) {
      var self = this;
      this.buttonsDelete.forEach(function(btn) {
        btn.addEventListener("click", function(e) {
          self.handleDelete(e);
        });
      });
    }
  }

  handleDelete(event) {
    event.preventDefault();

    // Use i18n confirm message
    var confirmMsg = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.cart)
      ? themeConfig.strings.cart.removeConfirm
      : 'Are you sure you want to remove this item?';
    if (!confirm(confirmMsg)) return;

    var lineItem = this.closest("[data-line-item]");
    var line = lineItem ? parseInt(lineItem.dataset.lineItem) : null;
    if (!line) return;

    var deleteEventName = (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.events && themeConfig.cart.events.item_delete)
      ? themeConfig.cart.events.item_delete
      : 'cart-item-deleted';

    this.dispatchEvent(
      new CustomEvent(deleteEventName, {
        bubbles: true,
        detail: {
          line: line,
          quantity: 0
        },
      }),
    );

    this.remove();
  }
}
customElements.define("cart-item", CartItem);
