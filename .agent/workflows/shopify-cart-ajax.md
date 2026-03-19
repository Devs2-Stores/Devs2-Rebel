---
description: Xử lý giỏ hàng AJAX với Cart API, Section Rendering và error handling
---

# Giỏ Hàng AJAX — Cart API & Section Rendering

## Tổng quan Cart API

Cart API cho phép thêm, cập nhật, thay đổi và xoá sản phẩm trong giỏ hàng mà **không reload trang**.

> **Quan trọng:** Luôn dùng URL locale-aware. Không hardcode `/cart/add.js` — dùng `window.Shopify.routes.root` thay thế.

## 1. Các endpoint chính

| Endpoint | Phương thức | Mô tả |
|---|---|---|
| `/{locale}/cart/add.js` | POST | Thêm 1 hoặc nhiều variant vào giỏ |
| `/{locale}/cart.js` | GET | Lấy dữ liệu giỏ hàng |
| `/{locale}/cart/update.js` | POST | Cập nhật số lượng, note, attributes |
| `/{locale}/cart/change.js` | POST | Thay đổi 1 line item (quantity, properties, selling_plan) |
| `/{locale}/cart/clear.js` | POST | Xoá toàn bộ giỏ hàng |

## 2. Thêm sản phẩm vào giỏ

```javascript
/**
 * Thêm variant vào giỏ hàng
 * @param {number} variantId - ID biến thể
 * @param {number} quantity - Số lượng
 * @param {Object} [properties] - Thuộc tính tuỳ chỉnh
 * @param {Array} [sections] - Section cần render lại
 * @returns {Promise<Object>} Response JSON
 */
async function addToCart(variantId, quantity = 1, properties = {}, sections = []) {
  const body = {
    items: [{
      id: variantId,
      quantity: quantity,
    }],
  };

  // Thêm properties nếu có
  if (Object.keys(properties).length > 0) {
    body.items[0].properties = properties;
  }

  // Bundled Section Rendering — lấy HTML section mới
  if (sections.length > 0) {
    body.sections = sections;
  }

  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new CartError(error.description, error.status);
  }

  return response.json();
}
```

### Thêm nhiều variant cùng lúc

```javascript
async function addMultipleToCart(items) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map(item => ({
        id: item.variantId,
        quantity: item.quantity || 1,
        properties: item.properties || {},
      })),
    }),
  });

  return response.json();
}
```

### Thêm với selling plan (đăng ký mua định kỳ)

```javascript
async function addWithSellingPlan(variantId, sellingPlanId, quantity = 1) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        id: variantId,
        quantity: quantity,
        selling_plan: sellingPlanId,
      }],
    }),
  });

  return response.json();
}
```

## 3. Lấy dữ liệu giỏ hàng

```javascript
async function getCart() {
  const response = await fetch(`${window.Shopify.routes.root}cart.js`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.json();
}
```

## 4. Cập nhật giỏ hàng

```javascript
/**
 * Cập nhật số lượng nhiều line items
 * @param {Object} updates - { variantId: quantity, ... }
 */
async function updateCart(updates, sections = []) {
  const body = { updates };

  if (sections.length > 0) {
    body.sections = sections;
  }

  const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Cập nhật ghi chú đơn hàng
 */
async function updateCartNote(note) {
  const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });

  return response.json();
}

/**
 * Cập nhật cart attributes
 */
async function updateCartAttributes(attributes) {
  const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributes }),
  });

  return response.json();
}
```

## 5. Thay đổi 1 line item

```javascript
/**
 * Thay đổi số lượng của 1 line item
 * Dùng `line` (1-indexed) hoặc `id` (variant_id:key)
 */
async function changeCartItem(line, quantity, sections = []) {
  const body = { line, quantity };

  if (sections.length > 0) {
    body.sections = sections;
  }

  const response = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Xoá 1 line item (đặt quantity = 0)
 */
async function removeCartItem(line, sections = []) {
  return changeCartItem(line, 0, sections);
}
```

## 6. Xoá toàn bộ giỏ hàng

```javascript
async function clearCart() {
  const response = await fetch(`${window.Shopify.routes.root}cart/clear.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return response.json();
}
```

## 7. Error Handling

```javascript
class CartError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CartError';
    this.status = status;
  }
}

/**
 * Wrapper xử lý lỗi Cart API
 */
