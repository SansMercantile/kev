/**
 * Canonical school-facility type, reliably present.
 *
 * The generated campus mirror (`src/xr/data/schoolCampus.ts`) populates
 * `schoolFacilityType` on only some Virtual School rooms — Science Lab, the
 * Auditorium, both Lecture Halls, Computer Lab and the Math Classroom ship
 * without it — but it always carries `type`. This module derives the canonical
 * type from `type` when `schoolFacilityType` is absent, so every consumer (the
 * facility router, the 3D glyph, the proximity prompt) reads a value that is
 * guaranteed present instead of reaching for scattered `?? type ?? ''`
 * fallbacks that can silently resolve to ''.
 *
 * Kept in `src/xr/lib` (not the generated mirror) so it survives mirror
 * regeneration.
 */

import type { SchoolFacility } from '../data/schoolCampus';

/** Map the always-present `type` onto the canonical school-facility type. */
const TYPE_TO_SCHOOL_FACILITY_TYPE: Record<string, string> = {
  lab: 'laboratory',
  library: 'library',
  auditorium: 'auditorium',
  lecture_hall: 'lecture_hall',
  classroom: 'classroom',
  gymnasium: 'gymnasium',
  music_room: 'music_room',
  art_studio: 'art_studio',
  computer_lab: 'computer_lab',
  cafeteria: 'cafeteria',
  lounge: 'common_area',
  faculty_office: 'office',
  storage: 'storage',
  observatory: 'observatory',
};

/**
 * The canonical school-facility type for any room: the explicit
 * `schoolFacilityType` when present, else derived from `type`, else the raw
 * `type` as a last resort. Never '' for a typed room.
 */
export function schoolFacilityTypeOf(facility: Pick<SchoolFacility, 'schoolFacilityType' | 'type'>): string {
  return facility.schoolFacilityType ?? TYPE_TO_SCHOOL_FACILITY_TYPE[facility.type ?? ''] ?? facility.type ?? '';
}

/**
 * Return a copy of the facility with `schoolFacilityType` guaranteed set.
 * Used to normalize the Virtual School building's raw rooms once, so the 3D
 * builder and the proximity zones share the same guaranteed value.
 */
export function withSchoolFacilityType<T extends SchoolFacility>(facility: T): T {
  if (facility.schoolFacilityType) return facility;
  return { ...facility, schoolFacilityType: schoolFacilityTypeOf(facility) };
}
