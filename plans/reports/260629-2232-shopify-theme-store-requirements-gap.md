# Shopify Theme Store Requirements Gap

---
created: 2026-06-29 22:32:40 +07:00
scope: Devs2 Shopify theme
status: draft
source: ck:research
---

## Summary

Target assumed: Shopify Theme Store submission. If target is Haravan theme marketplace, this checklist must be redone against Haravan-specific rules.

Theme is technically much closer than the first audit: `shopify theme check` passes with 0 offenses, JSON templates parse, and stale runtime references were not found in quick scans.

Not ready for Theme Store review yet. Main blockers are PDP checkout contract, product recommendations/media requirements, app-like feature risk, performance/accessibility proof, and submission collateral.

## Sources

- Shopify official Theme Store requirements: https://shopify.dev/docs/storefronts/themes/store/requirements

## Verified Local Checks

| Check | Result |
|---|---|
| `shopify theme check` | Pass, 140 files, 0 offenses |
| JS syntax: quickview/search/wishlist | Pass |
| JSON templates | 23 files parse OK, 64 section refs, 0 missing section files |
| App blocks | Present in main product, collection, rich text, and many sections |
| Localization selector | Present in footer with country/language forms |
| Cart dynamic checkout | Present via `content_for_additional_checkout_buttons` |
| Gift card template | Present with balance, code, Apple Wallet |

## Blockers

| # | Area | Evidence | Gap |
|---|---|---|---|
| 1 | Product buy buttons | `sections/main-product.liquid` has custom `type="button"` add/buy buttons; no `form | payment_button` match | Theme Store requires dynamic checkout/accelerated payment support on product forms. Add native product form and optional dynamic checkout button. |
| 2 | Gift card recipient | Gift recipient inputs reference `form="product-form-{{ section.id }}"`, but no matching product form was found | Recipient fields likely do not submit. Need standard Shopify product form integration and error handling. |
| 3 | Product media | PDP handles `product.images` and `external_video`; no detected support for `media_type == 'video'` or `model` | Theme Store expects product media support beyond plain images. Add hosted video and 3D model handling. |
| 4 | Product recommendations | `main-product` related products loop first collection; `complementary-products` uses `recommendations.products` but no recommendations fetch/data URL was found | Use Shopify Product Recommendations API/section rendering for related and complementary products. Current complementary section may render empty. |
| 5 | Product option swatches | Variant picker builds values manually from variants; no `swatch.color`, `swatch.image`, or option value swatch support found | Add Shopify native swatch object support for color/image swatches. |
| 6 | App-like feature risk | Wishlist page/localStorage, compare flow, back-in-stock contact form, coupon copy modal, countdown blocks | These need policy review. Disable/remove risky defaults or document why each is theme-native and not app replacement/fake urgency. Compare page currently routes to `/pages/compare` with no template found. |

## High Priority Gaps

| Area | Status |
|---|---|
| Lighthouse/performance | Not run. Shopify requires performance gate across home/product/collection on mobile and desktop. Need real preview URL and Lighthouse evidence. |
| Accessibility | Theme-check is not enough. Need keyboard/focus, contrast, screen reader labels, modal return-focus checks. |
| Browser support | Not verified across latest Safari/Chrome/Firefox/Edge and mobile browsers. |
| Demo store | Not verified. Theme Store review needs polished demo store(s), real merchant scenarios, and no broken placeholder content. |
| Docs/support | `theme_info` points to `https://docs.devs2.com/rebel` and `https://devs2.com/support`; search returned no results. Must verify live docs/support before submission. |
| Store-specific CDN defaults | `templates/index.json` contains hardcoded `cdn.shopify.com/s/files/1/0697/...` image URLs. Review whether these are acceptable demo defaults; safer path is theme/demo asset strategy without store-specific stale URLs. |
| Git state | Working tree is still dirty with large staged/unstaged changes and generated `.playwright-mcp` files. Must clean/package only intended files. |

## Already In Reasonable Shape

- Theme structure is OS 2.0 style: JSON templates, section groups, sections/snippets/assets.
- Theme info exists in `config/settings_schema.json`.
- Font picker and Shopify `font_modify` are used.
- Color scheme group exists.
- Search handles products/articles/pages.
- Cart supports notes, discounts, taxes included notice, and additional checkout buttons.
- Footer supports language/country selectors.
- `@app` blocks are broadly available.

## Recommended Fix Order

1. Normalize PDP product form: native form, variant id sync, add-to-cart, dynamic checkout, gift card recipient.
2. Add product media support for hosted video and 3D models.
3. Replace related/complementary logic with Shopify recommendations endpoint.
4. Add native swatch object support to variant pickers.
5. Decide Theme Store posture for wishlist, compare, back-in-stock, coupon, countdown. Remove or default-off anything risky.
6. Clean theme package: remove generated files, fix dirty index, review `settings_data.json`, remove store-specific hardcoded CDN defaults if needed.
7. Run real preview QA: Lighthouse, keyboard, responsive, browser/device matrix.
8. Verify docs/support/demo store assets and prepare submission materials.

## Unresolved Questions

- Is the target actually Shopify Theme Store, or Haravan marketplace?
- Are wishlist/compare/back-in-stock intended selling points, or can they be removed/default-off for review?
- Are `docs.devs2.com/rebel` and `devs2.com/support` live and owned by the submitter?
