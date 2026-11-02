import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Hand, Volume2, VolumeX, Users, Monitor, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createStudio, StudioHandle } from '../../../lib/studio/studioRenderer';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';
import { getStudyLevelId } from '../../lib/studyLevel';
import { getTierId } from '../../lib/studyTier';
import { getCurrentSubjectId, setCurrentSubjectId } from '../../lib/currentSubject';
import { getAnswerLanguage } from '../../../i18n/index.js';

interface Props {
  onRequestAITutor?: (context: string) => void;
}

const CLASSMATES = [
  { id: 'maya', name: 'Maya K.', seat: 'Desk 1A', role: 'Student', status: 'Taking Notes' },
  { id: 'liam', name: 'Liam S.', seat: 'Desk 1B', role: 'Student', status: 'Inspecting 3D Hologram' },
  { id: 'sophia', name: 'Sophia W.', seat: 'Desk 2A', role: 'Student', status: 'Formulating Hypothesis' },
  { id: 'noah', name: 'Noah B.', seat: 'Desk 2B', role: 'Student', status: 'Running Simulation' },
];

type HologramKind = 'molecule' | 'dna' | 'orbit';

interface LessonSlide {
  id: number;
  title: string;
  subtitle: string;
  bulletPoints: string[];
}

interface SubjectLesson {
  module: string;
  defaultHologram: HologramKind;
  slides: LessonSlide[];
}

// Per-subject lesson decks. A school auditorium teaches the class the student
// is actually taking, so the slides and the default hologram follow the active
// subject (from the Immersive Lab / shared lesson store) instead of a single
// fixed chemistry deck. Each deck ends on the same scientific-method slide —
// how to work in the virtual lab is universal.
const METHOD_SLIDE: LessonSlide = {
  id: 99,
  title: 'Scientific Method in Virtual XR Labs',
  subtitle: 'Empirical Verification & AI Lab Collaboration',
  bulletPoints: [
    'Formulate falsifiable hypotheses before tweaking simulation parameters',
    'Log quantitative measurements into your digital lab notebook',
    'Compare simulated models against physical empirical benchmark observations',
  ],
};

