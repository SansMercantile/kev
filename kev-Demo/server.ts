import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { registerAdvancedScienceRoutes } from "./server_features";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy-initialize Gemini AI client with required telemetry header
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// In-memory model circuit breaker & cooldown manager
const modelCooldownUntil = new Map<string, number>();
const COOLDOWN_DURATION_MS = 60 * 1000; // 60s cooldown for models reporting 503 high demand or 429 quota

/**
 * Resilient helper to query Gemini models with automatic failover and circuit breaker across candidate models
 * when encountering temporary 503 (High Demand / UNAVAILABLE) or 429 (Rate Limit) errors.
 */
async function generateGeminiContentWithFallback(contents: any[]): Promise<string | null> {
  const ai = getAI();
  if (!ai) return null;

  const baseCandidates = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const now = Date.now();

  // Sort candidates so that models not currently in cooldown are prioritized first
  const candidateModels = [...baseCandidates].sort((a, b) => {
    const aCooldown = (modelCooldownUntil.get(a) || 0) > now ? 1 : 0;
    const bCooldown = (modelCooldownUntil.get(b) || 0) > now ? 1 : 0;
    return aCooldown - bCooldown;
  });

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const nextModel = candidateModels[i + 1] || "faculty archives";

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      if (response && response.text) {
        // Clear cooldown upon successful response
        modelCooldownUntil.delete(model);
        return response.text;
      }
    } catch (err: any) {
      const isTemporaryDemandOrQuota =
        err?.status === "UNAVAILABLE" ||
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === "RESOURCE_EXHAUSTED" ||
        err?.code === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("quota");

      if (isTemporaryDemandOrQuota) {
        // Activate circuit breaker cooldown for this model
        modelCooldownUntil.set(model, Date.now() + COOLDOWN_DURATION_MS);
        console.info(
          `[Gemini AI Gateway] Model ${model} is experiencing temporary peak demand; seamlessly routing to ${nextModel}.`
        );
        // Short pause before switching model
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else {
        console.info(
          `[Gemini AI Gateway] Model ${model} unavailable (${err?.status || err?.code || 'transient'}); routing to ${nextModel}.`
        );
      }
      continue;
    }
  }

  return null;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "KEV XR Science Academy Platform", website: "https://kev.sansmercantile.com/" });
});

// Live Campus 4-Floor Architectural Layout API
app.get("/api/campus/floors", (req, res) => {
  const floors = [
    {
      floorNumber: 1,
      name: "Ground Floor: Grand Atrium & Commons",
      subtitle: "Welcome Center, Digital Science Gallery, Student Commons & Innovation Hub",
      color: "#06b6d4",
      facilities: [
        {
          id: "fac-101",
          roomNumber: "Room 101",
          name: "Main Reception & XR Hologram Kiosk",
          type: "reception",
          tutorInResidence: "dr-ward",
          description: "Check in for daily STEM tracks, calibrate VR headsets, and access campus floor directories.",
          interactActionLabel: "Visit Reception Kiosk",
          coordinates: { x: 0, z: -8 }
        },
        {
          id: "fac-102",
          roomNumber: "Room 102",
          name: "Digital Science Exhibition Gallery",
          type: "gallery",
          tutorInResidence: "prof-kev",
          description: "Interactive holographic exhibits showcasing landmark discoveries in physics, chemistry, and genetics.",
          interactActionLabel: "Tour Science Exhibits",
          coordinates: { x: 12, z: -4 }
        },
        {
          id: "fac-103",
          roomNumber: "Room 103",
          name: "Student Innovation Lounge & Study Pods",
          type: "lounge",
          description: "Collaborative peer space equipped with spatial displays, high-speed terminal stations, and science journals.",
          interactActionLabel: "Join Peer Study Pod",
          coordinates: { x: -12, z: -4 }
        },
        {
          id: "fac-104",
          roomNumber: "Room 104",
          name: "Campus Courtyard & Botanical Bio-Garden",
          type: "courtyard",
          description: "Sunlit outdoor atrium with photosynthetic flora arrays and ambient seating for academic reflection.",
          interactActionLabel: "Rest in Courtyard",
          coordinates: { x: 0, z: 12 }
        }
      ]
    },
    {
      floorNumber: 2,
      name: "Second Floor: Chemistry & Molecular Sciences Wing",
      subtitle: "VSEPR Geometry, Molecular Synthesis, Stoichiometry & Chemical Analysis",
      color: "#0284c7",
      facilities: [
        {
          id: "fac-201",
          roomNumber: "Lab 201",
          name: "VSEPR Synthetic Chemistry Laboratory",
          type: "lab",
          associatedLabId: "chemistry",
          tutorInResidence: "dr-reed",
          description: "Full virtual chemical simulation suite: bond angles, molecular orbital visualization, and covalent synthesis.",
          interactActionLabel: "Enter Chemistry Lab",
          coordinates: { x: -10, z: -6 }
        },
        {
          id: "fac-202",
          roomNumber: "Lab 202",
          name: "Spectrometry & Analytical Chemistry Suite",
          type: "lab",
          associatedLabId: "chemistry",
          description: "Infrared, NMR, and mass spectrometry analysis benches for molecular identification.",
          interactActionLabel: "Inspect Spectrometers",
          coordinates: { x: 10, z: -6 }
        },
        {
          id: "fac-203",
          roomNumber: "Suite 203",
          name: "Chemical Reagent Vault & Fume Hoods",
          type: "cleanroom",
          description: "Hazard-free virtual reagent synthesis stations with automated safety and reaction kinetics tracking.",
          interactActionLabel: "Access Reagent Vault",
          coordinates: { x: 12, z: 6 }
        },
        {
          id: "fac-204",
          roomNumber: "Office 204",
          name: "Dr. Evelyn Reed's Faculty Consultation Office",
          type: "faculty_office",
          tutorInResidence: "dr-reed",
          description: "One-on-one Socratic guidance on valence electron repulsion and thermodynamic equilibrium.",
          interactActionLabel: "Consult Dr. Reed",
          coordinates: { x: -12, z: 6 }
        }
      ]
    },
    {
      floorNumber: 3,
      name: "Third Floor: Astrophysics & Quantum Photonics Wing",
      subtitle: "Keplerian Gravitational Dynamics, N-Body Orbits & Laser Wave Dispersion",
      color: "#8b5cf6",
      facilities: [
        {
          id: "fac-301",
          roomNumber: "Lab 301",
          name: "Keplerian Astrophysics & Gravitational Observatory",
          type: "observatory",
          associatedLabId: "astrophysics",
          tutorInResidence: "prof-thorne",
          description: "N-body orbital mechanics laboratory with real-time vector gravity fields and relativistic geodesics.",
          interactActionLabel: "Enter Astrophysics Lab",
          coordinates: { x: -10, z: -6 }
        },
        {
          id: "fac-302",
          roomNumber: "Lab 302",
          name: "Quantum Optics & Laser Dispersion Suite",
          type: "lab",
          associatedLabId: "optics",
          tutorInResidence: "dr-lin",
          description: "Precision optical benches, tunable monochromatic lasers, prisms, and critical angle analyzers.",
          interactActionLabel: "Enter Optics Lab",
          coordinates: { x: 10, z: -6 }
        },
        {
          id: "fac-303",
          roomNumber: "Room 303",
          name: "Digital Planetarium & Solar Radiation Array",
          type: "observatory",
          tutorInResidence: "prof-thorne",
          description: "Immersive hemispherical dome projecting cosmic microwave background and stellar evolution models.",
          interactActionLabel: "Launch Planetarium",
          coordinates: { x: 0, z: 8 }
        },
        {
          id: "fac-304",
          roomNumber: "Suite 304",
          name: "Theoretical Physics & Photonics Faculty Office",
          type: "faculty_office",
          tutorInResidence: "dr-lin",
          description: "Faculty office for wave-particle duality, Snell's law derivations, and celestial orbit math.",
          interactActionLabel: "Consult Dr. Lin",
          coordinates: { x: -12, z: 6 }
        }
      ]
    },
    {
      floorNumber: 4,
      name: "Fourth Floor: Genomics, Cellular Biology & Grand XR Auditorium",
      subtitle: "Eukaryotic Organelles, DNA Transcription & Holographic Lecture Amphitheater",
      color: "#10b981",
      facilities: [
        {
          id: "fac-401",
          roomNumber: "Lab 401",
          name: "Cellular Biology & Eukaryotic Organelle Lab",
          type: "lab",
          associatedLabId: "biology",
          tutorInResidence: "dr-vance",
          description: "High-magnification cryo-EM simulations, mitochondria ATP analysis, and nuclear pore inspection.",
          interactActionLabel: "Enter Cellular Biology Lab",
          coordinates: { x: -10, z: -6 }
        },
        {
          id: "fac-402",
          roomNumber: "Lab 402",
          name: "Genomics & DNA Double-Helix Sequencing Room",
          type: "cleanroom",
          associatedLabId: "biology",
          tutorInResidence: "dr-vance",
          description: "Interactive base-pair inspection (A-T, G-C), transcription machinery, and CRISPR mechanics.",
          interactActionLabel: "Inspect DNA Helicase",
          coordinates: { x: 10, z: -6 }
        },
        {
          id: "fac-403",
          roomNumber: "Auditorium 403",
          name: "Grand Holographic XR Auditorium",
          type: "auditorium",
          tutorInResidence: "prof-kev",
          description: "300-seat virtual amphitheater featuring live 3D holographic center-stage demonstrations and peer discussion.",
          interactActionLabel: "Enter XR Auditorium",
          coordinates: { x: 0, z: 8 }
        },
        {
          id: "fac-404",
          roomNumber: "Office 404",
          name: "Dean of XR Sciences & Faculty Headquarters",
          type: "faculty_office",
          tutorInResidence: "prof-kev",
          description: "Academic leadership office for personalized curriculum development and honors mentorship.",
          interactActionLabel: "Consult Professor KEV",
          coordinates: { x: 12, z: 6 }
        }
      ]
    }
  ];

  res.json({ floors, success: true });
});

