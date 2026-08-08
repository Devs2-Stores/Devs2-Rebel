---
phase: 3
title: "Variant swatches and app blocks"
status: pending
priority: P1
dependencies: [1]
---

# Phase 3: Variant swatches and app blocks

## Overview

Bring variant pickers and app-block support closer to current Shopify Theme Store expectations without rewriting the product architecture.

## Requirements

- Functional: variant picker supports Shopify native swatch objects when available.
- Functional: current color-image fallback, unavailable/cross-out behavior, and dropdown mode continue to work.
- Functional: app blocks remain available in main product, featured product/rich text where relevant, and flexible content sections.
- Non-functional: no duplicated picker logic between PDP and quickview beyond necessary markup differences.
- Non-functional: preserve accessibility names, keyboard operation, and form synchronization from Phase 1.

## Architecture

Variant markup should prefer `product.options_with_values` and option values so swatches can use `value.swatch.color` or `value.swatch.image` when Shopify provides them. Current manual variant-value mapping becomes fallback only. JS still resolves selected variant from product JSON and updates Phase 1 form inputs.

## Related Code Files

- Modify: `snippets/product-variant-picker.liquid`
- Modify: `snippets/product-variant-dropdown.liquid`
- Modify: `snippets/quickview-variant-picker.liquid`
- Modify: `assets/variant-picker.js`
- Modify: `assets/quickview-variant-picker.js`
- Modify: `assets/variant-picker.css`
- Modify: `assets/quickview-modal.css`
- Modify: `sections/featured-product.liquid` if it lacks app block or swatch parity
- Read: `sections/main-product.liquid`
- Read: `templates/product.quickview.liquid`

## Implementation Steps

1. Inventory PDP, quickview, and featured product variant picker markup.
2. Switch Liquid value source to `product.options_with_values` where safe.
3. Render native swatch image/color when `value.swatch` exists.
4. Keep current `product-variant-picker-image` fallback for legacy color options without native swatch data.
5. Ensure radio inputs and labels have unique stable ids across PDP/quickview.
6. Update JS selected-value and unavailable-state logic to work with option value objects and fallback strings.
7. Confirm app block support in core product/content surfaces; add only where Theme Store review expects it and existing layout can support it.
8. Test swatch color, swatch image, plain text option, dropdown, unavailable values, quickview rapid open, and no-JS form fallback.

## Success Criteria

- [ ] Native color/image swatches render when Shopify data exists.
- [ ] Text options and legacy color image fallback still work.
- [ ] Variant selection updates product form id from Phase 1.
- [ ] Quickview and PDP picker behavior match for availability and selected state.
- [ ] App blocks remain renderable in required surfaces.
- [ ] Keyboard/focus behavior passes sampled accessibility checks.

## Risk Assessment

Risk: `options_with_values` changes data shape and can break existing JS. Mitigation: keep product JSON as variant resolver and add compatibility tests for string values.

Risk: adding app blocks everywhere can clutter merchant editor. Mitigation: only add where requirements or clear merchant value exists.