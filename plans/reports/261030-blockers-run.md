# Blocker run - 2026-10-30

## QA receipts (theme.qa_validate, build-strict, greenfield, dev server at 127.0.0.1:9292)

All seven routes returned `PASS` and `certification: CERTIFIED` (basis: greenfield, 0 critical). Receipts are in `.antifan/qa-receipts/`:

| Route | Receipt |
|---|---|
| `/` | `1793335219478-...-9282dfe5.json` |
| `/collections/all` | `1793335551594-...-1eb7d012.json` |
| `/products/charcoal-pinstripe-blazer` | `1793335594118-...-7e4a1908.json` |
| `/cart` | `1793335755269-...-b9254b43.json` |
| `/search?q=jacket` | `1793335850476-...-144dd602.json` |
| `/pages/contact` | `1793335674657-...-03b0dc84.json` |
| `/this-page-does-not-exist` (expectedStatus 404) | `1793335714948-...-6ccb940c.json` |

Runs froze CSS motion with `anti.media.freeze`, ignored the live-motion selectors (`.swiper`, marquee, countdown, announcement bar) and used `settle.domTimeoutMs: 5000`.

### Code fixes the run found
- `snippets/megamenu.liquid`: removed `.megamenu__container { pointer-events: none }` and its `> * { pointer-events: auto }` partner. The container and `.megamenu__nav` have identical rects, so the rule had no hit-test effect, and the scanner walks ancestors and read it as a blocked panel.
- `assets/megamenu.js`: `Escape` now dismisses a panel that was opened by hover (focus on `body`). The old handler lived on the item, so it only ran with focus inside (WCAG 1.4.13). The `document` listener uses the existing `_boundDocKeydown` name that `disconnectedCallback` already removed.
- `assets/404.css`: search input and button gap `--space-xs` (4px) to `--space-sm` (8px), below the 6px minimum.
- `assets/section-featured-collection.css`: `min-height: 1.5rem` on the view-all link (was 21px high at 375px).

### Waivers recorded on the receipts
- `title-scale`: the 36 / 30 / 24 / 18px heading steps come from the `heading_size` setting.
- `image-crop`: product cards use a fixed aspect frame with `object-fit: cover`; the demo photos have mixed ratios.
- Not waived: `OVERLAY_POINTER_EVENTS_NONE` (fixed in code instead).

A single `shop.app` iframe CSP console error appeared on `/search` and `/cart` in some runs. It names origin `127.0.0.1`, so it comes from the dev proxy origin. The demo-host QA runs below returned 0 critical, but I did not inspect console output there separately, so whether it recurs on the demo host is not verified.

## Demo store
- Test payment gateway (Bogus) activated in Admin, Settings, Payments, Third-party providers. The store is listed as "Client transfer" in Admin, Settings, Organization.
- `shopify theme check` (approved): 193 files, 0 offenses.
- The four fixed files were upserted to demo theme 160556351559 through the Admin API; MD5 of all four equals the repo. `templates/index.json`, `sections/footer-group.json` and `config/settings_data.json` were not touched.
- Live on the demo host: hover then `Escape` closes the megamenu panel; `.megamenu__container` computes `pointer-events: auto`.
- `theme.qa_validate` on the demo host (rebel-streetwear-hn0q7d9h.myshopify.com), same arguments as above: `/`, `/collections/all`, `/products/charcoal-pinstripe-blazer`, `/cart`, `/search?q=jacket`, `/pages/contact`, and the 404 page all returned `PASS` / `CERTIFIED`, 0 critical. Receipts for these runs start with `1793336405557`, `1793336452532`, `1793336508143`, `1793336552002`, `1793336599553`, `1793336646745`, `1793336701818`.
- Theme repo pushed: `c857669..0ac06cd` on `Devs2-Stores/Devs2-Rebel` main.

## Still open
- Lighthouse: needs `SHOPIFY_STOREFRONT_PASSWORD` in `.env`; the storefront stays in private mode (no off switch on this store).
- Cloudflare: `dash.cloudflare.com` is signed out (Google account chooser shows "Signed out"); I do not enter Google passwords or 2FA codes. Token check (values not printed): `E:/Work/master/.env.production` holds a 3-character placeholder, not a token (API error 6111, bad header format); the 55-character token in `.env.cloudflare` (variable name `CLNUDFRARE_API_TOKEN`, misspelled) is rejected as "Invalid API Token" (code 1000). Neither parse nor quoting is the cause. The support form code and `/api/theme-support` exist but production has no `PUBLIC_TURNSTILE_SITE_KEY`, so the form renders disabled. Needs the user to sign in, or a token scoped to Turnstile, Email Sending and Pages.
- Theme name: the user answered "Giữ Rebel" in the earlier question, but the risk stays open and the name cannot change after upload. `themes.shopify.com/themes/rebel` returns 404, yet `themes.shopify.com/themes/outsiders/presets/rebels` is a listed preset named "Rebels" (one letter apart, which Shopify's naming rule may treat as too close), and Community threads from 2024-2026 call some theme "Rebel theme". Alternatives if the user wants to avoid it: a name with no existing match, checked against Theme Store search before upload.
