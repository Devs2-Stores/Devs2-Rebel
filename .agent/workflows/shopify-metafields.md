---
description: Sử dụng Metafields và Metaobjects trong Shopify theme — truy xuất, render và dynamic sources
---

# Metafields & Metaobjects trong Shopify Theme

## Khái niệm

- **Metafield**: Trường dữ liệu tuỳ chỉnh gắn vào resource (product, collection, article, page, shop, customer, order, variant)
- **Metaobject**: Kiểu dữ liệu tuỳ chỉnh hoàn toàn — tạo content model riêng (ví dụ: FAQ, Team Member, Testimonial)

## 1. Cấu trúc truy cập Metafield

```liquid
{%- comment -%} Cú pháp: resource.metafields.namespace.key {%- endcomment -%}
{{ product.metafields.custom.subtitle }}
{{ product.metafields.custom.subtitle.value }}
{{ product.metafields.custom.subtitle.type }}

{%- comment -%} Kiểm tra tồn tại trước khi dùng {%- endcomment -%}
{%- if product.metafields.custom.subtitle != blank -%}
  <p class="product__subtitle">{{ product.metafields.custom.subtitle.value }}</p>
{%- endif -%}
```

## 2. Render theo kiểu dữ liệu (Type)

### Văn bản

```liquid
{%- comment -%} single_line_text_field {%- endcomment -%}
{{ product.metafields.custom.subtitle.value }}

{%- comment -%} multi_line_text_field — giữ xuống dòng {%- endcomment -%}
{{ product.metafields.custom.care_instructions.value | newline_to_br }}

{%- comment -%} rich_text_field — output HTML từ metafield {%- endcomment -%}
{{ product.metafields.custom.long_description.value }}
```

### Số

```liquid
{%- comment -%} number_integer / number_decimal {%- endcomment -%}
{{ product.metafields.custom.weight_kg.value }} kg

{%- comment -%} Tính toán {%- endcomment -%}
{%- assign discount = product.metafields.custom.discount_percent.value | times: 0.01 -%}
```

### Boolean

```liquid
{%- if product.metafields.custom.is_featured.value == true -%}
  <span class="badge badge--featured">Nổi bật</span>
{%- endif -%}
```

### Ngày tháng

```liquid
{%- comment -%} date / date_time {%- endcomment -%}
{{ product.metafields.custom.release_date.value | date: '%d/%m/%Y' }}
{{ product.metafields.custom.event_time.value | date: '%d/%m/%Y %H:%M' }}
```

### Màu sắc

```liquid
{%- comment -%} color — trả về color object {%- endcomment -%}
<div style="background-color: {{ product.metafields.custom.accent_color.value }};">
  Màu tuỳ chỉnh
</div>

{%- comment -%} Truy cập thành phần {%- endcomment -%}
{{ product.metafields.custom.accent_color.value.red }}
{{ product.metafields.custom.accent_color.value.green }}
{{ product.metafields.custom.accent_color.value.blue }}
{{ product.metafields.custom.accent_color.value.alpha }}
```

### Tiền tệ

```liquid
{%- comment -%} money — hiển thị theo tiền tệ khách hàng {%- endcomment -%}
{{ product.metafields.custom.cost_per_serving.value }}
```

### Đo lường (weight, volume, dimension)

```liquid
{%- comment -%} measurement — trả về measurement object {%- endcomment -%}
{{ product.metafields.custom.net_weight.value.value }}
{{ product.metafields.custom.net_weight.value.unit }}
{%- comment -%} Ví dụ: "500" + "g" → "500 g" {%- endcomment -%}
```

### Đánh giá (rating)

```liquid
{%- comment -%} rating — trả về rating object {%- endcomment -%}
{%- assign rating = product.metafields.custom.customer_rating.value -%}
<div class="rating" aria-label="Đánh giá {{ rating.value }} trên {{ rating.scale_max }}">
  {{ rating.value }} / {{ rating.scale_max }}
</div>
```

