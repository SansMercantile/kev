import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  CampusSeasonTheme,
  SEASON_THEMES_INFO,
  detectDefaultSeasonTheme,
} from './campusThemedCenterpiece';
import { Sparkles, Calendar, Check, SlidersHorizontal, Eye } from 'lucide-react';
import { campusAudio } from '../../services/campusAudioEngine';

export interface ThematicAssetsResult {
  group: THREE.Group;
  updateAnimation: (t: number, delta: number) => void;
}

/**
 * Procedurally generates 3D thematic assets (pumpkins, ornaments, Easter eggs, harvest items)
 * that are naturally placed along the perimeter of the biophilic planters, facility entrances,
 * and atrium walkway corners.
 */
export function createInjectedThematicAssets(theme: CampusSeasonTheme): ThematicAssetsResult {
  const group = new THREE.Group();
  group.name = 'injected-seasonal-assets';

  const animatedItems: { mesh: THREE.Object3D; baseY: number; phase: number; speed: number; rotSpeed?: number }[] = [];

  // Planter anchor locations in the campus atrium (from campus3dHelpers: [-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8])
  const planterCenters = [
    { x: -8, z: -8 },
    { x: 8, z: -8 },
    { x: -8, z: 8 },
    { x: 8, z: 8 },
  ];

  // Facility walkway threshold anchors (near wing doors)
  const walkwayAnchors = [
    { x: 0, z: -16, rot: 0 },
    { x: 0, z: 16, rot: Math.PI },
    { x: -16, z: 0, rot: Math.PI / 2 },
    { x: 16, z: 0, rot: -Math.PI / 2 },
  ];

  if (theme === 'halloween') {
    // 1. Pumpkins scattered naturally around each planter base
    planterCenters.forEach((pc, pIdx) => {
      // 3 pumpkins of varying sizes and rotations per planter
      const offsets = [
        { dx: -2.2, dz: -0.8, r: 0.45, h: 0.38, color: 0xe65100, rotY: 0.4 },
        { dx: 2.1, dz: 1.1, r: 0.35, h: 0.3, color: 0xf57c00, rotY: 1.8 },
        { dx: -0.6, dz: 2.3, r: 0.52, h: 0.42, color: 0xff9800, rotY: -0.9 },
      ];

      offsets.forEach((po, oIdx) => {
        const pumpkinGroup = new THREE.Group();
        pumpkinGroup.position.set(pc.x + po.dx, po.h * 0.5, pc.z + po.dz);
        pumpkinGroup.rotation.y = po.rotY;

        // Pumpkin ribbed body
        const bodyGeo = new THREE.SphereGeometry(po.r, 14, 10);
        bodyGeo.scale(1.2, 0.9, 1.1);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: po.color,
          roughness: 0.45,
          metalness: 0.05,
        });
        const pumpkinBody = new THREE.Mesh(bodyGeo, bodyMat);
        pumpkinBody.castShadow = true;
        pumpkinGroup.add(pumpkinBody);

        // Green curved stem
        const stemGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.22, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = po.h * 0.52;
        stem.rotation.z = 0.25;
        pumpkinGroup.add(stem);

        // If it's the largest pumpkin, make it a carved mini Jack-o'-lantern with inner light!
        if (po.r > 0.48) {
          const eyeGeo = new THREE.ConeGeometry(0.06, 0.06, 3);
          const glowMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
          const leftEye = new THREE.Mesh(eyeGeo, glowMat);
          leftEye.position.set(-0.12, 0.08, po.r * 1.05);
          leftEye.rotation.x = Math.PI / 2;
          pumpkinGroup.add(leftEye);

          const rightEye = new THREE.Mesh(eyeGeo, glowMat);
          rightEye.position.set(0.12, 0.08, po.r * 1.05);
          rightEye.rotation.x = Math.PI / 2;
          pumpkinGroup.add(rightEye);

          const innerLight = new THREE.PointLight(0xff7700, 0.6, 3);
          innerLight.position.set(0, 0.1, po.r * 0.8);
          pumpkinGroup.add(innerLight);
        }

        group.add(pumpkinGroup);
      });
    });

    // 2. Floating will-o'-the-wisps bobbing near planter trees
    planterCenters.forEach((pc, idx) => {
      const wispGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const wispMat = new THREE.MeshBasicMaterial({
        color: 0x76ff03,
        transparent: true,
        opacity: 0.75,
      });
      const wisp = new THREE.Mesh(wispGeo, wispMat);
      wisp.position.set(pc.x + (idx % 2 === 0 ? 1.2 : -1.2), 2.2, pc.z + (idx > 1 ? 1.2 : -1.2));
      group.add(wisp);

      animatedItems.push({
        mesh: wisp,
        baseY: 2.2,
        phase: idx * 1.5,
        speed: 1.8,
        rotSpeed: 1.2,
      });
    });

  } else if (theme === 'christmas') {
    // 1. Mirrored baubles & ornaments hanging and nestled on planters
    const baubleColors = [0xef4444, 0x10b981, 0xf59e0b, 0x3b82f6, 0xe0e7ff];
    planterCenters.forEach((pc, pIdx) => {
      // Baubles hung from planter trees
      for (let b = 0; b < 4; b++) {
        const angle = (b / 4) * Math.PI * 2 + pIdx;
        const dist = 1.3;
        const bGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const bMat = new THREE.MeshStandardMaterial({
          color: baubleColors[(pIdx + b) % baubleColors.length],
          roughness: 0.15,
          metalness: 0.85,
        });
        const bauble = new THREE.Mesh(bGeo, bMat);
        bauble.position.set(pc.x + Math.cos(angle) * dist, 1.8 + (b % 2) * 0.4, pc.z + Math.sin(angle) * dist);
        group.add(bauble);

        animatedItems.push({
          mesh: bauble,
          baseY: bauble.position.y,
          phase: b + pIdx,
          speed: 1.2,
        });
      }

      // Wrapped Gift Boxes clustered at planter base
      const giftOffsets = [
        { dx: 1.8, dz: -1.2, size: [0.45, 0.45, 0.45], col: 0xef4444, ribCol: 0xf59e0b },
        { dx: -1.9, dz: 1.4, size: [0.38, 0.38, 0.38], col: 0x10b981, ribCol: 0xffffff },
        { dx: 1.5, dz: 1.6, size: [0.32, 0.5, 0.32], col: 0x3b82f6, ribCol: 0xfacc15 },
      ];

      giftOffsets.forEach((go) => {
        const giftGroup = new THREE.Group();
        giftGroup.position.set(pc.x + go.dx, go.size[1] / 2, pc.z + go.dz);
        giftGroup.rotation.y = Math.random() * Math.PI;

        const boxGeo = new THREE.BoxGeometry(go.size[0], go.size[1], go.size[2]);
        const boxMat = new THREE.MeshStandardMaterial({ color: go.col, roughness: 0.4 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        giftGroup.add(box);

        // Ribbon
        const ribGeo = new THREE.BoxGeometry(go.size[0] * 1.02, go.size[1] * 1.02, go.size[2] * 0.18);
        const ribMat = new THREE.MeshStandardMaterial({ color: go.ribCol, roughness: 0.3 });
        const rib = new THREE.Mesh(ribGeo, ribMat);
        giftGroup.add(rib);

        group.add(giftGroup);
      });
    });

    // 2. Festive Candy Canes flanking walkway thresholds
    walkwayAnchors.forEach((wa) => {
      [-1.8, 1.8].forEach((offset) => {
        const caneGroup = new THREE.Group();
        caneGroup.position.set(
          wa.rot === 0 ? wa.x + offset : wa.x,
          0,
          wa.rot === 0 ? wa.z : wa.z + offset
        );

        // Striped pole
        const caneGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 10);
        const caneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const cane = new THREE.Mesh(caneGeo, caneMat);
        cane.position.y = 0.6;
        caneGroup.add(cane);

        // Candy cane crook (torus)
        const crookGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
        const crookMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        const crook = new THREE.Mesh(crookGeo, crookMat);
        crook.position.set(0.18, 1.2, 0);
        crook.rotation.z = Math.PI / 2;
        caneGroup.add(crook);

        group.add(caneGroup);
      });
    });

  } else if (theme === 'easter') {
    // 1. Decorated Easter Eggs nestled in planter beds
    const eggColors = [0xf472b6, 0x38bdf8, 0xa78bfa, 0xfacc15, 0x4ade80];
    planterCenters.forEach((pc, pIdx) => {
      for (let e = 0; e < 5; e++) {
        const angle = (e / 5) * Math.PI * 2 + pIdx * 0.5;
        const radius = 1.6 + (e % 2) * 0.5;

        const eggGeo = new THREE.SphereGeometry(0.18, 14, 14);
        eggGeo.scale(0.85, 1.25, 0.85);

        const eggMat = new THREE.MeshStandardMaterial({
          color: eggColors[(pIdx + e) % eggColors.length],
          roughness: 0.25,
          metalness: 0.1,
        });
        const egg = new THREE.Mesh(eggGeo, eggMat);
        egg.position.set(
          pc.x + Math.cos(angle) * radius,
          0.22,
          pc.z + Math.sin(angle) * radius
        );
        egg.rotation.z = (Math.random() - 0.5) * 0.4;
        egg.rotation.y = angle;
        group.add(egg);
      }
    });

    // 2. Pastel Fluttering Butterflies orbiting planter plants
    planterCenters.forEach((pc, pIdx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(pc.x, 2.4, pc.z);

      const wingGeo = new THREE.PlaneGeometry(0.16, 0.16);
      const wingMat = new THREE.MeshBasicMaterial({
        color: eggColors[pIdx % eggColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.x = -0.08;
      leftWing.rotation.y = 0.3;
      bGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.x = 0.08;
      rightWing.rotation.y = -0.3;
      bGroup.add(rightWing);

      group.add(bGroup);

      animatedItems.push({
        mesh: bGroup,
        baseY: 2.4,
        phase: pIdx * 2,
        speed: 2.5,
        rotSpeed: 0.8,
      });
    });

  } else if (theme === 'thanksgiving') {
    // 1. Autumn Pumpkins & Harvest Squash around planters
    planterCenters.forEach((pc, pIdx) => {
      const gourds = [
        { dx: -1.8, dz: -0.9, scale: [0.35, 0.45, 0.35], color: 0xd97706 }, // squash
        { dx: 1.9, dz: 1.2, scale: [0.4, 0.32, 0.4], color: 0xb45309 },   // round pumpkin
        { dx: -0.8, dz: 2.1, scale: [0.28, 0.4, 0.28], color: 0xf59e0b },  // golden gourd
      ];

      gourds.forEach((g) => {
        const gourdGeo = new THREE.SphereGeometry(1, 10, 10);
        gourdGeo.scale(g.scale[0], g.scale[1], g.scale[2]);
        const gourdMat = new THREE.MeshStandardMaterial({ color: g.color, roughness: 0.5 });
        const gourdMesh = new THREE.Mesh(gourdGeo, gourdMat);
        gourdMesh.position.set(pc.x + g.dx, g.scale[1], pc.z + g.dz);
        group.add(gourdMesh);
      });
    });

    // 2. Sheaves of Golden Wheat bundles flanking walkway entrances
    walkwayAnchors.forEach((wa) => {
      [-1.8, 1.8].forEach((offset) => {
        const wheatGroup = new THREE.Group();
        wheatGroup.position.set(
          wa.rot === 0 ? wa.x + offset : wa.x,
          0,
          wa.rot === 0 ? wa.z : wa.z + offset
        );

        const sheafGeo = new THREE.CylinderGeometry(0.12, 0.08, 1.1, 8);
        const sheafMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
        const sheaf = new THREE.Mesh(sheafGeo, sheafMat);
        sheaf.position.y = 0.55;
        wheatGroup.add(sheaf);

        // Ribbon tie
        const tieGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 12);
        const tieMat = new THREE.MeshStandardMaterial({ color: 0x991b1b });
        const tie = new THREE.Mesh(tieGeo, tieMat);
        tie.position.y = 0.55;
        tie.rotation.x = Math.PI / 2;
        wheatGroup.add(tie);

        group.add(wheatGroup);
      });
    });
  } else {
    // Default / Academic Science Theme: Holographic research data crystals
    planterCenters.forEach((pc, pIdx) => {
      const octaGeo = new THREE.OctahedronGeometry(0.25);
      const octaMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8,
      });
      const crystal = new THREE.Mesh(octaGeo, octaMat);
      crystal.position.set(pc.x, 2.2, pc.z);
      group.add(crystal);

      animatedItems.push({
        mesh: crystal,
        baseY: 2.2,
        phase: pIdx,
        speed: 1.5,
        rotSpeed: 1.0,
      });
    });
  }

  const updateAnimation = (t: number, delta: number) => {
    animatedItems.forEach((item) => {
      item.mesh.position.y = item.baseY + Math.sin(t * item.speed + item.phase) * 0.12;
      if (item.rotSpeed) {
        item.mesh.rotation.y += delta * item.rotSpeed;
      }
    });
  };

  return { group, updateAnimation };
}

