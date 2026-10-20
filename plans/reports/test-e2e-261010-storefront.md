# Test report - 2026-10-10 - Devs2 Rebel storefront, full E2E UX/UI

Outcome: 14 violations found and verified on `shopify theme dev`. Of 97 interaction assertions, 82 pass, 14 fail, and 1 is info. The 14 failures come from 6 root causes in theme code. axe, the hidden-focus probe, and visual review add 7 more theme defects. No fix was applied: the user asked for testing only.

Authority: the user request (`/skill:ak-test` "Test Full E2E UX/UI", rubric `ui-ux-pro-max`), `shopify/AGENTS.md` (Accessibility, Performance, CSS), WCAG 2.2 AA, and Shopify Cart AJAX API behaviour as observed live.

| Contract | Check / command | Observed result | Gap / follow-up |
| --- | --- | --- | --- |
| Every route renders at 3 widths with no page error, broken image, or document overflow | `node runs/e2e/matrix.cjs`: 11 routes x 1440x900, 768x1024, 375x812, with axe-core 4.14.0 | 33/33 return the expected status (404 route returns 404). 0 page errors, 0 broken images, 1 `h1` per page. Missing `alt` only on `/pages/about` (2 per viewport). `overflowX` 0 everywhere, but the check is masked (F6) | Probe must read `body.scrollWidth` when `html` has `overflow-x: clip` |
| Core journeys work by mouse and keyboard | `node runs/e2e/journeys.cjs` (run2 full, run3 rerun after harness fixes) | 82 pass, 14 fail, 1 info | F1-F5 |
| No focusable content inside `aria-hidden` | `node runs/e2e/hidden-focus.cjs` | 1440: 62 of 259 Tab stops sit inside `aria-hidden` subtrees. 375: 9 of 258 | F3, F9 |
| Pending UX/AX round-2 live checks (P9-P12) | Live probes on the same server | P9, P10, P11, and P12 pass live. The P9 base-vs-fix diff was not run | See UX/AX round log |
| Discovery surfaces | `check-discovery-surfaces.mjs http://127.0.0.1:9292 --site-origin https://devs2-rebel.myshopify.com` | Exit 1: 13 errors, 20 warnings, 28 info | All errors are platform-owned, dev-proxy artefacts, or store config (see Classification) |
| AntiFan Theme QA | `theme.qa_validate` on home, tab scrolled to top | `FAIL`, 44 issues, 13 critical. `liquidClean`, `assetsValid`, and `responsive` are true; `overflow.deltaX` is 0; broken images 0 | Scanner artefact (see Classification). Visual parity INCONCLUSIVE |
| Theme Check | `shopify theme check` | Not run | Needs separate user approval |

Source: HEAD `d4a44dd` on `main` plus the pre-existing uncommitted PDP/PLP and UX/AX work: 48 modified files in theme dirs, diff sha256 `69d7fb7c01749780`. There are 3 untracked snippets: `collection-active-filters`, `collection-filter-drawer`, `collection-hero`, sha256 `d5d88f4c4448c44a`. The fingerprint was identical at the first matrix run and at report time. No theme file was edited by this run.

Execution: cwd `E:/Work/shopify`, Node v24.13.0, Playwright 1.60.0, Chrome channel headless, axe-core 4.14.0. Target: the pre-existing user `shopify theme dev` at `http://127.0.0.1:9292`, store `devs2-rebel.myshopify.com`. Runs: matrix `2026-10-09T21:51:06Z`, journeys run2 `22:00:19Z` (90 assertions), run3 `22:09:53Z` (26 assertions), drawer rerun `22:10:54Z` (6 assertions). Production `https://devs2-rebel.myshopify.com/*` answers `302 /password`.

Evidence: everything is under [`test-e2e-261010-storefront/`](test-e2e-261010-storefront/):

- `matrix/matrix.json` and 33 full-page JPEGs
- `journeys/journeys-run2.json`, `journeys-run3.json`, and `journeys-run3-drawer.json`
- `journeys/*-fail.jpg`, one per failing journey
- `journeys/hidden-focus.json`, `journeys/probe-fails.json`, and `journeys/cart-add-accept-probe.json` (discriminating probes)
- `discovery-surfaces.txt`
- `antifan-theme-qa-latest.json`, plus receipts in `.antifan/qa-receipts/`
- `vision/` (contact sheets and crops)

Mandatory gates:

