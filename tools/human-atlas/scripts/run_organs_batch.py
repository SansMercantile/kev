import sys, time
sys.path.insert(0, '.')
import importlib.util
spec = importlib.util.spec_from_file_location('go', 'generate-organs.py')
go = importlib.util.module_from_spec(spec)
sys.modules['go'] = go
spec.loader.exec_module(go)

from atlaswriter import write_atlas

axial = ['lion','mouse','bear','elephant','giraffe','dog','cat','horse','cow','hyena',
         'opossum','polarbear','tapir','llama','platypus','hyrax','moose','mongoose',
         'leopardseal','badger','fox','brownhyena','monkseal','asiantapir','bairdstapir',
         'dolphin','crocodile','alligator','chameleon','gilamonster','thornydevil',
         'tuatara','beardeddragon','hornedlizard','trex','velociraptor','mammoth',
         'smilodon','woollyrhino','giantsloth','frog','shark','salmon','catfish','pig']
avian = ['chicken','penguin','vulture','dodo','elephantbird']
serp = ['python','caecilian']

done, fails = 0, []
for sp in axial + avian + serp:
    meshes = go.build(sp)
    if not meshes:
        fails.append(sp); continue
    write_atlas(sp, meshes, version='KEV-Organ 1.0', out_species=f'{sp}-organs',
                source='KEV Procedural Organ Generator (teaching geometry)',
                scope=f'{sp} organ systems - {len(meshes)} organs (procedural, not a scan)')
    done += 1
    print(f'  {sp}: {len(meshes)} organs', flush=True)
print(f'DONE organs={done} fails={fails}')
