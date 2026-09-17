/**
 * KEV immersive subject scenes - studio-grade procedural geometry for the
 * plants, bridge (engineering) and earth subjects, plus a generic fallback
 * that upgrades any box-catalog subject (rounded geometry, PBR materials,
 * ghosted inactive systems, gold selection glow, numbered labels, damped
 * two-phase explode).
 *
 * Rendering baseline comes from studioRenderer (IBL, ACES, three-point
 * lighting, soft shadows, on-demand frames) - the same recipe the
 * model-x-studio and human-atlas tools use, so every immersive subject now
 * shares one quality bar.
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { createStudio } from './studioRenderer'
import { PointerTap } from '../pointerTap'

// ---------------------------------------------------------------- materials
function std(color, metalness = 0.2, roughness = 0.5, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra })
}

function physical(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({ color, ...opts })
}

function leafShape(length = 1, width = 0.45) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(width * 0.9, length * 0.18, width * 0.75, length * 0.72, 0, length)
  s.bezierCurveTo(-width * 0.75, length * 0.72, -width * 0.9, length * 0.18, 0, 0)
  return s
}

// ---------------------------------------------------------------- builders
/** Plant Systems: roots, vascular bundle, leaf machinery. */
export function buildPlants(scene) {
  const parts = []
  const register = (systemId, name, description, object, position) => {
    object.position.set(...position)
    object.userData = { name, description, source: null, systemId, basePosition: new THREE.Vector3(...position) }
    object.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    parts.push(object)
    return object
  }

  const soil = std('#3d2f23', 0.05, 0.95)
  const rootMat = std('#c9a877', 0.05, 0.8)
  const capMat = std('#8a6a45', 0.05, 0.7)
  const stemMat = std('#6a8f4f', 0.05, 0.65)
  const xylemMat = std('#bfe3d0', 0.1, 0.4)
  const phloemMat = std('#e6c26a', 0.1, 0.45)
  const leafMat = physical('#4f8f3a', { roughness: 0.55, metalness: 0, sheen: 0.6, sheenColor: new THREE.Color('#b7e08a'), side: THREE.DoubleSide })
  const veinMat = std('#9dc47a', 0.05, 0.5)
  const chloroMat = std('#2f6b23', 0.05, 0.4, { emissive: '#1c4a12', emissiveIntensity: 0.35 })

  const tube = (points, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, r, 10, false), m)

  // Roots
  const rootCap = new THREE.Group()
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), capMat)
  cap.position.y = -0.18
  rootCap.add(cap)
  const capTip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 24), capMat)
  capTip.position.y = -0.36
  capTip.rotation.x = Math.PI
  rootCap.add(capTip)
  register('roots', 'Root cap', 'The root cap protects the growing tip as it moves through soil.', rootCap, [0, -1.7, 0])

  const primaryRoot = new THREE.Group()
  const rootProfile = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    rootProfile.push(new THREE.Vector2(0.2 * (1 - t * 0.72) + 0.02, t * 1.3))
  }
  primaryRoot.add(new THREE.Mesh(new THREE.LatheGeometry(rootProfile, 24), rootMat))
  // Root hairs: fine fibers along the root.
  const hairMat = std('#d8c29a', 0, 0.9)
  for (let i = 0; i < 26; i++) {
    const y = 0.12 + (i / 26) * 1.05
    const angle = i * 2.4
    const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.16, 5), hairMat)
    hair.position.set(Math.cos(angle) * 0.16, y, Math.sin(angle) * 0.16)
    hair.rotation.z = Math.cos(angle) * 0.9
    hair.rotation.x = -Math.sin(angle) * 0.9
    primaryRoot.add(hair)
  }
  register('roots', 'Primary root', 'The primary root anchors the plant and absorbs water.', primaryRoot, [0, -1.62, 0])

  const laterals = new THREE.Group()
  for (const dir of [1, -1, 0.4, -0.4]) {
    const lateral = tube(
      [
        new THREE.Vector3(0, -1.0 + Math.abs(dir) * 0.15, 0),
        new THREE.Vector3(dir * 0.45, -1.05, dir * 0.12),
        new THREE.Vector3(dir * 0.8, -1.2, dir * 0.05),
        new THREE.Vector3(dir * 1.0, -1.38, 0),
      ],
      0.05,
      rootMat
    )
    laterals.add(lateral)
  }
  register('roots', 'Lateral roots', 'Lateral roots expand the surface area available for absorption.', laterals, [0, 0.28, 0])

  const hairs = new THREE.Group()
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2
    const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.003, 0.22, 5), hairMat)
    hair.position.set(Math.cos(angle) * 0.5, -0.1 + (i % 5) * 0.05, Math.sin(angle) * 0.5)
    hair.rotation.z = Math.cos(angle) * 1.2
    hair.rotation.x = -Math.sin(angle) * 1.2
    hairs.add(hair)
  }
  register('roots', 'Root hairs', 'Root hairs increase contact with soil particles and water films.', hairs, [0.35, -0.75, 0])

  // Vascular
  const spiral = (phase, r, mat) => {
    const pts = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const a = phase + t * Math.PI * 5
      pts.push(new THREE.Vector3(Math.cos(a) * r, -1.3 + t * 3.6, Math.sin(a) * r))
    }
    return tube(pts, 0.045, mat)
  }
  register('vascular', 'Xylem', 'Xylem transports water and minerals upward from the roots.', spiral(0, 0.14, xylemMat), [0, 0, 0])
  register('vascular', 'Phloem', 'Phloem distributes sugars from photosynthetic tissues.', spiral(Math.PI, 0.14, phloemMat), [0, 0, 0])

  const veins = new THREE.Group()
  for (const side of [1, -1]) {
    const mid = tube(
      [new THREE.Vector3(0, 2.32, side * 0.3), new THREE.Vector3(side * 0.45, 2.36, side * 0.55), new THREE.Vector3(side * 0.85, 2.4, side * 0.7)],
      0.02,
      veinMat
    )
    veins.add(mid)
    for (let i = 1; i <= 3; i++) {
      const t = i / 4
      const branch = tube(
        [
          new THREE.Vector3(side * 0.45 * t, 2.34, side * (0.35 + 0.2 * t)),
          new THREE.Vector3(side * (0.3 + 0.3 * t), 2.38, side * (0.75 + 0.1 * t)),
        ],
        0.012,
        veinMat
      )
      veins.add(branch)
    }
  }
  register('vascular', 'Leaf veins', 'Veins branch through leaves to distribute water and collect sugars.', veins, [0, 0, 0])

  const cambium = new THREE.Group()
  const cambiumShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.2, 2.9, 24, 1, true),
    physical('#7fa35c', { roughness: 0.6, metalness: 0, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  )
  cambiumShell.position.y = 0.55
  cambium.add(cambiumShell)
  register('vascular', 'Stem cambium', 'The cambium produces new vascular tissue as the stem grows.', cambium, [0, 0, 0])

  // Photosynthesis
  const chloroplasts = new THREE.Group()
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), chloroMat)
    c.scale.set(1.4, 0.55, 1)
    c.position.set((i % 3 - 1) * 0.42, 2.5 + Math.floor(i / 3) * 0.06, 0.35 + (i % 2) * 0.22)
    c.rotation.y = i * 0.7
    chloroplasts.add(c)
  }
  register('photosynthesis', 'Chloroplasts', 'Chloroplasts convert light energy into chemical energy.', chloroplasts, [0, 0, 0])

  const blade = new THREE.Group()
  for (const side of [1, -1]) {
    const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(leafShape(1.15, 0.5), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }), leafMat)
    leaf.rotation.z = side * -1.15
    leaf.rotation.y = side * 0.35
    leaf.position.set(side * 0.25, 2.28, side * 0.18)
    blade.add(leaf)
  }
  const topLeaf = new THREE.Mesh(new THREE.ExtrudeGeometry(leafShape(0.9, 0.4), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), leafMat)
  topLeaf.position.set(-0.05, 2.62, 0.02)
  topLeaf.rotation.z = 0.18
  blade.add(topLeaf)
  register('photosynthesis', 'Leaf blade', 'The leaf blade provides a broad surface for light capture and gas exchange.', blade, [0, 0, 0])

  const stomata = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const pore = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 18), std('#2c4a1e', 0, 0.7))
    pore.position.set(-0.5 + i * 0.25, 2.3, -0.16 - (i % 2) * 0.08)
    pore.rotation.x = Math.PI / 2
    stomata.add(pore)
  }
  register('photosynthesis', 'Stomata', 'Stomata regulate carbon dioxide intake and water loss.', stomata, [0, 0, 0])

  const guards = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      const cell = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 10, 20, Math.PI), std('#5d8f3c', 0.05, 0.55))
      cell.position.set(-0.38 + i * 0.25 + s * 0.012, 2.34, -0.24)
      cell.rotation.z = s * 0.5
      cell.rotation.x = Math.PI / 2.4
      guards.add(cell)
    }
  }
  register('photosynthesis', 'Guard cells', 'Guard cells open and close stomata in response to conditions.', guards, [0, 0, 0])

  // Soil disc (staging, not a pickable part).
  const soilDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.62, 0.24, 48), soil)
  soilDisc.position.y = -1.98
  soilDisc.receiveShadow = true
  scene.add(soilDisc)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.02, 8, 6), std('#57493a', 0.05, 0.9))
    pebble.position.set(Math.cos(a) * (0.9 + (i % 3) * 0.25), -1.84, Math.sin(a) * (0.9 + (i % 4) * 0.2))
    pebble.scale.y = 0.6
    scene.add(pebble)
  }

  return { parts, systems: ['roots', 'vascular', 'photosynthesis'] }
}

