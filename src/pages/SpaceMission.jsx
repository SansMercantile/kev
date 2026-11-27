/**
 * Space Mission — RPG-style space exploration. Students board the shuttle at
 * the docking station, launch to space, fly to planets (real distances and
 * temperatures), approach the sun with a protective suit (7-minute burn timer),
 * and die/reset if they stay too long.
 *
 * Route: /space-mission
 */
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as T from 'three'
import '../styles/planets.css'

const PLANETS = [
  { id: 'mercury', name: 'Mercury', distance: 0.39, temp: 167, color: 0x9c8e82 },
  { id: 'venus', name: 'Venus', distance: 0.72, temp: 464, color: 0xd8b06a },
  { id: 'earth', name: 'Earth', distance: 1.0, temp: 15, color: 0x2a6fae },
  { id: 'mars', name: 'Mars', distance: 1.52, temp: -65, color: 0xb5532a },
  { id: 'jupiter', name: 'Jupiter', distance: 5.2, temp: -110, color: 0xc8a06a },
  { id: 'saturn', name: 'Saturn', distance: 9.5, temp: -140, color: 0xd8c88a },
  { id: 'uranus', name: 'Uranus', distance: 19.2, temp: -195, color: 0x8ac8d8 },
  { id: 'neptune', name: 'Neptune', distance: 30.1, temp: -200, color: 0x3a5ac8 },
]

const SUN_DISTANCE = 0.0
const SUN_TEMP = 5505
const MAX_SUN_TIME = 7 * 60  // 7 minutes in seconds

