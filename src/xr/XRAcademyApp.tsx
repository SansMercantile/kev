import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  LabId,
  ViewMode,
  LabSnapshot,
  StudentStats,
  Lesson,
  CampusFacility,
  AvatarConfig,
  LabEquipment,
  CampusFloorNumber,
} from './types';

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
  Atom,
  Dumbbell,
  Ticket,
  Target,
  Globe2,
  Activity,
  PenTool,
  Footprints,
} from 'lucide-react';
import { getTierId, setTierId, SCIENCE_TIERS } from './lib/studyTier';

// Eager on purpose: the shell — header, connectivity indicator, announcements
// ticker, campus chat sidebar and focus timer — is on screen from the first
// paint, so none of it may wait on a lazily-fetched chunk.
import { CampusChatSidebar } from './components/chat/CampusChatSidebar';
import { LabGettingStartedOverlay } from './components/labs/LabGettingStartedOverlay';
import { ConnectivityIndicator } from './components/header/ConnectivityIndicator';
import { CampusAnnouncementsTicker } from './components/header/CampusAnnouncementsTicker';
import { FocusTimer } from './components/labs/FocusTimer';
import { useToast } from './components/toast/ToastContext';
import { getStudyLevelId, setStudyLevelId, STUDY_LEVEL_OPTIONS } from './lib/studyLevel';
import { getCurrentSubjectId, setCurrentSubjectId } from './lib/currentSubject';
// ---------------------------------------------------------------------------
// Code splitting
// ---------------------------------------------------------------------------
// Everything below used to be imported eagerly, so the first paint pulled the
// whole school at once — every view, all four laboratories and all fourteen
// modals, ~1.8 MB (510 KB gzipped) — for a student who can only ever be in one
// place at a time. Each is now its own chunk, fetched when it is opened.
//
// The shell stays eager: header, connectivity indicator, announcements ticker,
// campus chat sidebar and the focus timer, so nothing a student sees on arrival
// waits on a network round trip.
//
// Every XR component is a *named* export and `lazy` wants a default one, hence
// the `.then` reshaping. Prop types survive by inference.

// --- Laboratories (only the active one is ever mounted) ---
const ChemistryLab = lazy(() =>
  import('./components/labs/ChemistryLab').then((m) => ({ default: m.ChemistryLab })));
const AstrophysicsLab = lazy(() =>
  import('./components/labs/AstrophysicsLab').then((m) => ({ default: m.AstrophysicsLab })));
const CellularBiologyLab = lazy(() =>
  import('./components/labs/CellularBiologyLab').then((m) => ({ default: m.CellularBiologyLab })));
const OpticsLab = lazy(() =>
  import('./components/labs/OpticsLab').then((m) => ({ default: m.OpticsLab })));

// --- Science programmes (Twin Challenge, Biome Recon, sketch bench,
//     adaptive briefs) - each fetched only when its view/panel is opened ---
const TwinChallengeView = lazy(() => import('./components/programs/TwinChallengeView'));
const BiomeReconView = lazy(() => import('./components/programs/BiomeReconView'));
const PulseLabView = lazy(() => import('./components/programs/PulseLabView'));
const SketchBench = lazy(() => import('./components/programs/SketchBench'));
const StudyKitModal = lazy(() => import('./components/programs/StudyKitModal'));
const PaperSummarizer = lazy(() => import('./components/programs/PaperSummarizer'));
const LabGuideOverlay = lazy(() => import('./components/programs/LabGuideOverlay'));

// --- Views (one at a time) ---
const VirtualCampus = lazy(() =>
  import('./components/campus/VirtualCampus').then((m) => ({ default: m.VirtualCampus })));
const XRClassroom = lazy(() =>
  import('./components/classroom/XRClassroom').then((m) => ({ default: m.XRClassroom })));
const CourseViewer = lazy(() =>
  import('./components/curriculum/CourseViewer').then((m) => ({ default: m.CourseViewer })));
