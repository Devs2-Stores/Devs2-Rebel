# Shopify Project Scout Report

## Summary

The project is a Shopify OS 2.0 base theme (`Devs2 Rebel`, branch `devs2`) with the standard deployable theme surface plus a substantial stateful release-readiness history. The active runtime is Liquid + CSS + browser custom elements; no application server is present. The nested theme repository is materially dirty: pruning, quickview, content-page, settings, and asset changes are present alongside untracked project/context files. This report describes the observed state and does not classify those changes as intentional.

## Relevant Files

- `layout/theme.liquid` - global HTML shell, section groups, overlays, and accessibility landmarks.
- `layout/password.liquid` - isolated password template shell.
- `templates/` - JSON route composition and legacy Liquid template variants for product quickview/gift card.
- `sections/` - editor-configurable page sections, including main commerce/customer routes and reusable marketing sections.
- `snippets/` - shared cards, navigation, modals, head composition, icons, cart, and form fragments.
- `assets/` - route-scoped CSS/JS and custom-element implementations for cart, product, collection, search, customer, and modal behavior.
- `config/settings_schema.json` - merchant-facing settings contract; `config/settings_data.json` - current development settings state.
- `locales/en.default.json` and `locales/en.default.schema.json` - translated runtime strings and setting labels.
- `.theme-check.yml` - Theme Check policy and migration-era exceptions.
- `.shopifyignore` - upload boundary; excludes docs, plans, references, dependencies, and private/config tooling.
- `.github/workflows/generate-newsletter-image.yml` - manually dispatched workflow currently disabled by design.
- `plans/reports/260628-devs2-shopify-theme-audit.md` - broad audit evidence and known release risks.
- `plans/260629-0000-release-readiness-stabilization/` - stabilization plan and phase reports.
- `plans/260629-2235-shopify-theme-store-readiness/` - Theme Store readiness plan and phase details.

## Patterns

- Global bootstrap flows through `theme.liquid` -> `head-*` snippets -> `themeConfig` and route-scoped assets.
- JSON templates own section order; section schema owns Theme Editor configuration; snippets own cross-section markup.
- Commerce interactions use Shopify Ajax endpoints and custom elements, with focus/ARIA helpers and localized strings.
- Design tokens are generated in Liquid from merchant settings and color schemes, then consumed by component CSS.
- Existing audit evidence identifies quickview/search fallback drift, stale migration exceptions, hardcoded demo data, image-dimension issues, and orphaned assets as the main readiness risks.

## Unresolved Questions

- The repository does not include a root README for this theme; operator commands remain in `AGENTS.md` and are reference-only.
- The intended final state of the documented prune/migration work must be confirmed before treating the theme as a release candidate; inspect the nested repository status with `git --git-dir=.git-nested --work-tree=.`.
- Live Shopify preview and Theme Check results are not re-run during this documentation-only operation.
