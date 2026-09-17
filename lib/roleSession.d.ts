/**
 * Type declarations for `src/lib/roleSession.js`.
 *
 * The role session is plain JavaScript because most of its consumers are the
 * untyped .jsx surfaces (landing login, teaching studio, lesson modal), but
 * the typed chat sidebar needs it too - under `allowJs: false` an import of a
 * .js module resolves to an implicit `any`, which is exactly how type info
 * gets silently lost. These declarations describe the module as implemented.
 */

export declare const ROLES: { STUDENT: 'student'; TEACHER: 'teacher' };

export declare const COHORT_LABELS: Record<string, string>;

export declare const TEACHING_COHORTS: Array<{ id: string; label: string }>;

export declare function cohortForLevel(levelId: string): string;

export declare function getRole(): 'student' | 'teacher' | null;

export interface RoleProfile {
  name: string;
  cohort: string;
  level?: string;
  subject?: string;
}

export declare function getProfile(): RoleProfile | null;

export declare function signInAsStudent(name: string, level: string): RoleProfile | null;

export declare function signInAsTeacher(
  name: string,
  cohort: string,
  subject?: string
): RoleProfile | null;

export declare function signOutOfRole(): void;

/** `X-KEV-Role` / `X-KEV-Cohort` headers for role-aware requests. */
export declare function roleHeaders(): Record<string, string>;

/** The cohort social room this session is allowed to use (`hub-<cohort>`). */
export declare function mySocialRoom(): string;
