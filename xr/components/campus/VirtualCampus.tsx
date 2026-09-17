/**
 * VirtualCampus — the walkable 3D KEV school.
 *
 * What changed in the consolidation
 * ---------------------------------
 * This component used to build ONE fixed 60 m x 60 m atrium (four wings on a
 * terrazzo slab) regardless of which floor was selected; `currentFloor` only
 * swapped labels. The only "hallway" in the codebase was a 2D divider label in
 * the map modal, and the KEV International Virtual School existed solely as a
 * REST payload with no 3D form at all.
 *
 * It now renders the whole school, one world per floor, from a single data
 * source:
 *
 *   Floor 0   Grand Concourse Hallway — 132 m circulation spine, 14 subject
 *             banners, holographic wayfinding kiosk, faculty directory,
 *             locker bay, elevator core (0-10), virtual-school portal
 *   Floors 1-4  the original XR wings, preserved exactly (see campusAtrium3D.ts)
 *   Floor 5   Mathematics & Computer Science
 *   Floor 6   Languages & Letters
 *   Floor 7   Humanities & Commerce
 *   Floor 8   Performing & Visual Arts
 *   Floor 9   Athletics & the KEV International Virtual School building
 *   Floor 10  Trades & Frontiers
 *
 * Floors 0 and 5-10 are generated from `src/xr/data/schoolCampus.ts`, produced
 * by `scripts/generate_campus_mirror.py` from `backend/core/school_campus.py`.
 * Adding a subject area under `multi_agents/` therefore adds a hallway banner,
 * a floor corridor and doors here with no frontend change.
 *
 * Rendering goes through `HighFidelityRenderer`: ACES filmic tone mapping, PMREM
 * image-based lighting, ground-truth AO, bloom, volumetric height fog with
 * Henyey-Greenstein in-scattering, depth of field, SMAA and adaptive quality
 * tiers. All materials are procedural PBR (`render/proceduralTextures.ts`), so
 * the campus ships with no binary texture assets.
 *
 * Also fixed while consolidating:
 *   • props `XRAcademyApp` passed but this component never declared
 *     (`currentFloor`, `teleportTargetFacility`, `onNavigateToLab`,
 *     `onNavigateToClassroom`, `onRequestAITutor`) — the map teleport and the
 *     elevator switcher were inert. They are now honoured.
 *   • `PHOTOREALISTIC_ASSETS.avatars['cellular-lead']` does not exist, so a peer
 *     avatar rendered with an undefined photo. Corrected to a real key.
 *   • the scene leaked geometries and materials on every floor change (only
 *     `renderer.dispose()` ran). Teardown is now deterministic.
 *   • `import 'framer-motion'` — not a declared dependency. Uses `motion/react`,
 *     matching the rest of the app.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, MessageSquare, ChevronRight, Sparkles, Building2,
  Eye, Users, Compass, Gauge, Palette, Volume2, VolumeX, School, DoorOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildArticulatedAvatar, type ArticulatedAvatar } from './campus3dHelpers';
import { buildAtriumCampus, ATRIUM_WINGS, type AtriumBuild } from './campusAtrium3D';
import {
  buildSchoolHallway,
  buildSubjectFloorCorridor,
  type HallwayInteraction,
} from './SchoolHallway3D';
import { buildVirtualSchoolBuilding, type VirtualSchoolBuild } from './VirtualSchoolBuilding3D';
import { createCampusMaterials, type CampusMaterialLibrary } from '../../render/campusKit';
import {
  CampusTransitionPortal,
  type CampusTransitionEvent,
} from './CampusTransitionPortal';
import { ArchitecturalTourModal } from './ArchitecturalTourModal';
import { SeasonalThemeManager } from './SeasonalThemeManager';
import { SeasonalThemeModal } from './SeasonalThemeModal';
import { CampusAudioSettingsCard } from './CampusAudioSettingsCard';
import { createInteractiveKiosks, type InteractiveKiosksResult } from './campusKiosks';
import {
  createThemedCenterpiece,
  createThemedAtmosphericParticles,
  detectDefaultSeasonTheme,
  SEASON_THEMES_INFO,
  type CampusSeasonTheme,
} from './campusThemedCenterpiece';
import {
  CAMPUS_FLOORS,
  CAMPUS_STATISTICS,
  VIRTUAL_SCHOOL,
  floorByNumber,
  wingBySubject,
  type SchoolFacility,
} from '../../data/schoolCampus';
import {
  HighFidelityRenderer,
  createLightingRig,
  detectQualityTier,
  QUALITY_SETTINGS,
  QUALITY_ORDER,
  type LightingRig,
  type QualityTier,
} from '../../render/highFidelityRenderer';
import { disposeAllTextures } from '../../render/proceduralTextures';
import { PHOTOREALISTIC_ASSETS } from '../../assets/images';
import { campusAudio, type AudioEngineSettings } from '../../services/campusAudioEngine';
import type { AvatarConfig, CampusFacility, LabId } from '../../types';

export type CampusFloorNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Floors that still use the bespoke legacy atrium geometry. */
const LEGACY_ATRIUM_FLOORS: CampusFloorNumber[] = [1, 2, 3, 4];

