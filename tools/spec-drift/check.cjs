#!/usr/bin/env node
// API spec drift gate (docs/KEV_TOOLS_ROADMAP.md T1).
//
// Compares the committed OpenAPI snapshot (src/generated/api/openapi.json)
// against the live backend and fails when routes were added, removed or had
// methods changed - the class of bug where the frontend keeps calling a
// contract the backend no longer serves (e.g. expecting `targetLab` while
// the backend ships `lab`).
//
// Usage:
//   KEV_API_URL=http://localhost:8000 node check.cjs
//
// Exit codes: 0 = in sync, 1 = drift detected, 2 = cannot compare
// (backend down or snapshot missing - CI should treat 2 as "skipped, warn").

const fs = require('fs');
const path = require('path');

const KEV_ROOT = path.join(__dirname, '..', '..');
const SNAPSHOT = path.join(KEV_ROOT, 'src', 'generated', 'api', 'openapi.json');
const BASE = process.env.KEV_API_URL || 'http://localhost:8000';
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function operations(spec) {
  const ops = new Set();
  for (const [routePath, item] of Object.entries(spec.paths || {})) {
    for (const method of METHODS) {
      if (item && item[method]) ops.add(`${method.toUpperCase()} ${routePath}`);
    }
  }
  return ops;
}

async function main() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(`No committed snapshot at ${SNAPSHOT} - run npm run api:client first.`);
    process.exit(2);
  }
  const committed = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));

  let live;
  try {
    const response = await fetch(`${BASE.replace(/\/$/, '')}/openapi.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    live = await response.json();
  } catch (err) {
    console.error(`Cannot reach ${BASE} (${err.message}) - drift check skipped.`);
    process.exit(2);
  }

  const committedOps = operations(committed);
  const liveOps = operations(live);
  const added = [...liveOps].filter((op) => !committedOps.has(op)).sort();
  const removed = [...committedOps].filter((op) => !liveOps.has(op)).sort();

  if (!added.length && !removed.length) {
    console.log(`Spec drift check OK: ${liveOps.size} operations match the committed snapshot.`);
    return;
  }

  console.error('SPEC DRIFT detected against the committed snapshot:');
  for (const op of added) console.error(`  + ${op} (new on backend, missing from snapshot)`);
  for (const op of removed) console.error(`  - ${op} (in snapshot, gone from backend)`);
  console.error('\nRegenerate (npm run api:client), review the diff, and commit.');
  process.exit(1);
}

main();
