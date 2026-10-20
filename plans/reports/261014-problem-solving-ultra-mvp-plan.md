# Problem-Solving Reframing — Candidate D

## 1. Selected Technique(s) & Symptom Match

The `2026-10-14` `ak:scout --ultra` status report (`plans/reports/261014-scout-ultra-project-status.md`) shows a classic late-stage **complexity spiral**: the theme is ~90% engineered and passes 100% of mechanical AST, Playwright E2E (96/96), and axe WCAG 2.2 AA (45/45) checks, yet 35 open items remain blocked behind four competing pressures. Applying **Simplification Cascades** (`references/simplification-cascades.md`), **Inversion Exercise** (`references/inversion-exercise.md`), and **Meta-Pattern Recognition** (`references/meta-pattern-recognition.md`) collapses 35 scattered items into **5 architectural cascades**:

| Stuck Symptom Cluster | Underlying Root Cause | Problem-Solving Technique | Core Reframing Insight | Findings Collapsed |
|---|---|---|---|---|
| **1. Scope & Preset Multiplication**<br>5 presets in `config/settings_data.json` + `listings/*` require 5 client transfer demo stores (`req L727-735`) and violate the 1-preset phase lock in `AGENTS.md:20-31`, while `AGENTS.md §8` forbids unapproved edits to `config/settings_data.json`. | Treating "5-preset catalog architecture" and "initial MVP Theme Store submission" as tightly coupled in the build artifact. | **Inversion Exercise** + **Simplification Cascade** | *Invert "ship all 5 presets in v1.0.0" → "ship 1 canonical preset (`Rebel`) in v1.0.0 while keeping multi-preset token architecture ready for v1.1."* Per `req L668-703`, a 1-preset submission requires trimming the 4 extra presets from `config/settings_data.json` (via an explicit `AGENTS.md §8` confirm-first step) and omitting `listings/` from the packaged ZIP, eliminating 4 transfer demo stores immediately. | `U-20`, `U-24`, `U-25`, `U-29` |
| **2. Duplicated Storefront Pipelines**<br>`main-collection.liquid` has full facets while `main-search.liquid` has none (`U-01`); `main-product.liquid` renders all 4 `product.media` types while `featured-product.liquid` and `product.quickview.liquid` render only static images (`U-02`). | Copy-pasted template-specific Liquid (`collection.filters` vs `search.filters`; `product.images` vs `product.media`) instead of polymorphic contracts. | **Meta-Pattern Recognition** + **Simplification Cascade** | *Everything is a special case of one polymorphic contract:*<br>1. `collection` and `search` both implement Shopify's polymorphic `results` interface (`.filters`, `.sort_by`, `.default_sort_by`, `.sort_options`).<br>2. PDP, Featured Product, and Quickview all render the same `product.media` object graph (`image`, `external_video`, `video`, `model`). | `U-01`, `U-02`, `U-08` |
| **3. Redundant Settings, Stale Gates & Plan Bloat**<br>Custom `focal_point*` selects duplicate native `image_tag` focal points (`U-06`); `logo-list.liquid` `P5` `request.design_mode` gate hides fresh-install placeholders (`U-15b`); optional B2B `volume_pricing` and stale assertions keep 4 plans `pending`/`in-progress` (`U-30`). | Layering custom workarounds on top of native Shopify platform capabilities or pre-seed store states that no longer apply. | **Inversion Exercise** + **Simplification Cascade** | *Remove features that fight the platform:*<br>1. Delete custom `focal_point*` selects (-4 settings, -70 lines) and let Shopify's native `image_tag` + `presentation.focal_point` work.<br>2. Re-evaluate `P5` (`U-15b`) by inverting its premise: now that the demo store has 6 real uploaded press logos (`2026-10-10`), the demo store never hits the blank fallback, whereas a fresh merchant install *must* hit the fallback (`req L599, L707-711`).<br>3. Prune non-MVP `volume_pricing` and reconcile all 4 plans to `completed`. | `U-06`, `U-15b`, `U-30`, `U-23` |
| **4. 16 Scattered Compliance & Install-State Gaps**<br>Blank-state placeholders, social placeholders, `font_modify` variants, order line discounts, video URL setting, schema casing, and `"Devs2 Rebel"` copy across 18 templates. | Treating each audit finding as an isolated ticket instead of a single AST-verified compliance sweep. | **Meta-Pattern Recognition** | Group all 16 remaining gaps into 4 deterministic buckets: **(A) Fresh-Install Blank-State Placeholders**, **(B) Schema & Locale Normalization**, **(C) Liquid Object Completeness (`head-fonts`, `order`, `buy_buttons`)**, and **(D) Template & CI Metadata Hygiene**. | `U-03`, `U-04`, `U-05a`, `U-05b`, `U-07`, `U-09`, `U-10`, `U-11a`, `U-11b`, `U-13`, `U-14`, `U-15a`, `U-16`, `U-26`, `U-27`, `U-32` |

---

## 2. Systematic Application to Rebel MVP

### Cascade 1 — MVP Single-Preset Packaging (`U-20`, `U-24`, `U-25`, `U-29`)

#### Architectural Diagnosis & Official Requirement Constraint
Per `runs/.theme-store-requirements-261012.md:668-703` (*Adding presets to your theme zip submission*) and `:727-735` (*Demo stores*):
- Presets are declared in `config/settings_data.json` under `"presets"` (`config/settings_data.json:3-1049`, currently containing 5 keys: `"Rebel"` at `:4-212`, `"Noir"` at `:213-421`, `"Vibrant"` at `:422-630`, `"Botanical"` at `:631-839`, and `"Cyber"` at `:840-1048`).
- **Critical constraint (`req L668`):** *"If you have more than one preset, you need to include a unique set of templates showcasing each preset... Preset templates need to be included in a `/listings` folder in your theme zip."* Conversely (`req L699`): *"If you only have one preset, you do not need to include the `/listings` folder."*
- Therefore, **simply omitting `listings/` from the ZIP while leaving 5 presets in `config/settings_data.json` is invalid** and will fail Theme Store validation. A true 1-preset MVP (`Rebel`, matching `AGENTS.md:20-31`) requires **both** trimming the 4 non-`Rebel` presets from `config/settings_data.json` **and** omitting `listings/` from `dist/rebel-v1.0.0.zip`.
- Because `AGENTS.md` (and workspace rules) strictly forbid modifying `config/settings_data.json` without direct user confirmation, Cascade 1 separates **safe non-`settings_data.json` packaging hygiene** (executable immediately) from the **confirm-first (`AGENTS.md §8` user-gated) 1-preset trim**.

#### Step 1A — Immediate Non-`settings_data.json` Packaging Hygiene (`U-24`, `U-25`)
1. **`listings/manifest.json:4` (`U-25`):** Align `"author": "Devs2 Team"` with `config/settings_schema.json:6` (`"theme_author": "Devs2"`):
   ```json
   "author": "Devs2",
   ```
2. **`.shopifyignore:1-45` (`U-24`):** Append `listings/manifest.json` under `# Generator output` (line 39) so the custom manifest metadata file is never uploaded to Shopify or packaged into `dist/rebel-v1.0.0.zip` (`req L674-695` permits only `listings/<preset>/templates/*.json` and optional `sections/*.json`).
3. **`scripts/package-theme.py:1-44` (`U-20`, `U-29`):** Support an explicit `--mvp-single-preset` flag (or auto-detect when `config/settings_data.json` has 1 preset) so `listings/` is excluded from `THEME_DIRS` when packaging a 1-preset MVP without deleting `listings/*` on disk:
   ```python
   import json, os, sys, zipfile, fnmatch

   with open('config/settings_data.json', encoding='utf-8') as f:
       preset_count = len(json.load(f).get('presets', {}))

   include_listings = (preset_count > 1) and ('--mvp-single-preset' not in sys.argv)
   THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates']
   if include_listings:
       THEME_DIRS.insert(4, 'listings')
   ```

#### Step 1B — Confirm-First (`AGENTS.md §8` User-Gated) 1-Preset MVP Trim (`U-20`, `U-29`)
- **User Decision Prompt (Required before touching `config/settings_data.json`):**
  - **Option A (Recommended for MVP — 1 Preset `"Rebel"`):** With explicit user confirmation under `AGENTS.md §8`, remove `"Noir"`, `"Vibrant"`, `"Botanical"`, and `"Cyber"` (`config/settings_data.json:212-1048`, keeping `"current": "Rebel"` and `"presets": { "Rebel": { ... } }` at `:1-212`). Keep `listings/*` in git (excluded from the ZIP by `scripts/package-theme.py` when `preset_count == 1` and ignored in `.shopifyignore` via `listings/`). This satisfies `AGENTS.md:20-31` and reduces the Theme Store demo store requirement from **5 client transfer stores to 1**.
  - **Option B (5-Preset Submission):** Leave `config/settings_data.json` untouched with all 5 presets, keep `listings/<preset>/templates/*.json` in the ZIP (excluding only `listings/manifest.json`), update `AGENTS.md:20-31` + `docs/shopify-development-rules.md:31-42` to reflect 5 presets, and provision 5 client transfer stores in the Partner Dashboard.

---

### Cascade 2 — Unified `results` Faceted Filtering (`U-01`)

#### Meta-Pattern & Edge Cases Verified on Disk
In Shopify Liquid, both `collection` (`sections/main-collection.liquid`) and `search` (`sections/main-search.liquid`) expose `.filters`, `.sort_by`, `.default_sort_by`, and `.sort_options`. However, 5 concrete edge cases exist on disk that a naive rename would break:
1. **`search.url` does not exist on the Liquid `search` object:** `collection.url` returns `/collections/<handle>`, whereas `search.url` is `nil`! For `search`, the base URL must be constructed as:
   ```liquid
   {%- capture results_url -%}{{ routes.search_url }}?q={{ search.terms | url_encode }}&type=product,article,page{%- endcapture -%}
   ```
   And when appending `sort_by`, if `results_url contains '?'`, the separator must be `&sort_by=`, not `?sort_by=`.
