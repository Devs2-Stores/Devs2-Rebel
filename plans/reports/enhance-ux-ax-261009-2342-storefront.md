# UX/AX review: Devs2 Rebel (Shopify OS 2.0 base theme) - 2026-10-09/10

## Verdict

Round 1 baseline: the biggest win was available on every page. A newsletter dialog that the merchant setting disables still opened over the first viewport after 3 s. Its three settings had zero consumers. Discount badges were invisible because colour-triplet tokens were used as colours. Muted text failed WCAG 2.2 AA contrast on four of five presets. The DONE status is tracked in the round log below.

## Scope and environment

- Mode: `--auto --audit --loop 3`, focus = whole storefront.
- Target: `shopify theme dev` already running (PID 24196, `http://127.0.0.1:9292`, development theme `#187046396013`, store `devs2-rebel.myshopify.com`); reused, not started by this review.
- Code: `E:/Work/shopify`, branch `main`, HEAD `d4a44dd` + pre-existing uncommitted PDP/PLP remediation work (not touched except where listed).
- Pages: home `/`, collection `/collections/new-arrivals`, product `/products/rebel-tactical-bomber-jacket`, cart, search, about `/pages/about`, contact `/pages/contact`, blog, article, 404.
- Viewports: 1440x900, 768x1024, 375x812 (`ak-frontend-design/scripts/render-check.mjs`), plus a throwaway Playwright probe (`runs/uxax-probe.cjs`) for computed styles and DOM.
- Checks not run: field LCP/INP/CLS (no CrUX/RUM for a password-protected dev store); 320 px reflow; Theme Check needs separate approval (Close phase).

## Baseline evidence

- Screenshots: `enhance-ux-ax-261009-2342-storefront/round-1/raw/<page>/<viewport>.png` (full page), `round-1/fold/<viewport>-<page>-fold.png`, popup-free `round-1/clean/*.png`.
- Discovery scan (`check-discovery-surfaces.mjs http://127.0.0.1:9292 --site-origin https://devs2-rebel.myshopify.com --sample 10`): 57 sitemap URLs, 10 pages checked, exit 1. Of the 5 errors, 4 sit on the Shopify-generated `/agents.md` route (title, meta description, viewport, og:image). The theme cannot render that route. The other error is home `og:image` missing. Warnings: markdown twins (10), robots `Sitemap:` line, llms.txt summary blockquote, all platform-served on Shopify.
- render-check: `dialog-visible-on-load` on 16 page/viewport captures (`div#newsletter-popup.active`). There were 75 low-contrast findings. Examples: `.product-card__badge--discount` 1.12:1, `.section-blog-posts__date` 2.67:1, `.collection-sort__count-text` 3.09:1, `.facet-filter-item__count` 3.09:1, `.cart-template__count` 3.09:1, `.product-card__vendor` 4.30:1. Small-touch-target warnings use a 44 px threshold. No horizontal overflow finding.
- Backdrop probe (`runs/backdrop.js`): the 1.10-1.12:1 findings on `.section-slideshow__counter-*`, `.section-collection-list__title`, `.section-hero__subheading/heading` are white text with text-shadow over photography. The tool reads a transparent background, so these are false positives.

## Scores

