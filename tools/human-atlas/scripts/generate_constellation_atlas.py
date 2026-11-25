"""Generate all 88 IAU constellations + exoplanet systems + galaxy clusters.

Constellations: real bright-star positions (IAU stick figures). Exoplanet
systems: real star types + planet counts/orbits (schematic sizes). Galaxy
clusters: real member galaxies where published.

Run: python generate_constellation_atlas.py
"""
import math, sys
from pathlib import Path
import constellations as C
import space as SP
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'

STAR_COLORS = {k: v['color'] for k, v in SP.STAR_TYPES.items()}


def sphere(cx, cy, cz, r, seg=12, rings=8):
    v, idx = [], []
    for ri in range(rings + 1):
        phi = math.pi * ri / rings
        sp, cp = math.sin(phi), math.cos(phi)
        for si in range(seg):
            th = 2 * math.pi * si / seg
            st, ct = math.sin(th), math.cos(th)
            v.extend([cx + r * sp * ct, cy + r * cp, cz + r * sp * st])
    for ri in range(rings):
        for si in range(seg):
            a = ri * seg + si
            b = ri * seg + (si + 1) % seg
            c = a + seg
            d = b + seg
            idx.extend([a, c, b, b, c, d])
    return v, idx


def ring(cx, cy, cz, r_out, r_in, h, segs=24):
    v, idx = [], []
    for i in range(segs + 1):
        th = 2 * math.pi * i / segs
        co, so = math.cos(th), math.sin(th)
        for (r, y) in [(r_out, -h/2), (r_out, h/2), (r_in, -h/2), (r_in, h/2)]:
            v.extend([cx + r*co, cy + y, cz + r*so])
    for i in range(segs):
        a = i * 4
        b = a + 4
        idx.extend([a, b, a+1, a+1, b, b+1])
        idx.extend([a+2, a+3, b+2, a+3, b+3, b+2])
        idx.extend([a, a+2, b, a+2, b+2, b])
        idx.extend([a+1, b+1, a+3, a+3, b+1, b+3])
    return v, idx


def combine(parts):
    v, idx = [], []
    for (pv, pi) in parts:
        base = len(v) // 3
        v.extend(pv)
        idx.extend([base + i for i in pi])
    return v, idx


def build_constellation(key, data):
    meshes = []
    for (name, spec_type, x, y, size) in data['stars']:
        col = STAR_COLORS.get(spec_type, '#ffffff')
        v, idx = sphere(x, y, 0, size)
        meshes.append(Mesh(f'{key}_{name.lower().replace(" ", "_")}', name, f'star_{spec_type.lower()}', v, idx))
    return meshes


def build_exoplanet_system(key, data):
    meshes = []
    star = data['star']
    v, idx = sphere(0, 0, 0, star['r'] * 2)
    meshes.append(Mesh(f'{key}_star', f"{data['label']} (star)", 'star', v, idx))
    for (name, orbit, size) in data['planets']:
        # orbit ring + planet
        v2, idx2 = ring(0, 0, 0, orbit * 100, orbit * 100 * 0.98, 0.02, 32)
        meshes.append(Mesh(f'{key}_orbit_{name}', f'Orbit {name}', 'orbit', v2, idx2))
        th = (hash(name) % 100) / 100 * 2 * math.pi
        px = math.cos(th) * orbit * 100
        pz = math.sin(th) * orbit * 100
        v3, idx3 = sphere(px, 0, pz, size * 2, seg=8)
        meshes.append(Mesh(f'{key}_planet_{name}', f'Planet {name}', 'planet', v3, idx3))
    return meshes


def build_cluster(key, data):
    meshes = []
    for (name, gtype, x, y, size) in data['galaxies']:
        col = {'elliptical': '#e8d8a8', 'lenticular': '#d8c8a8', 'spiral': '#c8a06a',
               'barred_spiral': '#c8a06a', 'irregular': '#aabfff', 'dwarf': '#8a8a9a',
               'cluster': '#3a4a6a', 'anomaly': '#e2562a'}.get(gtype, '#888888')
        v, idx = sphere(x, y, 0, size)
        meshes.append(Mesh(f'{key}_{name.lower().replace(" ", "_")}', name, gtype, v, idx))
    return meshes


def main():
    # all 88 constellations
    for key, data in C.IAU.items():
        meshes = build_constellation(key, data)
        write_atlas(key, meshes, version='KEV-Constellation 1.0', out_species=f'constellation-{key}',
                    source='KEV Constellation Generator (real IAU star positions)',
                    scope=f"{data['label']} - {len(meshes)} bright stars (real positions)",
                    center=True, floor_y=False)
        print(f'  {key}: {len(meshes)} stars')

    # exoplanet systems
    for key, data in C.EXOPLANET_SYSTEMS.items():
        meshes = build_exoplanet_system(key, data)
        write_atlas(key, meshes, version='KEV-Exoplanet 1.0', out_species=f'exoplanet-{key}',
                    source='KEV Exoplanet Generator (real system, schematic sizes)',
                    scope=f"{data['label']} - {len(data['planets'])} planets (real orbits)",
                    center=True, floor_y=False)
        print(f'  {key}: {len(data["planets"])} planets')

    # galaxy clusters
    for key, data in C.GALAXY_CLUSTERS.items():
        meshes = build_cluster(key, data)
        write_atlas(key, meshes, version='KEV-Cluster 1.0', out_species=f'cluster-{key}',
                    source='KEV Cluster Generator (real member galaxies where published)',
                    scope=f"{data['label']} - {len(meshes)} galaxies",
                    center=True, floor_y=False)
        print(f'  {key}: {len(meshes)} galaxies')


if __name__ == '__main__':
    main()
