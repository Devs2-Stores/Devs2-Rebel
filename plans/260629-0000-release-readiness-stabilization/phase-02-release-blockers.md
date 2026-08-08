---
phase: 2
title: Release blockers
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Release blockers

## Overview

Fix the defects that directly block or endanger a release: `theme check` errors, broken CI workflow, deleted search fallback, and quickview stale/wrong-product behavior.

## Requirements

- Functional: `shopify theme check` must reach 0 errors.
- Functional: quickview must not show or act on stale product data after rapid opens, failed fetches, or initialization errors.
- Functional: search modal fallback must not request a deleted `view=smart` response.
- Functional: BFL/newsletter workflow must no longer call a missing script.
- Non-functional: preserve existing merchant-facing behavior unless the audit identified it as broken.
- Non-functional: prefer small targeted fixes over broad rewrites.

## Architecture

This phase touches high-blast-radius storefront paths loaded globally or across commerce routes:

- Image rendering in active Liquid sections must satisfy Shopify/theme-check accessibility and layout requirements.
- Quickview should have one clear request lifecycle: latest open wins, failed load clears/replaces stale content, fetched product JSON is stored where variant/UI code expects it.
- Search modal fallback should either use an active Shopify predictive/search endpoint contract or degrade with a safe empty/error state.
- CI workflow should match the repository: for this validated plan, disable or remove the BFL/newsletter workflow instead of restoring the deleted generator script.

## Related Code Files

- Modify: `sections/banner-hotspots.liquid`
- Modify: `sections/image-text-overlay.liquid`
- Modify: `assets/quickview-modal.js`
- Modify: `assets/search-modal.js`
- Modify: `.github/workflows/generate-newsletter-image.yml`
- Modify: `.theme-check.yml` only for stale path cleanup, not to suppress real errors
- Read: `snippets/head-script.liquid`
- Read: `assets/quickview-variant-picker.js`
- Read: `templates/product.quickview.liquid` if kept active
- Read: `sections/main-search-quickview.liquid` if kept active
- Create: none expected for BFL; do not restore `tools/generate_newsletter_image.py` unless the user explicitly reverses the validation decision
- Delete: remove/disable obsolete workflow or orphan quickview/search runtime files only after Phase 1 classifies them as accidental

## Implementation Steps

1. Fix `ImgWidthAndHeight` errors in `sections/banner-hotspots.liquid` and `sections/image-text-overlay.liquid`.
   - Validation decision: keep raw `custom_image_url` support for compatibility in this stabilization pass.
   - Add explicit intrinsic `width` and `height` handling or safe defaults that fix theme-check without changing merchant-entered URLs.
2. Re-run `shopify theme check` after image fixes and avoid suppressing the image errors through config.
3. Fix quickview request ordering.
   - Track the active product handle/request token.
   - Ensure only the latest request can update modal HTML/state.
   - Clear or replace stale content on fetch/init failure.
4. Fix quickview product data contract.
   - Ensure `themeConfig.quickview.data` is initialized before assignment or use a local canonical store with a documented read path.
   - Align selectors/contracts between modal JS, variant picker JS, and any quickview template/section kept active.
5. Fix search modal fallback.
   - Restore a valid smart-search view if that is the intended contract, or update fallback to an active route/section response.
   - Ensure fallback error/empty state does not assume `#predictive-search-results` exists when the response is wrong.
6. Resolve BFL/newsletter workflow.
   - Validation decision: disable or remove the workflow for this release because `tools/generate_newsletter_image.py` is deleted and image generation is not part of the release-readiness scope.
   - Do not restore or rewrite the generator in this plan unless the user explicitly reverses this decision.
   - Keep `config/settings_data.json` and newsletter image expectations coherent after the workflow change.
7. Clean stale `.theme-check.yml` ignore references only after real fixes are in place.
8. Run focused validation: theme check, quickview rapid-open/manual JS checks, search fallback path check, workflow syntax/path check.

## Success Criteria

- [ ] `shopify theme check` returns 0 errors.
- [ ] No stale `.theme-check.yml` ignore references to deleted `sections/main-search-smart.liquid` remain unless the file is restored.
- [ ] Quickview rapid open A→B cannot render A into B's modal state.
- [ ] Quickview failed fetch/init renders a clear error or empty state and does not preserve stale product HTML.
- [ ] Quickview variant picker receives product data from a deterministic contract.
- [ ] Search modal fallback uses an active endpoint/view or safe degradation path.
- [ ] BFL/newsletter workflow no longer references a missing script.
- [ ] Fixes are small enough to review file-by-file.

## Risk Assessment

Risk: quickview fixes can alter add-to-cart, price, availability, or media behavior. Mitigation: protect current behavior with targeted manual/regression checks before and after changes.

Risk: restoring deleted search or tool files may undo intentional pruning. Mitigation: Phase 1 must decide restore vs remove before implementation.

Risk: raw image URL compatibility may be a merchant requirement. Mitigation: keep raw URL support only with explicit dimensions and document the limitation; prefer Shopify image pickers for active hero/lookbook paths.

## Execution Notes

Phase 2 execution report: `reports/phase-02-release-blockers.md`.

Key results:

- `shopify theme check` now passes with 0 errors and 2 warnings.
- Raw custom image URL paths keep compatibility and now include dimensions.
- Quickview uses latest-request-wins guards, clears stale local/global state, and supports quickview variant selector names.
- Search fallback no longer depends on deleted `view=smart`; stale request/controller race is guarded.
- BFL workflow is disabled for this release and does not invoke the deleted generator.
- Stale `.theme-check.yml` ignore for `sections/main-search-smart.liquid` was removed.
- Hotspot hardcoded demo product fallback was removed; fetched product tooltip rendering now uses DOM APIs instead of product-data string concatenation.
