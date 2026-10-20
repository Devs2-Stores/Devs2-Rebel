# Code review (--pending --ultra) - Devs2 Rebel - 2026-10-10

Scope: uncommitted working tree on `main` (HEAD `d4a44dd`). It covers 49 modified files plus the untracked code files `snippets/collection-active-filters.liquid`, `snippets/collection-filter-drawer.liquid`, and `snippets/collection-hero.liquid`.
Mode: Stage 1 spec compliance ran once, in the controller. Stage 2 quality review ran as five independent read-only reviewers. A single kongming verifier produced the union. The controller then spot-checked the verifier's work against the live code and `http://127.0.0.1:9292` (the user's `shopify theme dev`).
This review does not authorize edits. No files changed except this report.

Verdict: **REQUEST_CHANGES**.

## Stage 1 - spec compliance (`plans/260919-master-pdp-plp-remediation-plan/plan.md`)

| Requirement | Status | Evidence |
|---|---|---|
| Selling-plan UI | PRESENT, defective (F-01, F-03) | `blocks/buy_buttons.liquid:47-90`, `assets/product.js:337-347` |
| Shipping-policy link | PRESENT | `blocks/price.liquid` (`taxes_included_and_shipping_policy_html`) |
| Mobile sticky ATC / buy now | UNVERIFIED | `snippets/product-sticky-add.liquid` is unchanged; `assets/product.css:574-578` changed (F-14) |
| Dynamic stock counter | PRESENT, defective (F-02, F-18) | `blocks/stock_counter.liquid:19-23`, `assets/product.js:589-609` |
| B2B `quantity_rule` | PRESENT, defective (F-05) | `blocks/quantity_selector.liquid`, `snippets/quantity-selector.liquid`, `assets/product.js:614-629` |
| Volume pricing block | MISSING | `blocks/volume_pricing.liquid` absent |
| Hoist card assets out of the loop | PRESENT, latent gap (F-04) | removed from `snippets/product-card.liquid` |
| `main-collection` under 600 lines | MISSING | 898 lines |
| Hero, drawer, and active-filters snippets | PRESENT | untracked snippets listed above |
| Filter modal snippet | MISSING | `snippets/collection-filter-modal.liquid` absent |
| Chips, aria-live count, focus restore, URL state | PRESENT, defective (F-06, F-11, F-12, F-13) | `assets/collection.js` |

The plan status is `in-progress`, so the three MISSING items are unfinished phases rather than regressions.

## Findings (Stage 2, validated union after controller corrections)

