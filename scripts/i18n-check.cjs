// Locale key-parity check: every language must define exactly the keys en
// defines — no missing translations, no orphan keys. Run with:
//   npm run i18n:check
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function flatten(obj, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, full, out);
    else out.add(full);
  }
  return out;
}

const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
const bundles = {};
for (const file of files) {
  bundles[file.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
}

if (!bundles.en) {
  console.error('Missing en.json reference bundle');
  process.exit(1);
}

const reference = flatten(bundles.en);
let failed = false;
console.log(`reference (en): ${reference.size} keys`);
for (const [code, bundle] of Object.entries(bundles)) {
  if (code === 'en') continue;
  const keys = flatten(bundle);
  const missing = [...reference].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !reference.has(k));
  // Empty-string values silently fall back in i18next config, but flag them:
  const empty = [];
  const walk = (obj, prefix = '') => {
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') walk(v, full);
      else if (typeof v === 'string' && v.trim() === '') empty.push(full);
    }
  };
  walk(bundle);
  if (missing.length || extra.length || empty.length) {
    failed = true;
    console.error(`\n${code}: MISMATCH`);
    missing.slice(0, 20).forEach((k) => console.error(`  missing: ${k}`));
    if (missing.length > 20) console.error(`  ... and ${missing.length - 20} more missing`);
    extra.slice(0, 10).forEach((k) => console.error(`  extra: ${k}`));
    empty.slice(0, 10).forEach((k) => console.error(`  empty: ${k}`));
  } else {
    console.log(`${code}: OK (${keys.size} keys)`);
  }
}
if (failed) process.exit(1);
console.log('All locales in parity.');