async function cartFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    const data = await response.json();

    if (!response.ok) {
      // Lỗi thường gặp:
      // 422: Hết hàng, vượt quá số lượng tồn kho
      // 404: Variant không tồn tại
      throw new CartError(data.description || data.message, response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof CartError) throw error;
    throw new CartError('Không thể kết nối. Vui lòng thử lại.', 500);
  }
}
```

### Các lỗi thường gặp

| Status | Mô tả | Cách xử lý |
|---|---|---|
| 422 | Variant hết hàng hoàn toàn | Hiển thị "Sản phẩm đã hết hàng" |
| 422 | Vượt quá tồn kho (yêu cầu 20, chỉ còn 10) | Cart tự thêm số lượng tối đa, hiển thị thông báo |
| 404 | Variant không tồn tại | Kiểm tra lại variant ID |
| 429 | Too many requests | Retry sau `Retry-After` header |

## 8. Bundled Section Rendering 🔑

> **Đây là tính năng quan trọng nhất!** Cho phép lấy HTML của **tối đa 5 sections** cùng lúc với request Cart API.

### Cách hoạt động

Thêm tham số `sections` vào body của request. Response sẽ chứa thêm key `sections` với HTML đã render.

```javascript
/**
 * Thêm vào giỏ + lấy HTML mới cho cart drawer và cart icon
 */
async function addToCartWithSections(variantId, quantity = 1) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: variantId, quantity }],
      sections: ['cart-drawer', 'cart-icon-bubble'],
    }),
  });

  const data = await response.json();

  // Cập nhật DOM với HTML mới
  if (data.sections) {
    // Cart drawer
    const drawerEl = document.querySelector('#cart-drawer');
    if (drawerEl && data.sections['cart-drawer']) {
      drawerEl.innerHTML = getSectionInnerHTML(data.sections['cart-drawer']);
    }

    // Cart icon count
    const iconEl = document.querySelector('#cart-icon-bubble');
    if (iconEl && data.sections['cart-icon-bubble']) {
      iconEl.innerHTML = getSectionInnerHTML(data.sections['cart-icon-bubble']);
    }
  }

  return data;
}

/**
 * Trích xuất nội dung bên trong section wrapper
 */
function getSectionInnerHTML(sectionHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sectionHtml, 'text/html');
  return doc.querySelector('.shopify-section')?.innerHTML || sectionHtml;
}
```

### Endpoints hỗ trợ Bundled Section Rendering

- `/{locale}/cart/add.js`
- `/{locale}/cart/change.js`
- `/{locale}/cart/clear.js`
- `/{locale}/cart/update.js`

## 9. Section Rendering API (Standalone)

> Dùng khi cần render lại section **ngoài** Cart API — ví dụ: thay đổi variant, lọc collection.

### Render nhiều sections

```javascript
/**
 * Lấy HTML của sections qua Section Rendering API
 * Tối đa 5 sections mỗi request
 * @param {string} pageUrl - URL trang context (ví dụ: /products/ao-thun)
 * @param {string[]} sectionIds - Mảng section IDs
 */
async function renderSections(pageUrl, sectionIds) {
  const url = new URL(pageUrl, window.location.origin);
  url.searchParams.set('sections', sectionIds.join(','));

  const response = await fetch(url.toString());
  return response.json();
}
```

### Render 1 section duy nhất

```javascript
/**
 * Lấy HTML của 1 section — trả về HTML thuần (không phải JSON)
 */
async function renderSection(pageUrl, sectionId) {
  const url = new URL(pageUrl, window.location.origin);
  url.searchParams.set('section_id', sectionId);

  const response = await fetch(url.toString());
  return response.text();
}
```

### Tìm Section ID

Section ID có thể lấy từ:

1. **Liquid:** `{{ section.id }}`
2. **DOM:** Trích từ wrapper `id="shopify-section-{SECTION_ID}"`
3. **Static sections:** Tên file (ví dụ: `social.liquid` → ID = `social`)
4. **Dynamic sections (JSON template):** Dạng `template--{hash}__{key}` (ví dụ: `template--5678__image_banner`)
5. **Section groups:** Dạng `sections--{hash}__{key}` (ví dụ: `sections--1234__header`)

```javascript
/**
 * Trích xuất section ID từ DOM element
 */
