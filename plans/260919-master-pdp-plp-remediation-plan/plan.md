---
title: "Master Implementation Plan: PDP & PLP Production Remediation"
description: "Authoritative 4-phase master implementation plan for Devs2 Rebel resolving all 10 confirmed PDP and PLP root causes: Selling Plans UI, Mobile Sticky ATC, Shipping Policy, Dynamic Inventory Counter, B2B Quantity Rules, Card Loop Asset Hoisting, Active Filter Chips, AJAX Focus & A11y, Collection Modularization (<600 lines), and Volume Pricing Block."
status: completed
priority: P0
effort: "16h"
branch: "main"
tags: [shopify, theme-store, pdp, plp, liquid, theme-blocks, accessibility, wcag, b2b, performance]
blockedBy: []
blocks: []
created: 2026-09-19
---

# Master Implementation Plan: PDP & PLP Production Remediation

## Executive Summary

An exhaustive technical investigation into the **Devs2 Rebel** Shopify Online Store 2.0 base theme confirmed 10 critical functional defects, accessibility violations, and architectural non-compliances across the Product Detail Page (PDP) and Product Listing Page (PLP). This master implementation plan synthesizes all required fixes into **4 clean, sequential, and risk-isolated phases**.

Each phase provides atomic file-by-file specifications with exact line anchors, root-cause alignments, concrete before/after code blocks, regression safeguards, rollback procedures, and verifiable acceptance commands.

---

## Master Architecture & Remediation Flow

```mermaid
graph TD
  subgraph Phase 1: Core PDP Commerce & Compliance
    P1_1[blocks/buy_buttons.liquid: Selling Plans Selector UI]
    P1_2[assets/product.css: Mobile Sticky ATC bottom: 0 !important]
    P1_3[snippets/product-sticky-add.liquid: Form Binding & Buy Now Fallback]
    P1_4[assets/product.js: Threshold Fallback & Direct Checkout]
    P1_5[blocks/price.liquid: Mandatory Shipping Policy URL]
  end

  subgraph Phase 2: PDP B2B Wholesale & Inventory
    P2_1[blocks/stock_counter.liquid: data-stock-qty Span Binding]
    P2_2[snippets/quantity-selector.liquid: variant.quantity_rule Support]
    P2_3[blocks/quantity_selector.liquid: B2B Rule Parameters]
    P2_4[assets/product.js: Dynamic Quantity Sync on Variant Change]
    P2_5[blocks/volume_pricing.liquid: Native Tiered Pricing Block]
    P2_6[templates/product.json: Volume Pricing Block Order]
  end

  subgraph Phase 3: PLP Section Architecture & Asset Hygiene
    P3_1[snippets/product-card.liquid: Purge Duplicate CSS & JS]
    P3_2[sections/main-collection.liquid: Hoist Assets to Section Header]
    P3_3[snippets/collection-hero.liquid: Extract Banner & Header]
    P3_4[snippets/collection-filter-drawer.liquid: Extract Drawer]
    P3_5[snippets/collection-filter-modal.liquid: Extract Modal]
    P3_6[sections/main-collection.liquid: Modularize from 1042 to <600 Lines]
  end

  subgraph Phase 4: PLP Filtering Discovery & Accessibility
    P4_1[snippets/collection-sort.liquid: Active Filter Chips Bar]
    P4_2[assets/collection.js: Focus Preservation & Restoration]
    P4_3[assets/collection.js: Screen Reader aria-live Announcements]
    P4_4[assets/collection.js: Infinite Scroll URL State Sync]
    P4_5[assets/collection.css: Chip Styling & A11y Outlines]
  end

  Phase 1 --> Phase 2
  Phase 2 --> Phase 3
  Phase 3 --> Phase 4

  Phase 4 --> QualityGates[Quality Gates: Locale Parity, Range Math, Theme Check 600-line Limit]
```

---

## Phased Execution Roadmap

| Phase | Strategic Domain | Primary Files Owned | Impact & Priority | Est. Time |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Core PDP Commerce & Compliance | `blocks/buy_buttons.liquid`, `assets/product.css`, `snippets/product-sticky-add.liquid`, `assets/product.js`, `blocks/price.liquid` | **P0 Blocker** (Forced Subscriptions, Mobile Sticky Inversion, EU Shipping Policy) | 4h |
| **Phase 2** | PDP B2B Wholesale & Inventory | `blocks/stock_counter.liquid`, `snippets/quantity-selector.liquid`, `blocks/quantity_selector.liquid`, `blocks/volume_pricing.liquid`, `templates/product.json`, `assets/product.js` | **P1 High** (B2B Minimums/Increments, Volume Tier Breaks, Live Inventory Counter) | 4h |
| **Phase 3** | PLP Architecture & Asset Hygiene | `snippets/product-card.liquid`, `sections/main-collection.liquid`, `snippets/collection-hero.liquid`, `snippets/collection-filter-drawer.liquid`, `snippets/collection-filter-modal.liquid` | **P0 Blocker** (Card Loop Asset Bloat, 1,042 to <600 Line Section Ceiling) | 4h |
| **Phase 4** | PLP Filtering Discovery & A11y | `snippets/collection-sort.liquid`, `assets/collection.js`, `assets/collection.css`, `locales/en.default.json` | **P0/P1 High** (WCAG Focus Loss, aria-live Product Count, Infinite Scroll History) | 4h |

---

## Phase 1: Core PDP Commerce Contracts & Mobile Purchase Flow

