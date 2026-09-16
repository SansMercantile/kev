import React from 'react'

/**
 * Dev-only escape hatch for the sign-in gate.
 *
 * `/xr-academy`, `/vr` and `/billing` sit behind `RequireAuth`, which needs a
 * real Auth0 session. That is correct for production — the AI tutor endpoints
 * call Bedrock per request and are metered by `require_quota` — but it makes the
 * gated surfaces awkward to inspect while working on them, and in a sandbox with
 * no egress to the Auth0 tenant there is no way to sign in at all.
 *
 * Two conditions must both hold, and both are compile-time constants:
 *
 *   `import.meta.env.DEV`               true only under `vite dev`, never in a
 *                                       build. Rollup folds it to `false` and
 *                                       dead-code-eliminates the whole branch,
 *                                       so this cannot reach a production
 *                                       bundle by accident.
 *   `VITE_DEV_BYPASS_AUTH === 'true'`   explicit opt-in, so `npm run dev` on its
 *                                       own still shows the normal sign-in gate.
 *
 * Set it in `kev/.env.local` (gitignored) or inline:
 *   VITE_DEV_BYPASS_AUTH=true npm run dev
 *
 * What this does NOT do: it does not mint an Auth0 token. `isAuthenticated`
 * stays false, so `getAccessTokenSilently()` still yields nothing and every
 * `Depends(require_auth)` route returns 401. Probed against a live backend, that
 * set is wider than it looks:
 *
 *   reachable  all of `/xr/campus/*` (floors, hallway, subject-wings,
 *              virtual-school, live-facilities, chat), plus `/xr/levels`,
 *              `/xr/subjects`, `/xr/study-path`, `/xr/tutors` (the list),
 *              `/xr/curriculum/shared`, `/xr/analytics/global-benchmarks` and
 *              `/xr/world/languages` — enough to walk the whole school
 *
 *   still 401  `/xr/tutor` and `/xr/tutors/ask` (LLM, also quota-metered),
 *              `/library/*` (pack, subjects, search, resources), all `/vr/*`
 *              multiplayer routes, `/agents/{id}/ask`, `/multi-agents/{id}/ask`
 *              and `/onboarding/*`
 *
 * The backend half of that wall has its own switch: `KEV_DEV_AUTH_BYPASS=true`
 * makes `require_auth` (backend/services/auth.py) return a synthetic dev user
 * instead of verifying a JWT, which opens /vr/* and /library/* so the VR campus
 * can actually be joined while developing. It is off by default and refused
 * when KEV_ENV/ENVIRONMENT is production. With both flags set, everything above
 * answers except the two LLM routes, which still need Bedrock to produce an
 * answer -- no token scheme changes that. Testing real entitlements needs a
 * genuine sign-in.
 */
export const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

/**
 * Persistent reminder that the session is faked. Without this a bypassed view is
 * indistinguishable from a signed-in one, which is how a dev-only shortcut ends
 * up being trusted as a real auth check.
 */
export function DevAuthBypassBanner() {
  if (!DEV_BYPASS_AUTH) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483000,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.75rem',
        background: '#78350f',
        borderTop: '1px solid #f59e0b',
        color: '#fde68a',
        fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
        fontSize: '0.7rem',
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      <strong style={{ color: '#fbbf24', letterSpacing: '0.08em' }}>DEV AUTH BYPASS</strong>
      <span>
        Sign-in gate skipped via VITE_DEV_BYPASS_AUTH. No real Auth0 session —
        token-verified routes return 401 unless the backend also runs with
        KEV_DEV_AUTH_BYPASS. Production builds strip this branch entirely.
      </span>
    </div>
  )
}
