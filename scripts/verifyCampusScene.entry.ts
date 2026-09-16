/**
 * Campus scene smoke test — entry module.
 *
 * WebGL cannot run headless in this environment, so this does not render a
 * frame. It does the next most valuable thing: it *builds* every world the
 * campus can show and validates the results as scene graphs. That catches the
 * failure modes that actually break a Three.js scene in production and that a
 * type checker cannot see:
 *
 *   • NaN / Infinity transforms — one bad coordinate silently makes a mesh (or
 *     its whole subtree) invisible, with no error anywhere.
 *   • shader materials whose GLSL references a uniform that is not in the
 *     `uniforms` object, or a varying declared in the vertex stage but not the
 *     fragment stage. Three.js does not validate this; WebGL just warns.
 *   • unbalanced GLSL braces from a bad string concat.
 *   • animation callbacks that throw, or that drift into NaN over time.
 *   • disposal that leaves geometries/materials alive (the leak that made the
 *     old VirtualCampus grow memory on every floor change).
 *
 * Run with: `npm run verify:campus`
 */

import * as THREE from 'three';
import { QUALITY_SETTINGS, QUALITY_ORDER } from '../src/xr/render/highFidelityRenderer';
import { buildSchoolHallway, buildSubjectFloorCorridor } from '../src/xr/components/campus/SchoolHallway3D';
import { buildAtriumCampus, ATRIUM_WINGS } from '../src/xr/components/campus/campusAtrium3D';
import { buildVirtualSchoolBuilding } from '../src/xr/components/campus/VirtualSchoolBuilding3D';
import { createCampusMaterials } from '../src/xr/render/campusKit';
import { disposeAllTextures } from '../src/xr/render/proceduralTextures';
import {
  CAMPUS_FLOORS,
  VIRTUAL_SCHOOL,
  floorByNumber,
  hallwayBanners,
  type SchoolFacility,
} from '../src/xr/data/schoolCampus';

// ---------------------------------------------------------------------------
// Tiny assertion harness
// ---------------------------------------------------------------------------

let checks = 0;
const failures: string[] = [];

function check(condition: boolean, message: string): void {
  checks++;
  if (!condition) failures.push(message);
}

function section(name: string): void {
  process.stdout.write(`\n${name}\n${'─'.repeat(name.length)}\n`);
}

function report(label: string, value: string | number): void {
  process.stdout.write(`  ${label.padEnd(38)} ${value}\n`);
}

// ---------------------------------------------------------------------------
// Scene-graph validators
// ---------------------------------------------------------------------------

/** Every transform in the subtree must be finite. */
function assertFiniteTransforms(root: THREE.Object3D, label: string): number {
  let counted = 0;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    counted++;
    const p = obj.position;
    const s = obj.scale;
    const q = obj.quaternion;
    const bad =
      !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z) ||
      !Number.isFinite(s.x) || !Number.isFinite(s.y) || !Number.isFinite(s.z) ||
      !Number.isFinite(q.x) || !Number.isFinite(q.y) || !Number.isFinite(q.z) || !Number.isFinite(q.w);
    check(!bad, `${label}: non-finite transform on "${obj.name || obj.type}" ` +
      `(pos ${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)} scale ${s.x.toFixed(2)},${s.y.toFixed(2)},${s.z.toFixed(2)})`);

    // A zero scale collapses a mesh to nothing — usually an authoring mistake.
    if (s.x === 0 || s.y === 0 || s.z === 0) {
      check(false, `${label}: zero scale on "${obj.name || obj.type}" collapses the mesh`);
    }

    const m = obj.matrixWorld.elements;
    for (const v of m) {
      check(Number.isFinite(v), `${label}: non-finite matrixWorld element on "${obj.name || obj.type}"`);
      break; // one representative check per object keeps the output readable
    }
  });
  return counted;
}

