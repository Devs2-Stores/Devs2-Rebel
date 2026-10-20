# UX/AX review: Devs2 Rebel (Shopify OS 2.0 base theme) - 2026-10-11

## Verdict

Baseline: every scripted journey passes (96 PASS, 0 FAIL), but a production pass on hover, motion and actions finds defects that the journeys never exercise. With the default PDP setting `show_dynamic_checkout: true`, the sticky add-to-cart bar shows up and does nothing. The account address form never fills the State/Province list. An invalid phone number on the contact form locks its submit button for good. The hero slideshow pagination renders 720 px off-screen, so it can be focused but not seen. Variant pills show no keyboard focus. The biggest win is P35 to P38, four defects that reach real shoppers. DONE status is tracked in the round log.

Final (after round 10): all ten rounds found actionable work, and P35-P111 are delivered and verified. On the theme side, every DONE item is met. From the last batch (`round-10/final-7/`), run after the last theme edit: journeys 96 PASS 0 FAIL, axe 0 violations and 0 overflow on 15 routes x 375/768/1440, and both validators exit 0. The Tab walk finds 0 invisible stops on 10 routes at 2 widths, and discovery is at the 13-error platform/dev-proxy baseline. Knowledge and trust and Accessibility moved from 1 to 2, and no area dropped. Release still waits on three user-controlled steps: `shopify theme check` (needs approval), a review push, and the merchant content listed under Unresolved questions.

## Scope and environment

- Mode: `--auto --audit --loop 10`. `--loop` wins over `--auto`. `--audit` is read as "whole codebase, audit-first". The user's focus is the full codebase, UX/UI, motion, actions and hover, as preparation for production. The loop stops early once a round finds nothing actionable.
- Target: `shopify theme dev` at `http://127.0.0.1:9292` (PID 24108, already running, reused and not started by this review); the store is `devs2-rebel.myshopify.com`. AntiFan tab `0e78f140-a3de-4743-8e4b-74e12998106c` is bound for live QA.
- Commit `d4a44dd` plus a pending working tree (150 modified, 20 untracked, 3 deleted) from earlier passes.
- Routes (15): `/`, `/collections/all`, `/products/rebel-tactical-bomber-jacket`, `/products/leather-care-balm`, `/cart`, `/search?q=jacket`, `/pages/about`, `/pages/contact`, `/pages/contact?view=faq`, `/pages/contact?view=stores`, `/collections`, `/blogs/sustainable-fashion-eco-tech`, one article, `/account/login`, a 404 route.
- Checks not run: field CWV (dev store, no RUM), real screen reader, `shopify theme check` (needs separate approval).

## Baseline evidence

Folder: `enhance-ux-ax-261011-1000-production/round-1/`.

- Screenshots: `raw/<page>/{1440x900,768x1024,375x812}.png` for all 15 routes (`render-check.mjs`), with vision crops in `vision/`.
- render-check (45 captures): runtime-error 139, low-contrast 24, clipped-text 75, small-touch-target 15, touching-text 3. All of them are known noise ([E2E classification](enhance-ux-ax-261010-0634-storefront.md)). The runtime errors are Storefront API `graphql.json` 400, `customer-account-main-menu`, the shop.app frame-ancestors CSP and dev-proxy CORS. The low-contrast items are white text over photos. The clipped-text items are `.sr-only` / `.visually-hidden`. The small-target warnings use a 44 px rule, while the project rule is 24 px.
- Discovery scan (`discovery.txt`): 13 errors, 20 warnings and 28 info, the same as the 2026-10-10 baseline. The errors are relative `og:image` from the dev-proxy rewrite and the platform `/agents.md`.
- Journeys (`journeys.log`): 96 PASS, 0 FAIL, 1 INFO (buy-now hidden by dynamic checkout).
- axe (`axe.json`, 15 routes x 375/1440): 0 overflow. 1 violation: `scrollable-region-focusable` (serious) on the article table at 375.
- Hover/motion/action probe (`hma/hma-r0.json`, `hma/hma-r0-focus.json`, `hma/offscreen-focus.json`):
  - 13 actionable controls show no hover change. The probe found no dead buttons.
  - Off-screen focus stops: hero pagination bullets at x -716 to -620, and marquee product cards at x -400.
  - No focus indicator on `shopify-account` (every route) or on the variant pill labels.
  - The `privacy`/`terms` links come from Shopify's injected captcha badge (platform).
- Claims probe (`runs/e2e/claims-r1.cjs`, `sticky-click.cjs`, `radius-probe.cjs`):
  - Sticky bar: rendered, buy trigger absent, and a click sends no `/cart/add` (cart count stays 0).
  - Contact form: phone `123` gives a client error, and the submit stays `disabled` with "Sending..." showing.
  - Rebel tokens `--buttons-radius: 0px` and `--variant-pills-radius: 40px`, yet the PDP add button renders 8 px, tabs 12 px, variant pills 4 px and quantity 4 px.
- Code audits (`audit-motion-hover.md` 23 findings, `audit-js.md` 14, `audit-liquid.md` 14). Findings reproduced or confirmed in source are folded into the proposals below. One claim was rejected: `.shopifyignore` missing `.env`/`docs` is not an issue, because Shopify CLI only syncs theme directories.

## Scores

| Area | Score 0-3 | Evidence |
|---|---|---|
| First impression | 2 | `vision/desktop-home-top.png`: full-bleed hero and crimson CTA, no popup. The slideshow pagination is invisible (off-screen at x -716) |
| Brand recall | 2 | Crimson accent and editorial photography match `DESIGN.md`, but PDP/collection/cart corners drift from the preset: add button 8 px, tabs 12 px, quantity 4 px against Rebel's square `--buttons-radius: 0` (`radius-probe.json`) |
| Content punch | 2 | Hero copy is specific; the announcement bar and social image are merchant content gaps |
| Clarity and hierarchy | 2 | One primary CTA per PDP view; pills are text-labelled |
| Storytelling | 2 | Home order unchanged: hero -> collections -> trending -> craft -> story -> proof |
| Knowledge and trust | 1 | Sticky add does nothing with dynamic checkout on (default); address State/Province list is never populated (`customer.js:158` queries `select[data-address-type]`, which the markup lacks); the contact submit locks after a client error; contact JS strings are hardcoded English |
| Motion | 2 | Token motion is kept. `transition: all` in 15 stylesheets; layout-property transitions (`padding-left` megamenu hover); the marquee keeps moving focused cards off-screen |
| Responsive | 2 | 0 document overflow on 15 routes x 2 widths |
| Accessibility | 1 | Variant pill focus invisible (`labelOutline: none`); off-screen focusable hero bullets; marquee focus off-screen; axe serious on the article table at 375; no `shopify-account` focus ring; `outline: none` without replacement in several stylesheets |
| Performance feel | 2 | Hero eager. Home loads render-blocking `index.css` (215 rules, 1 matches at 375/1440) and `index.js` (every initializer targets markup no template renders) |

Final scores (after round 10):

| Area | Baseline | Final | Evidence |
|---|---|---|---|
| First impression | 2 | 2 | Hero pagination is on-screen and has a pause control (P36, round 3 `slideshow-pause.json`). The offer line in the hero and the announcement bar is merchant copy, so level 3 depends on content |
| Brand recall | 2 | 3 | Rebel corners are square everywhere except the 50% team avatar (round 3 `radius-scan-after.json`). The countdown, footer form and status colours follow the scheme tokens in all five presets (round 10 `countdown-matrix.json`) |
| Content punch | 2 | 2 | No English fallback hides behind Liquid (P99). The announcement bar and social image are still merchant content gaps |
| Clarity and hierarchy | 2 | 3 | One primary CTA per view, the buy box sits above the fold at 768 (round 5 `buybox-after2.json`), the article type scale steps cleanly (round 4), and the footer shows one signup per page (P100) |
| Storytelling | 2 | 2 | Home order is unchanged; that order is merchant content |
| Knowledge and trust | 1 | 2 | Sticky add, address State/Province, contact recovery, locale error copy (P35, P37, P38, P91-P95), and store hours in each store's zone (P105). Legal policies and reviews are merchant content |
| Motion | 2 | 3 | 0 `transition: all` left (20 files at HEAD), decorative hover transforms only where hover exists (P101, `touch-hover.json`), and auto-advance pauses on hover, focus and the pause button |
| Responsive | 2 | 3 | 0 document overflow on 15 routes x 375/768/1440 (`final-5/axe.json`) and at 320 (`reflow-320/`). Full-width image-with-text keeps a 15 px gutter (P104) |
| Accessibility | 1 | 2 | axe 0 violations on 15 routes x 3 widths, 0 invisible Tab stops (round 8), overlay focus management, and preset contrast with exemptions recorded. No real screen reader run, so level 3 is not claimed |
| Performance feel | 2 | 2 | `index.css`/`index.js` no longer load (P43). PDP and article CLS are about 0 in the lab (round 5) and the LCP images are eager/high. There is no field CWV on a dev store |

## Proposals

### P35 - Sticky add-to-cart works with dynamic checkout on (Must)
- Evidence: `assets/product.js:752-756` returns before `bindEvents()` when `[data-product-buy]` is absent. `blocks/buy_buttons.liquid:139-153` renders that button only when `show_dynamic_checkout` is off. `sticky-click.cjs`: click, no `/cart/add`, `cartCount 0`.
- Change: bind the sticky buttons unconditionally. Measure the threshold against the buy button, falling back to the add button.
- Files: `assets/product.js`.
- Acceptance: on the PDP with dynamic checkout on, scroll past the buy box, click the sticky Add to cart. `/cart.js` gains 1 line, the drawer opens and the header count updates.

### P36 - Hero slideshow pagination on-screen (Must)
- Evidence: `hma/offscreen-focus.json`: bullets at x -716/-668/-620. Swiper's `.swiper-pagination-bullets.swiper-pagination-horizontal { left: 0; width: 100% }` outranks the section's `left: 50%`, while the section's `translateX(-50%)` still applies (`sections/slideshow.liquid:582-590`).
- Change: centre with `inset-inline: 0` and `justify-content: center` instead of the transform; set `--swiper-pagination-bottom` rather than fighting Swiper's `bottom`.
- Files: `sections/slideshow.liquid`.
- Acceptance: at 1440 and 375 every bullet's rect lies inside the viewport and is centred within 2 px. Tab focus on a bullet is visible.

### P37 - Visible keyboard focus on variant pills (Must)
- Evidence: `claims-r1.cjs`: focused input box 0x0, label `outline: none`, no box-shadow. The input is `opacity: 0; width: 0` (`assets/variant-picker.css:26`).
- Change: `.variant-picker__item-input:focus-visible + .variant-picker__item-label` uses the theme focus ring.
- Files: `assets/variant-picker.css`.
- Acceptance: keyboard focus on a pill gives the label a computed outline of 2 px or more in `--color-primary`. Mouse click shows no ring.

### P38 - Account address State/Province list populates (Must)
- Evidence: `assets/customer.js:158,165` select `select[data-address-type="province"]`; `sections/main-customers-addresses.liquid:150,263` render `select[name="address[province]"]` without it. This is Haravan VN cascade code (district/ward, `.not-vn`) that has no markup.
- Change: the address modal reads the selected country option's `data-provinces` (`[value, label]` pairs from `country_option_tags`). It fills `address[province]`, keeps the saved value selected, and hides and disables the field when the country has no provinces. The dead district/ward/VN code is removed.
- Files: `assets/customer.js`.
- Acceptance: a static DOM harness with real `country_option_tags` markup: United States gives 50+ options with the saved state selected; Vietnam with no provinces gives the field hidden and disabled; switching country refreshes the list.

### P39 - Preset radius tokens on commerce surfaces (Should)
- Evidence: `radius-probe.json` (above) and `audit-motion-hover.md` MH-21. `DESIGN.md`: "Square corners on buttons, inputs, cards, media and popups; variant pills rounded".
- Change: replace the fixed `--radius-sm/md/lg` and literal radii with the preset tokens on these surfaces: PDP, variant picker, quantity, product card, collection filter/sort, cart, cart drawer, quickview, mobile menu. Buttons use `--buttons-radius`, inputs `--inputs-radius`, media `--media-radius`, cards `--card-corner-radius`, pills `--variant-pills-radius`, badges `--badge-corner-radius`, popups `--popup-corner-radius`, bordered content boxes `--text-boxes-radius`. Circles (`50%`, spinners, dots) stay.
- Files: `assets/product.css`, `variant-picker.css`, `quantity-selector.css`, `product-card.css`, `collection.css`, `cart.css`, `cart-modal.css`, `quickview-modal.css`, `mobile-menu.css`.
- Acceptance: the radius probe on PDP/collection/cart reports each probed element's radius equal to its token for Rebel (buttons/inputs/media 0, pills 40 px).

### P40 - Marquee keeps focused cards in view (Should)
- Evidence: `hma/offscreen-focus.json`: focused `product-card__add-btn` / quickview at x -400 while `mpScroll` runs. Pause is mouse-only via inline JS (`sections/marquee-products.liquid:67-74`).
- Change: CSS `:hover` pause; `:focus-within` stops the animation and turns the track into a horizontal scroller. On `focusin` the focused card is scrolled into view.
- Files: `sections/marquee-products.liquid`.
- Acceptance: Tab into the marquee at 1440. Every focused card's rect lies inside the viewport, and the animation is `none` while focus is inside.

