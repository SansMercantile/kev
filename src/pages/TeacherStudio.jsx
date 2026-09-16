import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { xrApi, libApi } from '../xr/lib/xrApi'
import { getProfile, roleHeaders, ROLES, getRole, COHORT_LABELS } from '../lib/roleSession'
import { BoardCanvas, BoardView } from '../components/LessonBoard'

/**
 * The teacher's room: live lessons, the blackboard, marking and materials.
 *
 * Everything here obeys the safeguarding contract the backend enforces - a
 * teacher sees students only inside a lesson they opened, for the cohort they
 * teach, only while it is live. The roster panel therefore exists solely
 * inside an open console; there is no student browser anywhere in KEV.
 *
 * The demonstration tools are the same KEV surfaces students use (Immersive
 * Lab, physics playground, function grapher); pinning one to the board puts
 * it in front of the class with an "Open demonstration" button, which is how
 * a concept gets broken down live rather than described.
 */

const DEMO_TOOLS = [
  { toolId: 'immersive-lab', label: 'Immersive Lab (molecules & atlas)', to: '/anatomy' },
  { toolId: 'physics-playground', label: 'Physics Playground', to: '/xr-academy' },
  { toolId: 'function-grapher', label: 'Function Grapher', to: '/xr-academy' },
  { toolId: 'virtual-school', label: 'Virtual School facilities', to: '/virtual-school' },
]

