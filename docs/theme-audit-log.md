# Shopify Theme Audit Log — Devs2 Rebel (E:\Work\shopify)

## 2026-08-10 - FAQ section boundary spacing

- **Finding:** The FAQ list touched the support CTA because the shared `spacing_sections` setting was `0`; `.section-padding` therefore resolved to no vertical padding between adjacent sections.
- **Impact:** The last accordion card visually collided with the support band, and the following contact form appeared attached to the CTA instead of reading as a separate step.
- **Fix:** Added explicit component-owned fallback padding to `.faq-main.section-padding` and `.faq-contact` in `assets/page-faq.css`, with larger desktop values.
- **Prevention rule:** Page sections must verify global spacing at render time and own an explicit vertical boundary when the global token can be zero. This rule is recorded in `AGENTS.md` and mirrored in `CLAUDE.md`.
- **Evidence:** Local theme-dev render at the user-provided `127.0.0.1:9292` preview URL; supplied screenshot; computed global section spacing measured as zero.

## 2026-08-10 - FAQ search grouping and attribute sanitization

- **Finding:** Search hid individual questions but left empty topic headings visible. The search corpus was also stored in one combined data attribute, which made the sanitization boundary harder to audit.
- **Fix:** Associated each question with its nearest preceding topic heading and hid headings with no visible questions. Split the search corpus into separately sanitized `data-faq-question` and `data-faq-answer` attributes before combining their decoded dataset values in JavaScript.
- **Validation:** JavaScript syntax passed; empty-result handling and accordion auto-close contracts remain unchanged.

**Theme:** Devs2 Rebel · **Auditor:** Nhi (Hermes Agent) · **Updated:** 2026-08-10

## Trạng thái các trang

| # | Trang | Template | Trạng thái | Ghi chú |
|---|-------|----------|-----------|---------|
| 1 | Blog | `blog.json` + `main-blog.liquid` | ✅ **PASS (08/08)** | 2 vòng audit, 9 issues fixed |
| 2 | Article | `article.json` + `main-article.liquid` | ✅ **PASS (08/08)** | 2 vòng audit, 9 issues fixed |
| 3 | Homepage | `index.json` | ⏳ Chưa audit | |
| 4 | Product | `product.json` + `main-product.liquid` | ⏳ Chưa audit | |
| 5 | Collection | `collection.json` + `main-collection.liquid` | ⏳ Chưa audit | |
| 6 | Cart | `cart.json` + `cart-items.liquid` | ⏳ Chưa audit | |
| 7 | Search | `search.json` + `main-search-quickview.liquid` | ⏳ Chưa audit | |
| 8 | Page | `page.json` | ⏳ Chưa audit | |
| 9 | 404 | `404.json` | ⏳ Chưa audit | |
| 10 | Password | `password.json` | ⏳ Chưa audit | |
| 11 | Customers | `customers/*.json` (6 files) | ⏳ Chưa audit | |
| 12 | Layout chung | `theme.liquid` + snippets | ⏳ Chưa audit | Header, footer, drawer, modal |
| 13 | Contact/About/FAQ/Stores | `page.*.json` (4 files) | ⏳ Chưa audit | |

## Kết quả Blog + Article (đã PASS)

### Vòng 1 (6 issues → fixed)
1. 🔴 High — Icon `chat` ko tồn tại → `comments` ✅
2. 🟠 Medium — Blog description lặp 2 lần ✅
3. 🟡 Low — `no_image.png` fallback ✅ (file có sẵn)
4. 🟡 Low — Hardcode tiếng Anh sidebar → i18n ✅
5. 🟡 Low — `blog-sidebar-editorial.svg` ✅ (file có sẵn)
6. ℹ️ Info — block_order article.json ✅

### Vòng 2 (3 issues → fixed)
7. 🟡 Low — Tag ko escape (main-article:545 → `| escape`) ✅
8. 🟡 Low — `toc_title` ko escape (content-toc.liquid) ✅
9. 🟡 Low — aria-label trống khi title blank → conditional render ✅

### Xác nhận vòng 2 (không lỗi)
- ✅ Translation keys: 0 thiếu (verify tự động 69 keys)
- ✅ Schema JSON hợp lệ cả 2 file
- ✅ Assets phụ thuộc: content-toc.css/js, section-pagination.css, share-buttons.css/js
- ✅ Load order JS: theme.js (head defer) → trước content-toc.js (body defer)
- ✅ Edge cases: blog rỗng, article ko ảnh, comments tắt, moderated, pagination 1 trang, sidebar fallback

## Checklist audit mỗi trang (chuẩn)

```
Mỗi trang check:
  1. Hiển thị đúng (desktop + mobile 375px)
  2. Links/buttons hoạt động
  3. Console ko lỗi JS
  4. Tốc độ (Core Web Vitals)
  5. Translation keys đủ
  6. Schema JSON hợp lệ
  7. Assets phụ thuộc tồn tại
  8. Load order JS an toàn
  9. Escape/XSS an toàn
  10. A11y: aria-label, focus, alt text
  11. Edge cases (rỗng, ko ảnh, disabled)
  12. SEO: meta, schema.org, canonical
```
