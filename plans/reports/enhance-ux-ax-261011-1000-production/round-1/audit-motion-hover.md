### Thay the transition: all bang cac thuoc tinh animate cu the [assets/cart-modal.css:327]
[id: MH-01] [severity: Medium] [category: Motion]
- Files: assets/cart-modal.css:329, assets/cart.css:478, assets/collection.css:253,556,590, assets/customer.css:690, assets/float-social.css:32, assets/header.css:61,73, assets/megamenu.css:200, assets/newsletter-modal.css:11, assets/page-faq.css:300, assets/quickview-modal.css:9, assets/theme.css:262,269,282,296, assets/variant-picker.css:49.
- Evidence: `transition: all 0.2s;`, `transition: all 0.3s;`, `transition: all var(--transition-slow);`
- Impact: Thuộc tính `all` kích hoạt trình duyệt tái tính toán mọi thay đổi layout (reflow/repaint) thay vì chỉ chạy trên compositor thread với transform/opacity, gây giật khung hình (jank) khi hover hoặc mở modal.
- Fix: Thay thế `transition: all` bằng các thuộc tính cụ thể cần animate, ví dụ: `transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast);`.
- Verify: Kiểm tra bằng Styles panel trong DevTools xác nhận không còn khai báo `transition: all` trên các bộ chọn này.

### Loai bo transition tren cac thuoc tinh layout gay giat khung hinh [assets/product-card.css:248]
[id: MH-02] [severity: Medium] [category: Motion]
- Files: assets/product-card.css:250, assets/product.css:290, assets/footer.css:155,168, assets/megamenu.css:93,171.
- Evidence:
  - `assets/product-card.css:250`: `.product-card--special .product-card__stock-fill { transition: width 0.6s ease; }`
  - `assets/product.css:290`: `.product-template__description.is-collapsed { transition: max-height var(--transition-base); }`
  - `assets/footer.css:168`: `global-footer .footer-actions-menu__list { transition: max-height 0.3s ease, visibility 0s linear 0.3s; }`
  - `assets/megamenu.css:171`: `.megamenu__link:hover { padding-left: var(--space-xs); transition: color var(--transition-fast), padding-left var(--transition-fast); }`
- Impact: Animate trên thuộc tính hình học/layout (`width`, `max-height`, `padding-left`) ép render engine chạy layout pass liên tục trong mỗi frame, gây giật trên thiết bị di động cấu hình trung bình.
- Fix: Với thanh tiến độ (stock fill), chuyển sang dùng `transform: scaleX(...)` với `transform-origin: left;`. Với menu footer/accordion, dùng CSS Grid animation `grid-template-rows: 0fr -> 1fr`. Với link megamenu, thay `padding-left` bằng `transform: translateX(...)`.
- Verify: Profiling trên Chrome Performance DevTools không phát sinh Recalculate Style & Layout spikes trong quá trình animation.

### Chuan hoa thoi luong transition ve tokens --transition-* [assets/collection.css:250]
[id: MH-03] [severity: Medium] [category: Motion]
- Files: assets/collection.css:253,556,962, assets/cart.css:478, assets/cart-modal.css:329, assets/theme.css:282, assets/footer.css:168, assets/article.css:103, assets/page-faq.css:160, sections/slideshow.liquid:488, sections/hero.liquid:474.
- Evidence: Khai báo thô `transition: all 0.2s;`, `transition: opacity 0.2s ease, transform 0.2s ease;`, `transition: all 0.8s;`, `transition: all 0.45s !important;`.
- Impact: Thời gian chuyển động không nhất quán trong cùng hệ thống UI (nút hero dùng 0.2s, slideshow 0.2s, article 0.3s, theme.css dùng 150ms/300ms), phá vỡ nhịp điệu chuyển động của thương hiệu.
- Fix: Quy chuẩn toàn bộ về CSS custom properties trong design system: `--transition-fast` (150ms), `--transition-base` (300ms), `--transition-slow` (500ms).
- Verify: Grep `0.2s`, `0.3s`, `0.8s` trong `assets/*.css` không còn xuất hiện trên thuộc tính transition.

