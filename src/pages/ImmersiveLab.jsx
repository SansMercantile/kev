import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IMMERSIVE_SUBJECTS, IMMERSIVE_SUBJECT_ORDER } from '../lib/immersiveSubjects'
import { xrClient } from '../lib/xrClient'
import { getStudyLevelId, setStudyLevelId, STUDY_LEVEL_OPTIONS } from '../xr/lib/studyLevel'
import { setCurrentSubjectId } from '../xr/lib/currentSubject'
import { getTierId, setTierId, SCIENCE_TIERS } from '../xr/lib/studyTier'
import { anatomyExplanation } from '../lib/anatomySystems'
import StudyKitModal from '../xr/components/programs/StudyKitModal'
import SketchBench from '../xr/components/programs/SketchBench'
import TutorAskPanel from '../components/TutorAskPanel'
import { VehicleViewer } from '../lib/studio/vehicleScene'
import { SubjectViewer } from '../lib/studio/subjectScenes'
import { useAtlasViewer, ATLAS_DEFAULT_VISIBLE } from '../lib/studio/useAtlasViewer'
import '../styles/studio-viewer.css'

// Subjects with a compiled study-kit pack (tools/challenge-packs seeds):
// Human Atlas (BodyParts3D, CC BY 4.0), Electric Vehicle Systems
// (Model X Studio) and the plants / bridge / earth systems benches.
const STUDY_KIT_SUBJECTS = ['anatomy', 'vehicle', 'plants', 'engineering', 'earth']

