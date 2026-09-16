import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Eraser,
  HelpCircle,
  PenTool,
  Play,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LabId } from '../../types';

interface SmartSketchToSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLabId?: LabId;
  onSynthesizeSimulation?: (labId: LabId, parameters: any) => void;
  onSaveToNotebook?: (entry: any) => void;
  onAwardXP?: (amount: number, reason: string) => void;
}

export const SmartSketchToSimModal: React.FC<SmartSketchToSimModalProps> = ({
  isOpen,
  onClose,
  activeLabId,
  onSynthesizeSimulation,
  onSaveToNotebook,
  onAwardXP,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokeColor, setStrokeColor] = useState<string>('#38bdf8');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [promptHint, setPromptHint] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisResult, setSynthesisResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw subtle science grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // redraw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    setSynthesisResult(null);
  };

  // Pre-drawn scientific doodles for instant testing
  const handleLoadSampleDoodle = (type: 'molecule' | 'prism' | 'orbit' | 'cell') => {
    handleClear();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'molecule') {
      setPromptHint('Bent water molecule H2O with 2 hydrogen bonds and lone pairs');
      // Central oxygen
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(250, 150, 24, 0, Math.PI * 2);
      ctx.fill();
      // Bonds
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(230, 165);
      ctx.lineTo(160, 230);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(270, 165);
      ctx.lineTo(340, 230);
      ctx.stroke();
      // Hydrogens
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(150, 240, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(350, 240, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'prism') {
      setPromptHint('Equilateral glass prism with laser light refraction');
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(250, 70);
      ctx.lineTo(120, 270);
      ctx.lineTo(380, 270);
      ctx.closePath();
      ctx.stroke();
      // Incident laser beam
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 200);
      ctx.lineTo(180, 180);
      ctx.stroke();
      // Refracted beam inside
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(180, 180);
      ctx.lineTo(290, 200);
      ctx.stroke();
      // Dispersed rainbow exit
      ctx.strokeStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(290, 200);
      ctx.lineTo(440, 230);
      ctx.stroke();
    } else if (type === 'orbit') {
      setPromptHint('Keplerian elliptical planetary orbit around central star');
      // Sun
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(200, 175, 25, 0, Math.PI * 2);
      ctx.fill();
      // Elliptical orbit
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(250, 175, 180, 100, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Planet
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(380, 130, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'cell') {
      setPromptHint('Eukaryotic cell during mitotic metaphase alignment');
      // Cell membrane
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(250, 175, 170, 110, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Spindle fibers
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 175);
      ctx.lineTo(250, 130);
      ctx.lineTo(380, 175);
      ctx.stroke();
      // Chromosomes aligned at equator
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(244, 120, 12, 110);
    }
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    const canvas = canvasRef.current;
    const base64 = canvas ? canvas.toDataURL('image/png') : '';

    try {
      const res = await fetch('/api/ai/sketch-to-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sketchBase64: base64,
          sketchPrompt: promptHint,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSynthesisResult(data);
        confetti({ particleCount: 40 });
        if (onAwardXP) {
          onAwardXP(50, `Smart Sketch-to-3D Synthesis: ${data.synthesis.name}`);
        }
      }
    } catch (e) {
      // client-side fallback
      const hint = promptHint.toLowerCase();
      let lab: LabId = 'chemistry';
      let synthesis: {
        name: string;
        formula: string;
        geometry: string;
        labId: LabId;
        simulationParams: Record<string, any>;
        explanation: string;
      } = {
        name: 'Synthesized Water (H₂O) Bent Conformation',
        formula: 'H₂O',
        geometry: 'Bent (104.5°)',
        labId: 'chemistry',
        simulationParams: { bondAngle: 104.5, lonePairs: 2, electronegativity: 1.24 },
        explanation: 'AutoDraw AI identified two single bonds around a central atom with 2 lone pairs.',
      };

      if (hint.includes('prism') || hint.includes('laser') || hint.includes('refract')) {
        lab = 'optics';
        synthesis = {
          name: 'Crown Glass Equilateral Prism',
          formula: 'SiO₂ Matrix',
          geometry: '60° Equilateral Prism',
          labId: 'optics',
          simulationParams: { refractiveIndex: 1.52, incidentAngle: 45.0 },
          explanation: 'AutoDraw AI identified triangular boundary with light ray dispersion.',
        };
      } else if (hint.includes('orbit') || hint.includes('planet') || hint.includes('kepler')) {
        lab = 'astrophysics';
        synthesis = {
          name: 'Keplerian Eccentric Planetary Orbit',
          formula: 'e = 0.42',
          geometry: 'Elliptical Gravitational Path',
          labId: 'astrophysics',
          simulationParams: { eccentricity: 0.42, orbitalDistance: 4.8 },
          explanation: 'AutoDraw AI identified primary focal star with closed elliptical trajectory.',
        };
      }

      setSynthesisResult({ success: true, targetLabId: lab, synthesis });
      confetti({ particleCount: 30 });
      if (onAwardXP) {
        onAwardXP(50, `Smart Sketch-to-3D Synthesis`);
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleLaunchSimulation = () => {
    if (synthesisResult && onSynthesizeSimulation) {
      onSynthesizeSimulation(synthesisResult.targetLabId, synthesisResult.synthesis.simulationParams);
      onClose();
    }
  };

  const handleSaveToNotebook = () => {
    const canvas = canvasRef.current;
    const base64 = canvas ? canvas.toDataURL('image/png') : '';
    if (onSaveToNotebook && synthesisResult) {
      onSaveToNotebook({
        id: `sketch-${Date.now()}`,
        title: `AutoDraw 3D Synthesis: ${synthesisResult.synthesis.name}`,
        discipline: synthesisResult.targetLabId,
        date: new Date().toISOString().split('T')[0],
        imageData: base64,
        notes: `AI Doodle Synthesis: ${synthesisResult.synthesis.explanation}\nIdentified Geometry: ${synthesisResult.synthesis.geometry}\nTarget Lab: ${synthesisResult.targetLabId}`,
        tags: ['Smart Sketchpad', 'AutoDraw 3D', synthesisResult.targetLabId],
      });
      alert('Vector diagram & simulation synthesis logged to your Lab Notebook!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/70 text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Smart Lab Sketch-to-Simulation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                  AutoDraw AI Engine
                </span>
              </div>
              <p className="text-xs text-cyan-300/80">
                Doodle scientific structures on your bench and instantly synthesize live 3D physics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Doodle Templates */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Instant Doodles:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleLoadSampleDoodle('molecule')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              >
                H₂O Molecule
              </button>
              <button
                onClick={() => handleLoadSampleDoodle('prism')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              >
                Optical Prism
              </button>
              <button
                onClick={() => handleLoadSampleDoodle('orbit')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              >
                Kepler Orbit
              </button>
              <button
                onClick={() => handleLoadSampleDoodle('cell')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              >
                Mitotic Cell
              </button>
            </div>
          </div>

          {/* Canvas & Palette Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Interactive Canvas */}
            <div className="lg:col-span-8 space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={320}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-72 cursor-crosshair touch-none"
                />

                {/* Floating Palette overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-1.5 shadow-lg">
                  {['#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setStrokeColor(c)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        strokeColor === c ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="w-px h-4 bg-slate-700 mx-1" />
                  <button
                    onClick={handleClear}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Clear Canvas"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Optional Prompt / Scientific Hint Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promptHint}
                  onChange={(e) => setPromptHint(e.target.value)}
                  placeholder="Optional hint: e.g., 'Sulfur dioxide bent molecule' or 'Crown glass prism dispersion'..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  disabled={isSynthesizing}
                  onClick={handleSynthesize}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <span>Recognizing...</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                      <span>Synthesize 3D (+50 XP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: AI Synthesis & Action Card */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <PenTool className="w-4 h-4 text-cyan-400" />
                  <span>AI Recognition & 3D Parameters</span>
                </div>

                {synthesisResult ? (
                  <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                    <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-xs">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase block font-bold">
                        Target 3D Discipline: {synthesisResult.targetLabId}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-0.5">
                        {synthesisResult.synthesis.name}
                      </h4>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        {synthesisResult.synthesis.explanation}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Synthesized 3D Vectors
                      </span>
                      <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
                        {Object.entries(synthesisResult.synthesis.simulationParams).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-slate-400 capitalize">{k}:</span>
                            <span className="text-white font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Wand2 className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
                    <p>Draw a molecule, optical prism, Kepler orbit, or mitotic cell above, then click Synthesize.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {synthesisResult && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={handleLaunchSimulation}
                    className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Load onto 3D Workbench</span>
                  </button>
                  <button
                    onClick={handleSaveToNotebook}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Save Diagram to Lab Notebook</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
