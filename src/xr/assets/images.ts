// Centralized Photorealistic Assets for KEV XR Science Academy
import campusExteriorHero from './images/campus_exterior_hero_1788983737753.jpg';
import campusAtriumHero from './images/campus_atrium_hero_1788983752892.jpg';
import avatarScholarImg from './images/avatar_scholar_1788983772373.jpg';
import avatarAstroImg from './images/avatar_astro_1788983791629.jpg';
import avatarBioImg from './images/avatar_bio_1788983804718.jpg';

export const PHOTOREALISTIC_ASSETS = {
  campus: {
    exteriorHero: campusExteriorHero,
    atriumHero: campusAtriumHero,
    observatoryPanoramic: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    cleanroomBio: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80',
    opticsLabLaser: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1920&q=80',
    modernAuditorium: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1920&q=80',
    libraryArchive: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80',
    sportsArenaPool: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1920&q=80',
  },
  avatars: {
    'cyber-scholar': avatarScholarImg,
    'astro-pioneer': avatarAstroImg,
    'molecular-bio': avatarBioImg,
    'quantum-physicist': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    'nano-tech': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  },
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
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      avatarColor: '#8b5cf6',
      status: 'Calibrating Laser Refraction in Room 202',
    },
    {
      id: 'peer-amara',
      name: 'Amara Diallo',
      archetype: 'nano-tech' as const,
      role: 'Nanomaterials Engineering',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
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
      photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'faculty-alvarez',
      name: 'Dr. Mateo Alvarez',
      title: 'Head of Orbital Mechanics & Astrophysics',
      specialty: 'Keplerian Orbits & Relativistic Astrophysics',
      photoUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=800&q=80',
    },
  ],
};
