/**
 * Planetary explorer — every planet in the solar system (plus Sun, Pluto and
 * the major moons), with real interior layers, schematic substance deposits
 * (precious metals, crude oil, ocean water, magma, precious stones), radial
 * explode, and per-body rotation.
 *
 * Interior structure: published seismic/structure models. Deposits: schematic.
 * Route: /planets
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers3, Pause, RotateCw, SplitSquareHorizontal, X } from 'lucide-react'
import { createPlanetScene } from '../lib/studio/planetScene'
import '../styles/planets.css'

// Substance display colors (schematic deposits) + layer colors per body.
const SUBSTANCE_COLORS = {
  geologic: null, ocean_water: '#1a5f9e', ice: '#cfe8f5', water: '#2a7fbe',
  crude_oil: '#2a2018', natural_gas: '#6a5a3a', coal: '#1a1a1a',
  gold: '#d4af37', iron: '#8a4a3a', nickel: '#7a7a8a', copper: '#b87333',
  silver: '#c0c0c0', platinum: '#9aa0a6', diamond: '#bfe3ef', magma: '#e2562a',
  sulfur: '#e0c020', olivine: '#7a9a4a', titanium: '#8a8a9a', helium: '#e8d8f0',
  methane: '#6ab8d8', nitrogen: '#d0e0f0', liquid_metal_h: '#b0b8c8',
}

const BODIES = [
  { id: 'sun', label: 'Sun', texture: null, color: '#ffb347', emissive: true, rotation_h: 609.6, axial_tilt_deg: 7.25, layerColors: { sun_layer_0: '#ffd27a', sun_layer_1: '#ff9a3a', sun_layer_2: '#ff7a2a', sun_layer_3: '#fff1c8' } },
  { id: 'mercury', label: 'Mercury', color: '#9c8e82', rotation_h: 4222.6, axial_tilt_deg: 0.03, layerColors: { mercury_layer_0: '#9c8e82', mercury_layer_1: '#8a6a4a', mercury_layer_2: '#caa46a', mercury_layer_3: '#e0d0b0' } },
  { id: 'venus', label: 'Venus', color: '#d8b06a', rotation_h: -5832.5, axial_tilt_deg: 177.4, layerColors: { venus_layer_0: '#c8a05a', venus_layer_1: '#a8763a', venus_layer_2: '#d8b46a', venus_layer_3: '#e8d8b0' } },
  { id: 'earth', label: 'Earth', texture: 'earth.jpg', color: '#2a6fae', rotation_h: 23.93, axial_tilt_deg: 23.44, layerColors: { earth_layer_0: '#7a6a4a', earth_layer_1: '#a8542a', earth_layer_2: '#d88a3a', earth_layer_3: '#e8d8a8' } },
  { id: 'moon', label: 'Moon', texture: 'moon.jpg', color: '#b8b8b8', rotation_h: 655.7, axial_tilt_deg: 6.68, layerColors: { moon_layer_0: '#b8b0a0', moon_layer_1: '#8a7a6a', moon_layer_2: '#c8a46a', moon_layer_3: '#e0d0b0' } },
  { id: 'mars', label: 'Mars', texture: 'mars.jpg', color: '#b5532a', rotation_h: 24.62, axial_tilt_deg: 25.19, layerColors: { mars_layer_0: '#b5532a', mars_layer_1: '#a8482a', mars_layer_2: '#d88a3a' } },
  { id: 'jupiter', label: 'Jupiter', texture: 'jupiter.jpg', color: '#c8a06a', rotation_h: 9.93, axial_tilt_deg: 3.13, layerColors: { jupiter_layer_0: '#d8b88a', jupiter_layer_1: '#c8a06a', jupiter_layer_2: '#b0b8c8', jupiter_layer_3: '#a8785a' } },
  { id: 'saturn', label: 'Saturn', texture: 'saturn.jpg', color: '#d8c88a', rings: true, rotation_h: 10.66, axial_tilt_deg: 26.73, layerColors: { saturn_layer_0: '#d8c88a', saturn_layer_1: '#c8b06a', saturn_layer_2: '#b0b8c8', saturn_layer_3: '#a8785a' } },
  { id: 'uranus', label: 'Uranus', color: '#8ac8d8', rotation_h: -17.24, axial_tilt_deg: 97.77, layerColors: { uranus_layer_0: '#8ac8d8', uranus_layer_1: '#6aa8c8', uranus_layer_2: '#8a7a6a' } },
  { id: 'neptune', label: 'Neptune', color: '#3a5ac8', rotation_h: 16.11, axial_tilt_deg: 28.32, layerColors: { neptune_layer_0: '#3a5ac8', neptune_layer_1: '#2a4ab8', neptune_layer_2: '#8a7a6a' } },
  { id: 'pluto', label: 'Pluto', color: '#c8a88a', rotation_h: -153.3, axial_tilt_deg: 122.5, layerColors: { pluto_layer_0: '#d8c0a8', pluto_layer_1: '#cfe8f5', pluto_layer_2: '#8a7a6a' } },
  { id: 'io', label: 'Io', color: '#e0c040', rotation_h: 42.46, axial_tilt_deg: 0.05, layerColors: { io_layer_0: '#e0c040', io_layer_1: '#e2562a', io_layer_2: '#c8a46a' } },
  { id: 'europa', label: 'Europa', color: '#c8b8a8', rotation_h: 85.23, axial_tilt_deg: 0.1, layerColors: { europa_layer_0: '#e8f0f5', europa_layer_1: '#1a5f9e', europa_layer_2: '#8a7a6a', europa_layer_3: '#c8a46a' } },
  { id: 'ganymede', label: 'Ganymede', color: '#a89888', rotation_h: 171.7, axial_tilt_deg: 0.2, layerColors: { ganymede_layer_0: '#c8d0d8', ganymede_layer_1: '#6aa8c8', ganymede_layer_2: '#c8a46a' } },
  { id: 'titan', label: 'Titan', color: '#d8a83a', rotation_h: 382.7, axial_tilt_deg: 0.3, layerColors: { titan_layer_0: '#c8b8a8', titan_layer_1: '#1a5f9e', titan_layer_2: '#cfe8f5', titan_layer_3: '#8a7a6a' } },
  { id: 'enceladus', label: 'Enceladus', color: '#f0f4f8', rotation_h: 32.88, axial_tilt_deg: 0.0, layerColors: { enceladus_layer_0: '#f0f4f8', enceladus_layer_1: '#1a5f9e', enceladus_layer_2: '#8a7a6a' } },
]

const initial = { explode: 0, spin: true, visible: null, selected: [] }

// A single body viewer pane (used solo and in compare mode). Owns its own
// atlas fetch + scene mount; shares explode/spin state via props.
function BodyView({ bodyId, state, onProgress, onError, onSelect }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [atlas, setAtlas] = useState(null)
  const body = BODIES.find((b) => b.id === bodyId)

  useEffect(() => {
    const abort = new AbortController()
    setAtlas(null)
    fetch(`/models/atlas-planet-${bodyId}.json`, { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error('Model not found.'); return r.json() })
      .then((data) => setAtlas(data))
      .catch((e) => { if (e.name !== 'AbortError') onError && onError(e.message) })
    return () => abort.abort()
  }, [bodyId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!atlas || !hostRef.current) return undefined
    const scene = createPlanetScene(hostRef.current, {
      atlas, body, state,
      onSelect, onProgress, onError,
    })
    sceneRef.current = scene
    return () => { scene.dispose(); sceneRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas])

  useEffect(() => { sceneRef.current?.setState(state) }, [state])
  return <div className="planet-pane" ref={hostRef} />
}

export default function Planets() {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [searchParams] = useSearchParams()
  const initialBody = BODIES.some((b) => b.id === searchParams.get('body')) ? searchParams.get('body') : 'earth'
  const [bodyId, setBodyId] = useState(initialBody)
  const [compareId, setCompareId] = useState(null)
  const [atlas, setAtlas] = useState(null)
  const [state, setState] = useState(initial)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null)
  const [chosen, setChosen] = useState(null)

  const body = BODIES.find((b) => b.id === bodyId)
  const comparing = !!compareId

  // Load atlas for the selected body (single mode only)
  useEffect(() => {
    if (comparing) return undefined
    const abort = new AbortController()
    setProgress(0); setError(''); setAtlas(null); setChosen(null); setState(initial)
    fetch(`/models/atlas-planet-${bodyId}.json`, { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error('Model not found.'); return r.json() })
      .then((data) => setAtlas(data))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
    return () => abort.abort()
  }, [bodyId, comparing])

  // Mount scene (single mode only)
  useEffect(() => {
    if (comparing || !atlas || !hostRef.current) return undefined
    const scene = createPlanetScene(hostRef.current, {
      atlas, body, state,
      onSelect: (id) => { const p = atlas.parts.find((x) => x.id === id); setChosen(p || null) },
      onProgress: setProgress, onError: setError,
    })
    sceneRef.current = scene
    return () => { scene.dispose(); sceneRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas, comparing])

  useEffect(() => { sceneRef.current?.setState(state) }, [state])

  // distinct systems present (layers + substances)
  const systems = atlas ? [...new Set(atlas.parts.map((p) => p.system))] : []
  const visible = state.visible ?? new Set(systems)
  const toggle = (sys) => {
    const next = new Set(visible)
    next.has(sys) ? next.delete(sys) : next.add(sys)
    setState((s) => ({ ...s, visible: next }))
  }

  const substances = systems.filter((s) => s !== 'geologic')

  const handleSelect = (id) => {
    const p = (atlas && atlas.parts.find((x) => x.id === id)) || { id, name: id.replace(/_/g, ' '), system: 'geologic' }
    setChosen(p)
  }

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Solar system</span>
          <h1>{body.label}</h1>
          <span className="planet-sub">{body.radiusNote || 'Layered interior + substance deposits'}</span>
        </div>
        <div className="body-selector">
          {BODIES.map((b) => (
            <button key={b.id} type="button"
              className={bodyId === b.id ? 'body-btn active' : 'body-btn'}
              onClick={() => setBodyId(b.id)}>
              {b.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="planet-actions">
        <button type="button" className={comparing ? 'active' : ''} onClick={() => { setCompareId(comparing ? null : (bodyId === 'earth' ? 'mars' : 'earth')); setAtlas(null); setChosen(null); setState(initial) }} aria-pressed={comparing}>
          <SplitSquareHorizontal size={17} /><span>{comparing ? 'Single view' : 'Compare'}</span>
        </button>
        <button type="button" className={panel === 'layers' ? 'active' : ''} onClick={() => setPanel(panel === 'layers' ? null : 'layers')}>
          <Layers3 size={17} /><span>Layers & deposits</span>
        </button>
        <button type="button" onClick={() => setState((s) => ({ ...s, spin: !s.spin }))} aria-pressed={state.spin}>
          {state.spin ? <Pause size={17} /> : <RotateCw size={17} />}
          <span>{state.spin ? 'Pause rotation' : 'Rotate'}</span>
        </button>
      </nav>

      {!comparing && (
        <div className="planet-stage" ref={hostRef}>
          {progress < 100 && !error && (
            <div className="planet-loading"><div className="planet-progress" style={{ width: `${progress}%` }} /><span>Loading {body.label}… {progress}%</span></div>
          )}
          {error && <div className="planet-error">{error}</div>}
        </div>
      )}

      {comparing && (
        <div className="planet-compare">
          <div className="compare-pane">
            <div className="compare-label">
              <select value={bodyId} onChange={(e) => setBodyId(e.target.value)}>
                {BODIES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <BodyView bodyId={bodyId} state={state} onProgress={setProgress} onError={setError} onSelect={handleSelect} />
          </div>
          <div className="compare-pane">
            <div className="compare-label">
              <select value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                {BODIES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <BodyView bodyId={compareId} state={state} onProgress={setProgress} onError={setError} onSelect={handleSelect} />
          </div>
        </div>
      )}

      {panel === 'layers' && (
        <aside className="planet-panel glass">
          <div className="panel-heading"><span>Layers & deposits</span>
            <button type="button" className="icon-button" onClick={() => setPanel(null)}><X size={16} /></button>
          </div>
          <div className="panel-list">
            <div className="panel-group">Interior layers</div>
            <button type="button" className={`panel-row ${visible.has('geologic') ? 'enabled' : ''}`} onClick={() => toggle('geologic')}>
              <span className="dot" style={{ background: body.color }} /> All layers
            </button>
            <div className="panel-group">Substance deposits (schematic)</div>
            {substances.map((s) => (
              <button key={s} type="button" className={`panel-row ${visible.has(s) ? 'enabled' : ''}`} onClick={() => toggle(s)}>
                <span className="dot" style={{ background: SUBSTANCE_COLORS[s] || '#888' }} /> {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </aside>
      )}

      <footer className="planet-dock">
        <label>Explode layers</label>
        <input type="range" min="0" max="100" value={Math.round(state.explode * 100)}
          onChange={(e) => setState((s) => ({ ...s, explode: Number(e.target.value) / 100 }))} />
        <span className="dock-val">{Math.round(state.explode * 100)}%</span>
      </footer>

      {chosen && (
        <aside className="planet-detail glass">
          <button type="button" className="icon-button close" onClick={() => setChosen(null)}><X size={16} /></button>
          <h3>{chosen.name}</h3>
          <p className="detail-system">{chosen.system === 'geologic' ? 'Interior layer' : 'Deposit (schematic)'}</p>
          <p className="detail-desc">
            {chosen.system === 'geologic'
              ? 'Interior structural layer from published planetary models.'
              : `Schematic deposit of ${chosen.name.toLowerCase()}. Deposit geometry is illustrative, not a surveyed ore body.`}
          </p>
        </aside>
      )}
    </div>
  )
}
