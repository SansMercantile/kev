# attribution-check

License/attribution compliance gate for the two vendored atlas assets (M0 of
`docs/KEV_TOOLS_ROADMAP.md`): **Model X Studio** (private/embedded GLB,
adapted component text) and **Human Atlas** (BodyParts3D 4.0, **CC BY 4.0**).

```sh
node check.cjs     # or: npm run attribution:check (from kev/)
```

What it enforces:

1. `docs/ATTRIBUTION-model-x.md` and `docs/ATTRIBUTION-human-atlas.md` exist.
2. No redistributable geometry in the bundle inputs: no `*.glb` under
   `public/`, no source reference to `model-x.glb` or the full 2,234-mesh
   BodyParts3D set.
3. `src/lib/immersiveSubjects.js` carries both attribution strings and points
   at the docs.
4. Every compiled pack entry carries its attribution (`atlas-*` → CC BY 4.0,
   `modelx-*` → Model X Studio, anatomy/vehicle study kits → both).
5. No download UI for either asset (license: private/embedded).

Runs without a backend, in CI or pre-commit; exit 1 lists every violation.
