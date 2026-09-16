# KEV Tools Roadmap

**Scope:** the `kev/tools/` directory, the discipline expansion it should serve,
and the maximum-use plan for the two vendored external assets — **Model X
Studio** and **Human Atlas**.

**Status anchors:** science programmes shipped in `db02031` (Twin Challenge,
Biome Recon, Sketch-to-Simulation, adaptive tiers); Auth0 spec in `989055d`;
consolidation in `91e7c13`. This roadmap extends those engines across all 14
disciplines and both atlas assets without deleting anything.

---

## 0. What exists today

### `kev/tools/` — one tool

`tools/kev-api-client/` (README + `fetch-openapi.cjs` + package.json): fetches
the live FastAPI OpenAPI spec and generates a `typescript-fetch` client.

Gaps:
- `api-build` requires **Java** (`openapi-generator-cli`); `kev/package.json`'s
  `api:client` only runs the fetch half — `src/generated/api/` has never existed.
- Generation scoped to `apis=Core`; the real surface is `/xr/*`, `/vr/*`,
  `/library/*`, agents, curriculum, and the new programme routes
  (`/xr/challenges|biome|tiers|briefs|curriculum/summarize`).
- `src/lib/xrClient.ts` stays hand-maintained with **no drift detection**.
- The referenced pattern `tools/fastapi-typescript` is not in this repository.

### Model X Studio — adapted into KEV

Per `docs/ATTRIBUTION-model-x.md`:
- Powers the Immersive Lab **"Electric Vehicle Systems"** subject
  (`src/lib/immersiveSubjects.js` → `vehicle`): 8 component entries (body,
  glass, doors, cabin, battery, drive, suspension, wheels) with descriptions,
  principles, specs and Tesla owner's-manual links; 5 colour-coded systems
  (exterior, interior, energy, powertrain, chassis); tutor `dr-ward`, floor 3.
- `public/models/model-x-manifest.json` (127 KB): **334 pieces with label,
  system, center XYZ, size XYZ and face counts** — powers in-viewer piece search.
- License constraints: the 16.7 MB `model-x.glb` stays in the source project's
  `tools/` and is **not redistributed**; no download UI; geometry in KEV is
  illustrative teaching geometry; pieces are artist-authored mesh islands, not
  verified Tesla service-part IDs.

### Human Atlas — adapted into KEV

Per `docs/ATTRIBUTION-human-atlas.md`:
- Powers the **"Human Atlas"** immersive subject (`anatomy`: 15-system
  vocabulary + organ explanations from `src/lib/anatomySystems.js`, tutor
  `dr-vance`, floor 4) and `src/pages/AnatomyLab.jsx` (system isolation,
  explode slider, piece counts).
- `public/models/atlas.json` (1.3 MB): **BodyParts3D 4.0 metadata for 3,432
  named concepts — each with id, name, FMA conceptId, system, and 3D bounds
  (min/max XYZ)** — powers concept search. The full 2,234-mesh geometry is
  deliberately **not** embedded.
- License constraints: BodyParts3D data is **CC BY 4.0** (attribution must
  travel with every derivative surface); original app code MIT; educational
  explorer only — never diagnostic/surgical framing.

**Honest note:** the tool directories themselves (`tools/model-x-studio` with
`VALIDATION.md` and the GLB; `tools/human-atlas` with the full atlas app) are
**not checked into this repository** — only the attributions, the manifests and
the adapted subject content are. Everything below works from what is in-repo;
if the original tool checkouts are available locally, re-vendoring them under
`tools/` (per their licenses) unlocks the optional items marked **[RV]**.

---

## T-track — tools suite across the 14 disciplines

Canonical disciplines (`SUBJECT_AREA_ORDER`): Social Studies, Languages, Music,
Physical Education, Arts, Drama, Mathematics, English, Science, Computer
Science, Vocational, Business, Health, Emerging Fields.