- Completed: render matrix, journeys, hidden-focus probe, discovery scan, AntiFan QA, and vision review.
- Skipped: Theme Check (needs approval) and buy-now journey (dynamic checkout is enabled, so the theme button is not rendered).
- Unavailable: production storefront (password gate).

## Failures

Origin `HEAD` means the defect line exists in `git show HEAD`. `WIP` means it exists only in uncommitted or untracked work. Fixes are proposals only; none were applied.

| ID | Sev | Finding | Evidence | Origin | Proposed fix |
| --- | --- | --- | --- | --- | --- |
| F1 | High | PDP Add to cart shows a raw error toast (`Unexpected token '<', "<!doctype "... is not valid JSON`). The drawer does not open and the header count stays 0, but the line **is** added server-side, so a retry duplicates it. Fails 5 assertions in `pdp-cart-1440` | `assets/product.js:491-495` sends `fetch(cart_add_url)` with only `X-Requested-With`. `cart-add-accept-probe.json` used the same FormData: theme headers → `302` to `/cart` (HTML); with `Accept: application/json` → `200` JSON. The cart held 3 items after the failed attempts. `assets/theme.js:36-38` (`ThemeUtils.request`) and `assets/quickview-modal.js:377` already send `Accept: application/json`. `handleBuyNow` (`product.js:536-539`) has the same request shape [INFERENCE: same failure; not exercised]. `product.js:509,553,561,565` show `error.message` raw and hardcode English fallbacks (`'An error occurred'`, `'Please select a variant'`, `'Sold out'`), which breaks the locale contract | HEAD (`488`, `532`) | Send `Accept: application/json` (or route through `ThemeUtils.request`). Show the locale string instead of `error.message`. Remove the literal fallbacks. Production behaviour is unverified behind the password gate |
| F2 | High | Opening the cart drawer or the mobile menu does not move focus. Tab never enters the trap. Fails `cart-drawer-1440` (focus moves into drawer, Tab x12) and `mobile-menu-375` (focus moved into menu) | `ThemeUtils.trapFocus` (`assets/theme.js:142-170`) calls `firstFocusable.focus()` synchronously. Its filter is `offsetParent !== null` only (`:148`). The first focusables are the backdrop buttons `.cart-modal-overlay` and `.mobile-menu__overlay`. Both are still `visibility: hidden` at that moment because the container transitions `all 0.3s` (`assets/cart-modal.css:11`, `assets/mobile-menu.css:7`). Probe: the same `focus()` succeeds 600 ms later. Escape closing and focus returning to the trigger both pass | HEAD | CSS-first: on open, switch visibility immediately (`transition: opacity .3s, visibility 0s`; on close, delay visibility by `.3s`). Focus the close button or the panel (`tabindex="-1"`), not the backdrop |
| F3 | High | The desktop megamenu stays `aria-hidden="true"` while visible and Escape does not close it. The trigger keeps `aria-expanded="false"` while keyboard-open. Fails 2 assertions in `megamenu-1440` | The static `role="menu" aria-hidden="true"` is at `snippets/megamenu.liquid:29`. Open state is CSS `:hover`/`:focus-within`/`.is-open` (`assets/megamenu.css:58-63`). `assets/megamenu.js:26-32` binds click, focusin, and resize only, with no keydown handler and no ARIA sync. Hidden-focus probe: 8 focusable links inside the hidden dropdown at 1440. `role="menu"` has no `menuitem` children | HEAD | Disclosure pattern: drop the static `aria-hidden` and `role="menu"`. Toggle `aria-expanded` on the trigger. Escape closes and returns focus to the trigger |
| F4 | Medium | The mobile filter drawer (PLP 375) has no dialog semantics, gets no focus, and ignores Escape. Fails 3 assertions in `plp-filter-375` | `snippets/collection-filter-drawer.liquid:8`: `div#CollectionFilterDrawer` has no `role`/`aria-modal`. `assets/collection.js:419-441` toggles only `is-open` and body overflow. The only Escape handler is for the filter modal (`collection.js:597-603`) | WIP (file untracked) | `role="dialog" aria-modal="true" aria-labelledby`. Use `ThemeUtils.trapFocus`/`releaseFocus` after F2. Add an Escape handler |
| F5 | Medium | Quick view is mouse-only. With focus inside the card the button stays `visibility: hidden; opacity: 0`, so it cannot receive focus. Fails 1 assertion in `quickview-1440` | The reveal selector is only `.product-card__media:hover .product-card__quickview` (`assets/product-card.css:31`). The product link remains as an alternative path | HEAD | Add `.product-card__wrapper:focus-within .product-card__quickview` to the reveal rule |
| F6 | Medium | Content is clipped at 375 px (WCAG 1.4.10), and the clipping is hidden by `html { overflow-x: clip }`. Article: the comparison table's third column is cut off and cannot be scrolled; headers break mid-word (`APPLICATIO N`, `Replace ment`). PDP and article: the last share button ends at x 391-395 | `assets/article.css:153` sets `min-width: 36rem` on the `display: block; overflow-x: auto` table, so the scroll box itself is 576 px wide. `article.css:172` sets `overflow-wrap: anywhere` on cells. `assets/share-buttons.css:6-8` is flex without wrap. Live: `body.scrollWidth` 591 on the article and 395 on the PDP. Crops: `vision/article375-table.jpg`, `vision/pdp375-share.jpg` | HEAD | Remove the `min-width` from the block table so its rows scroll inside it. Use `overflow-wrap: break-word` for cells. Add `flex-wrap: wrap` to the share items |
| F7 | Medium | Compare-at price contrast is 3.26:1 (`#878683` on `#F5F2ED`, 13 px). axe `color-contrast`: 15 route-viewports, 36 nodes (home, all, collection, product, search) | `assets/product-card.css:179-182` uses `.product-card__price-compare { opacity: 0.55 }` | HEAD (opacity) | Replace the opacity with a token colour measured at 4.5:1 or more on every scheme |
| F8 | Medium | The about page image-with-text images render with no `alt` and lose `class` (axe `image-alt`, critical, 6 nodes) | A filter inside an `image_tag` argument splits the chain at `sections/image-with-text.liquid:26`: `alt: section.settings.image.alt \| default: shop.name, loading: ..., class: ...`. `image_tag` receives `alt: nil`, and the remaining arguments go to `default`. Live: `alt` null, `class` null. The same pattern appears at `sections/multicolumn.liquid:50`, `sections/logo-list.liquid:53,77`, and `sections/video.liquid:70` [static; those blocks have no images on the tested routes] | HEAD | `{%- assign img_alt = section.settings.image.alt \| default: shop.name -%}`, then pass `alt: img_alt`. Apply the same fix at the 3 other sites |
| F9 | Medium | Focusable controls inside `aria-hidden`: the hero pagination bullets (6 Tab stops at 1440, 9 at 375) and the duplicated marquee track (48 Tab stops at 1440). axe `aria-hidden-focus` reports these as incomplete | `sections/slideshow.liquid:161` (`section-slideshow__pagination" aria-hidden="true"` with `clickable: true`) and `sections/marquee-products.liquid:48` (duplicate list `aria-hidden="true"` containing cards) | HEAD | Make the duplicate marquee list `inert`. Remove `aria-hidden` from pagination that has clickable bullets |
| F10 | Low | Label in Name (WCAG 2.5.3) on 33 route-viewports, 64 nodes. The header cart button is labelled `Open cart` while its visible text is the count. Product-card media links are labelled `View product <title>` while badge text (`Sold out`, `-17%`) is visible inside them | `sections/header.liquid:43,52` and `snippets/product-card.liquid:62` | HEAD | Use a locale label that includes the count. Make the in-link badge `aria-hidden` or move it out of the link |
| F11 | Low | Swiper pagination bullets are 8x8 px on `/collections/all` and the collection page (axe `target-size`, 46 nodes; WCAG 2.5.8) | `assets/collection.js:769-772` (`clickable: true`) with the default bullet size | HEAD | Pad the hit area to 24x24 and keep the visual dot |
| F12 | Low | PDP recommendations: a `ul.swiper-wrapper` whose `li` children get `role="group"` from Swiper (axe `list`, 3 nodes) | `sections/product-recommendations.liquid:21` and `snippets/product-viewed.liquid:4` | HEAD | Use a `div` wrapper, or set Swiper `a11y.slideRole: 'listitem'` |
| F13 | Medium (UX) | PDP colour swatches show two identical "no image" placeholders. Only the label text tells "Matte Obsidian" apart from "Stealth Slate" | `snippets/product-variant-picker.liquid:76-86` renders `product-variant-picker-image` for swatch options that have no native swatch. `assets/variant-picker.js:461-463` falls back to `themeConfig.no_image_product`. The demo variants have no images. Crop: `vision/pdp-swatch.jpg` | HEAD (data-triggered) | When a value has no swatch and no variant image, render the text pill used for Size |

