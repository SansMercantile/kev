/**
 * Student progress sync — durable XP / badges across devices.
 *
 * Today `studentStats` (xp, badges, lab/quiz counts, equipment) lives only in
 * browser localStorage, so it vanishes on a new device or a storage clear.
 * This module mirrors it to the backend's `/xr/progress/*` endpoints (see
 * constellation `xr_progress.py`), which persist a compact record to the
 * shared disk cache with last-writer-wins version resolution.
 *
 * The flow is deliberately offline-tolerant (matches the app's whole offline
 * story):
 *   • On sign-in, fetch the server record and merge it over local (the server
 *     is the durable copy; local is the fast cache + offline buffer).
 *   • On every stats change, write it back (debounced). The write carries a
 *     monotonic `version`; a stale version from an older device is rejected
 *     with the truth, and the client re-syncs rather than clobbering.
 *   • Offline: localStorage keeps working exactly as before; the next online
 *     write re-syncs. Progress never blocks the app on a network call.
 *
 * Privacy: the server stores only the game-economy numbers (xp, badges,
 * counts, equipment ids) and a version — no names, photos or lesson content.
 */

import { xrApi, xrAuthHeaders } from './xrApi';

export interface ProgressRecord {
  studentId: string;
  xp: number;
  badges: string[];
  completedLabsCount: number;
  quizzesPassedCount: number;
  unlockedEquipmentIds: string[];
  equippedToolId: string | null;
  version: number;
  updatedAt: number | null;
}

async function fetchProgress(studentId: string): Promise<ProgressRecord | null> {
  try {
    const res = await fetch(xrApi(`/progress/${encodeURIComponent(studentId)}`), {
      headers: xrAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.progress ?? null;
  } catch {
    return null; // offline or backend down — local keeps working
  }
}

async function pushProgress(record: Omit<ProgressRecord, 'updatedAt'>): Promise<{ record: ProgressRecord | null; conflict: boolean }> {
  try {
    const res = await fetch(xrApi('/progress/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
      body: JSON.stringify(record),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return { record: null, conflict: false };
    return { record: data.progress ?? null, conflict: Boolean(data.conflict) };
  } catch {
    return { record: null, conflict: false };
  }
}

/**
 * Fetch + merge the server progress over local stats. Returns the merged
 * stats and the server version (for the next write's conflict resolution).
 * Local is the fallback when the server has nothing or is unreachable.
 */
export async function pullStudentProgress<T extends { id?: string; xp: number; badges: string[]; completedLabsCount: number; quizzesPassedCount: number }>(
  studentId: string,
  local: T
): Promise<{ stats: T; version: number }> {
  const remote = await fetchProgress(studentId);
  if (!remote || remote.xp === 0 && remote.badges.length === 0 && remote.version === 0) {
    return { stats: local, version: 0 };
  }
  // Merge: server wins on xp (durable), badges union, counts take the max.
  const merged = {
    ...local,
    xp: Math.max(local.xp, remote.xp),
    badges: Array.from(new Set([...local.badges, ...remote.badges])),
    completedLabsCount: Math.max(local.completedLabsCount, remote.completedLabsCount),
    quizzesPassedCount: Math.max(local.quizzesPassedCount, remote.quizzesPassedCount),
    unlockedEquipmentIds: Array.from(new Set([...(local as any).unlockedEquipmentIds ?? [], ...remote.unlockedEquipmentIds])),
    equippedToolId: (local as any).equippedToolId ?? remote.equippedToolId,
  } as T;
  return { stats: merged, version: remote.version };
}

/**
 * Write the current stats back to the server. Debounce upstream; this pushes
 * one record with the next version. On conflict, returns the server's truth
 * so the caller can re-sync instead of clobbering.
 */
export async function pushStudentProgress<T extends { id?: string; xp: number; badges: string[]; completedLabsCount: number; quizzesPassedCount: number }>(
  stats: T & { id: string },
  version: number
): Promise<{ version: number; conflict: boolean; truth?: ProgressRecord }> {
  const { record, conflict } = await pushProgress({
    studentId: stats.id,
    xp: stats.xp,
    badges: stats.badges,
    completedLabsCount: stats.completedLabsCount,
    quizzesPassedCount: stats.quizzesPassedCount,
    unlockedEquipmentIds: (stats as any).unlockedEquipmentIds ?? [],
    equippedToolId: (stats as any).equippedToolId ?? null,
    version,
  });
  if (conflict && record) {
    return { version: record.version, conflict: true, truth: record };
  }
  return { version: record?.version ?? version + 1, conflict: false };
}
