# Research (ultra) - Rebel 1-Preset MVP: what remains before Shopify submission

Date: 2026-10-14 · Root: `E:/Work/shopify` · Mode: `ak:research --ultra` (5 read-only scout candidates + `kongming` verifier; same-tier best-of-5 for candidates)
Winner: Candidate B (unchanged), selected by verifier. Verifier verdict, spot-checks and the merged, verified checklist follow the winning report.
Live baseline: `shopify theme check` = 247 files, 1 error (`sections/main-article.liquid:134`), 1 warning (`snippets/content-toc.liquid` OrphanedSnippet, consequence of the same parse failure).

---

# Part 1 - Winning candidate report (B, unchanged)

# Deep MVP Submission Research Report — Candidate 5

## Executive Summary: What Remains for 1-Preset MVP Submission

Following the completion of Waves 1–4 on `2026-10-14` (`plans/reports/261014-problem-solving-ultra-mvp-plan.md:575-635`), **Rebel (`v1.0.0`, `config/settings_schema.json:3-9`)** has closed the primary Online Store 2.0 feature gaps (`search.filters` faceted filtering on `/search`, shared `snippets/product-media-item.liquid` across PDP/Featured Product/Quickview, `blocks/custom_liquid.liquid`, per-line customer order discounts in `sections/main-customers-order.liquid:126-163`, and `font_modify` variants across all 3 font pickers in `snippets/head-fonts.liquid:11-39`). All local AST validators pass (`node scripts/validate-locales.mjs`, `node scripts/validate-schema-ranges.mjs`, `node runs/e2e/settings-usage.cjs` with `946` settings and `0` unread).

With the user's approval of the **1-Preset MVP (`Rebel`)** strategy (`AGENTS.md:20-31`) and command execution authorization, what remains before submitting `dist/rebel-v1.0.0.zip` to the Shopify Theme Store falls into **three concrete buckets**:

| Bucket | Scope | Count | Summary of Remaining Items |
|---|---|---:|---|
| **1. In-Repo Code, Schema, Locale & Packaging Fixes** | Can be executed immediately on disk (`E:/Work/shopify`) | **12 items** | **1A.** Fix `sections/main-article.liquid:134` (`LiquidHTMLSyntaxError` + `OrphanedSnippet` on `snippets/content-toc.liquid:1`) to reach **0 errors, 0 warnings** in `shopify theme check`.<br>**1B.** Trim `config/settings_data.json:213-1048` (`Noir`, `Vibrant`, `Botanical`, `Cyber`) to 1 preset (`Rebel`) and exclude `listings/` from `dist/rebel-v1.0.0.zip` (`scripts/package-theme.py:3`, `.shopifyignore:43`).<br>**1C.** Purge `103` orphaned/stale schema locale leaf keys + `3` empty section objects in `locales/en.default.schema.json` and upgrade `scripts/validate-locales.mjs` to enforce reverse stale-key detection (`AGENTS.md:273-279`).<br>**1D.** Fix `escape \| url_encode` double-escaping and hardcoded `&type=product,article,page` in 4 search filter files (`snippets/collection-filter-drawer.liquid:12-13`, `snippets/collection-facet-filter.liquid:16-17`, `snippets/collection-active-filters.liquid:12-13`, `sections/main-search.liquid:59-60`).<br>**1E.** Restore `"default": "customer-account-main-menu"` in `sections/header.liquid:95` per official `<shopify-account>` spec (`shopify.dev/docs/storefronts/themes/customer-engagement/account-component`).<br>**1F.** Fix `sections/hero.liquid:208-295` countdown expiry/timezone/blank-state behavior, `sections/main-customers-order.liquid:47-71` missing `order.billing_address`, `sections/footer.liquid:52` missing `settings.social_pinterest_link`, `snippets/cart-modal.liquid:47` unconditional `taxes_included` copy, `sections/featured-product.liquid:107-111` blank-product onboarding state, `sections/logo-list.liquid:9-16,47,73` fresh-install visibility (`U-15b`), and residual `"DEVS2 REBEL"` / `devs2rebel` strings in `templates/index.json:105`, `templates/page.contact.json:23`, `sections/footer-group.json:43`, and `config/settings_data.json:167-172`. |
| **2. In-Repo Submission Artifacts & Live AntiFan QA** | Can be authored and executed in this workspace once `shopify theme dev` runs | **4 items** | **2A.** Author `docs/release-notes-v1.0.0.md` (and `CHANGELOG.md`) per `runs/.theme-store-requirements-261012.md:715-725` and `shopify.dev/docs/storefronts/themes/store/success/updates#release-notes`.<br>**2B.** Author `docs/theme-store-submission-checklist.md` (22-group readiness & evidence pack) and update stale `docs/theme-audit-log.md:33-52`.<br>**2C.** Execute the full 13-route × 3-viewport (`1440x900`, `768x1024`, `375x812`) AntiFan MCP verification matrix (`theme.qa_validate`, `theme.debug_bundle`, `anti.inspect.responsive_matrix`, `anti.screenshot.viewport`).<br>**2D.** Run and archive Lighthouse desktop & mobile reports (`perf >= 60`, `a11y >= 90` across `/`, PDP, PLP) under `plans/reports/`. |
| **3. External Partner & Shopify Admin Gates** | Require Partner Dashboard, DNS hosting, or Shopify Admin permissions | **5 items** | **3A.** Provision **1 Client Transfer Store** in the Shopify Partner Dashboard (`req L727-735`; dev stores cannot be transferred).<br>**3B.** Configure **Bogus Gateway** or **Shopify Payments Test Mode** on the demo store with all other checkout methods disabled (`req L735`).<br>**3C.** Resolve DNS and deploy public docs at `https://docs.devs2.com/rebel` and support portal at `https://devs2.com/support` (`config/settings_schema.json:7-8`, `req L760-762`).<br>**3D.** Publish the compliant **Merchant Support Contact Form** (Name, Email, Store URL example, Description textarea, **File Upload**, **Auto-responder**) at `https://devs2.com/support` (`req L790-804`).<br>**3E.** Complete manual **Shopify Admin** data updates on the demo store: rename `"ski wax"` selling plan group on `leather-care-balm`, create Terms/Refund/Shipping policies (`Settings > Policies`), and set homepage `og:image` + meta description (`Online Store > Preferences`). |

---

## R1: 1-Preset MVP (`Rebel`) Architecture & Packaging Blueprint

### 1.1 Official Requirement Verification (`runs/.theme-store-requirements-261012.md:666-735` & `shopify.dev` Zip Structure Spec)

Cross-checking `runs/.theme-store-requirements-261012.md:666-735` and `https://shopify.dev/docs/storefronts/themes/store/success/updates#best-practices-on-structuring-your-theme-zip` establishes three binding rules for a 1-Preset MVP (`Rebel`) submission:

1. **`listings/` Folder Rule for 1-Preset vs. Multi-Preset Themes (`req L668-703`):**
   - `runs/.theme-store-requirements-261012.md:668-670`: *"If you have more than one preset, you need to include a unique set of templates showcasing each preset... Preset templates need to be included in a `/listings` folder in your theme zip."*
   - `runs/.theme-store-requirements-261012.md:699`: *"If you only have one preset, you do not need to include the `/listings` folder."*
   - `shopify.dev/docs/storefronts/themes/store/success/updates` (*Best practices on structuring your theme zip*): *"Root level `/templates` and `/sections` folders should include the complete 'base' set of .json files... Don't: Duplicate .json files for every preset when the contents are identical."*
   - **Disk Verification (`templates/*.json` vs. `listings/rebel/templates/*.json`):** On disk, `templates/index.json:1-639` and `listings/rebel/templates/index.json:1-639` (along with the other 14 JSON templates) contain the exact same `Rebel` preset configuration. Therefore, for a 1-preset submission, **including `listings/` or `listings/rebel/` in `dist/rebel-v1.0.0.zip` is both unnecessary (`req L699`) and violates the anti-duplication rule (`updates.md`)**.
2. **Eliminating the 4 Extra Demo Transfer Stores Blocker (`U-20`, `req L727-735`):**
   - `runs/.theme-store-requirements-261012.md:729-735`: *"To build your demo store, create a client transfer store in the Dev Dashboard. Note: Dev stores can't be transferred... All theme presets must include at least one demo store."*
   - When `config/settings_data.json` defines 5 presets (`Rebel`, `Noir`, `Vibrant`, `Botanical`, `Cyber`), Shopify requires **5 separate client transfer demo stores**. Trimming `config/settings_data.json` to 1 preset (`"current": "Rebel"`, `"presets": { "Rebel": { ... } }`) and excluding `listings/` from the packaged ZIP reduces the mandatory demo store count from **5 client transfer stores to 1**, directly aligning with `AGENTS.md:20-31` (*"The current delivery phase implements exactly one style preset first"*).
3. **Preserving Extensible Multi-Preset Architecture for `v1.1.0` (`AGENTS.md:22-25`):**
   - All token derivations in `snippets/head-color-schemes.liquid:18-133` (`--color-surface`, `--color-{success,warning,error}-text`, `--color-accent-text`, `--color-primary-text`, `--text-alpha-floor`, `--color-inverse-button`) and `snippets/head-design-systems.liquid:95-123` (`--buttons-radius`, `--inputs-radius`, `--card-corner-radius`, `--media-radius`, `--badge-corner-radius`, `--variant-pills-radius`) iterate dynamically over `settings.color_schemes` and `settings.*` without preset-specific markup branches.
   - Keeping `listings/{rebel,noir,vibrant,botanical,cyber}/templates/*.json` and `listings/manifest.json` on disk (excluded from the 1-preset ZIP) preserves 100% of the 5-preset template work for phase 2 (`v1.1.0`).

### 1.2 Exact File-by-File Changes for 1-Preset MVP Packaging

