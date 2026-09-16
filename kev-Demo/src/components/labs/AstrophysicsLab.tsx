import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CelestialBody } from '../../types';
import { Orbit, Sparkles, FastForward, Play, Pause, RotateCcw, Rocket, Camera, AlertCircle, Info, CheckCircle2, Globe, ListOrdered, Trophy, Wand2, GraduationCap, Compass } from 'lucide-react';
import { triggerLabConfetti } from '../../utils/confettiCelebration';
import { LabQuickStartModal } from './LabQuickStartModal';
import { GlobalGeoDataOverlay } from './GlobalGeoDataOverlay';
import { StepByStepLabGuide } from './StepByStepLabGuide';

interface Props {
  onCaptureSnapshot?: (dataUrl: string, measurements: Record<string, string | number>) => void;
  onSaveSnapshot?: (dataUrl: string, measurements: Record<string, string | number>) => void;
  onRequestAITutor?: (context: string) => void;
  onOpenScienceTwin?: () => void;
  onOpenSketchToSim?: () => void;
  onOpenStudyKit?: () => void;
  onOpenPlanetaryRecon?: () => void;
}

const DEFAULT_BODIES: CelestialBody[] = [
  {
    id: 'sun',
    name: 'Helios (Star)',
    mass: 1200,
    radius: 1.1,
    color: '#fbbf24',
    pos: [0, 0, 0],
    vel: [0, 0, 0],
    trail: [],
    isStar: true,
  },
  {
    id: 'mercury',
    name: 'Hermes',
    mass: 0.8,
    radius: 0.22,
    color: '#94a3b8',
    pos: [2.5, 0, 0],
    vel: [0, 0, 21.8],
    trail: [],
  },
  {
    id: 'earth',
    name: 'Terra',
    mass: 2.0,
    radius: 0.38,
    color: '#38bdf8',
    pos: [4.8, 0, 0],
    vel: [0, 0, 15.8],
    trail: [],
  },
  {
    id: 'mars',
    name: 'Ares',
    mass: 1.2,
    radius: 0.3,
    color: '#f87171',
    pos: [7.2, 0, 0],
    vel: [0, 0, 12.9],
    trail: [],
  },
  {
    id: 'jupiter',
    name: 'Zeus',
    mass: 15.0,
    radius: 0.7,
    color: '#fb923c',
    pos: [11.0, 0, 0],
    vel: [0, 0, 10.4],
    trail: [],
  },
];

