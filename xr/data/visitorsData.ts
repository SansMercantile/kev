import {
  CampusFloorTheme,
  FloorArchitectureFacility,
  HistoricLibraryTreatise,
  AcademyVirtualToolItem,
  AcademyToolSkinItem,
  AdmissionApplication,
} from '../types';

export const CAMPUS_FLOOR_THEMES: CampusFloorTheme[] = [
  {
    level: 'basement',
    levelDisplayName: 'Basement Level (B1)',
    themeAndSubject: 'Physical Education & Sport',
    order: -1,
    color: '#0d9488', // Teal
    badge: 'Athletics & Hydrodynamics',
    description: 'Advanced sports kinetic biomechanics, full Olympic gymnasium, and fluid hydrodynamic virtual aquatic training.',
    facilitiesCount: 2,
    facilities: [
      {
        id: 'fac-b1-gym',
        level: 'basement',
        levelDisplayName: 'Basement Level',
        facility: 'Main Gymnasium',
        type: 'gymnasium',
        capacity: 300,
        equipmentAndTools: [
          'sports_equipment',
          'scoreboard',
          'sound_system',
          'fitness_tracking',
          'sports_simulation',
          'performance_analysis'
        ],
        description: 'Multi-sport kinetic arena featuring real-time velocity capture, joint torque sensors, and basketball/volleyball biomechanics.',
        status: 'Open',
        interactivePreviewId: 'gym'
      },
      {
        id: 'fac-b1-pool',
        level: 'basement',
        levelDisplayName: 'Basement Level',
        facility: 'Swimming Pool (Virtual)',
        type: 'common_area',
        capacity: 50,
        equipmentAndTools: [
          'swimming_simulation',
          'water_physics',
          'safety_training'
        ],
        description: '50-meter Olympic virtual aquatic lanes simulating fluid drag coefficients, buoyant forces, and stroke efficiency analytics.',
        status: 'Open',
        interactivePreviewId: 'pool'
      }
    ]
  },
  {
    level: 'ground',
    levelDisplayName: 'Ground Level (G)',
    themeAndSubject: 'Commons, Administration, Library, Food Service',
    order: 0,
    color: '#0284c7', // Sky Blue
    badge: 'Welcome, Registry & Nutrition',
    description: 'Central portal hub: visitor reception, automated admissions desk, scientific repository library, and dietary culinary cafeteria.',
    facilitiesCount: 4,
    facilities: [
      {
        id: 'fac-g-entrance',
        level: 'ground',
        levelDisplayName: 'Ground Floor',
        facility: 'Main Entrance Hall',
        type: 'common_area',
        capacity: 200,
        equipmentAndTools: [
          'wheelchair_ramp',
          'elevator',
          'braille_signs'
        ],
        description: 'Grand accessible atrium welcoming students and families. Equipped with universal ramps, high-speed elevator access, and tactile braille wayfinding.',
        status: 'Open',
        interactivePreviewId: 'entrance'
      },
      {
        id: 'fac-g-reception',
        level: 'ground',
        levelDisplayName: 'Ground Floor',
        facility: 'Reception Office',
        type: 'office',
        capacity: 5,
        equipmentAndTools: [
          'virtual_computer',
          'communication_system',
          'student_database'
        ],
        description: 'Admissions and administration coordination suite. Handles student credentialing, parental inquiries, and live registration records.',
        status: 'Open',
        interactivePreviewId: 'reception'
      },
      {
        id: 'fac-g-cafeteria',
        level: 'ground',
        levelDisplayName: 'Ground Floor',
        facility: 'Main Cafeteria',
        type: 'cafeteria',
        capacity: 300,
        equipmentAndTools: [
          'virtual_menu',
          'nutrition_tracker',
          'dietary_preferences'
        ],
        description: 'Nutritional wellness hall serving allergen-filtered meals, custom dietary plans (Halal, Kosher, Vegan, Gluten-free), and metabolic tracking.',
        status: 'Open',
        interactivePreviewId: 'cafeteria'
      },
      {
        id: 'fac-g-library',
        level: 'ground',
        levelDisplayName: 'Ground Floor',
        facility: 'School Library',
        type: 'library',
        capacity: 150,
        equipmentAndTools: [
          'digital_catalog',
          'e_book_reader',
          'research_database',
          'virtual_librarian'
        ],
        description: 'Houses over 50,000 historical science volumes, peer-reviewed journals, and rare illuminated manuscripts including Newton’s Opticks.',
        status: 'Open',
        interactivePreviewId: 'library'
      }
    ]
  },
  {
    level: 'first',
    levelDisplayName: 'First Floor (L1)',
    themeAndSubject: 'Core academics — Mathematics, Science, Computing',
    order: 1,
    color: '#3b82f6', // Indigo Blue
    badge: 'Core STEM Foundations',
    description: 'Rigorous quantitative and experimental research suites hosting foundational mathematics, wet/dry science labs, and supercomputing pods.',
    facilitiesCount: 3,
    facilities: [
      {
        id: 'fac-l1-math',
        level: 'first',
        levelDisplayName: 'First Floor',
        facility: 'Mathematics Classroom A',
        type: 'classroom',
        capacity: 25,
        equipmentAndTools: [
          'smart_board',
          'virtual_calculator',
          'graphing_tools',
          'mathematica',
          'geogebra',
          'coding_environment'
        ],
        description: 'Interactive theorem proving suite equipped with dynamic Wolfram Mathematica engines, GeoGebra 3D coordinate graphs, and LaTeX scratchpads.',
        status: 'Active Session',
        interactivePreviewId: 'math'
      },
      {
        id: 'fac-l1-science',
        level: 'first',
        levelDisplayName: 'First Floor',
        facility: 'Science Laboratory A',
        type: 'laboratory',
        capacity: 20,
        equipmentAndTools: [
          'virtual_microscope',
          'chemistry_set',
          'physics_apparatus',
          'lab_simulation',
          'data_analysis',
          'safety_protocols'
        ],
        description: 'Multi-discipline experimental lab featuring precision analytical balances, optical benches, cryo-vials, and real-time stoichiometry trackers.',
        status: 'Open',
        interactivePreviewId: 'science'
      },
      {
        id: 'fac-l1-comp',
        level: 'first',
        levelDisplayName: 'First Floor',
        facility: 'Computer Lab A',
        type: 'computer_lab',
        capacity: 30,
        equipmentAndTools: [
          'virtual_computers',
          'servers',
          'networking_equipment',
          'coding_ide',
          'virtual_machines',
          'cloud_platforms'
        ],
        description: 'High-throughput computing cluster running containerized Linux VMs, Python/TypeScript IDEs, and parallel GPU simulation nodes.',
        status: 'Open',
        interactivePreviewId: 'computer'
      }
    ]
  },
  {
    level: 'second',
    levelDisplayName: 'Second Floor (L2)',
    themeAndSubject: 'Arts — Music, Visual Art, Dance',
    order: 2,
    color: '#ec4899', // Pink
    badge: 'Creative & Expressive Arts',
    description: 'Acoustically tuned sound stages, digital illustration studios, and motion-capture dance floors cultivating aesthetic mastery.',
    facilitiesCount: 3,
    facilities: [
      {
        id: 'fac-l2-music',
        level: 'second',
        levelDisplayName: 'Second Floor',
        facility: 'Music Room A',
        type: 'music_room',
        capacity: 25,
        equipmentAndTools: [
          'virtual_piano',
          'virtual_guitar',
          'recording_equipment',
          'music_composition',
          'audio_editing',
          'instrument_simulator'
        ],
        description: 'Full acoustic recording studio equipped with 88-key weighted MIDI keyboards, virtual synthesizers, and multi-track spatial mixing consoles.',
        status: 'Available for Tour',
        interactivePreviewId: 'music'
      },
      {
        id: 'fac-l2-art',
        level: 'second',
        levelDisplayName: 'Second Floor',
        facility: 'Art Studio A',
        type: 'art_studio',
        capacity: 20,
        equipmentAndTools: [
          'virtual_canvas',
          'digital_brushes',
          '3d_modeling_tools',
          'drawing_software',
          'color_palette',
          'art_history_database'
        ],
        description: 'Digital fine arts conservatory featuring pressure-sensitive spatial stylus input, procedural clay modeling, and color theory analyzers.',
        status: 'Open',
        interactivePreviewId: 'art'
      },
      {
        id: 'fac-l2-dance',
        level: 'second',
        levelDisplayName: 'Second Floor',
        facility: 'Dance Studio',
        type: 'common_area',
        capacity: 40,
        equipmentAndTools: [
          'mirrors',
          'sound_system',
          'flooring',
          'choreography_software',
          'movement_tracking',
          'performance_recording'
        ],
        description: 'Sprung hardwood dance floor equipped with 360-degree optical motion tracking, avatar choreography synchronization, and spatial surround sound.',
        status: 'Open',
        interactivePreviewId: 'dance'
      }
    ]
  },
  {
    level: 'third',
    levelDisplayName: 'Third Floor (L3)',
    themeAndSubject: 'Large-group instruction — Auditorium, Lecture Halls',
    order: 3,
    color: '#8b5cf6', // Violet
    badge: 'Keynote & Global Symposia',
    description: 'High-capacity tiered lecture theaters and holographic amphitheatres for school-wide assemblies, academic keynotes, and peer defenses.',
    facilitiesCount: 2,
    facilities: [
      {
        id: 'fac-l3-auditorium',
        level: 'third',
        levelDisplayName: 'Third Floor',
        facility: 'Main Auditorium',
        type: 'auditorium',
        capacity: 500,
        equipmentAndTools: [
          'stage',
          'sound_system',
          'lighting',
          'projection',
          'presentation_software',
          'live_streaming',
          'audience_interaction'
        ],
        description: '500-seat grand theater featuring 3D holographic center-stage projection, real-time multilingual captioning, and worldwide XR streaming.',
        status: 'Open',
        interactivePreviewId: 'auditorium'
      },
      {
        id: 'fac-l3-lecture',
        level: 'third',
        levelDisplayName: 'Third Floor',
        facility: 'Lecture Hall A',
        type: 'lecture_hall',
        capacity: 200,
        equipmentAndTools: [
          'lecture_podium',
          'projection_system',
          'microphone',
          'lecture_recording',
          'student_response_system',
          'digital_whiteboard'
        ],
        description: 'Tiered university-style amphitheater with student response clickers, live equation broadcast, and synchronized digital whiteboard arrays.',
        status: 'Active Session',
        interactivePreviewId: 'lecture'
      }
    ]
  },
  {
    level: 'roof',
    levelDisplayName: 'Roof Level (R)',
    themeAndSubject: 'Defined in enum; no facilities built yet',
    order: 4,
    color: '#64748b', // Slate
    badge: 'Future Expansion & Solar Terrace',
    description: 'Reserved sky deck earmarked for upcoming solar telemetry arrays, atmospheric weather balloons, and celestial telescope mounts.',
    facilitiesCount: 0,
    facilities: []
  }
];

