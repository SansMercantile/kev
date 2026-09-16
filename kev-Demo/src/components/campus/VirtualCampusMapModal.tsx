import React, { useState, useEffect } from 'react';
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
  Radio,
  Award,
  CheckCircle2,
  Trophy,
  Footprints,
  Flame,
  AlertCircle
} from 'lucide-react';
import { CampusFacility, CampusFloor, LabId } from '../../types';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

export interface DiscoveryStep {
  step: number;
  facilityId: string;
  facilityName: string;
  roomNumber: string;
  floorNumber: 1 | 2 | 3 | 4;
  associatedLabId?: LabId;
  objective: string;
  scientificFocus: string;
  coordinates: { x: number; z: number };
  xpReward: number;
}

export const DISCOVERY_PATH_STEPS: DiscoveryStep[] = [
  {
    step: 1,
    facilityId: 'fac-201',
    facilityName: 'VSEPR Synthetic Chemistry Laboratory',
    roomNumber: 'Lab 201',
    floorNumber: 2,
    associatedLabId: 'chemistry',
    objective: 'Observe valence shell electron repulsion geometries & 3D covalent angles.',
    scientificFocus: 'VSEPR Theory & Bond Dipoles',
    coordinates: { x: -10, z: -6 },
    xpReward: 25,
  },
  {
    step: 2,
    facilityId: 'fac-401',
    facilityName: 'Cellular Biology & Eukaryotic Organelle Lab',
    roomNumber: 'Lab 401',
    floorNumber: 4,
    associatedLabId: 'biology',
    objective: 'Inspect cryogenic electron microscopy models of mitochondria and ATP generation.',
    scientificFocus: 'Organelle Ultrastructure & Chemiosmosis',
    coordinates: { x: -10, z: -6 },
    xpReward: 25,
  },
  {
    step: 3,
    facilityId: 'fac-302',
    facilityName: 'Quantum Optics & Laser Dispersion Suite',
    roomNumber: 'Lab 302',
    floorNumber: 3,
    associatedLabId: 'optics',
    objective: 'Measure critical angle of refraction across crown-glass prisms.',
    scientificFocus: "Snell's Law & Wave-Particle Photonic Dispersion",
    coordinates: { x: 10, z: -6 },
    xpReward: 25,
  },
  {
    step: 4,
    facilityId: 'fac-301',
    facilityName: 'Keplerian Astrophysics & Gravitational Observatory',
    roomNumber: 'Lab 301',
    floorNumber: 3,
    associatedLabId: 'astrophysics',
    objective: 'Simulate N-body celestial orbital velocity vectors and Keplerian ellipses.',
    scientificFocus: "Newton's Gravity & Relativistic Geodesics",
    coordinates: { x: -10, z: -6 },
    xpReward: 25,
  },
  {
    step: 5,
    facilityId: 'fac-102',
    facilityName: 'Digital Science Exhibition Gallery',
    roomNumber: 'Room 102',
    floorNumber: 1,
    objective: 'Synthesize interdisciplinary data to complete the grand campus discovery path.',
    scientificFocus: 'Unified Scientific Method & Empirical Synthesis',
    coordinates: { x: 12, z: -4 },
    xpReward: 50,
  },
];

interface Props {
  isOpen?: boolean;
  currentFloor?: 1 | 2 | 3 | 4;
  initialFloor?: 1 | 2 | 3 | 4;
  onSelectFloor?: (floor: 1 | 2 | 3 | 4) => void;
  onTeleportToRoom?: (facility: CampusFacility, floor: 1 | 2 | 3 | 4) => void;
  onTeleportToFacility?: (facility: CampusFacility, floor: 1 | 2 | 3 | 4) => void;
  onDirectLaunchLab?: (labId: LabId) => void;
  onAwardXP?: (xp: number, reason: string) => void;
  onClose: () => void;
}

