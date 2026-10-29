# EditorF: editor integration and typography

All live results are provisional (shared dev server, `http://127.0.0.1:9292`). The controller's serial rerun is authoritative.

## 01 #10 and 05 E7: theme editor block/section events (done)

Files: `assets/theme-editor.js` (new), `snippets/head-script.liquid` (one `request.design_mode` block loads the script with `defer`; the file also returns early unless `Shopify.designMode`).

Handlers on `document`:
- `shopify:block:select` / `deselect`
  - A block inside `.swiper-slide`: wait for the Swiper instance (forces the lazy Swiper load, scrolls the host into view so IntersectionObserver-initialised sliders such as testimonials start, polls up to 4 s), pause autoplay, `slideToLoop` / `slideTo` to the block's slide. Deselect resumes autoplay only if the script paused it.
  - A block inside `[role=tabpanel]`: click its trigger (`aria-labelledby`).
  - A `details` block (collapsible, FAQ row): open on select, close on deselect only if the script opened it.
- `shopify:section:select` / `deselect`: pause / resume autoplay for every Swiper in the section.
- `shopify:section:unload`: destroy every Swiper in the section.

Custom elements that needed it: none. Slideshow, tabs, testimonials, collapsible, FAQ, announcement-bar and the featured/product carousels use inline section scripts or Swiper, so generic Swiper, tabpanel and `details` handling covers them.

Evidence (editor simulation: `window.Shopify={designMode:true}` set before scripts; `theme-editor.js` injected as a script tag because the dev server is not in design mode; events dispatched on the block element, because `block.shopify_attributes` is empty outside design mode). Same result at 1440 and 375:

| Case | Result |
|---|---|
| Home slideshow, select last slide (3 slides) | `realIndex` 0 to 2, slide has `swiper-slide-active`, autoplay running false; after deselect autoplay running true |
| Home testimonials (lazy, not initialised at load) | select initialised Swiper; 375: `realIndex` 2, block in viewport; 1440: 3 slides visible, in viewport |
| FAQ `details.faq-item` (6 rows) | closed to open on select, closed again on deselect |
| `sections/tabs.liquid` with 3 tabs (temporary page template, deleted afterwards) | select panel 3: panel 3 visible/active, `aria-selected` true, others hidden; then panel 2 the same |
| `shopify:section:unload` on slideshow section | Swiper destroyed |
| Console errors during the runs | 0 (only HotReload reconnect noise and third-party fetch errors, excluded) |

Known gap: the product `tab` block (`blocks/tab.liquid`) uses `product-template__tab-btn`, wired in `assets/product.js`. In my synthetic 2-tab product template a manual `button.click()` did not switch tabs either, so product-tab selection depends on product.js wiring, which is outside my files. My handler does click the button via `aria-labelledby`.

## 01 #11: `visible_if` in global settings (done)

