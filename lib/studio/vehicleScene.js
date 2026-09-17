/**
 * KEV Electric Vehicle Systems viewer - the full Model X studio engine.
 *
 * Technique adaptations from the Model X Studio tool (see
 * docs/ATTRIBUTION-model-x.md): the 334-piece model (cgi Moon via BlendKit,
 * Royalty Free; no download UI), 8 component groups, two-phase damped
 * explosion with projected-bounds packing and automatic camera framing,
 * emissive focus highlight, numbered DOM labels + piece markers, and the
 * illustrative procedural battery / drive / suspension teaching geometry
 * (the imported model covers exterior, glass, doors, cabin and wheels).
 *
 * Built on the shared studio bootstrap (IBL, ACES, three-point lighting,
 * soft shadows, on-demand rendering).
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createStudio } from './studioRenderer'
import { packProjected } from './explosionLayout'
import { PointerTap } from '../pointerTap'

export const VEHICLE_PARTS = ['body', 'glass', 'doors', 'cabin', 'battery', 'drive', 'suspension', 'wheels']

const OFFSETS = {
  body: [0, 0.6, 0], glass: [0, 2, 0], doors: [0, 1.1, 0], cabin: [0, 0.7, 0],
  battery: [0, -0.85, 0], drive: [0, -0.18, 0], suspension: [0, 0.08, 0], wheels: [0, 0, 0],
}
const ANCHORS = {
  body: [-1.9, 1.02, 0.2], glass: [0.15, 1.94, 0], doors: [0.25, 1.44, 1.05], cabin: [0.05, 1.05, -0.4],
  battery: [0.1, 0.24, 1.02], drive: [-1.54, 0.57, 0.2], suspension: [1.57, 0.83, -0.83], wheels: [1.53, 0.46, 1.1],
}
const OVERVIEW_DIRECTION = new THREE.Vector3(-5.7, 2.1, 6.3).normalize()
const LAYOUT_CENTER = new THREE.Vector3(0, 3, 0)

export class VehicleViewer {
  /**
   * @param {HTMLElement} host
   * @param {object} opts
   * @param {(partId:string)=>void} [opts.onSelect] - one of VEHICLE_PARTS
   * @param {(pieceId:string)=>void} [opts.onInspect] - GLB component id (e.g. body_0001)
   * @param {(ready:boolean)=>void} [opts.onReady]
   * @param {(message:string)=>void} [opts.onError]
   * @param {Array<{id:string,name:string}>} [opts.partLabels] - display names for the 8 groups
   */
  constructor(host, opts = {}) {
    this.host = host
    this.opts = opts
    this.state = { selected: 'body', focusedMesh: '', explode: 0, labels: false, autoRotate: false, isolated: false }
    this.disposed = false
    this.ready = false
    this.pieces = []
    this.pieceLabels = []
    this.layout = null
    this.amount = 0
    this.framingTime = 0
    this.framingDirection = OVERVIEW_DIRECTION.clone()
    this.focusKey = ''
    this.lastHighlighted = ''
    this.lastLabels = 0
    this.labelsPending = false
    this.vector = new THREE.Vector3()
    this.cameraPosition = new THREE.Vector3()
    this.cameraQuaternion = new THREE.Quaternion()
    this.homeTarget = new THREE.Vector3(0, 0.8, 0)

    try {
      this.studio = createStudio(host, {
        theme: 'dark',
        stage: 'plinth',
        stageRadius: 3.55,
        grid: true,
        fov: 37,
        cameraPosition: [-5.7, 2.9, 6.3],
        target: [0, 0.8, 0],
        minDistance: 5,
        maxDistance: 180,
        maxPolarAngle: Math.PI * 0.49,
        minPolarAngle: 0.18,
        exposure: 0.95,
        onContextLost: (m) => opts.onError && opts.onError(m),
      })
    } catch {
      opts.onError && opts.onError('Your browser could not start the 3D view.')
      this.failed = true
      return
    }
    const { scene, camera, controls } = this.studio

    this.groups = {}
    VEHICLE_PARTS.forEach((id) => {
      const g = new THREE.Group()
      g.name = id
      g.userData.part = id
      this.groups[id] = g
      scene.add(g)
    })

    this._buildTeachingGeometry()
    this._loadModel()
    this._buildLabels()
    this._bindPointer()
    controls.addEventListener('start', () => { this.framingTime = 0 })
    this.studio.onFrame((dt) => this._frame(dt))
  }

  // ---------------------------------------------------------------- materials
  _mat(color, metal = 0.3, rough = 0.32) {
    return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough })
  }

  _mesh(g, geometry, m, pos = [0, 0, 0]) {
    const o = new THREE.Mesh(geometry, m.clone())
    o.position.set(...pos)
    o.castShadow = true
    o.receiveShadow = true
    o.userData.part = g.userData.part
    o.userData.component = o.userData.component || g.userData.part
    g.add(o)
    return o
  }

  _box(g, s, p, m, r = 0.04) {
    return this._mesh(g, new RoundedBoxGeometry(s[0], s[1], s[2], 3, r), m, p)
  }

  _cyl(g, r, len, p, m) {
    const o = this._mesh(g, new THREE.CylinderGeometry(r, r, len, 36), m, p)
    o.rotation.x = Math.PI / 2
    return o
  }

  _tube(g, points, r, m) {
    return this._mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, r, 8, false), m)
  }

  /** Illustrative battery / drive units / air suspension (teaching geometry). */
  _buildTeachingGeometry() {
    const dark = this._mat('#13181d', 0.28, 0.36)
    const silver = this._mat('#94a2ae', 0.85, 0.25)
    const orange = this._mat('#f97645', 0.55, 0.32)
    const battery = this.groups.battery
    const drive = this.groups.drive
    const suspension = this.groups.suspension

    // Battery casing with visible modules and orange high-voltage busbars.
    this._box(battery, [2.95, 0.2, 1.7], [0, 0.32, 0], silver, 0.065)
    this._box(battery, [2.8, 0.08, 1.58], [0, 0.45, 0], dark, 0.025)
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 4; z++) {
        this._box(battery, [0.3, 0.07, 0.33], [-1.22 + x * 0.35, 0.51, -0.585 + z * 0.39], this._mat('#6d827e', 0.65, 0.38), 0.018)
      }
    }
    for (const s of [-1, 1]) this._box(battery, [2.8, 0.035, 0.035], [0, 0.56, s * 0.77], orange, 0.009)

    // Two motors, half-shafts and ribbed inverter housings.
    for (const x of [-1.56, 1.56]) {
      this._cyl(drive, 0.21, 0.73, [x, 0.59, 0], silver)
      this._cyl(drive, 0.095, 1.82, [x, 0.55, 0], dark)
      this._box(drive, [0.46, 0.17, 0.49], [x, 0.82, 0], silver)
      for (let j = 0; j < 7; j++) this._box(drive, [0.022, 0.04, 0.43], [x - 0.19 + j * 0.065, 0.922, 0], dark, 0.004)
      this._tube(
        drive,
        [new THREE.Vector3(x, 0.75, 0.4), new THREE.Vector3(x * 0.8, 0.57, 0.58), new THREE.Vector3(x * 0.77, 0.44, 0.66)],
        0.026,
        orange
      )
    }

    // Air springs and suspension arms aligned with each wheel.
    for (const x of [-1.55, 1.57]) {
      for (const side of [-1, 1]) {
        const strut = this._cyl(suspension, 0.09, 0.41, [x, 0.78, side * 0.73], silver)
        strut.rotation.x = 0
        for (let j = 0; j < 5; j++) {
          const ring = this._mesh(suspension, new THREE.TorusGeometry(0.11, 0.028, 8, 24), dark, [x, 0.68 + j * 0.055, side * 0.73])
          ring.rotation.x = Math.PI / 2
        }
        for (const dx of [-0.18, 0.18]) {
          this._tube(
            suspension,
            [new THREE.Vector3(x + dx, 0.48, side * 0.37), new THREE.Vector3(x, 0.47, side * 0.96)],
            0.026,
            silver
          )
        }
      }
    }
  }

  // ------------------------------------------------------------------- model
  _loadModel() {
    const { scene } = this.studio
    new GLTFLoader().load(
      '/models/model-x.glb?v=334',
      (gltf) => {
        if (this.disposed) {
          this._disposeObject(gltf.scene)
          return
        }
        Object.values(this.groups).forEach((g) => g.position.set(0, 0, 0))
        scene.updateMatrixWorld(true)
        const model = gltf.scene
        model.rotation.y = -Math.PI / 2
        scene.add(model)
        model.updateMatrixWorld(true)
        const nodes = []
        model.traverse((o) => {
          if (o.userData && o.userData.component) nodes.push(o)
        })
        nodes.forEach((node) => {
          const id = node.userData.part
          if (!this.groups[id]) return
          const component = node.userData.component
          this.groups[id].attach(node)
          const bounds = new THREE.Box3().setFromObject(node)
          const center = bounds.getCenter(new THREE.Vector3())
          const side = Math.sign(center.z) || 1
          const spread = new THREE.Vector3(
            id === 'body' ? center.x * 0.17 : 0,
            0,
            id === 'wheels' ? side * 0.95 : id === 'doors' ? side * 0.9 : id === 'glass' ? side * 0.12 : 0
          )
          const piece = { node, home: node.position.clone(), spread, part: id, id: component, bounds, center, fullSpread: new THREE.Vector3(), materials: [] }
          this.pieces.push(piece)
          node.traverse((o) => {
            if (!(o instanceof THREE.Mesh)) return
            o.userData.part = id
            o.userData.component = component
            o.castShadow = true
            o.receiveShadow = true
            const materials = Array.isArray(o.material) ? o.material : [o.material]
            o.material = Array.isArray(o.material) ? materials.map((m) => m.clone()) : materials[0].clone()
            const cloned = Array.isArray(o.material) ? o.material : [o.material]
            cloned.forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                // Expensive transmission glass becomes a tinted body - the
                // tool's performance choice; reflections still read as glass.
                if (m instanceof THREE.MeshPhysicalMaterial && m.transmission > 0) {
                  m.transmission = 0
                  m.metalness = 0.25
                  m.roughness = 0.18
                }
                piece.materials.push(m)
                m.envMapIntensity = 1.3
                m.userData.baseEmission = m.emissive.clone()
                m.userData.baseIntensity = m.emissiveIntensity
              }
            })
          })
        })
        this.layout = packProjected(this.pieces, OVERVIEW_DIRECTION, LAYOUT_CENTER)
        this.pieces.forEach((piece, i) => {
          const entry = this.layout.pieces.get(piece.id)
          piece.fullSpread.copy(entry ? entry.translation : new THREE.Vector3())
          const b = document.createElement('button')
          b.className = 'mesh-marker'
          b.textContent = String(i + 1)
          b.title = (piece.node.userData && piece.node.userData.label) || 'Modeled piece'
          b.setAttribute('aria-label', `Inspect piece ${i + 1}: ${b.title}`)
          b.addEventListener('click', () => {
            this.opts.onSelect && this.opts.onSelect(piece.part)
            this.opts.onInspect && this.opts.onInspect(piece.id)
          })
          this.host.appendChild(b)
          this.pieceLabels.push({ b, id: piece.id, part: piece.part, center: piece.center, spread: piece.spread, fullSpread: piece.fullSpread })
        })
        const positions = new Float32Array(this.pieces.length * 3)
        this.markerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        scene.remove(model)
        this.ready = true
        this.opts.onReady && this.opts.onReady(true)
        this._fitView(true)
        this.framingTime = 1
        this.studio.invalidate()
        this.studio.refreshShadows()
      },
      undefined,
      () => {
        if (!this.disposed && this.opts.onError) this.opts.onError('The detailed car could not load. Reload to try again.')
      }
    )

    this.markerGeometry = new THREE.BufferGeometry()
    this.markerMaterial = new THREE.PointsMaterial({ color: 0xf6bc99, size: 4, sizeAttenuation: false, depthWrite: false, depthTest: false, transparent: true, opacity: 0.75 })
    this.markers = new THREE.Points(this.markerGeometry, this.markerMaterial)
    this.markers.visible = false
    this.markers.frustumCulled = false
    this.markers.renderOrder = 10
    scene.add(this.markers)
  }

  _disposeObject(root) {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }

  // ------------------------------------------------------------------ labels
  _buildLabels() {
    this.labelNodes = VEHICLE_PARTS.map((id, i) => {
      const b = document.createElement('button')
      b.className = 'scene-label'
      const name = (this.opts.partLabels && this.opts.partLabels.find((p) => p.id === id)?.name) || id
      b.setAttribute('aria-label', 'Inspect ' + name)
      b.innerHTML = '<span>' + String(i + 1).padStart(2, '0') + '</span><strong>' + name + '</strong>'
      b.addEventListener('click', () => this.opts.onSelect && this.opts.onSelect(id))
      this.host.appendChild(b)
      return { b, id }
    })
  }

  // ----------------------------------------------------------------- pointer
  _bindPointer() {
    const { renderer, camera } = this.studio
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const tap = new PointerTap()
    const el = renderer.domElement
    const down = (e) => tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 10 : 5)
    const move = (e) => tap.move(e.pointerId, e.clientX, e.clientY)
    const cancel = (e) => tap.cancel(e.pointerId)
    const up = (e) => {
      if (!tap.up(e.pointerId, e.clientX, e.clientY)) return
      const r = el.getBoundingClientRect()
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      if (this.markers.visible) {
        let nearest = -1
        let nearestDistance = e.pointerType === 'touch' ? 324 : 64
        this.pieces.forEach((piece, i) => {
          this.vector
            .copy(piece.center)
            .add(piece.node.position)
            .sub(piece.home)
            .add(this.groups[piece.part].position)
            .project(camera)
          const dx = ((this.vector.x - pointer.x) * r.width) / 2
          const dy = ((this.vector.y - pointer.y) * r.height) / 2
          const d = dx * dx + dy * dy
          if (this.vector.z < 1 && d < nearestDistance) {
            nearest = i
            nearestDistance = d
          }
        })
        if (nearest >= 0) {
          this.opts.onSelect && this.opts.onSelect(this.pieces[nearest].part)
          this.opts.onInspect && this.opts.onInspect(this.pieces[nearest].id)
          return
        }
      }
      const hits = raycaster
        .intersectObjects(Object.values(this.groups), true)
        .filter((h) => {
          let o = h.object
          while (o) {
            if (!o.visible) return false
            o = o.parent
          }
          return true
        })
      if (hits[0]) {
        this.opts.onSelect && this.opts.onSelect(hits[0].object.userData.part)
        this.opts.onInspect && this.opts.onInspect(hits[0].object.userData.component || '')
      }
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointercancel', cancel)
    el.addEventListener('pointerup', up)
    this._pointerCleanup = () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointercancel', cancel)
      el.removeEventListener('pointerup', up)
    }
  }

  // -------------------------------------------------------------------- API
  setState(partial) {
    const prevExplode = this.state.explode
    this.state = { ...this.state, ...partial }
    if (partial.explode !== undefined && partial.explode !== prevExplode) {
      this.framingTime = 1.5
      this.framingDirection.copy(this.studio.camera.position).sub(this.studio.controls.target).normalize()
    }
    this.studio && this.studio.invalidate()
  }

  zoom(factor) {
    const { camera, controls } = this.studio
    this.framingTime = 0
    camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target)
    this.studio.invalidate()
  }

  reset() {
    this.setState({ isolated: false, focusedMesh: '', explode: this.state.explode })
    this._fitView(true)
    this.framingTime = 1
    this.studio.invalidate()
  }

  _fitView(immediate = false, dt = 1 / 60) {
    const { camera, controls } = this.studio
    if (this.state.isolated) return
    const f = THREE.MathUtils.smoothstep(immediate ? this.state.explode / 100 : this.amount, 0.4, 1)
    const target = this.homeTarget.clone().lerp(LAYOUT_CENTER, f)
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const fullDistance = this.layout
      ? Math.max(this.layout.width / (2 * tangent * camera.aspect), 6 / (2 * tangent)) * 1.18 + 3
      : 9
    const assembledDistance = Math.max(10.5, 7.5 / camera.aspect)
    const distance = THREE.MathUtils.lerp(assembledDistance, fullDistance, f)
    const direction = immediate ? OVERVIEW_DIRECTION : this.framingDirection.clone().lerp(OVERVIEW_DIRECTION, f).normalize()
    const blend = immediate ? 1 : 1 - Math.exp(-8 * dt)
    controls.target.lerp(target, blend)
    camera.position.lerp(target.clone().addScaledVector(direction, distance), blend)
  }

  // ------------------------------------------------------------------ frame
  _frame(dt) {
    if (this.disposed || this.failed) return false
    const s = this.state
    const { scene, camera, controls, renderer, host, reducedMotion } = this.studio
    const oldAmount = this.amount
    this.amount = reducedMotion ? s.explode / 100 : THREE.MathUtils.damp(this.amount, s.explode / 100, 7, dt)
    if (Math.abs(this.amount - s.explode / 100) < 0.0001) this.amount = s.explode / 100
    const moving = oldAmount !== this.amount
    const individual = THREE.MathUtils.smoothstep(this.amount, 0.4, 1)

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = 16 + individual * 384
      scene.fog.far = 60 + individual * 445
    }
    this.framingTime = Math.max(0, this.framingTime - dt)
    if (this.framingTime > 0) this._fitView(false, dt)
    controls.autoRotate = s.autoRotate && !reducedMotion && !s.isolated
    if (controls.autoRotate) { this.studio.invalidate(); }

    if (this.ready && moving) {
      this.studio.stageGroup.visible = this.amount < 0.18 && !s.isolated
      this.studio.stageGroup.traverse((o) => {
        if (o.material && o.material.transparent) o.material.opacity = Math.min(o.material.opacity, 1 - THREE.MathUtils.smoothstep(this.amount, 0.02, 0.18))
      })
      renderer.shadowMap.enabled = individual < 0.05 && !s.isolated
      VEHICLE_PARTS.forEach((id) => {
        const g = this.groups[id]
        const o = OFFSETS[id]
        g.position.set(o[0] * this.amount * (1 - individual), o[1] * this.amount * (1 - individual), o[2] * this.amount * (1 - individual))
        g.visible = !s.isolated || s.selected === id
        if (['battery', 'drive', 'suspension'].includes(id)) {
          g.visible = g.visible && (this.amount > 0.08 || s.isolated)
        }
      })
      const positions = this.markerGeometry.getAttribute('position')
      this.pieces.forEach((piece, i) => {
        piece.node.position
          .copy(piece.home)
          .addScaledVector(piece.spread, this.amount * (1 - individual))
          .addScaledVector(piece.fullSpread, individual)
        piece.node.visible = !s.isolated || !s.focusedMesh || s.focusedMesh === piece.id
        if (positions) {
          this.vector.copy(piece.center).add(piece.node.position).sub(piece.home).add(this.groups[piece.part].position)
          positions.setXYZ(i, this.vector.x, this.vector.y, this.vector.z)
        }
      })
      if (positions) positions.needsUpdate = true
      this.markers.visible = individual > 0.45 && !s.isolated && !s.labels
      this.markerMaterial.opacity = THREE.MathUtils.smoothstep(individual, 0.45, 0.9) * 0.75
      if (renderer.shadowMap.enabled) this.studio.refreshShadows()
      this.studio.invalidate()
    }

    // Emissive focus highlight for the inspected piece.
    const nextFocus = s.isolated ? s.focusedMesh || s.selected : ''
    if (this.ready && nextFocus !== this.focusKey) {
      this.focusKey = nextFocus
      if (nextFocus) {
        const target = s.focusedMesh ? this.pieces.find((x) => x.id === s.focusedMesh)?.node : this.groups[s.selected]
        if (target) {
          scene.updateMatrixWorld(true)
          const bounds = new THREE.Box3().setFromObject(target)
          const center = bounds.getCenter(new THREE.Vector3())
          const extent = bounds.getSize(new THREE.Vector3()).length()
          const direction = camera.position.clone().sub(controls.target).normalize()
          controls.minDistance = 0.15
          controls.target.copy(center)
          camera.position.copy(center).addScaledVector(direction, Math.max(0.4, extent * 1.8))
        }
      } else {
        controls.minDistance = 5
        this._fitView(true)
      }
      controls.update()
      this.studio.invalidate()
    }
    if (this.ready && (s.focusedMesh !== this.lastHighlighted || moving)) {
      for (const piece of this.pieces) {
        if (piece.id === this.lastHighlighted || piece.id === s.focusedMesh) {
          for (const m of piece.materials) {
            m.emissive.copy(m.userData.baseEmission)
            m.emissiveIntensity = m.userData.baseIntensity
            if (piece.id === s.focusedMesh && s.focusedMesh) {
              m.emissive.set('#c1532f')
              m.emissiveIntensity = 0.23
            }
          }
        }
      }
      this.lastHighlighted = s.focusedMesh
    }

    // Projected DOM labels (transform-only writes, throttled to 50ms).
    const now = performance.now()
    if (this.ready && (now - this.lastLabels > 50 || moving)) {
      this.lastLabels = now
      const viewWidth = host.clientWidth
      const viewHeight = host.clientHeight
      this.labelNodes.forEach(({ b, id }) => {
        const show = individual < 0.5 && s.labels !== false && (!s.isolated || s.selected === id) && (!['battery', 'drive', 'suspension'].includes(id) || this.amount > 0.08 || s.isolated)
        if (b.hidden === show) b.hidden = !show
        if (!show) return
        const a = ANCHORS[id]
        this.vector.set(a[0], a[1], a[2]).add(this.groups[id].position).project(camera)
        b.style.display = this.vector.z < 1 ? 'flex' : 'none'
        b.classList.toggle('chosen', id === s.selected)
        b.style.transform = `translate3d(${(this.vector.x * 0.5 + 0.5) * viewWidth}px, ${(-this.vector.y * 0.5 + 0.5) * viewHeight}px, 0) translate(-12px, -50%)`
      })
      this.pieceLabels.forEach(({ b, id, part, center, spread, fullSpread }) => {
        const show = individual > 0.45 && (s.labels || id === s.focusedMesh) && (!s.isolated || s.selected === part) && (!s.isolated || !s.focusedMesh || s.focusedMesh === id)
        if (b.hidden === show) b.hidden = !show
        if (!show) return
        this.vector.copy(center).addScaledVector(spread, this.amount * (1 - individual)).addScaledVector(fullSpread, individual).add(this.groups[part].position).project(camera)
        b.style.display = this.vector.z < 1 && Math.abs(this.vector.x) < 1 && Math.abs(this.vector.y) < 1 ? 'grid' : 'none'
        b.classList.toggle('chosen', s.focusedMesh === id)
        b.style.transform = `translate3d(${(this.vector.x * 0.5 + 0.5) * viewWidth}px, ${(-this.vector.y * 0.5 + 0.5) * viewHeight}px, 0) translate(-50%, -50%)`
      })
    }

    this.cameraPosition.copy(camera.position)
    this.cameraQuaternion.copy(camera.quaternion)
    return moving || this.framingTime > 0 || controls.autoRotate
  }

  dispose() {
    this.disposed = true
    if (this.failed) return
    this._pointerCleanup && this._pointerCleanup()
    this.labelNodes.forEach((x) => x.b.remove())
    this.pieceLabels.forEach((x) => x.b.remove())
    this.markerGeometry && this.markerGeometry.dispose()
    this.markerMaterial && this.markerMaterial.dispose()
    this.studio.dispose()
  }
}
