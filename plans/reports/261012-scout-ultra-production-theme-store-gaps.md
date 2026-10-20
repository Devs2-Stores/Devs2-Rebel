# Scout Report (ultra) - Rebel: remaining gaps before production / Shopify Theme Store

Date: 2026-10-12 · Root: `E:/Work/shopify` · HEAD `d4a44dd` + 233 uncommitted entries (git dir `.git-nested`) · Mode: `ak:scout --ultra` (5 read-only scout candidates + 1 `kongming` union verifier + controller corrections)
Authority: official requirements mirror `runs/.theme-store-requirements-261012.md` (fetched from `https://shopify.dev/docs/storefronts/themes/store/requirements.md` on 2026-10-12) and `runs/.input-settings-261012.md` (input settings docs, focal points).

## Verdict

Not ready for Theme Store submission. Theme code has two hard feature gaps (search facets, rich media outside the PDP) and a cluster of install-state gaps (placeholders, pickup block, Custom Liquid block, font variants). Off-code gates are all open: documentation and support domains do not resolve, no support form, no release notes, no Lighthouse evidence, and one dev store instead of one client transfer demo store per preset. Repo-local validators are green.

## Ranking

| Candidate | Coverage | Evidence quality | Signal density | Honesty | Total /80 | Rationale |
|---|---|---|---|---|---|---|
| A | 20 | 20 | 19 | 20 | 79 | Widest T1-T6 coverage; every finding matched disk. |
| B | 18 | 20 | 19 | 19 | 76 | Clean evidence; unique pickup-availability install-state finding. |
| D | 18 | 17 | 18 | 18 | 71 | Unique `font_modify` finding; marked gift card form as OK. |
| C | 17 | 14 | 17 | 16 | 64 | Good placeholder coverage; repeated a stale hardcoded-string finding. |
| E | 17 | 11 | 16 | 12 | 56 | Unique order-discount finding; three stale or false findings. |

Scores are the verifier's. Controller corrections below change severities, not the ranking.

## Gap Findings (corrected)

Severity: Blocker = submission fails without it; High = stated "must" or reviewed install state; Medium = "should" or a support risk; Low = hygiene.

