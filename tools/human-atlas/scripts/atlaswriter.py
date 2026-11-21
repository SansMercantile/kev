"""Shared writer for KEV atlas format.

Emits atlas-<species>.json + <species>-N.bin chunks byte-compatible with the
gold-standard pig atlas (convert-zpig.py) and the STL converter. All
generators (multi-part skeletons, organ systems, new species) write through
this so the frontend (atlasSceneExact.js) consumes a single format.

Format per part:
  positions : float32 x3 (centered on origin, floor at y=0)
  normals   : int16 x3 (unit, *32767)
  indices   : uint32
  parts packed into ~4MB chunks, 4-byte aligned offsets.
"""
import struct, math, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
CHUNK_TARGET = 4_000_000


def compute_normals(vertices, indices):
    """Per-vertex normals from averaged face normals. vertices=flat [x,y,z..]."""
    vc = len(vertices) // 3
    accum = [[0.0, 0.0, 0.0] for _ in range(vc)]
    for t in range(0, len(indices) - 2, 3):
        i0, i1, i2 = indices[t], indices[t + 1], indices[t + 2]
        if i0 >= vc or i1 >= vc or i2 >= vc:
            continue
        p0 = vertices[i0 * 3:i0 * 3 + 3]
        p1 = vertices[i1 * 3:i1 * 3 + 3]
        p2 = vertices[i2 * 3:i2 * 3 + 3]
        e1 = [p1[j] - p0[j] for j in range(3)]
        e2 = [p2[j] - p0[j] for j in range(3)]
        nx = e1[1] * e2[2] - e1[2] * e2[1]
        ny = e1[2] * e2[0] - e1[0] * e2[2]
        nz = e1[0] * e2[1] - e1[1] * e2[0]
        for vi in (i0, i1, i2):
            accum[vi][0] += nx; accum[vi][1] += ny; accum[vi][2] += nz
    out = []
    for nx, ny, nz in accum:
        l = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        out.extend([nx / l, ny / l, nz / l])
    return out


class Mesh:
    """A single named anatomical part."""
    def __init__(self, pid, name, system, vertices, indices):
        self.id = pid
        self.name = name
        self.system = system
        self.vertices = vertices      # flat [x,y,z,...] world units (pre-centering)
        self.indices = indices

    @property
    def vertex_count(self):
        return len(self.vertices) // 3

    @property
    def tri_count(self):
        return len(self.indices) // 3


def write_atlas(species, meshes, *, version, source, scope, sex='unknown',
                out_species=None, center=True, floor_y=True, scale=1.0):
    """Write atlas-<species>.json + <species>-N.bin. Returns manifest dict."""
    out_species = out_species or species
    if not meshes:
        raise ValueError('no meshes')

    # Global bounds for centering
    gmin = [float('inf')] * 3
    gmax = [float('-inf')] * 3
    for m in meshes:
        v = m.vertices
        for i in range(0, len(v), 3):
            for a in range(3):
                gmin[a] = min(gmin[a], v[i + a]); gmax[a] = max(gmax[a], v[i + a])
    cx = (gmin[0] + gmax[0]) / 2 if center else 0.0
    cy = gmin[1] if floor_y else 0.0
    cz = (gmin[2] + gmax[2]) / 2 if center else 0.0

    parts, chunks = [], []
    blob = bytearray()
    chunk_idx = 0
    total_tris = 0

    def flush():
        nonlocal blob, chunk_idx
        if not blob:
            return
        url = f'/models/{out_species}-{chunk_idx}.bin'
        (OUT / f'{out_species}-{chunk_idx}.bin').write_bytes(blob)
        chunks.append({'url': url, 'bytes': len(blob)})
        blob = bytearray()
        chunk_idx += 1

    def pad4():
        blob.extend(b'\x00' * ((4 - len(blob) % 4) % 4))

    def append(data):
        pad4()
        off = len(blob)
        blob.extend(data)
        return off

    for m in meshes:
        vc = m.vertex_count
        normals = compute_normals(m.vertices, m.indices)
        pos_buf = bytearray(vc * 12)
        norm_buf = bytearray(vc * 6)
        bmin = [float('inf')] * 3
        bmax = [float('-inf')] * 3
        for i in range(vc):
            px = (m.vertices[i * 3] - cx) * scale
            py = (m.vertices[i * 3 + 1] - cy) * scale
            pz = (m.vertices[i * 3 + 2] - cz) * scale
            struct.pack_into('<3f', pos_buf, i * 12, px, py, pz)
            bmin[0] = min(bmin[0], px); bmin[1] = min(bmin[1], py); bmin[2] = min(bmin[2], pz)
            bmax[0] = max(bmax[0], px); bmax[1] = max(bmax[1], py); bmax[2] = max(bmax[2], pz)
            nx, ny, nz = normals[i * 3:i * 3 + 3]
            struct.pack_into('<3h', norm_buf, i * 6,
                             max(-32767, min(32767, round(nx * 32767))),
                             max(-32767, min(32767, round(ny * 32767))),
                             max(-32767, min(32767, round(nz * 32767))))
        idx = [v for v in m.indices if 0 <= v < vc]
        idx = idx[:len(idx) - len(idx) % 3]
        idx_buf = bytearray(len(idx) * 4)
        for i, v in enumerate(idx):
            struct.pack_into('<I', idx_buf, i * 4, v)

        if len(blob) > CHUNK_TARGET:
            flush()
        po = append(pos_buf); no = append(norm_buf); io = append(idx_buf)
        parts.append({
            'id': m.id, 'name': m.name, 'conceptId': m.id, 'system': m.system,
            'chunk': chunk_idx, 'positions': po, 'normals': no, 'indices': io,
            'vertexCount': vc, 'indexCount': len(idx), 'bounds': [bmin, bmax],
        })
        total_tris += len(idx) // 3

    flush()
    concepts = [{'id': m.id, 'name': m.name, 'elements': [m.id]} for m in meshes]
    manifest = {
        'version': version, 'species': species, 'sex': sex, 'source': source,
        'scope': scope, 'parts': parts, 'chunks': chunks, 'concepts': concepts,
        'triangles': total_tris,
    }
    (OUT / f'atlas-{out_species}.json').write_text(
        json.dumps(manifest, separators=(',', ':')), encoding='utf-8')
    return manifest