export const ACADEMY_VIRTUAL_TOOLS: AcademyVirtualToolItem[] = [
  {
    id: 'tool-spec',
    name: 'Advanced Emission Spectrometer',
    discipline: 'chemistry',
    associatedLabId: 'chemistry',
    description: 'Deconstructs radiant molecular emissions into discrete quantum spectral lines. Maps Rydberg constant harmonics and element signatures.',
    precisionRating: '±0.02 nm Resolution',
    keyCapability: 'Real-time Fraunhofer absorption and emission lines analysis',
    iconName: 'Activity',
    defaultSkin: 'Spectrometer Obsidian'
  },
  {
    id: 'tool-telescope',
    name: 'High-Powered Cryo-Telescope',
    discipline: 'astrophysics',
    associatedLabId: 'astrophysics',
    description: 'Cooled infrared spatial sensor array capable of resolving deep exoplanetary transits and Keplerian orbital barycenter vectors.',
    precisionRating: '0.005 Arcsecond Astrometry',
    keyCapability: 'N-body relativistic trajectory tracking & Lagrange points',
    iconName: 'Orbit',
    defaultSkin: 'Laser Deep Space'
  },
  {
    id: 'tool-probe',
    name: 'Nanometer Electron Micro-Probe',
    discipline: 'biology',
    associatedLabId: 'biology',
    description: 'Sub-angstrom scanning probe with secondary electron detectors. Traverses cellular lipid membranes down to individual base pairs.',
    precisionRating: '0.12 nm Cryo-EM Fidelity',
    keyCapability: 'Organelle cristae cross-sections & ATP Synthase rotor kinematics',
    iconName: 'Dna',
    defaultSkin: 'Pipette Carbon Weave'
  },
  {
    id: 'tool-refractometer',
    name: 'Holographic Laser Refractometer',
    discipline: 'optics',
    associatedLabId: 'optics',
    description: 'Precision coherent optical interferometer for measuring boundary refraction indices (n) and total internal reflection angles.',
    precisionRating: 'Δn = 0.0001 Index Precision',
    keyCapability: 'Snell’s Law critical angle calculation & chromatic dispersion',
    iconName: 'Zap',
    defaultSkin: 'Laser Quantum Gold'
  },
  {
    id: 'tool-tachymeter',
    name: 'Chrono-Velocity Doppler Tachymeter',
    discipline: 'multi-discipline',
    description: 'Universal temporal-spatial velocity gauge combining acoustic Doppler shift and relativistic time dilation measurements across all disciplines.',
    precisionRating: '±0.001 m/s Chronometry',
    keyCapability: 'Harmonic wave phase measurement & kinetic energy tracking',
    iconName: 'Gauge',
    defaultSkin: 'Bunsen Cyber Neon'
  }
];

