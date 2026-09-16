/**
 * Shared construction kit for the KEV 3D campus.
 *
 * Everything the hallway, the subject floors and the virtual-school building
 * need in common lives here: canvas signage, doors, glazing, emissive coves,
 * holograms, lockers, benches and light shafts. Builders return plain
 * `THREE.Object3D`s and register anything animated or interactive on a
 * `CampusBuildResult`, so the scene owner drives one update loop and one
 * raycaster for the whole school.
 *
 * All materials are PBR and pick up the IBL environment set by
 * `HighFidelityRenderer`, which is what makes them read as stone, glass and
 * brushed metal rather than flat colours.
 */

import * as THREE from 'three';
import type { TierSettings } from './highFidelityRenderer';
import {
  applyPbrSet,
  createBrushedMetal,
  createConcrete,
  createTerrazzoMarble,
  createWalnutWood,
  createAcousticPanel,
  createVinylTile,
  createCarpetRunner,
  createFrostedGlass,
  type TextureResolution,
} from './proceduralTextures';

export interface CampusUpdateable {
  object: THREE.Object3D;
  update: (deltaSeconds: number, elapsedSeconds: number) => void;
}

export interface CampusBuildResult {
  group: THREE.Group;
  /** Animated objects; call every `update` in the render loop. */
  updateables: CampusUpdateable[];
  /** Raycast targets. Each carries `userData.facility` for interaction. */
  interactables: THREE.Object3D[];
  /** Transparent/holographic meshes (the volumetric fog pass hides these). */
  transparent: THREE.Object3D[];
  /** Every material/geometry created, for deterministic teardown. */
  dispose: () => void;
}

export function createBuildResult(name: string): CampusBuildResult & {
  register: (obj: THREE.Object3D) => void;
  addUpdateable: (u: CampusUpdateable) => void;
  addInteractable: (obj: THREE.Object3D, facility?: unknown) => void;
} {
  const group = new THREE.Group();
  group.name = name;
  const disposables: Array<{ dispose: () => void }> = [];
  const result = {
    group,
    updateables: [] as CampusUpdateable[],
    interactables: [] as THREE.Object3D[],
    transparent: [] as THREE.Object3D[],
    register(obj: THREE.Object3D) {
      group.add(obj);
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) disposables.push(mesh.geometry);
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) disposables.push(...mat);
        else if (mat) disposables.push(mat);
      });
    },
    addUpdateable(u: CampusUpdateable) {
      result.updateables.push(u);
    },
    addInteractable(obj: THREE.Object3D, facility?: unknown) {
      obj.userData.facility = facility ?? obj.userData.facility ?? null;
      obj.userData.interactive = true;
      result.interactables.push(obj);
    },
    dispose() {
      const seen = new Set<{ dispose: () => void }>();
      disposables.forEach((d) => {
        if (!seen.has(d)) {
          seen.add(d);
          try { d.dispose(); } catch { /* already disposed */ }
        }
      });
      result.updateables.length = 0;
      result.interactables.length = 0;
      result.transparent.length = 0;
      group.clear();
    },
  };
  return result;
}

// ---------------------------------------------------------------------------
// Material library (memoised per resolution so 176 rooms reuse the same sets)
// ---------------------------------------------------------------------------

