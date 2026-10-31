const { chromium } = require('playwright');
const { gotoStore, settle } = require('./lib.cjs');
const { PDP } = require('./routes.cjs');

const verdict = (checks) => {
  const bad = checks.filter(([, ok]) => !ok);
  for (const [n, ok, d] of checks) console.log(`[${ok ? 'PASS' : 'FAIL'}] ${n}${ok ? '' : ' :: ' + JSON.stringify(d)}`);
  console.log(`SUMMARY checks=${checks.length} failed=${bad.length}`);
  return bad.length ? 1 : 0;
};

const BEFORE = process.env.SR_BEFORE === '1';
const SCRIPTS = /\/(mobile-menu|footer|product|cart-modal|cart-recommendations)\.js/;

const REVERT = {
  'mobile-menu.js': [[
`  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action="open-mobile-menu"]');
    if (!btn) return;
    e.preventDefault();
    var mobileMenu = document.querySelector('mobile-menu');
    if (mobileMenu && typeof mobileMenu.open === 'function') {
      mobileMenu.open();
    }
  });`,
`  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="open-mobile-menu"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var mobileMenu = document.querySelector('mobile-menu');
        if (mobileMenu && typeof mobileMenu.open === 'function') {
          mobileMenu.open();
        }
      });
    });
  });`]],
  'footer.js': [[`  document.addEventListener('shopify:section:load', initAll);\n`, '']],
  'product.js': [[
`document.addEventListener('DOMContentLoaded', initGiftCardRecipients);
document.addEventListener('shopify:section:load', initGiftCardRecipients);`,
`document.addEventListener('DOMContentLoaded', initGiftCardRecipients);`]],
  'cart-modal.js': [[
"    connectedCallback() {\n      this.documentLifecycle = new AbortController();",
"    connectedCallback() {\n      if (this._initialized) return;\n      this.documentLifecycle = new AbortController();",
(body) => body.includes("    connectedCallback() {\n      if (this._initialized) return;\n      this._initialized = true;\n      this.isOpen = false;")]],
  'cart-recommendations.js': [[
"    connectedCallback() {\n      this.lifecycle = new AbortController();",
"    connectedCallback() {\n      if (this._initialized) return;\n      this.lifecycle = new AbortController();",
(body) => body.includes("    connectedCallback() {\n      if (this._initialized) return;\n      this._initialized = true;\n      this.productId")], [
/\n[ \t]*if \(requestId !== this\.loadId\) return;/g,
'',
(body) => !body.includes('loadId')]],
};

async function open(browser, w, route) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
  const page = await ctx.newPage();
  const applied = {};
  await page.route(SCRIPTS, async (r) => {
    const name = r.request().url().match(SCRIPTS)[0].slice(1);
    const res = await r.fetch();
    let body = await res.text();
    applied[name] = true;
    if (BEFORE) for (const [now, old, alreadyUnfixed] of REVERT[name]) {
      if (typeof now === 'string' ? body.includes(now) : body.search(now) >= 0) body = body.replace(now, old);
      else if (!(alreadyUnfixed && alreadyUnfixed(body))) applied[name] = 'pattern-missing';
    }
    await r.fulfill({ response: res, body });
  });
  await gotoStore(page, route);
  await settle(page);
  return { ctx, page, applied };
}

