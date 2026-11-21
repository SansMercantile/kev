"""Generate organ systems for animal atlases.

No open-license organ meshes exist for these species, so organs are built as
procedural teaching geometry (recognizable shapes at anatomically-correct
positions) and scaled to each species' real skeleton bounding box. Honestly
labeled "KEV Procedural" in the manifest source field.

Body plans:
  axial      - quadruped mammals/reptiles (heart+lungs cranial-ventral,
               liver/stomach/gut mid-coelom, kidneys dorsal-caudal)
  bipedal    - upright (human-like stacking)
  avian      - keeled sternum, air sacs, gizzard
  serpentine - elongated, staggered unpaired organs along the column

Run: python generate-organs.py <species_key> [plan]
Reads the existing atlas-<species>.json skeleton bounds to fit organs inside.
"""
import json, math, sys
from pathlib import Path
import primgen as P
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'

# species -> body plan. Axial is the default vertebrate quadruped plan.
PLANS = {
    'human': 'bipedal',
    'chicken': 'avian', 'penguin': 'avian', 'vulture': 'avian', 'dodo': 'avian',
    'elephantbird': 'avian',
    'python': 'serpentine',
    'frog': 'axial', 'caecilian': 'serpentine',
    'shark': 'axial', 'salmon': 'axial', 'catfish': 'axial',
    'butterfly': 'insect', 'honeybee': 'insect', 'ant': 'insect',
    'beetle': 'insect', 'dragonfly': 'insect', 'grasshopper': 'insect',
    'seaurchin': 'radial',
}
DEFAULT_PLAN = 'axial'


def skeleton_bounds(species):
    """Read the existing skeleton manifest to fit organs inside the body."""
    for cand in (f'atlas-{species}.json', f'atlas-{species}-male.json'):
        p = MODELS / cand
        if p.exists():
            m = json.loads(p.read_text(encoding='utf-8'))
            b = [pt['bounds'] for pt in m.get('parts', []) if 'bounds' in pt]
            if b:
                mn = [min(x[0][a] for x in b) for a in range(3)]
                mx = [max(x[1][a] for x in b) for a in range(3)]
                return mn, mx
    # fallback: 1m box
    return [-0.5, 0, -0.5], [0.5, 1.0, 0.5]


def organs_axial(mn, mx):
    """Quadruped coelomic layout. Organs return as (name, system, verts, idx)."""
    L = [mx[a] - mn[a] for a in range(3)]       # body dimensions
    H = L[1]; W = L[0]; D = L[2]
    y0 = mn[1]
    # cranial end (assume -Z or +Z is head; use body quarter points)
    zc = (mn[2] + mx[2]) / 2
    chest_z = mn[2] + D * 0.32   # cranial third
    abdo_z = mn[2] + D * 0.58
    pelvic_z = mn[2] + D * 0.80
    cy = y0 + H * 0.45            # coelom mid-height
    out = []
    # heart (cranioventral, between lungs)
    v, i = P.ellipsoid((0, cy - H * 0.08, chest_z), (W * 0.13, H * 0.16, D * 0.06))
    out.append(('Heart', 'cardiac', v, i))
    # lungs (dorsolateral around heart)
    for sx in (-1, 1):
        v, i = P.ellipsoid((sx * W * 0.22, cy + H * 0.05, chest_z), (W * 0.16, H * 0.20, D * 0.10))
        out.append((('Left' if sx < 0 else 'Right') + ' lung', 'respiratory', v, i))
    # trachea
    v, i = P.tube([(0, cy + H * 0.2, mn[2] + D * 0.05), (0, cy + H * 0.1, chest_z)], W * 0.03, seg=10)
    out.append(('Trachea', 'respiratory', v, i))
    # liver (right, just caudal to diaphragm)
    v, i = P.ellipsoid((W * 0.12, cy, mn[2] + D * 0.44), (W * 0.20, H * 0.16, D * 0.09))
    out.append(('Liver', 'digestive', v, i))
    # stomach (left, cranial abdomen)
    v, i = P.ellipsoid((-W * 0.14, cy, mn[2] + D * 0.50), (W * 0.13, H * 0.15, D * 0.08))
    out.append(('Stomach', 'digestive', v, i))
    # intestines (mid-caudal coelom mass)
    v, i = P.ellipsoid((0, cy - H * 0.05, abdo_z + D * 0.05), (W * 0.22, H * 0.16, D * 0.13))
    out.append(('Intestines', 'digestive', v, i))
    # kidneys (dorsal, retroperitoneal, caudal abdomen)
    for sx in (-1, 1):
        v, i = P.ellipsoid((sx * W * 0.16, y0 + H * 0.72, abdo_z), (W * 0.07, H * 0.10, D * 0.05))
        out.append((('Left' if sx < 0 else 'Right') + ' kidney', 'urinary', v, i))
    # bladder (pelvic)
    v, i = P.ellipsoid((0, cy - H * 0.10, pelvic_z), (W * 0.09, H * 0.10, D * 0.05))
    out.append(('Urinary bladder', 'urinary', v, i))
    # brain (cranial vault = head end of skeleton)
    head_z = mn[2] + D * 0.06
    v, i = P.ellipsoid((0, y0 + H * 0.80, head_z), (W * 0.14, H * 0.14, D * 0.05))
    out.append(('Brain', 'nervous', v, i))
    # spinal cord
    v, i = P.tube([(0, y0 + H * 0.78, head_z), (0, y0 + H * 0.75, mx[2] - D * 0.05)], W * 0.025, seg=8)
    out.append(('Spinal cord', 'nervous', v, i))
    # spleen (left, near stomach)
    v, i = P.ellipsoid((-W * 0.20, cy, mn[2] + D * 0.46), (W * 0.06, H * 0.09, D * 0.05))
    out.append(('Spleen', 'lymphatic', v, i))
    return out


