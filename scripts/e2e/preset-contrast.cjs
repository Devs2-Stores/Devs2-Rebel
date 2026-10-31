const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { Liquid } = require('liquidjs');
const { ROOT, gotoStore, settle, ensureDir } = require('./lib.cjs');
const { PDP } = require('./routes.cjs');

const PRESETS = (process.env.PC_PRESETS || Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'config/settings_data.json'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')).presets).join(',')).split(',');
const ROUTES = (process.env.PC_ROUTES || ['/', PDP, '/collections/all', '/cart', '/pages/contact'].join(',')).split(',');
const WIDTHS = (process.env.PC_WIDTHS || '375,1440').split(',').map(Number);
const STATES = (process.env.PC_STATES || 'page,search,cart,menu').split(',');
const OUT = process.env.PC_OUT || '';
const SHOTS = process.env.PC_SHOTS || '';
const MEASURED_FLOOR = Number(process.env.PC_FLOOR || 3);

const hexOf = (c) => (typeof c === 'string' ? c : c && c.hex) || '#000000';
const rgbOf = (c) => { const h = hexOf(c).replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const toHex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const lum = (a) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]); };

async function presetCss() {
  const raw = fs.readFileSync(path.join(ROOT, 'config/settings_data.json'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const data = JSON.parse(raw);
  const engine = new Liquid();
  engine.registerFilter('color_mix', (a, b, w) => { const x = rgbOf(a); const y = rgbOf(b); const p = Number(w) / 100; return toHex(x.map((v, i) => v * p + y[i] * (1 - p))); });
  engine.registerFilter('color_contrast', (a, b) => { const l1 = lum(rgbOf(a)); const l2 = lum(rgbOf(b)); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 10) / 10; });
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\{%-?\s*style\s*-?%\}/g, '').replace(/\{%-?\s*endstyle\s*-?%\}/g, '');
  const tpl = read('snippets/head-color-schemes.liquid') + read('snippets/head-design-systems.liquid');
  const color = (hex) => { const [red, green, blue] = rgbOf(hex); return { red, green, blue, rgb: `${red} ${green} ${blue}`, hex, toString() { return hex; } }; };
  const defaults = {};
  for (const group of JSON.parse(fs.readFileSync(path.join(ROOT, 'config/settings_schema.json'), 'utf8'))) {
    for (const s of group.settings || []) if (s.id && s.default !== undefined && s.type !== 'font_picker') defaults[s.id] = s.default;
  }
  const css = {};
  for (const [name, preset] of Object.entries(data.presets)) {
    const schemes = Object.entries(preset.color_schemes).map(([id, s]) => {
      const settings = {};
      for (const [k, v] of Object.entries(s.settings)) settings[k] = typeof v === 'string' && v.startsWith('#') ? color(v) : v;
      return { id, settings };
    });
    const rendered = await engine.parseAndRender(tpl, { settings: { ...defaults, ...preset, color_schemes: schemes } });
    css[name] = rendered.split('\n').filter((ln) => !/^\s*--font-(heading|subheading|body)-(family|style|weight):/.test(ln) && !/^\s*--[\w-]+:\s*[,\s]*;\s*$/.test(ln)).join('\n');
    if (process.env.PC_DUMP) fs.writeFileSync(path.join(ensureDir(process.env.PC_DUMP), `${name}.css`), css[name]);
  }
  return css;
}

function scan() {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const parse = (s) => {
    const m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
    if (!s || s === 'transparent' || s === 'none') return null;
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = s; cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = L(a); const y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 1 && r.height > 1; };
  const out = [];
  let measured = 0, covered = 0;
  const seen = new Set();
  const forceHit = document.createElement('style');
  forceHit.textContent = '*{pointer-events:auto!important}';
  document.head.append(forceHit);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest('script,style,noscript,template,[aria-hidden="true"],.visually-hidden,.sr-only,[hidden],svg')) continue;
    if (!vis(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.right < 0 || rect.left > innerWidth) continue;
    let op = 1;
    for (let a = el; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
    if (op < 0.05) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const layers = [];
    let complex = null;
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.backgroundImage && s.backgroundImage !== 'none') { complex = 'bg-image'; break; }
      const media = a !== el && [...a.querySelectorAll(':scope > img, :scope > picture, :scope > video, :scope > * > img, :scope > * > picture, :scope > * > video')].find((m) => { const r = m.getBoundingClientRect(); return r.width > 20 && r.left < rect.right && r.right > rect.left && r.top < rect.bottom && r.bottom > rect.top && getComputedStyle(m).visibility !== 'hidden'; });
      if (media) { complex = 'over-media'; break; }
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
    }
    if (complex) continue;
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    // The backdrop is whatever is painted below the text in the stacking order. pointer-events:none elements (active
    // pagination link, decorative overlays) are invisible to hit testing, so scan() forces pointer-events:auto first.
    // A layer above the text that is opaque, translucent (alpha >= 0.3), an image or media means the text is covered by
    // a panel or scrim and is not read in this state; translucent layers at or below the text tint the first opaque one.
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    const r2 = el.getBoundingClientRect();
    const cx = r2.left + r2.width / 2, cy = r2.top + r2.height / 2;
    if (cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight) {
      let under = null, skip = false, seenSelf = false;
      const tint = [];
      for (const e of document.elementsFromPoint(cx, cy)) {
        if (e !== el && el.contains(e)) continue;
        let eo = 1;
        for (let a = e; a; a = a.parentElement) eo *= Number(getComputedStyle(a).opacity);
        if (eo < 0.05) continue;
        if (e === el) seenSelf = true;
        const es = getComputedStyle(e);
        const c = parse(es.backgroundColor);
        const imagery = e.matches('img, video, canvas, picture, svg') || (es.backgroundImage && es.backgroundImage !== 'none');
        if (!seenSelf) {
          if (imagery || (c && c.a >= 0.3)) { skip = true; break; }
          continue;
        }
        if (imagery) { skip = true; break; }
        if (c && c.a >= 0.99) { under = c; break; }
        if (c && c.a > 0) tint.push(c);
      }
      if (skip) { covered++; continue; }
      if (under) { base = under; for (let i = tint.length - 1; i >= 0; i--) base = over(tint[i], base); }
    }
    const text = over({ ...fg, a: fg.a * op }, base);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    const cr = ratio(text, base);
    measured++;
    if (cr < need) {
      const id = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      out.push({ el: id, text: n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 40), ratio: Math.round(cr * 100) / 100, need, fg: cs.color, bg: `rgb(${Math.round(base.r)}, ${Math.round(base.g)}, ${Math.round(base.b)})`, y: Math.round(rect.top + scrollY) });
    }
  }
  forceHit.remove();
  return { fails: out, measured, covered };
}

