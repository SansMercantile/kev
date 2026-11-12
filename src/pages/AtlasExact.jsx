/**
 * Human Atlas — code-for-code port of the reference tool
 * (tools/human-atlas/app/page.tsx + scene.tsx, MIT, (c) ashemag;
 * see docs/ATTRIBUTION-human-atlas.md). Anatomy data: BodyParts3D 4.0,
 * CC BY 4.0, DBCLS. Educational explorer, not a diagnostic tool.
 *
 * This is the tool's own page: the identity header, the Find/About actions,
 * the layers panel (system toggles + presets), the search panel, the view
 * controls, the bottom explode dock, the caption/footer, and the detail +
 * about sheets — driving the exact scene port (atlasSceneExact.js).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  Activity, ArrowUpRight, ChevronRight, Focus, Info, Layers3,
  Pause, RotateCcw, RotateCw, Search, X,
} from 'lucide-react'
import { createAtlasScene } from '../lib/studio/atlasSceneExact'
import { ANATOMY_SYSTEMS as SYSTEMS, anatomyExplanation as explanation } from '../lib/anatomySystems'
import '../styles/atlas-exact.css'

const DEFAULT_VISIBLE = [
  'cardiac', 'sensory', 'skeletal', 'muscular', 'arterial', 'venous', 'nervous',
  'respiratory', 'digestive', 'urinary', 'lymphatic', 'endocrine', 'reproductive', 'connective',
]
const EXPLANATIONS = {
  heart: 1, liver: 1, brain: 1, stomach: 1, spleen: 1, pancreas: 1, 'urinary bladder': 1, trachea: 1, diaphragm: 1,
}
const ORGAN_PRESET = ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive']
const VIEWS = ['three-quarter', 'front', 'side', 'back']
const VIEW_LABELS = ['¾', 'F', 'S', 'B']

const SPECIES = [
  {
    id: 'human',
    label: 'Human',
    sexes: [
      { id: 'human-male', label: 'Male', manifest: '/models/atlas.json' },
      { id: 'human-female', label: 'Female', manifest: '/models/atlas-female.json' },
    ],
  },
  {
    id: 'pig',
    label: 'Pig (Sus domestica)',
    sexes: [
      { id: 'pig-male', label: 'Male', manifest: '/models/atlas-pig.json' },
      { id: 'pig-female', label: 'Female', manifest: '/models/atlas-pig-female.json' },
    ],
  },
  {
    id: 'chicken',
    label: 'Chicken (Gallus gallus)',
    sexes: [
      { id: 'chicken-male', label: 'Male', manifest: '/models/atlas-chicken.json' },
      { id: 'chicken-female', label: 'Female', manifest: '/models/atlas-chicken-female.json' },
    ],
  },
  {
    id: 'lion',
    label: 'Lion (Panthera leo)',
    sexes: [
      { id: 'lion-male', label: 'Male', manifest: '/models/atlas-lion.json' },
      { id: 'lion-female', label: 'Female', manifest: '/models/atlas-lion-female.json' },
    ],
  },
  {
    id: 'mouse',
    label: 'Mouse (Mus musculus)',
    sexes: [
      { id: 'mouse-male', label: 'Male', manifest: '/models/atlas-mouse.json' },
      { id: 'mouse-female', label: 'Female', manifest: '/models/atlas-mouse-female.json' },
    ],
  },
  {
    id: 'bear',
    label: 'Black Bear (Ursus americanus)',
    sexes: [
      { id: 'bear-male', label: 'Male', manifest: '/models/atlas-bear.json' },
      { id: 'bear-female', label: 'Female', manifest: '/models/atlas-bear-female.json' },
    ],
  },
  {
    id: 'penguin',
    label: 'Emperor Penguin (Aptenodytes forsteri)',
    sexes: [
      { id: 'penguin-male', label: 'Male', manifest: '/models/atlas-penguin.json' },
      { id: 'penguin-female', label: 'Female', manifest: '/models/atlas-penguin-female.json' },
    ],
  },
  {
    id: 'fox',
    label: 'Bat-eared Fox (Otocyon megalotis)',
    sexes: [
      { id: 'fox-male', label: 'Male', manifest: '/models/atlas-fox-male.json' },
      { id: 'fox-female', label: 'Female', manifest: '/models/atlas-fox-female.json' },
    ],
  },
  {
    id: 'trex',
    label: 'Tyrannosaurus Rex',
    sexes: [
      { id: 'trex-male', label: 'Male', manifest: '/models/atlas-trex.json' },
      { id: 'trex-female', label: 'Female', manifest: '/models/atlas-trex-female.json' },
    ],
  },
  {
    id: 'elephant',
    label: 'Elephant (Elephas maximus)',
    sexes: [
      { id: 'elephant-male', label: 'Male', manifest: '/models/atlas-elephant.json' },
      { id: 'elephant-female', label: 'Female', manifest: '/models/atlas-elephant-female.json' },
    ],
  },
  {
    id: 'giraffe',
    label: 'Giraffe (Giraffa camelopardalis)',
    sexes: [
      { id: 'giraffe-male', label: 'Male', manifest: '/models/atlas-giraffe.json' },
      { id: 'giraffe-female', label: 'Female', manifest: '/models/atlas-giraffe-female.json' },
    ],
  },
  {
    id: 'dolphin',
    label: 'Dolphin (Tursiops truncatus)',
    sexes: [
      { id: 'dolphin-male', label: 'Male', manifest: '/models/atlas-dolphin.json' },
      { id: 'dolphin-female', label: 'Female', manifest: '/models/atlas-dolphin-female.json' },
    ],
  },
  {
    id: 'hyena',
    label: 'Hyena (Hyaena hyaena)',
    sexes: [
      { id: 'hyena-male', label: 'Male', manifest: '/models/atlas-hyena.json' },
      { id: 'hyena-female', label: 'Female', manifest: '/models/atlas-hyena-female.json' },
    ],
  },
  {
    id: 'opossum',
    label: 'Opossum (Didelphis virginiana)',
    sexes: [
      { id: 'opossum-male', label: 'Male', manifest: '/models/atlas-opossum.json' },
      { id: 'opossum-female', label: 'Female', manifest: '/models/atlas-opossum-female.json' },
    ],
  },
  {
    id: 'polarbear',
    label: 'Polar Bear (Ursus maritimus)',
    sexes: [
      { id: 'polarbear-male', label: 'Male', manifest: '/models/atlas-polarbear.json' },
      { id: 'polarbear-female', label: 'Female', manifest: '/models/atlas-polarbear-female.json' },
    ],
  },
  {
    id: 'tapir',
    label: 'Tapir (Tapirus terrestris)',
    sexes: [
      { id: 'tapir-male', label: 'Male', manifest: '/models/atlas-tapir.json' },
      { id: 'tapir-female', label: 'Female', manifest: '/models/atlas-tapir-female.json' },
    ],
  },
  {
    id: 'python',
    label: 'Python (Python molurus)',
    sexes: [
      { id: 'python-male', label: 'Male', manifest: '/models/atlas-python.json' },
      { id: 'python-female', label: 'Female', manifest: '/models/atlas-python-female.json' },
    ],
  },
  {
    id: 'tuatara',
    label: 'Tuatara (Sphenodon punctatus)',
    sexes: [
      { id: 'tuatara-male', label: 'Male', manifest: '/models/atlas-tuatara.json' },
      { id: 'tuatara-female', label: 'Female', manifest: '/models/atlas-tuatara-female.json' },
    ],
  },
  {
    id: 'crocodile',
    label: 'Crocodile (Crocodylus moreletii)',
    sexes: [
      { id: 'crocodile-male', label: 'Male', manifest: '/models/atlas-crocodile.json' },
      { id: 'crocodile-female', label: 'Female', manifest: '/models/atlas-crocodile-female.json' },
    ],
  },
  {
    id: 'chameleon',
    label: 'Chameleon (Chamaeleo calyptratus)',
    sexes: [
      { id: 'chameleon-male', label: 'Male', manifest: '/models/atlas-chameleon.json' },
      { id: 'chameleon-female', label: 'Female', manifest: '/models/atlas-chameleon-female.json' },
    ],
  },
  {
    id: 'gilamonster',
    label: 'Gila Monster (Heloderma suspectum)',
    sexes: [
      { id: 'gilamonster-male', label: 'Male', manifest: '/models/atlas-gilamonster.json' },
      { id: 'gilamonster-female', label: 'Female', manifest: '/models/atlas-gilamonster-female.json' },
    ],
  },
  {
    id: 'thornydevil',
    label: 'Thorny Devil (Moloch horridus)',
    sexes: [
      { id: 'thornydevil-male', label: 'Male', manifest: '/models/atlas-thornydevil.json' },
      { id: 'thornydevil-female', label: 'Female', manifest: '/models/atlas-thornydevil-female.json' },
    ],
  },
  {
    id: 'vulture',
    label: 'Black Vulture (Coragyps atratus)',
    sexes: [
      { id: 'vulture-male', label: 'Male', manifest: '/models/atlas-vulture.json' },
      { id: 'vulture-female', label: 'Female', manifest: '/models/atlas-vulture-female.json' },
    ],
  },
  {
    id: 'moose',
    label: 'Moose (Alces alces)',
    sexes: [
      { id: 'moose-male', label: 'Male', manifest: '/models/atlas-moose.json' },
      { id: 'moose-female', label: 'Female', manifest: '/models/atlas-moose-female.json' },
    ],
  },
  {
    id: 'llama',
    label: 'Llama (Lama glama)',
    sexes: [
      { id: 'llama-male', label: 'Male', manifest: '/models/atlas-llama.json' },
      { id: 'llama-female', label: 'Female', manifest: '/models/atlas-llama-female.json' },
    ],
  },
  {
    id: 'platypus',
    label: 'Platypus (Ornithorhynchus anatinus)',
    sexes: [
      { id: 'platypus-male', label: 'Male', manifest: '/models/atlas-platypus.json' },
      { id: 'platypus-female', label: 'Female', manifest: '/models/atlas-platypus-female.json' },
    ],
  },
  {
    id: 'hyrax',
    label: 'Rock Hyrax (Procavia capensis)',
    sexes: [
      { id: 'hyrax-male', label: 'Male', manifest: '/models/atlas-hyrax.json' },
      { id: 'hyrax-female', label: 'Female', manifest: '/models/atlas-hyrax-female.json' },
    ],
  },
  {
    id: 'beardeddragon',
    label: 'Bearded Dragon (Pogona vitticeps)',
    sexes: [
      { id: 'beardeddragon-male', label: 'Male', manifest: '/models/atlas-beardeddragon.json' },
      { id: 'beardeddragon-female', label: 'Female', manifest: '/models/atlas-beardeddragon-female.json' },
    ],
  },
  {
    id: 'hornedlizard',
    label: 'Horned Lizard (Phrynosoma cornutum)',
    sexes: [
      { id: 'hornedlizard-male', label: 'Male', manifest: '/models/atlas-hornedlizard.json' },
      { id: 'hornedlizard-female', label: 'Female', manifest: '/models/atlas-hornedlizard-female.json' },
    ],
  },
  {
    id: 'seaurchin',
    label: 'Sea Urchin (Strongylocentrotus purpuratus)',
    sexes: [
      { id: 'seaurchin-male', label: 'Male', manifest: '/models/atlas-seaurchin.json' },
      { id: 'seaurchin-female', label: 'Female', manifest: '/models/atlas-seaurchin-female.json' },
    ],
  },
  {
    id: 'catfish',
    label: 'Catfish (Conorhynchos conirostris)',
    sexes: [
      { id: 'catfish-male', label: 'Male', manifest: '/models/atlas-catfish.json' },
      { id: 'catfish-female', label: 'Female', manifest: '/models/atlas-catfish-female.json' },
    ],
  },
  {
    id: 'caecilian',
    label: 'Caecilian (Dermophis mexicanus)',
    sexes: [
      { id: 'caecilian-male', label: 'Male', manifest: '/models/atlas-caecilian.json' },
      { id: 'caecilian-female', label: 'Female', manifest: '/models/atlas-caecilian-female.json' },
    ],
  },
  {
    id: 'mongoose',
    label: 'Mongoose (Galerella sanguinea)',
    sexes: [
      { id: 'mongoose-male', label: 'Male', manifest: '/models/atlas-mongoose.json' },
      { id: 'mongoose-female', label: 'Female', manifest: '/models/atlas-mongoose-female.json' },
    ],
  },
  {
    id: 'leopardseal',
    label: 'Leopard Seal (Hydrurga leptonyx)',
    sexes: [
      { id: 'leopardseal-male', label: 'Male', manifest: '/models/atlas-leopardseal.json' },
      { id: 'leopardseal-female', label: 'Female', manifest: '/models/atlas-leopardseal-female.json' },
    ],
  },
  {
    id: 'badger',
    label: 'Badger (Taxidea taxus)',
    sexes: [
      { id: 'badger-male', label: 'Male', manifest: '/models/atlas-badger-male.json' },
      { id: 'badger-female', label: 'Female', manifest: '/models/atlas-badger.json' },
    ],
  },
  {
    id: 'butterfly',
    label: 'Butterfly (Danaus plexippus)',
    sexes: [
      { id: 'butterfly-male', label: 'Male', manifest: '/models/atlas-butterfly.json' },
      { id: 'butterfly-female', label: 'Female', manifest: '/models/atlas-butterfly-female.json' },
    ],
  },
  {
    id: 'honeybee',
    label: 'Honeybee (Apis mellifera)',
    sexes: [
      { id: 'honeybee-male', label: 'Male', manifest: '/models/atlas-honeybee.json' },
      { id: 'honeybee-female', label: 'Female', manifest: '/models/atlas-honeybee-female.json' },
    ],
  },
  {
    id: 'ant',
    label: 'Ant (Camponotus pennsylvanicus)',
    sexes: [
      { id: 'ant-male', label: 'Male', manifest: '/models/atlas-ant.json' },
      { id: 'ant-female', label: 'Female', manifest: '/models/atlas-ant-female.json' },
    ],
  },
  {
    id: 'beetle',
    label: 'Beetle (Lucanus cervus)',
    sexes: [
      { id: 'beetle-male', label: 'Male', manifest: '/models/atlas-beetle.json' },
      { id: 'beetle-female', label: 'Female', manifest: '/models/atlas-beetle-female.json' },
    ],
  },
  {
    id: 'dragonfly',
    label: 'Dragonfly (Anax junius)',
    sexes: [
      { id: 'dragonfly-male', label: 'Male', manifest: '/models/atlas-dragonfly.json' },
      { id: 'dragonfly-female', label: 'Female', manifest: '/models/atlas-dragonfly-female.json' },
    ],
  },
  {
    id: 'grasshopper',
    label: 'Grasshopper (Melanoplus differentialis)',
    sexes: [
      { id: 'grasshopper-male', label: 'Male', manifest: '/models/atlas-grasshopper.json' },
      { id: 'grasshopper-female', label: 'Female', manifest: '/models/atlas-grasshopper-female.json' },
    ],
  },
  {
    id: 'mammoth',
    label: 'Woolly Mammoth (Mammuthus primigenius)',
    sexes: [
      { id: 'mammoth-male', label: 'Male', manifest: '/models/atlas-mammoth.json' },
      { id: 'mammoth-female', label: 'Female', manifest: '/models/atlas-mammoth-female.json' },
    ],
  },
  {
    id: 'dog',
    label: 'Dog (Canis lupus familiaris)',
    sexes: [
      { id: 'dog-male', label: 'Male', manifest: '/models/atlas-dog.json' },
      { id: 'dog-female', label: 'Female', manifest: '/models/atlas-dog-female.json' },
    ],
  },
  {
    id: 'cat',
    label: 'Cat (Felis catus)',
    sexes: [
      { id: 'cat-male', label: 'Male', manifest: '/models/atlas-cat.json' },
      { id: 'cat-female', label: 'Female', manifest: '/models/atlas-cat-female.json' },
    ],
  },
  {
    id: 'horse',
    label: 'Horse (Equus ferus caballus)',
    sexes: [
      { id: 'horse-male', label: 'Male', manifest: '/models/atlas-horse.json' },
      { id: 'horse-female', label: 'Female', manifest: '/models/atlas-horse-female.json' },
    ],
  },
  {
    id: 'cow',
    label: 'Cow (Bos taurus)',
    sexes: [
      { id: 'cow-male', label: 'Male', manifest: '/models/atlas-cow.json' },
      { id: 'cow-female', label: 'Female', manifest: '/models/atlas-cow-female.json' },
    ],
  },
  {
    id: 'frog',
    label: 'Frog (Rana temporaria)',
    sexes: [
      { id: 'frog-male', label: 'Male', manifest: '/models/atlas-frog.json' },
      { id: 'frog-female', label: 'Female', manifest: '/models/atlas-frog-female.json' },
    ],
  },
  {
    id: 'shark',
    label: 'Shark (Carcharodon carcharias)',
    sexes: [
      { id: 'shark-male', label: 'Male', manifest: '/models/atlas-shark.json' },
      { id: 'shark-female', label: 'Female', manifest: '/models/atlas-shark-female.json' },
    ],
  },
  {
    id: 'salmon',
    label: 'Salmon (Salmo salar)',
    sexes: [
      { id: 'salmon-male', label: 'Male', manifest: '/models/atlas-salmon.json' },
      { id: 'salmon-female', label: 'Female', manifest: '/models/atlas-salmon-female.json' },
    ],
  },
]

const initial = { explode: 0, visible: DEFAULT_VISIBLE, selected: [], isolate: false, view: 'three-quarter', rotate: false, reset: 0 }

export default function AtlasExact() {
  const detailTitle = useRef(null)
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [speciesId, setSpeciesId] = useState('human')
  const [sexId, setSexId] = useState('male')
  const [atlas, setAtlas] = useState(null)
  const [state, setState] = useState(initial)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null) // 'layers' | 'search' | null
  const [details, setDetails] = useState(false)
  const [about, setAbout] = useState(false)
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState(null)

  const currentSpecies = SPECIES.find((s) => s.id === speciesId)
  const currentSex = currentSpecies?.sexes.find((s) => s.label.toLowerCase() === sexId)
  const manifestUrl = currentSex?.manifest ?? '/models/atlas.json'

  // Fetch the catalogue — re-run when species/sex changes.
  useEffect(() => {
    const abort = new AbortController()
    setProgress(0)
    setError('')
    setAtlas(null)
    setChosen(null)
    setDetails(false)
    setState({ ...initial, visible: DEFAULT_VISIBLE })
    fetch(manifestUrl, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error('The anatomy catalogue could not be loaded.')
        return r.json()
      })
      .then((data) => setAtlas(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
    return () => abort.abort()
  }, [manifestUrl])

  // "/" opens search (the tool's keyboard shortcut).
  useEffect(() => {
    const key = (e) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setPanel('search')
        setDetails(false)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const parts = useMemo(() => new Map(atlas?.parts.map((p) => [p.id, p])), [atlas])
  const counts = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0])),
    [atlas]
  )
  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0)
  const selectedParts = state.selected.map((id) => parts.get(id)).filter((p) => !!p)
  const selected = selectedParts[0]
  const system = SYSTEMS.find((s) => s.id === selected?.system)
  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate ? state.selected.includes(p.id) : state.visible.includes(p.system) || state.selected.includes(p.id)
    ).length ?? 0

  const results = useMemo(() => {
    if (!atlas) return []
    const term = query.toLowerCase().trim()
    if (!term)
      return ['heart', 'brain', 'liver', 'stomach', 'spleen', 'pancreas', 'urinary bladder', 'trachea']
        .map((name) => atlas.concepts.find((c) => c.name.toLowerCase() === name))
        .filter((x) => !!x)
    return atlas.concepts
      .filter((c) => c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term))
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 80)
  }, [atlas, query])

  const choose = (c) => {
    setChosen(c)
    setState((s) => ({ ...s, selected: c.elements, isolate: false, rotate: false }))
    setDetails(true)
    setPanel(null)
  }
  const choosePart = (id) => {
    const p = parts.get(id)
    if (!p) return
    setChosen({ id: p.conceptId, name: p.name, elements: [id] })
    setState((s) => ({ ...s, selected: [id], isolate: false, rotate: false }))
    setDetails(true)
    setPanel(null)
  }
  const toggle = (id) => {
    setDetails(false)
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
    }))
  }
  const reset = () => {
    setState((s) => ({ ...initial, visible: DEFAULT_VISIBLE, reset: s.reset + 1 }))
    setChosen(null)
    setDetails(false)
    setPanel(null)
  }
  const openPanel = (next) => {
    setDetails(false)
    setPanel((p) => (p === next ? null : next))
  }

  // Mount the exact scene once the catalogue is here; stream progress + errors.
  useEffect(() => {
    if (!atlas || !hostRef.current) return undefined
    const scene = createAtlasScene(hostRef.current, {
      atlas,
      state: { ...state, inspectorOpen: details && selectedParts.length > 0 },
      onSelect: choosePart,
      onProgress: (n) => {
        setProgress(n)
        if (n === 100) setError('')
      },
      onError: setError,
    })
    sceneRef.current = scene
    return () => {
      sceneRef.current = null
      scene.dispose()
    }
    // The scene is created once per catalogue; state flows in via setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas])

  // Push React state into the scene (code-for-code: the tool re-renders the
  // scene component with the new state; here we forward it imperatively).
  useEffect(() => {
    sceneRef.current?.setState({ ...state, inspectorOpen: details && selectedParts.length > 0 })
  }, [state, details, selectedParts.length])

  return (
    <main className="atlas-studio">
      <div className="atlas-scene" ref={hostRef} />
      <div className="vignette" />

      <header className="identity">
        <div className="eyebrow">
          <span className="status-dot" /> INTERACTIVE ANATOMY
        </div>
        <h1>
          {currentSpecies?.label?.split('(')[0]?.trim() ?? ''} Atlas: KEV<span className="edition">3D</span>
          <span className="sex-badge">{sexId === 'female' ? '♀' : '♂'}</span>
        </h1>
        <div className="identity-meta">
          {atlas ? atlas.parts.length.toLocaleString() : '—'} modeled pieces <span>·</span> {atlas?.source ?? ''}
        </div>
        <div className="species-selector">
          {SPECIES.map((sp) => (
            <button
              key={sp.id}
              type="button"
              className={speciesId === sp.id ? 'species-btn active' : 'species-btn'}
              onClick={() => { if (speciesId !== sp.id) { setSpeciesId(sp.id); setSexId('male'); sceneRef.current?.dispose(); sceneRef.current = null } }}
            >
              {sp.label.split('(')[0].trim()}
            </button>
          ))}
        </div>
        <div className="sex-selector">
          {currentSpecies?.sexes.map((sx) => (
            <button
              key={sx.id}
              type="button"
              className={sexId === sx.label.toLowerCase() ? 'sex-btn active' : 'sex-btn'}
              onClick={() => { if (sexId !== sx.label.toLowerCase()) { setSexId(sx.label.toLowerCase()); sceneRef.current?.dispose(); sceneRef.current = null } }}
            >
              {sx.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="top-actions" aria-label="Explorer panels">
        <button type="button" className={panel === 'search' ? 'active' : ''} onClick={() => openPanel('search')} aria-label="Search anatomy">
          <Search size={18} />
          <span>Find a structure</span>
          <kbd>/</kbd>
        </button>
        <button type="button" className="icon-button" aria-label="About this atlas" onClick={() => { setDetails(false); setPanel(null); setAbout(true) }}>
          <Info size={18} />
        </button>
      </nav>

      <section className={`layers-panel glass ${panel === 'layers' ? 'mobile-open' : ''}`} aria-label="Anatomical layers">
        <div className="panel-heading">
          <span>Systems</span>
          <button type="button" className="mobile-only icon-button" onClick={() => setPanel(null)} aria-label="Close systems">
            <X size={18} />
          </button>
          <span className="desktop-only small-number badge">{activeSystems.length}</span>
        </div>
        <div className="layer-presets">
          <button type="button" aria-pressed={activeSystems.every((x) => state.visible.includes(x.id))} onClick={() => setState((s) => ({ ...s, selected: [], isolate: false, visible: activeSystems.map((x) => x.id) }))}>All</button>
          <button type="button" aria-pressed={state.visible.length === 1 && state.visible[0] === 'skeletal'} onClick={() => setState((s) => ({ ...s, selected: [], isolate: false, visible: ['skeletal'] }))}>Skeleton</button>
          <button type="button" aria-pressed={state.visible.length === 6 && ORGAN_PRESET.every((id) => state.visible.includes(id))} onClick={() => setState((s) => ({ ...s, selected: [], isolate: false, visible: ORGAN_PRESET }))}>Organs</button>
        </div>
        <div className="system-list">
          {activeSystems.map((s) => (
            <div className={`system-row ${state.visible.includes(s.id) ? 'enabled' : ''}`} key={s.id}>
              <button type="button" className="system-name" title={`Show only ${s.name.toLowerCase()}`} onClick={() => setState((v) => ({ ...v, visible: [s.id], isolate: false, selected: [] }))}>
                <span className="system-dot" style={{ background: s.color }} />
                {s.name}
                <span className="system-count">{counts[s.id]}</span>
              </button>
              <label className="switch">
                <input type="checkbox" checked={state.visible.includes(s.id)} onChange={() => toggle(s.id)} aria-label={`Show ${s.name.toLowerCase()}`} />
                <span className="track"><span className="thumb" /></span>
              </label>
            </div>
          ))}
        </div>
        <div className="panel-foot">
          <span>{visibleCount.toLocaleString()} pieces visible</span>
          <button type="button" onClick={() => setState((s) => ({ ...s, visible: [], selected: [], isolate: false }))}>Hide all</button>
        </div>
      </section>

      {panel === 'search' && (
        <section className="search-panel glass" aria-label="Find anatomy">
          <div className="panel-heading">
            <span>Find a structure</span>
            <button type="button" className="icon-button" onClick={() => setPanel(null)} aria-label="Close search">
              <X size={18} />
            </button>
          </div>
          <input
            autoFocus
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Heart, femur, cranial nerve…"
            aria-label="Search named anatomical structures"
          />
          <div className="anatomy-search-results">
            {results.length === 0 && <p className="search-empty">No structures match your search.</p>}
            {results.map((c) => (
              <button type="button" key={c.id} className="search-result" onClick={() => flushSync(() => choose(c))}>
                <span className="search-result-name">{c.name}</span>
                <span className="small-number">{c.elements.length} {c.elements.length === 1 ? 'piece' : 'pieces'}</span>
              </button>
            ))}
          </div>
          <p className="search-note">{query ? 'Showing up to 80 matches. Refine your search to find smaller structures.' : 'Start with a major organ, or search every named structure.'}</p>
        </section>
      )}

      <nav className="view-controls glass" aria-label="Camera controls">
        {VIEWS.map((v, i) => (
          <button type="button" key={v} className={state.view === v ? 'active' : ''} aria-pressed={state.view === v} disabled={state.explode > 0.8 && v !== 'front'} onClick={() => setState((s) => ({ ...s, view: v, reset: s.reset + 1, rotate: false }))} title={`${v} view`} aria-label={`${v} view`}>
            <span>{VIEW_LABELS[i]}</span>
          </button>
        ))}
        <i />
        <button type="button" disabled={state.explode >= 0.4} aria-label={state.rotate ? 'Pause rotation' : 'Rotate body'} title="Auto rotate" className={state.rotate ? 'active' : ''} onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}>
          {state.rotate ? <Pause size={17} /> : <RotateCw size={18} />}
        </button>
        <button type="button" aria-label="Reset view and layers" title="Reset" onClick={reset}>
          <RotateCcw size={17} />
        </button>
      </nav>

      <div className="scene-caption">
        <span className="caption-line" />
        <span>{state.isolate ? (chosen?.name ?? 'SELECTED STRUCTURE') : state.explode > 0.95 ? 'ANATOMICAL INVENTORY' : state.explode > 0.05 ? 'SEPARATED STRUCTURES' : 'ADULT HUMAN · MALE'}</span>
        <span className="caption-line" />
      </div>

      <div className="bottom-dock glass">
        <button type="button" className="mobile-only dock-layers" onClick={() => openPanel('layers')} aria-label="Open system layers">
          <Layers3 size={20} />
          <span>Systems</span>
        </button>
        <div className="explode-control">
          <div className="explode-label">
            <label id="explode-label">Explode anatomy</label>
            <output>{Math.round(state.explode * 100)}<span>%</span></output>
          </div>
          <input
            type="range"
            aria-labelledby="explode-label"
            min={0}
            max={100}
            step={1}
            value={Math.round(state.explode * 100)}
            onChange={(e) => {
              const v = Number(e.target.value)
              setState((s) => ({ ...s, explode: v / 100, view: v > 80 ? 'front' : s.view, rotate: false }))
            }}
          />
          <div className="slider-endpoints"><span>Assembled</span><span>Every piece</span></div>
        </div>
        <button type="button" className="dock-reset" onClick={reset} aria-label="Assemble and reset">
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>

      <footer className="studio-footer">
        <span>{state.explode > 0.8 ? 'Drag to pan' : 'Drag to orbit'} <b>·</b> Pinch to zoom <b>·</b> Tap to inspect</span>
        <button type="button" onClick={() => { setDetails(false); setPanel(null); setAbout(true) }}>
          Source &amp; credits <ArrowUpRight size={12} />
        </button>
      </footer>

      {progress < 100 && !error && (
        <div className="loading glass" role="status">
          <Activity size={18} />
          <div>
            <strong>Preparing the anatomy</strong>
            <span>{progress}% · Loading {atlas?.parts.length.toLocaleString() ?? '2,234'} pieces</span>
            <div className="loading-track"><i style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      )}
      {error && (
        <div className="loading glass error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>Reload viewer</button>
        </div>
      )}

      {details && selectedParts.length > 0 && (
        <aside className={`detail-sheet glass ${state.isolate ? 'is-isolated' : ''}`}>
          <button type="button" className="sheet-close icon-button" onClick={() => setDetails(false)} aria-label="Close detail">
            <X size={18} />
          </button>
          <div className="detail-header">
            <div className="detail-accent" style={{ background: system?.color }} />
            <div className="eyebrow">{system?.name ?? 'ANATOMY'}</div>
            <h2 ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</h2>
          </div>
          <div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}>
            <p className="structure-description">{chosen && selected ? explanation(chosen.name, selected.system) : ''}</p>
            {chosen && !EXPLANATIONS[chosen.name.toLowerCase()] && (
              <span className="context-note">System overview · structure identified from source anatomy</span>
            )}
            <div className="structure-meta">
              <span>Atlas reference<strong>{chosen?.id}</strong></span>
              <span>Selected pieces<strong>{state.selected.length.toLocaleString()}</strong></span>
            </div>
            {selectedParts.length > 1 && (
              <div className="member-list">
                <h3>Included structures</h3>
                {selectedParts.slice(0, 50).map((p) => (
                  <button type="button" key={p.id} onClick={() => choosePart(p.id)}>
                    <span>{p.name}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
                {selectedParts.length > 50 && <p>And {selectedParts.length - 50} more modeled pieces.</p>}
              </div>
            )}
            <a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">
              View anatomical source <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="detail-actions">
            <button type="button" className={`primary-action ${state.isolate ? 'active' : ''}`} onClick={() => setState((s) => ({ ...s, isolate: !s.isolate, explode: 0 }))}>
              <Focus size={18} />
              {state.isolate ? 'Show surrounding anatomy' : 'Isolate structure'}
              <ChevronRight size={16} />
            </button>
            <button type="button" className="secondary-action" onClick={() => { setState((s) => ({ ...s, selected: [], isolate: false })); setDetails(false) }}>
              Clear selection
            </button>
          </div>
        </aside>
      )}

      {about && (
        <aside className="about-sheet glass">
          <button type="button" className="sheet-close icon-button" onClick={() => setAbout(false)} aria-label="Close about">
            <X size={18} />
          </button>
          <div className="eyebrow">SOURCE &amp; SCOPE</div>
          <h2 className="structure-title">{speciesId === 'pig' || speciesId !== 'human' ? 'Veterinary anatomy, explored.' : 'A body, revealed.'}</h2>
          <p className="structure-description">
            {speciesId === 'pig'
              ? `Explore the domestic pig (Sus domestica) skeletal anatomy from Z-Anatomy (${sexId} variant).`
              : speciesId === 'human' && sexId === 'female'
              ? 'Explore the adult female reference anatomy from the HuBMAP Human Reference Atlas.'
              : speciesId === 'human'
              ? 'Explore the adult male reference anatomy from BodyParts3D.'
              : `Explore the ${currentSpecies?.label ?? ''} skeletal anatomy (${sexId} variant).`}
          </p>
          <div className="about-copy">
            {speciesId === 'pig' ? (<>
              <p><strong>Pig · Z-Anatomy ({sexId})</strong><br />{atlas?.parts.length ?? 119} individual skeletal meshes from the Z-PIG veterinary anatomy atlas.</p>
              <p>This model focuses on the skeletal system of Sus domestica. {sexId === 'female' ? 'The female variant is derived from the male baseline using documented sexual dimorphism parameters (pelvic width ratio 1.20, overall scale 0.88).' : 'The male variant is the Z-PIG baseline model.'}</p>
              <h3>Source</h3>
              <p>Z-Anatomy — The libre 3D atlas of anatomy, licensed under CC Attribution-ShareAlike 4.0 International.</p>
              <a href="https://github.com/Z-Anatomy/Models-of-veterinary-anatomy" target="_blank" rel="noreferrer">Z-Anatomy veterinary models <ArrowUpRight size={14} /></a>
              <a href="https://z-anatomy.com" target="_blank" rel="noreferrer">Z-Anatomy project <ArrowUpRight size={14} /></a>
            </>) : speciesId === 'human' && sexId === 'female' ? (<>
              <p><strong>Female · HuBMAP HRA</strong><br />{atlas?.parts.length ?? 888} individual meshes from the HuBMAP Human Reference Atlas.</p>
              <p>This reference represents an adult female anatomy. Named concepts follow the HRA ontology.</p>
              <h3>Source</h3>
              <p>HuBMAP Human Reference Atlas v1.5, licensed under CC Attribution 4.0 International.</p>
              <a href="https://hubmapconsortium.github.io/ccf-releases/v1.5/docs/ref-organs.html" target="_blank" rel="noreferrer">HuBMAP HRA reference organs <ArrowUpRight size={14} /></a>
            </>) : speciesId === 'human' ? (<>
              <p><strong>Male · BodyParts3D</strong><br />2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.</p>
              <p>This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.</p>
              <p>Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.</p>
              <h3>Source</h3>
              <p>BodyParts3D, &copy; The Database Center for Life Science licensed under CC Attribution 4.0 International.</p>
              <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14} /></a>
              <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Original geometry &amp; metadata <ArrowUpRight size={14} /></a>
              <a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">Read the source publication <ArrowUpRight size={14} /></a>
            </>) : (<>
              <p><strong>{currentSpecies?.label} · DigiMorph ({sexId})</strong><br />{atlas?.parts.length ?? 1} mesh(es) from DigiMorph.org CT scan data.</p>
              <p>{sexId === 'female' ? 'The female variant is derived from the male/unknown baseline using documented sexual dimorphism parameters from published morphometric studies.' : 'This is the baseline specimen from DigiMorph CT scan data.'} Colors and system groupings are designed for exploration. This is an anatomical reference, not a diagnostic tool.</p>
              <h3>Source</h3>
              <p>DigiMorph.org — Digital Morphology at The University of Texas at Austin.</p>
              <a href="https://digimorph.org" target="_blank" rel="noreferrer">DigiMorph.org <ArrowUpRight size={14} /></a>
            </>)}
          </div>
        </aside>
      )}
    </main>
  )
}
