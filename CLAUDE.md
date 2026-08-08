# CLAUDE.md — Shopify Base Theme `devs2`

Contract chung của theme nằm ở `AGENTS.md` (cùng thư mục) — Claude Code **tự nạp** nó cạnh file này, nên **không `@`-import ở đây** (sẽ nạp trùng contract). File này chỉ chứa phần riêng cho Claude Code.

## Claude-only

- Sửa theme: route skill platform Shopify (`shopify-theme`) trước generic plan/test/review; audit/perf/a11y/SEO → `shopify-theme-quality`; QA/H→S → `theme-qa-az`; CLI → `shopify-theme-cli`.
- **Không auto-chạy** `shopify theme *` — đưa exact command, user duyệt và tự chạy từng lần.
- Đọc `.workspace-context.json` trước; platform phải là `shopify` — không kéo pattern Haravan/Sapo vào theme này.