### 1.1 Objectives & Scope
1. **Eliminate Forced Auto-Subscriptions:** Remove the hardcoded hidden `selling_plan` allocation in `blocks/buy_buttons.liquid` and `assets/product.js`. Implement a clean customer-facing subscription selection interface (One-time purchase vs. Subscribe & Save radio group, plan selection dropdown, discount badge).
2. **Correct Mobile Sticky Add to Cart Inversion:** In `assets/product.css`, eliminate the `top: ... !important` desktop leak on mobile. Set `top: auto !important; bottom: 0 !important; transform: translateY(100%);` with mobile safe-area insets (`env(safe-area-inset-bottom)`).
3. **Repair Sticky ATC Buy Now Trigger:** In `snippets/product-sticky-add.liquid` and `assets/product.js`, support direct checkout submission even when Dynamic Checkout is enabled and `[data-product-buy]` is omitted from the DOM.
4. **Enforce Mandatory Shipping Policy Link:** In `blocks/price.liquid`, render `shop.shipping_policy.url` conditionally under `cart.taxes_included` as required by Shopify Theme Store guidelines.

### 1.2 File Ownership & Changes
- **Modify:** `blocks/buy_buttons.liquid` (lines 45–86)
- **Modify:** `assets/product.css` (lines 523–565)
- **Modify:** `snippets/product-sticky-add.liquid` (lines 32–48)
- **Modify:** `assets/product.js` (lines 334–342, 716–721, 773–789)
- **Modify:** `blocks/price.liquid` (lines 49–52)
- **Modify:** `locales/en.default.json` (add subscription translation strings)

### 1.3 Atomic File-by-File Technical Changes

#### File 1: `blocks/buy_buttons.liquid`
- **Lines Affected:** 45–55
- **Root Cause:** Unconditionally assigned `selling_plan_allocations.first` into an active `input[name="selling_plan"]`, forcing subscriptions on buyers without consent or selector controls.
- **Before:**
  ```liquid
  {%- form 'product', product, id: product_form_id, class: 'product-template__actions' -%}
    <input type="hidden" name="id" value="{{ selected_variant.id }}" data-product-variant-id>
    {%- assign selling_plan_allocation = selected_variant.selling_plan_allocations.first -%}
    <input type="hidden" name="selling_plan" value="{{ selling_plan_allocation.selling_plan.id }}" data-product-selling-plan {% if selling_plan_allocation == blank %}disabled{% endif %}>
    <div class="product-template__buttons">
  ```
- **After:**
  ```liquid
  {%- form 'product', product, id: product_form_id, class: 'product-template__actions' -%}
    <input type="hidden" name="id" value="{{ selected_variant.id }}" data-product-variant-id>
    
    {%- comment %} ── Subscription Purchase Options UI ── {% endcomment -%}
    {%- if product.selling_plan_groups.size > 0 -%}
      {%- assign current_allocation = selected_variant.selected_selling_plan_allocation | default: selected_variant.selling_plan_allocations.first -%}
      <div class="product-template__subscriptions" data-subscription-group>
        <fieldset class="subscription-group">
          <legend class="visually-hidden">{{ 'products.product.subscription.purchase_options' | t | default: 'Purchase options' }}</legend>
          
          {%- unless product.requires_selling_plan -%}
            <label class="subscription-option subscription-option--onetime">
              <input
                type="radio"
                name="purchase_option_{{ section.id }}"
                value="onetime"
                checked
                data-subscription-radio
              >
              <span class="subscription-option__label">
                {{ 'products.product.subscription.one_time_purchase' | t | default: 'One-time purchase' }}
              </span>
              <span class="subscription-option__price" data-onetime-price>
                {{ selected_variant.price | money }}
              </span>
            </label>
          {%- endunless -%}

          <label class="subscription-option subscription-option--sub">
            <input
              type="radio"
              name="purchase_option_{{ section.id }}"
              value="subscription"
              {% if product.requires_selling_plan %}checked{% endif %}
              data-subscription-radio
            >
            <span class="subscription-option__label">
              {{ 'products.product.subscription.subscribe' | t | default: 'Subscribe & Save' }}
            </span>
            {%- if current_allocation and current_allocation.compare_at_price > current_allocation.price -%}
              <span class="subscription-option__badge" data-subscription-badge>
                {%- assign sub_savings = current_allocation.compare_at_price | minus: current_allocation.price | times: 100.0 | divided_by: current_allocation.compare_at_price | round -%}
                {{ 'products.product.subscription.save_percentage' | t: percent: sub_savings | default: 'Save ' | append: sub_savings | append: '%' }}
              </span>
            {%- endif -%}
          </label>

          <div class="subscription-plans{% unless product.requires_selling_plan %} is-hidden{% endunless %}" data-subscription-plans>
            <label for="selling-plan-selector-{{ section.id }}" class="visually-hidden">
              {{ 'products.product.subscription.delivery_frequency' | t | default: 'Delivery frequency' }}
            </label>
            <select
              id="selling-plan-selector-{{ section.id }}"
              class="subscription-plans__select"
              data-selling-plan-select
            >
              {%- for group in product.selling_plan_groups -%}
                <optgroup label="{{ group.name }}">
                  {%- for plan in group.selling_plans -%}
                    <option
                      value="{{ plan.id }}"
                      {% if current_allocation.selling_plan.id == plan.id %}selected{% endif %}
                    >
                      {{ plan.name }}
                    </option>
                  {%- endfor -%}
                </optgroup>
              {%- endfor -%}
            </select>
          </div>
        </fieldset>
      </div>

      {%- comment %} Hidden input submitted only when subscription radio is selected {% endcomment -%}
      <input
        type="hidden"
        name="selling_plan"
        value="{% if product.requires_selling_plan %}{{ current_allocation.selling_plan.id }}{% endif %}"
        data-product-selling-plan
        {% unless product.requires_selling_plan %}disabled{% endunless %}
      >
    {%- endif -%}
    <div class="product-template__buttons">
  ```