2. **Filtered `search.results_count == 0` trap (`sections/main-search.liquid:47`):** Currently, line 47 checks `{%- if search.results_count > 0 -%}`. If a shopper applies a facet filter on `/search?q=jacket` that yields `0` matching products (`search.results_count == 0` while `active_filter_count > 0`), line 47 hides the entire results container and renders `.search-template__empty` without the filter sidebar or active filter chips—breaking both `collection.js` AJAX rendering (`#CollectionProducts` and `#FacetFiltersContainer` become `null`) and non-JS filter removal!
3. **`collection.js` `buildSearchParams()` strips `q`, `type`, and `options[prefix]` (`assets/collection.js:194-224`):** `buildSearchParams()` creates a fresh `new URLSearchParams()` from `#FacetFilterForm` checkboxes, price inputs, and `sort_by`. On `/search`, this drops `q`, `type`, and `options[prefix]` unless preserved from `new URL(this.collectionUrl, window.location.origin).searchParams` (or `window.location.search`). Furthermore, `submitFilters()` (`:188`), `bindSortEvents()` (`:232`), and `bindPaginationEvents()` (`:253`) concatenate `this.collectionUrl + '?' + searchParams.toString()`, which produces a malformed double-`?` URL if `this.collectionUrl` already contains `?q=...` unless normalized via `new URL(this.collectionUrl, window.location.origin)`!
4. **Pagination click handler collision (`assets/search.js:36,86-111` vs `assets/collection.js:238-257`):** `assets/collection.js:240` listens on `document` for `.section-pagination a, #CollectionPagination a`, while `assets/search.js:87` listens for `.search-template__pagination a` (which wraps `.section-pagination`). When `<facet-filters>` manages `/search`, `search.js`'s `handlePagination` must yield when `this.querySelector('facet-filters')` is present so `FacetFilters` handles pagination with active filters preserved.
5. **Template CSS/JS loading (`snippets/head-stylesheets.liquid:31-33`, `snippets/head-script.liquid:140-141`):** `collection.css` and `collection.js` are currently loaded only when `template == 'collection'`. Both must also load when `template contains 'search'`.

#### Exact File-by-File Specification for Cascade 2

1. **`snippets/head-stylesheets.liquid:31-33`:** Load `collection.css` alongside `search.css` on search templates:
   ```liquid
   {%- elsif template contains 'search' -%}
     {{ 'collection.css' | asset_url | stylesheet_tag }}
     {{ 'search.css' | asset_url | stylesheet_tag }}
     {{ 'article-card.css' | asset_url | stylesheet_tag }}
   ```
2. **`snippets/head-script.liquid:140-141`:** Load `collection.js` alongside `search.js` on search templates:
   ```liquid
   {%- elsif template contains 'search' -%}
     <script defer src="{{ 'collection.js' | asset_url }}"></script>
     <script defer src="{{ 'search.js' | asset_url }}"></script>
   ```
3. **`snippets/collection-filter-drawer.liquid:1-78`:** Accept `results` (defaulting to `collection`) and compute `clear_url` safely whether `results.url` exists (`collection`) or `results.terms` exists (`search`):
   ```liquid
   {%- liquid
     assign results = results | default: collection
     assign sort_by = results.sort_by | default: results.default_sort_by
     if results.url
       assign results_url = results.url
     else
       assign terms_encoded = results.terms | escape | url_encode
       assign results_url = routes.search_url | append: '?q=' | append: terms_encoded | append: '&type=product,article,page'
     endif
     if results_url contains '?'
       assign clear_url = results_url | append: '&sort_by=' | append: sort_by
     else
       assign clear_url = results_url | append: '?sort_by=' | append: sort_by
     endif
   -%}
   ```
   - At `:26`: pass `results: results` into `{%- render 'collection-facet-filter', results: results, price_filter_style: price_filter_style -%}`.
   - At `:61`: pass `results: results` into `{%- render 'collection-facet-filter', results: results, collapse_filters: false, price_filter_style: price_filter_style -%}`.
   - At `:65`: replace `href="{{ collection.url }}?sort_by={{ collection.sort_by | default: collection.default_sort_by }}"` with `href="{{ clear_url }}"`.
4. **`snippets/collection-facet-filter.liquid:9-19,23,326,338,365`:**
   - In the `{%- liquid -%}` block (`:9-18`), add the same `assign results = results | default: collection` and `clear_url` resolution.
   - Replace `collection.filters` with `results.filters` at `:23`, `:326`, and `:338`.
   - Replace `href="{{ collection.url }}?sort_by={{ collection.sort_by | default: collection.default_sort_by }}"` at `:365` with `href="{{ clear_url }}"`.
5. **`snippets/collection-active-filters.liquid:6-49`:**
   - In `{%- liquid -%}` (`:6-18`), add `assign results = results | default: collection` and `clear_url` resolution.
   - Replace `collection.filters` with `results.filters` at `:8` and `:23`.
   - Replace `href="{{ collection.url }}?sort_by={{ collection.sort_by | default: collection.default_sort_by }}"` at `:45` with `href="{{ clear_url }}"`.
6. **`snippets/collection-sort.liquid:13-96`:**
   - In `{%- liquid -%}` (`:13-32`), add:
     ```liquid
     assign results = results | default: collection
     assign total_count = results.products_count | default: results.results_count | default: 0
     ```
   - At `:51-59`: replace `collection.products_count` with `total_count`.
   - At `:68-70`: replace `collection.sort_by | default: collection.default_sort_by` with `results.sort_by | default: results.default_sort_by`, and `collection.sort_options` with `results.sort_options`.
7. **`sections/main-search.liquid:46-145` & `{% schema %}` (`:177-205`):**
   - Before line 47, compute `active_filter_count` across `search.filters` (identical to `sections/main-collection.liquid:177-186`) and construct `search_base_url`:
     ```liquid
     {%- liquid
       assign active_filter_count = 0
       for filter in search.filters
         if filter.type == 'price_range'
           if filter.min_value.value != null or filter.max_value.value != null
             assign active_filter_count = active_filter_count | plus: 1
           endif
         else
           assign active_filter_count = active_filter_count | plus: filter.active_values.size
         endif
       endfor
       assign search_terms_encoded = search.terms | escape | url_encode
       assign search_base_url = routes.search_url | append: '?q=' | append: search_terms_encoded | append: '&type=product,article,page'
       if section.settings.enable_filtering == null
         assign enable_filtering = true
       else
         assign enable_filtering = section.settings.enable_filtering
       endif
       if section.settings.enable_sorting == null
         assign enable_sorting = true
       else
         assign enable_sorting = section.settings.enable_sorting
       endif
     -%}
     ```
   - Change line 47 from `{%- if search.results_count > 0 -%}` to `{%- if search.results_count > 0 or active_filter_count > 0 -%}`.
   - Inside `<div class="search-template__results" data-search-results data-section-id="{{ section.id }}">`, wrap the results area in `<facet-filters>` with `data-section-id="{{ section.id }}"` and `data-collection-url="{{ search_base_url | escape }}"`:
     - Render mobile filter trigger button (`.collection-template__mobile-filter-ctrl` with `.collection-template__filter-badge`, matching `sections/main-collection.liquid:167-191`) when `enable_filtering and search.filters.size > 0`.
     - Render `{%- render 'collection-filter-drawer', enable_filtering: enable_filtering, filter_layout: 'sidebar', results: search, price_filter_style: 'input' -%}`.
     - Inside `.collection-template__products-container#CollectionProductGrid`, render `{%- render 'collection-sort', results: search, limit: section.settings.products_per_page, paginate: paginate, show_product_count: true, enable_sorting: enable_sorting, enable_filtering: enable_filtering, filter_layout: 'sidebar' -%}` and `{%- render 'collection-active-filters', results: search -%}` + `<div id="CollectionLiveRegion" class="visually-hidden" role="status" aria-live="polite"></div>`.
     - Always render `<section id="search-products-panel" ...><div id="CollectionProducts" tabindex="-1"><ul class="product-cards search-template__products" role="list">...</ul></div></section>` when `has_products or active_filter_count > 0`, with an `{%- else -%}` branch inside the loop rendering `<li class="product-cards__item product-cards__item--empty"><p>{{ 'sections.collection_template.empty' | t }}</p><a href="{{ search_base_url }}" class="theme-btn" data-filter-remove>{{ 'products.facets.clear_all_filters' | t }}</a></li>`.
     - Wrap `.search-template__pagination` with `id="CollectionPagination"` (`:130`).
   - In `sections/main-search.liquid` `{% schema %}` (`:177-205`), add `enable_filtering` (`checkbox`, default `true`, label `t:sections.main_collection.settings.enable_filtering.label`) and `enable_sorting` (`checkbox`, default `true`, label `t:sections.main_collection.settings.enable_sorting.label`) — both reuse existing keys in `locales/en.default.schema.json:1975-1980` and both are read in `sections/main-search.liquid`, keeping `settings-usage.cjs` at `0` unread.
