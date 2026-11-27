/**
 * Vehicle / mechanical atlas — everything from rollerblades to fighter jets,
 * ships to rockets. Real dimensions and component proportions, exploded by
 * system (frame, wheels, engine, steering, body, wings, hull, etc.).
 *
 * Route: /vehicles
 */
import React, { useEffect, useRef, useState } from 'react'
import { Layers3, RotateCw, Pause, X } from 'lucide-react'
import { createPlanetScene } from '../lib/studio/planetScene'
import '../styles/planets.css'

const CATEGORY_COLORS = {
  frame: '#5a6a7a', wheel: '#2a2a32', engine: '#8a4a3a', steering: '#4a7a9a',
  body: '#c8a06a', wing: '#8a8a9a', hull: '#4a6a8a', sail: '#e8e0d0',
  gear: '#7a7a72', cabin: '#d0c8b8', fuel: '#c8a020', suspension: '#6a5a4a',
  brake: '#a85a4a', blade: '#9aa0a6',
}

const VEHICLES = [
  // personal
  { id: 'rollerblades', label: 'Rollerblades', group: 'personal', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'skateboard', label: 'Skateboard', group: 'personal', color: '#c8a06a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'bicycle', label: 'Bicycle', group: 'personal', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'motorcycle', label: 'Motorcycle', group: 'personal', color: '#8a4a3a', rotation_h: 0, axial_tilt_deg: 0 },
  // road
  { id: 'car', label: 'Car (sedan)', group: 'road', color: '#2a6fae', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'truck', label: 'Truck (semi)', group: 'road', color: '#8a4a3a', rotation_h: 0, axial_tilt_deg: 0 },
  // air
  { id: 'hot_air_balloon', label: 'Hot air balloon', group: 'air', color: '#e2562a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'prop_plane', label: 'Propeller plane (Cessna)', group: 'air', color: '#8a8a9a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'jet_airliner', label: 'Jet airliner (A320)', group: 'air', color: '#d0c8b8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'fighter_jet', label: 'Fighter jet (F-16)', group: 'air', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'helicopter', label: 'Helicopter', group: 'air', color: '#4a7a9a', rotation_h: 0, axial_tilt_deg: 0 },
  // water
  { id: 'sailboat', label: 'Sailboat', group: 'water', color: '#4a6a8a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'motor_yacht', label: 'Motor yacht', group: 'water', color: '#4a6a8a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'cargo_ship', label: 'Container ship', group: 'water', color: '#4a6a8a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'submarine', label: 'Submarine', group: 'water', color: '#1a2a4a', rotation_h: 0, axial_tilt_deg: 0 },
  // space
  { id: 'rocket', label: 'Rocket (Falcon 9)', group: 'space', color: '#d0c8b8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'space_shuttle', label: 'Space Shuttle', group: 'space', color: '#d0c8b8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'iss', label: 'International Space Station', group: 'space', color: '#d0c8b8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'satellite', label: 'Satellite (Hubble-class)', group: 'space', color: '#8a8a9a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'rover', label: 'Mars rover (Perseverance)', group: 'space', color: '#b5532a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'lander', label: 'Lunar lander (Apollo LM)', group: 'space', color: '#d0c8b8', rotation_h: 0, axial_tilt_deg: 0 },
  // military
  { id: 'tank', label: 'Main battle tank (M1 Abrams)', group: 'military', color: '#5a6a4a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'apc', label: 'Armored personnel carrier', group: 'military', color: '#5a6a4a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'warship', label: 'Destroyer (warship)', group: 'military', color: '#4a6a8a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'bomber', label: 'Bomber (B-52)', group: 'military', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  // railway
  { id: 'locomotive', label: 'Diesel locomotive', group: 'railway', color: '#5a6a7a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'passenger_train', label: 'Passenger train (coach)', group: 'railway', color: '#4a7a9a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'freight_train', label: 'Freight train (boxcar)', group: 'railway', color: '#8a4a3a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'steam_locomotive', label: 'Steam locomotive', group: 'railway', color: '#2a2a32', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'high_speed_train', label: 'High-speed train (TGV)', group: 'railway', color: '#4a7a9a', rotation_h: 0, axial_tilt_deg: 0 },
]

const GROUPS = ['all', 'personal', 'road', 'air', 'water', 'space', 'military', 'railway']

const initial = { explode: 0, spin: false, visible: null, selected: [] }

export default function Vehicles() {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [vehicleId, setVehicleId] = useState('car')
  const [group, setGroup] = useState('all')
  const [atlas, setAtlas] = useState(null)
  const [state, setState] = useState(initial)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null)
  const [chosen, setChosen] = useState(null)

  const vehicle = VEHICLES.find((v) => v.id === vehicleId)
  const body = { ...vehicle, texture: null, emissive: false, rings: false, layerColors: {} }

  useEffect(() => {
    const abort = new AbortController()
    setProgress(0); setError(''); setAtlas(null); setChosen(null); setState(initial)
    fetch(`/models/atlas-vehicle-${vehicleId}.json`, { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error('Model not found.'); return r.json() })
      .then((data) => setAtlas(data))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
    return () => abort.abort()
  }, [vehicleId])

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

  const filtered = group === 'all' ? VEHICLES : VEHICLES.filter((v) => v.group === group)

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Mechanical atlas</span>
          <h1>{vehicle.label}</h1>
          <span className="planet-sub">Explode by system · real proportions</span>
        </div>
        <div className="body-selector">
          {GROUPS.map((g) => (
            <button key={g} type="button" className={group === g ? 'body-btn active' : 'body-btn'} onClick={() => setGroup(g)}>
              {g[0].toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
        <div className="body-selector">
          {filtered.map((v) => (
            <button key={v.id} type="button"
              className={vehicleId === v.id ? 'body-btn active' : 'body-btn'}
              onClick={() => setVehicleId(v.id)}>
              {v.label}
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
          <div className="planet-loading"><div className="planet-progress" style={{ width: `${progress}%` }} /><span>Loading {vehicle.label}… {progress}%</span></div>
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
          <p className="detail-desc">Vehicle component at real proportions.</p>
        </aside>
      )}
    </div>
  )
}