### Loai bo keyframe animations lap vo tan khong can thiet va keyframe chet [assets/float-social.css:8]
[id: MH-04] [severity: Medium] [category: Motion]
- Files: assets/float-social.css:9,64, assets/product-card.css:251,270, assets/countdown-banner.css:161-163.
- Evidence:
  - `assets/float-social.css:64`: `.float-social-pulse { animation: float-social-pulse 2s infinite; }`
  - `assets/product-card.css:251`: `.product-card--special .product-card__stock-fill--hot { animation: stockPulse 2s ease-in-out infinite; }`
  - `assets/countdown-banner.css:161`: `@keyframes countdown-pulse { ... }` (khai báo nhưng không có bộ chọn nào sử dụng).
- Impact: Keyframes vô tận tạo tải liên tục trên compositor và pin thiết bị di động dù người dùng không tương tác; keyframe rác làm tăng dung lượng CSS.
- Fix: Bỏ hiệu ứng pulse vô tận hoặc giới hạn lặp 3 lần (`animation-iteration-count: 3`); xóa keyframe `@keyframes countdown-pulse` không dùng trong countdown-banner.css.
- Verify: Kiểm tra Elements panel: các phần tử tĩnh không còn chạy animation loops liên tục sau khi tải trang.

### Bo sung fallback no-js cho cac phan tu fade-in va anh co opacity ban dau bang 0 [assets/base.css:72]
[id: MH-05] [severity: High] [category: Motion]
- Files: assets/base.css:74-75, assets/page-about.css:238-242, assets/page-stores.css:144-145.
- Evidence:
  - `assets/base.css:74`: `.scroll-fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }`
  - `assets/page-about.css:239`: `.about-reveal-item { opacity: 0; transform: translateY(30px); }`
  - `assets/page-stores.css:144`: `.stores-card__media img { opacity: 0; transition: opacity var(--transition-base)... }` và chỉ hiện khi có `.is-loaded`.
- Impact: Nếu trình duyệt tắt JS, mạng chặn script hoặc hydration script bị lỗi runtime trước khi observer chạy, toàn bộ nội dung mang class `.scroll-fade-up`, `.about-reveal-item` và toàn bộ ảnh cửa hàng bị ẩn vĩnh viễn (`opacity: 0`).
- Fix: Bổ sung quy tắc fallback `.no-js .scroll-fade-up, .no-js .about-reveal-item, .no-js .stores-card__media img { opacity: 1 !important; transform: none !important; }`.
- Verify: Tắt JavaScript trong trình duyệt, tải lại trang: toàn bộ nội dung văn bản và hình ảnh phải hiển thị đầy đủ ngay lập tức.

### Dieu chinh transition visibility/opacity tren modal va drawer tranh an muc tieu focus [assets/cart-modal.css:8]
[id: MH-06] [severity: Medium] [category: Motion]
- Files: assets/cart-modal.css:8-14, assets/cart.css:475-481, assets/collection.css:984-989, assets/customer.css:687-692, assets/newsletter-modal.css:8-12.
- Evidence: `assets/cart-modal.css:11`: `opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0s linear 0.3s;` kết hợp với `cart-modal.cart-modal-wrapper.show { opacity: 1; visibility: visible; }`.
- Impact: Khi mở drawer hoặc modal, nếu JS chuyển focus ngay vào input hoặc nút đóng trước khi transition kết thúc hoặc ngược lại, người dùng bàn phím/screen reader có thể bị kẹt hoặc focus vào phần tử đang có `visibility: hidden` (DESIGN.md: overlay visible before focus moves).
- Fix: Đảm bảo visibility chuyển sang `visible` ngay lập tức khi thêm class show (`transition: opacity 0.3s, visibility 0s;`).
- Verify: Táp phím Tab ngay khi mở modal/drawer: ô focus viền xanh/cam phải xuất hiện rõ ràng trên phần tử đầu tiên mà không bị ẩn.

