import React, { useState } from 'react';
import { StudentStats, SubjectGrade, AcademicPromotion } from '../../types';
import { Award, BookOpen, CheckCircle2, ChevronRight, GraduationCap, Sparkles, TrendingUp, UserCheck, ShieldCheck, Flame, ExternalLink, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../toast/ToastContext';

interface Props {
  studentStats: StudentStats;
  onClaimPromotionXP?: (xp: number, newRank: string) => void;
  onNavigateToRemedial?: (subject: string) => void;
}

const DEFAULT_SUBJECT_GRADES: SubjectGrade[] = [
  {
    subject: 'Molecular Chemistry & VSEPR',
    subjectId: 'chemistry',
    letterGrade: 'A',
    percentage: 94,
    practicalScore: 96,
    theoryScore: 92,
    quizScore: 95,
    trend: 'up',
    teacherComment: 'Superb 3D spatial mapping of electron geometry. Ready for advanced organic structures!',
  },
  {
    subject: 'Astrophysics & Orbital Mechanics',
    subjectId: 'astrophysics',
    letterGrade: 'B+',
    percentage: 88,
    practicalScore: 90,
    theoryScore: 84,
    quizScore: 89,
    trend: 'up',
    teacherComment: 'Strong velocity vector simulations. Try the remedial orbital solver to master T² = a³.',
  },
  {
    subject: 'Cellular Biology & Genetics',
    subjectId: 'biology',
    letterGrade: 'A-',
    percentage: 91,
    practicalScore: 94,
    theoryScore: 90,
    quizScore: 88,
    trend: 'stable',
    teacherComment: 'Thorough organelle ATP analysis. Excellent attention to ribosome-mRNA translation.',
  },
  {
    subject: 'Wave Optics & Refraction',
    subjectId: 'optics',
    letterGrade: 'A+',
    percentage: 97,
    practicalScore: 98,
    theoryScore: 96,
    quizScore: 98,
    trend: 'up',
    teacherComment: 'Flawless empirical verification of Snell’s Law and total internal reflection angles!',
  },
  {
    subject: 'Scientific Method & Lab Rigor',
    subjectId: 'methodology',
    letterGrade: 'A',
    percentage: 95,
    practicalScore: 94,
    theoryScore: 95,
    quizScore: 96,
    trend: 'up',
    teacherComment: 'Observations in the Student Lab Notebook are methodical, detailed, and hypothesis-driven.',
  },
];

const PROMOTION_RANKS: AcademicPromotion[] = [
  {
    rankId: 'cadet',
    rankTitle: 'Cadet Scientist',
    levelRequired: 1,
    xpRequired: 0,
    labsRequired: 0,
    perk: 'Access to Basic Virtual Lab Sandboxes & Professor KEV Socratic Tutor',
    isCurrent: false,
    isUnlocked: true,
  },
  {
    rankId: 'apprentice',
    rankTitle: 'Lab Apprentice',
    levelRequired: 3,
    xpRequired: 250,
    labsRequired: 2,
    perk: 'AR Pass-Through Camera Overlay & Real-time Campus Study Chat',
    isCurrent: false,
    isUnlocked: true,
  },
  {
    rankId: 'junior_researcher',
    rankTitle: 'Junior Researcher',
    levelRequired: 5,
    xpRequired: 450,
    labsRequired: 3,
    perk: 'Custom Hologram Visors, Stereoscopic VR headset mode & PDF Notebook export',
    isCurrent: true,
    isUnlocked: true,
  },
  {
    rankId: 'senior_experimenter',
    rankTitle: 'Senior Experimenter',
    levelRequired: 7,
    xpRequired: 700,
    labsRequired: 4,
    badgeRequired: 'Optics Virtuoso',
    perk: 'Cleanroom Cleanliness Certification, Research Fellow access badge, +25% XP multiplier',
    isCurrent: false,
    isUnlocked: false,
  },
  {
    rankId: 'principal_investigator',
    rankTitle: 'Principal Investigator',
    levelRequired: 9,
    xpRequired: 1000,
    labsRequired: 4,
    badgeRequired: 'Master Scholar',
    perk: 'Observatory Telescope Scheduling, Peer Research Mentorship privileges',
    isCurrent: false,
    isUnlocked: false,
  },
  {
    rankId: 'academy_fellow',
    rankTitle: 'KEV Academy Fellow',
    levelRequired: 12,
    xpRequired: 1500,
    labsRequired: 4,
    badgeRequired: 'Concentration',
    perk: 'Highest School Academic Distinction, Golden Avatar Glow & Permanent Honor Roll Plaque',
    isCurrent: false,
    isUnlocked: false,
  },
];

export const AcademicGradebook: React.FC<Props> = ({
  studentStats,
  onClaimPromotionXP,
  onNavigateToRemedial,
}) => {
  const { showToast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<SubjectGrade>(DEFAULT_SUBJECT_GRADES[0]);
  const [showPromotionModal, setShowPromotionModal] = useState<boolean>(false);

  const userLevel = Math.floor(studentStats.xp / 100) + 1;
  const averageGrade = Math.round(
    DEFAULT_SUBJECT_GRADES.reduce((acc, s) => acc + s.percentage, 0) / DEFAULT_SUBJECT_GRADES.length
  );
  const gpa = (3.5 + (averageGrade - 85) * 0.035).toFixed(2);

  // Check if student qualifies for promotion to Senior Experimenter
  const canPromoteToSenior = studentStats.xp >= 700 && studentStats.completedLabsCount >= 3;

  const handleClaimPromotion = (rank: AcademicPromotion) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    if (onClaimPromotionXP) {
      onClaimPromotionXP(150, rank.rankTitle);
    }
    showToast({
      type: 'badge',
      title: `Promoted to ${rank.rankTitle}!`,
      message: `Congratulations! Your academic promotion confers ${rank.perk}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Academic Standing Summary Banner */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-bold text-2xl text-slate-950 shadow-lg shadow-amber-500/20 border-2 border-amber-300">
            <GraduationCap className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-white tracking-tight">Academic Gradebook & Honors Standing</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                HONOR ROLL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Official evaluation metrics for <strong>{studentStats.name}</strong> • {studentStats.grade}
            </p>
          </div>
        </div>

        {/* Academic Stat Metrics */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Cumulative GPA</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{gpa}</span>
            <span className="text-[10px] text-emerald-400 font-mono block">/ 4.0 Scale</span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Weighted Average</span>
            <span className="text-xl font-bold text-cyan-400 font-mono">{averageGrade}%</span>
            <span className="text-[10px] text-cyan-300 font-mono block">Grade A</span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Academic Rank</span>
            <span className="text-sm font-bold text-purple-300 font-mono block mt-1">
              Junior Researcher
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Rank III of VI</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Breakdown on Left, Promotions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Mastery List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Subject Performance & Evaluation Rubrics</span>
            </h4>
            <span className="text-xs text-slate-400">
              Evaluated across Practicals (40%), Theory (30%), Tests (20%), Notebook (10%)
            </span>
          </div>

          <div className="space-y-3">
            {DEFAULT_SUBJECT_GRADES.map((sub) => (
              <div
                key={sub.subjectId}
                onClick={() => setSelectedSubject(sub)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedSubject.subjectId === sub.subjectId
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{sub.subject}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold">
                        {sub.letterGrade} ({sub.percentage}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 italic">
                      "{sub.teacherComment}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Practical</span>
                      <span className="text-emerald-400 font-bold">{sub.practicalScore}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Theory</span>
                      <span className="text-blue-400 font-bold">{sub.theoryScore}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Quiz</span>
                      <span className="text-purple-400 font-bold">{sub.quizScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Feedback / Action Prompt */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Looking to raise your score in Astrophysics or Molecular Chemistry?</span>
            </div>
            {onNavigateToRemedial && (
              <button
                onClick={() => onNavigateToRemedial('astrophysics')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <span>Launch Practice Drills</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Academic Promotions Ladder (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Academic Promotion Ladder</span>
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">LVL {userLevel}</span>
          </div>

          <div className="space-y-3">
            {PROMOTION_RANKS.map((rank) => {
              const isCurrent = rank.rankId === 'junior_researcher';
              const isUnlocked = rank.isUnlocked;
              return (
                <div
                  key={rank.rankId}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : isUnlocked
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-cyan-400 animate-pulse' : isUnlocked ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <h5 className="text-xs font-bold text-white tracking-tight">{rank.rankTitle}</h5>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        CURRENT RANK
                      </span>
                    )}
                    {!isCurrent && isUnlocked && (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Achieved
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {rank.perk}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Req: {rank.xpRequired} XP • {rank.labsRequired} Labs</span>
                    {rank.badgeRequired && (
                      <span className="text-amber-400">Badge: {rank.badgeRequired}</span>
                    )}
                  </div>

                  {rank.rankId === 'senior_experimenter' && canPromoteToSenior && (
                    <button
                      onClick={() => handleClaimPromotion(rank)}
                      className="mt-2.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim Promotion (+150 XP)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
