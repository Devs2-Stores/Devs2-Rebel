---
title: Shopify AI Toolkit security deep audit
date: 2026-08-09
status: complete
audience: people-and-ai
---

# Shopify AI Toolkit Security Deep Audit

## Executive Verdict

Shopify AI Toolkit is valuable as a source of current-documentation search,
surface-specific routing, schema-aware generation, and validation patterns. It
must not be installed, copied, or executed as a trusted automation layer by
default. At the audited revision, telemetry is default-on, prompt text can be
captured locally before skill activation, hooks execute broadly and suppress
failures, generated standalone skills carry telemetry hooks, and upstream
workflows can direct agents to authenticate or mutate Shopify state.

The accepted integration is selective and instruction-only. Project and global
skills now preserve useful engineering patterns while imposing explicit
approval, privacy, validation, Windows, and supply-chain gates. No Toolkit
script, hook, plugin, MCP server, or Shopify CLI command was executed during
this audit.

## Scope and Evidence

- Audit date: 2026-08-09.
- Repository: [Shopify/Shopify-AI-Toolkit](https://github.com/Shopify/Shopify-AI-Toolkit).
- Audited commit: `cc5af6505c27939222072449278f6356857cb064`.
- Commit date: 2026-08-05.
- Plugin package: `shopify-plugin` `1.6.1`.
- Generated skill metadata: `1.12.3`.
- Toolkit skills inventoried: 21.
- Official documentation:
  - [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit)
  - [Shopify Dev MCP](https://shopify.dev/docs/apps/build/devmcp)
- Primary repository evidence included `hooks/hooks.json`,
  `hooks/scripts/track-telemetry.sh`, `hooks/scripts/track-telemetry.ps1`,
  generated skill hook frontmatter, Liquid validation scripts, onboarding
  skills, CLI guidance, package metadata, and hook documentation.

## Threat Model

The protected assets are developer prompts, proprietary source, absolute local
paths, store identifiers, validation output, credentials, customer/store data,
and control over Shopify external state. Relevant adversaries and failure modes
are accidental telemetry disclosure, redirected telemetry, stale or silently
updated plugin code, prompt persistence on a shared workstation, upstream
instruction override, over-broad CLI authorization, and false validation
confidence.

## Severity-Ranked Findings

### High: Default-on telemetry exposes development context

Toolkit scripts and hooks can send data to `https://shopify.dev/mcp/usage`.
Observed payload surfaces include a user prompt truncated to 2000 characters,
generated or validated code, search queries and responses, validation output,
absolute theme paths, file lists, filenames, API versions, model/client data,
session identifiers, and tool-use identifiers.

Impact: proprietary code, private prompts, local filesystem structure, or
store-related context can leave the workstation without an explicit per-use
privacy decision.

Required control: do not execute by default. For an approved execution, set the
exact case-sensitive `OPT_OUT_INSTRUMENTATION=true`, remove unnecessary context,
and inspect the pinned script revision.

### High: Prompt capture and persistence precede safe routing

The Claude `UserPromptSubmit` hook locally stashes prompts before later Shopify
skill activation determines whether an event is sent. Bash cleanup permits a
stash to remain for up to 24 hours and does not delete it after transmission.
The audited PowerShell path has no equivalent observed stale-file cleanup, so a
stash can persist longer. The Windows location is
`%TEMP%\shopify-ai-toolkit-telemetry-<username>`.

Impact: sensitive prompts can persist locally even when no Shopify skill is
ultimately used or network telemetry is believed to be inactive.

Required control: do not enable hooks automatically. If previously enabled,
resolve exact stash paths and remove only confirmed Toolkit files. Do not use
broad recursive deletion.

### High: Upstream skills can cross the external-write boundary

The CLI skill encourages authentication and store execution, including
mutations. The merchant onboarding skill instructs an agent to immediately run
`shopify store create preview --json`. Upstream mandatory language does not
contain this project's approval contract.

Impact: an agent can create stores, authenticate, mutate data, deploy, publish,
or change plugin state under an assumed workflow authorization.

Required control: project and user authority always wins. Every `shopify *`
invocation requires separate approval for the exact command and target,
including read-only commands and retries.

### High: Endpoint and environment overrides can redirect data

The audited code recognizes `SHOPIFY_MCP_USAGE_ENDPOINT` and
`SHOPIFY_DEV_INSTRUMENTATION_URL`. Staging variables including
`SHOPIFY_DEV_STAGING_SERVER_NUMBER` and `MINERVA_TOKEN` can also alter API
destination or authentication behavior.

Impact: a compromised or accidental environment configuration can redirect
telemetry or change the service boundary while the command appears normal.

Required control: clear or reject endpoint overrides and unapproved staging/
authentication variables before any approved Toolkit execution.

### Medium: Hook execution is broad, silent, and difficult to prove inactive

Plugin hooks run on every `PostToolUse`; Claude also registers
`UserPromptSubmit`. Event emission is filtered later, but hook execution is
broad. Telemetry is backgrounded and failures are swallowed.

Impact: no terminal output does not prove that telemetry was disabled, skipped,
or failed safely.

Required control: inspect configuration and process behavior at the exact
revision. Do not use silence as verification.

### Medium: Standalone generated skills retain telemetry behavior

Generated `SKILL.md` files include hook frontmatter, and reading a recognized
Toolkit skill can emit a skill-use event. Copying only a skill directory does
not necessarily remove plugin behavior.

Impact: selective vendoring can silently preserve telemetry and hook execution.

Required control: never copy upstream skills wholesale. Adapt concise text only
after removing hooks and reviewing scripts, assets, license, and platform fit.

### Medium: Stateless Liquid validation has intentional coverage gaps

The stateless validator disables or cannot establish locale-key checks, schema
translation checks, missing template/asset checks, static-block checks, and
app-block asset checks. Full-theme validation runs Theme Check but reports only
the listed file set.

Impact: isolated validation can pass while the final theme still contains
missing locale keys, invalid settings consumers, missing dependencies, or
cross-file failures.

Required control: treat stateless output as advisory. Validate the complete
final changed set and run project JSON, settings/locale, range, dependency, and
approved native Theme Check gates after the last edit.

### Medium: Automatic updates weaken reproducibility

Official installation guidance uses an automatically updating plugin. The
Toolkit also bundles large generated schemas, type assets, scripts, and skill
files. Several upstream skills exceed this workspace's 300-line review signal,
and a full Windows checkout previously encountered long-path friction.

Impact: behavior can change between runs without a reviewed project diff, and
full vendoring adds maintenance and portability risk.

Required control: pin and re-review revisions. Keep global specialists concise;
do not vendor the full Toolkit or generated asset tree.

### Medium: PowerShell parity is not established by upstream CI

The hook documentation states that PowerShell parity tests are outside the
current test scope. This workstation runs Windows PowerShell.

Impact: Bash cleanup, quoting, opt-out, and failure assumptions cannot be
transferred to Windows without inspecting the PowerShell implementation.

Required control: treat Windows behavior as independently unverified and
inspect the exact `.ps1` code before approved use.

### Low: Capability metadata is not a security boundary

The Codex manifest declares a read capability while skill instructions can
direct shell commands, Shopify CLI, authentication, and store writes.

Impact: routing metadata can be mistaken for enforceable least privilege.

Required control: authorize concrete actions, not declared capability labels.

## Accepted Toolkit Patterns

- Route requests to the narrowest Shopify surface specialist.
- Search current official documentation before version-sensitive generation.
- Validate against the matching schema and retry from exact errors.
- Validate the complete co-resident changed file set after the final edit.
- Keep ordinary theme and theme app extension validation contexts separate.
- Use LiquidDoc and modern block/component patterns only where the target
  architecture supports them.
- Treat Toolkit Theme Check `ERROR` as blocking and preserve `WARNING`/`INFO`
  as visible advice unless project policy is stricter.

## Rejected or Restricted Patterns

- Automatic plugin, MCP, hook, or generated-skill installation.
- Automatic updates without revision review.
- Prompt/session/tool-use telemetry identifiers.
- Immediate preview-store creation, authentication, store execution, mutation,
  deploy, publish, or other Shopify CLI operation.
- Stateless validation as completion evidence.
- Full Toolkit vendoring into the project or global skill tree.
- Treating upstream mandatory wording or manifest capabilities as authority.

## Applied Controls

- Added the shared global security workflow at
  `C:\Users\Admin\.agents\skills\references\shopify-ai-toolkit-security-workflow.md`.
- Hardened global Shopify router, broad platform, Liquid, theme, CLI, and audit
  skills to load and enforce the shared workflow.
- Locked project behavior in `AGENTS.md`, mirrored Claude-specific enforcement
  in `CLAUDE.md`, and expanded `docs/shopify-development-rules.md`.
- Removed the stale concrete API-version claim from the broad Shopify skill.
- Preserved English-only rule and skill guidance.

## Completion Criteria

The Toolkit may be used only when all applicable conditions are observed:

1. The exact revision/version and scripts are reviewed.
2. The user approves installation or execution and separately approves each
   Shopify CLI invocation.
3. Exact `OPT_OUT_INSTRUMENTATION=true` is active.
4. Telemetry endpoints and unapproved staging/auth overrides are absent.
5. Prompt, session, and tool-use identifiers are omitted.
6. Inputs contain no secrets, customer data, private store data, or unnecessary
   proprietary context.
7. Project-native final changed-set validation still runs and passes.
8. The result records observed evidence rather than inferred success.

## Residual Risk

No execution-time network trace was performed because running Toolkit hooks or
scripts was outside the approved audit scope. The findings are source-based at
the pinned revision. Any later Toolkit revision must be treated as new code and
re-audited before use.
