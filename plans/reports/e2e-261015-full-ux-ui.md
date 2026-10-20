# E2E UX/UI - Rebel - 2026-10-15

Scope: full project E2E suite (`runs/e2e/r10-final.sh`) plus the REVIEW.md supplementary checks, run against `shopify theme dev` at `http://127.0.0.1:9292`. It follows the `ak:fix --ultra` pass on the two Medium Theme Store findings (title truncation, collection description truncation). Evidence lives in `plans/reports/e2e-261015/`.

## Verdict

Every gate passes on the final code. Three defects found during the run were fixed and re-measured. Three red results were traced to the environment and cleared on rerun with evidence. The AntiFan `theme.qa_validate` verdict stays `FAIL`. Its critical items are the known pre-existing console messages plus a scanner crash in the tool, which was reported.

## Results

| Check | Result | Baseline (2026-10-11 round 10) |
|---|---|---|
| `node --check` assets/*.js | 34 ok, 0 fail | 34 ok |
| JSON parse (locales, config, templates, sections, listings) | 96 ok, 0 fail | ok |
| `validate-locales.mjs` | exit 0, 100% resolved | exit 0 |
| `validate-schema-ranges.mjs` | exit 0, 100% valid | exit 0 |
| `settings-usage.cjs` | 946 settings, 0 unread | 947, 0 unread |
| Journeys | 94 PASS, 2 FAIL, 1 INFO; both FAILs cleared on rerun (see below) | 96 PASS |
| axe-core (15 routes x 375/768/1440) | 45 route-viewports, 0 violations, 0 overflow | 0 |
| Discovery surfaces | 13 errors / 20 warnings / 28 info, line-identical to baseline | 13 / 20 / 28 |
| facet, contact, cart-trigger, section-reload lifecycles | all pass | pass |
| error-paths | locale strings shown, no mojibake (`Ã`/`â€` count 0) | pass |
| Tab walk (10 routes x 375/1440) | `fail 0` after rerun (see below) | `fail 0` |
| Touch hover | desktop 19/21 hover changes, touch 0/21, control 9/9 | pass |
| Carousel + facet scroll | `fail 0`; related 4 slides, viewed 1 slide, single row at 375/768/1024/1440 | pass |
| Store hours | `failures 0`, 0 mismatch across live/fallback/no-offset x 2 time zones | pass |
| Footer newsletter | exit 0; shown on collection/PDP, focus outline 2px | pass |
| `package-theme.py` | 249 files, 0.48 MB | - |
| `shopify theme check` | 250 files, no offenses (run after the F1/F2 edits; the three later edits are CSS/JS only) | 0 errors |

## Defects fixed in this pass

1. **Collection hero left a blank band under the image when the full description is long** (a regression risk of F2). At >= 750 px the banner kept its `aspect-ratio` while the content column grew. Measured at 768 with ratio 16/9: `gapUnderImg` 1378 px. Fix: `assets/collection.css:35-37` `@media (min-width: 750px) { .collection-hero__banner { align-self: stretch; } }`. After the fix, at 768 and 1440 the gap is 0 for `auto`, `16 / 9` and `1 / 1` with both short and long descriptions.
2. **Recently viewed rendered empty slides and broke `:has(> .product-card)`.** `fetchProductHTML` returned the whole Section Rendering response, so each slide held a `div.shopify-section` wrapper. Two slides were empty (`<div id="shopify-section-product-card-ajax">` only) at 3013 px wide. Fix: `assets/product.js:1183-1184` parses the response and keeps only the `<product-card>` element. After the fix, at 1440, 768 and 375 there are 6 slides, every first child is `product-card`, heights are equal (585 / 507 / 551 px) and every price bottom is aligned.
3. **The DESIGN.md do/don't row overstated the rule.** It read as "never truncate the description". Reworded to match the requirement: the description stays reachable in full, rendered whole or behind a Read more toggle (`DESIGN.md:161`).

Advisory probes with no defect: featured-collection grid on `/` and the 404 grid (single price row, `row1PriceSpread` 0 with a long injected title at 1440/768/375), marquee products (`priceSpread` 0), best-sellers and PDP recommendation swipers (`slideSpread` 0, `priceSpread` 0 after `product-card.css:297`).

## Red results traced to the environment

- **Journey `404-375` (2 FAIL):** the dev server answered 502 once. `curl` returned 404 three times, and `E2E_ONLY=notFound` passed 2/2 in two sequential reruns (`journeys/journeys-404-rerun-{a,b}.json`).
- **First supplementary run:** tab walk `stops 1` on 9 of 10 routes at 1440, touch hover `probed=0`, store-hours and carousel-facet exit 2. This ran in parallel with packaging and an AntiFan QA run. Sequential reruns pass. A same-context probe (home walk, then PDP) Tabbed through the header normally.
- **Tab walk `/collections/all` at 1440, `invisible 4`** (`product-card__quickview` / `__add-btn` at opacity 0). Timing probe: the opacity transition stayed `running` with `currentTime` 0 for about 900 ms on the first grid card, then completed. Discriminating probe: frame gaps of 125-333 ms appear with and without the `.swiper-slide:has(> .product-card)` rule (deleted via CSSOM), and no long tasks occur. Headless Chrome stalls raster while grid images enter the viewport, and the walk's 1 s wait expires first. Two isolated reruns: 217 stops, `invisible 0` (`tabwalk-collection-1440-{a,b}.json`).

## AntiFan QA

`theme.qa_validate` on `/collections/outerwear` and `/products/rebel-tactical-bomber-jacket`: verdict `FAIL`, overflow 0, liquid clean, assets valid, settings ratchet ok. The critical items are the known pre-existing console messages (HotReload socket, `customer-account-main-menu`) plus the dev-proxy CORS on `origin_trials`. On the PDP the DOM semantics scanner crashed with `el.id.trim is not a function`, so the tool reported `execution: DEGRADED`. This was reported as a tool defect.

## Not run / open

- `shopify theme check` was not re-run after the last three asset edits. Rerunning it needs approval.
- Lighthouse, real devices and webviews were not run.
- `buy-now-1440` stays INFO: `show_dynamic_checkout` renders the platform payment button.
- Nothing is committed or pushed.