export interface CampusMaterialLibrary {
  terrazzo: THREE.MeshPhysicalMaterial;
  carpet: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  darkMetal: THREE.MeshStandardMaterial;
  walnut: THREE.MeshStandardMaterial;
  acoustic: THREE.MeshStandardMaterial;
  vinyl: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  frostedGlass: THREE.MeshPhysicalMaterial;
  wallPaint: THREE.MeshStandardMaterial;
  holoCyan: THREE.MeshBasicMaterial;
  holoViolet: THREE.MeshBasicMaterial;
  emissiveWhite: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function createCampusMaterials(
  settings: TierSettings,
  opts: { accent?: number } = {}
): CampusMaterialLibrary {
  const res: TextureResolution = settings.textureResolution;
  const accent = opts.accent ?? 0x22d3ee;

  const terrazzo = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.16, metalness: 0.08,
    clearcoat: 0.85, clearcoatRoughness: 0.06,
    envMapIntensity: 1.15,
  });
  applyPbrSet(terrazzo, createTerrazzoMarble(res, 10), 40);

  const carpet = new THREE.MeshStandardMaterial({ color: 0xffffff, envMapIntensity: 0.4 });
  applyPbrSet(carpet, createCarpetRunner(res, 16), 60);

  const concrete = new THREE.MeshStandardMaterial({ color: 0xffffff, envMapIntensity: 0.6 });
  applyPbrSet(concrete, createConcrete(res, 6), 24);

  const metal = new THREE.MeshStandardMaterial({ color: 0xffffff, envMapIntensity: 1.3 });
  applyPbrSet(metal, createBrushedMetal(res, 3), 6);

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x2b3444, roughness: 0.38, metalness: 0.88, envMapIntensity: 1.1,
  });

  const walnut = new THREE.MeshStandardMaterial({ color: 0xffffff, envMapIntensity: 0.55 });
  applyPbrSet(walnut, createWalnutWood(res, 4), 8);

  const acoustic = new THREE.MeshStandardMaterial({ color: 0xffffff, envMapIntensity: 0.35 });
  applyPbrSet(acoustic, createAcousticPanel(res, 5), 10);

  const vinyl = new THREE.MeshStandardMaterial({ color: 0xffffff, envMapIntensity: 0.5 });
  applyPbrSet(vinyl, createVinylTile(res, 7), 14);

  const glassBase = createFrostedGlass(Math.min(res, 512) as TextureResolution, 1);
  const frostedGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdff1ff, roughness: 0.42, metalness: 0,
    transmission: 0.82, thickness: 0.35, transparent: true, opacity: 0.62,
    ior: 1.48, envMapIntensity: 1.0, side: THREE.DoubleSide,
  });
  frostedGlass.normalMap = glassBase.normalMap;
  frostedGlass.roughnessMap = glassBase.roughnessMap;

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xeaf6ff, roughness: 0.04, metalness: 0,
    transmission: 0.96, thickness: 0.08, transparent: true, opacity: 0.34,
    ior: 1.52, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 1.6, side: THREE.DoubleSide,
  });

  const wallPaint = new THREE.MeshStandardMaterial({
    color: 0x1c2740, roughness: 0.72, metalness: 0.04, envMapIntensity: 0.5,
  });

  const holoCyan = new THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0.34,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const holoViolet = new THREE.MeshBasicMaterial({
    color: 0xa855f7, transparent: true, opacity: 0.3,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });

  const emissiveWhite = new THREE.MeshStandardMaterial({
    color: 0x0b1220, emissive: 0xf2fbff, emissiveIntensity: 2.6,
    roughness: 0.4, metalness: 0,
  });

  return {
    terrazzo, carpet, concrete, metal, darkMetal, walnut, acoustic, vinyl,
    glass, frostedGlass, wallPaint, holoCyan, holoViolet, emissiveWhite,
    dispose() {
      [terrazzo, carpet, concrete, metal, darkMetal, walnut, acoustic, vinyl,
       glass, frostedGlass, wallPaint, holoCyan, holoViolet, emissiveWhite].forEach((m) => m.dispose());
      glassBase.map.dispose(); glassBase.normalMap.dispose();
      glassBase.roughnessMap.dispose(); glassBase.aoMap.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Canvas signage — room numbers, subject banners, directory walls
// ---------------------------------------------------------------------------

/**
 * Draw text signage onto a canvas texture.
 *
 * Real geometry for every letter would blow the draw-call budget across 199
 * rooms, so signage is emissive canvas art: it reads crisply at walking
 * distance, costs one quad, and blooms like a lit sign.
 */
export function createSignTexture(opts: {
  width?: number;
  height?: number;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  footer?: string;
  accent?: string;
  background?: string;
  align?: 'left' | 'center';
  padding?: number;
  titleSize?: number;
  glow?: boolean;
  /** Optional stat chips rendered along the bottom. */
  chips?: string[];
}): THREE.CanvasTexture {
  const width = opts.width ?? 1024;
  const height = opts.height ?? 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const accent = opts.accent ?? '#22d3ee';
  const pad = opts.padding ?? Math.round(height * 0.14);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, opts.background ?? '#070d1a');
  bg.addColorStop(1, '#0d1729');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Accent rule + soft glow wash.
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, Math.max(6, width * 0.008), height);
  if (opts.glow !== false) {
    const wash = ctx.createRadialGradient(width * 0.16, height * 0.5, 0, width * 0.16, height * 0.5, width * 0.55);
    wash.addColorStop(0, `${accent}33`);
    wash.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
  }

  const align = opts.align ?? 'left';
  ctx.textAlign = align;
  const x = align === 'center' ? width / 2 : pad + Math.max(6, width * 0.008) + pad * 0.4;

  let cursor = pad;
  if (opts.eyebrow) {
    ctx.fillStyle = accent;
    ctx.font = `600 ${Math.round(height * 0.1)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText(opts.eyebrow.toUpperCase(), x, cursor + height * 0.1);
    cursor += height * 0.17;
  }

  ctx.fillStyle = '#ffffff';
  const titleSize = opts.titleSize ?? Math.round(height * (opts.eyebrow ? 0.2 : 0.28));
  ctx.font = `700 ${titleSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillText(opts.title, x, cursor + titleSize * 0.92, width - pad * 2);
  cursor += titleSize * 1.16;

  if (opts.subtitle) {
    ctx.fillStyle = '#b6c6dd';
    const subSize = Math.round(height * 0.115);
    ctx.font = `400 ${subSize}px Inter, system-ui, sans-serif`;
    wrapText(ctx, opts.subtitle, x, cursor + subSize, width - pad * 2.4, subSize * 1.35, 2, align);
    cursor += subSize * 2.2;
  }

  if (opts.chips?.length) {
    const chipSize = Math.round(height * 0.095);
    ctx.font = `600 ${chipSize}px ui-monospace, monospace`;
    let cx = align === 'center' ? width / 2 - (opts.chips.length * chipSize * 3.2) / 2 : x;
    const cy = height - pad * 0.9;
    opts.chips.forEach((chip) => {
      const w = ctx.measureText(chip).width + chipSize * 1.5;
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      roundRect(ctx, cx, cy - chipSize * 1.15, w, chipSize * 1.7, chipSize * 0.55);
      ctx.fill();
      ctx.strokeStyle = `${accent}66`;
      ctx.lineWidth = Math.max(1, chipSize * 0.1);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.textAlign = 'left';
      ctx.fillText(chip, cx + chipSize * 0.75, cy + chipSize * 0.12);
      cx += w + chipSize * 0.7;
    });
    ctx.textAlign = align;
  }

  if (opts.footer) {
    ctx.fillStyle = '#7d8ea8';
    const footSize = Math.round(height * 0.085);
    ctx.font = `400 ${footSize}px ui-monospace, monospace`;
    ctx.fillText(opts.footer, x, height - pad * 0.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  maxWidth: number, lineHeight: number, maxLines: number, align: 'left' | 'center'
) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(lineCount === maxLines - 1 ? truncate(line) : line, x, y);
      line = words[i];
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines) {
        const rest = words.slice(i).join(' ');
        ctx.fillText(lineCount === maxLines - 1 ? truncate(`${line} ${rest}`) : line, x, y);
        return;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(lineCount === maxLines - 1 ? truncate(line) : line, x, y);
  void align;
}

function truncate(text: string): string {
  return text.length > 46 ? `${text.slice(0, 45)}…` : text;
}

/** A lit signage panel: emissive quad in a brushed-metal frame. */
export function createSignPanel(
  signOpts: Parameters<typeof createSignTexture>[0],
  size: { width: number; height: number },
  materials: CampusMaterialLibrary
): THREE.Group {
  const group = new THREE.Group();
  const texture = createSignTexture(signOpts);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(size.width, size.height),
    new THREE.MeshStandardMaterial({
      map: texture, emissiveMap: texture, emissive: 0xffffff,
      emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.1,
    })
  );
  group.add(panel);

  const frameDepth = Math.max(0.05, size.height * 0.06);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(size.width + frameDepth * 1.6, size.height + frameDepth * 1.6, frameDepth),
    materials.metal
  );
  frame.position.z = -frameDepth * 0.6;
  group.add(frame);

  return group;
}

// ---------------------------------------------------------------------------
// Architectural elements
// ---------------------------------------------------------------------------

/** Recessed ceiling light cove — the practical that motivates the key light. */
export function createLightCove(length: number, width: number, colour = 0xeaf6ff): THREE.Group {
  const group = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.14, length),
    new THREE.MeshStandardMaterial({ color: 0x0d1524, roughness: 0.6, metalness: 0.5 })
  );
  group.add(housing);

  const diffuser = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.86, length * 0.96),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220, emissive: colour, emissiveIntensity: 3.2,
      roughness: 0.3, side: THREE.DoubleSide,
    })
  );
  diffuser.rotation.x = Math.PI / 2;
  diffuser.position.y = -0.075;
  group.add(diffuser);

  return group;
}

