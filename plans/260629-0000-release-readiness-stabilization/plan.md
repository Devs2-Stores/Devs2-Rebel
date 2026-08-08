---
title: Ổn định release-readiness theme Devs2 Shopify
description: Kế hoạch ổn định theme Devs2 Rebel từ audit report trước khi release/deploy.
status: pending
priority: P1
branch: main
tags:
  - shopify
  - theme
  - release-readiness
  - stabilization
blockedBy: []
blocks: [260629-2235-shopify-theme-store-readiness]
created: '2026-06-29'
createdBy: 'ck:plan'
source: skill
sourceReport: plans/reports/260628-devs2-shopify-theme-audit.md
---

# Ổn định release-readiness theme Devs2 Shopify

## Overview

Kế hoạch này chuyển audit report `plans/reports/260628-devs2-shopify-theme-audit.md` thành roadmap triển khai để đưa theme `Devs2 Rebel` về trạng thái có thể release. Trọng tâm là **Option A — release-readiness stabilization trước**: sửa blockers, chốt trạng thái prune/migration, bảo vệ commerce UX chính, rồi validate trong Shopify preview.

Không mở rộng feature mới trong kế hoạch này. Cleanup sâu chỉ làm khi trực tiếp giảm rủi ro release hoặc ngăn regression ở các flow đang active.

## Phases

| Phase | Name | Status | Priority | Depends on |
|-------|------|--------|----------|------------|
| 1 | [Baseline validation](./phase-01-baseline-validation.md) | Pending | P1 | Completed |
| 2 | [Release blockers](./phase-02-release-blockers.md) | Pending | P1 | Completed |
| 3 | [Commerce UX contracts](./phase-03-commerce-ux-contracts.md) | Pending | P1 | 2 |
| 4 | [Merchant settings and cleanup](./phase-04-merchant-settings-and-cleanup.md) | Pending | P2 | Completed |
| 5 | [Preview validation](./phase-05-preview-validation.md) | Pending | P1 | Completed |

## Dependencies

- Source audit: `plans/reports/260628-devs2-shopify-theme-audit.md`.
- Project rules: `CONTEXT.md` plus global development/documentation rules loaded in session.
- Execution should keep current Shopify OS2.0 theme contracts: Liquid, JSON templates, section groups, route-aware CSS/JS loading, `themeConfig`, `ThemeUtils`, and merchant settings as source of truth.

## Acceptance Criteria

- `shopify theme check` passes with 0 errors; any remaining warnings are reviewed and either fixed or documented as intentional.
- Git working tree has one coherent intended diff; no runtime Liquid/template/asset files remain untracked unintentionally.
- Active JSON templates and section groups reference only active section files.
- Quickview cannot show stale/wrong product after rapid opens or failed fetch/init; variant/price/availability state updates against a clear data/render contract.
- Search modal fallback no longer depends on a deleted `view=smart` implementation.
- GitHub Action BFL/newsletter generation is intentionally disabled or removed for this release unless a later decision restores the generator.
- Merchant-configured values remain source of truth: square radius settings render square controls; slideshow/hotspot do not override merchant images/products with hardcoded demo data.
- Optional contact settings do not render empty cards, `tel:`, or `mailto:` targets.
- Homepage, PDP, collection, cart, search, quickview, wishlist, contact, and about pages pass manual Shopify preview checks on mobile and desktop.

## Non-Goals

- No full theme redesign.
- No broad section rewrite unless needed for release blockers.
- No new storefront feature work.
- No external publishing, GitHub issue creation, or Shopify deploy unless explicitly requested later.

## Implementation Boundary

This plan is documentation only. Start implementation with:

```text
/ck:cook C:\Users\Admin\Desktop\Devs2 Shopify\plans\260629-0000-release-readiness-stabilization\plan.md
```

Recommended before implementation: run validation or red-team if the release target is strict, because quickview/search/contact changes touch live commerce UX.

## Validation Log

### Validation Session 1

#### Verification Results

- **Tier:** Full
- **Claims checked:** 22
- **Verified:** 20 | **Failed:** 0 | **Unverified:** 2
- **Verified examples:** `.theme-check.yml`, `.shopifyignore`, `.github/workflows/generate-newsletter-image.yml`, `assets/quickview-modal.js`, `assets/quickview-variant-picker.js`, `assets/search-modal.js`, `snippets/head-design-systems.liquid`, `snippets/quickview-modal.liquid`, `templates/product.quickview.liquid`, `snippets/quickview-variant-picker.liquid`.
- **Verified blocker evidence:** `tools/generate_newsletter_image.py` is absent; `assets/search-modal.js` still references `view=smart`; quickview has mixed `product-variant-picker`/`quickview-variant-picker` selectors; `snippets/head-design-systems.liquid` uses `max()` radius token logic; slideshow/hotspot hardcoded demo data exists.
- **Unverified:** live Shopify preview behavior and current post-plan `shopify theme check` output were not rerun during this validation session.

#### User Decisions

1. **BFL workflow:** disable/remove for this release. Do not restore `tools/generate_newsletter_image.py` unless the user explicitly reverses this decision.
2. **Raw custom image URLs:** keep raw URL compatibility and add dimensions/safe defaults for stabilization.
3. **Quickview:** stabilize first. Fix stale/wrong product, error state, data contract, and selector mismatch before any broad consolidation.
4. **Preview validation:** blocking gate. Theme is not release-ready until Shopify preview checks pass for the listed high-risk flows on mobile and desktop.

#### Phase Propagation

- Updated Phase 2 BFL workflow step to prefer disable/remove over script restoration.
- Updated Phase 2 image fix step to keep raw URL compatibility with explicit dimensions.
- Updated Phase 3 quickview scope to stabilize first and defer broad consolidation unless required.
- Updated Phase 5 overview to mark Shopify preview validation as a blocking release gate.

#### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, `phase-01-baseline-validation.md`, `phase-02-release-blockers.md`, `phase-03-commerce-ux-contracts.md`, `phase-04-merchant-settings-and-cleanup.md`, `phase-05-preview-validation.md`.
- Decision deltas checked: 4.
- Reconciled stale references: 3.
  - Phase 2 no longer presents restoring the deleted BFL generator as the default path.
  - Phase 4 no longer prefers `image_picker` migration during this stabilization pass.
  - Phase 1 BFL success criteria now aligns with the disable/remove decision.
- Unresolved contradictions: 0.