8. **`assets/collection.js:187-257,317-370` & `assets/search.js:86-111`:**
   - In `assets/collection.js` `buildSearchParams()` (`:194-224`), initialize `params` by preserving baseline query parameters (`q`, `type`, `options[prefix]`) from `this.collectionUrl` (or `window.location.search` if on `/search`):
     ```javascript
     buildSearchParams() {
       var params = new URLSearchParams();
       var baseUrl = new URL(this.collectionUrl, window.location.origin);
       ['q', 'type', 'options[prefix]'].forEach(function(key) {
         if (baseUrl.searchParams.has(key)) {
           params.set(key, baseUrl.searchParams.get(key));
         }
       });
     ```
   - Add a helper `buildTargetUrl(searchParams)` in `FacetFilters` (`assets/collection.js:187`):
     ```javascript
     buildTargetUrl(searchParams) {
       var targetUrl = new URL(this.collectionUrl, window.location.origin);
       targetUrl.search = searchParams.toString();
       return targetUrl.pathname + (targetUrl.search ? targetUrl.search : '');
     }
     ```
     Use `this.buildTargetUrl(searchParams)` in `submitFilters()` (`:189`), `bindSortEvents()` (`:233`), and `bindPaginationEvents()` (`:253`).
   - In `renderSectionResponse(html)` (`assets/collection.js:317-370`), also sync search-specific regions if present (`#search-articles-panel`, `#search-pages-panel`, `.search-template__tabs`, `.search-template__count`) so filtering on `/search` updates tab counts cleanly.
   - In `assets/search.js:86` (`handlePagination`), add `if (this.querySelector('facet-filters')) return;` at line 87 so `FacetFilters` owns AJAX pagination without duplicate fetches.

---

### Cascade 3 — Unified Rich Product Media (`U-02`, `U-08`)

#### Meta-Pattern & Edge Cases Verified on Disk
Per `runs/.theme-store-requirements-261012.md:147`: *"Include rich product media in the product template, featured product section, and product forms such as quick view features."*
Currently:
- `sections/main-product.liquid:11-72,129-137` implements all 4 `media.media_type` branches (`image`, `external_video`, `video`, `model` + `shopify-xr` button + `ModelJson-{{ section.id }}`).
- `sections/featured-product.liquid:25-35` renders only `product.featured_image`.
- `templates/product.quickview.liquid:20-43` loops only `product.images`.
- **Slide-index edge case in `assets/quickview-modal.js:84-93` and `assets/product.js:322-336`:** Both files currently query `.querySelectorAll('... .swiper-slide img')` and pass the `<img>` index `i` to `swiper.slideTo(i)`. When a product has a `video`, `external_video`, or `model` slide before an image slide, the `<img>` NodeList index shifts relative to `.swiper-slide`! Matching against `.querySelectorAll('.swiper-slide')` via `slide.dataset.mediaId === String(variant.featured_media.id)` (with `slide.querySelector('img')` filename fallback) fixes variant-to-slide switching across all media types.

#### Exact File-by-File Specification for Cascade 3

1. **Create `snippets/product-media-item.liquid` (NEW shared snippet):**
   - Renders a single `media` object (`image`, `external_video`, `video`, `model` + `data-shopify-xr` button) with LiquidDoc header (`{% doc %}`):
     ```liquid
     {% doc %}
       @description Renders a single product media item (image, external_video, video, or 3D model).
       @param {object} media - Shopify product media object
       @param {object} product - Shopify product object
       @param {string} [sizes] - Responsive sizes attribute for image_tag
       @param {string} [loading] - Image loading strategy ('eager' or 'lazy'). Default: 'lazy'
       @param {string} [fetchpriority] - Image fetchpriority ('high', 'low', 'auto'). Default: 'auto'
       @param {boolean} [preload] - Preload first image. Default: false
       @param {boolean} [enable_zoom] - Emit data-zoom-src on images. Default: false
       @param {string} [image_class] - CSS class for the rendered image. Default: 'product-template__media-image'
     {% enddoc %}
     ```
   - Handles `when 'image'`, `when 'external_video'`, `when 'video'`, and `when 'model'` (including the `data-shopify-xr` button with `data-shopify-model3d-id="{{ media.id }}"` and `data-shopify-title="{{ product.title | escape }}"`).
2. **Refactor `sections/main-product.liquid:11-72`:**
   - Replace the inline `{%- case media.media_type -%}...{%- endcase -%}` (`:17-69`) with `{%- render 'product-media-item', media: media, product: product, sizes: product_media_sizes, loading: media_loading, fetchpriority: media_fetchpriority, preload: media_preload, enable_zoom: true, image_class: 'product-template__media-image' -%}`.
3. **Upgrade `sections/featured-product.liquid:24-36,88-95` (`U-02`):**
   - Load `{{ 'product.css' | asset_url | stylesheet_tag }}` at the top of the section when `product.media.size > 0` (or style `.product-template__video-wrapper`, `.product-template__model-wrapper`, `.product-template__xr-button` directly in `sections/featured-product.liquid` `{% stylesheet %}`).
   - Replace `sections/featured-product.liquid:25-35` (`{%- if product.featured_image -%}...{%- endif -%}`) with a `product.media` loop rendering `snippets/product-media-item.liquid` inside `.section-featured-product__media` (rendering a Swiper slider when `product.media.size > 1` or single media item when `product.media.size == 1`, and `'product-1' | placeholder_svg_tag` when `product.media.size == 0` or `product == blank`).
   - Also update `sections/featured-product.liquid:89-93` so when `product == blank` (fresh merchant install before selecting a product, `req L707-711`), the section renders the 2-column onboarding layout with `{{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}`, onboarding title/price, and disabled button instead of collapsing outside `request.design_mode`.
   - At the bottom of `sections/featured-product.liquid` (before `{% stylesheet %}`), add the 3D model JSON and scripts block (`{%- assign first_3d_model = product.media | where: 'media_type', 'model' | first -%}` + `<script type="application/json" id="ModelJson-{{ section.id }}">` + `model-viewer-ui` + `shopify-xr.js`), identical to `sections/main-product.liquid:129-137`.
4. **Upgrade `templates/product.quickview.liquid:20-43` & `assets/quickview-modal.js:84-93` (`U-02`):**
   - In `templates/product.quickview.liquid:21-41`, replace `product.images` with `product.media`:
     ```liquid
     {%- if product.media.size > 0 -%}
       {%- for media in product.media -%}
         <div
           class="swiper-slide product-template__media-slide product-template__media-slide--{{ media.media_type }}"
           data-media-id="{{ media.id }}"
           {% if media.media_type == 'external_video' %}data-video-host="{{ media.host }}"{% endif %}
         >
           {%- render 'product-media-item',
             media: media,
             product: product,
             sizes: '(min-width: 750px) 50vw, 100vw',
             loading: 'lazy',
             image_class: 'quickview-product__image'
           -%}
         </div>
       {%- endfor -%}
     {%- else -%}
       <div class="swiper-slide">
         {{ 'product-1' | placeholder_svg_tag: 'quickview-product__image quickview-product__image--placeholder' }}
       </div>
     {%- endif -%}
     ```
   - Change `:39` `{%- if product.images.size > 1 -%}` to `{%- if product.media.size > 1 -%}`.
   - Append the `first_3d_model` `ModelJson-quickview-{{ product.id }}` script block at the bottom of `templates/product.quickview.liquid` and trigger `if (window.ProductModel) window.ProductModel.loadShopifyXR();` inside `assets/quickview-modal.js` after loading quickview HTML.
   - In `assets/quickview-modal.js:84-93` and `assets/product.js:322-336`, iterate `.swiper-slide` elements instead of `.swiper-slide img` so `slideTo(i)` uses the true slide index `i` even when video/3D model slides are present.
5. **Create `blocks/custom_liquid.liquid` & wire `sections/featured-product.liquid:355-359` (`U-08`):**
   - Create `blocks/custom_liquid.liquid` with `{{ block.shopify_attributes }}` and setting `"type": "liquid"`, `"id": "liquid_code"`, reusing the existing schema locale keys `t:sections.custom_liquid.name`, `t:sections.custom_liquid.settings.liquid_code.label`, and `t:sections.custom_liquid.settings.liquid_code.info` (`locales/en.default.schema.json:3851-3858`):
     ```liquid
     {% doc %}
       Custom Liquid theme block for product and featured-product sections.
     {% enddoc %}
     <div class="product-template__custom-liquid" {{ block.shopify_attributes }}>
       {{ block.settings.liquid_code }}
     </div>
     {% schema %}
     {
       "name": "t:sections.custom_liquid.name",
       "tag": null,
       "settings": [
         {
           "type": "liquid",
           "id": "liquid_code",
           "label": "t:sections.custom_liquid.settings.liquid_code.label",
           "info": "t:sections.custom_liquid.settings.liquid_code.info"
         }
       ],
       "presets": [
         {
           "name": "t:sections.custom_liquid.name"
         }
       ]
     }
     {% endschema %}
     ```
   - In `sections/featured-product.liquid:355-359`, add `{ "type": "@theme" }` alongside `{ "type": "@app" }` so both `main-product` and `featured-product` accept `custom_liquid` and `@app` blocks (`req L204`).

---

### Cascade 4 — Redundancy Removal (`U-06`, `U-15b`, `U-30`, `U-23`)

#### 4.1 Remove Redundant Custom `focal_point*` Settings (`U-06`)
Per `runs/.theme-store-requirements-261012.md:115` and `runs/.input-settings-261012.md:1026-1029`, Shopify's `image_tag` filter automatically injects `style="object-position: {{ image.presentation.focal_point }};"` on `<img>`. The custom `focal_point_desktop` / `focal_point_mobile` select settings in `sections/hero.liquid` and `sections/page-about.liquid` are redundant and override native focal points unless set to match. Furthermore, for `<picture>` tags with a separate mobile `<source>`, we can bind `mobile_img.presentation.focal_point` directly via a CSS custom property on `<picture>`!
- **`sections/hero.liquid`:**
  - Lines `49-50`: Replace `--hero-object-position-d: {{ section.settings.focal_point_desktop }};` and `--hero-object-position-m: {{ section.settings.focal_point_mobile }};` with native presentation focal points:
    ```liquid
    --hero-object-position-d: {{ desktop_img.presentation.focal_point | default: '50.0% 50.0%' }};
    --hero-object-position-m: {{ mobile_img.presentation.focal_point | default: desktop_img.presentation.focal_point | default: '50.0% 50.0%' }};
    ```
  - Lines `650-704`: Delete the `"focal_point_desktop"` (`:650-676`) and `"focal_point_mobile"` (`:677-704`) `select` settings from `{% schema %}`.
