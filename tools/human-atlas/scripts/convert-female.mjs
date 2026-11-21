// Convert the HuBMAP Human Reference Atlas female GLB (3d-vh-f-united.glb)
// into KEV's atlas format: atlas-female.json + body-N.bin geometry chunks,
// matching the shape the male converter + optimize-anatomy.mjs produce so the
// same scene can stream either body. CC BY 4.0 (HuBMAP / Kristen Browne &
// Heidi Schlehlein). See docs/ATTRIBUTION-human-atlas.md.
//
// Run: node scripts/convert-female.mjs
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';

const SRC = new URL('./_female_src/3d-vh-f-united.glb', import.meta.url);
const OUT = new URL('../public/models/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

// HuBMAP top-level group -> KEV display system id (matches the male's 15 so
// both bodies read with the same vocabulary; muscular/lymphatic stay partial
// in the female source and are labelled as such in the UI).
const SYSTEM_MAP = {
  VH_F_integumentary_system: 'integumentary',
  VH_F_nervous_system: 'nervous',
  VH_F_muscular_system: 'muscular',
  VH_F_reproductive_system: 'reproductive',
  VH_F_digestive_system: 'digestive',
  VH_F_urinary_system: 'urinary',
  VH_F_circulatory_system: 'arterial', // split below into venous where the name says so
  VH_F_respiratory_system: 'respiratory',
  VH_F_lymphatic_system: 'lymphatic',
  VH_F_skeletal_system: 'skeletal',
};
// Organs/systems the male atlas carries that the female GLB lacks a clean
// group for: route by name so the female still reads as a whole body.
const NAME_SYSTEM = [
  [/heart|cardiac|atrium|ventricle|myocardium|pericardium/i, 'cardiac'],
  [/brain|cerebr|cerebell|encephal|optic|retina|eye|cornea|lens|pupil|iris|sclera|choroid|vitreous|aqueous|conjunctiva|macula|fovea|cochlea|ear|vestibul/i, 'sensory'],
  [/vein|venous|vena|cava|jugular/i, 'venous'],
  [/lung|trachea|bronch|larynx|pharynx|diaphragm|pleura/i, 'respiratory'],
  [/stomach|intestin|colon|liver|pancrea|gallbladder|gall bladder|esophag|oesophag|duodenum|rectum|appendix|spleen/i, 'digestive'],
  [/kidney|ureter|bladder|urethra|renal/i, 'urinary'],
  [/ovary|ovarian|uterus|uterine|fallopian|cervix|vagina|placenta|umbilical|vulva|labium|clitoris|mammary|breast|nipple|areola|lactiferous/i, 'reproductive'],
  [/thyroid|adrenal|pituitary|pineal|thymus|parathyroid|pancrea(s)? (?!digest)/i, 'endocrine'],
  [/muscle|tendon|ligament|fascia|diaphragm muscle/i, 'muscular'],
  [/lymph|spleen|tonsil|thoracic duct/i, 'lymphatic'],
  [/bone|vertebr|rib|stern|femur|tibia|fibula|humerus|radius|ulna|pelvis|skull|mandible|clavicle|scapula|patella|carpal|tarsal|metatarsal|metacarpal|phalan|sacrum|coccyx|maxilla|zygomatic|nasal bone|palatine|vomer|hyoid|calcaneus|talus|navicular|cuneiform|cuboid|sesamoid|costal|cartilage/i, 'skeletal'],
  [/skin|integument|epidermis|dermis/i, 'integumentary'],
  [/nerve|neuron|ganglion|plexus|spinal cord|sciatic|radial|ulnar|median|femoral nerve/i, 'nervous'],
  [/artery|arterial|aorta|aortic|carotid|subclavian|iliac artery|femoral artery|brachial/i, 'arterial'],
];

function systemFor(groupName, nodeName, label) {
  for (const [re, sys] of NAME_SYSTEM) {
    if (re.test(label || '') || re.test(nodeName || '')) return sys;
  }
  return SYSTEM_MAP[groupName] || 'connective';
}

import { fileURLToPath } from 'node:url';
const io = new NodeIO();
const doc = await io.read(fileURLToPath(SRC));
const root = doc.getRoot();
const nodes = root.listNodes();
const meshes = root.listMeshes();
const accessors = root.listAccessors();

// Map node -> parent for the system-group chain.
const parentOf = new Map();
nodes.forEach((n) => n.listChildren().forEach((c) => parentOf.set(c, n)));
function topGroup(node) {
  let cur = node;
  let prev = null;
  while (parentOf.has(cur)) {
    prev = cur;
    cur = parentOf.get(cur);
  }
  // `prev` is the child of the VH_F root.
  return prev ? prev.getName() : '';
}

// Read a mesh primitive's position/normal/index arrays.
function readPrimitive(prim) {
  const posAttr = prim.getAttribute('POSITION');
  if (!posAttr) return null;
  const pos = posAttr.getArray();
  const normAttr = prim.getAttribute('NORMAL');
  const norm = normAttr ? normAttr.getArray() : null;
  const idx = prim.getIndices();
  const indices = idx ? idx.getArray() : null;
  return { pos, norm, indices };
}

// Female GLB is meter/Y-up already (the tool's historical note), but the
// male stage rests the body on a platform and centres it. We compute the
// whole-body bounds after load and translate to sit on y=0 centred on x/z.
const parts = [];
let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

const entries = [];
for (const node of nodes) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const name = node.getName();
  const label = node.getExtras()?.label || name.replace(/^VH_F_/, '').replace(/_/g, ' ');
  const grp = topGroup(node);
  const system = systemFor(grp, name, label);
  // A node may carry a multi-primitive mesh; emit one part per primitive,
  // named with a suffix when there is more than one.
  mesh.listPrimitives().forEach((prim, pi) => {
    const data = readPrimitive(prim);
    if (!data || !data.indices) return;
    const partId = pi > 0 ? `${name}__${pi}` : name;
    entries.push({ id: partId, name: label, system, ...data });
  });
}

