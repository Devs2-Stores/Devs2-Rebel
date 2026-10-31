# UX/AX review checklist - Sartor

Use this checklist for every storefront UI change and every UX/AX review. Read
`DESIGN.md` for the direction and `AGENTS.md` for the mandatory code gates. The
latest full review is
`plans/reports/enhance-ux-ax-261021-0253-theme-store-audit.md`.

## Evidence rule

Every UI change ships with screenshots of each changed page at 1440x900,
768x1024 and 375x812, taken from the running theme (`shopify theme dev` or a
`?preview_theme_id=` preview). A claim without a screenshot, a measured value
or command output is not evidence.

A full-page screenshot is one frame with the page at scroll 0, so it cannot
show sticky columns or scroll regions. Before reporting "empty column" or
"cut-off panel", scroll the live page and measure the element's position and
`scrollHeight` against `clientHeight`. Scroll-driven state (TOC active item,
sticky bars) must also hold after an instant jump to the bottom and back to
the top, not only after a smooth scroll. Store data (page content, comments,
menus, inventory, product imagery) is a content gap for the demo store, not a
theme defect.

With Reveal sections on scroll on (the demo preset), a capture that never
scrolls shows every section below the first screen at opacity 0. Scroll the
page to the bottom and back before a full-page capture, and never report such
a blank band as missing content until you have done that. Print is exempt.

## Rubric (score 0-3, evidence per area)

| Area | Check |
|---|---|
| First impression | Purpose clear in five seconds. One obvious primary action above the fold, and no popup blocking it |
| Brand recall | Matches the active preset in `DESIGN.md`: accent use, corner character, editorial photography |
| Content punch | Hero and section copy is specific. Generic merchant copy is recorded as a content gap |
| Clarity and hierarchy | One primary CTA per view. Variant values distinguishable without relying on an image |
| Storytelling | Home order leads from the offer to proof to brand |
| Knowledge and trust | Cart, filter and form errors speak the shopper's language. Money, stock and plan strings follow the selected variant. Store "Open now" gives the same answer from any device time zone (`scripts/e2e/r10-store-hours.cjs`) |
| Motion | Intentional motion kept. No `prefers-reduced-motion` (workspace ban). Overlays visible before focus moves. Forced `:hover` on an emulated touch device (`scripts/e2e/r10-touch-hover.cjs`) changes no decorative transform. Script-revealed content is visible with the script blocked |
| Responsive | No horizontal overflow at 320, 375, 768 and 1440. Tables scroll inside their wrapper |
| Accessibility | WCAG 2.2 AA: contrast, names, focus order, target size, overlay focus management, no focus inside `aria-hidden` |
| Performance feel | LCP hero eager with `fetchpriority="high"`, below-the-fold media lazy, no duplicate asset loads |

No area may score below the previous review. An area below 2 must reach 2 or
be recorded as an unresolved question.

## Accessibility checks

- axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`,
  plus the best-practice rules `heading-order`, `landmark-one-main`,
  `landmark-no-duplicate-main` and `aria-allowed-role` (they carry no WCAG tag,
  so a tag filter alone never runs them), report 0 violations on every changed
  route at 375 and 1440. The probe (`scripts/e2e/r5-axe.cjs`) exits 1 on any
  violation, error, non-200 status or horizontal overflow. It stops Swiper
  autoplay and waits for finite animations to finish first, so a crossfade
  between two slides is never measured as a colour pair. Axe then sees only each
  carousel's first slide; check text on the other slides with the text-over-images
  rule below. `heading-order` inside the merchant-authored product description
  is not a theme finding.
- Text over images: measure the text colour against every backdrop pixel of
  the text box, with text shadows removed. Render-check and axe compare against
  the page background behind an `<img>`, so their `low-contrast` result there is
  not a measurement.
- State-dependent text (open/closed badges, stock, errors) is checked with each
  state forced. A live clock or stock level hides the other state.
- Colour changes are checked in every preset in `config/settings_data.json`
  (today `Sartor`, which carries a light and a dark scheme), with the cart
  drawer, search panel and mobile menu open as well as the page.
  `scripts/e2e/preset-contrast.cjs` renders each preset's scheme CSS with liquidjs,
  injects it into the live page and measures every visible text node against
  its composited background. Disabled controls (WCAG 1.4.3 inactive components)
  and frames captured mid-transition are recorded as exempt, not as failures.
  Exit 0 is the pass.
- Targets: 24 x 24 CSS px minimum, or the WCAG 2.5.8 spacing exception. A
  44 px `small-touch-target` warning alone is not a defect.
- Keyboard journeys: cart drawer, mobile menu, megamenu, filter drawer and quick
  view each take focus, trap it, close on Escape and return focus. Filtering
  keeps focus on the equivalent control and announces the result from locale
  strings.
- Screen-reader-only clips (`.visually-hidden`, `.sr-only`, visually hidden
  legends) are intended. Report them as accepted, not as clipped text.
- Tab walk (`scripts/e2e/r10-tabwalk.cjs`) lets transitions settle before it
  measures, and no stop lands off-screen. Shopify's hCaptcha badge
  (`#shop-hcaptcha-badge-container`, injected on pages with a storefront form)
  slides in on hover but not on focus, so its Privacy and Terms links focus
  off-screen. It is platform-owned: record it and do not restyle it from the
  theme.
