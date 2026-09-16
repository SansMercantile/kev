import * as THREE from 'three';
import { PHOTOREALISTIC_ASSETS } from '../../assets/images';

/**
 * Procedurally generates a photorealistic polished terrazzo marble floor texture
 */
export function createPolishedTerrazzoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Gradient base for high-contrast architectural marble
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#0a101f');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#0c1322');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Architectural tile joints
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  const tileSize = 128;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Marble veining and mineral crystalline specks
  const specks = ['#38bdf8', '#06b6d4', '#94a3b8', '#475569', '#64748b', '#0284c7'];
  for (let i = 0; i < 500; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.fillStyle = specks[Math.floor(Math.random() * specks.length)];
    ctx.globalAlpha = 0.28;
    ctx.fillRect(rx, ry, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

/**
 * Creates a floating 3D billboard sprite with a photorealistic portrait, name, and research role
 */
export function createNameplateSprite(
  name: string,
  role: string,
  colorHex: string,
  photoUrl?: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  const drawContent = (img?: HTMLImageElement) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, 512, 160);

    // Rounded background badge
    ctx.fillStyle = 'rgba(6, 9, 20, 0.9)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 140, 24);
    ctx.fill();

    // Glowing border
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Circular portrait cutout
    const cx = 80;
    const cy = 80;
    const r = 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = colorHex;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.slice(0, 2).toUpperCase(), cx, cy);
    }
    ctx.restore();

    // Portrait rim ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Student Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, 150, 72);

    // Specialty / Clearance
    ctx.fillStyle = colorHex;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(role.toUpperCase(), 150, 108);

    texture.needsUpdate = true;
  };

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.6, 0.8, 1);
  sprite.position.y = 2.45;

  drawContent();

  // Async load photo if provided
  if (photoUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawContent(img);
    img.src = photoUrl;
  }

  return sprite;
}

export interface ArticulatedAvatar {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  torso: THREE.Mesh;
  nameplate: THREE.Sprite;
}

/**
 * Builds an articulated 3D humanoid avatar with realistic research lab coat, lapels, limbs, and floating nameplate
 */
export function buildArticulatedAvatar(options: {
  name: string;
  role: string;
  primaryColor: string;
  glowColor: string;
  photoUrl?: string;
  isPlayer?: boolean;
}): ArticulatedAvatar {
  const group = new THREE.Group();

  // 1. Legs & Boots
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });

  const leftLegGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.58, 12);
  const leftLeg = new THREE.Mesh(leftLegGeo, legMat);
  leftLeg.position.set(-0.12, 0.3, 0);
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), bootMat);
  leftBoot.position.set(0, -0.25, 0.04);
  leftLeg.add(leftBoot);
  group.add(leftLeg);

  const rightLegGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.58, 12);
  const rightLeg = new THREE.Mesh(rightLegGeo, legMat);
  rightLeg.position.set(0.12, 0.3, 0);
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), bootMat);
  rightBoot.position.set(0, -0.25, 0.04);
  rightLeg.add(rightBoot);
  group.add(rightLeg);

  // 2. Torso with Research Lab Coat & Vest
  const coatMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
    metalness: 0.1,
  });
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.64, 16);
  const torso = new THREE.Mesh(torsoGeo, coatMat);
  torso.position.y = 0.88;
  group.add(torso);

  // Vest undercoat with personalized student color
  const vestGeo = new THREE.CylinderGeometry(0.2, 0.17, 0.6, 16);
  const vestMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(options.primaryColor),
    roughness: 0.3,
    metalness: 0.6,
  });
  const vest = new THREE.Mesh(vestGeo, vestMat);
  vest.position.set(0, 0, 0.03);
  torso.add(vest);

  // Biometric Core Pin / Badge
  const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(options.glowColor) });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = Math.PI / 2;
  core.position.set(0, 0.12, 0.22);
  torso.add(core);

  // Collar
  const collarGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 20);
  const collarMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.set(0, 0.32, 0);
  collar.rotation.x = Math.PI / 2;
  torso.add(collar);

  // 3. Head & Facial Features
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfa17a, roughness: 0.6 });
  const headGeo = new THREE.SphereGeometry(0.18, 20, 20);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.38, 0);
  group.add(head);

  // Hair Styling
  const hairGeo = new THREE.SphereGeometry(0.185, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.8 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.39, 0);
  group.add(hair);

  // Optical Visor
  const visorGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(options.glowColor),
    transmission: 0.8,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    metalness: 0.2,
    emissive: new THREE.Color(options.glowColor),
    emissiveIntensity: 0.6,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.38, 0.03);
  visor.rotation.y = Math.PI / 2;
  group.add(visor);

  // 4. Arms & Hands
  const armMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const leftArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.5, 12);
  const leftArm = new THREE.Mesh(leftArmGeo, armMat);
  leftArm.position.set(-0.31, 0.88, 0.04);
  group.add(leftArm);

  const rightArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.5, 12);
  const rightArm = new THREE.Mesh(rightArmGeo, armMat);
  rightArm.position.set(0.31, 0.88, 0.04);
  group.add(rightArm);

  // If Player, holds a holographic research data tablet
  if (options.isPlayer) {
    const padGeo = new THREE.BoxGeometry(0.24, 0.15, 0.015);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.76, 0.24);
    pad.rotation.x = -0.4;
    group.add(pad);

    const padScreenGeo = new THREE.PlaneGeometry(0.22, 0.13);
    const padScreenMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(options.glowColor),
      transparent: true,
      opacity: 0.85,
    });
    const padScreen = new THREE.Mesh(padScreenGeo, padScreenMat);
    padScreen.position.set(0, 0.765, 0.25);
    padScreen.rotation.x = -0.4;
    group.add(padScreen);
  }

  // 5. Overhead Floating Photo Nameplate
  const nameplate = createNameplateSprite(
    options.name,
    options.role,
    options.glowColor,
    options.photoUrl
  );
  group.add(nameplate);

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    nameplate,
  };
}

