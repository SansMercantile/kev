import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Zap,
  Calendar,
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { DailyStreakData, StreakDayStatus } from '../../types';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';
import {
  MULTIPLIER_TIERS,
  getDailyStreakData,
  saveDailyStreakData,
  recordDailyActivity,
  getMultiplierTier,
  getTodayDateString,
} from '../../utils/streakManager';

interface Props {
  currentXP: number;
  onClaimStreakBonus: (xp: number, label: string) => void;
  onQuickCompleteToday?: () => void;
}

export const DailyStudyStreak: React.FC<Props> = ({
  currentXP,
  onClaimStreakBonus,
  onQuickCompleteToday,
}) => {
  const { showToast } = useToast();

  // Load streak state from local storage or sensible default
  const [streakData, setStreakData] = useState<DailyStreakData>(() => {
    return getDailyStreakData();
  });

  const [claimedMilestones, setClaimedMilestones] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('kev_claimed_streak_milestones');
      return saved ? JSON.parse(saved) : [3];
    } catch {
      return [3];
    }
  });

  // Calculate tier info
  const currentTier = MULTIPLIER_TIERS.slice().reverse().find(t => streakData.currentStreakDays >= t.days) || MULTIPLIER_TIERS[0];
  const nextTier = MULTIPLIER_TIERS.find(t => t.days > streakData.currentStreakDays) || null;

  const daysToNextTier = nextTier ? nextTier.days - streakData.currentStreakDays : 0;
  const progressToNextTier = nextTier
    ? Math.min(100, Math.round(((streakData.currentStreakDays - currentTier.days) / (nextTier.days - currentTier.days)) * 100))
    : 100;

  const handleClaimMilestone = (milestoneDays: number, bonusXP: number) => {
    if (claimedMilestones.includes(milestoneDays)) return;
    const updated = [...claimedMilestones, milestoneDays];
    setClaimedMilestones(updated);
    localStorage.setItem('kev_claimed_streak_milestones', JSON.stringify(updated));

    soundManager.playXPEarned();
    onClaimStreakBonus(bonusXP, `${milestoneDays}-Day Streak Milestone Bonus`);
    showToast({
      type: 'badge',
      title: `${milestoneDays}-Day Streak Reward Unlocked!`,
      message: `Earned +${bonusXP} XP with your active ${streakData.currentMultiplier}x study multiplier.`,
    });
  };

  const handleSimulateAddDay = () => {
    const newStreak = streakData.currentStreakDays + 1;
    let newTier = MULTIPLIER_TIERS[0];
    for (const t of MULTIPLIER_TIERS) {
      if (newStreak >= t.days) newTier = t;
    }
    const next = MULTIPLIER_TIERS.find(t => t.days > newStreak) || null;

    const updated: DailyStreakData = {
      ...streakData,
      currentStreakDays: newStreak,
      longestStreakDays: Math.max(streakData.longestStreakDays, newStreak),
      currentMultiplier: newTier.multiplier,
      multiplierTierName: newTier.name,
      nextTierStreakRequired: next ? next.days : 30,
      nextTierMultiplier: next ? next.multiplier : 2.0,
      weekHistory: streakData.weekHistory.map((d, i) =>
        i === streakData.weekHistory.length - 1 ? { ...d, completed: true, xpEarned: (d.xpEarned || 0) + 50 } : d
      ),
    };

    setStreakData(updated);
    localStorage.setItem('kev_daily_streak', JSON.stringify(updated));
    soundManager.playBadgeUnlock();
    onClaimStreakBonus(Math.round(50 * updated.currentMultiplier), 'Daily Lab Study Streak Kept Alive');

    showToast({
      type: 'success',
      title: 'Daily Streak Extended!',
      message: `Now at ${newStreak} consecutive days! Multiplier: ${newTier.multiplier}x.`,
    });
  };

  return (
    <div id="daily-study-streak-card" className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl space-y-6">
      {/* Top Banner with Streak Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Flame Icon with Animated Pulse */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 15px rgba(249, 115, 22, 0.4)',
                  '0 0 30px rgba(239, 68, 68, 0.6)',
                  '0 0 15px rgba(249, 115, 22, 0.4)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-xl border border-orange-400/40"
            >
              <Flame className="w-9 h-9 fill-amber-100 text-rose-600 animate-pulse" />
            </motion.div>
            <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-orange-500/50 text-orange-300 font-mono text-[10px] font-black shadow-md">
              {streakData.currentStreakDays}D
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white tracking-tight">
                {streakData.currentStreakDays} Day Study Streak
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono font-bold border border-orange-500/30">
                {currentTier.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete a 3D Lab or scientific quiz daily to maintain and expand your active XP multiplier.
            </p>
          </div>
        </div>

        {/* Multiplier Badge & Quick Action */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-orange-500/40 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Active Multiplier</span>
            <div className="flex items-center justify-end gap-1">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-lg font-black text-amber-300 font-mono">
                {streakData.currentMultiplier}x XP
              </span>
            </div>
          </div>

          <button
            onClick={handleSimulateAddDay}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
            title="Complete today's daily streak challenge and claim multiplier bonus"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Extend Streak (+XP)</span>
          </button>
        </div>
      </div>

      {/* Progress to Next Multiplier Tier */}
      {nextTier ? (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              <span>
                Road to <strong className={nextTier.text}>{nextTier.name} ({nextTier.multiplier}x XP)</strong>
              </span>
            </div>
            <span className="font-mono text-slate-400">
              {daysToNextTier} {daysToNextTier === 1 ? 'day' : 'days'} remaining ({streakData.currentStreakDays}/{nextTier.days}d)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full bg-gradient-to-r ${nextTier.color} rounded-full transition-all duration-700`}
              style={{ width: `${progressToNextTier}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <Award className="w-4 h-4 text-pink-400" />
            <span>Maximum Multiplier Reached: <strong>Supernova Peak (2.0x Double XP Active!)</strong></span>
          </div>
          <span className="font-mono text-pink-300 font-bold">2.0x Forever</span>
        </div>
      )}

      {/* 7-Day Calendar Streak Visualizer */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2.5">
          <span className="uppercase tracking-wider flex items-center gap-1.5 text-slate-300 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Last 7 Days Academic Record
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            {streakData.freezeTokensRemaining} Streak Freezes in Reserve
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {streakData.weekHistory.map((day, idx) => (
            <div
              key={idx}
              className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                day.completed
                  ? 'bg-gradient-to-b from-orange-500/15 via-slate-900 to-slate-950 border-orange-500/40 text-orange-300 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              } ${day.isToday ? 'ring-2 ring-orange-400/50' : ''}`}
            >
              <span className="text-[10px] font-mono font-medium text-slate-400 mb-1">{day.dayLabel}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center my-1">
                {day.completed ? (
                  <Flame className="w-5 h-5 text-orange-400 fill-orange-400/80 animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <span className="text-[11px] font-mono font-bold text-white">
                Sep {day.dayOfMonth}
              </span>
              {day.completed ? (
                <span className="text-[9px] font-mono text-emerald-400 mt-1">+{day.xpEarned} XP</span>
              ) : (
                <span className="text-[9px] font-mono text-slate-600 mt-1">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Multiplier Tiers & Milestone Rewards Showcase */}
      <div className="pt-2 border-t border-slate-800/80">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Multiplier Tiers & Milestone XP Rewards
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {MULTIPLIER_TIERS.map((tier) => {
            const isUnlocked = streakData.currentStreakDays >= tier.days;
            const isCurrent = currentTier.name === tier.name;
            const bonusXP = tier.days * 40;
            const isClaimed = claimedMilestones.includes(tier.days);

            return (
              <div
                key={tier.name}
                className={`p-3 rounded-xl border relative flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-slate-900 border-orange-500/60 shadow-md shadow-orange-500/10'
                    : isUnlocked
                    ? 'bg-slate-900/60 border-slate-700/80'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-300">
                      {tier.days}d+
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-white text-xs">{tier.name}</h5>
                  <p className={`text-sm font-black font-mono mt-0.5 ${tier.text}`}>
                    {tier.multiplier}x XP
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400">+{bonusXP} XP</span>
                  {isClaimed ? (
                    <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-mono font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Claimed
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleClaimMilestone(tier.days, bonusXP)}
                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] font-mono cursor-pointer transition-colors shadow-sm"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