- Heading order: axe `heading-order` reports 0 on `/collections/all`,
  `/search?q=jacket`, `/collections`, `/account`, `/account/addresses` and an
  order page. Card titles on listing pages are `h2`; a card title's computed
  size, letter-spacing and text-transform match the `h3` they replaced.
- Field border contrast (WCAG 1.4.11): for every colour scheme, the computed
  `border-top-color` of `.form-control` (read on a host of that scheme) is at
  least 3:1 against `background`, `background_2` and `form_bg`. Cover the
  quantity stepper, the footer newsletter field and the localization search
  input as well. Pills, pop-ups, drawers and dividers keep the hairline and are
  exempt.
- Announcement pause: with two or more announcement blocks the pause button is
  at least 24 x 24 px, does not overlap the text at 375, pressing it leaves
  `swiper.autoplay.running` false, `.swiper-slide-duplicate` count is 0, and
  every non-active slide is `inert`. With one block no button renders and the
  header height (`--announcement-height`) is unchanged.
- Autocomplete: axe `autocomplete-valid` reports 0 on `/account/login`,
  `/account/register`, `/account/addresses`, a reset or activate page and
  `/cart`. A scan finds no text-like customer or cart input without a token,
  except tax ID, notes, gift-card recipient, number and search inputs.
- One `<main>` per page: `rg '<main' layout sections` lists only
  `layout/theme.liquid`, `layout/password.liquid` and
  `sections/main-gift-card.liquid`, and a rendered page contains exactly one
  `main` landmark (axe `landmark-one-main`, `landmark-no-duplicate-main`).
- Customer form markup: no `div` or `a` inside a `label`, and the password
  toggle is a focusable `button` reachable by keyboard.

## Discovery surfaces

Theme-owned surfaces live in `snippets/head-meta-tags.liquid`: canonical,
Open Graph/Twitter, and JSON-LD for WebSite, Organization, Product,
BreadcrumbList and BlogPosting. Section-owned JSON-LD: ItemList in
`main-blog` and `main-list-collections`, FAQPage in `page-faq`,
LocalBusiness in `page-stores`.

- When a route, template, or section with structured data changes, re-check its
  JSON-LD and metadata against the rendered page.
- `robots.txt`, `sitemap.xml`, `llms.txt`, `/agents.md` and markdown twins are
  served by Shopify; the theme ships no `templates/robots.txt.liquid`.
  Discovery-scan findings on those, dev-proxy URL rewrites, and missing store
  settings (for example the social sharing image) are platform-owned or
  merchant-owned. List them with the reason. Do not patch around them in theme
  code.

## Runner

`bash scripts/e2e/r10-final.sh <evidence-dir>` (from the theme root, with
`shopify theme dev` on 127.0.0.1:9292 and `npm install` run once inside
`scripts/e2e`) runs every gate below. Logs go to
`<evidence-dir>/<gate>.log`. It prints `PASS`, `FAIL` or `INFO` per gate and
exits 1 if any gate fails, or if a replay (`*_BEFORE=1`, `EP_MUTATE`, the
`SH_JS` page-stores mutation) stays green on its reintroduced bug. A missing
argument exits 2. It never runs `scripts/package-theme.py`, which writes `dist/`.

