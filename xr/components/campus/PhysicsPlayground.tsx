import React, { useState, useEffect, useRef } from 'react';
import { PhysicsEnvironmentConfig, StudentStats } from '../../types';
import { Sliders, Play, RotateCcw, Sparkles, Orbit, Gauge, Compass, Zap, Target, ArrowLeft, Layers, Activity } from 'lucide-react';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  studentStats: StudentStats;
  onAwardXP: (xp: number, reason: string) => void;
  onBackToCampus: () => void;
}

/**
 * Gravity presets.
 *
 * These used to be `Partial<PhysicsEnvironmentConfig>` and set only the two
 * `surface*` fields, while the simulation reads `config.surfaceElasticity` and
 * `config.surfaceFriction` directly. Because those fields are optional on the
 * type, any config that lacked them produced `undefined` arithmetic — NaN
 * trajectories — and `config.surfaceElasticity.toFixed(2)` in the UI threw.
 *
 * Each preset is now a complete config: `friction`/`elasticity` carry the same
 * physical quantities as their `surface*` counterparts, and `presetName` is set
 * so a config always knows which world it describes.
 */
const PRESETS: { [key: string]: PhysicsEnvironmentConfig } = {
  earth: {
    gravity: 9.81,
    airResistance: 0.02,
    friction: 0.1,
    elasticity: 0.75,
    surfaceElasticity: 0.75,
    surfaceFriction: 0.1,
    timeScale: 1.0,
    presetName: 'earth',
  },
  moon: {
    gravity: 1.62,
    airResistance: 0.0,
    friction: 0.05,
    elasticity: 0.85,
    surfaceElasticity: 0.85,
    surfaceFriction: 0.05,
    timeScale: 1.0,
    presetName: 'moon',
  },
  mars: {
    gravity: 3.72,
    airResistance: 0.005,
    friction: 0.08,
    elasticity: 0.78,
    surfaceElasticity: 0.78,
    surfaceFriction: 0.08,
    timeScale: 1.0,
    presetName: 'mars',
  },
  jupiter: {
    gravity: 24.79,
    airResistance: 0.08,
    friction: 0.25,
    elasticity: 0.6,
    surfaceElasticity: 0.6,
    surfaceFriction: 0.25,
    timeScale: 1.0,
    presetName: 'jupiter',
  },
  zero_g: {
    gravity: 0.0,
    airResistance: 0.0,
    friction: 0.01,
    elasticity: 0.95,
    surfaceElasticity: 0.95,
    surfaceFriction: 0.01,
    timeScale: 1.0,
    presetName: 'zero_g',
  },
};

/**
 * Restitution and friction with guaranteed numeric values.
 *
 * The `surface*` fields stay optional on the shared type (other callers may not
 * set them), so the integrator resolves them here rather than risking NaN.
 */
function restitutionOf(config: PhysicsEnvironmentConfig): number {
  return config.surfaceElasticity ?? config.elasticity ?? 0.75;
}

function surfaceFrictionOf(config: PhysicsEnvironmentConfig): number {
  return config.surfaceFriction ?? config.friction ?? 0.1;
}

