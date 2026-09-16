import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  PenTool,
  Eraser,
  RotateCcw,
  Download,
  Plus,
  CheckCircle2,
  Layers,
  FlaskConical,
  Orbit,
  Eye,
  Dna,
  Zap,
  Info,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { useToast } from '../toast/ToastContext';
import { LabId } from '../../types';

interface VectorPreset {
  id: string;
  name: string;
  category: string;
  matchConfidence: number;
  keywords: string[];
  formula: string;
  description: string;
  labTarget: string;
  labModelProps: Record<string, any>;
  svg: string;
}

interface Props {
  onInsertToObservations: (text: string) => void;
  activeLab?: LabId;
  onNavigateToLab?: (labId: LabId) => void;
}

export const SmartSketchpad: React.FC<Props> = ({
  onInsertToObservations,
  activeLab = 'chemistry',
  onNavigateToLab,
}) => {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#38bdf8');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [suggestedVectors, setSuggestedVectors] = useState<VectorPreset[]>([]);
  const [selectedVector, setSelectedVector] = useState<VectorPreset | null>(null);
  const [diagramHint, setDiagramHint] = useState<string>('');
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution
    canvas.width = 640;
    canvas.height = 420;

    // Fill dark background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid dots
    ctx.fillStyle = '#1e293b';
    for (let x = 20; x < canvas.width; x += 30) {
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Load initial presets
    fetch('/api/ai/sketch-convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagramHint: activeLab }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.matches) {
          setSuggestedVectors(data.matches);
          setSelectedVector(data.matches[0]);
        }
      })
      .catch(() => {});
  }, [activeLab]);

  // Drawing event handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = strokeWidth * 3;
    } else {
      ctx.strokeStyle = strokeColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Debounce auto-recognition preview if needed
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid dots
    ctx.fillStyle = '#1e293b';
    for (let x = 20; x < canvas.width; x += 30) {
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    setHasDrawn(false);
    soundManager.playClick();
  };

  // Convert with AutoDraw AI
  const handleAutoDrawConvert = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsConverting(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const res = await fetch('/api/ai/sketch-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sketchBase64: dataUrl,
          diagramHint: diagramHint || activeLab,
        }),
      });

      const data = await res.json();
      if (data.success && data.matches && data.matches.length > 0) {
        setSuggestedVectors(data.matches);
        setSelectedVector(data.matches[0]);
        setAiInsight(data.insight);
        soundManager.playSuccess();
        showToast({
          type: 'badge',
          title: 'AutoDraw AI Match Found',
          message: `Rough sketch matched to: ${data.matches[0].name} (Confidence: ${Math.round(data.matches[0].matchConfidence * 100)}%)`,
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Conversion Error',
        message: 'Could not contact AutoDraw vector converter.',
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Insert vector into notebook observations
  const handleInsertObservation = () => {
    if (!selectedVector) return;
    const noteContent = `[AutoDraw Vector Diagram: ${selectedVector.name}]\nFormula/Law: ${selectedVector.formula}\nDetails: ${selectedVector.description}\nTarget Discipline: ${selectedVector.category}`;
    onInsertToObservations(noteContent);
    soundManager.playSuccess();
    showToast({
      type: 'badge',
      title: 'Diagram Recorded in Notebook',
      message: `${selectedVector.name} added to your lab observations!`,
    });
  };

  // Download SVG file
  const handleDownloadSVG = () => {
    if (!selectedVector) return;
    const blob = new Blob([selectedVector.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedVector.id}-diagram.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    soundManager.playClick();
    showToast({
      type: 'info',
      title: 'SVG Export Complete',
      message: `Downloaded 3D-ready ${selectedVector.name} vector diagram.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top AutoDraw Suggestion Strip (inspired by AutoDraw.com) */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              AutoDraw AI Suggestions: Did you mean?
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {suggestedVectors.length} Matches Detected
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {suggestedVectors.map((preset) => {
            const isSelected = selectedVector?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedVector(preset);
                  soundManager.playClick();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className="w-7 h-7 shrink-0 rounded bg-slate-950 p-0.5 border border-slate-800 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: preset.svg }}
                />
                <div>
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    {Math.round(preset.matchConfidence * 100)}% match • {preset.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sketchpad Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canvas & Tool Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            {/* Tool Selection */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  tool === 'pen' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
                title="Pen Tool"
              >
                <PenTool className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  tool === 'eraser' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
              <button
                onClick={clearCanvas}
                className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear Canvas"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#c084fc', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setStrokeColor(color);
                    if (tool === 'eraser') setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                    strokeColor === color && tool === 'pen' ? 'scale-125 border-white shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Width Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Stroke:</span>
              <input
                type="range"
                min="2"
                max="12"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Interactive HTML5 Drawing Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-72 sm:h-80 cursor-crosshair touch-none block"
            />

            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 text-center bg-slate-950/40">
                <PenTool className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-slate-400">
                  Sketch any rough scientific shape (e.g. hexagon for benzene, prism, ellipse, or lens)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  AutoDraw AI will recognize it and replace it with a clean vector diagram!
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Optional hint: e.g. 'benzene', 'water', 'lens', 'orbit'"
              value={diagramHint}
              onChange={(e) => setDiagramHint(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={handleAutoDrawConvert}
              disabled={isConverting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{isConverting ? 'Analyzing Sketch...' : 'AutoDraw Magic AI'}</span>
            </button>
          </div>
        </div>

        {/* 3D-Ready Vector Diagram Preview & Lab Transfer (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {selectedVector ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                      Standardized Vector Output
                    </span>
                    <h3 className="text-sm font-bold text-white">{selectedVector.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    3D Ready
                  </span>
                </div>

                {/* SVG Vector Render Box */}
                <div className="my-3 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center h-44">
                  <div
                    className="w-full h-full max-w-[200px]"
                    dangerouslySetInnerHTML={{ __html: selectedVector.svg }}
                  />
                </div>

                {/* Formula & Explanatory Metadata */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
                    <span className="text-slate-400">Formula / Law: </span>
                    {selectedVector.formula}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedVector.description}
                  </p>
                </div>

                {aiInsight && (
                  <div className="mt-2 p-2.5 rounded-xl bg-violet-950/30 border border-violet-800/40 text-[11px] text-slate-300">
                    <span className="text-violet-400 font-mono text-[10px] font-bold block">
                      AI Tutor Evaluation:
                    </span>
                    {aiInsight}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleInsertObservation}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Vector into Lab Observations (+15 XP)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadSVG}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download SVG</span>
                  </button>

                  {onNavigateToLab && (
                    <button
                      onClick={() => onNavigateToLab(selectedVector.labTarget as LabId)}
                      className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Launch 3D Lab</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center text-slate-400">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">Draw a sketch or select a suggestion above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
