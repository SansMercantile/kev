import { xrApi } from '../../lib/xrApi';
import { cachedFetch, onReconnect } from '../../lib/offline';
import { STATIC_FLOORS } from '../../data/campusFloors';
import { CAMPUS_FLOORS } from '../../data/schoolCampus';
import type { CampusFloorNumber } from './VirtualCampus';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  X,
  Compass,
  Layers,
  FlaskConical,
  Orbit,
  Dna,
  Sparkles,
  Users,
  ChevronRight,
  Search,
  ExternalLink,
  ArrowRight,
  Info,
  Radio
} from 'lucide-react';
import { CampusFacility, CampusFloor, LabId } from '../../types';

interface Props {
  isOpen?: boolean;
  currentFloor?: CampusFloorNumber;
  initialFloor?: CampusFloorNumber;
  onSelectFloor?: (floor: CampusFloorNumber) => void;
  onTeleportToRoom?: (facility: CampusFacility, floor: CampusFloorNumber) => void;
  onTeleportToFacility?: (facility: CampusFacility, floor: CampusFloorNumber) => void;
  onDirectLaunchLab?: (labId: LabId) => void;
  onClose: () => void;
}

/**
 * Offline floor set for the 2D map.
 *
 * `CAMPUS_FLOORS` is the generated mirror of `GET /xr/campus/school` and carries
 * all eleven floors (0 = Grand Concourse Hallway, 1-4 legacy wings, 5-10 subject
 * wings). `STATIC_FLOORS` is the older hand-authored 4-floor mirror; it is merged
 * in floor-by-floor so any richer legacy facility record survives, and nothing is
 * dropped when the API is unreachable.
 */
const OFFLINE_FLOORS: CampusFloor[] = (() => {
  const unified = CAMPUS_FLOORS as unknown as CampusFloor[];
  const legacy = STATIC_FLOORS as unknown as CampusFloor[];
  const merged = unified.map((floor) => {
    const legacyFloor = legacy.find((f) => f.floorNumber === floor.floorNumber);
    if (!legacyFloor) return floor;
    // Prefer whichever source has more facility detail for this floor.
    const legacyFacilities = legacyFloor.facilities ?? [];
    const unifiedFacilities = floor.facilities ?? [];
    if (legacyFacilities.length <= unifiedFacilities.length) return floor;
    return { ...floor, facilities: legacyFacilities };
  });
  // Any legacy floor absent from the unified mirror is still worth showing.
  legacy.forEach((floor) => {
    if (!merged.some((f) => f.floorNumber === floor.floorNumber)) merged.push(floor);
  });
  return merged.sort((a, b) => a.floorNumber - b.floorNumber);
})();

/** Compact tab label for a floor number. */
function shortFloorName(num: number): string {
  const floor = OFFLINE_FLOORS.find((f) => f.floorNumber === num);
  const name = floor?.name ?? `Floor ${num}`;
  // Names look like "Floor 5: Mathematics & Computing Wing" — keep the tail.
  const tail = name.split(':').slice(1).join(':').trim();
  return tail || name;
}

