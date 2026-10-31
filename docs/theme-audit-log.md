# Shopify Theme Audit Log — Sartor (E:\Work\shopify)

Entries before 2026-10-30 use the former name Rebel.

## 2026-10-10 - Production demo content and release readiness

- **Finding:** The Rebel templates and all four presets shared one small set of demo images. Store and timeline slots were blank, and the presets reused Rebel art. The demo catalogue still held Vietnamese test products, VND-scale prices, snowboard samples and 67 broken menu links.
- **Fix:** Generated per-preset image sets through `ai-image-studio` and uploaded them to Shopify Files; no raster images were added to `assets/`. Template and `listings/*/templates` image references now point at those files. Store data was cleaned through the Admin API, with a before-state ledger kept for each change. Open code findings from the gap audit were fixed, including the theme rename to `Rebel`.
- **Validation:** `shopify theme check`: 245 files, no offenses. Locale and range validators exit 0. Journeys: 96 pass, 0 fail. axe WCAG 2.2 AA: 0 violations and 0 overflow on 10 routes at 375 and 1440.
- **Open merchant items:** selling plan names (owned by an app), missing legal policies, the homepage social image and meta description. Details are in `plans/reports/demo-production-261010-release-readiness.md`.

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