### Boc cac quy tac hover phong to va bien doi trong @media (hover: hover) [assets/product-card.css:18]
[id: MH-07] [severity: High] [category: Hover]
- Files: assets/product-card.css:19,23,100,111, assets/article-card.css:6,10, assets/header.css:74, assets/collection.css:962.
- Evidence:
  - `assets/product-card.css:19`: `.product-card:hover .product-card__media-image { transform: scale(1.04); }`
  - `assets/product-card.css:100`: `.product-card__quickview:hover { transform: translateY(-3px); }`
  - `assets/article-card.css:6`: `.article-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }`
- Impact: Trên màn hình cảm ứng di động/máy tính bảng (iOS Safari, Android Chrome), hiệu ứng hover không được bọc `@media (hover: hover)` dẫn đến hiện tượng "sticky hover" (chạm vào sản phẩm để cuộn hoặc chọn nhưng thẻ giữ nguyên trạng thái hover) hoặc buộc người dùng phải chạm hai lần (double-tap) mới kích hoạt được link.
- Fix: Bọc toàn bộ các rule hover có chứa `transform: scale`, `transform: translateY` hoặc ẩn/hiện nút hành động trong `@media (hover: hover) and (pointer: fine) { ... }`.
- Verify: Mở trang trên AntiFan hoặc Chrome DevTools ở chế độ Device Mode (Touch enabled), chạm vào thẻ sản phẩm: không bị dính trạng thái zoom ảnh hoặc hiển thị nút lơ lửng.

### Bo sung :focus-within cho menu con cap 2 cua megamenu dang chi mo tren :hover [assets/megamenu.css:175]
[id: MH-08] [severity: High] [category: Hover]
- Files: assets/megamenu.css:177,180,267,268.
- Evidence:
  - `assets/megamenu.css:177`: `.megamenu__item .megamenu__dropdown ... .megamenu__link-parent:hover > .megamenu__sublinks { opacity: 1; visibility: visible; transform: translateX(0); }`
  - `assets/megamenu.css:267`: `.megamenu__item .megamenu__dropdown ... .megamenu__simple-parent:hover > .megamenu__simple-sub { opacity: 1; visibility: visible; transform: translateX(0); }`
- Impact: Khối menu con cấp 2 và cấp 3 chỉ mở khi con chuột di qua (`:hover`). Người dùng điều hướng bằng bàn phím (phím Tab) khi duyệt qua link cha sẽ nhảy vào các link con bên trong trong khi menu con vẫn hoàn toàn bị ẩn (`opacity: 0; visibility: hidden;`), tạo ra bẫy focus vô hình nghiêm trọng (vi phạm WCAG 2.4.7 và 2.1.1).
- Fix: Bổ sung bộ chọn `:focus-within`: `.megamenu__link-parent:hover > .megamenu__sublinks, .megamenu__link-parent:focus-within > .megamenu__sublinks { opacity: 1; visibility: visible; transform: translateX(0); }` (và tương tự cho `.megamenu__simple-parent`).
- Verify: Dùng bàn phím nhấn Tab vào menu cấp 1 rồi cấp 2: menu con cấp 2 và 3 phải tự động mở ra và hiển thị rõ ràng các link đang nhận focus.

### Bo sung :focus-within tren the bai viet tuong duong trang thai :hover [assets/article-card.css:5]
[id: MH-09] [severity: Medium] [category: Hover]
- Files: assets/article-card.css:6,10,31.
- Evidence:
  - `assets/article-card.css:6`: `.article-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }`
  - Không có `.article-card:focus-within`.
