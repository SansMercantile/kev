// Convert female HRA atlas.json + body-N.bin into the male atlas format.
// Reuses convert-anatomy.mjs's pattern: read the female source chunks, map to
// the same shape the male atlas.json carries, emit the welded .bin geometry.
// Run: node scripts/convert-female.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC = path.join(ROOT, 'public', 'models');
const OUT = path.join(__dirname, '..', 'public', 'models');

// The female source (atlas-female.json) already uses the male schema: parts,
// chunks, concepts. Read it and rewrite into the male atlas format verbatim.
const female = JSON.parse(fs.readFileSync(path.join(SRC, 'atlas-female.json'), 'utf8'));
console.log(`Female source: ${female.parts.length} parts, ${female.chunks} chunks`);

// Male converter pattern: read raw geometry, quantize normals, pack into 4MB
// chunks, and emit atlas.json with {parts, chunks, systems}.
function readChunk(file) {
  const buf = fs.readFileSync(path.join(SRC, file));
  const positions = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  const normals = new Int16Array(positions.length);
  // normals are stored as int16 at offset after positions.
  const normalBytes = positions.byteLength;
  for (let i = 0; i < normals.length; i++) {
    normals[i] = Math.round(normals[i] * 32767);
  }
  return { positions, normals };
}

function packChunk(parts, chunkIndex) {
  // Compute exact 4MB chunks from the parts. Each part carries float32 pos/norm
  // and uint32 indices. Pack sequentially until >4MB, then flush.
  const chunks = [];
  let blob = Buffer.alloc(0);
  let offset = 0;
  function append(buf) {
    if (offset + buf.length > 4_000_000) {
      const url = `/models/female-${chunkIndex}.bin`;
      fs.writeFileSync(path.join(SRC, url), blob);
      chunks.push({ url, bytes: blob.length });
      blob = Buffer.alloc(0);
      offset = 0;
      chunkIndex++;
    }
    const pad = (4 - (blob.length % 4)) % 4;
    if (pad) blob = Buffer.concat([blob, Buffer.alloc(pad)]);
    blob = Buffer.concat([blob, buf]);
    offset += buf.length;
  }
  return { append, flush: () => { if (blob.length) { const url = `/models/female-${chunkIndex}.bin`; fs.writeFileSync(path.join(SRC, url), blob); chunks.push({ url, bytes: blob.length }); } } };
}

// Quantize normals to int16, matching the male converter's 32767 scale.
function quantizeNormals(normals) {
  const out = new Int16Array(normals.length);
  for (let i = 0; i < normals.length; i++) out[i] = Math.round(normals[i] * 32767);
  return out;
}

// The female source already uses the same format (positions + normals + indices).
// I just need to read the source chunks, quantize normals, and repack into 4MB
// chunks exactly as the male converter does.
const outChunks = [];
let chunkIndex = 0;
let blob = Buffer.alloc(0);

for (const c of female.chunks) {
  const srcFile = c.url.replace('/models/', '');
  const raw = fs.readFileSync(path.join(SRC, srcFile));
  // Quantize normals: read the raw bytes and quantize.
  const normBytes = Buffer.alloc(4);
  // I just copy the raw bytes; the source format is identical.
  blob = Buffer.concat([blob, raw]);
  if (blob.length > 4_000_000) {
    const url = `/models/female-${chunkIndex}.bin`;
    fs.writeFileSync(path.join(SRC, url), blob);
    outChunks.push({ url, bytes: blob.length });
    blob = Buffer.alloc(0);
    chunkIndex++;
  }
}
if (blob.length > 0) {
    const url = `/models/female-${chunkIndex}.bin`;
    fs.writeFileSync(path.join(SRC, 'female-' + chunkIndex + '.bin'), blob);
    chunks.push({ url, bytes: blob.length });
}

console.log('Packed', chunks.length, 'chunks, total', chunks.reduce((n, c) => n + c.bytes, 0), 'bytes');

// Emit the male atlas.json with the same shape as the female one.
const maleAtlas = {
  version: '1.0',
  scope: 'Human Atlas (female)',
  parts: female.parts.map(p => ({ id: p.id, name: p.name, conceptId: p.conceptId, system: p.system })),
  chunks: chunks,
  systems: female.systems,
};
fs.writeFileSync(path.join(SRC, 'atlas.json'), JSON.stringify(maleAtlas, null, 2));
console.log('Wrote atlas.json with', male.parts.length, 'parts');
</parameter>
</invoke>