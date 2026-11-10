"""Convert Z-PIG Blender 4.x file into KEV atlas format.
Output: atlas-pig.json + pig-N.bin chunks matching the human atlas schema.

Source: Z-Anatomy "Models of veterinary anatomy" - CC BY-SA 4.0
Run: python scripts/convert-zpig.py
"""
import struct, math, json, re, sys
from pathlib import Path
import blendfile

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scripts' / '_animal_src' / 'z-anatomy-vet' / 'extracted' / 'Z-PIG.blend'
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
CHUNK_TARGET = 4_000_000

DEFAULT_SYSTEM = 'skeletal'

def translate_name(name):
    """French NAV name -> English."""
    t = {
        'Crane': 'Skull', 'Mandibule': 'Mandible', 'Scapula': 'Scapula',
        'Humerus': 'Humerus', 'Radius': 'Radius', 'Ulna': 'Ulna',
        'Femur': 'Femur', 'Tibia': 'Tibia', 'Fibula': 'Fibula',
        'Patella': 'Patella', 'Calcaneus': 'Calcaneus', 'Talus': 'Talus',
        'Sacrum': 'Sacrum', 'Sternum': 'Sternum',
    }
    # Strip accents for lookup
    stripped = name
    for src, dst in [('\xe9', 'e'), ('\xe8', 'e'), ('\xea', 'e'), ('\xe0', 'a'),
                     ('\xe2', 'a'), ('\xee', 'i'), ('\xef', 'i'), ('\xf4', 'o'),
                     ('\xfb', 'u'), ('\xf9', 'u'), ('\xe7', 'c')]:
        stripped = stripped.replace(src, dst)
    if stripped in t:
        return t[stripped]
    # Pattern-based
    n = name
    n = re.sub(r'Vert.bre ([A-Za-z]+\d*)', lambda m: f'Vertebra {m.group(1)}', n)
    n = re.sub(r'Vert.bre ([A-Z]+\d+) \((.+)\)', lambda m: f'Vertebra {m.group(1)} ({m.group(2)})', n)
    n = re.sub(r'C.tes? flottantes', 'Floating ribs', n)
    n = re.sub(r'C.tes', 'Ribs', n)
    n = re.sub(r'Fausses c.tes', 'False ribs', n)
    n = re.sub(r'Vraies c.tes', 'True ribs', n)
    n = re.sub(r'Premi.re c.te', 'First rib', n)
    n = re.sub(r'Deuxi.me c.te', 'Second rib', n)
    n = re.sub(r'Troisi.me c.te', 'Third rib', n)
    n = re.sub(r'Quatri.me c.te', 'Fourth rib', n)
    n = re.sub(r'Cinqui.me c.te', 'Fifth rib', n)
    n = re.sub(r'Sixi.me c.te', 'Sixth rib', n)
    n = re.sub(r'Septi.me c.te', 'Seventh rib', n)
    n = re.sub(r'Huiti.me c.te', 'Eighth rib', n)
    n = re.sub(r'Neuvi.me c.te', 'Ninth rib', n)
    n = re.sub(r'Dixi.me c.te', 'Tenth rib', n)
    n = re.sub(r'Onzi.me c.te', 'Eleventh rib', n)
    n = re.sub(r'Douzi.me c.te', 'Twelfth rib', n)
    n = re.sub(r'Treizi.me c.te', 'Thirteenth rib', n)
    n = re.sub(r'Quatorzi.me c.te', 'Fourteenth rib', n)
    n = re.sub(r'Quinzi.me c.te', 'Fifteenth rib', n)
    n = re.sub(r'Phalange (distale|moyenne|proximale)', lambda m: f'{m.group(1).title()} phalanx', n)
    n = re.sub(r'Os s.samo.des? ', 'Sesamoid bone ', n)
    n = re.sub(r'Squelette ', 'Skeleton of ', n)
    n = re.sub(r'Ceinture pelvienne', 'Pelvic girdle', n)
    n = re.sub(r'Ceinture thoracique', 'Thoracic girdle', n)
    n = re.sub(r'Colonne vert.brale', 'Vertebral column', n)
    n = re.sub(r'Cartilages costaux', 'Costal cartilages', n)
    n = re.sub(r'Manubrium sternal', 'Sternal manubrium', n)
    n = re.sub(r'Syst.me squelettique', 'Skeletal system', n)
    n = re.sub(r'Os coxal', 'Hip bone', n)
    n = re.sub(r'Os hyo.de', 'Hyoid bone', n)
    n = re.sub(r'stern.bre', 'sternebra', n)
    n = re.sub(r'm.tacarpien', 'metacarpal', n)
    n = re.sub(r'm.tatarsien', 'metatarsal', n)
    n = re.sub(r'vert.bres (cervicales|lombaires|thoraciques)', lambda m: f'{m.group(1).title()} vertebrae', n)
    n = re.sub(r'vert.bres caudales \[coccygiennes\]', 'Caudal vertebrae', n)
    n = re.sub(r'Os m.tacarpiens I-V', 'Metacarpals I-V', n)
    n = re.sub(r'Os m.tatarsiens I-V', 'Metatarsals I-V', n)
    n = re.sub(r'Os du membre pelvien', 'Pelvic limb bones', n)
    n = re.sub(r'Os du membre thoracique', 'Thoracic limb bones', n)
    n = re.sub(r'Os du carpe', 'Carpal bones', n)
    n = re.sub(r'Os du tarse', 'Tarsal bones', n)
    n = re.sub(r'Os des doigts de la main', 'Phalanges of the hand', n)
    n = re.sub(r'Os extracr.niens de la t.te', 'Extracranial head bones', n)
    n = re.sub(r'Os carpien I \[.+\]', 'Trapezium', n)
    n = re.sub(r'Os carpien III \[.+\]', 'Capitate', n)
    n = re.sub(r'Os carpien IV \[.+\]', 'Hamate', n)
    n = re.sub(r'Os central du tarse \[.+\]', 'Navicular', n)
    n = re.sub(r'Os interm.diaire du carpe \[.+\]', 'Lunate', n)
    n = re.sub(r'Os radial du carpe \[.+\]', 'Scaphoid', n)
    n = re.sub(r'Os ulnaire du carpe \[.+\]', 'Triquetrum', n)
    n = re.sub(r'Os accessoire du carpe \[.+\]', 'Pisiform', n)
    n = re.sub(r'Os tarsien I \[.+\]', 'Medial cuneiform', n)
    n = re.sub(r'Os tarsien II \[.+\]', 'Intermediate cuneiform', n)
    n = re.sub(r'Os tarsien III \[.+\]', 'Lateral cuneiform', n)
    n = re.sub(r'Os tarsien IV', 'Fourth tarsal', n)
    n = re.sub(r'Cinqui.me', 'Fifth', n)
    n = re.sub(r'Deuxi.me', 'Second', n)
    n = re.sub(r'Troisi.me', 'Third', n)
    n = re.sub(r'Quatri.me', 'Fourth', n)
    n = re.sub(r'Sixi.me', 'Sixth', n)
    n = re.sub(r'du (\w+) doigt de la main', r'of \1 finger', n)
    n = re.sub(r'du (\w+) doigt d[eu] pied', r'of \1 toe', n)
    return n


