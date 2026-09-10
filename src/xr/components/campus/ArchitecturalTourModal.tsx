import React, { useState } from 'react';
import { X, Building2, Compass, Sparkles, MapPin, Eye, Maximize2, Shield, Info, ArrowRight } from 'lucide-react';
import { PHOTOREALISTIC_ASSETS } from '../../assets/images';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTeleportToFacility?: (facilityId: string) => void;
}

interface ArchitecturalZone {
  id: string;
  title: string;
  category: 'Exterior Grounds' | 'Central Concourse' | 'Advanced Research' | 'Recreation & Athletics';
  subtitle: string;
  image: string;
  architecturalStyle: string;
  specifications: {
    sqMeters: string;
    naturalLightIndex: string;
    materials: string;
    purpose: string;
  };
  description: string;
  highlightFeatures: string[];
}

const ZONES: ArchitecturalZone[] = [
  {
    id: 'exterior-grounds',
    title: 'University Science Quadrangle & Solar Canopies',
    category: 'Exterior Grounds',
    subtitle: 'Main Academic Pavilion & Ecological Grounds',
    image: PHOTOREALISTIC_ASSETS.campus.exteriorHero,
    architecturalStyle: 'Neo-Biophilic High-Tech Modernism',
    specifications: {
      sqMeters: '45,000 m²',
      naturalLightIndex: '98% Daylight Utilization',
      materials: 'Low-E Triple Glazing, Recycled Structural Titanium, Cross-Laminated Timber',
      purpose: 'Central Academic Campus Entry & Outdoor Collaborative Study Zones',
    },
    description:
      'The KEV Academy exterior features soaring curved glass curtain walls, integrated photovoltaic solar canopies, and lush native botanical gardens that regulate micro-climatic temperature. Geometric reflecting pools mirror the evening sky while providing natural geothermal thermal cooling.',
    highlightFeatures: [
      'Bifacial photovoltaic solar glass array powering 100% of academy servers',
      'Geothermal climate regulation loop beneath the central reflection lagoon',
      'Acoustic sound baffles dampening outdoor wind turbulence for open-air study',
      'Pedestrian biometric speed gates leading directly to the Grand Atrium',
    ],
  },
  {
    id: 'central-atrium',
    title: 'Grand Glass Atrium & Biophilic Vertical Gardens',
    category: 'Central Concourse',
    subtitle: 'Floor 1-4 Circulation Hub & Living Architecture',
    image: PHOTOREALISTIC_ASSETS.campus.atriumHero,
    architecturalStyle: 'Parametric Timber & Structural Glass Vaulting',
    specifications: {
      sqMeters: '18,500 m²',
      naturalLightIndex: '100% Sky Exposure',
      materials: 'ETFE Pneumatic Cushions, Anodized Brushed Bronze, Living Fern Walls',
      purpose: 'Inter-Departmental Circulation, Holographic Elevator Shafts & Student Concourse',
    },
    description:
      'Rising 4 stories beneath an expansive structural glass skylight, the Grand Atrium forms the social and scientific spine of KEV Academy. Polished terrazzo marble floors reflect dynamic daylight, flanked by four-story vertical hydroponic garden columns that purify interior air in real-time.',
    highlightFeatures: [
      'Four-story vertical living air-filtration columns housing 12,000 tropical plants',
      'Central kinetic DNA double-helix fountain with laminar fluid jets',
      'High-speed pneumatic magnetic elevator columns connecting all four research tiers',
      'Interactive holographic campus directories with spatial pathfinding beacons',
    ],
  },
  {
    id: 'observatory-dome',
    title: 'Kepler Solar Observatory & Relativistic Dome',
    category: 'Advanced Research',
    subtitle: 'Tier 3 Rooftop Astrophysics Complex',
    image: PHOTOREALISTIC_ASSETS.campus.observatoryPanoramic,
    architecturalStyle: 'Retractable Carbon-Titanium Geodesic Dome',
    specifications: {
      sqMeters: '4,200 m²',
      naturalLightIndex: 'Starlight Aperture Controlled',
      materials: 'Active Vibration-Damped Concrete, Cryogenic Helium Shrouds',
      purpose: 'Deep Space Spectroscopy, Exoplanet Transit Analysis & Gravitational Simulations',
    },
    description:
      'Perched on the summit level of the academy, the Kepler Observatory houses an 8-meter optical and infrared primary reflector with adaptive optics actuators. The rotating dome isolates ambient ground vibrations through active acoustic dampening.',
    highlightFeatures: [
      '8-meter segmented mirror with nanometer piezoelectric surface actuators',
      'Direct fiber optic feed into the Academy Quantum Computing Center',
      '360-degree immersive projection amphitheater for cosmological simulations',
      'Real-time orbital tracking of solar system satellites and exoplanet transits',
    ],
  },
  {
    id: 'cellular-cleanroom',
    title: 'ISO Class 5 Molecular Bio & Genomics Cleanroom',
    category: 'Advanced Research',
    subtitle: 'Tier 2 Genomic Engineering & Nanofabrication',
    image: PHOTOREALISTIC_ASSETS.campus.cleanroomBio,
    architecturalStyle: 'Hermetic Laminar Flow Research Suite',
    specifications: {
      sqMeters: '3,800 m²',
      naturalLightIndex: 'Filtered UV-Safe Amber Spectrum',
      materials: 'Seamless Stainless Steel, ULPA Filtration Walls, Anti-Static ESD Epoxy',
      purpose: 'CRISPR Gene Editing, Protein Crystallography & Sub-Cellular Imaging',
    },
    description:
      'Engineered to pharmaceutical and semiconductor cleanroom standards, this facility maintains fewer than 3,520 particles per cubic meter of air. Students don positive-pressure researcher exosuits to manipulate living cellular structures with laser optical tweezers.',
    highlightFeatures: [
      'Dual-pass ULPA filtration cycling 100% room air every 45 seconds',
      'Cryogenic electron microscopes with 0.1-nanometer atomic resolution',
      'Automated microfluidics synthesizers for molecular cloning experiments',
      'Isolated seismic isolation pads absorbing ground tremors from campus foot traffic',
    ],
  },
  {
    id: 'optics-lab',
    title: 'Precision Laser & Wave Optics Clean Suite',
    category: 'Advanced Research',
    subtitle: 'Tier 2 Chromatic Dispersion & Snell Laboratories',
    image: PHOTOREALISTIC_ASSETS.campus.opticsLabLaser,
    architecturalStyle: 'Optically Isolated Laser Bench Pavilions',
    specifications: {
      sqMeters: '2,900 m²',
      naturalLightIndex: 'Darkened Optical Resonance Chamber',
      materials: 'Magnetic Invar Optical Breadboards, Non-Reflective Anodized Enclosures',
      purpose: 'Laser Interferometry, Cauchy Dispersion Prisms & Quantum Cryptography',
    },
    description:
      'Equipped with pressurized pneumatic float tables, the Wave Optics Clean Suite allows students to split single-wavelength laser beams, measure indices of refraction down to 6 decimal places, and observe total internal reflection in photonic crystal fibers.',
    highlightFeatures: [
      'Tunable Nd:YAG and He-Ne multi-frequency laser arrays',
      'Sub-picosecond streak cameras tracking photon wave-packet dispersion',
      'High-precision goniometers with 0.001-degree angular vernier resolution',
      'Total internal reflection waveguides demonstrating high-bandwidth optical cables',
    ],
  },
  {
    id: 'auditorium',
    title: 'Turing Hall of Sciences & Symposia',
    category: 'Central Concourse',
    subtitle: 'Tier 1 Main Amphitheater',
    image: PHOTOREALISTIC_ASSETS.campus.modernAuditorium,
    architecturalStyle: 'Acoustically Tuned Parametric Shell',
    specifications: {
      sqMeters: '3,200 m²',
      naturalLightIndex: 'Variable Electrochromic Glass Controls',
      materials: 'Perforated Acoustic White Oak, Brushed Steel, Recessed LED Linear Fixtures',
      purpose: 'Keynote Lectures, Global Peer Symposia & Academy Defenses',
    },
    description:
      'Turing Hall seats 650 students in a cascading semicircular amphitheater. Every seat features high-bandwidth holographic XR ports where students can interact with floating 3D molecular models demonstrated by faculty on stage.',
    highlightFeatures: [
      'Acoustic reverberation time optimized to 1.1 seconds for speech clarity',
      'Stage-length volumetric laser projection canvas for life-size planetary models',
      'Integrated seat-back telemetric voting and quiz submission terminals',
      'Dual-camera broadcast tracking for international academic livestreaming',
    ],
  },
  {
    id: 'library-archive',
    title: 'Scholars Archive & Quantum Data Repository',
    category: 'Central Concourse',
    subtitle: 'Tier 4 Quiet Research Sanctuary',
    image: PHOTOREALISTIC_ASSETS.campus.libraryArchive,
    architecturalStyle: 'Contemporary Monolithic Wood & Glass Sanctuary',
    specifications: {
      sqMeters: '5,600 m²',
      naturalLightIndex: 'Diffused North-Facing Skylights',
      materials: 'Acoustic Felt, Walnut Veneer, High-Transmission Anti-Glare Glass',
      purpose: 'Theoretical Physics Research, Deep Study & Historical Science Manuscripts',
    },
    description:
      'Overlooking the Academy quadrangle from the fourth floor, the Scholars Archive merges traditional leather-bound scientific folios with holographic terminal pods connected to global preprint arXiv databases.',
    highlightFeatures: [
      'Atmospherically sealed vaults housing historical 17th-century telescope logs',
      'Private soundproof research carrels with circadian biophilic lighting',
      'Direct optical connection to university supercomputer simulation nodes',
      'Panoramic 270-degree floor-to-ceiling glass reading lounge',
    ],
  },
  {
    id: 'sports-arena',
    title: 'Olympic Aquatic & Biomechanical Performance Complex',
    category: 'Recreation & Athletics',
    subtitle: 'Ground Level Health & Physical Science Wing',
    image: PHOTOREALISTIC_ASSETS.campus.sportsArenaPool,
    architecturalStyle: 'Long-Span Glulam Timber & Glazed Canopy',
    specifications: {
      sqMeters: '9,800 m²',
      naturalLightIndex: '75% Translucent Skylight Glazing',
      materials: 'Saltwater-Resistant Anodized Aluminium, Glulam Spruce Arches',
      purpose: 'Kinematic Biomechanics, Hydrodynamic Drag Analysis & Athletic Training',
    },
    description:
      'This state-of-the-art sports center bridges athletic fitness and physical mechanics. High-speed underwater cameras analyze swimmer stroke drag coefficients, while force-plate tracks calculate athletic torque and power output.',
    highlightFeatures: [
      '50-meter Olympic ten-lane competition pool with saltwater filtration',
      'Real-time kinematic posture analysis sensors along athletic sprint lanes',
      'Biomechanical lactate threshold monitoring laboratory for student athletes',
      'Hydrotherapy recovery whirlpools and high-altitude hypoxia training pods',
    ],
  },
];

