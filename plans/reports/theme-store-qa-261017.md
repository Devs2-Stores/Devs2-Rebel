# Theme Store QA: Rebel against the official requirements - 2026-10-17

Scope: every requirement on https://shopify.dev/docs/storefronts/themes/store/requirements, checked against the working tree at `E:/Work/shopify` (HEAD `d4a44dd` plus 301 uncommitted entries) and the running `shopify theme dev` at `http://127.0.0.1:9292`. Requirement text was fetched today to `runs/.theme-store-requirements-261017.md`; it is byte-identical to the 2026-10-12 mirror, so no requirement changed since the last audit.

## Verdict

Not ready to submit. The code meets every code-side MUST that can be checked from source and the running theme. Three gates outside the code block submission:

1. Documentation and support URLs do not resolve (requirement 21).
2. There is no client transfer demo store (requirement 20).
3. Lighthouse performance has no representative measurement. On the dev proxy, mobile scores 33-36, well under 60 (requirement 6).

Seven low-severity code and copy nits could draw reviewer comments; none is a hard fail on its own.

## Blockers

| # | Req | Status | Evidence | Action |
|---|---|---|---|---|
| B1 | 21 Docs and contact form | fail | `config/settings_schema.json:7-8` point to `https://docs.devs2.com/rebel` and `https://devs2.com/support`; `curl` on both hosts returns `000` (DNS does not resolve) on 2026-10-17 | Publish the merchant docs and a support contact form, then update `theme_info` if the URLs change |
| B2 | 20 Demo stores | fail (needs evidence for the replacement) | Admin API `shop.plan` on `devs2-rebel.myshopify.com`: `displayName "Basic App Development"`, `partnerDevelopment true`. The requirement says demo stores are client transfer stores and "Dev stores can't be transferred". [INFERENCE] this store is a dev store, not a client transfer store | Create a client transfer store in the Dev Dashboard, enable Bogus Gateway or Shopify Payments test mode, disable other checkout options, no apps, licensed imagery, catalog matching the preset's industry |
| B3 | 6 Lighthouse performance >= 60 | needs evidence, high risk | Dev proxy, Lighthouse 12.8.2 (`theme-store-qa-261017/lighthouse/`): mobile home 35/36, product 33, collection 33; desktop home 82, product 76, collection 81. Server response on the proxy is 2.3-3.7 s, so these numbers are pessimistic, but mobile TBT is 1.1-2.0 s, which is client-side | Measure on a store without a password (the demo store once it exists) or with Shopify's benchmark. Theme-owned levers: `swiper.js` costs 2.0-2.4 s scripting on mobile home; 5-7 component stylesheets (`header`, `megamenu`, `mobile-menu`, `announcement-bar`, `breadcrumb`, `product-card`, `skip-to-content-link`) are render-blocking |

Lighthouse accessibility (requirement 6, >= 90) passes on the proxy: 96-100 on all six route and form-factor pairs.

## Code-side requirements

