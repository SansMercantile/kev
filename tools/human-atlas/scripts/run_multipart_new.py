import sys, time, importlib.util
sys.path.insert(0, '.')
spec = importlib.util.spec_from_file_location('gm', 'generate-multipart.py')
gm = importlib.util.module_from_spec(spec); sys.modules['gm'] = gm; spec.loader.exec_module(gm)
from atlaswriter import write_atlas
from pathlib import Path

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
for sp, fname, disp in NEW:
    stl = SRC / fname
    if not stl.exists():
        continue
    t0 = time.time()
    meshes = gm.build(sp, stl)
    if not meshes:
        print(f'  FAIL {sp}'); continue
    write_atlas(sp, meshes, version='KEV-MultiPart 1.0', out_species=f'{sp}-parts',
                source='DigiMorph.org (UT Austin) CT + KEV Procedural labeling',
                scope=f'{disp} skeleton - {len(meshes)} parts (real CT shells; fused axial mass noted)')
    print(f'  OK {sp}: {len(meshes)} parts {round(time.time()-t0,1)}s', flush=True)
print('DONE')
