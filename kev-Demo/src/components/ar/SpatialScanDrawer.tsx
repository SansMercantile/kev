import React, { useState } from 'react';
import {
  Scan,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FlaskConical,
  Orbit,
  Eye,
  Dna,
  X,
  Zap,
  CheckCircle2,
  Layers,
  Camera,
  RefreshCw
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { useToast } from '../toast/ToastContext';
import { LabId } from '../../types';

export interface SuggestedExperiment {
  labId: string;
  title: string;
  action: string;
  reason: string;
  xpReward: number;
}

export interface DetectedDeskObject {
  id: string;
  objectName: string;
  category: string;
  confidence: number;
  physicalProperties: Record<string, string>;
  scientificSignificance: string;
  suggestedExperiments: SuggestedExperiment[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanTrigger: () => Promise<string | null>; // Returns base64 image from AR camera
  onSelectExperiment?: (labId: LabId) => void;
}

export const SpatialScanDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onScanTrigger,
  onSelectExperiment,
}) => {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectedObject, setDetectedObject] = useState<DetectedDeskObject | null>(null);
  const [availableObjects, setAvailableObjects] = useState<DetectedDeskObject[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const executeScan = async (hintKey?: string) => {
    setIsScanning(true);
    try {
      soundManager.playClick();
      // Get frame from parent camera
      const frameBase64 = await onScanTrigger();

      const res = await fetch('/api/ai/spatial-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          deskObjectHint: hintKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.detectedObject) {
        setDetectedObject(data.detectedObject);
        setAvailableObjects(data.availableDeskObjects || []);
        setAiInsight(data.liveVisionAnalysis);
        soundManager.playSuccess();
        showToast({
          type: 'badge',
          title: 'Spatial AI Object Identified',
          message: `Detected: ${data.detectedObject.objectName} (Confidence: ${Math.round(data.detectedObject.confidence * 100)}%)`,
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Scan Error',
        message: 'Could not complete AI spatial object recognition.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getLabIcon = (labId: string) => {
    switch (labId) {
      case 'chemistry':
        return <FlaskConical className="w-4 h-4 text-rose-400" />;
      case 'astrophysics':
        return <Orbit className="w-4 h-4 text-violet-400" />;
      case 'optics':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'cellular_biology':
        return <Dna className="w-4 h-4 text-emerald-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-40 w-full sm:w-96 p-4 sm:p-5 bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/40 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-4 duration-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Spatial Desk Scanner
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                  AI Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Identify physical desk objects & link to virtual labs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Now Trigger Button */}
        <button
          onClick={() => executeScan()}
          disabled={isScanning}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning Physical Desk Space...</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Scan Desk Objects With Camera</span>
            </>
          )}
        </button>

        {/* Object Quick Switcher Pills */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
            Or Select Known Physical Anchor:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              { id: 'water_bottle', label: 'Water Bottle / Cup' },
              { id: 'desk_lamp', label: 'Desk Lamp / Light' },
              { id: 'ball_sphere', label: 'Ball / Sphere' },
              { id: 'plant_leaf', label: 'Plant Leaf' },
              { id: 'eyeglass_lens', label: 'Eyeglasses / Lens' },
              { id: 'notebook_pen', label: 'Notebook & Pen' },
            ].map((obj) => (
              <button
                key={obj.id}
                onClick={() => executeScan(obj.id)}
                className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all cursor-pointer truncate ${
                  detectedObject?.id.includes(obj.id)
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {obj.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detected Object Details */}
        {detectedObject && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  {detectedObject.category}
                </span>
                <h4 className="text-base font-bold text-white leading-tight">
                  {detectedObject.objectName}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {Math.round(detectedObject.confidence * 100)}% Confidence
              </span>
            </div>

            {/* AI Vision Insight */}
            {aiInsight && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                <span className="text-cyan-400 font-mono text-[10px] font-bold block mb-1">
                  AI Vision Telemetry:
                </span>
                {aiInsight}
              </div>
            )}

            {/* Physical Properties Grid */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Intrinsic Physical Properties:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {Object.entries(detectedObject.physicalProperties).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                    <span className="text-slate-500 text-[9px] uppercase block truncate">{k}</span>
                    <span className="text-slate-200 font-semibold truncate block">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Virtual Lab Experiments */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                  Suggested Virtual Labs
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {detectedObject.suggestedExperiments.length} Available
                </span>
              </div>

              <div className="space-y-2">
                {detectedObject.suggestedExperiments.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {getLabIcon(exp.labId)}
                        <span className="text-xs font-bold text-white">{exp.title}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        +{exp.xpReward} XP
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {exp.reason}
                    </p>

                    <button
                      onClick={() => {
                        soundManager.playSuccess();
                        showToast({
                          type: 'badge',
                          title: 'Virtual Lab Experiment Initialized',
                          message: `Mapped ${detectedObject.objectName} to ${exp.title}!`,
                        });
                        if (onSelectExperiment) {
                          onSelectExperiment(exp.labId as LabId);
                        }
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{exp.action}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 font-mono">
          KEV XR Spatial Vision Engine • Real-World Grounding
        </p>
      </div>
    </div>
  );
};
