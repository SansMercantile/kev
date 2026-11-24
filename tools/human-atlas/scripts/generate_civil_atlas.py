"""Generate civil-engineering structure atlases (dimensionally accurate).

Each structure (house, skyscraper, road, bridge types) becomes a set of
procedural solids at true proportions (real lumber/brick/steel/pipe sizes).
Consumable by the planet/atlas viewer for explode/isolate/rotate.

Components are TEACHING solids at real dimensions, not surveyed buildings.

Run: python generate_civil_atlas.py [structure ...]
"""
import math, sys
from pathlib import Path
import civil as CV
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'

SCALE = 1.0  # structures in metres; house ~8m, bridge ~40m


# --- primitive builders (vertices, indices) ---
def box(cx, cy, cz, w, h, d):
    x, y, z = w / 2, h / 2, d / 2
    v = []
    for (px, py, pz) in [
        (-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),
        (-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]:
        v.extend([cx + px, cy + py, cz + pz])
    idx = [
        0,1,2, 0,2,3, 4,6,5, 4,7,6,
        0,4,5, 0,5,1, 1,5,6, 1,6,2,
        2,6,7, 2,7,3, 3,7,4, 3,4,0]
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


def arch(cx, cy, cz, span, rise, w, t, seg=24):
    """A parabolic arch band (intrados + extrados + faces)."""
    v, idx = [], []
    half = span / 2
    for i in range(seg + 1):
        t01 = i / seg
        x = -half + span * t01
        y = rise * (1 - (x / half) ** 2)
        for (yy, zz) in [(0, -w/2),(0, w/2),(-t, -w/2),(-t, w/2)]:
            v.extend([cx + x, cy + y + yy, cz + zz])
    stride = 4
    for i in range(seg):
        a = i * stride
        b = a + stride
        # extrados (top) face
        idx.extend([a, b, a+1, a+1, b, b+1])
        # intrados (bottom) face
        idx.extend([a+2, a+3, b+2, a+3, b+3, b+2])
        # side faces
        idx.extend([a, a+2, b, a+2, b+2, b])
        idx.extend([a+1, b+1, a+3, a+3, b+1, b+3])
    return v, idx


def catenary_cable(cx, cy, cz, length, sag, w, seg=32):
    """A hanging cable (parabola) as a ribbon."""
    v, idx = [], []
    half = length / 2
    for i in range(seg + 1):
        t01 = i / seg
        x = -half + length * t01
        y = -sag * (1 - (x / half) ** 2)
        v.extend([cx + x, cy + y, cz - w/2])
        v.extend([cx + x, cy + y, cz + w/2])
    for i in range(seg):
        a = i * 2
        idx.extend([a, a + 1, a + 2, a + 1, a + 3, a + 2])
    return v, idx


def combine(parts):
    v, idx = [], []
    for (pv, pi) in parts:
        base = len(v) // 3
        v.extend(pv)
        idx.extend([base + i for i in pi])
    return v, idx


# --- component builders -> list of (verts, idx) meshes per system ---
def build_component(cat, builder, p):
    out = []
    if builder == 'slab':
        out.append(box(0, p['t']/2, 0, p['w'], p['t'], p['d']))
    elif builder == 'footing':
        out.append(box(0, p['t']/2 - 0.05, 0, p['w'], p['t'], p['d']))
    elif builder == 'raft':
        out.append(box(0, p['t']/2, 0, p['w'], p['t'], p['d']))
    elif builder == 'wall_frame':
        w, d, h = p['w'], p['d'], p['h']
        s = CV.LUMBER[p['stud']]
        sp = p['spacing']
        # perimeter studs
        for x in [(-w/2 + s['w']/2 + i*sp) for i in range(int(w/sp))]:
            out.append(box(x, h/2, -d/2 + s['w']/2, s['w'], h, s['h']))
            out.append(box(x, h/2, d/2 - s['w']/2, s['w'], h, s['h']))
        for z in [(-d/2 + s['w']/2 + i*sp) for i in range(int(d/sp))]:
            out.append(box(-w/2 + s['w']/2, h/2, z, s['h'], h, s['w']))
            out.append(box(w/2 - s['w']/2, h/2, z, s['h'], h, s['w']))
        # plates
        out.append(box(0, h, -d/2 + s['h']/2, w, s['w'], s['h']))
        out.append(box(0, h, d/2 - s['h']/2, w, s['w'], s['h']))
    elif builder == 'top_plate':
        s = CV.LUMBER[p['sec']]
        out.append(box(0, p['h'], -p['d']/2 + s['h']/2, p['w'], s['w'], s['h']))
        out.append(box(0, p['h'], p['d']/2 - s['h']/2, p['w'], s['w'], s['h']))
    elif builder in ('floor_joists', 'ceiling_joists'):
        s = CV.LUMBER[p['sec']]
        sp = p['spacing']
        n = int(p['w'] / sp)
        for i in range(n + 1):
            x = -p['w']/2 + i*sp
            out.append(box(x, p['y'], 0, s['w'], s['h'], p['d']))
    elif builder == 'rafters':
        s = CV.LUMBER[p['sec']]
        sp = p['spacing']
        n = int(p['w'] / sp)
        import math as m
        run = p['d']/2
        rise = p['rise']
        length = m.hypot(run, rise)
        ang = m.atan2(rise, run)
        for i in range(n + 1):
            x = -p['w']/2 + i*sp
            for sign in (-1, 1):
                cx = x; cy = p['y'] + rise/2; cz = sign * run/2
                vv, ii = box(0, 0, 0, s['w'], s['h'], length)
                # rotate about X by angle
                rot = []
                for j in range(0, len(vv), 3):
                    vx, vy, vz = vv[j], vv[j+1], vv[j+2]
                    yy = vy*m.cos(-sign*ang) - vz*m.sin(-sign*ang)
                    zz = vy*m.sin(-sign*ang) + vz*m.cos(-sign*ang)
                    rot.extend([vx + cx, yy + cy, zz + cz])
                out.append((rot, ii))
        # ridge beam
        out.append(box(0, p['y'] + rise, 0, p['w'], s['w'], s['h']))
    elif builder == 'chimney':
        out.append(box(0, p['h']/2, 0, p['w'], p['h'], p['d']))
    elif builder == 'walls_inner':
        w, d, h, t = p['w'], p['d'], p['h'], p['t']
        out.append(box(0, h/2, -d/2, w, h, t))
        out.append(box(0, h/2, d/2, w, h, t))
        out.append(box(-w/2, h/2, 0, t, h, d))
        out.append(box(w/2, h/2, 0, t, h, d))
    elif builder == 'wall_batts':
        w, d, h, t = p['w'], p['d'], p['h'], p['t']
        out.append(box(0, h/2, -d/2, w, h, t))
        out.append(box(0, h/2, d/2, w, h, t))
    elif builder == 'roof_deck':
        run = p['d']/2; rise = p['rise']
        length = math.hypot(run, rise); ang = math.atan2(rise, run)
        for sign in (-1, 1):
            vv, ii = box(0, 0, 0, p['w'], 0.02, length)
            rot = []
            for j in range(0, len(vv), 3):
                vx, vy, vz = vv[j], vv[j+1], vv[j+2]
                yy = vy*math.cos(-sign*ang) - vz*math.sin(-sign*ang)
                zz = vy*math.sin(-sign*ang) + vz*math.cos(-sign*ang)
                rot.extend([vx, p['y'] + rise/2 + yy, sign*run/2 + zz])
            out.append((rot, ii))
    elif builder == 'pipes':
        d = p['diameter']
        # supply riser + horizontal run + drain stack
        out.append(cylinder(-p['w']/4, p['h']/2, -p['d']/2 + 0.1, d/2, p['h'], axis='y'))
        out.append(cylinder(0, p['h']*0.6, -p['d']/2 + 0.1, d/2, p['w']/2, axis='x'))
        out.append(cylinder(p['w']/4, p['h']/2, -p['d']/2 + 0.1, d*1.5, p['h'], axis='y'))
    elif builder == 'circuits':
        # main runs at outlets + lighting drops
        out.append(cylinder(0, 0.3, -p['d']/2 + 0.05, 0.008, p['w'], axis='x'))
        out.append(cylinder(0, p['h'] - 0.3, -p['d']/2 + 0.05, 0.008, p['w'], axis='x'))
        out.append(cylinder(3.5, p['h']/2, -p['d']/2 + 0.05, 0.008, p['h'], axis='y'))
    elif builder == 'panel':
        out.append(box(p['x'], p['y'], p['z'], p['w'], p['h'], p['d']))
    elif builder == 'core':
        out.append(box(0, p['h']/2, 0, p['w'], p['h'], p['d']))
    elif builder == 'columns':
        s = CV.LUMBER[p['sec']]
        for x in (-p['w']/2, -p['w']/6, p['w']/6, p['w']/2):
            for z in (-p['d']/2, p['d']/2):
                out.append(box(x, p['h']/2, z, s['w'], p['h'], s['h']))
    elif builder == 'beams':
        s = CV.LUMBER[p['sec']]
        for f in range(1, p['floors'] + 1):
            y = f * (p['floors'] and 30.0/p['floors'])
            out.append(box(0, y, -p['d']/2, p['w'], s['h'], s['w']))
            out.append(box(0, y, p['d']/2, p['w'], s['h'], s['w']))
    elif builder == 'floor_slabs':
        for f in range(1, p['floors'] + 1):
            y = f * 3.0
            out.append(box(0, y, 0, p['w'], p['t'], p['d']))
    elif builder == 'curtain_wall':
        w, d, h = p['w'], p['d'], p['h']
        out.append(box(0, h/2, -d/2, w, h, 0.05))
        out.append(box(0, h/2, d/2, w, h, 0.05))
        out.append(box(-w/2, h/2, 0, 0.05, h, d))
        out.append(box(w/2, h/2, 0, 0.05, h, d))
    elif builder == 'risers':
        for x in (-1.5, 1.5):
            out.append(cylinder(x, p['h']/2, 0, 0.1, p['h'], axis='y'))
    elif builder == 'deck':
        out.append(box(0, p.get('y', 0) + p['t']/2, 0, p['l'], p['t'], p['w']))
    elif builder == 'girders':
        for i in range(p['n']):
            z = -p['w']/2 + (i + 0.5) * (p['w']/p['n'])
            out.append(box(0, -0.5, z, p['l'], p['h'], 0.2))
    elif builder in ('piers', 'abutments'):
        for i in range(p['n']):
            x = -p['l']/2 + (i + 0.5) * (p['l']/p['n'])
            out.append(box(x, -p['h']/2, 0, 1.0, p['h'], p['w']))
    elif builder == 'towers':
        for x in (-p['l']/2, p['l']/2):
            out.append(box(x, p['h']/2, -p['w'], 0.5, p['h'], 0.5))
            out.append(box(x, p['h']/2, p['w'], 0.5, p['h'], 0.5))
            out.append(box(x, p['h'] - 0.5, 0, 0.5, 1.0, p['w']*2 + 0.5))
    elif builder == 'pylon':
        out.append(box(0, p['h']/2, 0, p['w'], p['h'], p['w']))
    elif builder == 'main_cables':
        for z in (-2.0, 2.0):
            out.append(catenary_cable(0, p['h'], z, p['l'], p['sag'], 0.1))
    elif builder == 'hangers':
        for i in range(p['n']):
            x = -p['l']/2 + (i + 0.5) * (p['l']/p['n'])
            half = p['l']/2
            ytop = p['h'] - p['sag'] * (1 - (x / half) ** 2)
            out.append(cylinder(x, ytop/2, -2.0, 0.03, ytop, axis='y'))
            out.append(cylinder(x, ytop/2, 2.0, 0.03, ytop, axis='y'))
    elif builder == 'stays':
        for i in range(p['n']):
            x = -p['l']/2 + (i + 1) * (p['l']/(p['n'] + 1))
            out.append(cylinder(x/2, p['h']/2, 0, 0.03, math.hypot(x, p['h']), axis='y'))
    elif builder == 'truss':
        # top + bottom chords + verticals + diagonals
        panel = p['l'] / p['panels']
        out.append(box(0, p['h'], 0, p['l'], 0.3, p['w']))
        out.append(box(0, 0, 0, p['l'], 0.3, p['w']))
        for i in range(p['panels'] + 1):
            x = -p['l']/2 + i*panel
            out.append(box(x, p['h']/2, 0, 0.2, p['h'], 0.2))
    elif builder == 'cantilever':
        out.append(box(0, p['h'], 0, p['l'], 0.5, p['w']))
        for i in range(6):
            x = -p['l']/2 + i*(p['l']/5)
            out.append(box(x, p['h']/2, 0, 0.3, p['h'], 0.3))
    elif builder == 'arch':
        out.append(arch(0, 0, 0, p['span'], p['rise'], p['w'], p['t']))
    elif builder == 'spandrel':
        out.append(box(-p['span']/2 - 1, p['rise']/2, 0, 2, p['rise'], p['w']))
        out.append(box(p['span']/2 + 1, p['rise']/2, 0, 2, p['rise'], p['w']))
    elif builder == 'asphalt_wearing' or builder == 'base_course' or builder == 'subbase' or builder == 'subgrade':
        out.append(box(0, p.get('y', 0) + p['t']/2, 0, p['l'], p['t'], p['w']))
    elif builder == 'drainage':
        out.append(cylinder(0, p['y'], 0, p['diameter']/2, p['l'], axis='x'))
    return out


def build_structure(key, struct):
    meshes = []
    for (cat, builder, p) in struct['components']:
        parts = build_component(cat, builder, p)
        if not parts:
            continue
        v, idx = combine(parts)
        name = CV.CATEGORIES.get(cat, {}).get('name', cat) + ' - ' + builder.replace('_', ' ')
        meshes.append(Mesh(f'{key}_{cat}_{builder}', name, cat, v, idx))
    return meshes


def main():
    targets = sys.argv[1:] or list(CV.STRUCTURES.keys())
    for key in targets:
        struct = CV.STRUCTURES.get(key)
        if not struct:
            print(f'  skip {key}'); continue
        meshes = build_structure(key, struct)
        write_atlas(key, meshes, version='KEV-Civil 1.0', out_species=f'civil-{key}',
                    source='KEV Civil Engineering Generator (dimensionally accurate teaching solids)',
                    scope=f"{struct['label']} - {len(meshes)} component systems (real proportions)",
                    center=True, floor_y=False)
        print(f"  {key}: {len(meshes)} systems -> atlas-civil-{key}.json")


if __name__ == '__main__':
    main()
