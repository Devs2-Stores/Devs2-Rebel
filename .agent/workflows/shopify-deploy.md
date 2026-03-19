---
description: Triển khai theme lên Shopify store (phát triển, staging, hoặc production)
---

# Triển Khai Theme Shopify

## Kiểm tra trước khi triển khai

// turbo
1. Chạy kiểm tra theme để xác nhận hợp lệ:
```
shopify theme check
```

2. Xem lại các thay đổi:
```
git diff --stat
```

## Các phương thức triển khai

### Bản xem trước phát triển (Khuyến nghị khi test)

// turbo
3. Đẩy lên theme chưa công bố (không ảnh hưởng store):
```
shopify theme push --unpublished --store <ten-store>.myshopify.com
```
Lệnh này tạo theme xem trước mà không ảnh hưởng đến store đang hoạt động.

### Đẩy lên theme cụ thể

4. Liệt kê tất cả theme để tìm ID:
```
shopify theme list --store <ten-store>.myshopify.com
```

5. Đẩy code lên theme theo ID:
```
shopify theme push --theme <theme-id> --store <ten-store>.myshopify.com
```

### Đẩy lên theme đang hoạt động (⚠️ CẨN THẬN)

6. Đẩy trực tiếp lên theme đang được công bố:
```
shopify theme push --live --store <ten-store>.myshopify.com
```

> ⚠️ CẢNH BÁO: Lệnh này ảnh hưởng ngay lập tức đến store đang hoạt động. Luôn test trên theme phát triển trước!

### Chỉ đẩy các file cụ thể

7. Đẩy chỉ những file đã thay đổi:
```
shopify theme push --only "sections/*" --only "snippets/*" --store <ten-store>.myshopify.com
```

### Bỏ qua file cụ thể

8. Đẩy nhưng bỏ qua config (giữ nguyên cài đặt store):
```
shopify theme push --ignore "config/settings_data.json" --store <ten-store>.myshopify.com
```

## Tạo file .shopifyignore

Tạo file `.shopifyignore` ở thư mục gốc theme để loại trừ file khi triển khai:

```
# .shopifyignore
config/settings_data.json
*.md
.git/
.github/
node_modules/
.agent/
```

## Sau khi triển khai

// turbo
9. Xác nhận triển khai bằng cách mở xem trước theme:
```
shopify theme open --store <ten-store>.myshopify.com
```

## Hoàn tác (Rollback)

Nếu có sự cố:

1. Vào Shopify Admin → Online Store → Themes
2. Tìm phiên bản theme trước đó
3. Nhấn "Publish" để hoàn tác

Hoặc dùng CLI:

```
shopify theme publish --theme <theme-id-truoc> --store <ten-store>.myshopify.com
```