/** Bridge Systems: truss bridge with structure, motion and power services. */
export function buildBridge(scene) {
  const parts = []
  const register = (systemId, name, description, object, position) => {
    object.position.set(...position)
    object.userData = { name, description, source: null, systemId, basePosition: new THREE.Vector3(...position) }
    object.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    parts.push(object)
    return object
  }

  const steel = std('#8fb8d8', 0.75, 0.35)
  const darkSteel = std('#4b6a85', 0.7, 0.4)
  const concrete = std('#9aa3a8', 0.05, 0.9)
  const asphalt = std('#2e3640', 0.05, 0.95)
  const rubber = std('#22262b', 0.02, 0.9)
  const cableMat = std('#c8d4de', 0.85, 0.3)
  const sensorMat = std('#d87171', 0.4, 0.4, { emissive: '#5e1414', emissiveIntensity: 0.4 })
  const conduitMat = std('#e6a65d', 0.3, 0.55)

  const member = (from, to, r, mat) => {
    const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from))
    const len = dir.length()
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat)
    m.position.copy(new THREE.Vector3(...from)).addScaledVector(dir, 0.5)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return m
  }

  // Deck with road surface and lane dashes.
  const deck = new THREE.Group()
  const deckSlab = new THREE.Mesh(new RoundedBoxGeometry(3.8, 0.24, 0.9, 3, 0.03), concrete)
  deck.add(deckSlab)
  const road = new THREE.Mesh(new RoundedBoxGeometry(3.78, 0.03, 0.86, 2, 0.01), asphalt)
  road.position.y = 0.13
  deck.add(road)
  for (let i = 0; i < 8; i++) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.03), std('#e8d27a', 0, 0.6))
    dash.position.set(-1.64 + i * 0.47, 0.15, 0)
    deck.add(dash)
  }
  register('structure', 'Deck', 'The deck carries traffic loads across the span.', deck, [0, 0.4, 0])

  // Warren trusses on both sides.
  for (const [side, name] of [[-1, 'Left truss'], [1, 'Right truss']]) {
    const truss = new THREE.Group()
    const z = side * 0.5
    const bottomY = -0.6
    const topY = 0.62
    truss.add(member([-1.7, bottomY, z], [1.7, bottomY, z], 0.045, darkSteel))
    truss.add(member([-1.7, topY, z], [1.7, topY, z], 0.045, steel))
    const panels = 6
    for (let i = 0; i <= panels; i++) {
      const x = -1.7 + (i / panels) * 3.4
      truss.add(member([x, bottomY, z], [x, topY, z], 0.03, steel))
      if (i < panels) {
        const nx = -1.7 + ((i + 1) / panels) * 3.4
        truss.add(member([x, bottomY, z], [nx, topY, z], 0.028, i % 2 ? darkSteel : steel))
      }
    }
    register('structure', name, 'The truss converts bending loads into axial forces.', truss, [0, 1.1, 0])
  }

  const foundation = new THREE.Group()
  for (const x of [-1.55, 1.55]) {
    const footing = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.35, 1.15, 3, 0.04), concrete)
    footing.position.set(x, 0, 0)
    foundation.add(footing)
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.75, 20), concrete)
    pier.position.set(x, 0.5, 0)
    foundation.add(pier)
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.1, 0.95, 2, 0.02), concrete)
    cap.position.set(x, 0.9, 0)
    foundation.add(cap)
  }
  register('structure', 'Foundation', 'The foundation transfers structural forces into the ground.', foundation, [0, -0.62, 0])

  // Motion: expansion joint combs, bearings, catenary cable with towers.
  const joint = new THREE.Group()
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.84), darkSteel)
    plate.position.set(s * 0.055, 0, 0)
    joint.add(plate)
    for (let i = 0; i < 4; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.09), steel)
      tooth.position.set(s * 0.11, 0, -0.3 + i * 0.2)
      joint.add(tooth)
    }
  }
  register('motion', 'Expansion joint', 'Expansion joints allow the deck to respond to temperature changes.', joint, [0, 0.56, 0])

  for (const [side, name] of [[-1, 'Left bearing'], [1, 'Right bearing']]) {
    const bearing = new THREE.Group()
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.09, 20), rubber)
    bearing.add(pad)
    const plate2 = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 20), darkSteel)
    plate2.position.y = 0.055
    bearing.add(plate2)
    register('motion', name, 'Bearings allow controlled movement while supporting the span.', bearing, [side * 1.55, 0.15, 0])
  }

  const cable = new THREE.Group()
  for (const x of [-1.55, 1.55]) {
    const tower = new THREE.Group()
    tower.add(member([x, 0.5, -0.42], [x, 1.5, -0.1], 0.035, darkSteel))
    tower.add(member([x, 0.5, 0.42], [x, 1.5, 0.1], 0.035, darkSteel))
    tower.add(member([x, 1.5, -0.1], [x, 1.5, 0.1], 0.03, steel))
    cable.add(tower)
  }
  const catenary = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const x = -1.55 + t * 3.1
    const y = 1.5 - Math.sin(t * Math.PI) * 0.42
    catenary.push(new THREE.Vector3(x, y, 0))
  }
  cable.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(catenary), 40, 0.022, 8), cableMat))
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    const x = -1.55 + t * 3.1
    const y = 1.5 - Math.sin(t * Math.PI) * 0.42
    cable.add(member([x, y, 0], [x, 0.52, 0], 0.008, cableMat))
  }
  register('motion', 'Suspension cable', 'The cable carries tension and transfers load to the towers.', cable, [0, 0.4, 0])

  // Power: sensors, controller, conduits.
  const sensor = new THREE.Group()
  const sensorBody = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.12, 0.14, 3, 0.02), sensorMat)
  sensor.add(sensorBody)
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), std('#ffd7d7', 0.2, 0.2, { emissive: '#ff5a5a', emissiveIntensity: 1.2 }))
  lens.position.set(0, -0.06, 0)
  sensor.add(lens)
  register('power', 'Load sensor', 'Load sensors measure strain and support structural monitoring.', sensor, [0.6, 0.22, 0.4])

  const controller = new THREE.Group()
  const cabinet = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.4, 0.2, 3, 0.03), std('#d8dde2', 0.4, 0.45))
  controller.add(cabinet)
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.01), std('#123a2a', 0.1, 0.3, { emissive: '#2dd48f', emissiveIntensity: 0.7 }))
  screen.position.set(0, 0.08, 0.105)
  controller.add(screen)
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), darkSteel)
  antenna.position.set(0.1, 0.33, 0)
  controller.add(antenna)
  register('power', 'Signal controller', 'The controller gathers sensor data for analysis and alerts.', controller, [-0.9, 1.35, 0.45])

  for (const [side, name] of [[-1, 'Left conduit'], [1, 'Right conduit']]) {
    const conduit = new THREE.Group()
    const run = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.55, side * 0.3),
      new THREE.Vector3(0, 0.1, side * 0.36),
      new THREE.Vector3(side * 0.35, 0.55, side * 0.4),
    ]), 24, 0.028, 8), conduitMat)
    conduit.add(run)
    for (let i = 0; i < 3; i++) {
      const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 8, 16), darkSteel)
      clamp.position.set(side * 0.1 * i, -0.3 + i * 0.42, side * (0.32 + i * 0.03))
      clamp.rotation.y = Math.PI / 2
      conduit.add(clamp)
    }
    register('power', name, 'Conduits protect power and data lines from the environment.', conduit, [side * 0.55, 0.8, 0])
  }

  return { parts, systems: ['structure', 'motion', 'power'] }
}

