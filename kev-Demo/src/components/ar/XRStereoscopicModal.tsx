import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Eye, Compass, Smartphone, Sparkles } from 'lucide-react';
import { LabId } from '../../types';

interface Props {
  activeLab: LabId;
  onClose: () => void;
}

export const XRStereoscopicModal: React.FC<Props> = ({ activeLab, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ipdOffset, setIpdOffset] = useState<number>(0.064); // standard 64mm IPD
  const [deviceOrientationActive, setDeviceOrientationActive] = useState<boolean>(false);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    cameraLeft: THREE.PerspectiveCamera;
    cameraRight: THREE.PerspectiveCamera;
    modelGroup: THREE.Group;
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);

    // Left & Right Stereoscopic Cameras with IPD offset
    const aspect = (width / 2) / height;
    const cameraLeft = new THREE.PerspectiveCamera(65, aspect, 0.1, 100);
    const cameraRight = new THREE.PerspectiveCamera(65, aspect, 0.1, 100);

    cameraLeft.position.set(-ipdOffset / 2, 0, 3.5);
    cameraRight.position.set(ipdOffset / 2, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClear = false;
    containerRef.current.replaceChildren(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(4, 6, 4);
    scene.add(dirLight);

    // Grid Floor
    const grid = new THREE.GridHelper(16, 16, 0x38bdf8, 0x1e293b);
    grid.position.y = -1.8;
    scene.add(grid);

    // Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 3D Model depending on active lab
    if (activeLab === 'chemistry') {
      const oGeo = new THREE.SphereGeometry(0.7, 32, 32);
      const oMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.1 });
      const oMesh = new THREE.Mesh(oGeo, oMat);
      modelGroup.add(oMesh);

      const hGeo = new THREE.SphereGeometry(0.45, 24, 24);
      const hMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.1 });
      const h1 = new THREE.Mesh(hGeo, hMat);
      h1.position.set(-1.2, -0.7, 0);
      modelGroup.add(h1);

      const h2 = new THREE.Mesh(hGeo, hMat);
      h2.position.set(1.2, -0.7, 0);
      modelGroup.add(h2);
    } else if (activeLab === 'astrophysics') {
      const sunGeo = new THREE.SphereGeometry(0.8, 24, 24);
      const sun = new THREE.Mesh(sunGeo, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      modelGroup.add(sun);

      const pGeo = new THREE.SphereGeometry(0.3, 20, 20);
      const p = new THREE.Mesh(pGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      p.position.set(2.0, 0, 0);
      modelGroup.add(p);
    } else {
      const gGeo = new THREE.TorusKnotGeometry(0.8, 0.25, 64, 16);
      const gMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.2 });
      const gMesh = new THREE.Mesh(gGeo, gMat);
      modelGroup.add(gMesh);
    }

    // Touch / Gyroscope / Drag controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let euler = new THREE.Euler(0, 0, 0, 'YXZ');

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      euler.y -= dx * 0.005;
      euler.x -= dy * 0.005;
      cameraLeft.quaternion.setFromEuler(euler);
      cameraRight.quaternion.setFromEuler(euler);
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Device orientation support for mobile VR headsets
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        setDeviceOrientationActive(true);
        const alpha = THREE.MathUtils.degToRad(e.alpha);
        const beta = THREE.MathUtils.degToRad(e.beta);
        const gamma = THREE.MathUtils.degToRad(e.gamma);
        euler.set(beta, alpha, -gamma, 'YXZ');
        cameraLeft.quaternion.setFromEuler(euler);
        cameraRight.quaternion.setFromEuler(euler);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    // Animation Loop: Render Left Viewport then Right Viewport
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      modelGroup.rotation.y += 0.008;

      const halfW = width / 2;
      renderer.clear();

      // Left Eye
      renderer.setViewport(0, 0, halfW, height);
      renderer.setScissor(0, 0, halfW, height);
      renderer.setScissorTest(true);
      renderer.render(scene, cameraLeft);

      // Right Eye
      renderer.setViewport(halfW, 0, halfW, height);
      renderer.setScissor(halfW, 0, halfW, height);
      renderer.setScissorTest(true);
      renderer.render(scene, cameraRight);
    };

    animId = requestAnimationFrame(animate);

    threeRef.current = { renderer, scene, cameraLeft, cameraRight, modelGroup, animId };

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      renderer.dispose();
    };
  }, [activeLab, ipdOffset]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in select-none">
      {/* VR Viewer Center Divider Line */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-800 pointer-events-none z-20" />

      {/* Crosshair Center Reticles for Each Eye */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-cyan-400/50 rounded-full pointer-events-none z-20" />
      <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-cyan-400/50 rounded-full pointer-events-none z-20" />

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Stereoscopic XR Mode (Dual Eye)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            {deviceOrientationActive ? 'Gyroscope Active' : 'Drag / Mouse Look'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs border border-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
          Exit VR Mode
        </button>
      </div>

      {/* Stereoscopic Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-move" />

      {/* Bottom Guidance Pill */}
      <div className="absolute bottom-4 z-30 p-2.5 px-4 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-cyan-400" />
        <span>Insert phone into mobile VR headset (Cardboard / Daydream / Meta Quest) for 3D depth perception.</span>
      </div>
    </div>
  );
};
