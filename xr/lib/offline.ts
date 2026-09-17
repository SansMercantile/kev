/**
 * App-level offline data: a NetworkFirst JSON cache and a replay queue for chat.
 *
 * This is layer 2 of the offline story in `docs/offline.md`. Layer 1 is the
 * generated service worker (app shell precache, `kev-api` NetworkFirst, and a
 * `kev-chat-outbox` background-sync route). This module is the layer the app can
 * reason about directly, and it exists because the worker cannot supply a
 * *bundled* fallback — when a student opens the campus map with no network and
 * no prior visit, there is nothing in any cache, and the UI still has to render
 * the school. That is what `fallback` is for.
 *
 * Both stores live in `kev_offline_db`, separate from the notebook's
 * `kev_xr_notebook_db` (`src/xr/utils/indexedDBStorage.ts`) so clearing one never
 * clears the other. IndexedDB is unavailable in some private-browsing modes and
 * during prerender, so every accessor degrades to a no-op or an in-memory copy
 * rather than throwing: offline support must not become a reason the app crashes
 * online.
 */

const DB_NAME = 'kev_offline_db';
const DB_VERSION = 1;
const STORE_CACHE = 'api_cache';
const STORE_OUTBOX = 'outbox';

/** Default staleness bound for a cached copy served without a network. */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export interface OutboxRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface CachedFetchOptions<T> {
  /** How old a cached copy may be and still be served when offline. */
  ttlMs?: number;
  /** Bundled last resort, used when there is no network and no usable cache. */
  fallback?: T;
  /** Extra request headers — typically `xrAuthHeaders()`. */
  headers?: Record<string, string>;
}

interface CacheRecord<T> {
  url: string;
  data: T;
  at: number;
}

// Stands in for IndexedDB when it is unavailable, so a session can still queue
// and cache within the page's lifetime instead of failing outright.
const memoryCache = new Map<string, CacheRecord<unknown>>();
const memoryOutbox: OutboxRequest[] = [];
let idbAvailable: boolean | null = null;

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (idbAvailable === false) {
      resolve(null);
      return;
    }
    if (typeof window === 'undefined' || !window.indexedDB) {
      idbAvailable = false;
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          // Out-of-line auto-increment keys: `getAll` then returns records in
          // insertion order, which is exactly the replay order the queue needs.
          db.createObjectStore(STORE_OUTBOX, { autoIncrement: true });
        }
      };
      request.onsuccess = () => {
        idbAvailable = true;
        resolve(request.result);
      };
      request.onerror = () => {
        idbAvailable = false;
        resolve(null);
      };
      request.onblocked = () => resolve(null);
    } catch {
      idbAvailable = false;
      resolve(null);
    }
  });
}

function asPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// NetworkFirst JSON cache
// ---------------------------------------------------------------------------

async function readCache<T>(url: string): Promise<CacheRecord<T> | null> {
  const db = await openDb();
  if (!db) return (memoryCache.get(url) as CacheRecord<T>) ?? null;
  try {
    const tx = db.transaction(STORE_CACHE, 'readonly');
    const record = await asPromise(tx.objectStore(STORE_CACHE).get(url) as IDBRequest<CacheRecord<T> | undefined>);
    return record ?? null;
  } catch {
    return (memoryCache.get(url) as CacheRecord<T>) ?? null;
  }
}

async function writeCache<T>(url: string, data: T): Promise<void> {
  const record: CacheRecord<T> = { url, data, at: Date.now() };
  memoryCache.set(url, record as CacheRecord<unknown>);
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_CACHE, 'readwrite');
    tx.objectStore(STORE_CACHE).put(record);
  } catch {
    /* the in-memory copy above is enough for this session */
  }
}

/**
 * Fetch JSON network-first, caching every success.
 *
 * Order of resolution:
 *   1. live response — also written to the cache for the next offline visit;
 *   2. a cached copy no older than `ttlMs`;
 *   3. the bundled `fallback`;
 *   4. otherwise the original error is rethrown, so callers can distinguish
 *      "offline with data" from "offline with nothing" instead of silently
 *      rendering an empty screen.
 *
 * A cached copy older than `ttlMs` is skipped rather than served: stale campus
 * data is still useful, but a months-old study pack is worse than the bundled
 * one, which at least matches the shipped build.
 */
