/**
 * Universe explorer — deep-space objects: Milky Way, galaxies, black holes,
 * Orion's belt, asteroid belt, comets, meteors, nebulae, Kuiper belt, Oort
 * cloud, constellations. Real structure where published, exploded by component.
 *
 * Route: /universe
 */
import React, { useEffect, useRef, useState } from 'react'
import { Layers3, RotateCw, Pause, X } from 'lucide-react'
import { createPlanetScene } from '../lib/studio/planetScene'
import '../styles/planets.css'

const OBJECTS = [
  { id: 'milky_way', label: 'Milky Way', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 60 },
  { id: 'galaxy_spiral', label: 'Spiral galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 30 },
  { id: 'galaxy_barred_spiral', label: 'Barred spiral galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 30 },
  { id: 'galaxy_elliptical', label: 'Elliptical galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'galaxy_lenticular', label: 'Lenticular galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'galaxy_ring', label: 'Ring galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'galaxy_dwarf', label: 'Dwarf galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'galaxy_irregular', label: 'Irregular galaxy', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'black_hole', label: 'Black hole', color: '#1a1a2a', rotation_h: 0, axial_tilt_deg: 15 },
  { id: 'orion', label: "Orion's belt", color: '#9bb0ff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_orion', label: 'Orion constellation', color: '#9bb0ff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_ursa_major', label: 'Ursa Major', color: '#aabfff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_cassiopeia', label: 'Cassiopeia', color: '#aabfff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_scorpius', label: 'Scorpius', color: '#ff8a6a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_southern_cross', label: 'Southern Cross', color: '#9bb0ff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_lyra', label: 'Lyra', color: '#aabfff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_cygnus', label: 'Cygnus', color: '#aabfff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_leo', label: 'Leo', color: '#aabfff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'constellation_taurus', label: 'Taurus', color: '#ffd8a8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'asteroid_belt', label: 'Asteroid belt', color: '#8a8078', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'comet', label: 'Comet', color: '#cfe8f5', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'meteor', label: 'Meteor (shooting star)', color: '#ffd8a8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'nebula_emission', label: 'Emission nebula', color: '#aabfff', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'nebula_planetary', label: 'Planetary nebula', color: '#8ac8d8', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'nebula_dark', label: 'Dark nebula', color: '#1a1a1a', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'kuiper_belt', label: 'Kuiper belt', color: '#8a8078', rotation_h: 0, axial_tilt_deg: 0 },
  { id: 'oort_cloud', label: 'Oort cloud', color: '#3a4a6a', rotation_h: 0, axial_tilt_deg: 0 },
]

const initial = { explode: 0, spin: true, visible: null, selected: [] }

export default function Universe() {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [objId, setObjId] = useState('milky_way')
  const [atlas, setAtlas] = useState(null)
  const [state, setState] = useState(initial)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null)
  const [chosen, setChosen] = useState(null)

  const obj = OBJECTS.find((o) => o.id === objId)
  const body = { ...obj, texture: null, emissive: false, rings: false, layerColors: {} }

  useEffect(() => {
    const abort = new AbortController()
    setProgress(0); setError(''); setAtlas(null); setChosen(null); setState(initial)
    fetch(`/models/atlas-space-${objId}.json`, { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error('Model not found.'); return r.json() })
      .then((data) => setAtlas(data))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
    return () => abort.abort()
  }, [objId])

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
          <span className="planet-kicker">Universe</span>
          <h1>{obj.label}</h1>
          <span className="planet-sub">Deep-space objects, exploded by component</span>
        </div>
        <div className="body-selector">
          {OBJECTS.map((o) => (
            <button key={o.id} type="button"
              className={objId === o.id ? 'body-btn active' : 'body-btn'}
              onClick={() => setObjId(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="planet-actions">
        <button type="button" className={panel === 'layers' ? 'active' : ''} onClick={() => setPanel(panel === 'layers' ? null : 'layers')}>
          <Layers3 size={17} /><span>Components</span>
        </button>
        <button type="button" onClick={() => setState((s) => ({ ...s, spin: !s.spin }))} aria-pressed={state.spin}>
          {state.spin ? <Pause size={17} /> : <RotateCw size={17} />}
          <span>{state.spin ? 'Pause' : 'Rotate'}</span>
        </button>
      </nav>

      <div className="planet-stage" ref={hostRef}>
        {progress < 100 && !error && (
          <div className="planet-loading"><div className="planet-progress" style={{ width: `${progress}%` }} /><span>Loading {obj.label}… {progress}%</span></div>
        )}
        {error && <div className="planet-error">{error}</div>}
      </div>

      {panel === 'layers' && (
        <aside className="planet-panel glass">
          <div className="panel-heading"><span>Components</span>
            <button type="button" className="icon-button" onClick={() => setPanel(null)}><X size={16} /></button>
          </div>
          <div className="panel-list">
            {systems.map((s) => (
              <button key={s} type="button" className={`panel-row ${visible.has(s) ? 'enabled' : ''}`} onClick={() => toggle(s)}>
                <span className="dot" style={{ background: '#3a4a6a' }} /> {s.replace(/_/g, ' ')}
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
          <p className="detail-desc">Deep-space object component. Structure from published astronomy where available; deposits schematic.</p>
        </aside>
      )}
    </div>
  )
}
