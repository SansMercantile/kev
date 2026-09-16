import React, { useState } from 'react';
import { StudentStats, LabId, AvatarConfig, LabSnapshot, CosmeticBadgeVariant } from '../../types';
import { ClassroomLeaderboard } from './ClassroomLeaderboard';
import { DailyMissions } from './DailyMissions';
import { AvatarCustomizerModal } from '../avatar/AvatarCustomizerModal';
import { LabCompletionD3Chart } from './LabCompletionD3Chart';
import { AcademicGradebook } from '../academics/AcademicGradebook';
import { RemedialPracticeHub } from '../academics/RemedialPracticeHub';
import { StandardizedTestingCenter } from '../academics/StandardizedTestingCenter';
import { DailyStudyStreak } from './DailyStudyStreak';
import { StudyGoalsModule } from './StudyGoalsModule';
import { FutureCareerPaths } from './FutureCareerPaths';
import { GlobalTournamentDashboard } from './GlobalTournamentDashboard';
import { CampusAudioSettingsCard } from '../campus/CampusAudioSettingsCard';
import { WeeklyLabChallenge } from './WeeklyLabChallenge';
import { DiscoveryFeed } from './DiscoveryFeed';
import { LearningRoadmap } from './LearningRoadmap';
import {
  Trophy,
  Zap,
  Award,
  BookOpen,
  FlaskConical,
  Orbit,
  Dna,
  Sparkles,
  ExternalLink,
  Flame,
  CheckCircle2,
  TrendingUp,
  Share2,
  UserCheck,
  Paintbrush,
  GraduationCap,
  Target,
  ChevronRight,
  ShieldCheck,
  BarChart2,
  ShoppingBag,
  Users,
  Briefcase,
  Radio,
  Compass,
  MessageSquare,
  Map,
  Wrench,
  Cpu,
  Layers,
  Sliders
} from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import { getDailyStreakData } from '../../utils/streakManager';
import {
  getWorkbenchCustomizerState,
  calculateEfficiencyStats,
  WORKBENCH_SURFACES,
  WORKBENCH_LIGHTINGS,
  WORKBENCH_FUNCTIONAL_UPGRADES
} from '../../utils/workbenchManager';

interface Props {
  studentStats: StudentStats;
  snapshots?: LabSnapshot[];
  onNavigateToLab: (labId: LabId) => void;
  onNavigateToCurriculum: () => void;
  onOpenAITutor: () => void;
  onClaimXP: (xp: number) => void;
  onOpenGlobalComparison?: () => void;
  onUpdateAvatar?: (avatar: AvatarConfig) => void;
  onOpenShop?: () => void;
  onOpenPeerMentors?: () => void;
  onAwardCosmeticBadge?: (badge: CosmeticBadgeVariant) => void;
  onOpenWorkbenchCustomizer?: () => void;
}

