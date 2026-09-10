import { xrApi } from '../../lib/xrApi';
import { cachedFetch, onReconnect } from '../../lib/offline';
import { STATIC_FLOORS } from '../../data/campusFloors';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFloorNum, setActiveFloorNum] = useState<1 | 2 | 3 | 4>(initialFloor);
  const [floors, setFloors] = useState<CampusFloor[]>([]);
  const [nearbyFacility, setNearbyFacility] = useState<CampusFacility | null>(null);
  const [cameraMode, setCameraMode] = useState<'walk' | 'isometric'>('walk');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [transitionEvent, setTransitionEvent] = useState<CampusTransitionEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isArchitecturalTourOpen, setIsArchitecturalTourOpen] = useState<boolean>(false);

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
        // NetworkFirst with IndexedDB cache, static bundle as last resort:
        // the 3D campus always renders rooms, even fully offline.
        const data = await cachedFetch<{ floors?: CampusFloor[] }>(xrApi('/campus/floors'), {
          fallback: { floors: STATIC_FLOORS as unknown as CampusFloor[] },
        });
        if (data.floors) {
          setFloors(data.floors);
        }
      } catch (err) {
        console.error('Failed to load campus floor layout:', err);
      }
    }
    loadLayout();
    return onReconnect(loadLayout);
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060914);
    scene.fog = new THREE.FogExp2(0x060914, 0.025);

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
    const grid = new THREE.GridHelper(60, 60, 0x06b6d4, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Ceiling & Skylight
    const ceilingGeo = new THREE.PlaneGeometry(60, 60);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 7.0;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Central Glass Atrium Skylight
    const skylightGeo = new THREE.CylinderGeometry(8, 8, 0.2, 32);
    const skylightMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
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

    // Central Atrium Holographic Pillar & Fountain of Science
    const pillarGeo = new THREE.CylinderGeometry(1.5, 1.8, 6.8, 24);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0, 3.4, 0);
    scene.add(pillar);

    // Floating DNA Hologram around central pillar
    const dnaGroup = new THREE.Group();
    dnaGroup.position.set(0, 3.5, 0);
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 4;
      const y = (i - 10) * 0.25;
      const x1 = Math.cos(angle) * 2.2;
      const z1 = Math.sin(angle) * 2.2;
      const x2 = Math.cos(angle + Math.PI) * 2.2;
      const z2 = Math.sin(angle + Math.PI) * 2.2;

      const nodeGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const nodeMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const nodeMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

      const n1 = new THREE.Mesh(nodeGeo, nodeMat1);
      n1.position.set(x1, y, z1);
      dnaGroup.add(n1);

      const n2 = new THREE.Mesh(nodeGeo, nodeMat2);
      n2.position.set(x2, y, z2);
      dnaGroup.add(n2);
    }
    scene.add(dnaGroup);

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
      scene.add(door);

      // Glowing Doorway Frame
      const doorFrameGeo = new THREE.RingGeometry(1.7, 1.9, 4);
      const doorFrameMat = new THREE.MeshBasicMaterial({ color: w.color });
      const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
      doorFrame.rotation.z = Math.PI / 4;
      doorFrame.position.set(w.pos[0], 2.2, w.pos[2] + 6.05);
      scene.add(doorFrame);

      // Signboard atop doorway
      const signGeo = new THREE.BoxGeometry(4.5, 0.6, 0.2);
      const signMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(w.pos[0], 4.2, w.pos[2] + 6.1);
      scene.add(sign);

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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation & Movement Loop
    let animId = 0;
    let clock = new THREE.Clock();
    let walkCycleTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // Rotate central DNA hologram
      dnaGroup.rotation.y = t * 0.6;

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
      setNearbyFacility(detected);

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
      renderer.dispose();
    };
  }, [activeFloorNum, cameraMode, userAvatar]);

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
                Floor {activeFloorNum}: {activeFloorNum === 1 ? t('xr.floorGround') : activeFloorNum === 2 ? t('xr.floorBioOptics') : activeFloorNum === 3 ? t('xr.floorAstro') : t('xr.floorXrLabs')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('xr.campusHint')}
            </p>
          </div>
        </div>

        {/* HUD Quick Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Architectural Grounds & 8K Tour Button */}
          <button
            onClick={() => setIsArchitecturalTourOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
            title="Explore 8K Photo-Realistic Architectural Campus Grounds & Cleanroom Suites"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('xr.archTour')}</span>
          </button>

          {/* 2D Campus Map Blueprint Button */}
          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('xr.campusMap')}</span>
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

      {/* 8K Architectural Campus Grounds & Cleanroom Tour Modal */}
      <ArchitecturalTourModal
        isOpen={isArchitecturalTourOpen}
        onClose={() => setIsArchitecturalTourOpen(false)}
      />
    </div>
  );
};
