import React, { useState, useMemo } from 'react';
import { LabId } from '../../types';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Plus,
  Atom,
  Orbit,
  Dna,
  Sparkles,
  ExternalLink,
  Layers,
  Filter,
} from 'lucide-react';

export interface GlossaryTerm {
  id: string;
  term: string;
  phonetic: string;
  lab: LabId;
  category: string;
  definition: string;
  formula?: string;
  formulaMeaning?: string;
  labApplication: string;
  relatedTerms?: string[];
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Chemistry Lab Terms
  {
    id: 'vsepr',
    term: 'VSEPR Theory',
    phonetic: 'VEE-sper THEE-uh-ree',
    lab: 'chemistry',
    category: 'Molecular Geometry',
    definition:
      'Valence Shell Electron Pair Repulsion model states that electron pairs surrounding a central atom orient themselves spatially to minimize electrostatic repulsion, dictating 3D molecular geometry.',
    formula: 'Steric Number = (Bonded Atoms) + (Lone Pairs)',
    formulaMeaning: 'Determines the parent electron geometry (linear, trigonal planar, tetrahedral, etc.).',
    labApplication:
      'Directly dictates why Water (H₂O) bends to 104.5° and Methane (CH₄) forms a perfect 109.5° tetrahedron in the 3D Chemistry Lab.',
    relatedTerms: ['Electronegativity', 'Dipole Moment', 'Hybridization'],
  },
  {
    id: 'dipole-moment',
    term: 'Dipole Moment (μ)',
    phonetic: 'DYE-pohl MOH-ment',
    lab: 'chemistry',
    category: 'Chemical Polarity',
    definition:
      'A quantitative measure of the separation of two opposite electrical charges across a chemical bond or entire molecule.',
    formula: 'μ = q × d',
    formulaMeaning: 'Where q is charge magnitude (Coulombs) and d is separation distance (meters), measured in Debyes (D).',
    labApplication:
      'Used in our Telemetry HUD to determine whether molecules dissolve in polar aqueous environments or generate intermolecular hydrogen bonds.',
    relatedTerms: ['Electronegativity', 'Covalent Bond'],
  },
  {
    id: 'electronegativity',
    term: 'Electronegativity',
    phonetic: 'ee-LEK-troh-neg-uh-TIV-ih-tee',
    lab: 'chemistry',
    category: 'Periodic Properties',
    definition:
      'The relative chemical tendency of an atom to attract shared bonding valence electrons toward its own nucleus (measured on the Pauling scale).',
    formula: 'ΔEN = |EN_A - EN_B|',
    formulaMeaning: 'ΔEN > 2.0 indicates ionic bonding; 0.4–2.0 indicates polar covalent; < 0.4 indicates nonpolar covalent.',
    labApplication:
      'Explains oxygen’s strong pull in water molecules and fluorine’s dominant polarity in sulfur hexafluoride (SF₆).',
    relatedTerms: ['Covalent Bond', 'Dipole Moment'],
  },
  {
    id: 'hybridization',
    term: 'Orbital Hybridization',
    phonetic: 'OR-bih-tul HY-brih-dih-ZAY-shun',
    lab: 'chemistry',
    category: 'Quantum Chemistry',
    definition:
      'The concept of mixing atomic wavefunctions (s, p, d orbitals) to create equivalent hybrid orbitals with specific directional orientations suitable for chemical bonding.',
    formula: 'sp (180°), sp² (120°), sp³ (109.5°), sp³d (90°/120°)',
    formulaMeaning: 'Hybrid state correlates directly to spatial geometry and bond angles.',
    labApplication:
      'Explains the hybridization states visualized when toggling between Methane (sp³), Carbon Dioxide (sp), and Ammonia (sp³).',
    relatedTerms: ['VSEPR Theory', 'Covalent Bond'],
  },
  {
    id: 'activation-energy',
    term: 'Activation Energy (Ea)',
    phonetic: 'ak-tih-VAY-shun EN-er-jee',
    lab: 'chemistry',
    category: 'Chemical Kinetics',
    definition:
      'The minimum quantum of thermodynamic kinetic energy required for colliding reactant molecules to overcome the transition state and undergo a chemical reaction.',
    formula: 'k = A · e^(-Ea / (R·T)) (Arrhenius Equation)',
    formulaMeaning: 'Where k is rate constant, T is temperature in Kelvin, and R is the universal gas constant.',
    labApplication:
      'Simulated when you raise the Temperature Slider to initiate the high-energy exothermic molecular combustion.',
    relatedTerms: ['Exothermic Reaction', 'Enthalpy'],
  },

