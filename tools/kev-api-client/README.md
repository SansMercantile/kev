# KEV API client generation

Typed TypeScript client for the KEV FastAPI backend, following the pattern of
`tools/fastapi-typescript` (fetch OpenAPI spec -> generate `typescript-fetch`
client -> import typed calls instead of hard-coding paths).

## How to

1. Run the backend locally, e.g. `http://localhost:8000/docs` is live:
   ```sh
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
2. Fetch the spec (from `tools/kev-api-client`):
   ```sh
   KEV_API_URL=http://localhost:8000 node fetch-openapi.cjs
   ```
   This writes `src/generated/api/openapi.json` in the KEV frontend root.
3. Generate the client (needs Java for `openapi-generator-cli`):
   ```sh
   npm run api:client
   ```
   Output lands in `src/generated/api` (`CoreApi.ts`, `models/*`, `runtime.ts`).
4. Use it like the sample in `tools/fastapi-typescript/sample.ts`:
   ```ts
   import { xrClient } from '@/lib/xrClient' // hand-maintained today
   // after generation:
   // import { coreApi } from '@/requests'
   // await coreApi.xrSubjects()
   ```

## Current state

`src/lib/xrClient.ts` is the hand-maintained typed client for the `/xr/*`
surface (kept in sync with `backend/xr_academy.py` by hand until generation
runs in CI). New frontend code should call `xrClient` (or the generated
`CoreApi` once available) instead of hard-coding `/xr/...` paths.
