/**
 * KEV High-Fidelity Render Engine
 * ==============================
 * The XR/VR/AR school is rendered through this instead of a bare
 * `WebGLRenderer`, so every surface in `VirtualCampus`, the hallway and the
 * labs gets the same physically-based treatment.
 *
 * What "high fidelity" means concretely here:
 *
 *   Global illumination   Image-based lighting from a PMREM-prefiltered
 *                         environment (RoomEnvironment for interiors, a
 *                         procedural sky for the exterior/observatory), so
 *                         materials receive real indirect specular + diffuse
 *                         instead of only direct lights.
 *   Contact shadows       GTAOPass (ground-truth ambient occlusion) with
 *                         denoising — the effect that actually sells scale and
 *                         contact between walls, floors and equipment.
 *   Realistic lighting    ACES Filmic tone mapping + sRGB output, a motivated
 *                         key/fill/rim rig, and emissive fixtures that bloom.
 *   Shadows               VSM soft shadows on Ultra/High (radius-tunable, no
 *                         acne), PCFSoft on Balanced/Performance.
 *   Reflections           Planar `Reflector` for the polished concourse floor,
 *                         plus clearcoat physical materials on glass and stone.
 *   Volumetric fog        A custom depth-reconstructing shader pass:
 *                         exponential *height* fog integrated along the view
 *                         ray, with in-scattering toward the light so the
 *                         hallway gets visible shafts from the ceiling coves.
 *   Bloom                 UnrealBloomPass on emissive signage, holograms and
 *                         lab apparatus.
 *   Depth of field        BokehPass on Ultra, focused on the player.
 *   Antialiasing          SMAA (post) so it survives the composer chain.
 *   Dense detail          Max anisotropic filtering on floor textures seen at a
 *                         rake, mipmapped PBR sets, instancing helpers.
 *
 * Adaptive quality
 * ----------------
 * These effects are deliberately hardware-intensive, so the engine measures its
 * own frame time and steps the tier down (and back up) automatically. A student
 * on an integrated GPU still gets the school; they just get it at Balanced.
 * `quality: 'auto'` picks the starting tier from the GPU renderer string,
 * device memory and core count.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { maxAnisotropy } from './proceduralTextures';

export type QualityTier = 'ultra' | 'high' | 'balanced' | 'performance';

export const QUALITY_ORDER: QualityTier[] = ['performance', 'balanced', 'high', 'ultra'];

export interface TierSettings {
  /** Device pixel ratio cap. */
  pixelRatioCap: number;
  /** Texture resolution for procedural PBR sets. */
  textureResolution: 512 | 1024 | 2048;
  /** Shadow map edge length. */
  shadowMapSize: number;
  shadowType: THREE.ShadowMapType;
  /** Enable ground-truth AO. */
  gtao: boolean;
  gtaoSamples: number;
  gtaoRadius: number;
  /** Enable bloom. */
  bloom: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  /** Enable the volumetric height-fog + light-shaft pass. */
  volumetricFog: boolean;
  fogSteps: number;
  /** Enable depth of field. */
  depthOfField: boolean;
  /** Enable planar floor reflections. */
  reflections: boolean;
  reflectorResolution: number;
  /** Enable SMAA. */
  smaa: boolean;
  /** Enable image-based lighting. */
  ibl: boolean;
  /** Extra MSAA samples on the composer target (WebGL2). */
  msaaSamples: number;
  label: string;
}

