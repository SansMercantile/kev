"""Create high-quality procedural models for extinct animals.
Each model has proper anatomical body plans based on fossil evidence.

Output: public/models/atlas-<species>.json + <species>-0.bin
"""
import struct, math, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

# Extinct species parameters based on fossil evidence
EXTINCT_SPECIES = {
    'smilodon': {
        'name': 'Saber-toothed Cat (Smilodon fatalis)',
        'body_length': 1.75,  # 1.75m
        'body_height': 1.0,  # 1m at shoulder
        'leg_length': 0.60,
        'tail_length': 0.35,
        'ear_type': 'pointed',
        'snout_length': 0.25,
        'canine_length': 0.18,  # 18cm saber teeth!
        'color': '#8b7355',  # tawny
    },
    'dodo': {
        'name': 'Dodo (Raphus cucullatus)',
        'body_length': 0.65,  # 65cm
        'body_height': 0.60,  # 60cm tall
        'leg_length': 0.20,
        'tail_length': 0.08,  # small tail
        'ear_type': 'none',
        'snout_length': 0.12,  # large hooked beak
        'color': '#a0a0a0',  # gray-brown
    },
    'velociraptor': {
        'name': 'Velociraptor (Velociraptor mongoliensis)',
        'body_length': 1.8,  # 1.8m
        'body_height': 0.6,  # 60cm at hip
        'leg_length': 0.50,
        'tail_length': 0.80,  # long stiff tail
        'ear_type': 'none',
        'snout_length': 0.15,
        'sickle_claw': 0.09,  # 9cm sickle claw on each foot
        'color': '#7a6a5a',  # brown
    },
    'pterodactyl': {
        'name': 'Pterodactyl (Pterodactylus antiquus)',
        'body_length': 0.75,  # 75cm
        'body_height': 0.30,  # 30cm
        'leg_length': 0.15,
        'tail_length': 0.10,
        'ear_type': 'none',
        'snout_length': 0.20,  # long pointed beak
        'wing_span': 1.2,  # 1.2m wingspan
        'color': '#5a4a3a',  # dark brown
    },
    'woollyrhino': {
        'name': 'Woolly Rhinoceros (Coelodonta antiquitatis)',
        'body_length': 3.2,  # 3.2m
        'body_height': 1.8,  # 1.8m at shoulder
        'leg_length': 0.90,
        'tail_length': 0.25,
        'ear_type': 'pointed',
        'snout_length': 0.40,
        'horn_length': 0.60,  # 60cm front horn
        'color': '#6a5a4a',  # dark brown
    },
    'giantsloth': {
        'name': 'Giant Ground Sloth (Megatherium americanum)',
        'body_length': 6.0,  # 6m!
        'body_height': 3.5,  # 3.5m standing
        'leg_length': 1.20,
        'tail_length': 0.80,
        'ear_type': 'none',
        'snout_length': 0.30,
        'claw_length': 0.40,  # 40cm claws
        'color': '#8a7a6a',  # brown-gray
    },
}


def create_box(vertices, indices, cx, cy, cz, sx, sy, sz, part_name):
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
        (0, 1, 2), (0, 2, 3), (4, 5, 6), (4, 6, 7),
        (0, 1, 5), (0, 5, 4), (2, 3, 7), (2, 7, 6),
        (0, 3, 7), (0, 7, 4), (1, 2, 6), (1, 6, 5),
    ]
    indices.extend([(base + t[0], base + t[1], base + t[2]) for t in tris])


def create_cylinder(vertices, indices, cx, cy, cz, radius, height, segments, part_name, axis='y'):
    base = len(vertices) // 3
    for i in range(segments):
        angle = (i / segments) * 2 * math.pi
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)
        if axis == 'y':
            vertices.extend([cx + x, cy - height / 2, cz + z])
        elif axis == 'x':
            vertices.extend([cx - height / 2, cy + x, cz + z])
        else:
            vertices.extend([cx + x, cy + height / 2, cz + z])
    for i in range(segments):
        angle = (i / segments) * 2 * math.pi
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)
        if axis == 'y':
            vertices.extend([cx + x, cy + height / 2, cz + z])
        elif axis == 'x':
            vertices.extend([cx + height / 2, cy + x, cz + z])
        else:
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