export const ACADEMY_TOOL_SKINS: AcademyToolSkinItem[] = [
  {
    id: 'skin-bunsen-aurora',
    name: 'Bunsen Plasma Aurora',
    toolTarget: 'Bunsen Burner & Reagent Heaters',
    themeStyle: 'Iridescent Emerald & Cyan Ion Wave',
    previewColors: ['#10b981', '#06b6d4', '#3b82f6'],
    rarity: 'Epic',
    description: 'Radiates shimmering emerald and boreal cyan plasma filaments with ambient geomagnetic ionization effects.',
    visualEffectDescription: 'Thermal ionization particle swirls with northern lights ambient corona.',
    unlockedByDefault: true
  },
  {
    id: 'skin-bunsen-cyber',
    name: 'Bunsen Cyber Neon',
    toolTarget: 'Bunsen Burner & Reagent Heaters',
    themeStyle: 'Synthwave Magenta & Electric Indigo',
    previewColors: ['#f43f5e', '#a855f7', '#06b6d4'],
    rarity: 'Rare',
    description: 'Pulsing geometric vector lattice encased in high-frequency ultraviolet combustion coils.',
    visualEffectDescription: 'High-contrast neon grid lines with reactive audio pulse.',
    unlockedByDefault: true
  },
  {
    id: 'skin-laser-gold',
    name: 'Laser Quantum Gold',
    toolTarget: 'Optics Laser Emitters & Interferometers',
    themeStyle: 'Polished Imperial Gold & Solar Ray',
    previewColors: ['#f59e0b', '#fbbf24', '#fef08a'],
    rarity: 'Legendary',
    description: 'Forged from monolithic titanium with 24-karat gold optic mirrors and diamond-tuned harmonic frequency crystals.',
    visualEffectDescription: 'Golden coherent photon beam with crystalline lens glare.',
    unlockedByDefault: true
  },
  {
    id: 'skin-laser-space',
    name: 'Laser Deep Space',
    toolTarget: 'Optics Laser Emitters & Cryo-Telescope',
    themeStyle: 'Cosmic Nebula Violet & Stellar Stardust',
    previewColors: ['#4c1d95', '#8b5cf6', '#c084fc'],
    rarity: 'Epic',
    description: 'Deep matte twilight chassis flecked with miniature cosmic dust particles that absorb ambient stray light.',
    visualEffectDescription: 'Deep purple photon stream with trailing stellar micro-sparks.',
    unlockedByDefault: true
  },
  {
    id: 'skin-pipette-carbon',
    name: 'Pipette Carbon Weave',
    toolTarget: 'Nanometer Electron Micro-Probe & Pipettes',
    themeStyle: 'Ultralight Aero Carbon Fiber & Titanium',
    previewColors: ['#18181b', '#3f3f46', '#06b6d4'],
    rarity: 'Rare',
    description: 'Aerospace-grade 3K twill carbon fiber chassis with cyan calibrated volumetric laser etching.',
    visualEffectDescription: 'High-contrast matte carbon texture with cyan digital readouts.',
    unlockedByDefault: true
  },
  {
    id: 'skin-spec-obsidian',
    name: 'Spectrometer Obsidian',
    toolTarget: 'Advanced Emission Spectrometer',
    themeStyle: 'Volcanic Gloss Obsidian & Prism Gleam',
    previewColors: ['#09090b', '#27272a', '#f43f5e'],
    rarity: 'Legendary',
    description: 'Carved from monolithic reflective volcanic glass with internal chromatic prism baffles that maximize spectral contrast.',
    visualEffectDescription: 'Mirror-finish obsidian body with iridescent rainbow diffraction edge.',
    unlockedByDefault: true
  }
];

