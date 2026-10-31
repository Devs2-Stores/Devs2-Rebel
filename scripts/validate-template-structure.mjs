import fs from 'fs';
import path from 'path';

function stripComments(text) {
  return text.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
}

function readJson(file) {
  return JSON.parse(stripComments(fs.readFileSync(file, 'utf8')));
}

function posix(file) {
  return file.replace(/\\/g, '/');
}

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, ext);
    return entry.name.endsWith(ext) ? [posix(full)] : [];
  });
}

console.log('--- Starting Template Structure Validation ---');

const errors = [];
const schemaRegex = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/;

const sectionSchemas = new Map();
const blockSchemas = new Map();
for (const [dir, target] of [['sections', sectionSchemas], ['blocks', blockSchemas]]) {
  for (const file of walk(dir, '.liquid')) {
    const type = path.basename(file, '.liquid');
    const match = fs.readFileSync(file, 'utf8').match(schemaRegex);
    if (!match) {
      target.set(type, null);
      continue;
    }
    try {
      target.set(type, JSON.parse(match[1]));
    } catch (e) {
      errors.push(`Failed to parse schema in ${file}: ${e.message}`);
      target.set(type, null);
    }
  }
}

console.log(`Loaded ${sectionSchemas.size} section schemas and ${blockSchemas.size} theme block schemas`);

function settingIndex(settings) {
  const index = new Map();
  for (const s of settings || []) if (s && s.id) index.set(s.id, s);
  return index;
}

function checkSettings(settings, declared, label) {
  if (!settings || !declared) return;
  const index = settingIndex(declared);
  for (const [key, value] of Object.entries(settings)) {
    const def = index.get(key);
    if (!def) {
      errors.push(`${label}: setting "${key}" is not declared in the schema`);
      continue;
    }
    if ((def.type === 'select' || def.type === 'radio') && value !== null && value !== undefined && value !== '') {
      const allowed = (def.options || []).map((o) => String(o.value));
      if (!allowed.includes(String(value))) {
        errors.push(`${label}: setting "${key}" = ${JSON.stringify(value)} is not one of [${allowed.join(', ')}]`);
      }
    }
  }
}

function blockEntries(blocks) {
  if (!blocks) return [];
  return Array.isArray(blocks) ? blocks.map((b, i) => [String(b.id ?? i), b]) : Object.entries(blocks);
}

function checkBlockOrder(container, label) {
  if (!container.block_order) return;
  const ids = new Set(blockEntries(container.blocks).map(([id]) => id));
  for (const id of container.block_order) {
    if (!ids.has(String(id))) errors.push(`${label}: block_order references missing block "${id}"`);
  }
}

// parentSchema owns container.blocks: the section schema, or blocks/<type>.liquid for blocks nested inside a theme block.
function checkBlocks(container, parentSchema, label) {
  checkBlockOrder(container, label);
  const entries = blockEntries(container.blocks);
  if (parentSchema && Number.isFinite(parentSchema.max_blocks) && entries.length > parentSchema.max_blocks) {
    errors.push(`${label}: ${entries.length} blocks exceed max_blocks ${parentSchema.max_blocks}`);
  }
  const declared = parentSchema ? parentSchema.blocks || [] : [];
  const acceptsTheme = declared.some((b) => b.type === '@theme');
  for (const [blockKey, block] of entries) {
    const where = `${label} -> block ${blockKey} (${block.type})`;
    const type = block.type;
    if (typeof type !== 'string') {
      errors.push(`${where}: block has no string type`);
      continue;
    }
    if (type.startsWith('shopify://') || type === '@app') continue;
    const local = declared.find((b) => b.type === type);
    const themeBlock = blockSchemas.has(type) ? blockSchemas.get(type) : undefined;
    const ownsSchema = local && (local.settings || themeBlock === undefined);
    if (ownsSchema) {
      checkSettings(block.settings, local.settings || [], where);
      checkBlockOrder(block, where);
      continue;
    }
    if (themeBlock === undefined) {
      errors.push(`${where}: block type "${type}" is not declared in the section schema and blocks/${type}.liquid does not exist`);
      continue;
    }
    if (!local && !acceptsTheme) {
      errors.push(`${where}: block type "${type}" is not accepted by the section schema (no @theme entry)`);
      continue;
    }
    if (themeBlock) {
      checkSettings(block.settings, themeBlock.settings || [], where);
      checkBlocks(block, themeBlock, where);
    }
  }
}

function checkSectionInstances(sections, label) {
  for (const [secKey, sec] of Object.entries(sections || {})) {
    const where = `${label} -> ${secKey}`;
    if (!sec || typeof sec.type !== 'string') {
      errors.push(`${where}: section has no type`);
      continue;
    }
    if (!sectionSchemas.has(sec.type)) {
      errors.push(`${where}: section type "${sec.type}" has no sections/${sec.type}.liquid`);
      continue;
    }
    const schema = sectionSchemas.get(sec.type);
    if (!schema) continue;
    checkSettings(sec.settings, schema.settings || [], where);
    checkBlocks(sec, schema, where);
  }
}

const files = [
  ...walk('templates', '.json'),
  ...walk('sections', '.json'),
  ...walk('listings', '.json').filter((f) => /^listings\/[^/]+\/(templates|sections)\//.test(f)),
];

for (const file of files) {
  let json;
  try {
    json = readJson(file);
  } catch (e) {
    errors.push(`Failed to parse ${file}: ${e.message}`);
    continue;
  }
  checkSectionInstances(json.sections, file);
  if (Array.isArray(json.order)) {
    for (const id of json.order) {
      if (!json.sections || !(id in json.sections)) errors.push(`${file}: order references missing section "${id}"`);
    }
  }
}

console.log(`Checked section instances in ${files.length} JSON files`);

if (errors.length > 0) {
  console.error(`\nFound ${errors.length} template structure violation(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('Template structure validation passed.');