def organs_bipedal(mn, mx):
    L = [mx[a] - mn[a] for a in range(3)]
    H, W, D = L[1], L[0], L[2]
    y0 = mn[1]
    chest_y = y0 + H * 0.72
    abdo_y = y0 + H * 0.50
    head_y = y0 + H * 0.92
    out = []
    v, i = P.ellipsoid((0, chest_y, D * 0.10), (W * 0.11, H * 0.05, D * 0.12)); out.append(('Heart', 'cardiac', v, i))
    for sx in (-1, 1):
        v, i = P.ellipsoid((sx * W * 0.16, chest_y, 0), (W * 0.14, H * 0.06, D * 0.18))
        out.append((('Left' if sx < 0 else 'Right') + ' lung', 'respiratory', v, i))
    v, i = P.tube([(0, chest_y + H * 0.05, 0), (0, head_y - H * 0.04, 0)], W * 0.03); out.append(('Trachea', 'respiratory', v, i))
    v, i = P.ellipsoid((W * 0.10, abdo_y + H * 0.03, D * 0.06), (W * 0.16, H * 0.05, D * 0.16)); out.append(('Liver', 'digestive', v, i))
    v, i = P.ellipsoid((-W * 0.10, abdo_y, D * 0.06), (W * 0.10, H * 0.05, D * 0.12)); out.append(('Stomach', 'digestive', v, i))
    v, i = P.ellipsoid((0, abdo_y - H * 0.08, D * 0.05), (W * 0.18, H * 0.06, D * 0.16)); out.append(('Intestines', 'digestive', v, i))
    for sx in (-1, 1):
        v, i = P.ellipsoid((sx * W * 0.13, abdo_y + H * 0.04, -D * 0.08), (W * 0.06, H * 0.04, D * 0.08))
        out.append((('Left' if sx < 0 else 'Right') + ' kidney', 'urinary', v, i))
    v, i = P.ellipsoid((0, y0 + H * 0.30, D * 0.05), (W * 0.08, H * 0.04, D * 0.08)); out.append(('Urinary bladder', 'urinary', v, i))
    v, i = P.ellipsoid((0, head_y, 0), (W * 0.16, H * 0.05, D * 0.16)); out.append(('Brain', 'nervous', v, i))
    v, i = P.tube([(0, head_y - H * 0.03, -D * 0.03), (0, y0 + H * 0.18, -D * 0.05)], W * 0.025); out.append(('Spinal cord', 'nervous', v, i))
    v, i = P.ellipsoid((-W * 0.16, abdo_y + H * 0.05, 0), (W * 0.05, H * 0.03, D * 0.08)); out.append(('Spleen', 'lymphatic', v, i))
    return out


