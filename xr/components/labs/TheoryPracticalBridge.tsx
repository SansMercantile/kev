import React, { useState } from 'react';
import { LabId } from '../../types';
import { BookOpen, Calculator, FlaskConical, Orbit, Dna, Sparkles, Layers, ArrowRight, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface Props {
  activeLab: LabId;
  onLaunchPractical: (labId: LabId) => void;
  onRequestAITutor?: (prompt: string) => void;
}

export const TheoryPracticalBridge: React.FC<Props> = ({
  activeLab,
  onLaunchPractical,
  onRequestAITutor,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<LabId>(activeLab);

  // Interactive formula states
  const [chemBondPairs, setChemBondPairs] = useState<number>(3);
  const [chemLonePairs, setChemLonePairs] = useState<number>(1);

  const [astroMass, setAstroMass] = useState<number>(1.0); // Solar masses
  const [astroDistance, setAstroDistance] = useState<number>(1.0); // AU

  const [opticsN1, setOpticsN1] = useState<number>(1.0);
  const [opticsN2, setOpticsN2] = useState<number>(1.5);
  const [opticsAngle1, setOpticsAngle1] = useState<number>(45);

  // Chemistry steric calculation
  const stericNumber = chemBondPairs + chemLonePairs;
  const chemGeometry =
    stericNumber === 2 ? 'Linear (180°)' :
    stericNumber === 3 ? (chemLonePairs === 0 ? 'Trigonal Planar (120°)' : 'Bent (~118°)') :
    stericNumber === 4 ? (chemLonePairs === 0 ? 'Tetrahedral (109.5°)' : chemLonePairs === 1 ? 'Trigonal Pyramidal (~107°)' : 'Bent (~104.5°)') :
    'Trigonal Bipyramidal';

  // Astrophysics Kepler calculation
  const orbitalPeriodYears = Math.sqrt(Math.pow(astroDistance, 3) / astroMass).toFixed(2);
  const orbitalVelocityKmS = (29.8 / Math.sqrt(astroDistance)).toFixed(1);

  // Optics calculation
  const sinAngle2 = (opticsN1 / opticsN2) * Math.sin((opticsAngle1 * Math.PI) / 180);
  const angle2Deg = sinAngle2 <= 1.0 ? ((Math.asin(sinAngle2) * 180) / Math.PI).toFixed(1) : 'Total Internal Reflection';

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Theory & Practical Laboratory Bridge
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test mathematical laws and governing formulas on the whiteboard, then immediately launch the 3D practical simulation.
          </p>
        </div>

        {/* Topic Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setSelectedTopic('chemistry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedTopic === 'chemistry' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            VSEPR Theory
          </button>
          <button
            onClick={() => setSelectedTopic('astrophysics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedTopic === 'astrophysics' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kepler Mechanics
          </button>
          <button
            onClick={() => setSelectedTopic('optics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedTopic === 'optics' ? 'bg-purple-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Snell’s Law
          </button>
          <button
            onClick={() => setSelectedTopic('biology')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedTopic === 'biology' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cell Energetics
          </button>
        </div>
      </div>

      {/* Main Bridge Split: Theory & Formula Simulator (Left) + Direct Practical Launch (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Theory Calculator (2 Cols) */}
        <div className="lg:col-span-2 p-4 md:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          {/* Chemistry Topic */}
          {selectedTopic === 'chemistry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  <span>VSEPR Steric Number & Spatial Geometry Solver</span>
                </h4>
                <span className="text-xs font-mono text-cyan-300">Steric No. = {stericNumber}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Bonding Electron Pairs (X): {chemBondPairs}</span>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={chemBondPairs}
                    onChange={(e) => setChemBondPairs(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Non-Bonding Lone Pairs (E): {chemLonePairs}</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={chemLonePairs}
                    onChange={(e) => setChemLonePairs(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">VSEPR Notation:</span>
                  <strong className="text-base text-cyan-300 block mt-0.5">AX_{chemBondPairs}E_{chemLonePairs}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Predicted Spatial Geometry:</span>
                  <strong className="text-sm text-emerald-400 block mt-0.5">{chemGeometry}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                <strong>Theoretical Law:</strong> Electron pairs around a central atom orient themselves in 3D space to minimize electrostatic repulsion. Lone pairs occupy greater angular volume than shared pairs.
              </p>
            </div>
          )}

          {/* Astrophysics Topic */}
          {selectedTopic === 'astrophysics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Orbit className="w-4 h-4 text-amber-400" />
                  <span>Kepler’s 3rd Harmonic Law & Orbital Velocity Simulator</span>
                </h4>
                <span className="text-xs font-mono text-amber-300">T² = a³ / M</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Central Star Mass (M☉): {astroMass}</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={astroMass}
                    onChange={(e) => setAstroMass(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Orbital Distance a (AU): {astroDistance}</span>
                  <input
                    type="range"
                    min="0.3"
                    max="5.0"
                    step="0.1"
                    value={astroDistance}
                    onChange={(e) => setAstroDistance(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Orbital Period (T):</span>
                  <strong className="text-base text-amber-300 block mt-0.5">{orbitalPeriodYears} Earth Years</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Orbital Velocity (v):</span>
                  <strong className="text-base text-emerald-400 block mt-0.5">{orbitalVelocityKmS} km/s</strong>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                <strong>Theoretical Law:</strong> The square of the orbital period of a planet is directly proportional to the cube of the semi-major axis of its orbit.
              </p>
            </div>
          )}

          {/* Optics Topic */}
          {selectedTopic === 'optics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Snell’s Law & Critical Refraction Angle Calculator</span>
                </h4>
                <span className="text-xs font-mono text-purple-300">n₁ sin θ₁ = n₂ sin θ₂</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">n₁ (Incident): {opticsN1}</span>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={opticsN1}
                    onChange={(e) => setOpticsN1(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">n₂ (Transmitted): {opticsN2}</span>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={opticsN2}
                    onChange={(e) => setOpticsN2(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Angle θ₁: {opticsAngle1}°</span>
                  <input
                    type="range"
                    min="0"
                    max="85"
                    step="1"
                    value={opticsAngle1}
                    onChange={(e) => setOpticsAngle1(parseInt(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Refracted Angle (θ₂):</span>
                  <strong className="text-base text-purple-300 block mt-0.5">
                    {typeof angle2Deg === 'string' && angle2Deg.includes('Total') ? angle2Deg : `${angle2Deg}°`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Optical Density Ratio:</span>
                  <strong className="text-base text-emerald-400 block mt-0.5">{(opticsN1 / opticsN2).toFixed(2)}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                <strong>Theoretical Law:</strong> As light crosses between media of varying refractive indices, the wave changes speed and bends. When transitioning from denser to rarer media, angles beyond the critical angle produce total internal reflection.
              </p>
            </div>
          )}

          {/* Biology Topic */}
          {selectedTopic === 'biology' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Dna className="w-4 h-4 text-emerald-400" />
                  <span>Eukaryotic Energetics & Organelle ATP Yield</span>
                </h4>
                <span className="text-xs font-mono text-emerald-300">C₆H₁₂O₆ + 6O₂ → 36-38 ATP</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-300">Mitochondria (Oxidative Phosphorylation):</span>
                  <strong className="text-emerald-400 font-mono">30-32 ATP / Glucose</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-300">Cytoplasm (Glycolysis):</span>
                  <strong className="text-cyan-400 font-mono">2 Net ATP / Glucose</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-300">Krebs Cycle Matrix:</span>
                  <strong className="text-amber-400 font-mono">2 ATP (GTP) + NADH Carriers</strong>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                <strong>Theoretical Law:</strong> Cellular respiration converts biochemical energy from nutrients into adenosine triphosphate (ATP), powering cellular metabolism across membranous organelles.
              </p>
            </div>
          )}
        </div>

        {/* Launch 3D Practical Experiment Callout (1 Col) */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/30 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
              Direct Practical Application
            </span>
            <h4 className="text-base font-bold text-white mt-1">
              Ready to experiment in 3D WebGL?
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Verify your theoretical calculations by manipulating live molecules, gravitational bodies, laser prisms, or organelle cross-sections in real time.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onLaunchPractical(selectedTopic)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Launch {selectedTopic.toUpperCase()} 3D Lab</span>
            </button>

            {onRequestAITutor && (
              <button
                onClick={() =>
                  onRequestAITutor(
                    `Can you guide me step-by-step through connecting the mathematical theory of ${selectedTopic} to our 3D laboratory experiment?`
                  )
                }
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Ask Professor KEV for Guidance</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
