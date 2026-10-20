const fs = require('fs');
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../../../node_modules/playwright'));
const BASE = 'http://127.0.0.1:9292';
const OUT = path.join(__dirname, process.env.PHASE || 'after');
fs.mkdirSync(OUT, { recursive: true });
const ROUTES = {
  blog: '/blogs/sustainable-fashion-eco-tech',
  'blog-empty': '/blogs/news',
  article: '/blogs/sustainable-fashion-eco-tech/bio-textiles-mycelium-algae-and-the-lab-grown-revolution',
  about: '/pages/about',
  contact: '/pages/contact',
  faq: '/pages/contact?view=faq',
  stores: '/pages/contact?view=stores',
  404: '/pages/does-not-exist-404',
  password: '/password',
};
const VPS = { desktop: [1440, 900], tablet: [768, 1024], mobile: [375, 812] };
const only = (process.env.ONLY || Object.keys(ROUTES).join(',')).split(',');
const vpOnly = (process.env.VPS || Object.keys(VPS).join(',')).split(',');
(async () => {
  const browser = await chromium.launch();
  const report = {};
  try {
    for (const vn of vpOnly) {
      const [w, h] = VPS[vn];
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.route(/__hot-reload|\/hot-reload|livereload/, (r) => r.abort());
      for (const name of only) {
        const page = await ctx.newPage();
        const errs = [];
        page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
        try {
          await page.goto(BASE + ROUTES[name], { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForTimeout(1500);
          await page.evaluate(async () => {
            const H = document.documentElement.scrollHeight;
            for (let y = 0; y < H; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
            window.scrollTo(0, 0);
          });
          await page.waitForTimeout(700);
          const m = await page.evaluate(() => {
            const vw = document.documentElement.clientWidth;
            const wide = [...document.querySelectorAll('body *')].filter((e) => {
              const r = e.getBoundingClientRect();
              if (!r.width || getComputedStyle(e).position === 'fixed') return false;
              if (e.closest('[aria-hidden="true"], .visually-hidden, .sr-only, .mobile-menu, .skip-to-content-link, [class*="drawer"], [class*="cart-modal"]')) return false;
              return r.right > vw + 1 || r.left < -1;
            }).slice(0, 8).map((e) => e.tagName + '.' + String(e.className).slice(0, 60));
            const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).length;
            return { of: document.documentElement.scrollWidth - vw, wide, broken, h1: [...document.querySelectorAll('h1')].map((x) => x.textContent.trim().slice(0, 50)), tm: /Translation missing/i.test(document.body.innerText) };
          });
          m.pe = errs.length ? errs : 0;
          report[`${vn} ${name}`] = m;
          console.log(vn, name, JSON.stringify(m));
          await page.screenshot({ path: path.join(OUT, `${vn}-${name}-full.png`), fullPage: true, timeout: 60000 });
        } catch (e) {
          console.log(vn, name, 'ERR', e.message.split('\n')[0]);
        }
        await page.close();
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(OUT, `capture-${process.env.TAG || 'all'}.json`), JSON.stringify(report, null, 1));
  }
})();
