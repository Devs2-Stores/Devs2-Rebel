---
name: shopify-create-section
description: Tạo section Shopify 2.0 chuẩn với schema, settings, blocks và best practices
---

<objective>
Tạo một section Shopify 2.0 hoàn chỉnh theo chuẩn Online Store 2.0 + Horizon.

**Tạo ra:**
- File `.liquid` trong `sections/`
- Schema đầy đủ (name, tag, class, settings, blocks, presets)
- CSS scoped theo BEM + namespaced variables
- Tuân thủ quy chuẩn đặt tên, hiệu suất và accessibility

**Sau lệnh này:** Thêm section vào JSON template hoặc test với `shopify theme dev`.
</objective>

<context>
## Quy tắc bắt buộc

1. **Đặt tên file:** `kebab-case.liquid` (ví dụ: `hero-banner.liquid`)
2. **Whitespace control:** Luôn `{%- -%}` và `{{- -}}`
3. **Render, không include:** `{% render 'snippet' %}` — KHÔNG `{% include %}`
4. **image_url:** `| image_url: width: 600` — KHÔNG `| img_url`
5. **max_blocks:** Tối đa 50 blocks/section
6. **Preset bắt buộc** nếu merchant cần thêm từ Theme Editor
7. **App blocks:** `"type": "@app"` trong blocks
8. **Theme blocks:** `"type": "@theme"` cho recommended blocks
9. **CSS:** BEM naming, namespaced variables
10. **Schema tag:** chọn semantic tag: `div`, `section`, `aside`, `header`, `footer`, `main`

## Cấu trúc section chuẩn (Horizon style)

```liquid
{%- comment -%}
  Section: [tên section]
  Mô tả: [mô tả ngắn]
{%- endcomment -%}

{%- liquid
  assign section_id = section.settings.custom_id | default: section.id
  assign section_class = 'section-' | append: section.type
-%}

<section
  id="{{ section_id }}"
  class="{{ section_class }}"
  style="
    --section-padding-top: {{ section.settings.padding_top }}px;
    --section-padding-bottom: {{ section.settings.padding_bottom }}px;
  "
>
  <div class="page-width">
    {%- if section.settings.heading != blank -%}
      <h2 class="{{ section_class }}__heading">
        {{- section.settings.heading -}}
      </h2>
    {%- endif -%}

    {%- for block in section.blocks -%}
      {%- case block.type -%}
        {%- when 'item' -%}
          <div class="{{ section_class }}__item" {{ block.shopify_attributes }}>
            {%- comment -%} Nội dung block {%- endcomment -%}
          </div>
        {%- when '@app' -%}
          {%- render block -%}
      {%- endcase -%}
    {%- endfor -%}
  </div>
</section>

{% stylesheet %}
.section-[ten] {
  padding-block-start: var(--section-padding-top, 40px);
  padding-block-end: var(--section-padding-bottom, 40px);
}

.section-[ten]__heading {
  margin-block-end: var(--space-lg);
}

.section-[ten]__item {
  /* BEM element styles */
}
{% endstylesheet %}

{% schema %}
{
  "name": "Tên Section",
  "tag": "section",
  "class": "section-[ten]",
  "settings": [
    {
      "type": "header",
      "content": "Nội dung"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Tiêu đề",
      "default": "Tiêu đề mặc định"
    },
    {
      "type": "header",
      "content": "Bố cục"
    },
    {
      "type": "color_scheme",
      "id": "color_scheme",
      "label": "Bảng màu",
      "default": "scheme-1"
    },
    {
      "type": "range",
      "id": "padding_top",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Khoảng cách trên",
      "default": 40
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Khoảng cách dưới",
      "default": 40
    }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Mục",
      "settings": []
    },
    {
      "type": "@theme"
    },
    {
      "type": "@app"
    }
  ],
  "presets": [
    {
      "name": "Tên Section"
    }
  ]
}
{% endschema %}
```

## visible_if — Ẩn/hiện settings có điều kiện

```json
{
  "type": "select",
  "id": "layout",
  "label": "Bố cục",
  "options": [
    { "value": "grid", "label": "Lưới" },
    { "value": "list", "label": "Danh sách" }
  ],
  "default": "grid"
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

## Nested Blocks (Kiến trúc Horizon)

Blocks lồng nhau — PHẢI có `block_order`:

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

## Thứ tự settings trong schema

1. **Header "Nội dung"** → resource pickers (collection, product), text, richtext
2. **Header "Bố cục"** → columns, spacing, alignment
3. **Header "Kiểu dáng"** → color_scheme, font, colors
4. **Header "Khoảng cách"** → padding_top, padding_bottom (luôn cuối cùng)

## Bảng tham chiếu kiểu Settings

| Nhóm | Kiểu | Công dụng |
| --- | --- | --- |
| **Cơ bản** | `text`, `textarea`, `number`, `checkbox`, `radio`, `range`, `select` | Input đơn giản |
| **Định dạng** | `richtext`, `inline_richtext`, `html`, `liquid` | Nội dung có format |
| **Hình ảnh** | `image_picker`, `video`, `video_url` | Media |
| **Màu sắc** | `color`, `color_background`, `color_scheme`, `color_scheme_group` | Màu & gradient |
| **Điều hướng** | `url`, `link_list`, `text_alignment` | Links & căn chỉnh |
| **Font** | `font_picker` | Typography |
| **Tài nguyên** | `article`, `article_list`, `blog`, `collection`, `collection_list`, `page`, `product`, `product_list` | Content picker |
| **Metaobject** | `metaobject`, `metaobject_list` | Custom data |
| **Thông tin** | `header`, `paragraph` | Phân nhóm, hướng dẫn |

## Lưu ý hiệu suất

- Above-the-fold: `loading="eager"` + `fetchpriority="high"`
- Below-the-fold: `loading="lazy"`
- Dùng `image_tag` filter: `{{ image | image_url: width: 800 | image_tag: loading: 'lazy' }}`
- CSS scoped — tránh ảnh hưởng section khác
- Container queries thay media queries khi có thể
- `aspect-ratio` cho media thay vì padding hack
</context>

<process>
1. Hỏi user: Tên section, mục đích, settings/blocks cần thiết
2. Tạo file `sections/[ten-section].liquid` theo cấu trúc chuẩn
3. CSS: BEM naming, namespaced variables, logical properties
4. Schema: thứ tự settings đúng, header phân nhóm, visible_if nếu cần
5. Blocks: thêm `@app` và `@theme`, nested blocks nếu cần
6. Preset: bắt buộc nếu cần Theme Editor
7. Kiểm tra: whitespace, image_url, render, accessibility, i18n
</process>
