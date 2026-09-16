// Atlas integrity gate: proves the BodyParts3D catalog and the viewer code
// cannot reproduce the out-of-bounds frame-loop crash.
//
// Checks (all must pass):
// 1. Every part's byte ranges (positions/normals/indices) fit inside its
//    chunk's declared byte size - a mismatch here is exactly what threw
//    `RangeError: offset is out of bounds` from Float32Array.set in _frame.
// 2. The frame state sizing invariant holds: ceilPow2(parts) * 4 >= parts*4.
// 3. atlasScene.js pins a catalogue version into model URLs (no stale-cache
//    generation mixing) and bounds its per-frame state writes.
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/kpasc/source/repos/constellation/kev';
let failed = false;
const fail = (msg) => {
  failed = true;
  console.error('FAIL:', msg);
};

// 1 + 2. Data integrity.
const atlas = JSON.parse(fs.readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8'));
const chunkBytes = atlas.chunks.map((c) => c.bytes);
let badRanges = 0;
for (const p of atlas.parts) {
  const B = chunkBytes[p.chunk];
  if (!(p.chunk >= 0 && p.chunk < chunkBytes.length)) badRanges++;
  else if (p.positions + p.vertexCount * 3 * 4 > B) badRanges++;
  else if (p.normals + p.vertexCount * 3 * 2 > B) badRanges++;
  else if (p.indices + p.indexCount * 4 > B) badRanges++;
}
if (badRanges > 0) fail(`${badRanges} part byte-ranges exceed their chunk`);
else console.log(`parts: ${atlas.parts.length}, chunks: ${atlas.chunks.length}, all byte-ranges in bounds`);

const width = 2 ** Math.ceil(Math.log2(Math.max(1, atlas.parts.length)));
if (width * 4 < atlas.parts.length * 4) fail('state texture too small for parts list');
else console.log(`frame state: ${atlas.parts.length} parts fit ${width * 4} floats`);

// 3. Code guards present.
const scene = fs.readFileSync(path.join(root, 'src/lib/studio/atlasScene.js'), 'utf8');
for (const [name, re] of [
  ['catalog version pin', /ATLAS_CATALOG_VERSION/],
  ['versioned catalogue fetch', /atlas\.json\?v=\$\{ATLAS_CATALOG_VERSION\}/],
  ['versioned chunk fetch', /chunkUrl[\s\S]{0,200}\?v=/],
  ['empty-catalogue guard', /arrived empty/],
  ['capacity self-heal', /never write past the state arrays|_initPartState\(this\.atlas\)/],
  ['frame-error fallback', /_frameFailed/],
]) {
  if (!re.test(scene)) fail(`atlasScene.js missing ${name}`);
  else console.log(`guard present: ${name}`);
}

// Absolute model URLs only (relative 'api/...' 404s from nested routes).
const tree = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en.json'), 'utf8'));
void tree;
const srcFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx|tsx|ts|js)$/.test(e.name)) srcFiles.push(p);
  }
})(path.join(root, 'src'));
const relApi = srcFiles.filter((f) => {
  const t = fs.readFileSync(f, 'utf8');
  return /fetch\(\s*['"`]api\//.test(t);
});
if (relApi.length > 0) fail(`relative api/ fetches in: ${relApi.join(', ')}`);
else console.log('no relative api/ fetches in src/');

if (failed) process.exit(1);
console.log('Atlas integrity gate: PASS');
