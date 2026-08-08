---
phase: 6
title: "Theme Store QA and submission"
status: pending
priority: P1
dependencies: [5]
---

# Phase 6: Theme Store QA and submission

## Overview

Run the final evidence pass required before a Theme Store submission decision: performance, accessibility, responsive behavior, browser support, demo store quality, and submission collateral.

## Requirements

- Functional: real Shopify preview/demo store must pass critical flows on desktop and mobile.
- Functional: Lighthouse/performance evidence exists for home, product, collection, and cart/search where relevant.
- Functional: accessibility checks cover keyboard, focus, modals, color contrast, labels, and dynamic updates.
- Functional: demo store, docs, support, and theme listing collateral are ready for human review.
- Non-functional: do not publish or submit until the user approves the final report.

## Architecture

Use Shopify preview for real Liquid/runtime validation. Prefer Chrome DevTools MCP for inspect/debug loops when preview is needed; use Playwright only for repeatable smoke flows or final evidence. Lighthouse supplements, not replaces, manual commerce QA.

## Related Code Files

- Read: all deployable theme files
- Create: `plans/260629-2235-shopify-theme-store-readiness/reports/final-qa.md`
- Create: optional `plans/260629-2235-shopify-theme-store-readiness/reports/lighthouse-summary.md`
- Create: optional screenshot evidence outside theme `assets/`
- Read/update if needed: `config/settings_schema.json`
- Read/update if needed: docs/support URLs in external systems, not committed blindly

## Implementation Steps

1. Start Shopify preview or attach to the user's approved preview environment.
2. Run static gates:
   - `shopify theme check`
   - JS syntax checks for changed assets
   - JSON template parse
   - stale-reference scans
   - `git diff --check`
3. Run desktop/mobile flow checks:
   - home
   - product with variants/media/gift-card/dynamic checkout
   - collection filters/sort/pagination
   - cart add/update/remove/checkout buttons
   - search and predictive search
   - account/customer pages
   - gift card
   - contact/about/demo content pages
4. Run accessibility checks:
   - keyboard navigation
   - modal focus trap and return focus
   - visible focus rings
   - labels and aria names
   - contrast on dark/light color schemes
5. Run Lighthouse/performance checks for key templates and record scores/issues.
6. Verify latest Chrome, Safari, Firefox, Edge coverage strategy; run what is available locally and list manual/browser gaps.
7. Verify demo store content: no lorem ipsum, broken links, placeholder images, fake discounts, broken apps, missing pages.
8. Verify public docs/support URLs and prepare submission notes.
9. Produce final readiness report with pass/fail, blockers, residual risks, and submit/no-submit recommendation.

## Success Criteria

- [ ] Final QA report exists and lists every required gate.
- [ ] All P1/P2 storefront flows pass on desktop and mobile preview.
- [ ] Lighthouse/performance issues are fixed or documented with rationale.
- [ ] Accessibility critical issues are zero.
- [ ] Demo store and docs/support are ready for human review.
- [ ] User has enough evidence to approve package/submission.

## Risk Assessment

Risk: local preview can pass while Shopify Theme Store review fails due to demo-store data. Mitigation: validate against final demo store, not only local static files.

Risk: Lighthouse scores vary by environment. Mitigation: record environment, run repeatable checks, and fix structural issues rather than chasing one-off noise.