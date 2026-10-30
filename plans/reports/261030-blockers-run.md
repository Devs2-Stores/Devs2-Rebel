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

A single `shop.app` iframe CSP console error appeared on `/search` and `/cart` in some runs. It names origin `127.0.0.1` and does not repeat on the demo store host.

## Demo store
- Test payment gateway (Bogus) activated in Admin, Settings, Payments, Third-party providers. The store is listed as "Client transfer" in Admin, Settings, Organization.

## Still open
- Lighthouse: needs `SHOPIFY_STOREFRONT_PASSWORD` in `.env`; the storefront stays in private mode (no off switch on this store).
- Cloudflare: `dash.cloudflare.com` is signed out (Google account shows "Signed out") and both tokens in `E:/Work/master/.env*` are rejected. The support form code and `/api/theme-support` exist but production has no `PUBLIC_TURNSTILE_SITE_KEY`, so the form renders disabled.
- Theme name: `themes.shopify.com/themes/rebel` returns 404, but the Outsiders theme has a preset named "Rebels" and Community threads call it "Rebel theme". The owner chose to keep "Rebel".
- Theme Check, demo sync of the four files above, and push of the theme repo wait for approval.
