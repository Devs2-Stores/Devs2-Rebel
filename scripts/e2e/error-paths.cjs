// Repaired error-paths gate (prototype, tested by the verifier). Works against the keyed cart API (working tree)
// and the line-index API (EP_BEFORE=1 replays HEAD). Exit 1 on any failed check.
// EP_MUTATE=no-toast removes every toast the moment it is added: the gate must go red.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const { gotoStore, settle, ROOT } = require('./lib.cjs');
const { PDP } = require('./routes.cjs');

const BEFORE = process.env.EP_BEFORE === '1';
const MUTATE = process.env.EP_MUTATE || '';
const headAsset = (name) => execFileSync('git', ['--git-dir=.git-nested', '--work-tree=.', 'show', 'HEAD:assets/' + name], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24 });

const toastText = (page) => page.evaluate(() => {
  const t = [...document.querySelectorAll('.toast-container > *')].pop();
  return t ? t.textContent.trim().replace(/\s+/g, ' ').replace(/×$/, '').trim() : null;
});
const clearToasts = (page) => page.evaluate(() => { const c = document.querySelector('.toast-container'); if (c) c.innerHTML = ''; });

const SCENARIOS = {
  abort: (route) => route.abort('failed'),
  html500: (route) => route.fulfill({ status: 500, contentType: 'text/html', body: '<!doctype html><html><body>Server error</body></html>' }),
  json422: (route) => route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ status: 422, message: 'Cart Error', description: 'PROBE: only 1 left' }) }),
};

