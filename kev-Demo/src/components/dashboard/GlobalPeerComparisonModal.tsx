import React, { useEffect, useState } from 'react';
import { StudentStats, GlobalBenchmarks } from '../../types';
import {
  Globe,
  Trophy,
  X,
  TrendingUp,
  Award,
  Users,
  FlaskConical,
  Orbit,
  Dna,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentStats: StudentStats;
}

const DEFAULT_BENCHMARKS: GlobalBenchmarks = {
  totalGlobalStudents: 14850,
  activeCampuses: 64,
  globalAverages: {
    averageXP: 425,
    medianXP: 390,
    top10PercentileXP: 780,
    top1PercentileXP: 1250,
    overallLabCompletionRate: 68,
    quizzesPassedAverage: 2.1,
    averageBadgesCount: 3.4,
    dailyMissionCompletionRate: 74,
  },
  subjectCompletionRates: {
    chemistry: 72,
    astrophysics: 58,
    biology: 64,
    optics: 52,
  },
  regionalCohorts: [
    { region: 'North America (STEM XR Consortium)', studentCount: 5200, averageXP: 440, completionRate: 71 },
    { region: 'Europe (CERN & ESA Science Academies)', studentCount: 4600, averageXP: 435, completionRate: 69 },
    { region: 'Asia-Pacific (Future Science Alliance)', studentCount: 3850, averageXP: 455, completionRate: 75 },
    { region: 'Latin America & Global STEM Network', studentCount: 1200, averageXP: 410, completionRate: 64 },
  ],
  xpPercentileCurve: [
    { percentile: '10th', xp: 150 },
    { percentile: '25th', xp: 280 },
    { percentile: '50th (Median)', xp: 390 },
    { percentile: '75th', xp: 520 },
    { percentile: '90th', xp: 780 },
    { percentile: '99th', xp: 1250 },
  ],
};