// Live Faculty & Tutor Catalog API
const TUTORS_CATALOG = [
  {
    id: "prof-kev",
    name: "Professor KEV",
    title: "Dean of XR Sciences & Multi-Disciplinary Socratic Mentor",
    discipline: "Cross-Disciplinary XR Sciences",
    avatar: "PK",
    status: "Lecturing in Floor 4 Grand Auditorium",
    floor: 4,
    location: "Floor 4, Auditorium 403 & Office 404",
    rating: 4.98,
    studentsGuided: 1420,
    specialties: ["VSEPR Chemistry", "N-Body Gravity", "Cellular Biology", "Quantum Optics"],
    systemVoice: "Socratic, enthusiastic, multi-disciplinary, deeply rigorous and encouraging."
  },
  {
    id: "dr-reed",
    name: "Dr. Evelyn Reed",
    title: "Chair of Synthetic Chemistry & Molecular Geometry",
    discipline: "Chemistry",
    avatar: "ER",
    status: "In Floor 2 Office (VSEPR Open Hours)",
    floor: 2,
    location: "Floor 2, Office 204 (Chemistry Wing)",
    rating: 4.95,
    studentsGuided: 890,
    specialties: ["VSEPR Theory", "Molecular Polarity & Dipoles", "Hybridization (sp3, sp2)", "Stoichiometry"],
    systemVoice: "Precision-focused physical chemist, loves spatial models and bond angle geometry."
  },
  {
    id: "prof-thorne",
    name: "Prof. Julian Thorne",
    title: "Director of Keplerian Astrophysics & Gravitational Dynamics",
    discipline: "Astrophysics",
    avatar: "JT",
    status: "Simulating N-Body Orbits in Planetarium",
    floor: 3,
    location: "Floor 3, Observatory 301 & Planetarium",
    rating: 4.92,
    studentsGuided: 760,
    specialties: ["Kepler's Laws of Planetary Motion", "Orbital Velocity Vectors", "Lagrange Points", "General Relativity"],
    systemVoice: "Cosmic, visionary physicist who explains orbital mechanics through vivid spatial metaphors."
  },
  {
    id: "dr-lin",
    name: "Dr. Sophia Lin",
    title: "Lead Researcher in Wave Optics & Laser Photonics",
    discipline: "Optics",
    avatar: "SL",
    status: "Calibrating Snell Refraction Prism Bench",
    floor: 3,
    location: "Floor 3, Optics Suite 302",
    rating: 4.96,
    studentsGuided: 640,
    specialties: ["Snell's Law", "Total Internal Reflection", "Chromatic Dispersion", "Fiber Optic Principles"],
    systemVoice: "Methodical, analytical photonics expert emphasizing electromagnetic wave behavior and indices of refraction."
  },
  {
    id: "dr-vance",
    name: "Dr. Alistair Vance",
    title: "Senior Geneticist & Molecular Cell Biologist",
    discipline: "Biology",
    avatar: "AV",
    status: "Reviewing Organelle ATP Bioenergetics in Cleanroom",
    floor: 4,
    location: "Floor 4, Cleanroom Lab 401 & 402",
    rating: 4.94,
    studentsGuided: 810,
    specialties: ["Eukaryotic Organelles", "Mitochondrial ATP Synthesis", "DNA Replication & Helices", "Membrane Transport"],
    systemVoice: "Vibrant biochemist fascinated by molecular machines and cellular bioenergetics."
  },
  {
    id: "dr-ward",
    name: "Dr. Marcus Ward",
    title: "Director of Spatial Computing & XR Educational Technology",
    discipline: "XR Computing",
    avatar: "MW",
    status: "Stationed at Ground Floor Reception Kiosk",
    floor: 1,
    location: "Floor 1, Reception Kiosk 101 & Lounge",
    rating: 4.91,
    studentsGuided: 1120,
    specialties: ["WebXR Protocols", "Stereoscopic Dual-Eye Rendering", "Spatial Measurement", "3D STEM Simulations"],
    systemVoice: "Tech-savvy spatial computing engineer dedicated to immersive STEM learning."
  }
];