export async function cachedFetch<T>(url: string, options: CachedFetchOptions<T> = {}): Promise<T> {
  const { ttlMs = DEFAULT_TTL_MS, fallback, headers } = options;

  try {
    const response = await fetch(url, { headers: headers ?? {} });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const data = (await response.json()) as T;
    await writeCache(url, data);
    return data;
  } catch (err) {
    const cached = await readCache<T>(url);
    if (cached && Date.now() - cached.at <= ttlMs) return cached.data;
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Chat outbox
// ---------------------------------------------------------------------------

/**
 * Queue a request for replay when connectivity returns. Used by the campus chat
 * sidebar when its REST fallback fails, so a message composed offline is not
 * lost — the UI marks it "(queued — will send when back online)".
 */
export async function queueOutbox(request: OutboxRequest): Promise<void> {
  memoryOutbox.push(request);
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    tx.objectStore(STORE_OUTBOX).add(request);
  } catch {
    /* kept in memory for this session */
  }
}

/** Number of requests waiting to replay. Drives the chat header's badge. */
export async function outboxCount(): Promise<number> {
  const db = await openDb();
  if (!db) return memoryOutbox.length;
  try {
    const tx = db.transaction(STORE_OUTBOX, 'readonly');
    return await asPromise(tx.objectStore(STORE_OUTBOX).count());
  } catch {
    return memoryOutbox.length;
  }
}

async function readOutbox(): Promise<Array<{ key: IDBValidKey; request: OutboxRequest }>> {
  const db = await openDb();
  if (!db) return memoryOutbox.map((request, key) => ({ key, request }));
  try {
    const tx = db.transaction(STORE_OUTBOX, 'readonly');
    const store = tx.objectStore(STORE_OUTBOX);
    const [keys, values] = await Promise.all([
      asPromise(store.getAllKeys()),
      asPromise(store.getAll() as IDBRequest<OutboxRequest[]>),
    ]);
    return keys.map((key, i) => ({ key, request: values[i] }));
  } catch {
    return memoryOutbox.map((request, key) => ({ key, request }));
  }
}

async function deleteOutboxEntry(key: IDBValidKey): Promise<void> {
  const index = typeof key === 'number' ? key : -1;
  if (index >= 0 && index < memoryOutbox.length) memoryOutbox.splice(index, 1);
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    tx.objectStore(STORE_OUTBOX).delete(key);
  } catch {
    /* nothing else to do — it will be retried on the next reconnect */
  }
}

/**
 * Replay queued requests in insertion order.
 *
 * Stops at the first failure and leaves that entry queued: a chat transcript is
 * ordered, so delivering message 5 after message 3 failed would silently
 * reorder the conversation. Returns how many were sent and how many remain, so
 * the caller can update its badge without a second round trip.
 */
export async function flushOutbox(): Promise<{ sent: number; remaining: number }> {
  const entries = await readOutbox();
  let sent = 0;

  for (const { key, request } of entries) {
    if (!request?.url) {
      await deleteOutboxEntry(key);
      continue;
    }
    try {
      const response = await fetch(request.url, {
        method: request.method || 'POST',
        headers: request.headers ?? {},
        body: request.body,
      });
      if (!response.ok) break;
      await deleteOutboxEntry(key);
      sent++;
    } catch {
      break;
    }
  }

  return { sent, remaining: await outboxCount() };
}

// ---------------------------------------------------------------------------
// Reconnect notification
// ---------------------------------------------------------------------------

/**
 * Run `fn` whenever the browser regains connectivity.
 *
 * Deliberately does *not* flush the outbox itself: the campus chat sidebar wants
 * to flush and then refresh its transcript, while the campus map only needs to
 * re-fetch floors. Auto-flushing here would double-send for the former. Callers
 * that want a replay call `flushOutbox()` from inside their own callback.
 *
 * Returns an unsubscribe function, which is why call sites can hand it straight
 * to `useEffect` as a cleanup. A callback that throws (or rejects) is contained:
 * one failing refresh must not stop the others or leave the listener detached.
 */
export function onReconnect(fn: () => void | Promise<void>): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    try {
      const result = fn();
      if (result && typeof result.then === 'function') result.catch(() => {});
    } catch {
      /* a failed refresh must not break the listener for everyone else */
    }
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
