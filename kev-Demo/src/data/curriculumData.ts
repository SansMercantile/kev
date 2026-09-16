import { Course } from '../types';

export const COURSES: Course[] = [
  {
    id: 'course-chem-101',
    title: 'Molecular Architecture & Chemical Synthesis',
    category: 'Chemistry',
    gradeLevel: 'Grades 6–10',
    durationMinutes: 45,
    associatedLab: 'chemistry',
    iconName: 'FlaskConical',
    color: 'from-cyan-500 to-blue-600',
    summary: 'Construct 3D molecular bonds, predict VSEPR bond angles, analyze electronegativity dipoles, and simulate exothermic reactions in real time.',
    lessons: [
      {
        id: 'chem-l1',
        title: 'VSEPR Theory & 3D Spatial Geometry',
        estimatedMinutes: 15,
        overview: 'Examine why molecules are not flat drawings on paper. Explore how valence electron pairs repel each other to establish 3D tetrahedral, trigonal planar, and bent configurations.',
        objectives: [
          'Identify non-bonding lone electron pairs and their steric influence',
          'Explain why water (H2O) has a 104.5° angle while methane (CH4) has 109.5°',
          'Synthesize custom molecules in the 3D Virtual Chem Lab'
        ],
        keyTerms: [
          { term: 'VSEPR Theory', definition: 'Valence Shell Electron Pair Repulsion: model predicting 3D molecular geometry based on electron repulsion.' },
          { term: 'Electronegativity', definition: 'The tendency of an atom to attract shared electrons in a covalent chemical bond.' },
          { term: 'Dipole Moment', definition: 'A measurement of the separation of two opposite electrical charges across a molecule.' }
        ],
        labTask: 'Switch between H2O and CH4 in the 3D Chem Lab. Increase thermal kinetic energy and observe how bond vibrations behave under heat.',
        quizQuestions: [
          {
            id: 'q-chem-1',
            question: 'Why is a water molecule (H2O) bent at ~104.5° rather than linear at 180°?',
            options: [
              'Hydrogen atoms are magnetically attracted to each other',
              'Oxygen has two non-bonding lone pairs that exert strong electrostatic repulsion on the bonded pairs',
              'Gravity pulls the two hydrogen atoms downward in 3D space',
              'Covalent bonds are naturally curved springs'
            ],
            correctIndex: 1,
            explanation: 'Oxygen has 6 valence electrons: 2 form bonds with Hydrogen and 4 exist as two lone pairs. These bulky electron clouds push the bonding pairs closer together.'
          },
          {
            id: 'q-chem-2',
            question: 'What is the 3D molecular geometry of Methane (CH4)?',
            options: [
              'Square planar',
              'Trigonal bipyramidal',
              'Tetrahedral (109.5° bond angle)',
              'Octahedral'
            ],
            correctIndex: 2,
            explanation: 'With 4 identical C-H single bonds and zero lone pairs on carbon, the four hydrogen atoms position themselves maximally distant in a 3D tetrahedron.'
          }
        ]
      },
      {
        id: 'chem-l2',
        title: 'Exothermic Reactions & Bond Energy Bursts',
        estimatedMinutes: 20,
        overview: 'Simulate the combustion of hydrocarbons. Calculate activation energy and observe energetic molecular collisions that break reactants and form stable products.',
        objectives: [
          'Trigger collision synthesis reactions in the XR Lab',
          'Differentiate between exothermic and endothermic molecular rearrangements',
          'Measure energy release in simulated joules'
        ],
        keyTerms: [
          { term: 'Activation Energy (Ea)', definition: 'The minimum energy required to initiate a chemical reaction.' },
          { term: 'Exothermic', definition: 'A reaction that releases energy to its surroundings, often as heat or light.' }
        ],
        labTask: 'Select Methane (CH4) or Glucose in the lab, activate "Reaction Simulation", and record the resulting temperature and particle burst.',
        quizQuestions: [
          {
            id: 'q-chem-3',
            question: 'In the combustion of methane (CH4 + 2O2 -> CO2 + 2H2O), why is energy released?',
            options: [
              'New atoms are created during the collision',
              'The bonds formed in CO2 and H2O are stronger and at lower potential energy than the reactant bonds',
              'Electrons disappear into thermal radiation',
              'The activation energy is permanently stored in the hydrogen'
            ],
            correctIndex: 1,
            explanation: 'Bond making releases energy. Forming the strong C=O and O-H bonds releases far more energy than was absorbed to break the initial C-H and O=O bonds.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-astro-101',
    title: 'Gravitational Astrophysics & Orbital Dynamics',
    category: 'Physics',
    gradeLevel: 'Grades 7–12',
    durationMinutes: 50,
    associatedLab: 'astrophysics',
    iconName: 'Orbit',
    color: 'from-violet-500 to-indigo-600',
    summary: 'Master Keplerian orbital mechanics, calculate gravitational forces with Newton’s inverse-square law, and simulate gravitational slingshots in 3D.',
    lessons: [
      {
        id: 'astro-l1',
        title: 'Kepler’s Laws & N-Body Gravitational Physics',
        estimatedMinutes: 25,
        overview: 'Step into space with real-time 3D orbital physics. See how planetary orbits form ellipses with the central star at one focus, and observe velocity changes at perihelion.',
        objectives: [
          'Demonstrate Kepler’s 2nd Law: equal area swept in equal time',
          'Experiment with orbital velocity vectors and stable circularization',
          'Simulate gravitational perturbation with a rogue asteroid flyby'
        ],
        keyTerms: [
          { term: 'Perihelion', definition: 'The point in the orbit of a planet where it is nearest to the sun.' },
          { term: 'Aphelion', definition: 'The point in the orbit of a planet where it is farthest from the sun.' },
          { term: 'Escape Velocity', definition: 'The minimum speed an object must achieve to break free of a gravitational body without further propulsion.' }
        ],
        labTask: 'Open the Astrophysics Lab. Boost Earth’s tangential velocity by 30% and observe the eccentricity change from nearly circular to a steep ellipse or escape trajectory.',
        quizQuestions: [
          {
            id: 'q-astro-1',
            question: 'According to Kepler’s Second Law, when does a planet travel fastest in its orbit?',
            options: [
              'When it is farthest from the star (Aphelion)',
              'When it is closest to the star (Perihelion)',
              'Velocity remains strictly constant everywhere',
              'Only during solar equinoxes'
            ],
            correctIndex: 1,
            explanation: 'Gravitational attraction is inversely proportional to distance squared. Close to the star, gravitational force accelerates the planet to its highest orbital speed.'
          },
          {
            id: 'q-astro-2',
            question: 'What happens if an orbiting body’s velocity vector drops to zero?',
            options: [
              'It floats indefinitely at that coordinate',
              'It falls directly into the central star under gravitational attraction',
              'It begins spinning backwards like a top',
              'Centrifugal force pushes it into outer space'
            ],
            correctIndex: 1,
            explanation: 'An orbit is essentially "falling and missing the ground" because of sideways velocity. With zero tangential speed, gravity pulls it straight into the primary mass.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-bio-101',
    title: 'Cellular Architecture & Genomics XR',
    category: 'Biology',
    gradeLevel: 'Grades 6–11',
    durationMinutes: 40,
    associatedLab: 'biology',
    iconName: 'Dna',
    color: 'from-emerald-500 to-teal-600',
    summary: 'Dissect a living eukaryotic cell in 3D, inspect ATP generation in mitochondria, and zoom into the DNA double helix to test mRNA transcription.',
    lessons: [
      {
        id: 'bio-l1',
        title: 'Organelle Specialization & ATP Synthesis',
        estimatedMinutes: 20,
        overview: 'Explore the miniature metropolis of a cell. Isolate mitochondria, endoplasmic reticulum, and the nucleus in 3D X-Ray mode to understand cellular division of labor.',
        objectives: [
          'Locate and identify 7 core organelles in a 3D eukaryotic cell',
          'Describe how the mitochondrial inner membrane cristae maximizes ATP production',
          'Investigate how the nucleus protects genetic information'
        ],
        keyTerms: [
          { term: 'Mitochondria', definition: 'Double-membrane organelle responsible for generating adenosine triphosphate (ATP).' },
          { term: 'Ribosome', definition: 'Molecular machine that synthesizes proteins by translating messenger RNA.' },
          { term: 'Transcription', definition: 'The process of copying a segment of DNA into RNA by RNA polymerase.' }
        ],
        labTask: 'Enter the Cellular Biology Lab, select the Mitochondria, activate the ATP pulse, and then zoom into the DNA Double Helix to examine the base pairing.',
        quizQuestions: [
          {
            id: 'q-bio-1',
            question: 'Which nucleotide base pairs specifically with Adenine (A) in double-stranded DNA?',
            options: ['Cytosine (C)', 'Guanine (G)', 'Thymine (T)', 'Uracil (U)'],
            correctIndex: 2,
            explanation: 'In DNA, Adenine (A) forms two hydrogen bonds with Thymine (T), while Cytosine (C) forms three hydrogen bonds with Guanine (G).'
          },
          {
            id: 'q-bio-2',
            question: 'Why is the inner membrane of mitochondria folded into cristae?',
            options: [
              'To prevent the cell from collapsing under pressure',
              'To drastically increase surface area for the electron transport chain and ATP synthesis',
              'To store excess glucose crystals',
              'To repel viral particles'
            ],
            correctIndex: 1,
            explanation: 'The extensive folding into cristae multiplies the surface area, allowing thousands of ATP synthase enzymes to operate concurrently.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-optics-101',
    title: 'Quantum Optics, Snell’s Law & Wave Dispersion',
    category: 'Optics',
    gradeLevel: 'Grades 8–12',
    durationMinutes: 40,
    associatedLab: 'optics',
    iconName: 'Sparkles',
    color: 'from-amber-500 to-rose-600',
    summary: 'Fire precision 3D lasers through geometric glass prisms. Observe refractive indices, calculate critical angles, and witness white light split into rainbow spectrums.',
    lessons: [
      {
        id: 'optics-l1',
        title: 'Refraction & Total Internal Reflection',
        estimatedMinutes: 20,
        overview: 'Understand how light waves bend when entering denser media. Calculate Snell’s Law angles and witness total internal reflection—the foundation of high-speed fiber optics.',
        objectives: [
          'Verify Snell’s Law: n1 * sin(θ1) = n2 * sin(θ2)',
          'Discover the critical angle where refraction transitions into 100% internal reflection',
          'Explain chromatic dispersion and why violet light bends more than red light'
        ],
        keyTerms: [
          { term: 'Refractive Index (n)', definition: 'The ratio of the speed of light in a vacuum to its speed in the medium (n = c / v).' },
          { term: 'Total Internal Reflection (TIR)', definition: 'Complete reflection of a ray of light within a medium such as water or glass from the surrounding surfaces back into the medium.' },
          { term: 'Dispersion', definition: 'The separation of white light into a spectrum of colors due to wavelength-dependent refraction.' }
        ],
        labTask: 'In the Optics Lab, adjust the laser angle past the critical angle (~41.8° in crown glass) to trigger Total Internal Reflection.',
        quizQuestions: [
          {
            id: 'q-opt-1',
            question: 'When light passes from air (n=1.0) into glass (n=1.5), what happens to its speed and direction?',
            options: [
              'Speed increases and it bends away from the normal',
              'Speed slows down and it bends toward the normal line',
              'Speed stays the same but the color changes',
              'The wave disappears entirely'
            ],
            correctIndex: 1,
            explanation: 'Because glass is optically denser, the phase velocity of the wave slows down, causing the wavefront to pivot inward toward the perpendicular normal line.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-kev-ai',
    title: 'Digital Citizenship & Responsible AI in Science',
    category: 'AI & Digital',
    gradeLevel: 'All Grades & Educators',
    durationMinutes: 30,
    associatedLab: 'chemistry',
    iconName: 'ShieldCheck',
    color: 'from-sky-500 to-indigo-500',
    summary: 'KEV XR Science Academy framework: Navigating digital scientific tools, validating AI simulations, critical inquiry, and ethical technological stewardship (https://kev.sansmercantile.com/).',
    lessons: [
      {
        id: 'ai-l1',
        title: 'Scientific Validation & AI Lab Collaboration',
        estimatedMinutes: 15,
        overview: 'AI models and simulations provide extraordinary exploratory power, but human verification is essential. Learn how to interrogate computer models and cross-reference physical empirical data.',
        objectives: [
          'Identify the role and boundaries of computer simulations in STEM',
          'Use Socratic questioning with Professor KEV to verify hypothesis predictions',
          'Practice ethical data recording in digital lab notebooks'
        ],
        keyTerms: [
          { term: 'Empirical Verification', definition: 'Validating conclusions through verifiable physical observation and experimentation.' },
          { term: 'Algorithmic Model', definition: 'A mathematical simplification of physical reality programmed for interactive testing.' }
        ],
        labTask: 'Consult the AI Lab Tutor for a hypothesis on orbital decay, then run the simulation to check whether the AI’s prediction matches real physics.',
        quizQuestions: [
          {
            id: 'q-ai-1',
            question: 'Why should scientists and students verify computer-simulated results?',
            options: [
              'Computers never make calculations correctly',
              'Simulations rely on underlying mathematical assumptions that may simplify complex real-world variables',
              'Physical laws only apply outside computers',
              'Simulations are only meant for entertainment'
            ],
            correctIndex: 1,
            explanation: 'Computer models are representations of physical laws. Sound scientific methodology requires testing theoretical predictions against empirical reality.'
          }
        ]
      }
    ]
  }
];
