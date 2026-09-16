# KEV XR School — Consolidation Report

**Branch:** `arena/01a099fd-constellation`
**Scope:** consolidating the four-lab XR academy, the `kev-Demo` showcase and the
live `VirtualSchoolBuilding` into one navigable school of 11 floors, 199 rooms,
176 classes and 872 tutor agents — without deleting anything.

---

## 1. What changed, in one paragraph

The XR academy used to be four laboratories on four floors, while the school's
real curriculum (176 classes across 14 subject areas, 872 tutor agents) and its
real bookable building (the `VirtualSchoolBuilding`, 6 levels, 14 facilities)
lived elsewhere and were unreachable in 3D. They are now one campus: a new Grand
Concourse Hallway on floor 0 acts as the spine, the four legacy XR wings keep
their floors 1–4 unchanged, six new subject wings carry the rest of the
curriculum on floors 5–10, and the Virtual School is both a portal off the
hallway and a walkable building on floor 9. Every floor is driven by one
generated data mirror, so the 3D campus cannot drift from the Python model that
owns the truth.

---

## 2. The consolidated floor plan

| Floor | Kind | Rooms | Name |
|------:|------|------:|------|
| 0 | `hallway` | 7 | Grand Concourse Hallway **(new)** |
| 1 | `legacy_xr_wing` | 4 | Ground Floor: Grand Atrium & Commons |
| 2 | `legacy_xr_wing` | 16 | Second Floor: Chemistry & Molecular Sciences Wing |
| 3 | `legacy_xr_wing` | 4 | Third Floor: Astrophysics & Quantum Photonics Wing |
| 4 | `legacy_xr_wing` | 12 | Fourth Floor: Genomics, Cellular Biology & Grand XR Auditorium |
| 5 | `subject_wing` | 25 | Mathematics & Computer Science Wing |
| 6 | `subject_wing` | 28 | Languages & English Wing |
| 7 | `subject_wing` | 26 | Social Studies & Business Wing |
| 8 | `subject_wing` | 45 | Music & Arts & Drama Wing |
| 9 | `subject_wing` | 16 | Athletics, Wellbeing & Virtual School Wing |
| 10 | `subject_wing` | 16 | Vocational & Emerging Fields Wing |

**199 rooms total.** Floors 1–4 keep their original 16 facilities intact; the
consolidation *added* 20 annex rooms to them rather than replacing anything
(`legacyFloorsNowFacilities: 36`, of which `legacyOriginalFacilities: 16`).

### Floor 0 — the Grand Concourse Hallway

The new spine of the school, and where the advanced XR was placed as requested.
Seven named facilities, positioned from backend coordinates:

`fac-hall-wayfinding` (holographic directory kiosk) · `fac-hall-faculty`
(faculty directory) · `fac-hall-lockers` (locker bay) · `fac-hall-elevator`
(elevator column to floors 1–10) · `fac-hall-school-portal` (portal to the KEV
International Virtual School) · plus study nooks and vitrine displays.

Fourteen subject banners hang along the concourse — one per subject area — each
carrying that subject's live class, specialization and agent counts, and each
clickable to travel to its wing.

---

## 3. Curriculum: 14 subject wings

Derived from the real `agent_catalog`, not invented. Each specialization maps to
one class, and each class to five tutor agents.

| Floor | Subject | Classes | Tutor agents | Specializations |
|------:|---------|--------:|-------------:|----------------:|
| 7 | Social Studies | 18 | 90 | 18 |
| 6 | Languages | 16 | 80 | 16 |
| 8 | Music | 16 | 80 | 16 |
| 9 | Physical Education | 16 | 80 | 16 |
| 8 | Arts | 15 | 75 | 15 |
| 8 | Drama | 14 | 70 | 14 |
| 5 | Mathematics | 14 | 62 | 14 |
| 6 | English | 12 | 60 | 12 |
| 2 | Science | 12 | 60 | 12 |
| 5 | Computer Science | 11 | 55 | 11 |
| 10 | Vocational | 9 | 45 | 9 |
| 7 | Business | 8 | 40 | 8 |
| 4 | Health | 8 | 40 | 8 |
| 10 | Emerging Fields | 7 | 35 | 7 |
| | **Total** | **176** | **872** | **176** |