export const VirtualCampusMapModal: React.FC<Props> = ({
  isOpen = true,
  currentFloor,
  initialFloor,
  onSelectFloor,
  onTeleportToRoom,
  onTeleportToFacility,
  onDirectLaunchLab,
  onAwardXP,
  onClose,
}) => {
  const startingFloor = initialFloor || currentFloor || 1;
  const [selectedFloorNum, setSelectedFloorNum] = useState<1 | 2 | 3 | 4>(startingFloor);
  const [floors, setFloors] = useState<CampusFloor[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<CampusFacility | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { showToast } = useToast();
  const [mapMode, setMapMode] = useState<'blueprint' | 'discovery_path'>('blueprint');
  const [visitedDiscoverySteps, setVisitedDiscoverySteps] = useState<number[]>(() => {
    const saved = localStorage.getItem('kev_discovery_path_visited');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [claimedPioneerBonus, setClaimedPioneerBonus] = useState<boolean>(() => {
    return localStorage.getItem('kev_discovery_path_bonus_claimed') === 'true';
  });

  const handleStepVisit = (stepObj: DiscoveryStep) => {
    const isStepAlreadyVisited = visitedDiscoverySteps.includes(stepObj.step);
    const isNextInSequence = stepObj.step === 1 || visitedDiscoverySteps.includes(stepObj.step - 1);

    if (!isStepAlreadyVisited && isNextInSequence) {
      soundManager.playBadge();
      const updated = [...visitedDiscoverySteps, stepObj.step];
      setVisitedDiscoverySteps(updated);
      localStorage.setItem('kev_discovery_path_visited', JSON.stringify(updated));

      if (onAwardXP) {
        onAwardXP(stepObj.xpReward, `Completed Lab Discovery Path Step ${stepObj.step}: ${stepObj.facilityName}`);
      }

      showToast({
        type: 'success',
        title: `Discovery Checkpoint ${stepObj.step}/5 Verified!`,
        message: `Arrived at ${stepObj.facilityName} (${stepObj.roomNumber}). Awarded +${stepObj.xpReward} XP!`,
      });
    }

    const targetFacility: CampusFacility = {
      id: stepObj.facilityId,
      roomNumber: stepObj.roomNumber,
      name: stepObj.facilityName,
      type: 'lab',
      associatedLabId: stepObj.associatedLabId,
      description: stepObj.objective,
      interactActionLabel: 'Enter Lab Station',
      coordinates: stepObj.coordinates,
    };

    if (onTeleportToFacility) {
      onTeleportToFacility(targetFacility, stepObj.floorNumber);
    } else if (onTeleportToRoom) {
      onTeleportToRoom(targetFacility, stepObj.floorNumber);
    }
    onClose();
  };

  const handleClaimGrandBonus = () => {
    if (claimedPioneerBonus) return;
    soundManager.playSuccess();
    setClaimedPioneerBonus(true);
    localStorage.setItem('kev_discovery_path_bonus_claimed', 'true');
    if (onAwardXP) {
      onAwardXP(150, 'Completed Entire KEV Campus Lab Discovery Path');
    }
    showToast({
      type: 'badge',
      title: 'Grand Discovery Path Pioneer Unlocked!',
      message: 'You visited all 5 virtual lab stations in sequence! +150 XP Academic Bounty awarded.',
    });
  };

  const handleResetDiscoveryPath = () => {
    setVisitedDiscoverySteps([]);
    setClaimedPioneerBonus(false);
    localStorage.removeItem('kev_discovery_path_visited');
    localStorage.removeItem('kev_discovery_path_bonus_claimed');
    showToast({
      type: 'info',
      title: 'Lab Discovery Path Reset',
      message: 'Sequence restarted. You can explore the path again.',
    });
  };

  // Sync if initialFloor or currentFloor changes
  useEffect(() => {
    if (initialFloor) setSelectedFloorNum(initialFloor);
    else if (currentFloor) setSelectedFloorNum(currentFloor);
  }, [initialFloor, currentFloor]);

  // Fetch campus floor layout from API
  useEffect(() => {
    async function loadFloors() {
      try {
        const res = await fetch('/api/campus/floors');
        const data = await res.json();
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
  }, []);

  const currentFloorData = floors.find((f) => f.floorNumber === selectedFloorNum);

  const handleFloorChange = (fNum: 1 | 2 | 3 | 4) => {
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
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-20 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                KEV Virtual Campus Map & Teleportation Directory
              </h3>
              <p className="text-xs text-slate-400">
                Inspect 2D top-down blueprints or follow the sequential Lab Discovery Path to earn XP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Buttons */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setMapMode('blueprint')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mapMode === 'blueprint'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Architectural Blueprint</span>
              </button>

              <button
                onClick={() => setMapMode('discovery_path')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mapMode === 'discovery_path'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Lab Discovery Path</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  mapMode === 'discovery_path' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {visitedDiscoverySteps.length}/5 • +150 XP
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mapMode === 'discovery_path' ? (
          /* Lab Discovery Path Interactive Sequence View */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
            {/* Discovery Path Top Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                  <Footprints className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-white tracking-wide">
                      Campus Lab Discovery Path
                    </h4>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                      Sequential Scientific Tour
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    Visit each specialized science laboratory in designated empirical sequence. Verify scientific hypotheses across chemistry, cellular biology, optics, astrophysics, and interdisciplinary synthesis to earn academic XP.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-bold">{visitedDiscoverySteps.length} of 5 Stations Completed</span>
                </div>
                {visitedDiscoverySteps.length === 5 && !claimedPioneerBonus && (
                  <button
                    onClick={handleClaimGrandBonus}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 animate-bounce cursor-pointer transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Claim Grand Pioneer Bonus (+150 XP)</span>
                  </button>
                )}
                {claimedPioneerBonus && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pioneer Bonus Claimed (+150 XP)
                    </span>
                    <button
                      onClick={handleResetDiscoveryPath}
                      className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                    >
                      Reset Route
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(visitedDiscoverySteps.length / 5) * 100}%` }}
              />
            </div>

            {/* Stations List */}
            <div className="space-y-3">
              {DISCOVERY_PATH_STEPS.map((stepObj) => {
                const isCompleted = visitedDiscoverySteps.includes(stepObj.step);
                const isNext = stepObj.step === 1 || visitedDiscoverySteps.includes(stepObj.step - 1);
                const isLocked = !isCompleted && !isNext;

                return (
                  <div
                    key={stepObj.step}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                        : isNext
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                          isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : isNext
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : stepObj.step}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="text-sm font-bold text-white">{stepObj.facilityName}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-300">
                            Floor {stepObj.floorNumber} • {stepObj.roomNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            +{stepObj.xpReward} XP Checkpoint
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{stepObj.objective}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="text-slate-500">Focus:</span>
                          <span className="text-cyan-400">{stepObj.scientificFocus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        disabled={isLocked}
                        onClick={() => handleStepVisit(stepObj)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            : isNext
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                          {isCompleted
                            ? 'Revisit Station'
                            : isNext
                            ? 'Teleport & Verify Checkpoint'
                            : 'Locked in Sequence'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Floor Selection Tab Navigation */}
            <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {/* Floor Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[1, 2, 3, 4].map((num) => {
                  const fl = floors.find((f) => f.floorNumber === num);
                  const isActive = selectedFloorNum === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleFloorChange(num as any)}
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
                          {num === 1 ? 'Atrium & Commons' : num === 2 ? 'Bio & Optics' : num === 3 ? 'Astrophysics' : 'XR Labs'}
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
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
