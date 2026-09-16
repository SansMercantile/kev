import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Award,
  Zap,
  FlaskConical,
  Orbit,
  Eye,
  Dna,
  Compass,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Filter,
  Layers,
  Star,
  Target,
  ShieldCheck
} from 'lucide-react';
import { StudentStats, LabId, LabSnapshot } from '../../types';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';
import { applyStreakMultiplier } from '../../utils/streakManager';

interface Props {
  studentStats: StudentStats;
  snapshots?: LabSnapshot[];
  onNavigateToLab: (labId: LabId) => void;
  onNavigateToCurriculum: () => void;
  onClaimMilestoneXP?: (xp: number, label: string) => void;
}

export type RoadmapTrackId = 'all' | 'chemistry' | 'astrophysics' | 'optics' | 'biology' | 'capstone';

export interface RoadmapNode {
  id: string;
  trackId: 'chemistry' | 'astrophysics' | 'optics' | 'biology' | 'capstone';
  labId: LabId;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  tier: 'Foundational' | 'Intermediate' | 'Advanced Honors' | 'Capstone';
  type: 'concept' | 'workbench' | 'milestone' | 'capstone';
  xpReward: number;
  badgeReward?: string;
  prerequisites: string[];
  learningObjectives: string[];
  keyFormulas?: string[];
  recommendedLabAction: string;
}