| File (`path:line`) | Current State on Disk | Required 1-Preset MVP State | Impact on Validators & ZIP |
|---|---|---|---|
| `config/settings_data.json:1-1050` | `"current": "Rebel"` (`:2`), `"presets"` contains `"Rebel"` (`:4-212`), `"Noir"` (`:213-421`), `"Vibrant"` (`:422-630`), `"Botanical"` (`:631-839`), `"Cyber"` (`:840-1048`). Also `:167-172` pre-fills `social_*_link` with `https://.../devs2rebel`. | Remove lines `213–1048` (`Noir`, `Vibrant`, `Botanical`, `Cyber`) so `"presets"` contains only `"Rebel"` (`:4-212`). Clear `"social_*_link": ""` at `:167-172` so merchant installs do not inherit partner social URLs. | `node scripts/validate-schema-ranges.mjs:46-63` iterates `Object.entries(settingsData.presets)` and validates all 67 range settings on `"Rebel"` (`PASS`). |
| `scripts/package-theme.py:1-44` | Line `3` hardcodes `THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'listings', 'locales', 'sections', 'snippets', 'templates']`, packaging `75` `listings/*` files into `dist/rebel-v1.0.0.zip` (`324` files total). | Read `config/settings_data.json` preset count; include `'listings'` in `THEME_DIRS` only when `len(presets) > 1` (and still ignore `listings/manifest.json`). | Reduces `dist/rebel-v1.0.0.zip` from `324` files to **`249` files** (`0` files under `listings/`), matching `req L699` and `updates.md`. |
| `.shopifyignore:1-43` | Line `43` ignores `listings/manifest.json`, but `shopify theme push` / `shopify theme package` would still upload `listings/{rebel,noir,vibrant,botanical,cyber}/` unless ignored during 1-preset MVP. | Replace `listings/manifest.json` at line `43` with `listings/` for the 1-preset MVP phase (revert to `listings/manifest.json` when shipping multi-preset `v1.1.0`). | Ensures both `python scripts/package-theme.py` and native `shopify theme package` / `push` exclude `listings/` in 1-preset mode. |
| `listings/manifest.json:1-37` | Kept on disk for local tooling (`preset-contrast.cjs` / phase 2 reference); `"author": "Devs2"` (`:4`). | Keep on disk (excluded from ZIP by `.shopifyignore:43`). | Zero impact on ZIP; preserves multi-preset metadata on disk. |

---

## R2: Code, Schema & Locale Hygiene Findings (Exact File:Line Fixes)

### 2.1 `sections/main-article.liquid:134` (`LiquidHTMLSyntaxError` + `OrphanedSnippet` on `snippets/content-toc.liquid:1`)

- **Observed Telemetry:** `shopify theme check` reports:
  1. `sections/main-article.liquid:134` — `[error]: LiquidHTMLSyntaxError: Attempting to close LiquidTag 'capture' before it was opened without a matching 'capture'`.
  2. `snippets/content-toc.liquid:1` — `[warning]: OrphanedSnippet: This snippet is not referenced by any other files`.
- **Root Cause (`sections/main-article.liquid:130-137`):**
  ```liquid
  130:        {%- if show_toc -%}
  131:          {%- render 'content-toc', content: article.content -%}
  132:        {%- endif -%}
  133:
  134:        {%- capture table_open -%}<div class="article-template__table" role="region" tabindex="0" aria-label="{{ 'blogs.article.table_label' | t | escape }}"><table{%- endcapture -%}
  135:        <div class="article-template__content rte" itemprop="articleBody">
  136:          {{ article.content | replace: '<table', table_open | replace: '</table>', '</table></div>' }}
  137:        </div>
  ```
  In `@shopify/liquid-html-parser`, `{%- capture ... -%}` parses its body as an HTML AST. Because `<table` at the end of line `134` has no closing `>`, the HTML parser treats `{%- endcapture -%}` as an attribute inside the unclosed `<table` start tag and fails AST parsing for the entire `sections/main-article.liquid` file. Because `sections/main-article.liquid` fails AST parsing, Theme Check never sees line `131` (`{%- render 'content-toc', content: article.content -%}`), triggering the false-positive `OrphanedSnippet` warning on `snippets/content-toc.liquid:1`!
- **Exact Fix (`sections/main-article.liquid:134`):** Construct `table_open` inside a `{%- liquid -%}` tag using string concatenation so `<table` sits inside a quoted Liquid string literal rather than raw HTML markup:
  ```liquid
  {%- liquid
    assign table_label = 'blogs.article.table_label' | t | escape
    assign table_open = '<div class="article-template__table" role="region" tabindex="0" aria-label="' | append: table_label | append: '"><table'
  -%}
  ```
  Fixing line `134` resolves **both** the `LiquidHTMLSyntaxError` error and the `OrphanedSnippet` warning in a single edit.

### 2.2 Stale / Orphaned & Blank Key Audit Across `locales/en.default.schema.json` and `locales/en.default.json`

- **Blank Value Check (`jq` verification):**
  - `locales/en.default.schema.json` (`2,202` scalar leaves) and `locales/en.default.json` (`709` scalar leaves across 12 top-level namespaces) contain **0 blank (`""` or whitespace-only) values**.
- **Why `scripts/validate-locales.mjs:80-128` Missed Stale Keys:**
  - `scripts/validate-locales.mjs` currently performs only **forward resolution** (every `| t` and `"t:..."` in code resolves to a non-blank key in JSON). It does not perform **reverse resolution** required by `AGENTS.md:273-279` (*"compare exact paths against parsed locale JSON and report missing, stale, duplicate, or blank keys"*).
- **Complete Inventory of Orphaned/Stale Keys in `locales/en.default.schema.json`:**

| Stale Group | Exact `file:line` in `locales/en.default.schema.json` | Leaf Count | Why It Is Orphaned / Stale | Exact Action |
|---|---|---:|---|---|
| **1. Social Media `.info` Placeholders** | `locales/en.default.schema.json:267, 271, 275, 279, 283, 287` (`settings_schema.social-media.settings.social_{facebook,instagram,youtube,tiktok,twitter,pinterest}_link.info`) | **6 leaves** | Wave 3 removed `"placeholder": "t:settings_schema.social-media.settings.social_*_link.info"` from `config/settings_schema.json:1154-1184` (`U-07`), leaving these 6 `.info` keys unreferenced anywhere in the repo. | Delete the 6 `"info": "https://..."` lines at `:267, 271, 275, 279, 283, 287`. |
| **2. Purged Coupon Global Settings** | `locales/en.default.schema.json:591-596` (`settings_schema.product.settings.header__coupon.content`, `settings_schema.product.settings.coupon_label.label`) | **2 leaves** | Milestone M2 (`afaff2c`) purged the deceptive Coupon modal from `config/settings_schema.json:1487-1522`, leaving `header__coupon` and `coupon_label` orphaned. | Delete lines `591–596` in `locales/en.default.schema.json`. |
| **3. Purged Coupon Block on `main_product`** | `locales/en.default.schema.json:956-958` (`sections.main_product.blocks.coupon.name`) | **1 leaf** | Milestone M2 (`afaff2c`) deleted the `coupon` block from `sections/main-product.liquid`, leaving `blocks.coupon.name` unreferenced. | Delete lines `956–958` in `locales/en.default.schema.json`. |
| **4. Empty Section Objects** | `locales/en.default.schema.json:2801` (`"cart": {}`), `:2802` (`"featured_blog": {}`), `:3020` (`"collection_template": {}`) | **3 empty objects** | Leftover empty shells from earlier schema restructuring (`0` leaves, `0` references). | Delete lines `2801`, `2802`, and `3020` in `locales/en.default.schema.json`. |
| **5. Pruned Legacy Sections (Milestone M1 `aa4b8e9`)** | `locales/en.default.schema.json`:<br>- `sections.banner_link` (`:1968-1995`, 10 leaves)<br>- `sections.flash_sale` (`:2312-2349`, 12 leaves)<br>- `sections.featured_countdown` (`:2350-2412`, 21 leaves)<br>- `sections.countdown_timer` (`:2413-2493`, 27 leaves)<br>- `sections.button_group` (`:2676-2722`, 13 leaves)<br>- `sections.age_verification` (`:2723-2759`, 11 leaves) | **94 leaves** | These 6 section `.liquid` files were deleted in commit `aa4b8e9`; verified via `grep` that `0` `t:sections.<name>.*` references exist anywhere in the repo. *(Note: `sections.countdown` at `:1027-1080` IS actively referenced by `sections/main-collection.liquid:902-983` and must be kept).* | Delete those 6 legacy section blocks (`94` leaves) from `locales/en.default.schema.json` and add reverse stale-key checking for `en.default.schema.json` to `scripts/validate-locales.mjs`. |

### 2.3 Search `clear_url` Double-Escaping & Hardcoded `type` in 4 Files

- **Verified Evidence (`file:line`):**
  1. `snippets/collection-filter-drawer.liquid:12-13`
  2. `snippets/collection-facet-filter.liquid:16-17`
  3. `snippets/collection-active-filters.liquid:12-13`
  4. `sections/main-search.liquid:59-60`
- **Current Code in All 4 Files:**
  ```liquid
  assign terms_encoded = results.terms | escape | url_encode
  assign results_url = routes.search_url | append: '?q=' | append: terms_encoded | append: '&type=product,article,page'
  ```
  (and `search.terms | escape | url_encode` in `sections/main-search.liquid:59-60`).
- **Two Defects Identified:**
  1. **HTML-Escaping Before `url_encode` Corrupts Search Queries:** Piping `results.terms` through `escape` before `url_encode` converts `&` → `&amp;`, `'` → `&#39;`, and `"` → `&quot;`, and then `url_encode` percent-encodes the literal HTML entity characters (`&amp;` → `%26amp%3B`, `&#39;` → `%26%2339%3B`). Clicking "Clear all" on a query like `men's & women's` navigates to `?q=men%26%2339%3Bs+%26amp%3B+women%26%2339%3Bs`, breaking search results.
  2. **Hardcoded `&type=product,article,page` Overrides `results.types`:** If a search was scoped to specific object types (e.g., `?type=product` from predictive search or JSON-LD `SearchAction` at `snippets/head-meta-tags.liquid:99`), hardcoding `&type=product,article,page` overrides `results.types`.
- **Exact Replacement for All 4 Files:**
  ```liquid
  assign terms_encoded = results.terms | url_encode
  assign search_types = results.types | join: ',' | default: 'product,article,page'
  assign results_url = routes.search_url | append: '?q=' | append: terms_encoded | append: '&type=' | append: search_types
  ```
  *(In `sections/main-search.liquid:59-60`, use `search.terms | url_encode` and `search.types | join: ',' | default: 'product,article,page'`.)*

### 2.4 Header `customer_account_menu` Default (`sections/header.liquid:33,62,92-96` & `snippets/mobile-menu.liquid:83`)