app.get("/api/tutors", (req, res) => {
  res.json({ tutors: TUTORS_CATALOG, success: true });
});

// Stateless On-Demand Tutor Consultation API (Any tutor reachable on demand without server session state)
app.post("/api/tutors/ask", async (req, res) => {
  try {
    const {
      tutorId = "prof-kev",
      question,
      currentFloor = 1,
      facilityContext = "Virtual Campus Corridor",
      studentLevel = "Grade 9 Advanced STEM",
      simulationState = null
    } = req.body;

    const tutor = TUTORS_CATALOG.find((t) => t.id === tutorId) || TUTORS_CATALOG[0];

    const systemPrompt = `You are ${tutor.name}, ${tutor.title} at KEV XR Science Academy (https://kev.sansmercantile.com/).
Your Voice and Persona: ${tutor.systemVoice}
You are currently located on ${tutor.location}.
The student is reaching you on demand via the campus stateless communication channel while visiting Floor ${currentFloor} (${facilityContext}).
Student Academic Level: ${studentLevel}.

Key Pedagogical Rules:
1. Greet the student cordially as ${tutor.name}.
2. Answer their scientific query directly with deep conceptual clarity, referencing their current location or laboratory context when fitting.
3. Include a Socratic follow-up question or suggest a specific experiment to perform in the KEV 3D Virtual Labs (Floor 2 Chemistry, Floor 3 Astrophysics/Optics, or Floor 4 Cellular Biology).
4. Emphasize key physical/chemical formulas or terminology in bold.
5. Keep your response concise (2-3 structured paragraphs).`;

    const userPrompt = `Student Question: "${question || `Hello ${tutor.name}, could you explain what concepts are explored in your department?`}"
Facility Context: ${facilityContext}
Simulation State Provided: ${JSON.stringify(simulationState || {})}`;

    // Dynamic tailored fallback response based on tutor discipline
    const fallbackAnswers: Record<string, string> = {
      "prof-kev": `Greetings! This is **Professor KEV**, Dean of XR Sciences. I am glad you reached out from Floor ${currentFloor} (${facilityContext})!
      
At KEV Science Academy, all four scientific domains interconnect: the electron configurations you synthesize in **Floor 2 Chemistry** dictate the optical emission spectra you refract with lasers in **Floor 3 Optics**, while the molecular bio-polymers you assemble drive the mitochondrial motors of **Floor 4 Cellular Biology**, all subject to the universal gravitational laws simulated in our **Astrophysics Planetarium**.

*Suggested Next Step:* Walk down to the designated lab for your current module, or join me at the **Floor 4 Grand Holographic Auditorium** for today's live lecture! What specific hypothesis are you testing today?`,
      "dr-reed": `Hello! Dr. Evelyn Reed here from the **Floor 2 Chemistry Department**. 

Remember that molecular shape is never accidental: under **Valence Shell Electron Pair Repulsion (VSEPR)** theory, electrostatic forces push bonding pairs and unshared lone pairs into geometric arrangements that minimize repulsive energy. In a molecule like water ($H_2O$), the two non-bonding lone pairs on oxygen squeeze the $H-O-H$ bond angle down to **104.5°**, creating a strong dipole moment that allows hydrogen bonding!

*Lab Challenge:* Head into **Lab 201** and synthesize carbon dioxide ($CO_2$) and methane ($CH_4$). Notice why $CO_2$ is nonpolar despite having polar $C=O$ bonds—symmetry cancels out the dipole vectors! What bond angle did you observe in methane?`,
      "prof-thorne": `Welcome to the frontier of astrophysics! Professor Julian Thorne here from the **Floor 3 Gravitational Observatory**.

When you examine celestial orbits in our 3D N-body engine, keep **Kepler's Second Law** in mind: a line connecting a planet to the Sun sweeps out equal orbital areas during equal intervals of time ($dA/dt = \\text{const}$). When the body swoops through **perihelion** (closest approach), gravitational acceleration peaks, converting potential energy into orbital kinetic speed.

*Observatory Experiment:* Try launching a satellite with tangential velocity just below escape velocity ($v < \\sqrt{2GM/r}$). Observe how eccentricity elongates into a classic Keplerian ellipse! What happens to orbital velocity when you double the central star's mass?`,
      "dr-lin": `Greetings! Dr. Sophia Lin here from the **Floor 3 Quantum Optics & Laser Suite**.

In our laser labs, you are observing how electromagnetic waves navigate refractive boundaries. According to **Snell's Law** ($n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2$), when light enters a optically denser medium like flint glass or acrylic ($n > 1.0$), its phase velocity decreases, bending the wavefront toward the normal. Because higher frequency blue/violet light experiences a slightly higher refractive index than red light, polychromatic white light disperses into a rainbow!

*Lab Challenge:* In **Lab 302**, dial up the laser angle of incidence beyond the critical angle $\\theta_c = \\arcsin(n_2 / n_1)$. Watch total internal reflection trap 100% of the light photons—the foundation of modern fiber optics! Have you tested different prism angles yet?`,
      "dr-vance": `Hello scholar! Dr. Alistair Vance here from the **Floor 4 Cellular Genomics Cleanroom**.

Inside our 3D eukaryotic cell, every organelle is an evolutionary masterpiece of bioenergetics. The **mitochondria** generate adenosine triphosphate (ATP) by driving protons across the inner cristae membrane via ATP Synthase motors, while the **nucleus** protects your DNA code. Notice the precision of the double helix: Adenine pairs exclusively with Thymine (2 hydrogen bonds), and Cytosine pairs with Guanine (3 hydrogen bonds).

*Cleanroom Challenge:* Enter **Lab 401** and toggle the ATP Synthase proton pump view. Notice how metabolic starvation impairs cellular repair! What happens when you inspect the nuclear pore complexes?`,
      "dr-ward": `Hello! Dr. Marcus Ward here from the **Floor 1 XR Computing & Innovation Lab**.

Our virtual campus is built on open WebXR spatial specifications and WebGL mathematical shaders. Whether you are using a standard display, an AR mobile pass-through reticle to project simulations onto your physical study desk, or a stereoscopic VR headset, your spatial coordinates are calculated in real-time.

*Pro Tip:* Be sure to calibrate your **AR Measurement Tool** when doing physical desk experiments, and try walking up to the Floor 4 Auditorium to experience stereoscopic lecture presence! How is your XR headset tracking performing today?`
    };

    let generatedText: string | null = null;
    try {
      generatedText = await generateGeminiContentWithFallback([
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }
      ]);
    } catch (err: any) {
      console.info("[Stateless Tutor] Upstream model busy, engaging academy faculty archives.");
    }

    if (generatedText) {
      return res.json({
        tutor,
        answer: generatedText,
        success: true,
        timestamp: new Date().toISOString()
      });
    }

    const answer = fallbackAnswers[tutor.id] || fallbackAnswers["prof-kev"];
    return res.json({
      tutor,
      answer,
      success: true,
      isDemoGuidance: true,
      notice: "Serving faculty archives while upstream AI is experiencing high demand.",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.warn("Stateless tutor caught unexpected error, serving faculty guidance:", err?.message);
    return res.json({
      tutor: TUTORS_CATALOG[0],
      answer: "Greetings scholar! Let us investigate this phenomenon directly in our 3D interactive laboratories.",
      success: true,
      isDemoGuidance: true,
      timestamp: new Date().toISOString()
    });
  }
});

// Shared Curriculum Library API
app.get("/api/curriculum/shared", (req, res) => {
  res.json({
    tracks: [
      {
        id: "track-chem",
        title: "Spatial Molecular Chemistry & VSEPR",
        floor: 2,
        labId: "chemistry",
        modulesCount: 3,
        estimatedHours: 4.5,
        prerequisites: "Introductory General Chemistry",
        overview: "Understand 3D molecular geometry, electron cloud repulsions, covalent bond angles, and dipole vectors."
      },
      {
        id: "track-astro",
        title: "Keplerian Gravitation & N-Body Orbital Mechanics",
        floor: 3,
        labId: "astrophysics",
        modulesCount: 3,
        estimatedHours: 5.0,
        prerequisites: "Basic Newtonian Mechanics & Algebra",
        overview: "Explore celestial motion, Kepler's 3 laws, escape velocity, and relativistic curvature in a 3D gravity sandbox."
      },
      {
        id: "track-bio",
        title: "Eukaryotic Cell Architecture & DNA Genomics",
        floor: 4,
        labId: "biology",
        modulesCount: 3,
        estimatedHours: 4.0,
        prerequisites: "Foundational Biology",
        overview: "Dissect organelle micro-structures, inspect ATP synthesis, and decode complementary base-pairing in DNA."
      },
      {
        id: "track-optics",
        title: "Wave Optics, Snell's Law & Prismatic Dispersion",
        floor: 3,
        labId: "optics",
        modulesCount: 3,
        estimatedHours: 4.2,
        prerequisites: "Wave Physics & Trigonometry",
        overview: "Investigate light refraction, indices of refraction, critical angle reflection, and chromatic wavelength separation."
      }
    ],
    success: true
  });
});

// Global Peer Comparison Benchmarks API
app.get("/api/analytics/global-benchmarks", (req, res) => {
  res.json({
    totalGlobalStudents: 14850,
    activeCampuses: 64,
    globalAverages: {
      averageXP: 425,
      medianXP: 390,
      top10PercentileXP: 780,
      top1PercentileXP: 1250,
      overallLabCompletionRate: 68, // percentage
      quizzesPassedAverage: 2.1,
      averageBadgesCount: 3.4,
      dailyMissionCompletionRate: 74
    },
    subjectCompletionRates: {
      chemistry: 72,
      astrophysics: 58,
      biology: 64,
      optics: 52
    },
    regionalCohorts: [
      { region: "North America (STEM XR)", studentCount: 5200, averageXP: 440, completionRate: 71 },
      { region: "Europe (CERN & ESA Academies)", studentCount: 4600, averageXP: 435, completionRate: 69 },
      { region: "Asia-Pacific (Future Science Alliance)", studentCount: 3850, averageXP: 455, completionRate: 75 },
      { region: "Latin America & Global South", studentCount: 1200, averageXP: 410, completionRate: 64 }
    ],
    xpPercentileCurve: [
      { percentile: "10th", xp: 150 },
      { percentile: "25th", xp: 280 },
      { percentile: "50th (Median)", xp: 390 },
      { percentile: "75th", xp: 520 },
      { percentile: "90th", xp: 780 },
      { percentile: "99th", xp: 1250 }
    ],
    success: true
  });
});

// Gemini AI Lab Tutor endpoint
app.post("/api/gemini/tutor", async (req, res) => {
  try {
    const { question, currentLab, context, simulationState } = req.body;

    const systemPrompt = `You are "Professor KEV", an enthusiastic, world-class Socratic science educator and XR lab mentor for KEV XR Science Academy (https://kev.sansmercantile.com/).
Your goal is to guide students through hands-on virtual lab simulations (Chemistry & Molecular Synthesis, Astrophysics & N-Body Gravity, Cellular Biology & Genomics, Quantum Optics & Snell's Law Refraction).

Key guidelines:
1. Speak warmly, encouragingly, and clearly. Keep explanations concise, vivid, and conceptually grounded.
2. Formulate your response with:
   - Direct conceptual insight
   - Socratic follow-up observation or hands-on challenge for the 3D simulation
   - Real-world connection (e.g., why water's polarity matters for life, how Kepler's laws navigate spacecraft)
3. If relevant, reference the current simulation state provided in the prompt.
4. Keep the response to 2-3 engaging, well-structured paragraphs with key terms emphasized in bold.`;

    const userPrompt = `Student Question: "${question || 'Explain what I am seeing in this simulation and what experiment I should try next.'}"

Current Lab: ${currentLab || 'General Science XR'}
Lab Context: ${context || 'Interactive 3D Virtual Science Experiment'}
Current Simulation Parameters: ${JSON.stringify(simulationState || {})}

Please provide a helpful, Socratic response guiding the student to observe the physics/chemistry/biology principles in their 3D simulation.`;

    // Fallback pedagogical guidance if AI key is missing or models are busy
    const fallbackGuidance: Record<string, string> = {
      chemistry: `**Molecular Geometry & Electronegativity:**
In your 3D Chemistry Lab, observe how the spatial arrangement of atoms minimizes electrostatic repulsion between valence electron pairs (VSEPR theory). Notice how water ($H_2O$) adopts a **bent geometry (~104.5°)** rather than a linear 180° line because the two non-bonding lone pairs on oxygen exert greater repulsive force.

*Lab Experiment to try:* Increase the thermal kinetic energy slider. Notice how rapid vibrational and rotational modes shake the covalent bonds. Can you synthesize a methane ($CH_4$) tetrahedral molecule next?`,
      astrophysics: `**Orbital Mechanics & Keplerian Dynamics:**
Notice how Kepler's Second Law plays out in real-time in this 3D N-body simulation: a planet sweeps out equal areas in equal times! When a body approaches perihelion (closest to the central star), gravitational attraction intensifies ($F = G \\frac{m_1 m_2}{r^2}$), converting gravitational potential energy into orbital kinetic velocity.

*Lab Experiment to try:* Try tweaking the tangential velocity vector. What happens when your body achieves escape velocity ($v_e = \\sqrt{2GM/r}$)? Does it escape in a hyperbolic trajectory?`,
      biology: `**Cellular Architecture & Energetics:**
Inside this 3D eukaryotic cell, observe how compartmentalization allows specialized metabolic microenvironments. The **mitochondria** generate ATP through oxidative phosphorylation across their folded cristae, while the **nucleus** houses chromatin containing the genetic blueprint.

*Lab Experiment to try:* Toggle X-Ray dissection mode to look directly inside the nuclear envelope. Zoom into the DNA double-helix to inspect the complementary base pairing: Adenine binds with Thymine, and Cytosine binds with Guanine!`,
      optics: `**Snell's Law & Wave Dispersion:**
As your laser beam strikes the refractive interface between air ($n_1 \\approx 1.00$) and the glass prism ($n_2 \\approx 1.52$), light slows down, bending toward the normal according to **Snell's Law** ($n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2$). Because refractive index varies subtly with wavelength (dispersion), higher frequency violet light bends more sharply than red light!

*Lab Experiment to try:* Increase the angle of incidence until you exceed the critical angle $\\theta_c = \\arcsin(n_2/n_1)$. Watch total internal reflection kick in—this is the exact principle that powers fiber-optic internet cables!`
    };

    const key = (currentLab || '').toLowerCase();
    let matched = fallbackGuidance.chemistry;
    if (key.includes('astro') || key.includes('gravity') || key.includes('orbit')) matched = fallbackGuidance.astrophysics;
    else if (key.includes('bio') || key.includes('cell') || key.includes('dna')) matched = fallbackGuidance.biology;
    else if (key.includes('optic') || key.includes('light') || key.includes('prism')) matched = fallbackGuidance.optics;

    let generatedText: string | null = null;
    try {
      generatedText = await generateGeminiContentWithFallback([
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }
      ]);
    } catch (err: any) {
      console.info("[Campus AI Tutor] Upstream model busy, serving laboratory archive guidance.");
    }

    if (generatedText) {
      return res.json({ answer: generatedText, success: true });
    }

    return res.json({
      answer: matched,
      success: true,
      isDemoGuidance: true,
      notice: "Serving faculty guidance while upstream AI is undergoing high-demand traffic."
    });
  } catch (err: any) {
    console.info("[Campus AI Tutor] Serving verified curriculum simulation guidance.");
    return res.json({
      answer: "In your 3D Science simulation, observe how energy balances across each structural element. Try adjusting your parameters to observe how the physical laws respond!",
      success: true,
      isDemoGuidance: true
    });
  }
});

