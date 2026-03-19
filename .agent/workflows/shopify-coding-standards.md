---
description: Quy chuẩn code Shopify Liquid, quy ước đặt tên và thực hành tốt nhất
---

# Quy Chuẩn Code Shopify Liquid

## 1. Quy tắc đặt tên file

### Section

```
sections/hero-banner.liquid
sections/featured-collection.liquid
sections/main-product.liquid          # Tiền tố "main-" cho section chính của template
sections/main-collection.liquid
```

### Snippet

```
snippets/card-product.liquid          # Component dạng thẻ
snippets/icon-cart.liquid             # Icon SVG
snippets/price.liquid                 # Hiển thị giá
snippets/badge-sale.liquid            # Nhãn trạng thái
snippets/meta-tags.liquid             # Thẻ meta SEO
```

### Asset

```
assets/section-hero-banner.css        # CSS riêng cho section
assets/section-hero-banner.js         # JS riêng cho section
assets/component-card-product.css     # CSS cho component
assets/base.css                       # Style toàn cục
assets/theme.js                       # JS toàn cục
```

## 2. Chuẩn cú pháp Liquid

### Luôn dùng Whitespace Control

```liquid
{%- comment -%} ✅ Đúng — loại bỏ khoảng trắng thừa {%- endcomment -%}
{%- assign bien = 'gia_tri' -%}
{%- if dieu_kien -%}
  Nội dung
{%- endif -%}

{%- comment -%} ❌ Sai — tạo khoảng trắng thừa {%- endcomment -%}
{% assign bien = 'gia_tri' %}
{% if dieu_kien %}
  Nội dung
{% endif %}
```

### Dùng tag `liquid` cho logic nhiều dòng

```liquid
{%- liquid
  assign ten_sp = product.title
  assign dang_giam_gia = false

  if product.compare_at_price > product.price
    assign dang_giam_gia = true
  endif

  assign phan_tram_giam = product.compare_at_price | minus: product.price
  assign phan_tram_giam = phan_tram_giam | times: 100 | divided_by: product.compare_at_price | round
-%}
```

### Render thay vì Include

```liquid
{%- comment -%} ✅ Luôn dùng render {%- endcomment -%}
{%- render 'card-product', product: product, lazy_load: true -%}

{%- comment -%} ❌ Không bao giờ dùng include {%- endcomment -%}
{%- include 'card-product' -%}
```

## 3. Kiến trúc CSS

### CSS quan trọng trong block `{%- style -%}`

```liquid
{%- style -%}
  .section-{{ section.id }} {
    --section-padding-top: {{ section.settings.padding_top }}px;
    --section-padding-bottom: {{ section.settings.padding_bottom }}px;
    padding: var(--section-padding-top) 0 var(--section-padding-bottom);
  }
{%- endstyle -%}
```

### Tải CSS không quan trọng dạng trì hoãn

```liquid
{%- comment -%} Cho CSS section không quan trọng {%- endcomment -%}
{{ 'section-hero-banner.css' | asset_url | stylesheet_tag }}
```

### CSS Custom Properties (Design Tokens)

Định nghĩa trong `base.css` hoặc `theme.liquid`:

```css
:root {
  /* Màu sắc */
  --color-primary: {{ settings.color_primary }};
  --color-secondary: {{ settings.color_secondary }};
  --color-text: {{ settings.color_text }};
  --color-background: {{ settings.color_background }};
  --color-border: {{ settings.color_border }};
  --color-price: {{ settings.color_price }};
  --color-sale: {{ settings.color_sale }};

  /* Font chữ */
  --font-heading: {{ settings.type_heading_font.family }}, {{ settings.type_heading_font.fallback_families }};
  --font-body: {{ settings.type_body_font.family }}, {{ settings.type_body_font.fallback_families }};
  --font-heading-weight: {{ settings.type_heading_font.weight }};
  --font-body-weight: {{ settings.type_body_font.weight }};

  /* Khoảng cách */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 40px;
  --spacing-2xl: 64px;

  /* Bố cục */
  --page-width: 1200px;
  --grid-gap: 16px;

  /* Bo góc */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
  --border-radius-full: 9999px;

  /* Hiệu ứng chuyển tiếp */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}
```

