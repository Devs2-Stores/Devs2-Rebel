import fs from 'fs';
import path from 'path';

const EPSILON = 1e-9;

function isStepAligned(val, min, step) {
  const diff = (val - min) / step;
  return Math.abs(diff - Math.round(diff)) < EPSILON;
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

console.log('--- Starting AST Range Math Validation ---');

const schemaPath = 'config/settings_schema.json';
const schemaRaw = fs.readFileSync(schemaPath, 'utf8');
const schema = JSON.parse(schemaRaw);

const rangeSettings = new Map();

for (const section of schema) {
  if (!section.settings) continue;
  for (const setting of section.settings) {
    if (setting.type === 'range') {
      rangeSettings.set(setting.id, {
        id: setting.id,
        min: setting.min,
        max: setting.max,
        step: setting.step ?? 1,
        default: setting.default
      });
    }
  }
}

console.log(`Discovered ${rangeSettings.size} global range settings in settings_schema.json`);

const settingsDataPath = 'config/settings_data.json';
const settingsData = JSON.parse(fs.readFileSync(settingsDataPath, 'utf8'));

let errors = [];

const presets = settingsData.presets || {};
console.log(`Checking presets: ${Object.keys(presets).join(', ')}`);

for (const [presetName, presetValues] of Object.entries(presets)) {
  for (const [key, value] of Object.entries(presetValues)) {
    if (rangeSettings.has(key)) {
      const range = rangeSettings.get(key);
      if (typeof value === 'number') {
        if (value < range.min || value > range.max) {
          errors.push(`[${presetName}] ${key} value ${value} is out of bounds [${range.min}, ${range.max}]`);
        } else if (!isStepAligned(value, range.min, range.step)) {
          errors.push(`[${presetName}] ${key} value ${value} is not a valid step (min: ${range.min}, step: ${range.step})`);
        }
      }
    }
  }
}

// Also check sections and blocks schemas
const liquidFiles = [
  ...fs.readdirSync('sections').filter(f => f.endsWith('.liquid')).map(f => path.join('sections', f)),
  ...fs.existsSync('blocks') ? fs.readdirSync('blocks').filter(f => f.endsWith('.liquid')).map(f => path.join('blocks', f)) : []
];

const sectionRanges = new Map();
const schemaRegex = /{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/;

for (const file of liquidFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(schemaRegex);
  if (match) {
    try {
      const secSchema = JSON.parse(match[1]);
      const secRanges = new Map();
      if (secSchema.settings) {
        for (const s of secSchema.settings) {
          if (s.type === 'range') {
            secRanges.set(s.id, { id: s.id, min: s.min, max: s.max, step: s.step ?? 1, default: s.default });
          }
        }
      }
      if (secSchema.blocks) {
        for (const b of secSchema.blocks) {
          if (b.settings) {
            for (const s of b.settings) {
              if (s.type === 'range') {
                secRanges.set(`${b.type}.${s.id}`, { id: s.id, min: s.min, max: s.max, step: s.step ?? 1, default: s.default });
              }
            }
          }
        }
      }
      if (secRanges.size > 0) {
        sectionRanges.set(file, secRanges);
      }
    } catch (e) {
      errors.push(`Failed to parse schema in ${file}: ${e.message}`);
    }
  }
}

console.log(`Discovered range settings across ${sectionRanges.size} section/block files`);

// Validate templates/*.json for range setting overrides
const templateFiles = fs.readdirSync('templates').filter(f => f.endsWith('.json')).map(f => path.join('templates', f));
for (const tf of templateFiles) {
  const tContent = JSON.parse(stripComments(fs.readFileSync(tf, 'utf8')));
  const sections = tContent.sections || {};
  for (const [secKey, secVal] of Object.entries(sections)) {
    const secType = secVal.type;
    const secFilePath = path.join('sections', `${secType}.liquid`);
    const secRangeMap = sectionRanges.get(secFilePath);
    if (secRangeMap && secVal.settings) {
      for (const [sKey, sVal] of Object.entries(secVal.settings)) {
        if (secRangeMap.has(sKey) && typeof sVal === 'number') {
          const r = secRangeMap.get(sKey);
          if (sVal < r.min || sVal > r.max) {
            errors.push(`[${tf} -> ${secKey}] ${sKey}=${sVal} out of bounds [${r.min}, ${r.max}]`);
          } else if (!isStepAligned(sVal, r.min, r.step)) {
            errors.push(`[${tf} -> ${secKey}] ${sKey}=${sVal} not step-aligned (min: ${r.min}, step: ${r.step})`);
          }
        }
      }
    }
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
