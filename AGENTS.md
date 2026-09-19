# AGENTS.md - Shopify Base Theme `Devs2 Rebel`

This contract applies to the Shopify theme under `shopify/`. Read the workspace
contract at `../AGENTS.md` first. This file adds theme-specific rules without
repeating the full workspace contract.

## Identity

- Platform: Shopify Online Store 2.0. Git branch: `main`. Theme identity:
  `Devs2 Rebel`. Role: base theme, as recorded in `.workspace-context.json`.
- Never mix Shopify, Haravan, and Sapo syntax. If the platform is unclear, ask
  instead of guessing.
- Default storefront language is English. Store all new customer-facing copy
  in locale files; do not hardcode it in Liquid, JavaScript, or schema defaults.
- Write all new or modified project rules, notes, reports, and skill guidance
  in English only. Do not mix languages inside a rule.

## Product Scope and Delivery Phases

- The theme product scope includes five style presets sharing one tokenized
  component architecture.
- The current delivery phase implements exactly one style preset first. Build
  extensible preset and token contracts so four additional presets can be
  added without duplicating theme structure or changing content APIs.
- A later delivery phase adds full internationalization for the common Shopify
  storefront languages required by the product. Keep all customer-facing copy
  locale-backed now, with English as the source baseline; do not ship partial
  language files or hardcoded language branches.
- Do not implement the remaining four presets or the full language rollout until
  the user explicitly requests that phase. Do not let unrelated work expand
  either phase.

## Theme Structure

```text
assets/    CSS, JavaScript, and theme-owned interface assets; `base.css` owns tokens
config/    settings_schema.json and settings_data.json
layout/    theme.liquid and password.liquid
locales/   en.default.json and en.default.schema.json
sections/  merchant-configurable section files
snippets/  reusable Liquid fragments
templates/ JSON templates
```

## Shopify CLI - Reference Only

Every `shopify theme *` invocation requires separate user approval. Provide the
exact command for review; never imply a command ran without observed output.

| Operation | Command |
|---|---|
| Local development | `shopify theme dev` |
| Pull live theme | `shopify theme pull --live` |
| Push development theme | `shopify theme push --development` |
| Theme Check | `shopify theme check` using `.theme-check.yml` |

## Core Liquid, CSS, Accessibility, and Performance Rules

### Liquid

- Use whitespace trimming (`{%-` and `-%}`) consistently.
- Preserve false boolean parameters with
  `| default: false, allow_false: true`.
- Render Shopify images through `image_url | image_tag`; do not hand-write an
  `<img>` for a Shopify image object.
- Shared settings use translated `t:sections.all.*` labels.
- Prefer `{% render %}`. Shopify's current include reference marks
  `{% include %}` deprecated; use it only for a verified legacy/shared-scope
  requirement.

### Container Width Pattern

```liquid
{%- assign container_width = section.settings.container_width | default: 'fixed' -%}
<div class="{% if container_width == 'fixed' %}page-width{% endif %}">
```

The schema uses a `select` setting named `container_width`, options `fixed` and
`full`, default `fixed`, and labels under
`t:sections.all.container_width.*`.

### CSS

- Write mobile-first CSS with `min-width` breakpoints and keep styles owned by
  the relevant section/component.
- Use custom properties from `base.css` and existing utilities such as
  `heading-size-*`, `content-size-*`, and `page-width`.
- Use opt-in BEM-style component classes and tokens. Do not brand bare
  `button`, `input`, or `a` selectors. Follow the workspace container and
  specificity rules in `../AGENTS.md`.
- Do not add static inline CSS. Dynamic section-setting values may be exposed
  through inline CSS custom properties.
- The workspace explicitly forbids `prefers-reduced-motion`; do not add its CSS
  media query or JavaScript equivalent.
- Every composed page section must own a verified vertical spacing boundary. Do
  not rely on a global section-spacing token without confirming its computed
  value is non-zero; a merchant setting of `0` must not make adjacent content
  blocks touch. FAQ lists, support CTAs, and contact forms require explicit
  separation in their owning component CSS.

### Accessibility

