const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:9292';
const ROOT = path.resolve(__dirname, '..', '..');

function classifyUrl(u) {
  if (!u) return 'unknown';
  if (/monorail|web-pixels|\/api\/(unstable|20\d\d-\d\d)\/graphql|shop\.app|shopify-account|cdn\.shopify\.com\/shopifycloud|\/checkouts\/internal|captcha|perf-kit|\/\.well-known\//i.test(u)) return 'platform';
  if (u.startsWith(BASE) && /\/assets\//.test(u)) return 'theme-asset';
  if (u.startsWith(BASE)) return 'storefront';
  return 'third-party';
}

function attachLogs(page) {
  const log = { console: [], pageErrors: [], badResponses: [], failedRequests: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push({ text: m.text().slice(0, 300), url: (m.location() || {}).url || '' });
  });
  page.on('pageerror', (e) => log.pageErrors.push({ message: String(e.message).slice(0, 300), stack: String(e.stack || '').split('\n').slice(0, 3).join(' | ').slice(0, 400) }));
  page.on('response', (r) => {
    if (r.status() >= 400) log.badResponses.push({ status: r.status(), url: r.url().slice(0, 200), cls: classifyUrl(r.url()) });
  });
  page.on('requestfailed', (r) => {
    const f = r.failure();
    if (f && /ERR_ABORTED/.test(f.errorText)) return;
    log.failedRequests.push({ url: r.url().slice(0, 200), err: f && f.errorText, cls: classifyUrl(r.url()) });
  });
  return log;
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const RETRY_STATUS = new Set([502, 503, 504]);

async function gotoStore(page, route, opts = {}) {
  const allow = opts.allowStatus || [];
  const deadline = Date.now() + Number(process.env.E2E_GATE_WAIT_MS || 30000);
  const go = async () => {
    let resp = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      resp = await page.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
      const st = resp ? resp.status() : 0;
      if (!RETRY_STATUS.has(st) || allow.includes(st)) break;
      await page.waitForTimeout(1500);
    }
    return resp;
  };
  const accept = (resp) => {
    const st = resp ? resp.status() : 0;
    if (st === 401) throw new Error(`DEV_SERVER_UNAUTHORIZED: ${route} returned 401; restart shopify theme dev`);
    if (!(st >= 200 && st < 300) && !allow.includes(st)) throw new Error(`UNEXPECTED_STATUS: ${route} returned ${st}; pass { allowStatus: [${st}] } only for a deliberate error page`);
    return resp;
  };
  for (;;) {
    const resp = await go();
    if (resp && resp.status() === 401) accept(resp);
    if (new URL(page.url()).pathname !== '/password') return accept(resp);
    if (!LOCAL_HOSTS.has(new URL(BASE).hostname)) throw new Error(`PASSWORD_GATE: ${BASE} is not a local dev server; refusing to type REBEL_SHOPIFY into it`);
    try { process.loadEnvFile(path.join(ROOT, '.env')); } catch (e) {}
    const pass = process.env.REBEL_SHOPIFY;
    if (pass) {
      await page.fill('input[type="password"]', pass);
      await Promise.all([page.waitForNavigation({ timeout: 60000 }), page.press('input[type="password"]', 'Enter')]);
      const again = await go();
      if (new URL(page.url()).pathname === '/password') throw new Error('PASSWORD_GATE: storefront password rejected');
      return accept(again);
    }
    if (Date.now() > deadline) throw new Error('PASSWORD_GATE: dev server redirects to /password and REBEL_SHOPIFY is not set');
    await page.waitForTimeout(5000);
  }
}

async function settle(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

function recorder() {
  const results = [];
  const rec = (journey, name, ok, detail) => {
    results.push({ journey, name, ok: ok === null ? null : !!ok, detail: detail === undefined ? null : detail });
    const tag = ok === null ? 'INFO' : ok ? 'PASS' : 'FAIL';
    console.log(`[${tag}] ${journey} :: ${name}${ok === true ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400)}`);
  };
  return { results, rec };
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
  return d;
}

module.exports = { BASE, ROOT, attachLogs, gotoStore, settle, recorder, ensureDir, classifyUrl };
