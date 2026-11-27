/**
 * Geography — open world built from real OpenStreetMap data. Every house,
 * every street, suburb by suburb. Students start at school and explore the
 * neighbourhood, theme parks, the ocean, the city.
 *
 * Route: /geography?area=westminster
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerTap } from '../lib/pointerTap'
import '../styles/planets.css'

const AREAS = {
  westminster: { label: 'Westminster, London', model: '/models/atlas-geo-westminster_block.json', color: 0x8a8a9a, center: [51.5, -0.12] },
  eiffel: { label: 'Eiffel District, Paris', model: '/models/atlas-geo-eiffel_block.json', color: 0x8a8a9a, center: [48.86, 2.29] },
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

export default function Geography() {
  const hostRef = useRef(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const areaId = AREAS[searchParams.get('area')] ? searchParams.get('area') : 'westminster'
  const area = AREAS[areaId]
  const [message, setMessage] = useState('Explore the neighbourhood. Click a building to inspect it. Drive out to see more of the city.')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#87ceeb')
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 2000)
    camera.position.set(50, 50, 100)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.set(0, 0, 0)
    controls.maxDistance = 500

    scene.add(new T.AmbientLight(0xffffff, 0.6))
    const sun = new T.DirectionalLight(0xfff5e8, 1.5)
    sun.position.set(100, 200, 100)
    scene.add(sun)

    // load OSM geography
    const worldGroup = new T.Group()
    scene.add(worldGroup)
    loadAtlasModel(area.model).then((parts) => {
      const box = new T.Box3()
      parts.forEach((p) => box.union(new T.Box3().setFromBufferAttribute(p.geometry.attributes.position)))
      const size = box.getSize(new T.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const s = 500 / maxDim
      const center = box.getCenter(new T.Vector3())
      parts.forEach((p) => {
        const mat = new T.MeshStandardMaterial({
          color: p.system === 'building' ? 0x8a8a9a : 0x4a4a4f,
          roughness: 0.8, metalness: 0.05, side: T.DoubleSide,
        })
        const mesh = new T.Mesh(p.geometry, mat)
        mesh.userData.system = p.system
        mesh.userData.name = p.name
        mesh.position.sub(center).multiplyScalar(s)
        worldGroup.add(mesh)
      })
    }).catch(() => {})

    // ground plane
    const ground = new T.Mesh(new T.CircleGeometry(500, 64), new T.MeshStandardMaterial({ color: 0x3a5f3a, roughness: 0.9 }))
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

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
      const hits = raycaster.intersectObjects(worldGroup.children, false)
      if (hits[0]) {
        const system = hits[0].object.userData.system
        const name = hits[0].object.userData.name
        setSelected({ system, name })
        setMessage(system === 'building' ? `Inspecting: ${name} (${system.replace(/_/g, ' ')})` : `This is a ${system.replace(/_/g, ' ')}.`)
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
  }, [area])

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Geography — {area.label}</span>
          <h1>Open world</h1>
          <span className="planet-sub">Every house, every street — real OpenStreetMap data</span>
        </div>
        <div className="body-selector">
          {Object.entries(AREAS).map(([id, a]) => (
            <button key={id} type="button"
              className={areaId === id ? 'body-btn active' : 'body-btn'}
              onClick={() => { window.location.search = `?area=${id}` }}>
              {a.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="planet-actions">
        <button type="button" onClick={() => navigate('/pilot?vehicle=car')}>
          <span>🚗 Drive out of school</span>
        </button>
        <button type="button" onClick={() => navigate('/space-centre')}>
          <span>🚀 Go to space centre</span>
        </button>
      </nav>

      <div className="planet-stage" ref={hostRef} />

      <footer className="garage-status">
        <div className="status-message">{message}</div>
      </footer>
    </div>
  )
}