export const QUALITY_SETTINGS: Record<QualityTier, TierSettings> = {
  ultra: {
    pixelRatioCap: 2,
    textureResolution: 2048,
    shadowMapSize: 4096,
    shadowType: THREE.VSMShadowMap,
    gtao: true, gtaoSamples: 32, gtaoRadius: 0.6,
    bloom: true, bloomStrength: 0.72, bloomRadius: 0.62, bloomThreshold: 0.72,
    volumetricFog: true, fogSteps: 24,
    depthOfField: true,
    reflections: true, reflectorResolution: 1024,
    smaa: true, ibl: true, msaaSamples: 4,
    label: 'Ultra — full global illumination, volumetric fog, DOF, 4K shadows',
  },
  high: {
    pixelRatioCap: 2,
    textureResolution: 2048,
    shadowMapSize: 2048,
    shadowType: THREE.VSMShadowMap,
    gtao: true, gtaoSamples: 16, gtaoRadius: 0.55,
    bloom: true, bloomStrength: 0.62, bloomRadius: 0.55, bloomThreshold: 0.75,
    volumetricFog: true, fogSteps: 14,
    depthOfField: false,
    reflections: true, reflectorResolution: 512,
    smaa: true, ibl: true, msaaSamples: 2,
    label: 'High — GTAO, bloom, volumetric fog, planar reflections',
  },
  balanced: {
    pixelRatioCap: 1.5,
    textureResolution: 1024,
    shadowMapSize: 2048,
    shadowType: THREE.PCFSoftShadowMap,
    gtao: true, gtaoSamples: 8, gtaoRadius: 0.5,
    bloom: true, bloomStrength: 0.5, bloomRadius: 0.5, bloomThreshold: 0.8,
    volumetricFog: false, fogSteps: 8,
    depthOfField: false,
    reflections: false, reflectorResolution: 256,
    smaa: true, ibl: true, msaaSamples: 0,
    label: 'Balanced — IBL, soft shadows, bloom, light AO',
  },
  performance: {
    pixelRatioCap: 1,
    textureResolution: 512,
    shadowMapSize: 1024,
    shadowType: THREE.PCFShadowMap,
    gtao: false, gtaoSamples: 4, gtaoRadius: 0.4,
    bloom: true, bloomStrength: 0.35, bloomRadius: 0.4, bloomThreshold: 0.9,
    volumetricFog: false, fogSteps: 4,
    depthOfField: false,
    reflections: false, reflectorResolution: 128,
    smaa: false, ibl: true, msaaSamples: 0,
    label: 'Performance — direct lighting, baked-style AO maps only',
  },
};

// ---------------------------------------------------------------------------
// Tier detection
// ---------------------------------------------------------------------------

/** Probe the GPU renderer string (best effort; may be masked by the browser). */
export function probeGpu(): { renderer: string; vendor: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return { renderer: 'unknown', vendor: 'unknown' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    const vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR));
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return { renderer, vendor };
  } catch {
    return { renderer: 'unknown', vendor: 'unknown' };
  }
}

/**
 * Pick a starting tier from the device. Conservative by default: it is better
 * to start at High and let the adaptive loop step up than to stutter on load.
 */
export function detectQualityTier(): QualityTier {
  if (typeof navigator === 'undefined') return 'balanced';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const gpu = probeGpu().renderer.toLowerCase();
  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  const isXRHeadset = /oculus|quest|pico|vive|hololens|openxr/i.test(navigator.userAgent);

  if (isXRHeadset) {
    // Headsets are fill-rate bound and need a stable 72-90 Hz; stereoscopic
    // rendering halves the budget per eye.
    return 'performance';
  }
  if (isMobile) return memory >= 6 && cores >= 8 ? 'balanced' : 'performance';

  const isDiscrete = /(rtx|radeon rx|radeon pro|arc a|geforce|radeon\b)/.test(gpu);
  const isWeakIntegrated = /(intel hd|intel uhd 6|mali-4|adreno 3|adreno 4|powervr)/.test(gpu);

  if (isWeakIntegrated || memory <= 2) return 'performance';
  if (isDiscrete && memory >= 8 && cores >= 8) return 'ultra';
  if (isDiscrete || (memory >= 8 && cores >= 6)) return 'high';
  return 'balanced';
}

export function stepTierDown(tier: QualityTier): QualityTier {
  const i = QUALITY_ORDER.indexOf(tier);
  return QUALITY_ORDER[Math.max(0, i - 1)];
}

