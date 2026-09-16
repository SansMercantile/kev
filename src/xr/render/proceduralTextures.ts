/**
 * Procedural PBR texture sets for the KEV XR school.
 *
 * The campus ships no external texture downloads — everything here is generated
 * at runtime on a canvas, so the school looks the same offline as online and no
 * third-party asset licence or network round-trip is involved.
 *
 * Each set returns the maps a physically-based material actually needs:
 *
 *   map           albedo, in sRGB         (THREE.SRGBColorSpace)
 *   normalMap     tangent-space normals,  (linear — NoColorSpace)
 *   roughnessMap  per-texel roughness     (linear)
 *   aoMap         baked ambient occlusion (linear)
 *
 * Normal maps are derived from a real height field with a Sobel filter rather
 * than faked with noise, so raked light produces correct relief on grout lines,
 * marble veining, wood grain and brushed-metal anisotropy.
 *
 * Resolution scales with the quality tier (512 / 1024 / 2048) and every set is
 * memoised, so building eleven floors does not regenerate the same marble 176
 * times.
 */

import * as THREE from 'three';

export type TextureResolution = 512 | 1024 | 2048;

export interface PbrTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  aoMap: THREE.CanvasTexture;
  /** Recommended material roughness multiplier. */
  roughness: number;
  /** Recommended material metalness. */
  metalness: number;
  /** World-space size of one texture tile, in metres. */
  tileMetres: number;
}

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, srgb: boolean, repeat: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = maxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

let _anisotropy = 0;
let _probeRenderer: THREE.WebGLRenderer | null = null;

/** Highest anisotropy the GPU supports — critical for floors seen at a rake. */
export function maxAnisotropy(): number {
  if (_anisotropy) return _anisotropy;
  try {
    // A throwaway renderer just to read a capability; cheap and created once.
    _probeRenderer = new THREE.WebGLRenderer({ antialias: false });
    _anisotropy = _probeRenderer.capabilities.getMaxAnisotropy();
  } catch {
    // No usable WebGL context (software rendering, blocked GPU, server-side
    // prebuild). A conservative anisotropy keeps textures valid; the only cost
    // is some shimmer on floors seen at a rake.
    _anisotropy = 4;
  } finally {
    // Dispose even when the capability read throws, so a failed probe never
    // leaves a renderer instance (and its context) behind.
    try { _probeRenderer?.dispose(); } catch { /* already torn down */ }
    _probeRenderer = null;
  }
  return _anisotropy || 4;
}

/** Seedable PRNG so a texture looks identical between reloads. */
function prng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Height field -> tangent-space normal map (Sobel)
// ---------------------------------------------------------------------------

/**
 * Convert a grayscale height canvas into a tangent-space normal map.
 *
 * `strength` is the relief depth in "height units per texel"; higher values give
 * sharper bevels on grout lines and grain.
 */
