/**
 * KEV studio renderer (immersive-learning quality pass).
 *
 * Shared three.js bootstrap that mirrors the rendering recipe of the
 * model-x-studio and human-atlas tools (see docs/ATTRIBUTION-model-x.md and
 * docs/ATTRIBUTION-human-atlas.md; technique adaptations, MIT code credited
 * inline where used):
 *
 *   - PMREM + RoomEnvironment image-based lighting (the single biggest
 *     quality lever: every material gets real reflections)
 *   - ACES filmic tone mapping + sRGB output with tuned exposure
 *   - three-point lighting: hemisphere fill, warm shadow-casting key,
 *     cool rim, optional warm accent
 *   - PCF soft shadows with throttled map updates (autoUpdate off)
 *   - narrow studio FOV, damped OrbitControls with clamps
 *   - dirty-flag on-demand rendering (idle frames cost nothing)
 *   - ResizeObserver sizing, prefers-reduced-motion, WebGL context-lost
 *     recovery, and complete disposal
 *
 * Engines (atlas, vehicle, subject scenes) build on createStudio() instead
 * of hand-rolling renderer setup, so every immersive surface shares one
 * studio-grade baseline.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export const STUDIO_THEMES = {
  // KEV navy studio: the house look for immersive pages.
  dark: {
    background: '#07111f',
    fog: { color: '#07111f', near: 16, far: 60 },
    exposure: 1.0,
    hemi: { sky: 0xd8e9ff, ground: 0x223047, intensity: 0.85 },
    key: { color: 0xffffff, intensity: 2.5, position: [-4, 8, 4] },
    rim: { color: 0xa6c7eb, intensity: 1.8, position: [3, 4, -5] },
    accent: { color: 0xe0c4a6, intensity: 2, distance: 12, position: [1, 0.4, 4] },
    ground: { color: 0x101d2f, roughness: 0.85, metalness: 0.12 },
    plinth: { color: 0x2a3a52, metalness: 0.35, roughness: 0.48 },
    ring: { color: 0xa6b9c9, metalness: 0.7, roughness: 0.35 },
    grid: { main: 0x35506e, sub: 0x2a405a, opacity: 0.16 },
  },
  // Deep space for the Earth subject.
  space: {
    background: '#020409',
    fog: null,
    exposure: 1.05,
    hemi: { sky: 0x9fb6d8, ground: 0x0a0f1c, intensity: 0.5 },
    key: { color: 0xfff4e0, intensity: 3.0, position: [-6, 4, 5] },
    rim: { color: 0x6f96c9, intensity: 1.6, position: [4, 2, -5] },
    accent: null,
    ground: null,
    plinth: null,
    ring: null,
    grid: null,
  },
  // Light gallery (the human-atlas tool look) for bright anatomical study.
  light: {
    background: '#f2f3f3',
    fog: null,
    exposure: 1.12,
    hemi: { sky: 0xffffff, ground: 0xa7acb2, intensity: 1.05 },
    key: { color: 0xfffaf4, intensity: 2.3, position: [-2, 4, 3] },
    rim: { color: 0xe9f0ff, intensity: 1.8, position: [2, 2, -3] },
    accent: null,
    ground: { color: 0xd5d9dc, roughness: 1, metalness: 0 },
    plinth: { color: 0xeeeeec, metalness: 0.12, roughness: 0.67 },
    ring: { color: 0x8c969f, metalness: 0, roughness: 1 },
    grid: null,
  },
}

/**
 * @param {HTMLElement} host - container element (sized by CSS)
 * @param {object} opts
 * @param {'dark'|'space'|'light'} [opts.theme='dark']
 * @param {string} [opts.background] - theme override
 * @param {{near:number,far:number}|null} [opts.fog] - theme override
 * @param {number} [opts.exposure]
 * @param {boolean} [opts.shadows=true]
 * @param {number} [opts.fov=36]
 * @param {[number,number,number]} [opts.cameraPosition]
 * @param {[number,number,number]} [opts.target]
 * @param {number} [opts.minDistance]
 * @param {number} [opts.maxDistance]
 * @param {number} [opts.maxPolarAngle]
 * @param {number} [opts.minPolarAngle]
 * @param {'plinth'|'platform'|'ground'|null} [opts.stage='plinth']
 * @param {number} [opts.stageRadius=3.55]
 * @param {boolean} [opts.grid] - theme default
 * @param {(message:string)=>void} [opts.onContextLost]
 */
