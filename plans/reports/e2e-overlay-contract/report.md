# E2E: modal, popup, drawer, font, spacing, icon - Rebel - 2026-10-16

Status: **DONE_WITH_CONCERNS**. Test-only run against `shopify theme dev` (127.0.0.1:9292). No theme file was changed in this run. Every remaining FAIL maps to one of five verified defects; probe artifacts found during the run were fixed in the probes, not waived.

## Probes

| Probe | Scope | Result |
|---|---|---|
| `runs/e2e/overlay-contract.cjs` | 12 overlay configs: cart, search (1440/375), mobile menu (375/768), quick view, filter drawer, pickup (1440/375), size guide, lightbox (1440/375). 25 checks each: trigger name/focus, keyboard open, dialog semantics, focus in, topmost, fits viewport, scroll lock, no layout shift, aria-hidden leaks, text inset, wheel lock, Tab trap, close/Escape/outside click, focus return, unlock, 3 cycles, page errors | 235 PASS / 32 FAIL / 7 INFO (`overlay-contract.log`, `.json`) |
| `runs/e2e/font-spacing-icon.cjs` | 12 routes x 375/768/1440: theme families, control fonts, loaded faces per weight, min text size, line-height, section gaps, target overlap, `<use>` resolution, empty icons, icon-only names/size, icon contrast, icon/label alignment | 456 PASS / 72 FAIL / 60 INFO (`font-spacing-icon.log`, `.json`) |

INFO rows: pickup trigger needs a location with local pickup (`sections/pickup-availability.liquid:4`, section renders empty on the store); size guide has no trigger with current settings and was opened through `size-guide-modal.open()`; full-screen panels have no outside area to click; layered targets (add-to-cart button over the card image link, both >= 24 px); breadcrumb -> article gap 20 px (below the 24 px rhythm, not touching); decorative SVGs exposed to AT; mobile inputs < 16 px (iOS zoom).

## Defects

| # | Severity | Defect | Evidence |
|---|---|---|---|
| D1 | High | Scroll lock does not lock. `ThemeUtils.lockScroll` sets `overflow: hidden` on `body` (`assets/theme.js:151-158`), but `html` has `overflow-x: clip` (`assets/reset.css:18-20`), so body overflow no longer propagates to the viewport. The page behind every overlay scrolls with the wheel. Product lightbox uses the same body-only lock (`assets/product.js:947,952`). | Wheel outside panel moves scrollY 400 -> 1000 on cart, search, mobile menu x2, quick view, filter, size guide. Discriminating test on home: as-is 400 -> 1000; with `html { overflow: hidden }` 400 -> 400. |
| D2 | Medium | Quick view does not return focus. The trigger is stored correctly (`_focusTrapTrigger` = `.product-card__quickview`) but becomes `visibility: hidden` when focus leaves the card (`assets/product-card.css:23-26,88-90`), so `focus()` on close fails and focus lands on `body`. | Live: stored trigger visibility `hidden` while modal open; after Escape `activeElement` = body. |
| D3 | High (a11y) | Product lightbox is mouse-only. Trigger is a plain `<img>` with a click listener (`assets/product.js:986-991`); `<product-lightbox>` has no `role="dialog"`, `aria-modal` or name, no focus move/trap/return, and the large image gets `alt=""` (`assets/product.js:942-966`). | 16 FAIL rows at 1440 and 375: not focusable, no keyboard open, focus stays on body, Tab leaves the overlay. |
| D4 | Medium | Weight tokens 500/600 have no font face. `--font-weight-medium: 500` and `--font-weight-semibold: 600` (`snippets/head-design-systems.liquid:59-60`) are used widely, but `snippets/head-fonts.liquid:12-22` loads only regular and `font_modify: 'weight', 'bold'`. Medium renders as 400 and semibold as 700. | All 36 route x width runs: e.g. home 1440 "inter 600 renders with face 700 (53 el)", "inter 500 renders with face 400 (25 el)". |
| D5 | Low / decision | 11 px text below the documented type scale (`DESIGN.md:53` starts at `--font-xs` 0.75 rem). Cart count (`assets/header.css:143`) and product-card badges (`assets/product-card.css:211,235`) use 0.6875 rem; `.content-size-xs` (`assets/base.css:93`) defines the same step. | All 36 runs. |

D1 also explains the "closed: scroll position restored" rows: the page had already scrolled during the wheel step.

## Probe corrections made during the run

- Empty samples report INFO instead of PASS (sections measured < 2, no icon-only controls).
- Trigger located after scrolling and re-hover; trigger captured per open so focus return is checked against the real element.
- Quick view opened the keyboard way (focus inside the card first; the button is revealed by `:focus-within`).
- Text-inset check measures text ink (Range rects), skips visually hidden (`.sr-only`) and off-panel slide text.
- Section gaps clip leaf rects by `overflow` ancestors and skip sticky/fixed subtrees (the PDP description `ul` was clipped by the collapsed read-more box, not spilling into recommendations).
- Overlapping targets fail only when the smaller one is under 24 px; larger layered targets are advisory.
- Filtered platform/dev-proxy noise: `shopifycloud` origin_trials CORS, Storefront API GraphQL 400s (no theme code calls GraphQL), `/favicon.ico` 404 (`settings.favicon` blank, `snippets/head-meta-tags.liquid:16`).

## Not covered

- Newsletter popup and address modal: disabled / no customer session with current settings.
- Pickup drawer: store has no pickup location.
- Real touch devices and Safari.
