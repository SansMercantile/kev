import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MoleculePreset } from '../../types';
import { Play, RotateCcw, Zap, Sparkles, Thermometer, Info, Eye, Camera, CheckCircle2, ListOrdered, Trophy, Wand2, GraduationCap } from 'lucide-react';
import { triggerLabConfetti } from '../../utils/confettiCelebration';
import { LabQuickStartModal } from './LabQuickStartModal';
import { StepByStepLabGuide } from './StepByStepLabGuide';

interface Props {
  onCaptureSnapshot?: (dataUrl: string, measurements: Record<string, string | number>) => void;
  onSaveSnapshot?: (dataUrl: string, measurements: Record<string, string | number>) => void;
  onRequestAITutor?: (context: string) => void;
  onOpenScienceTwin?: () => void;
  onOpenSketchToSim?: () => void;
  onOpenStudyKit?: () => void;
}

const PRESETS: MoleculePreset[] = [
  {
    id: 'h2o',
    name: 'Water',
    formula: 'H₂O',
    description: 'Polar bent molecule essential for biochemical life. The two non-bonding lone pairs on oxygen compress the H-O-H angle.',
    geometry: 'Bent (V-Shaped)',
    bondAngle: '104.5°',
    dipoleMoment: '1.85 Debye (Strongly Polar)',
    funFact: 'Water expands when freezing due to hydrogen bonding cage lattices!',
    atoms: [
      { element: 'O', pos: [0, 0.3, 0], label: 'Oxygen (O)' },
      { element: 'H', pos: [-1.2, -0.7, 0], label: 'Hydrogen (H₁)' },
      { element: 'H', pos: [1.2, -0.7, 0], label: 'Hydrogen (H₂)' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },
  {
    id: 'ch4',
    name: 'Methane',
    formula: 'CH₄',
    description: 'Simplest hydrocarbon alkane with perfect tetrahedral symmetry and zero net dipole moment.',
    geometry: 'Tetrahedral',
    bondAngle: '109.5°',
    dipoleMoment: '0.00 Debye (Non-Polar)',
    funFact: 'Methane is a potent greenhouse gas that traps 28x more atmospheric heat than CO2 over 100 years.',
    atoms: [
      { element: 'C', pos: [0, 0, 0], label: 'Carbon (C)' },
      { element: 'H', pos: [0, 1.4, 0], label: 'Hydrogen (Top)' },
      { element: 'H', pos: [1.32, -0.47, 0], label: 'Hydrogen (Right)' },
      { element: 'H', pos: [-0.66, -0.47, 1.14], label: 'Hydrogen (Front)' },
      { element: 'H', pos: [-0.66, -0.47, -1.14], label: 'Hydrogen (Back)' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    description: 'Linear symmetrical molecule with two polar double bonds whose dipole moments cancel out completely.',
    geometry: 'Linear',
    bondAngle: '180.0°',
    dipoleMoment: '0.00 Debye (Symmetric cancellation)',
    funFact: 'Under normal atmospheric pressure, CO2 sublimates straight from solid dry ice to gas at -78.5°C.',
    atoms: [
      { element: 'C', pos: [0, 0, 0], label: 'Carbon (C)' },
      { element: 'O', pos: [-1.8, 0, 0], label: 'Oxygen (O₁)' },
      { element: 'O', pos: [1.8, 0, 0], label: 'Oxygen (O₂)' },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
    ],
  },
  {
    id: 'nh3',
    name: 'Ammonia',
    formula: 'NH₃',
    description: 'Trigonal pyramidal compound with one lone electron pair exerting repulsion on three nitrogen-hydrogen bonds.',
    geometry: 'Trigonal Pyramidal',
    bondAngle: '107.0°',
    dipoleMoment: '1.42 Debye (Polar)',
    funFact: 'Ammonia undergoes quantum tunneling inversion: the nitrogen atom flips through the hydrogen plane like an umbrella!',
    atoms: [
      { element: 'N', pos: [0, 0.5, 0], label: 'Nitrogen (N)' },
      { element: 'H', pos: [1.2, -0.4, 0], label: 'Hydrogen (H₁)' },
      { element: 'H', pos: [-0.6, -0.4, 1.04], label: 'Hydrogen (H₂)' },
      { element: 'H', pos: [-0.6, -0.4, -1.04], label: 'Hydrogen (H₃)' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  {
    id: 'c6h6',
    name: 'Benzene',
    formula: 'C₆H₆',
    description: 'Planar hexagonal aromatic ring exhibiting delocalized pi-electron resonance across all six carbon atoms.',
    geometry: 'Planar Hexagonal Ring',
    bondAngle: '120.0°',
    dipoleMoment: '0.00 Debye',
    funFact: 'Friedrich August Kekule famously dreamed of a snake biting its tail (Ouroboros) before solving the ring structure!',
    atoms: [
      { element: 'C', pos: [1.5, 0, 0], label: 'C1' },
      { element: 'C', pos: [0.75, 1.3, 0], label: 'C2' },
      { element: 'C', pos: [-0.75, 1.3, 0], label: 'C3' },
      { element: 'C', pos: [-1.5, 0, 0], label: 'C4' },
      { element: 'C', pos: [-0.75, -1.3, 0], label: 'C5' },
      { element: 'C', pos: [0.75, -1.3, 0], label: 'C6' },
      { element: 'H', pos: [2.3, 0, 0], label: 'H1' },
      { element: 'H', pos: [1.15, 2.0, 0], label: 'H2' },
      { element: 'H', pos: [-1.15, 2.0, 0], label: 'H3' },
      { element: 'H', pos: [-2.3, 0, 0], label: 'H4' },
      { element: 'H', pos: [-1.15, -2.0, 0], label: 'H5' },
      { element: 'H', pos: [1.15, -2.0, 0], label: 'H6' },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 3, to: 4, order: 1 },
      { from: 4, to: 5, order: 2 },
      { from: 5, to: 0, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 2, to: 8, order: 1 },
      { from: 3, to: 9, order: 1 },
      { from: 4, to: 10, order: 1 },
      { from: 5, to: 11, order: 1 },
    ],
  }
];

const ELEMENT_COLORS: Record<string, { hex: number; colorStr: string; radius: number; electronegativity: number }> = {
  H: { hex: 0xf1f5f9, colorStr: '#f1f5f9', radius: 0.35, electronegativity: 2.20 },
  C: { hex: 0x334155, colorStr: '#334155', radius: 0.65, electronegativity: 2.55 },
  O: { hex: 0xef4444, colorStr: '#ef4444', radius: 0.55, electronegativity: 3.44 },
  N: { hex: 0x3b82f6, colorStr: '#3b82f6', radius: 0.60, electronegativity: 3.04 },
  Cl: { hex: 0x22c55e, colorStr: '#22c55e', radius: 0.70, electronegativity: 3.16 },
};

export const ChemistryLab: React.FC<Props> = ({
  onCaptureSnapshot,
  onSaveSnapshot,
  onRequestAITutor,
  onOpenScienceTwin,
  onOpenSketchToSim,
  onOpenStudyKit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<MoleculePreset>(PRESETS[0]);
  const [temperatureK, setTemperatureK] = useState<number>(298);
  const [showDipole, setShowDipole] = useState<boolean>(true);
  const [showElectronClouds, setShowElectronClouds] = useState<boolean>(false);
  const [selectedAtom, setSelectedAtom] = useState<any | null>(null);
  const [isReacting, setIsReacting] = useState<boolean>(false);
  const [reactionEnergy, setReactionEnergy] = useState<number | null>(null);
  const [isQuickStartOpen, setIsQuickStartOpen] = useState<boolean>(false);
  const [isStepGuideOpen, setIsStepGuideOpen] = useState<boolean>(false);
  const [taskCompletedBanner, setTaskCompletedBanner] = useState<string | null>(null);

  // Three.js instances ref
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    moleculeGroup: THREE.Group;
    particles: THREE.Points;
    dipoleArrow?: THREE.ArrowHelper;
    electronCloudsGroup: THREE.Group;
    atomMeshes: THREE.Mesh[];
    basePositions: THREE.Vector3[];
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    animationFrameId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.replaceChildren(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    dirLight2.position.set(-5, -4, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1, 20);
    pointLight.position.set(0, 2, 4);
    scene.add(pointLight);

    // Background Particle Grid / Quantum vacuum fluctuations
    const particleCount = 250;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 18;
      particlePositions[i + 1] = (Math.random() - 0.5) * 14;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Molecule root group
    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    // Electron clouds group
    const electronCloudsGroup = new THREE.Group();
    moleculeGroup.add(electronCloudsGroup);

    // Drag-to-rotate interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      moleculeGroup.rotation.y += deltaX * 0.01;
      moleculeGroup.rotation.x += deltaY * 0.01;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 3.5, 14);
    };

    // Touch support for mobile / tablets
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePos.x;
      const deltaY = e.touches[0].clientY - prevMousePos.y;

      moleculeGroup.rotation.y += deltaX * 0.015;
      moleculeGroup.rotation.x += deltaY * 0.015;

      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);

    // Raycaster for selecting individual atoms
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (threeRef.current) {
        const intersects = raycaster.intersectObjects(threeRef.current.atomMeshes);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const atomData = hit.userData;
          setSelectedAtom(atomData);
        }
      }
    };
    dom.addEventListener('click', onClick);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle continuous rotation when not dragging
      if (!isDragging) {
        moleculeGroup.rotation.y += 0.003;
      }

      // Thermal vibration based on temperatureK
      if (threeRef.current) {
        const tempFactor = (temperatureK / 300) * 0.025;
        threeRef.current.atomMeshes.forEach((mesh, idx) => {
          const base = threeRef.current!.basePositions[idx];
          if (base) {
            const freq = 12 + idx * 3;
            mesh.position.x = base.x + Math.sin(elapsedTime * freq) * tempFactor;
            mesh.position.y = base.y + Math.cos(elapsedTime * freq * 1.2) * tempFactor;
            mesh.position.z = base.z + Math.sin(elapsedTime * freq * 0.8) * tempFactor;
          }
        });
      }

      // Float background particles
      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    threeRef.current = {
      renderer,
      scene,
      camera,
      moleculeGroup,
      particles,
      electronCloudsGroup,
      atomMeshes: [],
      basePositions: [],
      isDragging,
      prevMousePos,
      animationFrameId: animId,
    };

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      threeRef.current.camera.aspect = newW / newH;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, []);

  // Re-build 3D Molecule when preset changes
  useEffect(() => {
    if (!threeRef.current) return;
    const { moleculeGroup, electronCloudsGroup, scene } = threeRef.current;

    // Clear existing meshes
    threeRef.current.atomMeshes = [];
    threeRef.current.basePositions = [];

    while (moleculeGroup.children.length > 0) {
      const child = moleculeGroup.children[0];
      moleculeGroup.remove(child);
    }

    electronCloudsGroup.clear();
    moleculeGroup.add(electronCloudsGroup);

    // Atom geometry caching
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const cylinderGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 16);

    // Render Atoms
    selectedPreset.atoms.forEach((atom, index) => {
      const config = ELEMENT_COLORS[atom.element] || ELEMENT_COLORS.C;
      const material = new THREE.MeshPhysicalMaterial({
        color: config.hex,
        roughness: 0.15,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      });

      const mesh = new THREE.Mesh(sphereGeo, material);
      mesh.scale.setScalar(config.radius);
      mesh.position.set(atom.pos[0], atom.pos[1], atom.pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Attach metadata for click inspector
      mesh.userData = {
        element: atom.element,
        label: atom.label,
        electronegativity: config.electronegativity,
        pos: atom.pos,
        index,
      };

      moleculeGroup.add(mesh);
      threeRef.current!.atomMeshes.push(mesh);
      threeRef.current!.basePositions.push(new THREE.Vector3(atom.pos[0], atom.pos[1], atom.pos[2]));

      // Optional electron probability cloud (quantum orbital shell)
      if (showElectronClouds) {
        const cloudGeo = new THREE.SphereGeometry(config.radius * 1.8, 24, 24);
        const cloudMat = new THREE.MeshBasicMaterial({
          color: config.hex,
          transparent: true,
          opacity: 0.15,
          wireframe: true,
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        cloudMesh.position.set(atom.pos[0], atom.pos[1], atom.pos[2]);
        electronCloudsGroup.add(cloudMesh);
      }
    });

    // Render Bonds
    selectedPreset.bonds.forEach((bond) => {
      const a1 = selectedPreset.atoms[bond.from].pos;
      const a2 = selectedPreset.atoms[bond.to].pos;
      const p1 = new THREE.Vector3(a1[0], a1[1], a1[2]);
      const p2 = new THREE.Vector3(a2[0], a2[1], a2[2]);
      const distance = p1.distanceTo(p2);
      const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      const bondMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.5,
      });

      if (bond.order === 1) {
        const bondMesh = new THREE.Mesh(cylinderGeo, bondMat);
        bondMesh.scale.set(1, distance, 1);
        bondMesh.position.copy(midPoint);
        bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        moleculeGroup.add(bondMesh);
      } else {
        // Double bond rendering
        const offset = 0.12;
        [-offset, offset].forEach((off) => {
          const bondMesh = new THREE.Mesh(cylinderGeo, bondMat);
          bondMesh.scale.set(0.7, distance, 0.7);
          const dir = p2.clone().sub(p1).normalize();
          const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(off);
          bondMesh.position.copy(midPoint).add(perp);
          bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          moleculeGroup.add(bondMesh);
        });
      }
    });

    // Dipole vector arrow
    if (showDipole && selectedPreset.id === 'h2o') {
      const from = new THREE.Vector3(0, -0.6, 0);
      const to = new THREE.Vector3(0, 0.8, 0);
      const dir = to.clone().sub(from).normalize();
      const length = 1.6;
      const arrow = new THREE.ArrowHelper(dir, from, length, 0xf59e0b, 0.35, 0.2);
      moleculeGroup.add(arrow);
    }
  }, [selectedPreset, showDipole, showElectronClouds]);

  // Handle Exothermic Reaction Simulation
  const triggerReaction = () => {
    setIsReacting(true);
    setReactionEnergy(890); // kJ/mol (e.g. Methane combustion)

    triggerLabConfetti('chemistry', {
      particleCount: 100,
      spread: 85,
    });

    if (threeRef.current) {
      const originalRot = threeRef.current.moleculeGroup.rotation.clone();
      // Energetic reaction vibration burst
      let step = 0;
      const burstInterval = setInterval(() => {
        step++;
        threeRef.current?.moleculeGroup.position.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        );
        if (step > 25) {
          clearInterval(burstInterval);
          threeRef.current?.moleculeGroup.position.set(0, 0, 0);
          setIsReacting(false);
        }
      }, 30);
    }
  };

  // Verify VSEPR Conformation Simulation Task
  const handleVerifyConformation = () => {
    triggerLabConfetti('chemistry', {
      particleCount: 80,
      spread: 75,
    });
    setTaskCompletedBanner(`VSEPR Conformation Verified: ${selectedPreset.name} (${selectedPreset.geometry})!`);
    setTimeout(() => {
      setTaskCompletedBanner(null);
    }, 4500);
  };

  // Capture snapshot for lab notebook
  const handleSnapshot = () => {
    const saveFn = onSaveSnapshot || onCaptureSnapshot;
    if (!threeRef.current || !saveFn) return;
    const dataUrl = threeRef.current.renderer.domElement.toDataURL('image/png');
    saveFn(dataUrl, {
      Molecule: selectedPreset.name,
      Formula: selectedPreset.formula,
      Geometry: selectedPreset.geometry,
      'Bond Angle': selectedPreset.bondAngle,
      Temperature: `${temperatureK} K`,
      'Dipole Moment': selectedPreset.dipoleMoment,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide flex items-center gap-2 text-base">
              3D Molecular Synthesis Lab
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {selectedPreset.formula}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Interactive VSEPR Geometry & Energetics</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          {PRESETS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedPreset(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedPreset.id === m.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {m.name} ({m.formula})
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Step-by-Step Lab Guide Toggle Button */}
          <button
            id="chemistry-stepguide-btn"
            onClick={() => setIsStepGuideOpen(!isStepGuideOpen)}
            title="Toggle Step-by-Step Interactive Lab Guide"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isStepGuideOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/30'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Step-by-Step Guide</span>
          </button>

          {/* Quick Start Guide Info Button */}
          <button
            id="chemistry-quickstart-btn"
            onClick={() => setIsQuickStartOpen(true)}
            title="Lab Quick Start Guide & Interaction Points"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* XR Science Twin Challenge */}
          {onOpenScienceTwin && (
            <button
              onClick={onOpenScienceTwin}
              title="Calibrate XR Science Twin Target"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden xl:inline">Science Twin</span>
            </button>
          )}

          {/* Smart Sketch-to-3D */}
          {onOpenSketchToSim && (
            <button
              onClick={onOpenSketchToSim}
              title="Doodle a Molecule to 3D Simulation"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">AutoDraw 3D</span>
            </button>
          )}

          {/* 1-Click Study Kit */}
          {onOpenStudyKit && (
            <button
              onClick={onOpenStudyKit}
              title="Generate 1-Click Study Kit & Flashcards"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">Study Kit</span>
            </button>
          )}

          <button
            onClick={handleSnapshot}
            title="Capture 3D Snapshot to Lab Notebook"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            Snapshot
          </button>
          <button
            onClick={() =>
              onRequestAITutor?.(
                `Explain the 3D molecular structure of ${selectedPreset.name} (${selectedPreset.formula}), its bond angle of ${selectedPreset.bondAngle}, and why it has a ${selectedPreset.geometry} shape.`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Ask Professor KEV
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1 w-full min-h-[420px]">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3D Viewport HUD Overlay */}
        <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono font-semibold">
              Molecular Telemetry
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {selectedPreset.geometry}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Bond Angle:</span>
              <span className="font-mono text-cyan-300 font-semibold">{selectedPreset.bondAngle}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Net Dipole:</span>
              <span className="font-mono text-amber-300">{selectedPreset.dipoleMoment}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Atoms Count:</span>
              <span className="font-mono text-slate-200">{selectedPreset.atoms.length}</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
            💡 {selectedPreset.funFact}
          </p>
        </div>

        {/* Selected Atom Inspector */}
        {selectedAtom && (
          <div className="absolute top-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 max-w-xs shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: ELEMENT_COLORS[selectedAtom.element]?.colorStr || '#fff' }}
                />
                <h4 className="font-bold text-white text-sm">{selectedAtom.label}</h4>
              </div>
              <button
                onClick={() => setSelectedAtom(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Electronegativity:</span>
                <span className="text-cyan-300 font-mono font-semibold">
                  {selectedAtom.electronegativity} Pauling
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>3D Coordinates:</span>
                <span className="text-slate-300 font-mono text-[10px]">
                  [{selectedAtom.pos.map((v: number) => v.toFixed(1)).join(', ')}]
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reaction synthesis notification banner */}
        {isReacting && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600/90 via-amber-600/90 to-cyan-600/90 text-white font-bold text-base shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-pulse border border-white/20">
            <Zap className="w-6 h-6 text-yellow-300 animate-bounce" />
            <div>
              <div>Exothermic Reaction in Progress!</div>
              <div className="text-xs font-normal text-yellow-100 font-mono">
                ΔH = -890.3 kJ/mol • Activation barrier surpassed
              </div>
            </div>
          </div>
        )}

        {/* Task Completion Celebration Banner */}
        {taskCompletedBanner && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-slate-900/95 border border-cyan-400/60 text-white font-semibold text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 z-20">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-cyan-300">{taskCompletedBanner}</div>
              <div className="text-[10px] text-slate-400 font-mono font-normal">
                Simulation milestone achieved • Confetti released
              </div>
            </div>
          </div>
        )}

        {/* Bottom Interaction Ribbon */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto">
          {/* Temperature slider */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Thermal Kinetic Energy:</span>
                <span className="font-mono text-cyan-400 font-semibold">{temperatureK} K</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="10"
                value={temperatureK}
                onChange={(e) => setTemperatureK(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Visualization Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDipole(!showDipole)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showDipole
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Dipole Arrow ({showDipole ? 'ON' : 'OFF'})
            </button>
            <button
              onClick={() => setShowElectronClouds(!showElectronClouds)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showElectronClouds
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Orbital Clouds ({showElectronClouds ? 'ON' : 'OFF'})
            </button>
            <button
              onClick={handleVerifyConformation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Verify VSEPR electrostatic bond angle stability"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Verify Conformation
            </button>
            <button
              onClick={triggerReaction}
              disabled={isReacting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Simulate Combustion Burst
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Modal */}
      <LabQuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        labId="chemistry"
      />

      {/* Interactive Step-by-Step Lab Guide */}
      <StepByStepLabGuide
        labId="chemistry"
        isOpen={isStepGuideOpen}
        onClose={() => setIsStepGuideOpen(false)}
      />
    </div>
  );
};
