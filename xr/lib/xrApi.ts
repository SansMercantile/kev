/**
 * URL and auth helpers for the XR surface of the KEV backend.
 *
 * A thin layer over `src/lib/api.js`, which already owns the two things that are
 * easy to get wrong and must not be duplicated:
 *
 *   • the API base (`VITE_API_BASE_URL`, defaulting to the same-origin `/api`
 *     proxy that `vercel.json` rewrites in production), and
 *   • the Auth0 bearer token, set once by an effect in `App.jsx` /
 *     `AppPlatform.jsx` and attached by `getAuthHeaders()`.
 *
 * Call sites use these instead of hard-coding paths, so a route move or a base
 * change is one edit. Every path passed in is relative to the router prefix:
 * `xrApi('/campus/floors')` → `…/xr/campus/floors`, matching
 * `backend/xr_academy.py`, which mounts its routes under `/xr`.
 */

import { buildUrl, getAuthHeaders, setAuthToken } from '../../lib/api';

/** Ensure a path is absolute-within-the-router, so concatenation can't double up. */
function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

/** Absolute URL for a route on the XR router (`backend/xr_academy.py`). */
export function xrApi(path: string): string {
  return buildUrl(`/xr${normalizePath(path)}`);
}

/**
 * Absolute URL for a backend route outside the XR router — the caller supplies
 * the full path including its own prefix, e.g. `libApi('/library/pack')`, which
 * `backend/main.py` defines directly on the app.
 */
export function libApi(path: string): string {
  return buildUrl(normalizePath(path));
}

/**
 * `Authorization` header for the stored Auth0 token, or an empty object when
 * there is none. Spread it into a `fetch` so unauthenticated surfaces still
 * work: only `/xr/tutors/ask` and `/xr/tutor` require a token, and they return
 * 401 without one.
 */
export function xrAuthHeaders(): Record<string, string> {
  return getAuthHeaders();
}

/**
 * Store the Auth0-issued JWT for every XR call. Kept separate from
 * `setAuthToken` only so XR callers do not have to reach into the JS client;
 * both write the same module-level token.
 */
export function setXrAuthToken(token: string | null): void {
  setAuthToken(token);
}

/**
 * WebSocket URL for an XR socket route, e.g. `xrWsUrl('/ws/campus-chat')`.
 *
 * The HTTP base may be relative (`/api`, the same-origin proxy) or absolute
 * (local dev pointed straight at `:8000`), so it is resolved against the page
 * origin first and only then has its protocol swapped — resolving `new URL`
 * against a relative string without an origin throws.
 */
export function xrWsUrl(path: string): string {
  const httpUrl = xrApi(path);
  const absolute = new URL(httpUrl, window.location.origin);
  absolute.protocol = absolute.protocol === 'https:' ? 'wss:' : 'ws:';
  return absolute.toString();
}
