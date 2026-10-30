# Theme Store reviewer pass - 2026-10-30

Five read-only reviewers (structure, commerce, accessibility/performance, copy, packaging) audited the working tree against `runs/.theme-store-requirements-261017.md`. Four workers fixed the verified findings; unverified or false claims were dropped.

## Fixed (commits 0577472, 48fdcc2)
- Banner hotspots: closed tooltips no longer take focus, trigger has `type=button`, `aria-expanded`, `aria-controls`, a named label, Escape closes and returns focus.
- Gallery lightbox: focus moves in, is trapped, returns to the opener; items have an accessible name.
- Video: iframe title, forced controls when autoplay is on, `hqdefault` poster.
- Password recovery shows a confirmation (`customer.recover_password.success`).
- `--color-sale-price` reaches 4.6:1 on scheme surfaces (scheme-3 was 4.05); `--color-sale-badge` keeps the raw colour for badge fills.
- Head tags: removed the withdrawn `view-transition` meta, the inert `rel=expect` link and the lone self-referencing hreflang.
- Shipped JSON templates carry no demo-store resources (`shopify://shop_images`, product handle, fixed `/pages/*` links), no invented press logos, named testimonials, store addresses or brand claims.
- Schema defaults and presets are instructional; terminology and sentence case aligned with the requirements (button label, main menu, footer menu).
- Product blocks resolve `closest.product`; products that require a selling plan use choose options on cards, featured product and quick view.
- Quick view is a section (`sections/product-quickview.liquid`, `?section_id=product-quickview`); `product.card.liquid` and `product.quickview.liquid` are deleted.
- `snippets/*` LiquidDoc declares the implicit params; `.theme-check.yml` no longer loosens asset-size checks or hides snippets.
- `scripts/package-theme.py` normalises CRLF to LF, matches ignores by path or basename only, checks the 50 MB limit and the top-level directory allowlist. Zip: 304 files, 0 CRLF.

## Rejected after verification
- Sticky add-to-cart without a buy block: the bar never appears without one (`assets/product.js:834-835`).
- Header `customer_account_menu` default: it is the value from Shopify's account-component docs.
- Wrapping DOM writes in no-op guards: not needed; the scanner mutation came from its own resize sweep.

## Evidence
- Theme Check (CLI, user approved): 0 offenses, after declaring implicit snippet params.
- `validate-locales`, `validate-schema-ranges`, `settings-usage`, template validator (24 files): pass.
- Offline Playwright: hotspot keyboard (36 checks), gallery focus trap, quick view modal against the real section render.
- Demo store: 33 changed files upserted (customised `templates/*.json`, `*-group.json` and `settings_data.json` untouched), MD5 equals disk. Live: `?section_id=product-quickview` returns 200 with the section wrapper; quick view modal opens and loads the product; hotspot labels render with the product name and tooltips are `visibility: hidden` when closed; Featured product title and price blocks render.
- `theme.qa_validate` on the demo host, all `PASS` / `CERTIFIED`, 0 critical:

| Route | Receipt |
|---|---|
| `/` | 1793342084557-run-d3bf9a64-d5e5-4b |
| `/collections/all` | 1793342162320-run-d3bf9a64-d5e5-4b |
| `/products/charcoal-pinstripe-blazer` | 1793342212418-run-d3bf9a64-d5e5-4b |
| `/cart` | 1793342329220-run-d3bf9a64-d5e5-4b |
| `/search?q=jacket` | 1793342377972-run-d3bf9a64-d5e5-4b |
| `/pages/contact` | 1793342428483-run-d3bf9a64-d5e5-4b |
| `/this-page-does-not-exist` | 1793342513857-run-d3bf9a64-d5e5-4b |

## Still open
- Lighthouse: needs `REBEL_SHOPIFY` in `.env`.
- Support form backend: needs Cloudflare sign-in or a scoped token; see `261030-blockers-run.md`.
- Theme name: "Rebel" is one letter from the Outsiders preset "Rebels".
- Fresh-install templates (blank images) were validated offline only; the dev server and demo keep their own content.
- `runs/e2e/r10-store-hours.cjs` reads store hours from `templates/page.stores.json` and needs its own fixture.
- Custom Liquid block in the footer and main-collection `@app` hosts (reviewer Should, needs new schema keys): not done.