def create_smilodon(vertices, indices, p):
    """Saber-toothed cat: large cat with elongated canines."""
    L, H = p['body_length'], p['body_height']
    legL, tailL = p['leg_length'], p['tail_length']
    body_w = H * 0.55
    head_l = L * 0.16

    # Body (muscular, deep chest)
    create_box(vertices, indices, 0, H * 0.48, 0, body_w, H * 0.75, L * 0.72, 'Body')

    # Head (broad, short muzzle)
    head_z = L * 0.44
    create_box(vertices, indices, 0, H * 0.68, head_z, body_w * 0.75, H * 0.55, head_l, 'Head')

    # Snout (short, broad)
    snout_z = head_z + head_l * 0.55
    create_box(vertices, indices, 0, H * 0.62, snout_z, body_w * 0.5, H * 0.35, p['snout_length'], 'Snout')

    # SABER TEETH (the defining feature!)
    canine_l = p['canine_length']
    for side in [-1, 1]:
        create_box(vertices, indices, side * body_w * 0.18, H * 0.48, snout_z + p['snout_length'] * 0.3, canine_l * 0.06, canine_l, canine_l * 0.12, f'Saber tooth {"left" if side < 0 else "right"}')

    # Ears (pointed, relatively small)
    for side in [-1, 1]:
        create_box(vertices, indices, side * body_w * 0.28, H * 0.92, head_z, body_w * 0.12, H * 0.18, body_w * 0.04, f'Ear {"left" if side < 0 else "right"}')

    # Legs (powerful, relatively short)
    leg_y = H * 0.32
    leg_positions = [
        (-body_w * 0.38, leg_y, -L * 0.32), (body_w * 0.38, leg_y, -L * 0.32),
        (-body_w * 0.38, leg_y, L * 0.32), (body_w * 0.38, leg_y, L * 0.32),
    ]
    for i, (lx, ly, lz) in enumerate(leg_positions):
        create_cylinder(vertices, indices, lx, ly, lz, legL * 0.09, legL, 6, f'Leg {i + 1}', axis='y')

    # Tail (short, bobbed)
    create_cylinder(vertices, indices, 0, H * 0.55, -L * 0.38, tailL * 0.06, tailL, 6, 'Tail', axis='z')


def create_dodo(vertices, indices, p):
    """Dodo: large flightless bird with hooked beak."""
    L, H = p['body_length'], p['body_height']
    legL = p['leg_length']
    body_w = H * 0.5

    # Body (plump, rounded)
    create_box(vertices, indices, 0, H * 0.45, 0, body_w, H * 0.65, L * 0.55, 'Body')

    # Head (large, with big beak)
    head_z = L * 0.38
    create_box(vertices, indices, 0, H * 0.62, head_z, body_w * 0.65, H * 0.45, L * 0.15, 'Head')

    # Beak (large, hooked, pointed)
    beak_z = head_z + L * 0.1
    create_box(vertices, indices, 0, H * 0.55, beak_z, body_w * 0.3, H * 0.35, p['snout_length'], 'Beak')

    # Beak hook (downward curve at tip)
    create_box(vertices, indices, 0, H * 0.42, beak_z + p['snout_length'] * 0.4, body_w * 0.15, H * 0.12, p['snout_length'] * 0.3, 'Beak hook')

    # Wings (tiny, useless)
    for side in [-1, 1]:
        create_box(vertices, indices, side * body_w * 0.55, H * 0.5, -L * 0.05, body_w * 0.2, H * 0.15, L * 0.2, f'Wing {"left" if side < 0 else "right"}')

    # Legs (short, thick)
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * body_w * 0.25, H * 0.15, -L * 0.1, legL * 0.08, legL, 6, f'Leg {"left" if side < 0 else "right"}', axis='y')

    # Tail (tiny)
    create_box(vertices, indices, 0, H * 0.5, -L * 0.32, body_w * 0.2, H * 0.1, p['tail_length'], 'Tail')