| ID | Target | Severity | Status | Finding | Evidence | Official ref | Fix direction | Raised by |
|---|---|---|---|---|---|---|---|---|
| U-01 | T1 | Blocker | fail | Search page has no faceted filtering. | `sections/main-search.liquid:49-139`: only `object_type` tabs and pagination; no `search.filters` | req L111 "You need to support faceted search filtering on collection pages and search pages" | Render `search.filters` through the existing `snippets/collection-facet-filter.liquid` and active-filter chips; keep the section-render JS contract. | A B C D E |
| U-02 | T1 | Blocker | fail | Featured product and quick view render images only, no video, external video or 3D model. | `sections/featured-product.liquid:26-30` (`product.featured_image`); `templates/product.quickview.liquid:23-24` (`product.images`) | req L147 "Include rich product media in the product template, featured product section, and product forms such as quick view" | Iterate `product.media` and reuse the `main-product` media renderer for `video`, `external_video` and `model`. | A B C D E |
| U-17 | T3 | Blocker | fail | `theme_documentation_url` and `theme_support_url` do not resolve. | `curl: (6) Could not resolve host: docs.devs2.com` and `devs2.com` (run 2026-10-12) | req L760-762 docs and contact form must be live before launch | Host docs and support, then update `config/settings_schema.json` theme_info. | A B C D E |
| U-18 | T3 | Blocker | fail | No public merchant support contact form. | Support host unresolvable; nothing in repo | req L762, L790 (form fields include file upload) | Build the support form with the required fields and auto-response. | D E |
| U-19 | T3 | Blocker (was High) | fail | No release notes or changelog. | 0 files matching `changelog` or `release notes` outside `_reference` | req L719: submission needs a version number and release notes | Write v1.0.0 release notes and keep them in sync with `theme_version`. | A B C D E |
| U-20 | T3 | Blocker | fail | 5 presets ship, but only one dev store exists (`devs2-rebel`). | `listings/` has 5 preset folders; `listings/manifest.json` | req L727 client transfer store; L735 one demo store per preset, Bogus Gateway or test mode | Create one client transfer store per submitted preset, or submit fewer presets (see U-29). | A B C D E |
| U-21 | T3 | Blocker | needs-evidence | No Lighthouse benchmark evidence (perf >= 60, a11y >= 90, home/product/collection, desktop and mobile). | 0 files matching `*lighthouse*` in the repo | req L220 | Run Lighthouse on the benchmark dataset and archive the reports. | A B C D E |
| U-13 | T2 | High (was Medium) | fail | Several image sections render an empty box or nothing when the image is blank. Because demo imagery does not transfer on install, this is what a fresh install shows. | `sections/image-text-overlay.liquid:39` empty div; `sections/parallax-image.liquid:22` empty div; `sections/layered-images.liquid:20-40` renders nothing | req L592-600 placeholders (lifestyle for full-width and overlay images); L707-711 install state | Use the `lifestyle-1`/`lifestyle-2` placeholder in the else-branches; for layered images use `image`. | C D |
| U-04 | T1 | High (was Blocker) | fail | The pickup availability block exists but no default or preset product template uses it, so a fresh install never shows pickup. | `templates/product.json` main-product `block_order` (11 blocks, no `pickup_availability`); same in all 5 `listings/*/templates/product.json` | req L135 | Add `pickup_availability` after `buy_buttons` in the root template and all 5 preset templates. | B |
| U-05 | T1 | High | fail | The footer `menu` block's `link_list` setting has no default. | `sections/footer.liquid` schema, block `menu`, setting `menu` (no `default`) | req L473, L810: Header/Footer `link_list` must default to `main-menu` or `footer` | Add `"default": "footer"`. Header half dropped, see Controller Corrections. | A B C D E |
| U-08 | T1 | High (was Medium) | fail | There is no Custom Liquid theme block. `main-product` accepts `@theme` blocks but `blocks/` has none with a `liquid` setting; `featured-product` accepts only `@app`. | `sections/main-product.liquid` schema blocks `['@theme','@app']`; `sections/featured-product.liquid` `['@app']`; no `blocks/*custom*` | req L204 "Add a Custom Liquid block anywhere you'd consider adding an app block" | Add `blocks/custom-liquid.liquid` (setting type `liquid`) and allow it in `featured-product`. | A C |
| U-10 | T1 | High (was Medium) | fail | The customer order page shows order-level discounts but not per-item discounts. | `sections/main-customers-order.liquid:136` (`final_price` only); order-level loop at `:154-159` | req L96: discount amounts "for individual items and for entire orders in the cart, checkout, and order templates" | Render `line_item.line_level_discount_allocations` and the original price strike-through. Also add subtotal and tax lines (`:152-172` has neither). | E |
| U-11 | T1 | High (was Low) | fail | Bold, italic and bold-italic variants are generated only for the body font. | `snippets/head-fonts.liquid:12-14,18-23` | req L611 "loads bold, italic, and bold-italic variants for each font using the `font_modify` filter" | Generate the variants for `type_header_font` and `type_subheading_font` as well. | D |
| U-23 | T4 | High (was Blocker) | risk | The release candidate is uncommitted: 233 status entries, staged 0. | `git --git-dir=.git-nested --work-tree=. status --short` gives 233 lines | Release hygiene, not a Store rule | Commit or branch before packaging, so the zip is reproducible. | A B C D E |
| U-29 | T6 | High | needs-decision | `AGENTS.md` says the current phase is one preset, English only. The repo ships 5 presets with demo assets. | `AGENTS.md` "Product Scope and Delivery Phases"; `listings/manifest.json`; `config/settings_data.json` presets | Project policy | Decide whether to submit 1 or 5 presets, then update `AGENTS.md` (the 2026-10-10 demo pass already built 5). | A B C D E |
| U-12 | T2 | Medium (was Blocker) | expected | Root and preset templates reference `shopify://shop_images/...` (33 in `templates/`, 360 in `listings/`). | Feature grep counts, 2026-10-12 | req L711 "Demo imagery doesn't transfer on install." | Expected behaviour. The risk is the blank state, which is tracked in U-13, U-09, U-14 and U-15. Keep the refs so preset previews match the demo stores. | A B C D E |
| U-14 | T1/T2 | Medium | fail | The video section uses `text` for `youtube_url` with no default, and Vimeo is not accepted. | `sections/video.liquid` schema: `text youtube_url default=None` | req L601 default YouTube video ID; L147 Vimeo or YouTube | Switch to `video_url` (`accept: ["youtube","vimeo"]`) with the Shopify default video URL. | A D |
| U-09 | T1 | Medium | fail | The collection card passes the collection title to `placeholder_svg_tag`, which is not a placeholder name. | `snippets/collection-card.liquid:45` | req L592-600 | Use `'collection-1'` (or a rotating `collection-N`) placeholder name. | A B C |
| U-16 | T2/T5 | Medium | risk | Demo copy carries the partner brand "Devs2" 228 times across 18 template files (store names, about page). | `templates/page.stores.json` (33), `templates/page.about.json` (4), the same files in each `listings/*` folder | req L710 "Adjust or remove copy that could cause support issues"; L643 applies to names only | Neutralise the partner brand in shipped template copy, or confirm that the demo-store copy is intended. | C D E |
| U-22 | T3 | Medium | needs-evidence | No browser or webview matrix evidence (Safari, Samsung Internet, Instagram/Facebook/Pinterest webviews). | E2E runs are Chromium-only | req L415-421 | Run and record the matrix. | A E |
| U-27 | T5 | Medium | fail | Settings copy breaks the text-style and terminology rules: 6 ampersands, `homepage` x1, `Slider` layout options, 9 Title Case names. | `locales/en.default.schema.json`: `Badges & tags`, `Payment & Follow`, `Sort & pagination`, `Spacer & Divider`, `Table of Contents`, `Flash Sale`, `First hero on the homepage...`, layout option `Slider` (featured_collection, testimonials) | req L481 sentence case; L514 no `&`; L536 `home page`; L539 `slideshow` not `slider` | Edit the locale values only; the keys stay unchanged. `Range slider` (an input control) can stay. | A B D |
| U-28 | T5 | Medium | carried-over | Demo store data: a selling plan name reads "ski wax", and legal policies are missing. | `plans/reports/demo-production-261010-release-readiness.md` (not re-probed live this run) | req L735 authentic demo content | Merchant/Admin action; the token cannot write selling plans. | A D |
| U-03 | T1 | Low (was Blocker) | partial | The gift card recipient form works but has no server-side `form.errors` or value repopulation for the no-JS path. | `blocks/buy_buttons.liquid:21-41` (property names identical to Dawn `snippets/gift-card-recipient-form.liquid:73,108`, plus `Send on` and `__shopify_offset`); inputs bound via the `form=` attribute | req L275 only requires the option to send to a recipient, which passes | Optional: move the fields inside `{% form 'product' %}` and render `form.errors` as Dawn does. | A B C E |
| U-06 | T1 | Low (was Medium) | partial | The hero and about sections add a custom focal-point select on top of the native focal point. | `sections/hero.liquid:49-50,349,353,651-703`; `sections/page-about.liquid` 6 custom refs | req L115; input-settings L1026-1029: `image_tag` injects inline `object-position` | Native focal points already work: every Shopify image goes through `image_tag`, and the inline style beats the class rule. The select is redundant and silently ignored once a focal point is set. The mobile `<source>` in `hero.liquid:111-127` reuses the desktop image's focal point. | A C E |
| U-15 | T2 | Low | fail | The logo-list placeholder uses `'image'` instead of the logo icon. | `sections/logo-list.liquid:61,87` | req L599 | Use the `'logo'` placeholder name. | A |
| U-24 | T4 | Low | risk | `listings/manifest.json` ships in the zip; the documented preset structure lists only `listings/<preset>/templates` and `sections`. | `scripts/package-theme.py:3` includes `listings`; `.shopifyignore` has no `manifest` rule | req L672-699 | Ignore `listings/manifest.json` when packaging (the `listings/` folder itself is required). | A B C D E |
| U-25 | T4 | Low | fail | The author name differs: `Devs2` vs `Devs2 Team`. | `config/settings_schema.json` theme_info; `listings/manifest.json:4` | - | Align the two. | B |
| U-26 | T4 | Low | risk | CI builds the zip but does not upload it as an artifact. | `.github/workflows/theme-store-ci.yml` last step | - | Add `actions/upload-artifact`. | A |
| U-30 | T6 | Low | needs-decision | The master plan lists a `volume_pricing` block that does not exist. This is not a Theme Store requirement: the mirror has 0 hits for volume pricing or quantity rules. | `plans/260919-master-pdp-plp-remediation-plan/plan.md:41,76,429` | - | Defer or close it in the plan. | A |
| U-07 | T1 | DROPPED (was Blocker) | - | Social settings use `placeholder` with shopify.com example URLs. | `config/settings_schema.json:1158-1188` | req L463 | Dropped: Dawn ships the identical pattern (`_reference/dawn/config/settings_schema.json:1310-1328`). See Controller Corrections. | B C D |

