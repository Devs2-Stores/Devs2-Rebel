# Research: Shopify Theme Store requirements as of 2026-10-15, checked against Rebel

Conducted: 2026-10-15. Scope: the official Theme Store requirements, the pages they link for review and updates, and the 2026 developer changelog. Each MUST is compared with the Rebel working tree at `E:/Work/shopify`. Single-pass research (not `--ultra`).

## Outcome

The requirements page has not changed since the 2026-10-12 mirror. A line diff of `runs/.theme-store-requirements-261012.md` against today's fetch (`runs/.theme-store-requirements-261015.md`) differs only in the fetch header.

Scope was narrowed on 2026-10-15 at the user's request: codebase only. Off-repo gates (Lighthouse, demo store, docs and support form, browsers, uniqueness review) are out of scope for this report.

An owner-level pass (the template, block and schema that render each MUST, not token presence alone) found two code findings:

1. **Titles truncated by CSS, Medium.** Requirements 7 say `product.title`, `collection.title` and `article.title` must not be truncated on collection, collection-list and blog pages. Rebel clamps all three to 2 lines.
2. **Collection description never rendered in full, Medium.** With the default settings, the collection page outputs only a 30-word, HTML-stripped excerpt clamped to 3 lines.

## Sources

| Source | Fetched | Use |
|---|---|---|
| https://shopify.dev/docs/storefronts/themes/store/requirements | 2026-10-15 | Authority. Mirror saved to `runs/.theme-store-requirements-261015.md` |
| https://shopify.dev/docs/storefronts/themes/store/review-process/submit-theme | 2026-10-15 | Five review stages |
| https://shopify.dev/docs/storefronts/themes/store/success/updates | 2026-10-15 | Zip structure, versioning, `release-notes.md` |
| https://shopify.dev/changelog/posts/the-shopify-account-component-for-customer-accounts-is-now-a-theme-store-requirement | 2026-07-30 post | Account component requirement; legacy customer templates no longer required |
| https://shopify.dev/changelog/posts/password-protected-shop-dev-flows-on-shopify-theme-cli-v3-83-x-and-older-to-be-deprecated | 2026-08-27 post | CLI >= 3.84.0 for password-protected `theme dev` since 2026-09-23 |
| https://shopify.dev/changelog/posts/developer-preview-liquid-block-and-partial-tags | 2026-07-21 post | `{% block %}`/`{% partial %}` developer preview. This is not a requirement |

The changelog feed was scanned from 2026-07 to 2026-10-15. No other Theme Store requirement change appears in that window. Entries before July 2026 were not paged.

## 2026 changes that matter

- **Account component (2026-07-30, MUST).** `<shopify-account>` must be in the header and visible on desktop and mobile. Rebel renders it at `sections/header.liquid:33` and `snippets/mobile-menu.liquid:80`. Live render on 2026-10-14 showed the attribute `menu="customer-account-main-menu"` in both places.
- **Legacy customer accounts are deprecated (2026-07-30).** "Themes are no longer required to include legacy customer account template files." Rebel still ships 7 `templates/customers/*.json` files and their `main-customers-*` sections. Keeping them is allowed. Removing them is now an option for slimming the MVP, not an obligation.
- **CLI (2026-09-23).** Password-protected `shopify theme dev` needs CLI 3.84.0 or later. The workstation runs CLI 4.8.3 (Theme Check baseline 2026-10-09), so no action is needed.
- **Release notes file.** The updates page says: "`release-notes.md` is required only after a theme has been published ... You should exclude this file during the review process." Rebel keeps notes at `docs/release-notes-v1.0.0.md`, and `docs/` is outside the zip, so this is consistent. Requirement 19 still asks for a version number and release notes at submission. Version comes from `theme_info.theme_version` `1.0.0`.
- **Zip structure.** A single preset needs no `/listings` folder. One preset must carry the theme name (`Rebel`). `scripts/package-theme.py` excludes `listings/`, which matches.

## Compliance matrix (code-side MUSTs)

