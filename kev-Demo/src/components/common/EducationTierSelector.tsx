import React from 'react';
import { Award, BookOpen, ChevronDown, GraduationCap } from 'lucide-react';
import { EDUCATION_TIERS } from '../../data/advancedLabSystemsData';
import { EducationTier } from '../../types';

interface EducationTierSelectorProps {
  currentTier: EducationTier;
  onSelectTier: (tier: EducationTier) => void;
  compact?: boolean;
}

export const EducationTierSelector: React.FC<EducationTierSelectorProps> = ({
  currentTier,
  onSelectTier,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeInfo = EDUCATION_TIERS[currentTier] || EDUCATION_TIERS.high_school;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          title={`Active Rigor: ${activeInfo.label} (${activeInfo.shortBadge})`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[11px]">{activeInfo.shortBadge}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
              <span>Adaptive Science Rigor Tier</span>
              <span className="text-[10px] text-indigo-400 font-mono">Multi-Tier AI</span>
            </div>
            <div className="space-y-1 mt-1.5">
              {(Object.keys(EDUCATION_TIERS) as EducationTier[]).map((tierKey) => {
                const info = EDUCATION_TIERS[tierKey];
                const isSelected = currentTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    onClick={() => {
                      onSelectTier(tierKey);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/80 border border-indigo-400/50 text-white shadow-sm'
                        : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{info.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                        {info.shortBadge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {info.lexileLevel} • {info.mathRigor}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Adaptive Science Rigor Tier
          </span>
        </div>
        <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
          Lexile: {activeInfo.lexileLevel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {(Object.keys(EDUCATION_TIERS) as EducationTier[]).map((tierKey) => {
          const info = EDUCATION_TIERS[tierKey];
          const isSelected = currentTier === tierKey;
          return (
            <button
              key={tierKey}
              onClick={() => onSelectTier(tierKey)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/90 border-indigo-400 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                  {info.shortBadge}
                </span>
                {isSelected && <Award className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <div className="text-xs font-bold text-white">{info.label}</div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {info.mathRigor}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