const SUBJECT_LESSONS: Record<string, SubjectLesson> = {
  chemistry: {
    module: 'Module 4: Spatial Chemistry & Quantum Electrodynamics',
    defaultHologram: 'molecule',
    slides: [
      {
        id: 1,
        title: 'Welcome to the Spatial Chemistry Session',
        subtitle: 'Module 4: Spatial Chemistry & Quantum Electrodynamics',
        bulletPoints: [
          'Today: molecular geometry, electron repulsion & orbital dynamics',
          'Inspect the central 3D hologram projected on the lecture podium',
          'Raise your hand or ask Professor KEV for real-time Socratic guidance',
        ],
      },
      {
        id: 2,
        title: 'VSEPR Theory & Spatial Geometry',
        subtitle: 'Why 3D Spatial Geometry Dictates Chemical Function',
        bulletPoints: [
          'Electron pairs repel each other to reach minimal electrostatic potential',
          'Water adopts a bent 104.5° angle from oxygen’s bulky lone pairs',
          'Methane’s 4 identical bonds form a perfect 109.5° tetrahedron',
        ],
      },
      METHOD_SLIDE,
    ],
  },
  anatomy: {
    module: 'Module 7: Human Anatomy & Physiology',
    defaultHologram: 'dna',
    slides: [
      {
        id: 1,
        title: 'Welcome to the Human Anatomy Session',
        subtitle: 'Module 7: Human Anatomy & Physiology',
        bulletPoints: [
          'Today: body systems and how they interlock to sustain life',
          'The hologram shows a DNA helix — the blueprint every cell reads',
          'Open the Immersive Lab afterwards to dissect the full Human Atlas',
        ],
      },
      {
        id: 2,
        title: 'From DNA to Organ Systems',
        subtitle: 'How Genetic Instruction Becomes Living Structure',
        bulletPoints: [
          'DNA encodes proteins; proteins build the tissues of every organ',
          'The double helix unzips so each strand templates a copy',
          'Mutations in structure explain why systems fail — form is function',
        ],
      },
      METHOD_SLIDE,
    ],
  },
  biology: {
    module: 'Module 5: Cell Biology & Genetics',
    defaultHologram: 'dna',
    slides: [
      {
        id: 1,
        title: 'Welcome to the Cell Biology Session',
        subtitle: 'Module 5: Cell Biology & Genetics',
        bulletPoints: [
          'Today: the eukaryotic cell — nucleus, mitochondria and membrane flow',
          'The hologram shows DNA, the molecule at the centre of the nucleus',
          'Ask Professor KEV to walk any organelle step by step',
        ],
      },
      {
        id: 2,
        title: 'Energy and Information in the Cell',
        subtitle: 'Mitochondria Power the Machinery DNA Directs',
        bulletPoints: [
          'Ribosomes read mRNA to assemble proteins from DNA’s code',
          'Mitochondria fold their inner membrane to maximise ATP output',
          'The endomembrane system ships proteins to where the cell needs them',
        ],
      },
      METHOD_SLIDE,
    ],
  },
  astrophysics: {
    module: 'Module 9: Gravitation & Orbital Mechanics',
    defaultHologram: 'orbit',
    slides: [
      {
        id: 1,
        title: 'Welcome to the Astrophysics Session',
        subtitle: 'Module 9: Gravitation & Orbital Mechanics',
        bulletPoints: [
          'Today: why planets orbit instead of falling straight into the Sun',
          'The hologram is a star with an orbiting planet and its ring plane',
          'We will vary mass and velocity and watch the orbit respond',
        ],
      },
      {
        id: 2,
        title: 'Kepler’s Laws and the Balance of Orbits',
        subtitle: 'Gravity Supplies the Centripetal Pull',
        bulletPoints: [
          'An orbit is perpetual free-fall: tangential speed vs gravitational pull',
          'Equal areas in equal times — planets sweep faster near perihelion',
          'Orbital period grows with the 3/2 power of the semi-major axis',
        ],
      },
      METHOD_SLIDE,
    ],
  },
};

// Immersive-bench classes (plants, bridge, EV, earth) route to the physics
// playground in the immersive catalog; the auditorium teaches them too.
SUBJECT_LESSONS.plants = {
  module: 'Module 6: Plant Physiology & Photosynthesis',
  defaultHologram: 'dna',
  slides: [
    {
      id: 1,
      title: 'Welcome to the Botany Session',
      subtitle: 'Module 6: Plant Physiology & Photosynthesis',
      bulletPoints: [
        'Today: how roots, vascular tissue and leaves move water and energy',
        'The hologram shows DNA — the code behind every chloroplast',
        'Open the Immersive Lab to trace xylem and phloem in 3D',
      ],
    },
    {
      id: 2,
      title: 'Moving Water and Sugar',
      subtitle: 'Xylem Up, Phloem Down',
      bulletPoints: [
        'Xylem pulls water and minerals up from the roots by transpiration',
        'Phloem distributes the sugars photosynthesis makes in the leaves',
        'Stomata open and close to balance CO₂ intake against water loss',
      ],
    },
    METHOD_SLIDE,
  ],
};

SUBJECT_LESSONS.engineering = {
  module: 'Module 8: Structural Engineering & Load Paths',
  defaultHologram: 'orbit',
  slides: [
    {
      id: 1,
      title: 'Welcome to the Engineering Session',
      subtitle: 'Module 8: Structural Engineering & Load Paths',
      bulletPoints: [
        'Today: how a truss bridge carries load through structure, not bulk',
        'Watch how forces travel from deck to truss to foundation',
        'We will explode the bridge in the Immersive Lab to see each member',
      ],
    },
    {
      id: 2,
      title: 'Tension, Compression and Triangles',
      subtitle: 'Why the Truss is the Strongest Simple Shape',
      bulletPoints: [
        'A triangle cannot deform without changing a side length — it is rigid',
        'Trusses turn bending loads into pure tension and compression',
        'Expansion joints let the deck move with temperature without cracking',
      ],
    },
    METHOD_SLIDE,
  ],
};

