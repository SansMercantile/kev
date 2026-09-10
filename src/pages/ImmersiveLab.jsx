import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useTranslation } from 'react-i18next'
import { IMMERSIVE_SUBJECTS, IMMERSIVE_SUBJECT_ORDER } from '../lib/immersiveSubjects'
import { PointerTap } from '../lib/pointerTap'
import { xrClient } from '../lib/xrClient'
import { getStudyLevelId, setStudyLevelId, STUDY_LEVEL_OPTIONS } from '../xr/lib/studyLevel'
import TutorAskPanel from '../components/TutorAskPanel'

function createPartMesh(part, color) {
  const [name, position, size, description, source] = part
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 })
  )
  mesh.position.set(...position)
  mesh.userData = { name, description, source: source || null, basePosition: new THREE.Vector3(...position) }
  return mesh
}

function searchLocalParts(subject, query) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const hits = []
  Object.entries(subject.parts).forEach(([systemId, parts]) => {
    parts.forEach((part) => {
      const [name, , , description] = part
      if (name.toLowerCase().includes(q) || (description || '').toLowerCase().includes(q)) {
        hits.push({ systemId, name, description })
      }
    })
  })
  return hits.slice(0, 12)
}

export default function ImmersiveLab() {
  const { t } = useTranslation()
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const tapRef = useRef(new PointerTap())
  const activeSystemRef = useRef('skeletal')
  const isolateRef = useRef(false)
  const selectedRef = useRef(null)
  const [activeSubjectId, setActiveSubjectId] = useState('anatomy')
  const [activeSystem, setActiveSystem] = useState('skeletal')
  const [explode, setExplode] = useState(0)
  const [isolated, setIsolated] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedSystemId, setSelectedSystemId] = useState(null)
  const [search, setSearch] = useState('')
  const [externalResults, setExternalResults] = useState(null)
  const [externalLoading, setExternalLoading] = useState(false)
  const [studyLevel, setStudyLevel] = useState(() => getStudyLevelId())
  const [meta, setMeta] = useState({})
  const [webglReady, setWebglReady] = useState(true)
  const subject = IMMERSIVE_SUBJECTS[activeSubjectId]

  useEffect(() => {
    activeSystemRef.current = activeSystem
  }, [activeSystem])
  useEffect(() => {
    isolateRef.current = isolated
  }, [isolated])
  useEffect(() => {
    selectedRef.current = selectedPart
  }, [selectedPart])

  // Enrich subject cards from the backend crosswalk (tutor + track names +
  // level guidance). Silent fallback to the bundled catalog when unreachable.
  useEffect(() => {
    let cancelled = false
    xrClient
      .subjects(studyLevel)
      .then((data) => {
        if (cancelled || !data.subjects) return
        const byId = {}
        data.subjects.forEach((s) => {
          byId[s.id] = s
        })
        setMeta(byId)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [studyLevel])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    const currentSubject = IMMERSIVE_SUBJECTS[activeSubjectId]
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setWebglReady(false)
      return undefined
    }

    setWebglReady(true)
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

    const groups = {}
    currentSubject.systems.forEach(({ id, color }) => {
      const group = new THREE.Group()
      ;(currentSubject.parts[id] || []).forEach((part) => group.add(createPartMesh(part, color)))
      scene.add(group)
      groups[id] = group
    })
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 64),
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
      const activeGroup = groups[activeSystemRef.current]
      const hit = activeGroup && raycaster.intersectObjects(activeGroup.children.filter((m) => m.visible))[0]
      if (hit) {
        const { name, description, source } = hit.object.userData
        setSelectedSystemId(activeSystemRef.current)
        setSelectedPart({ name, description, source })
      }
    }
    // Tap-vs-drag: only a clean tap selects, so orbiting never misfires.
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
    sceneRef.current = { renderer, camera, controls, groups }

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
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) object.material.dispose()
      })
      sceneRef.current = null
    }
  }, [activeSubjectId])

  useEffect(() => {
    const current = sceneRef.current
    if (!current) return
    const selectedName = selectedRef.current?.name
    Object.entries(current.groups).forEach(([id, group]) => {
      group.visible = id === activeSystem
      group.children.forEach((mesh, index) => {
        // Isolation mode: show only the inspected structure.
        if (isolateRef.current && mesh.userData.name !== selectedName) {
          mesh.visible = false
          return
        }
        mesh.visible = true
        const direction = new THREE.Vector3(index % 2 === 0 ? 1 : -1, (index - 2) * 0.08, 0.8)
        mesh.position.copy(mesh.userData.basePosition).addScaledVector(direction, explode / 100 * 1.7)
      })
    })
  }, [activeSystem, explode, isolated, selectedPart, activeSubjectId])

  const selectSubject = (subjectId) => {
    const next = IMMERSIVE_SUBJECTS[subjectId]
    setActiveSubjectId(subjectId)
    setActiveSystem(next.systems[0].id)
    setExplode(0)
    setIsolated(false)
    setSelectedPart(null)
    setSelectedSystemId(null)
    setSearch('')
    setExternalResults(null)
  }

  const selectLocalPart = (systemId, name, description, source) => {
    setActiveSystem(systemId)
    setSelectedSystemId(systemId)
    setSelectedPart({ name, description, source: source || null })
  }

  // External concept/piece catalogs (lazy): atlas.json for anatomy
  // (tools/human-atlas, 3,432 concepts), model-x-manifest.json for the
  // vehicle subject (tools/model-x-studio, 334 pieces).
  const runExternalSearch = async () => {
    const manifest = subject.conceptSearch || subject.pieceSearch
    if (!manifest || !search.trim()) return
    setExternalLoading(true)
    try {
      const res = await fetch(manifest.manifestUrl)
      if (!res.ok) throw new Error('catalog unavailable')
      const data = await res.json()
      const q = search.toLowerCase().trim()
      let hits = []
      if (subject.conceptSearch) {
        hits = (data.concepts || [])
          .filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
          .slice(0, 12)
          .map((c) => ({ id: c.id, name: c.name, detail: `${c.elements.length} atlas pieces` }))
      } else {
        hits = (data.objects || [])
          .filter((o) => (o.label || '').toLowerCase().includes(q) || (o.part || '').toLowerCase().includes(q))
          .slice(0, 12)
          .map((o) => ({ id: o.id, name: o.label, detail: `Part group: ${o.part}` }))
      }
      setExternalResults(hits)
    } catch {
      setExternalResults([])
    } finally {
      setExternalLoading(false)
    }
  }

  const applyExternalHit = (hit) => {
    // Jump to the matching in-scene part when one exists.
    const q = hit.name.toLowerCase()
    const local = searchLocalParts(subject, hit.name.split(' ')[0]).find((p) => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(q.split(' ')[0]))
    if (local) {
      const full = (subject.parts[local.systemId] || []).find((p) => p[0] === local.name)
      selectLocalPart(local.systemId, local.name, local.description, full && full[4])
    } else {
      setSelectedPart({ name: hit.name, description: `${hit.detail}. Explore the in-scene systems above for the closest structure.` })
    }
  }

  const reset = () => {
    setExplode(0)
    setIsolated(false)
    setSelectedPart(null)
    setSelectedSystemId(null)
    const current = sceneRef.current
    if (current) {
      current.camera.position.set(5.4, 2.4, 7.8)
      current.controls.target.set(0, 1.25, 0)
      current.controls.update()
    }
  }

  const localHits = searchLocalParts(subject, search)
  const activeCount = (subject.parts[activeSystem] || []).length
  const enriched = meta[activeSubjectId]
  const tutorLabel = enriched?.tutor?.name || { anatomy: 'Dr. Alistair Vance', plants: 'Dr. Alistair Vance', engineering: 'Dr. Marcus Ward', vehicle: 'Dr. Marcus Ward', earth: 'Prof. Julian Thorne' }[activeSubjectId]
  const trackLabel = enriched?.track?.title || { anatomy: 'Eukaryotic Cell Architecture & DNA Genomics', plants: 'Eukaryotic Cell Architecture & DNA Genomics', engineering: "Wave Optics, Snell's Law & Prismatic Dispersion", vehicle: "Wave Optics, Snell's Law & Prismatic Dispersion", earth: 'Keplerian Gravitation & N-Body Orbital Mechanics' }[activeSubjectId]

  return (
    <main className="kev-section" style={{ background: '#07111f', color: '#f8fafc', minHeight: 'calc(100vh - 80px)' }}>
      <section className="kev-section" aria-label="KEV immersive learning lab" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#f0b35b', letterSpacing: '0.12em', fontSize: '0.78rem', fontWeight: 700 }}>{t('viewer.eyebrow')}</p>
            <h1 className="kev-section-title" style={{ color: '#f8fafc', marginBottom: '0.45rem' }}>{t(`subjects.${activeSubjectId}.label`, subject.label)}</h1>
            <p className="kev-section-copy" style={{ color: '#b9c8d9', maxWidth: 680, margin: 0 }}>{t(`subjects.${activeSubjectId}.description`, subject.description)}</p>
            <p style={{ color: '#8fa3b8', fontSize: '0.82rem', margin: '0.5rem 0 0' }}>
              {t('viewer.guidedBy', { tutor: tutorLabel, track: trackLabel, floor: subject.floor })}{' '}
              <a href="/xr-academy" style={{ color: '#f0b35b' }}>{t('viewer.openFullXrLab')}</a>
              {' '} &middot; <a href="/agents" style={{ color: '#f0b35b' }}>{t('viewer.allTutors')}</a>
            </p>
            {enriched?.levelGuidance && (
              <p style={{ color: '#d8b565', fontSize: '0.82rem', margin: '0.4rem 0 0' }}>
                {t('viewer.studyingAt', { level: t(`studyLevels.${studyLevel}.label`, studyLevel), focus: t(`studyLevels.${studyLevel}.focus`, '') })}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={studyLevel}
              onChange={(e) => {
                setStudyLevel(e.target.value)
                setStudyLevelId(e.target.value)
              }}
              title="Study level - subjects and tutors adapt to this grade"
              style={{ background: '#0d2136', border: '1px solid #23415e', borderRadius: 6, color: '#f0b35b', padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
            >
              {STUDY_LEVEL_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <button className="kev-btn" onClick={() => setIsolated((v) => { if (!selectedPart && !v) return v; return !v })} disabled={!selectedPart} title={selectedPart ? t('viewer.isolateHint') : t('viewer.isolateNeedsSelection')}>
              {isolated ? t('viewer.showAll') : t('viewer.isolate')}
            </button>
            <button className="kev-btn" onClick={reset}>{t('viewer.resetView')}</button>
          </div>
        </div>

        <div className="immersive-subjects" role="tablist" aria-label="Learning subjects">
          {IMMERSIVE_SUBJECT_ORDER.map((id) => {
            const item = IMMERSIVE_SUBJECTS[id]
            return (
              <button key={id} className="kev-btn" role="tab" aria-selected={activeSubjectId === id} onClick={() => selectSubject(id)} style={{ color: activeSubjectId === id ? '#f0b35b' : undefined }}>
                {t(`subjects.${id}.label`, item.label)}
              </button>
            )
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            runExternalSearch()
          }}
          style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
        >
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setExternalResults(null)
            }}
            placeholder={(subject.conceptSearch || subject.pieceSearch)?.placeholder || t('viewer.searchStructures', { label: t(`subjects.${activeSubjectId}.label`, subject.label), terms: subject.keyTerms.slice(0, 3).join(', ') })}
            aria-label={t('viewer.searchStructures', { label: t(`subjects.${activeSubjectId}.label`, subject.label), terms: '' })}
            style={{ flex: 1, background: '#0d2136', border: '1px solid #23415e', borderRadius: 6, color: '#f8fafc', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
          />
          {((subject.conceptSearch || subject.pieceSearch) && (
            <button className="kev-btn" type="submit" disabled={externalLoading || !search.trim()}>
              {externalLoading ? t('viewer.searching') : t('viewer.deepSearch')}
            </button>
          )) || null}
        </form>

        {(localHits.length > 0 || externalResults) && (
          <div style={{ marginTop: '0.6rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 8, padding: '0.75rem', display: 'grid', gap: '0.4rem' }} aria-live="polite">
            {localHits.map((hit) => (
              <button key={`${hit.systemId}:${hit.name}`} className="kev-btn" onClick={() => { const full = (subject.parts[hit.systemId] || []).find((p) => p[0] === hit.name); selectLocalPart(hit.systemId, hit.name, hit.description, full && full[4]) }} style={{ textAlign: 'left' }}>
                {hit.name} <span style={{ color: '#8fa3b8' }}>&middot; {hit.systemId}</span>
              </button>
            ))}
            {externalResults && externalResults.length === 0 && localHits.length === 0 && (
              <p style={{ color: '#b9c8d9', fontSize: '0.85rem', margin: 0 }}>{t('viewer.noMatches')}</p>
            )}
            {externalResults && externalResults.map((hit) => (
              <button key={hit.id} className="kev-btn" onClick={() => applyExternalHit(hit)} style={{ textAlign: 'left', borderColor: '#f0b35b' }}>
                {hit.name} <span style={{ color: '#f0b35b' }}>&middot; {hit.detail}</span>
              </button>
            ))}
          </div>
        )}

        <div className="immersive-lab-grid" style={{ marginTop: '1rem' }}>
          <div ref={mountRef} role="img" aria-label={`Interactive 3D ${t(`subjects.${activeSubjectId}.label`, subject.label)} model`} style={{ minHeight: 560, border: '1px solid #23415e', borderRadius: 8, overflow: 'hidden', touchAction: 'none' }}>
            {!webglReady && <p style={{ padding: '2rem', color: '#fbbf24' }}>{t('viewer.webglError')}</p>}
          </div>
          <aside style={{ display: 'grid', alignContent: 'start', gap: '1rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 8, padding: '1rem' }}>
            <div>
              <p style={{ color: '#f0b35b', fontSize: '0.72rem', letterSpacing: '0.1em', margin: 0 }}>{subject.eyebrow}</p>
              <h2 style={{ fontSize: '1rem', margin: '0.35rem 0 0' }}>{t('viewer.systems')}</h2>
              <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.75rem', maxHeight: 300, overflowY: 'auto' }}>
                {subject.systems.map((system) => (
                  <button key={system.id} className="kev-btn" onClick={() => { setActiveSystem(system.id); setSelectedPart(null); setSelectedSystemId(null) }} style={{ textAlign: 'left', borderColor: activeSystem === system.id ? system.color : undefined, color: activeSystem === system.id ? system.color : undefined }}>
                    {t(`systems.${system.id}`, system.label)}
                  </button>
                ))}
              </div>
            </div>
            <label htmlFor="explode-subject" style={{ display: 'grid', gap: '0.55rem' }}>
              <span style={{ fontWeight: 700 }}>{t('viewer.explodeModel')} <strong>{explode}%</strong> <span style={{ color: '#8fa3b8', fontWeight: 400 }}>&middot; {t('viewer.pieces', { count: activeCount })}</span></span>
              <input id="explode-subject" type="range" min="0" max="100" value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
            </label>
            <div aria-live="polite" style={{ borderTop: '1px solid #23415e', paddingTop: '1rem', display: 'grid', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>{selectedPart?.name || t('viewer.selectStructure')}</h2>
              <p style={{ color: '#b9c8d9', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>{selectedPart?.description || t('viewer.tapHint')}</p>
              {selectedPart?.source && (
                <a href={selectedPart.source} target="_blank" rel="noopener noreferrer" style={{ color: '#f0b35b', fontSize: '0.85rem' }}>
                  {t('viewer.openReference')}
                </a>
              )}
              {selectedPart && (
                <a href="/xr-academy" style={{ color: '#f0b35b', fontSize: '0.85rem' }}>
                  {t('viewer.practiceInLab', { lab: subject.labId === 'biology' ? 'Biology' : subject.labId === 'astrophysics' ? 'Astrophysics' : subject.labId === 'chemistry' ? 'Chemistry' : 'Optics', floor: subject.floor })}
                </a>
              )}
            </div>
            {selectedPart && (
              <TutorAskPanel
                key={`${activeSubjectId}:${selectedPart.name}:${studyLevel}`}
                tutorName={tutorLabel}
                subjectLabel={subject.label}
                partName={selectedPart.name}
                simulationState={{ system: selectedSystemId, explode, labId: subject.labId, floor: subject.floor }}
                studentLevel={studyLevel}
              />
            )}
          </aside>
        </div>
        {subject.attribution && (
          <p style={{ color: '#8fa3b8', fontSize: '0.78rem', marginTop: '1rem' }}>{subject.attribution}</p>
        )}
      </section>
    </main>
  )
}