- **Current State on Disk:**
  - `sections/header.liquid:33`: `<shopify-account menu="{{ section.settings.customer_account_menu }}">`
  - `sections/header.liquid:62`: `{%- render 'mobile-menu', menu_handle: section.settings.menu, customer_account_menu: section.settings.customer_account_menu -%}`
  - `snippets/mobile-menu.liquid:83`: `<shopify-account menu="{{ customer_account_menu }}">`
  - `sections/header.liquid:92-96`:
    ```json
    {
      "type": "link_list",
      "id": "customer_account_menu",
      "label": "t:sections.header.settings.customer_account_menu.label",
      "default": "main-menu"
    }
    ```
  - `sections/header-group.json:21-28`: does not set `customer_account_menu`, so it inherits the schema `"default"` from `sections/header.liquid:95`.
- **Official `shopify.dev` Verification (`https://shopify.dev/docs/storefronts/themes/customer-engagement/account-component` & `https://shopify.dev/docs/api/storefront-web-components/components/shopify-account`):**
  - Official Shopify documentation for `<shopify-account>` (linked directly from `runs/.theme-store-requirements-261012.md:169-172`) explicitly specifies:
    ```json
    // Add to schema section in header.liquid
    {
      "type": "link_list",
      "id": "customer_account_menu",
      "label": "Customer account menu",
      "default": "customer-account-main-menu"
    }
    ```
    *"The component should use `customer-account-main-menu` to refer to the same menu used in customer accounts. Default links include the Orders and Profile pages."*
  - **Runtime Consequence of `"default": "main-menu"`:** Because Wave 3 changed `sections/header.liquid:95` to `"default": "main-menu"`, `<shopify-account menu="main-menu">` now loads the storefront's primary catalog navigation menu (`Shop`, `Collections`, `About`, `Contact`) inside the Customer Account sign-in/profile popover instead of `Orders` and `Profile`!
  - **Resolution:** Restore `"default": "customer-account-main-menu"` at `sections/header.liquid:95`. The primary navigation menu setting (`"id": "menu"` at `sections/header.liquid:85-89`) already satisfies `req L473` with `"default": "main-menu"`, while `customer_account_menu` follows Shopify's official `<shopify-account>` specification (`req L169-172`).

### 2.5 Hero Countdown Block vs. Countdown Banner Behaviour (`sections/hero.liquid:208-295,1147-1159` vs. `snippets/countdown-banner.liquid` / `assets/countdown-banner.js`)

- **`snippets/countdown-banner.liquid:55-68` + `assets/countdown-banner.js:6-59` (Used in `sections/main-collection.liquid:149-163`):**
  - **Status: PASS.** Renders `<countdown-banner>` only when `{%- if end_date != blank -%}` (`:55`), passes store timezone `data-tz-offset="{{ 'now' | date: '%z' }}"` (`:62`), uses `role="timer"` (`:89`), stops its timer on `disconnectedCallback()` (`assets/countdown-banner.js:32-34`), and sets `this.hidden = true` when `end_date` is invalid (`:20`) or expired (`diff <= 0` when `!this.showAfterExpired` at `:50-55`).
- **`sections/hero.liquid:208-295,1147-1159` (`when 'countdown'` block inside Hero section):**
  - **Status: FAIL (3 bugs verified on disk).**
  1. **Blank or Invalid `end_date` Shows `00:00:00:00`:** `sections/hero.liquid:208-236` renders `.section-hero__countdown` unconditionally even when `block.settings.end_date == blank`. In the inline `<script>` (`:267-268`), `if (isNaN(endDate)) return;` leaves the static `00 : 00 : 00 : 00` markup visible on the storefront instead of hiding `el.hidden = true`.
  2. **Past `end_date` Shows `00:00:00:00` Instead of Hiding:** At `:276-291`, when `endDate <= Date.now()`, `var diff = Math.max(0, endDate - now)` renders `00 : 00 : 00 : 00` permanently on the hero instead of hiding the expired countdown block (`if (diff <= 0) { el.hidden = true; return; }`).
  3. **Missing Store Timezone Offset & `role="timer"` (`DESIGN.md:133-135`):** `sections/hero.liquid:210-217` lacks `role="timer"` and `data-tz-offset="{{ 'now' | date: '%z' }}"`, and `:267` parses `new Date(el.dataset.countdownEnd)` in the shopper's local browser timezone rather than the store's timezone.
  - **Exact Fix (`sections/hero.liquid:208-295`):** Wrap `{%- when 'countdown' -%}` in `{%- if block.settings.end_date != blank -%}`, add `role="timer"` and `data-tz-offset="{{ 'now' | date: '%z' }}"` on `.section-hero__countdown` (`:209-217`), and in the script (`:267-291`) append the store timezone offset when no offset is present, and set `el.hidden = true; return;` whenever `isNaN(endDate)` or `endDate - Date.now() <= 0` (outside `Shopify.designMode`).

---

## R3: 22-Group Official Theme Store Requirement Audit (Surface-by-Surface)

### 3.1 Surface-by-Surface Deep Audit (R3.1 – R3.8)

