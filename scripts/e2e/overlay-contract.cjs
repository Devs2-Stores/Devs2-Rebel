const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { gotoStore, recorder, ensureDir, attachLogs } = require('./lib.cjs');
const { renderSnippet, renderSegment } = require('./snippet-render.cjs');

const OUT = process.env.OC_OUT || path.join(os.tmpdir(), 'e2e-overlay-contract', 'overlay-contract.json');
const PDP = '/products/rebel-tactical-bomber-jacket';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const { results, rec } = recorder();
const MUTATE = process.env.OC_MUTATE || '';

const NEWSLETTER_FIXTURE = { snippet: 'newsletter-modal.liquid', settings: { newsletter_modal_enable: true, newsletter_modal_delay: 1 }, assets: ['newsletter-modal.css', 'newsletter-modal.js'] };
const ADDRESS_FIXTURE = {
  patch: [[' id="acc-new"', ' id="acc-new" style="position:fixed;top:8px;left:8px;z-index:1"']],
  assets: ['customer.css', 'customer.js'],
  segments: [
    ['sections/main-customers-addresses.liquid', '<button type="button" id="acc-new"', '</button>'],
    ['sections/main-customers-addresses.liquid', '<address-modal class="address-modal-wrapper" id="addresses-new-modal"', '</address-modal>'],
  ],
};

const MUTATIONS = {
  'newsletter-css': { url: /newsletter-modal\.css/, edit: (b) => b.replace('visibility 0s linear var(--duration-long)', 'visibility var(--transition-slow)').replace('opacity var(--transition-slow), visibility 0s;', 'opacity var(--transition-slow), visibility var(--transition-slow);') },
  'address-css': { url: /customer\.css/, edit: (b) => b.replace('visibility 0s linear var(--duration-medium)', 'visibility var(--transition-base)').replace('visibility 0s;', 'visibility var(--transition-base);') },
  'pickup-css': { url: /pickup-availability\.css/, edit: (b) => b.replace('visibility 0s linear var(--duration-medium)', 'visibility var(--transition-base)').replace('transform var(--transition-base), visibility 0s;', 'transform var(--transition-base), visibility var(--transition-base);') },
};
let mutationHits = 0;

