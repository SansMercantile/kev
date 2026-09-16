import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Target,
  Zap,
  Award,
  Trophy,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
  Flame,
  ChevronRight,
  Sliders,
  RotateCcw,
  Star,
  Compass,
  ArrowRight,
  AlertCircle,
  FlaskConical,
  Orbit,
  Dna,
  ShieldCheck,
  Share2,
  X,
  Volume2
} from 'lucide-react';
import { LabId, StudyGoalMilestone, WeeklyStudyGoalData } from '../../types';
import { soundManager } from '../../utils/soundEffects';
import { useToast } from '../toast/ToastContext';

interface Props {
  currentTotalXP: number;
  onAwardXP: (xp: number) => void;
  onNavigateToLab?: (labId: LabId) => void;
  onNavigateToCurriculum?: () => void;
}

const PRESET_TARGETS = [
  {
    level: 'Cadet',
    targetXP: 250,
    dailyPace: '~35 XP/day',
    desc: 'Casual exploration and daily warmup simulations',
    badge: 'Spark Scholar',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300',
  },
  {
    level: 'Researcher',
    targetXP: 500,
    dailyPace: '~70 XP/day',
    desc: 'Recommended standard: 2-3 labs plus curriculum quizzes',
    badge: 'Lab Investigator',
    popular: true,
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300',
  },
  {
    level: 'Honor Scholar',
    targetXP: 800,
    dailyPace: '~115 XP/day',
    desc: 'Rigorous academic pace covering advanced lab hypotheses',
    badge: 'Senior Analyst',
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-300',
  },
  {
    level: 'Quantum Pioneer',
    targetXP: 1200,
    dailyPace: '~170 XP/day',
    desc: 'Master tier: tournament competition and full mastery',
    badge: 'Quantum Elite',
    color: 'from-amber-500/20 to-rose-500/10 border-amber-500/30 text-amber-300',
  },
];

const MILESTONES_CONFIG: StudyGoalMilestone[] = [
  {
    id: 'milestone-25',
    percent: 25,
    title: 'Ignition Burn',
    subtitle: 'Weekly momentum initiated',
    bonusXP: 25,
    badgeName: 'First Step Catalyst',
    iconName: 'Sparkles',
  },
  {
    id: 'milestone-50',
    percent: 50,
    title: 'Equilibrium Point',
    subtitle: 'Halfway to target summit',
    bonusXP: 50,
    badgeName: 'Steady State Scholar',
    iconName: 'Flame',
  },
  {
    id: 'milestone-75',
    percent: 75,
    title: 'Orbital Escape',
    subtitle: 'Approaching complete mastery',
    bonusXP: 75,
    badgeName: 'Orbit Breaker',
    iconName: 'Orbit',
  },
  {
    id: 'milestone-100',
    percent: 100,
    title: 'Weekly Mastery Apex',
    subtitle: '100% Target Achieved!',
    bonusXP: 150,
    badgeName: 'Weekly Goal Crusher',
    iconName: 'Trophy',
  },
  {
    id: 'milestone-125',
    percent: 125,
    title: 'Supernova Hyper-Drive',
    subtitle: 'Overachiever stretch frontier',
    bonusXP: 100,
    badgeName: 'Cosmic Overachiever',
    iconName: 'Zap',
  },
];

const DAYS_OF_WEEK = [
  { day: 'Mon', xp: 75, status: 'completed' },
  { day: 'Tue', xp: 110, status: 'completed' },
  { day: 'Wed', xp: 95, status: 'completed' },
  { day: 'Thu', xp: 60, status: 'completed' },
  { day: 'Fri', xp: 80, status: 'today' },
  { day: 'Sat', xp: 0, status: 'upcoming' },
  { day: 'Sun', xp: 0, status: 'upcoming' },
];

