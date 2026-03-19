---
description: Hướng dẫn đọc và sử dụng các workflow Shopify theo thứ tự
---

# 📚 Hướng Dẫn Sử Dụng Workflows Shopify

> Gõ `/README` bất kỳ lúc nào để xem lại hướng dẫn này.

## Đọc từ đâu trước?

```
① Quy chuẩn ──→ ② Tra cứu ──→ ③ Khởi tạo ──→ ④ Template ──→ ⑤ Section ──→ ⑥ Snippet ──→ ⑦ Kiểm tra ──→ ⑧ Tối ưu ──→ ⑨ Deploy
                                     ↑
                              ④* Migrate Haravan (nếu cần)
```

**Workflow tính năng** (dùng khi xây dựng chức năng cụ thể):

```
⑩ Cart AJAX ──→ ⑪ Predictive Search ──→ ⑫ Metafields ──→ ⑬ Markets (i18n)
```

## Lộ trình chi tiết

### 🟢 Bước 1 — Học quy chuẩn (đọc 1 lần, tra lại khi cần)

| # | Lệnh | Nội dung | Khi nào đọc |
|---|---|---|---|
| ① | `/shopify-coding-standards` | Đặt tên file, cú pháp Liquid, CSS/JS, SEO, i18n | **Đọc đầu tiên** — đây là luật chơi |
| ② | `/shopify-liquid-reference` | Tra cứu object, filter, tag, Ajax API | **Giữ bên cạnh** khi code |

### 🔵 Bước 2 — Bắt đầu dự án

| # | Lệnh | Nội dung | Khi nào đọc |
|---|---|---|---|
| ③ | `/shopify-init` | Cài CLI, tạo theme, kết nối store | **Khi bắt đầu** dự án mới |
| ④* | `/shopify-migrate-haravan` | Chuyển đổi theme Haravan → Shopify 2.0 | **Chỉ khi** cần migrate |

### 🟡 Bước 3 — Code (đọc khi xây dựng)

| # | Lệnh | Nội dung | Khi nào đọc |
|---|---|---|---|
| ④ | `/shopify-create-template` | Tạo JSON template — khung xương trang | **Đầu tiên** khi tạo trang mới |
| ⑤ | `/shopify-create-section` | Tạo section — nội dung chính | **Tiếp theo** sau template |
| ⑥ | `/shopify-create-snippet` | Tạo snippet — component dùng chung | **Khi cần** tách code tái sử dụng |

### 🟣 Bước 3b — Tính năng nâng cao (đọc khi cần)

| # | Lệnh | Nội dung | Khi nào đọc |
|---|---|---|---|
| ⑩ | `/shopify-cart-ajax` | Cart API, Section Rendering, error handling | **Khi xây dựng** giỏ hàng AJAX |
| ⑪ | `/shopify-predictive-search` | Tìm kiếm dự đoán, Web Component, accessibility | **Khi xây dựng** tính năng tìm kiếm |
| ⑫ | `/shopify-metafields` | Metafields, Metaobjects, dynamic sources | **Khi dùng** dữ liệu tuỳ chỉnh |
| ⑬ | `/shopify-markets` | Đa ngôn ngữ, đa tiền tệ, locale-aware URLs | **Khi cần** hỗ trợ quốc tế |

### 🟠 Bước 4 — Kiểm tra & tối ưu

| # | Lệnh | Nội dung | Khi nào đọc |
|---|---|---|---|
| ⑦ | `/shopify-theme-check` | Lint, bắt lỗi, auto-fix | **Trước khi** deploy |
| ⑧ | `/shopify-performance` | LCP, CLS, INP, image_tag, preload_tag | **Sau khi** code xong, trước khi live |

### 🔴 Bước 5 — Triển khai

| # | Lệnh | Nội dung | Khi nào đọc |
|---|---|---|---|
| ⑨ | `/shopify-deploy` | Push code, xem trước, rollback | **Khi sẵn sàng** đưa lên store |

## Mẹo sử dụng nhanh

- **Tạo trang mới?** → `/shopify-create-template` → `/shopify-create-section`
- **Tách component?** → `/shopify-create-snippet`
- **Quên cú pháp?** → `/shopify-liquid-reference`
- **Giỏ hàng AJAX?** → `/shopify-cart-ajax`
- **Tìm kiếm?** → `/shopify-predictive-search`
- **Dữ liệu tuỳ chỉnh?** → `/shopify-metafields`
- **Đa ngôn ngữ?** → `/shopify-markets`
- **Code xong rồi?** → `/shopify-theme-check` → `/shopify-performance` → `/shopify-deploy`
- **Migrate Haravan?** → `/shopify-migrate-haravan`
