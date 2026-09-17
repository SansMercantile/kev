import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Radio,
  Orbit,
  Dna,
  Activity,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Check,
  TrendingUp,
  Cpu,
  Paintbrush,
  Flame,
  Palette
} from 'lucide-react';
import { LabEquipment, LabId, ToolSkinCustomization } from '../../types';
import { LAB_EQUIPMENT_CATALOG } from '../../data/labEquipment';
import { TOOL_SKINS_CATALOG } from '../../data/toolSkins';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  currentXP: number;
  unlockedEquipmentIds: string[];
  equippedToolId?: string;
  onPurchaseEquipment: (tool: LabEquipment) => void;
  onEquipTool: (toolId: string) => void;
  onClose: () => void;
  onDeductXP?: (amount: number) => void;
}

export const EquipmentShopModal: React.FC<Props> = ({
  currentXP,
  unlockedEquipmentIds = [],
  equippedToolId,
  onPurchaseEquipment,
  onEquipTool,
  onClose,
  onDeductXP,
}) => {
  const { showToast } = useToast();
  const [shopMode, setShopMode] = useState<'catalog' | 'customizer'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectingTool, setInspectingTool] = useState<LabEquipment | null>(null);

  // Tool Skins state
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('kev_unlocked_skins');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return ['skin-bunsen-plasma-aurora', 'skin-laser-deep-space'];
  });

  const [equippedSkins, setEquippedSkins] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('kev_equipped_skins');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      bunsen_burner: 'skin-bunsen-plasma-aurora',
      laser_collimator: 'skin-laser-deep-space',
    };
  });

  const [selectedSkinTool, setSelectedSkinTool] = useState<'bunsen_burner' | 'laser_collimator' | 'micropipette' | 'spectrometer'>('bunsen_burner');
  const [selectedSkin, setSelectedSkin] = useState<ToolSkinCustomization>(TOOL_SKINS_CATALOG[0]);

  const filteredTools = LAB_EQUIPMENT_CATALOG.filter((tool) => {
    if (selectedCategory === 'all') return true;
    return tool.category === selectedCategory;
  });

/**
 * Resolve a skin's XP price.
 *
 * `ToolSkinCustomization.xpPrice` is optional on the shared type (the catalog
 * always sets it, but the type is also used for server-provided skins that may
 * not). Reading it directly made the affordability test
 * `currentXP < undefined` evaluate to false, so a skin with no price could be
 * "purchased" for free and `onDeductXP(undefined)` was called. Every price
 * comparison in this modal now goes through this helper.
 */
function skinPrice(skin: ToolSkinCustomization): number {
  return skin.xpPrice ?? skin.costXP ?? 0;
}

/**
 * Resolve the tool a skin belongs to.
 *
 * `toolType` is optional on the type but is used as an object key for the
 * equipped-skin map; an undefined key would silently collide across tools.
 */
