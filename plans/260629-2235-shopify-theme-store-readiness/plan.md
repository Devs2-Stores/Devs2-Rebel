---
title: "Shopify Theme Store readiness"
description: "Bring Devs2 Rebel from release-candidate theme to Shopify Theme Store submission-ready state."
status: pending
priority: P1
branch: "main"
tags: [shopify, theme-store, storefront, compliance, qa]
blockedBy: [260629-0000-release-readiness-stabilization]
blocks: []
created: "2026-06-29T16:38:33.875Z"
createdBy: "ck:plan"
source: skill
sourceReport: plans/reports/260629-2232-shopify-theme-store-requirements-gap.md
---

# Shopify Theme Store readiness

## Overview

This plan resolves the remaining gaps between the current Devs2 Rebel theme and Shopify Theme Store review expectations. It builds on the release-readiness stabilization plan instead of replacing it: first close required storefront contracts, then remove policy/review risk, then validate against real preview/demo submission gates.

Scope is intentionally practical. No redesign, no new selling features, no app/backend work unless a requirement cannot be met theme-side.

## Scope Challenge

- Existing code: OS2.0 theme structure, JSON templates, app blocks, cart dynamic checkout, localization, gift card template, quickview/search/wishlist stabilization already exist.
- Minimum changes: native PDP product form/dynamic checkout, gift card recipient submit path, hosted video/3D media, recommendations endpoint, native swatches, app-like feature posture, packaging/demo/QA evidence.
- Complexity: touches more than 8 files because Shopify Theme Store review spans product, collection, cart, settings, templates, assets, docs, demo store, and QA. Scope cannot be safely reduced below these gates.
- Selected mode: HOLD SCOPE. Fix what blocks Theme Store review; defer redesign and feature expansion.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [PDP commerce contract](./phase-01-pdp-commerce-contract.md) | Pending |
| 2 | [Product media and recommendations](./phase-02-product-media-and-recommendations.md) | Pending |
| 3 | [Variant swatches and app blocks](./phase-03-variant-swatches-and-app-blocks.md) | Pending |
| 4 | [Policy cleanup for app-like features](./phase-04-policy-cleanup-for-app-like-features.md) | Pending |
| 5 | [Package and demo store cleanup](./phase-05-package-and-demo-store-cleanup.md) | Pending |
| 6 | [Theme Store QA and submission](./phase-06-theme-store-qa-and-submission.md) | Pending |

## Dependencies

- Source gap report: `plans/reports/260629-2232-shopify-theme-store-requirements-gap.md`.
- Official requirements: https://shopify.dev/docs/storefronts/themes/store/requirements
- Blocking local plan: `plans/260629-0000-release-readiness-stabilization/plan.md`.
- Current Shopify theme patterns: Liquid sections/snippets, JSON templates, route-aware CSS/JS in `snippets/head-stylesheets.liquid` and `snippets/head-script.liquid`, `themeConfig`, `ThemeUtils`, custom elements.

## Acceptance Criteria

- PDP uses a native Shopify product form for add-to-cart, dynamic checkout, variant id sync, quantity, selling plans if present, and gift card recipient properties.
- Product media supports images, hosted videos, external videos, and 3D models with accessible controls and no broken thumbnails.
- Related and complementary products use Shopify recommendations/section-rendering contracts instead of first-collection guessing.
- Variant pickers support native Shopify color/image swatches while preserving current unavailable/cross-out behavior.
- App-like/review-risk features have explicit Theme Store posture: remove, default-off, or document as theme-native. No dead compare route remains.
- Demo/package state is clean: no generated `.playwright-mcp` artifacts, no accidental `settings_data.json` drift, no unresolved staged/unstaged split, no store-specific hardcoded CDN defaults unless approved.
- Static gates pass: `shopify theme check`, JSON parse, JS syntax, stale-reference scans, `git diff --check`.
- Preview gates pass on home, product, collection, cart, search, account/customer, gift card, wishlist policy state, contact/about pages.
- Lighthouse/performance, accessibility, responsive, browser, demo store, docs/support, and submission collateral are captured in Phase 6 report.

## Non-Goals

- No full visual redesign.
- No paid app replacement features.
- No Shopify app/backend build.
- No production publish or Theme Store submission until user approves the final package.

## Open Questions