Info (not failures):

- Cart line removal uses native `window.confirm` (`assets/cart.js:207`). After accepting it, the empty state, the count 0, and the server count 0 are all correct.
- The search page shows the total (`5 results found`, `sections/main-search.liquid:22`) and the per-tab count (`3 results found`, `:66`) at once.
- `og:image:alt` is missing on 8 product pages (discovery warning).

### Classification of non-theme signals

| Signal | Count | Classification and reason |
| --- | --- | --- |
| Storefront API `graphql.json` 400 and `[shopify-account] Menu "customer-account-main-menu" not found` | 66 responses, 66 console messages | Store config. `sections/header.liquid:93` defaults to a menu handle the store does not have. Create the menu or select an existing one |
| `shop.app` 403 (`pre_auth`, `pay/hop`), CSP `frame-ancestors`, `origin_trials` CORS, `checkout-web` asset failures | 99 + 33 + 32 + 5 | Platform (Shop Pay / dynamic checkout on a dev proxy origin) |
| `ERR_INSUFFICIENT_RESOURCES` | 5 | Local browser pressure during full-page capture |
| Discovery errors on `/agents.md` (title, description, viewport, og:image) | 5 | Platform-owned route |
| Discovery `og:image must be an absolute URL` | 8 | Dev-proxy artefact. The source emits `https:{{ ... \| image_url }}` (`snippets/head-meta-tags.liquid:65-67`). The proxy rewrites `https://<shop>/cdn` to `/cdn` while canonical stays absolute. Production check blocked by the password gate |
| Discovery `missing og:image` on `/` | 1 | Store config: no social sharing image in Online Store Preferences, so `page_image` is nil on home |
| AntiFan layout-integrity `offscreen` (38) and `introducedRegressions` (10) | 48 | Scanner artefact. The cards at y 3152 belong to the animated marquee track (`marquee_products`, not Swiper). The real a11y issue is F9 |
| AntiFan HS-05 relative featured image URL | 1 | Dev-proxy artefact (same as the og:image row) |
| Harness defects found and fixed during the run: `shopify-account` focus read across shadow DOM; `confirm()` auto-dismissed by Playwright; drawer asserted before async lines loaded | 3 | Harness. The run2 failures are kept in `journeys-run2.json`. The reruns (run3) pass for these checks |

