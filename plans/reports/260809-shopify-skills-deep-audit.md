---
title: Shopify skills deep audit and Theme Store rules update
date: 2026-08-09
status: complete
audience: people-and-ai
---

# Shopify Skills Deep Audit

## Executive Summary

The project is a verified Shopify OS 2.0 `devs2` base theme. The local skill
bundle already contained specialist references and eval fixtures, but most
specialist folders lacked a `SKILL.md`; they could not be selected directly by
the runtime. Eleven specialist entrypoints were added and the quality umbrella
was updated with current Theme Store gates.

Shopify's current documentation emphasizes fast, flexible Liquid themes,
Online Store 2.0 composition, Theme Check, and Theme Store quality evidence.
The current requirements add or make explicit important readiness checks:
Skeleton or fully original code for new submissions, no new Dawn/Horizon
derivatives, section groups, Custom Liquid, app blocks, `<shopify-account>` in
both header variants, rich commerce/search/localization features, responsive
images, demo/preset parity, version/release notes, documentation, and support.

## Methodology

- Sources: official Shopify theme overview and Theme Store requirements.
- Retrieved: 2026-08-09.
- Local evidence: project `AGENTS.md`, `CLAUDE.md`, `.workspace-context.json`,
  docs navigation, existing Shopify skill references/evals.
- Scope: skill discoverability, routing, readiness checklist currency, and
  project documentation initialization. No storefront code was changed.

## Findings

### 1. Specialist discoverability gap — fixed

`shopify-liquid`, accessibility, audit, collection, performance, product,
sections, SEO, settings, snippets, store-readiness, and templates had useful
references but no entrypoint. Added concise `SKILL.md` files that declare scope,
trigger terms, workflow, and reference ownership.

### 2. Readiness reference drift — fixed

The checklist was dated 2026-07-04 and did not explicitly capture Skeleton /
original-code eligibility, header/footer section groups, product app blocks,
or the account component. It now records those gates and the current review
date. Workspace policy also forbids `prefers-reduced-motion`, so that wording
was removed from the accessibility gate.

### 3. Project rule route — fixed

`AGENTS.md`, `CLAUDE.md`, `docs/README.md`, and new
`docs/shopify-development-rules.md` now route code and evidence work to the
specialist skills and distinguish source-proof from external submission proof.

## Current Specialist Map

| Surface | Skill |
|---|---|
| Liquid/rendering | `shopify-liquid` |
| Sections, blocks, app blocks | `shopify-theme-sections` |
| Templates/routes | `shopify-theme-templates` |
| Settings/editor | `shopify-theme-settings` |
| Snippets | `shopify-theme-snippets` |
| Product / collection | `shopify-theme-product-page` / `shopify-theme-collection-page` |
| Performance / accessibility / SEO | corresponding specialist skills |
| Broad audit / Theme Store evidence | `shopify-theme-audit` / `shopify-theme-store-readiness` |
| CLI operations | `shopify-theme-cli` |

## Validation

- Confirmed `.workspace-context.json`: `kind=theme`, `platform=shopify`,
  `branch=devs2`, `verification=verified`, `role=base`.
- Confirmed all new `SKILL.md` files are under 300 lines and use focused
  namespaced routing metadata.
- Confirmed no Shopify CLI, deploy, push, pull, or publish command was run.
- Remaining external evidence is intentionally `needs-evidence`: Theme Check
  output, Lighthouse reports, browser/webview matrix, demo stores, listing
  metadata, documentation/contact URLs, originality/exclusivity statements,
  and support process.

## References

- [Shopify themes](https://shopify.dev/docs/storefronts/themes)
- [Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements)
- [Project Shopify rules](../../docs/shopify-development-rules.md)
- [Local readiness checklist](C:/Users/Admin/.agents/skills/shopify-theme-store-readiness/references/theme-store-checklist.md)

## Unresolved Questions

- Which final theme package, demo stores, presets, and listing metadata should
  supply the external readiness evidence pack?
- Should the specialist skills be copied into a project-local skill directory,
  or is the user-scope `.agents/skills` location the intended authority?
