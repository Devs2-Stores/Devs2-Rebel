const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');
const { ROOT, BASE, attachLogs, gotoStore, settle, recorder, ensureDir } = require('./lib.cjs');

const OUT = ensureDir(path.resolve(ROOT, process.env.E2E_OUT || path.join(os.tmpdir(), 'e2e-journeys'), 'journeys'));
const { results, rec } = recorder();
const PDP = '/products/rebel-tactical-bomber-jacket';
const ARTICLE = '/blogs/news/leather-care-101';
const MUTATE = process.env.E2E_MUTATE || '';

const shown = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return false;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && r.width > 0 && r.height > 0;
}, sel);
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a) return null;
  return { tag: a.tagName.toLowerCase(), cls: typeof a.className === 'string' ? a.className.slice(0, 80) : '', href: a.getAttribute('href'), id: a.id, inside: (sel) => null };
});
const activeWithin = (page, sel) => page.evaluate((s) => { const c = document.querySelector(s); return !!(c && document.activeElement && c.contains(document.activeElement)); }, sel);
const cartCount = (page) => page.evaluate(() => { const c = [...document.querySelectorAll('.cart-count')].find((e) => e.offsetParent !== null) || document.querySelector('.cart-count'); return c ? Number(c.textContent.trim() || 0) : null; });
const parseMoney = (t) => Number(String(t).replace(/[^0-9.]/g, ''));
const norm = (t) => String(t == null ? '' : t).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const expectMoney = (cents, fmt) => {
  const n = Math.round(Number(cents));
  const group = (v, sep) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const whole = Math.trunc(n / 100), frac = String(n % 100).padStart(2, '0'), rounded = Math.round(n / 100);
  const values = {
    amount: group(whole, ',') + '.' + frac,
    amount_no_decimals: group(rounded, ','),
    amount_with_comma_separator: group(whole, '.') + ',' + frac,
    amount_no_decimals_with_comma_separator: group(rounded, '.'),
    amount_with_apostrophe_separator: group(whole, "'") + '.' + frac,
  };
  return norm(fmt).replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) => values[k]);
};
const priceFormat = (page) => page.evaluate(() => themeConfig.priceFormat);
const productJson = (page, handle) => page.evaluate(async (h) => (await fetch('/products/' + h + '.js')).json(), handle);
const cartJson = (page) => page.evaluate(async () => (await fetch('/cart.js')).json());

const J = {};

J.skipLinkAndFocusRing = async (page) => {
  const j = 'keyboard-1440';
  await gotoStore(page, '/');
  await page.keyboard.press('Tab');
  const a = await active(page);
  rec(j, 'first Tab lands on skip link', a && a.href === '#MainContent', a);
  const box = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; });
  rec(j, 'skip link visible when focused (>=24x24 in viewport)', box.w >= 24 && box.h >= 24 && box.top >= 0, box);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const hash = await page.evaluate(() => location.hash);
  rec(j, 'Enter on skip link targets #MainContent', hash === '#MainContent', hash);
  await gotoStore(page, '/');
  const missing = [];
  const seen = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      let el = document.activeElement;
      if (!el || el === document.body) return null;
      while (el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
      const cs = getComputedStyle(el);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
      const r = el.getBoundingClientRect();
      return { el: el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''), ring, visible: r.width > 0 && r.height > 0, text: (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 25) };
    });
    if (!f) continue;
    seen.push(f.el);
    if (!f.ring || !f.visible) missing.push(f);
  }
  rec(j, 'first 25 Tab stops show a focus indicator and are visible', missing.length === 0, { stops: seen.length, missing });
};

J.megamenuDesktop = async (page) => {
  const j = 'megamenu-1440';
  await gotoStore(page, '/');
  const item = page.locator('.megamenu__item:has(> .megamenu__dropdown)').first();
  const n = await page.locator('.megamenu__item:has(> .megamenu__dropdown)').count();
  rec(j, 'header has items with dropdowns', n > 0, { n });
  if (!n) return;
  await item.hover();
  await page.waitForTimeout(450);
  const st = await item.evaluate((el) => { const d = el.querySelector(':scope > .megamenu__dropdown'); const cs = getComputedStyle(d); const r = d.getBoundingClientRect(); return { vis: cs.visibility, op: cs.opacity, ariaHidden: d.getAttribute('aria-hidden'), right: Math.round(r.right), vw: innerWidth, links: d.querySelectorAll('a').length }; });
  rec(j, 'hover opens dropdown', st.vis === 'visible' && Number(st.op) > 0.9, st);
  rec(j, 'open dropdown inside viewport', st.right <= st.vw, st);
  rec(j, 'open dropdown not aria-hidden="true"', st.ariaHidden !== 'true', st);
  await page.mouse.move(5, 600);
  await page.waitForTimeout(450);
  const trig = item.locator(':scope > a, :scope > button, :scope > .megamenu__trigger').first();
  await trig.focus();
  await page.waitForTimeout(450);
  const kb = await item.evaluate((el) => { const d = el.querySelector(':scope > .megamenu__dropdown'); const t = el.querySelector(':scope > .megamenu__trigger, :scope > a, :scope > button'); return { vis: getComputedStyle(d).visibility, expanded: t && t.getAttribute('aria-expanded'), trigTag: t && t.tagName }; });
  rec(j, 'keyboard focus opens dropdown (focus-within)', kb.vis === 'visible', kb);
  rec(j, 'trigger exposes aria-expanded', kb.expanded !== null, kb);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  const esc = await item.evaluate((el) => getComputedStyle(el.querySelector(':scope > .megamenu__dropdown')).visibility);
  rec(j, 'Escape closes dropdown', esc === 'hidden', { vis: esc });
};

