/**
 * Enrollment — students enroll in subjects, attend lessons, pass exams, and
 * unlock the corresponding experiences. This is a school first: the game
 * mechanics are the reward for learning, not the point.
 *
 * Route: /enrollment
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECTS, enroll, getEnrolledSubjects, isExamPassed, completeLesson, isLessonComplete } from '../lib/enrollment'
import '../styles/planets.css'

const AREAS = ['science', 'math', 'humanities', 'engineering', 'life-science', 'sports']

export default function Enrollment() {
  const navigate = useNavigate()
  const [area, setArea] = useState('science')
  const [message, setMessage] = useState('Enroll in a subject to begin learning. Complete lessons and pass exams to unlock experiences.')
  const enrolled = getEnrolledSubjects()

  const subjects = Object.entries(SUBJECTS).filter(([, s]) => s.area === area)

  const handleEnroll = (subjectId) => {
    enroll(subjectId)
    setMessage(`Enrolled in ${SUBJECTS[subjectId].label}. Start your first lesson.`)
    window.dispatchEvent(new CustomEvent('kev-enrollment-change'))
  }

  const handleLesson = (subjectId, lessonId) => {
    completeLesson(subjectId, lessonId)
    setMessage(`Completed lesson: ${lessonId}. Keep going to unlock the exam.`)
    window.dispatchEvent(new CustomEvent('kev-enrollment-change'))
  }

  return (
    <div className="planet-page" style={{ overflow: 'auto' }}>
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">School enrollment</span>
          <h1>My subjects</h1>
          <span className="planet-sub">{message}</span>
        </div>
        <div className="body-selector">
          {AREAS.map((a) => (
            <button key={a} type="button" className={area === a ? 'body-btn active' : 'body-btn'} onClick={() => setArea(a)}>
              {a.replace('-', ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="enrollment-body">
        {subjects.map(([id, subject]) => {
          const isEnrolled = enrolled.includes(id)
          const passed = isExamPassed(id)
          return (
            <div key={id} className="subject-card">
              <div className="subject-header">
                <span className="subject-icon">{subject.icon}</span>
                <h3>{subject.label}</h3>
                {passed && <span className="subject-badge">✓ Certified</span>}
              </div>
              {!isEnrolled ? (
                <button className="kev-btn kev-btn-primary" onClick={() => handleEnroll(id)}>
                  Enroll
                </button>
              ) : (
                <div className="subject-lessons">
                  <h4>Lessons:</h4>
                  {subject.lessons.map((lesson) => {
                    const complete = isLessonComplete(id, lesson)
                    return (
                      <button key={lesson} type="button"
                        className={`lesson-btn ${complete ? 'complete' : ''}`}
                        onClick={() => handleLesson(id, lesson)}>
                        {complete ? '✓' : '○'} {lesson}
                      </button>
                    )
                  })}
                  <div className="subject-actions">
                    <button className="kev-btn kev-btn-secondary" onClick={() => navigate(`/exam?field=${id}`)}>
                      Take exam
                    </button>
                    {passed && (
                      <button className="kev-btn kev-btn-primary" onClick={() => navigate(subject.unlocks[0])}>
                        Go to experience
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
