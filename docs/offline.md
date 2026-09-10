# KEV offline-first learning

Students learn without internet. Layers, in order of use:

## 1. App shell (PWA service worker)

`vite-plugin-pwa` (Workbox) generates the worker at build time
(`vite.config.js`):

- **Precache**: the built shell (JS/CSS/HTML) — a reload with zero network
  still boots the app.
- **CacheFirst** (`kev-models`, 30d): `/models/*.json` — the 3,432-concept
  anatomy catalog and 334-piece vehicle manifest keep deep search working.
- **CacheFirst** (`kev-fonts`, 30d): Google Fonts.
- **NetworkFirst** (`kev-api`, 4s timeout, 24h): GET `/api/*` — fresh when
  online, last-good copy when not.
- **Background Sync** (`kev-chat-outbox`): POST `/api/xr/campus/chat/send`
  replays automatically after reconnect.
- `navigateFallback: index.html` — unknown routes boot the SPA offline.

`src/main.jsx` registers the worker in production builds only.

## 2. App-level offline data (`src/xr/lib/offline.ts`)

- `cachedFetch(url, {ttlMs, fallback})` — NetworkFirst JSON with an
  IndexedDB (`kev_offline_db.api_cache`) copy, then a bundled static
  fallback. Used for campus floors (+ `src/xr/data/campusFloors.ts`
  mirror of backend FLOORS), library packs (7-day TTL).
- `queueOutbox/flushOutbox/outboxCount` — queued chat POSTs in
  `kev_offline_db.outbox`, replayed in order on `online` events (plus the
  SW background sync as a second path). The chat header shows the queued
  count.
- `onReconnect(fn)` — refresh-on-reconnect helper (floors, packs, queue).

## 3. What works fully offline

- All 3D labs + Immersive Lab + Human Atlas (procedural, bundled data).
- Lab notebook (IndexedDB drafts/observations/snapshots, PDF export, print).
- Campus floors/rooms/teleport (static mirror after first load from cache).
- Library study packs once opened online (per-discipline topic notes).
- AI tutor static fallback guidance + suggested prompts.
- World language catalog is online-only on first load; the 6 UI bundles
  and study levels are compiled in.

## 4. Backend support

- `backend/ai_cache.py` — tutor answers cached 7 days on the shared
  constellation cache (`shared_resources.cache.cache_manager`, disk-backed)
  with process-local fallback. Saves Bedrock cost + latency; responses
  carry `cached: true/false`.
- `GET /library/pack[?subject=&level=]` — versioned offline study packs
  for all 14 curriculum subjects (see `backend/library_content.py`).
- Quota/usage state is server-side; the billing portal needs connectivity
  (paywalls render from the last 402 payload when offline).

## 5. Deliberately NOT offline

- Live Bedrock answers, real-time chat/presence, bookings, checkout,
  onboarding/KYC, VR multi-user sessions.

## Shared tech reused (honest list)

- `shared_resources.cache.cache_manager.CacheManager` — AI answer cache.
- `shared_resources.i18n` negotiator + context — API message language.
- `shared_resources.central_library` KEV integration — merged into library
  search; KEV's full topic tree lives in `backend/library_content.py`.
- Skipped with reason: `generative_ai/` (trading-specific, cloud keys),
  `ai_core/` neurosymbolic (needs priv settings + sklearn/networkx),
  `ai_infrastructure/` (mock simulators), `ising_decoder` (quantum
  optimization, unrelated to learning features).