J.mobileMenu = async (page) => {
  const j = 'mobile-menu-375';
  await gotoStore(page, '/');
  const burger = page.locator('.header__hamburger');
  rec(j, 'hamburger visible', await burger.isVisible(), null);
  await burger.click();
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => { const m = document.querySelector('mobile-menu'); return m && { show: m.classList.contains('show'), ariaHidden: m.getAttribute('aria-hidden'), focusInside: m.contains(document.activeElement), bodyLocked: getComputedStyle(document.body).overflow === 'hidden' || document.documentElement.style.overflow === 'hidden' || document.body.style.position === 'fixed' }; });
  rec(j, 'menu opens with aria-hidden=false', st && st.show && st.ariaHidden === 'false', st);
  rec(j, 'focus moved into menu', st && st.focusInside, st);
  const trig = page.locator('mobile-menu .mobile-menu__trigger').first();
  if (await trig.count()) {
    await trig.click();
    await page.waitForTimeout(400);
    const sub = await trig.evaluate((t) => { const id = t.getAttribute('aria-controls'); const s = document.getElementById(id); return { expanded: t.getAttribute('aria-expanded'), subOpen: !!(s && s.classList.contains('is-open')), subExists: !!s }; });
    rec(j, 'submenu trigger toggles aria-expanded + panel', sub.expanded === 'true' && sub.subOpen, sub);
  } else rec(j, 'submenu trigger present', null, 'no nested links in main menu');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => { const m = document.querySelector('mobile-menu'); return { show: m.classList.contains('show'), ariaHidden: m.getAttribute('aria-hidden'), focus: document.activeElement && (document.activeElement.className || document.activeElement.tagName) }; });
  rec(j, 'Escape closes menu', !closed.show && closed.ariaHidden === 'true', closed);
  rec(j, 'focus returns to hamburger', /header__hamburger/.test(String(closed.focus)), closed);
};

async function searchJourney(page, vp) {
  const j = `search-${vp}`;
  await gotoStore(page, '/');
  const btn = page.locator('[data-action="open-search-modal"]:visible').first();
  await btn.click();
  await page.waitForTimeout(400);
  rec(j, 'modal opens', await page.evaluate(() => document.querySelector('search-modal').classList.contains('show')), null);
  rec(j, 'input focused', await page.evaluate(() => document.activeElement && document.activeElement.id === 'search-modal-input'), null);
  await page.keyboard.type('leather', { delay: 40 });
  let pred = null;
  try {
    await page.waitForFunction(() => { const r = document.getElementById('predictive-search-results'); return r && r.querySelectorAll('a[href]').length > 0 && r.querySelectorAll('[role=tab]').length > 0; }, null, { timeout: 15000 });
    pred = await page.evaluate(() => {
      const root = document.getElementById('predictive-search-results');
      const input = document.getElementById('search-modal-input');
      const tabs = [...root.querySelectorAll('[role=tab]')];
      const cards = [...root.querySelectorAll('[data-search-group]:not([data-search-group=suggestions]) a[href]')].length;
      const viewAll = [...root.querySelectorAll('a[href]')].filter((a) => !a.closest('[data-search-group]')).map((a) => a.textContent.replace(/\s+/g, ' ').trim());
      const modal = document.querySelector('search-modal');
      return {
        links: root.querySelectorAll('a[href]').length,
        inputControlsResolves: !!document.getElementById(input.getAttribute('aria-controls')),
        tabs: tabs.map((t) => ({ id: t.id, selected: t.getAttribute('aria-selected'), tabindex: t.tabIndex, controls: t.getAttribute('aria-controls'), panel: (() => { const p = document.getElementById(t.getAttribute('aria-controls')); return p ? { role: p.getAttribute('role'), labelledby: p.getAttribute('aria-labelledby'), hidden: p.hidden } : null; })() })),
        tablist: !!root.querySelector('[role=tablist][aria-label]'),
        inputRole: input.getAttribute('role'), inputExpanded: input.getAttribute('aria-expanded'),
        stray: modal.querySelectorAll('[role=listbox], [role=option], [role=combobox]').length,
        cards, viewAll,
      };
    });
  } catch (e) { pred = { timeout: true }; }
  rec(j, 'predictive results render links', pred && pred.links > 0, pred);
  rec(j, 'aria-controls target exists with results', pred && pred.inputControlsResolves === true, pred);
  rec(j, 'multi-group query builds at least two result tabs inside a tablist', !!pred && !pred.timeout && pred.tabs.length >= 2 && pred.tablist, pred);
  if (pred && !pred.timeout) {
    rec(j, 'exactly one result tab is aria-selected and is the only tab stop', pred.tabs.filter((t) => t.selected === 'true').length === 1 && pred.tabs.filter((t) => t.tabindex === 0).length === 1, pred.tabs);
    rec(j, 'every tab aria-controls resolves to a tabpanel labelled by that tab', pred.tabs.length > 0 && pred.tabs.every((t) => t.panel && t.panel.role === 'tabpanel' && t.panel.labelledby === t.id), pred.tabs);
    rec(j, 'only the selected tab panel is shown', pred.tabs.every((t) => t.panel && t.panel.hidden === (t.selected !== 'true')), pred.tabs);
    rec(j, 'input has no combobox role or aria-expanded and no listbox/option/combobox in the modal', pred.inputRole === null && pred.inputExpanded === null && pred.stray === 0, { role: pred.inputRole, expanded: pred.inputExpanded, stray: pred.stray });
    const total = pred.viewAll.map((t) => (t.match(/\d+/) || [])[0]).find(Boolean);
    rec(j, 'view-all count equals the rendered result cards', Number(total) === pred.cards, { viewAll: pred.viewAll, cards: pred.cards });
    const tabLoc = page.locator('#predictive-search-results [role=tab]');
    await tabLoc.first().focus();
    const sel = () => page.evaluate(() => [...document.querySelectorAll('#predictive-search-results [role=tab]')].map((t) => t.getAttribute('aria-selected') === 'true'));
    const n = pred.tabs.length;
    await page.keyboard.press('ArrowRight');
    const afterRight = await sel();
    await page.keyboard.press('End');
    const afterEnd = await sel();
    await page.keyboard.press('Home');
    const afterHome = await sel();
    const focusOnSelected = await page.evaluate(() => document.activeElement.getAttribute('role') === 'tab' && document.activeElement.getAttribute('aria-selected') === 'true');
    rec(j, 'ArrowRight, End and Home move tab selection and focus', afterRight[1] === true && afterEnd[n - 1] === true && afterHome[0] === true && focusOnSelected, { afterRight, afterEnd, afterHome, focusOnSelected });
    await page.locator('#search-modal-input').focus();
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => ({ show: document.querySelector('search-modal').classList.contains('show'), focus: document.activeElement && document.activeElement.getAttribute('data-action') }));
  rec(j, 'Escape closes modal', !closed.show, closed);
  rec(j, 'focus returns to search trigger', closed.focus === 'open-search-modal', closed);
  await btn.click();
  await page.waitForTimeout(400);
  await page.fill('#search-modal-input', 'jacket');
  await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => null), page.press('#search-modal-input', 'Enter')]);
  const res = await page.evaluate(() => ({ url: location.pathname + location.search, cards: document.querySelectorAll('.search-template__results .product-card').length, tabs: [...document.querySelectorAll('.search-template__tab')].map((t) => ({ sel: t.getAttribute('aria-selected'), dis: t.disabled, id: t.id })) }));
  rec(j, 'Enter submits to /search with product results', /^\/search\?/.test(res.url) && /q=jacket/.test(res.url) && res.cards > 0, res);
  if (vp === 1440) {
    rec(j, 'exactly one search tab aria-selected=true', res.tabs.filter((t) => t.sel === 'true').length === 1, res.tabs);
    const lbl = await page.evaluate(() => [...document.querySelectorAll('[role=tabpanel][aria-labelledby]')].map((p) => ({ panel: p.id, labelledby: p.getAttribute('aria-labelledby'), resolves: !!document.getElementById(p.getAttribute('aria-labelledby')) })));
    rec(j, 'tabpanel aria-labelledby resolves to a tab id', lbl.length > 0 && lbl.every((x) => x.resolves), lbl);
    const enabled = page.locator('.search-template__tab:not([disabled])');
    if ((await enabled.count()) > 1) {
      await enabled.nth(1).click();
      await page.waitForTimeout(300);
      const sw = await page.evaluate(() => [...document.querySelectorAll('.search-template__tab')].map((t) => t.getAttribute('aria-selected')));
      rec(j, 'clicking second tab moves aria-selected', sw.filter((x) => x === 'true').length === 1, sw);
    }
  }
}
J.search1440 = (page) => searchJourney(page, 1440);
J.search375 = (page) => searchJourney(page, 375);

