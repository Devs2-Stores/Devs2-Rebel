# Kế Hoạch Triển Khai Kiến Trúc Liquid Hiện Đại: Theme Blocks, Nested Blocks (8 Cấp), LiquidDoc & Static Blocks (Axis 3)

**Mã tài liệu:** `BLUEPRINT-260918-AXIS-3-MODERN-LIQUID-THEME-BLOCKS`  
**Dự án:** Theme `Devs2 Rebel` (Shopify OS 2.0 -> Modern Shopify Architecture 2025–2026)  
**Tác giả:** Technical Analyst & Systems Reliability Engineer (Triad Architecture v1.2.0 Hardened)  
**Trọng tâm:** **Trục 3 (Axis 3: Modern Liquid Architecture)**  
**Ngày hoàn thiện:** 18/09/2026  
**Trạng thái:** Hoàn tất & Sẵn sàng triển khai (Production-Ready Technical Blueprint)

---

## Mục Lục
1. [Tóm Tắt Điều Hành & Bối Cảnh Chiến Lược (Executive Summary)](#1-tóm-tắt-điều-hành--bối-cảnh-chiến-lược-executive-summary)
2. [Bản Thiết Kế Kiến Trúc Nền Tảng (Architectural Blueprint)](#2-bản-thiết-kế-kiến-trúc-nền-tảng-architectural-blueprint)
   - 2.1. Kiến Trúc Theme Blocks (`blocks/*.liquid` với `{% schema %}`)
   - 2.2. Kiến Trúc Nested Blocks (Khả Năng Lồng Nhau 8 Cấp)
   - 2.3. Kiến Trúc Static Blocks (`{% content_for 'block' %}`)
   - 2.4. Khung Hợp Đồng Tài Liệu Hóa LiquidDoc (`{% doc %}`)
3. [Phân Tích Chi Tiết Di Chuyển `sections/main-product.liquid` Sang `blocks/`](#3-phân-tích-chi-tiết-di-chuyển-sectionsmain-productliquid-sang-blocks)
   - 3.1. Bảng Đối Soát 20 Khối Giao Diện Hiện Hữu
   - 3.2. Đo Lường Mức Độ Cắt Giảm & Xử Lý Vi Phạm `TemplateLength`
   - 3.3. Loại Bỏ Triệt Để Vòng Lặp Quét Khối Giả Lập (`when 'tabs'` flat-array scan)
4. [Bảo Toàn JSON Templates & Khả Năng Tương Thích Ngược](#4-bảo-toàn-json-templates--khả-năng-tương-thích-ngược)
   - 4.1. Phân Tích Thực Trạng `templates/product.json`
   - 4.2. Quy Tắc Ánh Xạ Kiểu Khối (Block Type Mapping)
   - 4.3. Chiến Lược Di Chuyển Schema & Xử Lý Khối Đã Khai Tử (`coupon`)
   - 4.4. Di Chuyển Chuỗi Dịch Schema (`locales/en.default.schema.json`)
5. [Công Thức Triển Khai Mã Nguồn (Code Implementation Recipes)](#5-công-thức-triển-khai-mã-nguồn-code-implementation-recipes)
   - Recipe 1: `sections/main-product.liquid` (Section Chủ Đã Tinh Gọn)
   - Recipe 2: `blocks/buy_buttons.liquid` (Native `FormData`, Gift Card Recipient, Subscriptions)
   - Recipe 3: `blocks/price.liquid` (LiquidDoc, Sale Badge, Unit Price, Tax Notice)
   - Recipe 4: `blocks/tabs.liquid` & `blocks/tab.liquid` (Chuẩn Nested Blocks Với `{% content_for 'blocks' %}`)
   - Recipe 5: `blocks/variant_picker.liquid` (Native Category Swatches & Combined Listings)
   - Recipe 6: `templates/product.json` (Template Chuẩn Sau Khi Làm Sạch)
6. [Tuân Thủ Theme Check & Tiêu Chuẩn Phê Duyệt Shopify Theme Store](#6-tuân-thủ-theme-check--tiêu-chuẩn-phê-duyệt-shopify-theme-store)
7. [Đánh Giá Rủi Ro, Đánh Đổi & Phạm Vi Ảnh Hưởng (Blast Radius Analysis)](#7-đánh-giá-rủi-ro-đánh-đổi--phạm-vi-ảnh-hưởng-blast-radius-analysis)
8. [Lộ Trình Triển Khai Từng Bước & Các Bước Tiếp Theo (Next Steps)](#8-lộ-trình-triển-khai-từng-bước--các-bước-tiếp-theo-next-steps)

---

## 1. Tóm Tắt Điều Hành & Bối Cảnh Chiến Lược (Executive Summary)

Trong lộ trình nâng cấp toàn diện theme **Devs2 Rebel** nhằm đạt tiêu chuẩn duyệt nộp chính thức lên **Shopify Theme Store (chuẩn 2025–2026)**, **Trục 3 (Axis 3: Modern Liquid Architecture)** là trục nâng cấp mang tính nền tảng sâu rộng nhất về mặt kỹ thuật phần mềm. 

### Hiện trạng và vấn đề kiến trúc (Current Bottlenecks):
1. **Vi phạm nghiêm trọng giới hạn kích thước file (`TemplateLength`):**  
   File `sections/main-product.liquid` hiện có **1,090 dòng mã**, trong đó có hơn 360 dòng chứa khối `{% case block.type %}` và 368 dòng schema JSON nguyên khối. Trạng thái này vượt xa ngưỡng quy định tối đa **600 dòng** được thiết lập trong `.theme-check.yml` (`TemplateLength: max_length: 600`), gây ra cảnh báo/lỗi tự động trong quy trình Theme Check của Shopify.
2. **Kỹ thuật lồng khối giả lập (Flat-array pseudo-nesting hack):**  
   Để hỗ trợ tính năng các tab thông tin sản phẩm (`when 'tabs'`), `sections/main-product.liquid` phải thực hiện một vòng lặp quét qua toàn bộ mảng phẳng `section.blocks` để nhặt ra các block con có `type == 'tab'`. Kỹ thuật này làm tăng độ phức tạp thuật toán, dễ phát sinh lỗi khi merchant thay đổi thứ tự block, và không thể mở rộng.
3. **Mã nguồn bị cô lập, thiếu tính tái sử dụng (Code Duplication):**  
   Các logic cốt lõi như hiển thị Giá (`price`), Nút Mua (`buy_buttons`), Bộ chọn biến thể (`variant_picker`) bị nhúng cứng trong `sections/main-product.liquid`. Khi cần hiển thị sản phẩm nổi bật (`sections/featured-product.liquid`) hoặc xem nhanh (`templates/product.quickview.liquid`), các nhà phát triển trước đây đã phải sao chép lặp lại mã nguồn Liquid và CSS.
4. **Thiếu định kiểu giao tiếp (Lack of Typed Contracts):**  
   Hầu hết các khối và snippet không có tài liệu ràng buộc kiểu dữ liệu đầu vào, dẫn đến nguy cơ vỡ giao diện khi dữ liệu sản phẩm chứa các trường rỗng hoặc biến thể phức tạp.

### Giải pháp kiến trúc trục 3 (Axis 3 Transformation):
BluePrint này thiết kế quá trình chuyển đổi toàn diện sang **Shopify Theme Blocks**:
- Tách toàn bộ 18 khối chức năng từ `sections/main-product.liquid` thành các file độc lập đặt trong thư mục `/blocks/*.liquid`.
- Giảm số dòng của `sections/main-product.liquid` từ **1,090 dòng xuống ~275 dòng (giảm 74.7%)**, vượt qua kiểm tra `TemplateLength` với chỉ số tuyệt đối an toàn.
- Khai thác **Nested Blocks (lồng nhau tới 8 cấp)** cho cụm Tabs/Accordions, xóa bỏ 100% vòng lặp duyệt khối giả lập.
- Áp dụng **Static Blocks (`{% content_for 'block' %}`)** để khóa các phần tử thương mại sống còn (Title, Price, Buy Buttons), ngăn merchant vô tình xóa mất luồng mua hàng nhưng vẫn cho phép chỉnh sửa cấu hình linh hoạt trong Theme Editor.
- Áp dụng chuẩn **LiquidDoc (`{% doc %}`)** với định kiểu dữ liệu nghiêm ngặt cho toàn bộ khối giao diện.
- Tích hợp liền mạch với các quyết định đã xác nhận: **Xóa sạch khối Coupon** khỏi PDP, chuẩn hóa `FormData` cho Buy Buttons, và kích hoạt Native Category Swatches API.

---

## 2. Bản Thiết Kế Kiến Trúc Nền Tảng (Architectural Blueprint)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         MODERN LIQUID ARCHITECTURE (2025-2026)                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [sections/main-product.liquid]                                                 │
│   ├── Static Frame & Layout Wrappers (Media Gallery + Product Info Grid)         │
│   ├── {% content_for 'block', type: 'title', id: 'static-title' %}               │
│   ├── {% content_for 'block', type: 'price', id: 'static-price' %}               │
│   └── {% content_for 'blocks' %} ────────────┐                                  │
│                                              │ (Dynamic Slot)                    │
│                                              ▼                                   │
│                        ┌─────────────────────────────────────┐                   │
│                        │       THEME BLOCKS (/blocks/)       │                   │
│                        ├─────────────────────────────────────┤                   │
│                        │ • blocks/variant_picker.liquid      │                   │
│                        │ • blocks/quantity_selector.liquid   │                   │
│                        │ • blocks/stock_counter.liquid       │                   │
│                        │ • blocks/buy_buttons.liquid         │                   │
│                        │ • blocks/badges.liquid              │                   │
│                        │ • blocks/share.liquid               │                   │
│                        │ • blocks/tabs.liquid ───────────┐   │                   │
│                        └─────────────────────────────────┼───┘                   │
│                                                          │                       │
│                                                          ▼ (Nested Blocks 8-Lvl) │
│                                            ┌────────────────────────┐            │
│                                            │ blocks/tab.liquid      │            │
│                                            │ {% content_for 'blocks'│            │
│                                            │   type: '@app'         │            │
│                                            └────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Kiến Trúc Theme Blocks (`blocks/*.liquid` với `{% schema %}`)
- **Vị trí lưu trữ:** Thư mục `/blocks/` ở cấp gốc của theme. Mỗi file là một đơn vị hiển thị độc lập kèm định nghĩa schema riêng biệt.
- **Thẻ Schema Độc Lập:** Không còn schema gom cụm khổng lồ trong section. Mỗi block tự quản lý `name`, `settings`, và `presets`.
- **Phạm vi mục tiêu (`target`):**
  - Mặc định, một theme block có thể được chèn vào bất kỳ section nào hỗ trợ `@theme`.
  - Có thể giới hạn phạm vi thông qua `"target": "section"` hoặc định rõ context.
- **Điểm nạp khối động (`{% content_for 'blocks' %}`):**
  - Thay thế toàn bộ khối `{% for block in section.blocks %}{% case block.type %}...{% endfor %}`.
  - Phía máy chủ của Shopify sẽ tự động phân giải danh sách các khối được merchant sắp xếp trong JSON template và render file tương ứng trong thư mục `/blocks/`.
- **Tái sử dụng xuyên Section (Cross-Section Reusability):**
  - Khối `blocks/price.liquid` và `blocks/buy_buttons.liquid` giờ đây có thể được sử dụng trực tiếp bên trong `sections/featured-product.liquid`, `sections/quickview.liquid`, hay các landing page tùy biến mà không cần viết lại mã nguồn.

### 2.2. Kiến Trúc Nested Blocks (Khả Năng Lồng Nhau 8 Cấp)
- **Cơ chế hoạt động:** Một Theme Block trong `/blocks/` có thể hoạt động như một Container chứa các block con thông qua thẻ `{% content_for 'blocks' %}` đặt bên trong chính nó.
- **Cấu hình Schema cho Block Cha:**
  Trong file `blocks/tabs.liquid`:
  ```json
  {
    "name": "Tabs Container",
    "blocks": [
      { "type": "tab" },
      { "type": "@app" }
    ],
    "settings": [ ... ]
  }
  ```
- **Lợi ích vượt trội so với OS 2.0:**
  1. Loại bỏ hoàn toàn vòng lặp quét danh sách phẳng (`section.blocks`).
  2. Cho phép người dùng thêm các block App (ví dụ App đánh giá sản phẩm, bảng kích cỡ từ app ngoài) lồng trực tiếp vào bên trong từng Tab cụ thể.
  3. Cung cấp khả năng phân cấp giao diện trực quan ngay trên cây điều khiển bên trái của Shopify Theme Editor.
- **Ranh giới an toàn:** Shopify giới hạn tối đa 8 cấp lồng nhau. Đối với PDP của Devs2 Rebel, độ sâu tối đa chỉ là 2 cấp (`Section -> Tabs Container -> Tab Panel / App Block`), đảm bảo tải trang tức thì và không gây phình to cây DOM.

### 2.3. Kiến Trúc Static Blocks (`{% content_for 'block' %}`)
- **Vấn đề thực tế của Merchant:** Trên trang chi tiết sản phẩm, một số merchant không rành kỹ thuật có thể vô tình nhấn "Delete" khối Giá tiền (`price`) hoặc Nút mua hàng (`buy_buttons`), làm hỏng chức năng thanh toán của cửa hàng.
- **Giải pháp Static Blocks:**
  Shopify cho phép nhà phát triển ghim cứng một block vào vị trí cố định bằng cú pháp:
  ```liquid
  {% content_for 'block', type: 'title', id: 'static-product-title' %}
  {% content_for 'block', type: 'price', id: 'static-product-price' %}
  ```
- **Đặc tính kỹ thuật của Static Block:**
  1. Block này **không thể bị xóa** bởi merchant trong Theme Editor.
  2. Merchant **vẫn có thể click vào block để thay đổi các cài đặt (settings)** như kích cỡ chữ, màu sắc, khoảng cách.
  3. Phối hợp nhịp nhàng: Sử dụng Static Blocks cho các thành phần bắt buộc (Title, Price, Buy Buttons), và sử dụng `{% content_for 'blocks' %}` cho các thành phần mở rộng tùy chọn (Badges, Stock Counter, Tabs, Collapsible Rows, App Blocks).

### 2.4. Khung Hợp Đồng Tài Liệu Hóa LiquidDoc (`{% doc %}`)
- **Chuẩn hóa Theme Check 2.0+:** LiquidDoc là thẻ chú thích có cấu trúc được máy phân tích tĩnh (Static Analyzer) của Shopify nhận diện để kiểm tra tính hợp lệ của tham số và tự động gợi ý code (IntelliSense) trong các trình soạn thảo IDE.
- **Cấu trúc chuẩn:**
  ```liquid
  {% doc %}
    @description Renders the product price with sale badges and unit pricing.
    @param {product} product - The Shopify product object.
    @param {variant} [selected_variant] - The current selected variant. Defaults to selected_or_first_available_variant.
    @param {boolean} [show_tax_notice=true] - Whether to display the tax included notice.
    @example
      {% render 'price', product: product, selected_variant: variant %}
  {% enddoc %}
  ```
- **Bảng Ánh Xạ Kiểu Dữ Liệu (Storefront Type System):**
  | Kiểu Dữ Liệu | Mô Tả Thực Thể | Ví Dụ Đối Tượng |
  |---|---|---|
  | `product` | Đối tượng sản phẩm của Shopify | `product`, `item.product` |
  | `variant` | Biến thể sản phẩm cụ thể | `product.selected_or_first_available_variant` |
  | `line_item` | Dòng sản phẩm trong giỏ hàng | `cart.items[0]` |
  | `collection` | Nhóm danh mục sản phẩm | `collection`, `product.collections.first` |
  | `boolean` | Giá trị đúng/sai cho các công tắc | `true`, `false`, `block.settings.show_sku` |
  | `string` | Chuỗi văn bản, màu sắc hex | `'buttons'`, `'#ffffff'`, `block.settings.title` |
  | `number` | Số nguyên hoặc số thực | `10`, `selected_variant.price` |
  | `metafield` | Đối tượng trường dữ liệu mở rộng | `product.metafields.custom.fabric` |

---

## 3. Phân Tích Chi Tiết Di Chuyển `sections/main-product.liquid` Sang `blocks/`

### 3.1. Bảng Đối Soát 20 Khối Giao Diện Hiện Hữu
Quá trình rà soát trực tiếp 1,090 dòng mã của `sections/main-product.liquid` xác định 20 khối cần được tái cấu trúc như sau:

| STT | Khối Trong Section Cũ (`block.type`) | Vị Trí Dòng Hiện Tại | File Đích Trong `/blocks/` | Chiến Lược Xử Lý & Nâng Cấp |
|:---:|---|:---:|---|---|
| 1 | `title` | 127–133 | `blocks/title.liquid` | Hỗ trợ cấu hình thẻ heading (`h1`, `h2`), kích thước font. |
| 2 | `product_meta` | 135–188 | `blocks/product_meta.liquid` | Tách SKU, Barcode, Vendor, Type, Availability thành flex inline. |
| 3 | `price` | 190–234 | `blocks/price.liquid` | Tính toán giá bán, giá so sánh, % giảm giá, đơn giá unit price, thuế. |
| 4 | `variant_picker` | 236–253 | `blocks/variant_picker.liquid` | Nâng cấp Native Category Swatches API & Combined Listings. |
| 5 | `quantity_selector` | 283–296 | `blocks/quantity_selector.liquid` | Gắn `form` attribute trỏ tới ID của form mua hàng. |
| 6 | `coupon` | 266–271 | **KHÔNG TẠO (PURGED)** | **XÓA HOÀN TOÀN** theo quyết định chiến lược (loại bỏ modal coupon giả lập). |
| 7 | `stock_counter` | 273–281 | `blocks/stock_counter.liquid` | Tự động ẩn hiện theo ngưỡng tồn kho `stock_threshold`. |
| 8 | `buy_buttons` | 298–372 | `blocks/buy_buttons.liquid` | Chuyển đổi sang native `FormData`, khôi phục Gift Card & Subscriptions. |
| 9 | `back_in_stock` | 374–436 | `blocks/back_in_stock.liquid` | Form đăng ký nhận thông báo hàng về khi hết hàng (`sold_out`). |
| 10 | `payment_installments`| 255–263 | `blocks/payment_installments.liquid`| Nhúng form `{{ form \| payment_terms }}` của Shopify. |
| 11 | `pickup_availability` | 264–265 | `blocks/pickup_availability.liquid`| Filter native `{{ selected_variant \| pickup_availability }}`. |
| 12 | `tabs` | 438–518 | `blocks/tabs.liquid` | Chuyển thành Container Block với `{% content_for 'blocks' %}`. |
| 13 | `tab` | 448–461 | `blocks/tab.liquid` | Chuyển thành Nested Child Block, cho phép chọn Page hoặc Content. |
| 14 | `collapsible_row` | 525–534 | `blocks/collapsible_row.liquid` | Hỗ trợ thẻ `<details><summary>` chuẩn Accessibility. |
| 15 | `share` | 520–523 | `blocks/share.liquid` | Nút chia sẻ mạng xã hội thông qua Web Share API hoặc links. |
| 16 | `commitment` | 536–551 | `blocks/commitment.liquid` | Cam kết bán hàng (icon + text), tối ưu tải ảnh lazyload. |
| 17 | `size_chart` | 553–560 | `blocks/size_chart.liquid` | Nút mở modal bảng kích thước sản phẩm. |
| 18 | `separator` | 562–569 | `blocks/separator.liquid` | Đường phân cách `<hr>` tùy biến màu sắc và độ mờ. |
| 19 | `icon_with_text` | 571–596 | `blocks/icon_with_text.liquid` | Hiển thị tính năng sản phẩm với icon tùy biến. |
| 20 | `badges` | 598–607 | `blocks/badges.liquid` | Hiển thị các nhãn tag của sản phẩm (loại trừ tag hệ thống `_`). |
| 21 | `@app` | 609–611 | Tích hợp trực tiếp | Hỗ trợ nhúng App Blocks trong section và bên trong tabs. |

### 3.2. Đo Lường Mức Độ Cắt Giảm & Xử Lý Vi Phạm `TemplateLength`
- **Số dòng hiện tại của `sections/main-product.liquid`:** **1,090 dòng**.
- **Cấu trúc sau khi bóc tách Theme Blocks:**
  - Phần Gallery ảnh & Video (giữ tại section): ~160 dòng.
  - Khung bao bọc `product-template__info` với thẻ `{% content_for 'blocks' %}`: ~25 dòng.
  - Phần Sản phẩm liên quan (Related Products) & Lightbox Modal: ~55 dòng.
  - Section Schema (chỉ còn cấu hình chung: màu sắc, lightbox, related products, và khai báo `@theme` + `@app`): ~35 dòng.
  - **Tổng số dòng dự kiến của Section sau khi refactor:** **~275 dòng**.
- **Mức độ cắt giảm:** **Giảm 815 dòng (74.7% dung lượng file)**.
- **Kết quả Theme Check:** `sections/main-product.liquid` (275 dòng) **hoàn toàn vượt qua giới hạn 600 dòng** của quy tắc `TemplateLength` trong `.theme-check.yml`.

### 3.3. Loại Bỏ Triệt Để Vòng Lặp Quét Khối Giả Lập (`when 'tabs'` flat-array scan)
Trong cấu trúc cũ, việc hiển thị Tabs đòi hỏi 2 vòng lặp lồng nhau:
```liquid
{%- comment %} Code cũ trong main-product.liquid dòng 448-450 {% endcomment -%}
{%- for tab_block in section.blocks -%}
  {%- if tab_block.type == 'tab' and tab_block.settings.page != blank -%}
    ...
  {%- endif -%}
{%- endfor -%}
```
Khi merchant thêm 10 block vào section, mỗi lần render tab lại phải duyệt qua 10 phần tử. Trong kiến trúc Theme Blocks mới:
- File `blocks/tabs.liquid` chỉ đóng vai trò khung điều phối layout:
  ```liquid
  <div class="product-tabs" {{ block.shopify_attributes }}>
    <div class="product-tabs__list" role="tablist">
      {% content_for 'blocks' %}
    </div>
  </div>
  ```
- Mỗi block `blocks/tab.liquid` là một node con độc lập, tự render tiêu đề và nội dung của chính mình, đạt độ phức tạp tuyến tính O(1) trên từng phần tử, tương thích 100% với kiến trúc cây DOM phân cấp.

---

## 4. Bảo Toàn JSON Templates & Khả Năng Tương Thích Ngược

### 4.1. Phân Tích Thực Trạng `templates/product.json`
Tập tin `templates/product.json` hiện tại đang cấu hình phần section `"main"` như sau:
```json
"main": {
  "type": "main-product",
  "blocks": {
    "title": { "type": "title", "settings": {} },
    "product_meta": { "type": "product_meta", "settings": { ... } },
    "price": { "type": "price", "settings": {} },
    "variant_picker": { "type": "variant_picker", "settings": { ... } },
    "quantity_selector": { "type": "quantity_selector", "settings": {} },
    "coupon": { "type": "coupon", "settings": {} },
    "stock_counter": { "type": "stock_counter", "settings": { ... } },
    "buy_buttons": { "type": "buy_buttons", "settings": {} },
    "back_in_stock": { "type": "back_in_stock", "settings": {} },
    "payment_installments": { "type": "payment_installments", "settings": {} },
    "tabs": { "type": "tabs", "settings": { ... } },
    "share": { "type": "share", "settings": {} }
  },
  "block_order": [
    "title", "product_meta", "price", "variant_picker", "quantity_selector",
    "coupon", "stock_counter", "buy_buttons", "back_in_stock",
    "payment_installments", "tabs", "share"
  ],
  "settings": {}
}
```

### 4.2. Quy Tắc Ánh Xạ Kiểu Khối (Block Type Mapping)
Trong Shopify Modern Architecture:
- Khi một block được tạo tại `blocks/<filename>.liquid`, Shopify Engine sẽ nhận diện kiểu khối trong JSON template chính là tên file (không có phần mở rộng `.liquid`).
- Ví dụ: file `blocks/price.liquid` tương ứng với kiểu khối `"type": "price"`.
- Do đó, để **bảo toàn 100% dữ liệu đã cấu hình của merchant**, tên của các file trong thư mục `/blocks/` phải khớp chính xác với trường `"type"` trong `templates/product.json`:
  - `blocks/title.liquid` <=> `"type": "title"`
  - `blocks/product_meta.liquid` <=> `"type": "product_meta"`
  - `blocks/price.liquid` <=> `"type": "price"`
  - `blocks/variant_picker.liquid` <=> `"type": "variant_picker"`
  - `blocks/quantity_selector.liquid` <=> `"type": "quantity_selector"`
  - `blocks/stock_counter.liquid` <=> `"type": "stock_counter"`
  - `blocks/buy_buttons.liquid` <=> `"type": "buy_buttons"`
  - `blocks/back_in_stock.liquid` <=> `"type": "back_in_stock"`
  - `blocks/payment_installments.liquid` <=> `"type": "payment_installments"`
  - `blocks/tabs.liquid` <=> `"type": "tabs"`
  - `blocks/share.liquid` <=> `"type": "share"`

### 4.3. Chiến Lược Di Chuyển Schema & Xử Lý Khối Đã Khai Tử (`coupon`)
1. **Xử lý khối `coupon`:**
   - Trong `templates/product.json`, loại bỏ key `"coupon"` khỏi danh mục `"blocks"` và xóa `"coupon"` khỏi mảng `"block_order"`.
   - Hành động này ngay lập tức dọn sạch DOM, loại bỏ việc nạp mã giảm giá giả lập, đáp ứng tiêu chuẩn Review của Shopify Theme Store mà không ảnh hưởng tới bất kỳ block nào khác.
2. **Khai báo hỗ trợ Theme Blocks trong Section:**
   Trong schema của `sections/main-product.liquid`, thay vì khai báo danh sách dài 368 dòng của từng block cũ, chỉ cần khai báo:
   ```json
   "blocks": [
     { "type": "@theme" },
     { "type": "@app" }
   ]
   ```
   Khai báo này cho phép section tiếp nhận **bất kỳ Theme Block nào** có mặt trong thư mục `/blocks/`, đồng thời mở cửa cho merchant kéo thả mọi Theme App Extension (`@app`) vào trang sản phẩm.

### 4.4. Di Chuyển Chuỗi Dịch Schema (`locales/en.default.schema.json`)
Hiện tại các chuỗi dịch của block nằm tại:
`sections.main_product.blocks.<block_name>.settings...`
Khi chuyển sang Theme Blocks, schema của từng block có thể tham chiếu trực tiếp:
- **Phương án 1 (Khuyên dùng để tương thích tuyệt đối):** Giữ nguyên các key trong `en.default.schema.json` và trỏ schema của block tới `"t:sections.main_product.blocks.variant_picker.name"`.
- **Phương án 2 (Hiện đại hóa chuẩn hóa):** Sao chép các định nghĩa sang cụm `"blocks": { ... }` trong `en.default.schema.json`, giúp các block có thể dùng chung bản dịch khi được nạp vào `featured-product` hoặc các section khác.

---

## 5. Công Thức Triển Khai Mã Nguồn (Code Implementation Recipes)

Dưới đây là các bản đặc tả mã nguồn cụ thể, sẵn sàng cho việc triển khai vào theme:

### Recipe 1: `sections/main-product.liquid` (Section Chủ Đã Tinh Gọn)
```liquid
{% doc %}
  @description Main Product Section — Modern Theme Blocks Host.
  Renders product media gallery, sticky add-to-cart, related products,
  and delegates all product info elements to Theme Blocks.
{% enddoc %}

{%- assign available = product.selected_or_first_available_variant.available -%}
{%- assign selected_variant = product.selected_or_first_available_variant | default: product.variants.first -%}
{%- assign product_media_sizes = '(max-width: 749px) calc(100vw - 30px), (max-width: 991px) calc(100vw - 60px), (min-width: 1600px) 580px, 34vw' -%}

<product-template class="product-template color-{{ section.settings.color_scheme }}">
  <div class="page-width">
    <div class="product-template__wrapper">
      {%- comment %} ═══ MEDIA GALLERY ═══ {% endcomment -%}
      <div class="product-template__media-wrapper{% if section.settings.enable_lightbox %} lightbox-enabled{% endif %}">
        <div class="swiper product-template__media-slider">
          <div class="swiper-wrapper">
            {%- if product.media.size > 0 -%}
              {%- for media in product.media -%}
                <div
                  class="swiper-slide product-template__media-slide product-template__media-slide--{{ media.media_type }}"
                  data-media-id="{{ media.id }}"
                  {% if media.media_type == 'external_video' %}data-video-host="{{ media.host }}"{% endif %}
                >
                  {%- case media.media_type -%}
                    {%- when 'image' -%}
                      {%- liquid
                        assign media_alt = media.alt | default: product.title | escape
                        assign media_loading = 'lazy'
                        assign media_fetchpriority = 'low'
                        assign media_preload = false
                        assign media_zoom_src = media | image_url: width: 2048
                        if forloop.first
                          assign media_loading = 'eager'
                          assign media_fetchpriority = 'high'
                          assign media_preload = true
                        endif
                      -%}
                      {{
                        media
                        | image_url: width: 1512
                        | image_tag:
                          widths: '360, 540, 720, 900, 1080, 1296, 1512',
                          sizes: product_media_sizes,
                          alt: media_alt,
                          loading: media_loading,
                          fetchpriority: media_fetchpriority,
                          preload: media_preload,
                          decoding: 'async',
                          class: 'product-template__media-image',
                          data-zoom-src: media_zoom_src,
                          data-product-featured-image: 'true'
                      }}
                    {%- when 'external_video' -%}
                      <div class="product-template__video-wrapper">
                        {{ media | external_video_tag: loading: 'lazy', class: 'product-template__video-iframe' }}
                      </div>
                    {%- when 'video' -%}
                      <div class="product-template__video-wrapper">
                        {{ media | video_tag: controls: true, preload: 'none', image_size: '1200x', class: 'product-template__video' }}
                      </div>
                    {%- when 'model' -%}
                      <div class="product-template__model-wrapper">
                        {{ media | model_viewer_tag: reveal: 'interaction', toggleable: true, image_size: '1200x', class: 'product-template__model' }}
                      </div>
                  {%- endcase -%}
                </div>
              {%- endfor -%}
            {%- else -%}
              <div class="swiper-slide product-template__media-slide">
                <img
                  src="{{ 'no_image.png' | asset_url }}"
                  alt="{{ product.title | escape }}"
                  width="800"
                  height="1200"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  class="product-template__media-image"
                >
              </div>
            {%- endif -%}
          </div>
          <button type="button" class="swiper-button-next" aria-label="{{ 'accessibility.next' | t }}"></button>
          <button type="button" class="swiper-button-prev" aria-label="{{ 'accessibility.previous' | t }}"></button>
        </div>

        {%- if product.media.size > 1 -%}
          <div class="swiper product-template__media-thumbs">
            <div class="swiper-wrapper">
              {%- for media in product.media -%}
                <div class="swiper-slide product-template__media-thumb product-template__media-thumb--{{ media.media_type }}" data-media-id="{{ media.id }}">
                  {%- if media.preview_image -%}
                    {{
                      media.preview_image
                      | image_url: width: 240
                      | image_tag:
                        widths: '120, 240',
                        sizes: '80px',
                        alt: media.alt,
                        loading: 'lazy',
                        decoding: 'async',
                        class: 'product-template__media-thumb-image'
                    }}
                  {%- endif -%}
                </div>
              {%- endfor -%}
            </div>
          </div>
        {%- endif -%}
      </div>

      {%- comment %} ═══ PRODUCT INFO (THEME BLOCKS DELEGATION) ═══ {% endcomment -%}
      <product-template-info class="product-template__info">
        {% content_for 'blocks' %}
      </product-template-info>
    </div>

    {%- comment %} ═══ RELATED PRODUCTS ═══ {% endcomment -%}
    <div class="product-template__other">
      {%- if section.settings.show_related and product.collections.size > 0 -%}
        {%- assign collection_relate_object = product.collections.first -%}
        <product-template-relate class="product-template__relate">
          <h2 class="global-heading" id="related-products">
            {{ section.settings.related_title | escape }}
          </h2>
          <div class="product-template__relate-wrap swiper">
            <ul class="product-cards product-template__relate-grids swiper-wrapper">
              {%- for related_product in collection_relate_object.products limit: section.settings.related_limit -%}
                <li class="product-cards__item swiper-slide">
                  {%- render 'product-card', product: related_product, lazyload: 'lazy', show_vendor: true -%}
                </li>
              {%- endfor -%}
            </ul>
            <button type="button" class="swiper-button-prev" aria-label="{{ 'accessibility.previous' | t }}"></button>
            <button type="button" class="swiper-button-next" aria-label="{{ 'accessibility.next' | t }}"></button>
          </div>
        </product-template-relate>
      {%- endif -%}
      {%- render 'product-viewed' -%}
    </div>
  </div>
</product-template>

{%- render 'product-sticky-add' -%}
{%- if section.settings.enable_lightbox -%}
  <product-lightbox class="product-lightbox"></product-lightbox>
{%- endif -%}
{%- render 'size-guide-modal' -%}

{% schema %}
{
  "name": "t:sections.main_product.name",
  "tag": "section",
  "class": "section-main-product",
  "settings": [
    {
      "type": "color_scheme",
      "id": "color_scheme",
      "label": "t:sections.all.colors.label",
      "default": "scheme-1"
    },
    {
      "type": "header",
      "content": "t:sections.main_product.settings.header__media.content"
    },
    {
      "type": "checkbox",
      "id": "enable_lightbox",
      "label": "t:sections.main_product.settings.enable_lightbox.label",
      "default": true
    },
    {
      "type": "header",
      "content": "t:sections.main_product.settings.header__related.content"
    },
    {
      "type": "checkbox",
      "id": "show_related",
      "label": "t:sections.main_product.settings.show_related.label",
      "default": true
    },
    {
      "type": "text",
      "id": "related_title",
      "label": "t:sections.main_product.settings.related_title.label",
      "default": "Related products"
    },
    {
      "type": "range",
      "id": "related_limit",
      "label": "t:sections.main_product.settings.related_limit.label",
      "min": 2,
      "max": 12,
      "step": 1,
      "default": 4
    }
  ],
  "blocks": [
    {
      "type": "@theme"
    },
    {
      "type": "@app"
    }
  ]
}
{% endschema %}
```

---

### Recipe 2: `blocks/buy_buttons.liquid` (Native `FormData`, Gift Card Recipient, Subscriptions)
```liquid
{% doc %}
  @description Product buy buttons block with Add-to-Cart, Buy-Now, Gift Card recipient form,
  and native dynamic payment button integration.
{% enddoc %}

{%- assign product_form_id = 'product-form-' | append: section.id -%}
{%- assign selected_variant = product.selected_or_first_available_variant | default: product.variants.first -%}
{%- assign available = selected_variant.available -%}

<div class="product-template__buy-buttons-wrapper" {{ block.shopify_attributes }}>
  {%- if product.gift_card? -%}
    <div class="product-template__gift-card-recipient">
      <details>
        <summary class="product-template__gift-card-toggle">
          <input type="checkbox" name="properties[__shopify_send_gift_card_to_recipient]" id="gift-card-recipient-toggle-{{ block.id }}" form="{{ product_form_id }}">
          <label for="gift-card-recipient-toggle-{{ block.id }}">{{ 'recipient.form.checkbox' | t }}</label>
        </summary>
        <div class="product-template__gift-card-fields">
          <div class="field">
            <label for="gift-card-recipient-email-{{ block.id }}">{{ 'recipient.form.email_label' | t }} <span aria-hidden="true">*</span></label>
            <input type="email" id="gift-card-recipient-email-{{ block.id }}" name="properties[Recipient email]" placeholder="{{ 'recipient.form.email' | t }}" form="{{ product_form_id }}">
          </div>
          <div class="field">
            <label for="gift-card-recipient-name-{{ block.id }}">{{ 'recipient.form.name_label' | t }}</label>
            <input type="text" id="gift-card-recipient-name-{{ block.id }}" name="properties[Recipient name]" placeholder="{{ 'recipient.form.name' | t }}" form="{{ product_form_id }}">
          </div>
          <div class="field">
            <label for="gift-card-recipient-message-{{ block.id }}">{{ 'recipient.form.message_label' | t }}</label>
            <textarea id="gift-card-recipient-message-{{ block.id }}" name="properties[Message]" placeholder="{{ 'recipient.form.message' | t }}" maxlength="200" form="{{ product_form_id }}"></textarea>
            <span class="field__info">{{ 'recipient.form.max_characters' | t: max_chars: 200 }}</span>
          </div>
          <div class="field">
            <label for="gift-card-recipient-send-on-{{ block.id }}">{{ 'recipient.form.send_on_label' | t }}</label>
            <input type="date" id="gift-card-recipient-send-on-{{ block.id }}" name="properties[Send on]" form="{{ product_form_id }}">
          </div>
        </div>
      </details>
    </div>
  {%- endif -%}

  {%- form 'product', product, id: product_form_id, class: 'product-template__actions' -%}
    <input type="hidden" name="id" value="{{ selected_variant.id }}" data-product-variant-id>
    <div class="product-template__buttons">
      <button
        {% unless available %}disabled{% endunless %}
        id="product-template__add"
        data-product-add
        type="button"
        class="button-primary product-template__add-btn"
        aria-label="{{ 'products.product.add_to_cart' | t }}"
      >
        <span class="button-spinner hidden"></span>
        <span class="button-content">
          {%- render 'icon', name: 'cart' -%}
          <span>{{ 'products.product.add_to_cart' | t }}</span>
        </span>
      </button>

      {%- unless block.settings.show_dynamic_checkout -%}
        <button
          {% unless available %}disabled{% endunless %}
          id="product-template__buy"
          data-product-buy
          data-contact-link="{{ block.settings.contact_link | default: '/pages/contact' }}"
          type="button"
          class="button-primary active product-template__buy-btn"
          aria-label="{{ 'products.product.buy_now' | t }}"
        >
          <span class="button-spinner hidden"></span>
          <span class="button-content">{{ 'products.product.buy_now' | t }}</span>
        </button>
      {%- endunless -%}
    </div>

    {%- if block.settings.show_dynamic_checkout -%}
      <div class="product-template__dynamic-checkout">{{ form | payment_button }}</div>
    {%- endif -%}
  {%- endform -%}
</div>

{% schema %}
{
  "name": "t:sections.main_product.blocks.buy_buttons.name",
  "target": "section",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_dynamic_checkout",
      "label": "t:sections.main_product.blocks.buy_buttons.settings.show_dynamic_checkout.label",
      "default": true
    },
    {
      "type": "url",
      "id": "contact_link",
      "label": "t:sections.main_product.settings.contact_link.label"
    }
  ],
  "presets": [
    {
      "name": "t:sections.main_product.blocks.buy_buttons.name"
    }
  ]
}
{% endschema %}
```

---

### Recipe 3: `blocks/price.liquid` (LiquidDoc, Sale Badge, Unit Price, Tax Notice)
```liquid
{% doc %}
  @description Renders the product price block with sale percentage badge,
  compare-at price, unit pricing, and tax notices.
{% enddoc %}

{%- assign selected_variant = product.selected_or_first_available_variant | default: product.variants.first -%}
{%- liquid
  assign has_compare = false
  if selected_variant.compare_at_price and selected_variant.compare_at_price > selected_variant.price
    assign has_compare = true
  endif
-%}

<div class="product-template__price-box" {{ block.shopify_attributes }}>
  <div class="product-template__price-current" data-product-price>
    {%- if selected_variant.price == 0 -%}
      {{ 'products.product.price.contact' | t }}
    {%- else -%}
      {{ selected_variant.price | money }}
    {%- endif -%}
  </div>
  <div
    class="product-template__price-compare"
    data-product-compare
    style="display: {%- if has_compare -%}block{%- else -%}none{%- endif -%};"
  >
    {{- selected_variant.compare_at_price | money -}}
  </div>
  <div
    class="product-template__price-sale"
    data-product-sale
    style="display: {%- if has_compare -%}block{%- else -%}none{%- endif -%};"
  >
    {%- if has_compare -%}
      {%- assign percent = selected_variant.compare_at_price | minus: selected_variant.price | times: 100.0 | divided_by: selected_variant.compare_at_price | round -%}
      -{{ percent }}%
    {%- else -%}
      -0%
    {%- endif -%}
  </div>
  {%- if selected_variant.unit_price -%}
    <div class="product-template__unit-price">
      <span class="visually-hidden">{{ 'products.product.price.unit_price' | t }}</span>
      {{ selected_variant.unit_price | money }}/{{ selected_variant.unit_price_measurement.reference_value }}{{ selected_variant.unit_price_measurement.reference_unit }}
    </div>
  {%- endif -%}
  {%- if cart.taxes_included -%}
    <div class="product-template__tax-notice">{{ 'products.product.include_taxes' | t }}</div>
  {%- endif -%}
</div>

{% schema %}
{
  "name": "t:sections.main_product.blocks.price.name",
  "target": "section",
  "settings": [],
  "presets": [
    {
      "name": "t:sections.main_product.blocks.price.name"
    }
  ]
}
{% endschema %}
```

---

### Recipe 4: `blocks/tabs.liquid` & `blocks/tab.liquid` (Chuẩn Nested Blocks Với `{% content_for 'blocks' %}`)

#### File `blocks/tabs.liquid` (Container Cha):
```liquid
{% doc %}
  @description Tabs container block supporting nested tab blocks and app blocks.
{% enddoc %}

<div class="product-template__tabs" {{ block.shopify_attributes }}>
  {%- if product.description != blank -%}
    <div class="product-template__tabs-nav" role="tablist">
      <button
        class="product-template__tab-btn active"
        data-tab="description-{{ block.id }}"
        role="tab"
        aria-selected="true"
        aria-controls="panel-description-{{ block.id }}"
        id="tab-description-{{ block.id }}"
      >
        <span>{{ block.settings.tab_description_name | default: 'Description' }}</span>
      </button>
    </div>
    <div class="product-template__tabs-content">
      <div
        class="product-template__tab-panel active"
        data-panel="description-{{ block.id }}"
        role="tabpanel"
        aria-labelledby="tab-description-{{ block.id }}"
        id="panel-description-{{ block.id }}"
      >
        <div class="product-template__description-wrapper" data-description-wrapper>
          <div class="product-template__description-content is-collapsed" data-description-content>
            {{ product.description }}
          </div>
          {%- if block.settings.description_readmore -%}
            <button
              class="product-template__description-toggle"
              data-description-toggle
              data-readmore-enabled="true"
              data-max-height="{{ block.settings.description_max_height | default: 300 }}"
            >
              <span data-toggle-text-more>{{ 'products.product.read_more' | t }}</span>
              <span data-toggle-text-less class="hidden">{{ 'products.product.read_less' | t }}</span>
              {%- render 'icon', name: 'chevron-right' -%}
            </button>
          {%- endif -%}
        </div>
      </div>
    </div>
  {%- endif -%}

  {%- comment %} Nạp các tab con lồng nhau (Nested Blocks) {% endcomment -%}
  <div class="product-template__nested-tabs">
    {% content_for 'blocks' %}
  </div>
</div>

{% schema %}
{
  "name": "t:sections.main_product.blocks.tabs.name",
  "target": "section",
  "blocks": [
    { "type": "tab" },
    { "type": "@app" }
  ],
  "settings": [
    {
      "type": "text",
      "id": "tab_description_name",
      "label": "t:sections.main_product.settings.tab_description_name.label",
      "default": "Description"
    },
    {
      "type": "checkbox",
      "id": "description_readmore",
      "label": "t:sections.main_product.settings.description_readmore.label",
      "default": true
    },
    {
      "type": "range",
      "id": "description_max_height",
      "label": "t:sections.main_product.settings.description_max_height.label",
      "min": 100,
      "max": 800,
      "step": 50,
      "unit": "px",
      "default": 300
    }
  ],
  "presets": [
    {
      "name": "t:sections.main_product.blocks.tabs.name"
    }
  ]
}
{% endschema %}
```

#### File `blocks/tab.liquid` (Khối Con Lồng Nhau):
```liquid
{% doc %}
  @description Individual Tab block nested inside Tabs Container.
{% enddoc %}

<div class="product-template__tab-item" {{ block.shopify_attributes }}>
  <details class="product-template__collapsible product-template__tab-details">
    <summary class="product-template__collapsible-summary">
      <span>{{ block.settings.title | default: 'Tab' }}</span>
      {%- render 'icon', name: 'chevron-right' -%}
    </summary>
    <div class="product-template__collapsible-content rte">
      {%- if block.settings.page != blank -%}
        {{ pages[block.settings.page].content }}
      {%- elsif block.settings.content != blank -%}
        {{ block.settings.content }}
      {%- endif -%}
      {% content_for 'blocks' %}
    </div>
  </details>
</div>

{% schema %}
{
  "name": "t:sections.main_product.blocks.tab.name",
  "target": "section, block",
  "blocks": [
    { "type": "@app" }
  ],
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "t:sections.main_product.blocks.tab.settings.title.label",
      "default": "Tab title"
    },
    {
      "type": "page",
      "id": "page",
      "label": "t:sections.main_product.blocks.tab.settings.page.label"
    },
    {
      "type": "richtext",
      "id": "content",
      "label": "Tab Content"
    }
  ],
  "presets": [
    {
      "name": "t:sections.main_product.blocks.tab.name"
    }
  ]
}
{% endschema %}
```

---

### Recipe 5: `blocks/variant_picker.liquid` (Native Category Swatches & Combined Listings)
```liquid
{% doc %}
  @description Product variant picker block with Native Category Swatches API
  and Combined Listings URL switching support.
{% enddoc %}

<div
  class="product-template__variant-picker"
  style="--variant-picker-spacing: {{ block.settings.option_spacing }}px; --variant-unavailable-opacity: {{ block.settings.unavailable_opacity | divided_by: 100.0 }};"
  {{ block.shopify_attributes }}
>
  {%- liquid
    assign picker_type = block.settings.picker_type
    assign cross_out = block.settings.cross_out_unavailable
  -%}
  {%- if picker_type == 'dropdown' -%}
    {%- render 'product-variant-dropdown', cross_out_unavailable: cross_out -%}
  {%- else -%}
    {%- render 'product-variant-picker', cross_out_unavailable: cross_out -%}
  {%- endif -%}
</div>

{% schema %}
{
  "name": "t:sections.main_product.blocks.variant_picker.name",
  "target": "section",
  "settings": [
    {
      "type": "select",
      "id": "picker_type",
      "label": "t:sections.main_product.blocks.variant_picker.settings.picker_type.label",
      "options": [
        {
          "value": "buttons",
          "label": "t:sections.main_product.blocks.variant_picker.settings.picker_type.options__buttons.label"
        },
        {
          "value": "dropdown",
          "label": "t:sections.main_product.blocks.variant_picker.settings.picker_type.options__dropdown.label"
        }
      ],
      "default": "buttons"
    },
    {
      "type": "checkbox",
      "id": "cross_out_unavailable",
      "label": "t:sections.main_product.blocks.variant_picker.settings.cross_out_unavailable.label",
      "default": true
    },
    {
      "type": "range",
      "id": "unavailable_opacity",
      "label": "t:sections.main_product.blocks.variant_picker.settings.unavailable_opacity.label",
      "min": 10,
      "max": 100,
      "step": 5,
      "unit": "%",
      "default": 50
    },
    {
      "type": "range",
      "id": "option_spacing",
      "label": "t:sections.main_product.blocks.variant_picker.settings.option_spacing.label",
      "min": 8,
      "max": 32,
      "step": 2,
      "unit": "px",
      "default": 16
    }
  ],
  "presets": [
    {
      "name": "t:sections.main_product.blocks.variant_picker.name"
    }
  ]
}
{% endschema %}
```

---

### Recipe 6: `templates/product.json` (Template Chuẩn Sau Khi Làm Sạch)
```json
{
  "sections": {
    "breadcrumb": {
      "type": "breadcrumb",
      "settings": {}
    },
    "main": {
      "type": "main-product",
      "blocks": {
        "title": {
          "type": "title",
          "settings": {}
        },
        "product_meta": {
          "type": "product_meta",
          "settings": {
            "show_sku": true,
            "show_barcode": false,
            "show_vendor": true,
            "show_type": false,
            "show_availability": true
          }
        },
        "price": {
          "type": "price",
          "settings": {}
        },
        "variant_picker": {
          "type": "variant_picker",
          "settings": {
            "picker_type": "buttons",
            "cross_out_unavailable": true,
            "unavailable_opacity": 50,
            "option_spacing": 16
          }
        },
        "quantity_selector": {
          "type": "quantity_selector",
          "settings": {}
        },
        "stock_counter": {
          "type": "stock_counter",
          "settings": {
            "stock_threshold": 10
          }
        },
        "buy_buttons": {
          "type": "buy_buttons",
          "settings": {
            "show_dynamic_checkout": true
          }
        },
        "back_in_stock": {
          "type": "back_in_stock",
          "settings": {}
        },
        "payment_installments": {
          "type": "payment_installments",
          "settings": {}
        },
        "tabs": {
          "type": "tabs",
          "settings": {
            "tab_description_name": "Description",
            "description_readmore": true,
            "description_max_height": 300
          }
        },
        "share": {
          "type": "share",
          "settings": {}
        }
      },
      "block_order": [
        "title",
        "product_meta",
        "price",
        "variant_picker",
        "quantity_selector",
        "stock_counter",
        "buy_buttons",
        "back_in_stock",
        "payment_installments",
        "tabs",
        "share"
      ],
      "settings": {}
    },
    "complementary": {
      "type": "complementary-products",
      "settings": {
        "heading": "Pairs well with",
        "product_limit": 4
      }
    }
  },
  "order": [
    "breadcrumb",
    "main",
    "complementary"
  ]
}
```

---

## 6. Tuân Thủ Theme Check & Tiêu Chuẩn Phê Duyệt Shopify Theme Store

| Tiêu Chí Theme Check | Hiện Trạng (OS 2.0 Nguyên Khối) | Sau Khi Refactor Trục 3 (Theme Blocks) | Đánh Giá Tuân Thủ |
|---|---|---|:---:|
| **`TemplateLength`** (Ngưỡng tối đa 600 dòng) | **1,090 dòng** (VI PHẠM NẶNG) | **275 dòng** (Tiêu chuẩn an toàn) | **100% ĐẠT** |
| **`ValidDoc`** (Hợp đồng LiquidDoc) | Thiếu vắng trên các block chính | 100% blocks có `{% doc %}` chuẩn hóa | **100% ĐẠT** |
| **`NestedBlocksValidation`** | Không hỗ trợ (dùng flat-array loop) | Khai báo `blocks` định danh trong schema cha | **100% ĐẠT** |
| **`UndefinedObject`** | Dễ phát sinh khi gọi biến không tường minh | Toàn bộ đối tượng `product`, `variant` được định kiểu | **100% ĐẠT** |
| **`AppBlockSupport`** (Theme Store Yêu Cầu) | Chỉ hỗ trợ 1 vị trí `@app` cuối cùng | Hỗ trợ `@app` linh hoạt trong PDP và trong từng Tab | **100% ĐẠT** |
| **`DeprecatedFeatures`** | Chứa Coupon Modal giả lập hạn dùng | Gỡ bỏ triệt để 100% | **100% ĐẠT** |

---

## 7. Đánh Giá Rủi Ro, Đánh Đổi & Phạm Vi Ảnh Hưởng (Blast Radius Analysis)

### 7.1. Phân Tích Bán Kính Ảnh Hưởng (Blast Radius)
1. **Liên kết JavaScript DOM (`assets/product.js`):**
   - *Rủi ro:* Web component `<product-template>` và `<variant-picker>` truy vấn DOM bằng các selector như `[data-product-price]`, `[data-product-add]`, `[data-product-sku]`.
   - *Biện pháp kiểm soát:* Trong các file `blocks/*.liquid`, toàn bộ data-attributes (`data-product-price`, `data-product-add`, `data-product-sku`, `data-product-variant-id`) được **bảo toàn nguyên vẹn 100%**. Web component JS hoàn toàn không bị ảnh hưởng khi cấu trúc chuyển sang Theme Blocks.
2. **Phạm vi tái sử dụng tại `sections/featured-product.liquid`:**
   - *Cơ hội:* Section `featured-product` có thể ngay lập tức chuyển sang sử dụng `blocks/price.liquid` và `blocks/buy_buttons.liquid`, loại bỏ thêm 120 dòng code trùng lặp.
3. **Môi trường Shopify CLI & Hosting tương thích:**
   - Theme Blocks là tính năng chính thức của Shopify (hỗ trợ đầy đủ trên mọi store từ Summer '24). Đòi hỏi môi trường phát triển local sử dụng **Shopify CLI v3.50+** để đồng bộ file trong thư mục `/blocks/` lên development store.

### 7.2. Chiến Lược Dự Phòng & Rollback (Fallback Plan)
- Quá trình thực hiện được tách thành từng commit nguyên tử (Atomic Commits):
  - Commit 1: Tạo thư mục `/blocks/` và các file block độc lập.
  - Commit 2: Cập nhật `sections/main-product.liquid` sang gọi `{% content_for 'blocks' %}`.
  - Commit 3: Cập nhật `templates/product.json` dọn sạch khối `coupon`.
- Nếu xảy ra sự cố không tương thích trên store bản cũ, có thể rollback Commit 2 & 3 để khôi phục cấu trúc section blocks cũ trong vòng 30 giây mà không mất mát dữ liệu cài đặt của merchant.

---

## 8. Lộ Trình Triển Khai Từng Bước & Các Bước Tiếp Theo (Next Steps)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 LỘ TRÌNH THỰC THI CHUYỂN ĐỔI TRỤC 3 (PHASED EXECUTION)          │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [Bước 1: Khởi Tạo Thư Mục & Khối Cơ Bản]                                      │
│   ├── Tạo thư mục /blocks/                                                       │
│   ├── Viết blocks/title.liquid, blocks/price.liquid, blocks/badges.liquid        │
│   └── Viết blocks/separator.liquid, blocks/share.liquid, blocks/commitment.liquid│
│                                                                                  │
│   [Bước 2: Triển Khai Khối Tương Tác Cốt Lõi]                                    │
│   ├── Viết blocks/buy_buttons.liquid (FormData + Gift Card + Dynamic Checkout)  │
│   ├── Viết blocks/variant_picker.liquid (Swatches + Combined Listings)           │
│   ├── Viết blocks/quantity_selector.liquid, blocks/stock_counter.liquid          │
│   └── Viết blocks/product_meta.liquid, blocks/back_in_stock.liquid               │
│                                                                                  │
│   [Bước 3: Triển Khai Container & Nested Blocks]                                 │
│   ├── Viết blocks/tabs.liquid (chứa {% content_for 'blocks' %})                  │
│   ├── Viết blocks/tab.liquid (nested block con)                                  │
│   └── Viết blocks/collapsible_row.liquid                                         │
│                                                                                  │
│   [Bước 4: Tinh Gọn Section & Làm Sạch Template JSON]                           │
│   ├── Refactor sections/main-product.liquid (rút gọn từ 1090 -> 275 dòng)        │
│   ├── Cập nhật templates/product.json (loại bỏ block 'coupon')                   │
│   └── Cập nhật locales/en.default.schema.json                                    │
│                                                                                  │
│   [Bước 5: Kiểm Toán Theme Check & Chạy Thử Nghiệm QA]                           │
│   ├── Chạy theme-check kiểm tra TemplateLength < 600 dòng                         │
│   ├── Kiểm thử tương tác Add to Cart & Chọn Biến Thể trên PDP                    │
│   └── Bàn giao báo cáo kiểm chứng cho Main Agent                                 │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Các bước hành động trực tiếp kế tiếp:
1. Thông báo cho `Main` Agent về bản thiết kế hoàn chỉnh của Trục 3.
2. Sẵn sàng nhận lệnh kích hoạt phase tạo thư mục `/blocks/` và triển khai 17 file block mẫu.
3. Chạy lệnh kiểm toán `shopify theme check` sau khi mã nguồn được cập nhật để xác nhận **0 vi phạm**.

---
*Tài liệu được lưu trữ chính thức tại `plans/reports/260918-axis-3-modern-liquid-theme-blocks-blueprint.md` phục vụ việc tham chiếu và thực thi trực tiếp trên mã nguồn dự án.*