async function openState(page, state, w) {
  if (state === 'search') {
    const b = page.locator('[data-action="open-search-modal"]:visible').first();
    if (!(await b.count())) return false;
    await b.click();
    await page.waitForTimeout(600);
    return page.evaluate(() => document.querySelector('search-modal').classList.contains('show'));
  }
  if (state === 'cart') {
    const b = page.locator('.header__cart-btn:visible').first();
    if (!(await b.count())) return false;
    await b.click();
    await page.waitForTimeout(800);
    return page.evaluate(() => { const m = document.querySelector('cart-modal'); return !!m && m.classList.contains('show'); });
  }
  if (state === 'menu') {
    if (w >= 1024) {
      const t = page.locator('.megamenu__trigger:visible').nth(1);
      if (!(await t.count())) return false;
      await t.hover();
      await page.waitForTimeout(600);
      return true;
    }
    const b = page.locator('.header__hamburger');
    if (!(await b.isVisible())) return false;
    await b.click();
    await page.waitForTimeout(600);
    return page.evaluate(() => document.querySelector('mobile-menu').classList.contains('show'));
  }
  return true;
}

(async () => {
  const css = await presetCss();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const out = {};
  try {
    for (const preset of PRESETS) {
      if (!css[preset]) throw new Error('unknown preset ' + preset);
      for (const w of WIDTHS) {
        for (const route of ROUTES) {
          for (const state of STATES) {
            if (state !== 'page' && route !== '/') continue;
            const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : w < 1024 ? 1024 : 900 } });
            await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
            const page = await ctx.newPage();
            const inject = (text) => {
              const live = [...document.head.querySelectorAll('style')].filter((s) => s.textContent.includes('--text-alpha-floor') || s.textContent.includes('--color-primary-rgb'));
              const anchor = live[live.length - 1];
              if (!anchor) return location.pathname;
              const tag = document.createElement('style');
              tag.textContent = text;
              anchor.after(tag);
              return true;
            };
            let injected = false;
            for (let attempt = 0; attempt < 3 && injected !== true; attempt++) {
              if (attempt) await page.waitForTimeout(3000);
              await gotoStore(page, route);
              injected = await page.evaluate(inject, css[preset] + (process.env.PC_MUTATE === 'low-contrast' ? '\nmain p, main h1, main h2, main li, main a, search-modal a, search-modal button, search-modal p, cart-modal p, cart-modal a, mobile-menu a { color: #bdb8ae !important; }' : ''));
            }
            if (injected !== true) throw new Error(`live scheme style not found on ${route} (landed ${injected})`);
            if (state === 'page') await settle(page);
            const opened = await openState(page, state, w);
            const scanned = opened ? await page.evaluate(scan) : null;
            const fails = scanned && scanned.fails;
            const key = `${preset} ${w} ${route} ${state}`;
            out[key] = { opened, count: fails ? fails.length : null, measured: scanned ? scanned.measured : null, covered: scanned ? scanned.covered : null, fails: fails ? fails.slice(0, 25) : null };
            if (process.env.PC_PROBE && opened) out[key].probe = await page.evaluate(process.env.PC_PROBE);
            console.error(key, opened ? `fails=${fails.length} measured=${scanned.measured} covered=${scanned.covered}` : 'not-opened');
            if (SHOTS && opened) {
              const safe = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
              await page.screenshot({ path: path.join(ensureDir(SHOTS), `${w}-${preset.toLowerCase()}-${safe}-${state}.png`), fullPage: state === 'page' && process.env.PC_FULL === '1' });
            }
            await ctx.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  const s = JSON.stringify(out, null, 1);
  if (OUT) fs.writeFileSync(OUT, s);
  console.log(s);
  const bad = Object.entries(out).filter(([, v]) => v.opened === false || (v.count || 0) > 0 || v.measured < MEASURED_FLOOR);
  for (const [k, v] of bad) console.error('FAIL', k, v.opened === false ? 'state did not open' : v.measured < MEASURED_FLOOR ? `only ${v.measured} text nodes measured (floor ${MEASURED_FLOOR}): backdrop model skipped the page` : `${v.count} contrast failures ${JSON.stringify((v.fails || []).slice(0, 3))}`);
  console.error(`SUMMARY runs=${Object.keys(out).length} failed=${bad.length}`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.log('ERR', e.message); process.exit(2); });