J.plpSortFilter = async (page) => {
  const j = 'plp-1440';
  await gotoStore(page, '/collections/all');
  const n0 = await page.locator('facet-filters .product-card').count();
  rec(j, 'collection renders product cards', n0 > 0, { n0 });
  const sel = page.locator('facet-filters select[name="sort_by"]').locator('visible=true').first();
  const opts = await sel.evaluate((s) => [...s.options].map((o) => o.value));
  rec(j, 'sort menu offers price-ascending', opts.includes('price-ascending'), opts);
  const target = opts.includes('price-ascending') ? 'price-ascending' : opts[1];
  await sel.selectOption(target);
  await page.waitForFunction((t) => location.search.includes('sort_by=' + t) && !document.querySelector('facet-filters').classList.contains('is-loading'), target, { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => ({ url: location.search, prices: [...document.querySelectorAll('facet-filters .product-card .product-card__price')].map((p) => { const v = p.querySelector('.product-card__price-sale, .product-card__price-range'); return v ? v.textContent.trim() : null; }).filter(Boolean), selectValue: [...document.querySelectorAll('facet-filters select[name="sort_by"]')].find((e) => e.getClientRects().length).value }));
  const nums = s.prices.map((t) => parseMoney(t.split('–')[0]));
  const asc = nums.every((v, i) => i === 0 || v >= nums[i - 1]);
  rec(j, 'sort change updates URL without reload', s.url.includes('sort_by=' + target), s.url);
  rec(j, 'sorted grid is price-ascending over at least 3 priced cards', target === 'price-ascending' && nums.length >= 3 && asc, nums.slice(0, 12));
  rec(j, 'sort select keeps chosen value after re-render', s.selectValue === target, s.selectValue);
  const cb = page.locator('#FacetFilterForm input[type="checkbox"]:not([data-price-preset]):not([disabled])').first();
  if (!(await cb.count())) { rec(j, 'filter checkbox present', false, 'none'); return; }
  const meta = await cb.evaluate((c) => ({ name: c.name, value: c.value, id: c.id, label: (document.querySelector(`label[for="${c.id}"]`) || c.closest('label') || {}).textContent }));
  if (!(await cb.isVisible())) await page.evaluate((id) => { const l = document.querySelector(`label[for="${id}"]`); (l || document.getElementById(id)).scrollIntoView(); }, meta.id);
  await page.locator(`label[for="${meta.id}"]`).first().click({ trial: false }).catch(async () => { await cb.check({ force: true }); });
  await page.waitForFunction((n) => decodeURIComponent(location.search).includes(n), meta.name, { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(800);
  const f = await page.evaluate(() => ({ url: decodeURIComponent(location.search), chips: [...document.querySelectorAll('facet-filters [data-filter-remove]')].filter((a) => a.offsetParent !== null).map((a) => a.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)), cards: document.querySelectorAll('facet-filters .product-card').length, live: (document.querySelector('#CollectionLiveRegion') || {}).textContent }));
  rec(j, 'checking a filter updates URL', f.url.includes(meta.name), { meta, url: f.url });
  rec(j, 'active filter chip / remove link shown', f.chips.length > 0, f.chips);
  rec(j, 'sort survives filtering', f.url.includes('sort_by=' + target), f.url);
  const chip = page.locator('facet-filters [data-filter-remove]:visible').first();
  if (await chip.count()) {
    await chip.click();
    await page.waitForFunction((n) => !decodeURIComponent(location.search).includes(n), meta.name, { timeout: 20000 }).catch(() => null);
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ url: decodeURIComponent(location.search), cards: document.querySelectorAll('facet-filters .product-card').length }));
    rec(j, 'removing chip clears filter', !r.url.includes(meta.name), r);
  }
  await page.goBack();
  await page.waitForTimeout(1500);
  rec(j, 'browser Back restores previous filter state (popstate)', await page.evaluate((n) => decodeURIComponent(location.search).includes(n), meta.name), await page.evaluate(() => location.search));
};

J.plpMobileFilter = async (page) => {
  const j = 'plp-filter-375';
  await gotoStore(page, '/collections/all');
  const btn = page.locator('[data-action="open-filter"]:visible, [data-action="open-filter-modal"]:visible').first();
  if (!(await btn.count())) { rec(j, 'filter button visible at 375', false, 'none visible'); return; }
  const box = await btn.boundingBox();
  rec(j, 'filter button >= 24x24', box.width >= 24 && box.height >= 24, box);
  await btn.click();
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => { const els = [document.getElementById('CollectionFilterDrawer'), document.querySelector('.collection-filter-modal, [data-filter-modal], #CollectionFilterModal')].filter(Boolean); return els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { id: e.id || e.className.slice(0, 40), open: e.classList.contains('is-open'), vis: cs.visibility, w: Math.round(r.width), left: Math.round(r.left), focusInside: e.contains(document.activeElement), ariaHidden: e.getAttribute('aria-hidden'), role: e.getAttribute('role'), modal: e.getAttribute('aria-modal') }; }); });
  const opened = st.find((s) => s.open);
  rec(j, 'filter panel opens', !!opened, st);
  rec(j, 'opened panel fully on-screen', !!opened && opened.left >= 0 && opened.w <= 375, opened);
  rec(j, 'focus moves into filter panel', !!opened && opened.focusInside, opened);
  rec(j, 'panel exposes dialog semantics', !!opened && (opened.role === 'dialog' || opened.modal === 'true'), opened);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => [document.getElementById('CollectionFilterDrawer'), document.querySelector('.collection-filter-modal, [data-filter-modal], #CollectionFilterModal')].filter(Boolean).map((e) => e.classList.contains('is-open')));
  rec(j, 'Escape closes filter panel', !after.some(Boolean), after);
};