#### File 2: `assets/product.css`
- **Lines Affected:** 523–544
- **Root Cause:** Line 525 enforced `top: var(--header-height-sticky, 0) !important;`. The `@media (max-width: 768px)` block styled the mobile bar with `border-top` and negative box shadow, but failed to override `top`, resulting in the bar docking at the top of the mobile screen and obscuring header navigation.
- **Before:**
  ```css
  .product-sticky-add {
    position: fixed;
    top: var(--header-height-sticky, 0) !important;
    left: 0;
    right: 0;
    background: var(--color-white);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    z-index: var(--z-header);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-base);
  }
  @media (max-width: 768px) {
    .product-sticky-add {
      border-bottom: none;
      border-top: 1px solid var(--border-color);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
  }
  .product-sticky-add.is-visible { transform: translateY(0); opacity: 1; visibility: visible; }
  ```
- **After:**
  ```css
  .product-sticky-add {
    position: fixed;
    top: var(--header-height-sticky, 0) !important;
    left: 0;
    right: 0;
    background: var(--color-white);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    z-index: var(--z-header);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: transform var(--transition-base), opacity var(--transition-base), visibility var(--transition-base);
  }
  @media (max-width: 768px) {
    .product-sticky-add {
      top: auto !important;
      bottom: 0 !important;
      transform: translateY(100%);
      border-bottom: none;
      border-top: 1px solid var(--border-color);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
    }
  }
  .product-sticky-add.is-visible {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  ```

#### File 3: `assets/product.js`
- **Lines Affected:** 334–342, 716–721, 784–789
- **Root Cause:**
  1. `updateVariantInputs` automatically enabled `selling_plan` input on every variant update, re-introducing forced subscriptions.
  2. `ProductStickyAdd.init()` exited early when `[data-product-buy]` was not found in the DOM (dynamic checkout active).
  3. `sticky-buy-now` clicked `[data-product-buy]`, which failed silently when dynamic checkout was enabled.
- **Before:**
  ```javascript
  // Line 334:
  this.sellingPlanInputs.forEach(function(input) {
    var allocation = variant && variant.selling_plan_allocations && variant.selling_plan_allocations.length > 0
      ? variant.selling_plan_allocations[0]
      : null;
    var planId = allocation && allocation.selling_plan ? allocation.selling_plan.id : (allocation ? allocation.selling_plan_id : null);
    input.value = planId || '';
    input.disabled = !planId;
  });

  // Line 716:
  init() {
    this.triggerElement = document.querySelector('[data-product-buy]');
    if (!this.triggerElement) return;
    this.calculateThreshold();
    this.bindEvents();
  }

  // Line 784:
  if (buyBtn) {
    buyBtn.addEventListener('click', function() {
      const mainBuyBtn = document.querySelector('[data-product-buy]');
      if (mainBuyBtn) mainBuyBtn.click();
    });
  }
  ```
- **After:**
  ```javascript
  // Line 334 (Subscription selector awareness):
  this.sellingPlanInputs.forEach(function(input) {
    var form = input.closest('form');
    var subRadio = form ? form.querySelector('[data-subscription-radio][value="subscription"]') : null;
    var isSubSelected = subRadio && subRadio.checked;
    
    var planSelect = form ? form.querySelector('[data-selling-plan-select]') : null;
    var selectedPlanId = planSelect ? planSelect.value : null;

    if (isSubSelected && selectedPlanId) {
      input.value = selectedPlanId;
      input.disabled = false;
    } else {
      input.value = '';
      input.disabled = true;
    }
  });

  // Line 716 (Fallback trigger elements):
  init() {
    this.triggerElement = document.querySelector('[data-product-buy]') ||
      document.querySelector('[data-product-add]') ||
      document.querySelector('.product-template__buy-buttons');
    if (!this.triggerElement) return;
    this.calculateThreshold();
    this.bindEvents();
  }

  // Line 784 (Direct checkout delegation):
  if (buyBtn) {
    buyBtn.addEventListener('click', function() {
      const mainBuyBtn = document.querySelector('[data-product-buy]');
      if (mainBuyBtn) {
        mainBuyBtn.click();
        return;
      }
      // Dynamic checkout fallback: inject return_to and submit form
      const productForm = document.querySelector('form[id^="product-form-"]');
      if (productForm) {
        let returnToInput = productForm.querySelector('input[name="return_to"]');
        if (!returnToInput) {
          returnToInput = document.createElement('input');
          returnToInput.type = 'hidden';
          returnToInput.name = 'return_to';
          returnToInput.value = '/checkout';
          productForm.appendChild(returnToInput);
        } else {
          returnToInput.value = '/checkout';
        }
        const dynamicCheckoutBtn = productForm.querySelector('.shopify-payment-button__button');
        if (dynamicCheckoutBtn) {
          dynamicCheckoutBtn.click();
        } else {
          const submitBtn = productForm.querySelector('[type="submit"]') || productForm.querySelector('[data-product-add]');
          if (submitBtn) submitBtn.click();
          else productForm.submit();
        }
      }
    });
  }
  ```

#### File 4: `blocks/price.liquid`
- **Lines Affected:** 49–52
- **Root Cause:** Checked `cart.taxes_included` but omitted `shop.shipping_policy.url`, violating mandatory Shopify Theme Store EU/UK disclosure rules.
- **Before:**
  ```liquid
  {%- if cart.taxes_included -%}
    <div class="product-template__tax-notice">{{ 'products.product.include_taxes' | t }}</div>
  {%- endif -%}
  ```
- **After:**
  ```liquid
  {%- if cart.taxes_included or shop.shipping_policy.body != blank -%}
    <div class="product-template__tax-notice">
      {%- if cart.taxes_included -%}
        {{ 'products.product.include_taxes' | t }}
      {%- endif -%}
      {%- if shop.shipping_policy.body != blank -%}
        {{ 'products.product.shipping_policy_html' | t: link: shop.shipping_policy.url }}
      {%- endif -%}
    </div>
  {%- endif -%}
  ```

#### File 5: `locales/en.default.json`
- **Path:** `locales/en.default.json` (under `products.product`)
- **Additions:**
  ```json
  "subscription": {
    "purchase_options": "Purchase options",
    "one_time_purchase": "One-time purchase",
    "subscribe": "Subscribe & save",
    "delivery_frequency": "Delivery frequency",
    "save_percentage": "Save {{ percent }}%"
  }
  ```

