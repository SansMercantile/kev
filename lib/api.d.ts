/**
 * Type declarations for `src/lib/api.js`.
 *
 * The KEV API client is plain JavaScript (it predates the TypeScript XR tree and
 * is shared with the JS-only parts of the app), but `src/xr/lib/xrClient.ts` and
 * `src/xr/lib/xrApi.ts` import from it. Under `strict` those imports resolved to
 * an implicit `any`, which is how `getAuthHeaders()` came to be treated as `{}`
 * and lost its `headers` property at the call site.
 *
 * These declarations describe the module as it is actually implemented — they do
 * not change any runtime behaviour. Keep them in step with `api.js`; the export
 * list here mirrors it one-for-one.
 */

/** Absolute URL for a backend path, honouring `VITE_API_BASE_URL` / the proxy. */
export function buildUrl(path: string): string;

/**
 * Store the Auth0-issued JWT so every call below can attach it without threading
 * a token through each caller. Kept in sync by an effect in `App.jsx`.
 */
export function setAuthToken(token: string | null): void;

/** `Authorization` header for the stored token, or an empty object. */
export function getAuthHeaders(): Record<string, string>;

// --- Health & status --------------------------------------------------------
export function getHealth(): Promise<unknown>;
export function getSystemStatus(): Promise<unknown>;

// --- Virtual school ---------------------------------------------------------
export function getVirtualSchoolOverview(): Promise<unknown>;
export function getVirtualSchoolFacilities(options?: {
  available?: boolean;
  type?: string;
}): Promise<unknown>;
export function bookVirtualSchoolFacility(
  facilityId: string,
  sessionId: string
): Promise<unknown>;
export function releaseVirtualSchoolFacility(facilityId: string): Promise<unknown>;

// --- Curriculum & agents ----------------------------------------------------
export function getCurriculumRecommendations(completedSubjects?: string[]): Promise<unknown>;
export function getCurriculumSubjects(): Promise<unknown>;
export function getAgentsAvailable(subject?: string, educationLevel?: string): Promise<unknown>;
export function getMultiAgentsCatalog(): Promise<unknown>;

// --- Billing ----------------------------------------------------------------
export function getBillingPlans(): Promise<unknown>;
export function getBillingSubscription(): Promise<unknown>;
export function getBillingUsage(): Promise<unknown>;
export function getBillingInvoices(): Promise<unknown>;
export function billingCheckout(body: unknown): Promise<unknown>;
export function billingChangePlan(body: unknown): Promise<unknown>;
export function billingCancel(): Promise<unknown>;

// --- Multiplayer VR campus --------------------------------------------------
export interface VrPosition {
  x: number;
  y?: number;
  z: number;
}

/** `extra` carries the session-asserted {role, cohort, level}; the backend
 * re-derives a student's cohort server-side, so it labels rather than widens. */
export function joinVrCampus(
  username: string,
  platform?: string,
  extra?: { role?: string; cohort?: string; level?: string }
): Promise<unknown>;
export function moveVrUser(
  userId: string,
  position: VrPosition,
  rotation: VrPosition | number
): Promise<unknown>;
export function leaveVrCampus(userId: string): Promise<unknown>;
export function interactVrObject(
  userId: string,
  objectId: string,
  interactionType: string,
  data?: Record<string, unknown>
): Promise<unknown>;
/** `viewer` scopes returned presence to that username's age cohort. */
export function getVrScene(viewer?: string): Promise<unknown>;

// --- Onboarding -------------------------------------------------------------
export function submitOnboardingApplication(data: Record<string, unknown>): Promise<unknown>;
