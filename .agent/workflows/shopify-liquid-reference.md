---
description: Tham chiếu nhanh tất cả đối tượng, filter và tag Shopify Liquid
---

# Tham Chiếu Nhanh Shopify Liquid

## Đối tượng toàn cục

| Đối tượng | Mô tả | Có sẵn trên |
| --- | --- | --- |
| `shop` | Thông tin cửa hàng (tên, URL, tiền tệ) | Tất cả trang |
| `settings` | Giá trị cài đặt theme | Tất cả trang |
| `request` | Yêu cầu hiện tại (ngôn ngữ, đường dẫn) | Tất cả trang |
| `routes` | Đường dẫn URL của cửa hàng | Tất cả trang |
| `page_title` | Tiêu đề trang hiện tại | Tất cả trang |
| `page_description` | Mô tả meta trang hiện tại | Tất cả trang |
| `content_for_header` | Script bắt buộc của Shopify | Chỉ layout |
| `content_for_layout` | Nội dung template | Chỉ layout |
| `canonical_url` | URL chính tắc | Tất cả trang |
| `cart` | Giỏ hàng | Tất cả trang |
| `customer` | Khách hàng đã đăng nhập | Tất cả trang |
| `collections` | Tất cả bộ sưu tập | Tất cả trang |
| `linklists` | Menu điều hướng | Tất cả trang |
| `images` | Hình ảnh của theme | Tất cả trang |
| `scripts` | Script của theme | Tất cả trang |
| `localization` | Ngôn ngữ/quốc gia khả dụng | Tất cả trang |

## Đối tượng theo loại trang

| Đối tượng | Loại template |
| --- | --- |
| `product` | `product.json` (trang sản phẩm) |
| `collection` | `collection.json` (trang bộ sưu tập) |
| `article` | `article.json` (trang bài viết) |
| `blog` | `blog.json` (trang blog) |
| `page` | `page.json` (trang tĩnh) |
| `search` | `search.json` (trang tìm kiếm) |
| `order` | `customers/order.json` (trang đơn hàng) |

## Đối tượng Sản phẩm (`product`) — Thuộc tính chính

```liquid
product.id                          {%- comment -%} ID sản phẩm {%- endcomment -%}
product.title                       {%- comment -%} Tên sản phẩm {%- endcomment -%}
product.handle                      {%- comment -%} Đường dẫn thân thiện {%- endcomment -%}
product.description                 {%- comment -%} Mô tả sản phẩm {%- endcomment -%}
product.price                       {%- comment -%} Giá (đơn vị cents) {%- endcomment -%}
product.compare_at_price            {%- comment -%} Giá so sánh (giá gốc) {%- endcomment -%}
product.price | money               {%- comment -%} Giá đã định dạng {%- endcomment -%}
product.available                   {%- comment -%} Còn hàng hay không {%- endcomment -%}
product.type                        {%- comment -%} Loại sản phẩm {%- endcomment -%}
product.vendor                      {%- comment -%} Nhà cung cấp {%- endcomment -%}
product.tags                        {%- comment -%} Thẻ gắn {%- endcomment -%}
product.featured_image              {%- comment -%} Ảnh đại diện {%- endcomment -%}
product.images                      {%- comment -%} Tất cả ảnh {%- endcomment -%}
product.variants                    {%- comment -%} Các biến thể {%- endcomment -%}
product.selected_or_first_available_variant {%- comment -%} Biến thể được chọn/đầu tiên còn hàng {%- endcomment -%}
product.options_with_values         {%- comment -%} Tuỳ chọn và giá trị {%- endcomment -%}
product.url                         {%- comment -%} Đường dẫn sản phẩm {%- endcomment -%}
product.metafields.custom.<key>     {%- comment -%} Trường tuỳ chỉnh {%- endcomment -%}
product.media                       {%- comment -%} Media: ảnh, video, 3D {%- endcomment -%}
```

## Đối tượng Bộ sưu tập (`collection`)

```liquid
collection.title                    {%- comment -%} Tên bộ sưu tập {%- endcomment -%}
collection.handle                   {%- comment -%} Đường dẫn thân thiện {%- endcomment -%}
collection.description              {%- comment -%} Mô tả {%- endcomment -%}
collection.image                    {%- comment -%} Ảnh đại diện {%- endcomment -%}
collection.products                 {%- comment -%} Danh sách sản phẩm {%- endcomment -%}
collection.products_count           {%- comment -%} Số sản phẩm (trang hiện tại) {%- endcomment -%}
collection.all_products_count       {%- comment -%} Tổng số sản phẩm {%- endcomment -%}
collection.sort_options             {%- comment -%} Tuỳ chọn sắp xếp {%- endcomment -%}
collection.filters                  {%- comment -%} Bộ lọc {%- endcomment -%}
collection.url                      {%- comment -%} Đường dẫn {%- endcomment -%}
```

