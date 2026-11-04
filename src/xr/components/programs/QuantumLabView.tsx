import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Play, RotateCcw, Sparkles, TrendingDown, Zap, GitBranch, Scale } from 'lucide-react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';

/**
 * Quantum Optimization Lab — the Ising decoder made visible.
 *
 * Students pick a teaching problem (Max-Cut "Split the Rival Teams" or Number
 * Partition "Share the Treasure Fairly") and the backend's deterministic
 * simulated-annealing solver returns the best assignment *and* the whole
 * cooling trajectory. This view replays that trajectory: the two teams /
 * piles settle as the temperature falls, and the energy curve shows the
 * optimizer freezing into a solution — the same physics a quantum annealer
 * (D-Wave) exploits. The copy is explicit that this is classical annealing,
 * the algorithm family quantum hardware approximates — honest framing, not a
 * quantum-hardware claim.
 */

interface AnnealPoint { sweep: number; temperature: number; energy: number; accepted: number; }
interface AnnealResult {
  spins: number[];
  energy: number;
  initialEnergy: number;
  evaluations: number;
  sweeps: number;
  n: number;
  acceptedMoves: number;
  acceptanceRate: number;
  converged: boolean;
  trajectory: AnnealPoint[];
}
interface TeachingInstance { id: string; title: string; kind: string; story: string; n: number; }