export const StudyGoalsModule: React.FC<Props> = ({
  currentTotalXP,
  onAwardXP,
  onNavigateToLab,
  onNavigateToCurriculum,
}) => {
  const { showToast } = useToast();

  // Load or initialize goal data
  const [goalData, setGoalData] = useState<WeeklyStudyGoalData>(() => {
    const saved = localStorage.getItem('kev_study_goals_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }

    return {
      targetXP: 500,
      currentWeeklyXP: 420,
      focusDiscipline: 'All Disciplines',
      weekLabel: 'Week 37 (Sept 7 – Sept 13, 2026)',
      daysRemaining: 2,
      claimedMilestoneIds: ['milestone-25', 'milestone-50', 'milestone-75'],
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      pastWeeksHistory: [
        { weekLabel: 'Week 36 (Aug 31 – Sept 6)', targetXP: 500, achievedXP: 535, completed: true, percentage: 107 },
        { weekLabel: 'Week 35 (Aug 24 – Aug 30)', targetXP: 400, achievedXP: 420, completed: true, percentage: 105 },
        { weekLabel: 'Week 34 (Aug 17 – Aug 23)', targetXP: 300, achievedXP: 310, completed: true, percentage: 103 },
      ],
    };
  });

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTargetXP, setTempTargetXP] = useState<number>(goalData.targetXP);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(goalData.focusDiscipline);
  const [activeCelebration, setActiveCelebration] = useState<{
    milestone: StudyGoalMilestone;
    xpAwarded: number;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('kev_study_goals_data', JSON.stringify(goalData));
  }, [goalData]);

  // Derived progress calculations
  const progressPercent = Math.round((goalData.currentWeeklyXP / goalData.targetXP) * 100);
  const clampedProgress = Math.min(125, Math.max(0, progressPercent));
  const xpRemainingTo100 = Math.max(0, goalData.targetXP - goalData.currentWeeklyXP);
  const dailyPacingExpectedPercent = Math.min(100, Math.round(((7 - goalData.daysRemaining) / 7) * 100));

  // Determine status message
  let statusBanner = {
    text: 'On Track to Finish Strong!',
    color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
    icon: TrendingUp,
  };
  if (progressPercent >= 125) {
    statusBanner = {
      text: 'Supernova Status! 125%+ Overachiever Milestone Conquered!',
      color: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
      icon: Trophy,
    };
  } else if (progressPercent >= 100) {
    statusBanner = {
      text: 'Goal Conquered! 100% Weekly Mastery Achieved!',
      color: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60',
      icon: CheckCircle2,
    };
  } else if (progressPercent >= dailyPacingExpectedPercent) {
    statusBanner = {
      text: `Ahead of Schedule! ${progressPercent}% vs ${dailyPacingExpectedPercent}% expected pace.`,
      color: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/60',
      icon: Zap,
    };
  } else {
    statusBanner = {
      text: `${xpRemainingTo100} XP needed across ${goalData.daysRemaining} days remaining. You can do this!`,
      color: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
      icon: AlertCircle,
    };
  }

  // Handle setting a new target
  const handleSaveNewTarget = () => {
    if (tempTargetXP < 100) return;
    setGoalData((prev) => ({
      ...prev,
      targetXP: tempTargetXP,
      focusDiscipline: selectedDiscipline,
    }));
    setIsEditingTarget(false);
    soundManager.playXPEarned();
    showToast({
      type: 'success',
      title: 'Weekly Study Target Updated!',
      message: `Your weekly target has been calibrated to ${tempTargetXP} XP in ${selectedDiscipline}.`,
    });
  };

  // Trigger celebration effects
  const fireCelebrationEffects = (milestone: StudyGoalMilestone) => {
    // Sound fanfare
    soundManager.playBadgeUnlock();

    // Canvas Confetti
    try {
      confetti({
        particleCount: milestone.percent >= 100 ? 120 : 60,
        spread: 80,
        origin: { y: 0.35, x: 0.5 },
        colors: ['#06b6d4', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'],
      });
    } catch (e) {
      // Safe fallback
    }

    // Set celebration modal
    setActiveCelebration({
      milestone,
      xpAwarded: milestone.bonusXP,
    });
  };

  // Claim a milestone reward
  const handleClaimMilestone = (milestone: StudyGoalMilestone) => {
    if (goalData.claimedMilestoneIds.includes(milestone.id)) return;

    // Grant bonus XP
    onAwardXP(milestone.bonusXP);

    // Update goal data with claimed milestone
    setGoalData((prev) => ({
      ...prev,
      claimedMilestoneIds: [...prev.claimedMilestoneIds, milestone.id],
    }));

    // Trigger visual celebratory effects
    fireCelebrationEffects(milestone);

    // Toast notification
    showToast({
      type: 'badge',
      title: `🎉 Milestone Hit: ${milestone.title}!`,
      message: `You unlocked the ${milestone.percent}% milestone! Awarded +${milestone.bonusXP} Academic Bonus XP.`,
    });
  };

  // Quick Study Sprint Simulation for demonstration
  const handleSimulateStudySprint = (earnedAmount: number, sourceLabel: string) => {
    const newWeeklyXP = goalData.currentWeeklyXP + earnedAmount;
    setGoalData((prev) => ({
      ...prev,
      currentWeeklyXP: newWeeklyXP,
    }));

    onAwardXP(earnedAmount);
    soundManager.playXPEarned();

    showToast({
      type: 'xp',
      title: `Study Sprint Logged: +${earnedAmount} XP`,
      message: `${sourceLabel} completed. Progress towards weekly goal updated!`,
      xp: earnedAmount,
    });

    // Check if any milestone was newly unlocked
    const newPercent = Math.round((newWeeklyXP / goalData.targetXP) * 100);
    const newlyUnlockedMilestone = MILESTONES_CONFIG.find(
      (m) => newPercent >= m.percent && !goalData.claimedMilestoneIds.includes(m.id)
    );

    if (newlyUnlockedMilestone) {
      handleClaimMilestone(newlyUnlockedMilestone);
    }
  };

  return (
    <div id="study-goals-module" className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Card: Hero Weekly Goal Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 shadow-2xl">
        {/* Glow backdrop decorative accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Status */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">
                <Target className="w-3.5 h-3.5" />
                Active Weekly Sprint
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {goalData.weekLabel}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {goalData.daysRemaining} days left
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Weekly Academic Study Goal
              <span className="text-sm font-normal text-slate-400 font-mono">
                ({goalData.focusDiscipline})
              </span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Set dedicated weekly XP thresholds across all 4 laboratories and curriculum quizzes.
              Hit key velocity milestones to unlock celebratory rewards and pride titles.
            </p>

            {/* Pacing Banner */}
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium ${statusBanner.color}`}>
              <statusBanner.icon className="w-4 h-4 shrink-0" />
              <span>{statusBanner.text}</span>
            </div>
          </div>

          {/* Right Metric Highlights & Calibration Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Zap className="w-5 h-5 fill-cyan-400" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Earned / Target</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white font-mono">{goalData.currentWeeklyXP}</span>
                  <span className="text-xs text-slate-500 font-mono">/ {goalData.targetXP} XP</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Completion</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black font-mono ${progressPercent >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {progressPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {progressPercent >= 100 ? 'Achieved!' : `${xpRemainingTo100} XP to go`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setTempTargetXP(goalData.targetXP);
                setSelectedDiscipline(goalData.focusDiscipline);
                setIsEditingTarget(true);
              }}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center gap-2 border border-slate-700 cursor-pointer hover:border-cyan-500/50 shadow-md"
              title="Calibrate XP Target & Discipline Focus"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Calibrate Target</span>
            </button>
          </div>
        </div>

        {/* ─── Hero Visual Progress Bar with Interactive Milestones ─── */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Weekly Milestone Orbit
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-400">
                Expected Pace Today: <span className="text-white font-bold">{dailyPacingExpectedPercent}%</span>
              </span>
              <span className="text-cyan-400 font-bold">
                Actual: {progressPercent}%
              </span>
            </div>
          </div>

          {/* Main Track */}
          <div className="relative w-full h-7 bg-slate-950 rounded-full p-1 border border-slate-800 shadow-inner overflow-visible">
            {/* Expected Daily Pacing Guideline Needle */}
            <div
              className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-slate-400/70 z-20 pointer-events-none transition-all duration-500"
              style={{ left: `${Math.min(100, dailyPacingExpectedPercent)}%` }}
              title={`Expected pacing guideline for day ${7 - goalData.daysRemaining} of 7 (${dailyPacingExpectedPercent}%)`}
            >
              <div className="absolute -top-4 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-600 text-[9px] text-slate-300 font-mono whitespace-nowrap">
                Pace Target
              </div>
            </div>

            {/* Glowing Fill Bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (clampedProgress / 125) * 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full relative overflow-hidden ${
                progressPercent >= 100
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 shadow-lg shadow-cyan-500/20'
              }`}
            >
              {/* Animated Light Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>

            {/* Milestone Checkpoint Nodes */}
            {MILESTONES_CONFIG.map((m) => {
              // Convert percent (0 to 125) to percentage along the 125 max track
              const nodeLeftPercent = (m.percent / 125) * 100;
              const isAchieved = progressPercent >= m.percent;
              const isClaimed = goalData.claimedMilestoneIds.includes(m.id);

              return (
                <div
                  key={m.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 group"
                  style={{ left: `${nodeLeftPercent}%` }}
                >
                  <button
                    onClick={() => {
                      if (isAchieved && !isClaimed) {
                        handleClaimMilestone(m);
                      } else {
                        soundManager.playXPEarned();
                        showToast({
                          type: 'info',
                          title: `${m.percent}% Milestone: ${m.title}`,
                          message: `${m.subtitle}. Reward: +${m.bonusXP} XP. Status: ${
                            isClaimed ? 'Claimed' : isAchieved ? 'Ready to Claim!' : 'In Progress'
                          }`,
                        });
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer shadow-md ${
                      isClaimed
                        ? 'bg-emerald-600 border-2 border-emerald-300 text-white shadow-emerald-500/30'
                        : isAchieved
                        ? 'bg-amber-500 border-2 border-white text-slate-950 animate-bounce shadow-lg shadow-amber-500/50 hover:scale-110'
                        : 'bg-slate-900 border-2 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                    title={`${m.title} (${m.percent}%): ${m.subtitle} (+${m.bonusXP} XP)`}
                  >
                    {isClaimed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isAchieved ? (
                      <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                    ) : (
                      <span>{m.percent}%</span>
                    )}
                  </button>

                  {/* Tooltip on Hover */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl shadow-xl z-40 whitespace-nowrap pointer-events-none">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      {m.title} <span className="text-amber-400">+{m.bonusXP} XP</span>
                    </span>
                    <span className="text-[9px] text-slate-400">{m.subtitle}</span>
                    <span className={`text-[9px] font-mono mt-0.5 ${isClaimed ? 'text-emerald-400' : isAchieved ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>
                      {isClaimed ? '✓ Reward Claimed' : isAchieved ? '⚡ Click to Claim Reward!' : `${Math.round(goalData.targetXP * (m.percent / 100))} XP required`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestone Ticks Sub-Labels */}
          <div className="flex justify-between items-center px-1 text-[11px] font-mono text-slate-400">
            <span>0% (Kickoff)</span>
            <span className="hidden sm:inline">25% (Ignition)</span>
            <span>50% (Midway)</span>
            <span className="hidden sm:inline">75% (Orbit)</span>
            <span className="text-emerald-400 font-bold">100% (Target)</span>
            <span className="text-amber-400 font-bold">125% (Overachieve)</span>
          </div>
        </div>
      </div>

      {/* Grid: Milestone Rewards Checklist & Pacing Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Milestone Rewards & Claimable Celebrations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Weekly Milestone Rewards & Celebrations
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {goalData.claimedMilestoneIds.length} of {MILESTONES_CONFIG.length} Claimed
            </span>
          </div>

          <div className="space-y-3">
            {MILESTONES_CONFIG.map((m) => {
              const thresholdXP = Math.round(goalData.targetXP * (m.percent / 100));
              const isAchieved = goalData.currentWeeklyXP >= thresholdXP;
              const isClaimed = goalData.claimedMilestoneIds.includes(m.id);
              const xpAway = Math.max(0, thresholdXP - goalData.currentWeeklyXP);

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isClaimed
                      ? 'bg-slate-900/60 border-emerald-500/30 shadow-sm'
                      : isAchieved
                      ? 'bg-gradient-to-r from-slate-900 to-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isAchieved
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {isClaimed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : m.percent === 100 ? (
                        <Trophy className="w-6 h-6 text-amber-400" />
                      ) : m.percent === 125 ? (
                        <Sparkles className="w-6 h-6 text-pink-400" />
                      ) : (
                        <Award className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {m.percent}% Milestone ({thresholdXP} XP)
                        </span>
                        <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{m.subtitle}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-400" />
                          +{m.bonusXP} Academic Bonus XP
                        </span>
                        {m.badgeName && (
                          <span className="text-cyan-400 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {m.badgeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action or Progress Status */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {isClaimed ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Claimed</span>
                      </div>
                    ) : isAchieved ? (
                      <button
                        onClick={() => handleClaimMilestone(m)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer animate-pulse hover:scale-105"
                      >
                        <Sparkles className="w-4 h-4 fill-slate-950" />
                        <span>Claim Reward (+{m.bonusXP} XP)</span>
                      </button>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400">
                          Need <span className="text-white font-bold">{xpAway} XP</span>
                        </span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((goalData.currentWeeklyXP / thresholdXP) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Weekly Velocity & Discipline Distribution */}
        <div className="space-y-6">
          {/* Daily Rhythm Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                7-Day Weekly Rhythm
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Avg: {Math.round(goalData.currentWeeklyXP / 5)} XP/day
              </span>
            </div>

            {/* Daily Bar Chart */}
            <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 pb-2 border-b border-slate-800/80">
              {DAYS_OF_WEEK.map((d, i) => {
                const maxDayXP = 120;
                const heightPercent = Math.min(100, Math.round((d.xp / maxDayXP) * 100));

                return (
                  <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.xp}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        d.status === 'today'
                          ? 'bg-cyan-500 shadow-sm shadow-cyan-500/50'
                          : d.status === 'completed'
                          ? 'bg-blue-600/80 group-hover:bg-blue-500'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${d.xp > 0 ? heightPercent : 12}%` }}
                    />
                    <span
                      className={`text-[10px] font-mono ${
                        d.status === 'today' ? 'text-cyan-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Target: ~{Math.round(goalData.targetXP / 7)} XP/day</span>
              <span className="text-emerald-400 font-bold">5 of 7 Days Active</span>
            </div>
          </div>

          {/* Discipline XP Sources */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              XP Discipline Distribution
            </h4>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Chemistry & Molecular
                  </span>
                  <span className="font-mono text-slate-400">140 XP (33%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '33%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Astrophysics & Kepler
                  </span>
                  <span className="font-mono text-slate-400">110 XP (26%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: '26%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Cellular Biology & DNA
                  </span>
                  <span className="font-mono text-slate-400">90 XP (21%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '21%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Optics & Snell's Law
                  </span>
                  <span className="font-mono text-slate-400">80 XP (20%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>

            {/* Quick Interactive Study Sprint Simulators */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Quick Goal Accelerators:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateStudySprint(40, 'Optics Laser Refraction Sprint')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700 hover:border-cyan-500/40 text-center"
                >
                  +40 XP (Lab Sprint)
                </button>
                <button
                  onClick={() => handleSimulateStudySprint(80, 'Curriculum Mastery Quiz')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700 hover:border-amber-500/40 text-center"
                >
                  +80 XP (Quiz Exam)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Sprints Archive */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Previous Weekly Sprint Achievements
          </h3>
          <span className="text-xs text-slate-400 font-mono">100% Lifetime Goal Completion</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goalData.pastWeeksHistory.map((past, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{past.weekLabel}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {past.percentage}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Target: {past.targetXP} XP</span>
                <span className="text-slate-200 font-semibold">{past.achievedXP} XP</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, past.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Calibrate Goal Modal ─── */}
      <AnimatePresence>
        {isEditingTarget && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Calibrate Weekly Study Target</h3>
                    <p className="text-xs text-slate-400">Configure your target XP and academic focus</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target XP Presets */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
                  Select Rigor Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_TARGETS.map((preset) => {
                    const isSelected = tempTargetXP === preset.targetXP;
                    return (
                      <div
                        key={preset.level}
                        onClick={() => setTempTargetXP(preset.targetXP)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white text-sm">{preset.level}</span>
                          <span className="font-mono text-xs font-black text-cyan-400">
                            {preset.targetXP} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{preset.desc}</p>
                        <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                          Pacing: {preset.dailyPace}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Slider */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Custom XP Target Slider</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{tempTargetXP} XP/week</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={tempTargetXP}
                  onChange={(e) => setTempTargetXP(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>100 XP (Min)</span>
                  <span>1,000 XP</span>
                  <span>2,000 XP (Max)</span>
                </div>
              </div>

              {/* Focus Discipline */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
                  Focus Discipline:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['All Disciplines', 'Chemistry', 'Astrophysics', 'Biology', 'Optics'].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => setSelectedDiscipline(disc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedDiscipline === disc
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {disc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewTarget}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  Confirm & Set Goal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Celebratory Milestone Modal ─── */}
      <AnimatePresence>
        {activeCelebration && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Confetti Glow Background */}
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Trophy Badge Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/40 border-4 border-white/20 animate-bounce">
                  <Trophy className="w-10 h-10 text-slate-950" />
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                    Milestone Achievement Unlocked!
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {activeCelebration.milestone.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {activeCelebration.milestone.subtitle}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-slate-400">Academic Rewards Granted:</div>
                  <div className="flex items-center justify-center gap-2 text-xl font-black text-amber-300 font-mono">
                    <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
                    <span>+{activeCelebration.xpAwarded} Academic XP</span>
                  </div>
                  {activeCelebration.milestone.badgeName && (
                    <div className="text-xs text-cyan-300 font-semibold flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Title: {activeCelebration.milestone.badgeName}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveCelebration(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all cursor-pointer"
                >
                  Awesome! Continue Learning
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
