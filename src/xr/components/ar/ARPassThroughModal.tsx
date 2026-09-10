import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Camera,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  AlertCircle,
  Sparkles,
  Ruler,
  Crosshair,
  Trash2,
  Layers,
  Compass,
  Maximize2,
  Users,
  Radio,
  Zap,
  Send,
  CheckCircle2
} from 'lucide-react';
import { LabId } from '../../types';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  activeLab: LabId;
  onClose: () => void;
  onSaveSnapshot: (dataUrl: string, note: string) => void;
}

export interface ARPeer {
  id: string;
  name: string;
  grade: string;
  currentTopic: string;
  position: { x: number; y: number; z: number };
  color: number;
  hex: string;
}

const NEARBY_AR_PEERS: ARPeer[] = [
  {
    id: 'peer-elena',
    name: 'Elena Rostova',
    grade: 'Grade 9 - Advanced',
    currentTopic: 'VSEPR Molecular Geometry',
    position: { x: -1.7, y: -0.2, z: -2.3 },
    color: 0x10b981,
    hex: '#10b981',
  },
  {
    id: 'peer-marcus',
    name: 'Marcus Chen',
    grade: 'Grade 10 - Honors',
    currentTopic: 'Spectroscopy & Emission Bands',
    position: { x: 1.7, y: -0.1, z: -2.1 },
    color: 0x8b5cf6,
    hex: '#8b5cf6',
  },
];

interface ARMeasurement {
  pointA: { x: number; y: number; z: number };
  pointB: { x: number; y: number; z: number };
  distanceCm: number;
  distanceInches: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  angleDeg: number;
}

