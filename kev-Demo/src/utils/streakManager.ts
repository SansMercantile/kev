import { DailyStreakData, StreakDayStatus } from '../types';

export const MULTIPLIER_TIERS = [
  { days: 1, multiplier: 1.0, name: 'Spark', color: 'from-amber-400 to-amber-600', text: 'text-amber-400' },
  { days: 3, multiplier: 1.15, name: 'Kindle', color: 'from-orange-400 to-amber-500', text: 'text-orange-400' },
  { days: 7, multiplier: 1.35, name: 'Blaze', color: 'from-orange-500 to-rose-500', text: 'text-rose-400' },
  { days: 14, multiplier: 1.6, name: 'Inferno Flare', color: 'from-rose-500 to-purple-600', text: 'text-purple-400' },
  { days: 30, multiplier: 2.0, name: 'Supernova Peak', color: 'from-purple-500 via-pink-500 to-amber-400', text: 'text-pink-400' },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMultiplierTier(streakDays: number) {
  const tier = MULTIPLIER_TIERS.slice().reverse().find((t) => streakDays >= t.days) || MULTIPLIER_TIERS[0];
  const next = MULTIPLIER_TIERS.find((t) => t.days > streakDays) || null;
  return { currentTier: tier, nextTier: next };
}

export function getDailyStreakData(): DailyStreakData {
  const saved = localStorage.getItem('kev_daily_streak');
  if (saved) {
    try {
      const parsed: DailyStreakData = JSON.parse(saved);
      if (parsed && typeof parsed.currentStreakDays === 'number') {
        // Ensure tiers and multipliers are up-to-date with current streak days
        const { currentTier, nextTier } = getMultiplierTier(parsed.currentStreakDays);
        return {
          ...parsed,
          currentMultiplier: currentTier.multiplier,
          multiplierTierName: currentTier.name,
          nextTierStreakRequired: nextTier ? nextTier.days : 30,
          nextTierMultiplier: nextTier ? nextTier.multiplier : 2.0,
        };
      }
    } catch {
      // fallback
    }
  }

  // Default initial streak profile
  const todayStr = getTodayDateString();
  const days: StreakDayStatus[] = [
    { date: '2026-09-08', dayLabel: 'Mon', dayOfMonth: 8, completed: true, isToday: false, xpEarned: 85 },
    { date: '2026-09-09', dayLabel: 'Tue', dayOfMonth: 9, completed: true, isToday: false, xpEarned: 120 },
    { date: '2026-09-10', dayLabel: 'Wed', dayOfMonth: 10, completed: true, isToday: false, xpEarned: 95 },
    { date: '2026-09-11', dayLabel: 'Thu', dayOfMonth: 11, completed: true, isToday: false, xpEarned: 140 },
    { date: '2026-09-12', dayLabel: 'Fri', dayOfMonth: 12, completed: true, isToday: false, xpEarned: 110 },
    { date: '2026-09-13', dayLabel: 'Sat', dayOfMonth: 13, completed: true, isToday: false, xpEarned: 130 },
    { date: todayStr, dayLabel: 'Today', dayOfMonth: new Date().getDate(), completed: true, isToday: true, xpEarned: 75 },
  ];

  const defaultStreak: DailyStreakData = {
    currentStreakDays: 7,
    longestStreakDays: 14,
    lastCompletedDate: todayStr,
    currentMultiplier: 1.35,
    multiplierTierName: 'Blaze',
    nextTierStreakRequired: 14,
    nextTierMultiplier: 1.6,
    freezeTokensRemaining: 2,
    weekHistory: days,
  };

  try {
    localStorage.setItem('kev_daily_streak', JSON.stringify(defaultStreak));
  } catch {
    // Ignore storage issues
  }

  return defaultStreak;
}

export function saveDailyStreakData(data: DailyStreakData): void {
  try {
    localStorage.setItem('kev_daily_streak', JSON.stringify(data));
  } catch {
    // Ignore storage issues
  }
}

export interface ActivityRecordResult {
  streakData: DailyStreakData;
  isNewDay: boolean;
  streakExtended: boolean;
  multiplier: number;
  message: string;
}

/**
 * Updates streak when student interacts with any virtual lab or classroom.
 */
export function recordDailyActivity(
  activityType: 'lab_interaction' | 'classroom_visit' | 'quiz_passed' | 'hypothesis_logged' | 'tutor_consulted',
  label?: string
): ActivityRecordResult {
  const current = getDailyStreakData();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  let streakExtended = false;
  let isNewDay = false;
  let newStreakDays = current.currentStreakDays;

  if (current.lastCompletedDate === todayStr) {
    // Already active today - maintain streak and update history
    isNewDay = false;
    streakExtended = false;
  } else if (current.lastCompletedDate === yesterdayStr) {
    // Consecutive day! Extend streak
    newStreakDays += 1;
    streakExtended = true;
    isNewDay = true;
  } else if (current.lastCompletedDate && current.lastCompletedDate < yesterdayStr) {
    // Skipped a day or more: if freeze tokens are available, protect streak
    if (current.freezeTokensRemaining > 0) {
      newStreakDays += 1;
      current.freezeTokensRemaining -= 1;
      streakExtended = true;
      isNewDay = true;
    } else {
      newStreakDays = 1;
      streakExtended = false;
      isNewDay = true;
    }
  } else {
    // First time recording
    newStreakDays = 1;
    streakExtended = true;
    isNewDay = true;
  }

  const { currentTier, nextTier } = getMultiplierTier(newStreakDays);

  const updatedHistory = current.weekHistory.map((day) => {
    if (day.date === todayStr) {
      return { ...day, completed: true, isToday: true, xpEarned: (day.xpEarned || 0) + 20 };
    }
    return { ...day, isToday: false };
  });

  const updated: DailyStreakData = {
    ...current,
    currentStreakDays: newStreakDays,
    longestStreakDays: Math.max(current.longestStreakDays, newStreakDays),
    lastCompletedDate: todayStr,
    currentMultiplier: currentTier.multiplier,
    multiplierTierName: currentTier.name,
    nextTierStreakRequired: nextTier ? nextTier.days : 30,
    nextTierMultiplier: nextTier ? nextTier.multiplier : 2.0,
    weekHistory: updatedHistory,
  };

  saveDailyStreakData(updated);

  let message = `Daily streak active: ${updated.currentStreakDays} days (${updated.currentMultiplier}x XP multiplier)!`;
  if (streakExtended) {
    message = `Streak extended to ${updated.currentStreakDays} consecutive days! XP multiplier boosted to ${updated.currentMultiplier}x.`;
  }

  return {
    streakData: updated,
    isNewDay,
    streakExtended,
    multiplier: updated.currentMultiplier,
    message,
  };
}

/**
 * Calculates XP reward taking current streak multiplier into account.
 */
export function applyStreakMultiplier(baseXP: number): {
  multipliedXP: number;
  multiplier: number;
  bonusXP: number;
} {
  const streak = getDailyStreakData();
  const multiplier = streak.currentMultiplier || 1.0;
  const multipliedXP = Math.round(baseXP * multiplier);
  const bonusXP = multipliedXP - baseXP;

  return {
    multipliedXP,
    multiplier,
    bonusXP,
  };
}