/** Earth Systems: cutaway planet, drifting plates, shell atmosphere. */
export function buildEarth(scene) {
  const parts = []
  const register = (systemId, name, description, object, position) => {
    object.position.set(...position)
    object.userData = { name, description, source: null, systemId, basePosition: new THREE.Vector3(...position) }
    object.traverse((o) => {
      if (o.isMesh) o.castShadow = false
    })
    parts.push(object)
    return object
  }

  const PHI_START = Math.PI * 0.35
  const PHI_LEN = Math.PI * 1.45

  const innerCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 40, 28),
    std('#ffd9a0', 0.9, 0.25, { emissive: '#ff9d3c', emissiveIntensity: 2.1 })
  )
  register('layers', 'Inner core', 'The inner core is a solid iron-rich sphere under immense pressure.', innerCore, [0, 0, 0])

  const outerCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.74, 44, 30, PHI_START, PHI_LEN),
    std('#e8853a', 0.55, 0.4, { emissive: '#c25217', emissiveIntensity: 0.85, side: THREE.DoubleSide })
  )
  register('layers', 'Outer core', 'The liquid outer core drives Earth\u2019s magnetic field.', outerCore, [0, 0, 0])

  const mantle = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 48, 32, PHI_START, PHI_LEN),
    physical('#9c4a2f', { roughness: 0.75, metalness: 0.05, transparent: true, opacity: 0.88, side: THREE.DoubleSide })
  )
  register('layers', 'Mantle', 'The mantle transfers heat through slow convection.', mantle, [0, 0, 0])

  const crust = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, 52, 36, PHI_START, PHI_LEN),
    std('#6e7f5c', 0.1, 0.9, { side: THREE.DoubleSide, flatShading: true })
  )
  register('layers', 'Crust', 'The crust is the thin, brittle outer layer where we live.', crust, [0, 0, 0])

  // Tectonics: two plates drifting apart over a glowing rift + magma plume.
  const plateGeo = (phiStart) => new THREE.SphereGeometry(1.2, 40, 24, phiStart, Math.PI * 0.55, Math.PI * 0.18, Math.PI * 0.42)
  const plateMatA = std('#7d8a63', 0.1, 0.85, { flatShading: true })
  const plateMatB = std('#8a7a5e', 0.1, 0.85, { flatShading: true })
  const plateA = new THREE.Mesh(plateGeo(Math.PI * 0.42), plateMatA)
  register('tectonics', 'Plate A', 'Tectonic plates move over the softer asthenosphere.', plateA, [0, 0, 0])
  const plateB = new THREE.Mesh(plateGeo(Math.PI * 1.05), plateMatB)
  register('tectonics', 'Plate B', 'Plate boundaries generate earthquakes, mountains, and volcanism.', plateB, [0, 0, 0])

  const magma = new THREE.Group()
  const plumeProfile = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    plumeProfile.push(new THREE.Vector2(0.07 + 0.1 * Math.sin(t * Math.PI * 0.8), 0.5 + t * 0.95))
  }
  const plume = new THREE.Mesh(
    new THREE.LatheGeometry(plumeProfile, 20),
    std('#ff7a33', 0.2, 0.4, { emissive: '#ff4d00', emissiveIntensity: 1.4, transparent: true, opacity: 0.92 })
  )
  magma.add(plume)
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 20), std('#54473c', 0.1, 0.95))
  cone.position.y = 1.5
  magma.add(cone)
  const riftLight = new THREE.PointLight('#ff6a2a', 1.6, 3)
  riftLight.position.y = 1.35
  magma.add(riftLight)
  register('tectonics', 'Magma column', 'Magma rises where heat and pressure create a path through the crust.', magma, [0, 0, 0])

  // Atmosphere: nested translucent shells + drifting cloud cluster.
  const tropo = new THREE.Mesh(
    new THREE.SphereGeometry(1.34, 48, 32),
    physical('#79b9d3', { roughness: 1, metalness: 0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  )
  register('atmosphere', 'Troposphere', 'The troposphere contains most weather and atmospheric water vapor.', tropo, [0, 0, 0])

  const strato = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 48, 32),
    physical('#9fd4e8', { roughness: 1, metalness: 0, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
  )
  register('atmosphere', 'Stratosphere', 'The stratosphere contains the ozone layer.', strato, [0, 0, 0])

  const clouds = new THREE.Group()
  const cloudMat = std('#f4f7fa', 0, 0.9, { transparent: true, opacity: 0.85 })
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const blob = new THREE.Group()
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (j % 2) * 0.03, 12, 8), cloudMat)
      puff.position.set(j * 0.08 - 0.08, (j % 2) * 0.02, 0)
      puff.scale.y = 0.55
      blob.add(puff)
    }
    blob.position.set(Math.cos(a) * 1.3, 0.35 + Math.sin(a * 2) * 0.5, Math.sin(a) * 1.3)
    blob.lookAt(0, blob.position.y, 0)
    clouds.add(blob)
  }
  clouds.userData.spin = true
  register('atmosphere', 'Cloud system', 'Clouds move energy and water through the climate system.', clouds, [0, 0, 0])

  // Starfield backdrop (space theme).
  const starPositions = new Float32Array(900 * 3)
  for (let i = 0; i < 900; i++) {
    const r = 60 + Math.random() * 30
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = r * Math.cos(phi)
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfe2ff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.8 }))
  stars.userData.backdrop = true
  scene.add(stars)

  return { parts, systems: ['layers', 'tectonics', 'atmosphere'], animated: clouds }
}

