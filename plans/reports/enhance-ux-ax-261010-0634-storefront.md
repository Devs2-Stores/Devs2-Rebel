# UX/AX review: Devs2 Rebel (Shopify OS 2.0 base theme) - 2026-10-10

## Verdict

Baseline: the storefront looks finished, but three of its core journeys break for real shoppers. Add to cart on the PDP shows a raw JSON parse error while the line is still added server-side, so a retry duplicates it. The cart drawer, mobile menu, megamenu and mobile filter drawer never take keyboard focus. The pending PDP/PLP remediation work escapes the low-stock counter markup, loses the shopper's subscription plan, and drops keyboard focus on every filter change. The biggest win is P13 (cart add) plus P16 (overlay focus), which fix the two failures that reach every shopper. DONE status is tracked in the round log.

## Scope and environment

- Mode: `--auto --audit --loop 5`. `--loop` wins over `--auto` (skill rule). `--audit` is not a defined mode, so it is read as "whole storefront, audit-first"; the loop runs 5 rounds or stops early when a round finds nothing actionable.
- Target: `shopify theme dev` already running at `http://127.0.0.1:9292` (PID 24196, development theme on `devs2-rebel.myshopify.com`), reused and not started by this review.
- Code: `E:\Work\shopify`, branch `main`, HEAD `d4a44dd`. The working tree already carries uncommitted PDP/PLP remediation work (63 paths) and the P1-P12 changes from [`enhance-ux-ax-261009-2342-storefront.md`](enhance-ux-ax-261009-2342-storefront.md). Proposal numbering continues from that report (P13+).
- Inputs reused as evidence (same working tree, same day): [`code-review-ultra-261010-pending-changes.md`](code-review-ultra-261010-pending-changes.md) (`CR F-xx`) and [`test-e2e-261010-storefront.md`](test-e2e-261010-storefront.md) (`E2E Fx`).
- Pages: home `/`, collection `/collections/new-arrivals`, product `/products/rebel-tactical-bomber-jacket`, cart, search `?q=jacket`, about, contact, blog, article, 404. Selling-plan checks use `/products/selling-plans-ski-wax` (4 selling-plan groups, `requires_selling_plan: false`).
- Viewports: 1440x900, 768x1024, 375x812.
- Checks not run: field LCP/INP/CLS (password-protected dev store, no CrUX/RUM); real screen reader; Theme Check (needs separate approval for `shopify theme check`).

## Baseline evidence

- Screenshots: `enhance-ux-ax-261010-0634-storefront/round-1/raw/<page>/<viewport>.png` (full page, `render-check.mjs`), fold crops in `round-1/fold/<viewport>-<page>-fold.jpg`.
- render-check (30 captures): ERROR low-contrast 30, ERROR runtime-error 91, WARN clipped-text 13, WARN small-touch-target 10, WARN low-contrast 3, WARN touching-text 3, no overflow. The runtime errors are the Storefront API `graphql.json` 400 and `[shopify-account] Menu "customer-account-main-menu" not found` (store config, `E2E` classification table). The 30 contrast errors are white text over photography (slideshow counter, collection-list titles), confirmed as false positives in the previous report's backdrop probe. Real: `del.section-featured-product__price-compare` 2.71:1 (home 375).
- Journeys (`runs/e2e/journeys.cjs`, tag `r0`): 82 pass, 14 fail - `megamenu-1440` (dropdown `aria-hidden="true"` while visible, Escape ignored), `mobile-menu-375` (focus not moved), `plp-filter-375` (no focus, no `role="dialog"`, Escape ignored), `quickview-1440` (button `visibility: hidden` while the card has focus), `pdp-cart-1440` (5 assertions: drawer stays closed, count 0), `cart-drawer-1440` (focus not moved, Tab leaves). File: `journeys/journeys-r0.json`.
- Hidden-focus probe (home, tag `r0`): 1440 has 74 Tab stops inside `aria-hidden` (marquee duplicate 48, megamenu dropdowns 20, slideshow pagination 6); 375 has 9 (slideshow pagination). axe `aria-hidden-focus` incomplete on `.section-slideshow__pagination` and `.section-marquee-products__list[aria-hidden="true"]`.
- Discovery scan (`round-1/discovery.txt`, `--site-origin https://devs2-rebel.myshopify.com --sample 10`): exit 1, 13 errors, 20 warnings, 28 info. All errors are outside theme ownership: 4 on the Shopify-generated `/agents.md`; 8 `og:image must be an absolute URL` are a dev-proxy rewrite (source emits `https:{{ page_image | image_url }}` at `snippets/head-meta-tags.liquid:65-68,90`, while canonical stays absolute); `/` has no `og:image` because no social sharing image is set in Online Store > Preferences. Warnings: markdown twins and `/agents.md` metadata (platform), `robots.txt has no Sitemap: line` and `llms.txt has no "> summary"` (Shopify-served files; no `templates/robots.txt.liquid` in the theme).
- Live probe: `/products/rebel-tactical-bomber-jacket` renders `Only &lt;span data-stock-qty&gt;25&lt;/span&gt; left` in `.stock-counter__text` (hidden at 25 > threshold 10, visible to shoppers whenever stock drops to 10 or fewer).