Principle: **discipline-agnostic engines + per-discipline data packs.** The
scorers (`_param_score` tolerance bands, `_description_score` keyTerm coverage),
`study_kit`, the sketch recogniser and the mission checker are already generic;
tools compile/validate per-discipline packs into them.

### T1 — finish the infrastructure tool (no new engines)
- `kev-api-client` v2: pure-Node generator (`openapi-typescript`), all API
  groups + models, spec snapshot committed for drift detection.
- `spec-drift`: diff committed `openapi.json` vs live backend; fail when
  `xrClient`/`xrApi` paths go stale (this class of bug — frontend expecting
  `targetLab` while backend ships `lab` — already happened once).
- Tools-dir conventions: every tool = self-contained folder (README +
  package.json), deterministic, testable, zero frontend runtime impact.

### T2 — pack schema + validators
- `challenge-packs`: YAML → validated Twin-Challenge catalogues (params,
  tolerance bands, keyTerms, target lab). Port the 8 existing science targets
  into packs to prove the pipeline.
- `study-kit-packs`: LAB_FACTS-shaped packs (keyTerms, facts, summary) × 4
  tiers × discipline, feeding `/xr/briefs` unchanged.
- `sketch-grammars`: declarative recogniser archetypes (today: molecules,
  prism rays, orbits, cells, circuits).
- `mission-packs`: field missions generalised from the solar-navigation math.
- One new scorer needed beyond the current engine: `_order_score` for sequence
  challenges (timelines, code steps, choreography).

### T3 — first four disciplines beyond Science
Mathematics (function-graph twins), Music (interval/ratio tuning), Business
(balance-sheet tolerance balancing), Languages (diacritic/word-order assembly
— the keyTerm scorer already covers the lexical half).

### T4 — remaining disciplines + school-wide validators
Social Studies (timeline ordering, map calibration — reuse solar geometry),
Health (dosage/heart-rate zones), PE (projectile twins via Physics Playground),
CS (truth tables), Arts/Drama (RGB colour twins, cue timing), English
(scansion), Vocational (measurement fits), Emerging Fields (ethics briefs).
Plus: `curriculum-validator` (all 14 disciplines have floors/wings/rooms;
cohort gating), `agent-catalog-sync` (role coverage per discipline across the
872 agents), `i18n-glossary` (per-discipline terms across 11 locales),
`claims-mock` (Auth0 role/cohort claim matrices for the SWAP-POINT readers).

---

## M-track — maximum use of Model X Studio and Human Atlas

The manifests are not just search indexes: **atlas bounds and piece
centers/sizes are ground-truth 3D targets**, which is exactly what the Twin
Challenge engine consumes. This track turns both assets from "one Immersive
Lab subject each" into school-wide infrastructure.

### M0 — compliance + inventory (gate for everything below)
- `attribution-check` tool: assert every derivative surface (challenge UI,
  study-kit PDF, sketch notebook export, curriculum pages) carries the CC BY
  4.0 / Model X attribution strings; assert no GLB or full-mesh geometry is
  referenced from `public/`; assert no download UI exists for either asset.
- **[RV]** If original tool checkouts are available: re-vendor under `tools/`,
  restore `VALIDATION.md` links, and record which extras (full-mesh local
  viewer, validation harness) become available offline-only.

### M1 — manifest-challenge-pack compiler (highest leverage)
Compile both manifests into daily Twin-Challenge catalogues with **zero new
scoring code**:
- **Anatomy localization**: target = center of a concept's `bounds`,
  tolerance = f(bounds size); student places a marker in the bench and/or
  writes the identification. keyTerms = name + system (+ `conceptId` FMA
  vocabulary at research tier). 3,432 concepts ⇒ years of daily challenges.
- **Vehicle piece calibration**: target = piece `center`/`size` from
  model-x-manifest; "locate the falcon-wing hinge", "size the battery tray";
  keyTerms = label + system + the 8 adapted component principles.
- XP banks into the same weekly Study-Goal ledger (cap 500) as science.
- Delivered as the first two packs through T2's `challenge-packs` pipeline —
  this is the proof that the pack compiler generalises beyond science.

