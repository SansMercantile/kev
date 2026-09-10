import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LabId, ViewMode, LabSnapshot, StudentStats, Lesson, CampusFacility, AvatarConfig } from './types';
import { ChemistryLab } from './components/labs/ChemistryLab';
import { AstrophysicsLab } from './components/labs/AstrophysicsLab';
import { CellularBiologyLab } from './components/labs/CellularBiologyLab';
import { OpticsLab } from './components/labs/OpticsLab';
import { XRClassroom } from './components/classroom/XRClassroom';
import { CourseViewer } from './components/curriculum/CourseViewer';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { VirtualCampus } from './components/campus/VirtualCampus';
import { VirtualCampusMapModal } from './components/campus/VirtualCampusMapModal';
import { CampusChatSidebar } from './components/chat/CampusChatSidebar';
import { LabGettingStartedOverlay } from './components/labs/LabGettingStartedOverlay';
import { BadgeUnlockModal } from './components/badges/BadgeUnlockModal';
import { GlobalPeerComparisonModal } from './components/dashboard/GlobalPeerComparisonModal';
import { FocusTimer } from './components/labs/FocusTimer';
import { TheoryPracticalBridge } from './components/labs/TheoryPracticalBridge';
import { ARPassThroughModal } from './components/ar/ARPassThroughModal';
import { XRStereoscopicModal } from './components/ar/XRStereoscopicModal';
import { AILabTutorModal } from './components/ai/AILabTutorModal';
import { LabNotebookModal } from './components/notes/LabNotebookModal';
import { QuizModal } from './components/curriculum/QuizModal';
import { useToast } from './components/toast/ToastContext';
import { getStudyLevelId, setStudyLevelId, STUDY_LEVEL_OPTIONS } from './lib/studyLevel';
import {
  Sparkles,
  FlaskConical,
  Orbit,
  Dna,
  Glasses,
  Camera,
  Eye,
  BookOpen,
  Award,
  Users,
  Layers,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
  Trophy,
  Compass,
  MapPin,
  MessageSquare,
  Building2,
  Calculator,
} from 'lucide-react';

const DEFAULT_AVATAR: AvatarConfig = {
  archetype: 'cyber-scholar',
  visorType: 'holo-visor',
  primaryColor: '#06b6d4',
  glowColor: '#38bdf8',
  glowEffect: 'pulse',
  accessory: 'lead-researcher-badge',
  suitPattern: 'hex-grid',
  name: 'Alex Morgan',
};

const INITIAL_STATS: StudentStats = {
  id: 'student-alex-morgan',
  name: 'Alex Morgan',
  grade: 'Grade 9 - Advanced STEM',
  xp: 450,
  completedLabsCount: 3,
  quizzesPassedCount: 2,
  badges: ['Spatial Chemist', 'Kepler Navigator', 'Cellular Explorer'],
  avatar: DEFAULT_AVATAR,
};

