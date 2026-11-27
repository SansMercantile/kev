/**
 * The Garage — interactive mechanical division. Students walk in, see a vehicle
 * on a lift, take it apart piece by piece, rebuild it, and fix a random fault.
 * This is the interactive loop that generalizes to every subject.
 *
 * Route: /garage?vehicle=car
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerTap } from '../lib/pointerTap'
import '../styles/planets.css'

const VEHICLES = {
  car: { label: 'Car (sedan)', model: '/models/atlas-vehicle-car.json', color: '#2a6fae' },
  motorcycle: { label: 'Motorcycle', model: '/models/atlas-vehicle-motorcycle.json', color: '#8a4a3a' },
  bicycle: { label: 'Bicycle', model: '/models/atlas-vehicle-bicycle.json', color: '#5a6a7a' },
}

// Faults students diagnose + fix
const FAULTS = [
  { id: 'dead_battery', label: 'Dead battery', part: 'fuel', symptom: 'Engine won\'t start' },
  { id: 'flat_tire', label: 'Flat tire', part: 'wheel', symptom: 'Car pulls to one side' },
  { id: 'broken_belt', label: 'Broken drive belt', part: 'gear', symptom: 'Grinding noise' },
  { id: 'worn_brakes', label: 'Worn brake pads', part: 'brake', symptom: 'Squealing when stopping' },
  { id: 'bad_spark', label: 'Bad spark plug', part: 'engine', symptom: 'Rough idle' },
]

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
    parts.push({ geometry: g, system: p.system, name: p.name, id: p.id })
  })
  return parts
}

export default function Garage() {
  const hostRef = useRef(null)
  const [searchParams] = useSearchParams()
  const vehicleId = VEHICLES[searchParams.get('vehicle')] ? searchParams.get('vehicle') : 'car'
  const vehicle = VEHICLES[vehicleId]
  const [parts, setParts] = useState([])
  const [mode, setMode] = useState('inspect')  // inspect | disassemble | rebuild | diagnose
  const [selectedPart, setSelectedPart] = useState(null)
  const [removedParts, setRemovedParts] = useState(new Set())
  const [fault, setFault] = useState(null)
  const [score, setScore] = useState({ time: 0, correct: 0, total: 0 })
  const [message, setMessage] = useState('Click a part to inspect it. Switch modes to disassemble, rebuild, or diagnose a fault.')

  const stateRef = useRef({ mode, selectedPart, removedParts, fault })
  useEffect(() => { stateRef.current = { mode, selectedPart, removedParts, fault } }, [mode, selectedPart, removedParts, fault])

  // assign a random fault on mount
  useEffect(() => {
    setFault(FAULTS[Math.floor(Math.random() * FAULTS.length)])
  }, [])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#1a1a1f')
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 200)
    camera.position.set(5, 4, 8)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.set(0, 1, 0)
    controls.maxDistance = 30

    // garage environment
    const floor = new T.Mesh(new T.CircleGeometry(15, 64), new T.MeshStandardMaterial({ color: 0x3a3a3f, roughness: 0.9 }))
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)
    // lift
    const lift = new T.Mesh(new T.CylinderGeometry(1.5, 1.5, 0.3, 24), new T.MeshStandardMaterial({ color: 0x5a6a7a }))
    lift.position.y = 0.15
    scene.add(lift)
    // workbench
    const bench = new T.Mesh(new T.BoxGeometry(2, 1, 0.8), new T.MeshStandardMaterial({ color: 0x8a6a4a }))
    bench.position.set(-4, 0.5, -2)
    scene.add(bench)
    // tool wall
    const wall = new T.Mesh(new T.BoxGeometry(0.1, 3, 4), new T.MeshStandardMaterial({ color: 0x4a4a4f }))
    wall.position.set(-5, 1.5, -2)
    scene.add(wall)

    scene.add(new T.AmbientLight(0xffffff, 0.5))
    const key = new T.DirectionalLight(0xfff5e8, 1.5)
    key.position.set(5, 8, 5)
    scene.add(key)
    const rim = new T.DirectionalLight(0x8ac8d8, 0.8)
    rim.position.set(-5, 4, -5)
    scene.add(rim)

    // vehicle group on the lift
    const vehicleGroup = new T.Group()
    vehicleGroup.position.y = 0.3
    scene.add(vehicleGroup)

    // load vehicle
    let loadedParts = []
    loadAtlasModel(vehicle.model).then((loaded) => {
      loadedParts = loaded
      // compute bounds to center + scale
      const box = new T.Box3()
      loaded.forEach((p) => box.union(new T.Box3().setFromBufferAttribute(p.geometry.attributes.position)))
      const size = box.getSize(new T.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const s = 4 / maxDim
      const center = box.getCenter(new T.Vector3())
      loaded.forEach((p) => {
        const mat = new T.MeshStandardMaterial({
          color: vehicle.color, roughness: 0.6, metalness: 0.1, side: T.DoubleSide,
        })
        const mesh = new T.Mesh(p.geometry, mat)
        mesh.userData.partId = p.id
        mesh.userData.system = p.system
        mesh.userData.name = p.name
        mesh.position.sub(center).multiplyScalar(s)
        vehicleGroup.add(mesh)
        loadedParts.push(mesh)
      })
      setParts(loaded)
    }).catch(() => {})

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
      const meshes = vehicleGroup.children
      const hits = raycaster.intersectObjects(meshes, false)
      if (hits[0]) {
        const partId = hits[0].object.userData.partId
        const system = hits[0].object.userData.system
        const name = hits[0].object.userData.name
        const s = stateRef.current
        if (s.mode === 'inspect') {
          setSelectedPart({ id: partId, system, name })
          setMessage(`Inspecting: ${name} (${system.replace(/_/g, ' ')})`)
        } else if (s.mode === 'disassemble') {
          // detach the part: move it to the workbench
          const mesh = hits[0].object
          const removed = new Set(s.removedParts)
          if (!removed.has(partId)) {
            removed.add(partId)
            setRemovedParts(removed)
            // animate to workbench
            const target = bench.position.clone().add(new T.Vector3(0, 1, 0))
            mesh.position.copy(target)
            setMessage(`Removed ${name}. Switch to Rebuild to put it back.`)
            setScore((s) => ({ ...s, total: s.total + 1 }))
          }
        } else if (s.mode === 'rebuild') {
          // put the part back
          const removed = new Set(s.removedParts)
          if (removed.has(partId)) {
            removed.delete(partId)
            setRemovedParts(removed)
            // find original position (recompute from bounds center)
            const mesh = hits[0].object
            mesh.position.set(0, 0, 0)  // back to vehicle group origin
            setMessage(`Reinstalled ${name}.`)
            setScore((s) => ({ ...s, correct: s.correct + 1 }))
          }
        } else if (s.mode === 'diagnose') {
          // check if this is the faulty part
          if (s.fault && system === s.fault.part) {
            setMessage(`✓ Correct! The ${s.fault.label} was the problem. You fixed it!`)
            setScore((s) => ({ ...s, correct: s.correct + 1, total: s.total + 1 }))
          } else {
            setMessage(`✗ Not that. The ${s.fault.symptom.toLowerCase()} — check the ${s.fault.part.replace(/_/g, ' ')} system.`)
            setScore((s) => ({ ...s, total: s.total + 1 }))
          }
        }
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
          <span className="planet-kicker">Mechanical division — The Garage</span>
          <h1>{vehicle.label}</h1>
          <span className="planet-sub">Take it apart · rebuild it · fix the fault</span>
        </div>
        <div className="body-selector">
          {Object.entries(VEHICLES).map(([id, v]) => (
            <button key={id} type="button"
              className={vehicleId === id ? 'body-btn active' : 'body-btn'}
              onClick={() => { setRemovedParts(new Set()); setSelectedPart(null); setScore({ time: 0, correct: 0, total: 0 }); window.location.search = `?vehicle=${id}` }}>
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="planet-actions">
        {['inspect', 'disassemble', 'rebuild', 'diagnose'].map((m) => (
          <button key={m} type="button" className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            <span>{m[0].toUpperCase() + m.slice(1)}</span>
          </button>
        ))}
      </nav>

      <div className="planet-stage" ref={hostRef} />

      <footer className="garage-status">
        <div className="status-message">{message}</div>
        {fault && mode === 'diagnose' && (
          <div className="fault-hint">Symptom: {fault.symptom}</div>
        )}
        <div className="score">
          Score: {score.correct}/{score.total}
          {removedParts.size > 0 && ` · ${removedParts.size} part${removedParts.size > 1 ? 's' : ''} removed`}
        </div>
      </footer>
    </div>
  )
}
