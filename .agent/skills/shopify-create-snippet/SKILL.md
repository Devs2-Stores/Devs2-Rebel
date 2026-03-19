---
name: shopify-create-snippet
description: Tạo snippet Shopify tái sử dụng với LiquidDoc và best practices
---

<objective>
Tạo một snippet Shopify tái sử dụng, có tài liệu LiquidDoc đầy đủ.

**Tạo ra:**
- File `.liquid` trong `snippets/`
- Tài liệu `{% doc %}` cho IDE hỗ trợ autocomplete
- CSS theo BEM naming (nếu cần)
- Tuân thủ quy chuẩn đặt tên

**Sau lệnh này:** Gọi snippet bằng `{% render 'ten-snippet' %}`.
</objective>

<context>
## Khi nào dùng Snippet vs Section

| Snippet | Section |
| --- | --- |
| Component nhỏ, tái sử dụng | Module lớn, có Theme Editor |
| Không có schema | Có schema (settings, blocks) |
| Gọi bằng `{% render %}` | Tham chiếu trong JSON template |
| Ví dụ: icon, price, badge, card | Ví dụ: hero, slideshow, featured |

## Quy tắc bắt buộc

1. **Đặt tên:** `kebab-case.liquid` theo chức năng
2. **LUÔN `{% render %}`** — KHÔNG `{% include %}` (deprecated, phá scope)
3. **Truyền biến tường minh:** `{% render 'card', product: product %}`
4. **LiquidDoc:** `{% doc %}` ở đầu file
5. **Default values:** `| default:` cho mọi param optional
6. **BEM CSS:** nếu snippet có HTML
7. **Accessibility:** alt text, aria-label, semantic HTML

## Mẫu Snippet với LiquidDoc

```liquid
{% doc %}
  @description Hiển thị card sản phẩm với ảnh, tên, giá
  @param {product} product - Đối tượng sản phẩm (bắt buộc)
  @param {boolean} [show_vendor=false] - Hiển thị nhà cung cấp
  @param {boolean} [show_price=true] - Hiển thị giá
  @param {string} [image_size='400'] - Chiều rộng ảnh (px)
  @param {string} [heading_tag='h3'] - Tag heading
  @example {% render 'product-card', product: product, show_vendor: true %}
{% enddoc %}

{%- liquid
  assign show_vendor = show_vendor | default: false
  assign show_price = show_price | default: true
  assign image_size = image_size | default: '400'
  assign heading_tag = heading_tag | default: 'h3'
-%}

<article class="product-card" aria-label="{{ product.title | escape }}">
  {%- if product.featured_image != blank -%}
    <a href="{{ product.url }}" class="product-card__image-link" tabindex="-1" aria-hidden="true">
      {{ product.featured_image | image_url: width: image_size | image_tag:
        loading: 'lazy',
        class: 'product-card__image',
        alt: product.featured_image.alt | default: product.title | escape
      }}
    </a>
  {%- endif -%}

  <div class="product-card__info">
    <{{ heading_tag }} class="product-card__title">
      <a href="{{ product.url }}">{{- product.title -}}</a>
    </{{ heading_tag }}>

    {%- if show_vendor -%}
      <p class="product-card__vendor">{{ product.vendor }}</p>
    {%- endif -%}

    {%- if show_price -%}
      <div class="product-card__price" aria-label="{{ 'products.product.price' | t }}: {{ product.price | money }}">
        {%- if product.compare_at_price > product.price -%}
          <s class="product-card__compare-price">
            <span class="visually-hidden">{{ 'products.product.regular_price' | t }}</span>
            {{- product.compare_at_price | money -}}
          </s>
        {%- endif -%}
        <span class="product-card__current-price">{{ product.price | money }}</span>
      </div>
    {%- endif -%}
  </div>
</article>
```

## Cách gọi Snippet

```liquid
{%- comment -%} Truyền biến tường minh {%- endcomment -%}
{%- render 'product-card', product: product, show_vendor: true -%}

{%- comment -%} Vòng lặp {%- endcomment -%}
{%- for product in collection.products -%}
  {%- render 'product-card', product: product -%}
{%- endfor -%}

{%- comment -%} Truyền với 'with' {%- endcomment -%}
{%- render 'product-card' with featured_product as product -%}
```

## Snippet thông dụng nên có

| Snippet | Chức năng |
| --- | --- |
| `icon-[ten].liquid` | SVG icon tái sử dụng |
| `product-card.liquid` | Card sản phẩm |
| `price.liquid` | Giá (sale, compare, badge) |
| `image.liquid` | Responsive image wrapper |
| `badge.liquid` | Badge (sale, new, sold out) |
| `pagination.liquid` | Phân trang |
| `breadcrumb.liquid` | Breadcrumb navigation |
| `social-icons.liquid` | Icon mạng xã hội |
| `loading-spinner.liquid` | Spinner loading |
</context>

<process>
1. Hỏi user: Tên snippet, chức năng, tham số cần thiết
2. Tạo file `snippets/[ten-snippet].liquid` với LiquidDoc
3. Default values cho params optional: `| default:`
4. BEM CSS cho HTML elements
5. Accessibility: alt text, aria-label, semantic tags
6. Whitespace control `{%- -%}`
7. Hướng dẫn user cách gọi `{% render %}`
</process>