Note how the legacy wings absorbed their own subjects: Science stayed on floor 2
and Health on floor 4, so a student's existing mental map of the old four floors
still holds.

---

## 4. Campus statistics (single source of truth)

```python
build_school_campus() →
  subjectAreas              14
  specializations          176
  classes                  176
  tutorAgents              872
  legacyOriginalFacilities  16   # the pre-consolidation facilities, all preserved
  legacyFloorsNowFacilities 36   # legacy floors after annex rooms were added
  subjectRooms             156
  annexRooms                20
  totalRooms               199
  hallwayFacilities          7
  virtualSchoolFacilities   14
```

---

## 5. Architecture

```
Python (owns the truth)                 TypeScript (renders it)
─────────────────────                   ───────────────────────
backend/core/campus_floors.py   ─┐
  LEGACY_FLOORS 1–4              │
backend/core/school_campus.py   ─┼─► scripts/generate_campus_mirror.py
  build_school_campus() (SSOT)   │            │
virtual_school/core/             │            ▼
  virtual_school_building.py    ─┘   src/xr/data/schoolCampus.ts (206 KB)
  6 levels, 14 facilities                SCHOOL_CAMPUS · CAMPUS_FLOORS
                                         VIRTUAL_SCHOOL · accessors
```

The mirror is **generated, never hand-edited** — this matches the repo's
existing convention. `python3 scripts/generate_campus_mirror.py --check` fails
CI-style if the committed mirror has drifted from the Python model.

### Backend routes

`backend/xr_academy.py` exposes six campus routes plus a WebSocket:

- `GET /xr/campus/floors` — all 11 floors with their facilities
- `GET /xr/campus/school` — the unified campus + statistics
- `WS  /xr/ws/campus-chat` — real-time campus study chat

---

## 6. Gaps found and fixed

Every item below was a real defect, not a polish pass. Nothing was deleted.

### Correctness

| # | Gap | Fix |
|---|-----|-----|
| 1 | **Three whole views were unreachable.** `ViewMode` declared nine modes; only five were ever rendered. Physics Playground, VR Sports Arena and the Visitors & Admissions Portal had been ported from `kev-Demo` but never mounted. | Wired all three into `XRAcademyApp` — imports, icons, handlers, desktop nav, mobile drawer and full view rendering. |
| 2 | **Seven ported components were dead code.** Never imported anywhere. | All seven mounted: `StudyGoalsModule`, `LabQuickStartModal`, `ExpandableGlossary`, `ConnectivityIndicator`, `CampusAnnouncementsTicker`, `PeerMentorMatchingModal`, `EquipmentShopModal`. |
| 3 | **The dashboard hid two of its own buttons.** `StudentDashboard` renders its Equipment Shop and Peer Mentors buttons *only* when a handler is supplied — and the app never supplied either. | Passed `onOpenShop` and `onOpenPeerMentors`, plus the purchase/equip/XP-deduction handlers they need. |
| 4 | **Lab snapshot capture was dead.** Labs call `onCaptureSnapshot(dataUrl, measurements)`; the app passed `onSaveSnapshot(LabSnapshot)` — wrong name *and* wrong signature, so captures silently went nowhere. | Adapter reconciling the two signatures. |
| 5 | **Tool skins were free.** `ToolSkinCustomization.xpPrice` is optional, so `currentXP < undefined` is always `false` and every purchase succeeded at zero cost. | `skinPrice()` helper resolving a concrete price. |
| 6 | **`zero_g` preset was unreachable.** The UI offered it; `PhysicsEnvironmentConfig.presetName` didn't allow it. | Widened the union. |
| 7 | **Tournament navigation broke on non-lab subjects.** `GlobalTournamentEvent.subject` is `LabId \| 'physics' \| 'all'`, but the handler assumed a `LabId`. | Maps non-lab subjects to a real lab before navigating. |
| 8 | **Four tutor IDs were malformed** (`tutor-tutor-…`) and one avatar key didn't exist (`cellular-lead` → `molecular-bio`). | Corrected against the real catalog. |
| 9 | **`PeerMentorMatchingModal` was pinned to four floors.** Its `currentFloor` prop was typed `1 \| 2 \| 3 \| 4` while the campus now runs 0–10. | Widened to `CampusFloorNumber`, and the floor label is read from the generated mirror instead of a hardcoded map that had four of eleven names wrong. |

