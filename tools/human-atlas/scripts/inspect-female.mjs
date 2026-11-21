// Inspect the HuBMAP female GLB: node names, mesh counts, ontology ids, and
// the system grouping, so the converter can map every mesh to a display system.
// Run: node scripts/inspect-female.mjs
import fs from 'node:fs';

const path = new URL('./_female_src/3d-vh-f-united.glb', import.meta.url);
const buf = fs.readFileSync(path);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));

const nodes = json.nodes || [];
const meshes = json.meshes || [];
console.log('nodes:', nodes.length, '| meshes:', meshes.length, '| accessors:', (json.accessors || []).length);

// Walk the scene graph, collecting mesh-bearing nodes with their parent chain.
const byParent = new Map();
nodes.forEach((n, i) => (n.children || []).forEach((c) => byParent.set(c, i)));
function chain(i) {
  const names = [];
  let cur = i;
  while (cur !== undefined) {
    names.unshift(nodes[cur].name || `#${cur}`);
    cur = byParent.get(cur);
  }
  return names;
}

const meshNodes = [];
nodes.forEach((n, i) => {
  if (n.mesh !== undefined) {
    meshNodes.push({
      index: i,
      name: n.name,
      chain: chain(i).join(' / '),
      label: n.extras?.label,
      ontology: n.extras?.ontologyid,
      fma: n.extras?.representation_of,
      mesh: n.mesh,
    });
  }
});
console.log('mesh-bearing nodes:', meshNodes.length);

// Top-level system groups (children of the VH_F root).
const root = nodes.findIndex((n) => n.name === 'VH_F');
const groups = (nodes[root]?.children || []).map((c) => nodes[c].name);
console.log('\nsystem groups under VH_F:');
groups.forEach((g) => console.log('  -', g));

// Sample of mesh node names per group.
console.log('\nsample mesh nodes (first 40):');
meshNodes.slice(0, 40).forEach((m) => console.log(`  ${m.name}  [${m.label || m.ontology || ''}]  <- ${m.chain}`));

// Unique top-level group for each mesh node (2nd element of chain after VH_F).
const byGroup = new Map();
meshNodes.forEach((m) => {
  const parts = m.chain.split(' / ');
  const grp = parts[1] || 'other';
  byGroup.set(grp, (byGroup.get(grp) || 0) + 1);
});
console.log('\nmesh counts per top-level group:');
[...byGroup.entries()].sort((a, b) => b[1] - a[1]).forEach(([g, n]) => console.log(`  ${n}\t${g}`));
