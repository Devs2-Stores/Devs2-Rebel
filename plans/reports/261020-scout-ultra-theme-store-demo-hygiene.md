# Scout --ultra: Theme Store readiness, demo-store inventory, codebase hygiene - 2026-10-20

Method: five independent read-only scout candidates (anonymized A-E) and one `kongming` verifier that opened every kept file:line. Requirement authority: `runs/.theme-store-requirements-261020.md` (fetched 2026-10-20, byte-identical to the 261017 mirror). Mirror lines are cited as `L###`. Line numbers marked † were cited by a candidate and not reopened by the verifier.

Checks run by the verifier: `node scripts/validate-locales.mjs` (SUCCESS) and `node scripts/validate-schema-ranges.mjs` (SUCCESS). Not run: Theme Check (needs user approval), Lighthouse, live storefront probes. Controller spot-check: V-01 confirmed in `sections/header.liquid:28-57` and `assets/header.css:79-81,171-181`.

## Applied on 2026-10-20 (commits `45951db`, `d93d927`, then a third round)

User decisions: fix all of group A; keep one preset and leave `listings/` untouched; remove only the "Pattern: Horizon" comment for V-22; scoped grant to delete `toc_enable` and `recaptcha_site_key` from `config/settings_data.json`; the four feature decisions were delegated to `kongming`.

- Applied: V-01 to V-07, V-09 to V-22, V-24, V-25, V-26. V-08 applied under the grant (backup `scratch/settings-backup/settings_data.261020.json`, sha256 `02952f3d...` -> `bb94c670...`, 197 -> 195 keys, only the two keys differ).
- V-17 install state: blank collection and product pickers; the featured product section renders a placeholder ("Example product title", key `sections.featured_product.placeholder_title`) instead of nothing; the footer uses the `footer` menu and skips empty menu columns; footer contact fields cleared.
- Kongming decisions, applied: `back_in_stock` block removed (decision overrides V-23); hero `custom_image_url`, `custom_image_mobile_url` and `video_url` removed; `@app` kept only on `main-product`, `featured-product`, `main-collection`; Zalo, Shopee and Lazada float channels removed; footer DMCA certificate removed; `tax_code` kept with the label "Tax ID".
- Not applied: `listings/*/templates/product.json` still reference the removed `back_in_stock` block (listings are not shipped and were left untouched by user decision; fix them when a second preset is built).
- Verification: `validate-locales.mjs` and `validate-schema-ranges.mjs` SUCCESS; every template, section group, config, locale and section/block schema parses; `node --check` passes on every `assets/*.js`; live `shopify theme dev` proxy at 1440, 768 and 375 on `/`, a product, `/collections/all`, `/cart`, `/pages/about`, `/pages/stores`, `/search?q=a`: HTTP 200, no horizontal overflow, account control visible at every width (44x44), no back-in-stock, `.section-apps` or DMCA markup, no Vietnamese text. A second smoke at 1440 and 375 that kept every console error found 0 errors on all 14 page loads after excluding Shopify-owned noise (origin trials, web pixels, monorail, shop.app frame-ancestors) and the account-menu warning below. Runtime `themeConfig.strings.variant` and `.cart` hold every key product.js reads; `/pages/stores` emits all four data labels; no "translation missing" or "undefined" text on the product or stores page. `dist/rebel-v1.0.0.zip` rebuilt: 247 files, 8 theme directories.
- Every page logs `[shopify-account] Menu "customer-account-main-menu" not found` three times (two header instances plus the mobile drawer). The handle is the theme's `customer_account_menu` default in `sections/header.liquid`; it matches the account-component docs and Horizon's own header. Kept, because a `main-menu` default would make the account sheet show store navigation instead of Orders and Profile. The message disappears once the store has that system menu.
- Second round (same day): footer headings `h3` -> `h2` (`sections/footer.liquid`, styles are class-owned so sizes are unchanged: 21.6px/12px at 1440); breadcrumb links get a real 24px box (`display: inline-flex; min-height: 1.5rem`) instead of a `::after` hit area; `.section-marquee-products__view-all`, `.section-blog-posts__view-all` min-height 1.5rem; product meta link hit area; card badge and cart count 12px; the "As featured in" heading `sm` -> `md` (24px/20px vs the 18px collection-card H3); `templates/page.contact.json` placeholder address, phone and `hello@example.com` cleared (the page renders hours only, no overflow at 375).
- AntiFan `theme.qa_validate` (build-strict) on `/`, a product, `/collections/all`, `/cart`, `/pages/contact`: every layout, contrast, tap-target and overflow rule passes after the waivers for `title-scale`, `image-crop` and `icon-stroke-mismatch`. Verdict stays `QA_FAILED`, certification `STRUCTURAL`: the only criticals are `diagnostics:console` from the dev server (`[HotReload]`), the account-menu message above and Shopify's shop.app `frame-ancestors` CSP; that rule is not waivable, and no visual baselines exist for CERTIFIED.
- Third round (from reviewer advisories): cart headings `h4` -> `h2` (`sections/main-cart.liquid` note, invoice and upsale titles; `snippets/cart-total.liquid` order summary; the two tag selectors in `assets/cart.css`), so a cart with items reads H1 -> H2 instead of H1 -> H4; the cart count is pluralized with `sections.cart.item_count_label` ("(1 item)", "(2 items)", also after the section re-renders on a quantity change) and the summary row reads "Items: 1" instead of "1 items"; the unused `strings.cart.caption` and its `sections.cart.caption` key are removed. `sections/contact-form.liquid` no longer ships `hello@example.com` or `+1 (888) 123-4567`: the info item default and the three preset items use translated, instructional values (`sections.contact_form.blocks.info_item.settings.value.default`, `sections.contact_form.presets.contact_form.*`). Checked at 1440, 768 and 375 on the cart with one item, the product breadcrumb (24px), the home press heading (24/24/20px against an 18px card title), the footer and the contact page: no horizontal overflow, no console errors outside Shopify and dev-server noise. AntiFan on `/cart` with an item: only the console criticals described above, certification `STRUCTURAL`.
- Not changed on review: `listings/*/templates/index.json` keep `heading_size: "sm"` for the press logos (listings are not shipped and stay untouched by user decision); `HS-05` on `og:image` is the dev proxy rewriting the absolute `https:` URL to `/cdn/...`, the Liquid emits `https:{{ page_image | image_url }}`.
- Unverified: the YouTube `postMessage` play/pause path in `assets/product.js` was never exercised against a real embed; the mobile logo sits about 36px left of centre after the header grid change to `auto minmax(0, 1fr) auto` (needs a design sign-off); after sync, the devs2-rebel home shows placeholder cards and the "Example product title" placeholder because the template pickers are blank; the PDP H1 -> H3 jump comes from the demo product description (`<h3>Features:</h3>`), not the theme.
- Open, from the go/no-go counsel: L54 eligibility. 103 of the 187 global setting ids in `config/settings_schema.json` share Dawn's ids (`animations_*`, `card_*`, `buttons_*`, `variant_pills_*`, `badge_position`). Renaming ids does not change provenance; a reviewer may read this as Dawn-derived. Needs a user decision.
- Pending: Lighthouse on a store without a password (L220/L222 need real section content, so measure on the seeded demo store), external blockers X-1 to X-5.

