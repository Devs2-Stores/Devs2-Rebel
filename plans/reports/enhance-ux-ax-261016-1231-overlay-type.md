# UX/AX review: Devs2 Rebel (Shopify OS 2.0 base theme) - 2026-10-16

## Verdict

DONE_WITH_CONCERNS. P1-P6 are delivered and verified: every rendered overlay locks scrolling, traps and returns focus, and closes with Escape; the product lightbox is keyboard-operable with dialog semantics; medium and semibold have their own faces. Accessibility goes from 1 to 3 with no regression (journeys 96/0, axe 0, capture 48/48 clean). Open items need you: the product image ratio decision, 18 global settings that no theme file reads, `shopify theme check` approval, and an AntiFan receipt that stays STRUCTURAL/FAIL for reasons triaged in rounds 9 and 11 (none theme-owned).

## Scope and environment

- Mode: `--auto --audit --loop 10`. `--loop` implies implementation. `--audit` is not a documented flag; it is read as "audit-led": every round starts from measured findings, and round 1 uses the audit evidence below as its baseline.
- Running theme: `shopify theme dev` at `http://127.0.0.1:9292` (user-started, reused; not stopped by this review). Production origin for discovery: `https://devs2-rebel.myshopify.com`.
- Git: `--git-dir=.git-nested`, branch `main`, HEAD `d4a44dd` plus the uncommitted working tree. Nothing is committed or pushed by this review.
- Pages: 16 routes x 375/768/1440 (capture), 12 routes x 3 widths (font/spacing/icon), 12 overlay configurations (overlay contract).
- Not run: `shopify theme check` (needs per-command approval), real touch devices, Safari, a real screen reader.
- Project rule conflict: the DONE contract's reduced-motion line is replaced. `AGENTS.md` section 5 forbids `prefers-reduced-motion` in this workspace, so motion is checked for keyboard and pause behaviour only.

## Baseline evidence (same day, no theme edits since)

| Evidence | Path | Result |
|---|---|---|
| Screenshots 16 routes x 3 viewports (first, loaded, full) | `plans/reports/clean-loop-261016/capture/` | 48/48 captured, 0 overflow, 0 broken images |
| Suite (node check, JSON, locales, ranges, journeys, axe, lifecycle, discovery) | `plans/reports/clean-loop-261016/suite/` | validators exit 0; axe 0 violations on 15 routes x 3; journeys 32/32 in isolation |
| Overlay contract | `plans/reports/e2e-overlay-contract/overlay-contract.log` | 235 PASS / 32 FAIL / 7 INFO |
| Font, spacing, icon | `plans/reports/e2e-overlay-contract/font-spacing-icon.log` | 456 PASS / 72 FAIL / 60 INFO |
| Discovery scan | `plans/reports/clean-loop-261016/suite/discovery.txt` | 13 errors / 20 warnings, all platform or dev-proxy owned (relative `og:image` rewritten by the dev proxy, Shopify-served `/agents.md`, home has no store social image) |

## Scores (baseline)

| Area | Score | Evidence |
|---|---|---|
| First impression | 2 | Unchanged since 2026-10-11 round 10; offer copy is merchant content |
| Brand recall | 2 | Medium and semibold render as regular and bold: 500 -> face 400, 600 -> face 700 on every route (`font-spacing-icon.log`), so the type hierarchy in `DESIGN.md` is not what ships |
| Content punch | 2 | Merchant copy gaps unchanged |
| Clarity and hierarchy | 3 | One primary CTA per view |
| Storytelling | 2 | Home order is merchant content |
| Knowledge and trust | 2 | Unchanged |
| Motion | 3 | Token durations; auto-advance pauses |
| Responsive | 3 | 0 overflow at 375/768/1440 |
| Accessibility | 1 | Product lightbox is mouse-only with no dialog semantics (16 FAIL); quick view drops focus on close; the page behind every overlay scrolls with the wheel |
| Performance feel | 2 | No field CWV on a dev store |

## Scores (after round 10)

| Area | Before | After | Evidence |
|---|---|---|---|
| Brand recall | 2 | 3 | Every used weight has its own face (font, spacing, icon "every used weight/style has its own face" PASS on 36 runs, `round-4/font-spacing-icon.log`); drawer text and share icons now match the rest of the type and icon system |
| Accessibility | 1 | 3 | Overlay contract 0 FAIL on every rendered overlay (`round-4/`, `round-7/` plus isolated reruns); axe 0 violations on 15 routes x 3 widths (`round-10-final/suite/axe.json`) |
| Other areas | unchanged | unchanged | No regression: journeys 96/0, capture shows no overflow, clipping or broken images |

## Proposals

