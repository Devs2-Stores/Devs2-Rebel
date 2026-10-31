import fs from 'fs';
import path from 'path';

console.log('--- Starting Locale Integrity & Parity Validation ---');

const storefrontPath = 'locales/en.default.json';
const schemaPath = 'locales/en.default.schema.json';

if (!fs.existsSync(storefrontPath)) {
  console.error(`Storefront locale missing: ${storefrontPath}`);
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema locale missing: ${schemaPath}`);
  process.exit(1);
}

const storefrontRaw = fs.readFileSync(storefrontPath, 'utf8');
const schemaRaw = fs.readFileSync(schemaPath, 'utf8');

const storefront = JSON.parse(storefrontRaw);
const schema = JSON.parse(schemaRaw);

const storefrontSizeKB = Buffer.byteLength(storefrontRaw, 'utf8') / 1024;
console.log(`Storefront locale size: ${storefrontSizeKB.toFixed(2)} KB (target: < 35 KB)`);

if (storefrontSizeKB > 35) {
  console.warn(`Warning: Storefront locale exceeds 35KB (${storefrontSizeKB.toFixed(2)} KB)`);
}

// Check for schema bleed in storefront locale
let bleedKeys = [];
const sections = storefront.sections || {};
for (const [secName, secData] of Object.entries(sections)) {
  if (typeof secData === 'object' && secData !== null) {
    for (const key of ['settings', 'blocks', 'presets', 'name']) {
      if (key in secData && !(secName === 'testimonials' && key === 'settings')) {
        bleedKeys.push(`sections.${secName}.${key}`);
      }
    }
  }
}

if (bleedKeys.length > 0) {
  console.error(`FAILED: Schema translation bleed detected in en.default.json: ${bleedKeys.join(', ')}`);
  process.exit(1);
}

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

function resolveKey(root, keyPath) {
  const parts = keyPath.split('.');
  let cur = root;
  for (const p of parts) {
    if (typeof cur === 'object' && cur !== null && p in cur) {
      cur = cur[p];
    } else {
      return null;
    }
  }
  return cur;
}

function isPluralObject(node) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return false;
  const keys = Object.keys(node);
  return keys.length > 0 && keys.every((k) => PLURAL_CATEGORIES.has(k)) && typeof node.other === 'string';
}

function isTranslation(val) {
  if (typeof val === 'string') return val.trim() !== '';
  return isPluralObject(val) && Object.values(val).every((v) => typeof v === 'string' && v.trim() !== '');
}

function getAllFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== '_reference' && file !== 'node_modules' && file !== '.git') {
        results = results.concat(getAllFiles(filePath, ext));
      }
    } else if (file.endsWith(ext)) {
      results.push(filePath);
    }
  }
  return results;
}

const liquidFiles = ['layout', 'sections', 'snippets', 'blocks', 'templates']
  .filter((dir) => fs.existsSync(dir))
  .flatMap((dir) => getAllFiles(dir, '.liquid'));
const jsonTemplates = ['templates', 'listings'].filter((dir) => fs.existsSync(dir)).flatMap((dir) => getAllFiles(dir, '.json'));

let missingStorefront = [];
let missingSchema = [];

// 1. Check | t filter calls in Liquid against the storefront locale only
const tFilterRegex = /['"]([a-zA-Z0-9_.-]+)['"]\s*\|\s*t\b/g;
const dynamicPrefixRegex = /['"]([a-zA-Z0-9_.-]+\.)['"]\s*\|\s*append\b/g;
const referencedStorefrontKeys = new Set();
const dynamicStorefrontPrefixes = new Set();
for (const file of liquidFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(tFilterRegex)) {
    const key = match[1];
    referencedStorefrontKeys.add(key);
    if (!isTranslation(resolveKey(storefront, key))) {
      const where = isTranslation(resolveKey(schema, key)) ? ' (only exists in the schema locale)' : '';
      missingStorefront.push(`${file} -> ${key}${where}`);
    }
  }
  for (const match of content.matchAll(dynamicPrefixRegex)) dynamicStorefrontPrefixes.add(match[1]);
}

// 2. Check "t:..." schema keys against the schema locale only
const tSchemaRegex = /"t:([a-zA-Z0-9_.-]+)"/g;
const allSchemaFiles = [...liquidFiles, ...jsonTemplates, 'config/settings_schema.json'];
const referencedSchemaKeys = new Set();
for (const file of allSchemaFiles) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(tSchemaRegex)) {
    const key = match[1];
    referencedSchemaKeys.add(key);
    if (!isTranslation(resolveKey(schema, key))) {
      const where = isTranslation(resolveKey(storefront, key)) ? ' (only exists in the storefront locale)' : '';
      missingSchema.push(`${file} -> ${key}${where}`);
    }
  }
}

function collectStale(node, keyPath, referenced, dynamicPrefixes, out) {
  if (node !== null && typeof node === 'object' && !isPluralObject(node)) {
    for (const [k, v] of Object.entries(node)) collectStale(v, keyPath ? `${keyPath}.${k}` : k, referenced, dynamicPrefixes, out);
  } else if (!referenced.has(keyPath) && ![...dynamicPrefixes].some((prefix) => keyPath.startsWith(prefix))) {
    out.push(keyPath);
  }
}

const staleSchema = [];
collectStale(schema, '', referencedSchemaKeys, new Set(), staleSchema);

const staleStorefront = [];
collectStale(storefront, '', referencedStorefrontKeys, dynamicStorefrontPrefixes, staleStorefront);

let failed = false;

if (staleSchema.length > 0) {
  failed = true;
  console.error(`FAILED: ${staleSchema.length} schema locale keys are not referenced by any t: reference:`);
  for (const k of staleSchema.slice(0, 10)) console.error(`  - ${k}`);
}

if (staleStorefront.length > 0) {
  failed = true;
  console.error(`FAILED: ${staleStorefront.length} storefront locale keys are not referenced by any | t call:`);
  for (const k of staleStorefront.slice(0, 10)) console.error(`  - ${k}`);
}

if (missingStorefront.length > 0) {
  failed = true;
  console.error(`FAILED: ${missingStorefront.length} storefront translation keys unresolvable:`);
  for (const m of missingStorefront.slice(0, 10)) console.error(`  - ${m}`);
}

if (missingSchema.length > 0) {
  failed = true;
  console.error(`FAILED: ${missingSchema.length} schema translation keys unresolvable:`);
  for (const m of missingSchema.slice(0, 10)) console.error(`  - ${m}`);
}

if (failed) process.exit(1);

console.log('SUCCESS: 100% of storefront and schema keys resolved without any missing, blank or unreferenced values!');
process.exit(0);
