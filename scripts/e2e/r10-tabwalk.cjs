const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');
const { gotoStore, settle, ensureDir, ROOT } = require('./lib.cjs');
const { PDP } = require('./routes.cjs');

const ROUTES = (process.env.TW_ROUTES || ['/', PDP, '/collections/all', '/cart', '/pages/contact', '/pages/about', '/pages/contact?view=faq', '/search?q=jacket', '/pages/contact?view=stores', '/pages/does-not-exist-404'].join(',')).split(',');
const WIDTHS = (process.env.TW_WIDTHS || '375,1440').split(',').map(Number);
const MAX = Number(process.env.TW_MAX || 600);
const OUT = process.env.TW_OUT || path.join(os.tmpdir(), 'e2e-tabwalk', 'tabwalk.json');

const SELFTEST_HTML = `<!doctype html><html><body>
<a href="#a">visible link</a>
<button style="opacity:0">opacity zero</button>
<div style="opacity:0.02"><a href="#b">faded parent</a></div>
<div aria-hidden="true"><a href="#c">aria hidden</a></div>
<a href="#d" style="display:inline-block;width:0;height:0;overflow:hidden">zero size</a>
<label for="r1" style="display:inline-block;padding:4px">pill</label><input id="r1" type="radio" name="g" style="position:absolute;width:1px;height:1px;clip:rect(0 0 0 0);overflow:hidden">
<style>label:has(+ input:focus-visible){outline:2px solid #000}</style>
<input id="r2" type="checkbox" style="position:absolute;width:1px;height:1px;clip:rect(0 0 0 0);overflow:hidden"><label for="r2">no ring</label>
<style>.fade{opacity:0;transition:opacity .3s linear}.fade:focus{opacity:1}</style><button class="fade">fade in on focus</button>
<a href="#off" style="position:absolute;left:-9999px;top:0">offscreen fixture</a>
<div id="shop-hcaptcha-badge-container"><a href="#cap" style="position:absolute;left:-9999px;top:0">captcha badge fixture</a></div>
<button>end</button>
</body></html>`;

