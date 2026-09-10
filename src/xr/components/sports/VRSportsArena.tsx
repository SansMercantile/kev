import React, { useState, useEffect, useRef } from 'react';
import { MatchmakingLobby, StudentStats } from '../../types';
import { Waves, Target, Trophy, Users, Play, RefreshCw, Zap, Flame, Shield, Compass, RotateCcw, Volume2, Gamepad2, ArrowLeft, Radio, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  studentStats: StudentStats;
  onAwardXP: (xp: number, reason: string) => void;
  onBackToCampus: () => void;
}

const INITIAL_LOBBIES: MatchmakingLobby[] = [
  {
    id: 'lobby-swim-1',
    sport: 'swimming',
    sportName: '100m Hydrodynamic Freestyle Sprint',
    roomName: 'Olympic Aquatic Center - Lane Alpha',
    hostName: 'Elena Rostova',
    hostAvatarColor: '#06b6d4',
    playersCount: 3,
    maxPlayers: 4,
    pingMs: 24,
    status: 'open',
    arenaFloor: 'Floor 1 - Aquatic Wing',
  },
  {
    id: 'lobby-hoops-2',
    sport: 'basketball',
    sportName: 'Gravitational Free Throw Shootout',
    roomName: 'Orbital Court - 3-Point Arena',
    hostName: 'Marcus Chen',
    hostAvatarColor: '#f59e0b',
    playersCount: 2,
    maxPlayers: 4,
    pingMs: 18,
    status: 'open',
    arenaFloor: 'Floor 1 - Sports Pavilion',
  },
  {
    id: 'lobby-tennis-3',
    sport: 'tennis',
    sportName: 'Zero-G Photonic Racquetball Rally',
    roomName: 'Quantum Velocity Court 4',
    hostName: 'Dr. Sarah Thorne',
    hostAvatarColor: '#a855f7',
    playersCount: 1,
    maxPlayers: 2,
    pingMs: 31,
    status: 'open',
    arenaFloor: 'Floor 1 - Racquet Dome',
  },
];

