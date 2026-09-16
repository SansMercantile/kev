import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Zap,
  Cpu,
  Radio,
  Orbit,
  Dna,
  Sparkles,
  Flame,
  Activity,
  Check,
  Lock,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Palette,
  Play,
  RotateCcw,
  Layers,
  Award,
  BarChart3,
  Gauge,
  Sparkle
} from 'lucide-react';
import {
  WorkbenchCustomizerState,
  WorkbenchFunctionalUpgrade,
  WorkbenchSurface,
  WorkbenchLighting,
} from '../../types';
import {
  WORKBENCH_FUNCTIONAL_UPGRADES,
  WORKBENCH_SURFACES,
  WORKBENCH_LIGHTINGS,
  getWorkbenchCustomizerState,
  saveWorkbenchCustomizerState,
  calculateEfficiencyStats,
  getUpgradeNextCost,
} from '../../utils/workbenchManager';
import { TOOL_SKINS_CATALOG } from '../../data/toolSkins';
import { LAB_EQUIPMENT_CATALOG } from '../../data/labEquipment';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentXP: number;
  onDeductXP: (amount: number) => void;
  onAwardXP: (amount: number, reason: string) => void;
}

export const LabWorkbenchCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentXP,
  onDeductXP,
  onAwardXP,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'functional' | 'cosmetic' | 'environment' | 'benchmark'>('functional');
  const [upgradeCategoryFilter, setUpgradeCategoryFilter] = useState<string>('all');
  const [selectedToolType, setSelectedToolType] = useState<'spectrometer' | 'bunsen_burner' | 'laser_collimator' | 'telescope' | 'microscope' | 'micropipette'>('spectrometer');

  // Customizer state
  const [customizerState, setCustomizerState] = useState<WorkbenchCustomizerState>(getWorkbenchCustomizerState);

  // Live Benchmark test state
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkStep, setBenchmarkStep] = useState<number>(0);
  const [benchmarkCompleted, setBenchmarkCompleted] = useState<boolean>(false);
  const [benchmarkStats, setBenchmarkStats] = useState<{
    stockTimeMs: number;
    optimizedTimeMs: number;
    timeReductionPct: number;
    convergenceScore: number;
  } | null>(null);

  // Keep state in sync with local storage
  useEffect(() => {
    saveWorkbenchCustomizerState(customizerState);
  }, [customizerState]);

  if (!isOpen) return null;

  const efficiencyStats = calculateEfficiencyStats(customizerState);

  // Active equipped skin for selected tool
  const currentSkinId = customizerState.equippedSkinIds[selectedToolType];
  const activeSkin = TOOL_SKINS_CATALOG.find((s) => s.id === currentSkinId) || TOOL_SKINS_CATALOG[0];

  // Active desk and lighting
  const activeSurface = WORKBENCH_SURFACES.find((s) => s.id === customizerState.deskSurface) || WORKBENCH_SURFACES[0];
  const activeLighting = WORKBENCH_LIGHTINGS.find((l) => l.id === customizerState.ambientLighting) || WORKBENCH_LIGHTINGS[0];

  // Filter functional upgrades
  const filteredUpgrades = WORKBENCH_FUNCTIONAL_UPGRADES.filter((item) => {
    if (upgradeCategoryFilter === 'all') return true;
    return item.category === upgradeCategoryFilter;
  });

  // Filter skins for current tool
  const toolSkins = TOOL_SKINS_CATALOG.filter((s) => s.toolType === selectedToolType);

  // Upgrade or Unlock functional module
  const handleUpgradeModule = (upgrade: WorkbenchFunctionalUpgrade) => {
    const isUnlocked = customizerState.unlockedUpgradeIds.includes(upgrade.id);
    const currentLevel = customizerState.upgradeLevels[upgrade.id] || 0;
    const nextCost = isUnlocked ? getUpgradeNextCost(upgrade, currentLevel) : upgrade.costXP;

    if (currentXP < nextCost) {
      showToast({
        type: 'error',
        title: 'Insufficient Academic XP',
        message: `You need ${nextCost - currentXP} more XP to upgrade ${upgrade.name}. Run more lab simulations to earn XP!`,
      });
      return;
    }

    soundManager.playEquipmentPurchase();
    onDeductXP(nextCost);

    const newUnlocked = isUnlocked
      ? customizerState.unlockedUpgradeIds
      : [...customizerState.unlockedUpgradeIds, upgrade.id];

    const newEquipped = customizerState.equippedUpgradeIds.includes(upgrade.id)
      ? customizerState.equippedUpgradeIds
      : [...customizerState.equippedUpgradeIds, upgrade.id];

    const newLevels = {
      ...customizerState.upgradeLevels,
      [upgrade.id]: Math.min((currentLevel || 1) + (isUnlocked ? 1 : 0), upgrade.maxLevel),
    };

    setCustomizerState((prev) => ({
      ...prev,
      unlockedUpgradeIds: newUnlocked,
      equippedUpgradeIds: newEquipped,
      upgradeLevels: newLevels,
    }));

    showToast({
      type: 'badge',
      title: isUnlocked ? 'Hardware Overclock Applied!' : 'Module Installed & Calibrated!',
      message: `${upgrade.name} upgraded. Simulation efficiency increased!`,
    });
  };

  // Toggle equipping functional module
  const handleToggleEquipModule = (upgradeId: string) => {
    soundManager.playClick();
    const isEquipped = customizerState.equippedUpgradeIds.includes(upgradeId);
    let newEquipped: string[];
    if (isEquipped) {
      newEquipped = customizerState.equippedUpgradeIds.filter((id) => id !== upgradeId);
      showToast({
        type: 'info',
        title: 'Module Deactivated',
        message: 'Module unmounted from active workbench bus.',
      });
    } else {
      newEquipped = [...customizerState.equippedUpgradeIds, upgradeId];
      showToast({
        type: 'success',
        title: 'Module Engaged',
        message: 'Simulation acceleration routing active.',
      });
    }

    setCustomizerState((prev) => ({
      ...prev,
      equippedUpgradeIds: newEquipped,
    }));
  };

  // Purchase & Equip Cosmetic Skin
  const handleSelectSkin = (skin: typeof TOOL_SKINS_CATALOG[0]) => {
    const isUnlocked = customizerState.unlockedSkinIds.includes(skin.id);

    if (!isUnlocked) {
      if (currentXP < (skin.xpPrice || 100)) {
        showToast({
          type: 'error',
          title: 'Insufficient Academic XP',
          message: `You need ${(skin.xpPrice || 100) - currentXP} more XP to calibrate the ${skin.skinName} shader.`,
        });
        return;
      }

      soundManager.playBadge();
      onDeductXP(skin.xpPrice || 100);

      setCustomizerState((prev) => ({
        ...prev,
        unlockedSkinIds: [...prev.unlockedSkinIds, skin.id],
        equippedSkinIds: {
          ...prev.equippedSkinIds,
          [selectedToolType]: skin.id,
        },
      }));

      showToast({
        type: 'badge',
        title: 'Cosmetic Shader Unlocked!',
        message: `${skin.skinName} active on your ${skin.toolName}.`,
      });
    } else {
      soundManager.playClick();
      setCustomizerState((prev) => ({
        ...prev,
        equippedSkinIds: {
          ...prev.equippedSkinIds,
          [selectedToolType]: skin.id,
        },
      }));

      showToast({
        type: 'info',
        title: 'Tool Shader Applied',
        message: `${skin.skinName} mapped to ${skin.toolName}.`,
      });
    }
  };

  // Select Desk Surface
  const handleSelectSurface = (surface: typeof WORKBENCH_SURFACES[0]) => {
    if (surface.costXP > 0 && !customizerState.unlockedSkinIds.includes(`surf-${surface.id}`)) {
      if (currentXP < surface.costXP) {
        showToast({
          type: 'error',
          title: 'Insufficient XP',
          message: `Requires ${surface.costXP - currentXP} more XP to fabricate ${surface.name}.`,
        });
        return;
      }
      soundManager.playEquipmentPurchase();
      onDeductXP(surface.costXP);
      setCustomizerState((prev) => ({
        ...prev,
        deskSurface: surface.id,
        unlockedSkinIds: [...prev.unlockedSkinIds, `surf-${surface.id}`],
      }));
      showToast({
        type: 'badge',
        title: 'Workbench Deck Fabricated!',
        message: `${surface.name} installed in your virtual laboratory.`,
      });
    } else {
      soundManager.playClick();
      setCustomizerState((prev) => ({
        ...prev,
        deskSurface: surface.id,
      }));
      showToast({
        type: 'info',
        title: 'Workbench Deck Fitted',
        message: `Equipped ${surface.name}.`,
      });
    }
  };

  // Select Lighting
  const handleSelectLighting = (lighting: typeof WORKBENCH_LIGHTINGS[0]) => {
    if (lighting.costXP > 0 && !customizerState.unlockedSkinIds.includes(`light-${lighting.id}`)) {
      if (currentXP < lighting.costXP) {
        showToast({
          type: 'error',
          title: 'Insufficient XP',
          message: `Requires ${lighting.costXP - currentXP} more XP to calibrate ${lighting.name}.`,
        });
        return;
      }
      soundManager.playEquipmentPurchase();
      onDeductXP(lighting.costXP);
      setCustomizerState((prev) => ({
        ...prev,
        ambientLighting: lighting.id,
        unlockedSkinIds: [...prev.unlockedSkinIds, `light-${lighting.id}`],
      }));
      showToast({
        type: 'badge',
        title: 'Ambient Lighting Spectrum Calibrated',
        message: `${lighting.name} now illuminates your research space.`,
      });
    } else {
      soundManager.playClick();
      setCustomizerState((prev) => ({
        ...prev,
        ambientLighting: lighting.id,
      }));
      showToast({
        type: 'info',
        title: 'Atmospheric Lighting Adjusted',
        message: `Active spectrum set to ${lighting.name}.`,
      });
    }
  };

  // Run Simulation Efficiency Benchmark
  const handleRunBenchmark = () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setBenchmarkStep(1);
    setBenchmarkCompleted(false);
    soundManager.playClick();

    setTimeout(() => {
      setBenchmarkStep(2);
      setTimeout(() => {
        setBenchmarkStep(3);
        setTimeout(() => {
          setBenchmarkStep(4);
          const stock = 1820; // 1.82s
          const speedMultiplier = efficiencyStats.totalComputeAcceleration;
          const optimized = Math.round(stock / speedMultiplier);
          const reduction = Math.round(((stock - optimized) / stock) * 100);

          setBenchmarkStats({
            stockTimeMs: stock,
            optimizedTimeMs: optimized,
            timeReductionPct: reduction,
            convergenceScore: Math.min(99.9, 82.5 + efficiencyStats.totalPrecisionBoost * 0.45),
          });

          setIsBenchmarking(false);
          setBenchmarkCompleted(true);
          soundManager.playBadge();

          // Award small bonus for testing
          onAwardXP(30, 'Completed Workbench Simulation Efficiency Benchmark');
          showToast({
            type: 'success',
            title: 'Benchmark Verification Succeeded!',
            message: `Simulation throughput improved by ${reduction}%! +30 XP awarded.`,
          });
        }, 800);
      }, 800);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-md">
              <Wrench className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Lab Workbench Customizer
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Simulation Efficiency
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unlock functional modules and cosmetic shaders with academic XP to accelerate experiment computation & telemetry accuracy.
              </p>
            </div>
          </div>

          {/* XP & Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Current XP Balance</span>
              <div className="flex items-center justify-end gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-base sm:text-lg font-black font-mono text-amber-300">
                  {currentXP} XP
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Workbench Customizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Efficiency Telemetry HUD Bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Efficiency Rating */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Simulation Efficiency</span>
                <span className="text-sm sm:text-base font-black text-cyan-300 font-mono">
                  {efficiencyStats.totalSimulationEfficiency}%
                </span>
              </div>
            </div>

            {/* Compute Speed */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Compute Speed</span>
                <span className="text-sm sm:text-base font-black text-blue-300 font-mono">
                  {efficiencyStats.totalComputeAcceleration}x Fast Convergence
                </span>
              </div>
            </div>

            {/* Precision Boost */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Sensor Precision</span>
                <span className="text-sm sm:text-base font-black text-purple-300 font-mono">
                  +{efficiencyStats.totalPrecisionBoost}% Resolution
                </span>
              </div>
            </div>

            {/* XP Yield Multiplier */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Academic XP Yield</span>
                <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                  +{efficiencyStats.totalXPYieldBonus}% Bonus XP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Benchmark Button */}
          <button
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-sm ${
              isBenchmarking
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20'
            }`}
          >
            {isBenchmarking ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span>Benchmarking ({benchmarkStep}/4)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Test Simulation Benchmark</span>
              </>
            )}
          </button>
        </div>

        {/* Main Body with Stage Preview + Customizer Panels */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left / Top: Interactive 3D Workbench Stage Preview (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            
            {/* Stage Title & Tool Switcher */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Live Workbench Stage Preview
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono border"
                  style={{
                    backgroundColor: activeLighting.glowColor.replace('0.5', '0.15'),
                    borderColor: activeLighting.glowColor,
                    color: activeLighting.glowColor.replace('0.5', '1'),
                  }}
                >
                  {activeLighting.name}
                </span>
              </div>

              {/* Tool Category Carousel */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {[
                  { id: 'spectrometer', label: 'Spectrometer', icon: Radio },
                  { id: 'bunsen_burner', label: 'Bunsen Burner', icon: Flame },
                  { id: 'laser_collimator', label: 'Laser Array', icon: Sparkles },
                  { id: 'telescope', label: 'Cryo-Telescope', icon: Orbit },
                  { id: 'microscope', label: 'Cellular Scope', icon: Dna },
                  { id: 'micropipette', label: 'Micro-Pipette', icon: Activity },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedToolType(item.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                      selectedToolType === item.id
                        ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <item.icon className="w-3 h-3 text-cyan-400" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual 3D Workbench Model Viewport */}
            <div
              className={`relative w-full h-56 sm:h-64 rounded-2xl border flex items-center justify-center p-4 overflow-hidden transition-all duration-300 shadow-inner ${activeSurface.previewClass}`}
              style={{
                boxShadow: `inset 0 0 40px ${activeLighting.glowColor.replace('0.5', '0.25')}, 0 10px 30px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Background Ambient Glow & Grid Matrix */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle at center, ${activeLighting.glowColor} 0%, transparent 70%)`,
                }}
              />

              {/* Subtle Perspective Workbench Grid Lines */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:16px_16px]" />

              {/* Real-time Floating Telemetry Overlay Tag */}
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono flex items-center gap-2 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Surface: {activeSurface.name}</span>
              </div>

              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-cyan-300 shadow">
                Shader: {activeSkin.skinName}
              </div>

              {/* Visual Equipment Graphic Representation */}
              <div className="relative z-10 flex flex-col items-center justify-center animate-fade-in">
                {/* Holographic Pedestal Aura */}
                <div
                  className="w-32 h-8 rounded-full blur-sm absolute -bottom-4 transition-all duration-500"
                  style={{
                    backgroundColor: activeSkin.accentColor,
                    opacity: 0.4,
                  }}
                />

                {/* Illustrated SVG Instrument with Dynamic Shaders */}
                <div
                  className="p-6 rounded-3xl border backdrop-blur-md transition-all duration-300 shadow-2xl relative"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    borderColor: activeSkin.accentColor,
                    boxShadow: `0 0 25px ${activeSkin.glowColor || 'rgba(6, 182, 212, 0.4)'}`,
                  }}
                >
                  {selectedToolType === 'spectrometer' && (
                    <Radio
                      className="w-16 h-16 transition-transform duration-300 hover:scale-110"
                      style={{ color: activeSkin.accentColor }}
                    />
                  )}
                  {selectedToolType === 'bunsen_burner' && (
                    <Flame
                      className="w-16 h-16 transition-transform duration-300 hover:scale-110 animate-pulse"
                      style={{ color: activeSkin.accentColor }}
                    />
                  )}
                  {selectedToolType === 'laser_collimator' && (
                    <Sparkles
                      className="w-16 h-16 transition-transform duration-300 hover:scale-110"
                      style={{ color: activeSkin.accentColor }}
                    />
                  )}
                  {selectedToolType === 'telescope' && (
                    <Orbit
                      className="w-16 h-16 transition-transform duration-300 hover:scale-110"
                      style={{ color: activeSkin.accentColor }}
                    />
                  )}
                  {selectedToolType === 'microscope' && (
                    <Dna
                      className="w-16 h-16 transition-transform duration-300 hover:scale-110"
                      style={{ color: activeSkin.accentColor }}
                    />
                  )}
                  {selectedToolType === 'micropipette' && (
                    <Activity
                      className="w-16 h-16 transition-transform duration-300 hover:scale-110"
                      style={{ color: activeSkin.accentColor }}
                    />
                  )}

                  {/* Laser / Plasma Energy Emission Ray */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-6 rounded-full blur-[1px] animate-pulse"
                    style={{ backgroundColor: activeSkin.accentColor }}
                  />
                </div>

                {/* Instrument Tag */}
                <div className="mt-3 text-center">
                  <span className="text-xs font-bold text-white block">
                    {activeSkin.toolName || selectedToolType.toUpperCase()}
                  </span>
                  <span
                    className="text-[10px] font-mono font-semibold"
                    style={{ color: activeSkin.accentColor }}
                  >
                    Pattern: {activeSkin.texturePattern} • Specular: {activeSurface.reflectionQuality}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Buffs Breakdown Pill Grid */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                <span>Active Workbench Loadout</span>
                <span className="text-cyan-400 font-bold">{customizerState.equippedUpgradeIds.length} Modules Engaged</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Physics Solver:</span>
                  <span className="text-emerald-300 font-bold">Fast-Euler MK-II</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Thermal Noise:</span>
                  <span className="text-cyan-300 font-bold">-68.4% Suppressed</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Ray Precision:</span>
                  <span className="text-purple-300 font-bold">±0.0001 nD</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Telemetry Bus:</span>
                  <span className="text-amber-300 font-bold">Broadband Sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Customizer Modes & Store Catalog (7 cols) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-900">
            
            {/* Customizer Tabs Navigation */}
            <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('functional')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'functional'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Functional Efficiency Upgrades</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {customizerState.equippedUpgradeIds.length}/{WORKBENCH_FUNCTIONAL_UPGRADES.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('cosmetic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'cosmetic'
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Equipment Shaders & Skins</span>
                </button>

                <button
                  onClick={() => setActiveTab('environment')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'environment'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Workbench Deck & Lighting</span>
                </button>

                <button
                  onClick={() => setActiveTab('benchmark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'benchmark'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Efficiency Benchmarks</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Functional Efficiency Upgrades */}
            {activeTab === 'functional' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* Category Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All Modules' },
                    { id: 'computation', label: 'Compute Acceleration' },
                    { id: 'precision', label: 'Measurement Precision' },
                    { id: 'xp_yield', label: 'XP Multipliers' },
                    { id: 'energy_stability', label: 'Thermal & Stability' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setUpgradeCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        upgradeCategoryFilter === cat.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Upgrades Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredUpgrades.map((upgrade) => {
                    const isUnlocked = customizerState.unlockedUpgradeIds.includes(upgrade.id);
                    const isEquipped = customizerState.equippedUpgradeIds.includes(upgrade.id);
                    const currentLevel = customizerState.upgradeLevels[upgrade.id] || (isUnlocked ? 1 : 0);
                    const isMaxLevel = isUnlocked && currentLevel >= upgrade.maxLevel;
                    const nextCost = isUnlocked ? getUpgradeNextCost(upgrade, currentLevel) : upgrade.costXP;

                    return (
                      <div
                        key={upgrade.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-slate-950/90 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                            : isUnlocked
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-80'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                                {upgrade.icon === 'Cpu' && <Cpu className="w-4 h-4" />}
                                {upgrade.icon === 'Radio' && <Radio className="w-4 h-4" />}
                                {upgrade.icon === 'Zap' && <Zap className="w-4 h-4" />}
                                {upgrade.icon === 'Flame' && <Flame className="w-4 h-4" />}
                                {upgrade.icon === 'Sparkles' && <Sparkles className="w-4 h-4" />}
                                {upgrade.icon === 'Orbit' && <Orbit className="w-4 h-4" />}
                                {upgrade.icon === 'Dna' && <Dna className="w-4 h-4" />}
                                {upgrade.icon === 'Activity' && <Activity className="w-4 h-4" />}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-white">{upgrade.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    {upgrade.tier}
                                  </span>
                                  <span className="text-[10px] font-mono text-cyan-300">
                                    {isUnlocked ? `Level ${currentLevel}/${upgrade.maxLevel}` : 'Not Installed'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Active / Equipped Badge */}
                            {isEquipped && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                            {upgrade.description}
                          </p>

                          {/* Perk Badge */}
                          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] font-mono text-cyan-300 mb-4 flex items-center gap-1.5">
                            <Sparkle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{upgrade.perkEffect}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          {/* Equip / Unequip Toggle */}
                          {isUnlocked && (
                            <button
                              onClick={() => handleToggleEquipModule(upgrade.id)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isEquipped
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                              }`}
                            >
                              {isEquipped ? 'Deactivate' : 'Equip on Bus'}
                            </button>
                          )}

                          {/* Purchase / Upgrade Button */}
                          {!isMaxLevel ? (
                            <button
                              onClick={() => handleUpgradeModule(upgrade)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                currentXP >= nextCost
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              } ${!isUnlocked ? 'flex-1' : ''}`}
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span>{isUnlocked ? `Overclock (${nextCost} XP)` : `Unlock (${nextCost} XP)`}</span>
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                              Max Overclocked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Cosmetic Equipment Shaders */}
            {activeTab === 'cosmetic' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Custom Shaders for {selectedToolType.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Apply visual surface shaders and holographic textures to your virtual equipment.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {toolSkins.map((skin) => {
                    const isUnlocked = customizerState.unlockedSkinIds.includes(skin.id);
                    const isEquipped = customizerState.equippedSkinIds[selectedToolType] === skin.id;

                    return (
                      <div
                        key={skin.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-slate-950/90 border-pink-500/50 shadow-lg shadow-pink-950/30'
                            : isUnlocked
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/40 border-slate-800/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              {/* Color Swatch */}
                              <div
                                className="w-8 h-8 rounded-xl border shadow-sm flex items-center justify-center"
                                style={{
                                  backgroundColor: skin.accentColor,
                                  borderColor: skin.accentColor,
                                  boxShadow: `0 0 10px ${skin.glowColor}`,
                                }}
                              >
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">{skin.skinName}</h4>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Pattern: {skin.texturePattern}
                                </span>
                              </div>
                            </div>

                            {isEquipped && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono font-bold border border-pink-500/30">
                                Equipped
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            {skin.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectSkin(skin)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isEquipped
                              ? 'bg-slate-800 text-slate-400 cursor-default'
                              : isUnlocked
                              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                              : currentXP >= (skin.xpPrice || 100)
                              ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isEquipped ? (
                            <span>Currently Active</span>
                          ) : isUnlocked ? (
                            <span>Equip Shader</span>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-pink-300 fill-pink-300" />
                              <span>Unlock Shader ({skin.xpPrice || 100} XP)</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Workbench Surface & Atmospheric Lighting */}
            {activeTab === 'environment' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Desk Surfaces Section */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Laboratory Desk Deck Material
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Select a physical material for your simulation workbench desk.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WORKBENCH_SURFACES.map((surf) => {
                      const isEquipped = customizerState.deskSurface === surf.id;
                      const isUnlocked = surf.costXP === 0 || customizerState.unlockedSkinIds.includes(`surf-${surf.id}`);

                      return (
                        <div
                          key={surf.id}
                          onClick={() => handleSelectSurface(surf)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-slate-950/90 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/40'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <h4 className="text-xs font-bold text-white">{surf.name}</h4>
                              {isEquipped ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                                  Fitted
                                </span>
                              ) : !isUnlocked ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                                  {surf.costXP} XP
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-400 mb-2">{surf.description}</p>
                            <span className="text-[10px] font-mono text-cyan-400 block">
                              Material: {surf.material}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lighting Section */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Ambient Radiation & Photonic Spectrum
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Adjust the room wavelength spectrum to heighten visual contrast and fluorescence.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WORKBENCH_LIGHTINGS.map((light) => {
                      const isEquipped = customizerState.ambientLighting === light.id;
                      const isUnlocked = light.costXP === 0 || customizerState.unlockedSkinIds.includes(`light-${light.id}`);

                      return (
                        <div
                          key={light.id}
                          onClick={() => handleSelectLighting(light)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-slate-950/90 border-purple-500/60 shadow-md ring-1 ring-purple-500/40'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: light.glowColor }}
                                />
                                <h4 className="text-xs font-bold text-white">{light.name}</h4>
                              </div>
                              {isEquipped ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                                  Active
                                </span>
                              ) : !isUnlocked ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                                  {light.costXP} XP
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-400 mb-2">{light.description}</p>
                            <span className="text-[10px] font-mono text-purple-300 block">
                              Wavelength: {light.colorName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Efficiency Benchmark Diagnostics */}
            {activeTab === 'benchmark' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Simulation Hardware Acceleration Diagnostics
                    </h3>
                    <p className="text-xs text-slate-400">
                      Benchmark your equipped laboratory modules against standard university laboratory hardware.
                    </p>
                  </div>
                  <button
                    onClick={handleRunBenchmark}
                    disabled={isBenchmarking}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-md shadow-cyan-600/20"
                  >
                    {isBenchmarking ? 'Running Tests...' : 'Run Diagnostics'}
                  </button>
                </div>

                {/* Benchmark Progress Indicator */}
                {isBenchmarking && (
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 animate-pulse">
                    <span className="text-xs font-mono text-cyan-300 block mb-2">
                      Executing Test Stage {benchmarkStep}/4:
                    </span>
                    <div className="text-sm font-bold text-white">
                      {benchmarkStep === 1 && 'Calculating VSEPR electron cloud eigenmodes...'}
                      {benchmarkStep === 2 && 'Integrating relativistic Keplerian orbital velocity vectors...'}
                      {benchmarkStep === 3 && 'Evaluating Cauchy dispersion and Snell ray reflection matrices...'}
                      {benchmarkStep === 4 && 'Benchmarking telemetry packet throughput & XP streaming...'}
                    </div>
                  </div>
                )}

                {/* Benchmark Results */}
                {benchmarkStats && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">Benchmark Results Verified</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {benchmarkStats.timeReductionPct}% Compute Acceleration
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Stock University Bus</span>
                        <span className="text-base font-bold text-slate-300 font-mono">
                          {(benchmarkStats.stockTimeMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-center">
                        <span className="text-[10px] font-mono uppercase text-cyan-300 block">Your Custom Workbench</span>
                        <span className="text-base font-black text-cyan-200 font-mono">
                          {(benchmarkStats.optimizedTimeMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center">
                        <span className="text-[10px] font-mono uppercase text-emerald-300 block">Mathematical Precision</span>
                        <span className="text-base font-black text-emerald-200 font-mono">
                          {benchmarkStats.convergenceScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your virtual simulations now compute significantly faster with reduced latency and noise. All future lab observations and snapshots will benefit from your active hardware acceleration bus.
                    </p>
                  </div>
                )}

                {/* Efficiency Formula Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono text-slate-400">
                  <div className="text-slate-300 font-bold">Active Simulation Multipliers:</div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span>Base Laboratory Bus:</span>
                    <span className="text-white">100% Efficiency</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span>Hardware Modules Contribution:</span>
                    <span className="text-cyan-300">+{efficiencyStats.totalSimulationEfficiency - 100}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span>Active Telemetry XP Boost:</span>
                    <span className="text-amber-300">+{efficiencyStats.totalXPYieldBonus}% Bonus XP</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2">
                    <span className="text-white font-bold">Effective Rating:</span>
                    <span className="text-emerald-400 font-black">{efficiencyStats.totalSimulationEfficiency}% High-Throughput</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Upgrades dynamically enhance 3D laboratory calculations and XP gains across KEV Academy.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-all shadow-md shadow-cyan-600/20"
          >
            Apply & Return to Laboratory
          </button>
        </div>

      </div>
    </div>
  );
};