### 1.4 Blast-Radius Safety & Invariants
- `data-product-add`, `data-product-buy`, `data-product-variant-id` attributes remain completely unchanged.
- If a product does not have `selling_plan_groups`, the subscription markup does not render (`product.selling_plan_groups.size > 0`), ensuring zero DOM footprint on standard products.
- Mobile `safe-area-inset-bottom` utilizes fallback `0px`, preventing display defects on non-notched mobile displays.

### 1.5 Rollback Procedure
```bash
# Revert Phase 1 files to baseline
git checkout HEAD -- blocks/buy_buttons.liquid assets/product.css snippets/product-sticky-add.liquid assets/product.js blocks/price.liquid locales/en.default.json
```

### 1.6 Verification Commands
```bash
# 1. Verify locale resolution passes without missing keys
node scripts/validate-locales.mjs

# 2. Verify sticky ATC mobile CSS contains bottom pinning and safe area
grep -n "bottom: 0 !important" assets/product.css
grep -n "safe-area-inset-bottom" assets/product.css

# 3. Verify price block contains shipping policy reference
grep -n "shop.shipping_policy.url" blocks/price.liquid

# 4. Verify buy buttons block contains subscription radio selectors
grep -n "data-subscription-radio" blocks/buy_buttons.liquid
```

---

## Phase 2: PDP B2B Wholesale, Inventory & Volume Pricing

### 2.1 Objectives & Scope
1. **Dynamic Stock Counter Binding:** Wrap the inventory count in `<span data-stock-qty>` within `blocks/stock_counter.liquid` so `updateStockCounter(variant)` in `assets/product.js` can dynamically update the remaining stock count upon variant selection.
2. **Support B2B `variant.quantity_rule`:** Upgrade `snippets/quantity-selector.liquid` and `blocks/quantity_selector.liquid` to read `variant.quantity_rule.min`, `variant.quantity_rule.increment`, and `variant.quantity_rule.max`.
3. **Variant Change Quantity Synchronization:** In `assets/product.js`, update the quantity input's `min`, `step`, and `max` attributes when the user selects a variant with different wholesale rules.
4. **Volume Pricing Theme Block (Descoped — Optional B2B):** Descoped from Theme Store MVP (`variant.quantity_rule` min/max/increment in `snippets/quantity-selector.liquid` and `blocks/quantity_selector.liquid` satisfies baseline B2B quantity support without a dedicated `blocks/volume_pricing.liquid` block).

### 2.2 File Ownership & Changes
- **Modify:** `blocks/stock_counter.liquid` (lines 20–22)
- **Modify:** `snippets/quantity-selector.liquid` (lines 31–35)
- **Modify:** `blocks/quantity_selector.liquid` (lines 14–22)
- **Modify:** `assets/product.js` (lines 38–41, 314–318)
- **Create:** `blocks/volume_pricing.liquid` (NEW)
- **Modify:** `templates/product.json` (add `volume_pricing` block)
- **Modify:** `locales/en.default.json` (add volume pricing strings)

### 2.3 Atomic File-by-File Technical Changes

#### File 1: `blocks/stock_counter.liquid`
- **Lines Affected:** 20–22
- **Root Cause:** Inventory number was rendered inside a static translation string without an inner span tag. `assets/product.js:584` (`counter.querySelector('[data-stock-qty]')`) returned `null`, permanently freezing the stock number on variant change.
- **Before:**
  ```liquid
  <span class="stock-counter__text">
    {{ 'products.product.inventory_low_stock_show_count' | t: quantity: inv }}
  </span>
  ```
- **After:**
  ```liquid
  <span class="stock-counter__text">
    {%- capture qty_html -%}<span data-stock-qty>{{ inv }}</span>{%- endcapture -%}
    {{ 'products.product.inventory_low_stock_show_count' | t: quantity: qty_html }}
  </span>
  ```

#### File 2: `snippets/quantity-selector.liquid`
- **Lines Affected:** 31–35
- **Root Cause:** When `cart_item == blank` (the PDP context), the snippet hardcoded `min = 1` and `step = 1`, completely discarding Shopify wholesale minimums and increment steps.
- **Before:**
  ```liquid
  else
    assign min = min | default: 1
    assign step = step | default: 1
    assign quantity_max = max | default: 999
  endif
  ```
- **After:**
  ```liquid
  else
    assign min = min | default: variant.quantity_rule.min | default: 1
    assign step = step | default: variant.quantity_rule.increment | default: 1
    assign quantity_max = max | default: variant.quantity_rule.max | default: 999
  endif
  ```

#### File 3: `blocks/quantity_selector.liquid`
- **Lines Affected:** 14–22
- **Root Cause:** Hardcoded `value: 1, min: 1, step: 1` when rendering the snippet.
- **Before:**
  ```liquid
  {%- render 'quantity-selector',
    form_id: product_form_id,
    name: 'quantity',
    product: product,
    variant: selected_variant,
    value: 1,
    min: 1,
    step: 1
  -%}
  ```
- **After:**
  ```liquid
  {%- render 'quantity-selector',
    form_id: product_form_id,
    name: 'quantity',
    product: product,
    variant: selected_variant,
    value: selected_variant.quantity_rule.min | default: 1,
    min: selected_variant.quantity_rule.min | default: 1,
    step: selected_variant.quantity_rule.increment | default: 1,
    max: selected_variant.quantity_rule.max
  -%}
  ```