## Đối tượng Giỏ hàng (`cart`)

```liquid
cart.items                          {%- comment -%} Danh sách sản phẩm trong giỏ {%- endcomment -%}
cart.item_count                     {%- comment -%} Tổng số sản phẩm {%- endcomment -%}
cart.total_price | money            {%- comment -%} Tổng tiền {%- endcomment -%}
cart.total_discount | money         {%- comment -%} Tổng giảm giá {%- endcomment -%}
cart.note                           {%- comment -%} Ghi chú đơn hàng {%- endcomment -%}
```

## Sản phẩm trong giỏ (`cart item`)

```liquid
item.product                        {%- comment -%} Sản phẩm {%- endcomment -%}
item.variant                        {%- comment -%} Biến thể {%- endcomment -%}
item.title                          {%- comment -%} Tên {%- endcomment -%}
item.quantity                       {%- comment -%} Số lượng {%- endcomment -%}
item.price | money                  {%- comment -%} Đơn giá {%- endcomment -%}
item.line_price | money             {%- comment -%} Thành tiền {%- endcomment -%}
item.url                            {%- comment -%} Đường dẫn {%- endcomment -%}
item.image                          {%- comment -%} Hình ảnh {%- endcomment -%}
item.sku                            {%- comment -%} Mã SKU {%- endcomment -%}
item.properties                     {%- comment -%} Thuộc tính tuỳ chỉnh {%- endcomment -%}
```

## Các filter quan trọng

### Tiền tệ

```liquid
{{ product.price | money }}                    → $10.00
{{ product.price | money_with_currency }}      → $10.00 USD
{{ product.price | money_without_currency }}   → 10.00
{{ product.price | money_without_trailing_zeros }} → $10
```

### Hình ảnh

```liquid
{{ image | image_url: width: 600 }}
{{ image | image_url: width: 600, height: 400, crop: 'center' }}
{{ product | image_url: width: 300 }}
```

### Chuỗi ký tự

```liquid
{{ 'xin chao' | capitalize }}        → Xin chao
{{ 'xin chao' | upcase }}            → XIN CHAO
{{ tieu_de | truncate: 50 }}         → "Lorem ipsum dol..."
{{ tieu_de | truncatewords: 10 }}
{{ tieu_de | handleize }}            → "ten-san-pham"
{{ noi_dung_html | strip_html }}
{{ van_ban | escape }}
{{ van_ban | url_encode }}
{{ van_ban | newline_to_br }}
{{ van_ban | replace: 'cu', 'moi' }}
{{ van_ban | split: ',' }}
{{ van_ban | strip }}
```

### Mảng

```liquid
{{ mang | first }}                   {%- comment -%} Phần tử đầu tiên {%- endcomment -%}
{{ mang | last }}                    {%- comment -%} Phần tử cuối cùng {%- endcomment -%}
{{ mang | size }}                    {%- comment -%} Số phần tử {%- endcomment -%}
{{ mang | join: ', ' }}              {%- comment -%} Nối thành chuỗi {%- endcomment -%}
{{ mang | sort }}                    {%- comment -%} Sắp xếp {%- endcomment -%}
{{ mang | where: 'available', true }} {%- comment -%} Lọc theo điều kiện {%- endcomment -%}
{{ mang | map: 'title' }}            {%- comment -%} Trích xuất thuộc tính {%- endcomment -%}
{{ mang | concat: mang_khac }}       {%- comment -%} Nối hai mảng {%- endcomment -%}
{{ mang | uniq }}                    {%- comment -%} Loại bỏ trùng lặp {%- endcomment -%}
```

### Đường dẫn URL

```liquid
{{ 'style.css' | asset_url }}                  {%- comment -%} URL file asset {%- endcomment -%}
{{ 'image.png' | asset_url }}                  {%- comment -%} URL ảnh asset {%- endcomment -%}
{{ product.url | within: collection }}         {%- comment -%} URL SP trong BST {%- endcomment -%}
{{ 'products' | url_for_type: product.type }}  {%- comment -%} URL theo loại SP {%- endcomment -%}
{{ page.url }}                                 {%- comment -%} URL trang {%- endcomment -%}
{{ routes.cart_url }}                           {%- comment -%} URL giỏ hàng {%- endcomment -%}
{{ routes.account_url }}                        {%- comment -%} URL tài khoản {%- endcomment -%}
{{ routes.account_login_url }}                  {%- comment -%} URL đăng nhập {%- endcomment -%}
{{ routes.search_url }}                         {%- comment -%} URL tìm kiếm {%- endcomment -%}
```