const StudentDashboard = lazy(() =>
  import('./components/dashboard/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
// Consolidation: `ViewMode` has always declared nine modes, but only five were
// ever rendered here — the Physics Playground, the VR Sports Arena and the
// Visitors & Admissions Portal were ported from kev-Demo yet never mounted, so
// three whole areas of the school were unreachable from the UI.
const PhysicsPlayground = lazy(() =>
  import('./components/campus/PhysicsPlayground').then((m) => ({ default: m.PhysicsPlayground })));
const VRSportsArena = lazy(() =>
  import('./components/sports/VRSportsArena').then((m) => ({ default: m.VRSportsArena })));
const VisitorsPortal = lazy(() =>
  import('./components/visitors/VisitorsPortal').then((m) => ({ default: m.VisitorsPortal })));

// --- Overlays and modals (mounted only once opened) ---
const VirtualCampusMapModal = lazy(() =>
  import('./components/campus/VirtualCampusMapModal').then((m) => ({ default: m.VirtualCampusMapModal })));
const ARPassThroughModal = lazy(() =>
  import('./components/ar/ARPassThroughModal').then((m) => ({ default: m.ARPassThroughModal })));
const XRStereoscopicModal = lazy(() =>
  import('./components/ar/XRStereoscopicModal').then((m) => ({ default: m.XRStereoscopicModal })));
const AILabTutorModal = lazy(() =>
  import('./components/ai/AILabTutorModal').then((m) => ({ default: m.AILabTutorModal })));
const LabNotebookModal = lazy(() =>
  import('./components/notes/LabNotebookModal').then((m) => ({ default: m.LabNotebookModal })));
const QuizModal = lazy(() =>
  import('./components/curriculum/QuizModal').then((m) => ({ default: m.QuizModal })));
const TheoryPracticalBridge = lazy(() =>
  import('./components/labs/TheoryPracticalBridge').then((m) => ({ default: m.TheoryPracticalBridge })));
const GlobalPeerComparisonModal = lazy(() =>
  import('./components/dashboard/GlobalPeerComparisonModal').then((m) => ({ default: m.GlobalPeerComparisonModal })));
const BadgeUnlockModal = lazy(() =>
  import('./components/badges/BadgeUnlockModal').then((m) => ({ default: m.BadgeUnlockModal })));
// Consolidation: these were ported from kev-Demo but never mounted, so the
// surfaces they drive were invisible — the dashboard's own Equipment Shop and
// Peer Mentors buttons render *only* when a handler is supplied, and the
// notebook had no glossary tab.
const LabQuickStartModal = lazy(() =>
  import('./components/labs/LabQuickStartModal').then((m) => ({ default: m.LabQuickStartModal })));
const StudyGoalsModule = lazy(() =>
  import('./components/dashboard/StudyGoalsModule').then((m) => ({ default: m.StudyGoalsModule })));
const EquipmentShopModal = lazy(() =>
  import('./components/shop/EquipmentShopModal').then((m) => ({ default: m.EquipmentShopModal })));
const PeerMentorMatchingModal = lazy(() =>
  import('./components/campus/PeerMentorMatchingModal').then((m) => ({ default: m.PeerMentorMatchingModal })));

/**
 * Mount a lazily-loaded panel the first time it is opened, then keep it mounted.
 * The lab notebook holds its hypothesis log and draft notes in component state,
 * so unmounting on close would silently discard them; mounting on first open is
 * also what keeps the panel's chunk out of the initial bundle.
 */
function useMountOnFirstOpen(isOpen: boolean): boolean {
  const [mounted, setMounted] = useState<boolean>(isOpen);
  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);
  return mounted;
}

/** Spinner shown while a view chunk streams in. */
const ViewLoader: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
      <div className="absolute inset-3 rounded-full bg-cyan-500/10 animate-pulse" />
    </div>
    <p className="text-[10px] font-mono text-cyan-300/70 tracking-[0.2em] uppercase">{label}</p>
  </div>
);