- **`sections/page-about.liquid` & `assets/page-about.css`:**
  - Line `3`: Replace `style="--about-hero-position-desktop: {{ section.settings.hero_focal_point_desktop }}; --about-hero-position-mobile: {{ section.settings.hero_focal_point_mobile }};"` with:
    ```liquid
    style="--about-hero-position-desktop: {{ section.settings.hero_image_desktop.presentation.focal_point | default: '50.0% 50.0%' }}; --about-hero-position-mobile: {{ section.settings.hero_image_mobile.presentation.focal_point | default: section.settings.hero_image_desktop.presentation.focal_point | default: '50.0% 50.0%' }};"
    ```
  - Lines `223-247`: Delete `"hero_focal_point_desktop"` (`:223-234`) and `"hero_focal_point_mobile"` (`:236-247`) from `{% schema %}`.
- **`templates/page.about.json:50-51` & `listings/{rebel,noir,vibrant,botanical,cyber}/templates/page.about.json:50-51`:**
  - Remove `"focal_point_desktop": "center center",` and `"focal_point_mobile": "center top",` from all 6 files.
- **`locales/en.default.schema.json:1841-1865,3049-3073`:**
  - Remove `sections.page_about.settings.hero_focal_point_desktop`, `hero_focal_point_mobile`, `hero_focal_point` (`:1841-1865`) and `sections.hero.settings.focal_point_desktop`, `focal_point_mobile`, `focal_point` (`:3049-3073`).
- **Verification impact:** Reduces `settings-usage.cjs` total settings from `947` to `943` (+2 in `main-search` +1 in `custom_liquid` = `946`), maintaining **0 unread settings**.

#### 4.2 Evaluate & Resolve `U-15b` (`sections/logo-list.liquid:9-16,47,73`) Under `CLAUDE.md` Verified Decisions
Per `CLAUDE.md` (*Verified Decisions* & *User Decisions*), we must not silently reverse UX/AX decision `P5` (`plans/reports/enhance-ux-ax-261009-2342-storefront.md:61-64`) without presenting the original decision, the new evidence/conflict, the trade-off, and the concrete options:
- **Original Decision (`P5`, `2026-10-09`):** Added `if block.settings.image != blank or request.design_mode` at `sections/logo-list.liquid:10,16,47,73` because on `2026-10-09` the live demo store (`devs2-rebel.myshopify.com`) had 6 unpopulated logo blocks on the homepage, which rendered 6 generic placeholder SVGs during storefront UX audits.
- **New Context & Audit Conflict (`2026-10-10`..`2026-10-14`):**
  1. On `2026-10-10` (Milestone M6), 6 real press logo images (`rebel-logo-1.png`..`rebel-logo-6.png`) were generated and wired into `templates/index.json` and all 5 `listings/*/templates/index.json` files (`block.settings.image != blank` is now true on the demo store).
  2. However, per `runs/.theme-store-requirements-261012.md:711` (*"Demo imagery doesn't transfer on install"*) and `:599` (*"Lists of logos -> Logo icon"*), when a merchant installs Rebel on a fresh store or adds a new Logo List section, `block.settings.image` is `blank`. Because of `P5`'s `request.design_mode` gate, the entire `logo-list` section collapses to `0px` height on the merchant's live storefront outside the Theme Editor!