### P41 - Locale-safe storefront URLs in JS (Should)
- Evidence: `routes.root_url` is `/fr` for a non-primary locale, so `root_url + 'products/'` becomes `/frproducts/`. Affected: `assets/product.js:446`, `assets/quickview-modal.js:176`, `assets/search-modal.js:78-83`, `sections/banner-hotspots.liquid:142`.
- Change: build URLs from `window.Shopify.routes.root` (always ends with `/`).
- Files: those four.
- Acceptance: no `root_url) || '/') + '` concatenation remains. Quickview, predictive search and hotspots still load on the primary locale.

### P42 - Article tables are keyboard-scrollable regions (Should)
- Evidence: axe `scrollable-region-focusable` (serious) on the article at 375. `assets/article.css:151-164` makes the `<table>` itself the scroller.
- Change: wrap each `<table>` in `div.article-template__table[role=region][tabindex=0][aria-label]` via Liquid `replace`. The wrapper scrolls; the table returns to table layout.
- Files: `sections/main-article.liquid`, `assets/article.css`, `locales/en.default.json` (`blogs.article.table_label`).
- Acceptance: axe 0 violations on the article at 375 and 1440. The table still scrolls inside its wrapper with no document overflow.

### P43 - Stop loading dead home assets (Should)
- Evidence: `css-usage.cjs` on `/`: 1 of 215 `index.css` rules matches at 375 and at 1440. No template, section, snippet or block renders any class that `index.js` initializes (`grep`, zero hits).
- Change: remove the `index.css` and `index.js` loads from `snippets/head-stylesheets.liquid` and `snippets/head-script.liquid`.
- Files: those two.
- Acceptance: home has no request for `index.css` or `index.js`, and home vision at 3 viewports shows no regression.

### P44 - Contact form recovers after a client error (Must)
- Evidence: the inline script in `sections/page-contact.liquid:323-331` disables submit once `checkValidity()` passes, but `assets/page-contact.js` then blocks the submit (phone regex) and never re-enables it. `claims-r1.cjs`: `submitDisabled: true`, `loadingVisible: true`, no POST. `page-contact.js` hardcodes "Sending...", "Send message", "This field is required", "Invalid email" and "Invalid phone number".
- Change: delete the duplicate inline submit lock (the `contact-page` element owns submit state); source the JS strings from locale-backed data attributes.
- Files: `sections/page-contact.liquid`, `assets/page-contact.js`, `locales/en.default.json`.
- Acceptance: phone `123` shows the error with submit enabled. After a valid phone, submit disables once and POSTs (route intercepted, not sent). No English literal remains in `page-contact.js`.

### P45 - Container invariant (Should)
- Evidence: `.page-width` combined with another class at `sections/banner-hotspots.liquid:18`, `gallery.liquid:20`, `main-cart.liquid:18`, `marquee-products.liquid:26,57`, `spacer-divider.liquid:21`, `video.liquid:44,122` (workspace `AGENTS.md`).
- Change: `.page-width` on its own wrapper, with the component class on a child.
- Acceptance: the class scan finds 0 combined `page-width` elements, and the touched sections show no visual change at 3 viewports.

### P46 - Hover and focus feedback on every actionable control (Should)
- Evidence: `hma-r0.json` lists no-hover controls: marquee "View all", blog post titles, facet summary, sort view buttons, quantity buttons, PDP tab buttons, FAQ questions, article comments link, TOC link, 404 search button. `audit-motion-hover.md` MH-11 (tab/accordion focus), MH-12 (opacity hover on text), MH-14 (`outline: none` without replacement) and MH-23 (filter tag cursor). `shopify-account` has no ring.
- Change: tokenized colour/underline/background hover on each, `:focus-visible` replacements wherever `outline: none` is set, `cursor: pointer` on filter tags, and a focus ring on `shopify-account`.
- Acceptance: the hover probe reports 0 actionable no-feedback controls outside logos. The focus walk reports 0 theme-owned no-indicator stops.

### P47 - Compositor-friendly transitions (Should)
- Evidence: MH-01 (`transition: all` in 15 stylesheets), MH-02 (transitions on `width`/`padding`/`margin`), MH-13 (megamenu `padding-left` hover shift).
- Change: name the properties that change on each state. Move hover shifts to `transform`.
- Acceptance: `grep 'transition:\s*all'` across theme CSS returns 0. The megamenu link hover does not change its box width.

### P48 - Stores search does not scroll on every keystroke (Should)
- Evidence: `assets/page-stores.js:136-141` calls `applyFilters()` with `scrollToResults()` 200 ms after each keystroke.
- Change: scroll only on explicit filter changes (province/district selects, clear), not while typing.
- Acceptance: typing in `#stores-search` leaves `scrollY` unchanged, and choosing a province scrolls to the grid.

### P49 - Unique gift-card recipient IDs (Should)
- Evidence: `blocks/buy_buttons.liquid:18` static `id="gift-card-recipient-toggle"`, `…-email` and `product-template__add` duplicate when a product renders twice (featured product plus quickview).
- Change: suffix IDs with `section.id`/`block.id`, and update the matching `for`/`aria-*` references.
- Acceptance: a static grep shows every `id=` in the block carries a `section.id` or `block.id` suffix, and gift-card journeys still toggle the recipient fields.

### P50 - Organization `sameAs` emitted as escaped JSON (Could)
- Evidence: `snippets/head-meta-tags.liquid:117-124` concatenates raw setting values into JSON strings.
- Change: emit each URL with `| json`.
- Acceptance: the home JSON-LD parses, and `sameAs` lists the configured social URLs.

### P51 - Arrow-key tabs (Could)
- Evidence: `sections/tabs.liquid:25-75` and `assets/search.js:46-56` set `role=tab` with no Arrow/Home/End handling (W3C APG Tabs).
- Change: roving `tabindex` plus Arrow/Home/End keys.
- Acceptance: on a page with tabs, ArrowRight moves focus to and activates the next tab, and only the active tab has `tabindex=0`.

### P52 - Orphaned reCAPTCHA schema locale keys (Could)
- Evidence: `locales/en.default.schema.json:526-534` keys with no schema reference (`audit-liquid.md`).
- Change: remove them after a reference grep proves them unused.
- Acceptance: the locale validator exits 0 and a grep of the removed keys returns 0 references.

### P53 - Inline layout style to custom property (Could)
- Evidence: `sections/image-text-overlay.liquid:41` sets `style="max-width: …rem"`. AGENTS allows dynamic values only as custom properties.
- Change: `style="--content-max-width: …rem"` and a class rule.
- Acceptance: computed `max-width` is unchanged on a test render.

### P54 - Text over home photos reaches 4.5:1 (Must, round 2)
- Evidence: `runs/e2e/photo-contrast.cjs` composites the text colour over every backdrop pixel of the glyph box, text shadow removed. Baseline on `/`: image-with-text-overlay paragraph minimum 2.53 at 375 (16 px, needs 4.5), heading 2.93 (36 px, needs 3); parallax heading 3.46, paragraph 3.02. Causes: subheading and paragraph are `rgba(255,255,255,0.8/0.85)`, and the demo overlays are 40 (ITO) and 45 (parallax).
- Change: opaque white subheading and paragraph in `sections/image-text-overlay.liquid` and `sections/parallax-image.liquid`; demo `overlay_opacity` 40 -> 55 (ITO) and 45 -> 60 (parallax) in `templates/index.json` and the five `listings/*/templates/index.json` (range 0-80, step 5).
- Acceptance: every measured text on `/` passes its WCAG threshold at 375, 768 and 1440; the range validator exits 0.

### P55 - Level-3 megamenu links reachable by keyboard (Must, round 2)
- Evidence: `runs/e2e/mm-level3.cjs` grafts the exact `snippets/megamenu.liquid` level-3 markup onto the first and last dropdowns. Keyboard focus on a level-3 link left `.megamenu__sublinks` at `visibility: hidden` (opened only on `:hover`), and the flipped submenu sat at x -21 (off-screen).
- Change: `:focus-within` opens `.megamenu__sublinks` and `.megamenu__simple-sub` like `:hover`; a `focusin` handler runs the existing measured `checkSubmenuOverflow()` so the flip follows the real position; one never-matching selector removed.
- Files: `assets/megamenu.css`, `assets/megamenu.js`.
- Acceptance: at 1440 and 1100, keyboard and hover both show the level-3 list on-screen (`left >= 0`, `right <= innerWidth`).

### P56 - Article table wrapper has no blank band (Should, round 2)
- Evidence: `runs/e2e/table-band.cjs`: the P42 wrapper ends 21 px below the table at 375 and 1440. `matched-margin.cjs` traces it to an inline `margin-bottom: 20px` inside the merchant article HTML.
- Change: `.article-template__table > table { margin: 0 !important; }`. `!important` is the only way to beat an inline style that comes from merchant content.
- Acceptance: table bottom gap <= 1 px at 375 and 1440.

### P57 - Editor instructions never reach shoppers; copy is locale-backed (Should, round 3)
- Evidence: `sections/blog-posts.liquid:78`, `sections/featured-product.liquid:94` and `sections/promotion-banner.liquid:64` print hardcoded English editor instructions ("Select a blog to display posts" and the others) on the live storefront whenever the setting is empty. `sections/page-contact.liquid:89` and `sections/page-stores.liquid:93` hardcode `title="Email …"`. AGENTS requires locale-backed customer copy.
- Change: the three placeholders render only under `request.design_mode` (the `sections/hero.liquid:228` pattern) and read `sections.featured_blog.empty`, `sections.featured_product.empty` and `sections.promotion_banner.onboarding`. The two `title` attributes use the existing `sections.page_contact.email` key.
- Files: the five sections above, `locales/en.default.json`.
- Acceptance: `runs/e2e/empty-states.cjs` renders the real section Liquid with liquidjs and shows each placeholder only when `design_mode` is true (6 cases). The live `/pages/contact` and `/pages/contact?view=stores` still emit `title="Email <address>"`, and the home blog grid still renders its 3 cards.

### P58 - Preset radius tokens on content surfaces (Should, round 3)
- Evidence: `round-3/radius-scan.json` (1440) and `radius-scan-375.json`: 27 surface classes on home, about, blog, contact, FAQ, stores and search render 4-14 px corners under Rebel, whose tokens are all 0 apart from pills and badges. Examples: `.section-collection-list__card` 8 px, `.testimonial-card` 12 px, `.section-slideshow__content-inner` 12 px, `.contact-main__form` 12 px, `.faq-item` 12 px, `.search-template__submit` 8 px. `round-3/vision/desktop-home-card-corner-zoom.png` shows the rounded collection cards next to square buttons. `round-3/radius-inventory.md` lists 129 fixed-radius rules in 35 files; P39 covered only the commerce surfaces.
- Change: each rule uses the token for what the element is: buttons `--buttons-radius` (a tab track uses `--buttons-radius-outset`), inputs `--inputs-radius`, media `--media-radius`, cards `--card-corner-radius`, popups, tooltips, toasts and megamenu panels `--popup-corner-radius`, bordered text panels `--text-boxes-radius`, badges `--badge-corner-radius`. Circles, pills, dots, scrollbar thumbs, 2 px indicator bars, Swiper bullets and swatch shapes stay as they are.
- Files: the 35 files in `round-3/radius-inventory.md`.
- Acceptance: the static inventory finds only the kept shapes. `radius-scan.cjs` at 375 and 1440 on 10 routes finds no surface that has a non-zero radius and is not a circle, pill or badge. The three viewport captures show no layout change other than the corners.

### P59 - Hero slideshow rotation can be paused and holds for keyboard users (Must, round 3)
- Evidence: `runs/e2e/slideshow-pause.cjs` on the demo home (`auto_slide: true`, 6 s): with focus on a pagination bullet or on the slide CTA the hero keeps cycling slides 0, 1 and 2 inside 12 s, and the hero has no pause/stop control. WCAG 2.2.2 (Pause, Stop, Hide) requires a mechanism for content that moves for more than 5 s; keyboard and screen-reader users lose the CTA they are on.
- Change: a pause/play button (bottom-left, 32 px circle, locale keys `accessibility.pause_slideshow` / `accessibility.play_slideshow`) rendered only when autoplay runs with 2+ slides and revealed by the script. Rotation holds while a mouse is over the hero, while focus is inside it (except on the button itself), and after the shopper presses pause, until they press play. The progress bar pauses or resets with the rotation, and the slide wrapper switches `aria-live` to `polite` while rotation is stopped. The region label falls back to the new `accessibility.slideshow` key instead of a hardcoded "Slideshow".
- Files: `sections/slideshow.liquid`, `locales/en.default.json`.
- Acceptance: `slideshow-pause.cjs` shows rotation while idle, after the mouse leaves and after play; holds on hover, on CTA focus, on bullet focus and after pause (also after focus leaves the hero); the button label toggles between "Pause slideshow" and "Play slideshow"; `aria-live` reads `off` while rotating and `polite` while held.

### P60 - Colour tokens used in the wrong format drop focus rings and hover colour (Must, round 3)
- Evidence: `--color-primary` is a full colour (`rgb(var(--color-button))`), but 14 rules wrap it again as `rgb(var(--color-primary))` or `rgba(var(--color-primary), 0.06)`, and two rules use the triplets `--color-price` and `--color-background` bare. Each declaration is invalid at computed-value time. `round-3/color-token-before.json`: the predictive-search result link has `outline: none` on focus (no visible focus indicator), result hover colours, prices and the search error fall back to the inherited colour, table row hover turns the zebra row transparent, the cart drawer total ignores the scheme price colour and the selling-plan select has no background.
- Change: full-colour tokens are used as-is (`var(--color-primary)`), translucent variants read the triplet (`rgba(var(--color-primary-rgb), 0.06)`), triplets are wrapped (`rgb(var(--color-price))`, `rgb(var(--color-background))`). The table corner radius moves to `--text-boxes-radius` with the P58 migration.
- Files: `assets/search-modal.css`, `assets/theme.css`, `assets/cart-modal.css`, `assets/product.css`.
- Acceptance: a token-format scan of every CSS and Liquid file (full-colour tokens inside `rgb()`/`rgba()`, triplet tokens used bare in colour properties) finds 0 rules. `round-3/color-token-after.json`: the predictive-search link shows a 2 px crimson outline on focus.

