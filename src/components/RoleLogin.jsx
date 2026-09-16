import React, { useState } from 'react'
import { STUDY_LEVEL_OPTIONS, studyLevelLabel } from '../xr/lib/studyLevel'
import {
  ROLES,
  TEACHING_COHORTS,
  signInAsStudent,
  signInAsTeacher,
  cohortForLevel,
  COHORT_LABELS,
} from '../lib/roleSession'

/**
 * The landing-page login choice: a student door and a teacher door.
 *
 * They are separate on purpose and they lead to separate applications of the
 * same campus. A student session carries a name and a study level - and the
 * level, not the child, decides their age band, which is what keeps juniors
 * and seniors in different social spaces. A teacher session carries the
 * cohort they teach, because that is the only cohort they will ever meet:
 * the backend refuses a teacher into any other band's rooms or lessons.
 */
export default function RoleLogin({ onSignedIn }) {
  const [choice, setChoice] = useState(null) // null | 'student' | 'teacher'
  const [name, setName] = useState('')
  const [level, setLevel] = useState('high')
  const [cohort, setCohort] = useState('senior')
  const [subject, setSubject] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    const profile =
      choice === ROLES.TEACHER
        ? signInAsTeacher(cleanName, cohort, subject.trim())
        : signInAsStudent(cleanName, level)
    if (onSignedIn) onSignedIn(profile)
  }

  const inputStyle = {
    padding: '0.6rem 0.8rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#0f172a',
  }

  return (
    <section className="kev-section" aria-label="Choose how you sign in">
      <h2 className="kev-section-title">Sign in to KEV</h2>
      <p className="kev-section-copy">
        Two doors, two schools in one building. Students get their own private
        view - their classes, their marks, their age group&apos;s spaces. Teachers
        get the teaching studio: live lessons, the blackboard, marking and
        materials, and access only to the cohort they teach, only in lesson time.
      </p>

      {!choice && (
        <div className="kev-grid kev-grid-2" style={{ maxWidth: 760 }}>
          <button
            type="button"
            className="kev-card"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setChoice(ROLES.STUDENT)}
          >
            <div className="kev-card-title">Student login</div>
            <p className="kev-card-text">
              Attend live lessons, walk the campus with your own age group, and
              see only your own work and marks.
            </p>
          </button>
          <button
            type="button"
            className="kev-card"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setChoice(ROLES.TEACHER)}
          >
            <div className="kev-card-title">Teacher login</div>
            <p className="kev-card-text">
              Run live lessons, write the blackboard, pin KEV tools and
              materials, and mark the students in front of you.
            </p>
          </button>
        </div>
      )}

      {choice && (
        <form onSubmit={submit} className="kev-card" style={{ maxWidth: 460, display: 'grid', gap: '0.8rem' }}>
          <div className="kev-card-title">
            {choice === ROLES.TEACHER ? 'Teacher login' : 'Student login'}
          </div>

          <label htmlFor="role-name" style={{ display: 'grid', gap: '0.3rem' }}>
            Your name
            <input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={choice === ROLES.TEACHER ? 'e.g. Ms Dlamini' : 'e.g. Thabo'}
              style={inputStyle}
              autoFocus
            />
          </label>

          {choice === ROLES.STUDENT && (
            <label htmlFor="role-level" style={{ display: 'grid', gap: '0.3rem' }}>
              Study level
              <select id="role-level" value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
                {STUDY_LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              <small style={{ color: '#64748b' }}>
                Your age group for campus spaces: {COHORT_LABELS[cohortForLevel(level)]}.
                Students only meet their own group outside lessons.
              </small>
            </label>
          )}

          {choice === ROLES.TEACHER && (
            <>
              <label htmlFor="role-cohort" style={{ display: 'grid', gap: '0.3rem' }}>
                Cohort you teach
                <select id="role-cohort" value={cohort} onChange={(e) => setCohort(e.target.value)} style={inputStyle}>
                  {TEACHING_COHORTS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <small style={{ color: '#64748b' }}>
                  You can meet only this cohort&apos;s students, and only inside live lessons.
                </small>
              </label>
              <label htmlFor="role-subject" style={{ display: 'grid', gap: '0.3rem' }}>
                Subject (optional)
                <input
                  id="role-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  style={inputStyle}
                />
              </label>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="submit" className="kev-btn kev-btn-primary" disabled={!name.trim()}>
              Continue as {choice === ROLES.TEACHER ? 'teacher' : 'student'}
            </button>
            <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#334155', borderColor: '#cbd5e1' }} onClick={() => setChoice(null)}>
              Back
            </button>
          </div>
          <small style={{ color: '#64748b' }}>
            {choice === ROLES.STUDENT
              ? `Signed in as ${studyLevelLabel(level)} student. Your views are private to you.`
              : 'Signed in with teaching tools for your cohort.'}
          </small>
        </form>
      )}
    </section>
  )
}
