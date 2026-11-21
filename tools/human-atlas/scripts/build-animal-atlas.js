#!/usr/bin/env node
/**
 * Animal Atlas Builder - Converts raw animal species data into KEV atlas format
 * Follows the female converter pattern: parse raw -> normalized geometry + metadata
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(ROOT, '../public/models/animal-atlas');

// --- Data source: curated animal species metadata (Human Atlas compatible) ---
const ANIMAL_SPECIES = [
  { id: 'elephant', label: 'African Elephant', latin: 'Loxodonta africana', domain: 'terrestrial', phylum: 'chordata', class: 'mammal', order: 'proboscidea', habitat: ['savanna', 'forest', 'desert'], diet: 'herbivore', size_m: 4.5, weight_kg: 6000, lifespan_years: 70, conservation: 'endangered' },
  { id: 'lion', label: 'African Lion', latin: 'Panthera leo', domain: 'terrestrial', phylum: 'chordata', class: 'mammal', order: 'carnivora', habitat: ['savanna', 'grassland', 'scrub'], diet: 'carnivore', size_m: 2.5, weight_kg: 190, lifespan_years: 15, conservation: 'vulnerable' },
  { id: 'tiger', label: 'Bengal Tiger', latin: 'Panthera tigris tigris', domain: 'terrestrial', phylum: 'chordata', class: 'mammal', order: 'carnivora', habitat: ['tropical forest', 'mangrove', 'grassland'], diet: 'carnivore', size_m: 2.7, weight_kg: 220, lifespan_years, conservation: 'endangered' },
  { id: 'wolf', label: 'Gray Wolf', latin: 'Canis lupus', domain: 'terrestrial', phylum: 'chordata', class: 'mammal', order: 'carnivora', habitat: ['forest', 'tundra', 'mountain'], diet: 'carnivore', size_m: 1.3, weight_kg: 45, lifespan_years: 12, conservation: 'least_concern' },
  { id: 'giraffe', label: 'Reticulated Giraffe', latin: 'Giraffa camelopardalis reticulata', domain: 'terrestrial', phylum: 'chordata', class: 'mammal', order: 'artiodactyla', habitat: ['savanna', 'woodland'], diet: 'herbivore', size_m: 5.5, weight_kg: 1200, lifespan_years: 25 },
  { id: 'elephant-seal', label: 'Southern Elephant Seal', latin: 'Mirounga leonina', domain: 'marine', phylum: 'chordata', class: 'mammal', order: 'carnivora', habitat: ['coastal waters', 'subantarctic islands'], diet: 'carnivore', size_m: 4.2, weight_kg: 3200, lifespan_years: 22 },
  { id: 'penguin-emperor', label: 'Emperor Penguin', latin: 'Aptenodytes forsteri', domain: 'terrestrial', phylum: 'chordata', class: 'aves', order: 'sphenisciformes', habitat: ['Antarctic ice', 'coastal waters'], diet: 'carnivore', size_m: 1.2, weight_kg: 35, lifespan_years: 20 },
  { id: 'eagle-bald', label: 'Bald Eagle', latin: 'Haliaeetus leucocephalus', domain: 'aerial', phylum: 'chordata', class: 'aves', order: 'accipitriformes', habitat: ['near water', 'coastal areas', 'lakes'], diet: 'carnivore', size_m: 0.9, weight_kg: 5.5, lifespan_years: 30 },
  { id: 'peregrine-falcon', label: 'Peregrine Falcon', latin: 'Falco peregrinus', domain: 'aerial', phylum: 'chordata', class: 'aves', order: 'falconiformes', habitat: ['cliffs', 'urban areas', 'coastal'], diet: 'carnivore', size_m: 0.45, weight_kg: 1.2, lifespan_years: 17 },
  { id: 'owl-snowy', label: 'Snowy Owl', latin: 'Bubo scandiacus', domain: 'aerial', phylum: 'chordata', class: 'aves', order: 'strigiformes', habitat: ['Arctic tundra', 'open fields'], diet: 'carnivore', size_m: 0.65, weight_kg: 2.0, lifespan_years: 10 },
  { id: 'crocodile', label: 'Nile Crocodile', latin: 'Crocodylus niloticus', domain: 'aquatic', phylum: 'chordata', class: 'reptilia', order: 'crocodilia', habitat: ['rivers', 'lakes', 'wetlands'], diet: 'carnivore', size_m: 5.0, weight_kg: 700, lifespan_years: 70 },
  { id: 'sea-turtle', label: 'Green Sea Turtle', latin: 'Chelonia mydas', domain: 'marine', phylum: 'chordata', class: 'reptilia', order: 'testudines', habitat: ['tropical oceans', 'coral reefs', 'seagrass beds'], diet: 'herbivore', size_m: 1.2, weight_kg: 160, lifespan_years: 80 },
  { id: 'jaguar', label: 'Jaguar', latin: 'Panthera onca', domain: 'terrestrial', phylum: 'chordata', order: 'carnivora', habitat: ['rainforest', 'wetlands', 'grasslands'], diet: 'carnivore', size_m: 1.85, weight_kg: 96, lifespan_years: 17 },
  { id: 'gorilla', label: 'Western Lowland Gorilla', latin: 'Gorilla gorilla', domain: 'terrestrial', phylum: 'chordata', order: 'primates', habitat: ['tropical rainforest', 'montane forest'], diet: 'herbivore', size_m: 1.7, weight_kg: 140, lifespan_years: 35 },
  { id: 'orangutan', label: 'Bornean Orangutan', latin: 'Pongo pygmaeus', domain: 'terrestrial', phylum: 'chordata', order: 'primates', habitat: ['tropical rainforest', 'peat swamp forest'], diet: 'herbivore', size_m: 1.3, weight_kg: 80, lifespan_years: 45 },
  { id: 'polar-bear', label: 'Polar Bear', latin: 'Ursus maritimus', domain: 'marine', phylum: 'chordata', order: 'carnivora', habitat: ['Arctic sea ice', 'coastal waters'], diet: 'carnivore', size_m: 2.4, weight_kg: 500, lifespan_years: 25 },
  { id: 'red-kangaroo', label: 'Red Kangaroo', latin: 'Macropus rufus', domain: 'terrestrial', phylum: 'chordata', order: 'marsupialia', habitat: ['arid grasslands', 'shrublands', 'deserts'], diet: 'herbivore', size_m: 1.6, weight_kg: 55, lifespan_years: 18 },
  { id: 'platypus', label: 'Duck-billed Platypus', latin: 'Ornithorhynchus anatinus', domain: 'semi-aquatic', phylum: 'chordata', order: 'monotremata', habitat: ['freshwater streams', 'rivers', 'lakes'], diet: 'carnivore', size_m: 0.45, weight_kg: 1.7, lifespan_years: 17 },
  { id: 'echidna', label: 'Short-beaked Echidna', latin: 'Tachyglossus aculeatus', domain: 'terrestrial', phylum: 'chordata', order: 'monotremata', habitat: ['forests', 'grasslands', 'heathlands'], diet: 'carnivore (ants/termites)', size_m: 0.4, weight_kg: 4.5, lifespan_years: 16 },
  { id: 'numbat', label: 'Numbat', latin: 'Myrmecobius fasciatus', domain: 'terrestrial', phylum: 'chordata', order: 'dasyuromorphia', habitat: ['woodlands', 'forests', 'shrublands'], diet: 'carnivore (termites)', size_m: 0.2, weight_kg: 0.45, lifespan_years: 5 },
  { id: 'quokka', label: 'Quokka', latin: 'Setonix brachyurus', domain: 'terrestrial', phylum: 'chordata', order: 'diprotodontia', habitat: ['Rottnest Island', 'mainland wetlands'], diet: 'herbivore', size_m: 0.5, weight_kg: 4.0, lifespan_years: 10 },
  { id: 'tasmanian-devil', label: 'Tasmanian Devil', latin: 'Sarcophilus harrisii', domain: 'terrestrial', phylum: 'chordata', order: 'dasyuromorphia', habitat: ['eucalypt forests', 'woodlands', 'coastal heath', diet: 'carnivore (scavenger and predator)', size_m: 0.65, weight_kg: 8.5, lifespan_years: 8 },
  { id: 'wombat', label: 'Common Wombat', latin: 'Vombatus ursinus', domain: 'terrestrial', phylum: 'chordata', order: 'marsupial', habitat: ['forests', 'woodlands', 'heathlands', diet: 'herbivore (grasses, roots, bark)', size_m: 0.9, weight_kg: 26.0, lifespan_years: 15 },
  { id: 'koala', label: 'Koala', latin: 'Phascolarctos cinereus', domain: 'terrestrial', phylum: 'chordata', order: 'marsupialia', habitat: 'Eucalyptus forests and woodlands', diet: 'herbivore (eucalyptus leaves only)', size_m: 0.75, weight_kg: 9.0, lifespan_years: 13 },
  { id: 'platypus', label: 'Duck-billed Platypus', latin: 'Ornithorhynchus anatinus', domain: 'semi-aquatic', phylum: 'chordata', order: 'monotremata', habitat: ['freshwater streams', 'rivers', 'lakes'], diet: 'carnivore (aquatic insects, worms, crustaceans)', size_m: 0.45, weight_kg: 1.7, lifespan_years: 17 },
  { id: 'echidna', label: 'Short-beaked Echidna', latin: 'Tachyglossus aculeatus', domain: 'terrestrial', phylum: 'chordata', order: 'monotremata', habitat: ['forests', 'grasslands', 'heathlands', diet: 'ants, termites, larvae', size_m: 0.4, weight_kg: 4.5, lifespan_years: 16 },
  { id: 'numbat', label: 'Numbat', latin: 'Myrmecobius fasciatus', domain: 'terrestrial', phylum: 'chordata', order: 'dasyuromorphia', habitat: ['woodlands', 'forests', 'shrublands', diet: 'termites', size_m: 0.2, weight_kg: 0.45, lifespan_years: 5,
  { id: 'quokka', label: 'Quokka', latin: 'Setonix brachyurus', domain: 'terrestrial', phylum: 'chordata', order: 'diprotodontia', habitat: ['Rottnest Island', 'mainland wetlands'], diet: 'herbivore', size_m: 0.5, weight_kg: 4.0, lifespan_years: 10 },
  { id: 'tasmanian_devil', label: 'Tasmanian Devil', latin: 'Sarcophilus harrisii', domain: 'terrestrial', phylum: 'chordata', order: 'dasyuromorphia', habitat: ['eucalypt forests', 'woodlands', 'coastal heath', diet: 'carnivore (scavenger and predator)', size_m: 0.65, weight_kg: 8.5, lifespan_years: 8 },
  { id: 'wombat', label: 'Common Wombat', latin: 'Vombatus ursinus', domain: 'terrestrial', order: 'diprotodontia', habitat: ['forests', 'woodlands', 'heathlands', diet: 'grasses, roots, bark', size_m: 0.9, weight_kg: 26.0, lifespan_years: 15 },
  { id: 'koala', name: 'Koala', latin: 'Phascolarctos cinereus', domain: 'terrestrial', order: 'diprotodontia', habitat: ['Eucalyptus forests', 'woodlands'], diet: 'herbivore (eucalyptus leaves only)', size_m: 0.75, weight_kg: 9.0, lifespan_years: 13 },
  { id: 'platypus', latin: 'Ornithorhynchus anatinus', domain: 'semi-aquatic', order: 'monotremata', habitat: ['freshwater streams', 'rivers', 'lakes'], diet: 'carnivore (aquatic insects, worms, crustaceans)', size_m: 0.45, weight_kg: 1.7, lifespan_years: 17 },
];

// --- Geometry normalizer (matches male converter's pattern) ---
function normalizeAnimalGeometry(raw) {
  // Extract species from the raw filename (e.g., "Lion_African_01.glb" -> "lion")
  const base = raw.replace(/^.*[\\\/]/, '').replace(/\.[^.]+$/, '');
  const species = base.toLowerCase().replace(/[^a-z0-9]/g, '_');
  // Parse GLB into 64-byte aligned chunks (KEV standard: header + mesh)
  const header = Buffer.alloc(8);
  header.write('KEVX', 0);
  header.writeUInt32LE(1, 4); // version
  const mesh = Buffer.from(raw, 'base64'); // raw is base64-encoded GLB
  const headerJson = JSON.stringify({ species: species, triangles: Math.floor(mesh.length / 24), meshOffsets: [] });
  const headerBytes = Buffer.from(headerJson, 'utf8');
  const alignedHeader = Buffer.alloc(8 + Math.ceil(headerBytes.length / 4) * 4);
  header.copy(alignedHeader, 0);
  header.writeUInt32LE(headerBytes.length, 4);
  alignedHeader.write(headerJson, 8);
  return Buffer.concat([header, alignedHeader]);
}

// --- Main build pipeline ---
async function buildAnimalAtlas() {
  console.log('🐾 Animal Atlas Builder starting...');
  
  const rawDir = path.join(__dirname, 'raw-species');
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
    console.log('Created raw-species directory. Place raw .glb files there and re-run.');
    return;
  }
  
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.glb'));
  console.log(`Found ${files.length} raw species files to process.`);
  
  for (const file of files) {
    const rawPath = path.join(rawDir, file);
    const raw = fs.readFileSync(rawPath);
    const normalized = normalizeAnimalGeometry(raw);
    const outName = file.replace(/\.glb$/, '.atlas');
    const outPath = path.join(OUT_DIR, outName);
    fs.writeFileSync(outPath, normalized);
    console.log(`✓ ${file} → ${outName}`);
  }
  
  console.log('\n🎉 Animal atlas complete: ' + files.length + ' species processed');
  console.log(`Output directory: ${OUT_DIR}`);
}

buildAnimalAtlas().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});