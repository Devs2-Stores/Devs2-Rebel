# Workspace Tools for Shopify

## Purpose

This file routes utilities under `E:\Work\tools` for the Shopify base theme.
It is an inventory and safety boundary, not permission to run every tool.
Read each tool's own README/config before use and verify the target platform.

## Applicability Matrix

| Tool path | Classification | Shopify project use |
|---|---|---|
| `E:\Work\tools\RESTYLE_MASTER_KIT` | Reference only by default | The canonical full pipeline targets Haravan. Individual platform-neutral audits may be considered only after inspecting their input/output contract against Shopify OS 2.0. Never run `stitch:full`, export, sanitize, or package against this project by assumption. |
| `E:\Work\tools\Pagespeed` | Blocked legacy samples | Contains store-specific Liquid/JS optimization fragments. Do not copy or execute them in Shopify; use `shopify-theme-performance`, `pagespeed`, or measured browser evidence instead. |
| `E:\Work\tools\Fetch\fetch_from_shopify.js` | Blocked for theme work | Legacy Shopify-to-Haravan data importer. It can write live Haravan data and is not a Shopify theme-development tool. |
| `E:\Work\tools\Generate` | Runtime dependency/reference | Haravan demo-data engine, not a Shopify workflow. Its installed `sharp` may be reused by `ai-image-studio` as documented by that skill; do not invoke its product import pipeline for this project. |
| `E:\Work\tools\HaravanDemoKit` | Blocked | Haravan store seeding and repair only. |
| `E:\Work\tools\haravan-data-migrator` | Blocked | Haravan-to-Haravan external data writes. |
| `E:\Work\tools\haravan-upload-toolkit` | Blocked | Haravan upload workflow. |
| `E:\Work\tools\Convert Sapo - Haravan` | Blocked | Haravan/Sapo data and theme conversion; no Shopify contract. |
| `E:\Work\tools\Blog` | Blocked direct use | Internal HaravanDemoKit engine. |

## Project-Native Routes

- Theme implementation: Shopify specialist skills listed in
  [AGENTS.md](../AGENTS.md).
- Image generation: `ai-image-studio` with Wan hero and its img2img pipeline.
- Performance: `shopify-theme-performance`; use measured browser/PageSpeed
  evidence rather than copying legacy optimization snippets.
- Theme packaging/checking: `shopify-theme-cli`; every Shopify CLI invocation
  remains user-controlled.

## Environment Variables

Never document or copy secret values. Resolve only through environment state or
ignored local `.env` files.

| Scope | Variable names |
|---|---|
| Shopify project | `SHOPIFY_STORE`, `SHOPIFY_TOKEN`, `SHOPIFY_API_VERSION` |
| AI image studio | `AIBOX_API_KEY`, optional `AIBOX_HERO_MODEL`, `AIBOX_EDIT_MODEL`, `AIBOX_SIZE`, `IMAGE_MAX_DIM`, `IMAGE_QUALITY` |
| Other image/content tools | `GOOGLE_API_KEY`, `GEMINI_API_KEY` |
| Legacy migration utilities | `OPEN_EXCHANGE_RATES_API_KEY`, `HARAVAN_ACCESS_TOKEN`, `HARAVAN_API_TOKEN`, `SAPO_SHOP`, `SAPO_API_KEY`, `SAPO_API_SECRET` |

The project currently exposes Shopify variable names through its local ignored
`.env`. This statement records names only; it does not verify values or
authorize their use. `ai-image-studio` must stop if `AIBOX_API_KEY` is absent.

## Execution Gate

Before running a tool:

1. Confirm it is allowed for Shopify in the matrix.
2. Read its README and inspect the exact command/input/output contract.
3. Confirm the resolved target path and whether it writes local files or an
   external store.
4. Prefer dry-run/read-only mode.
5. Obtain explicit approval for external writes, imports, overwrites,
   packaging, publishing, deployment, or platform CLI operations.
6. Report artifacts and never print credential values.
