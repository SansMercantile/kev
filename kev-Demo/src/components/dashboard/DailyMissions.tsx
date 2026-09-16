import React, { useState, useEffect } from 'react';
import { LabId } from '../../types';
import { Zap, CheckCircle2, ArrowRight, Flame, Clock, Award, Sparkles, RefreshCw, Trophy, FlaskConical, Orbit, Dna, BookOpen, MessageSquare } from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import confetti from 'canvas-confetti';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: 'Chemistry' | 'Astrophysics' | 'Biology' | 'Optics' | 'Quiz' | 'AI Tutor' | 'Journal';
  associatedLab?: LabId;
  xpReward: number;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  isCompleted: boolean;
  isClaimed: boolean;
  iconName: 'flask' | 'orbit' | 'dna' | 'sparkles' | 'book' | 'message';
}

const DEFAULT_MISSIONS: DailyMission[] = [
  {
    id: 'mission-vsepr-chem',
    title: 'Molecular Architect',
    description: 'Synthesize Water (H2O) or Methane (CH4) and inspect 3D VSEPR bond angles in the Chem Lab.',
    category: 'Chemistry',
    associatedLab: 'chemistry',
    xpReward: 50,
    currentProgress: 1,
    targetProgress: 1,
    unit: 'Molecule',
    isCompleted: true,
    isClaimed: false,
    iconName: 'flask',
  },
  {
    id: 'mission-orbit-sim',
    title: 'Keplerian Navigator',
    description: 'Simulate a stable 3-body gravitational orbit without planetary ejection in Astrophysics.',
    category: 'Astrophysics',
    associatedLab: 'astrophysics',
    xpReward: 60,
    currentProgress: 0,
    targetProgress: 1,
    unit: 'Orbit',
    isCompleted: false,
    isClaimed: false,
    iconName: 'orbit',
  },
  {
    id: 'mission-bio-dna',
    title: 'Genomics Explorer',
    description: 'Inspect the eukaryotic nucleus and transcribe the DNA double-helix in Cellular Biology.',
    category: 'Biology',
    associatedLab: 'biology',
    xpReward: 50,
    currentProgress: 1,
    targetProgress: 1,
    unit: 'Organelle',
    isCompleted: true,
    isClaimed: false,
    iconName: 'dna',
  },
  {
    id: 'mission-quiz-ace',
    title: 'Curriculum Master',
    description: 'Complete any curriculum lesson assessment quiz with an 80%+ high score.',
    category: 'Quiz',
    xpReward: 75,
    currentProgress: 1,
    targetProgress: 1,
    unit: 'Quiz Passed',
    isCompleted: true,
    isClaimed: false,
    iconName: 'book',
  },
  {
    id: 'mission-optics-snell',
    title: 'Photonic Refraction',
    description: 'Tune the laser angle to achieve Total Internal Reflection across the prism interface.',
    category: 'Optics',
    associatedLab: 'optics',
    xpReward: 40,
    currentProgress: 0,
    targetProgress: 1,
    unit: 'Refraction',
    isCompleted: false,
    isClaimed: false,
    iconName: 'sparkles',
  },
  {
    id: 'mission-ai-tutor',
    title: 'Socratic Inquiry',
    description: 'Ask Professor KEV a scientific theory question regarding molecular bonds or orbital laws.',
    category: 'AI Tutor',
    xpReward: 35,
    currentProgress: 0,
    targetProgress: 1,
    unit: 'Question',
    isCompleted: false,
    isClaimed: false,
    iconName: 'message',
  },
];

interface Props {
  onNavigateToLab: (labId: LabId) => void;
  onNavigateToCurriculum: () => void;
  onOpenAITutor: () => void;
  onClaimXP: (xp: number) => void;
}

