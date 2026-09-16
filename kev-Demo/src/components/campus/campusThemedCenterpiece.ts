import * as THREE from 'three';

export type CampusSeasonTheme = 'halloween' | 'christmas' | 'easter' | 'thanksgiving' | 'academic';

export interface SeasonThemeInfo {
  id: CampusSeasonTheme;
  name: string;
  emoji: string;
  tagline: string;
  centerpieceTitle: string;
  centerpieceDescription: string;
  stemFactTitle: string;
  stemFactDescription: string;
  colorScheme: {
    primary: string;
    secondary: string;
    border: string;
    bgBadge: string;
    hexPrimary: number;
    hexSecondary: number;
    fogColor: number;
    skylightColor: number;
  };
}

export const SEASON_THEMES_INFO: Record<CampusSeasonTheme, SeasonThemeInfo> = {
  halloween: {
    id: 'halloween',
    name: 'Halloween Spooktacular',
    emoji: '🎃',
    tagline: 'Jack-o\'-lanterns, haunted gothic obelisk, flying bats & eerie mist',
    centerpieceTitle: 'The Jack-o\'-Lantern Citadel & Haunting Cauldron',
    centerpieceDescription: 'A multi-tiered gothic pedestal with glowing carved pumpkins, a bubbling fluorescent potion cauldron, and orbiting ghostly apparitions.',
    stemFactTitle: 'The Chemistry of Spooky Bioluminescence',
    stemFactDescription: 'Natural glow in pumpkins and jack-o\'-lantern effects mimics chemiluminescence—where luciferin oxidizes via luciferase enzymes, releasing optical photons without heat dissipation.',
    colorScheme: {
      primary: '#f97316',
      secondary: '#a855f7',
      border: 'border-orange-500/50',
      bgBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      hexPrimary: 0xf97316,
      hexSecondary: 0xa855f7,
      fogColor: 0x0c0714,
      skylightColor: 0xa855f7,
    },
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas Winter Wonderland',
    emoji: '🎄',
    tagline: 'Grand evergreen holiday tree, golden Bethlehem star, wrapped gifts & snowflakes',
    centerpieceTitle: 'The Grand Majestic Evergreen & Golden Star',
    centerpieceDescription: 'A towering tiered Christmas pine adorned with sparkling baubles, wrapped gifts with satin ribbons at the base, and falling soft winter snowflakes.',
    stemFactTitle: 'Crystallography of Hexagonal Ice Snowflakes',
    stemFactDescription: 'Snow crystals form when supercooled cloud water droplets freeze around a nucleus, crystallizing into prismatic hexagonal lattices governed by hydrogen bonding angles of 104.5°.',
    colorScheme: {
      primary: '#ef4444',
      secondary: '#10b981',
      border: 'border-red-500/50',
      bgBadge: 'bg-red-500/20 text-red-300 border-red-500/40',
      hexPrimary: 0xef4444,
      hexSecondary: 0x10b981,
      fogColor: 0x060c1c,
      skylightColor: 0x38bdf8,
    },
  },
  easter: {
    id: 'easter',
    name: 'Easter Spring Awakening',
    emoji: '🐣',
    tagline: 'Gilded Faberge egg monument, spring blossoms, pastel eggs & fluttering petals',
    centerpieceTitle: 'The Gilded Faberge Egg of Vernal Equinox',
    centerpieceDescription: 'A magnificent ornate Faberge egg monument crowned with an orbital crystal gem, resting upon a blossoming flowerbed ringed with pastel painted Easter eggs.',
    stemFactTitle: 'Botanical Photoperiodism & Vernalization',
    stemFactDescription: 'Spring blossom flowering is triggered by photoperiodic photoreceptors (phytochromes) detecting lengthening daylight hours, signaling apical meristems to transition from vegetative to floral development.',
    colorScheme: {
      primary: '#ec4899',
      secondary: '#06b6d4',
      border: 'border-pink-500/50',
      bgBadge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      hexPrimary: 0xec4899,
      hexSecondary: 0x06b6d4,
      fogColor: 0x081318,
      skylightColor: 0x67e8f9,
    },
  },
  thanksgiving: {
    id: 'thanksgiving',
    name: 'Thanksgiving Harvest Bounty',
    emoji: '🦃',
    tagline: 'Golden harvest cornucopia, autumn foliage, wheat sheaves & warm amber glow',
    centerpieceTitle: 'The Horn of Plenty (Cornucopia of Abundance)',
    centerpieceDescription: 'A grand woven golden wicker cornucopia overflowing with autumn pumpkins, acorn squash, maize, and crisp apples, flanked by golden wheat sheaves and fallen maple leaves.',
    stemFactTitle: 'Agricultural Soil Chemistry & Carotenoid Breakdown',
    stemFactDescription: 'Autumn leaf color shifts occur as tree chlorophyll degrades, revealing vivid yellow/orange carotenoids and newly synthesized anthocyanin pigments that protect leaf cells from solar radiation during sugar resorption.',
    colorScheme: {
      primary: '#f59e0b',
      secondary: '#b45309',
      border: 'border-amber-500/50',
      bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      hexPrimary: 0xf59e0b,
      hexSecondary: 0xb45309,
      fogColor: 0x140b05,
      skylightColor: 0xf59e0b,
    },
  },
  academic: {
    id: 'academic',
    name: 'Scientific Academic Heritage',
    emoji: '⚛️',
    tagline: 'Double helix DNA hologram, titanium fountain of science & cybernetics',
    centerpieceTitle: 'The Helix Fountain of Applied Science',
    centerpieceDescription: 'A futuristic titanium and polished terrazzo monument encircled by a rotating double-stranded DNA hologram emitting laser telemetry.',
    stemFactTitle: 'Molecular Symmetry in Genomic Transcription',
    stemFactDescription: 'The B-form DNA double helix has a helical pitch of 3.4 nanometers with 10.5 base pairs per complete turn, stabilized by vertical pi-stacking interactions and complementary hydrogen bonds.',
    colorScheme: {
      primary: '#06b6d4',
      secondary: '#38bdf8',
      border: 'border-cyan-500/50',
      bgBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      hexPrimary: 0x06b6d4,
      hexSecondary: 0x38bdf8,
      fogColor: 0x060914,
      skylightColor: 0x38bdf8,
    },
  },
};

