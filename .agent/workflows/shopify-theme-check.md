---
description: Kiểm tra và xác thực code theme bằng Shopify Theme Check
---

# Kiểm Tra Theme (Theme Check)

## Chạy Theme Check

// turbo
1. Chạy kiểm tra toàn bộ theme:
```
shopify theme check
```

## Phân loại lỗi thường gặp

### Lỗi nghiêm trọng

- **MissingTemplate**: Thiếu file template bắt buộc
- **LiquidTag**: Cú pháp Liquid không hợp lệ
- **DeprecatedTag**: Dùng tag đã bị loại bỏ như `{% include %}`
- **MissingSchema**: Section thiếu block `{% schema %}`
- **JSONSyntaxError**: JSON không hợp lệ trong template hoặc settings

### Hiệu suất

- **RemoteAsset**: Tải asset từ CDN bên ngoài (nên dùng `asset_url`)
- **ImgWidthAndHeight**: Thiếu width/height trên `<img>` (gây CLS)
- **AssetSizeCSS**: File CSS quá lớn (>100KB)
- **AssetSizeJS**: File JS quá lớn (>100KB)
- **ParserBlockingScript**: Script chặn render trang
- **AssetUrlFilters**: Không dùng đúng filter URL cho asset

### Thực hành tốt

- **DeprecatedFilter**: Dùng filter Liquid đã bị loại bỏ
- **DefaultLocale**: Thiếu file bản dịch mặc định
- **TranslationKeyExists**: Không tìm thấy key dịch trong file locale
- **RequiredLayoutThemeObject**: `theme.liquid` thiếu object bắt buộc
- **TemplateLength**: Template vượt quá số dòng khuyến nghị

## Cách sửa các lỗi thường gặp

### Thay `{% include %}` bằng `{% render %}`

```liquid
{%- comment -%} ❌ Đã bị loại bỏ {%- endcomment -%}
{% include 'ten-snippet' %}

{%- comment -%} ✅ Đúng chuẩn {%- endcomment -%}
{% render 'ten-snippet', param: value %}
```

### Asset bên ngoài → Asset nội bộ

```liquid
{%- comment -%} ❌ Tải từ bên ngoài {%- endcomment -%}
<link href="https://cdn.example.com/style.css" rel="stylesheet">

{%- comment -%} ✅ Dùng asset nội bộ {%- endcomment -%}
{{ 'style.css' | asset_url | stylesheet_tag }}
```

### Kích thước ảnh

```liquid
{%- comment -%} ❌ Thiếu kích thước {%- endcomment -%}
<img src="{{ image | image_url }}">

{%- comment -%} ✅ Có kích thước đầy đủ {%- endcomment -%}
<img
  src="{{ image | image_url: width: 800 }}"
  width="{{ image.width }}"
  height="{{ image.height }}"
  loading="lazy"
  alt="{{ image.alt | escape }}"
>
```

## Cấu hình tuỳ chỉnh

Tạo file `.theme-check.yml` ở thư mục gốc theme:

```yaml
# .theme-check.yml
extends: :theme_app_extension

TemplateLength:
  enabled: true
  max_length: 600

AssetSizeCSS:
  enabled: true
  threshold_in_bytes: 150000

AssetSizeJavaScript:
  enabled: true
  threshold_in_bytes: 100000
```

## Tự động sửa lỗi

// turbo
2. Tự động sửa các lỗi có thể sửa:
```
shopify theme check --auto-correct
```
