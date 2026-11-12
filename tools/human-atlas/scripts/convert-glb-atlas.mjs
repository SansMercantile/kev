// Convert GLB files into KEV atlas format (atlas-<species>.json + <species>-N.bin chunks).
// Uses @gltf-transform to read the GLB, then packs geometry matching the human atlas schema.
// Run: node scripts/convert-glb-atlas.mjs <input.glb> <species> [display_name] [system]
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const [,, inputPath, species, displayName, system] = process.argv;
if (!inputPath || !species) {
  console.error('Usage: node convert-glb-atlas.mjs <input.glb> <species> [display_name] [system]');
  process.exit(1);
}

const name = displayName || species.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const sys = system || 'skeletal';
const CHUNK_TARGET = 4_000_000;

const OUT = new URL('../public/models/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

console.log(`Reading ${inputPath} ...`);
const doc = await io.read(inputPath);
const root = doc.getRoot();

// Collect all mesh primitives with positions
const entries = [];
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const nodeName = node.getName() || species;
  for (const prim of mesh.listPrimitives()) {
    const posAttr = prim.getAttribute('POSITION');
    if (!posAttr) continue;
    const pos = posAttr.getArray();
    const idx = prim.getIndices();
    const indices = idx ? idx.getArray() : null;
    if (!indices) continue;
    entries.push({ id: nodeName, pos, indices, vertexCount: pos.length / 3 });
  }
}

console.log(`Found ${entries.length} mesh primitives`);

if (entries.length === 0) {
  console.error('No geometry found in GLB.');
  process.exit(1);
}

// Compute whole-body bounds for centering
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const e of entries) {
  for (let i = 0; i < e.pos.length; i += 3) {
    minX = Math.min(minX, e.pos[i]); maxX = Math.max(maxX, e.pos[i]);
    minY = Math.min(minY, e.pos[i + 1]); maxY = Math.max(maxY, e.pos[i + 1]);
    minZ = Math.min(minZ, e.pos[i + 2]); maxZ = Math.max(maxZ, e.pos[i + 2]);
  }
}
const cx = (minX + maxX) / 2, cyFloor = minY, cz = (minZ + maxZ) / 2;

// Scale to meters if needed
let scale = 1.0;
const height = maxY - minY;
if (height > 100) scale = 0.001;
else if (height > 10) scale = 0.01;
console.log(`Height: ${height.toFixed(1)} raw units, scale=${scale}`);

// Compute vertex normals from face normals
function computeNormals(pos, indices, vc) {
  const accum = new Float32Array(vc * 3);
  for (let t = 0; t < indices.length; t += 3) {
    const i0 = indices[t], i1 = indices[t + 1], i2 = indices[t + 2];
    if (i0 >= vc || i1 >= vc || i2 >= vc) continue;
    const p0 = [pos[i0 * 3], pos[i0 * 3 + 1], pos[i0 * 3 + 2]];
    const p1 = [pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]];
    const p2 = [pos[i2 * 3], pos[i2 * 3 + 1], pos[i2 * 3 + 2]];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1];
    const ny = e1[2] * e2[0] - e1[0] * e2[2];
    const nz = e1[0] * e2[1] - e1[1] * e2[0];
    for (const vi of [i0, i1, i2]) {
      accum[vi * 3] += nx; accum[vi * 3 + 1] += ny; accum[vi * 3 + 2] += nz;
    }
  }
  const normals = new Int16Array(vc * 3);
  for (let i = 0; i < vc; i++) {
    const nx = accum[i * 3], ny = accum[i * 3 + 1], nz = accum[i * 3 + 2];
    const len = Math.hypot(nx, ny, nz) || 1;
    normals[i * 3] = Math.round((nx / len) * 32767);
    normals[i * 3 + 1] = Math.round((ny / len) * 32767);
    normals[i * 3 + 2] = Math.round((nz / len) * 32767);
  }
  return normals;
}

// Pack into chunks
const parts = [];
const chunks = [];
let blob = Buffer.alloc(0);
let chunkIdx = 0;
let totalTriangles = 0;

function flushChunk() {
  if (blob.length === 0) return;
  const url = `/models/${species}-${chunkIdx}.bin`;
  fs.writeFileSync(new URL(url.split('/').pop(), OUT), blob);
  chunks.push({ url, bytes: blob.length });
  blob = Buffer.alloc(0);
  chunkIdx++;
}

function append(buf) {
  const pad = (4 - (blob.length % 4)) % 4;
  if (pad) blob = Buffer.concat([blob, Buffer.alloc(pad)]);
  const offset = blob.length;
  blob = Buffer.concat([blob, buf]);
  return offset;
}

for (const e of entries) {
  const vc = e.vertexCount;
  // Transform positions: center + scale
  const posBuf = Buffer.alloc(vc * 12);
  let bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vc; i++) {
    const px = (e.pos[i * 3] - cx) * scale;
    const py = (e.pos[i * 3 + 1] - cyFloor) * scale;
    const pz = (e.pos[i * 3 + 2] - cz) * scale;
    posBuf.writeFloatLE(px, i * 12);
    posBuf.writeFloatLE(py, i * 12 + 4);
    posBuf.writeFloatLE(pz, i * 12 + 8);
    bmin[0] = Math.min(bmin[0], px); bmin[1] = Math.min(bmin[1], py); bmin[2] = Math.min(bmin[2], pz);
    bmax[0] = Math.max(bmax[0], px); bmax[1] = Math.max(bmax[1], py); bmax[2] = Math.max(bmax[2], pz);
  }

  const normals = computeNormals(e.pos, e.indices, vc);
  const normBuf = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength);
  const idxBuf = Buffer.from(e.indices.buffer, e.indices.byteOffset, e.indices.byteLength);

  if (blob.length > CHUNK_TARGET) flushChunk();

  const po = append(posBuf);
  const no = append(normBuf);
  const io_ = append(idxBuf);

  parts.push({
    id: `GLB_${species}_${parts.length}`,
    name: e.id === species ? name : `${name} - ${e.id}`,
    conceptId: `GLB_${species}_${parts.length}`,
    system: sys,
    chunk: chunkIdx,
    positions: po,
    normals: no,
    indices: io_,
    vertexCount: vc,
    indexCount: e.indices.length,
    bounds: [bmin, bmax],
  });
  totalTriangles += e.indices.length / 3;
}

flushChunk();

const manifest = {
  version: 'Smithsonian DPO 1.0',
  species,
  sex: 'unknown',
  source: 'Smithsonian Digitization Program Office (CC0)',
  scope: `${name} - ${parts.length} parts, ${totalTriangles.toLocaleString()} triangles`,
  parts,
  chunks,
  concepts: parts.map(p => ({ id: p.id, name: p.name, elements: [p.id] })),
  triangles: totalTriangles,
};

fs.writeFileSync(new URL(`atlas-${species}.json`, OUT), JSON.stringify(manifest, null, 0));

console.log(JSON.stringify({
  parts: parts.length,
  triangles: totalTriangles,
  bytes: chunks.reduce((n, c) => n + c.bytes, 0),
  chunks: chunks.length,
  systems: [sys],
}, null, 2));
