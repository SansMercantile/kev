/**
 * Smart Lab Sketch-to-Simulation bench.
 *
 * A doodle pad that floats over the lab bench. The student sketches a science
 * diagram - a bent molecule, a triangle crossed by a light ray, a planet and
 * its orbit, a cell, a circuit - and the deterministic recogniser in
 * `src/xr/utils/sketchRecognizer.ts` names what it sees, logs it to the
 * digital science notebook (stroke + symbol + confidence, exportable) and,
 * where a lab can act on it, dispatches `kev:lab-load` with the concrete
 * preset/parameters so the 3D bench loads that exact configuration.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PenTool, Undo2, Trash2, Zap, Download, NotebookPen, X } from 'lucide-react';
import { recogniseSketch, SketchPoint, SketchRecognition, SketchStroke } from '../../utils/sketchRecognizer';

interface NotebookEntry {
  at: string;
  symbol: string;
  label: string;
  confidence: number;
  strokes: number;
  loaded: boolean;
}

interface Props {
  /** Current lab, so the "load into bench" action makes sense in context. */
  activeLab?: string;
  onClose?: () => void;
  /** The action travels along so hosts on other pages (Immersive Lab) can
   *  apply it after navigation - the window event fires before the mount. */
  onOpenLab?: (labId: string, action?: Record<string, unknown> | null) => void;
}

const W = 340;
const H = 240;

export default function SketchBench({ activeLab, onClose, onOpenLab }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const drawing = useRef<{ stroke: SketchPoint[] } | null>(null);
  const [recognition, setRecognition] = useState<SketchRecognition | null>(null);
  const [notebook, setNotebook] = useState<NotebookEntry[]>([]);
  const [showNotebook, setShowNotebook] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // Bench-grid backdrop.
    ctx.strokeStyle = 'rgba(148,163,184,0.10)';
    ctx.lineWidth = 1;
    for (let x = 20; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 20; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const all = drawing.current ? [...strokes, { points: drawing.current.stroke }] : strokes;
    for (const s of all) {
      if (s.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (const p of s.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): SketchPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { stroke: [pointFrom(e)] };
    redraw();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current.stroke.push(pointFrom(e));
    redraw();
  };
  const onPointerUp = () => {
    if (!drawing.current) return;
    const stroke = { points: drawing.current.stroke };
    drawing.current = null;
    if (stroke.points.length >= 2) setStrokes((prev) => [...prev, stroke]);
    setRecognition(null);
  };

  const recogniseAndLoad = useCallback(() => {
    if (!strokes.length) return;
    const result = recogniseSketch(strokes);
    setRecognition(result);
    let loaded = false;
    if (result.lab && result.action) {
      window.dispatchEvent(new CustomEvent('kev:lab-load', { detail: result.action }));
      loaded = true;
      if (onOpenLab && result.lab !== activeLab) onOpenLab(result.lab, result.action);
    }
    setNotebook((prev) => [
      {
        at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        symbol: result.symbol,
        label: result.label,
        confidence: result.confidence,
        strokes: strokes.length,
        loaded,
      },
      ...prev,
    ]);
  }, [strokes, activeLab, onOpenLab]);

  const exportNotebook = useCallback(() => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), entries: notebook }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kev-science-notebook-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notebook]);

  return (
    <div className="absolute bottom-4 left-4 z-30 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-cyan-900/60 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        <PenTool className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-white">Sketch-to-Simulation bench</span>
        <span className="text-[10px] text-slate-500 hidden sm:inline">doodle a diagram - I load it in 3D</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowNotebook((v) => !v)}
            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
            title="Digital science notebook"
          >
            <NotebookPen className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800" title="Close sketch pad">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="w-full rounded-lg bg-slate-900/80 border border-slate-800 touch-none cursor-crosshair"
          aria-label="Sketch pad for lab diagrams"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setStrokes((p) => p.slice(0, -1)); setRecognition(null); }}
            disabled={!strokes.length}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
          <button
            onClick={() => { setStrokes([]); setRecognition(null); }}
            disabled={!strokes.length}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
          <button
            onClick={recogniseAndLoad}
            disabled={!strokes.length}
            className="ml-auto flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium"
          >
            <Zap className="w-3 h-3" /> Recognise &amp; simulate
          </button>
        </div>

        {recognition && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-cyan-300">{recognition.label}</span>
              <span className="text-[10px] text-slate-500 tabular-nums">
                {recognition.confidence}% confidence - {recognition.symbol}
              </span>
            </div>
            {recognition.lab && recognition.action && (
              <div className="mt-1 text-[10px] text-emerald-400">
                Loading into the {recognition.lab} bench...
              </div>
            )}
            <ul className="mt-1 space-y-0.5">
              {recognition.notes.map((n, i) => (
                <li key={i} className="text-[10px] text-slate-400 leading-relaxed">{n}</li>
              ))}
            </ul>
          </div>
        )}

        {showNotebook && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">Digital science notebook</span>
              <button
                onClick={exportNotebook}
                disabled={!notebook.length}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
            {notebook.length === 0 ? (
              <p className="mt-1.5 text-[10px] text-slate-500">Recognised sketches are logged here with their symbol class - export them for your lab report.</p>
            ) : (
              <ul className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
                {notebook.map((entry, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-[10px] text-slate-400">
                    <span className="text-slate-600 tabular-nums">{entry.at}</span>
                    <span className="text-slate-200">{entry.label}</span>
                    <span className="text-slate-600">{entry.symbol}</span>
                    <span className="tabular-nums">{entry.confidence}%</span>
                    {entry.loaded && <span className="text-emerald-500">sim loaded</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