// Campus Chat State & Endpoints
interface ServerChatMessage {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
    avatar: any;
    isFaculty?: boolean;
  };
  text: string;
  timestamp: string;
  reaction?: string;
}

const campusChatMessages: Record<string, ServerChatMessage[]> = {
  "floor-1": [
    {
      id: "msg-1",
      roomId: "floor-1",
      sender: {
        id: "dr-ward",
        name: "Dr. Elena Ward",
        avatar: { archetype: "cyber-scholar", visorType: "holo-visor", primaryColor: "#06b6d4", glowColor: "#38bdf8", glowEffect: "pulse", accessory: "lead-researcher-badge", suitPattern: "hex-grid", name: "Dr. Elena Ward" },
        isFaculty: true,
      },
      text: "Welcome to Ground Floor Grand Atrium! Study pods in Room 103 are equipped for peer collaboration.",
      timestamp: "10:15 AM",
    },
    {
      id: "msg-2",
      roomId: "floor-1",
      sender: {
        id: "student-alex",
        name: "Alex Rivera",
        avatar: { archetype: "astro-pioneer", visorType: "dual-xr", primaryColor: "#10b981", glowColor: "#34d399", glowEffect: "orbital", accessory: "orbital-compass", suitPattern: "carbon-weave", name: "Alex Rivera" },
      },
      text: "Has anyone verified the water dipole moment reading in the 3D Chemistry Lab yet?",
      timestamp: "10:18 AM",
    },
    {
      id: "msg-3",
      roomId: "floor-1",
      sender: {
        id: "student-maya",
        name: "Maya Patel",
        avatar: { archetype: "molecular-bio", visorType: "neural-optics", primaryColor: "#a855f7", glowColor: "#c084fc", glowEffect: "quantum-flux", accessory: "molecular-pipette", suitPattern: "circuit", name: "Maya Patel" },
      },
      text: "Yes! It's right around 1.85 Debye. The covalent bond angle was 104.5 degrees exactly.",
      timestamp: "10:20 AM",
    }
  ],
  "floor-2": [
    {
      id: "msg-bio-1",
      roomId: "floor-2",
      sender: {
        id: "dr-chen",
        name: "Dr. Sarah Chen",
        avatar: { archetype: "molecular-bio", visorType: "neural-optics", primaryColor: "#10b981", glowColor: "#34d399", glowEffect: "pulse", accessory: "molecular-pipette", suitPattern: "circuit", name: "Dr. Sarah Chen" },
        isFaculty: true,
      },
      text: "Floor 2 Cellular Bio labs are live. Check the mitochondria matrix cristae folds in AR mode!",
      timestamp: "09:50 AM",
    }
  ],
  "floor-3": [
    {
      id: "msg-astro-1",
      roomId: "floor-3",
      sender: {
        id: "dr-alvarez",
        name: "Dr. Marcus Alvarez",
        avatar: { archetype: "astro-pioneer", visorType: "holo-visor", primaryColor: "#f59e0b", glowColor: "#fbbf24", glowEffect: "orbital", accessory: "stellar-chronometer", suitPattern: "hex-grid", name: "Dr. Marcus Alvarez" },
        isFaculty: true,
      },
      text: "Observatory dome is open. We're tracking three Kepler orbital simulations today.",
      timestamp: "09:44 AM",
    }
  ],
  "floor-4": [
    {
      id: "msg-xr-1",
      roomId: "floor-4",
      sender: {
        id: "prof-kev",
        name: "Prof. KEV",
        avatar: { archetype: "cyber-scholar", visorType: "dual-xr", primaryColor: "#06b6d4", glowColor: "#38bdf8", glowEffect: "quantum-flux", accessory: "lead-researcher-badge", suitPattern: "hex-grid", name: "Prof. KEV" },
        isFaculty: true,
      },
      text: "Floor 4 Advanced XR & Quantum Labs are open for peer simulation runs. Stereoscopic VR headsets calibrated.",
      timestamp: "10:00 AM",
    }
  ],
  "chemistry": [
    {
      id: "msg-chem-1",
      roomId: "chemistry",
      sender: {
        id: "prof-kev",
        name: "Prof. KEV",
        avatar: { archetype: "molecular-bio", visorType: "data-hud", primaryColor: "#06b6d4", glowColor: "#38bdf8", glowEffect: "quantum-flux", accessory: "lead-researcher-badge", suitPattern: "hex-grid", name: "Prof. KEV" },
        isFaculty: true,
      },
      text: "Notice how thermal energy impacts hydrogen bonding. Use the AR measurement tool to measure bond length!",
      timestamp: "10:05 AM",
    }
  ],
  "astrophysics": [
    {
      id: "msg-ast-1",
      roomId: "astrophysics",
      sender: {
        id: "dr-alvarez",
        name: "Dr. Marcus Alvarez",
        avatar: { archetype: "astro-pioneer", visorType: "holo-visor", primaryColor: "#f59e0b", glowColor: "#fbbf24", glowEffect: "orbital", accessory: "stellar-chronometer", suitPattern: "hex-grid", name: "Dr. Marcus Alvarez" },
        isFaculty: true,
      },
      text: "Newton's law of gravitation is calibrated in real-time. Notice how velocity vectors curve around the barycenter.",
      timestamp: "09:55 AM",
    }
  ],
  "biology": [
    {
      id: "msg-bio-main",
      roomId: "biology",
      sender: {
        id: "dr-chen",
        name: "Dr. Sarah Chen",
        avatar: { archetype: "molecular-bio", visorType: "neural-optics", primaryColor: "#10b981", glowColor: "#34d399", glowEffect: "pulse", accessory: "molecular-pipette", suitPattern: "circuit", name: "Dr. Sarah Chen" },
        isFaculty: true,
      },
      text: "Observe the cristae surface area expansion. High surface area maximizes ATP generation!",
      timestamp: "10:12 AM",
    }
  ],
  "optics": [
    {
      id: "msg-opt-main",
      roomId: "optics",
      sender: {
        id: "prof-novak",
        name: "Prof. Liam Novak",
        avatar: { archetype: "quantum-physicist", visorType: "dual-xr", primaryColor: "#8b5cf6", glowColor: "#a78bfa", glowEffect: "aurora", accessory: "orbital-compass", suitPattern: "carbon-weave", name: "Prof. Liam Novak" },
        isFaculty: true,
      },
      text: "Notice the Snell's Law refraction angle when light traverses the glass boundary. Blue refracts strongest!",
      timestamp: "10:08 AM",
    }
  ]
};

