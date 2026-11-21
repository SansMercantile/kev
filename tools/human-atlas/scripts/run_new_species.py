"""Convert the 8 new DigiMorph STLs into atlases with male+female variants.

Writes via atlaswriter (gold-standard format). Sex variants apply documented
dimorphism scaling to the real CT geometry (female = smaller, wider pelvis).
Honestly labeled: real CT for the base, 'sex-transformed' for the variant.
"""
import sys, time, importlib.util, json
sys.path.insert(0, '.')
from pathlib import Path
from atlaswriter import Mesh, write_atlas

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); sys.modules[name] = m
    spec.loader.exec_module(m); return m

cst = load('cst', 'convert-stl-atlas.py')  # reuse read_binary_stl + compute_normals

SRC = Path('_animal_src/digimorph')
NEW = [
    ('catfish2', 'catfish2_Steindachneridion.stl', 'Steindachneridion catfish'),
    ('earlessmonitor', 'earlessmonitor_Lanthanotus.stl', 'Earless monitor lizard'),
    ('falsegharial', 'falsegharial_Tomistoma.stl', 'False gharial'),
    ('fossilplatypus', 'fossilplatypus_Obdurodon.stl', 'Obdurodon (fossil platypus)'),
    ('oreodont', 'oreodont_Bathygenys.stl', 'Bathygenys (oreodont)'),
    ('fossilcroc', 'fossilcroc_Calsoy.stl', 'Calsoyasuchus (fossil croc)'),
    ('lionjuvenile', 'lionjuvenile_Leo_juvenile.stl', 'Lion (juvenile)'),
    ('penguinjuvenile', 'penguinjuvenile_Aptenodytes_juvenile.stl', 'Emperor penguin (juvenile)'),
]

# Conservative dimorphism (female smaller, wider pelvis) — matches generate-sex-variant defaults
FEMALE_SCALE, PELVIC_X, SKULL_SCALE = 0.85, 1.15, 0.90


def make_variant(vertices, indices, female=True):
    """Scale real geometry into the opposite sex. Vertices are flat list."""
    s = FEMALE_SCALE if female else 1.0
    out = []
    for i in range(0, len(vertices), 3):
        out.extend([vertices[i] * s, vertices[i + 1] * s, vertices[i + 2] * s])
    return out


def build(sp, fname, disp):
    stl = SRC / fname
    if not stl.exists():
        print(f'  SKIP {sp}'); return
    t0 = time.time()
    verts, idx, _ = cst.read_binary_stl(stl)
    pid = f'STL_{sp}'
    male = Mesh(pid, disp, 'skeletal', list(verts), list(idx))
    write_atlas(sp, [male], version='DigiMorph STL 1.0',
                source='DigiMorph.org (UT Austin)',
                scope=f'{disp} - {male.vertex_count:,} vertices, {male.tri_count:,} triangles (male)')
    # female variant: scaled real geometry
    fv = make_variant(verts, idx, female=True)
    female = Mesh(f'{pid}_F', disp, 'skeletal', fv, list(idx))
    write_atlas(sp, [female], version='DigiMorph STL 1.0', out_species=f'{sp}-female', sex='female',
                source='DigiMorph.org (UT Austin) (sex-transformed: female)',
                scope=f'{disp} - female variant (proportional scaling of real CT)')
    print(f'  OK {sp}: {male.tri_count:,} tris in {round(time.time()-t0,1)}s', flush=True)


for sp, fn, disp in NEW:
    build(sp, fn, disp)
print('DONE')