### P1 - Scroll lock that locks, with one owner (Must)
- Evidence: wheel outside the panel moves the page 400 -> 1000 px on cart, search, mobile menu (375, 768), quick view, filter and size guide (`overlay-contract.log`). Discriminating test: body lock as-is 400 -> 1000; with `html` overflow hidden 400 -> 400. Cause: `html { overflow-x: clip }` (`assets/reset.css:18-20`) stops `body` overflow propagating to the viewport, and `ThemeUtils.lockScroll` only styles `body` (`assets/theme.js:151-165`). `ProductLightbox` (`assets/product.js:947,952`), `SizeGuideModal` (`assets/product.js:1044-1054`) and the gallery lightbox (`sections/gallery.liquid:85-96`) set `body.style.overflow` themselves.
- Change: lock the root element inside `ThemeUtils.lockScroll`/`unlockScroll`; route the lightbox, size guide and gallery lightbox through those two functions.
- Files: `assets/theme.js`, `assets/base.css` or `assets/reset.css`, `assets/product.js`, `sections/gallery.liquid`.
- Acceptance: overlay contract "wheel outside panel does not scroll page" and "closed: scroll unlocked and position restored" PASS for every rendered overlay; "no layout shift of page behind" still PASS; `rg "body.style.overflow" assets sections` returns only the `customer.js` no-ThemeUtils fallback.

### P2 - Quick view returns focus to its trigger (Must)
- Evidence: the stored trigger `.product-card__quickview` is `visibility: hidden` while the modal is open (`assets/product-card.css:23-26,88-90`), so `focus()` on close fails and focus lands on `body` (live probe 2026-10-16).
- Change: keep the trigger focusable while its quick view is open, so focus can return to it.
- Files: `assets/product-card.css` and/or `assets/quickview-modal.js`.
- Acceptance: overlay contract "Escape: focus returns to trigger" and "close button: focus returns to trigger" PASS for quick view.

### P3 - Keyboard-operable product lightbox with dialog semantics (Must)
- Evidence: trigger is a plain `<img>` with a click listener (`assets/product.js:986-991`); `<product-lightbox>` has no role, `aria-modal`, name, focus move, trap or return; the enlarged image has `alt=""` (`assets/product.js:942-966`). 16 FAIL rows at 1440 and 375.
- Change: open from a real button (keyboard), dialog semantics with a locale-backed name, focus trap via `ThemeUtils.trapFocus`, focus return, Escape, image alt from the source image.
- Files: `assets/product.js`, `snippets/product-media-item.liquid` and/or `sections/main-product.liquid`, `assets/product.css`, `locales/en.default.json` if a new string is needed.
- Acceptance: all 25 overlay-contract checks PASS for `lightbox-1440` and `lightbox-375`; mouse click on the image still opens it.

### P4 - Load the medium and semibold faces the tokens ask for (Should)
- Evidence: `--font-weight-medium: 500` and `--font-weight-semibold: 600` (`snippets/head-design-systems.liquid:59-60`); `snippets/head-fonts.liquid:12-37` loads only regular, bold and italics. Every route renders 500 with the 400 face and 600 with the 700 face.
- Change: add 500 and 600 faces with `font_modify: 'weight'`, emitted only when the chosen font has them (the filter returns nil otherwise).
- Files: `snippets/head-fonts.liquid`.
- Acceptance: font/spacing/icon "every used weight/style has its own face" PASS on all 36 route x width runs for the default preset; no new preload; render-blocking requests unchanged.

### P5 - Record the 11 px micro-label step (Could)
- Evidence: cart count (`assets/header.css:143`), product-card badges (`assets/product-card.css:211,235`) and `.content-size-xs` (`assets/base.css:93`) use 0.6875 rem, while `DESIGN.md:53` starts the scale at 0.75 rem.
- Change: document 0.6875 rem as the uppercase micro-label step in `DESIGN.md` (no visual change), and make the probe's minimum read that documented floor.
- Files: `DESIGN.md`, `runs/e2e/font-spacing-icon.cjs`.
- Acceptance: `DESIGN.md` names the step and where it is allowed; the probe flags any text below 11 px or any 11 px text that is not uppercase micro-label.

### P6 - Make the new probes review gates (Should)
- Change: list `runs/e2e/overlay-contract.cjs` and `runs/e2e/font-spacing-icon.cjs` in `REVIEW.md` with their pass rule.
- Files: `REVIEW.md`.
- Acceptance: `REVIEW.md` names both scripts, the command, and the exit-code rule.

## DONE contract

