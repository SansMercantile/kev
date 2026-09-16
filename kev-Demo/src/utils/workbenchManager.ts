import {
  WorkbenchCustomizerState,
  WorkbenchFunctionalUpgrade,
  WorkbenchSurface,
  WorkbenchLighting,
  WorkbenchEfficiencyStats,
} from '../types';

export const WORKBENCH_FUNCTIONAL_UPGRADES: WorkbenchFunctionalUpgrade[] = [
  {
    id: 'upgrade-cuda-co-processor',
    name: 'Tensor Simulation Accelerator',
    category: 'computation',
    targetEquipment: 'all',
    tier: 'MK-II',
    level: 1,
    maxLevel: 3,
    costXP: 120,
    unlocked: true,
    equipped: true,
    efficiencyBonusPercent: 25,
    precisionBoostPercent: 10,
    speedMultiplier: 1.35,
    xpMultiplierBonus: 0.05,
    description: 'Hardware-accelerated tensor co-processor that rapidly calculates molecular orbital configurations and Keplerian orbital paths.',
    perkEffect: '+25% Simulation Speed • 1.35x Convergence Rate',
    icon: 'Cpu',
  },
  {
    id: 'upgrade-cryo-sensor-collimator',
    name: 'Sub-Kelvin Cryo-Stabilizer',
    category: 'precision',
    targetEquipment: 'all',
    tier: 'MK-III',
    level: 1,
    maxLevel: 3,
    costXP: 150,
    unlocked: false,
    equipped: false,
    efficiencyBonusPercent: 20,
    precisionBoostPercent: 30,
    speedMultiplier: 1.1,
    xpMultiplierBonus: 0.08,
    description: 'Cryogenic cooling loop maintaining 77 Kelvin to completely eliminate thermal noise in spectrometers and laser interferometers.',
    perkEffect: '+30% Sensor Precision • Ultra-Fine Absorption Peaks',
    icon: 'Radio',
  },
  {
    id: 'upgrade-quantum-telemetry-logger',
    name: 'Quantum Telemetry Streamer',
    category: 'xp_yield',
    targetEquipment: 'all',
    tier: 'Quantum-Overclock',
    level: 1,
    maxLevel: 3,
    costXP: 180,
    unlocked: false,
    equipped: false,
    efficiencyBonusPercent: 15,
    precisionBoostPercent: 12,
    speedMultiplier: 1.15,
    xpMultiplierBonus: 0.20,
    description: 'High-throughput broadband telemetry module that streams experiment datasets to KEV Academy, granting bonus XP for every simulation run.',
    perkEffect: '+20% Bonus Academic XP on all lab runs & snapshots',
    icon: 'Zap',
  },
  {
    id: 'upgrade-adaptive-pid-crucible',
    name: 'Adaptive PID Phase Controller',
    category: 'energy_stability',
    targetEquipment: 'chemistry',
    tier: 'MK-II',
    level: 1,
    maxLevel: 3,
    costXP: 90,
    unlocked: true,
    equipped: true,
    efficiencyBonusPercent: 18,
    precisionBoostPercent: 15,
    speedMultiplier: 1.2,
    xpMultiplierBonus: 0.05,
    description: 'Micro-second digital proportional-integral-derivative thermal loop for bunsen flames and reaction crucibles.',
    perkEffect: '+18% Reaction Thermal Stability • Zero Temperature Lag',
    icon: 'Flame',
  },
  {
    id: 'upgrade-relativistic-ray-tracer',
    name: 'Relativistic Photonic Engine',
    category: 'computation',
    targetEquipment: 'optics',
    tier: 'MK-III',
    level: 1,
    maxLevel: 3,
    costXP: 140,
    unlocked: false,
    equipped: false,
    efficiencyBonusPercent: 22,
    precisionBoostPercent: 20,
    speedMultiplier: 1.40,
    xpMultiplierBonus: 0.10,
    description: 'Dedicated GPU shader pipeline that computes Cauchy chromatic dispersion and Brewster polarization matrices with zero lag.',
    perkEffect: '1.40x Ray-Tracing Speed • Real-Time Fresnel Reflection',
    icon: 'Sparkles',
  },
  {
    id: 'upgrade-focal-interferometer',
    name: 'Aperture Synthesis Interferometer',
    category: 'precision',
    targetEquipment: 'astrophysics',
    tier: 'Quantum-Overclock',
    level: 1,
    maxLevel: 3,
    costXP: 200,
    unlocked: false,
    equipped: false,
    efficiencyBonusPercent: 28,
    precisionBoostPercent: 35,
    speedMultiplier: 1.25,
    xpMultiplierBonus: 0.15,
    description: 'Virtual multi-baseline optical interferometer creating a synthetic 100-meter aperture for planetary orbit telemetry.',
    perkEffect: '+35% Gravitational Precision • Sub-Arcsecond Lensing',
    icon: 'Orbit',
  },
  {
    id: 'upgrade-nanopore-sequencer',
    name: 'Rapid Nanopore Bio-Sequencer',
    category: 'computation',
    targetEquipment: 'biology',
    tier: 'MK-II',
    level: 1,
    maxLevel: 3,
    costXP: 110,
    unlocked: false,
    equipped: false,
    efficiencyBonusPercent: 20,
    precisionBoostPercent: 18,
    speedMultiplier: 1.30,
    xpMultiplierBonus: 0.08,
    description: 'Real-time nucleotide ionic current decoder for immediate organelle protein synthesis simulation.',
    perkEffect: '+20% Organelle Modeling Rate • Instant Codon Translation',
    icon: 'Dna',
  },
  {
    id: 'upgrade-superconducting-flux-capacitor',
    name: 'Superconducting Flux Reservoir',
    category: 'energy_stability',
    targetEquipment: 'all',
    tier: 'Quantum-Overclock',
    level: 1,
    maxLevel: 3,
    costXP: 220,
    unlocked: false,
    equipped: false,
    efficiencyBonusPercent: 30,
    precisionBoostPercent: 25,
    speedMultiplier: 1.35,
    xpMultiplierBonus: 0.15,
    description: 'Room-temperature superconductor circuit that eliminates voltage dips and simulation noise across all virtual labs.',
    perkEffect: '+30% Global Lab Efficiency • +15% XP Multiplier',
    icon: 'Activity',
  },
];