| Surface | Inspected Files (`path:line`) | Verified Compliant Contracts | Remaining Gaps Found (`file:line` & Fix) |
|---|---|---|---|
| **1. Footer & Legal** | `sections/footer.liquid:1-344`, `sections/footer-group.json:1-54` | - `{{ powered_by_link }}` unaltered (`sections/footer.liquid:129`, `req L741-743`).<br>- Full-color payment icons via `shop.enabled_payment_types` + `payment_type_svg_tag: class: 'icon icon--full-color'` (`:130-137`, `req L246`).<br>- Follow on Shop via `{{ shop \| login_button: action: 'follow' }}` (`:138-142`, `req L163-167`).<br>- Country & language selectors (`localization.available_countries`, `localization.available_languages`, `{%- form 'localization' -%}` at `:160-198`, `req L120-126`).<br>- Newsletter signup (`{%- form 'customer', id: 'FooterNewsletter' -%}` at `:75-97`, `req L131`).<br>- `menu` block `link_list` has `"default": "footer"` (`:326`, `req L473`).<br>- Zero hardcoded `shopify.com` links lacking `rel="nofollow"` (`req L745`). | 1. **Missing Pinterest Icon in Footer (`sections/footer.liquid:27-53`):** `config/settings_schema.json:1181` defines `settings.social_pinterest_link`, and `snippets/shop-social.liquid:42-48` renders it, but `sections/footer.liquid:27-53` renders only Facebook, Instagram, YouTube, TikTok, and Twitter/X. Add `{%- if settings.social_pinterest_link != blank -%}...{%- endif -%}` at `sections/footer.liquid:52`.<br>2. **Partner Email in Default Footer Group (`sections/footer-group.json:43`):** Change `"email": "contact@devs2-rebel.com"` to `"email": "atelier@rebel-tailoring.com"` (or blank). |
| **2. Cart (Page & Drawer)** | `sections/main-cart.liquid:1-167`, `sections/main-cart-items.liquid:1-54`, `snippets/cart-modal.liquid:1-60`, `snippets/cart-items.liquid:1-57`, `snippets/cart-line-details.liquid:1-61`, `snippets/cart-line-price.liquid:1-19`, `snippets/cart-total.liquid:1-47`, `assets/cart.js:1-310`, `assets/cart-modal.js:1-256` | - Line-level discounts (`item.line_level_discount_allocations` in `snippets/cart-line-details.liquid:50-59`) + strikethrough `item.original_line_price` (`snippets/cart-line-price.liquid:7-9`, `req L96`).<br>- Cart-level discounts (`cart.cart_level_discount_applications` in `snippets/cart-total.liquid:13-18` and `assets/cart-modal.js:196-205`, `req L96`).<br>- Unit price (`item.unit_price` + `item.unit_price_measurement` in `snippets/cart-line-price.liquid:11-16`, `req L155-159`).<br>- Selling plan name (`item.selling_plan_allocation.selling_plan.name` in `snippets/cart-line-details.liquid:17-21`, `req L151-153`).<br>- Cart note (`cart.note` in `sections/main-cart.liquid:32` and `snippets/cart-modal.liquid:38`, `req L342`).<br>- Taxes & shipping policy on `/cart` (`cart.taxes_included` and `shop.shipping_policy.body` in `snippets/cart-total.liquid:26-35`, `req L336`).<br>- Dynamic checkout buttons (`content_for_additional_checkout_buttons` in `snippets/cart-total.liquid:40-44`, `req L99-105, L345`). | **Unconditional Taxes-Included Copy in Cart Drawer (`snippets/cart-modal.liquid:47`):** Line `47` hardcodes `{{ 'sections.cart.taxes_included_shipping_at_checkout_without_policy' \| t }}` ("Taxes included. Discounts and shipping calculated at checkout.") even when `cart.taxes_included` is `false` or `shop.shipping_policy.body != blank`. Replace `snippets/cart-modal.liquid:47` with the same conditional `cart.taxes_included` / `shop.shipping_policy.body` logic used in `snippets/cart-total.liquid:26-35`. |
| **3. Product, Featured Product & Quickview** | `sections/main-product.liquid:1-147`, `sections/featured-product.liquid:1-370`, `templates/product.quickview.liquid:1-130`, `snippets/product-media-item.liquid:1-84`, `blocks/*.liquid` (22 files), `templates/product.json:1-123`, `assets/product.js:1-820`, `assets/quickview-modal.js:1-245` | - `@app` and `@theme` blocks supported in both `sections/main-product.liquid:134-141` and `sections/featured-product.liquid:351-356` (`req L202-204`).<br>- All 22 `@theme` blocks present in `blocks/*.liquid`, including `blocks/custom_liquid.liquid:1-25` (`U-08`) and `blocks/pickup_availability.liquid:1-47` wired in `templates/product.json:63-65,98` (`U-04`).<br>- Rich media (`image`, `external_video`, `video`, `model` + `data-shopify-xr` + `ModelJson-*`) rendered across `main-product.liquid:27-36,105-112`, `featured-product.liquid:34-40,114-121`, and `product.quickview.liquid:30-36,123-130` (`req L147`, `U-02`).<br>- Accelerated checkout (`{{ form \| payment_button }}` in `blocks/buy_buttons.liquid:158`, `req L99-105`) and Shop Pay Installments (`{{ form \| payment_terms }}` in `blocks/payment_installments.liquid:15`, `req L154`).<br>- Unit price (`blocks/price.liquid:41-46`) and tax/shipping policy (`blocks/price.liquid:47-57`, `req L260, L265`).<br>- Gift card recipient form inside `{%- form 'product' -%}` using `form.errors`, `form.email`, `form.name`, `form.message`, `form.send_on` (`blocks/buy_buttons.liquid:19-52`, `req L275-289`, `U-03`).<br>- Native category swatches (`value.swatch.image`, `value.swatch.color` in `snippets/swatch.liquid:1-31`, `req L291-295`).<br>- B2B `variant.quantity_rule` (`min`, `max`, `increment` in `blocks/quantity_selector.liquid:8-10`, `snippets/quantity-selector.liquid:14-35`, `assets/product.js:576-588`). Verified `runs/.theme-store-requirements-261012.md` has `0` mentions of `quantity_price_breaks` / `volume_pricing` (optional B2B feature, not a Theme Store requirement). | **Featured Product Blank-State Onboarding (`sections/featured-product.liquid:23,107-111`):** When `section.settings.product == blank` (fresh merchant install when a Featured Product section is added before selecting a product), `sections/featured-product.liquid:107-111` renders `.section-featured-product__empty` only in `request.design_mode` and collapses to `0px` on the storefront. Render the 2-column onboarding placeholder (`'product-1' \| placeholder_svg_tag`, `{{ 'onboarding.product_title' \| t }}`, sample price `{{ 1999 \| money }}`) when `product == blank` (`req L592-600, L707-711`). |
| **4. Gift Card** | `templates/gift_card.liquid:1-2`, `layout/gift_card.liquid:1-22`, `sections/main-gift-card.liquid:1-54`, `assets/gift-card.css` | - Uses `layout/gift_card.liquid` loading `vendor/qrcode.js` (`:14`) and `gift-card.css` (`:16`).<br>- Outputs `shop.name` (`sections/main-gift-card.liquid:7`), `gift_card.balance` (`:8`), `gift_card.expires_on` (`:11-14`), QR code at `144x144px` (`>= 120x120px` min, `:17-19,39`), `gift_card.code \| format_code` (`:21`), Apple Wallet `gift_card.pass_url` (`:23-25`), copy button + print button (`:27-28`), and zero missing locale keys (`req L386-391`). | **None (`PASS`).** |
| **5. Password** | `templates/password.json:1-15`, `layout/password.liquid:1-29`, `sections/main-password-header.liquid:1-34`, `sections/main-password.liquid:1-116`, `sections/main-password-footer.liquid:1-16` | - Outputs `settings.logo` or `shop.name` (`sections/main-password-header.liquid:4-23`), `shop.password_message` (`sections/main-password.liquid:6-10`), `{%- form 'storefront_password' -%}` with error state and accessible labels (`:51-85`), merchant admin login link (`:84`), and unaltered `{{ powered_by_link }}` (`sections/main-password-footer.liquid:5`, `req L393-400`). | **None (`PASS`).** |
| **6. Customer Accounts & Order** | `templates/customers/*.json` (7 files), `sections/main-customers-{account,order,addresses,login,register,activate,reset}.liquid`, `assets/customer.js:1-230` | - All 7 customer JSON templates and sections present.<br>- `sections/main-customers-order.liquid` outputs order date, number, payment/fulfillment status, fulfillment `tracking_url` + `tracking_number` (`:36-44`), `order.shipping_address` (`:48-71`), line-item SKU (`:120-122`), `selling_plan_allocation.selling_plan.name` (`:123-125`), per-line `line_level_discount_allocations` (`:126-134`), strikethrough `original_price`/`original_line_price` (`:139-143,155-159`), `unit_price` (`:145-150`), `order.line_items_subtotal_price` (`:168-171`), `order.discount_applications` (`:172-177`), `order.shipping_methods` (`:178-186`), `order.tax_lines` (`:187-192`), `order.total_duties` (`:193-198`), and `order.total_price` (`:199-202`, `req L96`). | **Missing `order.billing_address` Card (`sections/main-customers-order.liquid:47-71`):** `sections/main-customers-order.liquid:48-71` renders `order.shipping_address`, `payment`, and `note`, but omits `order.billing_address`! The locale key `customer.order.billing_address` (`"Billing Address"`) already exists in `locales/en.default.json:911`. Add the `{%- if order.billing_address -%}...{%- endif -%}` detail card before `order.shipping_address` at `sections/main-customers-order.liquid:48`. |
| **7. Blog, Article, Page, Contact, 404, List-Collections** | `sections/main-blog.liquid:1-1117`, `snippets/article-card.liquid:1-145`, `sections/main-article.liquid:1-881`, `sections/main-page.liquid:1-46`, `sections/page-contact.liquid:1-392`, `sections/contact-form.liquid:1-470`, `sections/main-404.liquid:1-204`, `sections/main-list-collections.liquid:1-489`, `snippets/collection-card.liquid:1-95` | - **Blog (`req L354-363`):** Outputs `blog.title` (`main-blog.liquid:58`), `article.title` (not truncated, linked), `article.image`, `article.excerpt_or_content` (`snippets/article-card.liquid:107`), and `{%- paginate blog.articles -%}` (`main-blog.liquid:52`).<br>- **Article (`req L365-374`):** Outputs `article.title` (`main-article.liquid:94`), `article.published_at` (`:115`), `{%- form 'new_comment', article -%}` with `blog.moderated?` notice, `form.posted_successfully?`, `form.errors`, and `{%- paginate article.comments by 20 -%}` (`:320-458`).<br>- **Page & Contact (`req L347-352`):** `main-page.liquid:11-16` outputs `page.title` and `page.content`; `templates/page.contact.json` uses `sections/page-contact.liquid:131-260` (`{%- form 'contact' -%}` with success/error states).<br>- **404 (`req L381-384`):** `main-404.liquid:57-91` outputs clear message, search form, and links to `routes.root_url` and `routes.all_products_collection_url`.<br>- **List-Collections (`req L318-325`):** `main-list-collections.liquid:56-97` paginates `collections`, and `snippets/collection-card.liquid:6,45` uses `collection.featured_image` and `'collection-1' \| placeholder_svg_tag`. | 1. **Fix `sections/main-article.liquid:134`** (`LiquidHTMLSyntaxError` on `capture table_open`, detailed in R2.1).<br>2. **Partner Brand Copy in Templates (`templates/index.json:105`, `templates/page.contact.json:23`):** Replace `"text": "DEVS2 REBEL"` with `"text": "REBEL ATELIER"` in `templates/index.json:105` (+ `listings/*/templates/index.json:105`) and `"email": "contact@devs2-rebel.com"` in `templates/page.contact.json:23` (+ `listings/*/templates/page.contact.json:23`). |
| **8. SEO & Metadata** | `snippets/head-meta-tags.liquid:1-251`, `sections/page-faq.liquid`, `sections/page-stores.liquid`, `sections/main-blog.liquid`, `sections/main-list-collections.liquid` | - Canonical URL (`<link rel="canonical" href="{{ og_url }}">` at `:36`), `<title>` (`:48-53`), `<meta name="description">` (`:55`), Open Graph (`og:site_name`, `og:url`, `og:title`, `og:type`, `og:description`, `og:image` with `https:{{ page_image \| image_url }}`, `og:price:*` at `:58-77`), Twitter Cards (`:81-91`).<br>- Valid JSON-LD (`WebSite` + `Organization` on `index` at `:94-131`, `Product` + `BreadcrumbList` on `product` at `:133-196`, `BreadcrumbList` on `collection` at `:198-208`, `BlogPosting` + `BreadcrumbList` on `article` at `:210-250`, `FAQPage` in `page-faq.liquid`, `LocalBusiness` in `page-stores.liquid`, `ItemList` in `main-blog.liquid` & `main-list-collections.liquid:121-123`).<br>- Zero `templates/robots.txt.liquid` (`req L438`). | **None in theme code (`PASS`).** *(Homepage `og:image` and meta description on `devs2-rebel.myshopify.com` are Shopify Admin `Online Store > Preferences` fields — see R5.2).* |

### 3.2 Complete 22-Group Official Theme Store Readiness Roll-Up

| # | Official Requirement Group | Status | Primary Evidence (`path:line` / Gate) |
|---:|---|---|---|
| 1 | Theme Store exclusivity | `pass` (code) / `needs-evidence` (partner) | Zero designer credits or affiliate links in code (`sections/footer.liquid:129`); partner exclusivity confirmed at submission. |
| 2 | Uniqueness from other themes | `pass` | Original custom-element & token architecture (`snippets/head-color-schemes.liquid`, `snippets/head-design-systems.liquid`, `DESIGN.md:1-160`). |
| 3 | Theme design and UX | `pass` | 10-round UX/AX production pass completed (`plans/reports/enhance-ux-ax-261011-1000-production.md:1-120`). |
| 4 | Features | `pass` | All 19 required features implemented, including search facets (`sections/main-search.liquid:47-175`), rich media (`snippets/product-media-item.liquid:1-84`), `<shopify-account>` (`sections/header.liquid:33`, `snippets/mobile-menu.liquid:83`), Follow on Shop (`sections/footer.liquid:140`), and pickup availability (`blocks/pickup_availability.liquid:1-47`). |
| 5 | Templates, sections, and blocks | `pass` | All 16 required files in `req L174-191` present; `sections/custom-liquid.liquid:1-230` and `blocks/custom_liquid.liquid:1-25` present; `@app` in `main-product.liquid:138` and `featured-product.liquid:355`. |
| 6 | Lighthouse performance & a11y | `needs-evidence` | Requires archiving live Lighthouse desktop/mobile reports (`perf >= 60`, `a11y >= 90` across Home, PDP, PLP) — see R5.1. |
| 7 | Pages | `pass` (after R2/R3 fixes) | Fix `sections/main-article.liquid:134`, `sections/main-customers-order.liquid:48` (`billing_address`), and `snippets/cart-modal.liquid:47`. |
| 8 | Consistency and functionality | `pass` (after R2 fixes) | Fix `sections/hero.liquid:208-295` countdown expiry and `clear_url` `url_encode` in 4 search filter files. |
| 9 | Browser compatibility | `needs-evidence` | Chromium verified (`96/96` journeys); Safari macOS/iOS, Firefox, Edge, Samsung Internet & social webviews require test matrix receipt (R4.2 / R5.2). |
| 10 | Assets | `pass` | Native CSS/JS only (`0` `.scss`, `0` unapproved external CDNs, `0` demo raster images in `assets/`). |
| 11 | SEO | `pass` | `snippets/head-meta-tags.liquid:1-251`; `0` `robots.txt.liquid`. |
| 12 | Accessibility | `pass` | `0` axe WCAG 2.2 AA violations across 15 routes × 3 viewports (`plans/reports/enhance-ux-ax-261011-1000-production/round-10/final-7/axe.json`). |
| 13 | Social media | `pass` (after `footer.liquid:52`) | `"placeholder"` removed from `config/settings_schema.json:1154-1184` (`req L463`); add `social_pinterest_link` to `sections/footer.liquid:52`. |
| 14 | Settings | `pass` (after `header.liquid:95` & `U-15b`) | Restore `customer_account_menu` default to `"customer-account-main-menu"` (`sections/header.liquid:95`); `946` settings, `0` unread. |
| 15 | Font picker | `pass` | `snippets/head-fonts.liquid:7-39` loads `font_modify` (`bold`, `italic`, `bold_italic`) with `font_display: 'swap'` for all 3 font pickers (`req L611`). |
| 16 | Color system | `pass` | 4 color schemes in `Rebel` (`config/settings_data.json:5-100`) with paired foreground/background and contrast-enforced derived tokens (`snippets/head-color-schemes.liquid:1-134`). |
| 17 | Responsive images | `pass` | All Shopify images use `image_url \| image_tag` with `widths`, `sizes`, `alt`, and eager/high priority on LCP media. |
| 18 | Naming themes and presets | `pass` (after R1 trim) | `"theme_name": "Rebel"` (`config/settings_schema.json:4`), matching preset `"Rebel"` (`config/settings_data.json:2,4`). |
| 19 | Theme versions and release notes | `needs-evidence` -> **R4.1** | `"theme_version": "1.0.0"` (`config/settings_schema.json:5`); author `docs/release-notes-v1.0.0.md` immediately (see R4.1). |
| 20 | Demo stores | `fail` / `external` | Trim to 1 preset (`Rebel`) to require only 1 client transfer store; configure Bogus Gateway / Test Mode and Admin data (see R5.2). |
| 21 | Documentation and contact forms | `fail` / `external` | `docs.devs2.com` and `devs2.com` fail DNS resolution; requires live deployment + support form with file upload & auto-responder (see R5.2). |
| 22 | Supporting your theme | `needs-evidence` -> **R4.2** | Document 2-business-day SLA & critical bug process in `docs/theme-store-submission-checklist.md` and public docs. |

