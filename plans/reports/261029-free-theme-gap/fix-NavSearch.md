# fix-NavSearch: mega menu images, search idle state, landmark names

All live results are provisional (shared dev server). Probes: `scratch/NavSearch/probe.cjs`, `menu.cjs`, `featured.cjs` (hot-reload requests blocked so other agents' edits do not reload the page).

## 03 #2 Mega menu images: done (featured card path static-verified only)
Files: `snippets/megamenu.liquid`, `snippets/mega-menu-image.liquid` (new), `snippets/mega-menu-card.liquid` (new), `snippets/mega-menu-link.liquid` (new), `assets/megamenu.js`, `config/settings_schema.json` (new group "Mega menu"), `locales/en.default.json` (`megamenu.*`), `locales/en.default.schema.json`.
- Settings: `megamenu_show_images` (default on), `megamenu_image_ratio` (portrait / square / landscape, class `megamenu--ratio-*`, CSS var `--megamenu-image-ratio`), `megamenu_show_featured` (default on).
- A dropdown becomes `megamenu__dropdown--visual` only if at least one second-level link is a collection/product with an image. Image links render as cards (image + title + their third-level links); links without an image fall back to the existing text rows in the same panel. With no image anywhere the original markup is unchanged. `megamenu_show_featured` adds a card for the top-level link's own collection/product image.
- Measured at 1440 / 1280 / 1024: Shop 8 cards, 8 img, 8/8 alt, 8/8 width+height, 8/8 loaded, box 646x457 inside the viewport (left 353); Collections 4 cards, same checks; Journal and About (no object images): 0 img, 3 text links, panel 218x137 (text-only). Ratio of the media box 0.80 (portrait).
- Image network: 0 collection-image requests before hover, 8 after hovering Shop, 12 after Collections (closed visual panels use `content-visibility: hidden`, so lazy images do not fetch until opened).
- Focus/Esc: focus on first trigger gives `aria-expanded=true`; Esc gives `false` and focus stays on the trigger.
- Latent bug fixed: `checkDropdownOverflow` flipped (right:0) every item in the left third, which pushed a wide panel to left -238 px. It now flips only when `item.left + dropdown.offsetWidth` passes the viewport right edge; the unused `--arrow-offset` writes were dropped.
- Featured card and mixed card/text panels cannot be exercised on the demo menu (no top-level link has an image). Verified by rendering the real snippets with liquidjs and a mock menu: featured card with CTA, mixed cards + text rows, plain item stays text-only. `image_tag` was mocked there.

## 03 #6 Predictive search idle state: done
Files: `snippets/search-modal.liquid`, `assets/search-modal.js`, `assets/search-modal.css`, `sections/predictive-search-empty.liquid` (new), `sections/predictive-search-card.liquid` (new), `snippets/predictive-search-card.liquid` (new), settings + locales.
- `predictive_search_show_price` default now `true` (schema and `settings_data.json`). New settings `predictive_search_show_idle_products` and `predictive_search_show_recently_viewed` (default on).
- On first open the modal fetches `/?section_id=predictive-search-empty` (recommended collection setting, falling back to `collections.all`; 4 cards, heading, `View all products` link to the collection) and, for recently viewed, up to 4 `/products/{handle}?section_id=predictive-search-card` using the existing `product_viewed` localStorage list. Slots sit after the trending and categories chips, so nothing already visible moves when they fill. Slots are `hidden` until filled; `clearResults` restores the filled markup.
- Cards use `predictive-search__link`, so the existing ArrowUp/ArrowDown handler walks them. Typed results, tabs and the `View all N results` link are unchanged (typed "shirt": 3 products, `$88.00`, `View all 6 results...`).
- Measured at 1440 and 375: 5 idle cards (4 recommended + 1 recent), 5/5 with price element (`Contact for price` for a $0 demo product, `$45.00`...), 5/5 img with alt, width, height; headings Trending searches / Featured categories / Recommended products / Recently viewed; 30 Tab presses stay inside `search-modal`; Esc closes and the idle cards are restored on reopen. 2 columns under 750 px, 4 columns from 750 px.

## 05 E1 Landmark names: done (menu + search)
- `<mega-menu role="navigation">` (unnamed inner `<nav>`) became a plain custom element with `aria-label="Main navigation"` on the single `<nav class="megamenu__nav">`. Probe: `megamenu__nav|Main navigation`, `mega-menu` role null.
- Search dialog was already named (`aria-labelledby` the title); added `aria-label` to the `role=search` form and to the results listbox (`templates.search.suggestions`).
- Not mine: the header `<nav>`/`<footer>` landmarks (HeaderA/FooterB) and the `mobile-menu__nav` that still has no `aria-label` (probe shows `null`).

## Verification
Locales SUCCESS, schema ranges SUCCESS, `node --check` on megamenu.js and search-modal.js OK, all four edited JSON files parse, `settings-usage.cjs` exit 0 (200 global settings, 0 unread). Console errors on both viewports are environmental (CDN CORS for origin_trials, shop.app frame, customer-account menu 400); none mention megamenu, predictive search or search-modal.
Note: `locales/en.default.json` was overwritten once by a concurrent edit that dropped my `megamenu` and `view_all_products` keys; I re-added them. Controller should confirm both keys survive the merge.

## Known gaps
- Featured card not exercised live (see above). Recently viewed is only populated after a product page ran `product.js` (existing behaviour of `product_viewed`).
- Recommended uses the collection default sort; Liquid cannot sort by best selling, so merchants pick a best-sellers collection in the existing setting.

## Durable rules
- Mega menu images come only from `link.object` of collection/product links; a dropdown without any such image must keep the original text-only markup.
- Closed image panels use `content-visibility: hidden` so lazy images do not load until the menu opens; width measurements must run on hover/focus, never on a closed panel.
- Search modal idle content is fetched through Section Rendering on first open and written into `hidden` slots placed after the existing chips, so it cannot shift visible content.
