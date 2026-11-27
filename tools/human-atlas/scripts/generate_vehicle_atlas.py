"""Generate vehicle atlas models (real dimensions and component proportions).

Each vehicle becomes a set of procedural solids at true proportions (real
wheel sizes, chassis lengths, rotor spans, hull lengths). Exploded by system
(frame, wheels, engine, steering, body, etc.).

Run: python generate_vehicle_atlas.py [vehicle ...]
"""
import math, sys
from pathlib import Path
import vehicles as V
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


def cylinder(cx, cy, cz, radius, height, seg=16, axis='y'):
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


def combine(parts):
    v, idx = [], []
    for (pv, pi) in parts:
        base = len(v) // 3
        v.extend(pv)
        idx.extend([base + i for i in pi])
    return v, idx


def build_component(cat, builder, p):
    out = []
    if builder == 'boot':
        out.append(box(0, p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'frame':
        out.append(box(0, p['h']/2, 0, p['l'], p['h'], p.get('w', p.get('d', p.get('diameter', 0.2)))))
    elif builder == 'deck':
        out.append(box(0, p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'trucks':
        for i in range(p['n']):
            x = -p['l']/2 + i * p['l']
            out.append(box(x, -0.03, 0, p['l'], 0.05, p['w']))
    elif builder == 'wheels':
        sp = p.get('spacing', 0.5)
        tr = p.get('track', 0.5)
        wd = p.get('width', p.get('w', 0.1))
        for i in range(p['n']):
            if p['n'] == 2:
                x = -sp/2 + i * sp
                out.append(cylinder(x, p['diameter']/2, 0, p['diameter']/2, wd, axis='z'))
            elif p['n'] == 3:
                x = -sp + i * sp
                out.append(cylinder(x, p['diameter']/2, 0, p['diameter']/2, wd, axis='z'))
            elif p['n'] in (4, 6, 8, 12):
                for (xx, zz) in [(-sp/2, -tr/2), (sp/2, -tr/2), (-sp/2, tr/2), (sp/2, tr/2)]:
                    out.append(cylinder(xx, p['diameter']/2, zz, p['diameter']/2, wd, axis='z'))
    elif builder == 'bearings':
        for i in range(p['n']):
            out.append(sphere(0, 0, 0, p['diameter']/2, seg=8))
    elif builder == 'crankset':
        out.append(cylinder(p['x'], p.get('y', 0.4), 0, p['diameter']/2, 0.03, axis='z'))
    elif builder == 'chain':
        out.append(cylinder(p.get('x', 0.4), p.get('y', 0.4), 0, 0.01, p['l'], axis='x'))
    elif builder == 'handlebars':
        out.append(cylinder(p['x'], p['y'], 0, 0.02, p['l'], axis='z'))
    elif builder == 'saddle':
        out.append(box(p['x'], p['y'], 0, p['l'], 0.05, p['w']))
    elif builder == 'seat':
        out.append(box(p['x'], p['y'], 0, p['l'], 0.05, p['w']))
    elif builder == 'tank':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'chassis':
        out.append(box(0, p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'engine':
        if 'diameter' in p:
            out.append(cylinder(p.get('x', 0), 0, 0, p['diameter']/2, p.get('l', 0.5), axis='x'))
        else:
            out.append(box(p.get('x', 0), p.get('h', 0.5)/2, 0, p.get('l', 0.5), p.get('h', 0.5), p.get('w', 0.5)))
    elif builder == 'engines_jet':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(cylinder(p['x'], p['y'], math.sin(th)*1.5, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'cabin_jet':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'body':
        out.append(box(0, p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'cabin':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p.get('w', p.get('d', 1.0))))
    elif builder == 'steering_wheel':
        out.append(cylinder(p['x'], p['y'], 0, p['diameter']/2, 0.03, axis='z'))
    elif builder == 'suspension':
        for i in range(p['n']):
            x = -1.0 + i * 0.7
            out.append(cylinder(x, p['h']/2, 0, 0.05, p['h'], axis='y'))
    elif builder == 'brakes':
        for i in range(p['n']):
            out.append(box(0, 0, 0, 0.1, 0.05, 0.05))
    elif builder == 'envelope':
        out.append(sphere(0, 0, 0, p['diameter']/2, seg=24))
    elif builder == 'basket':
        out.append(box(0, p['y'], 0, p['w'], p['h'], p['d']))
    elif builder == 'burner':
        out.append(box(0, p['y'], 0, p['w'], p['h'], p['w']))
    elif builder == 'ropes':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(cylinder(math.cos(th)*0.5, p['h']/2, math.sin(th)*0.5, 0.01, p['h'], axis='y'))
    elif builder == 'fuselage':
        out.append(cylinder(0, 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'wings':
        sweep = p.get('sweep', 0.0)
        for sign in (-1, 1):
            vv, ii = box(0, 0, 0, p['span']/2, 0.1, p['chord'])
            rot = []
            for j in range(0, len(vv), 3):
                vx, vy, vz = vv[j], vv[j+1], vv[j+2]
                yy = vy + sign * sweep * abs(vx)
                rot.extend([vx, yy + p.get('y', 0), sign * (abs(vx) + p['chord']/2)])
            out.append((rot, ii))
    elif builder == 'tail':
        for sign in (-1, 1):
            out.append(box(0, p.get('y', 0), sign * p['span']/4, p['span']/2, 0.08, p['chord']))
    elif builder == 'vertical_tail':
        out.append(box(p['x'], p['h']/2, 0, 2.0, p['h'], 0.1))
    elif builder == 'propeller':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, 0.05, axis='x'))
        for i in range(3):
            th = 2 * math.pi * i / 3
            out.append(box(p['x'], math.cos(th)*p['diameter']/2, math.sin(th)*p['diameter']/2, 0.05, p['diameter'], 0.1))
    elif builder == 'main_rotor':
        out.append(cylinder(0, p['y'], 0, p['diameter']/2, 0.05, axis='y'))
        for i in range(4):
            th = 2 * math.pi * i / 4
            out.append(box(math.cos(th)*p['diameter']/2, p['y'], math.sin(th)*p['diameter']/2, 0.05, p['diameter'], 0.1))
    elif builder == 'tail_rotor':
        out.append(cylinder(p['x'], p['y'], 0, p['diameter']/2, 0.05, axis='z'))
    elif builder == 'landing_gear':
        for i in range(p['n']):
            x = -2.0 + i * 2.0
            out.append(cylinder(x, p['diameter']/2, 0, p['diameter']/2, 0.2, axis='z'))
    elif builder == 'skids':
        for sign in (-1, 1):
            out.append(box(0, -0.5, sign*p['spacing']/2, p['l'], 0.1, 0.1))
    elif builder == 'hull':
        out.append(box(0, p['h']/2, 0, p['l'], p['h'], p.get('w', p.get('diameter', 2.0))))
    elif builder == 'main_sail':
        out.append(box(p['x'], p['h']/2, 0, p['w'], p['h'], 0.05))
    elif builder == 'jib':
        out.append(box(p['x'], p['h']/2, 0, p['w'], p['h'], 0.05))
    elif builder == 'mast':
        out.append(cylinder(p['x'], p['h']/2, 0, 0.1, p['h'], axis='y'))
    elif builder == 'superstructure':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'flybridge':
        out.append(box(p['x'], p['y'], 0, p['l'], p['h'], p['w']))
    elif builder == 'containers':
        for i in range(p['n']):
            x = -p['l']/2 + i * (p['l']/p['n'])
            out.append(box(x, p['h']/2, 0, p['l']/p['n'] - 0.1, p['h'], p['w']))
    elif builder == 'pressure_hull':
        out.append(cylinder(0, 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'sail':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'reactor':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, 0.5, axis='y'))
    elif builder == 'diving_planes':
        for sign in (-1, 1):
            out.append(box(0, 0, sign*p['span']/4, p['span']/2, 0.05, 0.5))
    elif builder == 'first_stage':
        out.append(cylinder(0, p['l']/2, 0, p['diameter']/2, p['l'], axis='y'))
    elif builder == 'second_stage':
        out.append(cylinder(0, p['y'], 0, p['diameter']/2, p['l'], axis='y'))
    elif builder == 'engines':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(cylinder(math.cos(th)*0.5, p.get('x', 0), math.sin(th)*0.5, p['diameter']/2, 0.5, axis='y'))
    elif builder == 'fairing':
        out.append(cylinder(0, p['y'], 0, p['diameter']/2, p['h'], axis='y'))
    elif builder == 'tanks':
        out.append(cylinder(0, p['l']/2, 0, p['diameter']/2, p['l'], axis='y'))
    elif builder == 'orbiter':
        out.append(cylinder(0, 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'main_engines':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(cylinder(p['x'], math.cos(th)*0.5, math.sin(th)*0.5, p['diameter']/2, 0.5, axis='x'))
    elif builder == 'payload_bay':
        out.append(box(p['x'], 0, 0, p['l'], p['h'], p['w']))
    # military + space + railway builders
    elif builder == 'turret':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'cannon':
        out.append(cylinder(p['x'], p.get('y', 0), 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'tracks':
        for sign in (-1, 1):
            out.append(box(0, p['h']/2, sign*p['spacing']/2, p['l'], p['h'], p['w']))
    elif builder == 'road_wheels':
        for i in range(p['n']):
            x = -p.get('l', 6)/2 + i * p.get('l', 6)/p['n']
            out.append(cylinder(x, p['diameter']/2, p.get('track', 1.5)/2, p['diameter']/2, 0.1, axis='z'))
    elif builder == 'crew_compartment':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'troop_compartment':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'driver_cab':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'weapon_station':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'gun_turret':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'main_gun':
        out.append(cylinder(p['x'], p.get('y', 0), 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'propellers':
        for i in range(p['n']):
            x = p['x'] + i * 2
            out.append(cylinder(x, 0, 0, p['diameter']/2, 0.2, axis='x'))
    elif builder == 'bridge':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'bomb_bay':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'truss':
        out.append(box(0, 0, 0, p['l'], p['h'], p['w']))
    elif builder == 'habitat_module':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'node_module':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'solar_arrays':
        for i in range(p['n']):
            x = -p['span']/2 + i * p['span']/p['n']
            out.append(box(x, p['y'], 0, p['span']/p['n'], 0.05, p['chord']))
    elif builder == 'radiators':
        out.append(box(p['x'], 0, 0, p['l'], p['w'], 0.05))
    elif builder == 'docking_port':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, 0.5, axis='x'))
    elif builder == 'bus':
        out.append(box(0, 0, 0, p['l'], p['h'], p['w']))
    elif builder == 'solar_panels':
        for sign in (-1, 1):
            out.append(box(0, p['y'], sign*p['span']/4, p['span']/2, 0.05, p['chord']))
    elif builder == 'instrument_bay':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'antenna':
        out.append(cylinder(p['x'], p['h']/2, 0, p['diameter']/2, p['h'], axis='y'))
    elif builder == 'instrument_mast':
        out.append(cylinder(p['x'], p['h']/2, 0, 0.1, p['h'], axis='y'))
    elif builder == 'robotic_arm':
        out.append(cylinder(p['x'], p['y'], 0, 0.1, p['l'], axis='x'))
    elif builder == 'rtg':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, 0.3, axis='y'))
    elif builder == 'descent_stage':
        out.append(box(0, p['h']/2, 0, p['w'], p['h'], p['d']))
    elif builder == 'ascent_stage':
        out.append(box(0, p['y'], 0, p['l'], p['h'], p['w']))
    elif builder == 'descent_engine':
        out.append(cylinder(p['x'], p['y'], 0, p['diameter']/2, 0.3, axis='y'))
    elif builder == 'ascent_engine':
        out.append(cylinder(0, p['y'], 0, p['diameter']/2, 0.3, axis='y'))
    elif builder == 'legs':
        for i in range(p['n']):
            th = 2 * math.pi * i / p['n']
            out.append(cylinder(math.cos(th)*1.5, p['h']/2, math.sin(th)*1.5, 0.1, p['h'], axis='y'))
    elif builder == 'ladder':
        out.append(box(p['x'], 0, 0, 0.3, p['l'], 0.1))
    elif builder == 'cab':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'bogies':
        for i in range(p['n']):
            x = -p['spacing']/2 + i * p['spacing']
            out.append(box(x, p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'windows':
        for i in range(p['n']):
            x = p.get('x', 0) - p.get('l', 24)/2 + i * (p.get('l', 24)/p['n'])
            out.append(box(x, p['y'], 0, p['w'], p['h'], 0.05))
    elif builder == 'boxcar':
        out.append(box(0, p['y'], 0, p['l'], p['h'], p['w']))
    elif builder == 'boiler':
        out.append(cylinder(p['x'], 0, 0, p['diameter']/2, p['l'], axis='x'))
    elif builder == 'smokestack':
        out.append(cylinder(p['x'], p['h']/2, 0, 0.2, p['h'], axis='y'))
    elif builder == 'drivers':
        for i in range(p['n']):
            x = -p.get('l', 6)/2 + i * p.get('l', 6)/p['n']
            out.append(cylinder(x, p['diameter']/2, p.get('track', 1.5)/2, p['diameter']/2, 0.2, axis='z'))
    elif builder == 'leading_wheels':
        for sign in (-1, 1):
            out.append(cylinder(p['x'], p['diameter']/2, sign*p['track']/2, p['diameter']/2, 0.15, axis='z'))
    elif builder == 'tender':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'nose':
        out.append(box(p['x'], p['h']/2, 0, p['l'], p['h'], p['w']))
    elif builder == 'pantograph':
        out.append(box(p['x'], p['y'], 0, 1.0, p['h'], 0.05))
    return out


def build_vehicle(key, vehicle):
    meshes = []
    for (cat, builder, p) in vehicle['components']:
        parts = build_component(cat, builder, p)
        if not parts:
            continue
        v, idx = combine(parts)
        name = V.CATEGORIES.get(cat, {}).get('name', cat) + ' - ' + builder.replace('_', ' ')
        meshes.append(Mesh(f'{key}_{cat}_{builder}', name, cat, v, idx))
    return meshes


def main():
    targets = sys.argv[1:] or list(V.VEHICLES.keys())
    for key in targets:
        vehicle = V.VEHICLES.get(key)
        if not vehicle:
            print(f'  skip {key}'); continue
        meshes = build_vehicle(key, vehicle)
        write_atlas(key, meshes, version='KEV-Vehicle 1.0', out_species=f'vehicle-{key}',
                    source='KEV Vehicle Generator (real dimensions and proportions)',
                    scope=f"{vehicle['label']} - {len(meshes)} component systems (real proportions)",
                    center=True, floor_y=False)
        print(f"  {key}: {len(meshes)} systems -> atlas-vehicle-{key}.json")


if __name__ == '__main__':
    main()