## Candidate scores (rubric: coverage, evidence, density, honesty; 0-5 each)

|Candidate|Total /20|Main errors|
|---|---|---|
|D|19|Raised 32 `@app` hosts to Medium|
|B|17|Counted 20 store blocks (actual 32); raised Dawn parity to High|
|E|16|Missed orphan sections|
|A|15|Called the 1-preset listings mismatch a blocker (L699 allows it); flagged `shopify://shop_images` (known false positive)|
|C|14|Thin T4; missed `/blogs/news` CTA|

## External blockers

|ID|Sev|Evidence|Mirror|Action|
|---|---|---|---|---|
|X-1|Blocker|`devs2-rebel` is a dev store (`partnerDevelopment=true`, 261017 report)|L731|Create a client transfer store|
|X-2|Blocker|Mobile perf 33-36 on the dev proxy only|L220 (avg >= 60, desktop and mobile)|Measure on a store without a password, after code fixes|
|X-3|High|`theme_info` points to devs2.org; `/api/theme-support` returns 503 until Turnstile and Email Sending vars exist on the Pages project|Req 21|Set Pages vars, test the form end to end|
|X-4|Open|Name "Rebel": no Theme Store listing, but community threads mention a "Rebel theme"|L664|User decision before upload (name is permanent)|
|X-5|Medium|`freepik__*` images in `templates/page.about.json`†; fictional `press-logo-*-dark.png` in `templates/index.json`|L737, L741|Keep license evidence or replace|

## Code findings

