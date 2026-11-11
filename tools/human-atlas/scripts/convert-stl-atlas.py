"""Convert binary STL files into KEV atlas format (atlas-<species>.json + <species>-N.bin).
Handles single-mesh STLs (like DigiMorph specimens) by treating them as one anatomical part.

Run: python scripts/convert-stl-atlas.py <input.stl> <species> [display_name] [system]

Output: public/models/atlas-<species>.json + public/models/<species>-N.bin
"""
import struct, math, json, sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
CHUNK_TARGET = 4_000_000


def read_binary_stl(path):
    """Read binary STL, return (vertices, indices, normals_from_stl)."""
    data = path.read_bytes()
    assert len(data) >= 84, 'STL too small'
    tri_count = struct.unpack_from('<I', data, 80)[0]
    expected = 80 + 4 + tri_count * 50
    assert len(data) == expected, f'Expected {expected} bytes, got {len(data)}'

    # Dedup vertices using a spatial hash
    vertex_map = {}
    vertices = []
    indices = []
    normals_stl = []

    for i in range(tri_count):
        offset = 84 + i * 50
        nx, ny, nz = struct.unpack_from('<3f', data, offset)
        normals_stl.append((nx, ny, nz))
        for v in range(3):
            x, y, z = struct.unpack_from('<3f', data, offset + 12 + v * 12)
            # Blender Z-up -> KEV Y-up (approximate; STL is usually Z-up)
            # Keep original orientation for now; animal models vary
            key = (round(x, 6), round(y, 6), round(z, 6))
            if key not in vertex_map:
                vertex_map[key] = len(vertices) // 3
                vertices.extend([x, y, z])
            indices.append(vertex_map[key])

    return vertices, indices, normals_stl


def compute_normals(vertices, indices):
    """Compute per-vertex normals from face normals."""
    vc = len(vertices) // 3
    accum = [[0.0, 0.0, 0.0] for _ in range(vc)]

    for t in range(0, len(indices), 3):
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
            accum[vi][0] += nx
            accum[vi][1] += ny
            accum[vi][2] += nz

    normals = []
    for nx, ny, nz in accum:
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        normals.extend([nx / length, ny / length, nz / length])
    return normals


def convert(stl_path, species, display_name=None, system='skeletal'):
    """Convert an STL to atlas format."""
    display_name = display_name or species.replace('-', ' ').title()
    print(f'Reading {stl_path} ...')
    vertices, indices, _ = read_binary_stl(stl_path)
    vc = len(vertices) // 3
    tc = len(indices) // 3
    print(f'  Vertices: {vc:,}, Triangles: {tc:,}')

    # Compute per-vertex normals
    normals = compute_normals(vertices, indices)

    # Compute bounds
    xs = vertices[0::3]
    ys = vertices[1::3]
    zs = vertices[2::3]
    bounds_min = [min(xs), min(ys), min(zs)]
    bounds_max = [max(xs), max(ys), max(zs)]

    # Center the model
    cx = (bounds_min[0] + bounds_max[0]) / 2
    cy = bounds_min[1]  # Rest on y=0
    cz = (bounds_min[2] + bounds_max[2]) / 2

    # Scale to meters if the model seems large (STL often in mm)
    height = bounds_max[1] - bounds_min[1]
    scale = 1.0
    if height > 100:
        scale = 0.001
    elif height > 10:
        scale = 0.01

    print(f'  Height: {height:.2f} raw units, scale={scale}')

    # Build the part data
    pos_buf = bytearray(vc * 12)
    norm_buf = bytearray(vc * 6)
    idx_buf = bytearray(len(indices) * 4)

    for i in range(vc):
        px = (vertices[i * 3] - cx) * scale
        py = (vertices[i * 3 + 1] - cy) * scale
        pz = (vertices[i * 3 + 2] - cz) * scale
        struct.pack_into('<3f', pos_buf, i * 12, px, py, pz)

        nx, ny, nz = normals[i * 3:i * 3 + 3]
        struct.pack_into('<3h', norm_buf, i * 6,
                         max(-32767, min(32767, round(nx * 32767))),
                         max(-32767, min(32767, round(ny * 32767))),
                         max(-32767, min(32767, round(nz * 32767))))

    for i, v in enumerate(indices):
        struct.pack_into('<I', idx_buf, i * 4, v)

    # Pack into chunk
    blob = bytearray()
    pad4 = lambda: blob.extend(b'\x00' * ((4 - len(blob) % 4) % 4))
    def append(data):
        pad4()
        offset = len(blob)
        blob.extend(data)
        return offset

    po = append(pos_buf)
    no = append(norm_buf)
    io = append(idx_buf)

    # Recompute bounds after transform
    bmin = [float('inf')] * 3
    bmax = [float('-inf')] * 3
    for i in range(vc):
        for a in range(3):
            v = struct.unpack_from('<f', pos_buf, i * 12 + a * 4)[0]
            bmin[a] = min(bmin[a], v)
            bmax[a] = max(bmax[a], v)

    part_id = f'STL_{species}'
    part = {
        'id': part_id,
        'name': display_name,
        'conceptId': part_id,
        'system': system,
        'chunk': 0,
        'positions': po,
        'normals': no,
        'indices': io,
        'vertexCount': vc,
        'indexCount': len(indices),
        'bounds': [bmin, bmax],
    }

    chunk_url = f'/models/{species}-0.bin'
    (OUT / f'{species}-0.bin').write_bytes(blob)

    manifest = {
        'version': f'DigiMorph STL 1.0',
        'species': species,
        'sex': 'unknown',
        'source': 'DigiMorph.org (UT Austin)',
        'scope': f'{display_name} - {vc:,} vertices, {tc:,} triangles',
        'parts': [part],
        'chunks': [{'url': chunk_url, 'bytes': len(blob)}],
        'concepts': [{'id': part_id, 'name': display_name, 'elements': [part_id]}],
        'triangles': tc,
    }

    manifest_path = OUT / f'atlas-{species}.json'
    manifest_path.write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')

    print(f'\n=== {species} Atlas ===')
    print(json.dumps({
        'parts': 1,
        'triangles': tc,
        'bytes': len(blob),
        'chunks': 1,
        'systems': [system],
    }, indent=2))


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python convert-stl-atlas.py <input.stl> <species> [display_name] [system]')
        sys.exit(1)
    stl = Path(sys.argv[1])
    sp = sys.argv[2]
    dn = sys.argv[3] if len(sys.argv) > 3 else None
    sy = sys.argv[4] if len(sys.argv) > 4 else 'skeletal'
    convert(stl, sp, dn, sy)