export interface WorkbenchSurfaceOption {
  id: WorkbenchSurface;
  name: string;
  material: string;
  costXP: number;
  previewClass: string;
  gradient: string;
  description: string;
  reflectionQuality: string;
}

export const WORKBENCH_SURFACES: WorkbenchSurfaceOption[] = [
  {
    id: 'porcelain',
    name: 'Cleanroom Glazed Porcelain',
    material: 'Ultra-pure vitrified white ceramic',
    costXP: 0,
    previewClass: 'bg-slate-100 border-slate-300 text-slate-800',
    gradient: 'from-slate-100 via-slate-200 to-slate-100',
    description: 'Standard hospital & clinical cleanroom porcelain desk with anti-corrosive silicate glaze.',
    reflectionQuality: 'Soft Specular Diffuse',
  },
  {
    id: 'titanium',
    name: 'Aerospace Grade 5 Titanium',
    material: 'Brushed Ti-6Al-4V alloy plate',
    costXP: 80,
    previewClass: 'bg-gradient-to-br from-slate-400 via-slate-500 to-zinc-600 text-white',
    gradient: 'from-slate-400 via-zinc-500 to-slate-600',
    description: 'Lightweight aerospace titanium with laser-etched precision alignment reticles and thermal heat sinks.',
    reflectionQuality: 'Brushed Anisotropic Luster',
  },
  {
    id: 'carbon_weave',
    name: 'Toray Carbon-Fiber Weave',
    material: 'High-modulus carbon-fiber composite',
    costXP: 120,
    previewClass: 'bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-cyan-300',
    gradient: 'from-zinc-900 via-black to-zinc-950',
    description: 'Ultra-rigid, zero-vibration matte black carbon weave ensuring absolute stability during high-speed laser experiments.',
    reflectionQuality: 'Micro-Twill Cross Reflection',
  },
  {
    id: 'holo_grid',
    name: 'Cyber Holographic Projection Deck',
    material: 'Optoelectronic photon emitter array',
    costXP: 160,
    previewClass: 'bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950 text-cyan-200',
    gradient: 'from-cyan-950 via-slate-950 to-blue-950',
    description: 'Dynamic translucent surface that projects 3D spatial coordinate grids, vectors, and live wave interference rings under your instruments.',
    reflectionQuality: 'Volumetric Holographic Glow',
  },
  {
    id: 'scholar_wood',
    name: 'Victorian Mahogany Scholar Deck',
    material: 'Hand-finished genuine mahogany hardwood',
    costXP: 75,
    previewClass: 'bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950 text-amber-200',
    gradient: 'from-amber-950 via-stone-900 to-yellow-950',
    description: 'Warm, refined heritage hardwood reminiscent of classic European natural philosophy and Royal Society laboratory cabinets.',
    reflectionQuality: 'Warm Organic Satin Sheen',
  },
];

export interface WorkbenchLightingOption {
  id: WorkbenchLighting;
  name: string;
  colorName: string;
  costXP: number;
  glowColor: string;
  accentClass: string;
  description: string;
}

