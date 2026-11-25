import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { joinVrCampus, moveVrUser, leaveVrCampus, getVrScene, interactVrObject } from '../lib/api'
import SurfaceLinks from '../components/SurfaceLinks'
import { loadAFrame, isAFrameReady } from '../utils/loadAFrame'
import LiveLessonsStrip from '../components/LiveLessonsStrip'
import LiveLessonModal from '../components/LiveLessonModal'
import { getProfile, getRole } from '../lib/roleSession'
import * as T from 'three'

// Load an atlas model (same format as the planet/civil viewers) and attach it
// to an A-Frame entity as real 3D geometry. Returns a promise for the group.
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
  return { parts, label: manifest.species }
}

// Attach a loaded atlas to an A-Frame entity, centered + scaled to fit a
// target size. Returns the entity's object3D.
function attachAtlasToEntity(entity, atlas, { scale = 1, color = '#8a8a8a', substanceColors = {}, texture = null } = {}) {
  const obj = entity.object3D
  // clear previous
  while (obj.children.length) obj.remove(obj.children[0])
  const group = new T.Group()
  // compute overall bounds to center + scale
  const box = new T.Box3()
  atlas.parts.forEach((p) => box.union(p.geometry.boundingBox ?? p.geometry.boundingSphere ? new T.Box3().setFromBufferAttribute(p.geometry.attributes.position) : new T.Box3()))
  if (box.isEmpty()) box.setFromBufferAttribute(atlas.parts[0]?.geometry.attributes.position || new T.BufferAttribute(new Float32Array(9), 3))
  const size = box.getSize(new T.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const s = scale / maxDim
  const center = box.getCenter(new T.Vector3())
  let surfaceTexture = null
  if (texture) {
    surfaceTexture = new T.TextureLoader().load(texture)
    surfaceTexture.colorSpace = T.SRGBColorSpace
  }
  atlas.parts.forEach((p, pi) => {
    const isGeologic = p.system === 'geologic'
    const col = substanceColors[p.system] || (isGeologic ? color : '#888888')
    const isSurface = pi === 0 && surfaceTexture
    const mat = new T.MeshStandardMaterial({
      color: new T.Color(col), map: isSurface ? surfaceTexture : null,
      roughness: 0.8, metalness: 0.05, side: T.DoubleSide,
      transparent: p.system === 'ocean_water', opacity: p.system === 'ocean_water' ? 0.75 : 1,
    })
    const mesh = new T.Mesh(p.geometry, mat)
    mesh.userData.system = p.system
    mesh.position.sub(center).multiplyScalar(s)
    group.add(mesh)
  })
  group.position.y = maxDim * s / 2
  obj.add(group)
  return group
}

const OBJECT_SHAPE = {
  display_device: 'a-box',
  scientific_instrument: 'a-sphere',
  musical_instrument: 'a-box',
  art_supply: 'a-plane',
  sports_equipment: 'a-sphere',
}

// Mirrors backend/../vr_ar/vr_school_environment.py's _ROOM_COLOR_BY_TYPE
// so a room reads the same way here as it was designed server-side.
const ROOM_COLOR_BY_TYPE = {
  classroom: '#d9cc9e',
  lecture_hall: '#b3a6bf',
  laboratory: '#b3d9cc',
  library: '#bf9973',
  gymnasium: '#8cb3d9',
  music_room: '#cc8c8c',
  art_studio: '#d9b3d9',
  computer_lab: '#8c99bf',
  cafeteria: '#e6bf8c',
  office: '#a6a6a6',
  common_area: '#d9d9cc',
  auditorium: '#736680',
}

const FLOORS = ['basement', 'ground', 'first', 'second', 'third', 'roof']

// Per-system colors for in-world exhibits (civil + anatomy + geology layers).
const EXHIBIT_COLORS = {
  geologic: null, foundation: '#7a7a72', concrete: '#9a9a92', steel: '#5a6a7a', lumber: '#b08a5a',
  masonry: '#a85a4a', drywall: '#e8e0d0', roofing: '#8a4a3a', plumbing: '#4a7a9a', wiring: '#c8a020',
  insulation: '#e8c860', finish: '#d0c8b8', arch: '#b0a090', cable: '#3a3a42', deck: '#8a8078',
  pier: '#9a9288', earthwork: '#7a6a4a', skeletal: '#e2d9ba', muscular: '#a85b50', nervous: '#d8b565',
  respiratory: '#b98991', digestive: '#b8916b', urinary: '#b47961', lymphatic: '#879f7c',
  endocrine: '#c5a09a', reproductive: '#bda098', cardiac: '#b96760', sensory: '#b0c8ce',
  arterial: '#c05245', venous: '#527c9f', ocean_water: '#1a5f9e', ice: '#cfe8f5', magma: '#e2562a',
  iron: '#8a4a3a', gold: '#d4af37', diamond: '#bfe3ef', sulfur: '#e0c020', methane: '#6ab8d8',
}

// In-world exhibit portals (walk-in gates -> load real 3D atlas models in the
// scene). Clicking a portal loads that exhibit's geometry at the portal.
const EXHIBITS = [
  { id: 'earth', title: 'Earth', sub: 'Layered interior', to: '/planets?body=earth', color: '#2a6fae', model: '/models/atlas-planet-earth.json', texture: '/textures/planets/earth.jpg', spin: 23.93, position: [0, 0, -8] },
  { id: 'mars', title: 'Mars', sub: 'InSight core', to: '/planets?body=mars', color: '#b5532a', model: '/models/atlas-planet-mars.json', texture: '/textures/planets/mars.jpg', spin: 24.62, position: [6, 0, -6] },
  { id: 'moon', title: 'Moon', sub: 'GRAIL structure', to: '/planets?body=moon', color: '#b8b8b8', model: '/models/atlas-planet-moon.json', texture: '/textures/planets/moon.jpg', spin: 655.7, position: [8, 0, 0] },
  { id: 'house', title: 'House', sub: 'Framing & systems', to: '/civil', color: '#c9a227', model: '/models/atlas-civil-house.json', position: [6, 0, 6] },
  { id: 'skyscraper', title: 'Skyscraper', sub: 'Steel frame', to: '/civil', color: '#5a6a7a', model: '/models/atlas-civil-skyscraper.json', position: [0, 0, 8] },
  { id: 'lion', title: 'Lion', sub: 'Skeleton + organs', to: '/anatomy', color: '#e2562a', model: '/models/atlas-lion-parts.json', position: [0, 0, 8] },
  { id: 'milky_way', title: 'Milky Way', sub: 'Galaxy structure', to: '/universe', color: '#3a4a6a', model: '/models/atlas-space-milky_way.json', position: [-6, 0, 6] },
  { id: 'black_hole', title: 'Black Hole', sub: 'Event horizon', to: '/universe', color: '#1a1a2a', model: '/models/atlas-space-black_hole.json', position: [-8, 0, 0] },
  { id: 'xr', title: 'XR Academy', sub: 'Guided labs', to: '/xr-academy', color: '#8cb3d9', model: null, position: [0, 0, 8] },
]

export default function VRCampus() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [session, setSession] = useState(null) // { user, scene }
  const [joinLesson, setJoinLesson] = useState(null)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [floor, setFloor] = useState('ground')
  // Starts from what is actually present rather than assuming the runtime is
  // there: A-Frame is now fetched on demand, so on first mount it usually is not.
  const [xrAvailable, setXrAvailable] = useState(isAFrameReady)
  const [xrLoading, setXrLoading] = useState(() => !isAFrameReady())
  const [activeExhibit, setActiveExhibit] = useState(null)
  const [explode, setExplode] = useState(0)
  const [hiddenSystems, setHiddenSystems] = useState(new Set())
  const sceneRef = useRef(null)
  const loadedExhibits = useRef({})  // id -> {group, atlas, systems}

  const handlePortalClick = async (ex) => {
    setActiveExhibit(ex.id)
    setHiddenSystems(new Set())
    if (loadedExhibits.current[ex.id]) return
    try {
      const atlas = await loadAtlasModel(ex.model)
      const entity = document.getElementById(`exhibit-model-${ex.id}`)
      if (entity) {
        const group = attachAtlasToEntity(entity, atlas, { scale: 3, color: ex.color, substanceColors: EXHIBIT_COLORS, texture: ex.texture || null })
        const systems = [...new Set(atlas.parts.map((p) => p.system))]
        loadedExhibits.current[ex.id] = { group, atlas, systems }
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleSystem = (sys) => {
    const next = new Set(hiddenSystems)
    next.has(sys) ? next.delete(sys) : next.add(sys)
    setHiddenSystems(next)
  }

  // explode + system visibility for the active exhibit
  useEffect(() => {
    const entry = loadedExhibits.current[activeExhibit]
    if (!entry) return
    entry.group.children.forEach((mesh) => {
      const sys = mesh.userData.system
      mesh.visible = !hiddenSystems.has(sys)
      const c = mesh.geometry.boundingSphere ? mesh.geometry.boundingSphere.center : new T.Vector3()
      const dir = c.clone()
      if (dir.lengthSq() > 0.0001) dir.normalize()
      mesh.position.copy(dir.multiplyScalar(c.length() * explode * 0.4))
    })
  }, [explode, activeExhibit, hiddenSystems])

  // rotation for in-world planets (real sidereal periods, aesthetic scale)
  useEffect(() => {
    const ex = EXHIBITS.find((e) => e.id === activeExhibit)
    const entry = loadedExhibits.current[activeExhibit]
    if (!ex?.spin || !entry) return undefined
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const period = Math.abs(ex.spin)
      const dir = ex.spin < 0 ? -1 : 1
      entry.group.rotation.y += dt * (1 / (period * 3.6)) * dir * 40
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [activeExhibit])

  useEffect(() => {
    // Leave cleanly if the user navigates away mid-session.
    return () => {
      if (session?.user?.id) {
        leaveVrCampus(session.user.id).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return undefined
    let cancelled = false

    // Pull the A-Frame runtime in now that this page is actually on screen.
    // `loadAFrame` is idempotent, so revisits and StrictMode's double effect are
    // both no-ops, and a failed fetch resolves false rather than hanging.
    if (isAFrameReady()) {
      setXrAvailable(true)
      setXrLoading(false)
    } else {
      setXrLoading(true)
      loadAFrame().then((ready) => {
        if (cancelled) return
        setXrAvailable(ready)
        setXrLoading(false)
      })
    }

    const refreshScene = async () => {
      try {
        // Scoped to our cohort: the building shows us only our own age band.
        const result = await getVrScene(session?.user?.username)
        setSession((prev) => prev ? { ...prev, scene: result.scene } : prev)
      } catch (err) {
        setError(err.message)
      }
    }
    const interval = window.setInterval(refreshScene, 2000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [session?.user?.id])

  const handleJoin = async (event) => {
    event.preventDefault()
    if (!username.trim()) return
    setJoining(true)
    setError(null)
    try {
      const profile = getProfile()
      const result = await joinVrCampus(username.trim(), 'web_vr', {
        role: getRole() || 'student',
        cohort: profile ? profile.cohort : undefined,
        level: profile ? profile.level : undefined,
      })
      setSession(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!session?.user?.id) return
    await leaveVrCampus(session.user.id).catch(() => {})
    setSession(null)
  }

  const handleRoomClick = async (room) => async (evt) => {
    if (!session?.user?.id) return
    const point = evt.detail?.intersection?.point
    const [rx, ry, rz] = room.coordinates
    const position = point ? [point.x, ry + 0.05, point.z] : [rx, ry + 0.05, rz]
    try {
      const result = await moveVrUser(session.user.id, position)
      setSession((prev) => ({ ...prev, user: result.user }))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleObjectClick = async (object) => {
    if (!session?.user?.id) return
    try {
      const result = await interactVrObject(session.user.id, object.id, 'touch', {
        touch_point: object.position,
        force: 1,
        timestamp: new Date().toISOString(),
      })
      setSession((prev) => ({
        ...prev,
        user: result.user,
        scene: {
          ...prev.scene,
          objects: prev.scene.objects.map((item) => item.id === result.object.id ? result.object : item),
        },
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!session) {
    return (
      <main className="kev-section">
        <section className="kev-section" aria-label="VR Campus">
          <h2 className="kev-section-title">VR Campus</h2>
          <p className="kev-section-copy">
            Step into the multiplayer KEV school building - 14 real rooms across 5
            floors, from the basement gymnasium to the third-floor auditorium,
            shared with anyone else who is in. Join to load it and walk around by
            clicking a room floor. The full 11-floor campus - every subject wing,
            class and facility - is in the XR Academy.
          </p>
          <div style={{ maxWidth: 640, marginBottom: '1rem' }}>
            <LiveLessonsStrip onJoinLesson={setJoinLesson} />
          </div>
          <form onSubmit={handleJoin} className="kev-card" style={{ maxWidth: 420, display: 'grid', gap: '0.75rem' }}>
            <label htmlFor="vr-username">Your name</label>
            <input
              id="vr-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alexandra"
              style={{ padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
            />
            <button type="submit" className="kev-btn kev-btn-primary" disabled={joining}>
              {joining ? 'Joining...' : 'Join VR Campus'}
            </button>
            {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          </form>
        </section>
        {joinLesson && (
          <LiveLessonModal lesson={joinLesson} onClose={() => setJoinLesson(null)} />
        )}
      </main>
    )
  }

  const { scene, user } = session
  const allRooms = scene.rooms || []
  const rooms = allRooms.filter((r) => r.level === floor)
  // Object positions don't carry a room name, so approximate "on this
  // floor" by y-proximity to any room's y on the selected floor.
  const floorYs = rooms.map((r) => r.coordinates[1])
  const objects = scene.objects.filter((o) => floorYs.some((y) => Math.abs(o.position[1] - y) < 3))
  const otherUsers = Object.entries(scene.user_positions || {}).filter(([id]) => id !== user.id)

  const handleFloorChange = async (nextFloor) => {
    setFloor(nextFloor)
    const target = allRooms.find((r) => r.level === nextFloor)
    if (target && session?.user?.id) {
      const [rx, ry, rz] = target.coordinates
      try {
        const result = await moveVrUser(session.user.id, [rx, ry + 0.05, rz])
        setSession((prev) => ({ ...prev, user: result.user }))
      } catch (err) {
        setError(err.message)
      }
    }
  }

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="VR Campus - joined">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="kev-section-title">VR Campus - {user.username}</h2>
          <button className="kev-btn" onClick={handleLeave}>Leave</button>
        </div>
        <p className="kev-section-copy">
          Drag to look around, WASD to walk, or click a room floor to jump there.
          {rooms.length} rooms on this floor, {allRooms.length} total across the building -
          all real KEV building data, not placeholder shapes.
        </p>
        {xrLoading && !xrAvailable && (
          <p style={{ color: '#0e7490' }} aria-busy="true">
            Loading the immersive renderer&hellip;
          </p>
        )}
        {!xrLoading && !xrAvailable && (
          <p role="alert" style={{ color: '#b45309' }}>
            The immersive renderer is unavailable. Check your connection and reload this page.
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {FLOORS.filter((f) => allRooms.some((r) => r.level === f)).map((f) => (
            <button
              key={f}
              className="kev-btn"
              style={floor === f ? { background: '#c9a227', color: '#0b1830' } : undefined}
              onClick={() => handleFloorChange(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Only mount the scene once A-Frame has registered its custom
            elements; creating <a-scene> earlier relies on upgrade semantics
            that are not worth betting a whole page on. */}
        {xrAvailable && (
          <a-scene ref={sceneRef} embedded style={{ width: '100%', height: '560px', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <a-assets></a-assets>

            <a-sky color={scene.environment.skybox.weather === 'clear' ? '#87CEEB' : '#94a3b8'}></a-sky>

            <a-entity light={`type: ambient; intensity: ${scene.environment.lighting.ambient_intensity}`}></a-entity>
            <a-entity
              light={`type: directional; intensity: ${scene.environment.lighting.directional_light.intensity}`}
              position="0 10 5"
            ></a-entity>

            {rooms.map((room) => {
              const [rx, ry, rz] = room.coordinates
              const [w, h, d] = room.dimensions
              const color = ROOM_COLOR_BY_TYPE[room.facility_type] || '#cccccc'
              const wallColor = '#ede4cf'
              const wt = 0.2 // wall thickness
              return (
                <a-entity key={room.name}>
                  <a-box position={`${rx} ${ry} ${rz}`} width={w} height={0.1} depth={d} color={color}
                    onClick={handleRoomClick(room)}></a-box>
                  {/* Ceiling - closes the room off from the sky so it reads as
                      an actual enclosed room, not an open-air platform. */}
                  <a-box position={`${rx} ${ry + h} ${rz}`} width={w} height={0.1} depth={d} color="#f7f2e7"></a-box>
                  {/* 4 real, solid perimeter walls */}
                  <a-box position={`${rx} ${ry + h / 2} ${rz - d / 2}`} width={w} height={h} depth={wt} color={wallColor}></a-box>
                  <a-box position={`${rx} ${ry + h / 2} ${rz + d / 2}`} width={w} height={h} depth={wt} color={wallColor}></a-box>
                  <a-box position={`${rx - w / 2} ${ry + h / 2} ${rz}`} width={wt} height={h} depth={d} color={wallColor}></a-box>
                  <a-box position={`${rx + w / 2} ${ry + h / 2} ${rz}`} width={wt} height={h} depth={d} color={wallColor}></a-box>
                  <a-text
                    value={room.name}
                    align="center"
                    position={`${rx} ${ry + h - 0.3} ${rz - d / 2 + 0.3}`}
                    rotation="0 0 0"
                    scale="1.4 1.4 1.4"
                    color="#0b1830"
                  ></a-text>
                </a-entity>
              )
            })}

            {objects.map((obj) => {
              const Tag = OBJECT_SHAPE[obj.object_type] || 'a-box'
              const size = obj.visual_properties?.size || [0.6, 0.6, 0.6]
              const shapeProps = Tag === 'a-sphere'
                ? { radius: Math.max(...size) / 2 }
                : { width: size[0], height: size[1], depth: size[2] }
              return (
                <Tag
                  key={obj.id}
                  position={obj.position.join(' ')}
                  scale={obj.scale?.join(' ') || '1 1 1'}
                  onClick={() => handleObjectClick(obj)}
                  {...shapeProps}
                  color={
                    obj.visual_properties?.color
                      ? `rgb(${obj.visual_properties.color.map((c) => Math.round(c * 255)).join(',')})`
                      : '#4f83cc'
                  }
                >
                  <a-text value={obj.name} align="center" position="0 0.7 0" scale="0.6 0.6 0.6"></a-text>
                </Tag>
              )
            })}

            {otherUsers.map(([id, position]) => (
              <a-entity key={id} position={position.join(' ')}>
                <a-sphere radius="0.25" color="#f59e0b"></a-sphere>
                <a-text value="Learner" align="center" position="0 0.45 0" scale="0.5 0.5 0.5" color="#0b1830"></a-text>
              </a-entity>
            ))}

            {/* Floating per-system toggle chips for the active exhibit (in-world). */}
            {activeExhibit && loadedExhibits.current[activeExhibit]?.systems && (
              <a-entity id="exhibit-toggles" position={`${(EXHIBITS.find((e) => e.id === activeExhibit)?.position[0] || 0) - 2.5} 0 ${EXHIBITS.find((e) => e.id === activeExhibit)?.position[2] || 0}`}>
                {loadedExhibits.current[activeExhibit].systems.map((sys, i) => {
                  const off = hiddenSystems.has(sys)
                  const col = EXHIBIT_COLORS[sys] || '#888888'
                  return (
                    <a-entity key={sys} position={`0 ${0.5 + i * 0.55} 0`}>
                      <a-plane width="1.6" height="0.4" position="0 0 0" color={off ? '#333' : col}
                        material={`shader: flat; opacity: ${off ? 0.5 : 0.9}`}
                        onClick={() => toggleSystem(sys)}></a-plane>
                      <a-text value={sys.replace(/_/g, ' ')} align="center" position="0 0 0.01" scale="0.4 0.4 0.4" color={off ? '#888' : '#ffffff'}></a-text>
                    </a-entity>
                  )
                })}
              </a-entity>
            )}

            {/* In-world exhibit portals: click to load that exhibit's real 3D
                geometry into the scene at the portal, exploded for inspection. */}
            <a-entity id="exhibit-portals">
              {EXHIBITS.map((ex) => {
                const [px, py, pz] = ex.position
                const active = activeExhibit === ex.id
                return (
                  <a-entity key={ex.id} position={`${px} ${py} ${pz}`}>
                    {/* portal frame */}
                    <a-box width="1.8" height="2.6" depth="0.12" position="0 1.3 0" color="#0b1830" opacity="0.85"></a-box>
                    {/* glowing portal surface */}
                    <a-plane width="1.5" height="2.2" position="0 1.3 0.07" color={active ? '#ffffff' : ex.color}
                      material={`shader: flat; opacity: 0.85; emissive: ${active ? '#ffffff' : ex.color}; emissiveIntensity: 0.6`}
                      animation="property: material.emissiveIntensity; from: 0.4; to: 0.8; dir: alternate; dur: 1600; loop: true"
                      onClick={() => handlePortalClick(ex)}></a-plane>
                    {/* label */}
                    <a-text value={ex.title} align="center" position="0 2.9 0.1" scale="0.8 0.8 0.8" color="#ffffff"></a-text>
                    <a-text value={active ? 'explode slider below' : ex.sub} align="center" position="0 2.5 0.1" scale="0.45 0.45 0.45" color={ex.color}></a-text>
                    {/* base pad */}
                    <a-cylinder radius="1.1" height="0.06" position="0 0.03 0" color={ex.color} opacity="0.4"></a-cylinder>
                    {/* the loaded exhibit model attaches here */}
                    <a-entity id={`exhibit-model-${ex.id}`} position="0 0.1 0"></a-entity>
                  </a-entity>
                )
              })}
            </a-entity>

            <a-entity id="player" position={user.position.join(' ')}>
              <a-sphere radius="0.3" color="#e63946"></a-sphere>
              <a-camera position="0 1.6 0" cursor="rayOrigin: mouse" wasd-controls="acceleration: 40" look-controls></a-camera>
            </a-entity>
          </a-scene>
        )}

        {activeExhibit && (
          <div className="exhibit-controls">
            <div className="exhibit-explode">
              <label>Explode {EXHIBITS.find((e) => e.id === activeExhibit)?.title}</label>
              <input type="range" min="0" max="100" value={Math.round(explode * 100)}
                onChange={(e) => setExplode(Number(e.target.value) / 100)} />
              <button type="button" onClick={() => { setActiveExhibit(null); setExplode(0); setHiddenSystems(new Set()) }}>Close</button>
            </div>
            {loadedExhibits.current[activeExhibit]?.systems && (
              <div className="exhibit-toggles">
                <span className="exhibit-toggle-label">Systems:</span>
                {loadedExhibits.current[activeExhibit].systems.map((sys) => (
                  <button key={sys} type="button"
                    className={`exhibit-toggle ${hiddenSystems.has(sys) ? 'off' : ''}`}
                    onClick={() => toggleSystem(sys)}>
                    <span className="dot" style={{ background: EXHIBIT_COLORS[sys] || '#888' }} /> {sys.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <SurfaceLinks
          title="Keep exploring"
          links={[
            { to: '/xr-academy', label: t('nav.xrAcademy'), text: '3D labs with tutors for every science.' },
            { to: '/campus-map', label: t('nav.campusMap'), text: 'Book the rooms you just walked through.' },
            { to: '/anatomy', label: t('nav.immersiveLab'), text: 'Anatomy, vehicle & earth systems in 3D.' },
          ]}
        />
      </section>
    </main>
  )
}
