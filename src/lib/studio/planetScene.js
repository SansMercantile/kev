/**
 * KEV Planetary explorer scene — layered planets/moons/sun with concentric
 * radial explode, per-body rotation, orbit, real surface textures, and
 * schematic substance deposits. Built for the /planets + /system routes.
 *
 * Interior structure: published seismic/structure models (see
 * tools/human-atlas/scripts/planets.py). Deposits are schematic teaching
 * geometry, labeled as such. Textures: NASA/JPL public-domain maps
 * (public/textures/planets/).
 */
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerTap } from '../pointerTap'

const GOLD = new T.Color('#c9a227')

async function decodeModelResponse(response, expectedBytes, compressed) {
  if (!response.ok) throw new Error('A model file could not be loaded.')
  const payload = await response.arrayBuffer()
  const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength))
  const gzip = compressed && sig[0] === 0x1f && sig[1] === 0x8b
  const buffer = gzip
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : payload
  if (buffer.byteLength !== expectedBytes) throw new Error('A model file was incomplete.')
  return buffer
}

function colorFor(system, fallback) {
  return new T.Color(fallback || '#8a8a8a')
}

/**
 * @param {HTMLElement} el
 * @param {object} opts
 * @param {object} opts.atlas - parsed atlas-planet-*.json
 * @param {object} opts.body  - {label, color, texture, rotation_h, emissive, rings}
 * @param {object} opts.state - {explode, spin, orbit, visible:Set<system>, selected:[ids]}
 */
