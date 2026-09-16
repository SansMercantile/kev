/**
 * The KEV International Virtual School building.
 *
 * The user asked for advanced XR in the hallway *and* in the virtual school
 * facilities. Before consolidation the virtual school existed only as a REST
 * payload (`/xr/campus/virtual-school`) and a 2D card list — there was no 3D
 * form for it anywhere in the campus. This module builds it: six levels from
 * basement to roof, one room per bookable facility, placed at the facility's own
 * coordinates with its own capacity, equipment and accessibility data.
 *
 * Driven entirely by `VIRTUAL_SCHOOL` in `src/xr/data/schoolCampus.ts`, which
 * mirrors the live `VirtualSchoolBuilding` from
 * `virtual_school/core/virtual_school_building.py`. If a facility is added to
 * the real building it appears here on the next mirror regeneration.
 *
 * Levels (from the live building):
 *   basement  Support, Maintenance & Storage
 *   ground    Commons, Administration & Library
 *   first     Core Academics — Mathematics, Science, Computing
 *   second    Arts — Music, Visual Art, Dance
 *   third     Large-Group Instruction — Auditorium & Lecture Halls
 *   roof      Observation Deck & Observatory Aperture
 */

import * as THREE from 'three';
import {
  createBuildResult,
  createSignPanel,
  createLightCove,
  createGlassPartition,
  createHologramProjector,
  type CampusBuildResult,
  type CampusMaterialLibrary,
} from '../../render/campusKit';
import type { TierSettings } from '../../render/highFidelityRenderer';
import type { SchoolFacility, VirtualSchool, VirtualSchoolLevel } from '../../data/schoolCampus';

export interface VirtualSchoolBuildOptions {
  school: VirtualSchool;
  materials: CampusMaterialLibrary;
  settings: TierSettings;
  /** Uniform scale applied to facility coordinates (they are small integers). */
  coordinateScale?: number;
  /** Height of each storey in metres. */
  storeyHeight?: number;
  onInteract?: (facility: SchoolFacility, level: VirtualSchoolLevel) => void;
}

export interface VirtualSchoolBuild extends CampusBuildResult {
  /** Proximity zones, one per facility, in world space of the returned group. */
  roomZones: { facility: SchoolFacility; level: VirtualSchoolLevel; box: THREE.Box3 }[];
  /** Every facility mesh, for raycasting. */
  facilities: SchoolFacility[];
}

const GLYPH_FOR_TYPE: Record<string, 'dna' | 'atom' | 'orbit' | 'prism' | 'grid' | 'helix'> = {
  gymnasium: 'orbit',
  library: 'grid',
  cafeteria: 'prism',
  laboratory: 'dna',
  lab: 'dna',
  computer_lab: 'grid',
  music_room: 'atom',
  art_studio: 'prism',
  dance_studio: 'orbit',
  auditorium: 'prism',
  lecture_hall: 'grid',
  classroom: 'grid',
  office: 'grid',
  common_area: 'orbit',
  observatory: 'orbit',
  storage: 'grid',
};

