const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { BASE, gotoStore, settle, ensureDir, ROOT } = require('./lib.cjs');

const OUT = process.env.SH_OUT || path.join(require('os').tmpdir(), 'store-hours.json');
const ROUTE = '/pages/contact?view=stores';
const INSTANTS = ['2026-10-11T15:30:00Z', '2026-10-12T02:30:00Z'];
const BROWSER_ZONES = ['America/New_York', 'Asia/Tokyo'];
const OFFLINE = process.env.SH_LIVE !== '1';
const STORES = [
  { name: 'NY', address: '1 Main St', province: 'New York', district: 'Manhattan', hours: '09:00 - 17:00', timezone: 'America/New_York' },
  { name: 'London', address: '2 High St', province: 'London', district: 'Soho', hours: '10:00 - 18:00', timezone: 'Europe/London' },
  { name: 'Tokyo', address: '3 Ginza', province: 'Tokyo', district: 'Ginza', hours: '11:00 - 19:00', timezone: 'Asia/Tokyo' },
  { name: 'NoZone', address: '4 Elm St', province: 'New York', district: 'Queens', hours: '09:00 - 17:00', timezone: '' },
  { name: 'BadZone', address: '5 Oak St', province: 'New York', district: 'Bronx', hours: '09:00 - 17:00', timezone: 'Not/AZone' },
  { name: 'NoHours', address: '6 Pine St', province: 'New York', district: 'Brooklyn', hours: '', timezone: '' }
];
const OFFLINE_ORIGIN = 'http://stores.test';

function offlineHtml() {
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const strings = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales/en.default.json'), 'utf8')).sections.page_stores;
  const cards = STORES.map((s) => {
    return `<div class="stores-card" data-store-name="${esc(s.name)}" data-store-address="${esc(s.address)}" data-store-province="${esc(s.province)}" data-store-district="${esc(s.district)}" data-store-hours="${esc(s.hours)}" data-store-timezone="${esc((s.timezone || '').trim())}">${s.hours ? '<span class="stores-card__status" data-store-status></span>' : ''}</div>`;
  }).join('\n');
  return `<!doctype html><html><head><title>stores</title></head><body><stores-page data-all-districts="${esc(strings.all_districts)}" data-count-template="${esc(strings.count)}" data-open-label="${esc(strings.open_now)}" data-closed-label="${esc(strings.closed_now)}" data-shop-utc-offset="-0400"><input id="stores-search"><select id="stores-province"><option value=""></option></select><select id="stores-district" disabled><option value=""></option></select><p id="stores-count"></p><button id="stores-clear" hidden></button><div id="stores-grid">${cards}</div><p id="stores-empty" hidden></p></stores-page><script src="/page-stores.js"></script></body></html>`;
}

async function loadPage(page, rewrite) {
  if (OFFLINE) {
    const html = offlineHtml();
    await page.route(`${OFFLINE_ORIGIN}/**`, (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === '/page-stores.js') return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(process.env.SH_JS || path.join(ROOT, 'assets/page-stores.js'), 'utf8') });
      const out = rewrite ? rewrite(html) : html;
      if (rewrite && out === html) throw new Error('variant rewrite did not change the fixture');
      return route.fulfill({ contentType: 'text/html', body: out });
    });
    await page.goto(`${OFFLINE_ORIGIN}/`);
    return;
  }
  await page.route((u) => /\/assets\/page-stores\.js$/.test(u.pathname), (route) => route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(ROOT, 'assets/page-stores.js'), 'utf8') }));
  if (!liveHtml) {
    const resp = await gotoStore(page, ROUTE);
    liveHtml = await resp.text();
    if (!rewrite) return;
  }
  await page.route((u) => u.pathname === '/pages/contact', (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: rewrite ? rewrite(liveHtml) : liveHtml }));
  await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded', timeout: 90000 });
}

let liveHtml = null;

function expectedOpen(zone, offset, hours, instant) {
  const m = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/.exec(hours);
  if (!m) return null;
  let minutes;
  if (zone) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
    minutes = (Number(parts.hour) % 24) * 60 + Number(parts.minute);
  } else if (offset !== null) {
    const d = new Date(new Date(instant).getTime() + offset * 60000);
    minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  } else return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  return minutes >= start && minutes < end;
}

function parseOffset(v) {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(v || '');
  if (!m) return null;
  const n = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === '-' ? -n : n;
}

