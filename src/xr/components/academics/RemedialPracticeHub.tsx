import React, { useState } from 'react';
import { LabId, RemedialActivity } from '../../types';
import { Award, CheckCircle2, ChevronRight, HelpCircle, Lightbulb, RotateCcw, Sparkles, Target, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../toast/ToastContext';

interface Props {
  onAwardXP: (xp: number, reason: string) => void;
  onNavigateToLab: (labId: LabId) => void;
}

const REMEDIAL_ACTIVITIES: RemedialActivity[] = [
  {
    id: 'rem-vsepr',
    title: 'VSEPR Bond Angles & Lone Pair Repulsion',
    subject: 'Molecular Chemistry',
    labId: 'chemistry',
    concept: 'Valence Shell Electron Pair Repulsion Theory',
    difficulty: 'Foundational',
    estimatedMinutes: 5,
    xpReward: 35,
    completed: false,
    summary: 'Understand how non-bonding lone pairs distort idealized molecular geometries by exerting stronger electrostatic repulsion than bonding pairs.',
    commonMistake: 'Assuming that water (H₂O) has the same 109.5° tetrahedral angle as methane (CH₄) despite possessing 2 lone pairs.',
    conceptLaw: 'Lone Pair - Lone Pair > Lone Pair - Bonding Pair > Bonding Pair - Bonding Pair repulsion.',
    interactiveType: 'vsepr_slider',
  },
  {
    id: 'rem-kepler',
    title: 'Kepler’s 3rd Law Harmonic Power Solver',
    subject: 'Astrophysics',
    labId: 'astrophysics',
    concept: 'Orbital Period vs. Semi-Major Axis Ratio (T² = a³)',
    difficulty: 'Intermediate',
    estimatedMinutes: 6,
    xpReward: 35,
    completed: false,
    summary: 'Practice calculating the orbital period of celestial bodies orbiting the Sun using Kepler’s Harmonic Law where period squared equals distance cubed.',
    commonMistake: 'Multiplying period by distance linearly instead of squaring the period (T²) and cubing the semi-major axis (a³).',
    conceptLaw: 'T² (years) = a³ (Astronomical Units, AU) for heliocentric orbits.',
    interactiveType: 'kepler_calc',
  },
  {
    id: 'rem-snell',
    title: 'Snell’s Law & Total Internal Reflection',
    subject: 'Wave Optics',
    labId: 'optics',
    concept: 'Refractive Index & Critical Angle Threshold',
    difficulty: 'Foundational',
    estimatedMinutes: 5,
    xpReward: 35,
    completed: false,
    summary: 'Determine the angle of refraction when light transitions between optical media with differing refractive indices, and calculate the critical angle.',
    commonMistake: 'Measuring the angle relative to the interface surface rather than relative to the normal (perpendicular) line.',
    conceptLaw: 'n₁ · sin(θ₁) = n₂ · sin(θ₂). Critical angle θc = arcsin(n₂ / n₁) when n₁ > n₂.',
    interactiveType: 'snell_refract',
  },
  {
    id: 'rem-dna',
    title: 'DNA to mRNA Complementary Transcription',
    subject: 'Cellular Biology',
    labId: 'biology',
    concept: 'Nucleotide Base-Pairing Rules during Transcription',
    difficulty: 'Foundational',
    estimatedMinutes: 4,
    xpReward: 35,
    completed: false,
    summary: 'Transcribe a template strand of genomic DNA into messenger RNA using Chargaff’s complementary base-pairing rules.',
    commonMistake: 'Pairing Adenine with Thymine in RNA instead of Uracil (RNA has Uracil in place of Thymine).',
    conceptLaw: 'DNA: A → RNA: U; DNA: T → RNA: A; DNA: C → RNA: G; DNA: G → RNA: C.',
    interactiveType: 'dna_pair',
  },
];

export const RemedialPracticeHub: React.FC<Props> = ({ onAwardXP, onNavigateToLab }) => {
  const { showToast } = useToast();
  const [selectedActivity, setSelectedActivity] = useState<RemedialActivity>(REMEDIAL_ACTIVITIES[0]);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  // Interactive state for VSEPR drill
  const [vseprLonePairs, setVseprLonePairs] = useState<number>(0);
  const [vseprUserChoice, setVseprUserChoice] = useState<string>('');
  const [vseprFeedback, setVseprFeedback] = useState<string | null>(null);

  // Interactive state for Kepler drill
  const [keplerAU, setKeplerAU] = useState<number>(1.52); // Mars approx
  const [keplerUserPeriod, setKeplerUserPeriod] = useState<string>('');
  const [keplerFeedback, setKeplerFeedback] = useState<string | null>(null);

  // Interactive state for Snell drill
  const [snellTheta1, setSnellTheta1] = useState<number>(30);
  const [snellN1, setSnellN1] = useState<number>(1.0); // Air
  const [snellN2, setSnellN2] = useState<number>(1.5); // Glass
  const [snellFeedback, setSnellFeedback] = useState<string | null>(null);

  // Interactive state for DNA drill
  const [dnaAnswers, setDnaAnswers] = useState<Record<number, string>>({});
  const [dnaFeedback, setDnaFeedback] = useState<string | null>(null);

  // Compute calculated VSEPR angle
  const computedVseprAngle = vseprLonePairs === 0 ? 109.5 : vseprLonePairs === 1 ? 107.0 : 104.5;
  const computedVseprName = vseprLonePairs === 0 ? 'Tetrahedral (e.g. CH₄)' : vseprLonePairs === 1 ? 'Trigonal Pyramidal (e.g. NH₃)' : 'Bent (e.g. H₂O)';

  // Compute calculated Kepler period: T = sqrt(a^3)
  const actualKeplerPeriod = Math.sqrt(Math.pow(keplerAU, 3)).toFixed(2);

  // Compute Snell angle: theta2 = asin((n1/n2) * sin(theta1_rad))
  const sinTheta2 = (snellN1 / snellN2) * Math.sin((snellTheta1 * Math.PI) / 180);
  const isTIR = sinTheta2 > 1.0;
  const computedTheta2 = isTIR ? null : ((Math.asin(sinTheta2) * 180) / Math.PI).toFixed(1);

  const handleMarkCompleted = (actId: string, title: string, xp: number) => {
    if (completedMap[actId]) return;
    setCompletedMap((prev) => ({ ...prev, [actId]: true }));
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    onAwardXP(xp, `Remedial Drill Mastered: ${title}`);
    showToast({
      type: 'badge',
      title: 'Concept Recovery Completed!',
      message: `You earned +${xp} XP and raised your academic subject mastery.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Remedial Practice & Concept Recovery Hub
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
              TRACKING ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Targeted drills and interactive calculators to help you master tricky science formulas and recover grade percentages.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Drills Mastered:</span>
          <span className="text-emerald-400 font-bold">
            {Object.values(completedMap).filter(Boolean).length} / {REMEDIAL_ACTIVITIES.length}
          </span>
        </div>
      </div>

      {/* Main Grid: Drill Selector on Left, Interactive Workspace on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drill Selector Sidebar */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Select Practice Drill:
          </h4>
          {REMEDIAL_ACTIVITIES.map((act) => {
            const isCompleted = completedMap[act.id];
            const isSelected = selectedActivity.id === act.id;
            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold block uppercase">
                      {act.subject}
                    </span>
                    <h5 className="text-xs font-bold text-white mt-0.5">{act.title}</h5>
                  </div>
                  {isCompleted ? (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-mono font-bold">
                      +{act.xpReward} XP
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                  {act.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Interactive Drill Practice Screen (2 Cols) */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          {/* Active Activity Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                {selectedActivity.subject} • Remedial Skill Builder
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedActivity.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToLab(selectedActivity.labId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all cursor-pointer"
                title="Launch 3D WebGL Lab Experiment"
              >
                <span>Launch 3D Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Key Concept Law & Common Pitfall Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Fundamental Governing Law:</span>
              </div>
              <p className="text-[11px] font-mono leading-relaxed text-cyan-100">
                {selectedActivity.conceptLaw}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Common Student Pitfall:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-100">
                {selectedActivity.commonMistake}
              </p>
            </div>
          </div>

          {/* Interactive Exercise Stage */}
          <div className="p-4 md:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            {/* 1. VSEPR Slider Drill */}
            {selectedActivity.interactiveType === 'vsepr_slider' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Step 1: Adjust Non-Bonding Lone Pairs on Central Atom:
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {vseprLonePairs} Lone Pairs
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={vseprLonePairs}
                    onChange={(e) => setVseprLonePairs(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">Calculated Bond Angle:</span>
                    <strong className="text-xl text-cyan-300 block mt-0.5">{computedVseprAngle}°</strong>
                    <span className="text-[10px] text-slate-500">
                      {vseprLonePairs === 0 ? 'No lone pair compression' : `${vseprLonePairs * 2.5}° angle compression due to repulsion`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Resulting Molecular Shape:</span>
                    <strong className="text-sm text-emerald-300 block mt-1">{computedVseprName}</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-white block">
                    Diagnostic Question: Why is H₂O's bond angle (104.5°) smaller than NH₃'s (107°)?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => {
                        setVseprUserChoice('A');
                        setVseprFeedback('Correct! Water has 2 lone pairs which repel bonding pairs more strongly than the 1 lone pair in ammonia.');
                        handleMarkCompleted('rem-vsepr', selectedActivity.title, selectedActivity.xpReward);
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        vseprUserChoice === 'A'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      A. H₂O has 2 lone pairs, causing greater electron repulsion than NH₃'s single pair.
                    </button>
                    <button
                      onClick={() => {
                        setVseprUserChoice('B');
                        setVseprFeedback('Incorrect. Hydrogen mass has no effect on electrostatic valence electron repulsion angles.');
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        vseprUserChoice === 'B'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      B. Oxygen has lighter hydrogen atoms pulling on its nucleus.
                    </button>
                  </div>
                  {vseprFeedback && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${
                      vseprUserChoice === 'A' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                    }`}>
                      {vseprFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Kepler Calculator Drill */}
            {selectedActivity.interactiveType === 'kepler_calc' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Step 1: Set Orbital Distance (Semi-Major Axis a in AU):
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    a = {keplerAU.toFixed(2)} AU
                  </span>
                </div>

                <input
                  type="range"
                  min="0.3"
                  max="5.2"
                  step="0.05"
                  value={keplerAU}
                  onChange={(e) => setKeplerAU(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">Distance Cubed (a³):</span>
                    <strong className="text-base text-amber-300 block mt-0.5">
                      {Math.pow(keplerAU, 3).toFixed(2)} AU³
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Orbital Period T = √(a³):</span>
                    <strong className="text-xl text-emerald-400 block mt-0.5">
                      {actualKeplerPeriod} Earth Years
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-white block">
                    Diagnostic Challenge: An asteroid has a semi-major axis of a = 4.0 AU. What is its orbital period T in years?
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Enter period (e.g. 8.0)..."
                      value={keplerUserPeriod}
                      onChange={(e) => setKeplerUserPeriod(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono w-48 focus:border-amber-400 outline-none"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(keplerUserPeriod.trim());
                        if (val === 8 || val === 8.0) {
                          setKeplerFeedback('Spot on! T² = 4³ = 64 → T = √64 = 8.0 Earth years.');
                          handleMarkCompleted('rem-kepler', selectedActivity.title, selectedActivity.xpReward);
                        } else {
                          setKeplerFeedback(`Not quite. Calculate 4³ = 64 first, then take the square root √64.`);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer transition-all"
                    >
                      Verify Answer
                    </button>
                  </div>
                  {keplerFeedback && (
                    <div className="p-3 rounded-lg text-xs font-medium bg-slate-900 border border-amber-500/30 text-amber-300">
                      {keplerFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Snell's Law Drill */}
            {selectedActivity.interactiveType === 'snell_refract' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-white block mb-1">Incident Angle θ₁: {snellTheta1}°</span>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="1"
                      value={snellTheta1}
                      onChange={(e) => setSnellTheta1(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block mb-1">Medium 2 Index n₂: {snellN2}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSnellN2(1.33)}
                        className={`px-2.5 py-1 rounded text-xs font-mono ${snellN2 === 1.33 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                      >
                        Water (1.33)
                      </button>
                      <button
                        onClick={() => setSnellN2(1.52)}
                        className={`px-2.5 py-1 rounded text-xs font-mono ${snellN2 === 1.52 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                      >
                        Crown Glass (1.52)
                      </button>
                      <button
                        onClick={() => setSnellN2(2.42)}
                        className={`px-2.5 py-1 rounded text-xs font-mono ${snellN2 === 2.42 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                      >
                        Diamond (2.42)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">Angle of Refraction θ₂:</span>
                    <strong className="text-xl text-cyan-300 block mt-0.5">
                      {isTIR ? 'Total Internal Reflection' : `${computedTheta2}°`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ray Bending Behavior:</span>
                    <strong className="text-xs text-emerald-300 block mt-1">
                      Bends towards the normal (θ₂ &lt; θ₁) because n₂ &gt; n₁
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleMarkCompleted('rem-snell', selectedActivity.title, selectedActivity.xpReward);
                    setSnellFeedback('Mastered! You verified Snell’s Law and how light slows down in denser optical media.');
                  }}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Verify Refraction Calculation (+35 XP)
                </button>
                {snellFeedback && (
                  <div className="p-3 rounded-lg text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                    {snellFeedback}
                  </div>
                )}
              </div>
            )}

            {/* 4. DNA Transcription Drill */}
            {selectedActivity.interactiveType === 'dna_pair' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white block">
                  Match the DNA Template Strand to the Complementary mRNA Transcript:
                </span>

                <div className="flex items-center gap-3 justify-center py-2 bg-slate-900 rounded-xl border border-slate-800 font-mono text-sm">
                  <div className="text-right text-slate-400 pr-2 border-r border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase">DNA</div>
                    <div className="text-cyan-400 font-bold tracking-widest">3'- A - T - G - C - 5'</div>
                  </div>
                  <div className="text-left text-slate-400 pl-2">
                    <div className="text-[10px] text-slate-500 uppercase">mRNA</div>
                    <div className="flex items-center gap-2">
                      {['U', 'A', 'C', 'G'].map((correctBase, idx) => (
                        <select
                          key={idx}
                          value={dnaAnswers[idx] || ''}
                          onChange={(e) => setDnaAnswers({ ...dnaAnswers, [idx]: e.target.value })}
                          className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs font-bold"
                        >
                          <option value="">?</option>
                          <option value="A">A</option>
                          <option value="T">T</option>
                          <option value="C">C</option>
                          <option value="G">G</option>
                          <option value="U">U</option>
                        </select>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const ans = [dnaAnswers[0], dnaAnswers[1], dnaAnswers[2], dnaAnswers[3]];
                    if (ans[0] === 'U' && ans[1] === 'A' && ans[2] === 'C' && ans[3] === 'G') {
                      setDnaFeedback('Flawless transcription! RNA correctly substitutes Uracil (U) for Thymine (T) when pairing with DNA Adenine.');
                      handleMarkCompleted('rem-dna', selectedActivity.title, selectedActivity.xpReward);
                    } else if (ans[0] === 'T') {
                      setDnaFeedback('Almost! Remember: RNA does NOT contain Thymine (T). Adenine (A) pairs with Uracil (U) in RNA.');
                    } else {
                      setDnaFeedback('Check your pairings: DNA A pairs with mRNA U, T pairs with A, G pairs with C, and C pairs with G.');
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Verify mRNA Transcription (+35 XP)
                </button>
                {dnaFeedback && (
                  <div className="p-3 rounded-lg text-xs font-medium bg-slate-900 border border-emerald-500/30 text-emerald-300">
                    {dnaFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
