# KEV API client generation (v2 - pure Node)

Typed TypeScript client for the KEV FastAPI backend: fetch the OpenAPI spec,
generate types + a fetch client, import typed calls instead of hard-coding
paths. v2 dropped the Java `openapi-generator-cli` dependency (T1 of
`docs/KEV_TOOLS_ROADMAP.md`) for a deterministic in-repo generator, and added
the `tools/spec-drift` CI gate.

## How to

1. Run the backend locally so `http://localhost:8000/openapi.json` is live:
   ```sh
   KEV_DEV_AUTH_BYPASS=true ../.venv/bin/python -m uvicorn kev.backend.main:app --port 8000
   ```
2. From the KEV root, fetch + generate in one step:
   ```sh
   npm run api:client
   # = node tools/kev-api-client/fetch-openapi.cjs   -> src/generated/api/openapi.json
   # + node tools/kev-api-client/generate.cjs        -> src/generated/api/{types.ts,client.ts}
   ```
3. Use it:
   ```ts
   import { createKevXrClient } from '@/generated/api/client';
   import { xrApi, xrAuthHeaders } from '@/xr/lib/xrApi';

   const api = createKevXrClient({ basePath: '/api/xr-prefix...', headers: xrAuthHeaders });
   await api.challengesDaily();
   ```

## Scope & guarantees

- Generation is scoped to `/xr/*` (`generate.cjs --scope`); that is the
  surface `src/lib/xrClient.ts` hand-maintains today.
- Request bodies and query/path params are fully typed from the Pydantic
  schemas; responses are `unknown` unless a route declares a response schema -
  the generator never invents types the backend did not promise.
- Output must type-check under the strict `kev/tsconfig.json`; `npm run
  typecheck` covers `src/generated/`.
- `npm run api:drift` (tools/spec-drift) fails CI when live routes and the
  committed snapshot disagree; regenerate and commit snapshot + client
  together.

## Current state

`src/lib/xrClient.ts` remains the hand-maintained client used by existing
call sites; new code should prefer the generated `createKevXrClient`. The
generated snapshot (`openapi.json`, `types.ts`, `client.ts`) is committed so
drift is reviewable in git.