export const HISTORIC_LIBRARY_TREATISES: HistoricLibraryTreatise[] = [
  {
    id: 'treatise-opticks',
    title: 'Opticks: or, a Treatise of the Reflexions, Refractions, Inflexions and Colours of Light',
    author: 'Sir Isaac Newton',
    year: 1704,
    discipline: 'Optics',
    summary: 'Newton’s foundational treatise establishing that white light is a heterogeneous mixture of rays with differing refrangibilities (colors), verified through the classic prism experiment.',
    fullExcerpt: `"My design in this Book is not to explain the Properties of Light by Hypotheses, but to propose and prove them by Reason and Experiments: In order to which I shall premise the following Definitions and Axioms.\n\nDefinition I: By the Rays of Light I understand its least parts, and those as well Successive in the same Lines, as Contemporary in several Lines.\n\nDefinition II: Refrangibility of the Rays of Light, is their Disposition to be refracted or turned out of their Way in passing out of one transparent Body or Medium into another. And a greater or less Refrangibility of Rays, is their Disposition to be turned more or less out of their Way in like Incidences on the same Medium."`,
    historicalSignificance: 'First definitive empirical proof that color is intrinsic to light rather than a modification imparted by glass prism material.',
    modernXRLabConnection: 'Directly powers the Snell’s Law and Prism Refraction simulation on Floor 3 Optics Suite (Lab 302).',
    coverAccent: '#3b82f6'
  },
  {
    id: 'treatise-dna',
    title: 'Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid',
    author: 'J.D. Watson & F.H.C. Crick',
    year: 1953,
    discipline: 'Genetics',
    summary: 'The landmark 1953 Nature paper proposing the double-helix architecture of DNA, anchored by specific complementary base pairs (Adenine-Thymine, Guanine-Cytosine).',
    fullExcerpt: `"We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest...\n\nThe novel feature of the structure is the manner in which the two chains are held together by the purine and pyrimidine bases. The planes of the bases are perpendicular to the fibre axis. They are joined together in pairs, a single base from one chain being hydrogen-bonded to a single base from the other chain, so that the two lie side by side with identical z-co-ordinates...\n\nIt has not escaped our notice that the specific pairing we have postulated immediately suggests a possible copying mechanism for the genetic material."`,
    historicalSignificance: 'Unlocked the physical mechanism of heredity, replication, and modern genomics.',
    modernXRLabConnection: 'Explorable in 3D in Floor 4 Genomics & DNA Cleanroom (Lab 402) with interactive nucleotide base pairing.',
    coverAccent: '#10b981'
  },
  {
    id: 'treatise-kepler',
    title: 'Harmonices Mundi (The Harmony of the World)',
    author: 'Johannes Kepler',
    year: 1619,
    discipline: 'Astrophysics',
    summary: 'Presents Kepler’s Third Law of Planetary Motion: the square of the orbital period (P) of a planet is directly proportional to the cube of the semi-major axis (a) of its orbit (P² = a³).',
    fullExcerpt: `"It is most certain that the ratio of the periodic times of any two planets is precisely the sesquialteral proportion of their mean distances from the Sun...\n\nThat is, if one takes the periods, say of the Earth and Saturn, and squares them, and then cubes their mean distances, the ratios between the periods squared and the distances cubed are identical.\n\nNow, eighteen months after the first light, eight months after the dawn, but a few days after the full sun of the most wonderful study shone upon me: nothing holds me back; I yield to sacred frenzy."`,
    historicalSignificance: 'Unified planetary kinematic periods into an exact mathematical relationship that later led Isaac Newton to derive the Universal Law of Gravitation.',
    modernXRLabConnection: 'Integrated into the real-time orbital calculations of Floor 3 Gravitational Observatory (Lab 301).',
    coverAccent: '#8b5cf6'
  },
  {
    id: 'treatise-pauling',
    title: 'The Nature of the Chemical Bond and the Structure of Molecules and Crystals',
    author: 'Linus Pauling',
    year: 1939,
    discipline: 'Chemistry',
    summary: 'Pauling’s masterwork applying quantum mechanics to chemistry: introduces electronegativity, resonance theory, orbital hybridization (sp, sp², sp³), and covalent geometry.',
    fullExcerpt: `"The chemical bond may be defined as that force which leads to an aggregate of atoms of sufficient stability to make it convenient for the chemist to consider it as an independent molecular species...\n\nWhen two atoms approach each other, their atomic orbitals overlap and combine to form localized molecular orbitals. In the case of carbon, the 2s and three 2p orbitals hybridize into four equivalent sp³ tetrahedral orbitals oriented toward the vertices of a regular tetrahedron at angles of 109° 28'."`,
    historicalSignificance: 'Transformed chemistry from empirical recipes into a predictive structural discipline governed by quantum geometry.',
    modernXRLabConnection: 'Serves as the foundation for the VSEPR 3D Molecular Simulation and bond angle engine in Floor 2 Chemistry Lab (Lab 201).',
    coverAccent: '#f59e0b'
  },
  {
    id: 'treatise-einstein',
    title: 'On a Heuristic View Concerning the Production and Transformation of Light',
    author: 'Albert Einstein',
    year: 1905,
    discipline: 'Quantum Physics',
    summary: 'Einstein’s Annus Mirabilis paper introducing the light quantum (photon), explaining the photoelectric effect where light transfers discrete energy packets E = hν.',
    fullExcerpt: `"It seems to me that the observations on black-body radiation, photoluminescence, the production of cathode rays by ultraviolet light and other phenomena involving the emission or transformation of light can be better understood on the assumption that the energy of light is distributed discontinuously in space...\n\nAccording to the assumption contemplated here, the energy of a light ray spreading out from a point is not continuously distributed over an increasing space, but consists of a finite number of energy quanta which are localized at points in space, which move without dividing, and which can be produced or absorbed only as complete units."`,
    historicalSignificance: 'Earned Einstein the 1921 Nobel Prize in Physics and laid the cornerstone of quantum mechanics.',
    modernXRLabConnection: 'Demonstrated in the monochromatic laser wavelength and photon stream models on Floor 3 Optics.',
    coverAccent: '#ec4899'
  }
];

