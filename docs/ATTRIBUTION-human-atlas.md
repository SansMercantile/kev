# Attribution: Human Atlas integration

The KEV Human Atlas and Immersive Lab anatomy subject use system vocabulary,
colors, organ explanations, and scene techniques adapted from the Human Atlas
tool checked in at `tools/human-atlas` (original application code: MIT
License, (c) ashemag).

## Anatomy data

- **Source**: BodyParts3D 4.0, adult male reference anatomy, licensed **CC BY 4.0**
  (Database Center for Life Science, https://bodyparts3d.org/).
- Since the 2026-09-15 owner decision (immersive-learning quality pass), KEV
  embeds the **full chunked geometry**: `public/models/atlas.json` (2,234
  part records + 3,432 named concepts + the chunk manifest) and the 15
  gzip-compressed geometry chunks `public/models/body-*.bin.gz` (~33MB
  total). Viewers stream the chunks on demand (DecompressionStream, three
  parallel workers) rather than shipping one large payload.
- The representative teaching boxes (`ANATOMY_PARTS` in
  `src/lib/anatomySystems.js`) remain in the codebase as the honest fallback
  when streaming or decompression is unavailable.
- Full credits and source links also appear in the tool's own
  `tools/human-atlas/public/ATTRIBUTION.md`.
- This is an educational explorer, not a diagnostic or surgical tool.

## Female anatomy

- **Source**: HuBMAP Human Reference Atlas Female v1.5, licensed **CC BY 4.0**
  (Kristen Browne & Heidi Schlehlein).
- `public/models/atlas-female.json` (888 parts, 10 optimized chunks, ~24MB
  gzipped). Same viewer, same streaming pipeline as the male atlas.

## Animal anatomy (pig)

- **Source**: Z-Anatomy "Models of veterinary anatomy", Z-PIG (Sus domestica),
  licensed **CC BY-SA 4.0** (Gauthier Kervyn, Marcin Zielinski, Lluis Vinent).
- Converted from Blender 4.x `.blend` via `tools/human-atlas/scripts/convert-zpig.py`
  (pure Python blendfile parser, no Blender install required).
- `public/models/atlas-pig.json` (119 skeletal parts, 9 chunks, ~23MB gzipped).
- French NAV nomenclature translated to English anatomical terms.

## Adapted MIT code

- `src/lib/studio/atlasScene.js` - chunk streaming, GPU part-state
  DataTextures with injected shaders, per-system geometry merging, two-phase
  explode into the inventory grid, isolate framing, hover/pick handling
  (adapted from the tool's `app/scene.tsx`).
- `src/lib/studio/explosionLayout.js` (`packCells`) - aspect-aware inventory
  packing (adapted from the tool's `app/explosion-layout.ts`).
- `src/lib/studio/useAtlasViewer.js` - React glue + fallback path.
- `src/lib/anatomySystems.js` - the 15-system vocabulary, colors and
  explanations (ported from the tool's `app/anatomy.ts`).
- `src/lib/pointerTap.js` - tap-vs-drag discriminator (ported from the tool's
  `app/pointer-tap.ts`).

When redistributing KEV, preserve this attribution, the MIT credit for the
adapted tool code, and the CC BY 4.0 terms for the BodyParts3D-derived
content.
