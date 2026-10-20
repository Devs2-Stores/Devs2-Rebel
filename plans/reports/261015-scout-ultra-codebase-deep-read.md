# Scout Report (ultra) - Rebel: codebase deep read 2026-10-15

Read-only verification. I checked every High finding and every single-candidate finding on disk. For the `variant.image` question I also read Shopify's documented variant shape.

## Verdict

- **One High defect is real and was under-rated.** `assets/product.js:271` and `:841-842` read `variant.image`. `product | json` variants do not carry that key (see the dedicated answer below), so on the main PDP the gallery and the sticky-bar image never follow variant selection. Raised by B, C, D. E rated it Low and A missed it.
- **F1 is confirmed in 4 selector families** (product card, list view, collection card, article card). It affects every consumer of the three card snippets. The "inert subgrid" claim in A, B and D is only half right: the subgrid rule is live where a card is a direct grid child (see the F1/F2 context map).
- **F2 is confirmed.** It only fires when the collection has an image and `collection_image.show_description` is on (the default). The hero truncates twice (`truncatewords: 30`, then a 3-line clamp) and has no read-more. The existing description-block toggle is document-delegated, so it can be reused without new JS.
- **New Medium gaps beyond F1/F2:**
  - The PDP unit price is never refreshed on variant change.
  - Quick view loads no model-viewer assets, so its 3D media is likely non-interactive.
  - RTE styling diverges across product, article, page and collection contexts.
  - The YouTube IFrame API script is injected from an external host.
- **Reviewer-claim corrections:**
  - E's Medium on `customer_account_menu` is dropped, per the contract's resolved decision.
  - The `https:` prefix on OG/JSON-LD and the `preconnect` hints are not "asset links", so they are dropped.
  - `.product-card--special`, `.line-clamp-N` and the `.card__content__title` rule are dead CSS. They are not the cause of any visible clip.
- **Stale items confirmed fixed in the repo.** Search filters are in `main-search.liquid:122-126`. Featured product and quick view render `product.media`. The footer `link_list` has `"default": "footer"`. Pickup and installments blocks are in `templates/product.json`.
- **Best overall candidate is B.** It found the High and the most Mediums. D is the broadest on T3/T4 but spends many rows on nits.

## `variant.image` answer

This is a real defect. It was verified in four steps.

1. **Shopify's documented `product | json` output.** The `json` filter doc shows variant objects with `featured_image` (null in the example) and no `image` key. It also shows no `featured_media` key on the variant. Source: https://shopify.dev/docs/api/liquid/filters/json.md
2. **The Liquid variant object is a different shape.** The Liquid `variant` object does list `image` and `featured_image` as the same value, and also `featured_media`. That is the Liquid object, not the JSON serialisation. Source: https://shopify.dev/docs/api/liquid/objects/variant.md
3. **The theme's variants come from the JSON serialisation.** They come from `{{ product | json }}` (`snippets/product-variant-picker.liquid:11`, `snippets/head-script.liquid:88`) via `variant-picker.js:45` (`this.variants = product.variants`). The matched object is dispatched unchanged as the event `detail` (`variant-picker.js:202-203`).
4. **Nothing adds `image` in between.** A grep of `assets/` shows only `product.js:271`, `:841-842` and `quickview-modal.js:80` using `variant.image`. The quick view falls back to `featured_media || featured_image || image`, but the PDP does not.

Result: `updateFeaturedImage(undefined)` returns at `product.js:327`, so the gallery never moves. The sticky bar check `variant.image` (`:841`) is always false.

**Fix direction:**
- Read `variant.featured_image` first, then `variant.featured_media`, then `variant.image`.
- Match slides by filename, as `updateFeaturedImage` already does (`product.js:341-342`).
- Do not rely on `featured_image.id` equalling a slide `data-media-id`. The slides carry the media id (`main-product.liquid:14`), and the image id differs from the media id.
- The `matched` event detail for the quick view is unaffected.

**Severity:** High. It breaks mirror L265, "Variant images must be shown when the associated variant is selected", on the main PDP.

## Candidate ranking