export function heightToNormalCanvas(height: HTMLCanvasElement, strength = 2.0): HTMLCanvasElement {
  const size = height.width;
  const srcCtx = height.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return height;
  const src = srcCtx.getImageData(0, 0, size, size).data;

  const { canvas, ctx } = makeCanvas(size);
  const out = ctx.createImageData(size, size);

  const at = (x: number, y: number): number => {
    const xi = (x + size) % size;
    const yi = (y + size) % size;
    return src[(yi * size + xi) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sobel kernels.
      const tl = at(x - 1, y - 1), tc = at(x, y - 1), tr = at(x + 1, y - 1);
      const ml = at(x - 1, y), mr = at(x + 1, y);
      const bl = at(x - 1, y + 1), bc = at(x, y + 1), br = at(x + 1, y + 1);

      const dx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
      const dy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);

      // Normal in tangent space; z up.
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      const i = (y * size + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255;
      out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      out.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Build an AO canvas from a height field: crevices (low height) occlude. */
function heightToAoCanvas(height: HTMLCanvasElement, radius = 2, intensity = 0.55): HTMLCanvasElement {
  const size = height.width;
  const srcCtx = height.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return height;
  const src = srcCtx.getImageData(0, 0, size, size).data;
  const { canvas, ctx } = makeCanvas(size);
  const out = ctx.createImageData(size, size);

  const at = (x: number, y: number): number => {
    const xi = (x + size) % size;
    const yi = (y + size) % size;
    return src[(yi * size + xi) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const centre = at(x, y);
      let occlusion = 0;
      let samples = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          occlusion += Math.max(0, at(x + dx, y + dy) - centre);
          samples++;
        }
      }
      const ao = 1 - Math.min(1, (occlusion / Math.max(1, samples)) * intensity * 8);
      const v = ao * 255;
      const i = (y * size + x) * 4;
      out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v; out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Roughness canvas derived from a height field: peaks polish, valleys stay matte. */
function heightToRoughnessCanvas(
  height: HTMLCanvasElement,
  base: number,
  variance: number
): HTMLCanvasElement {
  const size = height.width;
  const srcCtx = height.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return height;
  const src = srcCtx.getImageData(0, 0, size, size).data;
  const { canvas, ctx } = makeCanvas(size);
  const out = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const h = src[i * 4] / 255;
    const r = THREE.MathUtils.clamp(base + (0.5 - h) * variance, 0.02, 1);
    const v = r * 255;
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

// ---------------------------------------------------------------------------
// Value noise (cheap, tileable) for organic materials
// ---------------------------------------------------------------------------

function tileableValueNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  cells: number,
  amplitude: number,
  seed: number
): void {
  const rand = prng(seed);
  const grid: number[][] = [];
  for (let y = 0; y <= cells; y++) {
    grid[y] = [];
    for (let x = 0; x <= cells; x++) grid[y][x] = rand();
  }
  // Wrap the grid so the noise tiles seamlessly.
  for (let y = 0; y <= cells; y++) grid[y][cells] = grid[y][0];
  for (let x = 0; x <= cells; x++) grid[cells][x] = grid[0][x];

  const smooth = (t: number) => t * t * (3 - 2 * t);
  const img = ctx.getImageData(0, 0, size, size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const gx = (px / size) * cells;
      const gy = (py / size) * cells;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const tx = smooth(gx - x0), ty = smooth(gy - y0);
      const a = grid[y0][x0], b = grid[y0][x0 + 1];
      const c = grid[y0 + 1][x0], d = grid[y0 + 1][x0 + 1];
      const top = a + (b - a) * tx;
      const bottom = c + (d - c) * tx;
      const v = top + (bottom - top) * ty;
      const i = (py * size + px) * 4;
      const add = (v - 0.5) * amplitude * 255;
      img.data[i] = THREE.MathUtils.clamp(img.data[i] + add, 0, 255);
      img.data[i + 1] = THREE.MathUtils.clamp(img.data[i + 1] + add, 0, 255);
      img.data[i + 2] = THREE.MathUtils.clamp(img.data[i + 2] + add, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------------------
// Material sets
// ---------------------------------------------------------------------------

const CACHE = new Map<string, PbrTextureSet>();

function cached(key: string, build: () => PbrTextureSet): PbrTextureSet {
  const hit = CACHE.get(key);
  if (hit) return hit;
  const built = build();
  CACHE.set(key, built);
  return built;
}

function finishSet(
  albedo: HTMLCanvasElement,
  heightCanvas: HTMLCanvasElement,
  opts: { size: number; repeat: number; normalStrength: number; roughness: number;
          roughnessVariance: number; metalness: number; tileMetres: number; aoRadius?: number;
          aoIntensity?: number }
): PbrTextureSet {
  const normalCanvas = heightToNormalCanvas(heightCanvas, opts.normalStrength);
  const roughCanvas = heightToRoughnessCanvas(heightCanvas, opts.roughness, opts.roughnessVariance);
  const aoCanvas = heightToAoCanvas(heightCanvas, opts.aoRadius ?? 2, opts.aoIntensity ?? 0.5);
  return {
    map: toTexture(albedo, true, opts.repeat),
    normalMap: toTexture(normalCanvas, false, opts.repeat),
    roughnessMap: toTexture(roughCanvas, false, opts.repeat),
    aoMap: toTexture(aoCanvas, false, opts.repeat),
    roughness: opts.roughness,
    metalness: opts.metalness,
    tileMetres: opts.tileMetres,
  };
}

/**
 * Polished terrazzo marble — the Grand Concourse and every floor's slab.
 * Aggregate chips in the KEV cyan/violet palette, dark slate matrix, rectified
 * tile joints. Replaces the old 1024² colour-only canvas with a full PBR set.
 */
export function createTerrazzoMarble(size: TextureResolution = 1024, repeat = 8): PbrTextureSet {
  return cached(`terrazzo-${size}-${repeat}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);
    const rand = prng(0x5eed1);

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#0a101f');
    grad.addColorStop(0.45, '#111c33');
    grad.addColorStop(1, '#0b1220');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    hctx.fillStyle = '#8a8a8a';
    hctx.fillRect(0, 0, size, size);

    // Aggregate chips: irregular polygons, varied mineral colours.
    const chips = ['#38bdf8', '#06b6d4', '#94a3b8', '#475569', '#64748b', '#0284c7',
                   '#a855f7', '#e2e8f0', '#1e293b', '#f8fafc'];
    const chipCount = Math.round((size / 1024) * 1400);
    for (let i = 0; i < chipCount; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const r = (2 + rand() * (size / 128)) * (size / 1024);
      const colour = chips[Math.floor(rand() * chips.length)];
      const sides = 3 + Math.floor(rand() * 4);
      const rot = rand() * Math.PI * 2;

      ctx.globalAlpha = 0.35 + rand() * 0.5;
      ctx.fillStyle = colour;
      hctx.globalAlpha = 0.5 + rand() * 0.5;
      hctx.fillStyle = rand() > 0.5 ? '#c8c8c8' : '#5a5a5a';

      ctx.beginPath();
      hctx.beginPath();
      for (let s = 0; s <= sides; s++) {
        const a = rot + (s / sides) * Math.PI * 2;
        const rr = r * (0.6 + rand() * 0.7);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (s === 0) { ctx.moveTo(px, py); hctx.moveTo(px, py); }
        else { ctx.lineTo(px, py); hctx.lineTo(px, py); }
      }
      ctx.closePath(); ctx.fill();
      hctx.closePath(); hctx.fill();
    }
    ctx.globalAlpha = 1;
    hctx.globalAlpha = 1;

    // Veining — long soft strokes for a polished-marble read.
    for (let v = 0; v < 26; v++) {
      const y0 = rand() * size;
      ctx.strokeStyle = `rgba(203,213,225,${0.03 + rand() * 0.07})`;
      ctx.lineWidth = (1 + rand() * 3) * (size / 1024);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= size; x += size / 16) {
        ctx.lineTo(x, y0 + Math.sin((x / size) * Math.PI * (1 + rand() * 2) + v) * (size / 40));
      }
      ctx.stroke();
    }

    // Rectified tile joints — recessed, so they catch relief and occlusion.
    const tile = size / 4;
    ctx.strokeStyle = 'rgba(4,8,16,0.85)';
    hctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = Math.max(2, size / 512);
    hctx.lineWidth = ctx.lineWidth;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(i * tile, 0); hctx.lineTo(i * tile, size); hctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, i * tile); hctx.lineTo(size, i * tile); hctx.stroke();
    }

    tileableValueNoise(ctx, size, 24, 0.05, 7);
    tileableValueNoise(hctx, size, 48, 0.08, 11);

    return finishSet(albedo, height, {
      size, repeat, normalStrength: 1.4, roughness: 0.16, roughnessVariance: 0.35,
      metalness: 0.08, tileMetres: 8,
    });
  });
}

/** Cast architectural concrete — walls, columns, structural cores. */
export function createConcrete(size: TextureResolution = 1024, repeat = 4, tint = '#1b2334'): PbrTextureSet {
  return cached(`concrete-${size}-${repeat}-${tint}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);
    const rand = prng(0xc0c0);

    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#909090';
    hctx.fillRect(0, 0, size, size);

    // Pores and blowholes.
    const pores = Math.round((size / 1024) * 900);
    for (let i = 0; i < pores; i++) {
      const x = rand() * size, y = rand() * size;
      const r = (0.6 + rand() * 3.2) * (size / 1024);
      ctx.fillStyle = `rgba(6,10,18,${0.12 + rand() * 0.3})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      hctx.fillStyle = `rgba(30,30,30,${0.4 + rand() * 0.5})`;
      hctx.beginPath(); hctx.arc(x, y, r, 0, Math.PI * 2); hctx.fill();
    }

    // Formwork panel joints (large-format board-formed concrete).
    ctx.strokeStyle = 'rgba(4,8,14,0.5)';
    hctx.strokeStyle = '#3c3c3c';
    ctx.lineWidth = Math.max(2, size / 400);
    hctx.lineWidth = ctx.lineWidth;
    for (let i = 0; i <= 2; i++) {
      const p = (i * size) / 2;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(p, 0); hctx.lineTo(p, size); hctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, p); hctx.lineTo(size, p); hctx.stroke();
    }

    tileableValueNoise(ctx, size, 32, 0.09, 3);
    tileableValueNoise(ctx, size, 96, 0.05, 5);
    tileableValueNoise(hctx, size, 64, 0.14, 9);

    return finishSet(albedo, height, {
      size, repeat, normalStrength: 1.1, roughness: 0.82, roughnessVariance: 0.2,
      metalness: 0.0, tileMetres: 4,
    });
  });
}

/** Brushed anodised metal — door frames, lockers, lab benches, elevator core. */
export function createBrushedMetal(size: TextureResolution = 1024, repeat = 2, tint = '#8d99ae'): PbrTextureSet {
  return cached(`metal-${size}-${repeat}-${tint}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);
    const rand = prng(0xe7a1);

    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, size, size);

    // Anisotropic brush strokes run along X.
    for (let i = 0; i < size * 6; i++) {
      const y = rand() * size;
      const x0 = rand() * size;
      const len = (size / 8) + rand() * (size / 2);
      const a = 0.02 + rand() * 0.07;
      ctx.strokeStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`;
      ctx.lineWidth = 0.6 + rand() * 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + len, y + (rand() - 0.5) * 1.5); ctx.stroke();

      hctx.strokeStyle = rand() > 0.5 ? `rgba(210,210,210,${a * 2})` : `rgba(60,60,60,${a * 2})`;
      hctx.lineWidth = ctx.lineWidth;
      hctx.beginPath(); hctx.moveTo(x0, y); hctx.lineTo(x0 + len, y); hctx.stroke();
    }

    return finishSet(albedo, height, {
      size, repeat, normalStrength: 0.55, roughness: 0.28, roughnessVariance: 0.28,
      metalness: 0.94, tileMetres: 2,
    });
  });
}

/** Walnut veneer — library shelves, auditorium acoustic panelling, seminar desks. */
export function createWalnutWood(size: TextureResolution = 1024, repeat = 3): PbrTextureSet {
  return cached(`walnut-${size}-${repeat}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);
    const rand = prng(0x000d);

    ctx.fillStyle = '#4a2f1d';
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#8c8c8c';
    hctx.fillRect(0, 0, size, size);

    // Grain: long wavy bands along X.
    for (let band = 0; band < 90; band++) {
      const y = (band / 90) * size + rand() * (size / 90);
      const dark = rand() > 0.5;
      ctx.strokeStyle = dark ? `rgba(28,16,9,${0.18 + rand() * 0.3})` : `rgba(122,82,50,${0.12 + rand() * 0.25})`;
      ctx.lineWidth = 1 + rand() * (size / 300);
      hctx.strokeStyle = dark ? 'rgba(40,40,40,0.5)' : 'rgba(190,190,190,0.35)';
      hctx.lineWidth = ctx.lineWidth;

      const phase = rand() * Math.PI * 2;
      const amp = (size / 90) * (0.4 + rand() * 1.6);
      ctx.beginPath(); hctx.beginPath();
      for (let x = 0; x <= size; x += size / 48) {
        const yy = y + Math.sin((x / size) * Math.PI * 2 * (1 + rand() * 0.2) + phase) * amp;
        if (x === 0) { ctx.moveTo(x, yy); hctx.moveTo(x, yy); }
        else { ctx.lineTo(x, yy); hctx.lineTo(x, yy); }
      }
      ctx.stroke(); hctx.stroke();
    }

    // Occasional knots.
    for (let k = 0; k < 4; k++) {
      const x = rand() * size, y = rand() * size;
      const r = (size / 60) * (1 + rand() * 2);
      for (let ring = 6; ring > 0; ring--) {
        ctx.strokeStyle = `rgba(24,13,7,${0.1 + ring * 0.03})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(x, y, r * ring * 0.35, r * ring * 0.22, rand(), 0, Math.PI * 2); ctx.stroke();
      }
      hctx.fillStyle = 'rgba(50,50,50,0.6)';
      hctx.beginPath(); hctx.ellipse(x, y, r * 0.5, r * 0.32, 0, 0, Math.PI * 2); hctx.fill();
    }

    tileableValueNoise(ctx, size, 40, 0.05, 17);
    return finishSet(albedo, height, {
      size, repeat, normalStrength: 0.75, roughness: 0.44, roughnessVariance: 0.22,
      metalness: 0.0, tileMetres: 3,
    });
  });
}

/** Perforated acoustic panelling — auditorium, lecture halls, music rooms. */
export function createAcousticPanel(size: TextureResolution = 1024, repeat = 4): PbrTextureSet {
  return cached(`acoustic-${size}-${repeat}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);

    ctx.fillStyle = '#e8e3d9';
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#b4b4b4';
    hctx.fillRect(0, 0, size, size);

    // Perforation grid.
    const step = size / 24;
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        ctx.fillStyle = 'rgba(20,18,16,0.85)';
        ctx.beginPath(); ctx.arc(x, y, step * 0.19, 0, Math.PI * 2); ctx.fill();
        hctx.fillStyle = '#1c1c1c';
        hctx.beginPath(); hctx.arc(x, y, step * 0.19, 0, Math.PI * 2); hctx.fill();
      }
    }

    // Panel seams.
    ctx.strokeStyle = 'rgba(60,55,48,0.55)';
    hctx.strokeStyle = '#2e2e2e';
    ctx.lineWidth = Math.max(2, size / 380);
    hctx.lineWidth = ctx.lineWidth;
    for (let i = 0; i <= 3; i++) {
      const p = (i * size) / 3;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(p, 0); hctx.lineTo(p, size); hctx.stroke();
    }

    return finishSet(albedo, height, {
      size, repeat, normalStrength: 2.2, roughness: 0.9, roughnessVariance: 0.1,
      metalness: 0.0, tileMetres: 4, aoRadius: 3, aoIntensity: 0.85,
    });
  });
}

/** Non-slip vinyl tile — gymnasium, cafeteria, workshops, labs. */
export function createVinylTile(size: TextureResolution = 1024, repeat = 6, tint = '#2f3b4d'): PbrTextureSet {
  return cached(`vinyl-${size}-${repeat}-${tint}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);
    const rand = prng(0x1234);

    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#a0a0a0';
    hctx.fillRect(0, 0, size, size);

    // Speckle.
    for (let i = 0; i < size * 40; i++) {
      const x = rand() * size, y = rand() * size;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Tile grout.
    const tile = size / 6;
    ctx.strokeStyle = 'rgba(8,12,20,0.9)';
    hctx.strokeStyle = '#383838';
    ctx.lineWidth = Math.max(2, size / 380);
    hctx.lineWidth = ctx.lineWidth;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(i * tile, 0); hctx.lineTo(i * tile, size); hctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, i * tile); hctx.lineTo(size, i * tile); hctx.stroke();
    }

    tileableValueNoise(ctx, size, 24, 0.04, 23);
    return finishSet(albedo, height, {
      size, repeat, normalStrength: 1.6, roughness: 0.55, roughnessVariance: 0.2,
      metalness: 0.02, tileMetres: 6, aoRadius: 2, aoIntensity: 0.7,
    });
  });
}

/** Woven carpet runner — the hallway spine, study nooks, seminar rooms. */
export function createCarpetRunner(size: TextureResolution = 1024, repeat = 12, tint = '#12203a'): PbrTextureSet {
  return cached(`carpet-${size}-${repeat}-${tint}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);
    const rand = prng(0xca2e);

    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#8e8e8e';
    hctx.fillRect(0, 0, size, size);

    // Woven pile: short crossed strokes.
    for (let i = 0; i < size * 90; i++) {
      const x = rand() * size, y = rand() * size;
      const len = 2 + rand() * 5;
      const a = rand() * Math.PI;
      const light = rand() > 0.5;
      ctx.strokeStyle = light ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
      hctx.strokeStyle = light ? 'rgba(225,225,225,0.35)' : 'rgba(60,60,60,0.35)';
      hctx.beginPath(); hctx.moveTo(x, y); hctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); hctx.stroke();
    }

    // Cyan accent stripe down the runner centre (wayfinding).
    const stripe = size * 0.06;
    ctx.fillStyle = 'rgba(34,211,238,0.16)';
    ctx.fillRect(size / 2 - stripe / 2, 0, stripe, size);

    tileableValueNoise(hctx, size, 96, 0.1, 31);
    return finishSet(albedo, height, {
      size, repeat, normalStrength: 1.8, roughness: 0.95, roughnessVariance: 0.08,
      metalness: 0.0, tileMetres: 12, aoRadius: 1, aoIntensity: 0.4,
    });
  });
}

