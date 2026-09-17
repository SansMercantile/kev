import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { xrApi } from '../xr/lib/xrApi'
import { getProfile, getRole, roleHeaders, ROLES } from '../lib/roleSession'

/**
 * "School is in session" ribbon for the campus surfaces.
 *
 * Students see the live lessons their cohort can join right now - attending
 * the virtual school is one click from inside the campus, not a separate
 * website. Teachers see a shortcut into the teaching studio. The list itself
 * carries no roster identities; names appear only once you are in the room.
 */
export default function LiveLessonsStrip({ onJoinLesson, compact }) {
  const [lessons, setLessons] = useState([])
  const profile = getProfile()
  const role = getRole()

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const cohort = profile && profile.cohort
        const res = await fetch(
          xrApi(`/lessons/live${cohort ? `?cohort=${cohort}` : ''}`),
          { headers: roleHeaders() }
        )
        if (res.ok && alive) setLessons((await res.json()).lessons || [])
      } catch { /* offline: show nothing */ }
    }
    load()
    const timer = setInterval(load, 10000)
    return () => { alive = false; clearInterval(timer) }
  }, [profile])

  if (!lessons.length && role !== ROLES.TEACHER) return null

  return (
    <div
      style={{
        display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap',
        padding: '0.6rem 0.9rem', borderRadius: '0.75rem',
        background: 'rgba(201, 162, 39, 0.12)', border: '1px solid rgba(201, 162, 39, 0.45)',
      }}
    >
      <strong style={{ color: '#78350f', fontSize: compact ? '0.78rem' : '0.85rem' }}>
        Live now
      </strong>
      {lessons.map((lesson) => (
        <span key={lesson.id} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: '#334155', fontSize: compact ? '0.78rem' : '0.85rem' }}>
            {lesson.title} · {lesson.teacherName} · {lesson.attendees} in
          </span>
          {role === ROLES.STUDENT && onJoinLesson && (
            <button
              type="button"
              onClick={() => onJoinLesson(lesson)}
              style={{
                fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '0.5rem',
                border: '1px solid #b45309', background: '#c9a227', color: '#0b1830',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Attend
            </button>
          )}
        </span>
      ))}
      {role === ROLES.TEACHER && (
        <Link
          to="/teacher"
          style={{ fontSize: '0.78rem', color: '#0e7490', fontWeight: 700 }}
        >
          Open teaching studio →
        </Link>
      )}
    </div>
  )
}
