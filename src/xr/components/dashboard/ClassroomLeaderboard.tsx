import React, { useState } from 'react';
import { StudentStats } from '../../types';
import { Trophy, Medal, Flame, Award, Users, Search, ArrowUpRight, Heart, Sparkles, Filter, CheckCircle2, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PHOTOREALISTIC_ASSETS } from '../../assets/images';

interface Props {
  studentStats: StudentStats;
  onCheer?: (studentName: string) => void;
  onOpenGlobalComparison?: () => void;
}

interface PeerStudent {
  id: string;
  name: string;
  avatar: string;
  photoUrl?: string;
  cohort: string;
  xp: number;
  labCompletionRate: number; // 0 - 100 percentage
  completedLabsCount: number;
  badgesCount: number;
  specialty: string;
  status: 'In Chemistry Lab' | 'Reviewing DNA Helix' | 'Simulating Gravity' | 'Studying Optics' | 'Offline';
  isCurrentUser?: boolean;
}

const PEER_STUDENTS: PeerStudent[] = [
  {
    id: 'student-1',
    name: 'Maya Lin',
    avatar: 'ML',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['molecular-bio'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 620,
    labCompletionRate: 100,
    completedLabsCount: 4,
    badgesCount: 5,
    specialty: 'Quantum Chemistry & VSEPR',
    status: 'In Chemistry Lab',
  },
  {
    id: 'student-2',
    name: 'Devon Vance',
    avatar: 'DV',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['astro-pioneer'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 540,
    labCompletionRate: 100,
    completedLabsCount: 4,
    badgesCount: 4,
    specialty: 'Orbital Mechanics & Astrophysics',
    status: 'Simulating Gravity',
  },
  {
    id: 'student-3',
    name: 'Sofia Chen',
    avatar: 'SC',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['cellular-lead'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 410,
    labCompletionRate: 75,
    completedLabsCount: 3,
    badgesCount: 3,
    specialty: 'Cellular Biology & Genomics',
    status: 'Reviewing DNA Helix',
  },
  {
    id: 'student-4',
    name: 'Tariq Al-Mansoor',
    avatar: 'TA',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['quantum-physicist'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 380,
    labCompletionRate: 75,
    completedLabsCount: 3,
    badgesCount: 3,
    specialty: 'Wave Optics & Snell Dispersion',
    status: 'Studying Optics',
  },
  {
    id: 'student-5',
    name: 'Elena Rostova',
    avatar: 'ER',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['optics-specialist'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 320,
    labCompletionRate: 50,
    completedLabsCount: 2,
    badgesCount: 2,
    specialty: 'Molecular Dynamics',
    status: 'Offline',
  },
  {
    id: 'student-6',
    name: 'Marcus Thorne',
    avatar: 'MT',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['cyber-scholar'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 290,
    labCompletionRate: 50,
    completedLabsCount: 2,
    badgesCount: 2,
    specialty: 'Keplerian Orbits',
    status: 'Offline',
  },
  {
    id: 'student-7',
    name: 'Aisha Patel',
    avatar: 'AP',
    photoUrl: PHOTOREALISTIC_ASSETS.avatars['ai-fellow'],
    cohort: 'Grade 9 - Advanced STEM',
    xp: 240,
    labCompletionRate: 25,
    completedLabsCount: 1,
    badgesCount: 1,
    specialty: 'Microscopy & Organelles',
    status: 'Offline',
  },
];

export const ClassroomLeaderboard: React.FC<Props> = ({
  studentStats,
  onCheer,
  onOpenGlobalComparison,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'sprint'>('week');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [cheeredStudents, setCheeredStudents] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate user's lab completion rate based on completedLabsCount (out of 4 total labs)
  const userCompletionRate = Math.min(100, Math.round((studentStats.completedLabsCount / 4) * 100));

  // Current student object integrated seamlessly into peer pool
  const currentUser: PeerStudent = {
    id: 'current-user',
    name: `${studentStats.name} (You)`,
    avatar: studentStats.name.split(' ').map(n => n[0]).join('').slice(0, 2),
    photoUrl: studentStats.avatar?.photoUrl || PHOTOREALISTIC_ASSETS.avatars['cyber-scholar'],
    cohort: studentStats.grade,
    xp: studentStats.xp,
    labCompletionRate: userCompletionRate,
    completedLabsCount: studentStats.completedLabsCount,
    badgesCount: studentStats.badges.length,
    specialty: 'Cross-Disciplinary XR Science',
    status: 'In Chemistry Lab',
    isCurrentUser: true,
  };

  // Combine and sort all students by XP descending, breaking ties by completion rate
  const allStudents = [...PEER_STUDENTS, currentUser].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    return b.labCompletionRate - a.labCompletionRate;
  });

  // Calculate current user rank
  const currentUserRank = allStudents.findIndex((s) => s.isCurrentUser) + 1;

  // Filter list
  const filteredStudents = allStudents.filter((student) => {
    if (searchQuery.trim()) {
      const matchName = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpecialty = student.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchName && !matchSpecialty) return false;
    }
    if (selectedSubject !== 'all') {
      return student.specialty.toLowerCase().includes(selectedSubject.toLowerCase());
    }
    return true;
  });

  const handleCheerStudent = (student: PeerStudent) => {
    setCheeredStudents((prev) => ({
      ...prev,
      [student.id]: (prev[student.id] || 0) + 1,
    }));
    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#06b6d4', '#ec4899', '#f59e0b', '#10b981'],
      });
    } catch (e) {
      // Safe fail
    }
    if (onCheer) {
      onCheer(student.name);
    }
  };

  return (
    <div id="classroom-leaderboard" className="w-full flex flex-col gap-5">
      {/* Top Banner & Rank Highlight */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-cyan-500/10 to-indigo-500/20 border border-amber-500/30 text-amber-400">
            <Trophy className="w-7 h-7" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 font-mono">
              #{currentUserRank}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Classroom Science Leaderboard</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                COHORT 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Friendly scientific competition tracking XP & hands-on virtual lab completion rates.
            </p>
          </div>
        </div>

        {/* User Rank Card */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Your Standing</span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm font-bold text-amber-400 font-mono">Rank #{currentUserRank}</span>
              <span className="text-[11px] text-slate-500">of {allStudents.length}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Lab Completion</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{userCompletionRate}%</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Total XP</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">{studentStats.xp} XP</span>
          </div>
          {onOpenGlobalComparison && (
            <>
              <div className="h-8 w-px bg-slate-800" />
              <button
                onClick={onOpenGlobalComparison}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold cursor-pointer transition-all shadow-sm"
                title="Compare your XP & lab completion with international students"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Global Comparison</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Time Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterPeriod('week')}
            className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
              filterPeriod === 'week' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilterPeriod('sprint')}
            className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
              filterPeriod === 'sprint' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Current Sprint
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
              filterPeriod === 'all' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {['all', 'chemistry', 'astrophysics', 'biology', 'optics'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-2.5 py-1 rounded-lg capitalize font-mono text-[11px] transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800/80'
              }`}
            >
              {sub === 'all' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4 text-center">Lab Completion Rate</th>
              <th className="py-3 px-4 text-right">Scientific XP</th>
              <th className="py-3 px-4 text-center">Badges</th>
              <th className="py-3 px-4 text-center">Cohort Status</th>
              <th className="py-3 px-4 text-center w-24">Cheer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredStudents.map((student) => {
              const rank = allStudents.findIndex((s) => s.id === student.id) + 1;
              const isTopThree = rank <= 3;
              const cheerCount = cheeredStudents[student.id] || 0;

              return (
                <tr
                  key={student.id}
                  className={`transition-colors ${
                    student.isCurrentUser
                      ? 'bg-cyan-950/20 hover:bg-cyan-950/30 border-l-4 border-l-cyan-400'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Rank Column */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center">
                      {rank === 1 ? (
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono text-xs shadow-sm shadow-amber-500/20">
                          🥇
                        </div>
                      ) : rank === 2 ? (
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 font-bold font-mono text-xs">
                          🥈
                        </div>
                      ) : rank === 3 ? (
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 font-bold font-mono text-xs">
                          🥉
                        </div>
                      ) : (
                        <span className="font-mono text-slate-400 font-semibold text-xs">#{rank}</span>
                      )}
                    </div>
                  </td>

                  {/* Student Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          student.isCurrentUser
                            ? 'ring-2 ring-cyan-400/80 shadow-md shadow-cyan-500/20'
                            : isTopThree
                            ? 'border border-amber-500/40 shadow-sm'
                            : 'border border-slate-700'
                        }`}
                      >
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center ${
                              student.isCurrentUser
                                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white'
                                : isTopThree
                                ? 'bg-indigo-600/30 text-indigo-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {student.avatar}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${student.isCurrentUser ? 'text-cyan-300 font-bold' : 'text-white'}`}>
                            {student.name}
                          </span>
                          {student.isCurrentUser && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-extrabold uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{student.specialty}</span>
                      </div>
                    </div>
                  </td>

                  {/* Lab Completion Rate */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-center gap-1 min-w-[120px]">
                      <div className="flex items-center justify-between w-full text-[11px]">
                        <span className="text-slate-400 font-mono">
                          {student.completedLabsCount} of 4 Labs
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            student.labCompletionRate === 100
                              ? 'text-emerald-400'
                              : student.labCompletionRate >= 75
                              ? 'text-cyan-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {student.labCompletionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            student.labCompletionRate === 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : student.labCompletionRate >= 75
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          }`}
                          style={{ width: `${student.labCompletionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Scientific XP */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-sm text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        {student.xp.toLocaleString()} XP
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Level {Math.floor(student.xp / 100) + 1} Scholar</span>
                    </div>
                  </td>

                  {/* Badges Count */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono font-semibold text-xs">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {student.badgesCount}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                        student.status === 'Offline'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          student.status === 'Offline' ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
                        }`}
                      />
                      {student.status}
                    </span>
                  </td>

                  {/* Cheer Button */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleCheerStudent(student)}
                      className={`group relative p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                        cheerCount > 0
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-pink-400 hover:border-pink-500/30 hover:bg-slate-800'
                      }`}
                      title={`Send scientific kudos to ${student.name}`}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${cheerCount > 0 ? 'fill-pink-500 text-pink-500' : ''}`} />
                      {cheerCount > 0 && (
                        <span className="text-[10px] font-mono font-bold text-pink-300">{cheerCount}</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cohort Motivation Callout */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Complete your next lab or quiz to earn up to <strong>+75 XP</strong> and climb the leaderboard!
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400">
          <span>Weekly Leaderboard resets every Sunday at 23:59 UTC</span>
        </div>
      </div>
    </div>
  );
};
