const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../../../node_modules/playwright'));
const BASE = 'http://127.0.0.1:9292';
(async () => {
  const browser = await chromium.launch();
  const out = {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mk = async (u) => { const p = await ctx.newPage(); await p.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(1500); return p; };

  // contact validation
  let p = await mk('/pages/contact');
  await p.click('.contact-form__submit');
  await p.waitForTimeout(500);
  out.contact = await p.evaluate(() => ({
    invalid: document.querySelectorAll('.contact-form .is-invalid').length,
    errors: [...document.querySelectorAll('.contact-form .form-error-message')].map((e) => e.textContent.trim()),
    focused: document.activeElement && (document.activeElement.id || document.activeElement.className),
    errColor: (() => { const e = document.querySelector('.contact-form .form-error-message'); return e && getComputedStyle(e).color; })(),
    invalidBorder: (() => { const e = document.querySelector('.contact-form .is-invalid'); return e && getComputedStyle(e).borderColor; })(),
  }));
  await p.close();

  // faq toggle + search
  p = await mk('/pages/contact?view=faq');
  const first = p.locator('.faq-item').first();
  await first.locator('summary').click();
  await p.waitForTimeout(400);
  out.faq = { open: await first.evaluate((e) => e.open), answerVisible: await first.locator('.faq-item__answer').isVisible() };
  await p.fill('[data-faq-search]', 'delivery');
  await p.waitForTimeout(300);
  out.faq.visibleAfterSearch = await p.evaluate(() => [...document.querySelectorAll('.faq-item')].filter((i) => !i.hidden).length);
  await p.close();

  // stores
  p = await mk('/pages/contact?view=stores');
  out.stores = await p.evaluate(() => ({
    cards: document.querySelectorAll('.stores-card').length,
    hours: document.querySelectorAll('.stores-card__status').length,
    statuses: [...new Set([...document.querySelectorAll('.stores-card__status')].map((e) => e.textContent.trim()))],
    count: document.querySelector('.stores-sidebar__count') && document.querySelector('.stores-sidebar__count').textContent.trim(),
  }));
  await p.fill('.stores-sidebar__search-input', 'tokyo');
  await p.waitForTimeout(500);
  out.stores.afterSearch = await p.evaluate(() => [...document.querySelectorAll('.stores-card')].filter((c) => !c.classList.contains('is-hidden') && c.offsetParent).length);
  await p.close();

  // article toc scroll + overflow at 375
  p = await mk('/blogs/sustainable-fashion-eco-tech/bio-textiles-mycelium-algae-and-the-lab-grown-revolution');
  const link = p.locator('.toc__link').nth(2);
  const href = await link.getAttribute('href');
  await link.click();
  await p.waitForTimeout(1200);
  out.toc = await p.evaluate((h) => { const t = document.querySelector(h); return { href: h, scrollY: Math.round(scrollY), top: t ? Math.round(t.getBoundingClientRect().top) : null }; }, href);
  await p.close();

  const m = await browser.newContext({ viewport: { width: 375, height: 812 } });
  p = await m.newPage();
  await p.goto(BASE + '/blogs/sustainable-fashion-eco-tech/bio-textiles-mycelium-algae-and-the-lab-grown-revolution', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(1500);
  out.articleMobile = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('.article-template *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1); }).map((e) => e.tagName + '.' + e.className);
    return { docOverflow: document.documentElement.scrollWidth - vw, wideInArticle: bad.slice(0, 10) };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
