import React, { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Sparkles, Target, X } from 'lucide-react';
import { STEP_BY_STEP_LAB_GUIDES } from '../../data/advancedLabSystemsData';
import { LabId } from '../../types';

interface StepByStepLabGuideProps {
  labId: LabId;
  isOpen: boolean;
  onClose: () => void;
  onAwardXP?: (amount: number, reason: string) => void;
}

export const StepByStepLabGuide: React.FC<StepByStepLabGuideProps> = ({
  labId,
  isOpen,
  onClose,
  onAwardXP,
}) => {
  const steps = STEP_BY_STEP_LAB_GUIDES[labId] || STEP_BY_STEP_LAB_GUIDES.chemistry;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isLast = currentStepIndex === steps.length - 1;
  const isStepDone = completedSteps.includes(currentStep.stepNumber);

  const handleCompleteCurrent = () => {
    if (!isStepDone) {
      setCompletedSteps((prev) => [...prev, currentStep.stepNumber]);
      if (onAwardXP) {
        onAwardXP(25, `Completed Lab Step ${currentStep.stepNumber}: ${currentStep.title}`);
      }
    }
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1);
      setShowHint(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 text-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-950/80 to-slate-900 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>Step-by-Step Lab Guide</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                {currentStepIndex + 1}/{steps.length}
              </span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
              {currentStep.scientificMethodPhase} Phase
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close Lab Guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-950 h-1.5 flex">
        {steps.map((s, idx) => (
          <div
            key={s.id}
            className={`flex-1 transition-all border-r border-slate-900 last:border-0 ${
              completedSteps.includes(s.stepNumber)
                ? 'bg-emerald-500'
                : idx === currentStepIndex
                ? 'bg-cyan-400'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <span>{currentStep.stepNumber}.</span>
            <span>{currentStep.title}</span>
          </h4>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {currentStep.instruction}
          </p>
        </div>

        {/* Completion Criteria Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-start gap-2">
          <div className="mt-0.5 text-cyan-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px] leading-tight">
            <span className="text-slate-400 font-medium">Goal: </span>
            <span className="text-slate-200">{currentStep.completionCriterion}</span>
          </div>
        </div>

        {/* Scientific Hint toggle */}
        {showHint ? (
          <div className="bg-cyan-950/50 border border-cyan-500/30 rounded-xl p-2.5 text-[11px] text-cyan-200 flex items-start gap-2 animate-in fade-in duration-150">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-100">Scientific Principle: </span>
              {currentStep.hint}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need scientific reasoning hint?</span>
          </button>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            disabled={currentStepIndex === 0}
            onClick={() => {
              setCurrentStepIndex((prev) => Math.max(0, prev - 1));
              setShowHint(false);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={isLast}
            onClick={() => {
              setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
              setShowHint(false);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleCompleteCurrent}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer ${
            isStepDone
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isStepDone ? 'Step Completed (+25 XP)' : 'Mark Step Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
