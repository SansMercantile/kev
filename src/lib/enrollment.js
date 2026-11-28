// Enrollment system: students enroll in subjects, attend lessons, pass exams,
// and unlock the corresponding experiences. This is a school first — the game
// mechanics are the reward for learning, not the point.

import React from 'react'

const SUBJECTS = {
  // sciences
  physics: { label: 'Physics', area: 'science', icon: '⚛️', lessons: ['mechanics', 'thermodynamics', 'electromagnetism', 'optics'], unlocks: ['pilot?vehicle=car', 'pilot?vehicle=fighter_jet'] },
  chemistry: { label: 'Chemistry', area: 'science', icon: '🧪', lessons: ['atomic structure', 'reactions', 'organic', 'acids-bases'], unlocks: ['garage'] },
  biology: { label: 'Biology', area: 'science', icon: '🧬', lessons: ['cells', 'genetics', 'ecology', 'anatomy'], unlocks: ['life-science', 'anatomy'] },
  // mathematics
  mathematics: { label: 'Mathematics', area: 'math', icon: '📐', lessons: ['algebra', 'geometry', 'calculus', 'statistics'], unlocks: ['cosmic'] },
  // geography
  geography: { label: 'Geography', area: 'humanities', icon: '🌍', lessons: ['physical geography', 'human geography', 'cartography', 'climate'], unlocks: ['geography'] },
  history: { label: 'History', area: 'humanities', icon: '📜', lessons: ['ancient', 'medieval', 'modern', 'industrial'], unlocks: ['history'] },
  // engineering
  mechanical: { label: 'Mechanical Engineering', area: 'engineering', icon: '🔧', lessons: ['engine systems', 'transmission', 'suspension', 'brakes'], unlocks: ['garage', 'pilot?vehicle=car'] },
  aerospace: { label: 'Aerospace Engineering', area: 'engineering', icon: '✈️', lessons: ['aerodynamics', 'propulsion', 'flight controls', 'avionics'], unlocks: ['pilot?vehicle=fighter_jet', 'space-centre'] },
  civil: { label: 'Civil Engineering', area: 'engineering', icon: '🏗️', lessons: ['structures', 'materials', 'foundations', 'bridges'], unlocks: ['civil'] },
  maritime: { label: 'Maritime Engineering', area: 'engineering', icon: '⚓', lessons: ['hull design', 'propulsion', 'navigation', 'weapon systems'], unlocks: ['pilot?vehicle=warship'] },
  rail: { label: 'Rail Engineering', area: 'engineering', icon: '🚂', lessons: ['bogies', 'braking', 'traction', 'signalling'], unlocks: ['pilot?vehicle=locomotive', 'rail-yard'] },
  military: { label: 'Military Systems', area: 'engineering', icon: '🎖️', lessons: ['armor', 'ballistics', 'targeting', 'mobility'], unlocks: ['pilot?vehicle=tank', 'military-base'] },
  space: { label: 'Spaceflight', area: 'engineering', icon: '🚀', lessons: ['orbital mechanics', 'propulsion', 'life support', 'docking'], unlocks: ['space-centre', 'space-mission'] },
  // life science
  medicine: { label: 'Medicine', area: 'life-science', icon: '🏥', lessons: ['anatomy', 'physiology', 'pathology', 'pharmacology'], unlocks: ['life-science', 'anatomy'] },
  // sports
  sports: { label: 'Physical Education', area: 'sports', icon: '⚽', lessons: ['athletics', 'team sports', 'fitness', 'health'], unlocks: ['vehicles?group=personal'] },
}

const STORAGE_KEY = 'kev_enrollment'

export function getEnrollment() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveEnrollment(enrollment) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollment))
    window.dispatchEvent(new CustomEvent('kev-enrollment-change'))
  } catch {
    /* storage unavailable */
  }
}

export function useEnrollment() {
  const [enrollment, setEnrollment] = React.useState(getEnrollment)
  React.useEffect(() => {
    const refresh = () => setEnrollment(getEnrollment())
    window.addEventListener('kev-enrollment-change', refresh)
    return () => window.removeEventListener('kev-enrollment-change', refresh)
  }, [])
  return enrollment
}

export function enroll(subjectId) {
  const enrollment = getEnrollment()
  if (!enrollment[subjectId]) {
    enrollment[subjectId] = { enrolled: true, lessonsCompleted: [], examPassed: false, enrolledAt: Date.now() }
    saveEnrollment(enrollment)
  }
  return enrollment[subjectId]
}

export function isEnrolled(subjectId) {
  const enrollment = getEnrollment()
  return !!enrollment[subjectId]?.enrolled
}

export function completeLesson(subjectId, lessonId) {
  const enrollment = getEnrollment()
  if (!enrollment[subjectId]) return false
  if (!enrollment[subjectId].lessonsCompleted.includes(lessonId)) {
    enrollment[subjectId].lessonsCompleted.push(lessonId)
    saveEnrollment(enrollment)
  }
  return true
}

export function isLessonComplete(subjectId, lessonId) {
  const enrollment = getEnrollment()
  return !!enrollment[subjectId]?.lessonsCompleted?.includes(lessonId)
}

export function isExamPassed(subjectId) {
  const enrollment = getEnrollment()
  return !!enrollment[subjectId]?.examPassed
}

export function passExam(subjectId) {
  const enrollment = getEnrollment()
  if (!enrollment[subjectId]) return false
  enrollment[subjectId].examPassed = true
  enrollment[subjectId].passedAt = Date.now()
  saveEnrollment(enrollment)
  return true
}

export function getUnlockedExperiences(subjectId) {
  const subject = SUBJECTS[subjectId]
  if (!subject || !isExamPassed(subjectId)) return []
  return subject.unlocks
}

export function getEnrolledSubjects() {
  const enrollment = getEnrollment()
  return Object.keys(enrollment).filter((id) => enrollment[id]?.enrolled)
}

export { SUBJECTS }