async function probeFocused() {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return null;
  if (!window.__twSeen) window.__twSeen = new WeakMap();
  const seen = window.__twSeen.get(a) || 0;
  window.__twSeen.set(a, seen + 1);
  const chainOpacity = () => { let o = 1; for (let n = a; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const op0 = chainOpacity();
  const running = [];
  for (let n = a; n && n.nodeType === 1; n = n.parentElement) {
    n.getAnimations().forEach((x) => { const it = x.effect && x.effect.getTiming().iterations; if (it !== Infinity) running.push(x.finished.catch(() => {})); });
  }
  if (running.length) await Promise.race([Promise.all(running), new Promise((r) => setTimeout(r, 1000))]);
  const off = (q) => q.right <= 0 || q.left >= innerWidth || q.bottom <= 0 || q.top >= innerHeight;
  let r = a.getBoundingClientRect();
  if (off(r)) { await new Promise((res) => setTimeout(res, 500)); r = a.getBoundingClientRect(); }
  const cs = getComputedStyle(a);
  const op = chainOpacity();
  const clipped = (cs.clip && cs.clip !== 'auto' && /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip)) || (cs.clipPath && /inset\(50%\)/.test(cs.clipPath));
  const tiny = r.width <= 1 && r.height <= 1;
  const reasons = [];
  if (r.width === 0 || r.height === 0) reasons.push('zero-size');
  else if (tiny || clipped) reasons.push('clipped');
  if (op < 0.05) reasons.push('opacity ' + op.toFixed(3));
  if (cs.visibility === 'hidden' || cs.display === 'none') reasons.push('hidden');
  if (a.closest('[aria-hidden="true"]')) reasons.push('aria-hidden');
  if (a.closest('[inert]')) reasons.push('inert');
  let labelOk = null;
  if (reasons.length && a.labels && a.labels.length) {
    labelOk = [...a.labels].some((l) => {
      const lr = l.getBoundingClientRect();
      let lop = 1;
      for (let n = l; n && n.nodeType === 1; n = n.parentElement) lop *= Number(getComputedStyle(n).opacity);
      const ls = getComputedStyle(l);
      const ring = (ls.outlineStyle !== 'none' && parseFloat(ls.outlineWidth) > 0) || ls.boxShadow !== 'none';
      return lr.width > 1 && lr.height > 1 && lop >= 0.05 && ls.visibility !== 'hidden' && ring;
    });
  }
  const sec = a.closest('[id^="shopify-section"]');
  return {
    seen,
    sig: a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className ? '.' + a.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
    text: (a.innerText || a.getAttribute('aria-label') || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 40),
    section: sec ? sec.id.replace(/^shopify-section-(template|sections)--\d+__/, '') : null,
    box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    offscreen: off(r) && !a.closest('#shop-hcaptcha-badge-container'),
    reasons,
    labelOk,
    invisible: reasons.length > 0 && labelOk !== true,
    fadeIn: op0 < 0.05 && op >= 0.05,
  };
}

async function walk(page) {
  await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); window.__twSeen = new WeakMap(); });
  const stops = [];
  for (let i = 0; i < MAX; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(probeFocused);
    if (!s) continue;
    if (s.seen > 0) break;
    stops.push(s);
  }
  const bad = stops.filter((s) => s.invisible);
  const off = stops.filter((s) => s.offscreen);
  const unique = {};
  bad.forEach((s) => { const k = `${s.section}|${s.sig}|${s.reasons.join('+')}`; unique[k] = (unique[k] || 0) + 1; });
  return { stops: stops.length, cycled: stops.length < MAX, invisible: bad.length, fadeIn: stops.filter((s) => s.fadeIn).length, offscreenAfterFocus: off.length, labelExempt: stops.filter((s) => s.reasons.length && s.labelOk).length, unique, offscreenSamples: off.slice(0, 5).map((s) => `${s.sig} ${s.text} ${s.box}`) };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = {};
  let fail = 0;
  try {
    const st = await browser.newPage();
    await st.setContent(SELFTEST_HTML);
    const self = await walk(st);
    await st.close();
    const selfOk = self.invisible === 5 && self.labelExempt === 1 && self.fadeIn === 1 && self.cycled && self.offscreenAfterFocus === 1;
    report.selftest = { ok: selfOk, ...self };
    console.log('selftest', selfOk, JSON.stringify(self.unique));
    if (!selfOk) { fail++; throw new Error('selftest failed'); }
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 } });
      await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
      const page = await ctx.newPage();
      for (const route of ROUTES) {
        let r;
        for (let attempt = 1; ; attempt++) {
          try {
            await gotoStore(page, route, { allowStatus: /does-not-exist/.test(route) ? [404] : [] });
            await settle(page);
            if (process.env.TW_MUTATE === 'offscreen') await page.addStyleTag({ content: 'footer a[href]:first-of-type{position:absolute!important;left:-9999px!important}' });
            r = await walk(page);
            break;
          } catch (e) {
            if (attempt >= 3 || !/Execution context was destroyed|navigation/.test(e.message)) throw e;
          }
        }
        report[`${w} ${route}`] = r;
        if (r.invisible || r.offscreenAfterFocus || !r.cycled) fail++;
        console.log(w, route, 'stops', r.stops, 'cycled', r.cycled, 'invisible', r.invisible, 'fadeIn', r.fadeIn, 'labelExempt', r.labelExempt, 'offscreen', r.offscreenAfterFocus, JSON.stringify(r.unique).slice(0, 300), r.offscreenSamples.length ? 'OFFSCREEN ' + JSON.stringify(r.offscreenSamples) : '');
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    ensureDir(path.dirname(OUT));
    fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  }
  console.log('fail', fail);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERR', e.message); process.exit(2); });