export default function SpaceMission() {
  const hostRef = useRef(null)
  const navigate = useNavigate()
  const [stage, setStage] = useState('docking')  // docking | launch | space | approach_sun | dead
  const [message, setMessage] = useState('Board the shuttle at the docking station.')
  const [target, setTarget] = useState(null)
  const [sunTime, setSunTime] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })

  const stateRef = useRef({ stage, sunTime, target })
  useEffect(() => { stateRef.current = { stage, sunTime, target } }, [stage, sunTime, target])

  // sun burn timer
  useEffect(() => {
    if (stage !== 'approach_sun') return undefined
    const interval = setInterval(() => {
      setSunTime((prev) => {
        const next = prev + 0.1
        if (next >= MAX_SUN_TIME) {
          setStage('dead')
          setMessage('You stayed by the sun too long and got severe burns. Resetting to school...')
          setTimeout(() => { setStage('docking'); setSunTime(0) }, 3000)
          return MAX_SUN_TIME
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [stage])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#000208')
    const camera = new T.PerspectiveCamera(60, 1, 0.1, 10000)
    camera.position.set(0, 5, 20)

    // sun
    const sun = new T.Mesh(new T.SphereGeometry(20, 32, 24), new T.MeshBasicMaterial({ color: 0xffc24a }))
    scene.add(sun)
    const sunGlow = new T.Sprite(new T.SpriteMaterial({ map: makeGlow(), color: 0xffd27a, transparent: true, opacity: 0.8, depthWrite: false }))
    sunGlow.scale.set(80, 80, 1)
    scene.add(sunGlow)

    // planets (real relative distances, log scale)
    const planetMeshes = []
    PLANETS.forEach((p) => {
      const dist = Math.log(1 + p.distance) * 200
      const mesh = new T.Mesh(new T.SphereGeometry(2 + p.distance * 0.5, 24, 16), new T.MeshStandardMaterial({ color: p.color, roughness: 0.7 }))
      mesh.position.set(dist, 0, 0)
      mesh.userData.planetId = p.id
      mesh.userData.name = p.name
      mesh.userData.distance = p.distance
      mesh.userData.temp = p.temp
      scene.add(mesh)
      planetMeshes.push(mesh)
      // orbit ring
      const ring = new T.Mesh(new T.RingGeometry(dist, dist + 0.5, 64), new T.MeshBasicMaterial({ color: 0x3a4a6a, side: T.DoubleSide, transparent: true, opacity: 0.3 }))
      ring.rotation.x = -Math.PI / 2
      scene.add(ring)
    })

    // shuttle
    const shuttle = new T.Group()
    const shuttleBody = new T.Mesh(new T.ConeGeometry(0.5, 2, 8), new T.MeshStandardMaterial({ color: 0xd0c8b8 }))
    shuttleBody.rotation.x = Math.PI / 2
    shuttle.add(shuttleBody)
    scene.add(shuttle)

    scene.add(new T.AmbientLight(0xffffff, 0.3))
    const key = new T.DirectionalLight(0xfff5e8, 1.0)
    key.position.set(50, 100, 50)
    scene.add(key)

    // input
    const keys = {}
    window.addEventListener('keydown', (e) => { keys[e.code] = true })
    window.addEventListener('keyup', (e) => { keys[e.code] = false })

    // physics
    const pos = new T.Vector3(0, 0, 0)
    const vel = new T.Vector3()
    let heading = 0
    let pitch = 0
    const clock = new T.Clock()
    let raf = 0

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const s = stateRef.current

      if (s.stage === 'space' || s.stage === 'approach_sun') {
        // free flight
        const forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0)
        const side = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0)
        const up = (keys['Space'] ? 1 : 0) - (keys['ShiftLeft'] ? 1 : 0)
        heading += side * dt * 0.5
        pitch = Math.max(-0.5, Math.min(0.5, pitch + up * dt * 0.3))
        const dir = new T.Vector3(Math.sin(heading) * Math.cos(pitch), Math.sin(pitch), Math.cos(heading) * Math.cos(pitch))
        vel.lerp(dir.multiplyScalar(forward * 50), dt * 2)
        pos.addScaledVector(vel, dt)
        shuttle.position.copy(pos)
        shuttle.lookAt(pos.clone().add(dir))
        camera.position.copy(pos.clone().add(new T.Vector3(0, 2, -10)))
        camera.lookAt(pos)
        setPosition({ x: pos.x, y: pos.y, z: pos.z })

        // check sun proximity
        const distToSun = pos.distanceTo(new T.Vector3(0, 0, 0))
        if (s.stage === 'approach_sun' && distToSun < 50) {
          setMessage(`⚠️ Approaching the sun! Temperature rising. Leave within ${(MAX_SUN_TIME - s.sunTime).toFixed(0)} seconds or you'll burn.`)
        }
        // check planet proximity
        planetMeshes.forEach((mesh) => {
          const dist = pos.distanceTo(mesh.position)
          if (dist < 20) {
            setMessage(`Approaching ${mesh.userData.name}: ${mesh.userData.distance} AU from Earth, ${mesh.userData.temp}°C surface temperature.`)
          }
        })
      } else if (s.stage === 'launch') {
        // launch sequence: ascend to space
        pos.y += dt * 30
        shuttle.position.copy(pos)
        camera.position.copy(pos.clone().add(new T.Vector3(0, 2, -10)))
        camera.lookAt(pos)
        if (pos.y > 200) setStage('space')
      }

      renderer.render(scene, camera)
    }
    animate()

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Space Mission</span>
          <h1>{stage === 'docking' ? 'Docking station' : stage === 'launch' ? 'Launching...' : stage === 'space' ? 'In space' : stage === 'approach_sun' ? '⚠️ Sun approach' : '💀 Mission failed'}</h1>
          <span className="planet-sub">{message}</span>
        </div>
      </header>

      {stage === 'docking' && (
        <div className="story-panel">
          <h2>Board the shuttle</h2>
          <p>Walk to the docking station and board the shuttle. You'll launch to space, fly to planets, and can approach the sun with a protective suit (max 7 minutes).</p>
          <button className="kev-btn kev-btn-primary" onClick={() => setStage('launch')}>
            Board and launch
          </button>
        </div>
      )}

      {stage === 'launch' && (
        <div className="story-panel">
          <h2>Launch sequence initiated</h2>
          <p>Ascending to space...</p>
        </div>
      )}

      {stage === 'space' && (
        <>
          <div className="planet-stage" ref={hostRef} />
          <div className="space-nav">
            <h3>Navigate to:</h3>
            {PLANETS.map((p) => (
              <button key={p.id} type="button" onClick={() => setTarget(p)}>
                {p.name} ({p.distance} AU, {p.temp}°C)
              </button>
            ))}
            <button type="button" className="sun-btn" onClick={() => setStage('approach_sun')}>
              ☀️ Approach the sun (7 min max)
            </button>
          </div>
          <footer className="pilot-hud">
            <div className="hud-item">Position: <strong>{position.x.toFixed(0)}, {position.y.toFixed(0)}, {position.z.toFixed(0)}</strong></div>
            <div className="hud-item">WASD to fly · Space/Shift to climb/dive</div>
          </footer>
        </>
      )}

      {stage === 'approach_sun' && (
        <>
          <div className="planet-stage" ref={hostRef} />
          <footer className="pilot-hud sun-timer">
            <div className="hud-item">⚠️ Sun proximity: <strong>{(MAX_SUN_TIME - sunTime).toFixed(0)}s remaining</strong></div>
            <div className="hud-item">Temperature rising</div>
          </footer>
        </>
      )}

      {stage === 'dead' && (
        <div className="story-panel">
          <h2>💀 Mission failed</h2>
          <p>{message}</p>
        </div>
      )}
    </div>
  )
}

function makeGlow() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,220,140,1)')
  g.addColorStop(0.4, 'rgba(255,180,80,0.5)')
  g.addColorStop(1, 'rgba(255,160,60,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new T.CanvasTexture(c)
}