---

## R4: In-Repo Submission Artifacts & Release Notes Spec

Per `https://shopify.dev/docs/storefronts/themes/store/success/updates#release-notes` (`artifact://49:175-245`), release notes must use merchant-facing language, a summary paragraph, and `###` (`H3`) headings (`### Added`, `### Changed`, `### Removed`, `### Security`, `### Fixes and other improvements`). Note that `updates.md` states: *"The `release-notes.md` file is required only after a theme has been published to the Theme Store. You should exclude this file during the review process."* Because `.shopifyignore:2` already excludes `*.md` from `dist/rebel-v1.0.0.zip`, we can author the two artifacts below in `docs/` immediately without polluting the submission ZIP:

### 4.1 Artifact 1: `docs/release-notes-v1.0.0.md` (Ready to Paste into Partner Submission Form)

```markdown
Rebel 1.0.0 is the initial Shopify Theme Store release of Rebel, an editorial Online Store 2.0 theme designed for fashion, apparel, and lifestyle brands with high-impact photography, contrast-verified color schemes, and fast, accessible storefront discovery.

### Added

- Important: Full Online Store 2.0 sections-everywhere architecture across all 22 JSON templates, header and footer section groups, and 22 modular product theme blocks including Custom Liquid and app blocks.
- Important: Faceted search and collection filtering (sidebar drawer and modal layouts) with price range inputs, availability, variant swatches, active filter chips, and keyboard focus restoration.
- Important: Rich product media gallery supporting high-resolution images with lightbox zoom, HTML5 video, YouTube and Vimeo embeds, and interactive 3D models with Shopify AR (`View in your space`) across the product page, featured product section, and quick view modal.
- Native `<shopify-account>` customer account menu integration in both desktop and mobile headers, plus Follow on Shop, country/currency, and language localization selectors.
- Complete commerce merchandising suite including selling plan subscriptions, gift card recipient scheduling form, unit pricing, local pickup availability drawer, B2B quantity rules (`min`, `max`, `increment`), Shop Pay Installments, and sticky add-to-cart bar.
- Editorial storytelling sections including slideshow with pause control, hero banner with mobile art direction, lookbook hotspots, before-and-after comparison, marquee product strip, store locator with live IANA timezone open/closed status, and server-rendered article table of contents.
```

### 4.2 Artifact 2: `docs/theme-store-submission-checklist.md` + `docs/theme-audit-log.md:33-52` Update

- Create `docs/theme-store-submission-checklist.md` containing the Submission Evidence Pack (`C:/Users/Admin/.claude/skills/shopify-theme-store-readiness/references/theme-store-checklist.md:166-181`), mapping `Rebel` (`v1.0.0`) to its demo store URL, listing metadata, 2-business-day support SLA & critical bug fix policy (`req L805-808`), browser/webview QA table, and Lighthouse score table.
- Update `docs/theme-audit-log.md:33-52` so rows `#3` through `#13` reflect their verified `2026-10-11` / `2026-10-14` status and fix row `#7` (`main-search-quickview.liquid` → `main-search.liquid`).

---

## R5: AntiFan MCP Corner-by-Corner Verification Plan & External Partner Checklist

### 5.1 Live Storefront (`shopify theme dev` + AntiFan MCP) Corner-by-Corner Verification Matrix

Once `shopify theme dev` is running at `http://127.0.0.1:9292` (with user approval), execute the following **5-Stage AntiFan MCP Verification Protocol** across all **13 required routes** at **`1440x900` (desktop)**, **`768x1024` (tablet)**, and **`375x812` (mobile)**:

#### Stage A — Tab Health & Viewport Initialization
1. `anti.browser.tabs.list` / `anti.browser.tabs.get` → verify active binding to `http://127.0.0.1:9292` (not `/password`; if redirected to `/password`, authenticate once using `SHOPIFY_STOREFRONT_PASSWORD` from `.env`).
2. `anti.inspect.console` → record baseline platform noise (`HotReload` WebSocket, `shop.app` frame-ancestors CSP, Storefront API `customer-account-main-menu` if unlinked) per `REVIEW.md:67-76` so theme regressions are isolated with zero false negatives.

#### Stage B — 13-Route × 3-Viewport (`1440x900`, `768x1024`, `375x812`) Corner-by-Corner Matrix

