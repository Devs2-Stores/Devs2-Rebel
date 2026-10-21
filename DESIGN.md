# Design direction - Rebel

Read this before any storefront UI work. Token values live in
`snippets/head-design-systems.liquid` (layout, type, spacing, radius, shadow,
motion) and `snippets/head-color-schemes.liquid` (colour schemes and status
colours). Merchant-facing values come from `config/settings_schema.json` and the
presets in `config/settings_data.json`. When this file and those sources disagree,
the source wins; update this file to match.

## Brand essence

Editorial tailoring for the street: bone, black and crimson, square edges, and
the photograph first.

## Art direction

- Full-bleed editorial photography carries the page. Text sits on the photo
  only behind a measured overlay (see "Text over images").
- One accent colour per scheme (`button`). In the Rebel preset that is crimson
  `#BC1E2C`. It fills the primary call to action and marks sale prices, sale
  badges and the cart count. Everything else is bone, black or oxblood: see
  "Clean system" for the colour roles.
- Square corners on buttons, inputs, cards, media and popups. Badges and variant
  pills are rounded (Rebel `badge_corner_radius` and `variant_pills_radius` 40).
- One Inter family for headings, subheadings and body (`type_*_font` default
  `inter_n4`). Hierarchy comes from the type scale, weight and uppercase
  tracking on subheadings, not from extra faces.
- Hero copy is short and declarative, using tailoring vocabulary: "Cut, draped,
  made to be worn", "The tailored anti-uniform", "Cherry red, cut close to the
  bone".

## Presets

All five presets share one component architecture. A preset changes only
settings: scheme colours, radii, and type settings. The current preset is Rebel.

| Preset | scheme-1 bg / text / accent | Character |
|---|---|---|
| Rebel | `#F5F2ED` / `#0A0A0A` / `#BC1E2C` | Bone and crimson, oxblood scheme-4 `#4A0E16`, square, pill badges |
| Noir | `#F9F9F9` / `#111111` / `#111111` | Monochrome, square throughout |
| Vibrant | `#FFF7ED` / `#1A1A1A` / `#FF5E00` | Orange accent and an orange scheme-4 fill, square |
| Botanical | `#FAF8F5` / `#2D3B2F` / `#3B533E` | Greens, rounded (buttons 20, inputs 12, cards 16, media 12) |
| Cyber | `#0D0E12` / `#E2E8F0` / `#00FFCC` | Dark-first neon, radius 4 |

A new preset adds settings and scheme values only. It must not add selectors or
markup branches.

## Tokens