### Non-determinism (the serious one)

The TypeScript mirror regenerated **differently on every run**, so `--check`
could never pass and the committed file churned constantly.

**Root cause:** `uuid4()` in `VirtualFacility` and `VirtualSchoolBuilding`. Random
IDs flowed straight into the generated mirror.

**Fix:** replaced with a deterministic UUID5 over `(name, facility_type, level)`,
namespaced by `VIRTUAL_SCHOOL_ID_NAMESPACE = 4b7e2f1a-9c3d-5e8f-a6b1-2d4c7e9f0a35`.
Added `stable_facility_id()` and `__post_init__` hooks on both dataclasses so an
explicitly-supplied ID is respected and an absent one is derived.

Consecutive runs are now byte-identical, `--check` passes, and the 14 virtual
school facilities keep the same IDs across processes — which matters because
those IDs are used as DOM keys, localStorage keys and teleport targets.

### Dev-environment

| Gap | Fix |
|-----|-----|
| Vite rejected the preview host with 403. | `allowedHosts: ['.e2b.app']` on both the `server` and `preview` blocks. |
| The `/api` proxy 404'd every campus route. Backend routes live at `/xr/…`; `vercel.json` strips the `/api` prefix in production but the Vite proxy did not. | `rewrite: (path) => path.replace(/^\/api/, '')` on both proxy blocks, plus `ws: true` for the campus-chat socket. |

`kev/.env` deliberately still points the browser at `localhost:8000` — that is
correct for local development and changing it would break the developer
workflow. For proxied environments, override with `VITE_API_BASE_URL=/api`.

---

## 7. Rendering: high fidelity, concretely

`src/xr/render/highFidelityRenderer.ts` replaces the bare `WebGLRenderer` so
every surface — concourse, hallway, wings, virtual school — gets the same
physically-based treatment:

| Effect | Implementation |
|--------|----------------|
| **Global illumination** | Image-based lighting from a PMREM-prefiltered environment (`RoomEnvironment` for interiors, procedural sky for the exterior/observatory) — real indirect specular *and* diffuse, not just direct lights. |
| **Contact shadows** | `GTAOPass` (ground-truth ambient occlusion) with denoising. This is the effect that sells scale and contact between walls, floors and equipment. |
| **Realistic lighting** | ACES Filmic tone mapping + sRGB output, a motivated key/fill/rim rig, emissive fixtures that bloom. |
| **Shadows** | VSM soft shadows on Ultra/High (radius-tunable, no acne); PCFSoft on Balanced/Performance. |
| **Reflections** | Planar `Reflector` on the polished concourse floor, plus clearcoat physical materials on glass and stone. |
| **Volumetric fog** | Custom depth-reconstructing shader pass: exponential *height* fog integrated along the view ray, with in-scattering toward the light — visible shafts from the ceiling coves. |
| **Bloom** | `UnrealBloomPass` on emissive signage, holograms and lab apparatus. |
| **Depth of field** | `BokehPass` on Ultra, focused on the player. |
| **Antialiasing** | SMAA in post, so it survives the composer chain. |
| **Dense detail** | Max anisotropic filtering on floor textures seen at a rake, mipmapped procedural PBR sets (albedo + normal + roughness + AO), instancing helpers. |

Textures are generated procedurally with a seedable PRNG, so terrazzo, concrete,
carpet and metal look identical between reloads and cost no network requests.

**Adaptive quality.** These effects are deliberately hardware-intensive, so the
engine measures its own frame time and steps the tier down and back up
automatically. `quality: 'auto'` picks the starting tier from the GPU renderer
string, device memory and core count. A student on integrated graphics still
gets the whole school — at Balanced rather than Ultra.

