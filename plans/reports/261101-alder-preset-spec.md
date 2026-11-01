# Alder preset spec (third preset, home-and-furniture look) - 2026-11-01

Owner decision (2026-11-01): add a THIRD preset, heading font Newsreader ("Walnut & Linen" direction), code and listing only. No photos, no demo-store writes. Sartor and Yarrow stay byte-identical in look.

Source: plans/reports/261101-design-direction.md, plans/reports/261101-furniture-reference.md, .omp/ux-ui-all/REPORT-furniture.md.

## Name and identity
- Preset name `Alder`, handle `alder`. Manifest description: "Warm linen ground, one terracotta accent, a light serif display face and photo-led editorial sections for home and furniture catalogs."
- Two accents only: terracotta `#8A4B33` and olive `#3E4837`. Sale price reuses terracotta. Crimson is not used (scheme `accent` must be reset, it feeds `--color-accent`).

## Palette (contrast ratios verified by hand and recomputed)
| Scheme | Role | background | text | subtext | button / label |
|---|---|---|---|---|---|
| scheme-1 | Linen page | `#F6F2EB` | `#26211D` | `#5E554C` | `#8A4B33` / `#FFFFFF` |
| scheme-2 | Stone (footer, quiet band) | `#E9E2D6` | `#26211D` | `#5E554C` | `#26211D` / `#E9E2D6` |
| scheme-3 | Dark | `#24201C` | `#F6F2EB` | `#B9AEA2` | `#E3C9B0` / `#24201C` |
| scheme-4 | Olive story band | `#3E4837` | `#F6F2EB` | `#D6D8C8` | `#F6F2EB` / `#3E4837` |
- Borders (decorative hairlines): scheme-1 `#DDD5C8`, scheme-2 `#D3CABB`, scheme-3 `#3A332D`, scheme-4 `#566050`.
- `sale_price`: `#8A4B33` on schemes 1 and 2, `#F6F2EB` on 3 and 4. `accent`: scheme-1 `#8A4B33`, scheme-2 `#8A4B33`, scheme-3 `#E3C9B0`, scheme-4 `#F6F2EB`.
- background_2: scheme-1 `#EDE7DC`, scheme-2 `#DFD7C9`, scheme-3 `#2E2924`, scheme-4 `#4A5543`. The worker MUST compute WCAG ratios for every text/background_2 and button pair it sets and keep body text at least 4.5:1, large text and UI at least 3:1.

## Type
- Heading `newsreader_n3`, subheading `red_hat_display_n6`, body `red_hat_display_n4`. Verify each id against the font-picker ids used by `_reference/dwell` and `_reference/vessel` (config/settings_data.json) and the font option list in `config/settings_schema.json`.
- `type_scale_heading 100`, `type_scale_body 100`. Heading tracking h1 -10, h2 -10.
- Verifier corrections: section headings are sized by `heading-size-*` classes and each block's `heading_size`, not by `type_h2_scale`; do NOT set `type_h6_scale 75` (renders under the 11px floor); do not touch type scale ids that the schema does not declare. Mobile root stays 16px.

## Layout and components (settings only)
- `layout_section_gap 0`, `layout_grid_gap_x 12`, `layout_grid_gap_y 40` (max is 40), page width as Sartor.
- Square, flat, left-aligned cards: card stroke, shadow, corner 0; `badge_corner 0`; `variant_chip_corner_radius 0`; button corner 0; `motion_hover_effect` the mildest option (zoom at most 3%); `product_card_text_align` per Sartor.
- Every range value MUST satisfy min <= v <= max and (v-min)/step integer. Padding values step by 5.

## Home template (listings/alder/templates/index.json): 6-7 sections, down from Sartor's 14
1. `hero` or the existing hero section type: height 80/80, one heading, one button, no eyebrow, no countdown, overlay gradient on. Use whatever the Sartor listing already uses for the hero type, but ONE slide / one block only.
2. `rich-text`: one centred statement, generous padding (120 desktop / 60 mobile).
3. `collection-list`: editorial layout if the schema offers it, 4 blocks, `image_ratio` `portrait_45`.
4. `featured-collection`: 4 columns, `image_ratio` `portrait_45`.
5. `image-with-text` on scheme-4 (olive), padding 0, image left.
6. `blog-posts`: 3 cards on scheme-2.
7. Skip `banner-hotspots`: no photograph can ship in a listing template, and an empty hotspot field is a defect.
- The newsletter lives in the footer group (`listings/alder/sections/footer-group.json`).
- NO `shopify://` URLs, no image handles, no collection/product handles, no invented shipping/returns promises or invented years. Copy is plain, neutral, English text (listings may carry literal text like Sartor's listings do). Follow the existing listing files' structure exactly: read `listings/sartor/templates/*.json` and `listings/yarrow/templates/*.json` first.
- Also create the other templates Sartor/Yarrow listings have (product, collection, blog, page.about, page.faq, page.contact, and the groups). Reuse their structure; apply the Alder look through settings. Product: `media_ground` = `page`, `image_ratio` / media aspect `portrait_45` if main-product offers it.

## Shared contract added by the theme-code workers (defaults keep Sartor and Yarrow unchanged)
- New select option value `portrait_45` ("Portrait (4:5)", aspect-ratio 4/5) appended AFTER `landscape` in the `image_ratio` select of featured-collection, main-collection, collection-list, product-recommendations and complementary-products. before-after and main-product already have `portrait` at 4/5, so they get no new value. Never redefine `portrait` (2:3 on cards). `collection-list` `editorial` layout ignores the ratio.
- New main-product section select `media_ground` with values `gray` (default, today's `--color-gray-lighter` look) and `page` (gallery sits on the page ground).

## Must NOT do
No `!important`, no `prefers-reduced-motion`, hit areas >= 24px, locale-backed customer-facing copy outside listing templates, no hardcoded fallbacks, no change to Sartor/Yarrow values, no version bump, no zip rebuild, no shopify CLI, no Admin API, never read `.env`.
