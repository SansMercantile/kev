# Attribution: Model X Studio integration

The KEV Immersive Lab "Electric Vehicle Systems" subject adapts component
descriptions, principles, and specs from the Model X Studio tool checked in at
`tools/model-x-studio`.

- **3D asset** (`model-x.glb`, ~16.7MB, cgi Moon via BlendKit, Royalty Free):
  stays in `tools/` and is **not** redistributed in the KEV web bundle.
  Per its license the repository usage is private/embedded with no download UI.
- **Text adapted**: the 8 component entries (body, glass, doors, cabin,
  battery, drive, suspension, wheels) — descriptions, principles, specs, and
  links to the public Tesla Model X owner's manual.
- **Metadata copied**: `public/models/model-x-manifest.json` (334 piece
  labels/centers/sizes, no geometry) powers the in-viewer piece search.
- The 334 pieces are artist-authored mesh islands, not verified Tesla
  service-part identifiers. Battery, drive units, and suspension in KEV are
  illustrative teaching geometry.
- Validation notes and limits: `tools/model-x-studio/VALIDATION.md`.
