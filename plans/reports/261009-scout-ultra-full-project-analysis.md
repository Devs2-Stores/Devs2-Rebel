# Scout Report (ultra) — Devs2 Rebel full-project analysis

Date: 2026-10-09 · Root: `E:/Work/shopify` · HEAD `d4a44dd` (`main`, git dir `.git-nested`) · Mode: `ak:scout --ultra` (5 scout candidates + kongming union verifier)

## Ranking

| Candidate | Coverage (1–20) | Evidence Quality (1–20) | Signal Density (1–20) | Honesty about Gaps (1–20) | Total (/80) | One-line Rationale |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Candidate B** | 20 | 20 | 19 | 19 | **78** | Flawless evidence quality; discovered unique findings (`no_image.png`, `blog-sidebar-editorial.svg`, specs residual) and verified exact counts (44 Custom Elements, 32 `@app` sections). |
| **Candidate D** | 19 | 19 | 18 | 18 | **74** | Exceptional line citation accuracy; surfaced critical unlocalized copy in `main-search.liquid:60-63` and `main-gift-card.liquid:16`. |
| **Candidate C** | 19 | 18 | 19 | 18 | **74** | Exhaustive template and EventBus mapping; surfaced mobile hero LCP `fetchpriority` flaw and live collection QA failure receipt. |
| **Candidate A** | 17 | 18 | 17 | 17 | **69** | Solid baseline structure and zero hallucinated paths, but narrower in commerce edge cases and missed multiple findings surfaced by B/C/D/E. |
| **Candidate E** | 18 | 16 | 17 | 18 | **69** | Surfaced valuable CSS/a11y defects (sub-44px touch targets, desktop-first media queries, 35 schema names without `t:`), but suffered multiple line-anchor inaccuracies. |

---

# Scout Report

## Relevant Files

### Target T1: Architecture & Request Path
- `layout/theme.liquid` — Global layout shell mounting `<head>` assets, header/footer section groups, `{{ content_for_layout }}`, and global modal overlays.
- `layout/password.liquid` — Dedicated layout shell for password-protected storefronts rendering scoped typography and customer login card.
- `layout/gift_card.liquid` — Minimal isolated layout shell for issued gift cards loading Shopify QR code generator and `gift-card.css`.
- `sections/header-group.json` — OS 2.0 header section group orchestrating `announcement-bar` and sticky `header`.
- `sections/footer-group.json` — OS 2.0 footer section group orchestrating multi-column navigation menus, newsletter, payment badges, and localization selectors.
- `templates/index.json` — Homepage JSON template orchestrating 15 promotional, hero, and catalog sections.
- `templates/product.json` — Primary PDP JSON template wiring `breadcrumb`, `main-product` with theme blocks, and recommendations.
- `templates/collection.json` — Primary PLP JSON template orchestrating `breadcrumb`, `main-collection`, subcollections, and best sellers.
- `templates/cart.json` — Cart JSON template ordering `breadcrumb`, `main-cart`, and cart recommendations.
- `templates/search.json` — Search results JSON template hosting `breadcrumb` and `main-search`.
- `templates/product.quickview.liquid` — Alternate product endpoint template (`layout none`) returning quickview modal HTML via `?view=quickview`.
- `templates/product.card.liquid` — Alternate product endpoint template (`layout none`) returning standalone product card HTML via `?view=card`.
- `snippets/cart-modal.liquid` — Global slide-out AJAX cart drawer and line item editor rendered at the root of `layout/theme.liquid`.
- `snippets/search-modal.liquid` — Global predictive search modal overlay with combobox query input and instant result suggestions.
- `snippets/quickview-modal.liquid` — Global quickview modal dialog shell with backdrop and close controls.
- `snippets/newsletter-modal.liquid` — Marketing lead-generation popup overlay with session-based dismissal tracking.
- `snippets/float-social.liquid` — Global floating launcher dock displaying merchant social contact channels.
- `snippets/head-meta-tags.liquid` — Canonical SEO meta tags, OpenGraph data, Twitter card tags, and favicon links.
- `snippets/head-fonts.liquid` — Preconnect links and `@font-face` rules for Shopify CDN typography.
- `snippets/head-stylesheets.liquid` — Global CSS loader (`reset.css`, `base.css`, `theme.css`) and per-template conditional stylesheet router.
- `snippets/head-color-schemes.liquid` — Dynamic style generator injecting `.color-{id}` classes and root CSS custom properties from theme color schemes.
- `snippets/head-design-systems.liquid` — Design token generator calculating layout, spacing, typography scales, radius, and elevation CSS custom properties.
- `snippets/head-script.liquid` — Master script setup publishing `window.themeConfig`, dynamic Swiper loader, and Speculation Rules.
- `snippets/head-defer.liquid` — Empty 0-byte snippet rendered in `layout/theme.liquid:15`.

