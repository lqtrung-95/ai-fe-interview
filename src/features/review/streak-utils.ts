/**
 * Streak date math (pure — no DB, unit-testable). Days are compared in UTC;
 * an "active day" is any day the user reviewed at least once.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
}

export function isSameUtcDay(a: Date | null | undefined, b: Date): boolean {
  if (!a) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isYesterdayUtc(a: Date | null | undefined, b: Date): boolean {
  if (!a) return false;
  const yesterday = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate() - 1));
  return isSameUtcDay(a, yesterday);
}

/**
 * Compute the next streak after activity at `now`.
 * - Same UTC day as last activity → unchanged (already counted today).
 * - Day after last activity → +1.
 * - Otherwise (first ever, or a gap) → reset to 1.
 */
export function nextStreak(prev: StreakState, now: Date): { currentStreak: number; longestStreak: number } {
  let current: number;
  if (isSameUtcDay(prev.lastActiveDate, now)) {
    current = prev.currentStreak;
  } else if (isYesterdayUtc(prev.lastActiveDate, now)) {
    current = prev.currentStreak + 1;
  } else {
    current = 1;
  }
  return { currentStreak: current, longestStreak: Math.max(prev.longestStreak, current) };
}

/**
 * Display-time streak: a stored streak is only "alive" if the last activity was
 * today or yesterday — otherwise it has silently lapsed and should read as 0
 * until the next review resets it.
 */
export function effectiveStreak(currentStreak: number, lastActiveDate: Date | null, now: Date): number {
  const alive = isSameUtcDay(lastActiveDate, now) || isYesterdayUtc(lastActiveDate, now);
  return alive ? currentStreak : 0;
}
