# UX/AX review: Devs2 Rebel (Shopify OS 2.0 base theme) - 2026-10-21

## Verdict

DONE_WITH_CONCERNS. All five rounds are closed and the close pass is done. The four Must proposals pass their acceptance checks. P5-P19 are implemented except P15 (rejected with evidence) and P17 (carried below). Final suite after the close pass: node 0 FAIL, JSON 0 FAIL, locale and range validators exit 0, axe 0 violations on 45 route-viewports, lifecycles done. Journeys 93/3, with all three failures in `search1440`; that journey passes 17/0 on two isolated reruns, so it was a timing flake (the run took 1621 s against 781 s before). REVIEW.md gates: `settings-usage` exit 0, `target-spacing` 36 runs 0 failing, `overlay-contract` 276 pass / 0 fail, `font-spacing-icon` 563 pass / 1 fail (classified in the close row). `shopify theme check` (approved): 244 files, no offenses. Round-5 capture: 48/48 with 0 overflow, 0 clipped text, 0 broken images. One gate stays open: no AntiFan receipt is `CERTIFIED`; every touched route is `FAIL` / `STRUCTURAL` with classified findings only, which is not a pass. This review does not change the Theme Store blockers outside the code: docs/support URLs, the client transfer demo store, passwordless Lighthouse.

## Scope and environment

- Mode: `--auto --audit --loop 5`. Focus: Theme Store readiness of the Rebel preset as a shopper and a reviewer see it.
- Running theme: `shopify theme dev` at `http://127.0.0.1:9292` (user-started on `devs2-rebel.myshopify.com`, development theme `#187420049517`). The demo store `rebel-streetwear-hn0q7d9h.myshopify.com` is used only to cross-check platform output.
- Git: `--git-dir=.git-nested`, branch `main`, HEAD `81c1636` before this review, theme directories clean.
- Evidence folder: `enhance-ux-ax-261021-0253-theme-store-audit/round-N/` (`suite/`, `capture/`, `qa/`, `vision-*.md`).
- Not run: real touch devices, Safari, a screen reader. `shopify theme check` ran once after user approval, at close.
- `prefers-reduced-motion` is forbidden in this workspace (`AGENTS.md` section 5), so the reduced-motion check from the skill does not apply.

## Baseline evidence

- Capture: 16 routes x 3 viewports (1440x900, 768x1024, 375x812), 48/48 status as expected, 0 horizontal overflow, 0 clipped text, 0 broken images (`round-1/capture/run.log`).
- Suite (`round-1/suite/`): `node --check` 0 fail, JSON parse 0 fail, locales and range validators exit 0, journeys 95 pass / 1 fail (`pdp-cart-1440 :: removing all lines shows empty state`), axe 0 violations on 45 route-viewports, facet/contact/cart-trigger/section-reload/error-path lifecycles done.
- Discovery scan exit 1: 13 errors, none theme-caused. Relative `og:image` exists only behind the dev proxy (the demo store serves `https://...myshopify.com/cdn/...`); `/agents.md` is a platform URL in the store sitemap; the home `og:image` comes from the store's social sharing image, which the demo store has and the dev store lacks.
- AntiFan `theme.qa_validate` (build-strict) on 10 routes: every receipt `QA_FAILED` / `STRUCTURAL`.
- Vision review: `round-1/vision-baseline.md` (50 findings, ui-ux-designer subagent).

## Scores (baseline)

| Area | Score | Evidence |
|---|---|---|
| First impression | 1 | Hero text starts at `opacity: 0` until Swiper loads (`assets/section-slideshow.css:159-166`); tablet and mobile first paint show no headline or CTA. |
| Brand recall | 2 | Bone/black/oxblood, square media, crimson add-to-cart hold together. |
| Content punch | 2 | Specific tailoring copy; merchant-instruction text on the FAQ page. |
| Clarity and hierarchy | 2 | One primary on PDP; Best Sellers carousel ahead of the collection grid. |
| Storytelling | 2 | Home order is strong; blank featured product and blog sections break it on a fresh install. |
| Knowledge and trust | 1 | FAQ "Still need help?" block has no action; data gaps on the dev store. |
| Motion | 2 | Intentional reveal motion; hero entrance fade delays the LCP slide. |
| Responsive | 2 | Clean grid steps; one-card carousels at 375; tables break mid-word on mobile. |
| Accessibility | 2 | axe 0; article meta links and blog tags are under 24 px tall. |
| Discovery (AX) | 2 | Server-rendered HTML, canonical, JSON-LD and OG present; `og:image:alt` missing. |

## Scores (after round 5)

