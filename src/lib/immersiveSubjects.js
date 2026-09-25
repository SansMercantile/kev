import { ANATOMY_SYSTEMS, ANATOMY_PARTS } from './anatomySystems'

// Unified immersive subject catalog. Every subject carries the cross-surface
// wiring (tutorId -> XR faculty + /agents, labId/floor -> XR Academy,
// keyTerms -> in-viewer search) so floors, facilities, subjects, and tutors
// stay linked. Mirrors GET /xr/subjects on the backend.
//
// Part format: [name, position XYZ, size XYZ, description, sourceUrl?, pieceId?]
// Anatomy systems + vocabulary come from tools/human-atlas (15 systems); the
// full 2,234-mesh BodyParts3D 4.0 geometry streams from public/models
// (CC BY 4.0), with these box parts kept as the offline fallback catalog.
// Vehicle systems adapt tools/model-x-studio component descriptions; the
// 334-piece Model X geometry (cgi Moon via BlendKit, Royalty Free) is
// embedded for study with no download UI, and pieceId maps each catalog
// entry onto its component group in the model.

const TESLA_MANUAL = 'https://www.tesla.com/ownersmanual/modelx/en_us/'
const VEHICLE_SOURCES = {
  body: TESLA_MANUAL + 'GUID-7A32EC01-A17E-42CC-A15B-2E0A39FD07AB.html',
  glass: TESLA_MANUAL + 'GUID-F617DA3E-11C1-4FBA-98A7-A9C3828E3536.html',
  doors: TESLA_MANUAL + 'GUID-7A32EC01-A17E-42CC-A15B-2E0A39FD07AB.html',
  cabin: TESLA_MANUAL + 'GUID-F617DA3E-11C1-4FBA-98A7-A9C3828E3536.html',
  battery: TESLA_MANUAL + 'GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html',
  drive: TESLA_MANUAL + 'GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html',
  suspension: TESLA_MANUAL + 'GUID-F1B6801A-8946-41AD-8CF9-7A963CDA38E4.html',
  wheels: TESLA_MANUAL + 'GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html',
}

function anatomySystems() {
  return ANATOMY_SYSTEMS.map((s) => ({ id: s.id, label: s.name, color: s.color }))
}

function anatomyParts() {
  return { ...ANATOMY_PARTS }
}

// Part-spec DSL helpers (docs/KEV_ATLAS_EXPANSION.md). P() builds one catalog
// tuple with an optional shape spec consumed by buildCatalogSubject();
// chain()/ring() expand repeated anatomy into named, searchable parts.
const P = (name, position, size, description, shape = null, source = null) => [name, position, size, description, source, undefined, shape]
const chain = (count, fn) => Array.from({ length: count }, (_, i) => fn(i + 1))
// Ring on the XZ plane (y = 0 in the returned position; callers offset y).
const ring = (count, radius, fn) =>
  chain(count, (i) => {
    const a = ((i - 1) / count) * Math.PI * 2
    return fn(i, [Math.cos(a) * radius, 0, Math.sin(a) * radius], a)
  })

export const IMMERSIVE_SUBJECT_ORDER = [
  'anatomy', 'plants', 'engineering', 'vehicle', 'earth',
  'worm', 'bee', 'frog', 'cell', 'giza', 'locomotive', 'rocket', 'violin',
]

export const IMMERSIVE_SUBJECTS = {
  anatomy: {
    label: 'Human Atlas',
    eyebrow: 'LIFE SCIENCE',
    description: 'Explore human systems as an interactive model. Separate structures and inspect how they work together.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['skeleton', 'muscle', 'heart', 'brain', 'nerve', 'artery', 'vein', 'lung', 'liver', 'kidney'],
    attribution: 'System vocabulary adapted from the Human Atlas tool (BodyParts3D 4.0, CC BY 4.0). See docs/ATTRIBUTION-human-atlas.md.',
    conceptSearch: { manifestUrl: '/models/atlas.json', placeholder: 'Search 3,432 anatomical concepts...' },
    systems: anatomySystems(),
    parts: anatomyParts(),
  },
  plants: {
    label: 'Plant Systems',
    eyebrow: 'BOTANY',
    description: 'Trace how roots, vascular tissue, and leaves work together to move water and capture energy.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['root', 'xylem', 'phloem', 'leaf', 'chloroplast', 'stomata', 'photosynthesis', 'vein', 'stem'],
    systems: [
      { id: 'roots', label: 'Roots', color: '#b98b5b' },
      { id: 'vascular', label: 'Vascular', color: '#5ca66b' },
      { id: 'photosynthesis', label: 'Photosynthesis', color: '#c8d957' },
    ],
    parts: {
      roots: [
        ['Root cap', [0, -1.7, 0], [0.65, 0.35, 0.65], 'The root cap protects the growing tip as it moves through soil.'],
        ['Primary root', [0, -1.05, 0], [0.35, 1.3, 0.35], 'The primary root anchors the plant and absorbs water.'],
        ['Lateral roots', [-0.72, -0.75, 0], [1.35, 0.16, 0.16], 'Lateral roots expand the surface area available for absorption.'],
        ['Root hairs', [0.65, -0.35, 0], [0.8, 0.1, 0.1], 'Root hairs increase contact with soil particles and water films.'],
      ],
      vascular: [
        ['Xylem', [-0.28, 0.8, 0], [0.16, 3.2, 0.16], 'Xylem transports water and minerals upward from the roots.'],
        ['Phloem', [0.28, 0.8, 0], [0.16, 3.2, 0.16], 'Phloem distributes sugars from photosynthetic tissues.'],
        ['Leaf veins', [0, 2.35, 0.25], [1.9, 0.16, 0.16], 'Veins branch through leaves to distribute water and collect sugars.'],
        ['Stem cambium', [0, 0.55, 0], [0.62, 2.8, 0.62], 'The cambium produces new vascular tissue as the stem grows.'],
      ],
      photosynthesis: [
        ['Chloroplasts', [0, 2.65, 0.2], [1.7, 0.12, 0.7], 'Chloroplasts convert light energy into chemical energy.'],
        ['Leaf blade', [0, 2.55, 0], [2.4, 0.22, 1.25], 'The leaf blade provides a broad surface for light capture and gas exchange.'],
        ['Stomata', [-0.72, 2.5, 0.42], [0.18, 0.08, 0.08], 'Stomata regulate carbon dioxide intake and water loss.'],
        ['Guard cells', [0.72, 2.5, 0.42], [0.18, 0.08, 0.08], 'Guard cells open and close stomata in response to conditions.'],
      ],
    },
  },
  engineering: {
    label: 'Bridge Systems',
    eyebrow: 'ENGINEERING',
    description: 'Disassemble a truss bridge to see how forces travel through structure, motion, and load paths.',
    tutorId: 'dr-ward',
    labId: 'optics',
    floor: 3,
    keyTerms: ['truss', 'deck', 'load', 'bearing', 'cable', 'sensor', 'foundation', 'joint', 'conduit'],
    systems: [
      { id: 'structure', label: 'Structure', color: '#8fb8d8' },
      { id: 'motion', label: 'Motion', color: '#e6a65d' },
      { id: 'power', label: 'Power', color: '#d87171' },
    ],
    parts: {
      structure: [
        ['Deck', [0, 0.4, 0], [3.8, 0.24, 0.9], 'The deck carries traffic loads across the span.'],
        ['Left truss', [-1.55, 1.1, 0], [0.22, 1.55, 0.22], 'The truss converts bending loads into axial forces.'],
        ['Right truss', [1.55, 1.1, 0], [0.22, 1.55, 0.22], 'The truss converts bending loads into axial forces.'],
        ['Foundation', [0, -0.4, 0], [4.4, 0.35, 1.15], 'The foundation transfers structural forces into the ground.'],
      ],
      motion: [
        ['Expansion joint', [0, 0.58, 0.48], [0.2, 0.2, 0.3], 'Expansion joints allow the deck to respond to temperature changes.'],
        ['Left bearing', [-1.55, 0.15, 0], [0.45, 0.2, 0.45], 'Bearings allow controlled movement while supporting the span.'],
        ['Right bearing', [1.55, 0.15, 0], [0.45, 0.2, 0.45], 'Bearings allow controlled movement while supporting the span.'],
        ['Suspension cable', [0, 1.9, 0], [3.2, 0.12, 0.12], 'The cable carries tension and transfers load to the towers.'],
      ],
      power: [
        ['Load sensor', [0, 0.75, 0.5], [0.35, 0.25, 0.2], 'Load sensors measure strain and support structural monitoring.'],
        ['Signal controller', [0, 1.35, 0.4], [0.42, 0.35, 0.3], 'The controller gathers sensor data for analysis and alerts.'],
        ['Left conduit', [-1.2, 0.8, 0.3], [0.12, 1.3, 0.12], 'Conduits protect power and data lines from the environment.'],
        ['Right conduit', [1.2, 0.8, 0.3], [0.12, 1.3, 0.12], 'Conduits protect power and data lines from the environment.'],
      ],
    },
  },
  vehicle: {
    label: 'Electric Vehicle Systems',
    eyebrow: 'ENGINEERING',
    description: 'Take apart an electric SUV: energy storage, drive units, chassis, and body systems.',
    tutorId: 'dr-ward',
    // M4 wiring fix (docs/KEV_TOOLS_ROADMAP.md): an EV subject belongs in the
    // Physics Playground (energy, forces, motion), not the optics lab.
    labId: 'physics',
    floor: 3,
    keyTerms: ['battery', 'motor', 'suspension', 'brake', 'cabin', 'door', 'glass', 'chassis', 'tire', 'drive'],
    attribution: 'Component descriptions adapted from the Model X Studio tool; the 334-piece Model X geometry (cgi Moon via BlendKit, Royalty Free) is embedded for study - no download UI. Battery, drive units and suspension are illustrative teaching geometry. See docs/ATTRIBUTION-model-x.md.',
    pieceSearch: { manifestUrl: '/models/model-x-manifest.json', placeholder: 'Search 334 vehicle pieces...' },
    systems: [
      { id: 'exterior', label: 'Exterior', color: '#8fb8d8' },
      { id: 'interior', label: 'Interior', color: '#e6cf9b' },
      { id: 'energy', label: 'Energy', color: '#5ca66b' },
      { id: 'powertrain', label: 'Powertrain', color: '#d87171' },
      { id: 'chassis', label: 'Chassis', color: '#ad9bd8' },
    ],
    parts: {
      exterior: [
        ['Body & structure', [0, 0.85, 0], [4.4, 0.8, 1.9], 'The body brings the vehicle together: an enclosed passenger space, crumple zones at either end, and a smooth exterior that guides air around the car. The structure carries loads around the cabin.', VEHICLE_SOURCES.body, 'body'],
        ['Panoramic glass', [0, 1.45, 0], [2.2, 0.45, 1.7], 'The expansive windshield sweeps up above the front seats. The windshield and side glazing create visibility around the vehicle.', VEHICLE_SOURCES.glass, 'glass'],
        ['Falcon wing door', [0.9, 1.05, 0.95], [1.1, 1.0, 0.1], 'Two hinges give each rear door its distinctive upward motion. The door folds as it rises, making access possible in tighter spaces.', VEHICLE_SOURCES.doors, 'doors'],
      ],
      interior: [
        ['Passenger cabin', [-0.2, 0.85, 0], [2.6, 0.65, 1.6], 'The passenger space sits above the battery. Seats, restraints, controls and displays form the part of the vehicle you interact with every day.', VEHICLE_SOURCES.cabin, 'cabin'],
      ],
      energy: [
        ['High-voltage battery', [0, 0.12, 0], [3.2, 0.18, 1.5], 'A liquid-cooled lithium-ion battery stores the energy that powers the vehicle. During regenerative braking, the motors convert motion back into stored energy.', VEHICLE_SOURCES.battery, 'battery'],
      ],
      powertrain: [
        ['Front drive unit', [-1.6, 0.35, 0], [0.6, 0.5, 0.8], 'An electric motor turns stored energy into wheel torque. An inverter controls the motor and a fixed-ratio gearbox transfers rotation to the wheels.', VEHICLE_SOURCES.drive, 'drive'],
        ['Rear drive unit', [1.6, 0.35, 0], [0.6, 0.5, 0.8], 'An electric motor turns stored energy into wheel torque. The motors also help slow the vehicle through regenerative braking.', VEHICLE_SOURCES.drive, 'drive'],
      ],
      chassis: [
        ['Adaptive suspension', [0, 0.32, 0], [3.8, 0.18, 2.0], 'Air springs support the car while adaptive dampers control body movement. The system adjusts ride height and road response.', VEHICLE_SOURCES.suspension, 'suspension'],
        ['Front-left wheel', [-1.5, 0.35, 0.95], [0.5, 0.7, 0.35], 'Tires are the contact with the road. Behind each wheel, a ventilated brake disc and caliper provide friction braking with ABS.', VEHICLE_SOURCES.wheels, 'wheels'],
        ['Front-right wheel', [-1.5, 0.35, -0.95], [0.5, 0.7, 0.35], 'Tires are the contact with the road. Behind each wheel, a ventilated brake disc and caliper provide friction braking with ABS.', VEHICLE_SOURCES.wheels, 'wheels'],
        ['Rear-left wheel', [1.5, 0.35, 0.95], [0.5, 0.7, 0.35], 'Tires are the contact with the road. Behind each wheel, a ventilated brake disc and caliper provide friction braking with ABS.', VEHICLE_SOURCES.wheels, 'wheels'],
        ['Rear-right wheel', [1.5, 0.35, -0.95], [0.5, 0.7, 0.35], 'Tires are the contact with the road. Behind each wheel, a ventilated brake disc and caliper provide friction braking with ABS.', VEHICLE_SOURCES.wheels, 'wheels'],
      ],
    },
  },
  earth: {
    label: 'Earth Systems',
    eyebrow: 'EARTH SCIENCE',
    description: 'Explore the layered planet and inspect the systems that shape its surface and atmosphere.',
    tutorId: 'prof-thorne',
    labId: 'astrophysics',
    floor: 3,
    keyTerms: ['core', 'mantle', 'crust', 'plate', 'magma', 'troposphere', 'stratosphere', 'cloud'],
    systems: [
      { id: 'layers', label: 'Planetary layers', color: '#d88a61' },
      { id: 'tectonics', label: 'Tectonics', color: '#ad6e52' },
      { id: 'atmosphere', label: 'Atmosphere', color: '#79b9d3' },
    ],
    parts: {
      layers: [
        ['Inner core', [0, 0, 0], [0.9, 0.9, 0.9], 'The inner core is a solid iron-rich sphere under immense pressure.'],
        ['Outer core', [0, 0.5, 0], [1.55, 0.48, 1.55], 'The liquid outer core drives Earth\u2019s magnetic field.'],
        ['Mantle', [0, 1.15, 0], [2.35, 0.55, 2.35], 'The mantle transfers heat through slow convection.'],
        ['Crust', [0, 1.85, 0], [3.2, 0.25, 3.2], 'The crust is the thin, brittle outer layer where we live.'],
      ],
      tectonics: [
        ['Plate A', [-0.9, 1.95, 0], [1.5, 0.16, 2.4], 'Tectonic plates move over the softer asthenosphere.'],
        ['Plate B', [0.9, 1.95, 0], [1.5, 0.16, 2.4], 'Plate boundaries generate earthquakes, mountains, and volcanism.'],
        ['Magma column', [0, 2.7, 0], [0.4, 1.3, 0.4], 'Magma rises where heat and pressure create a path through the crust.'],
      ],
      atmosphere: [
        ['Troposphere', [0, 3.3, 0], [3.2, 0.4, 3.2], 'The troposphere contains most weather and atmospheric water vapor.'],
        ['Stratosphere', [0, 4.0, 0], [3.8, 0.28, 3.8], 'The stratosphere contains the ozone layer.'],
        ['Cloud system', [0, 4.55, 0], [1.4, 0.35, 1.4], 'Clouds move energy and water through the climate system.'],
      ],
    },
  },

  // ------------------------------------------------------------ Wave 1 worlds
  // Procedural atlas-grade subjects built on the part-spec DSL (see
  // docs/KEV_ATLAS_EXPANSION.md). Generators expand repeated anatomy into
  // individually named, searchable parts.
  worm: {
    label: 'Earthworm',
    eyebrow: 'ZOOLOGY',
    description: 'Segment by segment: digestion, five aortic arches, a ventral nerve cord and nephridia in one annelid body plan.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['clitellum', 'gizzard', 'crop', 'aortic arch', 'nephridia', 'setae', 'typhlosole', 'ganglion'],
    systems: [
      { id: 'bodywall', label: 'Body wall & segments', color: '#c98274' },
      { id: 'digestion', label: 'Digestive tract', color: '#d8b25c' },
      { id: 'circulation', label: 'Closed circulation', color: '#c0504d' },
      { id: 'nerve', label: 'Nerve cord', color: '#e8d48b' },
      { id: 'repro', label: 'Reproductive organs', color: '#b98ad1' },
      { id: 'excretion', label: 'Excretion (nephridia)', color: '#7fa8c9' },
    ],
    parts: {
      bodywall: [
        ...chain(60, (i) => {
          const x = -2.1 + (i - 1) * 0.072
          const r = 0.185 - Math.abs(i - 30) * 0.0016 + (i >= 32 && i <= 37 ? 0.03 : 0)
          return P(`Segment ${i}`, [x, 0, 0], [0.07, r * 2, r * 2], `Segment ${i} of the body wall: circular and longitudinal muscle under a moist cuticle.${i >= 32 && i <= 37 ? ' Part of the clitellum band.' : ''}`, { k: 'cyl', r, h: 0.068, rot: [0, 0, Math.PI / 2], c: i >= 32 && i <= 37 ? '#d99a86' : undefined, op: 0.4 })
        }),
        P('Clitellum', [-0.02, 0, 0], [0.44, 0.46, 0.46], 'The clitellum secretes the cocoon and signals sexual maturity.', { k: 'cyl', r: 0.225, h: 0.42, rot: [0, 0, Math.PI / 2], c: '#e0a58f', op: 0.55 }),
        P('Prostomium', [-2.16, 0, 0], [0.08, 0.1, 0.1], 'The prostomium is a sensory lobe over the mouth.', { k: 'cone', r: 0.09, h: 0.12, rot: [0, 0, Math.PI / 2] }),
        P('Mouth', [-2.09, -0.02, 0], [0.06, 0.08, 0.1], 'The mouth opens into the muscular pharynx.', { k: 'box' }),
        P('Anus', [2.16, 0, 0], [0.05, 0.08, 0.08], 'The anus closes the straight digestive tube.', { k: 'box' }),
        ...chain(60, (i) => P(`Setae bundle ${i}`, [-2.1 + (i - 1) * 0.072, -0.16, 0.06], [0.04, 0.03, 0.03], `Setae of segment ${i}: four pairs of chitinous bristles that grip soil during peristaltic motion.`, { k: 'sph', r: 0.022, c: '#8a5a4c' })),
      ],
      digestion: [
        P('Pharynx', [-1.95, 0.02, 0], [0.22, 0.16, 0.14], 'The muscular pharynx pumps soil and organic matter inward.', { k: 'sph', r: 0.11 }),
        P('Oesophagus', [-1.72, 0.02, 0], [0.3, 0.09, 0.09], 'The oesophagus carries food past the aortic arches.', { k: 'tube', pts: [[-1.85, 0.02, 0], [-1.6, 0.02, 0]], r: 0.045 }),
        P('Crop', [-1.5, 0.02, 0], [0.16, 0.14, 0.14], 'The crop stores ingested soil and detritus.', { k: 'sph', r: 0.08 }),
        P('Gizzard', [-1.34, 0.02, 0], [0.18, 0.16, 0.16], 'The gizzard grinds particles with swallowed grit.', { k: 'sph', r: 0.09, c: '#c69a4a' }),
        P('Intestine', [0.3, 0, 0], [3.4, 0.12, 0.12], 'The intestine runs the full body length, absorbing nutrients.', { k: 'tube', pts: [[-1.2, 0.01, 0], [0, 0, 0], [2.1, 0, 0]], r: 0.06 }),
        P('Typhlosole', [0.3, 0.05, 0], [3.2, 0.05, 0.05], 'The typhlosole fold increases absorptive surface area.', { k: 'tube', pts: [[-1.15, 0.06, 0], [0, 0.05, 0], [2.05, 0.05, 0]], r: 0.022, c: '#e6cf8f' }),
      ],
      circulation: [
        P('Dorsal vessel', [0, 0.15, 0], [4.2, 0.05, 0.05], 'The dorsal vessel contracts forward, driving blood headwards.', { k: 'tube', pts: [[-2.05, 0.15, 0], [0, 0.17, 0], [2.1, 0.13, 0]], r: 0.028 }),
        P('Ventral vessel', [0, -0.12, 0], [4.2, 0.05, 0.05], 'The ventral vessel returns blood toward the tail.', { k: 'tube', pts: [[-2.05, -0.12, 0], [0, -0.12, 0], [2.1, -0.12, 0]], r: 0.024 }),
        P('Subneural vessel', [0, -0.17, 0], [4.0, 0.04, 0.04], 'The subneural vessel runs beneath the nerve cord.', { k: 'tube', pts: [[-1.9, -0.17, 0], [2.0, -0.17, 0]], r: 0.016 }),
        ...chain(5, (i) => P(`Aortic arch ${i} (pseudo-heart)`, [-1.72 + (i - 1) * 0.075, 0.02, 0], [0.05, 0.3, 0.3], `Aortic arch ${i} of five: pulsating vessels that pump blood like simple hearts.`, { k: 'tor', r: 0.14, t: 0.02, rot: [0, Math.PI / 2, 0] })),
      ],
      nerve: [
        P('Cerebral ganglion (brain)', [-2.02, 0.08, 0], [0.12, 0.1, 0.12], 'The cerebral ganglion pair forms a simple brain above the pharynx.', { k: 'sph', r: 0.06 }),
        P('Ventral nerve cord', [0, -0.14, 0], [4.1, 0.04, 0.04], 'The ventral nerve cord carries signals the length of the body.', { k: 'tube', pts: [[-1.98, -0.13, 0], [0, -0.14, 0], [2.1, -0.14, 0]], r: 0.018 }),
        ...chain(60, (i) => P(`Segmental ganglion ${i}`, [-2.1 + (i - 1) * 0.072, -0.14, 0], [0.05, 0.05, 0.05], `Ganglion ${i}: a local nerve swelling coordinating that segment's muscles.`, { k: 'sph', r: 0.026, c: '#f0e3a0' })),
      ],
      repro: [
        P('Seminal vesicle L', [-1.55, 0.05, 0.08], [0.16, 0.12, 0.1], 'Seminal vesicles mature sperm before transfer.', { k: 'sph', r: 0.07 }),
        P('Seminal vesicle R', [-1.55, 0.05, -0.08], [0.16, 0.12, 0.1], 'The paired vesicles flank the oesophagus.', { k: 'sph', r: 0.07 }),
        P('Spermatheca 1', [-1.28, 0.04, 0.07], [0.08, 0.08, 0.08], 'Spermathecae store sperm received from a partner.', { k: 'sph', r: 0.04, c: '#d3b1e6' }),
        P('Spermatheca 2', [-1.28, 0.04, -0.07], [0.08, 0.08, 0.08], 'Cross-fertilisation happens during mating (clitellum-to-clitellum).', { k: 'sph', r: 0.04, c: '#d3b1e6' }),
        P('Oviduct pair', [-0.9, -0.04, 0], [0.12, 0.06, 0.1], 'Oviducts release eggs into the cocoon.', { k: 'box' }),
        P('Male pores', [-1.05, -0.1, 0.09], [0.05, 0.04, 0.04], 'Male pores open on segment 15.', { k: 'box' }),
      ],
      excretion: chain(60, (i) => P(`Nephridia pair ${i}`, [-2.1 + (i - 1) * 0.072, -0.06, -0.1], [0.05, 0.06, 0.05], `Nephridia of segment ${i}: coiled tubes filtering coelomic fluid to nephridiopores.`, { k: 'sph', r: 0.028, c: '#9cc3de' })),
    },
  },
  bee: {
    label: 'Honeybee',
    eyebrow: 'ZOOLOGY',
    description: 'A worker bee dissected: pollen baskets, hamuli-linked wings, honey stomach, sting and tracheal system.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['proboscis', 'hamuli', 'pollen basket', 'honey stomach', 'sting', 'spiracle', 'malpighian', 'ocelli'],
    systems: [
      { id: 'head', label: 'Head & senses', color: '#d8a24a' },
      { id: 'thorax', label: 'Thorax, wings & legs', color: '#c98b3f' },
      { id: 'abdomen', label: 'Abdomen & sting', color: '#b5762f' },
      { id: 'digestion', label: 'Digestion', color: '#d8b25c' },
      { id: 'respiration', label: 'Tracheal respiration', color: '#8fb8d8' },
      { id: 'nerve', label: 'Nerve cord', color: '#e8d48b' },
    ],
    parts: {
      head: [
        P('Head capsule', [-1.05, 0.05, 0], [0.34, 0.34, 0.3], 'The head carries sensors and mouthparts for hive work.', { k: 'cap', r: 0.16, h: 0.14, rot: [0, 0, Math.PI / 2] }),
        P('Compound eye L', [-1.08, 0.08, 0.14], [0.16, 0.2, 0.1], 'Compound eyes resolve motion and polarised sky light.', { k: 'sph', r: 0.09, c: '#3a3126' }),
        P('Compound eye R', [-1.08, 0.08, -0.14], [0.16, 0.2, 0.1], 'Each eye packs ~5,500 ommatidia.', { k: 'sph', r: 0.09, c: '#3a3126' }),
        P('Ocellus 1', [-1.12, 0.2, 0], [0.05, 0.05, 0.05], 'Three ocelli measure light intensity for flight stability.', { k: 'sph', r: 0.028, c: '#5a4a30' }),
        P('Ocellus 2', [-1.06, 0.21, 0.05], [0.05, 0.05, 0.05], 'Ocelli trigger the escape response to sudden shadow.', { k: 'sph', r: 0.028, c: '#5a4a30' }),
        P('Ocellus 3', [-1.06, 0.21, -0.05], [0.05, 0.05, 0.05], 'Together they act as a horizon sensor.', { k: 'sph', r: 0.028, c: '#5a4a30' }),
        P('Antenna L', [-1.28, 0.12, 0.1], [0.3, 0.04, 0.04], 'Antennae smell pheromones and feel the dark hive.', { k: 'tube', pts: [[-1.2, 0.12, 0.1], [-1.32, 0.16, 0.14], [-1.44, 0.14, 0.18]], r: 0.02 }),
        P('Antenna R', [-1.28, 0.12, -0.1], [0.3, 0.04, 0.04], 'Each antenna holds thousands of odor receptors.', { k: 'tube', pts: [[-1.2, 0.12, -0.1], [-1.32, 0.16, -0.14], [-1.44, 0.14, -0.18]], r: 0.02 }),
        P('Mandible L', [-1.24, -0.04, 0.07], [0.12, 0.06, 0.04], 'Mandibles mould wax and grip intruders.', { k: 'box' }),
        P('Mandible R', [-1.24, -0.04, -0.07], [0.12, 0.06, 0.04], 'They also groom nest-mates.', { k: 'box' }),
        P('Proboscis (tongue)', [-1.26, -0.12, 0], [0.34, 0.06, 0.06], 'The proboscis folds out to drink nectar by capillary action.', { k: 'tube', pts: [[-1.2, -0.1, 0], [-1.38, -0.16, 0], [-1.5, -0.2, 0]], r: 0.025 }),
      ],
      thorax: [
        P('Thorax', [-0.55, 0.05, 0], [0.5, 0.42, 0.4], 'The thorax houses asynchronous flight muscle.', { k: 'cap', r: 0.21, h: 0.2, rot: [0, 0, Math.PI / 2] }),
        P('Forewing L', [-0.5, 0.28, 0.42], [0.85, 0.02, 0.26], 'Forewings provide most of the lift.', { k: 'box', c: '#cfe0ea' }),
        P('Forewing R', [-0.5, 0.28, -0.42], [0.85, 0.02, 0.26], 'Wing beats reach ~230 Hz.', { k: 'box', c: '#cfe0ea' }),
        P('Hindwing L', [-0.62, 0.26, 0.3], [0.55, 0.02, 0.2], 'Hindwings hook to forewings in flight.', { k: 'box', c: '#dceaf2' }),
        P('Hindwing R', [-0.62, 0.26, -0.3], [0.55, 0.02, 0.2], 'The hook row is called hamuli.', { k: 'box', c: '#dceaf2' }),
        P('Hamuli row L', [-0.55, 0.27, 0.2], [0.4, 0.02, 0.03], 'Hamuli zip the wing pair into one aerofoil.', { k: 'box' }),
        P('Hamuli row R', [-0.55, 0.27, -0.2], [0.4, 0.02, 0.03], 'Unhooked at rest, the wings fold apart.', { k: 'box' }),
        ...['front', 'middle', 'hind'].flatMap((leg, li) => [
          P(`${leg[0].toUpperCase()}${leg.slice(1)} leg coxa L`, [-0.75 + li * 0.2, -0.16, 0.16], [0.1, 0.12, 0.08], `The ${leg} leg's coxa anchors it to the thorax.`, { k: 'cyl', r: 0.035, h: 0.1 }),
          P(`${leg[0].toUpperCase()}${leg.slice(1)} leg tibia L`, [-0.75 + li * 0.2, -0.3, 0.2], [0.08, 0.24, 0.07], li === 2 ? 'The hind tibia carries the pollen basket (corbicula).' : `The ${leg} tibia bears spurs for cleaning.`, { k: 'cyl', r: 0.03, h: 0.22, c: li === 2 ? '#e0b45a' : undefined }),
          P(`${leg[0].toUpperCase()}${leg.slice(1)} leg tarsus L`, [-0.75 + li * 0.2, -0.46, 0.24], [0.06, 0.18, 0.05], 'Tarsal claws grip comb and flowers.', { k: 'cyl', r: 0.022, h: 0.16 }),
          P(`${leg[0].toUpperCase()}${leg.slice(1)} leg coxa R`, [-0.75 + li * 0.2, -0.16, -0.16], [0.1, 0.12, 0.08], 'Leg pairs are specialised: front cleans antennae.', { k: 'cyl', r: 0.035, h: 0.1 }),
          P(`${leg[0].toUpperCase()}${leg.slice(1)} leg tibia R`, [-0.75 + li * 0.2, -0.3, -0.2], [0.08, 0.24, 0.07], 'Middle legs steer in flight.', { k: 'cyl', r: 0.03, h: 0.22 }),
          P(`${leg[0].toUpperCase()}${leg.slice(1)} leg tarsus R`, [-0.75 + li * 0.2, -0.46, -0.24], [0.06, 0.18, 0.05], 'Hind legs pack pollen pellets.', { k: 'cyl', r: 0.022, h: 0.16 }),
        ]),
      ],
      abdomen: [
        P('Abdomen', [0.35, 0.02, 0], [0.9, 0.42, 0.38], 'The abdomen holds digestion, wax glands and the sting.', { k: 'cap', r: 0.2, h: 0.5, rot: [0, 0, Math.PI / 2] }),
        ...chain(5, (i) => P(`Tergite band ${i}`, [0.05 + i * 0.16, 0.02, 0], [0.1, 0.4, 0.36], `Tergite ${i}: the striped exoskeleton plate.`, { k: 'cyl', r: 0.19 - i * 0.012, h: 0.09, rot: [0, 0, Math.PI / 2], c: i % 2 ? '#8a5a20' : '#e0b45a' })),
        P('Sting', [0.86, -0.04, 0], [0.22, 0.04, 0.04], 'The sting is a modified ovipositor with barbs.', { k: 'cone', r: 0.02, h: 0.2, rot: [0, 0, -Math.PI / 2] }),
        P('Barb pair', [0.94, -0.05, 0], [0.05, 0.03, 0.05], 'Barbs anchor the sting — fatal for the worker.', { k: 'box' }),
        P('Venom sac', [0.7, -0.02, 0], [0.16, 0.12, 0.12], 'The venom sac pumps melittin into the wound.', { k: 'sph', r: 0.07, c: '#d8d0c0' }),
        ...chain(4, (i) => P(`Wax gland ${i}`, [0.2 + i * 0.12, -0.16, 0.06], [0.08, 0.03, 0.08], `Wax gland ${i} on the ventral plates secretes comb wax.`, { k: 'box', c: '#efe6cf' })),
      ],
      digestion: [
        P('Honey stomach (crop)', [-0.15, 0, 0], [0.24, 0.2, 0.2], 'The honey stomach carries nectar home — separate from the true gut.', { k: 'sph', r: 0.11 }),
        P('Proventriculus', [0.02, 0, 0], [0.1, 0.1, 0.1], 'The proventriculus valves honey into the midgut when fuel is needed.', { k: 'cyl', r: 0.04, h: 0.08, rot: [0, 0, Math.PI / 2] }),
        P('Midgut', [0.3, 0, 0], [0.5, 0.14, 0.14], 'The midgut digests pollen protein.', { k: 'tube', pts: [[0.1, 0, 0], [0.35, 0.02, 0], [0.6, 0, 0]], r: 0.06 }),
        P('Malpighian tubule L', [0.5, 0.06, 0.06], [0.3, 0.04, 0.04], 'Malpighian tubules excrete nitrogen waste.', { k: 'tube', pts: [[0.45, 0.05, 0.05], [0.6, 0.1, 0.08], [0.7, 0.04, 0.05]], r: 0.015 }),
        P('Malpighian tubule R', [0.5, 0.06, -0.06], [0.3, 0.04, 0.04], 'They also balance ions and water.', { k: 'tube', pts: [[0.45, 0.05, -0.05], [0.6, 0.1, -0.08], [0.7, 0.04, -0.05]], r: 0.015 }),
        P('Rectum', [0.72, 0.02, 0], [0.12, 0.1, 0.1], 'The rectum reabsorbs water; bees never foul the hive.', { k: 'sph', r: 0.06 }),
      ],
      respiration: [
        ...chain(10, (i) => P(`Spiracle pair ${i}`, [-0.8 + i * 0.18, 0.06, 0.19], [0.04, 0.05, 0.03], `Spiracle ${i}: a valved door into the tracheal system.`, { k: 'sph', r: 0.02, c: '#6f8ea6' })),
        P('Tracheal trunk L', [0, 0.08, 0.12], [2.0, 0.05, 0.05], 'Tracheal trunks deliver air straight to tissue — no blood involved.', { k: 'tube', pts: [[-0.9, 0.08, 0.12], [0, 0.09, 0.13], [0.8, 0.06, 0.11]], r: 0.02 }),
        P('Tracheal trunk R', [0, 0.08, -0.12], [2.0, 0.05, 0.05], 'Air sacs bellows with flight muscle.', { k: 'tube', pts: [[-0.9, 0.08, -0.12], [0, 0.09, -0.13], [0.8, 0.06, -0.11]], r: 0.02 }),
        P('Air sac (thoracic)', [-0.5, 0.1, 0], [0.3, 0.2, 0.24], 'Thoracic air sacs boost oxygen during flight.', { k: 'sph', r: 0.12, c: '#bcd6e6' }),
      ],
      nerve: [
        P('Brain (supraoesophageal ganglion)', [-1.05, 0.1, 0], [0.14, 0.12, 0.14], 'The bee brain maps flowers, sun compass and dance language.', { k: 'sph', r: 0.07 }),
        P('Ventral nerve cord', [-0.2, -0.1, 0], [1.6, 0.04, 0.04], 'The ventral cord links head to sting reflexes.', { k: 'tube', pts: [[-0.95, -0.08, 0], [-0.2, -0.1, 0], [0.7, -0.08, 0]], r: 0.016 }),
        ...chain(5, (i) => P(`Abdominal ganglion ${i}`, [0.05 + i * 0.15, -0.09, 0], [0.06, 0.05, 0.05], `Ganglion ${i} coordinates abdominal pumping and sting.`, { k: 'sph', r: 0.026, c: '#f0e3a0' })),
      ],
    },
  },
  frog: {
    label: 'Frog Dissection',
    eyebrow: 'ZOOLOGY',
    description: 'A ventral view of frog anatomy: three-chamber heart, lungs, liver lobes, urogenital system and jumping skeleton.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['tympanum', 'nictitating', 'conus', 'cloaca', 'fat bodies', 'tibiofibula', 'urostyle', 'gall bladder'],
    systems: [
      { id: 'external', label: 'External features', color: '#7fa35c' },
      { id: 'cardio', label: 'Heart & lungs', color: '#c0504d' },
      { id: 'digestion', label: 'Digestive organs', color: '#d8b25c' },
      { id: 'urogenital', label: 'Urogenital system', color: '#b98ad1' },
      { id: 'skeleton', label: 'Skeleton', color: '#e8e2d0' },
    ],
    parts: {
      external: [
        P('Body (trunk)', [0, 0, 0], [1.5, 0.5, 1.1], 'The trunk fuses head and body — frogs have no neck.', { k: 'cap', r: 0.5, h: 0.6, rot: [0, 0, Math.PI / 2], c: '#86a866' }),
        P('Head & snout', [-0.95, 0.02, 0], [0.7, 0.44, 0.8], 'The broad snout houses a wide mouth for swallowing whole.', { k: 'cap', r: 0.36, h: 0.2, rot: [0, 0, Math.PI / 2], c: '#8fb06d' }),
        P('Eye L', [-1.05, 0.28, 0.28], [0.2, 0.2, 0.2], 'Eyes bulge for a wide field of view.', { k: 'sph', r: 0.11, c: '#d8b25c' }),
        P('Eye R', [-1.05, 0.28, -0.28], [0.2, 0.2, 0.2], 'Retracted eyes help push food down the throat.', { k: 'sph', r: 0.11, c: '#d8b25c' }),
        P('Nictitating membrane L', [-1.05, 0.28, 0.34], [0.14, 0.14, 0.04], 'The nictitating membrane moistens and shields the eye underwater.', { k: 'sph', r: 0.07, c: '#e8e2d0' }),
        P('Nictitating membrane R', [-1.05, 0.28, -0.34], [0.14, 0.14, 0.04], 'It is transparent enough to see through while diving.', { k: 'sph', r: 0.07, c: '#e8e2d0' }),
        P('Tympanum L', [-0.85, 0.1, 0.42], [0.2, 0.2, 0.06], 'The tympanum (eardrum) sits flush behind each eye.', { k: 'cyl', r: 0.1, h: 0.03, rot: [Math.PI / 2, 0, 0], c: '#6d8a52' }),
        P('Tympanum R', [-0.85, 0.1, -0.42], [0.2, 0.2, 0.06], 'Size relative to the eye hints at sex in many species.', { k: 'cyl', r: 0.1, h: 0.03, rot: [Math.PI / 2, 0, 0], c: '#6d8a52' }),
        P('Foreleg L', [-0.7, -0.2, 0.62], [0.5, 0.14, 0.14], 'Forelegs absorb landing impact.', { k: 'cyl', r: 0.06, h: 0.5, rot: [Math.PI / 2.4, 0, 0.5] }),
        P('Foreleg R', [-0.7, -0.2, -0.62], [0.5, 0.14, 0.14], 'Four toes grip surfaces.', { k: 'cyl', r: 0.06, h: 0.5, rot: [-Math.PI / 2.4, 0, 0.5] }),
        P('Hindleg femur L', [0.55, -0.1, 0.55], [0.6, 0.18, 0.18], 'Powerful femur muscles launch the jump.', { k: 'cyl', r: 0.08, h: 0.6, rot: [Math.PI / 2.6, 0, -0.4] }),
        P('Hindleg tibiofibula L', [0.95, -0.12, 0.95], [0.6, 0.14, 0.14], 'The fused tibiofibula stiffens the leap.', { k: 'cyl', r: 0.06, h: 0.6, rot: [Math.PI / 2.2, 0, 0.5] }),
        P('Webbed foot L', [1.25, -0.14, 1.35], [0.5, 0.08, 0.4], 'Webbed feet paddle like flippers.', { k: 'box', c: '#7c9c5e' }),
        P('Hindleg femur R', [0.55, -0.1, -0.55], [0.6, 0.18, 0.18], 'Leg length scales with jump distance.', { k: 'cyl', r: 0.08, h: 0.6, rot: [-Math.PI / 2.6, 0, -0.4] }),
        P('Hindleg tibiofibula R', [0.95, -0.12, -0.95], [0.6, 0.14, 0.14], 'Fused bones resist bending stress.', { k: 'cyl', r: 0.06, h: 0.6, rot: [-Math.PI / 2.2, 0, 0.5] }),
        P('Webbed foot R', [1.25, -0.14, -1.35], [0.5, 0.08, 0.4], 'Toes end in sticky discs in tree frogs.', { k: 'box', c: '#7c9c5e' }),
      ],
      cardio: [
        P('Right atrium', [-0.55, 0.24, 0.1], [0.24, 0.18, 0.18], 'The right atrium receives oxygen-poor blood from the body.', { k: 'sph', r: 0.11, c: '#8f3a3a' }),
        P('Left atrium', [-0.55, 0.24, -0.1], [0.24, 0.18, 0.18], 'The left atrium receives oxygen-rich blood from lungs and skin.', { k: 'sph', r: 0.11, c: '#c0504d' }),
        P('Single ventricle', [-0.42, 0.22, 0], [0.22, 0.2, 0.2], 'One ventricle mixes blood — trabeculae limit the mixing.', { k: 'sph', r: 0.12 }),
        P('Conus arteriosus', [-0.3, 0.24, 0], [0.18, 0.1, 0.1], 'The conus arteriosus steers blood to lungs vs body.', { k: 'cyl', r: 0.045, h: 0.16, rot: [0, 0, Math.PI / 2] }),
        P('Lung L', [-0.15, 0.2, 0.28], [0.5, 0.18, 0.2], 'Simple sac lungs — skin does much of the breathing.', { k: 'cap', r: 0.09, h: 0.34, rot: [0, 0, Math.PI / 2], c: '#e0a0a0' }),
        P('Lung R', [-0.15, 0.2, -0.28], [0.5, 0.18, 0.2], 'Buccal pumping pushes air in and out.', { k: 'cap', r: 0.09, h: 0.34, rot: [0, 0, Math.PI / 2], c: '#e0a0a0' }),
      ],
      digestion: [
        P('Liver lobe L', [0.05, 0.2, 0.22], [0.4, 0.16, 0.24], 'The multi-lobed liver processes nutrients and stores glycogen.', { k: 'box', c: '#8a4a3a' }),
        P('Liver lobe R', [0.05, 0.2, -0.22], [0.4, 0.16, 0.24], 'Bile flows to the gall bladder.', { k: 'box', c: '#8a4a3a' }),
        P('Gall bladder', [0.18, 0.24, 0], [0.1, 0.1, 0.1], 'The gall bladder concentrates bile for fat digestion.', { k: 'sph', r: 0.05, c: '#6d8a52' }),
        P('Stomach', [0.25, 0.18, 0.12], [0.34, 0.16, 0.16], 'The stomach curves along the left side.', { k: 'cap', r: 0.08, h: 0.2, rot: [0, 0, Math.PI / 2], c: '#d8a08a' }),
        P('Spleen', [0.3, 0.22, -0.14], [0.1, 0.1, 0.1], 'The spleen recycles blood cells and mounts immunity.', { k: 'sph', r: 0.05, c: '#7a4a5a' }),
        P('Pancreas', [0.3, 0.16, 0.05], [0.2, 0.06, 0.06], 'The pancreas sits in the mesentery between stomach and duodenum.', { k: 'box', c: '#e0c08a' }),
        P('Small intestine', [0.5, 0.16, 0], [0.5, 0.12, 0.3], 'Coiled small intestine absorbs digested food.', { k: 'tube', pts: [[0.4, 0.16, 0.1], [0.55, 0.16, -0.1], [0.45, 0.16, -0.2], [0.62, 0.16, 0.05]], r: 0.05, c: '#d8b290' }),
        P('Large intestine', [0.72, 0.16, 0], [0.24, 0.14, 0.14], 'The short large intestine leads to the cloaca.', { k: 'cyl', r: 0.07, h: 0.22, rot: [0, 0, Math.PI / 2], c: '#c09a7a' }),
        P('Cloaca', [0.86, 0.14, 0], [0.12, 0.12, 0.12], 'The cloaca is the shared exit for gut, urine and eggs.', { k: 'sph', r: 0.06 }),
      ],
      urogenital: [
        P('Kidney L', [0.55, 0.12, 0.2], [0.4, 0.1, 0.12], 'Kidneys filter blood and balance water.', { k: 'box', c: '#7a4a3a' }),
        P('Kidney R', [0.55, 0.12, -0.2], [0.4, 0.1, 0.12], 'Frogs excrete mostly urea on land, ammonia in water.', { k: 'box', c: '#7a4a3a' }),
        P('Urinary bladder', [0.8, 0.12, 0.06], [0.2, 0.1, 0.16], 'The bladder stores urine and reabsorbs water.', { k: 'sph', r: 0.09, c: '#c9b8d8' }),
        P('Ureter L', [0.68, 0.12, 0.16], [0.3, 0.04, 0.04], 'Ureters carry urine to the cloaca.', { k: 'tube', pts: [[0.6, 0.12, 0.18], [0.8, 0.12, 0.1]], r: 0.015 }),
        P('Ureter R', [0.68, 0.12, -0.16], [0.3, 0.04, 0.04], 'In males they also carry sperm.', { k: 'tube', pts: [[0.6, 0.12, -0.18], [0.8, 0.12, -0.1]], r: 0.015 }),
        P('Fat body L', [0.35, 0.18, 0.26], [0.24, 0.1, 0.1], 'Fat bodies fuel winter dormancy and breeding.', { k: 'box', c: '#e8d48b' }),
        P('Fat body R', [0.35, 0.18, -0.26], [0.24, 0.1, 0.1], 'They shrink visibly after hibernation.', { k: 'box', c: '#e8d48b' }),
        P('Testis / ovary', [0.45, 0.14, 0], [0.2, 0.1, 0.14], 'Gonads sit medial to the kidneys, seasonal in size.', { k: 'sph', r: 0.08, c: '#d3b1e6' }),
      ],
      skeleton: [
        P('Skull', [-0.95, 0.05, 0], [0.6, 0.3, 0.6], 'The flat skull is mostly fused bone with big orbits.', { k: 'box', c: '#e8e2d0' }),
        ...chain(7, (i) => P(`Vertebra ${i}`, [-0.45 + i * 0.16, 0.05, 0], [0.14, 0.12, 0.12], `Presacral vertebra ${i} of seven — frogs have a short, stiff spine.`, { k: 'cyl', r: 0.06, h: 0.13, rot: [0, 0, Math.PI / 2], c: '#ded8c6' })),
        P('Urostyle', [0.75, 0.05, 0], [0.5, 0.1, 0.1], 'The urostyle is a fused rod transmitting jump force.', { k: 'cone', r: 0.05, h: 0.5, rot: [0, 0, -Math.PI / 2], c: '#ded8c6' }),
        P('Radioulna L', [-0.72, -0.12, 0.5], [0.4, 0.1, 0.1], 'Fused radius+ulna strengthen the forelimb.', { k: 'cyl', r: 0.04, h: 0.4, rot: [Math.PI / 2.4, 0, 0.5], c: '#e8e2d0' }),
        P('Radioulna R', [-0.72, -0.12, -0.5], [0.4, 0.1, 0.1], 'One bone where mammals have two.', { k: 'cyl', r: 0.04, h: 0.4, rot: [-Math.PI / 2.4, 0, 0.5], c: '#e8e2d0' }),
        P('Femur bone L', [0.55, -0.05, 0.5], [0.5, 0.1, 0.1], 'The femur levers the body upward.', { k: 'cyl', r: 0.045, h: 0.5, rot: [Math.PI / 2.6, 0, -0.4], c: '#e8e2d0' }),
        P('Femur bone R', [0.55, -0.05, -0.5], [0.5, 0.1, 0.1], 'Muscle attaches along its crest.', { k: 'cyl', r: 0.045, h: 0.5, rot: [-Math.PI / 2.6, 0, -0.4], c: '#e8e2d0' }),
        P('Tibiofibula bone L', [0.95, -0.08, 0.9], [0.5, 0.09, 0.09], 'Fused tibia+fibula act as a spring.', { k: 'cyl', r: 0.04, h: 0.5, rot: [Math.PI / 2.2, 0, 0.5], c: '#e8e2d0' }),
        P('Tibiofibula bone R', [0.95, -0.08, -0.9], [0.5, 0.09, 0.09], 'Ankle bones elongate into a second lever.', { k: 'cyl', r: 0.04, h: 0.5, rot: [-Math.PI / 2.2, 0, 0.5], c: '#e8e2d0' }),
      ],
    },
  },
  cell: {
    label: 'Eukaryotic Cell',
    eyebrow: 'CELL BIOLOGY',
    description: 'Tour a generalised animal cell: nucleus, endomembrane flow, mitochondria, ribosomes and the cytoskeleton.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['nucleolus', 'ribosome', 'golgi', 'lysosome', 'microtubule', 'cristae', 'vesicle', 'centriole'],
    systems: [
      { id: 'nucleus', label: 'Nucleus', color: '#7a6ad1' },
      { id: 'endomembrane', label: 'Endomembrane system', color: '#d8b25c' },
      { id: 'energy', label: 'Mitochondria', color: '#c0504d' },
      { id: 'synthesis', label: 'Ribosomes', color: '#8fb8d8' },
      { id: 'cytoskeleton', label: 'Cytoskeleton', color: '#7fa8c9' },
      { id: 'membrane', label: 'Plasma membrane', color: '#9ad0c0' },
    ],
    parts: {
      nucleus: [
        P('Nucleus', [0, 0.9, 0], [1.5, 1.5, 1.5], 'The nucleus stores the genome and directs the cell.', { k: 'sph', r: 0.75, c: '#8d7ce0', op: 0.55 }),
        P('Nuclear envelope', [0, 0.9, 0], [1.62, 1.62, 1.62], 'A double membrane continuous with the rough ER.', { k: 'sph', r: 0.81, c: '#a99bf0', op: 0.22 }),
        P('Nucleolus', [0.15, 1.0, 0.1], [0.5, 0.5, 0.5], 'The nucleolus assembles ribosomal RNA and subunits.', { k: 'sph', r: 0.26, c: '#5a4ab0' }),
        ...ring(16, 0.8, (i, pos) => P(`Nuclear pore ${i}`, [pos[0], pos[1] + 0.9, pos[2]], [0.1, 0.1, 0.1], `Nuclear pore ${i}: a gated channel for mRNA and proteins.`, { k: 'cyl', r: 0.05, h: 0.1, c: '#c9bdf5' })),
      ],
      endomembrane: [
        P('Rough ER', [-0.9, 0.9, 0.7], [1.4, 0.8, 0.5], 'Rough ER folds proteins studded with ribosomes.', { k: 'tube', pts: [[-1.2, 0.6, 0.8], [-0.8, 1.0, 0.9], [-1.1, 1.3, 0.7], [-0.7, 1.5, 0.9]], r: 0.09, c: '#d8b25c' }),
        P('Smooth ER', [0.9, 0.8, -0.7], [1.2, 0.7, 0.5], 'Smooth ER makes lipids and detoxifies.', { k: 'tube', pts: [[1.1, 0.5, -0.8], [0.8, 0.9, -0.9], [1.2, 1.2, -0.7]], r: 0.08, c: '#e6cf8f' }),
        ...chain(5, (i) => P(`Golgi cisterna ${i}`, [1.3, 1.3 + i * 0.12, 0.5], [0.8 - i * 0.06, 0.07, 0.5], `Cisterna ${i} of the Golgi: modifies, sorts and ships proteins.`, { k: 'cap', r: 0.05, h: 0.6 - i * 0.05, rot: [0, 0, Math.PI / 2], c: '#e0b45a' })),
        ...chain(6, (i) => P(`Transport vesicle ${i}`, [1.6 + (i % 3) * 0.18, 1.1 + i * 0.14, 0.75], [0.14, 0.14, 0.14], `Vesicle ${i} buds off carrying cargo to the membrane.`, { k: 'sph', r: 0.07, c: '#f0d896' })),
        ...chain(4, (i) => P(`Lysosome ${i}`, [-1.3 + i * 0.25, 0.5, -1.0], [0.2, 0.2, 0.2], `Lysosome ${i}: acid enzymes digest worn-out parts.`, { k: 'sph', r: 0.1, c: '#c98274' })),
        P('Peroxisome', [-1.5, 1.2, -0.5], [0.2, 0.2, 0.2], 'Peroxisomes break down fatty acids and hydrogen peroxide.', { k: 'sph', r: 0.1, c: '#d8a08a' }),
      ],
      energy: [
        ...chain(6, (i) => {
          const a = (i / 6) * Math.PI * 2
          return P(`Mitochondrion ${i}`, [Math.cos(a) * 1.5, 0.7 + (i % 2) * 0.5, Math.sin(a) * 1.5], [0.6, 0.3, 0.3], `Mitochondrion ${i}: cristae fold the inner membrane for ATP output.`, { k: 'cap', r: 0.15, h: 0.34, rot: [0, a, Math.PI / 2.4], c: '#c0504d' })
        }),
        ...chain(6, (i) => {
          const a = (i / 6) * Math.PI * 2
          return P(`Cristae fold ${i}`, [Math.cos(a) * 1.5, 0.7 + (i % 2) * 0.5, Math.sin(a) * 1.5], [0.4, 0.2, 0.2], `Inner cristae of mitochondrion ${i} multiply surface for the electron transport chain.`, { k: 'tube', pts: [[-0.12, 0, 0], [0, 0.06, 0], [0.12, 0, 0]], r: 0.04, c: '#e08080' })
        }),
      ],
      synthesis: [
        ...ring(24, 1.9, (i, pos) => P(`Free ribosome ${i}`, [pos[0] * 0.9, pos[1] * 0.55 + 0.9, pos[2] * 0.9], [0.08, 0.08, 0.08], `Ribosome ${i}: reads mRNA into protein chains.`, { k: 'sph', r: 0.04, c: '#8fb8d8' })),
        ...chain(12, (i) => P(`Bound ribosome ${i}`, [-1.15 + (i % 4) * 0.15, 0.75 + Math.floor(i / 4) * 0.3, 0.98], [0.07, 0.07, 0.07], `Ribosome docked on rough ER, threading new protein inside.`, { k: 'sph', r: 0.035, c: '#a8c8e0' })),
      ],
      cytoskeleton: [
        ...chain(8, (i) => {
          const a = (i / 8) * Math.PI * 2
          return P(`Microtubule ${i}`, [Math.cos(a) * 1.1, 0.9, Math.sin(a) * 1.1], [2.2, 0.04, 0.04], `Microtubule ${i}: a stiff track for organelle traffic and the mitotic spindle.`, { k: 'tube', pts: [[0, 0.9, 0], [Math.cos(a) * 1.1, 0.9 + 0.2, Math.sin(a) * 1.1], [Math.cos(a) * 2.1, 0.8, Math.sin(a) * 2.1]], r: 0.02, c: '#7fa8c9' })
        }),
        P('Centriole pair', [0.5, 0.4, -0.5], [0.3, 0.3, 0.3], 'Centrioles organise microtubules during division.', { k: 'cyl', r: 0.08, h: 0.26, c: '#9cc3de' }),
        P('Centriole (daughter)', [0.68, 0.42, -0.42], [0.24, 0.24, 0.24], 'The pair sits at right angles in the centrosome.', { k: 'cyl', r: 0.07, h: 0.22, rot: [0, 0, Math.PI / 2], c: '#9cc3de' }),
        ...chain(4, (i) => P(`Actin filament bundle ${i}`, [Math.cos(i * 1.7) * 1.6, 0.5 + i * 0.2, Math.sin(i * 1.7) * 1.6], [1.2, 0.03, 0.03], 'Actin bundles shape the cortex and drive crawling.', { k: 'tube', pts: [[Math.cos(i * 1.7) * 0.9, 0.6 + i * 0.15, Math.sin(i * 1.7) * 0.9], [Math.cos(i * 1.7) * 2.0, 0.5 + i * 0.2, Math.sin(i * 1.7) * 2.0]], r: 0.015, c: '#b8d4e8' })),
      ],
      membrane: [
        P('Plasma membrane', [0, 0.9, 0], [4.6, 4.6, 4.6], 'The phospholipid bilayer gates everything entering or leaving.', { k: 'sph', r: 2.3, c: '#9ad0c0', op: 0.14 }),
        ...ring(10, 2.28, (i, pos) => P(`Membrane protein ${i}`, [pos[0], pos[1] + 0.9, pos[2]], [0.16, 0.16, 0.16], `Integral protein ${i}: channels, pumps and receptors in the bilayer.`, { k: 'cap', r: 0.07, h: 0.1, c: '#5aa896' })),
      ],
    },
  },
  giza: {
    label: 'Great Pyramid of Giza',
    eyebrow: 'HISTORY & ARCHAEOLOGY',
    description: 'Khufu\u2019s pyramid opened up: core courses, casing stones, three chambers and the passage network that links them.',
    tutorId: 'dr-nkosi',
    labId: 'history',
    floor: 1,
    keyTerms: ['course', 'casing stone', "King's Chamber", 'Grand Gallery', 'relieving stones', 'well shaft', 'air shaft', 'sarcophagus'],
    systems: [
      { id: 'structure', label: 'Core masonry', color: '#d8c08a' },
      { id: 'casing', label: 'Casing & capstone', color: '#efe6cf' },
      { id: 'chambers', label: 'Chambers', color: '#c0504d' },
      { id: 'passages', label: 'Passages', color: '#8fb8d8' },
      { id: 'shafts', label: 'Air shafts', color: '#9ad0c0' },
    ],
    parts: {
      structure: [
        ...chain(40, (n) => {
          const half = 2.05 * (1 - n / 46)
          return P(`Core course ${n}`, [0, n * 0.065 - 0.03, 0], [half * 2, 0.062, half * 2], `Course ${n} of ~201: locally-quarried limestone blocks, each tier narrower than the last.`)
        }),
        P('Bedrock knoll', [0, -0.12, 0], [3.4, 0.2, 3.4], 'The pyramid sits on a levelled bedrock knoll, cored by a natural mound.', { c: '#a89468' }),
      ],
      casing: [
        ...chain(24, (j) => {
          const t = (j - 1) / 24
          const y = t * 2.5 + 0.05
          const z = -(2.02 * (1 - t)) - 0.04
          return P(`Casing stone ${j}`, [((j % 5) - 2) * 0.7, y, z], [0.66, 0.1, 0.3], `Polished Tura limestone casing ${j}: the original surface gleamed white at 52\u00b0.`, { rot: [0.9, 0, 0], c: '#f4eeda' })
        }),
        P('Pyramidion (capstone)', [0, 2.66, 0], [0.3, 0.24, 0.3], 'The capstone closed the apex — likely gold-sheathed in sunlight.', { k: 'cone', r: 0.2, h: 0.24, c: '#e0b45a' }),
      ],
      chambers: [
        P("King's Chamber", [0.5, 1.05, 0], [0.72, 0.34, 0.44], "Granite King's Chamber: five relieving beams above span 10\u00d75\u00d75.8 m.", { c: '#b06a5a' }),
        P('Sarcophagus', [0.62, 1.0, 0], [0.34, 0.2, 0.16], 'The lidless granite sarcophagus was placed before the chamber was roofed.', { c: '#8a4a3a' }),
        ...chain(5, (i) => P(`Relieving beam tier ${i}`, [0.5, 1.28 + i * 0.1, 0], [0.74, 0.06, 0.46], `Granite tier ${i} of five deflecting the mountain of masonry above.`, { c: '#9a5a4a' })),
        P("Queen's Chamber", [0.35, 0.62, 0], [0.5, 0.24, 0.4], "The so-called Queen's Chamber holds a niche — likely a serdab for a statue.", { c: '#c98274' }),
        P('Subterranean chamber', [0.2, -0.55, 0], [0.8, 0.3, 0.5], 'The unfinished rock-cut chamber lies 30 m below the desert floor.', { c: '#7a6a52' }),
        P('Grand Gallery', [0.15, 0.85, 0.18], [1.5, 0.26, 0.16], 'The corbelled Grand Gallery climbs 47 m at 26\u00b0 — a marvel of stone cantilevering.', { rot: [0, 0, 0.46], c: '#d8a08a' }),
      ],
      passages: [
        P('Descending passage', [-0.9, -0.1, 0], [2.2, 0.12, 0.12], 'The original descending passage drops from the north face to bedrock.', { k: 'tube', pts: [[-1.9, 0.62, 0], [-0.6, -0.3, 0], [0.2, -0.55, 0]], r: 0.05, c: '#a8c8e0' }),
        P('Ascending passage', [-0.75, 0.35, 0], [1.4, 0.12, 0.12], 'The ascending passage branches up toward the Grand Gallery.', { k: 'tube', pts: [[-1.55, 0.1, 0], [-0.5, 0.62, 0]], r: 0.05, c: '#a8c8e0' }),
        P("Queen's passage", [-0.2, 0.6, 0], [0.8, 0.1, 0.1], 'A horizontal corridor runs to the Queen\u2019s Chamber.', { k: 'tube', pts: [[-0.5, 0.62, 0], [0.1, 0.62, 0]], r: 0.045, c: '#bcd6e6' }),
        P('Well shaft', [-0.55, -0.1, 0.25], [0.1, 1.6, 0.1], 'The winding well shaft links the Grand Gallery base to the descending passage.', { k: 'tube', pts: [[-0.35, 0.6, 0.2], [-0.7, 0.1, 0.3], [-0.6, -0.3, 0.2], [-0.75, -0.45, 0.1]], r: 0.04, c: '#8fb8d8' }),
        P('Robbers\u2019 tunnel', [-1.3, 0.25, 0.3], [0.7, 0.14, 0.14], 'Al-Ma\u2019mun\u2019s 9th-century tunnel is today\u2019s tourist entrance.', { k: 'tube', pts: [[-1.7, 0.1, 0.45], [-1.2, 0.35, 0.2], [-0.9, 0.45, 0.05]], r: 0.06, c: '#9a8a6a' }),
      ],
      shafts: [
        P('North air shaft (King\u2019s)', [0.2, 1.4, 0.1], [1.6, 0.06, 0.06], 'Star-aligned shafts vented the king\u2019s soul toward circumpolar stars.', { k: 'tube', pts: [[0.5, 1.15, 0.1], [-0.2, 1.7, 0.1], [-0.9, 2.1, 0.1]], r: 0.025 }),
        P('South air shaft (King\u2019s)', [0.8, 1.4, -0.1], [1.6, 0.06, 0.06], 'The southern pair aimed at Orion\u2019s belt.', { k: 'tube', pts: [[0.5, 1.15, -0.1], [1.2, 1.7, -0.1], [1.7, 2.05, -0.1]], r: 0.025 }),
        P('North air shaft (Queen\u2019s)', [0.0, 0.95, 0.1], [1.2, 0.05, 0.05], 'The Queen\u2019s Chamber shafts stop short of the surface — sealed blind.', { k: 'tube', pts: [[0.35, 0.72, 0.1], [-0.2, 1.1, 0.1]], r: 0.02 }),
        P('South air shaft (Queen\u2019s)', [0.7, 0.95, -0.1], [1.2, 0.05, 0.05], 'Robots found a hidden door and a small hidden chamber.', { k: 'tube', pts: [[0.35, 0.72, -0.1], [0.9, 1.1, -0.1]], r: 0.02 }),
        P('Original entrance', [-1.62, 0.5, 0], [0.3, 0.24, 0.3], 'A swivel-stone doorway, hidden by casing, once closed the north face.', { rot: [0, 0, 0.46], c: '#c9b98a' }),
      ],
    },
  },
  locomotive: {
    label: 'Steam Locomotive',
    eyebrow: 'INDUSTRIAL ENGINEERING',
    description: 'Follow the energy: firebox to boiler steam, cylinders to coupling rods — the machine that industrialised the world.',
    tutorId: 'dr-ward',
    labId: 'physics',
    floor: 3,
    keyTerms: ['firebox', 'smokebox', 'superheater', 'piston', 'coupling rod', 'valve gear', 'tender', 'safety valve'],
    systems: [
      { id: 'boiler', label: 'Boiler circuit', color: '#c0504d' },
      { id: 'motion', label: 'Cylinders & motion', color: '#8fb8d8' },
      { id: 'frame', label: 'Frame & wheels', color: '#5a6a7a' },
      { id: 'tender', label: 'Tender', color: '#7a6a52' },
      { id: 'cab', label: 'Cab & controls', color: '#d8b25c' },
    ],
    parts: {
      boiler: [
        P('Boiler barrel', [-0.5, 0.75, 0], [1.9, 0.62, 0.62], 'The boiler barrel holds water around a maze of fire tubes.', { k: 'cyl', r: 0.31, h: 1.9, rot: [0, 0, Math.PI / 2] }),
        ...chain(4, (i) => P(`Boiler band ${i}`, [-1.2 + i * 0.45, 0.75, 0], [0.06, 0.66, 0.66], `Steel band ${i} clenches the boiler courses against pressure.`, { k: 'tor', r: 0.32, t: 0.02, rot: [0, Math.PI / 2, 0] })),
        P('Firebox', [0.6, 0.6, 0], [0.6, 0.55, 0.55], 'Coal burns on the grate inside the firebox, heating the surrounding water jacket.', { c: '#8a3a2a' }),
        P('Grate & ashpan', [0.6, 0.32, 0], [0.55, 0.12, 0.5], 'The grate passes air up through the fuel bed; ash drops to the ashpan.', { c: '#4a4a4a' }),
        P('Smokebox', [-1.6, 0.75, 0], [0.45, 0.6, 0.6], 'Exhaust gases collect in the smokebox before the chimney.', { k: 'cyl', r: 0.3, h: 0.45, rot: [0, 0, Math.PI / 2], c: '#3a3a3a' }),
        P('Smokebox door', [-1.85, 0.75, 0], [0.08, 0.58, 0.58], 'The hinged door gives access to tubes and superheater headers.', { k: 'cyl', r: 0.29, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#2a2a2a' }),
        P('Chimney', [-1.6, 1.25, 0], [0.24, 0.4, 0.24], 'The chimney vents exhaust — and the blastpipe draught draws the fire.', { k: 'cone', r: 0.14, h: 0.4, c: '#2a2a2a' }),
        P('Steam dome', [-0.7, 1.15, 0], [0.34, 0.3, 0.34], 'The steam dome collects driest steam at the top of the boiler.', { k: 'sph', r: 0.17 }),
        P('Sand dome', [-0.1, 1.13, 0], [0.3, 0.26, 0.3], 'Sand trickles onto rails for grip in wet weather.', { k: 'sph', r: 0.15, c: '#c9b98a' }),
        P('Safety valve L', [0.35, 1.12, 0.12], [0.1, 0.2, 0.1], 'Spring-loaded safety valves lift above set pressure.', { k: 'cyl', r: 0.05, h: 0.2 }),
        P('Safety valve R', [0.35, 1.12, -0.12], [0.1, 0.2, 0.1], 'Their song told villagers a train was raising steam.', { k: 'cyl', r: 0.05, h: 0.2 }),
        P('Superheater header', [-1.35, 0.85, 0], [0.2, 0.24, 0.3], 'Superheater elements dry the steam, adding power and saving coal.', { k: 'box', c: '#b06a5a' }),
      ],
      motion: [
        P('Cylinder L', [-1.45, 0.42, 0.4], [0.5, 0.3, 0.3], 'Steam pushes the piston in alternating strokes.', { k: 'cyl', r: 0.15, h: 0.5, rot: [0, 0, Math.PI / 2] }),
        P('Cylinder R', [-1.45, 0.42, -0.4], [0.5, 0.3, 0.3], 'Valves admit steam at each end of the stroke.', { k: 'cyl', r: 0.15, h: 0.5, rot: [0, 0, Math.PI / 2] }),
        P('Piston rod L', [-1.1, 0.42, 0.4], [0.5, 0.06, 0.06], 'The piston rod transfers thrust to the crosshead.', { k: 'cyl', r: 0.03, h: 0.5, rot: [0, 0, Math.PI / 2], c: '#d0d8e0' }),
        P('Piston rod R', [-1.1, 0.42, -0.4], [0.5, 0.06, 0.06], 'Glands seal the rod against steam loss.', { k: 'cyl', r: 0.03, h: 0.5, rot: [0, 0, Math.PI / 2], c: '#d0d8e0' }),
        P('Main rod L', [-0.7, 0.42, 0.42], [0.8, 0.08, 0.08], 'The main rod drives the centre driver\u2019s crank pin.', { k: 'box', c: '#c0c8d0' }),
        P('Main rod R', [-0.7, 0.42, -0.42], [0.8, 0.08, 0.08], 'Its angle converts linear thrust into rotation.', { k: 'box', c: '#c0c8d0' }),
        P('Coupling rod L', [-0.3, 0.35, 0.46], [1.1, 0.07, 0.06], 'Coupling rods keep the three drivers in phase.', { k: 'box', c: '#d0d8e0' }),
        P('Coupling rod R', [-0.3, 0.35, -0.46], [1.1, 0.07, 0.06], 'Quartered cranks smooth the torque pulses.', { k: 'box', c: '#d0d8e0' }),
        ...chain(3, (i) => P(`Drive wheel L${i}`, [-0.85 + (i - 1) * 0.55, 0.35, 0.44], [0.34, 0.34, 0.08], `Driver L${i}: 1.7 m of balanced cast steel with counterweight.`, { k: 'cyl', r: 0.17, h: 0.07, rot: [Math.PI / 2, 0, 0], c: '#7a2a2a' })),
        ...chain(3, (i) => P(`Drive wheel R${i}`, [-0.85 + (i - 1) * 0.55, 0.35, -0.44], [0.34, 0.34, 0.08], `Driver R${i}: tyres are shrunk on and keyed.`, { k: 'cyl', r: 0.17, h: 0.07, rot: [Math.PI / 2, 0, 0], c: '#7a2a2a' })),
        P('Leading bogie L', [-1.6, 0.22, 0.35], [0.2, 0.2, 0.06], 'The swinging bogie steers into curves.', { k: 'cyl', r: 0.1, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' }),
        P('Leading bogie R', [-1.6, 0.22, -0.35], [0.2, 0.2, 0.06], 'Small wheels lead, big wheels drive.', { k: 'cyl', r: 0.1, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' }),
        P('Valve gear L', [-1.0, 0.55, 0.5], [0.9, 0.06, 0.05], 'Walschaerts valve gear times steam admission and cutoff.', { k: 'box', c: '#b0b8c0' }),
        P('Valve gear R', [-1.0, 0.55, -0.5], [0.9, 0.06, 0.05], 'Reversing shortens cutoff for economical running.', { k: 'box', c: '#b0b8c0' }),
      ],
      frame: [
        P('Frame plate L', [-0.4, 0.4, 0.32], [3.2, 0.16, 0.04], 'Thick frame plates carry every load between wheels and boiler.', { k: 'box', c: '#4a5a6a' }),
        P('Frame plate R', [-0.4, 0.4, -0.32], [3.2, 0.16, 0.04], 'Stretchers tie the plates together.', { k: 'box', c: '#4a5a6a' }),
        P('Buffer beam', [-1.95, 0.5, 0], [0.1, 0.3, 0.9], 'The buffer beam absorbs shunting shocks.', { k: 'box', c: '#8a2a2a' }),
        P('Buffer L', [-2.05, 0.5, 0.35], [0.16, 0.12, 0.12], 'Spring buffers cushion coupled stock.', { k: 'cyl', r: 0.06, h: 0.14, rot: [0, 0, Math.PI / 2], c: '#3a3a3a' }),
        P('Buffer R', [-2.05, 0.5, -0.35], [0.16, 0.12, 0.12], 'Screw couplings pull between them.', { k: 'cyl', r: 0.06, h: 0.14, rot: [0, 0, Math.PI / 2], c: '#3a3a3a' }),
        P('Running board', [-0.6, 0.62, 0.5], [2.6, 0.04, 0.2], 'The running board gives crews a walkway — and brakes inspection.', { k: 'box', c: '#5a6a7a' }),
        P('Trailing wheel L', [0.75, 0.25, 0.35], [0.24, 0.24, 0.06], 'Trailing wheels carry the firebox weight.', { k: 'cyl', r: 0.12, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' }),
        P('Trailing wheel R', [0.75, 0.25, -0.35], [0.24, 0.24, 0.06], 'They allow a wide grate behind the drivers.', { k: 'cyl', r: 0.12, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' }),
      ],
      tender: [
        P('Tender tank', [1.9, 0.6, 0], [1.1, 0.5, 0.7], 'The tender carries thousands of litres of feed water.', { k: 'box', c: '#3a4a3a' }),
        P('Coal space', [1.9, 0.95, -0.1], [0.8, 0.25, 0.45], 'Coal is piled ahead of the fireman\u2019s side.', { k: 'box', c: '#2a2a2a' }),
        ...chain(4, (i) => P(`Tender wheel ${i}`, [1.45 + (i % 2) * 0.9, 0.22, i < 3 ? 0.42 : -0.42], [0.22, 0.22, 0.06], `Tender axle wheel ${i}: six or eight wheels spread the load.`, { k: 'cyl', r: 0.11, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' })),
        P('Water scoop', [1.9, 0.15, 0], [0.4, 0.1, 0.15], 'At speed, a scoop lifts water from track troughs.', { k: 'box', c: '#4a5a6a' }),
      ],
      cab: [
        P('Cab', [1.15, 1.0, 0], [0.6, 0.6, 0.8], 'The cab shelters driver and fireman over the controls.', { k: 'box', c: '#6a4a2a' }),
        P('Cab roof', [1.15, 1.35, 0], [0.7, 0.06, 0.9], 'The roof curves to shed rain and tunnel soot.', { k: 'box', c: '#4a3a2a' }),
        P('Regulator handle', [0.95, 1.05, 0.2], [0.2, 0.05, 0.05], 'The regulator is the throttle — steam on or off.', { k: 'box', c: '#d8b25c' }),
        P('Reverser wheel', [0.95, 0.95, -0.2], [0.16, 0.16, 0.06], 'The reverser sets cutoff — the gearbox of steam.', { k: 'cyl', r: 0.08, h: 0.04, rot: [Math.PI / 2, 0, 0], c: '#b0b8c0' }),
        P('Boiler pressure gauge', [0.92, 1.15, 0], [0.14, 0.14, 0.05], 'The gauge shows working pressure — the red line is law.', { k: 'cyl', r: 0.07, h: 0.03, rot: [Math.PI / 2, 0, 0], c: '#efe6cf' }),
        P('Whistle', [0.8, 1.4, 0.15], [0.06, 0.24, 0.06], 'Steam through the whistle chord signals the line ahead.', { k: 'cyl', r: 0.03, h: 0.24, c: '#e0b45a' }),
      ],
    },
  },
  rocket: {
    label: 'Orbital Rocket',
    eyebrow: 'SPACE SYSTEMS',
    description: 'A three-stage launch vehicle peeled apart: engines, tanks, interstages, payload fairing and escape tower.',
    tutorId: 'prof-thorne',
    labId: 'physics',
    floor: 3,
    keyTerms: ['first stage', 'lox', 'rp-1', 'interstage', 'fairing', 'escape tower', 'gimbal', 'ullage'],
    systems: [
      { id: 'stage1', label: 'First stage', color: '#c98274' },
      { id: 'stage2', label: 'Second stage', color: '#8fb8d8' },
      { id: 'stage3', label: 'Third stage', color: '#9ad0c0' },
      { id: 'payload', label: 'Payload', color: '#d8b25c' },
      { id: 'tower', label: 'Escape tower', color: '#c0504d' },
    ],
    parts: {
      stage1: [
        P('First stage tank', [0, 0.9, 0], [1.0, 1.7, 1.0], 'The first stage holds RP-1 fuel and liquid oxygen at \u2212183\u00b0C.', { k: 'cyl', r: 0.5, h: 1.7 }),
        P('LOX tank (internal)', [0, 1.35, 0], [0.9, 0.7, 0.9], 'Oxidiser sits above fuel; a common bulkhead saves mass.', { k: 'cyl', r: 0.45, h: 0.7, c: '#bcd6e6', op: 0.5 }),
        P('RP-1 tank (internal)', [0, 0.55, 0], [0.9, 0.7, 0.9], 'RP-1 is ultra-refined kerosene.', { k: 'cyl', r: 0.45, h: 0.7, c: '#d8c08a', op: 0.5 }),
        ...ring(5, 0.28, (i, pos) => P(`Engine ${i} (F-1 class)`, [pos[0], -0.15, pos[2]], [0.3, 0.5, 0.3], `Engine ${i}: a gas-generator cycle monster burning ~3 t/s at liftoff.`, { k: 'cone', r: 0.16, h: 0.5, rot: [Math.PI, 0, 0], c: '#8a8a8a' })),
        ...chain(4, (i) => P(`Fin ${i}`, [Math.cos((i / 4) * Math.PI * 2) * 0.6, 0.25, Math.sin((i / 4) * Math.PI * 2) * 0.6], [0.5, 0.5, 0.08], `Fin ${i} steadies the stack through max-q.`, { rot: [0, -(i / 4) * Math.PI * 2, 0], c: '#b06a5a' })),
        P('Thrust structure', [0, 0.05, 0], [0.9, 0.16, 0.9], 'The thrust structure spreads 7,600 kN into the tanks.', { k: 'cyl', r: 0.45, h: 0.14, c: '#6a6a6a' }),
        P('Interstage 1-2', [0, 1.85, 0], [1.0, 0.3, 1.0], 'The interstage ring is jettisoned after staging.', { k: 'cyl', r: 0.5, h: 0.28, c: '#8a8a8a' }),
      ],
      stage2: [
        P('Second stage tank', [0, 2.5, 0], [1.0, 1.0, 1.0], 'Stage 2 burns liquid hydrogen: low thrust, very high efficiency.', { k: 'cyl', r: 0.5, h: 1.0, c: '#a8c8e0' }),
        P('LH2 tank (internal)', [0, 2.65, 0], [0.9, 0.5, 0.9], 'Hydrogen boils at \u2212253\u00b0C — the tank is a giant vacuum flask.', { k: 'cyl', r: 0.45, h: 0.5, c: '#dceaf2', op: 0.5 }),
        P('J-2 engine', [0, 1.95, 0], [0.3, 0.45, 0.3], 'A single vacuum-optimised engine with a giant bell.', { k: 'cone', r: 0.2, h: 0.45, rot: [Math.PI, 0, 0], c: '#9a9a9a' }),
        P('Ullage motors', [0.45, 2.1, 0], [0.08, 0.2, 0.08], 'Small solids settle the propellants before relight.', { k: 'cyl', r: 0.04, h: 0.2, c: '#7a7a7a' }),
        P('Interstage 2-3', [0, 3.12, 0], [1.0, 0.24, 1.0], 'Pyrotechnic bolts cut each stage loose cleanly.', { k: 'cyl', r: 0.5, h: 0.22, c: '#8a8a8a' }),
      ],
      stage3: [
        P('Third stage tank', [0, 3.6, 0], [0.8, 0.7, 0.8], 'Stage 3 delivers the final orbital insertion burn.', { k: 'cyl', r: 0.4, h: 0.7, c: '#9ad0c0' }),
        P('Third stage engine', [0, 3.2, 0], [0.24, 0.35, 0.24], 'Restartable once or twice for precise orbits.', { k: 'cone', r: 0.14, h: 0.35, rot: [Math.PI, 0, 0], c: '#9a9a9a' }),
        P('Guidance platform', [0, 3.95, 0], [0.5, 0.14, 0.5], 'The inertial platform steers from liftoff to orbit.', { k: 'cyl', r: 0.25, h: 0.12, c: '#5a6a7a' }),
      ],
      payload: [
        P('Fairing half L', [-0.28, 4.5, 0], [0.5, 1.0, 0.5], 'The fairing shields the payload from airflow and acoustics.', { k: 'cone', r: 0.42, h: 1.0, c: '#efe6cf' }),
        P('Fairing half R', [0.28, 4.5, 0], [0.5, 1.0, 0.5], 'Halves split and fall away above the atmosphere.', { k: 'cone', r: 0.42, h: 1.0, c: '#e6dcc4' }),
        P('Satellite bus', [0, 4.35, 0], [0.4, 0.35, 0.4], 'The bus carries power, propulsion and computers.', { k: 'box', c: '#d8b25c' }),
        P('Solar wing L', [-0.55, 4.35, 0], [0.7, 0.03, 0.3], 'Wings unfold once in sunlight.', { k: 'box', c: '#3a5a8a' }),
        P('Solar wing R', [0.55, 4.35, 0], [0.7, 0.03, 0.3], 'They track the sun for full power.', { k: 'box', c: '#3a5a8a' }),
        P('Dish antenna', [0, 4.62, 0], [0.3, 0.12, 0.3], 'The high-gain dish talks to ground stations.', { k: 'cone', r: 0.15, h: 0.12, c: '#efe6cf' }),
      ],
      tower: [
        P('Escape tower lattice', [0, 5.3, 0], [0.2, 0.7, 0.2], 'The launch escape tower stands ready for the first two minutes.', { k: 'cyl', r: 0.06, h: 0.7, c: '#c0504d' }),
        P('Escape motor', [0, 5.75, 0], [0.24, 0.5, 0.24], 'Solid motors can pull the crew clear in under 3 s.', { k: 'cone', r: 0.12, h: 0.5, c: '#8a3a2a' }),
        P('Attitude nozzle', [0.1, 5.5, 0], [0.1, 0.16, 0.1], 'Side nozzles steer the tower away from a failing rocket.', { k: 'cone', r: 0.05, h: 0.16, rot: [0, 0, -Math.PI / 2], c: '#7a2a2a' }),
      ],
    },
  },
  violin: {
    label: 'Violin',
    eyebrow: 'MUSIC & ACOUSTICS',
    description: 'How a violin speaks: vibrating strings, a bridge that filters, and a spruce body that radiates the sound.',
    tutorId: 'ms-duarte',
    labId: 'music',
    floor: 1,
    keyTerms: ['f-hole', 'soundpost', 'bass bar', 'bridge', 'purfling', 'scroll', 'tailpiece', 'fingerboard'],
    systems: [
      { id: 'body', label: 'Resonating body', color: '#c98274' },
      { id: 'neck', label: 'Neck & fingerboard', color: '#8a5a3a' },
      { id: 'strings', label: 'Bridge & strings', color: '#e8e2d0' },
      { id: 'fittings', label: 'Fittings', color: '#5a4a3a' },
    ],
    parts: {
      body: [
        P('Top plate (spruce)', [0, 0.16, 0.1], [0.72, 0.04, 0.62], 'The carved spruce top radiates most of the sound.', { k: 'box', c: '#d8a24a' }),
        P('Top upper bout', [0, 0.16, -0.42], [0.56, 0.04, 0.4], 'Upper and lower bouts shape the air and wood resonances.', { k: 'box', c: '#d8a24a' }),
        P('Top lower bout', [0, 0.16, 0.62], [0.8, 0.04, 0.5], 'The wide lower bout loves the low strings.', { k: 'box', c: '#d8a24a' }),
        P('Back plate (maple)', [0, -0.02, 0.1], [0.72, 0.04, 0.62], 'Flamed maple backs reflect energy back through the body.', { k: 'box', c: '#a86a3a' }),
        P('Back upper bout', [0, -0.02, -0.42], [0.56, 0.04, 0.4], 'Two-piece backs are book-matched for symmetry.', { k: 'box', c: '#a86a3a' }),
        P('Back lower bout', [0, -0.02, 0.62], [0.8, 0.04, 0.5], 'Arching height tunes the plate like a drum skin.', { k: 'box', c: '#a86a3a' }),
        ...chain(6, (i) => P(`Rib section ${i}`, [Math.sin((i / 6) * Math.PI * 2) * 0.36, 0.07, Math.cos((i / 6) * Math.PI * 2) * 0.55 + 0.1], [0.04, 0.16, 0.3], `Rib ${i}: bent maple sides joining top and back.`, { rot: [0, (i / 6) * Math.PI * 2, 0], c: '#b5762f' })),
        P('F-hole L', [0.2, 0.19, 0.15], [0.06, 0.02, 0.4], 'F-holes breathe the air resonance and free the top to flex.', { k: 'box', c: '#3a2a1a' }),
        P('F-hole R', [-0.2, 0.19, 0.15], [0.06, 0.02, 0.4], 'Their length and cut are tonal fingerprints.', { k: 'box', c: '#3a2a1a' }),
        P('Purfling inlay', [0, 0.185, 0.1], [0.76, 0.01, 0.66], 'Purfling stops edge cracks from running into the plate.', { k: 'box', c: '#2a1a0a' }),
        P('Bass bar', [0.16, 0.12, 0.1], [0.05, 0.05, 0.8], 'The bass bar stiffens the top under the bass string\u2019s side.', { k: 'box', c: '#e0c08a' }),
        P('Soundpost', [0.14, 0.07, 0.3], [0.04, 0.16, 0.04], 'The soundpost wedges top to back — the \u201csoul\u201d of the violin.', { k: 'cyl', r: 0.02, h: 0.16, c: '#e8d8b0' }),
      ],
      neck: [
        P('Neck', [0, 0.12, -0.85], [0.12, 0.1, 0.5], 'The maple neck carries the fingerboard at a precise angle.', { k: 'box', c: '#b5762f' }),
        P('Fingerboard (ebony)', [0, 0.2, -0.9], [0.14, 0.04, 0.6], 'Ebony boards wear slowly under steel and friction.', { k: 'box', c: '#2a2a2a' }),
        P('Nut', [0, 0.22, -0.62], [0.14, 0.03, 0.03], 'The nut spaces the strings and sets their height.', { k: 'box', c: '#efe6cf' }),
        P('Scroll', [0, 0.14, -1.2], [0.14, 0.16, 0.18], 'The scroll is the maker\u2019s signature carving.', { k: 'tor', r: 0.08, t: 0.04, rot: [Math.PI / 2, 0, 0], c: '#b5762f' }),
        P('Pegbox', [0, 0.14, -1.08], [0.1, 0.1, 0.2], 'The pegbox holds the friction pegs.', { k: 'box', c: '#a86a3a' }),
        ...chain(4, (i) => P(`Tuning peg ${i}`, [(i % 2 ? 1 : -1) * 0.08, 0.16, -1.0 - Math.floor(i / 2) * 0.09], [0.1, 0.04, 0.04], `Peg ${i}: tapered ebony, tuned by feel.`, { k: 'cyl', r: 0.02, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#2a2a2a' })),
      ],
      strings: [
        P('Bridge', [0, 0.26, 0.28], [0.34, 0.1, 0.03], 'The bridge filters string vibration into the body — a tuned spring.', { k: 'box', c: '#e0c08a' }),
        P('String G', [0.06, 0.3, 0], [0.02, 0.02, 1.5], 'G string: lowest, wound with silver or aluminium.', { k: 'tube', pts: [[0.06, 0.3, 0.62], [0.06, 0.31, 0], [0.06, 0.24, -1.05]], r: 0.012, c: '#9a9a9a' }),
        P('String D', [0.02, 0.3, 0], [0.02, 0.02, 1.5], 'D string: the warm middle voice.', { k: 'tube', pts: [[0.02, 0.3, 0.62], [0.02, 0.31, 0], [0.02, 0.24, -1.05]], r: 0.01, c: '#b0b0b0' }),
        P('String A', [-0.02, 0.3, 0], [0.02, 0.02, 1.5], 'A string: usually plain aluminium or steel.', { k: 'tube', pts: [[-0.02, 0.3, 0.62], [-0.02, 0.31, 0], [-0.02, 0.24, -1.05]], r: 0.009, c: '#c8c8c8' }),
        P('String E', [-0.06, 0.3, 0], [0.02, 0.02, 1.5], 'E string: thinnest, brightest, first to whistle if mishandled.', { k: 'tube', pts: [[-0.06, 0.3, 0.62], [-0.06, 0.31, 0], [-0.06, 0.24, -1.05]], r: 0.008, c: '#e0e0e0' }),
      ],
      fittings: [
        P('Tailpiece', [0, 0.24, 0.78], [0.2, 0.05, 0.24], 'The tailpiece anchors the strings beyond the bridge.', { k: 'box', c: '#2a2a2a' }),
        P('Tailgut', [0, 0.2, 0.92], [0.04, 0.04, 0.1], 'Tailgut loops over the end button.', { k: 'cyl', r: 0.015, h: 0.1, c: '#5a4a3a' }),
        P('End button', [0, 0.1, 0.98], [0.06, 0.06, 0.06], 'The end button takes the whole string tension load.', { k: 'cyl', r: 0.03, h: 0.05, rot: [Math.PI / 2.4, 0, 0], c: '#2a2a2a' }),
        P('Chinrest', [0.24, 0.24, 0.85], [0.2, 0.05, 0.2], 'The chinrest lets the jaw hold the violin hands-free.', { k: 'box', c: '#3a2a1a' }),
        ...chain(4, (i) => P(`Fine tuner ${i}`, [(i - 1.5) * 0.04, 0.22, 0.86], [0.03, 0.03, 0.05], `Fine tuner ${i}: screw precision for steel strings.`, { k: 'box', c: '#b0b8c0' })),
      ],
    },
  },
}

// ---------------------------------------------------------------------------
// Wave 1 DETAIL PASS (research-driven; docs/KEV_ATLAS_EXPANSION.md).
// The first cut of each world missed textbook-checklist structures (the cell
// had no membrane machinery, the bee no gland complement, Giza no precinct,
// the violin no bow...). This pass merges the researched missing parts into
// every subject so each reaches the Human Atlas completeness bar.
// Sources: NCBI 'The Cell' membrane chapter; Lumbricus anatomy notes;
// scientificbeekeeping worker-gland diagram; standard frog dissection
// checklists; Madain Project / Wikipedia Giza complex surveys; steam
// locomotive nomenclature glossaries; Titan I / Falcon user guides;
// violinwiki + bow anatomy guides.
const DETAIL_PASS = {
  cell: {
    parts: {
      membrane: [
        P('Phospholipid bilayer (cutaway)', [1.7, 0.9, 1.7], [0.5, 0.12, 0.5], 'Two phospholipid leaflets: hydrophilic heads out, hydrophobic tails in.', { k: 'box', c: '#b8e0d4' }),
        P('Hydrophobic core', [1.7, 0.86, 1.7], [0.44, 0.05, 0.44], 'Fatty-acid tails form the water-excluding core of the membrane.', { k: 'box', c: '#e8f4ee' }),
        P('Glycocalyx (sugar coat)', [0, 0.9, 0], [4.8, 4.8, 4.8], 'The glycocalyx of glycolipid and glycoprotein sugars coats the cell surface for recognition.', { k: 'sph', r: 2.42, c: '#c8ecd8', op: 0.1 }),
        ...ring(10, 2.24, (i, pos) => P(`Cholesterol ${i}`, [pos[0], pos[1] + 0.9, pos[2]], [0.1, 0.1, 0.1], 'Cholesterol buffers membrane fluidity against temperature change.', { k: 'box', c: '#f0e3a0' })),
        ...ring(6, 2.26, (i, pos) => P(`Channel protein ${i}`, [pos[0] * 0.96, pos[1] * 0.96 + 0.9, pos[2] * 0.96], [0.14, 0.2, 0.14], `Channel protein ${i}: a water-filled pore for passive ion flow.`, { k: 'cyl', r: 0.06, h: 0.18, c: '#4a9a86' })),
        ...ring(4, 2.22, (i, pos) => P(`Carrier protein ${i}`, [pos[0] * 1.02, pos[1] * 1.02 + 0.9, pos[2] * 1.02], [0.16, 0.18, 0.16], `Carrier protein ${i}: changes shape to ferry specific solutes across.`, { k: 'cap', r: 0.07, h: 0.08, c: '#3a8a76' })),
        ...ring(6, 2.3, (i, pos) => P(`Glycoprotein ${i}`, [pos[0] * 0.94, pos[1] * 0.94 + 0.9, pos[2] * 0.94], [0.1, 0.22, 0.1], `Glycoprotein ${i}: protein with sugar ID tags exposed outside.`, { k: 'cyl', r: 0.04, h: 0.2, c: '#7ac0aa' })),
        ...ring(6, 2.28, (i, pos) => P(`Glycolipid ${i}`, [pos[0] * 0.98, pos[1] * 0.98 + 0.9, pos[2] * 0.98], [0.08, 0.14, 0.08], `Glycolipid ${i}: outer-leaflet lipid carrying a carbohydrate marker.`, { k: 'cone', r: 0.04, h: 0.12, c: '#a8dcc8' })),
        ...ring(8, 2.18, (i, pos) => P(`Peripheral protein ${i}`, [pos[0], pos[1] + 0.9, pos[2]], [0.12, 0.08, 0.12], `Peripheral protein ${i}: rides the head groups on one face only.`, { k: 'box', c: '#6ab09a' })),
        P('Cytosol', [0, 0.9, 0], [4.2, 4.2, 4.2], 'The cytosol: a crowded gel of water, ions and proteins where glycolysis runs.', { k: 'sph', r: 2.15, c: '#b8d8d0', op: 0.08 }),
      ],
      nucleus: [
        P('Chromatin fibre 1', [0.2, 1.1, -0.2], [0.6, 0.1, 0.1], 'Chromatin: DNA wound on histones, loose enough to transcribe.', { k: 'tube', pts: [[-0.2, 1.1, -0.2], [0.2, 1.2, 0.1], [0.5, 1.0, -0.1]], r: 0.03, c: '#6a5ac0' }),
        P('Chromatin fibre 2', [-0.3, 0.8, 0.2], [0.6, 0.1, 0.1], 'Condensed regions (heterochromatin) stain darker and read less.', { k: 'tube', pts: [[-0.5, 0.8, 0.3], [-0.2, 0.7, 0], [0.1, 0.85, 0.25]], r: 0.03, c: '#6a5ac0' }),
        P('Nuclear lamina', [0, 0.9, 0], [1.56, 1.56, 1.56], 'The lamina meshwork stiffens the nucleus and anchors chromatin.', { k: 'sph', r: 0.78, c: '#8d7ce0', op: 0.16 }),
        P('Nucleoplasm', [0, 0.9, 0], [1.44, 1.44, 1.44], 'Nucleoplasm suspends the machinery of DNA reading and repair.', { k: 'sph', r: 0.72, c: '#a99bf0', op: 0.2 }),
      ],
      endomembrane: [
        P('COPII vesicle', [0.2, 1.5, 0.9], [0.12, 0.12, 0.12], 'COPII-coated vesicles carry new protein from ER to Golgi.', { k: 'sph', r: 0.06, c: '#e6cf8f' }),
        P('Endosome', [-1.6, 0.8, 0.6], [0.24, 0.24, 0.24], 'Endosomes sort incoming cargo for recycling or destruction.', { k: 'sph', r: 0.12, c: '#c98274' }),
        P('Autophagosome', [-1.4, 1.4, -0.8], [0.22, 0.22, 0.22], 'Autophagosomes wrap worn organelles for lysosomal recycling.', { k: 'sph', r: 0.11, c: '#d8a08a' }),
        P('Secretory vesicle', [1.8, 0.7, 0.9], [0.14, 0.14, 0.14], 'Secretory vesicles dock and release product at the membrane.', { k: 'sph', r: 0.07, c: '#f0d896' }),
      ],
      cytoskeleton: [
        ...chain(3, (i) => P(`Intermediate filament ${i}`, [Math.cos(i * 2.1) * 1.4, 1.1, Math.sin(i * 2.1) * 1.4], [1.6, 0.03, 0.03], 'Intermediate filaments take mechanical stress so the cell does not tear.', { k: 'tube', pts: [[Math.cos(i * 2.1) * 0.6, 1.0 + i * 0.1, Math.sin(i * 2.1) * 0.6], [Math.cos(i * 2.1) * 2.0, 1.2, Math.sin(i * 2.1) * 2.0]], r: 0.018, c: '#9ab8d0' })),
        P('Centrosome matrix', [0.5, 0.4, -0.5], [0.34, 0.34, 0.34], 'Pericentriolar material nucleates every microtubule.', { k: 'sph', r: 0.14, c: '#b8d4e8', op: 0.4 }),
      ],
      energy: [
        P('Mitochondrial matrix', [1.5, 0.7, 0], [0.4, 0.2, 0.2], 'The matrix hosts the Krebs cycle and mitochondrial ribosomes.', { k: 'cap', r: 0.1, h: 0.2, rot: [0, 0, Math.PI / 2], c: '#e0a0a0' }),
        P('Outer mitochondrial membrane', [1.5, 0.7, 0], [0.64, 0.34, 0.34], 'The porous outer membrane admits small molecules freely.', { k: 'cap', r: 0.17, h: 0.36, rot: [0, 0, Math.PI / 2], c: '#d07070', op: 0.35 }),
      ],
    },
  },
  worm: {
    parts: {
      bodywall: [
        P('Cuticle', [0, 0, 0], [4.3, 0.42, 0.42], 'The thin non-cellular cuticle is secreted by the epidermis and moulted nowhere — it lasts a life.', { k: 'cyl', r: 0.21, h: 4.3, rot: [0, 0, Math.PI / 2], c: '#e0b8a8', op: 0.14 }),
        P('Circular muscle layer', [0, 0, 0], [4.24, 0.38, 0.38], 'Circular muscle contraction lengthens and thins each segment.', { k: 'cyl', r: 0.19, h: 4.24, rot: [0, 0, Math.PI / 2], c: '#c98274', op: 0.22 }),
        P('Longitudinal muscle layer', [0, 0, 0], [4.24, 0.34, 0.34], 'The thicker longitudinal layer shortens segments for grip and push.', { k: 'cyl', r: 0.17, h: 4.24, rot: [0, 0, Math.PI / 2], c: '#b06a5a', op: 0.26 }),
        P('Coelom (body cavity)', [0, 0, 0], [4.1, 0.3, 0.3], 'The pressurised coelom is a hydrostatic skeleton and a transport bath.', { k: 'cyl', r: 0.15, h: 4.1, rot: [0, 0, Math.PI / 2], c: '#d8e8f0', op: 0.12 }),
        ...chain(20, (i) => P(`Intersegmental septum ${i}`, [-2.0 + i * 0.21, 0, 0], [0.02, 0.32, 0.32], `Septum ${i}: a wall compartmentalising coelomic fluid between segments.`, { k: 'cyl', r: 0.16, h: 0.015, rot: [0, 0, Math.PI / 2], c: '#e8d8cc', op: 0.3 })),
        ...chain(8, (i) => P(`Dorsal pore ${i}`, [-1.8 + i * 0.5, 0.19, 0], [0.03, 0.03, 0.03], `Dorsal pore ${i}: weeps coelomic fluid to keep the skin moist and breathing.`, { k: 'sph', r: 0.015, c: '#8fb8d8' })),
        ...chain(8, (i) => P(`Nephridiopore ${i}`, [-1.9 + i * 0.52, -0.17, 0.1], [0.03, 0.03, 0.03], `Nephridiopore ${i}: the external exit of that segment's nephridia.`, { k: 'sph', r: 0.014, c: '#9cc3de' })),
      ],
      digestion: [
        P('Buccal cavity', [-2.05, 0, 0], [0.14, 0.1, 0.1], 'The buccal chamber (segments 1-3) leads into the pharynx.', { k: 'box', c: '#d8b290' }),
        P('Stomach (segments 9-14)', [-1.15, 0.02, 0], [0.3, 0.12, 0.12], 'The stomach section carries the calciferous glands.', { k: 'cyl', r: 0.06, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#d8b290' }),
        ...chain(3, (i) => P(`Calciferous gland ${i}`, [-1.2 + i * 0.08, 0.08, 0.05], [0.07, 0.07, 0.07], `Calciferous gland ${i}: excretes calcium carbonate to neutralise humic acid.`, { k: 'sph', r: 0.035, c: '#efe6cf' })),
        P('Intestinal caecum pair', [0.7, 0.06, 0], [0.2, 0.1, 0.16], 'A pair of conical caeca at segment 26 secrete digestive enzymes.', { k: 'box', c: '#e6cf8f' }),
        P('Chloragogen tissue', [0.3, 0.09, 0], [3.0, 0.06, 0.06], 'Chloragogen cells over the gut store energy and detoxify — a worm liver.', { k: 'tube', pts: [[-1.1, 0.09, 0], [0.5, 0.1, 0], [2.0, 0.08, 0]], r: 0.03, c: '#c9d8a0' }),
      ],
      circulation: [
        P('Lateral vessel (L)', [0, 0, 0.1], [4.0, 0.03, 0.03], 'Lateral parietal vessels link dorsal and ventral lines each segment.', { k: 'tube', pts: [[-1.9, 0, 0.1], [0, 0.01, 0.11], [2.0, 0, 0.1]], r: 0.012, c: '#d08080' }),
        P('Lateral vessel (R)', [0, 0, -0.1], [4.0, 0.03, 0.03], 'Blood carries oxygen dissolved in plasma — no red cells needed.', { k: 'tube', pts: [[-1.9, 0, -0.1], [0, 0.01, -0.11], [2.0, 0, -0.1]], r: 0.012, c: '#d08080' }),
      ],
      nerve: [
        P('Nerve ring', [-1.98, 0.02, 0], [0.2, 0.24, 0.24], 'The nerve ring circles the pharynx: brain above, sub-oesophageal ganglion below.', { k: 'tor', r: 0.1, t: 0.02, rot: [0, Math.PI / 2, 0], c: '#f0e3a0' }),
        P('Sub-oesophageal ganglion', [-1.98, -0.06, 0], [0.1, 0.08, 0.1], 'It coordinates mouth and body-wall reflexes.', { k: 'sph', r: 0.05, c: '#e8d48b' }),
        P('Lateral nerve (L)', [0, -0.05, 0.12], [4.0, 0.03, 0.03], 'Paired lateral nerves serve the body-wall muscles.', { k: 'tube', pts: [[-1.9, -0.05, 0.12], [2.0, -0.05, 0.12]], r: 0.01, c: '#e8d48b' }),
        P('Lateral nerve (R)', [0, -0.05, -0.12], [4.0, 0.03, 0.03], 'Giant fibres inside the cord trigger escape contractions.', { k: 'tube', pts: [[-1.9, -0.05, -0.12], [2.0, -0.05, -0.12]], r: 0.01, c: '#e8d48b' }),
      ],
      repro: [
        P('Ovary pair', [-0.75, 0.02, 0], [0.1, 0.08, 0.12], 'A pair of ovaries hangs at the 12/13 septum.', { k: 'sph', r: 0.05, c: '#d3b1e6' }),
        P('Vas deferens (L)', [-1.3, -0.05, 0.06], [0.8, 0.03, 0.03], 'Vasa deferentia run back to segment 18.', { k: 'tube', pts: [[-1.6, -0.04, 0.06], [-0.95, -0.05, 0.06]], r: 0.012, c: '#b98ad1' }),
        P('Vas deferens (R)', [-1.3, -0.05, -0.06], [0.8, 0.03, 0.03], 'They join the prostatic ducts at the male pores.', { k: 'tube', pts: [[-1.6, -0.04, -0.06], [-0.95, -0.05, -0.06]], r: 0.012, c: '#b98ad1' }),
        P('Prostate gland pair', [-0.95, -0.02, 0.09], [0.14, 0.1, 0.08], 'Prostates add secretions that activate sperm.', { k: 'sph', r: 0.06, c: '#c9a8e0' }),
        P('Accessory gland pair (17/19)', [-1.0, -0.08, -0.09], [0.1, 0.06, 0.06], 'Accessory glands mark the male segment openings.', { k: 'sph', r: 0.04, c: '#c9a8e0' }),
        P('Cocoon (forming)', [-0.02, 0, 0], [0.5, 0.52, 0.52], 'The clitellum slides a cocoon off the front, collecting eggs and sperm as it goes.', { k: 'cyl', r: 0.26, h: 0.46, rot: [0, 0, Math.PI / 2], c: '#f0e3c0', op: 0.3 }),
      ],
    },
  },
  bee: {
    parts: {
      head: [
        P('Hypopharyngeal gland L', [-1.0, 0.02, 0.1], [0.24, 0.1, 0.08], 'Hypopharyngeal glands of nurses secrete royal jelly.', { k: 'tube', pts: [[-0.95, 0.02, 0.1], [-1.1, 0.05, 0.14], [-1.0, -0.02, 0.12]], r: 0.03, c: '#e6cf8f' }),
        P('Hypopharyngeal gland R', [-1.0, 0.02, -0.1], [0.24, 0.1, 0.08], '~550 acini feed one collecting duct per gland.', { k: 'tube', pts: [[-0.95, 0.02, -0.1], [-1.1, 0.05, -0.14], [-1.0, -0.02, -0.12]], r: 0.03, c: '#e6cf8f' }),
        P('Mandibular gland L', [-1.15, -0.02, 0.1], [0.1, 0.08, 0.08], 'Mandibular glands make queen substance and solubilise wax.', { k: 'sph', r: 0.045, c: '#d8b25c' }),
        P('Mandibular gland R', [-1.15, -0.02, -0.1], [0.1, 0.08, 0.08], 'Their blend shifts with the bee\u2019s age and task.', { k: 'sph', r: 0.045, c: '#d8b25c' }),
        P('Head salivary gland', [-0.9, 0.1, 0], [0.16, 0.1, 0.12], 'Head salivary glands moisten and begin breaking down food.', { k: 'sph', r: 0.07, c: '#bcd6e6' }),
        P('Johnston\u2019s organ L', [-1.2, 0.12, 0.1], [0.06, 0.06, 0.06], 'Johnston\u2019s organ in the antenna base hears wing-beat and dance waggle.', { k: 'sph', r: 0.03, c: '#f0e3a0' }),
        P('Johnston\u2019s organ R', [-1.2, 0.12, -0.1], [0.06, 0.06, 0.06], 'It also senses air speed in flight.', { k: 'sph', r: 0.03, c: '#f0e3a0' }),
        ...ring(8, 0.07, (i, pos) => P(`Ommatidium sample ${i}`, [-1.08 + pos[0], 0.08 + pos[1] + 0.09, 0.14], [0.03, 0.03, 0.03], `One lens of the compound eye; ~5,500 tile each eye.`, { k: 'cyl', r: 0.012, h: 0.02, c: '#5a4a30' })),
      ],
      thorax: [
        P('Thoracic salivary gland L', [-0.5, 0.0, 0.12], [0.3, 0.08, 0.08], 'Thoracic salivary glands add enzymes to nectar processing.', { k: 'tube', pts: [[-0.6, 0, 0.12], [-0.4, 0.04, 0.14]], r: 0.025, c: '#bcd6e6' }),
        P('Thoracic salivary gland R', [-0.5, 0.0, -0.12], [0.3, 0.08, 0.08], 'Their secretion also lubricates the proboscis.', { k: 'tube', pts: [[-0.6, 0, -0.12], [-0.4, 0.04, -0.14]], r: 0.025, c: '#bcd6e6' }),
        P('Wing vein radius L', [-0.5, 0.29, 0.42], [0.8, 0.02, 0.03], 'Veins stiffen the wing and carry tracheae and nerves.', { k: 'tube', pts: [[-0.85, 0.29, 0.36], [-0.2, 0.29, 0.46]], r: 0.008, c: '#8a7a5a' }),
        P('Wing vein cubitus L', [-0.5, 0.29, 0.5], [0.7, 0.02, 0.03], 'Vein patterns are used to identify bee species.', { k: 'tube', pts: [[-0.8, 0.29, 0.5], [-0.25, 0.29, 0.54]], r: 0.008, c: '#8a7a5a' }),
        P('Pollen brush (scopa) L', [-0.75, -0.4, 0.24], [0.1, 0.08, 0.08], 'Foreleg brushes sweep pollen off the hairy body.', { k: 'box', c: '#e0b45a' }),
      ],
      abdomen: [
        P('Nasonov gland', [0.78, 0.08, 0], [0.1, 0.06, 0.08], 'The Nasonov gland releases orientation pheromone at hive and flowers.', { k: 'box', c: '#e6cf8f' }),
        P('Dufour\u2019s gland', [0.75, -0.06, 0.04], [0.16, 0.05, 0.05], 'Dufour\u2019s (alkaline) gland coats the sting and marks landing spots.', { k: 'tube', pts: [[0.7, -0.05, 0.04], [0.84, -0.06, 0.02]], r: 0.02, c: '#d8d0c0' }),
        P('Venom (acid) gland', [0.6, 0.02, 0.05], [0.3, 0.05, 0.05], 'The long acid gland manufactures the venom cocktail.', { k: 'tube', pts: [[0.5, 0.03, 0.05], [0.68, 0.01, 0.04], [0.8, -0.02, 0.02]], r: 0.018, c: '#e8e0d0' }),
        P('Koschevnikov gland', [0.8, -0.08, -0.03], [0.08, 0.05, 0.05], 'Koschevnikov\u2019s gland releases alarm pheromone at the sting site.', { k: 'sph', r: 0.035, c: '#d8c0a0' }),
        P('Sting lancet L', [0.9, -0.04, 0.02], [0.16, 0.02, 0.02], 'Two barbed lancets saw the stylet deeper with each pump.', { k: 'box', c: '#c8c0b0' }),
        P('Sting lancet R', [0.9, -0.04, -0.02], [0.16, 0.02, 0.02], 'Their barbs are why stinging costs a worker her life.', { k: 'box', c: '#c8c0b0' }),
        P('Sting bulb (venom reservoir)', [0.82, -0.03, 0], [0.1, 0.08, 0.08], 'The bulb pumps venom even after the bee flies off.', { k: 'sph', r: 0.05, c: '#e0d8c8' }),
      ],
      digestion: [
        ...chain(4, (i) => P(`Gastric caecum ${i}`, [0.12 + i * 0.04, 0.04, 0.06 - i * 0.04], [0.06, 0.06, 0.06], `Caecum ${i}: pouches enlarging the midgut's secretory surface.`, { k: 'sph', r: 0.03, c: '#d8b290' })),
        ...chain(6, (i) => P(`Rectal pad ${i}`, [0.72, 0.02 + (i % 2) * 0.03, -0.05 + i * 0.02], [0.04, 0.04, 0.04], `Rectal pad ${i}: reclaims water and salts so waste leaves almost dry.`, { k: 'box', c: '#c09a7a' })),
      ],
      respiration: [
        P('Dorsal vessel (heart)', [0, 0.14, 0], [1.8, 0.05, 0.05], 'A tubular heart pumps haemolymph forward through the aorta.', { k: 'tube', pts: [[-0.8, 0.14, 0], [0.2, 0.15, 0], [0.8, 0.12, 0]], r: 0.02, c: '#d0a0a0' }),
        P('Aorta', [-1.0, 0.12, 0], [0.5, 0.04, 0.04], 'The aorta empties into the head, bathing the brain.', { k: 'tube', pts: [[-1.15, 0.12, 0], [-0.85, 0.13, 0]], r: 0.015, c: '#d0a0a0' }),
      ],
      nerve: [
        P('Mushroom body L', [-1.03, 0.12, 0.05], [0.08, 0.08, 0.08], 'Mushroom bodies are the learning and memory centres.', { k: 'sph', r: 0.04, c: '#f0e3a0' }),
        P('Mushroom body R', [-1.03, 0.12, -0.05], [0.08, 0.08, 0.08], 'Foragers grow them larger than nurses.', { k: 'sph', r: 0.04, c: '#f0e3a0' }),
        P('Optic lobe L', [-1.0, 0.08, 0.16], [0.1, 0.12, 0.08], 'Optic lobes process colour, pattern and polarised light.', { k: 'box', c: '#e8d48b' }),
        P('Optic lobe R', [-1.0, 0.08, -0.16], [0.1, 0.12, 0.08], 'They wire straight into the compound eyes.', { k: 'box', c: '#e8d48b' }),
        P('Sub-oesophageal ganglion', [-1.0, -0.05, 0], [0.12, 0.08, 0.1], 'It runs the mouthparts and proboscis reflexes.', { k: 'box', c: '#e8d48b' }),
      ],
    },
  },
  frog: {
    external: [
      P('Tongue', [-1.15, 0.05, 0], [0.4, 0.06, 0.2], 'The tongue is hinged at the FRONT and flips out sticky-side first.', { k: 'box', c: '#c07070' }),
      P('Vomerine teeth', [-1.05, 0.1, 0], [0.12, 0.03, 0.16], 'Two small patches of vomerine teeth grip prey on the mouth roof.', { k: 'box', c: '#efe6cf' }),
      P('Maxillary teeth (L)', [-1.1, 0.08, 0.3], [0.4, 0.03, 0.04], 'Maxillary teeth ring the jaw edge — holding, never chewing.', { k: 'box', c: '#efe6cf' }),
      P('Maxillary teeth (R)', [-1.1, 0.08, -0.3], [0.4, 0.03, 0.04], 'Frogs swallow meals whole.', { k: 'box', c: '#efe6cf' }),
      P('Internal naris L', [-1.15, 0.12, 0.1], [0.05, 0.04, 0.05], 'Internal nares connect nostrils to the mouth cavity.', { k: 'box', c: '#8a6a5a' }),
      P('Internal naris R', [-1.15, 0.12, -0.1], [0.05, 0.04, 0.05], 'They close when the frog dives.', { k: 'box', c: '#8a6a5a' }),
      P('Eustachian opening L', [-0.95, 0.1, 0.2], [0.06, 0.04, 0.06], 'Eustachian openings equalise pressure for diving and jumping.', { k: 'box', c: '#8a6a5a' }),
      P('Eustachian opening R', [-0.95, 0.1, -0.2], [0.06, 0.04, 0.06], 'They lead to the tympanum of each ear.', { k: 'box', c: '#8a6a5a' }),
      P('Glottis', [-0.85, 0.08, 0], [0.08, 0.05, 0.08], 'The glottis is the slit gateway to the lungs.', { k: 'box', c: '#c08080' }),
      P('Hyoid apparatus', [-0.9, 0.0, 0], [0.2, 0.05, 0.16], 'The hyoid plate supports the mouth floor and buccal pumping.', { k: 'box', c: '#ded8c6' }),
    ],
    digestion: [
      P('Oesophagus', [-0.7, 0.15, 0], [0.2, 0.1, 0.1], 'A short, wide oesophagus — prey arrives whole.', { k: 'cyl', r: 0.05, h: 0.18, rot: [0, 0, Math.PI / 2], c: '#d8a08a' }),
      P('Pyloric sphincter', [0.4, 0.18, 0.1], [0.08, 0.08, 0.08], 'The pyloric valve meters chyme into the duodenum.', { k: 'sph', r: 0.04, c: '#c08a6a' }),
      P('Duodenum', [0.45, 0.16, 0.15], [0.2, 0.1, 0.1], 'The duodenum is the first small-intestine loop.', { k: 'cyl', r: 0.05, h: 0.2, rot: [0.4, 0, 0], c: '#d8b290' }),
      P('Ileum coils', [0.55, 0.16, -0.05], [0.3, 0.1, 0.2], 'Ileum coils finish absorption before the large intestine.', { k: 'tube', pts: [[0.45, 0.16, -0.1], [0.6, 0.16, 0.05], [0.5, 0.16, 0.12]], r: 0.04, c: '#d8b290' }),
      P('Mesentery', [0.5, 0.14, 0], [0.4, 0.02, 0.3], 'The mesentery sling holds gut coils and carries their vessels.', { k: 'box', c: '#e8d8c8', op: 0.35 }),
      P('Omentum', [0.3, 0.22, 0], [0.3, 0.02, 0.24], 'The omentum apron drapes the gut with fat and immune tissue.', { k: 'box', c: '#e8d48b', op: 0.35 }),
    ],
    urogenital: [
      P('Adrenal gland L', [0.55, 0.16, 0.14], [0.2, 0.05, 0.06], 'Adrenals sit as yellow strips on the kidneys.', { k: 'box', c: '#e6cf8f' }),
      P('Adrenal gland R', [0.55, 0.16, -0.14], [0.2, 0.05, 0.06], 'They release stress hormones for fight-or-jump.', { k: 'box', c: '#e6cf8f' }),
      P('Ovary L', [0.4, 0.14, 0.18], [0.24, 0.1, 0.12], 'In season the ovaries fill the body cavity with yolked eggs.', { k: 'sph', r: 0.1, c: '#e8d8c8' }),
      P('Ovary R', [0.4, 0.14, -0.18], [0.24, 0.1, 0.12], 'Eggs shed straight into the coelom.', { k: 'sph', r: 0.1, c: '#e8d8c8' }),
      P('Oviduct L', [0.6, 0.16, 0.26], [0.5, 0.06, 0.06], 'Coiled oviducts add jelly coats as eggs pass.', { k: 'tube', pts: [[0.3, 0.16, 0.26], [0.6, 0.16, 0.3], [0.82, 0.14, 0.2]], r: 0.025, c: '#d3b1e6' }),
      P('Oviduct R', [0.6, 0.16, -0.26], [0.5, 0.06, 0.06], 'Their openings sit near the lungs\u2019 front ends.', { k: 'tube', pts: [[0.3, 0.16, -0.26], [0.6, 0.16, -0.3], [0.82, 0.14, -0.2]], r: 0.025, c: '#d3b1e6' }),
      P('Bidder\u2019s canal (male)', [0.5, 0.14, 0.08], [0.3, 0.04, 0.04], 'Bidder\u2019s canal links testis to kidney ducts in males.', { k: 'tube', pts: [[0.4, 0.14, 0.08], [0.65, 0.14, 0.1]], r: 0.015, c: '#b98ad1' }),
    ],
    skeleton: [
      P('Scapula L', [-0.75, 0.05, 0.35], [0.2, 0.16, 0.08], 'The scapula blades anchor forelimb muscle.', { k: 'box', c: '#ded8c6' }),
      P('Scapula R', [-0.75, 0.05, -0.35], [0.2, 0.16, 0.08], 'Frogs lack ribs — the girdles do the bracing.', { k: 'box', c: '#ded8c6' }),
      P('Coracoid L', [-0.7, 0.0, 0.3], [0.16, 0.1, 0.08], 'Coracoids take landing shock from the arms.', { k: 'box', c: '#e8e2d0' }),
      P('Coracoid R', [-0.7, 0.0, -0.3], [0.16, 0.1, 0.08], 'They form the firm pectoral bar.', { k: 'box', c: '#e8e2d0' }),
      P('Clavicle L', [-0.8, 0.05, 0.28], [0.16, 0.06, 0.06], 'Clavicles complete the pectoral arc.', { k: 'box', c: '#efe9d8' }),
      P('Clavicle R', [-0.8, 0.05, -0.28], [0.16, 0.06, 0.06], 'The sternum closes it below.', { k: 'box', c: '#efe9d8' }),
      P('Sternum', [-0.65, -0.05, 0], [0.16, 0.08, 0.14], 'The breastbone anchors the pectoral muscles.', { k: 'box', c: '#e8e2d0' }),
      P('Humerus L', [-0.72, -0.1, 0.42], [0.3, 0.08, 0.08], 'A single humerus spans each upper forelimb.', { k: 'cyl', r: 0.035, h: 0.3, rot: [Math.PI / 2.4, 0, 0.5], c: '#e8e2d0' }),
      P('Humerus R', [-0.72, -0.1, -0.42], [0.3, 0.08, 0.08], 'Radius and ulna fuse beyond it.', { k: 'cyl', r: 0.035, h: 0.3, rot: [-Math.PI / 2.4, 0, 0.5], c: '#e8e2d0' }),
      P('Ilium L', [0.5, 0.05, 0.2], [0.5, 0.08, 0.06], 'Long ilia reach forward to stiffen the jump frame.', { k: 'cyl', r: 0.03, h: 0.5, rot: [0.3, 0, 0.4], c: '#ded8c6' }),
      P('Ilium R', [0.5, 0.05, -0.2], [0.5, 0.08, 0.06], 'They bolt the hips to the urostyle.', { k: 'cyl', r: 0.03, h: 0.5, rot: [-0.3, 0, 0.4], c: '#ded8c6' }),
    ],
  },
  giza: {
    newSystems: [{ id: 'precinct', label: 'Funerary precinct', color: '#c9b98a' }],
    parts: {
      chambers: [
        P('Antechamber', [0.32, 1.02, 0], [0.3, 0.24, 0.3], 'The granite antechamber once dropped portcullis stones across the way.', { c: '#9a5a4a' }),
        ...chain(3, (i) => P(`Portcullis slab ${i}`, [0.3 + i * 0.05, 1.1 + i * 0.06, 0], [0.06, 0.3, 0.34], `Portcullis ${i}: a granite guillotine slid down grooves to seal the chamber.`, { c: '#8a4a3a' })),
        P('Great Step', [0.24, 0.98, 0], [0.14, 0.16, 0.2], 'The Great Step blocks the gallery top corridor.', { c: '#b06a5a' }),
        P('Gabled rafters', [0.35, 0.78, 0], [0.6, 0.1, 0.5], 'Giant gabled rafters shed the load above the Queen\u2019s Chamber.', { rot: [0.5, 0, 0], c: '#9a5a4a' }),
      ],
      passages: [
        P('Grotto (well shaft chamber)', [-0.68, -0.2, 0.28], [0.2, 0.24, 0.2], 'The grotto is a small cave-like chamber mid well shaft.', { c: '#7a6a52' }),
        P('Horizontal passage to subterranean', [-0.2, -0.55, 0], [0.9, 0.1, 0.1], 'A level run finishes the descent to the rock-cut chamber.', { k: 'tube', pts: [[-0.6, -0.52, 0], [0.2, -0.55, 0]], r: 0.045, c: '#a8c8e0' }),
      ],
      precinct: [
        P('Mortuary temple', [0, 0.1, 2.6], [1.6, 0.2, 0.8], 'The east-side mortuary temple hosted the daily offering ritual.', { c: '#d8c08a' }),
        P('Causeway', [0, 0.05, 3.6], [0.5, 0.12, 1.6], 'A 495 m roofed causeway linked plateau temple to valley temple.', { c: '#c9b98a' }),
        P('Valley temple', [0, 0.05, 4.6], [1.0, 0.2, 0.7], 'The valley temple at the Nile edge received the king\u2019s body.', { c: '#d8c08a' }),
        P('Enclosure wall (E)', [2.5, 0.1, 0], [0.12, 0.24, 4.6], 'The enclosure wall fenced sacred ground from the necropolis.', { c: '#c9b98a' }),
        P('Enclosure wall (W)', [-2.5, 0.1, 0], [0.12, 0.24, 4.6], 'Its gates controlled who could approach.', { c: '#c9b98a' }),
        P('Boat pit 1', [1.6, -0.05, 2.2], [1.4, 0.12, 0.35], 'Sealed boat pits held dismantled solar barques — the Khufu ship survived in one.', { c: '#8a6a4a' }),
        P('Boat pit 2', [-1.6, -0.05, 2.2], [1.4, 0.12, 0.35], 'Five pits ring the pyramid\u2019s south and east.', { c: '#8a6a4a' }),
        P('Queen\u2019s pyramid G1-a', [2.9, 0.25, 1.2], [0.7, 0.5, 0.7], 'Three small pyramids bury Khufu\u2019s wives beside him.', { k: 'cone', r: 0.5, h: 0.5, c: '#d8c08a' }),
        P('Queen\u2019s pyramid G1-b', [2.9, 0.25, 0], [0.7, 0.5, 0.7], 'Each had its own chapel and enclosure.', { k: 'cone', r: 0.5, h: 0.5, c: '#d8c08a' }),
        P('Queen\u2019s pyramid G1-c', [2.9, 0.25, -1.2], [0.7, 0.5, 0.7], 'Their cores still show local stone.', { k: 'cone', r: 0.5, h: 0.5, c: '#d8c08a' }),
        P('Satellite pyramid', [-2.6, 0.15, 1.8], [0.4, 0.3, 0.4], 'The tiny satellite pyramid may have housed the king\u2019s ka.', { k: 'cone', r: 0.3, h: 0.3, c: '#c9b98a' }),
        P('Workers\u2019 gallery (mastaba row)', [-3.2, 0.1, -1.5], [0.8, 0.16, 1.6], 'Eastern mastabas bury the officials who served the cult.', { c: '#b8a878' }),
      ],
      structure: [
        P('Gypsum levelling mortar', [0, 0.02, 1.2], [1.2, 0.02, 0.6], 'Core blocks sit on thin gypsum mortar beds for levelling — the joints otherwise rely on gravity and fit.', { c: '#e6dcc4' }),
        P('Lifting boss remnant', [1.2, 0.5, 0.9], [0.16, 0.12, 0.16], 'Some blocks keep un-cut lifting bosses from the quarry.', { c: '#c9b98a' }),
      ],
    },
  },
  locomotive: {
    newSystems: [{ id: 'brakes', label: 'Brakes, springs & feedwater', color: '#7a8a9a' }],
    parts: {
      boiler: [
        P('Blastpipe', [-1.6, 0.5, 0], [0.16, 0.4, 0.16], 'The blastpipe fires exhaust up the chimney, drawing the fire behind it.', { k: 'cone', r: 0.08, h: 0.35, c: '#4a4a4a' }),
        ...chain(4, (i) => P(`Superheater element ${i}`, [-0.9 + i * 0.3, 0.85, 0.1 - i * 0.06], [0.5, 0.05, 0.05], `Element ${i}: a hairpin tube drying steam in the flue gas.`, { k: 'tube', pts: [[-1.3, 0.85, 0.1 - i * 0.06], [-0.8 + i * 0.2, 0.88, 0.1 - i * 0.06]], r: 0.02, c: '#b06a5a' })),
        ...chain(6, (i) => P(`Boiler flue ${i}`, [-0.5 + (i % 3) * 0.4, 0.7 + Math.floor(i / 3) * 0.12, -0.1 + (i % 2) * 0.2], [1.8, 0.06, 0.06], `Flue ${i}: fire tubes carry hot gas through the water.`, { k: 'cyl', r: 0.03, h: 1.8, rot: [0, 0, Math.PI / 2], c: '#8a6a5a' })),
        ...chain(4, (i) => P(`Staybolt ${i}`, [-1.1 + i * 0.4, 0.95, 0.2], [0.04, 0.2, 0.04], `Staybolt ${i}: ties firebox walls against 15 bar of push.`, { k: 'cyl', r: 0.015, h: 0.18, c: '#6a6a6a' })),
        P('Firehole door', [0.92, 0.7, 0], [0.06, 0.24, 0.24], 'The fireman works coal through the firehole door.', { k: 'cyl', r: 0.12, h: 0.05, rot: [0, 0, Math.PI / 2], c: '#3a3a3a' }),
        P('Regulator valve', [-0.7, 1.05, 0], [0.16, 0.12, 0.12], 'The regulator valve lives inside the steam dome.', { k: 'box', c: '#b0b8c0' }),
      ],
      motion: [
        P('Crosshead L', [-1.05, 0.42, 0.42], [0.16, 0.12, 0.1], 'The crosshead slides between bars, keeping thrust straight.', { k: 'box', c: '#c0c8d0' }),
        P('Crosshead R', [-1.05, 0.42, -0.42], [0.16, 0.12, 0.1], 'It converts piston line into rod angle.', { k: 'box', c: '#c0c8d0' }),
        P('Slide bars L', [-1.05, 0.5, 0.42], [0.5, 0.04, 0.06], 'Slide bars guide the crosshead.', { k: 'box', c: '#a8b0b8' }),
        P('Slide bars R', [-1.05, 0.5, -0.42], [0.5, 0.04, 0.06], 'Wear here shows as a knock at speed.', { k: 'box', c: '#a8b0b8' }),
        P('Expansion link L', [-1.15, 0.6, 0.5], [0.2, 0.16, 0.05], 'The curved expansion link sets cut-off via the reverser.', { k: 'box', c: '#b0b8c0' }),
        P('Expansion link R', [-1.15, 0.6, -0.5], [0.2, 0.16, 0.05], 'Die block rides in its slot.', { k: 'box', c: '#b0b8c0' }),
        ...chain(6, (i) => P(`Crank pin ${i}`, [-0.85 + (i % 3) * 0.55, 0.35, i < 3 ? 0.5 : -0.5], [0.06, 0.06, 0.06], `Crank pin ${i}: the rod journal on each driver.`, { k: 'cyl', r: 0.03, h: 0.06, rot: [Math.PI / 2, 0, 0], c: '#d0d8e0' })),
        P('Sand pipe L', [-1.3, 0.5, 0.4], [0.05, 0.4, 0.05], 'Sand pipes drop grit ahead of the drivers.', { k: 'cyl', r: 0.02, h: 0.4, c: '#c9b98a' }),
        P('Sand pipe R', [-1.3, 0.5, -0.4], [0.05, 0.4, 0.05], 'Gravity feed, foot-valve controlled.', { k: 'cyl', r: 0.02, h: 0.4, c: '#c9b98a' }),
        P('Cylinder cock L', [-1.5, 0.3, 0.45], [0.06, 0.08, 0.06], 'Cylinder cocks spit condensate at startup.', { k: 'cyl', r: 0.03, h: 0.08, c: '#8a8a8a' }),
        P('Cylinder cock R', [-1.5, 0.3, -0.45], [0.06, 0.08, 0.06], 'They protect cylinders from water slug.', { k: 'cyl', r: 0.03, h: 0.08, c: '#8a8a8a' }),
      ],
      brakes: [
        ...chain(6, (i) => P(`Brake shoe ${i}`, [-0.85 + (i % 3) * 0.55, 0.2, i < 3 ? 0.52 : -0.52], [0.14, 0.1, 0.05], `Brake shoe ${i}: cast blocks clamp each driver tread.`, { k: 'box', c: '#4a4a4a' })),
        ...chain(6, (i) => P(`Leaf spring ${i}`, [-1.4 + i * 0.45, 0.55, 0.36], [0.4, 0.06, 0.05], `Leaf spring ${i}: stacked plates soak rail joints.`, { k: 'box', c: '#5a6a7a' })),
        ...chain(6, (i) => P(`Axlebox ${i}`, [-1.5 + i * 0.5, 0.35, 0.38], [0.12, 0.14, 0.08], `Axlebox ${i}: a greased bearing sliding in the hornblock.`, { k: 'box', c: '#6a7a8a' })),
        P('Vacuum brake cylinder', [0.2, 0.3, 0], [0.3, 0.3, 0.3], 'The vacuum cylinder pulls the whole train\u2019s brakes.', { k: 'cyl', r: 0.15, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#5a6a7a' }),
        P('Brake ejector', [1.0, 1.1, 0.2], [0.08, 0.16, 0.08], 'The ejector makes the vacuum the brakes live on.', { k: 'cyl', r: 0.04, h: 0.16, c: '#8a8a8a' }),
        P('Injector L', [0.85, 0.5, 0.42], [0.2, 0.14, 0.12], 'Injectors use steam jets to force feedwater uphill into the boiler.', { k: 'box', c: '#b0b8c0' }),
        P('Injector R', [0.85, 0.5, -0.42], [0.2, 0.14, 0.12], 'Two injectors: one working, one spare, always.', { k: 'box', c: '#b0b8c0' }),
        P('Feedwater clack valve', [0.4, 0.8, 0.3], [0.1, 0.1, 0.1], 'Clack valves stop boiler water escaping back up the pipe.', { k: 'cyl', r: 0.05, h: 0.1, c: '#8a8a8a' }),
      ],
    },
  },
  rocket: {
    parts: {
      stage1: [
        P('Turbopump', [0.3, 0.15, 0.2], [0.3, 0.4, 0.3], 'The turbopump shovels propellant into the chambers faster than any piston could.', { k: 'cap', r: 0.12, h: 0.2, c: '#9a9a9a' }),
        P('Gas generator', [0.3, 0.35, -0.2], [0.2, 0.24, 0.2], 'A small rough-burning generator spins the turbine.', { k: 'sph', r: 0.1, c: '#8a8a8a' }),
        ...ring(5, 0.3, (i, pos) => P(`Gimbal actuator ${i}`, [pos[0], 0.12, pos[2]], [0.1, 0.2, 0.1], `Actuator ${i}: hydraulic arms swivel each engine for steering.`, { k: 'cyl', r: 0.04, h: 0.18, c: '#7a7a7a' })),
        ...chain(4, (i) => P(`Helium COPV ${i}`, [Math.cos(i * 1.6) * 0.35, 1.7, Math.sin(i * 1.6) * 0.35], [0.2, 0.2, 0.2], `Composite overwrapped sphere ${i}: high-pressure helium pressurises tanks.`, { k: 'sph', r: 0.1, c: '#c8c8c8' })),
        ...chain(4, (i) => P(`Hold-down clamp ${i}`, [Math.cos((i / 4) * Math.PI * 2) * 0.55, -0.05, Math.sin((i / 4) * Math.PI * 2) * 0.55], [0.16, 0.14, 0.16], `Clamp ${i}: releases only when all five engines prove healthy.`, { k: 'box', c: '#5a5a5a' })),
        P('LOX fill & vent line', [-0.45, 1.5, 0], [0.1, 0.8, 0.1], 'The fill line tops off boil-off until T-0.', { k: 'cyl', r: 0.05, h: 0.8, c: '#bcd6e6' }),
        P('RP-1 feed line', [0.45, 0.4, 0], [0.12, 0.6, 0.12], 'Big-bore feed lines keep the turbopump fed.', { k: 'cyl', r: 0.06, h: 0.6, c: '#d8c08a' }),
      ],
      stage2: [
        P('Avionics bay', [0, 2.95, 0], [0.8, 0.2, 0.8], 'The avionics ring flies the vehicle: guidance, telemetry, safety.', { k: 'cyl', r: 0.4, h: 0.18, c: '#5a6a7a' }),
        P('Stage 2 turbopump', [0.25, 2.05, 0.15], [0.2, 0.3, 0.2], 'A single-shaft turbopump feeds LH2 and LOX.', { k: 'cap', r: 0.09, h: 0.14, c: '#9a9a9a' }),
        P('Helium sphere (stage 2)', [-0.25, 2.2, -0.15], [0.16, 0.16, 0.16], 'Warm helium re-pressurises the hydrogen tank as it empties.', { k: 'sph', r: 0.08, c: '#c8c8c8' }),
      ],
      payload: [
        P('Payload adapter ring', [0, 4.05, 0], [0.7, 0.12, 0.7], 'The adapter ring bolts spacecraft to stage.', { k: 'cyl', r: 0.35, h: 0.1, c: '#8a8a8a' }),
        ...chain(4, (i) => P(`Separation spring ${i}`, [Math.cos((i / 4) * Math.PI * 2) * 0.3, 4.12, Math.sin((i / 4) * Math.PI * 2) * 0.3], [0.06, 0.1, 0.06], `Spring ${i}: pushes the spacecraft away cleanly at release.`, { k: 'cyl', r: 0.03, h: 0.1, c: '#b0b8c0' })),
      ],
    },
  },
  violin: {
    newSystems: [{ id: 'bow', label: 'The bow', color: '#8a5a3a' }],
    parts: {
      body: [
        ...chain(4, (i) => P(`Corner block ${i}`, [Math.sin(i * 1.6) * 0.3, 0.07, -0.15 + i * 0.25], [0.08, 0.14, 0.08], `Corner block ${i}: willow blocks glue ribs at each corner.`, { k: 'box', c: '#e0c08a' })),
        P('Top block', [0, 0.07, -0.68], [0.1, 0.14, 0.06], 'The top block beds the neck joint into the ribs.', { k: 'box', c: '#e0c08a' }),
        P('Bottom block', [0, 0.07, 0.92], [0.1, 0.14, 0.06], 'The bottom block carries the end button load.', { k: 'box', c: '#e0c08a' }),
        ...chain(4, (i) => P(`Lining strip ${i}`, [Math.sin(i * 1.7) * 0.33, 0.07, -0.3 + i * 0.4], [0.03, 0.05, 0.5], `Lining ${i}: thin strips widen the glue joint between ribs and plates.`, { k: 'box', c: '#d8b270' })),
        P('Saddle', [0, 0.05, 0.95], [0.08, 0.04, 0.06], 'The saddle lets the tailgut ride without cutting the rib.', { k: 'box', c: '#5a4a3a' }),
        P('Maker\u2019s label', [0.1, 0.05, 0.1], [0.16, 0.005, 0.1], 'The label inside names maker and year — through the f-hole it is read.', { k: 'box', c: '#efe6cf' }),
        P('Button (back)', [0, 0.02, 1.0], [0.06, 0.06, 0.06], 'The back button anchors the neck root from behind.', { k: 'cyl', r: 0.03, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#8a5a3a' }),
      ],
      strings: [
        P('String winding (G)', [0.06, 0.3, 0.5], [0.03, 0.03, 0.2], 'Wound strings add mass without stiffness.', { k: 'cyl', r: 0.014, h: 0.2, c: '#b0a080' }),
        P('Bridge feet', [0, 0.2, 0.28], [0.3, 0.03, 0.06], 'Bridge feet stand exactly over the bass bar and soundpost.', { k: 'box', c: '#e0c08a' }),
      ],
      bow: [
        P('Bow stick', [0.9, 0.35, 0.2], [0.05, 0.05, 1.5], 'Pernambuco or carbon stick, cambered inward under hair tension.', { k: 'tube', pts: [[0.9, 0.35, -0.5], [0.92, 0.32, 0.2], [0.9, 0.36, 0.95]], r: 0.02, c: '#8a5a3a' }),
        P('Bow tip', [0.9, 0.38, 0.98], [0.06, 0.1, 0.08], 'The tip plate guards the head where hair turns.', { k: 'box', c: '#efe6cf' }),
        P('Bow hair ribbon', [0.9, 0.28, 0.2], [0.03, 0.015, 1.4], 'About 150 horsehair strands, rosined to grip the string.', { k: 'box', c: '#f4eeda' }),
        P('Frog', [0.9, 0.3, -0.45], [0.07, 0.09, 0.14], 'The ebony frog sets hair height and houses the screw.', { k: 'box', c: '#2a2a2a' }),
        P('Ferrule', [0.9, 0.27, -0.38], [0.06, 0.02, 0.04], 'The metal ferrule keeps the hair ribbon spread and true.', { k: 'box', c: '#c8c8c8' }),
        P('Screw (button)', [0.9, 0.32, -0.58], [0.05, 0.05, 0.08], 'The screw draws the frog back to tension the hair.', { k: 'cyl', r: 0.025, h: 0.08, rot: [Math.PI / 2, 0, 0], c: '#2a2a2a' }),
        P('Winding & thumb leather', [0.9, 0.33, -0.3], [0.05, 0.05, 0.12], 'Winding and leather protect the stick and balance the bow.', { k: 'cyl', r: 0.026, h: 0.12, rot: [Math.PI / 2, 0, 0], c: '#c8c8c8' }),
        P('Pearl eye', [0.94, 0.3, -0.45], [0.02, 0.02, 0.02], 'The pearl eye is the frog\u2019s signature inlay.', { k: 'sph', r: 0.012, c: '#efe6cf' }),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(DETAIL_PASS)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// DEPTH PASS (research-driven completeness sweep): every non-anatomy subject
// audited against textbook / industry parts lists (flowering-plant anatomy,
// bridge component glossaries, EV teardown lists, Earth structure summaries,
// dissection guides, locomotive & Falcon 9 nomenclature, violin anatomy) and
// expanded toward Human-Atlas depth. Compound `shapes` parts give several
// primitives under one selectable name for atlas-grade visual depth.
const DEPTH_PASS = {
  plants: {
    newSystems: [
      { id: 'flower', label: 'Flower & reproduction', color: '#d88ab0' },
      { id: 'seed', label: 'Seed & fruit', color: '#c8a858' },
    ],
    parts: {
      roots: [
        ...ring(10, 0.42, (i, pos) => P(`Root hair ${i}`, [pos[0], -1.15 - (i % 4) * 0.18, pos[2]], [0.02, 0.2, 0.02], `Root hair ${i}: a single cell extension doing most of the water uptake.`, { k: 'cyl', r: 0.012, h: 0.2, rot: [0, 0, Math.PI / 2], c: '#e0cba8' })),
        ...chain(6, (i) => P(`Lateral root ${i}`, [(i % 2 ? -1 : 1) * 0.55, -0.55 - i * 0.16, (i % 3 - 1) * 0.2], [0.7, 0.09, 0.09], `Lateral root ${i}: branches that widen the foraging volume.`, { k: 'cone', r: 0.07, h: 0.7, rot: [0, 0, (i % 2 ? 1 : -1) * 1.9], c: '#b98b5b' })),
        P('Endodermis', [0, -1.0, 0], [0.5, 1.1, 0.5], 'The endodermis checks every ion at the Casparian strip.', { k: 'cyl', r: 0.26, h: 1.1, c: '#c8a878', op: 0.55 }),
        P('Pericycle', [0, -1.0, 0], [0.36, 1.1, 0.36], 'The pericycle launches lateral roots from deep inside.', { k: 'cyl', r: 0.18, h: 1.1, c: '#d8b888', op: 0.6 }),
        P('Xylem strand (root)', [0.06, -1.0, 0], [0.08, 1.4, 0.08], 'Xylem pulls the soil solution upward under tension.', { k: 'tube', pts: [[0.06, -1.7, 0], [0.06, -0.3, 0]], r: 0.035, c: '#b05a4a' }),
        P('Phloem strand (root)', [-0.06, -1.0, 0], [0.08, 1.4, 0.08], 'Phloem exports leaf sugar downward to the roots.', { k: 'tube', pts: [[-0.06, -1.7, 0], [-0.06, -0.3, 0]], r: 0.03, c: '#5ca66b' }),
        P('Apical meristem', [0, -1.62, 0], [0.2, 0.2, 0.2], 'The apical meristem divides forever, pushing the tip deeper.', { k: 'sph', r: 0.1, c: '#e8d48b' }),
        P('Root cortex', [0, -1.0, 0], [0.66, 1.2, 0.66], 'Cortex parenchyma stores starch and funnels water inward.', { k: 'cyl', r: 0.33, h: 1.2, c: '#e6d2b0', op: 0.35 }),
        P('Casparian strip', [0, -0.9, 0], [0.5, 0.04, 0.5], 'A waxy belt forcing water through cell membranes.', { k: 'tor', r: 0.26, t: 0.02, c: '#8a6a3a' }),
        P('Quiescent centre', [0, -1.5, 0], [0.1, 0.1, 0.1], 'Slow-dividing cells anchor the meristem organisation.', { k: 'sph', r: 0.05, c: '#c8b060' }),
      ],
      vascular: [
        ...chain(6, (i) => P(`Node ${i}`, [0, -0.15 + i * 0.32, 0], [0.3, 0.08, 0.3], `Node ${i}: the junction where leaves and buds attach.`, { k: 'cyl', r: 0.15, h: 0.07, c: '#6a9a5a' })),
        ...chain(6, (i) => P(`Internode ${i}`, [0, i * 0.32, 0], [0.24, 0.3, 0.24], `Internode ${i}: stem length set by light and gibberellin.`, { k: 'cyl', r: 0.11, h: 0.28, c: '#7fae6a' })),
        ...ring(8, 0.1, (i, pos) => P(`Vascular bundle ${i}`, [pos[0], 0.8, pos[2]], [0.05, 1.5, 0.05], `Bundle ${i}: xylem inside, phloem outside, cambium between.`, { k: 'cyl', r: 0.024, h: 1.5, c: i % 2 ? '#b05a4a' : '#5ca66b' })),
        P('Vascular cambium', [0, 0.8, 0], [0.3, 0.03, 0.3], 'The cambium ring thickens stems year after year.', { k: 'tor', r: 0.12, t: 0.015, c: '#d8b25c' }),
        P('Pith', [0, 0.8, 0], [0.16, 1.6, 0.16], 'Pith parenchyma stores and ships nutrients across the stem.', { k: 'cyl', r: 0.07, h: 1.6, c: '#e8e2c8' }),
        P('Bark & epidermis', [0, 0.8, 0], [0.4, 1.7, 0.4], 'Bark shields the stem from water loss and pests.', { k: 'cyl', r: 0.19, h: 1.7, c: '#8a7a5a', op: 0.35 }),
        ...chain(6, (i) => P(`Lenticel ${i}`, [0.19 * Math.cos(i), 0.3 + i * 0.22, 0.19 * Math.sin(i)], [0.05, 0.03, 0.05], `Lenticel ${i}: a breathing pore through the bark.`, { k: 'sph', r: 0.025, c: '#c8b898' })),
        ...chain(4, (i) => P(`Petiole ${i}`, [(i % 2 ? -1 : 1) * 0.35, 0.55 + i * 0.3, 0], [0.6, 0.06, 0.06], `Petiole ${i}: the leaf stalk, angled to catch light.`, { k: 'tube', pts: [[0, 0.55 + i * 0.3, 0], [(i % 2 ? -1 : 1) * 0.7, 0.7 + i * 0.3, 0]], r: 0.03, c: '#6a9a5a' })),
        ...chain(6, (i) => P(`Xylem vessel ${i}`, [0.04 * (i - 3), 0.9, 0.03], [0.03, 1.6, 0.03], `Vessel ${i}: dead cells stacked into one continuous pipe.`, { k: 'cyl', r: 0.014, h: 1.6, c: '#b05a4a' })),
        ...chain(6, (i) => P(`Sieve tube ${i}`, [0.04 * (i - 3), 0.9, -0.03], [0.03, 1.6, 0.03], `Sieve tube ${i}: living sugar pipeline with perforated plates.`, { k: 'cyl', r: 0.012, h: 1.6, c: '#5ca66b' })),
        ...chain(4, (i) => P(`Companion cell ${i}`, [0.05, 0.7 + i * 0.3, -0.05], [0.02, 0.25, 0.02], `Companion cell ${i}: loads sugar into the sieve tube.`, { k: 'cap', r: 0.012, h: 0.2, c: '#7fc87f' })),
      ],
      photosynthesis: [
        P('Leaf blade (left)', [-0.75, 0.95, 0], [0.9, 0.03, 0.55], 'The blade is a solar panel flattened for diffusion.', { k: 'box', rot: [0, 0, 0.25], c: '#5ca66b' }),
        P('Leaf blade (right)', [0.75, 1.45, 0], [0.9, 0.03, 0.55], 'Upper surface waxy, lower surface breathing.', { k: 'box', rot: [0, 0, -0.25], c: '#5ca66b' }),
        P('Cuticle (left)', [-0.75, 0.98, 0], [0.92, 0.01, 0.57], 'Cuticle wax cuts water loss to a trickle.', { k: 'box', rot: [0, 0, 0.25], c: '#d8e8b0', op: 0.4 }),
        P('Cuticle (right)', [0.75, 1.48, 0], [0.92, 0.01, 0.57], 'Thicker cuticle on the sun-facing side.', { k: 'box', rot: [0, 0, -0.25], c: '#d8e8b0', op: 0.4 }),
        P('Palisade mesophyll', [-0.75, 0.94, 0], [0.85, 0.02, 0.5], 'Palisade cells stack chloroplasts in the light path.', { k: 'box', rot: [0, 0, 0.25], c: '#3f8a4a' }),
        P('Spongy mesophyll', [-0.75, 0.91, 0], [0.85, 0.02, 0.5], 'Air spaces here let CO2 reach every cell.', { k: 'box', rot: [0, 0, 0.25], c: '#6ab06a', op: 0.7 }),
        ...chain(12, (i) => P(`Stoma & guard cells ${i}`, [-0.95 + (i % 4) * 0.45, 0.88, -0.2 + Math.floor(i / 4) * 0.2], [0.06, 0.02, 0.04], `Stoma ${i}: guard cells swell with water to open the pore.`, { shapes: [{ k: 'cap', pos: [-0.02, 0, 0], r: 0.02, h: 0.01, rot: [0, 0, 0.5], c: '#4a9a5a' }, { k: 'cap', pos: [0.02, 0, 0], r: 0.02, h: 0.01, rot: [0, 0, -0.5], c: '#4a9a5a' }, { k: 'box', pos: [0, -0.005, 0], size: [0.02, 0.01, 0.03], c: '#2a4a2a' }] })),
        P('Midrib (left)', [-0.75, 0.93, 0], [0.9, 0.05, 0.06], 'The midrib is the leaf spine and main vein.', { k: 'tube', pts: [[-0.32, 0.83, 0], [-1.15, 1.05, 0]], r: 0.025, c: '#4a8a4a' }),
        ...chain(8, (i) => P(`Lateral vein ${i}`, [-0.5 - (i % 4) * 0.15, 0.9 + Math.floor(i / 4) * 0.06, -0.18 + (i % 4) * 0.12], [0.3, 0.02, 0.02], `Vein ${i}: veins deliver water and collect sugar.`, { k: 'cyl', r: 0.01, h: 0.3, rot: [0, 0.6, Math.PI / 2], c: '#4a8a4a' })),
        ...chain(4, (i) => P(`Stipule ${i}`, [(i % 2 ? -1 : 1) * 0.12, 0.5 + Math.floor(i / 2) * 0.6, 0.06], [0.12, 0.02, 0.08], `Stipule ${i}: leaf-base guards, sometimes photosynthetic.`, { k: 'box', c: '#7fae6a' })),
        ...chain(6, (i) => P(`Trichome ${i}`, [-0.9 + i * 0.3, 1.0, 0.24], [0.02, 0.08, 0.02], `Trichome ${i}: hairs that shade, trap and deter.`, { k: 'cone', r: 0.012, h: 0.08, c: '#e8e8d8' })),
        ...ring(8, 0.3, (i, pos) => P(`Chloroplast ${i}`, [-0.75 + pos[0], 0.95, pos[2]], [0.06, 0.03, 0.06], `Chloroplast ${i}: thylakoid stacks run the light reactions.`, { k: 'sph', r: 0.03, c: '#2f7a3a' })),
      ],
      flower: [
        P('Pedicel', [0, 1.75, 0], [0.08, 0.4, 0.08], 'The pedicel holds the flower to the stem.', { k: 'cyl', r: 0.035, h: 0.4, c: '#6a9a5a' }),
        P('Receptacle', [0, 1.95, 0], [0.24, 0.12, 0.24], 'The receptacle is the flower platform.', { k: 'cyl', r: 0.12, h: 0.1, c: '#7fae6a' }),
        ...ring(5, 0.16, (i, pos) => P(`Sepal ${i}`, [pos[0], 2.0, pos[2]], [0.1, 0.14, 0.03], `Sepal ${i}: the calyx armour of the bud.`, { k: 'box', rot: [0, 0, 0.6], c: '#5ca66b' })),
        ...ring(5, 0.22, (i, pos) => P(`Petal ${i}`, [pos[0], 2.08, pos[2]], [0.16, 0.02, 0.14], `Petal ${i}: the corolla billboard for pollinators.`, { k: 'box', rot: [0, 0, 0.35], c: '#e88ab0' })),
        ...ring(6, 0.12, (i, pos) => P(`Stamen ${i} (anther + filament)`, [pos[0], 2.12, pos[2]], [0.05, 0.2, 0.05], `Stamen ${i}: the anther dusts pollen onto visitors.`, { shapes: [{ k: 'cyl', pos: [0, 0.06, 0], r: 0.012, h: 0.14, c: '#e8d48b' }, { k: 'box', pos: [0, 0.15, 0], size: [0.06, 0.04, 0.03], c: '#d8a24a' }] })),
        P('Carpel (ovary + style + stigma)', [0, 2.16, 0], [0.14, 0.3, 0.14], 'The carpel closes ovules safely inside.', { shapes: [{ k: 'sph', pos: [0, 0, 0], r: 0.08, c: '#b0d060' }, { k: 'cyl', pos: [0, 0.12, 0], r: 0.02, h: 0.12, c: '#b0d060' }, { k: 'sph', pos: [0, 0.2, 0], r: 0.035, c: '#d8e88b' }] }),
        ...ring(6, 0.06, (i, pos) => P(`Ovule ${i}`, [pos[0], 2.14, pos[2]], [0.03, 0.03, 0.03], `Ovule ${i}: each ovule can become a seed.`, { k: 'sph', r: 0.02, c: '#e8e2c8' })),
        ...ring(5, 0.1, (i, pos) => P(`Nectary ${i}`, [pos[0], 1.99, pos[2]], [0.04, 0.02, 0.04], `Nectary ${i}: sugar payment for pollination service.`, { k: 'sph', r: 0.02, c: '#f0d060' })),
        ...ring(8, 0.3, (i, pos) => P(`Pollen grain ${i}`, [pos[0], 2.24 + (i % 3) * 0.03, pos[2]], [0.02, 0.02, 0.02], `Pollen ${i}: the male gametophyte in a tough coat.`, { k: 'sph', r: 0.012, c: '#f0e3a0' })),
      ],
      seed: [
        P('Seed coat', [0.5, -0.4, 0.4], [0.16, 0.1, 0.12], 'The coat sleeps the embryo through bad seasons.', { k: 'sph', r: 0.08, c: '#8a6a4a' }),
        P('Endosperm', [0.5, -0.4, 0.4], [0.12, 0.08, 0.09], 'Endosperm starch feeds the seedling start.', { k: 'sph', r: 0.06, c: '#e8e2c8' }),
        P('Cotyledon L', [0.47, -0.38, 0.4], [0.06, 0.05, 0.08], 'First leaves, pre-packed with stores.', { k: 'box', c: '#b0d060' }),
        P('Cotyledon R', [0.53, -0.38, 0.4], [0.06, 0.05, 0.08], 'Dicots carry two cotyledons.', { k: 'box', c: '#b0d060' }),
        P('Radicle', [0.5, -0.46, 0.4], [0.03, 0.06, 0.03], 'The radicle emerges first, anchoring the seedling.', { k: 'cone', r: 0.015, h: 0.06, rot: [Math.PI, 0, 0], c: '#e0cba8' }),
        P('Plumule', [0.5, -0.34, 0.4], [0.03, 0.05, 0.03], 'The plumule waits to become the shoot.', { k: 'cone', r: 0.015, h: 0.05, c: '#7fae6a' }),
        P('Hilum & micropyle', [0.56, -0.42, 0.4], [0.02, 0.02, 0.02], 'The hilum scar marks the seed attachment.', { k: 'sph', r: 0.012, c: '#5a4a3a' }),
        P('Exocarp', [-0.5, -0.4, 0.4], [0.2, 0.16, 0.2], 'Fruit skin: the exocarp wrap.', { k: 'sph', r: 0.1, c: '#c0504d', op: 0.6 }),
        P('Mesocarp', [-0.5, -0.4, 0.4], [0.16, 0.12, 0.16], 'The fleshy mesocarp is the reward that spreads seeds.', { k: 'sph', r: 0.08, c: '#e8a05a' }),
        P('Endocarp', [-0.5, -0.4, 0.4], [0.1, 0.08, 0.1], 'The stony endocarp guards the seed.', { k: 'sph', r: 0.05, c: '#8a6a4a' }),
        ...chain(6, (i) => P(`Fruit seed ${i}`, [-0.5 + (i % 3) * 0.03, -0.42 + Math.floor(i / 3) * 0.04, 0.4 + (i % 2) * 0.03], [0.03, 0.02, 0.02], `Fruit seed ${i}: fertilised ovules in their fruit case.`, { k: 'sph', r: 0.015, c: '#e8e2c8' })),
      ],
    },
  },
  engineering: {
    newSystems: [
      { id: 'cables', label: 'Cables & anchorages', color: '#d8b25c' },
      { id: 'substructure', label: 'Towers, piers & foundations', color: '#8a8a9a' },
    ],
    parts: {
      structure: [
        P('Wearing surface', [0, 0.55, 0], [3.8, 0.06, 0.8], 'Asphalt wearing surface takes the tyre loads.', { c: '#4a4a4a' }),
        P('Deck plate', [0, 0.46, 0], [3.8, 0.08, 0.86], 'The orthotropic deck plate spreads wheel point loads.', { c: '#7a8a9a' }),
        P('Sidewalk L', [-0.0, 0.56, 0.62], [3.8, 0.04, 0.22], 'Pedestrian walkways cantilever off the deck.', { c: '#9aa0a8' }),
        P('Sidewalk R', [0, 0.56, -0.62], [3.8, 0.04, 0.22], 'Kerbs separate walkers from traffic.', { c: '#9aa0a8' }),
        P('Parapet L', [0, 0.68, 0.72], [3.8, 0.2, 0.05], 'Parapets contain vehicles at the deck edge.', { c: '#8a9aa8' }),
        P('Parapet R', [0, 0.68, -0.72], [3.8, 0.2, 0.05], 'Parapets also carry the handrail loads.', { c: '#8a9aa8' }),
        ...chain(14, (i) => P(`Railing post ${i}`, [-1.8 + i * 0.28, 0.66, 0.72], [0.03, 0.24, 0.03], `Railing post ${i}: posts keep the parapet line true.`, { k: 'cyl', r: 0.015, h: 0.24, c: '#b0b8c0' })),
        ...chain(6, (i) => P(`Drainage scupper ${i}`, [-1.5 + i * 0.6, 0.42, 0.44], [0.06, 0.08, 0.06], `Scupper ${i}: scuppers throw rainwater clear of the deck.`, { k: 'cyl', r: 0.03, h: 0.08, c: '#5a6a7a' })),
        ...chain(6, (i) => P(`Floor beam ${i}`, [-1.5 + i * 0.6, 0.28, 0], [0.08, 0.18, 1.7], `Floor beam ${i}: floor beams hand deck load to the truss nodes.`, { c: '#6a7a8a' })),
        ...chain(4, (i) => P(`Stringer ${i}`, [0, 0.36, -0.6 + i * 0.4], [3.6, 0.12, 0.06], `Stringer ${i}: stringers span between floor beams.`, { c: '#7a8a9a' })),
        ...chain(12, (i) => P(`Top chord ${i}`, [-1.7 + (i % 6) * 0.62, 1.75, i < 6 ? 0.45 : -0.45], [0.62, 0.1, 0.1], `Top chord ${i}: the top chord carries compression.`, { c: '#5ca66b' })),
        ...chain(12, (i) => P(`Bottom chord ${i}`, [-1.7 + (i % 6) * 0.62, 0.5, i < 6 ? 0.45 : -0.45], [0.62, 0.1, 0.1], `Bottom chord ${i}: the bottom chord carries tension.`, { c: '#5ca66b' })),
        ...chain(12, (i) => P(`Vertical ${i}`, [-1.7 + (i % 6) * 0.62, 1.12, i < 6 ? 0.45 : -0.45], [0.07, 1.25, 0.07], `Vertical ${i}: verticals tie the chords together at panels.`, { c: '#6ab07a' })),
        ...chain(10, (i) => P(`Diagonal ${i}`, [-1.55 + (i % 5) * 0.62, 1.12, i < 5 ? 0.45 : -0.45], [0.07, 1.4, 0.07], `Diagonal ${i}: diagonals take the shear as axial force.`, { k: 'cyl', r: 0.035, h: 1.4, rot: [0, 0, i % 2 ? 0.7 : -0.7], c: '#7fc88a' })),
        ...chain(8, (i) => P(`Gusset plate ${i}`, [-1.7 + (i % 4) * 0.9, 1.12 + (i < 4 ? 0.6 : -0.6), i < 4 ? 0.5 : -0.5], [0.22, 0.22, 0.02], `Gusset ${i}: gusset plates bolt the member ends together.`, { k: 'cyl', r: 0.11, h: 0.02, rot: [Math.PI / 2, 0, 0], c: '#8a9aa8' })),
        ...chain(6, (i) => P(`Lateral bracing ${i}`, [-1.4 + i * 0.56, 1.8, 0], [0.05, 0.5, 0.05], `Lateral bracing ${i}: plan bracing stops the deck swaying sideways.`, { k: 'cyl', r: 0.025, h: 0.5, rot: [Math.PI / 2, 0, 0.6], c: '#6ab07a' })),
        ...chain(4, (i) => P(`Sway bracing ${i}`, [-1.2 + i * 0.8, 1.4, 0], [0.05, 0.9, 0.05], `Sway frame ${i}: portal frames keep the truss planes parallel.`, { k: 'cyl', r: 0.025, h: 0.9, rot: [Math.PI / 2, 0, 0], c: '#6ab07a' })),
        P('End post L', [-1.85, 1.12, 0.45], [0.1, 1.4, 0.1], 'End posts close the truss triangle at the abutment.', { c: '#5ca66b' }),
        P('End post R', [-1.85, 1.12, -0.45], [0.1, 1.4, 0.1], 'End posts react the bearing thrust.', { c: '#5ca66b' }),
      ],
      cables: [
        P('Main cable L', [-1.2, 1.6, 0.5], [3.8, 0.9, 0.1], 'Each main cable is thousands of spun steel wires.', { k: 'tube', pts: [[-1.9, 0.6, 0.5], [-1.2, 2.2, 0.5], [0, 0.85, 0.5], [1.2, 2.2, 0.5], [1.9, 0.6, 0.5]], r: 0.05, c: '#c8b060' }),
        P('Main cable R', [-1.2, 1.6, -0.5], [3.8, 0.9, 0.1], 'Cables work in pure tension — never bending.', { k: 'tube', pts: [[-1.9, 0.6, -0.5], [-1.2, 2.2, -0.5], [0, 0.85, -0.5], [1.2, 2.2, -0.5], [1.9, 0.6, -0.5]], r: 0.05, c: '#c8b060' }),
        ...chain(16, (i) => P(`Suspender rope ${i}`, [-1.1 + (i - 1) * 0.146, 0.95, (i % 2 ? 0.5 : -0.5)], [0.02, 0.9, 0.02], `Suspender ${i}: hangers drop the deck from the main cable.`, { k: 'cyl', r: 0.012, h: 0.5 + Math.abs(-1.1 + (i - 1) * 0.146) * 0.5, c: '#d8c08a' })),
        ...chain(16, (i) => P(`Cable band ${i}`, [-1.1 + (i - 1) * 0.146, 0.85 + 1.35 * Math.pow((-1.1 + (i - 1) * 0.146) / 1.2, 2) * 0.4, (i % 2 ? 0.5 : -0.5)], [0.08, 0.1, 0.08], `Cable band ${i}: clamps that grip the cable at each hanger.`, { k: 'cyl', r: 0.06, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#8a8a9a' })),
        P('Tower saddle L', [-1.2, 2.24, 0.5], [0.16, 0.08, 0.14], 'Saddles let the cable glide slightly with temperature.', { k: 'cap', r: 0.07, h: 0.05, c: '#6a6a7a' }),
        P('Tower saddle R', [-1.2, 2.24, -0.5], [0.16, 0.08, 0.14], 'Saddle castings seat the cable on the tower head.', { k: 'cap', r: 0.07, h: 0.05, c: '#6a6a7a' }),
        P('Splay plate L', [-1.88, 0.62, 0.5], [0.14, 0.2, 0.14], 'Splay plates fan the cable strands into the anchorage.', { k: 'cone', r: 0.08, h: 0.18, rot: [0, 0, 2.4], c: '#7a7a8a' }),
        P('Splay plate R', [-1.88, 0.62, -0.5], [0.14, 0.2, 0.14], 'Strand shoes bolt to the splay plates.', { k: 'cone', r: 0.08, h: 0.18, rot: [0, 0, 2.4], c: '#7a7a8a' }),
        P('Anchorage L', [-2.05, 0.35, 0.5], [0.5, 0.6, 0.5], 'Gravity anchorages bury the cable tension in concrete.', { c: '#8a8a92' }),
        P('Anchorage R', [-2.05, 0.35, -0.5], [0.5, 0.6, 0.5], 'Anchorages resist both pull and uplift.', { c: '#8a8a92' }),
      ],
      substructure: [
        P('Tower leg L1', [-1.2, 1.2, 0.62], [0.16, 2.2, 0.16], 'Tower legs carry the whole deck weight downward.', { c: '#7a8a9a' }),
        P('Tower leg L2', [-1.2, 1.2, -0.62], [0.16, 2.2, 0.16], 'Legs taper as the compression eases upward.', { c: '#7a8a9a' }),
        P('Tower leg R1', [1.2, 1.2, 0.62], [0.16, 2.2, 0.16], 'Towers also brace against wind and traffic sway.', { c: '#7a8a9a' }),
        P('Tower leg R2', [1.2, 1.2, -0.62], [0.16, 2.2, 0.16], 'Tower steel is boxed to resist buckling.', { c: '#7a8a9a' }),
        P('Portal strut lower', [-1.2, 0.9, 0], [0.12, 0.12, 1.24], 'Portal struts tie the tower legs together.', { c: '#8a9aa8' }),
        P('Portal strut mid', [-1.2, 1.6, 0], [0.1, 0.1, 1.24], 'Mid struts share the wind moment.', { c: '#8a9aa8' }),
        P('Portal strut upper', [-1.2, 2.1, 0], [0.1, 0.1, 1.24], 'Upper struts stiffen the saddle zone.', { c: '#8a9aa8' }),
        P('Tower foundation L', [-1.2, -0.15, 0], [0.7, 0.5, 1.6], 'Caissons sink the towers to bearing rock.', { c: '#6a6a72' }),
        P('Tower foundation R', [1.2, -0.15, 0], [0.7, 0.5, 1.6], 'Foundations must resist both push and pull.', { c: '#6a6a72' }),
        ...chain(4, (i) => P(`Pier ${i}`, [-1.5 + i * 1.0, 0.05, 0], [0.24, 0.7, 0.34], `Pier ${i}: piers carry spans down to the foundations.`, { c: '#9a9aa2' })),
        ...chain(4, (i) => P(`Pile cap ${i}`, [-1.5 + i * 1.0, -0.32, 0], [0.4, 0.2, 0.5], `Pile cap ${i}: caps spread pier load across the pile group.`, { c: '#7a7a82' })),
        ...chain(8, (i) => P(`Foundation pile ${i}`, [-1.62 + Math.floor(i / 2) * 1.0 + (i % 2) * 0.24, -0.7, (i % 2 ? 0.12 : -0.12)], [0.1, 0.7, 0.1], `Pile ${i}: driven piles reach bearing strata deep below.`, { k: 'cyl', r: 0.05, h: 0.7, c: '#5a5a62' })),
        P('Abutment N', [-1.98, 0.1, 0], [0.3, 0.8, 1.2], 'Abutments hold the approach embankment back.', { c: '#8a8a92' }),
        P('Abutment S', [1.98, 0.1, 0], [0.3, 0.8, 1.2], 'Abutments carry the end spans and bearings.', { c: '#8a8a92' }),
        P('Wing wall N', [-2.1, 0.1, 0.7], [0.4, 0.6, 0.12], 'Wing walls retain the embankment sides.', { c: '#7a7a82' }),
        P('Wing wall S', [2.1, 0.1, -0.7], [0.4, 0.6, 0.12], 'Wing walls guide water under the span.', { c: '#7a7a82' }),
        ...chain(8, (i) => P(`Bearing ${i}`, [-1.8 + i * 0.51, 0.16, (i % 2 ? 0.3 : -0.3)], [0.12, 0.08, 0.2], `Bearing ${i}: bearings pass load while letting the deck move.`, { k: 'cyl', r: 0.06, h: 0.08, c: '#4a4a52' })),
      ],
      motion: [
        P('Tuned mass damper', [0, 0.2, 0], [0.3, 0.3, 0.3], 'A tuned mass damper soaks up wind-induced sway.', { k: 'sph', r: 0.15, c: '#d8b25c' }),
        ...chain(4, (i) => P(`Wind shoe ${i}`, [-1.5 + i * 1.0, 0.2, 0.5], [0.1, 0.12, 0.08], `Wind shoe ${i}: wind shoes stop lateral lift at the piers.`, { c: '#5a6a7a' })),
      ],
    },
  },
  vehicle: {
    newSystems: [
      { id: 'electronics', label: 'Electronics & charging', color: '#8fb8d8' },
      { id: 'thermal', label: 'Thermal management', color: '#79b9d3' },
    ],
    parts: {
      energy: [
        P('Pack case', [0, 0.28, 0], [2.6, 0.34, 1.5], 'The sealed pack case is a structural floor member.', { c: '#5a6a7a', op: 0.45 }),
        ...chain(12, (i) => P(`Battery module ${i}`, [-1.15 + (i % 6) * 0.42, 0.28, i < 6 ? -0.35 : 0.35], [0.38, 0.26, 0.6], `Module ${i}: modules group cells for service and cooling.`, { c: '#4a7a5a' })),
        ...ring(16, 0.9, (i, pos) => P(`Prismatic cell ${i}`, [pos[0] * 1.2, 0.3, pos[2] * 0.55], [0.06, 0.2, 0.1], `Cell ${i}: lithium nickel-manganese-cobalt pouches store the energy.`, { k: 'box', c: '#7fc88a' })),
        ...chain(6, (i) => P(`Busbar ${i}`, [-1.0 + i * 0.4, 0.42, 0], [0.3, 0.02, 0.08], `Busbar ${i}: aluminium busbars weld the cells in series.`, { c: '#c8c8d0' })),
        ...chain(4, (i) => P(`Cooling plate ${i}`, [-0.9 + i * 0.6, 0.14, 0], [0.5, 0.03, 1.3], `Cooling plate ${i}: plates hold every cell inside 5 °C of its neighbours.`, { c: '#79b9d3' })),
        P('Coolant loop pipe', [1.35, 0.2, 0.7], [0.6, 0.06, 0.06], 'Glycol coolant sweeps heat from pack to radiator.', { k: 'tube', pts: [[1.3, 0.2, 0.7], [1.5, 0.3, 0.2], [1.4, 0.25, -0.6]], r: 0.025, c: '#5a9ab0' }),
        P('Battery management system', [-1.3, 0.42, 0.6], [0.24, 0.1, 0.3], 'The BMS balances cells and watches every volt and degree.', { c: '#3a5a3a' }),
        P('Main contactor +', [1.2, 0.4, -0.5], [0.12, 0.1, 0.1], 'Contactors isolate the pack in a crash or a fault.', { k: 'box', c: '#c0504d' }),
        P('Main contactor −', [1.2, 0.4, -0.65], [0.12, 0.1, 0.1], 'Two contactors break both high-voltage rails.', { k: 'box', c: '#c0504d' }),
        P('Pyrotechnic fuse', [1.1, 0.44, -0.57], [0.1, 0.06, 0.06], 'The pyro fuse fires to cut power in milliseconds.', { k: 'cyl', r: 0.03, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#d8b25c' }),
        P('Service disconnect', [-1.35, 0.44, -0.6], [0.1, 0.08, 0.12], 'The manual service disconnect makes the pack safe to touch.', { k: 'box', c: '#e8a05a' }),
        P('Pack vent valve', [0, 0.12, 0.72], [0.1, 0.05, 0.05], 'Vents release gas safely during a thermal event.', { k: 'cyl', r: 0.03, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#8a8a92' }),
      ],
      powertrain: [
        P('Motor stator', [1.5, 0.5, 0], [0.4, 0.4, 0.4], 'The stator windings make the rotating magnetic field.', { k: 'cyl', r: 0.2, h: 0.36, rot: [0, 0, Math.PI / 2], c: '#b06a5a' }),
        P('Motor rotor', [1.5, 0.5, 0], [0.26, 0.34, 0.26], 'The rotor spins at up to 18,000 rpm.', { k: 'cyl', r: 0.12, h: 0.32, rot: [0, 0, Math.PI / 2], c: '#8a8a92' }),
        P('Motor shaft', [1.72, 0.5, 0], [0.3, 0.08, 0.08], 'One shaft, one gear ratio — no shifts.', { k: 'cyl', r: 0.04, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#c8c8d0' }),
        P('Cooling jacket', [1.5, 0.5, 0], [0.46, 0.46, 0.46], 'A water jacket wraps the stator slots.', { k: 'cyl', r: 0.23, h: 0.38, rot: [0, 0, Math.PI / 2], c: '#79b9d3', op: 0.4 }),
        P('Traction inverter', [1.5, 0.85, 0], [0.4, 0.18, 0.5], 'The inverter switches DC to three-phase AC thousands of times a second.', { c: '#3a4a5a' }),
        P('Single-speed gearbox', [1.85, 0.5, 0], [0.24, 0.3, 0.3], 'A fixed ratio multiplies torque to the wheels.', { k: 'cyl', r: 0.15, h: 0.22, rot: [0, 0, Math.PI / 2], c: '#6a6a72' }),
        P('Differential', [1.95, 0.5, 0], [0.2, 0.24, 0.24], 'The diff splits torque and allows wheel speed differences.', { k: 'sph', r: 0.12, c: '#5a5a62' }),
        P('Halfshaft L', [1.95, 0.5, 0.5], [0.1, 0.1, 0.9], 'Halfshafts carry torque out to the wheels.', { k: 'cyl', r: 0.04, h: 0.9, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0' }),
        P('Halfshaft R', [1.95, 0.5, -0.5], [0.1, 0.1, 0.9], 'CV joints let the shafts flex with suspension travel.', { k: 'cyl', r: 0.04, h: 0.9, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0' }),
        P('Motor mount L', [1.4, 0.72, 0.3], [0.12, 0.14, 0.1], 'Mounts isolate motor whine from the cabin.', { k: 'box', c: '#3a3a42' }),
        P('Motor mount R', [1.4, 0.72, -0.3], [0.12, 0.14, 0.1], 'Mounts also catch the drive unit in a crash.', { k: 'box', c: '#3a3a42' }),
        P('Resolver sensor', [1.32, 0.5, 0.16], [0.08, 0.08, 0.06], 'The resolver tells the inverter exactly where the rotor is.', { k: 'cyl', r: 0.04, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#d8b25c' }),
      ],
      chassis: [
        P('Front subframe', [1.6, 0.35, 0], [0.7, 0.14, 1.3], 'Subframes carry drive unit and suspension picks.', { c: '#4a4a52' }),
        P('Rear subframe', [-1.6, 0.35, 0], [0.7, 0.14, 1.3], 'Rubber bushings decouple road noise.', { c: '#4a4a52' }),
        ...chain(8, (i) => P(`Control arm ${i}`, [(i < 4 ? 1.6 : -1.6) + (i % 2 ? 0.2 : -0.2), 0.24, (i % 4 < 2 ? 0.7 : -0.7)], [0.4, 0.06, 0.08], `Control arm ${i}: wishbones place the wheel in five degrees of freedom.`, { k: 'box', c: '#5a5a62' })),
        ...chain(4, (i) => P(`Steering knuckle ${i}`, [(i < 2 ? 1.85 : -1.85), 0.42, (i % 2 ? 0.82 : -0.82)], [0.12, 0.3, 0.1], `Knuckle ${i}: knuckles carry hub, brakes and steering arms.`, { k: 'box', c: '#7a7a82' })),
        ...chain(4, (i) => P(`Strut ${i}`, [(i < 2 ? 1.75 : -1.75), 0.75, (i % 2 ? 0.8 : -0.8)], [0.1, 0.5, 0.1], `Strut ${i}: dampers convert spring energy to heat.`, { k: 'cyl', r: 0.045, h: 0.5, c: '#3a3a42' })),
        ...chain(4, (i) => P(`Coil spring ${i}`, [(i < 2 ? 1.75 : -1.75), 0.72, (i % 2 ? 0.8 : -0.8)], [0.16, 0.4, 0.16], `Spring ${i}: springs store the road inputs.`, { k: 'tor', r: 0.09, t: 0.025, c: '#c0504d' })),
        P('Anti-roll bar F', [1.6, 0.3, 0], [0.06, 0.06, 1.5], 'Anti-roll bars resist cornering lean.', { k: 'cyl', r: 0.025, h: 1.5, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' }),
        P('Anti-roll bar R', [-1.6, 0.3, 0], [0.06, 0.06, 1.5], 'Bar stiffness tunes the balance.', { k: 'cyl', r: 0.025, h: 1.5, rot: [Math.PI / 2, 0, 0], c: '#5a6a7a' }),
        P('Steering rack', [1.7, 0.35, 0], [0.12, 0.1, 1.2], 'The rack turns motor torque into toe angle.', { k: 'cyl', r: 0.04, h: 1.2, rot: [Math.PI / 2, 0, 0], c: '#8a8a92' }),
        P('Tie rod L', [1.8, 0.36, 0.5], [0.05, 0.05, 0.4], 'Tie rods link rack to knuckle.', { k: 'cyl', r: 0.02, h: 0.4, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0' }),
        P('Tie rod R', [1.8, 0.36, -0.5], [0.05, 0.05, 0.4], 'Toe settings live in the tie rod threads.', { k: 'cyl', r: 0.02, h: 0.4, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0' }),
        ...chain(4, (i) => P(`Brake disc ${i}`, [(i < 2 ? 1.85 : -1.85), 0.42, (i % 2 ? 0.86 : -0.86)], [0.3, 0.3, 0.04], `Disc ${i}: ventilated discs shed braking heat.`, { k: 'cyl', r: 0.15, h: 0.03, rot: [Math.PI / 2, 0, 0], c: '#6a6a72' })),
        ...chain(4, (i) => P(`Brake caliper ${i}`, [(i < 2 ? 1.85 : -1.85), 0.55, (i % 2 ? 0.86 : -0.86)], [0.14, 0.14, 0.1], `Caliper ${i}: calipers squeeze the pads onto the disc.`, { k: 'box', c: '#c0504d' })),
        ...chain(8, (i) => P(`Brake pad ${i}`, [(i < 4 ? 1.85 : -1.85), 0.55, (i % 2 ? 0.9 : -0.9) + (i % 4 < 2 ? 0.03 : -0.03)], [0.1, 0.1, 0.02], `Pad ${i}: friction material converts speed to heat.`, { k: 'box', c: '#3a3a3a' })),
        ...chain(4, (i) => P(`Wheel ${i}`, [(i < 2 ? 1.85 : -1.85), 0.42, (i % 2 ? 0.95 : -0.95)], [0.34, 0.34, 0.16], `Wheel ${i}: forged aluminium keeps unsprung mass low.`, { k: 'cyl', r: 0.17, h: 0.14, rot: [Math.PI / 2, 0, 0], c: '#b0b8c0' })),
        ...chain(4, (i) => P(`Tyre ${i}`, [(i < 2 ? 1.85 : -1.85), 0.42, (i % 2 ? 0.97 : -0.97)], [0.42, 0.42, 0.2], `Tyre ${i}: the contact patch is your only grip.`, { k: 'tor', r: 0.19, t: 0.06, c: '#2a2a2a' })),
      ],
      exterior: [
        P('Front crumple zone', [2.05, 0.6, 0], [0.5, 0.5, 1.4], 'Crumple zones trade metal for deceleration time.', { c: '#8fb8d8', op: 0.4 }),
        P('Rear crumple zone', [-2.05, 0.6, 0], [0.5, 0.5, 1.4], 'Progressive folds manage crash energy.', { c: '#8fb8d8', op: 0.4 }),
        ...chain(4, (i) => P(`Crash rail ${i}`, [(i < 2 ? 1.9 : -1.9), 0.4, (i % 2 ? 0.5 : -0.5)], [0.7, 0.12, 0.12], `Rail ${i}: rails route impact load around the cabin.`, { k: 'box', c: '#7a8a9a' })),
        ...chain(4, (i) => P(`Pillar ${i}`, [(i < 2 ? 0.7 : -0.7), 1.1, (i % 2 ? 0.85 : -0.85)], [0.1, 0.7, 0.1], `Pillar ${i}: boron steel pillars protect the survival cell.`, { k: 'box', c: '#6a7a8a' })),
        P('Roof rail L', [0, 1.45, 0.8], [3.0, 0.08, 0.08], 'Roof rails close the safety cage.', { k: 'box', c: '#6a7a8a' }),
        P('Roof rail R', [0, 1.45, -0.8], [3.0, 0.08, 0.08], 'Rails also carry the curtain airbags.', { k: 'box', c: '#6a7a8a' }),
        P('Floor pan', [0, 0.1, 0], [4.0, 0.06, 1.6], 'The floor pan bonds to the pack for stiffness.', { c: '#5a6a7a' }),
        P('Front bumper beam', [2.2, 0.5, 0], [0.12, 0.16, 1.5], 'Bumper beams spread low-speed impacts.', { k: 'box', c: '#4a4a52' }),
        P('Rear bumper beam', [-2.2, 0.5, 0], [0.12, 0.16, 1.5], 'Beams keep impacts off the pack case.', { k: 'box', c: '#4a4a52' }),
        P('Bonnet', [1.4, 1.05, 0], [1.3, 0.06, 1.5], 'The bonnet is aluminium for pedestrian protection.', { k: 'box', c: '#8fb8d8', op: 0.5 }),
        P('Tailgate', [-1.9, 1.0, 0], [0.5, 0.6, 1.4], 'The tailgate opens onto the frunk-free boot.', { k: 'box', c: '#8fb8d8', op: 0.5 }),
        P('Charge port door', [-1.6, 0.9, 0.92], [0.2, 0.2, 0.04], 'The charge door hides AC and DC inlets.', { k: 'box', c: '#7a8a9a' }),
      ],
      interior: [
        P('Dashboard carrier', [1.2, 0.95, 0], [0.4, 0.3, 1.4], 'The carrier carries screen, vents and airbag.', { c: '#3a3a42' }),
        P('Steering wheel', [1.05, 0.95, 0.42], [0.24, 0.24, 0.08], 'Drive-by-wire steering with force feedback.', { k: 'tor', r: 0.12, t: 0.025, rot: [0, 1.35, 0], c: '#2a2a2a' }),
        P('Accelerator pedal', [1.0, 0.45, 0.35], [0.06, 0.16, 0.08], 'The pedal is a sensor, not a cable.', { k: 'box', c: '#3a3a3a' }),
        P('Brake pedal', [1.0, 0.45, 0.55], [0.06, 0.16, 0.08], 'Blended braking mixes regen and friction.', { k: 'box', c: '#3a3a3a' }),
        P('HV interlock loop', [0, 0.5, 0.75], [1.5, 0.02, 0.02], 'The interlock loop cuts high voltage if any cover opens.', { k: 'tube', pts: [[-1.2, 0.5, 0.75], [0, 0.55, 0.8], [1.2, 0.5, 0.75]], r: 0.01, c: '#e8a05a' }),
        P('Driver airbag', [1.08, 0.95, 0.42], [0.2, 0.2, 0.1], 'Airbags inflate in 30 milliseconds.', { k: 'sph', r: 0.1, c: '#e8e2d0', op: 0.6 }),
        P('Central screen', [1.15, 1.05, 0], [0.06, 0.24, 0.36], 'One screen runs climate, media and drives.', { k: 'box', c: '#1a1a22' }),
      ],
      electronics: [
        P('Onboard charger', [-1.5, 0.6, -0.6], [0.35, 0.2, 0.3], 'The OBC rectifies AC from the wall to pack DC.', { c: '#3a4a5a' }),
        P('DC-DC converter', [-1.5, 0.6, -0.2], [0.25, 0.15, 0.25], 'DC-DC steps pack voltage down to 12 V.', { c: '#3a5a4a' }),
        P('Vehicle control unit', [0.6, 0.7, -0.6], [0.2, 0.1, 0.3], 'The VCU arbitrates torque, thermal and charging.', { c: '#2a3a4a' }),
        P('Telematics unit', [0.4, 1.0, -0.5], [0.15, 0.06, 0.2], 'Telematics reports state of charge and location.', { c: '#2a3a4a' }),
        P('12 V auxiliary battery', [-1.7, 0.7, 0.5], [0.25, 0.18, 0.2], 'The 12 V battery wakes the car and runs lights.', { c: '#4a4a52' }),
        P('Charge port inlet', [-1.62, 0.9, 0.85], [0.12, 0.16, 0.1], 'CCS inlet takes AC on top pins, DC on the big pair.', { k: 'cyl', r: 0.06, h: 0.08, rot: [Math.PI / 2, 0, 0], c: '#2a2a32' }),
        ...chain(4, (i) => P(`HV cable ${i}`, [-1.2 + i * 0.8, 0.5, -0.7], [0.7, 0.05, 0.05], `HV cable ${i}: orange cables mark anything above 60 V.`, { k: 'tube', pts: [[-1.4 + i * 0.8, 0.45, -0.7], [-1.0 + i * 0.8, 0.55, -0.72]], r: 0.02, c: '#e87030' })),
        P('HV fuse box', [-1.3, 0.5, -0.55], [0.2, 0.12, 0.2], 'Pyro fuses protect each high-voltage branch.', { c: '#5a3a3a' }),
        P('Roof antenna', [-0.6, 1.5, 0], [0.2, 0.06, 0.12], 'Shark-fin antenna carries GPS and cellular.', { k: 'cap', r: 0.06, h: 0.04, c: '#2a2a2a' }),
      ],
      thermal: [
        P('Front radiator', [2.1, 0.7, 0], [0.08, 0.5, 1.2], 'The radiator rejects pack and cabin heat.', { k: 'box', c: '#79b9d3' }),
        P('Radiator fan L', [2.0, 0.7, 0.3], [0.3, 0.3, 0.06], 'Fans pull air at low speed.', { k: 'cyl', r: 0.15, h: 0.05, rot: [0, 0, Math.PI / 2], c: '#3a3a42' }),
        P('Radiator fan R', [2.0, 0.7, -0.3], [0.3, 0.3, 0.06], 'Fans reverse to clear debris.', { k: 'cyl', r: 0.15, h: 0.05, rot: [0, 0, Math.PI / 2], c: '#3a3a42' }),
        P('Heat pump compressor', [1.7, 0.75, -0.6], [0.2, 0.2, 0.2], 'The heat pump moves heat three times cheaper than resistance.', { k: 'cyl', r: 0.1, h: 0.18, c: '#5a6a7a' }),
        P('Chiller (battery cooler)', [1.3, 0.6, -0.65], [0.15, 0.15, 0.15], 'The chiller couples refrigerant to coolant for fast charging.', { k: 'box', c: '#79b9d3' }),
        ...chain(4, (i) => P(`Coolant line ${i}`, [0.5 * i - 0.8, 0.35, 0.78], [0.6, 0.04, 0.04], `Coolant line ${i}: four loops share and shuffle heat.`, { k: 'tube', pts: [[-0.9 + i * 0.6, 0.3, 0.78], [-0.5 + i * 0.6, 0.4, 0.8]], r: 0.018, c: '#5a9ab0' })),
        P('Cabin heater core', [1.15, 0.85, 0.3], [0.1, 0.2, 0.3], 'Waste heat warms the cabin first.', { k: 'box', c: '#d88a61' }),
        P('Battery heater film', [0, 0.16, 0.5], [2.0, 0.02, 0.8], 'A heater film brings cold cells up to charging temperature.', { k: 'box', c: '#d88a61', op: 0.6 }),
      ],
    },
  },
  earth: {
    newSystems: [{ id: 'hydrosphere', label: 'Hydrosphere & ice', color: '#5a9ab0' }],
    parts: {
      layers: [
        P('Moho discontinuity', [0, 1.24, 0], [2.5, 0.02, 2.5], 'The Moho jumps seismic waves from crust to mantle.', { k: 'tor', r: 1.24, t: 0.012, c: '#e8d48b' }),
        P('Gutenberg discontinuity', [0, 0.86, 0], [1.74, 0.02, 1.74], 'Core-mantle boundary: S-waves die here.', { k: 'tor', r: 0.86, t: 0.012, c: '#e8a05a' }),
        P('Lehmann discontinuity', [0, 0.44, 0], [0.9, 0.02, 0.9], 'Inner-core boundary found from quake shadows in 1936.', { k: 'tor', r: 0.44, t: 0.01, c: '#f0e3a0' }),
        P("D'' layer", [0, 0.9, 0], [1.82, 0.12, 1.82], 'The D″ layer is a hot chemical blanket at the core edge.', { k: 'sph', r: 0.91, c: '#c06040', op: 0.35 }),
        P('Transition zone', [0, 1.05, 0], [2.14, 0.16, 2.14], '410-660 km: minerals collapse into denser spinel and perovskite.', { k: 'sph', r: 1.07, c: '#d88a61', op: 0.3 }),
        P('Mesosphere (lower mantle)', [0, 0.95, 0], [1.9, 0.4, 1.9], 'The lower mantle flows in million-year convection cells.', { k: 'sph', r: 0.95, c: '#b06a4a', op: 0.3 }),
        P('Lithosphere shell', [0, 1.28, 0], [2.6, 0.06, 2.6], 'The rigid lithosphere is broken into the moving plates.', { k: 'sph', r: 1.3, c: '#ad6e52', op: 0.28 }),
        P('Continental crust', [0.5, 1.3, 0.4], [0.9, 0.08, 0.8], 'Granitic continents float thick and light.', { k: 'box', c: '#c8a878' }),
        P('Oceanic crust', [-0.6, 1.26, -0.5], [0.9, 0.05, 0.8], 'Basaltic ocean floor is thin, dense and young.', { k: 'box', c: '#6a7a6a' }),
        P('Inner core anisotropy axis', [0, 0.2, 0], [0.06, 0.8, 0.06], 'Iron crystals align near the rotation axis.', { k: 'cyl', r: 0.025, h: 0.8, c: '#f0e3a0' }),
      ],
      tectonics: [
        ...chain(7, (i) => P(`Tectonic plate ${i}`, [1.32 * Math.cos(i * 0.9), 1.32 * Math.sin(i * 0.7) * 0.6, 1.32 * Math.sin(i * 0.9)], [0.7, 0.5, 0.7], `Plate ${i}: seven major plates ride the asthenosphere at fingernail speed.`, { k: 'sph', r: 0.34, c: ['#c0504d', '#5ca66b', '#8fb8d8', '#d8b25c', '#ad9bd8', '#d88ab0', '#79b9d3'][i - 1], op: 0.4 })),
        P('Mid-Atlantic Ridge', [0, 0.4, 1.3], [0.2, 1.4, 0.2], 'New ocean floor wells up along the ridge crest.', { k: 'tube', pts: [[-0.3, -0.9, 1.15], [0.1, 0, 1.3], [-0.2, 0.9, 1.1]], r: 0.035, c: '#d87171' }),
        P('East Pacific Rise', [-1.2, -0.3, 0.5], [0.2, 1.2, 0.2], 'The fastest spreading centre on Earth.', { k: 'tube', pts: [[-1.15, -0.8, 0.4], [-1.3, -0.1, 0.55], [-1.1, 0.7, 0.5]], r: 0.03, c: '#d87171' }),
        P('Indian Ridge', [0.7, -0.9, 0.8], [0.2, 0.9, 0.2], 'Ridge segments offset at transform faults.', { k: 'tube', pts: [[0.4, -1.0, 0.7], [0.8, -0.7, 0.9]], r: 0.03, c: '#d87171' }),
        P('Peru-Chile Trench', [-0.9, -0.5, -1.0], [0.2, 1.2, 0.2], 'Trenches mark where ocean floor bends downward.', { k: 'tube', pts: [[-0.8, -1.0, -0.95], [-1.0, -0.2, -1.05], [-0.85, 0.6, -0.95]], r: 0.03, c: '#5a4a6a' }),
        P('Mariana Trench', [1.1, -0.4, -0.8], [0.2, 0.8, 0.2], 'Deepest point: 10,935 m at Challenger Deep.', { k: 'tube', pts: [[1.0, -0.7, -0.75], [1.2, -0.2, -0.85]], r: 0.028, c: '#5a4a6a' }),
        P('Japan Trench', [1.2, 0.5, 0.6], [0.2, 0.7, 0.2], 'Subduction here drives megathrust quakes.', { k: 'tube', pts: [[1.15, 0.2, 0.7], [1.25, 0.8, 0.5]], r: 0.028, c: '#5a4a6a' }),
        P('Tonga Trench', [-0.4, -1.1, -0.7], [0.2, 0.6, 0.2], 'Tonga subducts faster than anywhere.', { k: 'tube', pts: [[-0.3, -1.15, -0.6], [-0.5, -0.95, -0.8]], r: 0.028, c: '#5a4a6a' }),
        ...chain(4, (i) => P(`Subducting slab ${i}`, [(-1 + i * 0.66) * 0.9, -0.4, (-0.6 + i * 0.4) * 0.9], [0.5, 0.06, 0.3], `Slab ${i}: cold slabs sink to the core-mantle boundary.`, { k: 'box', rot: [0.7, i * 0.8, 0.3], c: '#4a6a8a' })),
        ...chain(3, (i) => P(`Mantle plume ${i}`, [(-0.8 + i * 0.8), 0.2, (i - 1) * 0.7], [0.16, 1.6, 0.16], `Plume ${i}: plumes rise from D″ to feed hotspots.`, { k: 'cone', r: 0.12, h: 1.6, rot: [Math.PI, 0, 0], c: '#e87030', op: 0.6 })),
        ...chain(4, (i) => P(`Volcano ${i}`, [(-0.9 + i * 0.6) * 1.28, 1.28 * 0.75, (i % 2 ? 0.5 : -0.6) * 0.9], [0.16, 0.14, 0.16], `Volcano ${i}: arc and hotspot volcanoes vent mantle gas.`, { k: 'cone', r: 0.09, h: 0.13, c: '#6a4a3a' })),
        P('San Andreas fault', [-1.0, 0.9, 0.75], [0.05, 0.7, 0.05], 'A transform boundary sliding 35 mm a year.', { k: 'box', rot: [0, 0.6, 1.2], c: '#c0504d' }),
        P('Alpine fault', [0.9, -0.9, 0.9], [0.05, 0.5, 0.05], 'New Zealand splits along the Alpine fault.', { k: 'box', rot: [0, 0.4, 1.0], c: '#c0504d' }),
        P('North Anatolian fault', [0.9, 1.0, 0.8], [0.05, 0.5, 0.05], 'Anatolia slides west along this fault.', { k: 'box', rot: [0, 0.2, 1.4], c: '#c0504d' }),
        P('East African Rift', [0.6, 0.6, 1.15], [0.05, 0.8, 0.05], 'A continent splitting apart in slow motion.', { k: 'box', rot: [0.4, 0, 0.2], c: '#c0504d' }),
        ...chain(3, (i) => P(`Craton ${i}`, [(-0.7 + i * 0.7) * 1.1, 1.15, (i - 1) * 0.6], [0.5, 0.1, 0.45], `Craton ${i}: ancient keels stabilise continents for billions of years.`, { k: 'box', c: '#b09a6a' })),
        ...chain(4, (i) => P(`Ocean basin ${i}`, [(i % 2 ? -1 : 1) * 0.8, -0.5 + i * 0.3, (i < 2 ? -1 : 1) * 0.8], [0.8, 0.06, 0.7], `Basin ${i}: abyssal plains are the flattest surfaces on Earth.`, { k: 'box', c: '#4a6a8a', op: 0.5 })),
        ...chain(4, (i) => P(`Continental shelf ${i}`, [(i % 2 ? -1.15 : 1.15), 0.7 - i * 0.35, (i < 2 ? 0.75 : -0.75)], [0.35, 0.04, 0.5], `Shelf ${i}: shallow shelves rim every continent.`, { k: 'box', c: '#79b9d3', op: 0.5 })),
        ...chain(5, (i) => P(`Hotspot island ${i}`, [-0.5 + i * 0.16, 1.3 - i * 0.03, 0.9 - i * 0.05], [0.06, 0.05, 0.06], `Island ${i}: hotspot chains age along the plate motion.`, { k: 'cone', r: 0.035, h: 0.05, c: '#5ca66b' })),
      ],
      atmosphere: [
        P('Troposphere', [0, 1.42, 0], [2.9, 0.14, 2.9], 'Weather lives in the lowest 12 km.', { k: 'sph', r: 1.44, c: '#79b9d3', op: 0.22 }),
        P('Stratosphere', [0, 1.55, 0], [3.2, 0.2, 3.2], 'Temperature rises with height in the stratosphere.', { k: 'sph', r: 1.58, c: '#8fc8e0', op: 0.18 }),
        P('Ozone layer', [0, 1.62, 0], [3.3, 0.04, 3.3], 'Ozone absorbs the UV that would sterilise the surface.', { k: 'tor', r: 1.62, t: 0.02, c: '#9ad0c0' }),
        P('Mesosphere', [0, 1.75, 0], [3.6, 0.2, 3.6], 'Meteors burn in the mesosphere.', { k: 'sph', r: 1.76, c: '#a8d8e8', op: 0.14 }),
        P('Thermosphere', [0, 1.95, 0], [4.0, 0.3, 4.0], 'The ISS orbits inside the thermosphere.', { k: 'sph', r: 1.94, c: '#c0e8f0', op: 0.1 }),
        P('Exosphere', [0, 2.2, 0], [4.5, 0.4, 4.5], 'Atoms escape to space from the exosphere.', { k: 'sph', r: 2.16, c: '#d8f0f8', op: 0.07 }),
        P('Ionosphere', [0, 1.85, 0], [3.8, 0.06, 3.8], 'Ionised layers bend radio waves around the world.', { k: 'sph', r: 1.86, c: '#ad9bd8', op: 0.16 }),
        P('Polar jet stream', [0, 1.5, 0], [3.1, 0.1, 3.1], 'Jet streams steer weather systems at 200 km/h.', { k: 'tor', r: 1.1, t: 0.03, rot: [0.5, 0, 0], c: '#e8e2d0' }),
        P('Subtropical jet stream', [0, 1.45, 0], [3.0, 0.1, 3.0], 'The subtropical jet bounds the Hadley cells.', { k: 'tor', r: 1.25, t: 0.025, rot: [-0.4, 0, 0], c: '#e8e2d0' }),
        ...chain(4, (i) => P(`Cloud band ${i}`, [(-0.9 + i * 0.6) * 1.4, 1.35, (i % 2 ? 0.6 : -0.7)], [0.6, 0.08, 0.35], `Cloud band ${i}: cloud albedo cools the planet.`, { k: 'cap', r: 0.12, h: 0.4, rot: [0, i, Math.PI / 2], c: '#f0f4f8', op: 0.7 })),
        P('Aurora oval N', [0, 1.7, 0], [1.0, 0.1, 1.0], 'Aurorae ring the magnetic poles.', { k: 'tor', r: 0.55, t: 0.03, rot: [0, 0, 0], c: '#7fc88a', op: 0.6 }),
        P('Aurora oval S', [0, -1.7, 0], [1.0, 0.1, 1.0], 'Solar wind particles paint the ovals.', { k: 'tor', r: 0.55, t: 0.03, c: '#7fc88a', op: 0.6 }),
        ...chain(6, (i) => P(`Magnetic field line ${i}`, [0, 0, 0], [2.4, 2.4, 0.06], `Field line ${i}: the geodynamo shields us from solar wind.`, { k: 'tor', r: 1.5 + (i % 3) * 0.2, t: 0.012, rot: [Math.PI / 2, (i / 6) * Math.PI, 0], c: '#8fb8d8', op: 0.35 })),
      ],
      hydrosphere: [
        P('Pacific Ocean', [-1.0, 0.3, 0.95], [1.4, 1.0, 0.1], 'The Pacific holds half the ocean water.', { k: 'sph', r: 0.55, c: '#3a7a9a', op: 0.5 }),
        P('Atlantic Ocean', [0.9, 0.4, 0.95], [0.9, 1.2, 0.1], 'The Atlantic widens 2.5 cm every year.', { k: 'sph', r: 0.5, c: '#3a7a9a', op: 0.5 }),
        P('Indian Ocean', [0.6, -0.6, 1.05], [0.9, 0.8, 0.1], 'The warmest ocean of them all.', { k: 'sph', r: 0.45, c: '#3a7a9a', op: 0.5 }),
        P('Arctic Ocean', [0, 1.35, 0], [0.9, 0.1, 0.9], 'Sea ice caps the polar ocean.', { k: 'sph', r: 0.42, c: '#5a9ab0', op: 0.5 }),
        P('Antarctic ice sheet', [0, -1.32, 0], [1.0, 0.14, 1.0], 'Antarctica stores 70% of the fresh water.', { k: 'cap', r: 0.4, h: 0.1, rot: [Math.PI, 0, 0], c: '#f0f4f8' }),
        P('Greenland ice sheet', [0.35, 1.2, 0.35], [0.5, 0.12, 0.5], 'Greenland loses ice to both melt and calving.', { k: 'cap', r: 0.22, h: 0.08, c: '#f0f4f8' }),
        P('Mountain glaciers', [-0.7, 1.1, 0.6], [0.3, 0.06, 0.2], 'Glaciers carve U-valleys as they creep.', { k: 'box', rot: [0.4, 0.5, 0.2], c: '#e8eef4' }),
        P('Groundwater aquifer 1', [0.8, -0.9, 0.8], [0.6, 0.1, 0.5], 'Aquifers hold more liquid fresh water than lakes.', { k: 'box', c: '#79b9d3', op: 0.5 }),
        P('Groundwater aquifer 2', [-0.9, -0.8, -0.8], [0.6, 0.1, 0.5], 'Some aquifer water is tens of thousands of years old.', { k: 'box', c: '#79b9d3', op: 0.5 }),
        P('Groundwater aquifer 3', [0.2, -1.1, -0.6], [0.5, 0.08, 0.4], 'Recharge takes centuries in dry regions.', { k: 'box', c: '#79b9d3', op: 0.5 }),
        P('Gulf Stream', [0.9, 0.6, 0.9], [0.2, 0.2, 0.9], 'The Gulf Stream moves heat north at 100 Sverdrups.', { k: 'tube', pts: [[0.6, 0.2, 1.15], [0.95, 0.6, 0.95], [0.8, 1.0, 0.85]], r: 0.035, c: '#e87030', op: 0.7 }),
        P('Thermohaline conveyor 1', [-0.6, -0.8, 1.0], [0.2, 0.2, 1.2], 'Deep water forms where sea ice leaves salt behind.', { k: 'tube', pts: [[-0.2, -0.4, 1.2], [-0.7, -0.9, 0.95], [-1.0, -0.6, 0.7]], r: 0.03, c: '#4a6a8a', op: 0.7 }),
        P('Thermohaline conveyor 2', [0.4, -1.0, -0.9], [0.2, 0.2, 1.0], 'The global conveyor takes 1,000 years a lap.', { k: 'tube', pts: [[0.1, -1.15, -0.6], [0.5, -0.95, -0.95], [0.9, -0.5, -0.9]], r: 0.03, c: '#4a6a8a', op: 0.7 }),
        P('Water table shell', [0, -0.4, 0], [2.4, 0.6, 2.4], 'The water table mirrors the land above it.', { k: 'sph', r: 1.2, c: '#79b9d3', op: 0.12 }),
      ],
    },
  },
  worm: {
    parts: {
      circulation: [
        P('Dorsal vessel', [0, 0.2, 0], [4.2, 0.06, 0.06], 'The dorsal vessel pumps blood forward above the gut.', { k: 'tube', pts: [[-2.1, 0.2, 0], [0, 0.22, 0], [2.1, 0.2, 0]], r: 0.03, c: '#c0504d' }),
        P('Ventral vessel', [0, -0.16, 0], [4.2, 0.05, 0.05], 'The ventral vessel drives blood backward below the gut.', { k: 'tube', pts: [[-2.1, -0.16, 0], [0, -0.18, 0], [2.1, -0.16, 0]], r: 0.025, c: '#a04040' }),
        P('Subneural vessel', [0, -0.24, 0], [4.2, 0.04, 0.04], 'A third vessel feeds the nerve cord.', { k: 'tube', pts: [[-2.0, -0.24, 0], [2.0, -0.24, 0]], r: 0.018, c: '#b06060' }),
        ...ring(5, 0.16, (i, pos) => P(`Aortic arch ${i} ("heart")`, [-1.5 + i * 0.18, 0.02, 0], [0.1, 0.3, 0.1], `Aortic arch ${i}: five paired arches pulse blood into the ventral vessel.`, { k: 'tor', r: 0.14, t: 0.025, rot: [0, 0, Math.PI / 2], c: '#c0504d' })),
        P('Typhlosole vessel', [0, 0.06, 0], [2.4, 0.03, 0.03], 'A vessel rides the typhlosole fold inside the intestine.', { k: 'tube', pts: [[-1.0, 0.06, 0], [1.6, 0.06, 0]], r: 0.014, c: '#b06060' }),
        ...ring(8, 0.2, (i, pos) => P(`Body-wall capillary ${i}`, [pos[0] * 6, 0.02, pos[2]], [0.03, 0.03, 0.03], `Capillary ${i}: capillary nets in each segment swap gases.`, { k: 'sph', r: 0.016, c: '#d88a8a' })),
      ],
      nerve: [
        P('Cerebral ganglia (brain)', [-2.0, 0.16, 0], [0.12, 0.08, 0.1], 'Twin cerebral ganglia sit above the pharynx.', { k: 'box', c: '#e8d48b' }),
        P('Circumpharyngeal connective L', [-1.98, 0.05, 0.07], [0.04, 0.2, 0.04], 'Connectives ring the pharynx to the cord below.', { k: 'tube', pts: [[-2.0, 0.14, 0.06], [-1.96, -0.1, 0.05]], r: 0.014, c: '#e8d48b' }),
        P('Circumpharyngeal connective R', [-1.98, 0.05, -0.07], [0.04, 0.2, 0.04], 'The ring integrates head and trunk control.', { k: 'tube', pts: [[-2.0, 0.14, -0.06], [-1.96, -0.1, -0.05]], r: 0.014, c: '#e8d48b' }),
        ...chain(10, (i) => P(`Ventral ganglion ${i}`, [-1.7 + i * 0.36, -0.2, 0], [0.08, 0.06, 0.08], `Ganglion ${i}: one ganglion per segment runs local reflexes.`, { k: 'sph', r: 0.035, c: '#e8d48b' })),
        ...chain(10, (i) => P(`Lateral nerve ${i}`, [-1.7 + i * 0.36, -0.1, 0.12], [0.16, 0.02, 0.02], `Lateral nerve ${i}: segmental nerves fan out to muscle and setae.`, { k: 'cyl', r: 0.008, h: 0.16, rot: [0, 0, Math.PI / 2], c: '#d8c47b' })),
        P('Median giant fibre', [0, -0.14, 0], [4.0, 0.03, 0.03], 'Giant fibres fire the whole worm into its burrow at once.', { k: 'tube', pts: [[-2.0, -0.14, 0.02], [2.0, -0.14, 0.02]], r: 0.014, c: '#f0e3a0' }),
        P('Lateral giant fibre L', [0, -0.14, 0.06], [4.0, 0.02, 0.02], 'Lateral giants carry touch alarms forward and back.', { k: 'tube', pts: [[-2.0, -0.14, 0.06], [2.0, -0.14, 0.06]], r: 0.01, c: '#f0e3a0' }),
        P('Lateral giant fibre R', [0, -0.14, -0.06], [4.0, 0.02, 0.02], 'Three giant fibres in parallel cut response time.', { k: 'tube', pts: [[-2.0, -0.14, -0.06], [2.0, -0.14, -0.06]], r: 0.01, c: '#f0e3a0' }),
      ],
      bodywall: [
        ...chain(24, (i) => P(`Setal pair ${i}`, [-2.0 + i * 0.17, -0.12, (i % 2 ? 0.2 : -0.2)], [0.02, 0.06, 0.02], `Setae ${i}: eight chitin bristles per segment grip the soil.`, { k: 'cyl', r: 0.008, h: 0.06, rot: [i % 2 ? 0.6 : -0.6, 0, 0], c: '#e8e2d0' })),
        P('Circular muscle layer', [0, 0, 0], [4.3, 0.44, 0.44], 'Circular muscle contracts to lengthen each segment.', { k: 'cyl', r: 0.225, h: 4.3, rot: [0, 0, Math.PI / 2], c: '#c98274', op: 0.3 }),
        P('Longitudinal muscle layer', [0, 0, 0], [4.3, 0.38, 0.38], 'Longitudinal muscle shortens segments to anchor and pull.', { k: 'cyl', r: 0.195, h: 4.3, rot: [0, 0, Math.PI / 2], c: '#b06a5a', op: 0.35 }),
        P('Coelomic epithelium', [0, 0, 0], [4.3, 0.32, 0.32], 'The coelomic lining bathes organs in fluid pressure.', { k: 'cyl', r: 0.165, h: 4.3, rot: [0, 0, Math.PI / 2], c: '#e8c8a8', op: 0.3 }),
      ],
      digestion: [
        P('Buccal chamber', [-2.05, -0.02, 0], [0.08, 0.08, 0.08], 'The buccal chamber is the mouth porch.', { k: 'box', c: '#d8b25c' }),
        P('Pharynx bulb', [-1.92, 0.02, 0], [0.18, 0.16, 0.16], 'Muscular pharynx sucks in soil and litter.', { k: 'cap', r: 0.08, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#c89858' }),
        P('Oesophagus', [-1.6, 0.02, 0], [0.5, 0.08, 0.08], 'The oesophagus runs past the calciferous glands.', { k: 'tube', pts: [[-1.82, 0.02, 0], [-1.35, 0.02, 0]], r: 0.035, c: '#d8b25c' }),
        P('Crop', [-1.15, 0.02, 0], [0.14, 0.14, 0.14], 'The crop stores a meal before grinding.', { k: 'sph', r: 0.07, c: '#c8a848' }),
        P('Intestine (mid)', [0.4, 0.0, 0], [1.8, 0.14, 0.14], 'The intestine absorbs humus nutrients along the typhlosole.', { k: 'tube', pts: [[-0.5, 0.0, 0], [1.4, 0.0, 0]], r: 0.07, c: '#d8b25c', op: 0.7 }),
        P('Typhlosole fold', [0.4, 0.06, 0], [1.6, 0.06, 0.04], 'The typhlosole fold triples the absorbing surface.', { k: 'box', c: '#e8c878' }),
        ...ring(6, 0.14, (i, pos) => P(`Coelomocyte ${i}`, [pos[0] * 4, 0.05, pos[2]], [0.03, 0.03, 0.03], `Coelomocyte ${i}: wandering cells clean the coelomic fluid.`, { k: 'sph', r: 0.016, c: '#f0e3c0' })),
      ],
      repro: [
        ...chain(6, (i) => P(`Seminal vesicle ${i}`, [-1.3 + i * 0.12, 0.1, (i % 2 ? 0.08 : -0.08)], [0.1, 0.12, 0.08], `Seminal vesicle ${i}: vesicles ripen sperm before mating.`, { k: 'cap', r: 0.05, h: 0.06, c: '#e8d8f0' })),
        P('Ovary L', [-0.85, -0.05, 0.06], [0.06, 0.08, 0.04], 'Ovaries hang on the segment 12/13 septum.', { k: 'box', c: '#d8a8d8' }),
        P('Ovary R', [-0.85, -0.05, -0.06], [0.06, 0.08, 0.04], 'Eggs drop into the coelom at maturity.', { k: 'box', c: '#d8a8d8' }),
        P('Oviduct L', [-0.8, -0.12, 0.08], [0.04, 0.1, 0.04], 'Oviducts carry eggs to the female pores.', { k: 'tube', pts: [[-0.85, -0.06, 0.07], [-0.78, -0.18, 0.09]], r: 0.012, c: '#c898c8' }),
        P('Oviduct R', [-0.8, -0.12, -0.08], [0.04, 0.1, 0.04], 'Cross-fertilisation is obligatory in Lumbricus.', { k: 'tube', pts: [[-0.85, -0.06, -0.07], [-0.78, -0.18, -0.09]], r: 0.012, c: '#c898c8' }),
        P('Vas deferens L', [-1.0, -0.1, 0.1], [0.6, 0.02, 0.02], 'Sperm ducts run back to the clitellum pores.', { k: 'tube', pts: [[-1.2, -0.08, 0.1], [-0.4, -0.14, 0.12]], r: 0.01, c: '#b888b8' }),
        P('Vas deferens R', [-1.0, -0.1, -0.1], [0.6, 0.02, 0.02], 'Both ducts open at segment 15.', { k: 'tube', pts: [[-1.2, -0.08, -0.1], [-0.4, -0.14, -0.12]], r: 0.01, c: '#b888b8' }),
        P('Prostate gland L', [-0.5, -0.06, 0.12], [0.14, 0.1, 0.06], 'Prostates add fluid that activates sperm.', { k: 'cap', r: 0.05, h: 0.08, rot: [0, 0, Math.PI / 2], c: '#c8a8c8' }),
        P('Prostate gland R', [-0.5, -0.06, -0.12], [0.14, 0.1, 0.06], 'Secretions cement the mating clamp.', { k: 'cap', r: 0.05, h: 0.08, rot: [0, 0, Math.PI / 2], c: '#c8a8c8' }),
      ],
      excretion: [
        ...chain(6, (i) => P(`Nephridium ${i}`, [-1.4 + i * 0.5, -0.08, 0.1], [0.14, 0.12, 0.1], `Nephridium ${i}: each funnel-flushed tubule filters coelomic fluid.`, { shapes: [{ k: 'cone', pos: [-0.05, 0.03, 0], r: 0.025, h: 0.05, rot: [0, 0, -1.2], c: '#9ac0d8' }, { k: 'tube', pts: [[-0.04, 0.02, 0], [0.02, -0.03, 0.02], [0.06, 0.01, 0]], r: 0.012, c: '#7fa8c9' }] })),
        ...chain(6, (i) => P(`Nephridiopore ${i}`, [-1.35 + i * 0.5, -0.14, 0.19], [0.02, 0.02, 0.02], `Nephridiopore ${i}: pores vent the filtered waste to the surface.`, { k: 'sph', r: 0.012, c: '#8fb8d8' })),
      ],
    },
  },
  bee: {
    parts: {
      respiration: [
        ...chain(10, (i) => P(`Spiracle ${i}`, [-0.9 + i * 0.2, 0.06, (i % 2 ? 0.16 : -0.16)], [0.03, 0.03, 0.02], `Spiracle ${i}: ten pairs of valve doors admit air, no lungs needed.`, { k: 'cyl', r: 0.014, h: 0.02, rot: [Math.PI / 2, 0, 0], c: '#3a3126' })),
        P('Dorsal tracheal trunk', [0, 0.1, 0], [2.0, 0.04, 0.04], 'Tracheal trunks run the body length.', { k: 'tube', pts: [[-1.0, 0.1, 0.06], [1.0, 0.1, 0.06]], r: 0.016, c: '#c8d8e8', op: 0.7 }),
        P('Ventral tracheal trunk', [0, -0.08, 0], [2.0, 0.04, 0.04], 'Ventral trunks supply the nerve cord.', { k: 'tube', pts: [[-1.0, -0.08, -0.06], [1.0, -0.08, -0.06]], r: 0.016, c: '#c8d8e8', op: 0.7 }),
        P('Thoracic trunk L', [-0.5, 0.02, 0.12], [0.5, 0.05, 0.05], 'Flight muscle gets air through the biggest trunks.', { k: 'tube', pts: [[-0.75, 0.02, 0.12], [-0.25, 0.02, 0.12]], r: 0.02, c: '#d8e8f0', op: 0.7 }),
        P('Thoracic trunk R', [-0.5, 0.02, -0.12], [0.5, 0.05, 0.05], 'Oxygen diffuses straight into every cell.', { k: 'tube', pts: [[-0.75, 0.02, -0.12], [-0.25, 0.02, -0.12]], r: 0.02, c: '#d8e8f0', op: 0.7 }),
        ...chain(6, (i) => P(`Air sac ${i}`, [-0.7 + i * 0.28, 0.08, (i % 2 ? 0.1 : -0.1)], [0.1, 0.08, 0.08], `Air sac ${i}: bellows-like sacs pump air with each abdomen pulse.`, { k: 'sph', r: 0.05, c: '#e8f0f8', op: 0.5 })),
        ...ring(8, 0.14, (i, pos) => P(`Tracheole ${i}`, [pos[0] * 3, 0.0, pos[2]], [0.02, 0.02, 0.02], `Tracheole ${i}: finest tubes end on single muscle fibres.`, { k: 'sph', r: 0.01, c: '#d8e8f0', op: 0.6 })),
      ],
      nerve: [
        P('Suboesophageal ganglion', [-0.98, -0.06, 0], [0.12, 0.08, 0.1], 'The SEG runs mouthparts and tongue.', { k: 'box', c: '#e8d48b' }),
        ...chain(7, (i) => P(`Ventral ganglion ${i}`, [-0.7 + i * 0.24, -0.1, 0], [0.08, 0.06, 0.08], `Ganglion ${i}: fused ganglia form the ventral chain.`, { k: 'sph', r: 0.035, c: '#e8d48b' })),
        P('Optic tract L', [-1.0, 0.06, 0.1], [0.08, 0.03, 0.03], 'Optic trunks carry 5,500 eye channels each side.', { k: 'tube', pts: [[-1.05, 0.07, 0.12], [-0.95, 0.05, 0.06]], r: 0.012, c: '#d8c47b' }),
        P('Optic tract R', [-1.0, 0.06, -0.1], [0.08, 0.03, 0.03], 'Motion vision drives the waggle dance reading.', { k: 'tube', pts: [[-1.05, 0.07, -0.12], [-0.95, 0.05, -0.06]], r: 0.012, c: '#d8c47b' }),
        P('Antennal nerve L', [-1.12, 0.06, 0.08], [0.08, 0.02, 0.02], 'Antennal nerves carry smell from 170 odour receptors.', { k: 'tube', pts: [[-1.16, 0.07, 0.1], [-1.06, 0.05, 0.06]], r: 0.01, c: '#d8c47b' }),
        P('Antennal nerve R', [-1.12, 0.06, -0.08], [0.08, 0.02, 0.02], 'Each antenna holds thousands of sensilla.', { k: 'tube', pts: [[-1.16, 0.07, -0.1], [-1.06, 0.05, -0.06]], r: 0.01, c: '#d8c47b' }),
      ],
      digestion: [
        P('Foregut (crop valve)', [-0.75, 0.0, 0], [0.08, 0.08, 0.08], 'The crop valve meters nectar into the midgut.', { k: 'sph', r: 0.04, c: '#c8a848' }),
        P('Proventriculus', [-0.68, 0.0, 0], [0.07, 0.07, 0.07], 'The proventriculus filters pollen from nectar.', { k: 'cyl', r: 0.035, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#b89838' }),
        P('Ventriculus (midgut)', [-0.45, 0.0, 0], [0.35, 0.12, 0.12], 'The midgut digests and absorbs the whole diet.', { k: 'tube', pts: [[-0.62, 0.0, 0], [-0.28, 0.0, 0]], r: 0.06, c: '#d8b25c', op: 0.8 }),
        ...chain(4, (i) => P(`Midgut fold ${i}`, [-0.58 + i * 0.08, 0.02, 0.04], [0.06, 0.04, 0.02], `Fold ${i}: folds multiply the absorbing surface.`, { k: 'box', c: '#e8c878' })),
        P('Ileum', [-0.1, 0.0, 0], [0.12, 0.08, 0.08], 'The ileum reclaims water and salts.', { k: 'cyl', r: 0.04, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#c8a858' }),
      ],
      thorax: [
        ...chain(4, (i) => P(`Flight muscle ${i} (indirect)`, [-0.62 + (i % 2) * 0.2, 0.06 + Math.floor(i / 2) * 0.08, (i % 2 ? 0.06 : -0.06)], [0.16, 0.08, 0.08], `Flight muscle ${i}: indirect muscles deform the thorax 230 times a second.`, { k: 'cap', r: 0.04, h: 0.1, rot: [i < 2 ? 0 : Math.PI / 2, 0, 0], c: '#c07060' })),
        ...chain(8, (i) => P(`Wing vein ${i}`, [-0.55 + (i % 4) * 0.18, 0.18, (i < 4 ? 0.25 : -0.25) + (i % 4) * 0.06], [0.4, 0.01, 0.02], `Vein ${i}: haemolymph-filled veins stiffen the membrane wing.`, { k: 'cyl', r: 0.008, h: 0.4, rot: [0, 0.3, Math.PI / 2], c: '#8a6a3a' })),
        ...chain(8, (i) => P(`Hamulus ${i}`, [-0.6 + i * 0.08, 0.16, -0.14], [0.01, 0.03, 0.01], `Hamulus ${i}: hooks zip the hindwing to the forewing.`, { k: 'cone', r: 0.006, h: 0.03, c: '#6a5a3a' })),
        ...chain(6, (i) => P(`Leg muscle ${i}`, [-0.5 + (i % 3) * 0.15, -0.05, (i < 3 ? 0.1 : -0.1)], [0.1, 0.06, 0.06], `Leg muscle ${i}: internal muscles work the six legs.`, { k: 'cap', r: 0.03, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#b06050' })),
        ...chain(6, (i) => P(`Trochanter ${i}`, [-0.45 + (i % 3) * 0.2, -0.16, (i < 3 ? 0.16 : -0.16)], [0.03, 0.04, 0.03], `Trochanter ${i}: the trochanter hinge gives legs two planes of motion.`, { k: 'cyl', r: 0.015, h: 0.03, c: '#5a4a2a' })),
      ],
      head: [
        ...chain(8, (i) => P(`Antennal sensillum ${i}`, [-1.2 + (i % 4) * 0.02, 0.08 + Math.floor(i / 4) * 0.03, (i % 2 ? 0.12 : -0.12)], [0.01, 0.02, 0.01], `Sensillum ${i}: plate sensilla smell at parts-per-billion.`, { k: 'cone', r: 0.005, h: 0.02, c: '#8a7a5a' })),
        ...chain(6, (i) => P(`Taste hair ${i}`, [-1.14 + (i % 3) * 0.02, -0.08, (i < 3 ? 0.05 : -0.05) + (i % 3) * 0.02], [0.01, 0.03, 0.01], `Taste hair ${i}: tongue and foot hairs taste sugar on contact.`, { k: 'cyl', r: 0.004, h: 0.03, c: '#8a7a5a' })),
        P('Labial palp L', [-1.1, -0.1, 0.04], [0.06, 0.02, 0.02], 'Palps feel and taste the flower.', { k: 'cyl', r: 0.01, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#6a5a3a' }),
        P('Labial palp R', [-1.1, -0.1, -0.04], [0.06, 0.02, 0.02], 'Palps guide the tongue into the nectary.', { k: 'cyl', r: 0.01, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#6a5a3a' }),
        P('Glossa (tongue)', [-1.16, -0.12, 0], [0.16, 0.02, 0.02], 'The glossa laps nectar 230 times a minute.', { k: 'tube', pts: [[-1.08, -0.12, 0], [-1.24, -0.14, 0]], r: 0.008, c: '#8a6a4a' }),
        P('Proboscis sheath', [-1.12, -0.1, 0], [0.12, 0.04, 0.04], 'The sheath folds the tongue away for flight.', { k: 'cyl', r: 0.02, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#5a4a2a' }),
      ],
      abdomen: [
        ...chain(4, (i) => P(`Wax mirror ${i}`, [0.35 + i * 0.12, -0.14, 0], [0.08, 0.01, 0.08], `Wax mirror ${i}: four pairs of plates secrete wax scales.`, { k: 'box', c: '#f0ead0' })),
        ...chain(6, (i) => P(`Tergite ${i}`, [0.15 + i * 0.16, 0.1, 0], [0.16, 0.06, 0.24], `Tergite ${i}: dorsal plates telescope for breathing and stinging.`, { k: 'cap', r: 0.11, h: 0.05, rot: [0, 0, Math.PI / 2], c: '#c89838' })),
        ...chain(6, (i) => P(`Sternite ${i}`, [0.15 + i * 0.16, -0.1, 0], [0.16, 0.05, 0.22], `Sternite ${i}: ventral plates carry the wax mirrors.`, { k: 'cap', r: 0.1, h: 0.05, rot: [Math.PI, 0, Math.PI / 2], c: '#b88828' })),
        ...chain(4, (i) => P(`Heart ostium ${i}`, [0.2 + i * 0.2, 0.14, 0], [0.02, 0.02, 0.02], `Ostium ${i}: one-way doors let haemolymph into the dorsal heart.`, { k: 'sph', r: 0.01, c: '#d8a8a8' })),
      ],
    },
  },
  frog: {
    newSystems: [
      { id: 'nervous', label: 'Brain & nerves', color: '#e8d48b' },
      { id: 'muscles', label: 'Musculature', color: '#c07060' },
    ],
    parts: {
      skeleton: [
        P('Skull (braincase + jaws)', [-0.95, 0.05, 0], [0.6, 0.3, 0.6], 'The flat frog skull is mostly roof and jaw.', { shapes: [{ k: 'box', pos: [0, 0.05, 0], size: [0.34, 0.16, 0.4], c: '#e8e2d0' }, { k: 'box', pos: [-0.24, -0.04, 0], size: [0.2, 0.06, 0.44], c: '#d8d2c0' }] }),
        P('Frontoparietal', [-0.9, 0.16, 0], [0.3, 0.04, 0.34], 'One fused frontoparietal roofs the brain.', { k: 'box', c: '#e8e2d0' }),
        P('Maxilla L', [-1.05, 0.0, 0.3], [0.34, 0.05, 0.06], 'Maxillae carry the marginal teeth.', { k: 'box', c: '#d8d2c0' }),
        P('Maxilla R', [-1.05, 0.0, -0.3], [0.34, 0.05, 0.06], 'Teeth hold prey, they do not chew.', { k: 'box', c: '#d8d2c0' }),
        P('Premaxilla L', [-1.24, 0.02, 0.12], [0.1, 0.06, 0.08], 'Premaxillae close the snout tip.', { k: 'box', c: '#d8d2c0' }),
        P('Premaxilla R', [-1.24, 0.02, -0.12], [0.1, 0.06, 0.08], 'Each bears a tooth row in most frogs.', { k: 'box', c: '#d8d2c0' }),
        P('Dentary L', [-1.05, -0.1, 0.26], [0.3, 0.05, 0.05], 'The dentary is the whole lower jaw bone.', { k: 'box', c: '#c8c2b0' }),
        P('Dentary R', [-1.05, -0.1, -0.26], [0.3, 0.05, 0.05], 'Frog jaws open by dropping the whole floor.', { k: 'box', c: '#c8c2b0' }),
        P('Atlas (vertebra 1)', [-0.55, 0.12, 0], [0.12, 0.1, 0.16], 'The atlas sockets the skull condyles.', { k: 'cyl', r: 0.07, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#e8e2d0' }),
        ...chain(7, (i) => P(`Typical vertebra ${i + 1}`, [-0.42 + i * 0.13, 0.12, 0], [0.11, 0.1, 0.14], `Vertebra ${i + 1}: seven trunk vertebrae give the frog its short back.`, { k: 'cyl', r: 0.06, h: 0.09, rot: [0, 0, Math.PI / 2], c: '#e8e2d0' })),
        P('Eighth vertebra', [0.5, 0.12, 0], [0.11, 0.1, 0.14], 'Vertebra 8 has a double condyle for the jump hinge.', { k: 'cyl', r: 0.06, h: 0.09, rot: [0, 0, Math.PI / 2], c: '#e0dac8' }),
        P('Ninth (sacral) vertebra', [0.63, 0.12, 0], [0.12, 0.1, 0.16], 'The sacral vertebra locks to the ilia for landing loads.', { k: 'cyl', r: 0.07, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#e0dac8' }),
        P('Urostyle', [0.85, 0.1, 0], [0.35, 0.06, 0.06], 'The urostyle is fused tail vertebrae — a landing spring.', { k: 'cone', r: 0.045, h: 0.35, rot: [0, 0, -Math.PI / 2], c: '#d8d2c0' }),
        P('Suprascapula L', [-0.5, 0.22, 0.3], [0.16, 0.14, 0.04], 'Suprascapulae are cartilage fans over the shoulder.', { k: 'box', c: '#d0e0e0' }),
        P('Suprascapula R', [-0.5, 0.22, -0.3], [0.16, 0.14, 0.04], 'They absorb landing shock from the arms.', { k: 'box', c: '#d0e0e0' }),
        P('Radioulna L', [-0.62, -0.05, 0.42], [0.3, 0.06, 0.06], 'Radius and ulna fuse into one strong forelimb bone.', { k: 'cyl', r: 0.03, h: 0.3, rot: [0.9, 0, 0.4], c: '#e8e2d0' }),
        P('Radioulna R', [-0.62, -0.05, -0.42], [0.3, 0.06, 0.06], 'Fusion trades rotation for landing strength.', { k: 'cyl', r: 0.03, h: 0.3, rot: [-0.9, 0, -0.4], c: '#e8e2d0' }),
        ...chain(4, (i) => P(`Carpal ${i}`, [-0.78 + (i % 2) * 0.04, -0.16, (i < 2 ? 0.55 : -0.55) + (i % 2) * 0.04], [0.04, 0.04, 0.04], `Carpal ${i}: wrist bones stack in two rows.`, { k: 'sph', r: 0.02, c: '#d8d2c0' })),
        ...chain(10, (i) => P(`Metacarpal ${i}`, [-0.84 + (i % 5) * 0.02, -0.2, (i < 5 ? 0.6 : -0.6) + (i % 5) * 0.03], [0.08, 0.02, 0.02], `Metacarpal ${i}: four digits plus a vestigial thumb.`, { k: 'cyl', r: 0.01, h: 0.08, rot: [0.4, 0, 0], c: '#e0dac8' })),
        ...chain(10, (i) => P(`Forelimb phalanx ${i}`, [-0.9 + (i % 5) * 0.02, -0.24, (i < 5 ? 0.66 : -0.66) + (i % 5) * 0.03], [0.06, 0.015, 0.015], `Phalanx ${i}: unwebbed fingers brace the landing.`, { k: 'cyl', r: 0.008, h: 0.06, rot: [0.5, 0, 0], c: '#e0dac8' })),
        P('Femur L', [0.55, -0.05, 0.4], [0.34, 0.07, 0.07], 'Femurs swing the jump from the hip.', { k: 'cyl', r: 0.035, h: 0.34, rot: [0.7, 0, 1.1], c: '#e8e2d0' }),
        P('Femur R', [0.55, -0.05, -0.4], [0.34, 0.07, 0.07], 'Frog femurs rotate forward in the fold.', { k: 'cyl', r: 0.035, h: 0.34, rot: [-0.7, 0, -1.1], c: '#e8e2d0' }),
        P('Tibiofibula L', [0.75, -0.12, 0.55], [0.34, 0.06, 0.06], 'Tibia and fibula fuse for the second jump lever.', { k: 'cyl', r: 0.03, h: 0.34, rot: [0.5, 0, 0.6], c: '#e8e2d0' }),
        P('Tibiofibula R', [0.75, -0.12, -0.55], [0.34, 0.06, 0.06], 'Two levers in series give the long jump.', { k: 'cyl', r: 0.03, h: 0.34, rot: [-0.5, 0, -0.6], c: '#e8e2d0' }),
        ...chain(4, (i) => P(`Tarsal ${i}`, [0.92 + (i % 2) * 0.06, -0.2, (i < 2 ? 0.66 : -0.66)], [0.1, 0.03, 0.03], `Tarsal ${i}: the elongated tarsals add a third lever.`, { k: 'cyl', r: 0.015, h: 0.1, rot: [0.3, 0, 0.4], c: '#d8d2c0' })),
        ...chain(10, (i) => P(`Metatarsal ${i}`, [1.02 + (i % 5) * 0.02, -0.24, (i < 5 ? 0.68 : -0.68) + (i % 5) * 0.035], [0.1, 0.02, 0.02], `Metatarsal ${i}: five long toes spread the push-off.`, { k: 'cyl', r: 0.01, h: 0.1, rot: [0.2, 0, 0.2], c: '#e0dac8' })),
        ...chain(10, (i) => P(`Hindlimb phalanx ${i}`, [1.1 + (i % 5) * 0.02, -0.26, (i < 5 ? 0.74 : -0.74) + (i % 5) * 0.035], [0.07, 0.015, 0.015], `Phalanx ${i}: webbed toes finish the kick.`, { k: 'cyl', r: 0.008, h: 0.07, rot: [0.2, 0, 0.2], c: '#e0dac8' })),
        P('Ischium L', [0.78, 0.05, 0.2], [0.14, 0.1, 0.05], 'Ischia close the pelvic ring behind.', { k: 'box', c: '#d8d2c0' }),
        P('Ischium R', [0.78, 0.05, -0.2], [0.14, 0.1, 0.05], 'The ring transfers jump thrust to the spine.', { k: 'box', c: '#d8d2c0' }),
        P('Acetabulum L', [0.66, 0.0, 0.28], [0.08, 0.08, 0.06], 'The hip socket catches the femur head.', { k: 'tor', r: 0.04, t: 0.015, rot: [Math.PI / 2, 0, 0], c: '#c8c2b0' }),
        P('Acetabulum R', [0.66, 0.0, -0.28], [0.08, 0.08, 0.06], 'Deep sockets survive repeated landings.', { k: 'tor', r: 0.04, t: 0.015, rot: [Math.PI / 2, 0, 0], c: '#c8c2b0' }),
        P('Hyoid apparatus', [-0.95, -0.12, 0], [0.2, 0.04, 0.24], 'The hyoid plate pumps the throat for breathing.', { k: 'box', c: '#d0e0e0' }),
      ],
      nervous: [
        P('Olfactory lobe L', [-1.22, 0.14, 0.1], [0.08, 0.06, 0.05], 'Olfactory lobes smell both water and air.', { k: 'cap', r: 0.03, h: 0.04, rot: [0, 0, Math.PI / 2], c: '#e8d48b' }),
        P('Olfactory lobe R', [-1.22, 0.14, -0.1], [0.08, 0.06, 0.05], 'Smell drives feeding and breeding.', { k: 'cap', r: 0.03, h: 0.04, rot: [0, 0, Math.PI / 2], c: '#e8d48b' }),
        P('Cerebrum', [-1.1, 0.16, 0], [0.14, 0.1, 0.14], 'The cerebrum handles basic behaviour chains.', { k: 'box', c: '#d8c47b' }),
        P('Diencephalon', [-1.0, 0.16, 0], [0.1, 0.09, 0.1], 'The diencephalon links pituitary and optic paths.', { k: 'box', c: '#c8b46b' }),
        P('Optic lobe L', [-0.92, 0.18, 0.09], [0.12, 0.09, 0.08], 'Optic lobes are the frog visual cortex.', { k: 'sph', r: 0.05, c: '#e8d48b' }),
        P('Optic lobe R', [-0.92, 0.18, -0.09], [0.12, 0.09, 0.08], 'They map moving dark spots — prey.', { k: 'sph', r: 0.05, c: '#e8d48b' }),
        P('Cerebellum', [-0.84, 0.18, 0], [0.07, 0.06, 0.09], 'A small cerebellum suits hop-and-sit motion.', { k: 'box', c: '#c8b46b' }),
        P('Medulla oblongata', [-0.76, 0.14, 0], [0.12, 0.07, 0.08], 'The medulla runs heart, lung and reflex tone.', { k: 'cone', r: 0.04, h: 0.12, rot: [0, 0, -Math.PI / 2], c: '#b8a45b' }),
        P('Spinal cord', [-0.2, 0.12, 0], [1.2, 0.05, 0.05], 'The cord swells at the limb plexuses.', { k: 'tube', pts: [[-0.7, 0.13, 0], [0.2, 0.11, 0], [0.75, 0.1, 0]], r: 0.025, c: '#e8d48b' }),
        P('Sciatic nerve L', [0.5, -0.05, 0.3], [0.5, 0.03, 0.03], 'The sciatic drives the jumping muscles.', { k: 'tube', pts: [[0.4, 0.08, 0.2], [0.6, -0.1, 0.35], [0.85, -0.2, 0.5]], r: 0.015, c: '#d8c47b' }),
        P('Sciatic nerve R', [0.5, -0.05, -0.3], [0.5, 0.03, 0.03], 'Classic lab nerve for conduction experiments.', { k: 'tube', pts: [[0.4, 0.08, -0.2], [0.6, -0.1, -0.35], [0.85, -0.2, -0.5]], r: 0.015, c: '#d8c47b' }),
        P('Brachial plexus L', [-0.5, 0.05, 0.3], [0.2, 0.04, 0.04], 'The brachial plexus serves the forelimbs.', { k: 'tube', pts: [[-0.55, 0.1, 0.15], [-0.6, -0.05, 0.35]], r: 0.014, c: '#d8c47b' }),
        P('Brachial plexus R', [-0.5, 0.05, -0.3], [0.2, 0.04, 0.04], 'Nerves 2-3 leave between the vertebrae.', { k: 'tube', pts: [[-0.55, 0.1, -0.15], [-0.6, -0.05, -0.35]], r: 0.014, c: '#d8c47b' }),
        ...chain(4, (i) => P(`Cranial nerve ${i}`, [-1.15 + i * 0.06, 0.1, (i % 2 ? 0.14 : -0.14)], [0.1, 0.02, 0.02], `Cranial nerve ${i}: ten pairs serve head senses and muscles.`, { k: 'cyl', r: 0.008, h: 0.1, rot: [i % 2 ? 0.8 : -0.8, 0, 0], c: '#d8c47b' })),
        P('Sympathetic chain L', [-0.1, 0.06, 0.12], [1.0, 0.02, 0.02], 'Sympathetic chains tune gut and heart.', { k: 'tube', pts: [[-0.6, 0.07, 0.12], [0.5, 0.05, 0.12]], r: 0.008, c: '#c8b46b' }),
        P('Sympathetic chain R', [-0.1, 0.06, -0.12], [1.0, 0.02, 0.02], 'Autonomic tone shifts with season.', { k: 'tube', pts: [[-0.6, 0.07, -0.12], [0.5, 0.05, -0.12]], r: 0.008, c: '#c8b46b' }),
      ],
      muscles: [
        P('Trunk muscle (dorsal)', [-0.1, 0.2, 0], [1.1, 0.08, 0.5], 'Dorsal trunk muscles arch the back in the jump.', { k: 'box', c: '#c07060', op: 0.7 }),
        P('Abdominal wall', [-0.2, -0.12, 0], [1.0, 0.06, 0.6], 'Abdominals compress the lungs for breathing.', { k: 'box', c: '#b06050', op: 0.6 }),
        P('Triceps femoris L', [0.6, -0.06, 0.42], [0.3, 0.12, 0.1], 'The triceps femoris extends the knee explosively.', { k: 'cap', r: 0.05, h: 0.22, rot: [0.6, 0, 1.0], c: '#c07060' }),
        P('Triceps femoris R', [0.6, -0.06, -0.42], [0.3, 0.12, 0.1], 'Jump muscles store energy in tendons.', { k: 'cap', r: 0.05, h: 0.22, rot: [-0.6, 0, -1.0], c: '#c07060' }),
        P('Gastrocnemius L', [0.82, -0.16, 0.56], [0.26, 0.1, 0.09], 'The calf muscle snaps the ankle lever.', { k: 'cap', r: 0.045, h: 0.18, rot: [0.5, 0, 0.6], c: '#b06050' }),
        P('Gastrocnemius R', [0.82, -0.16, -0.56], [0.26, 0.1, 0.09], 'Its tendon wraps the ankle like a spring.', { k: 'cap', r: 0.045, h: 0.18, rot: [-0.5, 0, -0.6], c: '#b06050' }),
        P('Iliacus L', [0.62, 0.02, 0.3], [0.2, 0.08, 0.08], 'Iliacus folds the thigh against the body.', { k: 'cap', r: 0.04, h: 0.14, rot: [0.4, 0, 1.2], c: '#c07060' }),
        P('Iliacus R', [0.62, 0.02, -0.3], [0.2, 0.08, 0.08], 'Folding keeps the frog stream-lined.', { k: 'cap', r: 0.04, h: 0.14, rot: [-0.4, 0, -1.2], c: '#c07060' }),
        P('Pectoralis L', [-0.55, -0.05, 0.3], [0.22, 0.08, 0.08], 'Pectorals brace the arms on landing.', { k: 'cap', r: 0.04, h: 0.16, rot: [0.8, 0, 0.5], c: '#b06050' }),
        P('Pectoralis R', [-0.55, -0.05, -0.3], [0.22, 0.08, 0.08], 'They also push the body up when walking.', { k: 'cap', r: 0.04, h: 0.16, rot: [-0.8, 0, -0.5], c: '#b06050' }),
        P('Sternohyoid', [-0.9, -0.14, 0], [0.24, 0.04, 0.08], 'Sternohyoids drop the throat to suck air in.', { k: 'box', c: '#c07060' }),
        P('Genioglossus (tongue muscle)', [-1.0, -0.1, 0], [0.2, 0.05, 0.08], 'The tongue flips out on this muscle hinge.', { k: 'cap', r: 0.03, h: 0.14, rot: [0, 0, Math.PI / 2], c: '#d88a8a' }),
      ],
      external: [
        ...chain(8, (i) => P(`Skin mucous gland ${i}`, [-0.8 + i * 0.24, 0.24, (i % 2 ? 0.3 : -0.3)], [0.05, 0.04, 0.05], `Mucous gland ${i}: mucus keeps skin wet for breathing.`, { k: 'sph', r: 0.025, c: '#9ac08a', op: 0.7 })),
        P('Lateral fold L', [-0.2, 0.16, 0.5], [0.9, 0.03, 0.04], 'Dorsolateral folds mark many species.', { k: 'box', c: '#8aa05c' }),
        P('Lateral fold R', [-0.2, 0.16, -0.5], [0.9, 0.03, 0.04], 'Folds also thicken the skin seam.', { k: 'box', c: '#8aa05c' }),
        P('Nictitating membrane L', [-1.05, 0.28, 0.3], [0.12, 0.02, 0.12], 'A third lid sweeps the eye clean underwater.', { k: 'sph', r: 0.06, c: '#e8e8d8', op: 0.5 }),
        P('Nictitating membrane R', [-1.05, 0.28, -0.3], [0.12, 0.02, 0.12], 'It protects the eye during a strike.', { k: 'sph', r: 0.06, c: '#e8e8d8', op: 0.5 }),
        ...chain(4, (i) => P(`Toe webbing ${i}`, [1.05 + (i % 2) * 0.06, -0.25, (i < 2 ? 0.7 : -0.7) + (i % 2) * 0.08], [0.14, 0.01, 0.16], `Web ${i}: webbed feet are the swim fins.`, { k: 'box', c: '#9ab87a', op: 0.6 })),
      ],
      urogenital: [
        P('Kidney L', [0.45, 0.08, 0.18], [0.35, 0.1, 0.1], 'Kidneys filter blood and balance water.', { k: 'box', c: '#8a4a4a' }),
        P('Kidney R', [0.45, 0.08, -0.18], [0.35, 0.1, 0.1], 'Frog kidneys cannot concentrate urine.', { k: 'box', c: '#8a4a4a' }),
        P('Ureter L', [0.45, 0.02, 0.22], [0.35, 0.02, 0.02], 'Ureters drain to the cloaca.', { k: 'tube', pts: [[0.3, 0.03, 0.22], [0.65, 0.0, 0.16]], r: 0.01, c: '#c8a8a8' }),
        P('Ureter R', [0.45, 0.02, -0.22], [0.35, 0.02, 0.02], 'In males they also carry sperm.', { k: 'tube', pts: [[0.3, 0.03, -0.22], [0.65, 0.0, -0.16]], r: 0.01, c: '#c8a8a8' }),
        P('Urinary bladder', [0.6, -0.08, 0], [0.24, 0.12, 0.2], 'The bladder reclaims water on land.', { k: 'sph', r: 0.11, c: '#d8b8b8', op: 0.6 }),
        P('Fat body L', [0.25, 0.0, 0.25], [0.2, 0.14, 0.08], 'Fat bodies fuel winter and breeding.', { k: 'cap', r: 0.05, h: 0.14, rot: [0, 0, 0.6], c: '#f0d060' }),
        P('Fat body R', [0.25, 0.0, -0.25], [0.2, 0.14, 0.08], 'They shrink dramatically by spring.', { k: 'cap', r: 0.05, h: 0.14, rot: [0, 0, -0.6], c: '#f0d060' }),
        P('Testis L', [0.3, 0.05, 0.12], [0.14, 0.08, 0.06], 'Testes hang beside the kidneys.', { k: 'cap', r: 0.04, h: 0.1, c: '#e8d8c0' }),
        P('Testis R', [0.3, 0.05, -0.12], [0.14, 0.08, 0.06], 'Sperm travel via the kidneys ducts.', { k: 'cap', r: 0.04, h: 0.1, c: '#e8d8c0' }),
        P('Oviduct ostium L', [-0.35, 0.1, 0.2], [0.06, 0.06, 0.06], 'Funnel ostia catch eggs in the coelom.', { k: 'cone', r: 0.03, h: 0.06, c: '#d8a8d8' }),
        P('Oviduct ostium R', [-0.35, 0.1, -0.2], [0.06, 0.06, 0.06], 'Jelly coats are added along the duct.', { k: 'cone', r: 0.03, h: 0.06, c: '#d8a8d8' }),
      ],
      cardio: [
        P('Sinus venosus', [-0.42, 0.1, 0.08], [0.1, 0.08, 0.08], 'The sinus collects body blood before the atrium.', { k: 'sph', r: 0.05, c: '#8a4a5a' }),
        P('Left atrium', [-0.36, 0.14, 0.06], [0.12, 0.1, 0.1], 'The left atrium receives lung blood.', { k: 'sph', r: 0.06, c: '#c05060' }),
        P('Right atrium', [-0.36, 0.14, -0.06], [0.12, 0.1, 0.1], 'The right atrium receives body blood.', { k: 'sph', r: 0.06, c: '#7a4a6a' }),
        P('Ventricle', [-0.28, 0.08, 0], [0.16, 0.14, 0.14], 'One ventricle keeps the two streams mostly apart.', { k: 'cap', r: 0.07, h: 0.08, rot: [0, 0, Math.PI / 2], c: '#a04050' }),
        P('Truncus arteriosus', [-0.2, 0.12, 0], [0.12, 0.06, 0.06], 'The truncus splits output into three arches.', { k: 'cyl', r: 0.03, h: 0.12, rot: [0, 0, Math.PI / 2], c: '#b05060' }),
        ...chain(3, (i) => P(`Aortic arch ${i}`, [-0.14 + i * 0.05, 0.1, 0.04 - i * 0.04], [0.08, 0.12, 0.04], `Arch ${i}: carotid, systemic and pulmonary arches branch here.`, { k: 'tor', r: 0.05, t: 0.014, rot: [0, Math.PI / 2, 0], c: '#c06070' })),
        P('Pulmonary vein L', [-0.3, 0.12, 0.1], [0.1, 0.03, 0.03], 'Pulmonary veins return oxygen-rich blood.', { k: 'tube', pts: [[-0.24, 0.12, 0.14], [-0.36, 0.13, 0.07]], r: 0.012, c: '#d88a9a' }),
        P('Pulmonary vein R', [-0.3, 0.12, -0.1], [0.1, 0.03, 0.03], 'Skin breathing adds a second oxygen source.', { k: 'tube', pts: [[-0.24, 0.12, -0.14], [-0.36, 0.13, -0.07]], r: 0.012, c: '#d88a9a' }),
      ],
    },
  },
  cell: {
    parts: {
      endomembrane: [
        ...chain(4, (i) => P(`Rough ER sheet ${i}`, [-0.9 + i * 0.12, 0.9 + i * 0.14, -0.7], [0.5, 0.02, 0.4], `RER sheet ${i}: stacked cisterns fold secreted proteins.`, { k: 'box', rot: [0.2, 0.3, 0.1 * i], c: '#d8b25c', op: 0.75 })),
        ...ring(12, 0.34, (i, pos) => P(`RER ribosome ${i}`, [-0.8 + pos[0], 1.05 + pos[1] * 0.6, -0.7 + pos[2] * 0.5], [0.03, 0.03, 0.03], `RER ribosome ${i}: docked ribosomes thread new chains inside.`, { k: 'sph', r: 0.018, c: '#8fb8d8' })),
        ...chain(6, (i) => P(`Smooth ER tube ${i}`, [0.9 - i * 0.1, 0.7 + i * 0.1, 0.8], [0.3, 0.04, 0.04], `SER tube ${i}: smooth ER makes lipids and detoxifies.`, { k: 'tube', pts: [[0.75 - i * 0.08, 0.65 + i * 0.1, 0.75], [1.0 - i * 0.08, 0.8 + i * 0.1, 0.85]], r: 0.02, c: '#c8a858' })),
        ...chain(5, (i) => P(`Golgi cisterna ${i}`, [0.6, 1.3, -0.4], [0.4 - i * 0.04, 0.03, 0.3 - i * 0.03], `Cisterna ${i}: the Golgi stack sorts and ships cargo.`, { k: 'cap', r: 0.02, h: 0.3 - i * 0.04, rot: [Math.PI / 2, 0, 0.3], c: '#e8c878' })),
        ...ring(8, 0.3, (i, pos) => P(`Golgi vesicle ${i}`, [0.6 + pos[0], 1.3 + pos[1] * 0.5, -0.4 + pos[2]], [0.05, 0.05, 0.05], `Vesicle ${i}: coated vesicles bud from the trans face.`, { k: 'sph', r: 0.028, c: '#f0d898' })),
        ...chain(5, (i) => P(`Lysosome ${i}`, [-0.4 + i * 0.25, 0.5 + (i % 3) * 0.2, 0.9 - i * 0.15], [0.1, 0.1, 0.1], `Lysosome ${i}: pH 5 enzyme vats recycle everything.`, { k: 'sph', r: 0.055, c: '#c07050' })),
        ...chain(3, (i) => P(`Peroxisome ${i}`, [0.2 + i * 0.3, 0.45, -1.0 + i * 0.2], [0.09, 0.09, 0.09], `Peroxisome ${i}: peroxisomes break fatty acids and H2O2.`, { k: 'sph', r: 0.05, c: '#a8b878' })),
        ...chain(6, (i) => P(`Transport vesicle ${i}`, [-0.2 + i * 0.16, 1.1 + (i % 2) * 0.15, -0.5 + (i % 3) * 0.2], [0.06, 0.06, 0.06], `Vesicle ${i}: COPII coats carry cargo ER to Golgi.`, { k: 'sph', r: 0.032, c: '#e8d8a8', op: 0.8 })),
      ],
      synthesis: [
        ...ring(12, 1.3, (i, pos) => P(`Free ribosome ${i}`, [pos[0], 0.9 + pos[1] * 0.7, pos[2]], [0.04, 0.04, 0.04], `Free ribosome ${i}: cytosolic ribosomes make housekeeping proteins.`, { k: 'sph', r: 0.022, c: '#8fb8d8' })),
        ...chain(3, (i) => P(`Polysome ${i}`, [-0.6 + i * 0.5, 0.6, 0.6 - i * 0.3], [0.2, 0.03, 0.03], `Polysome ${i}: many ribosomes read one mRNA at once.`, { k: 'tube', pts: [[-0.7 + i * 0.5, 0.6, 0.6 - i * 0.3], [-0.5 + i * 0.5, 0.62, 0.62 - i * 0.3]], r: 0.016, c: '#7fa8c9' })),
      ],
      cytoskeleton: [
        P('Centrosome', [0.55, 1.55, 0.35], [0.14, 0.14, 0.14], 'The centrosome organises the spindle poles.', { k: 'sph', r: 0.07, c: '#7fa8c9' }),
        P('Centriole (mother)', [0.58, 1.58, 0.38], [0.06, 0.16, 0.06], 'Nine triplet microtubules in a barrel.', { k: 'cyl', r: 0.03, h: 0.16, rot: [0.4, 0, 0.3], c: '#5a8ab0' }),
        P('Centriole (daughter)', [0.52, 1.52, 0.32], [0.06, 0.14, 0.06], 'The pair duplicates once per cycle.', { k: 'cyl', r: 0.03, h: 0.14, rot: [0.4, 0, 0.3 + Math.PI / 2], c: '#5a8ab0' }),
        ...chain(8, (i) => P(`Microtubule ${i}`, [0.4, 1.3, 0.2], [1.4, 0.02, 0.02], `Microtubule ${i}: 25 nm highways for motor proteins.`, { k: 'tube', pts: [[0.5, 1.5, 0.3], [0.5 + Math.cos(i * 0.785) * 1.3, 0.9 + Math.sin(i * 0.785) * 0.9, 0.3 + Math.sin(i * 1.3) * 0.8]], r: 0.012, c: '#7fa8c9', op: 0.8 })),
        ...chain(8, (i) => P(`Actin filament bundle ${i}`, [-0.5 + (i % 4) * 0.35, 0.5 + Math.floor(i / 4) * 0.8, -1.2 + (i % 3) * 0.5], [0.5, 0.015, 0.015], `Actin ${i}: 7 nm cables cortex the membrane.`, { k: 'tube', pts: [[-0.6 + (i % 4) * 0.35, 0.5 + Math.floor(i / 4) * 0.8, -1.2 + (i % 3) * 0.5], [-0.2 + (i % 4) * 0.35, 0.55 + Math.floor(i / 4) * 0.8, -1.0 + (i % 3) * 0.5]], r: 0.008, c: '#9ac0d8' })),
        ...chain(4, (i) => P(`Myosin motor ${i}`, [-0.4 + i * 0.3, 0.55 + (i % 2) * 0.7, -1.1 + (i % 3) * 0.4], [0.05, 0.05, 0.05], `Myosin ${i}: myosin V walks cargo along actin.`, { k: 'cap', r: 0.02, h: 0.03, rot: [0, 0, 0.8], c: '#b06060' })),
      ],
      nucleus: [
        ...ring(10, 0.81, (i, pos) => P(`Nuclear pore complex ${i}`, [pos[0], 0.9 + pos[1], pos[2]], [0.08, 0.08, 0.08], `NPC ${i}: eight-fold gates pass 1,000 molecules a second.`, { k: 'tor', r: 0.04, t: 0.014, c: '#5a4ab0' })),
        ...chain(4, (i) => P(`Chromatin fibre ${i}`, [-0.2 + i * 0.15, 0.95 + (i % 2) * 0.1, -0.1 + i * 0.08], [0.3, 0.03, 0.03], `Chromatin ${i}: 30 nm fibres loop on the matrix.`, { k: 'tube', pts: [[-0.3 + i * 0.15, 0.9 + (i % 2) * 0.1, -0.15 + i * 0.08], [-0.05 + i * 0.15, 1.0 + (i % 2) * 0.1, 0.05 + i * 0.08]], r: 0.014, c: '#8d7ce0' })),
        P('Metaphase chromatid pair', [0.2, 1.1, 0.2], [0.12, 0.2, 0.08], 'Sister chromatids join at the centromere.', { shapes: [{ k: 'cap', pos: [-0.03, 0, 0], r: 0.03, h: 0.14, rot: [0, 0, 0.25], c: '#7a6ad1' }, { k: 'cap', pos: [0.03, 0, 0], r: 0.03, h: 0.14, rot: [0, 0, -0.25], c: '#7a6ad1' }] }),
        P('Nuclear lamina shell', [0, 0.9, 0], [1.58, 1.58, 1.58], 'Lamin meshwork stiffens the envelope.', { k: 'sph', r: 0.79, c: '#6a5ac0', op: 0.25 }),
      ],
      energy: [
        ...chain(6, (i) => P(`Crista fold ${i}`, [-0.9 + i * 0.1, 0.55 + (i % 2) * 0.1, 0.7], [0.08, 0.16, 0.02], `Crista ${i}: folds multiply the ATP membrane.`, { k: 'box', rot: [0.3, 0, 0.2 * i], c: '#d87171' })),
        ...chain(4, (i) => P(`Matrix granule ${i}`, [-0.85 + i * 0.12, 0.6, 0.72], [0.03, 0.03, 0.03], `Granule ${i}: granules store calcium in the matrix.`, { k: 'sph', r: 0.016, c: '#f0b0a0' })),
        ...chain(4, (i) => P(`Mitoribosome ${i}`, [-0.8 + i * 0.1, 0.52, 0.68], [0.02, 0.02, 0.02], `Mitoribosome ${i}: mitochondria keep their own translation.`, { k: 'sph', r: 0.012, c: '#8fb8d8' })),
      ],
      membrane: [
        ...chain(4, (i) => P(`Aquaporin ${i}`, [-1.4 + i * 0.9, 0.35, 1.9 - (i % 2) * 0.4], [0.08, 0.16, 0.08], `Aquaporin ${i}: water channels pass 3 billion molecules a second.`, { k: 'cyl', r: 0.04, h: 0.16, c: '#9ad0c0' })),
        ...chain(4, (i) => P(`Receptor (GPCR) ${i}`, [-1.1 + i * 0.7, 0.5, -1.9 + (i % 2) * 0.5], [0.1, 0.2, 0.1], `GPCR ${i}: seven-helix receptors relay hormone signals.`, { shapes: [{ k: 'cyl', pos: [0, 0, 0], r: 0.045, h: 0.14, c: '#b08ad1' }, { k: 'sph', pos: [0, 0.11, 0], r: 0.05, c: '#d8b8e8' }, { k: 'sph', pos: [0, -0.1, 0], r: 0.035, c: '#9a7ab8' }] })),
        ...chain(8, (i) => P(`Glycocalyx filament ${i}`, [-1.6 + i * 0.45, 0.72, 1.7 - (i % 3) * 0.3], [0.02, 0.14, 0.02], `Filament ${i}: sugar brushes ID the cell to its neighbours.`, { k: 'tube', pts: [[-1.6 + i * 0.45, 0.66, 1.7 - (i % 3) * 0.3], [-1.58 + i * 0.45, 0.78, 1.68 - (i % 3) * 0.3]], r: 0.01, c: '#f0d8e8' })),
        P('Flippase', [1.6, 0.4, 1.5], [0.08, 0.16, 0.08], 'Flippases keep leaflets asymmetric using ATP.', { k: 'cyl', r: 0.04, h: 0.16, rot: [0.3, 0, 0], c: '#8ac0b0' }),
        P('Scramblase', [1.4, 0.35, -1.6], [0.08, 0.16, 0.08], 'Scramblases collapse asymmetry on signal.', { k: 'cyl', r: 0.04, h: 0.16, rot: [-0.3, 0, 0], c: '#7ab0a0' }),
      ],
    },
  },
  giza: {
    parts: {
      passages: [
        P('Descending passage', [-1.1, 0.9, 0], [1.2, 0.16, 0.16], 'The descending passage drops 26° from the north face.', { k: 'tube', pts: [[-1.55, 1.5, 0], [-0.7, 0.35, 0]], r: 0.07, c: '#8fb8d8', op: 0.8 }),
        P('Ascending passage', [-0.62, 0.62, 0], [0.9, 0.16, 0.16], 'The ascending passage climbs to the Grand Gallery.', { k: 'tube', pts: [[-0.95, 0.42, 0], [-0.3, 0.85, 0]], r: 0.07, c: '#8fb8d8', op: 0.8 }),
        P('Grand Gallery (corbelled)', [-0.05, 1.1, 0], [0.9, 0.5, 0.24], 'Corbelled walls narrow the Gallery to a 8.6 m high slot.', { shapes: [{ k: 'box', pos: [-0.2, 0, 0.11], size: [0.95, 0.5, 0.06], rot: [0.12, 0, 0], c: '#c8b088' }, { k: 'box', pos: [-0.2, 0, -0.11], size: [0.95, 0.5, 0.06], rot: [-0.12, 0, 0], c: '#c8b088' }, { k: 'box', pos: [0, -0.26, 0], size: [0.95, 0.05, 0.3], c: '#b09878' }] }),
        P('Horizontal passage (Queen’s)', [-0.15, 0.88, 0], [0.6, 0.12, 0.12], 'A low crawl leads to the Queen’s Chamber.', { k: 'tube', pts: [[-0.3, 0.88, 0], [0.1, 0.88, 0]], r: 0.055, c: '#8fb8d8', op: 0.8 }),
        P('Well shaft', [0.35, 0.4, 0.25], [0.14, 1.2, 0.14], 'The well shaft links the Gallery to the subterranean level.', { k: 'tube', pts: [[0.3, 0.95, 0.2], [0.45, 0.5, 0.3], [0.35, 0.05, 0.25]], r: 0.05, c: '#7fa8c9', op: 0.8 }),
        P('Original entrance (chevron)', [-1.5, 1.55, 0], [0.4, 0.3, 0.3], 'Chevron slabs spanned the original 17 m high door.', { shapes: [{ k: 'box', pos: [-0.08, 0.08, 0], size: [0.3, 0.06, 0.24], rot: [0, 0, 0.7], c: '#d8c08a' }, { k: 'box', pos: [0.08, 0.08, 0], size: [0.3, 0.06, 0.24], rot: [0, 0, -0.7], c: '#d8c08a' }, { k: 'box', pos: [0, -0.06, 0], size: [0.2, 0.18, 0.2], c: '#3a3a3a' }] }),
        P('Al-Ma’mun bypass tunnel', [-1.35, 1.1, 0.15], [0.7, 0.2, 0.2], 'The 820 AD digging tunnel is today’s tourist door.', { k: 'tube', pts: [[-1.6, 0.85, 0.25], [-1.0, 1.05, 0.1]], r: 0.06, c: '#6a6a72', op: 0.7 }),
      ],
      chambers: [
        P('Queen’s Chamber niche', [0.25, 0.95, 0.12], [0.12, 0.3, 0.1], 'The corbelled niche faces the east wall.', { k: 'box', c: '#c8b088' }),
        P('Subterranean chamber', [0.1, -0.35, 0], [0.5, 0.3, 0.4], 'The unfinished pit chamber lies 30 m down in bedrock.', { k: 'box', c: '#6a5a4a' }),
        P('Pit shaft (deep)', [0.1, -0.6, 0], [0.12, 0.5, 0.12], 'A vertical shaft sinks further into the rock.', { k: 'cyl', r: 0.06, h: 0.5, c: '#5a4a3a' }),
        ...chain(5, (i) => P(`Relieving chamber ${i}`, [0.5, 1.42 + i * 0.11, 0], [0.75, 0.08, 0.46], `Chamber ${i}: five granite tiers carry the roof load around the King’s Chamber.`, { c: '#a05a4a' })),
        ...chain(5, (i) => P(`King’s Chamber roof beam ${i}`, [0.5 - 0.3 + i * 0.15, 1.32, 0], [0.14, 0.1, 0.46], `Beam ${i}: nine 50-tonne beams span the burial room.`, { c: '#8a4a3a' })),
        P('Sarcophagus lid slot', [0.5, 1.16, 0.1], [0.3, 0.05, 0.16], 'The box slid in before the chamber was walled up.', { k: 'box', c: '#7a3a2a' }),
      ],
      structure: [
        P('Accretion layer 1', [0, 0.9, 0], [2.6, 1.0, 2.6], 'Packing layers step inward as the pyramid rises.', { k: 'cone', r: 1.3, h: 1.0, c: '#d8c08a', op: 0.22 }),
        P('Accretion layer 2', [0, 1.5, 0], [1.8, 0.9, 1.8], 'Each layer faces slope at about 52°.', { k: 'cone', r: 0.9, h: 0.9, c: '#d8c08a', op: 0.22 }),
        P('Accretion layer 3', [0, 2.05, 0], [1.0, 0.8, 1.0], 'The core stones are local nummulitic limestone.', { k: 'cone', r: 0.5, h: 0.8, c: '#d8c08a', op: 0.22 }),
        P('Construction ramp (south)', [0.6, 0.5, 1.5], [1.6, 0.2, 0.5], 'Ramp theories: straight, zigzag or spiral — all leave traces.', { k: 'box', rot: [0.35, 0, 0.2], c: '#b09878', op: 0.6 }),
        P('Construction ramp (east)', [1.5, 0.5, -0.4], [1.4, 0.2, 0.5], 'Gypsum mortar floors record the ramp landings.', { k: 'box', rot: [0.35, 0, -1.2], c: '#b09878', op: 0.6 }),
        ...chain(4, (i) => P(`Workers’ village marker ${i}`, [1.9 + (i % 2) * 0.3, -0.05, 1.4 + Math.floor(i / 2) * 0.3], [0.2, 0.1, 0.2], `Marker ${i}: the gallery houses fed thousands of workers.`, { k: 'box', c: '#a08868' })),
        P('Survey level mark', [-1.6, 0.02, -1.6], [0.12, 0.06, 0.12], 'Levelling marks ring the bedrock base.', { k: 'cyl', r: 0.06, h: 0.05, c: '#e8e2d0' }),
        P('Survey level mark 2', [1.6, 0.02, -1.6], [0.12, 0.06, 0.12], 'Water trenches may have set the horizontal datum.', { k: 'cyl', r: 0.06, h: 0.05, c: '#e8e2d0' }),
        ...chain(4, (i) => P(`Gypsum mortar patch ${i}`, [-1.2 + i * 0.7, 0.3 + (i % 2) * 0.4, -1.3 + (i % 3) * 0.2], [0.14, 0.05, 0.14], `Mortar ${i}: dated gypsum mortar pins the build sequence.`, { k: 'box', c: '#e0d8c0' })),
        ...chain(6, (i) => P(`Lifting boss ${i}`, [-1.0 + i * 0.4, 0.6 + (i % 3) * 0.35, 1.2 - (i % 2) * 0.4], [0.08, 0.08, 0.08], `Boss ${i}: nubs left for ropes and levers on core blocks.`, { k: 'cone', r: 0.04, h: 0.08, c: '#c8b088' })),
      ],
      casing: [
        ...ring(12, 1.62, (i, pos) => P(`Casing stone ${i}`, [pos[0], 0.12 + (i % 4) * 0.16, pos[2]], [0.3, 0.28, 0.16], `Casing ${i}: Tura limestone polished the faces to a shine.`, { k: 'box', rot: [0, Math.atan2(pos[2], pos[0]) + Math.PI / 2, 0.35], c: '#efe6cf' })),
        P('Gold sheen shell (apex)', [0, 2.6, 0], [0.5, 0.35, 0.5], 'Ancient writers describe the apex gleaming.', { k: 'cone', r: 0.24, h: 0.34, c: '#f0d060', op: 0.5 }),
      ],
    },
  },
  locomotive: {
    newSystems: [{ id: 'valvegear', label: 'Valve gear & drive', color: '#e6a65d' }],
    parts: {
      valvegear: [
        P('Return crank L', [-0.85, 0.35, 0.56], [0.14, 0.1, 0.04], 'The return crank drives the gear off the crank pin.', { k: 'box', rot: [0, 0, 0.6], c: '#c8d0d8' }),
        P('Return crank R', [-0.85, 0.35, -0.56], [0.14, 0.1, 0.04], 'It leads the crank by 90 degrees.', { k: 'box', rot: [0, 0, 0.6], c: '#c8d0d8' }),
        P('Eccentric rod L', [-1.0, 0.45, 0.56], [0.5, 0.05, 0.04], 'Eccentric rods push the expansion link.', { k: 'box', c: '#b0b8c0' }),
        P('Eccentric rod R', [-1.0, 0.45, -0.56], [0.5, 0.05, 0.04], 'Rod length sets the valve lead.', { k: 'box', c: '#b0b8c0' }),
        P('Radius rod L', [-1.2, 0.55, 0.5], [0.6, 0.05, 0.04], 'Radius rods carry the die block position forward.', { k: 'box', c: '#c0c8d0' }),
        P('Radius rod R', [-1.2, 0.55, -0.5], [0.6, 0.05, 0.04], 'Their height sets cut-off and reversing.', { k: 'box', c: '#c0c8d0' }),
        P('Combination lever L', [-1.42, 0.55, 0.46], [0.05, 0.3, 0.04], 'The combination lever adds crosshead correction.', { k: 'box', c: '#d0d8e0' }),
        P('Combination lever R', [-1.42, 0.55, -0.46], [0.05, 0.3, 0.04], 'It gives the valve its constant lead.', { k: 'box', c: '#d0d8e0' }),
        P('Union link L', [-1.35, 0.42, 0.48], [0.2, 0.04, 0.03], 'Union links tie the lever to the crosshead.', { k: 'box', c: '#b0b8c0' }),
        P('Union link R', [-1.35, 0.42, -0.48], [0.2, 0.04, 0.03], 'They drop away when the gear is uncoupled.', { k: 'box', c: '#b0b8c0' }),
        P('Reach rod', [-0.6, 0.85, 0], [0.9, 0.04, 0.04], 'The reach rod runs the reverser to the cab.', { k: 'cyl', r: 0.02, h: 0.9, rot: [0, 0, Math.PI / 2], c: '#a8b0b8' }),
        P('Reverser arm', [0.1, 0.9, 0], [0.05, 0.3, 0.05], 'The driver notches up with the reverser wheel.', { k: 'box', rot: [0, 0, 0.4], c: '#d8b25c' }),
        P('Lifting arm L', [-1.1, 0.75, 0.4], [0.04, 0.2, 0.04], 'Lifting arms raise the radius rods to reverse.', { k: 'box', c: '#b0b8c0' }),
        P('Lifting arm R', [-1.1, 0.75, -0.4], [0.04, 0.2, 0.04], 'The shaft links both sides together.', { k: 'box', c: '#b0b8c0' }),
        P('Die block L', [-1.15, 0.6, 0.5], [0.06, 0.08, 0.04], 'Die blocks slide in the curved link slot.', { k: 'box', c: '#e0e8f0' }),
        P('Die block R', [-1.15, 0.6, -0.5], [0.06, 0.08, 0.04], 'Position in the slot is the cut-off setting.', { k: 'box', c: '#e0e8f0' }),
        P('Valve spindle L', [-1.35, 0.72, 0.3], [0.4, 0.04, 0.04], 'Spindles drive the piston valves in the chests.', { k: 'cyl', r: 0.018, h: 0.4, rot: [0, 0, Math.PI / 2], c: '#c8d0d8' }),
        P('Valve spindle R', [-1.35, 0.72, -0.3], [0.4, 0.04, 0.04], 'Steam admission timing lives here.', { k: 'cyl', r: 0.018, h: 0.4, rot: [0, 0, Math.PI / 2], c: '#c8d0d8' }),
        P('Piston valve L', [-1.55, 0.72, 0.3], [0.12, 0.08, 0.08], 'Piston valves admit and release steam each stroke.', { k: 'cyl', r: 0.05, h: 0.12, rot: [0, 0, Math.PI / 2], c: '#d8e0e8' }),
        P('Piston valve R', [-1.55, 0.72, -0.3], [0.12, 0.08, 0.08], 'Lap and lead shape the steam distribution.', { k: 'cyl', r: 0.05, h: 0.12, rot: [0, 0, Math.PI / 2], c: '#d8e0e8' }),
      ],
      boiler: [
        P('Firebox wrapper', [0.6, 0.62, 0], [0.64, 0.6, 0.6], 'The wrapper plate forms the water jacket walls.', { k: 'box', c: '#8a4a3a', op: 0.6 }),
        P('Throatplate', [0.32, 0.7, 0], [0.08, 0.5, 0.5], 'The throatplate bends firebox into barrel.', { k: 'box', c: '#9a5a4a' }),
        P('Front tubeplate', [-1.42, 0.75, 0], [0.06, 0.6, 0.6], 'Tubeplates hold hundreds of expanded tubes.', { k: 'cyl', r: 0.3, h: 0.05, rot: [0, 0, Math.PI / 2], c: '#b06a5a' }),
        P('Rear tubeplate', [0.3, 0.75, 0], [0.06, 0.6, 0.6], 'Leaky tube ends show as white scale.', { k: 'cyl', r: 0.3, h: 0.05, rot: [0, 0, Math.PI / 2], c: '#b06a5a' }),
        P('Smokebox saddle', [-1.5, 0.35, 0], [0.5, 0.2, 0.5], 'The saddle carries the smokebox on the frames.', { k: 'box', c: '#4a4a4a' }),
        P('Steam dome lid', [-0.7, 1.12, 0], [0.3, 0.1, 0.3], 'Dome lids hide the regulator valve.', { k: 'cap', r: 0.15, h: 0.08, c: '#3a3a3a' }),
        P('Sand dome lid', [-0.1, 1.1, 0], [0.28, 0.1, 0.28], 'Sand domes dry the sand before the rails.', { k: 'cap', r: 0.14, h: 0.08, c: '#3a3a3a' }),
        P('Safety valve L', [0.45, 1.05, 0.08], [0.08, 0.18, 0.08], 'Spring safety valves lift at working pressure plus 3%.', { k: 'cyl', r: 0.04, h: 0.18, c: '#c8b060' }),
        P('Safety valve R', [0.45, 1.05, -0.08], [0.08, 0.18, 0.08], 'They reseat cleanly after a lift.', { k: 'cyl', r: 0.04, h: 0.18, c: '#c8b060' }),
        P('Whistle', [0.2, 1.15, 0.12], [0.06, 0.22, 0.06], 'The whistle draws steam from the dome top.', { k: 'cyl', r: 0.03, h: 0.22, c: '#d8b25c' }),
        P('Chimney cap', [-1.62, 1.28, 0], [0.24, 0.1, 0.24], 'The cap shapes the exhaust draft cone.', { k: 'cyl', rt: 0.14, rb: 0.11, h: 0.1, c: '#2a2a2a' }),
        P('Smokebox door', [-1.78, 0.75, 0], [0.08, 0.56, 0.56], 'The dart and wheel clamp the door seal.', { k: 'cyl', r: 0.28, h: 0.06, rot: [0, 0, Math.PI / 2], c: '#3a3a3a' }),
        P('Smokebox dart', [-1.84, 0.75, 0], [0.06, 0.06, 0.06], 'The dart centre wheel tightens the door.', { k: 'tor', r: 0.05, t: 0.015, rot: [0, Math.PI / 2, 0], c: '#c8c8c8' }),
      ],
      cab: [
        P('Boiler pressure gauge', [0.15, 1.15, 0.2], [0.1, 0.1, 0.04], 'The gauge reads boiler pressure at a glance.', { k: 'cyl', r: 0.05, h: 0.03, rot: [Math.PI / 2, 0, 0], c: '#f0ead0' }),
        P('Speedometer', [0.15, 1.15, -0.2], [0.1, 0.1, 0.04], 'Recorder speeds keep drivers honest.', { k: 'cyl', r: 0.05, h: 0.03, rot: [Math.PI / 2, 0, 0], c: '#f0ead0' }),
        P('Brake stand', [0.3, 0.95, -0.3], [0.1, 0.35, 0.1], 'The brake wheel winds on the vacuum brake.', { k: 'cyl', r: 0.05, h: 0.35, c: '#3a3a3a' }),
        P('Driver’s seat', [0.42, 0.85, 0.32], [0.2, 0.06, 0.24], 'Seats fold so the crew can watch the line.', { k: 'box', c: '#5a4a3a' }),
        P('Fireman’s seat', [0.42, 0.85, -0.32], [0.2, 0.06, 0.24], 'The fireman works from the left side.', { k: 'box', c: '#5a4a3a' }),
        P('Cab roof', [0.3, 1.5, 0], [0.7, 0.05, 0.9], 'The roof shelters gauges and crew.', { k: 'box', rot: [0, 0, -0.06], c: '#3a3a3a' }),
        P('Spectacle window L', [-0.02, 1.2, 0.34], [0.04, 0.22, 0.24], 'Spectacle plates frame the road ahead.', { k: 'box', c: '#a8c8d8', op: 0.6 }),
        P('Spectacle window R', [-0.02, 1.2, -0.34], [0.04, 0.22, 0.24], 'Shutters slide down in snow.', { k: 'box', c: '#a8c8d8', op: 0.6 }),
      ],
      tender: [
        P('Tender water tank', [1.9, 0.85, 0], [1.1, 0.7, 0.8], 'The tank holds thousands of litres for the run.', { k: 'box', c: '#5a6a7a', op: 0.7 }),
        P('Coal bunker', [2.45, 1.0, 0], [0.5, 0.5, 0.7], 'Coal slopes toward the fireman’s door.', { k: 'box', c: '#3a3a3a' }),
        P('Water scoop', [1.9, 0.15, 0.2], [0.4, 0.1, 0.15], 'The scoop lifts water from track troughs at speed.', { k: 'box', rot: [0.4, 0, 0], c: '#7a8a9a' }),
        P('Tender frame', [2.0, 0.4, 0], [1.6, 0.1, 0.7], 'The tender frame rides on its own springs.', { k: 'box', c: '#4a4a52' }),
        ...chain(6, (i) => P(`Tender wheel ${i}`, [1.45 + (i % 3) * 0.5, 0.24, i < 3 ? 0.62 : -0.62], [0.24, 0.24, 0.08], `Tender wheel ${i}: six wheels share the water weight.`, { k: 'cyl', r: 0.12, h: 0.07, rot: [Math.PI / 2, 0, 0], c: '#5a5a62' })),
        P('Drawbar & coupling', [1.15, 0.4, 0], [0.2, 0.08, 0.08], 'The drawbar takes the whole train pull.', { k: 'box', c: '#3a3a3a' }),
      ],
      frame: [
        P('Plate frame L', [0, 0.42, 0.4], [4.2, 0.16, 0.05], 'Plate frames hold every axle in gauge.', { k: 'box', c: '#4a5a6a' }),
        P('Plate frame R', [0, 0.42, -0.4], [4.2, 0.16, 0.05], 'Frames are cut from a single steel plate.', { k: 'box', c: '#4a5a6a' }),
        P('Buffer beam F', [-2.05, 0.5, 0], [0.08, 0.3, 0.9], 'Buffer beams take the shunting knocks.', { k: 'box', c: '#c0504d' }),
        P('Buffer beam R', [1.1, 0.5, 0], [0.08, 0.3, 0.9], 'Buffers and hook sit on the beam.', { k: 'box', c: '#c0504d' }),
        P('Pilot (cowcatcher)', [-2.2, 0.25, 0], [0.3, 0.35, 0.7], 'The pilot sweeps the track clear.', { k: 'cone', r: 0.3, h: 0.35, rot: [0, 0, -Math.PI / 2], c: '#3a3a3a' }),
        ...chain(4, (i) => P(`Cab step ${i}`, [0.05 + (i % 2) * 0.35, 0.2 + Math.floor(i / 2) * 0.25, 0.62], [0.16, 0.03, 0.1], `Step ${i}: steps climb to the running board.`, { k: 'box', c: '#4a4a52' })),
        P('Running board L', [-0.6, 0.62, 0.66], [2.6, 0.04, 0.14], 'Running boards give the crew a walkway.', { k: 'box', c: '#5a5a62' }),
        P('Running board R', [-0.6, 0.62, -0.66], [2.6, 0.04, 0.14], 'They also stiffen the frames.', { k: 'box', c: '#5a5a62' }),
        P('Headlamp', [-2.0, 1.15, 0], [0.16, 0.2, 0.16], 'Lamp codes told signallers the train class.', { k: 'box', c: '#f0d060' }),
        P('Bell', [-1.85, 1.05, 0.2], [0.1, 0.12, 0.1], 'The bell warns at every crossing.', { k: 'cone', r: 0.06, h: 0.1, rot: [Math.PI, 0, 0], c: '#d8b25c' }),
        P('Sandbox L', [-0.1, 1.0, 0.2], [0.24, 0.3, 0.24], 'Sandboxes feed the sand pipes by gravity.', { k: 'cap', r: 0.12, h: 0.2, c: '#6a6a72' }),
        P('Sandbox R', [-0.1, 1.0, -0.2], [0.24, 0.3, 0.24], 'Dry sand is the difference between grip and slip.', { k: 'cap', r: 0.12, h: 0.2, c: '#6a6a72' }),
        ...chain(6, (i) => P(`Driving tyre ${i}`, [-0.85 + (i % 3) * 0.55, 0.24, i < 3 ? 0.52 : -0.52], [0.48, 0.48, 0.1], `Tyre ${i}: shrink-fitted tyres renew the tread.`, { k: 'tor', r: 0.22, t: 0.04, rot: [Math.PI / 2, 0, 0], c: '#3a3a3a' })),
        ...chain(6, (i) => P(`Wheel centre ${i}`, [-0.85 + (i % 3) * 0.55, 0.24, i < 3 ? 0.52 : -0.52], [0.36, 0.36, 0.08], `Centre ${i}: spoked centres balance at speed.`, { k: 'cyl', r: 0.17, h: 0.06, rot: [Math.PI / 2, 0, 0], c: '#c0504d' })),
        ...chain(4, (i) => P(`Leading wheel ${i}`, [-1.75 + (i % 2) * 0.3, 0.18, i < 2 ? 0.45 : -0.45], [0.2, 0.2, 0.06], `Leading wheel ${i}: the pony truck steers into curves.`, { k: 'cyl', r: 0.1, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a5a62' })),
        P('Trailing wheel L', [0.85, 0.2, 0.45], [0.2, 0.2, 0.06], 'Trailing wheels carry the firebox weight.', { k: 'cyl', r: 0.1, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a5a62' }),
        P('Trailing wheel R', [0.85, 0.2, -0.45], [0.2, 0.2, 0.06], 'They allow a wide firebox over the frames.', { k: 'cyl', r: 0.1, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#5a5a62' }),
        ...chain(6, (i) => P(`Crank pin boss ${i}`, [-0.85 + (i % 3) * 0.55, 0.24, i < 3 ? 0.58 : -0.58], [0.08, 0.08, 0.06], `Boss ${i}: bosses carry the rod journals.`, { k: 'cyl', r: 0.04, h: 0.06, rot: [Math.PI / 2, 0, 0], c: '#c8d0d8' })),
        ...chain(6, (i) => P(`Spring hanger ${i}`, [-0.85 + (i % 3) * 0.55, 0.42, i < 3 ? 0.5 : -0.5], [0.04, 0.14, 0.04], `Hanger ${i}: hangers suspend the leaf springs.`, { k: 'cyl', r: 0.02, h: 0.14, c: '#8a9aa8' })),
      ],
    },
  },
  rocket: {
    newSystems: [
      { id: 'engines', label: 'Merlin engines & octaweb', color: '#d87171' },
      { id: 'ground', label: 'Ground & recovery', color: '#8a8a9a' },
    ],
    parts: {
      engines: [
        ...chain(9, (i) => P(`Merlin 1D engine ${i}`, [i === 9 ? 0 : 0.3 * Math.cos(((i - 1) / 8) * Math.PI * 2), -0.18, i === 9 ? 0 : 0.3 * Math.sin(((i - 1) / 8) * Math.PI * 2)], [0.18, 0.4, 0.18], `Merlin ${i}: nine gas-generator engines throttle 70-100%.`, { shapes: [{ k: 'cyl', pos: [0, 0.1, 0], r: 0.07, h: 0.16, c: '#8a8a92' }, { k: 'cone', pos: [0, -0.12, 0], r: 0.11, h: 0.24, rot: [Math.PI, 0, 0], c: '#5a5a62' }, { k: 'sph', pos: [0.06, 0.16, 0], r: 0.05, c: '#b06a5a' }] })),
        P('Octaweb thrust structure', [0, 0.02, 0], [0.9, 0.16, 0.9], 'The octaweb rings eight engines around one centre.', { k: 'cyl', r: 0.45, h: 0.14, c: '#4a4a52' }),
      ],
      stage1: [
        P('LOX tank shell', [0, 1.35, 0], [0.94, 0.72, 0.94], 'The monocoque LOX tank carries flight loads.', { k: 'cyl', r: 0.47, h: 0.7, c: '#c8d8e8', op: 0.3 }),
        P('RP-1 tank shell', [0, 0.55, 0], [0.94, 0.72, 0.94], 'Skin-and-stringer RP-1 tank below the common dome.', { k: 'cyl', r: 0.47, h: 0.7, c: '#d8c08a', op: 0.3 }),
        P('Common dome', [0, 0.98, 0], [0.9, 0.05, 0.9], 'One shared dome saves a tonne of structure.', { k: 'sph', r: 0.45, c: '#b0b8c0', op: 0.5 }),
        P('LOX transfer tube', [0, 0.9, 0], [0.08, 1.3, 0.08], 'A double-walled tube runs LOX through the fuel.', { k: 'cyl', r: 0.04, h: 1.3, c: '#a8c8d8' }),
        ...ring(8, 0.46, (i, pos) => P(`Tank stringer ${i}`, [pos[0], 0.95, pos[2]], [0.02, 1.5, 0.02], `Stringer ${i}: stringers stop the thin skin buckling.`, { k: 'cyl', r: 0.01, h: 1.5, c: '#9aa8b8' })),
        ...chain(4, (i) => P(`Grid fin ${i}`, [0.42 * Math.cos(i * Math.PI / 2), 2.0, 0.42 * Math.sin(i * Math.PI / 2)], [0.24, 0.3, 0.05], `Grid fin ${i}: titanium lattices steer the booster home.`, { k: 'box', rot: [0, -i * Math.PI / 2, 0], c: '#8a8a92' })),
        ...chain(4, (i) => P(`Landing leg ${i}`, [0.4 * Math.cos(i * Math.PI / 2 + 0.785), -0.1, 0.4 * Math.sin(i * Math.PI / 2 + 0.785)], [0.12, 0.9, 0.12], `Leg ${i}: carbon-aluminium legs deploy on the descent burn.`, { k: 'box', rot: [0.35 * Math.sin(i * Math.PI / 2), -i * Math.PI / 2, 0.35], c: '#5a5a62' })),
        ...chain(4, (i) => P(`Stage sep pneumatic ${i}`, [0.44 * Math.cos(i * Math.PI / 2 + 0.785), 2.35, 0.44 * Math.sin(i * Math.PI / 2 + 0.785)], [0.08, 0.12, 0.08], `Pusher ${i}: pneumatic pushers cut the stages apart.`, { k: 'cyl', r: 0.04, h: 0.12, c: '#c8b060' })),
      ],
      stage2: [
        P('MVac engine (chamber + nozzle)', [0, 2.55, 0], [0.3, 0.7, 0.3], 'The vacuum Merlin runs a 348 s nozzle extension.', { shapes: [{ k: 'cyl', pos: [0, 0.18, 0], r: 0.08, h: 0.2, c: '#8a8a92' }, { k: 'cone', pos: [0, -0.16, 0], r: 0.22, h: 0.5, rot: [Math.PI, 0, 0], c: '#4a4a52', op: 0.85 }] }),
        P('Stage 2 LOX tank', [0, 3.3, 0], [0.9, 0.6, 0.9], 'Second stage tanks are stretched for full thrust.', { k: 'cyl', r: 0.45, h: 0.6, c: '#c8d8e8', op: 0.3 }),
        P('Stage 2 RP-1 tank', [0, 2.85, 0], [0.9, 0.5, 0.9], 'RP-1 feeds the MVac turbopump.', { k: 'cyl', r: 0.45, h: 0.5, c: '#d8c08a', op: 0.3 }),
        P('Stage 2 helium sphere 1', [0.2, 3.05, 0.2], [0.16, 0.16, 0.16], 'Helium pressurises the tanks as they empty.', { k: 'sph', r: 0.08, c: '#c8c8d0' }),
        P('Stage 2 helium sphere 2', [-0.2, 3.05, -0.2], [0.16, 0.16, 0.16], 'Composite overwrapped spheres save mass.', { k: 'sph', r: 0.08, c: '#c8c8d0' }),
        ...chain(4, (i) => P(`Attitude thruster ${i}`, [0.44 * Math.cos(i * Math.PI / 2), 3.6, 0.44 * Math.sin(i * Math.PI / 2)], [0.06, 0.1, 0.06], `Thruster ${i}: nitrogen tetroxide thrusters point the stage.`, { k: 'cone', r: 0.03, h: 0.1, rot: [0, -i * Math.PI / 2, Math.PI / 2], c: '#8a8a92' })),
        P('Avionics ring', [0, 3.65, 0], [0.86, 0.14, 0.86], 'The ring holds flight computers and batteries.', { k: 'cyl', r: 0.43, h: 0.12, c: '#3a5a4a' }),
        P('Restart valve block', [0.15, 2.75, 0.3], [0.1, 0.1, 0.1], 'TEAL-qualified valves allow multiple burns.', { k: 'box', c: '#b06a5a' }),
      ],
      payload: [
        P('Fairing half L', [0.26, 4.3, 0], [0.5, 1.2, 0.5], 'Carbon-fibre halves shield the payload from slipstream.', { k: 'cap', r: 0.25, h: 1.0, rot: [0, 0, 0.12], c: '#e8e8f0', op: 0.5 }),
        P('Fairing half R', [-0.26, 4.3, 0], [0.5, 1.2, 0.5], 'Halves parachute to sea for reuse.', { k: 'cap', r: 0.25, h: 1.0, rot: [0, 0, -0.12], c: '#e8e8f0', op: 0.5 }),
        P('Fairing hinge line', [0, 4.0, 0.26], [0.04, 1.2, 0.04], 'The hinge runs the full fairing length.', { k: 'cyl', r: 0.02, h: 1.2, c: '#8a8a92' }),
        P('Payload attach fitting', [0, 3.8, 0], [0.7, 0.16, 0.7], 'The PAF clamp ring releases the spacecraft.', { k: 'cyl', r: 0.35, h: 0.14, c: '#c8b060' }),
        P('Payload mass simulator', [0, 4.1, 0], [0.5, 0.5, 0.5], 'Test flights carry mass simulators.', { k: 'cyl', r: 0.25, h: 0.5, c: '#9aa8b8' }),
        ...chain(4, (i) => P(`Fairing sep spring ${i}`, [0.3 * Math.cos(i * Math.PI / 2), 3.72, 0.3 * Math.sin(i * Math.PI / 2)], [0.06, 0.1, 0.06], `Spring ${i}: springs push the halves clear at separation.`, { k: 'cyl', r: 0.03, h: 0.1, c: '#d8b25c' })),
      ],
      ground: [
        P('Umbilical (LOX fill)', [0.55, 1.5, 0.3], [0.3, 0.08, 0.08], 'Umbilicals top off the subcooled LOX at T-0.', { k: 'tube', pts: [[0.9, 1.5, 0.5], [0.5, 1.5, 0.3]], r: 0.035, c: '#a8c8d8' }),
        P('Umbilical (electrical)', [0.55, 0.8, -0.3], [0.3, 0.06, 0.06], 'Ground power runs avionics until flight.', { k: 'tube', pts: [[0.9, 0.8, -0.5], [0.5, 0.8, -0.3]], r: 0.025, c: '#e8a05a' }),
        P('Transporter erector interface', [0.7, -0.25, 0], [0.6, 0.2, 0.8], 'The TE rolls the vehicle out and erects it.', { k: 'box', c: '#8a8a92' }),
        P('Flame duct deflector', [0, -0.55, 0], [1.4, 0.2, 1.0], 'The deflector turns 7,600 kN of exhaust sideways.', { k: 'box', rot: [0.4, 0, 0], c: '#6a6a72' }),
        ...ring(4, 0.8, (i, pos) => P(`Deluge ring nozzle ${i}`, [pos[0], -0.35, pos[2]], [0.06, 0.08, 0.06], `Deluge ${i}: water floods the pad to damp the acoustics.`, { k: 'cone', r: 0.03, h: 0.08, rot: [Math.PI, 0, 0], c: '#79b9d3' })),
      ],
    },
  },
  violin: {
    newSystems: [{ id: 'interior', label: 'Interior acoustics', color: '#d8b25c' }],
    parts: {
      interior: [
        P('Bass bar', [0.16, 0.1, 0.1], [0.05, 0.04, 0.7], 'The bass bar braces the top under the low-string foot.', { k: 'box', rot: [0.06, 0, 0.05], c: '#c89858' }),
        P('Sound post', [0.14, 0.06, -0.18], [0.03, 0.14, 0.03], 'The sound post wedges top to back — the soul of the violin.', { k: 'cyl', r: 0.015, h: 0.14, c: '#e0c08a' }),
        P('Purfling ring', [0, 0.17, 0.1], [0.78, 0.01, 0.98], 'Purfling stops edge cracks from running inward.', { k: 'tor', r: 0.42, t: 0.008, rot: [Math.PI / 2, 0, 0], c: '#3a2a1a' }),
        P('F-hole L', [0.22, 0.18, 0.1], [0.06, 0.02, 0.34], 'F-holes breathe the air resonance at ~280 Hz.', { k: 'box', rot: [0, 0, 0.12], c: '#2a1a0a' }),
        P('F-hole R', [-0.22, 0.18, 0.1], [0.06, 0.02, 0.34], 'Their length tunes the Helmholtz mode.', { k: 'box', rot: [0, 0, -0.12], c: '#2a1a0a' }),
        P('Top arching shell', [0, 0.2, 0.1], [0.74, 0.1, 0.95], 'Carved arching stiffness the spruce top.', { k: 'cap', r: 0.3, h: 0.5, rot: [Math.PI / 2, 0, 0], c: '#d8a24a', op: 0.35 }),
        P('Back arching shell', [0, -0.02, 0.1], [0.74, 0.1, 0.95], 'Maple back arching mirrors the top.', { k: 'cap', r: 0.3, h: 0.5, rot: [Math.PI / 2, 0, Math.PI], c: '#8a5a3a', op: 0.35 }),
        ...chain(6, (i) => P(`Rib segment ${i}`, [0.36 * Math.cos(i * 1.05), 0.08, 0.1 + 0.48 * Math.sin(i * 1.05)], [0.02, 0.14, 0.16], `Rib ${i}: 1.1 mm maple ribs bend around the mould.`, { k: 'box', rot: [0, -i * 1.05, 0], c: '#a06a3a' })),
        ...chain(4, (i) => P(`Glue seam ${i}`, [0.34 * Math.cos(i * 1.5 + 0.4), 0.15, 0.1 + 0.46 * Math.sin(i * 1.5 + 0.4)], [0.06, 0.01, 0.1], `Seam ${i}: hide glue seams allow future repairs.`, { k: 'box', rot: [0, -i * 1.5, 0], c: '#e8d8b0' })),
      ],
      neck: [
        P('Fingerboard', [0, 0.26, -0.62], [0.12, 0.03, 0.6], 'Ebony board radiused for clean string crossings.', { k: 'box', rot: [0.06, 0, 0], c: '#2a2a2a' }),
        P('Nut', [0, 0.28, -0.34], [0.12, 0.02, 0.02], 'The nut sets string spacing and height.', { k: 'box', c: '#e8e2d0' }),
        P('Pegbox wall L', [0.05, 0.26, -0.24], [0.02, 0.08, 0.24], 'Pegbox walls carry the friction pegs.', { k: 'box', c: '#8a5a3a' }),
        P('Pegbox wall R', [-0.05, 0.26, -0.24], [0.02, 0.08, 0.24], 'Holes are reamed at 1:30 taper.', { k: 'box', c: '#8a5a3a' }),
        ...chain(4, (i) => P(`Tuning peg ${i}`, [(i % 2 ? 0.07 : -0.07), 0.27, -0.14 - Math.floor(i / 2) * 0.1], [0.05, 0.03, 0.06], `Peg ${i}: pegs grip by friction, not threads.`, { k: 'cap', r: 0.02, h: 0.04, rot: [0, 0, Math.PI / 2], c: '#2a2a2a' })),
        P('Scroll volute', [0, 0.27, -0.02], [0.1, 0.12, 0.12], 'The scroll spiral is carved in three turns.', { k: 'tor', r: 0.05, t: 0.02, rot: [0, Math.PI / 2, 0], c: '#8a5a3a' }),
      ],
      strings: [
        P('G string', [0.045, 0.32, 0.2], [0.02, 0.02, 1.1], 'G: silver-wound, the darkest voice.', { k: 'tube', pts: [[0.045, 0.3, -0.34], [0.045, 0.34, 0.28], [0.04, 0.3, 0.75]], r: 0.011, c: '#b0a080' }),
        P('D string', [0.015, 0.32, 0.2], [0.02, 0.02, 1.1], 'D: aluminium-wound warmth.', { k: 'tube', pts: [[0.015, 0.3, -0.34], [0.015, 0.34, 0.28], [0.013, 0.3, 0.75]], r: 0.009, c: '#c0b090' }),
        P('A string', [-0.015, 0.32, 0.2], [0.02, 0.02, 1.1], 'A: plain steel brilliance.', { k: 'tube', pts: [[-0.015, 0.3, -0.34], [-0.015, 0.34, 0.28], [-0.013, 0.3, 0.75]], r: 0.007, c: '#d8d0b8' }),
        P('E string', [-0.045, 0.32, 0.2], [0.02, 0.02, 1.1], 'E: gold-plated for a sweet top.', { k: 'tube', pts: [[-0.045, 0.3, -0.34], [-0.045, 0.34, 0.28], [-0.04, 0.3, 0.75]], r: 0.006, c: '#e8e0c8' }),
        P('Tailpiece', [0, 0.3, 0.78], [0.12, 0.03, 0.24], 'The tailpiece anchors string tension to the button.', { k: 'box', rot: [0.2, 0, 0], c: '#2a2a2a' }),
        ...chain(4, (i) => P(`Fine tuner ${i}`, [0.045 - i * 0.03, 0.31, 0.72], [0.02, 0.03, 0.04], `Tuner ${i}: screws trim pitch after the pegs set it.`, { k: 'box', c: '#c8c8c8' })),
        P('Tailgut', [0, 0.26, 0.92], [0.02, 0.06, 0.08], 'The tailgut loop hangs on the end button.', { k: 'tube', pts: [[0, 0.28, 0.88], [0, 0.22, 0.96]], r: 0.008, c: '#3a3a3a' }),
      ],
      fittings: [
        P('Bridge (crown + waist + feet)', [0, 0.3, 0.28], [0.14, 0.12, 0.03], 'The bridge filters body resonances into the strings.', { shapes: [{ k: 'box', pos: [0, 0.05, 0], size: [0.14, 0.03, 0.03], c: '#e0c08a' }, { k: 'box', pos: [0, 0.01, 0], size: [0.05, 0.06, 0.03], c: '#e0c08a' }, { k: 'box', pos: [-0.055, -0.03, 0], size: [0.03, 0.03, 0.03], c: '#e0c08a' }, { k: 'box', pos: [0.055, -0.03, 0], size: [0.03, 0.03, 0.03], c: '#e0c08a' }] }),
        P('Chinrest', [0.24, 0.24, 0.86], [0.16, 0.04, 0.18], 'The chinrest frees the left hand.', { k: 'cap', r: 0.08, h: 0.03, rot: [0.3, 0, 0.2], c: '#3a2a1a' }),
        P('Chinrest clamp L', [0.18, 0.16, 0.94], [0.03, 0.08, 0.03], 'Clamps grip the rib edge over the button.', { k: 'cyl', r: 0.012, h: 0.08, c: '#c8c8c8' }),
        P('Chinrest clamp R', [0.3, 0.16, 0.94], [0.03, 0.08, 0.03], 'Cork protects the varnish.', { k: 'cyl', r: 0.012, h: 0.08, c: '#c8c8c8' }),
        P('Endpin & button', [0, 0.14, 0.98], [0.05, 0.05, 0.06], 'The button anchors the tailgut pull.', { k: 'cyl', r: 0.025, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#2a2a2a' }),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(DEPTH_PASS)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 3 (structures still missing per subject + material depth): chloroplast
// and plant-cell internals, rock/soil/water/carbon cycles, eye-ear-skin sets,
// caste anatomy, cell-chemistry cutaway, cable dehumidification & catwalks,
// steam circuit, flight-event sequence, violin acoustics & varnish layers,
// Giza precision & tooling evidence. Parts may set met/rgh for PBR depth.
const PASS3 = {
  cell: {
    newSystems: [{ id: 'plastids', label: 'Plastids & plant cell', color: '#5ca66b' }],
    parts: {
      plastids: [
        ...chain(4, (i) => P(`Chloroplast ${i} (envelope + grana)`, [-1.2 + i * 0.5, 1.5, 1.1 - i * 0.2], [0.3, 0.14, 0.2], `Chloroplast ${i}: double envelope wraps the grana stacks.`, { shapes: [{ k: 'sph', pos: [0, 0, 0], r: 0.14, c: '#3f8a4a', op: 0.5 }, { k: 'cyl', pos: [-0.05, 0, 0], r: 0.04, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#2f7a3a' }, { k: 'cyl', pos: [0.04, 0.02, 0], r: 0.04, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#2f7a3a' }] })),
        ...chain(6, (i) => P(`Granum ${i}`, [-1.1 + i * 0.22, 1.48, 1.05], [0.08, 0.1, 0.08], `Granum ${i}: stacked thylakoids hold PSII and the oxygen factory.`, { k: 'cyl', r: 0.04, h: 0.09, rot: [0, 0, Math.PI / 2 + (i % 3) * 0.3], c: '#2f7a3a' })),
        ...chain(4, (i) => P(`Stroma lamella ${i}`, [-1.0 + i * 0.25, 1.52, 1.1], [0.16, 0.02, 0.02], `Lamella ${i}: lamellae wire grana into one photosystem grid.`, { k: 'tube', pts: [[-1.05 + i * 0.25, 1.52, 1.08], [-0.9 + i * 0.25, 1.54, 1.12]], r: 0.01, c: '#4a9a5a' })),
        ...chain(3, (i) => P(`Starch grain ${i}`, [-0.9 + i * 0.4, 1.44, 1.15], [0.06, 0.05, 0.05], `Starch ${i}: excess sugar parks as starch overnight.`, { k: 'sph', r: 0.03, c: '#e8e2d0' })),
        ...chain(3, (i) => P(`Plastoglobule ${i}`, [-0.8 + i * 0.35, 1.56, 1.0], [0.03, 0.03, 0.03], `Plastoglobule ${i}: lipid droplets recycle thylakoid membranes.`, { k: 'sph', r: 0.016, c: '#d8b25c' })),
        ...chain(8, (i) => P(`Cellulose microfibril ${i}`, [-1.6 + i * 0.4, 0.4, 2.05], [0.3, 0.02, 0.02], `Microfibril ${i}: cellulose cables give the wall its tensile strength.`, { k: 'tube', pts: [[-1.7 + i * 0.4, 0.38, 2.05], [-1.45 + i * 0.4, 0.44, 2.06]], r: 0.01, c: '#e0d8b0' })),
        P('Middle lamella (pectin)', [0, 0.9, 0], [4.5, 4.5, 4.5], 'Pectin cement glues neighbouring plant cells.', { k: 'sph', r: 2.26, c: '#d8c898', op: 0.12 }),
        ...chain(4, (i) => P(`Plasmodesma ${i}`, [-1.2 + i * 0.8, 0.9, 2.2], [0.04, 0.2, 0.04], `Plasmodesma ${i}: cytoplasm bridges make the symplast continuum.`, { k: 'cyl', r: 0.015, h: 0.2, rot: [Math.PI / 2, 0, 0], c: '#9ad0c0' })),
        P('Central vacuole', [0, 0.75, 0], [2.6, 2.4, 2.6], 'The vacuole holds turgor, pigments and toxins.', { k: 'sph', r: 1.25, c: '#9ac0d8', op: 0.18 }),
        P('Tonoplast', [0, 0.75, 0], [2.64, 2.44, 2.64], 'The tonoplast pumps ions to keep the cell stiff.', { k: 'sph', r: 1.28, c: '#7fa8c9', op: 0.22 }),
      ],
      energy: [
        P('Inner mitochondrial membrane', [-0.85, 0.6, 0.7], [0.34, 0.2, 0.22], 'The inner membrane carries the electron chain.', { k: 'sph', r: 0.16, c: '#d87171', op: 0.4 }),
        P('Mitochondrial matrix', [-0.85, 0.6, 0.7], [0.28, 0.16, 0.18], 'The matrix runs the Krebs cycle.', { k: 'sph', r: 0.13, c: '#e89888', op: 0.6 }),
        ...ring(6, 0.14, (i, pos) => P(`ATP synthase ${i}`, [-0.85 + pos[0], 0.6 + pos[1], 0.7 + pos[2] * 0.6], [0.03, 0.05, 0.03], `ATP synthase ${i}: rotary motors spin out 30 ATP a second.`, { k: 'cap', r: 0.014, h: 0.03, c: '#f0d060' })),
        ...chain(4, (i) => P(`Cytochrome complex ${i}`, [-0.95 + i * 0.07, 0.66, 0.72], [0.03, 0.04, 0.03], `Complex ${i + 1}: proton pumps build the gradient.`, { k: 'box', c: '#b05060' })),
        P('Mitochondrial DNA loop', [-0.8, 0.56, 0.68], [0.06, 0.02, 0.06], 'mtDNA is a bare circular genome, maternally inherited.', { k: 'tor', r: 0.03, t: 0.008, c: '#8fb8d8' }),
      ],
    },
  },
  plants: {
    parts: {
      vascular: [
        ...ring(5, 0.16, (i, pos) => P(`Growth ring ${i}`, [pos[0] * 0.6, 0.5 + i * 0.12, pos[2] * 0.6], [0.3, 0.02, 0.3], `Ring ${i}: one xylem season per ring — dendrochronology.`, { k: 'tor', r: 0.14 - i * 0.02, t: 0.012, c: '#a08050' })),
        P('Heartwood', [0, 0.7, 0], [0.12, 1.4, 0.12], 'Heartwood is retired xylem, filled with tannins.', { k: 'cyl', r: 0.05, h: 1.4, c: '#7a5030' }),
        P('Sapwood', [0, 0.7, 0], [0.2, 1.4, 0.2], 'Sapwood is the living water pipeline.', { k: 'cyl', r: 0.09, h: 1.4, c: '#c8a878', op: 0.5 }),
        ...chain(4, (i) => P(`Bud scale ${i}`, [0, 1.72 + i * 0.02, 0.06 - i * 0.02], [0.08, 0.06, 0.02], `Scale ${i}: scales armour the winter bud.`, { k: 'box', rot: [0.4, 0, 0], c: '#8a6a4a' })),
        ...chain(4, (i) => P(`Auxin gradient marker ${i}`, [(i % 2 ? -1 : 1) * 0.1, 1.2 + i * 0.12, 0.08], [0.04, 0.1, 0.04], `Auxin ${i}: auxin flowing down the shaded side bends the stem.`, { k: 'cone', r: 0.02, h: 0.1, rot: [0, 0, (i % 2 ? 0.5 : -0.5)], c: '#f0d060', op: 0.8 })),
        P('Transpiration stream', [0.03, 0.4, 0.02], [0.05, 2.4, 0.05], 'The cohesion-tension stream lifts water tens of metres.', { k: 'tube', pts: [[0.03, -1.4, 0.02], [0.03, 0.4, 0.02], [0.0, 1.5, 0.02]], r: 0.016, c: '#79b9d3', op: 0.7 }),
      ],
      roots: [
        ...chain(4, (i) => P(`Root nodule ${i}`, [0.3 + (i % 2) * 0.25, -0.9 - i * 0.15, 0.2 - (i % 2) * 0.4], [0.1, 0.1, 0.1], `Nodule ${i}: rhizobia fix nitrogen inside these swellings.`, { k: 'sph', r: 0.05, c: '#d88ab0' })),
        ...chain(6, (i) => P(`Mycorrhizal hypha ${i}`, [-0.4 + i * 0.16, -1.35, -0.2 + (i % 3) * 0.2], [0.3, 0.01, 0.01], `Hypha ${i}: fungal partners mine phosphorus beyond the root.`, { k: 'tube', pts: [[-0.45 + i * 0.16, -1.3, -0.2 + (i % 3) * 0.2], [-0.2 + i * 0.16, -1.45, -0.1 + (i % 3) * 0.2]], r: 0.006, c: '#e8e2f0' })),
        P('Root pressure marker', [0, -0.6, 0.1], [0.06, 0.3, 0.06], 'Guttation at dawn shows root pressure at work.', { k: 'cone', r: 0.03, h: 0.3, c: '#79b9d3', op: 0.7 }),
      ],
      flower: [
        ...chain(3, (i) => P(`Pollen tube ${i}`, [0.1 - i * 0.1, 2.1, 0.05], [0.02, 0.3, 0.02], `Pollen tube ${i}: tubes race down the style to the ovule.`, { k: 'tube', pts: [[0.1 - i * 0.1, 2.2, 0.05], [0.08 - i * 0.08, 1.95, 0.04]], r: 0.008, c: '#f0e3a0' })),
        P('Embryo sac', [0, 2.14, 0], [0.06, 0.08, 0.05], 'The seven-celled sac holds the egg and polar nuclei.', { k: 'sph', r: 0.035, c: '#f0ead0', op: 0.8 }),
        ...chain(2, (i) => P(`Bract ${i}`, [(i ? -1 : 1) * 0.2, 1.85, 0.1], [0.14, 0.02, 0.1], `Bract ${i}: modified leaves advertise the inflorescence.`, { k: 'box', rot: [0, 0, i ? -0.5 : 0.5], c: '#d88ab0' })),
      ],
    },
  },
  earth: {
    newSystems: [{ id: 'cycles', label: 'Rock, soil, water & carbon', color: '#b09a6a' }],
    parts: {
      cycles: [
        P('Igneous rock (granite)', [-1.1, -0.6, 0.9], [0.24, 0.2, 0.2], 'Igneous rock crystallises from melt.', { k: 'box', c: '#c8a8a8', rgh: 0.8 }),
        P('Sedimentary rock (sandstone)', [-0.8, -0.9, 1.0], [0.24, 0.16, 0.2], 'Sedimentary rock stacks compressed grains.', { k: 'box', c: '#d8c098', rgh: 0.9 }),
        P('Metamorphic rock (gneiss)', [-0.5, -1.1, 0.8], [0.24, 0.18, 0.2], 'Metamorphic rock re-bands under heat and pressure.', { k: 'box', c: '#9a9aa8', rgh: 0.7 }),
        P('Magma chamber', [0.4, -0.7, -0.9], [0.5, 0.4, 0.5], 'Magma chambers stash melt beneath volcanoes.', { k: 'sph', r: 0.24, c: '#e87030', op: 0.7 }),
        P('Lava flow', [0.5, -0.4, -1.0], [0.3, 0.1, 0.4], 'Lava cools into new igneous crust.', { k: 'tube', pts: [[0.45, -0.5, -0.95], [0.6, -0.3, -1.05]], r: 0.03, c: '#c05030' }),
        ...chain(4, (i) => P(`Sediment layer ${i}`, [-0.3, -1.2 + i * 0.05, 0.9], [1.0, 0.04, 0.6], `Layer ${i}: each bed is a page of deep time.`, { k: 'box', c: ['#e0d0a8', '#d0b898', '#c0a888', '#b09878'][i - 1] })),
        P('Fold (anticline)', [0.8, -0.9, 0.7], [0.5, 0.2, 0.3], 'Folds record compressional tectonics.', { k: 'tor', r: 0.2, t: 0.05, rot: [0, 0.6, 0], c: '#c8b088' }),
        P('Soil O horizon (organic)', [1.0, 0.9, 0.9], [0.4, 0.04, 0.35], 'Leaf litter forms the O horizon.', { k: 'box', c: '#5a4a3a' }),
        P('Soil A horizon (topsoil)', [1.0, 0.85, 0.9], [0.4, 0.05, 0.35], 'Topsoil mixes humus and minerals.', { k: 'box', c: '#7a5a3a' }),
        P('Soil B horizon (subsoil)', [1.0, 0.78, 0.9], [0.4, 0.06, 0.35], 'Clay and iron accumulate in the B horizon.', { k: 'box', c: '#9a7a4a' }),
        P('Soil C horizon (regolith)', [1.0, 0.7, 0.9], [0.4, 0.06, 0.35], 'Weathered rock chips form the C horizon.', { k: 'box', c: '#b09878' }),
        P('Soil R horizon (bedrock)', [1.0, 0.62, 0.9], [0.4, 0.05, 0.35], 'Unweathered bedrock closes the profile.', { k: 'box', c: '#8a8a92' }),
        P('Carbon: atmosphere pool', [0, 1.7, 0.9], [0.3, 0.2, 0.3], 'The air holds about 420 ppm of CO2.', { k: 'sph', r: 0.14, c: '#c8d8e8', op: 0.5 }),
        P('Carbon: ocean pool', [-0.9, -0.2, 1.1], [0.4, 0.3, 0.3], 'The ocean stores 50x the atmospheric carbon.', { k: 'sph', r: 0.18, c: '#3a7a9a', op: 0.6 }),
        P('Carbon: biomass pool', [0.7, 0.9, 1.0], [0.3, 0.24, 0.3], 'Living biomass turns carbon over in decades.', { k: 'sph', r: 0.13, c: '#5ca66b', op: 0.6 }),
        P('Carbon: fossil pool', [0.2, -1.1, 0.8], [0.3, 0.16, 0.3], 'Fossil carbon took 300 million years to bank.', { k: 'sph', r: 0.11, c: '#3a3a3a' }),
        ...chain(4, (i) => P(`Carbon flux arrow ${i}`, [-0.4 + i * 0.4, 0.4 + (i % 2) * 0.6, 1.15], [0.04, 0.4, 0.04], `Flux ${i}: photosynthesis, respiration, dissolution and emissions.`, { k: 'cone', r: 0.025, h: 0.3, rot: [i % 2 ? 0 : Math.PI, 0, 0.3], c: '#e8a05a', op: 0.8 })),
        P('Evaporation column', [-0.6, 0.9, 0.8], [0.1, 0.6, 0.1], 'Evaporation lifts 500,000 km3 of water a year.', { k: 'cone', r: 0.05, h: 0.5, c: '#a8d8e8', op: 0.5 }),
        ...chain(3, (i) => P(`Precipitation cell ${i}`, [-0.4 + i * 0.5, 1.5, 0.7], [0.06, 0.2, 0.06], `Rain cell ${i}: condensation returns the water as rain and snow.`, { k: 'cone', r: 0.035, h: 0.16, rot: [Math.PI, 0, 0], c: '#79b9d3', op: 0.7 })),
        P('Runoff channel', [-0.2, 0.2, 1.25], [0.5, 0.05, 0.08], 'Runoff carves rivers back to the sea.', { k: 'tube', pts: [[-0.5, 0.5, 1.2], [0.1, 0.0, 1.28]], r: 0.02, c: '#5a9ab0' }),
        P('Infiltration path', [0.5, 0.2, 1.1], [0.05, 0.6, 0.05], 'Infiltration recharges the aquifers.', { k: 'tube', pts: [[0.5, 0.5, 1.1], [0.5, -0.2, 1.0]], r: 0.016, c: '#79b9d3', op: 0.7 }),
        P('Atmosphere: nitrogen 78%', [0.3, 1.55, -0.9], [0.1, 0.1, 0.1], 'Nitrogen makes 78% of dry air.', { k: 'sph', r: 0.05, c: '#8fb8d8', op: 0.7 }),
        P('Atmosphere: oxygen 21%', [0.5, 1.5, -0.8], [0.08, 0.08, 0.08], 'Oxygen is 21% — almost all biogenic.', { k: 'sph', r: 0.04, c: '#7fc88a', op: 0.7 }),
        P('Atmosphere: argon 0.93%', [0.15, 1.48, -0.95], [0.05, 0.05, 0.05], 'Argon comes from radioactive potassium decay.', { k: 'sph', r: 0.025, c: '#ad9bd8', op: 0.7 }),
        P('Atmosphere: CO2 0.04%', [0.42, 1.42, -0.92], [0.03, 0.03, 0.03], 'Tiny CO2 fraction, outsized climate lever.', { k: 'sph', r: 0.015, c: '#c8c8c8', op: 0.7 }),
      ],
    },
  },
  frog: {
    parts: {
      external: [
        P('Cornea L', [-1.08, 0.3, 0.3], [0.14, 0.14, 0.14], 'The cornea does most of the focusing underwater.', { k: 'sph', r: 0.07, c: '#d8e8f0', op: 0.5, rgh: 0.1 }),
        P('Cornea R', [-1.08, 0.3, -0.3], [0.14, 0.14, 0.14], 'A clear window over the iris.', { k: 'sph', r: 0.07, c: '#d8e8f0', op: 0.5, rgh: 0.1 }),
        P('Lens L', [-1.06, 0.28, 0.29], [0.1, 0.1, 0.1], 'The lens moves forward to focus — no shape change.', { k: 'sph', r: 0.05, c: '#f0ead0', op: 0.7, rgh: 0.15 }),
        P('Lens R', [-1.06, 0.28, -0.29], [0.1, 0.1, 0.1], 'Frog lenses focus by distance, not curvature.', { k: 'sph', r: 0.05, c: '#f0ead0', op: 0.7, rgh: 0.15 }),
        P('Retina L', [-1.02, 0.28, 0.27], [0.1, 0.1, 0.04], 'Retina rods let frogs hunt at night.', { k: 'sph', r: 0.05, c: '#c05060', op: 0.7 }),
        P('Retina R', [-1.02, 0.28, -0.27], [0.1, 0.1, 0.04], 'Green rods give extreme dim-light sensitivity.', { k: 'sph', r: 0.05, c: '#c05060', op: 0.7 }),
        P('Iris L', [-1.07, 0.3, 0.31], [0.12, 0.12, 0.02], 'The iris ring colours the eye gold or bronze.', { k: 'tor', r: 0.055, t: 0.012, rot: [0, 1.2, 0], c: '#d8b25c' }),
        P('Iris R', [-1.07, 0.3, -0.31], [0.12, 0.12, 0.02], 'Pupils contract to a slit in bright light.', { k: 'tor', r: 0.055, t: 0.012, rot: [0, 1.2, 0], c: '#d8b25c' }),
        P('Tympanum L', [-0.85, 0.1, 0.42], [0.16, 0.16, 0.02], 'The eardrum sits flush in the skin.', { k: 'cyl', r: 0.08, h: 0.015, rot: [Math.PI / 2, 0, 0.4], c: '#8aa05c' }),
        P('Tympanum R', [-0.85, 0.1, -0.42], [0.16, 0.16, 0.02], 'Size relative to the eye sexes many species.', { k: 'cyl', r: 0.08, h: 0.015, rot: [Math.PI / 2, 0, -0.4], c: '#8aa05c' }),
        P('Columella L', [-0.83, 0.1, 0.36], [0.08, 0.02, 0.02], 'The columella rod carries drum vibration inward.', { k: 'cyl', r: 0.01, h: 0.08, rot: [Math.PI / 2, 0, 0], c: '#e8e2d0' }),
        P('Columella R', [-0.83, 0.1, -0.36], [0.08, 0.02, 0.02], 'One bone where mammals keep three.', { k: 'cyl', r: 0.01, h: 0.08, rot: [Math.PI / 2, 0, 0], c: '#e8e2d0' }),
        P('Otic capsule L', [-0.78, 0.12, 0.3], [0.08, 0.08, 0.08], 'Otic capsules house the inner ear.', { k: 'sph', r: 0.04, c: '#d8d2c0' }),
        P('Otic capsule R', [-0.78, 0.12, -0.3], [0.08, 0.08, 0.08], 'Balance and hearing share the chamber.', { k: 'sph', r: 0.04, c: '#d8d2c0' }),
        P('Epidermis shell', [0, 0.05, 0], [1.6, 0.56, 1.16], 'A thin epidermis lets gases and water cross.', { k: 'cap', r: 0.53, h: 0.62, rot: [0, 0, Math.PI / 2], c: '#7fa35c', op: 0.16 }),
        P('Dermis shell', [0, 0.04, 0], [1.55, 0.52, 1.12], 'The dermis carries the gland and pigment layers.', { k: 'cap', r: 0.5, h: 0.6, rot: [0, 0, Math.PI / 2], c: '#9ab87a', op: 0.2 }),
        ...chain(6, (i) => P(`Chromatophore ${i}`, [-0.6 + i * 0.26, 0.26, (i % 2 ? 0.4 : -0.4)], [0.06, 0.04, 0.06], `Chromatophore ${i}: pigment cells repaint the skin in minutes.`, { k: 'sph', r: 0.03, c: ['#3a5a2a', '#8a6a2a', '#2a2a2a', '#5ca66b', '#7a5a2a', '#4a6a3a'][i - 1] })),
        ...chain(4, (i) => P(`Granular (poison) gland ${i}`, [-0.5 + i * 0.35, 0.24, (i % 2 ? -0.45 : 0.45)], [0.07, 0.05, 0.07], `Granular gland ${i}: alkaloid secretions discourage predators.`, { k: 'sph', r: 0.035, c: '#d8d8a8', op: 0.7 })),
      ],
    },
  },
  bee: {
    newSystems: [{ id: 'castes', label: 'Caste anatomy', color: '#d8a24a' }],
    parts: {
      castes: [
        P('Queen spermatheca', [0.55, 0.02, 0.06], [0.07, 0.07, 0.07], 'The spermatheca stores 5 million sperm for years.', { k: 'sph', r: 0.035, c: '#e8d8f0' }),
        P('Queen ovary L', [0.35, 0.02, 0.08], [0.3, 0.1, 0.06], 'Queen ovaries fill the abdomen — 2,000 eggs a day.', { k: 'cap', r: 0.05, h: 0.24, rot: [0, 0, Math.PI / 2], c: '#f0e3c0' }),
        P('Queen ovary R', [0.35, 0.02, -0.08], [0.3, 0.1, 0.06], 'Ovarioles run in parallel bundles.', { k: 'cap', r: 0.05, h: 0.24, rot: [0, 0, Math.PI / 2], c: '#f0e3c0' }),
        P('Queen sting (smooth)', [0.95, -0.04, 0], [0.14, 0.03, 0.03], 'A smooth queen sting stings rivals repeatedly.', { k: 'cone', r: 0.015, h: 0.14, rot: [0, 0, -Math.PI / 2], c: '#3a3126' }),
        P('Queen mandible L', [-1.16, -0.04, 0.05], [0.06, 0.04, 0.03], 'Queen mandibles spread retinue pheromone.', { k: 'box', c: '#5a4a2a' }),
        P('Drone eye (dorsal)', [-1.06, 0.16, 0.1], [0.16, 0.16, 0.12], 'Drone eyes double in size to spot queens mid-air.', { k: 'sph', r: 0.08, c: '#3a3126' }),
        P('Drone wing', [-0.5, 0.2, -0.3], [0.5, 0.01, 0.3], 'Drone wings overhang the abdomen.', { k: 'box', rot: [0.2, 0, 0.3], c: '#d8e8f0', op: 0.4, rgh: 0.1 }),
        P('Drone endophallus sac', [0.8, -0.06, 0], [0.1, 0.08, 0.08], 'Mating is terminal for the drone.', { k: 'sph', r: 0.05, c: '#e8c8a8', op: 0.7 }),
        ...chain(4, (i) => P(`Worker task marker ${i} (age polyethism)`, [-0.9 + i * 0.5, 0.24, 0.2], [0.08, 0.06, 0.06], `Day ${i * 5}: cleaning, nursing, building, then foraging.`, { k: 'cone', r: 0.04, h: 0.06, c: ['#e8d48b', '#d8b25c', '#c89838', '#b88828'][i - 1] })),
      ],
    },
  },
  vehicle: {
    parts: {
      energy: [
        P('Cell cutaway: cathode foil', [0.9, 0.3, 0.62], [0.3, 0.2, 0.02], 'The cathode foil carries the lithium nickel oxide coat.', { shapes: [{ k: 'box', pos: [0, 0, 0], size: [0.3, 0.2, 0.01], c: '#b06a5a' }, { k: 'box', pos: [0, 0, 0.015], size: [0.3, 0.2, 0.02], c: '#8a4a3a' }] }),
        P('Cell cutaway: anode foil', [0.9, 0.3, 0.56], [0.3, 0.2, 0.02], 'Copper foil carries the graphite anode.', { shapes: [{ k: 'box', pos: [0, 0, 0], size: [0.3, 0.2, 0.01], c: '#c8873a', met: 0.8 }, { k: 'box', pos: [0, 0, -0.015], size: [0.3, 0.2, 0.02], c: '#3a3a3a' }] }),
        P('Cell cutaway: separator', [0.9, 0.3, 0.59], [0.32, 0.22, 0.008], 'A microporous film keeps the foils apart.', { k: 'box', c: '#e8e8f0', op: 0.6 }),
        P('Electrolyte gel', [0.9, 0.3, 0.59], [0.3, 0.2, 0.03], 'Liquid electrolyte shuttles lithium ions.', { k: 'box', c: '#9ad0c0', op: 0.4 }),
        ...chain(6, (i) => P(`Lithium ion marker ${i}`, [0.78 + i * 0.045, 0.3, 0.59], [0.02, 0.02, 0.02], `Li+ ${i}: ions rock between anode and cathode.`, { k: 'sph', r: 0.011, c: '#d8b25c' })),
        ...chain(3, (i) => P(`Cathode crystal ${i}`, [0.82 + i * 0.07, 0.34, 0.63], [0.03, 0.03, 0.03], `NMC ${i}: layered oxides host the lithium.`, { k: 'box', rot: [0.4, 0.4, 0], c: '#8a4a3a' })),
        ...chain(3, (i) => P(`Graphite flake ${i}`, [0.82 + i * 0.07, 0.26, 0.55], [0.03, 0.02, 0.03], `Graphite ${i}: carbon layers intercalate the ions.`, { k: 'box', rot: [0.2, 0, 0.3], c: '#2a2a2a' })),
        ...chain(4, (i) => P(`Separator pore ${i}`, [0.8 + i * 0.06, 0.3, 0.59], [0.01, 0.01, 0.01], `Pore ${i}: nanometre pores pass ions, block dendrites.`, { k: 'sph', r: 0.006, c: '#f0f0f8' })),
        P('SEI layer', [0.9, 0.28, 0.565], [0.3, 0.008, 0.02], 'The SEI passivates the anode for life.', { k: 'box', c: '#7fa8c9', op: 0.6 }),
        P('Electrode tab (+)', [1.06, 0.36, 0.62], [0.08, 0.06, 0.01], 'Aluminium tabs collect cathode current.', { k: 'box', c: '#c8c8d0', met: 0.9, rgh: 0.3 }),
        P('Electrode tab (−)', [1.06, 0.24, 0.56], [0.08, 0.06, 0.01], 'Nickel-plated copper tabs collect anode current.', { k: 'box', c: '#c8a878', met: 0.9, rgh: 0.3 }),
      ],
      powertrain: [
        P('Regen marker: motor as generator', [1.5, 1.0, 0.3], [0.12, 0.12, 0.12], 'Lifting off turns the motor into a generator.', { k: 'cone', r: 0.06, h: 0.12, rot: [0, 0, Math.PI], c: '#5ca66b', op: 0.8 }),
        P('Blended braking controller', [1.2, 0.9, -0.4], [0.14, 0.08, 0.1], 'The controller blends regen and friction seamlessly.', { k: 'box', c: '#3a5a4a' }),
      ],
      electronics: [
        P('CCS DC pins', [-1.62, 0.86, 0.85], [0.08, 0.06, 0.06], 'The big lower pins take DC fast charge.', { shapes: [{ k: 'cyl', pos: [-0.02, 0, 0], r: 0.02, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0', met: 0.9 }, { k: 'cyl', pos: [0.02, 0, 0], r: 0.02, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0', met: 0.9 }] }),
        P('Precharge resistor', [-1.4, 0.55, -0.4], [0.1, 0.06, 0.06], 'Precharge protects the contactors from inrush.', { k: 'cyl', r: 0.03, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#8a6a4a' }),
        ...chain(3, (i) => P(`Charge curve marker ${i} (10-80%)`, [-1.3 + i * 0.12, 0.72, -0.5], [0.04, 0.1 + i * 0.06, 0.04], `Marker ${i}: peak kW early, tapering as cells fill.`, { k: 'box', c: '#5ca66b', op: 0.8 })),
      ],
    },
  },
  engineering: {
    parts: {
      cables: [
        P('Cable dehumidification plant', [1.75, 0.7, 0.62], [0.16, 0.14, 0.14], 'Dry air pumped into the cable stops internal corrosion.', { k: 'box', c: '#79b9d3' }),
        P('Drying air line L', [1.2, 1.4, 0.52], [0.9, 0.02, 0.02], 'Injection ports feed dry air along the cable.', { k: 'tube', pts: [[1.7, 0.8, 0.55], [1.2, 1.6, 0.5], [0.4, 1.0, 0.5]], r: 0.01, c: '#a8d8e8' }),
        P('Drying air line R', [1.2, 1.4, -0.52], [0.9, 0.02, 0.02], 'Exhaust ports sit at mid-span.', { k: 'tube', pts: [[1.7, 0.8, -0.55], [1.2, 1.6, -0.5], [0.4, 1.0, -0.5]], r: 0.01, c: '#a8d8e8' }),
        P('Catwalk L', [-1.2, 1.1, 0.66], [2.6, 0.03, 0.16], 'Catwalks let spinners follow the cable curve.', { k: 'box', rot: [0, 0, 0.0], c: '#9aa8b8', op: 0.7 }),
        P('Catwalk R', [-1.2, 1.1, -0.66], [2.6, 0.03, 0.16], 'They hang on temporary ropes during spinning.', { k: 'box', c: '#9aa8b8', op: 0.7 }),
        ...chain(4, (i) => P(`Catwalk roller ${i}`, [-1.5 + i * 0.9, 1.24 + (i % 2) * 0.3, 0.66], [0.06, 0.06, 0.06], `Roller ${i}: wires ride rollers as they are spun.`, { k: 'cyl', r: 0.03, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0', met: 0.8 })),
        P('Splay chamber L', [-1.95, 0.45, 0.5], [0.3, 0.4, 0.3], 'Splay chambers hide the strand anchorages.', { k: 'box', c: '#7a7a82', op: 0.6 }),
        P('Splay chamber R', [-1.95, 0.45, -0.5], [0.3, 0.4, 0.3], 'Inspectors check sockets inside.', { k: 'box', c: '#7a7a82', op: 0.6 }),
      ],
      structure: [
        P('Inspection walkway', [0, 0.18, 0], [3.6, 0.02, 0.3], 'Walkways under the deck serve bearings and joints.', { k: 'box', c: '#8a9aa8', op: 0.6 }),
        ...chain(2, (i) => P(`Deck drain pipe ${i}`, [-1.0 + i * 2.0, 0.3, 0.5], [0.06, 0.3, 0.06], `Drain ${i}: scuppers pipe runoff away from steel.`, { k: 'cyl', r: 0.03, h: 0.3, c: '#5a6a7a' })),
        ...chain(4, (i) => P(`Load path marker ${i}`, [-1.2 + i * 0.8, 0.7, 0], [0.06, 0.5, 0.06], `Path ${i}: deck to stringer, floor beam, truss, bearing, pier.`, { k: 'cone', r: 0.035, h: 0.4, rot: [Math.PI, 0, 0], c: '#e8a05a', op: 0.8 })),
        P('Wind fairing L', [0, 0.5, 0.78], [3.8, 0.12, 0.1], 'Fairings streamline the deck against flutter.', { k: 'box', rot: [0.4, 0, 0], c: '#8fb8d8', op: 0.6 }),
        P('Wind fairing R', [0, 0.5, -0.78], [3.8, 0.12, 0.1], 'Tacoma Narrows taught the industry aerodynamics.', { k: 'box', rot: [-0.4, 0, 0], c: '#8fb8d8', op: 0.6 }),
        ...chain(4, (i) => P(`Structural health sensor ${i}`, [-1.4 + i * 0.9, 0.44, 0.4], [0.05, 0.04, 0.05], `Sensor ${i}: strain gauges and accelerometers watch fatigue.`, { k: 'box', c: '#5ca66b' })),
      ],
    },
  },
  giza: {
    parts: {
      structure: [
        ...chain(4, (i) => P(`Cardinal alignment marker ${i}`, [(i === 0 ? 0 : i === 1 ? 1.7 : i === 2 ? 0 : -1.7), 0.02, (i === 0 ? 1.7 : i === 1 ? 0 : i === 2 ? -1.7 : 0)], [0.1, 0.05, 0.1], `Face ${['north', 'east', 'south', 'west'][i - 1]}: the base misses true cardinal by ~3/60 of a degree.`, { k: 'cone', r: 0.05, h: 0.05, c: '#e8d48b' })),
        P('Apex offset marker', [0.06, 2.6, 0.02], [0.08, 0.08, 0.08], 'The apex sits 7 m off-centre over the bedrock knoll.', { k: 'sph', r: 0.04, c: '#f0d060', op: 0.8 }),
        ...chain(4, (i) => P(`Dolerite pounder ${i}`, [-1.3 + i * 0.5, 0.06, 1.5 - (i % 2) * 0.3], [0.08, 0.08, 0.08], `Pounder ${i}: hard stone balls battered granite into shape.`, { k: 'sph', r: 0.04, c: '#4a4a4a', rgh: 0.9 })),
        ...chain(3, (i) => P(`Copper chisel ${i}`, [-0.9 + i * 0.6, 0.05, 1.6], [0.1, 0.03, 0.03], `Chisel ${i}: copper chisels and wooden mallets cut limestone.`, { k: 'box', c: '#b06a5a', met: 0.7 })),
        ...chain(3, (i) => P(`Worker graffiti (gang name) ${i}`, [0.9 - i * 0.3, 1.3 + i * 0.12, -0.9 + i * 0.2], [0.12, 0.08, 0.02], `Graffito ${i}: “Friends of Khufu” gangs signed their blocks.`, { k: 'box', c: '#c0504d', op: 0.8 })),
        P('Merer diary marker (Wadi al-Jarf)', [-1.7, 0.05, -1.4], [0.16, 0.08, 0.12], 'Papyri log inspector Merer hauling Tura casing by boat.', { k: 'box', c: '#e0d8b0' }),
        ...chain(2, (i) => P(`Local quarry face ${i}`, [1.6 + i * 0.2, 0.1 + i * 0.1, -1.5 - i * 0.15], [0.4, 0.2, 0.3], `Quarry ${i}: most core stone came from just south of the site.`, { k: 'box', rot: [0, 0.4, 0.2], c: '#c8b088', rgh: 0.9 })),
        ...chain(2, (i) => P(`Slope angle marker 51°50′ ${i}`, [-1.2 + i * 2.4, 1.0, 1.2 - i * 2.4], [0.06, 0.7, 0.06], `Seked ${i}: the slope follows a seked of 5.5 palms per cubit.`, { k: 'cyl', r: 0.02, h: 0.7, rot: [0.9 * (i ? -1 : 1), 0, 0.6], c: '#e8d48b', op: 0.8 })),
        ...chain(3, (i) => P(`Casing joint (fine) ${i}`, [-1.4 + i * 0.4, 0.3 + i * 0.2, 1.3 - i * 0.3], [0.14, 0.1, 0.06], `Joint ${i}: casing joints closed to half a millimetre.`, { k: 'box', c: '#efe6cf', rgh: 0.2 })),
      ],
    },
  },
  locomotive: {
    parts: {
      boiler: [
        P('Superheater header', [-1.3, 0.9, 0], [0.2, 0.24, 0.3], 'The header splits steam into the superheater elements.', { k: 'box', c: '#b06a5a' }),
        P('Steam pipe (dry)', [-1.0, 0.95, 0], [0.6, 0.12, 0.12], 'The dry pipe carries steam from regulator to chest.', { k: 'cyl', r: 0.06, h: 0.6, rot: [0, 0, Math.PI / 2], c: '#c8d0d8', met: 0.7 }),
        P('Valve chest L', [-1.5, 0.72, 0.3], [0.4, 0.14, 0.14], 'Chests house the piston valves.', { k: 'cyl', r: 0.07, h: 0.4, rot: [0, 0, Math.PI / 2], c: '#8a9aa8', met: 0.6 }),
        P('Valve chest R', [-1.5, 0.72, -0.3], [0.4, 0.14, 0.14], 'Chest ports alternate admission and exhaust.', { k: 'cyl', r: 0.07, h: 0.4, rot: [0, 0, Math.PI / 2], c: '#8a9aa8', met: 0.6 }),
        P('Blower', [-1.6, 1.0, 0], [0.08, 0.1, 0.08], 'The blower keeps draft when the exhaust stops.', { k: 'tor', r: 0.05, t: 0.015, c: '#c8b060', met: 0.7 }),
        P('Hydrostatic lubricator', [0.05, 1.2, 0.15], [0.1, 0.14, 0.1], 'Oil drips are counted per minute by the fireman.', { k: 'box', c: '#d8b25c', op: 0.7 }),
        P('Injector steam pipe', [0.5, 0.9, 0.35], [0.4, 0.04, 0.04], 'Live steam drives water uphill into the boiler.', { k: 'tube', pts: [[0.6, 0.8, 0.35], [0.2, 0.95, 0.35]], r: 0.018, c: '#b0b8c0', met: 0.7 }),
        P('Exhaust steam pipe', [-1.4, 0.85, 0], [0.3, 0.1, 0.1], 'Exhaust drops to the blastpipe below the chimney.', { k: 'cyl', r: 0.05, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#6a6a72', met: 0.5 }),
        ...chain(2, (i) => P(`Mudhole door ${i}`, [0.2 + i * 0.5, 0.42, 0.28 - i * 0.56], [0.1, 0.08, 0.08], `Mudhole ${i}: doors let boilers be cleaned of scale.`, { k: 'cyl', r: 0.05, h: 0.04, rot: [Math.PI / 2, 0, 0], c: '#5a5a62' })),
        ...chain(2, (i) => P(`Washout plug ${i}`, [-0.6 + i * 1.2, 0.45, 0.3 - i * 0.6], [0.05, 0.05, 0.05], `Plug ${i}: washout plugs drain the boiler for inspection.`, { k: 'cyl', r: 0.025, h: 0.04, c: '#c8b060', met: 0.8 })),
        P('Water gauge glass', [0.12, 1.05, 0.28], [0.03, 0.2, 0.03], 'The gauge glass shows the only level that matters.', { k: 'cyl', r: 0.015, h: 0.2, c: '#d8e8f0', op: 0.6, rgh: 0.1 }),
        P('Firebox door hinge', [0.92, 0.62, 0.12], [0.04, 0.12, 0.04], 'The hinge lets the door swing for cleaning.', { k: 'cyl', r: 0.02, h: 0.12, c: '#3a3a3a' }),
      ],
    },
  },
  rocket: {
    newSystems: [{ id: 'flight', label: 'Flight sequence & recovery', color: '#e6a65d' }],
    parts: {
      flight: [
        P('Trajectory arc', [1.2, 2.4, 0], [2.4, 2.4, 0.1], 'The gravity turn bends the climb downrange.', { k: 'tube', pts: [[0.6, 0.4, 0], [1.6, 2.2, 0], [2.4, 4.2, 0]], r: 0.02, c: '#e6a65d', op: 0.6 }),
        P('Max-Q marker', [1.1, 1.6, 0], [0.12, 0.12, 0.12], 'Max-Q: peak aerodynamic pressure at ~T+70 s.', { k: 'sph', r: 0.06, c: '#d87171', op: 0.8 }),
        P('MECO marker', [1.7, 2.6, 0], [0.12, 0.12, 0.12], 'MECO: first-stage main engine cut-off.', { k: 'sph', r: 0.06, c: '#e6a65d', op: 0.8 }),
        P('Stage separation marker', [1.8, 2.8, 0], [0.12, 0.12, 0.12], 'Separation: pushers and pneumatics cut the stack.', { k: 'sph', r: 0.06, c: '#8fb8d8', op: 0.8 }),
        P('SES-1 marker', [2.1, 3.4, 0], [0.12, 0.12, 0.12], 'SES-1: second engine start reaches orbit.', { k: 'sph', r: 0.06, c: '#9ad0c0', op: 0.8 }),
        P('Boostback burn marker', [1.4, 2.0, 0.2], [0.12, 0.12, 0.12], 'Boostback flips the booster uprange.', { k: 'sph', r: 0.06, c: '#d8b25c', op: 0.8 }),
        P('Entry burn marker', [1.0, 1.2, 0.2], [0.12, 0.12, 0.12], 'Entry burn bleeds speed before the atmosphere does.', { k: 'sph', r: 0.06, c: '#c0504d', op: 0.8 }),
        P('Landing burn marker', [0.7, 0.4, 0.2], [0.12, 0.12, 0.12], 'One centre engine closes the 30 m landing burn.', { k: 'sph', r: 0.06, c: '#5ca66b', op: 0.8 }),
        ...chain(4, (i) => P(`Cold-gas thruster ${i}`, [0.44 * Math.cos(i * Math.PI / 2 + 0.785), 2.2, 0.44 * Math.sin(i * Math.PI / 2 + 0.785)], [0.05, 0.08, 0.05], `Thruster ${i}: nitrogen jets roll the booster during coast.`, { k: 'cone', r: 0.025, h: 0.08, rot: [0, -i * Math.PI / 2, Math.PI / 2], c: '#9aa8b8', met: 0.6 })),
        ...chain(4, (i) => P(`Grid fin actuator ${i}`, [0.36 * Math.cos(i * Math.PI / 2), 1.9, 0.36 * Math.sin(i * Math.PI / 2)], [0.06, 0.1, 0.06], `Actuator ${i}: hydraulic actuators tilt the titanium fins.`, { k: 'cyl', r: 0.03, h: 0.1, rot: [0, -i * Math.PI / 2, 0.6], c: '#8a8a92', met: 0.7 })),
        ...chain(2, (i) => P(`Fairing parafoil ${i}`, [(i ? -0.5 : 0.5), 4.6, 0], [0.4, 0.1, 0.3], `Parafoil ${i}: steerable canopies fly the halves to recovery.`, { k: 'cap', r: 0.15, h: 0.2, rot: [0, 0, i ? 0.4 : -0.4], c: '#e8a05a', op: 0.7 })),
        ...chain(2, (i) => P(`Helium heater ${i}`, [0.25 - i * 0.5, 1.7, 0.25 - i * 0.5], [0.08, 0.1, 0.08], `Heater ${i}: warmed helium pressurises tanks and pneumatics.`, { k: 'box', c: '#c8b060' })),
        ...chain(2, (i) => P(`TVC actuator ${i}`, [0.15 - i * 0.3, 0.05, 0.15 - i * 0.3], [0.08, 0.12, 0.08], `TVC ${i}: thrust-vector actuators gimbal the engines.`, { k: 'cyl', r: 0.04, h: 0.12, rot: [0.4, 0, 0.4], c: '#7a7a82', met: 0.7 })),
      ],
    },
  },
  violin: {
    newSystems: [{ id: 'acoustics', label: 'Acoustics & varnish', color: '#9ad0c0' }],
    parts: {
      acoustics: [
        P('Helmholtz air volume (A0)', [0, 0.07, 0.1], [0.6, 0.12, 0.8], 'The air spring inside resonates near 280 Hz.', { k: 'box', c: '#9ad0c0', op: 0.15 }),
        P('A0 marker (air mode)', [0, 0.07, 0.55], [0.08, 0.08, 0.08], 'A0 pumps air through the f-holes.', { k: 'sph', r: 0.04, c: '#9ad0c0', op: 0.8 }),
        P('B1− marker (body mode)', [0.2, 0.12, -0.2], [0.08, 0.08, 0.08], 'B1− bends the top and back in opposition.', { k: 'sph', r: 0.04, c: '#d8b25c', op: 0.8 }),
        P('B1+ marker (body mode)', [-0.2, 0.12, 0.3], [0.08, 0.08, 0.08], 'B1+ moves the plates together — the violin signature.', { k: 'sph', r: 0.04, c: '#d88ab0', op: 0.8 }),
        ...chain(2, (i) => P(`Bridge mode marker ${i}`, [0, 0.36 + i * 0.03, 0.28], [0.06, 0.05, 0.04], `Bridge ${i}: the bridge hill boosts the 2-3 kHz brilliance.`, { k: 'cone', r: 0.03, h: 0.05, c: '#e0c08a', op: 0.8 })),
        P('Top plate mode 5', [0, 0.2, -0.3], [0.3, 0.04, 0.3], 'Mode 5 rings the top like a bell — tap tone tuning.', { k: 'box', c: '#d8a24a', op: 0.5 }),
        P('Back plate mode 5', [0, -0.02, -0.3], [0.3, 0.04, 0.3], 'Makers tune back mode 5 a semitone below the top.', { k: 'box', c: '#8a5a3a', op: 0.5 }),
        P('Varnish: ground layer', [0, 0.19, 0.1], [0.76, 0.02, 0.96], 'A mineral ground seals the wood before colour.', { k: 'box', c: '#e8d8b0', op: 0.25 }),
        P('Varnish: colour coat', [0, 0.21, 0.1], [0.76, 0.015, 0.96], 'Pigment in resin gives the golden depth.', { k: 'box', c: '#c87830', op: 0.3 }),
        P('Varnish: oil coat', [0, 0.225, 0.1], [0.76, 0.01, 0.96], 'The oil coat cracks into antique craquelure.', { k: 'box', c: '#f0d898', op: 0.2, rgh: 0.15 }),
        ...chain(4, (i) => P(`String tension marker ${i} (G→E)`, [0.045 - i * 0.03, 0.4, 0.28], [0.02, 0.1 + i * 0.02, 0.02], `Tension ${i}: about 40-55 N per string, ~220 N total downforce.`, { k: 'cone', r: 0.012, h: 0.08 + i * 0.02, rot: [Math.PI, 0, 0], c: '#e6a65d', op: 0.8 })),
        P('Soundpost patch', [0.14, 0.13, -0.18], [0.08, 0.01, 0.08], 'A thicker patch guards the top where the post stands.', { k: 'box', c: '#c89858' }),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS3)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 4: magnetosphere & atmosphere pause/ionosphere layers, Falcon Block 5
// reuse hardware + avionics, violin setup metrology, Giza boats & monitoring,
// EV crash/thermal/motor detail, frog & bee top-ups. Clearcoat/sheen hints
// give varnish, glass, chitin and tissue their own material character.
const PASS4 = {
  earth: {
    parts: {
      atmosphere: [
        P('Bow shock', [2.6, 0.3, 0], [0.6, 2.6, 2.6], 'The bow shock brakes the supersonic solar wind.', { k: 'tor', r: 1.5, t: 0.03, rot: [0, Math.PI / 2, 0.2], c: '#e8a05a', op: 0.35 }),
        P('Magnetosheath', [2.2, 0.2, 0], [0.5, 2.4, 2.4], 'Thermalised solar plasma piles up in the sheath.', { k: 'sph', r: 1.9, c: '#d88a61', op: 0.1 }),
        P('Magnetopause', [0, 0, 0], [4.3, 3.4, 3.4], 'The magnetopause balances solar wind against field pressure.', { k: 'sph', r: 2.1, c: '#8fb8d8', op: 0.14 }),
        P('Magnetotail', [-2.6, 0, 0], [2.6, 0.8, 0.8], 'The solar wind stretches field lines into a long tail.', { k: 'tube', pts: [[-1.4, 0, 0], [-2.8, 0.1, 0], [-4.0, 0, 0]], r: 0.28, c: '#7a6ad1', op: 0.25 }),
        P('Plasmasphere', [0, 0.2, 0], [3.0, 2.2, 3.0], 'Cold plasma co-rotates inside the plasmasphere.', { k: 'sph', r: 1.5, c: '#9ad0c0', op: 0.12 }),
        P('Inner radiation belt', [0, 0.1, 0], [2.4, 0.5, 2.4], 'The inner belt traps high-energy protons.', { k: 'tor', r: 1.15, t: 0.1, rot: [Math.PI / 2.4, 0, 0], c: '#d87171', op: 0.4 }),
        P('Outer radiation belt', [0, 0.1, 0], [3.4, 0.6, 3.4], 'The outer belt holds energetic electrons.', { k: 'tor', r: 1.65, t: 0.13, rot: [Math.PI / 2.4, 0, 0], c: '#e6a65d', op: 0.35 }),
        P('Polar cusp N', [0, 1.5, 0], [0.3, 0.6, 0.3], 'Cusps funnel solar wind straight into the dayside ionosphere.', { k: 'cone', r: 0.16, h: 0.6, rot: [0.3, 0, 0], c: '#7fc88a', op: 0.5 }),
        P('Polar cusp S', [0, -1.5, 0], [0.3, 0.6, 0.3], 'Cusp aurorae glow at midday latitudes.', { k: 'cone', r: 0.16, h: 0.6, rot: [Math.PI - 0.3, 0, 0], c: '#7fc88a', op: 0.5 }),
        P('Ring current', [0, 0, 0], [3.2, 0.3, 3.2], 'The ring current dims the field during storms.', { k: 'tor', r: 1.55, t: 0.05, rot: [Math.PI / 2, 0, 0], c: '#c0504d', op: 0.4 }),
        P('Substorm marker', [-1.8, 0.4, 0], [0.14, 0.14, 0.14], 'Substorms dump tail plasma into the auroral oval.', { k: 'sph', r: 0.07, c: '#7fc88a', op: 0.8 }),
        P('Tropopause', [0, 1.48, 0], [3.0, 0.03, 3.0], 'The tropopause caps weather at the cold point.', { k: 'tor', r: 1.48, t: 0.012, c: '#e8e2d0', op: 0.5 }),
        P('Stratopause', [0, 1.66, 0], [3.3, 0.03, 3.3], 'Ozone heating peaks at the stratopause.', { k: 'tor', r: 1.66, t: 0.012, c: '#e8e2d0', op: 0.5 }),
        P('Mesopause', [0, 1.84, 0], [3.7, 0.03, 3.7], 'The mesopause is the coldest place on Earth.', { k: 'tor', r: 1.84, t: 0.012, c: '#e8e2d0', op: 0.5 }),
        P('Turbopause', [0, 1.98, 0], [4.0, 0.03, 4.0], 'Above the turbopause gases settle by weight.', { k: 'tor', r: 1.98, t: 0.012, c: '#e8e2d0', op: 0.5 }),
        P('Ionosphere D layer', [0, 1.52, 0], [3.1, 0.08, 3.1], 'The D layer absorbs HF radio by day.', { k: 'sph', r: 1.54, c: '#ad9bd8', op: 0.12 }),
        P('Ionosphere E layer', [0, 1.62, 0], [3.3, 0.08, 3.3], 'Sporadic E mirrors VHF in patches.', { k: 'sph', r: 1.64, c: '#ad9bd8', op: 0.12 }),
        P('Ionosphere F layer', [0, 1.78, 0], [3.6, 0.1, 3.6], 'The F layer bends shortwave around the planet.', { k: 'sph', r: 1.78, c: '#ad9bd8', op: 0.12 }),
      ],
      cycles: [
        P('Spring marker', [1.2, 0.4, 1.1], [0.08, 0.12, 0.08], 'Springs discharge aquifers where land cuts the water table.', { k: 'cone', r: 0.04, h: 0.12, c: '#79b9d3', op: 0.8 }),
        P('Wetland marker', [-1.0, 0.55, 1.0], [0.3, 0.05, 0.25], 'Wetlands buffer floods and store carbon.', { k: 'box', c: '#5ca66b', op: 0.7 }),
        P('Permafrost shell', [0, -1.25, 0], [1.1, 0.1, 1.1], 'Permafrost locks away twice the carbon of the air.', { k: 'cap', r: 0.5, h: 0.08, rot: [Math.PI, 0, 0], c: '#d8e8f0', op: 0.6 }),
        P('Groundwater flow path 1', [0.6, -0.5, 1.0], [0.6, 0.05, 0.05], 'Groundwater moves metres per year, not per second.', { k: 'tube', pts: [[0.4, -0.3, 1.0], [0.8, -0.7, 0.95]], r: 0.015, c: '#79b9d3', op: 0.6 }),
        P('Groundwater flow path 2', [-0.6, -0.6, -1.0], [0.6, 0.05, 0.05], 'Deep flow can take millennia to resurface.', { k: 'tube', pts: [[-0.4, -0.4, -1.0], [-0.8, -0.8, -0.95]], r: 0.015, c: '#79b9d3', op: 0.6 }),
        P('Snowpack marker', [0.6, 1.25, 0.5], [0.2, 0.08, 0.2], 'Mountain snowpacks are natural reservoirs.', { k: 'cap', r: 0.1, h: 0.05, c: '#f0f4f8' }),
      ],
    },
  },
  rocket: {
    parts: {
      stage1: [
        P('Octaweb bolted ring', [0, 0.06, 0], [0.92, 0.1, 0.92], 'Block 5 bolts the octaweb instead of welding it.', { k: 'cyl', r: 0.46, h: 0.08, c: '#5a5a62', met: 0.7 }),
        P('Base heat shield', [0, -0.06, 0], [0.95, 0.06, 0.95], 'A reusable heat shield guards engines and plumbing.', { k: 'cyl', r: 0.47, h: 0.05, c: '#2a2a2a', rgh: 0.8 }),
        P('Thermal protection coat', [0, 1.0, 0], [0.98, 2.0, 0.98], 'Black TPS coats legs, raceway and interstage.', { k: 'cyl', r: 0.49, h: 2.0, c: '#1a1a1a', op: 0.18, rgh: 0.85 }),
        ...chain(2, (i) => P(`Long-life valve set ${i}`, [0.3 - i * 0.6, 0.2, 0.35 - i * 0.7], [0.1, 0.08, 0.1], `Valves ${i}: requalified valves cut refurb time between flights.`, { k: 'box', c: '#b06a5a', met: 0.6 })),
        ...chain(4, (i) => P(`Retractable leg hinge ${i}`, [0.4 * Math.cos(i * Math.PI / 2 + 0.785), 0.05, 0.4 * Math.sin(i * Math.PI / 2 + 0.785)], [0.08, 0.1, 0.08], `Hinge ${i}: legs retract for rapid recovery and shipping.`, { k: 'cyl', r: 0.04, h: 0.1, rot: [0, -i * Math.PI / 2, Math.PI / 2], c: '#8a8a92', met: 0.7 })),
        ...chain(4, (i) => P(`Self-levelling leg foot ${i}`, [0.46 * Math.cos(i * Math.PI / 2 + 0.785), -0.5, 0.46 * Math.sin(i * Math.PI / 2 + 0.785)], [0.12, 0.06, 0.12], `Foot ${i}: self-levelling feet meet the Octograbber in rough seas.`, { k: 'cyl', r: 0.06, h: 0.05, c: '#3a3a3a', rgh: 0.8 })),
        ...chain(4, (i) => P(`Grid fin relief valve ${i}`, [0.4 * Math.cos(i * Math.PI / 2), 1.85, 0.4 * Math.sin(i * Math.PI / 2)], [0.04, 0.06, 0.04], `Relief ${i}: hydraulic relief valves stop fin stalls on descent.`, { k: 'cyl', r: 0.02, h: 0.06, c: '#c8b060', met: 0.8 })),
      ],
      stage2: [
        ...chain(3, (i) => P(`Flight computer ${i}`, [0.2 - i * 0.2, 3.68, 0.15], [0.12, 0.06, 0.16], `Computer ${i}: triple-redundant computers vote every decision.`, { k: 'box', c: '#2a4a3a' })),
        ...chain(2, (i) => P(`Flight battery ${i}`, [-0.2 + i * 0.4, 3.68, -0.2], [0.14, 0.06, 0.1], `Battery ${i}: Li-ion packs fly avionics through coast.`, { k: 'box', c: '#3a3a4a' })),
        ...chain(2, (i) => P(`Inertial measurement unit ${i}`, [0.15 - i * 0.3, 3.66, 0.3], [0.08, 0.05, 0.08], `IMU ${i}: laser gyros hold attitude without GPS.`, { k: 'box', c: '#4a3a5a' })),
        P('GPS antenna', [0, 3.74, 0.25], [0.08, 0.03, 0.08], 'GPS fixes position for precise separation states.', { k: 'cyl', r: 0.04, h: 0.02, c: '#e8e2d0' }),
        P('Telemetry antenna', [0.3, 3.7, -0.2], [0.1, 0.06, 0.04], 'S-band telemetry streams health data downrange.', { k: 'box', c: '#c8c8d0', met: 0.6 }),
        P('Range safety receiver', [-0.3, 3.7, -0.2], [0.08, 0.06, 0.06], 'The receiver arms flight-termination on command.', { k: 'box', c: '#c0504d' }),
        ...chain(2, (i) => P(`Stage camera ${i}`, [0.44, 2.3 + i * 1.2, 0.1 - i * 0.2], [0.05, 0.05, 0.05], `Camera ${i}: onboard cameras film separation and landing.`, { k: 'box', c: '#1a1a22', rgh: 0.3 })),
      ],
      engines: [
        P('LOX turbopump (compound)', [0.2, 0.05, 0.2], [0.16, 0.2, 0.16], 'One shaft spins LOX and RP-1 impellers.', { shapes: [{ k: 'cyl', pos: [0, 0.06, 0], r: 0.06, h: 0.1, c: '#b0b8c0', met: 0.8 }, { k: 'cyl', pos: [0, -0.05, 0], r: 0.05, h: 0.08, c: '#a8c8d8', met: 0.8 }, { k: 'cyl', pos: [0.07, 0, 0], r: 0.03, h: 0.12, rot: [0, 0, Math.PI / 2], c: '#8a8a92', met: 0.8 }] }),
        P('Gas generator (compound)', [-0.2, 0.08, -0.2], [0.12, 0.14, 0.12], 'The gas generator burns fuel-rich to drive the turbine.', { shapes: [{ k: 'sph', pos: [0, 0, 0], r: 0.05, c: '#8a6a5a', met: 0.6 }, { k: 'cyl', pos: [0.06, 0.03, 0], r: 0.025, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#6a6a72', met: 0.7 }] }),
        ...chain(2, (i) => P(`TEA-TEB igniter ${i}`, [0.1 - i * 0.2, -0.05, 0.1 - i * 0.2], [0.05, 0.06, 0.05], `Igniter ${i}: pyrophoric TEA-TEB lights on contact, dual redundant.`, { k: 'cyl', r: 0.025, h: 0.06, c: '#d8b25c' })),
        ...chain(2, (i) => P(`Long-coast helium bottle ${i}`, [0.25 - i * 0.5, 3.15, 0.25], [0.12, 0.12, 0.12], `He ${i}: mission-extension kits add bottles for long coasts.`, { k: 'sph', r: 0.06, c: '#c8c8d0', met: 0.5 })),
        ...chain(2, (i) => P(`Long-coast battery ${i}`, [0.2 - i * 0.4, 3.55, 0.3], [0.12, 0.05, 0.08], `Battery ${i}: extra packs keep avionics alive on extended coasts.`, { k: 'box', c: '#3a3a4a' })),
      ],
    },
  },
  violin: {
    parts: {
      acoustics: [
        P('Projection marker (27 mm)', [0, 0.34, 0.28], [0.02, 0.3, 0.02], 'Projection: fingerboard line extended meets the bridge at 27 mm.', { k: 'cyl', r: 0.006, h: 0.3, rot: [0.5, 0, 0], c: '#e6a65d', op: 0.8 }),
        P('String height E (3.5 mm)', [-0.045, 0.35, 0.28], [0.01, 0.02, 0.01], 'E string sits 3.5 mm above the fingerboard end.', { k: 'cyl', r: 0.005, h: 0.014, c: '#9ad0c0' }),
        P('String height G (5.5 mm)', [0.045, 0.36, 0.28], [0.01, 0.024, 0.01], 'G needs 5.5 mm — it swings the widest.', { k: 'cyl', r: 0.005, h: 0.022, c: '#9ad0c0' }),
        P('Fingerboard radius marker (42 mm)', [0, 0.29, -0.6], [0.12, 0.02, 0.12], 'The board is scraped to a 42 mm arc.', { k: 'tor', r: 0.06, t: 0.006, rot: [Math.PI / 2, 0, 0], c: '#e6a65d', op: 0.8 }),
        P('Bridge curve radius (41.5 mm)', [0, 0.37, 0.28], [0.12, 0.02, 0.12], 'Bridge curvature 41.5 mm lets each string bow cleanly.', { k: 'tor', r: 0.06, t: 0.006, rot: [Math.PI / 2, 0, 0], c: '#d88ab0', op: 0.8 }),
        ...chain(3, (i) => P(`Bridge spacing marker ${i}`, [-0.011 + i * 0.011, 0.365, 0.28], [0.008, 0.01, 0.008], `Spacing ${i}: 11⅓ mm between strings at the bridge.`, { k: 'sph', r: 0.004, c: '#e8e2d0' })),
        ...chain(4, (i) => P(`Nut slot ${i}`, [0.045 - i * 0.03, 0.285, -0.34], [0.008, 0.008, 0.02], `Slot ${i}: nut grooves set 0.6-0.8 mm action at the first fret.`, { k: 'box', c: '#3a3a3a' })),
        P('Afterlength marker (54 mm)', [0, 0.28, 0.86], [0.02, 0.02, 0.1], 'Afterlength behind the bridge tunes to 1/6 of the string.', { k: 'cyl', r: 0.006, h: 0.1, rot: [Math.PI / 2, 0, 0], c: '#e6a65d', op: 0.8 }),
        P('Soundpost set position', [0.14, 0.06, -0.2], [0.04, 0.14, 0.04], 'Set one half-thickness behind the bridge foot — then argued over forever.', { k: 'cyl', r: 0.015, h: 0.14, c: '#e0c08a', op: 0.7 }),
        P('Mensur marker (325 mm)', [0, 0.3, -0.05], [0.02, 0.02, 0.66], 'Nut to bridge: 325 mm mensur fixes the stopping geometry.', { k: 'cyl', r: 0.005, h: 0.66, rot: [Math.PI / 2, 0, 0], c: '#8fb8d8', op: 0.7 }),
        P('Tap tone T1 marker', [0.2, 0.22, -0.35], [0.06, 0.06, 0.06], 'Makers tap free plates and tune mode 1 by ear.', { k: 'sph', r: 0.03, c: '#d8b25c', op: 0.8 }),
        P('Wolf tone marker', [0, 0.3, 0.45], [0.06, 0.06, 0.06], 'The wolf howls where a body mode meets a stopped note.', { k: 'sph', r: 0.03, c: '#c0504d', op: 0.8 }),
        P('Edge fluting', [0, 0.18, 0.1], [0.8, 0.02, 1.0], 'Fluting thins the edge visually and acoustically.', { k: 'tor', r: 0.44, t: 0.01, rot: [Math.PI / 2, 0, 0], c: '#b07840', cc: 0.4 }),
        ...chain(4, (i) => P(`Corner recurve ${i}`, [(i < 2 ? 0.3 : -0.3), 0.17, (i % 2 ? 0.32 : -0.12)], [0.06, 0.02, 0.06], `Recurve ${i}: the C-bout corners define the outline mould.`, { k: 'sph', r: 0.03, c: '#a06a3a', cc: 0.4 })),
        ...chain(3, (i) => P(`Craquelure marker ${i}`, [-0.2 + i * 0.2, 0.23, -0.2 + i * 0.15], [0.05, 0.01, 0.05], `Craquelure ${i}: oil varnish cracks into the antique map.`, { k: 'box', c: '#8a5a2a', op: 0.5, cc: 0.6 })),
      ],
      bow: [
        P('Hair knot & plug', [0.9, 0.29, -0.44], [0.04, 0.03, 0.04], 'The wedge plug locks 150 hairs in the frog.', { k: 'box', c: '#f4eeda' }),
        P('Camber marker (inward curve)', [0.93, 0.33, 0.2], [0.02, 0.06, 0.02], 'Heat-bent camber keeps tension even through the stroke.', { k: 'cyl', r: 0.006, h: 0.06, rot: [0, 0, 0.3], c: '#e6a65d', op: 0.8 }),
        P('Balance point marker', [0.9, 0.34, -0.1], [0.03, 0.03, 0.03], 'Balance sits about a quarter from the frog.', { k: 'sph', r: 0.014, c: '#9ad0c0', op: 0.9 }),
        P('Tip plate (ivory/mammoth)', [0.9, 0.375, 0.985], [0.05, 0.012, 0.06], 'The plate shields the head from hair wear.', { k: 'box', c: '#f0ead0', rgh: 0.25 }),
      ],
    },
  },
  giza: {
    parts: {
      precinct: [
        P('Khufu solar boat (compound)', [0.9, -0.05, 2.1], [1.2, 0.25, 0.4], 'The cedar barque: 43 m of lashed hull, rebuilt from 1,224 pieces.', { shapes: [{ k: 'tube', pts: [[-0.6, 0, 0], [0, -0.06, 0], [0.6, 0, 0]], r: 0.09, c: '#8a6a3a' }, { k: 'box', pos: [0, 0.1, 0], size: [0.4, 0.12, 0.16], c: '#a08050' }, { k: 'cyl', pos: [-0.3, 0.12, 0.12], r: 0.012, h: 0.3, rot: [0.6, 0, 0.4], c: '#6a5030' }, { k: 'cyl', pos: [0.3, 0.12, -0.12], r: 0.012, h: 0.3, rot: [-0.6, 0, -0.4], c: '#6a5030' }] }),
        ...chain(3, (i) => P(`Boat pit cover stone ${i}`, [0.6 + i * 0.3, 0.02, 1.85], [0.3, 0.08, 0.5], `Cover ${i}: limestone lids sealed the boat pits for 4,500 years.`, { k: 'box', c: '#c8b088', rgh: 0.9 })),
        P('Solar Boat Museum marker', [1.5, 0.1, 2.3], [0.3, 0.2, 0.3], 'The museum housed the reconstructed ship until 2021.', { k: 'box', c: '#d8d2c0' }),
        P('UNESCO World Heritage marker', [-1.9, 0.15, 1.9], [0.12, 0.18, 0.12], 'Memphite necropolis: inscribed 1979.', { k: 'cyl', r: 0.06, h: 0.18, c: '#8fb8d8' }),
        P('Visitor centre marker', [-2.1, 0.1, 1.5], [0.3, 0.16, 0.24], 'Modern management buffers the plateau.', { k: 'box', c: '#c8c0b0' }),
        ...chain(2, (i) => P(`Tiltmeter ${i}`, [-1.5 + i * 3.0, 0.35, -1.5 + i * 0.4], [0.06, 0.06, 0.06], `Tilt ${i}: tiltmeters watch for micro-movement of the core.`, { k: 'box', c: '#5ca66b' })),
        ...chain(2, (i) => P(`GPS monitoring point ${i}`, [1.6 - i * 3.2, 0.05, 1.6 - i * 3.2], [0.08, 0.1, 0.08], `GPS ${i}: geodetic points track millimetre shifts yearly.`, { k: 'cyl', r: 0.04, h: 0.1, c: '#8fb8d8' })),
        ...chain(2, (i) => P(`Crack gauge ${i}`, [0.8 - i * 1.6, 0.9 + i * 0.4, -1.2 + i * 0.3], [0.1, 0.03, 0.03], `Gauge ${i}: tell-tales span monitored fissures.`, { k: 'box', c: '#e8e2d0' })),
      ],
      chambers: [
        ...chain(3, (i) => P(`Queen’s Chamber floor slab ${i}`, [0.15 - i * 0.12, 0.82, 0], [0.14, 0.04, 0.4], `Slab ${i}: the chamber floor floats above a rubble raft.`, { k: 'box', c: '#c8b088' })),
        ...chain(4, (i) => P(`King’s Chamber wall course ${i}`, [0.5, 0.95 + i * 0.14, 0], [0.74, 0.12, 0.46], `Course ${i}: five granite courses box the burial chamber.`, { k: 'box', c: '#a05a4a', rgh: 0.7 })),
        P('Subterranean passage extension', [0.1, -0.4, 0], [0.8, 0.1, 0.1], 'A dead-end tunnel runs south under the pit.', { k: 'tube', pts: [[0.1, -0.4, 0], [0.6, -0.45, 0.1]], r: 0.045, c: '#7fa8c9', op: 0.8 }),
      ],
      casing: [
        ...chain(4, (i) => P(`Corner arris ${i}`, [(i === 0 ? -1.6 : i === 1 ? 1.6 : i === 2 ? 1.6 : -1.6), 0.5 + (i % 2) * 0.6, (i < 2 ? -1.6 : 1.6)], [0.08, 0.9, 0.08], `Arris ${i}: the four edges held the survey true to the apex.`, { k: 'cyl', r: 0.03, h: 0.9, rot: [0.62, 0, i % 2 ? 0.785 : -0.785], c: '#efe6cf', rgh: 0.25 })),
        ...chain(2, (i) => P(`Terrace levelling layer ${i}`, [-1.4 + i * 2.8, -0.06, 1.4 - i * 2.8], [0.8, 0.06, 0.8], `Layer ${i}: gypsum mortar beds levelled the platform.`, { k: 'box', c: '#e0d8c0' })),
      ],
    },
  },
  vehicle: {
    parts: {
      energy: [
        P('Battery crash tunnel L', [0, 0.3, 0.62], [2.4, 0.3, 0.08], 'Side tunnels keep side impacts off the modules.', { k: 'box', c: '#7a8a9a', met: 0.6 }),
        P('Battery crash tunnel R', [0, 0.3, -0.62], [2.4, 0.3, 0.08], 'Extruded aluminium absorbs the crush.', { k: 'box', c: '#7a8a9a', met: 0.6 }),
        ...chain(4, (i) => P(`Pack crush rib ${i}`, [-0.9 + i * 0.6, 0.28, 0.72], [0.4, 0.24, 0.05], `Rib ${i}: sacrificial ribs fold before the cells do.`, { k: 'box', c: '#5a6a7a', met: 0.5 })),
        ...chain(4, (i) => P(`Thermal barrier ${i}`, [-0.9 + i * 0.6, 0.28, -0.72], [0.4, 0.24, 0.03], `Barrier ${i}: mica barriers slow cell-to-cell propagation.`, { k: 'box', c: '#d8d2c0', rgh: 0.9 })),
        P('Vent path tube', [0, 0.14, 0], [2.2, 0.08, 0.08], 'A dedicated path routes vent gas away from passengers.', { k: 'tube', pts: [[-1.1, 0.14, 0], [1.1, 0.14, 0]], r: 0.04, c: '#8a8a92', op: 0.6 }),
        ...chain(2, (i) => P(`Runaway sensor ${i}`, [-0.6 + i * 1.2, 0.44, 0.5], [0.08, 0.04, 0.08], `Sensor ${i}: pressure sensors detect vent gas in milliseconds.`, { k: 'box', c: '#c0504d' })),
      ],
      powertrain: [
        ...chain(4, (i) => P(`Stator winding ${i}`, [1.42 + i * 0.05, 0.5, 0.12 - i * 0.08], [0.04, 0.3, 0.04], `Winding ${i}: hairpin windings pack more copper in the slots.`, { k: 'cyl', r: 0.018, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#b06a3a', met: 0.7 })),
        ...chain(4, (i) => P(`Rotor magnet ${i}`, [1.5, 0.5, 0.09 - i * 0.06], [0.24, 0.05, 0.03], `Magnet ${i}: V-set magnets boost torque density.`, { k: 'box', rot: [0, 0, i % 2 ? 0.4 : -0.4], c: '#5a5a62', met: 0.5 })),
        ...chain(2, (i) => P(`Oil spray nozzle ${i}`, [1.5, 0.72, 0.1 - i * 0.2], [0.03, 0.06, 0.03], `Nozzle ${i}: oil spray cools the stator ends at full power.`, { k: 'cone', r: 0.015, h: 0.05, rot: [Math.PI, 0, 0], c: '#d8b25c' })),
      ],
      chassis: [
        ...chain(4, (i) => P(`Control arm bushing ${i}`, [(i < 2 ? 1.5 : -1.5), 0.26, (i % 2 ? 0.62 : -0.62)], [0.08, 0.08, 0.08], `Bushing ${i}: rubber-metal bushings tune compliance and NVH.`, { k: 'cyl', r: 0.04, h: 0.07, rot: [Math.PI / 2, 0, 0], c: '#2a2a2a', rgh: 0.8 })),
        ...chain(2, (i) => P(`Bump stop ${i}`, [(i ? -1.7 : 1.7), 0.95, 0.7], [0.08, 0.1, 0.08], `Bump stop ${i}: micro-cellular stops soften full compression.`, { k: 'cap', r: 0.04, h: 0.06, c: '#e8a05a', sheen: 0.4 })),
      ],
      exterior: [
        ...chain(4, (i) => P(`Aero wheel cover ${i}`, [(i < 2 ? 1.85 : -1.85), 0.42, (i % 2 ? 1.02 : -1.02)], [0.36, 0.36, 0.03], `Cover ${i}: flat covers recover range by calming wheel wake.`, { k: 'cyl', r: 0.18, h: 0.02, rot: [Math.PI / 2, 0, 0], c: '#b0b8c0', met: 0.4, rgh: 0.35 })),
        P('Active grille shutter', [2.16, 0.6, 0], [0.04, 0.3, 1.0], 'Shutters close at speed to cut drag.', { k: 'box', c: '#3a3a42' }),
        P('Underbody tray', [0, 0.04, 0], [3.8, 0.03, 1.5], 'A flat tray makes the car one clean aero surface.', { k: 'box', c: '#2a2a32', rgh: 0.7 }),
      ],
      electronics: [
        P('V2L outlet', [-1.62, 0.8, 0.7], [0.1, 0.08, 0.08], 'Vehicle-to-load powers tools and campsites.', { k: 'box', c: '#3a5a4a' }),
        P('Charge indicator LED', [-1.62, 1.0, 0.85], [0.06, 0.02, 0.06], 'The light ring narrates state of charge.', { k: 'tor', r: 0.03, t: 0.008, rot: [Math.PI / 2, 0, 0], c: '#5ca66b', op: 0.9 }),
        P('Plug lock pin', [-1.6, 0.9, 0.8], [0.04, 0.04, 0.04], 'The pin stops drive-off with a plugged cable.', { k: 'cyl', r: 0.02, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#c8c8d0', met: 0.8 }),
      ],
      thermal: [
        P('Coolant pump (electric)', [1.6, 0.5, -0.7], [0.12, 0.12, 0.12], 'Electric pumps flow coolant even when parked.', { k: 'cyl', r: 0.06, h: 0.1, c: '#5a6a7a', met: 0.5 }),
      ],
    },
  },
  frog: {
    parts: {
      external: [
        ...chain(2, (i) => P(`Vomerine tooth row ${i}`, [-1.02, -0.06, 0.06 - i * 0.12], [0.1, 0.02, 0.03], `Row ${i}: vomerine teeth grip prey against the palate.`, { k: 'box', c: '#e8e2d0' })),
        ...chain(2, (i) => P(`Maxillary tooth row ${i}`, [-1.1 + i * 0.15, -0.04, 0.3 - i * 0.6], [0.24, 0.02, 0.03], `Row ${i}: maxillary teeth line the upper jaw rim.`, { k: 'box', c: '#e8e2d0' })),
        ...chain(4, (i) => P(`Cutaneous vein ${i}`, [-0.6 + i * 0.4, 0.2, (i % 2 ? 0.48 : -0.48)], [0.3, 0.015, 0.015], `Vein ${i}: skin veins return oxygen picked up through the skin.`, { k: 'tube', pts: [[-0.7 + i * 0.4, 0.2, (i % 2 ? 0.48 : -0.48)], [-0.45 + i * 0.4, 0.22, (i % 2 ? 0.46 : -0.46)]], r: 0.008, c: '#7a4a6a' })),
        ...chain(2, (i) => P(`Buccal pump marker ${i}`, [-0.95, -0.14, 0.1 - i * 0.2], [0.08, 0.05, 0.08], `Pump ${i}: frogs swallow air — the throat is the bellows.`, { k: 'cone', r: 0.04, h: 0.05, rot: [Math.PI, 0, 0], c: '#d88a8a', op: 0.8 })),
      ],
      digestion: [
        P('Lung sac L', [-0.15, 0.1, 0.2], [0.4, 0.12, 0.12], 'Simple sac lungs — skin does half the breathing.', { k: 'cap', r: 0.06, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#e8a8a8', op: 0.6, sheen: 0.3 }),
        P('Lung sac R', [-0.15, 0.1, -0.2], [0.4, 0.12, 0.12], 'The right lung is usually the larger.', { k: 'cap', r: 0.06, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#e8a8a8', op: 0.6, sheen: 0.3 }),
        P('Bile marker', [0.05, 0.02, 0.12], [0.04, 0.04, 0.04], 'Bile from the gall bladder emulsifies fats.', { k: 'sph', r: 0.02, c: '#7fa850' }),
        P('Pancreas marker', [0.1, 0.0, 0.1], [0.1, 0.04, 0.04], 'The pancreas hides in the mesentery fold.', { k: 'cap', r: 0.02, h: 0.08, rot: [0, 0, Math.PI / 2], c: '#e8d8a8' }),
      ],
    },
  },
  bee: {
    parts: {
      thorax: [
        ...chain(2, (i) => P(`Pollen load (corbicula) ${i}`, [-0.35 + i * 0.2, -0.14, 0.2 - i * 0.4], [0.08, 0.06, 0.05], `Load ${i}: moistened pollen packs into the basket fringe.`, { k: 'cap', r: 0.035, h: 0.04, rot: [0.4, 0, 0], c: '#f0d060', rgh: 0.9 })),
        P('Propolis layer', [-0.9, -0.02, 0.14], [0.2, 0.02, 0.1], 'Propolis seals cracks and sterilises the nest.', { k: 'box', c: '#8a5a2a', op: 0.7, cc: 0.3 }),
        P('Water sac (crop)', [-0.8, 0.02, 0], [0.1, 0.1, 0.1], 'Water carriers store loads in the crop.', { k: 'sph', r: 0.05, c: '#a8d8e8', op: 0.6 }),
      ],
      abdomen: [
        ...chain(2, (i) => P(`Waggle dance marker ${i}`, [0.3 + i * 0.2, 0.2, 0.1 - i * 0.2], [0.06, 0.05, 0.06], `Dance ${i}: angle from vertical encodes the sun bearing.`, { k: 'cone', r: 0.03, h: 0.05, rot: [0, 0, 0.6 + i * 1.2], c: '#e6a65d', op: 0.85 })),
        ...chain(2, (i) => P(`Fanning bee marker ${i}`, [0.7 + i * 0.1, 0.16, -0.1 + i * 0.2], [0.05, 0.04, 0.05], `Fan ${i}: fanning bees drive hive ventilation and ripening.`, { k: 'cone', r: 0.025, h: 0.04, rot: [0.8, 0, 0], c: '#8fb8d8', op: 0.85 })),
        ...chain(2, (i) => P(`Guard bee marker ${i}`, [-1.15 + i * 0.06, -0.05, 0.12 - i * 0.24], [0.05, 0.04, 0.05], `Guard ${i}: guards smell out strangers at the entrance.`, { k: 'cone', r: 0.025, h: 0.04, rot: [0, 0, -1.2], c: '#c0504d', op: 0.85 })),
        ...chain(2, (i) => P(`Royal jelly marker ${i}`, [0.1 + i * 0.15, -0.1, 0.14 - i * 0.28], [0.04, 0.03, 0.04], `Jelly ${i}: nurse glands feed queens their exclusive diet.`, { k: 'sph', r: 0.02, c: '#f4eeda', sheen: 0.5 })),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS4)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}
const PASS5 = {
  bee: {
    newSystems: [{ id: 'integument', label: 'Integument (cuticle layers)', color: '#c89838' }],
    parts: {
      integument: [
        P('Epicuticle (wax + cuticulin)', [0, 0.14, 0], [2.2, 0.02, 0.5], 'The wax epicuticle waterproofs the whole insect.', { k: 'cap', r: 0.2, h: 1.9, rot: [0, 0, Math.PI / 2], c: '#e8c878', op: 0.4, cc: 0.5 }),
        P('Exocuticle (sclerotised)', [0, 0.12, 0], [2.1, 0.04, 0.46], 'Sclerotin-crosslinked protein makes the exocuticle hard.', { k: 'cap', r: 0.19, h: 1.8, rot: [0, 0, Math.PI / 2], c: '#c89838', op: 0.5 }),
        P('Endocuticle (lamellate)', [0, 0.09, 0], [2.0, 0.05, 0.42], 'Bouligand lamellae give toughness without brittleness.', { k: 'cap', r: 0.18, h: 1.7, rot: [0, 0, Math.PI / 2], c: '#d8b25c', op: 0.5 }),
        P('Epidermal cell layer', [0, 0.05, 0], [1.9, 0.04, 0.38], 'Living epidermis secretes every layer above it.', { k: 'cap', r: 0.17, h: 1.6, rot: [0, 0, Math.PI / 2], c: '#e8d8a8', op: 0.6, sheen: 0.3 }),
        P('Basement membrane', [0, 0.02, 0], [1.9, 0.02, 0.36], 'The basement membrane anchors epidermis to haemocoel.', { k: 'cap', r: 0.165, h: 1.6, rot: [0, 0, Math.PI / 2], c: '#9ad0c0', op: 0.5 }),
        ...chain(6, (i) => P(`Pore canal ${i}`, [-0.8 + i * 0.32, 0.12, 0.16], [0.02, 0.1, 0.02], `Canal ${i}: pore canals thread wax to the surface.`, { k: 'cyl', r: 0.006, h: 0.1, c: '#f0e3a0' })),
        ...chain(4, (i) => P(`Arthrodial membrane ${i}`, [-0.62 + i * 0.42, 0.02, 0.14], [0.06, 0.06, 0.2], `Joint ${i}: soft arthrodial membrane flexes between sclerites.`, { k: 'cap', r: 0.03, h: 0.16, rot: [Math.PI / 2, 0, 0], c: '#e8d8b0', op: 0.7, sheen: 0.4 })),
        ...chain(3, (i) => P(`Dermal gland ${i}`, [-0.4 + i * 0.4, 0.04, -0.16], [0.05, 0.06, 0.05], `Gland ${i}: dermal glands add pheromones to the cuticle.`, { k: 'sph', r: 0.028, c: '#d8a24a', sheen: 0.4 })),
      ],
    },
  },
  rocket: {
    parts: {
      stage1: [
        P('Propellant management diaphragm (LOX)', [0, 1.2, 0], [0.9, 0.04, 0.9], 'A flexible diaphragm sloshes LOX toward the outlet.', { k: 'cyl', r: 0.44, h: 0.03, c: '#9ad0c0', op: 0.5, sheen: 0.5 }),
        P('Propellant management diaphragm (RP-1)', [0, 0.7, 0], [0.9, 0.04, 0.9], 'Diaphragms keep ullage gas from entering the feed lines.', { k: 'cyl', r: 0.44, h: 0.03, c: '#9ad0c0', op: 0.5, sheen: 0.5 }),
      ],
      stage2: [
        P('Stage 2 PMD diaphragm', [0, 3.05, 0], [0.86, 0.04, 0.86], 'Second-stage diaphragm settles propellant for restarts.', { k: 'cyl', r: 0.42, h: 0.03, c: '#9ad0c0', op: 0.5, sheen: 0.5 }),
        P('Hydraulic accumulator', [0.32, 0.12, -0.3], [0.08, 0.14, 0.08], 'The accumulator smooths TVC hydraulic pulses.', { k: 'cap', r: 0.04, h: 0.1, c: '#8a8a92', met: 0.7 }),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS5)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 6 — membrane-class machinery (research-driven; docs/KEV_ATLAS_EXPANSION.md).
// The cell world still showed membranes as smooth skins. This pass adds the
// protein machinery embedded in every membrane class: plasma-membrane pits,
// rafts, pumps and junctions; the full nuclear pore complex and envelope
// bilayers; vesicle coats, ESCRT spirals, SNAREs and contact sites; and a
// mitochondrial membrane inset (TOM/TIM/VDAC/MICOS/ATP-synthase dimers).
// Frog skin gains its glandular dermal stack; plants gain the wall-plasmodesma
// continuum. Sources: Alberts MBoC membrane-transport chapters; NCBI NPC
// reviews; EMBO ESCRT/MICOS papers; amphibian histology (mucous vs granular
// glands, flask cells); plant anatomy (middle lamella, Casparian strip).
const PASS6 = {
  cell: {
    parts: {
      membrane: [
        ...chain(4, (i) => P(`Clathrin-coated pit ${i}`, [Math.cos(i * Math.PI / 2) * 2.05, 0.2, Math.sin(i * Math.PI / 2) * 2.05], [0.18, 0.1, 0.18], `Pit ${i}: a clathrin triskelion cage dents the membrane to swallow receptor cargo.`, { k: 'cap', r: 0.08, h: 0.06, rot: [Math.PI, 0, 0], c: '#e6cf8f', sheen: 0.4 })),
        ...chain(4, (i) => P(`Caveola ${i}`, [Math.cos(i * Math.PI / 2 + 0.7) * 2.02, 1.35, Math.sin(i * Math.PI / 2 + 0.7) * 2.02], [0.12, 0.12, 0.12], `Caveola ${i}: flask-shaped caveolin invaginations that buffer membrane tension.`, { k: 'sph', r: 0.06, c: '#9cc3de', op: 0.8, cc: 0.4 })),
        ...chain(6, (i) => P(`Lipid raft ${i}`, [Math.cos(i * Math.PI / 3) * 1.78, 2.2, Math.sin(i * Math.PI / 3) * 1.78], [0.24, 0.03, 0.24], `Raft ${i}: a cholesterol-sphingolipid platform that corrals signalling proteins.`, { k: 'cyl', r: 0.11, h: 0.02, c: '#f0e3a0', op: 0.6, sheen: 0.5 })),
        ...chain(3, (i) => P(`Aquaporin tetramer ${i}`, [Math.cos(i * 2.1 + 0.4) * 2.16, 1.05, Math.sin(i * 2.1 + 0.4) * 2.16], [0.1, 0.14, 0.1], `Aquaporin ${i}: four barrels pass billions of water molecules a second, rejecting protons.`, { k: 'cyl', r: 0.05, h: 0.13, c: '#79b9d3', op: 0.85, rgh: 0.2 })),
        ...chain(3, (i) => P(`Sodium-potassium pump ${i}`, [Math.cos(i * 2.1 + 1.5) * 2.1, 0.5, Math.sin(i * 2.1 + 1.5) * 2.1], [0.12, 0.18, 0.12], `Pump ${i}: the Na/K-ATPase trades 3 sodium out for 2 potassium in, spending a third of a resting cell\u2019s ATP.`, { k: 'cap', r: 0.06, h: 0.12, c: '#c98274', met: 0.2 })),
        ...chain(6, (i) => P(`Tight-junction strand ${i}`, [Math.cos(i * Math.PI / 3 + 0.3) * 1.4, 2.62, Math.sin(i * Math.PI / 3 + 0.3) * 1.4], [0.3, 0.04, 0.06], `Strand ${i}: claudin seams zipper neighbours so nothing leaks between cells.`, { k: 'box', rot: [0, i * Math.PI / 3, 0], c: '#8fb8d8', sheen: 0.4 })),
        ...chain(4, (i) => P(`Gap-junction connexon ${i}`, [Math.cos(i * Math.PI / 2 + 0.9) * 2.0, 1.8, Math.sin(i * Math.PI / 2 + 0.9) * 2.0], [0.12, 0.1, 0.12], `Connexon ${i}: six connexins form a channel letting ions and signals pass cell to cell.`, { k: 'tor', r: 0.05, t: 0.015, rot: [Math.PI / 2, 0, 0], c: '#b98ad1' })),
        ...chain(2, (i) => P(`Desmosome ${i}`, [(i ? 1 : -1) * 1.9, 0.1, (i ? -1 : 1) * 0.7], [0.16, 0.12, 0.16], `Desmosome ${i}: cadherin rivets link to keratin cables, the spot-weld of tissue.`, { k: 'cyl', r: 0.07, h: 0.08, c: '#d8b25c', met: 0.15 })),
        ...chain(4, (i) => P(`Focal adhesion (integrin cluster) ${i}`, [Math.cos(i * Math.PI / 2 + 0.5) * 1.78, -0.4, Math.sin(i * Math.PI / 2 + 0.5) * 1.78], [0.2, 0.06, 0.14], `Adhesion ${i}: integrins clamp onto the matrix outside and actin cables inside.`, { k: 'box', rot: [0, i * Math.PI / 2, 0], c: '#8a8a92', met: 0.3, rgh: 0.4 })),
        P('BAR-domain curvature sensor', [1.55, 0.65, 1.5], [0.14, 0.05, 0.08], 'Banana-shaped BAR proteins sense and sculpt membrane curvature.', { k: 'cap', r: 0.05, h: 0.1, rot: [0, 0, Math.PI / 2], c: '#6ab09a', sheen: 0.4 }),
        P('Flippase (lipid scrambler)', [-1.62, 0.75, -1.45], [0.1, 0.16, 0.1], 'Flippases haul specific lipids to the inner leaflet, keeping the bilayer asymmetric.', { k: 'cyl', r: 0.045, h: 0.15, c: '#4a9a86', met: 0.2 }),
      ],
      nucleus: [
        P('Outer nuclear membrane', [0, 0.9, 0], [1.62, 1.62, 1.62], 'The outer membrane is studded with ribosomes and continuous with rough ER.', { k: 'sph', r: 0.81, c: '#9a8ae8', op: 0.14 }),
        P('Inner nuclear membrane', [0, 0.9, 0], [1.5, 1.5, 1.5], 'The inner membrane carries lamina receptors that anchor chromatin.', { k: 'sph', r: 0.755, c: '#7a6ad1', op: 0.16 }),
        P('Perinuclear space', [0, 0.9, 0], [1.56, 1.56, 1.56], 'The 20-40 nm perinuclear space links directly to the ER lumen.', { k: 'sph', r: 0.78, c: '#b8a8e8', op: 0.07 }),
        ...chain(8, (i) => P(`Nuclear pore spoke ${i}`, [Math.cos(i * Math.PI / 4) * 0.6, 1.35, Math.sin(i * Math.PI / 4) * 0.6], [0.06, 0.1, 0.06], `Spoke ${i}: eightfold symmetric spokes build the 120 MDa pore scaffold.`, { k: 'cyl', r: 0.028, h: 0.09, c: '#e6cf8f', met: 0.2 })),
        P('Cytoplasmic ring', [0, 1.45, 0], [0.9, 0.05, 0.9], 'The cytoplasmic ring crowns the pore where export complexes disassemble.', { k: 'tor', r: 0.42, t: 0.025, rot: [Math.PI / 2, 0, 0], c: '#d8b25c', met: 0.25 }),
        P('FG-nucleoporin mesh', [0, 1.42, 0], [0.8, 0.03, 0.8], 'Disordered FG repeats form a selective gel: small molecules diffuse, cargo needs transport receptors.', { k: 'tor', r: 0.38, t: 0.012, rot: [Math.PI / 2, 0, 0], c: '#f0e3a0', op: 0.55 }),
        P('Nuclear basket', [0, 1.22, 0], [0.3, 0.14, 0.3], 'Eight filaments splay into the nucleoplasm, the last checkpoint of mRNA export.', { k: 'cone', r: 0.14, h: 0.14, rot: [Math.PI, 0, 0], c: '#b98ad1', op: 0.8 }),
        P('Nuclear envelope ER continuum', [0.55, 1.15, 0.4], [0.5, 0.04, 0.3], 'The envelope is one membrane system with the ER; it re-forms from ER sheets after mitosis.', { k: 'box', rot: [0.3, 0.6, 0], c: '#9a8ae8', op: 0.35 }),
      ],
      endomembrane: [
        P('Sec61 translocon', [0.95, 1.45, 0.55], [0.12, 0.14, 0.12], 'The Sec61 channel threads nascent chains into the ER as ribosomes translate.', { k: 'cyl', r: 0.05, h: 0.13, c: '#4a9a86', met: 0.2 }),
        P('COPI vesicle (retrograde)', [-0.35, 1.68, -0.85], [0.13, 0.13, 0.13], 'COPI-coated vesicles run the return trip, recycling ER residents from the Golgi.', { k: 'sph', r: 0.065, c: '#c8a878', sheen: 0.4 }),
        P('COPII cage (Sec23/Sec24)', [0.34, 1.62, 1.02], [0.16, 0.16, 0.16], 'The Sec23/24 inner cage selects cargo; Sec13/31 outer struts round the bud.', { k: 'sph', r: 0.08, c: '#e6cf8f', op: 0.5, sheen: 0.5 }),
        ...chain(4, (i) => P(`ESCRT-III filament ${i}`, [-1.6 + Math.cos(i * Math.PI / 2) * 0.16, 0.8, 0.6 + Math.sin(i * Math.PI / 2) * 0.16], [0.1, 0.02, 0.04], `Filament ${i}: ESCRT-III spirals constrict membranes away from the cytoplasm, budding vesicles into the endosome.`, { k: 'tor', r: 0.05 + i * 0.01, t: 0.006, rot: [Math.PI / 2 + 0.2, i * 0.5, 0], c: '#b98ad1', op: 0.85 })),
        P('V-ATPase proton pump', [-1.2, 0.42, -0.9], [0.14, 0.16, 0.14], 'The rotary V-ATPase acidifies lysosomes and endosomes to pH near 4.5.', { k: 'cyl', r: 0.06, h: 0.15, c: '#c0504d', met: 0.3, rgh: 0.35 }),
        ...chain(2, (i) => P(`SNARE fusion complex ${i}`, [1.86 - i * 0.1, 0.72, 1.0 - i * 0.12], [0.05, 0.18, 0.05], `SNARE ${i}: a four-helix bundle zips vesicle to target membrane, forcing fusion.`, { k: 'cyl', r: 0.02, h: 0.17, c: '#f0d896', sheen: 0.5 })),
        ...chain(3, (i) => P(`Clathrin triskelion ${i}`, [1.5 + i * 0.12, 0.3, 1.4 - i * 0.1], [0.1, 0.03, 0.1], `Triskelion ${i}: three-legged clathrin assembles into the coat of endocytic pits.`, { k: 'cone', r: 0.05, h: 0.03, rot: [Math.PI, i, 0], c: '#e6cf8f', op: 0.75 })),
        ...chain(2, (i) => P(`ER exit site ${i}`, [0.6 + i * 0.18, 1.58, 0.75 - i * 0.1], [0.1, 0.06, 0.1], `Exit site ${i}: Sec16-marked ER portals where COPII buds concentrate.`, { k: 'box', c: '#9ad0c0', op: 0.7 })),
        P('ER-mitochondria contact site (MAM)', [-0.9, 0.25, -1.2], [0.3, 0.03, 0.14], 'Tethered ER-mito membranes swap lipids and calcium across a 10-30 nm gap.', { k: 'box', rot: [0, 0.6, 0.1], c: '#f0e3a0', op: 0.55 }),
        P('ER-plasma-membrane contact site', [1.6, 0.4, 1.45], [0.28, 0.03, 0.12], 'STIM1 sensors at ER-PM contacts trigger store-operated calcium entry.', { k: 'box', rot: [0.2, -0.7, 0], c: '#8fb8d8', op: 0.55 }),
      ],
      energy: [
        P('Mitochondrial outer membrane (inset)', [-2.4, 0.3, -1.8], [0.7, 0.42, 0.42], 'Outer membrane inset: smooth, porous to small molecules thanks to VDAC.', { k: 'cap', r: 0.2, h: 0.3, rot: [0, 0, Math.PI / 2], c: '#c0504d', op: 0.3, cc: 0.35 }),
        P('Mitochondrial inner membrane (inset)', [-2.4, 0.3, -1.8], [0.62, 0.36, 0.36], 'Inner membrane inset: cardiolipin-rich, protein-packed and impermeable to ions.', { k: 'cap', r: 0.17, h: 0.26, rot: [0, 0, Math.PI / 2], c: '#d8706a', op: 0.4 }),
        ...chain(3, (i) => P(`Crista fold ${i}`, [-2.55 + i * 0.15, 0.3, -1.8], [0.03, 0.24, 0.2], `Crista ${i}: deep folds multiply the surface area where respiration runs.`, { k: 'box', rot: [0, 0, 0.1 * i], c: '#e89a90', op: 0.55 })),
        ...chain(4, (i) => P(`VDAC porin ${i}`, [-2.55 + i * 0.1, 0.52, -1.75 + (i % 2) * 0.1], [0.05, 0.07, 0.05], `VDAC ${i}: beta-barrel porins make the outer membrane permeable to metabolites.`, { k: 'cyl', r: 0.022, h: 0.06, c: '#9cc3de', rgh: 0.25 })),
        P('TOM40 import channel', [-2.62, 0.42, -1.68], [0.08, 0.1, 0.08], 'TOM40 is the main gate: nearly every mitochondrial protein enters here.', { k: 'cyl', r: 0.035, h: 0.09, c: '#4a9a86', met: 0.25 }),
        P('TOM20 receptor', [-2.66, 0.5, -1.62], [0.05, 0.06, 0.05], 'TOM20 reads hydrophobic targeting signals and hands cargo to TOM40.', { k: 'sph', r: 0.025, c: '#6ab09a' }),
        P('TIM23 translocase', [-2.42, 0.34, -1.94], [0.06, 0.09, 0.06], 'TIM23 pulls matrix-destined proteins across the inner membrane, driven by the proton gradient.', { k: 'cyl', r: 0.028, h: 0.08, c: '#3a8a76', met: 0.2 }),
        P('TIM22 carrier insertase', [-2.3, 0.28, -1.68], [0.06, 0.08, 0.06], 'TIM22 embeds multi-pass carrier proteins into the inner membrane.', { k: 'cyl', r: 0.028, h: 0.07, c: '#3a8a76', met: 0.2 }),
        P('OXA insertase', [-2.5, 0.22, -1.9], [0.06, 0.08, 0.06], 'OXA inserts mitochondria-encoded proteins from the matrix side.', { k: 'cone', r: 0.03, h: 0.07, c: '#8fb8d8' }),
        ...chain(4, (i) => P(`MICOS cristae junction ${i}`, [-2.55 + i * 0.1, 0.44, -1.86 + (i % 2) * 0.12], [0.05, 0.04, 0.05], `Junction ${i}: MICOS pinches cristae mouths, keeping the proton gradient compartmentalised.`, { k: 'tor', r: 0.02, t: 0.006, rot: [Math.PI / 2, 0, i], c: '#b98ad1', met: 0.2 })),
        ...chain(4, (i) => P(`ATP synthase dimer ${i}`, [-2.58 + i * 0.12, 0.18, -1.8 + (i % 2) * 0.08], [0.06, 0.1, 0.06], `Dimer ${i}: bent synthase dimers line cristae ridges, their F0 rotors spun by protons.`, { k: 'cap', r: 0.025, h: 0.06, c: '#f0d896', met: 0.35, rgh: 0.3 })),
        P('Adenine nucleotide translocase', [-2.34, 0.16, -1.74], [0.06, 0.08, 0.06], 'ANT swaps cytosolic ADP for matrix ATP a hundred times a second.', { k: 'cyl', r: 0.028, h: 0.07, c: '#c98274', met: 0.2 }),
        P('Phosphate carrier', [-2.46, 0.14, -1.7], [0.06, 0.08, 0.06], 'The phosphate carrier imports Pi so ATP synthase is never starved.', { k: 'cyl', r: 0.028, h: 0.07, c: '#c98274', met: 0.2 }),
      ],
    },
  },
  frog: {
    newSystems: [{ id: 'skin', label: 'Skin & dermal glands', color: '#8aa05c' }],
    parts: {
      skin: [
        P('Stratum corneum (keratin veil)', [0, 0.26, 0], [1.24, 0.02, 0.94], 'A thin keratinised veil: far lighter than mammalian skin because frogs also breathe through it.', { k: 'cap', r: 0.46, h: 0.62, rot: [0, 0, Math.PI / 2], c: '#a8b878', op: 0.35, sheen: 0.4 }),
        P('Stratum germinativum', [0, 0.22, 0], [1.2, 0.03, 0.9], 'The living epidermal layer continually replaces the shedding corneum.', { k: 'cap', r: 0.45, h: 0.6, rot: [0, 0, Math.PI / 2], c: '#8aa05c', op: 0.4 }),
        P('Dermis (spongy + compact)', [0, 0.16, 0], [1.16, 0.07, 0.86], 'A loose spongy dermis over a dense compact one houses every gland and vessel.', { k: 'cap', r: 0.44, h: 0.58, rot: [0, 0, Math.PI / 2], c: '#7a9050', op: 0.5 }),
        P('Lymph space (Eberth-Katschenko)', [0, 0.1, 0], [1.14, 0.02, 0.84], 'A subdermal lymph space lets frog skin shift loosely over the body.', { k: 'cap', r: 0.43, h: 0.57, rot: [0, 0, Math.PI / 2], c: '#9cc3de', op: 0.25 }),
        P('Chromatophore layer', [0, 0.06, 0], [1.12, 0.03, 0.82], 'Stacked melanophores, iridophores and xanthophores mix colour and change it.', { k: 'cap', r: 0.42, h: 0.56, rot: [0, 0, Math.PI / 2], c: '#d8b25c', op: 0.35, sheen: 0.5 }),
        ...chain(3, (i) => P(`Mucous gland ${i}`, [-0.5 + i * 0.5, 0.18, 0.42 - (i % 2) * 0.1], [0.1, 0.1, 0.1], `Mucous gland ${i}: alveolar glands keep the skin wet for cutaneous respiration.`, { k: 'sph', r: 0.05, c: '#b8d8d0', op: 0.75, cc: 0.3 })),
        ...chain(2, (i) => P(`Granular (poison) gland ${i}`, [(i ? -1 : 1) * 0.62, 0.2, -0.3], [0.13, 0.13, 0.13], `Granular gland ${i}: swollen parotoid-style glands secrete noxious alkaloids.`, { k: 'sph', r: 0.065, c: '#c98274', op: 0.8, sheen: 0.3 })),
        ...chain(2, (i) => P(`Flask cell colony ${i}`, [(i ? -1 : 1) * 0.3, 0.24, 0.2], [0.07, 0.08, 0.07], `Colony ${i}: flask cells stud the epidermis with antibacterial peptides.`, { k: 'cap', r: 0.03, h: 0.05, c: '#f0ead0', op: 0.7 })),
        P('Skin capillary plexus', [0, 0.12, -0.42], [0.9, 0.02, 0.06], 'A dense capillary net just under the surface carries the gas exchange of skin breathing.', { k: 'tube', pts: [[-0.45, 0.12, -0.42], [0, 0.13, -0.44], [0.45, 0.12, -0.42]], r: 0.012, c: '#c0504d', op: 0.8 }),
      ],
    },
  },
  plants: {
    newSystems: [{ id: 'cellwall', label: 'Cell wall & plasmodesmata', color: '#a08050' }],
    parts: {
      cellwall: [
        P('Middle lamella', [-1.9, 1.7, -0.6], [0.56, 0.56, 0.1], 'The pectin middle lamella cements neighbouring plant cells together.', { k: 'box', c: '#c8d957', op: 0.5, sheen: 0.3 }),
        P('Primary cell wall', [-1.9, 1.7, -0.72], [0.5, 0.5, 0.08], 'Cellulose microfibrils in a hemicellulose-pectin gel: strong yet stretchable while the cell grows.', { k: 'box', c: '#a8c878', op: 0.55 }),
        P('Secondary cell wall', [-1.9, 1.7, -0.84], [0.44, 0.44, 0.06], 'Lignified secondary layers stiffen water-conducting cells after growth stops.', { k: 'box', c: '#8a6a4a', op: 0.6 }),
        P('Tonoplast', [-1.9, 1.7, -0.92], [0.3, 0.3, 0.3], 'The tonoplast membrane wraps the vacuole and pumps ions into it.', { k: 'sph', r: 0.15, c: '#9ad0c0', op: 0.35, cc: 0.3 }),
        P('Central vacuole', [-1.9, 1.7, -0.92], [0.26, 0.26, 0.26], 'One vacuole fills most of the cell, holding turgor pressure and stores.', { k: 'sph', r: 0.13, c: '#b8d8d0', op: 0.3 }),
        P('Plasma membrane (plant)', [-1.9, 1.7, -0.88], [0.4, 0.4, 0.04], 'Inside the wall, the plasma membrane still runs pumps, aquaporins and receptors.', { k: 'box', c: '#79b9d3', op: 0.3, sheen: 0.4 }),
        ...chain(4, (i) => P(`Plasmodesma ${i}`, [-2.06 + i * 0.11, 1.86 - i * 0.1, -0.66], [0.03, 0.03, 0.16], `Plasmodesma ${i}: membrane-lined channels thread the walls, linking cells into one symplast.`, { k: 'cyl', r: 0.012, h: 0.14, rot: [Math.PI / 2, 0, 0], c: '#f0e3a0', op: 0.85 })),
        P('Casparian strip (root band)', [0, -1.0, 0], [0.42, 0.05, 0.42], 'A waxy suberin band on endodermal walls forces water through cells, where uptake is filtered.', { k: 'tor', r: 0.19, t: 0.012, rot: [Math.PI / 2, 0, 0], c: '#e8c878', op: 0.8, cc: 0.4 }),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS6)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 7 — bring the four slimmiest worlds to atlas depth (docs/KEV_ATLAS_EXPANSION.md).
// Violin: player-side setup gear (shoulder rest, mute, rosin, wolf eliminator),
// neck geometry (heel graft, angle, shim), peg bushings, edge overhang, rib
// mitres, bow frog hardware and hair-scale ribbon. Earth: inner-core boundary,
// LAB + asthenosphere, 410/660 km discontinuities, CMB heat flux, shadow zone,
// Wadati-Benioff slab, triple junction, back-arc basin, accretionary prism,
// magnetic reversal stripes, sea ice, rivers, and full nitrogen + phosphorus
// cycle pools. Rocket: regenerative cooling bands, gimbal bearings, pogo
// suppressor, PU valve, AFTS, frangible sep nuts, star tracker, acoustic
// blanket, vent valves, strongback hinge, propellant farm, water tower, and
// flight-event markers. Giza: ScanPyramids Big Void + north-face corridor with
// muon detectors, air-shaft star targets, Khafre + Menkaure pyramids, Sphinx
// complex, quarries, swivel-door marker. Sources: violin setup charts (PASS 4
// refs), IRIS/USGS earth-structure summaries, nitrogen-cycle reviews (Vitousek),
// Falcon user guides, Nature ScanPyramids (2017) + NIST muon results (2023),
// Lehner Complete Pyramids plateau plans.
const PASS7 = {
  violin: {
    parts: {
      fittings: [
        P('Shoulder rest', [0.28, 0.06, 0.9], [0.24, 0.06, 0.14], 'A shoulder rest fills the gap between back and jaw so the left hand stays free.', { k: 'box', rot: [0, 0.2, 0], c: '#2a2a2a', rgh: 0.6 }),
        P('Practice mute', [0.05, 0.33, 0.32], [0.05, 0.04, 0.03], 'A rubber mute clamps the bridge crown, damping brilliance for quiet practice.', { k: 'box', c: '#1a1a1a', rgh: 0.8 }),
        P('Rosin cake', [0.98, 0.28, 1.02], [0.07, 0.03, 0.07], 'Rosin dust on the hair creates the stick-slip grip that makes strings speak.', { k: 'cyl', r: 0.035, h: 0.025, c: '#c88a3a', op: 0.85, cc: 0.5 }),
        P('Wolf-tone eliminator', [0.06, 0.26, 0.6], [0.03, 0.03, 0.03], 'A brass eliminator clipped to the afterlength tames the notorious wolf note.', { k: 'cyl', r: 0.014, h: 0.03, c: '#b08840', met: 0.8, rgh: 0.3 }),
        P('E-string protector tube', [0.062, 0.3, 0.28], [0.012, 0.012, 0.03], 'A leather tube pads the thin E string where it cuts into the bridge crown.', { k: 'tube', pts: [[0.062, 0.305, 0.265], [0.062, 0.3, 0.295]], r: 0.005, c: '#5a4a3a' }),
        P('Chinrest cork pad', [0.24, 0.21, 0.85], [0.18, 0.01, 0.18], 'Cork or felt between clamp and rib protects the varnish from metal bite.', { k: 'box', c: '#8a6a4a', rgh: 0.9 }),
        P('Tailcord (gut loop)', [0, 0.2, 0.92], [0.02, 0.02, 0.08], 'The tailcord loops over the end button; gut or Kevlar, it is part of the sound.', { k: 'tor', r: 0.02, t: 0.005, rot: [0.4, 0, 0], c: '#a89060' }),
      ],
      neck: [
        P('Neck heel & graft joint', [0, 0.12, -0.62], [0.1, 0.09, 0.09], 'The heel dovetails into the top block; a badly set neck cannot be fixed by the bridge.', { k: 'box', rot: [0.1, 0, 0], c: '#a86a3a' }),
        P('Neck angle marker (83\u00b0)', [0, 0.21, -0.66], [0.04, 0.1, 0.04], 'A classical neck sits at about 83 degrees so the strings press the bridge correctly.', { k: 'cone', r: 0.02, h: 0.09, rot: [0, 0, 0.35], c: '#f0b35b', op: 0.85 }),
        P('Fingerboard shim', [0, 0.2, -0.55], [0.09, 0.012, 0.3], 'A thin wedge under the board restores the angle when the neck heel settles.', { k: 'box', c: '#3a2a1a', op: 0.8 }),
        ...chain(4, (i) => P(`Peg-hole bushing ${i}`, [(i % 2 ? 1 : -1) * 0.085, 0.16, -1.0 - Math.floor(i / 2) * 0.09], [0.026, 0.026, 0.03], `Bushing ${i}: worn peg holes get plugged and reamed so pegs bite again.`, { k: 'cyl', r: 0.013, h: 0.028, rot: [0, 0, Math.PI / 2], c: '#e8d8b0' })),
        P('Peg compound marker', [0.09, 0.18, -1.05], [0.03, 0.03, 0.03], 'Peg compound (chalk + soap) tunes friction: too slippery runs, too sticky jumps.', { k: 'sph', r: 0.015, c: '#f0ead0', op: 0.8 }),
      ],
      body: [
        P('Edge overhang L', [-0.36, 0.163, 0.1], [0.05, 0.006, 0.5], 'The top edge overhangs the ribs, protecting them and framing the purfling.', { k: 'box', c: '#c89a4a' }),
        P('Edge overhang R', [0.36, 0.163, 0.1], [0.05, 0.006, 0.5], 'Overhang width is a maker fingerprint and a repair clock.', { k: 'box', c: '#c89a4a' }),
        ...chain(2, (i) => P(`Rib mitre joint ${i}`, [(i ? -1 : 1) * 0.33, 0.13, -0.22], [0.03, 0.06, 0.02], `Mitre ${i}: ribs meet at the corners in mitred joints glued to the corner blocks.`, { k: 'box', rot: [0, i ? 0.7 : -0.7, 0], c: '#b07a3a' })),
        ...chain(2, (i) => P(`F-hole notch ${i}`, [(i ? -1 : 1) * 0.16, 0.168, 0.28], [0.02, 0.004, 0.02], `Notch ${i}: the small nicks mark the bridge line and stop the f-hole tearing.`, { k: 'box', c: '#5a3a1a' })),
        P('Soundpost diameter gauge', [0.14, 0.16, 0.3], [0.05, 0.005, 0.05], 'Post diameter and grain angle are measured before the post is cut.', { k: 'tor', r: 0.022, t: 0.003, rot: [Math.PI / 2, 0, 0], c: '#f0b35b', op: 0.8 }),
        P('Bass-bar taper marker', [-0.08, 0.09, 0.1], [0.03, 0.05, 0.03], 'The bass bar is tapered and sprung under tension; its fit sets the low strings.', { k: 'cone', r: 0.014, h: 0.05, rot: [Math.PI, 0, 0], c: '#f0b35b', op: 0.8 }),
        P('Bridge blank grain marker', [0, 0.31, 0.24], [0.03, 0.03, 0.01], 'A good bridge blank has even, vertical grain and dark medullary rays.', { k: 'box', c: '#e0c08a', op: 0.7 }),
      ],
      bow: [
        P('Frog slide (underslide)', [0.9, 0.335, 0.88], [0.03, 0.006, 0.09], 'The pearl or silver underslide lets the frog run true along the stick facet.', { k: 'box', c: '#e8e2f0', cc: 0.6, rgh: 0.15 }),
        P('Frog eyelet (screw nut)', [0.9, 0.335, 0.95], [0.015, 0.015, 0.015], 'A brass eyelet threads the tension screw; when it strips, the bow cannot tighten.', { k: 'cyl', r: 0.007, h: 0.014, rot: [Math.PI / 2, 0, 0], c: '#b08840', met: 0.9, rgh: 0.25 }),
        P('Hair-scale ribbon (cuticle band)', [0.9, 0.3, 0.4], [0.02, 0.004, 0.3], 'Each hair carries microscopic cuticle scales; they grip rosin and the string.', { k: 'box', c: '#f0ead0', op: 0.7, sheen: 0.6 }),
        P('Bow-hair count marker (150-190)', [0.9, 0.345, 1.0], [0.03, 0.03, 0.01], 'A violin bow carries roughly 150-190 white stallion hairs.', { k: 'cone', r: 0.012, h: 0.03, rot: [0, 0, 0.4], c: '#f0b35b', op: 0.85 }),
      ],
    },
  },
  earth: {
    parts: {
      layers: [
        P('Inner-core boundary (ICB)', [0, 1.0, 0], [0.6, 0.02, 0.6], 'At the ICB (5,150 km) iron freezes out of the liquid, releasing latent heat that feeds the dynamo.', { k: 'tor', r: 0.28, t: 0.01, rot: [Math.PI / 2, 0, 0], c: '#f0d896', met: 0.6, op: 0.8 }),
        P('Lithosphere-asthenosphere boundary (LAB)', [0, 1.28, 0], [2.5, 0.02, 2.5], 'The LAB marks where hot rock turns soft enough to flow; plates glide above it.', { k: 'tor', r: 1.24, t: 0.012, rot: [Math.PI / 2, 0, 0], c: '#e6a65d', op: 0.7 }),
        P('Asthenosphere', [0, 1.22, 0], [2.46, 0.1, 2.46], 'The asthenosphere is 1-3% partial melt: weak, ductile, and the conveyor under the plates.', { k: 'sph', r: 1.23, c: '#d87171', op: 0.12 }),
        P('410 km discontinuity', [0, 1.08, 0], [2.28, 0.02, 2.28], 'At 410 km olivine collapses to wadsleyite; seismic waves jump in speed.', { k: 'tor', r: 1.14, t: 0.008, rot: [Math.PI / 2, 0, 0], c: '#9cc3de', op: 0.75 }),
        P('660 km discontinuity', [0, 1.05, 0], [2.02, 0.02, 2.02], 'At 660 km ringwoodite splits into bridgmanite + ferropericlase, gating whole-mantle flow.', { k: 'tor', r: 1.01, t: 0.008, rot: [Math.PI / 2, 0, 0], c: '#9cc3de', op: 0.75 }),
        P('Core-mantle boundary heat flux', [0.3, 0.5, -0.3], [0.1, 0.3, 0.1], 'Heat escaping the core at the CMB drives the plumes that resurface the planet.', { k: 'cone', r: 0.05, h: 0.3, c: '#e6a65d', op: 0.75 }),
        P('Seismic shadow zone', [-0.8, 2.0, 0.5], [0.3, 0.16, 0.3], 'Between 103 and 143 degrees no direct P-waves arrive: the liquid core bends them away. This gap proved the core is molten.', { k: 'cap', r: 0.14, h: 0.12, rot: [0.6, 0, 0.3], c: '#7a6ad1', op: 0.4 }),
      ],
      tectonics: [
        P('Wadati-Benioff zone', [-0.1, 0.55, -0.85], [0.9, 0.8, 0.08], 'Earthquakes trace the sinking slab along a dipping plane down to 700 km.', { k: 'box', rot: [0.9, 0.3, 0], c: '#c0504d', op: 0.35 }),
        P('Triple junction', [0.5, 0.35, 1.1], [0.12, 0.12, 0.12], 'A triple junction is where three plate boundaries meet; ridge-ridge-ridge types migrate over time.', { k: 'sph', r: 0.06, c: '#f0b35b', op: 0.85 }),
        P('Back-arc basin', [-0.55, 0.4, -1.05], [0.3, 0.06, 0.22], 'Behind a volcanic arc, spreading opens a back-arc basin of fresh ocean crust.', { k: 'box', rot: [0, 0.5, 0], c: '#3a7a9a', op: 0.5 }),
        P('Accretionary prism', [0.6, 0.3, -1.15], [0.2, 0.12, 0.3], 'Sediment scraped off the downgoing plate stacks into an accretionary wedge.', { k: 'cone', r: 0.12, h: 0.12, rot: [0.3, 0, 0.2], c: '#b98b5b', op: 0.7 }),
        P('Supercontinent cycle marker (Pangaea)', [0, 1.34, -0.85], [0.5, 0.03, 0.3], 'Every ~500 million years the plates stitch into a supercontinent and rift apart again.', { k: 'box', rot: [0, 0.2, 0], c: '#8aa05c', op: 0.5 }),
        ...chain(4, (i) => P(`Magnetic reversal stripe ${i}`, [(i % 2 ? 1 : -1) * (0.12 + i * 0.05), 0.42, 1.25 - i * 0.08], [0.06, 0.02, 0.34], `Stripe ${i}: seafloor basalt records magnetic polarity flips as symmetrical stripes, the tape recorder of spreading.`, { k: 'box', rot: [0, 0.15, 0], c: i % 2 ? '#4a4a52' : '#b0b8c0', op: 0.7 })),
      ],
      hydrosphere: [
        P('Arctic sea ice', [0.05, 1.32, -1.1], [0.7, 0.03, 0.7], 'Sea ice is frozen seawater: thin, seasonal, and its loss changes Arctic albedo.', { k: 'cyl', r: 0.34, h: 0.02, c: '#e8f4ee', op: 0.6, cc: 0.4 }),
        P('River channel', [0.5, 1.31, 0.3], [0.9, 0.02, 0.7], 'Rivers carry about 20 billion tonnes of sediment to the sea each year.', { k: 'tube', pts: [[0.85, 1.31, 0.55], [0.5, 1.315, 0.3], [0.2, 1.31, -0.05]], r: 0.014, c: '#79b9d3', op: 0.85 }),
        P('Estuary marker', [0.2, 1.31, -0.05], [0.1, 0.03, 0.1], 'Estuaries mix fresh and salt water; they are the most productive ecosystems on Earth.', { k: 'cone', r: 0.05, h: 0.03, rot: [Math.PI, 0, 0], c: '#9ad0c0', op: 0.8 }),
      ],
      cycles: [
        P('Nitrogen: fixation', [1.0, 1.4, 0.8], [0.1, 0.14, 0.1], 'Rhizobia and cyanobacteria break the triple bond of N2, the gateway of the whole cycle.', { k: 'cone', r: 0.05, h: 0.14, c: '#8fb8d8', op: 0.85 }),
        P('Nitrogen: nitrification', [1.15, 1.5, 0.7], [0.08, 0.08, 0.08], 'Soil bacteria step ammonium to nitrite then nitrate, the form most roots absorb.', { k: 'sph', r: 0.04, c: '#9ad0c0', op: 0.85 }),
        P('Nitrogen: assimilation', [-1.1, 1.45, -0.7], [0.08, 0.1, 0.08], 'Plants build amino acids from nitrate; animals get nitrogen by eating plants.', { k: 'cone', r: 0.045, h: 0.1, c: '#7fa35c', op: 0.85 }),
        P('Nitrogen: ammonification', [-1.2, 1.35, -0.85], [0.08, 0.06, 0.08], 'Decomposers return organic nitrogen to ammonium in the soil.', { k: 'box', c: '#b98b5b', op: 0.8 }),
        P('Nitrogen: denitrification', [0.9, 1.6, 0.95], [0.08, 0.08, 0.08], 'In waterlogged soil, bacteria strip oxygen from nitrate and send N2 back to the air, closing the loop.', { k: 'sph', r: 0.04, c: '#7a6ad1', op: 0.8 }),
        P('Phosphorus: rock weathering pool', [0.7, 1.32, -0.9], [0.12, 0.04, 0.12], 'Phosphorus has no gas phase: rain weathers it slowly out of apatite rock.', { k: 'box', rot: [0, 0.4, 0], c: '#8a8a92', op: 0.8 }),
        P('Phosphorus: uplift return', [0.85, 1.5, -1.0], [0.06, 0.2, 0.06], 'Mountain building and seabed uplift return buried phosphorus to the weathering zone over millions of years.', { k: 'cone', r: 0.03, h: 0.2, c: '#d8b25c', op: 0.8 }),
        P('Phosphorus: ocean sediment pool', [-0.8, 1.3, 0.95], [0.14, 0.04, 0.14], 'Most phosphorus ends in ocean sediment, locked away until tectonics recycles it.', { k: 'box', rot: [0, -0.3, 0], c: '#4a6a7a', op: 0.8 }),
      ],
    },
  },
  rocket: {
    parts: {
      engines: [
        ...chain(2, (i) => P(`Regenerative cooling band ${i}`, [(i ? -1 : 1) * 0.3, 0.12, 0], [0.24, 0.03, 0.24], `Cooling band ${i}: RP-1 runs through hundreds of tube channels around the bell before burning, keeping it below its melting point.`, { k: 'tor', r: 0.11, t: 0.008, rot: [Math.PI / 2, 0, 0], c: '#a8c8d8', met: 0.7, rgh: 0.3 })),
        ...chain(2, (i) => P(`Gimbal bearing ${i}`, [(i ? -1 : 1) * 0.3, 0.2, 0], [0.14, 0.03, 0.14], `Bearing ${i}: a spherical bearing lets each engine swing for thrust-vector control.`, { k: 'tor', r: 0.06, t: 0.012, rot: [Math.PI / 2, 0, 0], c: '#9a9a9a', met: 0.8, rgh: 0.25 })),
        P('Turbine exhaust manifold', [-0.35, 0.25, -0.25], [0.08, 0.12, 0.08], 'Spent turbopump gas is ducted overboard (or into the nozzle) after spinning the turbines.', { k: 'cyl', r: 0.035, h: 0.11, c: '#8a8a92', met: 0.7 }),
        P('J-2 heat exchanger', [0.1, 2.85, -0.2], [0.09, 0.09, 0.09], 'A heat exchanger taps engine heat to keep stage-2 helium and vents at pressure.', { k: 'cyl', r: 0.04, h: 0.08, c: '#b08840', met: 0.6, rgh: 0.35 }),
      ],
      stage1: [
        P('Pogo suppressor', [0, 1.3, 0.42], [0.1, 0.18, 0.1], 'A pogo suppressor damps the thrust-feedline resonance that shook early rockets apart.', { k: 'cyl', r: 0.045, h: 0.17, c: '#4a9a86', met: 0.5 }),
        P('Propellant utilization valve', [0, 1.15, 0.44], [0.08, 0.1, 0.08], 'The PU valve trims LOX flow so fuel and oxidiser run out together, not one early.', { k: 'cyl', r: 0.036, h: 0.09, c: '#9a9a9a', met: 0.6 }),
        P('LOX vent valve', [0, 2.25, -0.4], [0.09, 0.1, 0.09], 'Vent valves bleed boil-off so tanks never overpressurise on the pad.', { k: 'cap', r: 0.04, h: 0.08, c: '#a8c8d8', met: 0.5 }),
        P('RP-1 vent valve', [0, 1.0, -0.45], [0.08, 0.09, 0.08], 'A smaller vent keeps the kerosene tank at fill pressure during countdown.', { k: 'cap', r: 0.035, h: 0.07, c: '#c8a878', met: 0.5 }),
        ...chain(4, (i) => P(`Frangible separation nut ${i}`, [Math.cos(i * Math.PI / 2 + 0.4) * 0.45, 2.3, Math.sin(i * Math.PI / 2 + 0.4) * 0.45], [0.05, 0.05, 0.05], `Sep nut ${i}: explosive-free frangible nuts split cleanly at stage separation.`, { k: 'cyl', r: 0.022, h: 0.045, c: '#b0b8c0', met: 0.8, rgh: 0.25 })),
      ],
      stage2: [
        P('AFTS (autonomous flight termination)', [0, 2.35, 0.46], [0.1, 0.06, 0.05], 'The AFTS unit watches the trajectory and can shut the rocket down if it strays, replacing ground-range destruct.', { k: 'box', c: '#c0504d', rgh: 0.5 }),
        P('Star tracker', [0.2, 2.95, 0.3], [0.06, 0.06, 0.08], 'A star tracker fixes attitude against star patterns, correcting gyro drift to arcminutes.', { k: 'cyl', r: 0.03, h: 0.07, rot: [0.5, 0, 0], c: '#2a2a3a', met: 0.4, rgh: 0.3 }),
      ],
      payload: [
        P('Fairing acoustic blanket', [-0.28, 4.45, 0], [0.4, 0.9, 0.4], 'Blankets inside the fairing keep launch acoustics under 140 dB so delicate payloads survive max-Q noise.', { k: 'cap', r: 0.34, h: 0.8, c: '#e8e2d0', op: 0.28, sheen: 0.5 }),
      ],
      ground: [
        P('Strongback hinge', [0.55, 1.8, 0.45], [0.1, 0.14, 0.1], 'The transporter-erector strongback hinges away seconds before ignition.', { k: 'box', rot: [0, 0, 0.5], c: '#8a8a92', met: 0.6, rgh: 0.4 }),
        ...chain(2, (i) => P(`Propellant storage sphere ${i}`, [(i ? -1 : 1) * -1.6, 0.3, i ? -0.5 : 0.8], [0.36, 0.36, 0.36], `Farm sphere ${i}: the propellant farm stores subcooled LOX and RP-1 beside the pad.`, { k: 'sph', r: 0.18, c: '#d8e8f0', met: 0.3, rgh: 0.35, op: 0.9 })),
        P('Deluge water tower', [1.7, 0.9, -0.8], [0.3, 0.9, 0.3], 'Hundreds of thousands of litres dump in seconds to drown acoustic energy at liftoff.', { k: 'cyl', r: 0.15, h: 0.85, c: '#a8c8d8', op: 0.85 }),
      ],
      flight: [
        P('Roll programme marker', [0.6, 0.6, 0.05], [0.08, 0.08, 0.08], 'Seconds after liftoff the vehicle rolls to align with its orbital plane.', { k: 'cone', r: 0.04, h: 0.08, rot: [0, 0, -0.6], c: '#f0b35b', op: 0.85 }),
        P('Fairing separation marker', [-0.6, 4.3, 0], [0.08, 0.08, 0.08], 'Above the atmosphere the halves peel away, often caught or parafoiled for reuse.', { k: 'cone', r: 0.04, h: 0.08, rot: [0, 0, 1.2], c: '#f0b35b', op: 0.85 }),
        P('Payload separation marker', [0.35, 4.1, 0], [0.08, 0.08, 0.08], 'Deployment happens on the far side of the ascent, often with a kick from the upper stage.', { k: 'cone', r: 0.04, h: 0.08, rot: [0, 0, 0.8], c: '#f0b35b', op: 0.85 }),
        P('Deorbit burn marker', [2.0, 3.6, 0], [0.08, 0.08, 0.08], 'A retrograde burn lowers perigee into the atmosphere for disposal or return.', { k: 'cone', r: 0.04, h: 0.08, rot: [0, 0, 2.2], c: '#c0504d', op: 0.85 }),
      ],
    },
  },
  giza: {
    parts: {
      chambers: [
        P('ScanPyramids Big Void', [0.15, 1.15, 0.1], [0.7, 0.2, 0.35], 'In 2017 muon tomography revealed a 30 m void above the Grand Gallery, still unopened and unexplained.', { k: 'box', rot: [0, 0, 0.4], c: '#7a6ad1', op: 0.3 }),
        P('ScanPyramids north-face corridor', [-1.3, 1.0, 0], [0.5, 0.14, 0.16], 'The 2023 confirmation: a 9 m hidden corridor behind the north-face chevrons, endoscoped but never entered.', { k: 'box', rot: [0, 0, 0.46], c: '#9a8ae8', op: 0.35 }),
        ...chain(2, (i) => P(`Muon detector ${i}`, [-1.05 - i * 0.1, 0.6 + i * 0.12, 0.25 - i * 0.4], [0.08, 0.06, 0.06], `Detector ${i}: emulsion and hodoscope plates image cosmic-ray muons absorbed by stone, X-raying the pyramid.`, { k: 'box', c: '#8fb8d8', met: 0.4, rgh: 0.35 })),
      ],
      shafts: [
        ...chain(4, (i) => P(`Air-shaft star target ${i}`, [(i < 2 ? -1 : 1) * 2.4, 1.75 - (i % 2) * 0.12, (i % 2 ? -0.12 : 0.1)], [0.1, 0.1, 0.1], ['Thuban (Draconis): the north King-shaft target, the pole star of Khufu\u2019s time.', 'Kochab: the second north-shaft candidate, circumpolar and imperishable.', 'Sirius: the south Queen-shaft star, linked to Isis and rebirth.', 'Orion\u2019s belt (Alnitak): the south King-shaft target, Osiris reborn.'][i], { k: 'sph', r: 0.05, c: '#f0e3a0', op: 0.85 })),
      ],
      precinct: [
        P('Pyramid of Khafre (context)', [3.4, 0, -2.6], [2.3, 1.45, 2.3], 'Khafre\u2019s pyramid (2nd Giza, 136 m) keeps its summit casing and looks tallest from the plateau rim.', { k: 'cone', r: 1.15, h: 1.45, c: '#d0bc8e' }),
        P('Pyramid of Menkaure (context)', [4.4, 0, -3.8], [1.2, 0.8, 1.2], 'Menkaure\u2019s pyramid (3rd Giza, 62 m) is granite-clad at the base; its temple statues are masterworks.', { k: 'cone', r: 0.6, h: 0.8, c: '#c0a878' }),
        P('Great Sphinx (body)', [2.6, 0.12, -1.2], [0.9, 0.24, 0.34], 'The 73 m limestone Sphinx guards the Khafre causeway, carved from a single bedrock knoll.', { k: 'cap', r: 0.16, h: 0.6, rot: [0, 0, Math.PI / 2], c: '#d8c08a' }),
        P('Great Sphinx (head & nemes)', [2.15, 0.32, -1.2], [0.2, 0.26, 0.2], 'The head wears the royal nemes headdress; the face was re-carved in later dynasties.', { k: 'sph', r: 0.1, c: '#e0c896' }),
        P('Sphinx temple', [2.9, 0.05, -0.6], [0.7, 0.16, 0.5], 'Megalithic Sphinx temple: 200-tonne blocks and a colonnade aligned to solstice sunsets.', { c: '#c9b98a' }),
        P('West quarry marker', [1.6, 0, -2.0], [0.8, 0.04, 0.6], 'Core-stone quarries wrap the pyramid\u2019s south and west flanks; blocks moved barely 300 m.', { k: 'box', rot: [0, 0.2, 0], c: '#a89468', op: 0.7 }),
        P('South quarry marker (workers)', [-2.4, 0, 1.8], [0.7, 0.04, 0.5], 'The main workers\u2019 quarry fed the accretion layers; its tailings became the workers\u2019 town platform.', { k: 'box', rot: [0, -0.3, 0], c: '#a89468', op: 0.7 }),
        P('Swivel entrance-door marker', [-1.62, 0.62, 0], [0.14, 0.1, 0.14], 'Diodorus recorded a swivel stone door at the entrance; the chevron lintels frame where it hung.', { k: 'cyl', r: 0.06, h: 0.09, c: '#c9b98a', op: 0.85 }),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS7)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 8A — Atlas-parity program, part 1 (docs/KEV_ATLAS_EXPANSION.md).
// The Human Atlas enumerates every discrete structure (each bone, branch and
// nerve). This pass applies the same enumeration discipline to the living
// subjects: every earthworm segment gets its septum and muscle bands; the bee
// gets its ommatidia, tarsomeres, flagellomeres, wing veins and ovarioles;
// the frog gets its named skull bones, presacral vertebrae, muscle groups and
// cranial nerves; the cell gets its cytoskeletal arrays, polysomes,
// nucleosomes and centriole triplets. Sources: Lumbricus segmental anatomy
// (septum/muscle counts per segment); Snodgrass bee morphology (flagellum 11
// segments, 5 tarsomeres, ~6,900 ommatidia per drone eye, ~150 ovarioles per
// queen ovary); standard frog skull osteology (frontoparietal, parasphenoid,
// plectrum); cranial nerve I-X nomenclature; Alberts cytoskeleton chapters
// (9+2? no - 9-triplet centriole, 25 nm microtubules, nucleosome 147 bp).
const PASS8A = {
  worm: {
    parts: {
      bodywall: [
        ...chain(59, (i) => P(`Septum ${i}`, [-2.064 + i * 0.072, -0.07, 0], [0.01, 0.19, 0.19], `Septum ${i} of 59: thin walls dividing the coelom into per-segment compartments.`, { k: 'box', c: '#c98a7a', op: 0.45 })),
        ...chain(60, (i) => P(`Circular muscle band ${i}`, [-2.1 + i * 0.072, -0.07, 0], [0.21, 0.21, 0.014], `Band ${i}: circular fibres thin the outer sleeve; contracting them lengthens the segment.`, { k: 'tor', r: 0.1, t: 0.006, rot: [0, Math.PI / 2, 0], c: '#b06a5a', op: 0.7 })),
        ...chain(60, (i) => P(`Longitudinal muscle strip ${Math.floor(i / 15) + 1}-${i % 15}`, [-2.1 + (i % 15) * 4 * 0.072, -0.07 + Math.sin(Math.floor(i / 15) * Math.PI / 2) * 0.095, Math.cos(Math.floor(i / 15) * Math.PI / 2) * 0.095], [0.27, 0.014, 0.014], `Strip ${i}: longitudinal bands run inside the circular layer; contracting them shortens the segment for the power stroke of burrowing.`, { k: 'box', c: '#a05a4a', op: 0.75 })),
        ...chain(14, (i) => P(`Dorsal pore ${i}`, [-2.1 + (12 + i) * 0.072, 0.03, 0], [0.018, 0.018, 0.018], `Pore ${i}: from segment 12/13 onward, dorsal pores link the coelom to the surface for fluid exchange.`, { k: 'sph', r: 0.009, c: '#9cc3de', op: 0.9 })),
      ],
      excretion: [
        ...chain(30, (i) => P(`Nephrostome ${i}`, [-2.1 + i * 2 * 0.072, -0.04, (i % 2 ? 0.05 : -0.05)], [0.026, 0.026, 0.026], `Nephrostome ${i}: the ciliated funnel of each nephridium sweeps wastes out of the coelom.`, { k: 'cone', r: 0.012, h: 0.022, rot: [Math.PI, 0, 0], c: '#79b9d3', op: 0.85 })),
      ],
      digestion: [
        ...chain(20, (i) => P(`Chloragogen cell cluster ${i}`, [-2.1 + i * 3 * 0.072, -0.02, 0.06], [0.03, 0.03, 0.03], `Cluster ${i}: yellow chloragogen tissue on the gut stores glycogen, detoxifies, and floats like a liver.`, { k: 'sph', r: 0.015, c: '#f0e3a0', op: 0.8 })),
      ],
    },
  },
  bee: {
    parts: {
      head: [
        ...ring(60, 0.088, (i, pos) => P(`Ommatidium L${i}`, [pos[0] - 1.08, pos[1] + 0.08, pos[2] + 0.14], [0.014, 0.014, 0.014], `Facet ${i} of ~6,900 in the left compound eye: each ommatidium is one complete optical unit with its own lens and retina.`, { k: 'sph', r: 0.007, c: '#5a5148', op: 0.9 })),
        ...ring(60, 0.088, (i, pos) => P(`Ommatidium R${i}`, [pos[0] - 1.08, pos[1] + 0.08, pos[2] - 0.14], [0.014, 0.014, 0.014], `Facet ${i} of the right compound eye: together both eyes cover nearly a full sphere, detecting polarised sky light for navigation.`, { k: 'sph', r: 0.007, c: '#5a5148', op: 0.9 })),
        ...chain(22, (i) => P(`Flagellomere ${i % 11 + 1} (${i < 11 ? 'L' : 'R'})`, [-1.22 - (i % 11) * 0.009, 0.08 - (i % 11) * 0.012, (i < 11 ? 1 : -1) * (0.045 + (i % 11) * 0.004)], [0.018, 0.018, 0.018], `Flagellomere ${i % 11 + 1}: the 11-segment flagellum carries thousands of smell pores; worker antennae hold ~170,000 chemoreceptors.`, { k: 'sph', r: 0.009, c: '#3a3126', op: 0.95 })),
      ],
      thorax: [
        ...chain(30, (i) => P(`Tarsomere ${i % 5 + 1} of leg ${Math.floor(i / 5) + 1}`, [-0.55 + Math.floor(i / 5) * 0.25, -0.1 - (i % 5) * 0.022, (Math.floor(i / 5) % 2 ? 0.16 : -0.16) + (i % 5) * 0.012], [0.02, 0.016, 0.016], `Tarsomere ${i % 5 + 1} of leg ${Math.floor(i / 5) + 1}: every bee foot ends in five segments, a pair of claws and an adhesive arolium.`, { k: 'cyl', r: 0.008, h: 0.018, rot: [0.4, 0, 0], c: '#3a3126' })),
        ...chain(24, (i) => P(`Forewing vein ${i % 12 + 1} (${i < 12 ? 'L' : 'R'})`, [-0.5, 0.285, (i < 12 ? 1 : -1) * (0.31 + (i % 12) * 0.02)], [0.7 - (i % 12) * 0.03, 0.005, 0.006], `Vein ${i % 12 + 1}: the vein pattern (cubital index) is how taxonomists tell bee species and races apart.`, { k: 'box', c: '#8aa8b8', op: 0.8 })),
        ...chain(12, (i) => P(`Hindwing vein ${i % 6 + 1} (${i < 6 ? 'L' : 'R'})`, [-0.42 + (i % 6) * 0.08, 0.27, (i < 6 ? 1 : -1) * 0.38], [0.06, 0.005, 0.006], `Vein ${i % 6 + 1}: hindwing veins carry haemolymph; the hamuli row zips hindwing to forewing in flight.`, { k: 'box', c: '#8aa8b8', op: 0.8 })),
      ],
      abdomen: [
        ...chain(6, (i) => P(`Sternum plate ${i}`, [0.15 + i * 0.13, -0.12, 0], [0.1, 0.02, 0.18], `Sternum ${i}: ventral abdominal plates; sternites 4-7 carry the wax mirrors in workers.`, { k: 'box', c: '#c89838', op: 0.85 })),
        ...chain(4, (i) => P(`Wax mirror ${i}`, [0.3 + i * 0.1, -0.135, 0], [0.07, 0.008, 0.1], `Mirror ${i}: wax glands pour liquid wax onto these pale plates; it sets into scales the bee chews into comb.`, { k: 'box', c: '#f0e3a0', op: 0.85, sheen: 0.5 })),
      ],
      respiration: [
        ...chain(8, (i) => P(`Spiracle ${i}`, [-0.3 + i * 0.15, 0.0, (i % 2 ? 0.12 : -0.12)], [0.022, 0.022, 0.022], `Spiracle ${i} of 10 pairs: valved air ports feeding the tracheal tree that delivers oxygen straight to tissue.`, { k: 'sph', r: 0.011, c: '#f0ead0', op: 0.9 })),
      ],
      castes: [
        ...chain(60, (i) => P(`Ovariole ${i}`, [0.2 + (i % 20) * 0.04, -0.05 + Math.floor(i / 20) * 0.05, 0.02 + (i % 5) * 0.02], [0.08, 0.014, 0.014], `Ovariole ${i} of ~150 per queen ovary: each tube ripens eggs in sequence toward the oviduct; a laying queen fills ~2,000 eggs a day.`, { k: 'cyl', r: 0.006, h: 0.08, rot: [0, 0, Math.PI / 2], c: '#f0d896', op: 0.8 })),
      ],
    },
  },
  frog: {
    parts: {
      skeleton: [
        P('Parasphenoid', [-0.95, -0.02, 0], [0.3, 0.015, 0.12], 'The parasphenoid plates the skull floor; frogs lost the palate bones other vertebrates keep.', { k: 'box', c: '#ded8c6' }),
        P('Frontoparietal (fused pair)', [-0.9, 0.13, 0], [0.22, 0.02, 0.26], 'Frog frontal and parietal bones fuse into one roof plate over the brain.', { k: 'box', c: '#e8e2d0' }),
        P('Sphenethmoid', [-1.0, 0.08, 0], [0.1, 0.06, 0.1], 'The sphenethmoid shields the olfactory nerves entering the brain.', { k: 'box', c: '#e8e2d0' }),
        P('Maxilla (L/R)', [-1.12, 0.0, 0], [0.28, 0.03, 0.3], 'Upper jaw bones carrying the small maxillary tooth row.', { k: 'box', c: '#ded8c6' }),
        P('Premaxilla (L/R)', [-1.24, 0.02, 0], [0.1, 0.03, 0.16], 'Frontmost jaw bones, also toothed in most frogs.', { k: 'box', c: '#ded8c6' }),
        P('Nasal (L/R)', [-1.05, 0.12, 0], [0.08, 0.02, 0.14], 'Nasal bones roof the nostril openings.', { k: 'box', c: '#e8e2d0' }),
        P('Septomaxilla (L/R)', [-1.12, 0.08, 0], [0.06, 0.03, 0.08], 'Small bones between nasal and premaxilla, part of the Jacobson organ region.', { k: 'box', c: '#e8e2d0' }),
        P('Squamosal (L/R)', [-0.8, 0.06, 0.12], [0.08, 0.05, 0.05], 'The squamosal frames the tympanum and anchors the jaw joint.', { k: 'box', c: '#ded8c6' }),
        P('Quadratojugal (L/R)', [-0.82, 0.0, -0.1], [0.07, 0.03, 0.05], 'A slender bone linking quadrate to maxilla along the cheek.', { k: 'box', c: '#ded8c6' }),
        P('Pterygoid (L/R)', [-0.88, -0.01, 0.1], [0.08, 0.02, 0.05], 'Pterygoids brace the palate against the braincase.', { k: 'box', c: '#ded8c6' }),
        P('Palatine (L/R)', [-0.98, 0.0, 0.08], [0.07, 0.02, 0.04], 'Palatine bones sit beside the vomers in the roof of the mouth.', { k: 'box', c: '#ded8c6' }),
        P('Vomer bone (L/R)', [-1.0, 0.01, -0.05], [0.06, 0.02, 0.06], 'The vomers carry the vomerine teeth that hold struggling prey.', { k: 'box', c: '#ded8c6' }),
        P('Exoccipital (L/R)', [-0.7, 0.05, 0], [0.08, 0.05, 0.1], 'Rear braincase bones bearing the occipital condyles that hinge onto the atlas vertebra.', { k: 'box', c: '#e8e2d0' }),
        P('Prootic (L/R)', [-0.78, 0.08, -0.08], [0.07, 0.05, 0.06], 'The prootic houses the inner ear capsule.', { k: 'box', c: '#e8e2d0' }),
        P('Plectrum (columella)', [-0.85, 0.05, -0.2], [0.02, 0.02, 0.1], 'A single slender bone transmits eardrum vibration to the inner ear, the frog version of our three ear ossicles.', { k: 'cyl', r: 0.008, h: 0.1, rot: [Math.PI / 2, 0, 0.3], c: '#f0ead0' }),
        P('Hyoid apparatus', [-0.95, -0.06, 0], [0.2, 0.015, 0.22], 'The hyoid plate supports the tongue and pumps the throat during buccal breathing.', { k: 'box', rot: [0, 0, 0], c: '#cfc8b0', op: 0.9 }),
        ...chain(8, (i) => P(`Presacral vertebra ${i + 1}`, [-0.6 + i * 0.14, 0.05, 0], [0.08, 0.07, 0.07], `Vertebra ${i + 1} of 8 presacrals: frogs have a rigidly short column, no ribs, trading trunk flexibility for jump stiffness.`, { k: 'box', c: '#e8e2d0' })),
        ...chain(4, (i) => P(`Transverse process ${i + 1}`, [-0.6 + i * 0.14, 0.05, 0], [0.03, 0.02, 0.16], `Process ${i + 1}: only the front vertebrae keep transverse processes; the rest are bare.`, { k: 'box', c: '#ded8c6' })),
        ...chain(10, (i) => P(i < 5 ? `Carpal ${i + 1}` : `Tarsal ${i - 4}`, i < 5 ? [-0.63 - i * 0.02, -0.06, 0.3 + i * 0.01] : [0.95 + (i - 5) * 0.02, -0.05, 0.2 + (i - 5) * 0.01], [0.022, 0.018, 0.02], i < 5 ? `Wrist bone ${i + 1} of 5 carpals: the frog hand spreads on landing.` : `Ankle bone ${i - 4} of the elongated tarsus: extra lever arm for the jump.`, { k: 'box', c: '#e8e2d0' })),
      ],
      muscles: [
        P('Iliofibularis', [0.55, 0.12, 0.2], [0.22, 0.08, 0.1], 'The iliofibularis extends the thigh, a prime mover of the leap.', { k: 'box', rot: [0, 0, -0.3], c: '#b06a6a' }),
        P('Semitendinosus', [0.65, 0.05, 0.25], [0.2, 0.06, 0.08], 'Bends the knee and steadies the leg mid-jump.', { k: 'box', rot: [0, 0, -0.4], c: '#a85a5a' }),
        P('Gastrocnemius', [0.8, 0.0, 0.28], [0.16, 0.07, 0.1], 'The calf muscle drives the ankle extension that ends the kick.', { k: 'box', rot: [0, 0, -0.5], c: '#b06a6a' }),
        P('Sartorius', [0.5, 0.1, 0.15], [0.24, 0.04, 0.05], 'A strap muscle flexing hip and knee together.', { k: 'box', rot: [0, 0, 0.3], c: '#a85a5a' }),
        P('Adductor magnus', [0.45, 0.05, 0.1], [0.16, 0.09, 0.09], 'Pulls the thigh in against the body for swimming strokes.', { k: 'box', c: '#9c5050' }),
        P('Gracilis', [0.6, 0.02, 0.15], [0.2, 0.04, 0.05], 'Adducts the leg and flexes the knee.', { k: 'box', rot: [0, 0, -0.2], c: '#a85a5a' }),
        P('Triceps brachii', [-0.45, 0.08, 0.3], [0.14, 0.06, 0.07], 'Extends the forearm when the frog pushes up or lands.', { k: 'box', rot: [0, 0, 0.4], c: '#b06a6a' }),
        P('Deltoid', [-0.5, 0.12, 0.28], [0.08, 0.07, 0.08], 'Raises the upper arm forward during landing absorption.', { k: 'sph', r: 0.04, c: '#a85a5a' }),
        P('Pectoralis', [-0.4, 0.02, 0.1], [0.12, 0.05, 0.09], 'Draws the arm across the chest.', { k: 'box', c: '#9c5050' }),
        P('Latissimus dorsi', [-0.35, 0.08, -0.15], [0.14, 0.05, 0.07], 'Pulls the arm back and down.', { k: 'box', rot: [0, 0, 0.2], c: '#a85a5a' }),
        P('Masseter', [-1.0, -0.02, 0.18], [0.08, 0.05, 0.07], 'Closes the jaw; frogs chew nothing, they swallow whole.', { k: 'box', c: '#b06a6a' }),
        P('Submandibularis', [-1.05, -0.06, 0.1], [0.1, 0.03, 0.1], 'Floor-of-mouth muscle assisting the buccal pump.', { k: 'box', c: '#a85a5a' }),
        P('Rectus abdominis', [-0.1, -0.08, 0.12], [0.3, 0.03, 0.09], 'The belly strap braces the trunk between hip and sternum.', { k: 'box', c: '#9c5050' }),
        P('Geniohyoid', [-1.1, -0.08, 0], [0.08, 0.02, 0.08], 'Pulls the hyoid forward, opening the throat for the next gulp of air.', { k: 'box', c: '#a85a5a' }),
      ],
      nervous: [
        ...chain(10, (i) => P(`Cranial nerve ${['I olfactory', 'II optic', 'III oculomotor', 'IV trochlear', 'V trigeminal', 'VI abducens', 'VII facial', 'VIII vestibulocochlear', 'IX glossopharyngeal', 'X vagus'][i]}`, [-0.8 - (i % 5) * 0.03, 0.06 - i * 0.008, (i < 5 ? 1 : -1) * (0.12 + (i % 5) * 0.02)], [0.012, 0.012, 0.07], `Cranial nerve ${['I olfactory (smell)', 'II optic (vision - frogs process movement first)', 'III oculomotor (eye muscles)', 'IV trochlear (superior oblique)', 'V trigeminal (face sensation, huge in frogs)', 'VI abducens (eye retraction)', 'VII facial (taste, hyoid)', 'VIII vestibulocochlear (hearing, balance)', 'IX glossopharyngeal (throat)', 'X vagus (heart, gut, skin glands)'][i]}: leaves the brain through its own skull foramen.`, { k: 'cyl', r: 0.005, h: 0.06, rot: [Math.PI / 2, 0, 0.3], c: '#f0e3a0', op: 0.9 })),
      ],
    },
  },
  cell: {
    parts: {
      synthesis: [
        ...chain(24, (i) => P(`Polysome cluster ${i}`, [Math.cos(i * 2.399) * (0.6 + (i % 7) * 0.2), 0.4 + (i % 5) * 0.25, Math.sin(i * 2.399) * (0.6 + (i % 7) * 0.2)], [0.07, 0.07, 0.07], `Cluster ${i}: ribosomes queue along one mRNA, translating it many times over before it degrades.`, { k: 'sph', r: 0.035, c: '#8fb8d8', op: 0.85 })),
        ...chain(6, (i) => P(`Proteasome ${i}`, [Math.cos(i * 1.05 + 2) * 1.5, 0.3 + (i % 3) * 0.5, Math.sin(i * 1.05 + 2) * 1.5], [0.07, 0.1, 0.07], `Proteasome ${i}: barrel-shaped shredders recycle ubiquitin-tagged proteins into peptides.`, { k: 'cyl', r: 0.032, h: 0.09, rot: [0.5, i, 0], c: '#7fa8c9', met: 0.2 })),
        ...chain(4, (i) => P(`Chaperonin cage ${i}`, [Math.cos(i * 1.57 + 0.7) * 1.2, 0.5 + (i % 2) * 0.7, Math.sin(i * 1.57 + 0.7) * 1.2], [0.09, 0.09, 0.09], `Chaperonin ${i}: Hsp60 barrels give unfolded proteins an isolation chamber to fold correctly.`, { k: 'sph', r: 0.045, c: '#9ad0c0', op: 0.85, sheen: 0.4 })),
      ],
      cytoskeleton: [
        ...chain(16, (i) => P(`Microtubule ray ${i}`, [0.5 + Math.cos(i * 2.399) * 0.7, 0.4 + (i % 3) * 0.15 - 0.15, -0.5 + Math.sin(i * 2.399) * 0.7], [0.02, 0.02, 0.02], `Ray ${i}: 25 nm microtubules radiate from the centrosome, the cell highways for kinesin and dynein traffic.`, { k: 'tube', pts: [[0.5, 0.4, -0.5], [0.5 + Math.cos(i * 2.399) * 1.5, 0.4 + ((i % 3) - 1) * 0.35, -0.5 + Math.sin(i * 2.399) * 1.5]], r: 0.008, c: '#7fa8c9', op: 0.8 })),
        ...chain(16, (i) => P(`Actin cortex filament ${i}`, [Math.cos(i * 0.39) * 1.98, 0.9 + ((i % 5) - 2) * 0.35, Math.sin(i * 0.39) * 1.98], [0.2, 0.02, 0.02], `Filament ${i}: a 7 nm actin mesh just under the membrane sets cell shape and drives crawling.`, { k: 'box', rot: [0, i * 0.39, 0], c: '#c98274', op: 0.8 })),
        ...chain(8, (i) => P(`Intermediate filament cable ${i}`, [-1.5 + i * 0.4, 0.3 + (i % 3) * 0.5, -1.2 + (i % 4) * 0.7], [0.03, 0.03, 0.03], `Cable ${i}: 10 nm keratin-type ropes give tensile strength, linking desmosome to desmosome.`, { k: 'tube', pts: [[-1.5 + i * 0.4, 0.3 + (i % 3) * 0.5, -1.2 + (i % 4) * 0.7], [-1.2 + i * 0.4, 1.5 - (i % 3) * 0.3, 1.2 - (i % 4) * 0.5]], r: 0.01, c: '#b98ad1', op: 0.75 })),
        ...chain(9, (i) => P(`Centriole triplet ${i + 1}`, [0.5 + Math.cos(i * 0.698) * 0.05, 0.52, -0.5 + Math.sin(i * 0.698) * 0.05], [0.02, 0.05, 0.02], `Triplet ${i + 1} of 9: the centriole wall is nine microtubule triplets, the 9+0 pattern that seeds every spindle pole.`, { k: 'cyl', r: 0.008, h: 0.045, c: '#9cc3de', op: 0.9 })),
      ],
      nucleus: [
        ...chain(24, (i) => P(`Nucleosome bead ${i}`, [Math.cos(i * 2.399) * (0.15 + (i % 4) * 0.13), 0.9 + ((i % 3) - 1) * 0.18, Math.sin(i * 2.399) * (0.15 + (i % 4) * 0.13)], [0.045, 0.045, 0.045], `Bead ${i}: 147 base pairs of DNA wrap each histone octamer, the first level of packing - beads on a string.`, { k: 'sph', r: 0.022, c: '#8d7ce0', op: 0.9 })),
        ...chain(6, (i) => P(`Chromatin loop ${i}`, [Math.cos(i * 1.05) * 0.35, 0.9 + Math.sin(i * 1.7) * 0.3, Math.sin(i * 1.05) * 0.35], [0.16, 0.04, 0.16], `Loop ${i}: CTCF-anchored loops bring distant enhancers to their genes.`, { k: 'tor', r: 0.075, t: 0.012, rot: [i * 0.5, i * 0.8, 0], c: '#6a5ac0', op: 0.8 })),
        ...chain(3, (i) => P(`Nuclear speckle ${i}`, [0.25 - i * 0.25, 1.1 - i * 0.12, 0.2 - i * 0.15], [0.09, 0.09, 0.09], `Speckle ${i}: splicing-factor depots that dock beside active genes.`, { k: 'sph', r: 0.045, c: '#b98ad1', op: 0.6 })),
        ...chain(2, (i) => P(`Cajal body ${i}`, [i ? -0.3 : 0.32, 1.0, i ? 0.25 : -0.2], [0.06, 0.06, 0.06], `Cajal body ${i}: sites where snRNPs are matured before splicing duty.`, { k: 'sph', r: 0.03, c: '#9a8ae8', op: 0.7 })),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS8A)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 8B — Atlas-parity program, part 2 (docs/KEV_ATLAS_EXPANSION.md).
// Same enumeration discipline for the engineered and planetary worlds:
// root hairs and stomatal complexes counted one by one; suspension-bridge
// truss panels, hangers and deck segments enumerated; every EV battery
// module gets cell stacks and busbars, plus inverter, motor, gearbox and
// chassis insets; locomotive fire-tube bundle, staybolts and both sides of
// the Walschaerts gear; rocket TPS tiles, weld rings and the drone ship;
// Giza upper courses extended toward the real ~201-course count; Earth named
// plates, currents, rivers, ranges, biomes and circulation cells; violin
// first-position semitone stops. Sources: Taiz & Zeiger plant physiology;
// bridge-engineering truss nomenclature; YoCharge/EV pack teardowns;
// Walschaerts valve gear diagrams; Falcon user guide TPS layout;
// Lehner Complete Pyramids (201 courses); NOAA plate-current-biome tables;
// violin pedagogy first-position charts.
const PASS8B = {
  plants: {
    parts: {
      roots: [
        ...chain(30, (i) => P(`Root hair ${i}`, [(i % 2 ? 0.22 : -0.22), -1.55 + i * 0.035, (i % 3 - 1) * 0.04], [0.09, 0.012, 0.012], `Hair ${i}: single-cell extensions that multiply the absorbing surface; a rye plant grows billions of them.`, { k: 'cyl', r: 0.005, h: 0.08, rot: [0, 0, Math.PI / 2], c: '#e8d8b0', op: 0.85 })),
      ],
      photosynthesis: [
        ...chain(10, (i) => P(`Stomatal complex ${i}`, [-1.0 + (i % 5) * 0.5, 2.66, i < 5 ? 0.35 : -0.35], [0.07, 0.01, 0.05], `Complex ${i}: two guard cells ring a pore; potassium pumping swells them open for CO2 and loses water by transpiration.`, { k: 'tor', r: 0.028, t: 0.007, rot: [Math.PI / 2, 0, 0], c: '#7fa35c', op: 0.9 })),
        ...chain(8, (i) => P(`Leaf trichome ${i}`, [0.14, 0.8 + i * 0.14, 0.06 - (i % 3) * 0.03], [0.02, 0.05, 0.02], `Trichome ${i}: hair-like outgrowths shade the leaf, trap humidity and deter insects.`, { k: 'cone', r: 0.01, h: 0.05, c: '#c8d957', op: 0.7 })),
        ...chain(8, (i) => P(`Palisade mesophyll column ${i}`, [-0.9 + (i % 4) * 0.6, 2.56, i < 4 ? 0.3 : -0.3], [0.1, 0.14, 0.1], `Column ${i}: tightly packed chloroplast-rich cells do most of the photosynthesis.`, { k: 'box', c: '#5ca66b', op: 0.75 })),
        ...chain(8, (i) => P(`Spongy mesophyll pocket ${i}`, [-0.8 + (i % 4) * 0.55, 2.5, i < 4 ? -0.25 : 0.25], [0.12, 0.08, 0.12], `Pocket ${i}: loose cells leave air spaces so CO2 reaches every chloroplast.`, { k: 'box', c: '#7fc08a', op: 0.5 })),
        ...chain(16, (i) => P(`Granum stack ${i}`, [-1.0 + (i % 8) * 0.28, 2.57, i < 8 ? 0.45 : -0.45], [0.045, 0.05, 0.045], `Granum ${i}: stacked thylakoid discs hold the light-harvesting complexes; the stroma around them runs the Calvin cycle.`, { k: 'cyl', r: 0.02, h: 0.045, c: '#3a7a4a', op: 0.9 })),
      ],
      vascular: [
        ...chain(8, (i) => P(`Sieve tube element ${i}`, [0.06, 0.1 + i * 0.18, 0.05], [0.04, 0.16, 0.04], `Element ${i}: living but nucleus-free phloem cells stacked end to end; sieve plates connect them for sugar flow.`, { k: 'cyl', r: 0.018, h: 0.16, c: '#9ad0c0', op: 0.85 })),
        ...chain(8, (i) => P(`Companion cell ${i}`, [0.1, 0.1 + i * 0.18, 0.05], [0.028, 0.14, 0.028], `Cell ${i}: each companion cell runs the metabolism for its sieve tube partner, loading and unloading sugar.`, { k: 'cyl', r: 0.012, h: 0.14, c: '#7fa8c9', op: 0.85 })),
        ...chain(8, (i) => P(`Xylem vessel ${i}`, [-0.04, 0.1 + i * 0.18, -0.05], [0.05, 0.17, 0.05], `Vessel ${i}: dead, lignified tubes spiralled or pitted against collapse; water climbs them under tension.`, { k: 'cyl', r: 0.022, h: 0.17, c: '#a08050', op: 0.8 })),
      ],
    },
  },
  engineering: {
    parts: {
      structure: [
        ...chain(40, (i) => P(`Truss panel ${Math.floor(i / 4) + 1} - ${['top chord', 'bottom chord', 'diagonal', 'vertical'][i % 4]}`, [-1.71 + Math.floor(i / 4) * 0.38, i % 4 === 0 ? 1.35 : i % 4 === 1 ? 0.9 : i % 4 === 2 ? 1.12 : 1.12, 0.58], i % 4 === 0 || i % 4 === 1 ? [0.38, 0.035, 0.035] : i % 4 === 2 ? [0.5, 0.03, 0.03] : [0.03, 0.45, 0.03], `Panel ${Math.floor(i / 4) + 1} ${['top chord: compression along the crown', 'bottom chord: tension along the deck', 'diagonal: carries shear between panels', 'vertical post: transfers deck load up'][i % 4]}.`, i % 4 === 2 ? { k: 'box', rot: [0, 0, Math.floor(i / 4) % 2 ? 0.9 : -0.9], c: '#9a9a9a', met: 0.6, rgh: 0.35 } : { k: 'box', c: '#b0b8c0', met: 0.6, rgh: 0.35 })),
        ...chain(12, (i) => P(`Deck segment ${i}`, [-1.74 + i * 0.32, 0.86, 0], [0.32, 0.03, 1.1], `Segment ${i} of 12: the deck is built in segments so it can expand and be replaced piecewise.`, { k: 'box', c: '#8a8a92', met: 0.4, rgh: 0.5 })),
        ...chain(10, (i) => P(`Floor beam ${i}`, [-1.8 + i * 0.4, 0.8, 0], [0.05, 0.07, 1.2], `Beam ${i}: floor beams hang between trusses and carry the deck panels.`, { k: 'box', c: '#9a9a9a', met: 0.5, rgh: 0.4 })),
        ...chain(12, (i) => P(`Stringer ${i}`, [0, 0.82, -0.5 + i * 0.09], [3.6, 0.03, 0.03], `Stringer ${i}: longitudinal beams spreading wheel loads onto the floor beams.`, { k: 'box', c: '#b0b8c0', met: 0.5, rgh: 0.4 })),
      ],
      cables: [
        ...chain(16, (i) => P(`Suspender hanger ${i}`, [-1.8 + i * 0.24, 0.85 + (1 - Math.pow(Math.abs(-1.8 + i * 0.24) / 1.2, 2)) * 0.675 + 0.85 / 2, (i % 2 ? 0.5 : -0.5)], [0.02, 0.02, 0.02], `Hanger ${i}: verticals drop from the cable parabola to the deck, each carrying its share of the span.`, { k: 'cyl', r: 0.008, h: Math.max(0.1, (1 - Math.pow(Math.abs(-1.8 + i * 0.24) / 1.2, 2)) * 1.35), c: '#d0d8e0', met: 0.7, rgh: 0.3 })),
        ...chain(6, (i) => P(`Cable band ${i}`, [-1.5 + i * 0.55, 0.9 + (1 - Math.pow(Math.abs(-1.5 + i * 0.55) / 1.2, 2)) * 1.28, (i % 2 ? 0.5 : -0.5)], [0.07, 0.07, 0.05], `Band ${i}: machined steel saddles clamp the cable and pin each hanger.`, { k: 'tor', r: 0.03, t: 0.01, rot: [0, Math.PI / 2, 0], c: '#9a9a9a', met: 0.7, rgh: 0.3 })),
        ...chain(8, (i) => P(`Cable strand marker ${i}`, [-1.6 + i * 0.45, 0.85 + (1 - Math.pow(Math.abs(-1.6 + i * 0.45) / 1.2, 2)) * 1.3, 0], [0.1, 0.1, 0.02], `Marker ${i}: each main cable bundles thousands of parallel galvanised wires spun in place or hoisted as strands.`, { k: 'tor', r: 0.045, t: 0.008, rot: [0, Math.PI / 2, 0], c: '#e0e0e0', met: 0.8, rgh: 0.25 })),
      ],
      substructure: [
        ...chain(4, (i) => P(`Bearing ${i}`, [(i < 2 ? -1 : 1) * 1.9, 0.62, (i % 2 ? 0.5 : -0.5)], [0.14, 0.08, 0.14], `Bearing ${i}: elastomeric or rocker bearings let the deck expand and rotate without tearing the piers.`, { k: 'box', c: '#4a4a52', rgh: 0.7 })),
        ...chain(2, (i) => P(`Expansion joint ${i}`, [(i ? -1 : 1) * 1.2, 0.87, 0], [0.02, 0.012, 1.1], `Joint ${i}: finger or modular joints absorb the daily thermal stretch of the deck.`, { k: 'box', c: '#8a8a92', met: 0.6, rgh: 0.35 })),
        ...chain(2, (i) => P(`Wind fairing ${i}`, [0, 0.85, (i ? -1 : 1) * 0.62], [3.6, 0.02, 0.06], `Fairing ${i}: shaped edges stop the deck fluttering in wind - the lesson of Tacoma Narrows.`, { k: 'box', rot: [(i ? -1 : 1) * 0.3, 0, 0], c: '#b0b8c0', met: 0.4, rgh: 0.4 })),
      ],
    },
  },
  vehicle: {
    parts: {
      energy: [
        ...chain(24, (i) => P(`Cell stack marker ${Math.floor(i / 2) + 1}${i % 2 ? 'b' : 'a'}`, [-1.15 + (Math.floor(i / 2) % 6) * 0.42, 0.28, (Math.floor(i / 2) < 6 ? -0.35 : 0.35) + (i % 2 ? 0.12 : -0.12)], [0.3, 0.2, 0.12], `Stack ${Math.floor(i / 2) + 1}: pouch or prismatic cells packed in series-parallel groups; one module holds kilowatt-hours in a shoebox.`, { k: 'box', c: '#4a9a86', op: 0.8 })),
        ...chain(12, (i) => P(`Module busbar ${i}`, [-1.15 + (i % 6) * 0.42, 0.42, i < 6 ? -0.35 : 0.35], [0.34, 0.012, 0.04], `Busbar ${i}: copper links weld module terminals together; a loose busbar is an arc-flash hazard.`, { k: 'box', c: '#b08840', met: 0.9, rgh: 0.25 })),
        ...chain(3, (i) => P(`Main contactor ${i}`, [1.25, 0.4 + i * 0.07, 0], [0.08, 0.06, 0.1], `Contactor ${i}: pyro-safe relays that physically disconnect the pack from the car in a crash.`, { k: 'box', c: '#c0504d', met: 0.3, rgh: 0.5 })),
        P('HV junction box', [1.25, 0.58, 0.15], [0.16, 0.1, 0.14], 'The junction box routes pack power through fuses, contactors and sensors.', { k: 'box', c: '#e6a65d', met: 0.3, rgh: 0.5 }),
        ...chain(2, (i) => P(`Pyrofuse ${i}`, [1.25, 0.52, (i ? -0.2 : -0.1)], [0.05, 0.05, 0.07], `Pyrofuse ${i}: an explosive-driven cut that isolates the pack in milliseconds on airbag deployment.`, { k: 'cyl', r: 0.022, h: 0.06, c: '#c0504d', met: 0.4 })),
        P('BMS master controller', [0, 0.5, 0.8], [0.2, 0.05, 0.12], 'The master BMS balances cells, watches temperatures and sets charge limits.', { k: 'box', c: '#2a2a3a', met: 0.4, rgh: 0.4 }),
        ...chain(6, (i) => P(`BMS slave board ${i}`, [-1.15 + (i % 6) * 0.42, 0.44, i < 3 ? -0.62 : 0.62], [0.08, 0.02, 0.06], `Slave ${i}: cell-monitoring boards read every cell voltage and temperature at the module.`, { k: 'box', c: '#3a8a56', met: 0.3, rgh: 0.5 })),
        ...chain(4, (i) => P(`Coolant manifold ${i}`, [(i < 2 ? -1 : 1) * 1.3, 0.16, (i % 2 ? 0.7 : -0.7)], [0.05, 0.05, 1.3], `Manifold ${i}: glycol loops snake between modules holding the pack in its 20-40 degreeC window.`, { k: 'cyl', r: 0.02, h: 1.2, rot: [Math.PI / 2, 0, 0], c: '#79b9d3', op: 0.85 })),
      ],
      electronics: [
        ...chain(6, (i) => P(`IGBT power module ${i} (inverter inset)`, [1.35 + (i % 3) * 0.13, 0.7, -0.75 + Math.floor(i / 3) * 0.13], [0.1, 0.05, 0.1], `IGBT ${i} of 6 (inset): silicon-carbide or IGBT switches chop 400-800 V DC into three-phase AC thousands of times a second.`, { k: 'box', c: '#2a2a3a', met: 0.5, rgh: 0.4 })),
        ...chain(2, (i) => P(`DC-link capacitor ${i} (inverter inset)`, [1.3 + i * 0.35, 0.78, -0.6], [0.09, 0.12, 0.09], `Capacitor ${i} (inset): the DC link soaks up switching ripple and keeps bus voltage steady.`, { k: 'cyl', r: 0.04, h: 0.11, c: '#4a6a7a', met: 0.4 })),
        P('Gate driver board (inverter inset)', [1.45, 0.82, -0.75], [0.14, 0.02, 0.1], 'Gate drivers fire each IGBT with precise nanosecond timing (inset).', { k: 'box', c: '#3a8a56', met: 0.3, rgh: 0.5 }),
        P('Busbar assembly (inverter inset)', [1.5, 0.62, -0.68], [0.03, 0.18, 0.24], 'Laminated busbars carry hundreds of amps with minimal inductance (inset).', { k: 'box', c: '#b08840', met: 0.9, rgh: 0.25 }),
        ...chain(2, (i) => P(`Current sensor ${i} (inverter inset)`, [1.28 + i * 0.4, 0.64, -0.8], [0.05, 0.05, 0.05], `Sensor ${i} (inset): Hall-effect rings measure motor current for torque control.`, { k: 'tor', r: 0.02, t: 0.006, c: '#9cc3de', met: 0.5 })),
        P('EMI filter (inverter inset)', [1.62, 0.72, -0.66], [0.08, 0.08, 0.1], 'The filter tames switching noise before it radiates into the 12 V systems (inset).', { k: 'box', c: '#8a8a92', met: 0.4, rgh: 0.5 }),
      ],
      powertrain: [
        ...chain(6, (i) => P(`Stator winding end-turn ${i} (motor inset)`, [1.5 + Math.cos(i * 1.047) * 0.13, 0.35, 0.5 + Math.sin(i * 1.047) * 0.13], [0.03, 0.03, 0.03], `End-turn ${i} (inset): hairpin windings loop out of the stator slots; the ends are the hot spot of any EV motor.`, { k: 'tor', r: 0.014, t: 0.005, rot: [i, 0, 0], c: '#b08840', met: 0.8, rgh: 0.3 })),
        P('Rotor lamination stack (motor inset)', [1.5, 0.35, 0.5], [0.18, 0.18, 0.24], 'Thin insulated laminations cut eddy losses in the spinning rotor (inset).', { k: 'cyl', r: 0.09, h: 0.22, rot: [Math.PI / 2, 0, 0], c: '#4a4a52', met: 0.7, rgh: 0.35 }),
        P('Resolver (motor inset)', [1.5, 0.35, 0.66], [0.09, 0.09, 0.04], 'The resolver tells the inverter the rotor angle to a fraction of a degree (inset).', { k: 'cyl', r: 0.045, h: 0.035, rot: [Math.PI / 2, 0, 0], c: '#9cc3de', met: 0.5 }),
        P('Oil cooling jacket (motor inset)', [1.5, 0.35, 0.5], [0.22, 0.22, 0.28], 'Dielectric oil sprays straight onto the end-windings (inset).', { k: 'cyl', r: 0.105, h: 0.26, rot: [Math.PI / 2, 0, 0], c: '#e6a65d', op: 0.25 }),
        ...chain(2, (i) => P(`Reduction gear ${i} (gearbox inset)`, [1.72 + i * 0.12, 0.35, 0.5], [0.14, 0.14, 0.05], `Gear ${i} (inset): a single or two-speed helical set drops ~16,000 rpm to wheel speed.`, { k: 'cyl', r: 0.07 - i * 0.02, h: 0.045, rot: [Math.PI / 2, 0, 0], c: '#b0b8c0', met: 0.8, rgh: 0.25 })),
        P('Differential (gearbox inset)', [1.96, 0.35, 0.5], [0.1, 0.1, 0.1], 'The differential splits torque so wheels turn at different speeds in corners (inset).', { k: 'sph', r: 0.05, c: '#8a8a92', met: 0.7, rgh: 0.3 }),
        ...chain(2, (i) => P(`Halfshaft ${i}`, [(i ? 1.2 : -1.2), 0.22, (i ? 0.62 : -0.62)], [0.5, 0.05, 0.05], `Halfshaft ${i}: constant-velocity shafts deliver torque to the wheels through every steering angle.`, { k: 'cyl', r: 0.022, h: 0.5, rot: [0, 0, Math.PI / 2], c: '#9a9a9a', met: 0.8, rgh: 0.3 })),
        P('Parking pawl (gearbox inset)', [1.96, 0.44, 0.44], [0.04, 0.06, 0.04], 'A spring-loaded pawl that locks the output shaft in Park (inset).', { k: 'box', rot: [0, 0, 0.4], c: '#c0504d', met: 0.5 }),
      ],
      chassis: [
        ...chain(4, (i) => P(`Brake disc ${i}`, [(i < 2 ? -1 : 1) * 1.35, 0.14, (i % 2 ? 0.75 : -0.75)], [0.19, 0.19, 0.02], `Disc ${i}: EVs brake mostly by regen, so friction discs run cooler and last longer - but can corrode from disuse.`, { k: 'tor', r: 0.085, t: 0.014, rot: [0, Math.PI / 2, 0], c: '#8a8a92', met: 0.8, rgh: 0.35 })),
        ...chain(4, (i) => P(`Brake caliper ${i}`, [(i < 2 ? -1 : 1) * 1.35, 0.2, (i % 2 ? 0.75 : -0.75)], [0.09, 0.09, 0.05], `Caliper ${i}: floating calipers clamp the disc; the iBooster blends regen and friction seamlessly.`, { k: 'box', c: '#c0504d', met: 0.4, rgh: 0.5 })),
        ...chain(4, (i) => P(`Control arm ${i}`, [(i < 2 ? -1 : 1) * 1.2, 0.1, (i % 2 ? 0.7 : -0.7)], [0.3, 0.04, 0.06], `Arm ${i}: forged-aluminium arms locate each wheel; forged links save mass over stamped steel.`, { k: 'box', rot: [0, (i % 2 ? 0.3 : -0.3), 0], c: '#b0b8c0', met: 0.7, rgh: 0.3 })),
        ...chain(4, (i) => P(`Damper strut ${i}`, [(i < 2 ? -1 : 1) * 1.3, 0.3, (i % 2 ? 0.72 : -0.72)], [0.07, 0.3, 0.07], `Strut ${i}: adaptive dampers stiffen for cornering and soften for range-saving comfort.`, { k: 'cyl', r: 0.03, h: 0.28, c: '#4a4a52', met: 0.6, rgh: 0.4 })),
        P('Anti-roll bar', [0, 0.08, 0.7], [2.4, 0.03, 0.03], 'A torsion bar linking left and right suspension to flatten cornering roll.', { k: 'cyl', r: 0.014, h: 2.3, rot: [0, 0, Math.PI / 2], c: '#9a9a9a', met: 0.7, rgh: 0.35 }),
      ],
    },
  },
  locomotive: {
    parts: {
      boiler: [
        ...chain(24, (i) => P(`Fire tube ${i}`, [Math.cos(i * 2.399) * 0.16 - 0.5, 0.75 + Math.sin(i * 2.399) * 0.16, Math.cos(i * 1.3 + 1) * 0.16], [0.024, 0.024, 0.024], `Tube ${i} of ~150: hot gas races through the water-filled barrel, dumping most of its heat here.`, { k: 'tube', pts: [[-1.4, 0.75 + Math.sin(i * 2.399) * 0.16, Math.cos(i * 2.399) * 0.16], [0.35, 0.75 + Math.sin(i * 2.399) * 0.16, Math.cos(i * 2.399) * 0.16]], r: 0.011, c: '#8a6a4a', met: 0.5, op: 0.9 })),
        ...chain(4, (i) => P(`Superheater flue ${i}`, [(i % 2 ? -0.8 : -0.2), 0.75 + (i < 2 ? 0.1 : -0.1), (i < 2 ? 0.12 : -0.12)], [0.05, 0.05, 0.05], `Flue ${i}: big flues carry the superheater elements that dry the steam for extra power.`, { k: 'tube', pts: [[-1.4, 0.75 + (i < 2 ? 0.1 : -0.1), (i < 2 ? 0.12 : -0.12)], [0.35, 0.75 + (i < 2 ? 0.1 : -0.1), (i < 2 ? 0.12 : -0.12)]], r: 0.022, c: '#9a7a5a', met: 0.5, op: 0.9 })),
        ...chain(24, (i) => P(`Staybolt ${i}`, [0.6 + Math.cos(i * 1.309) * 0.28, 0.6 + Math.sin(i * 1.309) * 0.28, Math.cos(i * 0.7) * 0.24], [0.02, 0.02, 0.02], `Stay ${i} of hundreds: copper or steel bolts tie the firebox sheets against 200 psi of water pressure; a weeping stay warns of fatigue.`, { k: 'cyl', r: 0.008, h: 0.02, rot: [i, 0, i], c: '#b08840', met: 0.8, rgh: 0.3 })),
        ...chain(6, (i) => P(`Washout plug ${i}`, [-1.2 + i * 0.3, 0.44, (i % 2 ? 0.05 : -0.05)], [0.03, 0.03, 0.03], `Plug ${i}: removable plugs let crews flush mud and scale out of the water space.`, { k: 'cyl', r: 0.014, h: 0.028, c: '#9a9a9a', met: 0.7, rgh: 0.35 })),
        ...chain(2, (i) => P(`Safety valve ${i}`, [i * 0.12, 1.1, 0], [0.05, 0.08, 0.05], `Valve ${i}: spring-loaded valves lift before the boiler can ever exceed its working pressure.`, { k: 'cyl', r: 0.022, h: 0.07, c: '#b08840', met: 0.8, rgh: 0.25 })),
        P('Regulator valve', [-0.6, 1.02, 0], [0.1, 0.06, 0.08], 'The regulator in the steam dome is the driver throttle, metering dry steam to the chests.', { k: 'box', c: '#9a9a9a', met: 0.7, rgh: 0.3 }),
        P('Blower valve', [-1.2, 1.02, 0.15], [0.05, 0.05, 0.05], 'The blower sends steam up the chimney to keep draught alive while stationary.', { k: 'cyl', r: 0.02, h: 0.05, c: '#b08840', met: 0.7 }),
        ...chain(2, (i) => P(`Snifting valve ${i}`, [-0.9, 1.05, (i ? 0.1 : -0.1)], [0.04, 0.05, 0.04], `Snifter ${i}: admits air on the coast so cylinders do not suck in ash or vacuum-lock.`, { k: 'cone', r: 0.016, h: 0.045, c: '#9a9a9a', met: 0.7 })),
        P('Superheater header', [-1.35, 0.75, 0], [0.08, 0.2, 0.2], 'The header splits steam into the elements and collects it superheated again.', { k: 'box', c: '#8a8a92', met: 0.6, rgh: 0.4 }),
      ],
      valvegear: [
        ...chain(2, (i) => P(`Combination lever ${i}`, [-0.55, 0.45, (i ? -1 : 1) * 0.5], [0.02, 0.14, 0.04], `Lever ${i}: mixes crosshead motion with the radius rod to set the cutoff.`, { k: 'box', c: '#d0d8e0', met: 0.6, rgh: 0.35 })),
        ...chain(2, (i) => P(`Expansion link ${i}`, [-0.45, 0.4, (i ? -1 : 1) * 0.52], [0.03, 0.2, 0.05], `Link ${i}: the slotted curved link the radius rod slides in - lifting it reverses the engine.`, { k: 'box', rot: [0, 0, 0.25], c: '#d0d8e0', met: 0.6, rgh: 0.35 })),
        ...chain(2, (i) => P(`Radius rod ${i}`, [-0.5, 0.42, (i ? -1 : 1) * 0.5], [0.3, 0.02, 0.03], `Rod ${i}: its block rides the expansion link; its height sets forward, neutral or reverse.`, { k: 'box', c: '#c0c8d0', met: 0.6, rgh: 0.35 })),
        ...chain(2, (i) => P(`Eccentric crank ${i}`, [-0.1, 0.35, (i ? -1 : 1) * 0.5], [0.08, 0.08, 0.03], `Crank ${i}: pinned to the driving axle, it drives the whole gear from wheel rotation.`, { k: 'box', rot: [0, 0, 0.6], c: '#b0b8c0', met: 0.7, rgh: 0.3 })),
        ...chain(2, (i) => P(`Eccentric rod ${i}`, [-0.35, 0.4, (i ? -1 : 1) * 0.5], [0.35, 0.02, 0.03], `Rod ${i}: carries the crank motion back to the expansion link.`, { k: 'box', c: '#c0c8d0', met: 0.6, rgh: 0.35 })),
        ...chain(2, (i) => P(`Reach rod ${i}`, [0.1, 0.5, (i ? -1 : 1) * 0.4], [0.5, 0.02, 0.02], `Rod ${i}: runs to the cab reversing lever - the driver pulls it to change cutoff.`, { k: 'box', c: '#b0b8c0', met: 0.6, rgh: 0.35 })),
        ...chain(2, (i) => P(`Union link ${i}`, [-0.62, 0.4, (i ? -1 : 1) * 0.48], [0.1, 0.02, 0.02], `Link ${i}: short link feeding crosshead motion into the combination lever.`, { k: 'box', rot: [0, 0, 0.5], c: '#c0c8d0', met: 0.6 })),
        ...chain(2, (i) => P(`Lifting link ${i}`, [-0.2, 0.55, (i ? -1 : 1) * 0.45], [0.02, 0.12, 0.03], `Link ${i}: raises and lowers the radius rod when the reverser moves.`, { k: 'box', c: '#b0b8c0', met: 0.6 })),
      ],
      motion: [
        ...chain(2, (i) => P(`Piston rod ${i}`, [-1.05, 0.42, (i ? -1 : 1) * 0.46], [0.4, 0.03, 0.03], `Rod ${i}: links the crosshead through the stuffing box to the piston inside the cylinder.`, { k: 'cyl', r: 0.014, h: 0.38, rot: [0, 0, Math.PI / 2], c: '#d0d8e0', met: 0.8, rgh: 0.25 })),
        ...chain(2, (i) => P(`Crosshead guide ${i}`, [-0.9, 0.42, (i ? -1 : 1) * 0.47], [0.24, 0.05, 0.02], `Guide ${i}: keeps the crosshead travelling straight so the rod cannot whip.`, { k: 'box', c: '#9a9a9a', met: 0.7, rgh: 0.35 })),
      ],
      frame: [
        ...chain(2, (i) => P(`Main frame plate ${i}`, [0, 0.4, (i ? -1 : 1) * 0.4], [3.2, 0.14, 0.035], `Frame ${i}: the heavy inside plates carry every load path from cylinders to tender drawbar.`, { k: 'box', c: '#4a4a52', met: 0.6, rgh: 0.45 })),
        ...chain(6, (i) => P(`Hornblock ${i}`, [-0.9 + (i % 3) * 0.9, 0.42, (i < 3 ? -1 : 1) * 0.44], [0.12, 0.2, 0.05], `Hornblock ${i}: machined jaws hold each axlebox on its vertical path.`, { k: 'box', c: '#5a5a62', met: 0.6, rgh: 0.45 })),
        ...chain(6, (i) => P(`Axlebox ${i}`, [-0.9 + (i % 3) * 0.9, 0.35, (i < 3 ? -1 : 1) * 0.46], [0.1, 0.12, 0.07], `Axlebox ${i}: white-metal bearings in oil-bath boxes take the whole locomotive weight.`, { k: 'box', c: '#8a8a92', met: 0.7, rgh: 0.3 })),
        ...chain(6, (i) => P(`Leaf spring ${i}`, [-0.9 + (i % 3) * 0.9, 0.52, (i < 3 ? -1 : 1) * 0.42], [0.3, 0.05, 0.05], `Spring ${i}: laminated steel springs equalise track shocks across the axles.`, { k: 'box', c: '#6a6a72', met: 0.6, rgh: 0.4 })),
        ...chain(4, (i) => P(`Equalising beam ${i}`, [-0.45 + (i % 2) * 0.9, 0.56, (i < 2 ? -1 : 1) * 0.4], [0.5, 0.03, 0.04], `Beam ${i}: links neighbouring springs so a track dip loads three axles, not one.`, { k: 'box', c: '#7a7a82', met: 0.6, rgh: 0.4 })),
        ...chain(4, (i) => P(`Spring hanger ${i}`, [-0.45 + (i % 2) * 0.9, 0.5, (i < 2 ? -1 : 1) * 0.43], [0.03, 0.1, 0.03], `Hanger ${i}: pivots hang the springs from the frame so they can swing.`, { k: 'cyl', r: 0.012, h: 0.09, c: '#6a6a72', met: 0.6 })),
      ],
      cab: [
        P('Spectacle plate', [0.95, 0.9, 0], [0.05, 0.6, 0.9], 'The cab front wall, pierced by the two look-out windows the fireman watches through.', { k: 'box', c: '#3a3a3a', met: 0.5, rgh: 0.5 }),
        P('Cab roof', [1.25, 1.25, 0], [0.7, 0.03, 1.0], 'A light steel roof shades the crew from sun and locomotive heat.', { k: 'box', c: '#2a2a2a', met: 0.5, rgh: 0.5 }),
        ...chain(2, (i) => P(`Cab side sheet ${i}`, [1.25, 0.9, (i ? -1 : 1) * 0.48], [0.6, 0.6, 0.03], `Side sheet ${i}: cab sides carry tool racks, the water-gauge glass and the brake handles.`, { k: 'box', c: '#3a3a3a', met: 0.5, rgh: 0.5 })),
      ],
    },
  },
  rocket: {
    parts: {
      stage1: [
        ...chain(40, (i) => P(`TPS tile ${i}`, [Math.cos(Math.floor(i / 5) * 0.628) * 0.485, 0.2 + (i % 5) * 0.42, Math.sin(Math.floor(i / 5) * 0.628) * 0.485], [0.1, 0.3, 0.02], `Tile ${i}: black thermal-protection tiles and cork ablative patches shield the skin from re-entry heating.`, { k: 'box', rot: [0, -Math.floor(i / 5) * 0.628, 0], c: '#1a1a1e', rgh: 0.85 })),
        ...chain(8, (i) => P(`Tank weld ring ${i}`, [0, 0.15 + i * 0.28, 0], [0.98, 0.02, 0.98], `Weld ring ${i}: friction-stirred welds join barrel sections; every ring is X-rayed.`, { k: 'tor', r: 0.485, t: 0.008, rot: [Math.PI / 2, 0, 0], c: '#8a8a92', met: 0.8, rgh: 0.3 })),
        ...chain(8, (i) => P(`Ring frame ${i}`, [0, 0.28 + i * 0.26, 0], [0.94, 0.03, 0.94], `Frame ${i}: internal ring frames keep the thin aluminium skin from buckling under load.`, { k: 'tor', r: 0.46, t: 0.014, rot: [Math.PI / 2, 0, 0], c: '#6a6a72', met: 0.7, rgh: 0.35 })),
      ],
      engines: [
        ...chain(2, (i) => P(`Nozzle skirt extension ${i}`, [(i ? -1 : 1) * 0.3, 0.02, 0], [0.22, 0.08, 0.22], `Extension ${i}: a thin niobium skirt widens the expansion ratio for vacuum-optimised thrust.`, { k: 'cone', r: 0.1, h: 0.07, rot: [Math.PI, 0, 0], c: '#9a9aa2', met: 0.75, rgh: 0.3, op: 0.9 })),
      ],
      payload: [
        ...chain(2, (i) => P(`Payload rack ${i}`, [0, 4.1, (i ? -1 : 1) * 0.15], [0.3, 0.04, 0.08], `Rack ${i}: standard rails and fittings bolt the payload to the adapter (inset).`, { k: 'box', c: '#8a8a92', met: 0.6, rgh: 0.4 })),
        ...chain(4, (i) => P(`Fairing vent ${i}`, [(i < 2 ? -1 : 1) * 0.4, 4.3 + (i % 2) * 0.2, 0], [0.06, 0.1, 0.02], `Vent ${i}: slots let the fairing equalise pressure during the climb so it cannot implode or burst.`, { k: 'box', c: '#c8c0a8', met: 0.3 })),
      ],
      ground: [
        P('Drone ship deck (ASDS)', [2.9, -0.03, 1.1], [1.2, 0.04, 0.6], 'An autonomous spaceport drone ship stations itself downrange where the booster lands after high-energy missions.', { k: 'box', c: '#d8d0c0', rgh: 0.6 }),
        ...chain(4, (i) => P(`Drone ship leg ${i}`, [2.9 + (i < 2 ? -0.5 : 0.5), -0.08, 1.1 + (i % 2 ? -0.25 : 0.25)], [0.06, 0.1, 0.06], `Leg ${i}: the ship rides on dynamic positioning thrusters, holding station within metres.`, { k: 'box', c: '#8a8a92', met: 0.5, rgh: 0.5 })),
        P('Drone ship keep-out ring', [2.9, -0.02, 1.1], [1.5, 0.01, 0.9], 'The painted keep-out zone marks where no crew may stand during landing attempts.', { k: 'tor', r: 0.7, t: 0.015, rot: [Math.PI / 2, 0, 0], c: '#e6a65d', op: 0.5 }),
      ],
    },
  },
  giza: {
    parts: {
      structure: [
        ...chain(160, (i) => P(`Core course ${41 + i} (upper)`, [0, 2.6 + i * 0.0135, 0], [2 * 0.27 * (1 - i / 161), 0.0125, 2 * 0.27 * (1 - i / 161)], `Course ${41 + i} of ~201: the pyramid rises in roughly 201 courses, each set back; upper courses shown scale-compressed.`, i % 2 ? { c: '#c9b98a' } : { c: '#d8c08a' })),
      ],
      casing: [
        ...chain(24, (i) => P(`Casing stone ${25 + i} (south face)`, [-1.8 + (i % 12) * 0.33, 0.16 + Math.floor(i / 12) * 0.38, 1.95 - Math.floor(i / 12) * 0.14], [0.3, 0.32, 0.07], `Casing ${25 + i}: Tura limestone casing blocks were dressed to 52-degree faces with hairline joints; most were quarried away for Cairo.`, { c: '#efe6cf', rgh: 0.35, cc: 0.3 })),
      ],
      passages: [
        ...chain(14, (i) => P(`Gallery corbel course ${i}`, [0.15 + (-0.6 + i * 0.09) * 0.9, 0.85 + (-0.6 + i * 0.09) * 0.44, 0.18 + (i % 2 ? 0.07 : -0.07)], [0.1, 0.08, 0.03], `Corbel ${i}: each Grand Gallery course overhangs the one below, cantilevering the 8 m-high roof inward.`, { c: '#d8a08a', rgh: 0.6 })),
      ],
    },
  },
  earth: {
    parts: {
      tectonics: [
        ...chain(14, (i) => P(`${['Pacific plate', 'North American plate', 'South American plate', 'African plate', 'Eurasian plate', 'Indo-Australian plate', 'Antarctic plate', 'Nazca plate', 'Cocos plate', 'Caribbean plate', 'Philippine Sea plate', 'Scotia plate', 'Arabian plate', 'Juan de Fuca plate'][i]}`, [Math.cos(i * 2.24) * (0.5 + (i % 4) * 0.2), 1.335, Math.sin(i * 2.24) * (0.5 + (i % 4) * 0.2)], [0.4, 0.012, 0.3], `One of 7 major and 7 minor plates: rigid lithosphere drifting 1-10 cm a year over the asthenosphere.`, { k: 'box', rot: [0, i * 0.9, 0], c: ['#c0504d', '#8fb8d8', '#7fa35c', '#d8b25c', '#b98ad1', '#9ad0c0', '#e0c896'][i % 7], op: 0.65 })),
        ...chain(8, (i) => P(`${['Himalaya', 'Andes', 'Rockies', 'Alps', 'Urals', 'Appalachians', 'Atlas', 'Great Dividing Range'][i]}`, [Math.cos(i * 1.8 + 0.5) * (0.4 + (i % 3) * 0.28), 1.35, Math.sin(i * 1.8 + 0.5) * (0.4 + (i % 3) * 0.28)], [0.14, 0.07, 0.1], `Collision or subduction built this range; its roots still thicken the crust below.`, { k: 'cone', r: 0.06, h: 0.07, c: '#a89468' })),
        ...chain(10, (i) => P(`${['Tundra', 'Taiga', 'Temperate forest', 'Grassland', 'Desert', 'Savanna', 'Tropical rainforest', 'Chaparral', 'Mangrove coast', 'Coral reef'][i]} biome`, [Math.cos(i * 2.51) * (0.45 + (i % 3) * 0.25), 1.328, Math.sin(i * 2.51) * (0.45 + (i % 3) * 0.25)], [0.34, 0.008, 0.26], `Climate bands of heat and rain sort life into biomes; each recycles carbon and water differently.`, { k: 'box', rot: [0, i * 0.6, 0], c: ['#e8f4ee', '#5a7a4a', '#7fa35c', '#c8d957', '#e6cf8f', '#d8b25c', '#3a7a4a', '#8aa05c', '#9ad0c0', '#79b9d3'][i], op: 0.5 })),
        ...chain(6, (i) => P(`${['Sahara', 'Gobi', 'Atacama', 'Kalahari', 'Arabian', 'Australian Outback'][i]} desert`, [Math.cos(i * 1.4 + 1) * (0.5 + (i % 2) * 0.3), 1.34, Math.sin(i * 1.4 + 1) * (0.5 + (i % 2) * 0.3)], [0.3, 0.01, 0.24], `Subsiding dry air at the subtropical highs creates the great deserts around 30 degrees north and south.`, { k: 'box', rot: [0, i * 0.8, 0], c: '#e6cf8f', op: 0.6 })),
      ],
      hydrosphere: [
        ...chain(12, (i) => P(`${['Kuroshio Current', 'Agulhas Current', 'Brazil Current', 'Canary Current', 'Benguela Current', 'California Current', 'Humboldt Current', 'East Australian Current', 'North Atlantic Drift', 'Antarctic Circumpolar Current', 'Somali Current', 'Oyashio Current'][i]}`, [Math.cos(i * 1.96) * (0.6 + (i % 3) * 0.18), 1.345, Math.sin(i * 1.96) * (0.6 + (i % 3) * 0.18)], [0.3, 0.01, 0.06], `Wind and the Coriolis effect drive this gyre limb, moving heat from equator toward pole.`, { k: 'box', rot: [0, i * 0.9 + 1.5, 0], c: i % 2 ? '#c98274' : '#79b9d3', op: 0.7 })),
        ...chain(8, (i) => P(`${['Nile', 'Amazon', 'Mississippi', 'Yangtze', 'Ganges-Brahmaputra', 'Congo', 'Danube', 'Murray-Darling'][i]} river`, [Math.cos(i * 2.15 + 0.7) * (0.35 + (i % 3) * 0.25), 1.342, Math.sin(i * 2.15 + 0.7) * (0.35 + (i % 3) * 0.25)], [0.05, 0.008, 0.3], `Rivers return continental rain to the sea, carrying sediment and dissolved carbon with them.`, { k: 'box', rot: [0, i * 1.1, 0], c: '#79b9d3', op: 0.8 })),
      ],
      atmosphere: [
        ...chain(6, (i) => P(`${i % 2 === 0 ? ['Hadley cell N', 'Ferrel cell N', 'Polar cell N'][Math.floor(i / 2)] : ['Hadley cell S', 'Ferrel cell S', 'Polar cell S'][Math.floor(i / 2)]}`, [Math.cos(i * 1.05) * (0.7 + Math.floor(i / 2) * 0.15), 1.75 - Math.floor(i / 2) * 0.12, Math.sin(i * 1.05) * (0.7 + Math.floor(i / 2) * 0.15)], [0.2, 0.16, 0.2], `Three convection cells per hemisphere stack up: Hadley, Ferrel and Polar, setting the wind belts and rain bands.`, { k: 'tor', r: 0.1, t: 0.02, rot: [Math.PI / 2 + (i % 2 ? 0.4 : -0.4), i * 0.5, 0], c: '#9cc3de', op: 0.5 })),
        ...chain(5, (i) => P(`${['Intertropical convergence zone', 'Subtropical high N', 'Subtropical high S', 'Subpolar low N', 'Subpolar low S'][i]}`, [Math.cos(i * 1.7 + 2) * (i === 0 ? 0.05 : 0.85), 1.48, Math.sin(i * 1.7 + 2) * (i === 0 ? 0.05 : 0.85)], [0.36, 0.02, 0.1], `A permanent pressure belt: rising air makes storms, sinking air makes calm and deserts.`, { k: 'tor', r: 0.16, t: 0.012, rot: [Math.PI / 2, i, 0], c: i === 0 ? '#c98274' : '#8fb8d8', op: 0.45 })),
      ],
    },
  },
  violin: {
    parts: {
      strings: [
        ...chain(12, (i) => P(`First-position stop ${i + 1} (${['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#'][i]} on E)`, [0, 0.235, -0.15 - i * 0.05], [0.14, 0.004, 0.008], `Stop ${i + 1}: each semitone of first position on the E string; the finger spacing halves toward the bridge as the scale length shortens.`, { k: 'box', c: '#f0b35b', op: 0.75 })),
        ...chain(4, (i) => P(`Harmonic node ${i + 1}`, [0, 0.32, 0.3 - i * 0.22], [0.03, 0.03, 0.03], `Node ${i + 1}: lightly touching the string at a half, third or quarter point rings a pure harmonic.`, { k: 'sph', r: 0.014, c: '#9cc3de', op: 0.85 })),
        ...chain(4, (i) => P(`String core type marker: ${['Gut core', 'Steel core', 'Synthetic core', 'Wound ribbon'][i]}`, [(i % 2 ? 0.1 : -0.1), 0.2, -1.0 + Math.floor(i / 2) * 0.12], [0.02, 0.05, 0.02], `${['Gut cores (sheep intestine) give the warm baroque voice', 'Steel cores speak fast and bright, standard for the E', 'Synthetic (perlon) cores balance warmth and stability', 'Wound ribbons add mass without stiffness for the low strings'][i]}.`, { k: 'cone', r: 0.01, h: 0.05, c: '#e6cf8f', op: 0.85 })),
      ],
    },
  },
}

for (const [subjectId, pass] of Object.entries(PASS8B)) {
  const subject = IMMERSIVE_SUBJECTS[subjectId]
  for (const sys of pass.newSystems || []) {
    if (!subject.systems.some((s) => s.id === sys.id)) subject.systems.push(sys)
  }
  for (const [sysId, list] of Object.entries(pass.parts || {})) {
    if (!subject.parts[sysId]) subject.parts[sysId] = []
    subject.parts[sysId].push(...list)
  }
}

// ---------------------------------------------------------------------------
// PASS 9 — Wave 2 batch 1 (docs/KEV_ATLAS_EXPANSION.md): new worlds built to
// the PASS 8 enumeration standard from day one. C. elegans: the fully-mapped
// animal (959 somatic cells, 302 neurons, 20 intestine cells, invariant
// lineage). Bony fish (perch): opercular series, branchiostegal rays, gill
// arches with filaments and lamellae, lateral-line pores, fin spine/ray
// counts, pyloric caeca, swim-bladder rete, vertebrae and otoliths.
// Sources: WormAtlas/WormBase cell ledger; Sulston lineage papers; perch
// (Perca fluviatilis) dissection atlases; fish osteology nomenclature.
Object.assign(IMMERSIVE_SUBJECTS, {
  celegans: {
    label: 'C. elegans',
    eyebrow: 'MODEL ORGANISMS',
    description: 'The fully-mapped animal: every one of its 959 somatic cells and 302 neurons is known by name and lineage.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['cuticle', 'hypodermis', 'pharynx', 'nerve ring', 'amphid', 'seam cell', 'dauer', 'invariant lineage'],
    systems: [
      { id: 'body', label: 'Body wall & cuticle', color: '#9ad0c0' },
      { id: 'nerve', label: 'Nervous system (302)', color: '#f0e3a0' },
      { id: 'gut', label: 'Pharynx & intestine', color: '#c98274' },
      { id: 'repro', label: 'Gonad & germ line', color: '#b98ad1' },
      { id: 'ledger', label: 'Cell ledger (959)', color: '#8fb8d8' },
    ],
    parts: {
      body: [
        P('Cuticle sheath', [0, 0.1, 0], [3.2, 0.5, 0.5], 'A collagen cuticle is secreted four times as the worm moults through L1-L4; it is the exoskeleton of a 1 mm animal.', { k: 'tube', pts: [[-1.5, 0.1 + Math.sin(-3) * 0.15, 0], [0, 0.1, 0], [1.5, 0.1 + Math.sin(3) * 0.15, 0]], r: 0.13, c: '#b8d8d0', op: 0.3, cc: 0.4 }),
        P('Hypodermis (skin syncytium)', [0, 0.1, 0], [3.1, 0.44, 0.44], 'The hypodermis lies under the cuticle; seam cells run along both flanks as a growth stripe.', { k: 'tube', pts: [[-1.45, 0.1 + Math.sin(-2.9) * 0.14, 0], [0, 0.1, 0], [1.45, 0.1 + Math.sin(2.9) * 0.14, 0]], r: 0.11, c: '#8aa8a0', op: 0.35 }),
        ...chain(20, (i) => P(`Cuticle annulus ${i}`, [-1.4 + i * 0.147, 0.1 + Math.sin(-2.8 + i * 0.29) * 0.13, 0], [0.27, 0.27, 0.012], `Annulus ${i}: fine ring wrinkles let the pressurised hydrostatic skeleton bend without kinking.`, { k: 'tor', r: 0.125, t: 0.004, rot: [0, Math.PI / 2 + Math.cos(i * 0.29) * 0.3, 0], c: '#9ad0c0', op: 0.5 })),
        ...chain(2, (i) => P(`Lateral ala ${i}`, [-0.3 + i * 0.6, 0.1, (i ? 1 : -1) * 0.13], [1.2, 0.02, 0.02], `Ala ${i}: raised lateral ridges run the body length, guiding the worm through soil pores.`, { k: 'box', c: '#e8f4ee', op: 0.6 })),
        ...chain(24, (i) => P(`Body-wall muscle arm ${i}`, [-1.3 + i * 0.113, 0.1 + (i % 2 ? 0.08 : -0.08), (i % 2 ? 0.09 : -0.09)], [0.09, 0.05, 0.05], `Arm ${i} of 95 muscle cells: each sends a single arm to the nerve cords - muscle reaches to nerve, not nerve to muscle, unique in the animal kingdom.`, { k: 'box', rot: [0.4, 0, i % 2 ? 0.3 : -0.3], c: '#c98274', op: 0.75 })),
      ],
      nerve: [
        P('Nerve ring', [-0.95, 0.1, 0], [0.3, 0.3, 0.05], 'The nerve ring circles the pharyngeal isthmus - the brain of an animal with 302 neurons.', { k: 'tor', r: 0.13, t: 0.018, rot: [0, Math.PI / 2, 0], c: '#f0e3a0', op: 0.85 }),
        P('Ventral nerve cord', [0.1, 0.0, 0], [2.6, 0.03, 0.03], 'The ventral cord carries the motor circuit that runs the sinusoidal gait.', { k: 'tube', pts: [[-1.1, 0.0, 0], [0.1, 0.0, 0], [1.3, 0.02, 0]], r: 0.014, c: '#e6cf8f', op: 0.85 }),
        P('Dorsal nerve cord', [0.1, 0.2, 0], [2.6, 0.025, 0.025], 'The dorsal cord completes the two-cord circuit; dorsal and ventral run in mirror symmetry.', { k: 'tube', pts: [[-1.1, 0.2, 0], [0.1, 0.2, 0], [1.3, 0.22, 0]], r: 0.012, c: '#e6cf8f', op: 0.85 }),
        ...chain(30, (i) => P(`Neuron ${i + 1} of 302`, [-1.25 + (i % 15) * 0.18, 0.1 + (i < 15 ? -0.03 : 0.05), (i % 3 - 1) * 0.05], [0.03, 0.03, 0.03], `One of exactly 302 neurons, every synapse of which is mapped in the only complete connectome of any animal.`, { k: 'sph', r: 0.014, c: '#f0d896', op: 0.9 })),
        ...chain(8, (i) => P(`Amphid neuron ${i + 1}`, [-1.42, 0.1 + (i % 4 - 1.5) * 0.02, (i < 4 ? -1 : 1) * (0.05 + Math.floor(i / 4) * 0.02)], [0.025, 0.025, 0.025], `Amphid neuron ${i + 1} of 12 per side: chemosensory ciliated neurons in the head sensilla that taste the soil.`, { k: 'cyl', r: 0.008, h: 0.022, rot: [Math.PI / 2, 0, 0], c: '#9cc3de', op: 0.9 })),
      ],
      gut: [
        P('Pharyngeal procorpus', [-1.2, 0.1, 0], [0.3, 0.12, 0.12], 'The muscular procorpus pumps bacteria into the pharynx at 250 beats a minute.', { k: 'cyl', r: 0.055, h: 0.28, rot: [0, 0, Math.PI / 2], c: '#c98274', op: 0.8 }),
        P('Pharyngeal isthmus', [-0.98, 0.1, 0], [0.2, 0.08, 0.08], 'The narrow isthmus carries the nerve ring around itself.', { k: 'cyl', r: 0.035, h: 0.2, rot: [0, 0, Math.PI / 2], c: '#b87a6a', op: 0.8 }),
        P('Terminal bulb & grinder', [-0.8, 0.1, 0], [0.16, 0.14, 0.14], 'The terminal bulb grinder crushes bacteria before the intestine - a three-chitin-tooth mill.', { k: 'cyl', r: 0.06, h: 0.15, rot: [0, 0, Math.PI / 2], c: '#a86a5a', op: 0.85 }),
        ...chain(12, (i) => P(`Pharyngeal cell ${i + 1} of 20`, [-1.32 + i * 0.045, 0.1 + (i % 2 ? 0.05 : -0.05), (i % 3 - 1) * 0.03], [0.03, 0.03, 0.03], `Cell ${i + 1} of the pharynx 20: muscle, gland and neuron cells in an organ whose every nucleus is catalogued.`, { k: 'sph', r: 0.013, c: '#d8a08a', op: 0.85 })),
        ...chain(20, (i) => P(`Intestinal cell ${i + 1} of 20`, [-0.7 + i * 0.095, 0.1 + (i % 2 ? 0.045 : -0.045), (i % 3 - 1) * 0.035], [0.09, 0.09, 0.09], `Intestine cell ${i + 1}: the whole gut is exactly 20 cells, each with ~33 nuclei - digestion, storage and detox in one row.`, { k: 'sph', r: 0.042, c: '#8a7a4a', op: 0.65 })),
        P('Rectum', [1.3, 0.1, 0], [0.1, 0.08, 0.08], 'A four-cell rectum opens at the anus; in males it becomes the cloaca.', { k: 'cyl', r: 0.035, h: 0.09, rot: [0, 0, Math.PI / 2], c: '#a86a5a', op: 0.8 }),
        P('Anus / cloaca', [1.4, 0.06, 0], [0.04, 0.04, 0.04], 'The posterior opening; the invariant lineage fixes even its four cells.', { k: 'sph', r: 0.02, c: '#c98274' }),
        P('Excretory cell', [-0.75, 0.16, 0], [0.06, 0.05, 0.05], 'A single giant H-shaped cell osmoregulates the whole animal.', { k: 'sph', r: 0.028, c: '#9cc3de', op: 0.85 }),
        P('Excretory duct', [-0.9, 0.14, 0], [0.14, 0.015, 0.015], 'The duct pore opens just behind the nerve ring.', { k: 'cyl', r: 0.006, h: 0.13, rot: [0, 0, 0.3], c: '#9cc3de', op: 0.85 }),
      ],
      repro: [
        P('Gonad arm (anterior)', [-0.1, 0.18, 0.02], [0.9, 0.06, 0.06], 'The hermaphrodite gonad is a U-shaped tube; sperm are made first, then oocytes sweep past them.', { k: 'tube', pts: [[-0.5, 0.18, 0.02], [-0.1, 0.2, 0.02], [0.35, 0.18, 0.02]], r: 0.026, c: '#d1a8e0', op: 0.7 }),
        P('Gonad arm (posterior)', [0.75, 0.06, -0.02], [0.9, 0.06, 0.06], 'The second arm doubles egg output to ~300 self-fertilised progeny.', { k: 'tube', pts: [[0.35, 0.16, -0.02], [0.75, 0.05, -0.02], [1.15, 0.07, -0.02]], r: 0.026, c: '#d1a8e0', op: 0.7 }),
        ...chain(12, (i) => P(`Oocyte ${i + 1}`, [-0.45 + i * 0.075, 0.185, 0.02], [0.055, 0.055, 0.055], `Oocyte ${i + 1}: cells enlarge as they travel the arm, maturing just before the spermatheca.`, { k: 'sph', r: 0.026, c: '#e0c8f0', op: 0.85 })),
        P('Spermatheca', [0.38, 0.17, 0.02], [0.09, 0.09, 0.09], 'The spermatheca stores the self-made sperm that fertilise each passing oocyte.', { k: 'sph', r: 0.042, c: '#b98ad1', op: 0.8 }),
        P('Uterus', [0.6, 0.12, 0], [0.5, 0.07, 0.07], 'Two uterine arms meet at the vulva; up to a dozen embryos queue inside.', { k: 'cyl', r: 0.03, h: 0.45, rot: [0, 0, 0.2], c: '#c9a0dc', op: 0.7 }),
        P('Vulva', [0.15, 0.0, 0.08], [0.05, 0.05, 0.03], 'The vulva is built from exactly 22 cells descended from P5-P7; laser-ablating one changes its fate predictably.', { k: 'sph', r: 0.022, c: '#b98ad1', op: 0.9 }),
        ...chain(4, (i) => P(`Embryo stage marker ${i + 1}`, [0.5 + i * 0.13, 0.13, 0.03], [0.06, 0.05, 0.05], `Stage ${i + 1}: cleavage to comma to threefold to larva - 14 hours at 20 degreesC, every division timed.`, { k: 'sph', r: 0.026, c: '#e8e2f0', op: 0.7 })),
        ...chain(2, (i) => P(`Spicule ${i + 1} (male)`, [1.34, 0.04, (i ? 0.03 : -0.03)], [0.05, 0.012, 0.012], `Spicule ${i + 1}: the male tail pair guides mating; males are 0.2% of wild populations.`, { k: 'box', rot: [0, 0, -0.4], c: '#e0d8c0', met: 0.2 })),
        P('Male tail fan', [1.44, 0.06, 0], [0.1, 0.06, 0.1], 'The rayed fan of the male tail holds nine bilateral rays, each with known neuron pairs.', { k: 'cap', r: 0.045, h: 0.03, rot: [0, 0, Math.PI / 2], c: '#cfc8b0', op: 0.8 }),
      ],
      ledger: [
        ...chain(30, (i) => P(`Somatic cell ${i + 1} of 959`, [-1.35 + (i % 15) * 0.19, 0.24 + Math.floor(i / 15) * 0.1, (i % 5 - 2) * 0.03], [0.026, 0.026, 0.026], `One of exactly 959 adult hermaphrodite somatic cells: the lineage from fertilised egg to every nucleus is drawn, branch by branch.`, { k: 'sph', r: 0.012, c: '#8fb8d8', op: 0.85 })),
        ...chain(10, (i) => P(`Seam cell ${i + 1}`, [-1.1 + i * 0.24, 0.1, 0.125], [0.04, 0.035, 0.01], `Seam cell ${i + 1} of 10 per side: stem-like lateral cells that divide each larval stage and build the alae.`, { k: 'box', c: '#a8d0e0', op: 0.85 })),
        ...chain(4, (i) => P(`Larval stage marker ${['L1', 'L2', 'L3', 'L4'][i]}`, [-0.6 + i * 0.4, 0.3, -0.08], [0.05, 0.05, 0.05], `${['L1', 'L2', 'L3', 'L4'][i]} moult: four larval stages separate by shedding cuticle, each adding fixed cells.`, { k: 'cone', r: 0.02, h: 0.05, c: '#f0b35b', op: 0.85 })),
        ...chain(3, (i) => P(`Dauer decision marker ${i + 1}`, [0.9 + i * 0.12, 0.32, 0.06], [0.04, 0.06, 0.04], `Marker ${i + 1}: crowding, heat and hunger at the L2 decision point trigger the dauer larva - sealed mouth, radiating to survive months.`, { k: 'cone', r: 0.018, h: 0.055, c: '#c0504d', op: 0.8 })),
      ],
    },
  },
  fish: {
    label: 'Bony Fish (Perch)',
    eyebrow: 'ZOOLOGY',
    description: 'A perch opened up: opercular gill pump, filament-by-filament gills, lateral line, fin spines and rays, swim bladder and the full vertebrate organ set.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['operculum', 'gill filament', 'lamellae', 'lateral line', 'swim bladder', 'pyloric caeca', 'otolith', 'ctenoid scale'],
    systems: [
      { id: 'external', label: 'Scales, fins & lateral line', color: '#79b9d3' },
      { id: 'head', label: 'Head & opercular series', color: '#d8b25c' },
      { id: 'gills', label: 'Gill arches & filaments', color: '#c0504d' },
      { id: 'internal', label: 'Organs & swim bladder', color: '#c98274' },
      { id: 'skeleton', label: 'Skeleton & otoliths', color: '#e8e2d0' },
      { id: 'circulation', label: 'Single-loop heart', color: '#b06a6a' },
    ],
    parts: {
      external: [
        ...chain(30, (i) => P(`Ctenoid scale ${i + 1}`, [-1.1 + (i % 10) * 0.24, 0.05 + Math.floor(i / 10) * 0.12, (i % 2 ? 0.2 : -0.2)], [0.09, 0.07, 0.01], `Scale ${i + 1}: overlapping ctenoid scales carry tiny spines (ctenii) that make the flank feel like sandpaper.`, { k: 'cap', r: 0.04, h: 0.012, rot: [0, 0, 0], c: '#c8b878', op: 0.8, cc: 0.35 })),
        P('Lateral line canal', [0, 0.14, 0.205], [2.4, 0.012, 0.012], 'The lateral line runs head to tail, reading pressure waves through pores in the scales.', { k: 'tube', pts: [[-1.15, 0.16, 0.2], [0, 0.15, 0.21], [1.15, 0.12, 0.18]], r: 0.005, c: '#9cc3de', op: 0.9 }),
        ...chain(24, (i) => P(`Lateral-line pore ${i + 1}`, [-1.1 + i * 0.095, 0.155 - Math.abs(i - 12) * 0.002, 0.208], [0.014, 0.014, 0.014], `Pore ${i + 1}: each opens to a neuromast whose hair cells detect the bow wave of prey and predators.`, { k: 'sph', r: 0.007, c: '#79b9d3', op: 0.95 })),
        P('First dorsal fin (membrane)', [0.05, 0.32, 0], [0.7, 0.16, 0.01], 'The spiny first dorsal folds into a groove when not raised - a defensible sail of sharp spines.', { k: 'box', rot: [0, 0, -0.05], c: '#a8c8b8', op: 0.45 }),
        ...chain(13, (i) => P(`Dorsal spine ${i + 1}`, [-0.28 + i * 0.055, 0.3, 0], [0.012, 0.14 - Math.abs(i - 6) * 0.012, 0.012], `Spine ${i + 1} of 12-14: unsegmented, unbranched, sharp - the perch defence that gives the genus its name.`, { k: 'cone', r: 0.006, h: 0.13 - Math.abs(i - 6) * 0.011, c: '#e8e2d0' })),
        P('Second dorsal fin (soft)', [0.55, 0.28, 0], [0.5, 0.12, 0.01], 'The soft-rayed second dorsal steers; its rays branch and segment.', { k: 'box', rot: [0, 0, -0.08], c: '#a8c8b8', op: 0.45 }),
        ...chain(13, (i) => P(`Second-dorsal ray ${i + 1}`, [0.34 + i * 0.036, 0.26, 0], [0.008, 0.1, 0.008], `Ray ${i + 1} of 13-15: lepidotrichia, segmented bony rays that split at the tip.`, { k: 'cyl', r: 0.004, h: 0.1, c: '#e8e2d0', op: 0.9 })),
        P('Caudal fin', [1.25, 0.05, 0], [0.25, 0.34, 0.01], 'A slightly forked homocercal tail: the last vertebra bends up but the fin looks symmetrical.', { k: 'box', rot: [0, 0, 0], c: '#a8c8b8', op: 0.45 }),
        ...chain(12, (i) => P(`Caudal ray ${i + 1}`, [1.2, 0.05 + (i - 5.5) * 0.026, 0], [0.18, 0.008, 0.008], `Ray ${i + 1} of 17-19: branched rays fan the tail; the middle pair anchor to the hypural plate.`, { k: 'box', rot: [0, 0, (i - 5.5) * 0.045], c: '#e8e2d0', op: 0.9 })),
        P('Anal fin', [0.75, -0.16, 0], [0.3, 0.1, 0.01], 'Two spines plus soft rays sit before the tail, trimming pitch.', { k: 'box', rot: [0, 0, 0.1], c: '#a8c8b8', op: 0.45 }),
        ...chain(7, (i) => P(`Anal ray ${i + 1}`, [0.64 + i * 0.036, -0.15, 0], [0.008, 0.08, 0.008], `Ray ${i + 1}: the first two are spines, the rest soft branched rays.`, { k: 'cyl', r: 0.004, h: 0.08 - (i < 2 ? 0 : 0.02), rot: [0, 0, 0.15], c: '#e8e2d0', op: 0.9 })),
        ...chain(2, (i) => P(`Pelvic fin ${i ? 'R' : 'L'}`, [-0.35, -0.17, (i ? 0.12 : -0.12)], [0.14, 0.08, 0.01], `Pelvic fin ${i ? 'right' : 'left'}: thoracic position, one spine and five soft rays - perch land themselves with these.`, { k: 'box', rot: [0, (i ? -0.4 : 0.4), 0.2], c: '#a8c8b8', op: 0.45 })),
        ...chain(2, (i) => P(`Pectoral fin ${i ? 'R' : 'L'}`, [-0.75, -0.05, (i ? 0.2 : -0.2)], [0.2, 0.14, 0.01], `Pectoral fin ${i ? 'right' : 'left'}: the brake and slow-speed oar, with 13-15 soft rays.`, { k: 'box', rot: [0, (i ? -0.5 : 0.5), 0], c: '#a8c8b8', op: 0.45 })),
        ...chain(8, (i) => P(`Pectoral ray ${i + 1}`, [-0.78, -0.05 + (i - 3.5) * 0.016, (i % 2 ? 0.2 : -0.2)], [0.14, 0.006, 0.006], `Ray ${i + 1}: pectoral rays row independently, giving perch finer control than any cruiser.`, { k: 'box', rot: [0, 0, (i - 3.5) * 0.06], c: '#e8e2d0', op: 0.9 })),
      ],
      head: [
        P('Eye', [-1.05, 0.12, 0.14], [0.12, 0.12, 0.08], 'The fixed lens focuses by moving, not squeezing; perch see well in weed-shadow light.', { k: 'sph', r: 0.06, c: '#2a2a2a', cc: 0.6, rgh: 0.1 }),
        P('Lens', [-1.07, 0.12, 0.16], [0.06, 0.06, 0.04], 'A hard spherical lens - the sharpest focusing surface in the vertebrate eye.', { k: 'sph', r: 0.028, c: '#d8e8f0', op: 0.7, rgh: 0.05 }),
        P('Premaxilla', [-1.32, -0.02, 0], [0.12, 0.05, 0.1], 'The protrusible premaxilla shoots forward to vacuum prey - a hallmark of modern bony fish.', { k: 'box', c: '#e8e2d0' }),
        P('Maxilla', [-1.24, -0.01, 0.06], [0.1, 0.04, 0.04], 'The maxilla levers the premaxilla out; in perch it stays toothless.', { k: 'box', c: '#e8e2d0' }),
        P('Dentary (lower jaw)', [-1.28, -0.07, 0], [0.14, 0.04, 0.09], 'The dentary carries the fine villiform teeth that grip, not chew.', { k: 'box', c: '#ded8c6' }),
        P('Palatine tooth patch', [-1.15, -0.02, -0.05], [0.08, 0.02, 0.06], 'Rough palatine patches hold struggling prey pointing one way: in.', { k: 'box', c: '#ded8c6', rgh: 0.8 }),
        P('Opercle', [-0.92, 0.03, 0.17], [0.18, 0.16, 0.02], 'The opercle is the gill cover and the exhaust valve of a two-pump breathing machine.', { k: 'box', rot: [0, 0.3, 0], c: '#d8b25c', op: 0.9, cc: 0.3 }),
        P('Preopercle', [-1.0, 0.02, 0.16], [0.08, 0.12, 0.02], 'The preopercle rim is finely serrated - a perch ID feature.', { k: 'box', rot: [0, 0.3, 0.2], c: '#c8a84c' }),
        P('Subopercle', [-0.95, -0.06, 0.16], [0.1, 0.05, 0.02], 'The subopercle completes the lower rim of the gill cover.', { k: 'box', rot: [0, 0.3, 0], c: '#c8a84c' }),
        P('Interopercle', [-1.02, -0.07, 0.15], [0.06, 0.04, 0.02], 'The interopercle bridges jaw to cover - the fourth piece of the opercular series.', { k: 'box', c: '#c8a84c' }),
        ...chain(6, (i) => P(`Branchiostegal ray ${i + 1}`, [-1.0 + i * 0.03, -0.08, 0.12 - i * 0.01], [0.014, 0.08, 0.014], `Ray ${i + 1} of 6-8: the branchiostegal rays flare the throat floor, sucking water across the gills.`, { k: 'cyl', r: 0.005, h: 0.07, rot: [0.3, 0, 0.4], c: '#e8e2d0', op: 0.9 })),
        P('Nostril (naris) pair', [-1.28, 0.08, 0.07], [0.03, 0.02, 0.05], 'Blind pits with in- and out-current openings sample water for smell without breathing it.', { k: 'sph', r: 0.012, c: '#8a6a4a' }),
        P('Pseudobranch', [-0.98, 0.09, 0.1], [0.05, 0.03, 0.04], 'A vestigial gill inside the opercle that may oxygenate blood bound for the retina.', { k: 'box', c: '#c98274', op: 0.8 }),
      ],
      gills: [
        ...chain(4, (i) => P(`Gill arch ${i + 1}`, [-0.98 + i * 0.06, 0.0, 0.09], [0.03, 0.14, 0.03], `Arch ${i + 1} of 4 per side: the bony bow that carries two rows of filaments on its outer face.`, { k: 'tor', r: 0.06, t: 0.008, rot: [0, 0, 0], c: '#e8e2d0' })),
        ...chain(24, (i) => P(`Gill filament ${i + 1}`, [-1.02 + (i % 6) * 0.055, -0.02 + Math.floor(i / 6) * 0.045, 0.1 + (Math.floor(i / 12) ? -0.06 : 0.06)], [0.012, 0.04, 0.012], `Filament ${i + 1}: each arch row holds dozens of filaments; blood runs counter-current to the water for 80% oxygen extraction.`, { k: 'cyl', r: 0.005, h: 0.038, rot: [0.4, 0, 0], c: '#c0504d', op: 0.9 })),
        ...chain(8, (i) => P(`Lamella field ${i + 1}`, [-1.0 + i * 0.05, -0.015 + (i % 2) * 0.04, 0.115], [0.014, 0.02, 0.006], `Field ${i + 1}: hundreds of microscopic lamellae per filament - a tennis court of exchange surface folded into a fish head.`, { k: 'box', c: '#d8706a', op: 0.85 })),
        ...chain(12, (i) => P(`Gill raker ${i + 1}`, [-1.0 + (i % 6) * 0.055, 0.02, 0.06 - Math.floor(i / 6) * 0.02], [0.008, 0.03, 0.008], `Raker ${i + 1}: inward-facing combs strain plankton and stop debris shredding the filaments.`, { k: 'cone', r: 0.004, h: 0.028, rot: [0, 0, Math.PI], c: '#e8d8c0' })),
      ],
      internal: [
        P('Swim bladder', [0.35, 0.15, 0], [0.6, 0.16, 0.16], 'The physoclist swim bladder trims buoyancy to neutral, so hovering costs no swimming.', { k: 'sph', r: 0.14, c: '#d8e8f0', op: 0.4, cc: 0.5, sheen: 0.4 }),
        P('Gas gland', [0.15, 0.15, 0], [0.07, 0.07, 0.07], 'The gas gland acidifies blood to force oxygen out of solution and into the bladder.', { k: 'sph', r: 0.032, c: '#c98274', op: 0.85 }),
        P('Rete mirabile', [0.2, 0.15, 0.05], [0.09, 0.05, 0.05], 'A counter-current miracle net keeps the secreted gas from leaking back into the blood.', { k: 'tube', pts: [[0.16, 0.15, 0.05], [0.2, 0.155, 0.05], [0.24, 0.15, 0.05]], r: 0.012, c: '#b06a6a', op: 0.85 }),
        P('Oval window (gas resorption)', [0.55, 0.14, 0], [0.06, 0.06, 0.05], 'A muscular oval reabsorbs gas so the fish can descend without over-inflating.', { k: 'sph', r: 0.026, c: '#9cc3de', op: 0.8 }),
        P('Stomach', [-0.55, -0.05, 0], [0.3, 0.16, 0.14], 'A J-shaped stomach stores and acidifies; perch swallow prey whole head-first.', { k: 'cap', r: 0.07, h: 0.16, rot: [0, 0, 1.9], c: '#c98274', op: 0.7 }),
        ...chain(8, (i) => P(`Pyloric caecum ${i + 1}`, [-0.42, -0.02, -0.05 + i * 0.014], [0.07, 0.014, 0.014], `Caecum ${i + 1} of 5-8: finger pouches at the gut bend that multiply digestive and absorptive surface.`, { k: 'cyl', r: 0.006, h: 0.065, rot: [0, 0, 0.5 + i * 0.05], c: '#d8a08a', op: 0.85 })),
        P('Intestine', [-0.25, -0.09, 0], [0.5, 0.05, 0.05], 'A short straight gut - carnivores need less length than plant-eaters.', { k: 'tube', pts: [[-0.4, -0.08, 0], [-0.2, -0.11, 0], [0.05, -0.09, 0]], r: 0.02, c: '#c98274', op: 0.75 }),
        P('Liver', [-0.45, 0.0, -0.08], [0.24, 0.12, 0.1], 'A two-lobed liver stores oil for buoyancy and energy through winter.', { k: 'box', rot: [0, 0.2, 0], c: '#8a3a2a', op: 0.75 }),
        P('Gall bladder', [-0.4, -0.03, -0.12], [0.05, 0.05, 0.05], 'The green gall bladder concentrates bile beside the pyloric caeca.', { k: 'sph', r: 0.022, c: '#5a7a4a', op: 0.85 }),
        P('Spleen', [-0.3, -0.06, 0.07], [0.06, 0.06, 0.04], 'A dark spleen recycles red cells and stores blood for bursts.', { k: 'sph', r: 0.028, c: '#6a2a2a', op: 0.85 }),
        P('Kidney (mesonephros)', [0.6, 0.16, 0], [0.9, 0.04, 0.05], 'A dark blood-filtering strip lies under the spine along the whole trunk.', { k: 'box', rot: [0, 0, -0.02], c: '#7a3a3a', op: 0.8 }),
        P('Gonad', [0.1, -0.06, 0.04], [0.4, 0.08, 0.06], 'Paired gonads ripen in spring; a large female carries tens of thousands of adhesive eggs.', { k: 'cap', r: 0.035, h: 0.35, rot: [0, 0, Math.PI / 2], c: '#e0b45a', op: 0.6 }),
        P('Brain', [-1.15, 0.11, 0], [0.14, 0.09, 0.09], 'A small brain dominated by optic lobes and the cerebellum - vision and balance rule a perch life.', { k: 'sph', r: 0.055, c: '#f0d8d0', op: 0.8 }),
      ],
      circulation: [
        P('Sinus venosus', [-0.88, -0.1, 0], [0.06, 0.06, 0.06], 'Thin-walled collector of venous blood before the atrium.', { k: 'sph', r: 0.028, c: '#6a4a8a', op: 0.8 }),
        P('Atrium', [-0.84, -0.1, 0], [0.09, 0.09, 0.09], 'The atrium tops up the ventricle; fish run one atrium, one ventricle.', { k: 'sph', r: 0.04, c: '#8a4a5a', op: 0.8 }),
        P('Ventricle', [-0.8, -0.1, 0], [0.1, 0.1, 0.1], 'The muscular ventricle is the single pressure pump of the whole loop.', { k: 'sph', r: 0.045, c: '#c0504d', op: 0.85 }),
        P('Bulbus arteriosus', [-0.76, -0.09, 0], [0.07, 0.07, 0.07], 'The elastic bulbus smooths the pulse so delicate gill capillaries are not blown out.', { k: 'sph', r: 0.03, c: '#b06a6a', op: 0.85 }),
        P('Ventral aorta', [-0.74, -0.07, 0], [0.2, 0.02, 0.02], 'The ventral aorta carries deoxygenated blood forward to the gill arches.', { k: 'tube', pts: [[-0.82, -0.08, 0], [-0.74, -0.06, 0], [-0.9, 0.0, 0.02]], r: 0.008, c: '#6a4a8a', op: 0.85 }),
        P('Dorsal aorta', [0.4, 0.19, 0], [2.0, 0.02, 0.02], 'Oxygenated blood collects into the dorsal aorta and runs the length of the body.', { k: 'tube', pts: [[-0.85, 0.06, 0.02], [0.4, 0.19, 0], [1.2, 0.12, 0]], r: 0.009, c: '#c0504d', op: 0.85 }),
      ],
      skeleton: [
        ...chain(20, (i) => P(`Vertebra ${i + 1}`, [-0.85 + i * 0.105, 0.16 - Math.abs(i - 12) * 0.004, 0], [0.05, 0.08, 0.05], `Vertebra ${i + 1} of ~38: trunk vertebrae carry ribs; tail vertebrae carry haemal arches over the artery.`, { k: 'cyl', r: 0.022, h: 0.05, rot: [Math.PI / 2, 0, 0], c: '#e8e2d0' })),
        ...chain(12, (i) => P(`Rib ${i + 1}`, [-0.6 + i * 0.09, 0.05, (i % 2 ? 0.01 : -0.01)], [0.02, 0.14, 0.08], `Rib ${i + 1}: slender ribs shield the gut and anchor the muscle sheets that bend the body.`, { k: 'tor', r: 0.06, t: 0.005, rot: [0.3, 0, (i % 2 ? 0.2 : -0.2)], c: '#ded8c6', op: 0.9 })),
        ...chain(8, (i) => P(`Pterygiophore ${i + 1}`, [-0.2 + i * 0.1, 0.24, 0], [0.015, 0.06, 0.015], `Bone ${i + 1}: internal rods that anchor dorsal and anal fins to the spine - fins are not skin flaps but skeletal limbs.`, { k: 'cyl', r: 0.006, h: 0.055, c: '#ded8c6', op: 0.9 })),
        ...chain(4, (i) => P(`Hypural plate ${i + 1}`, [1.12, 0.05 + (i - 1.5) * 0.03, 0], [0.08, 0.014, 0.014], `Hypural ${i + 1} of 5: fused fan bones that spread and steer the caudal fin.`, { k: 'box', rot: [0, 0, (i - 1.5) * 0.15], c: '#ded8c6' })),
        P('Urostyle (upturned last vertebra)', [1.08, 0.12, 0], [0.08, 0.08, 0.05], 'The tail spine bends upward - the trick that makes a homocercal fin look symmetrical outside.', { k: 'cone', r: 0.03, h: 0.08, rot: [0, 0, -0.7], c: '#e8e2d0' }),
        ...chain(3, (i) => P(`Otolith: ${['sagitta', 'lapillus', 'asteriscus'][i]}`, [-1.1, 0.1 + i * 0.015, 0.04 + i * 0.012], [0.03, 0.03, 0.014], `The ${['sagitta - big enough to read like tree rings for age', 'lapillus - balance', 'asteriscus - hearing'][i]}: calcium-carbonate ear stones whose rings date the fish to the day.`, { k: 'cyl', r: 0.012 - i * 0.003, h: 0.012, c: '#f0ead0', cc: 0.4, rgh: 0.2 })),
      ],
    },
  },
})

// ---------------------------------------------------------------------------
// PASS 9 batch 1b — El Castillo (Chichen Itza) and the monarch butterfly.
// El Castillo: nine terraces, four 91-step stairways (sampled), talud-tablero
// panels, serpent-head balustrades, the equinox light-triangle sequence, the
// 1930s substructure (inner temple, red jaguar throne, chacmool) and
// archaeoastronomy markers. Monarch: vein-by-vein wings, scale patches,
// 20-segment antennae, reduced forelegs, 8 spiracles, leg segments, and the
// migration suite (sun compass, clock, fat body, super-generation, oyamel
// overwintering). Sources: Aveni archaeoastronomy of Chichen; INAH
// substructure reports; monarch wing-venation diagrams (Nymphalidae);
// Monarch Watch migration biology.
Object.assign(IMMERSIVE_SUBJECTS, {
  maya: {
    label: 'El Castillo (Maya Pyramid)',
    eyebrow: 'HISTORY & ARCHAEOLOGY',
    description: 'Kukulcan\u2019s pyramid counted stone by stone: nine terraces, four 91-step stairways, the equinox serpent of light and the hidden inner temple.',
    tutorId: 'dr-nkosi',
    labId: 'history',
    floor: 1,
    keyTerms: ['talud-tablero', 'balustrade', 'serpent head', 'equinox', 'substructure', 'chacmool', 'jaguar throne', 'Kukulcan'],
    systems: [
      { id: 'terraces', label: 'Nine terraces', color: '#c9b98a' },
      { id: 'stairways', label: 'Stairways & balustrades', color: '#d8c08a' },
      { id: 'temple', label: 'Summit temple', color: '#c0504d' },
      { id: 'sculpture', label: 'Serpent sculpture', color: '#7fa35c' },
      { id: 'substructure', label: 'Hidden substructure', color: '#8a6a4a' },
      { id: 'astronomy', label: 'Archaeoastronomy', color: '#8fb8d8' },
    ],
    parts: {
      terraces: [
        ...chain(9, (i) => P(`Terrace tier ${i + 1}`, [0, i * 0.24 + 0.12, 0], [2 * (1.8 - i * 0.15), 0.22, 2 * (1.8 - i * 0.15)], `Tier ${i + 1} of 9: the stacked platforms may count the nine levels of Xibalba, the Maya underworld.`, i % 2 ? { c: '#c9b98a', rgh: 0.7 } : { c: '#d4c494', rgh: 0.7 })),
        ...chain(36, (i) => P(`Talud-tablero panel ${i + 1}`, [(i % 4 === 0 || i % 4 === 2) ? -1.44 + (i % 9) * 0.36 : (i % 4 === 1 ? 1.68 : -1.68), 0.14 + Math.floor(i / 9) * 0.06, (i % 4 === 1 || i % 4 === 3) ? -1.44 + (i % 9) * 0.36 : (i % 4 === 0 ? -1.68 : 1.68)], [0.32, 0.2, 0.05], `Panel ${i + 1}: sloped talud under a flat tablero - the Classic Maya wall grammar, repeated 36 times around the base.`, { k: 'box', rot: [0, Math.floor(i / 9) % 2 ? Math.PI / 2 : 0, 0], c: '#cfc09a', rgh: 0.75 })),
        ...chain(36, (i) => P(`Terrace corner ${i + 1}`, [(i % 2 ? 1 : -1) * (1.62 - Math.floor(i / 4) * 0.15), 0.24 + Math.floor(i / 4) * 0.24, (Math.floor(i / 2) % 2 ? 1 : -1) * (1.62 - Math.floor(i / 4) * 0.15)], [0.09, 0.2, 0.09], `Corner ${i + 1}: each of the nine tiers turns four corners - 36 corners that the equinox sun sweeps in sequence.`, { k: 'box', c: '#b8a878', rgh: 0.75 })),
        P('Base platform (plaza level)', [0, -0.02, 0], [4.4, 0.05, 4.4], 'The pyramid stands on a levelling plaza platform aligned 19 degrees east of true north - possibly to the zenith passage.', { k: 'box', c: '#a89468', rgh: 0.8 }),
      ],
      stairways: [
        ...chain(60, (i) => P(`Stair ${((i % 15) * 6) + 3} of 91 (${['north', 'east', 'south', 'west'][Math.floor(i / 15)]} face)`, [Math.floor(i / 15) === 0 ? 0 : Math.floor(i / 15) === 1 ? 1.8 - ((i % 15) * 6 + 3) * 0.011 : Math.floor(i / 15) === 2 ? 0 : -1.8 + ((i % 15) * 6 + 3) * 0.011, ((i % 15) * 6 + 3) * 0.026, Math.floor(i / 15) === 0 ? -1.8 + ((i % 15) * 6 + 3) * 0.011 : Math.floor(i / 15) === 1 ? 0 : Math.floor(i / 15) === 2 ? 1.8 - ((i % 15) * 6 + 3) * 0.011 : 0], [0.5, 0.024, 0.035], `Step ${((i % 15) * 6) + 3} (sampled every sixth): 91 steps per face times four faces plus the summit platform equals 365 - the calendar built as architecture.`, { k: 'box', c: '#e0d4b0', rgh: 0.7 })),
        ...chain(8, (i) => P(`Balustrade ${i + 1} (${['north', 'east', 'south', 'west'][Math.floor(i / 2)]} ${i % 2 ? 'right' : 'left'})`, [Math.floor(i / 2) === 0 || Math.floor(i / 2) === 2 ? (i % 2 ? 0.5 : -0.5) : (Math.floor(i / 2) === 1 ? 1.85 : -1.85), 1.05, Math.floor(i / 2) === 1 || Math.floor(i / 2) === 3 ? (i % 2 ? 0.5 : -0.5) : (Math.floor(i / 2) === 0 ? -1.85 : 1.85)], [0.12, 2.1, 0.14], `Balustrade ${i + 1}: the sloped walls of each stairway carry the equinox shadow-serpent.`, { k: 'box', rot: [Math.floor(i / 2) % 2 ? 0 : 0.6, Math.floor(i / 2) * Math.PI / 2, 0], c: '#d0c494', rgh: 0.75 })),
      ],
      temple: [
        P('Temple platform', [0, 2.32, 0], [1.1, 0.16, 1.1], 'The summit platform carries the temple 24 m above the plaza.', { k: 'box', c: '#cfc09a', rgh: 0.7 }),
        ...chain(4, (i) => P(`Temple wall ${i + 1}`, [(i === 0 || i === 2) ? (i === 0 ? 0 : 0) : (i === 1 ? 0.5 : -0.5), 2.6, (i === 0 ? -0.5 : i === 2 ? 0.5 : 0)], [i % 2 ? 0.06 : 1.0, 0.5, i % 2 ? 1.0 : 0.06], `Wall ${i + 1}: the temple chamber has one doorway per side facing the cardinal directions.`, { k: 'box', c: '#c0b48a', rgh: 0.75 })),
        ...chain(4, (i) => P(`Serpent-column ${i + 1}`, [(i % 2 ? 0.32 : -0.32), 2.6, (i < 2 ? -0.48 : 0.48)], [0.1, 0.5, 0.1], `Column ${i + 1}: rattlesnake columns whose heads gape at the temple floor, bodies wrapped with feather relief.`, { k: 'cyl', r: 0.045, h: 0.48, c: '#8aa05c', rgh: 0.6 })),
        P('Temple chamber (inner)', [0, 2.58, 0], [0.7, 0.4, 0.7], 'The single vaulted room held rituals only a few could witness.', { k: 'box', c: '#8a7a5a', op: 0.6, rgh: 0.8 }),
        P('Corbel vault marker', [0, 2.82, 0], [0.6, 0.06, 0.6], 'A corbel (false) arch: each course overhangs until they meet - the Maya never used the true keystone arch.', { k: 'box', c: '#a89468', rgh: 0.7 }),
      ],
      sculpture: [
        ...chain(4, (i) => P(`Plumed-serpent head ${i + 1}`, [Math.floor(i / 2) === 0 || Math.floor(i / 2) === 2 ? (i % 2 ? 0.52 : -0.52) : (Math.floor(i / 2) === 1 ? 1.72 : -1.72), 0.1, Math.floor(i / 2) === 1 || Math.floor(i / 2) === 3 ? (i % 2 ? 0.52 : -0.52) : (Math.floor(i / 2) === 0 ? -1.72 : 1.72)], [0.22, 0.18, 0.2], `Head ${i + 1}: Kukulcan the feathered serpent opens its jaws at the foot of each stairway - the equinox shadow appears to slither down to join it.`, { k: 'box', rot: [0, Math.floor(i / 2) * Math.PI / 2, 0], c: '#7fa35c', rgh: 0.6 })),
        ...chain(4, (i) => P(`Serpent-body relief ${i + 1}`, [Math.floor(i / 2) === 0 || Math.floor(i / 2) === 2 ? (i % 2 ? 0.52 : -0.52) : (Math.floor(i / 2) === 1 ? 1.2 : -1.2), 1.1, Math.floor(i / 2) === 1 || Math.floor(i / 2) === 3 ? (i % 2 ? 0.52 : -0.52) : (Math.floor(i / 2) === 0 ? -1.2 : 1.2)], [0.12, 1.8, 0.1], `Relief ${i + 1}: scaled serpent bodies climb the full balustrade length, rattles pointing skyward.`, { k: 'box', rot: [Math.floor(i / 2) % 2 ? 0 : 0.6, Math.floor(i / 2) * Math.PI / 2, 0], c: '#6a8a4a', rgh: 0.65 })),
        ...chain(2, (i) => P(`Rattle terminal ${i + 1}`, [(i ? 0.52 : -0.52), 2.05, -1.85], [0.08, 0.1, 0.08], `Rattle ${i + 1}: the segment-tail ends at the top of the north balustrade - sound made stone.`, { k: 'box', rot: [0, 0, 0.2], c: '#8aa05c', rgh: 0.6 })),
      ],
      substructure: [
        P('Inner sub-pyramid (1930s tunnel find)', [0, 1.0, 0], [2.0, 1.8, 2.0], 'Beneath El Castillo sits an earlier, smaller pyramid, aligned to a different sunrise - built over, not demolished.', { k: 'box', c: '#8a6a4a', op: 0.35, rgh: 0.8 }),
        P('Red jaguar throne', [0, 1.15, 0.15], [0.3, 0.2, 0.22], 'A lacquered red throne carved as a jaguar, eyes of jade, teeth of flint - found sealed in the inner temple.', { k: 'box', c: '#a83232', cc: 0.6, rgh: 0.25 }),
        P('Chacmool (inner)', [0, 1.12, -0.1], [0.22, 0.1, 0.14], 'A reclining chacmool figure holding an offering dish on its belly, lit only by tunnel lamps since 1936.', { k: 'box', rot: [0, 0.3, 0], c: '#b8a888', rgh: 0.7 }),
        P('Excavation tunnel', [0, 0.9, -0.9], [0.16, 0.2, 1.6], 'The INAH tunnel drives under the west stairway into the sealed older temple.', { k: 'box', c: '#5a4a3a', op: 0.6, rgh: 0.9 }),
        ...chain(3, (i) => P(`Substructure alignment marker ${i + 1}`, [-0.6 + i * 0.6, 1.95, -0.6 + i * 0.3], [0.05, 0.05, 0.05], `Marker ${i + 1}: the inner pyramid faces a different solstitial sunrise - two calendars stacked in one mound.`, { k: 'cone', r: 0.022, h: 0.05, c: '#f0b35b', op: 0.85 })),
      ],
      astronomy: [
        ...chain(8, (i) => P(`Equinox light triangle ${i + 1}`, [-0.62, 0.3 + i * 0.24, -1.72], [0.14, 0.16, 0.02], `Triangle ${i + 1} of 7-9: at equinox sunset the terrace corners cast a zigzag of light down the north balustrade - the serpent descends.`, { k: 'box', rot: [0, 0, 0.1], c: '#f0d896', op: 0.8, sheen: 0.5 })),
        P('Zenith-passage alignment marker', [0, 2.5, -1.0], [0.04, 0.3, 0.04], 'The 19-degree offset may mark the sun at zenith passage, when noon shadows vanish at this latitude.', { k: 'cone', r: 0.018, h: 0.3, c: '#8fb8d8', op: 0.85 }),
        P('Venus alignment marker', [1.0, 2.5, 0], [0.04, 0.04, 0.3], 'Corner sightlines track Venus extremes - Kukulcan himself was Venus in Maya reading.', { k: 'cone', r: 0.018, h: 0.3, rot: [Math.PI / 2, 0, 0], c: '#8fb8d8', op: 0.85 }),
        P('52-year cycle marker', [-1.0, 2.5, 0], [0.06, 0.06, 0.06], 'Calendar-round renewals (52 years) drove construction phases across Mesoamerica; each rebuild buried the last.', { k: 'sph', r: 0.03, c: '#b98ad1', op: 0.85 }),
        ...chain(4, (i) => P(`Cardinal alignment stake ${i + 1}`, [Math.cos(i * Math.PI / 2) * 2.6, 0.02, Math.sin(i * Math.PI / 2) * 2.6], [0.05, 0.08, 0.05], `Stake ${i + 1}: the stairways face the four world directions, each colour-coded in Maya cosmology.`, { k: 'cone', r: 0.02, h: 0.07, c: ['#c0504d', '#e8e2d0', '#2a2a2a', '#f0d896'][i], op: 0.9 })),
      ],
    },
  },
  monarch: {
    label: 'Monarch Butterfly',
    eyebrow: 'ZOOLOGY',
    description: 'Danaus plexippus in migration trim: vein-by-vein wings, scale optics, a sun-compass brain and the four-generation relay to the oyamel firs.',
    tutorId: 'dr-vance',
    labId: 'biology',
    floor: 4,
    keyTerms: ['lepidoptera', 'androconia', 'proboscis', 'sun compass', 'diapause', 'cardenolide', 'oyamel', 'super-generation'],
    systems: [
      { id: 'wings', label: 'Wings & scales', color: '#e6a65d' },
      { id: 'body', label: 'Thorax & abdomen', color: '#8a6a4a' },
      { id: 'head', label: 'Head & senses', color: '#2a2a2a' },
      { id: 'migration', label: 'Migration suite', color: '#8fb8d8' },
      { id: 'lifecycle', label: 'Defence & life cycle', color: '#7fa35c' },
    ],
    parts: {
      wings: [
        ...chain(2, (i) => P(`Forewing membrane ${i ? 'R' : 'L'}`, [-0.25, 0.3, (i ? -1 : 1) * 0.6], [0.7, 0.01, 0.9], `Forewing ${i ? 'right' : 'left'}: stiff leading edge, black-veined cells and the male androconial patch on the hindwing side of the pair.`, { k: 'box', rot: [(i ? -1 : 1) * 0.35, 0, 0.1], c: '#e6a65d', op: 0.55, sheen: 0.4 })),
        ...chain(2, (i) => P(`Hindwing membrane ${i ? 'R' : 'L'}`, [0.2, 0.28, (i ? -1 : 1) * 0.5], [0.5, 0.01, 0.8], `Hindwing ${i ? 'right' : 'left'}: rounder and softer, it drives the clap-and-fling that lifts monarchs at low speed.`, { k: 'box', rot: [(i ? -1 : 1) * 0.3, 0, -0.1], c: '#e6a65d', op: 0.55, sheen: 0.4 })),
        ...chain(12, (i) => P(`Forewing vein ${['costa', 'subcosta', 'radius R1', 'radius R2', 'radius R3', 'media M1'][i % 6]} (${i < 6 ? 'L' : 'R'})`, [-0.4 + (i % 6) * 0.06, 0.31 + (i < 6 ? 1 : -1) * 0.0, (i < 6 ? 1 : -1) * (0.25 + (i % 6) * 0.11)], [0.3, 0.006, 0.01], `Vein ${['costa - the leading spar', 'subcosta', 'radius R1', 'radius R2', 'radius R3', 'media M1'][i % 6]}: nymphalid venation is the butterfly fingerprint taxonomists read.`, { k: 'box', rot: [(i < 6 ? 1 : -1) * 0.3, 0, 0.4 - (i % 6) * 0.12], c: '#2a2a2a', op: 0.85 })),
        ...chain(8, (i) => P(`Hindwing vein ${['cubitus', 'anal A1', 'anal A2', 'discoidal'][i % 4]} (${i < 4 ? 'L' : 'R'})`, [0.15 + (i % 4) * 0.05, 0.29, (i < 4 ? 1 : -1) * (0.2 + (i % 4) * 0.1)], [0.24, 0.006, 0.01], `Vein ${['cubitus', 'anal A1', 'anal A2', 'discoidal cell edge'][i % 4]}: hindwing veins carry tracheae and nerves into the living membrane.`, { k: 'box', rot: [(i < 4 ? 1 : -1) * 0.25, 0, -0.3 + (i % 4) * 0.15], c: '#2a2a2a', op: 0.85 })),
        ...chain(12, (i) => P(`Marginal white spot ${i + 1}`, [-0.6 + (i % 6) * 0.08, 0.3 - Math.floor(i / 6) * 0.05, (Math.floor(i / 6) ? -1 : 1) * (0.95 - (i % 6) * 0.05)], [0.03, 0.008, 0.03], `Spot ${i + 1}: the white-bordered black margin is species ID at a glance, and wears first in old migrants.`, { k: 'sph', r: 0.014, c: '#f0ead0', op: 0.9 })),
        ...chain(24, (i) => P(`Scale patch ${i + 1} (${i % 3 === 0 ? 'orange pigment' : i % 3 === 1 ? 'black melanin' : 'iridescent'})`, [-0.5 + (i % 8) * 0.13, 0.305, (i < 12 ? 1 : -1) * (0.2 + Math.floor(i / 8) * 0.2)], [0.08, 0.004, 0.08], `Patch ${i + 1}: shingle-like scales, 100 per mm, colour the wing - pigment chemistry plus nanostructure shine; rub one off and it never regrows.`, { k: 'box', c: i % 3 === 0 ? '#e6a65d' : i % 3 === 1 ? '#2a2a2a' : '#c8d8e8', op: 0.85, cc: i % 3 === 2 ? 0.5 : 0 })),
        ...chain(2, (i) => P(`Androconial scent patch ${i ? 'R' : 'L'}`, [-0.15, 0.308, (i ? -1 : 1) * 0.45], [0.06, 0.006, 0.09], `Male-only black pocket on the hindwing: dusts pheromone onto the female during courtship.`, { k: 'box', c: '#1a1a1a', op: 0.9, sheen: 0.3 })),
      ],
      body: [
        P('Thorax', [-0.35, 0.08, 0], [0.24, 0.2, 0.18], 'The flight thorax: 100 mg of muscle that beats wings 5-12 times a second.', { k: 'cap', r: 0.08, h: 0.12, rot: [0, 0, Math.PI / 2], c: '#2a2a2a', sheen: 0.3 }),
        ...chain(4, (i) => P(`Flight muscle ${i + 1} (${['dorsal longitudinal', 'dorsoventral', 'tergal', 'pleural'][i]})`, [-0.4 + (i % 2) * 0.08, 0.12 - Math.floor(i / 2) * 0.05, (i % 2 ? 0.04 : -0.04)], [0.06, 0.05, 0.05], `${['Dorsal longitudinal - depresses the wing', 'Dorsoventral - raises the wing', 'Tergal - fine pitch trim', 'Pleural - yaw and steering'][i]}: indirect muscles deform the thorax box and the wings follow.`, { k: 'sph', r: 0.026, c: '#a85a4a', op: 0.85 })),
        ...chain(10, (i) => P(`Abdominal segment ${i + 1}`, [0.05 + i * 0.075, 0.05 - i * 0.004, 0], [0.07, 0.09 - i * 0.004, 0.09 - i * 0.004], `Segment ${i + 1} of 10: telescoping rings hold the gut, fat body and, in females, the egg load.`, { k: 'cyl', r: 0.042 - i * 0.002, h: 0.06, rot: [0, 0, Math.PI / 2], c: i % 2 ? '#2a2a2a' : '#e6a65d', op: 0.9 })),
        ...chain(8, (i) => P(`Spiracle ${i + 1}`, [0.02 + i * 0.08, 0.0, 0.05], [0.016, 0.016, 0.016], `Spiracle ${i + 1}: paired air valves feed tracheal tubes that reach every muscle fibre directly - no blood carries this oxygen.`, { k: 'sph', r: 0.008, c: '#f0ead0', op: 0.9 })),
        ...chain(4, (i) => P(`Fat body depot ${i + 1}`, [0.1 + i * 0.14, 0.03, -0.03], [0.1, 0.04, 0.04], `Depot ${i + 1}: lipids laid down on milkweed nectar fund 4,000 km flown without a meal break.`, { k: 'box', c: '#f0d896', op: 0.7 })),
        ...chain(2, (i) => P(`Reduced foreleg ${i ? 'R' : 'L'} (brush foot)`, [-0.5, -0.06, (i ? 0.07 : -0.07)], [0.1, 0.016, 0.016], `Brush foot ${i ? 'right' : 'left'}: nymphalids keep tiny furred forelegs for tasting surfaces - the middle and hind legs do the walking.`, { k: 'cyl', r: 0.007, h: 0.09, rot: [0, 0, 0.8], c: '#2a2a2a' })),
        ...chain(12, (i) => P(`${i < 6 ? 'Mid' : 'Hind'} leg segment ${i % 6 + 1}`, [-0.3 - Math.floor(i / 6) * 0.2, -0.1 - (i % 6) * 0.02, (i % 6 < 3 ? 1 : -1) * (0.08 + (i % 3) * 0.012)], [0.02, 0.03, 0.02], `Segment ${i % 6 + 1} (coxa, trochanter, femur, tibia, tarsus, claw): six-jointed legs with taste sensors on the feet.`, { k: 'cyl', r: 0.008, h: 0.03 - (i % 6) * 0.003, rot: [0.3 * (i % 3), 0, 0.5], c: '#1a1a1a' })),
      ],
      head: [
        P('Head capsule', [-0.62, 0.1, 0], [0.14, 0.14, 0.13], 'A chitin helmet holding two compound eyes, ocelli and the start of the gut.', { k: 'sph', r: 0.065, c: '#2a2a2a', op: 0.95, cc: 0.3 }),
        ...chain(2, (i) => P(`Compound eye ${i ? 'R' : 'L'}`, [-0.63, 0.12, (i ? -1 : 1) * 0.05], [0.07, 0.07, 0.06], `Eye ${i ? 'right' : 'left'}: apposition compound eye tuned to polarised sky light - the compass sensor of the migration.`, { k: 'sph', r: 0.032, c: '#5a3a2a', cc: 0.5, rgh: 0.2 })),
        ...chain(24, (i) => P(`Ommatidium sample ${i + 1}`, [-0.63 + (i % 4) * 0.008, 0.12 + Math.floor(i / 12) * 0.01, (i < 12 ? 1 : -1) * (0.06 + (i % 12) * 0.004)], [0.008, 0.008, 0.008], `Facet ${i + 1} (sampled): thousands of ommatidia tile each eye; the dorsal rim region reads polarisation for the sun compass.`, { k: 'sph', r: 0.004, c: '#8a6a4a', op: 0.95 })),
        ...chain(2, (i) => P(`Ocellus ${i + 1}`, [-0.64, 0.16 + (i % 2) * 0.01, (i ? 0.02 : -0.02)], [0.02, 0.02, 0.02], `Simple eye ${i + 1}: ocelli measure sky brightness and help hold flight attitude.`, { k: 'sph', r: 0.009, c: '#d8e8f0', op: 0.9 })),
        ...chain(2, (i) => P(`Antenna ${i ? 'R' : 'L'}`, [-0.72, 0.18, (i ? -1 : 1) * 0.04], [0.18, 0.012, 0.012], `Clubbed antenna ${i ? 'right' : 'left'}: smell, touch - and a circadian clock the sun compass needs to stay calibrated.`, { k: 'tube', pts: [[-0.64, 0.14, (i ? -1 : 1) * 0.03], [-0.72, 0.2, (i ? -1 : 1) * 0.05], [-0.78, 0.24, (i ? -1 : 1) * 0.06]], r: 0.005, c: '#2a2a2a' })),
        ...chain(20, (i) => P(`Antennomere ${i + 1}`, [-0.64 - (i % 10) * 0.015, 0.14 + (i % 10) * 0.01, (i < 10 ? 1 : -1) * (0.03 + (i % 10) * 0.003)], [0.01, 0.01, 0.01], `Segment ${i % 10 + 1} of 10 per antenna: the last segments swell into the sensory club packed with smell pores.`, { k: 'sph', r: 0.004 + (i % 10) * 0.0004, c: '#3a3126' })),
        P('Proboscis (coiled galea)', [-0.6, 0.04, 0], [0.08, 0.06, 0.02], 'Two galeae zip into one drinking straw; uncoiled it sips nectar, coiled it stays out of the way.', { k: 'tor', r: 0.03, t: 0.006, rot: [Math.PI / 2, 0, 0], c: '#1a1a1a', cc: 0.4 }),
        ...chain(2, (i) => P(`Labial palpus ${i + 1}`, [-0.6, 0.05, (i ? 0.02 : -0.02)], [0.05, 0.02, 0.02], `Palpus ${i + 1}: furred feelers that house the proboscis when coiled.`, { k: 'box', rot: [0, 0, 0.4], c: '#e6a65d', op: 0.9 })),
      ],
      migration: [
        P('Sun-compass marker (central complex)', [-0.64, 0.11, 0], [0.05, 0.05, 0.05], 'Neurons in the central complex compare polarised-light angle with the antenna clock, producing a time-compensated sun compass.', { k: 'sph', r: 0.024, c: '#8fb8d8', op: 0.9 }),
        P('Time-compensated clock marker', [-0.74, 0.19, 0.05], [0.04, 0.04, 0.04], 'The antennal circadian clock shifts the compass heading as the sun moves - monarchs re-refer to south-west all afternoon.', { k: 'sph', r: 0.018, c: '#f0e3a0', op: 0.9 }),
        P('Magnetic inclination backup', [-0.62, 0.02, 0.04], [0.04, 0.04, 0.04], 'On overcast days a light-dependent magnetic sense keeps the southward bearing.', { k: 'sph', r: 0.018, c: '#b98ad1', op: 0.85 }),
        P('4,000 km route arc', [0, -0.25, 0], [2.4, 0.5, 0.06], 'The autumn flyway: from southern Canada across the US plains into the Mexican highlands, 50-100 km a day.', { k: 'tube', pts: [[-1.2, -0.1, 0], [0, -0.45, 0], [1.2, -0.15, 0]], r: 0.012, c: '#e6a65d', op: 0.6 }),
        P('Super-generation marker', [0.9, -0.3, 0.05], [0.06, 0.06, 0.06], 'The autumn generation lives eight months - eight times its siblings - because it is built to fly, not to breed.', { k: 'cone', r: 0.03, h: 0.06, c: '#c0504d', op: 0.85 }),
        P('Reproductive diapause marker', [0.75, -0.34, -0.05], [0.05, 0.05, 0.05], 'Juvenile hormone stays low: gonads pause while flight muscle and fat build for the journey.', { k: 'sph', r: 0.022, c: '#b98ad1', op: 0.85 }),
        P('Oyamel overwintering marker', [-0.9, -0.3, 0.05], [0.08, 0.1, 0.08], 'Millions cluster on oyamel firs at 3,000 m, where the cloud belt keeps them cool but unfrozen.', { k: 'cone', r: 0.04, h: 0.1, c: '#5a7a4a', op: 0.85 }),
        P('Four-generation relay marker', [0, -0.45, -0.06], [0.06, 0.06, 0.06], 'Spring return takes three short-lived generations; no single butterfly makes the round trip.', { k: 'sph', r: 0.028, c: '#8fb8d8', op: 0.85 }),
      ],
      lifecycle: [
        P('Cardenolide store', [0.2, 0.0, 0.04], [0.08, 0.05, 0.05], 'Milkweed poisons sequestered in tissue make monarchs vomit-inducing; birds learn the orange means no.', { k: 'sph', r: 0.035, c: '#7fa35c', op: 0.85 }),
        P('Aposematic colour marker', [-0.3, 0.36, 0.3], [0.05, 0.05, 0.05], 'The warning palette is honest advertising: toxicity announced in daylight.', { k: 'sph', r: 0.02, c: '#e6a65d', op: 0.9 }),
        P('Mimicry note marker (viceroy)', [-0.3, 0.4, 0.35], [0.04, 0.04, 0.04], 'The viceroy copies monarch dress - once called Batesian mimicry, now known to be unpalatable itself (Muellerian).', { k: 'sph', r: 0.016, c: '#c98274', op: 0.85 }),
        P('Egg (milkweed underside)', [-0.95, -0.05, 0.1], [0.03, 0.04, 0.03], 'A ridged pale egg laid singly under a milkweed leaf; 300-500 per female.', { k: 'cone', r: 0.012, h: 0.035, c: '#f0ead0' }),
        ...chain(5, (i) => P(`Larval instar ${i + 1}`, [-1.1 + i * 0.12, -0.12, 0.1], [0.03 + i * 0.014, 0.03 + i * 0.012, 0.03 + i * 0.012], `Instar ${i + 1} of 5: the banded caterpillar moults every few days, multiplying its mass a thousandfold in two weeks.`, { k: 'cap', r: 0.014 + i * 0.006, h: 0.03 + i * 0.02, rot: [0, 0, Math.PI / 2], c: i % 2 ? '#f0ead0' : '#2a2a2a', op: 0.9 })),
        P('Chrysalis (jade-jewel)', [-0.5, -0.18, 0.1], [0.06, 0.1, 0.06], 'The jade chrysalis with gold spots hangs from a cremaster; inside, the caterpillar liquefies and reassembles as a butterfly in 10 days.', { k: 'cap', r: 0.028, h: 0.08, rot: [Math.PI, 0, 0], c: '#7fb8a0', op: 0.85, cc: 0.6, sheen: 0.4 }),
        ...chain(2, (i) => P(`Gold spot marker ${i + 1}`, [-0.5, -0.13, 0.1 + (i ? 0.02 : -0.02)], [0.014, 0.014, 0.014], `Spot ${i + 1}: the metallic flecks may be structural colour or hormonal signals - still debated.`, { k: 'sph', r: 0.006, c: '#f0d896', cc: 0.7, met: 0.6 })),
        P('Milkweed latex marker', [-1.25, -0.12, 0.05], [0.04, 0.05, 0.04], 'First instars trench the leaf vein to drain the sticky latex before feeding - a chemical bypass learned in hours.', { k: 'sph', r: 0.018, c: '#e8f4ee', op: 0.8 }),
      ],
    },
  },
})

IMMERSIVE_SUBJECT_ORDER.push('celegans', 'fish', 'maya', 'monarch')