export const VirtualCampusMapModal: React.FC<Props> = ({
  isOpen = true,
  currentFloor,
  initialFloor,
  onSelectFloor,
  onTeleportToRoom,
  onTeleportToFacility,
  onDirectLaunchLab,
  onClose,
}) => {
  const { t } = useTranslation();
  // Floor 0 (the Grand Concourse Hallway) is a real destination, so resolve
  // with ?? rather than || — `|| 1` would silently discard it.
  const startingFloor = initialFloor ?? currentFloor ?? 0;
  const [selectedFloorNum, setSelectedFloorNum] = useState<CampusFloorNumber>(startingFloor);
  const [floors, setFloors] = useState<CampusFloor[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<CampusFacility | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync if initialFloor or currentFloor changes
  useEffect(() => {
    if (initialFloor != null) setSelectedFloorNum(initialFloor);
    else if (currentFloor != null) setSelectedFloorNum(currentFloor);
  }, [initialFloor, currentFloor]);

  // Fetch campus floor layout from API (cached; static bundle offline)
  useEffect(() => {
    async function loadFloors() {
      try {
        const data = await cachedFetch<{ floors?: CampusFloor[] }>(xrApi('/campus/floors'), {
          fallback: { floors: OFFLINE_FLOORS },
        });
        if (data.floors) {
          setFloors(data.floors);
          // Set initial facility
          const currentF = data.floors.find((f: CampusFloor) => f.floorNumber === selectedFloorNum);
          if (currentF && currentF.facilities.length > 0) {
            setSelectedFacility(currentF.facilities[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load campus floors:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFloors();
    return onReconnect(loadFloors);
  }, []);

  const currentFloorData = floors.find((f) => f.floorNumber === selectedFloorNum);

  /** Every floor number the map can show, in ascending order. */
  const floorTabs: CampusFloorNumber[] = (floors.length ? floors : OFFLINE_FLOORS)
    .map((f) => f.floorNumber as CampusFloorNumber)
    .sort((a, b) => a - b);

  const handleFloorChange = (fNum: CampusFloorNumber) => {
    setSelectedFloorNum(fNum);
    onSelectFloor?.(fNum);
    const floorObj = floors.find((f) => f.floorNumber === fNum);
    if (floorObj && floorObj.facilities.length > 0) {
      setSelectedFacility(floorObj.facilities[0]);
    }
  };

  const filteredFacilities = currentFloorData?.facilities.filter((fac) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      fac.name.toLowerCase().includes(q) ||
      fac.roomNumber.toLowerCase().includes(q) ||
      fac.description.toLowerCase().includes(q) ||
      (fac.tutorInResidence && fac.tutorInResidence.toLowerCase().includes(q))
    );
  }) || [];

  // Helper for room color
  const getRoomColor = (type: CampusFacility['type']) => {
    switch (type) {
      case 'lab':
        return 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40';
      case 'observatory':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40';
      case 'cleanroom':
        return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40';
      case 'auditorium':
        return 'border-purple-500/50 bg-purple-950/40 text-purple-300 hover:bg-purple-900/40';
      case 'lounge':
        return 'border-blue-500/50 bg-blue-950/40 text-blue-300 hover:bg-blue-900/40';
      default:
        return 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-850';
    }
  };

  const getRoomIcon = (type: CampusFacility['type'], labId?: LabId) => {
    if (labId === 'chemistry') return <FlaskConical className="w-4 h-4 text-cyan-400" />;
    if (labId === 'astrophysics') return <Orbit className="w-4 h-4 text-amber-400" />;
    if (labId === 'biology') return <Dna className="w-4 h-4 text-emerald-400" />;
    if (labId === 'optics') return <Sparkles className="w-4 h-4 text-violet-400" />;

    switch (type) {
      case 'observatory':
        return <Orbit className="w-4 h-4 text-amber-400" />;
      case 'lab':
      case 'cleanroom':
        return <FlaskConical className="w-4 h-4 text-cyan-400" />;
      case 'auditorium':
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <Compass className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {t('xr.mapTitle')}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  4-Floor Architectural Blueprint
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect 2D top-down blueprints and click any facility or laboratory to teleport your 3D spatial position
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floor Selection Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Floor Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {floorTabs.map((num) => {
              const fl = floors.find((f) => f.floorNumber === num);
              const isActive = selectedFloorNum === num;
              return (
                <button
                  key={num}
                  onClick={() => handleFloorChange(num)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Floor {num}</span>
                  {fl && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono hidden md:inline ${
                        isActive ? 'bg-slate-950/30 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {fl?.subtitle?.split('—')[0]?.trim() || shortFloorName(num)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms or labs..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Blueprint & Room Detail Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: 2D Top-Down Interactive Blueprint Stage */}
          <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-slate-950 via-[#070b16] to-slate-950 flex flex-col items-center justify-center relative select-none">
            {/* Architectural Blueprint Grid Backdrop */}
            <div className="w-full max-w-2xl bg-slate-950 border-2 border-slate-800/90 rounded-2xl p-6 relative shadow-2xl overflow-hidden min-h-[380px]">
              {/* Floor Header Label */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {currentFloorData?.name || `Floor ${selectedFloorNum} Plan`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>Central Elevator Shaft: Active</span>
                </div>
              </div>

              {/* Blueprint Grid Layout of Facilities on this Floor */}
              <div className="grid grid-cols-2 gap-4 my-auto">
                {filteredFacilities.map((fac) => {
                  const isSelected = selectedFacility?.id === fac.id;
                  const roomStyle = getRoomColor(fac.type);

                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFacility(fac)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/20'
                          : `${roomStyle} hover:border-slate-500`
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60">
                          {fac.roomNumber}
                        </span>
                        <div className="p-1 rounded bg-slate-900/80">{getRoomIcon(fac.type, fac.associatedLabId)}</div>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {fac.name}
                        </h5>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{fac.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-cyan-400 font-semibold">{fac.interactActionLabel}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>

                      {/* Radar pin on selected room */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Central Hallway / Atrium Corridor Divider */}
              <div className="mt-5 py-2 px-3 rounded-lg bg-slate-900/70 border border-dashed border-slate-800 text-center text-[10px] font-mono text-slate-500">
                ═══ Central Circulation Concourse & Holographic Elevator ═══
              </div>
            </div>
          </div>

          {/* Right: Selected Facility Inspection & Teleport Action Panel */}
          <div className="w-full lg:w-80 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
            {selectedFacility ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedFacility.roomNumber}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Floor {selectedFloorNum}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{selectedFacility.name}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedFacility.description}</p>
                </div>

                {/* Tutor / Resident Information */}
                {selectedFacility.tutorInResidence && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Faculty In-Residence</span>
                    <span className="text-xs font-semibold text-cyan-300 mt-0.5 block">
                      {selectedFacility.tutorInResidence === 'dr-ward'
                        ? 'Dr. Elena Ward (Foundational Sciences)'
                        : selectedFacility.tutorInResidence === 'dr-chen'
                        ? 'Dr. Sarah Chen (Cellular Bio)'
                        : selectedFacility.tutorInResidence === 'dr-alvarez'
                        ? 'Dr. Marcus Alvarez (Astrophysics)'
                        : 'Prof. KEV (Lead Science Director)'}
                    </span>
                  </div>
                )}

                {/* Spatial Coordinates */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Spatial Vector Anchor</span>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>X: {selectedFacility.coordinates.x}m</span>
                    <span>Floor Level: {selectedFloorNum}F</span>
                    <span>Z: {selectedFacility.coordinates.z}m</span>
                  </div>
                </div>

                {/* Teleport Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      if (onTeleportToFacility) {
                        onTeleportToFacility(selectedFacility, selectedFloorNum);
                      } else if (onTeleportToRoom) {
                        onTeleportToRoom(selectedFacility, selectedFloorNum);
                      }
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Teleport Spatial View Here</span>
                  </button>

                  {selectedFacility.associatedLabId && onDirectLaunchLab && (
                    <button
                      onClick={() => {
                        onDirectLaunchLab(selectedFacility.associatedLabId!);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Launch 3D {selectedFacility.associatedLabId.toUpperCase()} Lab</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <Compass className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs">Select any room on the blueprint to view details and teleport</p>
              </div>
            )}

            {/* Hint at bottom */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Teleporting updates your camera position in the 3D school space.</span>
            </div>

            {/* Live KEV surfaces */}
            <div className="pt-3 flex flex-wrap gap-2 text-[11px]">
              <a href="/campus-map" className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.liveCampusMap')}</a>
              <a href="/vr" className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.vrCampusLink')}</a>
              <a href="/anatomy" className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 no-underline">{t('xr.immersiveLabLink')}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