- **Inversion Insight & Concrete Options:**
  - **Option 1 (Recommended — Remove `request.design_mode` gate & use `'logo' | placeholder_svg_tag`):** Because all 6 demo blocks on `devs2-rebel.myshopify.com` now have real uploaded images (`block.settings.image != blank`), removing the `request.design_mode` gate in `sections/logo-list.liquid:9-16,47,73` **never shows placeholders on the demo store** (preserving `P5`'s visual goal on the demo store!) while guaranteeing that a fresh merchant install renders the 6 `'logo' | placeholder_svg_tag: 'placeholder-svg'` onboarding placeholders required by `req L599, L707-711`.
    - Exact diff in `sections/logo-list.liquid`:
      - Lines `9-16`: simplify `logo_count` to `assign logo_count = section.blocks.size` and outer guard to `{%- if logo_count > 0 or request.design_mode -%}`.
      - Lines `47` and `73`: delete `{%- unless block.settings.image != blank or request.design_mode -%}{%- continue -%}{%- endunless -%}`.
      - Lines `61` and `87` (`U-15a`): change `{{ 'image' | placeholder_svg_tag }}` to `{{ 'logo' | placeholder_svg_tag: 'placeholder-svg' }}` (or `'image'` if Theme Check `ValidPlaceholder` rejects `'logo'` — see Cascade 5 `U-15a` check).
  - **Option 2 (Keep `P5` strictly):** Keep `sections/logo-list.liquid:10,16,47,73` unchanged so unconfigured logo blocks render placeholders only inside the Theme Editor (`request.design_mode`), accepting the risk that Theme Store reviewers testing the fresh-install storefront outside the Theme Editor see the Logo List section hidden until images are chosen.

#### 4.3 Prune Non-MVP Plan Bloat & Reconcile Documentation (`U-30`, `U-23`)
- **Prune `blocks/volume_pricing.liquid` (`U-30`):** B2B volume pricing (`variant.quantity_price_breaks`) is not a Shopify Theme Store requirement (`runs/.theme-store-requirements-261012.md` has 0 mentions of `volume_pricing` or `quantity_price_breaks`), whereas B2B `variant.quantity_rule` is already 100% implemented in `blocks/quantity_selector.liquid:8-27`, `snippets/quantity-selector.liquid:14-45`, and `assets/product.js:576-588`. Mark `P2_5`/`P2_6` (`volume_pricing`) in `plans/260919-master-pdp-plp-remediation-plan/plan.md:29-30,520-560` as **Deferred (Post-MVP B2B Phase)**.
- **Retire obsolete `snippets/collection-filter-modal.liquid` & `<600` raw-line assertion (`U-30`):** In `plans/260919-master-pdp-plp-remediation-plan/plan.md:36-37,859,1099`, record that modal markup was consolidated into `snippets/collection-filter-drawer.liquid:31-77` and that `sections/main-collection.liquid` has **342 lines of Liquid** (`:1-342`) + **674 lines of `{% schema %}`** (`:343-1016`), passing Theme Check `TemplateLength` (`max_length: 600` excludes `{% schema %}`).
- **Update all 4 `plans/*/plan.md` frontmatter & checkboxes (`U-30`):**
  - `plans/260629-0000-release-readiness-stabilization/plan.md:4,23-27`: update `status: pending` → `status: completed` and Phases 1–5 to `Completed`.
  - `plans/260629-2235-shopify-theme-store-readiness/plan.md:4,35-40`: update Phases 1–5 to `Completed` and Phase 6 to `In Progress (Off-Code/External Gates)`.
  - `plans/260918-1640-shopify-theme-store-modernization/plan.md:4,32-35,51-62`: update `status: in-progress` → `status: completed`, Phases 2–4 to `Completed`, and check all 12 `[x]` success criteria.
  - `plans/260919-master-pdp-plp-remediation-plan/plan.md:4`: update `status: in-progress` → `status: completed` (with `volume_pricing` noted as post-MVP).
- **Update `docs/theme-audit-log.md:33-52` (`U-30`):** Update the page status table (`#3 Homepage` through `#13 Contact/About/FAQ/Stores`) from `⏳ Chưa audit` to `✅ PASS (2026-10-11 UX/AX Round 10 + 2026-10-14 MVP Compliance)` and fix row `#7` template name from `main-search-quickview.liquid` to `main-search.liquid`.

---

### Cascade 5 — Atomic Compliance Sweep (`U-03`, `U-04`, `U-05a`, `U-05b`, `U-07`, `U-09`, `U-10`, `U-11a`, `U-11b`, `U-13`, `U-14`, `U-15a`, `U-16`, `U-26`, `U-27`, `U-32`)

Every remaining finding is specified below with exact `file:line` anchors and replacement code:

#### Bucket A — Fresh-Install Blank-State Placeholders (`U-13`, `U-09`, `U-14`, `U-15a`)
1. **`sections/image-text-overlay.liquid:38-40,86-89` (`U-13`):**
   - At `:39`, replace `<div class="section-ito__placeholder"></div>` with:
     ```liquid
     <div class="section-ito__placeholder">
       {{ 'lifestyle-1' | placeholder_svg_tag: 'placeholder-svg' }}
     </div>
     ```
   - At `:86-89`, add `.section-ito__placeholder .placeholder-svg { width: 100%; height: 100%; object-fit: cover; fill: rgba(255, 255, 255, 0.35); }`.
2. **`sections/parallax-image.liquid:21-23,83-86` (`U-13`):**
   - At `:22`, replace `<div class="section-parallax__ph"></div>` with:
     ```liquid
     <div class="section-parallax__ph">
       {{ 'lifestyle-1' | placeholder_svg_tag: 'placeholder-svg' }}
     </div>
     ```
   - At `:83-86`, add `.section-parallax__ph .placeholder-svg { width: 100%; height: 100%; object-fit: cover; fill: rgba(255, 255, 255, 0.35); }`.
3. **`sections/layered-images.liquid:19-41` (`U-13`):**
   - When all three images (`image_1`, `image_2`, `image_3`) are blank on a fresh install, render two layered SVG placeholders (`'image' | placeholder_svg_tag: 'placeholder-svg section-layered__img'`) inside `.section-layered__layer--1` and `.section-layered__layer--2` so the layered layout is visually demonstrated (`req L598, L707-711`):
     ```liquid
     {%- if section.settings.image_1 == blank and section.settings.image_2 == blank and section.settings.image_3 == blank -%}
       <div class="section-layered__layer section-layered__layer--1">
         {{ 'image' | placeholder_svg_tag: 'placeholder-svg section-layered__img' }}
       </div>
       <div class="section-layered__layer section-layered__layer--2">
         {{ 'image' | placeholder_svg_tag: 'placeholder-svg section-layered__img' }}
       </div>
     {%- endif -%}
     ```
4. **`snippets/collection-card.liquid:44-47` (`U-09`):**
   - Line `45` currently passes `collection.title` (`{{ collection.title | placeholder_svg_tag: 'placeholder-svg' }}`), which is invalid. Replace line `45` with:
     ```liquid
     {{ 'collection-1' | placeholder_svg_tag: 'placeholder-svg' }}
     ```
5. **`sections/logo-list.liquid:61,87` (`U-15a`):**
   - Note on Shopify's `placeholder_svg_tag`: valid names in Shopify Liquid / Theme Check `ValidPlaceholder` are `'image'`, `'collection-1'`..`'collection-6'`, `'lifestyle-1'`..`'lifestyle-2'`, `'product-1'`..`'product-6'`. While `req L599` says *"Lists of logos -> Logo icon"* conceptually, `'logo'` is not a valid `placeholder_svg_tag` token in Liquid (it outputs an invalid placeholder warning in Theme Check). Instead, render an inline monochrome brand-mark SVG or `'image' | placeholder_svg_tag: 'placeholder-svg'` styled to `--ll-logo-h` height inside `.section-logo-list__ph` (`:124-135`).
6. **`sections/video.liquid:7-30,63-97,114-120,136-168,362-383` & `locales/en.default.schema.json:6133-6143` (`U-14`):**
   - In `sections/video.liquid:375-380`, upgrade `"youtube_url"` from `"type": "text"` to `"type": "video_url"` with `"accept": ["youtube", "vimeo"]` and `"default": "https://www.youtube.com/watch?v=_9VUPq3SxOc"` (`req L147, L601` — verified via `grep` that 0 template JSON files in `templates/` or `listings/` store a string for `youtube_url`, so changing the setting type to `video_url` is 100% backward-compatible!):
     ```json
     {
       "type": "video_url",
       "id": "youtube_url",
       "accept": ["youtube", "vimeo"],
       "default": "https://www.youtube.com/watch?v=_9VUPq3SxOc",
       "label": "t:sections.video.settings.youtube_url.label",
       "info": "t:sections.video.settings.youtube_url.info",
       "visible_if": "{{ section.settings.video_type == 'youtube' }}"
     },
     ```
   - In `sections/video.liquid:19-30`, support both `video_url` object properties (`yt_url.id`, `yt_url.type`) and raw string fallback:
     ```liquid
     assign video_id = yt_url.id
     assign video_host = yt_url.type | default: 'youtube'
     if video_id == blank and yt_url != blank
       if yt_url contains 'vimeo.com/'
         assign video_host = 'vimeo'
         assign video_id = yt_url | split: 'vimeo.com/' | last | split: '?' | first | split: '/' | first
       elsif yt_url contains 'youtu.be/'
         assign video_id = yt_url | split: 'youtu.be/' | last | split: '?' | first
       elsif yt_url contains 'v='
         assign video_id = yt_url | split: 'v=' | last | split: '&' | first
       elsif yt_url contains '/embed/'
         assign video_id = yt_url | split: '/embed/' | last | split: '?' | first
       endif
     endif
     if video_type == 'youtube' and video_id == blank
       assign video_id = '_9VUPq3SxOc'
       assign video_host = 'youtube'
     endif
     ```
   - In `sections/video.liquid:65-96` and `:136-168`, add `data-video-host="{{ video_host }}"` to `.section-video__facade`; when `video_host == 'vimeo'`, load `https://player.vimeo.com/video/' + ytId + '?autoplay=1'` on click and render `{{ 'lifestyle-1' | placeholder_svg_tag: 'section-video__poster placeholder-svg' }}` when `poster == blank` on Vimeo.
   - In `locales/en.default.schema.json:6135,6140-6141`: update `"youtube": "YouTube"` → `"youtube": "YouTube or Vimeo"` and `"label": "YouTube URL"` → `"label": "Video URL"`, `"info": "Accepts YouTube or Vimeo links"`.

#### Bucket B — Schema & Locale Normalization (`U-05a`, `U-05b`, `U-07`, `U-27`, `U-32`)
1. **`sections/footer.liquid:324-327` (`U-05a` — High):** Add `"default": "footer"` to the `menu` block's `link_list` setting (`req L473, L810`):
   ```json
   {
     "type": "link_list",
     "id": "menu",
     "label": "t:sections.footer.blocks.menu.settings.menu.label",
     "default": "footer"
   }
   ```
2. **`sections/header.liquid:92-96` (`U-05b` — Low / Open Question):**
   - Line `95` currently sets `"default": "customer-account-main-menu"` on `"id": "customer_account_menu"` (`type: "link_list"`). While Horizon uses this for `<shopify-account>`, `runs/.theme-store-requirements-261012.md:473,810` literally states: *"All settings of type `link_list` in the Header or Footer must have a `default` value of `main-menu` or `footer`."*
   - **Fix:** Change `"default": "customer-account-main-menu"` at `sections/header.liquid:95` to `"default": "main-menu"` so literal automated review of `req L473` cannot fail the header schema.
3. **`config/settings_schema.json:1158-1188` (`U-07` — High Must Rule):**
   - Per `runs/.theme-store-requirements-261012.md:457-463` (`## 13. Social media`: *"Social media placeholder text must be left empty"*) and `AGENTS.md:247` (official requirements outrank Dawn): delete the 6 `"placeholder": "t:settings_schema.social-media.settings.social_*_link.info"` lines at `config/settings_schema.json:1158, 1164, 1170, 1176, 1182, 1188`.
4. **`locales/en.default.schema.json` (`U-27` — Medium):**
   Update the exact 13 schema strings violating sentence case (`req L481`), `&` (`req L514`), `homepage` (`req L536`), or `Slider` (`req L539`) while leaving `:2794` (`"Search & Discovery"` proper app name) untouched:
   - `:359`: `"name": "Table of Contents"` → `"name": "Table of contents"`
   - `:1011`: `"name": "Badges & tags"` → `"name": "Badges and tags"`
   - `:1453`: `"info": "Customize TOC style in Theme Settings > Table of Contents."` → `"info": "Customize TOC style in Theme settings > Table of contents."`
   - `:1732`: `"content": "Payment & Follow"` → `"content": "Payment and follow"`
   - `:2050`: `"content": "Sort & pagination"` → `"content": "Sort and pagination"`
   - `:2336`: `"name": "Flash Sale"` → `"name": "Flash sale"`
   - `:2622`: `"name": "Before/After slider"` → `"name": "Before and after"`
   - `:2695`: `"name": "Before/After slider"` → `"name": "Before and after"`
   - `:2879`: `"slider": "Slider"` → `"slider": "Carousel"`
   - `:3227`: `"info": "First hero on the homepage auto-uses H1 for SEO."` → `"info": "First hero on the home page auto-uses H1 for SEO."`
   - `:3395`: `"slider": "Slider"` → `"slider": "Carousel"`
   - `:5689`: `"name": "Spacer & Divider"` → `"name": "Spacer and divider"`
   - `:5756`: `"name": "Spacer & Divider"` → `"name": "Spacer and divider"`
5. **`sections/hero.liquid:1205-1208` (`U-32`):**
   - Update `"id": "end_date"` default at `:1207` from `"2026-12-31T23:59:59"` to `"2027-12-31T23:59:59"` so the countdown block does not expire during 2026–2027 Theme Store review or merchant trials.

#### Bucket C — Liquid Object Completeness (`U-11a`, `U-11b`, `U-10`, `U-03`)
1. **`snippets/head-fonts.liquid:7-24` (`U-11a`, `U-11b` — High):**
   - At `:7` (`U-11b`), add `and settings.type_subheading_font.system?` to the `unless` guard:
     ```liquid
     {%- unless settings.type_header_font.system? and settings.type_subheading_font.system? and settings.type_body_font.system? -%}
       <link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>
     {%- endunless -%}
     ```
   - At `:11-24` (`U-11a`, `req L611`), generate and output `font_modify` (`bold`, `italic`, `bold_italic`) `@font-face` declarations for all 3 font settings (`type_header_font`, `type_subheading_font`, `type_body_font`):
     ```liquid
     {%- liquid
       assign header_font_bold = settings.type_header_font | font_modify: 'weight', 'bold'
       assign header_font_italic = settings.type_header_font | font_modify: 'style', 'italic'
       assign header_font_bold_italic = header_font_bold | font_modify: 'style', 'italic'

       assign subheading_font_bold = settings.type_subheading_font | font_modify: 'weight', 'bold'
       assign subheading_font_italic = settings.type_subheading_font | font_modify: 'style', 'italic'
       assign subheading_font_bold_italic = subheading_font_bold | font_modify: 'style', 'italic'

       assign body_font_bold = settings.type_body_font | font_modify: 'weight', 'bold'
       assign body_font_italic = settings.type_body_font | font_modify: 'style', 'italic'
       assign body_font_bold_italic = body_font_bold | font_modify: 'style', 'italic'
     -%}
     {% style %}
       {{ settings.type_header_font | font_face: font_display: 'swap' }}
       {{ header_font_bold | font_face: font_display: 'swap' }}
       {{ header_font_italic | font_face: font_display: 'swap' }}
       {{ header_font_bold_italic | font_face: font_display: 'swap' }}
       {{ settings.type_subheading_font | font_face: font_display: 'swap' }}
       {{ subheading_font_bold | font_face: font_display: 'swap' }}
       {{ subheading_font_italic | font_face: font_display: 'swap' }}
       {{ subheading_font_bold_italic | font_face: font_display: 'swap' }}
       {{ settings.type_body_font | font_face: font_display: 'swap' }}
       {{ body_font_bold | font_face: font_display: 'swap' }}
       {{ body_font_italic | font_face: font_display: 'swap' }}
       {{ body_font_bold_italic | font_face: font_display: 'swap' }}
     {% endstyle %}
     ```
2. **`sections/main-customers-order.liquid:121-175` (`U-10` — High):**
   - Per `runs/.theme-store-requirements-261012.md:96`, display per-line item discounts (`line_item.original_price`, `line_item.original_line_price`, `line_item.line_level_discount_allocations`) and order summary subtotal/tax rows (`order.line_items_subtotal_price`, `order.tax_lines`). All required locale keys (`customer.order.subtotal`, `customer.order.discount`, `customer.order.shipping`, `customer.order.tax`, `customer.order.total_duties`, `customer.order.total`) already exist in `locales/en.default.json:921-927`!
   - At `:131-134` (inside `.order-template__product-info`), append per-line discount allocations:
     ```liquid
     {%- if line_item.line_level_discount_allocations != blank -%}
       <ul class="order-template__line-discounts" role="list">
         {%- for discount_allocation in line_item.line_level_discount_allocations -%}
           <li class="order-template__line-discount">
             {{- discount_allocation.discount_application.title | escape }} (-{{ discount_allocation.amount | money -}})
           </li>
         {%- endfor -%}
       </ul>
     {%- endif -%}
     ```
   - At `:135-146` (price and line total cells), render `original_price` / `original_line_price` strikethrough when `line_item.original_price != line_item.final_price`:
     ```liquid
     <td class="text-right">
       {%- if line_item.original_price != line_item.final_price -%}
         <del class="order-template__price-original">{{ line_item.original_price | money }}</del>
         <span class="order-template__price-final">{{ line_item.final_price | money }}</span>
       {%- else -%}
         {{ line_item.final_price | money }}
       {%- endif -%}
       {%- if line_item.unit_price -%}
         <div class="order-template__unit-price">
           <span class="visually-hidden">{{ 'products.product.price.unit_price' | t }}</span>
           {{ line_item.unit_price | money }}/{{ line_item.unit_price_measurement.reference_value }}{{ line_item.unit_price_measurement.reference_unit }}
         </div>
       {%- endif -%}
     </td>
     <td class="text-center">{{ line_item.quantity }}</td>
     <td class="text-right order-template__product-total">
       {%- if line_item.original_line_price != line_item.final_line_price -%}
         <del class="order-template__price-original">{{ line_item.original_line_price | money }}</del>
         <span class="order-template__price-final">{{ line_item.final_line_price | money }}</span>
       {%- else -%}
         {{ line_item.final_line_price | money }}
       {%- endif -%}
     </td>
     ```
   - At `:152-172` (inside `.order-template__summary-content`), add `order.line_items_subtotal_price` at the top and `order.tax_lines` + `order.total_duties` before `order.total_price`:
     ```liquid
     <div class="order-template__summary-row">
       <span class="order-template__label">{{ 'customer.order.subtotal' | t }}:</span>
       <span class="order-template__value">{{ order.line_items_subtotal_price | money }}</span>
     </div>
     ...
     {%- for tax_line in order.tax_lines -%}
       <div class="order-template__summary-row">
         <span class="order-template__label">{{ 'customer.order.tax' | t }} ({{ tax_line.title }} {{ tax_line.rate | times: 100 }}%):</span>
         <span class="order-template__value">{{ tax_line.price | money }}</span>
       </div>
     {%- endfor -%}
     {%- if order.total_duties -%}
       <div class="order-template__summary-row">
         <span class="order-template__label">{{ 'customer.order.total_duties' | t }}:</span>
         <span class="order-template__value">{{ order.total_duties | money }}</span>
       </div>
     {%- endif -%}
     ```
3. **`blocks/buy_buttons.liquid:17-48` (`U-03` — Low):**
   - Move `{%- if product.gift_card? -%}...{%- endif -%}` (`:17-45`) inside `{%- form 'product', product, id: product_form_id, class: 'product-template__actions' -%}` (immediately after line 48 `<input type="hidden" name="id" ...>`), and render `form.errors` inside `.product-template__gift-card-fields` when `form.errors` is non-empty so non-JS submissions and server-side recipient validation errors display natively.

#### Bucket D — Template & CI Metadata Hygiene (`U-04`, `U-16`, `U-26`)
1. **`templates/product.json:53-94` & `listings/{rebel,noir,vibrant,botanical,cyber}/templates/product.json` (`U-04`):**
   - Add `"pickup_availability": { "type": "pickup_availability", "settings": {} }` after `"buy_buttons"` (`:54`) and insert `"pickup_availability"` into `"block_order"` (`:89`) across all 6 `product.json` files.
2. **`templates/{index,page.about,page.stores}.json` & `listings/{rebel,noir,vibrant,botanical,cyber}/templates/{index,page.about,page.stores}.json` (`U-16`):**
   - Replace `"Devs2 Rebel"` → `"Rebel"` across all 18 files (`228` occurrences total: 1 in each `index.json:424`, 4 in each `page.about.json:20,49,83,284`, and 33 in each `page.stores.json:20,27,47,67,83-98`).
3. **`.github/workflows/theme-store-ci.yml:36-38` (`U-26`):**
   - Append an `actions/upload-artifact@v4` step after `python scripts/package-theme.py`:
     ```yaml
           - name: Upload Distribution Theme ZIP
             uses: actions/upload-artifact@v4
             with:
               name: rebel-v1.0.0-zip
               path: dist/rebel-v1.0.0.zip
               if-no-files-found: error
     ```

---

## 3. Concrete Unblock Path & Execution Checklist

Execute the cascades in **5 sequential, self-verifying waves**:

### Wave 1: Shared Polymorphic Snippets & Block Foundations (Cascades 2 & 3)
1. Create `snippets/product-media-item.liquid` (`U-02`).
2. Create `blocks/custom_liquid.liquid` (`U-08`).
3. Parameterize `snippets/collection-filter-drawer.liquid`, `snippets/collection-facet-filter.liquid`, `snippets/collection-active-filters.liquid`, and `snippets/collection-sort.liquid` to accept `results = results | default: collection` (`U-01`).
4. Update `snippets/head-stylesheets.liquid:31-33` and `snippets/head-script.liquid:140-141` to load `collection.css` and `collection.js` on `template contains 'search'` (`U-01`).

### Wave 2: Storefront Section & JS Wiring (Cascades 2 & 3)
1. Wire `<facet-filters>` + `enable_filtering` / `enable_sorting` into `sections/main-search.liquid:46-205` with the `search.results_count > 0 or active_filter_count > 0` guard (`U-01`).
2. Update `assets/collection.js:187-257,317-370` (`buildSearchParams` preserving `q`/`type`/`options[prefix]`, `buildTargetUrl`) and `assets/search.js:86-90` (`U-01`).
3. Wire `snippets/product-media-item.liquid` into `sections/main-product.liquid:11-72`, `sections/featured-product.liquid:24-36,88-95,355-359`, and `templates/product.quickview.liquid:20-43`, and update slide-index matching in `assets/quickview-modal.js:84-93` and `assets/product.js:322-336` (`U-02`, `U-08`).

### Wave 3: Redundancy Removal & Atomic Compliance Sweep (Cascades 4 & 5)
1. Remove custom `focal_point*` settings/CSS/JSON/locales from `sections/hero.liquid`, `sections/page-about.liquid`, `templates/page.about.json`, `listings/*/templates/page.about.json`, and `locales/en.default.schema.json` (`U-06`).
2. Apply blank-state SVG placeholders in `sections/image-text-overlay.liquid:39`, `sections/parallax-image.liquid:22`, `sections/layered-images.liquid:19-41`, `snippets/collection-card.liquid:45`, `sections/logo-list.liquid:9-16,47,61,73,87` (per user confirmation on `U-15b`), and upgrade `sections/video.liquid:19-30,65-96,136-168,375-380` to `type: "video_url"` with default `_9VUPq3SxOc` (`U-13`, `U-09`, `U-14`, `U-15a`, `U-15b`).
3. Apply schema & locale fixes in `sections/footer.liquid:326` (`U-05a`), `sections/header.liquid:95` (`U-05b`), `sections/hero.liquid:1207` (`U-32`), `config/settings_schema.json:1158-1188` (`U-07`), and `locales/en.default.schema.json` (`U-27`).
4. Apply Liquid completeness fixes in `snippets/head-fonts.liquid:7-24` (`U-11a`, `U-11b`), `sections/main-customers-order.liquid:131-172` (`U-10`), and `blocks/buy_buttons.liquid:17-48` (`U-03`).
5. Add `pickup_availability` to `templates/product.json` + `listings/*/templates/product.json` (`U-04`), replace `"Devs2 Rebel"` → `"Rebel"` across the 18 template JSON files (`U-16`), and update `listings/manifest.json:4` (`U-25`), `.shopifyignore` (`U-24`), `scripts/package-theme.py` (`U-20`), and `.github/workflows/theme-store-ci.yml:36-38` (`U-26`).

### Wave 4: Plan & Doc Reconciliation + Mechanical Verification Gate (Cascade 4)
1. Reconcile `plans/*/plan.md` frontmatter/checkboxes and `docs/theme-audit-log.md:33-52` (`U-30`).
2. Run all local mechanical gates:
   ```bash
   node scripts/validate-locales.mjs
   node scripts/validate-schema-ranges.mjs
   node runs/e2e/settings-usage.cjs
   node --check assets/collection.js && node --check assets/search.js && node --check assets/product.js && node --check assets/quickview-modal.js
   python scripts/package-theme.py --mvp-single-preset
   ```

### Wave 5: User-Gated Confirmations (`AGENTS.md §8` & CLI / Git Gates)
1. **Confirm-first (`AGENTS.md §8`):** Upon user confirmation of the 1-preset MVP (`U-20`, `U-29`), trim `"Noir"`, `"Vibrant"`, `"Botanical"`, and `"Cyber"` from `config/settings_data.json:212-1048` and re-run `node scripts/validate-schema-ranges.mjs` + `python scripts/package-theme.py`.
2. **Confirm-first (`AGENTS.md §4`):** Run `shopify theme check` once approved by the user (`U-31`).
3. **Confirm-first (`U-23`):** Stage and commit the clean working tree on `main` via `git --git-dir=.git-nested --work-tree=.`.

---

## 4. Residual External / User-Owned Prerequisites

Even after 100% of in-repo code, schema, locale, template, and packaging items above are completed and verified, the following **8 items cannot be faked in code** and remain external or user-gated prerequisites:

| ID | Category | Prerequisite | Why It Cannot Be Resolved by Unapproved Code Edits | Exact Action Required from User / Merchant Admin |
|---|---|---|---|---|
| **`U-20` / `U-29`** | **`AGENTS.md §8` & Partner Dashboard** | 1-Preset `config/settings_data.json` trim + Client Transfer Demo Store(s) | `AGENTS.md §8` forbids editing `config/settings_data.json` without explicit user confirmation; Partner Dashboard store creation is external (`req L727-735`). | 1. Confirm trimming `config/settings_data.json` to 1 preset (`"Rebel"`) for MVP.<br>2. Provision **1 client transfer store** in Shopify Partner Dashboard (with Bogus Gateway or Shopify Payments test mode). |
| **`U-17`** | **External DNS / Hosting** | Live Documentation & Support URLs (`https://docs.devs2.com/rebel`, `https://devs2.com/support`) | Both domains currently fail DNS resolution (`getaddrinfo failed`); required before Theme Store launch (`req L760-762`). | Deploy public documentation and support pages on `docs.devs2.com` and `devs2.com` (or provide live replacement URLs for `config/settings_schema.json:7-8`). |
| **`U-18`** | **External Web Portal** | Public Merchant Support Contact Form | `req L762, L790-804` requires a mobile-friendly support form at `theme_support_url` with Name, Email, Store URL, Description, **File Upload**, and **Auto-responder**. | Publish the compliant merchant support form with file attachment and auto-responder on `https://devs2.com/support`. |
| **`U-19`** | **Partner Submission Form** | `v1.0.0` Release Notes | Submitted in the Shopify Theme Store Partner portal alongside `dist/rebel-v1.0.0.zip` (`.shopifyignore:25` excludes `_changelogs/` from the ZIP, `req L719-725`). | Paste the drafted `v1.0.0` release notes into the Theme Store submission form. |
| **`U-28`** | **Shopify Store Admin (`devs2-rebel.myshopify.com`)** | Selling Plan Label, Legal Policies & Homepage Social Meta | `.env` Admin API token lacks `write_purchase_options` and legal-policy scopes (`plans/reports/demo-production-261010-release-readiness.md:106-135`). | In Shopify Admin:<br>1. Rename `"ski wax"` selling plan group on `leather-care-balm`.<br>2. Create Terms of Service, Refund, and Shipping policies under `Settings > Policies`.<br>3. Set homepage social sharing image and meta description under `Online Store > Preferences`. |
| **`U-31`** | **User-Approved CLI Gate** | `shopify theme check` Execution | Every `shopify *` CLI command requires explicit per-command user approval (`AGENTS.md:45-54`). | Approve running `shopify theme check` after Waves 1–4 land. |
| **`U-21`** | **Live Storefront Benchmark** | Lighthouse Desktop & Mobile Benchmark Dataset (`perf >= 60`, `a11y >= 90`) | Requires live/preview storefront (`shopify theme dev` or published transfer store) across Home, PDP, and PLP (`req L220-235`). | Approve running Lighthouse on desktop & mobile against `/`, PDP, and PLP and archiving JSON/HTML receipts under `plans/reports/`. |
| **`U-22`** | **Cross-Browser / Webview QA** | Safari (macOS/iOS), Firefox, Samsung Internet & Social Webview Matrix | Automated E2E runs (`runs/e2e/*.cjs`) cover Chromium only; physical/emulated iOS Safari and Instagram/Facebook/Pinterest webviews require live store testing (`req L415-421`). | Execute and record the cross-browser and mobile webview QA checklist against the live demo store before final submission. |

---

# Verifier Appendix (`ak:problem-solving --ultra`)

## Verifier Winner Selection & Ranking Table

| Rank | Candidate | Symptom-to-Technique Fit (1–20) | Depth of Application (1–20) | Actionability of Unblock Path (1–20) | Honesty about Residual Unknowns (1–20) | Total (/80) | Verifier Rationale (Verified Against Disk `E:/Work/shopify`) |
|---:|---|---:|---:|---:|---:|---:|---|
| **1** | **Candidate D** | **20** | **20** | **19** | **20** | **79** | **Winner.** Best technical precision and edge-case depth across all 5 cascades. Uniquely caught **4 load-bearing traps** verified on disk: (1) in `U-01`, prevented double-`?` URL corruption in `assets/collection.js:187-257` via `buildTargetUrl(searchParams)` (`new URL(this.collectionUrl, window.location.origin)`), guarded `assets/search.js:86-90` (`if (this.querySelector('facet-filters')) return;`) against duplicate pagination `fetch()` collisions with `collection.js:240`, and handled the `search.results_count == 0` + `active_filter_count > 0` empty-filter trap at `sections/main-search.liquid:47`; (2) in `U-02`, caught the `.swiper-slide img` vs `.swiper-slide` slide-index drift bug in **both** `assets/quickview-modal.js:84-93` and `assets/product.js:322-336` when video/3D model slides precede variant images; (3) in `U-06`, bound `desktop_img.presentation.focal_point` and `mobile_img.presentation.focal_point` directly into the existing CSS custom properties (`sections/hero.liquid:49-50`, `sections/page-about.liquid:3`) so `<picture>` mobile `<source>` art direction preserves its mobile focal point with zero CSS selector churn; and (4) in `U-15a`, uniquely caught that `'logo'` is not a valid Shopify `placeholder_svg_tag` token under Theme Check `ValidPlaceholder` (which only accepts `'image'`, `'collection-1..6'`, `'lifestyle-1..2'`, `'product-1..6'`, and `*-apparel-*`). |
| **2** | **Candidate A** | **20** | **18** | **18** | **19** | **75** | Strong problem-solving framing, complete Liquid snippets, and good catch on `sections/logo-list.liquid:45-48` duplicate `{{ block.shopify_attributes }}` on the second marquee track. Deducted `-2` on Depth and `-2` on Actionability for: (1) off-by-14 line numbers in `config/settings_data.json` (`:227-1048` cited vs. actual `:213-1048` on disk); (2) missing the pagination click-listener collision between `assets/search.js:85` and `assets/collection.js:240`; (3) creating new `t:sections.main_product.blocks.custom_liquid.*` locale keys instead of reusing the existing `t:sections.custom_liquid.*` keys already at `locales/en.default.schema.json:3851-3858`; and (4) passing `'logo'` to `placeholder_svg_tag` without flagging Theme Check `ValidPlaceholder`. |
| **3** | **Candidate B** | **19** | **18** | **18** | **19** | **74** | Clean 2-stage packaging split (`scripts/package-theme.py` preset-count check), caught the `assets/search.js:83-105` pagination listener collision and `sections/main-search.liquid:46` `search.filters.size > 0` guard, and reused `t:sections.custom_liquid.*` in `blocks/custom_liquid.liquid`. Deducted `-2` on Depth and `-2` on Actionability for: (1) omitting `enable_filtering` / `enable_sorting` schema settings on `sections/main-search.liquid:177-205` and loading `collection.css`/`collection.js` inline instead of `snippets/head-stylesheets.liquid:31-33` and `snippets/head-script.liquid:140-141`; (2) updating variant slide matching in `assets/quickview-modal.js:76-95` but missing `assets/product.js:322-336`; and (3) passing `'logo'` to `placeholder_svg_tag`. |
| **4** | **Candidate E** | **19** | **17** | **17** | **19** | **72** | High-density tables, clean `.presentation.focal_point` binding in `sections/hero.liquid:49-50` and `sections/page-about.liquid:3`, and clear `CLAUDE.md` Verified Decisions table for `U-15b`. Deducted `-3` on Depth and `-3` on Actionability for: (1) missing the `assets/search.js:85` pagination listener collision and tab re-initialization after AJAX facet filtering; (2) missing the `.swiper-slide img` index shift in both `assets/quickview-modal.js` and `assets/product.js` when `product.media` includes video/3D slides; and (3) hardcoding `enable_filtering: true` in `sections/main-search.liquid` instead of wiring schema controls. |
| **5** | **Candidate C** | **19** | **16** | **18** | **18** | **71** | Well-organized 6-step execution plan and good modular extraction of `snippets/product-media-item.liquid` + `snippets/product-media-xr.liquid`. Deducted `-4` on Depth for: (1) deleting `--hero-object-position-d` / `--hero-object-position-m` CSS rules in `sections/hero.liquid:349-354` and `assets/page-about.css:22-27` instead of binding `mobile_img.presentation.focal_point`, which causes `<picture>` mobile `<source>` art direction to inherit the desktop `<img>` inline `object-position`; (2) off-by-3 line numbers in `config/settings_schema.json:1161-1191` (actual on disk is `:1158-1188`); and (3) missing the `assets/search.js:85` pagination handler collision with `assets/collection.js:240`. |

---

## Winning Candidate

`D`

---

## Verifier Technical Spot-Check Notes on Winner (`Candidate D`)

All file paths, line numbers, and technical contracts in **Candidate D** were spot-checked against the live repository at `E:/Work/shopify`:

1. **`config/settings_data.json:1-1050` Preset Boundaries (Cascade 1):**
   - Verified on disk (`config/settings_data.json:204-235`): `"current": "Rebel"` is at line `2`, `"Rebel"` preset runs from line `4` to `212`, and the 4 secondary presets (`"Noir"`, `"Vibrant"`, `"Botanical"`, `"Cyber"`) span lines `213–1048`. Candidate D's Stage 1A (immediate non-`settings_data.json` hygiene in `listings/manifest.json:4`, `.shopifyignore:39`, `scripts/package-theme.py:1-15`) and Stage 1B (explicit `AGENTS.md §8` user-confirmation gate before trimming lines `213–1048`) are 100% accurate.
2. **Search Facets & AJAX Tab Re-Binding (`sections/main-search.liquid:46-205`, `assets/collection.js:187-370`, `assets/search.js:26-90` — Cascade 2):**
   - Verified on disk: `snippets/head-stylesheets.liquid:31-33` and `snippets/head-script.liquid:140-141` handle `{%- elsif template contains 'search' -%}`.
   - When executing Wave 2 on `assets/search.js:26-38`, in addition to Candidate D's `if (this.querySelector('facet-filters')) return;` guard inside `handlePagination` (`:86`), also attach a `document.addEventListener('collection:filtered', ...)` listener in `SearchTemplate` so that after `FacetFilters.renderSectionResponse(html)` updates `#CollectionProducts` and `.search-template__tabs`, `SearchTemplate` re-caches `this.tabs` and re-runs `this.activateInitialTab()`.
3. **Rich Product Media & Custom Liquid Block (`blocks/custom_liquid.liquid`, `sections/featured-product.liquid:355-359` — Cascade 3):**
   - Verified on disk (`locales/en.default.schema.json:3851-3858`): `t:sections.custom_liquid.name`, `t:sections.custom_liquid.settings.liquid_code.label`, and `t:sections.custom_liquid.settings.liquid_code.info` already exist in `locales/en.default.schema.json`. Using `"id": "liquid_code"` in `blocks/custom_liquid.liquid` and `{{ block.settings.liquid_code }}` requires zero new schema locale keys and keeps `node runs/e2e/settings-usage.cjs` at `0` unread settings.
   - In `sections/logo-list.liquid:45-48` (Cascade 4 `U-15b`), when removing the `request.design_mode` gate in the marquee loop (`for i in (1..2)`), ensure `{{ block.shopify_attributes }}` is only emitted on the first pass (`{% if i == 1 %}{{ block.shopify_attributes }}{% endif %}`) and keep `{{ 'image' | placeholder_svg_tag: 'placeholder-svg' }}` (or inline brand-mark SVG) so Theme Check `ValidPlaceholder` passes with `0` warnings.
4. **Orphaned Social Placeholder Locale Keys (`config/settings_schema.json:1158-1188` — Cascade 5 `U-07`):**
   - Verified on disk (`scripts/validate-locales.mjs:92-108`): `validate-locales.mjs` checks forward resolution of `"t:..."` references in `.liquid`, `.json`, and `config/settings_schema.json` against `locales/en.default.schema.json` (it does not fail on unreferenced keys in `en.default.schema.json`), so deleting the 6 `"placeholder"` lines at `config/settings_schema.json:1158, 1164, 1170, 1176, 1182, 1188` passes `node scripts/validate-locales.mjs` immediately with `0` errors.

### Controller Disclosure & Label Map
- **Anonymized Candidate Map:** `A = PSolvCand3, B = PSolvCand4, C = PSolvCand1, D = PSolvCand5, E = PSolvCand2` (`Winner: Candidate D = PSolvCand5`).
- **Model-Tier Disclosure:** All 5 read-only candidates ran in one parallel wave on the session `scout` tier and the verifier ran on `kongming`; treat this run as a best-of-5 independent sample pass with rubric selection and controller disk verification.

## Execution & Verification Summary (Waves 1–4 Completed — 2026-10-14)

All 4 implementation waves from the winning `ak:problem-solving --ultra` blueprint have been executed and mechanically verified on disk (`config/settings_data.json` left untouched per `AGENTS.md §8`):

### Executed Waves & Modified/Created Files
- **Wave 1 — Shared Filter/Sort Contract (`U-01` Prerequisite):**
  - Modified `snippets/collection-filter-drawer.liquid`, `snippets/collection-facet-filter.liquid`, `snippets/collection-active-filters.liquid`, `snippets/collection-sort.liquid` (`results | default: collection` + `results.terms` query preservation).
  - Modified `snippets/head-stylesheets.liquid` and `snippets/head-script.liquid` to load `collection.css` and `collection.js` on `template contains 'search'`.
- **Wave 2 — Search Facets (`U-01`) & Unified Product Media (`U-02`, `U-08`):**
  - Created `snippets/product-media-item.liquid` (shared `image`, `external_video`, `video`, `model` renderer with `<product-model>` and `shopify-xr` support).
  - Created `blocks/custom_liquid.liquid` (`type: "liquid"` theme block, automatically available in `main-product` and `featured-product` via `@theme`).
  - Modified `sections/main-search.liquid`, `assets/collection.js`, `assets/search.js` (search facet drawer/bar, zero-result active-filter recovery, guarded pagination handler, URL query `q=`/`type=` preservation).
  - Modified `sections/main-product.liquid`, `sections/featured-product.liquid`, `templates/product.quickview.liquid`, `assets/quickview-modal.js`, `assets/product.js` (`data-media-id` + `.swiper-slide` slide matching across image/video/3D media).
- **Wave 3 — Redundancy Purge & Theme Store Compliance (`U-03`, `U-04`, `U-05a`, `U-05b`, `U-06`, `U-07`, `U-09`, `U-10`, `U-11a`, `U-11b`, `U-13`, `U-14`, `U-15a`, `U-16`, `U-26`, `U-27`, `U-32`):**
  - Modified `sections/hero.liquid` and `sections/page-about.liquid` (removed redundant custom `focal_point*` selects, bound native `image.presentation.focal_point`, bumped countdown default to `2027-12-31T23:59:59`).
  - Modified `sections/image-text-overlay.liquid`, `sections/parallax-image.liquid`, `sections/layered-images.liquid`, `snippets/collection-card.liquid` (valid `placeholder_svg_tag` blank states).
  - Modified `sections/video.liquid` (`video_url` setting supporting YouTube + Vimeo without hardcoded demo URL default).
  - Modified `sections/footer.liquid` (`"default": "footer"`), `sections/header.liquid` (`"default": "main-menu"`), `config/settings_schema.json` (removed 6 social URL `"placeholder"` attributes).
  - Modified `snippets/head-fonts.liquid` (`font_modify` bold/italic/bold_italic for all 3 font settings + `type_subheading_font.system?` preconnect guard).
  - Modified `sections/main-customers-order.liquid` (per-line `line_level_discount_allocations`, strikethrough `original_price`/`original_line_price`, `Subtotal`, `Tax`, and `Total duties` rows).
  - Modified `blocks/buy_buttons.liquid` (moved gift card recipient block inside `{%- form 'product' -%}` with `form.errors` output).
  - Modified `.github/workflows/theme-store-ci.yml` (`actions/upload-artifact@v4` for `dist/rebel-v1.0.0.zip`).
  - Modified `locales/en.default.schema.json` (sentence case, `"and"` instead of `"&"`, `"Carousel"`, `"home page"`, and removed deleted focal-point schema keys).
- **Wave 4 — Packaging, Brand Isolation & Plan Hygiene (`U-04`, `U-24`, `U-25`, `U-28`, `U-30`):**
  - Modified `templates/product.json` and `listings/{rebel,noir,vibrant,botanical,cyber}/templates/product.json` (added `pickup_availability` block).
  - Modified `templates/{index,page.about,page.stores}.json` and `listings/{rebel,noir,vibrant,botanical,cyber}/templates/{index,page.about,page.stores}.json` (replaced `"Devs2 Rebel"` with `"Rebel"` and removed deleted `focal_point_desktop`/`focal_point_mobile` settings).
  - Modified `listings/manifest.json` (`"author": "Devs2"`) and `.shopifyignore` (excluded `listings/manifest.json` from Theme Store ZIP).
  - Modified `plans/260629-0000-release-readiness-stabilization/plan.md`, `plans/260629-2235-shopify-theme-store-readiness/plan.md`, `plans/260918-1640-shopify-theme-store-modernization/plan.md`, `plans/260919-master-pdp-plp-remediation-plan/plan.md` (reconciled frontmatter status and descoped optional B2B `volume_pricing.liquid`).

### Mechanical & AST Verification Results
- `node scripts/validate-locales.mjs`: **PASS** (exit `0`, `33.10 KB < 35 KB`, 100% storefront & schema key parity).
- `node scripts/validate-schema-ranges.mjs`: **PASS** (exit `0`, 67 global + 56 section/block range settings valid across all 5 presets).
- `node runs/e2e/settings-usage.cjs`: **PASS** (exit `0`, `selftest true`, `946 settings, 0 unread`).
- `node --check assets/*.js`: **PASS** (`34/34` JS files valid, `0` errors).
- `JSON.parse` across `config/`, `locales/`, `templates/`, `sections/`, `listings/`: **PASS** (`104/104` JSON files valid, `0` errors) + `86/86` embedded `{% schema %}` JSON blocks valid (`0` errors).
- Exact Liquid statement balance across all `24` modified/created `.liquid` files: **PASS** (`0` unclosed/mismatched tags).
- `python scripts/package-theme.py`: **PASS** (exit `0`, `324` files packaged into `dist/rebel-v1.0.0.zip`, `0.56 MB`, `listings/manifest.json` excluded).

ultra: picked=4/5 margin=high unanimous=yes rejected_all=no