`config/settings_schema.json` now has 65 `visible_if` conditions, no id missing (checked by script) and syntax `{{ settings.x }}`:
- float social: 44 (everything under `float_social_enable`; each channel's image/link/text also needs its own `float_*_enable`)
- newsletter popup: 7 (under `newsletter_modal_enable`)
- size guide page and button: 2 (under `product_size_guide_enable`)
- predictive search children: 7 (under `predictive_search_enabled`)
- megamenu image ratio: 1 (under `megamenu_show_images`)
- cart drawer collection, its header and `cart_color_scheme`: 3 (`cart_type == 'drawer'`; `cart_color_scheme` is read only by `cart-modal`)
- accent font picker: 1 (new)

Not done: section-level `visible_if` (hero, slideshow, video, main-collection) and the sticky add-to-cart and cart-note settings (no child controls). Those section files are owned by other slices.

## 01 #13 and 04 #3: typography (done, defaults unchanged)

New global ids (none exist in Dawn or Fabric, checked by script), in the Typography group:
- `type_accent_custom` (checkbox, default off), `type_accent_face` (font_picker, `visible_if` the checkbox)
- `type_display_scale` (100-300 %, default 100), `type_mobile_size_ratio` (0-100 %, default 40)
- per level H1-H6: `type_hN_scale` (50-400 %, default 100), `type_hN_line_height` (80-200 %, default 125), `type_hN_tracking` (-50..100 thousandths of an em, default -25), `type_hN_case` (default / uppercase)

Files: `config/settings_schema.json`, `locales/en.default.schema.json` (`settings_schema.typography.settings.*`), `snippets/head-design-systems.liquid` (tokens `--hN-scale`, `--hN-scale-mobile`, `--hN-line-height`, `--hN-tracking`, `--hN-case` when uppercase, `--display-scale(-mobile)`, `--type-mobile-ratio`, accent tokens plus a conditional accent rule), `snippets/head-fonts.liquid` (accent `@font-face`, only when custom accent is on; one small edit outside the owned list), `assets/base.css` (h1-h6 read their tokens; `.heading-size-2xl` multiplies by the display scale).

Mobile size = `1 + (scale - 1) * ratio`, so a large desktop size does not carry over in full. `font-size` multiplies the existing token for each breakpoint (mobile `--font-2xl`.. , 750 `--font-3xl`.., 1024 `--font-4xl`..), so `heading_scale` still applies.

The case token is emitted only for uppercase and the rule is `text-transform: var(--hN-case, inherit)`: a custom property of `inherit` is a CSS-wide keyword and would resolve to the guaranteed-invalid value. The accent rule (`[class*="eyebrow"], .font-accent`) is emitted only when the accent font is on, because with the setting off any rule at all would override `p { font-family }` and change the inherited font.

Default parity (probe `scratch/EditorF/typo.cjs`, baseline and after within about 12 minutes, 9 routes x 2 widths, h1-h6, body, p, `.section-subheading`, `[class*=heading-size|card-heading|subheading-size|eyebrow|title]`, buttons; font-family, size, weight, line-height, letter-spacing, text-transform): 1499 rows identical, 0 different, 1 row missing (product page element set varied between runs). Synthetic raw headings after the change (HEAD CSS gives the same values):

| | 1440 | 375 |
|---|---|---|
| h1 | 36px / 45px / -0.9px | 24px / 30px / -0.6px |
| h2 | 30 / 37.5 / -0.75 | 20 / 25 / -0.5 |
| h3 | 24 / 30 / -0.6 | 18 / 22.5 / -0.45 |
| h4 | 20 / 25 / -0.5 | 16 / 20 / -0.4 |
| h5 | 18 / 22.5 / -0.45 | 14 / 17.5 / -0.35 |
| h6 | 16 / 20 / -0.4 | 12 / 15 / -0.3 |
| body | 16px / 24px / normal | 16px / 24px / normal |
| card title `.megamenu__card-title` | 14px / 19.25px / normal | same |
| slideshow `.heading-size-2xl` | 48px | 36px |

Non-default values (CSS custom property overrides equal to what the settings emit, since `settings_data.json` was not changed): H1 340 % gives 122.4px at 1440 (line 90 %, +0.01em, uppercase all applied) and 47.0px at 375; display 250 % gives `.heading-size-2xl` 120px at 1440 and 57.6px at 375; accent override gives Georgia italic on an eyebrow-class element and Georgia italic 700 on `.font-accent`.

Hidden preset check: the only preset (`Rebel`) stores no type keys, so it takes the defaults above; listings presets carry templates only.

## 04 #12: easing tokens (done)

`snippets/head-design-systems.liquid`: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`; `--transition-fast/base/slow` are now 150/300/500 ms with `var(--ease-out)`. Live computed `--transition-base` = `300ms cubic-bezier(0.22, 1, 0.36, 1)`.
- Marquees do not use the tokens: `assets/section-scrolling-text.css:22` and `assets/section-logo-list.css:63` keep their own `linear infinite`; spinners and the slideshow progress bar also hard-code `linear`. No `animation` relies on a transition token for an infinite loop.
- Two consumers pick up the new curve as an improvement: `assets/base.css` reveal-on-scroll (`animation: reveal-on-scroll var(--transition-slow) backwards`) and `assets/collection.css:1259` `fadeInUp`.
- Finding for the owner of `assets/toast.css:15`: `transition: transform var(--transition-base) cubic-bezier(...)` holds two timing functions, so the declaration was already invalid with `linear` and still is; the toast does not animate. Drop the extra `cubic-bezier` there.

## Validators

`validate-locales.mjs` SUCCESS; `validate-schema-ranges.mjs` SUCCESS; `node --check assets/theme-editor.js` OK; `runs/e2e/settings-usage.cjs` exit 0 (settings 985, unread 0; global 228, unread 0); settings_schema, locale schema and settings_data parse. Temporary templates `product.eftabs.json` and `page.eftabs.json` were removed.

## Durable rules

- Global typography: every heading level reads `--hN-scale`, `--hN-line-height`, `--hN-tracking`, `--hN-case`; add new text styles by token, and emit a token only when its setting is non-default if an always-emitted value (such as a CSS-wide keyword) would change inheritance.
- Editor-only behaviour (`shopify:block:*`, `shopify:section:*`) lives in `assets/theme-editor.js`, loaded by `head-script.liquid` only under `request.design_mode`; sections must not register their own editor listeners.
- Use `--ease-out` (via `--transition-fast/base/slow`) for UI transitions; use `linear` only for continuous loops (marquee, spinner, progress).