def organs_serpentine(mn, mx):
    """Staggered unpaired organs along an elongated column (long axis = Z)."""
    L = [mx[a] - mn[a] for a in range(3)]
    H, W, D = L[1], L[0], L[2]
    y0 = mn[1]; cy = y0 + H * 0.5
    out = []
    # heart ~ 25% from snout
    v, i = P.ellipsoid((0, cy, mn[2] + D * 0.25), (W * 0.20, H * 0.20, D * 0.02)); out.append(('Heart', 'cardiac', v, i))
    # single functional lung (right, elongated) + trachea
    v, i = P.ellipsoid((W * 0.1, cy, mn[2] + D * 0.40), (W * 0.18, H * 0.16, D * 0.16)); out.append(('Right lung', 'respiratory', v, i))
    v, i = P.tube([(0, cy, mn[2] + D * 0.10), (0, cy, mn[2] + D * 0.28)], W * 0.05); out.append(('Trachea', 'respiratory', v, i))
    # elongated liver
    v, i = P.ellipsoid((0, cy, mn[2] + D * 0.45), (W * 0.16, H * 0.14, D * 0.14)); out.append(('Liver', 'digestive', v, i))
    # stomach + intestine as staggered tubes
    v, i = P.ellipsoid((0, cy, mn[2] + D * 0.55), (W * 0.12, H * 0.12, D * 0.06)); out.append(('Stomach', 'digestive', v, i))
    v, i = P.tube([(0, cy, mn[2] + D * 0.60), (0, cy, mn[2] + D * 0.80)], W * 0.10); out.append(('Intestines', 'digestive', v, i))
    # staggered elongated kidneys
    for sx, zz in ((-1, 0.66), (1, 0.72)):
        v, i = P.ellipsoid((sx * W * 0.12, cy, mn[2] + D * zz), (W * 0.08, H * 0.08, D * 0.07))
        out.append((('Left' if sx < 0 else 'Right') + ' kidney', 'urinary', v, i))
    # brain
    v, i = P.ellipsoid((0, cy + H * 0.1, mn[2] + D * 0.03), (W * 0.16, H * 0.14, D * 0.02)); out.append(('Brain', 'nervous', v, i))
    v, i = P.tube([(0, cy, mn[2] + D * 0.05), (0, cy, mx[2] - D * 0.03)], W * 0.03); out.append(('Spinal cord', 'nervous', v, i))
    return out


def organs_avian(mn, mx):
    L = [mx[a] - mn[a] for a in range(3)]
    H, W, D = L[1], L[0], L[2]
    y0 = mn[1]; cy = y0 + H * 0.45; zc = mn[2] + D * 0.40
    out = []
    v, i = P.ellipsoid((0, cy - H * 0.05, zc), (W * 0.13, H * 0.12, D * 0.08)); out.append(('Heart', 'cardiac', v, i))
    for sx in (-1, 1):
        v, i = P.ellipsoid((sx * W * 0.18, cy + H * 0.05, zc + D * 0.05), (W * 0.15, H * 0.14, D * 0.10))
        out.append((('Left' if sx < 0 else 'Right') + ' lung', 'respiratory', v, i))
    # gizzard (muscular stomach) + proventriculus
    v, i = P.ellipsoid((0, cy - H * 0.08, mn[2] + D * 0.55), (W * 0.13, H * 0.12, D * 0.08)); out.append(('Gizzard', 'digestive', v, i))
    v, i = P.ellipsoid((0, cy, mn[2] + D * 0.48), (W * 0.08, H * 0.08, D * 0.06)); out.append(('Proventriculus', 'digestive', v, i))
    v, i = P.ellipsoid((W * 0.12, cy, mn[2] + D * 0.52), (W * 0.16, H * 0.12, D * 0.09)); out.append(('Liver', 'digestive', v, i))
    for sx in (-1, 1):
        v, i = P.ellipsoid((sx * W * 0.12, y0 + H * 0.68, mn[2] + D * 0.62), (W * 0.07, H * 0.09, D * 0.08))
        out.append((('Left' if sx < 0 else 'Right') + ' kidney', 'urinary', v, i))
    v, i = P.ellipsoid((0, y0 + H * 0.82, mn[2] + D * 0.10), (W * 0.14, H * 0.12, D * 0.05)); out.append(('Brain', 'nervous', v, i))
    return out


PLAN_FN = {
    'axial': organs_axial, 'bipedal': organs_bipedal,
    'serpentine': organs_serpentine, 'avian': organs_avian,
}


def build(species, plan=None):
    plan = plan or PLANS.get(species, DEFAULT_PLAN)
    if plan not in PLAN_FN:
        print(f'  {species}: no organ plan for "{plan}", skipping')
        return None
    mn, mx = skeleton_bounds(species)
    organs = PLAN_FN[plan](mn, mx)
    meshes = []
    for idx, (name, system, v, i) in enumerate(organs):
        meshes.append(Mesh(f'ORG_{species}_{idx}', name, system, v, i))
    return meshes


def main():
    targets = sys.argv[1:] or ['lion', 'mouse', 'chicken', 'python']
    for sp in targets:
        meshes = build(sp)
        if not meshes:
            continue
        out_sp = f'{sp}-organs'
        write_atlas(sp, meshes, version='KEV-Organ 1.0', out_species=out_sp,
                    source='KEV Procedural Organ Generator (teaching geometry)',
                    scope=f'{sp} organ systems - {len(meshes)} organs (procedural, not a scan)')
        print(f'  {sp}: {len(meshes)} organs -> atlas-{out_sp}.json')


if __name__ == '__main__':
    main()