- Confirm target is Shopify Theme Store, not Haravan marketplace.
- Decide whether wishlist, compare, back-in-stock, coupon, and countdown are required selling points or can be removed/default-off.
- Confirm `docs.devs2.com/rebel` and `devs2.com/support` are live/owned and acceptable for `theme_info`.

## Implementation Handoff

Run implementation with:

```text
/ck:cook C:\Users\Admin\Desktop\Devs2 Shopify\plans\260629-2235-shopify-theme-store-readiness\plan.md
```

Recommended before implementation: run `/ck:plan validate` because this plan contains policy decisions and Theme Store review assumptions.
## Validation Log

### Session 1 - 2026-06-30

**Trigger:** `/ck:plan validate`
**Questions prepared:** 4

#### Verification Results

- **Tier:** Full
- **Claims checked:** 48
- **Verified:** 43 | **Failed:** 1 | **Unverified:** 4

#### Verified Evidence

- `shopify theme check`: pass, 140 files inspected with no offenses.
- `node --check assets/product.js`: pass.
- JSON template parse: pass, 23 JSON files, 64 section refs, 0 missing sections.
- `git diff --check`: pass with CRLF warnings only for `assets/page-about.css`, `sections/page-contact.liquid`, and `templates/page.contact.json`.
- Product form gap verified: `sections/main-product.liquid` has only the Shop Pay installments product form, while buy buttons are detached `type="button"` controls and gift card recipient inputs target `product-form-{{ section.id }}`.
- Product media/recommendation gap verified: `sections/main-product.liquid` still renders `product.images` plus external videos; `sections/complementary-products.liquid` depends on `recommendations.performed`; related products use `product.collections.first`.
- Swatch gap verified: variant picker snippets build values from `product.variants | map` and do not use `value.swatch.image` or `value.swatch.color`.
- Policy gap verified: compare still routes to `/pages/compare?ids=...`; wishlist uses localStorage; coupon, countdown, and back-in-stock flows remain present in active theme files.
- Package gap verified: generated `.playwright-mcp/*` files and `page_home.html` are untracked; `templates/index.json` contains store-specific `cdn.shopify.com/s/files/1/0697/...` URLs; `.theme-check.yml` still ignores deleted `snippets/product-card-special.liquid`; `.shopifyignore` does not explicitly ignore `.playwright-mcp/`, `page_home.html`, `backup/`, or `plans/`.

#### Failures

1. [Contract Verifier] Phase 2 underscopes rich product media. Shopify's Theme Store requirements cover the product template, featured product section, and product forms such as quick view. The plan currently emphasizes PDP only, while local quickview files still use `product.images` and `sections/featured-product.liquid` has no rich-media handling.

#### Unverified Items

- Whether `https://docs.devs2.com/rebel` is live, public, and aligned with the theme settings.
- Whether `https://devs2.com/support` is live and satisfies Shopify's support contact form expectations.
- Whether the final demo store content has no placeholder/fake urgency after policy cleanup.
- Whether Lighthouse/accessibility/browser preview scores pass on the final Shopify preview.

#### Pending Validation Questions

1. **[Scope]** Confirm the target marketplace for this plan.
2. **[Contract]** Confirm whether Phase 2 should be expanded to cover featured product and quickview rich media.
3. **[Policy]** Decide the default posture for wishlist, compare, back-in-stock, coupon, countdown, recently viewed, and promotion/session popup.
4. **[Launch]** Confirm documentation/support URLs and support readiness.

#### Impact on Phases

- Phase 2: needs user confirmation to expand from PDP-only rich media to PDP, featured product, quickview, and search quickview media contracts.
- Phase 4: blocked by user decision on app-like/risk-feature posture.
- Phase 5: blocked by user decision on `settings_data.json`, docs/support URLs, and package hygiene.
- Phase 6: remains a final evidence phase, not eligible to start before unresolved validation questions are answered.

### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, `phase-01-pdp-commerce-contract.md`, `phase-02-product-media-and-recommendations.md`, `phase-03-variant-swatches-and-app-blocks.md`, `phase-04-policy-cleanup-for-app-like-features.md`, `phase-05-package-and-demo-store-cleanup.md`, `phase-06-theme-store-qa-and-submission.md`.
- Decision deltas checked: 1
- Reconciled stale references: 0
- Unresolved contradictions: 1
- Unresolved: Phase 2 does not yet include featured product and quickview rich media even though Shopify's current requirement includes those surfaces.