Evidence is from a mechanical sweep of `layout/ sections/ blocks/ snippets/ templates/ config/ assets/ locales/` run on 2026-10-15.

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| 4 | Faceted filtering on collection and search | pass | `sections/main-collection.liquid:189`, `sections/main-search.liquid:50` (`search.filters`). Templates `collection.json` and `search.json` render `main-collection` and `main-search` |
| 4 | Rich media on PDP, featured product, quick view | pass | `snippets/product-media-item.liquid` used by `main-product`, `featured-product`, `product.quickview` (2026-10-14 MVP waves) |
| 4 | Pickup availability, Shop Pay Installments, Follow on Shop | pass | `templates/product.json` main-product blocks include `pickup_availability` and `payment_installments`; `sections/footer.liquid:141` (`login_button`) |
| 4 | Related and complementary recommendations | pass | `sections/complementary-products.liquid:28`, recommendations sections |
| 4 | Predictive search, country and language selectors | pass | `sections/predictive-search.liquid`, `sections/footer.liquid:165,182` |
| 4 | Discounts on cart (line and order level) and order page | pass | `snippets/cart-line-details.liquid:50`, `snippets/cart-total.liquid:12`. The order page (`sections/main-customers-order.liquid:132-179`) is a legacy customer template; since 2026-07-30 those are optional, so this row no longer depends on it |
| 4 | `<shopify-account>` on desktop and mobile | pass | see above |
| 5 | Required templates and config files | pass | all 16 present |
| 5 | Custom Liquid section and block with a `liquid` setting | pass | `sections/custom-liquid.liquid:91`, `blocks/custom_liquid.liquid:13` |
| 5 | `@app` in main product and featured product | pass | `sections/main-product.liquid:138`, `sections/featured-product.liquid:381` |
| 5 | Header and footer in section groups; no `config/markets.json` | pass | `sections/header-group.json`, `sections/footer-group.json`; file absent |
| 7 | `html lang`, `routes`, payment icons, gift card QR/Apple Wallet, recipient fields, swatches, cart fields | pass | `layout/theme.liquid:7`; no `href="/"`; `sections/footer.liquid:134`; `sections/main-gift-card.liquid:17-24`; `blocks/buy_buttons.liquid:34-48`; `snippets/collection-facet-filter.liquid:79-83`; `snippets/cart-total.liquid:39-41` |
| 7 | Article: `published_at`, not `created_at`; paginated comments; `excerpt_or_content` | pass | `sections/main-article.liquid:428`; zero `article.created_at`; `snippets/article-card.liquid:85` |
| 7 | Product grid: `product.title` not truncated | **fail, Medium** | `assets/product-card.css:160` `.product-card__title a { -webkit-line-clamp: 2 }`, `:262` clamps to 1 line for `--special`; `assets/collection.css:895` clamps the list view to 2. Markup `snippets/product-card.liquid:147` |
| 7 | Collection list: `collection.title` not truncated | **fail, Medium** | `assets/list-collections.css:157` `.collection-card__title { -webkit-line-clamp: 2 }`; markup `snippets/collection-card.liquid:51` |
| 7 | Blog: `article.title` not truncated | **fail, Medium** | `assets/article-card.css:60` `.article-card__title { -webkit-line-clamp: 2 }`; markup `snippets/article-card.liquid:54` |
| 7 | Collection: output `collection.description` | **fail, Medium** | The `collection_image` block defaults `show_description: true` (schema), so `sections/main-collection.liquid:41` sets `hero_show_description` and `:122` skips the full description block. The hero then renders only `collection.description | strip_html | truncatewords: 30` (`snippets/collection-hero.liquid:65`) inside a 3-line clamp (`assets/collection.css:63-71`). There is no "read more" path to the full RTE. Rich text formatting is also stripped, which conflicts with requirement 8 (consistent RTE styling) |
| 7 | Collection sort, empty message, pagination; cart empty message and quantity change; search no-results and `object_type`; 404 links; password form; contact form; gift card shop name and code | pass | `sections/main-collection.liquid:222-233,284,48`; `sections/main-cart.liquid:26,52`; `sections/main-cart-items.liquid:33`; `sections/main-search.liquid:87-89,230`; `sections/main-404.liquid:15-19`; `sections/main-password.liquid:6,53`; `sections/page-contact.liquid:130`; `sections/main-gift-card.liquid:7,21` |
| 7 | Accelerated checkout enabled by default on PDP | pass | `blocks/buy_buttons.liquid` schema `show_dynamic_checkout` default `true`; `templates/product.json` leaves it at default |
| 8 | No app-like features (wishlist, cart discount-code field) and no fake urgency | pass | zero `wishlist` hits; cart lists applied discounts only; `blocks/stock_counter.liquid:12-13` reads real `inventory_quantity`; the hero countdown runs only on a merchant-set `end_date` and hides when the date is blank, invalid or expired |
| 8 | Protocol-relative asset links | open, low | `sections/video.liquid:90` loads its poster from `https://i.ytimg.com`. The `https` preconnect hints (`snippets/head-stylesheets.liquid:6`, `snippets/head-fonts.liquid:8`) are resource hints, not asset links or anchors, so the asset and `nofollow` rules do not apply to them. SVG `xmlns="http://www.w3.org/2000/svg"` hits were excluded |
| 10 | No Sass, no minified first-party CSS/JS | pass | zero `.scss` and zero `.min.` files |
| 11 | SEO metadata, Open Graph and Twitter tags, Product JSON-LD, no `robots.txt.liquid` | pass | `snippets/head-meta-tags.liquid:58-61,138` |
| 13 | Social placeholder text left empty | pass | zero social settings with `placeholder` in `config/settings_schema.json` |
| 14 | link_list in header/footer defaults to `main-menu` or `footer` | pass | `sections/footer.liquid` `menu`→`footer`, `sections/header.liquid` `menu`→`main-menu`. `customer_account_menu`→`customer-account-main-menu` matches the official account component docs exactly (see below) |
| 14 | `theme_info` present | pass | name `Rebel`, version `1.0.0` |
| 15 | `font_modify` bold/italic/bold-italic for every font | pass | `snippets/head-fonts.liquid:12-22` |
| 18 | One preset named after the theme; no company name | pass | the only preset is `Rebel`; the 2026-10-14 cutover removed company residue from defaults |
| — | Theme Check | pass | 248 files, no offenses (2026-10-14, `runs/theme-check-261014.txt`) |

