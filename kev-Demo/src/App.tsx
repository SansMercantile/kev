import React, { useState, useEffect, useCallback } from 'react';
import { LabId, ViewMode, LabSnapshot, StudentStats, Lesson, CampusFacility, AvatarConfig, LabEquipment } from './types';
import { ChemistryLab } from './components/labs/ChemistryLab';
import { AstrophysicsLab } from './components/labs/AstrophysicsLab';
import { CellularBiologyLab } from './components/labs/CellularBiologyLab';
import { OpticsLab } from './components/labs/OpticsLab';
import { XRClassroom } from './components/classroom/XRClassroom';
import { CourseViewer } from './components/curriculum/CourseViewer';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { VirtualCampus } from './components/campus/VirtualCampus';
import { LabWorkbenchCustomizerModal } from './components/shop/LabWorkbenchCustomizerModal';
import { EquipmentShopModal } from './components/shop/EquipmentShopModal';
import { getWorkbenchCustomizerState, calculateEfficiencyStats } from './utils/workbenchManager';
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
import { VRSportsArena } from './components/sports/VRSportsArena';
import { PhysicsPlayground } from './components/campus/PhysicsPlayground';
import { VisitorsPortal } from './components/visitors/VisitorsPortal';
import { CampusAnnouncementsTicker } from './components/header/CampusAnnouncementsTicker';

import { ConnectivityIndicator } from './components/header/ConnectivityIndicator';
import { useToast } from './components/toast/ToastContext';
import { ScienceTwinModal } from './components/labs/ScienceTwinModal';
import { PlanetaryReconModal } from './components/labs/PlanetaryReconModal';
import { SmartSketchToSimModal } from './components/labs/SmartSketchToSimModal';
import { LabStudyKitModal } from './components/labs/LabStudyKitModal';
import { LabSafetyProtocolModal } from './components/labs/LabSafetyProtocolModal';
import { EducationTierSelector } from './components/curriculum/EducationTierSelector';
import { EducationTier } from './types';
import { recordDailyActivity, applyStreakMultiplier } from './utils/streakManager';
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
  Waves,
  Activity,
  ShieldCheck,
  Wrench,
  ShoppingBag,
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
  name: 'Alex Morgan',
  grade: 'Grade 9 - Advanced STEM',
  xp: 450,
  completedLabsCount: 3,
  quizzesPassedCount: 2,
  badges: ['Spatial Chemist', 'Kepler Navigator', 'Cellular Explorer'],
  avatar: DEFAULT_AVATAR,
};

