# Footer slice (FooterB)

All live results below are provisional (shared dev server). Probes: `scratch/FooterB/{measure,compose,social,sprite}.cjs`, baseline `before.json` and result `after.json`, `/collections/all` at 1440x900 and 375x812 (home hides the footer newsletter because it has a Newsletter section).

## 03 #12 Policy links - done
- `sections/footer.liquid`: `shop.policies` rendered in the bottom bar inside `<nav class="footer-policies" aria-label="Store policies">`, only when `policy.body != blank`; new section setting `show_policies` (default on).
- Evidence (1440 and 375): 4 links, `/policies/privacy-policy`, `terms-of-service`, `refund-policy`, `shipping-policy`. The store answers 200 for exactly those four and 404 for `contact-information` and `subscription-policy`, and neither is rendered.

## 01 #3 Composable footer - done
- Section-local block types (schema block list): `logo`, `brand`, `text`, `image`, `social`, `newsletter`, `menu`, `payment`, `@app`. Each block except `menu` and `newsletter` has a `placement` select (Brand column / Link columns / Bottom bar); `newsletter` renders above the columns, `menu` in the columns.
- Files: `sections/footer.liquid` (one block loop, regions), `snippets/footer-block.liquid` (one block), `assets/footer.css`, `assets/footer.js`, `sections/footer-group.json`, locales.
- Removed section settings now carried by blocks: `description`, `newsletter_title`, `newsletter_enable`, `show_payment_icons`.
- Default preset = old look. Same selectors kept (`.footer-actions-menu`, `__toggle`, `__list`, `.footer_actions__slogan`, `.footer-newsletter*`, `.footer-info__*`).
- Before/after bounding boxes (1440): wrapper 75,3093,1290x436 identical; slogan 75,3141,1290x79 identical; menus grid 476,3252,889x229 identical (first menu 476,3252,201x229 identical); `.footer-info` height 104 -> 88 because the old empty `.footer-info__social-media` div still added a 16px margin with no profiles. 375: slogan 112 high identical, first menu 345x48 identical. Bottom bar is taller only by the policy row (141 -> 168 at 1440).
- Composition probe (temporary text blocks in brand/columns/bottom, then reverted): each landed in its zone and block order was honoured (`Shop, ColText, Explore`), no horizontal overflow at 1440 or 375.
- `footer-group.json` default: logo, brand (description moved from the section setting), social, newsletter ("Stay in the know"), two menus, payment.

## 01 #14 Social networks, single source - done
- New `snippets/social-links.liquid` is the only list of networks (13: facebook, instagram, youtube, tiktok, pinterest, twitter/X, threads, linkedin, bluesky, snapchat, tumblr, vimeo, other). Setting source: Theme settings > Social media. 7 new settings use `social_<net>_profile` (not `_link`, because Dawn already owns `social_snapchat_link`, `social_tumblr_link`, `social_vimeo_link`); `other` labels itself with the URL's domain.
- Removed duplicates: the hard-coded list in `footer.liquid`, `snippets/shop-social.liquid` (deleted; `sections/page-contact.liquid` now renders `social-links` with `list_class: 'shop-social'` and loads `shop-social.css` itself), and the four `float_{facebook,tiktok,instagram,youtube}_link` settings (float widget reads `social_<channel>_link`; enable, image and text settings stay).
- `snippets/icons-sprite.liquid`: added `icon-threads`, `icon-bluesky`, `icon-snapchat`, `icon-tumblr`, `icon-vimeo` (paths adapted from the Horizon reference icon set) and `icon-link`. Live: all 13 `#icon-*` ids exist.
- Liquid render with all 13 settings filled (liquidjs, static, `social.cjs`): 13 links, each with `Follow us on <name>` accessible name and the right icon; empty settings render nothing. The dev store has no profiles filled, so the live footer renders no social list.
- Edited shared files: `config/settings_schema.json` (+7, -4), `config/settings_data.json` (+7 empty keys), `locales/en.default.json` (+5 link labels, `sections.footer.policies_label`), `locales/en.default.schema.json`.

## 03 #13 Demo footer columns - done
- `footer-group.json` blocks `menu-shop` -> `footer`, `menu-explore` -> `main-menu` (both exist on the store: 7 and 6 links). The three empty Help/Company/Legal blocks are gone. Live: two populated columns, none blank.

## 05 E1 Landmarks - done
- Footer section `"tag": "footer"` renders a real `<footer>`; live `document.querySelectorAll('footer').length === 1` at both widths. Every footer `<nav>` has an accessible name: `Shop`, `Explore` (menu heading, falls back to the menu title), `Store policies`. Menu `<ul>` is wrapped in `<nav aria-label>`; the accordion toggle journeys are unaffected.

## Localization selector - done (not verifiable live)
- `snippets/localization-selector.liquid` (HeaderA) exists, so the footer now renders `kind: 'country'` and `kind: 'language'` with `variant: 'dropup'`; the two `<select>` forms, their CSS and the dead `initLocalizationSelectors` in `footer.js` are removed. The dev store is single-market, so the selector renders nothing and its look was not seen.

## Verification
- `runs/e2e/journeys.cjs` `E2E_ONLY=footer375,footer1440 E2E_CONC=1`: 7 pass, 0 fail.
- Console: 0 errors beyond the known dev-server ones (CDN origin-trial CORS, shop.app frame, 400/403, customer-account menu).
- `settings-usage.cjs` exit 0 (926 settings, 200 global, 0 unread); `node --check assets/footer.js`; JSON parse of all changed JSON.
- `validate-locales.mjs` and `validate-schema-ranges.mjs` currently fail only on `sections/before-after.liquid` (another agent's schema parse error, line 193); no footer, social or float entries in their output.

## Concerns
- Not exercised live: social icons with real URLs, the dropup selector on a multi-market store, an image block with a picture. `footer-newsletter.cjs` and `section-reload.cjs` were not rerun.
- The demo-store copy of `sections/footer-group.json` carries its own customised footer description and the old `menu` / `description` setting shape; it needs a manual re-seed rather than a push.

## Durable rules
- Any list of social networks must come from `snippets/social-links.liquid` and the `social_*` theme settings; never hard-code networks in a section or snippet.
- Footer content belongs in footer blocks with a `placement`; add new footer content as a block type in `sections/footer.liquid` plus `snippets/footer-block.liquid`, not as a fixed section setting.
- A section that offers `@app` blocks must render them with `render block` in its own file (the settings-usage gate reads only the section file, not its snippets).
