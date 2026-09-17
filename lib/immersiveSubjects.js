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

export const IMMERSIVE_SUBJECT_ORDER = ['anatomy', 'plants', 'engineering', 'vehicle', 'earth']

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
}