### P61 - Checkbox and radio inputs show the pointer cursor (Could, round 3)
- Evidence: `round-3/hma/hma-r2.json`: hovering the facet checkboxes and the price-preset checkboxes on `/collections/all` changes their colour, but the cursor over the box itself is `default`, while the label text around it is `pointer`.
- Change: the global cursor reset in `assets/theme.css:2-6` also covers `input[type="checkbox"]` and `input[type="radio"]`. Disabled facet items keep `pointer-events: none`.
- Files: `assets/theme.css`.
- Acceptance: `runs/e2e/cursor-check.cjs` reads `cursor: pointer` on the facet checkboxes, the price presets and the PDP variant radios.

### P62 - Page width token caps the layout at the merchant setting (Must, round 4)
- Evidence: `snippets/head-design-systems.liquid:82` and the duplicate block in `layout/password.liquid` emitted `--page-width: {{ settings.page_width | divided_by: 10 }}rem`. With the preset value 1200 that is `120rem`, so `.page-width` resolved to a 1920 px cap and the "fixed" container never constrained wide screens.
- Change: emit the setting in px (`--page-width: {{ settings.page_width }}px`), drop the password layout's private copy of the token block (P67), and raise the five preset `page_width` values to 1600 (user-approved `config/settings_data.json` edit; range 1000-1600, step 100).
- Files: `snippets/head-design-systems.liquid`, `layout/password.liquid`, `config/settings_data.json`.
- Acceptance: `round-4/page-width-after.json`: `--page-width` reads `1600px`; `main .page-width` is 1280 px wide at 1280, 1440 at 1440 and 1600 at 1920 on home, collection and article. The range validator exits 0.

### P63 - Article table of contents is rendered on the server (Should, round 4)
- Evidence: round-3 `perf-probe.json`: the article at 375 has CLS 0.069, 0.064 of it from `content-toc` growing from its `min-height: 7rem` placeholder to the built list and pushing the article body down.
- Change: `snippets/content-toc.liquid` takes the article HTML (`content:`), splits it on `<h` and renders the h2/h3 entries with the same slugs `assets/content-toc.js` assigns, so the client build swaps in a list of the same size. `content-toc.js` skips empty headings. New locale key `blogs.article.table_of_contents`.
- Files: `snippets/content-toc.liquid`, `sections/main-article.liquid`, `assets/content-toc.js`, `locales/en.default.json`.
- Acceptance: `round-4/toc-ssr.json`: JavaScript-off and live TOC entries are identical (4 entries, 4 working anchors) and the box height is the same before and after the script at 375 (265 px) and 1440 (207 px). The residual 0.064 shift at 375 is traced in P70.

### P64 - About hero downloads one image per viewport (Should, round 4)
- Evidence: `round-4/hero-requests-before.json`: `/pages/about` downloads both the mobile and the desktop hero at 375 and at 1440, each `loading=eager fetchpriority=auto`, because the section rendered two `<img>` elements and hid one with CSS.
- Change: one `<picture>` with a `(max-width: 749px)` `<source>` when the mobile art differs; the single `<img>` keeps the LCP attributes.
- Files: `sections/hero.liquid`.
- Acceptance: `round-4/hero-requests-after.json`: one hero request at each width (`rebel-page-about-hero-mobile.jpg` at 375, `rebel-about-hero-atelier.jpg` at 1440), `loading=eager fetchpriority=high`, and it is the LCP element.

### P65 - One image-priority budget per collection page (Should, round 4)
- Evidence: round-4 `perf-probe.json` and `lcp-origin.cjs`: on `/collections/all` the LCP at 375 and 1440 is a best-sellers carousel card with `loading=lazy fetchpriority=auto`. The carousel renders above the grid, but only the grid's first row was eager and only the grid's first card had `high`.
- Change: `sections/main-collection.liquid` computes `image_priority_taken` from the block order (banner first, then best sellers, then the grid). `snippets/collection-best.liquid` gains a `priority` param that loads its first desktop row eagerly and gives the first card `fetchpriority=high`.
- Files: `sections/main-collection.liquid`, `snippets/collection-best.liquid`.
- Acceptance: `round-4/perf-probe-collection-after.json`: the LCP image on `/collections/all` and `/collections/outerwear` is `eager high` at 375 and 1440, exactly one `high` image per page, and no primary image above the fold is lazy.

### P66 - Article heading hierarchy and readable body size (Should, round 4)
- Evidence: `round-4/type-scale-article.json`: at 1440 the article `h1` is 30 px / 400 while body `h2` is 30 px / 700 (the section heading outranks the title), `h3` 24 px; at 375 body paragraphs are 14 px / 21 px line height inside a 17 px container.
- Change: article paragraphs inherit the 17 px container size and line height. `h2` and `h3` use `--font-2xl` and `--font-xl` from 1024 px; `h4` inherits on mobile and uses `--font-lg` from 750 px.
- Files: `assets/article.css`.
- Acceptance: `round-4/type-scale-article-after.json`: at 1440 h1 30 > h2 24 > h3 20 > h4 18 >= p 17; at 375 h1 24 > h2 20 > h3 18 > h4 17 = p 17 with 29.75 px line height. `round-4/crop-article-body-*.png` reviewed.

### P67 - Password page has its own layout, logo and labelled forms (Must, round 4)
- Evidence: `round-4/shots/desktop-password-loaded.png`: `templates/password.json` had no `layout`, so Shopify rendered it inside `theme.liquid` with the full storefront header (21 nav links, cart and search, all behind the gate). In the committed section (`HEAD:sections/main-password.liquid:45-53`) a wrong password re-renders its `role=alert` error inside a `<details>` that is closed again, so the shopper sees no feedback; neither error is tied to its input.
- Change: `"layout": "password"` in `templates/password.json` and the five `listings/*/templates/password.json`; `layout/password.liquid` rebuilt on the theme head snippets (`head-meta-tags`, `head-fonts`, `head-color-schemes`, `head-design-systems`); header shows the logo or shop name; the inputs get `<label>` elements (visually hidden; the visible prompt is the heading and summary text) and `aria-invalid`/`aria-describedby` pointing at their error; the `<details>` starts open after a failed attempt; new `assets/password.css`.
- Files: `layout/password.liquid`, `templates/password.json`, `listings/*/templates/password.json`, `sections/main-password.liquid`, `sections/main-password-header.liquid`, `sections/main-password-footer.liquid`, `assets/password.css`.
- Acceptance: `round-4/shots-after/*-password-loaded.png` at 3 viewports: 0 nav links, 0 overflow, footer at the viewport bottom. `round-4/password-interact.json`: 8 keyboard stops at 375 and 1440, each with a 2 px visible outline and on screen, 1 `h1`, one each of `header`/`main`/`footer`.

### P68 - Article hero `sizes` matches the rendered box (Should, round 4)
- Evidence: `round-4/article-box-before.json`: the hero `sizes` repeated `(min-width: 1600px)` and ignored the 75 px desktop gutter and the sidebar, so it asked for 1228 px at 1920 (box 1138), 1068 at 1440 (box 978) and 964 at 1024 (box 874).
- Change: `sizes` built from the container mode, the gutters (15/30/75 px), the 280 px sidebar plus 32 px gap from 1280 px, and `settings.page_width`.
- Files: `sections/main-article.liquid`.
- Acceptance: `round-4/article-box-after.json`: the `sizes` value resolves to the rendered width at 768, 1024, 1280, 1440 and 1920 (708, 874, 818, 978, 1138 px).

### P69 - Search loads its first product row eagerly (Could, round 4)
- Evidence: round-4 `perf-probe.json`: `/search?q=jacket` at 1440 lazy-loads the fourth first-row card; `sections/main-search.liquid:77` made only 3 cards eager while the grid has 4 columns from 1200 px.
- Change: the first 4 product cards are eager; the first keeps `fetchpriority=high`.
- Files: `sections/main-search.liquid`.
- Acceptance: a re-probe shows no lazy primary product image above the fold on `/search?q=jacket` at 1440.

### P70 - Product page holds its layout while scripts start (Should, round 5)
- Evidence: `round-4/shift-pdp-375.json` CLS 0.049 and `round-4/shift-pdp-1440.json` CLS 0.043. Before Swiper started, the thumbnail strip laid out at full width and then shrank to 4.5 columns, and the slider arrows painted in their unstyled position. At 1440 the tab nav buttons were moved from `<template>` into the tablist only after `product.js` ran, so the tabs and the share row grew late.
- Change: the thumbnail strip declares its own pre-init columns and gaps (`--swiper-cols-*: 4.5`, 8 px/15 px gaps), so the CSS pre-init grid matches Swiper. Slider arrows stay hidden until Swiper has started. The tabs block mounts its nav buttons with a small inline script right after the markup, before first paint. `initTabs` keeps the template move only for re-rendered sections in the theme editor.
- Files: `assets/product.css`, `assets/theme.css`, `blocks/tabs.liquid`, `assets/product.js`.
- Acceptance: `round-5/shift-pdp-375-after.json` CLS 0.0000 and `shift-pdp-1440-after.json` 0.0013. `round-5/pdp-prejs-after.json`: media slider, thumbnails, tabs, tab nav and share row have the same box with JavaScript off and on at 375 and 1440.

### P71 - Article byline no longer re-wraps while fonts load (Should, round 5)
- Evidence: `round-5/meta-reflow.json` and `meta-reflow-control.json`: the article at 375 has CLS 0.0641 from the category, author, date and comments row. The fallback font fits it on 2 lines and Inter 700 on 3, so the row re-wraps when the bold face lands. Preloading the bold face did not fix it in the real head (`meta-reflow-after-1..3.json` still 0.0641), so that change was reverted.
- Change: below 750 px the category kicker takes its own line (`flex-basis: 100%`), so the wrap no longer depends on glyph widths. From 750 px it returns to the inline row.
- Files: `assets/article.css`.
- Acceptance: `round-5/meta-reflow-css-1..3.json` CLS 0.0000 at 375 on three runs, and `meta-reflow-css-768.json` and `meta-reflow-css-1440.json` 0.0000.

### P72 - Product description read-more honours its setting and only appears when it helps (Should, round 5)
- Evidence: `round-5/readmore.json`. With `description_readmore` off the Liquid still added `is-collapsed`, and `product.js` hid the toggle only after the first paint. A short description (the balm at 1440, 239 px against a 300 px limit) still showed the toggle in some states, and the button had no `aria-expanded` or `aria-controls`.
- Change: `is-collapsed` and the toggle render only when the setting is on. `initDescriptionToggle` keeps one state per wrapper and collapses only when that saves more height than the toggle costs. A `ResizeObserver` re-checks when a hidden tab panel becomes visible. The button carries `aria-expanded` and `aria-controls`. The dead readmore-disabled branch is removed.
- Files: `assets/product.js`, `assets/product.css`, `blocks/description.liquid`, `blocks/tab.liquid`.
- Acceptance: `round-5/readmore-after.json`: the bomber collapses to 300 of 644 px at 375 and 300 of 378 px at 1440, with the toggle `aria-expanded` false then true then false. The balm (304 px at 375, 239 px at 1440) shows no toggle and no gradient. PDP CLS after the change: bomber 0.0000 at 375 and 0.0009 at 1440, balm 0.0000 at 375 and 0.0063 at 1440 (`shift-*-after2.json`).

### P73 - Untitled product tabs use a translated fallback (Should, round 5)
- Evidence: `blocks/tab.liquid:61` and `sections/tabs.liquid:37` fell back to the hardcoded English `'Tab'` when a merchant cleared the title, which breaks the locale-backed copy rule in `AGENTS.md`.
- Change: both fall back to `general.tabs.untitled` ("Details"), translated before it reaches `default`.
- Files: `blocks/tab.liquid`, `sections/tabs.liquid`, `locales/en.default.json`.
- Acceptance: an offline liquidjs render shows titled tabs keep their title and blank ones render "Details" in both the block and the section. `validate-locales.mjs` resolves 100% of keys.

### P74 - Tablet product page shows the buy box above the fold (Must, round 5)
- Evidence: `round-5/buybox-before.json`: at 768x1024 the page stayed single column until 992 px, so Add to cart sat at y=1832 and Buy it now at y=1888, both a full screen below the fold (`round-5/shots/768-products-rebel-tactical-bomber-jacket-fold.png`). The variant picker had 0 px bottom margin, so the Size row touched the quantity label. The quantity label used a different size and colour from the variant labels.
- Change: two columns (`1fr 1fr`) with sticky media from 750 px, and `1fr 1.5fr` from 992 px. The image-grid gallery uses 2 columns only from 992 px. Media `sizes` uses `calc(50vw - 40px)` for 750-991 px. The variant picker gets `--space-lg` below it, and the quantity label uses the variant label size and colour. The mobile dynamic checkout button matches the 48 px theme buttons.
- Files: `assets/product.css`, `sections/main-product.liquid`.
- Acceptance: `round-5/buybox-after.json`: at 768 Add to cart is at y=556 (bomber) and y=647 (balm), above the 1024 fold. At 1440 it is at y=568/608 and at 375 below a 632 px image, as before. The hero renders 344 px and the `sizes` resolves to 344 at 768. No overflow at any width. Vision: `round-5/shots-after/768-*-fold.png` shows title, price, options, quantity, Add to cart and Buy it now beside the image.

