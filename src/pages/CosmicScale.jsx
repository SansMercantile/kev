/**
 * Cosmic scale navigator — zoom from a single planet all the way out to the
 * supercluster. Real relative scales (logarithmic). Click a level to jump.
 *
 * Route: /cosmic
 */
import React, { useEffect, useRef, useState } from 'react'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import '../styles/planets.css'

// Each level: name, object scale (scene units), description
const LEVELS = [
  { id: 'planet', label: 'Planet', scale: 1, desc: 'Earth: 12,742 km diameter' },
  { id: 'solar_system', label: 'Solar system', scale: 40, desc: 'Neptune orbit: 4.5 billion km' },
  { id: 'nearest_stars', label: 'Nearest stars', scale: 200, desc: 'Alpha Centauri: 4.3 light-years' },
  { id: 'milky_way', label: 'Milky Way', scale: 800, desc: '100,000 light-years across' },
  { id: 'local_group', label: 'Local Group', scale: 2000, desc: '10 million light-years' },
  { id: 'virgo_cluster', label: 'Virgo Cluster', scale: 6000, desc: '110 million light-years' },
  { id: 'supercluster', label: 'Laniakea Supercluster', scale: 15000, desc: '520 million light-years' },
]

export default function CosmicScale() {
  const hostRef = useRef(null)
  const [level, setLevel] = useState('solar_system')
  const levelRef = useRef(level)
  useEffect(() => { levelRef.current = level }, [level])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#020306')
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 100000)
    camera.position.set(0, 30, 60)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 80000

    // stars background
    const sg = new T.BufferGeometry()
    const n = 3000
    const sp = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 20000 + Math.random() * 30000
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      sp[i * 3] = r * Math.sin(ph) * Math.cos(th)
      sp[i * 3 + 1] = r * Math.cos(ph)
      sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3))
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.7 })))

    // build each scale level as concentric reference spheres + labels
    const levelGroups = {}
    LEVELS.forEach((lv, i) => {
      const group = new T.Group()
      // reference sphere (wireframe) at this scale
      const sphere = new T.Mesh(
        new T.SphereGeometry(lv.scale, 48, 32),
        new T.MeshBasicMaterial({ color: 0x3a4a6a, wireframe: true, transparent: true, opacity: 0.15 })
      )
      group.add(sphere)
      // marker sphere (solid) at the edge
      const marker = new T.Mesh(
        new T.SphereGeometry(Math.max(lv.scale * 0.03, lv.scale * 0.01), 16, 12),
        new T.MeshStandardMaterial({ color: 0xc9a227, emissive: 0xc9a227, emissiveIntensity: 0.5 })
      )
      marker.position.x = lv.scale
      group.add(marker)
      group.visible = false
      scene.add(group)
      levelGroups[lv.id] = { group, marker }
    })

    // sun at center (scales with level)
    const sun = new T.Mesh(new T.SphereGeometry(0.5, 24, 16), new T.MeshBasicMaterial({ color: 0xffc24a }))
    scene.add(sun)
    scene.add(new T.AmbientLight(0xffffff, 0.6))

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    // animate camera to the active level's scale
    const targetDist = { current: 60 }
    const clock = new T.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const lv = LEVELS.find((l) => l.id === levelRef.current)
      const target = lv ? lv.scale * 3.5 : 60
      targetDist.current = T.MathUtils.damp(targetDist.current, target, 3, dt)
      const dir = camera.position.clone().normalize()
      camera.position.copy(dir.multiplyScalar(targetDist.current))
      camera.lookAt(0, 0, 0)
      // show/hide level groups
      LEVELS.forEach((l) => {
        const entry = levelGroups[l.id]
        entry.group.visible = (l.id === levelRef.current)
      })
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
  }, [])

  const current = LEVELS.find((l) => l.id === level)

  return (
    <div className="system-page">
      <div className="system-stage" ref={hostRef} />
      <header className="system-header">
        <span className="planet-kicker">Cosmic scale</span>
        <h1>{current?.label}</h1>
        <span className="planet-sub">{current?.desc}</span>
        <div className="scale-controls">
          {LEVELS.map((lv) => (
            <button key={lv.id} type="button"
              className={level === lv.id ? 'scale-btn active' : 'scale-btn'}
              onClick={() => setLevel(lv.id)}>
              {lv.label}
            </button>
          ))}
        </div>
        <span className="scale-hint">Scroll to zoom · click a level to jump</span>
      </header>
    </div>
  )
}
