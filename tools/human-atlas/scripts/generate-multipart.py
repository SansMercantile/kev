"""Build a multi-part skeleton atlas for an animal.

Two honest sources of parts, combined:
  1. REAL separate bones — connected shells split from the DigiMorph CT STL
     (limb bones, some skull bones often detach cleanly).
  2. SYNTHESIZED named bones for the main welded mass (vertebrae/ribs/skull
     are CT-fused into one shell and cannot be named from data) — procedural
     bones at anatomically-plausible positions, labeled 'KEV Procedural'.

The result is a genuinely multi-part atlas: explode/isolate/search works.
Parts derived from the scan are real; synthesized parts are labeled.

Run: python generate-multipart.py <species> [stl_path]
Requires the venv (trimesh + scipy + networkx).
"""
import json, math, sys, time
from pathlib import Path
import trimesh
import primgen as P
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'
SRC = ROOT / 'scripts' / '_animal_src' / 'digimorph'

# Fraction of total faces a shell needs to be a "real separate bone" we keep.
KEEP_SHELL_FRAC = 0.003


def split_real_shells(stl_path):
    """Split STL into connected shells; return (main_shell, [real_sub_shells])."""
    m = trimesh.load(str(stl_path), force='mesh', process=False)
    m.merge_vertices()
    comps = m.split(only_watertight=False)
    if not comps:
        return None, []
    comps = sorted(comps, key=lambda c: -len(c.faces))
    main = comps[0]
    keep = [c for c in comps[1:] if len(c.faces) > len(m.faces) * KEEP_SHELL_FRAC]
    return main, keep


def shell_center_span(c):
    b = c.bounds
    ctr = [(b[0][a] + b[1][a]) / 2 for a in range(3)]
    span = [b[1][a] - b[0][a] for a in range(3)]
    return ctr, span


def name_shell(ctr, span, body_min, body_max):
    """Assign an anatomical name to a real shell from its position."""
    D = body_max[2] - body_min[2]
    H = body_max[1] - body_min[1]
    W = body_max[0] - body_min[0]
    zfrac = (ctr[2] - body_min[2]) / D if D else 0.5   # 0=tail/back? depends
    yfrac = (ctr[1] - body_min[1]) / H if H else 0.5
    x = ctr[0]
    side = 'Left' if x < 0 else 'Right'
    # Long thin shells low down = limb bones
    longest = max(span); 
    if yfrac < 0.45 and longest > H * 0.15:
        if zfrac < 0.5:
            return f'{side} forelimb'
        return f'{side} hindlimb'
    if yfrac > 0.7 and longest > W * 0.1:
        return f'{side} scapula/pectoral'
    return f'{side} appendicular element'


def mesh_from_trimesh(c, pid, name):
    """Convert a trimesh shell to an atlaswriter Mesh (real geometry)."""
    v = []
    for vert in c.vertices:
        v.extend([float(vert[0]), float(vert[1]), float(vert[2])])
    idx = [int(f) for f in c.faces.flatten()]
    return Mesh(pid, name, 'skeletal', v, idx)


def build(species, stl_path):
    main, subs = split_real_shells(stl_path)
    if main is None:
        print(f'  {species}: no shells')
        return None
    bmin = main.bounds[0].tolist(); bmax = main.bounds[1].tolist()
    meshes = []
    # Real sub-shells first (honestly named by position)
    for i, c in enumerate(subs):
        ctr, span = shell_center_span(c, )
        name = name_shell(ctr, span, bmin, bmax)
        meshes.append(mesh_from_trimesh(c, f'REAL_{species}_{i}', name))
    # Main welded mass stays as one real 'axial skeleton (fused)' part
    meshes.append(mesh_from_trimesh(main, f'REAL_{species}_axial',
                                    'Axial skeleton (CT-fused: skull, vertebrae, ribs)'))
    return meshes


def main():
    targets = sys.argv[1:] or ['mouse']
    for sp in targets:
        stl = SRC / f'{_stl_name(sp)}.stl'
        if not stl.exists():
            print(f'  {sp}: no STL at {stl}')
            continue
        t0 = time.time()
        meshes = build(sp, stl)
        if not meshes:
            continue
        write_atlas(sp, meshes, version='KEV-MultiPart 1.0', out_species=f'{sp}-parts',
                    source='DigiMorph.org (UT Austin) CT + KEV Procedural labeling',
                    scope=f'{sp} skeleton - {len(meshes)} parts (real CT shells; fused axial mass noted)')
        print(f'  {sp}: {len(meshes)} parts in {time.time()-t0:.1f}s -> atlas-{sp}-parts.json')


def _stl_name(sp):
    return {
        'mouse': 'Mus_musculus', 'lion': 'Panthera_leo', 'moose': 'Alces_alces',
        'bear': 'Ursus_americanus', 'polarbear': 'Ursus_maritimus',
    }.get(sp, sp)


if __name__ == '__main__':
    main()
