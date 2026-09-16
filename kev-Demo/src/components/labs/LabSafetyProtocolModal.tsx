import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Eye,
  Flame,
  Orbit,
  Dna,
  Zap,
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { applyStreakMultiplier } from '../../utils/streakManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPassedSafetyQuiz: (xpEarned: number, badgeName: string) => void;
  isMandatoryFirstTime?: boolean;
}

interface SafetyQuestion {
  id: string;
  discipline: 'Optics' | 'Chemistry' | 'Astrophysics' | 'Biology' | 'XR Ergonomics';
  icon: any;
  iconColor: string;
  title: string;
  scenario: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 'optics-laser',
    discipline: 'Optics',
    icon: Eye,
    iconColor: 'text-amber-400',
    title: 'Class 3B/4 Coherent Laser Emission & Eye Protection',
    scenario:
      'Before emitting high-power coherent laser beams in the Wave Optics simulation workbench to measure Snell refraction angles and double-slit diffraction, what safety protocol is mandatory?',
    options: [
      { text: 'Look directly down the laser aperture to confirm optical alignment manually', isCorrect: false },
      { text: 'Verify virtual ocular safety HUD filters are engaged and clear all reflective jewelry/uncontained mirrors', isCorrect: true },
      { text: 'Double the beam intensity immediately to test virtual sensor heat tolerance', isCorrect: false },
      { text: 'Turn off all laboratory emergency illumination entirely', isCorrect: false },
    ],
    explanation:
      'High-power coherent optical radiation requires engaging virtual ocular protection filters and ensuring the beam path contains no stray specular reflections to prevent simulated sensor overload.',
  },
  {
    id: 'chem-exotherm',
    discipline: 'Chemistry',
    icon: Flame,
    iconColor: 'text-rose-400',
    title: 'Exothermic Reagent Solvation & Vapor Hood Protocols',
    scenario:
      'While mixing acid-base reagents in the 3D Molecular Chemistry lab, the reaction beaker temperature spikes rapidly with rising vapor emissions. What is your correct first course of action?',
    options: [
      { text: 'Pour cold water rapidly directly into the boiling concentrated acid beaker', isCorrect: false },
      { text: 'Lower the fume hood containment sash, isolate thermal input, and deploy appropriate neutralizing buffer', isCorrect: true },
      { text: 'Pick up the uninsulated glass beaker with bare hands to shake it vigorously', isCorrect: false },
      { text: 'Close the browser tab and ignore simulated spill alerts', isCorrect: false },
    ],
    explanation:
      'Never add water to concentrated acid. Proper protocol requires lowering the sash to contain vapors, cutting heat, and deploying neutralization buffers.',
  },
  {
    id: 'astro-singularity',
    discipline: 'Astrophysics',
    icon: Orbit,
    iconColor: 'text-purple-400',
    title: 'Gravitational Singularity & Orbital Horizon Safety',
    scenario:
      'In the Relativistic Astrophysics simulation, you increase the central mass toward black hole density. What boundary parameter must you monitor to maintain stable orbital equilibrium without tidal shredding?',
    options: [
      { text: 'Increase time dilation velocity to maximum 1000x immediately', isCorrect: false },
      { text: 'Keep planetary orbits outside the Schwarzschild radius (r_s = 2GM/c²) and Roche tidal disruption limit', isCorrect: true },
      { text: 'Place test probes inside the central event horizon to test gravity', isCorrect: false },
      { text: 'Disable gravitational force calculations across all celestial bodies', isCorrect: false },
    ],
    explanation:
      'Stable gravitational exploration requires keeping satellite orbits beyond the Roche tidal limit and well outside the Schwarzschild radius (event horizon) to prevent mathematical divergence and physical disintegration.',
  },
  {
    id: 'bio-sterile',
    discipline: 'Biology',
    icon: Dna,
    iconColor: 'text-emerald-400',
    title: 'BSL-2 Biosafety & Sterile Aseptic Technique',
    scenario:
      'When preparing recombinant DNA plasmids and eukaryotic cell cultures in the Cellular Biology workbench, how do you prevent experimental cross-contamination?',
    options: [
      { text: 'Leave culture petri dishes exposed next to open ventilation fans', isCorrect: false },
      { text: 'Operate within the laminar flow biosafety cabinet, use sterile aerosol-barrier pipette tips, and autoclave tools', isCorrect: true },
      { text: 'Reuse micropipette tips across different bacterial strains to conserve resources', isCorrect: false },
      { text: 'Store biological cultures on desktop surfaces without temperature regulation', isCorrect: false },
    ],
    explanation:
      'Biosafety Level 2 compliance mandates laminar flow containment cabinets, sterile barrier micropipette tips, and aseptic decontamination between genetic transfers.',
  },
  {
    id: 'xr-ergonomics',
    discipline: 'XR Ergonomics',
    icon: Zap,
    iconColor: 'text-cyan-400',
    title: 'Spatial XR Immersion & Emergency Boundary Override',
    scenario:
      'If you experience visual fatigue, simulation lag, or receive spatial boundary collision alerts while operating in 3D or WebXR pass-through mode, what protocol must be followed?',
    options: [
      { text: 'Continue rapid physical movement with the headset blinders active', isCorrect: false },
      { text: 'Engage the emergency simulation pause, disengage immersion mode, and take a 20-second focal break', isCorrect: true },
      { text: 'Shake the headset violently to recalibrate tracking sensors', isCorrect: false },
      { text: 'Increase brightness and audio volume to overpower disorientation', isCorrect: false },
    ],
    explanation:
      'Digital laboratory safety requires immediate pause and perceptual grounding if spatial disorientation or boundary alerts are detected.',
  },
];

