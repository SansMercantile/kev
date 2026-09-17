/**
 * The Grand Concourse Hallway — floor 0 of the KEV XR school.
 *
 * This is the circulation spine the whole campus hangs off. Before
 * consolidation there was no hallway at all: the four XR wings were four boxes
 * floating on a plane, and the only "corridor" in the codebase was a 2D divider
 * label in `VirtualCampusMapModal`. The hallway is what makes the school legible
 * as a building — you spawn in it, every subject banner is on its walls, the
 * elevator core serves floors 0-10, and the portal at the far end steps through
 * to the KEV International Virtual School (basement → roof, 14 facilities).
 *
 * Built entirely from data in `src/xr/data/schoolCampus.ts` (generated from
 * `backend/core/school_campus.py`), so a new subject area in `multi_agents/`
 * gets a banner here automatically.
 *
 * Advanced-XR content, all interactive via raycast:
 *   • 14 floor-to-ceiling illuminated subject banners (specializations, classes,
 *     agent counts) with a holographic projector per subject
 *   • holographic wayfinding kiosk that draws a light path to any of 176 classes
 *   • faculty directory wall (6 XR faculty + the 872-agent registry)
 *   • pneumatic elevator core with a ring per floor, 0-10
 *   • virtual-school step-through portal
 *   • locker bay, acoustic study nooks, glazed vitrines
 *   • recessed ceiling coves with volumetric light shafts
 *   • animated wayfinding strips embedded in the floor
 */

import * as THREE from 'three';
import type { TierSettings } from '../../render/highFidelityRenderer';
import {
  createBuildResult,
  createCampusMaterials,
  createDoor,
  createGlassPartition,
  createHologramProjector,
  createLightCove,
  createLightShaft,
  createLockerBay,
  createSignPanel,
  createStudyNook,
  createWayfindingStrip,
  updateLightShafts,
  type CampusBuildResult,
  type CampusMaterialLibrary,
} from '../../render/campusKit';
import {
  CAMPUS_FLOORS,
  CORRIDOR,
  CAMPUS_STATISTICS,
  hallway as getHallway,
  hallwayBanners,
  type HallwayBanner,
  type SchoolFacility,
} from '../../data/schoolCampus';

export interface HallwayBuildOptions {
  settings: TierSettings;
  /** Called when the player activates something in the hallway. */
  onInteract?: (payload: HallwayInteraction) => void;
  /** Ceiling height in metres. */
  ceilingHeight?: number;
}

export type HallwayInteraction =
  | { kind: 'banner'; subject: string; banner: HallwayBanner }
  | { kind: 'elevator'; floor: number; floorName: string }
  | { kind: 'portal'; target: 'virtual-school' }
  | { kind: 'kiosk'; facilityId: string }
  | { kind: 'directory'; facilityId: string }
  | { kind: 'locker'; facilityId: string }
  | { kind: 'facility'; facility: SchoolFacility };

const GLYPH_BY_SUBJECT: Record<string, 'dna' | 'atom' | 'orbit' | 'prism' | 'grid' | 'helix'> = {
  Science: 'dna',
  Health: 'helix',
  Mathematics: 'grid',
  Computer_Science: 'grid',
  English: 'atom',
  Languages: 'atom',
  Social_Studies: 'orbit',
  Business: 'orbit',
  Arts: 'prism',
  Music: 'atom',
  Drama: 'prism',
  Physical_Education: 'orbit',
  Vocational: 'grid',
  Emerging_Fields: 'orbit',
};

/**
 * Build the hallway. Returns a group plus the update/interact registries the
 * scene owner drives.
 */