- Impact: Khi người dùng di chuột, thẻ bài viết nhấc lên và đổi màu viền báo hiệu vùng tương tác, nhưng khi điều hướng bằng phím Tab vào link bài viết bên trong thẻ thì không có phản hồi tương đương ở cấp độ thẻ.
- Fix: Thêm `.article-card:focus-within { border-color: var(--color-primary); }`.
- Verify: Nhấn Tab vào tiêu đề bài viết: đường viền thẻ đổi màu sang primary tương đương trạng thái hover.

### Bo sung mau nen phan hoi hover cho nhom button-secondary [assets/theme.css:80]
[id: MH-10] [severity: Medium] [category: Hover]
- Files: assets/theme.css:80-92, sections/image-text-overlay.liquid:119.
- Evidence:
  - `assets/theme.css:80-92`: `.button-secondary { background: transparent; border: var(--border-width) solid currentColor; ... }` không định nghĩa bất kỳ quy tắc `:hover` nào cho background-color hay border-color.
  - `sections/image-text-overlay.liquid:119`: `.section-ito__btn--secondary { background: transparent; color: #fff; border: 2px solid rgba(255, 255, 255, 0.6); }` không có `:hover`.
- Impact: Nút phụ (secondary button) khi hover chỉ nhận được dịch chuyển nhẹ từ `:where(...)` nhưng không có thay đổi sắc thái màu nền hoặc viền, tạo cảm giác phản hồi nút kém rõ ràng so với nút chính.
- Fix: Bổ sung cho `.button-secondary:hover`: `background: rgba(var(--color-foreground), 0.08); border-color: currentColor;`.
- Verify: Di chuột vào các nút phụ trong theme: xuất hiện nền mờ nhẹ tương phản rõ ràng.

### Bo sung :focus-visible cho triggers cua tabs va accordion [sections/tabs.liquid:108]
[id: MH-11] [severity: High] [category: Hover]
- Files: sections/tabs.liquid:111, sections/collapsible-content.liquid:86.
- Evidence:
  - `sections/tabs.liquid:111`: `.section-tabs__trigger:hover { color: rgb(var(--color-foreground)); }`
  - `sections/collapsible-content.liquid:86`: `.section-collapsible__trigger:hover { color: rgb(var(--color-accent)); }`
  - Cả hai file đều hoàn toàn thiếu khai báo `:focus-visible` cho các nút trigger tab và accordion.
- Impact: Người dùng bàn phím khi Tab qua các tab hoặc danh sách câu hỏi FAQ không thấy chỉ báo tiêu điểm (focus ring), không biết phần tử nào đang sẵn sàng được Enter/Space kích hoạt.
- Fix: Bổ sung quy tắc focus-visible: `.section-tabs__trigger:focus-visible, .section-collapsible__trigger:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }`.
- Verify: Dùng phím Tab qua danh sách accordion và tabs: viền focus hiển thị rõ ràng trên tiêu đề đang được chọn.

### Loai bo hover giam opacity tren van ban de duy tri tuong phan WCAG [assets/article.css:110]
[id: MH-12] [severity: Medium] [category: Hover]
- Files: assets/announcement-bar.css:27, assets/article.css:112, assets/blog.css:169, assets/cart-modal.css:151,232, assets/collection.css:387,962,1116,1144.
- Evidence:
  - `assets/announcement-bar.css:27`: `.announcement-bar__text.announcement-bar__link:hover { opacity: 0.8; }`
  - `assets/article.css:112`: `.article-template__content a:hover { opacity: 0.8; }`
  - `assets/collection.css:1144`: `.collection-desc__toggle:hover { opacity: 0.7; }`
- Impact: Việc giảm opacity văn bản khi hover khiến độ tương phản của chữ so với màu nền giảm xuống dưới chuẩn WCAG AA 4.5:1 (vi phạm nguyên tắc trong DESIGN.md: "Never use opacity-based hover on text; use tokenized color shifts").
- Fix: Thay `opacity: 0.8` bằng việc chuyển đổi màu sắc xác định, ví dụ `color: var(--color-primary);` hoặc `color: rgb(var(--color-button));`.
- Verify: Kiểm tra bằng Color Contrast Analyzer trên trạng thái hover: tỷ lệ tương phản luôn đạt >= 4.5:1.