function skinToolType(skin: ToolSkinCustomization): string {
  return skin.toolType ?? skin.toolId ?? 'unknown_tool';
}

  const filteredSkins = TOOL_SKINS_CATALOG.filter((skin) => skin.toolType === selectedSkinTool);

  const handleBuySkin = (skin: ToolSkinCustomization) => {
    const price = skinPrice(skin);
    if (currentXP < price) {
      showToast({
        type: 'error',
        title: 'Insufficient Academic XP',
        message: `You need ${price - currentXP} more XP to calibrate the ${skin.skinName} shader.`,
      });
      return;
    }

    soundManager.playBadge();
    const updated = [...unlockedSkinIds, skin.id];
    setUnlockedSkinIds(updated);
    localStorage.setItem('kev_unlocked_skins', JSON.stringify(updated));

    if (onDeductXP) {
      onDeductXP(price);
    }

    showToast({
      type: 'badge',
      title: 'Holographic Skin Acquired!',
      message: `${skin.skinName} shader unlocked for ${skin.toolName}.`,
    });
  };

  const handleEquipSkin = (skin: ToolSkinCustomization) => {
    soundManager.playClick();
    const updated = { ...equippedSkins, [skinToolType(skin)]: skin.id };
    setEquippedSkins(updated);
    localStorage.setItem('kev_equipped_skins', JSON.stringify(updated));
    showToast({
      type: 'success',
      title: 'Active Shader Calibrated',
      message: `${skin.skinName} texture applied to ${skin.toolName} in 3D Labs.`,
    });
  };

  const handleBuy = (tool: LabEquipment) => {
    if (currentXP < tool.costXP) {
      showToast({
        type: 'error',
        title: 'Insufficient Academic XP',
        message: `You need ${tool.costXP - currentXP} more XP to acquire the ${tool.name}. Complete more labs or quizzes!`,
      });
      return;
    }

    soundManager.playEquipmentPurchase();
    onPurchaseEquipment(tool);
    showToast({
      type: 'badge',
      title: 'Equipment Acquired!',
      message: `${tool.name} added to your Virtual Research Inventory.`,
    });
  };

  const handleEquip = (toolId: string) => {
    soundManager.playClick();
    onEquipTool(toolId);
    showToast({
      type: 'info',
      title: 'Tool Equipped in 3D Labs',
      message: 'Active scientific analysis overlay calibrated.',
    });
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Prototype':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Quantum':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Elite':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chemistry':
        return <Radio className="w-4 h-4 text-cyan-400" />;
      case 'astrophysics':
        return <Orbit className="w-4 h-4 text-amber-400" />;
      case 'biology':
        return <Dna className="w-4 h-4 text-emerald-400" />;
      case 'optics':
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  KEV Laboratory Equipment Shop
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Research Depot
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spend accumulated XP on high-precision research instruments with specialized analysis features.
              </p>
            </div>
          </div>

          {/* XP Balance Counter */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Available XP Balance</span>
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
              title="Close Equipment Shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Shop Mode Selector */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShopMode('catalog')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                shopMode === 'catalog'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Lab Instruments Catalog</span>
            </button>

            <button
              onClick={() => setShopMode('customizer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                shopMode === 'customizer'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Visual Customization & Tool Skins</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-mono">
                XP Shaders
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            {shopMode === 'catalog' ? 'High-Precision Research Gear' : 'Holographic, Neon & Metallic Textures'}
          </span>
        </div>

        {shopMode === 'customizer' ? (
          /* Visual Instrument Customizer View */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tool Selection */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800">
              <span className="text-xs font-bold font-mono uppercase text-slate-400 mr-2">Target Instrument:</span>
              {[
                { id: 'bunsen_burner', label: 'Bunsen Burner' },
                { id: 'laser_collimator', label: 'Laser Collimator' },
                { id: 'micropipette', label: 'Micro-Pipette' },
                { id: 'spectrometer', label: 'Spectrometer' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedSkinTool(t.id as any);
                    const defaultForTool = TOOL_SKINS_CATALOG.find((s) => s.toolType === t.id);
                    if (defaultForTool) setSelectedSkin(defaultForTool);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSkinTool === t.id
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Customizer Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Skins Catalog for Selected Tool */}
              <div className="lg:col-span-6 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block">
                  Available Shader Skins
                </span>

                {filteredSkins.map((skin) => {
                  const isUnlocked = unlockedSkinIds.includes(skin.id);
                  const isEquipped = equippedSkins[skinToolType(skin)] === skin.id;
                  const isInspecting = selectedSkin.id === skin.id;
                  const canAfford = currentXP >= skinPrice(skin);

                  return (
                    <div
                      key={skin.id}
                      onClick={() => setSelectedSkin(skin)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isInspecting
                          ? 'bg-slate-900 border-pink-500/80 shadow-lg shadow-pink-500/10'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 relative overflow-hidden"
                            style={{
                              borderColor: skin.accentColor,
                              boxShadow: `0 0 15px ${skin.glowColor}`,
                              backgroundColor: '#090d16',
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded-full"
                              style={{ backgroundColor: skin.accentColor }}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white leading-snug">
                                {skin.skinName}
                              </h4>
                              {isEquipped && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                                  Equipped
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 capitalize">
                              {skin.texturePattern.replace('_', ' ')} Finish
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {isUnlocked ? (
                            <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Unlocked</span>
                            </span>
                          ) : (
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {skin.xpPrice} XP
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {skin.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Interactive 3D Visual Shader Preview */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 block">
                        Optical Material Calibration
                      </span>
                      <h3 className="text-lg font-bold text-white">{selectedSkin.skinName}</h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold">
                      {selectedSkin.toolName}
                    </span>
                  </div>

                  {/* Visual Shader Preview Box */}
                  <div
                    className="relative w-full h-56 rounded-2xl border flex flex-col items-center justify-center overflow-hidden transition-all duration-500"
                    style={{
                      borderColor: selectedSkin.accentColor,
                      boxShadow: `0 0 35px ${selectedSkin.glowColor}`,
                      background: `radial-gradient(circle at center, ${selectedSkin.glowColor} 0%, #030712 75%)`,
                    }}
                  >
                    {/* Simulated Tool Shader Mesh Graphic */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-transform duration-300 hover:scale-110 shadow-2xl"
                        style={{
                          borderColor: selectedSkin.accentColor,
                          backgroundColor: '#0f172a',
                          boxShadow: `0 0 25px ${selectedSkin.glowColor}`,
                        }}
                      >
                        {selectedSkinTool === 'bunsen_burner' && (
                          <Flame className="w-8 h-8 animate-pulse" style={{ color: selectedSkin.accentColor }} />
                        )}
                        {selectedSkinTool === 'laser_collimator' && (
                          <Radio className="w-8 h-8 animate-pulse" style={{ color: selectedSkin.accentColor }} />
                        )}
                        {selectedSkinTool === 'micropipette' && (
                          <Activity className="w-8 h-8 animate-pulse" style={{ color: selectedSkin.accentColor }} />
                        )}
                        {selectedSkinTool === 'spectrometer' && (
                          <Sparkles className="w-8 h-8 animate-pulse" style={{ color: selectedSkin.accentColor }} />
                        )}
                      </div>

                      {/* Texture Pattern Pill */}
                      <span className="mt-3 text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900/90 border border-white/20 text-white shadow-md">
                        {selectedSkin.texturePattern.toUpperCase().replace('_', ' ')} SHADER ACTIVE
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">
                      EMISSIVE COLOR: {selectedSkin.accentColor}
                    </div>
                    <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">
                      REFRACTIVE INDEX: 1.54
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {equippedSkins[skinToolType(selectedSkin)] === selectedSkin.id ? (
                      <div className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40 text-center flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>Equipped on {selectedSkin.toolName} in 3D Labs</span>
                      </div>
                    ) : unlockedSkinIds.includes(selectedSkin.id) ? (
                      <button
                        onClick={() => handleEquipSkin(selectedSkin)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                      >
                        Equip Shader Skin to Lab Tool
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuySkin(selectedSkin)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Unlock Shader Texture ({selectedSkin.xpPrice} XP)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Catalog View */
          <>
            {/* Category Filters Bar */}
            <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Equipment' },
                  { id: 'chemistry', label: 'Chemistry' },
                  { id: 'astrophysics', label: 'Astrophysics' },
                  { id: 'biology', label: 'Cellular Bio' },
                  { id: 'optics', label: 'Wave Optics' },
                  { id: 'multi_discipline', label: 'Multi-Discipline' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                <span>
                  Owned: <strong>{unlockedEquipmentIds.length}</strong> / {LAB_EQUIPMENT_CATALOG.length} Instruments
                </span>
              </div>
            </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTools.map((tool) => {
              const isOwned = unlockedEquipmentIds.includes(tool.id);
              const isEquipped = equippedToolId === tool.id;
              const canAfford = currentXP >= tool.costXP;

              return (
                <div
                  key={tool.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isEquipped
                      ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/10'
                      : isOwned
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Tag & Cost */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getTierBadge(tool.tier)}`}>
                          {tool.tier} Tier
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono capitalize">
                          {getCategoryIcon(tool.category)}
                          <span>{tool.category.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        {isOwned ? (
                          <span className="flex items-center gap-1 text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Acquired
                          </span>
                        ) : (
                          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${canAfford ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                            <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{tool.costXP} XP</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name & Tagline */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-cyan-300/90 font-mono mt-0.5">{tool.tagline}</p>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Features List */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                        Specialized Analysis Features:
                      </span>
                      {tool.dataAnalysisFeatures.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Telemetry Boost Highlights */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {tool.telemetryStats.map((stat, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">{stat.label}</span>
                          <span className="text-[11px] font-mono font-bold text-white block">{stat.value}</span>
                          <span className="text-[9px] font-mono text-emerald-400 block mt-0.5">{stat.boost}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setInspectingTool(tool)}
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold cursor-pointer underline"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Live Telemetry Preview</span>
                    </button>

                    {isOwned ? (
                      isEquipped ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Active in 3D Labs</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquip(tool.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                        >
                          Equip Instrument
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuy(tool)}
                        disabled={!canAfford}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Unlock for {tool.costXP} XP</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Diagnostic Preview Sub-Modal */}
        {inspectingTool && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setInspectingTool(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{inspectingTool.name}</h3>
                  <span className="text-xs font-mono text-cyan-300">Live Telemetry & Signal Stream</span>
                </div>
              </div>

              {/* Simulated Oscilloscope & Spectral HUD */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    COHERENT CARRIER FREQ: 589.3 nm
                  </span>
                  <span>SAMPLE: 50 kS/s</span>
                </div>

                {/* SVG Simulated Dynamic Waveform */}
                <div className="h-28 w-full bg-slate-900/80 rounded-xl border border-cyan-500/30 p-2 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <svg className="w-full h-full text-cyan-400" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <path
                      d="M 0 50 Q 25 15, 50 50 T 100 50 T 150 20 T 200 80 T 250 50 T 300 10 T 350 90 T 400 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 0 50 Q 30 70, 60 50 T 120 50 T 180 30 T 240 70 T 300 40 T 360 60 T 400 50"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  </svg>
                  <div className="absolute bottom-1 right-2 text-[10px] text-slate-500">
                    FFT RESOLUTION: 4096 BINS
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">PRIMARY EMISSION PEAK</span>
                    <strong className="text-emerald-400">λ = 656.28 nm (H-Alpha)</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">ISOTOPIC RATIO</span>
                    <strong className="text-amber-400">12C / 13C = 89.4 ± 0.2</strong>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                When equipped, this high-precision instrument embeds into your virtual laboratory HUD, overlaying real-time analytical graphs, vector fields, and precision telemetry measurements.
              </p>

              <button
                onClick={() => setInspectingTool(null)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-md"
              >
                Close Diagnostic Preview
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
};
