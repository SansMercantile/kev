/**
 * Study-level selection — one adaptive engine for every grade.
 *
 * The same subjects are taught at five depths, and every adaptive surface (XR
 * Academy, Immersive Lab, tutor prompts, study path) reads the student's choice
 * from here so they cannot disagree about which level is active.
 *
 * `STUDY_LEVEL_OPTIONS` mirrors `LEVELS` in `backend/core/levels.py`, served by
 * `GET /xr/levels` and typed as `XrLevel` in `src/lib/xrClient.ts`. It is
 * compiled in rather than fetched because the level picker renders on first
 * paint and must work offline — only the teaching *contracts* behind each level
 * (vocabulary, depth, activity, focus) are server-side. Keep the ids and labels
 * in step with the backend; the ids are the wire contract, sent as
 * `studentLevel` on tutor requests and as `level` on `/xr/subjects` and
 * `/xr/study-path`.
 */

export interface StudyLevelOption {
  /** Wire contract with the backend — do not rename casually. */
  id: string;
  label: string;
}

export const STUDY_LEVEL_OPTIONS: StudyLevelOption[] = [
  { id: 'elementary', label: 'Elementary (K-5)' },
  { id: 'middle', label: 'Middle School (6-8)' },
  { id: 'high', label: 'High School (9-12)' },
  { id: 'university', label: 'University' },
  { id: 'professional', label: 'Professional' },
];

/**
 * Fallback when nothing valid is stored. Matches the backend: `normalize_level()`
 * in `backend/core/levels.py` returns the `high` contract for any grade text it
 * cannot classify, so an unknown or absent level resolves the same way on both
 * sides of the wire.
 */
export const DEFAULT_STUDY_LEVEL_ID = 'high';

const STORAGE_KEY = 'kev_study_level';

function isKnownLevel(id: unknown): id is string {
  return typeof id === 'string' && STUDY_LEVEL_OPTIONS.some((level) => level.id === id);
}

/**
 * The active study level id. Reads localStorage defensively: it throws in
 * private-mode Safari and is absent during a server-side prerender, and neither
 * should stop the app booting.
 */
export function getStudyLevelId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isKnownLevel(stored)) return stored;
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return DEFAULT_STUDY_LEVEL_ID;
}

/**
 * Persist a study level. Unknown ids are ignored rather than stored, so a stale
 * or hand-edited value can never put the picker into a state the backend cannot
 * resolve.
 */
export function setStudyLevelId(id: string): void {
  if (!isKnownLevel(id)) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable — the choice still applies for this session */
  }
}

/** Human-readable label for a level id, falling back to the id itself. */
export function studyLevelLabel(id?: string): string {
  const match = STUDY_LEVEL_OPTIONS.find((level) => level.id === id);
  if (match) return match.label;
  // An unrecognised id is still worth showing verbatim rather than as a blank
  // chip — it tells the student what the app actually thinks the level is.
  return id || STUDY_LEVEL_OPTIONS.find((l) => l.id === DEFAULT_STUDY_LEVEL_ID)?.label || '';
}
