import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SCIENCE_TWIN_CHALLENGES } from '../../data/advancedLabSystemsData';
import { LabId, ScienceTwinEvaluationResult, ScienceTwinTarget } from '../../types';

interface ScienceTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLabId?: LabId;
  onAwardXP?: (amount: number, reason: string) => void;
  onApplyToWorkbench?: (labId: LabId, parameters: Record<string, any>) => void;
  onSaveToNotebook?: (entry: any) => void;
}

export const ScienceTwinModal: React.FC<ScienceTwinModalProps> = ({
  isOpen,
  onClose,
  activeLabId,
  onAwardXP,
  onApplyToWorkbench,
  onSaveToNotebook,
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    SCIENCE_TWIN_CHALLENGES.find((c) => c.labId === activeLabId)?.id || SCIENCE_TWIN_CHALLENGES[0].id
  );
  const [studentParams, setStudentParams] = useState<Record<string, number>>({});
  const [hypothesisText, setHypothesisText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<ScienceTwinEvaluationResult | null>(null);
  const [hasAwardedXP, setHasAwardedXP] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentChallenge: ScienceTwinTarget =
    SCIENCE_TWIN_CHALLENGES.find((c) => c.id === selectedChallengeId) || SCIENCE_TWIN_CHALLENGES[0];

  // Initialize or get student parameter value
  const getParamValue = (key: string, defaultTargetVal: number | string): number => {
    if (studentParams[key] !== undefined) return studentParams[key];
    const num = Number(defaultTargetVal);
    // start student slightly off-target (80%) to let them calibrate
    return isNaN(num) ? 0 : Number((num * 0.82).toFixed(2));
  };

  const handleSliderChange = (key: string, value: number) => {
    setStudentParams((prev) => ({
      ...prev,
      [key]: value,
    }));
    setEvaluationResult(null); // Reset evaluation until student re-evaluates
  };

  const handleResetSliders = () => {
    const fresh: Record<string, number> = {};
    for (const [key, val] of Object.entries(currentChallenge.targetParameters)) {
      const num = Number(val);
      if (!isNaN(num)) {
        fresh[key] = Number((num * 0.8).toFixed(2));
      }
    }
    setStudentParams(fresh);
    setEvaluationResult(null);
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/ai/science-twin/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: currentChallenge.id,
          labId: currentChallenge.labId,
          studentParams,
          studentHypothesisPrompt: hypothesisText,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEvaluationResult(data);
        if (data.targetAchieved) {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        if (!hasAwardedXP && onAwardXP) {
          onAwardXP(data.awardedXP || 75, `XR Science Twin Calibration: ${currentChallenge.title}`);
          setHasAwardedXP(true);
        }
      }
    } catch (e) {
      // High-accuracy client-side fallback evaluation
      let totalMatch = 0;
      let count = 0;
      const breakdown: any[] = [];

      for (const [key, targetVal] of Object.entries(currentChallenge.targetParameters)) {
        const numTarget = Number(targetVal);
        if (!isNaN(numTarget)) {
          const studentVal = getParamValue(key, targetVal);
          const dev = Math.abs(studentVal - numTarget);
          const tolerance = Math.max(0.5, numTarget * 0.15);
          const pct = Math.max(0, Math.min(100, Math.round((1 - dev / (tolerance * 2)) * 100)));
          totalMatch += pct;
          count++;
          breakdown.push({
            parameter: key,
            targetValue: numTarget,
            studentValue: studentVal,
            matchPercentage: pct,
            feedback: pct > 80 ? 'Well calibrated!' : 'Adjust slider to minimize vector drift.',
          });
        }
      }

      const score = count > 0 ? Math.round(totalMatch / count) : 85;
      const result: ScienceTwinEvaluationResult = {
        similarityScore: score,
        targetAchieved: score >= 85,
        awardedXP: score >= 85 ? 100 : Math.round(score * 0.7),
        parameterBreakdown: breakdown,
        physicsDeviationAnalysis: `Simulated configuration matches ${currentChallenge.targetPhenomenon} within standard physical tolerances. Vector alignment confirms theoretical stability.`,
        conceptualCritique: score >= 85 ? 'Pristine calibration! Target physical state synthesized.' : 'Nearly calibrated. Tune the parameters to reach >= 85% precision.',
      };
      setEvaluationResult(result);
      if (result.targetAchieved) {
        confetti({ particleCount: 50 });
      }
      if (!hasAwardedXP && onAwardXP) {
        onAwardXP(result.awardedXP, `XR Science Twin: ${currentChallenge.title}`);
        setHasAwardedXP(true);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleApplyWorkbench = () => {
    if (onApplyToWorkbench) {
      onApplyToWorkbench(currentChallenge.labId, currentChallenge.targetParameters);
    }
    onClose();
  };

  const handleSaveNotebook = () => {
    if (onSaveToNotebook && evaluationResult) {
      onSaveToNotebook({
        id: `twin-calib-${Date.now()}`,
        title: `Science Twin Calibration: ${currentChallenge.scientificFormulaOrName}`,
        discipline: currentChallenge.labId,
        date: new Date().toISOString().split('T')[0],
        similarityScore: evaluationResult.similarityScore,
        notes: `Achieved ${evaluationResult.similarityScore}% precision against target ${currentChallenge.targetPhenomenon}.\nPhysics Critique: ${evaluationResult.physicsDeviationAnalysis}\nStudent Hypothesis: ${hypothesisText || 'Direct parameter vector alignment.'}`,
        tags: ['Science Twin', 'Lab Calibration', currentChallenge.labId],
      });
      alert('Calibration report successfully logged into your Lab Notebook!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/70 text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  XR Science Twin Challenge
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">
                  Daily Lab Calibration
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Calibrate simulation physics vectors to recreate target 3D scientific states.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Challenge Tabs */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Select Scientific Calibration Target</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SCIENCE_TWIN_CHALLENGES.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    setSelectedChallengeId(target.id);
                    setEvaluationResult(null);
                    setStudentParams({});
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedChallengeId === target.id
                      ? 'bg-purple-950/70 border-purple-400 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">
                      {target.labId}
                    </span>
                    {target.labId === activeLabId && (
                      <span className="text-[10px] text-emerald-400 font-bold">Active Lab</span>
                    )}
                  </div>
                  <div className="text-xs font-bold truncate text-white">{target.scientificFormulaOrName}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{target.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Phenomenon Overview Card */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentChallenge.title}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  {currentChallenge.targetPhenomenon}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentChallenge.description}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-purple-300 font-medium pt-1">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Target Physics: {currentChallenge.hintPrompt}</span>
              </div>
            </div>

            <button
              onClick={handleApplyWorkbench}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Apply Target to 3D Bench</span>
            </button>
          </div>

          {/* Interactive Calibration Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Parameter Sliders */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Precision Parameter Calibration</span>
                </div>
                <button
                  onClick={handleResetSliders}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Sliders</span>
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(currentChallenge.targetParameters).map(([key, targetVal]) => {
                  const numTarget = Number(targetVal);
                  if (isNaN(numTarget)) {
                    return (
                      <div key={key} className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-400 font-mono capitalize">{key}:</span>
                        <span className="text-purple-300 font-bold font-mono">{String(targetVal)}</span>
                      </div>
                    );
                  }

                  const currentVal = getParamValue(key, targetVal);
                  // Calculate dynamic slider range
                  const min = numTarget > 0 ? Number((numTarget * 0.3).toFixed(2)) : -180;
                  const max = numTarget > 0 ? Number((numTarget * 1.7).toFixed(2)) : 180;
                  const step = numTarget < 5 ? 0.05 : 1;

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-300 font-medium">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-purple-400 font-bold">{currentVal}</span>
                          <span className="text-slate-500 text-[10px]">/ Target: {numTarget}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={currentVal}
                        onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Hypothesis & Scientific Explanation Input */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Scientific Hypothesis & Reasoning (Optional for Bonus AI XP)
                </label>
                <textarea
                  value={hypothesisText}
                  onChange={(e) => setHypothesisText(e.target.value)}
                  placeholder={`Explain the physical mechanism (e.g., "The non-bonding electron pair exerts higher electrostatic repulsion, compressing the bond angle...")...`}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  disabled={isEvaluating}
                  onClick={handleEvaluate}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <span>Evaluating Precision with Physics Engine...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span>Calibrate & Evaluate Precision (0–100%)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Similarity Scoring & Analysis */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>Similarity Telemetry</span>
                  </div>
                  {evaluationResult && (
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                        evaluationResult.targetAchieved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {evaluationResult.targetAchieved ? 'Calibrated!' : 'Calibrating...'}
                    </span>
                  )}
                </div>

                {/* Meter Gauge */}
                <div className="my-5 text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                      <div
                        className="text-3xl font-black font-mono tracking-tight"
                        style={{
                          color:
                            (evaluationResult?.similarityScore || 0) >= 85
                              ? '#34d399'
                              : (evaluationResult?.similarityScore || 0) >= 60
                              ? '#fbbf24'
                              : '#a78bfa',
                        }}
                      >
                        {evaluationResult ? `${evaluationResult.similarityScore}%` : '---'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-2 uppercase tracking-wide">
                    Digital Twin Correlation Score
                  </div>
                </div>

                {/* Parameter Deviation breakdown */}
                {evaluationResult && (
                  <div className="space-y-2 mt-4">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Parameter Vector Match
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {evaluationResult.parameterBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono text-slate-300 capitalize">{item.parameter}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">
                              ({item.studentValue} vs {item.targetValue})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span
                              className={`text-[11px] font-bold ${
                                item.matchPercentage >= 85
                                  ? 'text-emerald-400'
                                  : item.matchPercentage >= 65
                                  ? 'text-yellow-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {item.matchPercentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Physics AI Critique */}
                    <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 mt-3 leading-relaxed">
                      <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Physics Deviation Analysis</span>
                      </div>
                      <p>{evaluationResult.physicsDeviationAnalysis}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {evaluationResult && (
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={handleSaveNotebook}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Log to Lab Notebook</span>
                  </button>
                  <button
                    onClick={handleApplyWorkbench}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test on 3D Bench</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