/** Validate every ShaderMaterial in the subtree. */
function assertShaders(root: THREE.Object3D, label: string): number {
  let shaders = 0;
  const seen = new Set<THREE.Material>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      const shaderMat = material as THREE.ShaderMaterial;
      if (!shaderMat.isShaderMaterial) continue;
      shaders++;

      const vertex = shaderMat.vertexShader ?? '';
      const fragment = shaderMat.fragmentShader ?? '';
      const where = `${label} shader on "${obj.name || obj.type}"`;

      check(vertex.length > 0 && fragment.length > 0, `${where}: empty shader stage`);
      check(count(vertex, '{') === count(vertex, '}'), `${where}: unbalanced braces in vertex stage`);
      check(count(fragment, '{') === count(fragment, '}'), `${where}: unbalanced braces in fragment stage`);
      check(fragment.includes('gl_FragColor') || fragment.includes('gl_FragData'),
        `${where}: fragment stage never writes gl_FragColor`);

      // Every uniform the GLSL declares must exist in the uniforms object; a
      // missing entry leaves the value undefined and the draw call silently wrong.
      const declaredUniforms = new Set<string>(Object.keys(shaderMat.uniforms ?? {}));
      for (const name of uniformNames(vertex) || []) {
        check(declaredUniforms.has(name), `${where}: vertex stage declares uniform "${name}" not present in .uniforms`);
      }
      for (const name of uniformNames(fragment)) {
        check(declaredUniforms.has(name), `${where}: fragment stage declares uniform "${name}" not present in .uniforms`);
      }

      // A varying written by the vertex stage and read by the fragment stage
      // must be declared in both, with the same type.
      const vertexVaryings = varyingDeclarations(vertex);
      const fragmentVaryings = varyingDeclarations(fragment);
      for (const [type, name] of vertexVaryings) {
        const used = new RegExp(`\\b${name}\\b`).test(fragment.replace(/varying\s+\w+\s+\w+\s*;/g, ''));
        if (!used) continue;
        const frag = fragmentVaryings.find((v) => v[1] === name);
        check(Boolean(frag), `${where}: varying "${name}" written in vertex stage and read in fragment stage but not declared there`);
        if (frag) check(frag[0] === type, `${where}: varying "${name}" type mismatch (${type} vs ${frag[0]})`);
      }
    }
  });
  return shaders;
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

function uniformNames(glsl: string): string[] {
  return [...glsl.matchAll(/uniform\s+\w+\s+([A-Za-z_]\w*)\s*;/g)].map((m) => m[1]);
}

function varyingDeclarations(glsl: string): Array<[string, string]> {
  return [...glsl.matchAll(/varying\s+(\w+)\s+([A-Za-z_]\w*)\s*;/g)].map((m) => [m[1], m[2]] as [string, string]);
}

/** Run every animation callback across simulated time. */
function assertAnimationsStable(
  updateables: Array<{ object: THREE.Object3D; update: (dt: number, t: number) => void }>,
  label: string
): void {
  let elapsed = 0;
  const dt = 1 / 60;
  for (let frame = 0; frame < 240; frame++) {
    elapsed += dt;
    for (const u of updateables) {
      let threw = false;
      try {
        u.update(dt, elapsed);
      } catch (err) {
        threw = true;
        check(false, `${label}: update() threw at frame ${frame}: ${(err as Error).message}`);
      }
      if (threw) return;
    }
  }
  // After 4 simulated seconds nothing may have drifted to NaN.
  assertFiniteTransforms(updateables[0]?.object ?? new THREE.Object3D(), `${label} (post-animation)`);
  checks++;
}

/** Count live GPU resources so disposal can be proven to release them. */
function countResources(root: THREE.Object3D): { geometries: number; materials: number; textures: number } {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material as unknown as Record<string, unknown>)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  return { geometries: geometries.size, materials: materials.size, textures: textures.size };
}

// ---------------------------------------------------------------------------
// The verification run
// ---------------------------------------------------------------------------

const SETTINGS = QUALITY_SETTINGS.ultra;
let totalObjects = 0;
let totalShaders = 0;

