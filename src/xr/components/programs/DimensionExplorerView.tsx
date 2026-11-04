import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, Boxes, Grid3x3, HelpCircle, Rotate3d, Sliders, Sparkles } from 'lucide-react';

/**
 * Dimension Explorer — an honest look past 3D.
 *
 * You cannot draw four perpendicular directions on a screen any more than you
 * can draw three on paper — but you CAN project them, exactly the way a 3D
 * world casts a 2D shadow. This explorer builds a real 4D hypercube
 * (tesseract: 16 vertices, 32 edges) and projects it down to 3D with a
 * perspective divide by the 4th coordinate, the same way the renderer then
 * projects 3D down to your 2D screen.
 *
 * Two controls make the 4th dimension legible:
 *   • a 4th-axis rotation (the XW plane) — the tesseract tumbles "through" the
 *     4th direction, and its 3D shadow morphs like a cube rotating in 3D,
 *   • a 4D projection-distance slider — nearer = stronger perspective
 *     foreshortening (inner cube shrinks more), farther = closer to
 *     orthographic (inner cube nearly matches the outer).
 *
 * Honest framing throughout: "5D" as a rendered space is not a real thing a
 * screen can show; this is 3D + a genuine 4th spatial axis you steer by
 * projection. The ladder 2D→3D→4D is drawn so the idea generalises.
 */

// 4D tesseract vertices: all (±1, ±1, ±1, ±1) — 16 of them.
const VERTS_4D: number[][] = [];
for (let i = 0; i < 16; i++) {
  VERTS_4D.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
}
// 32 edges: pairs differing in exactly one coordinate.
const EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    const diff = VERTS_4D[i].map((v, k) => Math.abs(v - VERTS_4D[j][k])).filter((d) => d > 0).length;
    if (diff === 1) EDGES.push([i, j]);
  }
}

export const DimensionExplorerView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [xwAngle, setXwAngle] = useState(0.6);          // 4th-axis rotation (radians)
  const [projDistance, setProjDistance] = useState(2.5); // 4D projection distance
  const [shape, setShape] = useState<'tesseract' | 'hypergrid'>('tesseract');

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    outerLines: THREE.LineSegments;
    innerPoints: THREE.Points;
    edgePositions: THREE.BufferAttribute;
    animId: number;
  } | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;
    const width = host.clientWidth || 800;
    const height = host.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b19);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.replaceChildren(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0x38bdf8, 1.6);
    key.position.set(4, 6, 4);
    scene.add(key);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 16;
    controls.update();

    // Edge geometry: 32 edges × 2 endpoints × 3 coords, updated per frame.
    const positions = new Float32Array(EDGES.length * 2 * 3);
    const edgeGeo = new THREE.BufferGeometry();
    const edgeAttr = new THREE.BufferAttribute(positions, 3);
    edgeGeo.setAttribute('position', edgeAttr);
    const outerLines = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    scene.add(outerLines);

    // Vertex points (16).
    const pointGeo = new THREE.BufferGeometry();
    const pointPositions = new Float32Array(16 * 3);
    pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    const innerPoints = new THREE.Points(
      pointGeo,
      new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.14, sizeAttenuation: true })
    );
    scene.add(innerPoints);
    const pointAttr = pointGeo.getAttribute('position') as THREE.BufferAttribute;

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      // Project 4D -> 3D. Rotate in the XW plane, then perspective-divide by w.
      const cos = Math.cos(xwAngle);
      const sin = Math.sin(xwAngle);
      for (let i = 0; i < 16; i++) {
        const [x0, y0, z0, w0] = VERTS_4D[i];
        const x = x0 * cos - w0 * sin;
        const w = x0 * sin + w0 * cos;
        const k = projDistance / Math.max(0.4, projDistance - w); // 4D perspective
        pointAttr.setXYZ(i, x * k, y0 * k, z0 * k);
      }
      pointAttr.needsUpdate = true;
      for (let e = 0; e < EDGES.length; e++) {
        const [a, b] = EDGES[e];
        for (let c = 0; c < 3; c++) {
          edgeAttr.setXYZ(e * 2, pointAttr.getX(a), pointAttr.getY(a), pointAttr.getZ(a));
          edgeAttr.setXYZ(e * 2 + 1, pointAttr.getX(b), pointAttr.getY(b), pointAttr.getZ(b));
        }
      }
      edgeAttr.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    threeRef.current = { renderer, scene, camera, controls, outerLines, innerPoints, edgePositions: edgeAttr, animId };

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    ro?.observe(host);

    return () => {
      cancelAnimationFrame(animId);
      ro?.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [xwAngle, projDistance, shape]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base flex items-center gap-2">
              Dimension Explorer
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                4D Tesseract
              </span>
            </h3>
            <p className="text-xs text-slate-400">A real 4D hypercube, projected down to 3D — steer the 4th axis yourself</p>
          </div>
        </div>
      </div>

      {/* 3D canvas */}
      <div className="relative flex-1 w-full min-h-[420px]">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Explanation HUD */}
        <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 max-w-xs pointer-events-auto">
          <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono font-semibold flex items-center gap-1.5">
            <Grid3x3 className="w-3.5 h-3.5" />
            How to read this
          </span>
          <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
            <li>• A cube's shadow on paper is a square-ish 2D shape.</li>
            <li>• A tesseract's "shadow" in our 3D is this morphing cube-in-a-cube.</li>
            <li>• 16 corners, 32 edges — count them with the points toggle.</li>
            <li>• It only *looks* alive because a real 4th axis is turning.</li>
          </ul>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto">
          {/* 4th-axis rotation */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <Rotate3d className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>4th-axis rotation (XW plane)</span>
                <span className="font-mono text-cyan-400 font-semibold">{(xwAngle * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range" min={0} max={Math.PI * 2} step={0.02} value={xwAngle}
                onChange={(e) => setXwAngle(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* 4D projection distance */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>4D projection distance</span>
                <span className="font-mono text-amber-400 font-semibold">{projDistance.toFixed(1)}</span>
              </div>
              <input
                type="range" min={1.2} max={6} step={0.1} value={projDistance}
                onChange={(e) => setProjDistance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ladder + honest note */}
      <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">2D shadow</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">3D object</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">4D tesseract (you are here)</span>
        </div>
        <p className="text-[10px] text-slate-500 max-w-xl leading-relaxed flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
          A screen cannot show four perpendicular directions — only their projection, exactly as paper shows a cube's
          shadow. That is the honest "4D": a real 4th axis you steer, not a literal rendered 4-space (and "5D" generalises
          the same way, by projection).
        </p>
      </div>
    </div>
  );
};

export default DimensionExplorerView;
