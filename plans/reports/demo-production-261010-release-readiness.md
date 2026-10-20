# Demo content and production readiness - Rebel - 2026-10-10

Scope: generate the complete demo image set for the theme and its four extra
presets, publish it to `devs2-rebel.myshopify.com`, clean the demo catalogue,
and fix the open code findings from
`plans/reports/code-review-ultra-261010-pending-changes.md` and the
production gap audit. No theme push was run. `config/settings_data.json` was
not edited.

Status: **DONE_WITH_CONCERNS**. All theme-side gates pass. The remaining items
are merchant-owned store settings or need Admin permissions the API token
lacks (see "Open items").

## 1. Images (ai-image-studio, AI Box)

Pipeline: `runs/demo-images/gen-batch.mjs` wraps the skill backend. Heroes use
`wan2.7-image-pro` and variations use `qwen-image-3.0-pro` img2img from the
hero. Every output was sharp-compressed with mozjpeg at q80. Each batch writes
a `*.manifest.json`.

| Batch | Jobs | OK | Content |
|---|---|---|---|
| `rebel-jobs` | 36 | 36 | Rebel preset: 32 store photos, 3 timeline events, blog sidebar banner |
| `logo-jobs` | 6 | 6 | Press logo strip |
| `rebel-mobile-jobs` | 5 | 5 | Portrait crops for slides and the hero overlay |
| `rebel-fix*` | 7 | 7 | Re-renders, including a text-free image for the image-text overlay |
| `product-jobs` + redo | 86 | 86 | Six-angle sets for the 18 test products, plus variant images |
| `preset-jobs` | 104 | 104 | Noir / Vibrant / Botanical / Cyber restyles of every Rebel slot |
| `preset-fix-jobs` | 8 | 8 | v2 hero and About images for the presets |
| `preset-mobile-jobs` | 20 | 20 | Preset portrait images |
| `preset-tile-jobs` | 16 | 16 | Preset collection-list tiles |
| `balm-gift-jobs` | 6 | 6 | Leather Care Balm (5 images, 3 variant images) and the gift card |
| smoke / mobile test | 3 | 3 | Pipeline smoke tests |

Total: 297 generations, 0 failures. Every set was checked by eye on contact
sheets (`runs/demo-images/sheet-*.jpg`). Images with baked-in text or a
cropped subject were regenerated or recropped (top-anchored crops for the
preset tiles).

Asset weight: no raster image was added to the theme's `assets/`. The 317
local files (44.3 MB) stay in `runs/demo-images/`, which is git- and
Shopify-ignored.

## 2. Store publishing (Admin API, `.env` token)

| Area | Result | Ledger (in `runs/demo-images/`) |
|---|---|---|
| Files uploaded | 56 Rebel + 124 preset + 20 tile + product media; all `READY` | `uploads.json`, `preset-uploads.json`, `tile-uploads.json` |
| Product media | 21 products re-shot; old media detached from the products but kept in Files (nothing deleted) | `product-media-ledger.json`, `old-media-detach-ledger.json` |
| Product data | 19 test products now have English titles, copy, USD prices and `RBL-*` SKUs, with 19 `301` redirects from the old handles | `product-cleanup-ledger.json` |
| Ski wax | `selling-plans-ski-wax` became `leather-care-balm` (3 sizes: $32 / $58 / $14), with a `301` redirect | same ledger |
| Gift card | vendor set to `Devs2 Rebel`, new image | same ledger |
| Snowboard samples | 13 set to `DRAFT`; each prior status is recorded for revert | `snowboard-status-ledger.json` |
| Collections | 12 restructured: membership, image, alt text, description | `collection-restructure-ledger.json` |
| Menus | 6 menus rebuilt: 111 links with 67 broken became 66 links with 0 broken. Pages `stores` and `faq` published | `menus-before.txt`, `menus-after.txt`, `menus-update-result.json` |

## 3. Theme repository changes

- Image references: `templates/{index,page.about,page.stores,blog}.json` and
  `listings/{rebel,noir,vibrant,botanical,cyber}/templates/*.json` now point
  at the uploaded `shopify://shop_images/*` files. The four presets no longer
  reuse Rebel images. All 202 template image references resolve to existing
  Files.