### Thay padding-left tren hover link megamenu bang transform tranh nhay layout [assets/megamenu.css:170]
[id: MH-13] [severity: Medium] [category: Hover]
- Files: assets/megamenu.css:171,174, assets/footer.css:198,203.
- Evidence:
  - `assets/megamenu.css:174`: `.megamenu__link:hover { color: var(--color-primary); padding-left: var(--space-xs); }`
  - `assets/footer.css:203`: `global-footer .footer-copyright a:hover { text-decoration-thickness: 2px; }`
- Impact: Khi di chuột qua các link trong megamenu, `padding-left: var(--space-xs)` khiến văn bản và icon bị thụt lề 8px, làm layout các dòng xung quanh bị rung lắc và dễ trượt con trỏ chuột ra ngoài link.
- Fix: Thay thế việc tăng `padding-left` bằng `transform: translateX(4px)` để chuyển dịch visual trên GPU layer mà không làm thay đổi box model hay vị trí luồng văn bản thực tế.
- Verify: Di chuột vào các link menu cột: không có sự xô lệch box model hay nhảy lề layout.

### Khong dung outline: none ma thieu vien chi bao focus thay the dat chuan [assets/cart.css:92]
[id: MH-14] [severity: High] [category: Focus]
- Files: assets/collection.css:85,470, assets/cart.css:95,122, assets/footer.css:270, assets/page-faq.css:98, assets/page-stores.css:62.
- Evidence:
  - `assets/collection.css:470`: `.facet-filter__price-preset:focus:not(:focus-visible) { outline: none; }`
  - `assets/cart.css:95`: `.cart-template__note textarea:focus:not(:focus-visible) { outline: none; }`
  - `assets/page-stores.css:62`: `.stores-sidebar__search-input:focus-visible { outline: none; }`
- Impact: Xóa bỏ outline mặc định mà không cung cấp viền focus thay thế có độ tương phản cao, làm mất dấu vết tiêu điểm của người dùng bàn phím khi điều hướng form ghi chú giỏ hàng và bộ lọc giá.
- Fix: Đảm bảo mọi trạng thái focus đều có vòng bao tương phản: `outline: 2px solid var(--color-primary); outline-offset: 2px;` hoặc `box-shadow: 0 0 0 2px rgb(var(--color-background)), 0 0 0 4px var(--color-primary);`.
- Verify: Nhấn Tab vào các input và nút preset bộ lọc: viền focus luôn hiển thị rõ ràng.

### Dung :focus-visible thay vi :focus tren cac bo chon toan cuc [assets/theme.css:43]
[id: MH-15] [severity: Medium] [category: Focus]
- Files: assets/theme.css:44-48, assets/product.css:225, assets/article.css:241.
- Evidence: `assets/theme.css:44-48`:
  `a:focus, button:focus, input:focus, select:focus, textarea:focus { outline: 2px solid var(--color-primary); outline-offset: 2px; }`
- Impact: Sử dụng `:focus` thay vì `:focus-visible` trên các bộ chọn toàn cục khiến mỗi khi người dùng click chuột vào nút bấm hoặc link, trình duyệt lập tức vẽ viền outline xung quanh phần tử, gây mất thẩm mỹ cho người dùng chuột thông thường.
- Fix: Đổi `:focus` thành `:focus-visible` để chỉ hiển thị outline khi điều hướng bằng bàn phím hoặc công cụ hỗ trợ.
- Verify: Click chuột vào nút bấm bất kỳ: không xuất hiện outline viền; nhấn Tab tới nút bấm: outline viền xuất hiện chuẩn xác.

