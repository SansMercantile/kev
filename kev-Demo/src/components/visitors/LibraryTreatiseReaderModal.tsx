import React from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  Award,
  ChevronRight,
  FlaskConical,
  Quote
} from 'lucide-react';
import { HistoricLibraryTreatise, LabId } from '../../types';

interface Props {
  treatise: HistoricLibraryTreatise | null;
  onClose: () => void;
  onNavigateToLab?: (labId: LabId) => void;
}

export const LibraryTreatiseReaderModal: React.FC<Props> = ({
  treatise,
  onClose,
  onNavigateToLab
}) => {
  if (!treatise) return null;

  const getLabIdForTreatise = (discipline: string): LabId => {
    switch (discipline) {
      case 'Optics':
      case 'Quantum Physics':
        return 'optics';
      case 'Genetics':
        return 'biology';
      case 'Astrophysics':
        return 'astrophysics';
      case 'Chemistry':
      default:
        return 'chemistry';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with historic book aesthetic */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: treatise.coverAccent }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-800 text-slate-300">
                  {treatise.discipline}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  <Calendar className="w-3 h-3" />
                  {treatise.year}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  Ground Floor School Library Rare Collection
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1 leading-snug">
                {treatise.title}
              </h2>
              <p className="text-xs text-slate-400">By {treatise.author}</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm leading-relaxed">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Summary & Historical Discovery
            </h3>
            <p className="text-slate-300">{treatise.summary}</p>
          </div>

          {/* Authentic Primary Excerpt */}
          <div className="relative p-5 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/20">
            <Quote className="absolute top-4 right-4 w-8 h-8 text-amber-500/15 pointer-events-none" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3">
              Primary Historical Excerpt (Archival Transcription)
            </h3>
            <div className="font-serif italic text-sm sm:text-base leading-relaxed text-amber-100/90 whitespace-pre-line border-l-2 border-amber-500/40 pl-4 py-1">
              {treatise.fullExcerpt}
            </div>
          </div>

          {/* Historical Significance */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Empirical Impact & Scientific Legacy
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              {treatise.historicalSignificance}
            </p>
          </div>

          {/* Connection to KEV 3D Virtual Laboratories */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  How This Treatise Is Simulated in KEV XR Labs
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {treatise.modernXRLabConnection}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Return to Library
          </button>
          {onNavigateToLab && (
            <button
              onClick={() => {
                const labId = getLabIdForTreatise(treatise.discipline);
                onNavigateToLab(labId);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-cyan-600/20"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Launch Associated 3D Virtual Lab</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
