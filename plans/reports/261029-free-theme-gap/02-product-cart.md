# 02 - Product page, quick add / quick view, cart: Rebel vs Horizon 4.3.0

Slice: PDP, quick add/quick view, cart page, cart drawer. Read-only analysis. Date 2026-10-29.

## 1. Scope and method

Read (Horizon = `_reference/fabric`, identical code in all six themes):
`blocks/_product-media-gallery.liquid`, `snippets/product-media-gallery-content.liquid`, `assets/media-gallery.js`, `assets/zoom-dialog.js`, `assets/variant-picker.js`, `assets/product-form.js`, `assets/quick-add.js`, `assets/recently-viewed-products.js`, `snippets/quick-add.liquid`, `snippets/quick-add-modal.liquid`, `snippets/cart-drawer.liquid`, `snippets/cart-summary.liquid`, `blocks/buy-buttons.liquid`, `blocks/accelerated-checkout.liquid`, `AGENTS.md`, `templates/product.json`; the per-theme `product.json` / `cart.json` / `settings_data.json` of all six (script `scratch/gap-pdp/tpl.cjs`).
Rebel: `sections/main-product.liquid`, `templates/product.json`, `templates/cart.json`, `blocks/{buy_buttons,price,variant_picker,quantity_selector,stock_counter,pickup_availability,rating}.liquid`, `snippets/{product-media-item,product-variant-picker,product-variant-dropdown,product-sticky-add,product-viewed,quickview-modal,cart-modal,cart-items,cart-total,cart-line-details,cart-line-price,product-card}.liquid`, `templates/product.quickview.liquid`, `sections/{main-cart,main-cart-items,complementary-products,product-recommendations,cart-recommendations}.liquid`, `assets/{product,variant-picker,quickview-modal,quickview-variant-picker,cart-modal,cart,product-card}.js`, `assets/{product,variant-picker,variant-picker}.css`, `config/settings_schema.json`.

Live capture (Playwright headless, `scratch/gap-pdp/capture*.cjs`, JSON beside the PNGs):
- PDP at 1440 and 375: Fabric (`/products/abcs-graphic-longsleeve-in-black`), Vessel (`/products/20702`), Rebel (`/products/rebel-tactical-bomber-jacket`).
- Cart drawer after add, 1440 and 375: Fabric, Vessel, Rebel. Rebel also with 2 items, keyboard open/remove/Escape, plus the cart page.
- Quick add modal on Vessel and Fabric; collection hover/quick view on Rebel; zoom/lightbox on Fabric and Rebel; sticky add-to-cart at 375.
Screenshots (all under `scratch/gap-pdp/`): `fabric-d1440-pdp-fold.png`, `vessel-d1440-pdp-fold.png`, `rebel-d1440-pdp-fold.png`, `fabric-m375-pdp-fold.png`, `vessel-m375-pdp-fold.png`, `rebel-m375-pdp-fold.png`, `fabric-d1440-cart-drawer.png`, `rebel-d1440-cart-drawer.png`, `rebel-d1440-cart-drawer-2items.png`, `fabric-m375-cart-drawer.png`, `rebel-m375-cart-drawer.png`, `rebel-d1440-cart-page.png`, `rebel-m375-cart-page.png`, `vessel-d1440-quick-add-modal.png`, `fabric-d1440-zoom.png`, `rebel-d1440-lightbox.png`, `rebel-d1440-quickview.png`, `rebel-d1440-collection-hover.png`, `rebel-d1440-after-card-add.png`, `rebel-m375-sticky.png`, `rebel-m375-collection.png`.
Limitation: the Fabric 375 sticky screenshot (`fabric-m375-sticky.png`) landed on the page footer, so Fabric's sticky bar is judged from DOM only (`sticky-add-to-cart` present, text "Black / XS Sale price $30.00 CAD ..."), not visually. Items not directly observed are marked `[INFERENCE]`.

Phase items (not gaps): the 4 extra presets and full multi-language rollout.

## 2. Feature matrix (feature x Horizon x Rebel)

Legend: Y = present, P = partial, N = absent.