| Area | Baseline | After | Evidence |
|---|---|---|---|
| First impression | 1 | 2 | Slide 1 heading and CTA opacity 1 with scripts blocked; CTA bottom at y792/893/705 inside the 900/1024/812 viewports. |
| Brand recall | 2 | 2 | Unchanged palette and media; icon strokes unified at 1.5. |
| Content punch | 2 | 2 | FAQ merchant-instruction copy gone; one brand-age story ("Since 2015", 10+ years); footer tagline on-brand. |
| Clarity and hierarchy | 2 | 2 | Collection preset drops the duplicate Best Sellers carousel; one H1 weight token. |
| Storytelling | 2 | 2 | Blank featured product and blog sections render nothing on the storefront. |
| Knowledge and trust | 1 | 2 | FAQ help block renders only with a contact method; blank SKU/barcode rows hidden instead of "N/A". |
| Motion | 2 | 2 | Hero text no longer waits for Swiper; counters show their real value without JS. |
| Responsive | 2 | 2 | 2-card mobile carousels, article tables scroll with headers on one line, breadcrumb on one line at 320/375; mobile collection toolbar still 3 rows. |
| Accessibility | 2 | 2 | axe 0; article, blog-tag and gift-card toggles reach 24 px; sold-out pills readable. Not run: screen reader, real touch devices. |
| Discovery (AX) | 2 | 2 | `og:image:alt` and `twitter:image:alt` added; relative `og:image` on the dev proxy only. |

## Proposals

Must (Round 1)

- P1 - Hero text visible without JavaScript. Evidence: `section-slideshow.css:159-179` hides subheading/heading/text/buttons until `.swiper-slide-active`, which Swiper adds only after `swiperReady` loads; vision #1, #5. Change: hide slide text only under `.swiper-initialized`; preset hero heights 85/80 so slide 1 copy sits above the fold at all three viewports. Files: `assets/section-slideshow.css`, `templates/index.json`, `listings/rebel/templates/index.json`. Acceptance: with scripts blocked, slide 1 heading and CTA have opacity 1; first-paint captures show the heading and CTA at 1440, 768 and 375.
- P2 - Product media keep their own aspect ratio. Evidence: `assets/product.css:74` forces `--aspect-ratio-product` (2/3) with `object-fit: cover`; the flagship product's six 1:1 images lose 33.3% (QA image-crop). Requirement 259: "All product images must be displayed and viewable. Different image ratios shouldn't break the layout." Change: main gallery and featured-product images use their intrinsic ratio; thumbnails stay cropped. Files: `assets/product.css`, `assets/section-featured-product.css`. Acceptance: on `/products/rebel-tactical-bomber-jacket` the main image box ratio equals the image ratio (1:1); 2:3 products are unchanged.
- P3 - Tap targets at least 24 px. Evidence: `a.article-template__info-comments` 76x19.5, category link 266x15, blog sidebar tags under 24 px (QA tap-target-tiny, min-gap). Change: min-height 24 px on those links. Files: `assets/article.css`, `assets/blog.css`. Acceptance: QA reports no tap-target-tiny on the article route.
- P4 - FAQ page has no dead end and no merchant-instruction copy. Evidence: `sections/page-faq.liquid:81-115` renders "Still need help?" with no action when phone and email are blank; `templates/page.faq.json` contact form falls back to the schema default "Tell visitors how to get in touch..." Change: render the help block only when it has a contact method; give the FAQ contact form shopper copy in the preset. Files: `sections/page-faq.liquid`, `templates/page.faq.json`, `listings/rebel/templates/page.faq.json`. Acceptance: the FAQ page shows neither string at any viewport.

Should (Rounds 2-3)

