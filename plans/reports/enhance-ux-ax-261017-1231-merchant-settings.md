# UX/AX review: Devs2 Rebel (Shopify OS 2.0 base theme) - 2026-10-17

## Verdict

DONE_WITH_CONCERNS. All 14 proposals are implemented (P1-P4, P7-P11 and P13 Must; P5, P6, P12 and P14 Should) and every DONE item is met on the running theme (`round-10-final/`). The editor controls this review set out to fix now act on the storefront: `settings-usage.cjs` reports 944 section/block settings and 199 global settings with 0 unread or unrendered, the offline toggle renders show every checked setting change reaching output, and 120 schema text defaults now come from the schema locale. `shopify theme check` (user-approved) finds 0 offenses in the theme directories. Some non-stored values are proven offline only, and each proposal says which (P2 note, vendor, scheme and empty-drawer branches; P4 off; P6 brand values; P9 app blocks). Concerns: nothing is committed or pushed, and the store-data gaps under Unresolved questions remain.

## Scope and environment

- Mode: `--auto --audit --loop 10`, audit-led. Focus: merchant settings that the theme editor offers but the storefront ignores. The previous review (`enhance-ux-ax-261016-1231-overlay-type.md`, question 2) found 18 global settings in `config/settings_schema.json` that no layout, section, snippet, block or template reads. A merchant changes them and nothing happens.
- Running theme: `shopify theme dev` at `http://127.0.0.1:9292` (user-started, reused, not stopped by this review).
- Git: `--git-dir=.git-nested`, branch `main`, HEAD `d4a44dd` plus the uncommitted working tree. Nothing is committed or pushed.
- `config/settings_data.json`: round 1 kept the stored Rebel values. In round 2 the user approved wiring the dead style controls and adjusting the stored values so the current look survives; the patch, hashes and revert are in `runs/settings-patches/261017-round2.md`.
- Not run: real touch devices, Safari, a real screen reader. `shopify theme check` ran once after round 10 with user approval.
- `prefers-reduced-motion` is forbidden in this workspace (`AGENTS.md` section 5); motion is checked for hover gating and keyboard only.

## Baseline evidence (round 1, before any edit)

| Evidence | Path | Result |
|---|---|---|
| Suite (node check, JSON, locales, ranges, journeys, axe, lifecycle, error paths, discovery) | `enhance-ux-ax-261017-1231-merchant-settings/round-1/suite/` | node check 0 FAIL; locales and ranges exit 0; journeys 96 PASS / 0 FAIL; axe 0 violations; lifecycle and error paths 0 failures; discovery 13 / 20 / 28 (platform and dev-proxy owned, same as 2026-10-16) |
| Capture 16 routes x 375/768/1440 | `.../round-1/capture/` | 48/48, 0 overflow, 0 clipped, 0 broken images |
| Settings wiring map (read-only scout) | `scratch/wiring-map.md` (session scratch) | 18 settings mapped to schema line, stored value, nearest consumer and a minimal wiring |

## Scores (baseline)

| Area | Score | Evidence |
|---|---|---|
| First impression | 2 | Unchanged |
| Brand recall | 3 | 2026-10-16 round 10 |
| Content punch | 2 | Merchant copy gaps unchanged |
| Clarity and hierarchy | 3 | One primary CTA per view |
| Storytelling | 2 | Home order is merchant content |
| Knowledge and trust | 2 | 18 editor controls do nothing; the stored Rebel values for badge position, sold-out badge scheme and currency codes are not what the storefront shows |
| Motion | 3 | Token durations; hover motion gated to `(hover: hover)` |
| Responsive | 3 | 0 overflow at 375/768/1440 |
| Accessibility | 3 | 2026-10-16 round 10 |
| Performance feel | 2 | No field CWV on a dev store |

## Scores (final, round 10)

| Area | Score | Evidence |
|---|---|---|
| First impression | 2 | Unchanged; merchant content |
| Brand recall | 3 | Unchanged |
| Content punch | 2 | Merchant copy gaps unchanged |
| Clarity and hierarchy | 3 | Unchanged |
| Storytelling | 2 | Home order is merchant content |
| Knowledge and trust | 3 | Editor controls act on the storefront: 0 unread settings, 45/45 global toggles and 520 section/block changes checked offline; video loop/mute, app blocks, cart upsale and marquee controls proven live |
| Motion | 3 | Marquee has no dead speed/direction controls; hover stays gated |
| Responsive | 3 | 48/48 captures, 0 overflow |
| Accessibility | 3 | Axe 0 on 45 route-viewports with a probe that no longer measures crossfades; plain-text poster `alt` |
| Performance feel | 2 | No field CWV on a dev store |

