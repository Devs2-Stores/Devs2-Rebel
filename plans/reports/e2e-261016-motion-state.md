# E2E UX/UI/Motion/Hover/State - Rebel - 2026-10-16

Status: **DONE_WITH_CONCERNS**. Every runtime phase ran against a live
`shopify theme dev` (`http://127.0.0.1:9292`, theme HTML verified on `/`,
`/collections/all` and the PDP before each run). Two theme defects found in quick
view; three static motion findings. Nothing committed or pushed.

## Run history

- `suite/` is **INVALID**. The dev session expired mid-run, and every route
  returned `401 {"error":"unauthorized"}`. Superseded by `suite-2/`.
- `runs/e2e/lib.cjs` `gotoStore` now throws `DEV_SERVER_UNAUTHORIZED` on a 401. Set
  `E2E_GATE_WAIT_MS` to bound the `/password` wait. One probe run hung on the
  intermittent password gate and was rerun with `E2E_GATE_WAIT_MS=60000`.

## Results

| Check | Result | Evidence |
|---|---|---|
| `node --check`, JSON parse | 34/34, 96/96 | `suite-2/node-check.txt`, `suite-2/json-parse.txt` |
| Locales, ranges | exit 0, exit 0 | `suite-2/validate-*.txt` |
| Journeys | 96 PASS / 0 FAIL / 1 INFO (buy-now uses dynamic checkout) | `suite-2/journeys-after.log` |
| Lifecycle (facet, contact, cart trigger, section reload, error paths) | all pass, no raw error strings | `suite-2/*-after.json` |
| axe, 15 routes x 375/768/1440 | 0 violations, 0 overflow | `suite-2/axe.json` |
| Discovery | 13/20/28, same as the known platform/dev-proxy baseline | `suite-2/discovery.txt` |
| Motion/hover/state probe | 93 PASS / 3 FAIL (all Q-01/Q-02) / 6 INFO | `motion-state.json` |
| Tab walk, 10 routes x 375/1440 | 0 invisible stops, selftest true | `tabwalk.json` |
| Touch hover (forced `:hover` on touch) | 0/22 decorative changes on touch, 5/22 on desktop, control 9/9 | `touch-hover.json` |
| Capture, 16 routes x 1440/768/375 | 48/48: 0 overflow, 0 broken images, 0 clipped, 0 page errors, 0 missing translations; visual review clean | `capture/` |

Probe coverage: overlays (cart 1440, search 1440/375, mobile menu 375, quick view
1440, filter drawer 375, float social 1440), button/card/megamenu/link hover,
and state (variant pill + URL, PDP tabs, add-to-cart busy/rest, header count,
drawer open, drawer quantity +, sticky header, back-to-top, slideshow, animation
inventory, motion tokens).

## Defects

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| Q-01 | Medium | Quick view opens and closes with no motion. Removing `.hidden` flips the wrapper from `display: none` in the same frame, so the panel's `translateX(110%)` has no start state. On close, `scale-95`/`opacity-0` have no CSS, and `.hidden` is added after 300 ms, so the panel holds then vanishes. Every other overlay animates. Pre-existing: HEAD has the same `display: none` rule. | `assets/quickview-modal.css:22-24`; `assets/quickview-modal.js:118-127,144-156`; probe `{"distinct":2,"ms":47}` open, `{"distinct":2,"ms":22}` close |
| Q-02 | Medium | After closing quick view, focus drops to `body` (WCAG 2.4.3). `trapFocus(this)` stores the card's quick view button as the return target, but that button is `visibility: hidden` once the card loses `:focus-within`, so `releaseFocus` cannot focus it. | `assets/quickview-modal.js:120`; `assets/theme.js:192,202-204`; probe: active element after Escape = `body.gradient.animate--enabled` |
| M-01 | Medium | Global settings `animations_reveal_on_scroll` and `animations_hover_elements` have no effect: `body.animate--enabled` has no CSS/JS consumer, and the hover setting has none at all. Pre-existing at HEAD. | `layout/theme.liquid:18`; `config/settings_schema.json:326-348` |
| M-02 | Low | 69 transition durations are hardcoded instead of `--transition-*` / `--duration-*`. | static scan; most in `slideshow.liquid`, `mobile-menu.css`, `product.css`, `quickview-modal.css`, `swiper.css` |
| M-03 | Low | Dead legacy hover zoom `.card .card__wrapper:hover ... img`; no `.card` markup. | `assets/theme.css:260-266` |

## Not defects

- Float social is not rendered: `float_social_enable: false` in
  `config/settings_data.json:206`. The probe covers it but could not exercise it.
- The product template has one tab block, so the tab ArrowLeft check did not apply.
- Home has no outline `.button-primary`, and PDP/contact have no other button
  variant, so those hover cases were absent.
- Fixed probe false positives: `html/body { overflow-x: clip }` at rest
  (`assets/reset.css:20,29`) read as a scroll lock; the home `.button-secondary`
  is the skip link; the first footer link is the logo, now excluded with
  `:not(.footer-logo)` (rerun passes; all 11 text links change colour and
  underline on hover).
- One run timed cart close at 932 ms; it passed in the other two runs.

## Not run

`shopify theme check` (needs approval), Lighthouse, real devices, webviews.
