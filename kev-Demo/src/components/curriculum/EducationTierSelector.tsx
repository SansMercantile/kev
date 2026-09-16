import React, { useState } from 'react';
import { EducationTier } from '../../types';
import { EDUCATION_TIERS } from '../../data/advancedLabSystemsData';
import { GraduationCap, ChevronDown, Check, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  currentTier: EducationTier;
  onSelectTier: (tier: EducationTier) => void;
  compact?: boolean;
}

const TIER_COLORS: Record<EducationTier, { border: string; bg: string; text: string; badgeBg: string }> = {
  middle_school: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
  },
  high_school: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-300',
  },
  ap_honors: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300',
  },
  university: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300',
  },
};

export const EducationTierSelector: React.FC<Props> = ({
  currentTier,
  onSelectTier,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const activeInfo = EDUCATION_TIERS[currentTier] || EDUCATION_TIERS.high_school;
  const colorStyle = TIER_COLORS[currentTier] || TIER_COLORS.high_school;

  const tiersList: EducationTier[] = ['middle_school', 'high_school', 'ap_honors', 'university'];

  return (
    <div className="relative inline-block text-left z-30">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${colorStyle.bg} ${colorStyle.border}`}
        title={`Education Scaffolding Tier: ${activeInfo.label}`}
      >
        <GraduationCap className={`w-3.5 h-3.5 ${colorStyle.text}`} />
        <div className="text-left flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white tracking-wide">
            {activeInfo.shortBadge}
          </span>
          {!compact && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${colorStyle.badgeBg}`}>
              AI Scaffolding
            </span>
          )}
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 border-b border-slate-800 mb-1.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Conceptual Scaffolding Level
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Adapts mathematical formality, tutor responses, and study kits.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {tiersList.map((tierId) => {
                const info = EDUCATION_TIERS[tierId];
                const isSel = currentTier === tierId;
                const tierColor = TIER_COLORS[tierId];

                return (
                  <button
                    key={tierId}
                    onClick={() => {
                      onSelectTier(tierId);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSel
                        ? 'bg-slate-800 border border-slate-600 shadow-sm'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isSel ? 'bg-cyan-500 text-slate-950' : 'border border-slate-600'
                      }`}
                    >
                      {isSel && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-200'}`}>
                          {info.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${tierColor.badgeBg}`}>
                          {info.lexileLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                        {info.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