## Proposals

### P1 - Product card settings reach the card (Must)
- Evidence: `card_style`, `card_color_scheme`, `badge_position`, `sale_badge_color_scheme`, `sold_out_badge_color_scheme`, `product_soldout_text`, `product_contact_text` have no reader (`runs/e2e/settings-usage.cjs`, global phase).
- Change: `snippets/product-card.liquid` reads all seven; badges sit in one positioned `.product-card__badges--{position}` container; badge schemes are `color-{scheme}` classes; card style `card` adds the card scheme and an inner padding (`assets/product-card.css`). Blank texts fall back to the locale keys.
- Stored Rebel values change what ships: badges move from top left to `bottom left`; the sold-out badge takes scheme-4 (oxblood), the sale badge scheme-3 (crimson button colour).
- Acceptance: offline render of every non-stored branch passes; live cards show the stored position and schemes; no badge chip overlaps a revealed card action or leaves the media at 375/768/1440 for all four positions.

### P2 - Cart settings drive the cart (Must)
- Evidence: `cart_type`, `show_vendor`, `show_cart_note`, `cart_drawer_collection`, `cart_color_scheme` unread; the drawer opened from three places (`assets/product.js`, `assets/cart-modal.js`, `assets/quickview-modal.js`) and a card add showed a toast as well.
- Change: `themeConfig.cart.type` (`snippets/head-script.liquid`); one `cart:item_added` listener in `assets/cart-modal.js` opens the drawer, shows the success toast (`notification`) or goes to `/cart` (`page`); header cart triggers are links for `page`; vendor eyebrow in `snippets/cart-items.liquid`; drawer note behind `show_cart_note`; drawer panel takes `cart_color_scheme`; an empty drawer lists up to 4 products from `cart_drawer_collection`.
- Stored Rebel values change what ships: the drawer note is hidden (`show_cart_note` false); the cart page note stays owned by the section's `show_note`.
- Acceptance: drawer, notification and page flows proven live; note, vendor, scheme and empty-collection branches proven offline.

### P3 - Currency codes (Must)
- Evidence: `currency_code_enabled` (stored true) unread.
- Change: current prices (card, PDP block, featured product) and cart totals use `money_with_currency` when on; JS price updates use `themeConfig.priceFormat`. Compare-at, unit and line prices keep `money`.
- Acceptance: card, PDP, drawer and cart page show `USD` live; no overflow at 375.

### P4 - Predictive search toggle (Must)
- Change: `routes.predictive_search_url` is empty when off, so `search-modal.js` falls back to the full search link.
- Acceptance: on (stored) still returns suggestions live; off renders an empty URL offline.

### P5 - Hover effect (Should)
- Change: body class `animate--hover-{value}`; `vertical-lift` and `3d-lift` lift product, collection and article cards inside `@media (hover: hover)` (`assets/base.css`). `default` keeps the DESIGN.md "no lift" card.
- Acceptance (verified in round 10, `round-10-final/p5-hover-lift.json`): live at 1440 with the body class swapped on `/collections/all`, `/collections` and `/search?q=a&type=article`, the hovered product, collection and article card computes `none` under `default` (the stored value), `matrix(1, 0, 0, 1, 0, -4)` under `vertical-lift` and a `matrix3d` under `3d-lift` (9/9). In a 375 touch context `(hover: hover)` is false and a hovered card stays `none`.

### P6 - Brand information in the footer (Should)
- Change: `sections/footer.liquid` shows `brand_image` at `brand_image_width`, `brand_headline`, and uses `brand_description` when the section description is blank.
- Acceptance (offline, `scratch/settings-branch-render.cjs`, rerun in round 10 after the round 3 footer edit): with brand values set, the footer prints the headline markup, the brand description and the image at width 200; a section description still wins over the brand description and hides the headline (2/2). Live the stored brand values are blank, so the footer is unchanged ("Refined defiance — …", round 10 captures). Proven offline only for the set values.