export default function TeacherStudio() {
  const profile = getProfile()
  const isTeacher = getRole() === ROLES.TEACHER

  const [lessons, setLessons] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState('')
  const [note, setNote] = useState('')
  const [materials, setMaterials] = useState(null)
  const [error, setError] = useState('')

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', ...roleHeaders() }), [])

  const refreshLessons = useCallback(async () => {
    try {
      const res = await fetch(xrApi('/lessons/live'), { headers: roleHeaders() })
      if (res.ok) {
        const body = await res.json()
        // Only this teacher's lessons: other people's rosters are not ours.
        setLessons((body.lessons || []).filter((l) => l.teacherName === (profile || {}).name))
      }
    } catch {
      /* offline: keep last known list */
    }
  }, [profile])

  useEffect(() => {
    if (!isTeacher) return undefined
    refreshLessons()
    const timer = setInterval(refreshLessons, 8000)
    return () => clearInterval(timer)
  }, [isTeacher, refreshLessons])

  // Poll the open lesson so marks/roster/board stay current.
  useEffect(() => {
    if (!activeId || !isTeacher) return undefined
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(
          `${xrApi(`/lessons/${activeId}`)}?viewer=${encodeURIComponent((profile || {}).name || '')}`,
          { headers: roleHeaders() }
        )
        if (res.ok && alive) setLesson((await res.json()).lesson)
      } catch { /* keep last */ }
    }
    load()
    const timer = setInterval(load, 5000)
    return () => { alive = false; clearInterval(timer) }
  }, [activeId, isTeacher, profile])

  if (!isTeacher) {
    return (
      <main className="kev-section">
        <section className="kev-card" style={{ maxWidth: 560 }}>
          <div className="kev-card-title">Teaching studio</div>
          <p className="kev-card-text">
            This studio is for teacher sessions. Sign in through the teacher
            door on the landing page to open your lessons, blackboard and
            markbook.
          </p>
          <Link to="/" className="kev-btn kev-btn-primary">Back to sign-in</Link>
        </section>
      </main>
    )
  }

  const startLesson = async (event) => {
    event.preventDefault()
    setError('')
    const res = await fetch(xrApi('/lessons/start'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        teacherName: profile.name,
        title: title.trim() || 'Live lesson',
        cohort: profile.cohort,
        classId: classId.trim() || null,
      }),
    })
    if (!res.ok) {
      setError((await res.json()).detail || 'Could not start the lesson')
      return
    }
    const created = (await res.json()).lesson
    setTitle('')
    setClassId('')
    setActiveId(created.id)
    refreshLessons()
  }

  const boardWrite = async (kind, payload) => {
    if (!activeId) return
    const res = await fetch(xrApi(`/lessons/${activeId}/board/append`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ teacherName: profile.name, kind, payload }),
    })
    if (res.ok) {
      const body = await res.json()
      setLesson((prev) => prev ? { ...prev, board: [...(prev.board || []), body.item] } : prev)
    }
  }

  const eraseBoard = async () => {
    if (!activeId) return
    await fetch(xrApi(`/lessons/${activeId}/board/clear`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ teacherName: profile.name }),
    })
    setLesson((prev) => prev ? { ...prev, board: [] } : prev)
  }

  const undoBoard = async () => {
    if (!lesson) return
    const keep = (lesson.board || []).slice(0, -1)
    const res = await fetch(xrApi(`/lessons/${lesson.id}/board`), {
      method: 'PUT',
      headers,
      body: JSON.stringify({ teacherName: profile.name, items: keep }),
    })
    if (res.ok) setLesson((prev) => prev ? { ...prev, board: keep } : prev)
  }

  const loadMaterials = async () => {
    const res = await fetch(xrApi('/teacher/materials'), { headers: roleHeaders() })
    if (res.ok) setMaterials(await res.json())
  }

  const saveMark = async (studentName) => {
    const score = Number(prompt(`Mark for ${studentName} (0-100):`, '70'))
    if (Number.isNaN(score)) return
    const memo = prompt('Feedback note (optional):', '') || ''
    const res = await fetch(xrApi(`/lessons/${activeId}/marks`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ teacherName: profile.name, studentName, score, note: memo }),
    })
    if (!res.ok) setError(((await res.json()).detail) || 'Could not save the mark')
  }

  const endLesson = async () => {
    await fetch(xrApi(`/lessons/${activeId}/end`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ teacherName: profile.name }),
    })
    setActiveId(null)
    setLesson(null)
    refreshLessons()
  }

  const students = ((lesson || {}).roster || []).filter((e) => e.role === 'student')

  return (
    <main className="kev-section">
      <section aria-label="Teaching studio">
        <h2 className="kev-section-title">Teaching studio</h2>
        <p className="kev-section-copy">
          {profile.name} · {COHORT_LABELS[profile.cohort] || profile.cohort}
          {profile.subject ? ` · ${profile.subject}` : ''}. Live lessons open a
          room for your cohort; outside a lesson no student list, mark or
          message of theirs is reachable from here.
        </p>

        <div className="kev-grid kev-grid-2" style={{ alignItems: 'start' }}>
          <form onSubmit={startLesson} className="kev-card" style={{ display: 'grid', gap: '0.7rem' }}>
            <div className="kev-card-title">Open a live lesson</div>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Lesson title
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calculus I — derivatives"
                style={{ padding: '0.55rem 0.7rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Class room id (optional, opens its classroom chat)
              <input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. math_102"
                style={{ padding: '0.55rem 0.7rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
            </label>
            <button type="submit" className="kev-btn kev-btn-primary">Go live for {COHORT_LABELS[profile.cohort] || profile.cohort}</button>
            {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
          </form>

          <div className="kev-card">
            <div className="kev-card-title">My live lessons</div>
            {lessons.length === 0 && <p className="kev-card-text">Nothing live right now.</p>}
            <ul style={{ display: 'grid', gap: '0.5rem', margin: 0, paddingLeft: '1.1rem' }}>
              {lessons.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => setActiveId(l.id)}
                    style={{ background: 'transparent', border: 'none', color: '#1d4ed8', cursor: 'pointer', font: 'inherit', padding: 0 }}>
                    {l.title}
                  </button>
                  {' '}<small style={{ color: '#64748b' }}>· {l.attendees} student(s) in · {COHORT_LABELS[l.cohort] || l.cohort}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {activeId && lesson && (
          <div className="kev-card" style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="kev-card-title" style={{ margin: 0 }}>
                {lesson.title} <small style={{ color: '#64748b' }}>· {lesson.status}</small>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Link to="/xr-academy" className="kev-btn kev-btn-secondary" style={{ color: '#334155', borderColor: '#cbd5e1', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
                  Campus &amp; labs
                </Link>
                <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }} onClick={endLesson}>
                  End lesson
                </button>
              </div>
            </div>

            <div className="immersive-lab-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <strong style={{ color: '#0f172a' }}>Blackboard</strong>
                <BoardCanvas
                  onStroke={(stroke) => boardWrite('stroke', stroke)}
                  onUndo={undoBoard}
                  onClear={eraseBoard}
                />
                <BoardView items={lesson.board || []} />

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <strong style={{ color: '#0f172a' }}>Place on the board</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note card text, e.g. d/dx x² = 2x"
                      style={{ flex: '1 1 240px', padding: '0.5rem 0.7rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
                    <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#334155', borderColor: '#cbd5e1', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                      onClick={() => { if (note.trim()) { boardWrite('note', { text: note.trim() }); setNote('') } }}>
                      Pin note
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {DEMO_TOOLS.map((tool) => (
                      <button key={tool.toolId} type="button"
                        className="kev-btn kev-btn-secondary"
                        style={{ color: '#0e7490', borderColor: '#a5f3fc', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                        onClick={() => boardWrite('tool', { toolId: tool.toolId, label: tool.label, to: tool.to })}>
                        + {tool.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#8a3324', borderColor: '#fecaca', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                      onClick={loadMaterials}>
                      Load study materials
                    </button>
                    {materials && (materials.topics || []).slice(0, 6).map((topic) => (
                      <button key={topic.id || topic.title} type="button"
                        className="kev-btn kev-btn-secondary"
                        style={{ color: '#475569', borderColor: '#e2e8f0', padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                        onClick={() => boardWrite('material', { title: topic.title, summary: topic.summary })}>
                        pin: {topic.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <aside style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>In the room ({students.length})</strong>
                  {lesson.rosterVisible ? (
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem' }}>
                      {students.map((s) => (
                        <li key={s.name} style={{ color: '#334155' }}>
                          {s.name}
                          <button type="button" onClick={() => saveMark(s.name)}
                            style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#1d4ed8', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                            mark
                          </button>
                          {lesson.marks && lesson.marks[s.name] && (
                            <small style={{ color: '#16a34a' }}> · {lesson.marks[s.name].score}</small>
                          )}
                        </li>
                      ))}
                      {students.length === 0 && <li style={{ color: '#64748b' }}>Waiting for students…</li>}
                    </ul>
                  ) : (
                    <p style={{ color: '#64748b', margin: '0.5rem 0 0' }}>Roster hidden while the lesson is not live.</p>
                  )}
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Recorded marks</strong>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', display: 'grid', gap: '0.3rem' }}>
                    {Object.entries(lesson.marks || {}).map(([name, mark]) => (
                      <li key={name} style={{ color: '#334155' }}>{name}: {mark.score}{mark.note ? ` — ${mark.note}` : ''}</li>
                    ))}
                    {Object.keys(lesson.marks || {}).length === 0 && <li style={{ color: '#64748b' }}>None yet.</li>}
                  </ul>
                </div>
                <small style={{ color: '#64748b' }}>
                  Marks exist only for students who attended this lesson, and
                  each student sees only their own line.
                </small>
              </aside>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