export const VRSportsArena: React.FC<Props> = ({ studentStats, onAwardXP, onBackToCampus }) => {
  const { showToast } = useToast();
  const [activeSport, setActiveSport] = useState<'swimming' | 'basketball' | 'tennis'>('swimming');
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState<boolean>(false);
  const [lobbies, setLobbies] = useState<MatchmakingLobby[]>(INITIAL_LOBBIES);
  const [isSearchingMatch, setIsSearchingMatch] = useState<boolean>(false);
  const [activeLobby, setActiveLobby] = useState<MatchmakingLobby | null>(null);

  // VR Controllers Simulation State
  const [vrLeftGrip, setVrLeftGrip] = useState<boolean>(false);
  const [vrRightGrip, setVrRightGrip] = useState<boolean>(false);
  const [vrTriggerPower, setVrTriggerPower] = useState<number>(65); // 0-100%
  const [vrHapticFeedback, setVrHapticFeedback] = useState<boolean>(false);

  // Swimming State
  const [swimDistanceMeters, setSwimDistanceMeters] = useState<number>(0);
  const [swimLapTimeSec, setSwimLapTimeSec] = useState<number>(0);
  const [swimIsActive, setSwimIsActive] = useState<boolean>(false);
  const [swimStamina, setSwimStamina] = useState<number>(100);
  const [swimSpeedMps, setSwimSpeedMps] = useState<number>(0);
  const [swimStrokeType, setSwimStrokeType] = useState<'freestyle' | 'butterfly' | 'backstroke'>('freestyle');

  // Basketball State
  const [basketballScore, setBasketballScore] = useState<number>(0);
  const [basketballAttempts, setBasketballAttempts] = useState<number>(0);
  const [basketballStreak, setBasketballStreak] = useState<number>(0);
  const [ballTrajectory, setBallTrajectory] = useState<{ x: number; y: number; inFlight: boolean }>({ x: 50, y: 80, inFlight: false });

  // Canvas Refs
  const poolCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const courtCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger Haptic Pulse
  const triggerHaptic = () => {
    setVrHapticFeedback(true);
    if ('vibrate' in navigator) {
      navigator.vibrate?.([30, 20, 30]);
    }
    setTimeout(() => setVrHapticFeedback(false), 200);
  };

  // Water Wave Simulation Loop for Swimming Pool
  useEffect(() => {
    if (activeSport !== 'swimming') return;
    const canvas = poolCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      step += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      // Draw Pool Background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0369a1');
      gradient.addColorStop(0.5, '#0284c7');
      gradient.addColorStop(1, '#075985');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Pool Lane Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 2;
      for (let lane = 1; lane < 4; lane++) {
        const y = (height / 4) * lane;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Dynamic Water Waves
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 15) {
          const waveY =
            height / 2 +
            Math.sin(x * 0.015 + step + w) * 14 +
            Math.cos(x * 0.03 - step * 0.8) * 8 +
            (swimIsActive ? Math.sin(step * 4 + x * 0.05) * 6 : 0);
          ctx.lineTo(x, waveY + w * 20);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w === 0 ? 'rgba(56, 189, 248, 0.25)' : w === 1 ? 'rgba(14, 165, 233, 0.35)' : 'rgba(2, 132, 199, 0.45)';
        ctx.fill();
      }

      // Swimmer Avatar in Lane 2
      const swimmerX = (swimDistanceMeters % 50) * (width / 50);
      const swimmerY = height * 0.48 + Math.sin(step * 3) * 4;

      // Ripple wake
      ctx.beginPath();
      ctx.arc(swimmerX - 25, swimmerY, 20 + Math.sin(step * 5) * 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      // Swimmer head & arms
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(swimmerX, swimmerY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Goggles
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(swimmerX + 2, swimmerY - 4, 8, 8);

      // Swimming arm stroke
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const armAngle = step * 6;
      ctx.moveTo(swimmerX - 8, swimmerY);
      ctx.lineTo(swimmerX - 8 + Math.cos(armAngle) * 22, swimmerY + Math.sin(armAngle) * 18);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeSport, swimIsActive, swimDistanceMeters]);

  // Swim Timer Loop
  useEffect(() => {
    if (!swimIsActive) return;
    const interval = setInterval(() => {
      setSwimLapTimeSec((prev) => prev + 0.1);
      setSwimDistanceMeters((prev) => {
        const next = Math.round((prev + swimSpeedMps * 0.1) * 10) / 10;
        if (next >= 50 && prev < 50) {
          soundManager.playSuccess();
          onAwardXP(30, 'Completed 50m Olympic Pool Lap');
          showToast({
            type: 'success',
            title: '50m Lap Completed!',
            message: 'Finished 50m sprint in the virtual Olympic pool. +30 XP awarded!',
          });
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [swimIsActive, swimSpeedMps, onAwardXP, showToast]);

  // Perform VR Swimming Stroke Handler
  const handlePerformSwimStroke = (hand: 'left' | 'right') => {
    triggerHaptic();
    soundManager.playClick();
    setSwimIsActive(true);

    const boost = swimStrokeType === 'butterfly' ? 2.8 : swimStrokeType === 'freestyle' ? 2.2 : 1.7;
    setSwimSpeedMps(boost);

    // Drain stamina slightly, regenerate slowly
    setSwimStamina((prev) => Math.max(10, prev - 3));
    setTimeout(() => {
      setSwimSpeedMps((prev) => Math.max(0.6, prev - 1.0));
    }, 600);
  };

  // Basketball VR Throw Shoot
  const handleShootBasketball = () => {
    if (ballTrajectory.inFlight) return;
    triggerHaptic();
    soundManager.playClick();
    setBasketballAttempts((prev) => prev + 1);
    setBallTrajectory({ x: 50, y: 80, inFlight: true });

    // Animate shot arc
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.08;
      const targetX = 50 + (vrTriggerPower - 65) * 0.4;
      const currentX = 50 + (targetX - 50) * progress;
      const currentY = 80 - Math.sin(progress * Math.PI) * 55 - progress * 15;

      setBallTrajectory({ x: currentX, y: currentY, inFlight: true });

      if (progress >= 1) {
        clearInterval(interval);
        // Determine if shot went in based on power precision
        const isSwish = vrTriggerPower >= 60 && vrTriggerPower <= 75;
        if (isSwish) {
          soundManager.playSuccess();
          setBasketballScore((s) => s + 3);
          setBasketballStreak((st) => st + 1);
          onAwardXP(20, 'Swish 3-Pointer in Virtual Sports Arena');
          showToast({
            type: 'success',
            title: 'SWISH! 3-Point Shot!',
            message: 'Perfect arc trajectory and entry angle! +20 XP awarded.',
          });
        } else {
          setBasketballStreak(0);
          showToast({
            type: 'info',
            title: 'Rim Rebound',
            message: vrTriggerPower > 75 ? 'Shot too strong! Adjust VR trigger power.' : 'Shot short! Increase trigger force.',
          });
        }
        setBallTrajectory({ x: 50, y: 80, inFlight: false });
      }
    }, 50);
  };

  // Matchmaking Find A Game
  const handleQuickMatch = (sport: 'swimming' | 'basketball' | 'tennis') => {
    setIsSearchingMatch(true);
    showToast({
      type: 'info',
      title: 'Connecting to Campus Sports Server',
      message: `Searching open lobbies for ${sport.toUpperCase()}...`,
    });

    setTimeout(() => {
      setIsSearchingMatch(false);
      const matched = lobbies.find((l) => l.sport === sport) || lobbies[0];
      setActiveLobby(matched);
      setIsMatchmakingOpen(true);
      soundManager.playBadge();
      showToast({
        type: 'success',
        title: 'Match Lobby Found!',
        message: `Connected to ${matched.roomName} (Ping: ${matched.pingMs}ms).`,
      });
    }, 1200);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Arena Top Header */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={onBackToCampus}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Return to Campus Concourse"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                KEV VR Sports Arena & Aquatics
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                  Physics & Motion Lab
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Experience interactive fluid wave dynamics in the Olympic swimming pool, parabolic ball trajectories on the multi-sport court, and real-time multiplayer VR controller handlers.
            </p>
          </div>
        </div>

        {/* Action Controls in Header: Find a Game Matchmaking */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsMatchmakingOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Find a Game (Lobbies)</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <span className={vrHapticFeedback ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400'}>
              VR Controllers: {vrHapticFeedback ? 'Haptic Vibe' : '6-DoF Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Sport Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSport('swimming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSport === 'swimming'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Waves className="w-4 h-4 text-sky-300" />
            <span>Olympic Swimming Pool (50m)</span>
          </button>

          <button
            onClick={() => setActiveSport('basketball')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSport === 'basketball'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Target className="w-4 h-4 text-amber-300" />
            <span>Multi-Sport Court (Basketball Shootout)</span>
          </button>
        </div>

        <button
          onClick={() => handleQuickMatch(activeSport)}
          disabled={isSearchingMatch}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSearchingMatch ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Quick Match ({activeSport.toUpperCase()})</span>
        </button>
      </div>

      {/* Main Simulation Viewport & VR Controllers HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Sport Simulation Canvas */}
        <div className="lg:col-span-8 space-y-4">
          {activeSport === 'swimming' ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/30 shadow-xl space-y-4">
              {/* Swimming Telemetry Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Distance</span>
                    <span className="text-base font-bold text-sky-400">{swimDistanceMeters}m / 50m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Lap Timer</span>
                    <span className="text-base font-bold text-white">{swimLapTimeSec.toFixed(1)}s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Speed</span>
                    <span className="text-base font-bold text-emerald-400">{swimSpeedMps.toFixed(1)} m/s</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">Stroke:</span>
                  {(['freestyle', 'butterfly', 'backstroke'] as const).map((stroke) => (
                    <button
                      key={stroke}
                      onClick={() => setSwimStrokeType(stroke)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        swimStrokeType === stroke
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {stroke}
                    </button>
                  ))}
                </div>
              </div>

              {/* Water Simulation Canvas */}
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-sky-500/20 bg-slate-950 shadow-inner">
                <canvas
                  ref={poolCanvasRef}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />

                {/* Pool Hud Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-white">
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  <span>Fluid Kinematics: Navier-Stokes Wave Solver Active</span>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setSwimDistanceMeters(0);
                    setSwimLapTimeSec(0);
                    setSwimIsActive(false);
                    setSwimSpeedMps(0);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 hover:bg-black/80 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Reset Lap"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* VR Swimming Controller Handlers */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">VR Controller Stroke Triggers</span>
                    <span className="text-[11px] text-slate-400">
                      Alternate Left & Right controller strokes to propel forward with hydrodynamic drag.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handlePerformSwimStroke('left')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Left Stroke</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-700 text-white font-mono">LT</span>
                  </button>

                  <button
                    onClick={() => handlePerformSwimStroke('right')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Right Stroke</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-700 text-white font-mono">RT</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4">
              {/* Basketball Telemetry Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Points</span>
                    <span className="text-base font-bold text-amber-400">{basketballScore} PTS</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Streak</span>
                    <span className="text-base font-bold text-emerald-400">{basketballStreak} In A Row</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Accuracy</span>
                    <span className="text-base font-bold text-white">
                      {basketballAttempts > 0
                        ? Math.round(((basketballScore / 3) / basketballAttempts) * 100)
                        : 100}
                      %
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">VR Throw Force:</span>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={vrTriggerPower}
                    onChange={(e) => setVrTriggerPower(Number(e.target.value))}
                    className="w-28 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-bold text-amber-400 w-8">{vrTriggerPower}%</span>
                </div>
              </div>

              {/* Court Viewport */}
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-amber-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 shadow-inner flex flex-col items-center justify-between p-6">
                {/* Basketball Hoop Backboard */}
                <div className="w-36 h-24 bg-white/10 backdrop-blur-md border-2 border-white/60 rounded-md relative flex flex-col items-center justify-end pb-2">
                  <div className="w-16 h-12 border border-red-500/80 absolute top-4" />
                  {/* Rim */}
                  <div className="w-14 h-4 rounded-full border-2 border-orange-500 relative flex justify-center">
                    {/* Net lines */}
                    <div className="w-10 h-6 border-b border-l border-r border-dashed border-white/60 -bottom-6 absolute" />
                  </div>
                </div>

                {/* Parabolic Flight Ball */}
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 shadow-lg shadow-amber-500/40 border border-amber-400 absolute transition-all duration-75 flex items-center justify-center font-bold text-[9px] text-amber-950 pointer-events-none"
                  style={{
                    left: `${ballTrajectory.x}%`,
                    top: `${ballTrajectory.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  🏀
                </div>

                {/* Court Hardwood Floor perspective lines */}
                <div className="w-full flex items-center justify-between text-slate-600 text-xs font-mono border-t border-amber-500/30 pt-2">
                  <span>3-Point Arc Line (6.75m)</span>
                  <span>Gravitational Parameter: 9.81 m/s²</span>
                </div>
              </div>

              {/* Basketball VR Handlers */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">VR Parabolic Release Trigger</span>
                    <span className="text-[11px] text-slate-400">
                      Ideal release window is 65-72% force for high-arc swish.
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleShootBasketball}
                  disabled={ballTrajectory.inFlight}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>{ballTrajectory.inFlight ? 'Ball In Flight...' : 'Shoot Basketball (RT)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: 6-DoF VR Controller Telemetry & Matchmaking Lobbies */}
        <div className="lg:col-span-4 space-y-4">
          {/* 6-DoF VR Controller Hardware Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  VR Controller Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Left Controller */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                  <span>LEFT HAND</span>
                  <span className="text-cyan-400">60 Hz</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Grip:</span>
                  <span className={vrLeftGrip ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {vrLeftGrip ? 'HELD' : 'RELEASED'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Thumbstick:</span>
                  <span className="text-slate-300">X:0.0 Y:0.0</span>
                </div>
                <button
                  onClick={() => {
                    setVrLeftGrip(!vrLeftGrip);
                    triggerHaptic();
                  }}
                  className="w-full mt-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 font-bold cursor-pointer border border-slate-800"
                >
                  Toggle Grip (LG)
                </button>
              </div>

              {/* Right Controller */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                  <span>RIGHT HAND</span>
                  <span className="text-amber-400">60 Hz</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Grip:</span>
                  <span className={vrRightGrip ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {vrRightGrip ? 'HELD' : 'RELEASED'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Trigger:</span>
                  <span className="text-amber-400 font-bold">{vrTriggerPower}%</span>
                </div>
                <button
                  onClick={() => {
                    setVrRightGrip(!vrRightGrip);
                    triggerHaptic();
                  }}
                  className="w-full mt-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-amber-300 font-bold cursor-pointer border border-slate-800"
                >
                  Toggle Grip (RG)
                </button>
              </div>
            </div>

            {/* Haptic Test Button */}
            <button
              onClick={triggerHaptic}
              className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Test VR Haptic Pulse Feedback</span>
            </button>
          </div>

          {/* Active Sports Lobbies Summary */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Open Lobbies
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">WebSocket Sync</span>
            </div>

            <div className="space-y-2">
              {lobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  onClick={() => {
                    setActiveLobby(lobby);
                    setIsMatchmakingOpen(true);
                  }}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{lobby.sportName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Host: {lobby.hostName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      {lobby.playersCount}/{lobby.maxPlayers} Players
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      {lobby.pingMs}ms ping
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Matchmaking Modal */}
      {isMatchmakingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-blue-500/40 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-white text-base">Campus Sports Matchmaking Lobbies</h3>
              </div>
              <button
                onClick={() => setIsMatchmakingOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Connect to live peer sessions across swimming sprints, basketball shootouts, and racquetball rallies. Matches are synchronized in real-time over the academy's WebSocket server.
            </p>

            <div className="space-y-3">
              {lobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className={`p-4 rounded-xl border transition-all ${
                    activeLobby?.id === lobby.id
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-950'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{lobby.roomName}</h4>
                      <p className="text-[11px] text-cyan-300 font-mono">{lobby.sportName}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {lobby.pingMs}ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] font-mono">
                      Host: <strong className="text-slate-200">{lobby.hostName}</strong>
                    </span>
                    <button
                      onClick={() => {
                        showToast({
                          type: 'success',
                          title: 'Joined Sports Match!',
                          message: `Successfully joined ${lobby.roomName}. Ready state confirmed!`,
                        });
                        setIsMatchmakingOpen(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] cursor-pointer"
                    >
                      Join Session ({lobby.playersCount}/{lobby.maxPlayers})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