async function openQuickview(page, i) {
  const card = page.locator('facet-filters .product-card').nth(i);
  await card.locator('a[href]').first().focus();
  await card.locator('.product-card__media').first().hover();
  await page.waitForTimeout(400);
  await card.locator('.product-card__quickview').click();
  await page.waitForFunction(() => { const m = document.querySelector('quickview-modal'); return m && !m.classList.contains('hidden') && m.querySelector('[data-product-add]'); }, null, { timeout: 20000 });
  await page.waitForTimeout(500);
}
const quickviewClosed = (page) => page.evaluate(() => document.querySelector('quickview-modal').classList.contains('hidden'));

J.quickview = async (page) => {
  const j = 'quickview-1440';
  await gotoStore(page, '/collections/all');
  await settle(page);
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await gotoStore(page, '/collections/all');
  const kbd = await page.locator('facet-filters .product-card').first().evaluate((el) => {
    const b = el.querySelector('.product-card__quickview');
    const link = el.querySelector('a[href]');
    if (!b || !link) return null;
    link.focus();
    const cs = getComputedStyle(b);
    return { visibility: cs.visibility, opacity: cs.opacity, display: cs.display, focusWithin: el.matches(':focus-within') };
  });
  rec(j, 'quick view button reachable by keyboard when card has focus', !!kbd && kbd.visibility === 'visible' && kbd.display !== 'none', kbd);
  const cards = await page.evaluate(async () => {
    const list = [...document.querySelectorAll('facet-filters .product-card')].slice(0, 12);
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const a = list[i].querySelector('a[href*="/products/"]');
      if (!a || !list[i].querySelector('.product-card__quickview')) continue;
      const handle = new URL(a.href).pathname.split('/products/')[1];
      const p = await (await fetch('/products/' + handle + '.js')).json();
      out.push({ i, handle, buy: p.variants.some((v) => v.available && v.price > 0), contact: p.variants.every((v) => v.price === 0) });
    }
    return out;
  });
  const buy = cards.find((c) => c.buy);
  const contact = cards.find((c) => c.contact);
  rec(j, 'data: a purchasable priced card with a quick view button exists', !!buy, cards.slice(0, 4));
  const closeContract = async (name) => {
    await openQuickview(page, name.i);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({ hidden: document.querySelector('quickview-modal').classList.contains('hidden'), locked: document.body.classList.contains('scroll-locked') || getComputedStyle(document.body).overflow === 'hidden', active: (document.activeElement.className || document.activeElement.tagName).toString().slice(0, 50), inCard: !!document.activeElement.closest('.product-card') }));
    return st;
  };

  if (buy) {
    await openQuickview(page, buy.i);
    const st = await page.evaluate(() => { const m = document.querySelector('quickview-modal'); const p = m.querySelector('.quickview-modal-panel'); return { hidden: m.classList.contains('hidden'), title: (m.querySelector('h1,h2,h3,.quickview-product__title') || {}).textContent, add: !!m.querySelector('[data-product-add]'), focusInside: m.contains(document.activeElement), role: (p && p.getAttribute('role')) || m.getAttribute('role'), modal: (p && p.getAttribute('aria-modal')) || m.getAttribute('aria-modal') }; });
    rec(j, 'quickview opens with product + add button', !st.hidden && st.add, st);
    rec(j, 'focus inside quickview', st.focusInside, st);
    rec(j, 'quickview has dialog semantics', st.role === 'dialog' || st.modal === 'true', st);
    const c0 = await cartCount(page);
    const addState = await page.evaluate(() => { const b = document.querySelector('quickview-modal [data-product-add]'); return { disabled: b.disabled, text: b.textContent.trim() }; });
    rec(j, 'purchasable card: add button is enabled', !addState.disabled, addState);
    await page.locator('quickview-modal [data-product-add]').first().click();
    await page.waitForFunction((c) => { const e = document.querySelector('.cart-count'); return e && Number(e.textContent.trim()) > c; }, c0, { timeout: 20000 }).catch(() => null);
    const c1 = await cartCount(page);
    rec(j, 'purchasable card: quickview add-to-cart increments header count', c1 > c0, { c0, c1 });
    rec(j, 'purchasable card: server cart holds the item', (await cartJson(page)).item_count >= 1, null);
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    if (!(await quickviewClosed(page))) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
    const after = await closeContract(buy);
    rec(j, 'purchasable card: Escape closes the quickview', after.hidden, after);
    rec(j, 'purchasable card: Escape unlocks page scroll', !after.locked, after);
    rec(j, 'purchasable card: Escape returns focus to the card that opened it', after.inCard, after);
  }

  if (contact) {
    await gotoStore(page, '/collections/all');
    const before = (await cartJson(page)).item_count;
    const after = await closeContract(contact);
    rec(j, 'contact card: Escape closes the quickview', after.hidden, after);
    rec(j, 'contact card: Escape unlocks page scroll', !after.locked, after);
    rec(j, 'contact card: Escape returns focus to the card that opened it', after.inCard, after);
    await openQuickview(page, contact.i);
    const label = await page.evaluate(() => ({ text: document.querySelector('quickview-modal [data-product-add]').textContent.trim(), want: window.themeConfig && themeConfig.strings && themeConfig.strings.variant && themeConfig.strings.variant.contact }));
    rec(j, 'contact card: button reads the localized contact label', !!label.want && label.text === label.want, label);
    const navigated = page.waitForURL(/\/pages\/contact/, { timeout: 20000 }).then(() => true).catch(() => false);
    await page.locator('quickview-modal [data-product-add]').first().click();
    rec(j, 'contact card: button navigates to /pages/contact', await navigated, page.url());
    rec(j, 'contact card: nothing was added to the cart', (await cartJson(page)).item_count === before, { before });
  } else rec(j, 'data: a contact-for-price card with a quick view button exists', false, cards.slice(0, 4));
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
};