export const ArchitecturalTourModal: React.FC<Props> = ({ isOpen, onClose, onTeleportToFacility }) => {
  const [selectedZone, setSelectedZone] = useState<ArchitecturalZone>(ZONES[0]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Exterior Grounds', 'Central Concourse', 'Advanced Research', 'Recreation & Athletics'];

  const filteredZones = activeCategory === 'All'
    ? ZONES
    : ZONES.filter((z) => z.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Photo-Realistic Architectural Campus Tour
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                  8K Photographic Fidelity
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore the engineering specifications, architectural zones, and research facilities of KEV Academy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Content: Showcase Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: High-Resolution Photo Hero Display */}
          <div className="w-full lg:w-7/12 p-6 flex flex-col justify-between bg-gradient-to-b from-slate-950 to-slate-900 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800">
            <div>
              {/* Photo Card with Lens Effect */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/30 group">
                <img
                  src={selectedZone.image}
                  alt={selectedZone.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-72 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Status Badges Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 text-[11px] font-mono text-cyan-300 font-bold shadow-lg">
                    {selectedZone.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[11px] font-mono text-slate-300">
                    {selectedZone.specifications.sqMeters}
                  </span>
                </div>

                {/* Title Card on Photo */}
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    {selectedZone.subtitle}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-tight">
                    {selectedZone.title}
                  </h2>
                </div>
              </div>

              {/* Architectural Narrative */}
              <div className="mt-5 space-y-3 text-left">
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {selectedZone.description}
                </p>

                {/* Key Architectural Innovations Checklist */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Key Architectural & Engineering Innovations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {selectedZone.highlightFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Area</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">{selectedZone.specifications.sqMeters}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Natural Daylight</span>
                <span className="text-xs font-bold text-cyan-300 font-mono mt-0.5 block">{selectedZone.specifications.naturalLightIndex}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Structural Materials</span>
                <span className="text-xs font-medium text-slate-300 truncate mt-0.5 block">{selectedZone.specifications.materials}</span>
              </div>
            </div>
          </div>

          {/* Right: Zone Navigation & Facility Directory */}
          <div className="w-full lg:w-5/12 p-6 bg-slate-950 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-400">
                Select Architectural Wing ({filteredZones.length})
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Click to Inspect</span>
            </div>

            <div className="space-y-2.5">
              {filteredZones.map((zone) => {
                const isSelected = selectedZone.id === zone.id;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail */}
                    <img
                      src={zone.image}
                      alt={zone.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          {zone.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {zone.specifications.sqMeters}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white truncate mt-0.5">
                        {zone.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {zone.subtitle}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Architecture modeled on sustainable biophilic research universities & international science campuses
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
          >
            Return to 3D Virtual Campus
          </button>
        </div>
      </div>
    </div>
  );
};