| ID | Severity | Origin | path:line | Finding | Trigger / evidence | Fix direction | Sources |
|---|---|---|---|---|---|---|---|
| F-01 | High | WIP | `blocks/buy_buttons.liquid:50-90` | The one-time radio is always rendered and `checked`. The `selling_plan` select renders `disabled`. There is no `product.requires_selling_plan` branch. | A subscription-only product submits no `selling_plan`, so cart/checkout rejects it. Code-level only: the dev store has no product with selling-plan groups (live `selling_plan_groups 0`). | Wrap the one-time option in `unless product.requires_selling_plan`, default to subscription, and enable the select. | A B C D E |
| F-02 | High | WIP | `blocks/stock_counter.liquid:19-23` | The locale key has no `_html` suffix, so the injected `<span data-stock-qty>` is escaped. | Live PDP `/products/rebel-tactical-bomber-jacket` renders `Only &lt;span data-stock-qty&gt;25&lt;/span&gt; left - order soon!` | Rename to `inventory_low_stock_show_count_html` in all consumers and `locales/en.default.json:275`, or keep the `<span>` outside `t`. | A D |
| F-03 | Medium | WIP | `assets/product.js:337-347` | A variant change overwrites the shopper's chosen plan with `variant.selling_plan_allocations[0]`. | `input.value = planId \|\| '';` runs on every variant change. | Keep the current select value when the new variant still allocates it, and fall back to the first allocation only when it does not. | B E |
| F-04 | Medium | WIP | `sections/main-product.liquid:133`, `sections/product-card-ajax.liquid:7-8` | After the hoist, `main-product` renders `product-viewed` (cards injected via `?section_id=product-card-ajax`) without loading `product-card.css`/`.js`. | Today this works only because `complementary-products` and `product-recommendations` load the assets in every shipped `product.json` (root plus 5 listings). If a merchant removes both sections, recently-viewed cards lose styling and behaviour. | Load both assets in `main-product.liquid` or `snippets/product-viewed.liquid`. | B D |
| F-05 | Medium | WIP | `assets/product.js:614-629` | `updateQuantityRules` clamps to min/max but never aligns to `increment`. It also does not update the `QuantitySelector` instance. | Trigger: variant A has rule 1/1 and qty 3, then the shopper switches to variant B with rule min 2/step 2. The value `3` gives `stepMismatch`, or the cart API rejects it. Only B2B catalogs carry quantity rules. | Set `min + Math.round((cur - min) / step) * step`, clamp the result, and sync the selector instance. | A D E |
| F-06 | High | WIP | `assets/collection.js:384-388` | Focus restore is broken in two ways. (1) Checkbox and chip activations lose focus to `body`: their nodes are destroyed by `currentFilters.innerHTML` (`:321`) and `currentActive.innerHTML` (`:330`). (2) The sort select is not replaced (`:343-349` updates only the count text), so `closest('.collection-sort')` matches and focus jumps to the first product. | WCAG 2.4.3 | Record the active control (id/name/value) before the swap, refocus its replacement afterwards, and never jump to the grid. | A B C D E |
| F-07 | High | HEAD (relocated by WIP) | `snippets/collection-filter-drawer.liquid:6-30` | The sidebar drawer `#CollectionFilterDrawer` has no `role="dialog"`, `aria-modal`, or name. It has no focus trap and does not close on Escape. | HEAD `sections/main-collection.liquid` had the same markup; only the modal layout carried `role="dialog"`. Live E2E `plp-filter-375` fails "focus moves into filter panel", "panel exposes dialog semantics", and "Escape closes filter panel". | Add the dialog semantics, `ThemeUtils.trapFocus` on open, Escape to close, and focus return to the opener. | A B C D E |
| F-08 | High | HEAD | `assets/product.js:490-498`, `:535-539` | Add to cart and Buy now `fetch(cart_add_url)` send no `Accept: application/json`. | Live probe (`plans/reports/test-e2e-261010-storefront/journeys/cart-add-accept-probe.json`): theme headers give `opaqueredirect` status 0. With `Accept: application/json` the response is 200 `application/json`. The toast shows a raw JSON parse error. | Add `'Accept': 'application/json'` in both handlers. | C D E |
| F-09 | Medium | WIP | `blocks/buy_buttons.liquid:76-86` | The literal English `% off` is hardcoded, and every price adjustment is assumed to be a percentage. | `({{ plan.price_adjustments.first.value }}% off)` | Move the string to a locale key and branch on `value_type` (`percentage`, `fixed_amount`, `price`). | A B C D E |
| F-11 | Medium | WIP | `assets/collection.js:510-513` | Load-more and infinite scroll call `history.replaceState(..., url)` with the next-page URL. | A reload restores page N only, and pages 1..N-1 disappear. | Keep the base URL for append pagination, or persist the loaded pages. | D E |
| F-12 | Medium | WIP | `assets/collection.js:514-517` | The live-region text is hardcoded English. | `'Loaded ' + newItems.length + ' more products'` | Source it from `themeConfig.strings` or a `data-` template backed by a locale key. | A B C D E |
| F-13 | Medium | WIP | `snippets/collection-active-filters.liquid:26-40` | The chip accessible name is only the value label ("In stock"). The remove action is not announced because `×` is `aria-hidden`. | WCAG 2.4.4 / 4.1.2 | Add `aria-label` from a locale key such as "Remove filter: {label}". | C D |
| F-14 | Medium | WIP | `assets/product.css:574-578` | The sticky ATC uses a desktop-first `@media (max-width: 768px)` rule with `top: auto !important; bottom: 0 !important`. | Violates the project rules on mobile-first CSS and on `!important`. | Make mobile-bottom the default, use `@media (min-width: 769px)` for desktop, and remove `!important`. | C |
| F-15 | Medium | HEAD | `sections/logo-list.liquid:52-56`, `:76-78` | `\| default:` inside the `image_tag` arguments ends the `image_tag` call. The `class:` argument is then passed to `default`, so the logo loses `section-logo-list__logo`. The fallback alt `'Brand logo'` is also hardcoded English. | Liquid filter-argument grammar. | Assign the alt first (`assign logo_alt = ... \| default: shop.name`), then pass `alt: logo_alt`. | B C D E |
| F-16 | Medium | HEAD | `sections/marquee-products.liquid:48` | The duplicated marquee list is `aria-hidden="true"` but contains focusable links and buttons. | Live axe `aria-hidden-focus` reports `.section-marquee-products__list[aria-hidden="true"]`. | Add `inert` to the duplicate. | B C D E |
| F-17 | Medium | HEAD | `assets/product-card.css:30-33` | The Quick view and Add buttons are revealed only on `:hover`. | Live E2E `quickview-1440` fails "quick view button reachable by keyboard when card has focus". | Add `.product-card__wrapper:focus-within` and `:focus-visible` reveal states. | B C D E |
| F-18 | Medium | HEAD | `assets/product.js:589-609` | `updateStockCounter` reads `variant.inventory_quantity`, which `product \| json` does not serialize. The counter therefore hides on every variant change. | Live variant JSON keys contain no `inventory_quantity`. | Emit a per-variant inventory map from Liquid, or re-render the block through the Section Rendering API. | B C |
| F-20 | Low | WIP | `snippets/collection-filter-drawer.liquid:64-68` | The drawer footer Clear-all link has no `data-filter-remove`. The AJAX handler binds only that attribute (`assets/collection.js:245`), so the link does a full page reload. | Code-level. | Add `data-filter-remove`. | A |
| F-21 | Low | HEAD | `snippets/quantity-selector.liquid` (`quantity_max` assign) | When no rule or inventory cap applies, `max` falls back to a fabricated `999`. | `max \| default: variant.quantity_rule.max \| default: 999` (`default: 999` exists in HEAD) | Emit `max` only when a real bound exists. | B |
| F-22 | Low | WIP | `assets/product.css:966-971` | The unbranded dynamic-checkout button hardcodes `color: var(--color-white)` on `var(--color-primary)`, bypassing color-scheme button tokens. | New rule (absent in HEAD). | Use the scheme button and button-label tokens. | B |
| F-23 | Low | WIP | `assets/collection.css:588-605` | The active-filter chip hover uses hardcoded hex values (`#fee2e2`, `#fca5a5`, `#ef4444`). | New rule at line 590 (HEAD already had `#fee2e2` at line 555). | Use the scheme tokens. | B |
| F-25 | Low | HEAD | `assets/product-card.css:176-184` | `.product-card__price-compare { opacity: 0.55 }` reaches only 3.26:1. | Live axe `color-contrast` on `del`: `#878683` on `#f5f2ed`. | Use an opacity of at least 0.7, or a gray token that passes 4.5:1. | B C D E |