| Group | Tokens | Values |
|---|---|---|
| Breakpoints (mobile-first `min-width`) | `--breakpoint-sm/md/lg` | 750 / 1024 / 1200 px. Raw px in `@media`, because `var()` does not work there |
| Type scale | `--font-xs` ... `--font-6xl` | 0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 4 rem. Below it sits one micro step, 0.6875 rem (11 px), allowed only for count pills (cart count), uppercase card badges and the merchant-chosen "xs" text size (`.content-size-xs`). Nothing renders below 11 px |
| Weights | `--font-weight-normal/medium/semibold/bold` | 400 / 500 / 600 / 700. `snippets/head-fonts.liquid` emits a 500 and a 600 face for every font setting whose family has them (`font_modify` returns nothing otherwise), so medium and semibold do not fall back to the 400 or 700 face |
| Line heights | `--line-height-none` ... `--line-height-loose` | 1, 1.25, 1.375, 1.5, 1.625, 2 |
| Spacing | `--space-2xs` ... `--space-5xl` | 0.125 rem to 3 rem |
| Radius | `--radius-sm/md/lg/xl/full`, plus settings-driven `--buttons-radius`, `--inputs-radius`, `--card-corner-radius`, `--media-radius`, `--badge-corner-radius` | 4 / 8 / 12 / 16 / 9999 px. The settings-driven tokens set the preset character |
| Shadow | `--shadow-sm/md/lg/xl` | Black at 0.05 to 0.15 alpha |
| Layering | `--z-header` 49, `--z-float` 90, `--z-dropdown` 100, `--z-sticky` 200, `--z-toast` 900, `--z-modal` 9000, `--z-overlay` 9500 | Use the scale; do not invent z-index values |
| Scheme colours | `--color-text`, `--color-paragraph` (0.75), `--color-gray` (0.7), `--color-bg`, `--color-primary`, `--color-border` | Derived per `.color-scheme-*` from `color_schemes` |
| Component surface | `--color-surface` | Per scheme: `#FFFFFF` while the scheme text keeps 4.5:1 on white, otherwise the scheme's `background_2`. Panels, drawers, dropdowns, cards, inputs and tab hosts paint it |
| Status fills | `--color-success`, `--color-warning`, `--color-error` | `#15803d` / `#a16207` / `#dc2626`. White text on them reaches 5.02 / 4.92 / 4.83 |
| Status text | `--color-success-text`, `--color-warning-text`, `--color-error-text` | Per scheme: the fill mixed toward the scheme text colour (`color_mix`) until `color_contrast` against its own 14% tint is at least 4.6 |
| Clean system | `--color-ink`, `--color-muted`, `--color-hairline`, `--color-selected`, `--color-focus`, `--color-primary-strong` | Ink is the scheme text, muted is `--color-subtext-text` (the scheme Subtext colour, raised to 4.6:1), hairline is `--color-border`. Selected and focus use ink. Primary-strong is the button colour 14% toward black, for hover |
| Component sizing | `--btn-height` 3 rem, `--btn-padding-x` 1.75 rem, `--btn-font-size` 0.875 rem, `--btn-font-weight` 600, `--eyebrow-size` 0.75 rem, `--eyebrow-weight` 600, `--eyebrow-tracking` 0.14 em, `--heading-tracking` -0.02 em, `--meta-size` 0.8125 rem | Shared by every section's buttons, eyebrows and meta lines |
| Rhythm | `--space-6xl` 4 rem, `--space-7xl` 6 rem, `--section-head-gap` (2 rem, 2.5 rem from 1024 px), `--stack-gap` 1.25 rem | Section heading to content, and between stacked text blocks |
| Floating layer | `--shadow-float` | Floating buttons, the sticky add-to-cart bar and toasts |
| Component families | `--{inputs,variant-pills,media,text-boxes,popup,drawer}-{border,shadow,radius}`, `--buttons-shadow`, `--buttons-outline-border`, `--color-form-bg`, `--color-form-text` | Built from the Theme settings panels of the same name and the scheme form colours. Rebel stores 1 px hairline borders on inputs, pills, pop-ups and drawers, no media border, and `--shadow-float` values on pop-ups and drawers |
| Card | `--card-border`, `--card-shadow`, `--card-image-padding`, `--card-corner-radius` | Built from the merchant card settings. Rebel sets every one to 0 |

## Clean system

The storefront reads as one quiet editorial surface. Photography and type
carry it; chrome stays out of the way.

- **Colour roles.** Ink (`--color-ink`) marks what is selected, active or
  focused: chosen variant pill, active tab, active filter, current page,
  focus ring, link hover. Crimson (`--color-primary`) only fills the primary
  call to action (`.button-primary.active`: add to cart, checkout, the newsletter
  submit) and marks sale (`--color-sale-price`). Muted (`--color-muted`) is
  for meta: vendor, dates, captions, compare-at prices, helper text.
  Eyebrows and section labels are muted or ink, never crimson. Text links are
  ink with an underline.
- **No boxes.** A section never wraps its content in a bordered or shadowed
  panel on the page background. Cards, tabs, accordions, testimonials,
  inputs and images carry no shadow by default. Group with space; separate
  with one hairline (`1px solid var(--color-hairline)`) when a divider is
  needed. Where two components meet, only one of them draws the divider (a
  title rule followed by a toolbar rule reads as a double line). Fields,
  pills, media frames, content boxes, pop-ups and drawers take their border
  and shadow from their family token, so the Theme settings panels reach
  them; never hard-code a border or `--shadow-float` on them.
- **Cards.** The image runs flush; the text sits under it with
  `0.875rem` above. Title medium weight in ink, shown in full (no line clamp),
  price regular weight with each amount kept on one line, sale
  price in `--color-sale-price`. Card hover is an image zoom of 3% at most and
  an underline on the title, no lift. A lift happens only when the merchant
  picks Theme settings > Animations > Hover effect (`vertical-lift`,
  `3d-lift`). Badges share one corner set by the Badges position setting;
  bottom badges move above the card actions while those are shown, and the
  sale and sold-out badges take their scheme from the Badges settings.
