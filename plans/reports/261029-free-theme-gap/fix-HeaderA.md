# Fix report: header and mobile drawer (HeaderA)

All live results below are provisional (shared dev server). Probes are in `scratch/HeaderA/` (`probe1.cjs`, `probe2.cjs`, `cls.cjs`, `combos.cjs`, `gate.cjs`, `drawer.cjs`, `loc-harness.cjs`). The dev store has one country and one language, so the localization selector was exercised by rendering the real snippet with liquidjs (23 mock countries, 3 languages), injecting it into the live header/drawer with the real CSS and JS (`loc-harness.cjs`). The `localization` form POST was intercepted and asserted. The Liquid `form 'localization'` tag itself could not run on this store.

Settings shown by probes: `config/settings_data.json` not touched. `sections/header-group.json` header block: `logo_position left, menu_placement inline, sticky_mode always, transparent_home true, transparent_collection false, transparent_product false, transparent_text_color #FFFFFF, transparent_scrim_color #000000, show_country_selector false, show_language_selector false`. The layout, scroll-up and localization-on variants were tested by a short temporary edit of these keys, reverted afterwards.

## Items

### 03 #3 Header layout options: done
- `sections/header.liquid`: `logo_position` (left/center) and `menu_placement` (inline/below) emit `header__wrapper--logo-*` / `header__wrapper--menu-*`; grid areas change at >=1024px. Mobile keeps hamburger / logo / actions.
- Measured at 1440 (settings temporarily center+below): logo x=638 w=164 (centered), menu row at y=81 spanning x=75..1365, list centered (first item x=468, list w=504). center+inline: logo 638, menu 75..590. left+below: logo 75, menu row below. Default left+inline unchanged.
- Gap: with `below` + `center` the menu list centering uses `width:max-content; margin-inline:auto` on `.megamenu__list` (styled from header.liquid, megamenu files untouched).

### 03 #4 and 04 #5 Transparent header and sticky scroll-up: done (collection/product partial by design)
- Settings: `transparent_home/collection/product` (per template via `request.page_type`), `transparent_text_color`, `transparent_scrim_color`, optional `transparent_logo`; `sticky_mode` always / scroll-up / never replaces `sticky_enable` (header-group.json and locales migrated).
- CSS only (nested `body:has(...)` in the header stylesheet): the header turns transparent only when the first section of `main` is a full-bleed media section (`section-slideshow-wrapper`, `-hero-`, `-ito-`, `-video-`, `-parallax-`); otherwise nothing changes. Hero sections are not edited. `global-header` becomes `position:absolute` inside the (sticky) section wrapper; `main` is pulled up by `--announcement-height` (inline script sets it before paint, `header.js` keeps it current), so the hero starts at y=0 behind the announcement bar and the header.
- Text colour and scrim: `--color-foreground` is overridden on `global-header` (all derived tokens follow), plus a 60% scrim gradient behind the header.
- Solid state: JS sets `data-solid` after 8 px of scroll, on mouse hover and while a `details` in the header is open; `:focus-within` is handled in CSS. Scroll-up mode sets `data-hidden` (translateY(-100%)) after scrolling down past the header, shows it on any upward scroll, hover or focus; `--header-height-sticky` is 0 while hidden.
- Measured home (shared server): 1440 and 375: hero top y=0.00, header y=33.5 (1440) / 50 (375) = below the announcement bar, 73 px / 61 px tall, background rgba(0,0,0,0). Contrast: header box captured with header content hidden (scrim + hero pixels); white text vs the brightest pixel = 11.74 (1440) and 12.34 (375), p99 12.69 / 13.79. After scroll 200: `data-solid`, background rgb(245,242,237), text rgb(10,10,10), wrapper `position: sticky`, top 0. Back to top: clear again. Mouse hover: solid. Scroll-up mode (temp): scrollTo 800 -> data-hidden, top -122; scrollTo 700 -> visible, top 0.
- Gating: `/collections/all` and `/products/...` (toggles false) render the solid in-flow header (static, first section top 107 = header bottom). Home with the slideshow class removed: header static, solid, main margin 0.
- Known gap: the default collection and product templates start with a `breadcrumb` section, so their toggles take effect only when a merchant puts a full-bleed media section first (the collection banner lives inside a `.page-width`, not full bleed). Hero top equals y=0 includes the announcement bar region: the bar (z-index header-1) overlays the hero's first pixels.
- Without JS: header stays clear at the top and is not sticky (sticky is applied by `header.js`, as before); megamenu dropdown over a clear header could show light text on the light panel until JS runs.
- Gap: `transparent_logo` image swap not exercised live (no logo asset in the demo settings); CSS path is plain `display` switching.

