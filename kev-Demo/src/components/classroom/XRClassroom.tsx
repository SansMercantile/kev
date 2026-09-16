import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Hand, Volume2, VolumeX, Users, Monitor, Maximize2, MessageSquare, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onRequestAITutor?: (context: string) => void;
}

const CLASSMATES = [
  { id: 'maya', name: 'Maya K.', seat: 'Desk 1A', role: 'Student', status: 'Taking Notes' },
  { id: 'liam', name: 'Liam S.', seat: 'Desk 1B', role: 'Student', status: 'Inspecting 3D Hologram' },
  { id: 'sophia', name: 'Sophia W.', seat: 'Desk 2A', role: 'Student', status: 'Formulating Hypothesis' },
  { id: 'noah', name: 'Noah B.', seat: 'Desk 2B', role: 'Student', status: 'Running Simulation' },
];

const LECTURE_SLIDES = [
  {
    id: 1,
    title: 'Welcome to KEV XR Science Auditorium',
    subtitle: 'Module 4: Spatial Chemistry & Quantum Electrodynamics',
    bulletPoints: [
      'Today: Exploring molecular geometry, electron repulsion & orbital dynamics',
      'Please inspect the central 3D hologram projected on the lecture podium',
      'Raise your hand anytime or ask Professor KEV for real-time Socratic guidance',
    ],
  },
  {
    id: 2,
    title: 'VSEPR Theory & Spatial Geometry',
    subtitle: 'Why 3D Spatial Geometry Dictates Chemical Function',
    bulletPoints: [
      'Electron pairs repel each other to achieve minimal electrostatic potential',
      'Water adopts a bent angle of 104.5° due to oxygen’s bulky lone pairs',
      'Methane’s 4 identical bonds form a perfect 109.5° tetrahedron',
    ],
  },
  {
    id: 3,
    title: 'Scientific Method in Virtual XR Labs',
    subtitle: 'Empirical Verification & AI Lab Collaboration',
    bulletPoints: [
      'Formulate falsifiable hypotheses before tweaking simulation parameters',
      'Log quantitative measurements into your digital lab notebook',
      'Compare simulated models against physical empirical benchmark observations',
    ],
  },
];

