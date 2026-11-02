/**
 * The subject the student is currently studying — the school's shared
 * "which class am I in" signal.
 *
 * A real school keeps the class coherent across the building: the auditorium
 * teaches the same subject the Immersive Lab is dissecting and the labs are
 * experimenting on. This module is that shared signal. The Immersive Lab
 * writes it whenever the student picks a subject; the XR Auditorium and the
 * science labs read it so their lesson deck, default hologram and AI-tutor
 * context follow the student's actual class instead of a hard-coded default.
 *
 * Follows the same defensive-storage pattern as `studyLevel.ts` (private-mode
 * Safari throws, prerender has no storage) — neither may stop the app booting.
 * The id is the immersive-subject id from `src/lib/immersiveSubjects.js`
 * ('anatomy', 'plants', 'engineering', 'vehicle', 'earth', …) or one of the
 * XR lab ids ('chemistry', 'astrophysics', 'biology', 'optics').
 */

const STORAGE_KEY = 'kev_current_subject';
const DEFAULT_SUBJECT_ID = 'chemistry';

/** Read the active subject id, falling back to chemistry. */
export function getCurrentSubjectId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && typeof stored === 'string') return stored;
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return DEFAULT_SUBJECT_ID;
}

/** Persist the active subject id. Empty / non-string values are ignored. */
export function setCurrentSubjectId(id: string): void {
  if (typeof id !== 'string' || !id) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable — the choice still applies for this session */
  }
}
