/**
 * Type declarations for `src/lib/studio/studioRenderer.js`.
 *
 * The studio renderer is plain JavaScript shared with the JS-only immersive
 * pages, but `src/xr/components/classroom/XRClassroom.tsx` consumes it under
 * `strict`. These declarations describe the public surface of `createStudio`
 * exactly as implemented; they change no runtime behaviour.
 */

import type * as THREE from 'three';

export interface StudioTheme {
  background: string;
  fog: { color: string; near: number; far: number } | null;
  exposure: number;
  hemi: { sky: number; ground: number; intensity: number };
  key: { color: number; intensity: number; position: [number, number, number] };
  rim: { color: number; intensity: number; position: [number, number, number] };
  accent: { color: number; intensity: number; distance: number; position: [number, number, number] } | null;
  ground: { color: number; roughness: number; metalness: number } | null;
  plinth: { color: number; metalness: number; roughness: number } | null;
  ring: { color: number; metalness: number; roughness: number } | null;
  grid: { main: number; sub: number; opacity: number } | null;
}

export const STUDIO_THEMES: Record<'dark' | 'space' | 'light', StudioTheme>;

export interface CreateStudioOptions {
  theme?: 'dark' | 'space' | 'light';
  background?: string;
  fog?: { color: string; near: number; far: number } | null;
  exposure?: number;
  shadows?: boolean;
  fov?: number;
  cameraPosition?: [number, number, number];
  target?: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
  maxPolarAngle?: number;
  minPolarAngle?: number;
  stage?: 'plinth' | 'platform' | 'ground' | null;
  stageRadius?: number;
  grid?: boolean;
  onContextLost?: (message: string) => void;
}

export interface StudioHandle {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls;
  stageGroup: THREE.Group;
  grid: THREE.GridHelper | null;
  keyLight: THREE.DirectionalLight;
  envTexture: THREE.Texture;
  reducedMotion: boolean;
  coarsePointer: boolean;
  host: HTMLElement;
  invalidate(): void;
  onFrame(cb: (dt: number) => boolean | void): void;
  onPostRender(cb: () => void): void;
  onResize(cb: (aspect: number) => void): void;
  refreshShadows(): void;
  dispose(): void;
}

export function createStudio(host: HTMLElement, opts?: CreateStudioOptions): StudioHandle;

export function clampNum(v: unknown, min: number, max: number): number;