| Cand | Coverage /20 | Evidence /20 | Density /20 | Honesty /20 | Total /80 | Rationale |
|---|---|---|---|---|---|---|
| B | 18 | 17 | 17 | 18 | **70** | Found the High, unit-price staleness, RTE divergence, the cart `final_price` gap and the terminology gaps, all verified on disk. Marks inferences. Missed the quick view 3D and the label/`for` gaps. |
| D | 18 | 16 | 15 | 18 | **67** | Broadest T3/T4 sweep. Found the High, the newsletter-modal feedback gap, the iframe title and the label/`for` gaps, all verified. Overreaches on the `https:` prefix and some nits. Missed unit price and quick view 3D. |
| C | 12 | 16 | 16 | 19 | **63** | Found the High, unit price and quick view 3D. Honest about its own T3/T4 gaps. Rated 3D High, which is too high. Thin outside T2. |
| A | 15 | 17 | 12 | 16 | **60** | Best T5 map and the F2b find. Verified the stale items. Missed the High, unit price and RTE. Claimed the subgrid is inert everywhere, which is wrong for direct grid children. |
| E | 13 | 14 | 10 | 15 | **52** | Raised `customer_account_menu` as Medium against the contract. Rated the High as Low. Said the mirror's terminology tables were "not visible" although they sit at L487-520. F1 map is vague. A few valid nits. |

## Unified findings

