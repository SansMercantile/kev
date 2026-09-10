import React, { useState } from 'react';
import { GlobalTournamentEvent, LabId, StudentStats } from '../../types';
import { GLOBAL_TOURNAMENT_EVENTS } from '../../data/globalTournaments';
import { Trophy, Clock, Users, Award, Shield, CheckCircle2, ArrowRight, Sparkles, Flame } from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  studentStats: StudentStats;
  onNavigateToLab: (labId: LabId) => void;
  onAwardXP: (xp: number, reason: string) => void;
}

export const GlobalTournamentDashboard: React.FC<Props> = ({ studentStats, onNavigateToLab, onAwardXP }) => {
  const { showToast } = useToast();
  const [tournaments, setTournaments] = useState<GlobalTournamentEvent[]>(GLOBAL_TOURNAMENT_EVENTS);
  const [selectedTournament, setSelectedTournament] = useState<GlobalTournamentEvent>(GLOBAL_TOURNAMENT_EVENTS[0]);

  const handleRegister = (tournamentId: string) => {
    soundManager.playBadge();
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tournamentId) {
          return {
            ...t,
            isRegistered: true,
            registeredCount: t.registeredCount + 1,
            leaderboard: [
              ...t.leaderboard,
              {
                rank: t.leaderboard.length + 1,
                studentName: `${studentStats.name} (KEV XR)`,
                score: 8900 + Math.floor(studentStats.xp * 0.5),
                campus: 'KEV Main Campus',
              },
            ],
          };
        }
        return t;
      })
    );

    onAwardXP(50, 'Registered for Inter-Campus Global Science Tournament');
    showToast({
      type: 'success',
      title: 'Tournament Registration Confirmed!',
      message: `You are officially registered for the ${selectedTournament.title}. +50 XP welcome bonus awarded!`,
    });
  };

  const handleEnterTournamentArena = (subject: LabId) => {
    showToast({
      type: 'info',
      title: 'Connecting to Tournament Server',
      message: `Synchronizing competitive telemetry with global contestants...`,
    });
    onNavigateToLab(subject);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xl shadow-amber-500/10">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Inter-Campus Global Science Tournaments
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-mono font-bold border border-amber-500/40 animate-pulse">
                Season 4 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Compete against universities and science academies worldwide. Test your reaction time, mathematical precision, and spatial intuition in time-limited empirical simulations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
          <Flame className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Current Academy Rank</span>
            <span className="text-sm font-bold text-white font-mono">#3 Worldwide (KEV XR)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tournaments Cards, Right Active Leaderboard & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Events Cards */}
        <div className="lg:col-span-5 space-y-3">
          {tournaments.map((tourney) => {
            const isSelected = selectedTournament.id === tourney.id;
            return (
              <div
                key={tourney.id}
                onClick={() => setSelectedTournament(tourney)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-xl shadow-amber-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-0.5">
                      {tourney.startsAt} • {tourney.endsAt}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug">{tourney.title}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    +{tourney.xpReward} XP
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {tourney.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{tourney.registeredCount} Competitors</span>
                  </div>

                  {tourney.isRegistered ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Registered</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-300 font-bold">Register Now →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Rules, Registration, and Live Leaderboard */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
                  Active Championship
                </span>
                <h3 className="text-xl font-bold text-white">{selectedTournament.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {selectedTournament.description}
                </p>
              </div>

              <div className="text-right p-3 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Champion Bounty</span>
                <span className="text-base font-bold text-amber-400 font-mono">+{selectedTournament.xpReward} XP</span>
              </div>
            </div>

            {/* Rules */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
                Official Competition Regulations
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {selectedTournament.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions: Register or Launch Competitive Match */}
            <div className="flex items-center gap-3">
              {!selectedTournament.isRegistered ? (
                <button
                  onClick={() => handleRegister(selectedTournament.id)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Register for Competition (+50 XP)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleEnterTournamentArena(selectedTournament.subject)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>Enter Tournament Arena (Live Run)</span>
                </button>
              )}
            </div>

            {/* Sample Leaderboard Standings (static demo roster, not a live feed) */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Global Leaderboard Standings
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30" title="Illustrative standings — live global tournaments are not connected yet">
                  SAMPLE
                </span>
              </div>

              <div className="space-y-2">
                {selectedTournament.leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                      entry.rank === 1
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : entry.rank === 2
                        ? 'bg-slate-800/40 border-slate-700 text-slate-200'
                        : entry.rank === 3
                        ? 'bg-orange-950/20 border-orange-800/40 text-orange-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-[11px]">
                        {entry.rank}
                      </span>
                      <div>
                        <span className="font-bold text-white block">{entry.studentName}</span>
                        <span className="text-[10px] text-slate-500">{entry.campus}</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-cyan-400">{entry.score} PTS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
