import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Cloud, HardDrive, Zap } from 'lucide-react';
import { getPendingOfflineObservations } from '../../utils/indexedDBStorage';
import { libApi } from '../../lib/xrApi';

type ConnectionState = 'synced' | 'checking' | 'offline';

export const ConnectivityIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionState>(navigator.onLine ? 'synced' : 'offline');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [pendingNotesCount, setPendingNotesCount] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ping backend /api/health to verify actual reachability
  const checkBackendSync = async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      setLatencyMs(null);
      return;
    }

    setStatus('checking');
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(libApi('/health'), {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(elapsed);
        setStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setStatus('offline');
        setLatencyMs(null);
      }
    } catch {
      setStatus('offline');
      setLatencyMs(null);
    }

    try {
      const pending = await getPendingOfflineObservations();
      setPendingNotesCount(pending.length);
    } catch {
      // IndexedDB fallback
    }
  };

  useEffect(() => {
    checkBackendSync();

    const handleOnline = () => {
      checkBackendSync();
    };

    const handleOffline = () => {
      setStatus('offline');
      setLatencyMs(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat every 30 seconds
    const interval = setInterval(checkBackendSync, 30000);

    // Close popover when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Interactive Status Pill Button */}
      <button
        id="connectivity-indicator-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border cursor-pointer ${
          status === 'synced'
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60 hover:border-emerald-500/50'
            : status === 'checking'
            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-950/60 hover:border-amber-500/50'
            : 'bg-rose-950/50 text-rose-300 border-rose-500/40 hover:bg-rose-950/70 hover:border-rose-500/60 animate-pulse'
        }`}
        title={`Backend status: ${
          status === 'synced'
            ? `Connected to KEV Backend (${latencyMs !== null ? `${latencyMs}ms` : 'online'})`
            : status === 'checking'
            ? 'Syncing with KEV Backend...'
            : 'Offline: Local IndexedDB storage active'
        }. Click for details.`}
      >
        {/* Pulsing Status Dot */}
        <span className="relative flex h-2 w-2">
          {status === 'synced' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          {status === 'checking' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === 'synced'
                ? 'bg-emerald-400'
                : status === 'checking'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
          />
        </span>

        {/* Status Label & Icon */}
        <span className="hidden sm:inline font-mono">
          {status === 'synced' ? 'Synced' : status === 'checking' ? 'Syncing...' : 'Offline'}
        </span>

        {status === 'synced' && latencyMs !== null && (
          <span className="hidden lg:inline text-[10px] text-emerald-400/80 font-mono">
            {latencyMs}ms
          </span>
        )}

        {status === 'offline' && <WifiOff className="w-3 h-3 text-rose-400" />}
      </button>

      {/* Connectivity Telemetry Popover */}
      {isMenuOpen && (
        <div
          id="connectivity-details-popover"
          className="absolute top-full right-0 mt-2 w-72 p-3.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cloud
                className={`w-4 h-4 ${
                  status === 'synced'
                    ? 'text-emerald-400'
                    : status === 'checking'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              />
              <span className="font-semibold text-white">KEV Backend Sync</span>
            </div>
            <button
              onClick={() => checkBackendSync()}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Ping Backend Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Status Row */}
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  status === 'synced'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : status === 'checking'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {status === 'synced' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Synced & Active
                  </>
                ) : status === 'checking' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Offline Mode
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Round-trip Ping</span>
              <span className="font-mono text-slate-200">
                {latencyMs !== null ? `${latencyMs} ms` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Verified</span>
              <span className="font-mono text-slate-300">
                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Offline Queue</span>
              <span className="font-mono text-slate-300 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                {pendingNotesCount} queued items
              </span>
            </div>
          </div>

          {/* Informational Guidance */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            {status === 'synced' ? (
              <p className="flex items-start gap-1.5 text-emerald-400/90">
                <Zap className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                <span>Simulations and lab notes are synced live with the KEV Academic Cloud.</span>
              </p>
            ) : (
              <p className="flex items-start gap-1.5 text-amber-300/90">
                <HardDrive className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>Offline fallback engaged: All data is saved safely in browser IndexedDB.</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