| Feature | Horizon 4.3.0 | Rebel | Evidence |
|---|---|---|---|
| Gallery layouts: grid 1/2 col, carousel, stacked | Y: `media_presentation` grid/carousel, `media_columns` one/two, `large_first_image`, `image_gap`, `aspect_ratio` adapt/1:1/1.25/2:1, `constrain_to_viewport`, `media_radius`, `extend_media` (`_product-media-gallery.liquid` schema) | P: single layout, Swiper slider + thumbs; only setting is `enable_lightbox` | `sections/main-product.liquid:8,61,148-153` |
| Thumbnails | Y: left/bottom/right, thumbnail width/radius, dots/counter/arrows/chevrons controls | Y: bottom Swiper thumbs (4.5 visible), no position option | `assets/product.css:106-138` |
| Zoom | Y: full dialog, 18 imgs + 9 thumbs, drag-zoom wrapper, hi-res swap (`zoom-dialog.js`, `drag-zoom-wrapper.js`; measured `zoomInfo` thumbs 9, imgs 18, dragZoom true) | P: lightbox opens a single image, no thumbs, no counter, no pinch/drag zoom (measured imgs 1, thumbs 0, counter false, zoom-on-click none->none) | `capture3-rebel.json` lightbox; `assets/product.js:849-960` |
| Video / external video | Y | Y: `video`, `external_video` slides (`data-video-host`), `initVideoSlides` | `product.js:611`; `product-media-item.liquid` |
| 3D model + view in space | Y: `first_3d_model`, XR button | Y: `model_viewer_tag`, XR button (`data-shopify-xr`) | `product-media-item.liquid:67-81` |
| Variant-media filtering (`hide_variants`) | Y: setting `hide_variants`, shows only variant images | N: featured image follows variant (`featured_media || featured_image`), all media stay | `_product-media-gallery.liquid`, `product-media-gallery-content.liquid:28-40`; Rebel `product.js:274` |
| Mobile swipe | Y | Y (Swiper) | |
| Variant UI: buttons / dropdown | Y (`picker_type`, `variant_style`, `show_swatches`) | Y: buttons or dropdown | `blocks/variant_picker.liquid:13-20` |
| Colour/pattern swatches (native `option_value.swatch`) | Y: variant-swatches, swatch size/shape settings | Y: native swatch + `value.image` fallback; swatch for option names colour/pattern only | `snippets/product-variant-picker.liquid`, `swatch.liquid` |
| Unavailable / sold-out option state | Y: combos computed server-side via `data-option-available`, optionally hides unavailable | Y: JS marks `data-unavailable` + disabled, line-through option (`cross_out_unavailable`) | `variant-picker.js:379-384`; `variant-picker.css:73-97` |
| Combined listings (`product_url`, `connected-product-url`, product swap without reload) | Y: `variant-main-picker.liquid:123-144`, `variant-picker.js:263,449`, `product-form.js:792` | N: no `product_url` / combined handling anywhere | grep sections/snippets/assets: no match |
| URL / history sync of variant | Y: `?variant=` morphing via section rendering | Y: `initVariantFromURL`, `history.replaceState` [INFERENCE from `product.js:80`] | |
| Price: compare-at, sale % badge | Y | Y: current / compare / tax notice; "Contact" when price 0 | `blocks/price.liquid:9-60` |
| Unit price (PDP) | Y (`product-price.js`) | Y: unit price in price block (cart line also) | `price.liquid`, `cart-line-price.liquid:17-21` |
| Quantity rules (min/max/step) | Y | Y: `updateQuantityRules` | `quantity_selector.liquid`, `product.js:597` |
| Volume pricing (`quantity_price_breaks`) | Y: `volume-pricing-info` table, cart quantity breaks | N | `buy-buttons.liquid:137-275`; Rebel grep: none |
| Selling plans / subscriptions | Y | Y: fieldset + plan picker, cart line shows plan | `buy_buttons.liquid:54-140`, `cart-line-details.liquid:17-21` |
| Gift card recipient form | Y | Y | `buy_buttons.liquid:19-30`, `product.js:1212` |
| Pickup availability | Y | Y | `blocks/pickup_availability.liquid` |
| Inventory messaging | Y: `product-inventory` block (exact / threshold) | Y: `stock_counter` low-stock threshold | `blocks/stock_counter.liquid` |
| SKU / barcode / vendor / type | Y (`product-sku`, custom property) | Y: `product_meta` block (sku, barcode, vendor, type, availability) | `templates/product.json:14-23` |
| Dynamic checkout | Y: `accelerated-checkout` block (`payment_button`) | Y: `show_dynamic_checkout` setting, `payment_button` | `buy_buttons.liquid:160-161` |
| Buy it now | Y | Y (own button when dynamic checkout off + sticky "Buy now") | `buy_buttons.liquid:145-158` |
| Sticky add-to-cart | Y: `enable_sticky_add_to_cart`, `sticky-add-to-cart.js`; has variant label + price | Y: theme setting `product_sticky_addtocart`, bar at bottom after scroll, 131px high at 375, title/variant/price/ATC + Buy now (measured bottom 812 of 812) | `product-sticky-add.liquid`; `rebel-m375-sticky.png` |
| Add-to-cart feedback | Y: `fly-to-cart.js` animation, `add_to_cart_animation` setting, error text in button (`product-form-text__error`), live region | P: button loading state, toast or drawer open (`cart:item_added`), no fly animation; errors via toast | `product-form.js:105-125`; Rebel `product-card.js:30-38`, `cart-modal.js:246-256` |
| Recommendations / complementary | Y: `product-recommendations` block, related/complementary types, grid/carousel | Y: separate `complementary-products` + `product-recommendations` sections | `templates/product.json:97-110` |
| Recently viewed | Y (`recently-viewed-products.js`, powers empty predictive search too) | Y: `product-viewed` rendered on PDP | `main-product.liquid:101`, `product.js:1094-1160` |
| Accordion / tabs / text / icons / share / custom liquid / popup | Y: accordion, text, icon, `product-custom-property`, `popup-link`, `share-button` | Y: tabs, collapsible_row, icon_with_text, share (6 networks), custom_liquid, size_chart (modal) | `blocks/*.liquid`; `size-guide-modal.liquid` |
| Product rating | Y (Shopify reviews metafield) | Y: `rating` block | `blocks/rating.liquid` |
| Quick add on card | Y: modal (`quick-add-dialog`) with full gallery, variant picker, quantity, price, "Buy it now"; single-variant adds directly; selling-plan or multi-option -> "Choose" | P: add-to-cart button on card (single variant adds), quick view modal with gallery, variant picker, qty | `quick-add.js`, `quick-add-modal.liquid`; Rebel `quickview-modal.liquid`, `product-card.liquid:131-` |
| Quick view | N (merged into quick add) | Y: separate quick view with SKU/vendor/availability, "Contact for price" | `rebel-d1440-quickview.png` |
| Cart drawer | Y: native `<dialog>`, `cart-drawer.js`, view transitions, section rendering morph | Y: `cart-modal` custom element role=dialog, own panel, remove/qty, note, discounts list, upsell collection | `cart-modal.liquid`, `cart-modal.js` |
| Cart type setting (drawer/page/notification) | Y: `cart_type` | Y: `cart_type` drawer/page/notification | `settings_schema.json:1243-1260` |
| Discount code input in cart | Y: `show_add_discount_code`, `cart-discount.js` | N: shows applied discounts only (`cart-total.liquid:12-17`, `.cart-modal-discounts`), no input | measured: cart page `discountInput:false`; Horizon `discountInput:true` |
| Cart note | Y: `show_cart_note` | Y: drawer + page | `cart-modal.liquid:67-73`, `main-cart.liquid:32-33` |
| Free-shipping progress bar | N | N | grep both: none |
| Cart upsell / recommendations | P: no recommended block in drawer [INFERENCE from `cart-drawer.liquid`] | Y: drawer collection (`cart_drawer_collection`) + `cart-recommendations` on cart page | `cart-modal.liquid:30-34`, `templates/cart.json` |
| Accelerated checkout in cart | Y: `show_accelerated_checkout_buttons` setting (default true) | P: cart page via `additional_checkout_buttons`; drawer: none (measured `accelerated:false` on Horizon drawers too) | `cart-total.liquid:39-43` |
| Empty cart state | Y: empty content + collection | Y: `empty_cart_button_link` equivalent, "view cart" | `cart-modal.liquid` |
| Cart error states | Y: quantity error, cart errors via live region | Y: `data-quantity-error role=alert`, toast | `cart-items.liquid:51`, `cart-modal.js:226` |
| Live regions / focus (a11y) | Y: 3 live regions in drawer (measured), focus on close button | P: one empty `role=alert`; drawer open focus to close button OK; Escape returns focus to header cart button OK; after removing a line, focus drops to `BODY` (measured) | `capture4.json` |
| Line-level discounts / selling plan / properties | Y | Y | `cart-line-details.liquid:17-57` |
| Performance (measured CLS, 1440 PDP) | Fabric 0.0050 | Rebel 375: 0.000012 | `capture*.json` |