### P7 - Gate for global settings (Must)
- Change: `runs/e2e/settings-usage.cjs` adds a global phase over `config/settings_schema.json` with a self-test (dynamic `settings[key]` families such as `float_*` count as read); `REVIEW.md` names it.
- Acceptance: exits 0 with 0 unread global settings; the self-test fails on an unread fixture.

### P8 - Settings read only by a dead token reach the page (Must)
- Evidence: round 1's gate counted a setting as read when Liquid printed it into a CSS custom property, even if no stylesheet used that property. With dead tokens stripped, 41 global settings and 5 colour-scheme roles had no effect: Typography `body_scale` / `heading_scale`, button shadows and outline border, `card_text_alignment`, and the border and shadow controls of Variant pills, Inputs, Content containers, Media, Pop-ups and Drawers; scheme `subtext`, `background_gradient`, `form_bg`, `form_text`, `progress_bar`.
- Change: font size tokens scale by `--font-body-scale` / `--font-heading-scale`; `.button-primary` / `.button-secondary` take `--buttons-shadow` and `--buttons-outline-border` and the scheme secondary colours; card content follows `--card-text-alignment`; composed `--{family}-border` / `--{family}-shadow` tokens per scheme (`snippets/head-design-systems.liquid`) feed about 60 component rules across `assets/*.css` and sections (fields, pills, media frames, content boxes, pop-ups, drawers); fields paint `--color-form-bg` / `--color-form-text`; muted text is `--color-subtext-text`; a scheme gradient paints its host. `progress_bar` is removed (no component draws a progress bar). Deliberate exceptions (footer newsletter field, quantity steppers, thumbnails, lightbox images, inline code) keep their own styles.
- Stored values (approved): pill and field border opacity 100, media border 0, pop-up and drawer border opacity 100 with the `--shadow-float` geometry (10% opacity is the nearest step to its 0.12), Subtext set to the colour the old muted text rendered, scheme-2 field background white.
- Acceptance: gate 0 unread including scheme roles and dead tokens, with a self-test; every family changes when its token changes; default look unchanged; no overflow, contrast or overlay regression.

### P9 - App blocks the editor offers actually render (Must)
- Evidence: 25 sections list `{"type": "@app"}` in their schema, so the editor offers Apps, but none called `{% render block %}`; their block loops rendered an empty column, slide or card for the app block instead (for example `sections/multicolumn.liquid` printed an empty `.section-multicolumn__item`). The 7 sections that already rendered apps (`hero`, `main-collection`, `page-about`, `page-faq`, `rich-text`, `featured-product`, `main-product`) are unchanged.
- Change: every block loop in the 25 sections skips `@app`; counts derived from blocks (slides, stats, tabs, members, testimonials, announcements, gallery and accordion indices) count content blocks only; app blocks render once after the content in a `.section-apps` slot (`assets/base.css`: grid, `--stack-gap`, `--section-head-gap` above). Logo list shows when it holds only app blocks. `settings-usage.cjs` gains an app-block phase with its own self-test.
- Acceptance: gate exits 0; offline render of each section with an app block inserted after the first content block prints it once in the slot and leaves the rest of the markup byte-identical (whitespace-normalised) to the render without it; a section holding only an app block still prints it; live routes unchanged.

### P10 - Marquee products offers no dead motion controls (Must)
- Evidence: the working tree turned `sections/marquee-products.liquid` into a scroll-snap carousel with prev/next buttons (`animation: none`; HEAD ran `mpScroll`). Its `speed` (stored 40 s) and `direction` settings still printed `--mp-speed` / `--mp-direction`, which no stylesheet read, so the editor controls did nothing. The section-level gate counted them as read because it did not strip dead tokens. The `inert` duplicate list (12 more product cards) rendered with `display: none`.
- Decision (user, round 4): keep the carousel and remove the two settings.
- Change: `speed` and `direction` leave the schema, `locales/en.default.schema.json` and the six `index.json` files (`templates/` and five `listings/`); the duplicate list and its CSS go. `settings-usage.cjs` strips custom properties that no section rule or asset consumes before it counts a section setting as read, with a self-test. `scripts/validate-locales.mjs` scans the theme directories only; it had walked `scratch/` snapshots of the old section.
- Acceptance: gate exits 0 and its self-test fails on a dead section token; live home at 375/768/1440 shows one list of 12 cards, no `--mp-speed`, Next scrolls the track, 0 overflow, 0 page errors.