- **Section head.** Eyebrow (`--eyebrow-*`, uppercase, muted), heading
  (heading font, `--heading-tracking`, `text-wrap: balance`), optional intro in
  `--color-paragraph`, then `--section-head-gap` to the content. A "View all"
  link sits on the heading baseline, ink, underlined on hover.
- **Buttons.** `.button-primary.active` is the main call to action:
  `var(--color-primary)` fill with `rgb(var(--color-button-text))` label, so
  scheme-4 (bone button, oxblood label) stays readable. `.button-primary`
  alone and `.button-secondary` are a 1px ink outline that fills with ink on
  hover. On photography, use `--color-white` fill with `--color-black` label,
  or a white outline; never ink text on a white fill. Height `--btn-height`,
  sentence case. Hover changes colour only: no lift, no shadow.
- **Rhythm.** Consecutive sections share one background unless the change
  carries meaning (dark testimonial band, oxblood newsletter). Alternating
  bone and white between ordinary sections is noise.
- **Sliders.** A product slider starts on the page-width left edge and may
  bleed only to the right. Arrows are quiet ink icons; dots are ink. Below
  750 px a product carousel shows about two cards plus a peek
  (`slidesPerView: 2.1`, with the matching pre-init `--swiper-cols-mobile`) and
  relies on swipe: hide prev/next there, because arrows centred on a tall card
  land on the quick-add button or the badges.
- **Icons.** Outline interface icons render a 1-1.25 px line:
  `stroke-width="1.5"` on a 24 px viewBox drawn at 16-24 px. The 12 px link
  chevron in icon boxes keeps 2.5 for the same rendered weight, and 40 px+
  empty-state illustrations use 1. Full-colour payment icons and filled brand
  glyphs are exempt.
- **Page titles.** Every page H1 (collection title and hero, cart, search,
  list pages) uses `--font-heading-weight`; do not hard-code a bold weight.

## Motion

- Durations: `--transition-fast` 150 ms, `--transition-base` 300 ms,
  `--transition-slow` 500 ms (all `linear`). `--duration-short/default/medium/long`
  are 100 / 200 / 300 / 500 ms; use them where a rule keeps its own easing.
  Marquee: `--marquee-duration` 30 s.
- Keep intentional motion: press, reveal, hover, marquee, slider and drawer
  transitions.
- The workspace bans `prefers-reduced-motion` (`../AGENTS.md` section 5). Do
  not add the media query or its JavaScript equivalent.
- An overlay becomes visible before focus moves into it. Time the `visibility`
  change; do not remove the transition.
- A hover that lifts, zooms or nudges with `transform` sits inside
  `@media (hover: hover)`, because a tap leaves `:hover` applied on touch
  screens. Colour, border, underline and shadow feedback stays outside the
  query. Reveals that also open on `:focus-within` are not decorative.
- Content a script fades in starts visible. Scope the hidden start state to
  the upgraded element (`my-element:defined .item`), so the content shows when
  the script never runs. A count-up renders its final value in Liquid; the
  script resets it to 0 only when it can animate.

## Component rules

- Use opt-in BEM component classes and tokens. Do not style bare elements, and
  do not use `!important` or hex values in component rules. A scheme-aware
  colour is a token.
- Keep `.container` / `page-width` on its own element. Grid and flex belong to
  a child wrapper.
- Muted text uses `--color-gray` or `--color-paragraph`, never `opacity` on the
  text. Opacity dropped compare-at prices to 3.26:1.
- Status colours: a filled badge or toast uses `--color-{status}` with white
  text. Status text and outlined badges use `--color-{status}-text`. Their tint
  is `color-mix(in srgb, var(--color-{status}-text) 14%, transparent)`. Never
  use the fill colour as text colour.
- Component surfaces (cart drawer, search panel, megamenu, mobile menu,
  filter drawer, quick view, tabs, cards) paint `--color-surface`; inputs
  paint `--color-form-bg` with `--color-form-text`. Text uses scheme text
  (`--color-text`, `--color-gray`). Never pair
  `--color-white` or `--color-black` with scheme text: in a dark scheme that
  gives light text on white. Constant white stays only on brand, status or
  photo backdrops (`--color-primary`, `--color-{status}`, overlays).
- Separators between inline items are CSS (`::before` on the next item), not
  `<li>|</li>` text, so screen readers do not count them as list items.
