import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  User,
  X,
  Sparkles,
  RotateCw,
  Palette,
  Eye,
  Shield,
  Layers,
  Wand2,
  Check,
  Zap,
  Glasses,
  Compass,
  Award,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { AvatarConfig } from '../../types';
import { PHOTOREALISTIC_ASSETS } from '../../assets/images';

interface Props {
  currentAvatar?: AvatarConfig;
  onSave: (avatar: AvatarConfig) => void;
  onClose: () => void;
}

const DEFAULT_AVATAR: AvatarConfig = {
  archetype: 'cyber-scholar',
  visorType: 'holo-visor',
  primaryColor: '#06b6d4',
  glowColor: '#38bdf8',
  glowEffect: 'pulse',
  accessory: 'lead-researcher-badge',
  suitPattern: 'hex-grid',
  name: 'Alex Morgan',
  photoUrl: PHOTOREALISTIC_ASSETS.avatars['cyber-scholar'],
  renderStyle: 'photorealistic',
};

const COLOR_PALETTE = [
  { name: 'Cyan Neon', hex: '#06b6d4', glow: '#38bdf8' },
  { name: 'Emerald Flux', hex: '#10b981', glow: '#34d399' },
  { name: 'Ultraviolet', hex: '#a855f7', glow: '#c084fc' },
  { name: 'Solar Amber', hex: '#f59e0b', glow: '#fbbf24' },
  { name: 'Quantum Indigo', hex: '#6366f1', glow: '#818cf8' },
  { name: 'Crimson Laser', hex: '#f43f5e', glow: '#fb7185' },
];

const ARCHETYPES_META: Record<AvatarConfig['archetype'], {
  label: string;
  field: string;
  desc: string;
  lab: string;
  clearance: string;
}> = {
  'cyber-scholar': {
    label: 'Cyber Scholar',
    field: 'Quantum Physics & Computational Chemistry',
    desc: 'Specialized in VSEPR stereochemistry, covalent bond strain, and quantum computing simulations.',
    lab: 'Chemistry & Molecular Lab 102',
    clearance: 'Level 4 • Lead Researcher',
  },
  'astro-pioneer': {
    label: 'Astro Pioneer',
    field: 'Astrophysics & Keplerian Cosmology',
    desc: 'Expert in N-body relativistic gravity orbits, planetary spectroscopy, and stellar evolution.',
    lab: 'Kepler Observatory Dome 301',
    clearance: 'Level 4 • Flight Investigator',
  },
  'molecular-bio': {
    label: 'Molecular Bio',
    field: 'Cellular Genomics & Mitochondrial Bioenergetics',
    desc: 'Dedicated to CRISPR codon transcription, ATP synthase proton gradients, and eukaryotic cellular pathways.',
    lab: 'Cellular Bio Cleanroom 201',
    clearance: 'Level 4 • Senior Biologist',
  },
  'quantum-physicist': {
    label: 'Quantum Physicist',
    field: 'Wave Optics, Laser Dispersion & Snell Refraction',
    desc: 'Investigating chromatic dispersion Cauchy coefficients, laser prisms, and total internal reflection.',
    lab: 'Laser Optics Cleanroom 202',
    clearance: 'Level 4 • Optical Physicist',
  },
  'nano-tech': {
    label: 'Nano-Technologist',
    field: 'Nanoscale Materials & Carbon Nanotube Engineering',
    desc: 'Architecting molecular lattices, atomic force microscopy surfaces, and metamaterial conductors.',
    lab: 'Nanofabrication Suite 402',
    clearance: 'Level 4 • Nanoscale Specialist',
  },
};

