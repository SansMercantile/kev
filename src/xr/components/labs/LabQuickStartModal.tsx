import React from 'react';
import { LabId } from '../../types';
import {
  X,
  Sparkles,
  MousePointer,
  Rotate3d,
  ZoomIn,
  Sliders,
  Camera,
  Layers,
  Activity,
  Atom,
  Orbit,
  Dna,
  Zap,
  Target,
  BookOpen,
} from 'lucide-react';

interface QuickStartGuide {
  title: string;
  subtitle: string;
  colorTheme: {
    accent: string;
    bgBadge: string;
    border: string;
    iconColor: string;
    button: string;
  };
  icon: React.ReactNode;
  overview: string;
  interactionPoints: {
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }[];
  keyControls: {
    action: string;
    input: string;
  }[];
  challenge: {
    title: string;
    task: string;
  };
}

const GUIDES: Record<LabId, QuickStartGuide> = {
  chemistry: {
    title: '3D Molecular Synthesis Lab',
    subtitle: 'VSEPR Molecular Geometry, Thermal Kinetics & Exothermic Reactions',
    colorTheme: {
      accent: 'text-cyan-400',
      bgBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      border: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      button: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20',
    },
    icon: <Atom className="w-6 h-6 text-cyan-400" />,
    overview:
      'Explore how quantum valence electrons dictate 3D molecular conformations under VSEPR theory. Observe bond angles, molecular dipole moments, and test reaction kinetics.',
    interactionPoints: [
      {
        title: 'Molecule Preset Selector',
        description: 'Switch between H₂O (bent 104.5°), CO₂ (linear 180°), CH₄ (tetrahedral 109.5°), NH₃ (trigonal pyramidal 107.0°), and SF₆ (octahedral 90°).',
        badge: 'Top Bar',
        icon: <Atom className="w-4 h-4 text-cyan-400" />,
      },
      {
        title: 'Thermal Kinetic Energy Slider',
        description: 'Vary temperature from 100K (cryogenic stillness) up to 800K to observe vibrational bond agitation and rotational kinetics.',
        badge: 'HUD Panel',
        icon: <Sliders className="w-4 h-4 text-amber-400" />,
      },
      {
        title: 'Exothermic Combustion Reaction',
        description: 'Click "Trigger Exothermic Reaction" to release stored bond enthalpy (~890 kJ/mol), causing thermodynamic kinetic burst effects.',
        badge: 'Interactive Task',
        icon: <Zap className="w-4 h-4 text-red-400" />,
      },
      {
        title: 'Molecular Telemetry HUD',
        description: 'Inspect live electronegativity differentials (ΔEN), dipole moments in Debyes (D), steric numbers, and VSEPR classification.',
        badge: 'Upper Left HUD',
        icon: <Activity className="w-4 h-4 text-emerald-400" />,
      },
    ],
    keyControls: [
      { action: 'Rotate 3D Molecule', input: 'Left Click + Drag anywhere on canvas' },
      { action: 'Zoom In / Out', input: 'Mouse Scroll Wheel or pinch on trackpad' },
      { action: 'Capture Lab Report Snapshot', input: 'Click "Snapshot" in the top bar' },
      { action: 'Consult Faculty AI Tutor', input: 'Click "Ask Professor KEV" for Socratic guidance' },
    ],
    challenge: {
      title: 'VSEPR Bond Verification Challenge',
      task: 'Synthesize Water (H₂O) and observe why its bond angle is compressed to 104.5° instead of 109.5° due to non-bonding lone pairs.',
    },
  },
  astrophysics: {
    title: 'N-Body Gravitational Orbital Lab',
    subtitle: 'Keplerian Dynamics, Spacetime Trajectories & Celestial Slingshots',
    colorTheme: {
      accent: 'text-violet-400',
      bgBadge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
      border: 'border-violet-500/30',
      iconColor: 'text-violet-400',
      button: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20',
    },
    icon: <Orbit className="w-6 h-6 text-violet-400" />,
    overview:
      'Simulate multi-body gravitational mechanics in real time. Observe Kepler’s Laws, measure orbital eccentricity, and launch rogue astronomical bodies.',
    interactionPoints: [
      {
        title: 'Planetary Body Selector',
        description: 'Target the Sun, Earth, Mars, Jupiter, or Halley’s Comet to focus telemetry and inspect their orbital trails.',
        badge: 'Top Bar',
        icon: <Orbit className="w-4 h-4 text-violet-400" />,
      },
      {
        title: 'Universal Gravitational Constant (G)',
        description: 'Adjust the G-slider to test what happens when gravitational attraction doubles or weakens, destabilizing outer planet orbits.',
        badge: 'Lower HUD',
        icon: <Sliders className="w-4 h-4 text-indigo-400" />,
      },
      {
        title: 'Launch Rogue Comet Challenge',
        description: 'Inject a high-speed eccentric celestial body into the solar plane to observe 3-body perturbation and gravitational slingshot escapes.',
        badge: 'Action Bar',
        icon: <Zap className="w-4 h-4 text-pink-400" />,
      },
      {
        title: 'Orbital Telemetry & Keplerian Ratios',
        description: 'Track instantaneous orbital speed (km/s), radius from barycenter (AU), and Kepler period proportionality (a³/T²).',
        badge: 'HUD Panel',
        icon: <Activity className="w-4 h-4 text-cyan-400" />,
      },
    ],
    keyControls: [
      { action: 'Orbit View Angle', input: 'Left Click + Drag to rotate orbital plane' },
      { action: 'Pan & Zoom System', input: 'Scroll to zoom in to planets or out to Kuiper belt' },
      { action: 'Stabilize System Orbits', input: 'Click "Stabilize Orbit" to confirm equilibrium' },
      { action: 'Reset Orbits', input: 'Click the rewind/reset button to restore initial epoch' },
    ],
    challenge: {
      title: 'Stable Heliocentric Orbit Challenge',
      task: 'Tune Gravitational G and orbital velocity to keep Earth in a stable non-decaying elliptical orbit for over 3 continuous cycles.',
    },
  },
  biology: {
    title: 'Cellular Genomics & Organelle Lab',
    subtitle: '3D Eukaryotic Architecture, DNA Double Helix & mRNA Codon Transcription',
    colorTheme: {
      accent: 'text-emerald-400',
      bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
    },
    icon: <Dna className="w-6 h-6 text-emerald-400" />,
    overview:
      'Step inside a living eukaryotic cell or zoom down to the nanometer scale of the DNA double helix to test molecular transcription and bioenergetics.',
    interactionPoints: [
      {
        title: 'Cell vs DNA Mode Switcher',
        description: 'Toggle between the full 3D Eukaryotic Cell viewport and the atomic-resolution DNA Double Helix Suite.',
        badge: 'Top Bar',
        icon: <Layers className="w-4 h-4 text-emerald-400" />,
      },
      {
        title: 'Organelle 3D Dissection',
        description: 'Click any organelle (Mitochondria, Nucleus, Golgi Apparatus, Endoplasmic Reticulum) to inspect microscopic functions and energetics.',
        badge: 'Interactive Canvas',
        icon: <MousePointer className="w-4 h-4 text-cyan-400" />,
      },
      {
        title: 'X-Ray Translucency Mode',
        description: 'Toggle X-Ray mode to make the outer lipid bilayer semi-transparent and peer directly into intracellular organelles.',
        badge: 'Action Bar',
        icon: <Zap className="w-4 h-4 text-teal-400" />,
      },
      {
        title: 'mRNA Codon Transcription Engine',
        description: 'In the DNA view, input DNA triplet nucleotides (e.g., TAC-CGA-TTT) to transcribe mRNA codons into peptide chains.',
        badge: 'DNA Studio',
        icon: <Dna className="w-4 h-4 text-purple-400" />,
      },
    ],
    keyControls: [
      { action: 'Rotate Cell / Helix', input: 'Left Click + Drag across the canvas' },
      { action: 'Zoom into Organelle', input: 'Mouse Wheel to zoom in past the membrane' },
      { action: 'ATP Respiration Cycle', input: 'Click "Simulate ATP Synthesis" to activate cristae' },
      { action: 'Transcribe Codons', input: 'Type sequence in DNA tab & click Transcribe' },
    ],
    challenge: {
      title: 'Mitochondrial Respiration Task',
      task: 'Dissect the Mitochondria, observe ATP Synthase proton-motive force, and execute a successful transcription sequence.',
    },
  },
  optics: {
    title: 'Quantum Optics & Refraction Lab',
    subtitle: 'Snell’s Law, Wave Dispersion & Total Internal Reflection (TIR)',
    colorTheme: {
      accent: 'text-amber-400',
      bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20',
    },
    icon: <Sparkles className="w-6 h-6 text-amber-400" />,
    overview:
      'Fire high-coherence laser beams into transparent prisms and refractive media. Measure angles of incidence, witness chromatic dispersion, and trigger Total Internal Reflection.',
    interactionPoints: [
      {
        title: 'Laser Source & Wavelength',
        description: 'Select Red (650nm), Green (532nm), Blue (450nm), or Polychromatic White Light to observe Cauchy’s chromatic dispersion.',
        badge: 'Top Bar',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      },
      {
        title: 'Angle of Incidence Slider (θ₁)',
        description: 'Adjust the incident angle from 0° (normal incidence) to 85° to watch the refracted wavefront bend according to Snell’s Law.',
        badge: 'HUD Controls',
        icon: <Sliders className="w-4 h-4 text-yellow-400" />,
      },
      {
        title: 'Medium Refractive Index (n₂)',
        description: 'Switch the prism material between Water (1.33), Crown Glass (1.52), Flint Glass (1.66), and Diamond (2.42).',
        badge: 'HUD Selector',
        icon: <Layers className="w-4 h-4 text-cyan-400" />,
      },
      {
        title: 'Total Internal Reflection (TIR) Mode',
        description: 'Adjust the laser beyond the critical angle (θ₁ > θ_c) to witness 100% internal reflection locking within the optical boundary.',
        badge: 'Interactive Task',
        icon: <Target className="w-4 h-4 text-emerald-400" />,
      },
    ],
    keyControls: [
      { action: 'Orbit Optical Bench', input: 'Left Click + Drag to rotate 3D prism angle' },
      { action: 'Zoom Optical Wavefront', input: 'Mouse Wheel to zoom in on refractive boundary' },
      { action: 'Lock Critical Angle TIR', input: 'Set incident angle higher than θ_c (e.g. > 41.8°)' },
      { action: 'Snell’s Law Calculations', input: 'Read real-time θ₂, critical angle θ_c, and phase velocity' },
    ],
    challenge: {
      title: 'Total Internal Reflection Challenge',
      task: 'Set medium to Crown Glass (n=1.52) and adjust incident angle beyond 41.8° to lock light in Total Internal Reflection.',
    },
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  labId: LabId;
}

export const LabQuickStartModal: React.FC<Props> = ({ isOpen, onClose, labId }) => {
  if (!isOpen) return null;

  const guide = GUIDES[labId] || GUIDES.chemistry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id={`quickstart-modal-${labId}`}
        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              {guide.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">{guide.title}</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${guide.colorTheme.bgBadge}`}>
                  Quick Start Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{guide.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Quick Start"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Overview Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed">
            {guide.overview}
          </div>

          {/* Core Interaction Points */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Main Lab Interaction Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {guide.interactionPoints.map((point, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between space-y-2 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {point.icon}
                      </div>
                      <span className="font-semibold text-white text-xs leading-snug">
                        {point.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                      {point.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">{point.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mouse & Keyboard Navigation Guide */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
              3D Viewport Controls
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guide.keyControls.map((ctrl, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px]"
                >
                  <span className="text-slate-400">{ctrl.action}</span>
                  <span className="font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60 text-[10px]">
                    {ctrl.input}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Scientific Milestone Challenge */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wide block">
                Lab Goal: {guide.challenge.title}
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{guide.challenge.task}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg cursor-pointer ${guide.colorTheme.button}`}
          >
            Start Experimenting
          </button>
        </div>
      </div>
    </div>
  );
};
