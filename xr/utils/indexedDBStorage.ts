import { LabSnapshot, LabId } from '../types';

export interface DraftNote {
  id: string;
  title: string;
  content: string;
  labId: LabId;
  updatedAt: string;
  isSynced: boolean;
  tags: string[];
}

export interface OfflineObservation {
  id: string;
  text: string;
  labId: LabId;
  timestamp: string;
  measurements?: Record<string, string | number>;
  isSynced: boolean;
}

const DB_NAME = 'kev_xr_notebook_db';
const DB_VERSION = 1;
const STORE_DRAFTS = 'draft_notes';
const STORE_OBSERVATIONS = 'offline_observations';
const STORE_SNAPSHOTS = 'snapshots_cache';

let dbInstance: IDBDatabase | null = null;

export async function getNotebookDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_OBSERVATIONS)) {
          db.createObjectStore(STORE_OBSERVATIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        console.warn('IndexedDB unavailable, falling back to local storage.');
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB initialization failed:', e);
      resolve(null);
    }
  });
}

// Save draft note with IndexedDB and localStorage mirror
export async function saveDraftNote(note: DraftNote): Promise<void> {
  const db = await getNotebookDB();
  if (db) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      store.put(note);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Also mirror to localStorage for instantaneous fallback access
  try {
    const existingRaw = localStorage.getItem('kev_draft_notes_cache');
    const existing: DraftNote[] = existingRaw ? JSON.parse(existingRaw) : [];
    const index = existing.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      existing[index] = note;
    } else {
      existing.unshift(note);
    }
    localStorage.setItem('kev_draft_notes_cache', JSON.stringify(existing));
  } catch (e) {
    console.error('LocalStorage draft save error:', e);
  }
}

export async function getAllDraftNotes(): Promise<DraftNote[]> {
  const db = await getNotebookDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(getLocalDraftNotesFallback());
    });
  }
  return getLocalDraftNotesFallback();
}

function getLocalDraftNotesFallback(): DraftNote[] {
  try {
    const raw = localStorage.getItem('kev_draft_notes_cache');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteDraftNote(id: string): Promise<void> {
  const db = await getNotebookDB();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  try {
    const existing = getLocalDraftNotesFallback().filter((n) => n.id !== id);
    localStorage.setItem('kev_draft_notes_cache', JSON.stringify(existing));
  } catch {
    // ignore
  }
}

// Offline observations queue
export async function queueOfflineObservation(obs: OfflineObservation): Promise<void> {
  const db = await getNotebookDB();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_OBSERVATIONS, 'readwrite');
      const store = tx.objectStore(STORE_OBSERVATIONS);
      store.put(obs);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  try {
    const raw = localStorage.getItem('kev_offline_observations');
    const existing: OfflineObservation[] = raw ? JSON.parse(raw) : [];
    existing.unshift(obs);
    localStorage.setItem('kev_offline_observations', JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export async function getPendingOfflineObservations(): Promise<OfflineObservation[]> {
  const db = await getNotebookDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_OBSERVATIONS, 'readonly');
      const store = tx.objectStore(STORE_OBSERVATIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: OfflineObservation[] = req.result || [];
        resolve(results.filter((o) => !o.isSynced));
      };
      req.onerror = () => {
        const raw = localStorage.getItem('kev_offline_observations');
        const list: OfflineObservation[] = raw ? JSON.parse(raw) : [];
        resolve(list.filter((o) => !o.isSynced));
      };
    });
  }
  const raw = localStorage.getItem('kev_offline_observations');
  const list: OfflineObservation[] = raw ? JSON.parse(raw) : [];
  return list.filter((o) => !o.isSynced);
}

export async function syncOfflineObservations(): Promise<number> {
  const pending = await getPendingOfflineObservations();
  if (pending.length === 0) return 0;

  const db = await getNotebookDB();
  if (db) {
    const tx = db.transaction(STORE_OBSERVATIONS, 'readwrite');
    const store = tx.objectStore(STORE_OBSERVATIONS);
    for (const item of pending) {
      item.isSynced = true;
      store.put(item);
    }
  }

  try {
    const raw = localStorage.getItem('kev_offline_observations');
    if (raw) {
      const list: OfflineObservation[] = JSON.parse(raw);
      const updated = list.map((item) => ({ ...item, isSynced: true }));
      localStorage.setItem('kev_offline_observations', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  return pending.length;
}