export function buildSchoolHallway(options: HallwayBuildOptions): CampusBuildResult {
  const { settings, onInteract } = options;
  const ceilingHeight = options.ceilingHeight ?? 5.2;

  const result = createBuildResult('grand-concourse-hallway');
  const materials = createCampusMaterials(settings, { accent: 0x22d3ee });

  const hallwayFloor = getHallway();
  const banners = hallwayBanners();
  const corridor = CORRIDOR;
  const length = corridor.length;
  const halfWidth = corridor.halfWidth;
  const halfLength = length / 2;

  const fire = (interaction: HallwayInteraction) => onInteract?.(interaction);

  // -------------------------------------------------------------------------
  // Shell: floor, carpet runner, ceiling, walls
  // -------------------------------------------------------------------------

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 2 + 6, length, 1, 1),
    materials.terrazzo
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'hallway-floor';
  result.register(floor);

  // Carpet runner down the centre: acoustics + a strong wayfinding cue.
  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 1.15, length * 0.985),
    materials.carpet
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.y = 0.012;
  runner.receiveShadow = true;
  result.register(runner);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 2 + 6, length),
    materials.concrete
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ceilingHeight;
  result.register(ceiling);

  // Two long walls, plus end walls.
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, ceilingHeight, length),
      materials.wallPaint
    );
    wall.position.set(side * (halfWidth + 3.2), ceilingHeight / 2, 0);
    wall.receiveShadow = true;
    wall.castShadow = true;
    result.register(wall);

    // Dado rail in brushed metal, continuous the length of the hall.
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, length),
      materials.metal
    );
    rail.position.set(side * (halfWidth + 2.98), 1.05, 0);
    result.register(rail);
  });

  [-1, 1].forEach((end) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(halfWidth * 2 + 6.4, ceilingHeight, 0.4),
      materials.concrete
    );
    wall.position.set(0, ceilingHeight / 2, end * halfLength);
    wall.receiveShadow = true;
    result.register(wall);
  });

  // Structural columns: breaks the 132 m run into bays and catches shadow.
  const columnGeo = new THREE.CylinderGeometry(0.34, 0.38, ceilingHeight, 20);
  const bays = Math.floor(length / 12);
  for (let i = 0; i <= bays; i++) {
    const z = -halfLength + 4 + i * ((length - 8) / bays);
    [-1, 1].forEach((side) => {
      const column = new THREE.Mesh(columnGeo, materials.concrete);
      column.position.set(side * (halfWidth + 1.1), ceilingHeight / 2, z);
      column.castShadow = true;
      column.receiveShadow = true;
      result.register(column);
    });
  }

  // -------------------------------------------------------------------------
  // Ceiling coves + volumetric shafts (the hallway's practical lighting)
  // -------------------------------------------------------------------------

  const coveSpacing = 11;
  const coveCount = Math.floor(length / coveSpacing);
  for (let i = 0; i < coveCount; i++) {
    const z = -halfLength + coveSpacing / 2 + i * coveSpacing;
    [-1, 1].forEach((side) => {
      const cove = createLightCove(coveSpacing * 0.74, 0.5);
      cove.position.set(side * (halfWidth * 0.55), ceilingHeight - 0.16, z);
      result.register(cove);
    });

    const coveLight = new THREE.PointLight(0xeaf6ff, 5.5, 22, 2);
    coveLight.position.set(0, ceilingHeight - 0.5, z);
    // One shadow-casting practical per hallway would be far too expensive;
    // the rig's key light carries the shadows.
    result.group.add(coveLight);

    if (settings.volumetricFog) {
      [-1, 1].forEach((side) => {
        const shaft = createLightShaft(ceilingHeight - 0.4, 2.6, 0x9fe8ff);
        shaft.position.set(side * (halfWidth * 0.55), (ceilingHeight - 0.4) / 2 + 0.1, z);
        result.register(shaft);
        result.transparent.push(shaft);
      });
    }
  }

  // -------------------------------------------------------------------------
  // 14 subject banners — one per subject area, alternating walls
  // -------------------------------------------------------------------------

  const bannerHeight = ceilingHeight * 0.62;
  const bannerWidth = 3.4;
  const bannerSpacing = Math.min(15, (length - 34) / Math.max(1, banners.length - 1));
  const bannerStartZ = -halfLength + 18;

  banners.forEach((banner, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const z = bannerStartZ + index * bannerSpacing;
    const accentHex = `#${new THREE.Color(banner.color).getHexString()}`;
    const accentInt = new THREE.Color(banner.color).getHex();

    const panel = createSignPanel(
      {
        eyebrow: banner.displayName,
        title: `${banner.specializationCount} subjects`,
        subtitle: banner.blurb,
        footer: `Floor ${banner.floor} · ${banner.classCount} classes · ${banner.agentCount} tutor agents`,
        accent: accentHex,
        width: 1024,
        height: 512,
        titleSize: 120,
        chips: [banner.icon.toUpperCase()],
      },
      { width: bannerWidth, height: bannerHeight },
      materials
    );
    panel.position.set(side * (halfWidth + 2.72), ceilingHeight * 0.52, z);
    panel.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    panel.name = `banner-${banner.subject}`;
    panel.userData.facility = {
      id: `banner-${banner.subject}`,
      roomNumber: `Banner ${index + 1}`,
      name: `${banner.displayName} Banner`,
      type: 'gallery',
      subject: banner.subject,
      description: banner.blurb,
      interactActionLabel: `Explore ${banner.displayName}`,
      coordinates: { x: side * (halfWidth + 2), z },
      color: banner.color,
    };
    result.register(panel);
    result.addInteractable(panel, panel.userData.facility);
    panel.traverse((child) => {
      child.userData.bannerSubject = banner.subject;
    });
    // The raycast hits the panel group; tag children so hits resolve upward.
    panel.userData.interaction = () => fire({ kind: 'banner', subject: banner.subject, banner });

    // Accent wall-wash so each banner lights its own bay.
    const wash = new THREE.PointLight(accentInt, 3.2, 11, 2);
    wash.position.set(side * (halfWidth + 1.6), ceilingHeight * 0.62, z);
    result.group.add(wash);

    // Holographic projector under each banner.
    const holo = createHologramProjector({
      accent: accentInt,
      height: 1.5,
      radius: 0.42,
      glyph: GLYPH_BY_SUBJECT[banner.subject] ?? 'atom',
    });
    holo.group.position.set(side * (halfWidth + 0.9), 0, z + 2.6);
    result.register(holo.group);
    result.transparent.push(holo.group);
    result.addUpdateable({
      object: holo.group,
      update: (dt, t) => holo.update(dt, t),
    });
  });

  // -------------------------------------------------------------------------
  // Named hallway facilities from the campus model (kiosk, directory, lockers,
  // portal, elevator) — positioned by the backend's own coordinates.
  // -------------------------------------------------------------------------

  const facilities = hallwayFloor?.facilities ?? [];
  facilities.forEach((facility) => {
    const node = buildHallwayFacility(facility, materials, settings, ceilingHeight, banners);
    if (!node) return;
    node.group.position.set(facility.coordinates.x, 0, facility.coordinates.z);
    result.register(node.group);
    result.addInteractable(node.group, facility);
    node.group.traverse((child) => {
      child.userData.facility = facility;
    });
    node.group.userData.interaction = () => {
      switch (facility.id) {
        case 'fac-hall-school-portal':
          fire({ kind: 'portal', target: 'virtual-school' });
          break;
        case 'fac-hall-elevator':
          fire({ kind: 'elevator', floor: 1, floorName: CAMPUS_FLOORS[1]?.name ?? 'Floor 1' });
          break;
        case 'fac-hall-wayfinding':
          fire({ kind: 'kiosk', facilityId: facility.id });
          break;
        case 'fac-hall-faculty':
          fire({ kind: 'directory', facilityId: facility.id });
          break;
        case 'fac-hall-lockers':
          fire({ kind: 'locker', facilityId: facility.id });
          break;
        default:
          fire({ kind: 'facility', facility });
      }
    };
    if (node.transparent) result.transparent.push(node.group);
    if (node.update) result.addUpdateable({ object: node.group, update: node.update });
  });

  // -------------------------------------------------------------------------
  // Wayfinding: embedded floor strips + glazed cross-corridor links
  // -------------------------------------------------------------------------

  const stripColour = 0x22d3ee;
  [-1, 1].forEach((side) => {
    // createWayfindingStrip already builds a PlaneGeometry(0.16, length) lying
    // flat in XZ, so the strip runs the length of the corridor along Z.
    const strip = createWayfindingStrip(length * 0.94, stripColour);
    strip.mesh.position.set(side * (halfWidth - 0.45), 0.02, 0);
    result.register(strip.mesh);
    result.transparent.push(strip.mesh);
    result.addUpdateable({ object: strip.mesh, update: (dt, t) => strip.update(dt, t) });
  });

  // Cross-corridor glazing every ~30 m: sightlines into the wings, and a
  // reflection source for the IBL.
  [-33, 0, 33].forEach((z) => {
    [-1, 1].forEach((side) => {
      const partition = createGlassPartition(5.2, ceilingHeight * 0.78, materials);
      partition.position.set(side * (halfWidth + 2.4), 0, z);
      partition.rotation.y = Math.PI / 2;
      result.register(partition);
      result.transparent.push(partition);
    });
  });

  // -------------------------------------------------------------------------
  // Concourse headline signage at the south end
  // -------------------------------------------------------------------------

  const headline = createSignPanel(
    {
      eyebrow: 'KEV International Virtual School',
      title: 'The Grand Concourse',
      subtitle:
        `${CAMPUS_STATISTICS.subjectAreas} subject areas · ${CAMPUS_STATISTICS.specializations} specializations · ` +
        `${CAMPUS_STATISTICS.classes} classes · ${CAMPUS_STATISTICS.tutorAgents} tutor agents`,
      footer: `Floors 0-${CAMPUS_FLOORS.length - 1} · ${CAMPUS_STATISTICS.totalRooms} rooms`,
      accent: '#22d3ee',
      width: 2048,
      height: 512,
      titleSize: 150,
    },
    { width: 9.5, height: 2.4 },
    materials
  );
  headline.position.set(0, ceilingHeight * 0.66, -halfLength + 1.2);
  result.register(headline);

  // -------------------------------------------------------------------------
  // Per-frame: light shafts
  // -------------------------------------------------------------------------

  result.addUpdateable({
    object: result.group,
    update: (_dt, t) => updateLightShafts(result.group, t),
  });

  return result;
}

