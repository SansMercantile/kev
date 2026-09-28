import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ANATOMY_SYSTEMS, anatomyExplanation } from '../lib/anatomySystems'
import TutorAskPanel from '../components/TutorAskPanel'
import { useAtlasViewer, ATLAS_DEFAULT_VISIBLE } from '../lib/studio/useAtlasViewer'
import '../styles/studio-viewer.css'

const ANATOMY_VIEWS = [
  { id: 'three-quarter', label: '¾', title: 'Three-quarter view' },
  { id: 'front', label: 'F', title: 'Front view' },
  { id: 'side', label: 'S', title: 'Side view' },
  { id: 'back', label: 'B', title: 'Back view' },
]

/**
 * Human Atlas page - the full BodyParts3D 4.0 explorer (2,234 streamed
 * meshes, 15 systems) on the shared studio engine, with automatic fallback
 * to the representative teaching model when streaming fails. Adapted from
 * the human-atlas tool (MIT, (c) ashemag); anatomy data BodyParts3D 4.0,
 * CC BY 4.0 - see docs/ATTRIBUTION-human-atlas.md.
 */
export default function AnatomyLab() {
  const { t } = useTranslation()
  const mountRef = useRef(null)
  const [activeSystem, setActiveSystem] = useState('skeletal')
  const [explode, setExplode] = useState(0)
  const [isolated, setIsolated] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [visible, setVisible] = useState(ATLAS_DEFAULT_VISIBLE)
  const [view, setView] = useState('three-quarter')
  const [rotateOn, setRotateOn] = useState(false)
  const [search, setSearch] = useState('')

  const handleSelect = (sel) => {
    setActiveSystem(sel.systemId)
    setSelectedPart(sel)
    setIsolated(false)
  }
  const atlas = useAtlasViewer(mountRef, { theme: 'light', onSelectPart: handleSelect })

  useEffect(() => {
    atlas.setState({
      explode,
      visible,
      activeSystem,
      selected: selectedPart?.partId ? [selectedPart.partId] : [],
      selectedName: selectedPart?.name ?? null,
      isolate: isolated && Boolean(selectedPart),
      view,
      rotate: rotateOn,
      inspectorOpen: Boolean(selectedPart),
    })
  }, [explode, visible, activeSystem, selectedPart, isolated, view, rotateOn, atlas.fallback]) // eslint-disable-line react-hooks/exhaustive-deps

  const searchHits = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return []
    if (atlas.atlas && !atlas.fallback) {
      return atlas.atlas.parts
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 12)
        .map((p) => ({ systemId: p.system, name: p.name, description: anatomyExplanation(p.name, p.system), partId: p.id }))
    }
    // Fallback catalog search (representative teaching model).
    return []
  }, [search, atlas.atlas, atlas.fallback])

  const activeSystemMeta = ANATOMY_SYSTEMS.find((s) => s.id === activeSystem)
  const activeCount = atlas.atlas
    ? atlas.atlas.parts.filter((p) => p.system === activeSystem).length
    : 0

  const reset = () => {
    setExplode(0)
    setIsolated(false)
    setSelectedPart(null)
    setVisible(ATLAS_DEFAULT_VISIBLE)
    setView('three-quarter')
    setRotateOn(false)
    atlas.reset()
  }

  return (
    <main className="kev-section" style={{ background: '#07111f', color: '#f8fafc', minHeight: 'calc(100vh - 80px)' }}>
      <section className="kev-section" aria-label="Human anatomy lab" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#f0b35b', letterSpacing: '0.12em', fontSize: '0.78rem', fontWeight: 700 }}>{t('viewer.eyebrow')}</p>
            <h1 className="kev-section-title" style={{ color: '#f8fafc', marginBottom: '0.45rem' }}>{t('viewer.atlasTitle')}</h1>
            <p className="kev-section-copy" style={{ color: '#b9c8d9', maxWidth: 680, margin: 0 }}>
              {atlas.atlas
                ? `${atlas.atlas.parts.length.toLocaleString()} modeled structures · ${ANATOMY_SYSTEMS.length} systems · BodyParts3D 4.0`
                : t('viewer.atlasSubtitle', { count: ANATOMY_SYSTEMS.length })}
            </p>
            <p style={{ color: '#8fa3b8', fontSize: '0.82rem', margin: '0.5rem 0 0' }}>
              {t('viewer.atlasGuidedBy')}{' '}
              <a href="/xr-academy" style={{ color: '#f0b35b' }}>{t('viewer.openFullXrLab')}</a>
              {' '} &middot; <a href="/agents" style={{ color: '#f0b35b' }}>{t('viewer.allTutors')}</a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ANATOMY_VIEWS.map((v) => (
              <button
                key={v.id}
                className="kev-btn"
                title={v.title}
                onClick={() => setView(v.id)}
                style={{ borderColor: view === v.id ? '#f0b35b' : undefined, color: view === v.id ? '#f0b35b' : undefined }}
              >
                {v.label}
              </button>
            ))}
            <button className="kev-btn" onClick={() => setRotateOn((r) => !r)} aria-pressed={rotateOn} title="Auto-rotate the body">
              {rotateOn ? 'Stop rotation' : 'Rotate'}
            </button>
            <button className="kev-btn" onClick={() => { if (!selectedPart) return; setIsolated((v) => !v); setExplode(0) }} disabled={!selectedPart} title={selectedPart ? t('viewer.isolateHint') : t('viewer.isolateNeedsSelection')}>
              {isolated ? t('viewer.showAll') : t('viewer.isolate')}
            </button>
            <button className="kev-btn" onClick={reset}>{t('viewer.resetView')}</button>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={atlas.atlas && !atlas.fallback ? 'Search 2,234 modeled structures…' : t('viewer.searchAnatomy')}
          aria-label={t('viewer.searchAnatomy')}
          style={{ width: '100%', marginTop: '1rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 6, color: '#f8fafc', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
        />
        {searchHits.length > 0 && (
          <div style={{ marginTop: '0.6rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 8, padding: '0.75rem', display: 'grid', gap: '0.4rem' }} aria-live="polite">
            {searchHits.map((hit) => (
              <button
                key={`${hit.systemId}:${hit.partId || hit.name}`}
                className="kev-btn"
                onClick={() => {
                  setActiveSystem(hit.systemId)
                  setSelectedPart(hit)
                }}
                style={{ textAlign: 'left' }}
              >
                {hit.name} <span style={{ color: '#8fa3b8' }}>&middot; {hit.systemId}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1rem', marginTop: '1rem' }}>
          <div
            ref={mountRef}
            className="studio-host"
            role="img"
            aria-label="Interactive 3D human anatomy model"
            style={{ minHeight: 560, border: '1px solid #23415e', borderRadius: 8, overflow: 'hidden', touchAction: 'none', position: 'relative' }}
          >
            {!atlas.fallback && atlas.progress < 100 && !atlas.error && (
              <div className="studio-loading">
                <span className="spinner" aria-hidden="true" />
                <div className="bar"><i style={{ width: `${atlas.progress}%` }} /></div>
                <span>Loading the full human atlas… {atlas.progress}%</span>
                <span style={{ fontSize: '0.68rem', color: '#8fa3b8' }}>2,234 modeled structures · BodyParts3D 4.0 (CC BY 4.0)</span>
              </div>
            )}
            {atlas.fallback && atlas.error && (
              <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, zIndex: 22, background: 'rgba(13,33,54,0.92)', border: '1px solid #23415e', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#d8b565' }}>
                Streaming the full atlas failed ({atlas.error}) - showing the representative teaching model instead. All 15 systems still work.
              </div>
            )}
          </div>
          <aside style={{ display: 'grid', alignContent: 'start', gap: '1rem', background: '#0d2136', border: '1px solid #23415e', borderRadius: 8, padding: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('viewer.systems')}</h2>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                <button className="kev-btn" onClick={() => setVisible(ATLAS_DEFAULT_VISIBLE)} style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>All systems</button>
                <button className="kev-btn" onClick={() => setVisible(['skeletal'])} style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>Skeleton</button>
                <button
                  className="kev-btn"
                  onClick={() => setVisible(['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'])}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                >
                  Organs
                </button>
              </div>
              <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.75rem', maxHeight: 300, overflowY: 'auto' }}>
                {ANATOMY_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    className="kev-btn"
                    onClick={() => { setActiveSystem(system.id); setVisible([system.id]); setSelectedPart(null) }}
                    style={{ textAlign: 'left', borderColor: activeSystem === system.id ? system.color : undefined, color: activeSystem === system.id ? system.color : undefined }}
                  >
                    {t(`systems.${system.id}`, system.name)}
                    {atlas.atlas && (
                      <span style={{ float: 'right', color: '#8fa3b8', fontSize: '0.7rem' }}>
                        {atlas.atlas.parts.filter((p) => p.system === system.id).length}
                      </span>
                    )}
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
          System vocabulary adapted from the Human Atlas tool (MIT); anatomy data BodyParts3D 4.0, CC BY 4.0, DBCLS.
          Educational explorer - not a diagnostic tool. See docs/ATTRIBUTION-human-atlas.md.
        </p>
      </section>
    </main>
  )
}