def read_block_raw(bf, ptr, expected_size=None):
    """Read raw bytes from a data block at the given pointer address."""
    for b in bf.blocks:
        if b.addr_old == ptr:
            bf.handle.seek(b.file_offset + 24)  # skip block header (code4+size4+addr8+sdna4+count4)
            data = bf.handle.read(b.size)
            if expected_size and len(data) != expected_size:
                print(f'  WARNING: expected {expected_size} bytes, got {len(data)}')
            return data
    return None


print(f'Reading {SRC} ...')
bf = blendfile.open_blend(str(SRC))

ptr_map = {b.addr_old: b for b in bf.blocks}

# Map mesh block address -> mesh block
mesh_blocks = {}
for b in bf.blocks:
    if b.dna_type_name == 'Mesh':
        mesh_blocks[b.addr_old] = b

# Collect all mesh objects
entries = []
for b in bf.blocks:
    if b.dna_type_name != 'Object' or b[b'type'] != 1:
        continue
    raw_name = b[b'id', b'name']
    if isinstance(raw_name, bytes):
        raw_name = raw_name.decode('utf-8', errors='replace')
    name = raw_name[2:] if raw_name.startswith('OB') else raw_name

    data_ptr = b[b'data']
    if data_ptr == 0 or data_ptr not in mesh_blocks:
        continue

    mesh = mesh_blocks[data_ptr]
    totvert = mesh[b'totvert']
    totpoly = mesh[b'totpoly']
    totloop = mesh[b'totloop']
    if totvert == 0 or totpoly == 0:
        continue

    # Get object transform matrix (4x4, stored as obmat[4][4] float)
    # We'll apply it to positions to get world-space coordinates
    # For now, skip transform and use local coords (most Z-PIG parts are in world space)

    # Read position data from vdata CustomData layers
    vdata_layers_ptr = mesh[b'vdata', b'layers']
    vdata_totlayer = mesh[b'vdata', b'totlayer']
    
    positions_raw = None
    if vdata_layers_ptr in ptr_map:
        layers_block = ptr_map[vdata_layers_ptr]
        for i in range(layers_block.count):
            lt = layers_block.get(b'type', base_index=i)
            ln = layers_block.get(b'name', base_index=i)
            ld = layers_block.get(b'data', base_index=i)
            if isinstance(ln, bytes):
                ln = ln.decode('utf-8', errors='replace')
            if lt == 48 and 'position' in ln and ld != 0:
                positions_raw = read_block_raw(bf, ld, totvert * 12)
                break

    if not positions_raw:
        continue

    # Read corner_vert from ldata
    ldata_layers_ptr = mesh[b'ldata', b'layers']
    corner_verts_raw = None
    if ldata_layers_ptr in ptr_map:
        layers_block = ptr_map[ldata_layers_ptr]
        for i in range(layers_block.count):
            lt = layers_block.get(b'type', base_index=i)
            ln = layers_block.get(b'name', base_index=i)
            ld = layers_block.get(b'data', base_index=i)
            if isinstance(ln, bytes):
                ln = ln.decode('utf-8', errors='replace')
            if lt == 11 and '.corner_vert' in ln and ld != 0:
                corner_verts_raw = read_block_raw(bf, ld, totloop * 4)
                break

    if not corner_verts_raw:
        continue

    # Read poly_offset_indices
    poi_ptr = mesh[b'poly_offset_indices']
    poi_raw = read_block_raw(bf, poi_ptr, (totpoly + 1) * 4) if poi_ptr else None
    if not poi_raw:
        continue

    # Parse positions (Blender Z-up -> KEV Y-up)
    positions = []
    for v in range(totvert):
        x, y, z = struct.unpack_from('<3f', positions_raw, v * 12)
        # Blender: X=right, Y=forward, Z=up -> KEV: X=right, Y=up, Z=back
        positions.extend([x, z, -y])

    # Parse corner verts
    corner_verts = []
    for i in range(totloop):
        vi, = struct.unpack_from('<i', corner_verts_raw, i * 4)
        corner_verts.append(vi)

    # Parse poly offsets and triangulate
    poly_offsets = []
    for i in range(totpoly + 1):
        off, = struct.unpack_from('<i', poi_raw, i * 4)
        poly_offsets.append(off)

    indices = []
    for p in range(totpoly):
        start = poly_offsets[p]
        end = poly_offsets[p + 1]
        nverts = end - start
        if nverts < 3 or end > totloop:
            continue
        # Fan triangulation from first vertex
        v0 = corner_verts[start]
        for j in range(2, nverts):
            si1 = start + j - 1
            si2 = start + j
            if si2 >= totloop:
                break
            indices.append(v0)
            indices.append(corner_verts[si1])
            indices.append(corner_verts[si2])

    en_name = translate_name(name)
    safe_id = re.sub(r'[^a-zA-Z0-9_]', '_', name)

    entries.append({
        'id': f'ZPIG_{safe_id}',
        'name': en_name,
        'system': DEFAULT_SYSTEM,
        'positions': positions,
        'indices': indices,
        'vertexCount': totvert,
    })