| ID | Requirement (mirror line) | Sev | Evidence file:line | Why it fails | Fix direction | Raised by |
|---|---|---|---|---|---|---|
| U-01 | L265 "Variant images must be shown when the associated variant is selected"; L270 callback. | **High** | `assets/product.js:271`, `:326-327`, `:841-842`. Source `snippets/product-variant-picker.liquid:11`, `assets/variant-picker.js:45,202-203`. Quick view reads the wider chain at `assets/quickview-modal.js:80`. | `variant.image` is absent from `product \| json` variants, so the PDP gallery and sticky image never change. | Read `featured_image`, then `featured_media`, then `image`. Match slides by filename, not by image id. | B, C, D, E (Low) |
| U-02 | L308, L320, L355 "(not truncated)" (F1). | Medium | `assets/product-card.css:154-162`; `assets/collection.css:894-897`; `assets/list-collections.css:150-159`; `assets/article-card.css:53-62`. Markup `snippets/product-card.liquid:147-149`, `snippets/collection-card.liquid:51`, `snippets/article-card.liquid:54-56`. | CSS cuts titles to 2 lines. The full text is only in the `title=` attribute (product card, article card) or not at all (collection card). | Remove the clamp and overflow rules. Keep or rework the `min-height` grid alignment (see context map). | A, B, C, D, E |
| U-03 | L303 `collection.description` (F2). | Medium | `sections/main-collection.liquid:35-44`, `:713-717` (default true); `templates/collection.json:19-23`; `snippets/collection-hero.liquid:63-67`; `assets/collection.css:63-71`. | With a collection image and defaults, the description is 30-word, tag-stripped and 3-line clamped, with no read-more. | Reuse the `data-desc-toggle` pattern in the hero and drop the hero clamp. See the context map. | A, B, C, D, E |
| U-04 | L399 RTE consistency; L303. | Low | `sections/main-collection.liquid:123-143`, `:131`. Summary uses `strip_html`. The `.rte` full text exists only when the word count is above 30. | A description of 30 words or fewer loses links, headings and lists. | Render short descriptions through `.collection-desc__rte.rte`. | A |
| U-05 | L168-176 unit pricing (product page); L270 callback. | Medium | `blocks/price.liquid:43-47` renders the unit price server-side from `selected_variant`. `assets/product.js:426-452` `updatePrice` handles price, compare and sale only. A grep for `unit` in `product.js`, `variant-picker.js` and `quickview-modal.js` finds nothing. | After a variant change the unit price is stale. If the first variant has none, the node is never rendered. | Always render a `data-product-unit-price` node. Update it from fresh data. The JSON variant has no `unit_price` per the filter doc, so use the Section Rendering API or emit the values separately. | B, C |
| U-06 | L153 "…featured product section, and product forms such as quick view"; L276. | Medium [INFERENCE on runtime] | `templates/product.quickview.liquid:23-30,124-128`; `snippets/product-media-item.liquid:66-69` (`model_viewer_tag`, XR button hidden by default). The model-viewer UI is loaded only at `sections/main-product.liquid:101-107` and `sections/featured-product.liquid:111-117`. `assets/quickview-modal.js:186` injects the HTML with `innerHTML`, so scripts do not run. | Video media works in quick view. A 3D model renders without model-viewer UI or XR loading. | Load the `model-viewer-ui` and XR assets for quick view, or load them on demand. | A (Low-Med), C (High) |
| U-07 | L399 "RTE-generated content must be consistent (h1-h6, blockquotes, ul, ol) across all templates". | Medium [INFERENCE on render] | `assets/reset.css:108-112` (`ul`, `ol` get `list-style:none`). Restored only in `assets/article.css:122-126` and `assets/page.css:92-98`. `assets/product.css:319-326` gives product descriptions ✓ bullets and no `ol` numbers. `assets/collection.css:1141` and `assets/theme.css:159-171` give collection descriptions only font size and tables. | The same `<ul>` or `<ol>` looks different on product, article, page and collection, and loses bullets or numbers in some. | Add one shared `.rte` list/heading/blockquote ruleset and use it in all four contexts. | B, D |
| U-08 | L399 "Scripts … hosted on Shopify's servers, with the exception of approved third-party libraries". | Medium (open) | `assets/product.js:623-626` injects `https://www.youtube.com/iframe_api` whenever the PDP has external video. | An external script host, and a hard-coded `https`. The mirror gives no approved-library list. | Drop the IFrame API and use the iframe from `external_video_tag`, or confirm the library is approved. | A, B, C, D |
| U-09 | L479 settings must follow text style and terminology; L487 numbered options; L520 ampersands. | Low | `locales/en.default.schema.json:359,463,851,1272,1362,1773,…` ("Title", "Panel title"); `:466,1770,1948` ("Subtitle"); `:2344,2417` ("Before/after slider"); `:1135` ("Range slider"); `:1842-1884` ("Card 1 title"); `:3939-3948`; `:758` ("Enable announcement bar"); `:782,1592,1719` ("Menu"). | The mirror terminology table forbids title, sub-title, slider, enable-for-show and menu. Numbered options are discouraged. | Do a mechanical relabel (heading, subheading, slideshow, descriptive names, show/enable). Keep "Search & Discovery" as a proper name. | B, D, E (partial) |
| U-10 | L457 "Form inputs must have a unique ID, and labels with `for` attributes that match the input ID". | Low (literal) | `blocks/quantity_selector.liquid:17` (label with no `for`; input id is in `snippets/quantity-selector.liquid:53`); `sections/newsletter.liquid:39-46` and `blocks/back_in_stock.liquid:30-37` (inputs with `aria-label` only); `snippets/newsletter-modal.liquid:26-31` (wrapping label, no id). | The inputs have accessible names, but they do not match the literal id + `for` rule. | Add ids and matching `for`. | D |
| U-11 | L329-335 cart must show `final_price`. | Low (literal) | `snippets/cart-line-price.liquid:7-10` outputs `final_line_price`, `original_line_price` and `unit_price` only. `.final_price` appears only at `sections/main-customers-order.liquid:145-149`. | The cart never shows the per-item `final_price`. | Show `item.final_price` next to the line total. | B |
| U-12 | §17 responsive images. | Low | `sections/hero.liquid:11-12,56-62,94-111` renders `<img src="{{ custom_url }}">` with fixed width and height and no `srcset`. The setting is `custom_image_url` at `:667-676`. | The URL override bypasses `image_url` and `image_tag`. It is opt-in and off by default. | Remove the override or document it. | C, D |
| U-13 | L137 newsletter signup (UX). | Low | `snippets/newsletter-modal.liquid:24-37` has no success or error block. `assets/newsletter-modal.js:67-74` closes the popup on submit and stores the flag. The footer and `sections/newsletter.liquid` do give feedback. | The modal closes before the result and never shows success or error. | Show success and error like the footer. | D |
| U-14 | L479 "Don't use … demo store content as a placeholder". | Low | `sections/icon-boxes.liquid:320`, `sections/scrolling-text.liquid:203`, `sections/trust-badges.liquid:194`, `blocks/icon_with_text.liquid:89` (all "$50" shipping copy); `sections/contact-form.liquid:432` (`hello@example.com`); `config/settings_schema.json:1707` ("Shopee"). | Schema defaults carry store-specific copy in a fixed currency. | Use how-to-use copy. | D, E |
| U-15 | L399 "Hard-defining `http`/`https` isn't permitted". | Low (open) | `sections/video.liquid:90` hard-codes `https://i.ytimg.com/…` as an `<img src>`. | An asset link with a hard-coded scheme. The iframe URLs at `:160,:162` are embeds. | Use the scheme-free form or an uploaded poster. | D, E |
| U-16 | L457 valid HTML / accessibility. | Low | `sections/video.liquid:158-166` builds an iframe with no `title`. | The iframe has no accessible name. | Set `iframe.title`. | D |
| U-17 | Nit (not a mirror MUST). Dead code. | Nit | `assets/product-card.css:259-285` (`.product-card--special`, no Liquid emits it); `assets/theme.css:8-28,294-302` (`.line-clamp-N` with fixed `height`, `.card__content__title`); `assets/collection.css:113-128` (`.collection-template__short-description`); `sections/main-blog.liquid:49,69-72` (`blog.description`, which the blog object does not have); `assets/product.js:598` (`initBackInStock() {}`). | Code with no consumer. | Delete. | B, C, D |
| U-18 | Nit. Orphan legacy settings. | Nit | `snippets/megamenu.liquid:14-18,29-60` reads `settings.megamenu_*` that no schema declares, and uses non-existent `megamenu_image_N.jpg` assets. `snippets/shop-social.liquid:3,58-62` reads `social_linkedin_link`, which is absent from `config/settings_schema.json`. `sections/footer.liquid:28-52` does not render Pinterest although the schema has `social_pinterest_link`. `config/settings_data.json:210` stores `recaptcha_site_key` with no schema entry. | Branches that can never be enabled, and a stored key with no setting. | Remove them, or declare the settings. | D, E |
| U-19 | Nit. Vietnamese in shipped code. | Nit | `assets/product.js:408` fallback `'Mua ngay'`; `snippets/product-card.liquid:2-3` and other doc and comment lines. | The fallback appears only if `themeConfig.strings.variant.buyNow` is missing. | Use English. | B, C |
| U-20 | Tip, mirror L815. Demo resources in shipped JSON. | Nit | `sections/header-group.json:12` (`shopify://collections/new-arrivals`); `templates/index.json` collection handles. | The mirror says JSON files should not carry demo-store resources. | Leave empty, or accept as demo content. See Unresolved questions. | B, D |
| U-21 | Nit. Accessibility without JS. | Nit | `sections/main-search.liquid:92-94,145,181,197` panels point `aria-labelledby` at tab ids. `assets/search.js:56` assigns the ids at runtime. | Without JS the ids do not exist, but tabs do not work without JS anyway. | Put the ids in Liquid. | D, E |
| U-22 | Nit. | Nit | `assets/product.css:658-666` `.product-sticky-add__title` uses nowrap and ellipsis. The real `h1` is unclamped (`blocks/title.liquid:7`). | Secondary UI only. | Optionally allow wrapping. | C |
| U-23 | Nit. Text consistency. | Nit | `locales/en.default.schema.json:2528` (`"View all"`), `:3221` (`'View all'`), `:3571` (`'View full details'`). `blocks/back_in_stock.liquid:15,23` use emoji with no `aria-hidden`. | Mixed quote style, and emoji read aloud. | Standardise. | D, E |