- Announcement bar: `sections/header-group.json` now reads "New season: the
  tailored anti-uniform has landed".
- Production code fixes from the gap audit: X01 theme renamed to `Rebel`,
  F03, F04, F07 (40 sections moved to `t:` keys), F08, F09, F10-F15, X02, X04
  (the countdown banner custom element moved to `assets/countdown-banner.js`).
  The per-item file list is in the `ProdCodeFixes` agent output.
- Controller fixes:
  - Quick view sold-out label is now locale-backed:
    `snippets/quickview-variant-picker.liquid`, `assets/quickview-modal.css`.
  - The filter "Show more / Show less" toggle is now locale-backed:
    `snippets/collection-facet-filter.liquid`, `assets/collection.js`.
  - Mobile menu child detection: `snippets/mobile-menu.liquid`.
  - The blog sidebar banner no longer overrides its visible text with an
    `aria-label`: `sections/main-blog.liquid`.

## 4. Verification

| Gate | Result |
|---|---|
| `shopify theme check` (user-approved) | 245 files inspected, no offenses, exit 0 |
| `node scripts/validate-locales.mjs` | exit 0 (after the final edit) |
| `node scripts/validate-schema-ranges.mjs` | exit 0 |
| JSON parse: `config`, `templates`, `sections`, `locales`, `listings` | 104 files, 0 invalid |
| `node --check assets/*.js` | 35 files, 0 failures |
| Journeys (`runs/e2e/journeys.cjs`) | 97 rows / 17 journeys: 96 pass, 0 fail, 1 info (dynamic checkout renders instead of the theme buy-now button) - `demo-production-261010/journeys/journeys-final.json` |
| axe WCAG 2.2 AA plus overflow, 375 and 1440 | 10 routes x 2 widths: 0 violations, 0 overflow - `demo-production-261010/axe-final.json` |
| Route probe | `/`, `/products/leather-care-balm`, `/collections/{all,accessories}`, `/search?q=balm`: 200, no Liquid errors, no missing translations; `/products/selling-plans-ski-wax` returns `301` to the balm |
| Full-page shots, 375 and 1440 | `demo-production-261010/shots/` - home, about, stores, PLP, PDP, blog reviewed |
| AntiFan `theme.qa_validate` (`run-47cae225`) | No Liquid errors, no broken assets (85 images), no overflow, 0 layout findings, CLS 0, 0 regressions. The verdict `FAIL` comes only from three pre-existing console messages: the dev HotReload reconnect, and `customer-account-main-menu` reported as not found by the Storefront API |

## 5. Open items

1. **Selling plan names still say "ski wax"** on `/products/leather-care-balm`.
   The plan groups belong to another app, and `sellingPlanGroupUpdate` was
   denied: it needs `write_purchase_options` and `manage_orders_information`.
   Rename them in Admin > Products > Leather Care Balm > Purchase options, or
   in the owning app.
2. **Legal policies**: `/policies/privacy-policy` returns 200. Terms of
   service, refund and shipping return 404. Create them in Settings >
   Policies; legal text was not generated. The `footer-legal` menu has 1 link
   until then.
3. **Home SEO**: the home page has no `og:image`, and the meta description is
   the bare store name. Set the social sharing image and the homepage meta
   description in Online Store > Preferences. Blog descriptions fall back to
   the store name.
4. **Store name**: the header logo text renders `shop.name` ("Devs2 Rebel").
   The theme name is now `Rebel`; the store name is merchant identity.
5. **`customer-account-main-menu`**: the menu exists in Admin (Orders,
   Profile), but `<shopify-account>` cannot read it through the Storefront API
   and falls back to its default items. This is platform-owned.
6. Carried over: the Vibrant and Botanical `scheme-4` body-text contrast
   limits; see `enhance-ux-ax-261010-0634-storefront.md`.
7. Delivery is user-controlled. Nothing has been pushed or committed. The
   suggested review step, which needs separate approval, is
   `shopify theme push --unpublished`.

## Reverting store changes

Every Admin mutation has a before-state ledger in `runs/demo-images/`.
Products, collections, menus and snowboard statuses can be restored from the
`before` fields. Detached media is still in Files.