const OVERLAYS = [
  { name: 'cart-1440', route: '/', w: 1440, h: 900, trigger: '[data-action="open-cart-sidebar"]', host: 'cart-modal', panel: '.cart-modal-panel', open: 'show', close: '[data-action="close-cart-modal"]:not(.cart-modal-overlay)', backdrop: '.cart-modal-overlay' },
  { name: 'cart-375', route: '/', w: 375, h: 812, touch: true, trigger: '[data-action="open-cart-sidebar"]', host: 'cart-modal', panel: '.cart-modal-panel', open: 'show', close: '[data-action="close-cart-modal"]:not(.cart-modal-overlay)', backdrop: '.cart-modal-overlay' },
  { name: 'search-1440', route: '/', w: 1440, h: 900, trigger: '[data-action="open-search-modal"]', host: 'search-modal', panel: '.search-modal-panel', open: 'show', close: '[data-action="close-search-modal"]:not(.search-modal-overlay)', backdrop: '.search-modal-overlay' },
  { name: 'search-375', route: '/', w: 375, h: 812, touch: true, trigger: '[data-action="open-search-modal"]', host: 'search-modal', panel: '.search-modal-panel', open: 'show', close: '[data-action="close-search-modal"]:not(.search-modal-overlay)', backdrop: '.search-modal-overlay' },
  { name: 'mobile-menu-375', route: '/', w: 375, h: 812, touch: true, trigger: '[data-action="open-mobile-menu"]', host: 'mobile-menu', panel: '.mobile-menu__drawer', open: 'show', close: '[data-action="close-mobile-menu"]:not(.mobile-menu__overlay)', backdrop: '.mobile-menu__overlay' },
  { name: 'mobile-menu-768', route: '/', w: 768, h: 1024, touch: true, trigger: '[data-action="open-mobile-menu"]', host: 'mobile-menu', panel: '.mobile-menu__drawer', open: 'show', close: '[data-action="close-mobile-menu"]:not(.mobile-menu__overlay)', backdrop: '.mobile-menu__overlay' },
  { name: 'quickview-1440', route: '/collections/all', w: 1440, h: 900, trigger: '[data-action="open-quickview"]', host: 'quickview-modal', panel: '.quickview-modal-panel', open: 'notHidden', close: '[data-action="close-quickview"]:not(.quickview-modal-overlay)', backdrop: '.quickview-modal-overlay', pre: async (p) => { await p.locator('.product-card__media').first().hover(); await p.locator('.product-card__wrapper a[href]').first().focus(); await p.waitForTimeout(400); }, wait: 2500 },
  { name: 'filter-375', route: '/collections/all', w: 375, h: 812, touch: true, trigger: '[data-action="open-filter"]', host: '#CollectionFilterDrawer', panel: '#CollectionFilterDrawer', open: 'isOpen', close: '#CollectionFilterDrawer [data-action="close-filter"]', backdrop: '.collection-template__filter-overlay' },
  { name: 'pickup-1440', route: PDP, w: 1440, h: 900, trigger: '#ShowPickupAvailabilityDrawer', host: 'pickup-availability-drawer', panel: 'pickup-availability-drawer', open: 'openAttr', close: '.pickup-availability-drawer-button', backdrop: 'body-outside', wait: 1500, dataDependent: 'a location with local pickup enabled' },
  { name: 'pickup-375', route: PDP, w: 375, h: 812, touch: true, trigger: '#ShowPickupAvailabilityDrawer', host: 'pickup-availability-drawer', panel: 'pickup-availability-drawer', open: 'openAttr', close: '.pickup-availability-drawer-button', backdrop: 'body-outside', wait: 1500, dataDependent: 'a location with local pickup enabled' },
  { name: 'size-guide-1440', route: PDP, w: 1440, h: 900, apiOpen: 'size-guide-modal', host: 'size-guide-modal', panel: '.size-guide-modal-panel', open: 'notHidden', close: '.size-guide-modal-close', backdrop: '.size-guide-modal-overlay' },
  { name: 'lightbox-1440', route: PDP, w: 1440, h: 900, trigger: '[data-lightbox-open]', host: 'product-lightbox', panel: '.lightbox-content', open: 'isActive', close: '.lightbox-close', backdrop: '.lightbox-overlay' },
  { name: 'newsletter-1440', route: '/', w: 1440, h: 900, inject: NEWSLETTER_FIXTURE, apiOpen: 'newsletter-modal', apiMethod: 'showPopup', host: '#newsletter-popup', panel: '.newsletter-popup-wrapper', open: 'active', close: '[data-action="close-newsletter-popup"]', backdrop: null },
  { name: 'newsletter-375', route: '/', w: 375, h: 812, touch: true, inject: NEWSLETTER_FIXTURE, apiOpen: 'newsletter-modal', apiMethod: 'showPopup', host: '#newsletter-popup', panel: '.newsletter-popup-wrapper', open: 'active', close: '[data-action="close-newsletter-popup"]', backdrop: null },
  { name: 'address-modal-1440', route: '/', w: 1440, h: 900, inject: ADDRESS_FIXTURE, apiOpen: '#addresses-new-modal', apiFocus: '#acc-new', host: '#addresses-new-modal', panel: '#addresses-new-modal .address-modal-panel', open: 'show', close: '[data-action="close-address-modal"]:not(.address-modal-overlay)', backdrop: '.address-modal-overlay' },
  { name: 'address-modal-375', route: '/', w: 375, h: 812, touch: true, inject: ADDRESS_FIXTURE, apiOpen: '#addresses-new-modal', apiFocus: '#acc-new', host: '#addresses-new-modal', panel: '#addresses-new-modal .address-modal-panel', open: 'show', close: '[data-action="close-address-modal"]:not(.address-modal-overlay)', backdrop: '.address-modal-overlay' },
  { name: 'lightbox-375', route: PDP, w: 375, h: 812, touch: true, trigger: '[data-lightbox-open]', host: 'product-lightbox', panel: '.lightbox-content', open: 'isActive', close: '.lightbox-close', backdrop: '.lightbox-overlay' },
];

