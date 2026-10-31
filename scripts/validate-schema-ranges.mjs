import fs from 'fs';
import path from 'path';

const EPSILON = 1e-9;
const MAX_STEPS = 101;

function isStepAligned(val, min, step) {
  const diff = (val - min) / step;
  return Math.abs(diff - Math.round(diff)) < EPSILON;
}

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

console.log('--- Starting AST Range Math Validation ---');

const errors = [];

function toRange(setting) {
  return { id: setting.id, min: setting.min, max: setting.max, step: setting.step ?? 1, default: setting.default };
}

function checkDefinition(range, label) {
  const { id, min, max, step } = range;
  if (![min, max, step].every((n) => typeof n === 'number' && Number.isFinite(n))) {
    errors.push(`[${label}] ${id} needs numeric min, max and step (min: ${min}, max: ${max}, step: ${step})`);
    return;
  }
  if (step <= 0 || min >= max) {
    errors.push(`[${label}] ${id} has an invalid range (min: ${min}, max: ${max}, step: ${step})`);
    return;
  }
  const steps = (max - min) / step;
  if (steps > MAX_STEPS + EPSILON) {
    errors.push(`[${label}] ${id} has ${Math.round(steps)} steps, over the ${MAX_STEPS} step limit (min: ${min}, max: ${max}, step: ${step})`);
  }
  if (typeof range.default !== 'number') {
    errors.push(`[${label}] ${id} needs a numeric default`);
    return;
  }
  checkValue(range, range.default, `${label} default`);
}

function checkValue(range, value, label) {
  if (typeof value !== 'number') return;
  if (value < range.min || value > range.max) {
    errors.push(`[${label}] ${range.id} value ${value} is out of bounds [${range.min}, ${range.max}]`);
  } else if (!isStepAligned(value, range.min, range.step)) {
    errors.push(`[${label}] ${range.id} value ${value} is not a valid step (min: ${range.min}, step: ${range.step})`);
  }
}

const schemaPath = 'config/settings_schema.json';
const schema = readJson(schemaPath);

const rangeSettings = new Map();

for (const section of schema) {
  if (!section.settings) continue;
  for (const setting of section.settings) {
    if (setting.type === 'range') {
      const range = toRange(setting);
      rangeSettings.set(setting.id, range);
      checkDefinition(range, schemaPath);
    }
  }
}

console.log(`Discovered ${rangeSettings.size} global range settings in settings_schema.json`);

const settingsDataPath = 'config/settings_data.json';
const settingsData = readJson(settingsDataPath);

function checkGlobalValues(values, label) {
  for (const [key, value] of Object.entries(values)) {
    if (rangeSettings.has(key)) checkValue(rangeSettings.get(key), value, label);
  }
}

const presets = settingsData.presets || {};
console.log(`Checking presets: ${Object.keys(presets).join(', ')}`);

for (const [presetName, presetValues] of Object.entries(presets)) {
  checkGlobalValues(presetValues, presetName);
}
if (settingsData.current && typeof settingsData.current === 'object') {
  checkGlobalValues(settingsData.current, 'current');
}

const sectionFiles = [...walk('sections', '.liquid'), ...walk('blocks', '.liquid')];
const schemaRegex = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/;

const fileRanges = new Map();
const fileSchemas = new Map();

function collectRanges(settings, ranges, prefix, file) {
  for (const s of settings || []) {
    if (s.type !== 'range') continue;
    const range = toRange(s);
    ranges.set(`${prefix}${s.id}`, range);
    checkDefinition(range, file);
  }
}

for (const file of sectionFiles) {
  const match = fs.readFileSync(file, 'utf8').match(schemaRegex);
  if (!match) continue;
  let secSchema;
  try {
    secSchema = JSON.parse(match[1]);
  } catch (e) {
    errors.push(`Failed to parse schema in ${file}: ${e.message}`);
    continue;
  }
  const ranges = new Map();
  collectRanges(secSchema.settings, ranges, '', file);
  for (const b of secSchema.blocks || []) collectRanges(b.settings, ranges, `${b.type}.`, file);
  fileSchemas.set(file, secSchema);
  if (ranges.size > 0) fileRanges.set(file, ranges);
}

console.log(`Discovered range settings across ${fileRanges.size} section/block files`);

function rangeFor(ranges, blockType, key) {
  if (!ranges) return undefined;
  return blockType === undefined ? ranges.get(key) : ranges.get(`${blockType}.${key}`);
}

function checkInstance(settings, ranges, blockType, label) {
  for (const [key, value] of Object.entries(settings || {})) {
    const range = rangeFor(ranges, blockType, key);
    if (range) checkValue(range, value, label);
  }
}

function blockEntries(blocks) {
  if (!blocks) return [];
  return Array.isArray(blocks)
    ? blocks.map((b, i) => [String(b.id ?? i), b])
    : Object.entries(blocks);
}

function checkBlocks(blocks, parentRanges, label) {
  for (const [blockKey, block] of blockEntries(blocks)) {
    const where = `${label} -> block ${blockKey}`;
    const themeBlockRanges = fileRanges.get(`blocks/${block.type}.liquid`);
    checkInstance(block.settings, parentRanges, block.type, where);
    if (themeBlockRanges) checkInstance(block.settings, themeBlockRanges, undefined, where);
    checkBlocks(block.blocks, parentRanges, where);
  }
}

function checkSections(sections, label) {
  for (const [secKey, secVal] of Object.entries(sections || {})) {
    const ranges = fileRanges.get(`sections/${secVal.type}.liquid`);
    const where = `${label} -> ${secKey}`;
    checkInstance(secVal.settings, ranges, undefined, where);
    checkBlocks(secVal.blocks, ranges, where);
  }
}

for (const file of [...walk('templates', '.json'), ...walk('sections', '.json'), ...walk('listings', '.json')]) {
  checkSections(readJson(file).sections, file);
}

for (const [file, secSchema] of fileSchemas) {
  const ranges = fileRanges.get(file);
  if (!ranges) continue;
  for (const [i, preset] of (secSchema.presets || []).entries()) {
    const where = `${file} preset ${preset.name ?? i}`;
    checkInstance(preset.settings, ranges, undefined, where);
    checkBlocks(preset.blocks, ranges, where);
  }
  if (secSchema.default) {
    checkInstance(secSchema.default.settings, ranges, undefined, `${file} default`);
    checkBlocks(secSchema.default.blocks, ranges, `${file} default`);
  }
}

if (errors.length > 0) {
  console.error(`FAILED: ${errors.length} range math violations detected:`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log('SUCCESS: 100% of range settings across all presets and templates are mathematically valid!');
  process.exit(0);
}