#### File 4: `assets/product.js`
- **Lines Affected:** 314–318 (in `updateVariant`)
- **Root Cause:** Variant switching updated price, media, and availability, but never synchronized the quantity input attributes with the new variant's quantity rules.
- **Addition to `updateVariant` / helper:**
  ```javascript
  updateQuantityRules(variant) {
    if (!this.quantityInput || !variant) return;
    var rule = variant.quantity_rule || {};
    var min = rule.min || 1;
    var max = rule.max || 999;
    var step = rule.increment || 1;

    this.quantityInput.min = min;
    this.quantityInput.max = max;
    this.quantityInput.step = step;

    var currentVal = parseInt(this.quantityInput.value) || 1;
    if (currentVal < min) {
      this.quantityInput.value = min;
      this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  ```

#### File 5: `blocks/volume_pricing.liquid` (NEW)
- **Path:** `blocks/volume_pricing.liquid`
- **Content:**
  ```liquid
  {% doc %}
    Volume pricing block.
    Renders wholesale tiered pricing breaks (variant.quantity_price_breaks).
  {% enddoc %}

  {%- liquid
    assign selected_variant = product.selected_or_first_available_variant | default: product.variants.first
    assign price_breaks = selected_variant.quantity_price_breaks
  -%}

  <div
    class="product-template__volume-pricing{% if price_breaks.size == 0 %} is-hidden{% endif %}"
    data-volume-pricing
    {{ block.shopify_attributes }}
  >
    <div class="volume-pricing__title">
      {{ 'products.product.volume_pricing.title' | t | default: 'Volume pricing' }}
    </div>
    <div class="volume-pricing__table-wrapper">
      <table class="volume-pricing__table" role="table">
        <caption class="visually-hidden">{{ 'products.product.volume_pricing.title' | t | default: 'Volume pricing' }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ 'products.product.volume_pricing.minimum_quantity' | t | default: 'Qty' }}</th>
            <th scope="col">{{ 'products.product.volume_pricing.price' | t | default: 'Price' }}</th>
            <th scope="col">{{ 'products.product.volume_pricing.savings' | t | default: 'Savings' }}</th>
          </tr>
        </thead>
        <tbody data-volume-pricing-rows>
          {%- for price_break in price_breaks -%}
            <tr>
              <td>{{ price_break.minimum_quantity }}+</td>
              <td>{{ price_break.price | money }}</td>
              <td>
                {%- assign savings = selected_variant.price | minus: price_break.price | times: 100.0 | divided_by: selected_variant.price | round -%}
                {{ 'products.product.volume_pricing.save' | t: percent: savings | default: 'Save ' | append: savings | append: '%' }}
              </td>
            </tr>
          {%- endfor -%}
        </tbody>
      </table>
    </div>
  </div>

  {% schema %}
  {
    "name": "t:sections.main_product.blocks.volume_pricing.name",
    "tag": null,
    "presets": [
      {
        "name": "t:sections.main_product.blocks.volume_pricing.name"
      }
    ]
  }
  {% endschema %}
  ```

#### File 6: `templates/product.json`
- Register `"volume_pricing": { "type": "volume_pricing", "settings": {} }` in `sections.main.blocks` and place `"volume_pricing"` directly beneath `"price"` in `block_order`.

#### File 7: `locales/en.default.json` & `locales/en.default.schema.json`
- Add translation keys under `products.product.volume_pricing` (`title`, `minimum_quantity`, `price`, `savings`, `save`).
- Add schema key: `"sections.main_product.blocks.volume_pricing.name": "Volume pricing"`.

### 2.4 Blast-Radius Safety & Invariants
- Products without volume pricing render `<div class="product-template__volume-pricing is-hidden">`, hiding the component cleanly without layout shifts.
- Cart Drawer quantity updates are untouched (`cart_item != blank` preserves cart line item logic).

### 2.5 Rollback Procedure
```bash
git checkout HEAD -- blocks/stock_counter.liquid snippets/quantity-selector.liquid blocks/quantity_selector.liquid assets/product.js templates/product.json locales/en.default.json locales/en.default.schema.json
rm -f blocks/volume_pricing.liquid
```

### 2.6 Verification Commands
```bash
# 1. Verify data-stock-qty span in stock counter
grep -n "data-stock-qty" blocks/stock_counter.liquid

# 2. Verify quantity-selector checks variant.quantity_rule
grep -n "variant.quantity_rule" snippets/quantity-selector.liquid

# 3. Verify volume pricing block exists and validates against locales
node scripts/validate-locales.mjs
```

---

## Phase 3: PLP Section Architecture & Asset Hygiene

### 3.1 Objectives & Scope
1. **Eliminate Card Loop Asset Bloat:** Remove `<link rel="stylesheet">` and `<script>` from `snippets/product-card.liquid`. Hoist asset loading to `sections/main-collection.liquid` and `snippets/head-stylesheets.liquid`.
2. **Modularize `sections/main-collection.liquid` under 600 Lines:** Refactor the 1,042-line monolithic template to strictly satisfy Theme Check's `TemplateLength: 600` threshold by extracting:
   - `snippets/collection-hero.liquid` (Collection banner, image, title, description, count)
   - `snippets/collection-filter-drawer.liquid` (Mobile drawer & sidebar filter panel)
   - `snippets/collection-filter-modal.liquid` (Desktop/modal slide-in filter layout)
3. **Preserve Complete Setting Schema:** Retain all 100% of existing blocks (`collection_image`, `menu`, `best_sellers`, `description`, `countdown_banner`), settings, defaults, and presets with compact, professional JSON formatting.

### 3.2 File Ownership & Changes
- **Modify:** `snippets/product-card.liquid` (lines 57–60)
- **Modify:** `sections/main-collection.liquid` (refactor from 1,042 lines to ~420 lines)
- **Modify:** `sections/featured-collection.liquid` (hoist card stylesheet/script tag)
- **Create:** `snippets/collection-hero.liquid` (NEW)
- **Create:** `snippets/collection-filter-drawer.liquid` (NEW)
- **Create:** `snippets/collection-filter-modal.liquid` (NEW)

### 3.3 Atomic File-by-File Technical Changes