export const SEEDED_ADMISSIONS_DATABASE: AdmissionApplication[] = [
  {
    id: 'adm-2026-001',
    studentId: 'KEV-STU-8421',
    applicationNumber: 'APP-2026-0914',
    submissionDate: '2026-03-12',
    status: 'Admitted - Official',
    student: {
      fullName: 'Alexandria Rivera',
      preferredName: 'Alex',
      dateOfBirth: '2008-04-18',
      genderOrPronouns: 'She/Her',
      gradeLevel: 'High School (9-12)',
      studyLevel: 'high',
      primaryInterests: ['Chemistry', 'Astrophysics', 'Quantum Optics'],
      priorExperienceLevel: 'Advanced',
      dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
      accessibilityNeeds: ['Large Font Screen Reader Support'],
      studentEmail: 'alex.rivera@kev-student.org',
      studentPhone: '+1 (555) 349-8821',
      intendedStartDate: 'Fall Term 2026'
    },
    guardian: {
      primaryGuardianName: 'Dr. Carlos Rivera',
      relationship: 'Father',
      guardianEmail: 'carlos.rivera@biotech-labs.org',
      guardianPhone: '+1 (555) 349-8820',
      occupation: 'Biomedical Research Director',
      residentialAddress: '742 Helix Way, Suite 400',
      city: 'San Francisco, CA',
      country: 'United States',
      timezone: 'America/Los_Angeles',
      emergencyContactName: 'Elena Rivera',
      emergencyRelationship: 'Mother',
      emergencyPhone: '+1 (555) 349-8825',
      notificationFrequency: 'weekly_summary',
      notificationChannels: ['email', 'sms'],
      vrUsageConsent: true,
      avatarAndPrivacyConsent: true,
      academicHonorCodeAgreed: true,
      digitalSignature: 'Carlos Rivera, M.D.',
      signatureDate: '2026-03-12'
    },
    assignedCampusFloor: 'Floor 1 (Core STEM) & Floor 2 (VSEPR Chemistry Wing)',
    assignedTutor: 'Dr. Evelyn Reed & Prof. KEV',
    virtualLockerNumber: 'Locker B-204',
    rfidPassCode: 'RFID-KEV-9912-GOLD',
    initialXPAwarded: 100,
    notes: 'Admitted with High Honors in Molecular Modeling.'
  },
  {
    id: 'adm-2026-002',
    studentId: 'KEV-STU-8422',
    applicationNumber: 'APP-2026-0915',
    submissionDate: '2026-03-13',
    status: 'Honor Scholar Admitted',
    student: {
      fullName: 'Siddharth Patel',
      preferredName: 'Sid',
      dateOfBirth: '2006-11-22',
      genderOrPronouns: 'He/Him',
      gradeLevel: 'University Undergraduate',
      studyLevel: 'university',
      primaryInterests: ['Astrophysics', 'Computer Science', 'Mathematics'],
      priorExperienceLevel: 'Honors Scholar',
      dietaryPreferences: ['Halal', 'Nut Allergy'],
      accessibilityNeeds: [],
      studentEmail: 'siddharth.patel@space-institute.edu',
      studentPhone: '+1 (555) 882-9014',
      intendedStartDate: 'Summer Accelerated 2026'
    },
    guardian: {
      primaryGuardianName: 'Sunita Patel',
      relationship: 'Mother',
      guardianEmail: 'sunita.patel@horizon-aerospace.com',
      guardianPhone: '+1 (555) 882-9010',
      occupation: 'Orbital Telemetry Systems Architect',
      residentialAddress: '108 Kepler Drive',
      city: 'Austin, TX',
      country: 'United States',
      timezone: 'America/Chicago',
      emergencyContactName: 'Raj Patel',
      emergencyRelationship: 'Father',
      emergencyPhone: '+1 (555) 882-9011',
      notificationFrequency: 'milestones_only',
      notificationChannels: ['email'],
      vrUsageConsent: true,
      avatarAndPrivacyConsent: true,
      academicHonorCodeAgreed: true,
      digitalSignature: 'Sunita Patel',
      signatureDate: '2026-03-13'
    },
    assignedCampusFloor: 'Floor 3 (Astrophysics Observatory & Quantum Optics)',
    assignedTutor: 'Prof. Julian Thorne & Dr. Sophia Lin',
    virtualLockerNumber: 'Locker A-312',
    rfidPassCode: 'RFID-KEV-3012-PLAT',
    initialXPAwarded: 100,
    notes: 'Granted access to supercomputer N-body simulation cluster.'
  }
];