## 3. Gap table

| # | Gap | Severity | Horizon evidence | Rebel evidence | Merchant/shopper impact | Effort | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | No discount-code field in cart drawer or cart page | Should (core merchant expectation for promo-led stores) | `cart-summary.liquid` + `cart-discount.js`; setting `show_add_discount_code` default true; measured Fabric/Vessel drawer `discountInput:true` | `cart-total.liquid:12-17` only lists applied discounts; no input in `cart-modal.liquid`/`main-cart.liquid`; measured `discountInput:false` on /cart | Shopper must wait for checkout to try a code; abandonment risk and merchants cannot advertise cart-stage codes | M | Add `show_add_discount_code` setting; small form posting to `/cart/update.js` with `discount` field then re-render summary; reuse existing `.cart-modal-discounts` list |
| 2 | Variant-media filtering absent | Should | `hide_variants` in `_product-media-gallery.liquid`; `product-media-gallery-content.liquid:28-40` | Gallery always lists all media; only the featured slide changes (`product.js:274`) | Products with many colours show every colour's images; confusing for apparel (Rebel's core catalogue) | M | Add `hide_variants` to main-product settings; filter media by variant `attached_to_variant` and re-render on variant change |
| 3 | Zoom is a one-image lightbox with no pinch/drag zoom, no thumbs, no counter | Should | `zoom-dialog.js` (thumbs, hi-res swap, scroll-sync), drag-zoom-wrapper; measured thumbs 9 / imgs 18 / dragZoom true | `product.js:849-960`; measured lightbox imgs 1, thumbs 0, counter false; zoom-on-click none->none (`capture3-rebel.json`) | Weak close inspection of garment detail on mobile and desktop | M | Extend `ProductLightbox` to all media with thumbs + counter and a pan/zoom state (adapt pattern, not file) |
| 4 | Gallery has a single layout (no grid / stacked / carousel choice, no thumbnail position, no aspect-ratio control) | Could | Schema in `_product-media-gallery.liquid` (grid/carousel, 1-2 cols, aspect ratios, radius, constrain-to-viewport) | `main-product.liquid:148-153` only `enable_lightbox` | Merchant cannot tune PDP to catalogue; desktop gallery looks the same everywhere | M | Add `media_layout` (carousel/grid) and `aspect_ratio` settings; keep Swiper default |
| 5 | Combined listings not supported | Could | `variant-main-picker.liquid:123-144`, `variant-picker.js:263,449`, `product-form.js:792` | no `product_url` / `connected` handling | Merchants using Shopify's Combined Listings app get plain links/no cross-product swatches | L | Support `product_url` on option values and fetch/replace the product section on swatch change |
| 6 | No quantity price breaks / volume pricing UI | Could (B2B / wholesale only) | `buy-buttons.liquid:137-275` (table, collapsible rows); `volume-pricing-info` | none | B2B or tiered-price merchants cannot show price breaks | M | Add `volume_pricing` block/snippet driven by `variant.quantity_price_breaks`; show in cart line too |
| 7 | Drawer a11y: line removal drops focus to `<body>`; only one empty alert region | Should | Fabric drawer measured `live:3` regions; focus kept on controls | Measured `focusAfterRemove: BODY.gradient...`; `liveRegionsInDrawer:["alert:"]` | Keyboard and screen-reader users lose place and get no "item removed / total updated" announcement | S | After cart re-render move focus to next line remove button or close button; add one polite status region fed from `renderCart` |
| 8 | No add-to-cart motion feedback (fly-to-cart) and no inline error text on button | Could | `fly-to-cart.js` (80 lines), `add_to_cart_animation` setting, `product-form-text__error` | button loading + toast/drawer only (`product-card.js:30-38`) | Less tactile confirmation when drawer auto-open is off | S | Add optional lightweight animation setting; keep errors in alert region |
| 9 | Quick add on mobile hides quick view; quick add/modal not equal to Horizon's full flow (multi-option product -> "Choose" -> modal with full gallery and variant picker) | Could | `quick-add.js`, `quick-add-modal.liquid`, `quick-add.liquid:16-60` (selling plans -> "Choose") | Mobile card: `quickviewVisible:false, addVisible:true, addSize:40` (`capture3-rebel.json`); desktop quick view exists with picker (`quickview-modal.js`); card add button on multi-variant products relies on JS [INFERENCE] | Mobile shoppers cannot pick a size from the grid without leaving the page [INFERENCE, needs one device test] | M | Keep quick view; on touch devices make the card button open the quick view when the product has options or requires a selling plan |
| 9b | Quick view price "Contact for price" product adds a button labelled "Contact" (add button repurposed) | Could (data/edge) | n/a (Horizon hides ATC when price 0 [INFERENCE]) | `quickview-modal.js:329-331`, measured `qv.text` "Contact for price ... View" | Confusing for a zero-price test product | S | Show a contact link, not an ATC button |
| 10 | Cart drawer has no accelerated checkout (neither does Horizon) | Could | measured `accelerated:false` on Fabric/Vessel drawers | `cart-total.liquid:39-43` page only | Parity, not a gap vs Horizon | - | Optional: expose `additional_checkout_buttons` in drawer |
| 11 | No free-shipping progress bar | Could | not in Horizon either | none | Revenue lever, differentiator not parity | S | Optional setting: threshold in money, progress in drawer + cart page |