async function newPage(browser, o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, ...(o.touch ? { isMobile: true, hasTouch: true } : {}) });
  if (!o.keepNewsletter) await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
  const m = MUTATIONS[MUTATE];
  if (MUTATE && !m) throw new Error(`unknown OC_MUTATE ${MUTATE}; known: ${Object.keys(MUTATIONS).join(', ')}`);
  if (m) await ctx.route((u) => m.url.test(u.pathname), async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    const out = m.edit(body);
    if (out !== body) mutationHits++;
    await route.fulfill({ response: res, body: out });
  });
  if (o.inject) await routeFixture(ctx, o);
  const page = await ctx.newPage();
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) console.log(`[NAV] ${o.name} ${f.url()}`); });
  page.on('requestfailed', (r) => { if (r.isNavigationRequest() && r.frame() === page.mainFrame()) console.log(`[NAVFAIL] ${o.name} ${r.url()} ${r.failure() && r.failure().errorText}`); });
  page.on('response', (r) => { if (r.request().isNavigationRequest() && r.frame() === page.mainFrame() && r.status() >= 400) console.log(`[NAVSTATUS] ${o.name} ${r.status()} ${r.url()}`); });
  return { ctx, page, log: attachLogs(page) };
}

async function fixtureHtml(f) {
  const parts = [];
  if (f.snippet) parts.push(await renderSnippet(f.snippet, { settings: f.settings }));
  for (const [file, start, end] of f.segments || []) parts.push(await renderSegment(file, start, end));
  let out = parts.join('\n').replace(/<(link|script)\b[^>]*>(<\/script>)?/g, '');
  for (const [from, to] of f.patch || []) {
    if (!out.includes(from)) throw new Error(`fixture patch target ${from} is gone from the rendered markup`);
    out = out.replace(from, to);
  }
  return out;
}

async function routeFixture(ctx, o) {
  const f = o.inject;
  const html = await fixtureHtml(f);
  const wantPath = o.route.split('?')[0];
  await ctx.route((u) => u.pathname === wantPath, async (route) => {
    const req = route.request();
    if (req.resourceType() !== 'document') return route.fallback();
    const res = await route.fetch();
    let body = await res.text();
    const m = body.match(/(?:href|src)="([^"]*\/assets\/)[^"\/?]+\.(?:css|js)(\?[^"]*)?"/);
    if (!m || !body.includes('</body>')) return route.fulfill({ response: res, body });
    const tag = (n) => (n.endsWith('.css') ? `<link rel="stylesheet" href="${m[1]}${n}${m[2] || ''}">` : `<script src="${m[1]}${n}${m[2] || ''}" defer></script>`);
    body = body.replace('</head>', f.assets.filter((n) => n.endsWith('.css')).map(tag).join('') + '</head>');
    body = body.replace('</body>', html + f.assets.filter((n) => n.endsWith('.js')).map(tag).join('') + '</body>');
    await route.fulfill({ response: res, body });
  });
}

