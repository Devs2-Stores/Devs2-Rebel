const fs = require('fs');
const path = require('path');
const { Liquid } = require('liquidjs');
const { ROOT } = require('./lib.cjs');

const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
const readJson = (p) => JSON.parse(stripComments(fs.readFileSync(path.join(ROOT, p), 'utf8')));

function settingsFor(overrides) {
  const data = readJson('config/settings_data.json');
  const current = typeof data.current === 'string' ? data.presets[data.current] : data.current;
  const settings = {};
  for (const group of readJson('config/settings_schema.json')) {
    for (const s of group.settings || []) if (s.id && s.default !== undefined) settings[s.id] = s.default;
  }
  return { ...settings, ...current, ...overrides };
}

function lookup(obj, key) {
  return String(key).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

/**
 * Renders a theme snippet offline with the real storefront locale and the live settings (plus overrides),
 * so a gate can inject markup the store does not render with its current settings. Only the Liquid features the
 * rendered snippets use are stubbed: t, asset_url, stylesheet_tag, form, render (icons only).
 */
async function renderSource(source, { settings: overrides = {}, formId } = {}) {
  const locale = readJson('locales/en.default.json');
  const engine = new Liquid();
  engine.registerFilter('t', (key) => { const v = lookup(locale, key); return typeof v === 'string' ? v : String(key); });
  engine.registerFilter('asset_url', (n) => `/assets/${n}`);
  engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
  engine.registerFilter('default_errors', (e) => String(e));
  engine.registerTag('render', {
    parse(token) { this.args = token.args; },
    render(ctx, emitter) { emitter.write('<svg class="icon" width="16" height="16" aria-hidden="true" focusable="false"></svg>'); },
  });
  engine.registerTag('form', {
    parse(tagToken, remainTokens) {
      this.templates = [];
      this.id = (tagToken.args.match(/id:\s*'([^']+)'/) || [])[1] || formId || 'form';
      const stream = this.liquid.parser.parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endform', () => stream.stop())
        .on('end', () => { throw new Error('form tag not closed'); });
      stream.start();
    },
    *render(ctx, emitter) {
      emitter.write(`<form method="post" action="/contact#${this.id}" id="${this.id}" accept-charset="UTF-8" class="contact-form"><input type="hidden" name="form_type" value="customer"><input type="hidden" name="utf8" value="✓">`);
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      emitter.write('</form>');
    },
  });
  return engine.parseAndRender(source, { settings: settingsFor(overrides) });
}

const renderSnippet = (file, opts) => renderSource(fs.readFileSync(path.join(ROOT, 'snippets', file), 'utf8'), opts);

/** Renders the part of a theme file that starts at `start` and ends after the first `end` that follows it. */
function renderSegment(relPath, start, end, opts) {
  const text = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const i = text.indexOf(start);
  if (i < 0) throw new Error(`${relPath} no longer contains ${start}`);
  const j = text.indexOf(end, i);
  return renderSource(text.slice(i, j + end.length), opts);
}

module.exports = { renderSnippet, renderSegment };
