import { LabEquipment } from '../types';

export const LAB_EQUIPMENT_CATALOG: LabEquipment[] = [
  {
    id: 'tool-spectrometer',
    name: 'Advanced Emission Spectrometer',
    category: 'chemistry',
    tier: 'Elite',
    costXP: 250,
    icon: 'Radio',
    tagline: 'Multi-channel spectral absorption and emission line analyzer',
    description:
      'Detects micro-spectral emission signatures and isotope mass distributions. Renders live Fourier-transform emission peaks for hydrogen, carbon, and nitrogen.',
    dataAnalysisFeatures: [
      'Fourier-Transform Emission Spectrum Peaks (380nm - 750nm)',
      'Sub-picometer Isotopic Abundance Calculator',
      'Real-time VSEPR Electron Cloud Density Heatmap',
    ],
    telemetryStats: [
      { label: 'Spectral Resolution', value: '0.02 nm', boost: '+40% Analytical Precision' },
      { label: 'Dynamic Range', value: '120 dB', boost: 'High Sensitivity' },
      { label: 'Signal-to-Noise', value: '10,000:1', boost: 'Cryo-Cooled Sensor' },
    ],
  },
  {
    id: 'tool-cryo-telescope',
    name: 'High-Powered Cryo-Telescope',
    category: 'astrophysics',
    tier: 'Quantum',
    costXP: 320,
    icon: 'Orbit',
    tagline: 'Sub-arcsecond focal magnification with gravitational lensing filter',
    description:
      'Cooled with liquid nitrogen to reduce thermal background noise, granting deep focal resolution of orbital perturbations, Keplerian harmonics, and relativistic frame-dragging.',
    dataAnalysisFeatures: [
      'Sub-arcsecond Focal Gravitational Lensing Mode',
      'Harmonic Keplerian Orbital Resonance Predictor',
      'Relativistic Doppler Shift & Radial Velocity Vectors',
    ],
    telemetryStats: [
      { label: 'Aperture', value: '1.2 m Primary', boost: 'Deep Field Optics' },
      { label: 'Focal Length', value: '18,000 mm', boost: 'Ultra Magnification' },
      { label: 'Thermal Cooling', value: '77 Kelvin', boost: 'Zero Thermal Noise' },
    ],
  },
  {
    id: 'tool-electron-probe',
    name: 'Nanometer Electron Micro-Probe',
    category: 'biology',
    tier: 'Elite',
    costXP: 280,
    icon: 'Dna',
    tagline: 'Atomic force nanometer scanner for cellular organelles & membrane bilayers',
    description:
      'Directly measures lipid bilayer membrane permeability, mitochondrial proton gradient voltages, and real-time ATP synthase rotation velocity.',
    dataAnalysisFeatures: [
      'Mitochondrial Proton Gradient (ΔΨm) Voltage Gauge',
      'Lipid Bilayer Fluidity & Cholesterol Packing Index',
      'Real-time mRNA Codon-to-tRNA Anticodon Matcher',
    ],
    telemetryStats: [
      { label: 'Lateral Resolution', value: '0.5 nm', boost: 'Sub-Cellular Precision' },
      { label: 'Voltage Sensitivity', value: '±1.0 mV', boost: 'Membrane Potential' },
      { label: 'Sampling Rate', value: '50 kHz', boost: 'Live Dynamics' },
    ],
  },
  {
    id: 'tool-refractometer',
    name: 'Holographic Laser Refractometer',
    category: 'optics',
    tier: 'Quantum',
    costXP: 260,
    icon: 'Sparkles',
    tagline: 'Multi-spectral chromatic dispersion prism with Fresnel coefficient HUD',
    description:
      'Emits coherent multi-spectral laser arrays through optical media to measure refractive indices, Cauchy dispersion constants, and Brewster angle polarization states.',
    dataAnalysisFeatures: [
      'Real-time Fresnel Transmission & Reflection Coefficients',
      'Continuous Cauchy Dispersion Formula Curve Generator',
      'Total Internal Reflection (TIR) Critical Angle Reticle',
    ],
    telemetryStats: [
      { label: 'Refractive Precision', value: '±0.0001 nD', boost: 'Laboratory Grade' },
      { label: 'Beam Coherence', value: '99.98%', boost: 'Monochromatic Array' },
      { label: 'Phase Shift Tracking', value: 'λ/100', boost: 'Interferometric Precision' },
    ],
  },
  {
    id: 'tool-chrono-velocity',
    name: 'Chrono-Velocity Doppler Tachymeter',
    category: 'multi_discipline',
    tier: 'Prototype',
    costXP: 400,
    icon: 'Activity',
    tagline: 'High-frequency relativistic vector logger & multi-lab telemetry analyzer',
    description:
      'A prototype research tool developed by KEV Academy engineers that records high-speed physical velocity transients, phase shifts, and acceleration anomalies across all four labs.',
    dataAnalysisFeatures: [
      'Universal Multi-Lab Telemetry Data Streamer',
      'Oscilloscopic Waveform & Harmonic Distortion FFT',
      'CSV / JSON Research Log Export with Microsecond Timestamps',
    ],
    telemetryStats: [
      { label: 'Clock Precision', value: '100 Femtoseconds', boost: 'Atomic Clock Synced' },
      { label: 'Buffer Depth', value: '16 Million Pts', boost: 'Continuous Streaming' },
      { label: 'Active XP Multiplier', value: '+15% Lab XP', boost: 'Academic Grant Perk' },
    ],
  },
];