export function stepTierUp(tier: QualityTier): QualityTier {
  const i = QUALITY_ORDER.indexOf(tier);
  return QUALITY_ORDER[Math.min(QUALITY_ORDER.length - 1, i + 1)];
}

// ---------------------------------------------------------------------------
// Volumetric height-fog + in-scattering pass
// ---------------------------------------------------------------------------

/**
 * Screen-space volumetric fog.
 *
 * Reconstructs view-space position from the depth buffer and integrates an
 * exponential *height* fog along the ray in `uSteps` slices, adding Henyey-
 * Greenstein-style in-scattering toward the dominant light. That combination is
 * what produces visible shafts under the hallway ceiling coves and depth in the
 * atrium, rather than the flat tint `THREE.FogExp2` gives on its own.
 */
export const VolumetricFogShader = {
  name: 'VolumetricFogShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    uNear: { value: 0.1 },
    uFar: { value: 220 },
    uFogColor: { value: new THREE.Color(0x0a1526) },
    uLightColor: { value: new THREE.Color(0x9fe8ff) },
    uDensity: { value: 0.028 },
    uHeightFalloff: { value: 0.16 },
    uCameraHeight: { value: 1.7 },
    uSteps: { value: 20 },
    uScattering: { value: 0.55 },
    uG: { value: 0.62 },
    uLightDirView: { value: new THREE.Vector3(0.2, 1.0, -0.3).normalize() },
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uProjectionMatrixInv: { value: new THREE.Matrix4() },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float uNear;
    uniform float uFar;
    uniform vec3  uFogColor;
    uniform vec3  uLightColor;
    uniform float uDensity;
    uniform float uHeightFalloff;
    uniform float uCameraHeight;
    uniform float uSteps;
    uniform float uScattering;
    uniform float uG;
    uniform vec3  uLightDirView;
    uniform float uTime;
    uniform float uIntensity;
    uniform mat4  uProjectionMatrixInv;
    varying vec2 vUv;

    // Perspective depth -> linear view-space Z.
    float linearizeDepth(float d) {
      float z = d * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
    }

    // Reconstruct view-space position from UV + linear depth.
    vec3 viewPositionFromDepth(vec2 uv, float linearDepth) {
      vec4 clip = vec4(uv * 2.0 - 1.0, 1.0, 1.0);
      vec4 view = uProjectionMatrixInv * clip;
      // xy direction scaled so that -z equals the linear depth.
      vec3 dir = view.xyz / max(view.w, 1e-6);
      return dir * (linearDepth / max(-dir.z, 1e-6));
    }

    // Henyey-Greenstein phase function for in-scattering.
    float phaseHG(float cosTheta, float g) {
      float g2 = g * g;
      float denom = 1.0 + g2 - 2.0 * g * cosTheta;
      return (1.0 - g2) / (4.0 * 3.14159265 * pow(max(denom, 1e-4), 1.5));
    }

    float heightDensity(float worldY) {
      float h = max(0.0, worldY + uCameraHeight);
      return uDensity * exp(-h * uHeightFalloff);
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      float depth = texture2D(tDepth, vUv).x;

      // Sky / far plane: nothing to integrate through.
      if (depth >= 0.999999) {
        gl_FragColor = base;
        return;
      }

      float linearDepth = linearizeDepth(depth);
      vec3 viewPos = viewPositionFromDepth(vUv, linearDepth);

      float steps = max(4.0, uSteps);
      float stepSize = linearDepth / steps;
      vec3 stepVec = viewPos / steps;

      float cosTheta = dot(normalize(-viewPos), normalize(uLightDirView));
      float phase = phaseHG(cosTheta, uG);

      // Gentle animated drift so the fog reads as air, not a static overlay.
      float drift = sin(uTime * 0.12) * 0.5 + 0.5;

      vec3 accumulated = vec3(0.0);
      float transmittance = 1.0;
      vec3 cursor = vec3(0.0);

      for (float i = 0.0; i < 64.0; i += 1.0) {
        if (i >= steps) break;
        cursor += stepVec;
        // View-space Y maps to world height for an upright camera.
        float d = heightDensity(cursor.y) * (0.85 + 0.3 * drift);
        float extinction = d * stepSize;
        vec3 scattering = uFogColor * d + uLightColor * d * phase * uScattering;
        accumulated += scattering * stepSize * transmittance;
        transmittance *= exp(-extinction);
        if (transmittance < 0.01) break;
      }

      vec3 colour = base.rgb * transmittance + accumulated * uIntensity;
      gl_FragColor = vec4(colour, base.a);
    }
  `,
};

/**
 * ShaderPass that renders its own depth pre-pass so the fog can reconstruct
 * view-space position. Transparent holograms and glass are hidden during the
 * depth pass — otherwise a holographic banner would occlude fog behind it.
 */
class VolumetricFogPass extends ShaderPass {
  private depthTarget: THREE.WebGLRenderTarget;
  /**
   * The attached depth texture. `WebGLRenderTarget.depthTexture` is typed
   * `DepthTexture | null`; this pass always attaches one in its constructor, so
   * keeping a non-null reference avoids four nullable re-reads downstream.
   */
  private depthTexture: THREE.DepthTexture;
  private depthMaterial: THREE.MeshDepthMaterial;
  private hidden: THREE.Object3D[] = [];
  private transparentCache: THREE.Object3D[] | null = null;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    width: number,
    height: number,
    steps: number
  ) {
    super(VolumetricFogShader);

    this.depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.BasicDepthPacking,
    });

    this.depthTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.UnsignedIntType,
      format: THREE.RedFormat,
    });
    this.depthTexture = new THREE.DepthTexture(width, height);
    this.depthTexture.type = THREE.UnsignedIntType;
    this.depthTarget.depthTexture = this.depthTexture;

    this.uniforms.tDepth.value = this.depthTexture;
    this.uniforms.uSteps.value = steps;
    this.uniforms.uNear.value = camera.near;
    this.uniforms.uFar.value = camera.far;
    this.uniforms.uProjectionMatrixInv.value.copy(camera.projectionMatrixInverse);
  }

  /** Call after adding/removing holograms so the depth pass hides the right set. */
  invalidateTransparentCache(): void {
    this.transparentCache = null;
  }

  setSize(width: number, height: number): void {
    super.setSize(width, height);
    this.depthTarget.setSize(width, height);
    this.depthTexture.image.width = width;
    this.depthTexture.image.height = height;
    this.depthTexture.needsUpdate = true;
  }

  private collectTransparent(): THREE.Object3D[] {
    if (this.transparentCache) return this.transparentCache;
    const found: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (!mat) return;
      const list = Array.isArray(mat) ? mat : [mat];
      if (list.some((m) => m && m.transparent && m.opacity < 0.98)) found.push(obj);
    });
    this.transparentCache = found;
    return found;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget,
         readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean): void {
    if (!this.enabled) {
      // Still forward the frame so the chain is not broken.
      this.uniforms.tDiffuse.value = readBuffer.texture;
      super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
      return;
    }

    this.uniforms.uNear.value = this.camera.near;
    this.uniforms.uFar.value = this.camera.far;
    this.uniforms.uProjectionMatrixInv.value.copy(this.camera.projectionMatrixInverse);

    // --- depth pre-pass ---
    const previousTarget = renderer.getRenderTarget();
    const previousOverride = this.scene.overrideMaterial;
    const previousAutoClear = renderer.autoClear;
    const previousShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    this.hidden = this.collectTransparent();
    for (const obj of this.hidden) obj.visible = false;

    this.scene.overrideMaterial = this.depthMaterial;
    renderer.shadowMap.autoUpdate = false;
    renderer.autoClear = true;
    renderer.setRenderTarget(this.depthTarget);
    renderer.clear(true, true, false);
    renderer.render(this.scene, this.camera);

    for (const obj of this.hidden) obj.visible = true;
    this.hidden = [];
    this.scene.overrideMaterial = previousOverride;
    renderer.shadowMap.autoUpdate = previousShadowAutoUpdate;
    renderer.autoClear = previousAutoClear;
    renderer.setRenderTarget(previousTarget);

    // --- composite ---
    this.uniforms.tDiffuse.value = readBuffer.texture;
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  }

  dispose(): void {
    this.depthTarget.dispose();
    this.depthTexture.dispose();
    this.depthMaterial.dispose();
    super.dispose();
  }
}

// ---------------------------------------------------------------------------
// Lighting rig
// ---------------------------------------------------------------------------

export interface LightingRig {
  key: THREE.DirectionalLight;
  fill: THREE.HemisphereLight;
  rim: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  group: THREE.Group;
}

/**
 * A motivated three-point rig for an interior academic building: a cool key from
 * the skylight, a warm hemisphere fill bouncing off the terrazzo, and a violet
 * rim from the holographic signage so silhouettes separate from dark walls.
 */
export function createLightingRig(settings: TierSettings, opts: {
  keyColour?: number; keyIntensity?: number;
  skyColour?: number; groundColour?: number;
  rimColour?: number; rimIntensity?: number;
  shadowExtent?: number;
} = {}): LightingRig {
  const group = new THREE.Group();
  group.name = 'kev-lighting-rig';

  const key = new THREE.DirectionalLight(opts.keyColour ?? 0xdff1ff, opts.keyIntensity ?? 2.1);
  key.position.set(18, 34, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
  const extent = opts.shadowExtent ?? 46;
  key.shadow.camera.left = -extent;
  key.shadow.camera.right = extent;
  key.shadow.camera.top = extent;
  key.shadow.camera.bottom = -extent;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 140;
  // VSM wants a positive bias + radius; PCF wants a small negative bias.
  if (settings.shadowType === THREE.VSMShadowMap) {
    key.shadow.bias = 0.00035;
    key.shadow.radius = 5;
    key.shadow.blurSamples = 18;
  } else {
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.035;
    key.shadow.radius = 2;
  }
  group.add(key);
  group.add(key.target);

  const fill = new THREE.HemisphereLight(
    opts.skyColour ?? 0x8ec9ff,
    opts.groundColour ?? 0x1b2436,
    0.85
  );
  group.add(fill);

  const rim = new THREE.DirectionalLight(opts.rimColour ?? 0xa855f7, opts.rimIntensity ?? 0.7);
  rim.position.set(-22, 12, -26);
  group.add(rim);

  const ambient = new THREE.AmbientLight(0x2b3a55, 0.35);
  group.add(ambient);

  return { key, fill, rim, ambient, group };
}

/**
 * Warm point light for a practical fixture (ceiling cove, desk lamp, kiosk).
 * `castShadow` is limited by tier because each shadow-casting point light costs
 * a cube render.
 */
export function createPracticalLight(
  colour: number,
  intensity: number,
  distance: number,
  settings: TierSettings,
  castShadow = false
): THREE.PointLight {
  const light = new THREE.PointLight(colour, intensity, distance, 2);
  light.castShadow = castShadow && settings.shadowMapSize >= 2048;
  if (light.castShadow) {
    light.shadow.mapSize.set(Math.min(1024, settings.shadowMapSize), Math.min(1024, settings.shadowMapSize));
    light.shadow.bias = settings.shadowType === THREE.VSMShadowMap ? 0.002 : -0.005;
    light.shadow.radius = settings.shadowType === THREE.VSMShadowMap ? 4 : 1;
  }
  return light;
}

// ---------------------------------------------------------------------------
// Environment / IBL
// ---------------------------------------------------------------------------

/**
 * Build a PMREM-prefiltered environment for image-based lighting.
 *
 * `mode: 'interior'` uses three's RoomEnvironment (soft box lighting, correct
 * for corridors and labs). `mode: 'night'` builds a dark procedural gradient so
 * the atrium keeps deep blacks while holograms still get specular response.
 */
export function createEnvironment(
  renderer: THREE.WebGLRenderer,
  mode: 'interior' | 'night' = 'interior'
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  if (mode === 'interior') {
    const env = new RoomEnvironment();
    const target = pmrem.fromScene(env, 0.04);
    env.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    pmrem.dispose();
    return target.texture;
  }

  // Procedural night sky gradient as an equirect map.
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#050912');
    grad.addColorStop(0.45, '#0a1526');
    grad.addColorStop(0.62, '#123049');
    grad.addColorStop(0.78, '#0a1526');
    grad.addColorStop(1, '#04070e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size * 2, size);
    // Horizon glow so reflections have something warm to pick up.
    const glow = ctx.createRadialGradient(size, size * 0.66, 0, size, size * 0.66, size * 0.9);
    glow.addColorStop(0, 'rgba(56,189,248,0.30)');
    glow.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size * 2, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const target = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return target.texture;
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export interface HighFidelityOptions {
  container: HTMLElement;
  /** 'auto' detects from the GPU; a tier name forces it. */
  quality?: QualityTier | 'auto';
  environment?: 'interior' | 'night';
  fogColour?: number;
  fogDensity?: number;
  /** Allow the adaptive loop to change tier. Default true. */
  adaptive?: boolean;
  /** Never step below this tier. */
  minTier?: QualityTier;
  preserveDrawingBuffer?: boolean;
  antialias?: boolean;
}

export interface FrameStats {
  fps: number;
  frameMs: number;
  tier: QualityTier;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  adapted: boolean;
}

export class HighFidelityRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly container: HTMLElement;

  tier: QualityTier;
  settings: TierSettings;

  composer: EffectComposer;
  private renderPass: RenderPass;
  private gtaoPass: GTAOPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private fogPass: VolumetricFogPass | null = null;
  private bokehPass: BokehPass | null = null;
  private smaaPass: SMAAPass | null = null;
  private outputPass: OutputPass;

  private environmentTexture: THREE.Texture | null = null;
  private pmremTarget: THREE.Texture | null = null;

  private fpsWindow: number[] = [];
  private lastAdaptAt = 0;
  private adaptCount = 0;
  private adapted = false;
  private disposed = false;
  private environmentMode: 'interior' | 'night';

  readonly onTierChange: Array<(tier: QualityTier, reason: string) => void> = [];

  constructor(options: HighFidelityOptions) {
    this.container = options.container;
    const width = options.container.clientWidth || 960;
    const height = options.container.clientHeight || 540;

    this.tier = options.quality === 'auto' || !options.quality ? detectQualityTier() : options.quality;
    this.settings = QUALITY_SETTINGS[this.tier];
    this.environmentMode = options.environment ?? 'interior';

    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? this.settings.msaaSamples === 0,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? true,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.settings.pixelRatioCap));

    // Colour + tone: the single biggest realism win. ACES filmic keeps bright
    // emissive signage from clipping to flat white.
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.settings.shadowType;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 400);
    this.camera.position.set(0, 1.7, 14);

    this.applyEnvironment(this.environmentMode);

    // --- composer chain ---
    const rt = new THREE.WebGLRenderTarget(
      width * this.renderer.getPixelRatio(),
      height * this.renderer.getPixelRatio(),
      {
        type: THREE.HalfFloatType,
        samples: this.settings.msaaSamples,
        colorSpace: THREE.LinearSRGBColorSpace,
      }
    );
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.setSize(width, height);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.outputPass = new OutputPass();

    this.buildEffectChain(width, height, options);

    options.container.replaceChildren(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
  }

  /** (Re)build the post-processing chain for the current tier. */
  private buildEffectChain(width: number, height: number, options: Partial<HighFidelityOptions> = {}): void {
    // Dispose the old optional passes.
    [this.gtaoPass, this.bloomPass, this.fogPass, this.bokehPass, this.smaaPass].forEach((p) => {
      if (p) {
        this.composer.removePass(p);
        (p as unknown as { dispose?: () => void }).dispose?.();
      }
    });
    this.composer.removePass(this.outputPass);
    this.gtaoPass = null; this.bloomPass = null; this.fogPass = null;
    this.bokehPass = null; this.smaaPass = null;

    const s = this.settings;

    if (s.gtao) {
      this.gtaoPass = new GTAOPass(this.scene, this.camera, width, height);
      this.gtaoPass.output = GTAOPass.OUTPUT.Default;
      this.gtaoPass.updateGtaoMaterial({
        radius: s.gtaoRadius,
        distanceExponent: 1.0,
        thickness: 1.0,
        scale: 1.0,
        samples: s.gtaoSamples,
        distanceFallOff: 1.0,
        screenSpaceRadius: false,
      });
      this.gtaoPass.updatePdMaterial({
        lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: s.gtaoRadius, radiusExponent: 1, rings: 2, samples: 8,
      });
      this.gtaoPass.blendIntensity = 0.85;
      this.composer.addPass(this.gtaoPass);
    }

    if (s.bloom) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        s.bloomStrength, s.bloomRadius, s.bloomThreshold
      );
      this.composer.addPass(this.bloomPass);
    }

    if (s.volumetricFog) {
      this.fogPass = new VolumetricFogPass(this.scene, this.camera, width, height, s.fogSteps);
      this.fogPass.uniforms.uFogColor.value.setHex(options.fogColour ?? 0x0a1526);
      this.fogPass.uniforms.uDensity.value = options.fogDensity ?? 0.028;
      this.composer.addPass(this.fogPass);
    }

    if (s.depthOfField) {
      this.bokehPass = new BokehPass(this.scene, this.camera, {
        focus: 12.0, aperture: 0.00016, maxblur: 0.0075,
      });
      this.composer.addPass(this.bokehPass);
    }

    if (s.smaa) {
      this.smaaPass = new SMAAPass();
      this.composer.addPass(this.smaaPass);
    }

    // OutputPass must be last: it applies tone mapping + colour-space conversion.
    this.composer.addPass(this.outputPass);
  }

  /** Swap the IBL environment (e.g. moving from the concourse to the observatory). */
  applyEnvironment(mode: 'interior' | 'night'): void {
    this.environmentMode = mode;
    const next = createEnvironment(this.renderer, mode);
    if (this.pmremTarget) this.pmremTarget.dispose();
    this.pmremTarget = next;
    if (this.settings.ibl) {
      this.scene.environment = next;
      this.scene.environmentIntensity = mode === 'night' ? 0.55 : 0.85;
    }
    this.environmentTexture = next;
  }

  get environment(): THREE.Texture | null {
    return this.environmentTexture;
  }

  /** Tell the fog pass the scene graph changed (new floor loaded). */
  invalidateCaches(): void {
    this.fogPass?.invalidateTransparentCache();
  }

  /** Per-frame uniforms that must track the clock/camera. */
  update(deltaSeconds: number, elapsedSeconds: number): void {
    if (this.fogPass) {
      this.fogPass.uniforms.uTime.value = elapsedSeconds;
      // Keep the in-scattering direction aligned with the key light in view space.
      const key = this.scene.children.find(
        (c) => c.name === 'kev-lighting-rig'
      ) as THREE.Group | undefined;
      if (key) {
        const dir = key.children.find((c) => (c as THREE.DirectionalLight).isDirectionalLight) as
          | THREE.DirectionalLight | undefined;
        if (dir) {
          const v = dir.position.clone().normalize().applyQuaternion(
            this.camera.quaternion.clone().invert()
          );
          (this.fogPass.uniforms.uLightDirView.value as THREE.Vector3).copy(v);
        }
      }
    }
    if (this.bokehPass) {
      // Rack focus to wherever the player is looking, ~12 m down the hall.
      const uniforms = this.bokehPass.uniforms as unknown as
        | Record<string, { value: unknown }>
        | undefined;
      const focus = uniforms?.focus;
      if (focus) focus.value = 12.0;
    }
    void deltaSeconds;
  }

  render(): void {
    if (this.disposed) return;
    this.composer.render();
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  /** Switch tier at runtime and rebuild the chain. */
  setQuality(tier: QualityTier, reason = 'manual'): void {
    if (tier === this.tier) return;
    this.tier = tier;
    this.settings = QUALITY_SETTINGS[tier];

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.settings.pixelRatioCap));
    this.renderer.shadowMap.type = this.settings.shadowType;
    // Shadow type changes require materials to recompile.
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (!mat) return;
      if (Array.isArray(mat)) mat.forEach((m) => (m.needsUpdate = true));
      else mat.needsUpdate = true;
    });
    this.renderer.shadowMap.needsUpdate = true;

    if (this.settings.ibl && this.pmremTarget) {
      this.scene.environment = this.pmremTarget;
      this.scene.environmentIntensity = this.environmentMode === 'night' ? 0.55 : 0.85;
    } else {
      this.scene.environment = null;
    }

    const w = this.container.clientWidth || 960;
    const h = this.container.clientHeight || 540;
    this.buildEffectChain(w, h);
    this.composer.setSize(w, h);
    this.invalidateCaches();

    this.onTierChange.forEach((cb) => cb(tier, reason));
  }

  /**
   * Feed a frame time in ms. Sustained slowness steps the tier down; sustained
   * headroom steps it back up. Hysteresis prevents oscillation.
   */
  observeFrame(frameMs: number, minTier: QualityTier = 'performance'): void {
    if (this.disposed) return;
    this.fpsWindow.push(frameMs);
    if (this.fpsWindow.length > 90) this.fpsWindow.shift();
    if (this.fpsWindow.length < 45) return;

    const now = performance.now();
    if (now - this.lastAdaptAt < 4000) return;

    const avg = this.fpsWindow.reduce((a, b) => a + b, 0) / this.fpsWindow.length;
    const fps = 1000 / avg;

    if (fps < 26 && this.tier !== minTier) {
      const next = stepTierDown(this.tier);
      if (QUALITY_ORDER.indexOf(next) >= QUALITY_ORDER.indexOf(minTier)) {
        this.lastAdaptAt = now;
        this.adaptCount++;
        this.adapted = true;
        this.fpsWindow = [];
        this.setQuality(next, `adaptive: ${fps.toFixed(0)} fps`);
      }
    } else if (fps > 82 && this.adaptCount > 0) {
      // Only step back up if we previously stepped down, and not too eagerly.
      const next = stepTierUp(this.tier);
      this.lastAdaptAt = now;
      this.adaptCount = Math.max(0, this.adaptCount - 1);
      this.fpsWindow = [];
      this.setQuality(next, `adaptive: ${fps.toFixed(0)} fps headroom`);
    }
  }

  stats(): FrameStats {
    const info = this.renderer.info;
    const avg = this.fpsWindow.length
      ? this.fpsWindow.reduce((a, b) => a + b, 0) / this.fpsWindow.length
      : 16.7;
    return {
      fps: 1000 / avg,
      frameMs: avg,
      tier: this.tier,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
      adapted: this.adapted,
    };
  }

  /** Max anisotropy detected on this GPU (textures should use it). */
  get anisotropy(): number {
    return maxAnisotropy();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    [this.gtaoPass, this.bloomPass, this.fogPass, this.bokehPass, this.smaaPass].forEach((p) => {
      if (p) (p as unknown as { dispose?: () => void }).dispose?.();
    });
    this.outputPass.dispose?.();
    this.renderPass.dispose?.();
    this.composer.dispose?.();
    this.pmremTarget?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.onTierChange.length = 0;
  }
}
