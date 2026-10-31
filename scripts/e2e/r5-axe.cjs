// Exit 1 on any axe violation, error, unexpected status or horizontal overflow.
// R5_EXPECT=route=status lists deliberate non-200 routes. R5_INJECT appends markup after load (self-test hook).
// The best-practice rules in EXTRA carry no wcag tag, so runOnly by tag alone never runs them.
// heading-order inside the merchant-authored product description is ignored: product.description is merchant HTML.
const fs = require('fs');
const { chromium } = require('playwright');
const { gotoStore, settle } = require('./lib.cjs');

const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ROUTES = (process.env.R5_ROUTES || '/,/collections/all,/products/rebel-tactical-bomber-jacket,/pages/about').split(',');
const WIDTHS = (process.env.R5_WIDTHS || '375,1440').split(',').map(Number);
const EXPECT = Object.fromEntries((process.env.R5_EXPECT || '').split(',').filter(Boolean).map((p) => { const [r, s] = p.split('='); return [r, Number(s)]; }));
const INJECT = process.env.R5_INJECT || '';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const EXTRA = ['heading-order', 'landmark-one-main', 'landmark-no-duplicate-main', 'aria-allowed-role'];
const MERCHANT_HTML = /__tab-description|product-template__description/;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const out = {};
  let failed = 0;
  try {
    for (const w of WIDTHS) {
      for (const route of ROUTES) {
        const key = `${w} ${route}`;
        const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 } });
        await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
        const page = await ctx.newPage();
        try {
          const resp = await gotoStore(page, route, { allowStatus: EXPECT[route] ? [EXPECT[route]] : [] });
          const status = resp ? resp.status() : null;
          await settle(page);
          if (INJECT) await page.evaluate((h) => document.body.insertAdjacentHTML('beforeend', h), INJECT);
          await page.evaluate(async () => {
            document.querySelectorAll('.swiper').forEach((el) => { if (el.swiper && el.swiper.autoplay) el.swiper.autoplay.stop(); });
            const finite = document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect.getComputedTiming().endTime));
            await Promise.race([Promise.allSettled(finite.map((a) => a.finished)), new Promise((r) => setTimeout(r, 3000))]);
          });
          await page.addScriptTag({ content: AXE });
          const v = await page.evaluate(async ({ tags, extra }) => {
            const ids = [...new Set(window.axe.getRules(tags).map((r) => r.ruleId).concat(extra))];
            const res = await window.axe.run(document, { runOnly: { type: 'rule', values: ids }, resultTypes: ['violations'] });
            return res.violations.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.map((n) => n.target.join(' ')) }));
          }, { tags: TAGS, extra: EXTRA });
          const violations = v.map((x) => ({ ...x, nodes: x.id === 'heading-order' ? x.nodes.filter((t) => !MERCHANT_HTML.test(t)) : x.nodes })).filter((x) => x.nodes.length);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          const want = EXPECT[route] || 200;
          const bad = violations.length > 0 || overflow > 0 || status !== want;
          if (bad) failed++;
          out[key] = { status, want, overflow, violations: violations.map((x) => `${x.id}(${x.impact}) ${x.nodes.slice(0, 3).join(' | ')}`) };
          console.log(`[${bad ? 'FAIL' : 'PASS'}] ${key} :: status ${status} overflow ${overflow} violations ${violations.map((x) => x.id).join(',') || 0}`);
        } catch (e) {
          failed++;
          out[key] = { error: String(e.message).slice(0, 200), url: page.url() };
          console.log(`[FAIL] ${key} :: ${out[key].error}`);
        } finally {
          await ctx.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`SUMMARY runs=${Object.keys(out).length} failed=${failed}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('ERR', e.message); process.exit(2); });