| Area | R1 | Evidence |
|---|---|---|
| First impression | 1 | `round-1/fold/desktop-home-fold.png`: newsletter dialog covers the hero ("Cut, draped, made to be worn" / "Shop the collection") on first visit |
| Brand recall | 2 | Text wordmark "Devs2 Rebel", crimson `#BC1E2C` accent, editorial photography; discount badges in the brand accent rendered transparent (`assets/product-card.css:187,234` used `var(--color-price)`, an `r, g, b` triplet) |
| Content punch | 2 | Strong section headlines ("Twelve years. One philosophy.", "Made by hand, made to last"); announcement bar is generic ("Welcome to our store", store content) |
| Clarity and hierarchy | 2 | 8 top-level nav items; mobile home is 10,239 px (about 27 screens) |
| Storytelling | 2 | Home order: hero -> categories -> featured product -> trending -> lookbook -> craft -> before/after -> testimonials -> journal -> press -> newsletter |
| Knowledge and trust | 1 | "As featured in" press section renders generic placeholder graphics on the live storefront (`sections/logo-list.liquid:50-53,73-76`, 0 images in `#press_logos`), i.e. unsourced social proof |
| Motion | 2 | Popup `transition: all 0.5s` (`assets/newsletter-modal.css:11`); other UI uses token transitions. Project bans `prefers-reduced-motion` (workspace AGENTS.md section 5) |
| Responsive | 2 | No overflow at 1440/768/375; controls meet 24 px; 41 controls under the 44 px primary target |
| Accessibility | 1 | Contrast failures above; dialog with `aria-modal="true"` opens unprompted |
| Performance feel | 2 | Newsletter CSS/JS loaded on every page even when disabled; hero images eager; field metrics not available |

## Proposals

### P1 - Newsletter dialog obeys its settings (Must)
- Evidence: `layout/theme.liquid:33` renders `newsletter-modal` unconditionally; `assets/newsletter-modal.js:12` hardcodes `timeToShow = 3000`; grep for `newsletter_modal_enable|newsletter_modal_delay|newsletter_modal_color_scheme` in `layout/ snippets/ sections/ assets/` = 0 consumers; all 5 presets store `newsletter_modal_enable: false`, `newsletter_modal_delay: 5`.
- Change: render the dialog markup, CSS and JS only when `settings.newsletter_modal_enable`; pass `newsletter_modal_delay` (seconds) to the element; apply `color-{{ settings.newsletter_modal_color_scheme }}` and use the scheme background instead of hardcoded `white`.
- Files: `snippets/newsletter-modal.liquid`, `assets/newsletter-modal.js`, `assets/newsletter-modal.css`.
- Acceptance: with the stored setting `false`, `document.querySelector('#newsletter-popup')` is `null` and `newsletter-modal.js` is not requested on all 10 pages; render-check reports 0 `dialog-visible-on-load`.

### P2 - Colour-triplet tokens never used as bare colours (Must)
- Evidence: `--color-price` is `r, g, b` (`snippets/head-color-schemes.liquid:28`). `var(--color-price)` as `color`/`background` is invalid at computed-value time. Live: discount badge background transparent with white text, 1.12:1.
- Change: wrap in `rgb()`, and discount/badge text uses `rgb(var(--color-background))`. Files: `assets/product-card.css`, `assets/quickview-modal.css`, `assets/announcement-bar.css`.
- Acceptance: computed `.product-card__badge--discount` background = `rgb(var(--color-price))` with `rgb(var(--color-background))` text. Rebel renders `rgb(10, 10, 10)` on `rgb(245, 242, 237)`, 17.7:1. The minimum across the five presets is 5.64:1 (Botanical scheme-4). No bare `var(--color-price|--color-sale-price)` colour use remains. The R1 draft expected `rgb(188, 30, 44)`, but that value is `sale_price`, not `color_price`. Corrected after verification.

### P3 - Muted text meets 4.5:1 on every preset's base schemes (Must)
- Evidence: muted alphas 0.40-0.55 render 2.67-4.30:1. Computed for `scheme-1..3` of all five presets: alpha 0.62 still fails Botanical (3.69/3.80); alpha 0.70 gives a minimum of 4.57 (Botanical scheme-1).
- Change: muted foreground alpha 0.70 in `--color-gray` (`snippets/head-design-systems.liquid:32`) and the hardcoded muted alphas in `assets/cart.css`, `assets/search.css`, `assets/product-card.css`, `sections/animated-counter.liquid`, `sections/blog-posts.liquid`.
- Acceptance: render-check low-contrast findings on Rebel drop to the photographic false positives only. The computed table shows >= 4.5 for scheme-1..3 on all presets.

### P4 - `twitter:site` derives the handle from x.com links (Should)
- Evidence: home renders `<meta name="twitter:site" content="@https://x.com/devs2rebel">` from `snippets/head-meta-tags.liquid:83-84` (`split: 'twitter.com/'`).
- Change: take the last path segment of the link and strip any leading `@`.
- Acceptance: home renders `content="@devs2rebel"`.

