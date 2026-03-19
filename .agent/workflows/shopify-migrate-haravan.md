---
description: Chuyển đổi theme Haravan sang định dạng Shopify 2.0 Online Store
---

# Chuyển Đổi Theme Haravan Sang Shopify 2.0

## Khác biệt chính: Haravan vs Shopify

| Đặc điểm | Haravan | Shopify 2.0 |
| --- | --- | --- |
| **Cấu hình** | `settings.html` (form HTML) | `settings_schema.json` (JSON) |
| **Template** | File `.liquid` trực tiếp | File `.json` tham chiếu section |
| **Section** | Không bắt buộc | Bắt buộc cho Theme Editor |
| **Include** | `{% include %}` hỗ trợ | `{% render %}` (include đã bị loại bỏ) |
| **Partial** | Chỉ qua snippet | Section + Snippet |
| **Đa ngôn ngữ** | Chỉ tiếng Việt | Nhiều ngôn ngữ (`locales/*.json`) |
| **API** | Haravan API | Shopify Storefront/Admin API |
| **Asset** | `{{ 'file' \| asset_url }}` | Tương tự, thêm filter `image_url` |
| **CDN** | Haravan CDN | Shopify CDN (tự động WebP/AVIF) |
| **Theme Editor** | Tuỳ chỉnh hạn chế | Kéo thả section đầy đủ |
| **Metafield** | Hạn chế | Hỗ trợ đầy đủ với definitions |

## Các giai đoạn chuyển đổi

### Giai đoạn 1: Thiết lập cấu trúc

1. Tạo cấu trúc thư mục Shopify 2.0:

```
mkdir sections locales
mkdir templates/customers
```

2. Tạo `config/settings_schema.json` từ `settings.html`:
   - Chuyển mỗi `<fieldset>` → nhóm settings JSON
   - Chuyển mỗi `<input>` → đối tượng setting JSON
   - Ánh xạ kiểu input Haravan sang kiểu setting Shopify

3. Tạo `locales/vi.default.json` cho bản dịch tiếng Việt:
   - Trích xuất toàn bộ text tiếng Việt cứng trong code
   - Tạo key dịch tương ứng

### Giai đoạn 2: Chuyển đổi Template

4. Chuyển mỗi template `.liquid` sang JSON `.json`:
   - `templates/index.liquid` → `templates/index.json` + `sections/main-index.liquid`
   - `templates/product.liquid` → `templates/product.json` + `sections/main-product.liquid`
   - Tương tự cho các template khác

5. Di chuyển logic template vào `sections/main-<loai>.liquid`:
   - Thêm block `{% schema %}` vào mỗi section
   - Chuyển tham chiếu `settings.xxx` sang `section.settings.xxx` khi phù hợp
   - Giữ `settings.xxx` cho cài đặt theme toàn cục

### Giai đoạn 3: Hiện đại hoá code

6. Thay toàn bộ `{% include %}` bằng `{% render %}`:
   - Truyền biến cần thiết một cách rõ ràng
   - Ví dụ: `{% include 'product-card' %}` → `{% render 'card-product', product: product %}`

7. Cập nhật `content_for_header`:
   - Xoá đoạn hack trailing-slash của Haravan
   - `content_for_header` của Shopify đã chuẩn

8. Chuyển `img_url` sang `image_url`:

```liquid
{%- comment -%} ❌ Cũ {%- endcomment -%}
{{ product.featured_image | img_url: '300x300' }}

{%- comment -%} ✅ Mới {%- endcomment -%}
{{ product.featured_image | image_url: width: 300 }}
```

9. Cập nhật tham chiếu `asset_url` nếu cần

### Giai đoạn 4: Layout và Điều hướng

10. Cập nhật `layout/theme.liquid`:
    - Thêm section groups cho header/footer
    - Cập nhật `content_for_header` (xoá hack Haravan)
    - Thêm preconnect link phù hợp

11. Tạo header/footer dạng section:
    - `sections/header.liquid` với schema
    - `sections/footer.liquid` với schema
    - Hoặc dùng section groups: `sections/header-group.json`

### Giai đoạn 5: Chuyển đổi Settings

12. Chuyển `settings.html` → `settings_schema.json`:

```json
[
  {
    "name": "theme_info",
    "theme_name": "Tên Theme",
    "theme_version": "1.0.0",
    "theme_author": "Tác giả",
    "theme_documentation_url": "https://...",
    "theme_support_url": "https://..."
  },
  {
    "name": "Màu sắc",
    "settings": [
      {
        "type": "color",
        "id": "color_primary",
        "label": "Màu chủ đạo",
        "default": "#FF3300"
      }
    ]
  }
]
```

13. Cập nhật `settings_data.json`:
    - Ánh xạ key cài đặt Haravan sang key Shopify mới
    - Xoá các cài đặt riêng của Haravan

### Giai đoạn 6: Kiểm tra và Xác nhận

// turbo
14. Chạy kiểm tra theme:
```
shopify theme check
```

15. Test trong Shopify Theme Editor:
    - Xác nhận tất cả section hiển thị đúng
    - Test tất cả cài đặt hoạt động
    - Kiểm tra responsive trên mọi kích thước màn hình

16. Kiểm tra toàn bộ luồng tài khoản khách hàng:
    - Đăng nhập → Đăng ký → Tài khoản → Đơn hàng → Địa chỉ

## Lưu ý thường gặp khi chuyển đổi

- Haravan dùng `product.selected_variant` khác với Shopify
- Endpoint API giỏ hàng khác nhau giữa hai nền tảng
- API/route tài khoản khách hàng có thể có đường dẫn khác
- Action của form cần cập nhật (route Haravan vs Shopify)
- Tích hợp phương thức thanh toán khác nhau
- Tìm kiếm hoạt động khác (Shopify có API tìm kiếm dự đoán - predictive search)
