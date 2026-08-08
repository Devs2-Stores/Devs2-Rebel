---
phase: 1
title: "PDP commerce contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1: PDP commerce contract

## Overview

Convert the product page from custom button orchestration to a Shopify-compliant product form contract while preserving the current UX. This is the highest-priority blocker because dynamic checkout and gift card recipient fields depend on the same form.

## Requirements

- Functional: render one canonical `{% form 'product', product %}` for the main PDP purchase flow.
- Functional: hidden variant id, quantity, gift card recipient properties, add-to-cart, buy-now/dynamic checkout, and contact-state behavior must share the same source of truth.
- Functional: preserve variant selection updates for price, availability, SKU, unit price, stock counter, sticky add, and quickview boundaries.
- Non-functional: keep current AJAX add-to-cart if possible, but do not bypass Shopify native form compatibility.
- Non-functional: do not introduce a second divergent PDP purchase path.

## Architecture

`sections/main-product.liquid` owns form markup. `assets/product.js` should read and update the native form inputs instead of relying only on detached `type="button"` state. Quantity selector and gift-card recipient inputs must use the real form id. Dynamic checkout should use `{{ form | payment_button }}` behind a merchant setting in the `buy_buttons` block.

## Related Code Files

- Modify: `sections/main-product.liquid`
- Modify: `assets/product.js`
- Modify: `snippets/quantity-selector.liquid` only if form binding needs adjustment
- Modify: `snippets/product-sticky-add.liquid` if sticky add needs form id/variant sync
- Modify: `locales/en.default.json`
- Modify: `locales/en.default.schema.json`
- Read: `templates/product.json`
- Read: `sections/featured-product.liquid` for parity decisions

## Implementation Steps

1. Inventory all PDP actions using `data-product-add`, `data-product-buy`, `data-product-variant-id`, `data-product-wishlist`, quantity, sticky add, and gift-card recipient selectors.
2. Wrap the buy-buttons block in one native product form with stable id `product-form-{{ section.id }}`.
3. Add hidden `name="id"` and `name="quantity"` inputs synchronized from variant picker and quantity selector.
4. Render add-to-cart submit button inside the form; keep AJAX interception in `assets/product.js` but allow native fallback when JS fails.
5. Add optional dynamic checkout setting and render `{{ form | payment_button }}` when enabled and product is purchasable.
6. Move gift card recipient inputs into the same form contract and verify required email/state handling.
7. Keep zero-price/contact state intentional: route buy action to contact only when product price contract says contact-only; do not block normal products.
8. Update JS selectors so variant change updates all form ids and disabled states.
9. Test sold-out, available, single variant, multi-variant, zero-price/contact, gift card, quantity, AJAX add, buy-now/dynamic checkout.

## Success Criteria

- [ ] Native PDP product form exists and degrades without JS.
- [ ] Dynamic checkout button renders through Shopify form filter when enabled.
- [ ] Gift card recipient fields submit with the product form.
- [ ] Variant id and quantity stay correct after variant/quantity changes.
- [ ] Add-to-cart, buy-now/contact, sticky add, stock counter, price, SKU, and availability remain correct.
- [ ] `shopify theme check`, `node --check assets/product.js`, and PDP preview checks pass.

## Risk Assessment

Risk: changing form structure can break AJAX cart, sticky add, and quickview. Mitigation: update one canonical form contract first, then adapt JS to it; do not maintain parallel hidden state.

Risk: dynamic checkout styling can clash with current buttons. Mitigation: scope styles under product form and test mobile/desktop.