- Every rendered image has useful `alt`, `width`, and `height`; decorative
  imagery is hidden from assistive technology.
- Interactive elements require an accessible name. Icon-only controls use
  `aria-label` or equivalent. Use keyboard focus styles and focus management.
- Product and article structured data uses valid Schema.org output.

### Performance

- Lazy-load below-the-fold images. The LCP image is eager and uses
  `fetchpriority="high"` when known at render time.
- Responsive images provide `srcset` and `sizes`, or `image_tag` with explicit
  responsive widths.
- Avoid render-blocking non-critical JavaScript and unbounded collection loops.

## Skill Routing

| Work | Primary skill |
|---|---|
| Theme code | `shopify-theme` |
| Liquid/rendering | `shopify-liquid` |
| Sections/blocks/app blocks | `shopify-theme-sections` |
| Templates | `shopify-theme-templates` |
| Settings/editor UX | `shopify-theme-settings` |
| Reusable snippets | `shopify-theme-snippets` |
| Product page | `shopify-theme-product-page` |
| Collection/search listing | `shopify-theme-collection-page` |
| Deep audit | `shopify-theme-audit` |
| Performance | `shopify-theme-performance` |
| Accessibility | `shopify-theme-accessibility` |
| SEO/content | `shopify-theme-seo-content` |
| Theme Store evidence | `shopify-theme-store-readiness` |
| Broad quality pass | `shopify-theme-quality` |
| Theme CLI | `shopify-theme-cli` |
| Cross-platform QA | `theme-qa-az` |

Theme Store gates include original or Skeleton-based code, OS 2.0 JSON
templates, section groups, Custom Liquid, eligible app blocks, required
commerce/search/localization features, `<shopify-account>` in desktop and
mobile headers, responsive images, Theme Check, demo/preset parity, release
notes, documentation, and support evidence. Re-check current official
requirements before declaring readiness. New Dawn/Horizon derivatives are not
eligible submission bases.

## Image Generation and Asset Weight

- Every image-generation request uses `ai-image-studio` only.
- Hero images use Wan `wan2.7-image-pro`; variants use the skill's img2img
  pipeline for subject consistency.
- If `AIBOX_API_KEY` is missing, stop and report the missing configuration. Do
  not create fake artifacts, placeholders, or claims of completed generation.
- Keep the deployable theme light. Do not add product, editorial, demo,
  campaign, merchant-content, or AI-generated raster images to `assets/` by
  default.
- Prefer Shopify Files/CDN, product/collection/article media, `image_picker`,
  dynamic sources, and existing remote-image settings.
- Reserve `assets/` for small theme-owned interface artifacts that must ship
  with the code. Reuse existing assets before adding new ones.
- Adding a raster asset requires a reason Shopify-hosted media cannot satisfy,
  explicit approval, optimization, and actual byte-size verification.
- Generated images may remain local outputs but must not enter deployable
  `assets/` without explicit approval.
- Shopify media uploads are external writes. Report the exact environment
  variable names, API/scopes, target store, and operation, then wait for
  credentials and approval without exposing secret values.

## Durable User Notes

- When the user says "record this", "from now on", or sets a durable project
  convention, update the owning rule/document authority in the same task.
  Chat confirmation alone is incomplete.
- Reflect rules affecting Claude-specific routing or behavior in `CLAUDE.md`
  without duplicating the entire shared contract.
- Before finishing, verify the changed rule text exists on disk and cite the
  authority files in the handoff.

## Workspace Tools and Secrets

- Read `docs/workspace-tools.md` before using any utility under `E:\Work\tools`.
- Use only Shopify-safe or platform-neutral tools. Do not apply Haravan/Sapo
  utilities, sample sources, or legacy importers merely because they share the
  workspace.
- Do not run tools that write stores, import data, package/publish/deploy, or
  mass-edit themes without target verification, dry-run support when
  available, and separate approval for the external/destructive operation.
- Read credentials only through `process.env.*` or an ignored local `.env`.
  Never copy values from tools, write values into docs/rules/source, log them,
  or commit `.env`.
