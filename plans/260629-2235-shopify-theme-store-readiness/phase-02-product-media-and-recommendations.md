---
phase: 2
title: "Product media and recommendations"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Product media and recommendations

## Overview

Add complete Shopify product media support and replace related/complementary product guessing with Shopify recommendations contracts.

## Requirements

- Functional: PDP media gallery supports `image`, `video`, `external_video`, and `model` media types.
- Functional: thumbnails, lightbox, media slider, variant-media switching, and reduced-motion behavior remain stable.
- Functional: related and complementary products use Shopify recommendations/section rendering, not first collection fallback.
- Non-functional: media embeds must be lazy where safe, accessible, and not regress LCP for first image.
- Non-functional: recommendations must fail empty, not render broken sections.

## Architecture

`sections/main-product.liquid` renders all product media by iterating `product.media`, not `product.images` plus a second external-video loop. Recommendation sections should use `routes.product_recommendations_url` or `/recommendations/products` with `product_id`, `section_id`, and intent where applicable. JS owns fetching/updating rendered sections only; Liquid owns fallback/empty states.

## Related Code Files

- Modify: `sections/main-product.liquid`
- Modify: `assets/product.js`
- Modify: `assets/product.css`
- Modify: `sections/complementary-products.liquid`
- Create or modify: `sections/product-recommendations.liquid` if current related block cannot be made compliant
- Modify: `templates/product.json`
- Modify: `locales/en.default.json`
- Modify: `locales/en.default.schema.json`
- Read: `snippets/product-card.liquid`

## Implementation Steps

1. Replace the PDP gallery render loop with `product.media` case handling.
2. Render images with `image_url | image_tag` or equivalent width/height attributes.
3. Render hosted videos with Shopify `video_tag` or accessible video markup.
4. Render external videos with existing iframe behavior, but add titles and consistent preview thumbnails.
5. Render 3D models with model viewer support and poster/AR controls per Shopify conventions.
6. Update thumbnail markup to mirror every media item.
7. Update product JS so media slider/lightbox/variant media selection targets media ids, not only image filenames.
8. Convert related products to a recommendations section or async fetch using Shopify recommendations URL.
9. Fix `sections/complementary-products.liquid` so it fetches recommendations or uses a configured product list explicitly; do not rely on `recommendations.performed` unless the section is loaded by the recommendations endpoint.
10. Test products with image-only, hosted video, external video, 3D model, and mixed media.

## Success Criteria

- [ ] PDP renders all Shopify media types with accessible controls.
- [ ] Variant media switching still works.
- [ ] First media remains LCP-friendly; non-first media is lazy/deferred.
- [ ] Related products use Shopify recommendation data or render clean empty state.
- [ ] Complementary products no longer render empty because `recommendations.performed` was never triggered.
- [ ] Product page preview passes desktop/mobile with no console errors.

## Risk Assessment

Risk: media gallery refactor can break LCP and slider state. Mitigation: preserve first-media eager loading and test mixed-media products.

Risk: recommendations endpoint can be unavailable in local static checks. Mitigation: add clean empty fallback and validate in Shopify preview.