const { chromium } = require('playwright');
const { gotoStore, settle } = require('./lib.cjs');

const verdict = (checks) => {
  const bad = checks.filter(([, ok]) => !ok);
  for (const [n, ok, d] of checks) console.log(`[${ok ? 'PASS' : 'FAIL'}] ${n}${ok ? '' : ' :: ' + JSON.stringify(d)}`);
  console.log(`SUMMARY checks=${checks.length} failed=${bad.length}`);
  return bad.length ? 1 : 0;
};

const BEFORE = process.env.SR_BEFORE === '1';
const PDP = '/products/rebel-tactical-bomber-jacket';

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
};

async function open(browser, w, route) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
  const page = await ctx.newPage();
  const applied = {};
  await page.route(/\/(mobile-menu|footer|product)\.js/, async (r) => {
    const name = r.request().url().match(/\/(mobile-menu|footer|product)\.js/)[0].slice(1);
    const res = await r.fetch();
    let body = await res.text();
    applied[name] = true;
    if (BEFORE) for (const [now, old] of REVERT[name]) {
      if (!body.includes(now)) applied[name] = 'pattern-missing';
      body = body.replace(now, old);
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
    process.exitCode = verdict(sr);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
