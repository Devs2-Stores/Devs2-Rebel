# Fix report: CollectionD (collection, search and list sections)

All live numbers are provisional (shared dev server, 127.0.0.1:9292). Probes are in `scratch/CollectionD/` (gitignored). Probe templates `templates/*.zzprobecd*.json` were created and deleted; none remain.

## 03 #7 Mobile filter drawer footer + compact toolbar: done
- Files: `snippets/collection-filter-drawer.liquid`, `snippets/collection-sort.liquid`, `snippets/collection-sort-select.liquid` (new), `sections/main-collection.liquid`, `sections/main-search.liquid`, `assets/collection.css`, `assets/collection.js`, `assets/search.css`, `locales/en.default.json` (`products.facets.see_results`).
- Sort select lives in the drawer on narrow screens and in one toolbar row (filter button, count, view toggle) otherwise.
- Drawer has a sticky footer: Clear all plus `See N items` apply (`N` follows the live result count after every AJAX swap).
- Measured at 375x812 `/collections/all`: first card top y=324 (was 432; target <= 330), toolbar row is one row at y=267 h=45, document scrollWidth 375.
- Drawer flow: open, footer at y=739 h=73 (pinned to the bottom), text "See 22 items"; tick Availability: footer "See 20 items", toolbar "Showing 20 / 20 products", grid 20 cards (footer count == grid count); Apply closes the drawer (x=-320) and the grid stays updated; sort inside the drawer changes the URL to `sort_by=created-descending`; Clear all returns to "See 22 items". 0 console errors.

## 03 #9 Mobile 1/2 column density toggle: done
- New setting `mobile_density_toggle` in `main-collection` (default false, so existing templates are unchanged). When on, the list/grid toggle is hidden on phones and a 1/2 column toggle appears (`collection-sort.liquid`, `collection.js` `bindDensityToggle`, choice kept in `ThemeUtils.storage`).
- Measured with the setting on at 375: initial two cards 165 px wide side by side (aria-pressed on "2"); after tap "1": cards 345 px wide stacked (y 324 and 955); back to "2" restores 165 px. 0 console errors.

## 03 #17 Search pagination types: done
- `main-search` gets `pagination_type` (pagination, load_more, infinite; default pagination) and renders through the shared `snippets/collection-pagination.liquid`; `collection.js` appends search results (tab counts included) on load more / infinite scroll. `main-search` also gets the same toolbar, drawer and active-filter chips as collections.
- Verified markup/JS only against the demo store; demo search has 6 results for `a`, below one page, so load-more append was not exercised live. [not exercised live]

## 04 #6 and 01 #8 List layout variants: done
- New setting `layout` (grid default, carousel, editorial) on `collection-list`, `blog-posts`, `main-list-collections`; `featured-collection` already had grid/slider and gets `editorial` (slider is its carousel). Defaults keep the current look.
- Shared `assets/section-list-layouts.css`, loaded only when the layout is not grid. A list opts in with `data-list-layout` on the card container.
  - carousel: CSS scroll-snap row, peeks the next card on phones; desktop columns are capped at the item count so there is no empty tail when items < columns.
  - editorial: 12-col 7/5 pairs with equal media height; a trailing odd item spans the full row; on phones the first and a trailing even item span full width.
- Measured 1440x900 and 375x812 with 3/5/8 items (4/6/8 for list collections, `per_page` min is 4): document scrollWidth equals viewport in all, editorial rows show gapLeft 0 and gapRight 0 on every row (no empty cells), carousel first card flush left and wider than the container only through its own scroll area. 0 console errors.
- Default presets unchanged: home section boxes at 1440 and 375 identical before/after the layout work for `collection_list`, `marquee_products`, `blog_journal` and the others (only `featured_piece` differs, which is another slice's file).
- Also passes `columns`/`columns_mobile` to `product-card` from `main-collection` and `featured-collection` so image `sizes` follow the real grid (ProductC's new args).

## 04 #9 Before/after size: done
- New settings `image_ratio` (adapt, portrait, square, landscape default, wide), `max_width` (480-1600, default 1600), `max_height` (300-1000, default 750). Repaired the section markup so the wrapper `page-width` container renders.
- Measured on the home preset at 1440: compare wrapper 1290 x 750 (was up to 1975 px tall); at 375: 345 x 230.

## 03 #8 Desktop horizontal filter bar: done
- `main-collection` `filter_layout` gets `horizontal`. At >= 1024 px facets render as dropdown pills above the grid; below 1024 the normal drawer applies. `collection.js`: one dropdown open at a time, outside click and Escape close, the open facet survives the AJAX swap.
- Measured at 1440 with a temporary template: bar y=282 h=40 full width, grid 4 columns starting at x=75; Availability opens (others closed), switching to Price closes Availability, ticking a value filters via AJAX and keeps Price open, outside click closes all; 0 console errors.

## Validators
`validate-locales.mjs` SUCCESS, `validate-schema-ranges.mjs` SUCCESS, `node --check` on `collection.js` and `search.js` OK, `runs/e2e/settings-usage.cjs`: settings 938 unread or unrendered 0, global 228 unread 0. Theme Check and `theme.qa_validate` not run by me (controller serial run).

## Known gaps
- Search load-more/infinite not exercised with > 1 page of results (demo data).
- Editorial last full-width card is 448 px tall at 1440 by design (`--list-media-h`).

## Durable rules
- List variants (carousel, editorial) opt in with `data-list-layout` on the card container and the shared `assets/section-list-layouts.css`; the default grid stays in each section's own stylesheet.
- A variant must never leave an empty grid cell: editorial uses 7/5 pairs with a full-width trailing odd item, carousel caps its desktop columns at the item count.
- A filter panel shown as a drawer needs a footer with the live result count (`See N items`) and Clear; sort lives in the drawer on phones so the first product card stays above y=330 at 375.