export default function App() {
  const { showBadgeToast, showXPToast, showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('campus');
  const [activeLab, setActiveLab] = useState<LabId>('chemistry');

  // Load stats with backward-compatibility migration from byt_ to kev_
  const [studentStats, setStudentStats] = useState<StudentStats>(() => {
    const savedKev = localStorage.getItem('kev_student_stats');
    if (savedKev) {
      try {
        const parsed = JSON.parse(savedKev);
        if (!parsed.avatar) parsed.avatar = DEFAULT_AVATAR;
        return parsed;
      } catch (e) { /* ignore */ }
    }
    const savedByt = localStorage.getItem('byt_student_stats');
    if (savedByt) {
      try {
        const parsed = JSON.parse(savedByt);
        if (!parsed.avatar) parsed.avatar = DEFAULT_AVATAR;
        return parsed;
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

  // Advanced XR Science Twin, Sketch-to-Sim, Study Kit & Planetary Recon States
  const [currentTier, setCurrentTier] = useState<EducationTier>('high_school');
  const [isScienceTwinOpen, setIsScienceTwinOpen] = useState<boolean>(false);
  const [isSketchToSimOpen, setIsSketchToSimOpen] = useState<boolean>(false);
  const [isStudyKitOpen, setIsStudyKitOpen] = useState<boolean>(false);
  const [isPlanetaryReconOpen, setIsPlanetaryReconOpen] = useState<boolean>(false);
  const [isLabSafetyOpen, setIsLabSafetyOpen] = useState<boolean>(false);

  // Lab Workbench Customizer & Equipment Shop states
  const [isWorkbenchCustomizerOpen, setIsWorkbenchCustomizerOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [workbenchState, setWorkbenchState] = useState(getWorkbenchCustomizerState);
  const [unlockedEquipmentIds, setUnlockedEquipmentIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('kev_unlocked_equipment');
    return saved ? JSON.parse(saved) : ['spectrometer-std', 'pipette-std', 'telescope-std', 'microscope-std'];
  });
  const [equippedToolId, setEquippedToolId] = useState<string>(() => {
    return localStorage.getItem('kev_equipped_tool') || 'spectrometer-std';
  });

  // Auto-launch mandatory Safety Quiz on first lab entry, and record daily streak activity
  useEffect(() => {
    if (viewMode === 'labs') {
      recordDailyActivity('lab_interaction', `Accessed ${activeLab} 3D simulation lab`);
      const hasPassedSafety = localStorage.getItem('kev_lab_safety_passed');
      if (!hasPassedSafety) {
        setIsLabSafetyOpen(true);
      } else {
        const hasSeenTutorial = localStorage.getItem('kev_lab_tutorial_seen');
        if (!hasSeenTutorial) {
          setIsLabGuideOpen(true);
        }
      }
    } else if (viewMode === 'curriculum') {
      recordDailyActivity('classroom_visit', 'Attended virtual curriculum classroom');
    }
  }, [viewMode, activeLab]);

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

  const handlePassSafetyQuiz = (xpEarned: number, badgeName: string) => {
    checkAndAwardBadge(badgeName, 'Passed mandatory virtual XR lab safety and protocol clearance!');
    handleAwardXP(xpEarned, 'Lab Safety & XR Protocol Certification');
    setIsLabSafetyOpen(false);

    // After passing safety, trigger guide if first time
    const hasSeenTutorial = localStorage.getItem('kev_lab_tutorial_seen');
    if (!hasSeenTutorial) {
      setTimeout(() => setIsLabGuideOpen(true), 600);
    }
  };

  const handleDeductXP = useCallback((amount: number) => {
    setStudentStats((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp - amount),
    }));
  }, []);

  const handlePurchaseEquipment = useCallback((tool: LabEquipment) => {
    setUnlockedEquipmentIds((prev) => {
      const next = [...prev, tool.id];
      localStorage.setItem('kev_unlocked_equipment', JSON.stringify(next));
      return next;
    });
    handleDeductXP(tool.costXP);
  }, [handleDeductXP]);

  const handleEquipTool = useCallback((toolId: string) => {
    setEquippedToolId(toolId);
    localStorage.setItem('kev_equipped_tool', toolId);
  }, []);

  const handleAwardXP = useCallback((baseXP: number, reason: string) => {
    const wbState = getWorkbenchCustomizerState();
    const wbEff = calculateEfficiencyStats(wbState);
    const wbMultiplier = 1 + (wbEff.totalXPYieldBonus / 100);

    const { multipliedXP: streakMultipliedXP, multiplier: streakMult } = applyStreakMultiplier(baseXP);
    const finalXP = Math.round(streakMultipliedXP * wbMultiplier);

    setStudentStats((prev) => ({
      ...prev,
      xp: prev.xp + finalXP,
    }));

    let bonusTag = '';
    if (streakMult > 1 && wbEff.totalXPYieldBonus > 0) {
      bonusTag = ` (${streakMult}x Streak + ${wbEff.totalXPYieldBonus}% Workbench Multiplier)`;
    } else if (streakMult > 1) {
      bonusTag = ` (${streakMult}x Streak Multiplier)`;
    } else if (wbEff.totalXPYieldBonus > 0) {
      bonusTag = ` (+${wbEff.totalXPYieldBonus}% Workbench Multiplier)`;
    }

    showXPToast(finalXP, `${reason}${bonusTag}`);
  }, [showXPToast]);

  const handleClaimMissionXP = (xp: number) => {
    handleAwardXP(xp, 'Mission Claimed');
  };

  const handleBackToCampus = useCallback(() => {
    setViewMode('campus');
  }, []);

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
            onClick={() => setViewMode('visitors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'visitors'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-white hover:bg-slate-900 border border-emerald-500/30'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Visitors & Admissions</span>
          </button>
          <button
            onClick={() => setViewMode('campus')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'campus'
                ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
            3D Virtual Campus
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
            Auditorium
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
            Science Labs
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
            Curriculum
          </button>
          <button
            onClick={() => setViewMode('physics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'physics'
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-300" />
            Physics Sandbox
          </button>
          <button
            onClick={() => setViewMode('sports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'sports'
                ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-teal-300" />
            VR Sports
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
            Dashboard
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
            <span className="hidden xl:inline">Campus Map</span>
          </button>

          {/* Real-time Campus Chat Sidebar Toggle Button */}
          <button
            onClick={() => setIsCampusChatOpen(!isCampusChatOpen)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Real-time Campus Study Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Campus Chat</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* AR Pass-Through Button */}
          <button
            onClick={() => setIsARModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Augmented Reality Camera Overlay"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">AR Pass-Through</span>
          </button>

          {/* Stereoscopic VR Button */}
          <button
            onClick={() => setIsStereoscopicOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Stereoscopic Split Screen for VR Headsets"
          >
            <Glasses className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">VR Split</span>
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
            <span className="hidden sm:inline">Ask Tutor</span>
          </button>

          {/* Real-time KEV Backend Connectivity Indicator */}
          <ConnectivityIndicator />

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
              setViewMode('visitors');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'visitors' ? 'bg-emerald-600 text-white font-semibold' : 'text-emerald-400'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-300" />
            Visitors & Admissions Portal
          </button>
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
            3D Virtual Campus (4 Floors)
          </button>
          <button
            onClick={() => {
              setIsCampusMapOpen(true);
              setMobileMenuOpen(false);
            }}
            className="p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 text-cyan-300 hover:bg-slate-800"
          >
            <MapPin className="w-4 h-4" />
            Campus Map & Teleport
          </button>
          <button
            onClick={() => {
              setIsCampusChatOpen(true);
              setMobileMenuOpen(false);
            }}
            className="p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 text-purple-300 hover:bg-slate-800"
          >
            <MessageSquare className="w-4 h-4" />
            Real-time Campus Chat
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
            Auditorium
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
            Virtual Science Labs
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
            Curriculum & Tracks
          </button>
          <button
            onClick={() => {
              setViewMode('physics');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'physics' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-300" />
            Physics Sandbox
          </button>
          <button
            onClick={() => {
              setViewMode('sports');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'sports' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Waves className="w-4 h-4 text-teal-300" />
            VR Sports Arena & Pool
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
            Dashboard, Leaderboard & Missions
          </button>
        </div>
      )}

      {/* Campus Announcements Live Ticker (WebSockets) */}
      <CampusAnnouncementsTicker
        onOpenTournaments={() => {
          setViewMode('dashboard');
        }}
        onOpenSports={() => {
          setViewMode('sports');
        }}
      />

      {/* Virtual Lab Selection Sub-header Bar (when in 'labs' mode) */}
      {viewMode === 'labs' && (
        <div className="shrink-0 bg-slate-900/80 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-2 hidden sm:inline">
              Select 3D Virtual Lab:
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
              <span>Chemistry Lab (VSEPR & Bonds)</span>
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
              <span>Astrophysics Lab (Kepler & Gravity)</span>
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
              <span>Cellular Biology Lab (Organelles & DNA)</span>
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
              <span>Wave Optics Lab (Snell & Dispersion)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {/* Education Tier Selector */}
            <div className="hidden md:block">
              <EducationTierSelector
                currentTier={currentTier}
                onSelectTier={setCurrentTier}
              />
            </div>

            {/* Lab Workbench Customizer & Simulation Efficiency */}
            <button
              onClick={() => setIsWorkbenchCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Customize Virtual Laboratory Equipment & Simulation Efficiency"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workbench Customizer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 font-mono font-bold">
                {calculateEfficiencyStats(workbenchState).totalSimulationEfficiency}% Eff.
              </span>
            </button>

            {/* Theory & Practical Bridge Trigger */}
            <button
              onClick={() => setIsTheoryBridgeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Open interactive theory formulas & calculators"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Theory & Practical Bridge</span>
            </button>

            {/* Lab Safety & Protocol Clearance Status */}
            <button
              onClick={() => setIsLabSafetyOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Review Virtual XR Lab Safety & Protocol Requirements"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safety Clearance: Authorized</span>
            </button>

            {/* Lab Getting Started & Spatial Controls Orientation Trigger */}
            <button
              onClick={() => setIsLabGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>XR Tools & Controls Guide</span>
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
              Lab Theory Help
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
                onOpenScienceTwin={() => setIsScienceTwinOpen(true)}
                onOpenSketchToSim={() => setIsSketchToSimOpen(true)}
                onOpenStudyKit={() => setIsStudyKitOpen(true)}
              />
            )}
            {activeLab === 'astrophysics' && (
              <AstrophysicsLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
                onOpenScienceTwin={() => setIsScienceTwinOpen(true)}
                onOpenSketchToSim={() => setIsSketchToSimOpen(true)}
                onOpenStudyKit={() => setIsStudyKitOpen(true)}
                onOpenPlanetaryRecon={() => setIsPlanetaryReconOpen(true)}
              />
            )}
            {activeLab === 'biology' && (
              <CellularBiologyLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
                onOpenScienceTwin={() => setIsScienceTwinOpen(true)}
                onOpenSketchToSim={() => setIsSketchToSimOpen(true)}
                onOpenStudyKit={() => setIsStudyKitOpen(true)}
              />
            )}
            {activeLab === 'optics' && (
              <OpticsLab
                onSaveSnapshot={handleSaveSnapshot}
                onRequestAITutor={handleOpenTutorWithPrompt}
                onOpenScienceTwin={() => setIsScienceTwinOpen(true)}
                onOpenSketchToSim={() => setIsSketchToSimOpen(true)}
                onOpenStudyKit={() => setIsStudyKitOpen(true)}
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
            onSaveToNotebook={handleAddObservation}
            currentTier={currentTier}
          />
        )}

        {viewMode === 'physics' && (
          <PhysicsPlayground
            studentStats={studentStats}
            onAwardXP={handleAwardXP}
            onBackToCampus={handleBackToCampus}
          />
        )}

        {viewMode === 'sports' && (
          <VRSportsArena
            studentStats={studentStats}
            onAwardXP={handleAwardXP}
            onBackToCampus={handleBackToCampus}
          />
        )}

        {viewMode === 'dashboard' && (
          <StudentDashboard
            studentStats={studentStats}
            snapshots={snapshots}
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
            onAwardCosmeticBadge={(badge) => {
              checkAndAwardBadge(badge.name, badge.perkDescription);
            }}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenWorkbenchCustomizer={() => setIsWorkbenchCustomizerOpen(true)}
          />
        )}

        {viewMode === 'visitors' && (
          <div className="w-full h-full overflow-y-auto">
            <VisitorsPortal
              currentStudentName={studentStats.name}
              onAdmissionSuccess={(admission) => {
                setStudentStats((prev) => ({
                  ...prev,
                  name: admission.student.preferredName || admission.student.fullName,
                  xp: prev.xp + (admission.initialXPAwarded || 100),
                  badges: prev.badges.includes('Official Scholar Admitted')
                    ? prev.badges
                    : [...prev.badges, 'Official Scholar Admitted']
                }));
              }}
              onNavigateToFloor={(floor) => {
                setCurrentFloor(floor);
                setViewMode('campus');
              }}
              onNavigateToLab={(labId) => {
                setActiveLab(labId);
                setViewMode('labs');
              }}
              onNavigateToCampus={() => setViewMode('campus')}
            />
          </div>
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
          onAwardXP={handleAwardXP}
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
        activeLab={activeLab}
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

      {/* XR Science Twin Target Calibration Modal */}
      <ScienceTwinModal
        isOpen={isScienceTwinOpen}
        onClose={() => setIsScienceTwinOpen(false)}
        activeLabId={activeLab}
        onAwardXP={(amt, reason) => handleAwardXP(amt, reason)}
        onSaveToNotebook={handleAddObservation}
      />

      {/* Earth & Planetary Biome Reconnaissance Modal */}
      <PlanetaryReconModal
        isOpen={isPlanetaryReconOpen}
        onClose={() => setIsPlanetaryReconOpen(false)}
        onAwardXP={(amt, reason) => handleAwardXP(amt, reason)}
        onSaveToNotebook={handleAddObservation}
      />

      {/* Smart Sketch-to-Simulation Modal */}
      <SmartSketchToSimModal
        isOpen={isSketchToSimOpen}
        onClose={() => setIsSketchToSimOpen(false)}
        activeLabId={activeLab}
        onAwardXP={(amt, reason) => handleAwardXP(amt, reason)}
        onSaveToNotebook={handleAddObservation}
      />

      {/* Differentiated Lab Study Kit Modal */}
      <LabStudyKitModal
        isOpen={isStudyKitOpen}
        onClose={() => setIsStudyKitOpen(false)}
        labId={activeLab}
        currentTier={currentTier}
        onSelectTier={setCurrentTier}
        onSaveToNotebook={handleAddObservation}
      />

      {/* Mandatory Virtual XR Lab Safety & Protocol Mini-Quiz Modal */}
      <LabSafetyProtocolModal
        isOpen={isLabSafetyOpen}
        onClose={() => setIsLabSafetyOpen(false)}
        onPassQuiz={handlePassSafetyQuiz}
        initialCompleted={Boolean(localStorage.getItem('kev_lab_safety_passed'))}
      />

      {/* Virtual Lab Equipment Shop Modal */}
      {isShopOpen && (
        <EquipmentShopModal
          currentXP={studentStats.xp}
          unlockedEquipmentIds={unlockedEquipmentIds}
          equippedToolId={equippedToolId}
          onPurchaseEquipment={handlePurchaseEquipment}
          onEquipTool={handleEquipTool}
          onClose={() => setIsShopOpen(false)}
          onDeductXP={handleDeductXP}
        />
      )}

      {/* Lab Workbench Customizer & Efficiency Hardware Modal */}
      <LabWorkbenchCustomizerModal
        isOpen={isWorkbenchCustomizerOpen}
        onClose={() => setIsWorkbenchCustomizerOpen(false)}
        currentXP={studentStats.xp}
        onDeductXP={handleDeductXP}
        onAwardXP={handleAwardXP}
        onStateChange={(newState) => setWorkbenchState(newState)}
      />
    </div>
  );
}
