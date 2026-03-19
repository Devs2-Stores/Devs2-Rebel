class CartTemplate extends HTMLElement {
  connectedCallback() {
    this.cartData = this.querySelector(".cart-template__data");
    this.cartEmpty = this.querySelector(".cart-template__empty");
    this.cartTitle = this.querySelector(".cart-template__title");
    this.noteInput = this.querySelector("#cart-template__note-input");
    this.invoiceInputs = this.querySelectorAll("[name^='invoice']");
    this.pendingUpdate = null;
    this.updatingLine = null;

    var cartEvents = (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.events) ? themeConfig.cart.events : { quantity_changed: 'cart-quantity-changed', item_delete: 'cart-item-deleted' };
    this.addEventListener(
      cartEvents.quantity_changed,
      function(e) {
        this.debouncedUpdate(e.detail);
      }.bind(this),
    );
    this.addEventListener(
      cartEvents.item_delete,
      function(e) {
        this.updateCart(e.detail);
      }.bind(this),
    );

    if (this.noteInput) {
      this.noteInput.addEventListener(
        "change",
        function() {
          this.updateNote();
        }.bind(this),
      );
    }

    if (this.invoiceInputs.length) {
      var self = this;
      this.invoiceInputs.forEach(function(input) {
        input.addEventListener("change", function() {
          self.updateInvoice();
        });
      });
    }
  }
  debouncedUpdate(detail) {
    this.updatingLine = detail.line;
    clearTimeout(this.pendingUpdate);
    this.pendingUpdate = setTimeout(
      function() {
        this.updateCart(detail);
      }.bind(this),
      400,
    );
  }
  updateCart(params) {
    var line = params.line;
    var quantity = params.quantity;
    if (!line || isNaN(quantity)) return;

    var config = fetchConfig();
    config.body = JSON.stringify({
      line: line,
      quantity: quantity
    });
    var self = this;
    fetch("/cart/change.js", config)
      .then(function(res) {
        if (!res.ok) throw new Error("Cart update failed");
        return res.json();
      })
      .then(function(cart) {
        self.refreshUI(cart);
        self.updatingLine = null;
      })
      .catch(function(err) {
        console.error("Cart error:", err);
        window.showToast(
          "Không thể cập nhật giỏ hàng. Vui lòng thử lại.",
          "error",
        );
      });
  }
  updateNote() {
    var note = this.noteInput.value;
    var config = fetchConfig();
    config.body = JSON.stringify({ note: note });
    fetch("/cart/update.js", config)
      .then(function(res) {
        if (!res.ok) throw new Error("Cart update failed");
        return res.json();
      })
      .catch(function(err) {
        console.error("Cart error:", err);
        window.showToast("Không thể lưu ghi chú. Vui lòng thử lại.", "error");
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
    fetch("/cart/update.js", config)
      .then(function(res) {
        if (!res.ok) throw new Error("Cart update failed");
        return res.json();
      })
      .catch(function(err) {
        console.error("Cart error:", err);
        window.showToast("Không thể lưu thông tin. Vui lòng thử lại.", "error");
      });
  }
  refreshUI(cart) {
    // Re-index line items to match cart API response after deletion
    var lineItems = this.querySelectorAll("[data-line-item]");
    lineItems.forEach(function(el, i) {
      el.dataset.lineItem = String(i + 1);
    });

    updateCartCount(cart.item_count);
    updateCartMoney(cart.total_price);
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
    var countSpan = this.cartTitle ?
      this.cartTitle.querySelector("span") :
      null;
    if (countSpan) countSpan.textContent = "(" + count + " sản phẩm)";
  }
}
customElements.define("cart-template", CartTemplate);

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
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;

    var lineItem = this.closest("[data-line-item]");
    var line = lineItem ? parseInt(lineItem.dataset.lineItem) : null;
    if (!line) return;

    var deleteEventName = (typeof themeConfig !== 'undefined' && themeConfig.cart && themeConfig.cart.events && themeConfig.cart.events.item_delete) ? themeConfig.cart.events.item_delete : 'cart-item-deleted';
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