export const QuantumLabView: React.FC = () => {
  const [instances, setInstances] = useState<TeachingInstance[]>([]);
  const [selectedKind, setSelectedKind] = useState<string>('max-cut');
  const [result, setResult] = useState<AnnealResult | null>(null);
  const [instance, setInstance] = useState<TeachingInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0); // sweep index into trajectory
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(0);

  // Load the teaching-instance catalogue once.
  useEffect(() => {
    let cancelled = false;
    fetch(xrApi('/ising/instances'), { headers: xrAuthHeaders() })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setInstances(d.instances || []); })
      .catch(() => { if (!cancelled) setError('Could not load the optimization catalogue (offline?).'); });
    return () => { cancelled = true; };
  }, []);

  const runSolve = () => {
    setLoading(true);
    setError(null);
    setPlaying(false);
    setPlayhead(0);
    fetch(xrApi('/ising/solve-instance'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
      body: JSON.stringify({ kind: selectedKind, seed: 1, restarts: 6, sweeps: 800 }),
    })
      .then((r) => r.json())
      .then((d) => {
        setResult(d.result);
        setInstance(d.instance);
        setLoading(false);
      })
      .catch(() => {
        setError('The solver did not answer — check the backend is running.');
        setLoading(false);
      });
  };

  // Animate the replay while playing: advance the playhead through sweeps.
  useEffect(() => {
    if (!playing || !result) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayhead((p) => {
        const next = p + dt * 60; // ~60 sweeps/sec replay
        if (next >= result.trajectory.length - 1) {
          setPlaying(false);
          return result.trajectory.length - 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, result]);

  const idx = result ? Math.min(result.trajectory.length - 1, Math.floor(playhead)) : 0;
  const current: AnnealPoint | null = result ? result.trajectory[idx] : null;

  // Energy-curve SVG path (the whole trajectory, with a playhead marker).
  const curve = useMemo(() => {
    if (!result || result.trajectory.length < 2) return null;
    const W = 560, H = 160, pad = 12;
    const es = result.trajectory.map((t) => t.energy);
    const eMin = Math.min(...es), eMax = Math.max(...es);
    const span = Math.max(1e-6, eMax - eMin);
    const x = (i: number) => pad + (i / (result.trajectory.length - 1)) * (W - 2 * pad);
    const y = (e: number) => H - pad - ((e - eMin) / span) * (H - 2 * pad);
    let d = `M ${x(0)} ${y(es[0])}`;
    for (let i = 1; i < es.length; i++) d += ` L ${x(i)} ${y(es[i])}`;
    return { d, x, y, W, H, eMin, eMax };
  }, [result]);

  const isPartition = instance?.kind === 'number-partition';

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide text-base flex items-center gap-2">
              Quantum Optimization Lab
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30">
                Ising Decoder
              </span>
            </h3>
            <p className="text-xs text-slate-400">Watch a real optimizer cool into a solution — the physics quantum annealers use</p>
          </div>
        </div>

        {/* Problem selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          {(['max-cut', 'number-partition'] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => setSelectedKind(kind)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedKind === kind
                  ? 'bg-violet-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {kind === 'max-cut' ? <GitBranch className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
              {kind === 'max-cut' ? 'Split the Teams' : 'Share the Treasure'}
            </button>
          ))}
          <button
            onClick={runSolve}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? 'Solving…' : result ? 'Solve Again' : 'Run the Optimizer'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {!result && !loading && (
          <div className="grid gap-3 md:grid-cols-2">
            {instances.map((inst) => (
              <button
                key={inst.id}
                onClick={() => { setSelectedKind(inst.kind); }}
                className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedKind === inst.kind
                    ? 'bg-violet-500/10 border-violet-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {inst.kind === 'max-cut' ? <GitBranch className="w-4 h-4 text-violet-400" /> : <Scale className="w-4 h-4 text-amber-400" />}
                  <span className="font-bold text-white text-sm">{inst.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono ml-auto">{inst.n} variables</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{inst.story}</p>
                <p className="mt-3 text-[11px] font-mono text-violet-300">
                  {inst.kind === 'max-cut' ? 'Ising / QUBO — the problem quantum annealers are famous for' : 'Number Partitioning — fair division & load balancing'}
                </p>
              </button>
            ))}
            {instances.length === 0 && !error && (
              <p className="text-xs text-slate-500 col-span-2">Loading the optimization catalogue…</p>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>
        )}

        {result && instance && (
          <>
            {/* Story + result summary */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400">{instance.title}</span>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{instance.story}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-white font-mono">{result.energy.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">best energy</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-300 font-mono">{(result.acceptanceRate * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">moves accepted</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold font-mono ${result.converged ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {result.converged ? 'Yes' : 'Partial'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">converged</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Replay controls + live state */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-violet-400" />
                  Annealing replay
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPlaying((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    {playing ? 'Pause' : 'Replay'}
                  </button>
                  <button
                    onClick={() => { setPlaying(false); setPlayhead(0); }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Back to the start"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Playhead slider */}
              <input
                type="range"
                min={0}
                max={result.trajectory.length - 1}
                value={idx}
                onChange={(e) => { setPlaying(false); setPlayhead(Number(e.target.value)); }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400 mb-3"
              />

              {/* Live readout */}
              {current && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">temperature</div>
                    <div className="text-cyan-300 font-bold">{current.temperature.toFixed(3)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">current energy</div>
                    <div className="text-emerald-300 font-bold">{current.energy.toFixed(3)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">sweep</div>
                    <div className="text-white font-bold">{current.sweep} / {result.sweeps}</div>
                  </div>
                </div>
              )}

              {/* Energy curve */}
              {curve && (
                <svg viewBox={`0 0 ${curve.W} ${curve.H}`} className="w-full rounded-lg bg-slate-950 border border-slate-800">
                  <path d={curve.d} fill="none" stroke="#8b5cf6" strokeWidth={1.6} />
                  {/* best-energy line */}
                  <line
                    x1={0} x2={curve.W}
                    y1={curve.y(result.energy)} y2={curve.y(result.energy)}
                    stroke="#34d399" strokeWidth={1} strokeDasharray="4 4" opacity={0.7}
                  />
                  {/* playhead */}
                  {current && (
                    <circle cx={curve.x(idx)} cy={curve.y(current.energy)} r={4} fill="#22d3ee" stroke="#0e7490" strokeWidth={1.5} />
                  )}
                  {/* temperature tint (hot left, cold right) */}
                  <text x={8} y={14} fill="#64748b" fontSize={9} fontFamily="monospace">hot</text>
                  <text x={curve.W - 28} y={14} fill="#64748b" fontSize={9} fontFamily="monospace">cold</text>
                </svg>
              )}
            </div>

            {/* The assignment (teams or piles) */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/30">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {isPartition ? 'Pile A' : 'Team Cyan'}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.spins.map((s, i) => (isPartition ? s === 0 : s === -1) && (
                    <span key={i} className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-200 text-xs font-mono border border-cyan-500/30">
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {isPartition ? 'Pile B' : 'Team Amber'}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.spins.map((s, i) => (isPartition ? s === 1 : s === 1) && (
                    <span key={i} className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-200 text-xs font-mono border border-amber-500/30">
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Honest framing */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <span>
                This is <strong className="text-slate-200">simulated annealing</strong> — a real classical optimizer that
                cools from random flips (high temperature) to careful ones (low temperature), settling into a low-energy
                answer. Quantum annealers like D-Wave use quantum physics to explore the same kind of energy landscape
                faster. {result.evaluations.toLocaleString()} energy checks across {result.sweeps} sweeps, fully deterministic — re-running it gives the identical answer.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuantumLabView;
