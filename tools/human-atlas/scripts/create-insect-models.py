"""Create high-quality procedural insect anatomy models for KEV.
Each insect is built with proper anatomical segmentation:
- Head (with compound eyes, antennae, mouthparts)
- Thorax (3 segments, each with a pair of legs)
- Abdomen (segmented)
- Wings (where appropriate)

Output: public/models/atlas-<insect>.json + <insect>-0.bin
"""
import struct, math, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

# Insect body plan parameters
INSECT_SPECIES = {
    'butterfly': {
        'name': 'Monarch Butterfly (Danaus plexippus)',
        'body_length': 0.06,  # 6cm
        'body_width': 0.015,
        'leg_length': 0.02,
        'antenna_length': 0.025,
        'wing_span': 0.12,  # 12cm wingspan
        'wing_shape': 'broad',  # broad scaled wings
        'color': '#ff6b35',  # monarch orange
        'segments': 13,  # head + 3 thorax + 9 abdomen
    },
    'honeybee': {
        'name': 'Western Honeybee (Apis mellifera)',
        'body_length': 0.015,  # 15mm
        'body_width': 0.008,
        'leg_length': 0.008,
        'antenna_length': 0.006,
        'wing_span': 0.025,
        'wing_shape': 'narrow',  # narrow membranous wings
        'color': '#d4a017',  # honeybee gold
        'segments': 13,
    },
    'ant': {
        'name': 'Carpenter Ant (Camponotus pennsylvanicus)',
        'body_length': 0.012,  # 12mm
        'body_width': 0.005,
        'leg_length': 0.006,
        'antenna_length': 0.008,
        'wing_span': 0.0,  # workers are wingless
        'wing_shape': 'none',
        'color': '#1a1a1a',  # black ant
        'segments': 13,
    },
    'beetle': {
        'name': 'Stag Beetle (Lucanus cervus)',
        'body_length': 0.05,  # 5cm
        'body_width': 0.02,
        'leg_length': 0.015,
        'antenna_length': 0.02,
        'wing_span': 0.06,
        'wing_shape': 'hardened',  # elytra (hardened forewings)
        'color': '#4a2c0a',  # dark brown
        'segments': 13,
    },
    'dragonfly': {
        'name': 'Common Green Darner (Anax junius)',
        'body_length': 0.07,  # 7cm
        'body_width': 0.008,
        'leg_length': 0.012,
        'antenna_length': 0.003,
        'wing_span': 0.10,  # 10cm wingspan
        'wing_shape': 'long',  # long transparent wings
        'color': '#2e8b57',  # green darner
        'segments': 13,
    },
    'grasshopper': {
        'name': 'Differential Grasshopper (Melanoplus differentialis)',
        'body_length': 0.04,  # 4cm
        'body_width': 0.012,
        'leg_length': 0.025,  # long hind legs for jumping
        'antenna_length': 0.015,
        'wing_span': 0.06,
        'wing_shape': 'folded',  # folded wings along body
        'color': '#6b8e23',  # olive green
        'segments': 13,
    },
}