### Target T2: Commerce Flows
- `sections/main-product.liquid` — Modern OS 2.0 product template rendering media gallery slider, 3D AR hooks, and theme blocks container (`{% content_for 'blocks' %}`).
- `blocks/buy_buttons.liquid` — PDP buy buttons theme block managing product form, add-to-cart, buy-now, selling plans subscriptions, and gift card recipient inputs.
- `blocks/price.liquid` — PDP pricing block displaying current price, compare-at sale price, unit price, and mandatory shipping policy link.
- `blocks/quantity_selector.liquid` — PDP quantity selector block integrating B2B `variant.quantity_rule` minimums, step increments, and maximums.
- `blocks/stock_counter.liquid` — PDP stock counter block providing dynamic low-inventory urgency notices and inventory count tracking.
- `blocks/variant_picker.liquid` — PDP variant selection block supporting button pills, category swatches, and dropdown selectors.
- `blocks/pickup_availability.liquid` — PDP local pickup availability drawer trigger and store status block.
- `blocks/payment_installments.liquid` — PDP installment payment terms block (`form | payment_terms`).
- `blocks/back_in_stock.liquid` — PDP back-in-stock notification form modal trigger for sold-out variants.
- `blocks/tabs.liquid` — PDP tab container block supporting nested `tab` blocks for description, materials, and specifications.
- `snippets/product-sticky-add.liquid` — Viewport-docked sticky Add to Cart bar synchronizing variant selection, pricing, and purchase actions.
- `snippets/product-card.liquid` — Reusable product card component rendering media, badges, swatches, quickview button, and quick-add actions.
- `sections/main-collection.liquid` — Primary PLP section (898 lines) rendering collection hero, AJAX facet filtering, sorting, and product grid.
- `snippets/collection-hero.liquid` — Extracted collection header snippet displaying collection title, image, and description.
- `snippets/collection-filter-drawer.liquid` — Extracted mobile/desktop slide-out filter drawer snippet.
- `snippets/collection-active-filters.liquid` — Active filter chips bar snippet allowing single-click filter removals and "Clear all".
- `snippets/collection-sort.liquid` — PLP sorting toolbar displaying product count, sort order selector, and grid layout toggles.
- `sections/main-search.liquid` — Search results section handling multi-type search queries (product, article, page) and facet filters.
- `sections/predictive-search.liquid` — Section Rendering API endpoint returning live search suggestions and product cards.
- `sections/main-cart.liquid` & `sections/main-cart-items.liquid` — Full-page cart template and modular cart items section for bundled section rendering.
- `sections/cart-recommendations.liquid` & `sections/product-recommendations.liquid` — Dynamic recommendation endpoints populated via Shopify Product Recommendations API.
- `sections/header.liquid` & `snippets/mobile-menu.liquid` — Primary header and mobile menu embedding `<shopify-account>` for New Customer Accounts with anchor fallback.
- `sections/main-customers-account.liquid` — Customer account portal displaying recent order history and default address.
- `sections/main-gift-card.liquid` — Customer-facing gift card balance display, QR code canvas, and Apple Wallet pass badge.
- `sections/main-password.liquid` — Password gate section providing store launch notification form and merchant login modal.

### Target T3: Settings, Presets & Design System
- `config/settings_schema.json` — Master theme settings schema defining 20+ categories, 67 global range controls, colors, typography, layout, and popups.
- `config/settings_data.json` — Active settings registry storing the default configuration and 5 distinct style presets (`Rebel`, `Noir`, `Vibrant`, `Botanical`, `Cyber`).
- `locales/en.default.json` — Purged storefront translation dictionary (31.95 KB, 953 lines) covering 10 active namespaces with zero schema bleed.
- `locales/en.default.schema.json` — Theme editor schema settings translation dictionary housing merchant-facing labels and descriptions.
- `assets/base.css` — Foundational typography, utility classes, and layout scaffolding.
- `assets/theme.css` — Core design system styling defining `.page-width` layout containers, button resets, form inputs, and focus rings.
- `assets/reset.css` — Modern cross-browser CSS reset based on Tailwind Preflight and modern-normalize.