export const AvatarCustomizerModal: React.FC<Props> = ({ currentAvatar, onSave, onClose }) => {
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const base = currentAvatar || DEFAULT_AVATAR;
    if (!base.photoUrl) {
      base.photoUrl = PHOTOREALISTIC_ASSETS.avatars[base.archetype] || PHOTOREALISTIC_ASSETS.avatars['cyber-scholar'];
    }
    return base;
  });

  const [previewTab, setPreviewTab] = useState<'photorealistic' | '3d-spatial'>('photorealistic');
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    avatarGroup: THREE.Group;
    ringsGroup: THREE.Group;
    visorMesh: THREE.Mesh;
    coreLight: THREE.PointLight;
    animId: number;
    isDragging: boolean;
    prevMouseX: number;
  } | null>(null);

  // Initialize 3D Canvas Scene
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const width = canvasContainerRef.current.clientWidth || 360;
    const height = canvasContainerRef.current.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060914);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    canvasContainerRef.current.replaceChildren(renderer.domElement);

    // Studio Illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2.5, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(new THREE.Color(avatar.glowColor), 3.2);
    rimLight.position.set(-2, 2.5, -2);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(new THREE.Color(avatar.glowColor), 2.5, 4);
    coreLight.position.set(0, 0.9, 0.4);
    scene.add(coreLight);

    // Polished Terrazzo Pedestal
    const floorGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.08, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.04;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Holographic floor disc
    const ringGeo = new THREE.RingGeometry(0.85, 0.9, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(avatar.glowColor),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.01;
    scene.add(floorRing);

    // --- Build Photorealistic Articulated 3D Humanoid Avatar ---
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // 1. Legs & Researcher Boots
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.6 });

    [-0.12, 0.12].forEach((xPos) => {
      const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.55, 12);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(xPos, 0.28, 0);
      avatarGroup.add(leg);

      const bootGeo = new THREE.BoxGeometry(0.12, 0.08, 0.22);
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(xPos, 0.04, 0.04);
      avatarGroup.add(boot);
    });

    // 2. Torso - Research Lab Coat with Tailored Lapels
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1,
    });
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.62, 16);
    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.position.y = 0.84;
    avatarGroup.add(torso);

    // Lab Coat Vest / Exosuit Core Underneath
    const vestGeo = new THREE.CylinderGeometry(0.2, 0.17, 0.58, 16);
    const vestMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.primaryColor),
      roughness: 0.3,
      metalness: 0.7,
    });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 0.84, 0.03);
    avatarGroup.add(vest);

    // Chest Biometric Arc Badge / Reactor
    const coreGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(avatar.glowColor) });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.96, 0.23);
    avatarGroup.add(core);

    // Lapels & Collar
    const collarGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 24);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 1.15, 0);
    collar.rotation.x = Math.PI / 2;
    avatarGroup.add(collar);

    // 3. Head & Realistic Facial Features
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdfa17a,
      roughness: 0.6,
      metalness: 0.05,
    });
    const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.34, 0);
    avatarGroup.add(head);

    // Hair / Cap Styling
    const hairGeo = new THREE.SphereGeometry(0.185, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.35, 0);
    avatarGroup.add(hair);

    // 4. Optical Holographic Visor
    const visorGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(avatar.glowColor),
      transmission: 0.85,
      transparent: true,
      opacity: 0.9,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      emissive: new THREE.Color(avatar.glowColor),
      emissiveIntensity: 0.5,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 1.34, 0.04);
    visorMesh.rotation.y = Math.PI / 2;
    avatarGroup.add(visorMesh);

    // 5. Arms & Hands holding Holographic Data Pad
    const armMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const leftArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.48, 12);
    const leftArm = new THREE.Mesh(leftArmGeo, armMat);
    leftArm.position.set(-0.31, 0.82, 0.05);
    leftArm.rotation.z = 0.2;
    leftArm.rotation.x = -0.3;
    avatarGroup.add(leftArm);

    const rightArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.48, 12);
    const rightArm = new THREE.Mesh(rightArmGeo, armMat);
    rightArm.position.set(0.31, 0.82, 0.05);
    rightArm.rotation.z = -0.2;
    rightArm.rotation.x = -0.3;
    avatarGroup.add(rightArm);

    // Handheld Hologram Data Tablet
    const padGeo = new THREE.BoxGeometry(0.24, 0.15, 0.015);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.72, 0.26);
    pad.rotation.x = -0.4;
    avatarGroup.add(pad);

    const padScreenGeo = new THREE.PlaneGeometry(0.22, 0.13);
    const padScreenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(avatar.glowColor), transparent: true, opacity: 0.85 });
    const padScreen = new THREE.Mesh(padScreenGeo, padScreenMat);
    padScreen.position.set(0, 0.725, 0.27);
    padScreen.rotation.x = -0.4;
    avatarGroup.add(padScreen);

    // 6. Floating Orbital Rings
    const ringsGroup = new THREE.Group();
    const haloGeo = new THREE.TorusGeometry(0.48, 0.012, 12, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(avatar.glowColor),
      transparent: true,
      opacity: 0.75,
    });
    const halo1 = new THREE.Mesh(haloGeo, haloMat);
    halo1.rotation.x = Math.PI / 3;
    halo1.rotation.y = Math.PI / 6;
    ringsGroup.add(halo1);
    avatarGroup.add(ringsGroup);

    threeRef.current = {
      renderer,
      scene,
      camera,
      avatarGroup,
      ringsGroup,
      visorMesh,
      coreLight,
      animId: 0,
      isDragging: false,
      prevMouseX: 0,
    };

    // Animation Loop
    let clock = 0;
    const animate = () => {
      clock += 0.02;
      if (ringsGroup) {
        ringsGroup.rotation.y += 0.015;
        ringsGroup.rotation.x = Math.sin(clock * 0.5) * 0.1;
      }
      if (avatarGroup && !threeRef.current?.isDragging) {
        avatarGroup.rotation.y += 0.005;
        avatarGroup.position.y = Math.sin(clock) * 0.02;
      }
      renderer.render(scene, camera);
      threeRef.current!.animId = requestAnimationFrame(animate);
    };
    animate();

    // Mouse Drag Rotation Handling
    const handleMouseDown = (e: MouseEvent) => {
      if (!threeRef.current) return;
      threeRef.current.isDragging = true;
      threeRef.current.prevMouseX = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!threeRef.current || !threeRef.current.isDragging) return;
      const deltaX = e.clientX - threeRef.current.prevMouseX;
      threeRef.current.avatarGroup.rotation.y += deltaX * 0.015;
      threeRef.current.prevMouseX = e.clientX;
    };

    const handleMouseUp = () => {
      if (threeRef.current) threeRef.current.isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
      }
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, []);

  // Update 3D elements dynamically when avatar state changes
  useEffect(() => {
    if (!threeRef.current) return;
    const { coreLight, visorMesh } = threeRef.current;
    if (coreLight) coreLight.color.set(avatar.glowColor);
    if (visorMesh && visorMesh.material) {
      (visorMesh.material as THREE.MeshPhysicalMaterial).color.set(avatar.glowColor);
      (visorMesh.material as THREE.MeshPhysicalMaterial).emissive.set(avatar.glowColor);
    }
  }, [avatar.glowColor]);

  const handleSelectArchetype = (archId: AvatarConfig['archetype']) => {
    const photo = PHOTOREALISTIC_ASSETS.avatars[archId];
    setAvatar((prev) => ({
      ...prev,
      archetype: archId,
      photoUrl: photo,
    }));
  };

  const handleRandomize = () => {
    const archetypes: AvatarConfig['archetype'][] = [
      'cyber-scholar',
      'astro-pioneer',
      'molecular-bio',
      'quantum-physicist',
      'nano-tech',
    ];
    const visors: AvatarConfig['visorType'][] = [
      'holo-visor',
      'dual-xr',
      'neural-optics',
      'classic-goggles',
      'data-hud',
    ];
    const randomArch = archetypes[Math.floor(Math.random() * archetypes.length)];
    const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

    setAvatar({
      archetype: randomArch,
      visorType: visors[Math.floor(Math.random() * visors.length)],
      primaryColor: randomColor.hex,
      glowColor: randomColor.glow,
      glowEffect: 'pulse',
      suitPattern: 'hex-grid',
      accessory: 'lead-researcher-badge',
      name: avatar.name || 'Alex Morgan',
      photoUrl: PHOTOREALISTIC_ASSETS.avatars[randomArch],
      renderStyle: 'photorealistic',
    });
  };

  const handleSaveAndSync = () => {
    const finalAvatar = {
      ...avatar,
      photoUrl: avatar.photoUrl || PHOTOREALISTIC_ASSETS.avatars[avatar.archetype],
      renderStyle: 'photorealistic' as const,
    };
    onSave(finalAvatar);
    onClose();
  };

  const currentMeta = ARCHETYPES_META[avatar.archetype] || ARCHETYPES_META['cyber-scholar'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Photo-Realistic Student Avatar & Persona
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  8K Academic Identity
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Design your spatial 3D avatar & realistic portrait synchronized to campus, labs, and student chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle view tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setPreviewTab('photorealistic')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  previewTab === 'photorealistic'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photo Portrait</span>
              </button>
              <button
                onClick={() => setPreviewTab('3d-spatial')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  previewTab === '3d-spatial'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Spatial Rig</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Interactive Preview Display (Portrait or 3D Rig) */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 flex flex-col items-center justify-between relative border-b md:border-b-0 md:border-r border-slate-800">
            {previewTab === 'photorealistic' ? (
              <div className="w-full flex flex-col items-center justify-center flex-1 space-y-4">
                {/* High-res Photo-realistic Portrait Card */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-400/40 group">
                  <img
                    src={avatar.photoUrl || PHOTOREALISTIC_ASSETS.avatars[avatar.archetype]}
                    alt={avatar.archetype}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle glass HUD overlay on photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  
                  {/* Biometric Status Tag */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    PHOTO-REALISTIC ID
                  </div>

                  {/* Bottom Nameplate */}
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
                      {currentMeta.label}
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {avatar.name || 'Student Researcher'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                      {currentMeta.field}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    High-Fidelity Studio Portrait • Synced across KEV Campus
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center flex-1">
                <div
                  ref={canvasContainerRef}
                  className="w-full h-72 sm:h-80 relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden"
                />

                {/* Drag to rotate hint */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Click and drag to rotate 360°</span>
                </div>
              </div>
            )}

            {/* Quick Generator Button */}
            <button
              onClick={handleRandomize}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold cursor-pointer transition-all shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Randomize Sci-Fi Archetype</span>
            </button>
          </div>

          {/* Right: Customization Controls & Archetypes */}
          <div className="w-full md:w-7/12 p-6 overflow-y-auto space-y-5 bg-slate-950/60">
            {/* Scientific Archetype with Photo Thumbnails */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Select Academic Archetype & Portrait
                </label>
                <span className="text-[10px] font-mono text-cyan-400">5 Distinct Scientific Disciplines</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(ARCHETYPES_META) as AvatarConfig['archetype'][]).map((archKey) => {
                  const meta = ARCHETYPES_META[archKey];
                  const photo = PHOTOREALISTIC_ASSETS.avatars[archKey];
                  const isSelected = avatar.archetype === archKey;

                  return (
                    <div
                      key={archKey}
                      onClick={() => handleSelectArchetype(archKey)}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <img
                        src={photo}
                        alt={meta.label}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-cyan-400/40 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{meta.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-cyan-300 font-mono block truncate">{meta.lab}</span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">{meta.field}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Archetype Dossier Box */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-slate-400">Primary Assignment:</span>
                <span className="text-cyan-300 font-semibold">{currentMeta.clearance}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{currentMeta.desc}</p>
            </div>

            {/* Visor & XR Optics */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Glasses className="w-4 h-4 text-purple-400" />
                Visor & Optical HUD Spec
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'holo-visor', label: 'Holo-Visor (Retinal HUD)' },
                  { id: 'dual-xr', label: 'Dual XR Pass-Through' },
                  { id: 'neural-optics', label: 'Neural Spectrometry' },
                  { id: 'classic-goggles', label: 'Bio-Safety Goggles' },
                  { id: 'data-hud', label: 'Tactical Data HUD' },
                ].map((vis) => (
                  <button
                    key={vis.id}
                    onClick={() => setAvatar((prev) => ({ ...prev, visorType: vis.id as any }))}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      avatar.visorType === vis.id
                        ? 'bg-purple-500/20 border-purple-500 text-purple-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {vis.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Suit Color & Glow */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-400" />
                Lab Coat Trim & Biometric Glow
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setAvatar((prev) => ({ ...prev, primaryColor: c.hex, glowColor: c.glow }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      avatar.primaryColor === c.hex
                        ? 'border-white bg-slate-900 text-white font-semibold shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: c.hex, boxShadow: `0 0 8px ${c.glow}` }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Research Equipment / Accessories */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                Field Research Equipment & Badges
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'lead-researcher-badge', label: 'Lead Researcher Gold Pin' },
                  { id: 'orbital-compass', label: 'Holographic Orbital Compass' },
                  { id: 'molecular-pipette', label: 'Precision Molecular Pipette' },
                  { id: 'stellar-chronometer', label: 'Kepler Stellar Chronometer' },
                  { id: 'hologram-pad', label: 'Quantum Data-Pad' },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setAvatar((prev) => ({ ...prev, accessory: acc.id as any }))}
                    className={`px-3 py-2 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                      avatar.accessory === acc.id
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Photo portrait & 3D avatar synchronized to campus, labs, leaderboards, and study chat
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndSync}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save & Synchronize Identity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