### Loai bo cac khai bao !important trong CSS component theo quy tac du an [assets/collection.css:850]
[id: MH-16] [severity: High] [category: CSS Rules]
- Files: assets/collection.css:852,854, assets/customer.css:237,242, assets/megamenu.css:299,301,302,310,311,312, assets/page-contact.css:1, assets/product-card.css:122, assets/product.css:217, assets/theme.css:249, sections/slideshow.liquid:524.
- Evidence:
  - `assets/collection.css:852`: `display: flex !important; grid-template-columns: none !important;`
  - `assets/customer.css:242`: `color: rgb(var(--color-button-text)) !important;`
  - `assets/page-contact.css:1`: `global-footer { margin-top: 0 !important; }`
  - `assets/megamenu.css:299`: `flex: auto !important; width: 100% !important;`
- Impact: Vi phạm trực tiếp quy tắc dự án ("no !important in component rules"), phá vỡ tầng kế thừa CSS (cascade specificity), gây xung đột khó bảo trì khi merchant tùy biến layout hoặc đổi template.
- Fix: Tái cấu trúc bộ chọn CSS với độ ưu tiên đúng bằng BEM class hoặc sắp xếp thứ tự cascade trong file CSS thay vì ép `!important`.
- Verify: Kiểm tra bằng script grep `!important` trong `assets/*.css`: loại bỏ hoàn toàn các trường hợp không thuộc reset/utility toàn cục.

### Thay ma mau hex/rgb co dinh bang token mau theo color scheme [assets/collection.css:555]
[id: MH-17] [severity: High] [category: CSS Rules]
- Files: assets/collection.css:558,560,561,564, assets/countdown-banner.css:6,80, assets/gift-card.css:5,7,8,12,18,22, assets/float-social.css:129-140, assets/product.css:334, assets/product-card.css:251.
- Evidence:
  - `assets/collection.css:558`: `background: #fee2e2; border-color: #fca5a5;`
  - `assets/countdown-banner.css:6`: `background: var(--countdown-bg, #1a1a2e); color: var(--countdown-text, #fff);`
  - `assets/product.css:334`: `#dfcce7`, `#ddfce7`, `#fee8cd`
  - `assets/product-card.css:251`: `#ef4444`, `#f97316`
- Impact: Vi phạm quy tắc "literal hex/rgb colours where a token exists" và làm giao diện bị lệch tone màu khi chuyển qua các preset khác nhau (Noir, Vibrant, Botanical, Cyber) hoặc khi bật chế độ nền tối (Dark scheme).
- Fix: Thay thế toàn bộ mã hex cứng bằng CSS custom properties từ `snippets/head-design-systems.liquid` và `head-color-schemes.liquid` (như `var(--color-primary)`, `rgb(var(--color-button))`, `var(--color-error-text)`).
- Verify: Đổi sang preset Botanical hoặc Cyber trong settings_data: các thẻ filter và banner tự động đồng bộ theo bảng màu mới mà không bị dính màu hồng pastel #fee2e2.

### Chuyen doi cac media query max-width sang mobile-first min-width [assets/variant-picker.css:50]
[id: MH-18] [severity: High] [category: CSS Rules]
- Files: assets/article.css:148,257,368,449, assets/cart-modal.css:40,153, assets/cart.css:509, assets/collection.css:638,658,670,685,721,819,1027, assets/customer.css:347,717, assets/float-social.css:148, assets/header.css:8,23,53,68,91,100, assets/variant-picker.css:52,55,80.
- Evidence:
  - `assets/variant-picker.css:52`: `@media (max-width: 768px)` và line 55: `@media (max-width: 576px)`
  - `assets/header.css:8`: `@media (max-width: 1023px)`
  - `assets/collection.css:638`: `@media (max-width: 749px)`
