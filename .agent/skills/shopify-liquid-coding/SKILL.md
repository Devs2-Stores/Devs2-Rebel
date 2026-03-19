---
name: shopify-liquid-coding
description: Quy chuẩn code Shopify Liquid, cú pháp, pattern và anti-pattern cho AI
---

<objective>
Cung cấp quy chuẩn và best practices cho AI khi viết code Shopify Liquid.
AI PHẢI tuân thủ các quy tắc này trong MỌI file Liquid được tạo hoặc sửa.

Nguồn tham khảo: Shopify Horizon cursor rules (chính thức).
</objective>

<context>
## QUY TẮC BẮT BUỘC (Không được vi phạm)

### 1. Liquid Syntax
- ✅ `{%- -%}` và `{{- -}}` — LUÔN dùng whitespace control
- ✅ `{% render 'snippet' %}` — dùng render
- ❌ `{% include 'snippet' %}` — KHÔNG BAO GIỜ dùng include (deprecated)
- ✅ `| image_url: width: 600` — dùng image_url
- ❌ `| img_url: '600x'` — KHÔNG dùng img_url (deprecated)
- ✅ `| image_tag` — dùng filter image_tag khi có thể
- ✅ `{% liquid %}` — dùng cho logic nhiều dòng (thay nhiều tag `{% %}` riêng lẻ)
- ✅ `product.selected_or_first_available_variant` — biến thể mặc định

### 2. Đặt tên file
- Sections: `sections/ten-section.liquid` (kebab-case)
- Snippets: `snippets/ten-snippet.liquid` (kebab-case)
- Templates: `templates/loai.ten-khac.json` (ví dụ: `product.doctor.json`)
- Assets: `assets/ten-file.css` hoặc `assets/ten-file.js`

### 3. BEM Naming Convention (CSS)

```css
/* Block — component chính */
.product-card { }

/* Element — thành phần con */
.product-card__image { }
.product-card__title { }
.product-card__price { }

/* Modifier — biến thể */
.product-card--featured { }
.product-card__title--large { }
```

Quy tắc:
- Dùng dấu gạch ngang `-` phân tách từ
- **Block**: tên component (`.product-card`)
- **Element**: block + `__` + element (`.product-card__title`)
- **Modifier**: block/element + `--` + modifier (`.product-card--featured`)
- ❌ KHÔNG dùng ID làm selector
- ❌ KHÔNG dùng `!important` (trừ trường hợp bất khả kháng, phải comment lý do)

### 4. Design Tokens (CSS Variables)

```css
:root {
  /* Spacing scale */
  --space-3xs: 0.25rem;  /* 4px */
  --space-2xs: 0.5rem;   /* 8px */
  --space-xs: 0.75rem;   /* 12px */
  --space-sm: 1rem;      /* 16px */
  --space-md: 1.5rem;    /* 24px */
  --space-lg: 2rem;      /* 32px */
  --space-xl: 3rem;      /* 48px */
  --space-2xl: 4rem;     /* 64px */

  /* Typography scale */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */

  /* Semantic colors */
  --color-text-primary: rgb(var(--color-foreground));
  --color-text-secondary: rgb(var(--color-foreground) / 0.75);
  --color-text-disabled: rgb(var(--color-foreground) / 0.38);

  /* Interactive states */
  --color-interactive-default: rgb(var(--color-accent));
  --color-interactive-hover: color-mix(in srgb, rgb(var(--color-accent)) 90%, black);
  --color-interactive-pressed: color-mix(in srgb, rgb(var(--color-accent)) 80%, black);
  --color-interactive-disabled: rgb(var(--color-accent) / 0.38);
}
```

Quy tắc:
- ✅ Namespace biến: `--component-padding` (không phải `--padding`)
- ✅ Biến global trong `:root`
- ✅ Biến scoped trong `.component`

### 5. Logical Properties (Hỗ trợ RTL)

```css
/* ✅ Đúng — hỗ trợ RTL */
.element {
  padding-inline: 2rem;
  padding-block: 1rem;
  margin-inline: auto;
  border-inline-end: 1px solid var(--color-border);
  text-align: start;
  inset: 0;
}

/* ❌ Sai — không hỗ trợ RTL */
.element {
  padding: 1rem 2rem;
  margin: 0 auto;
  border-right: 1px solid var(--color-border);
  text-align: left;
  top: 0; right: 0; bottom: 0; left: 0;
}
```

### 6. Layout Patterns

```css
/* Grid cho layout */
.section-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
}

/* Flexbox cho component */
.product-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Aspect ratio cho media */
.product-card__image {
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

/* Container queries (thay media queries khi có thể) */
.product-grid {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .product-card {
    grid-template-columns: 1fr 1fr;
  }
}

/* Fluid spacing */
.component {
  padding: clamp(1rem, 4vw, 3rem);
  width: min(100%, 800px);
}
```

### 7. Schema JSON

- Hỗ trợ comment (`// comment`) và trailing comma
- `max_blocks` tối đa 50
- Block `"type": "@app"` để hỗ trợ app blocks
- Block `"type": "@theme"` cho recommended blocks
- Preset bắt buộc nếu muốn thêm section từ Theme Editor
- Schema `tag` hỗ trợ: `div`, `section`, `aside`, `header`, `footer`, `main`
- Setting id pattern: `^[a-z][a-z0-9_]*$` (lowercase, underscore)
- Label tối đa 30 ký tự, dùng Title Case