interface SeasonalThemeManagerProps {
  currentTheme: CampusSeasonTheme;
  onThemeChange: (theme: CampusSeasonTheme) => void;
  onOpenThemeModal?: () => void;
  compact?: boolean;
}

/**
 * SeasonalThemeManager React Component
 * Manages calendar date detection, user holiday overrides, audio atmosphere synchronization,
 * and displays active thematic metadata and quick switches.
 */
export const SeasonalThemeManager: React.FC<SeasonalThemeManagerProps> = ({
  currentTheme,
  onThemeChange,
  onOpenThemeModal,
  compact = false,
}) => {
  const activeInfo = SEASON_THEMES_INFO[currentTheme];
  const [autoDetected, setAutoDetected] = useState<CampusSeasonTheme>('academic');

  useEffect(() => {
    const detected = detectDefaultSeasonTheme();
    setAutoDetected(detected);
  }, []);

  // Update audio engine season theme when currentTheme changes
  useEffect(() => {
    campusAudio.setSeasonTheme(currentTheme);
  }, [currentTheme]);

  const handleApplyAutoDetect = () => {
    onThemeChange(autoDetected);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1 backdrop-blur-md shadow-sm">
        <span className="text-base">{activeInfo.emoji}</span>
        <span className="text-xs font-bold text-white hidden sm:inline truncate max-w-[120px]">
          {activeInfo.name.split(' ')[0]}
        </span>
        <button
          onClick={onOpenThemeModal}
          className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all font-mono font-medium ml-1 cursor-pointer"
        >
          Theme
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 shadow-lg backdrop-blur-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl p-1 rounded-lg bg-slate-800 border border-slate-700">
            {activeInfo.emoji}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white">{activeInfo.name}</h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                Date-Aware
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Thematic 3D assets & atmospheric soundscapes injected
            </p>
          </div>
        </div>
        {onOpenThemeModal && (
          <button
            onClick={onOpenThemeModal}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
          >
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            <span>Customize</span>
          </button>
        )}
      </div>

      {/* Auto-detect info pill */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>Calendar detected: <strong className="text-slate-300">{SEASON_THEMES_INFO[autoDetected].name}</strong></span>
        </div>
        {currentTheme !== autoDetected && (
          <button
            onClick={handleApplyAutoDetect}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            Sync to Date
          </button>
        )}
      </div>
    </div>
  );
};
