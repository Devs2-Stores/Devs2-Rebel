# Furniture-grade reference research for Sartor (2026-11-01)

Scope: read-only research. Sartor = `E:/Work/shopify` (Shopify OS 2.0). Goal: capture what premium furniture/home themes do and map each trait to a Sartor setting, token or new markup.

## 0. Sources actually read

| Kind | Path / URL | What was taken |
|---|---|---|
| Local config | `_reference/{dwell,savor,vessel,fabric,tinker,pitch}/config/settings_data.json` | palette, fonts, type sizes, radii, card/button/badge settings |
| Local templates | `_reference/*/templates/index.json`, `product.json`, `collection.json` | section order, layout types, columns, gaps, ratios, heights, padding |
| Local groups | `_reference/*/sections/header-group.json`, `footer-group.json` | header position/transparency/sticky, footer bands |
| Local CSS | `_reference/dwell/snippets/card-hover-effect-styles.liquid`, `snippets/theme-styles-variables.liquid`, `assets/base.css` | hover amounts, animation speeds, page margin/width tokens |
| Sartor | `DESIGN.md`, `config/settings_schema.json`, `config/settings_data.json` (presets Sartor, Yarrow), `snippets/head-design-systems.liquid`, `assets/base.css`, `snippets/product-card.liquid`, `templates/index.json`, section schemas (`header`, `hero`, `collection-list`, `main-product`, `image-with-text`) | token owners, current values, available options |
| Live (measured with Playwright, 1440x900, own browser, not AntiFan) | https://theme-dwell-demo.myshopify.com/ , https://theme-vessel-demo.myshopify.com/ , https://theme-fabric-demo.myshopify.com/ | computed font size/family/weight, section heights, image ratios |
| Theme Store pages | https://themes.shopify.com/themes/dwell , /savor , /vessel , /prestige (marketing copy + feature lists only) | positioning copy, feature lists, version 4.3.0 |
| Web search (secondary, not measured) | https://gempages.net/blogs/shopify/shopify-themes-for-furniture-stores plus 7 listicle URLs returned by web_search | which paid themes are named for furniture |

