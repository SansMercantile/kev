import React, { useEffect, useRef, useState } from 'react'
import { xrApi } from '../xr/lib/xrApi'
import { getProfile, roleHeaders } from '../lib/roleSession'
import { BoardView } from './LessonBoard'

/**
 * A student's seat in a live lesson.
 *
 * Joining is checked server-side against the lesson's cohort, so this modal
 * can only ever open a room the student is allowed to be in. Inside: the
 * teacher's blackboard exactly as they left it (read-only), who else is in
 * the room, and the classroom chat - which exists only while the lesson is
 * live. Closing the modal leaves the lesson, which is what closes the chat
 * again.
 */
export default function LiveLessonModal({ lesson, onClose }) {
  const profile = getProfile()
  const [detail, setDetail] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const roomId = lesson.classId ? `class-${lesson.classId}` : null
  const leftRef = useRef(false)

  useEffect(() => {
    leftRef.current = false
    const join = async () => {
      const res = await fetch(xrApi(`/lessons/${lesson.id}/join`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...roleHeaders() },
        body: JSON.stringify({ name: profile.name, role: 'student', level: profile.level }),
      })
      if (!res.ok) setError(((await res.json()).detail) || 'Could not join this lesson')
    }
    join()
    return () => {
      leftRef.current = true
      fetch(xrApi(`/lessons/${lesson.id}/leave`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...roleHeaders() },
        body: JSON.stringify({ name: profile.name }),
      }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(
          `${xrApi(`/lessons/${lesson.id}`)}?viewer=${encodeURIComponent(profile.name)}`,
          { headers: roleHeaders() }
        )
        if (res.ok && alive) setDetail((await res.json()).lesson)
        if (roomId && alive) {
          const chat = await fetch(
            `${xrApi('/campus/chat/messages')}?roomId=${roomId}&viewer=${encodeURIComponent(profile.name)}`,
            { headers: roleHeaders() }
          )
          if (chat.ok && alive) setMessages((await chat.json()).messages || [])
        }
      } catch { /* keep last */ }
    }
    load()
    const timer = setInterval(load, 4000)
    return () => { alive = false; clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, roomId])

  const send = async (event) => {
    event.preventDefault()
    if (!draft.trim() || !roomId) return
    await fetch(xrApi('/campus/chat/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...roleHeaders() },
      body: JSON.stringify({
        roomId,
        sender: { id: profile.name, name: profile.name, role: 'student', cohort: profile.cohort },
        text: draft.trim(),
      }),
    })
    setDraft('')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Live lesson: ${lesson.title}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center',
        background: 'rgba(11, 24, 48, 0.62)', padding: '1rem',
      }}
    >
      <div style={{
        width: 'min(880px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#fffdf8',
        borderRadius: '1rem', padding: '1.25rem', display: 'grid', gap: '1rem',
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{lesson.title}</strong>
            <small style={{ display: 'block', color: '#64748b' }}>
              {lesson.teacherName} · live now · your cohort
            </small>
          </div>
          <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#334155', borderColor: '#cbd5e1', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }} onClick={onClose}>
            Leave lesson
          </button>
        </div>

        {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

        <BoardView items={(detail && detail.board) || []} />

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
            In the room: {((detail && detail.roster) || []).map((e) => e.name).join(', ') || '…'}
          </strong>
          {roomId ? (
            <>
              <div style={{ display: 'grid', gap: '0.3rem', maxHeight: 160, overflow: 'auto' }}>
                {messages.slice(-30).map((m, i) => (
                  <small key={i} style={{ color: '#334155' }}>
                    <strong>{m.sender && m.sender.name}: </strong>{m.text}
                  </small>
                ))}
                {messages.length === 0 && <small style={{ color: '#64748b' }}>Classroom chat is quiet.</small>}
              </div>
              <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask or answer in class…"
                  style={{ flex: 1, padding: '0.5rem 0.7rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
                <button type="submit" className="kev-btn kev-btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Send</button>
              </form>
            </>
          ) : (
            <small style={{ color: '#64748b' }}>This lesson runs without classroom chat.</small>
          )}
        </div>
      </div>
    </div>
  )
}