| Tier | Textures | Volumetric fog | GTAO |
|------|---------:|---------------:|-----:|
| Performance | 512 | off | off |
| Balanced | 1024 | off | 8 samples |
| High | 2048 | 14 steps | 16 samples |
| Ultra | 2048 | 24 steps | 32 samples |

---

## 8. Verification

### Scene smoke test — `npm run verify:campus`

WebGL cannot run headless in CI, so this does the next most valuable thing: it
**builds every world the campus can show** and validates the result as a scene
graph. These are precisely the failures a type checker cannot see and that break
a Three.js scene silently in production.

```
Floor 0 — Grand Concourse Hallway      581 objects, 27 shader materials,
                                       21 interactables, 22 animated,
                                       14 banners, 7/7 interactions fired
Floors 1–4 — legacy XR atrium          177 objects each, 4 proximity zones
Floor 5  (25 rooms)                    462 objects, 25 doors
Floor 6  (28 rooms)                    515 objects, 28 doors
Floor 7  (26 rooms)                    478 objects, 26 doors
Floor 8  (45 rooms)                    817 objects, 45 doors
Floor 9  (16 rooms)                    318 objects, 16 doors
Floor 10 (16 rooms)                    318 objects, 16 doors
Virtual School                         6 levels, 14/14 rooms, 600 objects
All 4 quality tiers                    build clean
─────────────────────────────────────────────────────────────────
4,797 scene objects · 101 shader materials
22,372 assertions run · 0 failures
```

What it asserts:

- **No NaN or Infinity** in any position, scale, quaternion or `matrixWorld`, and
  no zero scale — one bad coordinate silently makes a subtree invisible with no
  error anywhere.
- **Shader wiring.** Every GLSL uniform that a stage declares exists in the
  material's `.uniforms` object; every varying written by the vertex stage and
  read by the fragment stage is declared in both with matching type; braces
  balance; the fragment stage actually writes `gl_FragColor`. Three.js validates
  none of this — WebGL just warns.
- **Interaction completeness.** One door per room on every subject floor, each
  carrying `userData.facility` for the proximity prompt; every hallway facility
  resolves to a named scene node with a working handler.
- **Non-degenerate proximity volumes.** Every virtual-school room box is a real
  volume — a collapsed box would make a room impossible to enter.
- **Animation stability.** All updateables run 240 simulated frames without
  throwing and without drifting to NaN.
- **Clean disposal.** `dispose()` empties the group and releases every geometry
  and material — the leak that made the old campus grow memory on every floor
  change.

The harness runs the real modules through the project's own esbuild, against a
software Canvas 2D stub with an actual pixel buffer, so the procedural PBR
textures and the height→normal Sobel conversion execute on real data rather than
on empty buffers that would prove nothing.

### Everything else

| Check | Result |
|-------|--------|
| `npx tsc --noEmit -p tsconfig.json` | **0 errors** |
| `npm run build` / `build:app` | **success** (site and platform modes) |
| `pytest tests/ -q` | **109 passed** |
| `npm run i18n:check` | **all 6 locales in parity, 219 keys** |
| `generate_campus_mirror.py --check` | **passes, byte-identical** |
| Backend live on :8000 | `/xr/campus/floors` → 11 floors, 199 rooms; `/xr/campus/school` → statistics match the mirror |

---

## 9. Performance: code splitting

The bundle carried the entire school eagerly — every view, all four laboratories
and all fourteen modals — for a student who can only ever be in one place at a
time.

| | Before | After | Change |
|---|-------:|------:|-------:|
| `XRAcademy` chunk | 1,818.77 kB (510 kB gz) | **107 kB (30 kB gz)** | **−94%** |
| Entry chunk | 811.91 kB (254 kB gz) | **456 kB (140 kB gz)** | **−44%** |
| A-Frame runtime (~1.5 MB published) | blocking `<script>` in `<head>`, every page | on demand, VR Campus page only | **off the critical path** |
| Unused app (`App.jsx` *or* `AppPlatform.jsx`) | both bundled | only the selected one | **−104 kB** (site app, in a platform build) |
| PostHog (235 kB) | in the entry, ahead of first paint | fetched after mount | **off the critical path** |

