const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { gotoStore, settle, ensureDir, ROOT } = require('./lib.cjs');

const OUT = process.env.TH_OUT || path.join(require('os').tmpdir(), 'e2e-touch-hover', 'touch-hover.json');
const ARTICLE = '/blogs/news/leather-care-101';
const ROUTES = (process.env.TH_ROUTES || ['/', '/collections/all', '/collections', '/pages/about', '/pages/contact', '/blogs/news', ARTICLE, '/search?q=jacket', '/products/rebel-tactical-bomber-jacket'].join(',')).split(',');

const PAIRS = [
  ['.section-slideshow__btn', null],
  ['.section-hero__btn', null],
  ['.section-collection-list__card', '.section-collection-list__img'],
  ['.article-card__media', '.article-card__media-image'],
  ['.section-blog-posts__view-all', 'svg'],
  ['.section-featured-collection__view-all', 'svg'],
  ['.section-iwt__btn', null],
  ['.section-rich-text__btn', null],
  ['.section-icon-boxes__item', null],
  ['.section-gallery__item', '.section-gallery__img'],
  ['.section-layered__layer', null],
  ['.section-video__facade', '.section-video__play'],
  ['.section-hotspot__pulse', null],
  ['.section-multicolumn__item-link', 'svg'],
  ['.section-contact-form__submit', null],
  ['.article-card__media-inner', '.article-card__media-image'],
  ['.article-card__read-more', 'svg'],
  ['.collection-card', null],
  ['.float-social__toggle', null],
  ['.button-primary', null],
  ['.search-page-result', null],
  ['.blog-featured__media-inner', '.blog-featured__image'],
  ['.article-template__nav-link', null],
  ['.collection-menu__item', null],
  ['.product-card__add-btn', null],
];
if (process.env.TH_MUTATE === 'stale-pair') PAIRS.push(['.zz-renamed-class', null]);
const CONTROL = ['.product-card__media', '.product-card__media-image img'];

const CONTEXTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  touch: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

async function probe(page, cdp, host, target) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: host });
  if (!nodeIds.length) return null;
  const read = () => page.evaluate(([h, t]) => {
    const el = document.querySelector(h);
    const tg = t ? el.querySelector(t) : el;
    return tg ? getComputedStyle(tg).transform : 'no-target';
  }, [host, target]);
  const pre = await read();
  await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[0], forcedPseudoClasses: ['hover'] });
  const post = await read();
  await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[0], forcedPseudoClasses: [] });
  return { pre, post, changed: pre !== post };
}

const PROBED_FLOOR = Number(process.env.TH_FLOOR || 20);
const failures = [];
const THEME_TEXT = ['sections', 'snippets', 'templates', 'assets', 'blocks', 'layout'].flatMap((d) => fs.readdirSync(path.join(ROOT, d)).map((f) => path.join(ROOT, d, f))).filter((f) => fs.statSync(f).isFile()).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
for (const [host] of PAIRS) { const cls = (host.match(/\.([\w-]+)/) || [])[1]; if (cls && !THEME_TEXT.includes(cls)) failures.push(`stale PAIR: .${cls} exists nowhere in the theme`); }

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = {};
  try {
    for (const [name, opts] of Object.entries(CONTEXTS)) {
      const ctx = await browser.newContext(opts);
      await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      report[name] = { hoverMedia: null, routes: {} };
      for (const route of ROUTES) {
        await gotoStore(page, route);
        await settle(page);
        if (process.env.TH_MUTATE === 'sticky') await page.addStyleTag({ content: '.article-card__media:hover .article-card__media-image{transform:scale(1.1)}' });
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important} #th-control{width:10px;height:10px} #th-control:hover{transform:scale(2)}' });
        await page.evaluate(() => { const c = document.createElement('div'); c.id = 'th-control'; document.body.append(c); });
        if (report[name].hoverMedia === null) report[name].hoverMedia = await page.evaluate(() => matchMedia('(hover: hover)').matches);
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');
        const rows = {};
        for (const [host, target] of PAIRS) {
          const r = await probe(page, cdp, host, target);
          if (r) rows[host + (target ? ' ' + target : '')] = r;
        }
        const control = await probe(page, cdp, '#th-control', null);
        const cardZoom = await probe(page, cdp, CONTROL[0], CONTROL[1]);
        report[name].routes[route] = { rows, control, cardZoom };
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  ensureDir(path.dirname(OUT));
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  for (const [name, r] of Object.entries(report)) {
    let probed = 0, changed = 0, controls = 0, controlChanged = 0;
    const hits = [];
    for (const [route, v] of Object.entries(r.routes)) {
      for (const [k, row] of Object.entries(v.rows)) { probed++; if (row.changed) { changed++; hits.push(route + ' ' + k); } }
      if (v.control) { controls++; if (v.control.changed) controlChanged++; }
    }
    console.log(`${name} hoverMedia=${r.hoverMedia} probed=${probed} changed=${changed} control=${controlChanged}/${controls}`);
    if (name === 'touch') hits.forEach((h) => console.log('  TOUCH-STICKY', h));
    if (controls === 0 || controlChanged !== controls) failures.push(`${name}: forced :hover control changed ${controlChanged}/${controls} (forcing is broken)`);
    if (probed < PROBED_FLOOR) failures.push(`${name}: only ${probed} host rows probed (floor ${PROBED_FLOOR})`);
    if (name === 'touch' && changed > 0) failures.push(`touch: ${changed} decorative transform(s) change on forced :hover: ${hits.join('; ')}`);
  }
  console.log(failures.length ? `FAIL ${failures.length}: ${failures.join(' | ')}` : 'PASS touch-hover');
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error('ERR', e.stack); process.exit(2); });
