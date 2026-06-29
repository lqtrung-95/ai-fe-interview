# Phase 02 — Review Scheduler Service (SM-2-lite) + Feedback Hook

**Priority:** P0. **Status:** Not started. **Depends on:** Phase 01.

## Overview
A small service owns all spaced-repetition math and queries. Every scored answer
upserts its topic's `ReviewItem` via the single `persistFeedback()` chokepoint.

## Architecture
- **SM-2-lite.** Map answer `overallScore` (1–5 float) → quality `q`.
  - `q < 3` → lapse: `repetitions = 0`, `intervalDays = 1` (due tomorrow).
  - else → `repetitions++`; `intervalDays = rep==1 ? 1 : rep==2 ? 6 : round(prevInterval * easeFactor)`.
  - `easeFactor = clamp(ease + (0.1 - (5-q)*(0.08 + (5-q)*0.02)), 1.3, 2.5)`.
  - `dueAt = now + intervalDays days`; set `lastScore`, `lastDifficulty`, `lastReviewedAt = now`.
- **Topic resolution.** Hook receives `answerId`; resolve `userId` + `topic` +
  `difficulty` via `UserAnswer → InterviewQuestion`. Keeps `persistFeedback`
  signature unchanged (service does its own lookup).
- All writes wrapped in try/catch — SR failure must never break feedback.

## Related code files
- Create: `src/features/review/server/review-scheduler-service.ts`
  - `recordReview(answerId: string): Promise<void>` — resolve topic, upsert ReviewItem.
  - `applySm2(prev, score): { easeFactor, intervalDays, repetitions, dueAt }` (pure, unit-testable).
- Create: `src/features/review/server/review-queue-service.ts`
  - `getDueTopics(userId, limit): Promise<{ topic, lastDifficulty, lastScore, dueAt }[]>`
    — `dueAt <= now`, ordered by `dueAt asc, lastScore asc` (most overdue + weakest first).
  - `getReviewStats(userId): { dueCount, reviewedToday }` for the dashboard card.
- Modify: `src/features/feedback/server/feedback-service.ts` — after
  `persistFeedback(...)` resolves, `await recordReview(answer.id)` in try/catch
  (both the live path and the `generateMissingFeedbackForSession` batch path).

## Implementation steps
1. `applySm2` pure function + unit tests (lapse, first/second rep, ease clamp).
2. `recordReview` — lookup topic/difficulty/userId, `prisma.reviewItem.upsert` on
   `(userId, topic)` using `applySm2`.
3. Wire `recordReview` into both feedback write paths (guarded).
4. `getDueTopics` + `getReviewStats` queries.
5. *(Optional)* backfill script `prisma/seed/backfill-review-items.ts`: for each
   user, group past answers by topic, seed a `ReviewItem` from the latest score.

## Todo
- [ ] `applySm2` + unit tests
- [ ] `recordReview` upsert
- [ ] hook into both feedback paths (guarded)
- [ ] `getDueTopics`, `getReviewStats`
- [ ] (optional) backfill script
- [ ] `pnpm tsc --noEmit` clean

## Success criteria
- Completing a practice answer creates/updates the topic's `ReviewItem` with a
  sensible `dueAt`. Low scores come due sooner than high scores (verified by test).

## Risks
- Score→quality mapping tuning: start with the formula above; revisit after dogfood.
- Topic churn: topics come from a fixed set (session topics), so cardinality is bounded.

## Next
- Phase 03 consumes `getDueTopics`; Phases 04–05 consume `getReviewStats`.