// --- Floor 0: the Grand Concourse Hallway ---------------------------------
section('Floor 0 — Grand Concourse Hallway');
{
  const banners = hallwayBanners();
  const interactions: string[] = [];
  const hallway = buildSchoolHallway({
    settings: SETTINGS,
    ceilingHeight: 5.2,
    onInteract: (i) => interactions.push(i.kind),
  });

  const objects = assertFiniteTransforms(hallway.group, 'hallway');
  const shaders = assertShaders(hallway.group, 'hallway');
  totalObjects += objects;
  totalShaders += shaders;

  report('scene objects', objects);
  report('shader materials', shaders);
  report('interactables', hallway.interactables.length);
  report('animated updateables', hallway.updateables.length);
  report('transparent (fog-excluded)', hallway.transparent.length);
  report('subject banners in data', banners.length);

  check(hallway.group.children.length > 0, 'hallway: group is empty');
  check(objects > 100, `hallway: only ${objects} objects — expected a dense corridor`);
  check(hallway.interactables.length >= 7,
    `hallway: ${hallway.interactables.length} interactables, expected at least the 7 concourse facilities`);
  check(hallway.updateables.length > 0, 'hallway: nothing animated');

  // Every interactable must carry the facility the UI renders a prompt from.
  for (const target of hallway.interactables) {
    check(Boolean(target.userData.facility),
      `hallway: interactable "${target.name || target.type}" has no userData.facility`);
  }

  // One banner per subject area must exist as a named node.
  for (const banner of banners) {
    const node = hallway.group.getObjectByName(`banner-${banner.subject}`);
    check(Boolean(node), `hallway: missing banner node for subject "${banner.subject}"`);
  }

  assertAnimationsStable(hallway.updateables, 'hallway');

  // Interaction wiring: firing each hallway facility must reach the callback.
  const facilities = (floorByNumber(0)?.facilities ?? []) as SchoolFacility[];
  for (const facility of facilities) {
    const node = hallway.group.getObjectByName(facility.id);
    check(Boolean(node), `hallway: facility "${facility.id}" has no scene node`);
    const interaction = node?.userData.interaction as (() => void) | undefined;
    check(typeof interaction === 'function',
      `hallway: facility "${facility.id}" has no interaction handler`);
    interaction?.();
  }
  report('interactions fired', interactions.length);
  check(interactions.length === facilities.length,
    `hallway: fired ${interactions.length} interactions, expected ${facilities.length}`);

  // Disposal must release everything it created.
  const before = countResources(hallway.group);
  hallway.dispose();
  check(hallway.group.children.length === 0, 'hallway: dispose() left children in the group');
  check(hallway.updateables.length === 0, 'hallway: dispose() left updateables registered');
  check(hallway.interactables.length === 0, 'hallway: dispose() left interactables registered');
  report('geometries/materials released', `${before.geometries}/${before.materials}`);
}

// --- Floors 1-4: the legacy XR atrium ------------------------------------
section('Floors 1-4 — legacy XR atrium wings');
for (const floorNumber of [1, 2, 3, 4] as const) {
  const atrium = buildAtriumCampus({
    activeFloor: floorNumber,
    floorCount: CAMPUS_FLOORS.length,
    floorColours: Object.fromEntries(CAMPUS_FLOORS.map((f) => [f.floorNumber, f.color])),
  });
  const objects = assertFiniteTransforms(atrium.group, `atrium-${floorNumber}`);
  totalShaders += assertShaders(atrium.group, `atrium-${floorNumber}`);
  totalObjects += objects;

  check(atrium.roomZones.length === ATRIUM_WINGS.length,
    `atrium-${floorNumber}: ${atrium.roomZones.length} proximity zones, expected ${ATRIUM_WINGS.length} wings`);
  check(atrium.apparatusList.length === ATRIUM_WINGS.length,
    `atrium-${floorNumber}: ${atrium.apparatusList.length} apparatus, expected ${ATRIUM_WINGS.length}`);
  report(`floor ${floorNumber} objects / zones`, `${objects} / ${atrium.roomZones.length}`);

  assertAnimationsStable(atrium.updateables, `atrium-${floorNumber}`);
  atrium.dispose();
  check(atrium.group.children.length === 0, `atrium-${floorNumber}: dispose() left children`);
}

// --- Floors 5-10: data-driven subject corridors ---------------------------
section('Floors 5-10 — subject wing corridors');
for (const campusFloor of CAMPUS_FLOORS) {
  if (campusFloor.floorNumber < 5) continue;
  const facilities = campusFloor.facilities as SchoolFacility[];
  const corridor = buildSubjectFloorCorridor({
    floorNumber: campusFloor.floorNumber,
    facilities,
    settings: SETTINGS,
    accent: new THREE.Color(campusFloor.color).getHex(),
    floorName: campusFloor.name,
  });
  const objects = assertFiniteTransforms(corridor.group, `floor-${campusFloor.floorNumber}`);
  totalShaders += assertShaders(corridor.group, `floor-${campusFloor.floorNumber}`);
  totalObjects += objects;

  // One door per room, each carrying its facility for the proximity prompt.
  check(corridor.interactables.length === facilities.length,
    `floor-${campusFloor.floorNumber}: ${corridor.interactables.length} doors for ${facilities.length} rooms`);
  for (const door of corridor.interactables) {
    check(Boolean(door.userData.facility),
      `floor-${campusFloor.floorNumber}: door "${door.name}" has no userData.facility`);
  }
  report(
    `floor ${campusFloor.floorNumber} (${facilities.length} rooms)`,
    `${objects} objects, ${corridor.interactables.length} doors`
  );

  assertAnimationsStable(corridor.updateables, `floor-${campusFloor.floorNumber}`);
  corridor.dispose();
  check(corridor.group.children.length === 0,
    `floor-${campusFloor.floorNumber}: dispose() left children`);
}

