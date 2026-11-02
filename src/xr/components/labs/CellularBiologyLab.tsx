import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Organelle } from '../../types';
import { Dna, Sparkles, Layers, Eye, Zap, Camera, Search, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onCaptureSnapshot?: (dataUrl: string, measurements: Record<string, string | number>) => void;
  onRequestAITutor?: (context: string) => void;
}

const ORGANELLES: Organelle[] = [
  {
    id: 'nucleus',
    name: 'Cell Nucleus & Chromatin',
    tagline: 'The Master Genetic Repository',
    function: 'Encloses 3.2 billion base pairs of genomic DNA in humans, coordinating replication and transcription.',
    sizeNanometers: '5,000–10,000 nm',
    color: '#818cf8',
    pos: [0, 0, 0],
    scale: [1.3, 1.3, 1.3],
    atpImpact: 'Consumes ATP for nuclear pore transport and helicase unwinding.',
    details: [
      'Surrounded by a double-layered nuclear envelope with 2,000–4,000 nuclear pore complexes.',
      'Houses the nucleolus for ribosome subunit assembly.',
      'Chromatin dynamic packing regulates gene expression and epigenetic histone modifications.',
    ],
  },
  {
    id: 'mitochondria-1',
    name: 'Mitochondrion (ATP Synthase)',
    tagline: 'The Cellular Powerhouse',
    function: 'Generates >90% of cellular ATP via the electron transport chain across inner membrane cristae.',
    sizeNanometers: '500–1,000 nm',
    color: '#f59e0b',
    pos: [1.8, 0.6, 0.4],
    scale: [0.7, 0.4, 0.4],
    atpImpact: 'Yields ~30 to 32 ATP molecules per glucose molecule metabolized.',
    details: [
      'Contains its own circular mtDNA (maternally inherited) and 70S ribosomes.',
      'Inner membrane folds (cristae) multiply surface area for ATP synthase rotary turbines.',
      'Maintains a proton gradient (ΔΨm ~ 180 mV) essential for oxidative phosphorylation.',
    ],
  },
  {
    id: 'mitochondria-2',
    name: 'Secondary Mitochondrion',
    tagline: 'Metabolic Energy Hub',
    function: 'Facilitates fatty acid beta-oxidation, calcium buffering, and programmed cell apoptosis.',
    sizeNanometers: '500–1,000 nm',
    color: '#f59e0b',
    pos: [-1.6, -0.8, -0.3],
    scale: [0.65, 0.38, 0.38],
    atpImpact: 'Synchronized with primary mitochondrion to maintain energy homeostasis.',
    details: [
      'Constantly undergoes mitochondrial fission and fusion to repair oxidative damage.',
      'Essential for Krebs citric acid cycle enzyme containment.',
    ],
  },
  {
    id: 'golgi',
    name: 'Golgi Apparatus',
    tagline: 'Molecular Packaging & Dispatch',
    function: 'Sorts, chemically glycosylates, and packages proteins into membrane vesicles for secretion.',
    sizeNanometers: '1,000–3,000 nm',
    color: '#34d399',
    pos: [0.2, -1.5, 0.5],
    scale: [1.1, 0.35, 0.7],
    atpImpact: 'Consumes ATP and GTP for COP-I and COP-II vesicular budding.',
    details: [
      'Polarized organelle: receives cargo at cis-Golgi face, discharges at trans-Golgi network.',
      'Attaches complex oligosaccharide branches targeting proteins to lysosomes or plasma membrane.',
    ],
  },
  {
    id: 'er',
    name: 'Endoplasmic Reticulum (ER)',
    tagline: 'Biosynthetic Manufacturing Network',
    function: 'Rough ER studded with ribosomes synthesizes membrane proteins; Smooth ER synthesizes lipids.',
    sizeNanometers: 'Continuous membrane network',
    color: '#ec4899',
    pos: [-1.4, 1.2, -0.4],
    scale: [0.9, 0.6, 0.6],
    atpImpact: 'Requires ATP-dependent chaperones (like BiP) to ensure correct protein folding.',
    details: [
      'Smooth ER serves as the intracellular calcium reservoir for muscle contraction and signal transduction.',
      'Performs hepatic drug detoxification via cytochrome P450 enzymes.',
    ],
  },
];

