/**
 * Pulse Lab strip-chart (P5): canvas PPG trace renderer.
 *
 * Draws the student's simulated waveform (solid cyan) and, when given, the
 * Twin Challenge target waveform (dashed amber). Both come from the
 * deterministic server engine (POST /xr/pleth/simulate) - the client never
 * synthesises samples, so what is drawn is exactly what the server re-scores.
 * Fetches are debounced: dragging a slider must not hammer the backend.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';

export interface PlethParams {
  site?: string;
  wavelength?: string;
  heartRate?: number;
  perfusion?: number;
  compliance?: number;
  respirationRate?: number;
  motion?: number;
  skinTone?: number;
}

interface PlethMetrics {
  perfusionIndex: number;
  heartRate: number;
  signalQuality: number;
  diastolicRatio: number;
  notchDepth: number;
  mode: string;
}

interface Trace {
  samples: number[];
  metrics: PlethMetrics;
}

interface Props {
  params: PlethParams;
  /** Published target trace (twin challenges); omit for free exploration. */
  targetParams?: PlethParams | null;
  height?: number;
}

export default function PlethStrip({ params, targetParams, height = 150 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [target, setTarget] = useState<Trace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simulate = useCallback(async (p: PlethParams): Promise<Trace | null> => {
    const res = await fetch(xrApi('/pleth/simulate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
      body: JSON.stringify(p),
    });
    const body = await res.json();
    return body?.success ? ({ samples: body.samples, metrics: body.metrics } as Trace) : null;
  }, []);

  // Re-simulate when any input changes (stringified: params objects are
  // rebuilt every render by the hosts).
  const paramsKey = JSON.stringify(params);
  const targetKey = JSON.stringify(targetParams ?? null);
  useEffect(() => {
    let alive = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      (async () => {
        try {
          const [own, tgt] = await Promise.all([
            simulate(JSON.parse(paramsKey) as PlethParams),
            targetKey && targetKey !== 'null'
              ? simulate(JSON.parse(targetKey) as PlethParams)
              : Promise.resolve(null),
          ]);
          if (!alive) return;
          setTrace(own);
          setTarget(tgt);
          setError(own ? null : 'Waveform unavailable - is the KEV backend running?');
        } catch {
          if (alive) setError('Waveform unavailable - is the KEV backend running?');
        }
      })();
    }, 300);
    return () => {
      alive = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paramsKey, targetKey, simulate]);

  // Render both traces on one scale so "how close am I" is visually honest.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 720;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);

    // Bench-grid backdrop: one column per second of the 8-second window.
    ctx.strokeStyle = 'rgba(51,65,85,0.35)';
    ctx.lineWidth = 1;
    for (let s = 0; s <= 8; s++) {
      const x = Math.round((w * s) / 8) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, height - 0.5); ctx.lineTo(w, height - 0.5); ctx.stroke();

    const ownSamples = trace?.samples ?? [];
    const targetSamples = target?.samples ?? [];
    const all = ownSamples.concat(targetSamples);
    if (!all.length) return;
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    const pad = (hi - lo) * 0.08 + 0.02;
    lo -= pad; hi += pad;
    const mapX = (i: number, n: number) => (w * i) / Math.max(1, n - 1);
    const mapY = (v: number) => height - ((v - lo) / (hi - lo)) * height;

    const drawTrace = (samples: number[], color: string, dashed: boolean) => {
      if (!samples.length) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 2;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      samples.forEach((v, i) => {
        const x = mapX(i, samples.length);
        const y = mapY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawTrace(targetSamples, 'rgba(251,191,36,0.85)', true);
    drawTrace(ownSamples, '#22d3ee', false);
  }, [trace, target, height]);

  const m = trace?.metrics;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="block rounded-md bg-slate-950"
        aria-label="Simulated PPG pulse waveform strip chart"
        role="img"
      />
      {error && <p className="mt-1.5 text-[10px] text-rose-400">{error}</p>}
      {m && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <span>
            PI <span className="text-cyan-300 tabular-nums">{m.perfusionIndex.toFixed(1)}%</span>
          </span>
          <span>
            HR <span className="text-cyan-300 tabular-nums">{m.heartRate.toFixed(0)} bpm</span>
          </span>
          <span>
            quality <span className="text-cyan-300 tabular-nums">{m.signalQuality.toFixed(0)}%</span>
          </span>
          <span>
            diastolic ratio <span className="text-cyan-300 tabular-nums">{m.diastolicRatio.toFixed(0)}%</span>
          </span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-wide text-slate-300">
            {m.mode}
          </span>
          {target && (
            <span className="flex items-center gap-1 text-amber-300">
              <span className="inline-block h-0 w-5 border-t-2 border-dashed border-amber-400" />
              target
            </span>
          )}
        </div>
      )}
    </div>
  );
}