### P75 - Slider arrows are readable over photos (Should, round 5)
- Evidence: `round-5/buybox-before.json`: every `.swiper-button-*` drew a black chevron at 0.25 opacity on 50% white, about #bfbfbf on near-white, far below the 3:1 non-text contrast of WCAG 1.4.11. A hover rule showed it at full opacity only on pointer devices.
- Change: arrows use the scheme background at 0.85 and the scheme text colour at full opacity; hover still turns the chevron crimson. The announcement bar keeps its own transparent nav, which loads after `theme.css`.
- Files: `assets/theme.css`.
- Acceptance: `round-5/buybox-after.json`: arrow background `rgba(245, 242, 237, 0.85)`, chevron `rgb(10, 10, 10)` at opacity 1 at all three widths. A disabled arrow keeps Swiper's 0.35 opacity.

### P76 - Subscription options match the brand and the type scale (Could, round 5)
- Evidence: `round-5/shots/1440-products-leather-care-balm-fold.png` and `buybox-before.json`: the one-time/subscribe radios were 13 px with the browser's blue accent. The labels and the plan select used `var(--font-size-sm, 14px)`, a token that does not exist, so they always fell back to a literal 14 px.
- Change: the radios are 16 px with `accent-color: var(--color-primary)` and a 2 px focus outline, the pattern already used by the facet and contact checkboxes. Labels and the select use `--font-sm` and `--font-weight-medium`.
- Files: `assets/product.css`.
- Acceptance: `round-5/buybox-after2.json`: radio accent `rgb(188, 30, 44)`, 16x16 px at 375, 768 and 1440 on the balm, with no overflow.

### P77 - Floating controls clear the mobile sticky add-to-cart bar (Must, round 6)
- Evidence: `round-6/float-overlap-before.json`: with the PDP sticky bar visible at 375 and 768 (bar at y 690-813 at 375), back-to-top sat inside the bar at y 756-796 and the probe recorded the bar's image and Add button as covered (image 3303 px², button 7263 px² at 375; image 5603 px² at 768). Toasts opened over the same strip.
- Change: `ProductStickyAdd` measures its own height with a `ResizeObserver` into `--product-sticky-add-height` on `<html>` and removes it on disconnect. Below 768 px, `:root:has(.product-sticky-add.is-visible)` maps that height to `--floating-offset-bottom`. Back-to-top, the contact FAB and the toast stack add the offset to their `bottom` and transition it.
- Files: `assets/product.js`, `assets/product.css`, `assets/back-to-top.css`, `assets/float-social.css`, `assets/toast.css`.
- Acceptance: `round-6/float-probe-after2.json`: `covered` is empty at 375 and 1440 with the bar visible; at 375 back-to-top and the FAB end 139 px above the viewport bottom (123 px bar + 16 px gap) and return to 24/16 px when the bar hides. `round-6/shots/375-pdp-sticky-floats.png`.

### P78 - Contact FAB uses brand tokens, has a visible hover and returns focus (Should, round 6)
- Evidence: `round-1/audit-motion-hover.md` and `audit-js.md`: the toggle ran an infinite `transform` bounce, so its `:hover` scale never showed; it used a hard-coded orange gradient (`#ff6b35`), `#4CAF50`, `#333`/`#555` and literal radii instead of the preset; Escape closed the panel but left focus inside it; re-inserting the element added a second click listener.
- Change: the toggle is `--color-primary` with button-text colour and no idle animation; only the small badge pulses, in `--color-success`. Panel, links and icons use `--popup-corner-radius`, `--buttons-radius` and `--media-radius`. Listeners are stored and removed in `disconnectedCallback`; Escape returns focus to the toggle when focus was inside.
- Files: `assets/float-social.css`, `assets/float-social.js`.
- Acceptance: `round-6/float-probe-after2.json`: hover transform `matrix(1.1, 0, 0, 1.1, 0, 0)`, toggle background `rgb(188, 30, 44)`, Escape gives `isOpen false` with focus on the toggle, Tab moves into the panel, a click after re-insert opens it once, an outside click closes it. `round-6/shots/375-pdp-float-social-open.png`, `1440-pdp-float-social-open.png`.

### P79 - Contact channels are locale-backed and announce new windows (Should, round 6)
- Evidence: `snippets/float-social.liquid` at HEAD: 12 copy-pasted channel blocks with English defaults in Liquid (`'Contact us'`, `'Hotline'` ...), an enabled channel with a blank link still rendered (`tel:` or an empty `href`), external links opened a new window without telling assistive technology, and a channel image's `alt` repeated the visible label.
- Change: one loop over the 12 channels keeps the original order, icons and `tel:`/`mailto:` schemes. Panel title, subtitle and channel labels fall back to new `general.social.panel_*` and `general.social.channels.*` keys. A channel renders only when enabled and linked. External links carry `aria-describedby="a11y-new-window-message"`. Channel images use `image_tag` with `alt=""` because the text label names the link.
- Files: `snippets/float-social.liquid`, `locales/en.default.json`.
- Acceptance: offline liquidjs render with all 12 channels enabled and one link blank gives 11 items, 0 `MISSING` keys, `tel:`/`mailto:` with no `target`, and a merchant label override wins; `validate-locales.mjs` exit 0.

### P80 - Shopify images render through `image_tag` (Should, round 6)
- Evidence: hand-written `<img src="{{ … | image_url }}">` without `srcset` in `snippets/product-sticky-add.liquid`, `blocks/commitment.liquid`, `blocks/icon_with_text.liquid`, `blocks/tab.liquid`, `templates/product.quickview.liquid` and `sections/main-customers-order.liquid`, against the project rule in `AGENTS.md`.
- Change: each renders `image_url | image_tag` with `widths`, `sizes`, `width`, `height`, `alt` and `loading`. Decorative icons get `alt=""`. The `<source srcset>` art-direction entries in `hero`, `slideshow` and `page-about` stay, because `image_tag` cannot emit `<source>`.
- Files: the six files above.
- Acceptance: live HTML of the bomber PDP and `?view=quickview` shows `srcset` and `sizes` on the sticky and quickview images, 0 Liquid errors, and 0 double-escaped `alt` values on `/`, `/collections/all`, the PDP, `/pages/about` and the article.