## 4. Mẫu JavaScript

### Tải module dạng trì hoãn

```liquid
<script src="{{ 'section-hero-banner.js' | asset_url }}" defer></script>
```

### Mẫu Web Component (Khuyến nghị)

```javascript
class ProductCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    // Thiết lập event listener, tham chiếu DOM
  }

  disconnectedCallback() {
    // Dọn dẹp khi component bị gỡ
  }
}
customElements.define('product-card', ProductCard);
```

### JS Section với sự kiện Shopify

```javascript
document.addEventListener('shopify:section:load', (event) => {
  // Khởi tạo lại khi section được load trong Theme Editor
  const section = event.target;
  initializeSection(section);
});

document.addEventListener('shopify:section:unload', (event) => {
  // Dọn dẹp khi section bị gỡ trong Theme Editor
});
```

## 5. Thực hành tốt cho hình ảnh

### Ảnh responsive với filter `image_url`

```liquid
{%- if product.featured_image -%}
  <img
    srcset="
      {{ product.featured_image | image_url: width: 300 }} 300w,
      {{ product.featured_image | image_url: width: 600 }} 600w,
      {{ product.featured_image | image_url: width: 900 }} 900w,
      {{ product.featured_image | image_url: width: 1200 }} 1200w
    "
    src="{{ product.featured_image | image_url: width: 600 }}"
    sizes="(min-width: 1200px) 300px, (min-width: 768px) 50vw, 100vw"
    alt="{{ product.featured_image.alt | escape }}"
    width="{{ product.featured_image.width }}"
    height="{{ product.featured_image.height }}"
    loading="lazy"
  >
{%- endif -%}
```

### Hỗ trợ điểm lấy nét (Focal Point)

```liquid
<img
  src="{{ image | image_url: width: 800 }}"
  style="object-position: {{ image.presentation.focal_point }};"
>
```

## 6. SEO và Khả năng tiếp cận (Accessibility)

### Luôn escape dữ liệu đầu ra

```liquid
{{ product.title | escape }}
{{ product.description | strip_html | truncate: 160 }}
```

### HTML có ngữ nghĩa (Semantic HTML)

```liquid
<section aria-label="{{ section.settings.heading | escape }}">
  <h2>{{ section.settings.heading }}</h2>
</section>
```

### Bỏ qua navigation (Skip to content)

```liquid
<a class="skip-to-content" href="#MainContent">
  {{ 'accessibility.skip_to_content' | t }}
</a>
```

## 7. Đa ngôn ngữ (Locales)

### Luôn dùng key dịch

```liquid
{%- comment -%} ✅ Đúng {%- endcomment -%}
{{ 'products.product.add_to_cart' | t }}

{%- comment -%} ❌ Sai — text cứng trong code {%- endcomment -%}
Thêm vào giỏ hàng
```

### Cấu trúc file locale (`locales/vi.default.json`)

```json
{
  "general": {
    "search": "Tìm kiếm",
    "close": "Đóng"
  },
  "products": {
    "product": {
      "add_to_cart": "Thêm vào giỏ",
      "sold_out": "Hết hàng",
      "quantity": "Số lượng"
    }
  },
  "sections": {
    "hero_banner": {
      "heading": "Chào mừng"
    }
  }
}
```

## 8. Danh sách kiểm tra hiệu suất

- [ ] Dùng `loading="lazy"` cho ảnh nằm dưới màn hình đầu
- [ ] Dùng `fetchpriority="high"` cho ảnh LCP
- [ ] Trì hoãn JS không quan trọng bằng thuộc tính `defer`
- [ ] Giữ file CSS dưới 100KB
- [ ] Giữ file JS dưới 100KB
- [ ] Dùng filter `image_url` (không dùng `img_url` — đã bị loại bỏ)
- [ ] Tránh truy vấn N+1 trong vòng lặp Liquid
- [ ] Dùng `{%- style -%}` cho CSS quan trọng riêng của section
- [ ] Preconnect đến CDN Shopify: `<link rel="preconnect" href="https://cdn.shopify.com">`
- [ ] Giảm thiểu kích thước DOM (mục tiêu < 1500 node)