Totals: 22 findings (High 5, Medium 12, Low 5). Of these, 14 are WIP and 8 are HEAD.

## Controller corrections (the verifier is advisory)

| Item | Verifier said | Correction | Evidence |
|---|---|---|---|
| F-10 `newsletter-modal.js:12` reads `dataset.delay` in the constructor | Medium; "delay always 5 s" | **Dropped** | The script is `defer` (`snippets/newsletter-modal.liquid:3`), so the element is upgraded after parsing, when its attributes already exist. The recorded live smoke with `data-delay="1"` showed the modal hidden at 600 ms and open at 1300 ms (`plans/reports/enhance-ux-ax-261009-2342-storefront.md`, round 1). |
| F-19 Twitter trailing slash produces an empty handle | Low | **Dropped** | The stored value is `https://x.com/devs2rebel` (no slash). Liquid `split` drops trailing empty fields in any case. Live `twitter:site` was `@devs2rebel`. |
| F-24 Clear-all on `/collections/all` produces a bare query string | Low | **Dropped** | Live `/collections/all?filter.v.availability=1` renders `href="/collections/all?sort_by=title-ascending"`. |
| F-03 | High; "`product \| json` does not serialize `selling_plan_allocations`" | Premise false; Medium | Live variant JSON keys include `requires_selling_plan`, `selling_plan_allocations`, and `quantity_rule`. The real defect is that the user's selected plan is overwritten. |
| F-04 | High; "cards lose CSS/JS" | Latent; Medium | The live PDP loads `product-card.css` and `product-card.js` twice each. All six `product.json` templates include both loader sections. |
| F-05 | High | Medium | Quantity rules exist only in B2B catalogs. |
| F-07 | Origin WIP | Origin HEAD (relocated) | The same drawer markup, without dialog semantics, is in HEAD `sections/main-collection.liquid`. |
| F-21 | Origin WIP | Origin HEAD | `default: 999` is present in HEAD. |

## Verified-OK

- Per-scheme token derivation (`snippets/head-color-schemes.liquid`, `snippets/head-design-systems.liquid`). `--color-border-rgb` consumers in `sections/custom-liquid.liquid` and `sections/spacer-divider.liquid` no longer nest `rgb(rgb(...))`.
- The TOC uses the `color-{{ settings.toc_color_scheme }}` class instead of inline static properties. The live TOC passed 4/4 journeys at 1440 and 375 px.
- The mobile footer accordion uses `<button aria-expanded aria-controls>` below 768 px, and lists stay open at desktop width. Live `footer-375` passed 5/5.
- New locale keys resolve. `node scripts/validate-locales.mjs` and `node scripts/validate-schema-ranges.mjs` both exit 0. The JSON templates and locales parse.
- The collection hero image is `loading: 'eager'` and `fetchpriority: 'high'`.

## Unresolved

- Theme Check was not run. It needs separate approval for `shopify theme check`.
- F-01 and F-03 cannot be reproduced live: the dev store has no product with selling-plan groups. F-05 needs a B2B catalog.
- The three MISSING plan items remain open: the volume pricing block, `main-collection` modularization, and the filter modal snippet.

## Candidate ranking and label map

| Label | Candidate | Correctness | Severity | Coverage | Evidence | Total /80 |
|---|---|---|---|---|---|---|
| D | ReviewCand2 | 19 | 19 | 19 | 20 | 77 |
| E | ReviewCand3 | 18 | 18 | 18 | 18 | 72 |
| B | ReviewCand1 | 17 | 18 | 16 | 18 | 69 |
| A | ReviewCand4 | 19 | 18 | 12 | 19 | 68 |
| C | ReviewCand5 | 16 | 17 | 15 | 17 | 65 |

The verifier merged the "filter checkbox focus yanking" finding (C, D, E) into F-06. It is not reproducible for checkboxes because their nodes are destroyed before the focus check runs.

ultra: union=25/26 single_candidate_only=8 (verifier); controller final=22 (3 refuted), single_candidate_only kept=5