## Scores

| Area | R1 | Evidence |
|---|---|---|
| First impression | 2 | `round-1/fold/1440x900-home-fold.jpg`: full-bleed hero, "Cut, draped, made to be worn", crimson CTA; no popup. `1440x900-collection-fold.jpg`: a 618 px collection banner (merchant `banner_height: medium`, ratio `auto`) pushes every product below the fold |
| Brand recall | 2 | Text wordmark "Devs2 Rebel", crimson `#BC1E2C` CTAs and badges, editorial street photography; no logo mark |
| Content punch | 2 | Strong hero lines; announcement bar is the generic "Welcome to our store" (merchant content) |
| Clarity and hierarchy | 2 | PDP: one solid primary (Buy it now) plus outlined Add to cart; the two colour swatches are identical "no image" icons, only the label distinguishes them (`1440x900-product-fold.jpg`, E2E F13) |
| Storytelling | 2 | Home: hero -> collections -> featured -> craft before/after -> brand story -> testimonials |
| Knowledge and trust | 1 | Add to cart answers with `Unexpected token '<'` and silently adds the line (E2E F1); escaped markup in the low-stock text (CR F-02) |
| Motion | 2 | Token transitions; project bans `prefers-reduced-motion` (workspace AGENTS.md section 5) |
| Responsive | 2 | No document overflow; at 375 the article comparison table and share row are clipped under `html { overflow-x: clip }` (E2E F6) |
| Accessibility | 1 | 14 journey failures above; 74 hidden Tab stops; compare-at price 3.26:1 (E2E F7); about images without `alt` (E2E F8) |
| Performance feel | 2 | Hero eager with `fetchpriority="high"`; PDP loads `product-card.css`/`.js` twice (CR F-04); no field data |

After round 1 (unchanged areas omitted; no area regressed):

| Area | Start | After R1 | Evidence |
|---|---|---|---|
| Knowledge and trust | 1 | 2 | One click adds one line (`/cart.js` 1 = header 1); an error response shows the server text, no parser text; stock counter reads "Only 10 left — order soon!" on load and after a JS variant change; sticky bar and money strings follow the selected variant and shop format (`r1-acceptance.cjs`, sticky probe) |
| Accessibility | 1 | 2 | Journeys `r1d` 96 pass / 0 fail (`quickview-1440` 5/5, the four overlay journeys all pass); hidden-focus `r1d` 0 hidden stops at 1440 and 375; compare-at minimum 4.59:1 (Botanical scheme-1) across 5 presets x scheme-1..3; about images have `alt` |
| Clarity and hierarchy | 2 | 2 | Colour values without a swatch render as text pills ("Matte Obsidian", "Stealth Slate"), `vision/pdp-buybox-1440.png` |
| Responsive | 2 | 2 | 375 and 320: nothing inside `main` ends past the viewport and the article table scrolls inside its wrapper (`overflow-x: auto`); at 375 the share row is one line ending at x 347 |

## Proposals

### P13 - Add to cart and Buy now get JSON and fail in the shopper's language (Must)
- Evidence: E2E F1, CR F-08. `assets/product.js` posts `fetch(cart_add_url)` with only `X-Requested-With`; the server answers `302` to `/cart` (HTML). Same FormData with `Accept: application/json` answers `200` JSON (`cart-add-accept-probe.json`). `pdp-cart-1440` fails 5 assertions.
- Change: send `Accept: application/json` on both requests; show the server `description` or the locale `cart_error` string, never a parser message.
- Files: `assets/product.js`.
- Acceptance: `pdp-cart-1440` passes every assertion (drawer opens, line listed, header count +1, focus inside); `/cart.js` item count equals the UI count after one click; an error response shows locale or server text.