def create_insect_geometry(species_id, params):
    """Create a procedurally generated insect model with proper anatomy."""
    name = params['name']
    L = params['body_length']
    W = params['body_width']
    legL = params['leg_length']
    antL = params['antenna_length']
    wingS = params['wing_span']
    wingShape = params['wing_shape']
    color = params['color']
    n_segments = params['segments']

    vertices = []
    indices = []
    parts = []

    # Helper: add a box segment
    def add_box(cx, cy, cz, sx, sy, sz, part_name):
        """Add a box (8 vertices, 12 triangles) centered at (cx, cy, cz)."""
        base = len(vertices) // 3
        hx, hy, hz = sx / 2, sy / 2, sz / 2
        verts = [
            (cx - hx, cy - hy, cz - hz), (cx + hx, cy - hy, cz - hz),
            (cx + hx, cy + hy, cz - hz), (cx - hx, cy + hy, cz - hz),
            (cx - hx, cy - hy, cz + hz), (cx + hx, cy - hy, cz + hz),
            (cx + hx, cy + hy, cz + hz), (cx - hx, cy + hy, cz + hz),
        ]
        vertices.extend([v for vert in verts for v in vert])
        # 12 triangles (2 per face)
        tris = [
            (0, 1, 2), (0, 2, 3),  # front
            (4, 5, 6), (4, 6, 7),  # back
            (0, 1, 5), (0, 5, 4),  # bottom
            (2, 3, 7), (2, 7, 6),  # top
            (0, 3, 7), (0, 7, 4),  # left
            (1, 2, 6), (1, 6, 5),  # right
        ]
        indices.extend([(base + t[0], base + t[1], base + t[2]) for t in tris])
        parts.append({'name': part_name, 'vertexStart': base * 3, 'vertexCount': 8, 'indexStart': len(indices) - 36, 'indexCount': 36})

    # Helper: add a cylinder (for legs, antennae, wings)
    def add_cylinder(cx, cy, cz, radius, height, segments, part_name, axis='y'):
        """Add a cylinder along the specified axis."""
        base = len(vertices) // 3
        # Top and bottom circles
        for i in range(segments):
            angle = (i / segments) * 2 * math.pi
            x = radius * math.cos(angle)
            z = radius * math.sin(angle)
            if axis == 'y':
                vertices.extend([cx + x, cy - height / 2, cz + z])
            elif axis == 'x':
                vertices.extend([cx - height / 2, cy + x, cz + z])
            else:  # z
                vertices.extend([cx + x, cy + height / 2, cz + z])
        for i in range(segments):
            angle = (i / segments) * 2 * math.pi
            x = radius * math.cos(angle)
            z = radius * math.sin(angle)
            if axis == 'y':
                vertices.extend([cx + x, cy + height / 2, cz + z])
            elif axis == 'x':
                vertices.extend([cx + height / 2, cy + x, cz + z])
            else:  # z
                vertices.extend([cx + x, cy + height / 2, cz + z])
        # Side faces
        for i in range(segments):
            ni = (i + 1) % segments
            indices.extend([
                (base + i, base + ni, base + segments + i),
                (base + ni, base + segments + ni, base + segments + i),
            ])
        # Top and bottom caps (only if segments > 2)
        if segments > 2:
            for i in range(1, segments - 1):
                indices.append((base, base + i, base + i + 1))
                indices.append((base + segments, base + segments + i + 1, base + segments + i))
        total_verts = 2 * segments
        total_tris = 4 * segments
        parts.append({'name': part_name, 'vertexStart': base * 3, 'vertexCount': total_verts, 'indexStart': len(indices) - total_tris * 3, 'indexCount': total_tris * 3})

    # Build the insect body
    # Head (front 1/4)
    head_len = L * 0.25
    head_width = W * 1.2
    add_box(0, 0, -L * 0.375, head_width, head_width * 0.8, head_len, 'Head')

    # Compound eyes (two spheres on sides of head)
    eye_r = head_width * 0.35
    for side in [-1, 1]:
        add_cylinder(side * head_width * 0.4, head_width * 0.15, -L * 0.375, eye_r, head_width * 0.2, 8, f'Eye {"left" if side < 0 else "right"}', axis='z')

    # Antennae (two thin cylinders from head)
    for side in [-1, 1]:
        add_cylinder(side * head_width * 0.15, head_width * 0.3, -L * 0.375 - antL * 0.3, antL * 0.05, antL, 6, f'Antenna {"left" if side < 0 else "right"}', axis='z')

    # Thorax (middle 1/3, 3 segments)
    thorax_len = L * 0.33
    thorax_width = W * 1.1
    for i in range(3):
        seg_len = thorax_len / 3
        seg_z = -L * 0.125 + i * seg_len + seg_len / 2
        add_box(0, 0, seg_z, thorax_width, thorax_width * 0.9, seg_len * 0.9, f'Thorax segment {i + 1}')

        # Legs (one pair per thorax segment)
        leg_y = -thorax_width * 0.4
        leg_z = seg_z
        for side in [-1, 1]:
            add_cylinder(side * thorax_width * 0.3, leg_y, leg_z, legL * 0.08, legL, 6, f'Leg {i + 1} {"left" if side < 0 else "right"}', axis='x')

    # Abdomen (rear 5/12, segmented)
    abdomen_len = L * 0.42
    abdomen_width = W * 0.9
    n_abd_segments = 7
    for i in range(n_abd_segments):
        seg_len = abdomen_len / n_abd_segments
        seg_z = L * 0.25 + i * seg_len + seg_len / 2
        seg_w = abdomen_width * (1 - i * 0.08)  # taper toward rear
        add_box(0, 0, seg_z, seg_w, seg_w * 0.8, seg_len * 0.85, f'Abdomen segment {i + 1}')

    # Wings (if present)
    if wingS > 0 and wingShape != 'none':
        wing_z = -L * 0.05  # attach at thorax
        wing_thickness = W * 0.02
        if wingShape == 'broad':
            # Butterfly: two pairs of broad wings
            for side in [-1, 1]:
                # Forewing
                add_box(side * wingS * 0.35, 0, wing_z, wingS * 0.7, wing_thickness, wingS * 0.25, f'Forewing {"left" if side < 0 else "right"}')
                # Hindwing
                add_box(side * wingS * 0.3, 0, wing_z + wingS * 0.2, wingS * 0.5, wing_thickness, wingS * 0.15, f'Hindwing {"left" if side < 0 else "right"}')
        elif wingShape == 'narrow':
            # Bee: two pairs of narrow wings
            for side in [-1, 1]:
                add_box(side * wingS * 0.4, 0, wing_z, wingS * 0.8, wing_thickness, wingS * 0.15, f'Wing {"left" if side < 0 else "right"}')
        elif wingShape == 'hardened':
            # Beetle: hardened forewings (elytra) that meet in a line down the back
            for side in [-1, 1]:
                add_box(side * wingS * 0.3, thorax_width * 0.1, wing_z, wingS * 0.55, wingS * 0.08, wingS * 0.3, f'Elytron {"left" if side < 0 else "right"}')
        elif wingShape == 'long':
            # Dragonfly: two pairs of long transparent wings
            for side in [-1, 1]:
                add_box(side * wingS * 0.4, 0, wing_z, wingS * 0.8, wing_thickness, wingS * 0.12, f'Wing {"left" if side < 0 else "right"}')
        elif wingShape == 'folded':
            # Grasshopper: wings folded along the body
            for side in [-1, 1]:
                add_box(side * thorax_width * 0.15, thorax_width * 0.1, wing_z, thorax_width * 0.25, wing_thickness, abdomen_len * 0.8, f'Wing {"left" if side < 0 else "right"}')

    return vertices, indices, parts, name, color