## F1/F2 context map

### F1: what a fix must touch

**CSS anchors**
- `assets/product-card.css:154-162`: `.product-card__title a` has `overflow:hidden`, `display:-webkit-box`, `-webkit-box-orient`, `-webkit-line-clamp:2`, `min-height:2.7em`. There is no unprefixed `line-clamp` here.
- `assets/collection.css:894-898`: `.product-cards--list .product-card__title a` has clamp 2 and `height:auto`. `assets/collection.js:721-724` toggles `.product-cards--list`.
- `assets/list-collections.css:150-159`: `.collection-card__title` has clamp 2 (prefixed and standard). `:71-73` raises the font size for the featured card, and `:145-148` makes `.collection-card__text` `flex:1; min-width:0`.
- `assets/article-card.css:53-62`: `.article-card__title` has clamp 2. `:63-69` has the `a` colour rules and a `:has(a:focus-visible)` outline.
- `assets/blog.css:197-203`: grid view pairs `min-height:2.7em` on the title and `4.65em` on the description to equalise rows.
- Leave `product-card.css:259-285` (dead, `.product-card--special`) alone, or delete it. The clamp-1 override there is not live.

**Markup anchors**
- `snippets/product-card.liquid:147-149`: `<h3 class="product-card__title"><a title=…>`.
- `snippets/collection-card.liquid:51`: `<h3 class="collection-card__title">`. It has no link and no `title=`.
- `snippets/article-card.liquid:54-56`: `<h3 class="article-card__title"><a title=…>`.

