/**
 * The legacy XR Atrium — extracted from `VirtualCampus.tsx`.
 *
 * Consolidation note: this geometry used to be built inline inside the
 * component's `useEffect`, ~330 lines of scene construction mixed into the
 * render loop. It was moved here unchanged in substance so that:
 *
 *   • `VirtualCampus` can orchestrate eleven floors instead of one fixed set,
 *   • the atrium can be reused by the architectural tour and the map preview,
 *   • teardown is deterministic (the inline version leaked geometries and
 *     materials on every floor change, since only `renderer.dispose()` ran).
 *
 * Everything from the original is preserved: the polished terrazzo slab, the
 * architectural grid, the ceiling and glass skylight, the biophilic planters,
 * the central pillar with its floating DNA hologram, the holographic elevator
 * column with one ring per floor, and the four facility wings — each with its
 * science apparatus, portal doorway, glowing frame, signboard, light beacon and
 * proximity trigger box.
 *
 * One correctness fix: the original lit elevator rings compared
 * `h === activeFloorNum` for h in 1..4, so the "active floor" ring could never
 * be highlighted from any of the new floors. `activeFloor` is now passed in and
 * any floor outside 1-4 simply leaves all rings dim.
 */

import * as THREE from 'three';
import {
  createPolishedTerrazzoTexture,
  createBiophilicPlanters,
  createWingApparatus,
} from './campus3dHelpers';
import {
  createBuildResult,
  type CampusBuildResult,
} from '../../render/campusKit';
import type { CampusFacility, LabId } from '../../types';

export interface AtriumWingDefinition {
  id: string;
  name: string;
  pos: [number, number, number];
  color: number;
  apparatusType: 'chem' | 'astro' | 'bio' | 'optics';
  labId: LabId;
  facility: CampusFacility;
}

/**
 * The four legacy facility wings, exactly as authored. Exported so the 2D map,
 * the architectural tour and proximity prompts all agree on room numbers.
 */
export const ATRIUM_WINGS: AtriumWingDefinition[] = [
  {
    id: 'wing-chem',
    name: 'Chemistry Laboratory (VSEPR & Bonding)',
    pos: [-14, 0, -6],
    color: 0x06b6d4,
    apparatusType: 'chem',
    labId: 'chemistry' as LabId,
    facility: {
      id: 'fac-chem',
      roomNumber: 'Room 102',
      name: '3D Chemistry Laboratory',
      type: 'lab',
      associatedLabId: 'chemistry' as LabId,
      tutorInResidence: 'prof-kev',
      description: 'Explore molecular geometry, polar dipole moments, and covalent bond strain in real-time.',
      interactActionLabel: 'Enter 3D Chemistry Lab',
      coordinates: { x: -14, z: -6 },
    },
  },
  {
    id: 'wing-astro',
    name: 'Kepler Astrophysics & Planetary Dome',
    pos: [14, 0, -6],
    color: 0xf59e0b,
    apparatusType: 'astro',
    labId: 'astrophysics' as LabId,
    facility: {
      id: 'fac-astro',
      roomNumber: 'Room 301',
      name: 'Kepler Planetary Observatory',
      type: 'observatory',
      associatedLabId: 'astrophysics' as LabId,
      tutorInResidence: 'dr-alvarez',
      description: 'N-body gravitation simulation, Keplerian orbital velocity curves, and stellar masses.',
      interactActionLabel: 'Enter Astrophysics Lab',
      coordinates: { x: 14, z: -6 },
    },
  },
  {
    id: 'wing-bio',
    name: 'Cellular Biology & Organelle Center',
    pos: [-14, 0, 10],
    color: 0x10b981,
    apparatusType: 'bio',
    labId: 'biology' as LabId,
    facility: {
      id: 'fac-bio',
      roomNumber: 'Room 201',
      name: 'Cellular Biology Lab',
      type: 'lab',
      associatedLabId: 'biology' as LabId,
      tutorInResidence: 'dr-chen',
      description: 'Inspect eukaryotic organelles, mitochondria proton gradients, and DNA double helix codons.',
      interactActionLabel: 'Enter Biology Lab',
      coordinates: { x: -14, z: 10 },
    },
  },
  {
    id: 'wing-optics',
    name: 'Optics Dispersion & Laser Lab',
    pos: [14, 0, 10],
    color: 0x8b5cf6,
    apparatusType: 'optics',
    labId: 'optics' as LabId,
    facility: {
      id: 'fac-optics',
      roomNumber: 'Room 202',
      name: 'Wave Optics Lab',
      type: 'cleanroom',
      associatedLabId: 'optics' as LabId,
      tutorInResidence: 'prof-novak',
      description: 'Test Snell\u2019s Law of refraction, Cauchy dispersion coefficients, and total internal reflection.',
      interactActionLabel: 'Enter Optics Lab',
      coordinates: { x: 14, z: 10 },
    },
  },
];

export interface AtriumBuildOptions {
  /** Floor whose elevator ring lights up. */
  activeFloor: number;
  /** Total rings on the elevator column (the school now has floors 0-10). */
  floorCount?: number;
  /** Per-floor ring colours, indexed by floor number. */
  floorColours?: Record<number, string>;
}

export interface AtriumBuild extends CampusBuildResult {
  /** Proximity trigger boxes for the four wings. */
  roomZones: { facility: CampusFacility; box: THREE.Box3 }[];
  /** The rotating DNA hologram, exposed so callers can drive it. */
  dnaGroup: THREE.Group;
  /** Wing apparatus groups, exposed so callers can spin them. */
  apparatusList: THREE.Group[];
}