### P14 - Purchase options follow the product's selling plans (Must)
- Evidence: CR F-01 (one-time radio always rendered and `checked`, no `product.requires_selling_plan` branch, `blocks/buy_buttons.liquid:50-90`), CR F-03 (variant change overwrites the chosen plan with `selling_plan_allocations[0]`, `assets/product.js:337-347`), CR F-09 (literal `% off`, every adjustment assumed to be a percentage).
- Change: when `product.requires_selling_plan`, omit the one-time option and render the subscription option checked with the select enabled. On variant change keep the chosen plan when the new variant still has it. Label adjustments per `value_type` from locale keys.
- Files: `blocks/buy_buttons.liquid`, `assets/product.js`, `locales/en.default.json`.
- Acceptance: live ski wax: choose Subscription and plan 2, add to cart; `/cart.js` line has `selling_plan_allocation.selling_plan.id` = plan 2. No literal `% off` in Liquid; locale and range validators exit 0.

### P15 - The low-stock counter shows a number, not markup (Must)
- Evidence: CR F-02 and the live probe above.
- Change: render the count without injecting HTML into an escaped translation, and keep the JS variant update working.
- Files: `blocks/stock_counter.liquid`, `assets/product.js` if the template contract changes, `locales/en.default.json`.
- Acceptance: live PDP HTML has no `&lt;span` in `.stock-counter__text`; a variant at or below the threshold reads "Only N left - order soon!" (locale wording) after a JS variant change.

### P16 - Overlays take focus, trap it, close on Escape and give it back (Must)
- Evidence: E2E F2, F3, F4, CR F-07; journeys `cart-drawer-1440`, `mobile-menu-375`, `megamenu-1440`, `plp-filter-375`. `ThemeUtils.trapFocus` (`assets/theme.js:143-170`) focuses while the panel is still `visibility: hidden`; the megamenu keeps a static `aria-hidden="true"`; the filter drawer has no dialog semantics.
- Change: overlays become visible before focus moves (CSS visibility timing, no motion removed); megamenu uses the disclosure pattern with `aria-expanded` and Escape; filter drawer gets `role="dialog"`, `aria-modal`, a name, the shared trap, and Escape.
- Files: `assets/theme.js`, cart drawer, mobile menu and megamenu assets/markup, `snippets/collection-filter-drawer.liquid`, the drawer handlers in `assets/collection.js`.
- Acceptance: the four journeys pass all assertions; hidden-focus reports 0 megamenu stops on home 1440.

### P17 - Filtering keeps the keyboard position and speaks the result (Must)
- Evidence: CR F-06 (checkbox/chip/sort focus lost to `body` or yanked to the first product), F-11 (`replaceState` to the next-page URL), F-12 (hardcoded English live region), F-13 (chip name is only the value), F-20 (drawer Clear-all reloads the page).
- Change: restore focus to the equivalent control after the section swap (checkbox by id, sort select, next chip or the results heading); keep the page URL on append; live-region and chip strings from locales; AJAX Clear-all.
- Files: `assets/collection.js`, `snippets/collection-active-filters.liquid`, `snippets/collection-filter-drawer.liquid`, `locales/en.default.json`.
- Acceptance: live keyboard probe on `/collections/all`: Space on a filter checkbox leaves `document.activeElement` on the same checkbox id after the update; changing sort leaves focus on the sort select; removing a chip never leaves focus on `body`; chip accessible name includes the remove action; Load more leaves `location.href` unchanged; Clear-all in the drawer does not navigate.

### P18 - Product-card actions are reachable by keyboard (Should)
- Evidence: CR F-17, E2E F5 (`quickview-1440`).
- Change: reveal the card actions on `:focus-within` as on `:hover`.
- Files: `assets/product-card.css`.
- Acceptance: `quickview-1440` passes.

### P19 - No focusable content inside `aria-hidden` (Should)
- Evidence: CR F-16, E2E F9, hidden-focus `r0` (marquee duplicate 48 stops, slideshow pagination 6/9).
- Change: the duplicate marquee track becomes `inert`; clickable slideshow pagination is not `aria-hidden`.
- Files: `sections/marquee-products.liquid`, slideshow pagination owner.
- Acceptance: hidden-focus reports 0 hidden stops on home at 1440 and 375; axe `aria-hidden-focus` empty.

