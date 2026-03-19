---
description: Tạo snippet Shopify tái sử dụng với quy chuẩn và tài liệu đầy đủ
---

# Tạo Snippet Shopify

## Khi nào dùng Snippet, khi nào dùng Section?

- **Snippet**: Đoạn code dùng chung, render bên trong section/layout (không có schema, không hiện trong Theme Editor)
- **Section**: Khối nội dung độc lập, có schema (hiện trong Theme Editor, merchant tuỳ chỉnh được)

## Quy tắc đặt tên

- File: `snippets/<ten-snippet>.liquid`
- Định dạng: kebab-case
- Tiền tố theo loại:
  - `icon-<ten>.liquid` — Icon SVG
  - `card-<ten>.liquid` — Component dạng thẻ
  - `price-<ten>.liquid` — Hiển thị giá
  - `badge-<ten>.liquid` — Nhãn/huy hiệu

## Mẫu Snippet (với LiquidDoc)

Shopify hỗ trợ **LiquidDoc** — cú pháp tài liệu hoá kiểu JSDoc dùng tag `{% doc %}`.
Tính năng này kích hoạt công cụ VS Code: gợi ý code, kiểm tra tham số, kiểm tra kiểu dữ liệu.

```liquid
{% doc %}
  @description Render <mô tả component>

  @param {String} param_1 - Mô tả tham số bắt buộc
  @param {Boolean} [param_2] - Tham số tuỳ chọn (ngoặc vuông = tuỳ chọn)
  @param {Number} [param_3] - Tham số tuỳ chọn khác

  @example
    {% render '<ten-snippet>',
      param_1: 'gia_tri',
      param_2: true
    %}
{% enddoc %}

{%- liquid
  comment
    Đặt giá trị mặc định cho tham số tuỳ chọn
  endcomment
  unless param_2
    assign param_2 = false
  endunless
-%}

{%- comment -%} Markup của snippet {%- endcomment -%}
<div class="snippet-<ten>">
  {%- comment -%} Nội dung ở đây {%- endcomment -%}
</div>
```

### Các kiểu dữ liệu LiquidDoc hỗ trợ

`String`, `Number`, `Boolean`, `Object` (cho các object Liquid như product, collection, image)

### Bắt buộc và Tuỳ chọn

- `@param {String} name` — tham số **bắt buộc**
- `@param {String} [name]` — tham số **tuỳ chọn** (bọc trong ngoặc vuông)

## Cách gọi Snippet

### ✅ Đúng chuẩn (Shopify 2.0)

```liquid
{% render 'card-product', product: product, show_badges: true %}
```

### ❌ Đã bị loại bỏ

```liquid
{% include 'card-product' %}
```

## So sánh `render` và `include`

| Đặc điểm | `{% render %}` | `{% include %}` |
| --- | --- | --- |
| Phạm vi biến | **Riêng biệt** — chỉ truy cập biến được truyền vào | Kế thừa biến từ template cha |
| Hiệu suất | Tốt hơn — được cache riêng | Chậm hơn — không có lợi ích cache |
| Khuyến nghị | ✅ Nên dùng | ❌ Đã bị loại bỏ |
| Truy cập biến | Chỉ các tham số truyền vào rõ ràng | Tất cả biến của template cha |
| Biến vòng lặp `for` | Không truy cập được | Truy cập được |

## Mẫu Snippet thông dụng

### Thẻ sản phẩm

```liquid
{% render 'card-product',
  product: product,
  show_badge: true,
  show_vendor: false,
  lazy_load: true,
  image_ratio: '1/1'
%}
```

### Icon

```liquid
{% render 'icon', icon: 'cart', size: 24, class: 'icon-cart' %}
```

### Giá sản phẩm

```liquid
{% render 'price', product: product, use_variant: true %}
```

## Các bước thực hiện

1. Tạo file trong thư mục `snippets/`
2. Tài liệu hoá tham số bằng LiquidDoc `{% doc %}` ở đầu file
3. Đặt giá trị mặc định cho tham số tuỳ chọn
4. Dùng `{% render %}` để gọi từ section/template
5. Chạy `shopify theme check` để kiểm tra