/**
 * Automatically detects current seasonal holiday from calendar date,
 * defaulting to the current festive season or standard academic.
 */
export function detectDefaultSeasonTheme(): CampusSeasonTheme {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec
  const day = now.getDate();

  if (month === 9 || (month === 8 && day >= 25)) {
    return 'halloween';
  }
  if (month === 10) {
    return 'thanksgiving';
  }
  if (month === 11 || (month === 0 && day <= 7)) {
    return 'christmas';
  }
  if (month === 2 || month === 3) {
    return 'easter';
  }
  return 'halloween'; // Vibrant default for school showcase
}

/**
 * Helper to build a sculpted Jack-o'-Lantern with glowing interior
 */
function buildJackOLantern(size = 0.8, isCenter = false): THREE.Group {
  const group = new THREE.Group();

  // Pumpkin Body (segmented squashed spheres for realistic ribs)
  const pumpkinMat = new THREE.MeshStandardMaterial({
    color: 0xee5d08,
    roughness: 0.35,
    metalness: 0.05,
  });

  const ribCount = 8;
  for (let r = 0; r < ribCount; r++) {
    const angle = (r / ribCount) * Math.PI * 2;
    const ribGeo = new THREE.SphereGeometry(size * 0.95, 12, 12);
    ribGeo.scale(1.0, 0.82, 0.45);
    const rib = new THREE.Mesh(ribGeo, pumpkinMat);
    rib.rotation.y = angle;
    rib.position.y = size * 0.75;
    rib.castShadow = true;
    group.add(rib);
  }

  // Pumpkin Stem (greenish curled cylinder)
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f5820, roughness: 0.8 });
  const stemGeo = new THREE.CylinderGeometry(size * 0.1, size * 0.16, size * 0.4, 8);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = size * 1.5;
  stem.rotation.z = 0.18;
  group.add(stem);

  // Carved glowing eyes & mouth (triangular prisms / boxes with emissive orange-yellow flame)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });

  // Eyes
  const leftEye = new THREE.Mesh(new THREE.ConeGeometry(size * 0.16, size * 0.12, 3), glowMat);
  leftEye.rotation.z = Math.PI;
  leftEye.position.set(-size * 0.32, size * 0.9, size * 0.82);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.ConeGeometry(size * 0.16, size * 0.12, 3), glowMat);
  rightEye.rotation.z = Math.PI;
  rightEye.position.set(size * 0.32, size * 0.9, size * 0.82);
  group.add(rightEye);

  // Jagged smile mouth
  const mouthGeo = new THREE.TorusGeometry(size * 0.38, size * 0.06, 6, 8, Math.PI);
  const mouth = new THREE.Mesh(mouthGeo, glowMat);
  mouth.rotation.x = Math.PI;
  mouth.position.set(0, size * 0.55, size * 0.82);
  group.add(mouth);

  // Interior candle light
  const candleLight = new THREE.PointLight(0xff7700, isCenter ? 3.0 : 1.2, isCenter ? 7.0 : 3.5);
  candleLight.position.set(0, size * 0.75, size * 0.3);
  group.add(candleLight);

  return group;
}

