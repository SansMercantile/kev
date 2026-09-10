# Attribution: Human Atlas integration

The KEV Human Atlas and Immersive Lab anatomy subject use system vocabulary,
colors, and organ explanations adapted from the Human Atlas tool checked in at
`tools/human-atlas` (original application code: MIT License).

## Anatomy data

- **Source**: BodyParts3D 4.0, adult male reference anatomy, licensed **CC BY 4.0**.
- The lightweight KEV viewers use representative teaching geometry plus the
  15-system vocabulary and organ explanations. They do **not** embed the full
  2,234-mesh geometry.
- `public/models/atlas.json` (concept/part metadata, no geometry) is copied
  from the tool to power in-viewer concept search (3,432 named concepts).
- Full credits, source links, and adaptation details: `tools/human-atlas/public/ATTRIBUTION.md`.
- This is an educational explorer, not a diagnostic or surgical tool.

When redistributing KEV, preserve this attribution and the CC BY 4.0 terms
for the BodyParts3D-derived content.