export const SUBJECTS_REGISTRY_METRICS = {
  totalAreas: 14,
  totalSpecializations: 176,
  totalTutorAgents: 872,
  areas: [
    { name: 'Social Studies', specializations: 13, agents: 90, color: '#f59e0b' },
    { name: 'Languages', specializations: 16, agents: 80, color: '#06b6d4' },
    { name: 'Music', specializations: 16, agents: 80, color: '#ec4899' },
    { name: 'Physical Education', specializations: 15, agents: 80, color: '#10b981' },
    { name: 'Arts', specializations: 13, agents: 75, color: '#f43f5e' },
    { name: 'Drama', specializations: 14, agents: 70, color: '#8b5cf6' },
    { name: 'Mathematics', specializations: 14, agents: 62, color: '#3b82f6' },
    { name: 'English', specializations: 12, agents: 60, color: '#6366f1' },
    { name: 'Science', specializations: 12, agents: 60, color: '#14b8a6' },
    { name: 'Computer Science', specializations: 11, agents: 55, color: '#0284c7' },
    { name: 'Vocational', specializations: 9, agents: 45, color: '#d97706' },
    { name: 'Business', specializations: 8, agents: 40, color: '#059669' },
    { name: 'Health', specializations: 8, agents: 40, color: '#e11d48' },
    { name: 'Emerging Fields', specializations: 7, agents: 35, color: '#7c3aed' }
  ]
};