### 03 #5 Country and language selector: done (static + harness), not run through the real Liquid form tag
- New `snippets/localization-selector.liquid` (LiquidDoc: `kind`, `form_id`, `variant` dropdown/dropup/inline), `assets/localization-selector.js`. Native `<details>` disclosure inside `{% form 'localization' %}`; one submit button per option (`country_code` / `language_code`); search input appears (JS un-hides it) for more than 10 countries; no results message in a `role=status` paragraph.
- Header: `header__localization` before the search button (>=1024 only); drawer: inline variant in `mobile-menu__footer`. Settings `show_country_selector` / `show_language_selector` (default off); each renders only if the store has more than one country / language.
- Harness at 1440: summary "US USD", opens with search focused (23 items), typing "can" leaves Canada, ArrowDown focuses it, ArrowUp returns to search, "zz" shows the empty message, Escape closes and refocuses the summary, Enter reopens, selecting Canada posts `country_code=CA`, outside click closes, language panel has 3 items and no search, header goes solid while open. 375: header copy `display:none`, drawer shows both selectors, country panel inline (224 px) inside the footer, Escape closes the panel but not the drawer.
- FooterB was told by message that the snippet exists.

### 05 E1 Landmarks: done
- `sections/header.liquid` schema `"tag": "header"`. Live: `document.querySelectorAll('header').length === 1` on `/`; Playwright `getByRole('banner')` count 1 (the element has the implicit banner role, so the literal `[role=banner]` attribute selector is not present). Navs: `megamenu__nav` "Main navigation" (NavSearch fixed the megamenu nav), `mobile-menu__nav` "Mobile navigation" (new key `accessibility.mobile_navigation`).

### 05 E6 Cart link: done
- Header cart is always `<a href="{{ routes.cart_url }}">`; `data-action="open-cart-sidebar"` is added unless `cart_type == 'page'`, and the existing cart-modal click handler already calls `preventDefault`. With `javaScriptEnabled:false`, clicking the cart landed on `/cart`. The hamburger is still a button (not part of the acceptance list).

## CLS (provisional)
Load at 375: one shift of 0.00009 (`.header__actions` 40 -> 44 px, the `shopify-account` element upgrading); 1440: 0.00001. Scroll to 200 and back adds no shifts from the header. Page-wide CLS is not claimed.

## Static checks
- `node scripts/validate-locales.mjs`: SUCCESS.
- `node scripts/validate-schema-ranges.mjs`: failed only on `templates/list-collections.zzprobecd.json` (another agent's probe template, per-page values); the header has no range settings.
- `node --check assets/header.js` and `assets/localization-selector.js`: OK. JSON files parse.
- `node runs/e2e/settings-usage.cjs`: "unread or unrendered 0", global unread 0.

## Files
`sections/header.liquid`, `sections/header-group.json`, `snippets/mobile-menu.liquid`, `snippets/localization-selector.liquid` (new), `assets/header.js`, `assets/localization-selector.js` (new). Shared: `locales/en.default.json` (`accessibility.mobile_navigation`, `localization.search_label`, `localization.no_results`), `locales/en.default.schema.json` (header settings; `sticky_enable` removed).

## Durable rules
- A transparent header overlays the page only when `body:has()` finds a full-bleed media section as the first section of `main`; the header's `--color-foreground` override plus a scrim keeps its text readable, and it turns solid on scroll, hover, focus-within and open disclosures.
- Header overlays measure the announcement bar into `--announcement-height` with an inline script before paint, so pulling the hero to y=0 never shifts layout.
- Country and language selectors are one shared snippet (`localization-selector`) built on `details` plus submit buttons; reuse it instead of a `<select>`.
