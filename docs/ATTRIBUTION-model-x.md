# Attribution: Model X Studio integration

The KEV Immersive Lab "Electric Vehicle Systems" subject adapts component
descriptions, principles, specs, and rendering techniques from the Model X
Studio tool checked in at `tools/model-x-studio`.

- **3D asset** (`model-x.glb`, ~16.7MB, cgi Moon via BlendKit, Royalty Free):
  since the 2026-09-15 owner decision (immersive-learning quality pass), the
  GLB is **embedded in the KEV web bundle** at `public/models/model-x.glb` so
  the Immersive Lab renders the real 334-piece vehicle. The license permits
  private/embedded use with **no download UI** - KEV offers no download of the
  asset anywhere, and `tools/attribution-check` enforces both rules (the GLB
  may exist only at that path; any download-style UI fails the gate).
- **Metadata copied**: `public/models/model-x-manifest.json` (334 piece
  labels/centers/sizes, no geometry) powers the in-viewer piece search and
  piece-level inspection.
- **Techniques adapted**: the studio rendering recipe in
  `src/lib/studio/vehicleScene.js` (IBL via PMREM/RoomEnvironment, ACES filmic
  tone mapping, three-point lighting, PCF soft shadows, two-phase damped
  explosion with projected-bounds packing and automatic camera framing,
  numbered DOM labels/markers, transmission-glass conversion, illustrative
  battery/drive/suspension teaching geometry) mirrors the tool's
  `vehicle-scene.tsx`.
- The 334 pieces are artist-authored mesh islands, not verified Tesla
  service-part identifiers. Battery, drive units, and suspension in KEV are
  illustrative teaching geometry. Not affiliated with Tesla.
- Validation notes and limits: `tools/model-x-studio/VALIDATION.md`.