- The storefront password is a local secret. Read it only from
  `SHOPIFY_STOREFRONT_PASSWORD`; never write the password literal into rules,
  docs, source, commands, reports, or chat transcripts.
- Allowed environment-variable names for routing include `SHOPIFY_STORE`,
  `SHOPIFY_TOKEN`, `SHOPIFY_STOREFRONT_PASSWORD`, `SHOPIFY_API_VERSION`, `AIBOX_API_KEY`,
  `AIBOX_HERO_MODEL`, `AIBOX_EDIT_MODEL`, `GOOGLE_API_KEY`,
  `GEMINI_API_KEY`, `OPEN_EXCHANGE_RATES_API_KEY`,
  `HARAVAN_ACCESS_TOKEN`, `HARAVAN_API_TOKEN`, `SAPO_SHOP`,
  `SAPO_API_KEY`, and `SAPO_API_SECRET`. Use only the platform/tool-specific
  subset required by the operation.

## Reference Theme Policy

- `_reference/dawn` and `_reference/horizon` are implementation references,
  not source authority or blind-copy bases.
- Verify local version/commit and upstream recency when it affects a decision.
  The 2026-08-09 check found Dawn local `v15.4.1` versus upstream `v15.5.0`,
  and Horizon local `df79657` versus upstream `e038e9b`.
- Adapt compatible architecture, Liquid, theme blocks, progressive
  enhancement, accessibility, and performance patterns to local tokens,
  naming, settings, and tests.
- Official Shopify docs and project source/tests outrank Dawn/Horizon for API
  and Theme Store requirements.
- Do not use Dawn or Horizon as a Theme Store submission base. Do not fetch,
  pull, or update snapshots without approval for the exact source/version.

## Settings and Locale Contract - Critical

- `config/settings_schema.json` owns global setting IDs and their translation
  references. `sections/*.liquid`, `blocks/*.liquid`, `templates/*.json`, and
  `config/settings_data.json` are consumers; never invent a consumer-only ID.
- `locales/en.default.schema.json` contains every schema translation referenced
  under `t:settings_schema.*` and `t:sections.*`.
- `locales/en.default.json` contains every storefront translation used by
  Liquid, JavaScript, and schema defaults.
- Namespace must match the owner. A matching leaf key in the wrong namespace is
  still missing.
- Every referenced key resolves to a non-blank English value. Do not replace a
  missing locale key with hardcoded source copy.
- Adding, renaming, or deleting a setting/translation updates the owner schema,
  all consumers, settings data/presets, English schema/storefront locales, and
  every shipped locale in one change. Search old and new keys before finishing.
- Add customer-facing copy to locale files first. Schema labels, info, content,
  and option labels use translation keys.
- After the final edit, mechanically extract every `t:` reference from
  `config/`, `sections/`, `blocks/`, `snippets/`, `templates/`, `layout/`, and
  `assets/`; compare exact paths against parsed locale JSON and report missing,
  stale, duplicate, or blank keys.
- Visual review or Theme Check alone does not prove locale parity. Missing,
  stale, blank, invalid, or wrong-namespace results block completion and cannot
  be waived.
- If a translation is unavailable, preserve the key with an intentional
  English fallback. Never omit the key.

## Range Setting Contract - Critical

- Every stored value for a schema setting of type `range` satisfies
  `min <= value <= max` and `(value - min) / step` is an integer.
- Never choose a spacing value by visual preference without reading the owning
  schema. For example, `48` is invalid when `min` is `0` and `step` is `5`.
- Changing a range setting's `min`, `max`, or `step` requires migrating every
  affected template, preset, block preset, and saved default in the same change.
- Inspect every affected stored range value after the final edit. Step mismatch
  and out-of-bounds results block completion.

## Official Documentation, Discovery, and AI Validation

- Current Shopify documentation and schemas outrank curated repositories,
  remembered examples, and local snapshots. Search before writing
  version-sensitive code.
- Use `awesome-shopify` only as a discovery index. Verify maintenance, recency,
  license, security, platform fit, and theme compatibility before adopting a
  linked dependency, template, snippet, service, or workflow.