Mechanical sweep of `layout/ sections/ blocks/ snippets/ templates/ config/ assets/ locales/` on 2026-10-17, plus today's runtime evidence (`enhance-ux-ax-261017-1231-merchant-settings/round-10-final/`: journeys 96 PASS, axe 0 violations on 45 route-viewports, validators exit 0; approved `shopify theme check`: 0 offenses in theme directories).

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| 4 | Discounts on cart (line and order) and order page | pass | `snippets/cart-line-details.liquid:50`, `snippets/cart-total.liquid:12`, `sections/main-customers-order.liquid:132-179` |
| 4, 7 | Accelerated checkout on PDP and cart, on by default, branded colours untouched | pass | `blocks/buy_buttons.liquid:161` (`payment_button`), `snippets/cart-total.liquid:39-41` (`additional_checkout_buttons` global); 0 CSS rules target `.shopify-payment-button__button--branded` |
| 4 | Faceted filtering on collection and search | pass | `sections/main-collection.liquid:194`, `sections/main-search.liquid:50` |
| 4 | Gift card template, Apple Wallet, QR, code, shop name | pass | `templates/gift_card.liquid`, `sections/main-gift-card.liquid:7,17-24,39` |
| 4 | Focal points, `page_image` | pass | `image_tag` throughout; `snippets/head-meta-tags.liquid:64-70` |
| 4 | Country and language selectors | pass | `sections/footer.liquid:193-220` |
| 4 | Multi-level menus | pass | `snippets/megamenu.liquid:20,34,70`, `snippets/mobile-menu.liquid:18,35` (`link.links`) |
| 4 | Newsletter | pass | `sections/newsletter.liquid:36-37`, footer, password page, popup |
| 4 | Pickup availability, Shop Pay Installments | pass | `templates/product.json:59-60,96`; `blocks/payment_installments.liquid:14` |
| 4 | Related and complementary recommendations | pass | `sections/product-recommendations.liquid`, `sections/complementary-products.liquid:28` |
| 4 | Rich media in PDP, featured product, quick view | pass | `snippets/product-media-item.liquid` rendered from `sections/main-product.liquid:27`, `sections/featured-product.liquid:35`, `templates/product.quickview.liquid:31` |
| 4 | Search template and predictive search | pass | `templates/search.json`, `sections/predictive-search.liquid` |
| 4 | Selling plans in cart | pass | `snippets/cart-line-details.liquid:17-19` |
| 4 | Unit pricing on collection, PDP, cart | pass | `snippets/product-card.liquid:225-228`, `blocks/price.liquid:43-46`, `snippets/cart-line-price.liquid:17-20` |
| 4 | Variant images | pass | `assets/product.js:323-331`; variant journeys in round 10 |
| 4 | Follow on Shop | pass | `sections/footer.liquid:185` (`login_button`) |
| 4 | `<shopify-account>` desktop and mobile | pass | `sections/header.liquid:33`, `snippets/mobile-menu.liquid:80` |
| 5 | Required templates and config | pass | all 16 present; no `config/markets.json` |
| 5 | Custom Liquid section on all templates and Custom Liquid block | pass | `sections/custom-liquid.liquid:91` (no `enabled_on`), `blocks/custom_liquid.liquid:13` |
| 5 | Header and footer section groups | pass | `sections/header-group.json`, `sections/footer-group.json` |
| 5 | Main product blocks, `@app` in main and featured product | pass | 21 theme blocks; `sections/main-product.liquid:160`, `sections/featured-product.liquid:584` |
| 7 | `html lang`, `routes`, payment icons, `content_for_header` | pass | `layout/theme.liquid:7`; 0 `href="/"`; `sections/footer.liquid:175-177`; `content_for_header` never filtered |
| 7 | Product page fields and buying functions, taxes included, gift card recipient (`form.email/name/message`, `send_on`), swatches | pass | `blocks/price.liquid:43-53`, `blocks/buy_buttons.liquid:34-48`, `snippets/collection-facet-filter.liquid:79-83` |
| 7 | Titles not truncated (product, collection, article) | pass (fixed since 2026-10-15) | no `line-clamp` or `ellipsis` on `.product-card__title`, `.collection-card__title`, `.article-card__title`; the only title clamp left is the secondary `.product-sticky-add__title` (`assets/product.css:976`) |
| 7 | Collection description, image; sort, empty state, `price_varies`, sale badge, pagination | pass (fixed since 2026-10-15) | the hero prints the full `collection.description` RTE (`snippets/collection-hero.liquid:63-66`); the block path shows an excerpt with a toggle to the full RTE (`sections/main-collection.liquid:120-143`); `snippets/product-card.liquid:38,211-213` |
| 7 | Collection list `featured_image`, pagination | pass | `snippets/collection-card.liquid:23`, `sections/main-list-collections.liquid:56` |
| 7 | Cart fields, total, checkout submit, notes, quantity refresh, empty message | pass | `snippets/cart-line-details.liquid:8`, `snippets/cart-total.liquid:24,38`, `sections/main-cart.liquid:31-33`; round-10 cart journeys |
| 7 | Page, contact template, blog, article, comments (paginated, messages), search `object_type`, 404, password | pass | `sections/main-page.liquid:13-15`, `templates/page.contact.json`, `sections/main-blog.liquid:48,53`, `snippets/article-card.liquid:26-29,85`, `sections/main-article.liquid:339-360,428`, `sections/main-search.liquid:73,87-89`, `sections/main-404.liquid:59-81`, `sections/main-password.liquid:6,53` |
| 8 | Scripts hosted on Shopify, no Sass/minified first-party files | pass | 0 external `<script src>`; 0 `.scss`, 0 `.min.` |
| 8 | Protocol-relative asset links | low | `sections/video.liquid:86` loads the YouTube poster from `https://i.ytimg.com`. The `https` preconnects (`snippets/head-stylesheets.liquid:6`, `snippets/head-fonts.liquid:8`) match Dawn and are resource hints; the share links (`snippets/share-buttons.liquid`) are outbound links, not assets |
| 9 | Browsers | pass on what could be run | `scratch/browser-compat.cjs` on the dev server: WebKit 26.4 at 1440 and iPhone 13, Firefox 150 at 1440. Home has no horizontal overflow, the collection shows 30 cards, a variant change updates the hidden id, add to cart opens the drawer with 1 item, and the cart page shows 1 line and a checkout button. The only errors are the dev proxy redirecting Shopify's `origin_trials` and web-pixel scripts (platform baseline). Real Safari, Edge, Samsung Internet and the Instagram, Facebook and Pinterest webviews were not tested |
| 11 | SEO metadata, Product JSON-LD, no `robots.txt.liquid` | pass | `snippets/head-meta-tags.liquid:23,60,86,95` |
| 12 | Accessibility | pass | axe 0 violations (round 10), Lighthouse a11y 96-100. Two minor findings below |
| 13 | Social icons, OG and Twitter tags, no social placeholders | pass | `snippets/shop-social.liquid`; 0 settings with `placeholder` |
| 14 | Favicon, labels, link_list defaults | pass | `config/settings_schema.json:45`; the only unlabelled setting is `color_schemes` (`color_scheme_group`, unlabelled in Dawn too); header `main-menu`, footer `footer`; `customer_account_menu` follows the account-component docs (see the 2026-10-15 report) |
| 14 | Text style and terminology | low | see L1 |
| 14 | Defaults that show how to use a setting, no demo copy | low | see L2 |
| 15 | Font picker, available default, `font_modify` variants | pass | three `font_picker` settings default `inter_n4`; `snippets/head-fonts.liquid:12-26` |
| 16 | Colour system | pass | scheme group with 16 roles, background paired with text |
| 17 | Responsive and lazy images | pass | 5 raw `<img>` without `srcset`: an SVG data-URI lightbox, the hero `custom_image_url` (merchant-supplied URL), the YouTube poster, and the dead megamenu branch (L5) |
| 18 | Naming | pass, one open question | one preset `Rebel`, no company name in preset names, no `listings/` in the zip |
| 19 | Version and release notes | pass | `theme_version 1.0.0`; `docs/release-notes-v1.0.0.md` |

