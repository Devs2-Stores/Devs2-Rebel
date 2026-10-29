# fix-ProductC: product page and product card

Probes are in `scratch/ProductC/` (Playwright against 127.0.0.1:9292, hot-reload script blocked, third-party origin_trials/CORS noise filtered). Product template settings were swapped temporarily and restored byte-for-byte.

## 02 #2 Variant-media filtering - done
- `main-product.liquid`: `hide_variants` setting (default off). Each slide carries `data-variant-ids`; `product.js` `initMediaGroups` hides slides and thumbs of other variants (`hidden`), keeps shared media, re-inits Swipers, keeps URL `?variant=` in sync.
- Evidence (utility-overshirt, 3 colours, 1440 and 375): off = 6 slides visible; on = 4 visible for each colour, slide ids change with the colour (8247,1015,3783,6551 -> 1015,3783,6551,9319 -> ...). Product with no variant media: all 6 shown (fallback). 0 console errors.

## 02 #3 Lightbox - done
- `ProductLightbox` rewritten: all media, thumbnails strip, counter ("1 / 6"), prev/next with wrap, ArrowLeft/Right, +/- and reset buttons, wheel zoom, double-click zoom, mouse drag pan, touch pinch and drag pan, focus trap, Esc closes and returns focus to trigger, scroll lock.
- Evidence: 1440: counter 1/6 -> 2/6 on ArrowRight, wrap to 6/6, wheel scale 1 -> 1.822, drag tx 0 -> 60, Esc closes and focus returns to trigger. 375 touch: pinch scale 1 -> 2.8, drag tx -1.1 -> 48.9, trap OK. Tab focus stays inside dialog for all 16 stops.

## 02 #4 Gallery layout - done
- Settings `media_layout` (carousel/stacked), `media_grid_columns` (1/2), `thumbnail_position` (bottom/left/right), `media_aspect_ratio` (adapt/portrait/square/landscape); DOM attributes `data-media-layout`, `data-thumbnail-position`, classes `W--thumbs-*`, `--ratio-*` and CSS in `product.css`.
- Evidence: carousel+left shows vertical thumbs (screenshot checked after fixing slide height); stacked 2 columns shows a 2x grid with zoom buttons.

## 01 #16 / 03 #11 Card global switches - done
- `config/settings_schema.json` product_card: `card_quick_view_enable`, `card_add_button_enable`, `card_hover_image_enable` (default true; data + Rebel preset set). `product-card.liquid` uses them as defaults when callers pass nothing. Choose-options behaviour kept.
- Evidence on `/collections/all` (20 cards): defaults quickview 20 / add 20 / secondary 19; quick view off -> 0 quick view buttons (9 choose links remain); add off -> 0 add buttons and forms; hover off -> 0 secondary images.

## 05 E4 Duplicate script tags - done
- Removed the duplicate tags from `complementary-products`, `product-recommendations`, `product-viewed`; `main-product` emits each once.
- Evidence: curl of rebel-tactical-bomber-jacket: product-card.js 1, product-recommendations.js 1, product.js 1; duplicates [].

## 05 E8 `sizes` - partial (capability done, offenders belong to others)
- `product-card` accepts `sizes`, `columns`, `columns_mobile`; recommendations pass real sizes (`47vw/30vw/22vw`). Default unchanged. CollectionD told to pass columns.
- Offenders (home `srcset` without `sizes`, 19): `section-logo-list__logo` x12, `section-layered__img` x3, `testimonial-card__avatar` x3, `section-ito__img` (overlay hero mobile) x1.

## Validators
node --check OK; JSON parse OK; settings-usage 954 unread 0; schema-ranges OK. validate-locales currently fails with 73 unresolved schema keys, none in my files (my keys resolve); other agents' in-progress work. No CLS regression observed (probe `total` layout shift 0.0001 at 1440 and 375). theme.qa_validate not run: QA_INCONCLUSIVE is not claimed, simply not executed by me.

## Durable rules
- A scroll/zoom state element inside a dialog must call `focus()` on the dialog on pointerdown, otherwise pointer use drops focus to body and breaks the focus trap.
- Side-thumbnail Swiper slides must have `height: auto`; the default `height: 100%` stretches each slide to the full rail.
- Product card toggles read global settings only when the caller passes nothing (nil check), so explicit `false` still wins.