async function snapshot(page, o) {
  return page.evaluate(({ o, FOCUSABLE, openKey }) => {
    const openFn = (h) => ({ show: h.classList.contains('show'), notHidden: !h.classList.contains('hidden'), isOpen: h.classList.contains('is-open'), isActive: h.classList.contains('is-active'), active: h.classList.contains('active'), openAttr: h.hasAttribute('open') })[openKey];
    const h = document.querySelector(o.host);
    if (!h) return { missing: true };
    const p = document.querySelector(o.panel) || h;
    const r = p.getBoundingClientRect();
    const ae = document.activeElement;
    const visible = (el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && el.getBoundingClientRect().width > 0;
    const leaks = [...h.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[inert]') && visible(el)).length;
    const hiddenFocusable = [...document.querySelectorAll('[aria-hidden="true"]')].filter((a) => h.contains(a) || a.contains(h))
      .flatMap((a) => [...a.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[inert]') && visible(el))).length;
    const dialog = [h, p, ...h.querySelectorAll('[role="dialog"]')].find((el) => el && el.getAttribute('role') === 'dialog') || null;
    let name = null;
    if (dialog) {
      const lb = dialog.getAttribute('aria-labelledby');
      name = dialog.getAttribute('aria-label') || (lb ? lb.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim() : '') || null;
    }
    const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = Math.min(Math.max(r.top + Math.min(r.height, innerHeight) / 2, 1), innerHeight - 1);
    const top = document.elementFromPoint(cx, cy);
    const main = document.querySelector('main');
    const mr = main ? main.getBoundingClientRect() : { left: 0, width: 0 };
    const hcs = getComputedStyle(document.documentElement), bcs = getComputedStyle(document.body);
    const panelText = [], foreignFont = [];
    const fam = (el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    const tok = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    const famSet = new Set(['--font-body-family', '--font-heading-family', '--font-subheading-family'].map(tok).filter(Boolean));
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || !visible(n.parentElement)) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      const b = rg.getBoundingClientRect();
      const pr = n.parentElement.getBoundingClientRect();
      if (pr.width <= 2 || pr.height <= 2) continue;
      if (b.width > 0 && b.height > 0 && b.right > r.left && b.left < r.right) panelText.push(b);
      if (!famSet.has(fam(n.parentElement))) foreignFont.push(`${fam(n.parentElement)} "${n.textContent.trim().slice(0, 20)}"`);
    }
    const edge = panelText.length ? Math.round(Math.min(...panelText.map((b) => Math.min(b.left - r.left, r.right - b.right)))) : null;
    return {
      open: openFn(h), role: dialog ? 'dialog' : h.getAttribute('role'), ariaModal: dialog ? dialog.getAttribute('aria-modal') : null, name,
      rect: { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), vw: innerWidth, vh: innerHeight },
      topmost: !!(top && h.contains(top)), topEl: top ? (top.className || top.tagName).toString().slice(0, 50) : null,
      focusInside: !!(ae && h.contains(ae)), active: ae ? (ae.id || ae.className || ae.tagName).toString().slice(0, 50) : null,
      leaks, hiddenFocusable, scrollY: Math.round(scrollY), mainLeft: Math.round(mr.left), mainWidth: Math.round(mr.width),
      locked: hcs.overflowY === 'hidden' || bcs.overflowY === 'hidden' || hcs.overflow === 'hidden' || bcs.overflow === 'hidden' || document.body.classList.contains('scroll-locked'),
      textEdge: edge, foreignFont,
    };
  }, { o: { host: o.host, panel: o.panel }, FOCUSABLE, openKey: o.open });
}

async function doOpen(page, o, mode) {
  if (o.apiOpen) {
    await page.evaluate(({ s, m, f }) => { if (f) document.querySelector(f).focus({ preventScroll: true }); window.__trig = document.activeElement; document.querySelector(s)[m](); }, { s: o.apiOpen, m: o.apiMethod || 'open', f: o.apiFocus || null });
  } else {
    if (o.pre) await o.pre(page);
    const trig = page.locator(o.trigger).filter({ visible: true }).first();
    await trig.evaluate((el) => { window.__trig = el; });
    if (mode === 'key') { await trig.focus(); await page.keyboard.press('Enter'); } else await trig.click();
  }
  await page.waitForTimeout(o.wait || 900);
}

async function trigFocused(page, o) {
  return page.evaluate(() => !!window.__trig && (document.activeElement === window.__trig || window.__trig.contains(document.activeElement)));
}

async function closeButtonInfo(page, o) {
  return page.evaluate(({ host, close }) => {
    const h = document.querySelector(host);
    const b = h && [...h.querySelectorAll(close)].find((el) => el.checkVisibility({ visibilityProperty: true }) && el.getBoundingClientRect().width > 0);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), name: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40), x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, { host: o.host, close: o.close });
}

async function outsidePoint(page, o) {
  return page.evaluate(({ panel, host }) => {
    const p = document.querySelector(panel) || document.querySelector(host);
    const r = p.getBoundingClientRect();
    const cands = [[8, innerHeight / 2], [innerWidth - 8, innerHeight / 2], [innerWidth / 2, innerHeight - 8], [innerWidth / 2, 8]];
    const c = cands.find(([x, y]) => x < r.left || x > r.right || y < r.top || y > r.bottom);
    return c ? { x: c[0], y: c[1] } : null;
  }, { panel: o.panel, host: o.host });
}

async function run(browser, o) {
  const J = `overlay:${o.name}`;
  const { ctx, page, log } = await newPage(browser, o);
  try {
    await gotoStore(page, o.route);
    await page.waitForTimeout(1500);
    if (o.pre) await o.pre(page);
    if (!o.apiOpen) {
      const trig = page.locator(o.trigger).filter({ visible: true }).first();
      if (!(await trig.count())) { rec(J, 'trigger rendered', o.dataDependent ? null : false, `${o.trigger} not visible at ${o.w}${o.dataDependent ? ` (needs store data: ${o.dataDependent})` : ''}`); return; }
      const t = await trig.evaluate((el) => ({ tag: el.tagName, focusable: el.tabIndex >= 0, name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('alt') || '').trim().slice(0, 40), haspopup: el.getAttribute('aria-haspopup'), expanded: el.getAttribute('aria-expanded'), controls: el.getAttribute('aria-controls') }));
      rec(J, 'trigger is keyboard focusable with a name', t.focusable && !!t.name, t);
    } else rec(J, o.inject ? 'fixture served inside the real document from the theme markup (not rendered with current settings or outside a signed-in page)' : 'opened through element API (no trigger rendered with current settings)', null, o.apiOpen);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    if (!o.apiOpen) {
      if (o.pre) await o.pre(page);
      await page.locator(o.trigger).filter({ visible: true }).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }
    const rest = await snapshot(page, o);
    if (rest.missing) { rec(J, 'host rendered', false, o.host); return; }
    rec(J, 'closed at rest: hidden and nothing focusable', !rest.open && rest.leaks === 0, { open: rest.open, leaks: rest.leaks });

    let mode = 'key';
    await doOpen(page, o, 'key');
    let st = await snapshot(page, o);
    if (!o.apiOpen) rec(J, 'opens from keyboard (Enter on trigger)', st.open, { open: st.open, active: st.active });
    if (!st.open) { mode = 'click'; await doOpen(page, o, 'click'); st = await snapshot(page, o); rec(J, 'opens on click', st.open, { open: st.open }); }
    if (!st.open) return;

    rec(J, 'dialog semantics: role=dialog + aria-modal + name', st.role === 'dialog' && st.ariaModal === 'true' && !!st.name, { role: st.role, ariaModal: st.ariaModal, name: st.name });
    rec(J, 'focus moves inside', st.focusInside, st.active);
    rec(J, 'panel is topmost layer', st.topmost, st.topEl);
    const r = st.rect;
    rec(J, 'panel fits viewport horizontally', r.l >= -1 && r.r <= r.vw + 1, r);
    rec(J, 'panel top inside viewport', r.t >= -1 && r.t < r.vh, r);
    rec(J, 'page scroll locked', st.locked, { scrollY: st.scrollY });
    rec(J, 'no layout shift of page behind', Math.abs(st.mainLeft - rest.mainLeft) <= 1 && Math.abs(st.mainWidth - rest.mainWidth) <= 1, { before: [rest.mainLeft, rest.mainWidth], after: [st.mainLeft, st.mainWidth] });
    rec(J, 'scroll position kept while open', Math.abs(st.scrollY - rest.scrollY) <= 2, { before: rest.scrollY, open: st.scrollY });
    rec(J, 'nothing focusable under aria-hidden', st.hiddenFocusable === 0, st.hiddenFocusable);
    rec(J, 'text keeps >= 12px from panel edges', st.textEdge === null || st.textEdge >= 12, st.textEdge);
    rec(J, 'panel text uses a theme font family: body, heading or subheading token (slotted content included)', st.foreignFont.length === 0, st.foreignFont.slice(0, 5));

    const out = await outsidePoint(page, o);
    if (out) {
      await page.mouse.move(out.x, out.y);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(400);
      const y = await page.evaluate(() => Math.round(scrollY));
      rec(J, 'wheel outside panel does not scroll page', Math.abs(y - st.scrollY) <= 2, { before: st.scrollY, after: y });
    }

    const trap = [];
    for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); trap.push(await page.evaluate((s) => document.querySelector(s).contains(document.activeElement), o.host)); }
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Shift+Tab'); trap.push(await page.evaluate((s) => document.querySelector(s).contains(document.activeElement), o.host)); }
    rec(J, 'Tab x20 + Shift+Tab x6 stay inside', trap.every(Boolean), trap.map(Number).join(''));

    const cb = await closeButtonInfo(page, o);
    rec(J, 'close button named and >= 24x24', !!cb && !!cb.name && cb.w >= 24 && cb.h >= 24, cb);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    let af = await snapshot(page, o);
    rec(J, 'Escape closes', !af.open, { open: af.open });
    rec(J, 'Escape: focus returns to trigger', await trigFocused(page, o), af.active);
    rec(J, 'closed: scroll unlocked and position restored', !af.locked && Math.abs(af.scrollY - rest.scrollY) <= 2, { locked: af.locked, scrollY: af.scrollY, was: rest.scrollY });
    rec(J, 'closed: nothing focusable inside', af.leaks === 0, af.leaks);

    if (af.open) { await page.reload(); await page.waitForTimeout(1500); if (o.pre) await o.pre(page); }
    if (cb) {
      await doOpen(page, o, mode);
      const c2 = await closeButtonInfo(page, o);
      if (c2) await page.mouse.click(c2.x, c2.y);
      await page.waitForTimeout(900);
      af = await snapshot(page, o);
      rec(J, 'close button closes', !af.open, { open: af.open });
      rec(J, 'close button: focus returns to trigger', await trigFocused(page, o), af.active);
    }

    await doOpen(page, o, mode);
    const op = await snapshot(page, o);
    if (!op.open) rec(J, 'reopens after close', false, op);
    else if (o.backdrop === 'body-outside' || o.backdrop) {
      const pt = await outsidePoint(page, o);
      if (pt) {
        await page.mouse.click(pt.x, pt.y);
        await page.waitForTimeout(900);
        af = await snapshot(page, o);
        rec(J, 'click outside panel closes', !af.open, { at: pt, open: af.open });
      } else rec(J, 'click outside panel closes', null, 'panel covers viewport');
    }

    for (let i = 0; i < 2; i++) {
      if ((await snapshot(page, o)).open) { await page.keyboard.press('Escape'); await page.waitForTimeout(700); }
      await doOpen(page, o, mode);
      const s = await snapshot(page, o);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(700);
      const c = await snapshot(page, o);
      if (i === 1) rec(J, 'third open/close cycle still works', s.open && !c.open && !c.locked, { open: s.open, closed: !c.open, locked: c.locked });
    }
    const errs = log.pageErrors.concat(log.console.filter((m) => !/monorail|shop\.app|shopify-account|customer-account-main-menu|HotReload|frame-ancestors|web-pixels|shopifycloud|\/api\/(unstable|20\d\d-\d\d)\/graphql|\/favicon\.ico/i.test(m.text + m.url) && !/^chrome-error:\/\/chromewebdata/.test(m.url || '')));
    rec(J, 'no page errors during cycles', errs.length === 0, errs.slice(0, 3));
  } catch (e) {
    rec(J, 'ran', false, e.message.split('\n')[0]);
  } finally { await ctx.close(); }
}

