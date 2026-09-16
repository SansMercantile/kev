# Auth0 roles & cohort claims — what the tenant must provide

KEV's teaching surface (live lessons, blackboard, markbook, cohort-scoped chat
and VR presence) needs to know two things per request: **who is a teacher**,
and **which age band a student belongs to**. This document is the complete
specification of what the Auth0 tenant must emit for those answers to stop
being session-asserted and start being token-verified. The backend and
frontend swap-points are named precisely so the change is one small diff.

## How it works today (and why that is not production-grade)

* `backend/services/auth.py` verifies Auth0 RS256 JWTs against the tenant
  JWKS. The payload carries `sub`, `email`, `name` — **no roles, no grade**.
* With nothing in the token to read, the role travels with the session:
  `src/lib/roleSession.js` sets `X-KEV-Role` / `X-KEV-Cohort` headers from the
  landing-page login, and `teaching_roles.role_from_request()` reads them.
* The **cohort is already safe**: `cohort_for_level()` re-derives a student's
  age band server-side from their study level, so header tampering cannot move
  a child into another band. Chat rooms, VR presence and lesson joins all
  enforce that derived value.
* The **role is not safe**: a hand-crafted client can send
  `X-KEV-Role: teacher` and open a lesson. Fine for development (the same
  surface is behind `KEV_DEV_AUTH_BYPASS` there), not acceptable in
  production. Everything below closes exactly this gap.

## Auth0 checklist

1. **Create the roles.** Dashboard → *Roles* → create `teacher` and `student`
   (those exact names; the backend compares strings, see
   `teaching_roles.role_from_claims`).
2. **Assign them.** Staff accounts → `teacher`; everyone else → `student`.
   Make `student` the default for new sign-ups so an unassigned account can
   never behave as staff.
3. **Record the study level at sign-up.** A guardian chooses it for a child.
   Store it as user metadata `study_level` with one of the ids from
   `backend/core/levels.py`: `elementary | middle | high | university |
   professional`. The backend maps it to a cohort via `cohort_for_level()`;
   once the claim exists it **overrides** whatever the client sends.
4. **Deploy this post-login Action** (Dashboard → *Actions* → *Flows* →
   *Login*, add the Action to the flow). It copies both facts into the tokens
   the backend already verifies:

   ```js
   exports.onExecutePostLogin = async (event, api) => {
     // Roles: event.authorization.roles is populated from the assignments
     // made in steps 1-2. Access-token custom claims must be namespaced,
     // hence the URL form; the backend also accepts a bare "roles" claim so
     // either spelling works during migration.
     if (event.authorization && Array.isArray(event.authorization.roles)) {
       api.accessToken.setCustomClaim(
         'https://kev.sansmercantile.com/roles',
         event.authorization.roles
       );
       api.idToken.setCustomClaim(
         'https://kev.sansmercantile.com/roles',
         event.authorization.roles
       );
     }
     // Study level: the safeguarding fact. Namespaced for the same reason.
     const level = (event.user.user_metadata || {}).study_level;
     if (level) {
       api.accessToken.setCustomClaim(
         'https://kev.sansmercantile.com/study_level',
         level
       );
     }
   };
   ```

5. **Keep the API identifier unchanged.** `AUTH0_AUDIENCE` in
   `backend/services/auth.py` is `https://api.kev.sansmercantile.com`; the
   Action's access-token claims ride on that same token, so no audience or
   issuer change is needed.
6. **Optional, recommended for the school-age cohorts:** capture guardian
   consent at sign-up (`user_metadata.guardian_email`, `consent_at`) or run
   each school as an Auth0 Organization. The backend does not enforce either
   yet; recording them now costs nothing and makes the audit trail exist.

## Backend swap-point (one function, one precedence rule)

`backend/core/teaching_roles.py` already contains the prepared reader:

* `role_from_claims(claims)` — returns `teacher`/`student` from the roles
  claim (namespaced or bare, list or string). Unit-tested.
* `study_level_from_claims(claims)` — returns the `study_level` claim when it
  is a known level id.

The precedence to adopt once the tenant emits claims, in every place that
currently calls `role_from_request()` / `cohort_from_request()` (the
`backend/xr_teaching.py` routes and the chat/VR handlers in
`xr_academy.py`/`main.py`):

1. **verified token claim** — `require_auth` already returns the decoded
   payload, so thread `auth_user` into those routes and read claims from it;
2. **session header, development only** — honour `X-KEV-Role` solely when
   `KEV_DEV_AUTH_BYPASS` is on (it is refused in production already);
3. **default `student`** — the restricted role, as today.

And for cohorts: `study_level_from_claims()` wins over the request body for
students, so a child's band comes from the guardian's sign-up choice rather
than from a dropdown.

## Frontend swap-point

`src/lib/roleSession.js` keeps the *profile* (name, chosen level, subject) as
local convenience, but must stop asserting the role:

* the token-sync effect in `App.jsx` / `AppPlatform.jsx` (the one calling
  `setAuthToken`) should additionally decode the access token — or read
  `useAuth0().user` — and seed the session role from the `roles` claim;
* `roleHeaders()` then sends only what the token did not already prove, and
  the landing login degrades to profile details (name/level) with the role
  arriving from Auth0.

## Development escapes (unchanged)

`VITE_DEV_BYPASS_AUTH` (frontend gate) and `KEV_DEV_AUTH_BYPASS` (backend
`require_auth`) remain for sandboxed work with no tenant egress. Both are off
by default and refused when the environment says production; see
`src/lib/devAuthBypass.jsx` and `backend/services/auth.py`.

## Tests

`tests/test_teaching_roles.py` pins the current contract end-to-end
(cross-cohort refusal, roster hiding, board/mark ownership, chat and VR
scoping). `role_from_claims` / `study_level_from_claims` have their own cases
there, so the migration can be developed against them before the tenant
changes land.
