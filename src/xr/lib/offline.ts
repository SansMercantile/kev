// Offline data layer: IndexedDB api_cache (NetworkFirst reads) + outbox
// (queued POSTs flushed on reconnect). Backs the PWA service worker with
// app-level control: TTLs, explicit fallbacks, and visible sync state.

const DB_NAME = 'kev_offline_db';
const DB_VERSION = 1;
const STORE_CACHE = 'api_cache';
const STORE_OUTBOX = 'outbox';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CACHE)) db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
      };
      req.onsuccess = () => {
        dbInstance = req.result;
        resolve(dbInstance);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDB().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const request = run(db.transaction(store, mode).objectStore(store));
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export interface CachedFetchOptions {
  ttlMs?: number;
  fallback?: unknown;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** NetworkFirst JSON fetch with IndexedDB fallback, then static fallback. */
export async function cachedFetch<T>(url: string, options: CachedFetchOptions = {}): Promise<T> {
  const { ttlMs = 24 * 3600 * 1000, fallback, method = 'GET', headers, body } = options;
  if (method === 'GET') {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      void tx(STORE_CACHE, 'readwrite', (s) => s.put({ key: url, data, at: Date.now() }));
      return data;
    } catch {
      const hit = await tx<{ key: string; data: T; at: number }>(STORE_CACHE, 'readonly', (s) => s.get(url));
      if (hit && Date.now() - hit.at < ttlMs) return hit.data;
      if (fallback !== undefined) return fallback as T;
      throw new Error('Offline and no cached copy available.');
    }
  }
  // Non-GET: plain fetch (callers queue to outbox on failure instead).
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface OutboxItem {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  createdAt: number;
  attempts: number;
}

/** Queue a POST for later replay (offline chat sends). */
export async function queueOutbox(item: Omit<OutboxItem, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
  const id = `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await tx(STORE_OUTBOX, 'readwrite', (s) =>
    s.put({ ...item, id, createdAt: Date.now(), attempts: 0 } as OutboxItem)
  );
  return id;
}

export async function outboxCount(): Promise<number> {
  const all = await tx<OutboxItem[]>(STORE_OUTBOX, 'readonly', (s) => s.getAll());
  return all ? all.length : 0;
}

/** Replay queued POSTs in order; returns {sent, remaining}. */
export async function flushOutbox(): Promise<{ sent: number; remaining: number }> {
  const all = (await tx<OutboxItem[]>(STORE_OUTBOX, 'readonly', (s) => s.getAll())) || [];
  all.sort((a, b) => a.createdAt - b.createdAt);
  let sent = 0;
  for (const item of all) {
    try {
      const res = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await tx(STORE_OUTBOX, 'readwrite', (s) => s.delete(item.id));
      sent += 1;
    } catch {
      break; // still offline — keep the rest queued in order
    }
  }
  return { sent, remaining: all.length - sent };
}

/** Run fn immediately when online, and again on every reconnect. */
export function onReconnect(fn: () => void): () => void {
  if (isOnline()) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
  const handler = () => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