async function read(page) {
  return page.evaluate(() => {
    const root = document.querySelector('stores-page');
    return {
      offset: root.getAttribute('data-shop-utc-offset'),
      open: root.dataset.openLabel,
      closed: root.dataset.closedLabel,
      liveRegions: document.querySelectorAll('[data-store-status][aria-live]').length,
      cards: [...root.querySelectorAll('.stores-card')].map((c) => {
        const s = c.querySelector('[data-store-status]');
        return { name: c.dataset.storeName, zone: c.getAttribute('data-store-timezone'), hours: c.dataset.storeHours, text: s ? s.textContent : null, cls: s ? s.className : null };
      })
    };
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const liquid = fs.readFileSync(path.join(ROOT, 'sections/page-stores.liquid'), 'utf8');
  const lost = ['data-store-hours', 'data-store-timezone', 'data-store-status', 'data-shop-utc-offset', 'data-open-label', 'data-closed-label'].filter((a) => !liquid.includes(a));
  const report = { runs: [], failures: lost.map((a) => ({ error: 'sections/page-stores.liquid lost ' + a })) };
  try {
    const variants = [
      { name: 'zones', rewrite: null },
      { name: 'fallback-offset', rewrite: (html) => html.replace('data-store-timezone="America/New_York"', 'data-store-timezone=""').replace('data-store-timezone="Europe/London"', 'data-store-timezone="Not/AZone"') },
      { name: 'no-offset', rewrite: (html) => html.replace(/data-shop-utc-offset="[^"]*"/, '').replace('data-store-timezone="America/New_York"', 'data-store-timezone=""') }
    ];
    for (const variant of variants) {
      for (const instant of INSTANTS) {
        const byZone = {};
        for (const zone of BROWSER_ZONES) {
          const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: zone });
          await ctx.addInitScript(() => { try { localStorage.setItem('newsletter_popup_closed', 'true'); } catch (e) {} });
          const page = await ctx.newPage();
          await page.clock.setFixedTime(new Date(instant));
          await loadPage(page, variant.rewrite);
          await page.waitForSelector('stores-page');
          await page.waitForFunction(() => customElements.get('stores-page'));
          const data = await read(page);
          const offset = parseOffset(data.offset);
          let mismatches = 0;
          data.cards.forEach((c) => {
            const exp = expectedOpen(c.zone && !/^Not\//.test(c.zone) ? c.zone : '', offset, c.hours, instant);
            const want = exp === null ? '' : exp ? data.open : data.closed;
            c.expected = want;
            if ((c.text == null ? '' : c.text) !== want) { mismatches++; report.failures.push({ variant: variant.name, instant, zone, card: c.name, cardZone: c.zone, got: c.text, want }); }
          });
          const decided = data.cards.filter((c) => c.text === data.open || c.text === data.closed).length;
          const need = { zones: 5, 'fallback-offset': 5, 'no-offset': 2 }[variant.name];
          if (decided < need) report.failures.push({ variant: variant.name, instant, zone, error: `status logic not exercised: ${decided} of ${need} expected card(s) got a verdict` });
          byZone[zone] = data.cards.map((c) => c.text).join('|');
          report.runs.push({ variant: variant.name, instant, browserZone: zone, offset: data.offset, liveRegions: data.liveRegions, cards: data.cards.length, open: data.cards.filter((c) => c.text === data.open).length, closed: data.cards.filter((c) => c.text === data.closed).length, blank: data.cards.filter((c) => c.text === '').length, mismatches, sample: data.cards.filter((c, i) => i < 2 || /SoHo|Shoreditch|Ginza|District 1|Silver Lake|Surry/.test(c.name)).map((c) => `${c.name} [${c.zone}] ${c.hours} -> ${c.text}`) });
          await ctx.close();
        }
        const vals = Object.values(byZone);
        if (vals.some((v) => v !== vals[0])) report.failures.push({ variant: variant.name, instant, error: 'status differs by browser time zone' });
      }
    }
  } finally {
    await browser.close();
  }
  ensureDir(path.dirname(OUT));
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  report.runs.forEach((r) => console.log(`${r.variant} ${r.instant} ${r.browserZone} offset=${r.offset} live=${r.liveRegions} cards=${r.cards} open=${r.open} closed=${r.closed} blank=${r.blank} mismatch=${r.mismatches}`));
  console.log(`failures ${report.failures.length}`, JSON.stringify(report.failures.slice(0, 6)));
  process.exit(report.failures.length ? 1 : 0);
})().catch((e) => { console.error('ERR', e.stack); process.exit(2); });
