"""Create high-quality procedural models for common domestic animals and other
species from the brief. Each model has proper anatomical body plans:
- Quadruped mammals (dog, cat, horse, cow): 4 legs, tail, head with ears/snout
- Amphibians (frog): moist skin, long hind legs, short body
- Fish (shark, salmon): streamlined body, fins, tail

Output: public/models/atlas-<species>.json + <species>-0.bin
"""
import struct, math, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

# Species parameters
SPECIES = {
    'dog': {
        'name': 'Domestic Dog (Canis lupus familiaris)',
        'body_length': 0.60,  # 60cm
        'body_height': 0.35,  # 35cm at shoulder
        'leg_length': 0.25,
        'tail_length': 0.20,
        'ear_type': 'floppy',
        'snout_length': 0.12,
        'color': '#c4a574',  # tan
    },
    'cat': {
        'name': 'Domestic Cat (Felis catus)',
        'body_length': 0.45,  # 45cm
        'body_height': 0.25,  # 25cm at shoulder
        'leg_length': 0.18,
        'tail_length': 0.25,
        'ear_type': 'pointed',
        'snout_length': 0.06,
        'color': '#8b7355',  # brown tabby
    },
    'horse': {
        'name': 'Domestic Horse (Equus ferus caballus)',
        'body_length': 2.0,  # 2m
        'body_height': 1.6,  # 1.6m at shoulder
        'leg_length': 0.90,
        'tail_length': 0.50,
        'ear_type': 'pointed',
        'snout_length': 0.30,
        'color': '#8b4513',  # chestnut
    },
    'cow': {
        'name': 'Domestic Cow (Bos taurus)',
        'body_length': 1.8,  # 1.8m
        'body_height': 1.4,  # 1.4m at shoulder
        'leg_length': 0.70,
        'tail_length': 0.45,
        'ear_type': 'floppy',
        'snout_length': 0.20,
        'color': '#000000',  # black and white
    },
    'frog': {
        'name': 'European Common Frog (Rana temporaria)',
        'body_length': 0.08,  # 8cm
        'body_height': 0.04,  # 4cm
        'leg_length': 0.10,  # hind legs longer
        'tail_length': 0.0,  # no tail
        'ear_type': 'none',
        'snout_length': 0.015,
        'color': '#6b8e23',  # green
    },
    'shark': {
        'name': 'Great White Shark (Carcharodon carcharias)',
        'body_length': 4.5,  # 4.5m
        'body_height': 1.2,  # 1.2m tall
        'leg_length': 0.0,  # no legs
        'tail_length': 1.2,  # tail fin
        'ear_type': 'none',
        'snout_length': 0.6,
        'color': '#708090',  # slate gray
    },
    'salmon': {
        'name': 'Atlantic Salmon (Salmo salar)',
        'body_length': 0.75,  # 75cm
        'body_height': 0.25,  # 25cm tall
        'leg_length': 0.0,  # no legs
        'tail_length': 0.20,  # tail fin
        'ear_type': 'none',
        'snout_length': 0.08,
        'color': '#c0c0c0',  # silver
    },
}


def create_box(vertices, indices, cx, cy, cz, sx, sy, sz, part_name):
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
    tris = [
        (0, 1, 2), (0, 2, 3),  # front
        (4, 5, 6), (4, 6, 7),  # back
        (0, 1, 5), (0, 5, 4),  # bottom
        (2, 3, 7), (2, 7, 6),  # top
        (0, 3, 7), (0, 7, 4),  # left
        (1, 2, 6), (1, 6, 5),  # right
    ]
    indices.extend([(base + t[0], base + t[1], base + t[2]) for t in tris])


def create_cylinder(vertices, indices, cx, cy, cz, radius, height, segments, part_name, axis='y'):
    """Add a cylinder along the specified axis."""
    base = len(vertices) // 3
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
    for i in range(segments):
        ni = (i + 1) % segments
        indices.extend([
            (base + i, base + ni, base + segments + i),
            (base + ni, base + segments + ni, base + segments + i),
        ])
    if segments > 2:
        for i in range(1, segments - 1):
            indices.append((base, base + i, base + i + 1))
            indices.append((base + segments, base + segments + i + 1, base + segments + i))


def create_quadruped(vertices, indices, params):
    """Create a quadruped mammal (dog, cat, horse, cow)."""
    L = params['body_length']
    H = params['body_height']
    legL = params['leg_length']
    tailL = params['tail_length']
    earT = params['ear_type']
    snoutL = params['snout_length']

    body_w = H * 0.6  # body width
    head_l = L * 0.18  # head length

    # Body (thorax + abdomen)
    create_box(vertices, indices, 0, H * 0.5, 0, body_w, H * 0.7, L * 0.7, 'Body')

    # Head
    head_z = L * 0.45
    create_box(vertices, indices, 0, H * 0.65, head_z, body_w * 0.7, H * 0.5, head_l, 'Head')

    # Snout
    snout_z = head_z + head_l * 0.6
    create_box(vertices, indices, 0, H * 0.6, snout_z, body_w * 0.4, H * 0.3, snoutL, 'Snout')

    # Ears
    if earT == 'pointed':
        for side in [-1, 1]:
            create_box(vertices, indices, side * body_w * 0.25, H * 0.95, head_z, body_w * 0.15, H * 0.25, body_w * 0.05, f'Ear {"left" if side < 0 else "right"}')
    elif earT == 'floppy':
        for side in [-1, 1]:
            create_box(vertices, indices, side * body_w * 0.3, H * 0.75, head_z, body_w * 0.2, H * 0.3, body_w * 0.05, f'Ear {"left" if side < 0 else "right"}')

    # Legs (4)
    leg_y = H * 0.35
    leg_positions = [
        (-body_w * 0.35, leg_y, -L * 0.3),  # front left
        (body_w * 0.35, leg_y, -L * 0.3),   # front right
        (-body_w * 0.35, leg_y, L * 0.3),   # rear left
        (body_w * 0.35, leg_y, L * 0.3),    # rear right
    ]
    for i, (lx, ly, lz) in enumerate(leg_positions):
        create_cylinder(vertices, indices, lx, ly, lz, legL * 0.08, legL, 6, f'Leg {i + 1}', axis='y')

    # Tail
    if tailL > 0:
        tail_z = -L * 0.4
        create_cylinder(vertices, indices, 0, H * 0.6, tail_z, tailL * 0.05, tailL, 6, 'Tail', axis='z')