export const CellularBiologyLab: React.FC<Props> = ({ onCaptureSnapshot, onRequestAITutor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'cell' | 'dna'>('cell');
  const [selectedOrganelle, setSelectedOrganelle] = useState<Organelle>(ORGANELLES[0]);
  const [xrayMode, setXrayMode] = useState<boolean>(false);

  // Smart Lab Sketch-to-Simulation: a sketched cell cross-section dispatches
  // 'kev:lab-load'; open the 3D cell view (and x-ray if the sketch asked).
  useEffect(() => {
    const onLabLoad = (event: Event) => {
      const detail = ((event as CustomEvent).detail || {}) as {
        lab?: string; action?: string; xray?: boolean;
      };
      if (detail.lab !== 'biology' || detail.action !== 'cell-view') return;
      setActiveTab('cell');
      if (detail.xray) setXrayMode(true);
    };
    window.addEventListener('kev:lab-load', onLabLoad);
    return () => window.removeEventListener('kev:lab-load', onLabLoad);
  }, []);
  const [atpPulsing, setAtpPulsing] = useState<boolean>(true);

  // DNA transcription demo state
  const [dnaTemplate, setDnaTemplate] = useState<string>('TAC-GGC-TTA-CTA-ACT');
  const [mrnaTranscript, setMrnaTranscript] = useState<string>('');
  const [transcribedCodons, setTranscribedCodons] = useState<string[]>([]);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cellGroup: THREE.Group;
    dnaGroup: THREE.Group;
    organelleMeshes: Map<string, THREE.Mesh>;
    membraneMesh: THREE.Mesh;
    dnaBaseMeshes: THREE.Mesh[];
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b19);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Match the studio baseline (atlas/vehicle/subjects/classroom): sRGB output
    // + ACES filmic tone mapping so colors and highlights grade like the rest
    // of the school instead of the default linear/fixed pipeline.
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.replaceChildren(renderer.domElement);

    // Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.4);
    rimLight.position.set(-5, -5, -4);
    scene.add(rimLight);

    // Root groups
    const cellGroup = new THREE.Group();
    const dnaGroup = new THREE.Group();
    scene.add(cellGroup);
    scene.add(dnaGroup);
    dnaGroup.visible = false;

    // --- CELL BUILD ---
    // Outer semi-transparent plasma membrane
    const membraneGeo = new THREE.SphereGeometry(2.8, 48, 48);
    const membraneMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
      wireframe: false,
    });
    const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
    cellGroup.add(membraneMesh);

    // Cytoplasm fluid particles
    const cytoCount = 300;
    const cytoGeo = new THREE.BufferGeometry();
    const cytoPos = new Float32Array(cytoCount * 3);
    for (let i = 0; i < cytoCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 2.5;
      const sinPhi = Math.sin(phi);
      cytoPos[i] = r * sinPhi * Math.cos(theta);
      cytoPos[i + 1] = r * sinPhi * Math.sin(theta);
      cytoPos[i + 2] = r * Math.cos(phi);
    }
    cytoGeo.setAttribute('position', new THREE.BufferAttribute(cytoPos, 3));
    const cytoMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
    });
    const cytoPoints = new THREE.Points(cytoGeo, cytoMat);
    cellGroup.add(cytoPoints);

    // Organelles build
    const organelleMeshes = new Map<string, THREE.Mesh>();
    ORGANELLES.forEach((org) => {
      let geo: THREE.BufferGeometry;
      if (org.id === 'nucleus') {
        geo = new THREE.SphereGeometry(1, 32, 32);
      } else if (org.id.includes('mitochondria')) {
        geo = new THREE.CapsuleGeometry(0.5, 0.8, 16, 24);
      } else {
        geo = new THREE.TorusGeometry(0.8, 0.25, 16, 32);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(org.color),
        roughness: 0.25,
        metalness: 0.2,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...org.pos);
      mesh.scale.set(...org.scale);
      mesh.userData = { id: org.id, name: org.name };
      cellGroup.add(mesh);
      organelleMeshes.set(org.id, mesh);

      // Nucleus inner chromatin core
      if (org.id === 'nucleus') {
        const coreGeo = new THREE.DodecahedronGeometry(0.65, 2);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x4338ca,
          roughness: 0.4,
          wireframe: true,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        mesh.add(coreMesh);
      }
    });

    // --- DNA DOUBLE HELIX BUILD ---
    const dnaBaseMeshes: THREE.Mesh[] = [];
    const basePairsCount = 36;
    const helixRadius = 1.2;
    const helixHeight = 6.0;

    const baseColors = [0x22c55e, 0xef4444, 0x3b82f6, 0xeab308]; // A (green), T (red), C (blue), G (yellow)
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const strandCylGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 12);

    for (let i = 0; i < basePairsCount; i++) {
      const t = (i / basePairsCount) * Math.PI * 4;
      const y = (i / basePairsCount) * helixHeight - helixHeight / 2;

      // Backbone Strand 1
      const x1 = Math.cos(t) * helixRadius;
      const z1 = Math.sin(t) * helixRadius;

      // Backbone Strand 2 (180 deg offset)
      const x2 = Math.cos(t + Math.PI) * helixRadius;
      const z2 = Math.sin(t + Math.PI) * helixRadius;

      const p1 = new THREE.Vector3(x1, y, z1);
      const p2 = new THREE.Vector3(x2, y, z2);

      // Spheres on backbone
      const m1 = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
      );
      m1.position.copy(p1);
      dnaGroup.add(m1);

      const m2 = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
      );
      m2.position.copy(p2);
      dnaGroup.add(m2);

      // Connecting base pair cylinder
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      const colIdx = (i % 2 === 0 ? 0 : 2); // alternating A-T or C-G
      const baseMat = new THREE.MeshStandardMaterial({
        color: baseColors[colIdx],
        roughness: 0.2,
      });
      const bondMesh = new THREE.Mesh(strandCylGeo, baseMat);
      bondMesh.scale.set(1, dist, 1);
      bondMesh.position.copy(mid);
      bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      dnaGroup.add(bondMesh);
      dnaBaseMeshes.push(bondMesh);
    }

    // Interaction controls (drag to rotate)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;

      if (activeTab === 'cell') {
        cellGroup.rotation.y += dx * 0.01;
        cellGroup.rotation.x += dy * 0.01;
      } else {
        dnaGroup.rotation.y += dx * 0.01;
        dnaGroup.rotation.x += dy * 0.01;
      }

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 3.5, 12);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMousePos.x;
      const dy = e.touches[0].clientY - prevMousePos.y;
      if (activeTab === 'cell') {
        cellGroup.rotation.y += dx * 0.015;
        cellGroup.rotation.x += dy * 0.015;
      } else {
        dnaGroup.rotation.y += dx * 0.015;
        dnaGroup.rotation.x += dy * 0.015;
      }
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDragging = false;
    };
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        cellGroup.rotation.y += 0.004;
        dnaGroup.rotation.y += 0.01;
      }

      // ATP pulse animation on Mitochondria
      const mito1 = organelleMeshes.get('mitochondria-1');
      if (mito1 && atpPulsing) {
        const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
        mito1.scale.set(0.7 * pulse, 0.4 * pulse, 0.4 * pulse);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    threeRef.current = {
      renderer,
      scene,
      camera,
      cellGroup,
      dnaGroup,
      organelleMeshes,
      membraneMesh,
      dnaBaseMeshes,
      isDragging,
      prevMousePos,
      animId,
    };

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
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
      renderer.dispose();
    };
  }, []);

  // Switch between Cell view and DNA view
  useEffect(() => {
    if (!threeRef.current) return;
    if (activeTab === 'cell') {
      threeRef.current.cellGroup.visible = true;
      threeRef.current.dnaGroup.visible = false;
      threeRef.current.camera.position.set(0, 0, 7.5);
    } else {
      threeRef.current.cellGroup.visible = false;
      threeRef.current.dnaGroup.visible = true;
      threeRef.current.camera.position.set(0, 0, 5.5);
    }
  }, [activeTab]);

  // X-Ray Mode toggle
  useEffect(() => {
    if (!threeRef.current) return;
    const mat = threeRef.current.membraneMesh.material as THREE.MeshPhysicalMaterial;
    if (xrayMode) {
      mat.wireframe = true;
      mat.opacity = 0.35;
    } else {
      mat.wireframe = false;
      mat.opacity = 0.22;
    }
  }, [xrayMode]);

  // DNA Transcription Simulator
  const runTranscription = () => {
    // A -> U, T -> A, C -> G, G -> C
    const map: Record<string, string> = { A: 'U', T: 'A', C: 'G', G: 'C', '-': '-' };
    const transcript = dnaTemplate
      .split('')
      .map((c) => map[c] || c)
      .join('');
    setMrnaTranscript(transcript);

    const codons = transcript.split('-');
    setTranscribedCodons(codons);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#34d399', '#38bdf8', '#a855f7'],
    });
  };

  // Capture snapshot
  const handleSnapshot = () => {
    if (!threeRef.current || !onCaptureSnapshot) return;
    const dataUrl = threeRef.current.renderer.domElement.toDataURL('image/png');
    onCaptureSnapshot(dataUrl, {
      Lab: 'Cellular Biology & Genomics',
      Mode: activeTab.toUpperCase(),
      Target: activeTab === 'cell' ? selectedOrganelle.name : 'DNA Double Helix',
      Dimensions: activeTab === 'cell' ? selectedOrganelle.sizeNanometers : '2.0 nm diameter',
      'ATP Status': atpPulsing ? 'Active Phosphorylation' : 'Dormant',
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base">
              Cellular Anatomy & Genomics XR
            </h3>
            <p className="text-xs text-slate-400">3D Organelle Dissection & DNA Transcription</p>
          </div>
        </div>

        {/* View Mode Toggle: Cell vs DNA */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            data-guide="bio-cell-tab"
            onClick={() => setActiveTab('cell')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'cell'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3D Eukaryotic Cell
          </button>
          <button
            data-guide="bio-dna-tab"
            onClick={() => setActiveTab('dna')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'dna'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            DNA Double Helix
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'cell' && (
            <button
              data-guide="bio-xray"
              onClick={() => setXrayMode(!xrayMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                xrayMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              X-Ray Mode ({xrayMode ? 'ON' : 'OFF'})
            </button>
          )}
          <button
            data-guide="bio-capture"
            onClick={handleSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            Snapshot
          </button>
          <button
            onClick={() =>
              onRequestAITutor?.(
                activeTab === 'cell'
                  ? `Explain the function of the ${selectedOrganelle.name} in eukaryotic cells, including its role in energy production, protein synthesis, and cellular homeostasis.`
                  : `Explain how the DNA double helix structure enables reliable replication and mRNA transcription, including complementary base pairing rules.`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Ask Professor KEV
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative flex-1 w-full min-h-[420px]">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Organelle Inspector Overlay */}
        {activeTab === 'cell' && (
          <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 max-w-sm pointer-events-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedOrganelle.color }} />
              <h4 className="font-bold text-white text-sm">{selectedOrganelle.name}</h4>
            </div>
            <p className="text-xs text-emerald-400 font-medium mb-2">{selectedOrganelle.tagline}</p>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">{selectedOrganelle.function}</p>

            <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Scale / Dimensions:</span>
                <span className="font-mono text-cyan-300">{selectedOrganelle.sizeNanometers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ATP Dynamics:</span>
                <span className="font-mono text-amber-300 text-[11px] truncate max-w-[200px]" title={selectedOrganelle.atpImpact}>
                  {selectedOrganelle.atpImpact}
                </span>
              </div>
            </div>

            {/* Organelle selector chips */}
            <div data-guide="bio-organelle" className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
              {ORGANELLES.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrganelle(org)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    selectedOrganelle.id === org.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white'
                  }`}
                >
                  {org.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DNA Transcription Sandbox Overlay */}
        {activeTab === 'dna' && (
          <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 max-w-sm pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider">
                Genomic Transcription
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                RNA Polymerase
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Template DNA Strand (3&apos; &rarr; 5&apos;):</span>
                <div className="font-mono p-2 rounded bg-slate-950 text-cyan-300 tracking-wider font-semibold mt-1">
                  {dnaTemplate}
                </div>
              </div>

              {mrnaTranscript && (
                <div>
                  <span className="text-slate-400 text-[11px]">Transcribed mRNA (5&apos; &rarr; 3&apos;):</span>
                  <div className="font-mono p-2 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 tracking-wider font-semibold mt-1">
                    {mrnaTranscript}
                  </div>
                </div>
              )}

              {transcribedCodons.length > 0 && (
                <div className="pt-1 text-[11px] text-slate-300">
                  <span className="text-slate-400">Amino Acid Translation: </span>
                  <span className="font-mono text-yellow-300 font-medium">
                    {transcribedCodons[0] === 'AUG' ? 'Met (Start)' : 'Peptide chain'} → Pro → Asn → Asp → Stop
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={runTranscription}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Transcribe DNA with RNA Polymerase
            </button>
          </div>
        )}

        {/* Legend / Info HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto">
          {activeTab === 'cell' ? (
            <>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span className="text-slate-400 font-mono">Organelle Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Nucleus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Mitochondria
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Golgi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Endoplasmic Reticulum
                </span>
              </div>
              <button
                onClick={() => setAtpPulsing(!atpPulsing)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  atpPulsing
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                ATP Synthesis Pulse ({atpPulsing ? 'ACTIVE' : 'PAUSED'})
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="text-slate-400 font-mono">DNA Nucleotide Bases:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Adenine (A)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Thymine (T)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Cytosine (C)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Guanine (G)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
