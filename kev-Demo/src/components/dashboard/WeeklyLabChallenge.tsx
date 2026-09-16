import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  FlaskConical,
  Orbit,
  Dna,
  Sparkles,
  Target,
  Trophy,
  Zap,
  ArrowRight,
  Shield,
  Sliders,
  Info,
  Check
} from 'lucide-react';
import { LabId, WeeklyLabChallengeItem, CosmeticBadgeVariant } from '../../types';
import { WEEKLY_LAB_CHALLENGES } from '../../data/advancedLabSystemsData';
import { useToast } from '../toast/ToastContext';

interface Props {
  onNavigateToLab: (labId: LabId) => void;
  onAwardXP: (xp: number, reason: string) => void;
  onAwardCosmeticBadge?: (badge: CosmeticBadgeVariant) => void;
  userBadges?: string[];
}

export const WeeklyLabChallenge: React.FC<Props> = ({
  onNavigateToLab,
  onAwardXP,
  onAwardCosmeticBadge,
  userBadges = [],
}) => {
  const { showToast, showXPToast, showBadgeToast } = useToast();
  const [challenges, setChallenges] = useState<WeeklyLabChallengeItem[]>(() => {
    const saved = localStorage.getItem('kev_weekly_challenges');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* fallback */
      }
    }
    return WEEKLY_LAB_CHALLENGES;
  });

  const [selectedLabFilter, setSelectedLabFilter] = useState<'all' | LabId>('all');
  const [activeCosmeticVariant, setActiveCosmeticVariant] = useState<string>(() => {
    return localStorage.getItem('kev_active_cosmetic_flair') || 'badge-chromatic-optics';
  });

  const filteredChallenges = challenges.filter(
    (c) => selectedLabFilter === 'all' || c.labId === selectedLabFilter
  );

  const completedCount = challenges.filter((c) => c.completed).length;

  const handleVerifyAndClaim = (challenge: WeeklyLabChallengeItem) => {
    if (challenge.completed) {
      showToast({
        type: 'info',
        title: 'Already Claimed!',
        message: `You have already unlocked the ${challenge.cosmeticBadge.name} variant.`,
      });
      return;
    }

    const updated = challenges.map((c) =>
      c.id === challenge.id ? { ...c, completed: true, currentProgressPercent: 100 } : c
    );
    setChallenges(updated);
    localStorage.setItem('kev_weekly_challenges', JSON.stringify(updated));

    // Award XP and Cosmetic Badge
    onAwardXP(challenge.xpReward, `Weekly Lab Challenge Completed: ${challenge.title}`);
    showXPToast(challenge.xpReward, `Challenge: ${challenge.title}`);
    showBadgeToast(
      challenge.cosmeticBadge.name,
      `Cosmetic Variant Unlocked: ${challenge.cosmeticBadge.perkDescription}`
    );

    if (onAwardCosmeticBadge) {
      onAwardCosmeticBadge(challenge.cosmeticBadge);
    }

    // Auto-equip this cosmetic flair
    setActiveCosmeticVariant(challenge.cosmeticBadge.id);
    localStorage.setItem('kev_active_cosmetic_flair', challenge.cosmeticBadge.id);
  };

  const getLabIcon = (labId: LabId) => {
    switch (labId) {
      case 'chemistry':
        return <FlaskConical className="w-4 h-4 text-amber-400" />;
      case 'astrophysics':
        return <Orbit className="w-4 h-4 text-purple-400" />;
      case 'optics':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'biology':
        return <Dna className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div id="weekly-lab-challenges" className="space-y-6 animate-fade-in">
      {/* Top Challenge Sprint Banner */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Sprint Week 42 • Active Calibration Cycle
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono text-[10px] flex items-center gap-1 border border-slate-800">
                <Clock className="w-3 h-3 text-amber-400" />
                Resets in 4d 14h
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Weekly Lab Calibration Challenges
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Achieve precise physical calibration states inside the 3D Virtual Science Labs. Complete these rigorous peer challenges to earn bonus Academic XP and unlock exclusive <strong>Holographic Cosmetic Badge Variants</strong>!
            </p>
          </div>

          {/* Progress Tracker Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 min-w-[220px] text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Weekly Challenges Completed</span>
            <div className="flex items-baseline justify-center gap-1.5 mt-1">
              <span className="text-2xl font-black text-indigo-400 font-mono">{completedCount}</span>
              <span className="text-sm text-slate-500 font-mono">/ {challenges.length}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / challenges.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">
              {completedCount === challenges.length
                ? 'All sprint rewards unlocked!'
                : `${challenges.length - completedCount} badges remaining`}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-mono mr-1">Filter Domain:</span>
          {(['all', 'chemistry', 'astrophysics', 'optics', 'biology'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedLabFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLabFilter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab === 'all'
                ? 'All Wings'
                : tab === 'chemistry'
                ? '🧪 Molecular Chemistry'
                : tab === 'astrophysics'
                ? '🪐 Astrophysics'
                : tab === 'optics'
                ? '🔬 Quantum Optics'
                : '🧬 Cellular Bio'}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredChallenges.map((challenge) => {
          const isEquipped = activeCosmeticVariant === challenge.cosmeticBadge.id;

          return (
            <div
              key={challenge.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all duration-300 flex flex-col justify-between ${
                challenge.completed
                  ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {getLabIcon(challenge.labId)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                          {challenge.subject}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            challenge.difficulty === 'Grandmaster'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : challenge.difficulty === 'Mastery'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {challenge.difficulty}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base mt-1">{challenge.title}</h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      +{challenge.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Challenge Objective */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Calibration Target</span>
                  <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                    {challenge.objective}
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-cyan-300/90 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Criteria: {challenge.targetParameterCriteria}</span>
                  </div>
                </div>

                {/* Scientific Context */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{challenge.scientificContext}</span>
                </div>

                {/* Cosmetic Reward Preview Box */}
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-slate-950 via-slate-950 to-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-amber-400 uppercase font-mono font-bold flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      Exclusive Cosmetic Badge Variant
                    </span>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold border"
                      style={{
                        borderColor: challenge.cosmeticBadge.borderColor,
                        color: challenge.cosmeticBadge.textColor,
                        backgroundColor: `${challenge.cosmeticBadge.auraColor}20`,
                      }}
                    >
                      {challenge.cosmeticBadge.rarity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${challenge.cosmeticBadge.bgGradient} flex items-center justify-center border shadow-lg shrink-0 transition-transform group-hover:scale-105`}
                      style={{
                        borderColor: challenge.cosmeticBadge.borderColor,
                        boxShadow: `0 0 15px ${challenge.cosmeticBadge.auraColor}40`,
                      }}
                    >
                      <Trophy className="w-5 h-5" style={{ color: challenge.cosmeticBadge.textColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">
                          {challenge.cosmeticBadge.name}
                        </h4>
                        {challenge.completed && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        {challenge.cosmeticBadge.perkDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Calibration Precision Match</span>
                    <span className={challenge.completed ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                      {challenge.currentProgressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        challenge.completed
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${challenge.currentProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => onNavigateToLab(challenge.labId)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {challenge.completed ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveCosmeticVariant(challenge.cosmeticBadge.id);
                        localStorage.setItem('kev_active_cosmetic_flair', challenge.cosmeticBadge.id);
                        showToast({
                          type: 'success',
                          title: 'Cosmetic Flair Equipped!',
                          message: `Active avatar flair updated to ${challenge.cosmeticBadge.name}.`,
                        });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                        isEquipped
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span>Equipped Flair</span>
                        </>
                      ) : (
                        <span>Equip Badge Flair</span>
                      )}
                    </button>
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleVerifyAndClaim(challenge)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Verify & Claim Reward</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cosmetic Wardrobe & Aura Customizer Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Active Academic Cosmetic Flair</h4>
            <p className="text-xs text-slate-400">
              Cosmetic variants add glowing particle borders to your notebook entries and live chat messages.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {challenges.map((c) => {
            const isUnlocked = c.completed;
            const isSelected = activeCosmeticVariant === c.cosmeticBadge.id;

            return (
              <button
                key={c.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    setActiveCosmeticVariant(c.cosmeticBadge.id);
                    localStorage.setItem('kev_active_cosmetic_flair', c.cosmeticBadge.id);
                    showToast({
                      type: 'success',
                      title: 'Flair Activated',
                      message: `${c.cosmeticBadge.name} is now visible on your academic profile.`,
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
                  !isUnlocked
                    ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                    : isSelected
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500 shadow-md shadow-amber-500/20 cursor-pointer'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700 cursor-pointer'
                }`}
                title={isUnlocked ? c.cosmeticBadge.perkDescription : 'Locked: Complete challenge to unlock'}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.cosmeticBadge.auraColor }}
                />
                <span>{c.cosmeticBadge.name}</span>
                {isSelected && <Check className="w-3 h-3 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
