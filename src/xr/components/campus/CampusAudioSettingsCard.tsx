import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Volume1, Sparkles, Radio, Activity, Check } from 'lucide-react';
import { campusAudio, AudioEngineSettings } from '../../services/campusAudioEngine';

interface Props {
  compact?: boolean;
}

export const CampusAudioSettingsCard: React.FC<Props> = ({ compact = false }) => {
  const [settings, setSettings] = useState<AudioEngineSettings>(campusAudio.getSettings());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = campusAudio.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    campusAudio.setMasterVolume(val);
    if (!isPlaying && val > 0) {
      campusAudio.start().then((started) => setIsPlaying(started));
    }
  };

  const handleToggleMute = () => {
    campusAudio.toggleMute();
    if (!isPlaying && settings.isMuted) {
      campusAudio.start().then((started) => setIsPlaying(started));
    }
  };

  const handleToggleChannel = (channel: keyof Omit<AudioEngineSettings, 'masterVolume' | 'isMuted'>) => {
    campusAudio.toggleChannel(channel);
    if (!isPlaying) {
      campusAudio.start().then((started) => setIsPlaying(started));
    }
  };

  const handleTestAudio = async () => {
    await campusAudio.start();
    setIsPlaying(true);
    campusAudio.playInteractiveKioskChime();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 backdrop-blur-md">
        <button
          onClick={handleToggleMute}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={settings.isMuted ? 'Unmute Campus Soundscape' : 'Mute Campus Soundscape'}
        >
          {settings.isMuted || settings.masterVolume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : settings.masterVolume < 0.5 ? (
            <Volume1 className="w-4 h-4 text-cyan-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.isMuted ? 0 : settings.masterVolume}
          onChange={handleVolumeChange}
          className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          title={`Campus Volume: ${Math.round(settings.masterVolume * 100)}%`}
        />
        <span className="text-[10px] font-mono text-slate-400 w-7">
          {settings.isMuted ? '0%' : `${Math.round(settings.masterVolume * 100)}%`}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Campus Atmosphere & Audio Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Spatial Web Audio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Subtle atmospheric soundscapes: auditorium chatter, lab whirring, and seasonal acoustics
            </p>
          </div>
        </div>

        <button
          onClick={handleTestAudio}
          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          title="Start or Test Soundscape Engine"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Test Sound</span>
        </button>
      </div>

      {/* Master Volume Slider & Mute */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-4">
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            settings.isMuted
              ? 'bg-red-500/20 border-red-500/40 text-red-300'
              : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
          }`}
          title={settings.isMuted ? 'Click to Unmute' : 'Click to Mute'}
        >
          {settings.isMuted || settings.masterVolume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Master Soundscape Volume</span>
            <span className="font-mono text-cyan-400 font-bold">
              {settings.isMuted ? 'Muted (0%)' : `${Math.round(settings.masterVolume * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.isMuted ? 0 : settings.masterVolume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Atmospheric Soundscape Channel Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Auditorium Chatter */}
        <button
          onClick={() => handleToggleChannel('auditoriumChatterEnabled')}
          className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
            settings.auditoriumChatterEnabled
              ? 'bg-blue-950/40 border-blue-500/40 text-white'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🗣️</span>
              <h4 className="text-xs font-bold">Auditorium Chatter & Murmur</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Soft distant crowd and academic conversation in the central atrium
            </p>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              settings.auditoriumChatterEnabled
                ? 'bg-blue-500 border-blue-400 text-slate-950'
                : 'border-slate-700'
            }`}
          >
            {settings.auditoriumChatterEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
        </button>

        {/* Lab Whirring & Cleanroom Hum */}
        <button
          onClick={() => handleToggleChannel('labWhirringEnabled')}
          className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
            settings.labWhirringEnabled
              ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚙️</span>
              <h4 className="text-xs font-bold">Cleanroom Lab Whirring & Fans</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Laminar airflow, laser chillers, and cryogenic compressor hum
            </p>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              settings.labWhirringEnabled
                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                : 'border-slate-700'
            }`}
          >
            {settings.labWhirringEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
        </button>

        {/* Atrium Resonance */}
        <button
          onClick={() => handleToggleChannel('atriumAmbienceEnabled')}
          className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
            settings.atriumAmbienceEnabled
              ? 'bg-emerald-950/40 border-emerald-500/40 text-white'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🏛️</span>
              <h4 className="text-xs font-bold">Atrium Biophilic Resonance</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Subterranean architectural acoustics and living plant breath
            </p>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              settings.atriumAmbienceEnabled
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'border-slate-700'
            }`}
          >
            {settings.atriumAmbienceEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
        </button>

        {/* Seasonal Soundscape */}
        <button
          onClick={() => handleToggleChannel('seasonalSoundscapeEnabled')}
          className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
            settings.seasonalSoundscapeEnabled
              ? 'bg-amber-950/40 border-amber-500/40 text-white'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🍂</span>
              <h4 className="text-xs font-bold">Seasonal Holiday Atmosphere</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Halloween draft, Christmas crystal shimmer, Easter pulse, or harvest warmth
            </p>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              settings.seasonalSoundscapeEnabled
                ? 'bg-amber-500 border-amber-400 text-slate-950'
                : 'border-slate-700'
            }`}
          >
            {settings.seasonalSoundscapeEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
        </button>
      </div>
    </div>
  );
};