J.cartQueue = async (page) => {
  const j = 'cart-queue-1440';
  await gotoStore(page, PDP);
  const seeded = await page.evaluate(async (handle) => {
    await fetch('/cart/clear.js', { method: 'POST' });
    const p = await (await fetch('/products/' + handle + '.js')).json();
    const v = p.variants.find((x) => x.available);
    const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [{ id: v.id, quantity: 1 }, { id: v.id, quantity: 1, properties: { Engraving: 'QUEUE-TEST' } }] }) });
    const cart = await (await fetch('/cart.js')).json();
    return { status: r.status, lines: cart.items.map((i) => ({ key: i.key, q: i.quantity })) };
  }, PDP.split('/').pop());
  rec(j, 'seed: two lines of the same variant with different properties have distinct keys', seeded.status === 200 && seeded.lines.length === 2 && seeded.lines[0].key !== seeded.lines[1].key, seeded);
  if (seeded.lines.length !== 2) return;
  const [k1, k2] = seeded.lines.map((l) => l.key);
  await gotoStore(page, '/cart');
  await settle(page);
  await page.waitForSelector('cart-template cart-item[data-line-key]', { timeout: 15000 });
  const bodies = [];
  await page.route(/\/cart\/change(\.js)?(\?|$)/, (route) => { try { bodies.push(JSON.parse(route.request().postData())); } catch (e) { bodies.push({ parseError: true }); } return route.continue(); });
  const inc = (k) => page.locator(`cart-item[data-line-key="${k}"] [data-action="increase"]`).first();
  await inc(k1).click();
  await inc(k1).click();
  await inc(k1).click();
  await inc(k2).click();
  await page.waitForTimeout(2500);
  const server = (await cartJson(page)).items.map((i) => ({ key: i.key, q: i.quantity }));
  const q1 = (server.find((l) => l.key === k1) || {}).q, q2 = (server.find((l) => l.key === k2) || {}).q;
  rec(j, 'burst +,+,+ on line 1 and + on line 2 reaches the server as 4 and 2', q1 === 4 && q2 === 2, { q1, q2 });
  const byId = Object.fromEntries(bodies.map((b) => [b.id, b.quantity]));
  rec(j, 'exactly one /cart/change per line (debounce coalesced), keyed by line key', bodies.length === 2 && byId[k1] === 4 && byId[k2] === 2, bodies);
  const ui = await page.evaluate(([a, b]) => ({
    i1: Number(document.querySelector(`cart-item[data-line-key="${a}"] input[type=number]`).value),
    i2: Number(document.querySelector(`cart-item[data-line-key="${b}"] input[type=number]`).value),
    focusKey: (document.activeElement.closest('cart-item') || { dataset: {} }).dataset.lineKey || null,
    focusAction: document.activeElement.dataset ? document.activeElement.dataset.action : null,
    busy: document.querySelector('cart-template').getAttribute('aria-busy'),
  }), [k1, k2]);
  rec(j, 'rendered quantity inputs equal the server (4 and 2) and the cart is idle', ui.i1 === 4 && ui.i2 === 2 && ui.busy === 'false', ui);
  rec(j, 'focus ends on the control of the line the shopper touched last (line 2 increase)', ui.focusKey === k2 && ui.focusAction === 'increase', ui);
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
};