|ID|Sev|file:line|Mirror|Fix|
|---|---|---|---|---|
|V-01|High|`sections/header.liquid:33` renders `<shopify-account>` only in `.header__actions`, hidden below 1024px (`assets/header.css:79-81`). `.header__mobile-actions` (:54) has search and cart only; account lives in the drawer (`snippets/mobile-menu.liquid:80`)|L182 "visible in both the desktop and mobile header"|Render `<shopify-account>` in `.header__mobile-actions`|
|V-02|Medium|`sections/featured-product.liquid:111-120` posts the first variant with no picker; demo product has Color x Size|Req 3 product options|"Choose options" link when the product has variants, or embed the picker|
|V-03|Medium|`assets/product.js:624-627` injects `https://www.youtube.com/iframe_api`|L393 scripts hosted on Shopify|Use `external_video_tag` or record the risk|
|V-04|Medium|`sections/video.liquid:86` `https://i.ytimg.com/...` poster|L393 protocol-relative assets|Use `//i.ytimg.com/...`|
|V-05|Medium|`snippets/megamenu.liquid:14-18,23,31-62` reads `settings[megamenu_*_N]` with no schema owner; dead CSS `assets/megamenu.css:76-78,186-280`; dead JS `assets/megamenu.js:63,70,152`|-|Delete the branch, CSS and JS; keep `megamenu__simple`|
|V-06|Low|`snippets/megamenu.liquid:10`, `snippets/mobile-menu.liquid:1` read `settings.header_menu` (no schema id)|-|Fallback to `main-menu`|
|V-07|Low|`snippets/shop-social.liquid:3,58-63` reads `settings.social_linkedin_link` (no schema id)|-|Add the setting or remove the branch|
|V-08|Low|`config/settings_data.json:178` `toc_enable`, `:206` `recaptcha_site_key` have no schema owner|-|Remove (needs settings_data grant)|
|V-09|Medium|`sections/page-about.liquid` has no presets and no template use; `assets/page-about.js` defines an element never rendered; `sections.page_about.*` locale keys orphaned|-|Delete section, keys and dead CSS/JS; keep `initComposedAboutPage()`|
|V-10|Medium|`assets/product.js:406` fallback `'Mua ngay'`; Vietnamese comments in 31 Liquid files|Project English rule|English locale-backed string; translate or drop comments|
|V-11|Low|Literal English fallbacks in `product.js:362-366,383-384`, `product-card.js:31-32`, `share-buttons.js:77-85`, `customer.js:239-240`, others†; `sections/footer.liquid:69` `title="Twitter / X"`|Project locale rule|Locale-backed strings|
|V-12|Medium|Fake/demo schema defaults in `locales/en.default.schema.json`: :1018, :1673, :1677, :3879, :4258, :4784 ("since 2015"), :4951 ("WELCOME20"), :5204, :5617, :5795; `templates/blog.json:35-38`|L473, L393|Neutral instructional defaults|
|V-13|Medium|Terminology: "title" labels (26 lines from :357 to :2716), "slider" (:1165, :2387, :2462), numbered labels (Card 1/2/3, Button 1/2, Image 1/2/3, Social link 1/2), "PNG" (:4436), ampersands (:2478 etc.)|Text style and terminology tables|Rename labels only; keep ids|
|V-14|Low|`sections/collection-list.liquid:88,96` `alt: card_title` beside the visible title|L451, L220|`alt: ''` or `image.alt`|
|V-15|Low|`sections/main-cart.liquid:35` VAT invoice fields on by default (`:107-109`)|-|Default `false`|
|V-16|Medium|`templates/index.json:221` CTA `/blogs/news` while the blog section uses `style-guides-wardrobe-essentials` (:542); `/blogs/news` is empty|Support: dead links|One blog handle for both|
|V-17|Medium|Install state depends on demo resources: `sections/footer-group.json:13,19,26,33` (4 custom menus), `sections/header-group.json:12` `shopify://collections/new-arrivals`, collection/product handles in `templates/index.json`|L809-L811, L710|Install-safe defaults (`footer`, `/collections/all`, blank pickers)|
|V-18|Low|`snippets/product-card.liquid:216` price range mixes `money` and `money_with_currency`|L308|Same format on both ends|
|V-19|Medium|`sections/hero.liquid:1164` default `end_date` 2027-12-31 on the countdown preset|L393 fictitious countdown|Remove the default|
|V-20|Low|`templates/index.json` hotspots have empty products with hardcoded prices|L735, L393|Bind real products, drop prices from text|
|V-21|Low|`templates/page.stores.json` has 32 store blocks, 27 with "555" phones and `@example.com` emails|L735|Cut to 3-5 real stores|
|V-22|Medium (reviewer judgement)|`snippets/head-meta-tags.liquid:3` comment "Pattern: Horizon"; Dawn-identical body classes and `--variant-pills-*` tokens; 96/182 global setting ids match Dawn|L54|Delete the comment; deeper renames need a user decision|
|V-23|Low|`blocks/back_in_stock.liquid` is a contact-form "notify me"; the listing tag "back-in-stock alert" exists|L393|Keep; describe it accurately|
|V-24|Low [INFERENCE]|`snippets/head-script.liquid` speculation rules do not exclude locale-prefixed `/xx/cart`, `/xx/account`|L393|Exclude prefixed paths or prefetch only|
|V-25|Low|Missing `LICENSE.md` referenced in `layout/*.liquid:2-5`; `.gitignore` lacks `scratch/`, `.antifan/`; stale `.shopifyignore` entries; `assets/swiper.js:14` dangling `sourceMappingURL`; stale `dist/devs2-rebel-v1.0.0.zip`|-|Clean up|
|V-26|Low|38 storefront locale keys look unused (months, bundle, countdown, slider, etc.)|-|Confirm dynamic use, delete the rest|
|V-27|Low|32 sections/blocks accept `@app`; project rule says eligible hosts only|L204 (only main + featured product required)|Optional trim|
|V-28|Low|`listings/` holds 5 preset folders; `settings_data.json` has only `Rebel`; zip excludes `listings/` (correct for 1 preset); `listings/rebel` differs from root in `index.json` and `page.contact.json`|L699|Keep 1 preset; tidy or remove extra folders|
|V-29|Low [INFERENCE]|`sections/hero.liquid` accepts external image/video URLs|L393|Document or keep pickers only|