### Target T4: Assets & JavaScript Architecture
- `assets/theme.js` — Foundation utility module (`window.ThemeUtils`) providing DOM helpers, focus trapping, scroll locking, `formatMoney`, and cart synchronization.
- `assets/product.js` — Monolithic PDP script (1,322 lines) registering `<product-template>`, `<product-sticky-add>`, `<product-lightbox>`, `<size-guide-modal>`, and `<product-viewed>`.
- `assets/collection.js` — PLP controller script (784 lines) registering `<facet-filters>` and `<collection-best>` for AJAX Section Rendering filtering.
- `assets/cart-modal.js` & `assets/cart.js` — Cart controllers registering `<cart-modal>`, `<cart-template>`, and `<cart-item>`.
- `assets/variant-picker.js` — Option selection controller registering `<product-variant-picker>`, `<product-variant-select>`, and `<product-variant-picker-image>`.
- `assets/quickview-modal.js` & `assets/quickview-variant-picker.js` — Modal dialog controllers managing quickview fetch, cache, and variant isolation.
- `assets/search-modal.js` & `assets/search.js` — Search controllers managing live predictive queries and search template view switching.
- `assets/customer.js` — Customer account scripts defining `AuthForm`, `CustomerSidebar`, `AddressModal`, and `TogglePassword`.
- `assets/pickup-availability.js` — Custom element handling asynchronous pickup availability drawer fetching.
- `assets/swiper.js` — 145 KB vendor touch slider library, loaded lazily on demand via `window.swiperReady(cb)`.
- `assets/shopify-xr.js` — 3D model viewer AR bridge for iOS Quick Look and Android Scene Viewer.
- `assets/toast.js` — Global toast notification helper displaying non-intrusive commerce status alerts in `.toast-container`.
- `assets/back-to-top.js` — Floating back-to-top button observer and smooth scroll trigger.
- `assets/no_image.png` — 800x1200 raster fallback placeholder image referenced across templates and snippets.
- `assets/blog-sidebar-editorial.svg` — Unreferenced SVG asset in `assets/`.

### Target T5: Tooling, CI, Packaging & QA Artifacts
- `scripts/validate-schema-ranges.mjs` — Node AST script verifying mathematical consistency `(value - min) % step === 0` across 67 settings and 5 presets.
- `scripts/validate-locales.mjs` — Node AST script verifying 100% key resolution in `en.default.json` with zero schema translation bleed.
- `scripts/package-theme.py` — Distribution packaging script compiling theme directories into `dist/devs2-rebel-v1.0.0.zip` per `.shopifyignore`.
- `.github/workflows/theme-store-ci.yml` — GitHub Actions pipeline running AST validators, Ruby `theme-check` gem, and theme packaging.
- `.github/workflows/generate-newsletter-image.yml` — Secondary GitHub Actions automation for generating promotional assets.
- `.theme-check.yml` — Theme Check linter config setting 600-line max length and ignoring 15 files with `{% doc %}` tags.
- `.shopifyignore` — Build exclusion manifest filtering git files, markdown, IDE artifacts, and development scripts.
- `specs/qa-matrix.json` — Machine-readable QA evaluation report recording dimension scores and residual platform metrics.
- `listings/manifest.json` — Theme Store submission metadata detailing author, category, and 5 preset definitions.
- `plans/260919-master-pdp-plp-remediation-plan/plan.md` — Authoritative 4-phase P0 remediation plan tracking PDP/PLP defect fixes.
- `plans/reports/260919-product-and-collection-deep-audit-research.md` — Research report outlining 10 confirmed PDP/PLP root causes.
- `.antifan/qa-receipts/1789835806223-run-5befe1fd-30ad-4788-a5a1-8271e78a5aa6.json` — Automated test run receipt capturing collection QA failure.

### Target T6: Quality, Health & Risk Audit Surface
- `sections/hero.liquid`, `sections/main-blog.liquid`, `sections/slideshow.liquid`, `sections/main-collection.liquid`, `sections/main-article.liquid`, `sections/image-with-text.liquid` — Oversized sections exceeding 600 lines.
- `blocks/buy_buttons.liquid`, `blocks/price.liquid`, `blocks/back_in_stock.liquid`, `sections/page-stores.liquid`, `snippets/icons-sprite.liquid`, `snippets/product-viewed.liquid` — Static inline style violations.
- `sections/main-search.liquid`, `sections/main-gift-card.liquid`, `sections/hero.liquid`, `sections/main-page.liquid` — Hardcoded customer-facing strings.
- `snippets/quantity-selector.liquid` — Non-hoisted stylesheet and script tags inside loop-rendered snippet.
- `assets/product.css` — Desktop-first media queries and sub-44px touch button target in sticky ATC bar.