### URL

```liquid
{%- comment -%} url_reference {%- endcomment -%}
<a href="{{ product.metafields.custom.manual_url.value }}">
  Xem hướng dẫn sử dụng
</a>
```

### JSON

```liquid
{%- comment -%} json — truy cập thuộc tính trực tiếp {%- endcomment -%}
{%- assign specs = product.metafields.custom.specifications.value -%}
<table class="specs-table">
  {%- for property in specs -%}
    <tr>
      <th>{{ property.first | capitalize }}</th>
      <td>{{ property.last }}</td>
    </tr>
  {%- endfor -%}
</table>

{%- comment -%} Hoặc truy cập theo key {%- endcomment -%}
{{ specs.cpu }}
{{ specs['screen_size'] }}
```

### Tham chiếu Resource (Reference)

```liquid
{%- comment -%} product_reference — trả về product object {%- endcomment -%}
{%- assign related = product.metafields.custom.related_product.value -%}
{%- if related -%}
  {%- render 'product-card', product: related -%}
{%- endif -%}

{%- comment -%} collection_reference {%- endcomment -%}
{%- assign featured_col = product.metafields.custom.featured_collection.value -%}
{%- for p in featured_col.products limit: 4 -%}
  {%- render 'product-card', product: p -%}
{%- endfor -%}

{%- comment -%} page_reference {%- endcomment -%}
{%- assign faq_page = product.metafields.custom.faq_page.value -%}
{{ faq_page.content }}

{%- comment -%} variant_reference {%- endcomment -%}
{%- assign gift_variant = product.metafields.custom.gift_variant.value -%}
{{ gift_variant.title }} — {{ gift_variant.price | money }}
```

### File Reference

```liquid
{%- comment -%} file_reference — ảnh {%- endcomment -%}
{%- assign size_chart = product.metafields.custom.size_chart_image.value -%}
{%- if size_chart -%}
  {{ size_chart | image_url: width: 800 | image_tag:
    loading: 'lazy',
    alt: 'Bảng size ' | append: product.title | escape
  }}
{%- endif -%}

{%- comment -%} file_reference — PDF {%- endcomment -%}
{%- assign manual = product.metafields.custom.manual_pdf.value -%}
{%- if manual -%}
  <a href="{{ manual.url }}" target="_blank">Tải tài liệu ({{ manual.media_type }})</a>
{%- endif -%}

{%- comment -%} file_reference — video {%- endcomment -%}
{%- assign video = product.metafields.custom.demo_video.value -%}
{%- if video -%}
  {{ video | video_tag: autoplay: false, controls: true, loading: 'lazy' }}
{%- endif -%}
```

## 3. Metafield kiểu List

```liquid
{%- comment -%} list.single_line_text_field {%- endcomment -%}
{%- assign features = product.metafields.custom.features.value -%}
{%- if features.size > 0 -%}
  <ul class="product-features">
    {%- for feature in features -%}
      <li>{{ feature }}</li>
    {%- endfor -%}
  </ul>
{%- endif -%}

{%- comment -%} list.product_reference {%- endcomment -%}
{%- assign related_products = product.metafields.custom.related_products.value -%}
{%- for related in related_products -%}
  {%- render 'product-card', product: related -%}
{%- endfor -%}

{%- comment -%} Kiểm tra độ dài list {%- endcomment -%}
{{ product.metafields.custom.features.value.size }} tính năng
```

## 4. Metaobjects

### Truy cập Metaobject từ Metafield