J.pdpVariantCart = async (page) => {
  const j = 'pdp-cart-1440';
  await gotoStore(page, PDP);
  const id0 = await page.inputValue('form[action*="/cart/add"] input[name="id"]');
  const radios = await page.$$eval('.variant-picker__item-input', (rs) => rs.map((r) => ({ id: r.id, name: r.name, value: r.value, checked: r.checked, disabled: r.disabled, cls: r.className })));
  rec(j, 'variant radios rendered', radios.length > 0, { count: radios.length });
  const fmt = await priceFormat(page);
  const prod = await productJson(page, PDP.split('/').pop());
  const priceOf = (id) => (prod.variants.find((v) => String(v.id) === String(id)) || {}).price;
  const price0 = norm(await page.locator('[data-product-price]').first().textContent());
  rec(j, 'server-rendered PDP price equals the variant price formatted with the shop money format', price0 === expectMoney(priceOf(id0), fmt), { shown: price0, want: expectMoney(priceOf(id0), fmt), fmt });
  const groups = {};
  for (const r of radios) (groups[r.name] = groups[r.name] || []).push(r);
  const g = Object.values(groups).find((arr) => arr.length > 1);
  if (g) {
    const tgt = g.find((r) => !r.checked && !r.disabled) || g.find((r) => !r.checked);
    await page.locator(`label[for="${tgt.id}"]`).click();
    await page.waitForFunction((v) => document.querySelector('form[action*="/cart/add"] input[name="id"]').value !== v, id0, { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ id: document.querySelector('form[action*="/cart/add"] input[name="id"]').value, urlVariant: new URL(location.href).searchParams.get('variant'), price: (document.querySelector('[data-product-price]') || {}).textContent, addDisabled: (document.querySelector('[data-product-add]') || {}).disabled, addText: ((document.querySelector('[data-product-add]') || {}).textContent || '').trim().replace(/\s+/g, ' ') }));
    rec(j, 'variant change updates hidden id', after.id !== id0, { id0, ...after });
    rec(j, 'URL ?variant= matches selected id', after.urlVariant === after.id, after);
    rec(j, 'variant change re-renders the price with the shop money format', norm(after.price) === expectMoney(priceOf(after.id), fmt), { shown: norm(after.price), want: expectMoney(priceOf(after.id), fmt) });
    rec(j, 'selected label shows chosen value', await page.evaluate((v) => { const s = [...document.querySelectorAll('[data-selected-value]')].map((e) => e.textContent.trim()); return s.length > 0 && s.includes(v); }, tgt.value), tgt.value);
  } else rec(j, 'product has an option group with more than one value', false, Object.keys(groups));
  const inc = page.locator('.product-template__buy-buttons quantity-selector [data-action="increase"], quantity-selector [data-action="increase"]').first();
  const qin = page.locator('quantity-selector input').first();
  if (await inc.count()) {
    await inc.click();
    const q2 = await qin.inputValue();
    rec(j, 'quantity + increments to 2', q2 === '2', q2);
    const dec = page.locator('quantity-selector [data-action="decrease"]').first();
    await dec.click();
    const q1 = await qin.inputValue();
    const decDisabled = await dec.isDisabled();
    rec(j, 'quantity cannot go below 1 (decrease disabled at 1)', q1 === '1' && decDisabled, { q1, decDisabled });
  }
  const addBtn = page.locator('[data-product-add]').first();
  if (await addBtn.isDisabled()) {
    const avail = radios.filter((r) => !r.disabled);
    rec(j, 'selected variant purchasable', false, 'add button disabled');
    return;
  }
  const c0 = await cartCount(page);
  await addBtn.click();
  await page.waitForFunction(() => { const m = document.querySelector('cart-modal'); return m && m.classList.contains('show'); }, null, { timeout: 20000 }).catch(() => null);
  await page.waitForFunction(() => { const l = document.querySelector('cart-modal .cart-modal-items-loading'); return !l || l.classList.contains('hidden'); }, null, { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(300);
  const cm = await page.evaluate(() => { const m = document.querySelector('cart-modal'); return { show: m.classList.contains('show'), ariaHidden: m.getAttribute('aria-hidden'), items: m.querySelectorAll('.cart-modal-item').length, focusInside: m.contains(document.activeElement), count: document.querySelector('.cart-count').textContent.trim() }; });
  rec(j, 'add-to-cart opens cart drawer', cm.show && cm.ariaHidden === 'false', cm);
  rec(j, 'drawer lists the line item', cm.items > 0, cm);
  rec(j, 'header cart count incremented', Number(cm.count) > c0, { c0, now: cm.count });
  const drawerCart = await cartJson(page);
  const drawerTotal = norm(await page.locator('cart-modal .cart-modal-total').first().textContent());
  rec(j, 'drawer total equals cart.total_price formatted with the shop money format', drawerTotal === expectMoney(drawerCart.total_price, fmt), { shown: drawerTotal, want: expectMoney(drawerCart.total_price, fmt) });
  rec(j, 'focus trapped inside drawer', cm.focusInside, cm);
  const tabs = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); tabs.push(await activeWithin(page, 'cart-modal')); }
  rec(j, 'Tab x12 never leaves drawer', tabs.every(Boolean), tabs);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  rec(j, 'Escape closes drawer', !(await page.evaluate(() => document.querySelector('cart-modal').classList.contains('show'))), null);

  await gotoStore(page, '/cart');
  const line = await page.evaluate(() => ({ lines: document.querySelectorAll('cart-item').length, total: (document.querySelector('.cart-total, [data-cart-total], .cart-template__total') || {}).textContent }));
  rec(j, '/cart shows the line', line.lines > 0, line);
  const pageTotal = norm(await page.locator('.cart-total__estimated-total .cart-price').first().textContent());
  rec(j, '/cart estimated total equals cart.total_price formatted with the shop money format', pageTotal === expectMoney((await cartJson(page)).total_price, fmt), { shown: pageTotal, fmt });
  const before = await page.evaluate(() => (document.querySelector('cart-item quantity-selector input') || {}).value);
  await page.locator('cart-item quantity-selector [data-action="increase"]:visible').first().click();
  await page.waitForFunction((b) => { const i = document.querySelector('cart-item quantity-selector input'); return i && i.value !== b; }, before, { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2500);
  const upd = await page.evaluate(() => ({ q: (document.querySelector('cart-item quantity-selector input') || {}).value, count: document.querySelector('.cart-count').textContent.trim(), err: [...document.querySelectorAll('[data-quantity-error]')].map((e) => e.textContent.trim()).filter(Boolean) }));
  const serverCart = await page.evaluate(async () => (await (await fetch('/cart.js')).json()).item_count);
  rec(j, 'cart page + updates quantity and server cart', Number(upd.q) === Number(before) + 1 && serverCart === Number(upd.count), { before, ...upd, serverCart });
  const del = page.locator('cart-item [data-action="delete-item"]:visible').first();
  const nLines = await page.locator('cart-item').count();
  for (let i = 0; i < nLines; i++) {
    const d = page.locator('cart-item [data-action="delete-item"]:visible').first();
    if (!(await d.count())) break;
    await d.click();
    await page.waitForTimeout(2500);
  }
  const empty = await page.evaluate(async () => ({ emptyShown: (() => { const e = document.querySelector('.cart-template__empty'); return !!e && !e.hidden && e.offsetParent !== null; })(), count: document.querySelector('.cart-count').textContent.trim(), server: (await (await fetch('/cart.js')).json()).item_count }));
  rec(j, 'removing all lines shows empty state', empty.emptyShown && empty.server === 0 && empty.count === '0', empty);
  void del;
};

async function footerJourney(page, vp) {
  const j = `footer-${vp}`;
  await gotoStore(page, '/');
  const st = await page.evaluate(() => [...document.querySelectorAll('.footer-actions-menu')].map((m) => { const t = m.querySelector('.footer-actions-menu__toggle'); const l = m.querySelector('.footer-actions-menu__list'); const tcs = t && getComputedStyle(t); return { toggleShown: !!t && tcs.display !== 'none', expanded: t && t.getAttribute('aria-expanded'), controls: t && !!document.getElementById(t.getAttribute('aria-controls')), listVis: l && getComputedStyle(l).visibility, links: l ? l.querySelectorAll('a').length : 0 }; }));
  rec(j, 'footer menus present', st.length > 0, st.length);
  if (vp === 375) {
    rec(j, 'toggles shown, collapsed, aria-controls resolve', st.every((s) => s.toggleShown && s.expanded === 'false' && s.controls && s.listVis === 'hidden'), st);
    const t = page.locator('.footer-actions-menu__toggle').first();
    await t.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    const o = await t.evaluate((b) => ({ exp: b.getAttribute('aria-expanded'), vis: getComputedStyle(document.getElementById(b.getAttribute('aria-controls'))).visibility }));
    rec(j, 'Enter expands menu + list visible', o.exp === 'true' && o.vis === 'visible', o);
    await page.keyboard.press('Space');
    await page.waitForTimeout(450);
    const c = await t.evaluate((b) => ({ exp: b.getAttribute('aria-expanded'), vis: getComputedStyle(document.getElementById(b.getAttribute('aria-controls'))).visibility }));
    rec(j, 'Space collapses menu + list hidden', c.exp === 'false' && c.vis === 'hidden', c);
    const box = await t.boundingBox();
    rec(j, 'toggle target >= 24px tall', box.height >= 24, box);
  } else {
    rec(j, 'no toggles at desktop, lists visible', st.every((s) => !s.toggleShown && s.listVis === 'visible' && s.links > 0), st);
  }
}
J.footer375 = (page) => footerJourney(page, 375);
J.footer1440 = (page) => footerJourney(page, 1440);