**Consumers**
- `product-card`:
  - `sections/main-collection.liquid:275` (in an `<li class="product-cards__item">`)
  - `sections/main-search.liquid:163,248`
  - `sections/product-recommendations.liquid:24`
  - `sections/complementary-products.liquid:45`
  - `sections/featured-collection.liquid:69` (in a `.swiper-slide`) and `:89`
  - `sections/cart-recommendations.liquid:23`
  - `sections/marquee-products.liquid:45,53` (item width fixed at 220px)
  - `snippets/collection-best.liquid:63`
  - `sections/product-card-ajax.liquid:8` and `templates/product.card.liquid:2`
- `collection-card`: `sections/main-list-collections.liquid:77,112`.
- `article-card`: `sections/main-blog.liquid:182`, `sections/main-search.liquid:187`.

**Alignment and regression traps**
1. **Row equalisation comes from `height:100%` and flex, not from the title.** `.product-card` and `.product-card__wrapper` have `height:100%` (`product-card.css:3,7`). `.product-card__content` is `flex:1` (`:134-139`) and `.product-card__price` has `margin-top:auto` (`:185-186`). Removing the clamp only makes a tall title grow its grid row. Keep `min-height:2.7em` as a two-line reserve, or drop it.
2. **The subgrid rule is live where a card is a direct grid child.** `product-card.css:337-348` sets `.product-card { display:grid; grid-row:span 5; grid-template-rows:subgrid }`. Its targets (`__media`, `__title`, and so on) sit under `<article class="product-card__wrapper">`, not directly under `.product-card`. It is inert when a card sits inside an `li` or a `div`: collection grid, search, recommendations, complementary products and marquee. It is live when the card is a direct grid child: `.section-featured-collection__grid` (`sections/featured-collection.liquid:87-96`, grid at `:223-233`) and `.cart-recommendations__grid` (`sections/cart-recommendations.liquid`, grid at `assets/cart-recommendations.css:21-35`). In those two contexts the single `<article>` falls into subgrid row 1, and rows 2-5 stay empty. [INFERENCE] Check this at runtime before assuming title height affects row alignment there.
3. **The list view needs the override removed too.** `collection.css:894-898` is the only `height:` rule on titles. Removing only the base clamp leaves list view clipped.
4. **The article stretched link and focus ring are fine.** `article-card.css:37` is `a::after{position:absolute; inset:0}` and the title is not positioned, so `overflow:hidden` is not what keeps it working. The `:has(a:focus-visible)` outline simply grows with the text.
5. **Swiper contexts.** Slide height for `featured-collection` (`.swiper-slide`), `product-recommendations` and `collection-best` was not read. Confirm the slides stretch (`height:auto`) so `height:100%` still resolves, and read the marquee inline CSS (220px items) before removing the clamp.
6. **No DESIGN.md rule blocks the fix.** `DESIGN.md:159` says "Wrap long article navigation titles in full" over a two-line clamp. A grep for subgrid, equal-height, line-clamp and card-title in `DESIGN.md`, `REVIEW.md` and `AGENTS.md` finds no other rule.
7. **Do not touch these.** `article-card__description` (clamp 3), `blog-template__description-content` (clamp 4), `blog-sidebar__recent-post-title`, `search-modal.css` titles and `customer.css` (legacy). All were judged acceptable in the packet.

### F2: what a fix must touch