export const DailyMissions: React.FC<Props> = ({
  onNavigateToLab,
  onNavigateToCurriculum,
  onOpenAITutor,
  onClaimXP,
}) => {
  const { showMissionToast } = useToast();

  const [missions, setMissions] = useState<DailyMission[]>(() => {
    const saved = localStorage.getItem('kev_daily_missions');
    return saved ? JSON.parse(saved) : DEFAULT_MISSIONS;
  });

  const [streakBonusClaimed, setStreakBonusClaimed] = useState<boolean>(() => {
    return localStorage.getItem('kev_daily_streak_claimed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('kev_daily_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem('kev_daily_streak_claimed', String(streakBonusClaimed));
  }, [streakBonusClaimed]);

  const completedCount = missions.filter((m) => m.isCompleted).length;
  const claimedCount = missions.filter((m) => m.isClaimed).length;
  const totalMissions = missions.length;
  const allCompleted = completedCount === totalMissions;

  const handleClaim = (mission: DailyMission) => {
    if (!mission.isCompleted || mission.isClaimed) return;

    setMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, isClaimed: true } : m))
    );

    onClaimXP(mission.xpReward);
    showMissionToast(mission.title, mission.xpReward);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch (e) {
      // Safe fail
    }
  };

  const handleClaimStreakBonus = () => {
    if (streakBonusClaimed || !allCompleted) return;
    setStreakBonusClaimed(true);
    onClaimXP(100);
    showMissionToast('Daily Science Mastery Bonus', 100);

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#8b5cf6'],
      });
    } catch (e) {
      // Safe fail
    }
  };

  const renderIcon = (iconName: DailyMission['iconName']) => {
    switch (iconName) {
      case 'flask':
        return <FlaskConical className="w-4 h-4 text-cyan-400" />;
      case 'orbit':
        return <Orbit className="w-4 h-4 text-amber-400" />;
      case 'dna':
        return <Dna className="w-4 h-4 text-emerald-400" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-pink-400" />;
      default:
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div id="daily-missions-section" className="w-full flex flex-col gap-5">
      {/* Daily Progress Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Daily Scientific Missions
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                5 DAY STREAK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete task-based experiments daily to earn bonus XP and accelerate your academic rank.
            </p>
          </div>
        </div>

        {/* Missions Progress & Reset Timer */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Resets in:</span>
              <span className="font-mono text-cyan-300 font-bold">14h 22m</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {completedCount}/{totalMissions} Completed
              </span>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalMissions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Bonus Banner if All Completed */}
      {allCompleted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-yellow-500/20 border border-amber-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Daily Master Scientist Completed!</h4>
              <p className="text-[11px] text-amber-200/80">
                You have completed all {totalMissions} missions today! Claim your bonus +100 XP.
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimStreakBonus}
            disabled={streakBonusClaimed}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              streakBonusClaimed
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {streakBonusClaimed ? 'Bonus Claimed' : 'Claim +100 XP Bonus'}
          </button>
        </div>
      )}

      {/* Mission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {missions.map((mission) => {
          return (
            <div
              key={mission.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                mission.isClaimed
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                  : mission.isCompleted
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {renderIcon(mission.iconName)}
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                      {mission.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 font-mono font-bold text-[11px] text-cyan-300">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    +{mission.xpReward} XP
                  </div>
                </div>

                {/* Title & Description */}
                <h4 className="text-xs font-bold text-white mb-1 leading-snug">
                  {mission.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {mission.description}
                </p>
              </div>

              {/* Progress & Action Controls */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  {mission.isCompleted ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Goal Met ({mission.targetProgress}/{mission.targetProgress})
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Progress: {mission.currentProgress}/{mission.targetProgress} {mission.unit}
                    </span>
                  )}
                </div>

                <div>
                  {mission.isClaimed ? (
                    <span className="text-[11px] font-mono text-slate-500 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      Claimed
                    </span>
                  ) : mission.isCompleted ? (
                    <button
                      onClick={() => handleClaim(mission)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Claim XP
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (mission.associatedLab) {
                          onNavigateToLab(mission.associatedLab);
                        } else if (mission.category === 'Quiz') {
                          onNavigateToCurriculum();
                        } else if (mission.category === 'AI Tutor') {
                          onOpenAITutor();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Start</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