export function createPlanetScene(el, { atlas, body, state, onSelect, onProgress, onError }) {
  let disposed = false
  let frame = 0
  const latest = { current: state }
  const abort = new AbortController()

  let renderer
  try {
    renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  } catch {
    onError && onError('This browser could not start WebGL.')
    return { dispose() {}, setState() {} }
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  el.appendChild(renderer.domElement)

  const scene = new T.Scene()
  scene.background = new T.Color('#04060b')
  const camera = new T.PerspectiveCamera(42, 1, 0.01, 500)
  const controls = new OrbitControls(camera, renderer.domElement)
  camera.position.set(0, 2.2, 12.5)
  controls.target.set(0, 0, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 6
  controls.maxDistance = 60

  // starfield
  const starGeo = new T.BufferGeometry()
  const starCount = 1600
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const r = 220 + Math.random() * 180
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    starPos[i * 3 + 1] = r * Math.cos(ph)
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
  }
  starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3))
  scene.add(new T.Points(starGeo, new T.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 0.85 })))

  // lights
  if (body.emissive) {
    scene.add(new T.AmbientLight(0xffffff, 0.9))
  } else {
    scene.add(new T.HemisphereLight(0xbfd0ff, 0x0a0a12, 0.35))
    const sun = new T.DirectionalLight(0xfff5e8, 2.4)
    sun.position.set(8, 3, 5)
    scene.add(sun)
  }

  // planet group (spins) + tilt group (axial tilt)
  const spinGroup = new T.Group()
  const tiltGroup = new T.Group()
  tiltGroup.rotation.z = T.MathUtils.degToRad(body.axial_tilt_deg || 0)
  tiltGroup.add(spinGroup)
  scene.add(tiltGroup)

  // rings (Saturn/Uranus/Neptune)
  if (body.rings) {
    const ringGeo = new T.RingGeometry(6.2, 11.5, 128, 1)
    const ringMat = new T.MeshBasicMaterial({ color: 0xc8b060, transparent: true, opacity: 0.35, side: T.DoubleSide })
    const ring = new T.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2 + 0.3
    spinGroup.add(ring)
  }

  // texture loader
  const texLoader = new T.TextureLoader()
  let surfaceTexture = null
  if (body.texture) {
    surfaceTexture = texLoader.load(`/textures/planets/${body.texture}`)
    surfaceTexture.colorSpace = T.SRGBColorSpace
  }

  // build meshes from atlas
  const parts = atlas.parts
  const centers = parts.map((p) => new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(0.5))
  const systemsMeta = {}  // system -> {color}
  // read layer colors from manifest scope where possible; else use SUBSTANCE palette passed via body
  const layerColors = (body.layerColors || {})

  const meshRecords = []
  let loaded = 0
  const loadChunk = async (ci) => {
    const chunk = atlas.chunks[ci]
    const compressed = !!chunk.gzip && typeof DecompressionStream !== 'undefined'
    const response = await fetch(compressed ? chunk.gzip : chunk.url, { signal: abort.signal })
    const buffer = await decodeModelResponse(response, chunk.bytes, compressed)
    if (disposed) return
    parts.forEach((p, i) => {
      if (p.chunk !== ci) return
      const g = new T.BufferGeometry()
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3))
      g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true))
      g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1))
      g.computeBoundingSphere()

      const isSurface = i === 0 && surfaceTexture
      const isGeologic = p.system === 'geologic'
      const colHex = layerColors[p.id] || (body.substanceColors && body.substanceColors[p.system]) || null
      const mat = new T.MeshStandardMaterial({
        color: colorFor(p.system, colHex || (isGeologic ? body.color : '#888888')),
        map: isSurface ? surfaceTexture : null,
        metalness: isGeologic ? 0.05 : 0.35,
        roughness: isGeologic ? 0.85 : 0.5,
        side: T.DoubleSide,
        transparent: p.system === 'ocean_water' || p.system === 'atmosphere' || p.system === 'cloud_tops',
        opacity: p.system === 'ocean_water' ? 0.75 : 1,
        emissive: body.emissive ? colorFor(p.system, colHex || body.color) : new T.Color(0x000000),
        emissiveIntensity: body.emissive ? 1.0 : 0,
      })
      const mesh = new T.Mesh(g, mat)
      mesh.userData.partIndex = i
      spinGroup.add(mesh)
      meshRecords[i] = { mesh, center: centers[i], system: p.system, id: p.id }
    })
    loaded++
    onProgress && onProgress(Math.round((loaded / atlas.chunks.length) * 100))
  }

  ;(async () => {
    try {
      for (let i = 0; i < atlas.chunks.length; i++) await loadChunk(i)
    } catch (e) {
      if (!disposed) onError && onError(e instanceof Error ? e.message : 'Load failed')
    }
  })()

  // picking
  const raycaster = new T.Raycaster()
  const pointer = new T.Vector2()
  const tap = new PointerTap()
  const down = (e) => tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
  const move = (e) => tap.move(e.pointerId, e.clientX, e.clientY)
  const up = (e) => {
    if (!tap.up(e.pointerId, e.clientX, e.clientY)) return
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const meshes = meshRecords.filter(Boolean).map((r) => r.mesh)
    const hits = raycaster.intersectObjects(meshes, false)
    if (hits[0]) {
      const i = hits[0].object.userData.partIndex
      onSelect && onSelect(parts[i].id)
    }
  }
  renderer.domElement.addEventListener('pointerdown', down)
  renderer.domElement.addEventListener('pointermove', move)
  renderer.domElement.addEventListener('pointerup', up)

  const resize = () => {
    camera.aspect = el.clientWidth / el.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(el.clientWidth, el.clientHeight)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(el)
  resize()

  const clock = new T.Clock()
  let explodeAmt = 0
  const animate = () => {
    if (disposed) return
    frame = requestAnimationFrame(animate)
    const dt = Math.min(clock.getDelta(), 0.05)
    const s = latest.current
    // rotation (sidereal period -> scaled spin)
    if (s.spin) {
      const period = Math.abs(body.rotation_h || 24)
      const revPerSec = 1 / (period * 3.6) // hours*3.6 -> seconds-ish scale (aesthetic)
      spinGroup.rotation.y += dt * revPerSec * (body.rotation_h < 0 ? -1 : 1) * 40
    }
    // explode: push each layer outward from center by its outer radius
    explodeAmt = T.MathUtils.damp(explodeAmt, s.explode || 0, 6, dt)
    meshRecords.forEach((r) => {
      if (!r) return
      const dir = r.center.clone()
      const d = dir.length()
      const visible = s.visible ? s.visible.has(r.system) : true
      r.mesh.visible = visible
      if (d > 0.001) {
        dir.normalize()
        r.mesh.position.copy(dir.multiplyScalar(d * explodeAmt * 0.6))
      }
    })
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  function setState(partial) { latest.current = { ...latest.current, ...partial } }
  function dispose() {
    disposed = true
    abort.abort()
    cancelAnimationFrame(frame)
    observer.disconnect()
    controls.dispose()
    renderer.dispose()
    el.removeChild(renderer.domElement)
  }
  return { dispose, setState }
}