### P11 - Video playback settings reach YouTube and Vimeo (Must)
- Evidence: an offline render of every section with each checkbox flipped and each select option tried (`scratch/toggle-effect.cjs`, 501 changes) left `video.liquid` output unchanged for `loop` and `muted` with the default source (YouTube or Vimeo). The facade built `?autoplay=1&rel=0&modestbranding=1` and nothing else, so both controls did nothing and autoplay was unmuted, which browsers block. A cleared Video URL still played a hardcoded demo video (`yt_id = '_9VUPq3SxOc'`), so the merchant could not remove it. The other 29 unchanged outputs depend on store data the harness lacks (article, blog, search, cart, localization, social links); their Liquid reads the setting in a data guard, and the cart upsale, the only one with a doubtful lookup (`collections[setting]`), renders 3 products live.
- Change: the facade carries `data-loop` and `data-muted`; YouTube gets `mute=1` and `loop=1&playlist=<id>`, Vimeo `muted=1` and `loop=1`; autoplay always mutes. The hardcoded fallback is gone, so a blank URL shows the empty state. The Autoplay info text says it plays muted.
- Acceptance: offline embed probe 6/6 (`scratch/video-embed-probe.cjs`); live on a temporary 404 template entry (restored, sha256 match) the iframe gets `loop=1&playlist=` and no `mute` at 375 and 1440, and a cleared URL renders `.section-video__empty`.

### P12 - Rich text headings reach attributes as plain text (Should)
- Evidence: `sections/video.liquid:73` assigned the `inline_richtext` heading straight into the poster `alt`, so a heading with `<em>` or `<strong>` put the tags into `alt` (`image_tag alt:` and the YouTube thumbnail `alt="{{ poster_alt | escape }}"`); a screen reader announces them. A scan of every `richtext` / `inline_richtext` setting that reaches `alt`, `aria-label`, `title`, `content`, `placeholder` or `data-*` (directly, through an `assign`, or through a `render` parameter) found no other site; on the pre-fix text it flags both video sites.
- Change: `poster_alt` takes the heading through `strip_html`.
- Acceptance: the scan reports 0; live on a temporary 404 entry with heading `<em>Watch</em> the <strong>story</strong>` the poster is `alt="Watch the story"` while the heading keeps its markup (restored, sha256 match).

### P13 - Schema text defaults come from the schema locale (Must, user-approved in round 7)
- Evidence: 130 text-type schema defaults are literal strings and 6 use `t:` keys. 120 of them are English copy in 38 files (37 section/block schemas and `config/settings_schema.json`), for example `main-blog` `sidebar_banner.text` "Explore sculptural layers and future-ready footwear.". `shopify/AGENTS.md` forbids copy hardcoded in schema defaults; Dawn (58 / 0) and Horizon (14 / 0) use keys for all of theirs. The other 10 are data and stay literal: `+`, `/`, `✦`, two emoji, a date, a time, a year, the `main-list-collections` excluded handles `all, frontpage` (a translated handle list would stop excluding) and the `contact-form` info value `hello@example.com`.
- Change: each default becomes `t:<label key without .label>.default` in its owner's namespace with the English text unchanged in `locales/en.default.schema.json`; the 12 float social channel names share one label, so they get `channel_text.default__<channel>`, beside the existing `header__<channel>` keys.
- Acceptance: `validate-locales` resolves every key; a scan finds 0 copy literals; every new locale value equals the old literal byte for byte; stored templates are unchanged and the suite shows no change.

### P14 - Axe measures carousels at rest (Should)
- Evidence: the suite's axe step failed on home in rounds 2, 5 and 8 with one `color-contrast` node on the slideshow primary button (1.2, 3.74 and 1.11), each a pair of colours blended by the Swiper crossfade; every isolated rerun (9 in total) reported 0. The home slideshow autoplays every 5 s and an axe run over the long page can straddle a fade.
- Change: `runs/e2e/r5-axe.cjs` stops Swiper autoplay and waits up to 3 s for finite animations to finish before `axe.run`; `REVIEW.md` names this. Theme code is unchanged.
- Acceptance: home at 375 and 1440, 5 runs each, 0 violations; the slideshow stays on slide 0 for 7 s after the stop; a low-contrast element injected into the frozen page is still reported.

## DONE contract