export const AUTONOMOUS_AGENT_DOMAINS = [
  {
    domain: 'Education & Curriculum Alignment',
    agentCount: 35,
    role: 'Real-time diagnostic Socratic scaffolding, misconception detection, and adaptive remediation sequencing.',
    icon: 'GraduationCap'
  },
  {
    domain: 'Policy & Academic Governance',
    agentCount: 28,
    role: 'Accreditation compliance, FERPA/COPPA student privacy verification, and algorithmic assessment audits.',
    icon: 'ShieldCheck'
  },
  {
    domain: 'Mythic & Narrative Immersion',
    agentCount: 42,
    role: 'Orchestrates the 7-Sector Spaceship "Remainder Curriculum" campaign lore, dialogue trees, and discovery lore.',
    icon: 'Sparkles'
  },
  {
    domain: 'Multispecies & Ecological Systems',
    agentCount: 34,
    role: 'Simulates photosynthetic atrium biomes, ecosystem food webs, and bioenergetic microbial metabolic models.',
    icon: 'Leaf'
  },
  {
    domain: 'Dream & Subconscious Synthesis',
    agentCount: 45,
    role: 'Translates student creative thought experiments into 3D conceptual prototypes and spatial memory palaces.',
    icon: 'Brain'
  },
  {
    domain: 'Human Resources & Faculty Welfare',
    agentCount: 35,
    role: 'Coordinates faculty teaching loads, peer mentor matching, office hour schedules, and pedagogical wellness.',
    icon: 'Users'
  }
];

