# UI/UX council fix loop - summary (2026-10-30)

Source: `.omp/ux-ui-all/REPORT.md` (verifier verdicts, Kongming). Scope: every row the verifier marked confirmed. Dropped rows were not touched.

## Fixed and measured on the dev server (375 and 1440)

| Row | Change | Evidence |
|---|---|---|
| Slideshow bullet focus ring | white `:focus-visible` outline on bullets (`section-slideshow.css`) | keyboard focus: solid 2px rgb(255,255,255), 375 and 1440 |
| Hero eyebrow contrast | preset slide overlay 45 -> 55 (`templates/index.json`, range step 5) | computed overlay rgba(0,0,0,.55); pixel ratio not re-measured |
| Card hover zoom | 1.05 -> 1.03 in collection-list, blog-posts, gallery | computed transform matrix(1.03) at 1440 |
| Marquee pause (WCAG 2.2.2) | pause button + `assets/marquee-control.js`, locale keys | 32px button; Enter and click toggle `animation-play-state`, label swaps; 0 overflow |
| Tagline and press heading | preset `text_size` xl, press `heading_size` sm | preset only |
| Trending now peek | item width `min(40vw, 220px)` | item lefts at 375: 15, 181, 347 (third card peeks) |
| Sort count ellipsis | wraps below 750px | scrollWidth == clientWidth at 375 |
| Featured thumbs 4+2 | one scrolling row below 750px | CSS; not re-measured live |
| Footer double hairline | slogan border only at 750px and up | 375 lines at 4447 / 4623 / 4673 / 4721 / 4771 / 4847, none 24px apart |
| Inputs under 16px | `--font-input` token (`theme.css`): `--font-sm` on desktop, 16px below 750px; ten input rules use it; the global rule is `:where()` (0 specificity) | 0 inputs under 16px at 375 on 6 routes, hidden ones included; section-newsletter input is 14px instead of 15px on desktop |
| Plural search copy | `view_all_results`, `results_count` one/other | locale validator pass |
| Product JSON-LD offers | `name` per variant | 3 offers named at 375 and 1440 |
| Easings | 38 bare easings tokenised in 31 files; drawer, quick view, size guide, cart dim | quick view slides in and out, reopen during exit works, 0 page errors |
| Description toggle | animates max-height | 300 -> 394 (120 ms) -> 400, collapses to 300 |
| Slideshow delay chain | 0.3/0.5/0.7/0.9 s -> 0.1/0.18/0.26/0.34 s | CSS |

## Not changed

- Input border contrast (1.32:1): the owner decides; DESIGN.md documents hairline inputs.
- Nits: spot-checked by the verifier only.

## Gates

- `validate-locales`, `validate-schema-ranges`, `settings-usage` (985 read, 0 unread), `node --check` on touched JS, JSON parse: pass.
- `theme.qa_validate` (dev tab, workspace root = repo), rerun after the final edits: FAIL / STRUCTURAL on `/` (5 critical), `/collections/all` (7), product (5), `/cart` (4), `/search?q=jacket` (6). Known classes: 4x megamenu `OVERLAY_POINTER_EVENTS_NONE` per route (closed panel), demo-photo `image-crop`, `title-scale` for the intended hero size. `/search` also reports `STATE_STUCK_OPEN` on the megamenu trigger: the menu opens on hover and closes on mouse-away or Escape with the pointer off the trigger, identically on `/` (header unchanged apart from a transition token); Escape while the pointer rests on the trigger does not close it, which predates this fix. No CERTIFIED receipt, so the gate stays open.
- `shopify theme check` (approved 2026-10-30): first run found 7 offenses introduced by commit 05f7489 (3 `visible_if` on `collection`/`page` settings in `config/settings_schema.json`, 4 undefined footer region variables). Fixed in 8b775e0; rerun: 267 files, no offenses.
- `dist/rebel-v1.0.0.zip` rebuilt: 305 files, 0.53 MB, every entry byte-equal to the working tree.
- Demo store `rebel-streetwear-hn0q7d9h` (theme 160556351559) synced through the Admin API (approved, including `config/settings_data.json`, whose MD5 matched no repo commit but whose parsed `current` preset equalled the pre-rename repo version, so it is JSON-equal rather than byte-equal): 156 files upserted, 3 stale files deleted (`assets/page-about.css`, `assets/page-about.js`, `snippets/shop-social.liquid`). All other files match the repo by MD5. `settings_data.json` differs from the repo by formatting only (JSON-equal after Shopify's rewrite).
- Correction, found on review: after the first upsert the demo `sections/header-group.json` was missing every header setting except `color_scheme` and `menu`, including the non-default `transparent_home: true` (schema default `false`), so the home header was not transparent. An earlier note called this "default values stripped"; that was wrong. Upserted again on its own: remote parses JSON-equal to the repo on every key, and the demo home header now renders `data-transparent` with a transparent background and white foreground (`/collections/all` stays solid, as configured). The cause of the first drop is unknown; only the end state was verified.
- Customised demo files merged in place, not overwritten: `templates/index.json` got the 5 repo changes (overlay 45 -> 55 on 3 slides, tagline `text_size` xl, press `heading_size` sm). `sections/footer-group.json` took the repo's composable footer blocks with the demo's own menus (`footer`, `footer-help`, `footer-company`); the repo's `menu-explore` block and the demo's `footer-legal` column are dropped, since policies now render from `show_policies`.
- Live on the demo after CDN propagation (about 3 min of 502 on new asset URLs): 33 stylesheets, 0 empty, slideshow overlay `rgba(0,0,0,0.55)`, footer columns Shop / Help / Company, 4 policy links. `theme.qa_validate`: FAIL / STRUCTURAL, 5 critical (4x megamenu `OVERLAY_POINTER_EVENTS_NONE`, 1 demo-photo `image-crop`). No CERTIFIED receipt.