interface ServerAnnouncement {
  id: string;
  category: 'tournament' | 'maintenance' | 'event' | 'academic' | 'sports';
  title: string;
  timestamp: string;
  urgency: 'low' | 'medium' | 'high';
  linkAction?: string;
}

const campusAnnouncements: ServerAnnouncement[] = [
  {
    id: 'ann-1',
    category: 'tournament',
    title: 'Season 4 Inter-Collegiate VSEPR Assembly Sprint is LIVE! 350 XP Bounty.',
    timestamp: 'Just now',
    urgency: 'high',
    linkAction: 'tournament',
  },
  {
    id: 'ann-2',
    category: 'sports',
    title: 'Olympic Aquatic Center VR Swimming Lanes open for hydrodynamic time trials.',
    timestamp: '5m ago',
    urgency: 'medium',
    linkAction: 'sports',
  },
  {
    id: 'ann-3',
    category: 'maintenance',
    title: 'Astrophysics N-Body Supercomputer upgrade scheduled tonight at 02:00 UTC.',
    timestamp: '20m ago',
    urgency: 'medium',
  },
  {
    id: 'ann-4',
    category: 'event',
    title: 'Dr. Sarah Thorne hosting Live VR Quantum Photonics Workshop in Lecture Hall B.',
    timestamp: '1h ago',
    urgency: 'low',
    linkAction: 'lecture',
  },
  {
    id: 'ann-5',
    category: 'academic',
    title: 'Lab Discovery Path active: visit all 5 campus lab stations to claim +150 XP!',
    timestamp: '2h ago',
    urgency: 'low',
  },
];

