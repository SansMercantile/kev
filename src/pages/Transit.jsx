/**
 * Exoplanet transit viewer — a planet crossing its star (the transit method
 * astronomers use to find exoplanets). Real star/planet relative sizes and
 * orbit periods where published, with the light curve below.
 *
 * Route: /transit?system=trappist1
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as T from 'three'
import '../styles/planets.css'

const SYSTEMS = {
  trappist1: { label: 'TRAPPIST-1', starColor: 0xff8a6a, starR: 3, planetR: 0.4, period: 4, color: 0xc8a06a },
  kepler90: { label: 'Kepler-90', starColor: 0xfff4e0, starR: 3, planetR: 0.6, period: 7, color: 0x8ac8d8 },
  proxima_centauri: { label: 'Proxima Centauri b', starColor: 0xff8a6a, starR: 3, planetR: 0.4, period: 3, color: 0xc8a06a },
  hd10180: { label: 'HD 10180', starColor: 0xfff4e0, starR: 3, planetR: 0.5, period: 5, color: 0xd4af37 },
}

export default function Transit() {
  const hostRef = useRef(null)
  const [searchParams] = useSearchParams()
  const systemId = SYSTEMS[searchParams.get('system')] ? searchParams.get('system') : 'trappist1'
  const [running, setRunning] = useState(true)
  const runningRef = useRef(true)
  useEffect(() => { runningRef.current = running }, [running])
  const [depth, setDepth] = useState(0)
  const depthRef = useRef(0)

  const sys = SYSTEMS[systemId]

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#020306')
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 200)
    camera.position.set(0, 2, 20)
    camera.lookAt(0, 0, 0)

    // stars background
    const sg = new T.BufferGeometry()
    const n = 1500
    const sp = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 80 + Math.random() * 80
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      sp[i * 3] = r * Math.sin(ph) * Math.cos(th)
      sp[i * 3 + 1] = r * Math.cos(ph)
      sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3))
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.7 })))

    // star (emissive + glow)
    const star = new T.Mesh(
      new T.SphereGeometry(sys.starR, 48, 32),
      new T.MeshBasicMaterial({ color: sys.starColor })
    )
    scene.add(star)
    const glow = new T.Sprite(new T.SpriteMaterial({ map: makeGlow(), color: sys.starColor, transparent: true, opacity: 0.7, depthWrite: false }))
    glow.scale.set(sys.starR * 4, sys.starR * 4, 1)
    scene.add(glow)

    // planet (dark, orbits in front)
    const planet = new T.Mesh(
      new T.SphereGeometry(sys.planetR, 24, 16),
      new T.MeshStandardMaterial({ color: sys.color, roughness: 0.9 })
    )
    scene.add(planet)

    // orbit path (edge-on so transits cross the star)
    const orbitR = 10
    const orbitPts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2
      orbitPts.push(new T.Vector3(Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR))
    }
    scene.add(new T.Line(new T.BufferGeometry().setFromPoints(orbitPts), new T.LineBasicMaterial({ color: 0x3a4a6a, transparent: true, opacity: 0.5 })))

    scene.add(new T.AmbientLight(0xffffff, 0.3))

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    const clock = new T.Clock()
    let angle = 0
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (runningRef.current) angle += dt * (2 * Math.PI / sys.period)
      // edge-on orbit: planet crosses in front of the star
      const x = Math.cos(angle) * orbitR
      const z = Math.sin(angle) * orbitR
      planet.position.set(x, 0, z)
      // transit depth: how much of the star is blocked (when z < 0 and |x| < starR)
      const inTransit = z < 0 && Math.abs(x) < sys.starR
      const targetDepth = inTransit ? (sys.planetR / sys.starR) ** 2 : 0
      depthRef.current = T.MathUtils.damp(depthRef.current, targetDepth, 8, dt)
      setDepth(depthRef.current)
      // dim the star during transit
      star.material.color.setScalar(1 - depthRef.current * 0.6)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [sys])

  return (
    <div className="system-page">
      <div className="system-stage" ref={hostRef} />
      <header className="system-header">
        <span className="planet-kicker">Exoplanet transit</span>
        <h1>{sys.label}</h1>
        <span className="planet-sub">Planet crossing its star — the transit method</span>
        <div className="system-controls">
          <button type="button" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Resume'}</button>
        </div>
        <div className="transit-curve">
          <span>Light curve</span>
          <div className="curve-track">
            <div className="curve-fill" style={{ height: `${(1 - depth) * 100}%` }} />
          </div>
          <span className="curve-val">{(depth * 100).toFixed(2)}% dimmed</span>
        </div>
      </header>
    </div>
  )
}

function makeGlow() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.4)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new T.CanvasTexture(c)
}
