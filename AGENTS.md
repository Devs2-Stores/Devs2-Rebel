# AGENTS.md — Shopify Base Theme `devs2`

Contract riêng cho theme Shopify tại `shopify/`. Contract chung toàn workspace: `../AGENTS.md` (root) — đọc trước; file này chỉ chứa phần riêng theme, không lặp rule workspace.

## Identity

- Platform: **Shopify** (OS 2.0). Branch: `devs2`. Role: **base** theme (`.workspace-context.json`).
- Không trộn syntax Haravan / Sapo / Shopify. Không rõ platform → hỏi, không đoán.

## Cấu trúc

```
assets/    CSS / JS / images  — base.css giữ CSS custom props + design tokens
config/    settings_schema.json, settings_data.json
layout/    theme.liquid, password.liquid
locales/   en.default.json, en.default.schema.json
sections/  section files
snippets/  reusable snippets
templates/ JSON templates
```

## Shopify CLI — reference only, KHÔNG tự chạy

Mọi lệnh `shopify theme *` cần user đồng ý riêng trước mỗi lần chạy. Đưa exact command để user tự chạy.

| Việc | Lệnh |
|---|---|
| dev local | `shopify theme dev` |
| kéo từ live | `shopify theme pull --live` |
| đẩy dev theme | `shopify theme push --development` |
| lint theme | `shopify theme check` (config `.theme-check.yml`) |

## Rule sắt (Liquid / CSS / A11y / Perf)

**Liquid**
- Luôn `{%- -%}` (whitespace trimming).
- Boolean param: `| default: false, allow_false: true`.
- Ảnh: `image_url | image_tag` — KHÔNG viết `<img>` thủ công cho Shopify image.
- Settings dùng chung: dịch `t:sections.all.*`.

**Container width pattern (chuẩn)**

```liquid
{%- assign container_width = section.settings.container_width | default: 'fixed' -%}
<div class="{% if container_width == 'fixed' %}page-width{% endif %}">
```

Schema: `select` id `container_width`, options `fixed`/`full`, default `fixed`, label `t:sections.all.container_width.*`.

**CSS**
- Mobile-first (`min-width` breakpoints); tách CSS per section/component.
- Custom props từ `base.css`; utility `heading-size-*`, `content-size-*`, `page-width`.
- Opt-in component class (BEM + token); không style bare `button`/`input`/`a`. Container invariant + specificity conflict → theo `../AGENTS.md`.

**Accessibility**
- Mọi `<img>` có `alt`, `width`, `height`; decorative `aria-hidden="true"`.
- Interactive element cần `title` hoặc `aria-label`. Structured data Schema.org cho product/article.

**Performance**
- Ảnh below fold `loading="lazy"`; 3 ảnh đầu `loading="eager"`, ảnh đầu tiên `fetchpriority="high"`.
- Responsive: `srcset` + `sizes`, hoặc `image_tag` với `widths`.

## Chi tiết → skill (không lặp ở đây)

| Việc | Skill |
|---|---|
| Code theme (Liquid / section / snippet / template / settings) | `shopify-theme` |
| Audit / performance / a11y / SEO / store readiness | `shopify-theme-quality` |
| Theme CLI (dev / push / pull / check) | `shopify-theme-cli` |
| QA / bug thường gặp / H→S convert | `theme-qa-az` |
