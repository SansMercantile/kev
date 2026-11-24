/**
 * Civil engineering explorer — houses, skyscrapers, roads, and every major
 * bridge type in history, exploded by system (foundations, framing, plumbing,
 * wiring, drywall, roofing, steel, arches, cables, decks, earthworks).
 * Dimensionally-accurate teaching solids (real lumber/brick/steel/pipe sizes).
 *
 * Route: /civil
 */
import React, { useEffect, useRef, useState } from 'react'
import { Layers3, RotateCw, Pause, X } from 'lucide-react'
import { createPlanetScene } from '../lib/studio/planetScene'
import '../styles/planets.css'

const CATEGORY_COLORS = {
  foundation: '#7a7a72', concrete: '#9a9a92', steel: '#5a6a7a', lumber: '#b08a5a',
  masonry: '#a85a4a', drywall: '#e8e0d0', roofing: '#8a4a3a', plumbing: '#4a7a9a',
  wiring: '#c8a020', insulation: '#e8c860', finish: '#d0c8b8', arch: '#b0a090',
  cable: '#3a3a42', deck: '#8a8078', pier: '#9a9288', earthwork: '#7a6a4a',
}

const STRUCTURES = [
  { id: 'house', label: 'House (timber frame)', color: '#b08a5a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'skyscraper', label: 'Skyscraper (steel frame)', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'road', label: 'Road cross-section', color: '#8a8078', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'plumbing_detail', label: 'Plumbing system', color: '#4a7a9a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'wiring_detail', label: 'Electrical system', color: '#c8a020', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'beam_bridge', label: 'Beam bridge', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'arch_bridge', label: 'Arch bridge', color: '#b0a090', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'suspension_bridge', label: 'Suspension bridge', color: '#3a3a42', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'cable_stayed_bridge', label: 'Cable-stayed bridge', color: '#3a3a42', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'truss_bridge', label: 'Truss bridge', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'cantilever_bridge', label: 'Cantilever bridge', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'aqueduct', label: 'Roman aqueduct', color: '#b0a090', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'dam', label: 'Gravity dam', color: '#9a9a92', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'tunnel', label: 'Bored tunnel', color: '#7a6a4a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'cathedral', label: 'Gothic cathedral', color: '#a85a4a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'pagoda', label: 'East Asian pagoda', color: '#b08a5a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'stadium', label: 'Stadium', color: '#9a9288', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'runway', label: 'Airport runway', color: '#8a8078', rotation_h: 0, axial_tilt_deg: 0 },
]

const initial = { explode: 0, spin: false, visible: null, selected: [] }

export default function Civil() {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [structId, setStructId] = useState('house')
  const [atlas, setAtlas] = useState(null)
  const [state, setState] = useState(initial)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null)
  const [chosen, setChosen] = useState(null)

  const structure = STRUCTURES.find((s) => s.id === structId)
  // map to the planet scene's body shape (no texture, no rings, no emissive)
  const body = { ...structure, texture: null, emissive: false, rings: false, layerColors: {} }

  useEffect(() => {
    const abort = new AbortController()
    setProgress(0); setError(''); setAtlas(null); setChosen(null); setState(initial)
    fetch(`/models/atlas-civil-${structId}.json`, { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error('Model not found.'); return r.json() })
      .then((data) => setAtlas(data))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
    return () => abort.abort()
  }, [structId])

  useEffect(() => {
    if (!atlas || !hostRef.current) return undefined
    const scene = createPlanetScene(hostRef.current, {
      atlas, body, state,
      onSelect: (id) => { const p = atlas.parts.find((x) => x.id === id); setChosen(p || null) },
      onProgress: setProgress, onError: setError,
    })
    sceneRef.current = scene
    return () => { scene.dispose(); sceneRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas])

  useEffect(() => { sceneRef.current?.setState(state) }, [state])

  const systems = atlas ? [...new Set(atlas.parts.map((p) => p.system))] : []
  const visible = state.visible ?? new Set(systems)
  const toggle = (sys) => {
    const next = new Set(visible)
    next.has(sys) ? next.delete(sys) : next.add(sys)
    setState((s) => ({ ...s, visible: next }))
  }

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Civil engineering</span>
          <h1>{structure.label}</h1>
          <span className="planet-sub">Explode by system · real proportions</span>
        </div>
        <div className="body-selector">
          {STRUCTURES.map((s) => (
            <button key={s.id} type="button"
              className={structId === s.id ? 'body-btn active' : 'body-btn'}
              onClick={() => setStructId(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="planet-actions">
        <button type="button" className={panel === 'layers' ? 'active' : ''} onClick={() => setPanel(panel === 'layers' ? null : 'layers')}>
          <Layers3 size={17} /><span>Systems</span>
        </button>
        <button type="button" onClick={() => setState((s) => ({ ...s, spin: !s.spin }))} aria-pressed={state.spin}>
          {state.spin ? <Pause size={17} /> : <RotateCw size={17} />}
          <span>{state.spin ? 'Pause' : 'Rotate'}</span>
        </button>
      </nav>

      <div className="planet-stage" ref={hostRef}>
        {progress < 100 && !error && (
          <div className="planet-loading"><div className="planet-progress" style={{ width: `${progress}%` }} /><span>Loading {structure.label}… {progress}%</span></div>
        )}
        {error && <div className="planet-error">{error}</div>}
      </div>

      {panel === 'layers' && (
        <aside className="planet-panel glass">
          <div className="panel-heading"><span>Component systems</span>
            <button type="button" className="icon-button" onClick={() => setPanel(null)}><X size={16} /></button>
          </div>
          <div className="panel-list">
            {systems.map((s) => (
              <button key={s} type="button" className={`panel-row ${visible.has(s) ? 'enabled' : ''}`} onClick={() => toggle(s)}>
                <span className="dot" style={{ background: CATEGORY_COLORS[s] || '#888' }} /> {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </aside>
      )}

      <footer className="planet-dock">
        <label>Explode</label>
        <input type="range" min="0" max="100" value={Math.round(state.explode * 100)}
          onChange={(e) => setState((s) => ({ ...s, explode: Number(e.target.value) / 100 }))} />
        <span className="dock-val">{Math.round(state.explode * 100)}%</span>
      </footer>

      {chosen && (
        <aside className="planet-detail glass">
          <button type="button" className="icon-button close" onClick={() => setChosen(null)}><X size={16} /></button>
          <h3>{chosen.name}</h3>
          <p className="detail-system">{chosen.system.replace(/_/g, ' ')}</p>
          <p className="detail-desc">Dimensionally-accurate teaching solid at true proportions. Not a surveyed structure.</p>
        </aside>
      )}
    </div>
  )
}