async function tocJourney(page, vp) {
  const j = `toc-${vp}`;
  await gotoStore(page, ARTICLE);
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => { const t = document.querySelector('content-toc'); if (!t) return null; const links = [...t.querySelectorAll('.toc__link')]; return { links: links.length, busy: t.getAttribute('aria-busy'), hrefsResolve: links.every((a) => !!document.getElementById(decodeURIComponent(a.hash.slice(1)))), cls: t.className, display: getComputedStyle(t).display }; });
  if (!st) { rec(j, 'TOC rendered on an article with headings', false, 'content-toc absent'); return; }
  rec(j, 'TOC lists heading links', st.links > 0 && st.display !== 'none', st);
  rec(j, 'every TOC link target exists', st.hrefsResolve, st);
  rec(j, 'aria-busy cleared after build', st.busy === 'false', st);
  const toggle = page.locator('content-toc .toc__toggle');
  if (await toggle.count() && await toggle.isVisible()) {
    const exp = await toggle.getAttribute('aria-expanded');
    if (exp === 'false') { await toggle.click(); await page.waitForTimeout(300); }
  }
  const link = page.locator('content-toc .toc__link').nth(Math.min(1, st.links - 1));
  const hash = await link.evaluate((a) => decodeURIComponent(a.hash.slice(1)));
  await link.click();
  await page.waitForTimeout(1200);
  const pos = await page.evaluate((id) => { const h = document.getElementById(id); const r = h.getBoundingClientRect(); const header = document.querySelector('.shopify-section-group-header-group, header'); const hb = header ? header.getBoundingClientRect().bottom : 0; return { top: Math.round(r.top), headerBottom: Math.round(hb), vh: innerHeight }; }, hash);
  rec(j, 'clicking TOC link scrolls heading into view below sticky header', pos.top >= 0 && pos.top < pos.vh * 0.6 && pos.top >= pos.headerBottom - 4, pos);
}
J.toc1440 = (page) => tocJourney(page, 1440);
J.toc375 = (page) => tocJourney(page, 375);

J.contactForm = async (page) => {
  const j = 'contact-1440';
  await gotoStore(page, '/pages/contact');
  const form = page.locator('form[action*="/contact"]').first();
  if (!(await form.count())) { rec(j, 'contact form present', false, null); return; }
  const fields = await form.evaluate((f) => [...f.querySelectorAll('input:not([type=hidden]), textarea, select')].map((el) => ({ name: el.name, type: el.type, required: el.required, label: !!(el.labels && el.labels.length) || !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby'), autocomplete: el.getAttribute('autocomplete') })));
  rec(j, 'every field has an accessible label', fields.every((f) => f.label), fields);
  rec(j, 'email field is type=email + required', fields.some((f) => f.type === 'email' && f.required), fields);
  const url0 = page.url();
  let posted = false;
  page.on('request', (r) => { if (r.method() === 'POST' && /\/contact/.test(r.url())) posted = true; });
  await form.locator('[type=submit], button:not([type=button])').first().click();
  await page.waitForTimeout(1200);
  const inv = await form.evaluate((f) => ({ invalid: [...f.querySelectorAll(':invalid')].map((e) => e.name), focus: document.activeElement && document.activeElement.name }));
  rec(j, 'empty submit is blocked client-side (no POST)', !posted && page.url() === url0, { posted, url: page.url() });
  rec(j, 'first invalid field receives focus', inv.invalid.length > 0 && inv.invalid.includes(inv.focus), inv);
};

J.notFound = async (page) => {
  const j = '404-375';
  const resp = await gotoStore(page, '/pages/does-not-exist-404', { allowStatus: [404] });
  const st = await page.evaluate(() => ({ h1: (document.querySelector('h1') || {}).textContent, links: [...document.querySelectorAll('main a[href]')].map((a) => a.getAttribute('href')).slice(0, 6), search: !!document.querySelector('main form[action*="/search"], main input[name=q]') }));
  rec(j, 'HTTP 404', resp && resp.status() === 404, resp && resp.status());
  rec(j, 'recovery link to home/collections', st.links.some((h) => h === '/' || /collections/.test(h)), st);
};

J.cartDrawerHeader = async (page) => {
  const j = 'cart-drawer-1440';
  await gotoStore(page, PDP);
  const seeded = await page.evaluate(async () => {
    const id = Number(document.querySelector('form[action*="/cart/add"] input[name="id"]').value);
    const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [{ id, quantity: 1 }] }) });
    return r.status;
  });
  rec(j, 'cart seeded through AJAX API (/cart/add.js)', seeded === 200, seeded);
  await gotoStore(page, '/');
  const trigger = page.locator('.header__cart-btn:visible').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => { const m = document.querySelector('cart-modal'); return m && m.classList.contains('show') && m.querySelectorAll('.cart-modal-item').length > 0; }, null, { timeout: 10000 }).catch(() => null);
  const t0 = await page.evaluate(() => { const m = document.querySelector('cart-modal'); return { show: m.classList.contains('show'), ariaHidden: m.getAttribute('aria-hidden'), items: m.querySelectorAll('.cart-modal-item').length, focusInside: m.contains(document.activeElement) }; });
  await page.waitForTimeout(600);
  const t1 = await page.evaluate(() => { const m = document.querySelector('cart-modal'); return { focusInside: m.contains(document.activeElement), active: document.activeElement.className.slice(0, 40) }; });
  rec(j, 'keyboard Enter on header cart opens drawer with the line', t0.show && t0.ariaHidden === 'false' && t0.items > 0, t0);
  rec(j, 'focus moves into drawer', t1.focusInside, t1);
  const tabs = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); tabs.push(await activeWithin(page, 'cart-modal')); }
  rec(j, 'Tab x12 never leaves drawer', tabs.every(Boolean), tabs);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => { const m = document.querySelector('cart-modal'); const a = document.activeElement; return { show: m.classList.contains('show'), ariaHidden: m.getAttribute('aria-hidden'), focusReturned: !!a && a.classList.contains('header__cart-btn') }; });
  rec(j, 'Escape closes drawer', !closed.show && closed.ariaHidden === 'true', closed);
  rec(j, 'focus returns to the cart trigger', closed.focusReturned, closed);
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } }));
};

J.buyNow = async (page) => {
  const j = 'buy-now-1440';
  await gotoStore(page, PDP);
  const st = await page.evaluate(() => ({ buy: !!document.querySelector('[data-product-buy]'), dynamic: !!document.querySelector('.product-template__dynamic-checkout'), dynamicChildren: (document.querySelector('.product-template__dynamic-checkout') || { children: [] }).children.length }));
  rec(j, 'PDP offers an express checkout path (theme buy-now button or dynamic checkout container with a rendered button)', st.buy || (st.dynamic && st.dynamicChildren > 0), st);
  if (!st.buy) return;
  const nav = page.waitForURL(/checkout|checkouts/, { timeout: 20000 }).then(() => true).catch(() => false);
  await page.locator('[data-product-buy]').first().click();
  const went = await nav;
  const toast = await page.evaluate(() => [...document.querySelectorAll('[class*="toast"]')].map((e) => e.textContent.trim().replace(/\s+/g, ' ').slice(0, 120)).filter(Boolean)).catch(() => []);
  rec(j, 'buy now reaches checkout', went, { url: page.url(), toast });
};

