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
    let served = '';
    await page.route(/\/page-contact\.js/, async (route) => {
      const res = await route.fetch();
      let body = await res.text();
      served = route.request().url();
      if (process.env.CL_BEFORE === '1') body = body.replace(/, \{ signal(: this\.lifecycle\.signal)? \}/g, '');
      await route.fulfill({ response: res, body });
    });
    await gotoStore(page, '/pages/contact');
    await settle(page);
    const hasLifecycle = await page.evaluate(() => {
      const el = document.querySelector('contact-page');
      return !!(el && el.lifecycle);
    });
    await page.evaluate(() => {
      const el = document.querySelector('contact-page');
      const parent = el.parentNode;
      const next = el.nextSibling;
      for (let i = 0; i < 2; i++) { el.remove(); parent.insertBefore(el, next); }
      window.__validateCalls = 0;
      const proto = Object.getPrototypeOf(el);
      const orig = proto.validateField;
      proto.validateField = function (f) { window.__validateCalls++; return orig.call(this, f); };
    });
    const field = page.locator('contact-page .form-control').first();
    await field.focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    const validateCalls = await page.evaluate(() => window.__validateCalls);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Debugger.enable');
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    const shows = listeners.filter((l) => l.type === 'pageshow');
    const pageshow = shows.length;
    const pageshowFromContact = [];
    for (const l of shows) {
      const src = await cdp.send('Debugger.getScriptSource', { scriptId: l.scriptId }).catch(() => null);
      pageshowFromContact.push(!!(src && /class ContactPage/.test(src.scriptSource)));
    }
    const fromContact = pageshowFromContact.filter(Boolean).length;
    console.log(JSON.stringify({ served, hasLifecycle, validateCalls, pageshowTotal: pageshow, pageshowFromContact: fromContact }));
    process.exitCode = verdict([
      ['page-contact.js was served through the route handler', !!served, served],
      ['contact-page owns a lifecycle (AbortController signal)', hasLifecycle === true, hasLifecycle],
      ['one validate call after bfcache restore (no duplicated listeners)', validateCalls === 1, validateCalls],
      ['one pageshow listener from ContactPage', fromContact === 1, fromContact],
    ]);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