- Empty data renders nothing on the storefront: a blank SKU or barcode hides
  its row (never "N/A"), and a section whose product or blog is blank or empty
  renders only its editor placeholder under `request.design_mode`.
- Text over images reaches 4.5:1 (3:1 at 24 px+, or 18.66 px+ bold) against
  every backdrop pixel of the text box. Measured settings: the hero uses opaque
  white text, and the about hero uses a flat overlay of 55. The slideshow
  counter sits on an `rgba(0, 0, 0, 0.55)` pill. Collection cards use the
  overlay `rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 35%, transparent 70%`.
- Targets are at least 24 x 24 CSS px (WCAG 2.2 AA 2.5.8), or meet its spacing
  exception. Slider bullets keep their 8 px dot inside a 24 px hit area.
- Overlays (cart drawer, mobile menu, megamenu, filter drawer, quick view,
  size guide, product lightbox): dialog or disclosure semantics, a focus trap,
  Escape to close, and focus returned to the trigger. A trigger is a real
  button; a clickable `<img>` alone is mouse-only. Nothing focusable sits
  inside `aria-hidden`; use `inert` for duplicate tracks such as the logo list
  marquee. The marquee products section is a scroll-snap carousel with
  prev/next buttons and no duplicate track.
- Scroll lock has one owner: `ThemeUtils.lockScroll()`/`unlockScroll()`. They
  lock the root element, because `html { overflow-x: clip }` stops `body`
  overflow from reaching the viewport. Never set `body.style.overflow` in a
  component.
- Card actions appear on `:focus-within` as well as `:hover`.
- An accessible name contains the visible label. A colour value without a swatch
  image renders as a text pill.
- Render Shopify images through `image_tag` with `alt`, `class` and `loading`
  passed as parameters. The LCP hero is eager with `fetchpriority="high"`.
- A component that sets `display` on its host also sets `[hidden] { display:
  none; }`, otherwise the `hidden` attribute stops hiding it. When `hidden`
  owns visibility, the class never sets `display: none` itself, otherwise
  clearing the attribute never shows it.
- A block with its own colour settings defaults them to blank so it inherits the
  active scheme. On an inverted surface (background = scheme text) its button
  uses `--color-inverse-button` and `--color-inverse-button-text`. When the
  merchant picks a colour, the snippet picks the label with `color_contrast`
  against black and white, whichever is higher.
- A countdown reads the end date in the store time zone (`data-tz-offset` from
  `'now' | date: '%z'`), runs one timer per element that stops on disconnect,
  and uses `role="timer"` without `aria-live`, so screen readers are not told
  every second.
- A status that depends on the time of day (store "Open now") is computed in
  the place's own IANA time zone, falling back to the shop offset, never the
  shopper's device clock. With no zone known it stays blank. A status a timer
  refreshes is not a live region.

## Voice and tone

- Short declarative lines in English, stored in `locales/en.default.json`. No
  copy hardcoded in Liquid, JavaScript or schema defaults.
- Translate a merchant setting only when it is blank: assign the setting, then
  `if x == blank` assign `'key' | t`. Never pipe merchant text through `| t`,
  and never add an English `default:` after `| t`; a missing key must fail the
  locale validator, not hide behind source copy.
- Errors speak the shopper's language. Show the server `description` or a
  locale string, never a parser message such as `Unexpected token '<'`.
- Promises such as shipping, returns or stock need real store facts. Generic
  merchant copy ("Welcome to our store") is a content gap, not theme copy.

## Do and don't

| Do | Don't |
|---|---|
| `color: var(--color-error-text)` for an inline error | `color: #dc2626` or `color: var(--color-error)` on text |
| Measure contrast over the photo pixels | Trust a checker that compares white text with the page background behind an `<img>` |
| Opaque white hero text on a measured overlay | `rgba(255,255,255,0.82)` text on a bottom-weighted gradient |
| Mobile-first `@media (min-width: 750px)` | `@media (max-width: 768px)` with `!important` overrides |
| Wrap long article navigation titles in full | A two-line clamp on right-aligned text: Chrome drops the ellipsis there |
| `inert` on a duplicated marquee track | Focusable links inside an `aria-hidden` clone |
| Let product, collection and article titles wrap in full (Theme Store: not truncated). Keep `collection.description` reachable in full, rendered whole or behind a Read more toggle | `line-clamp` or `truncatewords` on those titles, or a cut `collection.description` with no way to expand it |