### M2 — study kits for both assets
- `anatomy` and `vehicle` packs through `study-kit-packs`: keyTerms from the
  15 systems / 5 vehicle systems, facts from the adapted organ explanations
  and component principles, summaries at all 4 tiers (research tier cites FMA
  concept IDs; foundational tier glosses every organ name).
- Printable PDF + Google-Forms CSV inherit attribution footers from M0.

### M3 — sketch grammars for both assets
- Anatomy: organ-silhouette archetypes → system identification (heart →
  circulatory, lung → respiratory) feeding the biology bench.
- Vehicle: piece-profile archetypes (wheel, door, battery tray) → system
  highlight in the EV subject.

### M4 — XR Academy integration + wiring fix
- **Fix the mis-wire**: `vehicle.labId` currently points at `'optics'`
  (floor 3) — an EV subject should open an EV/Physics bench, not the optics
  lab. Route it to the Physics Playground or a dedicated vocational bench.
- Step-by-step lab guides (`labGuides.ts`) for the AnatomyLab controls
  (system isolation → explode slider → concept search) and the Immersive Lab
  vehicle controls, same data-guide pattern as the four science labs.
- Cross-links: floor 4 biology / floor 3 facilities already exist in the XR
  campus; wire Immersive Lab deep-links from those floors and from
  `CourseViewer` lessons.

### M5 — curriculum + tutor wiring
- `dr-vance` (anatomy) and `dr-ward` (vehicle) faculty prompts receive the
  adaptive `tier` guidance already injected for Professor KEV.
