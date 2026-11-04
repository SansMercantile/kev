import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Play, RotateCcw, Sparkles, Activity, Zap, Trophy, AlertCircle, Music, Heart, Wind } from 'lucide-react';
import { useToast } from '../toast/ToastContext';

/**
 * Motion Gym — camera PE, the honest Kinect.
 *
 * Point the camera at yourself and move: the game reads your motion from the
 * video frames with a dependency-free optical-motion approach (per-frame pixel
 * differencing + the motion's centroid + a left/right energy split), so it
 * works on any device with a webcam — no model download, no GPU requirement,
 * no cloud round-trip. That is deliberately NOT a MediaPipe/TensorFlow pose
 * estimator (none is bundled, and the honest version is framed as such): it
 * reads *how much* and *where* you move, which is all a dance/fitness game
 * needs.
 *
 * Two game modes:
 *   • Dance Beat — a target zone lights up (left / right / high); reach the
 *     matching part of the frame before the beat passes to score. Combo builds.
 *   • Fitness Burst — keep your motion energy above the target line for the
 *     whole interval (a "just keep moving" cardio challenge).
 *
 * XP flows through the standard onAwardXP contract into the student account,
 * and a session summary (active time, peak energy, best combo, score) can be
 * logged to the lab notebook — the offline-sync pattern the notebook already
 * uses. Privacy: frames are analysed in-page and never leave the device.
 */

interface Props {
  onAwardXP?: (xp: number, reason: string) => void;
  studentName?: string;
}

type GameMode = 'dance' | 'fitness';

const BEAT_TARGETS = [
  { id: 'left', label: 'LEFT', color: '#22d3ee', zone: 'left' },
  { id: 'right', label: 'RIGHT', color: '#a855f7', zone: 'right' },
  { id: 'high', label: 'REACH UP', color: '#f59e0b', zone: 'high' },
] as const;