Not read / not measured (flagged `[INFERENCE]` wherever used): live Savor demo (password page: https://theme-savor-demo.myshopify.com/password), live Tinker/Pitch demos, Impulse, Be Yours, Kalles and Prestige live demo code. No paid-theme palette, font or spacing number appears below as fact.

Reference themes are all Shopify Horizon 4.3.0 variants (release notes on the Dwell page: "Version 4.3.0 - October 09, 2026"), so sections, tokens and ratios are shared; differences are config.

Horizon tokens that recur (read from `_reference/dwell`): body 14 px; product-card hover `--hover-scale-amount: 1.03`, `--hover-subtle-zoom-amount: 1.015`, `--hover-lift-amount: 4px`; `--animation-speed: 0.125s`, `--animation-speed-medium: 0.15s`, `--animation-speed-slow: 0.2s`, easing `ease-in-out`; page margin 16 px mobile and 40 px from the desktop breakpoint (`assets/base.css:276-284`); `--narrow-page-width: 90rem`, `--wide-page-width: 150rem`. The reference CSS wraps hover in `prefers-reduced-motion: no-preference`. Do not copy that: the workspace bans it.

Horizon ratios measured live: `portrait` card image = 4:5 (0.80, 320x400 in a 4-col grid at 1440, Dwell, Vessel, Fabric). Sartor `portrait` is **2:3** (`snippets/product-card.liquid:331`), which is a taller fashion ratio; this is a real difference.

---

## 1. Per-theme findings

Common to all six: radius 0 on buttons, inputs, variant buttons (Fabric: primary button 2, inputs 8, cards 2; Tinker: cards 10, inputs 4, variant pill 100; Pitch: secondary button 100, variant pill 100); card border none; cart is a drawer; hover on cards is a 1.5-3 % zoom/scale; badges square/2 px. Source of each row is the `settings_data.json` / `templates/index.json` of that theme unless marked "live".

### 1.1 Dwell (`_reference/dwell`; live https://theme-dwell-demo.myshopify.com/)

- Positioning (themes.shopify.com/themes/dwell): "Warmth that welcomes ... warm, neutral palette that feels like home. Elegant serif typefaces". Free, by Shopify.
- Palette (`color_palette`): background `#ffffff`, foreground `#4A4A4A` (8.86:1 on white, computed), color1 `#7D5449` clay/terracotta (sale badge, the "Ultimate Set" band, 6.49:1 on white), color3 `#E9E4E0` warm stone (footer band, input and variant borders), color4 `#D0CAC4` (dividers). Live body colour measured `rgba(0,0,0,0.71)` on `rgb(255,255,255)`. Primary button = foreground fill, background-colour label, radius 0. One accent only (clay), the rest are warm neutrals.
- Fonts: heading `newsreader_n3` (Newsreader 300), subheading and body `newsreader_n4`, accent `red_hat_display_n5` (uppercase labels, h4/h6). Live: hero H2 72 px Newsreader 300, line-height 79.2 px (1.1), italic via `<em>` in the heading text; body 14 px Newsreader.
- Heading scale (config): h2 40, h3 24 (subheading font), h4 18 accent uppercase `heading-loose`, h5 16, h6 12 accent uppercase `heading-loose`; live hero 72. Italic serif emphasis is the signature: "The Winter Collection", "Shop the look", "Collection", "Accessories" (all `<em>`), small uppercase eyebrow above ("ELEVATED ESSENTIALS", "SHOP BY", "COMPLETE YOUR HOME WITH").
- Card treatment: no border, radius 0, flat, image `portrait` (4:5, live 320x400) in the 4-col carousel, `square` in the 5-col accessories grid, collection cards `portrait` bento and `square` grid; title below image centered; sale price uses clay.
- Hero: `section_width full-width`, `section_height medium` (live 568 px tall at 1440x900, image 1430x568 = 2.52:1), overlay `#00000030` gradient, headline 72 px italic white centred low, single text-link "SHOP NOW"; header is NOT transparent on home (`enable_transparent_header_home false`).
- Home section order (`templates/index.json`): hero (568) -> centred italic statement paragraph (276) -> product carousel 4 cols, 8 px gap (518) -> eyebrow+title row with "VIEW ALL" (94) -> shop-the-look hotspot image, full-width (607) -> collection bento 4 cols (766) -> collection grid 5 cols square (493) -> media-with-content "The Ultimate Set" on clay, `media_height 80svh` (720). Then footer. = 8 sections. Live heights in px in parentheses.
- Spacing rhythm: section padding-block 48 (most), 60 (statement), 24/0 for header rows; gaps between header and grid 28; card column gap 8 (carousel/bento) and 22 (grid).
- Header (`header-group.json`): announcement bar (clay band, 12 px text, padding 15), logo centred, menu row **below** logo centred, search left, account/cart right, hairline divider `color3` under the page-width row, `enable_sticky_header never`. Live header height 110 px.
- Footer: newsletter band then footer on `color3 #E9E4E0`; newsletter input is underline style, heading 12 px uppercase; large logo left, three link columns with vertical hairlines, copyright + policy list + social row below a `color4` hairline.
- Motion: `--animation-speed 0.125s ease-in-out`; `settings_data.json` has no `card_hover_effect` key (Savor `subtle-zoom` and Vessel `scale` do), so the effective default was not verified.
- Product page (`templates/product.json`): gallery `aspect_ratio 1/1.25` (4:5), thumbnails right, zoom, sticky ATC, content centre-aligned, gap 24, then related 4-col grid (portrait), then full-width media-with-content 50svh with `extend_media`.
- Collection page: grid, card size medium (small on mobile), centred grid width, gaps 16/16, padding 32; page header is a `section` block with gap 12, padding-top 40.

### 1.2 Savor (`_reference/savor`; theme page https://themes.shopify.com/themes/savor; live demo is password-locked)

- Positioning: "Bright, appetizing displays ... immersive, edge-to-edge imagery". Food theme but its structure is relevant for edge-to-edge grids.
- Palette: background `#ffffff`, foreground `#000000`, color1 `#a42325` red (primary button fill, sale badge; 7.38:1 on white), color2 `#e8d5c7` blush/sand (video band), color3 `#E6E6E6` (footer band, borders). Sold-out badge inverted.
- Fonts: heading/subheading/accent `barlow_condensed_n6` (uppercase everywhere: h1..h6 `type_case_* uppercase`, primary button uppercase accent), body `inter_n4`. h2 48, `display-tight`. Condensed uppercase is the loud choice; poor fit for quiet furniture.
- Card treatment: product grid 3 col **gap 1 px** on `full-width`, image `square`, title left + price right on one row, subtitle metafield below; `card_hover_effect subtle-zoom`.
- Hero: page-width, `large`, brand-colour backing, solid overlay `#00000026`, one H2 "Savor every. last. bite." + "Shop all ->" button. Header transparent on home, product and collection.
- Home order: hero -> product grid (3 col, 1 px gap, full-bleed) -> video + text split on `color2`. = 3 sections.
- Header: logo left, menu left, `section_width full-width`, not sticky, no divider. Footer on `color3`, newsletter inside footer block, no divider line (`divider_thickness 0`), padding 36.

### 1.3 Vessel (`_reference/vessel`; live https://theme-vessel-demo.myshopify.com/)

- Positioning: "Sophisticated warmth ... Open, airy design puts the focus on your products, with enough negative space".
- Palette: background `#f9f8f6` warm off-white, foreground `#000000`, color1 `#ECEBE9` (inputs, borders, divider, footer rule), color2 `#ffffff` (product-tile backdrop). No chromatic accent at all: sale badge `#2e2e2e`, sold-out `#f7f7f7`. Primary button = black fill, square.
- Fonts: heading + accent `trirong_n2` (Trirong 200, ultra-light serif), body `red_hat_display_n4`, subheading `red_hat_display_n6`. Live: H1 88 px, line-height 88 px (1.0), weight 200; section title (h5 type) 32 px Trirong 200; card titles 14 px Red Hat Display 600 uppercase (`card_title_case uppercase`).
- Heading scale: h1 88, h2 48, h3 32 (display-tight), h4 24 (subheading font), h5 14 uppercase, h6 12. Italic emphasis on one word of the hero ("*Enrich* the everyday").
- Card treatment: flat, no border, image `portrait` 4:5 (live 261 px wide in the 5-col carousel; 320 px in the 4-col grid 0.80), cut-out product on `#ffffff`/off-white tile, `card_hover_effect scale` (1.03), badge top-right radius 2, swatch rectangles 50x20 radius 0, centre-aligned title+price under image. Icon stroke `thin`.
- Hero: `page-width` text, `large` section (live 720 px = 80 % of 900), image 1430x720 (1.99:1), gradient overlay `#0000009e`, H1 88 px white left, **transparent header over hero** (`enable_transparent_header_home true`), sticky on scroll-up, logo left, menu centre, search right, no divider.
- Home order (live section heights): hero (720) -> bestsellers carousel 5 cols, no gap (522) -> featured product 1 media-left 50/50 tile pair (780) -> featured product 2 media-right (780) -> product grid 4 cols 24 px gap with serif intro (620) -> collection list 3 cols full-bleed no gap, portrait (692). = 6 sections.
- Page width `wide` (max `--wide-page-width` 150rem). Section padding 48; hero gap 96 between lines.
- Footer: same off-white as page, three columns (Shop, About us, newsletter with boxed input), single `color1` hairline above copyright; padding 32/64.
- Product page: gallery square (aspect 1), thumbnails bottom, constrain to viewport, `equal_columns true`, gap 48, then full-bleed media-with-content 60svh, then 4-col related (square).

### 1.4 Fabric (`_reference/fabric`; live https://theme-fabric-demo.myshopify.com/)

- Palette: background `#ffffff`, foreground `#030302`, color1 `#d3cec5` warm greige (borders, drawer, divider), color2 `#F5F5F5` (tile backdrop). Monochrome + greige.
- Fonts: all `geist` (heading n6, subheading n5, body n4). Live: H1 72 px Geist 400; h3 24 px; h4/card titles 14 px, weight 400, no uppercase. h1 72, h2 32, h3 24, h4 14, h5 14, h6 12 uppercase loose.
- Cards: radius 2, primary button radius 2, inputs 8, popover 8; portrait images (live 407 px wide at ratio 0.58 in the "New this season" carousel, 477 px at 0.80 in the grid), zero gap (`columns_gap 0`), `subtle-zoom`, badge top-left radius 2.
- Hero: `full-screen` (live 900 px), logo block as the headline (header `hide_logo_on_home_page true`), header **transparent on home and product**, sticky `always`, logo centre, menu left, search right.
- Home order (live heights): hero full-screen (900) -> carousel 3 cols gap 40 (793) -> collection list 3-col full-bleed, no gap, `carousel_on_mobile` (596) -> marquee text (131) -> video section (1165) -> divider (1) -> product carousel 4 cols no gap, full-width (748) -> media-with-content 80svh wide (720). = 8 sections.
- Footer: newsletter (underline input, h2-size input) above 4 link columns, 48/48 padding, hairline `color1`.
- Product page: gallery 1/1.25, thumbnails bottom, `limit_details_width false`, gap 40, related carousel 3 col portrait, then collection list 4 col.

### 1.5 Tinker (`_reference/tinker`; not live-measured)

- Palette: background `#ffffff`, foreground `#000000`, color1 `#c3cca6` sage, color2 `#adc4c2` aqua grey, color3 `#fdc656` butter, color4 `#F1EDE8` warm oatmeal. Footer on color2, newsletter band on color4. Colourful; four accents breaks the two-accent rule, so only sage + oatmeal are reusable.
- Fonts: heading + accent `instrument_serif_n4`, body/subheading `instrument_sans_n4`. h1 72, h2 48, h3 32, h4 24, h5 18.
- Cards: radius 10, variant pill 100, inputs 4, popover 14, square image, 4 cols gap 12; hero `large` page-width.
- Home order: hero (headline "Introducing / Our Newest Arrivals") -> product grid 4 col square -> media-with-content 50svh, medium media -> collection bento 4 col. = 4 sections. Header logo left, menu centre, transparent on home, sticky scroll-up.

### 1.6 Pitch (`_reference/pitch`; not live-measured)

- Palette: background `#fffaf7`, foreground `#761e0b` (deep oxblood text, 10.34:1), color1 `#ff4315` orange (footer band; 3.34:1 on bg so not usable for text), color2 `#531003`, color3 `#e2c8f3` lilac, color4 `#ee542f`. Boldest palette; skincare, not furniture.
- Font: `liter_n4` for everything. Cards radius 0, secondary button and variant pill fully rounded (100). Header logo centre, menu left, transparent on home, sticky always.
- Home order: tall typographic `section` hero (padding-block-end 80) -> two full-width media-with-content (50svh) -> product carousel 4 col -> two-up image split. = 5 sections. Footer on orange with an image block.

### 1.7 Furniture-oriented paid themes (secondary evidence only)

- web_search (8 listicle sources, e.g. https://gempages.net/blogs/shopify/shopify-themes-for-furniture-stores): Prestige is named best for premium furniture ("Large imagery, editorial layouts ... lookbook-style merchandising ... material and craftsmanship storytelling"), Impulse best for large sale-driven catalogs (one source says its "fashion-forward design language is less neutral for non-apparel categories"), Be Yours cheap and versatile, Kalles least evidenced for furniture.
- https://themes.shopify.com/themes/prestige/presets/prestige: "Designed for premium, high-end brand appeal", 5 presets (Prestige, Couture, Vogue, Strass, Signature), 30+ sections, features include lookbooks, image hotspot, before/after slider, product tabs, quick buy, sticky cart.
- Demo stores for Impulse, Be Yours, Kalles and Prestige were not opened; any claim about their palette/type is `[INFERENCE]` and none is used in section 4.

---

## 2. Cross-theme traits that read as premium furniture design

Evidence column cites the file/measurement. "n/6" counts the six local references; Fabric/Vessel/Dwell rows also confirmed live.

| # | Trait | Evidence | n/6 |
|---|---|---|---|
| T1 | Warm off-white or white ground; ink is soft black or warm grey, never saturated | Dwell `#ffffff`/`#4A4A4A`; Vessel `#f9f8f6`; Pitch `#fffaf7`; Fabric `#fff`/`#030302` | 6 |
| T2 | At most one chromatic accent, used on one surface (button, band, sale); everything else neutral | Dwell clay `#7D5449`; Savor `#a42325`; Vessel none; Fabric greige | 5 |
| T3 | Large light serif (or clean sans) headline, weight 200-400, line-height 1.0-1.1, tight tracking, one italic word | Dwell 72 px/300 lh 1.1 (live); Vessel 88 px/200 lh 1.0 (live); Fabric 72 px/400 (live) | 4 |
| T4 | Small tracked uppercase eyebrow (12-14 px) above a large title; 3-4 sizes only (12 / 14 / 24-32 / 48-88) | Dwell h6 12 px accent uppercase; Vessel h5 14 px uppercase | 4 |
| T5 | Body text 14 px, secondary text same size lighter | all `type_size_paragraph 14` | 6 |
| T6 | Square corners and no borders or shadows on cards/images; separation by whitespace and one hairline | radius 0 in 5/6; card border `none` | 5 |
| T7 | Product imagery 4:5 portrait or 1:1 on a neutral tile, cut-out products centred; titles 13-14 px, prices regular weight | Dwell/Vessel/Fabric live 0.80; Tinker/Savor square | 6 |
| T8 | Hero is one image, 568-900 px (medium to full-screen), gradient overlay <= 0x9e alpha, one headline, one low-key link button | Dwell 568, Vessel 720, Fabric 900 live | 5 |
| T9 | Header transparent over the hero on home; logo + 4-6 menu links + 3 icons; hairline or nothing; sticky scroll-up | Vessel/Fabric/Tinker/Pitch/Savor transparent home; Dwell hairline | 5 |
| T10 | Few home sections (3-8), alternating big image and quiet product row; no ticker, no marquee products, no before/after, no parallax | section counts 8/3/6/8/4/5 | 6 |
| T11 | Full-bleed, zero-gap image tiles for collections (3 col, label bottom-left) or a bento | Vessel collection-list 3 col gap 0; Fabric gap 0; Dwell bento gap 8 | 4 |
| T12 | Generous vertical rhythm: section padding 48-80, title to grid 28-32, one background colour for consecutive sections | `padding-block 48` repeats in every `index.json`; Dwell 60 | 6 |
| T13 | Large lifestyle image with hotspots or media + text on a flat brand-colour block at 50-80svh | Dwell hotspots 607 px + clay band 720; Vessel featured product pairs 780; Fabric media 80svh | 4 |
| T14 | Footer: soft tinted band (warm stone), newsletter with underline input, big logo, columns divided by hairlines | Dwell `#E9E4E0`; Fabric underline newsletter | 4 |
| T15 | Motion is short and quiet: 125-200 ms, ease-in-out; card hover 1.5-3 % zoom/scale, no lift | Horizon tokens in `_reference/dwell/snippets/*` | 6 |
| T16 | Product page: 4:5 gallery, thumbnails bottom/right, centred narrow info column, sticky ATC, full-bleed story band, then related | `product.json` of Dwell/Vessel/Fabric/Tinker | 4 |

---

## 3. Mapping: trait -> Sartor setting / token, or new markup

Sartor facts used: current Sartor preset scheme-1 `#F5F2ED` / `#0A0A0A` / `#BC1E2C`, Inter only, `layout_page_width 1600`, `layout_grid_gap_x 16`, `layout_grid_gap_y 40`, `product_card_*` all 0, `badge_corner 40`, `motion_hover_effect default` (`config/settings_data.json`, preset "Sartor"). Home today (`templates/index.json`) has **14 sections** (slideshow, scrolling-text, collection-list, featured-product, marquee-products, banner-hotspots, before-after, image-with-text, layered-images, image-text-overlay, parallax-image, testimonials, blog-posts, newsletter) against 3-8 in the references.

Heading arithmetic (Sartor `assets/base.css:48-54`, `snippets/head-design-systems.liquid:99-109`): desktop h1 = 2.25rem x `type_h1_scale`, h2 = 1.875rem x scale, h3 = 1.5rem, h4 = 1.25rem, h5 = 1.125rem, h6 = 1rem (x `type_scale_heading` where tokens use it). Hero display = `.heading-size-2xl` = 3rem x `type_display_scale` (`base.css:84`). Mobile uses `--type-mobile-ratio` (`type_mobile_size_ratio`).

| Trait | Sartor setting id / token that reproduces it | Needs new markup/CSS? |
|---|---|---|
| T1 warm ground, soft ink | `color_schemes` roles `background`, `text`, `subtext`, `background_2`, `border`, `form_bg` (section 4). Sartor `--color-surface` becomes `#FFFFFF` while text keeps 4.5:1 on white (`DESIGN.md` Tokens) | No |
| T2 one accent | `color_schemes.*.button`, `accent`, `sale_price`; `badge_sale_scheme`, `badge_sold_out_scheme` (scheme picks). `DESIGN.md` already limits crimson to CTA + sale | No |
| T3 big light serif headline | `type_font_heading` (verified ids: `newsreader_n3`, `trirong_n2`, `instrument_serif_n4`, `geist_n6`), `type_display_scale` (150 -> 72 px, 180 -> 86 px, max 300), `type_h1_scale` (200 -> 72 px), `type_h2_scale` (135 -> 40 px, 160 -> 48 px), `type_h1_line_height` / `type_h2_line_height` (100-110), `type_h1_tracking` / `type_h2_tracking` (0 to -10; value / 1000 em) | **Italic emphasis word**: `inline_richtext` already allows `<em>` in `hero.heading` and `image-with-text.heading`, but there is no rule or italic face for it. Needs a small `.heading em { font-style: italic }` rule and an italic font face (`head-fonts.liquid` emits weight faces only per `DESIGN.md`; whether an italic face is emitted is `[INFERENCE]`, verify before relying) |
| T4 tracked uppercase eyebrow | `type_font_subheading`, `type_h6_case` = uppercase, `type_h6_scale` (75 -> 12 px), `type_h6_tracking`; `.section-subheading` already uppercase + 0.1em (`base.css:63`); tokens `--eyebrow-size/weight/tracking` | No |
| T5 14 px body | `type_scale_body` (range 100-130, so 14 px body needs the root/`--font-sm` route: `p` is `--font-base` 16 px at >=750 per `base.css:46`) | The 14 px desktop body is **not reachable by a setting** (min scale 100 = 16 px). Needs a token change if wanted; workspace rule says mobile root 14 px, desktop unchanged |
| T6 flat, square | `button_corner_radius 0`, `input_corner_radius 0`, `media_frame_corner_radius 0`, `product_card_style standard`, `product_card_stroke_width 0`, `product_card_shadow_alpha 0`, `content_box_*` 0, `variant_chip_corner_radius` (Dwell/Vessel 0; Sartor 40), `badge_corner` (Dwell 0, Vessel 2; Sartor 40) | No (already the Sartor preset; only badge and variant corners differ) |
| T7 4:5 / 1:1 product images on neutral tile | `image_ratio` on `featured-collection`, `main-collection`, `collection-list` (options portrait/square/landscape/adapt) and `main-product.media_aspect_ratio`; `product_card_text_align` (center for Vessel); `card_hover_image_enable` | **4:5 is missing**: `.image-ratio--portrait { aspect-ratio: 2/3 }` (`product-card.liquid:331`). Need a 4:5 option (or change portrait). A neutral image tile backdrop is not exposed as a setting; check `product-card.liquid` before assuming `[INFERENCE]` |
| T8 hero 568-900 px, soft gradient, one link | `hero.height_desktop` (vh, e.g. 70-100), `height_mobile`, `overlay_opacity`, `overlay_gradient`, `content_position`, `text_align`, `button_label_2` blank; `slideshow.height_desktop 85` today | No for the hero. Copy rule: one headline + one button (hero currently offers two buttons and a countdown) |
| T9 transparent header, sticky scroll-up | `header.transparent_home`, `transparent_text_color`, `transparent_scrim_color`, `transparent_logo`, `sticky_mode` (always / scroll-up / ...), `logo_position` (left/center), `menu_placement` (inline/below) | No. Dwell look = `logo_position center` + `menu_placement below`; Vessel look = `logo_position left` + `inline` + `transparent_home` |
| T10 few home sections | `templates/index.json` order and `enabled/disabled`; preset listing templates under `listings/preset/templates/` | Content edit, not code. 14 -> ~6-8 sections |
| T11 zero-gap full-bleed collection tiles | `collection-list.layout` = `grid` / `editorial` (exists), `columns_desktop 3`, `columns_mobile 1`, `image_ratio portrait` | **Gap is global only**: `layout_grid_gap_x` min 4, shared with product grids. A per-section gap (0) needs a new setting and token override |
| T12 vertical rhythm | `layout_section_gap` (0-100, default 0), per-section `padding_top_desktop` etc., tokens `--section-head-gap` 2 rem, `--space-6xl` 4 rem, `--space-7xl` 6 rem; `layout_grid_gap_y` | No (set padding 48-80 per section in the preset templates) |
| T13 hotspot lifestyle image, flat colour story band | `banner-hotspots`, `image-with-text` (`image_position`, `color_scheme`), `featured-product.image_position`, scheme-4 band | No; needs a 50-80 vh media height setting on `image-with-text` (not in its schema list above) |
| T14 tinted footer, underline newsletter | `footer.color_scheme`, `footer_logo`, `footer_logo_width` (max 300), footer newsletter block | **Underline newsletter field** is a new input style; Sartor field uses `--inputs-border` full box (`DESIGN.md` "Input border") |
| T15 quiet motion | `motion_hover_effect default` (<= 3 % zoom per `DESIGN.md` "Cards"), tokens `--transition-fast 150ms`, `--transition-base 300ms`, `--ease-out`; `motion_reveal_on_scroll` | No. Reference 125-200 ms; Sartor 150-300 ms, already in the same range |
| T16 PDP | `main-product.media_aspect_ratio`, `thumbnail_position`, `media_layout`, `media_grid_columns`, `enable_lightbox`, `product_sticky_addtocart` | 4:5 gallery shares the missing 4:5 ratio |

---

## 4. Three palette + type directions for a furniture-grade preset

Constraints honoured: at most two accent colours (the `button`/`accent` colour and a `sale_price` colour); Sartor scheme roles 1..4 with `button`, `background`, `text`. All font ids below are ones that appear in the local references' `settings_data.json` (verified valid picker ids). Contrast numbers are computed (WCAG relative luminance). Sartor additionally lifts input borders to 3.1:1 automatically (`DESIGN.md`), so `border` values stay decorative.

Common settings for all three (square, flat, quiet; extends Sartor preset): `button_corner_radius 0`, `input_corner_radius 0`, `media_frame_corner_radius 0`, `product_card_style standard`, `product_card_*` stroke/shadow/corner 0, `panel_shadow_alpha 10`, `layout_page_width 1600`, `layout_section_gap 0` with per-section padding 48-80, `motion_hover_effect default`, `type_mobile_size_ratio 40`.

### Direction A - "Hearth" (Dwell-derived: warm serif, clay accent)

Fonts: `type_font_heading newsreader_n3`, `type_font_subheading red_hat_display_n5`, `type_font_body newsreader_n4`. Scale: `type_display_scale 150` (72 px hero), `type_h2_scale 135` (40 px), `type_h3_scale 100` (24 px), `type_h4_scale 90`, `type_h5_scale 90`, `type_h6_scale 75` with `type_h6_case uppercase`, `type_h6_tracking 100`, `type_h1_line_height 110`, `type_h2_line_height 110`, `type_h1_tracking 0`, `type_h2_tracking 0`. Corners: `badge_corner 0`, `variant_chip_corner_radius 0`. `logo_position center`, `menu_placement below`, `sticky_mode` never, hairline under the header (border `#E4DDD3`). `product_card_text_align center`. Hero `height_desktop 65`.

Accents (2): clay `#7D5449` (buttons, bands) and brick `#9A3F2B` (sale price only).

| Scheme | background | background_2 | text | subtext | border | button | button_label | secondary_button / border / label | form_bg / form_text | color_price | sale_price | accent | Contrast checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `#FAF7F2` | `#EFE9E1` | `#2B2724` | `#6A625A` | `#E4DDD3` | `#7D5449` | `#FFFFFF` | `#FAF7F2` / `#2B2724` / `#2B2724` | `#FFFFFF` / `#2B2724` | `#2B2724` | `#9A3F2B` | `#7D5449` | text 13.85, subtext 5.60 (4.96 on bg_2), button 6.49, sale 6.30 |
| 2 | `#FFFFFF` | `#FAF7F2` | `#2B2724` | `#6A625A` | `#E9E4E0` | `#2B2724` | `#FFFFFF` | `#FFFFFF` / `#2B2724` / `#2B2724` | `#FAF7F2` / `#2B2724` | `#2B2724` | `#9A3F2B` | `#7D5449` | text 14.81, subtext 5.99 |
| 3 | `#2E2926` | `#3A3430` | `#F4EFE8` | `#B8AFA5` | `#4A433E` | `#D9B8A0` | `#2E2926` | `#2E2926` / `#F4EFE8` / `#F4EFE8` | `#3A3430` / `#F4EFE8` | `#F4EFE8` | `#E3A38F` | `#D9B8A0` | text 12.56, subtext 6.65, button 7.74, sale 6.78 |
| 4 | `#7D5449` | `#6E4940` | `#FAF7F2` | `#EADBD2` | `#92695E` | `#FAF7F2` | `#5C3B32` | `#7D5449` / `#FAF7F2` / `#FAF7F2` | `#6E4940` / `#FAF7F2` | `#FAF7F2` | `#FAF7F2` | `#FAF7F2` | text 6.07, subtext 4.81, button 9.24 |

Use: scheme-1 page, scheme-2 alternate only when meaningful, scheme-3 footer or testimonial, scheme-4 the single "story" band. Footer on a stone tint `#E9E4E0` needs a custom scheme (not defined here), otherwise scheme-2.

### Direction B - "Atelier Air" (Vessel-derived: airy, ultra-light serif, almost no colour)

Fonts: `type_font_heading trirong_n2`, `type_font_subheading red_hat_display_n6`, `type_font_body red_hat_display_n4`. Scale: `type_display_scale 180` (86 px, Vessel 88), `type_h1_scale 240` (86 px), `type_h2_scale 160` (48 px), `type_h3_scale 130` (31 px), `type_h4_scale 100`, `type_h5_scale 75` uppercase, `type_h6_scale 75`, `type_h1_line_height 100`, `type_h2_line_height 110`, `type_h1_tracking 0`. Risk: weight 200 at small sizes is thin; keep it to >= 32 px (h3 and up) and use body/subheading faces below that. `layout_page_width 1600`; `badge_corner 2`; `variant_chip_corner_radius 0`; `card_hover_effect` equivalent = `motion_hover_effect default`; `product_card_text_align center`. Header `transparent_home on`, `sticky_mode scroll-up`, `logo_position left`, `menu_placement inline`. Hero `height_desktop 80`. Collections as `layout editorial` or `grid` 3 col.

Accents (2): ink `#141414` for primary buttons and walnut `#8A5A38` for scheme-4 band and sale-adjacent emphasis; sale price `#9B3D2A`.

| Scheme | background | background_2 | text | subtext | border | button | button_label | secondary_button / border / label | form_bg / form_text | color_price | sale_price | accent | Contrast checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `#F9F8F6` | `#ECEBE9` | `#141414` | `#5F5D58` | `#DAD8D3` | `#141414` | `#F9F8F6` | `#F9F8F6` / `#141414` / `#141414` | `#FFFFFF` / `#141414` | `#141414` | `#9B3D2A` | `#8A5A38` | text 17.36, subtext 6.20 (5.52 on bg_2), sale 6.39, walnut 5.50 |
| 2 | `#FFFFFF` | `#F9F8F6` | `#141414` | `#5F5D58` | `#E7E5E0` | `#141414` | `#FFFFFF` | `#FFFFFF` / `#141414` / `#141414` | `#F9F8F6` / `#141414` | `#141414` | `#9B3D2A` | `#8A5A38` | not separately computed (white vs scheme-1 pair; text/white is higher than 17.36) `[INFERENCE]` |
| 3 | `#1C1B19` | `#262522` | `#F9F8F6` | `#AEABA4` | `#3A3834` | `#F9F8F6` | `#1C1B19` | `#1C1B19` / `#F9F8F6` / `#F9F8F6` | `#262522` / `#F9F8F6` | `#F9F8F6` | `#E0A08C` | `#F9F8F6` | text 16.22, subtext 7.51, sale 7.85 |
| 4 | `#8A5A38` | `#7A4F31` | `#F9F8F6` | `#EBDDD0` | `#A07050` | `#F9F8F6` | `#5E3B22` | `#8A5A38` / `#F9F8F6` / `#F9F8F6` | `#7A4F31` / `#F9F8F6` | `#F9F8F6` | `#F9F8F6` | `#F9F8F6` | text 5.50, button label 9.31. Subtext `#EBDDD0` not computed `[INFERENCE]`, verify |

### Direction C - "Nordic Sage" (Tinker/Fabric-derived: serif display + clean sans, sage)

Fonts: `type_font_heading instrument_serif_n4`, `type_font_subheading instrument_sans_n4`, `type_font_body instrument_sans_n4`. Scale: `type_display_scale 150` (72 px), `type_h1_scale 200`, `type_h2_scale 160` (48 px), `type_h3_scale 135` (32 px), `type_h4_scale 120` (24 px), `type_h5_scale 100`, `type_h6_scale 75` uppercase, line heights 105-115, tracking 0. Corners: `button_corner_radius 0`, `variant_chip_corner_radius 0`, `badge_corner 2`, `media_frame_corner_radius 0`. Optional softer sub-variant (Tinker): `product_card_corner_radius 10`, `media_frame_corner_radius 10`, `input_corner_radius 4`. Header `transparent_home on`, `sticky_mode scroll-up`, `logo_position left`, `menu_placement inline`. Hero `height_desktop 75`. Collections `layout editorial` (bento, Tinker).

Accents (2): deep olive `#2F3A24` (primary button) and sage `#C3CCA6` (band and button on dark); sale price `#B4452F` is a status colour. If a stricter two-accent count is wanted, drop the sale colour to ink and mark sale with the badge only.

| Scheme | background | background_2 | text | subtext | border | button | button_label | secondary_button / border / label | form_bg / form_text | color_price | sale_price | accent | Contrast checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `#FFFFFF` | `#F1EDE8` | `#030302` | `#5A5853` | `#D3CEC5` | `#2F3A24` | `#FFFFFF` | `#FFFFFF` / `#030302` / `#030302` | `#F1EDE8` / `#030302` | `#030302` | `#B4452F` | `#2F3A24` | text 20.63, subtext 7.11 (6.10 on bg_2), button 11.99, sale 5.48 |
| 2 | `#F1EDE8` | `#FFFFFF` | `#030302` | `#5A5853` | `#D3CEC5` | `#030302` | `#F1EDE8` | `#F1EDE8` / `#030302` / `#030302` | `#FFFFFF` / `#030302` | `#030302` | `#B4452F` | `#2F3A24` | text 17.70 |
| 3 | `#23271C` | `#2D3224` | `#F1EDE8` | `#B5B8A6` | `#3F4631` | `#C3CCA6` | `#23271C` | `#23271C` / `#F1EDE8` / `#F1EDE8` | `#2D3224` / `#F1EDE8` | `#F1EDE8` | `#E8A08D` | `#C3CCA6` | text 13.07, subtext 7.52, button 9.07, sale 7.14 |
| 4 | `#C3CCA6` | `#B3BD94` | `#23271C` | `#3F4631` | `#A5AF88` | `#23271C` | `#F1EDE8` | `#C3CCA6` / `#23271C` / `#23271C` | `#B3BD94` / `#23271C` | `#23271C` | `#23271C` | `#23271C` | text 9.07, subtext 5.87, button 13.07 |

Note: sage `#C3CCA6` on white is 1.68:1, so it is a surface or a button fill with dark label only, never text or line.

### Pick guidance (opinion, not measured)

- Closest to a furniture store with strong lifestyle photography and a quiet brand: **A** (matches Dwell live, only one warm accent, serif + italic emphasis is the most recognisable "home" signal).
- Closest to a minimalist object/decor brand with cut-out product shots: **B**; check 200-weight legibility on mobile before shipping.
- Most distinct from the existing Sartor/Yarrow presets and easy on catalogue photos with wood and green: **C** (Yarrow is already green and rounded; C differs by square corners, serif display, oatmeal ground).

---

## 5. Gaps to verify before implementation

1. Whether `snippets/head-fonts.liquid` emits an italic face for `newsreader_n3`/`trirong_n2`; without it the italic emphasis is a browser-synthesised slant (`[INFERENCE]`).
2. Desktop body size: Sartor `p` is 16 px at >= 750 (`base.css:46`); references use 14 px. A 14 px body is not reachable by `type_scale_body` (min 100).
3. 4:5 image ratio is absent (`portrait` is 2:3). All furniture references use 4:5 or 1:1.
4. Collection tiles need a gap of 0 independent of `layout_grid_gap_x`.
5. Home template is 14 sections; target 6-8 for a furniture preset, set via preset listing templates.
6. Live Savor, Tinker, Pitch and all paid-theme demos were not measured.

Status: DONE_WITH_CONCERNS
