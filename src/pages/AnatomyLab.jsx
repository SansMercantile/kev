import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useTranslation } from 'react-i18next'
import { ANATOMY_SYSTEMS, ANATOMY_PARTS } from '../lib/anatomySystems'
import { PointerTap } from '../lib/pointerTap'
import TutorAskPanel from '../components/TutorAskPanel'

function createPartMesh(part, color) {
  const [name, position, size, description] = part
  const geometry = new THREE.BoxGeometry(...size)
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.userData = { name, description, basePosition: new THREE.Vector3(...position) }
  return mesh
}

export default function AnatomyLab() {
  const { t } = useTranslation()
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const tapRef = useRef(new PointerTap())
  const activeSystemRef = useRef('skeletal')
  const isolateRef = useRef(false)
  const selectedRef = useRef(null)
  const [activeSystem, setActiveSystem] = useState('skeletal')
  const [explode, setExplode] = useState(0)
  const [isolated, setIsolated] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [search, setSearch] = useState('')
  const [webglReady, setWebglReady] = useState(true)

  useEffect(() => {
    activeSystemRef.current = activeSystem
  }, [activeSystem])
  useEffect(() => {
    isolateRef.current = isolated
  }, [isolated])
  useEffect(() => {
    selectedRef.current = selectedPart
  }, [selectedPart])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setWebglReady(false)
      return undefined
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#07111f')
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(5.4, 2.4, 7.8)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 1.25, 0)
    scene.add(new THREE.HemisphereLight('#fff2d5', '#18324d', 2.2))
    const keyLight = new THREE.DirectionalLight('#ffffff', 3)
    keyLight.position.set(4, 7, 6)
    scene.add(keyLight)

    const root = new THREE.Group()
    scene.add(root)
    const groups = {}
    ANATOMY_SYSTEMS.forEach(({ id, color }) => {
      const group = new THREE.Group()
      group.userData.system = id
      ;(ANATOMY_PARTS[id] || []).forEach((part) => group.add(createPartMesh(part, color)))
      root.add(group)
      groups[id] = group
    })

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.9, 64),
      new THREE.MeshBasicMaterial({ color: '#0d2136', transparent: true, opacity: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -2.05
    scene.add(floor)

    const resize = () => {
      const width = mount.clientWidth || 640
      const height = mount.clientHeight || 560
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    mount.appendChild(renderer.domElement)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pick = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(groups[activeSystemRef.current].children.filter((m) => m.visible))[0]
      if (hit) setSelectedPart({ name: hit.object.userData.name, description: hit.object.userData.description })
    }
    const tap = tapRef.current
    const onPointerDown = (event) => tap.down(event.pointerId, event.clientX, event.clientY, 6)
    const onPointerMove = (event) => tap.move(event.pointerId, event.clientX, event.clientY)
    const onPointerUp = (event) => {
      if (tap.up(event.pointerId, event.clientX, event.clientY)) pick(event)
    }
    const onPointerCancel = (event) => tap.cancel(event.pointerId)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerCancel)
    window.addEventListener('resize', resize)
    sceneRef.current = { renderer, scene, camera, controls, groups }

    let animationFrame
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerCancel)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) object.material.dispose()
      })
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const current = sceneRef.current
    if (!current) return
    const selectedName = selectedRef.current?.name
    Object.entries(current.groups).forEach(([id, group]) => {
      group.visible = id === activeSystem
      group.children.forEach((mesh, index) => {
        if (isolateRef.current && mesh.userData.name !== selectedName) {
          mesh.visible = false
          return
        }
        mesh.visible = true
        const base = mesh.userData.basePosition
        const direction = new THREE.Vector3(index % 2 === 0 ? 1 : -1, (index - 2) * 0.08, 0.8)
        mesh.position.copy(base).addScaledVector(direction, explode / 100 * 1.7)
      })
    })
  }, [activeSystem, explode, isolated, selectedPart])

  const reset = () => {
    setExplode(0)
    setIsolated(false)
    setSelectedPart(null)
    setSearch('')
    const current = sceneRef.current
    if (current) {
      current.camera.position.set(5.4, 2.4, 7.8)
      current.controls.target.set(0, 1.25, 0)
      current.controls.update()
    }
  }

  const q = search.toLowerCase().trim()
  const searchHits = q
    ? Object.entries(ANATOMY_PARTS)
        .flatMap(([systemId, parts]) => parts.map((p) => ({ systemId, name: p[0], description: p[3] })))
        .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
        .slice(0, 12)
    : []
  const activeSystemMeta = ANATOMY_SYSTEMS.find((s) => s.id === activeSystem)
  const activeCount = (ANATOMY_PARTS[activeSystem] || []).length

  return (
    <main className="kev-section" style={{ background: '#07111f', color: '#f8fafc', minHeight: 'calc(100vh - 80px)' }}>
      <section className="kev-section" aria-label="Human anatomy lab" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#f0b35b', letterSpacing: '0.12em', fontSize: '0.78rem', fontWeight: 700 }}>{t('viewer.eyebrow')}</p>
            <h1 className="kev-section-title" style={{ color: '#f8fafc', marginBottom: '0.45rem' }}>{t('viewer.atlasTitle')}</h1>
            <p className="kev-section-copy" style={{ color: '#b9c8d9', maxWidth: 680, margin: 0 }}>
              {t('viewer.atlasSubtitle', { count: ANATOMY_SYSTEMS.length })}
            </p>
            <p style={{ color: '#8fa3b8', fontSize: '0.82rem', margin: '0.5rem 0 0' }}>
              {t('viewer.atlasGuidedBy')}{' '}
              <a href="/xr-academy" style={{ color: '#f0b35b' }}>{t('viewer.openFullXrLab')}</a>
              {' '} &middot; <a href="/agents" style={{ color: '#f0b35b' }}>{t('viewer.allTutors')}</a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="kev-btn" onClick={() => setIsolated((v) => { if (!selectedPart && !v) return v; return !v })} disabled={!selectedPart} title={selectedPart ? t('viewer.isolateHint') : t('viewer.isolateNeedsSelection')}>
              {isolated ? t('viewer.showAll') : t('viewer.isolate')}
            </button>
            <button className="kev-btn" onClick={reset}>{t('viewer.resetView')}</button>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('viewer.searchAnatomy')}
          aria-label={t('viewer.searchAnatomy')}
          style={{ width: '100%', marginTop: '1rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 6, color: '#f8fafc', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
        />
        {searchHits.length > 0 && (
          <div style={{ marginTop: '0.6rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 8, padding: '0.75rem', display: 'grid', gap: '0.4rem' }} aria-live="polite">
            {searchHits.map((hit) => (
              <button key={`${hit.systemId}:${hit.name}`} className="kev-btn" onClick={() => { setActiveSystem(hit.systemId); setSelectedPart({ name: hit.name, description: hit.description }) }} style={{ textAlign: 'left' }}>
                {hit.name} <span style={{ color: '#8fa3b8' }}>&middot; {hit.systemId}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1rem', marginTop: '1rem' }}>
          <div ref={mountRef} role="img" aria-label="Interactive 3D human anatomy model" style={{ minHeight: 560, border: '1px solid #23415e', borderRadius: 8, overflow: 'hidden', touchAction: 'none' }}>
            {!webglReady && <p style={{ padding: '2rem', color: '#fbbf24' }}>{t('viewer.webglError')}</p>}
          </div>
          <aside style={{ display: 'grid', alignContent: 'start', gap: '1rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 8, padding: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('viewer.systems')}</h2>
              <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.75rem', maxHeight: 300, overflowY: 'auto' }}>
                {ANATOMY_SYSTEMS.map((system) => (
                  <button key={system.id} className="kev-btn" onClick={() => { setActiveSystem(system.id); setSelectedPart(null) }} style={{ textAlign: 'left', borderColor: activeSystem === system.id ? system.color : undefined, color: activeSystem === system.id ? system.color : undefined }}>
                    {t(`systems.${system.id}`, system.name)}
                  </button>
                ))}
              </div>
              {activeSystemMeta && (
                <p style={{ color: '#8fa3b8', fontSize: '0.8rem', lineHeight: 1.5, margin: '0.6rem 0 0' }}>{activeSystemMeta.description}</p>
              )}
            </div>
            <label htmlFor="explode-anatomy" style={{ display: 'grid', gap: '0.55rem' }}>
              <span style={{ fontWeight: 700 }}>{t('viewer.explodeAnatomy')} <strong>{explode}%</strong> <span style={{ color: '#8fa3b8', fontWeight: 400 }}>&middot; {t('viewer.pieces', { count: activeCount })}</span></span>
              <input id="explode-anatomy" type="range" min="0" max="100" value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
            </label>
            <div aria-live="polite" style={{ borderTop: '1px solid #23415e', paddingTop: '1rem', display: 'grid', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>{selectedPart?.name || t('viewer.selectStructure')}</h2>
              <p style={{ color: '#b9c8d9', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>{selectedPart?.description || t('viewer.tapHint')}</p>
              {selectedPart && (
                <a href="/xr-academy" style={{ color: '#f0b35b', fontSize: '0.85rem' }}>
                  {t('viewer.practiceBiology')}
                </a>
              )}
            </div>
            {selectedPart && (
              <TutorAskPanel
                key={selectedPart.name}
                tutorName="Dr. Alistair Vance"
                subjectLabel="Human Atlas"
                partName={selectedPart.name}
                simulationState={{ system: activeSystem, explode, labId: 'biology', floor: 4 }}
              />
            )}
          </aside>
        </div>
        <p style={{ color: '#8fa3b8', fontSize: '0.78rem', marginTop: '1rem' }}>
          System vocabulary adapted from the Human Atlas tool (BodyParts3D 4.0, CC BY 4.0). See docs/ATTRIBUTION-human-atlas.md.
        </p>
      </section>
    </main>
  )
}