export const PhysicsPlayground: React.FC<Props> = ({ studentStats, onAwardXP, onBackToCampus }) => {
  const { showToast } = useToast();

  // Full config from the start: the previous literal omitted the required
  // `friction`, `elasticity` and `presetName`, so the integrator could read
  // undefined surface properties before a preset was ever applied.
  const [config, setConfig] = useState<PhysicsEnvironmentConfig>({ ...PRESETS.earth });

  const [activePreset, setActivePreset] = useState<string>('earth');
  const [launchAngle, setLaunchAngle] = useState<number>(45); // degrees
  const [launchSpeed, setLaunchSpeed] = useState<number>(25); // m/s
  const [massKg, setMassKg] = useState<number>(2.5); // kg

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [trajectoryPoints, setTrajectoryPoints] = useState<{ x: number; y: number }[]>([]);
  const [maxHeightReached, setMaxHeightReached] = useState<number>(0);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [flightTimeSec, setFlightTimeSec] = useState<number>(0);
  const [targetHits, setTargetHits] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Target coordinates in simulation units (meters)
  const targetX = 42;
  const targetRadius = 3;

  const handleApplyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const p = PRESETS[presetKey];
    if (p) {
      setConfig((prev) => ({ ...prev, ...p }));
      showToast({
        type: 'info',
        title: `Gravity Preset: ${presetKey.toUpperCase()}`,
        message: `Applied ${presetKey} gravitation (${p.gravity} m/s²) and atmospheric drag coefficients.`,
      });
    }
  };

  // Launch Projectile
  const handleLaunch = () => {
    soundManager.playClick();
    setIsSimulating(true);
    setTrajectoryPoints([]);
    setMaxHeightReached(0);
    setDistanceTraveled(0);
    setFlightTimeSec(0);

    const rad = (launchAngle * Math.PI) / 180;
    let vx = launchSpeed * Math.cos(rad);
    let vy = launchSpeed * Math.sin(rad);
    let x = 2; // start at ground offset
    let y = 1;
    let t = 0;
    const dt = 0.02 * config.timeScale;

    const points: { x: number; y: number }[] = [{ x, y }];
    let peakY = y;
    let hitTargetAwarded = false;

    const interval = setInterval(() => {
      t += dt;

      // Forces: Gravity + Quadratic Drag
      const vMag = Math.sqrt(vx * vx + vy * vy);
      const dragForce = 0.5 * config.airResistance * vMag * vMag;
      const dragAx = vMag > 0 ? (dragForce * (vx / vMag)) / massKg : 0;
      const dragAy = vMag > 0 ? (dragForce * (vy / vMag)) / massKg : 0;

      const ax = -dragAx;
      const ay = -config.gravity - dragAy;

      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;

      if (y > peakY) peakY = y;

      // Check collision with Target
      const distToTarget = Math.sqrt((x - targetX) ** 2 + (y - 2) ** 2);
      if (distToTarget <= targetRadius && !hitTargetAwarded) {
        hitTargetAwarded = true;
        setTargetHits((prev) => prev + 1);
        soundManager.playSuccess();
        onAwardXP(25, 'Direct Target Impact in Physics Playground');
        showToast({
          type: 'success',
          title: 'Direct Target Impact!',
          message: `Projectile collided with target at ${x.toFixed(1)}m. +25 XP awarded!`,
        });
      }

      // Ground Collision with Restitution and Friction
      if (y <= 0) {
        y = 0;
        vy = -vy * restitutionOf(config);
        vx = vx * (1 - surfaceFrictionOf(config));

        if (Math.abs(vy) < 0.8) {
          // Stop bouncing
          vy = 0;
          vx = 0;
          clearInterval(interval);
          setIsSimulating(false);
        }
      }

      points.push({ x, y });
      setTrajectoryPoints([...points]);
      setMaxHeightReached(Math.round(peakY * 10) / 10);
      setDistanceTraveled(Math.round(x * 10) / 10);
      setFlightTimeSec(Math.round(t * 10) / 10);

      // Timeout safety
      if (t > 15 || x > 150) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 20);
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / 60; // 60 meters wide view

    ctx.clearRect(0, 0, width, height);

    // Sky Background gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    if (activePreset === 'mars') {
      sky.addColorStop(0, '#451a03');
      sky.addColorStop(1, '#1c1917');
    } else if (activePreset === 'moon' || activePreset === 'zero_g') {
      sky.addColorStop(0, '#09090b');
      sky.addColorStop(1, '#020617');
    } else {
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(1, '#020617');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Ground line
    const groundY = height - 40;
    ctx.fillStyle = activePreset === 'mars' ? '#78350f' : '#334155';
    ctx.fillRect(0, groundY, width, 40);

    // Distance Markers on Ground
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    for (let d = 0; d <= 60; d += 10) {
      const px = d * scale;
      ctx.fillRect(px, groundY, 1, 8);
      ctx.fillText(`${d}m`, px + 2, groundY + 18);
    }

    // Target
    const targetPx = targetX * scale;
    const targetPy = groundY - 2 * scale;
    ctx.beginPath();
    ctx.arc(targetPx, targetPy, targetRadius * scale * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Bullseye center
    ctx.beginPath();
    ctx.arc(targetPx, targetPy, targetRadius * scale * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Cannon / Launch pad at x=2
    const cannonBaseX = 2 * scale;
    const cannonBaseY = groundY;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cannonBaseX - 8, cannonBaseY - 12, 16, 12);

    // Cannon barrel rotated by launch angle
    ctx.save();
    ctx.translate(cannonBaseX, cannonBaseY - 12);
    ctx.rotate(-(launchAngle * Math.PI) / 180);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, -5, 24, 10);
    ctx.restore();

    // Draw Trajectory Trace Dots
    if (trajectoryPoints.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      trajectoryPoints.forEach((p, i) => {
        const px = p.x * scale;
        const py = groundY - p.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Current Projectile Head
      const lastPoint = trajectoryPoints[trajectoryPoints.length - 1];
      const curX = lastPoint.x * scale;
      const curY = groundY - lastPoint.y * scale;

      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [trajectoryPoints, activePreset, launchAngle]);

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Top Banner */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-violet-950 via-slate-900 to-slate-950 border border-violet-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                KEV Physics Playground
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30">
                  Universal Gravitational Simulator
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Manipulate environmental constants in real-time. Alter gravitational acceleration, fluid atmospheric drag, and restitution elasticity to test parabolic kinematics and ballistic equations.
            </p>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['earth', 'moon', 'mars', 'jupiter', 'zero_g'] as const).map((presetKey) => (
            <button
              key={presetKey}
              onClick={() => handleApplyPreset(presetKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer font-mono ${
                activePreset === presetKey
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {presetKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Simulation Canvas & Telemetry */}
        <div className="lg:col-span-8 space-y-4">
          {/* Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">Range (Distance)</span>
              <span className="text-base font-bold text-cyan-400">{distanceTraveled} m</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">Max Apex Height</span>
              <span className="text-base font-bold text-amber-400">{maxHeightReached} m</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">Flight Duration</span>
              <span className="text-base font-bold text-emerald-400">{flightTimeSec} s</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">Target Hits</span>
              <span className="text-base font-bold text-rose-400">{targetHits} Impacts</span>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-violet-500/20 bg-slate-950 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full h-full object-cover"
            />

            {/* Trajectory Equation Overlay */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono text-cyan-300">
              <span>y(t) = v₀·sin(θ)·t - ½·g·t²</span>
            </div>

            {/* Launch Action Button Overlay */}
            <div className="absolute bottom-6 right-6 flex items-center gap-3">
              <button
                onClick={handleLaunch}
                disabled={isSimulating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>{isSimulating ? 'Simulating...' : 'Launch Projectile'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Interactive Sliders Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Environmental Constants
                </h3>
              </div>
              <button
                onClick={() => handleApplyPreset('earth')}
                className="text-[10px] text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                Reset to Earth
              </button>
            </div>

            {/* Gravity Slider */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>Gravitational Field (g):</span>
                <span className="font-bold text-violet-400">{config.gravity} m/s²</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                value={config.gravity}
                onChange={(e) => setConfig({ ...config, gravity: Number(e.target.value) })}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>

            {/* Air Resistance */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>Atmospheric Drag (C_d):</span>
                <span className="font-bold text-cyan-400">{config.airResistance.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.1"
                step="0.005"
                value={config.airResistance}
                onChange={(e) => setConfig({ ...config, airResistance: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Surface Elasticity */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>Restitution / Elasticity (e):</span>
                <span className="font-bold text-emerald-400">{restitutionOf(config).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={restitutionOf(config)}
                onChange={(e) => {
                  // Keep both names for the same quantity in step: `elasticity`
                  // is the required field other consumers read, `surfaceElasticity`
                  // is what this integrator prefers.
                  const value = Number(e.target.value);
                  setConfig({ ...config, surfaceElasticity: value, elasticity: value });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Launch Angle */}
            <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-slate-800">
              <div className="flex justify-between items-center text-slate-300">
                <span>Launch Elevation Angle (θ):</span>
                <span className="font-bold text-amber-400">{launchAngle}°</span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                step="1"
                value={launchAngle}
                onChange={(e) => setLaunchAngle(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Initial Velocity */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>Muzzle Velocity (v₀):</span>
                <span className="font-bold text-rose-400">{launchSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={launchSpeed}
                onChange={(e) => setLaunchSpeed(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Projectile Mass */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>Projectile Mass (m):</span>
                <span className="font-bold text-white">{massKg} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={massKg}
                onChange={(e) => setMassKg(Number(e.target.value))}
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
