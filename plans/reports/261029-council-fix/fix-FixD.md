# FixD report — Item D (marquee pause control, WCAG 2.2.2)

Status: done (static verification only; no live probe run).

## Changes
- `assets/marquee-control.js` (new): one delegated click handler on `[data-marquee-toggle]`; toggles `.is-paused` on the closest `[data-marquee]` root and swaps `aria-label` between `data-label-pause` and `data-label-play`. Buttons ship `hidden` and are revealed by the script (on DOMContentLoaded and `shopify:section:load`). Guarded by `window.__marqueeControl`, so duplicate `<script defer>` tags (two marquees on a page, Theme Editor reloads) run it once.
- `sections/scrolling-text.liquid:11-52`: root gets `data-marquee`; track wrapped in `.section-marquee__viewport`; `.section-marquee__control` button (slideshow's pause/play SVGs) at the inline end; `<script src=marquee-control.js defer>`.
- `sections/logo-list.liquid:43-83`: marquee mode only. `.section-logo-list__marquee` gets `data-marquee`; track wrapped in `.section-logo-list__viewport`; `.section-logo-list__control` button; script tag. Grid layout untouched.
- `assets/section-scrolling-text.css:1-64`: root `display:flex`, viewport `flex:1 1 auto; min-width:0; overflow:hidden`, `.is-paused` joins the existing `:hover` pause rule, control styles (32px, border/hover invert/focus-visible ring, `[hidden]` rule, icon swap by `.is-paused`).
- `assets/section-logo-list.css:56-98`: same pattern for `.section-logo-list__marquee`.
- `locales/en.default.json:187-188`: `accessibility.pause_marquee` = "Pause scrolling text", `accessibility.play_marquee` = "Play scrolling text" (inserted next to the slideshow pause/play keys).

## Design notes
- The button is a flex sibling of the viewport, so it never overlaps the scrolling text; the viewport clips the track (`min-width:0; overflow:hidden`), so no horizontal overflow is added. The existing `:hover` pause is kept.
- No setting added; the button is always present in marquee mode.
- Used a label swap (like `.section-slideshow__rotation`), not `aria-pressed`, to avoid a double state announcement.
- Icons are the same inline SVGs as slideshow (the slideshow has no icon snippet).

## Verification
- `node --check assets/marquee-control.js`: OK.
- `node scripts/validate-locales.mjs`: SUCCESS. `node scripts/validate-schema-ranges.mjs`: SUCCESS. `node runs/e2e/settings-usage.cjs`: exit 0.
- `curl http://127.0.0.1:9292/`: 200.
- Fixed one bug found on review: `--transition-fast` is already a duration+easing shorthand, so it is used alone in `transition`.

## Known gaps
- No live measurement of 375/1440 overflow or hit-target size (controller to measure): button is 2rem = 32px.
- The paused state resets when the Theme Editor reloads the section.