interface Props {
  onOpenChat: () => void;
  onOpenMap: () => void;
  onOpenPeerMentors?: () => void;
  onEnterLab?: (labId: string, labName: string) => void;
  onEnterClassroom?: (facilityName: string) => void;
  /** Open the KEV International Virtual School detail view. */
  onOpenVirtualSchool?: (facilityId?: string) => void;
  userName?: string;
  userAvatar?: AvatarConfig;
  /**
   * Controlled floor, 0-10. `currentFloor` is accepted as an alias because
   * `XRAcademyApp` and the 2D map both speak in those terms; before
   * consolidation the alias was passed but never declared here, so the elevator
   * switcher and map teleport were inert.
   */
  activeFloor?: CampusFloorNumber;
  currentFloor?: CampusFloorNumber;
  onFloorChange?: (floor: CampusFloorNumber) => void;
  onNavigateToLab?: (labId: LabId) => void;
  onNavigateToClassroom?: () => void;
  onRequestAITutor?: (context: string) => void;
  teleportTargetFacility?: CampusFacility | null;
  onClearTeleportTarget?: () => void;
}

/** Peer mentors standing in the concourse, using real avatar asset keys. */
const PEER_PRESETS = [
  {
    name: 'Maya Lin', role: 'Biochem Scholar', x: -4, z: 2,
    primaryColor: '#10b981', glowColor: '#34d399',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['molecular-bio'],
  },
  {
    name: 'Devon Vance', role: 'Astrophysics', x: 4, z: -2,
    primaryColor: '#f59e0b', glowColor: '#fbbf24',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['astro-pioneer'],
  },
  {
    name: 'Sofia Chen', role: 'Genomics Lead', x: -5, z: -5,
    primaryColor: '#a855f7', glowColor: '#c084fc',
    // Was 'cellular-lead', a key that does not exist in PHOTOREALISTIC_ASSETS.
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['nano-tech'],
  },
  {
    name: 'Tariq Al-Mansoor', role: 'Quantum Optics', x: 3, z: 5,
    primaryColor: '#06b6d4', glowColor: '#38bdf8',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['quantum-physicist'],
  },
];

/** Adapt a generated `SchoolFacility` to the app-wide `CampusFacility`. */
function toCampusFacility(facility: SchoolFacility, floorColour?: string): CampusFacility {
  return {
    ...facility,
    type: facility.type,
    coordinates: {
      x: facility.coordinates.x,
      z: facility.coordinates.z,
      y: facility.coordinates.y,
    },
    color: facility.color ?? floorColour,
    associatedLabId: (facility.associatedLabId ?? undefined) as LabId | undefined,
    tutorInResidence: facility.tutorInResidence ?? undefined,
  } as CampusFacility;
}

