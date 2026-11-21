import sys, time, json
sys.path.insert(0, '.')
import importlib.util
spec = importlib.util.spec_from_file_location('gm', 'generate-multipart.py')
gm = importlib.util.module_from_spec(spec)
sys.modules['gm'] = gm
spec.loader.exec_module(gm)
from atlaswriter import write_atlas
from pathlib import Path

SRC = Path('_animal_src/digimorph')
# (species, stl basename, display) — skip sub-0.1MB stubs
SPECIES = [
    ('mouse','Mus_musculus','Mouse'), ('moose','Alces_alces','Moose'),
    ('alligator','Alligator_mississippiensis','American alligator'),
    ('penguin','Aptenodytes_forsteri','Penguin'), ('caecilian','Dermophis_mexicanus','Caecilian'),
    ('opossum','Didelphis_virginiana','Opossum'), ('elephant','Elephas_maximus','Elephant'),
    ('mongoose','Galerella_sanguinea','Mongoose'), ('giraffe','Giraffa_camelopardalis','Giraffe'),
    ('gilamonster','Heloderma_suspectum','Gila monster'), ('hyena','Hyaena_hyaena','Hyena'),
    ('leopardseal','Hydrurga_leptonyx','Leopard seal'), ('llama','Lama_glama','Llama'),
    ('thornydevil','Moloch_horridus','Thorny devil'), ('monkseal','Monachus_tropicalis','Monk seal'),
    ('platypus','Ornithorhynchus_anatinus','Platypus'), ('lion','Panthera_leo','Lion'),
    ('brownhyena','Parahyaena_brunnea','Brown hyena'), ('beardeddragon','Pogona_vitticeps','Bearded dragon'),
    ('hyrax','Procavia_capensis','Hyrax'), ('python','Python_molurus','Python'),
    ('tuatara','Sphenodon_punctatus','Tuatara'), ('bairdstapir','Tapirus_bairdii',"Baird's tapir"),
    ('asiantapir','Tapirus_indicus','Asian tapir'), ('tapir','Tapirus_terrestris','Tapir'),
    ('badger','Taxidea_taxus','Badger'), ('dolphin','Tursiops_truncatus','Dolphin'),
    ('bear','Ursus_americanus','Black bear'), ('polarbear','Ursus_maritimus','Polar bear'),
    ('chameleon','Chamaeleo_calyptratus','Chameleon'), ('elephantbird','Aepyornis_maximus','Elephant bird'),
    ('vulture','Coragyps_atratus','Black vulture'), ('crocodile','Crocodylus_moreletii','Crocodile'),
    ('cubancrocodile','Crocodylus_rhombifer','Cuban crocodile'), ('fox','Otocyon_male','Bat-eared fox'),
    ('hornedlizard','Phrynosoma_cornutum','Horned lizard'), ('mexicanhornedlizard','Phrynosoma_taurus','Mexican horned lizard'),
    ('gilamonsterjuvenile','Heloderma_suspectum_juv','Gila monster juvenile'),
]
ok, fail = [], []
for sp, base, disp in SPECIES:
    stl = SRC / f'{base}.stl'
    if not stl.exists() or stl.stat().st_size < 1000:
        fail.append((sp, 'no stl')); continue
    try:
        t0 = time.time()
        meshes = gm.build(sp, stl)
        if not meshes:
            fail.append((sp, 'no shells')); continue
        write_atlas(sp, meshes, version='KEV-MultiPart 1.0', out_species=f'{sp}-parts',
                    source='DigiMorph.org (UT Austin) CT + KEV Procedural labeling',
                    scope=f'{disp} skeleton - {len(meshes)} parts (real CT shells; fused axial mass noted)')
        ok.append((sp, len(meshes), round(time.time()-t0,1)))
        print(f'  OK {sp}: {len(meshes)} parts {round(time.time()-t0,1)}s', flush=True)
    except Exception as e:
        fail.append((sp, str(e)[:60])); print(f'  FAIL {sp}: {str(e)[:60]}', flush=True)
print(f'DONE ok={len(ok)} fail={len(fail)}')
for f in fail: print('  FAIL', f)
