// Falls back to the Vercel same-origin proxy (see vercel.json rewrites),
// which forwards to the ECS Fargate backend server-side - this avoids
// mixed-content blocking, since the backend ALB doesn't have a TLS cert
// yet and the frontend is always served over HTTPS. Local dev overrides
// this via VITE_API_BASE_URL in .env (e.g. http://localhost:8000).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

function buildUrl(path) {
  return `${API_BASE}${path}`
}

export { buildUrl }

// Kept in sync by an effect in App.jsx (useAuth0().getAccessTokenSilently),
// so every call below can attach the real Auth0-issued JWT without
// threading it through each function/caller individually.
let authToken = null
export function setAuthToken(token) {
  authToken = token
}

// Set once by nativeAuth: on a 401 with a stored native refresh token,
// refresh and retry the request a single time before surfacing the error.
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export function getAuthHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {}
}

async function fetchJson(url, options = {}) {
  const { _retried, ...fetchOptions } = options
  const headers = { ...(fetchOptions.headers || {}) }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  let response = await fetch(url, { ...fetchOptions, headers })
  if (response.status === 401 && onUnauthorized && !_retried) {
    const refreshed = await onUnauthorized().catch(() => false)
    if (refreshed) {
      const retryHeaders = { ...(fetchOptions.headers || {}) }
      if (authToken) {
        retryHeaders['Authorization'] = `Bearer ${authToken}`
      }
      response = await fetch(url, { ...fetchOptions, headers: retryHeaders })
    }
  }
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

export async function getCurriculumSubjects() {
  return fetchJson(buildUrl('/curriculum/subjects'))
}

export async function getSystemStatus() {
  return fetchJson(buildUrl('/system/status'))
}

export async function getAgentsAvailable(subject = '', educationLevel = '') {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (educationLevel) params.set('education_level', educationLevel)
  const query = params.toString()
  return fetchJson(buildUrl(`/agents/available${query ? `?${query}` : ''}`))
}

export async function getMultiAgentsCatalog() {
  return fetchJson(buildUrl('/multi-agents/catalog'))
}

export async function releaseVirtualSchoolFacility(facilityId) {
  return fetchJson(buildUrl(`/virtual-school/release/${encodeURIComponent(facilityId)}`), {
    method: 'POST',
  })
}

export async function getBillingPlans() {
  return fetchJson(buildUrl('/billing/plans'))
}

export async function getBillingSubscription() {
  return fetchJson(buildUrl('/billing/subscription'))
}

export async function getBillingUsage() {
  return fetchJson(buildUrl('/billing/usage'))
}

export async function getBillingInvoices() {
  return fetchJson(buildUrl('/billing/invoices'))
}

export async function billingCheckout(body) {
  return fetchJson(buildUrl('/billing/checkout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function billingChangePlan(body) {
  return fetchJson(buildUrl('/billing/change-plan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function billingCancel() {
  return fetchJson(buildUrl('/billing/cancel'), {
    method: 'POST',
  })
}

// `extra` carries the session-asserted role and age band ({role, cohort,
// level}); the backend re-derives a student's cohort from their level, so
// this only labels the session - it cannot widen it.
export async function joinVrCampus(username, platform = 'web_vr', extra = {}) {
  return fetchJson(buildUrl('/vr/join'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, platform, ...extra }),
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

export async function interactVrObject(userId, objectId, interactionType, data = {}) {
  return fetchJson(buildUrl(`/vr/users/${encodeURIComponent(userId)}/objects/${encodeURIComponent(objectId)}/${encodeURIComponent(interactionType)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
}

// `viewer` scopes returned presence to the caller's age cohort - students must
// not be able to observe other cohorts walking the building (see the
// /vr/scene handler in backend/main.py).
export async function getVrScene(viewer) {
  return fetchJson(buildUrl(`/vr/scene${viewer ? `?viewer=${encodeURIComponent(viewer)}` : ''}`))
}

export async function submitOnboardingApplication(data) {
  return fetchJson(buildUrl('/onboarding/apply'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

// Native KEV accounts (AWS Cognito). Public calls - no token attached yet.
function publicPost(path, body) {
  return fetchJson(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function authSignup(email, password, name) {
  return publicPost('/auth/signup', { email, password, name })
}

export async function authConfirm(email, code) {
  return publicPost('/auth/confirm', { email, code })
}

export async function authResendCode(email) {
  return publicPost('/auth/resend-code', { email })
}

export async function authLogin(email, password) {
  return publicPost('/auth/login', { email, password })
}

export async function authForgotPassword(email) {
  return publicPost('/auth/forgot-password', { email })
}

export async function authResetPassword(email, code, newPassword) {
  return publicPost('/auth/reset-password', { email, code, newPassword })
}

export async function authMe() {
  return fetchJson(buildUrl('/auth/me'))
}

export async function authUpdateMe(profile) {
  return fetchJson(buildUrl('/auth/me'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
}
