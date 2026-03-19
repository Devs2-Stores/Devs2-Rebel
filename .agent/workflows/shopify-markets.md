---
description: Hỗ trợ đa ngôn ngữ, đa tiền tệ và Shopify Markets trong theme
---

# Đa Ngôn Ngữ, Đa Tiền Tệ & Shopify Markets

## Tổng quan

Shopify Markets giúp merchant bán hàng quốc tế với:
- **Nhiều ngôn ngữ** (locale)
- **Nhiều tiền tệ** (currency)
- **Nhiều quốc gia** (market)
- URL tự động theo locale: `/fr/`, `/en-ca/`

## 1. Object `localization`

```liquid
{%- comment -%} Ngôn ngữ khả dụng {%- endcomment -%}
localization.available_languages     {%- comment -%} Mảng ngôn ngữ {%- endcomment -%}
localization.language                {%- comment -%} Ngôn ngữ hiện tại {%- endcomment -%}
localization.language.iso_code       {%- comment -%} Mã ISO: "vi", "en", "fr" {%- endcomment -%}
localization.language.endonym_name   {%- comment -%} Tên bản ngữ: "Tiếng Việt" {%- endcomment -%}

{%- comment -%} Quốc gia khả dụng {%- endcomment -%}
localization.available_countries     {%- comment -%} Mảng quốc gia {%- endcomment -%}
localization.country                 {%- comment -%} Quốc gia hiện tại {%- endcomment -%}
localization.country.iso_code        {%- comment -%} Mã ISO: "VN", "US" {%- endcomment -%}
localization.country.name            {%- comment -%} Tên quốc gia {%- endcomment -%}
localization.country.currency        {%- comment -%} Tiền tệ {%- endcomment -%}
localization.country.currency.iso_code   {%- comment -%} "VND", "USD" {%- endcomment -%}
localization.country.currency.symbol     {%- comment -%} "₫", "$" {%- endcomment -%}

{%- comment -%} Market hiện tại {%- endcomment -%}
localization.market                  {%- comment -%} Market object {%- endcomment -%}
localization.market.handle           {%- comment -%} Handle: "primary", "europe" {%- endcomment -%}
localization.market.id               {%- comment -%} ID {%- endcomment -%}
```

## 2. Country Selector (Chọn quốc gia/tiền tệ)

```liquid
{%- if localization.available_countries.size > 1 -%}
  {%- form 'localization' -%}
    <div class="country-selector">
      <h3 class="country-selector__label" id="country-label-{{ section.id }}">
        {{ 'localization.country_label' | t }}
      </h3>

      <button
        type="button"
        class="country-selector__button"
        aria-expanded="false"
        aria-controls="country-list-{{ section.id }}"
        aria-labelledby="country-label-{{ section.id }}"
      >
        {{ localization.country.name }} ({{ localization.country.currency.iso_code }}
        {{ localization.country.currency.symbol }})
      </button>

      <ul
        id="country-list-{{ section.id }}"
        class="country-selector__list"
        role="listbox"
        hidden
      >
        {%- for country in localization.available_countries -%}
          <li role="option" {% if country.iso_code == localization.country.iso_code %}aria-selected="true"{% endif %}>
            <button
              type="button"
              class="country-selector__option"
              data-value="{{ country.iso_code }}"
            >
              {{ country.name }} ({{ country.currency.iso_code }} {{ country.currency.symbol }})
            </button>
          </li>
        {%- endfor -%}
      </ul>

      <input type="hidden" name="country_code" value="{{ localization.country.iso_code }}">
    </div>
  {%- endform -%}
{%- endif -%}
```

## 3. Language Selector (Chọn ngôn ngữ)

```liquid
{%- if localization.available_languages.size > 1 -%}
  {%- form 'localization' -%}
    <div class="language-selector">
      <h3 class="language-selector__label" id="language-label-{{ section.id }}">
        {{ 'localization.language_label' | t }}
      </h3>

      <button
        type="button"
        class="language-selector__button"
        aria-expanded="false"
        aria-controls="language-list-{{ section.id }}"
        aria-labelledby="language-label-{{ section.id }}"
      >
        {{ localization.language.endonym_name }}
      </button>

      <ul
        id="language-list-{{ section.id }}"
        class="language-selector__list"
        role="listbox"
        hidden
      >
        {%- for language in localization.available_languages -%}
          <li role="option" {% if language.iso_code == localization.language.iso_code %}aria-selected="true"{% endif %}>
            <button
              type="button"
              class="language-selector__option"
              data-value="{{ language.iso_code }}"
            >
              {{ language.endonym_name }}
            </button>
          </li>
        {%- endfor -%}
      </ul>

      <input type="hidden" name="language_code" value="{{ localization.language.iso_code }}">
    </div>
  {%- endform -%}
{%- endif -%}
```

## 4. JavaScript Submit Form

```javascript
/**
 * Web Component xử lý localization selector
 */
if (!customElements.get('localization-selector')) {
  class LocalizationSelector extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('[aria-expanded]');
      this.list = this.querySelector('[role="listbox"]');
      this.input = this.querySelector('input[type="hidden"]');
      this.form = this.querySelector('form');
    }

    connectedCallback() {
      this.button?.addEventListener('click', () => this.toggle());

      this.list?.querySelectorAll('[data-value]').forEach(option => {
        option.addEventListener('click', () => {
          this.select(option.dataset.value);
        });
      });

      // Đóng khi click ngoài
      document.addEventListener('click', (e) => {
        if (!this.contains(e.target)) this.close();
      });

      // Đóng khi Escape
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }

    toggle() {
      const isOpen = this.button.getAttribute('aria-expanded') === 'true';
      isOpen ? this.close() : this.open();
    }

    open() {
      this.button.setAttribute('aria-expanded', 'true');
      this.list.removeAttribute('hidden');
      // Focus first option
      this.list.querySelector('[data-value]')?.focus();
    }

    close() {
      this.button.setAttribute('aria-expanded', 'false');
      this.list.setAttribute('hidden', '');
    }

    select(value) {
      this.input.value = value;
      this.form.submit();
    }
  }

  customElements.define('localization-selector', LocalizationSelector);
}
```