  // Astrophysics Lab Terms
  {
    id: 'kepler-second',
    term: "Kepler's Second Law",
    phonetic: "KEP-lur's SEK-und Law",
    lab: 'astrophysics',
    category: 'Orbital Mechanics',
    definition:
      'A line segment connecting a celestial body to its focal primary star sweeps out equal orbital areas during equal intervals of time (Law of Equal Areas).',
    formula: 'dA / dt = L / (2m) = Constant',
    formulaMeaning: 'Expresses the fundamental conservation of orbital angular momentum (L) in a central gravitational field.',
    labApplication:
      'Observed when Earth or Halley’s Comet accelerates rapidly during perihelion approach and decelerates at aphelion.',
    relatedTerms: ['Perihelion', 'Angular Momentum', 'Eccentricity'],
  },
  {
    id: 'escape-velocity',
    term: 'Gravitational Escape Velocity',
    phonetic: 'grav-ih-TAY-shun-ul ess-KAYP vuh-LOSS-ih-tee',
    lab: 'astrophysics',
    category: 'Gravitation & Relativity',
    definition:
      'The minimum theoretical speed required for an unpropelled ballistic body to escape the gravitational attraction of a massive primary without further propulsion.',
    formula: 'v_e = √(2GM / r)',
    formulaMeaning: 'Where G is the gravitational constant, M is the primary mass, and r is the radial distance from center of mass.',
    labApplication:
      'Tested when you launch a Rogue Asteroid; if tangential speed exceeds v_e, the orbit unlocks from an ellipse into an open hyperbolic escape.',
    relatedTerms: ['Kepler’s Second Law', 'N-Body Problem'],
  },
  {
    id: 'orbital-eccentricity',
    term: 'Orbital Eccentricity (e)',
    phonetic: 'OR-bih-tul ek-sen-TRIS-ih-tee',
    lab: 'astrophysics',
    category: 'Conic Sections',
    definition:
      'A dimensionless parameter that determines the amount by which an orbit around another body deviates from a perfect circular path.',
    formula: 'e = √(1 - (b² / a²))',
    formulaMeaning: 'e = 0 is a perfect circle; 0 < e < 1 is an ellipse; e = 1 is parabolic; e > 1 is hyperbolic.',
    labApplication:
      'Displayed live on the Astrophysics HUD: Earth has low eccentricity (e ≈ 0.017) while comets exhibit high eccentricity (e > 0.9).',
    relatedTerms: ['Perihelion', 'Kepler’s Second Law'],
  },
  {
    id: 'n-body-problem',
    term: 'N-Body Problem',
    phonetic: 'EN-bod-ee PROB-lum',
    lab: 'astrophysics',
    category: 'Celestial Dynamics',
    definition:
      'The classical physics challenge of predicting the individual motions of a group of celestial bodies interacting with each other through mutual gravitational attraction.',
    formula: 'm_i · r̈_i = G · ∑ [m_i · m_j / |r_j - r_i|³] · (r_j - r_i)',
    formulaMeaning: 'No general analytical closed-form solution exists for N ≥ 3; requires numerical Runge-Kutta or Verlet integration.',
    labApplication:
      'Our Astrophysics engine numerically integrates all active planetary positions and velocities in real-time at 60 FPS.',
    relatedTerms: ['Escape Velocity', 'Angular Momentum'],
  },