| # | Route | Primary Templates / Sections Exercised | AntiFan MCP Tools to Execute | Exact Interactive & DOM Corners to Verify |
|---:|---|---|---|---|
| **1** | `/` | `templates/index.json`, `header.liquid`, `slideshow.liquid`, `scrolling-text.liquid`, `collection-list.liquid`, `featured-collection.liquid`, `image-text-overlay.liquid`, `logo-list.liquid`, `footer.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.inspect.page_inventory` → `anti.inspect.responsive_matrix` → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Header megamenu hover & keyboard `:focus-within` + `Escape` close (`1440x900`).<br>- Mobile hamburger drawer open/trap focus/drilldown submenu/`Escape` close (`375x812`).<br>- `<shopify-account>` visible in desktop header (`1440`) and mobile drawer footer (`375`) with `menu="customer-account-main-menu"`.<br>- Hero slideshow pagination centered on-screen, pause button stops autoplay, LCP slide 1 `loading="eager" fetchpriority="high"`.<br>- Scrolling text / marquee duplicate track has `inert`.<br>- Footer newsletter hidden on `/` (`body:has(.section-newsletter)` rule, `REVIEW.md`), `powered_by_link` intact, payment icons full-color, Follow on Shop button rendered, Pinterest + 5 social icons visible. |
| **2** | `/collections` | `templates/list-collections.json`, `sections/main-list-collections.liquid`, `snippets/collection-card.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.inspect.dom` → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Collection cards render `collection.title` (untruncated), `collection.featured_image`, product count badge, and valid `ItemList` JSON-LD.<br>- Card overlay contrast `>= 4.5:1` (`DESIGN.md:113`). |
| **3** | `/collections/new-arrivals` | `templates/collection.json`, `sections/main-collection.liquid`, `snippets/collection-filter-drawer.liquid`, `snippets/collection-facet-filter.liquid`, `snippets/collection-sort.liquid`, `snippets/collection-active-filters.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (filter checkbox, price range, sort change, clear all) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Sidebar facets at `1440x900`; filter drawer trigger (`.collection-template__filter-btn`) at `768x1024` and `375x812`.<br>- Selecting availability/price/color updates `#CollectionProducts`, `#CollectionActiveFilters`, and `#CollectionLiveRegion` without full reload and restores keyboard focus (`P17`).<br>- Product cards align via CSS Subgrid (`assets/product-card.css:337-350`), hover/focus-within reveals Quickview & Add to Cart, swatch pills switch card image. |
| **4** | `/products/rebel-tactical-bomber-jacket` | `templates/product.json`, `sections/main-product.liquid`, 12 active `blocks/*.liquid` blocks, `sections/complementary-products.liquid`, `sections/product-recommendations.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `storefront.resolve_product` → `anti.trace.interaction` (variant pill click, lightbox open/close, sticky ATC scroll, quickview) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Variant pill selection updates URL `?variant=`, price, compare-at price, SKU, availability, and gallery slide via `data-media-id`.<br>- Keyboard focus ring visible (`2px`) on `.variant-picker__item-input:focus-visible + .variant-picker__item-label` (`P37`).<br>- Quantity selector enforces `min`/`step`/`max` (`blocks/quantity_selector.liquid`).<br>- `pickup_availability` block, `payment_installments` block, `tabs` block, `size_chart` modal, and `product-lightbox` work cleanly.<br>- Scrolling past buy buttons reveals `product-sticky-add`, and clicking sticky Add to Cart adds 1 item and opens `cart-modal` (`P35`).<br>- Footer newsletter IS visible on PDP (`footer-newsletter.cjs`). |
| **5** | `/products/selling-plans-ski-wax` (`301` → `/products/leather-care-balm`) | `templates/product.json`, `blocks/buy_buttons.liquid:53-128` (Selling Plans radio/select UI) | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (toggle One-time purchase vs. Subscribe & save radio, change plan select, Add to Cart) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify `301` redirect from `/products/selling-plans-ski-wax` to `/products/leather-care-balm`.<br>- Selecting `Subscribe and save` (`data-purchase-option-toggle="subscription"`) un-hides and enables `<select name="selling_plan">` (`blocks/buy_buttons.liquid:86-94`).<br>- Adding to cart sends `selling_plan` in `FormData(form)` and renders `item.selling_plan_allocation.selling_plan.name` in `cart-modal` (`snippets/cart-line-details.liquid:17-21`). |
| **6** | `/cart` | `templates/cart.json`, `sections/main-cart.liquid`, `snippets/cart-items.liquid`, `snippets/cart-total.liquid` | `anti.browser.navigate` → `theme.assert_cart` → `theme.qa_validate` → `anti.trace.interaction` (quantity `+`/`-`, cart note update, remove item) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify line-item title, image, options, selling plan name, unit price, line-level discount allocations, quantity stepper, cart note `<textarea>`, `cart.total_price`, conditional tax/shipping notice (`snippets/cart-total.liquid:26-35`), checkout button, and accelerated checkout buttons.<br>- Verify empty-cart state when last item is removed. |
| **7** | `/search?q=jacket` | `templates/search.json`, `sections/main-search.liquid`, `snippets/collection-filter-drawer.liquid`, `snippets/collection-facet-filter.liquid`, `snippets/collection-active-filters.liquid`, `snippets/collection-sort.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (apply facet filter on `/search?q=jacket`, sort change, Clear all, switch Products/Articles/Pages tabs, test 0-result filter recovery) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify `search.filters` sidebar (`1440`) and mobile filter drawer (`768`, `375`) render on `/search?q=jacket` (`U-01`).<br>- Applying a facet filter preserves `?q=jacket&type=...` in the URL (`assets/collection.js:194-224`).<br>- Filtering to `0` matching products keeps `<facet-filters>` and the `Clear all filters` recovery button visible (`sections/main-search.liquid:69,165-169`).<br>- Verify predictive search modal (`search-modal`) keyboard/mouse interaction from header search icon. |
| **8** | `/pages/about` | `templates/page.about.json`, `sections/page-about.liquid`, `sections/timeline.liquid`, `sections/team.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.inspect.responsive_matrix` → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify native `presentation.focal_point` CSS variables (`sections/page-about.liquid:3`), 55% hero overlay contrast (`DESIGN.md:112`), timeline cards, team section, and zero `"Devs2"` strings in copy. |
| **9** | `/pages/contact` | `templates/page.contact.json`, `sections/page-contact.liquid`, `assets/page-contact.js` | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (submit invalid phone `123`, verify error message & button recovery `P44`) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify client-side validation error message uses locale strings (`data-msg-*`) and does not lock the submit button (`P44`).<br>- Verify contact info cards (`tel:`, `mailto:`, hours) and vertical spacing boundary (`AGENTS.md:96-100`). |
| **10** | `/pages/contact?view=faq` | `templates/page.faq.json`, `sections/page-faq.liquid`, `assets/page-faq.js` | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (FAQ search filter input, topic chip click, accordion expand/collapse) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify FAQ search hides empty topic headings, shows empty state on no matches, maintains explicit vertical spacing boundary between FAQ list, support CTA, and contact form, and outputs valid `FAQPage` JSON-LD. |
| **11** | `/pages/contact?view=stores` | `templates/page.stores.json`, `sections/page-stores.liquid`, `assets/page-stores.js`, `assets/store-hours.js` | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (region filter, store search, Open now toggle) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify store "Open now / Closed" badge evaluates in each store's IANA timezone (`America/New_York`, `Europe/London`, `Asia/Tokyo` — `P105`), directions link opens external map URL (`P98`), and `LocalBusiness` JSON-LD is valid. |
| **12** | `/blogs/news` (and `/blogs/sustainable-fashion-eco-tech` + article route) | `templates/blog.json`, `sections/main-blog.liquid`, `templates/article.json`, `sections/main-article.liquid`, `snippets/content-toc.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.inspect.dom` → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify blog featured post (`loading="eager" fetchpriority="high"`), article cards using `article.excerpt_or_content`, sidebar blocks, and `ItemList` JSON-LD.<br>- On the article route, verify server-rendered `<content-toc>` (`P63`), keyboard-scrollable `.article-template__table[role="region"][tabindex="0"]` wrapper (`sections/main-article.liquid:134`), comment form with `blog.moderated?` notice, and `BlogPosting` JSON-LD. |
| **13** | `/404` | `templates/404.json`, `sections/main-404.liquid` | `anti.browser.navigate` → `theme.qa_validate` → `anti.trace.interaction` (404 search form, primary/secondary recovery buttons) → `anti.screenshot.viewport` (`1440`, `768`, `375`) | - Verify custom/default locale eyebrow, heading, search input, Home and Collections buttons, `<meta name="robots" content="noindex, nofollow">`, and `0` horizontal overflow. |

#### Stage C — Lighthouse Performance & Accessibility Benchmark Archive (`U-21`, `req L220-235`)
- Run Lighthouse desktop and mobile audits against `/`, `/products/rebel-tactical-bomber-jacket`, and `/collections/new-arrivals` with populated content and images.
- Verify **Average Performance >= 60** and **Average Accessibility >= 90** on both desktop and mobile, and save the JSON/HTML reports under `plans/reports/lighthouse-261014-mvp/`.

### 5.2 External Partner & Shopify Admin Checklist (Cannot Be Done From Theme Code Alone)

| # | External Gate | Official Requirement Ref | Current State | Exact Action Required by User / Partner |
|---:|---|---|---|---|
| **1** | **Client Transfer Demo Store (`Rebel` Preset)** | `req L727-735` (*"To build your demo store, create a client transfer store in the Dev Dashboard. Note: Dev stores can't be transferred."*) | Current store `devs2-rebel.myshopify.com` is a development store. | In Shopify Partner Dashboard, create **1 client transfer store** for the `Rebel` preset (or confirm if `devs2-rebel.myshopify.com` is already a client transfer store), push the `Rebel` MVP theme + Files/products/collections/menus to it, and disable the storefront password or record it in the submission form. |
| **2** | **Checkout Test Mode (Bogus Gateway / Shopify Payments Test Mode)** | `req L735` (*"Each demo store has the Bogus Gateway or Shopify Payments test mode enabled, and all other checkout options disabled."*) | Unverified in Shopify Admin `Settings > Payments`. | In Shopify Admin → `Settings > Payments`: enable **Bogus Gateway** (or **Shopify Payments Test Mode**) and disable all other payment methods so Theme Store reviewers can complete test checkouts. |
| **3** | **Public Theme Documentation DNS & Hosting (`theme_documentation_url`)** | `req L760-778` & `config/settings_schema.json:7` (`https://docs.devs2.com/rebel`) | `docs.devs2.com` fails DNS resolution (`getaddrinfo failed`). | Configure DNS `A`/`CNAME` records and HTTPS hosting for `https://docs.devs2.com/rebel` (or update `config/settings_schema.json:7` to your live docs URL) containing setup guides, section/setting documentation matching Rebel's exact setting labels, FAQ, and support policy (2-business-day SLA). |
| **4** | **Public Merchant Support Contact Form (`theme_support_url`)** | `req L762, L790-804` & `config/settings_schema.json:8` (`https://devs2.com/support`) | `devs2.com` fails DNS resolution; no support form exists. | Configure DNS + HTTPS for `https://devs2.com/support` and publish a mobile-friendly support form with: **(1)** First & Last Name, **(2)** Email Address, **(3)** Store URL (with example `http://www.storename.myshopify.com`), **(4)** Description of Problem (`textarea`), **(5)** **File Upload** (image attachment), and **(6)** **Auto-responder** email trigger. Do not ask for budget, phone number, or project type. |
| **5** | **Demo Store Shopify Admin Data Cleanup (`U-28`)** | `req L735` (Authentic content) & `plans/reports/demo-production-261010-release-readiness.md:106-125` | `.env` Admin API token lacks `write_purchase_options` and legal policy scopes. | In Shopify Admin on the demo store:<br>1. **Products > Leather Care Balm > Purchase options:** Rename the selling plan group from `"ski wax"` to `"Atelier Care Subscription"`.<br>2. **Settings > Policies:** Create Terms of Service, Refund Policy, and Shipping Policy, and add them to the `footer-legal` menu.<br>3. **Online Store > Preferences:** Upload a homepage social sharing image (`og:image`) and set an editorial homepage meta description. |

---

## Unresolved Questions

1. **Documentation & Support URLs (`config/settings_schema.json:7-8`):** Should `theme_documentation_url` and `theme_support_url` remain `https://docs.devs2.com/rebel` and `https://devs2.com/support` (to be brought online via DNS before submission), or do you have an already-live domain we should set in `config/settings_schema.json:7-8` right now?
2. **Logo List Fresh-Install Behavior (`U-15b`, `sections/logo-list.liquid:9-16,47,73`):** Now that all 6 demo logo blocks on `devs2-rebel.myshopify.com` have real uploaded images (`rebel-logo-1..6.png`), should we remove the `request.design_mode` gate (`P5`) in `sections/logo-list.liquid:10,16,47,73` so that a fresh merchant install (where demo `shopify://shop_images/*` do not transfer) renders onboarding placeholders instead of collapsing the Logo List section to `0px`?

---

# Part 2 - Verifier verdict (kongming)

**Kết luận:** chọn **B** làm bản thắng, giữ nguyên. Báo cáo B bao phủ R1–R5, và các phát hiện lớn của nó đều khớp với đĩa. Đặc biệt B chỉ ra đúng lỗi thật duy nhất của Theme Check. Phần B còn thiếu nằm ở mục 2 dưới đây.

Tôi không chạm `.env`, không ghi file vào repo. Phần cài parser nằm trong `C:/Users/Admin/AppData/Local/Temp/lhp`. `shopify theme check`, Lighthouse, AntiFan và DNS đều chưa chạy.

## 1. Xếp hạng