**Flow**
- Template default: `templates/collection.json:19-23` enables `collection_image` with only `enabled:true`. The schema default `show_description: true` is at `sections/main-collection.liquid:713-717`.
- Section flag: `main-collection.liquid:35-44` sets `hero_show_description` only when the block is enabled, `collection.image != blank` and `show_description` is on. `:49-52` sets `show_collection_description` only on page 1.
- Hero snippet: `snippets/collection-hero.liquid:63-67` outputs `strip_html | truncatewords: 30`. It recomputes `hero_show_description` from `banner_block.settings.show_description` (`:22`). It gets `show_collection_description` only as a render parameter (`main-collection.liquid:63-68`).
- Description block: `main-collection.liquid:119-147` skips when `hero_show_description` is true.
- CSS: `.collection-hero__description` (`collection.css:63-71`) has clamp 3. `.dark .collection-hero__description` (around `:83-91`) sets a colour only.

**Reusable toggle**
- Markup: `main-collection.liquid:129-143`. It has `.collection-desc[data-desc-toggle]`, `__summary`, `__full[hidden] > .collection-desc__rte.rte`, and `button[data-action="toggle-desc"]` with the `__toggle-more` and `__toggle-less` spans. The strings are `products.facets.read_more` and `products.facets.show_less`.
- JS: `assets/collection.js:798-815` is a click handler delegated on `document`. It is bound from `FacetFilters.connectedCallback` (`collection.js:53`) with `this.lifecycle.signal`. `<facet-filters>` always wraps the product area (`main-collection.liquid:206-336`), even with filtering off. No new JS is needed if the class names are kept.
- CSS: `assets/collection.css:1134-1157`. `.rte` table rules are at `assets/theme.css:159-171`.
- Test: `runs/e2e/facet-lifecycle.cjs:37-42` covers the toggle with a mock host (reported by C, not read here).

**Traps**
1. **Two truncations.** The hero truncates by Liquid (`truncatewords`) and by CSS (clamp 3). A fix must remove the clamp from the expandable part, or the expanded text stays clipped.
2. **Do not render the description twice.** The `description` block skips on `hero_show_description`. Keep that guard if the hero starts showing the full text.
3. **The toggle button lacks `aria-expanded` and `aria-controls`** (`main-collection.liquid:137-140`). Add them for any new hero button.
4. **Layout.** The hero is a `3fr 2fr` grid (`collection.css:13`) with a content panel, not an overlay. Expanding text grows the panel. `.collection-hero--small/medium/large` use `min-height`, so they will not clip.
5. **Contrast.** The hero text uses `--color-text-secondary` (`collection.css:63-66`), and the dark variant is `#9ca3af`. The expanded `.rte` must keep that contrast.
6. **List and heading styling.** An expanded description needs the shared RTE rules from U-07, or `<ul>` and `<ol>` render without markers (`reset.css:108-112`).
7. **Only page 1 shows it.** `show_collection_description` is page-1 only, and that is intended.

## Dropped or corrected claims

| Claim | Raised by | Decision | Evidence |
|---|---|---|---|
| Header `customer_account_menu` default `customer-account-main-menu` breaks the `link_list` rule (Medium). | E | **Dropped.** Resolved decision in the contract: the account-component docs prescribe this value. | `sections/header.liquid:92-95`. Mirror L479 wording is kept only as an Unresolved question. |
| `https:{{ … \| image_url }}` in OG/Twitter/JSON-LD breaks "protocol-relative". | D (U-12) | **Dropped.** OG tags and JSON-LD need absolute URLs, and the rule concerns asset links. | `snippets/head-meta-tags.liquid:65,68,90,115,146,217,231`. |
| `preconnect` hints with `https://cdn.shopify.com` and `fonts.shopifycdn.com`. | A (N-3), D | **Dropped.** They are resource hints, not asset links. | `snippets/head-stylesheets.liquid:6`, `snippets/head-fonts.liquid:8`. |
| Hero autoplay video has no pause control. | D | **Dropped.** A grep for "pause" in the mirror finds nothing. Hero video is `autoplay muted loop` at `sections/hero.liquid:83`. | It is not a mirror requirement. |
| `.line-clamp-N` fixed heights may be the F1 cause. | E | **Dropped.** The class has no consumer in sections, snippets, blocks, templates or layout. | `assets/theme.css:8-28`; grep of the consumer directories returned no matches. |
| "Subgrid in `product-card.css` is inert everywhere." | A, B, D | **Corrected.** It is live where a card is a direct grid child. | `featured-collection.liquid:87-96`; `cart-recommendations.css:21`. |
| "3D in quick view is High." | C | **Corrected to Medium.** It is a code-level inference. The runtime effect was not observed. | `product.quickview.liquid:23-30`. |
| "`variant.image` is Low." | E | **Corrected to High.** | The `json` filter doc; `product.js:271`. |
| "Stale gaps: search filters, `font_modify`, footer `link_list` default, pickup and installments, featured and quick view media." | memory | **Confirmed fixed**, not reopened. | `main-search.liquid:122-126`; `footer.liquid:324-327`; `featured-product.liquid:27-44`. |
| "Social placeholders." | E (open) | **Not a finding.** A grep for `"placeholder"` in `config/settings_schema.json` returns nothing, per D. | `config/settings_schema.json:1149-1185`. |

