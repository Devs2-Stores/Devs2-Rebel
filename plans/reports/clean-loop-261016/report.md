# Clean-code loop (20 rounds) - Rebel - 2026-10-16

Status: **DONE_WITH_CONCERNS**. 20/20 rounds kept, 0 reverted. Nothing committed or pushed; `shopify theme check` not run (needs approval).

## Metric

`runs/loop/clean-metric.py --summary` (lower is better). Guard `runs/loop/guard-static.sh` (node --check, JSON parse, validate-locales, validate-schema-ranges, package-theme) passed every round and was proven red on a broken JS file before round 1.

| Component | Baseline | Final |
|---|---|---|
| dead_class | 76 | 0 |
| duration (literal) | 78 | 16 |
| hex (literal) | 21 | 0 |
| !important | 20 | 11 |
| empty_catch | 11 | 4 |
| :not() chain | 3 | 2 |
| **total** | **209** | **33** |

Full per-round log: `runs/loop/loop-results.tsv`. Per-round pre-edit snapshots: `scratch/loop-snapshots/<round>/` (restore with `python runs/loop/snap.py restore <round>`).

## Behavioural changes (not pure deletion)

- R9/R10: `ThemeUtils.storage` (get/set/getJSON, private-mode safe) and `ThemeUtils.parseJSON` in `assets/theme.js`; callers in collection, newsletter-modal, product (viewed products), variant-picker. Proof: `runs/loop/storage-smoke.cjs` 12/12, `runs/loop/live-js-probe.cjs` 10/10 with normal and throwing `localStorage`.
- R17: removed `min-width: auto !important` on `--link` buttons in image-with-text, rich-text, slideshow. Proof: `runs/loop/link-btn-probe.cjs` link buttons 0px, control button 140px.
- R18: slideshow empty-state placeholder `#f0f0f0` -> `--color-black` (white slide text was ~1.1:1 on it); hero + slideshow placeholder SVG gets `fill: currentColor` (`color` alone did not tint it). Proof: `runs/loop/placeholder-probe.cjs` bg black, fill white.
- R19: `section-pagination` hover/focus scoped to `[href]` instead of `:not()` chain. Proof: `runs/loop/pagination-probe.cjs`.
- R20: `--footer-margin-top` hook in `assets/footer.css`; contact and stores set it instead of `!important` / `body:has()`. Proof: live margin-top 64/0/0/64px on home/contact/stores/faq.
- R11-R16 selector pruning used `runs/loop/prune-selectors.py` (selftest `runs/loop/prune-selftest.py` 8/8), each class confirmed absent from source grep and from a 46-page rendered crawl (`runs/loop/class-usage.py`, positive controls present).

## Final verification (live `shopify theme dev`, 127.0.0.1:9292)

| Check | Result | Evidence |
|---|---|---|
| node --check / JSON parse | 0 FAIL | `suite/node-check.txt`, `suite/json-parse.txt` |
| validate-locales / ranges | exit 0 / exit 0 | `suite/validate-*.txt` |
| Journeys (full suite, conc 3) | 92 PASS / 4 FAIL | `suite/journeys-after.log` |
| Journeys isolated rerun x3 (search375, search1440, pdpVariantCart) | 32/32 each run | `iso/journeys/journeys-r{1,2,3}.json` |
| axe 15 routes x 375/768/1440 | 0 violations, 0 overflow | `suite/axe.json` |
| Lifecycle / error paths | all ok | `suite/*-after.json` |
| Discovery | 13/20/28 (known platform/dev-proxy baseline) | `suite/discovery.txt` |
| Capture 16 routes x 3 widths | 48/48 captured, 0 overflow/broken images; `login` renders the 404 page at all 3 widths, identical to the pre-loop capture (`plans/reports/e2e-261016-motion-state/capture/capture.log:16,32,48`) because `/account/login` 302s to new customer accounts | `capture/capture.json` |
| Motion/hover probe (checkpoint R15) | 94 PASS / 3 FAIL (known Q-01/Q-02) | `plans/reports/e2e-261016-motion-state/motion-state-loop15.json` |
| AntiFan theme.qa_validate | FAIL from known noise only (shop.app CSP, customer-account-main-menu, HotReload); 0 overflow at 5 widths, Liquid clean, assets 95/95 | receipt run-ce19cbcc-0539-4393-b4fd-78547445867c |

The 4 full-suite journey failures (search375 focus/predictive timeout, pdpVariantCart drawer items 0 while count = 1) do not reproduce in 3 isolated serial runs, and no round touched `search-modal.js`, `cart-modal.js` or `main-cart-items.liquid`. [INFERENCE] Dev-server load flake: the 96/0 baseline also ran at `E2E_CONC=3`, so concurrency alone is not proven; a full-concurrency rerun is part of the follow-up E2E run.

## Not done / open

- Q-01 / Q-02 (quick view has no open/close animation; focus does not return to trigger) are pre-existing defects, out of scope for a clean-code loop. Not fixed.
- Remaining metric 33: 16 durations are bespoke easing/keyframe values, 11 `!important` are vendor/form resets, 4 empty catches are intentional (play/pause promises, shopify-xr, model JSON), 2 `:not()` in theme.css form resets.
- `shopify theme check` and commit need user approval.
