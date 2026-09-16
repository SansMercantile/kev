import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OpticalSetup } from '../../types';
import { Sparkles, Compass, Sliders, Camera, HelpCircle, Eye, Info, CheckCircle2, ListOrdered, Trophy, Wand2, GraduationCap } from 'lucide-react';
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

const WAVELENGTHS = [
  { name: 'Red Laser', nm: 650, hex: '#ef4444', threeHex: 0xef4444, dispersionOffset: -0.015 },
  { name: 'Green Laser', nm: 532, hex: '#22c55e', threeHex: 0x22c55e, dispersionOffset: 0.0 },
  { name: 'Violet Laser', nm: 405, hex: '#8b5cf6', threeHex: 0x8b5cf6, dispersionOffset: 0.022 },
  { name: 'White Light (Dispersion)', nm: 0, hex: '#ffffff', threeHex: 0xffffff, isWhite: true },
];

const MEDIUM_PRESETS = [
  { name: 'Water (H₂O)', n: 1.333 },
  { name: 'Crown Glass', n: 1.520 },
  { name: 'Flint Glass', n: 1.660 },
  { name: 'Diamond', n: 2.417 },
];

export const OpticsLab: React.FC<Props> = ({
  onCaptureSnapshot,
  onSaveSnapshot,
  onRequestAITutor,
  onOpenScienceTwin,
  onOpenSketchToSim,
  onOpenStudyKit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState<number>(42);
  const [selectedWavelength, setSelectedWavelength] = useState(WAVELENGTHS[1]); // Green
  const [mediumRefractiveIndex, setMediumRefractiveIndex] = useState<number>(1.52);
  const [environmentIndex] = useState<number>(1.0); // Air
  const [prismType, setPrismType] = useState<'triangular' | 'slab'>('triangular');
  const [isQuickStartOpen, setIsQuickStartOpen] = useState<boolean>(false);
  const [isStepGuideOpen, setIsStepGuideOpen] = useState<boolean>(false);
  const [taskCompletedBanner, setTaskCompletedBanner] = useState<string | null>(null);

  // Snell's Law calculated values
  const theta1Rad = (incidentAngleDeg * Math.PI) / 180;
  const sinTheta2 = (environmentIndex * Math.sin(theta1Rad)) / mediumRefractiveIndex;
  const isTir = sinTheta2 > 1.0;
  const theta2Deg = isTir ? 0 : (Math.asin(sinTheta2) * 180) / Math.PI;
  const criticalAngleDeg = (Math.asin(environmentIndex / mediumRefractiveIndex) * 180) / Math.PI;

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    prismMesh: THREE.Mesh;
    raysGroup: THREE.Group;
    normalLine: THREE.Line;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060813);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.replaceChildren(renderer.domElement);

    // Grid Floor
    const grid = new THREE.GridHelper(16, 16, 0x38bdf8, 0x1e293b);
    grid.position.y = -1.5;
    scene.add(grid);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Optical Prism Mesh
    const prismGeo = new THREE.CylinderGeometry(2, 2, 2.8, 3);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      transmission: 0.95,
      ior: mediumRefractiveIndex,
      thickness: 1.5,
      reflectivity: 0.9,
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismMesh.rotation.y = Math.PI / 6;
    scene.add(prismMesh);

    // Normal line (dashed perpendicular to prism face)
    const normalGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(3, 0, 0),
    ]);
    const normalMat = new THREE.LineDashedMaterial({
      color: 0x64748b,
      dashSize: 0.2,
      gapSize: 0.1,
    });
    const normalLine = new THREE.Line(normalGeo, normalMat);
    normalLine.computeLineDistances();
    scene.add(normalLine);

    // Rays Group
    const raysGroup = new THREE.Group();
    scene.add(raysGroup);

    // Orbit Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 12, theta: Math.PI / 4, phi: Math.PI / 3.4 };

    const updateCameraPos = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;

      spherical.theta -= dx * 0.008;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - dy * 0.008, 0.15, Math.PI / 2.05);
      updateCameraPos();

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = THREE.MathUtils.clamp(spherical.radius + e.deltaY * 0.01, 6, 22);
      updateCameraPos();
    };

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
      spherical.theta -= dx * 0.012;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - dy * 0.012, 0.15, Math.PI / 2.05);
      updateCameraPos();
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDragging = false;
    };
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    threeRef.current = {
      renderer,
      scene,
      camera,
      prismMesh,
      raysGroup,
      normalLine,
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

  // Update rays whenever parameters change
  useEffect(() => {
    if (!threeRef.current) return;
    const { raysGroup } = threeRef.current;
    raysGroup.clear();

    const origin = new THREE.Vector3(0, 0, 0); // Intersection at prism surface
    const rayLength = 5.0;

    // Helper to create glowing laser tube
    const createLaserTube = (p1: THREE.Vector3, p2: THREE.Vector3, colorHex: number, radius = 0.035) => {
      const dist = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const cylGeo = new THREE.CylinderGeometry(radius, radius, dist, 12);
      const cylMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(cylGeo, cylMat);
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      raysGroup.add(mesh);

      // Outer soft glow halo
      const glowGeo = new THREE.CylinderGeometry(radius * 2.5, radius * 2.5, dist, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.25,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(mid);
      glowMesh.quaternion.copy(mesh.quaternion);
      raysGroup.add(glowMesh);
    };

    // Incident Ray (comes from top-left at incidentAngleDeg)
    const incRad = (incidentAngleDeg * Math.PI) / 180;
    const incStart = new THREE.Vector3(
      -Math.cos(incRad) * rayLength,
      0,
      -Math.sin(incRad) * rayLength
    );
    createLaserTube(incStart, origin, selectedWavelength.threeHex);

    // Laser Emitter Box at incStart
    const boxGeo = new THREE.BoxGeometry(0.5, 0.4, 0.7);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const emitter = new THREE.Mesh(boxGeo, boxMat);
    emitter.position.copy(incStart);
    emitter.lookAt(origin);
    raysGroup.add(emitter);

    // Surface Normal Line at origin
    threeRef.current.normalLine.rotation.y = 0;

    // Refraction / Reflection calculation
    if (selectedWavelength.isWhite) {
      // White light splits into chromatic dispersion rainbow spectrum!
      const spectrumColors = [
        { name: 'Red', col: 0xef4444, offset: -0.02 },
        { name: 'Orange', col: 0xf97316, offset: -0.01 },
        { name: 'Yellow', col: 0xeab308, offset: 0.0 },
        { name: 'Green', col: 0x22c55e, offset: 0.01 },
        { name: 'Blue', col: 0x3b82f6, offset: 0.02 },
        { name: 'Violet', col: 0x8b5cf6, offset: 0.035 },
      ];

      spectrumColors.forEach((sc) => {
        const effN = mediumRefractiveIndex + sc.offset;
        const sTheta = Math.sin(incRad) / effN;
        if (sTheta <= 1.0) {
          const refrAngle = Math.asin(sTheta);
          const refrEnd = new THREE.Vector3(
            Math.cos(refrAngle) * 3.2,
            0,
            Math.sin(refrAngle) * 3.2
          );
          createLaserTube(origin, refrEnd, sc.col, 0.02);

          // Exit prism ray
          const exitEnd = new THREE.Vector3(
            refrEnd.x + Math.cos(refrAngle * 1.5) * 3.0,
            0,
            refrEnd.z + Math.sin(refrAngle * 1.5) * 3.0
          );
          createLaserTube(refrEnd, exitEnd, sc.col, 0.02);
        }
      });
    } else {
      // Single wavelength monochromatic laser
      const effN = mediumRefractiveIndex + (selectedWavelength.dispersionOffset || 0);
      const sTheta2 = Math.sin(incRad) / effN;

      if (sTheta2 <= 1.0) {
        // Refracted ray into prism
        const refrRad = Math.asin(sTheta2);
        const refrEnd = new THREE.Vector3(
          Math.cos(refrRad) * 3.0,
          0,
          Math.sin(refrRad) * 3.0
        );
        createLaserTube(origin, refrEnd, selectedWavelength.threeHex);

        // Emerging ray out of prism
        const exitAngle = refrRad * 1.6;
        const exitEnd = new THREE.Vector3(
          refrEnd.x + Math.cos(exitAngle) * 3.5,
          0,
          refrEnd.z + Math.sin(exitAngle) * 3.5
        );
        createLaserTube(refrEnd, exitEnd, selectedWavelength.threeHex);
      }

      // Partial reflection off surface
      const reflRad = incRad;
      const reflEnd = new THREE.Vector3(
        Math.cos(reflRad) * 4.0,
        0,
        -Math.sin(reflRad) * 4.0
      );
      createLaserTube(origin, reflEnd, selectedWavelength.threeHex, 0.015);
    }
  }, [incidentAngleDeg, selectedWavelength, mediumRefractiveIndex]);

  // Total Internal Reflection / Critical Angle Verification Task
  const handleVerifyTIR = () => {
    triggerLabConfetti('optics', {
      particleCount: 90,
    });
    if (incidentAngleDeg >= criticalAngleDeg) {
      setTaskCompletedBanner(
        `Total Internal Reflection Locked! Angle (${incidentAngleDeg}°) exceeds θc (${criticalAngleDeg.toFixed(1)}°). 100% internal reflectance.`
      );
    } else {
      setTaskCompletedBanner(
        `Snell's Law Refraction Verified! θ1 = ${incidentAngleDeg}°, θ2 = ${theta2Deg.toFixed(1)}° at n = ${mediumRefractiveIndex}.`
      );
    }
    setTimeout(() => {
      setTaskCompletedBanner(null);
    }, 4500);
  };

  // Capture snapshot
  const handleSnapshot = () => {
    const saveFn = onSaveSnapshot || onCaptureSnapshot;
    if (!threeRef.current || !saveFn) return;
    const dataUrl = threeRef.current.renderer.domElement.toDataURL('image/png');
    saveFn(dataUrl, {
      Lab: 'Quantum Optics & Snell Law',
      Wavelength: selectedWavelength.name,
      'Incident Angle (θ1)': `${incidentAngleDeg}°`,
      'Refracted Angle (θ2)': isTir ? 'Total Internal Reflection' : `${theta2Deg.toFixed(1)}°`,
      'Critical Angle (θc)': `${criticalAngleDeg.toFixed(1)}°`,
      'Refractive Index (n)': mediumRefractiveIndex,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base">
              Quantum Optics & Refraction Lab
            </h3>
            <p className="text-xs text-slate-400">Snell’s Law, Wave Dispersion & Total Internal Reflection</p>
          </div>
        </div>

        {/* Laser Wavelength Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          {WAVELENGTHS.map((w) => (
            <button
              key={w.name}
              onClick={() => setSelectedWavelength(w)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedWavelength.name === w.name
                  ? 'bg-slate-800 text-white font-semibold border border-slate-600 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.hex }} />
              {w.name}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Step-by-Step Lab Guide Toggle Button */}
          <button
            id="optics-stepguide-btn"
            onClick={() => setIsStepGuideOpen(!isStepGuideOpen)}
            title="Toggle Step-by-Step Interactive Lab Guide"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isStepGuideOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-500/30'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Step-by-Step Guide</span>
          </button>

          {/* Quick Start Guide Info Button */}
          <button
            id="optics-quickstart-btn"
            onClick={() => setIsQuickStartOpen(true)}
            title="Lab Quick Start Guide & Interaction Points"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
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
              title="Doodle a Prism Setup to 3D Simulation"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            Snapshot
          </button>
          <button
            onClick={() =>
              onRequestAITutor?.(
                `Explain Snell's Law (n1 * sin(θ1) = n2 * sin(θ2)) with my current angle of ${incidentAngleDeg}° and refractive index ${mediumRefractiveIndex}. Explain why white light disperses into rainbow colors inside the prism.`
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

        {/* Task Completion Celebration Banner */}
        {taskCompletedBanner && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-slate-900/95 border border-amber-400/60 text-white font-semibold text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 z-20">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-amber-300">{taskCompletedBanner}</div>
              <div className="text-[10px] text-slate-400 font-mono font-normal">
                Optics milestone reached • Laser dispersion verified
              </div>
            </div>
          </div>
        )}

        {/* Snell's Law Mathematical HUD Overlay */}
        <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-mono font-semibold">
              Snell’s Law Optical HUD
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              n₁ sin θ₁ = n₂ sin θ₂
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Incident Angle (θ₁):</span>
              <span className="font-mono text-cyan-300 font-bold">{incidentAngleDeg.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Refracted Angle (θ₂):</span>
              <span className="font-mono text-emerald-300 font-bold">
                {isTir ? 'Total Internal Reflection' : `${theta2Deg.toFixed(1)}°`}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Critical Angle (θc):</span>
              <span className="font-mono text-amber-300 font-semibold">{criticalAngleDeg.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Refractive Index (n₂):</span>
              <span className="font-mono text-white font-semibold">{mediumRefractiveIndex.toFixed(3)}</span>
            </div>
          </div>

          {incidentAngleDeg >= criticalAngleDeg && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
              ⚡ <strong>Total Internal Reflection Achieved!</strong> Light cannot escape into air and reflects 100% internally.
            </div>
          )}
        </div>

        {/* Bottom Optical Bench Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto">
          {/* Angle of incidence slider */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Angle of Incidence (θ₁):</span>
                <span className="font-mono text-amber-400 font-semibold">{incidentAngleDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={incidentAngleDeg}
                onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Refractive Index slider & Presets */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Medium Refractive Index (n₂):</span>
                <span className="font-mono text-cyan-400 font-semibold">{mediumRefractiveIndex.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="1.1"
                max="2.5"
                step="0.01"
                value={mediumRefractiveIndex}
                onChange={(e) => setMediumRefractiveIndex(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Material Presets & Verification Task */}
          <div className="flex items-center gap-1.5">
            {MEDIUM_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setMediumRefractiveIndex(p.n)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  Math.abs(mediumRefractiveIndex - p.n) < 0.01
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
            <button
              onClick={handleVerifyTIR}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/90 hover:bg-amber-900/90 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer ml-1"
              title="Verify Snell's Law refraction and Total Internal Reflection boundary"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Verify TIR
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Modal */}
      <LabQuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        labId="optics"
      />

      {/* Interactive Step-by-Step Lab Guide */}
      <StepByStepLabGuide
        labId="optics"
        isOpen={isStepGuideOpen}
        onClose={() => setIsStepGuideOpen(false)}
      />
    </div>
  );
};
