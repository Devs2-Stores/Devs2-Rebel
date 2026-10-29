# Rebel vs the six newest free Shopify themes - summary (2026-10-29)

Compared themes: Fabric, Savor, Vessel, Dwell, Tinker, Pitch (`themes.shopify.com/themes?price[]=free&sort_by=newest`). All six are Horizon 4.3.0; their assets, blocks, snippets, section Liquid and layout are byte-identical, and only config, the two section groups and 12 JSON templates differ (`00-setup.md`). A "Horizon" claim below therefore covers all six.

Slice reports, each with `path:line` evidence on both sides:

- `01-architecture-editor.md` (21 gaps)
- `02-product-cart.md` (11)
- `03-navigation-collection.md` (17)
- `04-visual-presets.md` (13)
- `05-engineering-perf-a11y-seo.md` (13)

## Controller verification

Every Must item and a sample of Should items were re-checked against the repo before inclusion.

| Claim | Check | Result |
|---|---|---|
| Reveal on scroll does nothing | Searched `animate--enabled` and `animations_reveal_on_scroll` across assets, snippets, sections, blocks and layout | Only `layout/theme.liquid:13` sets the class; nothing consumes it. Confirmed. |
| Dawn-shaped global settings | Compared `id` sets with `_reference/dawn` and `_reference/fabric` | 96 of 170 Rebel ids are shared with Dawn and 10 with Horizon. Group order matches Dawn. Confirmed. |
| Dawn-derived code | Line match on the 42 files sharing a name with Dawn | About 2,100 of 47,453 Rebel code lines (4 %) match Dawn, mostly schema blocks. The resemblance is in the settings model, not the code. |
| Quick add on multi-variant cards | `snippets/product-card.liquid:138-145` | Posts `variant.id` with no option choice. Confirmed. |
| No cart discount-code input | Searched cart snippets and `cart-modal.js` | Applied discounts are listed only. Confirmed. |
| No footer policy links | Searched `policies` in `sections/footer.liquid` and the footer group | No `shop.policies` loop. Confirmed. |
| E5: `rel=expect` blocks render for nothing | `snippets/head-meta-tags.liquid:7,18` | Partly true. The meta opt-in is obsolete, so no view transition runs. However, the 2026-10-21 A/B showed the blocker is not the cause of the first-paint stall, so the cost is small. Downgraded to Could. |

## Priority list

### Must: fix before submitting

