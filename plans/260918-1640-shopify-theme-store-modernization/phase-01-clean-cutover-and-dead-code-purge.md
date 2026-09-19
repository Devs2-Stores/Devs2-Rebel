---
phase: 1
title: "Clean Cutover & Dead Code Purge"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Clean Cutover & Dead Code Purge

## Overview
Eliminate all policy-violating, broken, or pseudo-app features that cause immediate rejection by the Shopify Theme Store review team. Specifically: confirm clean Wishlist state, purge the dead Product Compare bar and checkboxes (eliminating the 404 risk on `/pages/compare`), and remove the deceptive Coupon Popup Modal and preview components.

## Requirements
- **Wishlist:** Verify zero residual wishlist scripts or localStorage bindings in deployable theme files.
- **Product Compare:** Remove `#CompareBar` from collection templates, remove compare toggle button from sort bar, remove compare checkboxes from product cards, purge `sessionStorage` compare array and event listeners from `assets/collection.js`, and remove `.compare-bar` styles from `assets/collection.css`.
- **Sale Price Invariant:** Preserve all `variant.compare_at_price` logic across `product-card.liquid`, `main-product.liquid`, `cart.liquid`, etc., for sale badges and strikethrough prices.
- **Coupon Modal:** Purge block `'coupon'` from `sections/main-product.liquid`, delete `snippets/coupon-preview.liquid` and `snippets/coupon-modal.liquid`, remove custom elements `CouponPreview` and `CouponModal` from `assets/product.js`, remove coupon styles from `assets/product.css`, and wipe coupon settings from `config/settings_schema.json`.

## Architecture
```
Storefront Collection Page (PLP)
 ├── Remove: #CompareBar (Fixed bottom drawer)
 ├── Remove: .collection-sort__compare (Header toggle)
 ├── Remove: .product-card__compare (Card checkbox)
 └── Preserve: <del class="product-card__price-compare"> (Shopify strikethrough price)

Storefront Product Page (PDP)
 ├── Remove: Block 'coupon' & {% render 'coupon-modal' %}
 ├── Delete: snippets/coupon-preview.liquid & snippets/coupon-modal.liquid
 └── Remove: Custom elements CouponPreview / CouponModal in assets/product.js
```
- Modify: `sections/main-collection.liquid`
- Modify: `snippets/collection-sort.liquid`
- Modify: `snippets/product-card.liquid`
- Modify: `assets/collection.js`
- Modify: `assets/collection.css`
- Modify: `sections/main-product.liquid`
- Modify: `templates/product.json`
- Modify: `assets/product.js`
- Modify: `assets/product.css`
- Modify: `config/settings_schema.json`
- Delete: `snippets/coupon-preview.liquid`
- Delete: `snippets/coupon-modal.liquid`

## Implementation Steps
1. In `sections/main-collection.liquid`, delete lines 463–480 containing `#CompareBar`.
2. In `snippets/collection-sort.liquid`, delete lines 65–70 containing `.collection-sort__compare`.
3. In `snippets/product-card.liquid`, remove lines 63–76 containing `.product-card__compare` while strictly verifying that lines 38–44 and 185–196 (`compare_at_price`) remain untouched.
4. In `assets/collection.js`, remove `compareItems`, `compareMode`, `toggleBtn`, `updateCompareBar`, `clearCompare`, and the change listener for `.product-card__compare-input`.
5. In `assets/collection.css`, remove `.compare-bar` definitions (lines 1099–1169).
6. In `sections/main-product.liquid`, remove the `when 'coupon'` block (lines 269–274), `render 'coupon-modal'` (line 662), and the schema block definition for coupon (lines 856–860).
7. In `templates/product.json`, remove any block entries with `"type": "coupon"` from `sections.main.blocks` and `sections.main.block_order` to prevent Theme Check `UnknownBlockType` errors.
8. Delete `snippets/coupon-preview.liquid` and `snippets/coupon-modal.liquid`.
9. In `assets/product.js`, remove `CouponPreview` and `CouponModal` class definitions and custom element registrations.
10. In `assets/product.css`, remove `.coupon-preview` rules (lines 797–875).
11. In `config/settings_schema.json`, remove the coupon configuration settings block.

## Success Criteria
- [x] No compare toggle or checkbox rendered on `/collections/*` routes.
- [x] No console errors or unresolved custom element warnings on PDP or collection pages.
- [x] Strikethrough sale prices continue rendering correctly when `variant.compare_at_price > variant.price`.
- [x] Statically deleted files `coupon-preview.liquid` and `coupon-modal.liquid` are removed with zero dangling references.
- [x] `shopify theme check` passes without missing snippet or unknown block errors.

## Risk Assessment
- **Risk:** Conflating `variant.compare_at_price` with the compare bar feature and accidentally breaking sale price displays.
  - *Mitigation:* Explicit invariant test: Verify that `compare_at_price` variables on lines 39, 41–43, 186–187, and 193–196 of `product-card.liquid` are preserved verbatim.
- **Risk:** Uncaught JavaScript exception when removed DOM buttons are queried.
  - *Mitigation:* Remove both the HTML elements and their corresponding event attachment logic in JS simultaneously.