const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok: !!ok });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${ok ? '' : ' :: ' + JSON.stringify(detail)}`);
};

// Fire a quantity change on the first rendered line through whichever API the served script exposes.
const changeFirstLine = (page, host) => page.evaluate(async (h) => {
  const el = document.querySelector(h);
  const drawer = h === 'cart-modal';
  const row = el.querySelector(drawer ? '.cart-modal-item[data-line-key]' : 'cart-item[data-line-key]');
  if (!row) throw new Error('no cart line with data-line-key rendered in ' + h);
  const keyed = drawer ? typeof el.lineByKey === 'function' : typeof el.findLine === 'function';
  if (drawer) return el.changeLine(keyed ? row.dataset.lineKey : Number(row.dataset.lineItem), 2);
  return el.updateCart(keyed ? { key: row.dataset.lineKey, quantity: 2 } : { line: Number(row.dataset.lineItem), quantity: 2 });
}, host);

// Route a pattern, count the requests that reach it, run the trigger, read the toast.
async function scenario(page, pattern, handler, trigger) {
  let hits = 0;
  await clearToasts(page);
  await page.route(pattern, (route) => { hits++; return handler(route); });
  await trigger();
  await page.waitForTimeout(500);
  const toast = await toastText(page);
  await page.unroute(pattern);
  return { hits, toast };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
    if (MUTATE === 'no-toast') {
      await ctx.addInitScript(() => {
        new MutationObserver(() => document.querySelectorAll('.toast-container > *').forEach((n) => n.remove())).observe(document, { childList: true, subtree: true });
      });
    }
    const page = await ctx.newPage();
    if (BEFORE) {
      const head = { 'cart-modal.js': headAsset('cart-modal.js'), 'cart.js': headAsset('cart.js'), 'collection.js': headAsset('collection.js') };
      await page.route(/\/assets\/(cart-modal|cart|collection)\.js/, (route) => {
        const name = new URL(route.request().url()).pathname.split('/').pop();
        route.fulfill({ status: 200, contentType: 'application/javascript', body: head[name] });
      });
    }
    await gotoStore(page, '/');
    await settle(page);
    const seed = await page.evaluate(async (pdp) => {
      const res = await fetch(pdp + '.js');
      if (!res.ok) return { status: 0, error: 'product fetch ' + res.status };
      const p = await res.json();
      const v = p.variants.find((x) => x.available);
      if (!v) return { status: 0, error: 'no available variant' };
      const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ id: v.id, quantity: 1 }) });
      return { status: r.status, cartError: themeConfig.strings.cart.error, loadError: (themeConfig.strings.collection || {}).loadError || null };
    }, PDP);
    check('seed: cart line added and locale strings present', seed.status === 200 && !!seed.cartError && !!seed.loadError, seed);
    if (seed.status !== 200) throw new Error('seed failed: ' + JSON.stringify(seed));

    await gotoStore(page, '/');
    await settle(page);
    await page.evaluate(() => window.openCartModal());
    await page.waitForSelector('cart-modal .cart-modal-item[data-line-key]', { timeout: 15000 });
    for (const [name, handler] of Object.entries(SCENARIOS)) {
      const r = await scenario(page, /\/cart\/change(\.js)?(\?|$)/, handler, () => changeFirstLine(page, 'cart-modal'));
      const want = name === 'json422' ? 'PROBE: only 1 left' : seed.cartError;
      check(`drawer ${name}: request fired and toast shows the message`, r.hits >= 1 && r.toast === want, { ...r, want });
    }
    {
      const r = await scenario(page, /\/cart\/update(\.js)?(\?|$)/, SCENARIOS.abort, () => page.evaluate(() => {
        const m = document.querySelector('cart-modal');
        if (!m.noteInput) m.noteInput = document.createElement('textarea');
        return m.updateNote();
      }));
      check('drawer note abort: request fired and toast shown', r.hits >= 1 && !!r.toast, r);
    }
    {
      const r = await scenario(page, /\/cart\.js(\?|$)/, SCENARIOS.html500, () => page.evaluate(() => document.querySelector('cart-modal').loadCart()));
      check('drawer loadCart 500: request fired and toast shows the cart error', r.hits >= 1 && r.toast === seed.cartError, { ...r, want: seed.cartError });
    }

    await gotoStore(page, '/cart');
    await settle(page);
    await page.waitForSelector('cart-template cart-item[data-line-key]', { timeout: 15000 });
    for (const [name, handler] of Object.entries(SCENARIOS)) {
      const r = await scenario(page, /\/cart\/change(\.js)?(\?|$)/, handler, () => changeFirstLine(page, 'cart-template'));
      const want = name === 'json422' ? 'PROBE: only 1 left' : seed.cartError;
      check(`cart page ${name}: request fired and toast shows the message`, r.hits >= 1 && r.toast === want, { ...r, want });
    }
    {
      const r = await scenario(page, /section_id=/, SCENARIOS.abort, () => page.evaluate(() => {
        const el = document.querySelector('cart-template');
        const row = el.querySelector('cart-item[data-line-key]');
        const keyed = typeof el.findLine === 'function';
        return el.updateCart(keyed ? { key: row.dataset.lineKey, quantity: 1 } : { line: Number(row.dataset.lineItem), quantity: 1 });
      }));
      check('cart page section re-render abort: request fired and toast shown', r.hits >= 1 && !!r.toast, r);
    }

    await gotoStore(page, '/collections/all');
    await settle(page);
    {
      const r = await scenario(page, /section_id=/, SCENARIOS.abort, () => page.evaluate(() => document.querySelector('facet-filters').fetchAndRender(location.pathname + '?sort_by=price-ascending', false)));
      const cleared = await page.evaluate(() => !document.querySelector('facet-filters').classList.contains('is-loading'));
      check('collection filter abort: request fired, toast shows loadError, loading cleared', r.hits >= 1 && r.toast === seed.loadError && cleared, { ...r, cleared, want: seed.loadError });
    }
    const countCards = () => page.evaluate(() => document.querySelectorAll('#CollectionProducts .product-cards__item').length);
    const before = await countCards();
    {
      let state = null;
      const r = await scenario(page, /sections=/, SCENARIOS.html500, async () => {
        state = await page.evaluate(async () => {
          const btn = document.createElement('button');
          btn.disabled = true;
          btn.classList.add('is-loading');
          document.querySelector('facet-filters').fetchAppendProducts(location.pathname + '?page=2', btn);
          await new Promise((res) => setTimeout(res, 800));
          return { disabled: btn.disabled, loading: btn.classList.contains('is-loading') };
        });
      });
      check('load-more 500: request fired, toast shows loadError, button restored', r.hits >= 1 && r.toast === seed.loadError && state.disabled === false && state.loading === false, { ...r, state, want: seed.loadError });
    }
    await clearToasts(page);
    await page.evaluate(() => document.querySelector('facet-filters').fetchAppendProducts(location.pathname + '?page=2', null));
    await page.waitForTimeout(1500);
    const after = await countCards();
    check('load-more success: cards appended and no toast', after > before && (await toastText(page)) === null, { before, after });

    await gotoStore(page, '/cart');
    await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  } finally {
    await browser.close();
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`SUMMARY checks=${checks.length} failed=${failed}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('ERR', e.message); process.exit(2); });