/**
 * Builds the 3D Centerpiece in the center of the school facilities
 */
export function createThemedCenterpiece(theme: CampusSeasonTheme): {
  group: THREE.Group;
  updateAnimation: (time: number, delta: number) => void;
} {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  let updateAnimation = (_time: number, _delta: number) => {};

  if (theme === 'halloween') {
    // === HALLOWEEN: Jack-o'-Lantern Citadel & Bubbling Cauldron ===
    // 1. Gothic Stone Pedestal
    const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 1.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f1924,
      roughness: 0.8,
      metalness: 0.2,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6;
    base.receiveShadow = true;
    root.add(base);

    // Stone rim with runic carvings
    const rimGeo = new THREE.TorusGeometry(2.5, 0.15, 8, 8);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.2;
    root.add(rim);

    // 2. Central Giant Jack-o'-Lantern
    const giantPumpkin = buildJackOLantern(1.3, true);
    giantPumpkin.position.set(0, 1.2, 0);
    root.add(giantPumpkin);

    // 3. Bubbling Witch Cauldron
    const cauldronGeo = new THREE.SphereGeometry(0.85, 16, 16, 0, Math.PI * 2, 0, (Math.PI * 2) / 3);
    const cauldronMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.3 });
    const cauldron = new THREE.Mesh(cauldronGeo, cauldronMat);
    cauldron.rotation.x = Math.PI;
    cauldron.position.set(-1.6, 1.4, 1.2);
    root.add(cauldron);

    // Bubbling Potion surface (fluorescent green)
    const potionGeo = new THREE.CircleGeometry(0.72, 16);
    const potionMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const potion = new THREE.Mesh(potionGeo, potionMat);
    potion.rotation.x = -Math.PI / 2;
    potion.position.set(-1.6, 1.45, 1.2);
    root.add(potion);

    const potionLight = new THREE.PointLight(0x22c55e, 2.0, 5);
    potionLight.position.set(-1.6, 1.8, 1.2);
    root.add(potionLight);

    // Floating bubbles
    const bubbles: THREE.Mesh[] = [];
    for (let b = 0; b < 6; b++) {
      const bubbleGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8);
      const bubbleMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.1, transparent: true, opacity: 0.8 });
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(-1.6 + (Math.random() - 0.5) * 0.8, 1.5 + Math.random() * 0.6, 1.2 + (Math.random() - 0.5) * 0.8);
      root.add(bubble);
      bubbles.push(bubble);
    }

    // 4. Perimeter Smaller Pumpkins around the base
    const pPositions = [
      [1.7, 0, -1.2],
      [-1.8, 0, -1.0],
      [1.4, 0, 1.5],
      [0, 0, -2.0],
    ];
    pPositions.forEach(([px, py, pz], idx) => {
      const smallP = buildJackOLantern(0.45 + (idx % 2) * 0.15, false);
      smallP.position.set(px, py, pz);
      smallP.rotation.y = idx * 1.3;
      root.add(smallP);
    });

    // 5. Orbiting Ghost Apparitions
    const ghostsGroup = new THREE.Group();
    root.add(ghostsGroup);

    const ghostMeshes: THREE.Mesh[] = [];
    for (let g = 0; g < 3; g++) {
      const angle = (g / 3) * Math.PI * 2;
      const ghostGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
      const ghostMat = new THREE.MeshBasicMaterial({
        color: 0xe0e7ff,
        transparent: true,
        opacity: 0.75,
      });
      const ghost = new THREE.Mesh(ghostGeo, ghostMat);
      ghost.rotation.x = Math.PI;
      ghost.position.set(Math.cos(angle) * 2.8, 3.2, Math.sin(angle) * 2.8);

      // Ghost black eyes
      const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.1, 0.2, 0.3);
      ghost.add(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.1, 0.2, 0.3);
      ghost.add(eyeR);

      ghostsGroup.add(ghost);
      ghostMeshes.push(ghost);
    }

    updateAnimation = (time, delta) => {
      ghostsGroup.rotation.y = time * 0.7;
      ghostMeshes.forEach((gm, idx) => {
        gm.position.y = 3.2 + Math.sin(time * 2.5 + idx) * 0.3;
      });
      bubbles.forEach((b, idx) => {
        b.position.y += delta * (0.6 + idx * 0.15);
        if (b.position.y > 2.2) b.position.y = 1.48;
      });
    };
  } else if (theme === 'christmas') {
    // === CHRISTMAS: Grand Evergreen Holiday Tree & Golden Star ===
    // 1. Red & Gold Velvet Tree Skirt Base
    const skirtGeo = new THREE.CylinderGeometry(2.8, 3.2, 0.3, 24);
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = 0.15;
    root.add(skirt);

    // Tree Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 12);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.8;
    root.add(trunk);

    // 2. Tiered Evergreen Pine Cones
    const pineTiers = [
      { radius: 2.3, height: 1.8, y: 1.8 },
      { radius: 1.9, height: 1.6, y: 2.8 },
      { radius: 1.4, height: 1.4, y: 3.8 },
      { radius: 0.9, height: 1.2, y: 4.8 },
      { radius: 0.5, height: 0.9, y: 5.6 },
    ];

    const pineMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.6,
      metalness: 0.1,
    });

    pineTiers.forEach((tier) => {
      const coneGeo = new THREE.ConeGeometry(tier.radius, tier.height, 16);
      const cone = new THREE.Mesh(coneGeo, pineMat);
      cone.position.y = tier.y;
      cone.castShadow = true;
      root.add(cone);
    });

    // 3. Glowing Golden Star of Bethlehem on top
    const starGeo = new THREE.OctahedronGeometry(0.5, 0);
    starGeo.scale(1.0, 1.6, 0.5);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, 6.4, 0);
    root.add(star);

    const starLight = new THREE.PointLight(0xfef08a, 3.5, 10);
    starLight.position.set(0, 6.4, 0);
    root.add(starLight);

    // 4. Multicolored Baubles & Ornaments
    const ornamentColors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xec4899, 0xffffff];
    const ornamentMeshes: THREE.Mesh[] = [];

    for (let o = 0; o < 36; o++) {
      const tIdx = Math.floor(o / 7) % pineTiers.length;
      const tier = pineTiers[tIdx];
      const angle = (o / 6) * Math.PI * 2 + tIdx * 0.5;
      const r = tier.radius * 0.88;
      const y = tier.y - tier.height * 0.35;

      const baubleGeo = new THREE.SphereGeometry(0.12, 10, 10);
      const baubleMat = new THREE.MeshStandardMaterial({
        color: ornamentColors[o % ornamentColors.length],
        roughness: 0.1,
        metalness: 0.8,
      });
      const bauble = new THREE.Mesh(baubleGeo, baubleMat);
      bauble.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      root.add(bauble);
      ornamentMeshes.push(bauble);
    }

    // 5. Clustered Wrapped Gift Boxes around Tree Base
    const giftData = [
      { size: [0.7, 0.6, 0.7], pos: [1.2, 0.45, 1.2], color: 0xdc2626, ribbon: 0xfacc15 },
      { size: [0.6, 0.5, 0.8], pos: [-1.4, 0.4, 0.8], color: 0x2563eb, ribbon: 0xffffff },
      { size: [0.8, 0.7, 0.6], pos: [0.2, 0.5, -1.5], color: 0x16a34a, ribbon: 0xdc2626 },
      { size: [0.5, 0.4, 0.5], pos: [1.6, 0.35, -0.6], color: 0x9333ea, ribbon: 0xfacc15 },
      { size: [0.45, 0.4, 0.45], pos: [-1.2, 0.35, -1.2], color: 0xe11d48, ribbon: 0x22c55e },
    ];

    giftData.forEach((g) => {
      const boxGeo = new THREE.BoxGeometry(g.size[0], g.size[1], g.size[2]);
      const boxMat = new THREE.MeshStandardMaterial({ color: g.color, roughness: 0.3 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(g.pos[0], g.pos[1], g.pos[2]);
      root.add(box);

      // Ribbon cross
      const ribGeo = new THREE.BoxGeometry(g.size[0] * 1.02, g.size[1] * 1.02, g.size[2] * 0.18);
      const ribMat = new THREE.MeshStandardMaterial({ color: g.ribbon, roughness: 0.2 });
      const rib1 = new THREE.Mesh(ribGeo, ribMat);
      rib1.position.set(g.pos[0], g.pos[1], g.pos[2]);
      root.add(rib1);
    });

    updateAnimation = (time) => {
      star.rotation.y = time * 0.8;
      star.rotation.z = Math.sin(time * 1.5) * 0.1;
    };
  } else if (theme === 'easter') {
    // === EASTER: Gilded Faberge Spring Egg & Blossom Monument ===
    // 1. Neoclassical White Marble Fountain Pedestal
    const baseGeo = new THREE.CylinderGeometry(2.2, 2.6, 0.9, 24);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.45;
    root.add(base);

    // Basin rim with gold trim
    const goldRimGeo = new THREE.TorusGeometry(2.3, 0.12, 8, 32);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const goldRim = new THREE.Mesh(goldRimGeo, goldMat);
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 0.9;
    root.add(goldRim);

    // 2. Giant Ornate Faberge Easter Egg
    const eggGeo = new THREE.SphereGeometry(1.3, 24, 24);
    eggGeo.scale(1.0, 1.45, 1.0);
    const eggMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Pastel rose/magenta
      roughness: 0.15,
      metalness: 0.35,
    });
    const egg = new THREE.Mesh(eggGeo, eggMat);
    egg.position.set(0, 2.8, 0);
    root.add(egg);

    // Gold filigree bands around the egg
    for (let b = -1; b <= 1; b++) {
      const bandGeo = new THREE.TorusGeometry(1.28 - Math.abs(b) * 0.2, 0.05, 8, 32);
      const band = new THREE.Mesh(bandGeo, goldMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 2.8 + b * 0.6, 0);
      root.add(band);
    }

    // Levitating Crystal Gem Crown above the egg
    const gemGeo = new THREE.OctahedronGeometry(0.38, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.9,
      roughness: 0.05,
      metalness: 0.1,
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 4.9, 0);
    root.add(gem);

    const eggLight = new THREE.PointLight(0xf472b6, 2.5, 8);
    eggLight.position.set(0, 3.0, 0);
    root.add(eggLight);

    // 3. Flower Bed & Painted Easter Eggs around pedestal
    const eggColors = [0x67e8f9, 0xfde047, 0xa78bfa, 0x86efac, 0xf472b6];
    for (let e = 0; e < 12; e++) {
      const angle = (e / 12) * Math.PI * 2;
      const dist = 1.75;
      const smallEggGeo = new THREE.SphereGeometry(0.22, 12, 12);
      smallEggGeo.scale(1.0, 1.35, 1.0);
      const smallEggMat = new THREE.MeshStandardMaterial({
        color: eggColors[e % eggColors.length],
        roughness: 0.3,
        metalness: 0.2,
      });
      const smallEgg = new THREE.Mesh(smallEggGeo, smallEggMat);
      smallEgg.position.set(Math.cos(angle) * dist, 1.1, Math.sin(angle) * dist);
      smallEgg.rotation.z = Math.cos(angle) * 0.3;
      smallEgg.rotation.x = Math.sin(angle) * 0.3;
      root.add(smallEgg);

      // Spring blossom petals
      const petalGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
      const petalMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle + 0.2) * (dist + 0.3), 1.0, Math.sin(angle + 0.2) * (dist + 0.3));
      root.add(petal);
    }

    // 4. Orbiting Pastel Butterflies
    const butterGroup = new THREE.Group();
    root.add(butterGroup);
    for (let bf = 0; bf < 4; bf++) {
      const angle = (bf / 4) * Math.PI * 2;
      const wingGeo = new THREE.BoxGeometry(0.25, 0.02, 0.2);
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
      const butterfly = new THREE.Mesh(wingGeo, wingMat);
      butterfly.position.set(Math.cos(angle) * 2.2, 3.4 + bf * 0.25, Math.sin(angle) * 2.2);
      butterGroup.add(butterfly);
    }

    updateAnimation = (time) => {
      egg.rotation.y = time * 0.4;
      gem.rotation.y = -time * 0.8;
      gem.position.y = 4.9 + Math.sin(time * 2) * 0.15;
      butterGroup.rotation.y = time * 0.6;
    };
  } else if (theme === 'thanksgiving') {
    // === THANKSGIVING: Golden Horn of Plenty (Cornucopia) ===
    // 1. Rustic Dark Walnut Table
    const tableGeo = new THREE.CylinderGeometry(2.5, 2.8, 0.9, 12);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = 0.45;
    root.add(table);

    // Harvest Platter
    const platterGeo = new THREE.CylinderGeometry(2.2, 2.0, 0.15, 24);
    const platterMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
    const platter = new THREE.Mesh(platterGeo, platterMat);
    platter.position.y = 0.95;
    root.add(platter);

    // 2. Sculpted Woven Wicker Cornucopia (Tapering curved horn)
    const hornGroup = new THREE.Group();
    hornGroup.position.set(0, 1.4, 0);

    const wickerMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const segs = 10;
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const radius = 1.1 * (1 - t * 0.75);
      const ringGeo = new THREE.TorusGeometry(radius, 0.14, 8, 20);
      const ring = new THREE.Mesh(ringGeo, wickerMat);
      const curveX = -Math.pow(t, 1.6) * 1.5;
      const curveY = Math.pow(t, 1.8) * 1.2;
      const curveZ = -t * 0.8;
      ring.position.set(curveX, curveY, curveZ);
      ring.rotation.y = Math.PI / 4 + t * 0.8;
      ring.rotation.z = -t * 0.5;
      hornGroup.add(ring);
    }
    root.add(hornGroup);

    // 3. Overflowing Harvest Fruits, Pumpkins & Maize
    const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });
    const squashMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const appleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 });
    const cornMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });

    // Central pumpkin spilling from horn
    const mainP = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), pumpkinMat);
    mainP.scale.set(1.0, 0.78, 1.0);
    mainP.position.set(0.6, 1.45, 0.4);
    root.add(mainP);

    // Butternut Squash
    const squash = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 0.8, 10), squashMat);
    squash.rotation.z = 0.7;
    squash.position.set(0.9, 1.3, -0.3);
    root.add(squash);

    // Indian Corn Ears
    const corn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 8), cornMat);
    corn.rotation.x = 0.5;
    corn.rotation.y = 0.3;
    corn.position.set(0.2, 1.25, 0.8);
    root.add(corn);

    // Scattered Red Harvest Apples
    const appleCoords = [
      [1.1, 1.15, 0.7],
      [-0.4, 1.15, 0.9],
      [0.9, 1.15, -0.9],
      [-1.2, 1.15, 0.6],
    ];
    appleCoords.forEach(([ax, ay, az]) => {
      const apple = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), appleMat);
      apple.position.set(ax, ay, az);
      root.add(apple);
    });

    // 4. Bundles of Golden Wheat Sheaves
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.7 });
    for (let w = 0; w < 3; w++) {
      const angle = (w / 3) * Math.PI * 2;
      const sheafGeo = new THREE.ConeGeometry(0.3, 1.5, 8);
      const sheaf = new THREE.Mesh(sheafGeo, wheatMat);
      sheaf.position.set(Math.cos(angle) * 1.6, 1.6, Math.sin(angle) * 1.6);
      sheaf.rotation.z = Math.cos(angle) * 0.2;
      root.add(sheaf);
    }

    // Warm Harvest Amber Light
    const harvestLight = new THREE.PointLight(0xf59e0b, 3.0, 9);
    harvestLight.position.set(0.5, 2.5, 0.5);
    root.add(harvestLight);

    updateAnimation = (time) => {
      hornGroup.rotation.y = Math.sin(time * 0.5) * 0.08;
    };
  } else {
    // === ACADEMIC / SCIENCE: Fountain of Science & Double Helix ===
    const pillarGeo = new THREE.CylinderGeometry(1.5, 1.8, 6.8, 24);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0, 3.4, 0);
    root.add(pillar);

    // Glowing rings
    for (let r = 1; r <= 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.06, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, r * 1.8, 0);
      root.add(ring);
    }

    // Floating DNA Helix
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
      const n1 = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
      n1.position.set(x1, y, z1);
      dnaGroup.add(n1);

      const n2 = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
      n2.position.set(x2, y, z2);
      dnaGroup.add(n2);
    }
    root.add(dnaGroup);

    updateAnimation = (time) => {
      dnaGroup.rotation.y = time * 0.6;
    };
  }

  return { group: root, updateAnimation };
}