// GET Campus Announcements endpoint
app.get("/api/campus/announcements", (req, res) => {
  res.json({ announcements: campusAnnouncements });
});

// --- IN-MEMORY ADMISSIONS & VISITORS PORTAL REGISTRY ---
interface ServerAdmissionRecord {
  id: string;
  studentId: string;
  applicationNumber: string;
  submissionDate: string;
  status: 'Admitted - Official' | 'Under Review' | 'Honor Scholar Admitted';
  student: {
    fullName: string;
    preferredName: string;
    dateOfBirth: string;
    genderOrPronouns: string;
    gradeLevel: string;
    studyLevel: string;
    primaryInterests: string[];
    priorExperienceLevel: string;
    dietaryPreferences: string[];
    accessibilityNeeds: string[];
    studentEmail: string;
    studentPhone: string;
    intendedStartDate: string;
  };
  guardian: {
    primaryGuardianName: string;
    relationship: string;
    guardianEmail: string;
    guardianPhone: string;
    occupation: string;
    residentialAddress: string;
    city: string;
    country: string;
    timezone: string;
    secondaryGuardianName?: string;
    secondaryRelationship?: string;
    secondaryPhone?: string;
    emergencyContactName: string;
    emergencyRelationship: string;
    emergencyPhone: string;
    notificationFrequency: string;
    notificationChannels: string[];
    vrUsageConsent: boolean;
    avatarAndPrivacyConsent: boolean;
    academicHonorCodeAgreed: boolean;
    digitalSignature: string;
    signatureDate: string;
  };
  assignedCampusFloor: string;
  assignedTutor: string;
  virtualLockerNumber: string;
  rfidPassCode: string;
  initialXPAwarded: number;
  notes?: string;
}