/** Frosted/borosilicate glass — skylights, lab partitions, vitrines. */
export function createFrostedGlass(size: TextureResolution = 512, repeat = 2): PbrTextureSet {
  return cached(`glass-${size}-${repeat}`, () => {
    const { canvas: albedo, ctx } = makeCanvas(size);
    const { canvas: height, ctx: hctx } = makeCanvas(size);

    ctx.fillStyle = '#cfe8f5';
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#a8a8a8';
    hctx.fillRect(0, 0, size, size);
    tileableValueNoise(ctx, size, 48, 0.06, 41);
    tileableValueNoise(hctx, size, 64, 0.12, 43);

    return finishSet(albedo, height, {
      size, repeat, normalStrength: 0.5, roughness: 0.12, roughnessVariance: 0.25,
      metalness: 0.0, tileMetres: 2, aoRadius: 1, aoIntensity: 0.2,
    });
  });
}

// ---------------------------------------------------------------------------
// Disposal
// ---------------------------------------------------------------------------

/** Dispose every cached texture set (call when tearing the academy down). */
export function disposeAllTextures(): void {
  CACHE.forEach((set) => {
    set.map.dispose();
    set.normalMap.dispose();
    set.roughnessMap.dispose();
    set.aoMap.dispose();
  });
  CACHE.clear();
}

export function textureCacheSize(): number {
  return CACHE.size;
}

/**
 * Apply a PBR set to a material and scale its repeat to a real world size, so a
 * 40 m hallway floor gets proportionally larger tiling than a 3 m desk.
 */
export function applyPbrSet(
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  set: PbrTextureSet,
  worldMetres: number,
  repeatOverride?: number
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  const repeat = repeatOverride ?? Math.max(1, Math.round(worldMetres / set.tileMetres));
  // Clone so two meshes with different world sizes don't share a repeat.
  const map = set.map.clone();
  const normalMap = set.normalMap.clone();
  const roughnessMap = set.roughnessMap.clone();
  const aoMap = set.aoMap.clone();
  [map, normalMap, roughnessMap, aoMap].forEach((t) => {
    t.needsUpdate = true;
    t.repeat.set(repeat, repeat);
  });
  material.map = map;
  material.normalMap = normalMap;
  material.roughnessMap = roughnessMap;
  material.aoMap = aoMap;
  material.roughness = set.roughness;
  material.metalness = set.metalness;
  material.needsUpdate = true;
  return material;
}