/**
 * Creates full school facility decorations:
 * Garlands across wing portals, festoon string lights, and holiday planter accents.
 */
export function createThemedSchoolDecorations(
  theme: CampusSeasonTheme,
  wingList: Array<{ pos: number[]; color: number }>
): { group: THREE.Group; updateDecorations?: (time: number) => void } {
  const group = new THREE.Group();

  wingList.forEach((w) => {
    const [wx, wy, wz] = w.pos;
    const doorZ = wz + 6.08;

    if (theme === 'halloween') {
      // 1. Spooky Jack-o'-Lantern lanterns flanking doorway
      const pLeft = buildJackOLantern(0.38, false);
      pLeft.position.set(wx - 2.4, 0, doorZ);
      group.add(pLeft);

      const pRight = buildJackOLantern(0.35, false);
      pRight.position.set(wx + 2.4, 0, doorZ);
      group.add(pRight);

      // 2. Cobweb / Spooky Bunting over doorway
      const webGeo = new THREE.PlaneGeometry(3.6, 0.9);
      const webMat = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const web = new THREE.Mesh(webGeo, webMat);
      web.position.set(wx, 4.6, doorZ);
      group.add(web);

      // Orange & Purple Glowing Sconces
      const sconceGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const sconceMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const sconce = new THREE.Mesh(sconceGeo, sconceMat);
      sconce.position.set(wx, 4.8, doorZ + 0.2);
      group.add(sconce);

      const sconceLight = new THREE.PointLight(0xf97316, 1.5, 6);
      sconceLight.position.set(wx, 4.8, doorZ + 0.3);
      group.add(sconceLight);
    } else if (theme === 'christmas') {
      // 1. Evergreen Pine Garland with Red Bows over wing doorway
      const garlandGeo = new THREE.TorusGeometry(2.0, 0.16, 8, 24, Math.PI);
      const garlandMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.8 });
      const garland = new THREE.Mesh(garlandGeo, garlandMat);
      garland.rotation.z = Math.PI;
      garland.position.set(wx, 4.2, doorZ + 0.1);
      group.add(garland);

      // Red Velvet Wreath on Door Header
      const wreathGeo = new THREE.TorusGeometry(0.6, 0.12, 8, 20);
      const wreathMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.7 });
      const wreath = new THREE.Mesh(wreathGeo, wreathMat);
      wreath.position.set(wx, 4.8, doorZ + 0.15);
      group.add(wreath);

      const bowGeo = new THREE.OctahedronGeometry(0.18, 0);
      const bowMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const bow = new THREE.Mesh(bowGeo, bowMat);
      bow.position.set(wx, 4.3, doorZ + 0.2);
      group.add(bow);

      // 2. Peppermint Candy Canes flanking doorway
      const caneMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const cane1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), caneMat);
      cane1.position.set(wx - 2.2, 0.7, doorZ);
      group.add(cane1);

      const cane2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), caneMat);
      cane2.position.set(wx + 2.2, 0.7, doorZ);
      group.add(cane2);

      // Twinkling Holiday String Light on header
      const light = new THREE.PointLight(0xf87171, 1.5, 6);
      light.position.set(wx, 4.8, doorZ + 0.3);
      group.add(light);
    } else if (theme === 'easter') {
      // 1. Pastel Blossom Garland over doorway
      const garlandGeo = new THREE.TorusGeometry(2.0, 0.12, 8, 24, Math.PI);
      const garlandMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 });
      const garland = new THREE.Mesh(garlandGeo, garlandMat);
      garland.rotation.z = Math.PI;
      garland.position.set(wx, 4.2, doorZ + 0.1);
      group.add(garland);

      // Easter Baskets flanking doorway
      const bLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.35, 10), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
      bLeft.position.set(wx - 2.3, 0.2, doorZ);
      group.add(bLeft);

      const bRight = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.35, 10), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
      bRight.position.set(wx + 2.3, 0.2, doorZ);
      group.add(bRight);

      // Spring glow sconce
      const light = new THREE.PointLight(0xf472b6, 1.4, 6);
      light.position.set(wx, 4.8, doorZ + 0.3);
      group.add(light);
    } else if (theme === 'thanksgiving') {
      // 1. Autumn Leaf Garland over doorway
      const garlandGeo = new THREE.TorusGeometry(2.0, 0.15, 8, 24, Math.PI);
      const garlandMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const garland = new THREE.Mesh(garlandGeo, garlandMat);
      garland.rotation.z = Math.PI;
      garland.position.set(wx, 4.2, doorZ + 0.1);
      group.add(garland);

      // Wheat bundles flanking doorway
      const wheatGeo = new THREE.ConeGeometry(0.25, 1.2, 8);
      const wheatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
      const wL = new THREE.Mesh(wheatGeo, wheatMat);
      wL.position.set(wx - 2.2, 0.6, doorZ);
      group.add(wL);

      const wR = new THREE.Mesh(wheatGeo, wheatMat);
      wR.position.set(wx + 2.2, 0.6, doorZ);
      group.add(wR);

      // Amber harvest lantern
      const lantern = new THREE.PointLight(0xf59e0b, 1.8, 6);
      lantern.position.set(wx, 4.8, doorZ + 0.3);
      group.add(lantern);
    }
  });

  return { group };
}

