# Yarrow preset and demo store - 2026-10-31

Branch `feat/preset-sage` (from `5f0e435`). Second Theme Store preset for Sartor, targeting the Health and beauty category. The preset was first built as `Sage`; it was renamed `Yarrow` because "Sage" is the name of a widely used WordPress starter theme (Theme Store naming rule: no name already used on another platform). A search found no theme named Yarrow on the Shopify Theme Store, WordPress, ThemeForest, Squarespace or Wix. The demo brand stays "Sage Botanicals".

## What exists now

| Item | State |
|---|---|
| Preset `Yarrow` in `config/settings_data.json` | Herbal palette, serif headings, rounded cards, vertical-lift hover. |
| `listings/yarrow/` | 7 templates (index, product, collection, blog, page.about, page.contact, page.faq) and the header/footer section groups. |
| `listings/sartor/` | Templates and section groups copied from the live Sartor demo, so both presets have listing folders. |
| `listings/manifest.json` | Lists both presets with handle and description. |
| Demo store | `sage-botanicals-awx3grhp.myshopify.com` (client transfer store), theme `Sartor (Yarrow)` #190022975798 published with preset `Yarrow` current, storefront password from `REBEL_SHOPIFY`, Test payment gateway (Bogus) active. |
| Demo catalog | 8 products, category metafields and metaobjects, reviews rating, subscription selling plan, color-pattern swatches on the lip balm, recommendations, 5 collections, about/faq/contact pages, Journal blog with 3 articles, menus, policies. |
| Product images | Regenerated with ai-image-studio: 8 heroes on Wan `wan2.7-image-pro`, then 3 img2img variants per product (macro, lifestyle, flatlay) and 2 lip balm recolours (Rose, Berry). Every product now carries 4 images (lip balm 6, set 2), each lip balm variant links its own image. Old media was deleted from the products. |
| Listing screenshots | `sage-preset-261031/listing/yarrow-desktop.png` 2000x2496, `yarrow-mobile.png` 750x1334. Captured before the Wan images; recapture after the UI council round. |
| Package | `dist/sartor-v1.0.0.zip`, 325 files, 0.55 MB, contains `listings/yarrow` and `listings/sartor`. |

## Theme code changed

- `sections/featured-product.liquid`: when the section is in the first two, the first media is eager, `fetchpriority="high"` and preloaded, and its CSS is preloaded. Before this, the LCP image was lazy.
- `sections/announcement-bar.liquid`: the section owns the nav arrow geometry and colour (`--swiper-navigation-color: currentColor`). The deferred `swiper.css` used to move the arrows after first paint (CLS 0.336 mobile, 0.793 desktop on every route); measured CLS is now 0.
- `assets/product.css`: star rating styles for `blocks/rating.liquid`, which had no CSS.
- `scripts/package-theme.py`: ships `listings/` and fails when listing folders do not match the presets or contain files outside `<preset>/templates|sections`.
- `scripts/validate-locales.mjs`, `scripts/validate-schema-ranges.mjs`: also scan `listings/`.

## Gates

| Gate | Result |
|---|---|
| validate-locales | pass |
| validate-schema-ranges | pass (both presets, all templates and listings) |
| settings-usage | 228 global settings, 0 unread |
| package-theme | pass, 325 files |
| Template validator (settings ids, select options, range steps, block types) against section schemas | all 9 Sage files pass; it also caught that resource values (product, collection, blog, image) are not allowed in listing JSON, so those are set only on the demo store copy |
| CLS, real `layout-shift` entries, 375 and 1440 on home, collection, product, journal | 0 |
| Lighthouse, 3 cold runs per page, password bypass cookie | desktop avg 96 (a11y 100); mobile avg 54.3 (a11y 99.6) |
| `theme.qa_validate` home and PDP at 1440 and 375 | FAIL / STRUCTURAL, no CERTIFIED receipt |
| Shopify Theme Check (approved run, `OPT_OUT_INSTRUMENTATION=true`) | 213 files inspected, no offenses, exit 0 |

Mobile Lighthouse is noisy on this machine: benchmark index 654-1110 across runs, correlation 0.47 with the score. The same machine gives the Sartor demo a mobile average of 54.6, so Sage is not slower than the shipped preset. Individual Sage home runs reached 70-83 in high-benchmark runs after the preload change. Treat the 60 mobile threshold as not proven.

Remaining `theme.qa_validate` findings and why they are not fixed:

- `image-crop`: square product photos inside portrait or landscape frames with `object-fit: cover`. Intended framing.
- `title-scale` at 375: `icon-boxes` heading 20px next to 24px section headings; the merchant controls `heading_size`.
- `state_matrix` on `footer-actions-menu__toggle`: an inline disclosure list (`position: static`, no dialog role), not a drawer, so "no close control" and "Escape does not close" do not apply.
- `floating-widget-overlap` on the PDP at 375: measured before lazy content settled. At the real page end the back-to-top button (y 625-665) does not touch the policy links (y 509-561), and nothing but padding sits under the sticky add-to-cart bar.

## Not done

- No push of the branch or the docs site.
- The Lighthouse JSON files (55 MB) stay local in `sage-preset-261031/lighthouse/` and are not committed.