SUBJECT_LESSONS.vehicle = {
  module: 'Module 8: Electric Vehicle Systems & Energy',
  defaultHologram: 'orbit',
  slides: [
    {
      id: 1,
      title: 'Welcome to the EV Engineering Session',
      subtitle: 'Module 8: Electric Vehicle Systems & Energy',
      bulletPoints: [
        'Today: energy storage, drive units, chassis and body systems',
        'An EV is applied physics — energy, forces and motion in one machine',
        'We will take the Model X apart in the Immersive Lab, piece by piece',
      ],
    },
    {
      id: 2,
      title: 'From Battery to Wheel',
      subtitle: 'Regenerative Braking and the Drive Unit',
      bulletPoints: [
        'The lithium-ion battery stores energy; the inverter meters it to the motor',
        'During braking the motors run backwards and return charge to the pack',
        'Adaptive suspension reads the road and adjusts each air spring',
      ],
    },
    METHOD_SLIDE,
  ],
};

SUBJECT_LESSONS.earth = {
  module: 'Module 9: Earth Systems & Plate Tectonics',
  defaultHologram: 'orbit',
  slides: [
    {
      id: 1,
      title: 'Welcome to the Earth Science Session',
      subtitle: 'Module 9: Earth Systems & Plate Tectonics',
      bulletPoints: [
        'Today: the layered planet and the systems that shape its surface',
        'The hologram is a star — our Sun drives nearly every surface process',
        'We will open the Earth in the Immersive Lab, core to cloud',
      ],
    },
    {
      id: 2,
      title: 'A Restless Crust',
      subtitle: 'Convection Moves the Plates We Live On',
      bulletPoints: [
        'The mantle creeps by slow convection, dragging the plates above',
        'Plate boundaries make earthquakes, mountains and volcanoes',
        'The atmosphere moves the Sun’s energy and water around the globe',
      ],
    },
    METHOD_SLIDE,
  ],
};

const DEFAULT_LESSON: SubjectLesson = SUBJECT_LESSONS.chemistry;

