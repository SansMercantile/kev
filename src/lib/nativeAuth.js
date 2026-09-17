// Native (Cognito) session hook: re-renders on sign-in/out anywhere.
import { useEffect, useState } from 'react'
import { setAuthToken } from './api'

export function useNativeUser() {
  const [nativeUser, setNativeUser] = useState(() => getNativeSession())
  useEffect(() => {
    const refresh = () => setNativeUser(getNativeSession())
    refresh()
    window.addEventListener('kev-auth-change', refresh)
    return () => window.removeEventListener('kev-auth-change', refresh)
  }, [])
  return nativeUser
}

const REFRESH_KEY = 'kev_auth_refresh'
const SESSION_KEY = 'kev_auth_session'

let accessToken = null
let refreshInFlight = null

function readPayload(token) {
  try {
    const part = token.split('.')[1]
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function isAccessFresh(skewSeconds = 300) {
  if (!accessToken) return false
  const payload = readPayload(accessToken)
  if (!payload || !payload.exp) return false
  return payload.exp * 1000 - Date.now() > skewSeconds * 1000
}

export function getNativeSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function persistSession(session, remember) {
  const store = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  try {
    if (session) store.setItem(SESSION_KEY, JSON.stringify(session))
    else store.removeItem(SESSION_KEY)
    other.removeItem(SESSION_KEY)
  } catch {
    /* storage unavailable */
  }
}

function notifyAuthChange() {
  try {
    window.dispatchEvent(new CustomEvent('kev-auth-change'))
  } catch {
    /* non-DOM environment */
  }
}

export function saveNativeSession({ access_token, refresh_token, user, remember }) {
  accessToken = access_token || null
  try {
    if (refresh_token) {
      ;(remember ? localStorage : sessionStorage).setItem(REFRESH_KEY, refresh_token)
    }
  } catch {
    /* storage unavailable */
  }
  if (user) persistSession(user, remember)
  setAuthToken(accessToken)
  notifyAuthChange()
}

export function clearNativeSession() {
  accessToken = null
  try {
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
  } catch {
    /* storage unavailable */
  }
  persistSession(null, true)
  setAuthToken(null)
  notifyAuthChange()
}

async function refreshNow(apiBase) {
  const refreshToken =
    localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY) || null
  if (!refreshToken) return false
  const base = apiBase || import.meta.env.VITE_API_BASE_URL || '/api'
  const response = await fetch(`${base}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) {
    clearNativeSession()
    return false
  }
  const data = await response.json()
  const session = getNativeSession()
  saveNativeSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    user: session,
    remember: Boolean(localStorage.getItem(REFRESH_KEY)),
  })
  return true
}

/** Called at app boot: restores a persisted native session if still valid. */
export async function restoreNativeSession(apiBase) {
  const storedRefresh =
    localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY) || null
  if (!storedRefresh) return null
  const ok = await refreshNow(apiBase).catch(() => false)
  if (!ok) return null
  return getNativeSession()
}

/**
 * Retry helper for api.js: when a request 401s and a native refresh token
 * exists, refresh once and signal the caller to retry. Returns true when a
 * fresh access token was obtained.
 */
export async function refreshOnUnauthorized(apiBase) {
  if (refreshInFlight) {
    await refreshInFlight
    return Boolean(accessToken)
  }
  refreshInFlight = refreshNow(apiBase).catch(() => false)
  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export function getNativeAccessToken() {
  return accessToken
}
