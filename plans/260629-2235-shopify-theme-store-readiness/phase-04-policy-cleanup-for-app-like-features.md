---
phase: 4
title: "Policy cleanup for app-like features"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4: Policy cleanup for app-like features

## Overview

Reduce Shopify Theme Store review risk from features that can look like app replacements, fake urgency, or broken demo routes.

## Requirements

- Functional: wishlist, compare, back-in-stock, coupon, countdown, recently-viewed, and promotion behavior must have a clear keep/remove/default-off decision.
- Functional: no active UI links to missing pages or unfinished flows.
- Functional: no fake scarcity or misleading discount/coupon messaging ships by default.
- Non-functional: preserve useful theme-native presentation features when they are low-risk and merchant-controlled.
- Non-functional: avoid a broad UX redesign.

## Architecture

Policy-risk features should be isolated behind theme settings or removed from defaults. Anything that stores customer preference locally must not pretend to be account-synced. Anything that implies discounts, inventory pressure, or notifications must be backed by real merchant data or be default-off.

## Related Code Files

- Modify: `sections/header.liquid`
- Modify: `snippets/mobile-menu.liquid`
- Modify: `sections/page-wishlist.liquid`
- Modify: `assets/wishlist.js`
- Modify: `sections/main-collection.liquid`
- Modify: `snippets/collection-sort.liquid`
- Modify: `assets/collection.js`
- Modify: `snippets/coupon-preview.liquid`
- Modify: `snippets/coupon-modal.liquid`
- Modify: `sections/main-product.liquid`
- Modify: `snippets/countdown-banner.liquid`
- Modify: `templates/index.json`
- Modify: `templates/product.json`
- Modify: `templates/collection.json`
- Modify: `locales/en.default.json`
- Modify: `locales/en.default.schema.json`

## Implementation Steps

1. Create a keep/remove/default-off table for each risk feature:
   - wishlist
   - compare
   - back-in-stock
   - coupon
   - countdown
   - recently viewed
   - promotion/session popup
2. Remove compare flow or complete it. Current route points to `/pages/compare` with no verified template; incomplete flow should not ship.
3. Make wishlist default-off unless the user explicitly wants it as a selling point and accepts review risk; if kept, label as browser-local.
4. Make coupon UI render only when configured codes exist; avoid fake expiry text and untranslated `HSD`.
5. Make countdown sections default-off and merchant-date-driven only; remove fake flash-sale defaults from default templates.
6. Convert back-in-stock from app-like promise to simple contact inquiry or default-off block unless backed by real notification system.
7. Remove hardcoded appointment/demo copy from default templates if it is not a generic demo-store story.
8. Re-run stale-reference scans for removed routes/selectors/settings.
9. Update docs/report notes with the final policy posture.

## Success Criteria

- [ ] Every app-like/risk feature has a documented decision.
- [ ] No active route points to missing `/pages/compare` or unfinished flows.
- [ ] Default templates do not show fake discounts, fake urgency, or fake notification promises.
- [ ] Risky features are removed or default-off.
- [ ] `shopify theme check`, stale-reference scan, and preview smoke checks pass.

## Risk Assessment

Risk: removing wishlist/compare can affect visual header/product-card layouts. Mitigation: keep layout guards and test header, collection, product card, quickview, mobile menu.

Risk: default-off features might reduce demo richness. Mitigation: demo store can enable approved content explicitly after policy review.