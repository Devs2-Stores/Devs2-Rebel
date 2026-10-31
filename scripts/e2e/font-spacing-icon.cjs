const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { gotoStore, settle, recorder, ensureDir, ROOT } = require('./lib.cjs');
const { GATE_ROUTES } = require('./routes.cjs');

const OUT = process.env.FSI_OUT || path.join(require('os').tmpdir(), 'e2e-font-spacing-icon', 'font-spacing-icon.json');
const ROUTES = (process.env.FSI_ROUTES || [...GATE_ROUTES, '/pages/does-not-exist-404'].join(',')).split(',');
const WIDTHS = (process.env.FSI_WIDTHS || '375,768,1440').split(',').map(Number);
const { results, rec } = recorder();

function collect() {
  const vw = innerWidth;
  const PLATFORM = 'shopify-account, shop-pay-wallet-button, shopify-accelerated-checkout, shopify-payment-terms, [id^="shopify-pc"], #shopify-privacy-banner, iframe';
  const vis = (el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && (() => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })();
  const srOnly = (el) => { const r = el.getBoundingClientRect(); return r.width <= 2 || r.height <= 2; };
  const desc = (el) => {
    const c = el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '';
    const p = el.parentElement;
    const pc = p && p.classList.length ? '.' + p.classList[0] : (p ? p.tagName.toLowerCase() : '');
    return `${pc} > ${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${c}`.slice(0, 110);
  };
  const first = (ff) => ff.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
  const rgba = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });

  const all = [...document.body.querySelectorAll('*')].filter((el) => !el.closest(PLATFORM) && !el.closest('svg'));
  const textEls = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && vis(el));

  // Fonts
  const root = getComputedStyle(document.documentElement);
  const fam = {
    body: first(root.getPropertyValue('--font-body-family')),
    heading: first(root.getPropertyValue('--font-heading-family')),
    subheading: first(root.getPropertyValue('--font-subheading-family')),
  };
  const famSet = new Set(Object.values(fam));
  const foreign = [], used = new Map(), tiny = [], micro = [], tightLh = [], smallInputs = [];
  for (const el of textEls) {
    if (srOnly(el)) continue;
    const cs = getComputedStyle(el);
    const f = first(cs.fontFamily);
    if (!famSet.has(f)) foreign.push(`${desc(el)} [${f}]`);
    else { const k = `${f}|${cs.fontWeight}|${cs.fontStyle}`; used.set(k, (used.get(k) || 0) + 1); }
    const fs = parseFloat(cs.fontSize);
    if (fs < 10.99) tiny.push(`${desc(el)} ${fs}px "${el.textContent.trim().slice(0, 20)}"`);
    else if (fs < 11.5 && cs.textTransform !== 'uppercase' && !el.closest('.content-size-xs, .cart-count')) micro.push(`${desc(el)} ${fs}px "${el.textContent.trim().slice(0, 20)}"`);
    const lh = parseFloat(cs.lineHeight);
    if (lh && el.getBoundingClientRect().height > lh * 1.6 && lh / fs < 1) tightLh.push(`${desc(el)} ${lh}/${fs}`);
  }
  const controls = all.filter((el) => el.matches('button, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea') && vis(el));
  const controlFont = controls.filter((el) => !famSet.has(first(getComputedStyle(el).fontFamily))).map((el) => `${desc(el)} [${first(getComputedStyle(el).fontFamily)}]`);
  for (const el of controls) if (el.matches('input, select, textarea') && parseFloat(getComputedStyle(el).fontSize) < 16) smallInputs.push(`${desc(el)} ${getComputedStyle(el).fontSize}`);
  const faces = [...document.fonts].map((f) => ({ family: first(f.family), weight: f.weight, style: f.style, status: f.status }));
  const weightMismatch = [], missingFamily = [];
  for (const [k, n] of used) {
    const [f, w, st] = k.split('|');
    const fx = faces.filter((x) => x.family === f && x.status === 'loaded');
    if (!faces.some((x) => x.family === f)) { if (!['arial', 'helvetica', 'sans-serif', 'serif', 'monospace', 'system-ui', '-apple-system'].includes(f)) missingFamily.push(`${f} (${n} el)`); continue; }
    const want = Number(w);
    const styled = fx.filter((x) => (st === 'normal' ? x.style === 'normal' : x.style !== 'normal'));
    const pool = styled.length ? styled : fx;
    const has = (x) => { const [a, b] = String(x.weight).split(' ').map(Number); return b ? want >= a && want <= b : a === want; };
    if (pool.some(has)) { if (!styled.length) weightMismatch.push(`${f} ${w} ${st}: no ${st} face (synthetic) - ${n} el`); continue; }
    const ws = pool.map((x) => Number(String(x.weight).split(' ')[0])).sort((a, b) => a - b);
    let match;
    if (want >= 400 && want <= 500) match = ws.find((x) => x >= want && x <= 500) ?? [...ws].reverse().find((x) => x < want) ?? ws.find((x) => x > 500);
    else if (want < 400) match = [...ws].reverse().find((x) => x <= want) ?? ws.find((x) => x > want);
    else match = ws.find((x) => x >= want) ?? [...ws].reverse().find((x) => x < want);
    weightMismatch.push(`${f} ${w} ${st} renders with face ${match} (${n} el)`);
  }

  // Spacing
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const box = (s) => {
    const r = s.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
    const kids = [...s.children].map((c) => c.getBoundingClientRect()).filter((b) => b.width > 0 && b.height > 0);
    if (!kids.length) return null;
    const l = Math.min(...kids.map((b) => b.left)), t = Math.min(...kids.map((b) => b.top)), rr = Math.max(...kids.map((b) => b.right)), bb = Math.max(...kids.map((b) => b.bottom));
    return { left: l, top: t, right: rr, bottom: bb, width: rr - l, height: bb - t };
  };
  const sections = [...document.querySelectorAll('main .shopify-section, .shopify-section-group-footer-group')]
    .filter((s) => !s.parentElement.closest('.shopify-section') && getComputedStyle(s).display !== 'none' && box(s) && !['fixed', 'sticky', 'absolute'].includes(getComputedStyle(s).position));
  const content = (s) => {
    let t = Infinity, b = -Infinity;
    for (const el of s.querySelectorAll('*')) {
      if (el.closest(PLATFORM)) continue;
      const leaf = el.matches('img, video, picture, input, button, select, textarea, iframe') || (el.tagName === 'svg' && el.getBoundingClientRect().width >= 16) || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!leaf || !vis(el) || srOnly(el)) continue;
      let floating = false, top = el.getBoundingClientRect().top, bottom = el.getBoundingClientRect().bottom;
      for (let a = el; a && a !== s; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.position === 'fixed' || cs.position === 'sticky') { floating = true; break; }
        if (a !== el && cs.overflowY !== 'visible') { const ar = a.getBoundingClientRect(); top = Math.max(top, ar.top); bottom = Math.min(bottom, ar.bottom); }
      }
      if (floating || bottom <= top) continue;
      t = Math.min(t, top + scrollY); b = Math.max(b, bottom + scrollY);
    }
    return t === Infinity ? null : { t, b };
  };
  const painted = (s) => {
    const sr = box(s);
    for (const el of [s, ...s.querySelectorAll('*')]) {
      const r = el.getBoundingClientRect();
      if (r.width < sr.width * 0.95 || r.height < Math.min(sr.height * 0.6, 200) || !vis(el)) continue;
      const cs = getComputedStyle(el);
      const bg = rgba(cs.backgroundColor);
      if ((bg && bg.a > 0.05 && cs.backgroundColor !== bodyBg) || cs.backgroundImage !== 'none' || el.matches('img, video, picture')) return { t: r.top + scrollY, b: r.bottom + scrollY };
    }
    return null;
  };
  const sectionInfo = sections.map((s) => ({ id: s.id.replace('shopify-section-', '').slice(0, 60), c: content(s), p: painted(s) })).filter((x) => x.c);
  const touching = [], tight = [];
  for (let i = 1; i < sectionInfo.length; i++) {
    const A = sectionInfo[i - 1], B = sectionInfo[i];
    if (A.p && B.p) continue;
    let gap, need;
    if (!A.p && !B.p) { gap = B.c.t - A.c.b; need = 24; }
    else if (!A.p) { gap = B.p.t - A.c.b; need = 16; }
    else { gap = B.c.t - A.p.b; need = 16; }
    if (gap < 8) touching.push(`${A.id} -> ${B.id}: ${Math.round(gap)}px`);
    else if (gap < need) tight.push(`${A.id} -> ${B.id}: ${Math.round(gap)}px (< ${need})`);
  }
  const gutter = [];
  if (vw < 1024) for (const el of textEls) {
    if (srOnly(el) || el.closest('.swiper, [class*="marquee"], [class*="announcement"], [aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.left < 0 || r.right > vw) continue;
    const range = document.createRange(); range.selectNodeContents(el); const tr = range.getBoundingClientRect();
    let tl = tr.left, trr = tr.right;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) { const as = getComputedStyle(a); if (as.overflowX !== 'visible') { const ar = a.getBoundingClientRect(); tl = Math.max(tl, ar.left); trr = Math.min(trr, ar.right); } }
    if (tl < 12 || vw - trr < 12) gutter.push(`${desc(el)} L${Math.round(tl)} R${Math.round(vw - trr)} "${el.textContent.trim().slice(0, 20)}"`);
  }
  const inter = all.filter((el) => el.matches('a[href], button, input:not([type=hidden]), select, textarea, summary, [role="button"]') && vis(el) && !srOnly(el));
  const overlap = [], layered = [];
  const boxes = inter.map((el) => ({ el, r: el.getBoundingClientRect() }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const inline = (el) => getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length;
    if (a.el.parentElement === b.el.parentElement && inline(a.el) && inline(b.el)) continue;
    if (a.el.matches('input[type=radio], input[type=checkbox]') || b.el.matches('input[type=radio], input[type=checkbox]')) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 2 && oy > 2) {
      const small = a.r.width * a.r.height <= b.r.width * b.r.height ? a.r : b.r;
      (small.width < 24 || small.height < 24 ? overlap : layered).push(`${desc(a.el)} x ${desc(b.el)} (${Math.round(ox)}x${Math.round(oy)})`);
    }
  }

  // Icons
  const svgs = [...document.querySelectorAll('svg')].filter((s) => !s.closest(PLATFORM));
  const unresolved = [], empty = [], collapsed = [], exposed = [];
  for (const s of svgs) {
    for (const u of s.querySelectorAll('use')) {
      const h = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
      if (h.startsWith('#')) { const t = document.getElementById(h.slice(1)); if (!t || !t.querySelector('path, circle, rect, line, polyline, polygon, ellipse')) unresolved.push(`${desc(s)} -> ${h}`); }
    }
    if (!vis(s)) continue;
    const r = s.getBoundingClientRect();
    if (r.width > 64 || r.height > 64) continue;
    if (!s.querySelector('path, circle, rect, line, polyline, polygon, ellipse, use, text, image')) empty.push(desc(s));
    if (r.width < 8 || r.height < 8) collapsed.push(`${desc(s)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    if (s.getAttribute('aria-hidden') !== 'true' && !s.closest('[aria-hidden="true"]') && !(s.getAttribute('role') === 'img' && (s.getAttribute('aria-label') || s.querySelector('title')))) exposed.push(desc(s));
  }
  const visText = (el) => { let t = ''; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const p = n.parentElement; if (p.closest('svg') || srOnly(p) || !vis(p)) continue; t += n.textContent; } return t.trim(); };
  const nameOf = (el) => { const lb = el.getAttribute('aria-labelledby'); return (el.getAttribute('aria-label') || (lb ? lb.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ') : '') || el.getAttribute('title') || el.textContent || (el.querySelector('img[alt]') || {}).alt || '').trim(); };
  const iconOnly = inter.filter((el) => el.querySelector('svg') && !visText(el) && !el.querySelector('img'));
  const unnamed = [], small = [], lowContrast = [], misaligned = [];
  const centers = inter.map((el) => { const r = el.getBoundingClientRect(); return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  for (const el of iconOnly) {
    if (!nameOf(el)) unnamed.push(desc(el));
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const crowded = centers.some((c) => c.el !== el && !c.el.contains(el) && !el.contains(c.el) && Math.hypot(c.x - cx, c.y - cy) < 24);
      if (crowded) small.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    const s = [...el.querySelectorAll('svg')].find(vis);
    if (!s) continue;
    const sc = getComputedStyle(s);
    const paint = (() => {
      // Sprite icons paint through <use>: the outer <svg> keeps the UA default fill (black), the symbol carries fill/stroke.
      const use = s.querySelector('use');
      const sym = use ? document.getElementById((use.getAttribute('href') || use.getAttribute('xlink:href') || '').slice(1)) : null;
      const shape = sym ? sym.querySelector('path, circle, rect, line, polyline, polygon, ellipse') : null;
      const attr = (n) => (shape && shape.getAttribute(n)) || (sym && sym.getAttribute(n)) || null;
      const cc = (v) => (v === 'currentColor' ? sc.color : v);
      const fill = sym && attr('fill') ? cc(attr('fill')) : sc.fill;
      const stroke = sym && attr('stroke') ? cc(attr('stroke')) : sc.stroke;
      return fill !== 'none' && !fill.startsWith('url') ? fill : stroke !== 'none' ? stroke : sc.color;
    })();
    let fg = rgba(paint);
    if (!fg) continue;
    fg = { ...fg, a: fg.a * Number(sc.opacity) };
    const sr = s.getBoundingClientRect();
    const stack = document.elementsFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
    let bg = null, media = false;
    for (const e of stack) {
      if (s.contains(e) || e === s) continue;
      if (e.matches('img, video, canvas, picture')) { media = true; break; }
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') { media = true; break; }
      const c = rgba(cs.backgroundColor);
      if (c && c.a >= 0.9) { bg = c; break; }
    }
    if (media || !bg) continue;
    const cr = ratio(blend(fg, bg), bg);
    if (cr < 3) lowContrast.push(`${desc(el)} ${cr.toFixed(2)}:1 (${paint} on ${getComputedStyle(stack.find((e) => rgba(getComputedStyle(e).backgroundColor) && rgba(getComputedStyle(e).backgroundColor).a >= 0.9) || document.body).backgroundColor})`);
  }
  for (const el of inter) {
    const s = [...el.querySelectorAll('svg')].find((x) => vis(x) && x.getBoundingClientRect().width <= 32);
    if (!s || !visText(el)) continue;
    const range = document.createRange();
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, tr = null;
    while ((n = w.nextNode())) { const p = n.parentElement; if (p.closest('svg') || srOnly(p) || !vis(p) || !n.textContent.trim()) continue; range.selectNodeContents(n); const b = range.getBoundingClientRect(); if (b.height) tr = tr ? { t: Math.min(tr.t, b.top), b: Math.max(tr.b, b.bottom), l: Math.min(tr.l, b.left), r: Math.max(tr.r, b.right) } : { t: b.top, b: b.bottom, l: b.left, r: b.right }; }
    if (!tr || tr.b - tr.t > 40) continue;
    const sr = s.getBoundingClientRect();
    const sideBySide = sr.right <= tr.l + 2 || sr.left >= tr.r - 2;
    if (!sideBySide) continue;
    const d = (sr.top + sr.height / 2) - (tr.t + tr.b) / 2;
    if (Math.abs(d) > 3) misaligned.push(`${desc(el)} ${d.toFixed(1)}px`);
  }
  return { fam, fontsStatus: document.fonts.status, foreign, controlFont, missingFamily, weightMismatch, tiny, micro, tightLh, smallInputs, touching, tight, sectionsMeasured: sectionInfo.length, gutter, overlap, layered, unresolved, empty, collapsed, exposed: exposed.length, iconOnly: iconOnly.length, unnamed, small, lowContrast, misaligned };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const raw = {};
  try {
    for (const w of WIDTHS) for (const route of ROUTES) {
      const J = `${w} ${route}`;
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : w < 1024 ? 1024 : 900 } });
      await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
      const page = await ctx.newPage();
      try {
        const resp = await gotoStore(page, route, { allowStatus: /does-not-exist/.test(route) ? [404] : [] });
        const status = resp ? resp.status() : null;
        await settle(page);
        if (process.env.FSI_CSS) await page.addStyleTag({ content: process.env.FSI_CSS });
        await page.evaluate(() => document.fonts.ready);
        const d = await page.evaluate(collect);
        raw[J] = d;
        const cap = (a) => a.slice(0, 6);
        rec(J, 'route answers its expected status', status === (/does-not-exist/.test(route) ? 404 : 200), status);
        rec(J, 'fonts: every text element uses a theme family', d.foreign.length === 0, cap(d.foreign));
        rec(J, 'fonts: form controls inherit theme family', d.controlFont.length === 0, cap(d.controlFont));
        rec(J, 'fonts: used families are loaded', d.missingFamily.length === 0 && d.fontsStatus === 'loaded', { status: d.fontsStatus, missing: d.missingFamily });
        rec(J, 'fonts: every used weight/style has its own face', d.weightMismatch.length === 0, d.weightMismatch);
        rec(J, 'fonts: no text below the 11px micro step (DESIGN.md)', d.tiny.length === 0, cap(d.tiny));
        rec(J, 'fonts: 11px text is a micro label (uppercase, count pill or .content-size-xs)', d.micro.length === 0, cap(d.micro));
        rec(J, 'fonts: multi-line text keeps line-height >= 1', d.tightLh.length === 0, cap(d.tightLh));
        if (w < 768) rec(J, 'fonts: inputs >= 16px on mobile (iOS zoom, advisory)', null, cap(d.smallInputs));
        if (d.sectionsMeasured < 2) rec(J, 'spacing: adjacent sections do not touch', null, `only ${d.sectionsMeasured} section(s) measured`);
        else rec(J, 'spacing: adjacent sections do not touch (< 8px)', d.touching.length === 0, { measured: d.sectionsMeasured, touching: d.touching });
        if (d.tight.length) rec(J, 'spacing: section gap below rhythm (advisory)', null, d.tight);
        if (w < 1024) rec(J, 'spacing: text keeps >= 12px viewport gutter', d.gutter.length === 0, cap(d.gutter));
        rec(J, 'spacing: overlapping targets keep >= 24px each', d.overlap.length === 0, cap(d.overlap));
        if (d.layered.length) rec(J, 'spacing: layered targets by design (advisory)', null, cap(d.layered));
        rec(J, 'icons: every <use> resolves to a drawn symbol', d.unresolved.length === 0, cap(d.unresolved));
        rec(J, 'icons: no empty or collapsed icon', d.empty.length + d.collapsed.length === 0, { empty: cap(d.empty), collapsed: cap(d.collapsed) });
        rec(J, 'icons: icon-only controls have a name', d.iconOnly ? d.unnamed.length === 0 : null, { iconOnly: d.iconOnly, unnamed: cap(d.unnamed) });
        rec(J, 'icons: icon-only targets >= 24px or spaced', d.small.length === 0, cap(d.small));
        rec(J, 'icons: icon contrast >= 3:1 on solid backgrounds', d.lowContrast.length === 0, cap(d.lowContrast));
        rec(J, 'icons: icon centred with its label (<= 3px)', d.misaligned.length === 0, cap(d.misaligned));
        rec(J, 'icons: decorative svg exposed to AT (advisory)', null, d.exposed);
      } catch (e) {
        rec(J, 'ran', false, e.message.split('\n')[0]);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  ensureDir(path.dirname(OUT));
  fs.writeFileSync(OUT, JSON.stringify({ results, raw }, null, 1));
  const c = { PASS: 0, FAIL: 0, INFO: 0 };
  results.forEach((r) => c[r.ok === null ? 'INFO' : r.ok ? 'PASS' : 'FAIL']++);
  console.log('SUMMARY', JSON.stringify(c));
  process.exit(c.FAIL ? 1 : 0);
})().catch((e) => { console.error('ERR', e.stack); process.exit(2); });