---

## Relationships

### 1. Request Pipeline & Layout Shell
```text
layout/theme.liquid
 ├── snippets/head-meta-tags.liquid (SEO / OpenGraph)
 ├── snippets/head-fonts.liquid (@font-face rules)
 ├── snippets/head-stylesheets.liquid (Global CSS + template routing)
 ├── snippets/head-color-schemes.liquid (.color-{id} CSS custom properties)
 ├── snippets/head-design-systems.liquid (--space-*, --font-*, --page-width)
 ├── snippets/head-script.liquid (window.themeConfig, swiperReady, Speculation Rules)
 ├── snippets/head-defer.liquid (empty 0-byte file)
 ├── sections/header-group.json (announcement-bar + header with <shopify-account>)
 ├── <main id="MainContent">{{ content_for_layout }}</main> (JSON route templates)
 ├── sections/footer-group.json (footer with multi-column menus & newsletter)
 └── Global Modals: cart-modal, search-modal, quickview-modal, newsletter-modal, float-social
```
- Storefront requests route through `layout/theme.liquid` (or isolated shells `layout/password.liquid` and `layout/gift_card.liquid`).
- Headless endpoints (`templates/product.quickview.liquid` via `?view=quickview` and `templates/product.card.liquid` via `?view=card`) use `{%- layout none -%}` to return partial HTML for client-side hydration.

### 2. PDP Theme Blocks & Commerce Subsystems
- `templates/product.json` mounts `sections/main-product.liquid`, which specifies `"blocks": [{ "type": "@theme" }, { "type": "@app" }]`.
- `sections/main-product.liquid:126` calls `{% content_for 'blocks' %}`, delegating rendering to modular theme blocks in `blocks/*.liquid`.
- `blocks/buy_buttons.liquid` constructs the product form, handles selling plan subscription groups (`selling_plan_groups`), and renders gift card recipient disclosures (`properties[__shopify_send_gift_card_to_recipient]`).
- `blocks/quantity_selector.liquid` passes B2B wholesale rules (`variant.quantity_rule.min`, `step`, `max`) to `snippets/quantity-selector.liquid`.
- `assets/product.js` listens to `variant:change` emitted by `assets/variant-picker.js`, updating `blocks/price.liquid`, `blocks/stock_counter.liquid`, media swiper slides, and `snippets/product-sticky-add.liquid`.

### 3. Collection Faceting & AJAX Navigation
- `templates/collection.json` mounts `sections/main-collection.liquid`.
- Filter forms (`snippets/collection-facet-filter.liquid`), active chip removal (`snippets/collection-active-filters.liquid`), and sorting (`snippets/collection-sort.liquid`) are managed by `assets/collection.js` via the `<facet-filters>` custom element.
- Updates trigger AJAX queries to the Section Rendering API (`?sections=main-collection`), replace `#CollectionProductGrid` and active filters, synchronize browser query parameters via `window.history.pushState`, and support back-forward navigation via `popstate`.

### 4. Custom Elements & Event Bus Architecture
- Client runtime is powered by exactly 44 vanilla Custom Elements coordinated via `window.themeConfig` and DOM CustomEvents on `document`.
- Product add-to-cart in `assets/product.js:475-508`, `assets/product-card.js:30`, and `assets/quickview-modal.js:394` uses native `FormData` appending `sections: 'main-cart-items,cart-modal'`, updates cart data via `ThemeUtils.updateCartData`, and dispatches `cart:item_added`.
- `assets/theme.js:209` dispatches `cart:updated`.
- `<cart-modal>` (`assets/cart-modal.js`) and `<cart-template>` (`assets/cart.js`) listen for `cart:updated` and `cart-quantity-changed` to synchronize drawer line items, counter badges, and order notes without full page reloads.

### 5. Vendor Slider & Speculation Rules Pipeline
- Vendor bundle `assets/swiper.js` (145 KB) is deferred via `snippets/head-script.liquid:105-120` through `window.swiperReady(callback)`, dynamically loading `swiper.css` and `swiper.js` only when a carousel registers, then firing `swiper:loaded`.
- `snippets/head-script.liquid:144-168` injects W3C Speculation Rules (`<script type="speculationrules">`) to prerender internal document links and prefetch collection routes with moderate/conservative eagerness.

---