export const WORKBENCH_LIGHTINGS: WorkbenchLightingOption[] = [
  {
    id: 'cyan_ion',
    name: 'Cyan Ion Stream',
    colorName: 'Pure Cyan 470nm',
    costXP: 0,
    glowColor: 'rgba(6, 182, 212, 0.5)',
    accentClass: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
    description: 'Sharp, focused laboratory cyan spectrum that maximizes optical contrast during instrument alignment.',
  },
  {
    id: 'amber_stellar',
    name: 'Amber Solar Corona',
    colorName: 'Warm Amber 585nm',
    costXP: 60,
    glowColor: 'rgba(245, 158, 11, 0.5)',
    accentClass: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
    description: 'Warm solar-spectrum ambient lighting inspired by G-type main sequence stars.',
  },
  {
    id: 'emerald_bio',
    name: 'Emerald Biosphere Radiance',
    colorName: 'Luminescent Green 515nm',
    costXP: 75,
    glowColor: 'rgba(16, 185, 129, 0.5)',
    accentClass: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
    description: 'Calming plant chlorophyll wavelength ideal for cellular microscopy and genetics simulations.',
  },
  {
    id: 'violet_quantum',
    name: 'Violet Quantum Horizon',
    colorName: 'Deep Violet 405nm',
    costXP: 90,
    glowColor: 'rgba(139, 92, 246, 0.5)',
    accentClass: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
    description: 'High-energy ultraviolet border luminescence that excites fluorescent molecular markers.',
  },
  {
    id: 'aurora_borealis',
    name: 'Aurora Borealis Geomagnetic',
    colorName: 'Dynamic Polar Wind Gradient',
    costXP: 140,
    glowColor: 'rgba(20, 184, 166, 0.6)',
    accentClass: 'text-teal-300 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 border-teal-500/40',
    description: 'Shifting geomagnetic ionization aurora shifting fluidly between emerald, indigo, and magenta.',
  },
];

const LOCAL_STORAGE_KEY = 'kev_workbench_customizer_state';

export function getDefaultWorkbenchState(): WorkbenchCustomizerState {
  return {
    deskSurface: 'porcelain',
    ambientLighting: 'cyan_ion',
    equippedToolId: 'tool-spectrometer',
    equippedSkinIds: {
      bunsen_burner: 'skin-bunsen-plasma-aurora',
      laser_collimator: 'skin-laser-deep-space',
      micropipette: 'skin-pipette-carbon-weave',
      spectrometer: 'skin-spectrometer-obsidian',
      microscope: 'skin-microscope-bioluminescent',
      telescope: 'skin-telescope-deep-nebula',
    },
    unlockedSkinIds: [
      'skin-bunsen-plasma-aurora',
      'skin-laser-deep-space',
      'skin-pipette-carbon-weave',
      'skin-microscope-bioluminescent',
      'skin-telescope-deep-nebula',
    ],
    unlockedUpgradeIds: [
      'upgrade-cuda-co-processor',
      'upgrade-adaptive-pid-crucible',
    ],
    upgradeLevels: {
      'upgrade-cuda-co-processor': 1,
      'upgrade-adaptive-pid-crucible': 1,
    },
    equippedUpgradeIds: [
      'upgrade-cuda-co-processor',
      'upgrade-adaptive-pid-crucible',
    ],
  };
}

export function getWorkbenchCustomizerState(): WorkbenchCustomizerState {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...getDefaultWorkbenchState(),
        ...parsed,
      };
    }
  } catch {
    // ignore
  }
  return getDefaultWorkbenchState();
}

export function saveWorkbenchCustomizerState(state: WorkbenchCustomizerState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function calculateEfficiencyStats(state: WorkbenchCustomizerState): WorkbenchEfficiencyStats {
  let baseEfficiency = 100;
  let precisionBoost = 0;
  let computeAcceleration = 1.0;
  let xpYieldBonus = 0;
  let activeCount = 0;

  for (const upgradeId of state.equippedUpgradeIds) {
    const upgrade = WORKBENCH_FUNCTIONAL_UPGRADES.find((u) => u.id === upgradeId);
    if (upgrade) {
      activeCount++;
      const level = state.upgradeLevels[upgradeId] || 1;
      const levelMultiplier = 1 + (level - 1) * 0.45; // Level 2: +45%, Level 3: +90%
      baseEfficiency += Math.round(upgrade.efficiencyBonusPercent * levelMultiplier);
      precisionBoost += Math.round(upgrade.precisionBoostPercent * levelMultiplier);
      computeAcceleration += (upgrade.speedMultiplier - 1.0) * levelMultiplier;
      xpYieldBonus += upgrade.xpMultiplierBonus * levelMultiplier;
    }
  }

  return {
    totalSimulationEfficiency: baseEfficiency,
    totalPrecisionBoost: precisionBoost,
    totalComputeAcceleration: parseFloat(computeAcceleration.toFixed(2)),
    totalXPYieldBonus: parseFloat((xpYieldBonus * 100).toFixed(1)),
    activeUpgradesCount: activeCount,
  };
}

export function getUpgradeNextCost(upgrade: WorkbenchFunctionalUpgrade, currentLevel: number): number {
  if (currentLevel >= upgrade.maxLevel) return 0;
  return Math.round(upgrade.costXP * Math.pow(1.5, currentLevel));
}
