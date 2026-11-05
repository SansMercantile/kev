import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Play, RotateCcw, Sparkles, Activity, Zap, Trophy, AlertCircle, Music, Heart, Wind, Watch, Bluetooth, PersonStanding, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import { connectHeartRate, isHeartRateSupported, type HeartRateConnection } from '../../lib/heartRate';
import { createAdaptivePoseEngine, type AdaptivePoseEngine, type PoseFrame, POSE_PARTS } from '../../lib/poseEngine';
import { joinDanceBattle, type DanceBattleHandle, type BattlePlayer, type BattleResult } from '../../lib/danceBattle';
import { getProfile } from '../../../lib/roleSession';

/**
 * Motion Gym — camera PE with a real skeleton, the honest Kinect.
 *
 * Point the camera at yourself and move: the game reads your *pose* — actual
 * skeletal keypoints (wrists, elbows, shoulders, hips, nose) — through the
 * connection-adaptive pose engine (`src/xr/lib/poseEngine.ts`):
 *
 *   • Online  → **TF.js PoseNet** (heavy, high-accuracy 17-keypoint model).
 *   • Offline → **MediaPipe Pose Lite** (5.5 MB model bundled in the PWA,
 *     WASM in-package) — a real 33-point pose with zero network.
 *
 * The engine falls back to the offline tier if the online model can't load
 * (a school network that blocks CDNs still gets a pose). Every frame is
 * analysed in-page; video never leaves the device, and the copy says so.
 *
 * Two game modes:
 *   • Dance Beat — a target lights up (left wrist / right wrist / both hands
 *     up); hit the matching *body part* position before the beat passes.
 *   • Fitness Burst — keep your whole-body motion energy above the line (or
 *     your real pulse in the cardio band, with a smartwatch linked).
 *
 * XP flows through the standard onAwardXP contract into the student account.
 */

interface Props {
  onAwardXP?: (xp: number, reason: string) => void;
  studentName?: string;
}

type GameMode = 'dance' | 'fitness' | 'battle';