| # | Báo cáo | Nhận xét chính |
|---|---|---|
| **1** | **B** | Có lỗi `main-article.liquid:134`, chẩn đoán và cách sửa đã được parser thật xác nhận. Tìm đúng bug `clear_url` ×4 và bug hero countdown. Kiểm kê locale stale chính xác nhưng chưa đủ: 103 key, thực tế là 113. Blueprint 1 preset đúng và chi tiết đến file:dòng. Yếu: một số chỗ khẳng định cứng (validator "pass", `customer_account_menu`), và bỏ sót F1/F3/F6/key phantom. |
| 2 | A | Trung thực nhất, bảng 22 nhóm đầy đủ. Các lỗi F1–F6 và H1/H7/H9/H11 đều đúng trên đĩa. Bỏ sót lỗi Theme Check, bug search và hero. Sai nhỏ: `package-theme.py:24` (thực tế dòng 23). Kiểm kê locale chỉ 7 namespace. |
| 3 | D | Phát hiện riêng, đã xác minh và đáng giá: key phantom ở quickview và ~19 setting global không ai đọc. Nhưng R2 chưa hoàn tất (tự thừa nhận), nhiều số dòng chỉ là xấp xỉ, URL docs lệch 2 dòng. |
| 4 | C | Trung thực, có phát hiện đúng: handle dangling trong `templates/index.json` và lỗ hổng bao phủ của range validator. Nhưng nhiều mục còn để "chưa xác minh". Locale stale chỉ đề cập qua loa. |
| 5 | E | Có ít nhất 8 khẳng định sai hoặc lỗi thời (mục 4). Các phát hiện thật (cart `final_price`, tax drawer, billing/cancel) đều bị B/A/D bao phủ hoặc nhỏ hơn. Số dòng `settings_data.json` sai hoàn toàn. |

## 2. Kết quả spot-check các điểm bất đồng

**(1) `customer_account_menu` default**
- Trạng thái trên đĩa: `sections/header.liquid:95` default là `main-menu`. `header.liquid:33` và `snippets/mobile-menu.liquid:80` đều truyền giá trị này vào `<shopify-account menu=…>`.
- Mirror L473 yêu cầu mọi `link_list` trong Header/Footer có default `main-menu` hoặc `footer`. Tip ở L810 nói tương tự.
- Tài liệu official của account-component (đã fetch) ghi `"default": "customer-account-main-menu"`, vì menu đó chứa Orders và Profile. `_reference/horizon/sections/header.liquid:1200` cũng dùng giá trị này.
- Đây là xung đột thật giữa hai nguồn Shopify, và A/C/D để ngỏ là đúng. B tuyên bố "restore" quá chắc.
- Hệ quả khi giữ `main-menu`: [INFERENCE] account sheet hiển thị menu điều hướng cửa hàng thay vì Orders/Profile.
- **Khuyến nghị:** cách gọn nhất tránh cả hai rủi ro là bỏ setting này. Hardcode `menu="customer-account-main-menu"` ở `header.liquid:33` và `mobile-menu.liquid:80`, xóa setting `customer_account_menu` cùng khóa locale tương ứng. Theme chưa publish nên xóa setting id lúc này không ảnh hưởng merchant, và header không còn `link_list` nào lệch L473.
- Phương án phụ: giữ setting nhưng đặt default `customer-account-main-menu` (theo doc và Horizon). Rủi ro còn lại là một reviewer đọc L473 theo nghĩa đen.
- Nếu Shopify review nêu rõ lý do từ chối thì đổi theo.

**(2) `listings/` với zip 1 preset**
- Mirror L699: "If you only have one preset, you do not need to include the `/listings` folder." Đã xác minh.
- Trang shopify.dev/updates (đã fetch):
  - `/templates` và `/sections` ở root phải là bộ JSON "base" đầy đủ.
  - Cấm nhân bản JSON giống hệt giữa các preset.
- `listings/manifest.json` không có trong cây thư mục chính thức. `.shopifyignore` (dòng cuối) đã loại nó khỏi zip.
- Trên đĩa:
  - `scripts/package-theme.py:3` luôn đưa `'listings'` vào `THEME_DIRS`. Có 5 thư mục preset, mỗi thư mục 15 template, tức 75 file.
  - `config/settings_data.json` vẫn giữ 5 preset: Rebel dòng 4, Noir 213, Vibrant 422, Botanical 631, Cyber 840.
  - Số dòng của E (260–1304) là sai.
- Ghi chú cũ trong memory "không bao giờ loại `listings/`" chỉ đúng cho zip nhiều preset. Với 1 preset thì được phép loại.

**(3) Key stale trong `locales/en.default.schema.json`**
- Tôi quét bằng script đọc-chỉ: gom 2202 lá, kiểm tra từng `t:<path>` có xuất hiện trong `sections/blocks/snippets/templates/config/layout/listings` hay không. Kết quả: **114 lá không được tham chiếu**.
- Trong đó 1 lá là dương tính giả: `sections.testimonials.settings.pagination_label`. Key này được dùng ở `testimonials.liquid:88` qua `| t` (key storefront), và tồn tại ở `en.default.json:818`.
- Còn lại **113 lá stale thật**, cộng **3 object rỗng** (`sections.cart`, `sections.featured_blog`, `sections.collection_template`), chính là các dòng 2801, 2802 và 3020.
- Phân nhóm 113 lá:

| Nhóm | Số lá |
|---|---|
| `settings_schema.social-media.*.info` (6 URL shopify) | 6 |
| `settings_schema.product` (`header__coupon`, `coupon_label`) | 2 |
| `sections.main_product.blocks.coupon` | 1 |
| `sections.banner_link` | 10 |
| `sections.flash_sale` | 12 |
| `sections.featured_countdown` | 21 |
| `sections.countdown_timer` | 27 |
| `sections.button_group` | 13 |
| `sections.age_verification` | 11 |
| `sections.main_404` (`back_text`, `products_text`, `products_link`) | 3 |
| `sections.footer` (`cert_bct_image`, `cert_bct_link`) | 2 |
| `sections.page_faq` (`blocks.group.*`, `question.settings.group.*`) | 4 |
| `sections.page_stores` (`map_embed`) | 1 |

- Đối chiếu từng báo cáo:
  - B đúng 103 lá ở 5 nhóm đầu, nhưng thiếu 10 lá ở 4 nhóm cuối (main_404, footer, page_faq, page_stores).
  - A đúng 7 namespace (gồm `featured_blog` rỗng) nhưng thiếu social, coupon và các nhóm sau.
  - D chỉ nêu 3 object rỗng.
  - E sai nhiều (xem mục 4).
- Việc cần làm: xóa 113 lá và 3 object rỗng, đồng thời thêm kiểm tra chiều ngược vào `scripts/validate-locales.mjs`.
- Script quét ở trên chỉ bắt được tham chiếu dạng `t:<path>` nguyên văn. Trước khi xóa, cần kiểm tra thêm các nhóm có thể đọc bằng đường dẫn động.

**(4) Cart và Order**
- `snippets/cart-modal.liquid:47`: dòng này render `taxes_included_shipping_at_checkout_without_policy` vô điều kiện. Giá trị là "Taxes included. Discounts and shipping calculated at checkout." (`en.default.json:536`).
- `snippets/cart-total.liquid:27-30` thì bọc bằng `cart.taxes_included`. Vậy drawer sai trên cửa hàng giá chưa gồm thuế. **Đúng** (A, B, E).
- `snippets/cart-line-price.liquid`:
  - Hiện `final_line_price` (dòng 10).
  - Hiện `unit_price` có điều kiện (dòng 11–16).
  - Grep toàn bộ `snippets/` cùng `assets/cart*.js` không thấy `item.final_price` ở bất kỳ đâu.
  - Mirror L318–330 yêu cầu cart page hiển thị `unit_price` và `final_price`.
  - Kết luận: `unit_price` đã có; `final_price` đơn vị thì chưa. E đúng một phần, A bỏ sót.
- `sections/main-customers-order.liquid`:
  - Chỉ có `shipping_address` ở dòng 50–71. Không có `billing_address` hay thông báo `order.cancelled`.
  - Các key `customer.order.cancelled_html`, `cancelled_reason`, `billing_address` đã có trong locale (`en.default.json:907–909`) nhưng không được dùng ở đâu.
  - Mirror không có yêu cầu riêng cho trang order. Đây là lỗi parity, không phải yêu cầu bắt buộc.
  - Dòng 56 dùng `order.customer.name` làm tên người nhận ship (A đúng, H11).
  - `cancelled_html` là "Order Cancelled on…". Mirror L505 yêu cầu "canceled".

**(5) `sections/main-article.liquid:134`**
- Tôi dùng `@shopify/liquid-html-parser` thật (cài ở thư mục temp ngoài repo) để parse thử.
- Lỗi: `Attempting to close LiquidTag 'capture' before it was opened without a matching 'capture'`, ở cả chế độ strict và tolerant. Câu chữ này khớp B, không khớp E.
- Quét toàn bộ 142 file `.liquid`: đây là **file duy nhất lỗi parse**.
- Nguyên nhân: phần thân `capture` bị parse như HTML và kết thúc bằng `<table` chưa đóng, nên parser nuốt `{%- endcapture -%}` vào attribute.
- Cách sửa của B (dựng `table_open` bằng `{%- liquid assign … append … -%}`): parse OK ở cả hai chế độ.
- `OrphanedSnippet` ở `snippets/content-toc.liquid` là hệ quả. Snippet này chỉ được `render` tại `main-article.liquid:131`, đúng file bị lỗi parse. Phần "hệ quả" này là [INFERENCE] vì tôi chưa chạy Theme Check.

**(6) Các điểm khác đã kiểm**
- `listings/rebel/templates/index.json` và `templates/index.json` có cùng nội dung (B, C). Tôi không diff từng file.
- `LICENSE.md` không có ở root. `layout/theme.liquid:4` và `layout/password.liquid:4` vẫn trỏ tới nó (A, C đúng). Root chỉ có `REVIEW.md`, `DESIGN.md`, `AGENTS.md`, `CLAUDE.md`.
- `release-notes.md` (trang update official):
  - Chỉ bắt buộc sau khi theme đã publish và phải loại khỏi zip trong lúc review.
  - Phiên bản và release notes vẫn cần ở form nộp (mirror L715).
  - Vậy viết nội dung trước, nhưng không đưa file vào zip lần đầu.

## 3. Danh sách phát hiện đã xác minh (gộp, loại trùng)

**Blocker trong repo**
1. `sections/main-article.liquid:134`: lỗi parse (xem mục 2.5).
2. Cắt về 1 preset: `settings_data.json` (xóa 213–hết presets), `scripts/package-theme.py:3` (bỏ `listings`), `:23` (tên zip hardcode `rebel-v1.0.0.zip`). `.shopifyignore` không cần đổi nếu `listings` đã bỏ khỏi `THEME_DIRS`.
3. Resource handle không tồn tại trên store mới (mirror L473/L810), tại `templates/index.json`:
   - Collection `outerwear` (247), `casual-shirts` (255), `accessories` (263), `limited-edition` (271).
   - Product `rebel-tactical-bomber-jacket` (359).
   - Blog `style-guides-wardrobe-essentials` (538).
   - `collection: all` (400) là hợp lệ.