1. P1-P3 (Must) and P4, P6 (Should) meet their acceptance checks; P5 meets its check or is recorded as skipped with a reason.
2. Discovery scan exits with no theme-owned error; the 13 errors / 20 warnings above are platform or dev-proxy owned and accepted for that reason. Any new finding is fixed.
3. Screenshots at 1440x900, 768x1024 and 375x812 of every changed page show no overflow, clipping, overlap or broken image; vision review finds no High issue.
4. No rubric area regresses; Accessibility reaches at least 2.
5. Keyboard checks pass on every changed overlay (overlay contract, all configs that render).
6. `node --check` on all theme JS, JSON parse, `validate-locales`, `validate-schema-ranges`, `settings-usage` exit 0; journeys and axe show no new failure against the baseline.
7. `DESIGN.md` and `REVIEW.md` reflect the delivered rules; prior content preserved.
8. Processes started by the review are stopped.

## Round log

| Round | Proposals done | Checks passing | Regressions fixed | Notes |
|---|---|---|---|---|
| 1 | P1 | Overlay contract 240 PASS / 6 FAIL (`round-1/overlay-contract.log`); every "wheel outside panel" and "scroll unlocked" row PASS | - | `ThemeUtils.lockScroll` locks `html`; lightbox, size guide and gallery lightbox route through it. All 6 FAIL rows are the lightbox (P3) |
| 2 | P2 | Quick view Escape and close button return focus to `.product-card__quickview` | - | Trigger stays revealed with `.is-active` while its modal is open (`assets/product-card.css`, `assets/quickview-modal.js`) |
| 3 | P3 | Lightbox 92 PASS / 1 FAIL; the 1 FAIL (`lightbox-1440`, "Execution context was destroyed") reran isolated 23/0 (`round-3/`) | - | Zoom button in Liquid with locale name, `role="dialog"` + `aria-modal`, trap, return, Escape, alt from source image; superseded second init removed. Cause of the one-off FAIL not identified; the round 11 runs log exactly one main-frame `[NAV]` per config (the initial load) |
| 4 | P4, P5, P6 | Overlay 265 / 0 / 7; font, spacing, icon 528 / 0 / 60 (`round-4/`) | - | 500 and 600 faces emitted per font setting; 11 px micro step in `DESIGN.md`; probe floor reads it; both probes listed in `REVIEW.md`; orphan `product-card--special` rules and `stockPulse` keyframes removed |
| 5 | Review | Mobile drawer: 34/34 text nodes in Inter (was 33/34; the slotted "My account" inside `<shopify-account>` used Arial) | - | `assets/mobile-menu.css` sets the body family on `.mobile-menu__action-link`. AntiFan `theme.qa_validate` crashed on `form.id` (an `<input name="id">`); filed through `xd://report_issue` |
| 6 | Review | Share icons render at 1 px stroke at 16 px, like the sprite icons (`stroke-width` 2 -> 1.5) | - | `snippets/share-buttons.liquid` (3 outline icons) |
| 7 | Probe | Overlay 275 / 1 / 7; the 1 FAIL (`lightbox-375`, a 403 console error from `chrome-error://chromewebdata/`) reran isolated 24/0 twice (`round-7/`) | - | Overlay probe now checks that panel text uses a theme font family (body, heading or subheading token), slotted content included; it would have caught round 5. The 403 source was found in round 11 |
| 8 | Review | 375 PDP: no target under 24 px fails WCAG 2.5.8 (`runs/e2e/target-spacing.cjs`, round 11) | - | Product images: 82/96 demo images are 2:3; 14 (bomber jacket 1:1, boots 16:9, 4 at 9:16) are cropped by the fixed `--aspect-ratio-product: 2 / 3`. Needs a setting; left as a question |
| 9 | Triage | AntiFan `theme.qa_validate` on home: receipt `.antifan/qa-receipts/1792211634634-run-e2cf1e19-...json`, FAIL / STRUCTURAL, 46 critical, 0 overflow at 320-1440, Liquid clean, assets 95/95, DOM semantics 95 | - | No theme defect among the 46. 44 px tap and control-height rows: project rule is 24 px (`AGENTS.md`). `tap-target-tiny` rows pass WCAG 2.5.8 (`target-spacing.cjs`, round 11). Header icons 2 px apart are 40x40 each. `title-scale` reflects merchant heading-size settings. `image-crop` is question 1. `OVERLAY_POINTER_EVENTS_NONE` measures closed panels: opened by focus, all 4 megamenu panels have `pointer-events: auto` and their first link receives the pointer. Certification needs visual baselines (not supplied) |
| 10 | Final | Suite (`round-10-final/suite/`): node check 0 FAIL, JSON ok, locales and ranges exit 0, journeys 96/0, axe 0 violations, lifecycle and error paths 0 failures, discovery 13/20/28 (= baseline); `settings-usage` 946 / 0 unread; capture 48/48 with no overflow, broken image or clipping; 375 PDP and home vision show no High issue | - | Run after the last theme edit |
| 11 | Review of the loop | Overlay 276 / 0 / 7 and FSI 560 / 2 / 61, each run alone (`round-10-final/`). **FSI:** the 2 FAIL rows are on the 404 page at 375, in a Polaris panel whose list item reads "TypeError: at ex". That panel is the `shopify theme dev` proxy's own "Failed to render storefront" error page: `@shopify/cli` `dist/chunk-SZI6G247.js` renders `Polaris-List__Item` with `code` set to the stack of the CLI's failed render request. It is a Node-side CLI error, not page JavaScript: no `pageerror` fired, no theme file contains "Polaris", and two isolated reruns of the route are 16 / 0. 11 px text: 36 / 36 rows PASS as micro labels. **Overlay 403:** every config logs 2 `[NAVSTATUS] 403 https://shop.app/accounts/pre_auth?...flow=embed&flow_version=account_menu&target_origin=http://127.0.0.1:9292` lines (26 in all). This is the `<shopify-account>` Login-with-Shop iframe, which refuses the localhost origin; its error page is the `chrome-error://chromewebdata/` 403 from rounds 1 and 7. The probe now drops console errors whose URL is that error page, and logs `[NAVFAIL]`/`[NAVSTATUS]` for the main frame only. Rerun of `lightbox-1440`, `lightbox-375` and `cart-375` with both changes: 72 / 0 / 3, one main-frame `[NAV]` per config, 0 main-frame `[NAVFAIL]`/`[NAVSTATUS]` lines (`overlay-lightbox-filter.log`). **Target spacing:** new `runs/e2e/target-spacing.cjs`. Its self-test fixture fails two 16 px links 4 px apart, passes them at 8 px (centres exactly 24 px apart) and 24 px, and passes an inline link in a sentence. Home and PDP at 375 and 1440: 0 WCAG 2.5.8 failures. **AntiFan:** home receipt with project thresholds (`.antifan/qa-receipts/1792212640579-...json`), 35 critical = 10 console (7 pre-existing plus 3 repeats after the tool's reload: HotReload, `customer-account-main-menu`, shop.app CSP), 6 `tap-target-tiny` (pass 2.5.8 above), 8 `title-scale` (merchant `heading_size`), 3 `image-crop` (question 1), 3 `min-gap` (40x40 header icons 2 px apart, each above 24 px), 4 `OVERLAY_POINTER_EVENTS_NONE` (closed panels, round 9), 1 `icon-stroke-mismatch` (full-colour `payment_type_svg_tag` icons in the footer, not outline icons). The previous run on the same page gave 32: settle failed on `dom` (`domUnstable`, most likely slideshow autoplay), so the number of repeated console lines moves between runs. That difference is not a regression. `font-below-min` is gone at 11 px | - | Probe changes only (`runs/e2e/*`, `REVIEW.md`); no theme file edited after round 10 |

## Unresolved questions

1. Product image ratio. `--aspect-ratio-product` is fixed at `2 / 3` (`snippets/head-design-systems.liquid:215`) and used in 11 places with `object-fit: cover`. 14 of 96 demo images are not 2:3, and the flagship bomber jacket (1:1) loses both sleeves. The options are a merchant setting (adapt, square, portrait; schema, locale and preset change), or re-shooting the 14 images at 2:3. Needs your decision.
2. 18 global settings in `config/settings_schema.json` are never read by any layout, section, snippet, block, template or asset. The check searched for `settings.<id>` or `settings['<id>']` with a word boundary. Families read through computed keys were checked by hand: `float_*` (`snippets/float-social.liquid:38-48`, 48 ids, all read). The `social_*` ids are read literally (`snippets/shop-social.liquid`, `snippets/head-meta-tags.liquid:82`). The schema has no `mega*` ids. The unread 18 are `animations_hover_elements`, `card_style`, `card_color_scheme`, `badge_position`, `sale_badge_color_scheme`, `sold_out_badge_color_scheme`, `brand_headline`, `brand_description`, `brand_image`, `brand_image_width`, `predictive_search_enabled`, `currency_code_enabled`, `cart_type`, `show_cart_note`, `cart_drawer_collection`, `cart_color_scheme`, `product_soldout_text`, `product_contact_text`. The merchant can change them with no effect. This extends the 10 verified in `plans/reports/261014-research-ultra-mvp-submission.md:409-413`; the 8 that report left unchecked are now confirmed unread. `settings-usage.cjs` scans only section and block schemas, so it does not see this class. Each one needs wiring or removal (removal touches `config/settings_data.json`, which needs your approval).
3. `shopify theme check` was not run (needs per-command approval).
4. The AntiFan `theme.qa_validate` DOM scanner crashes on product pages (`form.id` returns the `<input name="id">`). Filed through `xd://report_issue`; until it is fixed a PDP receipt cannot reach CERTIFIED.
5. Not run: real touch devices, Safari, a real screen reader.
