/**
 * SM-2 spaced repetition algorithm.
 *
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-super-memo-method
 *
 * Quality scale used here:
 *   5 = perfect recall
 *   4 = correct after slight hesitation   ← used as default when user marks "studied"
 *   3 = correct but difficult
 *   2 = incorrect; easy to recall (near miss)
 *   1 = incorrect; hard to recall
 *   0 = total blackout
 *
 * For the study plan we don't ask users to rate quality — we default to 4 (good)
 * the first time they mark a question studied. On subsequent reviews they get a
 * chance to rate; until we add that UI the default of 4 continues to apply.
 */

export interface Sm2Input {
  repetitions: number;
  interval: number;    // days
  easeFactor: number;  // >= 1.3, typically starts at 2.5
}

export interface Sm2Output {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewAt: Date;
}

/** Default SM-2 state for a card that has never been reviewed. */
export const SM2_DEFAULTS: Sm2Input = {
  repetitions: 0,
  interval: 1,
  easeFactor: 2.5,
};

/**
 * Run one SM-2 iteration.
 *
 * @param current - Current SM-2 state (pass null / SM2_DEFAULTS for a new card).
 * @param quality - Response quality 0–5 (default 4).
 * @returns Updated state including the next review date.
 */
export function applySmTwoReview(
  current: Sm2Input | null,
  quality = 4,
): Sm2Output {
  let { repetitions, interval, easeFactor } = current ?? SM2_DEFAULTS;

  if (quality >= 3) {
    // Correct response — advance the schedule.
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    easeFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (easeFactor < 1.3) easeFactor = 1.3;
    repetitions += 1;
  } else {
    // Incorrect — restart from day 1, keep easeFactor.
    repetitions = 0;
    interval = 1;
  }

  const nextReviewAt = startOfDay(daysFromNow(interval));

  return { repetitions, interval, easeFactor, nextReviewAt };
}

/** True if the given date is today or in the past (review is due). */
export function isReviewDue(nextReviewAt: Date | null | undefined): boolean {
  if (!nextReviewAt) return false;
  return nextReviewAt <= startOfDay(new Date());
}

// ─── helpers ────────────────────────────────────────────────────────────────

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