export const XRClassroom: React.FC<Props> = ({ onRequestAITutor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  // The class being taught follows the school's shared subject signal (set by
  // the Immersive Lab / labs); the student can also switch deck directly here.
  const [subjectId, setSubjectId] = useState<string>(() => getCurrentSubjectId());
  const lesson: SubjectLesson = SUBJECT_LESSONS[subjectId] ?? DEFAULT_LESSON;
  const [hologramModel, setHologramModel] = useState<HologramKind>(lesson.defaultHologram);
  const [seatView, setSeatView] = useState<'front' | 'balcony' | 'teacher'>('front');
  const [ambientAudio, setAmbientAudio] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'Professor KEV', text: 'Welcome students! Find your seat and we will begin today’s demonstration.', time: '10:00 AM' },
    { sender: 'Maya K.', text: 'The 3D hologram makes this so much clearer than the textbook diagram!', time: '10:02 AM' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Switching class resets the deck and the hologram to that subject's opener.
  const selectSubject = (id: string) => {
    setSubjectId(id);
    setCurrentSubjectId(id);
    const next = SUBJECT_LESSONS[id] ?? DEFAULT_LESSON;
    setCurrentSlideIndex(0);
    setHologramModel(next.defaultHologram);
  };

  // Studio-grade renderer: PMREM/IBL + ACES + three-point lighting + PCF soft
  // shadows + a dirty-flag loop — the same baseline the atlas, vehicle and
  // subject viewers use, so the auditorium matches the rest of the school.
  // Hologram spin, teacher breathing and OrbitControls damping mark the loop
  // as animating; idle frames render nothing.
  const threeRef = useRef<{
    studio: StudioHandle;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    hologramGroup: THREE.Group;
    floatingReactions: THREE.Group;
    teacherMesh: THREE.Group;
  } | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;

    let studio: StudioHandle;
    try {
      studio = createStudio(host, {
        theme: 'dark',
        stage: null, // the classroom builds its own stage + floor
        grid: false,
        fov: 50,
        cameraPosition: [0, 2.2, 4.5],
        target: [0, 2.0, -2.5],
        minDistance: 1.2,
        maxDistance: 22,
        shadows: true,
      });
    } catch {
      return undefined; // host reports WebGL-unavailable via the studio; nothing to clean up
    }
    const { scene, camera, controls } = studio;
    controls.enablePan = false;
    // Seat views are driven by state (see the seatView effect); keep the
    // studio's damping for smooth orbiting between them.
    controls.target.set(0, 2.0, -2.5);

    // --- CLASSROOM ARCHITECTURE BUILD ---
    const applyShadow = (o: THREE.Object3D) => {
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
    };

    // Floor (receives the key-light shadow)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Stage platform + glowing rim
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.2, 0.4, 48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.35 })
    );
    stage.position.set(0, 0.2, -2.5);
    applyShadow(stage);
    scene.add(stage);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.8, 5.0, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.41, -2.5);
    scene.add(ring);

    // Holographic projector base + beam cone
    const holoBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
    );
    holoBase.position.set(0, 0.55, -2.5);
    applyShadow(holoBase);
    scene.add(holoBase);

    const holoCone = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 3.5, 48, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    );
    holoCone.position.set(0, 2.3, -2.5);
    holoCone.rotation.x = Math.PI;
    scene.add(holoCone);

    // Presentation screen + frame
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4, roughness: 0.2 })
    );
    screen.position.set(0, 4.2, -7.0);
    scene.add(screen);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, 4.9, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.4 })
    );
    frame.position.set(0, 4.2, -7.1);
    applyShadow(frame);
    scene.add(frame);

    // Tiered student desks + holographic terminals + classmates
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 });
    [-3, -1, 1, 3].forEach((xPos, idx) => {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.6), deskMat);
      desk.position.set(xPos, 0.45, 3.0);
      applyShadow(desk);
      scene.add(desk);
      const tablet = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.04, 0.35),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      tablet.position.set(xPos, 0.92, 3.0);
      scene.add(tablet);
      if (idx !== 1) {
        const avatar = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), seatMat);
        avatar.position.set(xPos, 1.4, 3.7);
        applyShadow(avatar);
        scene.add(avatar);
      }
    });
    [-3.2, -1.1, 1.1, 3.2].forEach((xPos) => {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.6), deskMat);
      desk.position.set(xPos, 0.7, 6.0);
      applyShadow(desk);
      scene.add(desk);
      const avatar = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), seatMat);
      avatar.position.set(xPos, 1.8, 6.7);
      applyShadow(avatar);
      scene.add(avatar);
    });

    // Teacher avatar at the podium
    const teacherGroup = new THREE.Group();
    const tHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.25, metalness: 0.2 })
    );
    tHead.position.set(0, 1.9, 0);
    teacherGroup.add(tHead);
    const tBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.4, metalness: 0.2 })
    );
    tBody.position.set(0, 1.0, 0);
    teacherGroup.add(tBody);
    teacherGroup.position.set(-2.8, 0.4, -2.5);
    applyShadow(teacherGroup);
    scene.add(teacherGroup);

    // Floating hologram + reactions
    const hologramGroup = new THREE.Group();
    hologramGroup.position.set(0, 2.4, -2.5);
    scene.add(hologramGroup);
    const floatingReactions = new THREE.Group();
    scene.add(floatingReactions);

    // Stage spot (adds to the studio's three-point set)
    const stageLight = new THREE.SpotLight(0x38bdf8, 3.0, 20, Math.PI / 4, 0.3);
    stageLight.position.set(0, 8, -1);
    stageLight.target = stage;
    scene.add(stageLight);

    studio.refreshShadows();
    studio.invalidate();

    // Per-frame hook: spin the hologram, breathe the teacher. Returning true
    // keeps the loop rendering (damping + animation); reduced-motion keeps
    // damping but drops the continuous spin/bob.
    studio.onFrame((dt: number) => {
      if (!studio.reducedMotion) {
        hologramGroup.rotation.y += dt * 0.9;
        hologramGroup.position.y = 2.4 + Math.sin(performance.now() / 500) * 0.08;
        teacherGroup.position.y = 0.4 + Math.sin(performance.now() / 667) * 0.03;
      }
      return true; // OrbitControls damping needs continuous frames
    });

    threeRef.current = { studio, scene, camera, hologramGroup, floatingReactions, teacherMesh: teacherGroup };

    return () => {
      threeRef.current = null;
      studio.dispose();
    };
  }, []);

  // Update central 3D hologram model based on selection. Rebuilding the group
  // is a scene change, so mark the studio dirty to paint the new hologram.
  useEffect(() => {
    if (!threeRef.current) return;
    const { studio, hologramGroup } = threeRef.current;
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
    studio.invalidate();
  }, [hologramModel]);

  // Update Camera View according to selected seat perspective. OrbitControls
  // owns the camera orientation, so a seat change sets position + target and
  // re-renders (damping eases the move) rather than calling lookAt, which the
  // controls would immediately overwrite.
  useEffect(() => {
    if (!threeRef.current) return;
    const { studio, camera } = threeRef.current;
    const { controls } = studio;

    if (seatView === 'front') {
      camera.position.set(0, 2.2, 4.5);
      controls.target.set(0, 2.0, -2.5);
    } else if (seatView === 'balcony') {
      camera.position.set(0, 5.5, 8.5);
      controls.target.set(0, 2.2, -2.5);
    } else if (seatView === 'teacher') {
      camera.position.set(-2.5, 2.4, -2.2);
      controls.target.set(0, 1.8, 4.5);
    }
    controls.update();
    studio.invalidate();
  }, [seatView]);

  // Send spatial chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const question = chatInput;
    const newMsg = {
      sender: 'You (Student)',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Real faculty answer via the XR tutor API; clearly labeled offline
    // guidance when the backend is unreachable (never a fake live reply).
    fetch(xrApi('/tutor'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
      body: JSON.stringify({
        question,
        currentLab: 'XR Auditorium',
        context: `Student asked a question during a live ${lesson.module} session in the XR Auditorium at KEV XR Science Academy (current slide: ${lesson.slides[currentSlideIndex].title}).`,
        studentLevel: getStudyLevelId(),
        tier: getTierId(),
        language: getAnswerLanguage(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: data?.isDemoGuidance ? 'Professor KEV (offline guidance)' : 'Professor KEV',
            text: data?.answer || 'Let’s observe the holographic demonstration and connect it to the theory.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      })
      .catch(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'Professor KEV (offline guidance)',
            text: 'Great scientific observation! Watch how the 3D projection changes as you orbit — note one pattern and bring it to your next live session.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      });
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
            <p className="text-xs text-slate-400">{lesson.module}</p>
          </div>
        </div>

        {/* Class / subject switcher: the auditorium teaches the student's
            current class; switching here updates the shared school signal. */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <span className="hidden lg:inline text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1.5">
            Class
          </span>
          <select
            value={subjectId in SUBJECT_LESSONS ? subjectId : 'chemistry'}
            onChange={(e) => selectSubject(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-indigo-300 border border-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:border-indigo-500"
            title="Choose the class this auditorium is teaching"
            aria-label="Class taught in this auditorium"
          >
            {Object.keys(SUBJECT_LESSONS).map((id) => (
              <option key={id} value={id} className="capitalize">
                {SUBJECT_LESSONS[id].module.replace(/^Module \d+:\s*/, '')}
              </option>
            ))}
          </select>
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
              <span>Slide {currentSlideIndex + 1}</span> / {lesson.slides.length}
            </div>
          </div>

          <h4 className="font-bold text-white text-sm leading-snug mb-1">
            {lesson.slides[currentSlideIndex].title}
          </h4>
          <p className="text-xs text-cyan-300 font-medium mb-2.5">
            {lesson.slides[currentSlideIndex].subtitle}
          </p>

          <ul className="space-y-1.5 text-xs text-slate-300">
            {lesson.slides[currentSlideIndex].bulletPoints.map((bp, i) => (
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
              onClick={() => setCurrentSlideIndex((prev) => Math.min(lesson.slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === lesson.slides.length - 1}
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
                `Hello Professor KEV! I am in the XR Science Classroom watching Slide ${currentSlideIndex + 1}: ${lesson.slides[currentSlideIndex].title}. Can you provide a detailed explanation with questions for our study group?`
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