/** Volumetric light shaft: an additive cone that fakes god rays under a cove. */
export function createLightShaft(height: number, radius: number, colour = 0x9fe8ff): THREE.Mesh {
  const geo = new THREE.ConeGeometry(radius, height, 24, 1, true);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColour: { value: new THREE.Color(colour) },
      uIntensity: { value: 0.42 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vY;
      void main() {
        vUv = uv;
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uIntensity;
      uniform float uTime;
      varying vec2 vUv;
      varying float vY;
      void main() {
        // Fade toward the wide end and soften the seam.
        float vertical = smoothstep(-0.5, 0.5, vY);
        float seam = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        float flicker = 0.92 + 0.08 * sin(uTime * 1.7 + vUv.y * 6.0);
        float alpha = (1.0 - vertical) * seam * uIntensity * flicker;
        gl_FragColor = vec4(uColour, alpha);
      }
    `,
  });
  const shaft = new THREE.Mesh(geo, mat);
  shaft.name = 'light-shaft';
  return shaft;
}

export function updateLightShafts(root: THREE.Object3D, elapsed: number): void {
  root.traverse((obj) => {
    if (obj.name !== 'light-shaft') return;
    const mesh = obj as THREE.Mesh;
    const mat = mesh.material as THREE.ShaderMaterial;
    if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed;
  });
}

/** A classroom/lab door with a lit room-number sign and a subject accent strip. */
export function createDoor(opts: {
  width?: number;
  height?: number;
  roomNumber: string;
  title: string;
  accent: number;
  materials: CampusMaterialLibrary;
  open?: boolean;
}): THREE.Group {
  const width = opts.width ?? 1.5;
  const height = opts.height ?? 2.6;
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.24, height + 0.16, 0.16),
    opts.materials.darkMetal
  );
  frame.position.y = (height + 0.16) / 2;
  group.add(frame);

  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.08),
    opts.materials.walnut
  );
  leaf.position.set(0, height / 2, 0.06);
  leaf.castShadow = true;
  leaf.name = 'door-leaf';
  group.add(leaf);

  // Subject accent strip — reads as a colour code along the whole hallway.
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.24, 0.09, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220, emissive: opts.accent, emissiveIntensity: 2.4, roughness: 0.4,
    })
  );
  strip.position.set(0, height + 0.14, 0.1);
  group.add(strip);

  // Vision panel (frosted glazing) so corridors feel supervised and lit.
  const vision = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.34, height * 0.3),
    opts.materials.frostedGlass
  );
  vision.position.set(0, height * 0.62, 0.11);
  group.add(vision);

  // Lit room-number sign above the door.
  const sign = createSignPanel(
    {
      title: opts.roomNumber,
      subtitle: opts.title,
      accent: `#${new THREE.Color(opts.accent).getHexString()}`,
      width: 512, height: 128, titleSize: 46, align: 'center',
    },
    { width: width * 1.15, height: width * 0.3 },
    opts.materials
  );
  sign.position.set(0, height + 0.52, 0.08);
  group.add(sign);

  // Handle.
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12),
    opts.materials.metal
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.set(width * 0.36, height * 0.48, 0.14);
  group.add(handle);

  return group;
}

