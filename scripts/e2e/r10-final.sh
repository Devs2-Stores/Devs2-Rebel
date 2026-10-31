#!/usr/bin/env bash
# Usage: bash scripts/e2e/r10-final.sh <evidence-dir>   (run from the theme root; needs `shopify theme dev` on 127.0.0.1:9292 and `npm install` in scripts/e2e)
# Exit 0 only when every gate is green AND every replay gate is red on its reintroduced bug.
# NEVER calls scripts/package-theme.py (it writes dist/).
set -u -o pipefail
[ -n "${1:-}" ] || { echo "usage: bash scripts/e2e/r10-final.sh <evidence-dir>" >&2; exit 2; }
[ -f config/settings_schema.json ] && [ -d scripts/e2e ] || { echo "run from the theme root" >&2; exit 2; }
mkdir -p "$1" || exit 2
OUT="$(cd "$1" && { pwd -W 2>/dev/null || pwd; })"
BASE="${E2E_BASE:-http://127.0.0.1:9292}"
export NODE_NO_WARNINGS=1

FAILED=()
gate() {        # gate <name> <command...>: command must exit 0; log in $OUT/<name>.log
  local name="$1"; shift
  if "$@" > "$OUT/$name.log" 2>&1; then
    echo "PASS  $name"
  else
    echo "FAIL  $name  (log: $OUT/$name.log)"
    grep -E '^\[FAIL\]|^ERR|FAIL ' "$OUT/$name.log" | head -5 | sed 's/^/        /'
    FAILED+=("$name")
  fi
}
expect_red() {  # expect_red <name> <command...>: command must exit non-zero (the gate has to catch the reintroduced bug)
  local name="$1"; shift
  if "$@" > "$OUT/$name.log" 2>&1; then
    echo "FAIL  $name  (gate stayed green on the reintroduced bug)"; FAILED+=("$name")
  else
    echo "PASS  $name  (red as required)"
  fi
}
advisory() {    # advisory <name> <command...>: logged, never fails the run
  local name="$1"; shift
  "$@" > "$OUT/$name.log" 2>&1; echo "INFO  $name  exit $?  (advisory, log: $OUT/$name.log)"
}