## Findings (risk/health)

| ID | Severity | Finding | Evidence (path:line) | Validated | Sources |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **F01** | Medium (was High) | Monolithic sections exceed the project-configured `TemplateLength` 600 (maintainability; not a current Theme Check error nor a Theme Store rule) | `sections/hero.liquid:1184`<br>`sections/main-blog.liquid:1125`<br>`sections/slideshow.liquid:1094`<br>`sections/main-collection.liquid:898`<br>`sections/main-article.liquid:862`<br>`sections/image-with-text.liquid:691`<br>`.theme-check.yml:18-20` | Yes | A, B, C, D, E |
| **F02** | High | Incomplete master remediation plan and 25 uncommitted working tree edits | `plans/260919-master-pdp-plp-remediation-plan/plan.md:4` (`status: in-progress`)<br>`plans/260919-master-pdp-plp-remediation-plan/plan.md:39` (missing `blocks/volume_pricing.liquid`)<br>`sections/main-collection.liquid:898` (target <600 lines unfinished)<br>18 modified and 7 untracked files in working tree | Yes | A, B, C, D, E |
| **F03** | Medium | Static inline CSS styles in Liquid templates violate separation of concerns | `sections/hero.liquid:223`<br>`sections/page-stores.liquid:46, 136`<br>`snippets/icons-sprite.liquid:1`<br>`snippets/product-viewed.liquid:1`<br>`blocks/buy_buttons.liquid:75`<br>`blocks/price.liquid:27, 34`<br>`blocks/back_in_stock.liquid:13, 29` | Yes | A, B, C, D, E |
| **F04** | Medium | CI workflow relies on deprecated Ruby `theme-check` gem and disables `DeprecatedTag` | `.github/workflows/theme-store-ci.yml:28-36`<br>`.theme-check.yml:29-31` (`DeprecatedTag: enabled: false`)<br>`.theme-check.yml:36-56` (15 files ignored under `UndefinedObject` due to `{% doc %}`) | Yes | A, B, C, D, E |
| **F05** | ~~Low~~ DROPPED | ~~Distribution packaging script bundles non-storefront directory (`listings/`)~~ — inverted by controller: `/listings` is required for multi-preset zips (see Controller Corrections) | `scripts/package-theme.py:3` (`THEME_DIRS` contains `'listings'`)<br>`listings/` (76 metadata/template JSON files) | Controller: no | A, B, C |
| **F06** | Low — policy conflict, needs decision | `@app` coverage conflicts with project rule "add `@app` only to eligible hosts": 32 sections declare it (incl. `announcement-bar`, `scrolling-text`, `trust-badges`, `team`, `header`, `footer`) while `main-cart`/`main-search`/`main-page`/`main-404` do not. Theme Store mandates `@app` only in main product + featured product (both present) | `sections/main-cart.liquid` (0 matches for `@app`)<br>`sections/main-search.liquid` (0 matches for `@app`)<br>`sections/main-page.liquid:27-37` (0 matches for `@app`)<br>`sections/main-404.liquid` (0 matches for `@app`)<br>`sections/announcement-bar.liquid:68`, `sections/team.liquid:323`, `sections/trust-badges.liquid:199` | Yes | C, E *(noted by B)* |
| **F07** | Medium | Hardcoded customer-facing strings and schema names bypass localization | `sections/hero.liquid:224` (`{{ 'Add blocks to build your hero content.' }}`)<br>`sections/main-search.liquid:60-63` (`"Search result types"`, `"Products"`, `"Articles"`, `"Pages"`)<br>`sections/main-gift-card.liquid:16` (`aria-label="Gift card details"`)<br>`sections/main-page.liquid:34` (`"default": "Page content is being updated."`)<br>35 section schemas use literal English `"name"` without `t:` | Yes | B, C, D, E |
| **F08** | Medium | Non-hoisted stylesheet and script tags injected inside snippet loops | `snippets/quantity-selector.liquid:48-49`<br>`sections/main-cart-items.liquid:33` (rendered inside `cart.items` loop)<br>`snippets/cart-items.liquid:36` (rendered inside line items loop) | Yes | C, D, E |
| **F09** | Low | Inconsistent LCP `fetchpriority` on hero mobile image vs desktop | `sections/hero.liquid:54-58, 102-106` (mobile sets `loading: 'eager'` but omits `fetchpriority: 'high'`)<br>`sections/hero.liquid:97` (desktop calculates `fetch_priority = 'high'`) | Yes | C |
| **F10** | Low | Fallback raster placeholder image present in `assets/` directory | `assets/no_image.png` (800x1200 raster image)<br>Referenced in `main-article.liquid:495`, `main-blog.liquid:118, 322, 446`, `main-product.liquid:76`, `article-card.liquid:42`, `head-script.liquid:10`, `product.quickview.liquid:29` | Yes | B |
| **F11** | Low | Dead, unreferenced SVG illustration in assets directory | `assets/blog-sidebar-editorial.svg` (present on disk, 0 references across all Liquid, JSON, CSS, and JS files; only mentioned in `docs/theme-audit-log.md:44`) | Yes | B, E |
| **F12** | Low | Empty 0-byte snippet rendered in global layout shell | `snippets/head-defer.liquid` (0 bytes)<br>`layout/theme.liquid:15` (`{%- render 'head-defer' -%}`) | Yes | B, D, E |
| **F13** | Low | Orphaned wishlist schema translation keys in schema locale | `locales/en.default.schema.json:820-831, 861-862, 2266-2270`<br>`config/settings_schema.json` contains 0 wishlist occurrences | Yes | A, B, E |
| **F14** | Low | Desktop-first `@media (max-width: …)` + `!important` overrides in mobile sticky ATC (30px button height passes the 24px Theme Store/WCAG 2.2 AA minimum — touch-target claim corrected) | `assets/product.css:574-578` (`@media (max-width: 768px)` violates mobile-first contract)<br>`assets/product.css:690` (`@media (max-width: 576px) { height: 30px; }`) | Yes (partial) | E |
| **F15** | Info | Cross-platform residual compliance metric recorded in specs | `specs/qa-matrix.json:28` (`"haravanCompliance": { "score": 100 }`) | Yes | B |
| **F16** | Medium | Automated QA test failure recorded on collection facet route | `.antifan/qa-receipts/1789835806223-run-5befe1fd-30ad-4788-a5a1-8271e78a5aa6.json:13,16` (`"verdict": "QA_FAILED"`, `"criticalCount": 3` on `?filter.v.availability=1`) | Yes | C |