/** Virtual locker bay: a run of brushed-metal lockers with illuminated numbers. */
export function createLockerBay(count: number, materials: CampusMaterialLibrary, accent: number): THREE.Group {
  const group = new THREE.Group();
  const lockerWidth = 0.42;
  const lockerHeight = 1.85;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(count * lockerWidth, lockerHeight, 0.5),
    materials.metal
  );
  body.position.y = lockerHeight / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Door seams + vents as one instanced mesh (dense detail, one draw call).
  const seamGeo = new THREE.BoxGeometry(0.02, lockerHeight * 0.94, 0.02);
  const seams = new THREE.InstancedMesh(seamGeo, materials.darkMetal, count + 1);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i <= count; i++) {
    matrix.makeTranslation(
      -((count * lockerWidth) / 2) + i * lockerWidth,
      lockerHeight / 2,
      0.26
    );
    seams.setMatrixAt(i, matrix);
  }
  seams.instanceMatrix.needsUpdate = true;
  group.add(seams);

  const ventGeo = new THREE.BoxGeometry(lockerWidth * 0.6, 0.02, 0.02);
  const vents = new THREE.InstancedMesh(ventGeo, materials.darkMetal, count * 3);
  let vi = 0;
  for (let i = 0; i < count; i++) {
    for (let r = 0; r < 3; r++) {
      matrix.makeTranslation(
        -((count * lockerWidth) / 2) + (i + 0.5) * lockerWidth,
        lockerHeight * (0.62 + r * 0.05),
        0.26
      );
      vents.setMatrixAt(vi++, matrix);
    }
  }
  vents.instanceMatrix.needsUpdate = true;
  group.add(vents);

  // Illuminated locker-number strip.
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(count * lockerWidth, 0.05, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220, emissive: accent, emissiveIntensity: 1.8, roughness: 0.4,
    })
  );
  strip.position.set(0, lockerHeight * 0.5, 0.27);
  group.add(strip);

  return group;
}

