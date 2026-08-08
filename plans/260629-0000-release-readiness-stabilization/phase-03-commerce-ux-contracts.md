---
phase: 3
title: "Commerce UX contracts"
status: pending
priority: P1
dependencies: [2]
---

# Phase 3: Commerce UX contracts

## Overview

Make the main commerce interactions coherent after blocker fixes: quickview entrypoints, variant/media initialization, search modal fallback behavior, cart/wishlist interaction boundaries, and contactable UX states.

## Requirements

- Functional: quickview should have one canonical markup/data contract across product cards, search results, and any quickview template/section.
- Functional: variant picker, media gallery, price, availability, add-to-cart, and wishlist controls must initialize exactly once for the rendered quickview product.
- Functional: optional contact/social settings must not create empty focusable or visual elements.
- Non-functional: reduce duplicate logic only where it prevents drift in active commerce flows.
- Non-functional: do not rewrite product-card/cart/search architecture unless the existing contract cannot be made safe.

## Architecture

The theme currently uses shared global utilities (`ThemeUtils`), `window.themeConfig`, custom elements, snippets, and route-loaded scripts. Phase 2 stabilizes critical failures; this phase removes contract ambiguity so later changes do not reintroduce stale-product/search/contact regressions.

Canonical direction:

- Product cards trigger quickview using one product handle/source of truth.
- Quickview modal fetches/render HTML and product JSON through one lifecycle.
- Variant/media code reads from one data shape and selector set.
- Search modal either renders predictive results or an explicit fallback state.
- Optional settings snippets own their empty-state behavior so callers do not duplicate checks.

## Related Code Files

- Modify: `assets/quickview-modal.js`
- Modify: `assets/quickview-variant-picker.js`
- Modify: `templates/product.quickview.liquid` if retained
- Modify: `sections/main-search-quickview.liquid` if retained
- Modify: `snippets/product-card.liquid` only if trigger contract needs adjustment
- Modify: `assets/search-modal.js`
- Modify: `sections/page-contact.liquid`
- Modify: `snippets/shop-social.liquid`
- Read: `snippets/quickview-modal.liquid` or `sections/*quickview*` if present during implementation
- Read: `snippets/cart-modal.liquid`, `assets/cart-modal.js`, `assets/wishlist*.js` for interaction boundaries only if quickview touches those controls
- Create: no new public entrypoint expected
- Delete: duplicate quickview entrypoint only if Phase 1/2 proves it is unused or accidental

## Implementation Steps

1. Inventory all quickview entrypoints.
   - Product-card action attributes/selectors.
   - Search result quickview markup.
   - `templates/product.quickview.liquid` if kept.
   - `sections/main-search-quickview.liquid` if kept.
2. Choose the canonical quickview render source.
   - Validation decision: stabilize first; do not attempt full consolidation in Phase 2.
   - Phase 3 may align entrypoints and selectors where needed, but broad markup/variant consolidation should remain follow-up unless required to prevent drift.
3. Align selector names and custom element expectations.
   - `quickview-variant-picker` vs `product-variant-picker` must not diverge accidentally.
   - Modal code should query the actual rendered component names.
4. Remove or isolate duplicated variant/media logic.
   - Keep one owner for variant selection and product data updates.
   - Modal orchestration should not duplicate the variant picker's internal state transitions unless necessary.
5. Harden search modal fallback UX.
   - Verify the fallback result container exists before updating.
   - Provide empty/error copy through theme strings where possible.
6. Move contact/social empty-state ownership closer to the snippet/section that renders the markup.
   - `page-contact` should guard optional rows before rendering cards/links.
   - `shop-social` should not emit an empty `<ul>` when no social URLs exist, unless a caller explicitly requests an empty wrapper.
7. Run focused manual checks for quickview/search/contact before moving to merchant-settings cleanup.

## Success Criteria

- [ ] Quickview has a documented single render/data contract in the phase notes or code-adjacent documentation if needed.
- [ ] All active quickview entrypoints use compatible selectors and data shapes.
- [ ] Variant picker updates price/availability/media for quickview products after rapid modal open/close cycles.
- [ ] Search modal fallback does not break when predictive search URL/view is unavailable.
- [ ] Empty contact settings do not render visible empty cards or empty `tel:`/`mailto:` targets.
- [ ] `shop-social` no longer forces callers to duplicate social-link availability checks for basic empty-state handling.
- [ ] No broad cart/wishlist rewrite is introduced.

## Risk Assessment

Risk: consolidating quickview can accidentally remove a context-specific behavior. Mitigation: inventory every entrypoint first and preserve required attributes/selectors before deleting duplicates.

Risk: snippet empty-state changes can affect footer/contact layouts. Mitigation: check every caller of `shop-social` and keep wrapper behavior opt-in if a layout depends on it.
