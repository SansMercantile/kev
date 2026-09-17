/**
 * KEV Human Atlas viewer - the full BodyParts3D 4.0 anatomy engine.
 *
 * Adapted from the human-atlas tool's scene (MIT License, (c) ashemag;
 * see docs/ATTRIBUTION-human-atlas.md). Anatomy data: BodyParts3D 4.0,
 * CC BY 4.0, DBCLS (https://bodyparts3d.org/). Educational explorer, not
 * a diagnostic tool.
 *
 * What it does (mirroring the tool):
 *   - streams public/models/atlas.json + 15 gzip geometry chunks
 *     (DecompressionStream, 3 parallel workers, progress callback)
 *   - builds 2,234 per-part geometry views over the shared buffers
 *     (Int16 normalized normals keep memory compact), merged per system
 *     into ~15 draw calls
 *   - GPU part-state: explode offsets + visibility live in a float
 *     DataTexture and selection in a byte DataTexture, both sampled in an
 *     injected vertex/fragment shader - no per-mesh JS matrix churn
 *   - integumentary system renders as a ghost shell (0.1 opacity)
 *   - two-phase explode: systems fan out radially, then parts pack into
 *     the aspect-aware "anatomical inventory" grid (packCells)
 *   - camera views (three-quarter/front/back/side), isolate framing,
 *     auto-rotate, hover tooltip, marker points at high explode
 *   - on-demand rendering through the shared studio bootstrap
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createStudio } from './studioRenderer'
import { packCells } from './explosionLayout'
import { PointerTap } from '../pointerTap'

/** Catalogue generation pinned into every model URL. Bump whenever
 * public/models/atlas.json or its geometry chunks change, so a stale
 * service-worker cache can never mix catalogue generations with code that
 * sized its typed arrays from a different one (previously an out-of-bounds
 * crash loop in _frame). */
export const ATLAS_CATALOG_VERSION = '2026-09-16-bodyparts3d-4.0'

/** Static hosts may serve .gz pre-compressed or as a plain gzip file; the
 * magic-byte check avoids decoding twice. (Adapted from human-atlas, MIT.) */
async function decodeModelResponse(response, expectedBytes, compressed) {
  if (!response.ok) throw new Error('An anatomy file could not be loaded.')
  const payload = await response.arrayBuffer()
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength))
  const gzip = compressed && signature[0] === 0x1f && signature[1] === 0x8b
  const buffer = gzip
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : payload
  if (buffer.byteLength !== expectedBytes) throw new Error('An anatomy file was incomplete. Please reload the viewer.')
  return buffer
}

const DEFAULT_VISIBLE = [
  'cardiac', 'sensory', 'skeletal', 'muscular', 'arterial', 'venous', 'nervous',
  'respiratory', 'digestive', 'urinary', 'lymphatic', 'endocrine', 'reproductive', 'connective',
]

const VIEWS = {
  'three-quarter': new THREE.Vector3(0.35, 0.06, 1).normalize(),
  front: new THREE.Vector3(0, 0.02, 1),
  back: new THREE.Vector3(0, 0.02, -1),
  side: new THREE.Vector3(1, 0.02, 0),
}

export class AtlasViewer {
  /**
   * @param {HTMLElement} host
   * @param {object} opts
   * @param {(partId:string)=>void} [opts.onSelect]
   * @param {(percent:number)=>void} [opts.onProgress]
   * @param {(message:string)=>void} [opts.onError]
   * @param {(systems:Array)=>void} [opts.onAtlas] - called with the loaded atlas metadata
   * @param {'light'|'dark'} [opts.theme='light']
   * @param {Array<{id:string,color:string}>} opts.systems - system id -> color (ANATOMY_SYSTEMS)
   */
  constructor(host, opts = {}) {
    this.host = host
    this.opts = opts
    this.state = {
      explode: 0,
      visible: [...DEFAULT_VISIBLE],
      selected: [],
      isolate: false,
      view: 'three-quarter',
      rotate: false,
      reset: 0,
    }
    this.atlas = null
    this.disposed = false
    this.abort = new AbortController()
    this.ready = false
    this.amount = 0
    this.lastState = null
    this.layoutKey = ''
    this.packingWidth = 1
    this.packingHeight = 1
    this.lastView = ''
    this.lastReset = -1
    this.lastIsolate = ''
    this.geometries = []
    this.materials = []
    this.pickers = []
    this.centers = []
    this.offsets = []
    this.bounds = []
    this.targets = []

    try {
      this.studio = createStudio(host, {
        theme: opts.theme || 'light',
        stage: 'platform',
        stageRadius: 0.8,
        fov: 34,
        cameraPosition: [1.4, 1.05, 3.6],
        target: [0, 0.85, 0],
        minDistance: 0.07,
        maxDistance: 40,
        maxPolarAngle: Math.PI * 0.96,
        shadows: false, // the tool skips shadow maps here; IBL carries the form
        onContextLost: (m) => opts.onError && opts.onError(m),
      })
    } catch {
      opts.onError && opts.onError('This browser could not start the 3D viewer.')
      this.failed = true
      return
    }
    const { scene, camera, controls, renderer } = this.studio
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.'
    )

