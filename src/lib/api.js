// Falls back to the Vercel same-origin proxy (see vercel.json rewrites),
// which forwards to the ECS Fargate backend server-side - this avoids
// mixed-content blocking, since the backend ALB doesn't have a TLS cert
// yet and the frontend is always served over HTTPS. Local dev overrides
// this via VITE_API_BASE_URL in .env (e.g. http://localhost:8000).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

function buildUrl(path) {
  return `${API_BASE}${path}`
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${message}`)
  }
  return response.json()
}

export async function getHealth() {
  return fetchJson(buildUrl('/health'))
}

export async function getVirtualSchoolOverview() {
  return fetchJson(buildUrl('/virtual-school/overview'))
}

export async function getVirtualSchoolFacilities({ available = false, type = '' } = {}) {
  const params = new URLSearchParams()
  if (available) params.set('available', 'true')
  if (type) params.set('type', type)
  const query = params.toString()
  return fetchJson(buildUrl(`/virtual-school/facilities${query ? `?${query}` : ''}`))
}

export async function bookVirtualSchoolFacility(facilityId, sessionId) {
  return fetchJson(buildUrl(`/virtual-school/book/${encodeURIComponent(facilityId)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
}

export async function getCurriculumRecommendations(completedSubjects = []) {
  const completed = completedSubjects.join(',')
  return fetchJson(buildUrl(`/curriculum/recommendations/${encodeURIComponent(completed)}`))
}

export async function joinVrCampus(username, platform = 'web_vr') {
  return fetchJson(buildUrl('/vr/join'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, platform }),
  })
}

export async function moveVrUser(userId, position, rotation) {
  return fetchJson(buildUrl(`/vr/users/${encodeURIComponent(userId)}/move`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position, rotation }),
  })
}

export async function leaveVrCampus(userId) {
  return fetchJson(buildUrl(`/vr/users/${encodeURIComponent(userId)}/leave`), {
    method: 'POST',
  })
}

export async function getVrScene() {
  return fetchJson(buildUrl('/vr/scene'))
}

export async function submitOnboardingApplication(data) {
  return fetchJson(buildUrl('/onboarding/apply'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