### P20 - Compare-at prices reach 4.5:1 on every preset (Should)
- Evidence: CR F-25, E2E F7 (`opacity: 0.55`, 3.26:1), render-check `del.section-featured-product__price-compare` 2.71:1.
- Change: use the muted token colour instead of opacity.
- Files: `assets/product-card.css`, featured-product styles.
- Acceptance: computed compare-at contrast at least 4.5:1 for scheme-1..3 of all five presets; render-check has no compare-at low-contrast finding.

### P21 - Images keep their `alt` and `class` (Should)
- Evidence: CR F-15, E2E F8 (axe `image-alt`, 6 nodes on about).
- Change: pass `alt`, `class`, `loading` as `image_tag` parameters instead of filters inside the pipe.
- Files: `sections/logo-list.liquid`, the image-with-text owner.
- Acceptance: about page: every content `<img>` has a non-empty `alt` and its class.

### P22 - Content reflows at 375 px without clipping (Should)
- Evidence: E2E F6 (article table third column cut, headers broken mid-word, share buttons end at x 391-395).
- Change: the table scrolls inside its wrapper and wraps words; share items wrap.
- Files: article content and share styles.
- Acceptance: at 375 and 320, no element inside `main` ends right of the viewport; the table wrapper scrolls horizontally.

### P23 - Colour swatches without an image show their name (Should)
- Evidence: E2E F13, `round-1/fold/1440x900-product-fold.jpg`.
- Change: when a value has no swatch and no variant image, render the text pill used for Size.
- Files: variant picker snippet/asset.
- Acceptance: bomber jacket colour options render "Matte Obsidian" and "Stealth Slate" as text pills; no `no_image` thumbnails in the picker.

### P24 - Quantity rules use the increment and no invented maximum (Should)
- Evidence: CR F-05, CR F-21.
- Change: align the quantity to `increment` and update the stepper instance on variant change; omit `max` when no rule or inventory cap applies.
- Files: `assets/product.js`, `snippets/quantity-selector.liquid`.
- Acceptance: harness with rule `{min: 2, increment: 2, max: 10}` aligns 5 to 6 and caps at 10; the bomber jacket input has no `max="999"`.

### P25 - Recently viewed cards load the card styles (Should)
- Evidence: CR F-04 (`product-viewed` renders cards from `?section_id=product-card-ajax`; `main-product` does not load `product-card.css`).
- Change: `main-product` loads the card assets where it renders `product-viewed`.
- Files: `sections/main-product.liquid`.
- Acceptance: a product template without recommendation sections still loads `product-card.css` [verified by rendered HTML of the PDP].

### P26 - Commerce styles use scheme tokens and mobile-first rules (Could)
- Evidence: CR F-14 (`@media (max-width: 768px)` with `!important`), F-22 (dynamic checkout hardcodes white on primary), F-23 (chip hover hex values).
- Files: `assets/product.css`, `assets/collection.css`.
- Acceptance: no `!important` and no hex colour in those rules; the sticky ATC stays at the bottom at 375.

### P27 - Accessible names include the visible label (Could)
- Evidence: E2E F10 (cart button "Open cart" shows the count; card media links include visible badge text).
- Acceptance: axe `label-content-name-mismatch` 0 on home/collection at 1440.

### P28 - Slider bullets have a 24 px hit area (Could)
- Evidence: E2E F11 (8x8 px, axe `target-size` 46 nodes).
- Acceptance: axe `target-size` 0 for `.swiper-pagination-bullet`; the visual dot is unchanged.

### P29 - Recommendation lists keep list semantics (Could)
- Evidence: E2E F12 (axe `list`, 3 nodes).
- Acceptance: axe `list` 0 on the PDP.

### P30 - About hero text reaches 4.5:1 over its photo (Should)
- Evidence: `runs/e2e/r3-hero.cjs` composites the text colour over every backdrop pixel of the element box with text shadows removed. `/pages/about` subheading minimum 2.62 / 2.73 / 2.67 at 375 / 768 / 1440; 16 px paragraph minimum 3.04 (p10 3.68) at 375. Two causes: the hero subheading and text are `rgba(255,255,255,0.82)` and `0.9` (`sections/hero.liquid:399,413`), and the about demo hero puts middle-center content on the bottom-weighted gradient (`overlay_opacity: 45` fades 0.18 top to 0.72 bottom), so the subheading sits on roughly 0.33. Measured variants, subheading minimum at 375: opaque text 3.11; opaque + flat 45 4.36; opaque + gradient 55 3.85; opaque + flat 55 5.94 (5.58 at 768 and 1440, paragraph minimum 5.18 or more, heading 5.58 or more).
- Change: hero subheading and text use opaque white. The about demo hero (`templates/page.about.json` and the five `listings/*/templates/page.about.json`) uses a flat overlay at 55 (`overlay_opacity` range 0-80, step 5).
- Files: `sections/hero.liquid`, `templates/page.about.json`, `listings/{rebel,noir,vibrant,botanical,cyber}/templates/page.about.json`.
- Acceptance: `r3-hero.cjs` on the live about page, current state: subheading and paragraph minimum 4.5:1 or more and heading 3:1 or more at 1440, 768 and 375; range validator exit 0; the six about templates stay identical in the hero block.

