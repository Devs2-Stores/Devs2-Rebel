const { chromium } = require('playwright');
const { gotoStore, settle } = require('./lib.cjs');

const verdict = (checks) => {
  const bad = checks.filter(([, ok]) => !ok);
  for (const [n, ok, d] of checks) console.log(`[${ok ? 'PASS' : 'FAIL'}] ${n}${ok ? '' : ' :: ' + JSON.stringify(d)}`);
  console.log(`SUMMARY checks=${checks.length} failed=${bad.length}`);
  return bad.length ? 1 : 0;
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
    const page = await ctx.newPage();
    if (process.env.FL_BEFORE === '1') {
      await page.route(/\/collection\.js/, async (route) => {
        const res = await route.fetch();
        const body = (await res.text()).replace(/, \{ signal: this\.lifecycle\.signal \}/g, '');
        await route.fulfill({ response: res, body });
      });
    }
    await gotoStore(page, '/collections/all');
    await settle(page);
    const result = await page.evaluate(async () => {
      const served = [...document.scripts].map((s) => s.src).find((s) => /collection\.js/.test(s)) || null;
      const reloads = 2;
      for (let i = 0; i < reloads; i++) {
        const el = document.querySelector('facet-filters');
        el.replaceWith(el.cloneNode(true));
      }
      let fetches = 0;
      const realFetch = window.fetch;
      window.fetch = function (...args) {
        if (String(args[0]).includes('section_id=')) fetches++;
        return realFetch.apply(this, args);
      };
      window.dispatchEvent(new PopStateEvent('popstate'));
      await new Promise((r) => setTimeout(r, 300));
      window.fetch = realFetch;

      const host = document.createElement('div');
      host.setAttribute('data-desc-toggle', '');
      host.innerHTML = '<p class="collection-desc__summary">s</p><div class="collection-desc__full" hidden>f</div>'
        + '<button type="button" data-action="toggle-desc"><span class="collection-desc__toggle-more">m</span><span class="collection-desc__toggle-less" hidden>l</span></button>';
      document.body.appendChild(host);
      host.querySelector('button').click();
      const fullShownAfterClick = !host.querySelector('.collection-desc__full').hidden;
      host.remove();
      return { served, reloads, popstateFetches: fetches, fullShownAfterClick };
    });
    console.log(JSON.stringify(result));
    process.exitCode = verdict([
      ['collection.js was served through the route handler', !!result.served, result.served],
      ['popstate after two section reloads refetches once (listeners not duplicated)', result.popstateFetches === 1, result.popstateFetches],
      ['collapsed description stays expanded after the toggle click', result.fullShownAfterClick === true, result.fullShownAfterClick],
    ]);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
