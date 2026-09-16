// Typed client for the KEV backend XR surface (backend/xr_academy.py).
//
// Follows the pattern of tools/fastapi-typescript (single configured client,
// typed calls, no hard-coded paths at call sites). See
// tools/kev-api-client/README.md for regenerating this from the live
// OpenAPI spec.

import { buildUrl, getAuthHeaders } from './api'

export interface XrFloor {
  floorNumber: number
  name: string
  subtitle: string
  color: string
  facilities: XrFacility[]
}

export interface XrFacility {
  id: string
  roomNumber: string
  name: string
  type: string
  tutorInResidence?: string
  associatedLabId?: string
  description: string
  interactActionLabel: string
  coordinates: { x: number; z: number }
}

export interface XrTutor {
  id: string
  name: string
  title: string
  discipline: string
  location: string
  rating: number
  specialties: string[]
}

export interface XrTrack {
  id: string
  title: string
  floor: number
  labId: string
  modulesCount: number
  estimatedHours: number
  prerequisites: string
  overview: string
}

export interface XrSubject {
  id: string
  label: string
  eyebrow: string
  description: string
  tutorId: string
  labId: string
  floor: number
  keyTerms: string[]
  tutor?: { id: string; name: string; title: string }
  track?: XrTrack
  routes: { immersive: string; xrAcademy: string; tutors: string }
}

export interface XrChatMessage {
  id: string
  roomId: string
  sender: { id: string; name: string; avatar?: unknown; isFaculty?: boolean }
  text: string
  timestamp: string
}

export interface XrLevel {
  id: string
  label: string
  grades: string
  vocabulary: string
  depth: string
  activity: string
  focus: string
}

export interface XrCurriculumSubject {
  id: string
  name: string
  description: string
  dependencies: string[]
  complexity: number
  immersive: boolean
  immersiveLabId: string | null
  tutorId: string
  tutor: { id: string; name: string; title: string }
  routes: { curriculum: string; xrAcademy: string; tutors: string }
}

export interface WorldLanguage {
  code: string
  name: string
  native: string
  rtl: boolean
}

export interface WorldCountry {
  code: string
  name: string
  langs: string[]
}

export interface WorldCatalog {
  countries?: WorldCountry[]
  country?: WorldCountry
  languages: WorldLanguage[]
  uiLanguages: string[]
  countryCount?: number
  success: boolean
}

async function xrFetch(path: string, options: RequestInit = {}) {
  const headers = { ...(options.headers || {}), ...getAuthHeaders() }
  const response = await fetch(buildUrl(`/xr${path}`), { ...options, headers })
  if (!response.ok) {
    const message = await response.text()
    // Attach machine-readable status + payload: 402 carries the upgrade
    // payload the paywall UI renders; callers check err.status === 402.
    let detail = null
    try {
      detail = JSON.parse(message)?.detail ?? null
    } catch {
      /* plain-text error */
    }
    const err = new Error(`XR API request failed: ${response.status} - ${String(message).slice(0, 200)}`)
    ;(err as unknown as Record<string, unknown>).status = response.status
    ;(err as unknown as Record<string, unknown>).detail = detail
    throw err
  }
  return response.json()
}

export const xrClient = {
  health: () => xrFetch('/health'),
  floors: (): Promise<{ floors: XrFloor[]; success: boolean }> => xrFetch('/campus/floors'),
  tutors: (): Promise<{ tutors: XrTutor[]; success: boolean }> => xrFetch('/tutors'),
  tracks: (): Promise<{ tracks: XrTrack[]; success: boolean }> => xrFetch('/curriculum/shared'),
  subjects: (level?: string): Promise<{ subjects: XrSubject[]; curriculumSubjects: XrCurriculumSubject[]; level: string; success: boolean }> =>
    xrFetch(`/subjects${level ? `?level=${encodeURIComponent(level)}` : ''}`),
  levels: (): Promise<{ levels: XrLevel[]; success: boolean }> => xrFetch('/levels'),
  worldLanguages: (country?: string, q?: string): Promise<WorldCatalog> => {
    const params = new URLSearchParams()
    if (country) params.set('country', country)
    if (q) params.set('q', q)
    const query = params.toString()
    return xrFetch(`/world/languages${query ? `?${query}` : ''}`)
  },
  studyPath: (completed: string[], level?: string): Promise<{ completed: string[]; next: XrCurriculumSubject[]; level: string; levelGuidance: { label: string; focus: string; activity: string }; success: boolean }> =>
    xrFetch(`/study-path?completed=${encodeURIComponent(completed.join(','))}${level ? `&level=${encodeURIComponent(level)}` : ''}`),
  benchmarks: () => xrFetch('/analytics/global-benchmarks'),
  liveFacilities: () => xrFetch('/campus/live-facilities'),
  chatMessages: (roomId: string): Promise<{ roomId: string; messages: XrChatMessage[] }> =>
    xrFetch(`/campus/chat/messages?roomId=${encodeURIComponent(roomId)}`),
  askTutor: (body: { tutorId: string; question: string; currentFloor?: number; facilityContext?: string; studentLevel?: string; tier?: string; language?: string }) =>
    xrFetch('/tutors/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  askLabTutor: (body: { question: string; currentLab?: string; context?: string; simulationState?: unknown; studentLevel?: string; tier?: string; language?: string }) =>
    xrFetch('/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}
