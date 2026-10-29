# fix-ArchG: generic theme blocks and composer section

Items: 01 #1 (reusable generic theme blocks, nesting) and 01 #2 (generic composer section). New files only; no existing section, block, template or group was edited.

## Item 01 #1 - generic theme blocks: done

Files (all new): `blocks/text.liquid`, `heading.liquid`, `button.liquid`, `image.liquid`, `icon.liquid`, `spacer.liquid`, `divider.liquid`, `group.liquid`, `assets/block-generic.css`.

- No name collision: the existing 21 blocks are product blocks (`separator`, `custom_liquid`, `icon_with_text`, ...); none is called text, heading, button, image, icon, spacer, divider or group.
- Every block has `{% doc %}`, `{{ block.shopify_attributes }}` on its wrapper, `"tag": null`, one preset with a `t:` category (`Basic` / `Layout`).
- `group` accepts `@theme` and `@app` via `{% content_for 'blocks' %}`, so nesting is unbounded (preset reaches section > group > group > leaf). Settings: direction, stack on mobile, gap (0-96/4), horizontal and vertical alignment, width in parent (fill/fit), show colour-scheme background + `color_scheme` (visible_if), padding (0-96/4).
- Blocks render empty data as nothing on the storefront (blank text, blank heading, blank button label, no image) and keep a selectable wrapper only under `request.design_mode` (DESIGN.md rule).
- Rebel tokens only: `--color-ink/paragraph/muted/hairline`, `--eyebrow-*`, `--heading-tracking`, `--media-radius/border/shadow`, `.button-primary active | .button-secondary | .button-primary white` for the 3 filled button styles, `--btn-*` for the text link. No hex, no `!important`, no reduced-motion, no static inline CSS (dynamic values go through custom properties).
- All 8 blocks are public, so any section that accepts `@theme` (`main-product`, `featured-product`) now also offers them. They do not depend on the host section.

## Item 01 #2 - composer section: done

Files: `sections/section.liquid` ("Custom section"), `assets/section-custom.css`.

- Accepts `@theme` and `@app`, `disabled_on` header group, loads `section-custom.css` and `block-generic.css`.
- Settings: color scheme, direction, stack on mobile, gap (0-120/4), alignment, vertical alignment, section width (page/narrow/full), min height (0-800/20, 0 = auto), desktop and mobile paddings (same ranges as `rich-text`).
- 5 presets, nested blocks with t: copy in Rebel voice: Split showcase (row: image + group of eyebrow, heading, text, button), Pull quote (icon, heading as `p`, attribution eyebrow), Big statement (scheme-4, min-height 420, eyebrow, 2xl heading, button), Icon row (heading + horizontal group of 3 groups of icon, heading, text), Centered call to action (eyebrow, heading, text, horizontal group of solid + outline button). Preset button links use `shopify://collections/all`.

## Locale

`locales/en.default.schema.json`: new top-level `blocks` namespace (`blocks.common.*` shared options, one subtree per block) and `sections.custom_section.*` (settings + preset names + preset copy). No storefront strings were needed (no hardcoded English; the only generated alt text is the merchant's own or the file alt). `node scripts/validate-locales.mjs` SUCCESS (no stale keys).

## Evidence (provisional, offline + shared dev server)

Probes under `scratch/archg/` (gitignored): `harness.cjs` (liquidjs engine with a `content_for 'blocks'` tag, real block and section files, preset-built block trees, schema defaults, Rebel preset + global setting defaults), `run.cjs`, `combo.cjs`, `live.cjs`.

- `run.cjs`: 5 presets x 1440 and 375 x {with image, design mode, no image + design mode} with the real `reset/base/theme/section-custom/block-generic` CSS. ALL PASS: document overflow 0, no element right of the viewport, no unresolved `MISSING:` / `{{` / `t:` in the HTML, heading computed font-family equals `--font-heading-family` and differs from the body family, every button >= 48 px high (min 24 x 24), every `<img>` has alt, width and height (1600x2000), icon row renders 3 icons and the nested group depth 2, rows are `row` at 1440 and `column` at 375 for stacked groups.
- `combo.cjs`: non-default settings (row, right, bottom, full width, min height 300, scheme-3, `fit` group on scheme-4 with padding, unbreakable 2xl heading, text/light/outline/full-width buttons, blank-label button, divider in a row, 160 px spacer). Overflow 0 at both widths; blank-label button renders nothing; the divider becomes a 2 x 614 vertical rule in a row. This found two bugs, both fixed: `hr { height: 0 }` in `reset.css` stopped the row divider stretching, and `overflow-wrap: break-word` let a long word escape (now `anywhere`).
- `live.cjs`: the same rendered HTML injected into `http://127.0.0.1:9292/pages/about` with the dev server's own `theme.css` and the new CSS files served from `/cdn/.../assets/`: LIVE ALL PASS at 1440 and 375 (overflow 0, heading font equals the live `--font-heading-family` Inter, weight 400 as for other headings, buttons 181x48 / 112x48 / 191x48, image attrs, new CSS files loaded). Screenshots in `scratch/archg/shots/`. A section cannot be placed on a live template without editing shared `templates/*.json`, so this injection is the live proof.
- Validators: `validate-locales.mjs` SUCCESS, `validate-schema-ranges.mjs` SUCCESS, `runs/e2e/settings-usage.cjs` exit 0 (985 settings, 0 unread or unrendered), every changed schema parses.
- Theme Check by inspection against `_reference/fabric/blocks/` and `sections/section.liquid`: LiquidDoc on all 8 blocks, `@theme`/`@app` only on the section and `group`, `content_for 'blocks'` in both, `image_tag` carries width/height, no schema settings without `t:` labels. Not run with the CLI (forbidden by the contract).

## Known gaps / call-outs for the controller

- Migration of the old sections (`hero`, `image-with-text`, `image-text-overlay`, `rich-text`, `icon-boxes`, `multicolumn`, ...) to these blocks is out of scope and untouched; the duplicated section-local heading/text/button schemas remain. Footer and other `@theme` adoption is a separate item.
- The new section is not in any template or group; add it from the editor (Add section > Text) or reference `section` in a template. `theme.qa_validate` has not been run for it.
- Block `icon` offers 10 outline icons plus the filled quote mark from the existing sprite; no custom image icon.
- Image block: no storefront placeholder when no image is picked (DESIGN.md "empty data renders nothing"), so the split showcase preset shows text only until an image is chosen.
- Section category is a `t:` key (`Text`); other sections still use literal categories (gap 7).

## Durable rules

- Generic blocks in `blocks/` are public (accepted by every `@theme` section), style from scheme tokens only, and render nothing on the storefront when their content is blank.
- A flow container (`.blocks-flow`) owns layout: it sets `--flow-h/--flow-v/--flow-gap/--flow-text` from its settings and children never set their own parent alignment; row-to-column stacking uses the `--row-wide` / `--row-always` modifier pair.
- `hr` in `reset.css` has `height: 0`; a vertical divider must set `height: auto` to stretch.

Status: DONE_WITH_CONCERNS
Summary: Eight generic public blocks and the `section` composer with five nested presets are in place and verified offline plus injected into the live dev page; the section is not placed on any template and `theme.qa_validate` was not run.
Items:
- 01 #1 generic theme blocks and nesting: done
- 01 #2 composer section with 5 presets: done