// Whole-body bounds for staging.
for (const e of entries) {
  for (let i = 0; i < e.pos.length; i += 3) {
    minX = Math.min(minX, e.pos[i]); maxX = Math.max(maxX, e.pos[i]);
    minY = Math.min(minY, e.pos[i + 1]); maxY = Math.max(maxY, e.pos[i + 1]);
    minZ = Math.min(minZ, e.pos[i + 2]); maxZ = Math.max(maxZ, e.pos[i + 2]);
  }
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
// Rest the feet on y=0 and centre x/z; keep anatomical scale (metres).

// Pack into chunks (~4MB target), quantizing normals to signed 16-bit and
// converting positions to float32 with the staging translate applied.
let blob = Buffer.alloc(0);
let chunk = 0;
const chunks = [];
let totalTriangles = 0;

function flushChunk() {
  if (blob.length === 0) return;
  const url = `/models/female-${chunk}.bin`;
  fs.writeFileSync(new URL(url.split('/').pop(), OUT), blob);
  chunks.push({ url, bytes: blob.length });
  blob = Buffer.alloc(0);
  chunk++;
}
function append(buf) {
  const pad = (4 - (blob.length % 4)) % 4;
  if (pad) blob = Buffer.concat([blob, Buffer.alloc(pad)]);
  const offset = blob.length;
  blob = Buffer.concat([blob, buf]);
  return offset;
}

for (const e of entries) {
  const vc = e.pos.length / 3;
  const positions = new Float32Array(vc * 3);
  const normals = new Int16Array(vc * 3);
  for (let i = 0; i < vc; i++) {
    positions[i * 3] = e.pos[i * 3] - cx;
    positions[i * 3 + 1] = e.pos[i * 3 + 1] - minY;
    positions[i * 3 + 2] = e.pos[i * 3 + 2] - cz;
    let nx = 0, ny = 0, nz = 1;
    if (e.norm) {
      nx = e.norm[i * 3]; ny = e.norm[i * 3 + 1]; nz = e.norm[i * 3 + 2];
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
    }
    normals[i * 3] = Math.round(nx * 32767);
    normals[i * 3 + 1] = Math.round(ny * 32767);
    normals[i * 3 + 2] = Math.round(nz * 32767);
  }
  const indices = e.indices instanceof Uint32Array ? e.indices : Uint32Array.from(e.indices);
  if (blob.length > 4_000_000) flushChunk();
  const po = append(Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength));
  const no = append(Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength));
  const io_ = append(Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength));
  const bounds = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];
  for (let i = 0; i < vc; i++) {
    for (let a = 0; a < 3; a++) {
      bounds[0][a] = Math.min(bounds[0][a], positions[i * 3 + a]);
      bounds[1][a] = Math.max(bounds[1][a], positions[i * 3 + a]);
    }
  }
  parts.push({
    id: e.id, name: e.name, conceptId: e.id, system: e.system, chunk,
    positions: po, normals: no, indices: io_,
    vertexCount: vc, indexCount: indices.length, bounds,
  });
  totalTriangles += indices.length / 3;
}
flushChunk();

// Concepts: reuse the parts as their own concepts (the female GLB has rich
// per-node names; a full FMA concept hierarchy is out of scope for v1).
const concepts = entries.map((e) => ({ id: e.id, name: e.name, elements: [e.id] }));

const manifest = {
  version: 'HuBMAP HRA Female 1.5',
  sex: 'female',
  source: 'HuBMAP Human Reference Atlas',
  scope: 'Adult female reference anatomy - 888 source meshes',
  parts, chunks, concepts,
  triangles: totalTriangles,
};
fs.writeFileSync(new URL('atlas-female.json', OUT), JSON.stringify(manifest, null, 0));
console.log(JSON.stringify({
  parts: parts.length, concepts: concepts.length, triangles: totalTriangles,
  bytes: chunks.reduce((n, c) => n + c.bytes, 0), chunks: chunks.length,
  systems: [...new Set(parts.map((p) => p.system))].sort(),
}, null, 2));