**`visible_if`** — ẩn/hiện settings có điều kiện:
```json
{
  "type": "select",
  "id": "layout",
  "label": "Bố cục",
  "options": [
    { "value": "grid", "label": "Lưới" },
    { "value": "list", "label": "Danh sách" }
  ]
},
{
  "type": "range",
  "id": "columns",
  "label": "Số cột",
  "visible_if": "{{ layout == 'grid' }}",
  "min": 2,
  "max": 6,
  "default": 4
}
```

**Thứ tự settings trong schema:**
1. Resource pickers (collection, product, blog, page) — đầu tiên
2. Layout (columns, spacing)
3. Typography (fonts, sizes)
4. Colors (background, text)
5. Padding/margin — cuối cùng

**Nhóm settings bằng header:**
```json
{ "type": "header", "content": "Bố cục" }
```

### 8. Nested Blocks (Kiến trúc Horizon)

Blocks có thể lồng nhau. Khi block có `blocks` con, PHẢI khai báo `block_order`:

```json
{
  "blocks": {
    "product-details": {
      "type": "_product-details",
      "static": true,
      "blocks": {
        "header": {
          "type": "group",
          "blocks": {
            "title": { "type": "product-title" },
            "price": { "type": "price" }
          },
          "block_order": ["title", "price"]
        }
      },
      "block_order": ["header"]
    }
  }
}
```

### 9. CSS trong Section

```liquid
{%- comment -%} Cách 1: style tag inline (scoped) {%- endcomment -%}
{%- style -%}
  #shopify-section-{{ section.id }} .wrapper {
    --section-padding-top: {{ section.settings.padding_top }}px;
    --section-padding-bottom: {{ section.settings.padding_bottom }}px;
  }
{%- endstyle -%}

{%- comment -%} Cách 2: stylesheet tag (bundled — Horizon style) {%- endcomment -%}
{% stylesheet %}
.section-name {
  padding-block-start: var(--section-padding-top, 40px);
  padding-block-end: var(--section-padding-bottom, 40px);
}
{% endstylesheet %}
```

### 10. JavaScript — Web Components

```javascript
if (!customElements.get('ten-component')) {
  class TenComponent extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      // Khởi tạo
    }

    disconnectedCallback() {
      // Dọn dẹp event listeners
    }
  }
  customElements.define('ten-component', TenComponent);
}
```

### 11. Hình ảnh

```liquid
{%- comment -%} Above-the-fold — eager load {%- endcomment -%}
{{ image | image_url: width: 1400 | image_tag:
  loading: 'eager',
  fetchpriority: 'high',
  sizes: '100vw',
  widths: '375, 750, 1100, 1500',
  alt: image.alt | escape
}}

{%- comment -%} Below-the-fold — lazy load {%- endcomment -%}
{{ image | image_url: width: 800 | image_tag:
  loading: 'lazy',
  sizes: '(min-width: 750px) 50vw, 100vw',
  alt: image.alt | escape
}}

{%- comment -%} Preload (tối đa 2/template) {%- endcomment -%}
{{ image | image_url: width: 1400 | image_tag: preload: true }}
```

### 12. Form chuẩn

```liquid
{%- form 'product', product -%}
  <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
  <button type="submit"
    {% if product.selected_or_first_available_variant.available == false %}disabled{% endif %}
  >
    {%- if product.selected_or_first_available_variant.available -%}
      {{ 'products.product.add_to_cart' | t }}
    {%- else -%}
      {{ 'products.product.sold_out' | t }}
    {%- endif -%}
  </button>
{%- endform -%}
```

### 13. SEO & Accessibility

- Mỗi trang chỉ 1 `<h1>`
- Ảnh luôn có `alt`
- Link có text mô tả
- Form có `<label>` cho mỗi input
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<aside>`
- ARIA: `aria-label`, `aria-expanded`, `role`
- Focus visible: dùng `:focus-visible` thay `:focus`
- Motion: tôn trọng `prefers-reduced-motion`
- Contrast: WCAG AA (4.5:1 normal text, 3:1 large text)

### 14. Đa ngôn ngữ (i18n)

```liquid
{{ 'products.product.add_to_cart' | t }}
```

Schema names nên dùng translation key: `"name": "t:names.section_name"`

### 15. Anti-patterns (KHÔNG ĐƯỢC LÀM)

| ❌ Sai | ✅ Đúng |
| --- | --- |
| `{% include 'x' %}` | `{% render 'x' %}` |
| `img_url: '400x'` | `image_url: width: 400` |
| `<img src="{{ img }}">` | `{{ img \| image_url: width: 400 \| image_tag }}` |
| `product.price \| divided_by: 100` | `product.price \| money` |
| `style="color: red"` | CSS trong `{%- style -%}` |
| `#id` selector CSS | `.class` selector CSS |
| `!important` | Tăng specificity hợp lý |
| `padding-left` / `margin-right` | `padding-inline-start` / `margin-inline-end` |
| `text-align: left` | `text-align: start` |
| `--padding` (CSS var) | `--component-padding` (namespaced) |
</context>

<process>
Khi viết hoặc sửa BẤT KỲ file Liquid nào:
1. Kiểm tra whitespace control `{%- -%}`
2. Kiểm tra KHÔNG dùng `include` hoặc `img_url`
3. Kiểm tra hình ảnh dùng `image_url` + `image_tag`
4. Kiểm tra CSS: BEM naming, namespaced variables, logical properties
5. Kiểm tra JavaScript dùng Web Component pattern
6. Kiểm tra accessibility (alt, label, semantic HTML, focus-visible)
7. Kiểm tra schema: setting order, visible_if, translation keys
8. Kiểm tra i18n: dùng `| t` filter, không hardcode text
</process>