### P81 - Component surfaces follow the active colour scheme (Must, round 7)
- Evidence: `round-7/preset-contrast-before.json`: with the Cyber preset's scheme CSS on the live pages, 230 text nodes fail WCAG 1.4.3 (Rebel: 8). The cart drawer, search panel, megamenu, mobile menu, filter drawer, quick view, tabs, cards and inputs paint `var(--color-white)` or `#fff` while their text takes the scheme text colour, so Cyber renders `rgb(226, 232, 240)` on white (1.16:1); nav labels were `var(--color-black)` on the dark header (1.09:1). `round-7/fixed-colour-inventory.tsv` lists 326 fixed colour declarations in 31 stylesheets.
- Change: `snippets/head-color-schemes.liquid` emits `--color-surface` per scheme: `#FFFFFF` while the scheme text keeps 4.5:1 on white, otherwise the scheme's `background_2`. 149 declarations in 22 stylesheets move from constant white/black/grey to `--color-surface`, scheme text, `--color-gray`, `--color-gray-light` or `rgb(var(--color-button-text))`; constant white stays on brand, status and photo backdrops. Megamenu triggers take `--header-text`; the FAQ surface takes `--color-surface`.
- Files: `snippets/head-color-schemes.liquid`; `assets/404.css`, `article.css`, `blog.css`, `cart-modal.css`, `collection.css`, `float-social.css`, `header.css`, `list-collections.css`, `megamenu.css`, `mobile-menu.css`, `page-contact.css`, `page-faq.css`, `page-stores.css`, `product-card.css`, `product.css`, `quantity-selector.css`, `quickview-modal.css`, `search-modal.css`, `section-pagination.css`, `skip-to-content-link.css`, `theme.css` and the remaining converted sheets in the diff.
- Acceptance: the live server emits `--color-surface: #FFFFFF; #FFFFFF; #252525; #5C151E` for the four Rebel schemes. `round-7/preset-contrast-after2.json` (Rebel and Cyber, 375 and 1440, 9 routes plus search, cart and menu open): Cyber 230 -> 5, Rebel 8 -> 4, and every remaining item is exempt: the disabled `Pages` search tab with 0 results (WCAG 1.4.3 inactive component, `disabled` in the live HTML) and one slideshow CTA captured mid-fade (`round-7/slide-btn.json`: the active slide's CTA reaches opacity 1, white on `rgb(188, 30, 44)`). Rebel computed colours (`round-7/style-rebel-before.json` vs `style-rebel-after.json`, 0 noise between two baseline runs) change only from `rgb(0, 0, 0)` to the scheme text `rgb(10, 10, 10)`; the two conversion regressions found there (megamenu triggers inheriting 0.75 alpha, FAQ search input losing its transparent fill) are fixed and re-measured (`style-rebel-home-after2.json`, `faq-input-after.json`).

### P82 - Description fade matches its host surface (Should, round 7)
- Evidence: `round-7/fade-before.json`: the read-more fade was a constant `rgba(255, 255, 255, …)` gradient, so on a dark scheme it drew a white band over the description.
- Change: the tabs host sets `--description-fade-bg: var(--color-surface)` and the `::after` gradient mixes from transparent to that colour.
- Files: `assets/product.css`.
- Acceptance: `round-7/fade-presets-after.json`: the collapsed fade ends at the host background in both presets: Rebel `rgb(255, 255, 255)`, Cyber `rgb(21, 24, 33)` at 375 and 1440.

### P83 - Product meta separators are CSS, and empty SKU/barcode use a locale string (Should, round 7)
- Evidence: `blocks/product_meta.liquid` rendered `<li class="product-template__meta-separator">|</li>` between items, so screen readers counted separators as list items, and the separator measured 1.32:1 (`round-7/preset-contrast-before.json`). Empty SKU and barcode rendered a hardcoded `'N/A'` in Liquid and in `assets/product.js`.
- Change: a 1 px `::before` on each following item, centred in the list's column gap and clipped at the start of a wrapped line; the `<li>` separators are removed. Empty values use the new `products.product.meta_unavailable` key, exposed to JavaScript as `themeConfig.strings.variant.metaUnavailable`.
- Files: `blocks/product_meta.liquid`, `assets/product.css`, `assets/product.js`, `snippets/head-script.liquid`, `locales/en.default.json`.
- Acceptance: `round-7/meta-after2.json`: 3 items and 0 separator `<li>` on the bomber and the balm at 375, 768 and 1440; separators sit midway in the gap and are hidden at line start; clearing the SKU in the browser renders `N/A` from the locale; 0 overflow. Crops: `round-7/shots/*-meta.png`.

### P84 - Article table header follows the scheme (Should, round 7)
- Evidence: `round-7/preset-contrast-after.json`: article `th` painted `var(--color-gray-light, #f5f5f5)`, a translucent token, over the merchant's inline `#f4f4f4` row style, so Cyber header text measured 1.11:1.
- Change: the header cell paints an opaque `color-mix` of 6% scheme text into the scheme background.
- Files: `assets/article.css`.
- Acceptance: `round-7/preset-contrast-after2.json`: 0 failures on the article in Rebel and Cyber at 375 and 1440.

### P85 - Hidden hero slides leave the Tab order (Must, round 8)
- Evidence: `round-8/invisible-focus-before.json`: walking Tab through `/` at 1440 lands 7 times on CTAs of hero slides that are faded out (`opacity: 0` on `.section-slideshow__buttons`), so the keyboard user sees no focus for 7 stops.
- Change: the slideshow script sets `inert` on every slide except the active one at init and on each `slideChange`.
- Files: `sections/slideshow.liquid`.
- Acceptance: `round-8/invisible-focus-after-home.json`: 0 invisible stops on `/` at 375 and 1440 (298 and 297 stops walked). After a bullet click or arrow key the active slide loses `inert` and the others keep it, and Shift+Tab from the bullets lands outside the slides.

### P86 - Accent and button colours used as text reach 4.5:1 in every scheme (Must, round 8)
- Evidence: `round-8/preset-contrast-other.json` (round-7 code with the Noir, Vibrant and Botanical scheme CSS on the live pages): Vibrant 303, Botanical 109 and Noir 6 text nodes fail WCAG 1.4.3. The largest group is `--color-primary` and the raw accent used as text colour, for example orange `#FF5E00` on cream at 2.67:1.
- Change: `snippets/head-color-schemes.liquid` emits `--color-accent-text` and `--color-primary-text` per scheme: the accent or button colour mixed toward the scheme text in 10% steps until it reaches 4.6:1 on both `background` and `background_2`. Every text-colour use of the accent, link or primary token moves to these tokens (175 uses in 55 files); fills, borders and outlines keep the brand colour. Hover rules that only lightened a content link now thicken its underline.
- Files: `snippets/head-color-schemes.liquid` plus the converted stylesheets and section styles in the diff.
- Acceptance: `round-8/render-floor.txt` (liquidjs render of the real snippet for all 20 preset schemes, with `color_contrast` rounded to one decimal as Shopify documents it: `'#E800B0' | color_contrast: '#D9D8FF'` returns `3.0`): every accent-text and primary-text value is 5.16:1 or more on `background` and 4.66:1 or more on `background_2`, except Botanical scheme-4 at 4.25:1 on `background_2`, where the scheme text itself is 4.25:1. The 4.6 threshold survives rounding: the lowest raw ratio that rounds to 4.6 is 4.55. The live server emits `--color-primary-text: #bc1e2c` for Rebel scheme-1 and `#d37379` for scheme-3, so Rebel changes only on dark schemes (`round-8/style-rebel-after.json` vs `round-7/style-rebel-after.json`: the testimonials subheading on scheme-3 moves from `rgb(232, 74, 87)` to `rgb(235, 108, 117)`).

### P87 - Muted text keeps 4.5:1 through a per-scheme alpha floor (Must, round 8)
- Evidence: same baseline. Muted text at 0.45 to 0.7 alpha passes on bone and fails on light green or cream (Botanical `p.section-blog-posts__excerpt` 0.6 alpha at 3.51:1, Vibrant `p.section-stats__subheading` 3.06:1).
- Change: each scheme emits `--text-alpha-floor`, the lowest foreground alpha (5% steps from 45%) that reaches 4.6:1 on `background` and `background_2`. 79 muted-text rules and the derived `--color-paragraph`, `--color-gray` and `--color-gray-dark` use `max(<alpha>, var(--text-alpha-floor))`. Placeholders, disabled options and decorative icons keep their alpha.
- Files: `snippets/head-color-schemes.liquid`, `snippets/head-design-systems.liquid` and the converted stylesheets and section styles.
- Acceptance: `round-8/render-floor.txt`: floors are Rebel 0.6/0.6/0.5/0.6, Noir 0.6/0.6/0.5/0.5, Vibrant 0.65/0.65/0.5/0.95, Botanical 0.75/0.7/0.55/1, Cyber 0.55/0.55/0.5/0.5; the lowest muted ratio is 4.56:1 (Rebel scheme-3 and Noir scheme-4 on `background_2`), apart from Botanical scheme-4 at 4.25:1 (floor 1, the scheme text itself). The live server emits `--text-alpha-floor: 0.5` on `.color-scheme-3` and 0.6 on the other Rebel schemes, matching the rounded render; the harness first rendered 0.55 there because its `color_contrast` shim did not round, and `harness-fidelity.cjs` now reports 0 token diffs between the injected Rebel CSS and the live tokens. `max()` resolves in every scheme. Chrome computes the search tab as `rgba(10, 10, 10, 0.6)` instead of 0.58 in Rebel. Browser floor (caniuse `css-math-functions` and `calc` data): `max()` ships in Chromium 79, Firefox 75 and Safari 11.1 (Safari lacks only `clamp()` before 13.1), and math inside colour functions works from Firefox 59. No `clamp()` was added to colour values.

### P88 - Vibrant text on orange is near-black (Must, round 8, user-approved preset change)
- Evidence: white on `#FF5E00` measures 3.06:1 on the primary CTA, cart count, New badge, contact submit and the scheme-4 newsletter (`round-8/preset-contrast-other.json`).
- Change: with the user's approval ("keep orange, switch the text to #1A1A1A"), the Vibrant preset in `config/settings_data.json` sets `button_label` to `#1A1A1A` in scheme-1 and scheme-2, and scheme-4 `accent`, `text`, `secondary_button_border`, `secondary_button_label`, `form_text` and `color_price` to `#1A1A1A`. The New badge takes the button label colour so it follows the same rule.
- Files: `config/settings_data.json` (Vibrant preset only; `current` stays Rebel), `assets/product-card.css`.
- Acceptance: `#1A1A1A` on `#FF5E00` 5.68:1 and on `#EA580C` 4.89:1. `round-8/preset-contrast-after2.json`: Vibrant 303 -> 4 failures. `settings_data.json` parses and the range validator exits 0.

### P89 - Five presets pass WCAG 1.4.3 on the core routes (Must, round 8)
- Evidence: P86-P88 together; round 7 covered only Rebel and Cyber.
- Change: none beyond P86-P88; this is the cross-preset acceptance.
- Acceptance: `round-8/preset-contrast-after2.json` (5 presets x 375 and 1440 x 9 routes, plus search panel, cart drawer and menu open on `/`): 4 failures per preset, all the disabled `Pages` search tab with 0 results, which WCAG 1.4.3 exempts as an inactive component.

### P90 - Empty cart illustration follows the active scheme (Should, round 8)
- Evidence: the round-8 vision review of the empty cart drawer (`round-8/vision/cart-svg-375.jpg` before the fix) showed a crimson wave on a bone bag in every preset. `assets/cart-empty-illustration.svg` was an `<img>` with literal `#c41e33`, `#f7f4ef` and `#2d2a27` fills, so Noir, Vibrant, Botanical and Cyber all showed Rebel colours.
- Change: `snippets/cart-modal.liquid` inlines the drawing as a decorative SVG (`aria-hidden`, `focusable="false"`). Its wave, bag, line, accent and dot classes read `--color-primary`, `--color-bg`, `--color-border` and `--color-text` in `assets/cart-modal.css`, and its tile follows `--media-radius`. The SVG asset had no other consumer and was deleted.
- Files: `snippets/cart-modal.liquid`, `assets/cart-modal.css`, `assets/cart-empty-illustration.svg` (deleted).
- Acceptance: in `round-8/cart-svg.json` the wave is the preset's button colour (Rebel `rgb(188, 30, 44)`, Noir `rgb(17, 17, 17)`, Vibrant `rgb(255, 94, 0)`, Botanical `rgb(59, 83, 62)`, Cyber `rgb(0, 255, 204)`). The tile uses the scheme text at 4% alpha. Botanical's tile radius is 12 px and the square presets' is 0. `round-8/vision/cart-svg-375.jpg` shows no Rebel colour leaking into another preset.

### P91 - Facet filters stop multiplying fetches after a section reload (Should, round 9)
- Evidence: `round-9/facet-lifecycle-before.json`. After 2 simulated `<facet-filters>` reloads, one `popstate` fires 3 section fetches. `FacetFilters` added `popstate`, document `click` and document `keydown` listeners in `connectedCallback` and only `popstate` was removed.
- Change: `FacetFilters` creates an `AbortController` (`this.lifecycle`) in `connectedCallback`. Every window and document listener passes its signal, and `disconnectedCallback` aborts it.
- Files: `assets/collection.js`.
- Acceptance: `round-9/facet-lifecycle-after.json` reports 1 fetch per `popstate` after 2 reloads, and the description toggle still works.

### P92 - Contact form validates once per event after a re-attach (Should, round 9)
- Evidence: `round-9/contact-lifecycle-before.json`. After `<contact-page>` is attached twice, one blur runs `validateField` 3 times and 3 `pageshow` listeners come from `page-contact.js`.
- Change: `ContactPage` binds every listener with a lifecycle `AbortController` signal. `disconnectedCallback` aborts it and removes the `beforeunload` guard.
- Files: `assets/page-contact.js`.
- Acceptance: `round-9/contact-lifecycle-after.json` reports 1 validation per blur and 1 `pageshow` listener from the script.

### P93 - Header, footer and PDP controls survive a section reload (Should, round 9)
- Evidence: `round-9/cart-trigger-reload-before.json`: the header cart icon opens the drawer before a header reload and does nothing after it, at 375 and 1440. `round-9/section-reload-before.json`: after a Section Rendering API reload with `shopify:section:load`, the mobile menu stays closed, the footer accordions no longer toggle, the PDP lightbox no longer opens, and the gift card recipient fields stay disabled when the checkbox is ticked. These scripts bound section-owned elements once at `DOMContentLoaded`, so the theme editor breaks them on every edit.
- Change: `cart-modal.js` and `mobile-menu.js` delegate their trigger clicks from `document`. `footer.js` (`initAll`) and `product.js` (`initProductLightbox`, `initGiftCardRecipients`) also run on `shopify:section:load`, with per-element bound flags so a re-run never double-binds.
- Files: `assets/cart-modal.js`, `assets/mobile-menu.js`, `assets/footer.js`, `assets/product.js`.
- Acceptance: the `-after.json` files show the cart drawer, mobile menu, footer accordions, lightbox and gift card fields working after the reload, at both widths where measured.

### P94 - Cart failures show a localized message, never a raw error (Must, round 9)
- Evidence: `round-9/error-paths-before.json` (HEAD scripts replayed on the live page with request failures forced by Playwright). A network failure shows the toast `Failed to fetch`, an HTML 500 shows `Unexpected token '<', "<!doctype "... is not valid JSON`, and a drawer refresh failure shows `HTTP 500 for /cart.js`, in both the drawer and on `/cart`.
- Change: `postCart`/`fetchCartItemsHtml` in `assets/cart-modal.js` and `requestCart`/`refreshSection` in `assets/cart.js` wrap the fetch and the JSON parse. They rethrow `AbortError` and map network, HTTP and parse failures to a locale fallback key (`error`, `noteError`, `invoiceError`). Shopify's 422 `description` (for example a stock limit) still passes through. `loadCart` shows the locale string, not the exception text.
- Files: `assets/cart-modal.js`, `assets/cart.js`.
- Acceptance: `round-9/error-paths-after.json` shows only `cart.error` or `cart.note_error` copy for the abort, HTML 500 and refresh failures, and the 422 probe description unchanged, in the drawer and on `/cart`.

### P95 - Collection filter and load-more failures tell the shopper (Should, round 9)
- Evidence: `round-9/error-paths-before.json`: an aborted filter request and a load-more 500 show nothing, and the load-more path parsed the response without checking `ok`.
- Change: the new `products.facets.load_error` locale string reaches the page as `themeConfig.strings.collection.loadError`. `FacetFilters.showLoadError()` toasts it from the filter and load-more `catch` blocks. Load-more checks `response.ok` and that the section key exists before parsing.
- Files: `assets/collection.js`, `locales/en.default.json`, `snippets/head-script.liquid`.
- Acceptance: `round-9/error-paths-after.json` shows the `load_error` toast for both failures, clears the loading state and re-enables the button. A successful load-more still appends (20 to 22 cards) with no toast.

### P96 - The countdown banner hides when it expires, counts in store time and speaks calmly (Must, round 10)
- Evidence: `round-10/countdown-before.json` (the real snippet rendered offline with liquidjs, then run in Chrome with the real CSS and JS). An expired banner with `show_after_expired: false` has `hidden` set but still renders 173 px tall (`display: block`). The timer carries `aria-live="polite"`, so a screen reader is told every second. The end date is parsed in the browser's time zone: with the store at +0700 and the shopper in New York, an end 3 h away shows 13 h left (`round-10/countdown-oldjs.json`, case `tzStorePlus3h`). Re-attaching the element twice stacks timers: 3 DOM updates per second.
- Change: `.countdown-banner[hidden] { display: none; }`. The timer is `role="timer"` with no `aria-live`. The snippet emits `data-tz-offset` from `'now' | date: '%z'` and the script reads the end date at that offset. The script keeps one `setTimeout` per element, cleared in `disconnectedCallback`, and ticks on the second boundary.
- Files: `snippets/countdown-banner.liquid`, `assets/countdown-banner.css`, `assets/countdown-banner.js`, `sections/main-collection.liquid` (date and time `info`), `locales/en.default.schema.json`.
- Acceptance: `round-10/countdown-after.json`: expired banner `display: none`, height 0; `role="timer"`, `aria-live` absent; `tzStorePlus3h` shows `00:02:59` (days:hours:minutes); 1 update per second after two re-attaches.

### P97 - Countdown colours follow the scheme and keep the button legible (Must, round 10)
- Evidence: `sections/main-collection.liquid` (HEAD) defaults the block to `#1a1a2e` / `#ffffff` / `#e94560`, colours from no preset. A merchant accent of `#f5d000` keeps the white label: 1.51:1 (`round-10/countdown-before.json`, `customAccent`).
- Change: the three colour settings default to blank, so a new block paints the scheme's inverted surface (background = scheme text). `snippets/head-color-schemes.liquid` derives `--color-inverse-button` and `--color-inverse-button-text` per scheme: the scheme button when it reaches 3:1 against the text colour, otherwise the scheme background. When the merchant sets a background or accent, the snippet picks black or white text with `color_contrast`, whichever is higher.
- Files: `sections/main-collection.liquid`, `snippets/countdown-banner.liquid`, `snippets/head-color-schemes.liquid`, `assets/countdown-banner.css`.
- Acceptance: `round-10/countdown-matrix.json`: 100 renders (5 presets x 4 schemes x 5 colour cases), 0 failures at text 4.5:1, label 4.5:1 and button edge 3:1 (edge exempt only when the merchant picked the accent). Live default block at 375, 768 and 1440: text 17.73:1, label 6.25:1, edge 3.17:1, 0 overflow (`round-10/countdown-defaults-live.json`, `countdown-defaults-*.png`); a merchant `#F5F2ED` background renders black text on a black button with a white label (`countdown-bgonly-{375,1440}.png`).

### P98 - The horizontal countdown wraps instead of overlapping at tablet widths (Must, round 10)
- Evidence: vision review of `round-10/countdown-defaults-768x1024.png`: the heading runs into the `1542` day box. With the pre-fix rules replayed, the heading overflows its box by 49 px at 750 and 31 px at 768 (`round-10/countdown-layout-before/countdown-layout.json`).
- Change: the horizontal row wraps (`flex-wrap: wrap`) and the content column takes `flex: 1 1 16rem`, so the timer drops below the copy when both do not fit.
- Files: `assets/countdown-banner.css`.
- Acceptance: `round-10/countdown-layout.json`: at 375, 750, 768, 900, 1024, 1280 and 1440 there is no overlap between heading, subheading, button and timer, heading overflow is 0, the timer stays inside the banner and document overflow is 0. Below 900 the timer wraps under the copy; from 900 it sits on the same row (`countdown-layout-{768,900}.png`).

### P99 - No English copy hides behind Liquid fallbacks (Should, round 10)
- Evidence: the `REVIEW.md` gate pattern finds 46 English fallbacks in 19 files at HEAD. Round 10 owns 21 of them in 9 files (`contact-form` 6, `newsletter` 4, `featured-product` 3, `blog-posts` 2, `countdown-banner` 2, `collection-list`, `collection-best`, `share-buttons`, `main-blog` 1 each: `| t | default: 'View all'`, `default: 'FLASH SALE'`, `default: 'Share:'`, `default: 'Best Sellers'` and others), plus the lowercase `default: 'team member'` in `team.liquid`, which the pattern cannot see. The other 10 files (`float-social` 14, `logo-list` 2, `video` 2, and one each in `blocks/tab`, `collapsible-content`, `page-about`, `slideshow`, `tabs`, `content-toc`, `newsletter-modal`) are also clean in the working tree. Fallbacks mask a missing key from the locale validator. `sections/main-404.liquid` and the size guide label in `snippets/product-variant-picker.liquid` and `blocks/size_chart.liquid` pipe the merchant's own text through `| t`: a custom 404 eyebrow rendered `Translation missing: en.Probe custom eyebrow`. Blog cards read `Read more:` with a dangling colon, because `read_more_title` was rendered with an empty title. Team social links were labelled by slot, not by the network the URL points to.
- Change: every fallback is a locale key (`general.share.label`, `sections.collection_list.placeholder_title`, `sections.team.follow_member`, existing `general.*` keys). Settings are translated only when blank. Blog cards use `blogs.article.read_more`, and the unused `read_more_title` key is removed. Team links derive the network from the URL host.
- Files: `sections/{blog-posts,collection-list,contact-form,featured-product,newsletter,team,main-404,main-blog}.liquid`, `snippets/{collection-best,countdown-banner,share-buttons,article-card,product-variant-picker}.liquid`, `blocks/size_chart.liquid`, `locales/en.default.json`.
- Acceptance: the `REVIEW.md` fallback gate finds 0 matches in the working tree (46 at HEAD); the locale validator exits 0; the live 404 renders a custom eyebrow as typed and falls back to the locale when blank; blog listings show 7 `Read more` labels with no colon; the offline team render (`runs/liquidjs/team-social-check.cjs`) labels Instagram, X, YouTube and LinkedIn URLs by network and other hosts by host name ("Follow Cy on vimeo.com"), and a member with no links renders none.

### P100 - The footer "Stay in the know" heading gets its signup form (Should, round 10)
- Evidence: `round-10/vision/footer-{1440x900,375x812}.jpg`: the footer shows the newsletter heading with no field, on every page without a Newsletter section.
- Change: a Shopify `customer` form (`contact[tags]=newsletter`) under the heading, with a visually hidden label, `autocomplete="email"`, a success message (`role="status"`) and an error message (`role="alert"`, wired with `aria-invalid` and `aria-describedby`). A new `newsletter_enable` checkbox (default on) controls it. CSS hides it with `body:has(.section-newsletter)` so a page never shows two signups. The final vision pass (`round-10/final-shots-2/footer-1440-home.jpg`) showed the heading left alone above the footer menus on `/`; the slogan block that holds the form now hides with it (`body:has(.section-newsletter) .footer_actions__slogan:has(.footer-newsletter)`). With the slogan hidden, the menus below 1200 px sat 16 px under the social icons with no divider (`round-10/final-shots-3/footer-{375,768}-home-before.png`); they now get the same dotted top border the 1440 layout uses, with `margin-top: 1rem` and `padding-top: 1.5rem` (`footer-{375,768}-home-after.png`).
- Files: `sections/footer.liquid`, `assets/footer.css`, `locales/en.default.schema.json`.
- Acceptance: `round-10/footer-newsletter/footer-newsletter.json` and `round-10/footer-newsletter-2/footer-newsletter.json`: form and heading shown on the PDP and `/collections/all` and both hidden on `/` (which has a Newsletter section) at 375, 768 and 1440, measured with `checkVisibility()`; label, placeholder and button come from locale keys; the field is `required` and empty is invalid; the button is 124 x 44 and hovers to `--color-primary-hover`; the focused field shows a 2 px outline; document overflow 0.

### P101 - Decorative hover motion applies only where a pointer can hover (Should, round 10)
- Evidence: `round-1/audit-motion-hover.md` MH-07 and `round-10/sticky-hover-before.md`: at HEAD, 87 `:hover` rules that lift, zoom or nudge with `transform` sit outside `@media (hover: hover)`, in 24 stylesheets and 15 section files; 71 were still unguarded when round 10 started. On a touch screen the first tap applies `:hover` and it stays applied, so a tapped card stays zoomed and a tapped button stays lifted.
- Change: every decorative hover `transform` moves into `@media (hover: hover)`. Colour, border, underline and shadow feedback stays outside the query, so touch keeps its press feedback. Functional reveals that also open on `:focus-within` (megamenu dropdowns, product-card overlay) and the `hover: none` counter rule are left as they are.
- Files: `assets/{theme,product-card,product,search,search-modal,megamenu,article-card,article,blog,collection,customer,float-social,gift-card,list-collections,page-about,page-stores,404}.css`, `sections/{banner-hotspots,blog-posts,collection-list,contact-form,featured-collection,gallery,hero,icon-boxes,image-with-text,layered-images,multicolumn,rich-text,slideshow,team,video}.liquid`.
- Acceptance: the hover-transform scan leaves 10 unguarded rules, all functional reveals, the counter rule or the unused `.card` rule; `round-10/touch-hover.json`: with Chrome forcing `:hover`, 19 of 21 probed decorative transforms change at 1440 (the 2 that do not are article cards inside the hidden search tab) and 0 change on an emulated 375 touch device, while an unguarded control rule changes in both contexts.

### P102 - Store photos show without the stores script (Should, round 10)
- Evidence: `round-1/audit-motion-hover.md` MH-05 and `round-10/stores-failopen-before.json`: `.stores-card__media img` starts at `opacity: 0` and only `page-stores.js` adds `is-loaded`. With the script blocked or JS off, all 32 store photos stay invisible behind a shimmer that never stops.
- Change: the hidden start state and the shimmer apply only under `stores-page:defined`, so the photos fail open when the custom element never upgrades.
- Files: `assets/page-stores.css`.
- Acceptance: `round-10/stores-failopen-after.json`: 32 of 32 photos at opacity 1 and 0 shimmers in all four modes (JS and script-blocked at 375 and 1440, JS off at 375 and 1440); with JS the cards still reach `is-loaded`.

### P103 - The 404 action buttons keep a gap between label and arrow (Could, round 10)
- Evidence: vision review of `round-10/after/{375x812,768x1024,1440x900}-404-error-404.png`: the arrow touches the end of the button label.
- Change: `.error-404__button` gets `gap: var(--space-sm)`, and the arrow nudge sits inside `@media (hover: hover)`.
- Files: `assets/404.css`.
- Acceptance: live gap 8 px between label and arrow at 375, 768 and 1440, arrow nudge 4 px on hover, document overflow 0 (`round-10/after/404-actions-{375,768,1440}.png`).

### P104 - Full-width image with text keeps a mobile gutter (Should, round 10)
- Evidence: vision review of `round-10/final-vision/375x812-home-*.jpg`: with `section_width: full`, the text column of the home atelier section touches both screen edges below 750 px. The live measurement gave `.section-iwt__content` 0 px inline padding and the heading, copy and button at x 0 at 320 and 375.
- Change: `.section-iwt__grid--full .section-iwt__content` gets `padding-inline: 15px` below 750 px, the same gutter `.page-width` and the full-width `custom-liquid` and `rich-text` sections use. The 750 px rule keeps its 48 px padding.
- Files: `sections/image-with-text.liquid`.
- Acceptance: `round-10/iwt-gutter-after.json`: text clears both edges by at least 15 px at 320, 375 and 749, the 768 and 1440 padding stays 48 px, and document overflow is 0 at all five widths.

### P105 - Store open status follows each store's clock (Must, round 10)
- Evidence: `round-10/store-hours-offline-head.json`: at HEAD, `page-stores.js` read the shopper's device clock. A shopper in New York at 11:30 saw all 32 stores "Open now", including Tokyo at 00:30; a shopper in Tokyo at the same instant saw all 32 "Closed now", including London at 16:30. The status span also had `aria-live="polite"`, so a screen reader could hear status changes from a 60 s timer the shopper did not trigger.
- Change: a new `timezone` text setting on the store block (IANA name, blank falls back to the shop time zone from `'now' | date: '%z'`). The script reads the weekday and minutes in that zone with `Intl.DateTimeFormat`; an invalid zone falls back to the shop offset, and no offset leaves the status blank instead of guessing. The status span drops `aria-live`. The 32 demo stores in `templates/page.stores.json` and the five `listings/*/templates/page.stores.json` get their city zone.
- Files: `sections/page-stores.liquid`, `assets/page-stores.js`, `locales/en.default.schema.json`, `templates/page.stores.json`, `listings/{rebel,noir,vibrant,botanical,cyber}/templates/page.stores.json`.
- Acceptance: `runs/e2e/r10-store-hours.cjs` at 15:30 UTC and 02:30 UTC, from browsers in New York and Tokyo: every card matches the open state computed in its own zone, the result is the same in both browser zones, a blank zone uses the shop offset, an invalid zone falls back to the shop offset, and a missing offset blanks only the zone-less card. 0 status nodes carry `aria-live`.

### P106 - The stores "Clear filter" button stays hidden until a filter is set (Must, round 10)
- Evidence: `round-10/final-shots-2/{1440,768,375}-pages-contact-view-stores*.png`: "Clear filter" shows next to "Showing 32 / 32 stores" with no filter set. At HEAD the button carried `style="display:none"`; an earlier round of this review moved it to the `hidden` attribute, and `.stores-sidebar__clear { display: inline-flex }` overrides the UA `[hidden]` rule. The same theme-wide scan flagged `.product-viewed` and wrongly cleared it because its class already sets `display: none`. That is the inverse trap: clearing `hidden` never shows it. See P109.
- Change: `.stores-sidebar__clear[hidden] { display: none; }`. The click handler already returns focus to the search field before the button hides.
- Files: `assets/page-stores.css`.
- Acceptance: `runs/e2e/r10-stores-clear.cjs` (`round-10/stores-clear.json`): at 375, 768 and 1440 the button is not rendered on load, appears after a search narrows the grid, and after Enter on the focused button it is hidden again, every card shows, and focus sits on `#stores-search`.

### P107 - The related-products carousel keeps one row of cards (Must, round 10)
- Evidence: the round 10 Tab walk (`runs/e2e/r10-tabwalk.cjs`, console output of the first run; the file was overwritten by the rerun) listed 8 off-screen focus stops on the bomber PDP at 375, all in "You may also like" (`a.product-card__media-inner` at x -578). `round-10/carousel-facet-before/carousel-facet.json` with HEAD `product-card.css` and `collection.css` served: the Swiper wrapper computes `display: grid` from `.product-cards`, so 4 slides stack in 2 rows (`ulH` 1026 = 2 x 513 at 375, 852 at 768) while Swiper still translates the track by one slide width per step. The 375 and 768 captures (`carousel-related-{375,768}.png`) show an empty band with two arrows. Swiper's own `.swiper-wrapper { display: flex }` loses because `product-card.css` loads later at equal specificity.
- Change: `.product-cards.swiper-wrapper { display: flex; gap: 0; }` in `assets/product-card.css`. Only two lists carry both classes (`sections/product-recommendations.liquid`, `snippets/product-viewed.liquid`), and Swiper initializes both. `gap: 0` leaves spacing to Swiper's `spaceBetween`.
- Files: `assets/product-card.css`.
- Acceptance: `runs/e2e/r10-carousel-facet.cjs` (`round-10/carousel-facet-after2/carousel-facet.json`): at 375, 768, 1024 and 1440 the related list is `display: flex` with one row (`ulH` equals the slide height), and every Tab stop on its cards is on screen inside the wrapper (walk 24/24/24/84 at 375). Before: 4 of 4 widths fail (`carousel-facet-before/`).

### P108 - The sticky filter column scrolls on short desktop screens (Should, round 10)
- Evidence: the first round 10 Tab walk found 4 off-screen stops on `/collections/all` at 1440 (`summary.facet-filter__title` "Size" at y 961 and its options). `carousel-facet-before/carousel-facet.json`: the sticky column is 1133 px tall with `overflow-y: visible` in a 768 px (1024) and 900 px (1440) viewport, so the lower filters scroll only with the whole page. Tab reaches 23 of 24 controls inside the viewport.
- Change: from 1024 px, `.collection-template__facet-filter` gets `max-height: calc(100vh - var(--header-height-sticky, 0px) - 3rem)` and `overflow-y: auto`. The existing `overscroll-behavior: auto` keeps wheel scroll chaining to the page.
- Files: `assets/collection.css`.
- Acceptance: `carousel-facet-after2/carousel-facet.json` at 1024x768 and 1440x900: the column is 652 px and 780 px tall with `overflow-y: auto`, scrolls its 1133 px of content, has no horizontal scroll, Tab reaches 24 of 24 controls on screen, and a wheel over the column still scrolls the page once the column ends.

### P109 - "Recently viewed" shows once the shopper has viewed another product (Must, round 10)
- Evidence: `carousel-facet-after/carousel-facet.json`: after visiting the balm and then the bomber, the `<product-viewed>` host computes `display: none` with `hidden` false, and its list is 0 px tall at every width. At HEAD the script revealed it with `style.display = 'block'`, which beat `.product-viewed { display: none }`. An earlier round of this review moved the reveal to `this.hidden = false` and kept the class rule, so the section never showed for any shopper.
- Change: `.product-viewed { display: block; }` plus `.product-viewed[hidden] { display: none; }`. The `hidden` attribute in the snippet and `showEmpty()` keep owning visibility. A rescan of all 31 Liquid elements that render `hidden` (including those inside `{% if %}`) finds 0 whose class sets `display: none` at its base selector; the scanner was checked against the pre-fix rule and flags it.
- Files: `assets/product.css`.
- Acceptance: `carousel-facet-after2/carousel-facet.json`: at 375, 768, 1024 and 1440 the section shows 1 slide (the balm) at full card height (514/426/393/549 px) and its card is a visible Tab stop. On a fresh profile whose first page is the bomber, it stays `hidden` with `display: none` at 0 px at 375 and 1440 (ad-hoc Playwright check, console output).

### P110 - The product page's lower sections render and keep their spacing (Should, round 10)
- Evidence: an ad-hoc fetch of `/recommendations/products.json?intent=complementary` for all 22 products (console output) returned 0 products for every one, so `complementary-products` stays `hidden` on every PDP. Its `product_list` setting ("Products") was declared but never read by Liquid. An ad-hoc layout trace (console output) put the related heading 0 px under the last "Recently viewed" card, because `.product-recommendations` and `.complementary-products` own no vertical spacing. The complementary list also had no container, so a picked list would run edge to edge.
- Change: the complementary section renders the merchant's `product_list` (the current product excluded) and uses the Search & Discovery recommendations only when that list is empty. With a pick it skips the fetch (`data-product-id` is empty). Its content sits in `.page-width` under the shared `container_width` setting. Both sections get `padding-block-start: var(--space-2xl)` in their own `{% stylesheet %}`. A new locale key, `sections.complementary_products.settings.products.info`, tells the merchant that picked products replace the automatic ones.
- Files: `sections/complementary-products.liquid`, `sections/product-recommendations.liquid`, `locales/en.default.schema.json`.
- Acceptance: `runs/e2e/r10-pdp-sections.cjs`. `round-10/pdp-sections/pdp-sections.json` (default template): fresh and history profiles pass at 375, 768 and 1440 with main -> related 48 px, main -> viewed 24 px, viewed -> related 24 px and 0 overflow. `pdp-sections-picked.json` (a temporary 6-product pick on the template): the complementary section shows 4 cards with the bomber excluded, only `related` fetches, the gaps are 48/24/24 px and overflow is 0 (`{1440,375}-picked-complementary.png`). The template was restored byte-identical (sha256 `3baef553...` matches `product.json.before`), and `pdp-sections-reverted.json` passes again. `pdp-sections/axe.json`: 0 violations on the PDP at 3 widths.

### P111 - Two merchant settings had no effect (Should, round 10)
- Evidence: a static scan of all 947 section and block settings found 2 that neither the section nor any snippet it renders ever reads. One is `heading_alt` in `image-text-overlay` ("Image alt text"; the index template of all 5 presets stores "Editorial fashion campaign image..."). The live alt was "Demo image_text_overlay" on the mobile image and the file's own alt on desktop. The other is `map_url` on store blocks ("Map directions URL", set on 3 demo stores). "View map" always used `maps.google.com/?daddr=<address>`.
- Change: the overlay's `image_tag` calls pass `alt:` from `heading_alt`, falling back to each image's own alt. The store card link uses `map_url` and falls back to the address directions link. LocalBusiness JSON-LD adds `hasMap` when a map URL is set. The stored `map_url` values were iframe embed links (`&output=embed`), which open a bare map rather than directions. In `templates/page.stores.json` and the 5 preset copies, the 3 demo stores now use `https://www.google.com/maps/dir/?api=1&destination=...`.
- Files: `sections/image-text-overlay.liquid`, `sections/page-stores.liquid`, `templates/page.stores.json`, `listings/{botanical,cyber,noir,rebel,vibrant}/templates/page.stores.json`.
- Acceptance: live at 375 and 1440 (console output): both overlay images carry the merchant alt. Of the 32 direction links, 3 go to `/maps/dir/?api=1`, 29 to `daddr` and 0 to an embed, all with `target="_blank"` and `rel` containing `noopener`. All 32 LocalBusiness blocks parse, 3 with `hasMap`, and overflow is 0. `node runs/e2e/settings-usage.cjs` passes its self-test and finds 0 unread settings of 947. The same scan, run in Python on the HEAD versions of the two sections, flags exactly `heading_alt` and `map_url`. The six store templates parse and are byte-identical. AntiFan QA receipts on the stores page and `/` show 0 overflow, 0 broken assets and only the 3 platform criticals.

## DONE contract

1. Every Must and Should proposal (P35-P60, plus any added in later rounds) meets its acceptance check, or a failed check is recorded with a reason and replaced by an equal or stronger check.
2. `node scripts/validate-locales.mjs` and `node scripts/validate-schema-ranges.mjs` exit 0. `node --check` passes on every changed `.js`. Every changed JSON parses.
3. The discovery scan has no new error beyond the 13-error platform/dev-proxy baseline.
4. Screenshots at 1440x900, 768x1024 and 375x812 of every changed page show no horizontal overflow, clipped text, overlap or broken image, and the vision review finds no High issue.
5. No rubric area drops. Knowledge and trust and Accessibility (baseline 1) reach 2 or more.
6. Keyboard checks pass on changed interactive elements (sticky bar, pills, hero bullets, hero pause/play, marquee, contact form, tabs, address modal, predictive search results). The workspace bans `prefers-reduced-motion`, so the reduced-motion check is replaced by "intentional motion kept, a pause control for auto-advancing content, focus never lands off-screen".
7. Journeys stay at 0 FAIL, and axe reports 0 violations on the 15 routes at 375 and 1440.
8. `DESIGN.md`, `REVIEW.md` and `AGENTS.md` reflect the delivered rules, with prior content preserved.
9. Processes started by the review are stopped. `shopify theme dev` (PID 24108) was not started by this review and stays.
10. `shopify theme check` is reported as pending user approval. It is not claimed.
11. In all five presets (Rebel, Noir, Vibrant, Botanical, Cyber), text on every changed route, and with the cart drawer, search panel and mobile menu open, meets WCAG 1.4.3 except recorded exemptions (disabled controls, frames captured mid-transition).
12. Walking Tab through `/`, the bomber PDP, `/collections/all`, `/cart`, `/pages/contact`, `/pages/about`, the FAQ and `/search?q=jacket` at 375 and 1440 lands on no invisible stop (zero-size, `opacity` under 0.05, hidden or `aria-hidden`), unless the control's label is visible and shows the focus ring.
13. Scripts that bind section-owned controls keep working after `shopify:section:load` and bind one listener per event after a re-attach. A forced network, HTTP or parse failure on a cart or collection request shows a locale string, never a raw exception message.
14. A countdown banner hides once expired unless the merchant keeps it, counts down in the store time zone, runs one timer per element, keeps text and button label at 4.5:1 in every scheme and merchant colour case, and never overlaps from 375 to 1440. No English copy is used as a Liquid fallback (`REVIEW.md` gate).
15. A decorative hover `transform` never applies on a device without hover (forced `:hover` on an emulated touch device changes no decorative transform while a control rule still changes), and content that a script reveals stays visible when that script does not run.
16. A store's open status is computed in that store's time zone (or the shop time zone when none is set), gives the same answer to shoppers in any device time zone, stays blank rather than guessing when no zone is known, and is never announced by a live region on a timer.
17. An element whose visibility a script or Liquid owns through the `hidden` attribute is hidden while the attribute is set and shown once it is cleared. No class rule overrides `[hidden]` in either direction (static scan of every Liquid element that renders `hidden`, self-tested against a known failure, plus a live check of each element this review changed).
18. Every setting a section or block declares is read by that file or a snippet it renders (static scan of every section and block schema, self-tested against the HEAD versions), and a value stored in a template matches what its setting's label promises.

## Round log

| Round | Proposals done | Checks passing | Regressions fixed | Notes |
|---|---|---|---|---|
| 1 | P35-P53 | Every `round-1/r1-verify.json` check true; journeys 96 PASS 0 FAIL (`round-1/journeys-after.log`); both validators exit 0 | Baseline axe found `scrollable-region-focusable` on the article table at 375 (`round-1/axe.json`); after round 1 axe reports 0 violations on 15 routes x 2 widths (`round-2/axe.json`) | Discovery stays at the 13-error platform/dev-proxy baseline |
| 2 | P54-P56 | Every text over the home photos passes its WCAG threshold at 375, 768 and 1440 (`round-2/photo-contrast-home.txt`); level-3 megamenu on-screen for keyboard and hover at 1440 and 1100 (`mm-level3.cjs`); table bottom gap 1 px at 375 and 1440 (`table-band.cjs`) | None found | Range validator exits 0 after the overlay changes |
| 3 | P57-P61 | `empty-states.cjs` 6/6 PASS and live contact/stores/home copy unchanged; `radius-scan.cjs` after migration finds only the 50% team avatar circle at 375 and 1440 (`round-3/radius-scan-after.json`, `radius-scan-375-after.json`); `slideshow-pause.cjs` holds on hover, CTA focus, bullet focus and after pause, rotates when idle and after play, `aria-live` off/polite (`round-3/slideshow-pause.json`); token-format scan finds 0 rules and the predictive-search link shows a 2 px crimson outline (`round-3/color-token-after.json`); `cursor-check.cjs` pointer on all toggles; journeys 96 PASS 0 FAIL (`round-3/journeys-after.log`); axe 0 violations and 0 overflow on 15 routes x 2 widths (`round-3/axe.json`); About hero text over the photo measures 4.74:1 or more (`round-3/photo-contrast-about.txt`) | The first P59 draft wrote `accessibility_label \| default: 'accessibility.slideshow' \| t`, which also ran the merchant label through `t`; the label is now assigned first and only the fallback key is translated | Discovery stays at the 13-error baseline. `render-check` after round 3 (`round-3/after/`) reports only runtime platform noise, `.visually-hidden` clip, the 44 px heuristic and page-background contrast on photo text |
| 4 | P62-P69 | `.page-width` caps at the 1600 px setting from 1280 px up (`round-4/page-width-after.json`); the server-rendered TOC matches the live TOC (4 items, 265 px at 375 and 207 px at 1440, `round-4/toc-ssr.json`); About downloads one hero per viewport, `eager`/`high`, and it is the LCP (`round-4/hero-requests-after.json`); `/collections/all` and `/collections/outerwear` LCP images are `eager`/`high` at 375 and 1440 (`round-4/perf-probe-collection-after.json`); article type scale h1 30 > h2 24 > h3 20 > h4 18 > p 17 at 1440 (`round-4/type-scale-article-after.json`); password page at 3 viewports has 0 nav links and 0 overflow, and every keyboard stop is on-screen with a 2 px outline (`round-4/password-interact.json`); article hero `sizes` equals the box at 768-1920 (`round-4/article-box-after.json`); `/search?q=jacket` lazy-loads only hover images above the fold (`round-4/perf-probe-search-after.json`); journeys 96 PASS 0 FAIL (`round-4/journeys-after.log`); axe 0 violations and 0 overflow on 15 routes x 2 widths (`round-4/axe.json`); both validators exit 0 | The article at 375 keeps CLS 0.064 after P63: `round-4/shift-article-375.json` shows the TOC is stable and the meta row (author, date, comments) re-wraps between 3 and 2 lines while fonts load. Carried to round 5 as P71 | Discovery stays at 13 errors, 20 warnings, 28 info (`round-4/discovery.txt`) |
| 5 | P70-P76 | PDP CLS falls from 0.049/0.043 to 0.0000 at 375 and 0.0009 at 1440 on the bomber, 0.0000/0.0063 on the balm (`round-5/shift-bomber-*-after2.json`, `shift-balm-*-after2.json`); pre-JS and JS geometry of the thumbs, arrows and tabs match (`round-5/pdp-prejs-after.json`); article byline CLS 0.0641 to 0.0000 at 375 in 3 runs and at 768 and 1440 (`round-5/meta-reflow-css-*.json`); read-more renders only when it saves height and toggles `aria-expanded` (`round-5/readmore-after.json`); titled and blank tabs render their title or "Details"; at 768 Add to cart moves from y=1832 to y=556 on the bomber and from 1875 to 608 on the balm (`round-5/buybox-before.json`, `buybox-after2.json`); arrows draw `rgb(10,10,10)` at opacity 1 on 85% bone; radios are crimson 16 px; keyboard reaches the radios, tabs and read-more with a 2 px crimson outline on-screen at 768 and 1440 (`round-5/buybox-keys*.json`); journeys 96 PASS 0 FAIL (`round-5/journeys-after2.log`); axe 0 violations and 0 overflow on 16 routes then on the PDP/article set at 375, 768 and 1440 (`round-5/axe.json`, `axe-pdp-after.json`); both validators exit 0; AntiFan QA on the balm PDP: 0 regressions, 0 overflow at 320-1440, only the 3 known platform/dev-proxy console criticals | Bold-face preload left byline CLS at 0.0641 and was reverted; the inline tab mount replaced the post-JS move | Discovery stays at 13 errors, 20 warnings, 28 info (`round-5/discovery.txt`). AntiFan screenshot capture hit `CAPTURE_FRAME_STARVATION`, so Playwright screenshots are the visual evidence |
| 6 | P77-P80 | `round-6/float-probe-after2.json`: `covered` empty at 375 and 1440 with the sticky bar visible, back-to-top 139 px above the viewport bottom at 375 and 24 px at 1440, FAB hover `matrix(1.1, 0, 0, 1.1, 0, 0)`, Escape closes and focuses the toggle; offline float-social render 11 of 12 channels with one blank link, 0 `MISSING` keys; journeys 96 PASS 0 FAIL (`round-6/journeys-after.log`); axe 0 violations and 0 overflow on 15 routes x 2 widths (`round-6/axe.json`); both validators exit 0 | None found | Discovery 13 errors / 20 warnings / 28 info, the platform/dev-proxy baseline (`round-6/discovery.txt`) |
| 7 | P81-P84 | `round-7/preset-contrast-after2.json` Cyber 230 -> 5 and Rebel 8 -> 4 failures, all exempt; `fade-presets-after.json` fade ends at the host surface in both presets; `meta-after2.json` 0 separator items, 0 overflow; journeys 95 PASS 1 FAIL (`round-7/journeys-after.log`), the one failure `footer-375 Space collapses menu` passes 3 of 3 reruns with no footer change in round 7 (`round-7/journeys/journeys-footer-rerun-{1,2,3}.json`), so it is timing noise; axe 0 violations and 0 overflow on 15 routes x 2 widths (`round-7/axe.json`); both validators exit 0; `node --check` on `product.js` | Megamenu triggers at 0.75 alpha and the FAQ search input fill, both from the conversion, fixed in round | Discovery 13 errors / 20 warnings / 28 info, the platform/dev-proxy baseline (`round-7/discovery.txt`). The contrast probe's colour parser now resolves `color(srgb …)` and `oklab()` through a canvas; before that it skipped them |
| 8 | P85-P90 | Tab walk invisible stops: `/` 7 to 0 at 1440 and 0 at 375, bomber PDP 6 to 0, `/collections/all` 0 (`round-8/invisible-focus-before.json`, `invisible-focus-after-home.json`, `invisible-focus-after-pdp.json`); Shopify-rounded floor render of all 20 preset schemes (`round-8/render-floor.txt`); `round-8/preset-contrast-after3.json` 4 failures per preset in all 5 presets, every one the disabled `Pages` search tab; empty cart wave per preset (`round-8/cart-svg.json`); journeys 96 PASS 0 FAIL (`round-8/journeys-after.log`); axe 0 violations and 0 overflow on 15 routes x 375, 768 and 1440 (`round-8/axe.json`) | The `color_contrast` shim in the harness did not round like Shopify, so the first floor render was off by one step; re-rendered with rounding (`harness-fidelity.cjs`) | Discovery 13 errors / 20 warnings / 28 info, the platform/dev-proxy baseline (`round-8/discovery.txt`) |
| 9 | P91-P95 | Lifecycle before -> after: facet `popstate` fetches 3 -> 1, contact validations per blur 3 -> 1 and `pageshow` listeners 3 -> 1, header cart icon after reload false -> true at 375 and 1440, mobile menu / footer accordion / lightbox / gift card fields after `shopify:section:load` broken -> working (`round-9/*-before.json`, `*-after.json`); `round-9/error-paths-after.json` shows locale copy for every forced cart and collection failure where HEAD showed `Failed to fetch`, a JSON parse error or `HTTP 500 for /cart.js`; `node --check` on 7 changed scripts; both validators exit 0; journeys 96 PASS 0 FAIL (`round-9/journeys-after.log`); axe on 15 routes x 3 widths has 0 overflow and 1 `color-contrast` node, the bottom hero CTA at 375 caught mid-crossfade | The axe node is not a regression: 3 axe runs 1.7 s apart report 0 violations and every settled frame shows only the active slide at opacity 1 (`round-9/hero-fade-axe.json`), so it falls under the contract 11 mid-transition exemption | Discovery 13 / 20 / 28, unchanged (`round-9/discovery.txt`). Subagent quota was exhausted (429), so the round 9 review ran in-session |
| 10 | P96-P106 | Countdown: offline render of 5 presets x 4 schemes x 5 colour cases passes 100 of 100 rows, minimum 5.64:1 for text and label (`round-10/countdown-matrix.json`). The expired banner is `display: none` at 0 px, and the timer is `role="timer"` with no `aria-live` (`countdown-after.json`). Layout has 0 overlap and 0 overflow from 375 to 1440, and the timer wraps below 900 (`countdown-layout.json`). Touch hover: forced `:hover` changes 19 of 21 decorative transforms at 1440 and 0 on an emulated 375 touch device, with 9/9 control rules changing in both (`touch-hover.json`). Store photos are at opacity 1 with 0 shimmers with JS, with the script blocked and with JS off (`stores-failopen-after.json`). Store hours: 12 runs and 0 failures live and offline, where HEAD JS gave 200 failures (`store-hours.json`, `store-hours-offline.json`, `store-hours-offline-head.json`). The image-with-text gutter is 15 px at 320/375/749 and 48 px at 768/1440 (`iwt-gutter-after.json`). Stores "Clear filter" is hidden on load, shown after a search, and hidden after Enter with focus on the search field at 375/768/1440 (`stores-clear.json`). The footer form shows on the PDP and collection and hides with its heading on `/` at 3 widths (`footer-newsletter-2/`). Final batch: journeys 96 PASS 0 FAIL, axe 15 routes x 3 widths 0 violations 0 overflow, both validators exit 0, `node --check` on 34 files, 96 JSON files parse (`final-5/`). After the footer divider: footer journeys 7/7, axe 0/0 on `/` and the PDP at 3 widths (`footer-divider/`), and an AntiFan QA receipt on `/` with 0 overflow, 0 broken assets and 0 introduced regressions | Stores "Clear filter" showing with no filter, a regression from an earlier round's move to `hidden` (P106); footer heading orphaned on `/`, and footer menus without a divider below 1200 px once the signup hides (P100); full-width image-with-text with no mobile gutter (P104) | Discovery 13 / 20 / 28 (`final-5/discovery.txt`). Journey outputs from rounds 6, 7 and 10 had been written to `E:/plans/...`, because `journeys.cjs` resolves `E2E_OUT` against the theme root. The 11 files were moved into this folder with no collision |
| 10 (cont.) | P107-P111 | Related carousel: 1 row of 4 slides at 375, 768, 1024 and 1440 with HEAD CSS stacking 2 rows (`carousel-facet-before/` vs `carousel-facet-after2/`). Sticky filter column scrolls inside a 768 and 900 px viewport. "Recently viewed" shows 1 slide after another product and stays `hidden` on a first visit. PDP lower sections: 48 px main to next section, 24 px between the rest, 0 overflow at 3 widths with and without history and with a picked complementary list (`pdp-sections/`). 0 unread settings of 947 (`runs/e2e/settings-usage.cjs`, self-test passing). Final batch `final-7/`: both validators exit 0, `node --check` 34 files, 96 JSON files parse, journeys 96 PASS 0 FAIL, axe 0 violations and 0 overflow on 45 pages (15 routes x 3 widths), discovery 13 / 20 / 28, the five lifecycle outputs identical to `final-6/`. Final tab walk (`tabwalk-final.json`): 10 routes x 2 widths, every walk cycles, 0 invisible, 0 fade-in, off-screen stops only on the platform hCaptcha Privacy/Terms links. AntiFan QA receipts at 00:49 on the PDP and stores page: 0 overflow, 0 broken assets | Carousel 2-row stack (P107) and the `[hidden]` override on "Recently viewed" (P109), both regressions from earlier rounds of this review | The PDP receipt lists "Suppressed error while exporting metrics: TypeError: Failed to fetch" as introduced. No theme file contains the string, and 3 fresh Playwright loads did not log it; the failed requests are all Shopify telemetry (`monorail`, `web-pixels`, `/api/collect`, `error-analytics`) aborted on navigation. Platform-owned |

## DONE status (final check)

Status: DONE_WITH_CONCERNS. Items 1-9 and 11-18 are met. Item 10 is met as written: `shopify theme check` is reported as pending and not claimed. The concerns are release steps that the workspace contract leaves to the user.

| # | Result | Evidence |
|---|---|---|
| 1 | Met | Every proposal P35-P111 has its acceptance artifact cited in the round log. Failed checks were replaced, not dropped (round 7 footer timing noise: 3 of 3 reruns pass) |
| 2 | Met | `round-10/final-7/`, run after the last theme edit: `validate-locales.txt` and `validate-ranges.txt` exit 0, `node-check.txt` 34 files OK, `json-parse.txt` 96 files OK |
| 3 | Met | `final-7/discovery.txt`: 13 errors / 20 warnings / 28 info, the platform/dev-proxy baseline |
| 4 | Met | `final-shots/` (home, collection, PDP, stores, about, 404) and `final-shots-3/` (home, stores) at 1440x900, 768x1024 and 375x812: 0 broken images. The vision review found one High issue (stores "Clear filter", P106) and two Medium issues (orphaned footer heading, flush menus, both under P100), all fixed and re-shot. `footer-{375,768}-home-after.png` |
| 5 | Met | Final scores: Knowledge and trust 1 -> 2, Accessibility 1 -> 2, Brand recall, Clarity, Motion and Responsive 2 -> 3, and no area drops |
| 6 | Met | Journeys cover the sticky bar, pills, hero bullets and pause, marquee, contact, tabs, address modal and predictive search (96 PASS). In round 10 the stores clear button returns focus to `#stores-search` at 3 widths, and `tabwalk-final.json` shows focus never lands off-screen except on the platform hCaptcha badge. Intentional motion is kept and auto-advance has a pause control |
| 7 | Met | `final-7/journeys/journeys.json` 96 PASS 0 FAIL; `final-7/axe.json` 15 routes x 3 widths 0 violations 0 overflow |
| 8 | Met | `DESIGN.md` (Motion: hover inside `@media (hover: hover)`, fail-open reveals; Component rules: store clock, `hidden` ownership in both directions), `REVIEW.md` (Motion and Knowledge and trust rows, tab-walk and hCaptcha note, `settings-usage.cjs` gate), `AGENTS.md` ("Design Direction and UX Review" hover rule); prior content kept |
| 9 | Met | Every background job started by the review has finished; no `runs/e2e` node process or headless Chrome is left. `shopify theme dev` PID 24108 was not started by the review and stays. `templates/product.json` was restored byte-identical after the picked-list test (`pdp-sections/product.json.before`, sha256 match) |
| 10 | Pending (user) | Not run. Command for approval: `shopify theme check` |
| 11 | Met | Round 8: 4 failures per preset, all on the disabled `Pages` search tab (exempt). Round 10: countdown 100/100 rows across 5 presets; `round-10/preset-contrast-footer.json` 0 failures in all 5 presets on the PDP and `/collections/all` at 375 and 1440 with the footer form visible |
| 12 | Met | `tabwalk-final.json`: 0 invisible and 0 fade-in stops on 10 routes at 375 and 1440, self-test passing; the carousel and filter column stops that were off-screen in the first round 10 walk are on-screen |
| 13 | Met | `final-7/{facet,contact,cart-trigger,section-reload,error-paths}*-after.json` are identical to `final-6/`, which matches round 9 with asset versions normalised |
| 14 | Met | `countdown-after.json`, `countdown-matrix.json`, `countdown-layout.json`; P99 removed the English Liquid fallbacks |
| 15 | Met | `touch-hover.json` (0 of 21 decorative transforms on touch, 9/9 controls), `stores-failopen-after.json` (32/32 photos with the script blocked and JS off) |
| 16 | Met | `store-hours.json` and `store-hours-offline.json`: 12 runs, 0 failures; blank zone falls back to the shop offset, no offset leaves only that card blank, 0 status nodes with `aria-live` |
| 17 | Met | Liquid-conditional scan: 31 elements render `hidden`, 0 with a class that sets `display` at base, scanner self-tested against the pre-fix `.product-viewed` rule; live: `carousel-facet-after2/carousel-facet.json` and the fresh-profile check |
| 18 | Met | `node runs/e2e/settings-usage.cjs`: 947 settings, 0 unread, self-test flags both planted settings; the HEAD sections flag exactly `heading_alt` and `map_url`. Store `map_url` values are directions links on the live page (3 `/maps/dir/`, 0 embed) |

## Unresolved questions

- Delete the now-unreferenced `assets/index.css` and `assets/index.js` files? They are code this review did not write, so deletion waits for approval; P43 only stops loading them.
- `shopify theme check` needs your approval before it runs. After that, `shopify theme push --unpublished` gives a review theme. The working tree is not committed.
- Merchant content, not theme code: the announcement bar copy, the home social sharing image (missing `og:image` on `/`), legal policy pages, and renaming the selling plan groups (the Admin token lacks `write_purchase_options`).
- The new `timezone` setting on store blocks only covers the 32 demo stores. A merchant adding a store must fill in its IANA zone; if left blank, the store uses the shop time zone.
- "Pairs well with" (`complementary-products`) stays hidden on every product until the merchant either picks products in its new `product_list` setting or sets complementary products in the Search & Discovery app; the app returns 0 for all 22 demo products. That is store data, so the default template ships with the list empty.
