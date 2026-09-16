/**
 * Runner for the campus scene smoke test.
 *
 * The harness (`verifyCampusScene.entry.ts`) is TypeScript and imports the real
 * campus modules, so it is bundled with the project's own esbuild and then
 * executed in-process. No test framework is involved: the repo's frontend has
 * none, and adding one purely to walk a scene graph would be more machinery than
 * value.
 *
 * Usage: npm run verify:campus
 */

import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { installDomStub } from './domStub.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, 'verifyCampusScene.entry.ts');
const outFile = path.join(os.tmpdir(), `kev-campus-scene-${process.pid}.mjs`);

// The canvas stub must exist before any campus module is evaluated, since the
// procedural textures are generated at import/build time.
installDomStub();

// `maxAnisotropy()` probes for a real WebGL context and falls back when there is
// none — which is always the case here. Three.js logs that failure internally
// before throwing, so the fallback path is correct but noisy. Reword it rather
// than suppress it: a genuine renderer error elsewhere should still be visible.
const originalError = console.error.bind(console);
console.error = (...args) => {
  const text = args.map((a) => String(a)).join(' ');
  if (/Error creating WebGL context/.test(text)) {
    process.stdout.write('  (note: no WebGL context headless — anisotropy probe\n');
    process.stdout.write('   fell back to 4x, as designed)\n');
    return;
  }
  originalError(...args);
};


try {
  await build({
    entryPoints: [entry],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    // The repo's own path alias, so the harness resolves modules exactly as the
    // app does.
    alias: { '@': path.join(here, '..', 'src') },
    logLevel: 'warning',
  });

  await import(pathToFileURL(outFile).href);

  const failed = globalThis.__CAMPUS_SMOKE_FAILED__;
  process.exit(failed ? 1 : 0);
} catch (err) {
  // A build failure or a throw inside the harness both land here; report the
  // message plainly rather than as a stack of ESM loader internals.
  process.stderr.write(`\n${String(err?.stack ?? err)}\n`);
  process.exit(1);
} finally {
  try { fs.rmSync(outFile, { force: true }); } catch { /* best effort */ }
}