### Ngày tháng

```liquid
{{ article.published_at | date: '%B %d, %Y' }}  → March 18, 2026
{{ article.published_at | date: '%d/%m/%Y' }}    → 18/03/2026
{{ 'now' | date: '%Y' }}                         → 2026
```

## Các tag quan trọng

### Điều kiện

```liquid
{%- if dieu_kien -%}...{%- elsif khac -%}...{%- else -%}...{%- endif -%}
{%- unless dieu_kien -%}...{%- endunless -%}
{%- case bien -%}{%- when 'gia_tri' -%}...{%- endcase -%}
```

### Vòng lặp

```liquid
{%- for item in mang -%}
  {{ forloop.index }}      {%- comment -%} Thứ tự: 1, 2, 3... {%- endcomment -%}
  {{ forloop.index0 }}     {%- comment -%} Thứ tự từ 0: 0, 1, 2... {%- endcomment -%}
  {{ forloop.first }}      {%- comment -%} Phần tử đầu tiên? true/false {%- endcomment -%}
  {{ forloop.last }}       {%- comment -%} Phần tử cuối cùng? true/false {%- endcomment -%}
  {{ forloop.length }}     {%- comment -%} Tổng số phần tử {%- endcomment -%}
{%- endfor -%}

{%- for product in collection.products limit: 8 offset: 2 -%}
  {%- comment -%} Giới hạn 8 sản phẩm, bỏ qua 2 sản phẩm đầu {%- endcomment -%}
{%- endfor -%}
```

### Biến

```liquid
{%- assign bien = 'gia_tri' -%}                          {%- comment -%} Gán giá trị {%- endcomment -%}
{%- capture bien -%}...noi_dung...{%- endcapture -%}     {%- comment -%} Bắt nội dung vào biến {%- endcomment -%}
{%- increment dem -%}                                     {%- comment -%} Tăng bộ đếm {%- endcomment -%}
{%- decrement dem -%}                                     {%- comment -%} Giảm bộ đếm {%- endcomment -%}
```

### Biểu mẫu (Form)

```liquid
{%- form 'product', product -%}
  <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
  <button type="submit">Thêm vào giỏ</button>
{%- endform -%}

{%- form 'contact' -%}...{%- endform -%}                           {%- comment -%} Form liên hệ {%- endcomment -%}
{%- form 'customer_login' -%}...{%- endform -%}                    {%- comment -%} Form đăng nhập {%- endcomment -%}
{%- form 'create_customer' -%}...{%- endform -%}                   {%- comment -%} Form đăng ký {%- endcomment -%}
{%- form 'customer_address', customer.new_address -%}...{%- endform -%}  {%- comment -%} Form địa chỉ {%- endcomment -%}
{%- form 'recover_customer_password' -%}...{%- endform -%}         {%- comment -%} Form quên mật khẩu {%- endcomment -%}
```

### Phân trang

```liquid
{%- paginate collection.products by 24 -%}
  {%- for product in collection.products -%}
    ...
  {%- endfor -%}

  {{ paginate | default_pagination }}
{%- endpaginate -%}
```

### Khai báo Schema (chỉ dùng trong Section)

```liquid
{% schema %}
{
  "name": "Tên Section",
  "settings": [],
  "blocks": [],
  "presets": []
}
{% endschema %}
```

## Các đường dẫn Ajax API

| Đường dẫn | Phương thức | Mô tả |
| --- | --- | --- |
| `/cart.js` | GET | Lấy dữ liệu giỏ hàng |
| `/cart/add.js` | POST | Thêm sản phẩm vào giỏ |
| `/cart/update.js` | POST | Cập nhật số lượng |
| `/cart/change.js` | POST | Thay đổi sản phẩm trong giỏ |
| `/cart/clear.js` | POST | Xoá toàn bộ giỏ hàng |
| `/search/suggest.json` | GET | Tìm kiếm dự đoán |
| `/products/<handle>.js` | GET | Lấy dữ liệu sản phẩm |
| `/collections/<handle>/products.json` | GET | Lấy sản phẩm trong bộ sưu tập |

## Mẫu code thường dùng

### Thêm vào giỏ hàng

```javascript
async function themVaoGio(variantId, soLuong = 1) {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: variantId, quantity: soLuong }]
    })
  });
  return response.json();
}
```

### Tìm kiếm dự đoán

```javascript
async function timKiem(tuKhoa) {
  const response = await fetch(
    `/search/suggest.json?q=${encodeURIComponent(tuKhoa)}&resources[type]=product,page,article&resources[limit]=4`
  );
  return response.json();
}
```