export function createStudio(host, opts = {}) {
  const theme = STUDIO_THEMES[opts.theme || 'dark'] || STUDIO_THEMES.dark
  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch {
    throw new Error('webgl-unavailable')
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = opts.exposure ?? theme.exposure
  if (opts.shadows !== false) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Static scenes: refresh the shadow map only when something moves.
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
  }
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(opts.background || theme.background)
  const fogSpec = opts.fog !== undefined ? opts.fog : theme.fog
  if (fogSpec) scene.fog = new THREE.Fog(fogSpec.color, fogSpec.near, fogSpec.far)

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 36, 1, 0.05, 500)
  camera.position.set(...(opts.cameraPosition || [-5.7, 2.9, 6.3]))

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(...(opts.target || [0, 0.8, 0]))
  controls.enableDamping = true
  controls.dampingFactor = 0.065
  controls.minDistance = opts.minDistance ?? 0.5
  controls.maxDistance = opts.maxDistance ?? 120
  controls.maxPolarAngle = opts.maxPolarAngle ?? Math.PI * 0.495
  if (opts.minPolarAngle !== undefined) controls.minPolarAngle = opts.minPolarAngle
  controls.autoRotateSpeed = 0.65

  // Image-based lighting: PMREM-baked room environment (the tools' recipe).
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04)
  scene.environment = env.texture

  const hemi = new THREE.HemisphereLight(theme.hemi.sky, theme.hemi.ground, theme.hemi.intensity)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(theme.key.color, theme.key.intensity)
  key.position.set(...theme.key.position)
  scene.add(key)
  const rim = new THREE.DirectionalLight(theme.rim.color, theme.rim.intensity)
  rim.position.set(...theme.rim.position)
  scene.add(rim)
  let accent = null
  if (theme.accent) {
    accent = new THREE.PointLight(theme.accent.color, theme.accent.intensity, theme.accent.distance)
    accent.position.set(...theme.accent.position)
    scene.add(accent)
  }
  if (opts.shadows !== false) {
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    const s = opts.stageRadius ? opts.stageRadius * 2.2 : 8
    key.shadow.camera.left = -s
    key.shadow.camera.right = s
    key.shadow.camera.top = s
    key.shadow.camera.bottom = -s
    key.shadow.bias = -0.001
  }

  // Staging: plinth + hairline rings + ground (+ grid) like the tools' stages.
  const stageGroup = new THREE.Group()
  scene.add(stageGroup)
  const stageMaterials = []
  const stageRadius = opts.stageRadius ?? 3.55
  const stageKind = opts.stage !== undefined ? opts.stage : 'plinth'
  if (stageKind && theme.ground) {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(stageKind === 'ground' ? stageRadius * 8 : 30, 96),
      new THREE.MeshStandardMaterial({ color: theme.ground.color, roughness: theme.ground.roughness, metalness: theme.ground.metalness })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    if (opts.shadows !== false) ground.receiveShadow = true
    stageGroup.add(ground)
  }
  if (stageKind === 'plinth' && theme.plinth) {
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(stageRadius, stageRadius + 0.05, 0.13, 96),
      new THREE.MeshStandardMaterial({ color: theme.plinth.color, metalness: theme.plinth.metalness, roughness: theme.plinth.roughness })
    )
    plinth.position.y = -0.085
    if (opts.shadows !== false) plinth.receiveShadow = true
    stageGroup.add(plinth)
    if (theme.ring) {
      const rimMat = new THREE.MeshStandardMaterial({ color: theme.ring.color, metalness: theme.ring.metalness, roughness: theme.ring.roughness })
      stageMaterials.push(rimMat)
      for (const r of [stageRadius - 0.19, stageRadius - 0.04]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 5, 128), rimMat)
        ring.rotation.x = -Math.PI / 2
        ring.position.y = -0.015
        stageGroup.add(ring)
      }
    }
  }
  if (stageKind === 'platform' && theme.plinth) {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(stageRadius, stageRadius + 0.02, 0.028, 100),
      new THREE.MeshStandardMaterial({ color: theme.plinth.color, metalness: theme.plinth.metalness, roughness: theme.plinth.roughness })
    )
    platform.position.y = -0.016
    stageGroup.add(platform)
    const hairline = new THREE.MeshBasicMaterial({ color: theme.ring ? theme.ring.color : 0x8c969f, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    stageMaterials.push(hairline)
    for (const [r, o] of [[stageRadius - 0.05, 0.4], [stageRadius - 0.13, 0.16]]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.002, 128), hairline)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.001
      ring.material = hairline.clone()
      ring.material.opacity = o
      stageMaterials.push(ring.material)
      stageGroup.add(ring)
    }
  }
  let grid = null
  const wantsGrid = opts.grid !== undefined ? opts.grid : Boolean(theme.grid && stageKind === 'plinth')
  if (wantsGrid && theme.grid) {
    grid = new THREE.GridHelper(stageRadius * 16, 100, theme.grid.main, theme.grid.sub)
    grid.position.y = -0.015
    grid.material.transparent = true
    grid.material.opacity = theme.grid.opacity
    stageGroup.add(grid)
  }

  // Dirty-flag render loop: engines call invalidate() when anything changes;
  // idle frames are skipped entirely (the tools' on-demand pattern).
  let dirty = true
  let raf = 0
  let last = performance.now()
  let frameCb = null
  const invalidate = () => { dirty = true }
  controls.addEventListener('change', invalidate)

  const loop = (now) => {
    raf = requestAnimationFrame(loop)
    if (document.hidden) return
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    let animating = false
    if (frameCb) animating = frameCb(dt) === true
    controls.update()
    if (dirty || animating) {
      dirty = false
      if (renderer.shadowMap.enabled && renderer.shadowMap.autoUpdate === false) {
        renderer.shadowMap.needsUpdate = true
      }
      renderer.render(scene, camera)
    }
  }

  const resize = () => {
    const w = host.clientWidth || 640
    const h = host.clientHeight || 560
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 768 || h < 600 ? 1.5 : 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    invalidate()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()

  const onLost = (e) => {
    e.preventDefault()
    if (opts.onContextLost) opts.onContextLost('The graphics connection was interrupted. Please reload the view.')
  }
  renderer.domElement.addEventListener('webglcontextlost', onLost)

  raf = requestAnimationFrame(loop)

  return {
    renderer,
    scene,
    camera,
    controls,
    stageGroup,
    grid,
    keyLight: key,
    envTexture: env.texture,
    reducedMotion,
    coarsePointer,
    host,
    invalidate,
    /** Register the per-frame callback; return true while animating. */
    onFrame(cb) { frameCb = cb; invalidate() },
    refreshShadows() { if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true },
    dispose() {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      controls.removeEventListener('change', invalidate)
      controls.dispose()
      stageMaterials.forEach((m) => m.dispose())
      scene.traverse((o) => {
        if (o.isMesh || o.isPoints || o.isLine) {
          if (o.geometry) o.geometry.dispose()
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => m && m.dispose && m.dispose())
        }
      })
      env.dispose()
      pmrem.dispose()
      room.dispose?.()
      renderer.dispose()
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    },
  }
}

/** Clamp a number into [min, max] (NaN-safe). */
export function clampNum(v, min, max) {
  const n = Number(v)
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}
