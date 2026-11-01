# Design direction - furniture-grade look for Sartor (2026-11-01)

Status: DECISION PENDING. Nothing in the theme has been changed by this council run.

## Verdict

ultra: picked=4/5 margin=low unanimous=no rejected_all=no

- Winner: **"Plaster & Walnut"** (Candidate 4 = proposer slot `taste`). Heading `instrument_serif_n4`, subheading `red_hat_display_n6`, body `red_hat_display_n4`. Ground plaster `#EFEBE4`, walnut `#5B3F2C` (buttons, story band), oxblood `#8A2E22` (sale price only). Square, flat, left-aligned cards, 8 home sections, added as a THIRD preset.
- Runner-up: **"Walnut & Linen"** (Candidate 1 = slot `huashu`). Heading `newsreader_n3`, terracotta `#8A4B33` plus olive band `#3E4837`, 7 sections. Every number sits on the schema grid; retunes the Sartor preset instead of adding one.
- Margin is low (16 vs 13 of 20, hand-scored). Swapping the heading font flips the ranking, and a single-pass answer would likely have matched.

## What all five candidates share

Square corners and flat cards (already Sartor's values), one `hero` at 80/80 with one headline (one italic `<em>` word) and one button, transparent header over the hero, home cut from 14 to 7-8 sections, crimson retired, four schemes, photography only on the demo store. The home spine is rich-text, editorial collection-list, featured-collection, banner-hotspots, image-with-text on the scheme-4 band, a journal/trust row, and the newsletter in the footer.

Dropped from home in every candidate: slideshow, scrolling-text, marquee-products, before-after, layered-images, image-text-overlay, parallax-image, testimonials, the empty featured-product.

## Corrections the verifier applied to all five (checked in code)

- Section headings are sized by `heading-size-*` classes and each block's `heading_size`. `type_h2_scale` and `type_h3_scale` only affect bare `h2`/`h3`. Do not tune them for section titles.
- Do not set `type_h6_scale 75`: it renders 10.5-10.8px, under the 11px floor. Eyebrows come from `.section-subheading` and `--eyebrow-*`.
- No `.heading em` rule is needed: headings are `inline_richtext` and the italic face is emitted at `snippets/head-fonts.liquid:13-14,34-35`. Instrument Serif italic is unverified in the picker; fall back to `newsreader_n3`.
- A single-weight face (Instrument Serif) gets synthetic bold wherever CSS hard-codes 600/700 (`footer.css:63,172`, `cart-modal.css:74`, `blog.css:120,438`, `article.css:360,432`, `customer.css:25,717,1147`). Add `font-synthesis-weight: none` or choose Newsreader.
- Scheme `accent` is `#BC1E2C` today and feeds `--color-accent`; any new scheme set must reset it, otherwise crimson survives as a third accent.
- `layout_grid_gap_y` max is 40 (candidate 5's 48 is invalid); padding steps are 5.
- Mobile root stays 16px. A 14px `html` root would shrink the 11px micro step to 9.6px. If wanted: a `body`-only `font-size: var(--font-sm)` under 750px.

## Needs new markup or settings (ranked)

1. 4:5 card ratio as an ADDITIVE option on `featured-collection`, `main-collection`, `product-recommendations`, `complementary-products` and the hard-coded `cart-recommendations.liquid:27`. Never redefine `portrait` (2:3).
2. PDP gallery ground setting (default = today's `--color-gray-lighter`, `product.css:67,177`).
3. Card-title font-family select (default = heading font).
4. `font-synthesis-weight: none` on `html`.
5. Per-section tile gap select on `collection-list` (editorial uses a fixed 12/20px `--list-gap`).
6. `image-with-text` media-height setting.
7. Empty states render nothing: hero placeholder black field, blog-sidebar black banner.

## Must NOT do

- Do not retune the Sartor preset or edit `listings/manifest.json`'s Sartor description: Sartor is under Theme Store review as a Clothing theme. The furniture look is a third preset, only on the owner's explicit approval, with its own listing templates and its own demo store.
- Do not alter the pinned review zip or bump the version; ship as an update.
- Do not rename or remove setting ids, option values or `portrait`.
- No images, handles, `shopify://` URLs or invented promises in shipped or listing templates (`scripts/package-theme.py:100-107` fails the zip). Placeholder findings are fixed on the demo store, not in `templates/index.json`.
- No `!important`, no `prefers-reduced-motion`, hit areas stay at least 24px, locale-backed copy only, two accents maximum.
- Do not clone Dwell.

## Council result in one line

The dev store at `127.0.0.1:9292` renders the neutral install templates on an apparel catalogue, so most "ugly" is empty content, not theme code. The theme-owned defects are small. Evidence: `.omp/ux-ui-all/REPORT-furniture.md`, `plans/reports/261101-furniture-reference.md`.
