/**
 * KEV Human Atlas scene — code-for-code port of tools/human-atlas/app/scene.tsx
 * (MIT License, (c) ashemag; see docs/ATTRIBUTION-human-atlas.md). Anatomy
 * data: BodyParts3D 4.0, CC BY 4.0, DBCLS (https://bodyparts3d.org/).
 *
 * This is the tool's own render loop, lighting rig, staging, GPU part-state
 * shader, two-phase explode, camera fit and pointer handling, ported without
 * the tool's Next/shadcn page chrome. It does NOT use the shared studio
 * bootstrap — it reproduces the tool's exact scene (clear color #f2f3f3,
 * hemisphere/key/rim lights, ground + platform + hairline rings, damped
 * OrbitControls, dirty-flag on-demand rendering) so the atlas looks and
 * behaves exactly like the reference tool.
 */

import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createExplosionLayout } from './explosionLayoutExact'
import { PointerTap } from '../pointerTap'
import { ANATOMY_SYSTEMS as SYSTEMS } from '../anatomySystems'

/** Static hosts may serve .gz pre-compressed or as a plain gzip file; the
 * magic-byte check avoids decoding twice. (Code-for-code from the tool's
 * model-download.ts.) */
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

/**
 * @param {HTMLElement} el
 * @param {object} opts
 * @param {object} opts.atlas - the parsed /models/atlas.json catalogue
 * @param {object} opts.state - SceneState {explode,visible,selected,isolate,view,rotate,reset,inspectorOpen}
 * @param {(id:string)=>void} opts.onSelect
 * @param {(n:number)=>void} opts.onProgress
 * @param {(s:string)=>void} opts.onError
 * @returns {{dispose():void, setState(partial:object):void}}
 */