1. P1-P4, P7-P11 and P13 (Must) meet their acceptance checks; P5, P6, P12 and P14 meet theirs or are recorded as skipped with a reason.
2. `settings-usage.cjs` reports 0 unread section, block and global settings.
3. Discovery scan has no theme-owned error (baseline 13 / 20 / 28 platform and dev-proxy owned).
4. Screenshots at 1440x900, 768x1024 and 375x812 of every changed page show no overflow, clipping, overlap or broken image; vision review finds no High issue.
5. No rubric area regresses; Knowledge and trust reaches 3.
6. Keyboard: the cart trigger (button or link) is reachable and named; the drawer keeps its trap, Escape and return.
7. `node --check`, JSON parse, `validate-locales`, `validate-schema-ranges` exit 0; journeys and axe show no new failure.
8. `DESIGN.md` and `REVIEW.md` reflect the delivered rules; prior content preserved.
9. Processes started by the review are stopped.

## Round log

| Round | Proposals done | Checks passing | Regressions fixed | Notes |
|---|---|---|---|---|
| 1 | P1-P7 implemented | `settings-usage` 946 section/block + 182 global, 0 unread; offline branch render 12/12 (`scratch/settings-branch-render.cjs`); live probe: badges `bottom-left` 10 px in, sold-out scheme-4, sale scheme-3, card/PDP/drawer/cart totals in USD, drawer opens on add, no drawer note, notification shows one toast and no drawer, page goes to `/cart`, predictive search 5 results, 0 page errors at 375 and 1440; suite (`round-1-after/suite/`): node check 0 FAIL, locales and ranges exit 0, journeys 96/0, axe 0, lifecycle and error paths 0, discovery 13/20/28; capture 48/48 clean; overlay contract 276/0/7 | Bottom badges overlapped the hover-revealed quick view and add buttons at 768 and 1440 (4 of 6 cards); fixed by lifting bottom badges to 4 rem while the actions show; badge overlap probe 12/12 (4 positions x 3 widths) PASS | Sticky add-to-cart and quick view initial prices use the same currency format as their JS updates; the card price range shows the code once (`$45.00 - $245.00 USD`) |
| 2 | P8 implemented | `settings-usage` (dead tokens stripped, scheme roles and assets included) 946 + 199 global, 0 unread, self-test 10 fixtures; live family probe (`round-2/families/`): defaults keep the look (field 1 px `#D9D4CC`, drawer 1 px left hairline + `0 16px 40px` shadow, media 0 px, pill 1 px), injected tokens change every family (field 3 px, pill 3 px, media 4 px + shadow, pop-up 6 px, drawer 7 px left); muted text 7.21 / 8.14 / 7.29 on schemes 1, 3, 4; 0 overflow and 0 page errors at 375 and 1440; suite (`round-2-after/suite/`): node check 0 FAIL, locales and ranges exit 0, discovery 13/20/28, lifecycle and error paths 0, capture 48/48 clean, overlay contract 276/0/7 | Journeys 94/2: both `404-375` rows hit a dev-server 502; isolated rerun 2/2 PASS (`round-2-after/journeys/journeys-404-rerun.json`). Axe 1 colour-contrast on the home slideshow button at 1440 (`#848380` on `#92918e`, a mid-fade frame); three reruns of home 1440 give 0 | Content-container tokens (`.countdown-banner`, `table`) are wired but no tested route renders one, so they are proven by the shared token only |
| 3 | P9 implemented | `settings-usage` 0 unread or unrendered (app-block phase self-test passes); offline render (`scratch/app-block-render.cjs`) 25/25 sections print an inserted app block once in `.section-apps` with the rest of the markup unchanged, and an app-only section still prints it (logo list's "without" render is empty by design: no logos, no section); a scan found no other offered block type that a section never dispatches; live home has 0 `.section-apps` and 3 slides as before; suite (`round-3-after/suite/`): node check 0 FAIL, locales and ranges exit 0, journeys 96/0, axe 0 on 45 route-viewports, lifecycle and error paths 0, discovery 13/20/28; capture 48/48 clean; overlay contract 276/0/7 | None | No store template holds an app block and no app is installed, so app output is proven offline only |
| 4 | P10 implemented (user chose: keep the carousel, remove `speed` / `direction`) | `settings-usage` 944 + 199 global, 0 unread or unrendered, section dead-token self-test passes; stored select/radio values in 99 template and listing files all match an option and every stored id exists in its schema; live probe (`round-4/`): home at 375/768/1440 has 1 list of 12 cards, inline style without `--mp-speed`, Next scrolls the track 472/560/560 px, 0 overflow, 0 page errors; suite (`round-4-after/suite/`): node check 0 FAIL, locales and ranges exit 0, axe 0 on 45 route-viewports, lifecycle and error paths 0, discovery 13/20/28; capture 48/48 clean; overlay contract 276/0/7 | `validate-locales` failed on `scratch/` snapshots of the old section; it now scans theme directories only. Journeys 95/1: `pdp-cart-1440` sampled the drawer 1.5 s after it opened, before its two sequential fetches finished under parallel load (count 1, items 0); isolated 5/5 PASS; the journey now waits for the drawer's loading state to clear, 21/21 PASS | The working-tree carousel conversion has no recorded decision in `plans/reports/`; the section keeps the name "Marquee products" |
| 5 | P11 implemented | Offline toggle render (`scratch/toggle-effect.cjs`, 520 setting changes over every section and theme block) leaves 34 no-effect results after the fix; each one depends on store data the fixture lacks (upsale collection, page or rich text tab content, sidebar blocks, localization lists) or on liquidjs `render` scope (variant picker: with `product` as a global, picker type and cross-out change the output and `data-cross-out-unavailable` feeds `variant-picker.css` / `.js`). Upsale proven live on a temporary `templates/cart.json` setting (3 items, restored, sha256 match). Video: offline embed probe 6/6, live temporary 404 entry at 375 and 1440 gives `loop=1&playlist=` and no `mute`, cleared URL renders the empty state (restored, sha256 match). Gate 944 + 199 global, 0 unread; suite (`round-5-after/suite/`): node check 0 FAIL, locales and ranges exit 0, journeys 96/0, lifecycle and error paths 0, discovery 13/20/28, capture 48/48 clean, overlay contract 276/0/7 | None | Axe 1 colour-contrast on the home slideshow button at 375 (`#5f5e5e` on `#c6c5c4`, a mid-fade frame, as in round 2); three reruns of home 375 give 0. Seven setting-fed `data-*` attributes have no reader (`animated-counter` prefix/suffix, hero countdown labels, `stock_counter` threshold), but each setting also prints visible markup, so the controls work; left as is |
| 6 | None (audit only, no file changed) | Offline global toggle render (`scratch/global-toggle.cjs`, every global checkbox, select and radio flipped with `settings` as a liquidjs global, master toggles such as `float_social_enable` on): 45/45 changes reach the output of a consuming layout, section, snippet or block; `float_*` channels resolve through the computed `settings[key]` reader. `visible_if`: 13 conditions, every referenced id exists and every compared literal is an option value. Schema `default`s and `presets` over 86 section and block schemas plus the global schema: every select/radio default is an option, every range default is in bounds and on step, every preset setting id and block type exists (the `tabs` preset resolves `tab` as a theme block, `blocks/tab.liquid:104,110`) | None | No suite rerun: nothing changed since round 5 |
| 7 | P12 implemented; P13 approved by the user | Audits with no finding: every range printed with a unit matches its schema `unit` or converts with `times` / `divided_by` (6 bare prints verified: `newsletter-modal.js` multiplies seconds by 1000, `product.js` reads `data-max-height` as px, slideshow converts in Liquid); every JS `parseInt` / `Number` fallback on a range-fed attribute (`value \|\| N`) sits below that range's `min` (newsletter delay min 1, description height min 100, slideshow speeds min 3); no checkbox uses `default: true` without `allow_false` (3 hits are Liquid comments); 21 literal colours in scheme-driven sections all sit on photo backdrops (overlays, white chips over images, lightbox scrim), which `DESIGN.md` allows. Rich-text-in-attribute scan 0 after the fix (2 on pre-fix text). Live 404 temporary entry: `alt="Watch the story"` (restored, sha256 match). Gate 944 + 199 global, 0 unread; suite (`round-7-after/suite/`): node check 0 FAIL, locales and ranges exit 0, journeys 96/0, axe 0 on 45 route-viewports, lifecycle and error paths 0, discovery 13/20/28, capture 48/48 clean, overlay contract 276/0/7 | None | Text defaults: Dawn 58 `t:` / 0 literal, Horizon 14 / 0, this theme 6 / 130; the user chose to migrate the 122 copy defaults in round 8 |
| 8 | P13 implemented | 120 defaults in 38 files now read `t:` keys (`scratch/schema-defaults-before/` holds the 39 pre-edit files): each file's diff changes only `"default"` lines (one per migrated setting), every schema parses, every new locale value equals the old literal byte for byte, the locale diff adds 120 keys and only appends a comma to 107 `label` lines, and the file round-trips with `indent=2, ensure_ascii=True` as before. Rescan: 128 `t:` defaults, 10 literals, all data. `validate-locales` resolves every key and finds none stale. Live: home prints the `layered-images` `text` default and the FAQ view prints all four `contact-form` defaults (stored templates omit them); 11 routes show no raw `t:` key and no "Translation missing". Gate 944 + 199 global, 0 unread; suite (`round-8-after/suite/`): node check 0 FAIL, locales and ranges exit 0, journeys 96/0, lifecycle and error paths 0, discovery 13/20/28, capture 48/48 clean, overlay contract 276/0/7 | None | Excluded handles and the contact info address were migrated at first, then restored as data (a translated handle list stops excluding). The dev server took about 7 minutes to answer after the 39-file upload. Axe 1 colour-contrast on the home slideshow button at 375 (1.11, two blended slides mid-fade, as in rounds 2 and 5); three reruns give 0. `REVIEW.md` names the default-key rule |
| 9 | P14 implemented | Probe check: before the hook the slideshow Swiper has autoplay running; after it `activeIndex` stays 0 across 7 s and no Swiper runs. Home at 375 and 1440: 5/5 runs with 0 violations. Sensitivity: `#probe-low` (`#d0d0d0` on white) injected after the freeze is reported as `color-contrast`. `node --check runs/e2e/r5-axe.cjs` passes | None | Test-only change; no theme file changed, so no suite rerun until round 10 |
| 10 | Final verification | Gate 944 + 199 global, 0 unread or unrendered; suite (`round-10-final/suite/`): node check 0 FAIL, JSON parse 0, locales and ranges exit 0, journeys 96/0, axe 0 on 45 route-viewports (first full run with the P14 probe), error paths, section reload, cart trigger and facet lifecycle as in round 8; capture 48/48 with 0 overflow, clipping or broken images; overlay contract 276/0/7. P5 live hover probe 9/9 plus the touch case (`p5-hover-lift.json`); offline branch render 12/12, including both P6 footer cases. Vision review of the changed surfaces (collection grid and Best Sellers at 375/768, home Trending carousel and footer at 1440 and 375, PDP 375, cart 1440, FAQ 1440 and 375 with the `contact-form` defaults, article 1440): no High issue; the cut edges are the carousel peek and the logo ticker; the blank second grid card at 768 is the belt photo's beige backdrop at the fold | None | One dev-server stall in the suite run: `contact-lifecycle` hit a 90 s `page.goto` timeout and discovery recorded `/products/gift-card` as status 0 (13/19/25). Both routes answered 200 right after; isolated reruns give `hasLifecycle: true` (`contact-lifecycle-rerun.json`) and discovery 13/20/28 (`discovery-rerun.txt`), the baseline. `login` 404 is the baseline since round 1 (the store uses new customer accounts). `/blogs/news` has no articles on this store, so the P5 article check used search results |

## Unresolved questions

1. Resolved: `shopify theme check` (approved, `round-10-final/theme-check.txt`) inspected 328 files. All 1449 reported offenses (69 errors, 1380 warnings) sit in 74 files under `scratch/loop-snapshots/` and `scratch/schema-defaults-before/`, flattened copies the checker cannot place; no file in a theme directory has an offense. `.theme-check.yml` now ignores `scratch/**`, so the next run should show 0 offenses (a new run needs its own approval).
2. No store template holds an app block and no app is installed, so app-block output (P9) is proven offline only.
3. The Search & Discovery app returns no complementary products and the demo cart has no `upsale_collection`; the upsale was proven only on a temporary `templates/cart.json` (restored, sha256 match).
4. Evidence harnesses and the pre-edit copies of the 39 P13 files stay in the gitignored `scratch/` (`app-block-render.cjs`, `toggle-effect.cjs`, `global-toggle.cjs`, `video-embed-probe.cjs`, `schema-defaults-before/`). Delete them when the change is committed.
