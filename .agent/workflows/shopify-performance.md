---
description: Tối ưu hiệu suất theme Shopify cho Core Web Vitals (LCP, CLS, INP) và PageSpeed
---

# Tối Ưu Hiệu Suất Theme Shopify

## Chỉ số Core Web Vitals mục tiêu

| Chỉ số | Mục tiêu | Mô tả |
| --- | --- | --- |
| **LCP** | < 2.5 giây | Largest Contentful Paint — thời gian tải ảnh/text chính |
| **CLS** | < 0.1 | Cumulative Layout Shift — độ ổn định giao diện |
| **INP** | < 200ms | Interaction to Next Paint — tốc độ phản hồi tương tác |

## 1. Tối ưu LCP

### Preload ảnh Hero

```liquid
{%- comment -%} Trong layout/theme.liquid phần <head> {%- endcomment -%}
{%- if template == 'index' -%}
  <link
    rel="preload"
    as="image"
    href="{{ settings.hero_image | image_url: width: 1400 }}"
    media="(min-width: 768px)"
  >
  <link
    rel="preload"
    as="image"
    href="{{ settings.hero_image | image_url: width: 750 }}"
    media="(max-width: 767px)"
  >
{%- endif -%}
```

### Ảnh Hero với fetchpriority

```liquid
<img
  src="{{ section.settings.image | image_url: width: 1400 }}"
  fetchpriority="high"
  loading="eager"
  width="{{ section.settings.image.width }}"
  height="{{ section.settings.image.height }}"
  alt="{{ section.settings.image.alt | escape }}"
>
```

### Dùng filter `image_tag` (khuyến nghị từ Shopify)

```liquid
{%- comment -%} Shopify tự tạo srcset thông minh — cách ngắn gọn nhất {%- endcomment -%}
{{ section.settings.image | image_url: width: 1400 | image_tag:
  loading: 'lazy',
  sizes: '(min-width: 1200px) 1200px, 100vw',
  widths: '375, 750, 1100, 1500'
}}
```

### Dùng filter `preload_tag` (tối đa 2 resource/template)

```liquid
{%- comment -%} Preload CSS quan trọng — Shopify gửi Link header {%- endcomment -%}
{{ 'base.css' | asset_url | preload_tag: as: 'style' }}

{%- comment -%} Preload ảnh bằng image_tag {%- endcomment -%}
{{ section.settings.image | image_url: width: 1400 | image_tag: preload: true }}
```

### Preconnect CDN

```liquid
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
<link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>
```

## 2. Tối ưu CLS

### Luôn đặt kích thước ảnh

```liquid
<img
  src="{{ image | image_url: width: 600 }}"
  width="{{ image.width }}"
  height="{{ image.height }}"
  alt="{{ image.alt | escape }}"
>
```

### CSS Aspect Ratio cho ảnh động

```css
.card__image-wrapper {
  aspect-ratio: 1 / 1; /* hoặc 3/4, 16/9, v.v. */
  overflow: hidden;
}

.card__image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Giữ chỗ cho font chữ

```css
/* Ngăn layout shift khi đổi font */
body {
  font-display: swap;
}

/* Chiều cao cố định cho container text khi đang tải */
.hero__heading {
  min-height: 1.2em; /* Giữ chỗ ít nhất một dòng */
}
```

## 3. Tối ưu INP

### Debounce sự kiện cuộn trang

```javascript
function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

window.addEventListener('scroll', debounce(handleScroll, 100));
```

### Nhường luồng chính (Yield to Main Thread)

```javascript
function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function processItems(items) {
  for (const item of items) {
    processItem(item);
    await yieldToMain(); // Để trình duyệt xử lý cập nhật giao diện
  }
}
```

## 4. Hiệu suất CSS

### CSS quan trọng đặt inline

```liquid
{%- comment -%} CSS quan trọng trong <head> {%- endcomment -%}
{%- style -%}
  /* Chỉ style phần trên màn hình đầu tiên */
  :root { --color-primary: {{ settings.color_primary }}; }
  body { margin: 0; font-family: var(--font-body); }
  .page-width { max-width: var(--page-width); margin: 0 auto; }
{%- endstyle -%}
```

### Tải CSS không quan trọng dạng trì hoãn

```liquid
{%- comment -%} Trì hoãn CSS section {%- endcomment -%}
<link
  rel="stylesheet"
  href="{{ 'section-footer.css' | asset_url }}"
  media="print"
  onload="this.media='all'"
>
```

## 5. Hiệu suất JavaScript

### Trì hoãn tất cả script

```liquid
<script src="{{ 'theme.js' | asset_url }}" defer></script>
```

### Import động cho tính năng nặng

```javascript
// Chỉ tải khi cần
async function showQuickView(product) {
  const { QuickView } = await import('./quick-view.js');
  new QuickView(product).show();
}
```

### Intersection Observer để khởi tạo lazy

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      initializeSection(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { rootMargin: '200px' });

document.querySelectorAll('[data-lazy-init]').forEach(el => observer.observe(el));
```

## 6. Tối ưu hình ảnh

### Định dạng hiện đại với fallback

```liquid
{%- comment -%} Shopify tự động phục vụ WebP/AVIF khi trình duyệt hỗ trợ {%- endcomment -%}
<img
  srcset="
    {{ image | image_url: width: 375 }} 375w,
    {{ image | image_url: width: 750 }} 750w,
    {{ image | image_url: width: 1100 }} 1100w,
    {{ image | image_url: width: 1500 }} 1500w
  "
  src="{{ image | image_url: width: 750 }}"
  sizes="(min-width: 1200px) calc((1200px - 40px) / 4), (min-width: 768px) 50vw, 100vw"
  width="{{ image.width }}"
  height="{{ image.height }}"
  loading="lazy"
  alt="{{ image.alt | escape }}"
>
```

## 7. Tối ưu riêng cho Shopify

### Tránh truy vấn N+1 trong Liquid

```liquid
{%- comment -%} ❌ Xấu — tải dữ liệu sản phẩm N lần {%- endcomment -%}
{%- for product in collection.products -%}
  {{ product.metafields.custom.subtitle.value }}
{%- endfor -%}

{%- comment -%} ✅ Tốt hơn — giới hạn sản phẩm {%- endcomment -%}
{%- for product in collection.products limit: 8 -%}
  {{ product.title }}
{%- endfor -%}
```

### Phân trang cho bộ sưu tập lớn

```liquid
{%- paginate collection.products by 24 -%}
  {%- for product in collection.products -%}
    {%- render 'card-product', product: product -%}
  {%- endfor -%}
  {%- render 'pagination', paginate: paginate -%}
{%- endpaginate -%}
```

## Kiểm tra

// turbo
1. Chạy kiểm tra Lighthouse:
```
shopify theme check --category performance
```

2. Test trên thiết bị thật:
   - Chrome DevTools → Lighthouse
   - PageSpeed Insights: https://pagespeed.web.dev/
   - WebPageTest: https://www.webpagetest.org/
