---
phase: 2
title: "Commerce Contracts & PDP Form Handling"
status: pending
priority: P1
effort: "6h"
dependencies: ["phase-01-clean-cutover-and-dead-code-purge.md"]
---

# Phase 2: Commerce Contracts & PDP Form Handling

## Overview
Restore the integrity of core commerce flows on the Product Detail Page (PDP). Replace synthetic JSON add-to-cart payloads with native `FormData(this.form)`, re-enabling support for Gift Card recipient scheduling (`properties[Recipient email]`), Subscription selling plans (`selling_plan`), and third-party app block line item properties. Upgrade the quantity selector to support both PDP and Cart contexts, and deploy a client-side recommendations fetcher.

## Requirements
- **Native FormData Submission:** `assets/product.js` must submit `new FormData(this.form)` to `themeConfig.routes.cart_add_url` via `POST` with `X-Requested-With: XMLHttpRequest`.
- **Form Association:** Ensure all detached controls (quantity selector, variant radios, gift card recipient inputs) explicitly declare `form="product-form-{{ section.id }}"` so they are included in `FormData`.
- **Gift Card Recipient Properties:** Ensure `properties[__shopify_send_gift_card_to_recipient]`, `properties[Recipient email]`, `properties[Recipient name]`, `properties[Message]`, and `properties[Send on]` are submitted when recipient toggle is active, and disabled when inactive (to avoid email format validation rejection).
- **Subscription Selling Plans:** Support `<input type="hidden" name="selling_plan">` or radio selection when selling plan allocations exist on a variant.
- **Polymorphic Quantity Selector:** Upgrade `snippets/quantity-selector.liquid` to accept `name | default: 'quantity'`, allowing Cart Drawer to pass `name="updates[]"` and PDP to pass `name="quantity"`.
- **Complementary Recommendations Fetcher:** Deploy `assets/product-recommendations.js` implementing `<product-recommendations>` custom element with an `IntersectionObserver` trigger on `sections/complementary-products.liquid`.

## Architecture
```
PDP DOM Form (<form id="product-form-{{ section.id }}" action="/cart/add">)
 ├── Hidden Input: name="id" (Synced with currentVariant.id)
 ├── Quantity Selector: name="quantity" (Linked via form attribute)
 ├── Recipient Details: properties[...] (Enabled only when checkbox active)
 └── Selling Plan: name="selling_plan" (If subscription product)
       │
       ▼ (Event: submit / click Add to Cart)
assets/product.js -> new FormData(form)
 ├── Append: sections='main-cart-items,cart-modal' (Bundled Section Rendering)
 └── Fetch: POST /cart/add.js
       │
       ▼ (Response: Cart Object + Rendered HTML Sections)
Dispatch: 'cart:item_added' & 'cart:updated' -> Open Cart Drawer
```

## Related Code Files
- Modify: `snippets/quantity-selector.liquid`
- Modify: `sections/main-product.liquid`
- Modify: `assets/product.js`
- Create: `assets/product-recommendations.js`
- Modify: `sections/complementary-products.liquid`

## Implementation Steps
1. In `snippets/quantity-selector.liquid`:
   - Declare `{%- assign input_name = name | default: 'quantity' -%}`.
   - Set `name="{{ input_name }}"` on the number input.
   - Support optional `form_id` parameter: `{% if form_id %}form="{{ form_id }}"{% endif %}`.
2. In `sections/main-product.liquid` (and future `blocks/buy_buttons.liquid`):
   - Derive `product_form_id` autonomously: `{%- assign product_form_id = 'product-form-' | append: section.id -%}` to avoid variable scope loss across block boundaries.
   - Set Add to Cart button to `type="submit"` and `name="add"` with `id="product-template__add"` for HTML5 progressive enhancement and keyboard submission compliance.
   - Pass `form_id: product_form_id` and `name: 'quantity'` when rendering `quantity-selector`.
   - Ensure the gift card recipient disclosure inputs declare `form="{{ product_form_id }}"` and are disabled by default until the checkbox is checked.
3. In `assets/product.js`:
   - Rewrite `handleAddToCart(e)` and `handleBuyNow(e)` to resolve the active `<form>` element.
   - Run HTML5 constraint validation (`if (!form.checkValidity()) { form.reportValidity(); return; }`).
   - Construct `const formData = new FormData(form)`.
   - Append Section Rendering headers: `formData.append('sections', 'main-cart-items,cart-modal')`.
   - Send `fetch(themeConfig.routes.cart_add_url, { method: 'POST', body: formData })`.
   - On success, dispatch `cart:item_added` and `cart:updated` events and trigger drawer opening.
   - Add `GiftCardRecipient` controller to enable/disable fields when disclosure toggles.
4. In `assets/product-recommendations.js`:
   - Create and register `ProductRecommendations` custom element extending `HTMLElement`.
   - Attach `IntersectionObserver` with `rootMargin: '0px 0px 200px 0px'`.
   - When intersecting, fetch `data-url` and insert returned product cards.
5. In `sections/complementary-products.liquid`:
   - Enclose output in `<product-recommendations data-url="{{ routes.product_recommendations_url }}?section_id={{ section.id }}&product_id={{ product.id }}&limit={{ section.settings.product_limit }}&intent=complementary">`.
   - Include `<script src="{{ 'product-recommendations.js' | asset_url }}" defer="defer"></script>`.

## Success Criteria
- [ ] Submitting PDP form sends `multipart/form-data` with `id`, `quantity`, and any active `properties[...]`.
- [ ] Gift Card recipient information correctly appears in Cart and Checkout when toggled on.
- [ ] Leaving recipient email blank when gift toggle is active blocks submission with a browser validation tooltip.
- [ ] Quantity selector inside Cart Drawer retains `name="updates[]"` or `updates[variant_id]` without regression.
- [ ] Complementary products load lazily on scroll without blocking initial page render.

## Risk Assessment
- **Risk:** Form controls placed outside the `<form>` tag not picked up by `FormData`.
  - *Mitigation:* Ensure `form="{{ product_form_id }}"` attribute is injected on all detached inputs.
- **Risk:** Blank recipient fields triggering Shopify checkout validation error.
  - *Mitigation:* Explicitly set `disabled` on recipient fields until checkbox is ticked.