  // Cellular Biology Lab Terms
  {
    id: 'atp-synthase',
    term: 'ATP Synthase Complex',
    phonetic: 'AY-tee-pee SIN-thays',
    lab: 'biology',
    category: 'Bioenergetics',
    definition:
      'A nanoscale rotary molecular motor embedded in the inner mitochondrial membrane that harnesses proton gradients to synthesize Adenosine Triphosphate (ATP).',
    formula: 'ADP + P_i + n H⁺_intermembrane → ATP + H₂O + n H⁺_matrix',
    formulaMeaning: 'Transduces proton electrochemical potential energy (proton-motive force) into chemical bond energy.',
    labApplication:
      'Zoom into the 3D Mitochondria in the Cellular Biology Lab to inspect the cristae folds where ATP synthase complexes reside.',
    relatedTerms: ['Mitochondria', 'Oxidative Phosphorylation'],
  },
  {
    id: 'base-pairing',
    term: 'Complementary Base Pairing',
    phonetic: 'kom-pluh-MEN-tuh-ree BAYS pair-ing',
    lab: 'biology',
    category: 'Genomics & Genetics',
    definition:
      'The biochemical rule governing hydrogen-bonded pairing between purines and pyrimidines in the DNA double helix (Chargaff’s rules).',
    formula: 'Adenine (A) = Thymine (T) [2 H-bonds] | Guanine (G) ≡ Cytosine (C) [3 H-bonds]',
    formulaMeaning: 'Guarantees fidelity in DNA replication and directional transcription into messenger RNA (mRNA).',
    labApplication:
      'Interact with the 3D DNA Helix Suite to inspect the specific hydrogen bonds and test codon mRNA transcription sequences.',
    relatedTerms: ['DNA Double Helix', 'Codon Transcription'],
  },
  {
    id: 'nuclear-pore',
    term: 'Nuclear Pore Complex (NPC)',
    phonetic: 'NOO-klee-ur POR KOM-pleks',
    lab: 'biology',
    category: 'Organelle Transport',
    definition:
      'Massive multi-protein cylindrical channels spanning the nuclear envelope that regulate molecular trafficking of RNA, proteins, and ribosomal subunits between nucleus and cytoplasm.',
    formula: 'Passage threshold: ~40 kDa passive diffusion limit',
    formulaMeaning: 'Molecules larger than 40 kDa require active transport receptors (karyopherins / importins).',
    labApplication:
      'Visible on the exterior of the 3D Nucleus organelle when toggling X-Ray Translucency mode.',
    relatedTerms: ['Nucleus', 'Base Pairing'],
  },
  {
    id: 'endosymbiosis',
    term: 'Endosymbiotic Theory',
    phonetic: 'en-doh-sim-bee-OT-ik THEE-uh-ree',
    lab: 'biology',
    category: 'Cellular Evolution',
    definition:
      'The scientific consensus that eukaryotic mitochondria originated as symbiotic aerobic prokaryotes engulfed by an ancestral host cell, retaining circular DNA and double membranes.',
    formula: 'Prokaryote + Proto-Eukaryote → Symbiotic Mitochondrion Organelle',
    formulaMeaning: 'Explains why mitochondria contain their own autonomous circular genome (mtDNA) and double membrane.',
    labApplication:
      'Explains the unique double-membrane boundary of the mitochondria model rendered inside our virtual cell.',
    relatedTerms: ['ATP Synthase', 'Mitochondria'],
  },

