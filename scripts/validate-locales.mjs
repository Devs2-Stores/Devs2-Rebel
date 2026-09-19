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

const liquidFiles = getAllFiles('.', '.liquid');
const jsonTemplates = getAllFiles('templates', '.json');

let missingStorefront = [];
let missingSchema = [];

// 1. Check | t filter calls in Liquid
const tFilterRegex = /['"]([a-zA-Z0-9_.]+)['"]\s*\|\s*t/g;
for (const file of liquidFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tFilterRegex.exec(content)) !== null) {
    const key = match[1];
    const val = resolveKey(storefront, key) ?? resolveKey(schema, key);
    if (val === null || (typeof val === 'string' && val.trim() === '')) {
      missingStorefront.push(`${file} -> ${key}`);
    }
  }
}

// 2. Check "t:..." schema keys
const tSchemaRegex = /"t:([a-zA-Z0-9_.-]+)"/g;
const allSchemaFiles = [...liquidFiles, ...jsonTemplates, 'config/settings_schema.json'];
for (const file of allSchemaFiles) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tSchemaRegex.exec(content)) !== null) {
    const key = match[1];
    const val = resolveKey(schema, key) ?? resolveKey(storefront, key);
    if (val === null || (typeof val === 'string' && val.trim() === '')) {
      missingSchema.push(`${file} -> ${key}`);
    }
  }
}

if (missingStorefront.length > 0 || missingSchema.length > 0) {
  if (missingStorefront.length > 0) {
    console.error(`FAILED: ${missingStorefront.length} storefront translation keys unresolvable:`);
    for (const m of missingStorefront.slice(0, 10)) console.error(`  - ${m}`);
  }
  if (missingSchema.length > 0) {
    console.error(`FAILED: ${missingSchema.length} schema translation keys unresolvable:`);
    for (const m of missingSchema.slice(0, 10)) console.error(`  - ${m}`);
  }
  process.exit(1);
}

console.log('SUCCESS: 100% of storefront and schema keys resolved without any missing or blank values!');
process.exit(0);
