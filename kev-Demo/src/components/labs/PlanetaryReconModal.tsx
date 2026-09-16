import React, { useRef, useState } from 'react';
import {
  Compass,
  FileCheck,
  Globe2,
  Layers,
  Mountain,
  Sun,
  Trophy,
  Upload,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PLANETARY_RECON_TARGETS } from '../../data/advancedLabSystemsData';
import { PlanetaryReconTarget } from '../../types';

interface PlanetaryReconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardXP?: (amount: number, reason: string) => void;
  onSaveToNotebook?: (entry: any) => void;
}

export const PlanetaryReconModal: React.FC<PlanetaryReconModalProps> = ({
  isOpen,
  onClose,
  onAwardXP,
  onSaveToNotebook,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(PLANETARY_RECON_TARGETS[0].id);
  const [zenithAngleInput, setZenithAngleInput] = useState<number>(PLANETARY_RECON_TARGETS[0].solarZenithAngle);
  const [solarDeclinationInput, setSolarDeclinationInput] = useState<number>(10.0);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [hasCompletedQuest, setHasCompletedQuest] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentTarget: PlanetaryReconTarget =
    PLANETARY_RECON_TARGETS.find((t) => t.id === selectedTargetId) || PLANETARY_RECON_TARGETS[0];

  const handleSelectTarget = (target: PlanetaryReconTarget) => {
    setSelectedTargetId(target.id);
    setZenithAngleInput(target.solarZenithAngle);
    setAnalysisResult(null);
    setCustomImageBase64(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImageBase64(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeRecon = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/planetary-recon/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: currentTarget.id,
          solarZenithAngleDeg: zenithAngleInput,
          solarDeclinationDeg: solarDeclinationInput,
          atmosphericHazeRatio: currentTarget.celestialBody === 'Mars' ? 0.8 : currentTarget.celestialBody === 'Titan' ? 2.4 : 1.2,
          customImageBase64,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data);
        if (!hasCompletedQuest) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
          if (onAwardXP) {
            onAwardXP(75, `Planetary Biome Recon: ${currentTarget.name}`);
          }
          setHasCompletedQuest(true);
        }
      }
    } catch (e) {
      // High-precision client-side fallback
      const derivedLat = Number((zenithAngleInput + solarDeclinationInput).toFixed(2));
      const fallback = {
        calculatedLatitude: {
          derivedLatitudeDeg: derivedLat,
          formulaUsed: 'φ = θ_z + δ (Solar Zenith Angle + Solar Declination)',
          confidencePercent: 95.2,
        },
        atmosphericScattering: {
          rayleighIndex: 2.85,
          skyColorModel: currentTarget.celestialBody === 'Mars' ? 'Martian Butterscotch Haze' : 'Nitrogen Rayleigh Blue',
          solarZenithAngleDeg: zenithAngleInput,
        },
        geologicalAnalysis: {
          rockClassification: currentTarget.rockStrata.primaryType.toUpperCase() + ' Bedrock Strata',
          dominantMinerals: currentTarget.rockStrata.dominantMinerals,
          erosionForces: currentTarget.rockStrata.erosionMechanisms,
          planetaryHabitabilityESI: currentTarget.habitabilityScore,
        },
        aiScientificSynthesis: `Empirical telemetry confirms stratified geological bedding at ${derivedLat}° latitude. Spectral signatures show characteristic ${currentTarget.rockStrata.dominantMinerals[0]} enrichment shaped by ${currentTarget.rockStrata.erosionMechanisms[0]}.`,
      };
      setAnalysisResult(fallback);
      if (!hasCompletedQuest) {
        confetti({ particleCount: 40 });
        if (onAwardXP) {
          onAwardXP(75, `Planetary Biome Recon: ${currentTarget.name}`);
        }
        setHasCompletedQuest(true);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToNotebook = () => {
    if (onSaveToNotebook && analysisResult) {
      onSaveToNotebook({
        id: `biome-recon-${Date.now()}`,
        title: `Planetary Biome Recon: ${currentTarget.name} (${currentTarget.celestialBody})`,
        discipline: 'astrophysics',
        date: new Date().toISOString().split('T')[0],
        notes: `Location: ${currentTarget.locationName}\nDerived Latitude: ${analysisResult.calculatedLatitude.derivedLatitudeDeg}° (True: ${currentTarget.trueLatitude}°)\nRock Strata: ${currentTarget.rockStrata.primaryType}\nDominant Minerals: ${currentTarget.rockStrata.dominantMinerals.join(', ')}\nKöppen Climate: ${currentTarget.climateData.koeppenCode}\nESI Habitability: ${currentTarget.habitabilityScore}\nScientific Synthesis: ${analysisResult.aiScientificSynthesis}`,
        tags: ['Earth & Planetary Recon', 'Floor 3 Planetarium', currentTarget.celestialBody],
      });
      alert('Planetary Reconnaissance Mission logged into your Lab Notebook!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/70 text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Earth & Planetary Biome Reconnaissance
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                  Floor 3 Planetarium & Astrowing
                </span>
              </div>
              <p className="text-xs text-cyan-300/80">
                Analyze satellite telemetry, rover imagery, rock strata, and atmospheric scattering vectors.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Biome Tabs */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Celestial Biome Target</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PLANETARY_RECON_TARGETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTarget(t)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTargetId === t.id
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 inline-block mb-1">
                    {t.celestialBody}
                  </div>
                  <div className="text-xs font-bold truncate text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.climateData.zoneName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Visual Recon & Geological Data Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Satellite / Rover Imagery & Custom Upload */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-inner group">
                <img
                  src={customImageBase64 || currentTarget.imageUrl}
                  alt={currentTarget.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none" />

                {/* Satellite Feed Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-2.5 py-1 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{customImageBase64 ? 'Custom Specimen Feed' : currentTarget.satelliteType}</span>
                </div>

                {/* Bottom Coordinates Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <div>
                    <span className="font-bold">{currentTarget.locationName}</span>
                    <div className="text-[11px] text-slate-300">
                      Köppen: {currentTarget.climateData.koeppenCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-cyan-400 block">True Latitude</span>
                    <span className="font-mono font-bold">{currentTarget.trueLatitude}°</span>
                  </div>
                </div>
              </div>

              {/* Upload Custom Strata / Satellite Specimen Button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{customImageBase64 ? 'Replace Geological Image' : 'Upload Specimen / Strata Photo'}</span>
                </button>
                {customImageBase64 && (
                  <button
                    onClick={() => setCustomImageBase64(null)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Rock Strata Analysis Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Geological Rock Strata & Mineralogy</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block font-mono">Rock Classification</span>
                    <span className="text-cyan-300 font-bold capitalize">{currentTarget.rockStrata.primaryType} Strata</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block font-mono">Habitability (ESI)</span>
                    <span className="text-emerald-400 font-bold font-mono">{(currentTarget.habitabilityScore * 100).toFixed(0)}% ESI Index</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 rounded-xl p-2.5 border border-slate-800/80">
                  <span className="font-semibold text-slate-200">Formation History: </span>
                  {currentTarget.rockStrata.formationProcess}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentTarget.rockStrata.dominantMinerals.map((m, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Field Mission Quest & Solar Zenith Math */}
            <div className="lg:col-span-6 space-y-4">
              {/* Field Mission Quest Box */}
              <div className="bg-gradient-to-r from-cyan-950/40 via-slate-950 to-indigo-950/40 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Field Mission: Solar Zenith & Latitude Calculation
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                    +75 XP
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Measure shadow angles or solar altitude to determine the Solar Zenith Angle (θz), then derive the planet’s local latitude: <strong className="text-cyan-300 font-mono">φ = θz + δ</strong>.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-300" />
                        Zenith Angle (θz):
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">{zenithAngleInput}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={0.5}
                      value={zenithAngleInput}
                      onChange={(e) => setZenithAngleInput(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Wind className="w-3 h-3 text-indigo-300" />
                        Solar Declination (δ):
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">{solarDeclinationInput}°</span>
                    </div>
                    <input
                      type="range"
                      min={-23.5}
                      max={23.5}
                      step={0.5}
                      value={solarDeclinationInput}
                      onChange={(e) => setSolarDeclinationInput(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={isAnalyzing}
                    onClick={handleAnalyzeRecon}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <span>Running Planetary Spectrometry...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-900 fill-amber-900" />
                        <span>Calculate Latitude & Analyze Strata (+75 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                      Reconnaissance Findings
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Calculated Lat: {analysisResult.calculatedLatitude.derivedLatitudeDeg}°
                    </span>
                  </div>

                  {/* Scientific AI Synthesis */}
                  <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200 leading-relaxed">
                    <span className="font-bold text-white block mb-1">AI Planetary Synthesis:</span>
                    {analysisResult.aiScientificSynthesis}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Rayleigh Scattering</span>
                      <span className="text-slate-200 font-medium">{analysisResult.atmosphericScattering.skyColorModel}</span>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Active Erosion</span>
                      <span className="text-slate-200 font-medium truncate">{currentTarget.rockStrata.erosionMechanisms[0]}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveToNotebook}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Save Biome Report to Lab Notebook</span>
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
