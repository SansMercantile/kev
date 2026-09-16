import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Layers,
  MapPin,
  MessageSquare,
  Users,
  Eye,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Footprints,
  Info,
  Building2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { CampusFacility, CampusFloor, LabId, AvatarConfig } from '../../types';
import { CampusTransitionPortal, CampusTransitionEvent } from './CampusTransitionPortal';
import { ArchitecturalTourModal } from './ArchitecturalTourModal';
import { PHOTOREALISTIC_ASSETS } from '../../assets/images';
import {
  createPolishedTerrazzoTexture,
  buildArticulatedAvatar,
  createBiophilicPlanters,
  createWingApparatus,
  ArticulatedAvatar,
} from './campus3dHelpers';
import {
  CampusSeasonTheme,
  SEASON_THEMES_INFO,
  detectDefaultSeasonTheme,
  createThemedCenterpiece,
  createThemedSchoolDecorations,
  createThemedAtmosphericParticles,
} from './campusThemedCenterpiece';
import {
  SeasonalThemeManager,
  createInjectedThematicAssets,
} from './SeasonalThemeManager';
import {
  createInteractiveKiosks,
  CampusKioskInfo,
} from './campusKiosks';
import { campusAudio } from '../../services/campusAudioEngine';
import { CampusAudioSettingsCard } from './CampusAudioSettingsCard';
import { SeasonalThemeModal } from './SeasonalThemeModal';

interface Props {
  currentFloor?: 1 | 2 | 3 | 4;
  userAvatar?: AvatarConfig;
  userName: string;
  onOpenMap: () => void;
  onOpenChat: () => void;
  onOpenPeerMentors?: () => void;
  onNavigateToLab: (labId: LabId) => void;
  onNavigateToClassroom: () => void;
  onRequestAITutor: (context: string) => void;
  teleportTargetFacility?: CampusFacility | null;
  onClearTeleportTarget?: () => void;
}