def create_velociraptor(vertices, indices, p):
    """Velociraptor: small theropod with sickle claw."""
    L, H = p['body_length'], p['body_height']
    legL, tailL = p['leg_length'], p['tail_length']
    body_w = H * 0.4
    head_l = L * 0.14

    # Body (light, agile)
    create_box(vertices, indices, 0, H * 0.5, 0, body_w, H * 0.6, L * 0.5, 'Body')

    # Head (long, low snout)
    head_z = L * 0.35
    create_box(vertices, indices, 0, H * 0.62, head_z, body_w * 0.6, H * 0.4, head_l, 'Head')

    # Snout (pointed)
    snout_z = head_z + head_l * 0.6
    create_box(vertices, indices, 0, H * 0.58, snout_z, body_w * 0.35, H * 0.25, p['snout_length'], 'Snout')

    # Eyes (large, forward-facing)
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * body_w * 0.28, H * 0.72, head_z, H * 0.08, H * 0.06, 6, f'Eye {"left" if side < 0 else "right"}', axis='z')

    # Legs (bipedal - only 2 legs)
    leg_y = H * 0.3
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * body_w * 0.3, leg_y, -L * 0.05, legL * 0.07, legL, 6, f'Leg {"left" if side < 0 else "right"}', axis='y')

        # SICKLE CLAW on each foot!
        claw_l = p['sickle_claw']
        create_box(vertices, indices, side * body_w * 0.3, leg_y - legL * 0.4, -L * 0.05 - claw_l * 0.3, claw_l * 0.04, claw_l, claw_l * 0.08, f'Sickle claw {"left" if side < 0 else "right"}')

    # Arms (small, 3-fingered)
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * body_w * 0.25, H * 0.55, L * 0.15, legL * 0.03, legL * 0.4, 6, f'Arm {"left" if side < 0 else "right"}', axis='y')

    # Tail (long, stiff, balancing)
    create_cylinder(vertices, indices, 0, H * 0.5, -L * 0.35, tailL * 0.04, tailL, 6, 'Tail', axis='z')


def create_pterodactyl(vertices, indices, p):
    """Pterodactyl: flying reptile with long beak and crest."""
    L, H = p['body_length'], p['body_height']
    legL, tailL = p['leg_length'], p['tail_length']
    wingS = p['wing_span']
    body_w = H * 0.5
    head_l = L * 0.2

    # Body (small, compact)
    create_box(vertices, indices, 0, H * 0.4, 0, body_w, H * 0.5, L * 0.4, 'Body')

    # Head (large, with crest)
    head_z = L * 0.3
    create_box(vertices, indices, 0, H * 0.55, head_z, body_w * 0.6, H * 0.5, head_l, 'Head')

    # Beak (long, pointed)
    beak_z = head_z + head_l * 0.7
    create_box(vertices, indices, 0, H * 0.5, beak_z, body_w * 0.25, H * 0.2, p['snout_length'], 'Beak')

    # Crest (on back of head)
    create_box(vertices, indices, 0, H * 0.85, head_z - head_l * 0.2, body_w * 0.15, H * 0.35, head_l * 0.4, 'Crest')

    # Wings (large, membranous)
    wing_z = 0
    wing_thickness = H * 0.02
    for side in [-1, 1]:
        create_box(vertices, indices, side * wingS * 0.35, H * 0.4, wing_z, wingS * 0.7, wing_thickness, wingS * 0.3, f'Wing {"left" if side < 0 else "right"}')

    # Legs (small)
    for side in [-1, 1]:
        create_cylinder(vertices, indices, side * body_w * 0.25, H * 0.15, -L * 0.1, legL * 0.06, legL, 6, f'Leg {"left" if side < 0 else "right"}', axis='y')

    # Tail (short, with vane)
    create_box(vertices, indices, 0, H * 0.45, -L * 0.25, body_w * 0.1, H * 0.05, tailL, 'Tail')


def create_woollyrhino(vertices, indices, p):
    """Woolly rhinoceros: large rhino with two horns."""
    L, H = p['body_length'], p['body_height']
    legL, tailL = p['leg_length'], p['tail_length']
    body_w = H * 0.55
    head_l = L * 0.18

    # Body (massive, barrel-chested)
    create_box(vertices, indices, 0, H * 0.45, 0, body_w, H * 0.7, L * 0.7, 'Body')

    # Head (large, elongated)
    head_z = L * 0.42
    create_box(vertices, indices, 0, H * 0.6, head_z, body_w * 0.7, H * 0.5, head_l, 'Head')

    # Snout (long, with lip)
    snout_z = head_z + head_l * 0.6
    create_box(vertices, indices, 0, H * 0.52, snout_z, body_w * 0.45, H * 0.3, p['snout_length'], 'Snout')

    # FRONT HORN (the big one!)
    horn_l = p['horn_length']
    create_box(vertices, indices, 0, H * 0.75, snout_z + p['snout_length'] * 0.2, horn_l * 0.08, horn_l, horn_l * 0.15, 'Front horn')

    # Rear horn (smaller)
    rear_horn_l = horn_l * 0.4
    create_box(vertices, indices, 0, H * 0.72, snout_z + p['snout_length'] * 0.6, rear_horn_l * 0.06, rear_horn_l, rear_horn_l * 0.12, 'Rear horn')

    # Ears (small, pointed)
    for side in [-1, 1]:
        create_box(vertices, indices, side * body_w * 0.3, H * 0.85, head_z, body_w * 0.1, H * 0.15, body_w * 0.04, f'Ear {"left" if side < 0 else "right"}')

    # Legs (thick, pillar-like)
    leg_y = H * 0.28
    leg_positions = [
        (-body_w * 0.38, leg_y, -L * 0.3), (body_w * 0.38, leg_y, -L * 0.3),
        (-body_w * 0.38, leg_y, L * 0.3), (body_w * 0.38, leg_y, L * 0.3),
    ]
    for i, (lx, ly, lz) in enumerate(leg_positions):
        create_cylinder(vertices, indices, lx, ly, lz, legL * 0.1, legL, 6, f'Leg {i + 1}', axis='y')

    # Tail (short)
    create_cylinder(vertices, indices, 0, H * 0.5, -L * 0.38, tailL * 0.05, tailL, 6, 'Tail', axis='z')


