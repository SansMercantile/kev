// Shared API helpers for the ported XR Academy (src/xr/*).
//
// URL strategy mirrors src/lib/api.js: same-origin '/api' in browsers served
// from production/preview (Vercel rewrites /api/* to the backend), and
// VITE_API_BASE_URL only when running on localhost for local dev.
// XR backend routes live under the /xr prefix (see backend/xr_academy.py).

function apiBase(): string {
  try {
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
    if (
      envBase &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      return envBase;
    }
  } catch {
    /* ignore - fall through to same-origin */
  }
  return '/api';
}

/** Build an XR backend REST URL, e.g. xrApi('/campus/floors'). */
export const xrApi = (path: string): string => `${apiBase()}/xr${path}`;

/** Build a core backend REST URL, e.g. libApi('/library/pack'). */
export const libApi = (path: string): string => `${apiBase()}${path}`;

/** Build an XR backend WebSocket URL, e.g. xrWsUrl('/ws/campus-chat'). */
export const xrWsUrl = (path: string): string => {
  try {
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
    if (
      envBase &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      return envBase.replace(/^http/, 'ws') + `/xr${path}`;
    }
  } catch {
    /* ignore - fall through to same-origin */
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/xr${path}`;
};

let xrAuthToken: string | null = null;

/** Called by the XRAcademy page wrapper to keep the Auth0 JWT in sync. */
export function setXrAuthToken(token: string | null): void {
  xrAuthToken = token;
}

/** Attach the Auth0 JWT when present (required by the AI tutor endpoints). */
export function xrAuthHeaders(): Record<string, string> {
  return xrAuthToken ? { Authorization: `Bearer ${xrAuthToken}` } : {};
}