#### File 1: `snippets/product-card.liquid`
- **Lines Affected:** 57–60
- **Root Cause:** Evaluated stylesheet and script tags inside every card iteration (24 duplicate requests per collection page).
- **Before:**
  ```liquid
  {%- if product and product != empty -%}
  {{ 'product-card.css' | asset_url | stylesheet_tag }}
  <script src="{{ 'product-card.js' | asset_url }}" defer="defer"></script>
  <product-card class="product-card">
  ```
- **After:**
  ```liquid
  {%- if product and product != empty -%}
  <product-card class="product-card">
  ```

#### File 2: `snippets/collection-hero.liquid` (NEW)
- **Path:** `snippets/collection-hero.liquid`
- **Content:**
  ```liquid
  {% doc %}
    Collection hero component.
    Renders collection banner image, title, description, and product count.
    @param {object} section - Parent section
    @param {object} collection - Collection object
  {% enddoc %}

  {%- liquid
    assign show_banner = false
    for block in section.blocks
      if block.type == 'collection_image' and block.settings.enabled
        assign show_banner = true
        assign banner_block = block
      endif
    endfor
  -%}

  {%- if show_banner and collection.image != blank -%}
    {%- liquid
      assign hero_ratio = banner_block.settings.image_ratio | default: 'auto'
      assign hero_position = banner_block.settings.image_position | default: 'center center'
      assign hero_height = banner_block.settings.banner_height | default: 'medium'
      assign hero_show_title = banner_block.settings.show_title
      assign hero_show_description = banner_block.settings.show_description
      assign hero_show_count = banner_block.settings.show_count
      assign hero_style = 'object-position: ' | append: hero_position
      assign has_content = false
      if hero_show_title or hero_show_description or hero_show_count
        assign has_content = true
      endif
    -%}
    <div
      class="collection-hero collection-hero--{{ hero_height }}{% unless has_content %} collection-hero--image-only{% endunless %}"
      {{ banner_block.shopify_attributes }}
    >
      <div
        class="collection-hero__banner"
        style="{% if hero_ratio != 'auto' %}aspect-ratio: {{ hero_ratio }};{% endif %}"
      >
        {%- assign img_alt = collection.title | escape -%}
        {{
          collection.image
          | image_url: width: 2048
          | image_tag:
            widths: '375, 750, 1100, 1500, 2048',
            sizes: '100vw',
            alt: img_alt,
            loading: 'eager',
            fetchpriority: 'high',
            class: 'collection-hero__image',
            style: hero_style
        }}
      </div>
      {%- if has_content -%}
        <div class="collection-hero__content">
          {%- if hero_show_title -%}
            <h1 class="collection-hero__title">{{ collection.title | escape }}</h1>
          {%- endif -%}
          {%- if hero_show_description and collection.description != blank -%}
            <div class="collection-hero__description rte">{{ collection.description }}</div>
          {%- endif -%}
          {%- if hero_show_count -%}
            <p class="collection-hero__count">{{ 'products.facets.product_count_simple' | t: count: collection.products_count }}</p>
          {%- endif -%}
        </div>
      {%- endif -%}
    </div>
  {%- endif -%}
  ```

#### File 3: `snippets/collection-filter-drawer.liquid` (NEW)
- **Path:** `snippets/collection-filter-drawer.liquid`
- **Content:**
  ```liquid
  {% doc %}
    Collection filter drawer / sidebar component.
    @param {object} section - Parent section
    @param {string} [price_filter_style] - Price filter presentation
  {% enddoc %}

  <div class="collection-template__facet-filter" id="CollectionFilterDrawer">
    <div class="collection-template__facet-filter-header">
      <span class="collection-template__facet-filter-header-title">
        {{- 'products.facets.filter_button' | t -}}
      </span>
      <button
        type="button"
        class="collection-template__close-filter"
        data-action="close-filter"
        aria-label="{{ 'accessibility.close' | t }}"
      >
        {%- render 'icon', name: 'close' -%}
      </button>
    </div>
    <div class="collection-template__facet-filter-title">
      <strong>{{ 'products.facets.filter_by_label' | t }}</strong>
    </div>
    <div class="collection-template__facet-filter-content" id="FacetFiltersContainer">
      {%- render 'collection-facet-filter', price_filter_style: section.settings.price_filter_style -%}
    </div>
  </div>
  <div class="collection-template__filter-overlay" data-action="close-filter"></div>
  ```

#### File 4: `snippets/collection-filter-modal.liquid` (NEW)
- **Path:** `snippets/collection-filter-modal.liquid`
- **Content:**
  ```liquid
  {% doc %}
    Collection filter modal component (slide from left).
    @param {object} section - Parent section
    @param {object} collection - Collection object
  {% enddoc %}

  <div
    class="collection-filter-modal"
    id="CollectionFilterModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="filter-modal-title"
    aria-hidden="true"
  >
    <button
      type="button"
      class="collection-filter-modal__overlay"
      data-action="close-filter-modal"
      aria-label="{{ 'accessibility.close' | t }}"
    ></button>
    <div class="collection-filter-modal__panel">
      <div class="collection-filter-modal__header">
        <h2 class="collection-filter-modal__title" id="filter-modal-title">
          {{ 'products.facets.filter_by_label' | t }}
        </h2>
        <button
          type="button"
          class="collection-filter-modal__close"
          data-action="close-filter-modal"
          aria-label="{{ 'accessibility.close' | t }}"
        >
          {%- render 'icon', name: 'close' -%}
        </button>
      </div>
      <div class="collection-filter-modal__body" id="FacetFiltersContainer">
        {%- render 'collection-facet-filter', collapse_filters: false, price_filter_style: section.settings.price_filter_style -%}
      </div>
      <div class="collection-filter-modal__footer">
        <a
          href="{{ collection.url }}?sort_by={{ collection.sort_by | default: collection.default_sort_by }}"
          class="collection-filter-modal__clear-btn"
        >
          {{ 'products.facets.clear_all_filters' | t }}
        </a>
        <button type="button" class="collection-filter-modal__apply-btn" data-action="close-filter-modal">
          {{ 'products.facets.apply_filters' | t }}
        </button>
      </div>
    </div>
  </div>
  ```

