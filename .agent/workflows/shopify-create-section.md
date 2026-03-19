---
description: Tạo section Shopify 2.0 chuẩn với schema, settings và blocks
---

# Tạo Section Shopify 2.0

## Quy tắc đặt tên

- File: `sections/<ten-section>.liquid`
- Định dạng tên: kebab-case (ví dụ: `hero-banner.liquid`, `featured-products.liquid`)
- Tiền tố class CSS: `section-<ten>` (ví dụ: `section-hero-banner`)

## Mẫu file Section

Mỗi section **BẮT BUỘC** tuân thủ cấu trúc sau:

```liquid
{%- comment -%}
  Section: <Tên Section>
  Mô tả: <Mô tả ngắn gọn chức năng của section>
{%- endcomment -%}

{%- style -%}
  /* Style riêng của section, sử dụng giá trị từ schema settings */
  #shopify-section-{{ section.id }} {
    /* Dùng CSS custom properties từ settings */
    padding-top: {{ section.settings.padding_top }}px;
    padding-bottom: {{ section.settings.padding_bottom }}px;
  }
{%- endstyle -%}

<section
  id="section-{{ section.id }}"
  class="section-<ten> {% if section.settings.full_width %}section--full-width{% endif %}"
  data-section-id="{{ section.id }}"
  data-section-type="<ten>"
>
  <div class="page-width">
    {%- comment -%} Nội dung section ở đây {%- endcomment -%}

    {%- for block in section.blocks -%}
      {%- case block.type -%}
        {%- when 'ten_block' -%}
          <div {{ block.shopify_attributes }}>
            {%- comment -%} Nội dung block {%- endcomment -%}
          </div>
      {%- endcase -%}
    {%- endfor -%}
  </div>
</section>

{% schema %}
{
  "name": "<Tên Hiển Thị>",
  "tag": "section",
  "class": "section-<ten>",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Tiêu đề",
      "default": "Tiêu đề Section"
    },
    {
      "type": "richtext",
      "id": "description",
      "label": "Mô tả"
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
      "type": "ten_block",
      "name": "Tên Block Hiển Thị",
      "settings": []
    }
  ],
  "presets": [
    {
      "name": "<Tên Hiển Thị>",
      "category": "Custom"
    }
  ]
}
{% endschema %}
```

## Bảng tham chiếu kiểu Settings trong Schema

| Kiểu | Công dụng | Ví dụ |
| --- | --- | --- |
| `text` | Nhập văn bản ngắn | Tiêu đề, nhãn |
| `textarea` | Nhập văn bản nhiều dòng | Mô tả |
| `richtext` | Trình soạn thảo định dạng | Nội dung có format |
| `inline_richtext` | Văn bản định dạng ngắn | Văn bản inline |
| `number` | Nhập số | Số lượng, giới hạn |
| `checkbox` | Bật/tắt | Ẩn/hiện phần tử |
| `radio` | Nút radio chọn một | Kiểu bố cục |
| `range` | Thanh trượt | Khoảng cách, số cột |
| `select` | Danh sách thả xuống | Tuỳ chọn bố cục |
| `text_alignment` | Căn chỉnh văn bản (trái/giữa/phải) | Căn chỉnh tiêu đề |
| `url` | Nhập đường dẫn | Liên kết |
| `image_picker` | Chọn/tải ảnh | Banner, logo |
| `video` | Chọn video từ thư viện | Video nền |
| `video_url` | Nhập URL YouTube/Vimeo | Video nhúng |
| `color` | Chọn màu | Màu tuỳ chỉnh |
| `color_background` | Chọn gradient | Nền gradient |
| `color_scheme` | Bảng màu đơn | Phối màu theme |
| `color_scheme_group` | Nhóm bảng màu tuỳ chỉnh | Hệ thống phối màu |
| `font_picker` | Chọn font chữ | Font tuỳ chỉnh |
| `html` | Code HTML tuỳ chỉnh | Mã nhúng |
| `liquid` | Code Liquid tuỳ chỉnh | Code nâng cao |
| `link_list` | Chọn menu | Menu điều hướng |
| `article` | Chọn 1 bài viết | Bài blog nổi bật |
| `article_list` | Chọn nhiều bài viết | Danh sách bài viết |
| `blog` | Chọn blog | Danh mục bài viết |
| `collection` | Chọn 1 bộ sưu tập | Danh mục SP nổi bật |
| `collection_list` | Chọn nhiều bộ sưu tập | Danh sách BST |
| `page` | Chọn trang | Trang thông tin |
| `product` | Chọn 1 sản phẩm | Sản phẩm nổi bật |
| `product_list` | Chọn nhiều sản phẩm | Danh sách SP |
| `metaobject` | Chọn 1 metaobject | Đánh giá SP, tác giả |
| `metaobject_list` | Chọn nhiều metaobject | Danh sách đánh giá |

## Block và Section Settings — Phân biệt

- **Section settings**: Cài đặt chung cho toàn bộ section
- **Block settings**: Cài đặt cho từng item (lặp lại được, ví dụ: slide, card)
- Block có **tối đa 50 item** mỗi section (có thể giảm bằng `"max_blocks"` trong schema)
- Static blocks không tính vào giới hạn này
- Dùng kiểu block `@theme` để đánh dấu **block được đề xuất** (hiện ưu tiên trong block picker)

## JSON hỗ trợ Comment (Tính năng mới)

Shopify hiện hỗ trợ **comment và dấu phẩy cuối** trong schema JSON:

```liquid
{% schema %}
{
  // Đây là comment
  "name": "Section Của Tôi",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Tiêu đề", // dấu phẩy cuối được phép
    },
  ],
}
{% endschema %}
```

## Các bước tạo Section

1. Tạo file section trong thư mục `sections/`
2. Thêm CSS riêng cho section qua tag `{%- style -%}` hoặc file CSS riêng trong `assets/`
3. Thêm JavaScript nếu cần trong `assets/` với thuộc tính `defer`
4. Gắn vào JSON template hoặc thêm preset để hiện trong Theme Editor
5. Chạy `shopify theme check` để kiểm tra

## Thêm Section vào Template

Trong file `templates/<trang>.json`:

```json
{
  "sections": {
    "khoa-duy-nhat": {
      "type": "ten-file-section",
      "settings": {}
    }
  },
  "order": ["khoa-duy-nhat"]
}
```

## Lưu ý hiệu suất

- Dùng `loading="lazy"` cho ảnh nằm dưới màn hình đầu tiên
- Dùng `fetchpriority="high"` cho ảnh hero/LCP
- Trì hoãn CSS không quan trọng bằng block `{%- style -%}`
- Dùng `{% render %}` cho snippet (tạo phạm vi biến riêng biệt)
- Tránh inline `<script>` — dùng file JS với thuộc tính `defer`