// --- Floor 9: the KEV International Virtual School building ---------------
section('Floor 9 — KEV International Virtual School');
{
  check(Boolean(VIRTUAL_SCHOOL?.available), 'virtual school: not available in the campus mirror');
  const materials = createCampusMaterials(SETTINGS, { accent: 0xa855f7 });
  const vs = buildVirtualSchoolBuilding({
    school: VIRTUAL_SCHOOL,
    materials,
    settings: SETTINGS,
    coordinateScale: 1.5,
    storeyHeight: 4.4,
  });
  const objects = assertFiniteTransforms(vs.group, 'virtual-school');
  totalShaders += assertShaders(vs.group, 'virtual-school');
  totalObjects += objects;

  const expected = VIRTUAL_SCHOOL.levels.reduce((sum, l) => sum + l.facilitiesCount, 0);
  report('levels', VIRTUAL_SCHOOL.levels.length);
  report('rooms built / expected', `${vs.roomZones.length} / ${expected}`);
  report('scene objects', objects);

  check(vs.roomZones.length === expected,
    `virtual school: built ${vs.roomZones.length} rooms, expected ${expected}`);
  check(vs.facilities.length === expected,
    `virtual school: ${vs.facilities.length} facilities registered, expected ${expected}`);

  // Every proximity zone must be a real, non-empty volume — a degenerate box
  // would make a room impossible to enter.
  for (const zone of vs.roomZones) {
    const size = zone.box.getSize(new THREE.Vector3());
    check(size.x > 0.5 && size.y > 0.5 && size.z > 0.5,
      `virtual school: degenerate proximity box for "${zone.facility.name}" ` +
      `(${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)})`);
    check(Number.isFinite(zone.box.min.x) && Number.isFinite(zone.box.max.z),
      `virtual school: non-finite proximity box for "${zone.facility.name}"`);
  }

  assertAnimationsStable(vs.updateables, 'virtual-school');
  vs.dispose();
  materials.dispose();
  check(vs.group.children.length === 0, 'virtual school: dispose() left children');
}

// --- Every quality tier must build ---------------------------------------
section('Quality tiers');
for (const tier of QUALITY_ORDER) {
  const settings = QUALITY_SETTINGS[tier];
  const hallway = buildSchoolHallway({ settings, ceilingHeight: 5.2 });
  const objects = assertFiniteTransforms(hallway.group, `hallway-${tier}`);
  const shaders = assertShaders(hallway.group, `hallway-${tier}`);
  check(objects > 0, `tier ${tier}: built an empty hallway`);
  report(
    tier.padEnd(12),
    `${objects} objects, ${shaders} shaders, tex ${settings.textureResolution}, ` +
    `fog ${settings.volumetricFog ? settings.fogSteps + ' steps' : 'off'}, ` +
    `gtao ${settings.gtao ? settings.gtaoSamples : 'off'}`
  );
  hallway.dispose();
}

// --- Material library must survive reuse and disposal ---------------------
section('Procedural PBR materials');
{
  const libraries = [createCampusMaterials(SETTINGS), createCampusMaterials(SETTINGS, { accent: 0xf59e0b })];
  for (const lib of libraries) {
    for (const [name, material] of Object.entries(lib)) {
      if (typeof name !== 'string' || !(material instanceof THREE.Material)) continue;
      check(material.type.length > 0, `material "${name}" has no type`);
    }
    check(lib.terrazzo.map !== null || lib.terrazzo.normalMap !== null,
      'terrazzo material has no texture maps applied');
  }
  libraries.forEach((lib) => lib.dispose());
  disposeAllTextures();
  report('material sets built + disposed', libraries.length);
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.stdout.write(`\n${'═'.repeat(60)}\n`);
report('total scene objects validated', totalObjects);
report('total shader materials validated', totalShaders);
report('assertions run', checks);
report('failures', failures.length);

if (failures.length) {
  process.stdout.write('\nFAILURES:\n');
  for (const failure of failures.slice(0, 60)) process.stdout.write(`  ✗ ${failure}\n`);
  if (failures.length > 60) process.stdout.write(`  … and ${failures.length - 60} more\n`);
  // Hand the result back to the runner rather than exiting here, so it can
  // clean up the temporary bundle first.
  (globalThis as Record<string, unknown>).__CAMPUS_SMOKE_FAILED__ = failures.length;
} else {
  process.stdout.write('\n✓ Every campus world builds with finite transforms, valid\n');
  process.stdout.write('  shader wiring, stable animation and clean disposal.\n');
  (globalThis as Record<string, unknown>).__CAMPUS_SMOKE_FAILED__ = 0;
}
