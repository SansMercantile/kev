import React, { useState } from 'react';
import {
  Compass,
  RotateCcw,
  Camera,
  Glasses,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  HelpCircle,
  Eye,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  labName: string;
  onClose: () => void;
  onLaunchAR?: () => void;
  onLaunchVR?: () => void;
}

const STEPS = [
  {
    id: 'spatial-navigation',
    title: '3D Spatial Navigation & Orbit Controls',
    category: 'Spatial Controls',
    icon: Compass,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/40',
    tag: 'Mouse / Touch Gestures',
    description:
      'Interact with live 3D models with high-precision camera gestures designed for spatial scientific analysis.',
    features: [
      { key: 'Left Click + Drag', action: 'Orbit and inspect specimen from any 360° angle' },
      { key: 'Scroll Wheel / Pinch', action: 'Zoom into molecular bonds, organelle cristae, or planetary rings' },
      { key: 'Right Click + Drag', action: 'Pan spatial viewport along X/Y axes' },
      { key: 'Reset View Button', action: 'Instantly re-center focal point on the active scientific specimen' },
    ],
  },
  {
    id: 'ar-pass-through',
    title: 'Augmented Reality & Laser Hit-Test Ruler',
    category: 'AR Tools',
    icon: Camera,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/40',
    tag: 'Webcam / Device Camera',
    description:
      'Project virtual scientific specimens onto your actual desk or physical classroom floor using live video pass-through.',
    features: [
      { key: 'AR Pass-Through Button', action: 'Activates camera overlay with alpha-blended 3D WebGL rendering' },
      { key: 'Hit-Test Laser Ruler', action: 'Click points on your desk to measure spatial distances in cm, mm, and inches' },
      { key: 'Log to Notebook', action: 'One-click measurement capture that records bond lengths directly to your report' },
      { key: 'High-Res Photo Capture', action: 'Take high-definition evidence photos with timestamp watermarks' },
    ],
  },
  {
    id: 'stereoscopic-vr',
    title: 'Stereoscopic VR Dual-Optics Display',
    category: 'Immersive XR',
    icon: Glasses,
    color: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-500/40',
    tag: 'Meta Quest / Vision Pro / Cardboard',
    description:
      'Experience true binocular depth perception with split-screen stereoscopic optics calibrated for XR headsets.',
    features: [
      { key: 'Stereoscopic VR Button', action: 'Splits viewport into calibrated Left and Right eye optical frustums' },
      { key: 'Interpupillary Distance (IPD)', action: 'Fine-tune eye spacing between 58mm and 72mm for optical comfort' },
      { key: 'Fullscreen Immersive Mode', action: 'Expands viewport to full display with zero browser chrome' },
      { key: 'Spatial Audio Cue', action: 'Synthesizes 3D directional frequencies matching physical reactions' },
    ],
  },
  {
    id: 'tutor-notebook',
    title: 'Stateless AI Tutor & Scientific Lab Notebook',
    category: 'Empirical Verification',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/40',
    tag: 'Empirical Workflow',
    description:
      'Ask the faculty tutors for instant mathematical guidance and compile your observations into formal PDF lab reports.',
    features: [
      { key: 'Ask Professor KEV', action: 'Stateless on-demand Socratic guidance explaining physical laws and constants' },
      { key: 'Snapshot Camera', action: 'Capture visual snapshots of critical simulation states with one click' },
      { key: 'Filter & Search', action: 'Organize your laboratory notebook entries by discipline and keywords' },
      { key: 'Export Academic PDF', action: 'Generate formatted lab reports with charts, formulas, and grades' },
    ],
  },
];

export const LabGettingStartedOverlay: React.FC<Props> = ({
  labName,
  onClose,
  onLaunchAR,
  onLaunchVR,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  const step = STEPS[currentStepIndex];
  const Icon = step.icon;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('kev_lab_tutorial_seen', 'true');
    }
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      /* ignore */
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Top Header Banner */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${step.color} text-white shadow-md`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Welcome to the {labName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold">
                  XR Orientation Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spatial navigation & AR/VR laboratory capabilities
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Step Indicator */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-8 bg-cyan-400'
                    : idx < currentStepIndex
                    ? 'w-4 bg-cyan-600'
                    : 'w-4 bg-slate-800'
                }`}
                title={s.title}
              />
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {/* Main Title & Description */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                {step.category}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                {step.tag}
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step.description}</p>
          </div>

          {/* Features / Gesture Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {step.features.map((item, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {item.key}
                </span>
                <span className="text-xs text-slate-300 mt-1 leading-snug">{item.action}</span>
              </div>
            ))}
          </div>

          {/* Contextual Quick Actions (e.g. Try AR Now button) */}
          {step.id === 'ar-pass-through' && onLaunchAR && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-xs text-emerald-200">Want to test the AR ruler on your desk right now?</span>
              <button
                onClick={() => {
                  onClose();
                  onLaunchAR();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Launch AR Tool</span>
              </button>
            </div>
          )}

          {step.id === 'stereoscopic-vr' && onLaunchVR && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
              <span className="text-xs text-purple-200">Have a VR headset or cardboard viewer ready?</span>
              <button
                onClick={() => {
                  onClose();
                  onLaunchVR();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs cursor-pointer"
              >
                <Glasses className="w-3.5 h-3.5" />
                <span>Launch Split VR</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Don't show this orientation automatically</span>
          </label>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-md shadow-cyan-500/20"
              >
                <span>Next Feature</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-lg shadow-cyan-500/25"
              >
                <span>Enter Laboratory Simulation</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