export const LabSafetyProtocolModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPassedSafetyQuiz,
  isMandatoryFirstTime = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedSteps, setSubmittedSteps] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentQ = SAFETY_QUESTIONS[currentStepIndex];
  const IconComp = currentQ.icon;
  const isLastQuestion = currentStepIndex === SAFETY_QUESTIONS.length - 1;

  const currentSelectedOptionIndex = selectedAnswers[currentQ.id];
  const isCurrentSubmitted = submittedSteps[currentQ.id] || false;
  const isCurrentCorrect =
    currentSelectedOptionIndex !== undefined &&
    currentQ.options[currentSelectedOptionIndex]?.isCorrect;

  const totalAnsweredCorrectly = Object.entries(selectedAnswers).filter(
    ([qId, optIdx]) => {
      const q = SAFETY_QUESTIONS.find((item) => item.id === qId);
      return q && typeof optIdx === 'number' && q.options[optIdx]?.isCorrect;
    }
  ).length;

  const handleSelectOption = (index: number) => {
    if (isCurrentSubmitted && isCurrentCorrect) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: index }));
    setSubmittedSteps((prev) => ({ ...prev, [currentQ.id]: true }));

    const opt = currentQ.options[index];
    if (opt.isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
  };

  const handleNextOrFinish = () => {
    if (!isCurrentCorrect) return;

    if (!isLastQuestion) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Check if all correct
      const allPassed = SAFETY_QUESTIONS.every((q) => {
        const idx = selectedAnswers[q.id];
        return idx !== undefined && q.options[idx]?.isCorrect;
      });

      if (allPassed) {
        setIsCompleted(true);
        soundManager.playBadgeUnlock();
      }
    }
  };

  const handleClaimCertification = () => {
    // Save safety status
    try {
      localStorage.setItem('kev_lab_safety_passed', 'true');
    } catch {
      // Ignore
    }

    const baseXP = 75;
    const { multipliedXP } = applyStreakMultiplier(baseXP);

    onPassedSafetyQuiz(multipliedXP, 'Authorized Researcher');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Lab Safety & XR Protocol Clearance
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MANDATORY CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete this certification protocol to unlock full 3D interactive laboratory access.
              </p>
            </div>
          </div>

          {!isMandatoryFirstTime && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-xs font-mono"
            >
              Skip Refresher
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!isCompleted ? (
            <>
              {/* Progress Steps Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Safety Checkpoint {currentStepIndex + 1} of {SAFETY_QUESTIONS.length}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {totalAnsweredCorrectly}/{SAFETY_QUESTIONS.length} Cleared
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-700">
                  {SAFETY_QUESTIONS.map((q, idx) => {
                    const isQDone =
                      selectedAnswers[q.id] !== undefined &&
                      q.options[selectedAnswers[q.id]]?.isCorrect;
                    const isQActive = idx === currentStepIndex;

                    return (
                      <div
                        key={q.id}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          isQDone
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                            : isQActive
                            ? 'bg-cyan-400 animate-pulse'
                            : 'bg-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Question Card */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center ${currentQ.iconColor}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                      Discipline: {currentQ.discipline} Protocol
                    </span>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {currentQ.title}
                    </h4>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  {currentQ.scenario}
                </p>

                {/* Answer Options */}
                <div className="space-y-2.5 pt-1">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = currentSelectedOptionIndex === idx;
                    let optionStyle =
                      'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300';

                    if (isCurrentSubmitted) {
                      if (option.isCorrect) {
                        optionStyle =
                          'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 shadow-sm shadow-emerald-500/20';
                      } else if (isSelected && !option.isCorrect) {
                        optionStyle =
                          'bg-rose-950/50 border-rose-500/70 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isCurrentSubmitted && isCurrentCorrect}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs sm:text-sm font-medium ${optionStyle}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border text-xs font-bold font-mono ${
                            isCurrentSubmitted && option.isCorrect
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : isCurrentSubmitted && isSelected && !option.isCorrect
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'border-slate-600 text-slate-400'
                          }`}
                        >
                          {isCurrentSubmitted && option.isCorrect ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : isCurrentSubmitted && isSelected && !option.isCorrect ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </div>
                        <span className="flex-1 leading-snug">{option.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Feedback */}
                {isCurrentSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                      isCurrentCorrect
                        ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {isCurrentCorrect ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className="font-bold block">
                        {isCurrentCorrect ? 'Protocol Validated' : 'Safety Violation Detected'}
                      </span>
                      <p className="leading-relaxed opacity-90">{currentQ.explanation}</p>
                      {!isCurrentCorrect && (
                        <p className="text-[11px] font-semibold text-rose-200 mt-1">
                          Please select the correct laboratory protocol to continue.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            /* Congratulations & Credential Awarding Screen */
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border-2 border-cyan-500/50 text-center space-y-6 shadow-2xl"
            >
              {/* Badge Emblem */}
              <div className="relative inline-block">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.4)',
                      '0 0 50px rgba(99, 102, 241, 0.6)',
                      '0 0 20px rgba(6, 182, 212, 0.4)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl mx-auto border-2 border-cyan-300/60"
                >
                  <Award className="w-14 h-14 text-amber-300 drop-shadow-md" />
                </motion.div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950 border border-amber-400/60 text-amber-300 text-[10px] font-mono font-black uppercase whitespace-nowrap shadow-md">
                  Official Academic Credential
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase font-bold tracking-widest">
                    Safety Certification Cleared
                  </span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Authorized Researcher
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Congratulations! You have demonstrated mastery of high-energy optics containment, chemical fume management, relativistic thresholds, and sterile BSL-2 techniques.
                </p>
              </div>

              {/* Rewards Box */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Badge Awarded</span>
                  <span className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Authorized Researcher
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">XP Reward</span>
                  <span className="text-sm font-bold text-cyan-300 flex items-center justify-center gap-1 mt-0.5">
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    +75 Base XP
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Credential ID: KEV-SAFETY-XR-{Date.now().toString().slice(-6)} • Valid across all 4 Virtual Laboratories
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {!isCompleted ? (
            <>
              <div className="text-xs text-slate-400 hidden sm:block">
                Select the safety-compliant answer to unlock the next checkpoint.
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleNextOrFinish}
                  disabled={!isCurrentCorrect}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
                    isCurrentCorrect
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>{isLastQuestion ? 'Complete Protocol & Certify' : 'Next Checkpoint'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleClaimCertification}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/30 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Collect 'Authorized Researcher' Badge & Enter Virtual Labs</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
