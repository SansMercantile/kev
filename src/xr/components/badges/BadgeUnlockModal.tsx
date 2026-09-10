import React, { useEffect, useState } from 'react';
import { Award, Sparkles, X, CheckCircle, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  badgeName: string | null;
  description?: string;
  onClose: () => void;
}

const BADGE_METADATA: Record<string, { rarity: 'Legendary' | 'Epic' | 'Rare'; iconColor: string; bgGradient: string; lore: string }> = {
  'Spatial Chemist': {
    rarity: 'Epic',
    iconColor: 'text-cyan-300',
    bgGradient: 'from-cyan-500/20 via-blue-600/30 to-indigo-900/40',
    lore: 'Mastered 3D VSEPR molecular geometry and electron pair repulsion dynamics in the virtual synthetic lab.',
  },
  'Kepler Navigator': {
    rarity: 'Epic',
    iconColor: 'text-amber-300',
    bgGradient: 'from-amber-500/20 via-orange-600/30 to-purple-900/40',
    lore: 'Calculated orbital velocity vectors, perihelion kinetic surges, and simulated stable planetary orbits.',
  },
  'Cellular Explorer': {
    rarity: 'Epic',
    iconColor: 'text-emerald-300',
    bgGradient: 'from-emerald-500/20 via-teal-600/30 to-slate-900/40',
    lore: 'Dissected eukaryotic organelles and sequenced complementary base-pairs within the 3D DNA double helix.',
  },
  'Optics Virtuoso': {
    rarity: 'Epic',
    iconColor: 'text-violet-300',
    bgGradient: 'from-violet-500/20 via-purple-600/30 to-indigo-900/40',
    lore: 'Engineered prismatic dispersion angles and observed total internal reflection governed by Snell’s Law.',
  },
  'XR Holographer': {
    rarity: 'Legendary',
    iconColor: 'text-cyan-300',
    bgGradient: 'from-cyan-400/20 via-teal-600/30 to-blue-950/50',
    lore: 'Anchored 3D scientific simulations directly onto physical desktop surfaces using spatial AR pass-through.',
  },
  'Master Scholar': {
    rarity: 'Legendary',
    iconColor: 'text-yellow-300',
    bgGradient: 'from-yellow-500/20 via-amber-600/30 to-red-950/50',
    lore: 'Attained supreme academic mastery across multiple rigorous science evaluation checkpoints.',
  },
};

export const BadgeUnlockModal: React.FC<Props> = ({ badgeName, description, onClose }) => {
  const [stage, setStage] = useState<'entering' | 'revealed'>('entering');

  useEffect(() => {
    if (!badgeName) return;

    // Synthesize celebratory fanfare chime with Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.3);        // C5
      playTone(659.25, now + 0.15, 0.3); // E5
      playTone(783.99, now + 0.3, 0.3);  // G5
      playTone(1046.5, now + 0.45, 0.6); // C6
    } catch (e) {
      // Audio fallback safe
    }

    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#3b82f6'],
      });
    } catch (e) {
      // Confetti fallback safe
    }

    const timer = setTimeout(() => {
      setStage('revealed');
    }, 400);

    return () => clearTimeout(timer);
  }, [badgeName]);

  if (!badgeName) return null;

  const meta = BADGE_METADATA[badgeName] || {
    rarity: 'Rare',
    iconColor: 'text-amber-400',
    bgGradient: 'from-amber-500/20 via-blue-600/20 to-slate-900',
    lore: description || 'Awarded for remarkable academic curiosity and scientific progress in KEV XR Academy.',
  };

  return (
    <div
      id="badge-unlock-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Background Rotating Sunburst effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-30">
        <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-cyan-500/30 via-amber-500/20 to-purple-600/30 blur-3xl animate-pulse" />
      </div>

      {/* Main Animated Card */}
      <div
        id="badge-unlock-card"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 ${
          meta.rarity === 'Legendary'
            ? 'border-amber-400/80 shadow-2xl shadow-amber-500/30'
            : 'border-cyan-400/70 shadow-2xl shadow-cyan-500/25'
        } backdrop-blur-xl text-center flex flex-col items-center transition-all duration-700 transform ${
          stage === 'entering' ? 'scale-75 opacity-0 rotate-12' : 'scale-100 opacity-100 rotate-0'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Eyebrow Rarity Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-mono tracking-widest uppercase mb-4 text-slate-300">
          <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{meta.rarity} ACADEMIC BADGE UNLOCKED</span>
        </div>

        {/* 3D Shimmering Badge Medallion */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-yellow-400 to-purple-600 blur-xl opacity-60 animate-pulse" />
          
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${meta.bgGradient} border-2 border-white/20 flex flex-col items-center justify-center shadow-xl p-4 transition-transform hover:scale-105 duration-300`}
          >
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 shadow-inner">
              <Award className={`w-12 h-12 sm:w-14 sm:h-14 ${meta.iconColor} drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`} />
            </div>
            
            <span className="mt-1 text-[10px] font-mono font-bold tracking-wider text-white/90">
              KEV XR
            </span>
          </div>
        </div>

        {/* Badge Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3">
          {badgeName}
        </h2>

        {/* Badge Lore */}
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-sm leading-relaxed">
          {meta.lore}
        </p>

        {/* XP Reward Chip */}
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>+50 XP Academic Mastery Boost Added to Profile</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Claim Badge & Continue Learning</span>
        </button>
      </div>
    </div>
  );
};
