import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, ArrowUp, ArrowDown, Sparkles, ShieldCheck, DoorOpen } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

export interface CampusTransitionEvent {
  type: 'floor' | 'door';
  fromFloor?: number;
  toFloor?: number;
  destinationName: string;
  labColor?: string;
}

interface Props {
  transition: CampusTransitionEvent | null;
  onComplete: () => void;
}

export const CampusTransitionPortal: React.FC<Props> = ({ transition, onComplete }) => {
  const [stage, setStage] = useState<'closing' | 'in_transit' | 'opening'>('closing');

  useEffect(() => {
    if (!transition) return;

    soundManager.playTeleportTransit();
    setStage('closing');

    const transitTimer = setTimeout(() => {
      setStage('in_transit');
    }, 400);

    const openTimer = setTimeout(() => {
      setStage('opening');
    }, 1100);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearTimeout(transitTimer);
      clearTimeout(openTimer);
      clearTimeout(finishTimer);
    };
  }, [transition]);

  if (!transition) return null;

  const isFloor = transition.type === 'floor';
  const isGoingUp = (transition.toFloor || 1) > (transition.fromFloor || 1);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Left Shutter Door */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={stage === 'opening' ? { x: '-100%' } : { x: '0%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-slate-950 border-r-2 border-cyan-500/60 shadow-2xl flex items-center justify-end pr-6 z-20"
      >
        <div className="h-48 w-1 bg-cyan-400/40 rounded-full" />
      </motion.div>

      {/* Right Shutter Door */}
      <motion.div
        initial={{ x: '100%' }}
        animate={stage === 'opening' ? { x: '100%' } : { x: '0%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-slate-950 border-l-2 border-cyan-500/60 shadow-2xl flex items-center justify-start pl-6 z-20"
      >
        <div className="h-48 w-1 bg-cyan-400/40 rounded-full" />
      </motion.div>

      {/* Central Transit HUD Display */}
      <AnimatePresence>
        {stage !== 'opening' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="relative z-30 flex flex-col items-center justify-center text-center p-6 space-y-4"
          >
            {/* Holographic Ring */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-400/60 flex items-center justify-center"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {isFloor ? (
                  isGoingUp ? (
                    <ArrowUp className="w-10 h-10 text-cyan-400 animate-bounce" />
                  ) : (
                    <ArrowDown className="w-10 h-10 text-cyan-400 animate-bounce" />
                  )
                ) : (
                  <DoorOpen className="w-10 h-10 text-cyan-400 animate-pulse" />
                )}
              </div>
            </div>

            {/* Status Labels */}
            <div className="space-y-1 font-mono">
              <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest block">
                {isFloor ? 'HIGH-SPEED ELEVATOR TRANSIT' : 'LABORATORY AIRLOCK TRANSIT'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {transition.destinationName}
              </h2>
              {isFloor && transition.fromFloor && transition.toFloor && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-1">
                  <span>Floor {transition.fromFloor}</span>
                  <span className="text-cyan-400">⟶</span>
                  <span className="text-cyan-300 font-bold">Floor {transition.toFloor}</span>
                </div>
              )}
            </div>

            {/* Cleanroom / Transit Progress Bar */}
            <div className="w-56 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/40">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"
              />
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              Harmonizing spatial coordinates & 3D viewport...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Scanline Overlay */}
      <motion.div
        animate={{ y: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="absolute inset-x-0 h-2 bg-cyan-400/20 shadow-[0_0_20px_#06b6d4] z-25 pointer-events-none"
      />
    </div>
  );
};