Gap 10 and 11 are recorded because the owner asked about them; both are equal to Horizon.

## 4. Rebel equal-or-better

- Sticky add-to-cart includes thumbnail, variant, price and Buy now; at 375 it is 131px tall and sits flush at bottom (measured), with a theme-level setting.
- Selling plans, gift-card recipient form, pickup availability, low-stock counter, SKU/barcode block, rating, size-guide modal, tabs/collapsible rows, 6-network share: all present with real code.
- Quick view modal shows SKU, vendor, availability, quantity and variant picker (`rebel-d1440-quickview.png`); Horizon has quick add only.
- Cart: both drawer note and cart-page note, line-level discounts/selling-plan names/unit price, `cart_type` drawer/page/notification, drawer upsell collection and `cart-recommendations` section on the cart page (Horizon's drawer has none [INFERENCE]).
- Cart page uses clear order summary with checkout and continue shopping; layout verified in `rebel-d1440-cart-page.png`.
- Layout stability: measured CLS 0.000012 on Rebel mobile PDP vs 0.0050 on Fabric desktop.
- Focus on open goes to the drawer close button and Escape returns focus to the header cart button (measured), matching Horizon.
- Visual hierarchy on mobile PDP: H1 24px, price 24px, full-width 345x48 CTA in brand red `rgb(188,30,44)` (measured) - strong buy-box clarity; the CTA sits at y=1162 so it is below the 812px fold on 375, whereas Fabric's was also below the fold (y=863).

## 5. Open questions

1. Is variant-media filtering needed for Rebel's single-preset catalogue (many colourways) or is the current "featured image follows variant" intended?
2. Should the desktop gallery be a 2-col grid (Horizon default) rather than a carousel? Needs owner/design decision.
3. Mobile card quick add for multi-option products: confirm on a real touch device what the card ATC does for products with sizes.
4. Is discount-code entry in the cart in scope for the Theme Store submission? It is not a hard requirement, so I rated it Should.
5. Fabric sticky bar was not visually captured; recapture if parity there matters.

Status: DONE_WITH_CONCERNS
Summary: Report written with feature matrix, 11 gaps (1 combined with parity notes), live captures for Fabric/Vessel/Rebel; sticky bar on Fabric, mobile quick-add behaviour and a few Horizon claims are DOM/code-only or `[INFERENCE]`.