### P31 - Previous and next article titles are never cut without a cue (Could)
- Evidence: render-check WARN clipped-text `span.article-template__nav-title` at 768. Chrome 154 drops the line-clamp ellipsis on right-aligned text: the next-article title ends "…Ergonomics Meets" with "High Fashion" hidden and no ellipsis (`round-3/article-nav-title-768-current.png`); the same box left-aligned shows "Meets…" (`-leftAlign.png`); `text-align: end` and `-webkit-right` behave like `right`.
- Change: drop the two-line clamp from `.article-template__nav-title`; titles wrap in full.
- Files: `assets/article.css`.
- Acceptance: at 768 and 1440 every nav title has `scrollHeight` equal to `clientHeight` and `scrollWidth` equal to `clientWidth`; render-check reports no clipped-text on the article.

### P32 - The slideshow counter stays readable on every slide (Should)
- Evidence: `runs/e2e/r4-home.cjs` (backdrop composite, text shadows removed). Home slide 3 puts the counter "3 / 3" on the flat grey studio backdrop (`round-4/vision/slide3-counter-375.png`): current number 2.71:1, separator 1.72:1, total 2.08:1 at 375, 768 and 1440. On slides 1 and 2 the separator and total still drop to 2.21 and 2.47 at 768. Causes: the counter is `rgba(255,255,255,0.9)` with no backing, and the separator and total add `opacity: 0.5` and `0.7` (`sections/slideshow.liquid:636-662`). Merchants choose the slide photos, so the counter cannot depend on the image.
- Change: the counter gets a dark translucent pill; its text and separator are opaque white. Measured variant (`counterPill`): minimum 9.78:1 on every slide at all three widths.
- Files: `sections/slideshow.liquid`.
- Acceptance: `r4-home.cjs` current state: current number, separator and total 4.5:1 or more on slides 1-3 at 375, 768 and 1440; render-check reports no low-contrast on `.section-slideshow__counter-*`.

### P33 - Collection card titles keep 4.5:1 over their photos (Could)
- Evidence: `r4-home.cjs`: 18 px bold titles (below the large-text size) over the bottom gradient `rgba(0,0,0,0.5) 0% -> transparent 60%` reach minimum 3.15 / 3.01 / 4.70 ("Casual Shirts") at 375 / 768 / 1440, with "Limited Edition" 3.87 and "Accessories" 4.29 at 375. A flat `0.65 -> transparent 70%` variant still leaves 4.46 at 768; `0.7 -> 0.35 at 35% -> transparent 70%` gives minimum 5.24 / 5.00 / 8.11.
- Change: the collection-list overlay uses the measured three-stop gradient.
- Files: `sections/collection-list.liquid`.
- Acceptance: `r4-home.cjs` current state: every collection-list title 4.5:1 or more at 375, 768 and 1440; render-check reports no low-contrast on `.section-collection-list__title`.
- Instrument note (round 4): render-check cannot meet the second clause for any text over an `<img>`. Its `backgroundOf` walks ancestor background colours and skips replaced elements, so it scores the white title against the page background: 1.12:1 before and after the change at every width (`round-4/raw/home` and `round-4/after/home`). The pixel composite in `r4-home.cjs` is the measure that sees the photo; the clause stays recorded as unmet for that reason.