- Impact: Vi phạm trực tiếp quy chuẩn "mobile-first @media (min-width: ...)" của dự án. Việc lạm dụng `max-width` với các breakpoint phân mảnh (575px, 576px, 639px, 749px, 767px, 768px, 1023px) làm tăng nguy cơ đè đè CSS không kiểm soát khi thu phóng màn hình và khó bảo trì.
- Fix: Viết lại CSS theo hướng Mobile-first: định nghĩa style cơ sở cho màn hình nhỏ, sau đó bọc các mở rộng cho tablet/desktop trong `@media (min-width: 750px)` và `@media (min-width: 1024px)`.
- Verify: Quét `max-width` trong `assets/*.css`: các truy vấn media đều được chuẩn hóa sang `min-width` với các breakpoint chuẩn 750px, 1024px.

### Chuan hoa thang gia tri va fallback z-index theo he thong token [assets/header.css:3]
[id: MH-19] [severity: Medium] [category: CSS Rules]
- Files: assets/header.css:5, assets/cart-modal.css:8, assets/collection.css:984, assets/customer.css:687, assets/mobile-menu.css:4, assets/megamenu.css:195,287, sections/slideshow.liquid:534,587,640.
- Evidence:
  - `assets/header.css:5`: `global-header { z-index: var(--z-header, 100); }` (trong khi design system định nghĩa `--z-header: 49`, fallback 100 làm header đè lên dropdown nếu biến chưa nạp).
  - `assets/cart-modal.css:8`: `z-index: var(--z-modal, 250);` (trong khi token `--z-modal` là 9000, fallback 250 là giá trị tùy tiện nằm ngoài scale).
  - `assets/megamenu.css:195`: `z-index: 10;` (số nguyên tùy ý).
- Impact: Giá trị z-index nằm ngoài thang đo chuẩn (`--z-header: 49`, `--z-float: 90`, `--z-dropdown: 100`, `--z-sticky: 200`, `--z-toast: 900`, `--z-modal: 9000`, `--z-overlay: 9500`) dẫn đến nguy cơ các phần tử đè lên nhau sai thứ tự khi nhiều overlay/drawer cùng xuất hiện.
- Fix: Chuẩn hóa toàn bộ fallback và giá trị z-index theo đúng biến trong thang đo `--z-*` của design system.
- Verify: Kiểm tra stacking context trên DevTools đảm bảo header, dropdown, sticky, toast và modal hiển thị đúng thứ tự phân lớp.

### Tranh style truc tiep the tran de khong lam vo cac app ben thu ba [assets/theme.css:32]
[id: MH-20] [severity: Medium] [category: CSS Rules]
- Files: assets/theme.css:32-48, assets/gift-card.css:4, assets/reset.css:61,125,136,143.
- Evidence:
  - `assets/theme.css:34`: `:where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]), select, textarea) { border-radius: var(--inputs-radius); }`
  - `assets/theme.css:44-48`: `a:focus, button:focus, input:focus, select:focus, textarea:focus { ... }`
- Impact: Định kiểu thương hiệu trực tiếp lên các thẻ HTML trần (`button`, `a`, `input`, `textarea`) vi phạm quy tắc opt-in BEM classes của dự án, có thể làm vỡ layout của các Shopify App nhúng hoặc widget bên thứ ba tiêm vào trang.
- Fix: Chuyển các kiểu dáng thương hiệu thành class BEM rõ ràng (`.button`, `.field__input`) thay vì áp dụng trực tiếp lên thẻ trần toàn cục.
- Verify: Nhúng widget form hoặc review của bên thứ ba: không bị ảnh hưởng style viền hoặc outline ngoài ý muốn.