export const XRClassroom: React.FC<Props> = ({ onRequestAITutor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [hologramModel, setHologramModel] = useState<'molecule' | 'dna' | 'orbit'>('molecule');
  const [seatView, setSeatView] = useState<'front' | 'balcony' | 'teacher'>('front');
  const [ambientAudio, setAmbientAudio] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'Professor KEV', text: 'Welcome students! Today we are examining 3D molecular dipole moments.', time: '10:00 AM' },
    { sender: 'Maya K.', text: 'The bent angle in the water hologram is so clear now!', time: '10:02 AM' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    hologramGroup: THREE.Group;
    floatingReactions: THREE.Group;
    teacherMesh: THREE.Group;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060914);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    // Default Front Desk Seat Position
    camera.position.set(0, 2.2, 5.5);
    camera.lookAt(0, 1.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.replaceChildren(renderer.domElement);

    // --- CLASSROOM ARCHITECTURE BUILD ---
    // Floor
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Grid accent lines
    const grid = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Stage Platform
    const stageGeo = new THREE.CylinderGeometry(5.0, 5.2, 0.4, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.3,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.2, -2.5);
    scene.add(stage);

    // Glowing stage rim ring
    const ringGeo = new THREE.RingGeometry(4.8, 5.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.41, -2.5);
    scene.add(ring);

    // Holographic Center Projector Base
    const holoBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.3, 24);
    const holoBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const holoBase = new THREE.Mesh(holoBaseGeo, holoBaseMat);
    holoBase.position.set(0, 0.55, -2.5);
    scene.add(holoBase);

    // Holographic Beam Cone
    const coneGeo = new THREE.ConeGeometry(2.2, 3.5, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    const holoCone = new THREE.Mesh(coneGeo, coneMat);
    holoCone.position.set(0, 2.3, -2.5);
    holoCone.rotation.x = Math.PI;
    scene.add(holoCone);

    // Presentation Screen on Back Wall
    const screenGeo = new THREE.PlaneGeometry(8, 4.5);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
      roughness: 0.2,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 4.2, -7.0);
    scene.add(screen);

    // Screen frame
    const frameGeo = new THREE.BoxGeometry(8.4, 4.9, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 4.2, -7.1);
    scene.add(frame);

    // Tiered Student Desks
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

    // Row 1 Desks
    [-3, -1, 1, 3].forEach((xPos, idx) => {
      const deskGeo = new THREE.BoxGeometry(1.4, 0.9, 0.6);
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(xPos, 0.45, 3.0);
      scene.add(desk);

      // Student tablet / holographic terminal on desk
      const tabletGeo = new THREE.BoxGeometry(0.5, 0.04, 0.35);
      const tabletMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const tablet = new THREE.Mesh(tabletGeo, tabletMat);
      tablet.position.set(xPos, 0.92, 3.0);
      scene.add(tablet);

      // Student avatar sphere (classmates)
      if (idx !== 1) {
        // Leave seat 1 for user!
        const avatarGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const avatar = new THREE.Mesh(avatarGeo, seatMat);
        avatar.position.set(xPos, 1.4, 3.7);
        scene.add(avatar);
      }
    });

    // Row 2 Raised Tier Desks
    [-3.2, -1.1, 1.1, 3.2].forEach((xPos) => {
      const deskGeo = new THREE.BoxGeometry(1.4, 1.4, 0.6);
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(xPos, 0.7, 6.0);
      scene.add(desk);

      const avatarGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const avatar = new THREE.Mesh(avatarGeo, seatMat);
      avatar.position.set(xPos, 1.8, 6.7);
      scene.add(avatar);
    });

    // Teacher Avatar at Stage Podium
    const teacherGroup = new THREE.Group();
    const tHeadGeo = new THREE.SphereGeometry(0.35, 20, 20);
    const tHeadMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2 });
    const tHead = new THREE.Mesh(tHeadGeo, tHeadMat);
    tHead.position.set(0, 1.9, 0);
    teacherGroup.add(tHead);

    const tBodyGeo = new THREE.ConeGeometry(0.45, 1.2, 16);
    const tBodyMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.4 });
    const tBody = new THREE.Mesh(tBodyGeo, tBodyMat);
    tBody.position.set(0, 1.0, 0);
    teacherGroup.add(tBody);

    teacherGroup.position.set(-2.8, 0.4, -2.5);
    scene.add(teacherGroup);

    // Floating Hologram Group in Center of Stage
    const hologramGroup = new THREE.Group();
    hologramGroup.position.set(0, 2.4, -2.5);
    scene.add(hologramGroup);

    // Floating Reactions Group
    const floatingReactions = new THREE.Group();
    scene.add(floatingReactions);

    // Stage Lighting
    const stageLight = new THREE.SpotLight(0x38bdf8, 3.0, 20, Math.PI / 4, 0.3);
    stageLight.position.set(0, 8, -1);
    stageLight.target = stage;
    scene.add(stageLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Mouse / drag controls
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

      camera.rotation.y -= dx * 0.003;
      camera.rotation.x -= dy * 0.002;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

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
      camera.rotation.y -= dx * 0.005;
      camera.rotation.x -= dy * 0.003;
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

      // Rotate central hologram
      hologramGroup.rotation.y += 0.015;
      hologramGroup.position.y = 2.4 + Math.sin(elapsed * 2) * 0.08;

      // Subtle breathing motion on teacher avatar
      teacherGroup.position.y = 0.4 + Math.sin(elapsed * 1.5) * 0.03;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    threeRef.current = {
      renderer,
      scene,
      camera,
      hologramGroup,
      floatingReactions,
      teacherMesh: teacherGroup,
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
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, []);

  // Update central 3D hologram model based on selection
  useEffect(() => {
    if (!threeRef.current) return;
    const { hologramGroup } = threeRef.current;
    hologramGroup.clear();

    if (hologramModel === 'molecule') {
      // 3D Water Molecule Hologram
      const oGeo = new THREE.SphereGeometry(0.55, 20, 20);
      const oMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
      const oMesh = new THREE.Mesh(oGeo, oMat);
      hologramGroup.add(oMesh);

      const hGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const hMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 });

      const h1 = new THREE.Mesh(hGeo, hMat);
      h1.position.set(-1.0, -0.6, 0);
      hologramGroup.add(h1);

      const h2 = new THREE.Mesh(hGeo, hMat);
      h2.position.set(1.0, -0.6, 0);
      hologramGroup.add(h2);

      // Bonds
      const cylGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 12);
      const cylMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

      const b1 = new THREE.Mesh(cylGeo, cylMat);
      b1.position.set(-0.5, -0.3, 0);
      b1.rotation.z = Math.PI / 4;
      hologramGroup.add(b1);

      const b2 = new THREE.Mesh(cylGeo, cylMat);
      b2.position.set(0.5, -0.3, 0);
      b2.rotation.z = -Math.PI / 4;
      hologramGroup.add(b2);
    } else if (hologramModel === 'dna') {
      // 3D DNA Helix Hologram
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 3;
        const y = (i / 16) * 2.2 - 1.1;
        const p1 = new THREE.Vector3(Math.cos(t) * 0.7, y, Math.sin(t) * 0.7);
        const p2 = new THREE.Vector3(Math.cos(t + Math.PI) * 0.7, y, Math.sin(t + Math.PI) * 0.7);

        const sGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const s1 = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        s1.position.copy(p1);
        hologramGroup.add(s1);

        const s2 = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        s2.position.copy(p2);
        hologramGroup.add(s2);

        const bGeo = new THREE.CylinderGeometry(0.025, 0.025, p1.distanceTo(p2), 8);
        const bMesh = new THREE.Mesh(
          bGeo,
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x22c55e : 0xef4444 })
        );
        bMesh.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5));
        bMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        hologramGroup.add(bMesh);
      }
    } else {
      // 3D Solar Orbit Hologram
      const sunGeo = new THREE.SphereGeometry(0.45, 20, 20);
      const sun = new THREE.Mesh(sunGeo, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      hologramGroup.add(sun);

      const pGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const planet = new THREE.Mesh(pGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      planet.position.set(1.4, 0, 0);
      hologramGroup.add(planet);

      const ringGeo = new THREE.RingGeometry(1.38, 1.42, 32);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: 0x64748b, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2;
      hologramGroup.add(ring);
    }
  }, [hologramModel]);

  // Update Camera View according to selected seat perspective
  useEffect(() => {
    if (!threeRef.current) return;
    const { camera } = threeRef.current;

    if (seatView === 'front') {
      camera.position.set(0, 2.2, 4.5);
      camera.lookAt(0, 2.0, -2.5);
    } else if (seatView === 'balcony') {
      camera.position.set(0, 5.5, 8.5);
      camera.lookAt(0, 2.2, -2.5);
    } else if (seatView === 'teacher') {
      camera.position.set(-2.5, 2.4, -2.2);
      camera.lookAt(0, 1.8, 4.5);
    }
  }, [seatView]);

  // Send spatial chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: 'You (Student)',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Teacher simulated response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Professor KEV',
          text: `Great scientific observation! Notice how the 3D projection highlights the electronegative gradient in real time.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  // Trigger floating reaction
  const triggerReaction = (emoji: string) => {
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base flex items-center gap-2">
              KEV XR Science Auditorium
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Session
              </span>
            </h3>
            <p className="text-xs text-slate-400">Collaborative 3D Holographic Lecture Hall</p>
          </div>
        </div>

        {/* Seat Perspective Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setSeatView('front')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              seatView === 'front' ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Front Row Desk
          </button>
          <button
            onClick={() => setSeatView('balcony')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              seatView === 'balcony' ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Balcony Tier
          </button>
          <button
            onClick={() => setSeatView('teacher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              seatView === 'teacher' ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Teacher Stage
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHandRaised(!handRaised)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              handRaised
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            {handRaised ? 'Hand Raised!' : 'Raise Hand'}
          </button>
          <button
            onClick={() => setAmbientAudio(!ambientAudio)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Spatial Audio Ambience"
          >
            {ambientAudio ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas & Classroom Overlays */}
      <div className="relative flex-1 w-full min-h-[440px] flex">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Presentation Slide HUD (Top Left) */}
        <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 max-w-sm pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5" />
              Auditorium Whiteboard Screen
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <span>Slide {currentSlideIndex + 1}</span> / {LECTURE_SLIDES.length}
            </div>
          </div>

          <h4 className="font-bold text-white text-sm leading-snug mb-1">
            {LECTURE_SLIDES[currentSlideIndex].title}
          </h4>
          <p className="text-xs text-cyan-300 font-medium mb-2.5">
            {LECTURE_SLIDES[currentSlideIndex].subtitle}
          </p>

          <ul className="space-y-1.5 text-xs text-slate-300">
            {LECTURE_SLIDES[currentSlideIndex].bulletPoints.map((bp, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-cyan-400 font-bold shrink-0">•</span>
                <span>{bp}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 cursor-pointer"
            >
              Previous Slide
            </button>
            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.min(LECTURE_SLIDES.length - 1, prev + 1))}
              disabled={currentSlideIndex === LECTURE_SLIDES.length - 1}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs text-white font-medium cursor-pointer"
            >
              Next Slide
            </button>
          </div>
        </div>

        {/* Live Classmates & Hologram Switcher (Top Right) */}
        <div className="absolute top-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 max-w-xs pointer-events-auto">
          {/* Stage Hologram Projector Switcher */}
          <div className="mb-3.5 pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Stage Holographic Projection:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setHologramModel('molecule')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  hologramModel === 'molecule'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                Water (H₂O)
              </button>
              <button
                onClick={() => setHologramModel('dna')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  hologramModel === 'dna'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                DNA Helix
              </button>
              <button
                onClick={() => setHologramModel('orbit')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  hologramModel === 'orbit'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-semibold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                Solar Orbit
              </button>
            </div>
          </div>

          {/* Active Classmates List */}
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Connected Students ({CLASSMATES.length + 1})
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs">
                <span className="font-semibold text-blue-300">You (Student)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">
                  {handRaised ? '✋ Hand Raised' : 'Front Desk'}
                </span>
              </div>
              {CLASSMATES.map((cm) => (
                <div key={cm.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 text-xs">
                  <span className="text-slate-300">{cm.name}</span>
                  <span className="text-[10px] text-slate-400">{cm.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Classroom Live Interaction & Chat Ribbon */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto">
          {/* Reaction emojis */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Spatial Reactions:</span>
            {['👏', '💡', '🧪', '🔥', '❓'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => triggerReaction(emoji)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm transition-transform active:scale-125 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Inline Chat form */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message to classroom or ask teacher..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Ask AI Teacher Button */}
          <button
            onClick={() =>
              onRequestAITutor?.(
                `Hello Professor KEV! I am in the XR Science Classroom watching Slide ${currentSlideIndex + 1}: ${LECTURE_SLIDES[currentSlideIndex].title}. Can you provide a detailed explanation with questions for our study group?`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Ask Professor KEV
          </button>
        </div>
      </div>
    </div>
  );
};