export function buildVirtualSchoolBuilding(options: VirtualSchoolBuildOptions): VirtualSchoolBuild {
  const { school, materials, settings, onInteract } = options;
  const coordinateScale = options.coordinateScale ?? 1.6;
  const storeyHeight = options.storeyHeight ?? 4.4;

  const result = createBuildResult('kev-international-virtual-school');
  const roomZones: VirtualSchoolBuild['roomZones'] = [];
  const facilities: SchoolFacility[] = [];

  const levels = [...school.levels].sort((a, b) => a.order - b.order);
  const levelCount = Math.max(1, levels.length);

  // Footprint sized from the widest facility extent, so nothing overhangs.
  let maxExtent = 18;
  levels.forEach((level) => {
    level.facilities.forEach((f) => {
      maxExtent = Math.max(
        maxExtent,
        Math.abs(f.coordinates.x) * coordinateScale,
        Math.abs(f.coordinates.z) * coordinateScale
      );
    });
  });
  const footprint = maxExtent * 2 + 14;

  // ---------------------------------------------------------------------
  // Ground plate + entrance steps
  // ---------------------------------------------------------------------
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(footprint, 0.5, footprint),
    materials.terrazzo
  );
  plate.position.y = -0.25;
  plate.receiveShadow = true;
  result.register(plate);

  const steps = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.24, 3.2),
    materials.concrete
  );
  steps.position.set(0, 0.12, footprint / 2 - 1.4);
  steps.receiveShadow = true;
  result.register(steps);

  // ---------------------------------------------------------------------
  // Storeys: slab, level band, ceiling cove, glazed facade
  // ---------------------------------------------------------------------
  levels.forEach((level, index) => {
    const y = index * storeyHeight;
    const accent = new THREE.Color(level.color).getHex();

    // Slab.
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(footprint, 0.34, footprint),
      index === 0 ? materials.concrete : materials.vinyl
    );
    slab.position.y = y + 0.17;
    slab.receiveShadow = true;
    slab.castShadow = true;
    result.register(slab);

    // Illuminated level band around the perimeter — reads the storey from afar.
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(footprint + 0.3, 0.16, footprint + 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x0b1220, emissive: accent, emissiveIntensity: 2.1, roughness: 0.4,
      })
    );
    band.position.y = y + 0.42;
    result.register(band);

    // Ceiling coves (skip the open roof level).
    const isRoof = level.level === 'roof';
    if (!isRoof) {
      [-1, 1].forEach((side) => {
        const cove = createLightCove(footprint * 0.6, 0.44);
        cove.position.set(side * footprint * 0.22, y + storeyHeight - 0.2, 0);
        result.register(cove);
      });
      const coveLight = new THREE.PointLight(0xeaf6ff, 3.4, 24, 2);
      coveLight.position.set(0, y + storeyHeight - 0.6, 0);
      result.group.add(coveLight);
    }

    // Glazed facade on all four sides.
    if (!isRoof) {
      for (let s = 0; s < 4; s++) {
        const facade = createGlassPartition(footprint * 0.94, storeyHeight * 0.72, materials);
        const angle = (s / 4) * Math.PI * 2;
        facade.position.set(
          Math.sin(angle) * (footprint / 2),
          y + storeyHeight * 0.42,
          Math.cos(angle) * (footprint / 2)
        );
        facade.rotation.y = angle;
        result.register(facade);
        result.transparent.push(facade);
      }
    }

    // Level sign on the entrance-facing side.
    const sign = createSignPanel(
      {
        eyebrow: level.levelDisplayName,
        title: level.themeAndSubject,
        subtitle: isRoof
          ? 'Open observation deck — no enclosed facilities'
          : `${level.facilitiesCount} bookable ${level.facilitiesCount === 1 ? 'facility' : 'facilities'}`,
        accent: level.color,
        width: 1536,
        height: 320,
        titleSize: 92,
      },
      { width: Math.min(11, footprint * 0.5), height: 1.5 },
      materials
    );
    sign.position.set(0, y + storeyHeight * 0.82, footprint / 2 + 0.16);
    result.register(sign);

    // -----------------------------------------------------------------
    // One room per facility, at the facility's own coordinates
    // -----------------------------------------------------------------
    level.facilities.forEach((facility) => {
      facilities.push(facility);
      const fx = facility.coordinates.x * coordinateScale;
      const fz = facility.coordinates.z * coordinateScale;
      const fy = y + 0.34;

      // Dimensions come from the live building when present, else from capacity.
      const dims = facility.dimensions && facility.dimensions.length >= 3
        ? facility.dimensions
        : null;
      const capacity = facility.capacity ?? 20;
      const roomW = dims ? Math.max(3, dims[0] * 0.62) : Math.max(3.4, Math.sqrt(capacity) * 1.15);
      const roomD = dims ? Math.max(3, dims[2] * 0.62) : Math.max(3.4, Math.sqrt(capacity) * 1.15);
      const roomH = dims ? Math.max(2.6, Math.min(storeyHeight * 0.72, dims[1] * 0.78)) : storeyHeight * 0.62;

      const room = new THREE.Group();
      room.position.set(fx, fy, fz);
      room.name = `vs-${facility.id}`;

      // Floor finish varies by facility kind.
      const floorMat = facility.schoolFacilityType === 'gymnasium' || facility.type === 'gymnasium'
        ? materials.vinyl
        : facility.type === 'library' || facility.type === 'auditorium' || facility.type === 'lecture_hall'
          ? materials.carpet
          : materials.vinyl;
      const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.1, roomD), floorMat);
      roomFloor.position.y = 0.05;
      roomFloor.receiveShadow = true;
      room.add(roomFloor);

      // Walls: three solid, one glazed toward the corridor.
      const wallMat = materials.acoustic;
      const back = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH, 0.18), wallMat);
      back.position.set(0, roomH / 2, -roomD / 2);
      back.castShadow = true;
      room.add(back);
      [-1, 1].forEach((side) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.18, roomH, roomD), wallMat);
        wall.position.set(side * roomW / 2, roomH / 2, 0);
        wall.castShadow = true;
        room.add(wall);
      });
      const front = createGlassPartition(roomW * 0.92, roomH * 0.92, materials);
      front.position.set(0, 0, roomD / 2);
      room.add(front);
      result.transparent.push(front);

      // Room sign above the glazing.
      const roomSign = createSignPanel(
        {
          eyebrow: facility.roomNumber,
          title: facility.name,
          subtitle: facility.description,
          footer: [
            facility.capacity ? `Capacity ${facility.capacity}` : null,
            facility.isBooked ? 'Booked' : 'Available',
            facility.tutorInResidence ? `Tutor ${facility.tutorInResidence}` : null,
          ].filter(Boolean).join('  ·  '),
          accent: level.color,
          width: 1024,
          height: 320,
          titleSize: 82,
        },
        { width: Math.min(roomW * 0.9, 3.4), height: 0.95 },
        materials
      );
      roomSign.position.set(0, roomH + 0.62, roomD / 2 + 0.06);
      room.add(roomSign);

      // Subject hologram inside the room.
      const glyph = GLYPH_FOR_TYPE[facility.schoolFacilityType ?? '']
        ?? GLYPH_FOR_TYPE[facility.type] ?? 'grid';
      const holo = createHologramProjector({
        accent,
        height: Math.min(1.9, roomH * 0.62),
        radius: Math.min(0.62, roomW * 0.16),
        glyph,
      });
      holo.group.position.set(0, 0.1, 0);
      room.add(holo.group);
      result.transparent.push(holo.group);
      result.addUpdateable({ object: holo.group, update: (dt, t) => holo.update(dt, t) });

      // Practical light + accessibility marker.
      const roomLight = new THREE.PointLight(0xf2fbff, 2.4, Math.max(8, roomW * 1.6), 2);
      roomLight.position.set(0, roomH * 0.85, 0);
      room.add(roomLight);

      if (facility.accessibilityFeatures?.length) {
        const marker = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.04),
          new THREE.MeshStandardMaterial({
            color: 0x0b1220, emissive: 0x34d399, emissiveIntensity: 1.8, roughness: 0.4,
          })
        );
        marker.position.set(roomW / 2 - 0.4, 1.4, roomD / 2 + 0.1);
        room.add(marker);
      }

      result.register(room);
      result.addInteractable(room, facility);
      room.traverse((child) => { child.userData.facility = facility; });
      room.userData.interaction = () => onInteract?.(facility, level);

      roomZones.push({
        facility,
        level,
        box: new THREE.Box3(
          new THREE.Vector3(fx - roomW / 2 - 0.8, fy, fz - roomD / 2 - 0.8),
          new THREE.Vector3(fx + roomW / 2 + 0.8, fy + roomH + 1, fz + roomD / 2 + 0.8)
        ),
      });
    });

    // Roof level: observation deck ring + observatory aperture.
    if (isRoof) {
      const deck = new THREE.Mesh(
        new THREE.TorusGeometry(footprint * 0.32, 0.4, 12, 64),
        materials.metal
      );
      deck.rotation.x = Math.PI / 2;
      deck.position.y = y + 1.1;
      deck.castShadow = true;
      result.register(deck);

      const aperture = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 4.0, 2.6, 32, 1, true),
        materials.glass
      );
      aperture.position.y = y + 2.6;
      result.register(aperture);
      result.transparent.push(aperture);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        materials.metal
      );
      dome.position.y = y + 3.9;
      dome.castShadow = true;
      result.register(dome);

      const observatory = createHologramProjector({ accent, height: 2.6, radius: 0.9, glyph: 'orbit' });
      observatory.group.position.set(0, y + 0.4, 0);
      result.register(observatory.group);
      result.transparent.push(observatory.group);
      result.addUpdateable({
        object: observatory.group,
        update: (dt, t) => observatory.update(dt, t),
      });
    }
  });

  // ---------------------------------------------------------------------
  // Building headline + roof mast
  // ---------------------------------------------------------------------
  const totalFacilities = school.building?.totalFacilities ?? facilities.length;
  const headline = createSignPanel(
    {
      eyebrow: school.building?.name ?? 'KEV International Virtual School',
      title: `${levelCount} levels · ${totalFacilities} facilities`,
      subtitle: school.building?.address ?? 'Basement to roof, all bookable through the virtual-school API',
      accent: '#a855f7',
      width: 2048,
      height: 448,
      titleSize: 128,
    },
    { width: Math.min(13, footprint * 0.6), height: 2.0 },
    materials
  );
  headline.position.set(0, levelCount * storeyHeight + 2.4, footprint / 2 + 0.3);
  result.register(headline);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 4.2, 12),
    materials.metal
  );
  mast.position.set(0, levelCount * storeyHeight + 4.4, 0);
  mast.castShadow = true;
  result.register(mast);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220, emissive: 0xa855f7, emissiveIntensity: 3.2, roughness: 0.3,
    })
  );
  beacon.position.set(0, levelCount * storeyHeight + 6.6, 0);
  beacon.name = 'vs-beacon';
  result.register(beacon);
  result.addUpdateable({
    object: beacon,
    update: (_dt, t) => {
      (beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.6 + Math.sin(t * 2.2) * 0.9;
    },
  });

  void settings;
  return Object.assign(result, { roomZones, facilities });
}
