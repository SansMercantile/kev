#!/usr/bin/env node
// Attribution & license compliance gate for the vendored atlas assets
// (M0 of docs/KEV_TOOLS_ROADMAP.md).
//
// Enforces, deterministically and without a running backend:
//   1. Both attribution docs exist (Model X Studio, Human Atlas).
//   2. Embedded-asset policy (owner-approved 2026-09-15, reversing the
//      earlier "not redistributed in the web bundle" decision): the
//      Royalty-Free Model X GLB may ship ONLY at public/models/model-x.glb,
//      and the BodyParts3D chunk geometry (CC BY 4.0) ONLY as
//      public/models/body-*.bin.gz. Any other GLB under public/, or raw
//      uncompressed .bin duplicates, is a violation.
//   3. The Immersive Lab subject catalog carries both attribution strings
//      (CC BY 4.0 / BodyParts3D for anatomy, Model X Studio for vehicle).
//   4. Every compiled pack entry derived from a manifest carries its
//      attribution: atlas-* challenges -> CC BY 4.0, modelx-* challenges ->
//      Model X Studio, anatomy/vehicle study kits -> both docs referenced.
//   5. No download UI exists for either asset (embedded for study only).
//
// Usage: node check.cjs   (exit 0 = compliant, 1 = violations listed)

const fs = require('fs');
const path = require('path');

const KEV_ROOT = path.join(__dirname, '..', '..');
const violations = [];

function read(rel) {
  const file = path.join(KEV_ROOT, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function walk(dir, filter, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full, filter, out);
    } else if (filter(full)) {
      out.push(full);
    }
  }
  return out;
}

// 1. Attribution docs exist.
for (const doc of ['docs/ATTRIBUTION-model-x.md', 'docs/ATTRIBUTION-human-atlas.md']) {
  if (read(doc) === null) violations.push(`Missing attribution doc: ${doc}`);
}

// 2. Embedded-asset policy: the approved payloads, in their approved places,
// and nothing else geometry-shaped in the bundle inputs.
const publicDir = path.join(KEV_ROOT, 'public');
const glbs = walk(publicDir, (f) => f.toLowerCase().endsWith('.glb'));
for (const glb of glbs) {
  const rel = path.relative(KEV_ROOT, glb).split(path.sep).join('/');
  if (rel !== 'public/models/model-x.glb') {
    violations.push(`Unexpected GLB in the web bundle: ${rel} (only public/models/model-x.glb is approved)`);
  }
}
const rawBins = walk(path.join(publicDir, 'models'), (f) => /\.bin$/i.test(f));
for (const bin of rawBins) {
  violations.push(`Ship gzip atlas chunks only (.bin.gz), not raw .bin: ${path.relative(KEV_ROOT, bin)}`);
}

const srcFiles = walk(path.join(KEV_ROOT, 'src'), (f) => /\.(tsx?|jsx?)$/.test(f));
for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(KEV_ROOT, file);
  // 5. No download UI for the licensed assets: flag download affordances
  // aimed at the asset files themselves (an `href`/`download` attribute or
  // save handler referencing model-x.glb, the body-*.bin chunks or the
  // atlas manifest). Prose like "no download UI" plus a docs reference is
  // not an affordance and must not trip the gate.
  if (/download[^"'\n]{0,80}(model-x\.glb|body-[^"'\n]{0,20}\.bin|models\/atlas\.json)/i.test(text)) {
    violations.push(`${rel} appears to offer a download of a licensed asset`);
  }
  if (/(href|to)\s*[=:]\s*["'{][^"'\n]*(model-x\.glb|body-[^"'\n]{0,20}\.bin)/i.test(text)) {
    violations.push(`${rel} links directly to a licensed asset file`);
  }
}

// 3. Immersive subject catalog carries attributions.
const subjects = read('src/lib/immersiveSubjects.js');
if (subjects === null) {
  violations.push('src/lib/immersiveSubjects.js missing');
} else {
  if (!/CC BY 4\.0|BodyParts3D/.test(subjects)) violations.push('immersiveSubjects.js: anatomy attribution (CC BY 4.0 / BodyParts3D) missing');
  if (!/Model X Studio/.test(subjects)) violations.push('immersiveSubjects.js: vehicle attribution (Model X Studio) missing');
  if (!/docs\/ATTRIBUTION-human-atlas\.md/.test(subjects)) violations.push('immersiveSubjects.js: anatomy attribution must reference docs/ATTRIBUTION-human-atlas.md');
  if (!/docs\/ATTRIBUTION-model-x\.md/.test(subjects)) violations.push('immersiveSubjects.js: vehicle attribution must reference docs/ATTRIBUTION-model-x.md');
}

// 4. Compiled packs carry per-entry attribution.
const challengePack = JSON.parse(read('backend/packs/challenge_packs.json') || '{}');
for (const ch of challengePack.challenges || []) {
  if (ch.id.startsWith('atlas-') && !/CC BY 4\.0/.test(ch.attribution || '')) {
    violations.push(`challenge ${ch.id}: missing BodyParts3D CC BY 4.0 attribution`);
  }
  if (ch.id.startsWith('modelx-') && !/Model X Studio/.test(ch.attribution || '')) {
    violations.push(`challenge ${ch.id}: missing Model X Studio attribution`);
  }
}
const studyPack = JSON.parse(read('backend/packs/study_kit_packs.json') || '{}');
const labs = studyPack.labs || {};
if (labs.anatomy && !/CC BY 4\.0/.test(labs.anatomy.attribution || '')) {
  violations.push('study kit anatomy: missing CC BY 4.0 attribution');
}
if (labs.vehicle && !/Model X Studio/.test(labs.vehicle.attribution || '')) {
  violations.push('study kit vehicle: missing Model X Studio attribution');
}

if (violations.length) {
  console.error(`attribution-check FAILED (${violations.length} violation(s)):`);
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}
console.log(
  `attribution-check OK: docs present, embedded-asset policy enforced, ` +
    `${(challengePack.challenges || []).length} pack challenges + ${Object.keys(labs).length} study kits attributed, no download UI.`
);