/** Bench + acoustic study nook for the hallway and lounges. */
export function createStudyNook(materials: CampusMaterialLibrary, accent: number): THREE.Group {
  const group = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.62), materials.walnut);
  seat.position.y = 0.46;
  seat.castShadow = true;
  group.add(seat);

  [-0.95, 0.95].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.46, 0.55), materials.darkMetal);
    leg.position.set(x, 0.23, 0);
    group.add(leg);
  });

  // Acoustic canopy.
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.12), materials.acoustic);
  canopy.position.set(0, 1.15, -0.42);
  canopy.rotation.x = -0.12;
  group.add(canopy);

  const taskLight = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.03, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220, emissive: accent, emissiveIntensity: 2.2, roughness: 0.3,
    })
  );
  taskLight.position.set(0, 1.78, -0.3);
  group.add(taskLight);

  return group;
}

/**
 * Holographic projector: an emissive base, a rotating wireframe subject glyph
 * and an additive cone. Used for the wayfinding kiosk and subject displays.
 */
export function createHologramProjector(opts: {
  accent: number;
  height?: number;
  radius?: number;
  glyph?: 'dna' | 'atom' | 'orbit' | 'prism' | 'grid' | 'helix';
}): { group: THREE.Group; update: (dt: number, t: number) => void } {
  const height = opts.height ?? 1.6;
  const radius = opts.radius ?? 0.5;
  const group = new THREE.Group();
  const accent = new THREE.Color(opts.accent);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.15, radius * 1.35, 0.16, 24),
    new THREE.MeshStandardMaterial({ color: 0x111a2b, roughness: 0.3, metalness: 0.85 })
  );
  base.position.y = 0.08;
  base.castShadow = true;
  group.add(base);

  const emitter = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.04, 24),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220, emissive: accent, emissiveIntensity: 3.4, roughness: 0.2,
    })
  );
  emitter.position.y = 0.18;
  group.add(emitter);

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: accent, transparent: true, opacity: 0.12,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  beam.position.y = 0.18 + height / 2;
  group.add(beam);

  const glyph = new THREE.Group();
  glyph.position.y = 0.18 + height * 0.55;
  const wireMat = new THREE.MeshBasicMaterial({
    color: accent, wireframe: true, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });

  switch (opts.glyph ?? 'atom') {
    case 'dna':
    case 'helix': {
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 4;
        const y = (i / 26 - 0.5) * height * 0.85;
        const r = radius * 0.55;
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), wireMat);
        s1.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        glyph.add(s1);
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), wireMat);
        s2.position.set(Math.cos(a + Math.PI) * r, y, Math.sin(a + Math.PI) * r);
        glyph.add(s2);
      }
      break;
    }
    case 'orbit': {
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * (0.5 + i * 0.16), 0.014, 8, 48), wireMat);
        ring.rotation.set(Math.PI / 2 + i * 0.5, i * 0.7, 0);
        glyph.add(ring);
      }
      const core = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.2, 16, 16), wireMat);
      glyph.add(core);
      break;
    }
    case 'prism': {
      const prism = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, height * 0.5, 3), wireMat);
      glyph.add(prism);
      break;
    }
    case 'grid': {
      const g = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.3, radius * 1.3, radius * 1.3), wireMat);
      glyph.add(g);
      break;
    }
    case 'atom':
    default: {
      const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.24, 1), wireMat);
      glyph.add(nucleus);
      for (let i = 0; i < 3; i++) {
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.62, 0.012, 8, 48), wireMat);
        orbit.rotation.x = (i / 3) * Math.PI;
        orbit.rotation.y = (i / 3) * Math.PI * 0.5;
        glyph.add(orbit);
      }
    }
  }
  group.add(glyph);

  return {
    group,
    update(dt: number, t: number) {
      glyph.rotation.y += dt * 0.55;
      glyph.position.y = 0.18 + height * 0.55 + Math.sin(t * 1.3) * 0.045;
      beam.scale.setScalar(1 + Math.sin(t * 2.1) * 0.02);
      (emitter.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.0 + Math.sin(t * 3.1) * 0.5;
    },
  };
}