/** Full-screen spinner for a modal that is opening. */
const OverlayLoader: React.FC = () => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <ViewLoader label="Loading" />
  </div>
);

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
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('campus');
  // The active lab opens on the student's current class (the shared school
  // signal the Immersive Lab / auditorium write), so the building is coherent.
  const [activeLab, setActiveLabState] = useState<LabId>(() => {
    // Map the shared class onto one of the four physical labs. Immersive-bench
    // subjects land on the lab that matches their science: plants->biology,
    // engineering->optics, vehicle->chemistry (energy/thermodynamics),
    // earth->astrophysics.
    const s = getCurrentSubjectId();
    const SUBJECT_TO_LAB: Record<string, LabId> = {
      chemistry: 'chemistry',
      astrophysics: 'astrophysics',
      biology: 'biology',
      optics: 'optics',
      plants: 'biology',
      engineering: 'optics',
      vehicle: 'chemistry',
      earth: 'astrophysics',
    };
    return SUBJECT_TO_LAB[s] ?? 'chemistry';
  });
  // Science programmes: adaptive teaching tier, sketch-to-simulation bench,
  // step-by-step lab guide and the one-click study kit.
  const [scienceTier, setScienceTier] = useState<string>(() => getTierId());
  const [isSketchBenchOpen, setIsSketchBenchOpen] = useState(false);
  const [isStepGuideOpen, setIsStepGuideOpen] = useState(false);
  const [isStudyKitOpen, setIsStudyKitOpen] = useState(false);
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
  // 0 = Grand Concourse Hallway (the circulation spine), 1-4 legacy XR wings,
  // 5-10 the subject wings. Spawn in the hallway so the whole school is legible
  // from the first frame.
  const [currentFloor, setCurrentFloor] = useState<CampusFloorNumber>(0);
  const [unlockedBadgeAnimation, setUnlockedBadgeAnimation] = useState<{ name: string; description: string } | null>(null);
  const [isTheoryBridgeOpen, setIsTheoryBridgeOpen] = useState<boolean>(false);
  const [isLabQuickStartOpen, setIsLabQuickStartOpen] = useState<boolean>(false);
  const [isEquipmentShopOpen, setIsEquipmentShopOpen] = useState<boolean>(false);
  const [isPeerMentorOpen, setIsPeerMentorOpen] = useState<boolean>(false);
  // Which discipline the virtual library shelf opens on ('all' = unfiltered).
  const [librarySubject, setLibrarySubject] = useState<'all' | LabId>('all');

  // These three overlays render unconditionally (they gate on an `isOpen` prop),
  // which would pull their chunks into the first paint. Latching them means the
  // chunk is fetched the first time the student opens the panel, and the panel
  // stays mounted afterwards so its working state survives being closed.
  const notebookMounted = useMountOnFirstOpen(isNotebookOpen);
  const quickStartMounted = useMountOnFirstOpen(isLabQuickStartOpen);
  const aiTutorMounted = useMountOnFirstOpen(isAITutorOpen);

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

  // Twin Challenge XP feeds the same campus economy as lab work: banked XP
  // lands on studentStats and can trip the usual badge checks.
  const handleProgramXpGained = (xpGained: number) => {
    if (xpGained <= 0) return;
    setStudentStats((prev) => ({ ...prev, xp: prev.xp + xpGained }));
    checkAndAwardBadge(
      'Twin Calibrator',
      'Submitted a calibrated science twin in the XR Twin Challenge daily calibration!'
    );
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

  /**
   * Adapter between the labs and the notebook.
   *
   * Each lab emits a raw capture — `(dataUrl, measurements)` — while the notebook
   * stores a full `LabSnapshot`. The app previously passed this handler under the
   * name `onSaveSnapshot`, which no lab declares, so every lab's
   * `if (!onCaptureSnapshot) return;` guard tripped and capturing a snapshot did
   * nothing at all (no image, no XP, no badge). Wiring the real prop name
   * restores the feature.
   */
  const handleLabCaptureSnapshot = (
    dataUrl: string,
    measurements: Record<string, string | number>
  ) => {
    const labNames: Record<LabId, string> = {
      chemistry: 'Molecular Chemistry',
      astrophysics: 'Kepler Astrophysics',
      biology: 'Cellular Biology',
      optics: 'Wave Optics',
    };
    const snapshot: LabSnapshot = {
      id: `lab-${activeLab}-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      labId: activeLab,
      labName: labNames[activeLab] ?? `${activeLab.toUpperCase()} Lab`,
      imageDataUrl: dataUrl,
      note: `Captured from the ${labNames[activeLab] ?? activeLab} 3D simulation`,
      measurements,
    };
    handleSaveSnapshot(snapshot);
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

  /**
   * Award XP from the Physics Playground and the VR Sports Arena.
   * Both views were unreachable before, so neither had a handler to call.
   */
  const handleAwardXP = (xp: number, reason: string) => {
    setStudentStats((prev) => ({ ...prev, xp: prev.xp + xp }));
    showXPToast(xp, reason);
  };

  const handleBackToCampus = () => {
    setViewMode('campus');
  };

  /**
   * Switch the active laboratory and keep the school's shared class signal in
   * step: a student who walks into the optics lab is, for the rest of the
   * building (auditorium deck, Immersive Lab, tutors), now studying optics.
   */
  const setActiveLab = (labId: LabId) => {
    setActiveLabState(labId);
    setCurrentSubjectId(labId);
  };

  /**
   * Buy a piece of lab equipment. `EquipmentShopModal` has already verified the
   * student can afford it, so this only records the unlock and charges the XP —
   * and refuses to charge twice if the tool is somehow already owned.
   */
  const handlePurchaseEquipment = (tool: LabEquipment) => {
    setStudentStats((prev) => {
      const owned = prev.unlockedEquipmentIds ?? [];
      if (owned.includes(tool.id)) return prev;
      return {
        ...prev,
        xp: Math.max(0, prev.xp - (tool.costXP || 0)),
        unlockedEquipmentIds: [...owned, tool.id],
        // Buying a tool puts it in hand immediately; it can be swapped later.
        equippedToolId: tool.id,
      };
    });
  };

  const handleEquipTool = (toolId: string) => {
    setStudentStats((prev) => ({ ...prev, equippedToolId: toolId }));
  };

  /**
   * Charge XP for a cosmetic tool skin. The shop resolves an optional `xpPrice`
   * to a concrete number before calling this, but guard anyway: an undefined or
   * NaN amount must never poison the student's XP total.
   */
  const handleDeductXP = (amount: number) => {
    const cost = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    if (!cost) return;
    setStudentStats((prev) => ({ ...prev, xp: Math.max(0, prev.xp - cost) }));
  };

  /** Award a badge and play the unlock fanfare, as the quiz flow does. */
  const handleAwardBadge = (badgeName: string, reason: string) => {
    setStudentStats((prev) =>
      prev.badges.includes(badgeName)
        ? prev
        : { ...prev, badges: [...prev.badges, badgeName] }
    );
    setUnlockedBadgeAnimation({ name: badgeName, description: reason });
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
                11-Floor Virtual Campus, 3D Science Labs & Socratic Tutors
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
            onClick={() => {
              // Jump straight to the virtual library shelf, filtered to the
              // active class's textbooks — one click from anywhere.
              setLibrarySubject(activeLab);
              setViewMode('curriculum');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'curriculum'
                ? 'bg-amber-600 text-white font-semibold shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title={t('xr.libraryHint', 'Open the virtual library — classic textbooks & seminal papers for your class')}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            {t('xr.library')}
          </button>
          <button
            onClick={() => setViewMode('challenge')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'challenge'
                ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="XR Science Twin Challenge - daily lab calibration for XP"
          >
            <Target className="w-3.5 h-3.5 text-cyan-300" />
            Twin Challenge
          </button>
          <button
            onClick={() => setViewMode('biome')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'biome'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Earth & Planetary Biome Reconnaissance - planetarium field station"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-300" />
            Biome Recon
          </button>
          <button
            onClick={() => setViewMode('pulse')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'pulse'
                ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Pulse Lab - PPG waveform simulator: sensor sites, LED wavelengths and the physiology of the pulse"
          >
            <Activity className="w-3.5 h-3.5 text-rose-300" />
            Pulse Lab
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
          <button
            onClick={() => setViewMode('physics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'physics'
                ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Projectile motion, gravity presets and orbital mechanics sandbox"
          >
            <Atom className="w-3.5 h-3.5 text-violet-300" />
            Physics
          </button>
          <button
            onClick={() => setViewMode('sports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'sports'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="VR Sports Arena — swimming sprints, basketball shootouts, racquetball"
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-300" />
            Sports
          </button>
          <button
            onClick={() => setViewMode('visitors')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === 'visitors'
                ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Visitors & Admissions — digital admission card and campus tour"
          >
            <Ticket className="w-3.5 h-3.5 text-rose-300" />
            Visitors
          </button>
        </nav>

        {/* Right Tools & Student Profile */}
        <div className="flex items-center gap-2">
          {/* Backend reachability + offline note queue status */}
          <div className="hidden lg:block">
            <ConnectivityIndicator />
          </div>

          {/* Virtual Campus 2D Map Button */}
          <button
            onClick={() => setIsCampusMapOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open the 11-floor school map & teleport"
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

      {/* Campus announcements feed — tournaments, maintenance and events */}
      <div className="hidden md:block shrink-0 z-20">
        <CampusAnnouncementsTicker
          onOpenTournaments={() => {
            setViewMode('dashboard');
            showToast({
              type: 'info',
              title: 'Global Tournaments',
              message: 'Live bracket and registration are on your dashboard.',
            });
          }}
        />
      </div>

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
            {t('xr.campus')} (0-10)
          </button>
          <button
            onClick={() => {
              setViewMode('physics');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'physics' ? 'bg-violet-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Atom className="w-4 h-4 text-violet-300" />
            Physics Playground
          </button>
          <button
            onClick={() => {
              setViewMode('sports');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'sports' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Dumbbell className="w-4 h-4 text-emerald-300" />
            VR Sports Arena
          </button>
          <button
            onClick={() => {
              setViewMode('visitors');
              setMobileMenuOpen(false);
            }}
            className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
              viewMode === 'visitors' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            <Ticket className="w-4 h-4 text-rose-300" />
            Visitors &amp; Admissions
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

            {/* Per-lab quick-start brief: apparatus, method and safety */}
            <button
              onClick={() => setIsLabQuickStartOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Open this lab's quick-start brief: apparatus, method and safety"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('xr.quickStart')}</span>
            </button>

            {/* Textbook bridge: read the classic text behind this bench */}
            <button
              onClick={() => {
                setLibrarySubject(activeLab);
                setViewMode('curriculum');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title={t('xr.textbookHint', 'Read the classic textbook & seminal papers behind this experiment')}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('xr.textbook')}</span>
            </button>

            {/* Lab Getting Started & Spatial Controls Orientation Trigger */}
            <button
              onClick={() => setIsLabGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('xr.controlsGuide')}</span>
            </button>

            {/* --- Science programmes toolbar -------------------------------
                Adaptive teaching tier: briefs, study kits, the Twin Challenge
                register and the AI tutors all follow this setting. */}
            <select
              value={scienceTier}
              onChange={(e) => {
                setScienceTier(e.target.value);
                setTierId(e.target.value);
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              title="Adaptive teaching tier - explanations, math formality and vocabulary follow this"
              aria-label="Science teaching tier"
            >
              {SCIENCE_TIERS.map((tier) => (
                <option key={tier.id} value={tier.id}>{tier.label}</option>
              ))}
            </select>

            {/* One-click study kit for the active lab (leveled summary,
                flashcards, printable quiz) */}
            <button
              onClick={() => setIsStudyKitOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Build this lab's study kit: leveled summary, flashcards, printable quiz"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Study Kit</span>
            </button>

            {/* Step-by-step lab guide: highlights bench controls in sequence */}
            <button
              onClick={() => setIsStepGuideOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all border ${
                isStepGuideOpen
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40'
              }`}
              title="Step-by-step guide: I highlight each bench control in turn and explain it"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Lab Guide</span>
            </button>

            {/* Sketch-to-simulation doodle pad */}
            <button
              onClick={() => setIsSketchBenchOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all border ${
                isSketchBenchOpen
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-violet-500/40'
              }`}
              title="Sketch a diagram - molecule, prism ray, orbit or cell - and I load it into the 3D bench"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Sketch</span>
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
        {/* One boundary for all views: only the active view's chunk is fetched,
            so the shell, header and chat sidebar paint without waiting on it. */}
        <Suspense fallback={<ViewLoader label="Loading view" />}>
          {viewMode === 'campus' && (
            <div className="w-full h-full relative">
              <VirtualCampus
                currentFloor={currentFloor}
                activeFloor={currentFloor}
                onFloorChange={setCurrentFloor}
                userAvatar={studentStats.avatar}
                userName={studentStats.name}
                onOpenMap={() => setIsCampusMapOpen(true)}
                onOpenChat={() => setIsCampusChatOpen(true)}
                onOpenVirtualSchool={(facilityId) => {
                  // The hallway portal and the floor-9 building both route here.
                  setTeleportTargetFacility(null);
                  setIsCampusMapOpen(true);
                  showToast({
                    type: 'info',
                    title: 'KEV International Virtual School',
                    message: facilityId
                      ? `Opening ${facilityId} — basement to roof, 14 bookable facilities.`
                      : 'Six levels, fourteen bookable facilities: gymnasium, library, cafeteria, laboratories, studios, auditorium and lecture hall.',
                  });
                }}
                onNavigateToLab={(labId) => {
                  setActiveLab(labId);
                  setViewMode('labs');
                }}
                onNavigateToClassroom={() => setViewMode('classroom')}
                onNavigateToLibrary={() => {
                  setLibrarySubject(activeLab);
                  setViewMode('curriculum');
                }}
                onNavigateToSports={() => setViewMode('sports')}
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
                  onCaptureSnapshot={handleLabCaptureSnapshot}
                  onRequestAITutor={handleOpenTutorWithPrompt}
                />
              )}
              {activeLab === 'astrophysics' && (
                <AstrophysicsLab
                  onCaptureSnapshot={handleLabCaptureSnapshot}
                  onRequestAITutor={handleOpenTutorWithPrompt}
                />
              )}
              {activeLab === 'biology' && (
                <CellularBiologyLab
                  onCaptureSnapshot={handleLabCaptureSnapshot}
                  onRequestAITutor={handleOpenTutorWithPrompt}
                />
              )}
              {activeLab === 'optics' && (
                <OpticsLab
                  onCaptureSnapshot={handleLabCaptureSnapshot}
                  onRequestAITutor={handleOpenTutorWithPrompt}
                />
              )}

              {/* Sketch-to-simulation bench: floats over the lab, dispatches
                  'kev:lab-load' which every lab listens for. */}
              {isSketchBenchOpen && (
                <SketchBench
                  activeLab={activeLab}
                  onClose={() => setIsSketchBenchOpen(false)}
                  onOpenLab={(labId, action) => {
                    if (labId === 'anatomy' || labId === 'vehicle') {
                      // The immersive benches live on the /anatomy page
                      // (ImmersiveLab). The 'kev:lab-load' window event fired
                      // before this navigation, so stash the action: the page
                      // consumes it on mount and applies subject/system/explode.
                      try {
                        sessionStorage.setItem(
                          'kev:immersive-lab-load',
                          JSON.stringify(action || { lab: labId }),
                        );
                      } catch {
                        /* private browsing: the bench still opens, just un-set */
                      }
                      navigate('/anatomy');
                      return;
                    }
                    const mapped = labId === 'astrophysics' ? 'astrophysics'
                      : labId === 'biology' ? 'biology'
                      : labId === 'optics' ? 'optics'
                      : 'chemistry';
                    setActiveLab(mapped as LabId);
                  }}
                />
              )}

              {/* Step-by-step lab guide overlay */}
              {isStepGuideOpen && (
                <LabGuideOverlay labId={activeLab} onClose={() => setIsStepGuideOpen(false)} />
              )}

              {/* One-click adaptive study kit */}
              {isStudyKitOpen && (
                <StudyKitModal
                  labId={activeLab}
                  tier={scienceTier}
                  onClose={() => setIsStudyKitOpen(false)}
                />
              )}
            </div>
          )}

          {viewMode === 'curriculum' && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              {/* AI Research Paper Summarizer: read the source science before
                  the lesson/lab it feeds. */}
              <div className="shrink-0 px-4 pt-3">
                <PaperSummarizer />
              </div>
              <CourseViewer
                key={librarySubject === 'all' ? 'modules' : `library-${librarySubject}`}
                initialSection={librarySubject === 'all' ? 'modules' : 'library'}
                initialLibrarySubject={librarySubject}
                onSelectLab={(labId) => {
                  setActiveLab(labId);
                  setViewMode('labs');
                }}
                onOpenQuiz={(lesson) => setQuizLesson(lesson)}
                onRequestAITutor={handleOpenTutorWithPrompt}
              />
            </div>
          )}

          {viewMode === 'challenge' && (
            <TwinChallengeView
              studentId={studentStats.id}
              onOpenLab={(labId) => {
                // P5 pulse twins open the dedicated Pulse Lab bench.
                if (labId === 'pulse') {
                  setViewMode('pulse');
                  return;
                }
                // Pack challenges can target the Physics Playground (vehicle /
                // math twins) as well as the four science benches.
                if (labId === 'physics') {
                  setViewMode('physics');
                  return;
                }
                const mapped = labId === 'astrophysics' ? 'astrophysics'
                  : labId === 'biology' ? 'biology'
                  : labId === 'optics' ? 'optics'
                  : 'chemistry';
                setActiveLab(mapped as LabId);
                setViewMode('labs');
              }}
              onXpGained={(xpGained) => handleProgramXpGained(xpGained)}
            />
          )}

          {viewMode === 'biome' && (
            <BiomeReconView
              onOpenLab={() => {
                setActiveLab('astrophysics');
                setViewMode('labs');
              }}
            />
          )}

          {viewMode === 'pulse' && (
            <PulseLabView
              onOpenProgram={(mode) => {
                if (mode === 'challenge') setViewMode('challenge');
              }}
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
              // Supplying these two makes the dashboard reveal its own Equipment
              // Shop and Peer Mentors buttons, which are gated on the handlers.
              onOpenShop={() => setIsEquipmentShopOpen(true)}
              onOpenPeerMentors={() => setIsPeerMentorOpen(true)}
              footerSections={
                <StudyGoalsModule
                  currentTotalXP={studentStats.xp}
                  onAwardXP={(xp) => handleAwardXP(xp, 'Study goal milestone reached')}
                  onNavigateToLab={(labId) => {
                    setActiveLab(labId);
                    setViewMode('labs');
                  }}
                  onNavigateToCurriculum={() => setViewMode('curriculum')}
                />
              }
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
                      : [...prev.badges, 'Official Scholar Admitted'],
                  }));
                }}
                onNavigateToFloor={(floor) => {
                  setCurrentFloor(floor as CampusFloorNumber);
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

        </Suspense>

        {/* Real-time Campus Study Chat Sidebar */}
        <CampusChatSidebar
          isOpen={isCampusChatOpen}
          onClose={() => setIsCampusChatOpen(false)}
          currentUser={{
            // The sidebar keys message ownership off `id` and always renders an
            // avatar chip, so both are required there; StudentStats marks them
            // optional. Fall back rather than passing undefined through.
            id: studentStats.id ?? studentStats.name ?? 'student-local',
            name: studentStats.name,
            avatar: studentStats.avatar ?? DEFAULT_AVATAR,
          }}
          currentRoomId={
            viewMode === 'campus'
              ? `floor-${currentFloor}`
              : viewMode === 'labs'
              ? `lab-${activeLab}`
              : 'classroom-main'
          }
          currentRoomName={
            viewMode === 'campus'
              ? currentFloor === 0
                ? 'Grand Concourse Hallway'
                : `Floor ${currentFloor} Commons`
              : viewMode === 'labs'
              ? `${activeLab.toUpperCase()} Lab`
              : 'XR Auditorium'
          }
        />
      </main>

      {/* Every overlay is lazy, so one boundary serves them all. Nothing here
          is mounted until opened, so the fallback only shows while a modal is
          actually arriving — never on a plain page load. */}
      <Suspense fallback={<OverlayLoader />}>
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

        {/* Per-lab Quick Start brief (apparatus, method, safety, first result) */}
        {quickStartMounted && (
          <LabQuickStartModal
            isOpen={isLabQuickStartOpen}
            labId={activeLab}
            onClose={() => setIsLabQuickStartOpen(false)}
          />
        )}

        {/* Virtual Equipment Shop — spends XP earned across the labs */}
        {isEquipmentShopOpen && (
          <EquipmentShopModal
            currentXP={studentStats.xp}
            unlockedEquipmentIds={studentStats.unlockedEquipmentIds ?? []}
            equippedToolId={studentStats.equippedToolId}
            onPurchaseEquipment={handlePurchaseEquipment}
            onEquipTool={handleEquipTool}
            onDeductXP={handleDeductXP}
            onClose={() => setIsEquipmentShopOpen(false)}
          />
        )}

        {/* Campus Peer Mentor matching — tutors and study requests */}
        {isPeerMentorOpen && (
          <PeerMentorMatchingModal
            studentStats={studentStats}
            currentFloor={currentFloor}
            onNavigateToLab={(labId) => {
              setActiveLab(labId);
              setViewMode('labs');
              setIsPeerMentorOpen(false);
            }}
            onOpenCampusChat={() => {
              setIsCampusChatOpen(true);
              setIsPeerMentorOpen(false);
            }}
            onAwardBadge={handleAwardBadge}
            onClose={() => setIsPeerMentorOpen(false)}
          />
        )}

        {/* Global Peer Comparison Modal */}
        {isGlobalComparisonOpen && (
          <GlobalPeerComparisonModal
            isOpen={isGlobalComparisonOpen}
            studentStats={studentStats}
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
        {aiTutorMounted && (
          <AILabTutorModal
            isOpen={isAITutorOpen}
            onClose={() => setIsAITutorOpen(false)}
            activeLab={activeLab}
            initialQuestion={aiTutorInitialPrompt}
          />
        )}

        {/* Student Lab Notebook Modal */}
        {notebookMounted && (
          <LabNotebookModal
            isOpen={isNotebookOpen}
            onClose={() => setIsNotebookOpen(false)}
            snapshots={snapshots}
            studentStats={studentStats}
            onDeleteSnapshot={handleDeleteSnapshot}
            onAddObservation={handleAddObservation}
          />
        )}

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
      </Suspense>
    </div>
  );
}
