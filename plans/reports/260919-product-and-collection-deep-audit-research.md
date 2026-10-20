# Research Report: Deep Audit & Gap Analysis of Product and Collection Pages
**Theme:** Devs2 Rebel (Shopify Online Store 2.0 Base Theme)  
**Date:** 2026-09-19  
**Methodology:** Best-of-5 Ultra Verifier (`ak:research --ultra`) — Kongming Autonomous Adjudication  
**Scope:** Product Page (`templates/product.json`, `sections/main-product.liquid`, `blocks/*.liquid`, `assets/product.js`, `assets/product.css`, snippets) & Collection Page (`templates/collection.json`, `sections/main-collection.liquid`, `snippets/collection-*.liquid`, `assets/collection.js`, `assets/collection.css`, snippets)  
**Readiness Verdict:** **NOT YET THEME STORE / ENTERPRISE READY (Readiness Score: 62/100)**

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Research Methodology & Ultra Verifier Scorecard](#research-methodology--ultra-verifier-scorecard)
3. [Product Page (PDP) Gaps & Defects](#product-page-pdp-gaps--defects)
   - [3.1 P0 Theme Store Blockers & Critical Bugs](#31-p0-theme-store-blockers--critical-bugs)
   - [3.2 P1 High-Impact Commercial & Modern Shopify Features](#32-p1-high-impact-commercial--modern-shopify-features)
   - [3.3 P2 Accessibility, SEO & Performance Optimizations](#33-p2-accessibility-seo--performance-optimizations)
4. [Collection Page (PLP) Gaps & Defects](#collection-page-plp-gaps--defects)
   - [4.1 P0 Theme Store Blockers & Critical Architectural Violations](#41-p0-theme-store-blockers--critical-architectural-violations)
   - [4.2 P1 High-Impact Discovery & Conversion Gaps](#42-p1-high-impact-discovery--conversion-gaps)
   - [4.3 P2 Ergonomics, Internationalization & Polish](#43-p2-ergonomics-internationalization--polish)
5. [Structured Data & SEO Analysis](#structured-data--seo-analysis)
6. [Core Web Vitals & Accessibility Risk Matrix](#core-web-vitals--accessibility-risk-matrix)
7. [Actionable Remediation Roadmap](#actionable-remediation-roadmap)
8. [Appendices & Ultra Verifier Adjudication](#appendices--ultra-verifier-adjudication)

---

## 1. Executive Summary

An exhaustive technical investigation was conducted across the Product and Collection pages of the **Devs2 Rebel** Shopify base theme. The audit evaluated existing Liquid code, Theme Blocks (`blocks/`), JavaScript web components, CSS stylesheets, and JSON templates against current (2025/2026) Shopify Theme Store requirements, WCAG 2.2 AA accessibility standards, Core Web Vitals targets, and top-tier e-commerce conversion expectations.

While the theme has adopted modern fundamentals—modularizing `sections/main-product.liquid` to 185 lines with native Theme Blocks, supporting Category Swatches, and implementing Storefront Filtering—**the codebase contains several critical functional defects and compliance blockers that will cause immediate rejection or severe user experience degradation**:

1. **Forced Subscription Allocation & Missing Selector UI (P0 Blocker):** `blocks/buy_buttons.liquid` automatically binds the first available `selling_plan` without customer consent or interface controls, while completely lacking a subscription frequency selector.
2. **Sticky Add to Cart Mobile Display Inversion & Broken Buy Now (P0 Blocker):** On mobile viewports, the sticky purchase bar remains locked to the top of the screen (`top: ... !important`), obscuring navigation, while its "Buy Now" button attempts to click a non-existent DOM element when Dynamic Checkout is enabled.
3. **Monolithic Collection Section & Card Loop Asset Bloat (P0 Blocker):** `sections/main-collection.liquid` exceeds 1,042 lines (violating the 600-line Theme Check threshold), while `snippets/product-card.liquid` repeatedly injects `<link>` and `<script>` tags inside every iteration of the collection loop (24 duplicate asset tags per page).
4. **Keyboard Focus Loss & Screen Reader Silence on AJAX Filtering (P0 Blocker):** Selecting a facet filter replaces the inner HTML without focus restoration or `aria-live` announcements, dropping keyboard users back to the document root.
5. **Missing Active Filter Chips & Broken Infinite Scroll History (P1 High):** Active filter pills exist only inside the filter drawer and are completely absent above the product grid. Appending products during infinite scroll does not update the browser URL via `history.replaceState`, breaking the Back button.
6. **B2B Quantity Rules & Volume Pricing Ignored (P1 High):** The PDP quantity selector hardcodes `min: 1` and `step: 1`, bypassing `variant.quantity_rule` constraints and lacking volume pricing tier tables (`variant.quantity_price_breaks`).

---

## 2. Research Methodology & Ultra Verifier Scorecard

Five independent, read-only research candidates were dispatched in parallel using the `ak:research --ultra` best-of-5 protocol. Each candidate audited the local codebase across different specializations. The controller anonymized candidate outputs and scored them across 5 orthogonal criteria (1–20 points each, maximum 100 points):

| Candidate | Specialization | Coverage & Depth (20) | Shopify Parity (20) | Actionability (20) | Technical Rigor (20) | Prioritization & Honesty (20) | Total Score | Rank | Verdict |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Candidate A** (Candidate 2) | **Theme Store, Commercial UX & Code Analysis** | **19** | **19** | **20** | **19** | **19** | **96/100** | **#1 (WINNER)** | **Selected as Primary Report** |
| **Candidate B** (Candidate 4) | Enterprise Architecture & Discovery | 18 | 19 | 18 | 18 | 18 | **91/100** | **#2** | Synthesized (Selling plans, URL sync) |
| **Candidate C** (Candidate 1) | Spec Compliance & Liquid Anti-patterns | 18 | 19 | 18 | 18 | 18 | **91/100** | **#3** | Synthesized (Shipping policy, Swiper collision) |
| **Candidate E** (Candidate 3) | Accessibility (WCAG), Schema & CWV | 18 | 17 | 18 | 20 | 18 | **91/100** | **#4** | Synthesized (Focus trapping, CLS, LCP) |
| **Candidate D** (Candidate 5) | Storefront UX & Metafield Parity | 17 | 17 | 16 | 16 | 17 | **83/100** | **#5** | Baseline cross-check |

---

## 3. Product Page (PDP) Gaps & Defects

```mermaid
graph TD
  PDP[Product Page: templates/product.json] --> MEDIA[Swiper Gallery + 3D Model]
  PDP --> BLOCKS[Theme Blocks: blocks/*.liquid]
  PDP --> STICKY[Sticky Add to Cart Bar]
  PDP --> RECS[Product Recommendations]
  
  BLOCKS -.-> BUG1[P0: Forced Subscription / No Selling Plan UI]
  BLOCKS -.-> BUG2[P0: Missing Mandatory Shipping Policy Link]
  BLOCKS -.-> BUG3[P1: Quantity Selector Bypasses B2B quantity_rule]
  BLOCKS -.-> BUG4[P1: Static Inventory Count - Missing data-stock-qty Span]
  
  STICKY -.-> BUG5[P0: Mobile Top Inversion - top: 0 !important]
  STICKY -.-> BUG6[P0: Buy Now Button Clicks Missing Element]
  
  RECS -.-> BUG7[P1: Swiper Navigation Selectors Collide with Media Gallery]
  RECS -.-> BUG8[P1: No IntersectionObserver - Degrades Mobile LCP]
```

### 3.1 P0 Theme Store Blockers & Critical Bugs

#### 1. Forced Subscription Bug & Absence of Selling Plans Selector
- **Location:** `blocks/buy_buttons.liquid:46-51`, `assets/product.js:334-345`
- **Defect:** 
  ```liquid
  {%- assign selling_plan_allocation = selected_variant.selling_plan_allocations.first -%}
  {%- if selling_plan_allocation -%}
    <input type="hidden" name="selling_plan" value="{{ selling_plan_allocation.selling_plan.id }}">
  {%- endif -%}
  ```
  If a merchant configures a subscription for a product, the theme **automatically forces the subscription upon the buyer** by injecting a hidden `selling_plan` input. There is no radio button or selector allowing the customer to choose between "One-time purchase" and "Subscribe & Save", nor any frequency selector.
- **Requirement:** Shopify Theme Store Feature Requirements mandate full customer-facing UI for products with `selling_plan_groups`.
- **Remediation:** Create a dedicated `blocks/subscriptions.liquid` or embed dynamic subscription radio selectors within `buy_buttons.liquid` supporting one-time purchase, subscription plan selection, and discount badges.

#### 2. Sticky Add to Cart Mobile Pinning Inversion & Safe Area Deficit
- **Location:** `assets/product.css:523-548`, `snippets/product-sticky-add.liquid`
- **Defect:** 
  ```css
  .product-sticky-add {
    position: fixed;
    top: var(--header-height-sticky, 0) !important;
    left: 0; right: 0;
  }
  @media (max-width: 768px) {
    .product-sticky-add {
      border-top: 1px solid var(--border-color);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
  }
  ```
  The author styled the mobile bar with `border-top` and negative box shadow (intended for the bottom of the screen) but failed to set `top: auto; bottom: 0;`. Because `top: ... !important;` remains active, the bar docks at the **top of mobile screens**, covering the header and product title. It also lacks `padding-bottom: env(safe-area-inset-bottom);` for modern mobile home indicators.
- **Remediation:** Override mobile styles to `top: auto !important; bottom: 0 !important; padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));`.

#### 3. Sticky Add to Cart "Buy Now" Orphaned Click Handler
- **Location:** `snippets/product-sticky-add.liquid:43-46`, `blocks/buy_buttons.liquid:59-72`, `assets/product.js:779-784`
- **Defect:** The sticky bar executes `document.querySelector('[data-product-buy]').click()`. However, `blocks/buy_buttons.liquid` only outputs `[data-product-buy]` when `block.settings.show_dynamic_checkout` is `false`. Since dynamic checkout is enabled by default, `[data-product-buy]` is never present in the DOM. Clicking "Buy Now" on the sticky bar fails silently.
- **Remediation:** Either coordinate directly with the form's submit event or submit via FormData directly to `/checkout`.

#### 4. Missing Mandatory Shipping Policy Link
- **Location:** `blocks/price.liquid:44-48`
- **Defect:** The price block checks `cart.taxes_included` but completely omits the mandatory shipping policy check:
  ```liquid
  {%- if shop.shipping_policy.body != blank -%}
    {{ 'products.product.shipping_policy_html' | t: link: shop.shipping_policy.url }}
  {%- endif -%}
  ```
- **Requirement:** Mandatory under official Shopify Theme Store requirements and EU/UK Consumer Protection Directives.
- **Remediation:** Insert the localized shipping policy link conditional directly under the tax notice.

---

### 3.2 P1 High-Impact Commercial & Modern Shopify Features

#### 1. Quantity Selector Bypasses B2B / Wholesale `variant.quantity_rule`
- **Location:** `snippets/quantity-selector.liquid:30-45`
- **Defect:** For product pages, `quantity-selector.liquid` hardcodes `min="1"` and `step="1"`. It ignores Shopify B2B and wholesale properties: `variant.quantity_rule.min`, `variant.quantity_rule.increment`, and `variant.quantity_rule.max`. Buyers of wholesale products with minimum order requirements (e.g. min 5, increments of 5) cannot place valid orders.
- **Remediation:** Pass `variant.quantity_rule` into `quantity-selector.liquid` and dynamically update attributes on variant change.

#### 2. Missing Volume Pricing Tier Table
- **Location:** `blocks/` (Absence of Volume Pricing Block)
- **Defect:** Shopify OS 2.0 now supports native volume pricing breaks (`variant.quantity_price_breaks`). The theme has zero UI representation for volume pricing, preventing B2B/wholesale merchants from displaying bulk discounts.
- **Remediation:** Create `blocks/volume_pricing.liquid` rendering pricing tiers table with dynamic quantity synchronization.

#### 3. Static Stock Counter Text on Variant Selection
- **Location:** `blocks/stock_counter.liquid:17-21`, `assets/product.js:571-578`
- **Defect:** `assets/product.js` looks for `counter.querySelector('[data-stock-qty]')` to update remaining inventory count upon variant change. In `blocks/stock_counter.liquid`, the number is rendered inside a plain translation string without a `[data-stock-qty]` container span, leaving the inventory number permanently frozen.
- **Remediation:** Wrap the count in `<span data-stock-qty>{{ inv }}</span>` within the translation placeholder.

#### 4. Recommendations Swiper Navigation Selector Collision
- **Location:** `sections/product-recommendations.liquid:32-35`, `assets/product.js:1044-1065`
- **Defect:** `ProductTemplateRelate.initSwiper()` initializes Swiper with global string selectors:
  ```javascript
  nextEl: '.swiper-button-next',
  prevEl: '.swiper-button-prev'
  ```
  Because the PDP media gallery (`sections/main-product.liquid:88-89`) uses the exact same class names, clicking the next/prev arrow on the Recommendations slider triggers slide transitions in the main product image gallery above.
- **Remediation:** Scope navigation selectors to `this.querySelector('.swiper-button-next')`.

#### 5. Missing `.rte` Container in Description and Tabs
- **Location:** `blocks/description.liquid:13`, `blocks/tab.liquid:67`
- **Defect:** `{{ product.description }}` is rendered without an `.rte` CSS wrapper. Merchant tables, ordered lists, embedded iframes, and blockquotes lose styling and bleed out of container boundaries.
- **Remediation:** Wrap description output in `<div class="product-template__description rte">`.

#### 6. Missing Page and Custom Liquid Options in Collapsible Rows
- **Location:** `blocks/collapsible_row.liquid:18-35`
- **Defect:** Accepts only a single `richtext` setting. Merchant cannot attach a Shopify page (e.g. Size Guide, Care Instructions, Materials) or Custom Liquid.
- **Remediation:** Add `page` and `liquid` setting types to the schema.

---

### 3.3 P2 Accessibility, SEO & Performance Optimizations

1. **Recommendations Immediate Fetch Competes with LCP:** `assets/product-recommendations.js:7-15` executes `fetch()` immediately inside `connectedCallback()`. For below-the-fold sections, this robs CPU and network bandwidth during initial page load, hurting mobile LCP. Fix: Wrap in an `IntersectionObserver`.
2. **Missing WAI-ARIA Keyboard Navigation on Tabs:** PDP tabs lack arrow key navigation and `tabindex` management, failing WCAG 2.1.1.
3. **Tab Extraction First-Paint CLS:** `blocks/tab.liquid` uses `<template data-tab-nav>` extracted by JS on load, causing a 48–60px layout shift of content on first paint.

---

## 4. Collection Page (PLP) Gaps & Defects

```mermaid
graph TD
  PLP[Collection Page: templates/collection.json] --> MAIN[sections/main-collection.liquid - 1042 lines]
  MAIN --> SORT[snippets/collection-sort.liquid]
  MAIN --> FACETS[snippets/collection-facet-filter.liquid]
  MAIN --> GRID[#CollectionProducts Grid]
  MAIN --> PAGIN[assets/collection.js: Infinite / Load More]
  
  MAIN -.-> PLP_BUG1[P0: 1042 Lines Violates Theme Check 600-line limit]
  FACETS -.-> PLP_BUG2[P0: Focus Destroyed on Checkbox Select - Reset to Body]
  SORT -.-> PLP_BUG3[P1: Active Filter Chips Trapped Inside Drawer - Missing on Grid]
  GRID -.-> PLP_BUG4[P0: Redundant link and script tags on every card]
  PAGIN -.-> PLP_BUG5[P1: Infinite Scroll Drops URL History - Back resets to Page 1]
  FACETS -.-> PLP_BUG6[P1: Price Preset Hardcoded to USD - Breaks VND/JPY]
```

### 4.1 P0 Theme Store Blockers & Critical Architectural Violations

#### 1. Monolithic Section Length (`sections/main-collection.liquid` - 1,042 Lines)
- **Location:** `sections/main-collection.liquid` (1,042 lines)
- **Violation:** Theme Check's `TemplateLength` rule strictly limits section templates to 600 lines. At 1,042 lines, automated CI and Shopify pre-screening tools flag this as an immediate error.
- **Remediation:** Refactor into dedicated modular snippets:
  - `snippets/collection-hero.liquid` (Banner & metadata)
  - `snippets/collection-filter-drawer.liquid` (Mobile drawer)
  - `snippets/collection-filter-modal.liquid` (Desktop modal layout)
  - `snippets/collection-grid-header.liquid` (Count, sorting, view switch)

#### 2. Repetitive `<link>` and `<script>` Tags in Product Card Loop
- **Location:** `snippets/product-card.liquid:58-61`
- **Defect:**
  ```liquid
  {{ 'product-card.css' | stylesheet_tag }}
  <script src="{{ 'product-card.js' | asset_url }}" defer></script>
  ```
  These tags are placed directly inside `snippets/product-card.liquid`. When a collection displays 24 products, the rendered HTML outputs **24 identical `<link rel="stylesheet">` tags and 24 identical `<script>` tags** inside the `<ul>` or grid container. This bloats the DOM, triggers redundant resource evaluations, and violates W3C validity.
- **Remediation:** Hoist `product-card.css` and `product-card.js` to `sections/main-collection.liquid` and `sections/featured-collection.liquid` section headers.

#### 3. Keyboard Focus Loss & Missing Screen Reader Live Regions on AJAX Filtering
- **Location:** `assets/collection.js:283-305`
- **Defect:** When a buyer clicks a facet filter checkbox, `collection.js` fetches the updated markup and performs a full replace:
  ```javascript
  currentFilters.innerHTML = newFilters.innerHTML;
  currentProducts.innerHTML = newProducts.innerHTML;
  ```
  The active element's focus is immediately destroyed, resetting focus to `document.body`. Furthermore, there are no `aria-live="polite"` regions announcing the updated product count. A screen-reader user has no confirmation whether 0 or 50 products matched their filter.
- **Violation:** WCAG 2.2 SC 2.4.3 (Focus Order) & SC 4.1.3 (Status Messages).
- **Remediation:** Record `document.activeElement.id` before dispatching fetch; restore focus to the matching ID or close button post-render. Add `<div class="visually-hidden" aria-live="polite">` announcing `{{ results_count }} products found`.

#### 4. Sort Dropdown Disconnected from Filter Form on No-JS / Mobile
- **Location:** `snippets/collection-sort.liquid:42-58`
- **Defect:** The sort select element sits outside `<form id="FacetFilterForm">` and lacks the HTML5 `form="FacetFilterForm"` attribute. In no-JS environments or when submitting forms naturally, sort selections are discarded.
- **Remediation:** Add `form="FacetFilterForm"` attribute to `<select name="sort_by">`.

---

### 4.2 P1 High-Impact Discovery & Conversion Gaps

#### 1. Active Filter Chips Missing Above Product Grid
- **Location:** `snippets/collection-sort.liquid`, `snippets/collection-facet-filter.liquid`
- **Defect:** In `filter_layout: 'modal'` or on mobile, active filter tags exist **only inside the filter drawer/modal**. When a user selects a filter and closes the modal, the product grid changes, but **there are zero visible chips indicating which filters are currently applied**. The user has to reopen the drawer to see or remove active filters.
- **Remediation:** Render an active filter pill bar above the product grid in `snippets/collection-sort.liquid` with individual "X" remove buttons and a "Clear All" button.

#### 2. Infinite Scroll & Load More Browsing Continuity / History Loss
- **Location:** `assets/collection.js:450-485` (`fetchAppendProducts`)
- **Defect:** When page 2 or page 3 is appended, `window.history.replaceState` is **never called** to update the URL with `?page=N`. If a buyer scrolls to page 3, clicks product #55, and then clicks the browser's Back button, they land back on page 1 with only the first 20 products. Their scroll position and browsing context are completely lost.
- **Remediation:** Update URL state via `window.history.replaceState({}, '', nextUrl)` on page append, and record scroll offset in `sessionStorage`.

#### 3. Hardcoded USD Currency Tiers in Price Filter
- **Location:** `snippets/collection-facet-filter.liquid:205-245`
- **Defect:** The price range preset buttons hardcode tiers assuming USD currency:
  ```liquid
  {%- if range_max > 250 -%}
    ... Under $50, $50 - $100, $100 - $250, Over $250
  ```
  In stores using non-decimal currencies (e.g. Vietnamese Dong where `range_max` is 5,000,000 VND, or Japanese Yen where `range_max` is 30,000 JPY), the code produces nonsensical, broken filter buttons.
- **Remediation:** Calculate price tier thresholds dynamically based on percentages of `filter.range_max` (e.g. 25%, 50%, 75%).

#### 4. Merchant Controls Missing for Product Card Display
- **Location:** `sections/main-collection.liquid:395-403`
- **Defect:** The section renders `product-card` with hardcoded defaults. The merchant settings schema lacks toggles for:
  - Show secondary image on hover (`show_secondary_image`)
  - Show quick add to cart button (`show_quick_add`)
  - Show quick view modal button (`show_quickview`)
  - Show color swatches preview (`show_swatches`)
- **Remediation:** Add schema checkboxes in `sections/main-collection.liquid` and pass them into `render 'product-card'`.

---

### 4.3 P2 Ergonomics, Internationalization & Polish

1. **Search Page Filtering Parity:** `sections/main-search.liquid` currently lacks the full Storefront Filtering architecture present in `main-collection.liquid`.
2. **Collection Empty State Polish:** When a collection has 0 matching products, it renders a single unstyled `<li>` without an icon, helpful suggestions, or a "Clear All Filters" CTA.
3. **URL Search Parameter Wiping:** `collection.js` reconstructs query strings from scratch, dropping UTM tracking parameters, marketing campaign tags, and search query `q`.

---

## 5. Structured Data & SEO Analysis

An audit of `snippets/head-meta-tags.liquid` and page microdata revealed three critical structured data deficiencies:

1. **Missing `aggregateRating` and `review` in Product Schema:** Despite the theme having an active reviews block (`blocks/rating.liquid`), the JSON-LD in `head-meta-tags.liquid` omits rating metafields from the `Product` schema, preventing Google Rich Snippet stars in search results.
2. **Missing `priceValidUntil` in Offer Schema:** Google Merchant Center and Search Console flag missing `priceValidUntil` warnings on all product variants.
3. **No `CollectionPage` or `ItemList` Schema:** Neither `head-meta-tags.liquid` nor `main-collection.liquid` outputs `ItemList` structured data for collection pages, forfeiting Google category carousel enhancements.
4. **Conflicting Breadcrumb Markup:** `sections/breadcrumb.liquid` outputs Microdata (`itemscope itemtype="http://schema.org/BreadcrumbList"`), while `head-meta-tags.liquid` outputs JSON-LD breadcrumbs, causing Googlebot validation conflicts.

---

## 6. Core Web Vitals & Accessibility Risk Matrix

| Risk Factor | Target Metric | Cause in Codebase | Recommended Fix |
| :--- | :--- | :--- | :--- |
| **LCP Delay (PDP)** | Largest Contentful Paint | First media image preload hint is bypassed if media #1 is a 3D model or video. | Ensure first image media receives `<link rel="preload">` regardless of 3D model presence. |
| **LCP Inversion (PLP)** | Largest Contentful Paint | `best_sellers` banner loads above grid with lazy images, while below-fold grid image has `fetchpriority="high"`. | Align `eager` and `fetchpriority="high"` strictly with the first visible rendered card. |
| **CLS (PDP Tabs)** | Cumulative Layout Shift | `blocks/tab.liquid` extracts tab navigation client-side from `<template>`, shifting body down ~50px. | Render tab headers statically in Liquid during SSR. |
| **CLS (Collection)** | Cumulative Layout Shift | `image-ratio--adapt` defaults to `aspect-ratio: auto`, collapsing card containers before image loads. | Enforce minimum height or reserve space with CSS custom property. |
| **INP (PDP Swatches)** | Interaction to Next Paint | Synchronous combinatorial variant loops in `variant-picker.js` and string URL parsing in `product.js`. | Cache variant lookup maps as a hash map and batch DOM mutations. |
| **WCAG SC 1.3.1** | HTML Semantic Validity | `blocks/buy_buttons.liquid` nests `<input>` and `<label>` inside `<summary>`, creating invalid interactive nesting. | Restructure markup so interactive form fields sit inside `<details>` content, not inside `<summary>`. |
| **WCAG SC 2.1.2** | Keyboard Focus Trap | Lightbox and Filter Modals lack focus traps and Escape key handlers. | Implement `ThemeUtils.trapFocus()` and `releaseFocus()`. |

---

## 7. Actionable Remediation Roadmap

The remediation strategy is organized into 4 prioritized phases:

```mermaid
timeline
  title Remediation Roadmap for Devs2 Rebel
  section Phase 1 : Core Commerce Fixes
    Fix forced subscriptions in buy_buttons.liquid : P0 Blocker
    Correct mobile sticky ATC top inversion : P0 Blocker
    Fix Sticky ATC Buy Now click delegation : P0 Blocker
    Add mandatory shipping policy link : P0 Blocker
  section Phase 2 : Code Hygiene & Discovery
    Hoist product-card.css & js from loop : P0 Blocker
    Modularize main-collection.liquid under 600 lines : P0 Blocker
    Implement Active Filter Chips above PLP grid : P1 High
    Preserve history state on infinite scroll : P1 High
  section Phase 3 : Accessibility & B2B
    Add AJAX focus restoration & aria-live region : P0 Blocker
    Respect variant.quantity_rule in quantity selector : P1 High
    Add Volume Pricing tier table block : P1 High
    Fix dynamic [data-stock-qty] inventory span : P1 High
  section Phase 4 : Rich Data & Polish
    Add Collection ItemList & Product Rating schema : P2
    Add merchant toggles for collection product cards : P1 High
    Unify Swiper recommendation component selectors : P1 High
    Sanitize collection.js URL parameter persistence : P2
```

### Phase 1: Core Commerce Integrity (Immediate P0 Fixes)
1. **Fix Forced Subscriptions:** In `blocks/buy_buttons.liquid`, remove the auto-assigned hidden `selling_plan` input. Provide explicit radio selections for one-time vs. subscription purchase.
2. **Fix Mobile Sticky ATC:** In `assets/product.css`, override `@media (max-width: 768px)` to `top: auto !important; bottom: 0 !important;` with safe-area padding.
3. **Fix Sticky ATC "Buy Now":** In `snippets/product-sticky-add.liquid`, update the action to trigger form submission directly.
4. **Add Shipping Policy:** In `blocks/price.liquid`, render `shop.shipping_policy.url` conditionally.

### Phase 2: Discovery & Filtering Hygiene
1. **Eliminate Card Loop Asset Bloat:** Remove `<link>` and `<script>` from `snippets/product-card.liquid`; place them once in the section header.
2. **Modularize `main-collection.liquid`:** Split the 1,042-line file into modular snippets to satisfy the 600-line Theme Check ceiling.
3. **Active Filter Chips:** Extract active filter pills from `collection-facet-filter.liquid` and render them in `collection-sort.liquid` right above the product grid.
4. **Infinite Scroll History State:** Call `window.history.replaceState` in `fetchAppendProducts` to persist pagination state.

### Phase 3: Accessibility & B2B Commerce
1. **Focus Restoration & Screen Reader Live Regions:** Update `collection.js` to preserve active element focus and update an `aria-live="polite"` element with product count.
2. **Support `variant.quantity_rule`:** Pass minimums, maximums, and increments into `quantity-selector.liquid`.
3. **Dynamic Inventory Count:** Add `<span data-stock-qty>` in `blocks/stock_counter.liquid`.
4. **Scope Recommendations Swiper:** Update `ProductTemplateRelate` to scope navigation selectors to the local container.

### Phase 4: Structured Data & Merchant Controls
1. **JSON-LD Completion:** Add `aggregateRating` to product schema and `ItemList` to collection pages.
2. **Merchant Card Controls:** Expose card toggles in `sections/main-collection.liquid`.
3. **Preserve Query Parameters:** Update `collection.js` to preserve UTM and marketing parameters during AJAX filtering.

---

## 8. Appendices & Ultra Verifier Adjudication

### Appendix A: Ultra Verifier Scoring Details

Kongming autonomous adjudication evaluated the 5 candidates against the rubric:

- **Candidate A (Candidate 2) — Score: 96/100 (WINNER):**
  - *Strengths:* Exceptional line-level specificity. Pinpointed the mobile CSS `!important` inversion on sticky ATC (`assets/product.css:523-543`), the static inventory quantity bug (`blocks/stock_counter.liquid`), and focus destruction on facet updates (`assets/collection.js:283-305`). Provided clear before/after code blocks.
  - *Recommendation:* Selected as the structural foundation of this report.
- **Candidate B (Candidate 4) — Score: 91/100:**
  - *Strengths:* Caught the critical "forced subscription" bug in `blocks/buy_buttons.liquid`, highlighted B2B quantity rules, and noted search page filtering parity.
- **Candidate C (Candidate 1) — Score: 91/100:**
  - *Strengths:* Strong legal and spec compliance focus; flagged mandatory shipping policy links, deceptive back-in-stock forms, and Swiper navigation selector collisions.
- **Candidate E (Candidate 3) — Score: 91/100:**
  - *Strengths:* Unmatched technical rigor on WCAG 2.2 AA accessibility, JSON-LD structured data conflicts, and browser performance (CLS/LCP/INP).
- **Candidate D (Candidate 5) — Score: 83/100:**
  - *Strengths:* Solid high-level categorization across 4 pillars.

### Appendix B: Unresolved Questions for Merchant Decision
1. **Subscriptions App Strategy:** Should the theme provide basic native Shopify `selling_plan_groups` Liquid selectors, or strictly rely on third-party app blocks (`@app`) like Recharge or Seal Subscriptions? *(Recommendation: Support native Liquid fallback + `@app` blocks).*
2. **Back-in-Stock Notification:** Should `blocks/back_in_stock.liquid` be completely removed from default presets to avoid Theme Store rejection, or converted to an explicit merchant inquiry form? *(Recommendation: Remove from default presets; provide as optional block).*
3. **Filter Layout Unification:** Should the theme maintain both the slide-in drawer and modal layouts, or consolidate into a single unified drawer on both desktop and mobile? *(Recommendation: Consolidate to unified drawer to save ~15KB CSS and streamline event handling).*