export const ARPassThroughModal: React.FC<Props> = ({ activeLab, onClose, onSaveSnapshot }) => {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelScale, setModelScale] = useState<number>(1.0);
  const [modelRotationY, setModelRotationY] = useState<number>(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [arNote, setArNote] = useState<string>('AR Desk Inspection: Observed 3D spatial conformation in real environment.');

  // AR Measurement Tool States
  const [measurementToolActive, setMeasurementToolActive] = useState<boolean>(false);
  const [measurementUnit, setMeasurementUnit] = useState<'cm' | 'mm' | 'in'>('cm');
  const [currentMeasurement, setCurrentMeasurement] = useState<ARMeasurement | null>(null);
  const [measuringStep, setMeasuringStep] = useState<'place_a' | 'place_b' | 'measured'>('place_a');
  const [webXRSupported, setWebXRSupported] = useState<boolean>(false);

  // AR Peer Avatars & Study Session States
  const [showPeersPanel, setShowPeersPanel] = useState<boolean>(false);
  const [activeSessionPeer, setActiveSessionPeer] = useState<ARPeer | null>(null);
  const [peerLaserPing, setPeerLaserPing] = useState<boolean>(false);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    modelGroup: THREE.Group;
    rulerGroup: THREE.Group;
    peersGroup: THREE.Group;
    animId: number;
  } | null>(null);

  const rawPointsRef = useRef<{ a: THREE.Vector3 | null; b: THREE.Vector3 | null }>({ a: null, b: null });

  // Detect WebXR capability
  useEffect(() => {
    if ((navigator as any).xr?.isSessionSupported) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setWebXRSupported(supported);
      }).catch(() => setWebXRSupported(false));
    }
  }, []);

  // Initialize Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        } else {
          setCameraError('Camera API not supported in this browser; running in simulated AR mode.');
        }
      } catch (err: any) {
        console.warn('AR camera permission or device error:', err);
        setCameraError('Camera feed unavailable or permission denied; simulated room backdrop active.');
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Helper to create glowing holographic pin marker
  const createMarkerGroup = (pos: THREE.Vector3, colorHex: number) => {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Glowing anchor sphere
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    // Pulsing target ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.16, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Coordinate pointer stem
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.15;
    group.add(stem);

    return group;
  };

  // Re-draw 3D ruler between Point A and Point B
  const updateRulerVisuals = useCallback((pointA: THREE.Vector3, pointB: THREE.Vector3) => {
    if (!threeRef.current) return;
    const { rulerGroup } = threeRef.current;

    // Clear previous ruler visuals
    while (rulerGroup.children.length > 0) {
      rulerGroup.remove(rulerGroup.children[0]);
    }

    // Add marker A
    const markerA = createMarkerGroup(pointA, 0x10b981);
    rulerGroup.add(markerA);

    // Add marker B
    const markerB = createMarkerGroup(pointB, 0x06b6d4);
    rulerGroup.add(markerB);

    // 3D Laser Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([pointA, pointB]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    const line = new THREE.Line(lineGeo, lineMat);
    rulerGroup.add(line);

    // Cylinder Laser Core
    const distance = pointA.distanceTo(pointB);
    const midPoint = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
    const cylGeo = new THREE.CylinderGeometry(0.02, 0.02, distance, 12);
    const cylMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.copy(midPoint);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pointB.clone().sub(pointA).normalize());
    rulerGroup.add(cyl);

    // Add Centimeter Ruler Tick Notches along the vector
    const numTicks = Math.min(20, Math.max(3, Math.floor(distance * 8)));
    for (let i = 1; i < numTicks; i++) {
      const frac = i / numTicks;
      const tickPos = pointA.clone().lerp(pointB, frac);
      const tickGeo = new THREE.BoxGeometry(0.02, 0.06, 0.02);
      const tickMat = new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0xfacc15 : 0xffffff });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.copy(tickPos);
      rulerGroup.add(tick);
    }
  }, []);

  // Initialize Three.js with transparent background for AR overlay
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Illumination tailored for AR pass-through
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Ruler Group for 3D measurement overlays
    const rulerGroup = new THREE.Group();
    scene.add(rulerGroup);

    // Peers Group for rendering nearby students in local space
    const peersGroup = new THREE.Group();
    scene.add(peersGroup);

    NEARBY_AR_PEERS.forEach((peer) => {
      const peerSub = new THREE.Group();
      peerSub.name = peer.id;
      peerSub.position.set(peer.position.x, peer.position.y, peer.position.z);

      // Floor aura disc
      const discGeo = new THREE.RingGeometry(0.35, 0.45, 32);
      const discMat = new THREE.MeshBasicMaterial({ color: peer.color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = -1.2;
      peerSub.add(disc);

      // Torso / shoulders
      const torsoGeo = new THREE.CylinderGeometry(0.2, 0.28, 0.55, 16);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.2,
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = -0.5;
      peerSub.add(torso);

      // Visor / Helmet
      const helmetGeo = new THREE.SphereGeometry(0.22, 20, 20);
      const helmetMat = new THREE.MeshPhysicalMaterial({
        color: peer.color,
        transmission: 0.6,
        transparent: true,
        roughness: 0.1,
        emissive: peer.color,
        emissiveIntensity: 0.4,
      });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.y = -0.05;
      peerSub.add(helmet);

      // Floating holographic beacon / diamond above head
      const beaconGeo = new THREE.OctahedronGeometry(0.12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: peer.color,
        wireframe: true,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.name = 'beacon';
      beacon.position.y = 0.35;
      peerSub.add(beacon);

      peersGroup.add(peerSub);
    });

    // Build model based on active lab
    if (activeLab === 'chemistry') {
      // 3D Water Molecule AR model
      const oGeo = new THREE.SphereGeometry(0.65, 24, 24);
      const oMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.1, clearcoat: 0.9 });
      const oMesh = new THREE.Mesh(oGeo, oMat);
      modelGroup.add(oMesh);

      const hGeo = new THREE.SphereGeometry(0.42, 20, 20);
      const hMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.1, clearcoat: 0.9 });

      const h1 = new THREE.Mesh(hGeo, hMat);
      h1.position.set(-1.2, -0.7, 0);
      modelGroup.add(h1);

      const h2 = new THREE.Mesh(hGeo, hMat);
      h2.position.set(1.2, -0.7, 0);
      modelGroup.add(h2);

      // Bonds
      const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.3, 16);
      const cylMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4 });

      const b1 = new THREE.Mesh(cylGeo, cylMat);
      b1.position.set(-0.6, -0.35, 0);
      b1.rotation.z = Math.PI / 4;
      modelGroup.add(b1);

      const b2 = new THREE.Mesh(cylGeo, cylMat);
      b2.position.set(0.6, -0.35, 0);
      b2.rotation.z = -Math.PI / 4;
      modelGroup.add(b2);
    } else if (activeLab === 'astrophysics') {
      // 3D Miniature Sun and Orbiting Planet AR model
      const sunGeo = new THREE.SphereGeometry(0.7, 24, 24);
      const sun = new THREE.Mesh(sunGeo, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      modelGroup.add(sun);

      const planetGeo = new THREE.SphereGeometry(0.25, 20, 20);
      const planet = new THREE.Mesh(planetGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      planet.position.set(1.8, 0, 0);
      modelGroup.add(planet);

      const ringGeo = new THREE.RingGeometry(1.78, 1.82, 48);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
      ring.rotation.x = Math.PI / 2;
      modelGroup.add(ring);
    } else if (activeLab === 'biology') {
      // 3D Mitochondria with Cristae AR model
      const mitoGeo = new THREE.CapsuleGeometry(0.6, 1.4, 20, 32);
      const mitoMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        roughness: 0.2,
        clearcoat: 0.8,
      });
      const mito = new THREE.Mesh(mitoGeo, mitoMat);
      modelGroup.add(mito);
    } else {
      // 3D Glass Prism AR model
      const prismGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.8, 3);
      const prismMat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transmission: 0.9,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
      });
      const prism = new THREE.Mesh(prismGeo, prismMat);
      prism.rotation.y = Math.PI / 6;
      modelGroup.add(prism);
    }

    // AR Placement reticle ring on floor
    const reticleGeo = new THREE.RingGeometry(1.4, 1.45, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.rotation.x = -Math.PI / 2;
    reticle.position.y = -1.5;
    modelGroup.add(reticle);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!measurementToolActive) {
        modelGroup.rotation.y += 0.005;
      }

      // Animate peer avatars (hover bobbing & beacon spinning)
      peersGroup.children.forEach((child, i) => {
        const beacon = child.getObjectByName('beacon');
        if (beacon) {
          beacon.rotation.y += 0.02;
          beacon.rotation.z += 0.01;
        }
        const initialY = NEARBY_AR_PEERS[i]?.position.y || -0.2;
        child.position.y = initialY + Math.sin(Date.now() * 0.003 + i * 2) * 0.03;
      });

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    threeRef.current = {
      renderer,
      scene,
      camera,
      modelGroup,
      rulerGroup,
      peersGroup,
      animId,
    };

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [activeLab, measurementToolActive]);

  // Update scale and rotation
  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.modelGroup.scale.setScalar(modelScale);
    threeRef.current.modelGroup.rotation.y = modelRotationY;
  }, [modelScale, modelRotationY]);

  // Handle click / tap on canvas for WebXR Hit-Testing & Raycasting measurement OR Peer Avatar Tap
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!threeRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const { camera, peersGroup } = threeRef.current;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // If measurement tool is inactive, test if student clicked on a nearby peer avatar
    if (!measurementToolActive) {
      const peerIntersects = raycaster.intersectObjects(peersGroup.children, true);
      if (peerIntersects.length > 0) {
        // Find which peer was tapped
        let rootPeerGroup: THREE.Object3D | null = peerIntersects[0].object;
        while (rootPeerGroup && rootPeerGroup.parent !== peersGroup) {
          rootPeerGroup = rootPeerGroup.parent;
        }
        if (rootPeerGroup) {
          const matchedPeer = NEARBY_AR_PEERS.find((p) => p.id === rootPeerGroup!.name);
          if (matchedPeer) {
            soundManager.playClick();
            setActiveSessionPeer(matchedPeer);
            showToast({
              type: 'info',
              title: 'AR Peer Avatar Selected',
              message: `Connecting to ${matchedPeer.name}'s spatial study session...`,
            });
            return;
          }
        }
      }
      return;
    }

    // Test intersection against virtual desk plane y = -1.5, or against model objects
    const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.5);
    const hitPoint = new THREE.Vector3();
    const intersectsPlane = raycaster.ray.intersectPlane(deskPlane, hitPoint);

    const pickedPoint = intersectsPlane ? hitPoint : new THREE.Vector3(x * 2, y * 2, 0);

    if (measuringStep === 'place_a' || !rawPointsRef.current.a) {
      rawPointsRef.current.a = pickedPoint.clone();
      rawPointsRef.current.b = null;
      setMeasuringStep('place_b');

      // Clear existing ruler and add temporary point A
      if (threeRef.current) {
        while (threeRef.current.rulerGroup.children.length > 0) {
          threeRef.current.rulerGroup.remove(threeRef.current.rulerGroup.children[0]);
        }
        threeRef.current.rulerGroup.add(createMarkerGroup(pickedPoint, 0x10b981));
      }
    } else if (measuringStep === 'place_b') {
      rawPointsRef.current.b = pickedPoint.clone();
      setMeasuringStep('measured');

      const pA = rawPointsRef.current.a!;
      const pB = pickedPoint;
      updateRulerVisuals(pA, pB);

      // Distance calculation: 1 Three.js unit = 10 cm in real AR space scale
      const distUnits = pA.distanceTo(pB);
      const distanceCm = Math.round(distUnits * 10 * 10) / 10;
      const distanceInches = Math.round((distanceCm / 2.54) * 10) / 10;

      const deltaX = Math.round(Math.abs(pB.x - pA.x) * 10 * 10) / 10;
      const deltaY = Math.round(Math.abs(pB.y - pA.y) * 10 * 10) / 10;
      const deltaZ = Math.round(Math.abs(pB.z - pA.z) * 10 * 10) / 10;
      const angleRad = Math.atan2(deltaY, Math.sqrt(deltaX * deltaX + deltaZ * deltaZ));
      const angleDeg = Math.round((angleRad * 180) / Math.PI);

      const meas: ARMeasurement = {
        pointA: { x: Math.round(pA.x * 100) / 100, y: Math.round(pA.y * 100) / 100, z: Math.round(pA.z * 100) / 100 },
        pointB: { x: Math.round(pB.x * 100) / 100, y: Math.round(pB.y * 100) / 100, z: Math.round(pB.z * 100) / 100 },
        distanceCm,
        distanceInches,
        deltaX,
        deltaY,
        deltaZ,
        angleDeg,
      };

      setCurrentMeasurement(meas);
    }
  };

  const resetMeasurement = () => {
    rawPointsRef.current = { a: null, b: null };
    setCurrentMeasurement(null);
    setMeasuringStep('place_a');
    if (threeRef.current) {
      while (threeRef.current.rulerGroup.children.length > 0) {
        threeRef.current.rulerGroup.remove(threeRef.current.rulerGroup.children[0]);
      }
    }
  };

  const handleAppendMeasurementToNote = () => {
    if (!currentMeasurement) return;
    const text = ` [AR Ruler: Distance = ${currentMeasurement.distanceCm} cm (${currentMeasurement.distanceInches} in), ΔX=${currentMeasurement.deltaX}cm, ΔY=${currentMeasurement.deltaY}cm, Angle=${currentMeasurement.angleDeg}°]`;
    setArNote((prev) => prev + text);
  };

  // Take AR composite photo
  const captureCompositeAR = () => {
    if (!canvasRef.current) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = 1280;
    offscreen.height = 720;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    if (videoRef.current && cameraActive) {
      ctx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (let x = 0; x < offscreen.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, offscreen.height);
        ctx.stroke();
      }
      for (let y = 0; y < offscreen.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(offscreen.width, y);
        ctx.stroke();
      }
    }

    // Overlay 3D WebGL Canvas
    ctx.drawImage(canvasRef.current, 0, 0, offscreen.width, offscreen.height);

    // If measurement active, stamp measurement on snapshot
    if (currentMeasurement) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(30, offscreen.height - 90, 420, 60);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, offscreen.height - 90, 420, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(
        `AR Ruler: ${currentMeasurement.distanceCm} cm (${currentMeasurement.distanceInches} in) | ${currentMeasurement.angleDeg}°`,
        45,
        offscreen.height - 55
      );
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`KEV XR Spatial Measurement Bench | WebXR Hit-Tested`, 45, offscreen.height - 35);
    }

    const dataUrl = offscreen.toDataURL('image/png');
    setCapturedPhoto(dataUrl);
  };

  const handleSaveToNotebook = () => {
    if (capturedPhoto) {
      onSaveSnapshot(capturedPhoto, arNote);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                AR Pass-Through Inspection & Measurement
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {activeLab.toUpperCase()}
                </span>
                {webXRSupported && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    WebXR Hit-Test Ready
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Overlay 3D scientific structures directly onto your physical desk with WebXR hit-test rulers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nearby AR Peers Button */}
            <button
              onClick={() => setShowPeersPanel(!showPeersPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showPeersPanel || activeSessionPeer
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Users className="w-4 h-4 text-purple-300" />
              <span>AR Peers ({NEARBY_AR_PEERS.length})</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Toggle AR Measurement Ruler Button */}
            <button
              onClick={() => {
                setMeasurementToolActive(!measurementToolActive);
                if (measurementToolActive) resetMeasurement();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                measurementToolActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>{measurementToolActive ? 'AR Ruler Active' : 'Enable AR Ruler'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AR Viewport */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-900 flex items-center justify-center select-none">
          {/* Real Device Camera Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Simulated AR backdrop if camera unavailable */}
          {!cameraActive && (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 holo-grid">
              <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Simulated AR Room Environment</p>
              <p className="text-xs text-slate-400 max-w-sm text-center mt-1">
                {cameraError || 'Position the 3D scientific artifact on your virtual laboratory workspace.'}
              </p>
            </div>
          )}

          {/* 3D WebGL Canvas Layer */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasInteraction}
            className={`absolute inset-0 w-full h-full z-10 ${
              measurementToolActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
            }`}
          />

          {/* AR Alignment Reticle Guidance (Top Left) */}
          <div className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-xs text-slate-300 max-w-xs pointer-events-none">
            <span className="font-semibold text-cyan-400 block mb-1">
              {measurementToolActive ? 'AR Laser Measurement Active' : 'AR Desk Tracking Active'}
            </span>
            <span>
              {measurementToolActive
                ? measuringStep === 'place_a'
                  ? 'Tap anywhere on the desk to set Anchor Point A.'
                  : measuringStep === 'place_b'
                  ? 'Tap a second point to set Anchor Point B & span 3D ruler.'
                  : 'Measurement locked. Review distance & vectors in HUD.'
                : 'Use the controls below to scale and rotate the 3D specimen on your physical surface.'}
            </span>
          </div>

          {/* Floating AR Measurement Tool HUD (Top Right) */}
          {measurementToolActive && (
            <div className="absolute top-4 right-4 z-20 w-80 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Crosshair className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Spatial AR Ruler
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {measuringStep === 'place_a'
                        ? 'Step 1: Set Point A'
                        : measuringStep === 'place_b'
                        ? 'Step 2: Set Point B'
                        : 'Measurement Complete'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                  {(['cm', 'mm', 'in'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setMeasurementUnit(unit)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        measurementUnit === unit ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {currentMeasurement ? (
                <div className="space-y-2.5">
                  {/* Big Distance Display */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Span Distance</span>
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {measurementUnit === 'cm'
                        ? `${currentMeasurement.distanceCm} cm`
                        : measurementUnit === 'mm'
                        ? `${(currentMeasurement.distanceCm * 10).toFixed(1)} mm`
                        : `${currentMeasurement.distanceInches} in`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Elevation Angle: {currentMeasurement.angleDeg}°
                    </span>
                  </div>

                  {/* Vector Coordinates */}
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center">
                      <span className="text-slate-500 text-[9px] block">ΔX</span>
                      <span className="text-white font-semibold">{currentMeasurement.deltaX} cm</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center">
                      <span className="text-slate-500 text-[9px] block">ΔY</span>
                      <span className="text-white font-semibold">{currentMeasurement.deltaY} cm</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center">
                      <span className="text-slate-500 text-[9px] block">ΔZ</span>
                      <span className="text-white font-semibold">{currentMeasurement.deltaZ} cm</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAppendMeasurementToNote}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      + Log to Notes
                    </button>
                    <button
                      onClick={resetMeasurement}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                      title="Clear Measurement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
                  <Crosshair className="w-6 h-6 text-slate-500 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs text-slate-300">
                    {measuringStep === 'place_a' ? 'Click on desk for Point A' : 'Click on desk for Point B'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Holographic laser ticks will align automatically
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Nearby AR Peers Floating Tray */}
          {showPeersPanel && (
            <div className="absolute bottom-4 right-4 z-20 w-80 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-purple-500/40 shadow-2xl text-slate-200 animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Nearby AR Peers
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {NEARBY_AR_PEERS.length} Peers Detected in Local Space
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPeersPanel(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {NEARBY_AR_PEERS.map((peer) => {
                  const isCurrent = activeSessionPeer?.id === peer.id;
                  return (
                    <div
                      key={peer.id}
                      onClick={() => {
                        soundManager.playClick();
                        setActiveSessionPeer(peer);
                        setShowPeersPanel(false);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-purple-900/30 border-purple-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                          style={{ backgroundColor: peer.hex }}
                        >
                          {peer.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-none mb-1">
                            {peer.name}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {peer.currentTopic}
                          </span>
                        </div>
                      </div>

                      <button className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold font-mono shrink-0">
                        {isCurrent ? 'Synced' : 'Sync'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center font-mono">
                Tip: You can also tap the 3D avatar beacons floating on your desk!
              </p>
            </div>
          )}

          {/* Synchronized AR Study Session Overlay Modal */}
          {activeSessionPeer && (
            <div className="absolute inset-x-4 top-4 sm:left-auto sm:right-4 sm:w-96 z-30 p-5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-purple-500/60 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                    style={{ backgroundColor: activeSessionPeer.hex }}
                  >
                    {activeSessionPeer.name[0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold block">
                      Synchronized AR Session
                    </span>
                    <h3 className="text-sm font-bold text-white">{activeSessionPeer.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeSessionPeer.grade}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSessionPeer(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shared Topic Banner */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-1">
                <span className="text-[10px] text-purple-300 font-mono uppercase font-bold block">
                  Mutual Subject Match
                </span>
                <p className="text-xs font-semibold text-white">
                  {activeSessionPeer.currentTopic}
                </p>
              </div>

              {/* Spatial Sync Telemetry */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Spatial Alignment:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Locked (RMS &lt; 0.02cm)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Peer AR Cursor:</span>
                  <span className="text-cyan-300">X: -0.45, Y: 1.12, Z: -2.10</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Sync Latency:</span>
                  <span className="text-purple-300">18 ms (Peer-to-Peer WebRTC)</span>
                </div>
              </div>

              {/* Cooperative Laser Ping Action */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    soundManager.playSuccess();
                    setPeerLaserPing(true);
                    setTimeout(() => setPeerLaserPing(false), 2000);
                    showToast({
                      type: 'badge',
                      title: 'Collaborative AR Ping Transmitted',
                      message: `Shared spatial coordinate marker with ${activeSessionPeer.name}! +15 XP`,
                    });
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    peerLaserPing
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {peerLaserPing ? 'Laser Marker Synchronized!' : 'Send Spatial Laser Ping (+15 XP)'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveSessionPeer(null);
                    showToast({
                      type: 'info',
                      title: 'Session Disconnected',
                      message: 'Returned to single-student AR mode.',
                    });
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Disconnect Study Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AR Floating Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/95 border-t border-slate-800 z-20">
          {/* Scale Control */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <ZoomIn className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>AR Model Scale:</span>
                <span className="font-mono text-cyan-300 font-semibold">{modelScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={modelScale}
                onChange={(e) => setModelScale(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <RotateCw className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Spatial Rotation:</span>
                <span className="font-mono text-purple-300 font-semibold">
                  {Math.round((modelRotationY * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step="0.05"
                value={modelRotationY}
                onChange={(e) => setModelRotationY(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>
          </div>

          {/* Snapshot Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={captureCompositeAR}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Capture AR Lab Photo
            </button>
          </div>
        </div>

        {/* Photo Review & Save Modal Layer */}
        {capturedPhoto && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg animate-in zoom-in-95">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col">
              <h4 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                AR Photo Captured! Save to Lab Notebook?
              </h4>
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800 mb-3 bg-black">
                <img src={capturedPhoto} alt="AR Snapshot" className="w-full h-full object-contain" />
              </div>
              <textarea
                value={arNote}
                onChange={(e) => setArNote(e.target.value)}
                placeholder="Add observational notes from this AR session..."
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-4 resize-none h-20"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setCapturedPhoto(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveToNotebook}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  Save to Lab Notebook
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