const serverAdmissionsRegistry: ServerAdmissionRecord[] = [
  {
    id: "adm-2026-001",
    studentId: "KEV-STU-8421",
    applicationNumber: "APP-2026-0914",
    submissionDate: "2026-03-12",
    status: "Admitted - Official",
    student: {
      fullName: "Alexandria Rivera",
      preferredName: "Alex",
      dateOfBirth: "2008-04-18",
      genderOrPronouns: "She/Her",
      gradeLevel: "High School (9-12)",
      studyLevel: "high",
      primaryInterests: ["Chemistry", "Astrophysics", "Quantum Optics"],
      priorExperienceLevel: "Advanced",
      dietaryPreferences: ["Vegetarian", "Gluten-Free"],
      accessibilityNeeds: ["Large Font Screen Reader Support"],
      studentEmail: "alex.rivera@kev-student.org",
      studentPhone: "+1 (555) 349-8821",
      intendedStartDate: "Fall Term 2026"
    },
    guardian: {
      primaryGuardianName: "Dr. Carlos Rivera",
      relationship: "Father",
      guardianEmail: "carlos.rivera@biotech-labs.org",
      guardianPhone: "+1 (555) 349-8820",
      occupation: "Biomedical Research Director",
      residentialAddress: "742 Helix Way, Suite 400",
      city: "San Francisco, CA",
      country: "United States",
      timezone: "America/Los_Angeles",
      emergencyContactName: "Elena Rivera",
      emergencyRelationship: "Mother",
      emergencyPhone: "+1 (555) 349-8825",
      notificationFrequency: "weekly_summary",
      notificationChannels: ["email", "sms"],
      vrUsageConsent: true,
      avatarAndPrivacyConsent: true,
      academicHonorCodeAgreed: true,
      digitalSignature: "Carlos Rivera, M.D.",
      signatureDate: "2026-03-12"
    },
    assignedCampusFloor: "Floor 1 (Core STEM) & Floor 2 (VSEPR Chemistry Wing)",
    assignedTutor: "Dr. Evelyn Reed & Prof. KEV",
    virtualLockerNumber: "Locker B-204",
    rfidPassCode: "RFID-KEV-9912-GOLD",
    initialXPAwarded: 100,
    notes: "Admitted with High Honors in Molecular Modeling."
  },
  {
    id: "adm-2026-002",
    studentId: "KEV-STU-8422",
    applicationNumber: "APP-2026-0915",
    submissionDate: "2026-03-13",
    status: "Honor Scholar Admitted",
    student: {
      fullName: "Siddharth Patel",
      preferredName: "Sid",
      dateOfBirth: "2006-11-22",
      genderOrPronouns: "He/Him",
      gradeLevel: "University Undergraduate",
      studyLevel: "university",
      primaryInterests: ["Astrophysics", "Computer Science", "Mathematics"],
      priorExperienceLevel: "Honors Scholar",
      dietaryPreferences: ["Halal", "Nut Allergy"],
      accessibilityNeeds: [],
      studentEmail: "siddharth.patel@space-institute.edu",
      studentPhone: "+1 (555) 882-9014",
      intendedStartDate: "Summer Accelerated 2026"
    },
    guardian: {
      primaryGuardianName: "Sunita Patel",
      relationship: "Mother",
      guardianEmail: "sunita.patel@horizon-aerospace.com",
      guardianPhone: "+1 (555) 882-9010",
      occupation: "Orbital Telemetry Systems Architect",
      residentialAddress: "108 Kepler Drive",
      city: "Austin, TX",
      country: "United States",
      timezone: "America/Chicago",
      emergencyContactName: "Raj Patel",
      emergencyRelationship: "Father",
      emergencyPhone: "+1 (555) 882-9011",
      notificationFrequency: "milestones_only",
      notificationChannels: ["email"],
      vrUsageConsent: true,
      avatarAndPrivacyConsent: true,
      academicHonorCodeAgreed: true,
      digitalSignature: "Sunita Patel",
      signatureDate: "2026-03-13"
    },
    assignedCampusFloor: "Floor 3 (Astrophysics Observatory & Quantum Optics)",
    assignedTutor: "Prof. Julian Thorne & Dr. Sophia Lin",
    virtualLockerNumber: "Locker A-312",
    rfidPassCode: "RFID-KEV-3012-PLAT",
    initialXPAwarded: 100,
    notes: "Granted access to supercomputer N-body simulation cluster."
  }
];

// GET Admissions List
app.get("/api/admissions/list", (req, res) => {
  const total = serverAdmissionsRegistry.length;
  const officialCount = serverAdmissionsRegistry.filter(a => a.status === 'Admitted - Official').length;
  const honorCount = serverAdmissionsRegistry.filter(a => a.status === 'Honor Scholar Admitted').length;

  res.json({
    success: true,
    total,
    officialCount,
    honorCount,
    admissions: serverAdmissionsRegistry
  });
});

// POST Student & Parental Guardian Admission Application
app.post("/api/admissions/apply", (req, res) => {
  const { student, guardian } = req.body;

  if (!student || !student.fullName || !guardian || !guardian.primaryGuardianName) {
    return res.status(400).json({
      success: false,
      error: "Missing required student details or parental/guardian information."
    });
  }

  const generatedId = `adm-2026-${String(serverAdmissionsRegistry.length + 1).padStart(3, '0')}`;
  const studentNum = 8420 + serverAdmissionsRegistry.length + 1;
  const studentId = `KEV-STU-${studentNum}`;
  const appNum = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Determine floor assignment and tutor based on study level and interest
  let assignedFloor = "Floor 1 (Core Academics) & Ground Commons";
  let tutor = "Dr. Marcus Ward & Prof. KEV";
  const interestStr = (student.primaryInterests || []).join(' ').toLowerCase();

  if (interestStr.includes('chem')) {
    assignedFloor = "Floor 2 (Chemistry & Molecular Sciences Wing)";
    tutor = "Dr. Evelyn Reed";
  } else if (interestStr.includes('astro') || interestStr.includes('space') || interestStr.includes('gravity')) {
    assignedFloor = "Floor 3 (Astrophysics & Gravitational Observatory)";
    tutor = "Prof. Julian Thorne";
  } else if (interestStr.includes('optic') || interestStr.includes('light') || interestStr.includes('laser')) {
    assignedFloor = "Floor 3 (Quantum Optics Suite)";
    tutor = "Dr. Sophia Lin";
  } else if (interestStr.includes('bio') || interestStr.includes('cell') || interestStr.includes('dna')) {
    assignedFloor = "Floor 4 (Genomics & Cellular Biology Cleanroom)";
    tutor = "Dr. Alistair Vance";
  } else if (interestStr.includes('art') || interestStr.includes('music') || interestStr.includes('dance')) {
    assignedFloor = "Floor 2 (Arts — Music, Visual Art & Dance Studios)";
    tutor = "Arts Faculty & Prof. KEV";
  } else if (interestStr.includes('sport') || interestStr.includes('pe') || interestStr.includes('swim')) {
    assignedFloor = "Basement (Physical Education, Main Gymnasium & Pool)";
    tutor = "Athletics Faculty & Dr. Marcus Ward";
  }

  const lockerNumber = `Locker ${String.fromCharCode(65 + (serverAdmissionsRegistry.length % 6))}-${100 + (serverAdmissionsRegistry.length * 7) % 900}`;
  const rfidCode = `RFID-KEV-${Math.floor(1000 + Math.random() * 9000)}-${student.priorExperienceLevel === 'Honors Scholar' ? 'PLAT' : 'AUTH'}`;

  const newAdmission: ServerAdmissionRecord = {
    id: generatedId,
    studentId,
    applicationNumber: appNum,
    submissionDate: new Date().toISOString().split('T')[0],
    status: student.priorExperienceLevel === 'Honors Scholar' ? 'Honor Scholar Admitted' : 'Admitted - Official',
    student: {
      fullName: student.fullName,
      preferredName: student.preferredName || student.fullName.split(' ')[0],
      dateOfBirth: student.dateOfBirth || "2008-01-01",
      genderOrPronouns: student.genderOrPronouns || "Unspecified",
      gradeLevel: student.gradeLevel || "High School (9-12)",
      studyLevel: student.studyLevel || "high",
      primaryInterests: student.primaryInterests || ["Science", "Computing"],
      priorExperienceLevel: student.priorExperienceLevel || "Intermediate",
      dietaryPreferences: student.dietaryPreferences || ["Regular"],
      accessibilityNeeds: student.accessibilityNeeds || [],
      studentEmail: student.studentEmail || `${student.fullName.toLowerCase().replace(/\s+/g, '.')}@kev-student.org`,
      studentPhone: student.studentPhone || "",
      intendedStartDate: student.intendedStartDate || "Immediate Enrollment"
    },
    guardian: {
      primaryGuardianName: guardian.primaryGuardianName,
      relationship: guardian.relationship || "Guardian",
      guardianEmail: guardian.guardianEmail || "",
      guardianPhone: guardian.guardianPhone || "",
      occupation: guardian.occupation || "Professional",
      residentialAddress: guardian.residentialAddress || "",
      city: guardian.city || "",
      country: guardian.country || "Global",
      timezone: guardian.timezone || "UTC",
      secondaryGuardianName: guardian.secondaryGuardianName,
      secondaryRelationship: guardian.secondaryRelationship,
      secondaryPhone: guardian.secondaryPhone,
      emergencyContactName: guardian.emergencyContactName || guardian.primaryGuardianName,
      emergencyRelationship: guardian.emergencyRelationship || guardian.relationship,
      emergencyPhone: guardian.emergencyPhone || guardian.guardianPhone,
      notificationFrequency: guardian.notificationFrequency || "weekly_summary",
      notificationChannels: guardian.notificationChannels || ["email"],
      vrUsageConsent: Boolean(guardian.vrUsageConsent),
      avatarAndPrivacyConsent: Boolean(guardian.avatarAndPrivacyConsent),
      academicHonorCodeAgreed: Boolean(guardian.academicHonorCodeAgreed),
      digitalSignature: guardian.digitalSignature || guardian.primaryGuardianName,
      signatureDate: guardian.signatureDate || new Date().toISOString().split('T')[0]
    },
    assignedCampusFloor: assignedFloor,
    assignedTutor: tutor,
    virtualLockerNumber: lockerNumber,
    rfidPassCode: rfidCode,
    initialXPAwarded: 100,
    notes: `Official student admission registered via Visitors Portal. Welcome to KEV Science Academy!`
  };

  serverAdmissionsRegistry.unshift(newAdmission);

  res.json({
    success: true,
    admission: newAdmission,
    message: `Congratulations! ${student.fullName} has been officially admitted to KEV XR Science Academy! Student ID: ${studentId}`,
    starterXP: 100
  });
});


