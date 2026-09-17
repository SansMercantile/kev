import React, { createContext, useContext, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, CheckCircle2, Trophy, X, Zap, AlertCircle } from 'lucide-react';

export type ToastType = 'badge' | 'score' | 'xp' | 'mission' | 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  badgeName?: string;
  score?: number;
  xp?: number;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  showBadgeToast: (badgeName: string, description?: string) => void;
  showScoreToast: (score: number, maxScore: number, labOrQuizName: string) => void;
  showXPToast: (amount: number, reason: string) => void;
  showMissionToast: (missionTitle: string, xpEarned: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { ...toast, id };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // max 5 concurrent toasts

    // If celebratory (badge or high score or mission), launch confetti
    if (toast.type === 'badge' || toast.type === 'score' || toast.type === 'mission') {
      try {
        confetti({
          particleCount: toast.type === 'badge' ? 60 : 40,
          spread: 70,
          origin: { y: 0.2, x: 0.85 },
          colors: ['#06b6d4', '#3b82f6', '#f59e0b', '#10b981', '#a855f7'],
        });
      } catch (e) {
        // Safe fail
      }
    }

    const duration = toast.durationMs || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showBadgeToast = useCallback((badgeName: string, description?: string) => {
    showToast({
      type: 'badge',
      title: '🎖️ New Badge Unlocked!',
      message: description || `You've earned the prestigious "${badgeName}" badge in KEV Science Academy!`,
      badgeName,
      durationMs: 5500,
    });
  }, [showToast]);

  const showScoreToast = useCallback((score: number, maxScore: number, labOrQuizName: string) => {
    const percentage = Math.round((score / maxScore) * 100);
    const isHighScore = percentage >= 80;
    showToast({
      type: 'score',
      title: isHighScore ? '🏆 Outstanding High Score!' : 'Assessment Completed',
      message: `Scored ${score}/${maxScore} (${percentage}%) on "${labOrQuizName}". Excellent scientific precision!`,
      score,
      durationMs: 5000,
    });
  }, [showToast]);

  const showXPToast = useCallback((amount: number, reason: string) => {
    showToast({
      type: 'xp',
      title: `+${amount} XP Earned!`,
      message: reason,
      xp: amount,
      durationMs: 4000,
    });
  }, [showToast]);

  const showMissionToast = useCallback((missionTitle: string, xpEarned: number) => {
    showToast({
      type: 'mission',
      title: '⚡ Daily Mission Completed!',
      message: `"${missionTitle}" accomplished! +${xpEarned} XP claimed for your student record.`,
      xp: xpEarned,
      durationMs: 5000,
    });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showBadgeToast,
        showScoreToast,
        showXPToast,
        showMissionToast,
      }}
    >
      {children}

      {/* Floating Celebratory Toast Stack */}
      <div
        id="toast-notification-container"
        className="fixed top-18 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-4 ${
              toast.type === 'badge'
                ? 'bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-slate-950/95 border-amber-500/50 shadow-amber-500/20'
                : toast.type === 'score' || toast.type === 'success'
                ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-950/95 border-emerald-500/50 shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-gradient-to-r from-rose-950/90 via-slate-900/95 to-slate-950/95 border-rose-500/50 shadow-rose-500/20'
                : toast.type === 'mission'
                ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-slate-950/95 border-cyan-500/50 shadow-cyan-500/20'
                : toast.type === 'xp'
                ? 'bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-slate-950/95 border-indigo-500/50 shadow-indigo-500/20'
                : 'bg-slate-900/95 border-slate-700 shadow-slate-900/50'
            }`}
          >
            {/* Left Icon */}
            <div
              className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                toast.type === 'badge'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : toast.type === 'score' || toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : toast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : toast.type === 'mission'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : toast.type === 'xp'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {toast.type === 'badge' ? (
                <Award className="w-5 h-5 text-amber-400" />
              ) : toast.type === 'score' || toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : toast.type === 'mission' ? (
                <Zap className="w-5 h-5 text-cyan-400" />
              ) : toast.type === 'xp' ? (
                <Sparkles className="w-5 h-5 text-indigo-300" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-slate-300" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="text-xs font-bold text-white tracking-wide">{toast.title}</h4>
                {toast.xp && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    +{toast.xp} XP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-snug">{toast.message}</p>
              {toast.badgeName && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300 font-semibold">
                  <Award className="w-3 h-3" />
                  {toast.badgeName}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
              title="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