- Curriculum classes/lessons referencing Human Atlas and EV Systems get
  Paper-Summarizer-style briefs (paste owner's-manual/BodyParts3D references).

### M6 — discipline spill-over (the "atlas pattern" as a template)
The manifest-driven pattern (bounds/centers → challenges, vocabulary →
keyTerms, systems → study kits) generalises to the other three immersive
subjects (plants, engineering, earth) and to T4 disciplines — Social Studies
map calibration and Health anatomy both consume atlas.json directly.

---

## Integrated phasing

| Phase | Contents | Gates | Status |
|---|---|---|---|
| P1 | T1 + M0 | pytest, tsc, `attribution-check` green | **Delivered** - `kev-api-client` v2 (pure Node, no Java; `src/generated/api/` committed), `spec-drift`, `attribution-check` |
| P2 | T2 + M1 + M4 wiring fix | pack validator tests; challenge flow smoke | **Delivered** - `challenge-packs` compiler + `--check` drift gate; 12 anatomy + 10 vehicle challenges compiled from the manifests; `vehicle.labId` fixed to Physics Playground |
| P3 | T3 + M2 + M3 | verify:campus, i18n parity, kit PDF attribution | **Delivered (complete)** - seed packs for Mathematics, Music, Business, Health; anatomy + vehicle study kits with attribution in UI/PDF; music-staff sketch grammar (first wave); Languages via the P4 order engine; anatomy/vehicle sketch grammars landed in the P4 second wave |
| P4 | T4 + M5 + M6 | full suite + coverage report per discipline | **Delivered (complete)** - order engine (`_order_score`, `kind`/`itemLabels` contract, order targets kept server-side); 3 order + 6 numeric T4 seed packs (all 14 disciplines now covered); plants/engineering/earth study kits (M6, 5 kits total); tier wiring through `TutorAskPanel`/`xrClient` into the dr-vance, dr-ward and Professor KEV prompts plus discipline-aware Paper-Summarizer briefs for atlas/EV references (M5); school-wide validators `curriculum-validator`, `agent-catalog-sync`, `i18n-glossary`, `claims-mock` (T4); body-outline + vehicle-profile sketch grammars driving the Immersive Lab benches (M3 remainder) |

### Delivered artefacts (P1-P3)

- Tools: `tools/kev-api-client/` (fetch + generate), `tools/spec-drift/`,
  `tools/challenge-packs/` (compile + `--check`), `tools/attribution-check/`
- Generated: `src/generated/api/{openapi.json,types.ts,client.ts}` (44 typed
  methods over the `/xr/*` surface, 18 schemas)
- Packs: `backend/packs/{challenge_packs.json,study_kit_packs.json}` merged at
  import by `science_programs.load_packs()` (idempotent, hand-authored wins)
- npm scripts: `api:client`, `api:drift`, `packs:compile`, `packs:check`,
  `attribution:check`
- Tests: `tests/test_pack_challenges.py` (manifest targets match bounds/centers,
  attribution travels, idempotent merge, end-to-end routes)

### Delivered artefacts (P4)

- Order engine: `science_programs._order_score` (exact slot = 100, off-by-one =
  40, else 0), `kind`/`itemLabels` published by `/xr/challenges/daily`;
  **order targets are never published** - daily payloads carry them for tune
  (calibration) only, and a rotation-wide test pins the contract.
  `TwinChallengeView` renders slot pickers and reports "% placed", never the
  answer key.
- Seeds: `challenges-order.json` (Social Studies SA democracy timeline,
  Languages Spanish word order, CS algorithm steps) and `challenges-t4.json`
  (Arts colour mix, Vocational machining fit, PE projectile range, English
  iambic scansion, Emerging secure defaults, Drama lighting cue) - 35 compiled
  challenges; `study-{plants,engineering,earth}.json` - 5 compiled study kits,
  all five immersive subjects keyed in `ImmersiveLab`.
- M5 tier wiring: `askTutor`/`askLabTutor` accept `tier`; `TutorAskPanel`
  sends the shared science-tier selection to both faculty (`dr-vance`,
  `dr-ward`, ...) and Professor KEV, whose prompts already injected
  `tier_tutor_guidance`.
- Validators (T4): `tools/curriculum-validator/` (14 disciplines staffed,
  housed, cohort-gated; both level vocabularies accepted),
  `tools/agent-catalog-sync/` (per-discipline role coverage over the 872-agent
  index, casing anomalies noted), `tools/i18n-glossary/` (key-group parity +
  curated `glossary.json` of must-translate safeguarding/discipline strings +
  per-locale coverage report), `tools/claims-mock/` (13-fixture Auth0 claim
  matrix run through the `teaching_roles` SWAP-POINT readers; `--emit` writes
  fixtures for the day the tenant Action lands).
- npm scripts: `curriculum:validate`, `agents:report`, `i18n:glossary`,
  `claims:mock`, and `gates` - one command that runs the full release
  battery (typecheck, i18n parity + glossary, pack drift, attribution,
  spec drift, curriculum, agent coverage, claim matrix, pytest, campus
  scene verification).
- Tests: `tests/test_pack_challenges.py` grows to 12 (order scoring, T4
  perfect-score matrix, 5 attributed kits, daily-rotation kinds, order-target
  leak guard); suite total 150.

### Delivered artefacts (P4 second wave - the deferred remainder)

- Sketch grammars (M3 remainder): `sketchRecognizer` gains `body-outline`
  (tall closed torso + head circle above -> Human Atlas, opens at the
  skeletal system) and `vehicle-profile` (wide closed body + two spread
  wheels below -> EV Systems bench, exploded 35%). Both are checked before
  the `round` branch - a tall torso ellipse is round enough to be mistaken
  for a cell/orbit otherwise. Verified against synthetic strokes with no
  regression to circle/cell/staff/prism/molecule paths.
- Bench wiring: `SketchBench.onOpenLab` now carries the action; XRAcademyApp
  routes `anatomy`/`vehicle` recognitions to `/anatomy` (ImmersiveLab) via
  `useNavigate`, stashing the action in `sessionStorage`
  (`kev:immersive-lab-load`) because the `kev:lab-load` window event fires
  before the page mounts. ImmersiveLab consumes the stash on mount, listens
  live, and mounts its own SketchBench (toolbar "Sketch pad" toggle) so the
  grammars are usable at the benches themselves.
- Discipline-aware summariser (M5 second bullet): `summarize_text` detects
  `human-atlas` (BodyParts3D/anatomy vocabulary) and `ev-systems`
  (owner's-manual/powertrain vocabulary) references - two distinct hits
  required, so one stray word never re-routes a summary - and returns a
  discipline brief as `note` (with the CC BY 4.0 / Model X Studio
  attribution reminders and the honest-geometry caveats), `discipline` and
  `disciplineLabel`; matched domain terms join `keyConcepts`.
  `/xr/curriculum/summarize` publishes both fields; PaperSummarizer renders
  a discipline chip above the brief.
- Tests: `tests/test_summarizer_disciplines.py` (5: atlas brief + attribution,
  EV brief + mesh-islands caveat, generic prose stays generic, single stray
  word below the bar, route publishes discipline); suite total 155.
- Follow-up fix the validators earned their keep on: `agent-catalog-sync`
  flagged `elem_arithmetic_001` as the only lowercase role in the 872-agent
  catalog (a legacy raw string `"teacher"` in a `tutors/` file); it now
  declares `TutorType.TUTOR` like every sibling, and role totals are
  symmetric (tutor 175 / expert 175 / teacher 174 / invigilator 174 /
  mentor 174, zero casing anomalies).

### Delivered artefacts (P5 wave 1 - Pulse Lab / PPG engine)

- Concept provenance (integrity first): inspired by the interactive PPG
  waveform simulator Plethscape (chatppg.com). No code or copy was reused -
  it is proprietary. KEV implements its own deterministic model of standard
  pulse-oximetry physiology; the anatomy anchoring reuses the BodyParts3D
  atlas KEV already licenses and attributes (docs/ATTRIBUTION-human-atlas.md,
  CC BY 4.0). Educational payloads: waveform morphology (systolic peak,
  dicrotic notch, diastolic decay), AC/DC components, perfusion index,
  transmission vs reflectance, why green LEDs, motion artefact, respiratory
  wander, and melanin/SNR equity taught honestly.
- Engine: `backend/core/pleth_engine.py` - deterministic (zero RNG; motion
  artefact is three fixed-phase sinusoids), 50 Hz x 8 s = 400 samples,
  1.0 DC pedestal + AC beat. Beat shape: systolic Gaussian at 20% of the
  cycle + diastolic re-reflection at 64% (amplitude 0.30 + 0.45 x
  compliance) - dicrotic notch at 45% (depth scales with compliance).
  Respiration adds 10% baseline wander + 6% amplitude modulation.
- Optics: 7 wearable sites (finger, wrist, earlobe, temple, carotid, upper
  arm, great toe) x 3 wavelengths (green/red/infrared). AC amplitude =
  haemoglobin absorption x Gaussian depth-match (sigma 0.55) x site
  perfusion x mode factor (transmission 1.15 / reflectance 1.0) x
  perfusion%. Fitzpatrick I-VI scales reflectance-mode AC (-5%/step) and
  noise (+9%/step) - the documented pulse-oximetry equity gap, stated
  explicitly; transmission sites barely change (1%). Each site carries an
  honest BodyParts3D arterial anchor - including the earlobe's `null`
  (capillary bed, no named artery) rather than an invented one.
- Metrics: perfusion index (peak-to-peak AC / mean x 100), signal quality
  (beat RMS vs noise RMS), diastolic ratio (deliberately NOT called an
  augmentation index - clinical AI moves the opposite way with stiffness
  and we do not claim it), notch depth, sensing mode. All inputs clamped to
  physiological LIMITS (HR 40-180, perfusion 20-200, compliance 0-100,
  respiration 6-30, motion 0-100, tone 1-6).
- Routes (open, matching the challenge endpoints): GET `/xr/pleth/sites`
  (site atlas, wavelengths, limits, defaults, disclaimer) and POST
  `/xr/pleth/simulate` (samples + metrics + disclaimer).
- Twins: `seeds/challenges-pleth.json` adds two tune twins through the pack
  pipeline - `health-ppg-finger-clip` (transmission/red; HR 72±4, perfusion
  110±12, compliance 75±9) and `health-ppg-wrist-watch`
  (reflectance/green; HR 88±4, perfusion 60±8, motion 35±9). `compile.cjs`
  validates pulse contexts against the engine whitelists (unknown site or
  wavelength fails the build). Pack total: 37. `daily_challenge` now passes
  `context` through (null for every non-pulse challenge), so daily rotation
  is untouched.
- Frontend: `PlethStrip.tsx` canvas strip-chart - solid cyan student trace,
  dashed amber published target, one shared honest y-scale, 300 ms
  debounce; the server is the only waveform generator, so the client draws
  exactly what gets scored. `PulseLabView.tsx` exploration bench: site
  chips, wavelength segmented control, six physiology sliders, "reading the
  trace" card, per-site atlas anchor card, wavelength rationale, melanin/SNR
  equity note, tier-aware tutor prompt, and a bridge into the Twin
  Challenge. TwinChallengeView renders the strip above the sliders for
  pulse twins (site/wavelength fixed by context, physiology tunable);
  `pulse` joins ROUTABLE_LABS, ViewMode and the XRAcademyApp nav (Activity
  icon, rose accent).
- Tests: `tests/test_pleth_engine.py` (11): determinism, beat count vs HR
  (greedy refractory-window peak counter - robust to respiratory wander),
  compliance→notch-depth/diastolic-ratio monotonicity, wavelength x site
  amplitude orderings (finger red>green, wrist green>IR, upper arm IR>green),
  motion→quality degradation, reflectance-only skin-tone effect, clamping,
  atlas-anchor integrity, route shapes, both twins score 100 at targets,
  daily-rotation context passthrough. Suite total: 166.
- Wave 2 (next): cardiac-cycle-landmark order challenge, PPG study kit,
  atlas sensor-snap (site→named artery highlight in ImmersiveLab).
  Wave 3 (stretch): `pulse-wave` sketch grammar for SketchBench.

### Delivered artefacts (immersive-learning quality pass - studio-grade viewers)

Owner-directed gap closure: the Immersive Lab graphics lagged the reference
tools (`tools/model-x-studio`, `tools/human-atlas`). The tools render the real
334-piece Model X (clearcoat/transmission PBR) and the full 2,234-mesh
BodyParts3D anatomy on a studio pipeline (PMREM + RoomEnvironment IBL, ACES
filmic tone mapping, three-point lighting, soft shadows, damped controls,
two-phase exploded views with automatic camera framing, projected DOM labels,
on-demand rendering). KEV rendered every subject as flat boxes with one
material and no environment. Owner decision (2026-09-15): embed the real
assets and mirror the quality across all five subjects + AnatomyLab.

- Assets embedded (`public/models/`, ~50MB): `model-x.glb` (17.5MB, cgi Moon
  via BlendKit, Royalty Free, embedded with no download UI) and the 15
  BodyParts3D gzip geometry chunks `body-*.bin.gz` (~33MB, CC BY 4.0). KEV's
  `atlas.json` was already the byte-identical chunk manifest; the binaries
  were the only missing piece. `.gitignore` gained a targeted negation for
  the chunks.
- New shared engine `src/lib/studio/`:
  - `studioRenderer.js` - createStudio(): IBL/PMREM RoomEnvironment, ACES +
    sRGB, three-point rig (hemisphere fill, warm shadow-casting key, cool
    rim, accent), PCF soft shadows with throttled map refresh, themed
    staging (plinth + hairline rings + ground + grid / light-gallery
    platform / starfield space), dirty-flag on-demand RAF loop,
    ResizeObserver, reduced-motion, context-lost, full disposal.
  - `atlasScene.js` - AtlasViewer (adapted from the MIT human-atlas scene):
    streams all 15 chunks (DecompressionStream, 3 parallel workers, progress),
    builds 2,234 per-part geometry views (Int16 normalized normals) merged
    per system into ~15 draw calls, GPU part-state via two DataTextures
    sampled in injected vertex/fragment shaders (offsets + visibility +
    teal selection mix, zero per-mesh JS), integumentary ghost shell,
    two-phase explode (radial system fan -> aspect-aware inventory grid via
    packCells), camera views (3/4, F, S, B), isolate framing, hover tooltip,
    marker points, box-pretest raycast picking.
  - `vehicleScene.js` - VehicleViewer: GLTFLoader -> 334 pieces attached to
    the 8 component groups via glTF extras; material clones with
    transmission-glass conversion + envMapIntensity 1.3 + emissive focus
    highlight; illustrative procedural battery (rounded-box modules, orange
    HV busbars), drive units (ribbed inverter housings, tube coolant lines)
    and air suspension (torus-ringed struts, wishbone tubes); two-phase
    damped explosion (group offsets -> projected-bounds packing via
    packProjected) with smoothstep auto-framing and widening fog; numbered
    scene labels + 334 piece markers; plinth stage that fades on explode.
  - `subjectScenes.js` - SubjectViewer + purpose-built geometry for the
    remaining subjects: plants (lathe taproot with fibers, branching tube
    laterals, double-helix xylem/phloem, extruded bezier leaves with sheen,
    vein tubes, chloroplast ellipsoids, guard-cell tori, soil disc),
    bridge (Warren trusses from tube members, lane-dashed deck, piers with
    footings, catenary cable + hangers + towers, comb expansion joints,
    elastomeric bearings, emissive load sensor, controller cabinet, clamped
    conduits) and earth (cutaway shells: emissive inner core, glowing outer
    core, translucent mantle, flat-shaded crust, drifting plates over a lit
    rift, lathe magma plume with volcanic cone, translucent atmospheric
    shells, drifting cloud cluster, 900-star backdrop); inactive systems
    ghost to 7% instead of hiding; gold emissive selection; numbered labels.
    Generic buildCatalogSubject() upgrades any box-catalog subject
    (RoundedBoxGeometry + PBR) and doubles as the anatomy fallback.
  - `explosionLayout.js` - packCells (MIT adaptation) + packProjected.
  - `useAtlasViewer.js` - React glue: mount/stream/progress + construction-
    safe automatic fallback to the representative teaching boxes when
    streaming or decompression fails (nothing deleted; honest degradation).
- Pages: `ImmersiveLab.jsx` (routed at /anatomy) and `AnatomyLab.jsx` keep
  every wiring (i18n, study levels/tiers, study kits, SketchBench,
  TutorAskPanel, kev:lab-load stash routing, deep search, crosswalk meta)
  and gain: atlas streaming progress overlay, in-memory search over 2,234
  real part names + 3,432 concepts (concept hits select and frame their
  pieces), per-system part counts, All-systems/Skeleton/Organs presets,
  camera view presets, labels + rotate toggles, vehicle STRUCTURES list
  (piece-group mapped) and manifest-hit piece isolation, embedded-asset
  credit lines.
- Policy: `tools/attribution-check` rule 2 rewritten from "no geometry in
  the bundle" to the owner-approved embedded policy (GLB only at
  public/models/model-x.glb, chunks only as body-*.bin.gz, no raw bins),
  rule 5 tightened to real download affordances (href/download attributes
  aimed at asset files) so honest "no download UI" attribution prose passes;
  both ATTRIBUTION docs record the decision, the adapted MIT modules and the
  technique adaptations.
- Verification: vite transforms all new modules, production build clean
  (50MB assets correctly outside the 3.97MB PWA precache), attribution +
  full gates green (suite 166, spec drift 90 ops, packs 37, 6 locales).

Every phase keeps the standing constraints: nothing deleted, high-fidelity
engines untouched, inline English strings (locales only via i18n pipeline),
role/cohort safeguarding preserved, dev auth bypass + Auth0 swap-point intact.