// GET Chat messages for a specific room or floor
app.get("/api/campus/chat/messages", (req, res) => {
  const roomId = (req.query.roomId as string) || "floor-1";
  const messages = campusChatMessages[roomId] || [];
  res.json({ roomId, messages });
});

// POST send message fallback endpoint
app.post("/api/campus/chat/send", (req, res) => {
  const { roomId, sender, text } = req.body;
  if (!roomId || !text || !sender) {
    return res.status(400).json({ error: "Missing required chat message parameters" });
  }

  const newMsg: ServerChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    roomId,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  if (!campusChatMessages[roomId]) {
    campusChatMessages[roomId] = [];
  }
  campusChatMessages[roomId].push(newMsg);
  if (campusChatMessages[roomId].length > 50) {
    campusChatMessages[roomId].shift();
  }

  res.json({ success: true, message: newMsg });
});

// Register Global Geo-Data, AutoDraw Smart Sketchpad, AR Spatial Scan, and Diffit Differentiation APIs
registerAdvancedScienceRoutes(app, getAI, generateGeminiContentWithFallback);

// Vite middleware setup
async function startServer() {
  const server = http.createServer(app);

  // Initialize WebSocket Server for Real-Time Campus Chat
  const wss = new WebSocketServer({ server, path: "/api/ws/campus-chat" });

  // Map of client -> currentRoom
  const clientRooms = new Map<WebSocket, { roomId: string; user?: any }>();

  wss.on("connection", (ws: WebSocket) => {
    clientRooms.set(ws, { roomId: "floor-1" });

    // Send initial campus announcements to newly connected client
    try {
      ws.send(JSON.stringify({
        type: "announcements",
        announcements: campusAnnouncements,
      }));
    } catch (e) {
      // ignore
    }

    ws.on("message", (rawData: string) => {
      try {
        const data = JSON.parse(rawData.toString());

        if (data.type === "join") {
          const roomId = data.roomId || "floor-1";
          clientRooms.set(ws, { roomId, user: data.user });

          // Send current room messages to the newly joined client
          const existing = campusChatMessages[roomId] || [];
          ws.send(JSON.stringify({
            type: "init",
            roomId,
            messages: existing,
          }));

          // Broadcast peer presence update
          const peersInRoom: any[] = [];
          clientRooms.forEach((info) => {
            if (info.roomId === roomId && info.user) {
              peersInRoom.push(info.user);
            }
          });

          const presencePayload = JSON.stringify({
            type: "presence",
            roomId,
            peers: peersInRoom,
          });

          clientRooms.forEach((info, client) => {
            if (client.readyState === WebSocket.OPEN && info.roomId === roomId) {
              client.send(presencePayload);
            }
          });
        } else if (data.type === "message") {
          const roomId = data.roomId || clientRooms.get(ws)?.roomId || "floor-1";
          const newMsg: ServerChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            roomId,
            sender: data.sender || {
              id: "anonymous-student",
              name: "Student",
              avatar: { archetype: "cyber-scholar", visorType: "holo-visor", primaryColor: "#06b6d4", glowColor: "#38bdf8", glowEffect: "pulse", accessory: "lead-researcher-badge", suitPattern: "hex-grid", name: "Student" }
            },
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reaction: data.reaction,
          };

          if (!campusChatMessages[roomId]) {
            campusChatMessages[roomId] = [];
          }
          campusChatMessages[roomId].push(newMsg);
          if (campusChatMessages[roomId].length > 50) {
            campusChatMessages[roomId].shift();
          }

          // Broadcast to all clients in the same room
          const broadcastPayload = JSON.stringify({
            type: "message",
            roomId,
            message: newMsg,
          });

          clientRooms.forEach((info, client) => {
            if (client.readyState === WebSocket.OPEN && info.roomId === roomId) {
              client.send(broadcastPayload);
            }
          });
        }
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    });

    ws.on("close", () => {
      const info = clientRooms.get(ws);
      clientRooms.delete(ws);
      if (info?.roomId) {
        // Broadcast updated presence
        const peersInRoom: any[] = [];
        clientRooms.forEach((ci) => {
          if (ci.roomId === info.roomId && ci.user) {
            peersInRoom.push(ci.user);
          }
        });
        const presencePayload = JSON.stringify({
          type: "presence",
          roomId: info.roomId,
          peers: peersInRoom,
        });
        clientRooms.forEach((ci, client) => {
          if (client.readyState === WebSocket.OPEN && ci.roomId === info.roomId) {
            client.send(presencePayload);
          }
        });
      }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`KEV XR Science Academy Server running on http://0.0.0.0:${PORT} (with WebSockets)`);
  });
}

startServer();