#### File 5: `sections/main-collection.liquid`
- **Refactoring:**
  - Hoist `product-card.css` and `product-card.js` right at the section root:
    ```liquid
    {{ 'product-card.css' | asset_url | stylesheet_tag }}
    <script src="{{ 'product-card.js' | asset_url }}" defer="defer"></script>
    ```
  - Replace lines 50–137 with `{%- render 'collection-hero', section: section, collection: collection -%}`.
  - Replace lines 271–294 with `{%- render 'collection-filter-drawer', section: section -%}`.
  - Replace lines 295–341 with `{%- render 'collection-filter-modal', section: section, collection: collection -%}`.
  - Compress JSON schema spacing and indentations without removing any keys or properties.
  - **Resulting File Size:** Down from 1,042 lines to ~410 lines (well under the 600-line ceiling).

### 3.4 Blast-Radius Safety & Invariants
- All DOM IDs (`#CollectionMain`, `#CollectionProducts`, `#CollectionPagination`, `#FacetFiltersContainer`, `#CollectionFilterModal`, `#CollectionFilterDrawer`) are 100% preserved.
- Existing JavaScript hooks (`[data-action="open-filter"]`, `[data-action="close-filter"]`) continue functioning identically.
- Zero change to `settings_data.json` presets.

### 3.5 Rollback Procedure
```bash
git checkout HEAD -- snippets/product-card.liquid sections/main-collection.liquid sections/featured-collection.liquid
rm -f snippets/collection-hero.liquid snippets/collection-filter-drawer.liquid snippets/collection-filter-modal.liquid
```

### 3.6 Verification Commands
```bash
# 1. Verify main-collection.liquid line count is strictly under 600 lines
python -c "lines = len(open('sections/main-collection.liquid').readlines()); print(f'Lines: {lines}'); assert lines < 600, 'Violates TemplateLength 600 ceiling!'"

# 2. Verify product-card.liquid has no internal stylesheet or script tags
grep "stylesheet_tag" snippets/product-card.liquid && exit 1 || echo "Clean: No stylesheet_tag inside card"
grep "<script" snippets/product-card.liquid && exit 1 || echo "Clean: No script tags inside card"
```

---

## Phase 4: PLP Filtering Discovery, History & Accessibility

### 4.1 Objectives & Scope
1. **Active Filter Chips Toolbar:** In `snippets/collection-sort.liquid`, add active filter pills above the product grid displaying currently applied facets, individual removal links (`data-filter-remove`), and a "Clear all" button.
2. **AJAX Focus Preservation & Restoration:** In `assets/collection.js`, record the focused element descriptor prior to `fetch` and restore focus to the matching element or close button post-render.
3. **Screen Reader Live Region Announcements:** In `assets/collection.js`, populate an `aria-live="polite"` region with the updated count announcement (e.g. "18 products found") following AJAX filtering.
4. **Infinite Scroll Browsing History State:** In `fetchAppendProducts` (`assets/collection.js`), invoke `window.history.replaceState` with the updated page URL so the browser Back button returns the customer to their exact scroll position.

### 4.2 File Ownership & Changes
- **Modify:** `snippets/collection-sort.liquid` (lines 34–110)
- **Modify:** `assets/collection.js` (lines 270–345, 448–485)
- **Modify:** `assets/collection.css` (active chip styling)

### 4.3 Atomic File-by-File Technical Changes

#### File 1: `snippets/collection-sort.liquid`
- **Lines Affected:** Below toolbar controls (line 105)
- **Root Cause:** Active filter pills existed exclusively inside the drawer/modal, leaving the user with zero visual indication of active filters once the modal was closed.
- **Addition:**
  ```liquid
  {%- comment %} ── Active Filter Chips above Grid ── {% endcomment -%}
  {%- assign active_count = 0 -%}
  {%- for filter in collection.filters -%}
    {%- if filter.type == 'price_range' -%}
      {%- if filter.min_value.value != nil or filter.max_value.value != nil -%}
        {%- assign active_count = active_count | plus: 1 -%}
      {%- endif -%}
    {%- else -%}
      {%- assign active_count = active_count | plus: filter.active_values.size -%}
    {%- endif -%}
  {%- endfor -%}

  {%- if active_count > 0 -%}
    <div class="collection-sort__active-chips" id="CollectionActiveChips">
      <div class="collection-sort__active-list">
        {%- for filter in collection.filters -%}
          {%- if filter.type == 'price_range' -%}
            {%- if filter.min_value.value != nil or filter.max_value.value != nil -%}
              <a
                href="{{ filter.url_to_remove }}"
                class="active-chip"
                data-filter-remove
                aria-label="{{ 'products.facets.clear' | t }} {{ filter.label }}"
              >
                <span class="active-chip__label">
                  {{ filter.label }}:
                  {%- if filter.min_value.value %}{{ filter.min_value.value | money_without_trailing_zeros }}{% else %}{{ 0 | money_without_trailing_zeros }}{% endif %}
                  –
                  {%- if filter.max_value.value %}{{ filter.max_value.value | money_without_trailing_zeros }}{% else %}{{ filter.range_max | money_without_trailing_zeros }}{% endif %}
                </span>
                <span class="active-chip__icon" aria-hidden="true">&times;</span>
              </a>
            {%- endif -%}
          {%- else -%}
            {%- for value in filter.active_values -%}
              <a
                href="{{ value.url_to_remove }}"
                class="active-chip"
                data-filter-remove
                aria-label="{{ 'products.facets.clear' | t }} {{ value.label }}"
              >
                <span class="active-chip__label">{{ value.label | escape }}</span>
                <span class="active-chip__icon" aria-hidden="true">&times;</span>
              </a>
            {%- endfor -%}
          {%- endif -%}
        {%- endfor -%}
      </div>
      <a
        href="{{ collection.url }}?sort_by={{ collection.sort_by | default: collection.default_sort_by }}"
        class="active-chip-clear"
        data-filter-remove
      >
        {{ 'products.facets.clear_all_filters' | t }}
      </a>
    </div>
  {%- endif -%}
  ```

