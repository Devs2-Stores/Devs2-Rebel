# 📚 Devs2 Shopify — Project Context

> **Mục đích:** Khi @ file này vào chat, AI sẽ tự động đọc lại toàn bộ skills, workflows, rules và docs của dự án.
> Chỉ cần gõ `@CONTEXT.md` là đủ.

---

## 📖 Bắt buộc đọc theo thứ tự

### 1. Workflows (Quy trình làm việc)
Đọc **toàn bộ** workflow files trong `.agent/workflows/`:

- `.agent/workflows/README.md` — Hướng dẫn sử dụng workflows
- `.agent/workflows/shopify-coding-standards.md` — **Đọc đầu tiên** — Quy chuẩn code Liquid
- `.agent/workflows/shopify-create-section.md` — Tạo section chuẩn
- `.agent/workflows/shopify-create-snippet.md` — Tạo snippet chuẩn
- `.agent/workflows/shopify-create-template.md` — Tạo template chuẩn
- `.agent/workflows/shopify-liquid-reference.md` — Tham chiếu Liquid objects/filters/tags
- `.agent/workflows/shopify-performance.md` — Tối ưu hiệu suất
- `.agent/workflows/shopify-theme-check.md` — Kiểm tra theme
- `.agent/workflows/shopify-cart-ajax.md` — Cart AJAX
- `.agent/workflows/shopify-predictive-search.md` — Predictive Search
- `.agent/workflows/shopify-metafields.md` — Metafields & Metaobjects
- `.agent/workflows/shopify-markets.md` — Đa ngôn ngữ & Markets
- `.agent/workflows/shopify-deploy.md` — Deploy theme
- `.agent/workflows/shopify-init.md` — Khởi tạo dự án
- `.agent/workflows/shopify-migrate-haravan.md` — Migrate từ Haravan

### 2. Skills (Kỹ năng chuyên sâu)
Đọc **toàn bộ** SKILL.md files trong `.agent/skills/`:

- `.agent/skills/shopify-liquid-coding/SKILL.md` — **Quan trọng nhất** — Anti-patterns, best practices
- `.agent/skills/shopify-create-section/SKILL.md` — Chi tiết tạo section
- `.agent/skills/shopify-create-snippet/SKILL.md` — Chi tiết tạo snippet  
- `.agent/skills/shopify-accessibility/SKILL.md` — WCAG accessibility rules

### 3. Task List & Notes
- `.agent/shopify_task_list.md` — Danh sách công việc & Known issues

### 4. Project Structure
Nắm cấu trúc thư mục:
```
├── assets/          → CSS, JS, images
├── config/          → settings_schema.json, settings_data.json
├── layout/          → theme.liquid
├── locales/         → en.default.json, en.default.schema.json
├── sections/        → Section files
├── snippets/        → Reusable snippets
├── templates/       → JSON templates
└── .agent/          → Workflows, skills, task list
```

---

## ⚡ Quick Rules (Tóm tắt quy tắc)

### Liquid
- Luôn dùng `{%- -%}` (whitespace trimming)
- Boolean params: `| default: false, allow_false: true`
- Dùng `image_url | image_tag` — KHÔNG dùng `<img>` thủ công cho Shopify images
- Schema translations: `t:sections.all.*` cho settings dùng chung

### CSS
- Mobile-first: `min-width` breakpoints
- Tách CSS riêng per section/component
- Dùng CSS custom properties từ `base.css`
- Utility classes: `heading-size-*`, `content-size-*`, `page-width`

### Container Width Pattern (Chuẩn)
```liquid
{%- assign container_width = section.settings.container_width | default: 'fixed' -%}
<div class="{% if container_width == 'fixed' %}page-width{% endif %}">
```
Schema:
```json
{
  "type": "select",
  "id": "container_width",
  "label": "t:sections.all.container_width.label",
  "options": [
    { "value": "fixed", "label": "t:sections.all.container_width.options__fixed.label" },
    { "value": "full", "label": "t:sections.all.container_width.options__full.label" }
  ],
  "default": "fixed"
}
```

### Accessibility
- `<img>` phải có `alt`, `width`, `height`
- Interactive elements cần `title` hoặc `aria-label`
- Decorative images: `aria-hidden="true"`
- Schema.org markup cho structured data

### Performance
- Lazy load images below fold: `loading="lazy"`
- First 3 visible images: `loading="eager"`, first = `fetchpriority="high"`
- Responsive images: `srcset` + `sizes` hoặc `image_tag` với `widths`

---

## 🗂️ Known Issues (Toàn theme)
- ~~`--color-gray` family chưa khai báo centrally~~ ✅ Confirmed — đã có trong `head-design-systems.liquid` (lines 32-35)
- ~~`section-padding` class chưa có CSS definition~~ ✅ Fixed — thêm vào `base.css`
- ~~`global-heading` nên chuyển vào `base.css`~~ ✅ Fixed — thêm vào `base.css`