---

## Dropped Claims

1. **Incorrect Line Anchor for Subscription Inline Style (`blocks/buy_buttons.liquid:62`)**
   - *Source*: Candidate E.
   - *Why Dropped*: Line 62 is `{%- if product.selling_plan_groups.size > 0 -%}`. The actual static inline style `<div class="selling-plans__group-select-wrapper" data-subscription-plans style="display: none;">` is located at line 75 (as correctly identified by Candidates A and C).
2. **Missing `snippets/collection-filter-modal.liquid` Classified as Defect**
   - *Source*: Candidate C.
   - *Why Dropped*: While the initial remediation plan diagram (`plan.md:44`) proposed extracting both a drawer and a modal, the codebase implemented `snippets/collection-filter-drawer.liquid` (77 lines) as the unified off-canvas filter component. The absence of a separate modal snippet is an intentional consolidation, not a missing dependency.
3. **Inaccurate Call Site Lines for `head-defer` (`layout/theme.liquid:16-17`)**
   - *Source*: Candidates A, B, D, E.
   - *Why Dropped*: Inspection of `layout/theme.liquid` proves `{%- render 'head-defer' -%}` is at line 15 (line 16 is `{{ content_for_header }}` and line 17 is `</head>`).
4. **Inaccurate Asset Tag Line Numbers in `snippets/quantity-selector.liquid` (`46-47` / `49-50`)**
   - *Source*: Candidates C and E.
   - *Why Dropped*: In `snippets/quantity-selector.liquid`, the stylesheet and script tags reside on lines 48-49 (as correctly cited by Candidate D).
5. **App Block Coverage Contradiction Resolution**
   - *Candidates*: Candidate B stated 32 sections declare `@app`. Candidates C and E stated key template sections lack `@app`.
   - *Resolution*: Both statements are factually accurate. Exactly 32 promotional and modular section files declare `@app`, but 4 core template sections (`main-cart.liquid`, `main-search.liquid`, `main-page.liquid`, and `main-404.liquid`) lack `@app` support. The findings were merged to reflect the full architectural reality.

---

## Unresolved Questions

1. **Volume Pricing Block Roadmap (`blocks/volume_pricing.liquid`)**:
   Will deliverable P2_5 (`blocks/volume_pricing.liquid`) be implemented prior to release to complete the B2B wholesale feature set, or should the active master remediation plan be amended to defer volume pricing?