const reload = (page, sel) => page.evaluate(async (s) => {
  const sec = document.querySelector(s).closest('.shopify-section');
  const id = sec.id.replace(/^shopify-section-/, '');
  const url = new URL(location.href);
  url.searchParams.set('section_id', id);
  const html = await (await fetch(url.toString())).text();
  sec.outerHTML = html;
  const fresh = document.getElementById('shopify-section-' + id);
  fresh.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true, detail: { sectionId: id } }));
  return id;
}, sel);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const out = { mode: BEFORE ? 'before' : 'after' };
  try {
    {
      const { ctx, page, applied } = await open(browser, 375, '/');
      const menuOpen = () => page.evaluate(() => { const m = document.querySelector('mobile-menu'); return !!(m && (m.classList.contains('is-open') || m.isOpen || m.getAttribute('aria-hidden') === 'false')); });
      await page.locator('[data-action="open-mobile-menu"]:visible').first().click();
      await page.waitForTimeout(500);
      const pre = await menuOpen();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await reload(page, '[data-action="open-mobile-menu"]');
      await page.waitForTimeout(200);
      await page.locator('[data-action="open-mobile-menu"]:visible').first().click();
      await page.waitForTimeout(500);
      out.mobileMenu = { applied: applied['mobile-menu.js'], pre, post: await menuOpen() };

      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const footerState = () => page.evaluate(() => {
        const m = document.querySelector('.footer-actions-menu');
        const t = m && m.querySelector('.footer-actions-menu__toggle');
        return t ? t.getAttribute('aria-expanded') : 'no-toggle';
      });
      const toggle = page.locator('.footer-actions-menu__toggle').first();
      await toggle.scrollIntoViewIfNeeded();
      const f0 = await footerState();
      await toggle.click();
      await page.waitForTimeout(300);
      const f1 = await footerState();
      await reload(page, '.footer-actions-menu__toggle');
      await page.waitForTimeout(200);
      const t2 = page.locator('.footer-actions-menu__toggle').first();
      await t2.scrollIntoViewIfNeeded();
      const g0 = await footerState();
      await t2.click();
      await page.waitForTimeout(300);
      const g1 = await footerState();
      out.footer = { applied: applied['footer.js'], pre: [f0, f1], post: [g0, g1] };
      await ctx.close();
    }
    {
      const { ctx, page, applied } = await open(browser, 1440, PDP);
      const lbOpen = () => page.evaluate(() => { const l = document.querySelector('product-lightbox'); return !!(l && l.classList.contains('is-active')); });
      const img = () => page.locator('product-template .product-template__media-image:visible').first();
      await img().click();
      await page.waitForTimeout(600);
      const pre = await lbOpen();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const closed = !(await lbOpen());
      await page.evaluate(() => { const l = document.querySelector('product-lightbox'); if (l && l.classList.contains('is-active') && typeof l.close === 'function') l.close(); });
      await page.waitForTimeout(300);
      await reload(page, 'product-template');
      await page.waitForTimeout(400);
      await img().click();
      await page.waitForTimeout(600);
      const post = await lbOpen();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const reattached = await page.evaluate(() => {
        const l = document.querySelector('product-lightbox');
        if (!l) return false;
        const parent = l.parentNode;
        const next = l.nextSibling;
        l.remove();
        parent.insertBefore(l, next);
        return true;
      });
      await img().click();
      await page.waitForTimeout(600);
      out.lightbox = { applied: applied['product.js'], pre, closedByEscape: closed, post, reattached, reopenedAfterReattach: reattached && (await lbOpen()) };
      await ctx.close();
    }
    {
      const { ctx, page } = await open(browser, 1440, '/products/gift-card');
      const state = () => page.evaluate(() => {
        const c = document.querySelector('.product-template__gift-card-recipient');
        if (!c) return 'no-recipient';
        const t = c.querySelector('input[name="properties[__shopify_send_gift_card_to_recipient]"]');
        const f = c.querySelector('[data-gift-card-field]');
        return { checked: t && t.checked, fieldDisabled: f && f.disabled };
      });
      const s0 = await state();
      if (s0 !== 'no-recipient') {
        await reload(page, '.product-template__gift-card-recipient');
        await page.waitForTimeout(400);
        const s1 = await state();
        const box = page.locator('.product-template__gift-card-recipient input[name="properties[__shopify_send_gift_card_to_recipient]"]').first();
        await box.check({ force: true });
        await page.waitForTimeout(200);
        out.giftCard = { initial: s0, afterReload: s1, afterCheck: await state() };
      } else out.giftCard = s0;
      await ctx.close();
    }
    {
      const { ctx, page, applied } = await open(browser, 1440, '/');
      const isOpen = () => page.evaluate(() => document.querySelector('cart-modal').isOpen === true);
      await page.evaluate(() => {
        const cm = document.querySelector('cart-modal');
        const close = cm.close.bind(cm);
        window.__closes = 0;
        cm.close = function() { window.__closes += 1; return close.apply(null, arguments); };
        const parent = cm.parentNode;
        const next = cm.nextSibling;
        cm.remove();
        parent.insertBefore(cm, next);
        window.openCartModal();
      });
      await page.waitForTimeout(500);
      const openedBefore = await isOpen();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      out.cartModalReattach = { applied: applied['cart-modal.js'], openedBefore, openAfterEscape: await isOpen(), closes: await page.evaluate(() => window.__closes) };
      await ctx.close();
    }
    {
      const { ctx, page, applied } = await open(browser, 1440, '/cart');
      await page.evaluate(() => {
        const el = document.querySelector('cart-recommendations');
        window.__loads = [];
        el.load = (id) => window.__loads.push(id);
        const parent = el.parentNode;
        const next = el.nextSibling;
        el.remove();
        parent.insertBefore(el, next);
        const source = document.querySelector('cart-template');
        for (const id of [111, 222]) {
          document.dispatchEvent(new CustomEvent(themeConfig.cart.events.updated, { detail: { source, cart: { items: [{ product_id: id }] } } }));
        }
      });
      const calls = await page.evaluate(() => window.__loads);
      out.cartRecsReattach = { applied: applied['cart-recommendations.js'], calls };

      const markup = (t) => `<cart-recommendations><section data-recommendation-products>${t}</section></cart-recommendations>`;
      await page.route(/recommendations\/products/, async (route) => {
        const first = /product_id=111(&|$)/.test(route.request().url());
        if (first) await new Promise((r) => setTimeout(r, 1500));
        await route.fulfill({ status: 200, contentType: 'text/html', body: markup(first ? 'FIRST' : 'SECOND') });
      });
      await page.evaluate(() => {
        const el = document.querySelector('cart-recommendations');
        delete el.load;
        el.load('111');
        el.load('222');
      });
      await page.waitForTimeout(2500);
      out.cartRecsStale = { text: await page.evaluate(() => document.querySelector('cart-recommendations').textContent.trim()) };
      await ctx.close();
    }
    console.log(JSON.stringify(out));
    const sr = [];
    for (const [k, file] of [['mobileMenu', 'mobile-menu.js'], ['footer', 'footer.js'], ['giftCard', 'product.js']]) {
      const a = k === 'giftCard' ? out.lightbox && out.lightbox.applied : out[k] && out[k].applied;
      sr.push([`${file}: revert/patch applied to the served script`, a === true, a]);
    }
    sr.push(['mobile menu opens after a section reload', !!out.mobileMenu && out.mobileMenu.pre === true && out.mobileMenu.post === true, out.mobileMenu]);
    sr.push(['footer accordion toggles after a section reload', !!out.footer && JSON.stringify(out.footer.post) === JSON.stringify(['false', 'true']), out.footer]);
    sr.push(['lightbox opens, closes on Escape, reopens after a section reload and after a remove/re-insert', !!out.lightbox && out.lightbox.pre === true && out.lightbox.closedByEscape === true && out.lightbox.post === true && out.lightbox.reopenedAfterReattach === true, out.lightbox]);
    sr.push(['gift-card recipient field enables after the checkbox is ticked, after a reload', !!out.giftCard && !!out.giftCard.afterCheck && out.giftCard.afterCheck.checked === true && out.giftCard.afterCheck.fieldDisabled === false, out.giftCard]);
    sr.push(['cart-modal.js: revert/patch applied to the served script', out.cartModalReattach.applied === true, out.cartModalReattach.applied]);
    sr.push(['cart-recommendations.js: revert/patch applied to the served script', out.cartRecsReattach.applied === true, out.cartRecsReattach.applied]);
    sr.push(['a re-attached cart-modal opens, closes once on Escape and fires each document handler once', out.cartModalReattach.openedBefore === true && out.cartModalReattach.openAfterEscape === false && out.cartModalReattach.closes === 1, out.cartModalReattach]);
    sr.push(['a re-attached cart-recommendations reloads once per cart:updated event', JSON.stringify(out.cartRecsReattach.calls) === JSON.stringify(['111', '222']), out.cartRecsReattach]);
    sr.push(['a slow earlier recommendations response never overwrites the latest one', out.cartRecsStale.text.includes('SECOND') && !out.cartRecsStale.text.includes('FIRST'), out.cartRecsStale]);
    process.exitCode = verdict(sr);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
