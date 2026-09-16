/**
 * The signed-in role session: student or teacher, plus the profile each chose
 * at the landing-page login.
 *
 * KEV's Auth0 tenant issues tokens without role claims and the backend keeps
 * no user table, so the role lives in the session (localStorage) and travels
 * per request as `X-KEV-Role` / `X-KEV-Cohort` headers - the same assertion
 * backend/core/teaching_roles.py reads. The backend never trusts the role for
 * anything a child's safety depends on: a student's cohort is re-derived
 * server-side from their study level, so claiming another band here changes
 * nothing but the label on your own screen.
 *
 * Profiles are per-browser, which is what "student views per individual"
 * means in a stateless stack: your marks, notebook and lesson history key off
 * your profile name, and no route exists that returns someone else's.
 *
 * SWAP-POINT (kev/docs/AUTH0_ROLES_AND_COHORTS.md): the role assertion here is
 * a stand-in until the Auth0 tenant emits role and study-level claims. When
 * it does, the token-sync effect in App.jsx / AppPlatform.jsx (the one calling
 * setAuthToken) should seed the session role from the verified claims - or
 * from useAuth0().user - and roleHeaders() below should stop sending X-KEV-Role
 * for anything the token already proves. The profile (name, level, subject)
 * stays local either way; it is convenience, not authority. The backend
 * re-derives a student's cohort server-side regardless of what this file
 * claims, so a forged band changes nothing but the label on your own screen.
 */

import { STUDY_LEVEL_OPTIONS, DEFAULT_STUDY_LEVEL_ID } from '../xr/lib/studyLevel'

const ROLE_KEY = 'kev_role'
const PROFILE_KEY = 'kev_profile'

export const ROLES = { STUDENT: 'student', TEACHER: 'teacher' }

// Mirrors COHORTS in backend/core/teaching_roles.py. The backend re-derives
// this from the level on every request; the copy here is for labels and for
// choosing a room before the first round trip.
const LEVEL_TO_COHORT = {
  elementary: 'junior',
  middle: 'middle',
  high: 'senior',
  university: 'adult',
  professional: 'adult',
}

export const COHORT_LABELS = {
  junior: 'Junior School (K-5)',
  middle: 'Middle School (6-8)',
  senior: 'Senior School (9-12)',
  adult: 'Adult & Professional',
}

export const TEACHING_COHORTS = Object.keys(COHORT_LABELS).map((id) => ({
  id,
  label: COHORT_LABELS[id],
}))

export function cohortForLevel(levelId) {
  return LEVEL_TO_COHORT[levelId] || 'senior'
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode: the session lasts this page load only */
  }
}

export function getRole() {
  try {
    const role = localStorage.getItem(ROLE_KEY)
    return role === ROLES.TEACHER ? ROLES.TEACHER : role === ROLES.STUDENT ? ROLES.STUDENT : null
  } catch {
    return null
  }
}

/**
 * The stored profile: students carry {name, level, cohort}, teachers
 * {name, cohort, subject}. Never invents one - the landing login does that.
 */
export function getProfile() {
  const profile = readJson(PROFILE_KEY)
  if (!profile || !profile.name) return null
  if (getRole() === ROLES.TEACHER) {
    return { cohort: 'senior', subject: '', ...profile }
  }
  const level = STUDY_LEVEL_OPTIONS.some((l) => l.id === profile.level)
    ? profile.level
    : DEFAULT_STUDY_LEVEL_ID
  return { level, cohort: cohortForLevel(level), subject: '', ...profile, level }
}

export function signInAsStudent(name, level) {
  const safeLevel = STUDY_LEVEL_OPTIONS.some((l) => l.id === level) ? level : DEFAULT_STUDY_LEVEL_ID
  writeJson(PROFILE_KEY, { name, level: safeLevel, cohort: cohortForLevel(safeLevel) })
  try {
    localStorage.setItem(ROLE_KEY, ROLES.STUDENT)
  } catch { /* session-only */ }
  return getProfile()
}

export function signInAsTeacher(name, cohort, subject) {
  writeJson(PROFILE_KEY, {
    name,
    cohort: COHORT_LABELS[cohort] ? cohort : 'senior',
    subject: subject || '',
  })
  try {
    localStorage.setItem(ROLE_KEY, ROLES.TEACHER)
  } catch { /* session-only */ }
  return getProfile()
}

export function signOutOfRole() {
  try {
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(PROFILE_KEY)
  } catch { /* nothing stored */ }
}

/** Headers every role-aware request attaches. */
export function roleHeaders() {
  const role = getRole()
  const profile = getProfile()
  const headers = {}
  if (role) headers['X-KEV-Role'] = role
  if (profile && profile.cohort) headers['X-KEV-Cohort'] = profile.cohort
  return headers
}

/** The chat/social room this session is allowed to be in. */
export function mySocialRoom() {
  const profile = getProfile()
  return `hub-${profile ? profile.cohort : 'senior'}`
}