export const StudentDashboard: React.FC<Props> = ({
  studentStats,
  snapshots = [],
  onNavigateToLab,
  onNavigateToCurriculum,
  onOpenAITutor,
  onClaimXP,
  onOpenGlobalComparison,
  onUpdateAvatar,
  onOpenShop,
  onOpenPeerMentors,
  onAwardCosmeticBadge,
  onOpenWorkbenchCustomizer,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'roadmap' | 'challenges' | 'feed' | 'streak' | 'missions' | 'careers' | 'tournaments' | 'growth' | 'gradebook' | 'remedial' | 'testing' | 'leaderboard' | 'workbench'>('goals');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);

  const { showToast } = useToast();

  const dailyStreak = getDailyStreakData();
  const workbenchState = getWorkbenchCustomizerState();
  const workbenchEfficiency = calculateEfficiencyStats(workbenchState);
  const userLevel = Math.floor(studentStats.xp / 100) + 1;
  const xpCurrentLevel = studentStats.xp % 100;
  const labCompletionRate = Math.min(100, Math.round((studentStats.completedLabsCount / 4) * 100));

  const handleShareAchievements = () => {
    navigator.clipboard?.writeText(
      `Check out my XR Science progress at KEV: ${studentStats.xp} XP, Level ${userLevel}, with ${studentStats.badges.length} badges! https://kev.sansmercantile.com/`
    );
    showToast({
      type: 'info',
      title: 'Copied to Clipboard!',
      message: 'Your KEV scientific profile link and achievements have been copied.',
    });
  };

  return (
    <div id="student-dashboard" className="w-full flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Student Academic Profile Header Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Avatar & Level */}
        <div className="flex items-center gap-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => setIsAvatarModalOpen(true)}
            title="Click to open Photo-Realistic 3D Avatar Studio"
          >
            {studentStats.avatar?.photoUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 border-2 border-cyan-400/50 bg-slate-950 relative">
                <img
                  src={studentStats.avatar.photoUrl}
                  alt={studentStats.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Paintbrush className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xl text-white font-mono shadow-lg shadow-cyan-500/20 border-2 border-cyan-400/30">
                {studentStats.name.split(' ').map((n) => n[0]).join('')}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] font-mono shadow-sm">
              LVL {userLevel}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">{studentStats.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
                KEV SCHOLAR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {studentStats.grade} • KEV XR Science Academy (
              <a
                href="https://kev.sansmercantile.com/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
              >
                kev.sansmercantile.com
                <ExternalLink className="w-3 h-3" />
              </a>
              )
            </p>

            {/* Level XP Progress Bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="w-48 sm:w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpCurrentLevel}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                {studentStats.xp} Total XP ({xpCurrentLevel}/100 to LVL {userLevel + 1})
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metrics & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Labs Passed</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {studentStats.completedLabsCount}/4
            </span>
            <span className="text-[9px] text-slate-400 block font-mono">({labCompletionRate}%)</span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Quizzes Passed</span>
            <span className="text-base font-bold text-blue-400 font-mono">
              {studentStats.quizzesPassedCount}
            </span>
            <span className="text-[9px] text-slate-400 block font-mono">Honors Grade</span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Badges Earned</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {studentStats.badges.length}
            </span>
            <span className="text-[9px] text-slate-400 block font-mono">Top 15%</span>
          </div>

          {/* Daily Learning Streak & XP Multiplier Counter */}
          <div
            onClick={() => setActiveTab('streak')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-950 border border-orange-500/40 hover:border-orange-400 text-center min-w-[110px] cursor-pointer transition-all hover:scale-105 shadow-sm group"
            title="Click to view consecutive login days, freeze tokens, and active XP multiplier tiers"
          >
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
              <span className="text-[10px] text-orange-300 uppercase font-mono font-bold block">
                Daily Streak
              </span>
            </div>
            <span className="text-base font-black text-amber-300 font-mono block">
              {dailyStreak.currentStreakDays} Days
            </span>
            <span className="text-[9px] text-orange-400 font-mono font-bold block">
              {dailyStreak.currentMultiplier}x XP Multiplier
            </span>
          </div>

          {/* Equipment Shop Button */}
          {onOpenShop && (
            <button
              onClick={onOpenShop}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Open Virtual Equipment Shop"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Equipment Shop</span>
            </button>
          )}

          {/* Workbench Customizer Button */}
          {onOpenWorkbenchCustomizer && (
            <button
              onClick={onOpenWorkbenchCustomizer}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Open Virtual Lab Workbench Customizer & Simulation Efficiency"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Workbench</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 font-mono font-bold">
                {workbenchEfficiency.totalSimulationEfficiency}% Eff.
              </span>
            </button>
          )}

          {/* Peer Mentors Matching Button */}
          {onOpenPeerMentors && (
            <button
              onClick={onOpenPeerMentors}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Open Campus Peer Mentors Matching"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Peer Mentors</span>
            </button>
          )}

          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Open Photo-Realistic 3D Avatar Studio"
          >
            <Paintbrush className="w-4 h-4 text-cyan-400" />
            <span>Photo 3D Avatar</span>
          </button>

          <button
            onClick={handleShareAchievements}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Share KEV Science Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Avatar Active Persona Ribbon */}
      {studentStats.avatar && (
        <div className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: studentStats.avatar.primaryColor, boxShadow: `0 0 10px ${studentStats.avatar.glowColor}` }}
            />
            <span className="font-mono text-slate-300">
              Active Virtual Persona: <strong className="text-white uppercase">{studentStats.avatar.archetype.replace('-', ' ')}</strong>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
              Visor: {studentStats.avatar.visorType}
            </span>
          </div>
          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline text-[11px]"
          >
            Modify Persona
          </button>
        </div>
      )}

      {/* Badges Ribbon Showcase */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Unlocked Scientific Badges:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {studentStats.badges.map((badge, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium shadow-sm"
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>{badge}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-dashed border-slate-700 text-slate-500 text-xs font-mono">
            <span>+3 More to Unlock</span>
          </div>
        </div>
      </div>

      {/* Campus Atmosphere & Audio Soundscape Volume Controls */}
      <CampusAudioSettingsCard />

      {/* Weekly Study Goals Quick Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm">Weekly Study Goal Progress</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                Active Sprint
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Weekly Target: 500 XP • Progress: 420 / 500 XP (84%) • Next Milestone at 500 XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-32 hidden sm:block">
            <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '84%' }} />
            </div>
          </div>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            <span>{activeTab === 'goals' ? 'Viewing Study Goals' : 'Manage Goals & Rewards'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Dashboard Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-300" />
            <span>Study Goals</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              Weekly
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-cyan-300" />
            <span>Learning Roadmap</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              Node Path
            </span>
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'challenges'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Weekly Challenges</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Cosmetics
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Discovery Feed</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              Community
            </span>
          </button>

          <button
            onClick={() => setActiveTab('streak')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'streak'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Study Streak & Multipliers</span>
          </button>

          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'workbench'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-300" />
            <span>Workbench Efficiency</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {workbenchEfficiency.totalSimulationEfficiency}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'missions'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Missions & XP</span>
          </button>

          <button
            onClick={() => setActiveTab('careers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'careers'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-300" />
            <span>Future Career Paths</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              AI Match
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tournaments'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Global Tournaments</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono animate-pulse">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'growth'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>30-Day D3 Growth</span>
          </button>

          <button
            onClick={() => setActiveTab('gradebook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gradebook'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
            <span>Gradebook & Promotion</span>
          </button>

          <button
            onClick={() => setActiveTab('remedial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'remedial'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-300" />
            <span>Remedial Practice Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('testing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'testing'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Testing Center</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Leaderboard</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time academic cohort sync</span>
        </div>
      </div>

      {/* Tab View Content */}
      <div className="flex-1">
        {activeTab === 'goals' && (
          <StudyGoalsModule
            currentTotalXP={studentStats.xp}
            onAwardXP={(xp) => onClaimXP(xp)}
            onNavigateToLab={onNavigateToLab}
            onNavigateToCurriculum={onNavigateToCurriculum}
          />
        )}

        {activeTab === 'roadmap' && (
          <LearningRoadmap
            studentStats={studentStats}
            snapshots={snapshots}
            onNavigateToLab={onNavigateToLab}
            onNavigateToCurriculum={onNavigateToCurriculum}
            onClaimMilestoneXP={(xp, label) => onClaimXP(xp)}
          />
        )}

        {activeTab === 'challenges' && (
          <WeeklyLabChallenge
            onNavigateToLab={onNavigateToLab}
            onAwardXP={(xp, reason) => onClaimXP(xp)}
            onAwardCosmeticBadge={onAwardCosmeticBadge}
            userBadges={studentStats.badges}
          />
        )}

        {activeTab === 'feed' && (
          <DiscoveryFeed
            studentStats={studentStats}
            snapshots={snapshots}
            onNavigateToLab={onNavigateToLab}
            onAwardXP={(xp, reason) => onClaimXP(xp)}
          />
        )}

        {activeTab === 'streak' && (
          <DailyStudyStreak
            currentXP={studentStats.xp}
            onClaimStreakBonus={(xp, label) => {
              onClaimXP(xp);
              showToast({
                type: 'success',
                title: 'Streak Multiplier Reward Claimed!',
                message: `Awarded +${xp} Academic XP for ${label}.`,
              });
            }}
          />
        )}

        {activeTab === 'workbench' && (
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Laboratory Workbench & Simulation Efficiency Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    Accelerate your 3D physics, chemistry, biology, and optics simulations with modular hardware overclocks.
                  </p>
                </div>
              </div>

              {onOpenWorkbenchCustomizer && (
                <button
                  onClick={onOpenWorkbenchCustomizer}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/20 flex items-center gap-2 self-start sm:self-auto"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Open Full Customizer & Shaders</span>
                </button>
              )}
            </div>

            {/* Efficiency Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Simulation Efficiency</span>
                <span className="text-2xl font-black text-cyan-300 font-mono">{workbenchEfficiency.totalSimulationEfficiency}%</span>
                <span className="text-[10px] text-emerald-400 block mt-1">High-Throughput Bus</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-500/30">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Compute Speed</span>
                <span className="text-2xl font-black text-blue-300 font-mono">{workbenchEfficiency.totalComputeAcceleration}x</span>
                <span className="text-[10px] text-blue-300 block mt-1">Accelerated Iteration</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Analytical Precision</span>
                <span className="text-2xl font-black text-purple-300 font-mono">+{workbenchEfficiency.totalPrecisionBoost}%</span>
                <span className="text-[10px] text-purple-300 block mt-1">Zero Calibration Drift</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Academic XP Yield</span>
                <span className="text-2xl font-black text-amber-300 font-mono">+{workbenchEfficiency.totalXPYieldBonus}%</span>
                <span className="text-[10px] text-amber-300 block mt-1">Telemetry Grant Bonus</span>
              </div>
            </div>

            {/* Active Modules Installed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Installed Hardware Acceleration Modules ({workbenchState.equippedUpgradeIds.length})
                </h4>
                <span className="text-xs text-slate-500">
                  Surface: <strong className="text-slate-300 capitalize">{workbenchState.deskSurface}</strong> | Lighting: <strong className="text-slate-300 capitalize">{workbenchState.ambientLighting}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {workbenchState.equippedUpgradeIds.map((id) => {
                  const module = WORKBENCH_FUNCTIONAL_UPGRADES.find((m) => m.id === id);
                  if (!module) return null;
                  const level = workbenchState.upgradeLevels[id] || 1;
                  return (
                    <div key={id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white truncate">{module.name}</h5>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                            Lvl {level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{module.perkEffect}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                          <span>+{Math.round((module.speedMultiplier - 1) * 100 * level)}% Speed</span>
                          <span>•</span>
                          <span>+{module.precisionBoostPercent * level}% Precision</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'missions' && (
          <DailyMissions
            onNavigateToLab={onNavigateToLab}
            onNavigateToCurriculum={onNavigateToCurriculum}
            onOpenAITutor={onOpenAITutor}
            onClaimXP={onClaimXP}
          />
        )}

        {activeTab === 'careers' && (
          <FutureCareerPaths
            studentStats={studentStats}
            onNavigateToLab={onNavigateToLab}
          />
        )}

        {activeTab === 'tournaments' && (
          <GlobalTournamentDashboard
            studentStats={studentStats}
            onNavigateToLab={onNavigateToLab}
            onAwardXP={onClaimXP}
          />
        )}

        {activeTab === 'growth' && (
          <LabCompletionD3Chart
            completedLabsCount={studentStats.completedLabsCount}
            quizzesPassedCount={studentStats.quizzesPassedCount}
            totalXP={studentStats.xp}
          />
        )}

        {activeTab === 'gradebook' && (
          <AcademicGradebook
            studentStats={studentStats}
            onClaimPromotionXP={(xp) => onClaimXP(xp)}
            onNavigateToRemedial={() => setActiveTab('remedial')}
          />
        )}

        {activeTab === 'remedial' && (
          <RemedialPracticeHub
            onAwardXP={(xp) => onClaimXP(xp)}
            onNavigateToLab={onNavigateToLab}
          />
        )}

        {activeTab === 'testing' && (
          <StandardizedTestingCenter
            onCompleteTest={(score, xp) => onClaimXP(xp)}
            onRequestAITutor={() => onOpenAITutor()}
          />
        )}

        {activeTab === 'leaderboard' && (
          <ClassroomLeaderboard
            studentStats={studentStats}
            onOpenGlobalComparison={onOpenGlobalComparison}
          />
        )}
      </div>

      {/* 3D Avatar Customizer Modal */}
      {isAvatarModalOpen && (
        <AvatarCustomizerModal
          currentAvatar={studentStats.avatar}
          onSave={(newAvatar) => {
            if (onUpdateAvatar) onUpdateAvatar(newAvatar);
            showToast({
              type: 'badge',
              title: '3D Avatar Persona Synchronized!',
              message: `Updated to ${newAvatar.archetype.replace('-', ' ')} with ${newAvatar.visorType} optics.`,
            });
            setIsAvatarModalOpen(false);
          }}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}
    </div>
  );
};
