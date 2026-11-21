// Convert raw HRA animal GLB into KEV atlas format (atlas.json + body-N.bin chunks).
// Follows convert-female.mjs pattern: parse raw HRA source, emit atlas.json + geometry.
// Run: node scripts/convert-animal.mjs
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';

const SRC = new URL('./_female_src/3d-vh-f-united.glb', import.meta.url);
const OUT = new URL('../public/models/', import.meta.url);
const io = new NodeIO();
const doc = io.read(SRC);
const root = doc.getRoot();

// System map from the male atlas (VH_F): integumentary, nervous, muscular,
// reproductive, digestive, urinary, respiratory, cardiovascular, lymphatic,
// endocrine, skeletal. Split where HRA groups exist.
const SYSTEM_MAP = {
  integumentary: 'integumentary',
  nervous: 'nervous',
  muscular: 'muscular',
  reproductive: 'reproductive',
  digestive: 'digestive',
  urinary: 'urinary',
  respiratory: 'respiratory',
  cardiovascular: 'cardiovascular',
  lymphatic: 'lymphatic',
  endocrine: 'endocrine',
  skeletal: 'skeletal',
};

// HRA animal source: the raw HRA GLB is already optimized. Read and parse.
const meshes = root.meshes;
const accessors = root.accessors;
const bufferViews = root.bufferViews;
const buffers = root.buffers;

// For each mesh, compute bounds and split into body parts by system.
const parts = [];
const partBounds = new Map();
const partPositions = new Map();

for (const mesh of meshes) {
  const name = mesh.name || 'unnamed';
  const system = SYSTEM_MAP[name] || 'connective';
  const prim = mesh.primitives[0];
  if (!prim) continue;

  const pos = prim.attributes.POSITION;
  const idx = prim.indices;
  if (!pos || !idx) continue;

  const posData = accessors[pos];
  const idxData = accessors[idx];
  const posArray = new Float32Array(posData.count * 3);
  const idxArray = new Uint32Array(idxData.count);

  for (let i = 0; i < posData.count; i++) {
    const offset = posData.byteOffset + i * 3 * 4;
    posArray[i * 3] = buffers[0].buffer.readFloatLE(offset);
    posArray[i * 3 + 1] = buffers[0].buffer.readFloatLE(offset + 4);
    posArray[i * 3 + 2] = buffers[0].buffer.readFloatLE(offset + 4 * 2);
  }

  for (let i = 0; i < idxData.count; i++) {
    idxArray[i] = buffers[0].readUInt32LE(idxData.byteOffset + i * 4);
  }

  const part = {
    id: name,
    name,
    system,
    positions: posArray,
    indices: idxArray,
    vertexCount: posData.count,
    indexCount: idxData.count,
  };

  parts.push(part);
  partPositions.set(name, posArray);
}

// Whole-body bounds for stage layout.
const bounds = {
  minX: Infinity, maxX: -Infinity,
  minY: Infinity, maxY: -Infinity,
  minZ: Infinity, maxZ: Infinity,
};

for (const part of parts) {
  const pos = part.positions;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = bounds.maxX, bounds.maxY = Math.max(bounds.maxY, y);
    bounds.minZ = Math.min(bounds.minZ, z);
    bounds.maxZ = Math.max(bounds.maxZ, z);
  }
}

// Pack into ~4MB chunks (matches male pipeline).
const chunks = [];
const body = Buffer.alloc(0);
let chunkIndex = 0;

function flushChunk() {
  const url = `/models/female-${chunkIndex}.bin`;
  const payload = Buffer.from(body.buffer, body.byteOffset, body.length);
  fs.writeFileSync(new URL(url, OUT), payload);
  chunks.push({ url, bytes: payload.length });
  body.fill(0);
  chunkIndex++;
}

const partsOut = [];
for (const part of parts) {
  const { name, system, positions, indices, vertexCount, indexCount } = part;
  const posArray = new Float32Array(positions.length);
  const normArray = new Int16Array(positions.length / 3 * 3);
  const idxArray = new Uint32Array(indices.length);
  for (let i = 0; i < positions.length; i += 3) {
    posArray[i] = positions[i];
    posArray[i + 1] = positions[i + 1];
    posArray[i + 2] = positions[i + 2];
    normArray[i] = Math.round(normals[i] * 32767);
    normArray[i + 1] = Math.round(normals[i + 1] * 32767);
    normArray[i + 2] = Math.round(normals[i + 2] * 32767);
  }
  for (let i = 0; i < indices.length; i++) idxArray[i] = indices[i];

  const posData = Buffer.from(posArray.buffer);
  const normData = Buffer.from(normArray.buffer);
  const idxData = Buffer.from(idxArray.buffer);
  body.write(posData);
  body.write(normData);
  body.write(idxData);

  if (body.length > 4_000_000) flushChunk();
  partsOut.push({
    id: name,
    name,
    system,
    positions: posData,
    normals: normData,
    indices: idxData,
    vertexCount: part.vertexCount,
    indexCount: part.indexCount,
  });
}
flushChunk();

// Write the manifest.
const manifest = {
  version: 'HRA Female 1.5',
  parts: partsOut,
  chunks: chunks.length,
  systems: [...new Set(partsOut.map(p => p.system))].sort(),
};
fs.writeFileSync(new URL('atlas-female.json', OUT), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({
  parts: partsOut.length,
  chunks: chunks.length,
  bytes: chunks.reduce((n, c) => n + c.bytes, 0),
  systems: manifest.systems,
}, null, 2));