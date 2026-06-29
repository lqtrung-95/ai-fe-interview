/**
 * SM-2-lite spaced-repetition scheduling (pure — no DB, unit-testable).
 *
 * The answer's overallScore (1..5) is treated directly as the SM-2 quality `q`.
 * A low score (lapse) resets the interval to 1 day; higher scores push the next
 * due date further out, scaled by an ease factor that drifts with performance.
 */

export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  dueAt: Date;
}

const MIN_EASE = 1.3;
const MAX_EASE = 2.5;
const DEFAULT_EASE = 2.5;
const LAPSE_THRESHOLD = 3; // quality < 3 → lapse (re-learn tomorrow)
const DAY_MS = 24 * 60 * 60 * 1000;

export const INITIAL_SM2_STATE: Sm2State = {
  easeFactor: DEFAULT_EASE,
  intervalDays: 0,
  repetitions: 0,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Advance the schedule given the previous state and the latest score (1..5).
 * `now` is injectable for deterministic tests.
 */
export function applySm2(prev: Sm2State, score: number, now: Date = new Date()): Sm2Result {
  const q = clamp(score, 0, 5);
  let { easeFactor, intervalDays, repetitions } = prev;

  if (q < LAPSE_THRESHOLD) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  // Standard SM-2 ease adjustment, clamped.
  easeFactor = clamp(
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    MIN_EASE,
    MAX_EASE,
  );

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}