### P5 - Logo list never shows placeholder press logos on the live storefront (Should)
- Evidence: `#press_logos` ("As featured in") has 0 `<img>` and renders `placeholder_svg_tag` graphics.
- Change: placeholders only when `request.design_mode`; on the storefront skip blocks without an image, and render nothing when no block has one.
- Acceptance: storefront home has no `.section-logo-list__ph` and no "As featured in" heading while no logo is uploaded; theme editor still shows placeholders.

### P6 - Remove settings consumers without a schema owner (Could)
- Evidence: `settings.share_image` (`snippets/head-meta-tags.liquid:69-71,92-93`) and `settings.color_success|color_error|color_warning|color_info` (`snippets/head-color-schemes.liquid:39-44`) are not defined in `config/settings_schema.json`. The `:root` block emits empty values that `head-design-systems` overrides.
- Change: delete the dead branches. The home `og:image` comes from `page_image`, the Online Store > Preferences social sharing image (merchant action).
- Acceptance: grep for those IDs in `snippets/` = 0; locale/range validators exit 0.

### P7 - `theme-color` follows the first colour scheme (Could)
- Evidence: `snippets/head-meta-tags.liquid:9` hardcodes `#ffffff`; Rebel background is `#F5F2ED`.
- Change: use `settings.color_schemes` first scheme background.
- Acceptance: home renders `<meta name="theme-color" content="#f5f2ed">` (case-insensitive).

### P8 - Social and JSON-LD image URLs are absolute (Must, added during R1)
- Evidence: `snippets/head-meta-tags.liquid` built `og:image`, `og:image:secure_url`, the article `image` and the publisher logo as `{{ request.origin }}{{ … | image_url }}`. `image_url` already returns a protocol-relative `//<shop>.myshopify.com/cdn/...` URL (shopify.dev `image_url` reference), so production output is `https://<shop>//<shop>.myshopify.com/cdn/...` [INFERENCE from the documented output; the production storefront is password-protected]. Dawn (`http:{{ page_image | image_url }}`) and Horizon (`https:{{ page_image | image_url }}`) prefix only the scheme.
- Change: `https:{{ … | image_url }}` at all four sites.
- Acceptance: no `request.origin }}{{` + `image_url` pair remains in `snippets/`; Liquid renders on dev.

### P9 - Scheme-derived tokens re-derive inside every colour-scheme host (Must, R2)
- Evidence: `snippets/head-design-systems.liquid` declares `--color-primary|text|paragraph|bg|gray*|border|info`, `--border-color`, `--color-bg-secondary|body|border-hover|heading|text-secondary` and the section hooks only on `:root`. A custom property that uses `var()` resolves on the element that declares it, so every `.color-scheme-N` host inherits scheme-1 values. Throwaway harness (`runs/token-harness.cjs`, Rebel values): inside `.color-scheme-3` (`#1A1A1A`), `--color-heading` = `rgb(10, 10, 10)`, i.e. near-black on near-black. The shipped Rebel config uses scheme-3/4 on the announcement bar, image-text overlay, parallax, testimonials and newsletter sections.
- Change: emit the derived tokens in one rule whose selector is `:root` plus `.color-<id>` for each `settings.color_schemes` entry.
- Acceptance: the harness reports scheme-3 heading `rgb(245, 242, 237)`. A computed-style diff between the base and fixed snapshots (10 pages x 1440/375) only changes elements inside non-scheme-1 hosts or border colours (P10).

