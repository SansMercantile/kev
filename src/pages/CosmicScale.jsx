/**
 * Cosmic scale navigator — zoom from a single planet all the way out to the
 * supercluster, loading the real atlas model at each level (Earth's layers,
 * the solar system, the Milky Way's spiral arms, the Virgo Cluster's galaxies).
 *
 * Route: /cosmic
 */
import React, { useEffect, useRef, useState } from 'react'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import '../styles/planets.css'

// Each level: real model to load + scale + description
const LEVELS = [
  { id: 'planet', label: 'Planet', model: '/models/atlas-planet-earth.json', scale: 5, desc: 'Earth: 12,742 km diameter', color: 0x2a6fae },
  { id: 'solar_system', label: 'Solar system', model: '/models/atlas-space-asteroid_belt.json', scale: 40, desc: 'Asteroid belt: 2-4 AU from the Sun', color: 0x8a8078 },
  { id: 'nearest_stars', label: 'Nearest stars', model: '/models/atlas-exoplanet-proxima_centauri.json', scale: 200, desc: 'Proxima Centauri: 4.2 light-years', color: 0xff8a6a },
  { id: 'milky_way', label: 'Milky Way', model: '/models/atlas-space-milky_way.json', scale: 800, desc: '100,000 light-years across', color: 0x3a4a6a },
  { id: 'local_group', label: 'Local Group', model: '/models/atlas-cluster-local_group.json', scale: 2000, desc: '10 million light-years', color: 0x3a4a6a },
  { id: 'virgo_cluster', label: 'Virgo Cluster', model: '/models/atlas-cluster-virgo_cluster.json', scale: 6000, desc: '110 million light-years', color: 0x3a4a6a },
  { id: 'supercluster', label: 'Laniakea Supercluster', model: '/models/atlas-cluster-lanikea_supercluster.json', scale: 15000, desc: '520 million light-years', color: 0xe2562a },
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
    parts.push({ geometry: g, system: p.system, name: p.name })
  })
  return parts
}

export default function CosmicScale() {
  const hostRef = useRef(null)
  const [level, setLevel] = useState('solar_system')
  const [loading, setLoading] = useState(false)
  const [zoomT, setZoomT] = useState(0.5)  // 0..1 continuous scrub through scales
  const levelRef = useRef(level)
  const modelCache = useRef({})
  const modelGroupRef = useRef(null)
  const labelGroupRef = useRef(null)
  useEffect(() => { levelRef.current = level }, [level])
  const zoomTRef = useRef(zoomT)
  useEffect(() => { zoomTRef.current = zoomT }, [zoomT])

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

    // model group (the active atlas model)
    const modelGroup = new T.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    // text labels for parts (sprites)
    // text labels for parts (sprites)
    const labelGroup = new T.Group()
    scene.add(labelGroup)
    labelGroupRef.current = labelGroup

    scene.add(new T.AmbientLight(0xffffff, 0.5))
    const key = new T.DirectionalLight(0xfff5e8, 1.2)
    key.position.set(5, 8, 5)
    scene.add(key)

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    const targetDist = { current: 60 }
    const clock = new T.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      // continuous scrub: zoomT 0..1 maps across all levels
      const t = zoomTRef.current
      const idx = t * (LEVELS.length - 1)
      const lo = Math.floor(idx)
      const hi = Math.min(lo + 1, LEVELS.length - 1)
      const frac = idx - lo
      const scale = T.MathUtils.lerp(LEVELS[lo].scale, LEVELS[hi].scale, frac)
      const target = scale * 3.5
      targetDist.current = T.MathUtils.damp(targetDist.current, target, 3, dt)
      const dir = camera.position.clone().normalize()
      camera.position.copy(dir.multiplyScalar(targetDist.current))
      camera.lookAt(0, 0, 0)
      modelGroup.rotation.y += dt * 0.1
      // labels face the camera
      labelGroup.children.forEach((sprite) => sprite.quaternion.copy(camera.quaternion))
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

  // load the atlas model for the active level
  useEffect(() => {
    const lv = LEVELS.find((l) => l.id === level)
    if (!lv || !modelGroupRef.current) return
    const group = modelGroupRef.current
    if (modelCache.current[level]) {
      attachModel(group, labelGroupRef.current, modelCache.current[level], lv)
      return
    }
    setLoading(true)
    loadAtlasModel(lv.model)
      .then((parts) => {
        modelCache.current[level] = parts
        if (levelRef.current === level) {
          attachModel(group, labelGroupRef.current, parts, lv)
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [level])

  const current = LEVELS.find((l) => l.id === level)

  return (
    <div className="system-page">
      <div className="system-stage" ref={hostRef} />
      <header className="system-header">
        <span className="planet-kicker">Cosmic scale</span>
        <h1>{current?.label}</h1>
        <span className="planet-sub">{current?.desc}{loading ? ' (loading…)' : ''}</span>
        <div className="scale-controls">
          {LEVELS.map((lv) => (
            <button key={lv.id} type="button"
              className={level === lv.id ? 'scale-btn active' : 'scale-btn'}
              onClick={() => setLevel(lv.id)}>
              {lv.label}
            </button>
          ))}
        </div>
        <div className="zoom-scrub">
          <label>Free zoom</label>
          <input type="range" min="0" max="1000" value={Math.round(zoomT * 1000)}
            onChange={(e) => setZoomT(Number(e.target.value) / 1000)} />
          <span className="zoom-val">{(zoomT * 100).toFixed(0)}%</span>
        </div>
        <span className="scale-hint">Scroll to zoom · click a level to jump · drag the scrubber to move continuously · labels on models</span>
      </header>
    </div>
  )
}

function attachModel(group, labelGroup, parts, lv) {
  // clear previous
  while (group.children.length) group.remove(group.children[0])
  while (labelGroup.children.length) labelGroup.remove(labelGroup.children[0])
  // compute bounds to center + scale
  const box = new T.Box3()
  parts.forEach((p) => box.union(new T.Box3().setFromBufferAttribute(p.geometry.attributes.position)))
  const size = box.getSize(new T.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const s = lv.scale / maxDim
  const center = box.getCenter(new T.Vector3())
  parts.forEach((p) => {
    const mat = new T.MeshStandardMaterial({
      color: lv.color, roughness: 0.7, metalness: 0.05, side: T.DoubleSide,
    })
    const mesh = new T.Mesh(p.geometry, mat)
    mesh.position.sub(center).multiplyScalar(s)
    group.add(mesh)
    // label sprite at the part's center
    const c = p.geometry.boundingSphere ? p.geometry.boundingSphere.center : new T.Vector3()
    const sprite = makeTextSprite(p.name, lv.color)
    sprite.position.copy(c.clone().sub(center).multiplyScalar(s).add(new T.Vector3(0, maxDim * s * 0.12, 0)))
    sprite.scale.set(maxDim * s * 0.08, maxDim * s * 0.04, 1)
    labelGroup.add(sprite)
  })
}

function makeTextSprite(text, color) {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, 256, 128)
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(text, 128, 64)
  const tex = new T.CanvasTexture(c)
  return new T.Sprite(new T.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false }))
}
