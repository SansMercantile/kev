import React, { useState } from 'react';
import {
  X,
  Users,
  Wrench,
  Sparkles,
  MapPin,
  CheckCircle,
  ExternalLink,
  Info,
  Layers,
  Activity,
  Calculator,
  Music,
  BookOpen,
  Utensils,
  Dumbbell
} from 'lucide-react';
import { FloorArchitectureFacility } from '../../types';

interface Props {
  facility: FloorArchitectureFacility | null;
  onClose: () => void;
  onNavigateToFloor?: (floor: number) => void;
}

export const FacilityDetailModal: React.FC<Props> = ({
  facility,
  onClose,
  onNavigateToFloor,
}) => {
  const [activeSimulationTab, setActiveSimulationTab] = useState<'overview' | 'interactive'>('overview');
  // Interactive mini-states based on facility type
  const [calcInput, setCalcInput] = useState('sin(x) * e^(-0.1 * x)');
  const [pianoNote, setPianoNote] = useState<string | null>(null);
  const [dietarySelection, setDietarySelection] = useState<string>('Gluten-Free High-Protein');
  const [gymRepCount, setGymRepCount] = useState<number>(12);

  if (!facility) return null;

  const getFloorNumber = (level: string): number => {
    switch (level) {
      case 'ground': return 1;
      case 'first': return 1;
      case 'second': return 2;
      case 'third': return 3;
      case 'basement': return 1;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  {facility.levelDisplayName}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono capitalize bg-slate-800 text-slate-300">
                  {facility.type.replace('_', ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  facility.status === 'Open'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                }`}>
                  {facility.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{facility.facility}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Design Capacity</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {facility.capacity}{' '}
                <span className="text-xs text-slate-400 font-normal">occupants</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                <span>Virtual Tools Equipped</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {facility.equipmentAndTools.length}{' '}
                <span className="text-xs text-slate-400 font-normal">systems</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>XR Interactive Mode</span>
              </div>
              <div className="text-sm font-semibold text-emerald-300">
                WebXR 3D Spatial Ready
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Facility Architectural Purpose
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {facility.description}
            </p>
          </div>

          {/* Equipment & Virtual Tools Breakdown */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Standard Equipment & Virtual Instrumentation</span>
              <span className="text-[11px] text-cyan-400 font-mono">Official KEV Specification</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {facility.equipmentAndTools.map((tool, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-[10px]">
                    {idx + 1}
                  </div>
                  <span className="font-mono text-cyan-300">{tool.replace(/_/g, ' ')}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Facility Tool Preview */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-cyan-950/30 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">Live Virtual Tool Interactive Demonstration</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Visitor Sandbox
              </span>
            </div>

            {/* Custom interactive view based on facility */}
            {facility.interactivePreviewId === 'math' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Try entering an equation into the virtual calculator & graphing sandbox:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    placeholder="Enter algebraic formula..."
                  />
                  <button
                    onClick={() => setCalcInput('cos(2*pi*f*t) + 0.5 * sin(4*pi*f*t)')}
                    className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Plot Harmonic
                  </button>
                </div>
                <div className="h-20 bg-slate-950 rounded-lg border border-slate-800 p-2 flex items-center justify-center font-mono text-xs text-emerald-400">
                  <span>Graphing Result: f(x) = {calcInput} [Real-time Fourier Transform Active]</span>
                </div>
              </div>
            )}

            {facility.interactivePreviewId === 'cafeteria' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Main Cafeteria Nutrition & Allergen Filter:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Gluten-Free High-Protein', 'Halal Balanced Meal', 'Vegan Organic Bowl', 'Kosher Certified Option', 'Nut-Free Recovery'].map((diet) => (
                    <button
                      key={diet}
                      onClick={() => setDietarySelection(diet)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        dietarySelection === diet
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300">Selected Plan: {dietarySelection}</span>
                  <span className="text-emerald-400">Caloric Target: 650 kcal · Allergen Safe</span>
                </div>
              </div>
            )}

            {facility.interactivePreviewId === 'music' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Acoustic Studio Virtual Piano Keyboard (Click a key to trigger harmonic):
                </p>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'].map((note) => (
                    <button
                      key={note}
                      onClick={() => setPianoNote(note)}
                      className={`px-3.5 py-4 rounded-md font-mono text-xs font-bold transition-all ${
                        pianoNote === note
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-95'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
                {pianoNote && (
                  <p className="text-xs font-mono text-amber-300">
                    Acoustic frequency generated: {pianoNote} tuned to 440 Hz concert pitch (Stereo Spatial Reverb active).
                  </p>
                )}
              </div>
            )}

            {facility.interactivePreviewId === 'gym' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Gymnasium Performance Telemetry & Torque Sensors:
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setGymRepCount(c => c + 1)}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Log Repetition (+1)
                  </button>
                  <span className="text-xs font-mono text-teal-300">
                    Current Biomechanical Reps: <strong className="text-white text-sm">{gymRepCount}</strong> (Velocity: 1.4 m/s)
                  </span>
                </div>
              </div>
            )}

            {/* Fallback for other facilities */}
            {!['math', 'cafeteria', 'music', 'gym'].includes(facility.interactivePreviewId || '') && (
              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  This facility is networked into the KEV Central Autonomous System (Domain: Policy, Education & Multispecies).
                  XR spatial headsets provide telemetry overlays directly to admitted scholars.
                </p>
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry Broadcast Frequency: 120 Hz Low-Latency Sync</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close Directory
          </button>
          {onNavigateToFloor && (
            <button
              onClick={() => {
                onNavigateToFloor(getFloorNumber(facility.level));
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-cyan-600/20"
            >
              <span>Explore Floor in 3D Campus</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
