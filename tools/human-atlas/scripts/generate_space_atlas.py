"""Generate deep-space / universe object atlases (galaxies, black holes, comets,
asteroids, meteors, constellations). Real structure where published; deposits
schematic and labeled.

Run: python generate_space_atlas.py [object ...]
"""
import math, sys
from pathlib import Path
import space as SP
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'

SCALE = 1.0


def box(cx, cy, cz, w, h, d):
    x, y, z = w / 2, h / 2, d / 2
    v = []
    for (px, py, pz) in [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]:
        v.extend([cx + px, cy + py, cz + pz])
    idx = [0,1,2, 0,2,3, 4,6,5, 4,7,6, 0,4,5, 0,5,1, 1,5,6, 1,6,2, 2,6,7, 2,7,3, 3,7,4, 3,4,0]
    return v, idx


def cylinder(cx, cy, cz, radius, height, seg=12, axis='y'):
    v, idx = [], []
    for i in range(seg + 1):
        th = 2 * math.pi * i / seg
        for y in (-height / 2, height / 2):
            a, b = radius * math.cos(th), radius * math.sin(th)
            if axis == 'y':
                v.extend([cx + a, cy + y, cz + b])
            elif axis == 'x':
                v.extend([cx + y, cy + a, cz + b])
            else:
                v.extend([cx + a, cy + b, cz + y])
    for i in range(seg):
        a = i * 2
        idx.extend([a, a + 1, a + 2, a + 1, a + 3, a + 2])
    return v, idx


def sphere(cx, cy, cz, r, seg=16, rings=12):
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


def spiral_arm(cx, cy, cz, r_out, r_in, arms, pitch, seg=64):
    """Spiral arms as a ribbon (top-down view)."""
    v, idx = [], []
    for arm in range(arms):
        phase = 2 * math.pi * arm / arms
        base = len(v) // 3
        for i in range(seg + 1):
            t = i / seg
            r = r_in + (r_out - r_in) * t
            th = phase + pitch * t * 2 * math.pi
            co, so = math.cos(th), math.sin(th)
            w = 0.5 + t * 1.0
            v.extend([cx + r*co, cy, cz + r*so - w/2])
            v.extend([cx + r*co, cy, cz + r*so + w/2])
        for i in range(seg):
            a = base + i * 2
            idx.extend([a, a+1, a+2, a+1, a+3, a+2])
    return v, idx


def tail(cx, cy, cz, length, width, curve, seg=32):
    """A comet tail as a curved ribbon."""
    v, idx = [], []
    for i in range(seg + 1):
        t = i / seg
        x = cx + length * t
        y = cy + curve * length * t * t
        w = width * (1 - t * 0.7)
        v.extend([x, y, cz - w/2])
        v.extend([x, y, cz + w/2])
    for i in range(seg):
        a = i * 2
        idx.extend([a, a+1, a+2, a+1, a+3, a+2])
    return v, idx


def combine(parts):
    v, idx = [], []
    for (pv, pi) in parts:
        base = len(v) // 3
        v.extend(pv)
        idx.extend([base + i for i in pi])
    return v, idx


