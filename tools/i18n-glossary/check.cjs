#!/usr/bin/env node
// i18n glossary & discipline-key gate (docs/KEV_TOOLS_ROADMAP.md T4).
//
// Complements scripts/i18n-check.cjs (raw key parity): this gate looks at
// WHAT is translated. It flattens every locale, then
//   1. asserts the discipline-critical key groups exist and are non-empty in
//      every locale (xr.*, viewer.*, subjects.*, studyLevels.*, tutor.*),
//   2. checks the curated glossary (glossary.json): keys that must exist and
//      must NOT still hold the English value in non-English locales - these
//      are safeguarding- and discipline-facing strings where an untranslated
//      fallback could mislead a guardian or a student,
//   3. reports per-locale translation coverage (values differing from
//      English) as information, not failure.
//
// Usage: node check.cjs [--json]   (exit 0 = pass, 1 = violations)

const fs = require('fs');
const path = require('path');

const KEV_ROOT = path.join(__dirname, '..', '..');
const LOCALES_DIR = path.join(KEV_ROOT, 'src', 'i18n', 'locales');
const GLOSSARY_PATH = path.join(__dirname, 'glossary.json');

const REQUIRED_GROUPS = ['xr.', 'viewer.', 'subjects.', 'studyLevels.', 'tutor.'];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

function main() {
  const asJson = process.argv.includes('--json');
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json')).sort();
  const locales = {};
  for (const file of localeFiles) {
    locales[path.basename(file, '.json')] = flatten(JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8')));
  }
  const english = locales.en;
  if (!english) {
    console.error('No en.json locale found.');
    process.exit(1);
  }

  const problems = [];
  const coverage = {};

  // 1. Required groups present and non-empty in every locale.
  for (const [name, flat] of Object.entries(locales)) {
    for (const group of REQUIRED_GROUPS) {
      const keys = Object.keys(flat).filter((k) => k.startsWith(group));
      const empty = keys.filter((k) => !String(flat[k] ?? '').trim());
      if (!keys.length) problems.push(`${name}: key group '${group}*' is missing entirely`);
      if (empty.length) problems.push(`${name}: ${empty.length} empty value(s) in '${group}*' (${empty.slice(0, 3).join(', ')}...)`);
    }
    // 3. Coverage heuristic: share of values that differ from English.
    if (name !== 'en') {
      const shared = Object.keys(english).filter((k) => k in flat);
      const translated = shared.filter((k) => String(flat[k]) !== String(english[k]));
      coverage[name] = {
        sharedKeys: shared.length,
        translated: translated.length,
        percent: shared.length ? Math.round((translated.length / shared.length) * 100) : 0,
      };
    }
  }

  // 2. Curated glossary: must exist everywhere and must be translated.
  const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf8'));
  for (const entry of glossary.keys) {
    for (const [name, flat] of Object.entries(locales)) {
      if (!(entry.key in flat)) {
        problems.push(`${name}: glossary key '${entry.key}' missing (${entry.why})`);
      } else if (name !== 'en' && entry.requireTranslation && String(flat[entry.key]) === String(english[entry.key])) {
        problems.push(`${name}: glossary key '${entry.key}' still holds the English value (${entry.why})`);
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ locales: Object.keys(locales), coverage, problems }, null, 2));
  } else {
    console.log(`Locales: ${Object.keys(locales).join(', ')} (${Object.keys(english).length} flattened keys)`);
    for (const [name, stats] of Object.entries(coverage)) {
      console.log(`  ${name}: ${stats.translated}/${stats.sharedKeys} values differ from English (${stats.percent}%)`);
    }
    if (problems.length) {
      console.error(`\ni18n glossary FAILED (${problems.length}):`);
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    console.log('i18n glossary OK: discipline key groups complete, glossary keys present and translated.');
  }
}

main();