// KEV's five vehicle systems map onto the eight Model X component groups
// (the grouping the imported 334-piece model and the tool use).
const VEHICLE_SYSTEM_GROUPS = {
  exterior: ['body', 'glass', 'doors'],
  interior: ['cabin'],
  energy: ['battery'],
  powertrain: ['drive'],
  chassis: ['suspension', 'wheels'],
}
const VEHICLE_SYSTEM_PRIMARY = { exterior: 'body', interior: 'cabin', energy: 'battery', powertrain: 'drive', chassis: 'wheels' }
const VEHICLE_PART_LABELS = [
  { id: 'body', name: 'Body & structure' },
  { id: 'glass', name: 'Panoramic glass' },
  { id: 'doors', name: 'Falcon wing doors' },
  { id: 'cabin', name: 'Passenger cabin' },
  { id: 'battery', name: 'High-voltage battery' },
  { id: 'drive', name: 'Drive units' },
  { id: 'suspension', name: 'Suspension' },
  { id: 'wheels', name: 'Wheels & brakes' },
]
const ANATOMY_VIEWS = [
  { id: 'three-quarter', label: '¾', title: 'Three-quarter view' },
  { id: 'front', label: 'F', title: 'Front view' },
  { id: 'side', label: 'S', title: 'Side view' },
  { id: 'back', label: 'B', title: 'Back view' },
]

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
  const [scienceTier, setScienceTier] = useState(() => getTierId())
  const [studyKitOpen, setStudyKitOpen] = useState(false)
  const [sketchOpen, setSketchOpen] = useState(false)
  // Studio-viewer state (quality pass): per-engine toggles and overlays.
  const [anatomyVisible, setAnatomyVisible] = useState(ATLAS_DEFAULT_VISIBLE)
  const [anatomyView, setAnatomyView] = useState('three-quarter')
  const [labelsOn, setLabelsOn] = useState(true)
  const [rotateOn, setRotateOn] = useState(false)
  const [vehicleReady, setVehicleReady] = useState(false)
  const [vehiclePiece, setVehiclePiece] = useState('')
  const [sceneError, setSceneError] = useState(null)
  // Live subject id for the lab-load listener, which mounts once (the same
  // ref pattern as before - the closure must not go stale).
  const subjectRef = useRef(activeSubjectId)
  const selectedRef = useRef(selectedPart)
  const [meta, setMeta] = useState({})
  const [webglReady, setWebglReady] = useState(true)
  const subject = IMMERSIVE_SUBJECTS[activeSubjectId]

  useEffect(() => { subjectRef.current = activeSubjectId }, [activeSubjectId])
  useEffect(() => { selectedRef.current = selectedPart }, [selectedPart])

  // ---------------------------------------------------------------- anatomy
  // Full BodyParts3D atlas engine (2,234 streamed meshes) with an automatic
  // fallback to the representative box catalog when streaming fails.
  const handleAtlasSelect = useCallback((sel) => {
    setSelectedSystemId(sel.systemId)
    setActiveSystem(sel.systemId)
    setSelectedPart(sel)
    setIsolated(false)
  }, [])
  const atlas = useAtlasViewer(mountRef, {
    enabled: activeSubjectId === 'anatomy' && webglReady,
    theme: 'light',
    onSelectPart: handleAtlasSelect,
  })

  // Sync React state into whichever anatomy engine is live.
  useEffect(() => {
    if (activeSubjectId !== 'anatomy') return
    atlas.setState({
      explode,
      visible: anatomyVisible,
      activeSystem,
      selected: selectedPart?.partId ? [selectedPart.partId] : [],
      selectedName: selectedPart?.name ?? null,
      isolate: isolated && Boolean(selectedPart),
      view: anatomyView,
      rotate: rotateOn,
      inspectorOpen: Boolean(selectedPart),
    })
  }, [activeSubjectId, explode, anatomyVisible, activeSystem, selectedPart, isolated, anatomyView, rotateOn, atlas.fallback]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- vehicle
  const vehicleRef = useRef(null)
  useEffect(() => {
    if (activeSubjectId !== 'vehicle' || !webglReady) return undefined
    const host = mountRef.current
    if (!host) return undefined
    setVehicleReady(false)
    setSceneError(null)
    let viewer = null
    try {
      viewer = new VehicleViewer(host, {
        partLabels: VEHICLE_PART_LABELS,
        onReady: () => setVehicleReady(true),
        onError: (m) => setSceneError(m),
        onSelect: (partId) => {
          // Map the tool's 8 component groups back onto KEV's part catalog.
          const sysId = Object.keys(VEHICLE_SYSTEM_GROUPS).find((k) => VEHICLE_SYSTEM_GROUPS[k].includes(partId))
          const entry = sysId && (subject.parts[sysId] || []).find((p) => p[5] === partId)
          setSelectedSystemId(sysId || null)
          if (sysId) setActiveSystem(sysId)
          setSelectedPart(
            entry
              ? { name: entry[0], description: entry[3], source: entry[4] || null, piece: entry[5] }
              : { name: (VEHICLE_PART_LABELS.find((l) => l.id === partId) || {}).name || partId, description: '', source: null, piece: partId }
          )
        },
        onInspect: (pieceId) => setVehiclePiece(pieceId || ''),
      })
      vehicleRef.current = viewer
    } catch {
      setWebglReady(false)
    }
    return () => {
      vehicleRef.current = null
      if (viewer && viewer.dispose) viewer.dispose()
    }
  }, [activeSubjectId, webglReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = vehicleRef.current
    if (activeSubjectId !== 'vehicle' || !v) return
    v.setState({
      selected: selectedPart?.piece || VEHICLE_SYSTEM_PRIMARY[activeSystem] || 'body',
      focusedMesh: vehiclePiece,
      explode,
      labels: labelsOn,
      autoRotate: rotateOn,
      isolated: isolated && Boolean(selectedPart),
    })
  }, [activeSubjectId, selectedPart, vehiclePiece, explode, labelsOn, rotateOn, isolated, activeSystem, vehicleReady])

  // ------------------------------------------------------- procedural subjects
  const subjectViewerRef = useRef(null)
  useEffect(() => {
    if (['anatomy', 'vehicle'].includes(activeSubjectId) || !webglReady) return undefined
    const host = mountRef.current
    if (!host) return undefined
    setSceneError(null)
    let viewer = null
    try {
      viewer = new SubjectViewer(host, activeSubjectId, subject, {
        onError: (m) => setSceneError(m),
        onSelect: (systemId, userData) => {
          setSelectedSystemId(systemId)
          setActiveSystem(systemId)
          setSelectedPart({ name: userData.name, description: userData.description, source: userData.source || null })
        },
      })
      subjectViewerRef.current = viewer
    } catch {
      setWebglReady(false)
    }
    return () => {
      subjectViewerRef.current = null
      if (viewer && viewer.dispose) viewer.dispose()
    }
  }, [activeSubjectId, webglReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = subjectViewerRef.current
    if (!v || ['anatomy', 'vehicle'].includes(activeSubjectId)) return
    v.setState({
      activeSystem,
      explode,
      isolated: isolated && Boolean(selectedPart),
      selectedName: selectedPart?.name ?? null,
      labels: labelsOn,
      autoRotate: rotateOn,
      inspectorOpen: Boolean(selectedPart),
    })
  }, [activeSubjectId, activeSystem, explode, isolated, selectedPart, labelsOn, rotateOn])

  // ---------------------------------------------------------------- crosswalk
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

  // ------------------------------------------------------------------ actions
  const selectSubject = (subjectId) => {
    const next = IMMERSIVE_SUBJECTS[subjectId]
    setActiveSubjectId(subjectId)
    // Share the class with the rest of the school so the whole building
    // teaches the subject the student is dissecting. Pass the subject id (not
    // the labId) so the auditorium's per-class deck matches exactly; surfaces
    // that need the physical lab read subject.labId from the catalog.
    setCurrentSubjectId(subjectId)
    setActiveSystem(next.systems[0].id)
    setExplode(0)
    setIsolated(false)
    setSelectedPart(null)
    setSelectedSystemId(null)
    setSearch('')
    setExternalResults(null)
    setSceneError(null)
    setVehiclePiece('')
    if (subjectId === 'anatomy') {
      setAnatomyVisible(ATLAS_DEFAULT_VISIBLE)
      setAnatomyView('three-quarter')
    }
  }

  const selectLocalPart = (systemId, name, description, source, piece) => {
    setActiveSystem(systemId)
    setSelectedSystemId(systemId)
    setSelectedPart({ name, description, source: source || null, piece })
    if (piece) setVehiclePiece(piece)
  }

  const clickSystem = (systemId) => {
    setActiveSystem(systemId)
    setSelectedPart(null)
    setSelectedSystemId(null)
    if (activeSubjectId === 'anatomy') {
      setAnatomyVisible([systemId])
    } else if (activeSubjectId === 'vehicle') {
      // Component groups highlight in-scene; the part list below drills in.
      setVehiclePiece('')
    }
  }

  // Smart Lab Sketch-to-Simulation (M3 second wave): body-outline and
  // vehicle-profile sketches dispatch 'kev:lab-load'. XRAcademyApp stashes the
  // action in sessionStorage before navigating here, because the window event
  // fires before this page exists - so consume the stash on mount as well.
  const applyLabLoad = (detail) => {
    if (!detail || (detail.lab !== 'anatomy' && detail.lab !== 'vehicle')) return
    if (detail.lab !== subjectRef.current) selectSubject(detail.lab)
    if (detail.lab === 'anatomy') {
      const anatomySubject = IMMERSIVE_SUBJECTS.anatomy
      if (detail.systemId && anatomySubject.systems.some((s) => s.id === detail.systemId)) {
        setActiveSystem(detail.systemId)
        setAnatomyVisible([detail.systemId])
        setSelectedPart(null)
        setSelectedSystemId(null)
      }
    } else if (typeof detail.explode === 'number') {
      setExplode(Math.max(0, Math.min(100, detail.explode)))
    }
  }

  useEffect(() => {
    const onLabLoad = (event) => applyLabLoad(event.detail)
    window.addEventListener('kev:lab-load', onLabLoad)
    let pending = null
    try {
      pending = sessionStorage.getItem('kev:immersive-lab-load')
      if (pending) sessionStorage.removeItem('kev:immersive-lab-load')
    } catch { /* private browsing: no stash, live events still work */ }
    if (pending) {
      try { applyLabLoad(JSON.parse(pending)) } catch { /* malformed stash */ }
    }
    return () => window.removeEventListener('kev:lab-load', onLabLoad)
    // Mounts once: applyLabLoad only touches stable setters and refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // External concept/piece catalogs: the loaded atlas (3,432 concepts +
  // 2,234 parts) is searched in memory for anatomy; the vehicle manifest
  // (334 pieces) is fetched lazily on first search.
  const runExternalSearch = async () => {
    const manifest = subject.conceptSearch || subject.pieceSearch
    if (!manifest || !search.trim()) return
    const q = search.toLowerCase().trim()
    if (subject.conceptSearch && atlas.atlas) {
      const data = atlas.atlas
      const conceptHits = (data.concepts || [])
        .filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
        .slice(0, 8)
        .map((c) => ({ id: c.id, name: c.name, detail: `${c.elements.length} atlas pieces`, elements: c.elements }))
      setExternalResults(conceptHits)
      return
    }
    setExternalLoading(true)
    try {
      const res = await fetch(manifest.manifestUrl)
      if (!res.ok) throw new Error('catalog unavailable')
      const data = await res.json()
      let hits = []
      if (subject.conceptSearch) {
        hits = (data.concepts || [])
          .filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
          .slice(0, 12)
          .map((c) => ({ id: c.id, name: c.name, detail: `${c.elements.length} atlas pieces`, elements: c.elements }))
      } else {
        hits = (data.objects || [])
          .filter((o) => (o.label || '').toLowerCase().includes(q) || (o.part || '').toLowerCase().includes(q))
          .slice(0, 12)
          .map((o) => ({ id: o.id, name: o.label, detail: `Part group: ${o.part}`, piece: o.id, part: o.part }))
      }
      setExternalResults(hits)
    } catch {
      setExternalResults([])
    } finally {
      setExternalLoading(false)
    }
  }

  const applyExternalHit = (hit) => {
    if (hit.elements && hit.elements.length) {
      // Anatomy concept: select its atlas pieces and frame them.
      const firstId = hit.elements[0]
      const p = atlas.atlas && atlas.atlas.parts.find((x) => x.id === firstId)
      atlas.setState({ selected: hit.elements, isolate: false, rotate: false })
      if (p) {
        setActiveSystem(p.system)
        setSelectedSystemId(p.system)
        setSelectedPart({ name: hit.name, description: anatomyExplanation(p.name, p.system), systemId: p.system, partId: firstId, source: null, multi: hit.elements.length })
      } else {
        setSelectedPart({ name: hit.name, description: `${hit.detail}. Explore the in-scene systems for the closest structures.`, source: null })
      }
      return
    }
    if (hit.piece) {
      // Vehicle manifest piece: focus + isolate the individual mesh.
      const sysId = Object.keys(VEHICLE_SYSTEM_GROUPS).find((k) => VEHICLE_SYSTEM_GROUPS[k].includes(hit.part))
      setVehiclePiece(hit.piece)
      if (sysId) setActiveSystem(sysId)
      setSelectedPart({ name: hit.name, description: `Individual modeled piece (${hit.detail}). Isolate it to study the geometry up close.`, source: null, piece: hit.piece })
      setIsolated(true)
      return
    }
    // Last resort: jump to the matching in-scene part when one exists.
    const local = searchLocalParts(subject, hit.name.split(' ')[0]).find((p) => hit.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(hit.name.toLowerCase().split(' ')[0]))
    if (local) {
      const full = (subject.parts[local.systemId] || []).find((p) => p[0] === local.name)
      selectLocalPart(local.systemId, local.name, local.description, full && full[4], full && full[5])
    } else {
      setSelectedPart({ name: hit.name, description: `${hit.detail}. Explore the in-scene systems above for the closest structure.` })
    }
  }

  const reset = () => {
    setExplode(0)
    setIsolated(false)
    setSelectedPart(null)
    setSelectedSystemId(null)
    setVehiclePiece('')
    setRotateOn(false)
    if (activeSubjectId === 'anatomy') {
      setAnatomyVisible(ATLAS_DEFAULT_VISIBLE)
      setAnatomyView('three-quarter')
      atlas.setState({ reset: Date.now() })
      atlas.reset()
    } else if (vehicleRef.current) {
      vehicleRef.current.reset()
    } else if (subjectViewerRef.current) {
      subjectViewerRef.current.reset()
    }
  }

  // Anatomy-aware local search: real atlas part names when loaded.
  const localHits = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return []
    if (activeSubjectId === 'anatomy' && atlas.atlas && !atlas.fallback) {
      return atlas.atlas.parts
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 12)
        .map((p) => ({ systemId: p.system, name: p.name, description: anatomyExplanation(p.name, p.system), partId: p.id }))
    }
    return searchLocalParts(subject, search)
  }, [search, activeSubjectId, atlas.atlas, atlas.fallback, subject])

  const activeCount = activeSubjectId === 'anatomy' && atlas.atlas
    ? atlas.atlas.parts.filter((p) => p.system === activeSystem).length
    : (subject.parts[activeSystem] || []).length
  const enriched = meta[activeSubjectId]
  const tutorLabel = enriched?.tutor?.name || { anatomy: 'Dr. Alistair Vance', plants: 'Dr. Alistair Vance', engineering: 'Dr. Marcus Ward', vehicle: 'Dr. Marcus Ward', earth: 'Prof. Julian Thorne' }[activeSubjectId]
  const trackLabel = enriched?.track?.title || { anatomy: 'Eukaryotic Cell Architecture & DNA Genomics', plants: 'Eukaryotic Cell Architecture & DNA Genomics', engineering: "Wave Optics, Snell's Law & Prismatic Dispersion", vehicle: "Wave Optics, Snell's Law & Prismatic Dispersion", earth: 'Keplerian Gravitation & N-Body Orbital Mechanics' }[activeSubjectId]

  const showLabelsToggle = activeSubjectId !== 'anatomy'
  const loadingAtlas = activeSubjectId === 'anatomy' && !atlas.fallback && atlas.progress < 100 && !atlas.error
  const loadingVehicle = activeSubjectId === 'vehicle' && !vehicleReady && !sceneError

  // The whole studio reads in the atlas palette (code-for-code from
  // tools/human-atlas): light gallery surface, dark slate ink. Earth keeps its
  // deep-space scene, so its card stays dark for contrast.
  const spaceScene = activeSubjectId === 'earth'
  const ink = spaceScene ? '#f8fafc' : '#20242b'
  const subInk = spaceScene ? '#9db2c8' : '#68727d'
  const faintInk = spaceScene ? '#7b8ea3' : '#8a949e'
  const accent = '#263b48'

  // Subjects grouped by discipline for the tab rail (the atlas groups its 15
  // systems; the page groups its 13 worlds the same way, not 17 flat buttons).
  const SUBJECT_GROUPS = [
    { id: 'core', label: 'Core Worlds', subjects: ['anatomy', 'vehicle', 'plants', 'engineering', 'earth'] },
    { id: 'life', label: 'Life Sciences', subjects: ['cell', 'frog', 'bee', 'worm'] },
    { id: 'build', label: 'Built World', subjects: ['giza', 'locomotive', 'rocket', 'violin'] },
  ]

  const chip = (active) => ({
    background: active ? accent : 'rgba(255,255,255,0.6)',
    color: active ? '#f3f4f4' : ink,
    border: `1px solid ${active ? accent : 'rgba(24,37,54,0.16)'}`,
    borderRadius: 999,
    padding: '0.42rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background .15s ease, color .15s ease, border-color .15s ease',
  })
  const ghostBtn = (active) => ({
    background: active ? 'rgba(38,59,72,0.10)' : 'rgba(255,255,255,0.6)',
    color: active ? accent : ink,
    border: `1px solid ${active ? accent : 'rgba(24,37,54,0.14)'}`,
    borderRadius: 8,
    padding: '0.45rem 0.7rem',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'background .15s ease, color .15s ease, border-color .15s ease',
  })
  const toolBtn = (disabled) => ({
    background: 'rgba(255,255,255,0.6)',
    color: disabled ? faintInk : ink,
    border: '1px solid rgba(24,37,54,0.14)',
    borderRadius: 8,
    padding: '0.45rem 0.7rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  })
  const panelBg = spaceScene ? '#0d2136' : '#ffffff'
  const panelBorder = spaceScene ? '1px solid rgba(120,150,185,0.28)' : '1px solid rgba(24,37,54,0.12)'

  return (
    <main style={{ background: '#f3f4f4', color: ink, minHeight: 'calc(100vh - 76px)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '1.25rem 20px 3rem' }}>
        {/* Studio header: eyebrow + title + one line of guidance. */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', paddingBottom: '0.9rem', borderBottom: '1px solid rgba(24,37,54,0.12)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#737d89', letterSpacing: '0.16em', fontSize: '0.7rem', fontWeight: 600, margin: 0 }}>{subject.eyebrow} · KEV ATLAS</p>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", color: ink, margin: '0.3rem 0 0.3rem', fontSize: '1.7rem', lineHeight: 1.15 }}>{t(`subjects.${activeSubjectId}.label`, subject.label)}</h1>
            <p style={{ color: subInk, maxWidth: 640, margin: 0, fontSize: '0.9rem' }}>{t(`subjects.${activeSubjectId}.description`, subject.description)}</p>
            <p style={{ color: faintInk, fontSize: '0.78rem', margin: '0.45rem 0 0' }}>
              {t('viewer.guidedBy', { tutor: tutorLabel, track: trackLabel, floor: subject.floor })}{' '}
              <a href="/xr-academy" style={{ color: accent }}>{t('viewer.openFullXrLab')}</a>
              {' '}· <a href="/agents" style={{ color: accent }}>{t('viewer.allTutors')}</a>
            </p>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'end' }}>
            <select
              value={studyLevel}
              onChange={(e) => { setStudyLevel(e.target.value); setStudyLevelId(e.target.value) }}
              title="Study level - subjects and tutors adapt to this grade"
              style={{ background: '#ffffff', border: '1px solid rgba(24,37,54,0.16)', borderRadius: 8, color: accent, padding: '0.5rem 0.7rem', fontSize: '0.8rem' }}
            >
              {STUDY_LEVEL_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            {enriched?.levelGuidance && (
              <p style={{ color: accent, fontSize: '0.74rem', margin: 0, maxWidth: 260, textAlign: 'right' }}>
                {t('viewer.studyingAt', { level: t(`studyLevels.${studyLevel}.label`, studyLevel), focus: t(`studyLevels.${studyLevel}.focus`, '') })}
              </p>
            )}
          </div>
        </header>

        {/* Subject rail: grouped tabs, not a wall of buttons. */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.9rem', alignItems: 'flex-start' }}>
          {SUBJECT_GROUPS.map((group) => (
            <div key={group.id} style={{ display: 'grid', gap: '0.4rem' }}>
              <span style={{ color: faintInk, fontSize: '0.68rem', letterSpacing: '0.14em', fontWeight: 700 }}>{group.label.toUpperCase()}</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {group.subjects.map((id) => (
                  <button key={id} role="tab" aria-selected={activeSubjectId === id} onClick={() => selectSubject(id)} style={chip(activeSubjectId === id)}>
                    {t(`subjects.${id}.label`, IMMERSIVE_SUBJECTS[id].label)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* The bench: model + inspector, one framed studio. */}
        <div className="immersive-lab-grid" style={{ marginTop: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '0.6rem', alignContent: 'start' }}>
            {/* Toolbar: a single restrained row of view tools. */}
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', background: panelBg, border: panelBorder, borderRadius: 12, padding: '0.5rem 0.65rem' }}>
              <button style={toolBtn(!selectedPart)} disabled={!selectedPart} onClick={() => { if (!selectedPart) return; setIsolated((v) => !v); setExplode(0) }} title={selectedPart ? t('viewer.isolateHint') : t('viewer.isolateNeedsSelection')}>
                {isolated ? t('viewer.showAll') : t('viewer.isolate')}
              </button>
              <button style={ghostBtn(false)} onClick={reset}>{t('viewer.resetView')}</button>
              {showLabelsToggle && (
                <button style={ghostBtn(labelsOn)} onClick={() => setLabelsOn((v) => !v)} aria-pressed={labelsOn} title="Show numbered labels on the model">Labels</button>
              )}
              <button style={ghostBtn(rotateOn)} onClick={() => setRotateOn((v) => !v)} aria-pressed={rotateOn} title="Auto-rotate the model">
                {rotateOn ? 'Stop rotation' : 'Rotate'}
              </button>
              <button style={ghostBtn(sketchOpen)} onClick={() => setSketchOpen((v) => !v)} title="Sketch-to-Simulation: draw a body outline (torso + head) or a vehicle side profile (body + two wheels) and the bench follows">
                {sketchOpen ? 'Close sketch pad' : 'Sketch pad'}
              </button>
              {STUDY_KIT_SUBJECTS.includes(activeSubjectId) && (
                <>
                  <select
                    value={scienceTier}
                    onChange={(e) => { setScienceTier(e.target.value); setTierId(e.target.value) }}
                    title="Teaching tier - the study kit adapts to this"
                    aria-label="Science teaching tier"
                    style={{ background: '#ffffff', border: '1px solid rgba(24,37,54,0.16)', borderRadius: 8, color: ink, padding: '0.42rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    {SCIENCE_TIERS.map((tier) => (
                      <option key={tier.id} value={tier.id}>{tier.label}</option>
                    ))}
                  </select>
                  <button style={chip(true)} onClick={() => setStudyKitOpen(true)} title="One-click study kit: leveled summary, flashcards, printable PDF and quiz CSV">
                    Study Kit
                  </button>
                </>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); runExternalSearch() }}
                style={{ display: 'flex', gap: '0.45rem', marginLeft: 'auto', flex: '1 1 260px', minWidth: 220 }}
              >
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setExternalResults(null) }}
                  placeholder={(subject.conceptSearch || subject.pieceSearch)?.placeholder || t('viewer.searchStructures', { label: t(`subjects.${activeSubjectId}.label`, subject.label), terms: subject.keyTerms.slice(0, 3).join(', ') })}
                  aria-label={t('viewer.searchStructures', { label: t(`subjects.${activeSubjectId}.label`, subject.label), terms: '' })}
                  style={{ flex: 1, background: '#f7f9fa', border: '1px solid rgba(24,37,54,0.14)', borderRadius: 8, color: ink, padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                />
                {((subject.conceptSearch || subject.pieceSearch) && (
                  <button style={chip(Boolean(search.trim()))} type="submit" disabled={externalLoading || !search.trim()}>
                    {externalLoading ? t('viewer.searching') : t('viewer.deepSearch')}
                  </button>
                )) || null}
              </form>
            </div>

            {/* The model: the atlas is the hero. */}
            <div
              ref={mountRef}
              className="studio-host"
              role="img"
              aria-label={`Interactive 3D ${t(`subjects.${activeSubjectId}.label`, subject.label)} model`}
              style={{ minHeight: 600, border: '1px solid rgba(24,37,54,0.12)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', position: 'relative', boxShadow: '0 16px 48px rgba(36,51,68,0.08)' }}
            >
              {!webglReady && <p style={{ padding: '2rem', color: '#b45309' }}>{t('viewer.webglError')}</p>}
              {loadingAtlas && (
                <div className="studio-loading">
                  <span className="spinner" aria-hidden="true" />
                  <div className="bar"><i style={{ width: `${atlas.progress}%` }} /></div>
                  <span>Loading the full human atlas… {atlas.progress}%</span>
                  <span style={{ fontSize: '0.68rem', color: '#8fa3b8' }}>2,234 modeled structures · BodyParts3D 4.0 (CC BY 4.0)</span>
                </div>
              )}
              {loadingVehicle && (
                <div className="studio-loading">
                  <span className="spinner" aria-hidden="true" />
                  <span>Loading the detailed Model X…</span>
                  <span style={{ fontSize: '0.68rem', color: '#8fa3b8' }}>334 modeled pieces · Royalty Free asset, no downloads</span>
                </div>
              )}
              {sceneError && activeSubjectId !== 'anatomy' && (
                <div className="studio-error">
                  <strong>The 3D view needs a moment.</strong>
                  <span>{sceneError}</span>
                </div>
              )}
              {activeSubjectId === 'anatomy' && atlas.fallback && atlas.error && (
                <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, zIndex: 22, background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(24,37,54,0.16)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#8a6d1f' }}>
                  Streaming the full atlas failed ({atlas.error}) - showing the representative teaching model instead. All 15 systems and structures still work.
                </div>
              )}
            </div>

            {/* Search results, when present, sit under the model. */}
            {(localHits.length > 0 || externalResults) && (
              <div style={{ background: panelBg, border: panelBorder, borderRadius: 12, padding: '0.65rem', display: 'grid', gap: '0.35rem', maxHeight: 220, overflowY: 'auto' }} aria-live="polite">
                {localHits.map((hit) => (
                  <button
                    key={`${hit.systemId}:${hit.partId || hit.name}`}
                    style={ghostBtn(false)}
                    onClick={() => {
                      if (hit.partId && atlas.atlas) {
                        setActiveSystem(hit.systemId)
                        setSelectedSystemId(hit.systemId)
                        setSelectedPart({ name: hit.name, description: hit.description, systemId: hit.systemId, partId: hit.partId, source: null })
                      } else {
                        const full = (subject.parts[hit.systemId] || []).find((p) => p[0] === hit.name)
                        selectLocalPart(hit.systemId, hit.name, hit.description, full && full[4], full && full[5])
                      }
                    }}
                  >
                    {hit.name} <span style={{ color: faintInk }}>· {hit.systemId}</span>
                  </button>
                ))}
                {externalResults && externalResults.length === 0 && localHits.length === 0 && (
                  <p style={{ color: subInk, fontSize: '0.85rem', margin: 0 }}>{t('viewer.noMatches')}</p>
                )}
                {externalResults && externalResults.map((hit) => (
                  <button key={hit.id} style={ghostBtn(true)} onClick={() => applyExternalHit(hit)}>
                    {hit.name} <span style={{ color: accent }}>· {hit.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inspector: systems + explode + the selected structure. */}
          <aside style={{ display: 'grid', alignContent: 'start', gap: '0.9rem', background: panelBg, border: panelBorder, borderRadius: 12, padding: '0.95rem' }}>
            <div>
              <p style={{ color: '#737d89', fontSize: '0.68rem', letterSpacing: '0.14em', margin: 0, fontWeight: 600 }}>{subject.eyebrow}</p>
              <h2 style={{ fontSize: '0.95rem', margin: '0.3rem 0 0', fontFamily: "'Fraunces', Georgia, serif", color: ink }}>{t('viewer.systems')}</h2>
              {activeSubjectId === 'anatomy' && !atlas.fallback && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
                  <button style={ghostBtn(false)} onClick={() => setAnatomyVisible(ATLAS_DEFAULT_VISIBLE)}>All systems</button>
                  {ANATOMY_VIEWS.map((v) => (
                    <button key={v.id} style={ghostBtn(anatomyView === v.id)} title={v.title} onClick={() => setAnatomyView(v.id)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.65rem', maxHeight: 260, overflowY: 'auto' }}>
                {subject.systems.map((system) => (
                  <button key={system.id} style={{ ...ghostBtn(activeSystem === system.id), textAlign: 'left', borderLeft: `3px solid ${activeSystem === system.id ? system.color : 'transparent'}` }} onClick={() => clickSystem(system.id)}>
                    {t(`systems.${system.id}`, system.label)}
                    {activeSubjectId === 'anatomy' && atlas.atlas && (
                      <span style={{ float: 'right', color: faintInk, fontSize: '0.72rem' }}>
                        {atlas.atlas.parts.filter((p) => p.system === system.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {activeSubjectId === 'anatomy' && !atlas.fallback && (
                <p style={{ color: faintInk, fontSize: '0.7rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  Tap a system to show it alone; “All systems” restores the full body. Explode fans the systems apart, then packs all {atlas.atlas ? atlas.atlas.parts.length.toLocaleString() : '2,234'} structures into an inventory grid.
                </p>
              )}
            </div>
            <label htmlFor="explode-subject" style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: ink }}>{t('viewer.explodeModel')} <strong style={{ color: accent }}>{explode}%</strong> <span style={{ color: faintInk, fontWeight: 400 }}>· {t('viewer.pieces', { count: activeCount })}</span></span>
              <input id="explode-subject" type="range" min="0" max="100" value={explode} onChange={(event) => setExplode(Number(event.target.value))} style={{ accentColor: accent }} />
            </label>
            {activeSubjectId === 'vehicle' && (
              <div style={{ display: 'grid', gap: '0.3rem' }}>
                <p style={{ color: '#737d89', fontSize: '0.68rem', letterSpacing: '0.14em', margin: 0, fontWeight: 600 }}>STRUCTURES</p>
                {Object.entries(VEHICLE_SYSTEM_GROUPS).flatMap(([sysId]) =>
                  (subject.parts[sysId] || []).map((p) => (
                    <button key={p[0]} style={{ ...ghostBtn(selectedPart?.name === p[0]), textAlign: 'left', fontSize: '0.78rem' }} onClick={() => selectLocalPart(sysId, p[0], p[3], p[4], p[5])}>
                      {p[0]}
                    </button>
                  ))
                )}
              </div>
            )}
            <div aria-live="polite" style={{ borderTop: '1px solid rgba(24,37,54,0.12)', paddingTop: '0.9rem', display: 'grid', gap: '0.45rem' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, fontFamily: "'Fraunces', Georgia, serif", color: ink }}>{selectedPart?.name || t('viewer.selectStructure')}</h2>
              <p style={{ color: subInk, lineHeight: 1.55, fontSize: '0.88rem', margin: 0 }}>{selectedPart?.description || t('viewer.tapHint')}</p>
              {selectedPart?.multi > 1 && (
                <p style={{ color: faintInk, fontSize: '0.76rem', margin: 0 }}>{selectedPart.multi} modeled pieces selected - isolate to study them alone.</p>
              )}
              {selectedPart?.source && (
                <a href={selectedPart.source} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontSize: '0.82rem' }}>
                  {t('viewer.openReference')}
                </a>
              )}
              {selectedPart && (
                <a href="/xr-academy" style={{ color: accent, fontSize: '0.82rem' }}>
                  {t('viewer.practiceInLab', { lab: subject.labId === 'biology' ? 'Biology' : subject.labId === 'astrophysics' ? 'Astrophysics' : subject.labId === 'chemistry' ? 'Chemistry' : subject.labId === 'physics' ? 'Physics Playground' : 'Optics', floor: subject.floor })}
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
                tier={scienceTier}
              />
            )}
          </aside>
        </div>

        {subject.attribution && (
          <p style={{ color: faintInk, fontSize: '0.74rem', marginTop: '0.9rem' }}>{subject.attribution}</p>
        )}
        {activeSubjectId === 'vehicle' && (
          <p style={{ color: faintInk, fontSize: '0.7rem', marginTop: '0.35rem' }}>
            Pre-refresh Model X by cgi Moon (BlendKit, Royalty Free). The 334 mesh pieces are modeled geometry, not a
            complete Tesla parts catalog; battery, drive units and suspension are illustrative teaching geometry.
            Not affiliated with Tesla. Embedded for study - no downloads offered.
          </p>
        )}
      </div>
      {studyKitOpen && (
        <StudyKitModal
          labId={activeSubjectId}
          tier={scienceTier}
          onClose={() => setStudyKitOpen(false)}
        />
      )}

      {/* Sketch-to-Simulation on the immersive benches: recognised body
          outlines / vehicle profiles dispatch 'kev:lab-load', which the
          listener above applies (subject switch + system or explode). No
          onOpenLab needed here - the event does the routing in-page. */}
      {sketchOpen && (
        <SketchBench
          activeLab={activeSubjectId}
          onClose={() => setSketchOpen(false)}
        />
      )}
    </main>
  )
}
