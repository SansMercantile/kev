/**
 * Rail Yard — walkable railway facility. Locomotive depot, turntable, signal
 * box. Students explore railway equipment and unlock train driving.
 *
 * Route: /rail-yard
 */
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerTap } from '../lib/pointerTap'
import '../styles/planets.css'

const VEHICLES = {
  locomotive: { label: 'Diesel locomotive', model: '/models/atlas-vehicle-locomotive.json', color: 0x5a6a7a },
  passenger_train: { label: 'Passenger coach', model: '/models/atlas-vehicle-passenger_train.json', color: 0x4a7a9a },
  steam_locomotive: { label: 'Steam locomotive', model: '/models/atlas-vehicle-steam_locomotive.json', color: 0x2a2a32 },
  high_speed_train: { label: 'TGV', model: '/models/atlas-vehicle-high_speed_train.json', color: 0x4a7a9a },
}

async function loadAtlasModel(url) {
  const manifest = await fetch(url).then((r) => { if (!r.ok) throw new Error('model not found'); return r.json() })
  const chunk = manifest.chunks[0]
  const compressed = !!chunk.gzip && typeof DecompressionStream !== 'undefined'
  const response = await fetch(compressed ? chunk.gzip : chunk.url)
  const payload = await response.arrayBuffer()
  const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength))
  const buffer = compressed && sig[0] === 0x1f && sig[1] === 0x8b
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : payload
  const parts = []
  manifest.parts.forEach((p) => {
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3))
    g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true))
    g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1))
    parts.push({ geometry: g, system: p.system, name: p.name })
  })
  return parts
}

export default function RailYard() {
  const hostRef = useRef(null)
  const navigate = useNavigate()
  const [vehicleId, setVehicleId] = useState('locomotive')
  const [message, setMessage] = useState('Walk around the rail yard. Click a vehicle to inspect it, or go to the depot to drive it.')
  const [selected, setSelected] = useState(null)

  const vehicle = VEHICLES[vehicleId]

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#3a3a2a')
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 500)
    camera.position.set(20, 12, 25)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.set(0, 3, 0)
    controls.maxDistance = 80

    // environment: rail yard
    const ground = new T.Mesh(new T.CircleGeometry(60, 64), new T.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.9 }))
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // tracks
    for (let i = -2; i <= 2; i++) {
      const track = new T.Mesh(new T.BoxGeometry(40, 0.1, 0.5), new T.MeshStandardMaterial({ color: 0x5a5a5a }))
      track.position.set(0, 0.05, i * 5)
      scene.add(track)
    }

    // locomotive depot (roundhouse)
    const depot = new T.Mesh(new T.CylinderGeometry(12, 12, 8, 16, 1, false, 0, Math.PI), new T.MeshStandardMaterial({ color: 0x4a4a3f, side: T.DoubleSide }))
    depot.position.set(-10, 0, -10)
    depot.rotation.y = Math.PI / 4
    scene.add(depot)

    // turntable
    const turntable = new T.Mesh(new T.CylinderGeometry(8, 8, 0.3, 24), new T.MeshStandardMaterial({ color: 0x5a5a5f }))
    turntable.position.set(10, 0.15, -5)
    scene.add(turntable)

    // signal box
    const signalBox = new T.Mesh(new T.BoxGeometry(4, 6, 3), new T.MeshStandardMaterial({ color: 0x5a4a3a }))
    signalBox.position.set(0, 3, 15)
    scene.add(signalBox)

    // vehicle on display
    const vehicleGroup = new T.Group()
    vehicleGroup.position.set(10, 0.3, -5)
    scene.add(vehicleGroup)

    loadAtlasModel(vehicle.model).then((parts) => {
      const box = new T.Box3()
      parts.forEach((p) => box.union(new T.Box3().setFromBufferAttribute(p.geometry.attributes.position)))
      const size = box.getSize(new T.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const s = 8 / maxDim
      const center = box.getCenter(new T.Vector3())
      parts.forEach((p) => {
        const mat = new T.MeshStandardMaterial({ color: vehicle.color, roughness: 0.7, metalness: 0.1, side: T.DoubleSide })
        const mesh = new T.Mesh(p.geometry, mat)
        mesh.userData.name = p.name
        mesh.userData.system = p.system
        mesh.position.sub(center).multiplyScalar(s)
        vehicleGroup.add(mesh)
      })
    }).catch(() => {})

    scene.add(new T.AmbientLight(0xffffff, 0.5))
    const sun = new T.DirectionalLight(0xfff5e8, 1.2)
    sun.position.set(50, 100, 50)
    scene.add(sun)

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
      const hits = raycaster.intersectObjects(vehicleGroup.children, false)
      if (hits[0]) {
        const name = hits[0].object.userData.name
        const system = hits[0].object.userData.system
        setSelected({ name, system })
        setMessage(`Inspecting: ${name} (${system.replace(/_/g, ' ')})`)
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
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      vehicleGroup.rotation.y += dt * 0.2
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [vehicle])

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Rail Yard</span>
          <h1>{vehicle.label} on the turntable</h1>
          <span className="planet-sub">Locomotive depot · turntable · signal box</span>
        </div>
        <div className="body-selector">
          {Object.entries(VEHICLES).map(([id, v]) => (
            <button key={id} type="button"
              className={vehicleId === id ? 'body-btn active' : 'body-btn'}
              onClick={() => setVehicleId(id)}>
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="planet-actions">
        <button type="button" onClick={() => navigate(`/pilot?vehicle=${vehicleId}`)}>
          <span>🚂 Drive the {vehicle.label}</span>
        </button>
        <button type="button" onClick={() => navigate('/exam?field=rail')}>
          <span>Take rail exam</span>
        </button>
      </nav>

      <div className="planet-stage" ref={hostRef} />

      <footer className="garage-status">
        <div className="status-message">{message}</div>
      </footer>
    </div>
  )
}
