/**
 * The adaptive teaching tier for briefs, scaffolding and tutor register.
 *
 * Mirrors SCIENCE_TIERS in backend/core/science_programs.py (served by
 * GET /xr/tiers). Separate from the study level on purpose: the level is who
 * the student is (and drives their safeguarding cohort), the tier is how deep
 * today's explanation goes - a senior-school student may want the AP route
 * on Tuesday and the foundational one on a topic they are meeting for the
 * first time on Wednesday.
 */

export interface ScienceTier {
  id: string;
  label: string;
}

export const SCIENCE_TIERS: ScienceTier[] = [
  { id: 'foundational', label: 'Foundational (Middle School)' },
  { id: 'standard', label: 'High School Standard' },
  { id: 'honors', label: 'AP / Advanced Honors' },
  { id: 'research', label: 'University / Research' },
];

export const DEFAULT_TIER_ID = 'standard';

const STORAGE_KEY = 'kev_science_tier';

export function getTierId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SCIENCE_TIERS.some((t) => t.id === stored)) return stored;
  } catch {
    /* storage unavailable: standard register */
  }
  return DEFAULT_TIER_ID;
}

export function setTierId(id: string): void {
  if (!SCIENCE_TIERS.some((t) => t.id === id)) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* applies for this session only */
  }
}

export function tierLabel(id?: string): string {
  return SCIENCE_TIERS.find((t) => t.id === id)?.label || tierLabel(DEFAULT_TIER_ID);
}