// Stable per-browser student id for campus chat (older saved stats predate it).
function ensureStudentId(stats: StudentStats): StudentStats {
  if (stats.id) return stats;
  const slug = (stats.name || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'student';
  return { ...stats, id: `student-${slug}` };
}

export default function App() {
  const { t } = useTranslation();
  const { showBadgeToast, showXPToast, showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('campus');
  const [activeLab, setActiveLab] = useState<LabId>('chemistry');
  const [studyLevel, setStudyLevel] = useState<string>(() => getStudyLevelId());

  // Load stats with backward-compatibility migration from byt_ to kev_
  const [studentStats, setStudentStats] = useState<StudentStats>(() => {
    const savedKev = localStorage.getItem('kev_student_stats');
    if (savedKev) {
      try {
        const parsed = JSON.parse(savedKev);
        if (!parsed.avatar) parsed.avatar = DEFAULT_AVATAR;
        return ensureStudentId(parsed);
      } catch (e) { /* ignore */ }
    }
    const savedByt = localStorage.getItem('byt_student_stats');
    if (savedByt) {
      try {
        const parsed = JSON.parse(savedByt);
        if (!parsed.avatar) parsed.avatar = DEFAULT_AVATAR;
        return ensureStudentId(parsed);
      } catch (e) { /* ignore */ }
    }
    return INITIAL_STATS;
  });

  const [snapshots, setSnapshots] = useState<LabSnapshot[]>(() => {
    const savedKev = localStorage.getItem('kev_lab_snapshots');
    if (savedKev) {
      try { return JSON.parse(savedKev); } catch (e) { /* ignore */ }
    }
    const savedByt = localStorage.getItem('byt_lab_snapshots');
    if (savedByt) {
      try { return JSON.parse(savedByt); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Modals state
  const [isARModalOpen, setIsARModalOpen] = useState<boolean>(false);
  const [isStereoscopicOpen, setIsStereoscopicOpen] = useState<boolean>(false);
  const [isAITutorOpen, setIsAITutorOpen] = useState<boolean>(false);
  const [aiTutorInitialPrompt, setAiTutorInitialPrompt] = useState<string>('');
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // New Interactive Spatial Campus & Lab Guidance states
  const [isCampusMapOpen, setIsCampusMapOpen] = useState<boolean>(false);
  const [isCampusChatOpen, setIsCampusChatOpen] = useState<boolean>(false);
  const [isLabGuideOpen, setIsLabGuideOpen] = useState<boolean>(false);
  const [isGlobalComparisonOpen, setIsGlobalComparisonOpen] = useState<boolean>(false);
  const [teleportTargetFacility, setTeleportTargetFacility] = useState<CampusFacility | null>(null);
  const [currentFloor, setCurrentFloor] = useState<1 | 2 | 3 | 4>(1);
  const [unlockedBadgeAnimation, setUnlockedBadgeAnimation] = useState<{ name: string; description: string } | null>(null);
  const [isTheoryBridgeOpen, setIsTheoryBridgeOpen] = useState<boolean>(false);

  // Auto-launch Getting Started orientation when student enters labs for the first time
  useEffect(() => {
    if (viewMode === 'labs') {
      const hasSeenTutorial = localStorage.getItem('kev_lab_tutorial_seen');
      if (!hasSeenTutorial) {
        setIsLabGuideOpen(true);
      }
    }
  }, [viewMode]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('kev_student_stats', JSON.stringify(studentStats));
  }, [studentStats]);

  useEffect(() => {
    localStorage.setItem('kev_lab_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  // Check and grant badges
  const checkAndAwardBadge = (badgeName: string, reason: string) => {
    setStudentStats((prev) => {
      if (prev.badges.includes(badgeName)) return prev;
      showBadgeToast(badgeName, reason);
      setUnlockedBadgeAnimation({ name: badgeName, description: reason });
      return {
        ...prev,
        xp: prev.xp + 50,
        badges: [...prev.badges, badgeName],
      };
    });
  };

  // Handler for saving snapshot from labs
  const handleSaveSnapshot = (snapshot: LabSnapshot) => {
    setSnapshots((prev) => [snapshot, ...prev]);
    // Reward XP for scientific logging
    setStudentStats((prev) => {
      const newCount = prev.completedLabsCount < 4 ? prev.completedLabsCount + 1 : prev.completedLabsCount;
      return {
        ...prev,
        xp: prev.xp + 25,
        completedLabsCount: newCount,
      };
    });
    showXPToast(25, '3D Lab Snapshot logged to Notebook');

    // Check for lab completion badges
    if (snapshot.labId === 'optics') {
      checkAndAwardBadge('Optics Virtuoso', 'Conducted Snell’s Law and internal reflection analysis in the Optics Lab!');
    } else if (snapshot.labId === 'chemistry') {
      checkAndAwardBadge('Spatial Chemist', 'Mapped molecular geometry and VSEPR angles in 3D!');
    } else if (snapshot.labId === 'astrophysics') {
      checkAndAwardBadge('Kepler Navigator', 'Simulated orbital velocities and gravitational curves!');
    } else if (snapshot.labId === 'biology') {
      checkAndAwardBadge('Cellular Explorer', 'Investigated eukaryotic organelles and DNA helices!');
    }
  };

  const handleSaveARSnapshot = (dataUrl: string, note: string) => {
    const newSnapshot: LabSnapshot = {
      id: `ar-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      labId: activeLab,
      labName: `AR Pass-Through: ${activeLab.toUpperCase()}`,
      imageDataUrl: dataUrl,
      note,
      measurements: {
        Mode: 'Augmented Reality Desk Reticle',
        Environment: 'Physical Room Stream',
      },
    };
    handleSaveSnapshot(newSnapshot);
    checkAndAwardBadge('XR Holographer', 'Captured spatial 3D science simulation in physical room AR pass-through mode!');
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddObservation = (text: string) => {
    setStudentStats((prev) => ({ ...prev, xp: prev.xp + 15 }));
    showXPToast(15, 'Scientific Hypothesis Logged');
  };

  const handleOpenTutorWithPrompt = (prompt: string) => {
    setAiTutorInitialPrompt(prompt);
    setIsAITutorOpen(true);
  };

  const handlePassQuiz = (xpEarned: number) => {
    setStudentStats((prev) => {
      const updated = {
        ...prev,
        xp: prev.xp + xpEarned,
        quizzesPassedCount: prev.quizzesPassedCount + 1,
      };
      if (updated.quizzesPassedCount >= 3) {
        setTimeout(() => {
          checkAndAwardBadge('Master Scholar', 'Passed 3 or more rigorous science assessment checkpoints!');
        }, 1000);
      }
      return updated;
    });
  };

  const handleClaimMissionXP = (xp: number) => {
    setStudentStats((prev) => ({
      ...prev,
      xp: prev.xp + xp,
    }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Main Navigation Header */}
      <header className="h-16 shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 lg:px-6 z-30">
        {/* Brand & School Logo */}
        <div className="flex items-center gap-3">
          <a
            href="https://kev.sansmercantile.com/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 no-underline"
            title="Visit KEV (https://kev.sansmercantile.com/)"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-bold text-lg font-mono transition-transform group-hover:scale-105">
              KEV
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  KEV Science Academy
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
                    XR LABS
                  </span>
                </h1>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                4-Floor Virtual Campus, 3D Science Labs & Socratic Tutors
              </p>
            </div>
          </a>
        </div>

        {/* Primary View Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('campus')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'campus'
                ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
            {t('xr.campus')}
          </button>
          <button
            onClick={() => setViewMode('classroom')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'classroom'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-300" />
            {t('xr.auditorium')}
          </button>
          <button
            onClick={() => setViewMode('labs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'labs'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            {t('xr.labs')}
          </button>
          <button
            onClick={() => setViewMode('curriculum')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'curriculum'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
            {t('xr.curriculum')}
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'dashboard'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            {t('xr.dashboard')}
          </button>
        </nav>

        {/* Right Tools & Student Profile */}
        <div className="flex items-center gap-2">
          {/* Virtual Campus 2D Map Button */}
          <button
            onClick={() => setIsCampusMapOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open 4-Floor School Map & Teleport"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t('xr.campusMap')}</span>
          </button>

          {/* Study Level Selector - one adaptive engine for every grade */}
          <select
            value={studyLevel}
            onChange={(e) => {
              setStudyLevel(e.target.value);
              setStudyLevelId(e.target.value);
            }}
            className="px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title={t('xr.studyLevelHint')}
          >
            {STUDY_LEVEL_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>

          {/* Real-time Campus Chat Sidebar Toggle Button */}
          <button
            onClick={() => setIsCampusChatOpen(!isCampusChatOpen)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Real-time Campus Study Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t('xr.campusChat')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* AR Pass-Through Button */}
          <button
            onClick={() => setIsARModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Augmented Reality Camera Overlay"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">{t('xr.arPassthrough')}</span>
          </button>

          {/* Stereoscopic VR Button */}
          <button
            onClick={() => setIsStereoscopicOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Stereoscopic Split Screen for VR Headsets"
          >
            <Glasses className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">{t('xr.vrSplit')}</span>
          </button>

          {/* AI Tutor Button */}
          <button
            onClick={() => {
              setAiTutorInitialPrompt('');
              setIsAITutorOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">{t('xr.askTutor')}</span>
          </button>

          {/* Student Lab Notebook Button */}
          <button
            onClick={() => setIsNotebookOpen(true)}
            className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs transition-colors cursor-pointer"
            title="Open Student Scientific Lab Notebook & PDF Export"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] font-mono">
              {studentStats.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[11px] font-semibold text-white block leading-tight">
                {studentStats.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-medium">
                {studentStats.xp} XP
              </span>
            </div>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex flex-col gap-2 z-40">
          <button
            onClick={() => {
              setViewMode('campus');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'campus' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-300" />
            {t('xr.campus')} (4)
          </button>
          <button
            onClick={() => {
              setIsCampusMapOpen(true);
              setMobileMenuOpen(false);
            }}
            className="p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 text-cyan-300 hover:bg-slate-800"
          >
            <MapPin className="w-4 h-4" />
            {t('xr.campusMap')}
          </button>
          <button
            onClick={() => {
              setIsCampusChatOpen(true);
              setMobileMenuOpen(false);
            }}
            className="p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 text-purple-300 hover:bg-slate-800"
          >
            <MessageSquare className="w-4 h-4" />
            {t('xr.campusChat')}
          </button>
          <button
            onClick={() => {
              setViewMode('classroom');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'classroom' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-300" />
            {t('xr.auditorium')}
          </button>
          <button
            onClick={() => {
              setViewMode('labs');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'labs' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-300" />
            {t('xr.labs')}
          </button>
          <button
            onClick={() => {
              setViewMode('curriculum');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'curriculum' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            {t('xr.curriculum')}
          </button>
          <button
            onClick={() => {
              setViewMode('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'dashboard' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            {t('xr.dashboard')}
          </button>
        </div>
      )}

      {/* Virtual Lab Selection Sub-header Bar (when in 'labs' mode) */}
      {viewMode === 'labs' && (
        <div className="shrink-0 bg-slate-900/80 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-2 hidden sm:inline">
              {t('xr.selectLab')}
            </span>
            <button
              onClick={() => setActiveLab('chemistry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeLab === 'chemistry'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('xr.chemLab')}</span>
            </button>
            <button
              onClick={() => setActiveLab('astrophysics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeLab === 'astrophysics'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('xr.astroLab')}</span>
            </button>
            <button
              onClick={() => setActiveLab('biology')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeLab === 'biology'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              <Dna className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('xr.bioLab')}</span>
            </button>
            <button
              onClick={() => setActiveLab('optics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeLab === 'optics'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>{t('xr.opticsLab')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {/* Theory & Practical Bridge Trigger */}
            <button
              onClick={() => setIsTheoryBridgeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Open interactive theory formulas & calculators"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('xr.theoryBridge')}</span>
            </button>

            {/* Lab Getting Started & Spatial Controls Orientation Trigger */}
            <button
              onClick={() => setIsLabGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('xr.controlsGuide')}</span>
            </button>

            <button
              onClick={() =>
                handleOpenTutorWithPrompt(
                  `Can you explain the mathematical laws and key scientific formulas governing this ${activeLab} virtual experiment?`
                )
              }
              className="hidden sm:flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('xr.labTheoryHelp')}
            </button>
          </div>
        </div>
      )}

      {/* Main Dynamic Workspace Area */}
      <main className="flex-1 w-full overflow-hidden relative flex">
        {viewMode === 'campus' && (
          <div className="w-full h-full relative">
            <VirtualCampus
              currentFloor={currentFloor}
              userAvatar={studentStats.avatar}
              userName={studentStats.name}
              onOpenMap={() => setIsCampusMapOpen(true)}
              onOpenChat={() => setIsCampusChatOpen(true)}
              onNavigateToLab={(labId) => {
                setActiveLab(labId);
                setViewMode('labs');
              }}
              onNavigateToClassroom={() => setViewMode('classroom')}
              onRequestAITutor={handleOpenTutorWithPrompt}
              teleportTargetFacility={teleportTargetFacility}
              onClearTeleportTarget={() => setTeleportTargetFacility(null)}
            />
          </div>
        )}

        {viewMode === 'classroom' && (
          <div className="w-full h-full p-2 sm:p-4">
            <XRClassroom onRequestAITutor={handleOpenTutorWithPrompt} />
          </div>
        )}

        {viewMode === 'labs' && (
          <div className="w-full h-full p-2 sm:p-4 relative">
            {/* Focus Timer tracking experiment time and rewarding 'Concentration' badge */}
            <FocusTimer
              labName={activeLab}
              hasConcentrationBadge={studentStats.badges.includes('Concentration')}
              onAwardConcentrationBadge={() =>
                checkAndAwardBadge(
                  'Concentration',
                  'Maintained 30 minutes of unbroken scientific focus in a virtual laboratory session!'
                )
              }
            />

            {activeLab === 'chemistry' && (
              <ChemistryLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
              />
            )}
            {activeLab === 'astrophysics' && (
              <AstrophysicsLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
              />
            )}
            {activeLab === 'biology' && (
              <CellularBiologyLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
              />
            )}
            {activeLab === 'optics' && (
              <OpticsLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
              />
            )}
          </div>
        )}

        {viewMode === 'curriculum' && (
          <CourseViewer
            onSelectLab={(labId) => {
              setActiveLab(labId);
              setViewMode('labs');
            }}
            onOpenQuiz={(lesson) => setQuizLesson(lesson)}
            onRequestAITutor={handleOpenTutorWithPrompt}
          />
        )}

        {viewMode === 'dashboard' && (
          <StudentDashboard
            studentStats={studentStats}
            onNavigateToLab={(labId) => {
              setActiveLab(labId);
              setViewMode('labs');
            }}
            onNavigateToCurriculum={() => setViewMode('curriculum')}
            onOpenAITutor={() => {
              setAiTutorInitialPrompt('Hello Professor KEV, what scientific concepts should I focus on next?');
              setIsAITutorOpen(true);
            }}
            onClaimXP={handleClaimMissionXP}
            onOpenGlobalComparison={() => setIsGlobalComparisonOpen(true)}
            onUpdateAvatar={(newAvatar) => {
              setStudentStats((prev) => ({ ...prev, avatar: newAvatar }));
            }}
          />
        )}

        {/* Real-time Campus Study Chat Sidebar */}
        <CampusChatSidebar
          isOpen={isCampusChatOpen}
          onClose={() => setIsCampusChatOpen(false)}
          currentUser={studentStats}
          currentRoomId={
            viewMode === 'campus'
              ? `floor-${currentFloor}`
              : viewMode === 'labs'
              ? `lab-${activeLab}`
              : 'classroom-main'
          }
          currentRoomName={
            viewMode === 'campus'
              ? `Floor ${currentFloor} Commons`
              : viewMode === 'labs'
              ? `${activeLab.toUpperCase()} Lab`
              : 'XR Auditorium'
          }
        />
      </main>

      {/* Virtual Campus 2D Map Modal & Teleportation */}
      {isCampusMapOpen && (
        <VirtualCampusMapModal
          isOpen={isCampusMapOpen}
          onClose={() => setIsCampusMapOpen(false)}
          initialFloor={currentFloor}
          currentFloor={currentFloor}
          onSelectFloor={(floor) => setCurrentFloor(floor)}
          onTeleportToRoom={(facility, floorNum) => {
            setCurrentFloor(floorNum);
            if (facility.associatedLabId) {
              setActiveLab(facility.associatedLabId);
              setViewMode('labs');
            } else {
              setViewMode('campus');
              setTeleportTargetFacility(facility);
            }
            setIsCampusMapOpen(false);
            showToast({
              type: 'info',
              title: `Teleported to ${facility.name}`,
              message: `Arrived at Floor ${floorNum} (${facility.roomNumber}).`,
            });
          }}
          onTeleportToFacility={(facility, floorNum) => {
            setCurrentFloor(floorNum);
            if (facility.associatedLabId) {
              setActiveLab(facility.associatedLabId);
              setViewMode('labs');
            } else {
              setViewMode('campus');
              setTeleportTargetFacility(facility);
            }
            setIsCampusMapOpen(false);
            showToast({
              type: 'info',
              title: `Teleported to ${facility.name}`,
              message: `Arrived at Floor ${floorNum} (${facility.roomNumber}).`,
            });
          }}
        />
      )}

      {/* Lab Getting Started Interactive Overlay */}
      {isLabGuideOpen && (
        <LabGettingStartedOverlay
          labName={`${activeLab.charAt(0).toUpperCase() + activeLab.slice(1)} Lab`}
          onClose={() => setIsLabGuideOpen(false)}
          onLaunchAR={() => setIsARModalOpen(true)}
          onLaunchVR={() => setIsStereoscopicOpen(true)}
        />
      )}

      {/* Global Peer Comparison Modal */}
      {isGlobalComparisonOpen && (
        <GlobalPeerComparisonModal
          currentUserStats={studentStats}
          onClose={() => setIsGlobalComparisonOpen(false)}
        />
      )}

      {/* CSS-based Badge Entrance Fanfare Animation */}
      {unlockedBadgeAnimation && (
        <BadgeUnlockModal
          badgeName={unlockedBadgeAnimation.name}
          description={unlockedBadgeAnimation.description}
          onClose={() => setUnlockedBadgeAnimation(null)}
        />
      )}

      {/* AR Pass-Through Modal */}
      {isARModalOpen && (
        <ARPassThroughModal
          activeLab={activeLab}
          onClose={() => setIsARModalOpen(false)}
          onSaveSnapshot={handleSaveARSnapshot}
        />
      )}

      {/* Stereoscopic VR Dual Eye Modal */}
      {isStereoscopicOpen && (
        <XRStereoscopicModal
          activeLab={activeLab}
          onClose={() => setIsStereoscopicOpen(false)}
        />
      )}

      {/* AI Socratic Tutor Modal */}
      <AILabTutorModal
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        activeLab={activeLab}
        initialQuestion={aiTutorInitialPrompt}
      />

      {/* Student Lab Notebook Modal */}
      <LabNotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        snapshots={snapshots}
        studentStats={studentStats}
        onDeleteSnapshot={handleDeleteSnapshot}
        onAddObservation={handleAddObservation}
      />

      {/* Assessment Quiz Modal */}
      {quizLesson && (
        <QuizModal
          isOpen={!!quizLesson}
          onClose={() => setQuizLesson(null)}
          lessonTitle={quizLesson.title}
          questions={quizLesson.quizQuestions}
          onPassQuiz={handlePassQuiz}
        />
      )}

      {/* Theory & Practical Bridge Modal */}
      {isTheoryBridgeOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <button
              onClick={() => setIsTheoryBridgeOpen(false)}
              className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors shadow-lg"
              title="Close Theory Bridge"
            >
              <X className="w-4 h-4" />
            </button>
            <TheoryPracticalBridge
              activeLab={activeLab}
              onLaunchPractical={(lab) => {
                setActiveLab(lab);
                setIsTheoryBridgeOpen(false);
              }}
              onRequestAITutor={handleOpenTutorWithPrompt}
            />
          </div>
        </div>
      )}
    </div>
  );
}