/**
 * Creates floating ambient atmospheric particle effects
 * (Snowflakes for Christmas, Spooky Embers for Halloween, Petals for Easter, Golden Leaves for Thanksgiving)
 */
export function createThemedAtmosphericParticles(theme: CampusSeasonTheme): {
  group: THREE.Group;
  updateParticles: (delta: number) => void;
} {
  const group = new THREE.Group();
  if (theme === 'academic') {
    return { group, updateParticles: () => {} };
  }

  const count = 150;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = Math.random() * 7.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

    velocities.push({
      x: (Math.random() - 0.5) * 0.2,
      y: -(0.4 + Math.random() * 0.6), // Falling speed
      z: (Math.random() - 0.5) * 0.2,
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  let pColor = 0xffffff;
  let pSize = 0.15;

  if (theme === 'christmas') {
    pColor = 0xffffff; // Crisp white snowflakes
    pSize = 0.18;
  } else if (theme === 'halloween') {
    pColor = 0xf97316; // Eerie orange glowing embers
    pSize = 0.14;
  } else if (theme === 'easter') {
    pColor = 0xfbcfe8; // Soft pastel pink blossom petals
    pSize = 0.16;
  } else if (theme === 'thanksgiving') {
    pColor = 0xf59e0b; // Golden harvest maple leaves
    pSize = 0.18;
  }

  const material = new THREE.PointsMaterial({
    color: pColor,
    size: pSize,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  const particleSystem = new THREE.Points(geometry, material);
  group.add(particleSystem);

  const updateParticles = (delta: number) => {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += velocities[i].y * delta;
      array[i * 3] += velocities[i].x * delta;
      array[i * 3 + 2] += velocities[i].z * delta;

      // Reset when falling below floor
      if (array[i * 3 + 1] < 0.1) {
        array[i * 3 + 1] = 6.8;
        array[i * 3] = (Math.random() - 0.5) * 40;
        array[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    posAttr.needsUpdate = true;
  };

  return { group, updateParticles };
}