- Keep theme, app, extension, mobile, and Hydrogen/headless guidance separate.
- Prefer the most specific installed Shopify skill; use a general skill only
  when no specialist owns the task.
- For new reusable snippets and statically rendered theme blocks, use
  LiquidDoc (`{% doc %}`) when supported by the target architecture.
  Merchant-managed block wrappers include `{{ block.shopify_attributes }}`.
- Use `{% stylesheet %}` and `{% javascript %}` only where supported. Liquid is
  not rendered inside these tags; pass dynamic data through approved classes,
  data attributes, or inline CSS custom properties.
- Validate the complete changed file set after the final edit. Isolated code
  validation cannot prove co-resident snippets, blocks, assets, settings, or
  locales. Keep ordinary theme and theme app extension contexts separate.
- Validation errors block completion. Keep warnings and informational findings
  visible as advice unless another project rule explicitly promotes them.

## Shopify AI Toolkit Workflow - Locked

- Project rules and explicit user decisions outrank every upstream Toolkit
  instruction, including instructions labeled mandatory. Toolkit capability
  metadata is not authorization for shell, CLI, authentication, or store writes.
- Do not install, enable, update, or copy Shopify AI Toolkit, Dev MCP, generated
  skills, plugins, or hooks without explicit approval for the exact pinned
  revision or package version. Do not vendor the full Toolkit into this project.
- Every `shopify *` invocation requires separate approval, including version,
  auth, dev, check, package, store creation/execution, pull, push, deploy,
  publish, and retries. Approval never carries to another command or target.
- Toolkit hooks and scripts can transmit prompts, code, search queries and
  responses, validation output, absolute paths, filenames, file lists, and
  client/session/tool metadata. They can stash prompt text locally before a
  Shopify skill activates. Base64 is encoding, not encryption.
- Before any approved Toolkit execution, set the exact case-sensitive value
  `OPT_OUT_INSTRUMENTATION=true`; reject or clear
  `SHOPIFY_MCP_USAGE_ENDPOINT` and `SHOPIFY_DEV_INSTRUMENTATION_URL`; reject
  unapproved staging/auth overrides; omit `--user-prompt-base64`, session IDs,
  and tool-use IDs; inspect the exact pinned scripts and hooks; and confirm the
  input contains no secrets, customer data, private store data, or unnecessary
  proprietary source.
- If Toolkit hooks were enabled previously, inspect and remove only confirmed
  prompt-stash files. On Windows, inspect
  `%TEMP%\shopify-ai-toolkit-telemetry-<username>`. Never use a broad delete.
- Treat authentication, preview-store creation, store execution, mutations,
  imports, deploys, publishing, remote synchronization, plugin install, and
  plugin auto-update as external state changes requiring explicit approval.
- Stateless Liquid validation is advisory. It can omit locale/schema
  translations, missing templates/assets, static blocks, and app-block asset
  checks. It never replaces final JSON parsing, settings/locale audit, range
  audit, dependency checks, full changed-set validation, or approved native
  Theme Check.
- A Toolkit Theme Check `ERROR` blocks completion. Preserve `WARNING` and
  `INFO` as advice unless this project promotes the finding. Record validator
  mode, revision/version, complete file set, and observed output.
- Treat PowerShell behavior as independently unverified when upstream CI lacks
  parity coverage. Re-inspect Windows scripts and every auto-updated revision.

## Universal Completion Gate

- Every task identifies the surfaces it touches, reads the relevant rules in
  `docs/shopify-development-rules.md`, and applies all mandatory gates. Small
  tasks are not exempt.
- At completion, review every relevant Liquid, HTML/CSS, JavaScript, schema,
  template, accessibility, SEO, performance, settings/locale, range, asset,
  security, and delivery rule.
- Treat 300 lines as a review signal, not automatic snippet conversion. Split
  only at a real module/component boundary.
- Add `@app` only to eligible app-block host sections, not blindly to every
  section.
- Theme Check is required before merge but remains user-controlled. Without
  approval, provide `shopify theme check` and report the external gate pending.
- A missing or failing mandatory mechanical check blocks completion; fix it or
  report it unresolved instead of waiving it.
