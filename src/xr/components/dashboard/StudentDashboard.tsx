import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StudentStats, LabId, AvatarConfig } from '../../types';
import { ClassroomLeaderboard } from './ClassroomLeaderboard';
import { DailyMissions } from './DailyMissions';
import { AvatarCustomizerModal } from '../avatar/AvatarCustomizerModal';
import { LabCompletionD3Chart } from './LabCompletionD3Chart';
import { AcademicGradebook } from '../academics/AcademicGradebook';
import { RemedialPracticeHub } from '../academics/RemedialPracticeHub';
import { StandardizedTestingCenter } from '../academics/StandardizedTestingCenter';
import { DailyStudyStreak } from './DailyStudyStreak';
import { FutureCareerPaths } from './FutureCareerPaths';
import { GlobalTournamentDashboard } from './GlobalTournamentDashboard';
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
  ShieldCheck,
  BarChart2,
  ShoppingBag,
  Users,
  Briefcase,
  Radio
} from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import { xrClient } from '../../../lib/xrClient';
import { getStudyLevelId } from '../../lib/studyLevel';

interface Props {
  studentStats: StudentStats;
  onNavigateToLab: (labId: LabId) => void;
  onNavigateToCurriculum: () => void;
  onOpenAITutor: () => void;
  onClaimXP: (xp: number) => void;
  onOpenGlobalComparison?: () => void;
  onUpdateAvatar?: (avatar: AvatarConfig) => void;
  onOpenShop?: () => void;
  onOpenPeerMentors?: () => void;
  /**
   * Extra sections rendered at the end of the dashboard's own scroll flow.
   * The dashboard root is the scroller (`flex-1 overflow-y-auto`), so panels
   * that belong to it are passed in rather than stacked outside it — wrapping it
   * would create a second, competing scrollbar.
   */
  footerSections?: React.ReactNode;
}

export const StudentDashboard: React.FC<Props> = ({
  studentStats,
  onNavigateToLab,
  onNavigateToCurriculum,
  onOpenAITutor,
  onClaimXP,
  onOpenGlobalComparison,
  onUpdateAvatar,
  onOpenShop,
  onOpenPeerMentors,
  footerSections,
}) => {
  const [activeTab, setActiveTab] = useState<'streak' | 'missions' | 'careers' | 'tournaments' | 'growth' | 'gradebook' | 'remedial' | 'testing' | 'leaderboard'>('missions');
  const { t } = useTranslation();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [studyPath, setStudyPath] = useState<{ next: { id: string; name: string; description: string; tutor?: { name: string }; immersiveLabId?: string | null }[]; levelGuidance?: { label: string; focus: string } } | null>(null);
  const { showToast } = useToast();

  // Per-student next steps from the dependency-aware study path: badges map
  // to completed XR subjects, the backend unlocks what comes next.
  const BADGE_SUBJECTS: Record<string, string> = {
    'Spatial Chemist': 'xr_chem',
    'Kepler Navigator': 'xr_astro',
    'Cellular Explorer': 'xr_bio',
    'Optics Virtuoso': 'xr_optics',
  };
  useEffect(() => {
    const completed = new Set<string>(['science_101']);
    studentStats.badges.forEach((b) => {
      const sid = BADGE_SUBJECTS[b];
      if (sid) completed.add(sid);
    });
    let cancelled = false;
    xrClient
      .studyPath(Array.from(completed), getStudyLevelId())
      .then((data) => {
        if (!cancelled) setStudyPath(data);
      })
      .catch(() => {
        if (!cancelled) setStudyPath(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentStats.badges.join(','), studentStats.completedLabsCount]);

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

      {/* Primary Dashboard Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('streak')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'streak'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>{t('xr.tabStreak')}</span>
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
            <span>{t('xr.tabMissions')}</span>
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
            <span>{t('xr.tabCareers')}</span>
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
            <span>{t('xr.tabTournaments')}</span>
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
            <span>{t('xr.tabGrowth')}</span>
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
            <span>{t('xr.tabGradebook')}</span>
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
            <span>{t('xr.tabRemedial')}</span>
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
            <span>{t('xr.tabTesting')}</span>
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
            <span>{t('xr.tabLeaderboard')}</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time academic cohort sync</span>
        </div>
      </div>

      {/* Tab View Content */}
      <div className="flex-1">
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

      {/* Recommended next steps - dependency-aware study path for this student */}
      {studyPath && studyPath.next.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-indigo-300" />
            <h3 className="text-sm font-bold text-white">{t('xr.unlockedNext')}</h3>
            {studyPath.levelGuidance && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                {studyPath.levelGuidance.label} level
              </span>
            )}
          </div>
          {studyPath.levelGuidance && (
            <p className="text-[11px] text-slate-400 mb-3">{studyPath.levelGuidance.focus}</p>
          )}
          <div className="grid gap-2 md:grid-cols-3">
            {studyPath.next.slice(0, 3).map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs font-bold text-white">{s.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{s.description}</div>
                <div className="text-[10px] text-indigo-300 font-mono mt-1.5">
                  {s.tutor ? `with ${s.tutor.name}` : ''}
                  {s.immersiveLabId ? ` · 3D ${s.immersiveLabId} lab` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KEV surfaces: jump to the rest of the platform */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-mono uppercase tracking-wider mr-1">{t('xr.continueInKev')}</span>
        <a href="/curriculum" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.fullCurriculum')}</a>
        <a href="/anatomy" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.immersiveLabLink')}</a>
        <a href="/campus-map" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.liveCampusMap')}</a>
        <a href="/vr" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.vrCampusLink')}</a>
        <a href="/agents" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.allTutorsLink')}</a>
      </div>

      {/* 3D Avatar Customizer Modal */}
      {footerSections}

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