Coverage:

- Routes: home, collection, all products, product, cart, search, about, contact, blog, article, 404.
- Journeys:
  - 1440: skip link and focus ring, megamenu, search, PLP filter/sort/back, quick view, PDP variant/quantity/cart, cart drawer, footer, TOC, contact form.
  - 375: mobile menu, search, PLP filter, footer, TOC, 404.
- No coverage threshold is configured for theme E2E.

Changes: none applied to theme code. A proposed fix for each failure is listed above. New durable artefacts: this report, the evidence directory, and one appended round-log row in [`enhance-ux-ax-261009-2342-storefront.md`](enhance-ux-ax-261009-2342-storefront.md).

Costs (measured wall time): run3 41.3 s; drawer rerun 14.8 s; hidden-focus probe 32.6 s; failure probes 34.6 s; discovery scan about 26 s. Matrix per-route load time: median 4257 ms, max 15648 ms. The total wall time of the matrix and run2 was not recorded.

Cleanup: every Playwright browser was closed by its script. No server was started. The pre-existing `shopify theme dev` and the AntiFan tab `0ce8a709` (navigated to `http://127.0.0.1:9292/`) were left running. The harness stays in `runs/e2e/` (gitignored: `matrix.cjs`, `journeys.cjs`, `lib.cjs`, `hidden-focus.cjs`, `probe-fails.cjs`, and its own `node_modules`) for re-verification after fixes.

Limitations:

- Production is password-gated, so F1 and the OG/HS-05 rows are verified on the dev proxy only.
- Journeys ran at 1440 and 375; 768 is covered by the render matrix only.
- No real screen reader was used.
- Buy-now and accelerated checkout were not exercised.
- No CWV telemetry and no Theme Check.
- The UX/AX P9 base-vs-fix computed-style diff was not run, because no base snapshot exists. Creating one needs an approved second dev theme.

## Re-verify after fixes

```bash
E2E_ONLY=pdpVariantCart,cartDrawerHeader,megamenuDesktop,mobileMenu,plpMobileFilter,quickview E2E_TAG=fix node runs/e2e/journeys.cjs
node runs/e2e/hidden-focus.cjs
node runs/e2e/matrix.cjs
```