def create_giantsloth(vertices, indices, p):
    """Giant ground sloth: massive sloth with huge claws."""
    L, H = p['body_length'], p['body_height']
    legL, tailL = p['leg_length'], p['tail_length']
    body_w = H * 0.5
    head_l = L * 0.1

    # Body (massive, barrel-shaped)
    create_box(vertices, indices, 0, H * 0.4, 0, body_w, H * 0.6, L * 0.6, 'Body')

    # Head (small relative to body)
    head_z = L * 0.35
    create_box(vertices, indices, 0, H * 0.55, head_z, body_w * 0.5, H * 0.35, head_l, 'Head')

    # Snout (short, blunt)
    snout_z = head_z + head_l * 0.6
    create_box(vertices, indices, 0, H * 0.5, snout_z, body_w * 0.35, H * 0.2, p['snout_length'], 'Snout')

    # Legs (massive, pillar-like)
    leg_y = H * 0.25
    leg_positions = [
        (-body_w * 0.35, leg_y, -L * 0.25), (body_w * 0.35, leg_y, -L * 0.25),
        (-body_w * 0.35, leg_y, L * 0.25), (body_w * 0.35, leg_y, L * 0.25),
    ]
    for i, (lx, ly, lz) in enumerate(leg_positions):
        create_cylinder(vertices, indices, lx, ly, lz, legL * 0.1, legL, 6, f'Leg {i + 1}', axis='y')

    # HUGE CLAWS on front feet
    claw_l = p['claw_length']
    for side in [-1, 1]:
        create_box(vertices, indices, side * body_w * 0.35, leg_y - legL * 0.45, -L * 0.25 - claw_l * 0.3, claw_l * 0.06, claw_l, claw_l * 0.12, f'Claw {"left" if side < 0 else "right"}')

    # Tail (thick, short)
    create_cylinder(vertices, indices, 0, H * 0.4, -L * 0.35, tailL * 0.08, tailL, 6, 'Tail', axis='z')


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

    # Build binary data
    pos_buf = bytearray(vc * 12)
    norm_buf = bytearray(vc * 6)
    idx_buf = bytearray(len(indices) * 12)

    for i in range(vc):
        px = (vertices[i * 3] - cx)
        py = (vertices[i * 3 + 1] - cy)
        pz = (vertices[i * 3 + 2] - cz)
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

    part_id = f'EXTINCT_{species_id}'
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
        'version': 'KEV Procedural Extinct Animal 1.0',
        'species': species_id,
        'sex': 'unknown',
        'source': 'KEV Procedural Extinct Animal Generator',
        'scope': f'{name} - {vc:,} vertices, {tc:,} triangles',
        'parts': [part],
        'chunks': [{'url': chunk_url, 'bytes': len(blob)}],
        'concepts': [{'id': part_id, 'name': name, 'elements': [part_id]}],
        'triangles': tc,
    }

    (OUT / f'atlas-{species_id}.json').write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')

    print(f'  {name}: {vc:,} vertices, {tc:,} triangles')


# Generate all extinct species
for species_id, params in EXTINCT_SPECIES.items():
    print(f'Creating {params["name"]} ...')
    vertices = []
    indices = []
    if species_id == 'smilodon':
        create_smilodon(vertices, indices, params)
    elif species_id == 'dodo':
        create_dodo(vertices, indices, params)
    elif species_id == 'velociraptor':
        create_velociraptor(vertices, indices, params)
    elif species_id == 'pterodactyl':
        create_pterodactyl(vertices, indices, params)
    elif species_id == 'woollyrhino':
        create_woollyrhino(vertices, indices, params)
    elif species_id == 'giantsloth':
        create_giantsloth(vertices, indices, params)
    convert_to_atlas(vertices, indices, species_id, params['name'], params['color'])

print('\n=== Extinct animal models created ===')
print(f'Total species: {len(EXTINCT_SPECIES)}')
