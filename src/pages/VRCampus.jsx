import React, { useEffect, useRef, useState } from 'react'
import { joinVrCampus, moveVrUser, leaveVrCampus } from '../lib/api'

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

export default function VRCampus() {
  const [username, setUsername] = useState('')
  const [session, setSession] = useState(null) // { user, scene }
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [floor, setFloor] = useState('ground')
  const sceneRef = useRef(null)

  useEffect(() => {
    // Leave cleanly if the user navigates away mid-session.
    return () => {
      if (session?.user?.id) {
        leaveVrCampus(session.user.id).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  const handleJoin = async (event) => {
    event.preventDefault()
    if (!username.trim()) return
    setJoining(true)
    setError(null)
    try {
      const result = await joinVrCampus(username.trim(), 'web_vr')
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

  if (!session) {
    return (
      <main className="kev-section">
        <section className="kev-section" aria-label="VR Campus">
          <h2 className="kev-section-title">VR Campus</h2>
          <p className="kev-section-copy">
            Step into the KEV virtual school building - 14 real rooms across 5 floors,
            from the basement gymnasium to the third-floor auditorium. Join to load it and
            walk around by clicking a room floor.
          </p>
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
            const wallColor = '#f2ede0'
            const wt = 0.15 // wall thickness
            return (
              <a-entity key={room.name}>
                <a-box position={`${rx} ${ry} ${rz}`} width={w} height={0.1} depth={d} color={color}
                  onClick={handleRoomClick(room)}></a-box>
                {/* 4 real perimeter walls, not one solid interior block */}
                <a-box position={`${rx} ${ry + h / 2} ${rz - d / 2}`} width={w} height={h} depth={wt} color={wallColor} material="opacity: 0.55; transparent: true"></a-box>
                <a-box position={`${rx} ${ry + h / 2} ${rz + d / 2}`} width={w} height={h} depth={wt} color={wallColor} material="opacity: 0.55; transparent: true"></a-box>
                <a-box position={`${rx - w / 2} ${ry + h / 2} ${rz}`} width={wt} height={h} depth={d} color={wallColor} material="opacity: 0.55; transparent: true"></a-box>
                <a-box position={`${rx + w / 2} ${ry + h / 2} ${rz}`} width={wt} height={h} depth={d} color={wallColor} material="opacity: 0.55; transparent: true"></a-box>
                <a-text
                  value={room.name}
                  align="center"
                  position={`${rx} ${ry + h + 0.3} ${rz}`}
                  scale="1.6 1.6 1.6"
                  color="#0b1830"
                ></a-text>
              </a-entity>
            )
          })}

          {objects.map((obj) => {
            const Tag = OBJECT_SHAPE[obj.object_type] || 'a-box'
            return (
              <Tag
                key={obj.id}
                position={obj.position.join(' ')}
                color={
                  obj.visual_properties?.color
                    ? `rgb(${obj.visual_properties.color.map((c) => Math.round(c * 255)).join(',')})`
                    : '#4f83cc'
                }
                width={obj.visual_properties?.size?.[0] || 0.6}
                height={obj.visual_properties?.size?.[1] || 0.6}
                depth={obj.visual_properties?.size?.[2] || 0.6}
                radius="0.4"
              >
                <a-text value={obj.name} align="center" position="0 0.7 0" scale="0.6 0.6 0.6"></a-text>
              </Tag>
            )
          })}

          <a-entity id="player" position={user.position.join(' ')}>
            <a-sphere radius="0.3" color="#e63946"></a-sphere>
            <a-camera position="0 1.6 0" cursor="rayOrigin: mouse" wasd-controls="acceleration: 40" look-controls></a-camera>
          </a-entity>
        </a-scene>
      </section>
    </main>
  )
}
