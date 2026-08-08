---
title: "Phase 2 Release Blockers"
created: 2026-06-29
phase: 2
status: completed
---

# Phase 2 Release Blockers

## Summary

Phase 2 fixed the release blockers identified in the audit and validation pass. `shopify theme check` now has 0 errors. Two warnings remain and are deferred because they are not release-blocking under this phase's acceptance criteria.

## Changes Made

### Image dimension blockers

- `sections/banner-hotspots.liquid`
  - Added intrinsic dimensions to raw `custom_image_url` image path while keeping URL compatibility.
- `sections/image-text-overlay.liquid`
  - Added intrinsic dimensions to raw desktop and mobile custom URL image paths while keeping URL compatibility.

### Quickview request/data contract blockers

- `assets/quickview-modal.js`
  - Replaced `isLoading` early-return behavior with `loadRequestId` latest-request-wins guard.
  - Clears modal content and local product/variant state at load start.
  - Initializes and assigns `themeConfig.quickview.data` on successful product JSON parse.
  - Clears `themeConfig.quickview.data` at load start, failure, and immediately on close.
  - Replaces stale content with an error state on current-request failure.
  - Expands selector support to `quickview-variant-picker`, `quickview-variant-picker-item`, and `quickview-variant-picker-image`.

### Search fallback blocker

- `assets/search-modal.js`
  - Removed dependency on deleted `view=smart` fallback.
  - When predictive search is unavailable, renders a safe link to the standard search results page.
  - Added per-request `searchRequestId` + local `AbortController` guard so stale requests cannot render results or clear a newer controller.

### BFL/newsletter workflow blocker

- `.github/workflows/generate-newsletter-image.yml`
  - Disabled generation workflow for this release-readiness pass.
  - Removed checkout/Python/dependency/install/generator/commit/push behavior.
  - Workflow no longer invokes the deleted generator script.

### Theme-check config drift

- `.theme-check.yml`
  - Removed stale `RemoteAsset` ignore for deleted `sections/main-search-smart.liquid`.

### Hotspot unsafe/demo fallback correction

- `sections/banner-hotspots.liquid`
  - Removed hardcoded snowboard fallback handles/products.
  - Product hydration now only runs when merchant data provides a product handle.
  - Replaced unsafe product tooltip string-concatenated HTML with DOM construction and `textContent` for dynamic title/price.

## Validation

| Check | Result |
|---|---|
| `node --check assets/quickview-modal.js` | Pass |
| `node --check assets/search-modal.js` | Pass |
| Workflow YAML parse | Pass |
| Runtime scan for `view=smart`, `main-search-smart`, `tools/generate_newsletter_image.py` in runtime JS/YML/Liquid | Pass |
| `shopify theme check` | Pass with 0 errors, 2 warnings |

Remaining warnings:

- `sections/main-blog.liquid:460` — `HardcodedRoutes`, use `routes.all_products_collection_url` instead of `/collections/all`.
- `snippets/product-card-special.liquid:1` — `OrphanedSnippet`.

## Review/Test Gate

- Tester result: PASS for theme-check errors, JS syntax, workflow YAML, and deleted reference scans.
- Code reviewer result: initial DONE_WITH_CONCERNS; follow-up fixed the remaining immediate-close stale `themeConfig.quickview.data` concern.

## Follow-up into Phase 3

- Quickview still needs contract inventory and entrypoint alignment as planned in Phase 3.
- Contact/social empty-state and deeper duplicate logic cleanup remain Phase 3 scope.
- Shopify preview remains a blocking Phase 5 gate.
