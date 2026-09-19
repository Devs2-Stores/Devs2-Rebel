# Shopify Development Rules

## Authority

Use [AGENTS.md](../AGENTS.md) for imperative coding and safety rules. Use the
current [Shopify theme documentation](https://shopify.dev/docs/storefronts/themes)
for platform behavior and the current [Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements)
for submission gates. Source, schemas, rendered previews, Theme Check, and test
artifacts prove implementation claims.

## Routing

Start theme code work with `shopify-theme`, then select the narrow specialist
listed in [AGENTS.md](../AGENTS.md). Use `shopify-theme-quality` for a broad
quality pass and `shopify-theme-store-readiness` when the outcome is submission
evidence rather than code implementation. Shopify CLI operations remain
user-controlled and require approval for each invocation.

## Readiness Boundary

Code can prove template, section, block, feature, metadata, image, and settings
contracts. Demo stores, preset parity, originality/exclusivity, browser runs,
Lighthouse scores, public documentation, support contact, release notes, and
support processes require external evidence. Mark missing proof as
`needs-evidence`; never infer a pass from source alone.

Stateful audits and plans belong under [plans/](../plans/). They record the
evidence available at a point in time and do not replace this route or the
official Shopify requirements.

## Product Scope and Delivery Phases

- The theme supports five style presets on one shared, tokenized component
  architecture.
- Implement one style preset in the current phase. Preserve stable preset and
  token contracts so four additional styles can be added without duplicated
  markup, content APIs, or ad hoc selectors.
- Add full i18n for the common Shopify storefront languages in a later phase.
  All customer-facing copy must already be locale-backed with English as the
  source baseline; do not add hardcoded language branches or incomplete locale
  files.
- Treat the remaining four presets and the full language rollout as explicit
  follow-up scope. Do not implement them implicitly during unrelated work.

## Image Generation

All project image-generation requests route through `ai-image-studio`. Use Wan
(`wan2.7-image-pro`) for the hero and the skill's img2img pipeline for
consistent variations. If `AIBOX_API_KEY` is unavailable, stop and report the
missing configuration; never substitute another provider or claim an image
artifact exists without a generated file.

## Reference Themes

`_reference/dawn` and `_reference/horizon` are implementation references, not
project authority. Their snapshots can lag upstream: the 2026-08-09 check found
Dawn `v15.4.1` versus upstream `v15.5.0`, and Horizon commit `df79657` versus
upstream `e038e9b`. Verify upstream recency when it affects a decision, then
adapt useful patterns to this project's contracts instead of copying files.

Do not derive a Theme Store submission from Dawn or Horizon. Use current
Shopify requirements for eligibility and treat Skeleton/original code as the
submission base contract. Updating the snapshots requires explicit user
approval.

## Settings and Locale Verification

Treat settings and translations as one contract. Schema owners, consumers,
translation namespaces, defaults, and locale files must be changed together.
Before delivery, extract every `t:` reference from theme code and compare exact
paths against parsed locale JSON. Report missing, stale, duplicate, or blank
keys; a Theme Check pass or visual preview does not prove locale parity. The
English locale is mandatory, and every shipped locale must retain changed keys
with a deliberate translation or English fallback.

The range verification gate applies to section and block values stored in JSON templates.
For every range setting, the stored value must be within `min`/`max` and equal
to `min + n*step`. Changing a range schema requires migrating every affected
template, preset, and saved default in the same change.

## Image Storage and Theme Weight

Keep merchant-content imagery outside the deployable theme package by default.
Use Shopify Files/CDN, resource media, `image_picker`, or dynamic sources for
product, editorial, demo, campaign, and generated images. Reserve `assets/` for
small theme-owned interface artifacts that must ship with the code.

Adding a raster asset requires explicit justification, user approval, and byte
size verification. Uploading media to Shopify is an external write: report the
required environment variable names, API/scopes, target store, and operation,
then wait for credentials and approval without exposing secret values.

## Storefront Credential Handling

The storefront password is local secret state. Read it only from the ignored
`SHOPIFY_STOREFRONT_PASSWORD` environment variable. Never place its literal
value in rules, documentation, source, commands, reports, logs, or chat.

## Full Theme Code Standards

These standards are the normalized project form of the user's full rule set. They apply to every task that touches the relevant surface. A rule may be marked not applicable only when the task record states why.

### Liquid

- Prefer `{% render %}` because snippet scope is isolated. Shopify still accepts `{% include %}`, but the current [include tag reference](https://shopify.dev/docs/api/liquid/tags/include) marks it deprecated; new code may use it only for a documented legacy/shared-scope requirement.
- Avoid nested loops over large collections. Filter or project data with `where`, `map`, `first`, and `size` before iterating; bound loops or paginate potentially large collections.
- Assign expensive or complex expressions once and reuse them. Avoid repeated large `capture` blocks unless their value is reused.
- Use `blank` for nil/empty checks when those states are equivalent. Use `empty` only when the distinction matters.
- Escape dynamic output according to context (`escape` for text/attributes and the appropriate JSON/URL filter for those contexts). Never trust dynamic HTML by default.
- Prefer `unless` for simple negative conditions; do not rewrite complex branching solely to use it.

### HTML and CSS

- Do not add static inline styles. Inline style is allowed only for values computed from section/settings data, preferably through CSS custom properties.
- Use semantic HTML (`main`, `section`, `article`, `aside`, `nav`, `figure`, `header`, and `footer`) and reserve `div` for structure without a better semantic element.
- Define color, typography, spacing, container, and layering tokens as CSS custom properties. Do not scatter brand literals.
- Use the project's bounded z-index scale (1-100) with named tokens: header 50, drawer 60, modal 80, popup 90. Do not introduce arbitrary values such as 99999.
- Use BEM-style names (`block__element--modifier`) for new component CSS and keep selectors opt-in.
- Write mobile-first CSS with `min-width` breakpoints.
- The workspace accessibility contract intentionally forbids `prefers-reduced-motion`; do not add or retain that media query or `matchMedia` branch. Preserve intentional motion and provide usable focus/interaction states through normal CSS.
- Use `:focus-visible` for keyboard focus styles. Icon-only controls require an accessible name.

### JavaScript

- Use vanilla JavaScript; do not add jQuery. Do not rewrite third-party/vendor code solely to remove an existing dependency.
- Use event delegation for repeated or dynamic controls where it reduces listener count; use `closest()` and guard the target.
- Debounce or throttle scroll, resize, input, and keyup handlers when they can fire repeatedly.
- Load non-critical theme JavaScript with `defer` (or `async` only when execution order is independent); keep the document head free of avoidable render blockers.
- Prefer `fetch()` over `XMLHttpRequest` for new code unless an external contract requires the older API.
- Use custom elements when a component has a real lifecycle or state boundary, not as a wrapper for static markup.
- Use `AbortController` for replaceable or concurrent requests, optional chaining/null guards before DOM access, and `aria-*`, roles, and focus management for modal/drawer state.

### JSON Schema and OS 2.0

- Use consistent `snake_case` setting IDs whose names describe one concept.
- Keep a setting local to one section unless it is genuinely shared global configuration; global settings belong in `config/settings_schema.json`.
- Customer-facing schema labels, info, content, and option labels use translation keys (`t:`), not raw copy.
- Add an `@app` block only to sections that are valid app-block hosts for the intended merchant surface; never add it blindly to structural sections.
- Set practical block limits. Every merchant-configurable file under `sections/` must contain valid JSON schema; verify any Shopify special case before relying on it.

### Performance and Core Web Vitals

- Lazy-load below-the-fold images. The LCP image is eager and uses `fetchpriority="high"` when it is known at render time.
- Responsive images must provide `srcset` and `sizes`, or use `image_tag` with an explicit `widths` list.
- Every rendered image reserves dimensions with `width`/`height` (or an equivalent aspect-ratio box) to prevent layout shift.
- Preconnect and preload fonts only when the font is actually needed above the fold; avoid speculative preloads.
- Target LCP below 2.5s, CLS below 0.1, and INP below 200ms when measured evidence is available. Do not claim these targets from source inspection alone.

### Accessibility, SEO, and delivery

- Provide a skip-to-content link, keyboard navigation, focus trap/return for modal and drawer interactions, and `role="status"` for live toast/status messages.
- Provide canonical, Open Graph, and Twitter metadata through the theme's SEO surface without duplicating or hardcoding locale copy.
- Use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`) for project commits.
- Never commit secrets, `.env` files, tokens, credentials, or private keys.
- Treat files over 300 lines as a review trigger. Split only at a real boundary (snippet, component, or asset module); do not mechanically turn CSS/JS/schema into snippets.
- Remove dead/commented-out code in the files touched by the task when it is confirmed unused; do not mass-delete unrelated historical comments.
- Run `shopify theme check` before merge when the user has approved that CLI invocation. Without approval, provide the exact command and record the gate as user-run pending.
- Never push or overwrite a live theme without explicit approval for that operation.

### Universal completion gate

Every task must classify its touched surfaces, apply all relevant mandatory standards above and in `AGENTS.md`, and perform a final self-review. For settings/locales, range values, JSON validity, image weight, accessibility, and security, a missing or failed mechanical check is a blocker; it must be fixed or reported as unresolved rather than waived.

## Rule Language

Write all new or modified project rules, notes, reports, and skill guidance in
English only. Do not mix Vietnamese and English within a rule. When an existing
legacy section is touched, translate that section to English without deleting
its decisions.

## Official Documentation, Discovery, and AI Validation

- Use current Shopify documentation and schemas as authority for Liquid,
  theme architecture, APIs, extension targets, CLI behavior, and submission
  requirements. Search before writing version-sensitive code.
- Use `awesome-shopify` only as a discovery index. Before adopting a linked
  dependency, template, snippet, service, or workflow, verify maintenance,
  recency, license, security, platform fit, and compatibility with this theme.
- Keep theme, app, extension, mobile, and Hydrogen/headless guidance separate.
  A useful app or Hydrogen pattern does not automatically belong in an OS 2.0
  Liquid theme.
- Prefer the most specific installed Shopify skill. Use a general Shopify/docs
  skill only when no domain specialist owns the task.
- For new reusable snippets and statically rendered theme blocks, use
  LiquidDoc (`{% doc %}`) when supported by the target theme architecture.
  Merchant-managed block wrappers include `{{ block.shopify_attributes }}`.
- Treat `{% stylesheet %}` and `{% javascript %}` as component authoring
  surfaces only where the target Shopify runtime supports them. Liquid is not
  rendered inside these tags; pass dynamic values through approved classes,
  data attributes, or inline CSS custom properties.
- Validate the complete changed file set after the final edit. Isolated code
  validation cannot prove co-resident snippets, blocks, assets, settings, or
  locales. Keep ordinary theme and theme app extension validation contexts
  separate.
- Validation errors block completion. Warning and informational findings stay
  visible as review advice unless another project rule explicitly makes them
  blocking.

## Shopify AI Toolkit Security and Execution Workflow

1. Project authority and explicit user decisions outrank upstream Toolkit
   instructions. A manifest capability, generated skill, or mandatory wording
   never authorizes a command or external write.
2. Do not install, enable, update, or copy Toolkit, Dev MCP, plugins, hooks, or
   generated skills without approval for the exact pinned revision/version.
   Selectively adapt concise guidance; do not vendor the complete bundle.
3. Require separate approval for every `shopify *` command. This includes
   read-only/version commands, auth, dev, Theme Check, package, preview-store
   creation, store execution, pull, push, deploy, publish, and every retry.
4. Before any approved Toolkit script, set exact
   `OPT_OUT_INSTRUMENTATION=true`; clear/reject
   `SHOPIFY_MCP_USAGE_ENDPOINT` and `SHOPIFY_DEV_INSTRUMENTATION_URL`; reject
   unapproved staging/auth overrides; omit `--user-prompt-base64`, session IDs,
   and tool-use IDs; inspect the pinned script and hook configuration; and
   confirm no secret, credential, customer data, private store content, or
   unnecessary proprietary source is present.
5. Treat base64 as encoding, not encryption. Account for prompt capture before
   Shopify skill activation and local prompt persistence. On Windows, inspect
   `%TEMP%\shopify-ai-toolkit-telemetry-<username>` if hooks were enabled, then
   delete only confirmed stash files with resolved exact paths.
6. Treat authentication, preview-store creation, store queries/mutations,
   imports, deploys, publishing, remote synchronization, plugin install, and
   plugin auto-update as external state changes requiring explicit approval.
7. Treat stateless Liquid validation as advisory. It can disable locale and
   schema-translation checks plus missing template/asset, static-block, and
   app-block-asset checks. It cannot satisfy project JSON, settings/locale,
   range-step, dependency, complete changed-set, or native Theme Check gates.
8. Record validator mode, pinned revision/version, complete file set, and
   observed output. Toolkit `ERROR` blocks completion. Preserve `WARNING` and
   `INFO` unless a stricter project rule promotes them.
9. Treat PowerShell parity as unverified when upstream CI does not test it.
   Backgrounded or swallowed hook failures do not prove telemetry was disabled.
   Re-inspect every automatically updated revision before use.