def create_amphibian(vertices, indices, params):
    """Create an amphibian (frog)."""
    L = params['body_length']
    H = params['body_height']
    legL = params['leg_length']

    body_w = L * 0.5

    # Body (short and broad)
    create_box(vertices, indices, 0, H * 0.4, 0, body_w, H * 0.6, L * 0.6, 'Body')

    # Head (wide, no neck)
    head_z = L * 0.35
    create_box(vertices, indices, 0, H * 0.45, head_z, body_w * 0.9, H * 0.5, L * 0.25, 'Head')

    # Eyes (prominent, on top of head)
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * body_w * 0.3, H * 0.75, head_z, H * 0.15, H * 0.1, 6, f'Eye {"left" if side < 0 else "right"}', axis='y')

    # Hind legs (long, folded)
    hind_leg_x = body_w * 0.4
    hind_leg_y = H * 0.2
    hind_leg_z = -L * 0.1
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * hind_leg_x, hind_leg_y, hind_leg_z, legL * 0.06, legL, 6, f'Hind leg {"left" if side < 0 else "right"}', axis='y')

    # Front legs (short)
    front_leg_x = body_w * 0.25
    front_leg_y = H * 0.25
    front_leg_z = L * 0.25
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * front_leg_x, front_leg_y, front_leg_z, legL * 0.05, legL * 0.5, 6, f'Front leg {"left" if side < 0 else "right"}', axis='y')


def create_fish(vertices, indices, params):
    """Create a fish (shark, salmon)."""
    L = params['body_length']
    H = params['body_height']

    body_w = H * 0.5

    # Body (streamlined, torpedo-shaped)
    create_box(vertices, indices, 0, 0, 0, body_w, H * 0.8, L * 0.7, 'Body')

    # Head (pointed)
    head_z = L * 0.4
    create_box(vertices, indices, 0, 0, head_z, body_w * 0.8, H * 0.6, L * 0.2, 'Head')

    # Tail fin (forked)
    tail_z = -L * 0.4
    create_box(vertices, indices, 0, 0, tail_z, body_w * 0.3, H * 1.2, L * 0.15, 'Tail fin')

    # Dorsal fin (on back)
    create_box(vertices, indices, 0, H * 0.5, 0, body_w * 0.1, H * 0.4, L * 0.2, 'Dorsal fin')

    # Pectoral fins (sides)
    for side in [-1, 1]:
        create_box(vertices, indices, side * body_w * 0.6, -H * 0.2, L * 0.1, body_w * 0.3, H * 0.1, L * 0.15, f'Pectoral fin {"left" if side < 0 else "right"}')


def convert_to_atlas(vertices, indices, species_id, name, color):
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

    # Scale to meters
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

    part_id = f'PROC_{species_id}'
    part = {
        'id': part_id,
        'name': name,
        'conceptId': part_id,
        'system': 'skeletal',
        'chunk': 0,
        'positions': po,
        'normals': no,
        'indices': io,
        'vertexCount': vc,
        'indexCount': len(indices) * 3,
        'bounds': [[min(xs) - cx, min(ys) - cy, min(zs) - cz], [max(xs) - cx, max(ys) - cy, max(zs) - cz]],
    }

    chunk_url = f'/models/{species_id}-0.bin'
    (OUT / f'{species_id}-0.bin').write_bytes(blob)

    manifest = {
        'version': 'KEV Procedural Animal 1.0',
        'species': species_id,
        'sex': 'unknown',
        'source': 'KEV Procedural Animal Generator',
        'scope': f'{name} - {vc:,} vertices, {tc:,} triangles',
        'parts': [part],
        'chunks': [{'url': chunk_url, 'bytes': len(blob)}],
        'concepts': [{'id': part_id, 'name': name, 'elements': [part_id]}],
        'triangles': tc,
    }

    (OUT / f'atlas-{species_id}.json').write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')

    print(f'  {name}: {vc:,} vertices, {tc:,} triangles')


# Generate all species
for species_id, params in SPECIES.items():
    print(f'Creating {params["name"]} ...')
    vertices = []
    indices = []
    if species_id in ['dog', 'cat', 'horse', 'cow']:
        create_quadruped(vertices, indices, params)
    elif species_id == 'frog':
        create_amphibian(vertices, indices, params)
    elif species_id in ['shark', 'salmon']:
        create_fish(vertices, indices, params)
    convert_to_atlas(vertices, indices, species_id, params['name'], params['color'])

print('\n=== Domestic animal models created ===')
print(f'Total species: {len(SPECIES)}')
