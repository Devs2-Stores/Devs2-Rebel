---
phase: 4
title: "Performance, Presets & Packaging"
status: pending
priority: P1
effort: "6h"
dependencies: ["phase-03-theme-blocks-and-modern-liquid.md"]
---

# Phase 4: Performance, Presets & Packaging

## Overview
Achieve elite Core Web Vitals performance, multi-market aesthetic versatility, and flawless packaging for Shopify Theme Store submission. Embed the Speculation Rules API for instant 0ms page loads, apply CSS Subgrid for responsive product card alignment, ensure 100% compliance with the zero `prefers-reduced-motion` invariant, deliver 5 complete style presets in `settings_data.json`, purge 58% schema bleed from `locales/en.default.json`, and set up CI Range Math and packaging validation.

## Requirements
- **Speculation Rules API:** Inject speculation rules JSON script in `snippets/head-script.liquid` to prerender product pages and prefetch collections.
- **CSS Subgrid:** Apply `grid-template-rows: subgrid` to `.product-card` with an `@supports` query and graceful Flexbox fallback.
- **Motion Invariant:** Strictly audit all CSS/JS files to ensure ZERO `@media (prefers-reduced-motion)` blocks exist in the codebase.
- **5 Style Presets:** Define 5 complete, distinct market presets (**Rebel**, **Noir**, **Vibrant**, **Botanical**, **Cyber**) in `config/settings_data.json` sharing identical schema token structures.
- **58% Locale Bleed Purge:** Remove 2,114 lines of editor schema bleed (lines 443–2556) from `locales/en.default.json`, reducing file size from 75KB to ~31KB while preserving all 10 storefront namespaces.
- **Range Math Validation:** Create `scripts/validate-schema-ranges.mjs` to ensure `(max - min) % step === 0` and `(default - min) % step === 0` across all theme schemas.
- **Packaging Workflow:** Configure `.github/workflows/theme-store-ci.yml` and `/listings/` submission assets.

## Architecture
```
Browser Navigation Optimization
 ├── Speculation Rules API (head-script.liquid)
 │     ├── Prerender: /products/* (eagerness: moderate)
 │     └── Prefetch: /collections/*, /blogs/* (eagerness: conservative)
 └── CSS Subgrid (assets/product-card.css)
       ├── Row 1: Media (aspect-ratio locked)
       ├── Row 2: Vendor
       ├── Row 3: Product Title
       ├── Row 4: Price & Badges
       └── Row 5: Swatches

Theme Store Distribution Pipeline
 ├── Automated Validation: validate-schema-ranges.mjs & validate-locales.mjs
 ├── Strict Whitelist Zipper: assets, config, layout, locales, sections, snippets, templates
 └── Package Output: dist/devs2-rebel-store.zip (< 50MB, 0 root dotfiles)
```

## Related Code Files
- Modify: `snippets/head-script.liquid`
- Modify: `assets/product-card.css`
- Modify: `locales/en.default.json`
- Modify: `config/settings_data.json`
- Create: `scripts/validate-schema-ranges.mjs`
- Create: `scripts/validate-locales.mjs`
- Create: `.github/workflows/theme-store-ci.yml`
- Create: `listings/manifest.json`

## Implementation Steps
1. In `snippets/head-script.liquid`:
   - Append the `<script type="speculationrules">` block configuring moderate prerendering for internal product URLs and conservative prefetching for collections and blogs (excluding cart and checkout routes).
   - Wrap the script in `{%- unless request.design_mode -%}` to prevent speculation rules from breaking or refreshing the Shopify Theme Editor customizer iframe during merchant edits.
2. In `assets/product-card.css`:
   - Add `@supports (grid-template-rows: subgrid)` block declaring subgrid tracking chained through `.product-card`, `.product-card__wrapper`, and `.product-card__content` so grid items at deep DOM levels align properly.
   - Retain baseline flexbox rules with `margin-top: auto` for browsers lacking Subgrid support.
   - Grep for `prefers-reduced-motion` and verify 0 occurrences across all `.css` files.
3. In `locales/en.default.json`:
   - Replace lines 443–2556 with the sanitized storefront dictionary containing the 10 active namespaces: `announcement_bar`, `cart`, `cart_recommendations`, `collection_list`, `collection_template`, `countdown`, `main_list_collections`, `page_contact`, `page_faq`, `page_stores`, `testimonials`.
   - Verify that all schema settings translations remain fully preserved in `locales/en.default.schema.json`.
4. In `config/settings_data.json`:
   - Update the top-level active preset pointer to `"current": "Rebel"`.
   - Expand `"presets"` to include all 5 presets: Rebel, Noir, Vibrant, Botanical, and Cyber.
   - Ensure each preset defines complete color mappings for `scheme-1` through `scheme-4` and all geometry tokens.
5. Create `scripts/validate-schema-ranges.mjs`:
   - Write Node.js AST validation script with IEEE-754 epsilon checks for step divisibility.
6. Create `scripts/validate-locales.mjs`:
   - Write script verifying that `locales/en.default.json` has zero `"settings"` keys inside `"sections"`.
7. Create `.github/workflows/theme-store-ci.yml`:
   - Configure workflow running Theme Check, range math validation, locale validation, and packaging the distribution ZIP.
8. Create `listings/manifest.json`:
   - Specify theme metadata, category tags, author details, and demo store mapping.

## Success Criteria
- [ ] Product page navigation feels instantaneous ($< 100\text{ms}$) in Chromium browsers supporting Speculation Rules.
- [ ] Card titles, prices, and swatches align horizontally across all grid rows regardless of title character lengths.
- [ ] `locales/en.default.json` is smaller than 35KB and contains zero `"settings"` schema keys.
- [ ] Switching between any of the 5 presets in Theme Editor retains complete color and styling integrity.
- [ ] `node scripts/validate-schema-ranges.mjs` exits with status code 0.
- [ ] `node scripts/validate-locales.mjs` exits with status code 0.
- [ ] Distribution ZIP is under 50MB and contains no unauthorized root directories.

## Risk Assessment
- **Risk:** Speculation rules consuming mobile data on metered connections.
  - *Mitigation:* The browser engine natively respects user data-saver preferences (`Save-Data: on`) and suppresses prerendering automatically.
- **Risk:** Missing translation key warning (`translation missing: en.*`) if a storefront string was accidentally pruned.
  - *Mitigation:* The 10 storefront namespaces were cross-referenced against 100% of all `| t` calls in the Liquid codebase.
