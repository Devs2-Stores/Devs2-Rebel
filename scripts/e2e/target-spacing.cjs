const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');
const { gotoStore, settle } = require('./lib.cjs');
const { GATE_ROUTES } = require('./routes.cjs');

const ROUTES = (process.env.TS_ROUTES || GATE_ROUTES.join(',')).split(',');
const WIDTHS = (process.env.TS_WIDTHS || '375,1440').split(',').map(Number);
const OUT = process.env.TS_OUT || path.join(os.tmpdir(), 'e2e-target-spacing', 'target-spacing.json');

function measure() {
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex="-1"])';
  const vis = (el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && el.getClientRects().length > 0;
  const targets = [...document.querySelectorAll(SEL)].filter((el) => vis(el) && !el.closest('[inert], [aria-hidden="true"]'))
    .filter((el, _, all) => !all.some((o) => o !== el && o.contains(el)));
  const boxes = targets.map((el) => { const r = el.getBoundingClientRect(); return { el, l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY, w: r.width, h: r.height }; })
    .filter((x) => x.w > 0 && x.h > 0);
  const inSentence = (el) => {
    const p = el.parentElement;
    if (!p || getComputedStyle(el).display !== 'inline') return false;
    const own = el.textContent.trim().length;
    return [...p.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0) && p.textContent.trim().length > own + 20;
  };
  const rectDist = (cx, cy, x) => Math.hypot(Math.max(x.l - cx, 0, cx - x.r), Math.max(x.t - cy, 0, cy - x.b));
  const desc = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}"`;
  const small = boxes.filter((x) => x.w < 24 || x.h < 24);
  const rows = [];
  for (const s of small) {
    const cx = (s.l + s.r) / 2, cy = (s.t + s.b) / 2;
    let worstTarget = Infinity, worstCircle = Infinity, nearT = null, nearC = null;
    for (const o of boxes) {
      if (o === s) continue;
      const d = rectDist(cx, cy, o);
      if (d < worstTarget) { worstTarget = d; nearT = o; }
      if (o.w < 24 || o.h < 24) {
        const c = Math.hypot(cx - (o.l + o.r) / 2, cy - (o.t + o.b) / 2);
        if (c < worstCircle) { worstCircle = c; nearC = o; }
      }
    }
    const sentence = inSentence(s.el);
    const pass = sentence || (worstTarget >= 12 && worstCircle >= 24);
    rows.push({
      target: desc(s.el), size: [+s.w.toFixed(1), +s.h.toFixed(1)], y: Math.round(s.t), inSentence: sentence,
      circleToTargetPx: Math.round(worstTarget), nearestTarget: nearT ? desc(nearT.el) : null,
      centreToSmallCentrePx: worstCircle === Infinity ? null : Math.round(worstCircle), nearestSmall: nearC ? desc(nearC.el) : null,
      pass,
    });
  }
  return { targets: boxes.length, small: small.length, rows };
}

const pair = (top, gap) => `<div style="position:absolute;top:${top}px;left:40px"><a href="#" style="position:absolute;left:0;width:16px;height:16px;display:block"></a><a href="#" style="position:absolute;left:${16 + gap}px;width:16px;height:16px;display:block"></a></div>`;
const FIXTURE = `<!doctype html><body style="margin:0;font:16px/1.5 sans-serif">
${pair(40, 4)}${pair(120, 8)}${pair(200, 24)}
<p style="position:absolute;top:400px;left:40px;width:300px">Read the full <a href="#">terms</a> before you place an order today.</p>
</body>`;

async function selfTest(browser) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(FIXTURE);
  const r = await page.evaluate(measure);
  await page.close();
  const at = (y) => r.rows.filter((x) => x.y === y).map((x) => x.pass);
  const gap4 = at(40), gap8 = at(120), gap24 = at(200);
  const inline = r.rows.filter((x) => x.inSentence).map((x) => x.pass);
  const ok = gap4.length === 2 && gap4.every((p) => !p) && gap8.length === 2 && gap8.every(Boolean)
    && gap24.length === 2 && gap24.every(Boolean) && inline.length === 1 && inline[0];
  return { ok, gap4, gap8, gap24, inline };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const st = await selfTest(browser);
  console.log('selftest', st.ok, JSON.stringify({ gap4: st.gap4, gap8: st.gap8, gap24: st.gap24, inline: st.inline }));
  if (!st.ok) { await browser.close(); process.exit(2); }
  const results = [];
  let fail = 0;
  for (const route of ROUTES) for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 }, ...(w < 768 ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
    const page = await ctx.newPage();
    await gotoStore(page, route);
    await settle(page);
    if (process.env.TS_MUTATE === 'adjacent') await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div style="position:absolute;top:300px;left:40px"><a href="#" style="position:absolute;left:0;width:16px;height:16px;display:block"></a><a href="#" style="position:absolute;left:20px;width:16px;height:16px;display:block"></a></div>'); });
    const r = await page.evaluate(measure);
    const bad = r.rows.filter((x) => !x.pass);
    fail += bad.length;
    console.log(`[${bad.length ? 'FAIL' : 'PASS'}] ${w} ${route} :: targets ${r.targets}, under 24px ${r.small}, failing 2.5.8 ${bad.length}${bad.length ? ' :: ' + JSON.stringify(bad.slice(0, 6)) : ''}`);
    results.push({ route, w, ...r });
    await ctx.close();
  }
  await browser.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log('SUMMARY', JSON.stringify({ runs: results.length, failing: fail }));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('ERR', e.stack); process.exit(2); });