    // GPU part-state textures (allocated once atlas metadata arrives).
    this.partTexture = null
    this.selectionTexture = null
    this.stateWidth = 1
    this.data = null
    this.selectedData = null

    this.markerGeometry = new THREE.BufferGeometry()
    this.markerMaterial = new THREE.PointsMaterial({ color: 0x64748b, size: 5, sizeAttenuation: false, transparent: true, opacity: 0.72, depthTest: false })
    // Round markers instead of squares (from the tool's shader tweak).
    this.markerMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;'
      )
    }
    this.markers = new THREE.Points(this.markerGeometry, this.markerMaterial)
    this.markers.frustumCulled = false
    this.markers.renderOrder = 10
    this.markers.visible = false
    scene.add(this.markers)

    this.hover = document.createElement('div')
    this.hover.className = 'atlas-hover'
    this.hover.setAttribute('role', 'tooltip')
    this.hover.hidden = true
    host.appendChild(this.hover)

    this._bindPointer(camera, controls)
    controls.addEventListener('change', () => this.studio.invalidate())

    this.studio.onFrame((dt) => this._frame(dt))
    this.load()
  }

  async load() {
    const { onError, onProgress, onAtlas } = this.opts
    try {
      // Version-pinned catalogue: the service worker caches /models/* for
      // 30 days, so the catalogue generation travels in the URL. A stale
      // cached catalogue mixed with newer code (or vice versa) previously
      // crashed the frame loop with an out-of-bounds typed-array write.
      const res = await fetch(`/models/atlas.json?v=${ATLAS_CATALOG_VERSION}`, { signal: this.abort.signal })
      if (!res.ok) throw new Error('The anatomy catalogue could not be loaded.')
      const atlas = await res.json()
      if (this.disposed) return
      this.atlas = atlas
      onAtlas && onAtlas(atlas)
      this._initPartState(atlas)
      if (typeof DecompressionStream === 'undefined') {
        throw new Error('This browser cannot decompress the anatomy data. Update your browser to explore the full atlas.')
      }
      let cursor = 0
      let loaded = 0
      const worker = async () => {
        while (cursor < atlas.chunks.length) {
          const i = cursor++
          await this._loadChunk(i)
          loaded++
          onProgress && onProgress(Math.round((loaded / atlas.chunks.length) * 100))
        }
      }
      await Promise.all([worker(), worker(), worker()])
      if (this.disposed) return
      this.ready = true
      this.lastState = null
      this.studio.invalidate()
      onProgress && onProgress(100)
    } catch (e) {
      if (this.disposed || e?.name === 'AbortError') return
      onError && onError(e instanceof Error ? e.message : 'Could not load the anatomy.')
    }
  }

  _initPartState(atlas) {
    if (!atlas || !Array.isArray(atlas.parts) || atlas.parts.length === 0) {
      throw new Error('The anatomy catalogue arrived empty.')
    }
    const width = THREE.MathUtils.ceilPowerOfTwo(atlas.parts.length)
    this.stateWidth = width
    this.data = new Float32Array(width * 4)
    this.selectedData = new Uint8Array(width * 4)
    this.partTexture = new THREE.DataTexture(this.data, width, 1, THREE.RGBAFormat, THREE.FloatType)
    this.partTexture.needsUpdate = true
    this.selectionTexture = new THREE.DataTexture(this.selectedData, width, 1)
    this.selectionTexture.needsUpdate = true
    this.centers = atlas.parts.map(
      (p) => new THREE.Vector3().fromArray(p.bounds[0]).add(new THREE.Vector3().fromArray(p.bounds[1])).multiplyScalar(0.5)
    )
    this.bounds = atlas.parts.map((p) => new THREE.Box3(new THREE.Vector3().fromArray(p.bounds[0]), new THREE.Vector3().fromArray(p.bounds[1])))
    this.offsets = atlas.parts.map(() => new THREE.Vector3())
    const positions = new Float32Array(atlas.parts.length * 3)
    this.markerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    // Per-system materials with the GPU part-state shader (from the tool).
    const systems = this.opts.systems || []
    this.mats = new Map()
    for (const sys of systems) {
      this.mats.set(sys.id, this._materialFor(sys))
    }
  }

  _materialFor(system) {
    const ghost = system.id === 'integumentary'
    const m = new THREE.MeshStandardMaterial({
      color: system.color || '#aebbb8',
      metalness: 0.08,
      roughness: 0.53,
      side: THREE.DoubleSide,
      transparent: ghost,
      opacity: ghost ? 0.1 : 1,
      depthWrite: !ghost,
    })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.partState = { value: this.partTexture }
      shader.uniforms.selectionState = { value: this.selectionTexture }
      shader.uniforms.stateWidth = { value: this.stateWidth }
      shader.vertexShader =
        'attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected;\n' +
        shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;'
      )
      shader.fragmentShader = 'varying float partVisible; varying float partSelected;\n' + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;'
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75);'
      )
    }
    this.materials.push(m)
    return m
  }

  async _loadChunk(ci) {
    const atlas = this.atlas
    const chunk = atlas.chunks[ci]
    const compressed = Boolean(chunk.gzip)
    const chunkUrl = `${compressed ? chunk.gzip : chunk.url}?v=${ATLAS_CATALOG_VERSION}`
    const response = await fetch(chunkUrl, { signal: this.abort.signal })
    const buffer = await decodeModelResponse(response, chunk.bytes, compressed)
    if (this.disposed) return
    const groups = new Map()
    atlas.parts.forEach((p, i) => {
      if (p.chunk !== ci) return
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3))
      // GPU-normalized signed-short normals keep the full atlas compact.
      g.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true))
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1))
      g.boundingBox = this.bounds[i].clone()
      g.computeBoundingSphere()
      const pick = new THREE.Mesh(g)
      pick.matrixAutoUpdate = false
      this.pickers[i] = pick
      this.geometries.push(g)
      g.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1))
      const list = groups.get(p.system) || []
      list.push(g)
      groups.set(p.system, list)
    })
    groups.forEach((gs, system) => {
      const geometry = mergeGeometries(gs, false)
      if (!geometry) throw new Error('Could not assemble anatomy geometry.')
      this.geometries.push(geometry)
      const material = this.mats.get(system)
      if (!material) return
      const mesh = new THREE.Mesh(geometry, material)
      mesh.frustumCulled = false
      this.studio.scene.add(mesh)
      this.systemMeshes = this.systemMeshes || []
      this.systemMeshes.push(mesh)
    })
    this.lastState = null
    this.studio.invalidate()
  }

  setState(partial) {
    this.state = { ...this.state, ...partial }
    this.studio && this.studio.invalidate()
  }

  reset() {
    this.setState({ explode: 0, visible: [...DEFAULT_VISIBLE], selected: [], isolate: false, view: 'three-quarter', rotate: false, reset: this.state.reset + 1 })
  }

  _bindPointer(camera, controls) {
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const tap = new PointerTap()
    const worldBox = new THREE.Box3()
    const hitPoint = new THREE.Vector3()
    const el = this.studio.renderer.domElement

    const findTarget = (x, y, radius) => {
      let best = -1
      let score = Infinity
      for (const t of this.targets) {
        const dx = Math.max(t.left - x, 0, x - t.right)
        const dy = Math.max(t.top - y, 0, y - t.bottom)
        const distance = Math.hypot(dx, dy)
        if (distance > radius) continue
        const candidate = distance + Math.hypot(t.x - x, t.y - y) * 0.025
        if (candidate < score) {
          score = candidate
          best = t.index
        }
      }
      return best
    }

    const down = (e) => {
      this.hover.hidden = true
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
    }
    const move = (e) => {
      tap.move(e.pointerId, e.clientX, e.clientY)
      if (e.buttons || this.amount < 0.5 || e.pointerType === 'touch') {
        this.hover.hidden = true
        return
      }
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const index = findTarget(x, y, 12)
      this.hover.hidden = index < 0
      el.style.cursor = index < 0 ? 'grab' : 'pointer'
      if (index >= 0 && this.atlas) {
        this.hover.textContent = this.atlas.parts[index].name
        this.hover.style.left = `${Math.max(8, Math.min(x + 14, el.clientWidth - 260))}px`
        this.hover.style.top = `${Math.max(8, Math.min(y + 18, el.clientHeight - 55))}px`
      }
    }
    const up = (e) => {
      if (!tap.up(e.pointerId, e.clientX, e.clientY) || !this.ready || !this.atlas) return
      const rect = el.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      let nearest = Infinity
      let found = -1
      const hasSolid = this.atlas.parts.some((p, i) => p.system !== 'integumentary' && this.data[i * 4 + 3] > 0.5)
      this.pickers.forEach((mesh, i) => {
        if (!mesh || this.data[i * 4 + 3] < 0.5) return
        if (hasSolid && this.atlas.parts[i].system === 'integumentary') return
        worldBox.copy(this.bounds[i]).translate(mesh.position)
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return
        const hits = raycaster.intersectObject(mesh, false)
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance
          found = i
        }
      })
      if (found < 0 && this.amount > 0.45) found = findTarget(e.clientX - rect.left, e.clientY - rect.top, e.pointerType === 'touch' ? 24 : 16)
      if (found >= 0) {
        this.hover.hidden = true
        this.opts.onSelect && this.opts.onSelect(this.atlas.parts[found].id)
      }
    }
    const cancel = (e) => tap.cancel(e.pointerId)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
    this._pointerCleanup = () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', cancel)
    }
  }

  _fit(view, extent = 0) {
    const { camera, controls, host } = this.studio
    const aspect = camera.aspect
    const fovFactor = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const mobile = host.clientWidth < 768
    const normalDistance = mobile ? Math.max(4.5, 1.9 / fovFactor) : Math.max(3.6, 1.9 / fovFactor / Math.min(1, aspect * 0.9))
    const atlasDistance =
      (Math.max(this.packingHeight, this.packingWidth / Math.max(0.35, aspect)) / fovFactor) * 1.35
    const distance = THREE.MathUtils.lerp(normalDistance, Math.max(0.2, atlasDistance), extent)
    const direction = (VIEWS[view] || VIEWS['three-quarter']).clone()
    if (extent > 0.8) direction.set(0, 0.02, 1)
    controls.target.set(extent > 0.1 && !mobile ? -this.packingWidth * 0.12 : 0, extent > 0.1 || mobile ? 0.85 : 0.68, 0)
    camera.position.copy(controls.target).addScaledVector(direction, distance)
    controls.update()
    this.studio.invalidate()
  }

  _frame(dt) {
    if (!this.atlas || this.disposed) return false
    const s = this.state
    const { camera, controls, host, renderer, reducedMotion } = this.studio
    const changed = !this.lastState || this.lastState.visible !== s.visible || this.lastState.selected !== s.selected || this.lastState.isolate !== s.isolate
    const moving = Math.abs(this.amount - s.explode / 100) > 0.0001
    let animating = false

    if (moving) {
      this.amount = reducedMotion ? s.explode / 100 : THREE.MathUtils.damp(this.amount, s.explode / 100, 8, dt)
      animating = true
    }

    if (changed || moving || !this.lastState) {
      if (!this.ready) return animating
      try {
        // Self-heal: if the catalogue changed under us (stale cache mixed
        // with newer code or vice versa), the state arrays sized at init no
        // longer fit the parts list. Rebuild them instead of writing
        // out of bounds (previously an uncaught per-frame crash loop).
        if (!this.data || this.atlas.parts.length * 4 > this.data.length) {
          try {
            this.partTexture && this.partTexture.dispose()
            this.selectionTexture && this.selectionTexture.dispose()
          } catch {
            /* dispose is best-effort */
          }
          this._initPartState(this.atlas)
        }
        const capacity = Math.floor(this.data.length / 4)
      const visible = new Set(s.visible)
      const selection = new Set(s.selected)
      const visibleParts = this.atlas.parts.filter((p) => (s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id)))
      const nextLayoutKey = visibleParts.map((p) => p.id).join(',') + ':' + camera.aspect.toFixed(3)
      if (nextLayoutKey !== this.layoutKey) {
        const cards = visibleParts.map((p) => ({
          id: p.id,
          width: Math.max(0.035, p.bounds[1][0] - p.bounds[0][0]) + 0.04,
          height: Math.max(0.035, p.bounds[1][1] - p.bounds[0][1]) + 0.04,
        }))
        const layout = packCells(cards, camera.aspect)
        this.packingWidth = layout.width
        this.packingHeight = layout.height
        this.atlas.parts.forEach((p, i) => {
          const cell = layout.cells.get(p.id)
          this.offsets[i] = cell ? new THREE.Vector3(cell.x, cell.y + 0.85, 0) : this.centers[i].clone()
        })
        this.layoutKey = nextLayoutKey
        if (this.amount > 0.05 && !s.isolate) this._fit(s.view, Math.max(0, (this.amount - 0.3) / 0.7))
      }

      const systemIds = (this.opts.systems || []).map((x) => x.id)
      this.atlas.parts.forEach((p, i) => {
        if (i >= capacity) return // never write past the state arrays
        const c = this.centers[i]
        const destination = this.offsets[i]
        let dx = 0
        let dy = 0
        let dz = 0
        const amount = this.amount
        if (amount <= 0.45) {
          const t = amount / 0.45
          const group = systemIds.indexOf(p.system)
          const angle = ((group < 0 ? 0 : group) / Math.max(1, systemIds.length)) * Math.PI * 2
          dx = Math.sin(angle) * t * 0.48
          dy = (c.y - 0.85) * t * 0.28
          dz = Math.cos(angle) * t * 0.48
        } else {
          const t = (amount - 0.45) / 0.55
          const group = systemIds.indexOf(p.system)
          const angle = ((group < 0 ? 0 : group) / Math.max(1, systemIds.length)) * Math.PI * 2
          dx = THREE.MathUtils.lerp(Math.sin(angle) * 0.48, destination.x - c.x, t)
          dy = THREE.MathUtils.lerp((c.y - 0.85) * 0.28, destination.y - c.y, t)
          dz = THREE.MathUtils.lerp(Math.cos(angle) * 0.48, -c.z, t)
        }
        const selected = selection.has(p.id)
        const isVisible = (s.isolate ? selected : visible.has(p.system) || selected) ? 1 : 0
        this.data.set([dx, dy, dz, isVisible], i * 4)
        this.selectedData[i * 4] = selected ? 255 : 0
        const markerPos = this.markerGeometry.getAttribute('position')
        markerPos.set(i * 3, isVisible > 0.5 ? c.x + dx : 10000)
        markerPos.set(i * 3 + 1, isVisible > 0.5 ? c.y + dy : 10000)
        markerPos.set(i * 3 + 2, isVisible > 0.5 ? c.z + dz : 10000)
        const mesh = this.pickers[i]
        if (mesh) {
          mesh.position.set(dx, dy, dz)
          mesh.updateMatrix()
          mesh.updateMatrixWorld(true)
        }
      })
      this.partTexture.needsUpdate = true
      this.selectionTexture.needsUpdate = true
      this.markerGeometry.attributes.position.needsUpdate = true
      this.lastState = { visible: s.visible, selected: s.selected, isolate: s.isolate }
      this.studio.invalidate()
      } catch (e) {
        // A render-loop exception must never become a per-frame crash loop:
        // report once so the host swaps in the honest box-catalog fallback.
        if (!this._frameFailed && !this.disposed) {
          this._frameFailed = true
          this.opts.onError && this.opts.onError('The full atlas hit a rendering problem; showing the lightweight model instead.')
        }
        return animating
      }
    }

    if (s.view !== this.lastView || s.reset !== this.lastReset) {
      this._fit(s.view, this.amount)
      this.lastView = s.view
      this.lastReset = s.reset
    }
    if (moving && !s.isolate) this._fit(this.amount > 0.5 ? 'front' : s.view, Math.max(0, (this.amount - 0.3) / 0.7))

    const isolateKey = s.isolate ? s.selected.join(',') + ':' + s.reset + ':' + camera.aspect.toFixed(3) : ''
    if (isolateKey !== this.lastIsolate) {
      if (s.isolate) {
        const box = new THREE.Box3()
        this.atlas.parts.forEach((p, i) => {
          if (s.selected.includes(p.id)) box.union(this.bounds[i].clone().translate(new THREE.Vector3(this.data[i * 4], this.data[i * 4 + 1], this.data[i * 4 + 2])))
        })
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const fovFactor = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
          const distance = Math.max(0.07, (Math.max(size.y, size.x / Math.max(0.2, camera.aspect), size.z) / fovFactor) * 1.6)
          controls.maxDistance = Math.max(40, distance * 2)
          controls.target.copy(center)
          camera.position.copy(center).add(new THREE.Vector3(0.2, 0.1, 1).normalize().multiplyScalar(distance))
          controls.update()
          this.studio.invalidate()
        }
      } else if (this.lastIsolate) {
        camera.clearViewOffset()
        this._fit(s.view, this.amount)
      }
      this.lastIsolate = isolateKey
    }

    controls.enableRotate = this.amount < 0.8
    controls.mouseButtons.LEFT = this.amount < 0.8 ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
    controls.touches.ONE = this.amount < 0.8 ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN
    this.studio.stageGroup.visible = this.amount < 0.5 && !s.isolate
    this.markers.visible = this.amount > 0.75 && !s.isolate
    controls.autoRotate = s.rotate && !s.isolate && this.amount < 0.4 && !this.studio.reducedMotion
    if (controls.autoRotate) animating = true

    // Screen-space hover/marker targets refresh on rendered frames.
    if (this.ready && this.amount > 0.45) {
      this.targets = []
      const projected = new THREE.Vector3()
      const w = host.clientWidth
      const h = host.clientHeight
      const hasSolid = this.atlas.parts.some((p, i) => p.system !== 'integumentary' && this.data[i * 4 + 3] > 0.5)
      this.atlas.parts.forEach((p, i) => {
        if (this.data[i * 4 + 3] < 0.5) return
        if (hasSolid && p.system === 'integumentary') return
        let left = Infinity
        let right = -Infinity
        let top = Infinity
        let bottom = -Infinity
        for (let corner = 0; corner < 8; corner++) {
          projected.set(
            p.bounds[corner & 1 ? 1 : 0][0] + this.data[i * 4],
            p.bounds[corner & 2 ? 1 : 0][1] + this.data[i * 4 + 1],
            p.bounds[corner & 4 ? 1 : 0][2] + this.data[i * 4 + 2]
          ).project(camera)
          const x = ((projected.x + 1) * w) / 2
          const y = ((1 - projected.y) * h) / 2
          left = Math.min(left, x)
          right = Math.max(right, x)
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }
        projected.copy(this.centers[i]).add(new THREE.Vector3(this.data[i * 4], this.data[i * 4 + 1], this.data[i * 4 + 2])).project(camera)
        if (projected.z < -1 || projected.z > 1) return
        this.targets.push({ index: i, x: ((projected.x + 1) * w) / 2, y: ((1 - projected.y) * h) / 2, left, right, top, bottom })
      })
    } else {
      this.targets = []
    }
    return animating
  }

  dispose() {
    this.disposed = true
    this.abort.abort()
    if (this.failed) return
    this._pointerCleanup && this._pointerCleanup()
    this.geometries.forEach((g) => g.dispose())
    this.materials.forEach((m) => m.dispose())
    this.partTexture && this.partTexture.dispose()
    this.selectionTexture && this.selectionTexture.dispose()
    this.markerGeometry.dispose()
    this.markerMaterial.dispose()
    this.hover.remove()
    this.studio.dispose()
  }
}