const PLATFORM_CONSOLE = /origin_trials|cdn\.shopify\.com\/shopifycloud|\/cdn\/shopifycloud\/|HotReload|theme-hot-reload|\/favicon\.ico|graphql\.json|shopify-account|monorail|web-pixels|captcha|shop\.app|perf-kit|\/\.well-known\//i;
const findKey = (o, k) => { for (const [key, v] of Object.entries(o)) { if (key === k && typeof v === 'string') return v; if (v && typeof v === 'object') { const r = findKey(v, k); if (r) return r; } } return null; };
const REMOVE_CONFIRM = findKey(JSON.parse(fs.readFileSync(path.join(ROOT, 'locales/en.default.json'), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, '')), 'remove_confirm');
const EXPECTED_DIALOGS = { pdpVariantCart: ['confirm: ' + REMOVE_CONFIRM] };
const EXPECTED_STATUS = { notFound: [404] };
const EXPECTED_CONSOLE = { notFound: /does-not-exist-404/ };

const MUTATIONS = {
  'qv-no-release': { url: /quickview-modal\.js/, edit: (b) => b.replace(/ThemeUtils\.unlockScroll\(\);?/g, '').replace(/ThemeUtils\.releaseFocus\(this\);?/g, '') },
  'cart-find-first': { url: /\/assets\/cart\.js/, edit: (b) => b.replace(`return this.querySelector('cart-item[data-line-key="' + key + '"]');`, `return this.querySelector('cart-item');`) },
  'search-aria': { url: /search-modal\.js/, edit: (b) => b.replace(`'aria-controls', 'search-panel-' + tab.key`, `'aria-controls', 'nope-' + tab.key`) },
  'search-combobox': { doc: true, edit: (b) => b.replace('id="search-modal-input"', 'id="search-modal-input" role="combobox"') },
  'throw-asset': { url: /\/assets\/theme\.js/, edit: (b) => b + '\n;throw new Error("E2E_MUTATE throw-asset");' },
  'money-currency': { doc: true, edit: (b) => b.replace(/(\$\d[\d,.]*) USD/g, '$1 EUR') },
};
let mutationHits = 0;
async function installMutation(ctx) {
  const m = MUTATIONS[MUTATE];
  if (!m) throw new Error(`unknown E2E_MUTATE ${MUTATE}; known: ${Object.keys(MUTATIONS).join(', ')}`);
  await ctx.route((u) => (m.doc ? true : m.url.test(u.pathname)), async (route) => {
    const req = route.request();
    if (m.doc && req.resourceType() !== 'document') return route.fallback();
    const res = await route.fetch();
    const body = await res.text();
    const out = m.edit(body);
    if (out !== body) mutationHits++;
    await route.fulfill({ response: res, body: out });
  });
}

const PLAN = [
  ['skipLinkAndFocusRing', 1440, 900], ['megamenuDesktop', 1440, 900], ['mobileMenu', 375, 812],
  ['search1440', 1440, 900], ['search375', 375, 812], ['plpSortFilter', 1440, 900], ['plpMobileFilter', 375, 812],
  ['quickview', 1440, 900], ['cartQueue', 1440, 900], ['pdpVariantCart', 1440, 900], ['footer375', 375, 812], ['footer1440', 1440, 900],
  ['toc1440', 1440, 900], ['toc375', 375, 812], ['contactForm', 1440, 900], ['notFound', 375, 812],
  ['cartDrawerHeader', 1440, 900], ['buyNow', 1440, 900],
];

(async () => {
  const only = (process.env.E2E_ONLY || '').split(',').filter(Boolean);
  const plan = only.length ? PLAN.filter((p) => only.includes(p[0])) : PLAN;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const logs = {};
  let i = 0;
  await Promise.all(Array.from({ length: Number(process.env.E2E_CONC || 3) }, async () => {
    while (i < plan.length) {
      const [name, w, h] = plan[i++];
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
      if (MUTATE) await installMutation(ctx);
      const page = await ctx.newPage();
      const dialogs = [];
      page.on('dialog', async (d) => { dialogs.push(d.type() + ': ' + d.message()); await d.accept(); });
      const log = attachLogs(page);
      const before = results.length;
      try { await J[name](page); } catch (e) { rec(name, 'journey crashed', false, String(e.message).slice(0, 300)); }
      if (results.slice(before).some((r) => r.ok === false)) await page.screenshot({ path: path.join(OUT, `${name}-fail.jpg`), type: 'jpeg', quality: 60 }).catch(() => {});
      const themeConsole = log.console.filter((c) => !PLATFORM_CONSOLE.test(c.text) && !PLATFORM_CONSOLE.test(c.url) && !(EXPECTED_CONSOLE[name] && EXPECTED_CONSOLE[name].test(c.url)));
      const badResponses = log.badResponses.filter((b) => b.cls !== 'platform' && !(EXPECTED_STATUS[name] || []).includes(b.status));
      const wantDialogs = EXPECTED_DIALOGS[name] || [];
      rec(name, 'no uncaught page errors', log.pageErrors.length === 0, log.pageErrors);
      rec(name, 'no console errors outside platform-owned scripts', themeConsole.length === 0, themeConsole);
      rec(name, 'no failed storefront or theme-asset responses', badResponses.length === 0, badResponses);
      rec(name, 'only the expected dialogs appeared', dialogs.length === wantDialogs.length && dialogs.every((d) => wantDialogs.includes(d)), { dialogs, wantDialogs });
      logs[name] = { pageErrors: log.pageErrors, console: log.console, badResponses: log.badResponses.filter((b) => b.cls !== 'platform'), dialogs };
      await ctx.close();
    }
  }));
  await browser.close();
  if (MUTATE) rec('mutation', `${MUTATE} modified a served resource`, mutationHits > 0, { mutationHits });
  const file = path.join(OUT, process.env.E2E_TAG ? `journeys-${process.env.E2E_TAG}.json` : 'journeys.json');
  fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), results, logs }, null, 1));
  const pass = results.filter((r) => r.ok === true).length, fail = results.filter((r) => r.ok === false).length, info = results.filter((r) => r.ok === null).length;
  console.log(`SUMMARY pass=${pass} fail=${fail} info=${info} -> ${path.relative(ROOT, file)}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('JOURNEYS_FAIL', e); process.exit(2); });
