# Clean storefront rebuild - Rebel - 2026-10-16

Scope: every storefront page group, Rebel preset only. Authority: `DESIGN.md`
("Clean system", "Buttons", "Component rules"). Nothing committed or pushed.

## Global layer (controller)
- Tokens in `snippets/head-design-systems.liquid`: `--color-ink`, `--color-muted`,
  `--color-hairline`, `--color-primary-strong`, `--color-focus`, `--btn-*`,
  `--eyebrow-*`, `--heading-tracking`, `--meta-size`, `--space-6xl/7xl`,
  `--section-head-gap` (2rem, 2.5rem from 1024 in `assets/base.css`),
  `--stack-gap`, `--shadow-float`, card tokens from merchant card settings.
- `assets/theme.css`: `.button-primary.active` = CTA fill (`--color-primary` +
  `--color-button-text`), `.button-primary` / `.button-secondary` = ink outline,
  hover colour only, ink focus ring; table head, legacy card title, form focus
  no longer crimson.
- `assets/product-card.css` + `snippets/product-card.liquid`: flush cards; stock
  bar tokenised; tap zoom on touch removed.
- `config/settings_data.json` (Rebel preset; user chose "settings_data: Rebel
  preset only" in the direction question): grid spacing 16/40, card shadow 0.
  The working-tree diff vs HEAD also holds earlier uncommitted work, so its
  file counts are not this rebuild alone.

## Page groups (7 agents)
| Group | Main files | Status |
|---|---|---|
| Chrome | header, megamenu, mobile-menu, footer, announcement, search modal, pagination CSS; `sections/footer.liquid` | DONE |
| Home | 30 sections, `templates/index.json` + listing | DONE_WITH_CONCERNS (tabs/collapsible not on any template) |
| Product | product, variant-picker, quantity, pickup, quickview CSS; featured-product, buy_buttons, sticky add | DONE_WITH_CONCERNS (gift-card mobile capture failed in-agent; final capture covers it at 200) |
| Collection/search | collection, list-collections, search CSS + sections | DONE_WITH_CONCERNS (sort order not asserted) |
| Cart/gift | cart, cart-modal, cart-recommendations, gift-card CSS | DONE |
| Content | blog, article, contact, FAQ, stores, 404, password, page CSS | DONE_WITH_CONCERNS (no QA receipt in-agent) |
| Customer | `assets/customer.css`, login/account/order sections | DONE_WITH_CONCERNS (static render only; routes 404 on store) |

Behaviour changes visible to shoppers:
- Contact form (`sections/page-contact.liquid`) has `novalidate`, so the theme
  validator shows inline errors instead of the browser bubble.
- Login page now toggles login and recover forms (`.login-layout` /
  `.recover-layout`); before, both showed at once.
- Buy it now is the ink outline; Add to cart is the crimson CTA.

## Controller integration fixes
- `--space-section-head` (undefined) replaced by `--section-head-gap` in 16 sections.
- 24 section-level `font-size` rules removed on headings that carry
  `heading-size-*` / `subheading-size-*` from merchant settings (merchant size
  setting was dead).
- Placeholder backgrounds under white text (`hero`, `parallax-image`,
  `image-text-overlay`) use `--color-black` instead of purple/blue gradients.
- `sections/featured-product.liquid`: thumbnail strip dropped `role="list"`
  (axe `aria-required-children`, critical); thumb `<img>` alt emptied because the
  button already carries the label.
- `.subheading-size-xs` = `var(--eyebrow-size)` in `assets/base.css`, so phone
  eyebrows stay 12px now that sections no longer override the setting.
- `.button-primary:where(:not(.active, .white)):hover` replaces a (0,4,0)
  `:not()` chain; dead `.product-card__overlay` rules removed.
- Undefined-token scan over assets/sections/snippets/blocks/layout/templates:
  only scheme-loop tokens (`--color-{success,warning,error}[-text]`), which are
  generated in `head-color-schemes.liquid`.

## Evidence
- Before: `plans/reports/redesign-261015/before/`; per group `*/before|after/`.
- Final: `plans/reports/redesign-261015/after-all/` (16 routes x 1440/768/375,
  `capture.json`): per viewport 14 routes 200 and 2 expected 404 (`404`,
  `login`; the store uses new customer accounts), 0 overflow, 0 wide elements, 0
  broken images, 0 clipped, 0 page errors, 0 Translation missing. Home has no
  visible `h1` (visually-hidden shop name in `layout/theme.liquid:26`), same as
  the before capture.
- After the last fixes: `after-fix/` home and `/collections/all` at 1440/375,
  0 overflow/broken/clipped/page errors; full-size crops reviewed.
- Suite `runs/e2e/r10-final.sh` -> `plans/reports/redesign-261015/final-e2e/`:
  journeys 96 PASS / 0 FAIL / 1 INFO; JS 0 fail; JSON 0 fail; lifecycle,
  error-paths, section-reload, cart-trigger pass; discovery 13/20/28 = baseline.
  axe 45 route-viewports: 3 hits, all the featured-product thumbs; after the fix
  `axe-rerun.json` is clean on `/` and `/collections/all` at 375/768/1440.
  facet-lifecycle timed out once on `goto`, rerun passes (`facet-lifecycle-rerun.json`).
- Static (after last edit): locales 100%, ranges 100%, settings-usage 946 / 0
  unread, package 249 files 0.48 MB.
- AntiFan `theme.qa_validate` on `/`: receipt `run-f22e4021…`, verdict FAIL from
  7 console criticals that are environment noise (HotReload, shop.app CSP,
  `customer-account-main-menu`); Liquid clean, 0 overflow at 320-1440, 0 layout
  findings, DOM semantics 95, 0 broken assets.

## Open
- `charcoal-pinstripe-blazer` price is 0.00 in the store, so its card shows
  "Contact" (theme behaviour, store data).
- Theme Check not re-run (needs approval: `shopify theme check`).
- Tabs and collapsible-content sections are not on any template: CSS only.
- Customer pages verified by static Liquid render; live check needs a test
  customer login.
- Pre-existing, out of scope: `blog-sidebar__title` and `collection-card__title`
  override their size setting in asset CSS (also at HEAD).
