---
phase: 3
title: "Theme Blocks & Modern Liquid Architecture"
status: pending
priority: P1
effort: "8h"
dependencies: ["phase-02-commerce-contracts-and-pdp-form.md"]
---

# Phase 3: Theme Blocks & Modern Liquid Architecture

## Overview
Modularize the massive monolithic `sections/main-product.liquid` (1,090 lines) by migrating its sub-components into standalone Theme Blocks under `/blocks/*.liquid` (each containing its own `{% schema %}`). Introduce native nested blocks (up to 8 levels) for tabs and accordions using `{% content_for 'blocks' %}`, integrate `<shopify-account>` Web Component into desktop and mobile navigation, and upgrade variant selection to native Category Swatches API and Combined Listings (2,000 variants).

## Requirements
- **Theme Blocks Migration:** Extract product sub-components into `blocks/`:
  - `blocks/buy_buttons.liquid`
  - `blocks/variant_picker.liquid`
  - `blocks/price.liquid`
  - `blocks/title.liquid`
  - `blocks/description.liquid`
  - `blocks/rating.liquid`
  - `blocks/tabs.liquid` & `blocks/tab.liquid` (nested blocks architecture)
- **Template Length Reduction:** Reduce `sections/main-product.liquid` from 1,090 lines down to ~275 lines, passing the Theme Check 600-line limit.
- **LiquidDoc Contracts:** Annotate reusable blocks and snippets with `{% doc %}` tags for type safety and theme validation.
- **`<shopify-account>` Web Component:** Integrate `<shopify-account>` into `sections/header.liquid` and `snippets/mobile-menu.liquid` with fallback for stores with classic customer accounts.
- **Category Swatches & Combined Listings:** Upgrade variant picker from manual string checks (`"mau-sac"`) to `product.options_with_values`, rendering `value.swatch.color`, `value.swatch.image`, and `value.product_url`.

## Architecture
```
sections/main-product.liquid (~275 lines)
 ├── Media Gallery (Sticky/Slider)
 └── Product Information Column
       └── {% content_for 'blocks' %}
             ├── blocks/title.liquid
             ├── blocks/price.liquid
             ├── blocks/variant_picker.liquid (Swatches + Combined Listings)
             ├── blocks/buy_buttons.liquid (Native FormData ATC)
             └── blocks/tabs.liquid (Parent Block)
                   └── {% content_for 'blocks' %}
                         ├── blocks/tab.liquid (Description)
                         ├── blocks/tab.liquid (Specifications)
                         └── blocks/tab.liquid (Custom Liquid)
```

## Related Code Files
- Create: `blocks/buy_buttons.liquid`
- Create: `blocks/variant_picker.liquid`
- Create: `blocks/price.liquid`
- Create: `blocks/title.liquid`
- Create: `blocks/description.liquid`
- Create: `blocks/rating.liquid`
- Create: `blocks/stock_counter.liquid`
- Create: `blocks/share.liquid`
- Create: `blocks/pickup_availability.liquid`
- Create: `blocks/tabs.liquid`
- Create: `blocks/tab.liquid`
- Modify: `sections/main-product.liquid`
- Modify: `snippets/product-variant-picker.liquid`
- Modify: `assets/variant-picker.js`
- Modify: `sections/header.liquid`
- Modify: `snippets/mobile-menu.liquid`
- Modify: `templates/product.json`

## Implementation Steps
1. Create `blocks/` directory in theme root if not already present.
2. Extract the Buy Buttons block into `blocks/buy_buttons.liquid` with its own `{% schema %}`, including settings for dynamic checkout buttons and gift card recipient toggles.
3. Extract the Variant Picker into `blocks/variant_picker.liquid`. Update the Liquid template to iterate over `product.options_with_values`:
   - Inspect `value.swatch.color` and `value.swatch.image`.
   - Render `value.product_url` anchors for Combined Listings child items.
4. Extract Tabs into `blocks/tabs.liquid` with `{% content_for 'blocks' %}` to allow merchants to nest arbitrary `tab` blocks up to 8 levels deep.
5. Create `blocks/tab.liquid` with individual title, content, page picker, and icon settings.
6. Refactor `sections/main-product.liquid`:
   - Replace the large `{%- for block in section.blocks -%}{%- case block.type -%}` switch statement with `{% content_for 'blocks' %}`.
   - Retain static wrappers and data attributes for JS selectors (`[data-product-price]`, `[data-product-sale]`).
   - Clean section schema to focus only on section-level settings (layout, desktop media width, color scheme).
7. In `sections/header.liquid` and `snippets/mobile-menu.liquid`:
   - Wrap account icons with `<shopify-account menu="{{ section.settings.customer_account_menu }}">` when `shop.customer_accounts_enabled` is true.
   - Provide `<span slot="signed-out-avatar" class="header__icon-account">` containing the user icon for standard visual continuity.
   - Provide fallback anchor link to `routes.account_login_url` / `routes.account_url` for stores on Classic Customer Accounts.
8. Update `templates/product.json` to map to the new block types and nested blocks structure.

## Success Criteria
- [ ] `sections/main-product.liquid` contains fewer than 400 lines of code.
- [ ] Merchants can add, remove, and reorder blocks freely in the Theme Customizer.
- [ ] Nested tabs can be added and reordered without breaking tab navigation.
- [ ] Swatches automatically display Admin-configured colors or images without hardcoded translation slugs.
- [ ] `<shopify-account>` renders properly on both desktop header and mobile drawer.
- [ ] `shopify theme check` passes with 0 block schema errors.

## Risk Assessment
- **Risk:** Existing custom CSS or JS targeting section block IDs (`#block-{{ block.id }}`) failing after migration.
  - *Mitigation:* Preserve all existing BEM classes and `{{ block.shopify_attributes }}` on each block wrapper.
- **Risk:** Template JSON divergence if merchant data references legacy block IDs.
  - *Mitigation:* Update `templates/product.json` with a backward-compatible mapping of block types.