export function buildAtriumCampus(options: AtriumBuildOptions): AtriumBuild {
  const { activeFloor, floorCount = 11, floorColours = {} } = options;
  const result = createBuildResult('legacy-xr-atrium');
  const roomZones: { facility: CampusFacility; box: THREE.Box3 }[] = [];
  const apparatusList: THREE.Group[] = [];

  // --- Floor slab: 60 m x 60 m polished terrazzo --------------------------
  const terrazzoTexture = createPolishedTerrazzoTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: terrazzoTexture,
    roughness: 0.18,
    metalness: 0.35,
  });
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  result.register(floorMesh);

  // Architectural grid lines.
  const grid = new THREE.GridHelper(60, 60, 0x06b6d4, 0x1e293b);
  grid.position.y = 0.01;
  result.register(grid);

  // --- Ceiling & skylight -------------------------------------------------
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
  );
  ceiling.position.y = 7.0;
  ceiling.rotation.x = Math.PI / 2;
  result.register(ceiling);

  const skylight = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 0.2, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.45,
      roughness: 0.1, metalness: 0.2, transmission: 0.8,
    })
  );
  skylight.position.set(0, 6.95, 0);
  result.register(skylight);
  result.transparent.push(skylight);

  // Biophilic living plant columns.
  const planters = createBiophilicPlanters();
  result.register(planters);

  // --- Central pillar + floating DNA hologram -----------------------------
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.8, 6.8, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 })
  );
  pillar.position.set(0, 3.4, 0);
  pillar.castShadow = true;
  result.register(pillar);

  const dnaGroup = new THREE.Group();
  dnaGroup.position.set(0, 3.5, 0);
  const nodeGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const nodeMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const nodeMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 4;
    const y = (i - 10) * 0.25;
    const n1 = new THREE.Mesh(nodeGeo, nodeMat1);
    n1.position.set(Math.cos(angle) * 2.2, y, Math.sin(angle) * 2.2);
    dnaGroup.add(n1);
    const n2 = new THREE.Mesh(nodeGeo, nodeMat2);
    n2.position.set(Math.cos(angle + Math.PI) * 2.2, y, Math.sin(angle + Math.PI) * 2.2);
    dnaGroup.add(n2);
  }
  result.register(dnaGroup);
  result.addUpdateable({
    object: dnaGroup,
    update: (_dt, t) => { dnaGroup.rotation.y = t * 0.6; },
  });

  // --- Holographic elevator column ---------------------------------------
  const elevatorTube = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 7.0, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    })
  );
  elevatorTube.position.set(0, 3.5, -12);
  result.register(elevatorTube);
  result.transparent.push(elevatorTube);

  const ringGeo = new THREE.TorusGeometry(2.5, 0.06, 8, 32);
  for (let h = 0; h < floorCount; h++) {
    const isActive = h === activeFloor;
    const colour = floorColours[h]
      ? new THREE.Color(floorColours[h]).getHex()
      : isActive ? 0x06b6d4 : 0x475569;
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: isActive ? 0x06b6d4 : colour })
    );
    ring.rotation.x = Math.PI / 2;
    // Compress the ring stack so eleven floors still fit the 7 m column.
    ring.position.set(0, 0.5 + (h / Math.max(1, floorCount - 1)) * 6.0, -12);
    result.register(ring);
  }

  // --- Four facility wings ------------------------------------------------
  ATRIUM_WINGS.forEach((w) => {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    const roomMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 12), wallMat);
    roomMesh.position.set(w.pos[0], 2.25, w.pos[2]);
    roomMesh.castShadow = true;
    roomMesh.receiveShadow = true;
    result.register(roomMesh);

    const apparatus = createWingApparatus(w.apparatusType);
    apparatus.position.set(w.pos[0], 2.0, w.pos[2] + 1.5);
    result.register(apparatus);
    apparatusList.push(apparatus);

    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.8),
      new THREE.MeshBasicMaterial({ color: w.color, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    door.position.set(w.pos[0], 1.9, w.pos[2] + 6.01);
    result.register(door);
    result.transparent.push(door);

    const doorFrame = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 1.9, 4),
      new THREE.MeshBasicMaterial({ color: w.color })
    );
    doorFrame.rotation.z = Math.PI / 4;
    doorFrame.position.set(w.pos[0], 2.2, w.pos[2] + 6.05);
    result.register(doorFrame);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    sign.position.set(w.pos[0], 4.2, w.pos[2] + 6.1);
    result.register(sign);

    const beacon = new THREE.PointLight(w.color, 2.5, 8);
    beacon.position.set(w.pos[0], 3.0, w.pos[2] + 5.0);
    result.group.add(beacon);

    // Proximity trigger box in front of the doorway.
    roomZones.push({
      facility: w.facility,
      box: new THREE.Box3(
        new THREE.Vector3(w.pos[0] - 4, 0, w.pos[2] + 3),
        new THREE.Vector3(w.pos[0] + 4, 4, w.pos[2] + 8)
      ),
    });

    // Make the doorway itself clickable.
    result.addInteractable(door, w.facility);
  });

  // Spin the wing apparatus at slightly different rates, as before.
  result.addUpdateable({
    object: result.group,
    update: (_dt, t) => {
      apparatusList.forEach((ap, idx) => { ap.rotation.y = t * (0.4 + idx * 0.1); });
    },
  });

  return Object.assign(result, { roomZones, dnaGroup, apparatusList });
}