## Dropped by the verifier

1. Hardcoded English in `sections/hero.liquid:224`, `sections/main-gift-card.liquid:16` and `sections/main-search.liquid:60-63` (C, E). Stale: all three lines use `| t` or merchant settings, and the locale validator passes.
2. Cart loop re-emits `<link>`/`<script>` per line (E). False: the assets load at the top of `snippets/cart-items.liquid:1-2`, which `sections/main-cart.liquid:27` renders once.
3. Hero mobile image lacks `fetchpriority` (E). Stale: it is present at `sections/hero.liquid:72,134`.

## Controller Corrections

- **U-07 dropped.** Dawn, Shopify's own Theme Store theme, uses `"placeholder": "t:...social_*.info"` with shopify.com URLs (`_reference/dawn/config/settings_schema.json:1310,1316,1322,1328`). Rule L463 most plausibly targets prefilled values; there are no defaults here.
- **U-05 header half dropped.** `customer_account_menu` defaulting to `customer-account-main-menu` matches Horizon (`_reference/horizon/sections/header.liquid:1200`). The footer half stands.
- **U-03 Blocker → Low.** The property names, `Send on`, `__shopify_send_gift_card_to_recipient` and `__shopify_offset` all match Dawn. The only delta is the no-JS error repopulation.
- **U-06 Medium → Low.** `image_tag` applies native focal points automatically (input-settings L1029). A scan found 0 raw `<img>` built from `image_url` in sections, snippets, blocks, templates or layout.
- **U-12 Blocker → Medium; U-13 Medium → High.** Requirement L711 says demo imagery never transfers. The shop_images refs are expected, and placeholder coverage decides what reviewers and merchants see on install.
- **U-04 Blocker → High.** The feature exists as a block; only the install state is missing.
- **U-08, U-10, U-11 → High.** Each is backed by explicit requirement language: L204, L96, and L611.
- **U-19 High → Blocker.** L719 makes release notes a submission prerequisite.
- **U-23 Blocker → High.** It blocks reproducible packaging, but no Store rule requires it.

