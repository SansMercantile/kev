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