### Ket noi bien border-radius the san pham va variant pills voi token preset [assets/product-card.css:10]
[id: MH-21] [severity: High] [category: CSS Rules]
- Files: snippets/head-design-systems.liquid:117,127,139,171, assets/variant-picker.css:45, assets/product-card.css:12,28, assets/countdown-banner.css:87.
- Evidence:
  - `assets/variant-picker.css:45`: `.variant-picker__item-label { border-radius: 0.25rem; }` trong khi design system định nghĩa `--variant-pills-radius: {{ settings.variant_pills_radius }}px;` (Rebel là 40px!).
  - `assets/product-card.css:12`: `.product-card__wrapper { border-radius: 0.5rem; }` và line 28: `border-radius: 0.375rem;` trong khi design system định nghĩa `--card-corner-radius: {{ settings.card_corner_radius | divided_by: 10.0 }}rem;` (Rebel là 0 - góc vuông!).
- Impact: Biến preset định hình phong cách thương hiệu (Rebel vuông góc, variant pill bo tròn 40px) bị các file CSS component ghi đè bằng giá trị cứng (thẻ sản phẩm bị bo tròn 8px/6px, variant pills bị vuông chỉ bo 4px), phá vỡ toàn bộ bản sắc Art direction đã nêu trong DESIGN.md.
- Fix:
  - Trong `assets/variant-picker.css`: đổi `border-radius: 0.25rem;` thành `border-radius: var(--variant-pills-radius);`.
  - Trong `assets/product-card.css`: đổi `border-radius: 0.5rem;` thành `border-radius: var(--card-corner-radius);`.
  - Trong `assets/countdown-banner.css`: đổi `border-radius: 0.375rem;` thành `border-radius: var(--buttons-radius);`.
- Verify: Tải trang sản phẩm và trang chủ với preset Rebel: thẻ sản phẩm có góc vuông sắc nét (`0px`), variant pills có góc bo tròn viên thuốc mềm mại (`40px`).

### Loai bo file CSS chet assets/index.css khoi trang chu de toi uu LCP [snippets/head-stylesheets.liquid:13]
[id: MH-22] [severity: Medium] [category: Performance]
- Files: snippets/head-stylesheets.liquid:15, assets/index.css:1-697.
- Evidence:
  - `snippets/head-stylesheets.liquid:15`: `{%- if template == 'index' -%}{{ 'index.css' | asset_url | stylesheet_tag }}{%- endif -%}`
  - Trong `assets/index.css`: toàn bộ 697 dòng chứa các class như `.section-trending__*`, `.section-lookbook__*`, `.section-slider__*`, `.section_index--product-banner` không hề tồn tại trong bất kỳ section hoặc snippet nào của theme.
- Impact: Trình duyệt phải tải thêm một file CSS chết 697 dòng render-blocking trên trang chủ (đường dẫn LCP trọng yếu), gây lãng phí băng thông và làm chậm chỉ số FCP/LCP.
- Fix: Xóa dòng nạp `index.css` trong `snippets/head-stylesheets.liquid` và dọn dẹp file `assets/index.css`.
- Verify: Kiểm tra Network tab trên trang chủ: không còn yêu cầu tải `index.css`, giao diện trang chủ không thay đổi bất kỳ pixel nào.

### Bo sung cursor: pointer cho cac the active filter tags [assets/collection.css:552]
[id: MH-23] [severity: Low] [category: Cursor]
- Files: assets/collection.css:554,586.
- Evidence:
  - `assets/collection.css:554`: `.facet-filters__active-tag { ... }`
  - `assets/collection.css:586`: `.collection-active-filters__tag { ... }`
  - Cả hai tag xóa bộ lọc đang hoạt động đều là các phần tử tương tác dạng nút bấm nhưng thiếu khai báo `cursor: pointer;`.
- Impact: Người dùng di chuột vào tag bộ lọc để xóa thì con trỏ chuột không đổi thành dạng bàn tay (pointer), tạo cảm giác đây chỉ là nhãn tĩnh thay vì một nút xóa tương tác.
- Fix: Thêm `cursor: pointer;` vào `.facet-filters__active-tag` và `.collection-active-filters__tag`.
- Verify: Di chuột vào nhãn active filter tag trên trang collection: con trỏ chuột lập tức đổi sang dạng pointer.