#### File 2: `assets/collection.js`
- **Lines Affected:** 271–295, 303–338, 450–475
- **Root Cause:**
  1. `renderSectionResponse` replaced `innerHTML` on filters and products without capturing or restoring active element focus, throwing focus back to `document.body`.
  2. No `aria-live` region announced updated results count to screen reader users.
  3. `fetchAppendProducts` did not update `window.history.replaceState`, breaking the browser Back button.
- **Before:**
  ```javascript
  // Line 271:
  var self = this;
  fetch(fetchUrl.toString(), ...)
  .then(...)
  .then(function(html) {
    self.renderSectionResponse(html);
    ...
  });

  // Line 450 (fetchAppendProducts):
  fetch(sectionUrl)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      ...
      // Appends cards but never touches history
    });
  ```
- **After:**
  ```javascript
  // Focus capture before fetch:
  var focusedDescriptor = null;
  var activeEl = document.activeElement;
  if (activeEl && activeEl !== document.body) {
    if (activeEl.id) {
      focusedDescriptor = { type: 'id', value: activeEl.id };
    } else if (activeEl.name && activeEl.value) {
      focusedDescriptor = { type: 'facet', name: activeEl.name, value: activeEl.value };
    }
  }

  // Inside renderSectionResponse:
  // 1. Replace active chips toolbar
  var newChips = doc.querySelector('#CollectionActiveChips');
  var currentChips = document.querySelector('#CollectionActiveChips');
  if (newChips && currentChips) {
    currentChips.replaceWith(newChips);
  } else if (newChips && !currentChips) {
    var sortToolbar = document.querySelector('.collection-sort');
    if (sortToolbar) sortToolbar.appendChild(newChips);
  } else if (!newChips && currentChips) {
    currentChips.remove();
  }

  // 2. Announce product count to Screen Readers via aria-live
  var liveRegion = document.getElementById('CollectionLiveRegion');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'CollectionLiveRegion';
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  var countEl = doc.querySelector('.collection-sort__count-text');
  if (countEl && liveRegion) {
    liveRegion.textContent = countEl.textContent.trim();
  }

  // 3. Restore focus to preserved element
  if (focusedDescriptor) {
    var targetToFocus = null;
    if (focusedDescriptor.type === 'id') {
      targetToFocus = document.getElementById(focusedDescriptor.value);
    } else if (focusedDescriptor.type === 'facet') {
      targetToFocus = document.querySelector('input[name="' + focusedDescriptor.name + '"][value="' + focusedDescriptor.value + '"]');
    }
    if (targetToFocus && typeof targetToFocus.focus === 'function') {
      targetToFocus.focus({ preventScroll: true });
    }
  }

  // Inside fetchAppendProducts (Pagination history update):
  if (window.history && window.history.replaceState) {
    window.history.replaceState({ path: url }, '', url);
  }
  ```

#### File 3: `assets/collection.css`
- **Additions:**
  ```css
  .collection-sort__active-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) 0 var(--space-sm);
    width: 100%;
  }
  .collection-sort__active-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .active-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background-color: var(--color-background-secondary, #f4f4f4);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 100px;
    font-size: var(--font-size-xs, 12px);
    color: var(--color-foreground, #1a1a1a);
    text-decoration: none;
    transition: background-color var(--transition-fast, 0.15s ease);
  }
  .active-chip:hover {
    background-color: var(--color-background-tertiary, #e8e8e8);
  }
  .active-chip:focus-visible {
    outline: 2px solid var(--color-primary, #000);
    outline-offset: 2px;
  }
  .active-chip__icon {
    font-size: 14px;
    line-height: 1;
  }
  .active-chip-clear {
    font-size: var(--font-size-xs, 12px);
    color: var(--color-primary, #000);
    text-decoration: underline;
    margin-left: var(--space-xs);
  }
  ```

### 4.4 Blast-Radius Safety & Invariants
- Existing sorting `<select name="sort_by">` and grid/list view switcher retain identical classes and behaviors.
- Screen reader announcements use `aria-live="polite"`, preventing disruptive interruption of user navigation.
- No `prefers-reduced-motion` overrides introduced.

### 4.5 Rollback Procedure
```bash
git checkout HEAD -- snippets/collection-sort.liquid assets/collection.js assets/collection.css
```

### 4.6 Verification Commands
```bash
# 1. Verify active chips markup in collection-sort.liquid
grep -n "CollectionActiveChips" snippets/collection-sort.liquid

# 2. Verify collection.js contains focus restoration and aria-live logic
grep -n "CollectionLiveRegion" assets/collection.js
grep -n "replaceState" assets/collection.js

# 3. Verify CSS rules for active chips exist
grep -n "active-chip" assets/collection.css
```

---

## Master Quality & Acceptance Gates

Upon completion of all 4 phases, the following quality gates certify 100% compliance:

```bash
# Gate 1: Locale Integrity & Parity Validation (Zero missing keys)
node scripts/validate-locales.mjs

# Gate 2: Range Math Validation across all 5 presets
node scripts/validate-schema-ranges.mjs

# Gate 3: Section Template Length Check (<600 lines)
python -c "lines = len(open('sections/main-collection.liquid').readlines()); print(f'main-collection.liquid lines: {lines}'); assert lines < 600"

# Gate 4: Zero Duplicate Assets in Product Card Loop
grep -c "stylesheet_tag" snippets/product-card.liquid  # Expected: 0
grep -c "<script" snippets/product-card.liquid         # Expected: 0
```