### P34 - Status text keeps 4.5:1 in every colour scheme (Should)
- Evidence: round 5 covers three routes no earlier round captured: `/collections`, `/pages/contact?view=faq` and `/pages/contact?view=stores`. `runs/e2e/r5-axe.cjs` (WCAG 2.2 AA) finds one defect there: the stores "Open now" badge is `#16a34a` on its own 14% tint `#def2e6`, 2.81:1, 6 nodes at both 375 and 1440. Render-check rates it 3.30:1 at all three widths. The same cause affects the whole theme. `--color-success`, `--color-warning` and `--color-error` are fixed `:root` values (`snippets/head-design-systems.liquid:26-28`), and about 35 rules use them as text colour (cart, cart drawer, quickview, customer orders, contact form, stores, form messages, required marks). No single fixed value passes on all 20 preset schemes: `#16a34a` ranges from 1.08 to 6.04, and `#dc2626` from 1.24 to 4.83. Toast fills carry white 14 px text, which reaches 3.30 on success and 2.94 on warning (`assets/toast.css:38,60-61`). `cart-modal.css:312` hardcodes `#dc2626` for text.
- Change: `snippets/head-color-schemes.liquid` becomes the single owner of the status colours. Fixed fills move from `head-design-systems` and become `#15803d` / `#a16207` / `#dc2626`, which carry white text at 5.02 / 4.92 / 4.83. Each scheme gets `--color-{success,warning,error}-text`. The value is the status colour mixed toward the scheme text colour in 10% steps (`color_mix`), and the first step whose ratio against its own 14% tint on the scheme background is 4.6 or more (`color_contrast`) is used. If no step passes, the value is the scheme text colour. Every text use moves to the `-text` token. A badge background behind status text is 14% of the `-text` token, the exact background the Liquid check measured (stores "Open now", customer order pills). Fills and borders keep the fixed colours. The stale `rgba(22,163,74,…)` aliases become `color-mix` of the fixed token.
- Files: `snippets/head-color-schemes.liquid`, `snippets/head-design-systems.liquid`, `assets/{article,cart-modal,cart,customer,newsletter-modal,page-contact,page-stores,product,product-card,quickview-modal,theme}.css`, `sections/{contact-form,newsletter}.liquid`.
- Acceptance: the dev server renders the Rebel scheme values predicted offline from the Shopify `color_mix` rounding, with no Liquid error in the CSS. The offline prediction gives all 20 preset schemes 4.6 or more against the 14% tint, except two whose own text colour is the limit: Vibrant scheme-4 body text is 3.06 on `#ff5e00`, and Botanical scheme-4 text is 5.64 plain and 4.16 on a tint. axe `color-contrast` reports 0 on the stores route at 375 and 1440. No text rule still reads `var(--color-success|warning|error)` or a literal status hex.

## DONE contract

1. Every Must and Should proposal meets its acceptance checks; skipped items carry an accepted reason.
2. `check-discovery-surfaces.mjs` exits 0 with `--site-origin`, or every remaining error/warning is platform-owned (`/agents.md`, markdown twins, Shopify-served `robots.txt`/`llms.txt`), a dev-proxy rewrite, or store configuration, each listed with its reason. No theme-owned error is added.
3. Screenshots at 1440x900, 768x1024, 375x812 of every changed page show no overflow, clipped text, overlap or broken images; vision review finds no High issue.
4. No rubric area regresses; areas below 2 reach 2 or are recorded as unresolved.
5. Every journey in `runs/e2e/journeys.cjs` passes (all 17, not only the changed ones), and hidden-focus reports 0 focusable stops inside `aria-hidden` on home at 1440 and 375. The reduced-motion check is replaced by the project ban on `prefers-reduced-motion`.
6. `node scripts/validate-locales.mjs` and `node scripts/validate-schema-ranges.mjs` exit 0, `node --check` passes on every changed JS file, and every JSON template parses. `shopify theme check` runs only with user approval.
7. `DESIGN.md`, `REVIEW.md` and `AGENTS.md` reflect the delivered direction, with prior content preserved.
8. Processes started by the review are stopped; the pre-existing `shopify theme dev` stays running.

## Round log