const ROADMAP_TRACKS: { id: RoadmapTrackId; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'all', label: 'All Tracks (Full Grid)', icon: Map, color: 'text-white', bg: 'bg-slate-800', border: 'border-slate-700' },
  { id: 'chemistry', label: 'Molecular Chemistry', icon: FlaskConical, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/40' },
  { id: 'astrophysics', label: 'Relativistic Astrophysics', icon: Orbit, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40' },
  { id: 'optics', label: 'Wave Optics & Photonics', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40' },
  { id: 'biology', label: 'Cellular Genomics', icon: Dna, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40' },
  { id: 'capstone', label: 'Autonomous Capstone', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/40' },
];

const ROADMAP_NODES: RoadmapNode[] = [
  // Chemistry Track
  {
    id: 'chem-1',
    trackId: 'chemistry',
    labId: 'chemistry',
    order: 1,
    title: 'Atomic Orbitals & Electron Shells',
    subtitle: 'Wave function probability and principal quantum numbers',
    description: 'Explore the spatial shapes of s, p, and d orbitals, quantifying orbital hybridization and Hund’s rules.',
    tier: 'Foundational',
    type: 'concept',
    xpReward: 35,
    prerequisites: [],
    learningObjectives: ['Define principal quantum numbers n, l, m_l', 'Differentiate spherical s orbitals from lobed p orbitals'],
    keyFormulas: ['Ψ(r, θ, φ) = R(r) · Y(θ, φ)', 'λ = h / p'],
    recommendedLabAction: 'Inspect 3D Atomic Electron Cloud',
  },
  {
    id: 'chem-2',
    trackId: 'chemistry',
    labId: 'chemistry',
    order: 2,
    title: 'VSEPR Molecular Geometries',
    subtitle: 'Valence shell electron pair repulsion in 3D',
    description: 'Manipulate tetrahedral, trigonal bipyramidal, and octahedral geometries to measure steric bond angles and dipole vectors.',
    tier: 'Intermediate',
    type: 'workbench',
    xpReward: 60,
    badgeReward: 'Spatial Chemist',
    prerequisites: ['chem-1'],
    learningObjectives: ['Predict molecular geometry based on steric number and lone pairs', 'Calculate net dipole moment from electronegativity differences'],
    keyFormulas: ['Steric Number = Bonded Atoms + Lone Pairs', 'μ = Q · r'],
    recommendedLabAction: 'Launch 3D Molecular Workbench',
  },
  {
    id: 'chem-3',
    trackId: 'chemistry',
    labId: 'chemistry',
    order: 3,
    title: 'Exothermic Solvation & Calorimetry',
    subtitle: 'Enthalpy of hydration and lattice dissociation',
    description: 'Simulate thermodynamic dissolution of ionic salts, tracking temperature gradients and Hess’s Law cycles in real-time.',
    tier: 'Advanced Honors',
    type: 'milestone',
    xpReward: 100,
    badgeReward: 'Enthalpy Master',
    prerequisites: ['chem-2'],
    learningObjectives: ['Measure ΔH_soln via simulated coffee-cup calorimetry', 'Calculate Gibbs Free Energy change ΔG = ΔH - TΔS'],
    keyFormulas: ['q = m · c · ΔT', 'ΔG° = ΔH° - TΔS°'],
    recommendedLabAction: 'Run Solvation Thermal Simulation',
  },
  {
    id: 'chem-4',
    trackId: 'chemistry',
    labId: 'chemistry',
    order: 4,
    title: 'Crystal Lattices & Nanomaterial Polymers',
    subtitle: 'Face-centered cubic and body-centered unit cells',
    description: 'Synthesize graphene sheets, carbon nanotubes, and face-centered cubic gold lattices to analyze tensile strength.',
    tier: 'Advanced Honors',
    type: 'workbench',
    xpReward: 85,
    prerequisites: ['chem-3'],
    learningObjectives: ['Calculate atomic packing factor (APF) of FCC and BCC lattices', 'Understand sp² hybridized carbon bonding'],
    keyFormulas: ['APF = (V_atoms) / (V_unit_cell)', 'Bragg’s Law: nλ = 2d sinθ'],
    recommendedLabAction: 'Design Nanoscale Lattice Cell',
  },

  // Astrophysics Track
  {
    id: 'astro-1',
    trackId: 'astrophysics',
    labId: 'astrophysics',
    order: 1,
    title: 'Keplerian Ellipses & Orbital Mechanics',
    subtitle: 'Semi-major axes, eccentricities, and orbital periods',
    description: 'Model celestial orbits using Kepler’s Three Laws, varying eccentricity from circular e=0 to parabolic e=1.',
    tier: 'Foundational',
    type: 'concept',
    xpReward: 35,
    prerequisites: [],
    learningObjectives: ['Derive orbital velocity v = √(GM/r)', 'Confirm T² proportional to a³ for all planetary satellites'],
    keyFormulas: ['T² = (4π² / GM) · a³', 'r(θ) = p / (1 + e cosθ)'],
    recommendedLabAction: 'Simulate Kepler Ellipse in Planetarium',
  },
  {
    id: 'astro-2',
    trackId: 'astrophysics',
    labId: 'astrophysics',
    order: 2,
    title: 'Gravitational Three-Body Equilibria',
    subtitle: 'Lagrange points L1 through L5 and stability valleys',
    description: 'Stabilize a deep space observatory at the Sun-Earth L2 Lagrange point, balancing centrifugal and gravitational vectors.',
    tier: 'Intermediate',
    type: 'workbench',
    xpReward: 60,
    badgeReward: 'Kepler Navigator',
    prerequisites: ['astro-1'],
    learningObjectives: ['Locate effective gravitational potential minima', 'Deploy halo orbits around collinear Lagrange points'],
    keyFormulas: ['F_net = G M_1 m / r_1² + G M_2 m / r_2² - m ω² r = 0'],
    recommendedLabAction: 'Tune Orbital Simulation Velocity',
  },
  {
    id: 'astro-3',
    trackId: 'astrophysics',
    labId: 'astrophysics',
    order: 3,
    title: 'General Relativity & Gravitational Lensing',
    subtitle: 'Spacetime curvature and Einstein ring distortion',
    description: 'Simulate massive galactic clusters bending photon geodesics, creating photometric Einstein rings and magnified arcs.',
    tier: 'Advanced Honors',
    type: 'milestone',
    xpReward: 100,
    badgeReward: 'Relativity Pioneer',
    prerequisites: ['astro-2'],
    learningObjectives: ['Calculate deflection angle θ = 4GM / (c² b)', 'Model gravitational microlensing light curves'],
    keyFormulas: ['θ_E = √( (4GM/c²) · (D_LS / (D_L · D_S)) )'],
    recommendedLabAction: 'Inspect Spacetime Gravitational Well',
  },
  {
    id: 'astro-4',
    trackId: 'astrophysics',
    labId: 'astrophysics',
    order: 4,
    title: 'Kerr Singularity & Accretion Dynamics',
    subtitle: 'Ergosphere frame dragging and Hawking temperature',
    description: 'Pilot test probes near rotating Kerr black hole horizons, simulating relativistic Doppler beaming and tidal forces.',
    tier: 'Advanced Honors',
    type: 'workbench',
    xpReward: 90,
    prerequisites: ['astro-3'],
    learningObjectives: ['Calculate Schwarzschild radius r_s = 2GM/c²', 'Map Penrose energy extraction from the ergosphere'],
    keyFormulas: ['r_s = 2GM / c²', 'T_H = ℏc³ / (8π G M k_B)'],
    recommendedLabAction: 'Calibrate Event Horizon Simulation',
  },

  // Wave Optics Track
  {
    id: 'optics-1',
    trackId: 'optics',
    labId: 'optics',
    order: 1,
    title: 'Snell’s Law & Refractive Indices',
    subtitle: 'Ray propagation across dielectric boundaries',
    description: 'Measure incident, reflected, and transmitted light rays through crown glass, flint glass, water, and synthetic diamond.',
    tier: 'Foundational',
    type: 'concept',
    xpReward: 35,
    prerequisites: [],
    learningObjectives: ['Apply n_1 sinθ_1 = n_2 sinθ_2', 'Calculate speed of light in dense optical media v = c / n'],
    keyFormulas: ['n_1 sinθ_1 = n_2 sinθ_2', 'v = c / n'],
    recommendedLabAction: 'Trace Refraction Bench Laser Ray',
  },
  {
    id: 'optics-2',
    trackId: 'optics',
    labId: 'optics',
    order: 2,
    title: 'Total Internal Reflection & Fiber Optics',
    subtitle: 'Critical angle boundaries and evanescent wave penetration',
    description: 'Determine the exact critical angle θ_c where transmitted rays vanish, channeling photons via total internal reflection.',
    tier: 'Intermediate',
    type: 'workbench',
    xpReward: 60,
    badgeReward: 'Optics Virtuoso',
    prerequisites: ['optics-1'],
    learningObjectives: ['Derive θ_c = arcsin(n_2 / n_1)', 'Analyze multi-mode fiber optic core and cladding configurations'],
    keyFormulas: ['θ_c = arcsin(n_2 / n_1)', 'NA = √(n_core² - n_clad²)'],
    recommendedLabAction: 'Trigger Total Internal Reflection Bench',
  },
  {
    id: 'optics-3',
    trackId: 'optics',
    labId: 'optics',
    order: 3,
    title: 'Young’s Double-Slit Interference',
    subtitle: 'Wave-particle duality and fringe spacing',
    description: 'Project monochromatic laser light through dual sub-micron slits, observing constructive and destructive interference bands.',
    tier: 'Advanced Honors',
    type: 'milestone',
    xpReward: 100,
    badgeReward: 'Interference Luminary',
    prerequisites: ['optics-2'],
    learningObjectives: ['Calculate fringe separation y = (m λ L) / d', 'Demonstrate spatial coherence and phase differences'],
    keyFormulas: ['d sinθ = m λ', 'Δy = (λ L) / d'],
    recommendedLabAction: 'Calibrate Double-Slit Interference Pattern',
  },
  {
    id: 'optics-4',
    trackId: 'optics',
    labId: 'optics',
    order: 4,
    title: 'Polarization & Quantum Coherence',
    subtitle: 'Brewster’s angle and holographic wavefields',
    description: 'Filter electromagnetic waves with linear polarizers and quarter-wave plates to produce circularly polarized photons.',
    tier: 'Advanced Honors',
    type: 'workbench',
    xpReward: 85,
    prerequisites: ['optics-3'],
    learningObjectives: ['Verify Malus’s Law I = I_0 cos²θ', 'Compute Brewster’s angle tanθ_B = n_2 / n_1'],
    keyFormulas: ['I = I_0 cos²θ', 'tan θ_B = n_2 / n_1'],
    recommendedLabAction: 'Mount Polarizing Filters on Optical Rail',
  },

  // Biology Track
  {
    id: 'bio-1',
    trackId: 'biology',
    labId: 'biology',
    order: 1,
    title: 'Eukaryotic Organelle Compartmentalization',
    subtitle: 'Mitochondria, endoplasmic reticulum, and Golgi apparatus',
    description: 'Zoom through the lipid bilayer to study ATP synthase rotors in mitochondrial cristae and protein sorting vesicles.',
    tier: 'Foundational',
    type: 'concept',
    xpReward: 35,
    prerequisites: [],
    learningObjectives: ['Distinguish eukaryotic membrane-bound organelles from prokaryotic structures', 'Map ATP synthesis via proton gradients'],
    keyFormulas: ['Chemiosmosis: Δp = ΔΨ - (2.3 RT/F) ΔpH'],
    recommendedLabAction: 'Examine Eukaryotic Cell 3D Slice',
  },
  {
    id: 'bio-2',
    trackId: 'biology',
    labId: 'biology',
    order: 2,
    title: 'DNA Double-Helix & Transcription',
    subtitle: 'Antiparallel strands, hydrogen bonding, and RNA polymerase',
    description: 'Unzip the DNA double-helix, assembling complementary mRNA transcripts using Watson-Crick A-U and G-C base pairing.',
    tier: 'Intermediate',
    type: 'workbench',
    xpReward: 60,
    badgeReward: 'Cellular Explorer',
    prerequisites: ['bio-1'],
    learningObjectives: ['Identify 5’ to 3’ directionality in replication forks', 'Trace codons to amino acid transfer via tRNA'],
    keyFormulas: ['Pitch = 3.4 nm per 10 base pairs', 'A=T (2 H-bonds), G≡C (3 H-bonds)'],
    recommendedLabAction: 'Assemble DNA Strands in 3D Biology Lab',
  },
  {
    id: 'bio-3',
    trackId: 'biology',
    labId: 'biology',
    order: 3,
    title: 'Recombinant Plasmids & Gel Electrophoresis',
    subtitle: 'Restriction enzyme digestion and agarose band migration',
    description: 'Splice GFP (green fluorescent protein) reporter genes into bacterial plasmids, analyzing fragment sizes under UV illumination.',
    tier: 'Advanced Honors',
    type: 'milestone',
    xpReward: 100,
    badgeReward: 'Genetic Architect',
    prerequisites: ['bio-2'],
    learningObjectives: ['Design sticky ends using EcoRI and HindIII restriction enzymes', 'Calculate base pair fragment size from migration log distance'],
    keyFormulas: ['Migration Distance ∝ log(1 / MW)'],
    recommendedLabAction: 'Simulate Gel Electrophoresis Separation',
  },
  {
    id: 'bio-4',
    trackId: 'biology',
    labId: 'biology',
    order: 4,
    title: 'CRISPR-Cas9 Gene Editing & Epigenetics',
    subtitle: 'Guide RNA target cleavage and DNA repair mechanics',
    description: 'Program synthetic sgRNA sequences to cleave target genes, observing non-homologous end joining (NHEJ) and homology repair.',
    tier: 'Advanced Honors',
    type: 'workbench',
    xpReward: 90,
    prerequisites: ['bio-3'],
    learningObjectives: ['Recognize PAM sequences (5’-NGG-3’) for SpCas9 targeting', 'Model off-target cleavage probability'],
    keyFormulas: ['Specificity Score = Π (1 - W_position)'],
    recommendedLabAction: 'Design Guide RNA for Targeted Insertion',
  },

  // Capstone Track
  {
    id: 'cap-1',
    trackId: 'capstone',
    labId: 'astrophysics',
    order: 1,
    title: 'Autonomous Multi-Disciplinary Grand Capstone',
    subtitle: 'Planetary Biosphere & Quantum Synthesis Integration',
    description: 'Synthesize novel catalysts in Chemistry, stabilize exoplanet climate in Astrophysics, harness coherent optics for solar sails, and engineer extremophile biology for planetary colonization.',
    tier: 'Capstone',
    type: 'capstone',
    xpReward: 250,
    badgeReward: 'Grand Academy Laureate',
    prerequisites: ['chem-3', 'astro-3', 'optics-3', 'bio-3'],
    learningObjectives: ['Harmonize thermodynamic, orbital, optical, and genetic models into a unified autonomous biosphere simulation'],
    keyFormulas: ['Global Climate Balance: (1 - A) · S / 4 = σ T_e⁴'],
    recommendedLabAction: 'Initiate Grand Capstone Synthesis',
  },
];

export const LearningRoadmap: React.FC<Props> = ({
  studentStats,
  snapshots = [],
  onNavigateToLab,
  onNavigateToCurriculum,
  onClaimMilestoneXP,
}) => {
  const [activeTrack, setActiveTrack] = useState<RoadmapTrackId>('all');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [claimedNodeIds, setClaimedNodeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kev_claimed_roadmap_nodes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { showToast } = useToast();

  // Determine completed nodes dynamically based on student stats and snapshots
  const completedNodeIds = useMemo(() => {
    const completed = new Set<string>();

    // Chemistry completion
    if (studentStats.completedLabsCount >= 1 || snapshots.some((s) => s.labId === 'chemistry')) {
      completed.add('chem-1');
      completed.add('chem-2');
    }
    if (studentStats.badges.includes('Spatial Chemist') || studentStats.xp >= 150) {
      completed.add('chem-1');
      completed.add('chem-2');
      completed.add('chem-3');
    }

    // Astrophysics completion
    if (studentStats.completedLabsCount >= 2 || snapshots.some((s) => s.labId === 'astrophysics')) {
      completed.add('astro-1');
      completed.add('astro-2');
    }
    if (studentStats.badges.includes('Kepler Navigator') || studentStats.xp >= 250) {
      completed.add('astro-1');
      completed.add('astro-2');
      completed.add('astro-3');
    }

    // Optics completion
    if (studentStats.completedLabsCount >= 3 || snapshots.some((s) => s.labId === 'optics')) {
      completed.add('optics-1');
      completed.add('optics-2');
    }
    if (studentStats.badges.includes('Optics Virtuoso') || studentStats.xp >= 350) {
      completed.add('optics-1');
      completed.add('optics-2');
      completed.add('optics-3');
    }

    // Biology completion
    if (studentStats.completedLabsCount >= 4 || snapshots.some((s) => s.labId === 'biology')) {
      completed.add('bio-1');
      completed.add('bio-2');
    }
    if (studentStats.badges.includes('Cellular Explorer') || studentStats.xp >= 400) {
      completed.add('bio-1');
      completed.add('bio-2');
      completed.add('bio-3');
    }

    // Foundational nodes are unlocked/completed for scholars
    completed.add('chem-1');
    completed.add('astro-1');
    completed.add('optics-1');
    completed.add('bio-1');

    // Also include manually claimed checkpoints
    claimedNodeIds.forEach((id) => completed.add(id));

    return completed;
  }, [studentStats, snapshots, claimedNodeIds]);

  // Check if a node is unlocked
  const isNodeUnlocked = (node: RoadmapNode): boolean => {
    if (node.prerequisites.length === 0) return true;
    return node.prerequisites.every((prereqId) => completedNodeIds.has(prereqId));
  };

  const filteredNodes = useMemo(() => {
    if (activeTrack === 'all') return ROADMAP_NODES;
    return ROADMAP_NODES.filter((n) => n.trackId === activeTrack);
  }, [activeTrack]);

  const totalNodesCount = ROADMAP_NODES.length;
  const completedCount = ROADMAP_NODES.filter((n) => completedNodeIds.has(n.id)).length;
  const progressPercent = Math.round((completedCount / totalNodesCount) * 100);

  const handleClaimNodeReward = (node: RoadmapNode) => {
    if (claimedNodeIds.includes(node.id)) return;

    const baseXP = node.xpReward;
    const { multipliedXP, multiplier } = applyStreakMultiplier(baseXP);

    const updatedClaimed = [...claimedNodeIds, node.id];
    setClaimedNodeIds(updatedClaimed);
    try {
      localStorage.setItem('kev_claimed_roadmap_nodes', JSON.stringify(updatedClaimed));
    } catch {
      // Ignore
    }

    soundManager.playBadgeUnlock();
    if (onClaimMilestoneXP) {
      onClaimMilestoneXP(multipliedXP, `Roadmap Checkpoint: ${node.title}`);
    }

    showToast({
      type: 'success',
      title: 'Roadmap Milestone Achieved!',
      message: `Earned +${multipliedXP} XP (${multiplier}x Streak Multiplier) for ${node.title}!`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Metric Header */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/40 shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-black text-white tracking-tight">
                Academic Science Learning Roadmap
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                INTERACTIVE PATH
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Progress through node-based milestones across Molecular Chemistry, Astrophysics, Wave Optics, and Cellular Genomics. Complete laboratories to unlock mastery credentials.
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 w-full sm:w-64">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Academy Mastery</span>
              <span className="text-cyan-400 font-bold">
                {completedCount}/{totalNodesCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track Selector Navigation Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {ROADMAP_TRACKS.map((track) => {
          const IconComp = track.icon;
          const isSel = activeTrack === track.id;

          return (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isSel
                  ? 'bg-slate-800 text-white border-cyan-500 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${track.color}`} />
              <span>{track.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Node Graph Grid */}
      <div className="space-y-6">
        {/* Render by tracks if "all" is selected, otherwise render single track */}
        {(activeTrack === 'all'
          ? ['chemistry', 'astrophysics', 'optics', 'biology', 'capstone']
          : [activeTrack]
        ).map((trackId) => {
          const trackInfo = ROADMAP_TRACKS.find((t) => t.id === trackId);
          if (!trackInfo) return null;
          const nodes = ROADMAP_NODES.filter((n) => n.trackId === trackId);
          const TrackIcon = trackInfo.icon;

          return (
            <div
              key={trackId}
              className="p-5 md:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4"
            >
              {/* Track Title Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${trackInfo.bg} ${trackInfo.border} border`}
                  >
                    <TrackIcon className={`w-4 h-4 ${trackInfo.color}`} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {trackInfo.label}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {nodes.filter((n) => completedNodeIds.has(n.id)).length} of {nodes.length} Milestones Cleared
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const firstLab = nodes[0]?.labId;
                    if (firstLab) onNavigateToLab(firstLab);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Open Lab Workbench</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Node Sequence / Interactive Path */}
              <div className="relative">
                {/* Horizontal / Grid Path Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {nodes.map((node, nodeIdx) => {
                    const isCompleted = completedNodeIds.has(node.id);
                    const isUnlocked = isNodeUnlocked(node);
                    const isSelected = selectedNode?.id === node.id;
                    const isMilestone = node.type === 'milestone' || node.type === 'capstone';

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] group ${
                          isCompleted
                            ? 'bg-slate-950/80 border-emerald-500/50 hover:border-emerald-400 shadow-md shadow-emerald-500/10'
                            : isUnlocked
                            ? 'bg-slate-950/60 border-cyan-500/40 hover:border-cyan-400 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-80'
                        } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                      >
                        {/* Milestone Ribbon / Tier Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : isUnlocked
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            Step {node.order} • {node.tier}
                          </span>

                          <div className="flex items-center gap-1">
                            {isCompleted ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Done
                              </span>
                            ) : isUnlocked ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 font-mono animate-pulse">
                                <Target className="w-3.5 h-3.5" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 font-mono">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-1">
                          <h5 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                            {node.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {node.subtitle}
                          </p>
                        </div>

                        {/* Bottom Reward Preview & Action Hint */}
                        <div className="pt-3 mt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-amber-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            +{node.xpReward} XP
                          </span>

                          {node.badgeReward && (
                            <span className="text-indigo-300 flex items-center gap-1 font-bold">
                              <Award className="w-3 h-3 text-indigo-400" />
                              Badge
                            </span>
                          )}

                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Node Details Drawer Modal */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {selectedNode.trackId.toUpperCase()} • Step {selectedNode.order}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {selectedNode.tier}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {selectedNode.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedNode.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* Description */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Phenomenon Overview
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Key Equations / Formulas */}
                {selectedNode.keyFormulas && selectedNode.keyFormulas.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                      Governing Scientific Formulae
                    </span>
                    <div className="space-y-1">
                      {selectedNode.keyFormulas.map((f, i) => (
                        <div
                          key={i}
                          className="font-mono text-xs text-cyan-200 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800"
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Objectives */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Learning Competency Checkpoints
                  </span>
                  <div className="space-y-1.5">
                    {selectedNode.learningObjectives.map((obj, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewards Showcase */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Milestone XP</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-base font-black text-amber-300 font-mono">
                        +{selectedNode.xpReward} XP
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Unlockable Perk</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-300">
                        {selectedNode.badgeReward || 'Lab Competency'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    handleClaimNodeReward(selectedNode);
                  }}
                  disabled={claimedNodeIds.includes(selectedNode.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    claimedNodeIds.includes(selectedNode.id)
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {claimedNodeIds.includes(selectedNode.id) ? 'Claimed' : 'Mark Milestone Cleared'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onNavigateToCurriculum();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Curriculum</span>
                  </button>

                  <button
                    onClick={() => {
                      const lab = selectedNode.labId;
                      setSelectedNode(null);
                      onNavigateToLab(lab);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <span>Launch 3D Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
