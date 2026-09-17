// Static campus floors mirror (offline fallback).
//
// MIRROR of backend FLOORS in kev/backend/xr_academy.py — update together.
// Used when /xr/campus/floors is unreachable (cached copy preferred; this
// bundle guarantees the 3D campus still renders rooms offline).

export interface StaticFacility {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  associatedLabId?: string;
  tutorInResidence?: string;
  description: string;
  interactActionLabel: string;
  coordinates: { x: number; z: number };
}

export interface StaticFloor {
  floorNumber: number;
  name: string;
  subtitle: string;
  color: string;
  facilities: StaticFacility[];
}

export const STATIC_FLOORS: StaticFloor[] = [
  {
    floorNumber: 1,
    name: 'Ground Floor: Grand Atrium & Commons',
    subtitle: 'Welcome Center, Digital Science Gallery, Student Commons & Innovation Hub',
    color: '#06b6d4',
    facilities: [
      { id: 'fac-101', roomNumber: 'Room 101', name: 'Main Reception & XR Hologram Kiosk', type: 'reception', tutorInResidence: 'dr-ward', description: 'Check in for daily STEM tracks, calibrate VR headsets, and access campus floor directories.', interactActionLabel: 'Visit Reception Kiosk', coordinates: { x: 0, z: -8 } },
      { id: 'fac-102', roomNumber: 'Room 102', name: 'Digital Science Exhibition Gallery', type: 'gallery', tutorInResidence: 'prof-kev', description: 'Interactive holographic exhibits showcasing landmark discoveries in physics, chemistry, and genetics.', interactActionLabel: 'Tour Science Exhibits', coordinates: { x: 12, z: -4 } },
      { id: 'fac-103', roomNumber: 'Room 103', name: 'Student Innovation Lounge & Study Pods', type: 'lounge', description: 'Collaborative peer space equipped with spatial displays, high-speed terminal stations, and science journals.', interactActionLabel: 'Join Peer Study Pod', coordinates: { x: -12, z: -4 } },
      { id: 'fac-104', roomNumber: 'Room 104', name: 'Campus Courtyard & Botanical Bio-Garden', type: 'courtyard', description: 'Sunlit outdoor atrium with photosynthetic flora arrays and ambient seating for academic reflection.', interactActionLabel: 'Rest in Courtyard', coordinates: { x: 0, z: 12 } },
    ],
  },
  {
    floorNumber: 2,
    name: 'Second Floor: Chemistry & Molecular Sciences Wing',
    subtitle: 'VSEPR Geometry, Molecular Synthesis, Stoichiometry & Chemical Analysis',
    color: '#0284c7',
    facilities: [
      { id: 'fac-201', roomNumber: 'Lab 201', name: 'VSEPR Synthetic Chemistry Laboratory', type: 'lab', associatedLabId: 'chemistry', tutorInResidence: 'dr-reed', description: 'Full virtual chemical simulation suite: bond angles, molecular orbital visualization, and covalent synthesis.', interactActionLabel: 'Enter Chemistry Lab', coordinates: { x: -10, z: -6 } },
      { id: 'fac-202', roomNumber: 'Lab 202', name: 'Spectrometry & Analytical Chemistry Suite', type: 'lab', associatedLabId: 'chemistry', description: 'Infrared, NMR, and mass spectrometry analysis benches for molecular identification.', interactActionLabel: 'Inspect Spectrometers', coordinates: { x: 10, z: -6 } },
      { id: 'fac-203', roomNumber: 'Suite 203', name: 'Chemical Reagent Vault & Fume Hoods', type: 'cleanroom', description: 'Hazard-free virtual reagent synthesis stations with automated safety and reaction kinetics tracking.', interactActionLabel: 'Access Reagent Vault', coordinates: { x: 12, z: 6 } },
      { id: 'fac-204', roomNumber: 'Office 204', name: "Dr. Evelyn Reed's Faculty Consultation Office", type: 'faculty_office', tutorInResidence: 'dr-reed', description: 'One-on-one Socratic guidance on valence electron repulsion and thermodynamic equilibrium.', interactActionLabel: 'Consult Dr. Reed', coordinates: { x: -12, z: 6 } },
    ],
  },
  {
    floorNumber: 3,
    name: 'Third Floor: Astrophysics & Quantum Photonics Wing',
    subtitle: 'Keplerian Gravitational Dynamics, N-Body Orbits & Laser Wave Dispersion',
    color: '#8b5cf6',
    facilities: [
      { id: 'fac-301', roomNumber: 'Lab 301', name: 'Keplerian Astrophysics & Gravitational Observatory', type: 'observatory', associatedLabId: 'astrophysics', tutorInResidence: 'prof-thorne', description: 'N-body orbital mechanics laboratory with real-time vector gravity fields and relativistic geodesics.', interactActionLabel: 'Enter Astrophysics Lab', coordinates: { x: -10, z: -6 } },
      { id: 'fac-302', roomNumber: 'Lab 302', name: 'Quantum Optics & Laser Dispersion Suite', type: 'lab', associatedLabId: 'optics', tutorInResidence: 'dr-lin', description: 'Precision optical benches, tunable monochromatic lasers, prisms, and critical angle analyzers.', interactActionLabel: 'Enter Optics Lab', coordinates: { x: 10, z: -6 } },
      { id: 'fac-303', roomNumber: 'Room 303', name: 'Digital Planetarium & Solar Radiation Array', type: 'observatory', tutorInResidence: 'prof-thorne', description: 'Immersive hemispherical dome projecting cosmic microwave background and stellar evolution models.', interactActionLabel: 'Launch Planetarium', coordinates: { x: 0, z: 8 } },
      { id: 'fac-304', roomNumber: 'Suite 304', name: 'Theoretical Physics & Photonics Faculty Office', type: 'faculty_office', tutorInResidence: 'dr-lin', description: 'Faculty office for wave-particle duality, Snell law derivations, and celestial orbit math.', interactActionLabel: 'Consult Dr. Lin', coordinates: { x: -12, z: 6 } },
    ],
  },
  {
    floorNumber: 4,
    name: 'Fourth Floor: Genomics, Cellular Biology & Grand XR Auditorium',
    subtitle: 'Eukaryotic Organelles, DNA Transcription & Holographic Lecture Amphitheater',
    color: '#10b981',
    facilities: [
      { id: 'fac-401', roomNumber: 'Lab 401', name: 'Cellular Biology & Eukaryotic Organelle Lab', type: 'lab', associatedLabId: 'biology', tutorInResidence: 'dr-vance', description: 'High-magnification cryo-EM simulations, mitochondria ATP analysis, and nuclear pore inspection.', interactActionLabel: 'Enter Cellular Biology Lab', coordinates: { x: -10, z: -6 } },
      { id: 'fac-402', roomNumber: 'Lab 402', name: 'Genomics & DNA Double-Helix Sequencing Room', type: 'cleanroom', associatedLabId: 'biology', tutorInResidence: 'dr-vance', description: 'Interactive base-pair inspection (A-T, G-C), transcription machinery, and CRISPR mechanics.', interactActionLabel: 'Inspect DNA Helicase', coordinates: { x: 10, z: -6 } },
      { id: 'fac-403', roomNumber: 'Auditorium 403', name: 'Grand Holographic XR Auditorium', type: 'auditorium', tutorInResidence: 'prof-kev', description: '300-seat virtual amphitheater featuring live 3D holographic center-stage demonstrations and peer discussion.', interactActionLabel: 'Enter XR Auditorium', coordinates: { x: 0, z: 8 } },
      { id: 'fac-404', roomNumber: 'Office 404', name: 'Dean of XR Sciences & Faculty Headquarters', type: 'faculty_office', tutorInResidence: 'prof-kev', description: 'Academic leadership office for personalized curriculum development and honors mentorship.', interactActionLabel: 'Consult Professor KEV', coordinates: { x: 12, z: 6 } },
    ],
  },
];