### P10 - `--color-border` has one meaning: a colour (Must, R2)
- Evidence: each scheme class declares `--color-border` as an `r, g, b` triplet (`snippets/head-color-schemes.liquid:22`), while `:root` redeclares it as a colour. 32 consumers use it as a colour (`border: 1px solid var(--color-border, ...)`), and three use it as a triplet (`spacer-divider`, `custom-liquid`, `featured-collection`). Inside any scheme host the colour use is invalid at computed-value time and falls back to `currentColor`. Live `/collections/new-arrivals`: `.facet-filter__details` border = `rgba(10, 10, 10, 0.75)` (the text colour) instead of a hairline.
- Change: rename the scheme triplet to `--color-border-rgb`, derive `--color-border: rgb(var(--color-border-rgb))` per scheme (P9 rule), and move the three triplet consumers to `--color-border-rgb`.
- Acceptance: no `--color-border:` triplet declaration remains; the harness reports `solid rgb(217, 212, 204)` on scheme-1 and `rgb(74, 74, 74)` on scheme-3; the live facet border computes to the scheme border colour.

### P11 - Table of contents follows its colour-scheme setting (Should, R2)
- Evidence: `snippets/content-toc.liquid:10,18` read `settings.toc_bg_color|toc_text_color|toc_active_color`, which have no owner in `config/settings_schema.json`. They are rendered through the hardcoded fallbacks `#f3f4f6`, `#1f2937` and `#FF3300` (off-brand orange, Rebel accent is `#BC1E2C`). The schema-owned `settings.toc_color_scheme` has 0 consumers. The floating panel hardcodes `var(--color-white)`.
- Change: apply `color-{{ settings.toc_color_scheme }}` to both TOC elements. Use `--color-background-2`/`--color-foreground` for the panel. For the active item, use foreground text on an 8% button tint plus a button-coloured inset bar. Button colour as text would fail on Vibrant (2.67:1). Remove the ownerless inline styles.
- Acceptance: grep for `toc_bg_color|toc_text_color|toc_active_color` = 0. On every preset, the computed active-link contrast is at least 8.64:1 and the panel text contrast at least 9.88:1 (calculated from `settings_data.json`). The live article TOC renders scheme colours.

### P12 - Mobile footer menus are keyboard and screen-reader operable (Must, R2)
- Evidence: live 375x812 probe. Each `.footer-actions-menu__title` is an `H3` with a click handler (`assets/footer.js:14`): tabIndex -1, no role, no `aria-expanded`. The collapsed list has height 0 but `visibility: visible`, so its links stay in the tab order while invisible (WCAG 2.1.1, 2.4.7, 4.1.2).
- Change: inside the heading, render a `<button aria-expanded aria-controls>` shown below 768 px and the plain label shown at 768 px and up. The collapsed list gets `visibility: hidden`, delayed by the existing 0.3 s `max-height` transition, so the motion is preserved. JS toggles `.active` and `aria-expanded`.
- Acceptance: at 375 px, Tab reaches the four toggles and skips the links of collapsed menus. Enter/Space opens a menu and sets `aria-expanded="true"`. At 1440 px there is no toggle button and every link is visible.


## DONE contract

1. Every Must and Should proposal meets its acceptance checks; skipped items carry an accepted reason.
2. `check-discovery-surfaces.mjs` exits 0 against the running site with `--site-origin`, or every remaining error/warning is platform-owned (`/agents.md`, markdown twins, robots/llms.txt served by Shopify) and listed with the reason.
3. Screenshots at 1440x900, 768x1024, 375x812 of every changed page show no overflow, clipped text, overlap or broken images; vision review finds no High issue.
4. No rubric area regresses; areas below 2 reach 2 or are recorded as unresolved.
5. Keyboard checks pass on changed interactive elements. The reduced-motion check is replaced by the project rule banning `prefers-reduced-motion` (workspace AGENTS.md section 5).
6. `node scripts/validate-locales.mjs` and `node scripts/validate-schema-ranges.mjs` exit 0. `shopify theme check` runs only with user approval.
7. `DESIGN.md`, `REVIEW.md`, `AGENTS.md` reflect the delivered direction, with prior content preserved.
8. Processes started by the review are stopped (the pre-existing `shopify theme dev` is left running).

## Round log

