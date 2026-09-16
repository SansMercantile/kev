# spec-drift

CI gate for the KEV API contract (T1 of `docs/KEV_TOOLS_ROADMAP.md`).

Compares the committed OpenAPI snapshot (`src/generated/api/openapi.json`,
written by `tools/kev-api-client`) against the **live** backend and fails when
operations were added or removed. This is the drift class that already bit
once: the Twin Challenge frontend expected `targetLab` while the backend
shipped `lab`.

```sh
KEV_API_URL=http://localhost:8000 node check.cjs
```

Exit codes:

| Code | Meaning | CI action |
|---|---|---|
| 0 | snapshot and live routes match | pass |
| 1 | drift detected (list printed) | fail - regenerate, review, commit |
| 2 | backend down / snapshot missing | warn-skip (contract check needs a live server) |

Workflow after a backend route change:

```sh
npm run api:client   # fetch spec + regenerate typed client
npm run api:drift    # now passes; commit snapshot + generated code together
```
