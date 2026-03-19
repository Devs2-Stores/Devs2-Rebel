---
description: Khởi tạo dự án Shopify 2.0 mới hoặc kết nối với store hiện có
---

# Khởi Tạo Dự Án Shopify Theme

## Kiểm tra yêu cầu

// turbo
1. Kiểm tra Shopify CLI đã cài chưa:
```
shopify version
```
Nếu chưa có, cài đặt qua npm:
```
npm install -g @shopify/cli @shopify/theme
```

## Lựa chọn A: Tạo theme mới từ đầu

// turbo
2. Tạo theme Shopify 2.0 dựa trên Dawn (theme gốc của Shopify):
```
shopify theme init <ten-theme>
```
Lệnh này sẽ clone Dawn theme làm nền tảng ban đầu.

## Lựa chọn B: Kết nối với store hiện có

3. Đăng nhập vào Shopify store:
```
shopify auth login --store <ten-store>.myshopify.com
```

4. Kéo theme hiện tại về máy:
```
shopify theme pull --store <ten-store>.myshopify.com
```

## Lựa chọn C: Chạy server phát triển

// turbo
5. Khởi chạy server dev với hot reload:
```
shopify theme dev --store <ten-store>.myshopify.com
```

## Cấu trúc thư mục bắt buộc của Shopify 2.0

Sau khi khởi tạo, kiểm tra cấu trúc sau đã tồn tại:
```
thu-muc-goc/
├── assets/           # CSS, JS, hình ảnh, font chữ
├── config/           # settings_schema.json, settings_data.json
├── layout/           # theme.liquid, password.liquid
├── locales/          # en.default.json, vi.json (bản dịch)
├── sections/         # Các section có {% schema %} — tái sử dụng được
├── snippets/         # Các đoạn Liquid dùng chung
├── templates/        # JSON template (chuẩn Shopify 2.0)
│   └── customers/    # Template tài khoản khách hàng
└── .shopify/         # Cấu hình CLI (tự tạo)
```

## Lưu ý quan trọng

- Shopify 2.0 dùng **JSON template** (không phải .liquid template)
- Toàn bộ nội dung tuỳ chỉnh nằm trong **sections**
- Dùng `{% render %}` thay vì `{% include %}` (đã bị loại bỏ)
- Section dùng `{% schema %}` để tích hợp với Theme Editor
