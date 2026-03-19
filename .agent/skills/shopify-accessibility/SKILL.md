---
name: shopify-accessibility
description: Chuẩn accessibility WCAG cho Shopify theme — dựa trên Horizon rules chính thức
---

<objective>
Đảm bảo mọi code Shopify Liquid tuân thủ chuẩn accessibility WCAG AA.
AI PHẢI áp dụng các quy tắc này khi tạo hoặc sửa bất kỳ component nào.

Nguồn: 16 file accessibility rules từ Shopify Horizon (chính thức).
</objective>

<context>
## Quy tắc toàn cục

### Focus Management
```css
/* LUÔN dùng focus-visible thay focus */
.button:focus-visible {
  outline: 2px solid rgb(var(--color-focus));
  outline-offset: 2px;
}

/* KHÔNG xoá outline */
/* ❌ */ *:focus { outline: none; }
/* ✅ */ *:focus:not(:focus-visible) { outline: none; }
```

### Motion & Animation
```css
/* LUÔN tôn trọng prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Color & Contrast
- WCAG AA: 4.5:1 (normal text), 3:1 (large text ≥18px bold / ≥24px)
- KHÔNG chỉ dùng màu để truyền đạt thông tin
- Hỗ trợ dark mode: `@media (prefers-color-scheme: dark)`
- Hỗ trợ high contrast: `@media (forced-colors: active)`

### Heading Hierarchy
- Mỗi trang chỉ 1 `<h1>` — thường là title sản phẩm/trang
- KHÔNG nhảy cấp (h1 → h3 mà bỏ h2)
- Section heading nên dùng `<h2>`, block heading dùng `<h3>`

### Image Alt Text
```liquid
{%- comment -%} Ảnh trang trí — alt rỗng {%- endcomment -%}
{{ image | image_url: width: 800 | image_tag: alt: '', role: 'presentation' }}

{%- comment -%} Ảnh nội dung — alt mô tả {%- endcomment -%}
{{ product.featured_image | image_url: width: 800 | image_tag:
  alt: product.featured_image.alt | default: product.title | escape
}}
```

### Landmarks (ARIA)
```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Menu chính">...</nav>
<main role="main" id="main-content">...</main>
<footer role="contentinfo">...</footer>
<aside role="complementary">...</aside>
```

## Quy tắc theo Component

### Accordion / Collapsible
```html
<button
  aria-expanded="false"
  aria-controls="panel-{{ block.id }}"
  id="trigger-{{ block.id }}"
>
  {{ block.settings.heading }}
</button>
<div
  id="panel-{{ block.id }}"
  role="region"
  aria-labelledby="trigger-{{ block.id }}"
  hidden
>
  {{ block.settings.content }}
</div>
```

### Modal / Dialog
```html
<dialog
  id="modal-{{ section.id }}"
  aria-labelledby="modal-title-{{ section.id }}"
  aria-modal="true"
>
  <h2 id="modal-title-{{ section.id }}">Tiêu đề</h2>
  <button aria-label="Đóng" class="modal__close">✕</button>
  <!-- Nội dung -->
</dialog>
```
JS: Focus trap trong modal, return focus khi đóng.

### Carousel / Slideshow
```html
<div
  role="region"
  aria-roledescription="carousel"
  aria-label="{{ section.settings.heading }}"
>
  <div role="group" aria-roledescription="slide" aria-label="Slide {{ forloop.index }} / {{ forloop.length }}">
    <!-- Nội dung slide -->
  </div>
  <button aria-label="Slide trước">←</button>
  <button aria-label="Slide sau">→</button>
</div>
```
- Pause khi hover/focus
- Tôn trọng `prefers-reduced-motion` — tắt auto-play

### Tab Panel
```html
<div role="tablist" aria-label="Thông tin sản phẩm">
  <button role="tab" id="tab-1" aria-controls="panel-1" aria-selected="true">Mô tả</button>
  <button role="tab" id="tab-2" aria-controls="panel-2" aria-selected="false" tabindex="-1">Đánh giá</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>...</div>