/** Generic fallback: the box catalog, upgraded (rounded geometry + PBR). */
export function buildCatalogSubject(scene, subject) {
  const parts = []
  Object.entries(subject.parts).forEach(([systemId, list]) => {
    const system = subject.systems.find((s) => s.id === systemId) || { color: '#8fb8d8' }
    list.forEach((part) => {
      const [name, position, size, description, source] = part
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(0.06, Math.min(...size) * 0.24)),
        std(system.color, 0.25, 0.45)
      )
      mesh.position.set(...position)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { name, description, source: source || null, systemId, basePosition: new THREE.Vector3(...position) }
      parts.push(mesh)
    })
  })
  return { parts, systems: subject.systems.map((s) => s.id) }
}

// ------------------------------------------------------------------ viewer
const BUILDERS = { plants: buildPlants, engineering: buildBridge, earth: buildEarth }

/**
 * SubjectViewer: state-driven scene for the procedural subjects.
 * state: { activeSystem, explode(0-100), isolated, selectedName, labels, autoRotate }
 */
export class SubjectViewer {
  constructor(host, subjectId, subject, opts = {}) {
    this.host = host
    this.opts = opts
    this.subjectId = subjectId
    this.state = { activeSystem: subject.systems[0]?.id, explode: 0, isolated: false, selectedName: null, labels: true, autoRotate: false }
    this.amount = 0
    this.disposed = false
    this.lastState = null
    this.partLabels = []
    this.labelThrottle = 0

    const isEarth = subjectId === 'earth'
    try {
      this.studio = createStudio(host, {
        theme: isEarth ? 'space' : 'dark',
        stage: isEarth ? null : 'plinth',
        stageRadius: isEarth ? 3 : subjectId === 'plants' ? 2.2 : 3.1,
        grid: !isEarth,
        fov: 37,
        cameraPosition: isEarth ? [2.6, 1.4, 3.4] : [-3.6, 2.2, 4.4],
        target: isEarth ? [0, 0, 0] : [0, 0.6, 0],
        minDistance: isEarth ? 1.6 : 1.5,
        maxDistance: 40,
        shadows: !isEarth,
        onContextLost: (m) => opts.onError && opts.onError(m),
      })
    } catch {
      opts.onError && opts.onError('Your browser could not start the 3D view.')
      this.failed = true
      return
    }

    const build = BUILDERS[subjectId]
    this.model = build ? build(this.studio.scene) : buildCatalogSubject(this.studio.scene, subject)

    // Group parts by system for solo/ghost visibility.
    this.groups = {}
    for (const sysId of this.model.systems) {
      const g = new THREE.Group()
      g.userData.system = sysId
      this.studio.scene.add(g)
      this.groups[sysId] = g
    }
    this.model.parts.forEach((p) => {
      const g = this.groups[p.userData.systemId]
      if (g) g.add(p)
    })
    this.systemColors = {}
    subject.systems.forEach((s) => { this.systemColors[s.id] = s.color })

    // Numbered labels for the active system's parts.
    this._buildLabels()
    this._bindPointer()
    this.studio.onFrame((dt) => this._frame(dt))
  }