## Low findings

| # | Req | Finding | Evidence |
|---|---|---|---|
| L1 | 14 Terminology ("must adhere") | 29 labels say "title" where Shopify's list says "heading" (for example "Panel title", "Mission title", "Upsell section title"); "Enable" for showing a basic element ("Enable cart note", "Enable read more toggle"); "Social link 1/2" instead of "social media"; "Range slider" and "Before/after slider" (list prefers "slideshow" for sliders); "transparent PNG" (list says ".png") | `locales/en.default.schema.json` |
| L2 | 14 Defaults | `main-blog` sidebar banner defaults are demo copy: "Texture, utility, attitude", "Explore sculptural layers and future-ready footwear.", "Shop the edit". Other defaults state concrete claims a merchant may not want: "Get 20% off your first order with code WELCOME20", "Crafted with passion since 2015", "Orders over $50 ship free" | `locales/en.default.schema.json` under `sections.main_blog.blocks.sidebar_banner`, `sections.promotion_banner`, `sections.parallax_image`, `sections.main_product.blocks.icon_with_text` |
| L3 | 8 Protocol-relative | `https://i.ytimg.com/...` poster | `sections/video.liquid:86` |
| L4 | 12 / 6 | Collection list images repeat the card title as `alt` (`image-redundant-alt`, home). The home slideshow crossfade gives a 1.2 contrast frame on the primary button, and Lighthouse does not pause carousels: mobile home a11y was 100 in one run and 96 in the next | `sections/collection-list.liquid` card `<img>`; `theme-store-qa-261017/lighthouse/mobile-home-r2.json` |
| L5 | code health | The megamenu featured-image branch reads `settings[megamenu_image_link_N]` and `megamenu_image_N.jpg | asset_url`; no such settings exist in `config/settings_schema.json`, so the branch never renders | `snippets/megamenu.liquid:16-18,51-55` |
| L6 | 7 heading order | PDP description heading-order warning comes from the demo product's own description HTML (store content, not theme) | `mobile-product.json` `heading-order` |
| L7 | delivery | Nothing is committed (301 working-tree entries), and `dist/rebel-v1.0.0.zip` (2026-10-16 10:43) predates today's edits; rebuild with `python scripts/package-theme.py` after committing | `git status`, `ls dist/` |

## Not checkable from code

Requirement 1 (exclusivity), 2 (uniqueness from other themes), 3 (design review), 22 (support SLA) are business and reviewer decisions.

## Unresolved questions

1. Theme name: `themes.shopify.com/themes/rebel` returns 404, so no listed Theme Store theme uses the name, but Shopify Community threads from 2024-2026 refer to a "Rebel theme" merchants run. The guidelines say not to reuse an existing theme name, and the name cannot be changed after upload. Confirm before uploading.
2. Lighthouse numbers come from the dev proxy (server response 2.3-3.7 s). A store without a password is needed for a number Shopify would see.
3. `scratch/lh/` (Lighthouse 12.8.2) and `scratch/browser-compat.cjs` are throwaway harnesses in the gitignored `scratch/`; Playwright WebKit and Firefox were installed into the user's `ms-playwright` cache for this run.