| # | Gate | Command (theme root) | Pass |
|---|---|---|---|
| 1 | settings-usage | `node scripts/settings-usage.cjs` | exit 0 |
| 2 | overlay-contract | `node scripts/e2e/overlay-contract.cjs` | exit 0 |
| 3 | font-spacing-icon | `node scripts/e2e/font-spacing-icon.cjs` | exit 0 |
| 4 | target-spacing | `node scripts/e2e/target-spacing.cjs` | exit 0 |
| 5 | error-paths | `node scripts/e2e/error-paths.cjs` | exit 0; `EP_MUTATE=no-toast` exits non-zero |
| 6 | preset-contrast | `node scripts/e2e/preset-contrast.cjs` | exit 0 |
| 7 | r10-store-hours | `node scripts/e2e/r10-store-hours.cjs` | exit 0; `SH_JS=scripts/e2e/fixtures/page-stores.sign-flip.js` (shop offset sign flipped) exits non-zero |
| 8 | r10-touch-hover | `node scripts/e2e/r10-touch-hover.cjs` | exit 0 |
| 9 | r10-tabwalk | `node scripts/e2e/r10-tabwalk.cjs` | exit 0 |
| 10 | r5-axe | `node scripts/e2e/r5-axe.cjs` | exit 0 |
| 11 | facet-lifecycle | `node scripts/e2e/facet-lifecycle.cjs` | exit 0; `FL_BEFORE=1` exits non-zero |
| 12 | contact-lifecycle | `node scripts/e2e/contact-lifecycle.cjs` | exit 0; `CL_BEFORE=1` exits non-zero |
| 13 | cart-trigger-reload | `node scripts/e2e/cart-trigger-reload.cjs` | exit 0; `CT_BEFORE=1` exits non-zero |
| 14 | section-reload | `node scripts/e2e/section-reload.cjs` | exit 0; `SR_BEFORE=1` exits non-zero |
| 15 | journeys | `node scripts/e2e/journeys.cjs` | exit 0 |

Static steps before the browser gates: `node --check assets/*.js`, a JSON parse
of `locales`, `config`, `templates`, `sections`, `blocks` and `listings`,
`scripts/validate-locales.mjs`, `scripts/validate-schema-ranges.mjs`, and a
curl of every default route (all must answer 200, otherwise the browser gates
are skipped). `check-discovery-surfaces.mjs` runs last as advisory only when
`DISCOVERY_SCRIPT` points at it: its
findings on the dev proxy are platform-owned (see Discovery surfaces).

Default routes are real 200 routes of the demo store (`/blogs/news`,
`/blogs/news/leather-care-101`, `/products/leather-care-balm`, ...).
`gotoStore` in `scripts/e2e/lib.cjs` throws on any non-2xx status, so a stale route
fails instead of measuring an error page; a deliberate error page passes
`{ allowStatus: [404] }`. Gate output defaults to the OS temp directory, never
to `plans/reports/`.

## Mechanical gates

- `node scripts/validate-locales.mjs` and
  `node scripts/validate-schema-ranges.mjs` exit 0.
- `node --check` passes on every changed JavaScript file, and every changed JSON
  template parses.
- `rg "\| t \| default: '|default: '[A-Z][A-Za-z]+[ A-Za-z.:]*'" sections snippets
  blocks layout` finds no English copy used as a Liquid fallback. Layout and
  option values (`'horizontal'`, `'center center'`) are not copy.
- Every text-type schema `default` (`text`, `textarea`, `inline_richtext`,
  `richtext`, `html`) that is customer copy is a `t:` key whose path is the
  setting's `label` key with `.label` replaced by `.default`, so it sits in the
  owner's namespace. Data stays literal: handles (`all, frontpage`), addresses,
  symbols (`+`, `/`, `✦`), emoji, dates, times and years.