```
Keyboard: Arrow keys chuyển tab, Home/End đến tab đầu/cuối.

### Dropdown Navigation
```html
<nav aria-label="Menu chính">
  <ul>
    <li>
      <button aria-expanded="false" aria-haspopup="true">
        Danh mục
      </button>
      <ul role="menu" hidden>
        <li role="menuitem"><a href="#">Sản phẩm mới</a></li>
      </ul>
    </li>
  </ul>
</nav>
```
Keyboard: Enter/Space toggle, Escape đóng, Arrow keys điều hướng.

### Form
```html
<form>
  <div class="field">
    <label for="email-{{ section.id }}">Email</label>
    <input
      type="email"
      id="email-{{ section.id }}"
      name="email"
      required
      aria-required="true"
      aria-describedby="email-error-{{ section.id }}"
      autocomplete="email"
    >
    <span id="email-error-{{ section.id }}" class="field__error" role="alert" hidden>
      Vui lòng nhập email hợp lệ
    </span>
  </div>
</form>
```
- Mỗi input PHẢI có `<label>` với `for`
- Error messages: `role="alert"` + `aria-describedby`
- Autocomplete cho thông tin đã biết

### Product Card
```html
<article class="product-card" aria-label="{{ product.title }}">
  <a href="{{ product.url }}" class="product-card__link" tabindex="0">
    {{ product.featured_image | image_url: width: 400 | image_tag:
      alt: product.featured_image.alt | default: product.title | escape,
      loading: 'lazy'
    }}
    <h3 class="product-card__title">{{ product.title }}</h3>
  </a>
  <div class="product-card__price" aria-label="Giá {{ product.price | money }}">
    {%- if product.compare_at_price > product.price -%}
      <s aria-label="Giá gốc"><span class="visually-hidden">Giá gốc</span>{{ product.compare_at_price | money }}</s>
      <span aria-label="Giá bán">{{ product.price | money }}</span>
    {%- else -%}
      {{ product.price | money }}
    {%- endif -%}
  </div>
</article>
```

### Sale Price
```html
{%- if product.compare_at_price > product.price -%}
  <div class="price" aria-label="Giá {{ product.price | money }}, giảm từ {{ product.compare_at_price | money }}">
    <s class="price__compare">
      <span class="visually-hidden">Giá gốc</span>
      {{ product.compare_at_price | money }}
    </s>
    <span class="price__sale">
      <span class="visually-hidden">Giá bán</span>
      {{ product.price | money }}
    </span>
  </div>
{%- endif -%}
```

### Color Swatch
```html
<fieldset>
  <legend>Màu sắc</legend>
  {%- for color in product.options_by_name['Color'].values -%}
    <label class="swatch" style="--swatch-color: {{ color | handleize }}">
      <input
        type="radio"
        name="color"
        value="{{ color }}"
        aria-label="{{ color }}"
        {% if forloop.first %}checked{% endif %}
      >
      <span class="swatch__visual" aria-hidden="true"></span>
      <span class="visually-hidden">{{ color }}</span>
    </label>
  {%- endfor -%}
</fieldset>
```

## CSS Helper Class

```css
/* Ẩn visual nhưng screen reader vẫn đọc được */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Skip to content link */
.skip-to-content:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

## Checklist

Trước khi hoàn thành, kiểm tra:
- [ ] Mọi ảnh có `alt` (rỗng cho ảnh trang trí)
- [ ] Mọi input có `<label>`
- [ ] Focus visible trên mọi interactive element
- [ ] Heading hierarchy đúng (h1 → h2 → h3)
- [ ] ARIA attributes cho modal, accordion, tab, carousel
- [ ] `prefers-reduced-motion` cho animations
- [ ] Keyboard navigation hoạt động (Enter, Space, Escape, Arrows)
- [ ] Color contrast ≥ 4.5:1
- [ ] Skip-to-content link
</context>

<process>
Khi tạo hoặc sửa bất kỳ component nào:
1. Xác định loại component (modal, accordion, carousel, form, card...)
2. Áp dụng ARIA pattern tương ứng từ context
3. Đảm bảo keyboard navigation
4. Thêm `prefers-reduced-motion` cho animation
5. Kiểm tra focus-visible
6. Kiểm tra alt text và label
7. Chạy checklist cuối cùng
</process>
