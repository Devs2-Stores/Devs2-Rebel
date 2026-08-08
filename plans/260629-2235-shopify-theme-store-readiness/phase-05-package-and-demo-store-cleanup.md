---
phase: 5
title: "Package and demo store cleanup"
status: pending
priority: P1
dependencies: [4]
---

# Phase 5: Package and demo store cleanup

## Overview

Clean the deployable package, demo defaults, git/index state, and public support metadata before final QA.

## Requirements

- Functional: theme package contains only intended storefront/theme files.
- Functional: default templates and presets present polished demo content without store-specific broken CDN dependencies.
- Functional: `theme_info` documentation/support URLs are live or replaced with valid final URLs.
- Functional: `config/settings_data.json` changes are reviewed and intentionally kept or removed.
- Non-functional: preserve UTF-8 and avoid broad refactors.
- Non-functional: keep generated metadata/log files out of Shopify sync and git unless intentionally documented.

## Architecture

Packaging is a repo hygiene and theme default pass. The deployable Shopify theme surface is `assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`. Plans, reports, `.github`, generated browser logs, and local preview artifacts must not be pushed as theme files.

## Related Code Files

- Modify: `.shopifyignore`
- Modify: `.theme-check.yml`
- Modify: `config/settings_schema.json`
- Review only unless approved: `config/settings_data.json`
- Modify: `templates/index.json`
- Modify: `templates/page.about.json`
- Modify: `templates/page.contact.json`
- Modify: `sections/*` demo/default settings as needed
- Delete or ignore: `.playwright-mcp/**`
- Delete or ignore: `page_home.html`
- Review: `.github/workflows/generate-newsletter-image.yml`
- Review: `plans/**`

## Implementation Steps

1. Capture `git status --short --untracked-files=all` and classify intended vs generated files.
2. Clean or ignore generated `.playwright-mcp` and `page_home.html`.
3. Review staged/unstaged split; make one coherent diff before QA.
4. Review `config/settings_data.json` social link changes with user approval before committing.
5. Replace store-specific hardcoded `cdn.shopify.com/s/files/1/0697/...` template defaults with theme assets or approved demo settings.
6. Verify `theme_info` docs/support URLs are live and public; update placeholders if needed.
7. Ensure `.shopifyignore` excludes reports, local logs, tooling outputs, and private/dev artifacts.
8. Re-run JSON parse, stale-reference scan, `git diff --check`, and `shopify theme check`.
9. Create a packaging report under this plan's `reports/` folder.

## Success Criteria

- [ ] Git status is coherent and contains no accidental generated files.
- [ ] `settings_data.json` status is explicitly approved or reverted before package.
- [ ] Demo defaults do not depend on stale private/store-specific CDN URLs.
- [ ] Documentation/support URLs are final and reachable.
- [ ] Theme package ignores local plans/logs/tools appropriately.
- [ ] Static packaging gates pass.

## Risk Assessment

Risk: editing `settings_data.json` can overwrite merchant/demo setup. Mitigation: review diff with user before finalizing; do not change it silently.

Risk: replacing CDN defaults can reduce visual quality. Mitigation: use existing final theme assets or approved demo asset workflow.