  // Optics Lab Terms
  {
    id: 'snells-law',
    term: "Snell's Law of Refraction",
    phonetic: "SNELZ Law uv ree-FRAK-shun",
    lab: 'optics',
    category: 'Wave Optics',
    definition:
      'The foundational formula describing the relationship between angles of incidence and refraction when light passes through the boundary between two isotropic media with different refractive indices.',
    formula: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)',
    formulaMeaning: 'Where n₁ and n₂ are refractive indices, and θ₁, θ₂ are the angles measured relative to the surface normal.',
    labApplication:
      'The live governing equation dynamically updated on our Optics HUD as you drag the laser angle slider or change glass mediums.',
    relatedTerms: ['Total Internal Reflection', 'Refractive Index', 'Dispersion'],
  },
  {
    id: 'total-internal-reflection',
    term: 'Total Internal Reflection (TIR)',
    phonetic: 'TOH-tul in-TER-nul ree-FLEK-shun',
    lab: 'optics',
    category: 'Optical Waveguides',
    definition:
      'The complete reflection of a light ray back into its optically denser medium when incident on a boundary at an angle greater than the critical angle (θ > θ_c).',
    formula: 'θ_c = arcsin(n₂ / n₁)',
    formulaMeaning: 'Occurs only when traveling from high index (n₁) into low index (n₂), with 100% reflectance.',
    labApplication:
      'Rotate the optical laser incidence beyond the calculated critical angle to watch refraction terminate and 100% internal reflection emerge!',
    relatedTerms: ["Snell's Law", 'Critical Angle'],
  },
  {
    id: 'chromatic-dispersion',
    term: 'Chromatic Dispersion',
    phonetic: 'kroh-MAT-ik dih-SPUR-zhun',
    lab: 'optics',
    category: 'Wave Mechanics',
    definition:
      'The phenomenon in which the phase velocity of light in a medium depends on its wavelength/frequency, causing polychromatic white light to separate into spectral rainbow colors.',
    formula: 'n(λ) ≈ A + B / λ² (Cauchy’s Dispersion Formula)',
    formulaMeaning: 'Higher frequency blue/violet light experiences a higher refractive index than red light, bending more sharply.',
    labApplication:
      'Switch the laser source to Polychromatic White Light and watch the prism refract red, green, and violet beams along separated diverging paths.',
    relatedTerms: ["Snell's Law", 'Refractive Index'],
  },
  {
    id: 'brewster-angle',
    term: "Brewster's Polarization Angle",
    phonetic: "BROO-sturz ANG-gul",
    lab: 'optics',
    category: 'Wave Polarization',
    definition:
      'The specific angle of incidence at which light with a particular polarization is perfectly transmitted through a transparent dielectric surface without any reflection.',
    formula: 'θ_B = arctan(n₂ / n₁)',
    formulaMeaning: 'At this angle, the reflected and refracted rays are perpendicular (90° apart).',
    labApplication:
      'Utilized in laboratory laser Brewster windows to minimize reflection losses across quantum optical resonators.',
    relatedTerms: ["Snell's Law", 'Total Internal Reflection'],
  },
];

interface Props {
  activeLab?: LabId;
  onInsertTermToNotes?: (textToInsert: string) => void;
}