node_check() { local rc=0 f; for f in assets/*.js; do node --check "$f" || rc=1; done; return $rc; }
json_parse() {
  node -e '
    const fs = require("fs"), path = require("path");
    const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
    let bad = 0, n = 0;
    for (const f of ["locales", "config", "templates", "sections", "blocks", "listings"].flatMap(walk).filter((x) => x.endsWith(".json"))) {
      n++;
      const t = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "").replace(/^\s*\/\*[\s\S]*?\*\//, "");
      try { JSON.parse(t); } catch (e) { bad++; console.log("json FAIL " + f + ": " + e.message); }
    }
    console.log("parsed " + n + " json files, " + bad + " bad");
    process.exit(bad ? 1 : 0);
  '
}
routes_ok() {   # every default route must answer 200 on the dev server, or the browser gates measure an error page
  local rc=0 r code
  for r in "${ROUTE_LIST[@]}"; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$BASE$r")"
    [ "$code" = 200 ] || { echo "route $r answered $code"; rc=1; }
  done
  return $rc
}

# Real routes only (every one answers 200 on the dev store); deliberate 404 pages are scanned by their own gates.
ROUTES='/,/collections,/collections/all,/products/rebel-tactical-bomber-jacket,/products/leather-care-balm,/cart,/search?q=jacket,/pages/about,/pages/contact,/pages/contact?view=faq,/pages/contact?view=stores,/blogs/news,/blogs/news/leather-care-101'
IFS=',' read -r -a ROUTE_LIST <<< "$ROUTES"

# 1. static
gate node-check              node_check
gate json-parse              json_parse
gate validate-locales        node scripts/validate-locales.mjs
gate validate-schema-ranges  node scripts/validate-schema-ranges.mjs
gate settings-usage          node scripts/settings-usage.cjs

# 2. dev server and routes
gate dev-server-routes       routes_ok
if [ "${#FAILED[@]}" -gt 0 ] && printf '%s\n' "${FAILED[@]}" | grep -qx dev-server-routes; then
  echo
  echo "${#FAILED[@]} gate(s) failed: ${FAILED[*]} (browser gates skipped: dev server routes are not all 200)"
  exit 1
fi

# 3. lifecycle / replay gates: green on the working tree, red when the bug is replayed
gate       error-paths                 node scripts/e2e/error-paths.cjs
expect_red error-paths-no-toast        env EP_MUTATE=no-toast node scripts/e2e/error-paths.cjs
gate       facet-lifecycle             node scripts/e2e/facet-lifecycle.cjs
expect_red facet-lifecycle-before      env FL_BEFORE=1 node scripts/e2e/facet-lifecycle.cjs
gate       contact-lifecycle           node scripts/e2e/contact-lifecycle.cjs
expect_red contact-lifecycle-before    env CL_BEFORE=1 node scripts/e2e/contact-lifecycle.cjs
gate       cart-trigger-reload         node scripts/e2e/cart-trigger-reload.cjs
expect_red cart-trigger-reload-before  env CT_BEFORE=1 node scripts/e2e/cart-trigger-reload.cjs
gate       section-reload              node scripts/e2e/section-reload.cjs
expect_red section-reload-before       env SR_BEFORE=1 node scripts/e2e/section-reload.cjs

# 4. journeys and browser gates (each script exits non-zero on a failed check)
gate journeys              env E2E_OUT="$OUT" node scripts/e2e/journeys.cjs
gate overlay-contract      env OC_OUT="$OUT/overlay-contract.json" node scripts/e2e/overlay-contract.cjs
gate font-spacing-icon     env FSI_OUT="$OUT/font-spacing-icon.json" FSI_ROUTES="$ROUTES,/pages/does-not-exist-404" node scripts/e2e/font-spacing-icon.cjs
gate target-spacing        env TS_OUT="$OUT/target-spacing.json" TS_ROUTES="$ROUTES" node scripts/e2e/target-spacing.cjs
gate preset-contrast       env PC_OUT="$OUT/preset-contrast.json" node scripts/e2e/preset-contrast.cjs
gate r10-store-hours       env SH_OUT="$OUT/store-hours.json" node scripts/e2e/r10-store-hours.cjs
expect_red r10-store-hours-sign-flip env SH_OUT="$OUT/store-hours-sign-flip.json" SH_JS=scripts/e2e/fixtures/page-stores.sign-flip.js node scripts/e2e/r10-store-hours.cjs
gate r10-touch-hover       env TH_OUT="$OUT/touch-hover.json" node scripts/e2e/r10-touch-hover.cjs
gate r10-tabwalk           env TW_OUT="$OUT/tabwalk.json" TW_ROUTES="$ROUTES" node scripts/e2e/r10-tabwalk.cjs
gate r5-axe                env R5_WIDTHS=375,768,1440 R5_ROUTES="$ROUTES" node scripts/e2e/r5-axe.cjs

# 5. advisory: logged, never fails the run
# discovery: platform-owned findings (404 child sitemaps, relative og:image) make it red by nature on the dev proxy.
# Runs only when DISCOVERY_SCRIPT points at a check-discovery-surfaces.mjs.
DISCOVERY="${DISCOVERY_SCRIPT:-}"
if [ -n "$DISCOVERY" ] && [ -f "$DISCOVERY" ]; then
  advisory discovery node "$DISCOVERY" "$BASE" --site-origin https://rebel-streetwear-hn0q7d9h.myshopify.com --sample 10
else
  echo "INFO  discovery  skipped (set DISCOVERY_SCRIPT to a check-discovery-surfaces.mjs)"
fi

echo
if [ "${#FAILED[@]}" -eq 0 ]; then echo "ALL GATES PASS"; exit 0; fi
echo "${#FAILED[@]} gate(s) failed: ${FAILED[*]}"
exit 1
