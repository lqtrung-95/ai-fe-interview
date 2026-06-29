# Phase 04 — Streak & Daily Goal

**Priority:** P1. **Status:** Not started. **Depends on:** Phase 02.

## Overview
Reward consistency: a daily goal (N reviews/day) and a consecutive-day streak.
Any scored answer counts toward the day (all practice feeds the loop).

## Architecture
- **Daily progress** = count of `ReviewItem` rows with `lastReviewedAt` within the
  user's local "today". (Each scored answer updates exactly one ReviewItem in
  Phase 02, so this is an accurate per-day activity count.)
- **Streak update** runs inside `recordReview` (Phase 02) — after upserting the
  ReviewItem, evaluate the day:
  - Let `today` / `yesterday` be date-only (use a fixed app timezone or store UTC
    date; document the choice — default UTC).
  - If `lastActiveDate == today` → no change.
  - Else if `lastActiveDate == yesterday` → `currentStreak++`.
  - Else → `currentStreak = 1`.
  - Set `lastActiveDate = today`; `longestStreak = max(longestStreak, currentStreak)`.
  - Trigger streak update only once per day (first review of the day), gated by
    `lastActiveDate != today`.
- **Daily goal** stored on `User.dailyGoal` (default 3); editable in Settings (small add).
- Decouple: streak counts an "active day" (≥1 review). Daily goal is a separate
  progress ring (`reviewedToday / dailyGoal`) — meeting it is celebratory, not
  required for the streak. (Simpler + forgiving; revisit if we want goal-gated streaks.)

## Related code files
- Modify: `src/features/review/server/review-scheduler-service.ts` — streak step
  in `recordReview` (or a dedicated `touchStreak(userId)` called from it).
- Create: `src/features/review/streak-utils.ts` — pure date helpers
  (`isSameDay`, `isYesterday`, `nextStreak(prev, lastActiveDate, today)`) + unit tests.
- Modify: `src/features/settings/...` — optional dailyGoal selector (3/5/10).

## Implementation steps
1. `streak-utils.ts` pure functions + unit tests (same-day no-op, consecutive
   increment, gap reset, longest tracking).
2. Call `touchStreak` inside `recordReview` (guarded; once/day).
3. Expose `getStreak(userId)` for the dashboard (currentStreak, longestStreak,
   reviewedToday, dailyGoal).
4. (Optional) Settings control for `dailyGoal`.

## Todo
- [ ] `streak-utils.ts` + unit tests
- [ ] `touchStreak` wired into `recordReview` (once/day)
- [ ] `getStreak` accessor
- [ ] (optional) Settings dailyGoal control
- [ ] `pnpm tsc --noEmit` clean

## Success criteria
- Reviewing on consecutive days increments the streak exactly once/day; a missed
  day resets to 1 on next review; `longestStreak` never decreases. Covered by tests.

## Risks
- Timezone correctness (off-by-one at midnight). Lock to one convention (UTC) and
  unit-test boundaries; revisit per-user TZ later if needed.

## Next
- Phase 05 surfaces streak + due count + goal ring on the dashboard.
