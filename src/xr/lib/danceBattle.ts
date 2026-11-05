/**
 * Dance Battle client — real-time Motion Gym multiplayer over WebSocket.
 *
 * Joins a cohort-scoped battle room (`battle-<cohort>-<n>`) on the backend's
 * `/xr/ws/dance-battle` channel (see constellation `xr_dance.py`). The server
 * is the referee: it broadcasts the shared beat schedule (deterministic per
 * room), collects each player's hits, keeps the live leaderboard, and calls
 * the round. Pose evaluation stays on-device (the pose engine); only scored
 * hit events cross the wire — never a video frame.
 *
 * Follows the CampusChatSidebar WS pattern (xrWsUrl + JSON message protocol +
 * graceful reconnect). If the socket can't be reached (offline), the caller
 * falls back to solo play — the battle is an online-only layer over Motion
 * Gym's on-device pose game.
 */

import { xrWsUrl } from './xrApi';

export interface BattlePlayer {
  name: string;
  score: number;
  combo: number;
  bestCombo: number;
  hits: number;
}

export interface BattleState {
  type: string;
  roomId: string;
  beatIndex: number;
  target: string;
  sequence: string[];
  rounds: number;
  beatMs: number;
  leaderboard: BattlePlayer[];
  finished: boolean;
}

export interface BattleResult {
  type: 'result';
  roomId: string;
  winner: BattlePlayer | null;
  leaderboard: BattlePlayer[];
}

export interface DanceBattleHandle {
  sendHit(beatIndex: number): void;
  sendMiss(): void;
  advance(): void;
  leave(): void;
  close(): void;
  readonly connected: boolean;
}

export interface DanceBattleCallbacks {
  onJoined?: (roomId: string, you: string) => void;
  onState?: (state: BattleState) => void;
  onBeat?: (state: BattleState) => void;
  onResult?: (result: BattleResult) => void;
  onError?: (detail: string) => void;
  onClose?: () => void;
}

/**
 * Connect to a dance-battle room. `cohort` is the player's age band (junior /
 * middle / senior / adult) — rooms are cohort-scoped server-side, so a child
 * only ever dances their own band. `roomNumber` distinguishes parallel rooms
 * in the same band (default 1).
 */
export function joinDanceBattle(
  opts: { cohort: string; roomNumber?: number; name: string },
  cb: DanceBattleCallbacks
): DanceBattleHandle {
  const roomId = `battle-${opts.cohort}-${opts.roomNumber ?? 1}`;
  const ws = new WebSocket(xrWsUrl('/ws/dance-battle'));
  let open = false;

  ws.onopen = () => {
    open = true;
    ws.send(JSON.stringify({ type: 'join', roomId, user: { name: opts.name, cohort: opts.cohort } }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'joined') cb.onJoined?.(data.roomId, data.you);
      else if (data.type === 'state') cb.onState?.(data);
      else if (data.type === 'beat') cb.onBeat?.(data);
      else if (data.type === 'result') cb.onResult?.(data);
      else if (data.type === 'error') cb.onError?.(data.detail || 'Battle error');
    } catch { /* ignore malformed frames */ }
  };

  ws.onclose = () => {
    open = false;
    cb.onClose?.();
  };

  ws.onerror = () => {
    cb.onError?.('Could not reach the dance-battle server (offline?).');
  };

  return {
    sendHit(beatIndex) {
      if (open) ws.send(JSON.stringify({ type: 'hit', beatIndex }));
    },
    sendMiss() {
      if (open) ws.send(JSON.stringify({ type: 'miss' }));
    },
    advance() {
      if (open) ws.send(JSON.stringify({ type: 'advance' }));
    },
    leave() {
      if (open) ws.send(JSON.stringify({ type: 'leave' }));
    },
    close() {
      try { ws.close(); } catch { /* already closed */ }
    },
    get connected() {
      return open;
    },
  };
}
