/**
 * Centralised photorealistic assets for the KEV XR Science Academy.
 *
 * Consolidation notes
 * -------------------
 * Every image here is now a bundled local file. Twelve entries used to be
 * hotlinked `images.unsplash.com` URLs, which caused two real problems:
 *
 *   1. Offline breakage. This app is a PWA (`vite-plugin-pwa`) with IndexedDB
 *      caching and an explicit offline story — the campus map, the 3D scene and
 *      the API all degrade gracefully with no network. Remote stock photos were
 *      the one dependency that silently produced broken images offline.
 *   2. The architectural tour is meant to resemble *this* school. Generic stock
 *      photography of unrelated libraries and pools did not match the actual
 *      XR/VR/AR campus. The replacements were authored to match the real 3D
 *      scenes: dark slate and terrazzo, brushed metal, cyan/violet/emerald
 *      holographics, recessed light coves and volumetric haze.
 *
 * Also fixed: `avatars` is indexed dynamically in `AvatarCustomizerModal`
 * (`PHOTOREALISTIC_ASSETS.avatars[archetype]`) and referenced by literal key in
 * `ClassroomLeaderboard`. Three keys used in the app did not exist —
 * `cellular-lead`, `optics-specialist` and `ai-fellow` — so those lookups
 * returned `undefined` and rendered empty avatar frames. They are now real
 * entries, aliased to the portrait that actually matches the role, and
 * `avatarFor()` provides a guaranteed-non-undefined lookup for dynamic callers.
 */

// --- Campus / architectural tour -------------------------------------------
import campusExteriorHero from './images/campus_exterior_hero_1788983737753.jpg';
import campusAtriumHero from './images/campus_atrium_hero_1788983752892.jpg';
import campusObservatoryPanoramic from './images/campus_observatory_panoramic.jpg';
import campusCleanroomBio from './images/campus_cleanroom_bio.jpg';
import campusOpticsLaserLab from './images/campus_optics_laser_lab.jpg';
import campusModernAuditorium from './images/campus_modern_auditorium.jpg';
import campusLibraryArchive from './images/campus_library_archive.jpg';
import campusSportsArenaPool from './images/campus_sports_arena_pool.jpg';

// --- Avatars ----------------------------------------------------------------
import avatarScholarImg from './images/avatar_scholar_1788983772373.jpg';
import avatarAstroImg from './images/avatar_astro_1788983791629.jpg';
import avatarBioImg from './images/avatar_bio_1788983804718.jpg';
import avatarQuantumPhysicistImg from './images/avatar_quantum_physicist.jpg';
import avatarNanoTechImg from './images/avatar_nano_tech.jpg';

// --- Faculty ----------------------------------------------------------------
import facultyKevImg from './images/faculty_kev_director.jpg';
import facultyAlvarezImg from './images/faculty_alvarez_astrophysics.jpg';

/**
 * Every avatar archetype key the app can ask for.
 *
 * The first five are the primary archetypes. The remaining three are aliases
 * used elsewhere in the UI (the classroom leaderboard and peer rosters) that
 * previously resolved to `undefined`.
 */
export type AvatarArchetype =
  | 'cyber-scholar'
  | 'astro-pioneer'
  | 'molecular-bio'
  | 'quantum-physicist'
  | 'nano-tech'
  | 'cellular-lead'
  | 'optics-specialist'
  | 'ai-fellow';

const AVATARS: Record<AvatarArchetype, string> = {
  'cyber-scholar': avatarScholarImg,
  'astro-pioneer': avatarAstroImg,
  'molecular-bio': avatarBioImg,
  'quantum-physicist': avatarQuantumPhysicistImg,
  'nano-tech': avatarNanoTechImg,
  // Aliases: same discipline, same portrait. Sofia Chen is the genomics/cell
  // biology lead; Elena Rostova works the optics bench; Aisha Patel is the
  // computing fellow.
  'cellular-lead': avatarBioImg,
  'optics-specialist': avatarQuantumPhysicistImg,
  'ai-fellow': avatarScholarImg,
};

/**
 * Safe avatar lookup for dynamic callers.
 *
 * `AvatarCustomizerModal` indexes by an archetype string that comes from data,
 * so an unknown key must not produce a broken `<img src={undefined}>`.
 */
export function avatarFor(archetype: string | null | undefined): string {
  if (archetype && archetype in AVATARS) {
    return AVATARS[archetype as AvatarArchetype];
  }
  return AVATARS['cyber-scholar'];
}

export const PHOTOREALISTIC_ASSETS = {
  campus: {
    exteriorHero: campusExteriorHero,
    atriumHero: campusAtriumHero,
    observatoryPanoramic: campusObservatoryPanoramic,
    cleanroomBio: campusCleanroomBio,
    opticsLabLaser: campusOpticsLaserLab,
    modernAuditorium: campusModernAuditorium,
    libraryArchive: campusLibraryArchive,
    sportsArenaPool: campusSportsArenaPool,
  },
  avatars: AVATARS,
  peers: [
    {
      id: 'peer-elena',
      name: 'Elena Rostova',
      archetype: 'astro-pioneer' as const,
      role: 'Astrophysics Lead',
      photoUrl: avatarAstroImg,
      avatarColor: '#f59e0b',
      status: 'Observing Orion Nebula in Lab 301',
    },
    {
      id: 'peer-marcus',
      name: 'Marcus Vance',
      archetype: 'cyber-scholar' as const,
      role: 'Quantum Computing Fellow',
      photoUrl: avatarScholarImg,
      avatarColor: '#06b6d4',
      status: 'Analyzing VSEPR Geometry in Lab 102',
    },
    {
      id: 'peer-sophia',
      name: 'Dr. Sophia Chen',
      archetype: 'molecular-bio' as const,
      role: 'Cell Biology Specialist',
      photoUrl: avatarBioImg,
      avatarColor: '#10b981',
      status: 'Sequencing Codons in Cleanroom 201',
    },
    {
      id: 'peer-kai',
      name: 'Kai Tanaka',
      archetype: 'quantum-physicist' as const,
      role: 'Optics Researcher',
      photoUrl: avatarQuantumPhysicistImg,
      avatarColor: '#8b5cf6',
      status: 'Calibrating Laser Refraction in Room 202',
    },
    {
      id: 'peer-amara',
      name: 'Amara Diallo',
      archetype: 'nano-tech' as const,
      role: 'Nanomaterials Engineering',
      photoUrl: avatarNanoTechImg,
      avatarColor: '#ec4899',
      status: 'Analyzing Carbon Nanotubes in Central Hub',
    },
  ],
  faculty: [
    {
      id: 'faculty-kev',
      name: 'Prof. KEV',
      title: 'Academy Director & Principal Investigator',
      specialty: 'Multidisciplinary XR Science & Computational Physics',
      photoUrl: facultyKevImg,
    },
    {
      id: 'faculty-alvarez',
      name: 'Dr. Mateo Alvarez',
      title: 'Head of Orbital Mechanics & Astrophysics',
      specialty: 'Keplerian Orbits & Relativistic Astrophysics',
      photoUrl: facultyAlvarezImg,
    },
  ],
};