2. **Modularization Roadmap for 6 Monolithic Sections**:
   What is the execution schedule for decomposing `sections/main-collection.liquid` (898 lines vs <600 plan target), `sections/hero.liquid` (1,184 lines), `sections/main-blog.liquid` (1,125 lines), `sections/slideshow.liquid` (1,094 lines), `sections/main-article.liquid` (862 lines), and `sections/image-with-text.liquid` (691 lines) to satisfy the 600-line `TemplateLength` ceiling in `.theme-check.yml`?
3. **CI Tooling Modernization (Shopify CLI vs Ruby Gem)**:
   Should `.github/workflows/theme-store-ci.yml` transition from the deprecated Ruby `gem install theme-check` to Shopify CLI / `@shopify/theme-check`, allowing removal of the 15 `UndefinedObject` bypasses for LiquidDoc `{% doc %}` in `.theme-check.yml`?
4. **`listings/manifest.json` acceptance**:
   `/listings/<preset>/templates/*.json` is the documented multi-preset structure and must stay in the zip (F05 withdrawn). Unverified: whether the extra `listings/manifest.json` is tolerated by Theme Store upload, or should be excluded by `scripts/package-theme.py`.
5. **Fallback Raster Image Replacement**:
   Should `assets/no_image.png` (800x1200 raster) be replaced with Shopify's native `{{ 'image' | placeholder_svg_tag }}` or a lightweight custom SVG fallback to achieve a completely raster-free asset bundle for Theme Store submission?

---

## Controller Corrections (verified against live files + shopify.dev, 2026-10-09)

The verifier is advisory. These load-bearing premises were re-checked by the controller:

| ID | Verifier claim | Correction | Evidence |
| :--- | :--- | :--- | :--- |
| F05 | `listings/` in the zip is a non-standard dir that may be rejected (Low) | **DROPPED — inverted.** Multi-preset themes MUST ship preset templates in a `/listings` folder inside the theme zip. `scripts/package-theme.py:3` including `listings` is correct. | shopify.dev Theme Store requirements §18 "Adding presets to your theme zip submission" (`/listings/<preset>/templates/*.json`); `listings/{rebel,noir,vibrant,botanical,cyber}/templates/` (15 JSON each) |
| F06 | `@app` missing in main-cart/search/page/404 violates Theme Store (Medium) | **Downgraded to Low (recommendation).** Theme Store only mandates `@app` in the main product and featured product sections — both present (`sections/main-product.liquid:181`, `sections/featured-product.liquid:191`). shopify.dev app-blocks guide says JSON-template sections *should* support `@app`. Project rule (shopify/AGENTS.md) also forbids adding `@app` blindly; 32 sections already declare it, including `header`/`announcement-bar`/`footer`, which deserves an eligibility review. | shopify.dev requirements §5 "Block and app block support requirements"; grep `"@app"` → 32 section files |
| F01 | Sections > 600 lines are a Theme Check / Theme Store blocker (High) | **Downgraded to Medium (maintainability).** `TemplateLength` is not in the current Theme Check checks reference (Shopify CLI); in the legacy Ruby gem it is suggestion-severity, so `theme-check --fail-level error` does not fail on it `[INFERENCE: gem default severity]`. Theme Store requirements contain no line-count rule. Size is still real tech debt and the active plan target (main-collection < 600) is unmet. | `.theme-check.yml:18-20`; shopify.dev theme-check checks index (no TemplateLength entry) |
| F14 | 30px sticky-ATC button fails WCAG 2.2 touch target | **Partially wrong.** Theme Store/WCAG 2.2 AA (2.5.8) minimum is 24x24 CSS px; 30px height passes. The valid part is the desktop-first `@media (max-width: …)` blocks plus `!important` overrides, which break the mobile-first rule. | `assets/product.css:574-578, 677, 689-690`; shopify.dev requirements §12 ("at least 24 by 24 CSS pixels") |
| F04 | `DeprecatedTag: enabled: false` (Medium) | **Confirmed and sharpened.** `DeprecatedTag` is **Error** severity in current Theme Check; it is disabled while `{% include %}` has 0 occurrences, so it can be re-enabled at no cost. Local config comment says tooling is Shopify CLI 4.1.0 while CI installs the archived Ruby gem — local and CI run different engines. | `.theme-check.yml:31-32, 39`; `.github/workflows/theme-store-ci.yml:28-37`; checks index row `DeprecatedTag | Error` |

### Controller-only findings (not proposed by any candidate)