def convert_to_atlas(vertices, indices, parts, species_id, name, color):
    """Convert procedural geometry to atlas format."""
    vc = len(vertices) // 3
    tc = len(indices) // 3

    # Compute normals
    norm_accum = [[0.0, 0.0, 0.0] for _ in range(vc)]
    for t in range(0, len(indices), 3):
        i0, i1, i2 = indices[t]
        p0 = vertices[i0 * 3:i0 * 3 + 3]
        p1 = vertices[i1 * 3:i1 * 3 + 3]
        p2 = vertices[i2 * 3:i2 * 3 + 3]
        e1 = [p1[j] - p0[j] for j in range(3)]
        e2 = [p2[j] - p0[j] for j in range(3)]
        nx = e1[1] * e2[2] - e1[2] * e2[1]
        ny = e1[2] * e2[0] - e1[0] * e2[2]
        nz = e1[0] * e2[1] - e1[1] * e2[0]
        for vi in (i0, i1, i2):
            norm_accum[vi][0] += nx
            norm_accum[vi][1] += ny
            norm_accum[vi][2] += nz

    normals = []
    for nx, ny, nz in norm_accum:
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        normals.extend([nx / length, ny / length, nz / length])

    # Compute bounds
    xs = vertices[0::3]
    ys = vertices[1::3]
    zs = vertices[2::3]
    bmin = [min(xs), min(ys), min(zs)]
    bmax = [max(xs), max(ys), max(zs)]

    # Center the model
    cx = (bmin[0] + bmax[0]) / 2
    cy = bmin[1]
    cz = (bmin[2] + bmax[2]) / 2

    # Scale to meters (insects are small, keep at real scale)
    scale = 1.0

    # Build binary data
    pos_buf = bytearray(vc * 12)
    norm_buf = bytearray(vc * 6)
    idx_buf = bytearray(len(indices) * 12)

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

    for i, tri in enumerate(indices):
        struct.pack_into('<3I', idx_buf, i * 12, tri[0], tri[1], tri[2])

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

    part_id = f'INSECT_{species_id}'
    part = {
        'id': part_id,
        'name': name,
        'conceptId': part_id,
        'system': 'exoskeletal',
        'chunk': 0,
        'positions': po,
        'normals': no,
        'indices': io,
        'vertexCount': vc,
        'indexCount': len(indices),
        'bounds': [[min(xs) - cx, min(ys) - cy, min(zs) - cz], [max(xs) - cx, max(ys) - cy, max(zs) - cz]],
    }

    chunk_url = f'/models/{species_id}-0.bin'
    (OUT / f'{species_id}-0.bin').write_bytes(blob)

    manifest = {
        'version': 'KEV Procedural Insect 1.0',
        'species': species_id,
        'sex': 'unknown',
        'source': 'KEV Procedural Insect Generator',
        'scope': f'{name} - {vc:,} vertices, {tc:,} triangles',
        'parts': [part],
        'chunks': [{'url': chunk_url, 'bytes': len(blob)}],
        'concepts': [{'id': part_id, 'name': name, 'elements': [part_id]}],
        'triangles': tc,
    }

    (OUT / f'atlas-{species_id}.json').write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')

    print(f'  {name}: {vc:,} vertices, {tc:,} triangles')


# Generate all insect models
for species_id, params in INSECT_SPECIES.items():
    print(f'Creating {params["name"]} ...')
    vertices, indices, parts, name, color = create_insect_geometry(species_id, params)
    convert_to_atlas(vertices, indices, parts, species_id, name, color)

print('\n=== Insect models created ===')
print(f'Total species: {len(INSECT_SPECIES)}')