Verified PASS: `@app` in main and featured product; Custom Liquid section and block; `cart_type` notification; the 48 `float_*` settings are read dynamically (`snippets/float-social.liquid:37-41`); no `prefers-reduced-motion`; `dist/rebel-v1.0.0.zip` (249 files) is newer than every theme file.

Dropped: listings 5-vs-1 as a blocker (L699), `shopify://shop_images` refs (L711), blanket `https://` hits (only V-03/V-04 are assets), Theme Check thresholds, inline JS, `customer_account_menu` default (matches the account-component docs and Horizon).

## Demo store inventory

- Store: client transfer store (L731), Bogus Gateway or Payments test mode with other checkout options off, password off, no apps except free reviews/translation (L739), new customer accounts on, at least 2 markets/currencies and 2 languages (footer selectors are on), real social links.
- Menus: `main-menu` (3 levels), `footer`, `customer-account-main-menu`; `footer-shop`, `footer-help`, `footer-company`, `footer-legal` until V-17 lands.
- Collections: `all`, `outerwear`, `casual-shirts`, `accessories`, `limited-edition`, `new-arrivals`; one empty collection; one with sub-collections; values for `predictive_search_recommendation_collection` and `cart_drawer_collection`.
- Products: at least 12; `rebel-tactical-bomber-jacket` with Color x Size; sale price; sold out; one sold-out variant; varying prices; colour and image swatches; a 3-option product; gift card; video, external video and 3D model; unit price; tag `new`; a tracked variant at <= 10 stock with `deny`; every price > 0; vendor, type, SKU; a pickup location with stock.
- Metafields: only `reviews.rating` and `reviews.rating_count` (optional `rating` block).
- Blog: one handle (resolve V-16), at least 3 articles with image, excerpt, author, tags, open comments.
- Pages: `about`, `contact`, `faq`, `stores`, a size-guide page, all four policies.
- Discounts: one automatic discount.
- Images: 72 unique `shopify://shop_images/` files referenced by `templates/*.json` and section groups.

## Decisions needed

1. Preset scope: keep 1 preset (recommended, matches AGENTS.md) or ship 5.
2. `back_in_stock`: keep (recommended) or remove.
3. Dawn/Horizon distance: comment removal only, or rename tokens, classes and setting ids (breaking).
4. External image/video URL settings in `hero.liquid`: keep or remove.
5. `@app` on 32 hosts: keep or trim.
6. Domestic channels (Zalo, Shopee, Lazada) in `float-social`, footer `tax_code`/DMCA: keep or remove.
7. V-08 needs a scoped grant to edit `config/settings_data.json`.

## Open questions

1. Will a reviewer accept the account link in the mobile drawer instead of the mobile header bar (L182)?
2. Is the YouTube IFrame API an approved third-party library (L393)?
3. Does Search & Discovery count as an app under L739? Can selling plans be shown without a subscription app?
4. Licenses for `freepik__*`, `demo-*`, `press-logo-*` images.
5. Theme Check result today (needs approval).