### Controller-only checks (verified OK)

- No external `<script src="https://...">` in any Liquid file (L393: scripts must be hosted on Shopify).
- No link to a Shopify domain that needs `rel="nofollow"`: 0 `href="https://*shopify*"` hits.
- No wishlist and no discount-code input; the cart shows discount applications only (L393 app-like features).
- The stock counter reads real `inventory_quantity` (`blocks/stock_counter.liquid:13,30`). Countdowns read merchant `end_date` (`sections/hero.liquid:212`, `sections/main-collection.liquid:160`). No fake urgency (L393).
- The Custom Liquid section has no `enabled_on`/`disabled_on`, so it is available on all templates (L200).

### Verified OK (verifier, spot-checked where cited)

Theme name `Rebel` matches its preset, with no company name. `<shopify-account>` is in the header and mobile menu. Accelerated checkout is on the PDP and cart. Unit price shows on card, PDP and cart. `cart.taxes_included` is used. The cart shows line and order discounts, selling plan names, and cart notes. Swatches use `swatch.image`/`swatch.color`. The gift card page has an Apple Wallet pass and a 144px QR code. The password page is complete. The localization form is in the footer. Follow on Shop is present. Header and footer section groups exist. Fonts use `font_picker`. Head meta tags include OG, Twitter and JSON-LD. There are no `.scss` files and no `config/markets.json`.

## Corrected severity order

1. Blocker, code: U-01, U-02.
2. Blocker, off-code: U-17, U-18, U-19, U-20, U-21.
3. High: U-13, U-04, U-05, U-08, U-10, U-11, U-23, U-29.
4. Medium: U-12, U-14, U-09, U-16, U-22, U-27, U-28.
5. Low: U-03, U-06, U-15, U-24, U-25, U-26, U-30.

## Baseline checks run this session

- `node scripts/validate-locales.mjs`: exit 0. `node scripts/validate-schema-ranges.mjs`: exit 0. `node runs/e2e/settings-usage.cjs`: selftest true, 947 settings, 0 unread.
- `curl` docs/support: DNS failure for both. Dev server `127.0.0.1:9292`: 200.
- `git status --short`: 233 entries.
- Not run: `shopify theme check` (needs approval), Lighthouse, live demo-store probes, browser/webview matrix.

## Unresolved Questions

1. Preset scope for the first submission: 1 preset, which needs no `listings/` and one demo store, or 5 presets, which need 5 client transfer stores. This drives U-20 and U-29.
2. Which domain and platform will host the docs and the support form (U-17, U-18)?
3. The hero countdown block defaults `end_date` to `2026-12-31T23:59:59` (`sections/hero.liquid:1207`). Behaviour after expiry, and whether a fixed date satisfies "defaults should indicate how to use the setting" (L473), were not verified.
4. Whether the Theme Store uploader accepts `listings/manifest.json` (U-24) is unverified. Excluding it is the safe path.
5. The Theme Check result on the current working tree was not re-run in this session.

## Ranking Appendix - label map

- A = ScoutCand2, B = ScoutCand3, C = ScoutCand5, D = ScoutCand1, E = ScoutCand4.
- The verifier is the `kongming` agent. Model-tier parity between the candidates and the verifier was not verified, so treat this as a best-of-5 with rubric selection, not a proven asymmetric verification.
- Verifier raw receipt: `ultra: union=30/33 single_candidate_only=7`. The controller dropped U-07.

ultra: union=29/33 single_candidate_only=7