## Unresolved questions

1. Does the Theme Store treat the YouTube IFrame API script (`assets/product.js:625`) as an approved third-party library? The mirror gives no list.
2. Should hard-coded `https` thumbnail and embed hosts in `sections/video.liquid:90,160,162` count under mirror L399? The mirror does not say whether embeds are exempt.
3. Does a 3D model in quick view actually fail to load model-viewer? This needs a browser check. The code shows that no loader runs there.
4. U-07 (RTE divergence) is evidenced from CSS only. A render check across product, article, page and collection would confirm the visual gap.
5. For F2, should the hero keep its 30-word cut with a read-more, or show the full RTE? Both work with the existing toggle.
6. Should shipped JSON demo references (`sections/header-group.json:12`, the collection handles in `templates/index.json`) be treated as a tip or a requirement? Mirror L815 reads as a tip.
7. Mirror L479 wording on `link_list` defaults, versus the account-component docs, only matters if a reviewer reads L479 literally for `customer_account_menu`. Per the resolved decision, treat this as reviewer interpretation only.
8. Swiper slide heights in `featured-collection`, `product-recommendations` and `collection-best`, and the marquee inline CSS, were not read by anyone. This must be confirmed before the F1 fix.

## Controller post-verification (2026-10-15)

- **U-01 confirmed live.** On `http://127.0.0.1:9292/products/rebel-tactical-bomber-jacket` the page's `product | json` variants have keys `id, title, option1-3, sku, requires_shipping, taxable, featured_image, available, name, public_title, options, price, weight, compare_at_price, inventory_management, barcode, requires_selling_plan, selling_plan_allocations, quantity_rule`. There is no `image` and no `featured_media` key (0/8 variants). `assets/product.js:271` and `:841` read `variant.image`, so the gallery and sticky image never follow the variant. The demo variants also carry `featured_image: null` (0/8), so the defect cannot be seen on current demo data; it shows only once a merchant assigns variant images. Severity stays High (code-level Theme Store MUST, mirror L265).
- **F1 (U-02) reproduced live at 375x812.** `/collections/all`: 30 `.product-card__title a`, computed `-webkit-line-clamp: 2`; "High-Waisted Wide-Leg Pleated Wool Trousers with Pressed Front Crease, Side Adju..." has `scrollHeight > clientHeight` (clipped).
- **F2 (U-03) checked live.** `/collections/outerwear` renders `.collection-hero__description` (15 words, 67px = exactly 3 lines at 375). Any longer description is clipped by the 3-line clamp, and anything over 30 words is cut server-side. Demo collections have descriptions of 15 words or fewer, so the cut is not visible on current demo data.
- **F1 alignment trap confirmed on disk.** `.product-card__price { margin-top: auto }` (`assets/product-card.css:185-186`) inside a flex column (`:132-136`) with `height: 100%` (`:3,7`) keeps price rows aligned after un-clamping. `.article-card__button { margin-top: auto }` (`assets/article-card.css:100`) does the same for article cards.
- Label map (private): A=ScoutCandE, B=ScoutCandA, C=ScoutCandB, D=ScoutCandC, E=ScoutCandD. Same-tier best-of-5 candidates on `scout`; verifier on `kongming`.

ultra: union=23/28 single_candidate_only=6
