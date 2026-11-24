/**
 * Solar-system overview — the Sun and all planets orbiting in real relative
 * periods (aesthetic scale). Click a planet to open its layered explorer
 * (/planets?body=id). Auto-orbits and rotates.
 *
 * Route: /system
 */
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerTap } from '../lib/pointerTap'
import '../styles/planets.css'

// body, color, radius(scene), orbitRadius(scene), periodYears, texture
const PLANETS = [
  { id: 'mercury', label: 'Mercury', color: 0x9c8e82, r: 0.5, orbit: 8, period: 0.24 },
  { id: 'venus', label: 'Venus', color: 0xd8b06a, r: 0.8, orbit: 11, period: 0.62 },
  { id: 'earth', label: 'Earth', color: 0x2a6fae, r: 0.85, orbit: 14, period: 1.0, texture: 'earth.jpg' },
  { id: 'mars', label: 'Mars', color: 0xb5532a, r: 0.6, orbit: 17, period: 1.88, texture: 'mars.jpg' },
  { id: 'jupiter', label: 'Jupiter', color: 0xc8a06a, r: 2.2, orbit: 24, period: 11.86, texture: 'jupiter.jpg' },
  { id: 'saturn', label: 'Saturn', color: 0xd8c88a, r: 1.9, orbit: 30, period: 29.45, rings: true, texture: 'saturn.jpg' },
  { id: 'uranus', label: 'Uranus', color: 0x8ac8d8, r: 1.2, orbit: 36, period: 84.02 },
  { id: 'neptune', label: 'Neptune', color: 0x3a5ac8, r: 1.15, orbit: 41, period: 164.8 },
  { id: 'pluto', label: 'Pluto', color: 0xc8a88a, r: 0.3, orbit: 45, period: 248.0 },
]

export default function System() {
  const hostRef = useRef(null)
  const navigate = useNavigate()
  const [running, setRunning] = useState(true)
  const stateRef = useRef({ running: true })
  const [hover, setHover] = useState(null)

  useEffect(() => { stateRef.current.running = running }, [running])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#03050a')
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 2000)
    camera.position.set(0, 38, 62)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxDistance = 200
    controls.minDistance = 6

    // stars
    const sg = new T.BufferGeometry()
    const n = 2500
    const sp = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 400 + Math.random() * 400
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      sp[i * 3] = r * Math.sin(ph) * Math.cos(th)
      sp[i * 3 + 1] = r * Math.cos(ph)
      sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3))
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.1, transparent: true, opacity: 0.8 })))

    // sun
    const sunMat = new T.MeshBasicMaterial({ color: 0xffc24a })
    const sun = new T.Mesh(new T.SphereGeometry(4, 48, 32), sunMat)
    scene.add(sun)
    const glow = new T.Sprite(new T.SpriteMaterial({
      map: makeGlowTexture(), color: 0xffd27a, transparent: true, opacity: 0.9, depthWrite: false,
    }))
    glow.scale.set(24, 24, 1)
    scene.add(glow)
    scene.add(new T.AmbientLight(0xffffff, 0.25))
    const sunlight = new T.PointLight(0xfff2d8, 2.2, 0, 1.2)
    scene.add(sunlight)

    const texLoader = new T.TextureLoader()
    const bodies = []
    PLANETS.forEach((p) => {
      const orbitGroup = new T.Group()
      scene.add(orbitGroup)
      const mat = new T.MeshStandardMaterial({
        color: p.color, roughness: 0.9, metalness: 0.05,
        map: p.texture ? texLoader.load(`/textures/planets/${p.texture}`) : null,
      })
      if (mat.map) mat.map.colorSpace = T.SRGBColorSpace
      const mesh = new T.Mesh(new T.SphereGeometry(p.r, 32, 24), mat)
      mesh.position.x = p.orbit
      mesh.userData.bodyId = p.id
      orbitGroup.add(mesh)
      if (p.rings) {
        const ring = new T.Mesh(new T.RingGeometry(p.r * 1.4, p.r * 2.2, 48), new T.MeshBasicMaterial({ color: 0xc8b060, transparent: true, opacity: 0.4, side: T.DoubleSide }))
        ring.rotation.x = -Math.PI / 2 + 0.3
        mesh.add(ring)
      }
      // orbit path
      const pathPts = []
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2
        pathPts.push(new T.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit))
      }
      const path = new T.Line(new T.BufferGeometry().setFromPoints(pathPts), new T.LineBasicMaterial({ color: 0x2a3a5a, transparent: true, opacity: 0.5 }))
      scene.add(path)
      bodies.push({ ...p, orbitGroup, mesh })
    })

    // picking
    const raycaster = new T.Raycaster()
    const pointer = new T.Vector2()
    const tap = new PointerTap()
    const onDown = (e) => tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
    const onMove = (e) => {
      tap.move(e.pointerId, e.clientX, e.clientY)
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(bodies.map((b) => b.mesh), false)
      setHover(hits[0] ? hits[0].object.userData.bodyId : null)
      renderer.domElement.style.cursor = hits[0] ? 'pointer' : 'grab'
    }
    const onUp = (e) => {
      if (!tap.up(e.pointerId, e.clientX, e.clientY)) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(bodies.map((b) => b.mesh), false)
      if (hits[0]) navigate(`/planets?body=${hits[0].object.userData.bodyId}`)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerup', onUp)

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
      if (stateRef.current.running) {
        bodies.forEach((b) => {
          b.orbitGroup.rotation.y += dt * (1 / b.period) * 0.35  // real relative periods, scaled
          b.mesh.rotation.y += dt * 0.6                          // spin
        })
        sun.rotation.y += dt * 0.05
      }
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
  }, [navigate])

  return (
    <div className="system-page">
      <div className="system-stage" ref={hostRef} />
      <header className="system-header">
        <span className="planet-kicker">Solar system</span>
        <h1>The Sun & planets</h1>
        <span className="planet-sub">Real relative orbital periods · click a planet to explore its layers</span>
        <div className="system-controls">
          <button type="button" onClick={() => setRunning((r) => !r)}>{running ? 'Pause orbits' : 'Resume orbits'}</button>
          <button type="button" onClick={() => navigate('/planets')}>Open layered explorer</button>
        </div>
        {hover && <div className="system-hover">{hover}</div>}
      </header>
    </div>
  )
}

function makeGlowTexture() {
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