| Round | Proposals done | Checks passing | Regressions fixed | Notes |
|---|---|---|---|---|
| 1 | P13-P25 (13 of 13 Must/Should) | Journeys 96/0; hidden-focus 0 at both widths; `r1-acceptance.cjs` 12/12 (P13 count + error text, P14 plan id `2403565677` kept in cart, P15 counter, P17 checkbox/sort/chip focus, chip name, drawer Clear-all without navigation); locale + range validators exit 0; `node --check` 9/9; 28 JSON files parse; discovery 61 findings before and after, none new | Found while verifying, all pre-existing: sticky ATC rendered `product.price` instead of the selected variant (`snippets/product-sticky-add.liquid`, `assets/product.js`); `ThemeUtils.formatMoney` ignored comma, apostrophe, space and period-separator formats (`assets/theme.js`); lightbox shipped `<img src="">` (AntiFan `broken_asset`, now created on open) | AntiFan receipt `run-47cae225`: assets clean, 0 introduced regressions; the 3 remaining criticals are the dev-server HotReload message and `customer-account-main-menu` missing in the store. P17 Load more not exercised: `/collections/all` has no load-more button in this store's settings |
| 2 | P26-P29 (4 of 4 Could) | `r2-acceptance.cjs` 8/8: P26 no `!important` or hex in the sticky ATC, dynamic checkout and chip hover rules, sticky bar bottom 812 = viewport 812 at 375 and top 72 px at 1440; P27 axe `label-content-name-mismatch` 0 on `/` and `/collections/all` at 1440; P28 axe `target-size` 0 at 1440 and 375, bullets 24x24 with an 8 px dot; P29 axe `list`/`listitem` 0 on the PDP, recommendation and recently viewed slides carry `role="listitem"`. Journeys `r2` 96/0; hidden-focus `r2` 0 at 1440 (259 stops) and 375 (258); locale + range validators exit 0; `node --check` 9/9; 28 JSON files parse | Found while verifying: a dead `#9ca3af` fallback on `--color-gray` (always set by `snippets/head-design-systems.liquid:252`) in the chip remove rule, removed | No score change; Accessibility evidence extended |
| 3 | P30-P31 (1 Should, 1 Could) | P30 `r3-hero.cjs` live `/pages/about`: subheading minimum 5.94 / 5.58 / 5.58, paragraph 5.58 / 5.72 / 5.18, heading 5.58 / 5.72 / 6.17, secondary button 6.70 / 6.48 / 6.48 at 375 / 768 / 1440 (was 2.62 subheading, 3.04 paragraph, 1.84 button at 375); the six about templates carry `overlay_opacity: 55`, `overlay_gradient: false` (their only hero difference is the pre-existing `image_desktop` store link in `templates/page.about.json`). P31 nav title `scrollHeight` = `clientHeight` and `scrollWidth` = `clientWidth` at 375 / 768 / 1440, full title on three lines at 768 (`round-3/vision/article-nav-768.png`); render-check article clipped-text gone. Journeys `r3` 96/0; hidden-focus `r3` 0 at 1440 (259 stops) and 375 (258); locale + range validators exit 0 | None | AntiFan receipt on `/pages/about`: 0 introduced regressions, assets clean, no overflow at 320-1440; the 3 criticals are the pre-existing HotReload and `customer-account-main-menu` messages. Accepted render-check findings: about hero `low-contrast` 1.12:1 compares white text with the page background and ignores the photo and overlay (the pixel probe above is the measurement); `clipped-text` on `span.visually-hidden "Open cart"` is the intended screen-reader-only clip from P27; `touching-text` "175" + "K" is one stat value split for the counter animation |
| 4 | P32-P33 (1 Should, 1 Could) | P32 `r4-home.cjs` current state: counter number, separator and total minimum 9.78:1 on slides 1-3 at 375, 768 and 1440 (was 2.71 / 1.72 / 2.08 on slide 3); render-check home low-contrast on `.section-slideshow__counter-*` gone at all three widths; pill reads "3 / 3" on the grey backdrop (`round-4/vision/after-slide3-counter-375.png`). P33 titles minimum 5.24 / 5.00 / 8.11 at 375 / 768 / 1440 (was 3.15 / 3.01 / 4.70); render-check clause unmet by instrument limit (see P33). WCAG 2.5.8 probe (`r4-targets.cjs`, spacing exception included): 0 failing targets on home, collection and both PDPs at 375 and 1440, so render-check's 44 px `small-touch-target` warnings are below the project's 24 px rule. Journeys `r4` 96/0; locale + range validators exit 0 | None | AntiFan receipt `run-47cae225` on `/`: assets clean, 0 introduced regressions, 1 resolved; the 3 remaining criticals are the dev-server HotReload message and `customer-account-main-menu` missing in the store. Remaining render-check clipped-text on the PDPs (`span.sr-only` stepper labels, `legend.visually-hidden`) and every page (`span.visually-hidden "Open cart"`) are intended screen-reader-only clips |
| 5 | P34 (1 Should) | The dev server's CSS carries the offline-predicted Rebel values for all four schemes (scheme-1 `#136833` / `#835008` / `#b22020`, scheme-3 `#58a272` / `#ba8d4c` / `#e67876`), with no Liquid error, and `:root` holds only the new fills `#15803d` / `#a16207` / `#dc2626` (the old `head-design-systems` values and `-text` aliases no longer override them). Stores "Open now" forced on every card (the live clock showed "Closed now" during the check): axe `color-contrast` passes all 32 badge nodes at 375 and 1440, `#136833` on `#deeae2` 5.55:1 (was 2.81), `round-5/vision/stores-open-forced-375.png`. PDP "In stock" renders `rgb(19,104,51)` (`round-5/vision/pdp-meta-375.png`). The full WCAG 2.2 AA axe run reports 0 violations on `/collections`, both contact views, both PDPs, `/cart`, `/pages/contact` and `/` at 375 and 1440. Grep finds no text rule reading a raw status token or status hex; the remaining `var(--color-primary, #ef4444)` fallbacks belong to the primary colour. Journeys `r5` 96/0; locale + range validators exit 0 | Found while verifying: `head-design-systems` aliased `--color-{error,success}-text` to the fixed fills in a later `:root` block, which would have overridden scheme-1 on `:root`, so the aliases were removed. Dead `#166534` / `#991b1b` fallbacks in `assets/article.css` were also dropped. Text rules outside the planned files were migrated and added to P34 Files: `product-card.css` urgent stock, `contact-form` and `newsletter` section messages | AntiFan receipt `run-47cae225` on the stores route: assets clean, 0 introduced regressions; the 3 remaining criticals are the dev-server HotReload message and the store's missing `customer-account-main-menu`. Render-check stores low-contrast on `.stores-card__status` is gone at all three widths, but that run happened while the badge read "Closed now", so the forced-open axe run is the proof. The customer order pills sit behind login and are verified statically only. Offline prediction for the 16 schemes of the other presets: see P34 acceptance |