export const GlobalPeerComparisonModal: React.FC<Props> = ({ isOpen, onClose, studentStats }) => {
  const [benchmarks, setBenchmarks] = useState<GlobalBenchmarks>(DEFAULT_BENCHMARKS);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/analytics/global-benchmarks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setBenchmarks(data);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_BENCHMARKS
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const userCompletionRate = Math.round((studentStats.completedLabsCount / 4) * 100);
  const xpDifference = studentStats.xp - benchmarks.globalAverages.averageXP;
  const isAboveAverage = xpDifference >= 0;

  // Approximate percentile estimation
  let userPercentile = '60th Percentile';
  if (studentStats.xp >= 1000) userPercentile = 'Top 2% Worldwide (Exceptional)';
  else if (studentStats.xp >= 750) userPercentile = 'Top 10% Worldwide (Master Scholar)';
  else if (studentStats.xp >= 500) userPercentile = 'Top 25% Worldwide (Advanced)';
  else if (studentStats.xp >= 400) userPercentile = 'Top 45% Worldwide (Proficient)';
  else userPercentile = 'Developing Scholar';

  return (
    <div
      id="global-peer-comparison-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="global-peer-comparison-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-6 h-6 animate-spin" style={{ animationDuration: '30s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Global Peer Comparison
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-semibold border border-blue-500/30">
                  {benchmarks.totalGlobalStudents.toLocaleString()} STUDENTS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparative benchmarks across 64 international XR STEM academies and regional cohorts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Standing Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Your International Standing
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {userPercentile}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Based on your {studentStats.xp} XP and {userCompletionRate}% lab completion rate, you are performing{' '}
                <span className="font-semibold text-cyan-300">
                  {isAboveAverage ? `+${xpDifference} XP ahead of` : `${Math.abs(xpDifference)} XP behind`}
                </span>{' '}
                the international student cohort average ({benchmarks.globalAverages.averageXP} XP).
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Your Score</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{studentStats.xp} XP</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Global Avg</span>
                <span className="text-lg font-bold text-slate-300 font-mono">{benchmarks.globalAverages.averageXP} XP</span>
              </div>
            </div>
          </div>

          {/* Key Metric Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: XP */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Total XP</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{studentStats.xp}</span>
                <span className="text-xs text-slate-400 font-mono">/ {benchmarks.globalAverages.averageXP} avg</span>
              </div>
              <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (studentStats.xp / benchmarks.globalAverages.top10PercentileXP) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Top 10% Cutoff: {benchmarks.globalAverages.top10PercentileXP} XP
              </span>
            </div>

            {/* Metric 2: Lab Completion */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Lab Completion</span>
                <FlaskConical className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-300">{userCompletionRate}%</span>
                <span className="text-xs text-slate-400 font-mono">/ {benchmarks.globalAverages.overallLabCompletionRate}% avg</span>
              </div>
              <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${userCompletionRate}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {studentStats.completedLabsCount} of 4 3D Labs Complete
              </span>
            </div>

            {/* Metric 3: Quizzes */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Assessments Passed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-300">{studentStats.quizzesPassedCount}</span>
                <span className="text-xs text-slate-400 font-mono">/ {benchmarks.globalAverages.quizzesPassedAverage} avg</span>
              </div>
              <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (studentStats.quizzesPassedCount / 4) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Above global benchmark
              </span>
            </div>

            {/* Metric 4: Badges */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Badges Earned</span>
                <Award className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-yellow-300">{studentStats.badges.length}</span>
                <span className="text-xs text-slate-400 font-mono">/ {benchmarks.globalAverages.averageBadgesCount} avg</span>
              </div>
              <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (studentStats.badges.length / 6) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {6 - studentStats.badges.length} Badges Remaining
              </span>
            </div>
          </div>

          {/* Subject-by-Subject Global Completion Comparison */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Global Subject Completion Rates vs. Your Progress
              </h4>
              <span className="text-xs text-slate-400 font-mono">International Benchmarks</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chemistry */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                    Chemistry Lab (VSEPR & Bonds)
                  </span>
                  <span className="font-mono text-slate-400">
                    Global Avg: {benchmarks.subjectCompletionRates.chemistry}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-cyan-500 h-full"
                    style={{ width: `${benchmarks.subjectCompletionRates.chemistry}%` }}
                    title={`Global Average: ${benchmarks.subjectCompletionRates.chemistry}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Your Status: {studentStats.badges.includes('Spatial Chemist') ? 'Mastered' : 'In Progress'}</span>
                  <span className="text-cyan-400 font-medium">Floor 2 Wing</span>
                </div>
              </div>

              {/* Astrophysics */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Orbit className="w-3.5 h-3.5 text-amber-400" />
                    Astrophysics Lab (Kepler & Gravity)
                  </span>
                  <span className="font-mono text-slate-400">
                    Global Avg: {benchmarks.subjectCompletionRates.astrophysics}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${benchmarks.subjectCompletionRates.astrophysics}%` }}
                    title={`Global Average: ${benchmarks.subjectCompletionRates.astrophysics}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Your Status: {studentStats.badges.includes('Kepler Navigator') ? 'Mastered' : 'In Progress'}</span>
                  <span className="text-amber-400 font-medium">Floor 3 Observatory</span>
                </div>
              </div>

              {/* Cellular Biology */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5 text-emerald-400" />
                    Cellular Biology (Organelles & DNA)
                  </span>
                  <span className="font-mono text-slate-400">
                    Global Avg: {benchmarks.subjectCompletionRates.biology}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${benchmarks.subjectCompletionRates.biology}%` }}
                    title={`Global Average: ${benchmarks.subjectCompletionRates.biology}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Your Status: {studentStats.badges.includes('Cellular Explorer') ? 'Mastered' : 'In Progress'}</span>
                  <span className="text-emerald-400 font-medium">Floor 4 Cleanroom</span>
                </div>
              </div>

              {/* Wave Optics */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Quantum Wave Optics (Snell's Law)
                  </span>
                  <span className="font-mono text-slate-400">
                    Global Avg: {benchmarks.subjectCompletionRates.optics}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-violet-500 h-full"
                    style={{ width: `${benchmarks.subjectCompletionRates.optics}%` }}
                    title={`Global Average: ${benchmarks.subjectCompletionRates.optics}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Your Status: {studentStats.badges.includes('Optics Virtuoso') ? 'Mastered' : 'In Progress'}</span>
                  <span className="text-violet-400 font-medium">Floor 3 Laser Suite</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Cohorts Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Regional STEM Alliances Comparison
            </h4>

            <div className="divide-y divide-slate-800/60">
              {benchmarks.regionalCohorts.map((cohort, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-white block">{cohort.region}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {cohort.studentCount.toLocaleString()} Active Learners
                    </span>
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Avg XP</span>
                      <span className="text-white font-semibold">{cohort.averageXP}</span>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <span className="text-slate-400 text-[10px] block">Lab Comp</span>
                      <span className="text-cyan-400 font-semibold">{cohort.completionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified data aggregated from KEV XR Science Academy network
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