Three separate problems, found by measuring rather than guessing:

1. **`XRAcademyApp` imported everything statically.** Now 24 components are
   `React.lazy` chunks — the four laboratories, seven views and thirteen
   overlays — each fetched when opened. The shell stays eager: header,
   connectivity indicator, announcements ticker, campus chat sidebar and focus
   timer, so nothing a student sees on arrival waits on a round trip.

2. **`main.jsx` imported both applications.** Only one ever runs (`MODE` decides
   at build time), yet both were bundled, parsed and paid for. Now the selected
   one is imported dynamically; because `MODE` is a build-time constant, Rollup
   also drops the unused branch entirely.

3. **A-Frame blocked first paint for everyone.** The full A-Frame runtime is
   published at roughly 1.5 MB, and it sat in `<head>` as a blocking script used
   by exactly one page. (The figure is the vendor's; this sandbox has no egress
   to `aframe.io`, so it was not re-weighed here — the point stands regardless of
   the exact size: it was blocking, and only one page needed it.) `VRCampus` already feature-detected
   `window.AFRAME` and degraded gracefully, so it is now fetched on demand by
   `src/utils/loadAFrame.js` — idempotent, adopts an in-flight tag rather than
   duplicating it, and clears its memo on failure so a later visit can retry.
   The `<a-scene>` is mounted only once the runtime has registered its custom
   elements, rather than relying on upgrade semantics.

A source-map analysis of the entry chunk is what identified PostHog (240 kB of source, a 235 kB chunk) and
Auth0 (236 kB) as two thirds of it. PostHog was deferred because nothing on
screen depends on it. **Auth0 was deliberately left alone**: it is genuinely
configured in `.env`, `Auth0Provider` must wrap the app, and several pages call
`useAuth0()` directly — so deferring it would move the bytes without removing
them, while touching an auth-critical load path.

Overlays that render unconditionally and gate on an `isOpen` prop (the lab
notebook, quick-start brief and AI tutor) are mounted through a
`useMountOnFirstOpen` latch. This keeps their chunks out of the initial bundle
*and* keeps them mounted after first open — the notebook holds its hypothesis
log and draft notes in component state, so unmounting on close would silently
discard a student's work.

---

## 10. Deliberate decisions

- **Nothing was deleted.** Where two components appeared to overlap they turned
  out to be complementary: `LabGettingStartedOverlay` teaches spatial navigation
  and launches AR/VR, while `LabQuickStartModal` is a per-lab subject brief
  (apparatus, method, safety). Both are now reachable from the labs sub-header as
  separate actions.
- **`kev-Demo/` is left intact** as the reference showcase. 68 of its 71 source
  files are ported into `src/xr`; the three that are not (`App.tsx`, `main.tsx`,
  `vite-env.d.ts`) are its app shell, which the real app supplies itself.
- **Floors 1–4 are unchanged** apart from annex rooms being added. Students who
  knew the old four-floor school still find Science on 2 and Health on 4.
- **`kev/.env` still targets `localhost:8000`** — correct for local development.

---

## 11. Running it

```bash
# Backend (from the repo root; .venv-kev has the full dependency set)
.venv-kev/bin/python -m uvicorn kev.backend.main:app --host 0.0.0.0 --port 8000

cd kev
npm run dev              # platform app on :3002
npm run dev:site         # marketing site on :3003
npm run typecheck        # tsc --noEmit
npm run verify:campus    # scene smoke test (no browser needed)
npm run i18n:check       # locale key parity
npm run build            # site bundle
npm run build:app        # platform bundle

../.venv-kev/bin/python -m pytest tests/ -q
python3 scripts/generate_campus_mirror.py           # regenerate the TS mirror
python3 scripts/generate_campus_mirror.py --check   # fail if it has drifted
```

For a proxied environment (where the browser must not reach `localhost:8000`
directly), start the dev server with `VITE_API_BASE_URL=/api`.
