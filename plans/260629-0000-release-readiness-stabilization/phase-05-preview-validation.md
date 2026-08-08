---
phase: 5
title: Preview validation
status: completed
priority: P1
dependencies:
  - 4
---

# Phase 5: Preview validation

## Overview

Run final release-readiness validation across static checks and Shopify storefront flows. Shopify preview validation is a blocking release gate for this plan. This phase proves the stabilization work is deployable; it does not add new fixes except small corrections for regressions discovered during validation.

## Requirements

- Functional: every acceptance gate from `plan.md` must be verified or explicitly marked blocked.
- Functional: manual browser checks must cover the highest-risk pages and flows from the audit.
- Non-functional: report failures honestly with exact page/flow, reproduction steps, and suspected file owner.
- Non-functional: do not weaken validation rules to get a green result.

## Architecture

Validation spans three layers:

1. Static/theme checks: Liquid, JSON, `.theme-check.yml`, active reference scans.
2. Browser/storefront behavior: Shopify preview pages and interactive JS flows.
3. Release hygiene: git status coherence, CI workflow path validity, no accidental runtime untracked files.

## Related Code Files

- Read: all files modified in phases 2-4
- Read: `plans/reports/260628-devs2-shopify-theme-audit.md`
- Read: this plan's phase files
- Modify: only small regression fixes directly discovered by validation
- Create: optional validation report under `plans/260629-0000-release-readiness-stabilization/reports/`
- Delete: none unless a validation failure proves an orphan was missed and Phase 4 criteria still apply

## Implementation Steps

1. Run static gates.
   - `shopify theme check`
   - JSON template validation with Shopify header stripping
   - Active template/section reference scan
   - Search for stale references called out by the audit: `view=smart`, deleted generator script path, pruned section names, hardcoded demo product/image URLs.
2. Run release hygiene checks.
   - `git status --short --untracked-files=all`
   - Confirm no runtime files are accidentally untracked.
   - Confirm intended deletes/renames are coherent.
3. Run Shopify preview checks on desktop and mobile widths.
   - Homepage: hero/slideshow, hotspots, featured product, newsletter/modal behavior if active.
   - PDP: media gallery, variant picker, add-to-cart, complementary products.
   - Collection: filters, sort, pagination, product cards, quickview triggers.
   - Cart page and cart modal: quantity changes, totals, empty state.
   - Search modal: predictive results and fallback path.
   - Quickview: rapid A→B open, failed product path if testable, variant changes, add-to-cart.
   - Wishlist: add/remove from product card and any wishlist page/surface.
   - Contact/About: optional blank settings, social links, responsive layout.
4. Run accessibility-focused manual checks.
   - Keyboard open/close modals, focus trap, return focus.
   - Images above fold have stable dimensions and sensible loading/fetchpriority.
   - Empty optional content does not create bad focus targets.
5. Run performance sanity checks.
   - Confirm no JS hero/slideshow image swap causes visible flicker or duplicate LCP image request when observable.
   - Check high-frequency interactions like before/after slider and contact sticky behavior after cleanup if touched.
6. Write final validation summary.
   - Pass/fail per gate.
   - Remaining warnings and whether they block release.
   - Rollback notes for any risky change.

## Success Criteria

- [ ] `shopify theme check` passes with 0 errors.
- [ ] JSON templates parse with the documented Shopify header stripping method.
- [ ] Active templates/section groups reference existing active sections only.
- [ ] Git status contains only intended tracked changes and no accidental untracked runtime files.
- [ ] GitHub Action path/script decision is verified.
- [ ] Homepage, PDP, collection, cart, search, quickview, wishlist, contact, and about flows pass desktop checks.
- [ ] Same high-risk flows pass mobile checks.
- [ ] Keyboard/focus checks pass for modals/search/quickview/cart.
- [ ] Quickview stale-product and failure-state scenarios are verified fixed.
- [ ] Search fallback path is verified fixed or intentionally removed.
- [ ] Final validation summary exists before handoff/release.

## Risk Assessment

Risk: preview testing may require a Shopify store/session not available to the implementation agent. Mitigation: complete all local static checks and leave exact manual verification steps as blocking release gates for the user or an authenticated session.

Risk: fixing validation regressions during this phase can expand scope. Mitigation: only apply direct regression fixes tied to earlier phases; new unrelated findings become a follow-up plan/report item.