1. **Make the "Reveal sections on scroll" setting work, or remove it.** The setting has no effect, yet the About page reveal runs regardless. A reviewer only needs to toggle it once to see this (04 #1).
2. **Quick add must not silently pick the first variant.** For a multi-variant card, open quick view or a choose-options step; one-click add stays for single-variant cards only. In the demo, 9 of 20 cards on `/collections/all` are multi-variant (03 #1).
3. **Reduce how much the global settings model looks like Dawn.** The requirements exclude themes "built on or derived from Dawn or Horizon". The code is not derived, but the settings panel reads as Dawn's: 96/170 ids and Dawn's group order (04 #2, 01). This is a reviewer-perception risk. Merging or renaming groups changes the settings contract, so it needs a migration of `settings_data.json` and presets in the same change.

### Should: these close the main gap with Horizon

| # | Gap | Source | Size |
|---|---|---|---|
| 4 | No reusable theme blocks (text, heading, button, image, group) and no composer section; 60 section-local block schemas are copy-pasted | 01 #1-2 | L |
| 5 | Discount-code field in the cart drawer and cart page | 02 #1, 01 #15 | S-M |
| 6 | Footer policy links (`shop.policies`) and a composable footer | 03 #12, 01 #3 | S / M |
| 7 | Transparent header over the home hero, plus header layout options | 03 #3-4, 04 #5 | M |
| 8 | Filter media by variant (`hide_variants`) and a stronger zoom (thumbnails, pinch/drag) | 02 #2-3 | M |
| 9 | Cart drawer a11y: focus after removing a line, live region announcing the new total | 02 #7 | S |
| 10 | `<header>`/`<footer>` landmarks; `aria-label` on the two unlabelled navs | 05 E1 | S |
| 11 | Mobile filter drawer: "See N items" apply button; sort and filter in one row (first card at y=432 vs 252) | 03 #7 | S-M |
| 12 | Mega menu with collection images or featured products | 03 #2 | M |
| 13 | Predictive search empty state (best sellers, recently viewed) and prices on by default | 03 #6 | S-M |
| 14 | Display type scale and per-level type controls (largest heading 48 px vs 88-208 px) | 04 #3, 01 #13 | M |
| 15 | Preset quality: featured product renders 0 px when blank; before/after is 1975 px tall with no ratio setting | 04 #8-9 | S |
| 16 | Editor: `shopify:block:select` so the selected slide or tab is shown; `visible_if` for conditional panels (12 vs 631) | 01 #10-11, 05 E7 | S-M |
| 17 | `disabled_on` header/footer for content sections | 01 #12 | S |
| 18 | Global settings to turn quick add, quick view and the hover image on or off | 01 #16, 03 #11 | S |
| 19 | Country/language selector in the header and mobile drawer | 03 #5 | M |
| 20 | 19-26 per-section CSS links; `product-card.js` loaded 3× on the PDP; fixed `sizes` on product cards | 05 E4, E8 | S-M |
| 21 | Content lists have no bento, editorial or carousel layout; visual sections cannot use video | 04 #6-7, 01 #8 | M |

### Could: polish

Fly-to-cart animation; grid density on mobile; card swatches that change the card image; announcement bar speed and pause; combined listings; volume pricing (B2B); horizontal desktop filter bar; infinite scroll on search; view transitions via `@view-transition` (no reduced-motion gate, per the project rule); non-linear easing tokens; shorter home composition (15 sections / 10,567 px vs 3-8 sections in Horizon); morphing instead of `innerHTML` swaps; `ProductGroup` JSON-LD; native `<dialog>`; logical properties for RTL; LiquidDoc on the remaining 26 snippets.

## Where Rebel already matches or beats Horizon

- **Lighter pages:** theme JS 54-67 KB vs 95-108 KB, CSS 206-219 KB vs 401 KB, HTML 252-272 KB vs 442-516 KB, CLS ≤0.009 vs up to 0.114 (05).
- **Better hero LCP handling.**
- **Keyboard behaviour:** cart, menu and search dialogs move focus in, trap Tab, close on Esc and return focus.
- **Readability:** body text 16/24 px vs 14/19.6, focus ring 2 px vs 1, CTA buttons 48 px tall vs a 20 px text link.
- **Slideshow pause button.**
- **Storytelling sections Horizon does not ship:** testimonials, parallax, layered images, counter, timeline, team, countdown hero.
- **Product-card hover on par.**

## Limits

- No live Theme Editor session; editor behaviour is read from code and marked `[INFERENCE]` in the slice reports.
- The 768 px viewport was not captured. The Rebel demo has few colour variants, so card swatches were not seen live.
- No axe-core sweep. Rebel byte sizes are corrected from the dev proxy, not measured on the published store.

## Fixed after this report (2026-10-29)

| Must item | Change | Evidence (dev server, 1440 and 375) |
|---|---|---|
| 1. Reveal on scroll | New `assets/reveal-on-scroll.js`, loaded only when the setting is on; CSS in `assets/base.css`. The About page's own reveal (`page-about.js`, `page-about.css`) is deleted along with its loaders in `head-script.liquid` and `head-stylesheets.liquid`. | Home: 13 of 15 sections below the fold get `reveal-item`, 0 above the fold are hidden, all 13 reveal after scrolling, 0 left with opacity below 1 or a residual transform, 0 page errors. About: 0 `about-reveal-item`, 6 `reveal-item`. A first run with fill `both` left a transform on 13 sections; fill `backwards` fixed it. |
| 2. Quick add | `snippets/product-card.liquid`: one-click add only when `product.has_only_default_variant`; otherwise a choose-options button opens quick view, or links to the product when quick view is off. Reuses `products.product.choose_options`. | `/collections/all`: 11 add forms, 9 choose-options buttons. Clicking one opens the modal and the cart count stays 0. Locale and range validators exit 0; `node --check` passes. |
| 3. Dawn-shaped settings | Done after approval: 96 global ids renamed to the `<component>_<property>` scheme (see Final state). | Renamed-id HTML oracle: 0 diff on 14 routes; positive controls for `button_corner_radius`, social links, sameAs and float-social. |

First-pass QA (1440): `FAIL / STRUCTURAL`, 5 critical, all scanner classes; superseded by the Final state below.

Reveal caveat: with the setting on, a capture that never scrolls shows sections below the first screen at opacity 0. Print is reset in `base.css`; `REVIEW.md` now says to scroll before a full-page capture.

Not done: `shopify theme check` (needs your approval), `dist/rebel-v1.0.0.zip` not rebuilt, demo store not synced from this tree.

The unpublished "Fabric" theme (#160966344775) left on the demo store by the comparison was deleted on 2026-10-29. The store now has Horizon, Rebel (MAIN) and Development.

## Final state (2026-10-29)

Commits (local, not pushed): `05f7489` theme code, `125b0d8` this report.

Gates on the dev server (375, 768, 1440), run serially after the merge:

| Gate | Result |
|---|---|
| `runs/e2e/journeys.cjs` full suite, then `plpSortFilter` and `notFound` rerun after fixes | rerun 11 pass, 0 fail |
| `target-spacing.cjs` | 18 runs, 0 failing |
| `overlay-contract.cjs` | 276 pass, 0 fail |
| `font-spacing-icon.cjs` | 564 pass, 0 fail |
| axe-core, 12 real routes | 0 violations, 0 overflow |
| axe-core, `/blogs/news` and two articles | 0 violations, 0 overflow |
| validate-locales, validate-schema-ranges, settings-usage, `node --check`, JSON parse | exit 0 |

Gate evidence that was NOT valid: the first axe run listed `/blogs/sustainable-fashion-eco-tech/...` and `/account/login`. Those return 404 on the demo store, so those 3 rows scanned a 404 page. They were replaced by the `/blogs/news` rows above. `/account/login` has no replacement.

`theme.qa_validate` (bound tab, `workspaceRoot` = repo): `FAIL / STRUCTURAL`, no `CERTIFIED` receipt on any route.

| Route | Critical | What remains |
|---|---|---|
| `/` | 6 | 4 closed-megamenu `pointer-events: none`, 1 hero heading 36 px vs 30 px (intended), 1 image crop (demo photo ratio) |
| `/collections/all` | 7 | 4 megamenu, 2 image crop (demo photo ratio) |
| `/products/rebel-tactical-bomber-jacket` | 5 | 4 megamenu, 1 thumbnail crop |
| `/cart` | 4 | 4 megamenu |

These classes were triaged as scanner misreads or demo-content in the 2026-10-21 review. The gate stays open.

Real defects found by the gates and fixed: facet "Clear" link 21 px (now 24 px), view and density buttons 6 px apart (now 8 px), footer policy links under 24 px (now 24 px via `.footer-policies__link`), pagination label printing `{{ number }}`, JSON-LD `sameAs` covering 6 of the 13 footer networks (now the same 13).

Not verified: product `tab` block switching on a real product. The three demo products have one tab, so switching was not exercised; the handler and `data-tab`/`data-panel` pairing were read, not clicked.

Disclosure: during the VisualE slice an agent uploaded a 4 s test clip to the demo store through the Admin API (staged upload) and deleted it afterwards, per its own report (`fix-VisualE.md`). That was a store write the project rules reserve for approval. A read-only check that the Files list holds no `visuale-test-clip` has not been run.

Pending for you: `shopify theme check` (exact command: `shopify theme check`, needs separate approval), then rebuild the package and sync the demo store.
