/**
 * Pilot mode — hands-on control of a certified vehicle. WASD/throttle steering,
 * mouse look, first-person cockpit + third-person chase views. Unlocked by
 * passing the field's exam (up to 5 uses per pass).
 *
 * Route: /pilot?vehicle=car
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as T from 'three'
import { PointerTap } from '../lib/pointerTap'
import { canPilot, useUnlock, FIELDS } from '../lib/progression'
import '../styles/planets.css'

const VEHICLES = {
  car: { label: 'Car', model: '/models/atlas-vehicle-car.json', color: 0x2a6fae, type: 'ground', speed: 30, turnRate: 2.0 },
  tank: { label: 'Tank', model: '/models/atlas-vehicle-tank.json', color: 0x5a6a4a, type: 'ground', speed: 15, turnRate: 1.0 },
  fighter_jet: { label: 'Fighter Jet', model: '/models/atlas-vehicle-fighter_jet.json', color: 0x5a6a7a, type: 'air', speed: 120, turnRate: 1.5 },
  locomotive: { label: 'Locomotive', model: '/models/atlas-vehicle-locomotive.json', color: 0x5a6a7a, type: 'rail', speed: 40, turnRate: 0.5 },
  warship: { label: 'Warship', model: '/models/atlas-vehicle-warship.json', color: 0x4a6a8a, type: 'water', speed: 20, turnRate: 0.8 },
  rocket: { label: 'Rocket', model: '/models/atlas-vehicle-rocket.json', color: 0xd0c8b8, type: 'space', speed: 200, turnRate: 0.3 },
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

export default function Pilot() {
  const hostRef = useRef(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const vehicleId = VEHICLES[searchParams.get('vehicle')] ? searchParams.get('vehicle') : 'car'
  const vehicle = VEHICLES[vehicleId]
  const field = Object.values(FIELDS).find((f) => f.vehicle === vehicleId)
  const fieldId = field ? Object.keys(FIELDS).find((k) => FIELDS[k] === field) : null

  const [unlocked, setUnlocked] = useState(false)
  const [unlocksLeft, setUnlocksLeft] = useState(0)
  const [view, setView] = useState('cockpit')  // cockpit | chase
  const [speed, setSpeed] = useState(0)
  const [message, setMessage] = useState('')

  const stateRef = useRef({ view, keys: {}, vehicle })
  useEffect(() => { stateRef.current = { view, keys: stateRef.current.keys, vehicle } }, [view, vehicle])

  // check unlock status
  useEffect(() => {
    if (fieldId && canPilot(fieldId)) {
      setUnlocked(true)
      setUnlocksLeft((useUnlock(fieldId), 4))  // consume one use on entry
      setMessage(`Piloting the ${vehicle.label}. WASD to move, mouse to steer, Space to brake.`)
    } else {
      setMessage(`You need to pass the ${field?.label} exam first to unlock pilot mode.`)
    }
  }, [fieldId, vehicle])

  useEffect(() => {
    if (!unlocked) return undefined
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color(vehicle.type === 'space' ? '#000208' : '#87ceeb')
    const camera = new T.PerspectiveCamera(70, 1, 0.1, 5000)

    // environment
    const ground = new T.Mesh(new T.CircleGeometry(2000, 64), new T.MeshStandardMaterial({ color: vehicle.type === 'water' ? 0x1a5f9e : 0x3a5f3a, roughness: 0.9 }))
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)
    scene.add(new T.AmbientLight(0xffffff, 0.6))
    const sun = new T.DirectionalLight(0xfff5e8, 1.5)
    sun.position.set(100, 200, 100)
    scene.add(sun)

    // load vehicle
    const vehicleGroup = new T.Group()
    scene.add(vehicleGroup)
    loadAtlasModel(vehicle.model).then((parts) => {
      const box = new T.Box3()
      parts.forEach((p) => box.union(new T.Box3().setFromBufferAttribute(p.geometry.attributes.position)))
      const size = box.getSize(new T.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const s = 4 / maxDim
      const center = box.getCenter(new T.Vector3())
      parts.forEach((p) => {
        const mat = new T.MeshStandardMaterial({ color: vehicle.color, roughness: 0.6, metalness: 0.1, side: T.DoubleSide })
        const mesh = new T.Mesh(p.geometry, mat)
        mesh.position.sub(center).multiplyScalar(s)
        vehicleGroup.add(mesh)
      })
    }).catch(() => {})

    // input
    const keys = {}
    const onKey = (e, down) => {
      keys[e.code] = down
      stateRef.current.keys = keys
    }
    window.addEventListener('keydown', (e) => onKey(e, true))
    window.addEventListener('keyup', (e) => onKey(e, false))

    // mouse look
    let yaw = 0, pitch = 0
    const onMouseMove = (e) => {
      if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.002
        pitch -= e.movementY * 0.002
        pitch = Math.max(-0.5, Math.min(0.5, pitch))
      }
    }
    renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock())
    document.addEventListener('mousemove', onMouseMove)

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    // physics state
    const pos = new T.Vector3(0, 0.5, 0)
    const vel = new T.Vector3()
    let heading = 0
    let throttle = 0

    const clock = new T.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const s = stateRef.current
      const v = s.vehicle

      // input
      const forward = (s.keys['KeyW'] || s.keys['ArrowUp']) ? 1 : 0
      const back = (s.keys['KeyS'] || s.keys['ArrowDown']) ? 1 : 0
      const left = (s.keys['KeyA'] || s.keys['ArrowLeft']) ? 1 : 0
      const right = (s.keys['KeyD'] || s.keys['ArrowRight']) ? 1 : 0
      const brake = s.keys['Space'] ? 1 : 0

      // throttle
      throttle = T.MathUtils.damp(throttle, forward - back, 3, dt)
      if (brake) throttle = T.MathUtils.damp(throttle, 0, 8, dt)

      // steering
      const steer = right - left
      heading += steer * v.turnRate * dt * (1 - Math.abs(throttle) * 0.5)

      // velocity
      const dir = new T.Vector3(Math.sin(heading), 0, Math.cos(heading))
      vel.copy(dir).multiplyScalar(throttle * v.speed)
      pos.addScaledVector(vel, dt)

      // keep on ground (or in air/space)
      if (v.type === 'ground' || v.type === 'rail') pos.y = 0.5
      if (v.type === 'air') pos.y = Math.max(10, pos.y + (forward - back) * dt * 20)
      if (v.type === 'space') pos.y = Math.max(0, pos.y + (forward - back) * dt * 30)
      if (v.type === 'water') pos.y = 0.3

      // vehicle transform
      vehicleGroup.position.copy(pos)
      vehicleGroup.rotation.y = heading

      // camera
      if (s.view === 'cockpit') {
        const cockpitOffset = new T.Vector3(0, 1.5, 0.5)
        const worldOffset = cockpitOffset.applyQuaternion(vehicleGroup.quaternion)
        camera.position.copy(pos).add(worldOffset)
        camera.rotation.set(pitch, heading + yaw, 0, 'YXZ')
      } else {
        const chaseOffset = new T.Vector3(0, 5, -12)
        const worldOffset = chaseOffset.applyQuaternion(vehicleGroup.quaternion)
        camera.position.copy(pos).add(worldOffset)
        camera.lookAt(pos.x, pos.y + 2, pos.z)
      }

      setSpeed(Math.abs(throttle * v.speed))
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.dispose()
      window.removeEventListener('keydown', (e) => onKey(e, true))
      window.removeEventListener('keyup', (e) => onKey(e, false))
      document.removeEventListener('mousemove', onMouseMove)
      el.removeChild(renderer.domElement)
    }
  }, [vehicle, unlocked])

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Pilot mode — {field?.label}</span>
          <h1>{vehicle.label}</h1>
          <span className="planet-sub">
            {unlocked ? `${unlocksLeft} pilot ${unlocksLeft === 1 ? 'use' : 'uses'} remaining · ${message}` : 'Locked'}
          </span>
        </div>
      </header>

      {unlocked ? (
        <>
          <nav className="planet-actions">
            <button type="button" className={view === 'cockpit' ? 'active' : ''} onClick={() => setView('cockpit')}>
              <span>Cockpit</span>
            </button>
            <button type="button" className={view === 'chase' ? 'active' : ''} onClick={() => setView('chase')}>
              <span>Chase</span>
            </button>
          </nav>
          <div className="planet-stage" ref={hostRef} />
          <footer className="pilot-hud">
            <div className="hud-item">Speed: <strong>{Math.round(speed)}</strong> {vehicle.type === 'air' ? 'kts' : vehicle.type === 'space' ? 'm/s' : 'km/h'}</div>
            <div className="hud-item">{vehicle.type === 'ground' ? 'WASD to drive · Space to brake' : vehicle.type === 'air' ? 'W/S to climb/dive · A/D to bank' : 'WASD to steer'}</div>
          </footer>
        </>
      ) : (
        <div className="pilot-locked">
          <p>{message}</p>
          <button className="kev-btn kev-btn-primary" onClick={() => navigate(`/exam?field=${fieldId}`)}>
            Take the {field?.label} exam
          </button>
        </div>
      )}
    </div>
  )
}
