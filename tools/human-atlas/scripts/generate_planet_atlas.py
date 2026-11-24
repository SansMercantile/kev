"""Generate a layered planet/moon/sun atlas in the KEV atlas format.

Each body becomes concentric spherical shells (real interior radii) with a
90° wedge cut away so the interior is visible, plus schematic substance
deposits (blobs/seams at the correct depth layer). Output is consumed by the
existing atlasSceneExact viewer -> explode/isolate/rotate for free.

Layers and radii are from published interior models (see planets.py). Deposits
are schematic teaching geometry and are labeled as such.

Run: python generate_planet_atlas.py [body ...]
"""
import math, sys, json
from pathlib import Path
import planets as PL
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'

# Cutaway wedge: remove a sector of this many degrees around the Y axis so the
# interior layers are visible (like a quarter-sliced orange).
CUTAWAY_DEG = 70.0
RADIUS_SCALE = 5.0  # normalize body radius to 5.0 scene units


def shell(r_out, r_in, seg=64, rings=40, cutaway_deg=0.0):
    """A spherical shell between radii r_out and r_in, with an optional
    longitudinal wedge (cutaway_deg) removed around the Y axis.
    Returns (vertices, indices)."""
    if cutaway_deg >= 360.0:
        return [], []
    cut = math.radians(cutaway_deg)
    full = 2 * math.pi - cut
    v, idx = [], []
    # build the shell as two hemispherical grids (outer + inner) plus rim walls
    def grid(radius, flip=False):
        base = len(v) // 3
        cols = seg + 1
        for ri in range(rings + 1):
            phi = math.pi * ri / rings  # 0..pi
            sp, cp = math.sin(phi), math.cos(phi)
            for ci in range(cols):
                th = cut / 2 + full * ci / seg  # wedge centered on +X? around Y
                st, ct = math.sin(th), math.cos(th)
                v.extend([radius * sp * ct, radius * cp, radius * sp * st])
        for ri in range(rings):
            for ci in range(seg):
                a = base + ri * cols + ci
                b = base + ri * cols + ci + 1
                c = base + (ri + 1) * cols + ci
                d = base + (ri + 1) * cols + ci + 1
                if flip:
                    idx.extend([a, b, c, b, d, c])
                else:
                    idx.extend([a, c, b, b, c, d])
        return base
    o_base = grid(r_out, flip=False)
    i_base = grid(r_in, flip=True)
    # rim walls connecting outer and inner at the two cut edges
    cols = seg + 1
    for ri in range(rings):
        for (ci,) in ((0,), (seg,)):
            o0 = o_base + ri * cols + ci
            o1 = o_base + (ri + 1) * cols + ci
            n0 = i_base + ri * cols + ci
            n1 = i_base + (ri + 1) * cols + ci
            idx.extend([o0, n0, o1, o1, n0, n1])
    return v, idx


def blob(center, radius, seg=10, rings=8):
    """Small sphere for a substance deposit."""
    cx, cy, cz = center
    v, idx = [], []
    for r in range(rings + 1):
        phi = math.pi * r / rings
        sp, cp = math.sin(phi), math.cos(phi)
        for s in range(seg):
            th = 2 * math.pi * s / seg
            st, ct = math.sin(th), math.cos(th)
            v.extend([cx + radius * sp * ct, cy + radius * cp, cz + radius * sp * st])
    for r in range(rings):
        for s in range(seg):
            a = r * seg + s
            b = r * seg + (s + 1) % seg
            c = a + seg
            d = b + seg
            idx.extend([a, c, b, b, c, d])
    return v, idx


def surface_shell(radius, seg=48, rings=32):
    """Full (no cutaway) sphere shell for surface substances like oceans/ice."""
    v, idx = [], []
    cols = seg + 1
    for r in range(rings + 1):
        phi = math.pi * r / rings
        sp, cp = math.sin(phi), math.cos(phi)
        for c in range(cols):
            th = 2 * math.pi * c / seg
            st, ct = math.sin(th), math.cos(th)
            v.extend([radius * sp * ct, radius * cp, radius * sp * st])
    for r in range(rings):
        for c in range(seg):
            a = r * cols + c
            b = r * cols + c + 1
            cc = a + cols
            d = b + cols
            idx.extend([a, cc, b, b, cc, d])
    return v, idx


def _hash_pts(seed, n):
    """Deterministic pseudo-random unit directions (for deposit placement)."""
    pts = []
    x = seed
    for i in range(n):
        x = (1103515245 * x + 12345) & 0x7fffffff
        th = (x / 0x7fffffff) * 2 * math.pi
        x = (1103515245 * x + 12345) & 0x7fffffff
        u = (x / 0x7fffffff) * 2 - 1
        s = math.sqrt(max(0, 1 - u * u))
        pts.append((s * math.cos(th), u, s * math.sin(th)))
    return pts


def build_body(key, body):
    meshes = []
    R = RADIUS_SCALE
    layers = body['layers']
    for li, layer in enumerate(layers):
        ro = layer['outer'] * R
        ri = layer['inner'] * R
        if ri <= 0.0:
            # solid core: solid sphere (use outer radius, no inner, as a full ball)
            v, idx = shell(ro, max(0.0001, ro * 0.02), cutaway_deg=CUTAWAY_DEG)
        else:
            v, idx = shell(ro, ri, cutaway_deg=CUTAWAY_DEG)
        meshes.append(Mesh(f'{key}_layer_{li}', layer['name'], 'geologic', v, idx))

    # deposits
    seed = sum(ord(c) for c in key) + 7
    for dep in body.get('deposits', []):
        subst, layer_idx, count = dep[0], dep[1], dep[2]
        as_shell = len(dep) > 3 and dep[3]
        s = PL.SUBSTANCES.get(subst)
        if not s:
            continue
        layer = layers[layer_idx]
        ro = layer['outer'] * R
        ri = layer['inner'] * R
        if as_shell:
            # a thin full shell just inside the layer's outer boundary
            radius = (ro * 0.995) if ri > 0 else ro * 0.7
            v, idx = surface_shell(radius)
            meshes.append(Mesh(f'{key}_dep_{subst}', s['name'], subst, v, idx))
        else:
            # scattered blobs at the layer's mid-depth
            mid = (ro + ri) / 2 if ri > 0 else ro * 0.5
            blob_r = max(0.06, (ro - ri) * 0.12) if ri > 0 else ro * 0.06
            pts = _hash_pts(seed + layer_idx * 31 + count, count)
            for di, p in enumerate(pts):
                c = (p[0] * mid, p[1] * mid, p[2] * mid)
                v, idx = blob(c, blob_r)
                meshes.append(Mesh(f'{key}_dep_{subst}_{di}', s['name'], subst, v, idx))
    return meshes


def main():
    targets = sys.argv[1:] or list(PL.BODIES.keys())
    for key in targets:
        body = PL.BODIES.get(key)
        if not body:
            print(f'  skip {key}'); continue
        meshes = build_body(key, body)
        src = 'KEV Planetary Generator (interior model: published seismic/structure data; deposits schematic)'
        scope = f"{body['label']} - {len(body['layers'])} layers, {len(meshes)-len(body['layers'])} deposits, r={body['radius_km']} km"
        write_atlas(key, meshes, version='KEV-Planet 1.0', out_species=f'planet-{key}',
                    source=src, scope=scope, center=False, floor_y=False)
        print(f"  {key}: {len(meshes)} parts -> atlas-planet-{key}.json")


if __name__ == '__main__':
    main()