print(f'Extracted {len(entries)} mesh parts')
if not entries:
    print('ERROR: No geometry extracted.')
    sys.exit(1)

# Center the model: compute whole-body bounds
all_min = [float('inf')] * 3
all_max = [float('-inf')] * 3
for e in entries:
    pos = e['positions']
    for i in range(0, len(pos), 3):
        for a in range(3):
            all_min[a] = min(all_min[a], pos[i + a])
            all_max[a] = max(all_max[a], pos[i + a])

cx = (all_min[0] + all_max[0]) / 2
cy_floor = all_min[1]
cz = (all_min[2] + all_max[2]) / 2

# Scale from mm to meters if coordinates are large
scale = 1.0
body_height = all_max[1] - all_min[1]
if body_height > 10:  # likely in centimeters or millimeters
    if body_height > 100:
        scale = 0.001  # mm -> m
    else:
        scale = 0.01   # cm -> m
    print(f'Body height raw: {body_height:.1f}, applying scale {scale} (-> {body_height * scale:.3f}m)')

# Pack into chunks
parts = []
chunks = []
blob = bytearray()
chunk_idx = 0
total_triangles = 0


def flush_chunk():
    global blob, chunk_idx
    if not blob:
        return
    url = f'/models/pig-{chunk_idx}.bin'
    (OUT / f'pig-{chunk_idx}.bin').write_bytes(blob)
    chunks.append({'url': url, 'bytes': len(blob)})
    blob = bytearray()
    chunk_idx += 1


