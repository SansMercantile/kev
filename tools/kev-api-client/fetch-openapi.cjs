// Fetch the live KEV FastAPI OpenAPI spec for client generation.
// Mirrors tools/fastapi-typescript/scripts/get-openapi-spec.ts (Node port,
// no ts-node needed).
//
// Usage: KEV_API_URL=http://localhost:8000 node fetch-openapi.cjs
// Output: src/generated/api/openapi.json (in the KEV frontend root)
const fs = require('fs');
const path = require('path');

async function main() {
  const base = process.env.KEV_API_URL || 'http://localhost:8000';
  const url = `${base.replace(/\/$/, '')}/openapi.json`;
  console.log(`Fetching OpenAPI spec from ${url} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
  }
  const spec = await response.json();
  const outDir = path.join(__dirname, '..', '..', 'src', 'generated', 'api');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'openapi.json');
  fs.writeFileSync(outFile, JSON.stringify(spec, null, 2));
  const paths = Object.keys(spec.paths || {});
  const xrPaths = paths.filter((p) => p.startsWith('/xr/'));
  console.log(`Wrote ${outFile} (${paths.length} paths, ${xrPaths.length} under /xr/)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