/**
 * Creates biophilic living garden columns with lush tropical foliage in the campus atrium
 */
export function createBiophilicPlanters(): THREE.Group {
  const group = new THREE.Group();

  const planterPositions = [
    [-6, 0, -4],
    [6, 0, -4],
    [-6, 0, 6],
    [6, 0, 6],
  ];

  planterPositions.forEach(([x, y, z]) => {
    const planterBoxGeo = new THREE.CylinderGeometry(0.9, 0.8, 0.8, 16);
    const planterBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.6 });
    const box = new THREE.Mesh(planterBoxGeo, planterBoxMat);
    box.position.set(x, 0.4, z);
    group.add(box);

    // Soil
    const soilGeo = new THREE.CircleGeometry(0.85, 16);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.set(x, 0.81, z);
    group.add(soil);

    // Palm / Monstera foliage cluster
    for (let l = 0; l < 8; l++) {
      const angle = (l / 8) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(0.35, 1.4, 4);
      const leafMat = new THREE.MeshStandardMaterial({
        color: l % 2 === 0 ? 0x10b981 : 0x059669,
        roughness: 0.5,
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(x + Math.cos(angle) * 0.3, 1.3, z + Math.sin(angle) * 0.3);
      leaf.rotation.z = Math.cos(angle) * 0.4;
      leaf.rotation.x = Math.sin(angle) * 0.4;
      group.add(leaf);
    }
  });

  return group;
}

/**
 * Builds realistic 3D science apparatus inside the 4 wing bays
 */
export function createWingApparatus(type: 'chem' | 'astro' | 'bio' | 'optics'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'chem') {
    // Rotating Benzene Molecular Orbital
    const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 8, 6);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const atomGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const atomMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0xffffff, roughness: 0.2 });
      const atom = new THREE.Mesh(atomGeo, atomMat);
      atom.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0);
      group.add(atom);
    }
  } else if (type === 'astro') {
    // Rotating Planetary Sphere with Saturn-like Ring
    const planetGeo = new THREE.SphereGeometry(0.9, 24, 24);
    const planetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.3 });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    group.add(planet);

    const orbitGeo = new THREE.RingGeometry(1.3, 1.8, 32);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 3;
    group.add(orbit);
  } else if (type === 'bio') {
    // Glowing DNA Double Helix Cylinder
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 3;
      const y = (i - 7) * 0.18;
      const a1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      a1.position.set(Math.cos(angle) * 0.8, y, Math.sin(angle) * 0.8);
      group.add(a1);

      const a2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
      a2.position.set(Math.cos(angle + Math.PI) * 0.8, y, Math.sin(angle + Math.PI) * 0.8);
      group.add(a2);

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), new THREE.MeshBasicMaterial({ color: 0x64748b }));
      rod.position.y = y;
      rod.rotation.z = Math.PI / 2;
      rod.rotation.y = -angle;
      group.add(rod);
    }
  } else if (type === 'optics') {
    // Optical Prism with Refracted Multi-Color Laser
    const prismGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 3);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.9,
    });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    group.add(prism);

    // Laser Beam lines
    const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = Math.PI / 3;
    beam.position.set(-1.2, 0, 0);
    group.add(beam);
  }

  return group;
}
