const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(p, 'utf8');

function stripLiquidComments(src) {
  let out = src.replace(/\{%-?\s*raw\s*-?%\}[\s\S]*?\{%-?\s*endraw\s*-?%\}/g, '');
  out = out.replace(/\{%-?\s*doc\s*-?%\}[\s\S]*?\{%-?\s*enddoc\s*-?%\}/g, '');
  const nested = /\{%-?\s*comment\s*-?%\}(?:(?!\{%-?\s*comment\s*-?%\})[\s\S])*?\{%-?\s*endcomment\s*-?%\}/g;
  for (let prev = null; prev !== out;) { prev = out; out = out.replace(nested, ''); }
  out = out.replace(/\{%-?\s*#[\s\S]*?-?%\}/g, '');
  return out.replace(/(\{%-?\s*liquid\b)([\s\S]*?)(-?%\})/g, (m, open, body, close) => {
    const kept = body
      .replace(/^[ \t]*comment[ \t]*\r?\n[\s\S]*?^[ \t]*endcomment[ \t]*$/gm, '')
      .replace(/^[ \t]*#.*$/gm, '');
    return open + kept + close;
  });
}

const readLiquid = (p) => stripLiquidComments(read(p));
const list = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((n) => n.endsWith('.liquid')).map((n) => path.join(dir, n));

const snippets = Object.fromEntries(list('snippets').map((p) => [path.basename(p, '.liquid'), readLiquid(path.join(ROOT, p))]));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function expand(src, seen = new Set()) {
  let out = src;
  const names = [
    ...[...src.matchAll(/\{%-?\s*(?:render|include)\s+'([\w-]+)'/g)].map((m) => m[1]),
    ...[...src.matchAll(/^\s*(?:render|include)\s+'([\w-]+)'/gm)].map((m) => m[1]),
  ];
  for (const n of names) {
    if (seen.has(n) || !(n in snippets)) continue;
    seen.add(n);
    out += '\n' + expand(snippets[n], seen);
  }
  return out;
}

const COMPUTED_FAMILIES = {
  'sections/team.liquid': [{ owner: 'block', id: /^social_\d+$/ }],
};

function unread(text, consumers = [], { rel = '', kind = 'section' } = {}) {
  const m = text.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!m) return { total: 0, missing: [], computed: new Set() };
  const schema = JSON.parse(m[1]);
  const expanded = expand(text.slice(0, m.index) + text.slice(m.index + m[0].length));
  const body = stripDeadTokens([{ text: expanded }], consumers)[0].text;
  const selfPrefix = kind === 'block' ? 'block' : 'section';
  const ownerOf = (prefix) => (prefix === selfPrefix ? 'self' : 'block');
  const dumped = new Set([...body.matchAll(/(\w+)\.settings\s*\|\s*json\b/g)].map((x) => ownerOf(x[1])));
  const computed = new Set([...body.matchAll(/(\w+)\.settings\[\s*(?!['"\s])[^\]]*\]/g)].map((x) => ownerOf(x[1])));
  const families = COMPUTED_FAMILIES[rel] || [];
  const groups = [['self', schema.settings || []], ...(schema.blocks || []).map((b) => [`block:${b.type}`, b.settings || []])];
  let total = 0;
  const missing = [];
  for (const [owner, settings] of groups) {
    const kindOfOwner = owner === 'self' ? 'self' : 'block';
    for (const s of settings) {
      if (!s.id || s.type === 'header' || s.type === 'paragraph') continue;
      total++;
      const id = escapeRe(s.id);
      const reads = [...body.matchAll(new RegExp(`(\\w+)\\.settings(?:\\.${id}\\b|\\[\\s*['"]${id}['"]\\s*\\])`, 'g'))].map((x) => ownerOf(x[1]));
      const hit = reads.includes(kindOfOwner)
        || dumped.has(kindOfOwner)
        || (computed.has(kindOfOwner) && families.some((f) => f.owner === kindOfOwner && f.id.test(s.id)));
      if (!hit) missing.push({ owner, id: s.id, type: s.type });
    }
  }
  return { total, missing, computed };
}

function appBlockGaps(text) {
  const m = text.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!m || !(JSON.parse(m[1]).blocks || []).some((b) => b.type === '@app')) return [];
  const body = text.slice(0, m.index);
  const gaps = [];
  if (!/render\s+block\b|content_for\s+['"]blocks['"]/.test(body)) gaps.push('offers @app blocks but never renders them');
  for (const loop of body.matchAll(/for\s+block\s+in\s+section\.blocks\b/g)) {
    const head = body.slice(loop.index, loop.index + 400);
    if (!/'@app'|"@app"|case\s+block\.type|if\s+block\.type\s*==\s*['"][\w-]+['"]/.test(head)) gaps.push(`block loop at offset ${loop.index} does not skip @app`);
  }
  return gaps;
}

const DECL = /(--[\w-]+)\s*:([^;\n]*)/g;

function stripDeadTokens(files, extra = []) {
  const all = [...files, ...extra].map((f) => f.text);
  const decls = all.flatMap((t) => [...t.matchAll(DECL)].map((m) => ({ tok: m[1], value: m[2] })));
  const bare = all.map((t) => t.replace(DECL, '')).join('\n');
  const mentions = (text, tok) => new RegExp(`${escapeRe(tok)}(?![\\w-])`).test(text);
  const live = new Set(decls.filter((d) => mentions(bare, d.tok)).map((d) => d.tok));
  for (let grew = true; grew;) {
    grew = false;
    for (const d of decls) {
      if (!live.has(d.tok)) continue;
      for (const o of decls) if (!live.has(o.tok) && mentions(d.value, o.tok)) { live.add(o.tok); grew = true; }
    }
  }
  return files.map((f) => ({ ...f, text: f.text.replace(DECL, (m, tok) => (live.has(tok) ? m : '')) }));
}

function globalUnread(schemaGroups, rawFiles, consumers = []) {
  const files = stripDeadTokens(rawFiles, consumers);
  const corpus = files.map((f) => f.text).join('\n');
  const computed = files.filter((f) => /(?<![.\w])settings\[\s*[a-z_]+\s*\]/.test(f.text));
  const pieces = computed.map((f) => {
    const lits = [...f.text.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map((m) => m[1] ?? m[2]);
    return new Set([...lits, ...lits.flatMap((l) => l.split(',').map((x) => x.trim()))].filter(Boolean));
  });
  const composable = (id, set) => {
    const reach = new Array(id.length + 1).fill(Infinity);
    reach[0] = 0;
    for (let i = 0; i < id.length; i++) {
      if (reach[i] === Infinity) continue;
      for (const p of set) if (id.startsWith(p, i)) reach[i + p.length] = Math.min(reach[i + p.length], reach[i] + 1);
    }
    return reach[id.length] >= 2 && reach[id.length] !== Infinity;
  };
  const schemeListed = new Set(files
    .filter((f) => /\.settings\[\s*[\w.[\]]+\s*\]/.test(f.text))
    .flatMap((f) => [...f.text.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map((m) => m[1] ?? m[2]))
    .flatMap((l) => l.split(/[,:]/).map((x) => x.trim())));
  let total = 0;
  const missing = [];
  for (const g of schemaGroups) {
    for (const s of g.settings || []) {
      if (!s.id || s.type === 'header' || s.type === 'paragraph') continue;
      total++;
      const id = escapeRe(s.id);
      const hit = new RegExp(`(?<![.\\w])settings\\.${id}\\b`).test(corpus) || new RegExp(`(?<![.\\w])settings\\[\\s*['"]${id}['"]\\s*\\]`).test(corpus);
      if (!hit && !pieces.some((set) => composable(s.id, set))) missing.push({ owner: 'global', id: s.id, type: s.type });
      for (const d of s.type === 'color_scheme_group' ? s.definition || [] : []) {
        if (!d.id || d.type === 'header' || d.type === 'paragraph') continue;
        total++;
        if (!new RegExp(`\\.settings\\.${escapeRe(d.id)}\\b`).test(corpus) && !schemeListed.has(d.id)) missing.push({ owner: `scheme:${s.id}`, id: d.id, type: d.type });
      }
    }
  }
  return { total, missing };
}

const SELFTEST = `<img alt="{{ section.settings.used }}">{{ block.settings.title }}
{% schema %}{"name":"t","settings":[{"type":"text","id":"used"},{"type":"text","id":"unused"},{"type":"header","content":"x"}],
"blocks":[{"type":"b","settings":[{"type":"text","id":"title"},{"type":"url","id":"link"}]}]}{% endschema %}`;
const self = unread(SELFTEST);
const GLOBAL_SELFTEST = [{ settings: [
  { type: 'text', id: 'shown' }, { type: 'text', id: 'section_only' }, { type: 'checkbox', id: 'float_a_enable' },
  { type: 'checkbox', id: 'float_c_enable' }, { type: 'header', content: 'x' },
  { type: 'range', id: 'live_tok' }, { type: 'range', id: 'dead_tok' },
  { type: 'color_scheme_group', id: 'color_schemes', definition: [{ type: 'color', id: 'fill' }, { type: 'color', id: 'unused_role' }, { type: 'color', id: 'listed_role' }] },
] }];
const GLOBAL_FILES = [
  { text: '{{ settings.shown }}{{ section.settings.section_only }}' },
  { text: "{% assign chans = 'a,b' | split: ',' %}{% for c in chans %}{% assign k = 'float_' | append: c | append: '_enable' %}{{ settings[k] }}{% endfor %}" },
  { text: '{% for scheme in settings.color_schemes %}:root { --t-live: {{ settings.live_tok }}px; --t-dead: {{ settings.dead_tok }}px; --t-mid: var(--t-live); --t-fill: {{ scheme.settings.fill }}; --t-role: {{ scheme.settings.unused_role }}; }{% endfor %}' },
  { text: "{% assign roles = 'listed:listed_role' | split: ',' %}{% for scheme in settings.color_schemes %}{% for r in roles %}{% assign p = r | split: ':' %}.x { color: {{ scheme.settings[p[1]] }}; }{% endfor %}{% endfor %}" },
];
const GLOBAL_CONSUMERS = [{ text: '.x { width: var(--t-mid); color: rgb(var(--t-fill)); }' }];
const gself = globalUnread(GLOBAL_SELFTEST, GLOBAL_FILES, GLOBAL_CONSUMERS);
const SECTION_TOKENS = `<div style="--s-live: {{ section.settings.live }}px; --s-dead: {{ section.settings.dead }}s; --s-ext: {{ section.settings.ext }}px"></div>
{% stylesheet %}.y { width: var(--s-live); }{% endstylesheet %}
{% schema %}{"settings":[{"type":"range","id":"live"},{"type":"range","id":"dead"},{"type":"range","id":"ext"}]}{% endschema %}`;
const selfTok = unread(SECTION_TOKENS, [{ text: '.z { height: var(--s-ext); }' }]);
const selfOk = self.total === 4 && self.missing.map((x) => x.id).join(',') === 'unused,link'
  && selfTok.total === 3 && selfTok.missing.map((x) => x.id).join(',') === 'dead'
  && gself.total === 10 && gself.missing.map((x) => x.id).join(',') === 'section_only,float_c_enable,dead_tok,unused_role';
console.log('selftest', selfOk, JSON.stringify(self.missing), JSON.stringify(selfTok.missing), JSON.stringify(gself.missing));
const appSelf = [
  appBlockGaps('{% for block in section.blocks %}<div>{{ block.settings.t }}</div>{% endfor %}{% schema %}{"blocks":[{"type":"@app"}]}{% endschema %}'),
  appBlockGaps("{%- for block in section.blocks -%}{%- if block.type == '@app' -%}{%- continue -%}{%- endif -%}<div></div>{%- endfor -%}{%- for block in section.blocks -%}{%- if block.type == '@app' -%}{%- render block -%}{%- endif -%}{%- endfor -%}{% schema %}{\"blocks\":[{\"type\":\"@app\"}]}{% endschema %}"),
];
const appOk = appSelf[0].length === 2 && appSelf[1].length === 0;
console.log('selftest app blocks', appOk, JSON.stringify(appSelf));

const schemaOf = (settings, blocks) => `{% schema %}${JSON.stringify({ name: 't', settings, blocks })}{% endschema %}`;
const dead = (id) => ({ type: 'text', id });
const BLIND_CASES = [
  ['comment', `{% comment %}{{ section.settings.ghost }}{% endcomment %}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['nested comment', `{% comment %}{% comment %}x{% endcomment %}{{ section.settings.ghost }}{% endcomment %}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['doc', `{% doc %}{{ section.settings.ghost }}{% enddoc %}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['raw', `{% raw %}{{ section.settings.ghost }}{% endraw %}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['inline comment', `{%- # {{ section.settings.ghost }} -%}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['liquid # comment', `{%- liquid\n  # assign a = section.settings.ghost\n  assign b = 1\n-%}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['liquid comment block', `{%- liquid\n  comment\n    assign a = section.settings.ghost\n  endcomment\n-%}${schemaOf([dead('ghost')], [])}`, 'ghost'],
  ['block id read by section', `{{ section.settings.title }}${schemaOf([dead('title')], [{ type: 'b', settings: [dead('title')] }])}`, 'title'],
  ['section id read by block', `{{ block.settings.title }}${schemaOf([dead('title')], [{ type: 'b', settings: [dead('title')] }])}`, 'title'],
  ['computed key without family', `{% assign k = 'social_' | append: 1 %}{{ block.settings[k] }}${schemaOf([], [{ type: 'b', settings: [dead('social_1')] }])}`, 'social_1'],
];
const blindOk = BLIND_CASES.every(([name, text, want]) => {
  const r = unread(stripLiquidComments(text), [], { rel: 'sections/selftest.liquid' });
  const ok = r.missing.map((x) => x.id).join(',') === want;
  if (!ok) console.log('selftest blind spot not detected:', name, JSON.stringify(r.missing));
  return ok;
});
const FAMILY_TEXT = `{% assign k = 'social_' | append: 1 %}{{ block.settings[k] }}${schemaOf([], [{ type: 'b', settings: [dead('social_1'), dead('other')] }])}`;
const fam = unread(stripLiquidComments(FAMILY_TEXT), [], { rel: 'sections/team.liquid' });
const familyOk = fam.missing.map((x) => x.id).join(',') === 'other' && fam.computed.has('block');
if (!familyOk) console.log('selftest computed family', JSON.stringify(fam.missing));
if (!selfOk || !appOk || !blindOk || !familyOk) process.exit(2);

const assetFiles = fs.readdirSync(path.join(ROOT, 'assets'))
  .filter((n) => /\.(css|js)$/.test(n))
  .map((n) => ({ rel: `assets/${n}`, text: read(path.join(ROOT, 'assets', n)) }));
let total = 0;
const failures = [];
const scanned = new Set();
for (const rel of [...list('sections'), ...list('blocks')]) {
  const key = rel.replace(/\\/g, '/');
  const text = readLiquid(path.join(ROOT, rel));
  const r = unread(text, assetFiles, { rel: key, kind: key.startsWith('blocks/') ? 'block' : 'section' });
  scanned.add(key);
  total += r.total;
  for (const x of r.missing) failures.push(`${key} ${x.owner} ${x.id} (${x.type})`);
  for (const f of COMPUTED_FAMILIES[key] || []) {
    if (!r.computed.has(f.owner)) failures.push(`${key} stale computed-key allowlist for ${f.owner} ${f.id}`);
  }
  for (const gap of appBlockGaps(text)) failures.push(`${key} ${gap}`);
}
for (const key of Object.keys(COMPUTED_FAMILIES)) {
  if (!scanned.has(key)) failures.push(`${key} stale computed-key allowlist: file not found`);
}
console.log('settings', total, 'unread or unrendered', failures.length);

const themeFiles = ['layout', 'sections', 'snippets', 'blocks', 'templates', 'templates/customers']
  .filter((d) => fs.existsSync(path.join(ROOT, d)))
  .flatMap((d) => list(d))
  .map((rel) => ({ rel, text: readLiquid(path.join(ROOT, rel)) }));
const g = globalUnread(JSON.parse(read(path.join(ROOT, 'config', 'settings_schema.json'))), themeFiles, assetFiles);
total += g.total;
for (const x of g.missing) failures.push(`config/settings_schema.json ${x.owner} ${x.id} (${x.type})`);
console.log('global settings', g.total, 'unread', g.missing.length);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