export const STUDY_LEVELS_INFO = [
  {
    level: 'elementary',
    name: 'Elementary (K-5)',
    description: 'Foundational tactile science, basic numeracy, spatial geometry blocks, and natural world wonder.',
    badge: 'Seedling Scholar',
    color: '#10b981'
  },
  {
    level: 'middle',
    name: 'Middle School (6-8)',
    description: 'Introductory algebra, cell biology dissection, basic atomic models, and optical ray tracing.',
    badge: 'Apprentice Investigator',
    color: '#0284c7'
  },
  {
    level: 'high',
    name: 'High School (9-12)',
    description: 'AP/IB level VSEPR molecular chemistry, N-body gravitation, wave optics, and cell bioenergetics.',
    badge: 'Lead Researcher',
    color: '#8b5cf6'
  },
  {
    level: 'university',
    name: 'University Undergraduate',
    description: 'Relativistic physics, quantum mechanics, organic molecular synthesis, and genomics sequencing.',
    badge: 'Collegiate Fellow',
    color: '#f59e0b'
  },
  {
    level: 'professional',
    name: 'Professional & Graduate',
    description: 'Frontier research simulation, dissertation experiments, cross-disciplinary patents, and peer review.',
    badge: 'Principal Investigator',
    color: '#ec4899'
  }
];

export const UI_LANGUAGE_BUNDLES = [
  { code: 'en', name: 'English', native: 'English', region: 'Global Academic Standard' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', region: 'Southern Africa' },
  { code: 'es', name: 'Spanish', native: 'Español', region: 'Ibero-America & Global' },
  { code: 'fr', name: 'French', native: 'Français', region: 'Francophonie & Europe' },
  { code: 'xh', name: 'isiXhosa', native: 'isiXhosa', region: 'Eastern Cape & Western Cape' },
  { code: 'zu', name: 'isiZulu', native: 'isiZulu', region: 'KwaZulu-Natal & Southern Africa' }
];