- P5 - Blank featured product renders a complete placeholder (title, price, disabled add-to-cart), not an empty grey box (vision #2).
- P6 - Blog posts section with no blog or no posts does not leave an empty heading band (vision #3).
- P7 - Mobile product carousels show two cards with a peek below 750 px (vision #10).
- P8 - Collection template: product grid and filters come before the Best Sellers carousel (vision #11, #13).
- P9 - Header cart count hidden at 0 (vision #43).
- P10 - Rich-text tables scroll horizontally on mobile instead of breaking header words (vision #20).
- P11 - `og:image:alt` from the image alt, falling back to the page title (discovery INFO).
- P12 - One sale-price pattern for price ranges and single prices on cards (vision #12).
- P13 - Disabled variant pills keep the pill radius and readable struck text (vision #16).
- P14 - One H1 weight token across templates (vision #21).
- P15 - No empty row between card title and price (vision #28).

Could (Round 4)

- P16 - Inline SVG icons use the sprite stroke (1.5) so outline weights match (QA icon-stroke-mismatch).
- P17 - Header reserves its final height so the logo does not move 1 px after load (vision #33).
- P18 - Breadcrumb separators never start a line (vision #36).
- P19 - Store locator filter labels fit international stores (vision #42).

Not proposals (with reason)

- Home H1 (vision #24): server HTML has `<h1 class="visually-hidden">Devs2 Rebel</h1>`; the capture counts only visible H1s.
- QA `title-scale`: heading sizes are merchant `heading_size` settings and footer menu titles are eyebrow-styled by design.
- QA `state_matrix` on `button.footer-actions-menu__toggle` (inline disclosure) and `#search-articles-tab` (ARIA tabs): neither is an overlay; reported to the tool owner.
- QA min-gap on `.collection-sort__view-btn`: each button is 36x36 px, so WCAG 2.5.8 is met by size.
- QA image-crop on thumbnails and product cards: thumbnails crop by design; cards have a merchant `image_ratio` setting with `adapt`. The 62.6% crop is the 16:9 `black-combat-boots` demo image.
- Dev-store data (vision #17, #18, #19, #25, #32, #41, #48): inactive gift card, single-link footer menu, truncated seeded comments, hotspot placement, duplicate posts, "Devs2 Admin" author. These need demo-store content work, not theme code.

## DONE contract

1. Every Must proposal is implemented and its acceptance check passes on the running theme.
2. Should and Could proposals are implemented or carried to Unresolved questions with the reason.
3. 48/48 captures at 1440x900, 768x1024 and 375x812 show 0 horizontal overflow, 0 clipped text and 0 broken images, and the vision review of changed surfaces finds no High issue.
4. No rubric area drops below its baseline score; areas below 2 reach 2 or have an unresolved question.
5. Suite: `node --check`, JSON parse, locale and range validators, journeys and axe show no new failure versus baseline.
6. AntiFan `theme.qa_validate` runs on every touched route after the last edit; any remaining finding is classified.
7. `DESIGN.md`, `REVIEW.md` and `AGENTS.md` reflect the delivered rules where a rule changed.
8. Changes are committed on `main` (not pushed), excluding `plans/reports/**` images.

## Round log

| Round | Proposals done | Checks passing | Regressions fixed | Notes |
|---|---|---|---|---|
| 1 | P1, P2, P3, P4 | Hero heading and CTA opacity 1 with JavaScript disabled and through Swiper init (min sampled opacity 1 over 5.5 s), bottom of CTA at y792/893/705 inside 900/1024/812 viewports; flagship PDP image box ratio 1.000 = natural 1.000, 2:3 product unchanged (0.667); article and blog meta links and tags at least 24 px, QA tap-target-tiny and min-gap gone on both routes; FAQ shows neither "Tell visitors how..." nor the empty help block; 15 captures 0 overflow / 0 clipped / 0 broken; locales, ranges, JSON OK | - | Also fixed `a.article-card__category-link` (14.4 px tall) found by the round QA. Sidebar tag gap 4 to 8 px. |
| 2 | P5, P6, P7, P8, P9, P10, P11, P12, P13, P14 (P15 rejected) | Featured product and blog posts render nothing on the storefront when their product/blog is blank or empty and keep the editor placeholder under `request.design_mode`; 375 px carousels show 2 cards plus a peek (recommendations and recently viewed 158 px, Swiper `slidesPerView` 2.1 and matching pre-init `--swiper-cols-mobile`; marquee 165 px); collection preset drops the Best Sellers block that repeated the grid's first row; header badge `hidden` at 0 (Liquid and `ThemeUtils.updateCartCount`); article table 574 px scrolls inside a 345 px region, headers on one line, page `scrollWidth` 375; `og:image:alt` / `twitter:image:alt` from image alt, else page title; range sale prices crimson (3 of 3 sale ranges on `/collections/all`); sold-out pills keep the 40 px pill radius with muted text 81,80,78 on bone, QA contrast-low and tap-target-tiny gone on the gift card; page H1 weight 400 (`--font-heading-weight`) on collection, collections, cart and search. Suite after P5-P11 (P12-P14 landed later; the final round reruns it): node 0 FAIL, JSON 0 FAIL, locales and ranges exit 0, journeys 96 pass / 0 fail, axe 0 violations on 45 route-viewports, lifecycles done. After P12-P14: `node --check` on changed JS, locales, ranges and template JSON OK; QA on 3 PDPs, home, collection, collections, search and cart shows no new finding class. | Baseline journey `removing all lines shows empty state` now passes. | P15 rejected: the 2.7em title reserve aligns prices across cards in flex carousels; `@supports (grid-template-rows: subgrid)` already aligns grids. Removed global `.sold_out { opacity: 0.25 }` in `theme.css` (only variant pickers used the class); it caused the faint square tiles. P12 keeps the % badge tied to the selected variant, so range products without a discounted first variant show strike + crimson without a badge. New QA items classified: `collection-template__close-filter` TRIGGER_NOT_ACTIONABLE (close button of a closed drawer auto-discovered as a trigger) and `header__hamburger` obscured on search (hit-test on the closed page returns the hamburger; the drawer is `visibility: hidden`, translated -320 px). |
| 3 | Icon stroke, breadcrumb, store labels; vision regressions R3-1 to R3-8 | 33 inline icon strokes normalized to 1.5 (none left at 2/1.75; the 1.8 collection-card arrow was found in round 5); breadcrumb on one line at 320/375 with the last crumb truncated, separators 5 px and never overflowing, page `scrollWidth` 375; store filter labels "City or region" / "Area"; 48 captures 0 overflow / 0 clipped / 0 broken; collection title and hero now leave one divider (wrapper top border removed only when it follows them); "Outerwear" hero H1 400 like All Products; mobile recommendation and recently-viewed arrows `display: none` below 750 px (swipe + peek), carousel titles clamped to 3 lines (59 px max); range prices keep each amount on one line (39 px, 2 nowrap amounts); QA on 5 touched routes shows no new finding class; locales, ranges, JS OK | Vision R3: arrows over quick-add bag and sale badge (fixed), double collection divider (fixed), Outerwear H1 bold (fixed), orphaned "USD" (fixed), 7-line titles (fixed), breadcrumb separator squeezed (fixed) | Open, Low: tablet PDP empty column under the shorter square gallery; article table scroll hint; tablet hero controls render only after JS. Round-3 captures were first written outside the repo by a relative `CAP_OUT` and moved into `round-3/`. |
| 4 | Vision R4 (full re-review, `round-4/vision-round4.md`): SKU/barcode rows, sold-out button, TOC active state, article meta/TOC and footer double rules, PDP thumbnails, article table scroll hint; reverted the round-3 card-title clamp | Gift card: blank SKU row `hidden` in Liquid (the `setMetaValue` toggle on variant change was not exercised by a probe), next visible row has no leading divider, `meta_unavailable` ("N/A") removed from locale, head script and JS; bomber keeps "SKU: REBEL-BMB-MAT-S". Sold-out button opacity 1, label 81,80,78 on bone (was 2.31:1 at 0.5 opacity). TOC: active item follows scroll position (rAF-throttled passive scroll listener replaces the IntersectionObserver that missed instant jumps): top = first heading, bottom = last, back to top = first. One rule under the article meta (TOC top border 0) and between footer menus and bottom bar (7307 then 7384). Thumbnails inactive 0.8 (was 0.55). Article table shows edge shadows while more columns are off-screen. Card titles back to full length (the clamp hid 21 px of a 4-line title at 1440, `clipped:1` on both PDPs). QA on 4 touched routes shows no new finding class; locales, ranges, JS OK | `clipped:1` on PDP captures from the round-3 clamp (reverted) | Rejected with evidence: filter sidebar "cut off" is a full-page-capture artifact (sticky panel scrolls: `scrollHeight` 1002 > `clientHeight` 779, scrollbar visible, Size has 11 inputs); tablet PDP "empty column" is the same artifact (gallery `position: sticky`, top 187 then 81 px while scrolling to 800); home H1 is the visually hidden shop-name H1; article H1 "cut" is the screenshot fold; truncated comments, "Devs2 Admin", duplicate article titles, one-link footer menu, gift card "Out of stock" and repeated imagery are demo-store data, not theme code. Deferred to round 5: preset copy (About merchant sentence, brand-age wording, footer tagline), mobile collection toolbar rows. |
| 5 | Preset copy, counters, announcement wrap, last icon stroke; final suite, capture and QA | Home "Since 2015. One philosophy." beside "A decade of refined defiance" and "EST. 2015"; About stat 10+ (was 12+); footer tagline "Tailored streetwear and outerwear, cut to be worn every day."; animated counters render the real value in Liquid (server HTML `10/180/42/100`), JS zeroes them only when IntersectionObserver exists and counts up on reveal (back to `10/180/42/100`); announcement text `text-wrap: balance`; collection-card arrow stroke 1.5. Final suite: node 0 FAIL, JSON 0 FAIL, locales and ranges exit 0, journeys 96 pass / 0 fail, axe 0 violations on 45 route-viewports, facet/contact/cart-trigger/section-reload/error-path lifecycles done, discovery ERROR 13 / WARN 20 (same as baseline), INFO 28 to 20. Capture: 48/48 route-viewports at the expected status, 0 overflow, 0 clipped, 0 broken images, 0 translation-missing, 0 page errors. QA on 14 routes: no finding class beyond the classified ones. | - | Remaining QA items are classified, not theme defects: `footer-actions-menu__toggle` and `#search-articles-tab` state-matrix misreads (reported to `xd://report_issue`), `collection-template__close-filter` trigger of a closed drawer, console = HotReload, shop.app CSP and the `shopify-account` default-menu notice, `/collections` icon-stroke = Shopify's full-colour payment icon, image-crop on fixed-ratio cards and 1:1 thumbnails, min-gap on the collection sort/view toggle at 320/375. About "This page exists…" sentence is store page content. Open, Low: mobile collection toolbar uses 3 rows; postcode "150-0034" can break at the hyphen; hero pagination bullets are Swiper-generated after JS. |
| Close | Reviewer follow-ups | Header badge at 0 stays in the accessibility tree (`data-empty` → opacity 0, `aria-live` region kept, set in Liquid and `updateCartCount`), measured `["0", data-empty, not hidden, opacity 0, display flex]`. Range cards use Dawn's condition `product.compare_at_price > product.price` for the strike and the crimson range (Oxblood Oversized Tee strikes $70.00 USD; non-sale ranges show none); the strike honours `currency_code_enabled`. Recommendations and recently viewed: `2.1` cards up to 749 px (600 px: 265 of 570 px), 3 from 750, 4 from 1024, the same steps in the Swiper config and the pre-init `--swiper-cols-*`; arrows hidden below 750. TOC scroll handler renamed `_onScroll` (load = first heading, instant bottom = last, back to top = first). DESIGN.md Icons rule states the rendered weight and its exemptions (12 px icon-box chevron at 2.5, 40 px+ empty-state illustrations at 1). QA on 5 touched routes: no new finding class; `/collections` icon-stroke is still the 35x22 full-colour payment icon at (15, 2905); its 3 console entries are HotReload, shop.app CSP and the `shopify-account` default-menu notice. | - | `font-spacing-icon` FAIL on `/blogs/style-guides-wardrobe-essentials/augmented-reality-...` at 375 measures the text range of the last breadcrumb past its `text-overflow: ellipsis` clip; live layout has the name box at 220-360 px inside the 15-360 px list and page `scrollWidth` 375, so it is intended truncation. `specs/qa-matrix.json` was rewritten by AntiFan during this run (domSemantics 95 → 86, no new gap listed) and is left uncommitted. |

## Unresolved questions

1. P17 header shift between first paint and loaded state (vision #33; round-4 vision still sees the header move from y61 to y77 on desktop) was not investigated in this review. It needs a CLS trace on a passwordless store to separate a theme layout shift from capture timing before header sizing changes.
2. Mobile collection toolbar uses 3 rows (filter button, count, sort); compacting it is a layout decision for the merchant-facing design, not a defect.
3. Hero pagination bullets and pause control are Swiper-generated, so the tablet first paint shows them only after JS.
4. Demo-store content gaps (About "This page exists..." page body, "Devs2 Admin" author, duplicate posts, truncated comments, one-link footer menu, inactive gift card) need store content work on the client transfer demo store.
5. `shopify theme check` ran after approval on 2026-10-21 with instrumentation off: 244 files inspected, no offenses (`round-5/gates/theme-check.txt`). Resolved.
6. AntiFan state-matrix misreads on `footer-actions-menu__toggle` and `#search-articles-tab` were reported to `xd://report_issue`; receipts stay `STRUCTURAL` until the tool classifies inline disclosures and ARIA tabs.
7. The quickview SKU row does not toggle `hidden` when the variant changes (`quickview-modal.js` writes the text only), and the PDP `setMetaValue` toggle was not exercised by a variant-change probe.
8. Docs data regenerated with `node scripts/export-rebel-docs-data.mjs ../shopify` in `E:/Work/master`: `src/data/rebel-theme.json` (25 setting groups, 63 sections, 21 theme blocks, 25 templates) now carries "City or region" / "Area" and the earlier label changes; `npm run build` completes and `/themes/rebel/sections/` shows "City or region". The file is uncommitted there; pushing `main` in that repo deploys devs2.org and stays with the user.
9. Card `%` badges still follow the first available variant while the range strike follows the lowest-priced variant, so a range card can show a strike without a badge.