## Out of scope

Lighthouse (6), browsers and webviews (9), demo stores (20), docs and support form (21), support SLA (22), and uniqueness and design review (2, 3) are not codebase checks and were dropped from this report at the user's request.

## Code nits found during the pass

- Dead CSS: `assets/theme.css:12-26` (`.line-clamp-1/2/3`) and `assets/theme.css:299` (`.card .card__wrapper ... .card__content__title-text`) match no markup.
- `assets/customer.css:274,562,666` clamp product titles on the legacy account and order pages. These pages are optional now, so this is not a Theme Store issue.

## `customer_account_menu` default: resolved

- Requirement 14 (mirror L479) says header and footer link_list defaults are `main-menu` or `footer`.
- The official account component page (https://shopify.dev/docs/storefronts/themes/customer-engagement/account-component, section "Menu links") prescribes a header `link_list` setting `customer_account_menu` with `"default": "customer-account-main-menu"`, and says this keeps links consistent with customer account pages (Orders, Profile).
- Rebel's setting is identical. The component docs are the more specific Shopify authority for this one setting, so keep it. If a reviewer cites L479, point them to that page.
- The menu does not exist on `devs2-rebel` yet (2026-10-14 runtime message). It has to be created in the demo store's Admin under Content > Menus.

## Next steps

1. Remove the title clamps on `.product-card__title a`, `.collection-card__title` and `.article-card__title`, and keep the grid aligned another way (for example `align-items: start` on the card body). Verify at 375, 768 and 1440 with long demo titles.
2. Render the full `collection.description` in the hero (`snippets/collection-hero.liquid:65`), or reuse the existing `data-desc-toggle` excerpt-and-full pattern from `sections/main-collection.liquid:129-143`. Then remove the 3-line clamp.
3. Optional MVP slimming: drop `templates/customers/*` and the `main-customers-*` sections now that legacy accounts are deprecated. If this happens after publishing it forces a manual update, so decide before 1.0.0.

## Unresolved questions

- Whether a reviewer reads L479 literally despite the account component docs. Not seen in any official statement.
- Whether hard-coded `https` preconnect hints and the YouTube poster URL count as "assets" under requirement 8.
- Changelog entries before July 2026 were not paged. The May 2025 requirements overhaul is already reflected in the current page.
