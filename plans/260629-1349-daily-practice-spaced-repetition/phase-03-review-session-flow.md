# Phase 03 — `/review` Session Flow

**Priority:** P1. **Status:** Not started. **Depends on:** Phase 02.

## Overview
A `/review` route that starts a practice session pre-seeded with the user's due
topics. Reuses the entire existing practice/question-stream/feedback pipeline —
no new interview UI, no `SessionMode` change.

## Architecture
- `/review` landing: shows due count + a "Start review" CTA (and an empty state
  "Nothing due — practice anything to build your queue" linking to `/practice/new`).
- Starting a review calls a server action that:
  1. `getDueTopics(userId, N)` (N = `dailyGoal`, min 3).
  2. Creates an `InterviewSession` with `topics = dueTopics`, `mode = 'standard'`,
     `label = 'Daily review'`, difficulty from the weakest due item's `lastDifficulty`.
  3. Redirects to `/practice/[sessionId]` (existing flow runs unchanged).
- Existing `question-stream-service` already round-robins `session.topics` and
  applies adaptive difficulty, so due topics are covered naturally. Each answered
  question flows through `persistFeedback → recordReview` (Phase 02), advancing
  the schedule.

## Related code files
- Create: `src/app/(app)/review/page.tsx` (server component — due list + CTA).
- Create: `src/features/review/server/start-review-action.ts` (`'use server'`).
- Create: `src/features/review/components/review-landing.tsx` (CTA + empty state).
- Reuse: `create-session-action.ts` pattern (or call a thin wrapper); existing
  `/practice/[sessionId]` flow; `question-stream-service.ts` (no change).
- Modify: `src/features/app/app-nav.ts` — add "Review" nav item (with due-count badge later).

## Implementation steps
1. `start-review-action`: guard auth, `getDueTopics`, create session, redirect.
   If nothing due, return a typed "empty" result (UI shows empty state).
2. `/review/page.tsx`: fetch `getReviewStats` + `getDueTopics` preview, render landing.
3. `review-landing.tsx`: "Start review (N due)" button → action; empty state.
4. Add "Review" to `APP_NAV` (icon e.g. `RefreshCw`/`CalendarCheck`).

## Todo
- [ ] `start-review-action` (seed session from due topics)
- [ ] `/review` page + landing component
- [ ] empty state
- [ ] nav entry
- [ ] `pnpm tsc --noEmit` clean

## Success criteria
- With due topics, `/review` → "Start review" creates a session covering those
  topics and lands in the normal practice UI; answers advance the SR schedule.
- With nothing due, a clear empty state is shown (no broken/empty session).

## Risks
- Difficulty selection when `lastDifficulty` is null → fall back to `user.level`.
- Don't double-seed if a topic list is empty — guard before session create.

## Next
- Phase 04 ticks the streak/goal as review answers are scored.