```liquid
{%- comment -%} metaobject_reference — từ metafield trỏ đến metaobject {%- endcomment -%}
{%- assign author = article.metafields.custom.author_profile.value -%}
{%- if author -%}
  <div class="author-card">
    {{ author.avatar.value | image_url: width: 200 | image_tag: loading: 'lazy' }}
    <h3>{{ author.name.value }}</h3>
    <p>{{ author.bio.value }}</p>
  </div>
{%- endif -%}

{%- comment -%} list.metaobject_reference — danh sách metaobject {%- endcomment -%}
{%- assign testimonials = product.metafields.custom.testimonials.value -%}
{%- for testimonial in testimonials -%}
  <blockquote class="testimonial">
    <p>{{ testimonial.content.value }}</p>
    <cite>{{ testimonial.author_name.value }}</cite>
    <span>{{ testimonial.rating.value.value }} ⭐</span>
  </blockquote>
{%- endfor -%}
```

### Metaobject trong Section Schema (Dynamic Sources)

```json
{
  "settings": [
    {
      "type": "metaobject",
      "id": "faq_item",
      "label": "FAQ Item",
      "resource": {
        "metaobject_definition": "faq"
      }
    },
    {
      "type": "metaobject_list",
      "id": "team_members",
      "label": "Thành viên",
      "resource": {
        "metaobject_definition": "team_member"
      }
    }
  ]
}
```

### Dynamic Sources trong Theme Editor

Merchant có thể kết nối metafield vào bất kỳ setting nào tương thích qua **Connect dynamic source** trong Theme Editor. Ví dụ:

- Setting `text` ← metafield `single_line_text_field`
- Setting `image_picker` ← metafield `file_reference` (image)
- Setting `url` ← metafield `url_reference`
- Setting `richtext` ← metafield `rich_text_field`

## 5. Metafield trên các Resource khác

```liquid
{%- comment -%} Shop metafields — dùng ở mọi trang {%- endcomment -%}
{{ shop.metafields.custom.announcement_text.value }}
{{ shop.metafields.custom.phone_number.value }}

{%- comment -%} Collection metafields {%- endcomment -%}
{{ collection.metafields.custom.banner_image.value | image_url: width: 1400 | image_tag }}

{%- comment -%} Article metafields {%- endcomment -%}
{{ article.metafields.custom.reading_time.value }} phút đọc

{%- comment -%} Page metafields {%- endcomment -%}
{{ page.metafields.custom.sidebar_content.value }}

{%- comment -%} Customer metafields (khi đã đăng nhập) {%- endcomment -%}
{%- if customer -%}
  {{ customer.metafields.custom.loyalty_points.value }} điểm
{%- endif -%}

{%- comment -%} Variant metafields {%- endcomment -%}
{%- for variant in product.variants -%}
  {{ variant.metafields.custom.material.value }}
{%- endfor -%}
```

## 6. Namespace chuẩn (`custom` vs namespace tuỳ chỉnh)

| Namespace | Mô tả | Khi nào dùng |
|---|---|---|
| `custom` | Namespace mặc định Shopify | Metafields tạo từ Shopify Admin |
| `global` | Namespace cũ (deprecated) | Không dùng nữa |
| `app--{id}` | Namespace của app | Metafields từ app bên thứ 3 |
| Tên riêng | Namespace tuỳ chỉnh | Tạo qua API |

```liquid
{%- comment -%} Namespace "custom" — tạo từ Admin {%- endcomment -%}
{{ product.metafields.custom.subtitle.value }}

{%- comment -%} Namespace riêng — tạo qua API {%- endcomment -%}
{{ product.metafields.my_fields.special_note.value }}
```

## Danh sách kiểm tra

- [ ] Luôn kiểm tra `!= blank` trước khi render metafield
- [ ] Dùng `.value` để lấy giá trị (không dùng trực tiếp metafield object)
- [ ] Escape output cho text: `{{ metafield.value | escape }}`
- [ ] Dùng `image_url` + `image_tag` cho file_reference kiểu ảnh
- [ ] Kiểm tra `.type` nếu cần xử lý logic khác nhau theo kiểu
- [ ] Kiểm tra `.list?` để biết metafield là list hay single
- [ ] Dùng `for...in` để duyệt list metafield
- [ ] Dùng dynamic sources khi có thể (linh hoạt cho merchant)
