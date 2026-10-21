Vòng 4 sửa được 13/50 lỗi round-1 và 5/11 lỗi round-3; không lỗi nào tệ hơn. Có hai lỗi không đánh giá được (R1-#7 và R3-#7). Lỗi lớn còn lại: home vẫn không có H1, footer chỉ có một link, trang sản phẩm thiếu thông tin giao hàng/đổi trả, và comment demo bị cắt giữa câu. Tôi ghi thêm 10 lỗi mới; 2 lỗi đáng chú ý nhất là cột Filter bị cắt mất các size và câu copy viết cho merchant đang hiện trên trang About.

Đường dẫn ảnh tính từ `plans/reports/enhance-ux-ax-261021-0253-theme-store-audit/round-4/capture/`.

## 1. Trạng thái các lỗi cũ

**Round 1**
- R1-#1: FIXED — `tablet-home-first.png`, `mobile-home-first.png`: slide 1 có heading, CTA trắng "Shop the collection", nút pause và thanh trang; hero kết thúc trong màn hình đầu (y≈963 tablet, y≈760 mobile).
- R1-#2: FIXED — `desktop-home-full.png`, `mobile-home-full.png`: khối "PIECE OF THE WEEK" không còn hiển thị.
- R1-#3: FIXED — `desktop-home-full.png`, `mobile-home-full.png`: dải Journal trống đã được bỏ đi (section không còn, chứ không trỏ sang blog).
- R1-#4: FIXED — `tablet-faq-full.png`: không còn câu "Tell visitors…"; thay bằng "Ask the studio" và copy viết cho khách.
- R1-#5: STILL OPEN — `desktop-home-full.png` y≈748–796: nút "Discover" ở slide 2 vẫn xám (đo được (200,200,200)). Có thể đây là hiệu ứng fade chụp đúng lúc nửa chừng, vì nút trắng ở 78% opacity trên nền tối cho ra đúng màu này.
- R1-#6: STILL OPEN — `desktop-home-loaded.png`, `desktop-home-full.png`: slide 2 vẫn cắt người mẫu ở cằm, mất cả đầu.
- R1-#7: KHÔNG ĐÁNH GIÁ ĐƯỢC — slide 3 không xuất hiện trong ảnh nào (`desktop-home-*`, `tablet-home-first/loaded`, `mobile-home-first/full`). Riêng phần "một kiểu CTA cho mọi slide" vẫn lệch: slide 1 căn trái với nút trắng, slide 2 căn giữa với nút xám.
- R1-#8: FIXED — `mobile-home-full.png` y≈5165–5330: chữ đo được 5.0–5.8:1 so với nền.
- R1-#9: STILL OPEN — `desktop-home-full.png` y≈3570–5285: ảnh before/after vẫn cao khoảng 1715px.
- R1-#10: FIXED — `mobile-home-full.png` y≈1610–1950, `mobile-product-full.png` y≈1860–2300, `mobile-product-gift-card-full.png`: hiện 2 thẻ và một phần thẻ thứ ba.
- R1-#11: FIXED — `desktop-collection-all-first.png`, `mobile-collection-all-first.png`: carousel Best Sellers đã bỏ; Filter, Sort và grid nằm ngay dưới tiêu đề.
- R1-#12: STILL OPEN — `tablet-collection-all-full.png` y≈2130–2170, 2650–2680: giá dạng khoảng khi sale đã đỏ, nhưng giá gạch vẫn nằm riêng một dòng và không có badge %. Sản phẩm một giá thì gạch cùng dòng và có badge, nên vẫn là hai kiểu.
- R1-#13: FIXED — diff `tablet-collection-all-first`/`loaded` chỉ 0.08%, còn đúng dải header y56–70.
- R1-#14: STILL OPEN — `desktop-product-first.png`: chưa có ước tính giao hàng, chưa có thông tin shipping/đổi trả, chưa có link size guide.
- R1-#15: STILL OPEN — `mobile-product-first.png`: đã thấy tiêu đề (y≈692), nhưng giá bị cắt ở mép màn hình (y≈805) và nút Add to cart vẫn nằm dưới.
- R1-#16: STILL OPEN — `desktop-product-gift-card-first.png`: các pill mệnh giá đã ổn (bo tròn, chữ 7.21:1), nhưng chữ "Sold out" trên nút disabled chỉ đạt 2.31:1.
- R1-#17: STILL OPEN — `mobile-product-gift-card-full.png` y≈800–830: vẫn "SKU: N/A" và "Out of stock".
- R1-#18: STILL OPEN — `desktop-blog-full.png`, `tablet-contact-full.png`, `mobile-home-full.png` y≈7350: footer chỉ có SHOP → Search.
- R1-#19: STILL OPEN — `mobile-article-full.png` y≈5600–5870: comment dừng ở "…in disguise. I'" và "…texture and can".
- R1-#20: FIXED — `mobile-article-full.png` y≈3195–3460: bảng cuộn ngang, header không còn gãy chữ.
- R1-#21: FIXED — mọi H1 đều weight regular: `desktop-collection-outerwear-first.png`, `tablet-cart-full.png`, `desktop-product-first.png`, `desktop-article-first.png`.
- R1-#22: STILL OPEN — `desktop-blog-full.png` y≈2537–2827, `tablet-blog-full.png` y≈3620–3913: dải "STAY CONNECTED" vẫn nền trắng #fff với nút Subscribe đen.
- R1-#23: FIXED — `tablet-faq-full.png`: đã có form và nút "Send message".
- R1-#24: STILL OPEN — `../capture-job.log` dòng 1, 17, 33: home có `"h1":0` ở cả 3 viewport.
- R1-#25: STILL OPEN — `desktop-home-full.png` y≈2950 (x≈257 và x≈1207), `mobile-home-full.png` y≈2240: hai hotspot vẫn nằm trên tường.
- R1-#26: FIXED — `desktop-home-full.png` y≈7870–7990: nền sau chữ đo ≈(92,88,85), chữ trắng đạt khoảng 6.8–7.3:1.
- R1-#27: STILL OPEN — `desktop-home-full.png`: "Trending now" và "Shop the lookbook" không có eyebrow; "AS FEATURED IN" vẫn dùng kiểu chữ riêng.
- R1-#28: STILL OPEN — `desktop-home-full.png` y≈2205–2265: còn khoảng trống giữa tiêu đề và giá, "Contact us" vẫn là chữ thường. Grid `desktop-collection-all-full.png` y≈1210–1256 cũng vậy.
- R1-#29: FIXED — `mobile-collection-all-full.png` y≈743–762: hiển thị "$45.00 USD – / $245.00 USD", không còn chữ USD đứng một mình.
- R1-#30: STILL OPEN — eyebrow "DEVS2 REBEL" chỉ có ở `desktop-product-full.png` y≈1957 và trang search, không có ở `desktop-collection-all-full.png`. Phần quick-add nay đã nhất quán theo từng viewport.
- R1-#31: STILL OPEN — `desktop-collections-first.png` y≈302: đường kẻ dừng ở x≈843.
- R1-#32: STILL OPEN — `desktop-collections-first.png`: các collection đều chụp người mẫu trước cùng một bức tường bê tông.
- R1-#33: STILL OPEN — diff first/loaded: header vẫn lệch ở dải y61–77 trên mọi route desktop và y56–70 trên mọi route tablet.
- R1-#34: STILL OPEN — diff product: desktop đổi ở y533–548 và 883–899, tablet y347–362 và 535–632, mobile y548–653. Mũi tên trái trên `mobile-product-first.png` vẫn mờ.
- R1-#35: STILL OPEN — `desktop-article-first.png`: dòng thứ 2 của H1 bị cắt ở mép màn hình (y≈900).
- R1-#36: STILL OPEN (sửa được một nửa) — `mobile-article-full.png`: breadcrumb đã hết dấu "/" đứng đầu dòng, nhưng ở đầu trang TOC vẫn tô sáng mục cuối "Caring for Living Fabrics" (y≈640–780).
- R1-#37: STILL OPEN — `mobile-home-first.png`: chữ "landed" vẫn rơi một mình xuống dòng hai.
- R1-#38: STILL OPEN — `mobile-home-full.png` y≈6946–6969: chữ "noise." vẫn đứng một mình.
- R1-#39: STILL OPEN — `mobile-home-full.png` y≈2123–2333: ảnh lookbook chỉ cao khoảng 210px.
- R1-#40: STILL OPEN — `tablet-blog-full.png` y≈2590–3580: khối "Latest drop" cao khoảng 990px.
- R1-#41: STILL OPEN — `tablet-blog-full.png` có 2 bài "Dressing for the Elements…"; `mobile-article-full.png` y≈4781–4897 có Previous và Next cùng tiêu đề; tác giả vẫn là "Devs2 Admin".
- R1-#42: STILL OPEN (sửa được một nửa) — `tablet-stores-full.png` y≈1419–1441: nhãn bộ lọc đã đúng, nhưng mã bưu chính vẫn ngắt thành "150- / 0034".
- R1-#43: STILL OPEN (sửa được một nửa) — `tablet-cart-full.png`: badge "0" đã mất, nhưng giỏ trống vẫn không gợi ý sản phẩm nào.
- R1-#44: STILL OPEN — `mobile-about-full.png` y≈2555–2840: Julien Moreau vẫn đứng một mình ở hàng hai.
- R1-#45: STILL OPEN — `desktop-product-full.png` y≈1295 và `mobile-article-full.png` y≈4709: icon Facebook và Pinterest dạng đặc, các icon khác dạng nét.
- R1-#46: STILL OPEN — `tablet-product-full.png` y≈630–1400: cột trái trống khoảng 770px.
- R1-#47: STILL OPEN — lọc giá dạng ô From/To ở `desktop-search-full.png` nhưng dạng checkbox theo khoảng ở `desktop-collection-outerwear-full.png`.
- R1-#48: STILL OPEN — `tablet-contact-full.png` y≈330–760: vẫn không có email, số điện thoại hay địa chỉ.
- R1-#49: STILL OPEN — `desktop-about-full.png`: điểm (1400,1500) và (1400,3500) là #FFFFFF, xen với dải màu bone; `mobile-about-full.png` cũng vậy.
- R1-#50: STILL OPEN — `tablet-faq-full.png` không có placeholder và nút ghi "Send message"; `tablet-contact-full.png` có đủ placeholder và nút ghi "Send ▷".

**Round 3**
- R3-#1: FIXED — `mobile-product-full.png` y≈1860–2300: mũi tên không còn đè lên nút quick-add.
- R3-#2: FIXED — `mobile-product-gift-card-full.png` y≈2051–2480: badge "-17%" và nút túi đã tách nhau.
- R3-#3: FIXED — hai đường kẻ giờ kẹp hai bên thanh toolbar chứ không chồng sát nhau: `desktop-collection-all-first.png` y≈257/330, `mobile-collection-all-first.png` y≈242/415, outerwear y≈639/716.
- R3-#4: STILL OPEN — `tablet-product-full.png` y≈630–1400.
- R3-#5: FIXED — `desktop-collection-outerwear-first.png` y≈350: "Outerwear" đã là weight regular.
- R3-#6: FIXED — `mobile-home-full.png` y≈1923–1943.
- R3-#7: KHÔNG ĐÁNH GIÁ — theo ghi chú của anh, ảnh chụp có giới hạn 3 dòng nhưng đã revert, nên tiêu đề dài có thể quay lại [INFERENCE]. Trên mobile không còn mũi tên.
- R3-#8: STILL OPEN — `mobile-article-full.png` y≈138: crumb giữa vẫn bị cắt cùng với crumb cuối.
- R3-#9: STILL OPEN — `mobile-article-full.png` y≈3195–3460: cột phải bị cắt cứng, không có gợi ý là bảng cuộn được.
- R3-#10: STILL OPEN (lỗi chuyển sang desktop) — tablet đã đúng, nhưng `desktop-home-first.png` chỉ có "1/3"; pause và thanh trang chỉ xuất hiện ở `desktop-home-loaded.png`.
- R3-#11: STILL OPEN — `desktop-product-full.png` y≈1480–1940: thẻ gợi ý trên desktop vẫn không hiện nút túi khi chưa hover. Cần anh xác nhận đây có phải chủ ý không.

## 2. Lỗi mới

| # | Severity | Route | Viewport | Screenshot file | What you see | Suggested change |
|---|---|---|---|---|---|---|
| 1 | Med | collection-all | desktop | `desktop-collection-all-full.png` y≈1017–1060 | Cột Filter dừng ở nhóm "Size" đang mở nhưng không có giá trị nào, bên dưới trống trơn. Trang search ít facet hơn nên vẫn hiện đủ S/M/L. [INFERENCE] Nguyên nhân là `assets/collection.css:310–311` (`max-height: calc(100vh…)` + `overflow-y: auto`): danh sách size nằm trong một vùng cuộn lồng mà không có dấu hiệu cuộn. | Bỏ max-height, hoặc thu gọn các nhóm mặc định, hoặc thêm thanh cuộn nhìn thấy được. |
| 2 | Med | about | mobile | `mobile-about-full.png` y≈4500–4715 | Câu viết cho merchant đang hiện trên trang: "This page exists to hold the brand story, studio process, and the people behind the label." | Viết lại cho khách hoặc xoá câu này trong preset. |
| 3 | Low | article | desktop, tablet | `desktop-article-full.png` y≈966/991, `tablet-article-full.png` y≈775/800 | Hai đường kẻ (dưới meta và trên TOC) cách nhau khoảng 25px, cùng kiểu lỗi đã sửa ở collection. | Bỏ border-top của TOC khi nó đứng ngay sau meta. |
| 4 | Low | footer | mobile | `mobile-home-full.png` y≈7399/7428 | Hai đường kẻ cách nhau khoảng 29px giữa "Shop" và COUNTRY/REGION. | Bỏ một trong hai border. |
| 5 | Low | product | desktop, mobile | `desktop-product-full.png` y≈1000–1083, `mobile-product-first.png` y≈548–653 | 4 trên 5 thumbnail bị phủ trắng, nhìn như đang bị vô hiệu hoá. | Giữ thumbnail đủ độ đậm; đánh dấu ảnh đang chọn bằng viền. |
| 6 | Low | collection-all | mobile | `mobile-collection-all-first.png` y≈267–415 | Filter, dòng đếm kèm nút đổi grid/list, và Sort xếp thành 3 hàng, đẩy sản phẩm xuống y≈432. | Đặt Filter và Sort chung một hàng; ẩn nút đổi grid/list dưới 750px. |
| 7 | Low | about, blog | all | `desktop-about-full.png` y≈1273–1688, `desktop-article-first.png`, `tablet-blog-full.png` y≈1190–1417 | Cùng một ảnh dùng cho "Material first" ở About và bài "Bio-Textiles". Ảnh "Designed to be reworn" trông giống ảnh bài "Dressing for the Elements". | Dùng ảnh riêng cho About. |
| 8 | Low | home, about | all | `mobile-home-full.png` y≈3450 và 5768–5860, `mobile-about-full.png` y≈3000–3070 | Số năm không khớp nhau: "Twelve years", "A decade" kèm "EST. 2015", và "12+ YEARS". | Chọn một cách nói (ví dụ "Since 2015") và dùng thống nhất. |
| 9 | Low | footer | all | `tablet-contact-full.png` y≈1475–1544 | Tagline "Streetwear and outerwear built for everyday wear." lệch với định vị tailoring/atelier. | Viết lại tagline cho khớp giọng thương hiệu. |
| 10 | Low | search, collection-all | desktop | `desktop-search-full.png` y≈987–1027, `desktop-collection-all-full.png` y≈951–991 | Bộ lọc "Brand" chỉ có đúng một giá trị "Devs2 Rebel", nên không lọc được gì. | Ẩn các facet chỉ có một giá trị. |

## 3. Chấm điểm (1–5)

- **Hierarchy: 4.** Trang sản phẩm có một nút đỏ chính và một nút viền (`desktop-product-first.png`); trang collection có tiêu đề → toolbar → grid ngay màn hình đầu. Điểm trừ: H1 bài viết bị cắt ở mép màn hình, home không có H1.
- **Spacing: 3.** Lề và nhịp section đều tay (`desktop-home-full.png`). Điểm trừ: đường kẻ đôi ở article và footer mobile, khối promo blog tablet cao 990px, cột trái trống 770px ở `tablet-product-full.png`.
- **Typography: 4.** Chỉ dùng một họ Inter và mọi H1 cùng weight regular (`desktop-collection-outerwear-first.png`). Điểm trừ: "AS FEATURED IN" dùng kiểu chữ riêng, một số section head thiếu eyebrow.
- **Color/contrast: 3.** Bảng màu bone/đen/đỏ giữ kỷ luật; chữ trên ảnh ở các phần "decade" và "Quiet pieces" nay đạt trên 5:1 khi đo. Điểm trừ: nút "Discover" xám, các dải nền trắng #fff, nút Subscribe đen, chữ "Sold out" chỉ 2.31:1.
- **Imagery: 3.** Ảnh sản phẩm studio đồng bộ (`desktop-collection-all-full.png`). Điểm trừ: các ảnh collection chụp trước cùng một bức tường, slide 2 mất đầu người mẫu, ảnh lặp lại giữa About và blog.
- **Consistency: 3.** Quick-add đã nhất quán theo từng viewport. Điểm trừ: eyebrow vendor chỉ có ở một vài nơi, hai kiểu lọc giá, hai form liên hệ khác nhau, hai cách hiển thị giá sale.
- **Mobile ergonomics: 3.** Hero và carousel 2 thẻ đã ổn (`mobile-home-first.png`). Điểm trừ: nút Add to cart nằm dưới màn hình đầu (`mobile-product-first.png`), toolbar collection chiếm 3 hàng, dòng announcement bị xuống dòng lẻ.
- **Copy: 3.** Giọng tailoring rõ ràng ("Cut, draped, made to be worn"). Điểm trừ: câu viết cho merchant ở About, comment bị cắt giữa câu, hai bài trùng tiêu đề, số năm không khớp, tác giả "Devs2 Admin".

## Ghi chú

- R1-#8 và R1-#26 được đánh giá bằng đo pixel; tôi không tự soát lại từng ảnh crop của hai mục này. R1-#5 có thể chỉ là hiệu ứng fade bị chụp giữa chừng.
- Thư mục tạm `%TEMP%/round4vision` (150 file) đã xoá; kiểm tra lại thì thư mục không còn tồn tại. Tôi không sửa file nào trong `E:/Work`.

Status: DONE_WITH_CONCERNS