def build_component(builder, p):
    out = []
    if builder == 'central_bar':
        out.append(box(0, 0, 0, p['l'], p['h'], p['w']))
    elif builder == 'bulge':
        out.append(sphere(0, 0, 0, p['r']))
    elif builder == 'disk':
        out.append(ring(0, 0, 0, p['r_out'], p['r_in'], p['h'], 48))
    elif builder == 'spiral_arms':
        out.append(spiral_arm(0, 0, 0, p['r_out'], p['r_in'], p['arms'], p['pitch']))
    elif builder == 'halo':
        out.append(sphere(0, 0, 0, p['r'], seg=p['segs']))
    elif builder == 'globular_clusters':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(sphere(math.cos(th)*p['r'], math.sin(th)*p['r']*0.3, math.sin(th)*p['r']*0.7, 0.5, seg=8))
    elif builder == 'solar_position':
        out.append(sphere(p['r']*math.cos(p['angle']), 0, p['r']*math.sin(p['angle']), 0.3, seg=8))
    elif builder == 'event_horizon':
        out.append(sphere(0, 0, 0, p['r'], seg=24))
    elif builder == 'accretion_disk':
        out.append(ring(0, 0, 0, p['r_out'], p['r_in'], p['h'], 48))
    elif builder == 'relativistic_jets':
        out.append(cylinder(0, p['h']/2, 0, p['r'], p['h'], axis='y'))
        out.append(cylinder(0, -p['h']/2, 0, p['r'], p['h'], axis='y'))
    elif builder == 'photon_sphere':
        out.append(ring(0, 0, 0, p['r'], p['r']*0.95, 0.05, p['segs']))
    elif builder == 'inner_stable_orbit':
        out.append(ring(0, 0, 0, p['r'], p['r']*0.98, 0.03, p['segs']))
    elif builder in ('alnitak', 'alnilam', 'mintaka', 'betelgeuse', 'bellatrix', 'saiph', 'rigel',
                     'dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid',
                     'central_star', 'young_stars'):
        x = p.get('x', 0); y = p.get('y', 0)
        out.append(sphere(x, y, 0, p['r'], seg=12))
    elif builder == 'orion_nebula':
        out.append(sphere(p['x'], p['y'], 0, p['r'], seg=16))
    elif builder == 'horsehead_nebula':
        out.append(box(p['x'], p['y'], 0, p['r'], p['r']*2, p['r']))
    elif builder == 'belt':
        out.append(ring(0, 0, 0, p['r_out'], p['r_in'], p['h'], p.get('n', 32)))
    elif builder == 'ceres' or builder == 'vesta' or builder == 'pallas' or builder == 'pluto_object' or builder == 'eris_object':
        out.append(sphere(p.get('x', 0), 0, p.get('z', 0), p['r'], seg=12))
    elif builder == 'nucleus':
        out.append(sphere(0, 0, 0, p['r'], seg=12))
    elif builder == 'coma':
        out.append(sphere(0, 0, 0, p['r'], seg=16))
    elif builder == 'dust_tail':
        out.append(tail(0, 0, 0, p['l'], p['w'], p['curve']))
    elif builder == 'ion_tail':
        out.append(tail(0, 0, 0, p['l'], p['w'], p['curve']))
    elif builder == 'trail':
        out.append(tail(0, 0, 0, p['l'], p['w'], p['curve']))
    elif builder == 'meteoroid':
        out.append(sphere(0, 0, 0, p['r'], seg=8))
    elif builder == 'core':
        out.append(sphere(0, 0, 0, p['r'], seg=16))
    elif builder == 'cloud':
        out.append(sphere(0, 0, 0, p['r'], seg=p['segs']))
    elif builder == 'star_forming_regions':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(sphere(math.cos(th)*p['r']*0.5, math.sin(th)*p['r']*0.3, math.sin(th)*p['r']*0.5, 0.4, seg=8))
    elif builder == 'gas_cloud':
        out.append(sphere(0, 0, 0, p['r'], seg=p['segs']))
    elif builder == 'shell':
        out.append(ring(0, 0, 0, p['r_out'], p['r_in'], 0.5, p['segs']))
    elif builder == 'dust_cloud':
        out.append(sphere(0, 0, 0, p['r'], seg=p['segs']))
    return out


def build_object(key, obj):
    meshes = []
    for (cat, builder, p) in obj['components']:
        parts = build_component(builder, p)
        if not parts:
            continue
        v, idx = combine(parts)
        name = SP.CATEGORIES.get(cat, {}).get('name', cat) + ' - ' + builder.replace('_', ' ')
        meshes.append(Mesh(f'{key}_{builder}', name, cat, v, idx))
    return meshes


def main():
    targets = sys.argv[1:] or list(SP.SPACE_OBJECTS.keys())
    for key in targets:
        obj = SP.SPACE_OBJECTS.get(key)
        if not obj:
            print(f'  skip {key}'); continue
        meshes = build_object(key, obj)
        write_atlas(key, meshes, version='KEV-Space 1.0', out_species=f'space-{key}',
                    source='KEV Space Generator (real structure where published, deposits schematic)',
                    scope=f"{obj['label']} - {len(meshes)} components (real proportions)",
                    center=True, floor_y=False)
        print(f"  {key}: {len(meshes)} components -> atlas-space-{key}.json")


if __name__ == '__main__':
    main()
