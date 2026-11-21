"""Download new DigiMorph STL species not yet on disk, then convert to atlases.

Real open-license CT data (DigiMorph.org, UT Austin). Only species not already
in the 42-STL library. Downloads are ~10-15 MB each.
"""
import urllib.request, sys, time
from pathlib import Path

SRC = Path('_animal_src/digimorph')
SRC.mkdir(parents=True, exist_ok=True)

# (species_key, DigiMorph dir, stl filename, display name)
NEW = [
    ('catfish2', 'Steindachneridion_scriptum', 'Steindachneridion.stl', 'Steindachneridion catfish'),
    ('earlessmonitor', 'Lanthanotus_borneensis', 'Lanthanotus.stl', 'Earless monitor lizard'),
    ('falsegharial', 'Tomistoma_schlegelii', 'Tomistoma.stl', 'False gharial'),
    ('fossilcroc', 'Calsoyasuchusvalliceps', 'Calsoyasuchus.stl', 'Calsoyasuchus (fossil croc)'),
    ('fossilplatypus', 'Obdurodon_dicksoni', 'Obdurodon.stl', 'Obdurodon (fossil platypus)'),
    ('oreodont', 'Bathygenys_reevesi', 'Bathygenys.stl', 'Bathygenys (oreodont)'),
    ('lionjuvenile', 'Panthera_leo/juvenile', 'Panthera_leo_juvenile.stl', 'Lion (juvenile)'),
    ('penguinjuvenile', 'Aptenodytes_forsteri/juvenile/whole', 'Aptenodytes_forsteri_juvenile.stl', 'Emperor penguin (juvenile)'),
]

BASE = 'https://digimorph.org/specimens'

def fetch(species, subdir, fname, display):
    url = f'{BASE}/{subdir}/{fname}'
    out = SRC / f'{species}_{fname}'
    if out.exists() and out.stat().st_size > 100000:
        print(f'  SKIP {species} (already {out.stat().st_size//1024} KB)')
        return out
    print(f'  GET {url}')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=120) as r, open(out, 'wb') as f:
            f.write(r.read())
        print(f'    -> {out.stat().st_size//1024} KB')
        return out
    except Exception as e:
        print(f'    FAIL {e}')
        if out.exists():
            out.unlink()
        return None

def main():
    ok = []
    for sp, sub, fn, disp in NEW:
        p = fetch(sp, sub, fn, disp)
        if p:
            ok.append((sp, p, disp))
        time.sleep(1)
    print(f'DOWNLOADED {len(ok)}/{len(NEW)}')
    for sp, p, disp in ok:
        print(f'  {sp}: {p.name}')

if __name__ == '__main__':
    main()
