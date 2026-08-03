import React, { useEffect, useRef, useState } from 'react'
import { joinVrCampus, moveVrUser, leaveVrCampus } from '../lib/api'

const OBJECT_SHAPE = {
  display_device: 'a-box',
  scientific_instrument: 'a-sphere',
  musical_instrument: 'a-box',
  art_supply: 'a-plane',
  sports_equipment: 'a-sphere',
}

export default function VRCampus() {
  const [username, setUsername] = useState('')
  const [session, setSession] = useState(null) // { user, scene }
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
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

  const handleGroundClick = async (evt) => {
    if (!session?.user?.id) return
    const point = evt.detail?.intersection?.point
    if (!point) return
    const position = [point.x, 0, point.z]
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
            Step into the KEV virtual school - join to load the live 3D environment and
            walk around the classroom by clicking the floor.
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

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="VR Campus - joined">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="kev-section-title">VR Campus - {user.username}</h2>
          <button className="kev-btn" onClick={handleLeave}>Leave</button>
        </div>
        <p className="kev-section-copy">
          Click the classroom floor to walk there. Objects are the real KEV school
          inventory returned by the backend.
        </p>

        <a-scene ref={sceneRef} embedded style={{ width: '100%', height: '520px', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <a-assets></a-assets>

          <a-sky color={scene.environment.skybox.weather === 'clear' ? '#87CEEB' : '#94a3b8'}></a-sky>

          <a-entity
            light={`type: ambient; intensity: ${scene.environment.lighting.ambient_intensity}`}
          ></a-entity>
          <a-entity
            light={`type: directional; intensity: ${scene.environment.lighting.directional_light.intensity}`}
            position="0 10 5"
          ></a-entity>

          <a-plane
            rotation="-90 0 0"
            width="30"
            height="30"
            color="#7c8b6f"
            onClick={handleGroundClick}
          ></a-plane>

          {scene.objects.map((obj) => {
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
            <a-camera position="0 1.6 0" cursor="rayOrigin: mouse"></a-camera>
          </a-entity>
        </a-scene>
      </section>
    </main>
  )
}