async function newsletterAuto(browser, w) {
  const o = { name: `newsletter-auto-${w}`, route: '/', w, h: w < 768 ? 812 : 900, touch: w < 768, keepNewsletter: true, inject: NEWSLETTER_FIXTURE };
  const J = `overlay:${o.name}`;
  const { ctx, page } = await newPage(browser, o);
  const inside = () => page.evaluate(() => document.querySelector('#newsletter-popup').contains(document.activeElement));
  try {
    await gotoStore(page, o.route);
    const opened = await page.waitForFunction(() => document.querySelector('#newsletter-popup.active'), null, { timeout: 8000 }).then(() => true).catch(() => false);
    rec(J, 'popup opens by itself after its delay when it was never closed', opened, null);
    if (!opened) return;
    await page.waitForTimeout(900);
    rec(J, 'timed open moves focus into the dialog', await inside(), await page.evaluate(() => (document.activeElement.id || document.activeElement.className || document.activeElement.tagName).toString().slice(0, 50)));
    const trap = [];
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); trap.push(await inside()); }
    rec(J, 'Tab x12 stay inside the timed popup', trap.every(Boolean), trap.map(Number).join(''));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    const closed = await page.evaluate(() => ({ active: document.querySelector('#newsletter-popup').classList.contains('active'), remembered: localStorage.getItem('newsletter_popup_closed'), locked: document.body.classList.contains('scroll-locked') || getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden' }));
    rec(J, 'Escape closes the timed popup, unlocks scroll and remembers the choice', !closed.active && !closed.locked && closed.remembered === 'true', closed);

    await page.evaluate(() => document.querySelector('newsletter-modal').showPopup());
    await page.waitForTimeout(900);
    const posts = [];
    await page.route(/\/contact/, (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      posts.push(route.request().postData() || '');
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title>' });
    });
    const expectMsg = await page.evaluate(() => document.querySelector('newsletter-modal').dataset.msgEmail);
    const localeMsg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'locales/en.default.json'), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, '')).newsletter.error_email;
    rec(J, 'popup error message comes from the locale string', expectMsg === localeMsg, { expectMsg, localeMsg });
    await page.fill('#newsletter-popup input[name="contact[email]"]', 'a@b');
    await page.press('#newsletter-popup input[name="contact[email]"]', 'Enter');
    await page.waitForTimeout(600);
    const toast = await page.evaluate(() => [...document.querySelectorAll('.toast-message')].map((e) => e.textContent.trim()));
    rec(J, 'invalid email is blocked client-side with the locale error toast and no POST', posts.length === 0 && toast.includes(localeMsg), { posts: posts.length, toast });
    await page.evaluate(() => { document.querySelector('#NewsletterPopupForm').addEventListener('submit', (e) => { window.__fields = [...new FormData(e.target)].filter(([k]) => typeof k === 'string').map(([k, v]) => k + '=' + v); }, true); });
    await page.waitForFunction(() => !document.querySelector('.toast-message'), null, { timeout: 8000 }).catch(() => null);
    await page.fill('#newsletter-popup input[name="contact[email]"]', 'qa@example.com');
    await page.press('#newsletter-popup input[name="contact[email]"]', 'Enter');
    await page.waitForTimeout(600);
    const sent = await page.evaluate(() => ({ fields: window.__fields || [], toasts: [...document.querySelectorAll('.toast-message')].map((e) => e.textContent.trim()) })).catch(() => ({ fields: [], toasts: [] }));
    rec(J, 'valid email passes the theme validator and submits the customer form with the newsletter tag', sent.toasts.length === 0 && sent.fields.includes('contact[email]=qa@example.com') && sent.fields.includes('contact[tags]=newsletter') && sent.fields.includes('form_type=customer'), sent);
  } catch (e) {
    rec(J, 'ran', false, e.message.split('\n')[0]);
  } finally { await ctx.close(); }
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const only = (process.env.OC_ONLY || '').split(',').filter(Boolean);
  try {
    for (const o of OVERLAYS) if (!only.length || only.includes(o.name)) await run(browser, o);
    for (const w of [1440, 375]) if (!only.length || only.includes(`newsletter-auto-${w}`)) await newsletterAuto(browser, w);
  } finally { await browser.close(); }
  ensureDir(path.dirname(OUT));
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  const c = { PASS: 0, FAIL: 0, INFO: 0 };
  results.forEach((r) => c[r.ok === null ? 'INFO' : r.ok ? 'PASS' : 'FAIL']++);
  console.log('SUMMARY', JSON.stringify(c));
  process.exit(c.FAIL ? 1 : 0);
})().catch((e) => { console.error('ERR', e.stack); process.exit(2); });