/** Floor-embedded wayfinding light strip that pulses toward a destination. */
export function createWayfindingStrip(length: number, colour: number): {
  mesh: THREE.Mesh;
  update: (dt: number, t: number) => void;
} {
  const geo = new THREE.PlaneGeometry(0.16, length, 1, 32);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColour: { value: new THREE.Color(colour) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float pulse = fract(vUv.y * 2.0 - uTime * 0.45);
        float head = smoothstep(0.0, 0.22, pulse) * smoothstep(1.0, 0.55, pulse);
        float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        gl_FragColor = vec4(uColour, (0.22 + head * 0.85) * edge);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = 'wayfinding-strip';
  return {
    mesh,
    update(_dt: number, t: number) {
      mat.uniforms.uTime.value = t;
    },
  };
}

/** Glazed partition between the corridor and a room. */
export function createGlassPartition(width: number, height: number, materials: CampusMaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materials.glass);
  pane.position.y = height / 2;
  group.add(pane);

  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, height, 0.09), materials.darkMetal);
  [-width / 2, 0, width / 2].forEach((x) => {
    const m = mullion.clone();
    m.position.set(x, height / 2, 0);
    group.add(m);
  });

  const head = new THREE.Mesh(new THREE.BoxGeometry(width, 0.09, 0.09), materials.darkMetal);
  head.position.y = height;
  group.add(head);
  const sill = head.clone();
  sill.position.y = 0.04;
  group.add(sill);

  return group;
}
