import React from 'react';
import {
  CampusSeasonTheme,
  SEASON_THEMES_INFO,
} from './campusThemedCenterpiece';
import { Sparkles, X, Check, BookOpen, Lightbulb, Compass } from 'lucide-react';

interface Props {
  isOpen: boolean;
  currentTheme: CampusSeasonTheme;
  onSelectTheme: (theme: CampusSeasonTheme) => void;
  onClose: () => void;
}

export const SeasonalThemeModal: React.FC<Props> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  const activeInfo = SEASON_THEMES_INFO[currentTheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="text-2xl p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-inner">
              {activeInfo.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  School Facilities Seasonal Themes
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Interactive Centerpiece
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transform the central atrium centerpiece and facility decorations for holidays
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Theme Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
              Select Holiday / Seasonal Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(SEASON_THEMES_INFO) as CampusSeasonTheme[]).map((themeKey) => {
                const info = SEASON_THEMES_INFO[themeKey];
                const isSelected = currentTheme === themeKey;

                return (
                  <button
                    key={themeKey}
                    onClick={() => onSelectTheme(themeKey)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? `bg-slate-800/90 ${info.colorScheme.border} ring-2 ring-cyan-400/30 shadow-lg`
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="text-3xl shrink-0 mt-0.5">{info.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-white truncate">{info.name}</h4>
                        {isSelected && (
                          <span className="shrink-0 p-1 rounded-full bg-cyan-500 text-slate-950">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {info.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Centerpiece Feature Spotlight */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Centerpiece 3D Architecture: {activeInfo.name}
              </h4>
            </div>
            <div>
              <h5 className="text-sm font-bold text-white mb-1">{activeInfo.centerpieceTitle}</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeInfo.centerpieceDescription}
              </p>
            </div>
          </div>

          {/* STEM Science Connection */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Holiday STEM Science Connection
              </h4>
            </div>
            <h5 className="text-xs font-bold text-cyan-100">{activeInfo.stemFactTitle}</h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeInfo.stemFactDescription}
            </p>
          </div>

          {/* School Facility Decorations Overview */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                School Facilities Decorations Included
              </h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <span className="font-semibold text-slate-200">Wing Portals & Doorways:</span> Decorated with themed garlands, banners, and glowing holiday sconces.
              </li>
              <li>
                <span className="font-semibold text-slate-200">Biophilic Garden Planters:</span> Embellished with seasonal flora, pumpkins, eggs, and festive accents.
              </li>
              <li>
                <span className="font-semibold text-slate-200">Atrium Atmosphere:</span> Ambient particles (falling snow, spooky embers, spring petals, golden autumn leaves) drifting from the central skylight.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Theme active in 3D scene</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
          >
            Return to Campus
          </button>
        </div>
      </div>
    </div>
  );
};