## DONE status (final check)

Status: DONE_WITH_CONCERNS. Items 1-5, 7 and 8 are met. Item 6 is met except `shopify theme check`, which the contract and `AGENTS.md` keep behind user approval.

| # | Result | Evidence |
|---|---|---|
| 1 | Met | P13-P34 all delivered (13 Must/Should in round 1, 4 Could in round 2, 2 + 2 + 1 in rounds 3-5), none skipped |
| 2 | Met | `round-5/discovery.txt`: exit 1. It has 13 errors, 20 warnings and 28 info, the same set as `round-1/discovery.txt` and `discovery-after.txt`, so nothing was added or removed. The errors break down as 4 on the Shopify-served `/agents.md` (platform), 8 relative `og:image` from the dev-proxy rewrite (the source emits `https:`), and `/` without `og:image` (no social sharing image set in store preferences) |
| 3 | Met | Round 5 render-check at 375 / 768 / 1440: `/collections`, FAQ, stores, both PDPs, `/cart`, `/pages/contact`. No new overflow, broken image, overlap or low-contrast finding. The only new findings are the intended screen-reader clip `span.visually-hidden "Open cart"` and the existing runtime messages (missing `customer-account-main-menu`, `shop.app` frame CSP, dev-proxy CORS). Vision `round-5/vision/stores-open-forced-375.png` and `pdp-meta-375.png` show no High issue |
| 4 | Met | No area regressed; Knowledge and trust and Accessibility moved from 1 to 2 in round 1 |
| 5 | Met | `journeys-r5.json`: 97 rows across 17 journeys, 96 pass, 0 fail. Final hidden-focus on home: 0 hidden stops at 1440 (259 stops) and 375 (258), with no axe incomplete. WCAG 2.2 AA axe: 0 violations and 0 document overflow on 8 routes at 375 and 1440 |
| 6 | Met, Theme Check pending | Locale and range validators exit 0. `node --check` passes 9/9 changed JS files and all 129 changed JSON files parse. `shopify theme check` was not run (needs approval) |
| 7 | Met | `DESIGN.md` and `REVIEW.md` added; `AGENTS.md` gains "Design Direction and UX Review" by insertion only; `docs/README.md` links both |
| 8 | Met | Every background job started by the review has finished. `shopify theme dev` (PID 24196) still runs. Scratch probes stay in `runs/e2e/` (ignored by `.gitignore` and `.shopifyignore`) because this report cites them; removing them needs separate approval |

## Unresolved questions

- The announcement bar copy ("Welcome to our store") and the home social sharing image are merchant content; a concrete promise (shipping, returns) needs real store policy facts.
- The collection banner height that hides products at 1440 is a merchant setting (`banner_height`, `image_ratio`).