export const VirtualCampus: React.FC<Props> = ({
  currentFloor: initialFloor = 1,
  userAvatar,
  userName,
  onOpenMap,
  onOpenChat,
  onOpenPeerMentors,
  onNavigateToLab,
  onNavigateToClassroom,
  onRequestAITutor,
  teleportTargetFacility,
  onClearTeleportTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFloorNum, setActiveFloorNum] = useState<1 | 2 | 3 | 4>(initialFloor);
  const [floors, setFloors] = useState<CampusFloor[]>([]);
  const [nearbyFacility, setNearbyFacility] = useState<CampusFacility | null>(null);
  const [cameraMode, setCameraMode] = useState<'walk' | 'isometric'>('walk');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [transitionEvent, setTransitionEvent] = useState<CampusTransitionEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isArchitecturalTourOpen, setIsArchitecturalTourOpen] = useState<boolean>(false);

  // Seasonal Holiday & Festive School Theming
  const [seasonTheme, setSeasonTheme] = useState<CampusSeasonTheme>(() => {
    try {
      const saved = localStorage.getItem('kev_campus_season_theme') as CampusSeasonTheme | null;
      if (saved && SEASON_THEMES_INFO[saved]) return saved;
    } catch (_) {}
    return detectDefaultSeasonTheme();
  });
  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState<boolean>(false);
  const [nearCenterpiece, setNearCenterpiece] = useState<boolean>(false);

  // Interactive Information Kiosks & Instant Double-Click Warp
  const [nearbyKiosk, setNearbyKiosk] = useState<CampusKioskInfo | null>(null);
  const [instantWarpNotice, setInstantWarpNotice] = useState<string | null>(null);
  const portalMeshesRef = useRef<THREE.Object3D[]>([]);
  const kioskMeshesRef = useRef<THREE.Object3D[]>([]);
  const nearbyKioskRef = useRef<CampusKioskInfo | null>(null);
  const nearbyFacilityRef = useRef<CampusFacility | null>(null);

  const handleSelectSeasonTheme = (theme: CampusSeasonTheme) => {
    setSeasonTheme(theme);
    try {
      localStorage.setItem('kev_campus_season_theme', theme);
    } catch (_) {}
  };

  const handleElevatorFloorChange = (targetFloor: 1 | 2 | 3 | 4) => {
    if (targetFloor === activeFloorNum) return;
    const floorNames: Record<number, string> = {
      1: 'Floor 1: Ground Atrium & Physics Labs',
      2: 'Floor 2: Cellular Bio & Wave Optics Cleanrooms',
      3: 'Floor 3: Astrophysics Stellar Observatory',
      4: 'Floor 4: KEV Holographic & XR Immersion Suites',
    };
    setTransitionEvent({
      type: 'floor',
      fromFloor: activeFloorNum,
      toFloor: targetFloor,
      destinationName: floorNames[targetFloor],
    });
    setPendingAction(() => () => setActiveFloorNum(targetFloor));
  };

  const handleEnterLabDoor = (labId: LabId, facilityName: string) => {
    setTransitionEvent({
      type: 'door',
      destinationName: facilityName,
    });
    setPendingAction(() => () => onNavigateToLab(labId));
  };

  const handleEnterClassroomDoor = () => {
    setTransitionEvent({
      type: 'door',
      destinationName: 'Main Academy Auditorium & Classrooms',
    });
    setPendingAction(() => () => onNavigateToClassroom());
  };

  const handleTransitionComplete = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setTransitionEvent(null);
  };

  // Position coordinates of player
  const playerPosRef = useRef<{ x: number; z: number; rotY: number }>({ x: 0, z: 8, rotY: 0 });

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    playerGroup: THREE.Group;
    roomZones: { facility: CampusFacility; box: THREE.Box3 }[];
    animId: number;
    keysDown: Record<string, boolean>;
  } | null>(null);

  // Fetch campus layout from stateless API
  useEffect(() => {
    async function loadLayout() {
      try {
        const res = await fetch('/api/campus/floors');
        const data = await res.json();
        if (data.floors) {
          setFloors(data.floors);
        }
      } catch (err) {
        console.error('Failed to load campus floor layout:', err);
      }
    }
    loadLayout();
  }, []);

  // Handle external teleport requests from Campus Map
  useEffect(() => {
    if (teleportTargetFacility && threeRef.current) {
      playerPosRef.current.x = teleportTargetFacility.coordinates.x;
      playerPosRef.current.z = teleportTargetFacility.coordinates.z + 2;
      setNearbyFacility(teleportTargetFacility);
      if (onClearTeleportTarget) onClearTeleportTarget();
    }
  }, [teleportTargetFacility]);

  // Three.js Campus Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const themeConfig = SEASON_THEMES_INFO[seasonTheme];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(themeConfig.colorScheme.fogColor);
    scene.fog = new THREE.FogExp2(themeConfig.colorScheme.fogColor, 0.025);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.replaceChildren(renderer.domElement);

    // --- ARCHITECTURAL CAMPUS BUILDING ---
    // Floor Slab (60m x 60m) with High-Res Polished Terrazzo Marble Texture
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const terrazzoTexture = createPolishedTerrazzoTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: terrazzoTexture,
      roughness: 0.18,
      metalness: 0.35,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Architectural Grid Lines
    const grid = new THREE.GridHelper(60, 60, themeConfig.colorScheme.hexPrimary, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Ceiling & Skylight
    const ceilingGeo = new THREE.PlaneGeometry(60, 60);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 7.0;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Central Glass Atrium Skylight with holiday theme tint
    const skylightGeo = new THREE.CylinderGeometry(8, 8, 0.2, 32);
    const skylightMat = new THREE.MeshPhysicalMaterial({
      color: themeConfig.colorScheme.skylightColor,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
    });
    const skylight = new THREE.Mesh(skylightGeo, skylightMat);
    skylight.position.set(0, 6.95, 0);
    scene.add(skylight);

    // Biophilic Living Plant Columns in Atrium
    const plantersGroup = createBiophilicPlanters();
    scene.add(plantersGroup);

    // Central Atrium Themed Holiday Centerpiece (Halloween / Christmas / Easter / Thanksgiving / Academic)
    const themedCenterpiece = createThemedCenterpiece(seasonTheme);
    scene.add(themedCenterpiece.group);

    // Injected Thematic 3D Assets (pumpkins, ornaments, Easter eggs, harvest sheaves)
    const injectedAssets = createInjectedThematicAssets(seasonTheme);
    scene.add(injectedAssets.group);

    // Interactive Information Kiosks (Atrium, Chemistry, Astrophysics, Bio, Optics)
    const interactiveKiosks = createInteractiveKiosks();
    scene.add(interactiveKiosks.group);
    kioskMeshesRef.current = interactiveKiosks.kioskMeshes;

    // Falling Atmospheric Particle Effects (Snow, spooky embers, petals, autumn leaves)
    const atmosphericParticles = createThemedAtmosphericParticles(seasonTheme);
    scene.add(atmosphericParticles.group);

    // Central Elevator Holographic Column
    const elevatorGeo = new THREE.CylinderGeometry(2.5, 2.5, 7.0, 16, 1, true);
    const elevatorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const elevatorTube = new THREE.Mesh(elevatorGeo, elevatorMat);
    elevatorTube.position.set(0, 3.5, -12);
    scene.add(elevatorTube);

    // Elevator Rings
    for (let h = 1; h <= 4; h++) {
      const ringGeo = new THREE.TorusGeometry(2.5, 0.06, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: h === activeFloorNum ? 0x06b6d4 : 0x475569 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, h * 1.5, -12);
      scene.add(ring);
    }

    // --- Build 4 Facility Wings with Apparatus & Holographic Portal Signage ---
    const roomZones: { facility: CampusFacility; box: THREE.Box3 }[] = [];

    const WINGS = [
      {
        id: 'wing-chem',
        name: 'Chemistry Laboratory (VSEPR & Bonding)',
        pos: [-14, 0, -6],
        color: 0x06b6d4,
        apparatusType: 'chem' as const,
        labId: 'chemistry' as LabId,
        facility: {
          id: 'fac-chem',
          roomNumber: 'Room 102',
          name: '3D Chemistry Laboratory',
          type: 'lab' as const,
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
        apparatusType: 'astro' as const,
        labId: 'astrophysics' as LabId,
        facility: {
          id: 'fac-astro',
          roomNumber: 'Room 301',
          name: 'Kepler Planetary Observatory',
          type: 'observatory' as const,
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
        apparatusType: 'bio' as const,
        labId: 'biology' as LabId,
        facility: {
          id: 'fac-bio',
          roomNumber: 'Room 201',
          name: 'Cellular Biology Lab',
          type: 'lab' as const,
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
        apparatusType: 'optics' as const,
        labId: 'optics' as LabId,
        facility: {
          id: 'fac-optics',
          roomNumber: 'Room 202',
          name: 'Wave Optics Lab',
          type: 'cleanroom' as const,
          associatedLabId: 'optics' as LabId,
          tutorInResidence: 'prof-novak',
          description: 'Test Snell’s Law of refraction, Cauchy dispersion coefficients, and total internal reflection.',
          interactActionLabel: 'Enter Optics Lab',
          coordinates: { x: 14, z: 10 },
        },
      },
    ];

    const wingApparatusList: THREE.Group[] = [];
    const portalMeshes: THREE.Object3D[] = [];

    WINGS.forEach((w) => {
      // Room perimeter walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
      const roomBox = new THREE.BoxGeometry(12, 4.5, 12);
      const roomMesh = new THREE.Mesh(roomBox, wallMat);
      roomMesh.position.set(w.pos[0], 2.25, w.pos[2]);
      scene.add(roomMesh);

      // Interactive 3D Science Apparatus inside the bay
      const apparatus = createWingApparatus(w.apparatusType);
      apparatus.position.set(w.pos[0], 2.0, w.pos[2] + 1.5);
      scene.add(apparatus);
      wingApparatusList.push(apparatus);

      // Holographic doorway portal
      const doorGeo = new THREE.PlaneGeometry(3.5, 3.8);
      const doorMat = new THREE.MeshBasicMaterial({
        color: w.color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(w.pos[0], 1.9, w.pos[2] + 6.01);
      door.userData = { isPortal: true, facility: w.facility, labId: w.labId };
      scene.add(door);
      portalMeshes.push(door);

      // Glowing Doorway Frame
      const doorFrameGeo = new THREE.RingGeometry(1.7, 1.9, 4);
      const doorFrameMat = new THREE.MeshBasicMaterial({ color: w.color });
      const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
      doorFrame.rotation.z = Math.PI / 4;
      doorFrame.position.set(w.pos[0], 2.2, w.pos[2] + 6.05);
      doorFrame.userData = door.userData;
      scene.add(doorFrame);
      portalMeshes.push(doorFrame);

      // Signboard atop doorway
      const signGeo = new THREE.BoxGeometry(4.5, 0.6, 0.2);
      const signMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(w.pos[0], 4.2, w.pos[2] + 6.1);
      sign.userData = door.userData;
      scene.add(sign);
      portalMeshes.push(sign);

      // Holographic Light Beacon
      const light = new THREE.PointLight(w.color, 2.5, 8);
      light.position.set(w.pos[0], 3.0, w.pos[2] + 5.0);
      scene.add(light);

      // Zone box for proximity detection
      const triggerBox = new THREE.Box3(
        new THREE.Vector3(w.pos[0] - 4, 0, w.pos[2] + 3),
        new THREE.Vector3(w.pos[0] + 4, 4, w.pos[2] + 8)
      );
      roomZones.push({ facility: w.facility, box: triggerBox });
    });
    portalMeshesRef.current = portalMeshes;

    // Themed School Facility Decorations (garlands, holiday sconces, wreaths, candy canes, wheat bundles)
    const themedSchoolDecorations = createThemedSchoolDecorations(seasonTheme, WINGS);
    scene.add(themedSchoolDecorations.group);

    // --- Articulated Peer Avatars Milling with Floating Photo Nameplates ---
    const peerData = [
      {
        name: 'Maya Lin',
        role: 'Biochem Scholar',
        x: -4,
        z: 2,
        primaryColor: '#10b981',
        glowColor: '#34d399',
        photoUrl: PHOTOREALISTIC_ASSETS.avatars['molecular-bio'],
      },
      {
        name: 'Devon Vance',
        role: 'Astrophysics',
        x: 4,
        z: -2,
        primaryColor: '#f59e0b',
        glowColor: '#fbbf24',
        photoUrl: PHOTOREALISTIC_ASSETS.avatars['astro-pioneer'],
      },
      {
        name: 'Sofia Chen',
        role: 'Genomics Lead',
        x: -5,
        z: -5,
        primaryColor: '#a855f7',
        glowColor: '#c084fc',
        photoUrl: PHOTOREALISTIC_ASSETS.avatars['cellular-lead'],
      },
      {
        name: 'Tariq Al-Mansoor',
        role: 'Quantum Optics',
        x: 3,
        z: 5,
        primaryColor: '#06b6d4',
        glowColor: '#38bdf8',
        photoUrl: PHOTOREALISTIC_ASSETS.avatars['quantum-physicist'],
      },
    ];

    const peerAvatars: ArticulatedAvatar[] = [];
    peerData.forEach((pd) => {
      const peer = buildArticulatedAvatar({
        name: pd.name,
        role: pd.role,
        primaryColor: pd.primaryColor,
        glowColor: pd.glowColor,
        photoUrl: pd.photoUrl,
        isPlayer: false,
      });
      peer.group.position.set(pd.x, 0, pd.z);
      scene.add(peer.group);
      peerAvatars.push(peer);
    });

    // --- Articulated Student Player Avatar with Floating Photo Nameplate ---
    const playerPrimary = userAvatar?.primaryColor || '#06b6d4';
    const playerGlow = userAvatar?.glowColor || '#38bdf8';
    const playerPhoto = userAvatar?.photoUrl || PHOTOREALISTIC_ASSETS.avatars['cyber-scholar'];

    const playerRig = buildArticulatedAvatar({
      name: userName || 'Research Scholar',
      role: 'Tier 1 Fellow',
      primaryColor: playerPrimary,
      glowColor: playerGlow,
      photoUrl: playerPhoto,
      isPlayer: true,
    });
    const playerGroup = playerRig.group;
    playerGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    scene.add(playerGroup);

    // Global Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(10, 22, 15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Input Tracking
    const keysDown: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown[e.key.toLowerCase()] = true;

      // 'E' Quick Interaction Key
      if (e.key.toLowerCase() === 'e') {
        if (nearbyKioskRef.current) {
          campusAudio.playInteractiveKioskChime();
          onRequestAITutor(nearbyKioskRef.current.prompt);
          return;
        }
        if (nearbyFacilityRef.current) {
          if (nearbyFacilityRef.current.associatedLabId) {
            handleEnterLabDoor(nearbyFacilityRef.current.associatedLabId, nearbyFacilityRef.current.name);
          } else {
            handleEnterClassroomDoor();
          }
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Double-Click Instant Launch on Lab Portals
    const handleDoubleClick = (e: MouseEvent) => {
      campusAudio.start();
      if (!containerRef.current || !threeRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      let targetFacility: CampusFacility | null = null;
      const hits = raycaster.intersectObjects(portalMeshesRef.current, true);

      if (hits.length > 0) {
        for (const hit of hits) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr) {
            if (curr.userData?.facility) {
              targetFacility = curr.userData.facility;
              break;
            }
            curr = curr.parent;
          }
          if (targetFacility) break;
        }
      }

      // Proximity fallback: If student double clicks anywhere while in doorway zone
      if (!targetFacility && nearbyFacilityRef.current) {
        targetFacility = nearbyFacilityRef.current;
      }

      if (targetFacility) {
        campusAudio.playPortalWarpSound();
        setInstantWarpNotice(`⚡ Instant Launch: Warping into ${targetFacility.name}!`);
        setTimeout(() => setInstantWarpNotice(null), 1800);

        if (targetFacility.associatedLabId) {
          onNavigateToLab(targetFacility.associatedLabId);
        } else {
          onNavigateToClassroom();
        }
      }
    };

    // Single Click on Interactive Information Kiosks
    const handleClick = (e: MouseEvent) => {
      campusAudio.start();
      if (!containerRef.current || !threeRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const kioskHits = raycaster.intersectObjects(kioskMeshesRef.current, true);
      if (kioskHits.length > 0) {
        for (const hit of kioskHits) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr) {
            if (curr.userData?.isKiosk && curr.userData.kioskInfo) {
              const info: CampusKioskInfo = curr.userData.kioskInfo;
              campusAudio.playInteractiveKioskChime();
              onRequestAITutor(info.prompt);
              return;
            }
            curr = curr.parent;
          }
        }
      }
    };

    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener('dblclick', handleDoubleClick);
      containerEl.addEventListener('click', handleClick);
    }

    // Animation & Movement Loop
    let animId = 0;
    let clock = new THREE.Clock();
    let walkCycleTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // Update themed centerpiece animations (e.g. rotating star/ghosts/gem)
      themedCenterpiece.updateAnimation(t, delta);

      // Update injected thematic assets & interactive kiosks animations
      injectedAssets.updateAnimation(t, delta);
      interactiveKiosks.updateAnimation(t, delta);

      // Update spatial soundscape audio dynamically as student walks
      campusAudio.updateSpatialPosition(playerPosRef.current.x, playerPosRef.current.z);

      // Update falling ambient seasonal particles
      atmosphericParticles.updateParticles(delta);

      // Rotate apparatus in wings
      wingApparatusList.forEach((ap, idx) => {
        ap.rotation.y = t * (0.4 + idx * 0.1);
      });

      // Peer Avatars gentle idle breathing
      peerAvatars.forEach((pa, idx) => {
        pa.group.position.y = Math.sin(t * 1.8 + idx) * 0.02;
      });

      // Handle Player Movement (WASD / Arrows)
      const speed = 7.0 * delta;
      const turnSpeed = 2.5 * delta;

      if (keysDown['a'] || keysDown['arrowleft']) {
        playerPosRef.current.rotY += turnSpeed;
      }
      if (keysDown['d'] || keysDown['arrowright']) {
        playerPosRef.current.rotY -= turnSpeed;
      }

      const forward = new THREE.Vector3(
        -Math.sin(playerPosRef.current.rotY),
        0,
        -Math.cos(playerPosRef.current.rotY)
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

      // Constrain within campus perimeter
      playerPosRef.current.x = Math.max(-26, Math.min(26, playerPosRef.current.x));
      playerPosRef.current.z = Math.max(-26, Math.min(26, playerPosRef.current.z));

      // Realistic Walk Cycle Animation for Articulated Limbs
      if (isMoving) {
        walkCycleTime += delta * 11;
        const legSwing = Math.sin(walkCycleTime) * 0.55;
        const armSwing = Math.sin(walkCycleTime) * 0.45;

        playerRig.leftLeg.rotation.x = legSwing;
        playerRig.rightLeg.rotation.x = -legSwing;
        playerRig.leftArm.rotation.x = -armSwing;
        playerRig.rightArm.rotation.x = armSwing;

        // Subtle vertical bobbing
        playerGroup.position.y = Math.abs(Math.sin(walkCycleTime * 2)) * 0.04;
      } else {
        playerRig.leftLeg.rotation.x = 0;
        playerRig.rightLeg.rotation.x = 0;
        playerRig.leftArm.rotation.x = 0.15;
        playerRig.rightArm.rotation.x = -0.15;
        playerGroup.position.y = 0;
      }

      // Update Player Mesh Position & Orientation
      playerGroup.position.x = playerPosRef.current.x;
      playerGroup.position.z = playerPosRef.current.z;
      playerGroup.rotation.y = playerPosRef.current.rotY;

      // Camera Follow Logic
      if (cameraMode === 'walk') {
        // Third-person shoulder / walking perspective
        const camOffset = new THREE.Vector3(
          Math.sin(playerPosRef.current.rotY) * 3.5,
          2.2,
          Math.cos(playerPosRef.current.rotY) * 3.5
        );
        camera.position.set(
          playerPosRef.current.x + camOffset.x,
          camOffset.y,
          playerPosRef.current.z + camOffset.z
        );
        camera.lookAt(playerPosRef.current.x, 1.4, playerPosRef.current.z);
      } else {
        // Top-down / Isometric Drone View
        camera.position.set(playerPosRef.current.x, 22, playerPosRef.current.z + 18);
        camera.lookAt(playerPosRef.current.x, 0, playerPosRef.current.z);
      }

      // Proximity Detection for Facility Wings
      const playerVec = new THREE.Vector3(playerPosRef.current.x, 1, playerPosRef.current.z);
      let detected: CampusFacility | null = null;
      for (const zone of roomZones) {
        if (zone.box.containsPoint(playerVec)) {
          detected = zone.facility;
          break;
        }
      }
      nearbyFacilityRef.current = detected;
      setNearbyFacility(detected);

      // Proximity Detection for Interactive Information Kiosks
      const currentKiosk = interactiveKiosks.getNearbyKiosk(playerPosRef.current.x, playerPosRef.current.z, 2.8);
      nearbyKioskRef.current = currentKiosk;
      setNearbyKiosk(currentKiosk);

      // Proximity Detection for Centerpiece in Center of School Facilities (x: 0, z: 0)
      const distToCenter = Math.hypot(playerPosRef.current.x, playerPosRef.current.z);
      setNearCenterpiece(distToCenter < 4.6 && !detected && !currentKiosk);

      renderer.render(scene, camera);
    };

    animate();

    threeRef.current = {
      renderer,
      scene,
      camera,
      playerGroup,
      roomZones,
      animId,
      keysDown,
    };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (containerEl) {
        containerEl.removeEventListener('dblclick', handleDoubleClick);
        containerEl.removeEventListener('click', handleClick);
      }
      renderer.dispose();
    };
  }, [activeFloorNum, cameraMode, userAvatar, seasonTheme]);

  // Virtual Joypad Handlers for Touch / Mobile
  const moveDirection = (dir: 'forward' | 'backward' | 'left' | 'right') => {
    if (!threeRef.current) return;
    const { keysDown } = threeRef.current;
    if (dir === 'forward') keysDown['w'] = true;
    if (dir === 'backward') keysDown['s'] = true;
    if (dir === 'left') keysDown['a'] = true;
    if (dir === 'right') keysDown['d'] = true;
    setTimeout(() => {
      if (threeRef.current) {
        threeRef.current.keysDown['w'] = false;
        threeRef.current.keysDown['s'] = false;
        threeRef.current.keysDown['a'] = false;
        threeRef.current.keysDown['d'] = false;
      }
    }, 200);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Top Campus HUD Bar */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md backdrop-blur-md">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                KEV Virtual Campus Walkway
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                Floor {activeFloorNum}: {activeFloorNum === 1 ? 'Ground Atrium' : activeFloorNum === 2 ? 'Bio & Optics' : activeFloorNum === 3 ? 'Astrophysics' : 'XR Labs'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Walk the 4 floors, interact with live facility doors, or open the Campus Map to teleport
            </p>
          </div>
        </div>

        {/* HUD Quick Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Seasonal Theme Manager (Dynamic date-aware injection) */}
          <SeasonalThemeManager
            currentTheme={seasonTheme}
            onThemeChange={handleSelectSeasonTheme}
            onOpenThemeModal={() => setIsSeasonalModalOpen(true)}
            compact
          />

          {/* Background Audio Engine Controls (Volume & Mute) */}
          <CampusAudioSettingsCard compact />

          {/* Architectural Grounds & 8K Tour Button */}
          <button
            onClick={() => setIsArchitecturalTourOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
            title="Explore 8K Photo-Realistic Architectural Campus Grounds & Cleanroom Suites"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Architectural Tour</span>
          </button>

          {/* 2D Campus Map Blueprint Button */}
          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Campus Map</span>
          </button>

          {/* Peer Mentor Matching System Button */}
          {onOpenPeerMentors && (
            <button
              onClick={onOpenPeerMentors}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
              title="Open Campus Peer Mentors Matching & Tutoring"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Peer Mentors</span>
            </button>
          )}

          {/* Real-time Campus Chat Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Campus Chat</span>
          </button>

          {/* Camera Perspective Switcher */}
          <button
            onClick={() => setCameraMode(cameraMode === 'walk' ? 'isometric' : 'walk')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer backdrop-blur-md transition-all"
            title="Switch between Third-Person Walk and Drone View"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{cameraMode === 'walk' ? 'Drone View' : 'Walk View'}</span>
          </button>

          {/* Elevator Floor Switcher with Walk-Through Transitions */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-xl p-0.5 backdrop-blur-md">
            {[1, 2, 3, 4].map((f) => (
              <button
                key={f}
                onClick={() => handleElevatorFloorChange(f as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFloorNum === f
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Ride elevator to Floor ${f}`}
              >
                {f}F
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proximity Interaction Prompt Card (when standing in front of a facility doorway) */}
      {nearbyFacility && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="px-5 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-2xl backdrop-blur-xl flex items-center gap-4 text-left max-w-lg">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  {nearbyFacility.roomNumber}
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm">{nearbyFacility.name}</h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{nearbyFacility.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  Double-click portal to instant launch
                </span>
                <span className="text-[10px] text-slate-400 font-mono">• Press [E]</span>
              </div>
            </div>
            {nearbyFacility.associatedLabId ? (
              <button
                onClick={() => handleEnterLabDoor(nearbyFacility.associatedLabId!, nearbyFacility.name)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Enter Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleEnterClassroomDoor}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Enter Hall</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Information Kiosk Prompt Card */}
      {nearbyKiosk && !nearbyFacility && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="px-5 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-2xl backdrop-blur-xl flex items-center gap-4 text-left max-w-xl">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 border border-cyan-500/40">
              <HelpCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {nearbyKiosk.facilityName}
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm truncate">{nearbyKiosk.title}</h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {nearbyKiosk.subtitle}
              </p>
              <p className="text-[10px] text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                <span>Press [E] or click to open AI Tutor with facility curriculum context</span>
              </p>
            </div>
            <button
              onClick={() => {
                campusAudio.playInteractiveKioskChime();
                onRequestAITutor(nearbyKiosk.prompt);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      )}

      {/* Instant Lab Launch Warp Notice */}
      {instantWarpNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border border-white/40 shadow-cyan-500/40">
            <Zap className="w-4 h-4 fill-slate-950 animate-bounce" />
            <span>{instantWarpNotice}</span>
          </div>
        </div>
      )}

      {/* Framer Motion Campus Walk-Through Transition Overlay */}
      <CampusTransitionPortal
        transition={transitionEvent}
        onComplete={handleTransitionComplete}
      />

      {/* Bottom Walk Controls & Virtual Joypad Guide */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Keyboard Helper */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">W</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">A</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">S</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">D</span>
          <span>Walk & Turn Around School Facilities</span>
        </div>

        {/* Mobile On-Screen Direction Arrows */}
        <div className="sm:hidden flex items-center gap-1 pointer-events-auto bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => moveDirection('left')}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold"
          >
            ←
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => moveDirection('forward')}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold"
            >
              ↑
            </button>
            <button
              onClick={() => moveDirection('backward')}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold"
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => moveDirection('right')}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold"
          >
            →
          </button>
        </div>

        {/* Player Avatar Mini Tag */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono backdrop-blur-md pointer-events-auto shadow-lg">
          {userAvatar?.photoUrl ? (
            <img
              src={userAvatar.photoUrl}
              alt={userName}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-cyan-400/60"
            />
          ) : (
            <span
              className="w-3 h-3 rounded-full border border-white/40"
              style={{ backgroundColor: userAvatar?.primaryColor || '#06b6d4' }}
            />
          )}
          <span className="font-semibold text-white">{userName}</span>
        </div>
      </div>

      {/* Proximity Interaction Prompt Card for Central Themed Centerpiece */}
      {nearCenterpiece && !nearbyFacility && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="px-5 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-amber-400 shadow-2xl backdrop-blur-xl flex items-center gap-4 text-left max-w-xl">
            <div className="text-3xl shrink-0 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 shadow-inner">
              {SEASON_THEMES_INFO[seasonTheme].emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Centerpiece
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  {SEASON_THEMES_INFO[seasonTheme].centerpieceTitle}
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {SEASON_THEMES_INFO[seasonTheme].centerpieceDescription}
              </p>
            </div>
            <button
              onClick={() => setIsSeasonalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5"
            >
              <span>Explore Themes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 8K Architectural Campus Grounds & Cleanroom Tour Modal */}
      <ArchitecturalTourModal
        isOpen={isArchitecturalTourOpen}
        onClose={() => setIsArchitecturalTourOpen(false)}
      />

      {/* Seasonal Holiday Themes & STEM Science Modal */}
      <SeasonalThemeModal
        isOpen={isSeasonalModalOpen}
        currentTheme={seasonTheme}
        onSelectTheme={handleSelectSeasonTheme}
        onClose={() => setIsSeasonalModalOpen(false)}
      />
    </div>
  );
};