| Round | Proposals done | Checks passing | Regressions fixed | Notes |
|---|---|---|---|---|
| 1 | P1-P8 (8/8) | Locale and range validators exit 0. render-check (30 captures): `dialog-visible-on-load` 16 -> 0, warn low-contrast 122 -> 6, error low-contrast 39 -> 30, clipped-text 29 -> 13, no overflow. Live probe (home and collection): no `#newsletter-popup`, no `newsletter-modal.js`/`.css` request, `twitter:site` `@devs2rebel`, `theme-color` `#F5F2ED`, no press placeholders, `--color-gray` alpha 0.7, badge `rgb(10,10,10)`/`rgb(245,242,237)`. Modal smoke (injected, `data-delay="1"`): hidden at 0/600 ms, open at 1300 ms, focus trapped inside, Escape closes, `newsletter_popup_closed` stored, body scroll released. | None | The 30 remaining contrast errors are white text over photography (slideshow counter, collection-list titles, about hero), confirmed by `runs/backdrop.js`. Runtime-error delta (90 -> 97) is Shopify monorail 429/CORS, the `shopify-account` Storefront API 400, and one transient search 504. All are platform telemetry, not theme code. Discovery scan errors open-graph 2 -> 10: the dev proxy rewrites `https://<shop>/cdn/` to `/cdn/`. The untouched `twitter:image` line (`https:{{ page_image | image_url }}`) renders `/cdn/...` on dev too, so this is a dev-only artifact of P8. |
| 2 (in progress) | P9-P12 implemented, static proof only | Locale and range validators exit 0. `runs/render-tokens.cjs` (real Liquid, 5 presets x root + 4 schemes): `FAILS 0`; scheme-3 heading `rgb(245, 242, 237)`, Rebel scheme-1 border `rgb(217, 212, 204)`, scheme-3 border `rgb(74, 74, 74)`. `runs/r2-footer-toc.cjs` (real `sections/footer.liquid` fragment, `assets/footer.css`/`footer.js`, `snippets/content-toc.liquid`, `assets/content-toc.css`): `FAILS 0`. At 375 px, Tab visits the 4 toggles only (24 px high). Enter on menu 1 and Space on menu 2 set `aria-expanded="true"` and the tab order includes their 3 links each. Closing hides the list again. At 1440 px no toggle renders and the tab order is the links. TOC minimum contrast across presets: panel 9.88, active link 8.78, trigger 3.06 (non-text, at least 3). Grep for `toc_bg_color\|toc_text_color\|toc_active_color` = 0. | None | Live verification is blocked: from Oct 10 02:04 the dev server answers every route with `302 /password`. `SHOPIFY_STOREFRONT_PASSWORD` is not set in the environment or `.env`. `runs/uxax-probe.cjs` now fails closed with `PASSWORD_GATE` rather than probing the password page. Still pending: P9 base-vs-fix computed-style diff, P10 live facet border, P11 live article TOC, P12 live 375 px probe, the R2 screenshots, and the discovery scan. |
| 2 (live verification, 2026-10-10) | P9-P12 verified live; base-vs-fix diff still pending | Dev server `http://127.0.0.1:9292` serves 200 again. Live P9: `--color-heading` resolves to `rgb(245, 242, 237)` inside the scheme-3 hosts (image-text overlay, parallax, testimonials, announcement bar). P10: facet `border-bottom` `1px rgb(217, 212, 204)`. P11: article TOC `toc color-scheme-1` with bg `rgb(235, 231, 224)` and text `rgb(10, 10, 10)`; TOC journeys pass 4/4 at 1440 and 375. P12: `footer-375` passes 5/5 (toggles, `aria-controls`, Enter/Space, 24 px), `footer-1440` passes 2/2. Screenshots at 1440x900, 768x1024, and 375x812 plus the discovery scan are in [`test-e2e-261010-storefront/`](test-e2e-261010-storefront/) | None | The P9 base-vs-fix computed-style diff was not run: it needs a base snapshot on an approved second dev theme. The E2E run found 13 new defects (F1-F13), recorded in [`test-e2e-261010-storefront.md`](test-e2e-261010-storefront.md) and outside P1-P12 |

## Unresolved questions
