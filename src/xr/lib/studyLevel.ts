// Shared study-level state: one selector drives every surface (XR Academy,
// Immersive Lab, tutor Q&A) so all grades get the same subjects at the right
// depth. Persisted per browser; resolved server-side by normalize_level.

import { xrApi } from './xrApi';

export interface StudyLevel {
  id: string;
  label: string;
  grades?: string;
  focus?: string;
  vocabulary?: string;
  activity?: string;
}

const STORAGE_KEY = 'kev_study_level';
export const DEFAULT_STUDY_LEVEL = 'high';

export const STUDY_LEVEL_OPTIONS = [
  { id: 'elementary', label: 'Elementary (K-5)' },
  { id: 'middle', label: 'Middle School (6-8)' },
  { id: 'high', label: 'High School (9-12)' },
  { id: 'university', label: 'University' },
  { id: 'professional', label: 'Professional' },
];

export function getStudyLevelId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_STUDY_LEVEL;
  } catch {
    return DEFAULT_STUDY_LEVEL;
  }
}

export function setStudyLevelId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function studyLevelLabel(id: string): string {
  return STUDY_LEVEL_OPTIONS.find((l) => l.id === id)?.label || 'High School (9-12)';
}

let levelsCache: StudyLevel[] | null = null;

/** Full level contracts from GET /xr/levels (falls back to local options). */
export async function fetchStudyLevels(): Promise<StudyLevel[]> {
  if (levelsCache) return levelsCache;
  try {
    const res = await fetch(xrApi('/levels'));
    const data = await res.json();
    if (data.levels?.length) {
      levelsCache = data.levels;
      return levelsCache as StudyLevel[];
    }
  } catch {
    /* ignore - static fallback below */
  }
  levelsCache = STUDY_LEVEL_OPTIONS as StudyLevel[];
  return levelsCache;
}