4. State cài đặt còn dấu vết demo/công ty:
   - `config/settings_data.json:167–172` (và ×5 preset): URL `…/devs2rebel`.
   - `templates/index.json:105`: "DEVS2 REBEL".
   - `templates/page.contact.json:20–23,29` và `sections/footer-group.json:42–44`: địa chỉ Paris, số +33, `contact@devs2-rebel.com`. Từ "enquiries" cũng dính.
5. `customer_account_menu` (mục 2.1).

**Lỗi code nên sửa**
6. **Key phantom ở quickview:** `templates/product.quickview.liquid:58,64,70` đọc `settings.product_show_sku/brand/availability`. Ba key này không có trong schema nên không bao giờ hiển thị (D).
7. **Setting global khai báo mà không ai đọc:**
   - Đã xác minh bằng grep: `animations_hover_elements` (schema:332), `card_style` (610), `badge_position` (1067), `brand_headline` (1122), `predictive_search_enabled` (1191), `currency_code_enabled` (1240), `cart_type` (1251), `show_cart_note` (1277), `cart_drawer_collection` (1287), `product_soldout_text` (1468).
   - Các key còn lại trong bảng của D (`card_color_scheme`, badge scheme, `brand_description/image/width`, `cart_color_scheme`, `product_contact_text`) tôi chưa grep riêng.
   - `toc_enable` còn nằm trong `settings_data.json` (182, 391, 600, 809, 1018) nhưng không có trong schema.
   - `runs/e2e/settings-usage.cjs` chỉ quét section và block nên không bắt được lớp lỗi này.
8. `clear_url` ở 4 file (B, E):
   - `snippets/collection-filter-drawer.liquid:12–13`
   - `snippets/collection-facet-filter.liquid:16–17`
   - `snippets/collection-active-filters.liquid:12–13`
   - `sections/main-search.liquid:59–60`
   - Lỗi: `escape | url_encode` làm hỏng `&` và `'`; đồng thời `&type=product,article,page` bị hardcode.
9. `sections/hero.liquid:208–237,267–268,276–290`: countdown với `end_date` trống/không hợp lệ hoặc đã hết hạn vẫn hiện `00:00:00:00`. Không có `role="timer"` và không có `data-tz-offset`. `end_date` mặc định `2027-12-31T23:59:59` parse theo giờ trình duyệt.
10. `snippets/cart-modal.liquid:47`: copy thuế vô điều kiện (mục 2.4).
11. `snippets/cart-line-price.liquid`: thiếu `item.final_price` đơn vị (mục 2.4).
12. `sections/footer.liquid:105–106,331–333`: khai báo `@app` nhưng loop chỉ xử lý `menu`, nên app block không render. Hoặc render `{% render block %}`, hoặc bỏ `@app` (mirror chỉ bắt buộc `@app` ở main product và featured product).
13. Footer thiếu Pinterest (`footer.liquid:29–53`, trong khi `shop-social.liquid:42–46` có). `shop-social.liquid:3,58` đọc `settings.social_linkedin_link` không có trong schema (A, B).
14. `sections/main-customers-addresses.liquid:110,223`: `pattern="\d+" maxlength="12"` chặn số điện thoại quốc tế có "+" hoặc khoảng trắng.
15. `sections/main-customers-login.liquid:15–17`: `role="alert"` render vô điều kiện, các form khác thì bọc `if form.errors`. Ngoài ra ô credential ở login/register không có `autocomplete`. `main-customers-reset.liquid:13` hiện `customer-sidebar` trên trang reset.
16. `sections/main-404.liquid:105–113`: đẩy `window.dataLayer` trên mỗi lượt 404. Nên bỏ vì không phải tính năng của theme.
17. `scripts/validate-schema-ranges.mjs`: chỉ đọc `templates/*.json` bằng `fs.readdirSync('templates')`, bỏ qua `listings/`, section group và setting cấp block.
18. Locale: 113 lá stale cộng 3 object rỗng (mục 2.3).
19. Hygiene khác:
    - Comment tiếng Việt (`Mô tả:` dòng 3 ở khoảng 25–29 section, LiquidDoc ở `collection-card`, `countdown-banner`, `product-card`) và chuỗi `'Mua ngay'` trong `assets/product.js`.
    - Fallback `'Mua ngay'` là chuỗi tiếng Việt nằm trong file được ship.
    - Cấu trúc dữ liệu trùng trong `main-article` (microdata kết hợp JSON-LD).

**Ngoài repo, chưa xác minh được**
20. Docs/support URL (`config/settings_schema.json:7–8`): C báo `ENOTFOUND` khi fetch. Tôi không kiểm DNS.
21. Release notes, form hỗ trợ có file upload và auto-responder, client transfer store với Bogus Gateway.
22. Lighthouse (performance ≥ 60, accessibility ≥ 90), `shopify theme check`, ma trận trình duyệt, tính độc nhất của tên "Rebel".

## 4. Khẳng định sai hoặc đã lỗi thời (loại bỏ)

**Báo cáo E**
- `config/settings_schema.json` còn `"placeholder"` ở social (1158–1193): sai. Grep `placeholder` chỉ ra `newsletter_modal_placeholder` (dòng 1435) và dòng 1436, không phải social. Đây đúng là chỗ `en.default.schema.json` còn 6 key `.info` mồ côi, nhưng schema không còn thuộc tính `placeholder` cho social.
- Số dòng preset trong `settings_data.json` (260–1304) và social `227–232` là "URL facebook.com trơn": sai. Thực tế social ở dòng 167–172 dùng `devs2rebel`.
- Bảng 22 vị trí Title Case, `&`, "Slider", "Youtube" trong `en.default.schema.json`: grep phân biệt hoa thường không khớp chuỗi nào.
- `templates/product.json` thiếu `pickup_availability`: sai. Có ở dòng 59–61 và 96 (cả `listings/rebel`).
- `image-text-overlay` và `layered-images` thiếu placeholder: sai. Đã có ở `image-text-overlay.liquid:39–41` và `layered-images.liquid:42–47`. Riêng `logo-list` thì khác: các block có ảnh trống làm `logo_count = 0`, section ẩn khi chưa design mode (`logo-list.liquid:5–12`). Đó là hành vi ẩn có chủ ý, không phải frame trống.
- `sections.cart`, `collection_template`, `featured_blog` là namespace có nội dung: sai, cả ba chỉ là object rỗng.
- `float_social` mồ côi: sai, `snippets/float-social.liquid` đọc `settings[…]` bằng khóa động.
- `sections.testimonials.settings.pagination_label` không có trong `en.default.json`: sai (dòng 818).

**Báo cáo A**
- `package-theme.py:24` là sai, đúng là dòng 23.

**Báo cáo B**
- "All local AST validators pass" trích từ plan, không phải chạy trong phiên. B có đề cập 103 key (đúng nhưng chưa đủ).

**Báo cáo D**
- URL docs tại `settings_schema.json:5–6`: sai số dòng, thực tế là 7–8.

**Các nhận định cũ trong memory (đã đóng)**
- Footer `link_list` thiếu default: đã có `"default": "footer"` (`footer.liquid:324–327`).
- `search.filters`, `product.media`, `custom_liquid`, `pickup_availability`, `font_modify` 3 font, giảm giá từng dòng ở trang order: đều đã có.
- `social placeholder` trong schema: đã bỏ.

## 5. Checklist thực thi cho MVP 1 preset (theo ưu tiên)

1. **Sửa `main-article.liquid:134`** theo cách của B. Sau đó chạy lại Theme Check (cần duyệt lệnh `shopify`). Mục tiêu 0 error; cảnh báo `OrphanedSnippet` lẽ ra biến mất.
2. **Cắt preset:**
   - Xóa Noir/Vibrant/Botanical/Cyber khỏi `settings_data.json`, hoặc lọc khi đóng gói. Chỉnh sửa file này cần user duyệt theo AGENTS.md.
   - Bỏ `'listings'` khỏi `THEME_DIRS`.
   - Đọc `theme_version` từ `settings_schema.json:5` để đặt tên zip.
   - Xác nhận root `templates/*.json` bằng Rebel install state (diff với `listings/rebel`).
3. **Dọn state cài đặt:** xóa URL social ở `settings_data.json:167–172`, đổi "DEVS2 REBEL", email/địa chỉ/số điện thoại Paris, "enquiries" → "inquiries".
4. **Xử lý handle dangling** ở `templates/index.json` (list ở mục 3.3). Cần user quyết định: để trống setting (placeholder hiện) hay giữ handle và chấp nhận chỉ chạy đúng trên demo store.
5. **Quyết định `customer_account_menu`** theo mục 2.1.
6. **Sửa lỗi hiển thị cho merchant:**
   - Key phantom quickview và các setting chết.
   - `clear_url` ×4.
   - Hero countdown.
   - Copy thuế drawer.
   - `final_price` ở cart.
   - `@app` footer và Pinterest.
   - Số điện thoại ở addresses.
   - `role="alert"` ở login.
7. **Dọn locale:** xóa 113 lá stale cộng 3 object rỗng, thêm kiểm tra stale chiều ngược vào `validate-locales.mjs`. Mở rộng `validate-schema-ranges.mjs` cho `listings/`, section group và block. Mở rộng `settings-usage.cjs` sang `config/settings_schema.json`.
8. **Trang order:** thêm `billing_address` và thông báo hủy, dùng `order.shipping_address.name`, đổi "Cancelled" thành "Canceled".
9. **Dọn comment tiếng Việt**, thêm hoặc bỏ tham chiếu `LICENSE.md` ở `layout/theme.liquid:4` và `layout/password.liquid:4`.
10. **Chạy gate đầy đủ** (một lần, sau khi mọi sửa đổi xong):
    - `node scripts/validate-locales.mjs`
    - `node scripts/validate-schema-ranges.mjs`
    - `node runs/e2e/settings-usage.cjs`
    - `shopify theme check`
    - `python scripts/package-theme.py` (xác nhận không còn file `listings/` trong zip)
    - AntiFan QA với các route trong R5 của A/B.
    - Lighthouse trên home, collection, product, desktop và mobile.
11. **Ngoài repo:** docs và support URL phải truy cập được, form hỗ trợ đủ trường, 1 client transfer demo store với Bogus Gateway, nội dung release notes cho form nộp (không ship trong zip), ma trận trình duyệt.

Rủi ro mở: tôi không thể xác nhận reviewer Shopify đọc L473 theo nghĩa đen hay theo tài liệu account-component; xem lại nếu có phản hồi review.

ultra: picked=B margin=high unanimous=no rejected_all=no
