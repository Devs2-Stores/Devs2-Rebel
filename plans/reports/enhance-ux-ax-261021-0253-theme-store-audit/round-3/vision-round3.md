**Round 3 vision review.** All the intended changes landed except one: the Outerwear H1 is still bold. Two new regressions showed up. On mobile, the carousel arrows on the product and gift-card pages now overlap the quick-add bag and the sale badge. On every collection page the title now has a double divider under it. All before and after images loaded; none failed. The full-page shots are too tall to judge at screen size, so I judged them from crops and slices kept outside the repo.

Paths below are relative to `plans/reports/enhance-ux-ax-261021-0253-theme-store-audit/`: "after" means `round-3/capture-after/` and "before" means `round-1/capture/`.

| # | Severity | Route | Viewport | Screenshot file | What you see | Suggested change |
|---|---|---|---|---|---|---|
| **Regressions** | | | | | | |
| 1 | Med | product (bomber) | mobile | after `mobile-product-full.png` y≈1925–2150; before `mobile-product-full.png` | In "You may also like" the cards are now 2-up. The prev/next arrows are centred on the whole card, which includes a 7-line title, so they drop to the bottom edge of the image. The ">" box overlaps card 2's quick-add bag. Before, the arrows sat at mid-image, clear of the bag. | Centre the arrows on the image only, or hide them below 750px (swipe plus the peek is enough), or move them into the section header as on "Trending now". |
| 2 | Med | product-gift-card | mobile | after `mobile-product-gift-card-full.png` y≈2100–2335; before same file | The "<" arrow box sits over the "-17%" badge on card 1, which is partly hidden. The ">" arrow butts against card 2's quick-add bag. Before, the badge, bag and arrows were all separate. | Same fix as #1. Keep the badge clear of the arrow area. |
| 3 | Med | collection-all, collection-outerwear | all | after `desktop-collection-all-first.png` (rules at y257 and y282), `desktop-collection-outerwear-first.png` (639/668), `tablet-collection-all-first.png` (226/251), `mobile-collection-all-first.png` (242/267, then 440) | With Best Sellers gone, the title's bottom rule and the main section's top rule now stack 25–29px apart, so a double line shows above the fold. At 375px there are three rules within about 200px. Before, there was one rule. | Remove the main section's top border when it directly follows the title, or remove the title's border. Close the gap. |
| 4 | Low | product (bomber) | tablet | after/before `tablet-product-full.png` | The square, uncropped image is shorter. The gallery now ends at y≈629 instead of 799, so the empty left column beside the buy box and description grew from about 570px to about 740px. This makes an existing gap worse. | Make the media column sticky at 750px and up, or widen it, or stack the layout at 768px. |
| **Intended change that did not land** | | | | | | |
| 5 | Med | collection-outerwear | all | after `desktop-collection-outerwear-first.png` (x≈868, y≈351), tablet and mobile (y≈548) `*-collection-outerwear-first.png` | The "Outerwear" H1 is still bold. Pixel ink in the H1 area is identical before and after at all three widths (desktop 1642.0 = 1642.0). All Products, cart, search and collections H1s did change, so the two collection layouts now use different weights. | Give the title in the hero-split collection layout weight 400 as well. |
| **Other new issues** | | | | | | |
| 6 | Low | home (Trending) | mobile | after `mobile-home-full.png` y≈1880–1945 | The narrower 2-up cards wrap the range price as "$45.00 USD – $245.00 / USD", leaving "USD" alone on a line. | Show the currency once ("From $45"), or keep each amount on one line. |
| 7 | Low | product (recommendations) | mobile | after `mobile-product-full.png` y≈2200–2320 | At 2-up width, the trousers title runs to 7 lines. That makes the card tall, which is what pushes the arrows down in #1. | Clamp card titles in carousels to 2–3 lines. |
| 8 | Low | article | mobile | after `mobile-article-first.png` y≈138 | The breadcrumb is on one line, but it reads "Sustainable Fashion …   /Bio-Textiles: Myceliu…": a wide gap before the second "/" and no space after it. The first separator has a space on each side. The middle crumb is truncated as well as the last one. | Put the separator in its own element with equal margins, outside the truncating text. Truncate the last crumb first. |
| 9 | Low | article | mobile | after `mobile-article-full.png` y≈3200–3460 | The table now scrolls and the headers stay whole ("ALGAE APPLICATION"). The only hint that it scrolls is the clipped "ENVIRONMENTAL BEN…" column. | Add a fade on the right edge or a small "scroll" hint. |
| 10 | Low | home | tablet | after `tablet-home-first.png` vs `tablet-home-loaded.png` (y≈930) | At first paint only the "1/3" pill shows. The pause button and pagination bars appear only after JS, and the heading moves down about 2px. Desktop and mobile first paints show the controls. This may be capture timing. | Render the pause button and pagination in Liquid with a fixed size. |
| 11 | Low | product (recommendations) | desktop | after `desktop-product-full.png` y≈1500–1937 vs before (bag at y≈2000) | A change that was not on the list: the quick-add bag no longer shows at rest on desktop recommendation cards. It used to sit bottom-centre on every image; mobile cards still have it. | Confirm this is intended (hover-only). If not, put it back. |

**Verdict per surface:**
1. **Home: LANDED.**
   - Slide 1 heading and "Shop the collection" show in the first viewport at all three sizes (`desktop/tablet/mobile-home-first.png`).
   - Trending shows 2 cards at 375px.
   - The empty featured-product box and the Journal band are gone (`mobile-home-full.png`, `desktop-home-full.png`).
   - Of the icons I measured, only the header bag and the collection toolbar icons got thinner (bag ink 68→51, now matching search and account). The rest were unchanged.
2. **Product and gift card: LANDED, with regressions #1, #2 and #4.**
   - The main image shows square and uncropped (`desktop/mobile-product-first.png`).
   - "You may also like" shows 2 cards plus a peek at 375px.
   - The gift-card pills are rounded and the struck text now reads at 7.21:1, up from 1.28–1.53 (`desktop/mobile-product-gift-card-first.png`).
3. **Collection: PARTIAL.** Best Sellers is gone and the filters and grid follow the title. The All Products H1 is regular. Sale ranges show crimson with the compare price struck (`desktop-collection-all-full.png`). The Outerwear H1 is still bold (#5).
4. **Article: LANDED.** The table scrolls with headers on one line, and the breadcrumb is on one line (`mobile-article-full.png`, `mobile-article-first.png`). Meta text measures 7.21:1, the same as before, so it was already readable.
5. **Blog, FAQ, stores, cart, search, collections: LANDED.**
   - FAQ shows "Ask the studio" and has no "Tell visitors…" copy or empty help block (`desktop-faq-full.png`).
   - The stores filters read "City or region" and "Area" (`desktop/mobile-stores-first.png`).
   - Cart, search and collections H1s carry 24–32% less ink, i.e. regular weight (`z-t-*-h1` crops).
   - The crimson cart badge was in 48 of 48 before shots and is in 0 of 144 after shots.

My temporary crops (about 63 PNGs plus `crop.py`) are still in `C:/Users/Admin/AppData/Local/Temp/round3vision/`, outside the repo. Main asked me to delete them, but the destructive-command rule blocked `rm` without the user's approval. If the user approves, the command is `rm -r C:/Users/Admin/AppData/Local/Temp/round3vision`. It can't be undone, but the crops can be regenerated.

Status: DONE_WITH_CONCERNS