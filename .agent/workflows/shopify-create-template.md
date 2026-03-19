---
description: Tạo JSON template Shopify 2.0 với tham chiếu section chuẩn
---

# Tạo JSON Template Shopify 2.0

## Khái niệm chính: JSON Template

Trong Shopify 2.0, template là **file JSON** tham chiếu đến các section.
Điều này cho phép Theme Editor thêm/xoá/sắp xếp lại section trên bất kỳ trang nào.

## Vị trí lưu Template

- `templates/*.json` — Template các trang
- `templates/customers/*.json` — Template tài khoản khách hàng

## Các loại Template có sẵn

| Template | Tên file | Đối tượng Shopify |
| --- | --- | --- |
| Trang chủ | `templates/index.json` | Không có |
| Sản phẩm | `templates/product.json` | `product` |
| Bộ sưu tập | `templates/collection.json` | `collection` |
| Danh sách BST | `templates/list-collections.json` | `collections` |
| Blog | `templates/blog.json` | `blog` |
| Bài viết | `templates/article.json` | `article` |
| Trang tĩnh | `templates/page.json` | `page` |
| Giỏ hàng | `templates/cart.json` | `cart` |
| Tìm kiếm | `templates/search.json` | `search` |
| Trang 404 | `templates/404.json` | Không có |
| Mật khẩu | `templates/password.json` | Không có |
| Thẻ quà tặng | `templates/gift_card.liquid` | `gift_card` (vẫn là Liquid!) |
| Đăng nhập | `templates/customers/login.json` | Không có |
| Đăng ký | `templates/customers/register.json` | Không có |
| Tài khoản | `templates/customers/account.json` | `customer` |
| Đơn hàng | `templates/customers/order.json` | `order` |
| Địa chỉ | `templates/customers/addresses.json` | `customer` |
| Kích hoạt TK | `templates/customers/activate_account.json` | Không có |
| Đặt lại MK | `templates/customers/reset_password.json` | Không có |

## Cấu trúc JSON Template

```json
{
  "name": "Tên hiển thị Template",
  "layout": "theme",
  "sections": {
    "main": {
      "type": "main-product",
      "settings": {
        "show_vendor": true
      }
    },
    "de-xuat": {
      "type": "product-recommendations",
      "settings": {
        "heading": "Có thể bạn cũng thích"
      }
    }
  },
  "order": [
    "main",
    "de-xuat"
  ]
}
```

### Thuộc tính `wrapper` (Bọc HTML quanh sections)

Thêm tag HTML bao quanh toàn bộ section trong template:

```json
{
  "wrapper": "div.collection-wrapper",
  "sections": { ... },
  "order": [ ... ]
}
```

Tag được hỗ trợ: `<div>`, `<main>`, `<section>`

## Giới hạn quan trọng

- Một theme tối đa **1.000 JSON template** (bao gồm alternate)
- Template chỉ có thể là `.json` HOẶC `.liquid`, không được cả hai (ví dụ: có `product.liquid` rồi thì không tạo `product.json` được)
- Section **phải có preset** trong schema mới cho phép merchant thêm từ Theme Editor. Section không có preset chỉ thêm thủ công trong JSON

## Template thay thế (Alternate Templates)

Tạo template thay thế cho các bố cục trang khác nhau:

- `templates/product.ten-khac.json`
- `templates/page.contact.json`
- `templates/collection.sale.json`

Các template này hiện trong dropdown chọn template ở Shopify admin.

## Section Groups (Nhóm Header/Footer)

Trong `layout/theme.liquid`, sử dụng section groups:

```liquid
{% sections 'header-group' %}
{{ content_for_layout }}
{% sections 'footer-group' %}
```

File section group đặt trong `sections/` với cấu hình đặc biệt:

```json
// sections/header-group.json
{
  "type": "header-group",
  "name": "Nhóm Header",
  "sections": {
    "announcement-bar": { "type": "announcement-bar" },
    "header": { "type": "header" }
  },
  "order": ["announcement-bar", "header"]
}
```

## Các bước thực hiện

1. Tạo file JSON template trong thư mục `templates/`
2. Tạo section `main-<loai>.liquid` tương ứng trong `sections/`
3. Section "main" chứa logic chính của template
4. Thêm các section tuỳ chọn với preset để merchant linh hoạt tuỳ chỉnh trong Theme Editor
5. Đặt mảng `"order"` để xác định thứ tự section mặc định