interface HallwayFacilityNode {
  group: THREE.Group;
  transparent?: boolean;
  update?: (dt: number, t: number) => void;
}

/** Build the physical form of one named hallway facility. */
function buildHallwayFacility(
  facility: SchoolFacility,
  materials: CampusMaterialLibrary,
  settings: TierSettings,
  ceilingHeight: number,
  banners: HallwayBanner[]
): HallwayFacilityNode | null {
  const group = new THREE.Group();
  group.name = facility.id;

  switch (facility.id) {
    case 'fac-hall-wayfinding': {
      const holo = createHologramProjector({ accent: 0x22d3ee, height: 2.1, radius: 0.62, glyph: 'grid' });
      group.add(holo.group);

      const kioskBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.15, 0.5),
        materials.darkMetal
      );
      kioskBody.position.set(0, 0.58, 0.85);
      kioskBody.castShadow = true;
      group.add(kioskBody);

      const screen = createSignPanel(
        {
          eyebrow: 'Wayfinding',
          title: 'Find a classroom',
          subtitle: `${CAMPUS_STATISTICS.classes} classes across ${CAMPUS_STATISTICS.subjectAreas} subject areas`,
          accent: '#22d3ee',
          width: 512, height: 384, titleSize: 60, align: 'center',
        },
        { width: 0.86, height: 0.62 },
        materials
      );
      screen.position.set(0, 1.12, 0.62);
      screen.rotation.x = -0.42;
      group.add(screen);

      return { group, transparent: true, update: (dt, t) => holo.update(dt, t) };
    }

    case 'fac-hall-faculty': {
      // Directory wall: one lit panel per subject area, in a 2x7 grid.
      const cols = 2;
      const panelW = 1.55;
      const panelH = 0.92;
      banners.slice(0, 14).forEach((banner, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const panel = createSignPanel(
          {
            eyebrow: banner.displayName,
            title: `${banner.classCount} classes`,
            subtitle: `Floor ${banner.floor} · ${banner.agentCount} agents`,
            accent: `#${new THREE.Color(banner.color).getHexString()}`,
            width: 512, height: 288, titleSize: 74,
          },
          { width: panelW, height: panelH },
          materials
        );
        panel.position.set(-panelW * 0.62 + col * (panelW + 0.18), 3.5 - row * (panelH + 0.14), 0);
        group.add(panel);
      });

      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(panelW * cols + 0.9, banners.length / cols * (panelH + 0.14) + 0.7, 0.14),
        materials.concrete
      );
      backing.position.set(0.12, 2.1, -0.14);
      group.add(backing);
      return { group };
    }

    case 'fac-hall-lockers': {
      const bay = createLockerBay(14, materials, 0x22d3ee);
      group.add(bay);
      [-3.6, 3.6].forEach((x) => {
        const nook = createStudyNook(materials, 0x22d3ee);
        nook.position.set(x, 0, 1.6);
        nook.rotation.y = x > 0 ? -0.5 : 0.5;
        group.add(nook);
      });
      const sign = createSignPanel(
        {
          eyebrow: 'Bay 002',
          title: 'Virtual Lockers & Study Nooks',
          accent: '#22d3ee', width: 768, height: 192, titleSize: 60, align: 'center',
        },
        { width: 3.4, height: 0.85 },
        materials
      );
      sign.position.set(0, 2.5, 0);
      group.add(sign);
      return { group };
    }

    case 'fac-hall-school-portal': {
      // Step-through portal to the virtual school building: an emissive arch
      // with a shimmering membrane and a rotating ring.
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(2.6, 0.24, 20, 64, Math.PI * 2),
        materials.metal
      );
      arch.position.y = 2.6;
      arch.castShadow = true;
      group.add(arch);

      const membrane = new THREE.Mesh(
        new THREE.CircleGeometry(2.45, 64),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uColourA: { value: new THREE.Color(0x22d3ee) },
            uColourB: { value: new THREE.Color(0xa855f7) },
          },
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform vec3 uColourA;
            uniform vec3 uColourB;
            varying vec2 vUv;
            void main() {
              vec2 c = vUv - 0.5;
              float r = length(c) * 2.0;
              float angle = atan(c.y, c.x);
              float swirl = sin(angle * 5.0 + uTime * 1.4 + r * 9.0) * 0.5 + 0.5;
              float rim = smoothstep(1.0, 0.55, r);
              vec3 colour = mix(uColourA, uColourB, swirl);
              float alpha = (0.22 + swirl * 0.5) * rim;
              gl_FragColor = vec4(colour, alpha);
            }
          `,
        })
      );
      membrane.position.y = 2.6;
      group.add(membrane);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.95, 0.05, 12, 96),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 })
      );
      ring.position.y = 2.6;
      group.add(ring);

      const sign = createSignPanel(
        {
          eyebrow: 'Portal 000',
          title: 'Virtual School Building',
          subtitle: 'Six levels · basement to roof · 14 bookable facilities',
          footer: 'Gymnasium · Library · Cafeteria · Laboratories · Studios · Auditorium',
          accent: '#a855f7', width: 1024, height: 320, titleSize: 88, align: 'center',
        },
        { width: 4.2, height: 1.3 },
        materials
      );
      sign.position.set(0, 5.0, 0);
      group.add(sign);

      const portalLight = new THREE.PointLight(0x67e8f9, 6, 16, 2);
      portalLight.position.set(0, 2.6, 0.6);
      group.add(portalLight);

      return {
        group,
        transparent: true,
        update: (dt, t) => {
          (membrane.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
          ring.rotation.z += dt * 0.35;
          ring.scale.setScalar(1 + Math.sin(t * 1.6) * 0.012);
        },
      };
    }

    case 'fac-hall-elevator': {
      // Pneumatic elevator core: glass tube, one holographic ring per floor.
      const tubeHeight = ceilingHeight * 1.35;
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, tubeHeight, 40, 1, true),
        materials.glass
      );
      tube.position.y = tubeHeight / 2;
      group.add(tube);

      const rings: THREE.Mesh[] = [];
      const floorCount = CAMPUS_FLOORS.length;
      CAMPUS_FLOORS.forEach((campusFloor, i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.62, 0.055, 10, 64),
          new THREE.MeshStandardMaterial({
            color: 0x0b1220,
            emissive: new THREE.Color(campusFloor.color),
            emissiveIntensity: campusFloor.floorNumber === 0 ? 3.4 : 1.5,
            roughness: 0.35,
          })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.35 + (i / Math.max(1, floorCount - 1)) * (tubeHeight - 0.9);
        ring.userData.floorNumber = campusFloor.floorNumber;
        ring.userData.floorName = campusFloor.name;
        group.add(ring);
        rings.push(ring);
      });

      // Cabin.
      const cabin = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.9, 32, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 0.9,
          transparent: true, opacity: 0.4, side: THREE.DoubleSide,
        })
      );
      cabin.position.y = 1.2;
      group.add(cabin);

      const cabFloor = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.08, 32), materials.metal);
      cabFloor.position.y = 0.78;
      group.add(cabFloor);

      const sign = createSignPanel(
        {
          eyebrow: 'Elevator Core',
          title: `Floors 0-${floorCount - 1}`,
          subtitle: 'Hallway · Atrium · Science Wings · Subject Wings',
          accent: '#22d3ee', width: 768, height: 256, titleSize: 84, align: 'center',
        },
        { width: 3.2, height: 1.05 },
        materials
      );
      sign.position.set(0, tubeHeight + 0.7, 0);
      group.add(sign);

      void settings;
      return {
        group,
        transparent: true,
        update: (dt, t) => {
          // Cabin patrols the shaft; rings brighten as it passes.
          const cycle = (Math.sin(t * 0.22) * 0.5 + 0.5);
          cabin.position.y = 0.9 + cycle * (tubeHeight - 2.0);
          cabFloor.position.y = cabin.position.y - 0.42;
          rings.forEach((ring) => {
            const d = Math.abs(ring.position.y - cabin.position.y);
            const mat = ring.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 1.2 + Math.max(0, 1 - d / 2.4) * 3.2;
          });
          group.rotation.y += dt * 0.02;
        },
      };
    }

    case 'fac-hall-concourse': {
      // The spine itself: a centrepiece plinth with the school crest.
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.8, 0.42, 40),
        materials.terrazzo
      );
      plinth.position.y = 0.21;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      group.add(plinth);

      const crest = createHologramProjector({ accent: 0x22d3ee, height: 2.4, radius: 0.75, glyph: 'orbit' });
      crest.group.position.y = 0.42;
      group.add(crest.group);

      return { group, transparent: true, update: (dt, t) => crest.update(dt, t) };
    }

    case 'fac-hall-banners': {
      // Gallery plinths with vitrines; the banners themselves are on the walls.
      for (let i = 0; i < 4; i++) {
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.0, 1.1),
          materials.concrete
        );
        plinth.position.set((i - 1.5) * 2.1, 0.5, 0);
        plinth.castShadow = true;
        group.add(plinth);

        const vitrine = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.9),
          materials.glass
        );
        vitrine.position.set((i - 1.5) * 2.1, 1.45, 0);
        group.add(vitrine);

        const accent = banners[i * 3]?.color ?? '#22d3ee';
        const artifact = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.26, 1),
          new THREE.MeshStandardMaterial({
            color: 0x0b1220,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 2.2,
            roughness: 0.25,
            metalness: 0.6,
          })
        );
        artifact.position.set((i - 1.5) * 2.1, 1.45, 0);
        artifact.name = `vitrine-artifact-${i}`;
        group.add(artifact);
      }
      const sign = createSignPanel(
        {
          eyebrow: 'Concourse East',
          title: 'Fourteen-Subject Banner Gallery',
          subtitle: `${CAMPUS_STATISTICS.specializations} specializations · ${CAMPUS_STATISTICS.tutorAgents} tutor agents`,
          accent: '#22d3ee', width: 1024, height: 288, titleSize: 78, align: 'center',
        },
        { width: 4.0, height: 1.1 },
        materials
      );
      sign.position.set(0, 3.1, 0);
      group.add(sign);

      return {
        group,
        transparent: true,
        update: (dt, t) => {
          group.children.forEach((child) => {
            if (!child.name.startsWith('vitrine-artifact-')) return;
            child.rotation.y += dt * 0.6;
            child.rotation.x += dt * 0.25;
            child.position.y = 1.45 + Math.sin(t * 1.5 + child.position.x) * 0.05;
          });
        },
      };
    }

    default:
      return null;
  }
}

/**
 * Build a subject-floor corridor: the same hallway grammar (terrazzo, coves,
 * banners, doors) with a door per class. Used for floors 1-10 so the whole
 * tower reads as one building rather than four boxes on a plane.
 */
export function buildSubjectFloorCorridor(opts: {
  floorNumber: number;
  facilities: SchoolFacility[];
  settings: TierSettings;
  accent: number;
  floorName: string;
  ceilingHeight?: number;
}): CampusBuildResult {
  const { floorNumber, facilities, settings, accent, floorName } = opts;
  const ceilingHeight = opts.ceilingHeight ?? 4.6;
  const result = createBuildResult(`floor-${floorNumber}-corridor`);
  const materials = createCampusMaterials(settings, { accent });

  const halfWidth = CORRIDOR.halfWidth;
  const needed = Math.max(CORRIDOR.length, facilities.length * (CORRIDOR.pitchZ / 2) + 24);
  const halfLength = needed / 2;

  const slab = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 2 + 34, needed),
    materials.terrazzo
  );
  slab.rotation.x = -Math.PI / 2;
  slab.receiveShadow = true;
  result.register(slab);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 2 + 34, needed),
    materials.concrete
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ceilingHeight;
  result.register(ceiling);

  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 0.9, needed * 0.97),
    materials.carpet
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.y = 0.012;
  result.register(runner);

  // Coves + shafts.
  const coveSpacing = 12;
  const coveCount = Math.max(2, Math.floor(needed / coveSpacing));
  for (let i = 0; i < coveCount; i++) {
    const z = -halfLength + coveSpacing / 2 + i * coveSpacing;
    const cove = createLightCove(coveSpacing * 0.7, 0.46);
    cove.position.set(0, ceilingHeight - 0.14, z);
    result.register(cove);

    const light = new THREE.PointLight(0xeaf6ff, 4.2, 20, 2);
    light.position.set(0, ceilingHeight - 0.5, z);
    result.group.add(light);

    if (settings.volumetricFog) {
      const shaft = createLightShaft(ceilingHeight - 0.4, 2.2, 0x9fe8ff);
      shaft.position.set(0, (ceilingHeight - 0.4) / 2, z);
      result.register(shaft);
      result.transparent.push(shaft);
    }
  }

  // Floor headline.
  const headline = createSignPanel(
    {
      eyebrow: floorName,
      title: `${facilities.length} rooms`,
      accent: `#${new THREE.Color(accent).getHexString()}`,
      width: 1536, height: 384, titleSize: 110,
    },
    { width: 6.4, height: 1.6 },
    materials
  );
  headline.position.set(0, ceilingHeight * 0.72, -halfLength + 1.4);
  result.register(headline);

  // A door per facility, on its own side of the corridor at its own z.
  facilities.forEach((facility) => {
    const side = facility.coordinates.x >= 0 ? 1 : -1;
    const doorAccent = facility.color ? new THREE.Color(facility.color).getHex() : accent;
    const door = createDoor({
      roomNumber: facility.roomNumber,
      title: facility.name,
      accent: doorAccent,
      materials,
      width: 1.7,
      height: 2.7,
    });
    door.position.set(side * (halfWidth + 1.2), 0, facility.coordinates.z);
    door.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    door.name = `door-${facility.id}`;
    result.register(door);
    result.addInteractable(door, facility);
    door.traverse((child) => { child.userData.facility = facility; });

    // Glazed sidelight so the corridor reads as inhabited.
    const partition = createGlassPartition(3.2, ceilingHeight * 0.62, materials);
    partition.position.set(side * (halfWidth + 1.18), 0, facility.coordinates.z + 3.0);
    partition.rotation.y = Math.PI / 2;
    result.register(partition);
    result.transparent.push(partition);
  });

  result.addUpdateable({
    object: result.group,
    update: (_dt, t) => updateLightShafts(result.group, t),
  });

  return result;
}
