import * as THREE from 'three';

export interface CampusKioskInfo {
  id: string;
  title: string;
  subtitle: string;
  facilityName: string;
  floorNum: 1 | 2 | 3 | 4;
  position: [number, number, number]; // [x, y, z]
  prompt: string;
}

export const CAMPUS_KIOSKS: CampusKioskInfo[] = [
  {
    id: 'kiosk-atrium',
    title: 'Central Atrium Kiosk',
    subtitle: 'Campus Directory & Floor 1 Cleanrooms',
    facilityName: 'Ground Floor Atrium',
    floorNum: 1,
    position: [-3.8, 0, -3.8],
    prompt:
      'Welcome to the Central Atrium Information Kiosk at KEV XR Science Academy! Can you provide a comprehensive briefing on all 4 campus floors, the facility wings, the interactive 3D simulations available, and how the curriculum tracks connect theory to experimental practice?',
  },
  {
    id: 'kiosk-chemistry',
    title: 'Chemistry Wing Kiosk',
    subtitle: 'VSEPR Molecular Geometry & Chemical Synthesis',
    facilityName: 'Chemistry Laboratory',
    floorNum: 1,
    position: [-2.2, 0, -11.5],
    prompt:
      'I am standing outside the Chemistry Laboratory portal. Can you explain the scientific principles behind VSEPR molecular geometry, bond angles (109.5°, 120°, 180°), electron domain repulsions, and what experiments I can run inside this lab?',
  },
  {
    id: 'kiosk-astrophysics',
    title: 'Astrophysics Wing Kiosk',
    subtitle: 'Orbital Mechanics & N-Body Gravity Simulator',
    facilityName: 'Astrophysics Observatory',
    floorNum: 1,
    position: [2.2, 0, 11.5],
    prompt:
      'I am standing at the Astrophysics Observatory kiosk. Can you explain Kepler’s three laws of planetary motion, elliptical orbital mechanics, gravitational escape velocity, and how the N-body gravitational simulator computes celestial trajectories?',
  },
  {
    id: 'kiosk-biology',
    title: 'Cellular Biology Kiosk',
    subtitle: 'Eukaryotic Organelles & DNA Transcription',
    facilityName: 'Cellular Biology Center',
    floorNum: 1,
    position: [-11.5, 0, 2.2],
    prompt:
      'I am at the Cellular Biology kiosk. Can you give me a scientific overview of eukaryotic cell organelle physiology (mitochondria ATP generation, ribosomes, endoplasmic reticulum), DNA transcription, and the cryogenic electron microscope simulations in this facility?',
  },
  {
    id: 'kiosk-optics',
    title: 'Wave Optics Kiosk',
    subtitle: 'Laser Photonics & Snell’s Law of Refraction',
    facilityName: 'Wave Optics Cleanroom',
    floorNum: 1,
    position: [11.5, 0, -2.2],
    prompt:
      'I am at the Wave Optics Cleanroom kiosk. Can you explain Snell’s Law of refraction (n1 sin θ1 = n2 sin θ2), total internal reflection, laser dispersion through triangular prisms, and photonics cleanroom protocols?',
  },
];

export interface InteractiveKiosksResult {
  group: THREE.Group;
  kioskMeshes: THREE.Object3D[];
  updateAnimation: (t: number, delta: number) => void;
  getNearbyKiosk: (playerX: number, playerZ: number, threshold?: number) => CampusKioskInfo | null;
}

export function createInteractiveKiosks(): InteractiveKiosksResult {
  const group = new THREE.Group();
  group.name = 'campus-interactive-kiosks';

  const kioskMeshes: THREE.Object3D[] = [];
  const beacons: { mesh: THREE.Mesh; light: THREE.PointLight; baseY: number; phase: number }[] = [];

  CAMPUS_KIOSKS.forEach((kiosk, idx) => {
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(kiosk.position[0], 0, kiosk.position[2]);

    // Face towards the center (0, 0)
    kioskGroup.lookAt(0, 0, 0);

    // 1. Sleek Pedestal Base (Hexagonal cylinder)
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.1, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.85,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.55;
    base.castShadow = true;
    base.receiveShadow = true;
    kioskGroup.add(base);

    // Neon Accent Ring
    const ringGeo = new THREE.TorusGeometry(0.52, 0.03, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.75;
    ring.rotation.x = Math.PI / 2;
    kioskGroup.add(ring);

    // 2. Angled Holographic Terminal Screen
    const screenConsoleGeo = new THREE.BoxGeometry(0.8, 0.08, 0.6);
    const screenConsoleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7,
    });
    const screenConsole = new THREE.Mesh(screenConsoleGeo, screenConsoleMat);
    screenConsole.position.set(0, 1.15, 0.1);
    screenConsole.rotation.x = 0.45; // Angled towards student
    kioskGroup.add(screenConsole);

    // Glowing Holographic Display Glass
    const glassGeo = new THREE.PlaneGeometry(0.72, 0.52);
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.16, 0.1);
    glass.rotation.x = 0.45;
    kioskGroup.add(glass);

    // 3. Floating Rotating Holographic "Info" Beacon above the terminal
    const beaconGeo = new THREE.OctahedronGeometry(0.2, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 1.9, 0);
    kioskGroup.add(beacon);

    // Outer Orbiting Halo Ring
    const haloGeo = new THREE.TorusGeometry(0.3, 0.015, 6, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 1.9, 0);
    halo.rotation.x = Math.PI / 3;
    kioskGroup.add(halo);

    // Soft beacon point light
    const beaconLight = new THREE.PointLight(0x06b6d4, 0.8, 4);
    beaconLight.position.set(0, 1.9, 0);
    kioskGroup.add(beaconLight);

    beacons.push({
      mesh: beacon,
      light: beaconLight,
      baseY: 1.9,
      phase: idx * 1.2,
    });

    // Tag entire hierarchy for raycasting
    kioskGroup.userData = {
      isKiosk: true,
      kioskInfo: kiosk,
    };
    base.userData = kioskGroup.userData;
    screenConsole.userData = kioskGroup.userData;
    glass.userData = kioskGroup.userData;
    beacon.userData = kioskGroup.userData;

    kioskMeshes.push(kioskGroup);
    group.add(kioskGroup);
  });

  const updateAnimation = (t: number, delta: number) => {
    beacons.forEach((b) => {
      b.mesh.rotation.y = t * 1.5;
      b.mesh.rotation.z = Math.sin(t * 0.8 + b.phase) * 0.2;
      b.mesh.position.y = b.baseY + Math.sin(t * 2.0 + b.phase) * 0.08;
      b.light.intensity = 0.6 + Math.sin(t * 3.0 + b.phase) * 0.3;
    });
  };

  const getNearbyKiosk = (playerX: number, playerZ: number, threshold = 2.8): CampusKioskInfo | null => {
    for (const kiosk of CAMPUS_KIOSKS) {
      const dist = Math.hypot(playerX - kiosk.position[0], playerZ - kiosk.position[2]);
      if (dist < threshold) {
        return kiosk;
      }
    }
    return null;
  };

  return {
    group,
    kioskMeshes,
    updateAnimation,
    getNearbyKiosk,
  };
}