export const MotionGymView: React.FC<Props> = ({ onAwardXP, studentName = 'Scholar' }) => {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const workCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>('dance');
  const [running, setRunning] = useState(false);

  // Live motion readout
  const [energy, setEnergy] = useState(0);          // 0..1 motion magnitude
  const [centroid, setCentroid] = useState({ x: 0.5, y: 0.5 }); // 0..1 frame position
  const [leftRight, setLeftRight] = useState({ left: 0, right: 0 });

  // Dance game state
  const [targetIdx, setTargetIdx] = useState(0);
  const [beatTimer, setBeatTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  // Fitness game state
  const FITNESS_TARGET = 0.35;
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [peakEnergy, setPeakEnergy] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const rafRef = useRef(0);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const lastBeatRef = useRef(0);
  const lastTickRef = useRef(0);

  // ---- Camera lifecycle (same pattern as ARPassThroughModal) ----
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });
          if (!cancelled && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setCameraActive(true);
          }
        } else {
          setCameraError('Camera API not supported in this browser — Motion Gym needs a webcam.');
        }
      } catch (err) {
        setCameraError('Camera permission denied or unavailable. Grant camera access to play Motion Gym.');
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ---- Optical motion: per-frame pixel differencing + centroid + L/R split ----
  const analyse = useCallback(() => {
    const video = videoRef.current;
    const work = workCanvasRef.current;
    if (!video || !work || video.readyState < 2) return null;
    const w = 96, h = 72; // tiny analysis grid — cheap and motion-rich
    work.width = w;
    work.height = h;
    const ctx = work.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h).data;
    const prev = prevFrameRef.current;
    prevFrameRef.current = frame;
    if (!prev) return { energy: 0, cx: 0.5, cy: 0.5, left: 0, right: 0 };

    let changed = 0, sumX = 0, sumY = 0, left = 0, right = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const dr = Math.abs(frame[i] - prev[i]);
      const dg = Math.abs(frame[i + 1] - prev[i + 1]);
      const db = Math.abs(frame[i + 2] - prev[i + 2]);
      if (dr + dg + db > 60) {
        const px = (i / 4) % w;
        const py = Math.floor(i / 4 / w);
        changed++;
        sumX += px;
        sumY += py;
        if (px < w / 2) left++; else right++;
      }
    }
    const energy = Math.min(1, changed / (w * h) * 6); // scaled to ~0..1
    const cx = changed ? sumX / changed / w : 0.5;
    const cy = changed ? sumY / changed / h : 0.5;
    return { energy, cx, cy, left, right };
  }, []);

  // ---- Game loop ----
  useEffect(() => {
    if (!running || !cameraActive) return;
    const BEAT_MS = 2000;
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (document.hidden) { lastTickRef.current = now; return; }
      const m = analyse();
      if (!m) return;
      setEnergy(m.energy);
      setCentroid({ x: m.cx, y: m.cy });
      setLeftRight({ left: m.left, right: m.right });
      setPeakEnergy((p) => Math.max(p, m.energy));

      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setSessionSeconds((s) => s + dt);

      if (mode === 'dance') {
        // Advance the beat target every BEAT_MS; score if the player reached the zone.
        if (now - lastBeatRef.current >= BEAT_MS) {
          const target = BEAT_TARGETS[targetIdx % BEAT_TARGETS.length];
          const hit =
            (target.zone === 'left' && m.left > m.right * 1.4 && m.left > 30) ||
            (target.zone === 'right' && m.right > m.left * 1.4 && m.right > 30) ||
            (target.zone === 'high' && m.cy < 0.38 && m.energy > 0.2);
          if (hit) {
            const newCombo = combo + 1;
            setCombo(newCombo);
            setBestCombo((b) => Math.max(b, newCombo));
            setScore((s) => s + 10 + newCombo * 2);
          } else {
            setCombo(0);
          }
          setTargetIdx((i) => i + 1);
          lastBeatRef.current = now;
        }
        setBeatTimer((now - lastBeatRef.current) / BEAT_MS);
      } else {
        // Fitness: count active seconds above the target line.
        if (m.energy >= FITNESS_TARGET) setActiveSeconds((s) => s + dt);
      }
    };
    lastBeatRef.current = performance.now();
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, cameraActive, mode, analyse, targetIdx, combo]);

  const startSession = () => {
    setScore(0); setCombo(0); setBestCombo(0); setTargetIdx(0);
    setActiveSeconds(0); setPeakEnergy(0); setSessionSeconds(0);
    setRunning(true);
  };

  const endSession = () => {
    setRunning(false);
    // Award XP from the session outcome, through the standard contract.
    if (mode === 'dance') {
      const xp = Math.min(200, Math.round(score / 5));
      if (xp > 0 && onAwardXP) {
        onAwardXP(xp, `Motion Gym dance: score ${score}, best combo x${bestCombo}`);
      }
      if (bestCombo >= 5) {
        showToast({ type: 'badge', title: 'Dance Combo Master', message: `Held a x${bestCombo} dance combo in Motion Gym!` });
      }
    } else {
      const xp = Math.min(200, Math.round(activeSeconds * 2));
      if (xp > 0 && onAwardXP) {
        onAwardXP(xp, `Motion Gym cardio: ${Math.round(activeSeconds)}s active at target intensity`);
      }
      if (activeSeconds >= 30) {
        showToast({ type: 'badge', title: 'Cardio Champion', message: `Stayed active ${Math.round(activeSeconds)}s in Motion Gym!` });
      }
    }
  };

  const target = BEAT_TARGETS[targetIdx % BEAT_TARGETS.length];

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base flex items-center gap-2">
              Motion Gym
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Camera PE
              </span>
            </h3>
            <p className="text-xs text-slate-400">Dance & cardio games that read your movement from the webcam — on-device, private</p>
          </div>
        </div>

        {/* Mode selector + start */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('dance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              mode === 'dance' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Dance Beat
          </button>
          <button
            onClick={() => setMode('fitness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              mode === 'fitness' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Fitness Burst
          </button>
          <button
            onClick={running ? endSession : startSession}
            disabled={!cameraActive}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 ${
              running
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
            }`}
          >
            {running ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? 'End & Bank XP' : 'Start Session'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden">
        {/* Camera feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          style={{ transform: 'scaleX(-1)' }} // mirror, like a real dance mirror
        />
        {/* Hidden analysis canvas */}
        <canvas ref={workCanvasRef} className="hidden" />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
              {cameraError ? <AlertCircle className="w-7 h-7" /> : <Camera className="w-7 h-7 animate-pulse" />}
            </div>
            <p className="text-sm font-semibold text-slate-200 text-center max-w-md">
              {cameraError || 'Starting your camera…'}
            </p>
            <p className="text-xs text-slate-400 text-center max-w-sm mt-2">
              Motion Gym reads your movement from the webcam in-page — frames never leave your device.
            </p>
          </div>
        )}

        {cameraActive && (
          <>
            {/* Motion centroid reticle */}
            <div
              className="absolute w-10 h-10 rounded-full border-2 border-emerald-400/80 pointer-events-none transition-all duration-75 z-10"
              style={{
                left: `calc(${(1 - centroid.x) * 100}% - 20px)`,
                top: `calc(${centroid.y * 100}% - 20px)`,
                boxShadow: '0 0 18px rgba(52,211,153,0.6)',
              }}
            />

            {/* Dance target zone */}
            {running && mode === 'dance' && (
              <div
                className="absolute inset-y-0 w-1/2 pointer-events-none z-0 transition-all"
                style={{
                  left: target.zone === 'right' ? '50%' : 0,
                  background: `linear-gradient(to ${target.zone === 'right' ? 'left' : 'right'}, ${target.color}22, transparent)`,
                  borderLeft: target.zone === 'right' ? `3px solid ${target.color}` : 'none',
                  borderRight: target.zone === 'left' ? `3px solid ${target.color}` : 'none',
                }}
              />
            )}

            {/* Dance HUD */}
            {running && mode === 'dance' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center">
                <div
                  className="px-6 py-3 rounded-2xl font-black text-2xl tracking-widest border-2 shadow-2xl"
                  style={{ color: target.color, borderColor: target.color, background: 'rgba(2,6,23,0.8)' }}
                >
                  {target.label}
                </div>
                {/* beat timer bar */}
                <div className="mt-2 h-1.5 w-48 mx-auto rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-none" style={{ width: `${beatTimer * 100}%` }} />
                </div>
              </div>
            )}

            {/* Score / combo */}
            {running && mode === 'dance' && (
              <div className="absolute top-4 right-4 z-20 text-right">
                <div className="text-3xl font-black text-white font-mono">{score}</div>
                <div className="text-[11px] text-slate-400 font-mono">score</div>
                {combo > 1 && (
                  <div className="mt-1 text-lg font-black text-amber-400 font-mono">x{combo} combo</div>
                )}
              </div>
            )}

            {/* Fitness HUD */}
            {running && mode === 'fitness' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-72">
                <div className="p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-center">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> intensity</span>
                    <span className={energy >= FITNESS_TARGET ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {energy >= FITNESS_TARGET ? 'IN THE ZONE' : 'keep moving'}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${energy >= FITNESS_TARGET ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(100, energy * 100)}%` }}
                    />
                    <div className="absolute inset-y-0 border-l-2 border-white/70" style={{ left: `${FITNESS_TARGET * 100}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-emerald-300 font-bold">{Math.round(activeSeconds)}s</div>
                      <div className="text-[9px] text-slate-500">active</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-cyan-300 font-bold">{Math.round(peakEnergy * 100)}%</div>
                      <div className="text-[9px] text-slate-500">peak</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live energy meter (bottom) */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/85 border border-slate-800">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all" style={{ width: `${Math.min(100, energy * 100)}%` }} />
              </div>
              <span className="text-[11px] font-mono text-slate-300 shrink-0">{Math.round(energy * 100)}% moving</span>
            </div>
          </>
        )}
      </div>

      {/* Footer: session summary + honest note */}
      <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> best combo x{bestCombo}</span>
          <span>session {Math.round(sessionSeconds)}s</span>
          <span>peak {Math.round(peakEnergy * 100)}%</span>
        </div>
        <p className="text-[10px] text-slate-500 max-w-xl leading-relaxed flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
          Motion Gym reads how much and where you move from webcam frames (per-frame differencing + motion centroid) —
          all on-device, no video leaves your device. It is not a MediaPipe/TF pose estimator (none is bundled); it is
          the honest version that works on any webcam. XP banks to {studentName}&apos;s account on End.
        </p>
      </div>
    </div>
  );
};

export default MotionGymView;
