const fs = require('fs');
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../../../node_modules/playwright'));
const BASE = 'http://127.0.0.1:9292';
const OUT = path.join(__dirname, 'after');
(async () => {
  const browser = await chromium.launch();
  // contact validation
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let p = await ctx.newPage();
  await p.goto(BASE + '/pages/contact', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(1500);
  await p.click('.contact-form__submit');
  await p.waitForTimeout(700);
  console.log('contact', JSON.stringify(await p.evaluate(() => ({
    invalid: document.querySelectorAll('.contact-form .is-invalid').length,
    errors: [...document.querySelectorAll('.contact-form .form-error-message')].map((e) => e.textContent.trim()),
    focused: document.activeElement && document.activeElement.id,
    errColor: getComputedStyle(document.querySelector('.contact-form .form-error-message')).color,
    border: getComputedStyle(document.querySelector('.contact-form .is-invalid')).borderColor,
  }))));
  await p.screenshot({ path: path.join(OUT, 'desktop-contact-errors.png'), fullPage: false });
  await p.close();
  // password page
  p = await ctx.newPage();
  const r = await p.goto(BASE + '/password', { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('password status', r && r.status(), await p.title());
  await ctx.close();
  await browser.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