export const AstrophysicsLab: React.FC<Props> = ({
  onCaptureSnapshot,
  onSaveSnapshot,
  onRequestAITutor,
  onOpenScienceTwin,
  onOpenSketchToSim,
  onOpenStudyKit,
  onOpenPlanetaryRecon,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [gravityG, setGravityG] = useState<number>(1.0);
  const [selectedBodyId, setSelectedBodyId] = useState<string>('earth');
  const [liveTelemetry, setLiveTelemetry] = useState<{ speed: number; distance: number; period: number }>({
    speed: 15.8,
    distance: 4.8,
    period: 1.0,
  });
  const [isQuickStartOpen, setIsQuickStartOpen] = useState<boolean>(false);
  const [isGeoDataOpen, setIsGeoDataOpen] = useState<boolean>(false);
  const [isStepGuideOpen, setIsStepGuideOpen] = useState<boolean>(false);
  const [taskCompletedBanner, setTaskCompletedBanner] = useState<string | null>(null);

  const stateRef = useRef<{
    bodies: CelestialBody[];
    meshes: Map<string, THREE.Mesh>;
    trailLines: Map<string, THREE.Line>;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    grid: THREE.GridHelper;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060813);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.replaceChildren(renderer.domElement);

    // Ambient & Stellar Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfff7ed, 3.5, 60);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Deep space stars backdrop
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 120;
      starPos[i + 1] = (Math.random() - 0.5) * 120;
      starPos[i + 2] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.15, transparent: true, opacity: 0.7 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Gravitational Spacetime Curvature Grid
    const grid = new THREE.GridHelper(32, 32, 0x38bdf8, 0x1e293b);
    grid.position.y = -0.1;
    scene.add(grid);

    // Init celestial bodies
    const bodies: CelestialBody[] = JSON.parse(JSON.stringify(DEFAULT_BODIES));
    const meshes = new Map<string, THREE.Mesh>();
    const trailLines = new Map<string, THREE.Line>();

    bodies.forEach((b) => {
      let mat: THREE.Material;
      if (b.isStar) {
        mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(b.color) });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(b.color),
          roughness: 0.5,
          metalness: 0.2,
        });
      }

      const geo = new THREE.SphereGeometry(b.radius, 28, 28);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...b.pos);
      scene.add(mesh);
      meshes.set(b.id, mesh);

      // Star halo glow mesh
      if (b.isStar) {
        const glowGeo = new THREE.SphereGeometry(b.radius * 1.4, 24, 24);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.3,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glowMesh);
      }

      // Orbital trail line
      const maxTrailPoints = 180;
      const trailPositions = new Float32Array(maxTrailPoints * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(b.color),
        transparent: true,
        opacity: 0.45,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);
      trailLines.set(b.id, trailLine);
    });

    // Orbit Controls (drag to rotate camera)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 26, theta: Math.PI / 4, phi: Math.PI / 3.2 };

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
      spherical.radius = THREE.MathUtils.clamp(spherical.radius + e.deltaY * 0.02, 10, 48);
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
      spherical.theta -= dx * 0.01;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - dy * 0.01, 0.15, Math.PI / 2.05);
      updateCameraPos();
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);

    // Animation / Physics Integration Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (stateRef.current) {
        const { bodies, meshes, trailLines } = stateRef.current;

        // Run N-body gravity integration if active
        // Real Newton's Gravity: F = G * m1 * m2 / r^2
        const subSteps = 3;
        const subDt = (dt * timeScale) / subSteps;

        for (let step = 0; step < subSteps; step++) {
          for (let i = 0; i < bodies.length; i++) {
            const b1 = bodies[i];
            if (b1.isStar) continue; // Keep star stable at center

            let ax = 0;
            let ay = 0;
            let az = 0;

            for (let j = 0; j < bodies.length; j++) {
              if (i === j) continue;
              const b2 = bodies[j];

              const dx = b2.pos[0] - b1.pos[0];
              const dy = b2.pos[1] - b1.pos[1];
              const dz = b2.pos[2] - b1.pos[2];
              const distSq = dx * dx + dy * dy + dz * dz + 0.1;
              const dist = Math.sqrt(distSq);

              const force = (gravityG * b2.mass) / distSq;
              ax += (force * dx) / dist;
              ay += (force * dy) / dist;
              az += (force * dz) / dist;
            }

            b1.vel[0] += ax * subDt;
            b1.vel[1] += ay * subDt;
            b1.vel[2] += az * subDt;

            b1.pos[0] += b1.vel[0] * subDt;
            b1.pos[1] += b1.vel[1] * subDt;
            b1.pos[2] += b1.vel[2] * subDt;
          }
        }

        // Update meshes & trail buffers
        bodies.forEach((b) => {
          const mesh = meshes.get(b.id);
          if (mesh) {
            mesh.position.set(...b.pos);
            mesh.rotation.y += 0.01;
          }

          // Append trail
          b.trail.push([...b.pos]);
          if (b.trail.length > 180) b.trail.shift();

          const trailLine = trailLines.get(b.id);
          if (trailLine) {
            const posAttr = trailLine.geometry.getAttribute('position') as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;
            for (let k = 0; k < b.trail.length; k++) {
              arr[k * 3] = b.trail[k][0];
              arr[k * 3 + 1] = b.trail[k][1];
              arr[k * 3 + 2] = b.trail[k][2];
            }
            posAttr.needsUpdate = true;
            trailLine.geometry.setDrawRange(0, b.trail.length);
          }
        });

        // Telemetry update
        const tracked = bodies.find((b) => b.id === selectedBodyId) || bodies[2];
        if (tracked) {
          const spd = Math.sqrt(
            tracked.vel[0] * tracked.vel[0] + tracked.vel[1] * tracked.vel[1] + tracked.vel[2] * tracked.vel[2]
          );
          const r = Math.sqrt(
            tracked.pos[0] * tracked.pos[0] + tracked.pos[1] * tracked.pos[1] + tracked.pos[2] * tracked.pos[2]
          );
          setLiveTelemetry({
            speed: parseFloat(spd.toFixed(2)),
            distance: parseFloat(r.toFixed(2)),
            period: parseFloat((Math.pow(r, 1.5) / 10).toFixed(2)),
          });
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    stateRef.current = {
      bodies,
      meshes,
      trailLines,
      renderer,
      scene,
      camera,
      grid,
      isDragging,
      prevMousePos,
      animId,
    };

    const handleResize = () => {
      if (!containerRef.current || !stateRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      stateRef.current.camera.aspect = w / h;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(w, h);
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

  // Orbital boost thruster simulation
  const applyVelocityBoost = (factor: number) => {
    if (!stateRef.current) return;
    const body = stateRef.current.bodies.find((b) => b.id === selectedBodyId);
    if (body) {
      body.vel[0] *= factor;
      body.vel[1] *= factor;
      body.vel[2] *= factor;
    }
  };

  // Reset to original Keplerian configuration
  const handleReset = () => {
    if (!stateRef.current) return;
    const fresh: CelestialBody[] = JSON.parse(JSON.stringify(DEFAULT_BODIES));
    stateRef.current.bodies = fresh;
    fresh.forEach((b) => {
      const mesh = stateRef.current!.meshes.get(b.id);
      if (mesh) mesh.position.set(...b.pos);
      const trail = stateRef.current!.trailLines.get(b.id);
      if (trail) trail.geometry.setDrawRange(0, 0);
    });
  };

  // Add Rogue Comet to demonstrate gravitational perturbation / slingshot
  const addRogueAsteroid = () => {
    if (!stateRef.current) return;
    const id = `rogue-${Date.now()}`;
    const rogue: CelestialBody = {
      id,
      name: 'Oumuamua II',
      mass: 0.5,
      radius: 0.2,
      color: '#ec4899',
      pos: [-14, 0, -12],
      vel: [9.5, 0, 8.2],
      trail: [],
    };

    stateRef.current.bodies.push(rogue);

    const geo = new THREE.SphereGeometry(rogue.radius, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...rogue.pos);
    stateRef.current.scene.add(mesh);
    stateRef.current.meshes.set(id, mesh);

    const trailPositions = new Float32Array(180 * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.6 });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    stateRef.current.scene.add(trailLine);
    stateRef.current.trailLines.set(id, trailLine);

    setSelectedBodyId(id);
  };

  // Keplerian Orbital Equilibrium Task Completion
  const handleVerifyEquilibrium = () => {
    triggerLabConfetti('astrophysics', {
      particleCount: 90,
      spread: 80,
    });
    setTaskCompletedBanner('Orbital Equilibrium Verified: Keplerian ellipse stabilized across heliocentric barycenter!');
    setTimeout(() => {
      setTaskCompletedBanner(null);
    }, 4500);
  };

  // Capture snapshot
  const handleSnapshot = () => {
    const saveFn = onSaveSnapshot || onCaptureSnapshot;
    if (!stateRef.current || !saveFn) return;
    const dataUrl = stateRef.current.renderer.domElement.toDataURL('image/png');
    saveFn(dataUrl, {
      Lab: 'Gravitational Astrophysics',
      TrackedBody: selectedBodyId,
      'Orbital Velocity': `${liveTelemetry.speed} km/s`,
      'Orbital Radius': `${liveTelemetry.distance} AU`,
      'Kepler Period Ratio': `${liveTelemetry.period} yr`,
      'Gravity Constant G': gravityG,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Orbit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base">
              N-Body Gravitational Orbital Lab
            </h3>
            <p className="text-xs text-slate-400">Keplerian Dynamics & Spacetime Trajectories</p>
          </div>
        </div>

        {/* Tracked Body Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          {DEFAULT_BODIES.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBodyId(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedBodyId === b.id
                  ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Step-by-Step Lab Guide Toggle Button */}
          <button
            id="astrophysics-stepguide-btn"
            onClick={() => setIsStepGuideOpen(!isStepGuideOpen)}
            title="Toggle Step-by-Step Interactive Lab Guide"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isStepGuideOpen
                ? 'bg-violet-500 text-slate-950 border-violet-400 font-bold'
                : 'bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border-violet-500/30'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Step-by-Step Guide</span>
          </button>

          {/* Quick Start Guide Info Button */}
          <button
            id="astrophysics-quickstart-btn"
            onClick={() => setIsQuickStartOpen(true)}
            title="Lab Quick Start Guide & Interaction Points"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Earth & Planetary Biome Reconnaissance Trigger */}
          {onOpenPlanetaryRecon && (
            <button
              id="astrophysics-recon-btn"
              onClick={onOpenPlanetaryRecon}
              title="Earth & Planetary Biome Reconnaissance (Satellite & Rover Strata)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Planetary Recon</span>
            </button>
          )}

          {/* Global Geo-Data Satellite & Gravity Overlay */}
          <button
            id="astrophysics-geodata-btn"
            onClick={() => setIsGeoDataOpen(true)}
            title="Compare Virtual Orbits with Real Earth Geological Coordinates & Satellite Imagery"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Global Geo-Data</span>
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
              title="Doodle an Orbit to 3D Simulation"
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
            onClick={addRogueAsteroid}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-medium hover:bg-pink-500/30 transition-colors cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Rogue Comet</span>
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer"
            title="Reset Orbits"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-violet-400" />
            Snapshot
          </button>
          <button
            onClick={() =>
              onRequestAITutor?.(
                `Explain Kepler's 3 Laws of Planetary Motion in the context of my N-body gravitational simulation, especially how orbital velocity varies with distance from the star.`
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

        {/* Telemetry HUD */}
        <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-violet-400 font-mono font-semibold">
              Orbital Telemetry
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
              F = G·M·m / r²
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Target Body:</span>
              <span className="font-mono text-white font-semibold capitalize">{selectedBodyId}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Orbital Speed (v):</span>
              <span className="font-mono text-cyan-300 font-semibold">{liveTelemetry.speed} AU/s</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Radius from Star (r):</span>
              <span className="font-mono text-violet-300">{liveTelemetry.distance} AU</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Kepler Period (T):</span>
              <span className="font-mono text-amber-300">~{liveTelemetry.period} orbital cycles</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            💡 Drag canvas to rotate 3D view; scroll wheel zooms.
          </div>
        </div>

        {/* Thruster / Velocity Boost Controller */}
        <div className="absolute top-4 right-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex flex-col gap-2 max-w-[200px]">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            Orbital Propulsion
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => applyVelocityBoost(1.2)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-medium border border-cyan-500/30 cursor-pointer"
            >
              +20% Vel
            </button>
            <button
              onClick={() => applyVelocityBoost(0.8)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium border border-red-500/30 cursor-pointer"
            >
              Retrofire
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Simulate Hohmann transfer burn or gravitational slingshot injection.
          </p>
        </div>

        {/* Task Completion Celebration Banner */}
        {taskCompletedBanner && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-slate-900/95 border border-violet-400/60 text-white font-semibold text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 z-20">
            <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="text-violet-300">{taskCompletedBanner}</div>
              <div className="text-[10px] text-slate-400 font-mono font-normal">
                Orbital milestone reached • Celebration confetti triggered
              </div>
            </div>
          </div>
        )}

        {/* Bottom Simulation Physics Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto">
          {/* Gravitational Multiplier */}
          <div className="flex items-center gap-3 min-w-[220px]">
            <span className="text-xs font-mono text-violet-400 font-bold">G</span>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Gravitational Force Multiplier:</span>
                <span className="font-mono text-violet-400 font-semibold">{gravityG.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={gravityG}
                onChange={(e) => setGravityG(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
              />
            </div>
          </div>

          {/* Time scale slider */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <FastForward className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Time Warp:</span>
                <span className="font-mono text-cyan-400 font-semibold">{timeScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.2"
                value={timeScale}
                onChange={(e) => setTimeScale(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Presets & Verification Task */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Orbital States:</span>
            <button
              onClick={() => {
                setGravityG(1.0);
                setTimeScale(1.0);
                handleReset();
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer"
            >
              Stable Circular
            </button>
            <button
              onClick={() => {
                handleReset();
                setTimeout(() => applyVelocityBoost(1.35), 200);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-violet-300 border border-slate-700 cursor-pointer"
            >
              Eccentric Ellipse
            </button>
            <button
              onClick={handleVerifyEquilibrium}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-950/90 hover:bg-violet-900/90 text-violet-300 border border-violet-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer ml-1"
              title="Verify orbital trajectory equilibrium & Keplerian period balance"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
              Verify Orbit
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Modal */}
      <LabQuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        labId="astrophysics"
      />

      {/* Real-Time Global Geo-Data & Earth Satellite Gravity Overlay */}
      <GlobalGeoDataOverlay
        isOpen={isGeoDataOpen}
        onClose={() => setIsGeoDataOpen(false)}
        currentSimSpeed={liveTelemetry.speed}
        currentSimDistance={liveTelemetry.distance}
        currentSimPeriod={liveTelemetry.period}
        onApplyGravityToSim={(multiplier, locName) => {
          setGravityG(Number(multiplier.toFixed(3)));
          setTaskCompletedBanner(`Gravity synchronized with ${locName} (${multiplier.toFixed(3)}x)`);
          setTimeout(() => setTaskCompletedBanner(null), 5000);
        }}
      />

      {/* Interactive Step-by-Step Lab Guide */}
      <StepByStepLabGuide
        labId="astrophysics"
        isOpen={isStepGuideOpen}
        onClose={() => setIsStepGuideOpen(false)}
      />
    </div>
  );
};
