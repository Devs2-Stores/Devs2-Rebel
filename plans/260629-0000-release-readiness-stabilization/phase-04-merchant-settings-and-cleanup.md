---
phase: 4
title: Merchant settings and cleanup
status: completed
priority: P2
dependencies:
  - 3
---

# Phase 4: Merchant settings and cleanup

## Overview

Restore merchant settings as the source of truth and remove stale release-risk leftovers from the prune/migration work. This phase stays scoped: cleanup is allowed only when it reduces deploy risk, payload risk, or future regression risk identified by the audit.

## Requirements

- Functional: theme settings for radius, images, products, and optional content must be respected by storefront output.
- Functional: hardcoded demo catalog/image data must not override merchant-configured content in active sections.
- Functional: stale references to pruned sections/assets should be removed when they are not active dependencies.
- Non-functional: preserve current visual intent where it is merchant-configured.
- Non-functional: prefer deletion of dead references over adding compatibility layers for removed sections.

## Architecture

The theme has centralized tokens in `snippets/head-design-systems.liquid`, route-aware CSS/JS in `snippets/head-stylesheets.liquid` and `snippets/head-script.liquid`, and many active/pruned sections. The cleanup must keep Shopify Theme Editor settings authoritative while avoiding a broad redesign.

## Related Code Files

- Modify: `snippets/head-design-systems.liquid`
- Modify: `config/settings_schema.json` only if the existing schema cannot represent the intended contract
- Modify: `config/settings_data.json` only if removing stale generated/demo data is intentional and safe
- Modify: `sections/slideshow.liquid` or related homepage JS/CSS if hardcoded image override exists there
- Modify: `sections/banner-hotspots.liquid`
- Modify: `sections/image-text-overlay.liquid`
- Modify: `assets/index.js`
- Modify: `assets/index.css`
- Modify: `assets/banner-link.css` if orphaned
- Modify: `assets/page-contact.css`
- Modify: `assets/page-about.css`
- Modify: `locales/*.json` only for strings tied to deleted active features
- Read: `snippets/head-color-schemes.liquid`
- Read: active `templates/index.json`, `templates/product.json`, `templates/collection.json`, `templates/page.about.json`
- Delete: orphaned assets/locales only after confirming no active section/template/snippet references them
- Create: none expected

## Implementation Steps

1. Fix radius token contract.
   - Ensure merchant setting `0` for button/input radius renders square controls.
   - Avoid `max(setting, fallback)` patterns where they override explicit merchant values.
2. Remove hardcoded slideshow image override behavior.
   - Merchant-selected slide images from Liquid/template settings must remain final source of truth.
   - Avoid JS image swaps that waste LCP preload/eager image work.
3. Remove hardcoded hotspot fallback catalog data.
   - Do not ship demo snowboard handles/prices/CDN images into production fallback behavior.
   - Use merchant-configured products/images only, or render a safe empty/text-only state.
4. Reassess custom image URL settings.
   - Validation decision: keep raw custom URL compatibility in this stabilization pass.
   - Require dimensions and clear alt behavior for raw URL paths; consider `image_picker` migration only as a later cleanup if compatibility risk is acceptable.
5. Remove stale `.theme-check.yml` suppressions and comments tied to deleted files.
6. Remove orphan active references from pruned sections/assets.
   - Example candidates from audit: flash-sale JS/CSS, banner-link CSS, stale locale entries.
   - Confirm via search before deleting; do not delete shared CSS used by active markup.
7. Normalize recently modified CSS to project breakpoint convention.
   - Replace avoidable `max-width: 768px` patterns with mobile-first `min-width` structure where safe.
8. Run validation after each cleanup group rather than batching all changes.

## Success Criteria

- [ ] Button/input radius setting `0` renders square controls.
- [ ] Slideshow images are not replaced by hardcoded CDN URLs after render.
- [ ] Hotspot section does not ship hardcoded demo product fallback data.
- [ ] Active custom image paths either use Shopify image pipeline or have explicit dimensions and documented raw-URL constraints.
- [ ] `.theme-check.yml` no longer contains stale ignores for deleted runtime files.
- [ ] Orphaned assets/references identified in the audit are removed or documented as still used.
- [ ] New/modified CSS follows the project's mobile-first breakpoint convention where safe.
- [ ] Cleanup does not expand into unrelated redesign or feature work.

## Risk Assessment

Risk: deleting an apparently orphaned asset can break a section loaded dynamically or by merchant template settings. Mitigation: search references across Liquid, JSON templates, snippets, assets, and locales before deletion.

Risk: changing token math can subtly alter many controls. Mitigation: test button/input/variant pill/card surfaces after radius fix, especially with settings at `0` and nonzero values.