export const VirtualCampus: React.FC<Props> = ({
  onOpenChat,
  onOpenMap,
  onOpenPeerMentors,
  onEnterLab,
  onEnterClassroom,
  onOpenVirtualSchool,
  userName = 'Scholar',
  userAvatar,
  activeFloor,
  currentFloor,
  onFloorChange,
  onNavigateToLab,
  onNavigateToClassroom,
  onRequestAITutor,
  teleportTargetFacility,
  onClearTeleportTarget,
}) => {
  const { t } = useTranslation();
  // Brand accent. The campus data carries a colour per floor and per subject,
  // so this is only the fallback for chrome and untyped facilities.
  const accentColor = '#22d3ee';

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HighFidelityRenderer | null>(null);
  const playerPosRef = useRef({ x: 0, z: 8, rotY: 0 });
  const keysRef = useRef<Record<string, boolean>>({});

  const [nearbyFacility, setNearbyFacility] = useState<CampusFacility | null>(null);
  const [nearbyKioskName, setNearbyKioskName] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'walk' | 'isometric'>('walk');
  const [transitionEvent, setTransitionEvent] = useState<CampusTransitionEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isArchitecturalTourOpen, setIsArchitecturalTourOpen] = useState(false);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [seasonTheme, setSeasonTheme] = useState<CampusSeasonTheme>(() => detectDefaultSeasonTheme());
  const [audioSettings, setAudioSettings] = useState<AudioEngineSettings>(() => campusAudio.getSettings());
  const [qualityTier, setQualityTier] = useState<QualityTier>(() => detectQualityTier());
  const [frameStats, setFrameStats] = useState({ fps: 60, drawCalls: 0, triangles: 0 });

  // Floor 0 (the Grand Concourse Hallway) is a real destination, so resolve with
  // ?? rather than || — `|| 1` would silently discard it.
  const requestedFloor = activeFloor ?? currentFloor ?? 0;
  const activeFloorNum = Math.max(0, Math.min(10, requestedFloor)) as CampusFloorNumber;
  const campusFloor = floorByNumber(activeFloorNum);
  const floorColour = campusFloor?.color ?? accentColor;
  const seasonInfo = SEASON_THEMES_INFO[seasonTheme];

  const floorColours = useMemo(() => {
    const map: Record<number, string> = {};
    CAMPUS_FLOORS.forEach((f) => { map[f.floorNumber] = f.color; });
    return map;
  }, []);

  // --- Audio: subscribe to the engine rather than owning its state ----------
  useEffect(() => {
    const unsubscribe = campusAudio.subscribe((next) => setAudioSettings(next));
    campusAudio.setSeasonTheme(seasonTheme);
    return unsubscribe;
  }, [seasonTheme]);

  // --- Adapt to the renderer's own tier decisions --------------------------
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const listener = (tier: QualityTier) => setQualityTier(tier);
    engine.onTierChange.push(listener);
    return () => {
      const i = engine.onTierChange.indexOf(listener);
      if (i >= 0) engine.onTierChange.splice(i, 1);
    };
  }, [activeFloorNum, qualityTier]);

  const applyQualityTier = useCallback((tier: QualityTier) => {
    setQualityTier(tier);
    engineRef.current?.setQuality(tier, 'manual');
  }, []);

  // --- Elevator / door navigation -----------------------------------------
  const handleElevatorFloorChange = useCallback((target: CampusFloorNumber) => {
    if (target === activeFloorNum) return;
    const targetFloor = floorByNumber(target);
    setPendingAction(() => () => onFloorChange?.(target));
    setTransitionEvent({
      type: 'floor',
      fromFloor: activeFloorNum,
      toFloor: target,
      destinationName: targetFloor?.name ?? `Floor ${target}`,
      labColor: targetFloor?.color,
    });
  }, [activeFloorNum, onFloorChange]);

  const handleTransitionComplete = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setTransitionEvent(null);
  }, [pendingAction]);

  const handleEnterLabDoor = useCallback((labId: string, labName: string) => {
    setTransitionEvent({
      type: 'door',
      destinationName: labName,
      fromFloor: activeFloorNum,
    });
    setPendingAction(() => () => {
      if (onNavigateToLab) onNavigateToLab(labId as LabId);
      else onEnterLab?.(labId, labName);
    });
  }, [activeFloorNum, onEnterLab, onNavigateToLab]);

  const handleEnterClassroomDoor = useCallback(() => {
    if (!nearbyFacility) return;
    const facility = nearbyFacility;
    if (facility.associatedLabId) {
      handleEnterLabDoor(facility.associatedLabId, facility.name);
      return;
    }
    if (onOpenVirtualSchool && String(facility.id).startsWith('vs-')) {
      campusAudio.playPortalWarpSound();
      onOpenVirtualSchool(facility.sourceFacilityId ?? facility.id);
      return;
    }
    setTransitionEvent({
      type: 'door',
      destinationName: facility.name,
      fromFloor: activeFloorNum,
      labColor: facility.color,
    });
    setPendingAction(() => () => {
      if (onNavigateToClassroom) onNavigateToClassroom();
      onEnterClassroom?.(facility.name);
    });
  }, [
    activeFloorNum, handleEnterLabDoor, nearbyFacility, onEnterClassroom,
    onNavigateToClassroom, onOpenVirtualSchool,
  ]);

  const handleAskTutorHere = useCallback(() => {
    if (!nearbyFacility) return;
    onRequestAITutor?.(
      `I am standing in ${nearbyFacility.name} (${nearbyFacility.roomNumber}) on floor ${activeFloorNum}. ` +
      `${nearbyFacility.description} What should I study here, and which tutor agent should I ask?`
    );
  }, [activeFloorNum, nearbyFacility, onRequestAITutor]);

  const handleHallwayInteraction = useCallback((interaction: HallwayInteraction) => {
    switch (interaction.kind) {
      case 'banner': {
        const wing = wingBySubject(interaction.subject);
        const target = (wing?.floor ?? 0) as CampusFloorNumber;
        if (target !== activeFloorNum) handleElevatorFloorChange(target);
        else onOpenMap();
        break;
      }
      case 'elevator':
        handleElevatorFloorChange(interaction.floor as CampusFloorNumber);
        break;
      case 'portal':
        campusAudio.playPortalWarpSound();
        if (onOpenVirtualSchool) onOpenVirtualSchool();
        else handleElevatorFloorChange(9);
        break;
      case 'kiosk':
        campusAudio.playInteractiveKioskChime();
        onOpenMap();
        break;
      case 'directory':
      case 'locker':
      case 'facility': {
        const facility = interaction.kind === 'facility'
          ? interaction.facility
          : floorByNumber(0)?.facilities.find((f) => f.id === interaction.facilityId);
        if (!facility) return;
        if (facility.id === 'fac-hall-school-portal') {
          campusAudio.playPortalWarpSound();
          onOpenVirtualSchool?.();
        } else if (facility.id === 'fac-hall-elevator') {
          onOpenMap();
        } else {
          campusAudio.playInteractiveKioskChime();
          setNearbyFacility(toCampusFacility(facility, floorColour));
        }
        break;
      }
    }
  }, [activeFloorNum, floorColour, handleElevatorFloorChange, onOpenMap, onOpenVirtualSchool]);

  // ------------------------------------------------------------------------
  // World construction
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const engine = new HighFidelityRenderer({
      container,
      quality: qualityTier,
      environment: 'interior',
      fogColour: seasonInfo.colorScheme.fogColor,
      adaptive: true,
    });
    engineRef.current = engine;
    const { scene, camera } = engine;
    const settings = engine.settings;

    // Seasonal atmosphere overrides the neutral interior sky.
    scene.background = new THREE.Color(seasonInfo.colorScheme.fogColor);

    const worldRoot = new THREE.Group();
    worldRoot.name = 'campus-world';
    scene.add(worldRoot);

    const roomZones: { facility: CampusFacility; box: THREE.Box3 }[] = [];
    const updateables: Array<{ update: (dt: number, t: number) => void }> = [];
    const disposers: Array<() => void> = [];
    const interactables: THREE.Object3D[] = [];

    // Spawn: the concourse is long along Z, the wings are compact.
    playerPosRef.current = activeFloorNum === 0
      ? { x: 0, z: 40, rotY: Math.PI }
      : { x: 0, z: 8, rotY: 0 };

    // Map teleport: drop the player at the requested room instead of the spawn.
    const teleportTarget = teleportTargetFacility ?? null;
    if (teleportTarget) {
      playerPosRef.current = {
        x: teleportTarget.coordinates.x,
        z: teleportTarget.coordinates.z + 2,
        rotY: Math.PI,
      };
    }

    // -- Lighting rig (key/fill/rim/ambient, shadow-casting key) ------------
    const rig: LightingRig = createLightingRig(settings, {
      skyColour: seasonInfo.colorScheme.hexSecondary,
      groundColour: seasonInfo.colorScheme.hexPrimary,
      shadowExtent: activeFloorNum === 0 ? 90 : 60,
    });
    scene.add(rig.group);
    disposers.push(() => {
      scene.remove(rig.group);
      rig.key.dispose?.();
      rig.rim.dispose?.();
    });

    // -- Floor-specific world ----------------------------------------------
    const materials: CampusMaterialLibrary = createCampusMaterials(settings, {
      accent: new THREE.Color(floorColour).getHex(),
    });
    disposers.push(() => materials.dispose());

    if (activeFloorNum === 0) {
      // The Grand Concourse Hallway: the spine every other floor hangs off.
      const hallway = buildSchoolHallway({
        settings,
        ceilingHeight: 5.2,
        onInteract: handleHallwayInteraction,
      });
      worldRoot.add(hallway.group);
      updateables.push(...hallway.updateables.map((u) => ({ update: u.update })));
      interactables.push(...hallway.interactables);
      hallway.interactables.forEach((obj) => {
        const facility = obj.userData.facility as SchoolFacility | undefined;
        if (!facility) return;
        const box = new THREE.Box3().setFromObject(obj);
        box.expandByScalar(1.8);
        roomZones.push({ facility: toCampusFacility(facility, floorColour), box });
      });
      disposers.push(() => { hallway.dispose(); worldRoot.remove(hallway.group); });
    } else if (LEGACY_ATRIUM_FLOORS.includes(activeFloorNum)) {
      // The original four XR wings, preserved (moved into campusAtrium3D.ts).
      const atrium: AtriumBuild = buildAtriumCampus({
        activeFloor: activeFloorNum,
        floorCount: CAMPUS_FLOORS.length,
        floorColours,
      });
      worldRoot.add(atrium.group);
      updateables.push(...atrium.updateables.map((u) => ({ update: u.update })));
      atrium.roomZones.forEach((zone) => roomZones.push(zone));
      disposers.push(() => { atrium.dispose(); worldRoot.remove(atrium.group); });

      // Legacy wings keep their original footprint; the atrium floor is 60 m.
      ATRIUM_WINGS.forEach((wing) => {
        interactables.push(wing as unknown as THREE.Object3D);
      });
    } else {
      // Floors 5-10: data-driven subject corridors.
      const facilities = (campusFloor?.facilities ?? []) as SchoolFacility[];
      const corridor = buildSubjectFloorCorridor({
        floorNumber: activeFloorNum,
        facilities,
        settings,
        accent: new THREE.Color(floorColour).getHex(),
        floorName: campusFloor?.name ?? `Floor ${activeFloorNum}`,
      });
      worldRoot.add(corridor.group);
      updateables.push(...corridor.updateables.map((u) => ({ update: u.update })));
      interactables.push(...corridor.interactables);
      corridor.interactables.forEach((obj) => {
        const facility = obj.userData.facility as SchoolFacility | undefined;
        if (!facility) return;
        const box = new THREE.Box3().setFromObject(obj);
        box.expandByScalar(1.5);
        roomZones.push({ facility: toCampusFacility(facility, floorColour), box });
      });
      disposers.push(() => { corridor.dispose(); worldRoot.remove(corridor.group); });

      // Floor 9 also carries the KEV International Virtual School building.
      if (activeFloorNum === 9 && VIRTUAL_SCHOOL?.available) {
        const vs: VirtualSchoolBuild = buildVirtualSchoolBuilding({
          school: VIRTUAL_SCHOOL,
          materials,
          settings,
          coordinateScale: 1.5,
          storeyHeight: 4.4,
          onInteract: (facility) => setNearbyFacility(toCampusFacility(facility, '#a855f7')),
        });
        vs.group.position.set(34, 0.05, -22);
        worldRoot.add(vs.group);
        updateables.push(...vs.updateables.map((u) => ({ update: u.update })));
        interactables.push(...vs.interactables);
        vs.roomZones.forEach((zone) => {
          roomZones.push({
            facility: toCampusFacility(zone.facility, zone.level.color),
            box: zone.box.clone().translate(new THREE.Vector3(34, 0.05, -22)),
          });
        });
        disposers.push(() => { vs.dispose(); worldRoot.remove(vs.group); });
      }
    }

    // -- Seasonal centrepiece, decorations and weather ----------------------
    const centrepiece = createThemedCenterpiece(seasonTheme);
    centrepiece.group.position.set(0, 0, activeFloorNum === 0 ? 14 : 0);
    worldRoot.add(centrepiece.group);
    updateables.push({
      update: (dt, t) => centrepiece.updateAnimation(t, dt),
    });
    disposers.push(() => {
      centrepiece.group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose?.();
      });
      worldRoot.remove(centrepiece.group);
    });

    const weather = createThemedAtmosphericParticles(seasonTheme);
    worldRoot.add(weather.group);
    updateables.push({ update: (dt) => weather.updateParticles(dt) });
    disposers.push(() => {
      weather.group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | undefined;
        mat?.dispose?.();
      });
      worldRoot.remove(weather.group);
    });

    // -- Interactive kiosks (from the consolidated demo) --------------------
    const kiosks: InteractiveKiosksResult = createInteractiveKiosks();
    kiosks.group.position.set(0, 0, activeFloorNum === 0 ? 24 : 6);
    worldRoot.add(kiosks.group);
    updateables.push({ update: (dt, t) => kiosks.updateAnimation(t, dt) });
    disposers.push(() => {
      kiosks.group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose?.();
      });
      worldRoot.remove(kiosks.group);
    });

    // -- Avatars -----------------------------------------------------------
    const peerAvatars: ArticulatedAvatar[] = PEER_PRESETS.map((preset) => {
      const peer = buildArticulatedAvatar({ ...preset, isPlayer: false });
      peer.group.position.set(preset.x, 0, preset.z);
      worldRoot.add(peer.group);
      return peer;
    });

    const playerRig = buildArticulatedAvatar({
      name: userName || 'Research Scholar',
      role: activeFloorNum === 0 ? 'Concourse Fellow' : 'Tier 1 Fellow',
      primaryColor: userAvatar?.primaryColor || '#06b6d4',
      glowColor: userAvatar?.glowColor || '#38bdf8',
      photoUrl: userAvatar?.photoUrl || PHOTOREALISTIC_ASSETS.avatars['cyber-scholar'],
      isPlayer: true,
    });
    const playerGroup = playerRig.group;
    playerGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    worldRoot.add(playerGroup);

    // Teleport arrival marker.
    if (teleportTarget) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.35, 48),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(teleportTarget.color ?? accentColor).getHex(),
          transparent: true, opacity: 0.85, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(teleportTarget.coordinates.x, 0.05, teleportTarget.coordinates.z + 2);
      worldRoot.add(ring);
      updateables.push({
        update: (dt, t) => {
          ring.rotation.z += dt * 0.8;
          ring.scale.setScalar(1 + Math.sin(t * 2.4) * 0.08);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 2.4) * 0.3;
        },
      });
      disposers.push(() => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
        worldRoot.remove(ring);
      });
      onClearTeleportTarget?.();
    }

    // -- Input --------------------------------------------------------------
    const keysDown = keysRef.current;
    const handleKeyDown = (e: KeyboardEvent) => { keysDown[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysDown[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // -- Resize -------------------------------------------------------------
    const handleResize = () => {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      engine.resize(w, h);
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleResize)
      : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', handleResize);

    // -- Loop ---------------------------------------------------------------
    const clock = new THREE.Clock();
    let animId = 0;
    let walkCycleTime = 0;
    let lastNearbyId: string | null = null;
    let lastKioskId: string | null = null;
    let statAccumulator = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      updateables.forEach((u) => u.update(delta, elapsed));
      peerAvatars.forEach((peer, idx) => {
        peer.group.position.y = Math.sin(elapsed * 1.8 + idx) * 0.02;
      });

      const speed = 7.0 * delta;
      const turnSpeed = 2.5 * delta;
      if (keysDown['a'] || keysDown['arrowleft']) playerPosRef.current.rotY += turnSpeed;
      if (keysDown['d'] || keysDown['arrowright']) playerPosRef.current.rotY -= turnSpeed;

      const forward = new THREE.Vector3(
        -Math.sin(playerPosRef.current.rotY), 0, -Math.cos(playerPosRef.current.rotY)
      );
      const isMoving = Boolean(
        keysDown['w'] || keysDown['arrowup'] || keysDown['s'] || keysDown['arrowdown']
      );
      if (keysDown['w'] || keysDown['arrowup']) {
        playerPosRef.current.x += forward.x * speed;
        playerPosRef.current.z += forward.z * speed;
      }
      if (keysDown['s'] || keysDown['arrowdown']) {
        playerPosRef.current.x -= forward.x * speed;
        playerPosRef.current.z -= forward.z * speed;
      }

      // Bounds: the concourse is long and narrow, the atrium is a 60 m square.
      if (activeFloorNum === 0) {
        playerPosRef.current.x = Math.max(-8.4, Math.min(8.4, playerPosRef.current.x));
        playerPosRef.current.z = Math.max(-62, Math.min(62, playerPosRef.current.z));
      } else if (LEGACY_ATRIUM_FLOORS.includes(activeFloorNum)) {
        playerPosRef.current.x = Math.max(-26, Math.min(26, playerPosRef.current.x));
        playerPosRef.current.z = Math.max(-26, Math.min(26, playerPosRef.current.z));
      } else {
        playerPosRef.current.x = Math.max(-11, Math.min(11, playerPosRef.current.x));
        playerPosRef.current.z = Math.max(-60, Math.min(60, playerPosRef.current.z));
      }

      if (isMoving) {
        walkCycleTime += delta * 11;
        const legSwing = Math.sin(walkCycleTime) * 0.55;
        const armSwing = Math.sin(walkCycleTime) * 0.45;
        playerRig.leftLeg.rotation.x = legSwing;
        playerRig.rightLeg.rotation.x = -legSwing;
        playerRig.leftArm.rotation.x = -armSwing;
        playerRig.rightArm.rotation.x = armSwing;
        playerGroup.position.y = Math.abs(Math.sin(walkCycleTime * 2)) * 0.04;
      } else {
        playerRig.leftLeg.rotation.x = 0;
        playerRig.rightLeg.rotation.x = 0;
        playerRig.leftArm.rotation.x = 0.15;
        playerRig.rightArm.rotation.x = -0.15;
        playerGroup.position.y = 0;
      }

      playerGroup.position.x = playerPosRef.current.x;
      playerGroup.position.z = playerPosRef.current.z;
      playerGroup.rotation.y = playerPosRef.current.rotY;

      if (cameraMode === 'walk') {
        const camOffset = new THREE.Vector3(
          Math.sin(playerPosRef.current.rotY) * 3.5, 2.2, Math.cos(playerPosRef.current.rotY) * 3.5
        );
        camera.position.set(
          playerPosRef.current.x + camOffset.x, camOffset.y, playerPosRef.current.z + camOffset.z
        );
        camera.lookAt(playerPosRef.current.x, 1.4, playerPosRef.current.z);
      } else {
        camera.position.set(playerPosRef.current.x, 26, playerPosRef.current.z + 22);
        camera.lookAt(playerPosRef.current.x, 0, playerPosRef.current.z);
      }

      // Spatial audio follows the player.
      campusAudio.updateSpatialPosition(playerPosRef.current.x, playerPosRef.current.z);

      // Proximity: rooms.
      const playerVec = new THREE.Vector3(playerPosRef.current.x, 1, playerPosRef.current.z);
      let detected: CampusFacility | null = null;
      for (const zone of roomZones) {
        if (zone.box.containsPoint(playerVec)) { detected = zone.facility; break; }
      }
      if (detected?.id !== lastNearbyId) {
        lastNearbyId = detected?.id ?? null;
        if (detected) campusAudio.playInteractiveKioskChime();
        setNearbyFacility(detected);
      }

      // Proximity: kiosks.
      const kiosk = kiosks.getNearbyKiosk(playerPosRef.current.x, playerPosRef.current.z);
      const kioskId = kiosk?.id ?? null;
      if (kioskId !== lastKioskId) {
        lastKioskId = kioskId;
        setNearbyKioskName(kiosk?.title ?? null);
      }

      // Render through the high-fidelity chain, then feed the adaptive tier.
      const frameStart = performance.now();
      engine.update(delta, elapsed);
      engine.render();
      engine.observeFrame(performance.now() - frameStart);

      statAccumulator += delta;
      if (statAccumulator > 0.5) {
        statAccumulator = 0;
        const stats = engine.stats();
        setFrameStats({ fps: stats.fps, drawCalls: stats.drawCalls, triangles: stats.triangles });
      }
    };
    animate();

    // Kick the seasonal soundscape once the world exists.
    void campusAudio.start();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      campusAudio.stop();
      disposers.forEach((d) => { try { d(); } catch { /* already gone */ } });
      Object.keys(keysDown).forEach((k) => { keysDown[k] = false; });
      peerAvatars.forEach((p) => p.group.removeFromParent());
      playerRig.group.removeFromParent();
      engine.dispose();
      disposeAllTextures();
      engineRef.current = null;
    };
    // Rebuild only when something that changes the world changes; audio and
    // quality updates are pushed through subscriptions instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFloorNum, cameraMode, userAvatar?.photoUrl, qualityTier, seasonTheme]);

  // --- Virtual joypad ------------------------------------------------------
  const moveDirection = (dir: 'forward' | 'backward' | 'left' | 'right') => {
    const keysDown = keysRef.current;
    if (dir === 'forward') keysDown['w'] = true;
    if (dir === 'backward') keysDown['s'] = true;
    if (dir === 'left') keysDown['a'] = true;
    if (dir === 'right') keysDown['d'] = true;
    setTimeout(() => {
      ['w', 'a', 's', 'd'].forEach((k) => { keysRef.current[k] = false; });
    }, 200);
  };

  const floorLabel = campusFloor?.name ?? `Floor ${activeFloorNum}`;
  const facilityCount = campusFloor?.facilities.length ?? 0;
  const tierSettings = QUALITY_SETTINGS[qualityTier];

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col select-none">
      {/* 3D canvas */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Top campus HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md backdrop-blur-md">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                KEV Virtual Campus Walkway
              </h2>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border text-slate-950"
                style={{ backgroundColor: floorColour, borderColor: floorColour }}
              >
                Floor {activeFloorNum}: {floorLabel.replace(/^Floor \d+:\s*/, '')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-300 font-mono border border-slate-700">
                {facilityCount} rooms
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('xr.campusHint')} · {CAMPUS_STATISTICS.classes} classes ·{' '}
              {CAMPUS_STATISTICS.tutorAgents} tutor agents · {CAMPUS_STATISTICS.totalRooms} rooms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <button
            onClick={() => setIsArchitecturalTourOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
            title="Photorealistic architectural tour of the whole campus"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('xr.archTour')}</span>
          </button>

          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('xr.campusMap')}</span>
          </button>

          {onOpenVirtualSchool && (
            <button
              onClick={() => { campusAudio.playPortalWarpSound(); onOpenVirtualSchool(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
              title="KEV International Virtual School — basement to roof, 14 bookable facilities"
            >
              <School className="w-3.5 h-3.5" />
              <span>Virtual School</span>
            </button>
          )}

          {onOpenPeerMentors && (
            <button
              onClick={onOpenPeerMentors}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Peer Mentors</span>
            </button>
          )}

          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Campus Chat</span>
          </button>

          <button
            onClick={() => setCameraMode(cameraMode === 'walk' ? 'isometric' : 'walk')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer backdrop-blur-md transition-all"
            title="Switch between third-person walk and drone view"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{cameraMode === 'walk' ? 'Drone View' : 'Walk View'}</span>
          </button>

          {/* Seasonal theming: badge + modal opener */}
          <SeasonalThemeManager
            currentTheme={seasonTheme}
            onThemeChange={setSeasonTheme}
            onOpenThemeModal={() => setIsSeasonModalOpen(true)}
            compact
          />

          <button
            onClick={() => {
              const next = !audioSettings.isMuted;
              campusAudio.setMuted(next);
              setIsAudioOpen((v) => v || next === false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer backdrop-blur-md transition-all ${
              audioSettings.isMuted
                ? 'bg-slate-900/60 text-slate-500 border-slate-800'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={audioSettings.isMuted ? 'Unmute campus audio' : 'Mute campus audio'}
          >
            {audioSettings.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer backdrop-blur-md transition-all"
            title="High-fidelity render settings"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline capitalize">{qualityTier}</span>
            <span className="hidden lg:inline text-slate-500">{Math.round(frameStats.fps)}fps</span>
          </button>

          {/* Elevator: every floor of the school */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-xl p-0.5 backdrop-blur-md">
            {CAMPUS_FLOORS.map((f) => (
              <button
                key={f.floorNumber}
                onClick={() => handleElevatorFloorChange(f.floorNumber as CampusFloorNumber)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  activeFloorNum === f.floorNumber
                    ? 'text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={activeFloorNum === f.floorNumber ? { backgroundColor: f.color } : undefined}
                title={`Ride the elevator to Floor ${f.floorNumber} — ${f.name}`}
              >
                {f.floorNumber}F
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render-quality panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-24 right-3 z-30 w-72 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">High-Fidelity Render</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white text-xs cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {QUALITY_ORDER.slice().reverse().map((tier) => (
                <button
                  key={tier}
                  onClick={() => applyQualityTier(tier)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-mono capitalize border transition-all cursor-pointer ${
                    qualityTier === tier
                      ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <dl className="space-y-1 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between"><dt>FPS</dt><dd className="text-slate-200">{Math.round(frameStats.fps)}</dd></div>
              <div className="flex justify-between"><dt>Draw calls</dt><dd className="text-slate-200">{frameStats.drawCalls.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt>Triangles</dt><dd className="text-slate-200">{frameStats.triangles.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt>Textures</dt><dd className="text-slate-200">{tierSettings.textureResolution}px</dd></div>
              <div className="flex justify-between"><dt>Shadows</dt><dd className="text-slate-200">{tierSettings.shadowMapSize}px</dd></div>
              <div className="flex justify-between"><dt>Ground-truth AO</dt><dd className="text-slate-200">{tierSettings.gtao ? `GTAO ${tierSettings.gtaoSamples}` : 'off'}</dd></div>
              <div className="flex justify-between"><dt>Volumetric fog</dt><dd className="text-slate-200">{tierSettings.volumetricFog ? `${tierSettings.fogSteps} steps` : 'off'}</dd></div>
              <div className="flex justify-between"><dt>Bloom / DOF</dt><dd className="text-slate-200">{tierSettings.bloom ? tierSettings.bloomStrength.toFixed(2) : 'off'} / {tierSettings.depthOfField ? 'on' : 'off'}</dd></div>
              <div className="flex justify-between"><dt>Reflections</dt><dd className="text-slate-200">{tierSettings.reflections ? `${tierSettings.reflectorResolution}px` : 'off'}</dd></div>
              <div className="flex justify-between"><dt>IBL / SMAA / MSAA</dt><dd className="text-slate-200">{tierSettings.ibl ? 'on' : 'off'} / {tierSettings.smaa ? 'on' : 'off'} / ×{tierSettings.msaaSamples || 1}</dd></div>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio panel */}
      <AnimatePresence>
        {isAudioOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-24 right-3 z-30 w-80"
          >
            <CampusAudioSettingsCard compact />
            <div className="mt-1 text-right">
              <button
                onClick={() => setIsAudioOpen(false)}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kiosk proximity hint */}
      {nearbyKioskName && !nearbyFacility && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[11px] font-mono text-cyan-200 backdrop-blur-md">
            {nearbyKioskName} — walk up to interact
          </div>
        </div>
      )}

      {/* Proximity prompt */}
      {nearbyFacility && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="px-5 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-2xl backdrop-blur-xl flex items-center gap-4 text-left max-w-lg"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
              {String(nearbyFacility.id).startsWith('vs-')
                ? <School className="w-5 h-5 animate-pulse" />
                : <Sparkles className="w-5 h-5 animate-pulse" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  {nearbyFacility.roomNumber}
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm truncate">{nearbyFacility.name}</h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{nearbyFacility.description}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onRequestAITutor && (
                <button
                  onClick={handleAskTutorHere}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700 transition-all flex items-center gap-1.5"
                  title="Ask an AI tutor about this room"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Ask Tutor</span>
                </button>
              )}
              {nearbyFacility.associatedLabId ? (
                <button
                  onClick={() => handleEnterLabDoor(nearbyFacility.associatedLabId!, nearbyFacility.name)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Enter Lab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleEnterClassroomDoor}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>{nearbyFacility.interactActionLabel || 'Enter'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <CampusTransitionPortal transition={transitionEvent} onComplete={handleTransitionComplete} />

      {/* Bottom controls */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">W</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">A</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">S</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">D</span>
          <span>Walk the {activeFloorNum === 0 ? 'Grand Concourse Hallway' : floorLabel}</span>
        </div>

        <div className="sm:hidden flex items-center gap-1 pointer-events-auto bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
          <button onClick={() => moveDirection('left')} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer">←</button>
          <div className="flex flex-col gap-1">
            <button onClick={() => moveDirection('forward')} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer">↑</button>
            <button onClick={() => moveDirection('backward')} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer">↓</button>
          </div>
          <button onClick={() => moveDirection('right')} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer">→</button>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono backdrop-blur-md pointer-events-auto shadow-lg">
          {userAvatar?.photoUrl ? (
            <img src={userAvatar.photoUrl} alt={userName} referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-cyan-400/60" />
          ) : (
            <span className="w-3 h-3 rounded-full border border-white/40"
              style={{ backgroundColor: userAvatar?.primaryColor || '#06b6d4' }} />
          )}
          <span className="font-semibold text-white">{userName}</span>
          <span className="text-slate-500 hidden md:inline">· {seasonInfo.emoji} {seasonInfo.name}</span>
        </div>
      </div>

      <ArchitecturalTourModal isOpen={isArchitecturalTourOpen} onClose={() => setIsArchitecturalTourOpen(false)} />
      <SeasonalThemeModal
        isOpen={isSeasonModalOpen}
        currentTheme={seasonTheme}
        onSelectTheme={(next) => { setSeasonTheme(next); setIsSeasonModalOpen(false); }}
        onClose={() => setIsSeasonModalOpen(false)}
      />
    </div>
  );
};

export default VirtualCampus;