- `node scripts/settings-usage.cjs` exits 0: every setting a section or block
  declares is read by that file or a snippet it renders, and every global
  setting in `config/settings_schema.json` is read by some layout, section,
  snippet, block, template or asset (a computed `settings[key]` family such
  as `float_*` counts). Every colour-scheme role must be read too. A read
  only counts when it reaches a rendered style: a CSS custom property that no
  stylesheet consumes does not count as a reader, for global settings and for
  a section's own inline tokens alike. A section that offers
  `@app` blocks renders them (`{% render block %}`, after its content in a
  `.section-apps` slot or inline in a `case block.type`) and every
  `for block in section.blocks` loop skips them, so an app block never adds
  an empty column, slide or card. Its self-tests fail on an unread setting
  and on an unrendered app block first. A stored template value must match
  its setting's label (a "directions URL" holds a directions link, not an
  iframe embed).
- `node scripts/e2e/overlay-contract.cjs` (needs `shopify theme dev`) opens every
  overlay by keyboard and checks dialog semantics, focus trap and return,
  Escape, close button, scroll lock under the wheel, panel text in a theme
  font family (body, heading or subheading token; slotted `<shopify-account>`
  content included), and three open/close cycles. Exit 0 is the pass.
  `OC_ONLY=<name,...>` runs single configs. Main-frame navigations print as
  `[NAV]`, `[NAVFAIL]` and `[NAVSTATUS]` lines. A config whose trigger needs
  store data (pickup) reports INFO, not PASS.
- `node scripts/e2e/font-spacing-icon.cjs` checks fonts (theme family, a real
  face per used weight, nothing below the 11 px micro step in `DESIGN.md`,
  and 11 px only on micro labels: uppercase, count pill or `.content-size-xs`),
  section spacing, gutters, overlapping targets and icon names, size,
  contrast and alignment on 12 routes x 375/768/1440. Exit 0 is the pass;
  advisory rows are INFO.
- `node scripts/e2e/target-spacing.cjs` (`TS_ROUTES`, `TS_WIDTHS`) checks WCAG
  2.5.8 on every visible target: a target under 24 x 24 px passes only when a
  24 px circle on its centre touches no other target, or it sits inside a
  sentence. It first runs a self-test fixture (16 px links 4 px apart fail,
  8 px and 24 px apart pass, an inline link in a sentence passes) and exits 2
  if the rule is broken. Exit 0 is the pass.
- `shopify theme check` runs only with user approval (`AGENTS.md`). Report it as
  pending when it was not approved.
- Storefront changes to navigation, sliders, schema, filters or cart need live
  evidence on the running theme plus a DOM inspection. An AntiFan
  `theme.qa_validate` receipt in `.antifan/qa-receipts/` is the accepted form.
  Pass the project thresholds (`minTextPx` 11, `minTapHitPx`, `minControlPx`
  and `tapSpacingCirclePx` 24); the tool defaults (12 px text, 44 px targets)
  are not this project's rules.

## Script lifecycle and failure paths

- Custom elements that add `window` or `document` listeners bind them with an
  `AbortController` signal created in `connectedCallback` and aborted in
  `disconnectedCallback`. A re-attached element must fire each handler once.
- Controls inside a section (header cart icon, hamburger, footer accordions,
  PDP lightbox, gift card recipient) keep working after the theme editor
  reloads that section. Delegate the click from `document`, or re-run the init
  on `shopify:section:load` with a per-element bound flag.
- Every cart and collection request has a failure path. Network, HTTP and
  JSON-parse failures show a locale string; `AbortError` stays silent; a
  Shopify `description` (for example a stock limit) is shown as sent. Never show
  `error.message` from `fetch` or `JSON.parse` to the shopper.
- Prove both with a forced failure or reload against the running theme:
  `scripts/e2e/error-paths.cjs`, `section-reload.cjs`, `cart-trigger-reload.cjs`,
  `facet-lifecycle.cjs` and `contact-lifecycle.cjs` each assert named checks and
  exit 1 on a failed one. Their `*_BEFORE=1` switch (`error-paths.cjs` uses
  `EP_MUTATE=no-toast`) replays the old script or removes the failure message,
  and the gate must then exit non-zero; the runner requires that red result.