| ID | Severity | Finding | Evidence |
| :--- | :--- | :--- | :--- |
| X01 | High (Theme Store gate) | Theme name `Devs2 Rebel` contains the author/company name `Devs2`; Theme Store requires theme/preset names to exclude the company name, be 1–2 words, and one preset must carry the parent theme name. Presets are `Rebel, Noir, Vibrant, Botanical, Cyber` — none equals `Devs2 Rebel`. | `config/settings_schema.json:4,6`; `listings/manifest.json:2-4,12`; shopify.dev requirements §18 |
| X02 | Low | `docs/theme-architecture.md:26` still lists "wishlist" as a coordinated flow, but code has 0 wishlist matches in `assets/ sections/ snippets/ blocks/ layout/ config/settings_schema.json`; only orphaned locale keys remain (`locales/en.default.schema.json:820-831, 861-862, 2266`). Stale doc + stale keys (wishlists are an explicitly banned app-like feature, so removal was correct). | grep `wishlist` |
| X03 | Info | `listings/manifest.json` is not part of the documented `/listings/<preset>/templates` structure; unknown whether Theme Store upload tolerates it. | `listings/manifest.json`; shopify.dev requirements §18 |
| X04 | Low | `snippets/countdown-banner.liquid` injects its stylesheet and an inline `<script>` custom-element definition per render and hardcodes a fallback color `#e94560`. Countdown uses merchant `end_date` (not fake urgency). | `snippets/countdown-banner.liquid:27, 36, 96-143` |

### Corrected severity ordering (top risks)
1. **X01** theme naming vs Theme Store rules (blocks submission).
2. **F02** in-progress remediation plan, 18 modified + 7 untracked files; `blocks/volume_pricing.liquid` absent; main-collection 898 lines; latest AntiFan QA receipt on `/collections/all?filter.v.availability=1` = `QA_FAILED`, `criticalCount: 3` (F16).
3. **F04** CI vs local Theme Check engine drift; `DeprecatedTag` (Error-level) disabled.
4. **F01** six sections 691–1184 lines (maintainability).
5. **F03 / F07 / F08** inline static styles, unlocalized strings (`sections/main-search.liquid:60-63`, `sections/hero.liquid:224`), asset tags inside the cart line-item loop (`snippets/quantity-selector.liquid:48-49`).

### Baseline checks run by the controller
- `node scripts/validate-locales.mjs` → exit 0 (all keys resolve; storefront locale 31.95 KB). It does not detect stale keys (X02).
- `node scripts/validate-schema-ranges.mjs` → exit 0 (67 global ranges, 5 presets, 56 section/block files).
- Grep: `prefers-reduced-motion` = 0, `{% include %}` = 0, `<shopify-account>` present in `sections/header.liquid:33` and `snippets/mobile-menu.liquid:79`.
- `shopify theme list --store devs2-rebel.myshopify.com` (user-approved, read-only) → OAuth session valid; themes: `Devs2 Rebel` [live] #144133881965, `Dawn` [unpublished] #144162422893.
- `shopify theme check` (user-approved; Shopify CLI 4.8.3, `.theme-check.yml`) → 246 files inspected, **0 errors**, 37 warnings, all `UnusedDocParam` across 11 snippets. Every flagged name contains `=` (e.g. `[enabled=true]`): LiquidDoc's documented name format is `[name]` with no default-value syntax (https://shopify.dev/docs/storefronts/themes/tools/liquid-doc), so the parser reads `enabled=true` as the parameter name. Process ended with a libuv `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76` after the summary (exit 9) - a Windows Node shutdown crash, not a check failure [INFERENCE].
- Fix applied (doc comments only): 37 `@param {type} [name=default]` lines in the 11 flagged snippets rewritten to `[name] - ... Default: <value>`; every param was confirmed referenced in its snippet body. Re-run `shopify theme check` (user-approved) → 246 files inspected, **no offenses**, exit 0. Locale and range validators re-run → exit 0.
- Not run: live storefront preview (`shopify theme dev`).

## Ranking Appendix — label map
- Candidate A = ScoutCand3
- Candidate B = ScoutCand5
- Candidate C = ScoutCand1
- Candidate D = ScoutCand4
- Candidate E = ScoutCand2
- Same-tier run: candidates (scout) and verifier (kongming) inherit the session model tier; this is same-tier best-of-5 with rubric selection, not asymmetric verification.
- Verifier raw receipt: `ultra: union=16/16 single_candidate_only=5`; controller dropped F05 after doc verification.

ultra: union=15/16 single_candidate_only=5
