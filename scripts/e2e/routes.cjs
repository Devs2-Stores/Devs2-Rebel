const HANDLE = /^[A-Za-z0-9_-]+$/;
const pick = (name, fallback) => {
  const v = process.env[name] || fallback;
  if (!HANDLE.test(v)) throw new Error(`${name} must match ${HANDLE}: ${JSON.stringify(v)}`);
  return v;
};

const PRODUCT = pick('E2E_PRODUCT', 'rebel-tactical-bomber-jacket');
const PRODUCT2 = pick('E2E_PRODUCT2', 'leather-care-balm');
const BLOG_HANDLE = pick('E2E_BLOG', 'news');
const ARTICLE_HANDLE = pick('E2E_ARTICLE', 'leather-care-101');

const PDP = `/products/${PRODUCT}`;
const PDP2 = `/products/${PRODUCT2}`;
const ARTICLE = `/blogs/${BLOG_HANDLE}/${ARTICLE_HANDLE}`;

const GATE_ROUTES = [
  '/', '/collections', '/collections/all', PDP, PDP2, '/cart',
  '/search?q=jacket', '/pages/about', '/pages/contact', '/pages/contact?view=faq', '/pages/contact?view=stores',
  `/blogs/${BLOG_HANDLE}`, ARTICLE,
];

async function discover(base) {
  const origin = new URL(base).origin;
  const html = async (route) => {
    const res = await fetch(origin + route, { redirect: 'follow' });
    if (!res.ok) throw new Error(`${route} answered ${res.status}`);
    return res.text();
  };
  const unique = (text, re) => [...new Set([...text.matchAll(re)].map((m) => m[1]))];
  const products = unique(await html('/collections/all'), /\/products\/([A-Za-z0-9_-]+)/g);
  const articles = unique(await html(`/blogs/${BLOG_HANDLE}`), new RegExp(`/blogs/${BLOG_HANDLE}/([A-Za-z0-9_-]+)`, 'g')).filter((h) => h !== 'tagged');
  if (products.length < 2 || !articles.length) {
    throw new Error(`discovery found ${products.length} product handle(s) and ${articles.length} article handle(s) at ${origin}; need 2 and 1`);
  }
  return [`export E2E_PRODUCT=${products[0]}`, `export E2E_PRODUCT2=${products[1]}`, `export E2E_ARTICLE=${articles[0]}`].join('\n');
}

module.exports = { GATE_ROUTES, PDP, PDP2, BLOG_HANDLE, ARTICLE };

if (require.main === module) {
  const [flag, arg] = process.argv.slice(2);
  if (flag === '--routes') {
    process.stdout.write(GATE_ROUTES.join(',') + '\n');
  } else if (flag === '--discover' && arg) {
    discover(arg).then((out) => process.stdout.write(out + '\n'), (e) => { console.error('discover failed: ' + e.message); process.exit(2); });
  } else {
    console.error('usage: node routes.cjs --routes | --discover <base-url>');
    process.exit(2);
  }
}