export function createAtlasScene(el, { atlas, state, onSelect, onProgress, onError }) {
  let disposed = false
  let frame = 0
  let dirty = true
  let ready = false
  let lastView = ''
  let lastReset = -1
  let lastIsolate = ''
  let layoutKey = ''
  let amount = 0
  let lastState = null
  let lastExtent = -1
  const abort = new AbortController()
  const latest = { current: state }

  let renderer
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch {
    onError('This browser could not start the 3D viewer. Please try a browser with WebGL enabled.')
    return { dispose() {}, setState() {} }
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2))
  renderer.setClearColor('#f2f3f3')
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  el.appendChild(renderer.domElement)
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.'
  )

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(34, 1, 0.005, 100)
  const controls = new OrbitControls(camera, renderer.domElement)
  camera.position.set(1.4, 1.05, 3.6)
  controls.target.set(0, 0.85, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.085
  controls.minDistance = 0.07
  controls.maxDistance = 40
  controls.maxPolarAngle = Math.PI * 0.96
  controls.addEventListener('change', () => { dirty = true })

  const pmrem = new T.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04)
  scene.environment = env.texture
  room.dispose()
  pmrem.dispose()

  scene.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.05))
  const key = new T.DirectionalLight(0xfffaf4, 2.3)
  key.position.set(-2, 4, 3)
  scene.add(key)
  const rim = new T.DirectionalLight(0xe9f0ff, 1.8)
  rim.position.set(2, 2, -3)
  scene.add(rim)
  const ground = new T.Mesh(new T.CircleGeometry(30, 96), new T.MeshStandardMaterial({ color: 0xd5d9dc, roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.019
  scene.add(ground)
  const platform = new T.Mesh(new T.CylinderGeometry(0.68, 0.7, 0.028, 100), new T.MeshStandardMaterial({ color: 0xeeeeec, metalness: 0.12, roughness: 0.67 }))
  platform.position.y = -0.016
  scene.add(platform)
  const ring = new T.Mesh(new T.RingGeometry(0.63, 0.632, 128), new T.MeshBasicMaterial({ color: 0x8c969f, transparent: true, opacity: 0.4, side: T.DoubleSide }))
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.001
  scene.add(ring)
  const innerRing = new T.Mesh(new T.RingGeometry(0.55, 0.551, 128), new T.MeshBasicMaterial({ color: 0xa4aeb8, transparent: true, opacity: 0.16, side: T.DoubleSide }))
  innerRing.rotation.x = -Math.PI / 2
  innerRing.position.y = 0.001
  scene.add(innerRing)

  const width = T.MathUtils.ceilPowerOfTwo(atlas.parts.length)
  const data = new Float32Array(width * 4)
  const partTexture = new T.DataTexture(data, width, 1, T.RGBAFormat, T.FloatType)
  partTexture.needsUpdate = true
  const selectedData = new Uint8Array(width * 4)
  const selectionTexture = new T.DataTexture(selectedData, width, 1)
  selectionTexture.needsUpdate = true
  const materials = []
  const geometries = []
  const pickers = []
  const centers = atlas.parts.map((p) =>
    new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(0.5)
  )
  const offsets = []
  const bounds = atlas.parts.map(
    (p) => new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1]))
  )
  let packingWidth = 1
  let packingHeight = 1

  const markerPositions = new Float32Array(atlas.parts.length * 3)
  const markerGeometry = new T.BufferGeometry()
  markerGeometry.setAttribute('position', new T.BufferAttribute(markerPositions, 3))
  const markerMaterial = new T.PointsMaterial({ color: 0x64748b, size: 5, sizeAttenuation: false, transparent: true, opacity: 0.72, depthTest: false })
  markerMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;'
    )
  }
  const markers = new T.Points(markerGeometry, markerMaterial)
  markers.frustumCulled = false
  markers.renderOrder = 10
  markers.visible = false
  scene.add(markers)

  const hover = document.createElement('div')
  hover.className = 'part-hover'
  hover.setAttribute('role', 'tooltip')
  hover.hidden = true
  el.appendChild(hover)

  let targets = []
  const projected = new T.Vector3()
  const findTarget = (x, y, radius) => {
    let best = -1
    let score = Infinity
    for (const t of targets) {
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

  const materialFor = (system) => {
    const m = new T.MeshStandardMaterial({
      color: SYSTEMS.find((s) => s.id === system)?.color ?? '#aebbb8',
      metalness: 0.08,
      roughness: 0.53,
      side: T.DoubleSide,
      transparent: system === 'integumentary',
      opacity: system === 'integumentary' ? 0.1 : 1,
      depthWrite: system !== 'integumentary',
    })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.partState = { value: partTexture }
      shader.uniforms.selectionState = { value: selectionTexture }
      shader.uniforms.stateWidth = { value: width }
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
    materials.push(m)
    return m
  }
  const mats = new Map(SYSTEMS.map((s) => [s.id, materialFor(s.id)]))

  let loaded = 0
  const loadChunk = async (ci) => {
    const chunk = atlas.chunks[ci]
    const compressed = !!chunk.gzip && typeof DecompressionStream !== 'undefined'
    const response = await fetch(compressed ? chunk.gzip : chunk.url, { signal: abort.signal })
    const buffer = await decodeModelResponse(response, chunk.bytes, compressed)
    if (disposed) return
    const groups = new Map()
    atlas.parts.forEach((p, i) => {
      if (p.chunk !== ci) return
      const g = new T.BufferGeometry()
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3))
      g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true))
      g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1))
      g.boundingBox = bounds[i].clone()
      g.computeBoundingSphere()
      const pick = new T.Mesh(g)
      pick.matrixAutoUpdate = false
      pickers[i] = pick
      geometries.push(g)
      g.setAttribute('partIndex', new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1))
      const list = groups.get(p.system) ?? []
      list.push(g)
      groups.set(p.system, list)
    })
    groups.forEach((gs, system) => {
      const geometry = mergeGeometries(gs, false)
      if (!geometry) throw new Error('Could not assemble anatomy geometry.')
      geometries.push(geometry)
      const mesh = new T.Mesh(geometry, mats.get(system))
      mesh.frustumCulled = false
      scene.add(mesh)
    })
    lastState = null
    loaded++
    onProgress && onProgress(Math.round((loaded / atlas.chunks.length) * 100))
    dirty = true
  }

  ;(async () => {
    try {
      let cursor = 0
      await Promise.all(
        Array.from({ length: 3 }, async () => {
          while (cursor < atlas.chunks.length) {
            const i = cursor++
            await loadChunk(i)
          }
        })
      )
      if (!disposed) {
        ready = true
        dirty = true
      }
    } catch (e) {
      if (!disposed) onError && onError(e instanceof Error ? e.message : 'Could not load the anatomy.')
    }
  })()

  const fit = (view, extent = 0) => {
    const aspect = camera.aspect
    const mobile = el.clientWidth < 768
    const normalDistance = mobile
      ? Math.max(4.5, (1.8 * el.clientHeight) / Math.max(160, el.clientHeight - 350) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))))
      : 4
    const reservedHeight = mobile ? 350 : 270
    const availableAspect = Math.max(0.35, (el.clientWidth - (mobile ? 40 : 340)) / Math.max(160, el.clientHeight - reservedHeight))
    const atlasDistance =
      (Math.max(packingHeight, packingWidth / availableAspect) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
      (el.clientHeight / Math.max(160, el.clientHeight - reservedHeight)) *
      1.08
    const distance = T.MathUtils.lerp(normalDistance, Math.max(0.2, atlasDistance), extent)
    if (extent > 0.8) view = 'front'
    const direction =
      view === 'front'
        ? new T.Vector3(0, 0.02, 1)
        : view === 'back'
        ? new T.Vector3(0, 0.02, -1)
        : view === 'side'
        ? new T.Vector3(1, 0.02, 0)
        : new T.Vector3(0.35, 0.06, 1).normalize()
    controls.target.set(extent > 0.1 && el.clientWidth > 767 ? -packingWidth * 0.12 : 0, extent > 0.1 || mobile ? 0.85 : 0.68, 0)
    camera.position.copy(controls.target).addScaledVector(direction, distance)
    controls.update()
    dirty = true
  }

  const resize = () => {
    layoutKey = ''
    lastState = null
    renderer.setPixelRatio(Math.min(devicePixelRatio, el.clientWidth < 768 || el.clientHeight < 600 ? 1.5 : 2))
    camera.aspect = el.clientWidth / el.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(el.clientWidth, el.clientHeight)
    fit(latest.current.view, amount)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(el)
  resize()

  const raycaster = new T.Raycaster()
  const pointer = new T.Vector2()
  const tap = new PointerTap()
  const worldBox = new T.Box3()
  const hitPoint = new T.Vector3()

  const down = (e) => {
    hover.hidden = true
    tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
  }
  const move = (e) => {
    tap.move(e.pointerId, e.clientX, e.clientY)
    if (e.buttons || amount < 0.5 || e.pointerType === 'touch') {
      hover.hidden = true
      return
    }
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const index = findTarget(x, y, 12)
    hover.hidden = index < 0
    renderer.domElement.style.cursor = index < 0 ? 'grab' : 'pointer'
    if (index >= 0) {
      hover.textContent = atlas.parts[index].name
      hover.style.left = `${Math.max(8, Math.min(x + 14, el.clientWidth - 260))}px`
      hover.style.top = `${Math.max(8, Math.min(y + 18, el.clientHeight - 55))}px`
    }
  }
  const cancel = (e) => tap.cancel(e.pointerId)
  const up = (e) => {
    const validTap = tap.up(e.pointerId, e.clientX, e.clientY)
    if (!validTap || !ready) return
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    let nearest = Infinity
    let found = -1
    const hasSolid = atlas.parts.some((p, i) => p.system !== 'integumentary' && data[i * 4 + 3] > 0.5)
    pickers.forEach((mesh, i) => {
      if (!mesh || data[i * 4 + 3] < 0.5 || (hasSolid && atlas.parts[i].system === 'integumentary')) return
      worldBox.copy(bounds[i]).translate(mesh.position)
      if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return
      const hits = raycaster.intersectObject(mesh, false)
      if (hits[0] && hits[0].distance < nearest) {
        nearest = hits[0].distance
        found = i
      }
    })
    if (found < 0 && amount > 0.45) found = findTarget(e.clientX - rect.left, e.clientY - rect.top, e.pointerType === 'touch' ? 24 : 16)
    if (found >= 0) {
      hover.hidden = true
      onSelect && onSelect(atlas.parts[found].id)
    }
  }
  renderer.domElement.addEventListener('pointerdown', down)
  renderer.domElement.addEventListener('pointermove', move)
  renderer.domElement.addEventListener('pointerup', up)
  renderer.domElement.addEventListener('pointercancel', cancel)

  const clock = new T.Clock()
  const animate = () => {
    if (disposed) return
    frame = requestAnimationFrame(animate)
    const dt = Math.min(clock.getDelta(), 0.05)
    const s = latest.current
    const changed = lastState?.visible !== s.visible || lastState?.selected !== s.selected || lastState?.isolate !== s.isolate
    const moving = Math.abs(amount - s.explode) > 0.0001
    if (moving) {
      amount = T.MathUtils.damp(amount, s.explode, 8, dt)
      dirty = true
    }
    if (changed || moving || lastExtent < 0) {
      const visible = new Set(s.visible)
      const selection = new Set(s.selected)
      const visibleParts = atlas.parts.filter((p) => (s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id)))
      const nextLayoutKey = visibleParts.map((p) => p.id).join(',') + ':' + camera.aspect.toFixed(3)
      if (nextLayoutKey !== layoutKey) {
        const layout = createExplosionLayout(visibleParts, camera.aspect)
        packingWidth = layout.width
        packingHeight = layout.height
        atlas.parts.forEach((p, i) => {
          const cell = layout.cells.get(p.id)
          offsets[i] = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : centers[i].clone()
        })
        layoutKey = nextLayoutKey
        if (amount > 0.05 && !s.isolate) fit(s.view, Math.max(0, (amount - 0.3) / 0.7))
      }

      atlas.parts.forEach((p, i) => {
        const c = centers[i]
        const destination = offsets[i]
        let dx = 0
        let dy = 0
        let dz = 0
        if (amount <= 0.45) {
          const t = amount / 0.45
          const group = SYSTEMS.findIndex((sys) => sys.id === p.system)
          const angle = (group / SYSTEMS.length) * Math.PI * 2
          dx = Math.sin(angle) * t * 0.48
          dy = (c.y - 0.85) * t * 0.28
          dz = Math.cos(angle) * t * 0.48
        } else {
          const t = (amount - 0.45) / 0.55
          const group = SYSTEMS.findIndex((sys) => sys.id === p.system)
          const angle = (group / SYSTEMS.length) * Math.PI * 2
          dx = T.MathUtils.lerp(Math.sin(angle) * 0.48, destination.x - c.x, t)
          dy = T.MathUtils.lerp((c.y - 0.85) * 0.28, destination.y - c.y, t)
          dz = T.MathUtils.lerp(Math.cos(angle) * 0.48, -c.z, t)
        }
        const selected = selection.has(p.id)
        data.set([dx, dy, dz, (s.isolate ? selected : visible.has(p.system) || selected) ? 1 : 0], i * 4)
        selectedData[i * 4] = selected ? 255 : 0
        markerPositions.set(data[i * 4 + 3] > 0.5 ? [c.x + dx, c.y + dy, c.z + dz] : [10000, 10000, 10000], i * 3)
        const mesh = pickers[i]
        if (mesh) {
          mesh.position.set(dx, dy, dz)
          mesh.updateMatrix()
          mesh.updateMatrixWorld(true)
        }
      })
      partTexture.needsUpdate = true
      selectionTexture.needsUpdate = true
      markerGeometry.attributes.position.needsUpdate = true
      lastState = s
      lastExtent = amount
      dirty = true
    }
    if (s.view !== lastView || s.reset !== lastReset) {
      fit(s.view, amount)
      lastView = s.view
      lastReset = s.reset
    }
    if (moving && !s.isolate) fit(amount > 0.5 ? 'front' : s.view, Math.max(0, (amount - 0.3) / 0.7))

    const isolateKey = s.isolate ? s.selected.join(',') + ':' + s.reset + ':' + (s.inspectorOpen ? 1 : 0) + ':' + camera.aspect : ''
    if (isolateKey !== lastIsolate || (s.isolate && moving)) {
      if (s.isolate) {
        const box = new T.Box3()
        atlas.parts.forEach((p, i) => {
          if (s.selected.includes(p.id)) box.union(bounds[i].clone().translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])))
        })
        if (!box.isEmpty()) {
          const center = box.getCenter(new T.Vector3())
          const size = box.getSize(new T.Vector3())
          const w = el.clientWidth
          const h = el.clientHeight
          const mobile = w < 768
          const landscape = w > h && h <= 600
          let left = 20
          let right = w - 20
          let top = mobile ? 175 : 110
          let bottom = h - 170
          if (s.inspectorOpen) {
            if (landscape) {
              right = w - 335
              top = 100
              bottom = h - 125
            } else if (mobile) {
              const sheet = document.querySelector('.detail-sheet')?.getBoundingClientRect()
              const header = document.querySelector('.identity')?.getBoundingClientRect()
              top = (header?.bottom ?? 94) + 16
              bottom = (sheet?.top ?? h * 0.58 - 139) - 16
            } else {
              right = w - 370
              left = w > 1100 ? 285 : 25
            }
          }
          const availableWidth = Math.max(150, right - left)
          const availableHeight = Math.max(40, bottom - top)
          camera.setViewOffset(w, h, w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2, w, h)
          const distance = Math.max(
            0.07,
            (Math.max((size.y * h) / availableHeight, (size.x * w) / availableWidth / camera.aspect, size.z) /
              (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
              1.35
          )
          controls.maxDistance = Math.max(40, distance * 2)
          controls.target.copy(center)
          camera.position.copy(center).add(new T.Vector3(0.2, 0.1, 1).normalize().multiplyScalar(distance))
          controls.update()
          dirty = true
        }
      } else if (lastIsolate) {
        camera.clearViewOffset()
        fit(s.view, amount)
      }
      lastIsolate = isolateKey
    }
    controls.enableRotate = amount < 0.8
    controls.mouseButtons.LEFT = amount < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN
    controls.touches.ONE = amount < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN
    ground.visible = platform.visible = ring.visible = innerRing.visible = amount < 0.5 && !s.isolate
    markers.visible = amount > 0.75
    controls.autoRotate = s.rotate && !s.isolate && amount < 0.4
    controls.autoRotateSpeed = 0.65
    controls.update()
    if (controls.autoRotate) dirty = true
    if (dirty) {
      renderer.render(scene, camera)
      targets = []
      if (amount > 0.45) {
        const hasSolid = atlas.parts.some((p, i) => p.system !== 'integumentary' && data[i * 4 + 3] > 0.5)
        atlas.parts.forEach((p, i) => {
          if (data[i * 4 + 3] < 0.5 || (hasSolid && p.system === 'integumentary')) return
          let left = Infinity
          let right = -Infinity
          let top = Infinity
          let bottom = -Infinity
          for (let corner = 0; corner < 8; corner++) {
            projected
              .set(
                p.bounds[corner & 1 ? 1 : 0][0] + data[i * 4],
                p.bounds[corner & 2 ? 1 : 0][1] + data[i * 4 + 1],
                p.bounds[corner & 4 ? 1 : 0][2] + data[i * 4 + 2]
              )
              .project(camera)
            const x = ((projected.x + 1) * el.clientWidth) / 2
            const y = ((1 - projected.y) * el.clientHeight) / 2
            left = Math.min(left, x)
            right = Math.max(right, x)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y)
          }
          projected.copy(centers[i]).add(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])).project(camera)
          if (projected.z < -1 || projected.z > 1) return
          targets.push({ index: i, x: ((projected.x + 1) * el.clientWidth) / 2, y: ((1 - projected.y) * el.clientHeight) / 2, left, right, top, bottom })
        })
      }
      dirty = false
    }
  }
  animate()

  const contextLost = (e) => {
    e.preventDefault()
    onError && onError('The 3D session was paused by your device. Reload to continue.')
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost)

  function setState(partial) {
    latest.current = { ...latest.current, ...partial }
  }

  function dispose() {
    disposed = true
    abort.abort()
    cancelAnimationFrame(frame)
    observer.disconnect()
    controls.dispose()
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
    scene.traverse((o) => {
      if (o instanceof T.Mesh && !geometries.includes(o.geometry)) {
        o.geometry.dispose()
        const ms = Array.isArray(o.material) ? o.material : [o.material]
        ms.forEach((m) => m.dispose())
      }
    })
    env.dispose()
    partTexture.dispose()
    selectionTexture.dispose()
    markerGeometry.dispose()
    markerMaterial.dispose()
    hover.remove()
    renderer.dispose()
    if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
  }

  return { dispose, setState }
}