  _buildLabels() {
    this.model.parts.forEach((p, i) => {
      const b = document.createElement('button')
      b.className = 'scene-label'
      b.innerHTML = '<span>' + String(i + 1).padStart(2, '0') + '</span><strong>' + p.userData.name + '</strong>'
      b.setAttribute('aria-label', 'Inspect ' + p.userData.name)
      b.addEventListener('click', () => {
        this.opts.onSelect && this.opts.onSelect(p.userData.systemId, p.userData)
      })
      b.hidden = true
      this.host.appendChild(b)
      this.partLabels.push({ b, part: p, index: i })
    })
  }

  _bindPointer() {
    const { renderer, camera } = this.studio
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const tap = new PointerTap()
    const el = renderer.domElement
    const down = (e) => tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 10 : 5)
    const move = (e) => tap.move(e.pointerId, e.clientX, e.clientY)
    const cancel = (e) => tap.cancel(e.pointerId)
    const up = (e) => {
      if (!tap.up(e.pointerId, e.clientX, e.clientY)) return
      const r = el.getBoundingClientRect()
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const candidates = Object.values(this.groups)
        .filter((g) => g.visible)
        .flatMap((g) => g.children)
        .filter((p) => p.visible)
      const hits = raycaster.intersectObjects(candidates, true)
      for (const hit of hits) {
        let o = hit.object
        while (o && !o.userData?.name) o = o.parent
        if (o && o.userData?.name) {
          this.opts.onSelect && this.opts.onSelect(o.userData.systemId, o.userData)
          return
        }
      }
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointercancel', cancel)
    el.addEventListener('pointerup', up)
    this._pointerCleanup = () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointercancel', cancel)
      el.removeEventListener('pointerup', up)
    }
  }

  setState(partial) {
    this.state = { ...this.state, ...partial }
    this.studio && this.studio.invalidate()
  }

  reset() {
    const { camera, controls } = this.studio
    const isEarth = this.subjectId === 'earth'
    camera.position.set(...(isEarth ? [2.6, 1.4, 3.4] : [-3.6, 2.2, 4.4]))
    controls.target.set(...(isEarth ? [0, 0, 0] : [0, 0.6, 0]))
    controls.update()
    this.studio.invalidate()
  }

  _applySelectionGlow() {
    const selected = this.state.selectedName
    this.model.parts.forEach((p) => {
      const isSelected = p.userData.name === selected
      p.traverse((o) => {
        if (!o.isMesh) return
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          if (!m.emissive) return
          if (m.userData.baseEmission === undefined) {
            m.userData.baseEmission = m.emissive.getHex()
            m.userData.baseIntensity = m.emissiveIntensity
          }
          if (isSelected) {
            m.emissive.set('#f0b35b')
            m.emissiveIntensity = 0.32
          } else {
            m.emissive.setHex(m.userData.baseEmission)
            m.emissiveIntensity = m.userData.baseIntensity
          }
        })
      })
    })
  }

  _frame(dt) {
    if (this.disposed || this.failed) return false
    const s = this.state
    const { camera, controls, host, reducedMotion } = this.studio
    const target = s.explode / 100
    const moving = Math.abs(this.amount - target) > 0.0001
    if (moving) this.amount = reducedMotion ? target : THREE.MathUtils.damp(this.amount, target, 7, dt)

    const stateChanged =
      !this.lastState ||
      this.lastState.activeSystem !== s.activeSystem ||
      this.lastState.isolated !== s.isolated ||
      this.lastState.selectedName !== s.selectedName ||
      this.lastState.labels !== s.labels

    if (moving || stateChanged) {
      if (stateChanged && (!this.lastState || this.lastState.selectedName !== s.selectedName)) this._applySelectionGlow()
      const systemIds = this.model.systems
      systemIds.forEach((sysId, sysIndex) => {
        const g = this.groups[sysId]
        const isActive = sysId === s.activeSystem
        g.visible = true
        // Ghost inactive systems instead of hiding them: context is kept,
        // the active system stays the hero.
        g.traverse((o) => {
          if (!o.isMesh) return
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => {
            if (m.userData.baseOpacity === undefined) {
              m.userData.baseOpacity = m.opacity
              m.userData.baseTransparent = m.transparent
              m.userData.baseDepthWrite = m.depthWrite
            }
            const ghost = !isActive && !s.isolated
            m.transparent = ghost ? true : m.userData.baseTransparent
            m.opacity = ghost ? 0.07 : m.userData.baseOpacity
            m.depthWrite = ghost ? false : m.userData.baseDepthWrite
          })
        })
        // Explode: systems separate vertically, parts fan out within.
        g.position.y = (sysIndex - (systemIds.length - 1) / 2) * this.amount * 0.9
        g.children.forEach((p, i) => {
          const base = p.userData.basePosition
          const dir = new THREE.Vector3(
            Math.cos((i / Math.max(1, g.children.length)) * Math.PI * 2 + sysIndex),
            (i % 2 === 0 ? 0.35 : -0.2) + (base.y > 0 ? 0.25 : -0.15),
            Math.sin((i / Math.max(1, g.children.length)) * Math.PI * 2 + sysIndex)
          ).normalize()
          p.position.copy(base).addScaledVector(dir, this.amount * 0.85)
          const isolatedHide = s.isolated && p.userData.name !== s.selectedName
          const inactiveHide = s.isolated && p.userData.systemId !== s.activeSystem && p.userData.name !== s.selectedName
          p.visible = !isolatedHide && !inactiveHide
        })
      })
      this.lastState = { activeSystem: s.activeSystem, isolated: s.isolated, selectedName: s.selectedName, labels: s.labels }
      this.studio.refreshShadows()
      this.studio.invalidate()
    }

    // Earth clouds drift continuously (gentle, reduced-motion aware).
    if (this.model.animated && !reducedMotion) {
      this.model.animated.rotation.y += dt * 0.08
      this.studio.invalidate()
    }

    controls.autoRotate = s.autoRotate && !reducedMotion
    if (controls.autoRotate) this.studio.invalidate()

    // Labels for the active system (throttled transform-only updates).
    const now = performance.now()
    if (now - this.labelThrottle > 50 || moving) {
      this.labelThrottle = now
      const viewWidth = host.clientWidth
      const viewHeight = host.clientHeight
      const v = new THREE.Vector3()
      this.partLabels.forEach(({ b, part }) => {
        const show =
          s.labels &&
          part.visible &&
          part.userData.systemId === s.activeSystem &&
          this.groups[part.userData.systemId] !== undefined
        if (b.hidden === show) b.hidden = !show
        if (!show) return
        part.getWorldPosition(v)
        v.project(camera)
        b.style.display = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 ? 'flex' : 'none'
        b.classList.toggle('chosen', part.userData.name === s.selectedName)
        b.style.transform = `translate3d(${(v.x * 0.5 + 0.5) * viewWidth}px, ${(-v.y * 0.5 + 0.5) * viewHeight}px, 0) translate(-12px, -50%)`
      })
    }
    return moving || controls.autoRotate || Boolean(this.model.animated && !reducedMotion)
  }

  dispose() {
    this.disposed = true
    if (this.failed) return
    this._pointerCleanup && this._pointerCleanup()
    this.partLabels.forEach((x) => x.b.remove())
    this.studio.dispose()
  }
}
