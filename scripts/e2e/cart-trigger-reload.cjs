const { chromium } = require('playwright');
const { gotoStore, settle } = require('./lib.cjs');

const verdict = (checks) => {
  const bad = checks.filter(([, ok]) => !ok);
  for (const [n, ok, d] of checks) console.log(`[${ok ? 'PASS' : 'FAIL'}] ${n}${ok ? '' : ' :: ' + JSON.stringify(d)}`);
  console.log(`SUMMARY checks=${checks.length} failed=${bad.length}`);
  return bad.length ? 1 : 0;
};

const NEW_BLOCK = `  document.addEventListener('click', function(event) {
    var button = event.target.closest('[data-action="open-cart-modal"], [data-action="open-cart-sidebar"]');
    if (!button) return;
    event.preventDefault();
    window.openCartModal();
  });`;
const OLD_BLOCK = `  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="open-cart-modal"], [data-action="open-cart-sidebar"]').forEach(function(button) {
      button.addEventListener('click', function(event) {
        event.preventDefault();
        window.openCartModal();
      });
    });
  });`;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const out = {};
  try {
    for (const w of [1440, 375]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 } });
      await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
      const page = await ctx.newPage();
      let swapped = null;
      await page.route(/\/cart-modal\.js/, async (route) => {
        const res = await route.fetch();
        let body = await res.text();
        if (process.env.CT_BEFORE === '1') { swapped = body.includes(NEW_BLOCK); body = body.replace(NEW_BLOCK, OLD_BLOCK); }
        else swapped = body.includes(NEW_BLOCK);
        await route.fulfill({ response: res, body });
      });
      await gotoStore(page, '/');
      await settle(page);
      const isOpen = () => page.evaluate(() => { const m = document.querySelector('cart-modal'); return !!(m && m.isOpen); });
      const btn = page.locator('.header__cart-btn:visible').first();
      await btn.click();
      await page.waitForTimeout(500);
      const beforeReload = await isOpen();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await page.evaluate(() => {
        const sec = document.querySelector('.header__cart-btn').closest('.shopify-section');
        sec.outerHTML = sec.outerHTML;
      });
      await page.waitForTimeout(200);
      await page.locator('.header__cart-btn:visible').first().click();
      await page.waitForTimeout(500);
      const afterReload = await isOpen();
      out[w] = { servedHasDelegation: swapped, beforeReload, afterReload };
      await ctx.close();
    }
    console.log(JSON.stringify(out));
    process.exitCode = verdict(Object.entries(out).flatMap(([w, r]) => [
      [`${w}: served script carries the delegated cart trigger`, r.servedHasDelegation === true, r],
      [`${w}: cart trigger opens the drawer before a section reload`, r.beforeReload === true, r],
      [`${w}: cart trigger still opens the drawer after a section reload`, r.afterReload === true, r],
    ]));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
