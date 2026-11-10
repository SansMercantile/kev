"""Inspect Z-PIG blend file to understand how to read Blender 4.x geometry data."""
import blendfile
import struct

SRC = 'C:/Users/kpasc/source/repos/kev/tools/human-atlas/scripts/_animal_src/z-anatomy-vet/extracted/Z-PIG.blend'
bf = blendfile.open_blend(SRC)

ptr_to_block = {b.addr_old: b for b in bf.blocks}

# Find the first mesh with geometry
for b in bf.blocks:
    if b.dna_type_name != 'Mesh':
        continue
    totvert = b[b'totvert']
    totpoly = b[b'totpoly']
    totloop = b[b'totloop']
    if totvert == 0:
        continue

    name = b[b'id', b'name']
    if isinstance(name, bytes):
        name = name.decode('utf-8', errors='replace')
    print(f'Mesh: {name}, verts={totvert}, polys={totpoly}, loops={totloop}')

    # Read vdata (vertex CustomData)
    vdata_totlayer = b[b'vdata', b'totlayer']
    vdata_layers_ptr = b[b'vdata', b'layers']
    print(f'  vdata: totlayer={vdata_totlayer}, layers_ptr={vdata_layers_ptr}')

    # Read ldata (loop CustomData) for corner_verts
    ldata_totlayer = b[b'ldata', b'totlayer']
    ldata_layers_ptr = b[b'ldata', b'layers']
    print(f'  ldata: totlayer={ldata_totlayer}, layers_ptr={ldata_layers_ptr}')

    # Read poly_offset_indices
    poi_ptr = b[b'poly_offset_indices']
    print(f'  poly_offset_indices ptr: {poi_ptr}')

    # Read position layer from vdata
    if vdata_layers_ptr in ptr_to_block:
        layers_block = ptr_to_block[vdata_layers_ptr]
        print(f'  vdata layers block: count={layers_block.count}, size={layers_block.size}')
        for i in range(layers_block.count):
            lt = layers_block.get(b'type', base_index=i)
            ln = layers_block.get(b'name', base_index=i)
            ld = layers_block.get(b'data', base_index=i)
            if isinstance(ln, bytes):
                ln = ln.decode('utf-8', errors='replace')
            print(f'    [{i}] type={lt} name={ln!r} data_ptr={ld}')

            if lt == 48 and 'position' in ln and ld in ptr_to_block:
                data_block = ptr_to_block[ld]
                print(f'        -> Position data block: size={data_block.size} bytes, expect {totvert * 12} bytes')
                bf.handle.seek(data_block.file_offset + 24)
                raw = bf.handle.read(min(data_block.size, 12 * 5))
                for v in range(min(5, totvert)):
                    x, y, z = struct.unpack_from('<3f', raw, v * 12)
                    print(f'        v[{v}]: ({x:.6f}, {y:.6f}, {z:.6f})')

    # Read corner_vert layer from ldata
    if ldata_layers_ptr in ptr_to_block:
        layers_block = ptr_to_block[ldata_layers_ptr]
        print(f'\n  ldata layers block: count={layers_block.count}, size={layers_block.size}')
        for i in range(layers_block.count):
            lt = layers_block.get(b'type', base_index=i)
            ln = layers_block.get(b'name', base_index=i)
            ld = layers_block.get(b'data', base_index=i)
            if isinstance(ln, bytes):
                ln = ln.decode('utf-8', errors='replace')
            print(f'    [{i}] type={lt} name={ln!r} data_ptr={ld}')

            if lt == 11 and '.corner_vert' in ln and ld in ptr_to_block:
                data_block = ptr_to_block[ld]
                print(f'        -> Corner vert data: size={data_block.size} bytes, expect {totloop * 4} bytes')
                bf.handle.seek(data_block.file_offset + 24)
                raw = bf.handle.read(min(data_block.size, 4 * 10))
                for j in range(min(10, totloop)):
                    vi, = struct.unpack_from('<i', raw, j * 4)
                    print(f'        loop[{j}]: vert={vi}')

    # Read poly_offset_indices
    if poi_ptr in ptr_to_block:
        poi_block = ptr_to_block[poi_ptr]
        print(f'\n  poly_offset_indices block: size={poi_block.size} bytes, expect {(totpoly + 1) * 4} bytes')
        bf.handle.seek(poi_block.file_offset + 24)
        raw = bf.handle.read(min(poi_block.size, 4 * 10))
        for j in range(min(10, totpoly + 1)):
            off, = struct.unpack_from('<i', raw, j * 4)
            print(f'        poly_offset[{j}]: {off}')

    break
