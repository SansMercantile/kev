# 01 — KEV Product Fact Sheet

Everything quotable about KEV, verifiable from the live app. If it cannot be
shown on screen or in the repo, it does not go in an ad. This is the guardrail
that keeps the campaign honest.

Product: **KEV** — the immersive online school from Sans Mercantile.
URL: `https://kev.sansmercantile.com` (auto-deploys from `main`).

---

## What KEV is (one line)

An all-in-one immersive school: a walkable 3D campus, real science labs, AI
tutors for every subject, a virtual library, sports and games — for children
through university, online and offline.

---

## Verifiable facts (each maps to a real surface)

### The campus
- **11-floor walkable 3D campus** with a Grand Concourse hallway, subject wings
  and the KEV International Virtual School building. (`VirtualCampus.tsx`,
  `schoolCampus.ts` — floors 0–10, 199 rooms)
- **14 bookable Virtual School facilities** (gymnasium, library, science lab,
  auditorium, lecture halls, cafeteria, studios) across six levels, each
  routing to its working surface.
- **Role-gated access**: student vs teacher doors; each role sees only its own
  surfaces, and the backend re-checks independently.

### The labs (all 3D, studio-grade)
- **4 interactive science labs**: Molecular Chemistry (VSEPR), N-Body
  Astrophysics (Kepler), Cellular Biology (organelles + DNA), Wave Optics
  (Snell's law & dispersion) — all with the same studio render baseline
  (sRGB + ACES, damped camera orbit).
- **Immersive Lab**: a Human Atlas of 2,234 modeled anatomical structures
  (BodyParts3D 4.0, CC BY 4.0) plus an Electric Vehicle cutaway (334 pieces)
  and procedural plant/bridge/earth systems — dissect any part, explode the
  model, isolate a structure.
- **XR Auditorium**: a holographic lecture hall that teaches the class the
  student is actually taking (per-subject decks + holograms).

### New science surfaces (this cycle)
- **Quantum Optimization Lab**: a real Ising/QUBO solver (deterministic
  simulated annealing) with an animated replay of the optimizer cooling into
  a solution — Max-Cut and Number-Partition teaching problems, honestly framed
  as classical annealing (the family quantum annealers approximate).
- **Dimension Explorer**: a real 4D tesseract projected down to 3D — students
  steer the 4th axis themselves with an XW rotation + projection-distance
  slider. Honest "4D": a real 4th axis by projection, not a literal 4-space.

### Tutors & curriculum
- **AI tutors for every subject**, level-adaptive (elementary → professional),
  Socratic style; live answers via the backend, with cached + offline guidance.
- **185+ curriculum subjects** with dependencies, levels and tracks.
- **Virtual Library**: classic textbooks & seminal papers per discipline,
  one click from anywhere and from each lab bench.

### Sports, PE & games
- **VR Sports Arena**: swimming sprints + basketball (XP-awarded).
- **Motion Gym**: camera PE — dance & cardio games that read movement from the
  webcam on-device (per-frame differencing + motion centroid; no video leaves
  the device). Not a pose estimator; the honest version that works on any
  webcam.
- **Smartwatch link**: students can pair a real heart-rate wearable over the
  standard Bluetooth Heart Rate Service to add a live pulse to fitness play.
- **Physics Playground**, Twin Challenge, Biome Recon, Pulse Lab.

### Offline & access
- **Works offline**: the full immersive classroom (all 3D models precached)
  runs with zero network on a first-visit device; notes and chat queue and
  replay on reconnect.
- **Any device**: PWA install, hidden-tab pause on every animation loop, mobile
  controls, WebGL fallbacks.
- **i18n**: 6 languages in full parity (EN, AF, ES, FR, XH, ZU).

---

## Approved phrasing (safe to quote)

- "An all-in-one immersive school — campus, labs, tutors, library, sports."
- "Walk the campus. Dissect the atlas. Read the textbook. Play the sport."
- "Works offline on any device — the classroom that travels."
- "Real 3D labs, real AI tutors, real offline — for children through university."

## Hard no's (guardrails)

- **No performance/learning-outcome claims** ("boosts grades", "proven results").
- **No "5D" as a literal claim.** The Dimension Explorer is honest 4D-by-projection.
- **No "quantum computer" claims.** The Quantum Lab is classical simulated
  annealing, framed as the family quantum annealers approximate.
- **No camera/surveillance framing.** Motion Gym is on-device; frames never
  leave the device, and the copy says so.
- **No fake multiplayer.** Lobbies labelled simulated are labelled simulated.

---

## Risk line (accompanies product claims where relevant)

"KEV is educational software. Immersive scenes are teaching visualisations, not
diagnostic tools; the Motion Gym is on-device analysis, not medical monitoring."
