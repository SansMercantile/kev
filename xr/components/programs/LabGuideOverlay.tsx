/**
 * Step-by-Step Lab Guide overlay.
 *
 * Walks a student through a lab bench one control at a time. Each step names
 * a real control via a CSS selector (the labs carry `data-guide="..."`
 * attributes); the overlay outlines and pulses that element in place, scrolls
 * it into view and explains what to do and why. It never changes lab state -
 * the student still performs every action themselves. Steps whose control is
 * not currently rendered are skipped politely.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Footprints, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { labGuideFor } from '../../data/labGuides';

interface Props {
  labId: string;
  onClose: () => void;
}

const HIGHLIGHT_CLASS = 'kev-guide-highlight';

export default function LabGuideOverlay({ labId, onClose }: Props) {
  const guide = labGuideFor(labId);
  const [index, setIndex] = useState(0);

  const clearHighlights = useCallback(() => {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
  }, []);

  const focusStep = useCallback((i: number): number => {
    clearHighlights();
    if (!guide) return i;
    // Skip steps whose control isn't on screen (bounded walk, no infinite loop).
    for (let attempt = 0; attempt < guide.steps.length; attempt++) {
      const stepIndex = Math.min(i + attempt, guide.steps.length - 1);
      const el = document.querySelector(guide.steps[stepIndex].selector);
      if (el) {
        el.classList.add(HIGHLIGHT_CLASS);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return stepIndex;
      }
    }
    return i;
  }, [guide, clearHighlights]);

  useEffect(() => {
    if (!guide) return;
    setIndex((prev) => focusStep(prev));
    return clearHighlights;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide, labId]);

  const go = useCallback((delta: number) => {
    if (!guide) return;
    setIndex((prev) => {
      const next = Math.max(0, Math.min(guide.steps.length - 1, prev + delta));
      return focusStep(next);
    });
  }, [guide, focusStep]);

  if (!guide) {
    return (
      <div className="absolute top-16 right-4 z-40 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-xs text-slate-400 shadow-xl">
        No step-by-step guide for this bench yet.
        <button onClick={onClose} className="ml-2 text-cyan-400 hover:text-cyan-300">Close</button>
      </div>
    );
  }

  const step = guide.steps[index];

  return (
    <>
      {/* Scoped highlight styles: the overlay owns its look, labs stay untouched. */}
      <style>{`
        .${HIGHLIGHT_CLASS} {
          outline: 3px solid #22d3ee !important;
          outline-offset: 4px;
          border-radius: 8px;
          animation: kev-guide-pulse 1.4s ease-in-out infinite;
        }
        @keyframes kev-guide-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.45); }
          50% { box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
        }
      `}</style>

      <div className="absolute top-16 right-4 z-40 w-72 rounded-xl border border-cyan-900/60 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
          <Footprints className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Step-by-step lab guide</span>
          <button onClick={onClose} className="ml-auto p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Close guide">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] text-slate-500">
            {guide.title} - step {index + 1} of {guide.steps.length}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((index + 1) / guide.steps.length) * 100}%` }} />
          </div>
          <h4 className="mt-2 text-xs font-semibold text-cyan-300">{step.label}</h4>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{step.hint}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-3 h-3" /> Back
            </button>
            {index < guide.steps.length - 1 ? (
              <button
                onClick={() => go(1)}
                className="ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="ml-auto text-[11px] px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