## 5. Locale-Aware URLs ⚠️ Quan trọng

### Trong Liquid

```liquid
{%- comment -%} ✅ Đúng — dùng routes object {%- endcomment -%}
{{ routes.cart_url }}               → /vi/cart (nếu locale là vi)
{{ routes.account_url }}            → /vi/account
{{ routes.search_url }}             → /vi/search
{{ routes.root_url }}               → /vi/

<a href="{{ product.url }}">        → /vi/products/ao-thun

{%- comment -%} ❌ Sai — hardcode URL {%- endcomment -%}
<a href="/cart">                    → Sẽ đưa về locale mặc định!
<a href="/products/ao-thun">
```

### Trong JavaScript

```javascript
// ✅ Đúng — dùng window.Shopify.routes.root
const rootUrl = window.Shopify.routes.root; // "/vi/" hoặc "/en-ca/"
fetch(`${rootUrl}cart/add.js`, { ... });

// ❌ Sai — hardcode
fetch('/cart/add.js', { ... }); // Lỗi nếu khách ở locale khác!
```

### Khi dùng Section Rendering API

```javascript
// ✅ Đúng — locale-aware
const rootUrl = window.Shopify.routes.root;
fetch(`${rootUrl}?sections=header`);

// Hoặc context trang hiện tại
fetch(`${window.location.pathname}?sections=main-product`);
```

## 6. SEO — Hreflang

Shopify tự động thêm hreflang tags qua `content_for_header`. **Không cần thêm thủ công.**

```liquid
{%- comment -%} Shopify tự tạo trong <head> {%- endcomment -%}
{%- comment -%}
  <link rel="alternate" hreflang="vi" href="https://store.com/vi/" />
  <link rel="alternate" hreflang="en" href="https://store.com/" />
  <link rel="alternate" hreflang="fr" href="https://store.com/fr/" />
{%- endcomment -%}
```

### Structured Data cho đa tiền tệ

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": {{ product.title | json }},
  "offers": {
    "@type": "Offer",
    "price": {{ product.price | money_without_currency | json }},
    "priceCurrency": {{ localization.country.currency.iso_code | json }},
    "availability": "https://schema.org/{% if product.available %}InStock{% else %}OutOfStock{% endif %}"
  }
}
</script>
```

## 7. Giá theo tiền tệ

```liquid
{%- comment -%} Shopify tự chuyển đổi giá theo market {%- endcomment -%}
{{ product.price | money }}                    → ₫250.000 hoặc $10.00

{%- comment -%} Hiển thị với mã tiền tệ {%- endcomment -%}
{{ product.price | money_with_currency }}      → ₫250.000 VND

{%- comment -%} Kiểm tra tiền tệ hiện tại {%- endcomment -%}
{{ cart.currency.iso_code }}                    → VND, USD, EUR...
```

## 8. Locale Files

```
locales/
├── vi.default.json      # Ngôn ngữ mặc định
├── en.json              # Bản dịch tiếng Anh
├── fr.json              # Bản dịch tiếng Pháp
├── vi.default.schema.json  # Dịch label trong schema (vi)
├── en.schema.json          # Dịch label trong schema (en)
└── fr.schema.json          # Dịch label trong schema (fr)
```

### Cấu trúc file locale

```json
{
  "general": {
    "search": "Tìm kiếm",
    "close": "Đóng",
    "menu": "Menu"
  },
  "localization": {
    "country_label": "Quốc gia/Vùng",
    "language_label": "Ngôn ngữ"
  },
  "products": {
    "product": {
      "add_to_cart": "Thêm vào giỏ",
      "sold_out": "Hết hàng",
      "price": "Giá",
      "regular_price": "Giá gốc",
      "sale_price": "Giá bán"
    }
  },
  "search": {
    "placeholder": "Tìm kiếm...",
    "submit": "Tìm",
    "suggestions": "Gợi ý",
    "products": "Sản phẩm",
    "collections": "Bộ sưu tập",
    "articles": "Bài viết",
    "pages": "Trang",
    "no_results": "Không tìm thấy kết quả cho \"{{ terms }}\""
  }
}
```

### Schema locale file

```json
{
  "sections": {
    "hero_banner": {
      "name": "Banner chính",
      "settings": {
        "heading": { "label": "Tiêu đề" },
        "image": { "label": "Hình ảnh" }
      }
    }
  }
}
```

### Dùng translation key trong Schema

```liquid
{% schema %}
{
  "name": "t:sections.hero_banner.name",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "t:sections.hero_banner.settings.heading.label"
    }
  ]
}
{% endschema %}
```

## Danh sách kiểm tra

- [ ] Không hardcode URL — dùng `routes.*` trong Liquid, `window.Shopify.routes.root` trong JS
- [ ] Dùng `| t` filter cho mọi text hiển thị
- [ ] Dùng `| money` cho giá — Shopify tự chuyển đổi tiền tệ
- [ ] Country selector chỉ hiện khi `localization.available_countries.size > 1`
- [ ] Language selector chỉ hiện khi `localization.available_languages.size > 1`
- [ ] Form localization submit qua JS
- [ ] Schema labels dùng `"t:..."` translation key
- [ ] Structured data dùng `localization.country.currency.iso_code`
- [ ] ARIA cho selectors: `role="listbox"`, `aria-expanded`, `aria-selected`