// Beat targets read real body-part positions: which wrist, and hands-over-head.
const BEAT_TARGETS = [
  { id: 'left', label: 'LEFT HAND', color: '#22d3ee', zone: 'left' },
  { id: 'right', label: 'RIGHT HAND', color: '#a855f7', zone: 'right' },
  { id: 'high', label: 'HANDS UP', color: '#f59e0b', zone: 'high' },
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

  // Smartwatch heart-rate link (Web Bluetooth Heart Rate Service). Optional:
  // the game plays fine camera-only; a connected watch adds the real pulse.
  const [hrSupported] = useState(() => isHeartRateSupported());
  const [hrConnection, setHrConnection] = useState<HeartRateConnection | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrError, setHrError] = useState<string | null>(null);
  const [hrConnecting, setHrConnecting] = useState(false);
  const hrRef = useRef<HeartRateConnection | null>(null);

  // Dance Battle: real-time multiplayer over the backend WS. The server is the
  // referee (shared beat clock + leaderboard); pose eval stays on-device.
  const [battleRoom, setBattleRoom] = useState<string | null>(null);
  const [battleLeaderboard, setBattleLeaderboard] = useState<BattlePlayer[]>([]);
  const [battleBeatIndex, setBattleBeatIndex] = useState(0);
  const [battleSequence, setBattleSequence] = useState<string[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battleError, setBattleError] = useState<string | null>(null);
  const [battleConnected, setBattleConnected] = useState(false);
  const battleRef = useRef<DanceBattleHandle | null>(null);

  const rafRef = useRef(0);
  const poseEngineRef = useRef<AdaptivePoseEngine | null>(null);
  const [poseTier, setPoseTier] = useState<string>('loading');
  const [poseReady, setPoseReady] = useState(false);
  const [poseError, setPoseError] = useState<string | null>(null);
  const [skeleton, setSkeleton] = useState<PoseFrame | null>(null);
  const prevWristsRef = useRef<{ left: { x: number; y: number } | null; right: { x: number; y: number } | null }>({ left: null, right: null });
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

  // ---- Smartwatch: connect / disconnect / cleanup on unmount ----
  useEffect(() => {
    return () => {
      hrRef.current?.disconnect();
    };
  }, []);

  const handleConnectWatch = async () => {
    setHrError(null);
    setHrConnecting(true);
    try {
      const conn = await connectHeartRate(
        (reading) => setBpm(reading.bpm),
        () => {
          setHrConnection(null);
          setBpm(null);
          hrRef.current = null;
        }
      );
      hrRef.current = conn;
      setHrConnection(conn);
      showToast({ type: 'info', title: 'Smartwatch linked', message: `Reading live pulse from ${conn.deviceName}.` });
    } catch (err: any) {
      const msg = err?.message || 'Could not connect to a heart-rate wearable.';
      setHrError(msg.includes('cancelled') || msg.includes('User cancelled') ? 'Connection cancelled.' : msg);
    } finally {
      setHrConnecting(false);
    }
  };

  const handleDisconnectWatch = () => {
    hrRef.current?.disconnect();
    hrRef.current = null;
    setHrConnection(null);
    setBpm(null);
  };

  // ---- Dance Battle: join / leave / cleanup on unmount ----
  useEffect(() => {
    return () => {
      battleRef.current?.close();
    };
  }, []);

  const handleJoinBattle = () => {
    setBattleError(null);
    setBattleResult(null);
    const profile = getProfile();
    const cohort = profile?.cohort || 'senior';
    const name = profile?.name || studentName;
    const handle = joinDanceBattle(
      { cohort, name },
      {
        onJoined: (roomId) => {
          setBattleRoom(roomId);
          setBattleConnected(true);
        },
        onState: (state) => {
          setBattleLeaderboard(state.leaderboard || []);
          setBattleBeatIndex(state.beatIndex ?? 0);
          setBattleSequence(state.sequence || []);
        },
        onBeat: (state) => {
          setBattleLeaderboard(state.leaderboard || []);
          setBattleBeatIndex(state.beatIndex ?? 0);
        },
        onResult: (result) => {
          setBattleResult(result);
          setBattleLeaderboard(result.leaderboard || []);
          setRunning(false);
          // Bank XP for the placement through the standard contract.
          const me = (result.leaderboard || []).findIndex((p) => p.name === name);
          const place = me >= 0 ? me + 1 : 0;
          const myScore = me >= 0 ? result.leaderboard[me].score : 0;
          const xp = Math.min(250, Math.round(myScore / 4) + (place === 1 ? 50 : place === 2 ? 25 : place === 3 ? 10 : 0));
          if (xp > 0 && onAwardXP) {
            onAwardXP(xp, `Dance Battle: ${place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`} place, score ${myScore}`);
          }
          if (place === 1) {
            showToast({ type: 'badge', title: 'Dance Battle Champion', message: 'Won the Dance Battle!' });
          }
        },
        onError: (detail) => setBattleError(detail),
        onClose: () => setBattleConnected(false),
      }
    );
    battleRef.current = handle;
  };

  const handleLeaveBattle = () => {
    battleRef.current?.leave();
    battleRef.current?.close();
    battleRef.current = null;
    setBattleRoom(null);
    setBattleConnected(false);
    setBattleLeaderboard([]);
    setBattleResult(null);
  };

  // ---- Adaptive pose engine: load the right tier for the connection ----
  useEffect(() => {
    let cancelled = false;
    setPoseTier('loading');
    createAdaptivePoseEngine()
      .then((engine) => {
        if (cancelled) { engine.dispose(); return; }
        poseEngineRef.current = engine;
        setPoseTier(engine.label);
        setPoseReady(Boolean(engine.posenet || engine.mediapipe));
        if (!engine.posenet && !engine.mediapipe) {
          setPoseError('No pose model could load. Check your connection and reload.');
        }
      })
      .catch(() => {
        if (!cancelled) setPoseError('The pose engine failed to start. Check your connection and reload.');
      });
    return () => {
      cancelled = true;
      poseEngineRef.current?.dispose();
      poseEngineRef.current = null;
    };
  }, []);

  // ---- Pose detection on the current frame (sync offline, async online) ----
  const analyse = useCallback(async (): Promise<{ energy: number; cx: number; cy: number; leftWrist: { x: number; y: number } | null; rightWrist: { x: number; y: number } | null; handsUp: boolean; frame: PoseFrame | null }> => {
    const video = videoRef.current;
    const engine = poseEngineRef.current;
    if (!video || !engine || video.readyState < 2) {
      return { energy: 0, cx: 0.5, cy: 0.5, leftWrist: null, rightWrist: null, handsUp: false, frame: null };
    }

    let frame: PoseFrame | null = null;
    if (engine.posenet) {
      frame = await engine.posenet.detectAsync(video);
    } else if (engine.mediapipe) {
      frame = engine.mediapipe.detect(video, performance.now());
    }
    if (!frame) {
      return { energy: 0, cx: 0.5, cy: 0.5, leftWrist: null, rightWrist: null, handsUp: false, frame: null };
    }

    // Real body parts from the skeleton (canonical POSE_PARTS indices).
    const part = (idx: number) => frame!.landmarks[idx] ?? null;
    const leftWristLm = part(POSE_PARTS.leftWrist);
    const rightWristLm = part(POSE_PARTS.rightWrist);
    const nose = part(POSE_PARTS.nose);

    const leftWrist = leftWristLm && leftWristLm.confidence > 0.35 ? { x: leftWristLm.x, y: leftWristLm.y } : null;
    const rightWrist = rightWristLm && rightWristLm.confidence > 0.35 ? { x: rightWristLm.x, y: rightWristLm.y } : null;

    // Whole-body motion energy: how far the wrists moved since last frame.
    const prev = prevWristsRef.current;
    let motion = 0;
    if (leftWrist && prev.left) motion += Math.hypot(leftWrist.x - prev.left.x, leftWrist.y - prev.left.y);
    if (rightWrist && prev.right) motion += Math.hypot(rightWrist.x - prev.right.x, rightWrist.y - prev.right.y);
    prevWristsRef.current = { left: leftWrist, right: rightWrist };
    const energy = Math.min(1, motion * 4 + frame.confidence * 0.2);

    // Hands up = either wrist clearly above the nose.
    const handsUp = Boolean(
      nose && ((leftWrist && leftWrist.y < nose.y - 0.05) || (rightWrist && rightWrist.y < nose.y - 0.05))
    );

    return { energy, cx: frame.centroidX, cy: frame.centroidY, leftWrist, rightWrist, handsUp, frame };
  }, []);

  // ---- Game loop ----
  useEffect(() => {
    if (!running || !cameraActive || !poseReady) return;
    const BEAT_MS = 2000;
    let alive = true;
    const tick = async (now: number) => {
      if (!alive) return;
      rafRef.current = requestAnimationFrame(tick);
      if (document.hidden) { lastTickRef.current = now; return; }
      const m = await analyse();
      if (!m || !m.frame) return;
      setSkeleton(m.frame);
      setEnergy(m.energy);
      setCentroid({ x: m.cx, y: m.cy });
      setPeakEnergy((p) => Math.max(p, m.energy));

      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setSessionSeconds((s) => s + dt);

      if (mode === 'dance' || mode === 'battle') {
        // Advance the beat target every BEAT_MS; score if the player hit the
        // matching *body part* position (real wrists / hands-up, not pixels).
        if (now - lastBeatRef.current >= BEAT_MS) {
          const target = BEAT_TARGETS[targetIdx % BEAT_TARGETS.length];
          const hit =
            (target.zone === 'left' && m.leftWrist && m.leftWrist.x < 0.5) ||
            (target.zone === 'right' && m.rightWrist && m.rightWrist.x > 0.5) ||
            (target.zone === 'high' && m.handsUp);
          if (mode === 'battle' && battleRef.current?.connected) {
            // Battle: report to the server referee (shared clock + leaderboard),
            // which updates the board for everyone. Local combo mirrors it.
            if (hit) {
              battleRef.current.sendHit(battleBeatIndex);
              const newCombo = combo + 1;
              setCombo(newCombo);
              setBestCombo((b) => Math.max(b, newCombo));
            } else {
              battleRef.current.sendMiss();
              setCombo(0);
            }
            battleRef.current.advance();
          } else {
            // Solo dance: local scoring.
            if (hit) {
              const newCombo = combo + 1;
              setCombo(newCombo);
              setBestCombo((b) => Math.max(b, newCombo));
              setScore((s) => s + 10 + newCombo * 2);
            } else {
              setCombo(0);
            }
          }
          setTargetIdx((i) => i + 1);
          lastBeatRef.current = now;
        }
        setBeatTimer((now - lastBeatRef.current) / BEAT_MS);
      } else {
        // Fitness: count active seconds. With a smartwatch linked, the zone is
        // a real cardio band (elevated pulse) instead of the motion proxy.
        const inZone = bpm !== null ? bpm >= 110 : m.energy >= FITNESS_TARGET;
        if (inZone) setActiveSeconds((s) => s + dt);
      }
    };
    lastBeatRef.current = performance.now();
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [running, cameraActive, poseReady, mode, analyse, targetIdx, combo, bpm, battleBeatIndex]);

  const startSession = () => {
    setScore(0); setCombo(0); setBestCombo(0); setTargetIdx(0);
    setActiveSeconds(0); setPeakEnergy(0); setSessionSeconds(0);
    setRunning(true);
  };

  const endSession = () => {
    setRunning(false);
    // Award XP from the session outcome, through the standard contract.
    if (mode === 'battle') {
      // Battle XP is banked by the server's result event (placement-based);
      // leaving early just closes the session without a false award.
      handleLeaveBattle();
      return;
    }
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
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              Real skeleton pose, on-device
              {poseReady && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                  poseEngineRef.current?.tier === 'posenet'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}>
                  {poseEngineRef.current?.tier === 'posenet' ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {poseEngineRef.current?.tier === 'posenet' ? 'PoseNet HD' : 'Pose Lite (offline)'}
                </span>
              )}
            </p>
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
            onClick={() => setMode('battle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              mode === 'battle' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Dance Battle: real-time multiplayer against your age band (online)"
          >
            <Trophy className="w-3.5 h-3.5" />
            Battle
          </button>
          <button
            onClick={running ? endSession : (mode === 'battle' ? (battleRoom ? startSession : handleJoinBattle) : startSession)}
            disabled={!cameraActive || !poseReady}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 ${
              running
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : mode === 'battle'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
            }`}
            title={!poseReady ? 'Loading the pose model…' : undefined}
          >
            {running ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? (mode === 'battle' ? 'Leave Battle' : 'End & Bank XP') : !poseReady ? 'Loading pose…' : mode === 'battle' ? (battleRoom ? 'Start Battle' : 'Join Battle') : 'Start Session'}
          </button>
        </div>

        {/* Smartwatch link (Web Bluetooth Heart Rate Service) */}
        {hrSupported && (
          <div className="flex items-center gap-2">
            {hrConnection ? (
              <button
                onClick={handleDisconnectWatch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer transition-all"
                title={`Connected to ${hrConnection.deviceName} — tap to disconnect`}
              >
                <Watch className="w-3.5 h-3.5" />
                <span>{bpm !== null ? `${bpm} bpm` : 'Linking…'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            ) : (
              <button
                onClick={handleConnectWatch}
                disabled={hrConnecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                title="Link a heart-rate smartwatch over Bluetooth (standard Heart Rate Service)"
              >
                <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                <span>{hrConnecting ? 'Pairing…' : 'Link Watch'}</span>
              </button>
            )}
          </div>
        )}
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
              {hrSupported && ' Link a heart-rate smartwatch to add your real pulse.'}
            </p>
            {hrError && (
              <p className="mt-3 text-xs text-rose-300 text-center max-w-sm">{hrError}</p>
            )}
            {poseError && (
              <p className="mt-2 text-xs text-amber-300 text-center max-w-sm">{poseError}</p>
            )}
          </div>
        )}

        {cameraActive && (
          <>
            {/* Skeleton overlay: real keypoints from the pose engine, mirrored
                like the video. Wrists + nose get emphasis (the dance targets). */}
            {skeleton && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* bones: shoulders, elbows->wrists, shoulders->hips */}
                {(() => {
                  const lm = skeleton.landmarks;
                  const P = (i: number) => lm[i];
                  const vis = (i: number) => (lm[i]?.confidence ?? 0) > 0.3;
                  const mx = (i: number) => (1 - P(i).x) * 100; // mirrored
                  const my = (i: number) => P(i).y * 100;
                  const bones: [number, number][] = [
                    [POSE_PARTS.leftShoulder, POSE_PARTS.rightShoulder],
                    [POSE_PARTS.leftShoulder, POSE_PARTS.leftElbow],
                    [POSE_PARTS.leftElbow, POSE_PARTS.leftWrist],
                    [POSE_PARTS.rightShoulder, POSE_PARTS.rightElbow],
                    [POSE_PARTS.rightElbow, POSE_PARTS.rightWrist],
                    [POSE_PARTS.leftShoulder, POSE_PARTS.leftHip],
                    [POSE_PARTS.rightShoulder, POSE_PARTS.rightHip],
                    [POSE_PARTS.leftHip, POSE_PARTS.rightHip],
                  ];
                  return bones.map(([a, b], k) =>
                    vis(a) && vis(b) ? (
                      <line key={k} x1={mx(a)} y1={my(a)} x2={mx(b)} y2={my(b)} stroke="#22d3ee" strokeWidth={0.7} opacity={0.75} vectorEffect="non-scaling-stroke" />
                    ) : null
                  );
                })()}
                {/* joints */}
                {skeleton.landmarks.map((lm, i) =>
                  lm.confidence > 0.3 ? (
                    <circle
                      key={i}
                      cx={(1 - lm.x) * 100}
                      cy={lm.y * 100}
                      r={i === POSE_PARTS.leftWrist || i === POSE_PARTS.rightWrist || i === POSE_PARTS.nose ? 1.8 : 1.0}
                      fill={i === POSE_PARTS.leftWrist || i === POSE_PARTS.rightWrist ? '#f59e0b' : i === POSE_PARTS.nose ? '#34d399' : '#22d3ee'}
                      opacity={0.9}
                    />
                  ) : null
                )}
              </svg>
            )}

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

            {/* Score / combo (solo dance) */}
            {running && mode === 'dance' && (
              <div className="absolute top-4 right-4 z-20 text-right">
                <div className="text-3xl font-black text-white font-mono">{score}</div>
                <div className="text-[11px] text-slate-400 font-mono">score</div>
                {combo > 1 && (
                  <div className="mt-1 text-lg font-black text-amber-400 font-mono">x{combo} combo</div>
                )}
              </div>
            )}

            {/* Battle: live leaderboard */}
            {mode === 'battle' && battleRoom && (
              <div className="absolute top-4 right-4 z-20 w-56 p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-2xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  {battleResult ? 'Final Results' : 'Live Leaderboard'}
                </span>
                <div className="mt-2 space-y-1">
                  {(battleLeaderboard.length ? battleLeaderboard : [{ name: 'You', score: 0, combo: 0, bestCombo: 0, hits: 0 }]).map((p, i) => (
                    <div key={p.name} className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-mono ${
                      i === 0 && battleLeaderboard.length ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40' : 'bg-slate-900/60 text-slate-300'
                    }`}>
                      <span className="truncate">{i + 1}. {p.name}</span>
                      <span className="font-bold shrink-0 ml-2">{p.score}</span>
                    </div>
                  ))}
                </div>
                {battleResult?.winner && (
                  <div className="mt-2 pt-2 border-t border-amber-500/30 text-center text-[11px] font-mono text-amber-300">
                    🏆 {battleResult.winner.name} wins!
                  </div>
                )}
              </div>
            )}

            {/* Battle: shared target + beat index */}
            {running && mode === 'battle' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center">
                <div
                  className="px-6 py-3 rounded-2xl font-black text-2xl tracking-widest border-2 shadow-2xl"
                  style={{ color: BEAT_TARGETS[targetIdx % BEAT_TARGETS.length].color, borderColor: BEAT_TARGETS[targetIdx % BEAT_TARGETS.length].color, background: 'rgba(2,6,23,0.8)' }}
                >
                  {BEAT_TARGETS[targetIdx % BEAT_TARGETS.length].label}
                </div>
                <div className="mt-1.5 text-[11px] font-mono text-slate-300">
                  beat {(battleBeatIndex % Math.max(1, battleSequence.length || 8)) + 1} / {battleSequence.length || 8}
                </div>
                <div className="mt-1 h-1.5 w-48 mx-auto rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400 transition-none" style={{ width: `${beatTimer * 100}%` }} />
                </div>
              </div>
            )}

            {/* Battle: connection error */}
            {mode === 'battle' && battleError && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {battleError}
              </div>
            )}

            {/* Fitness HUD */}
            {running && mode === 'fitness' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-72">
                <div className="p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-center">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {bpm !== null ? 'cardio zone' : 'intensity'}</span>
                    <span className={(bpm !== null ? bpm >= 110 : energy >= FITNESS_TARGET) ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {(bpm !== null ? bpm >= 110 : energy >= FITNESS_TARGET) ? 'IN THE ZONE' : 'keep moving'}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${(bpm !== null ? bpm >= 110 : energy >= FITNESS_TARGET) ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(100, bpm !== null ? (bpm / 180) * 100 : energy * 100)}%` }}
                    />
                    <div className="absolute inset-y-0 border-l-2 border-white/70" style={{ left: `${bpm !== null ? (110 / 180) * 100 : FITNESS_TARGET * 100}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-emerald-300 font-bold">{Math.round(activeSeconds)}s</div>
                      <div className="text-[9px] text-slate-500">active</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      {bpm !== null ? (
                        <>
                          <div className="text-rose-400 font-bold flex items-center justify-center gap-1">
                            <Heart className="w-3 h-3 fill-current" /> {bpm}
                          </div>
                          <div className="text-[9px] text-slate-500">bpm (watch)</div>
                        </>
                      ) : (
                        <>
                          <div className="text-cyan-300 font-bold">{Math.round(peakEnergy * 100)}%</div>
                          <div className="text-[9px] text-slate-500">peak</div>
                        </>
                      )}
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
          Motion Gym reads your real skeleton (wrists, elbows, shoulders, hips) from the webcam, on-device — no video
          leaves your device. Online it uses TF.js PoseNet (high-accuracy); offline it uses the bundled MediaPipe Pose
          Lite, so it works with zero internet. {hrSupported && 'Link a smartwatch for a real pulse.'} XP banks to {studentName}&apos;s account on End.
        </p>
      </div>
    </div>
  );
};

export default MotionGymView;