function getSectionId(element) {
  const sectionEl = element.closest('.shopify-section');
  if (!sectionEl) return null;
  return sectionEl.id.replace('shopify-section-', '');
}
```

### Locale-Aware URLs ⚠️

```javascript
// ✅ Đúng — dùng locale-aware URL
const rootUrl = window.Shopify.routes.root; // Ví dụ: "/fr/" hoặc "/en-ca/"
fetch(`${rootUrl}cart/add.js`, { ... });

// ❌ Sai — hardcode URL
fetch('/cart/add.js', { ... }); // Sẽ lỗi nếu khách ở locale khác
```

## 10. Ví dụ thực tế: Cart Drawer Web Component

```javascript
if (!customElements.get('cart-drawer')) {
  class CartDrawer extends HTMLElement {
    constructor() {
      super();
      this.drawer = this.querySelector('.cart-drawer__inner');
      this.overlay = this.querySelector('.cart-drawer__overlay');
    }

    connectedCallback() {
      this.overlay?.addEventListener('click', () => this.close());
      this.addEventListener('click', (e) => {
        if (e.target.matches('.cart-drawer__close')) this.close();
      });

      // Lắng nghe sự kiện thêm giỏ hàng từ product form
      document.addEventListener('cart:add', (e) => this.onCartAdd(e));
      // Lắng nghe thay đổi số lượng
      this.addEventListener('change', (e) => {
        if (e.target.matches('.cart-item__quantity')) {
          this.onQuantityChange(e);
        }
      });
    }

    async onCartAdd(event) {
      const { variantId, quantity } = event.detail;
      try {
        await addToCartWithSections(variantId, quantity);
        this.open();
      } catch (error) {
        this.showError(error.message);
      }
    }

    async onQuantityChange(event) {
      const input = event.target;
      const line = parseInt(input.dataset.line);
      const quantity = parseInt(input.value);

      try {
        const data = await changeCartItem(line, quantity, ['cart-drawer', 'cart-icon-bubble']);
        if (data.sections) {
          this.updateSections(data.sections);
        }
      } catch (error) {
        this.showError(error.message);
      }
    }

    updateSections(sections) {
      for (const [id, html] of Object.entries(sections)) {
        const el = document.getElementById(id) || document.querySelector(`[data-section-id="${id}"]`);
        if (el) el.innerHTML = getSectionInnerHTML(html);
      }
    }

    open() {
      this.setAttribute('open', '');
      document.body.classList.add('overflow-hidden');
      this.querySelector('.cart-drawer__close')?.focus();
    }

    close() {
      this.removeAttribute('open');
      document.body.classList.remove('overflow-hidden');
    }

    showError(message) {
      const errorEl = this.querySelector('.cart-drawer__error');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.removeAttribute('hidden');
        setTimeout(() => errorEl.setAttribute('hidden', ''), 5000);
      }
    }

    disconnectedCallback() {
      document.removeEventListener('cart:add', this.onCartAdd);
    }
  }

  customElements.define('cart-drawer', CartDrawer);
}
```

## 11. Pattern cập nhật Cart Count

```javascript
/**
 * Cập nhật số lượng giỏ hàng ở header
 */
function updateCartCount(count) {
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = count;
    el.toggleAttribute('hidden', count === 0);
  });
}

// Dùng sau mỗi thao tác cart
const cartData = await getCart();
updateCartCount(cartData.item_count);
```

## 12. Private Properties & Attributes

```javascript
// Properties bắt đầu bằng "_" sẽ ẩn khỏi khách hàng
// Dùng cho dữ liệu nội bộ
const properties = {
  '_gift_wrap': true,        // Ẩn — không hiển thị cho khách
  'Engraving': 'Tên người',  // Hiện — khách hàng thấy được
};

// Cart attributes bắt đầu bằng "_" cũng ẩn khỏi khách
await updateCartAttributes({
  '_source': 'quick_buy',
  'Gift Note': 'Chúc mừng sinh nhật!',
});
```

## Danh sách kiểm tra

- [ ] Dùng `window.Shopify.routes.root` cho mọi URL (locale-aware)
- [ ] Xử lý lỗi 422 (hết hàng, vượt tồn kho)
- [ ] Xử lý lỗi 429 (rate limit — retry)
- [ ] Dùng Bundled Section Rendering để cập nhật UI
- [ ] Cập nhật cart count sau mỗi thao tác
- [ ] Dùng `DOMParser` để trích xuất section HTML
- [ ] Disable nút submit trong khi đang xử lý
- [ ] Announce thay đổi cho screen reader (`role="status"` hoặc `aria-live`)