export const ExpandableGlossary: React.FC<Props> = ({ activeLab = 'chemistry', onInsertTermToNotes }) => {
  const [selectedLabFilter, setSelectedLabFilter] = useState<'all' | LabId>(activeLab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['vsepr', 'kepler-second', 'snells-law', 'atp-synthase']));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter terms by lab category and search term
  const filteredTerms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((item) => {
      const matchesLab = selectedLabFilter === 'all' || item.lab === selectedLabFilter;
      if (!matchesLab) return false;
      if (!query) return true;

      return (
        item.term.toLowerCase().includes(query) ||
        item.definition.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.formula && item.formula.toLowerCase().includes(query)) ||
        item.labApplication.toLowerCase().includes(query)
      );
    });
  }, [selectedLabFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredTerms.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleCopyFormula = (term: GlossaryTerm) => {
    const text = term.formula
      ? `${term.term}: ${term.formula} — ${term.definition}`
      : `${term.term}: ${term.definition}`;
    navigator.clipboard.writeText(text);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (term: GlossaryTerm) => {
    const text = `### ${term.term} (${term.lab.toUpperCase()} LAB)\n**Definition:** ${term.definition}\n${
      term.formula ? `**Formula:** \`${term.formula}\`\n` : ''
    }**Application:** ${term.labApplication}\n`;
    onInsertTermToNotes?.(text);
  };

  const getLabIcon = (lab: LabId) => {
    switch (lab) {
      case 'chemistry':
        return <Atom className="w-3.5 h-3.5 text-cyan-400" />;
      case 'astrophysics':
        return <Orbit className="w-3.5 h-3.5 text-violet-400" />;
      case 'biology':
        return <Dna className="w-3.5 h-3.5 text-emerald-400" />;
      case 'optics':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getLabBadgeColor = (lab: LabId) => {
    switch (lab) {
      case 'chemistry':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'astrophysics':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'biology':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'optics':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="glossary-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scientific laws, equations, definitions..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Expand / Collapse Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Lab Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px]">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        <button
          onClick={() => setSelectedLabFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            selectedLabFilter === 'all'
              ? 'bg-slate-700 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          All Terms ({GLOSSARY_TERMS.length})
        </button>

        <button
          onClick={() => setSelectedLabFilter('chemistry')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            selectedLabFilter === 'chemistry'
              ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/20'
              : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-950/40'
          }`}
        >
          <Atom className="w-3.5 h-3.5" /> Chemistry
        </button>

        <button
          onClick={() => setSelectedLabFilter('astrophysics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            selectedLabFilter === 'astrophysics'
              ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/20'
              : 'text-violet-400/80 hover:text-violet-300 hover:bg-violet-950/40'
          }`}
        >
          <Orbit className="w-3.5 h-3.5" /> Astrophysics
        </button>

        <button
          onClick={() => setSelectedLabFilter('biology')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            selectedLabFilter === 'biology'
              ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40'
          }`}
        >
          <Dna className="w-3.5 h-3.5" /> Biology
        </button>

        <button
          onClick={() => setSelectedLabFilter('optics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            selectedLabFilter === 'optics'
              ? 'bg-amber-600 text-white font-semibold shadow-md shadow-amber-600/20'
              : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Optics
        </button>
      </div>

      {/* Terms Accordion List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredTerms.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            <BookOpen className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
            <p className="text-sm font-medium">No matching scientific terms found.</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or switching the lab filter.
            </p>
          </div>
        ) : (
          filteredTerms.map((term) => {
            const isExpanded = expandedIds.has(term.id);
            return (
              <div
                key={term.id}
                id={`glossary-item-${term.id}`}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-900/90 border-slate-700 shadow-md'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
                }`}
              >
                {/* Accordion Header Row */}
                <button
                  onClick={() => toggleExpand(term.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
                      {getLabIcon(term.lab)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-white text-sm tracking-tight group-hover:text-cyan-300 transition-colors">
                          {term.term}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wide px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                          {term.phonetic}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${getLabBadgeColor(
                            term.lab
                          )}`}
                        >
                          {term.lab} Lab
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {term.category} • {term.definition}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    )}
                  </div>
                </button>

                {/* Expanded Detailed Section */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                    {/* Definition */}
                    <div className="text-slate-200 leading-relaxed font-sans">
                      {term.definition}
                    </div>

                    {/* Mathematical Formula Callout */}
                    {term.formula && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-cyan-400">
                            Mathematical Formulation:
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyFormula(term);
                            }}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            {copiedId === term.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy Formula
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-sm font-mono text-cyan-200 font-semibold py-1">
                          {term.formula}
                        </div>
                        {term.formulaMeaning && (
                          <p className="text-[11px] text-slate-400 leading-normal">
                            {term.formulaMeaning}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Laboratory Application */}
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-white block mb-0.5">
                        Interactive Laboratory Application:
                      </span>
                      {term.labApplication}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      {term.relatedTerms && term.relatedTerms.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500">Related:</span>
                          {term.relatedTerms.map((rt) => (
                            <button
                              key={rt}
                              onClick={() => setSearchQuery(rt)}
                              className="text-[10px] text-slate-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
                            >
                              {rt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div />
                      )}

                      {onInsertTermToNotes && (
                        <button
                          onClick={() => handleInsert(term)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Insert this term and formula directly into your lab notebook drafts"
                        >
                          <Plus className="w-3 h-3" /> Insert into Notes
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