def pad4():
    global blob
    pad = (4 - len(blob) % 4) % 4
    blob.extend(b'\x00' * pad)


def append_buf(data):
    global blob
    pad4()
    offset = len(blob)
    blob.extend(data)
    return offset


for e in entries:
    vc = e['vertexCount']
    pos = e['positions']
    idx = e['indices']

    # Float32 positions (centered + scaled)
    pos_buf = bytearray(vc * 12)
    bmin = [float('inf')] * 3
    bmax = [float('-inf')] * 3
    for i in range(vc):
        px = (pos[i * 3] - cx) * scale
        py = (pos[i * 3 + 1] - cy_floor) * scale
        pz = (pos[i * 3 + 2] - cz) * scale
        struct.pack_into('<3f', pos_buf, i * 12, px, py, pz)
        bmin[0] = min(bmin[0], px); bmin[1] = min(bmin[1], py); bmin[2] = min(bmin[2], pz)
        bmax[0] = max(bmax[0], px); bmax[1] = max(bmax[1], py); bmax[2] = max(bmax[2], pz)

    # Compute vertex normals from face normals (averaged)
    norm_accum = [[0.0, 0.0, 0.0] for _ in range(vc)]
    for t in range(0, len(idx), 3):
        i0, i1, i2 = idx[t], idx[t + 1], idx[t + 2]
        if i0 >= vc or i1 >= vc or i2 >= vc or i0 < 0 or i1 < 0 or i2 < 0:
            continue
        if i0 * 3 + 2 >= len(pos) or i1 * 3 + 2 >= len(pos) or i2 * 3 + 2 >= len(pos):
            continue
        p = [None, None, None]
        for vi_idx, vi in enumerate((i0, i1, i2)):
            p[vi_idx] = ((pos[vi * 3] - cx) * scale,
                         (pos[vi * 3 + 1] - cy_floor) * scale,
                         (pos[vi * 3 + 2] - cz) * scale)
        e1 = [p[1][j] - p[0][j] for j in range(3)]
        e2 = [p[2][j] - p[0][j] for j in range(3)]
        nx = e1[1] * e2[2] - e1[2] * e2[1]
        ny = e1[2] * e2[0] - e1[0] * e2[2]
        nz = e1[0] * e2[1] - e1[1] * e2[0]
        for vi in (i0, i1, i2):
            norm_accum[vi][0] += nx
            norm_accum[vi][1] += ny
            norm_accum[vi][2] += nz

    norm_buf = bytearray(vc * 6)
    for i in range(vc):
        nx, ny, nz = norm_accum[i]
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        struct.pack_into('<3h', norm_buf, i * 6,
                         max(-32767, min(32767, round(nx / length * 32767))),
                         max(-32767, min(32767, round(ny / length * 32767))),
                         max(-32767, min(32767, round(nz / length * 32767))))

    # Uint32 indices (filter out-of-range)
    valid_idx = [v for v in idx if 0 <= v < vc]
    # Ensure triangle count
    valid_idx = valid_idx[:len(valid_idx) - len(valid_idx) % 3]
    idx_buf = bytearray(len(valid_idx) * 4)
    for i, v in enumerate(valid_idx):
        struct.pack_into('<I', idx_buf, i * 4, v)
    idx = valid_idx

    if len(blob) > CHUNK_TARGET:
        flush_chunk()

    po = append_buf(pos_buf)
    no = append_buf(norm_buf)
    io = append_buf(idx_buf)

    parts.append({
        'id': e['id'],
        'name': e['name'],
        'conceptId': e['id'],
        'system': e['system'],
        'chunk': chunk_idx,
        'positions': po,
        'normals': no,
        'indices': io,
        'vertexCount': vc,
        'indexCount': len(idx),
        'bounds': [bmin, bmax],
    })
    total_triangles += len(idx) // 3

flush_chunk()

concepts = [{'id': e['id'], 'name': e['name'], 'elements': [e['id']]} for e in entries]

manifest = {
    'version': 'Z-PIG 1.0',
    'species': 'pig',
    'sex': 'unknown',
    'source': 'Z-Anatomy (CC BY-SA 4.0)',
    'scope': f'Sus domestica skeletal anatomy - {len(parts)} parts',
    'parts': parts,
    'chunks': chunks,
    'concepts': concepts,
    'triangles': total_triangles,
}

(OUT / 'atlas-pig.json').write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')

print(json.dumps({
    'parts': len(parts),
    'concepts': len(concepts),
    'triangles': total_triangles,
    'bytes': sum(c['bytes'] for c in chunks),
    'chunks': len(chunks),
    'systems': sorted(set(p['system'] for p in parts)),
}, indent=2))
