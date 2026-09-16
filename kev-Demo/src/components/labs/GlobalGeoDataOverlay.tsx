import React, { useState, useEffect } from 'react';
import {
  Globe,
  Satellite,
  Compass,
  Layers,
  MapPin,
  TrendingDown,
  Wind,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { useToast } from '../toast/ToastContext';

export interface GeoLocationData {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  elevationM: number;
  gravityMps2: number;
  gravityAnomalyMgal: number;
  tangentialVelocityMps: number;
  crustType: 'continental' | 'oceanic' | 'transitional';
  dominantRock: string;
  rockDensityGcm3: number;
  significance: string;
  satelliteImageUrl: string;
  geologicalMapUrl: string;
  recommendedLaunchAzimuthDeg: number;
  leoOrbitalPeriodMin: number;
  escapeVelocityKmph: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSimSpeed: number;
  currentSimDistance: number;
  currentSimPeriod: number;
  onApplyGravityToSim?: (newGMultiplier: number, locationName: string) => void;
}

export const GlobalGeoDataOverlay: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSimSpeed,
  currentSimDistance,
  currentSimPeriod,
  onApplyGravityToSim,
}) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<GeoLocationData[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<string>('kennedy-space-center');
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'geological'>('satellite');
  const [customLat, setCustomLat] = useState<string>('0.0');
  const [customLng, setCustomLng] = useState<string>('0.0');
  const [customElev, setCustomElev] = useState<string>('0');
  const [customLocationData, setCustomLocationData] = useState<GeoLocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareAnalysis, setCompareAnalysis] = useState<string | null>(null);

  // Fetch real-world global geo-data
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetch('/api/astrophysics/geo-data')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.locations) {
          setLocations(data.locations);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch geo-data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  const activeLocation =
    customLocationData ||
    locations.find((l) => l.id === selectedLocId) ||
    locations[0] ||
    null;

  const handleComputeCustomCoord = async () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const elev = parseFloat(customElev);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast({
        type: 'error',
        title: 'Invalid Coordinates',
        message: 'Latitude must be between -90° and +90°, Longitude between -180° and +180°.',
      });
      return;
    }

    try {
      const res = await fetch(`/api/astrophysics/geo-data?lat=${lat}&lng=${lng}&elev=${isNaN(elev) ? 0 : elev}`);
      const data = await res.json();
      if (data.success && data.location) {
        setCustomLocationData(data.location);
        soundManager.playSuccess();
        showToast({
          type: 'badge',
          title: 'WGS-84 Geodetic Gravity Calculated',
          message: `Local g = ${data.location.gravityMps2} m/s² computed at (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)!`,
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Calculation Error',
        message: 'Could not compute geodetic gravity for coordinates.',
      });
    }
  };

  const handleCompareWithSimulation = async () => {
    if (!activeLocation) return;
    setIsComparing(true);
    try {
      const res = await fetch('/api/astrophysics/geo-data/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: activeLocation.id,
          virtualBody: {
            name: 'Terra (Virtual Planet)',
            speed: currentSimSpeed,
            distance: currentSimDistance,
            period: currentSimPeriod,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCompareAnalysis(data.analysis);
        soundManager.playSuccess();
        showToast({
          type: 'badge',
          title: 'Orbital & Gravitational Comparison Complete',
          message: `Derived delta g vs standard: ${data.comparison.deltaMps2FromStandard} m/s² (+25 XP)`,
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setIsComparing(false);
    }
  };

  const handleApplyToSimulation = () => {
    if (!activeLocation || !onApplyGravityToSim) return;
    // Standard g is 9.80665. Multiplier is activeLocation.gravityMps2 / 9.80665
    const multiplier = activeLocation.gravityMps2 / 9.80665;
    onApplyGravityToSim(multiplier, activeLocation.name);
    soundManager.playSuccess();
    showToast({
      type: 'badge',
      title: 'Simulation Gravitational Constant Synchronized',
      message: `Virtual N-body lab gravity set to ${activeLocation.gravityMps2} m/s² (${activeLocation.name})!`,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 rounded-2xl border border-violet-500/40 shadow-2xl shadow-violet-950/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Global Geo-Data & Earth Satellite Gravity Overlay
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  WGS-84 Geodesy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compare real-world coordinates, satellite observations & gravitational anomalies against your 3D Keplerian simulation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Presets Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5" />
                Select Global Ground Station / Benchmark Location
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {locations.length} Surveyed Earth Datums
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {locations.map((loc) => {
                const isSelected = activeLocation?.id === loc.id && !customLocationData;
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocId(loc.id);
                      setCustomLocationData(null);
                      soundManager.playClick();
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-violet-950/60 border-violet-500 text-white shadow-lg shadow-violet-950/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-violet-300 truncate max-w-[90px]">{loc.country}</span>
                        <span className="font-bold text-cyan-400">{loc.gravityMps2} m/s²</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{loc.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      {loc.lat > 0 ? `${loc.lat.toFixed(1)}°N` : `${Math.abs(loc.lat).toFixed(1)}°S`} • {loc.elevationM}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeLocation && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Satellite & Geological Visualizer (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Visual Imagery Panel */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group">
                  <img
                    src={
                      activeLayer === 'satellite'
                        ? activeLocation.satelliteImageUrl
                        : activeLocation.geologicalMapUrl
                    }
                    alt={activeLocation.name}
                    className="w-full h-64 sm:h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Layer Switcher Buttons */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
                    <button
                      onClick={() => setActiveLayer('satellite')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeLayer === 'satellite'
                          ? 'bg-violet-600 text-white font-semibold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Satellite className="w-3.5 h-3.5" />
                      Satellite Recon
                    </button>
                    <button
                      onClick={() => setActiveLayer('geological')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeLayer === 'geological'
                          ? 'bg-emerald-600 text-white font-semibold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Geological Crust Map
                    </button>
                  </div>

                  {/* Coordinate Overlay Banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-violet-400 font-bold block">
                        {activeLocation.region}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {activeLocation.name}
                      </h3>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="text-cyan-300 font-bold">
                        {activeLocation.lat.toFixed(4)}° {activeLocation.lat >= 0 ? 'N' : 'S'},{' '}
                        {activeLocation.lng.toFixed(4)}° {activeLocation.lng >= 0 ? 'E' : 'W'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Elevation: {activeLocation.elevationM > 0 ? `+${activeLocation.elevationM}` : activeLocation.elevationM} m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geological & Orbital Telemetry Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Local Gravity (g)
                    </span>
                    <div className="text-lg font-bold font-mono text-violet-300">
                      {activeLocation.gravityMps2} <span className="text-xs text-slate-400">m/s²</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Δ from 9.807: {(activeLocation.gravityMps2 - 9.80665).toFixed(4)} m/s²
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Earth Spin Boost (v_rot)
                    </span>
                    <div className="text-lg font-bold font-mono text-cyan-300">
                      +{activeLocation.tangentialVelocityMps} <span className="text-xs text-slate-400">m/s</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Eastward launch assist
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Free-Air Anomaly
                    </span>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      {activeLocation.gravityAnomalyMgal >= 0 ? `+${activeLocation.gravityAnomalyMgal}` : activeLocation.gravityAnomalyMgal}{' '}
                      <span className="text-xs text-slate-400">mGal</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Sub-surface density flux
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Crustal Lithology
                    </span>
                    <div className="text-xs font-semibold text-white truncate">
                      {activeLocation.dominantRock}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Density: {activeLocation.rockDensityGcm3} g/cm³
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      LEO Orbital Period
                    </span>
                    <div className="text-lg font-bold font-mono text-emerald-300">
                      ~{activeLocation.leoOrbitalPeriodMin} <span className="text-xs text-slate-400">min</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      At 400 km orbital altitude
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Escape Velocity
                    </span>
                    <div className="text-lg font-bold font-mono text-rose-300">
                      {activeLocation.escapeVelocityKmph.toLocaleString()}{' '}
                      <span className="text-xs text-slate-400">km/h</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      11.19 km/s ballistic escape
                    </span>
                  </div>
                </div>

                {/* Significance Explainer */}
                <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 text-xs text-slate-300 space-y-1">
                  <span className="font-mono text-[10px] text-violet-400 font-bold uppercase block">
                    Geophysical & Orbital Significance
                  </span>
                  <p className="leading-relaxed">{activeLocation.significance}</p>
                </div>
              </div>

              {/* Right Column: Interactive Simulation Synchronizer & Custom Coord (5 cols) */}
              <div className="lg:col-span-5 space-y-4 flex flex-col">
                {/* Virtual Lab vs Real-World Comparison Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                      Virtual Lab vs Earth Real-World
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      Live Telemetry
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Virtual Planet Speed:</span>
                      <span className="font-mono text-cyan-300 font-semibold">{currentSimSpeed} AU/s</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Virtual Orbital Radius:</span>
                      <span className="font-mono text-violet-300 font-semibold">{currentSimDistance} AU</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Virtual Keplerian Period:</span>
                      <span className="font-mono text-amber-300 font-semibold">~{currentSimPeriod} cycles</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Earth Location Gravity:</span>
                      <span className="font-mono text-emerald-300 font-semibold">{activeLocation.gravityMps2} m/s²</span>
                    </div>
                  </div>

                  {compareAnalysis && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans animate-in fade-in">
                      <span className="text-cyan-400 font-mono text-[10px] font-bold block mb-1">
                        Comparative Geodesy Analysis:
                      </span>
                      {compareAnalysis}
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleCompareWithSimulation}
                      disabled={isComparing}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>{isComparing ? 'Analyzing Geodesic Delta...' : 'Run Comparative Orbit Analysis (+25 XP)'}</span>
                    </button>

                    <button
                      onClick={handleApplyToSimulation}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Synchronize Simulation Gravity ({activeLocation.gravityMps2} m/s²)</span>
                    </button>
                  </div>
                </div>

                {/* Custom Coordinate Calculator */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-violet-400" />
                    <h4 className="text-xs font-bold text-white">Custom Earth Coordinate Solver</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Input any real latitude, longitude, and elevation to compute WGS-84 Somigliana gravity dynamically:
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Latitude (°)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="-90"
                        max="90"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                        placeholder="e.g. 40.71"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Longitude (°)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="-180"
                        max="180"
                        value={customLng}
                        onChange={(e) => setCustomLng(e.target.value)}
                        placeholder="e.g. -74.00"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Elevation (m)</label>
                      <input
                        type="number"
                        step="10"
                        value={customElev}
                        onChange={(e) => setCustomElev(e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleComputeCustomCoord}
                    className="w-full py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/40 text-violet-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Compute Geodetic Gravity for Coordinates
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
