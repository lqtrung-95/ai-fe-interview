---
phase: 4
title: "Spaced Repetition Study Plan"
status: pending
priority: P2
effort: "4h"
dependencies: []
---

# Phase 4: Spaced Repetition Study Plan

## Overview

Replace the current static "overdue" logic (questions are simply marked studied or not) with
the SM-2 spaced repetition algorithm. Each `StudyPlanProgress` row gains three new fields:
`nextReviewAt`, `interval` (days), and `easeFactor`. When a user marks a question as studied,
SM-2 computes the next review date. The study plan surfaces questions whose `nextReviewAt` is
≤ today — i.e. genuinely due for review, not just "previously studied".

## Requirements

- Functional:
  - Marking a question studied schedules it for review after `interval` days
  - First study: interval = 1 day (review tomorrow)
  - Second study: interval = 6 days
  - Subsequent studies: `interval = round(interval × easeFactor)`, easeFactor starts at 2.5
  - "Mark as studied" is now a quality rating 0–5 (or simplified: thumbs-up = 4, thumbs-down = 2)
    — **OR** keep it a single toggle for now (simpler UX: first toggle = quality 4, un-toggle resets)
  - Study plan page shows: questions due today, upcoming (next 7 days), and new (never studied)
  - "Overdue" count = questions where `nextReviewAt < today`
- Non-functional:
  - SM-2 runs server-side in `toggleStudiedAction` — no client-side scheduling logic
  - DB migration adds 3 nullable columns (backward-compatible; existing rows get defaults on update)
  - `unstable_cache` for study plan is busted after toggle (already implemented via `studyPlanKeys`)

## SM-2 Algorithm

```
function sm2(quality: 0–5, n: number, interval: number, ef: number):
  if quality < 3:
    n = 0
    interval = 1
  else:
    if n === 0: interval = 1
    elif n === 1: interval = 6
    else: interval = round(interval × ef)
    n += 1
  ef = ef + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
  ef = max(1.3, ef)        // floor
  nextReviewAt = today + interval days
  return { n, interval, ef, nextReviewAt }
```

For single-button UX (no quality rating): treat "mark as studied" as quality=4, "unmark" resets
to `n=0, interval=1, ef=2.5, nextReviewAt=null`.

## Architecture

```
Client: MarkStudiedButton  →  toggleStudiedAction(seedQuestionId)
                                        ↓
Server action: sm2(quality=4, existing row fields)
                                        ↓
upsert StudyPlanProgress { nextReviewAt, interval, easeFactor }
                                        ↓
Study plan page query: WHERE nextReviewAt <= today  (due)
                              nextReviewAt IS NULL    (new)
                              nextReviewAt > today    (upcoming)
```

## Related Code Files

- Modify: `prisma/schema.prisma` — add 3 fields to `StudyPlanProgress`
- Create: `prisma/migrations/…` — via `prisma migrate dev`
- Create: `src/features/study-plan/lib/sm2.ts` — pure SM-2 function
- Modify: `src/features/study-plan/actions/study-plan-actions.ts` — call SM-2 in `toggleStudiedAction`
- Modify: `src/features/study-plan/server/study-plan-service.ts` — add due/upcoming/new query
- Modify: `src/app/(app)/study-plan/page.tsx` — render due / upcoming / new sections
- Modify: `src/app/api/study-plan/progress/route.ts` — return `nextReviewAt` alongside `studiedIds`

## Implementation Steps

1. **Prisma migration — add SM-2 fields to `StudyPlanProgress`**

   Add to `model StudyPlanProgress`:
   ```prisma
   interval     Int      @default(1)          // days until next review
   easeFactor   Decimal  @default(2.5) @db.Decimal(4,2)
   repetitions  Int      @default(0)          // SM-2 n counter
   nextReviewAt DateTime?                      // null = never studied / reset
   ```
   Run:
   ```bash
   pnpm prisma migrate dev --name add-sm2-fields-to-study-plan-progress
   ```

2. **Create `src/features/study-plan/lib/sm2.ts`**
   ```ts
   export interface SM2State {
     repetitions: number;
     interval: number;       // days
     easeFactor: number;
   }

   export interface SM2Result extends SM2State {
     nextReviewAt: Date;
   }

   /**
    * Pure SM-2 implementation.
    * quality: 0–5  (4 = "recalled with effort", 5 = "perfect")
    */
   export function sm2(quality: 0 | 1 | 2 | 3 | 4 | 5, state: SM2State): SM2Result {
     let { repetitions, interval, easeFactor } = state;

     if (quality < 3) {
       repetitions = 0;
       interval = 1;
     } else {
       if (repetitions === 0) interval = 1;
       else if (repetitions === 1) interval = 6;
       else interval = Math.round(interval * easeFactor);
       repetitions += 1;
     }

     easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
     easeFactor = Math.max(1.3, easeFactor);

     const nextReviewAt = new Date();
     nextReviewAt.setUTCHours(0, 0, 0, 0);
     nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + interval);

     return { repetitions, interval, easeFactor, nextReviewAt };
   }
   ```

3. **Update `toggleStudiedAction` in `study-plan-actions.ts`**
   ```ts
   import { sm2 } from '../lib/sm2';

   // Inside toggleStudiedAction:
   const existing = await prisma.studyPlanProgress.findUnique({
     where: { planId_seedQuestionId: { planId: plan.id, seedQuestionId } },
   });

   if (existing) {
     // Un-toggle: reset SM-2 state
     await prisma.studyPlanProgress.update({
       where: { id: existing.id },
       data: { repetitions: 0, interval: 1, easeFactor: 2.5, nextReviewAt: null },
     });
   } else {
     // First study: schedule with quality 4
     const result = sm2(4, { repetitions: 0, interval: 1, easeFactor: 2.5 });
     await prisma.studyPlanProgress.create({
       data: {
         planId: plan.id,
         userId,
         seedQuestionId,
         interval: result.interval,
         easeFactor: result.easeFactor,
         repetitions: result.repetitions,
         nextReviewAt: result.nextReviewAt,
       },
     });
   }
   ```
   > If the question is already studied (re-marking after review), fetch the existing SM-2 state
   > and call `sm2(4, existing)` rather than resetting. The current single-toggle UX maps to:
   > - First tap (not studied → studied): `sm2(4, defaults)`
   > - Untap (studied → not studied): reset all fields

   Simpler approach for now: **un-toggle always resets**. Adding a "I remembered it" / "I forgot" 
   quality rating is a future enhancement.

4. **Update `getStudyPlanStatus` in `study-plan-service.ts`**
   Add a helper to split questions into due / upcoming / new buckets:
   ```ts
   export async function getStudyPlanBuckets(userId: string) {
     const today = new Date();
     today.setUTCHours(0, 0, 0, 0);

     const progress = await prisma.studyPlanProgress.findMany({
       where: { userId },
       select: { seedQuestionId: true, nextReviewAt: true },
     });

     const studiedMap = new Map(progress.map((p) => [p.seedQuestionId, p.nextReviewAt]));

     // Return sets of IDs
     const due: string[] = [];
     const upcoming: string[] = [];
     const studied: string[] = [];

     for (const [id, reviewAt] of studiedMap) {
       if (!reviewAt) continue;
       if (reviewAt <= today) due.push(id);
       else upcoming.push(id);
       studied.push(id);
     }

     return { dueIds: due, upcomingIds: upcoming, studiedIds: studied };
   }
   ```

5. **Update `/api/study-plan/progress` route**
   Return `dueIds` and `upcomingCount` so the client can surface review badges:
   ```ts
   const { dueIds, studiedIds } = await getStudyPlanBuckets(user.id);
   return NextResponse.json({ hasPlan: true, studiedIds, dueIds });
   ```

6. **Update study plan page UI**
   Replace the flat "Catch up — N overdue" heading with:
   - **Due for review** (dueIds.length > 0): amber heading, questions highlighted with a
     "Review now" badge
   - **New questions**: questions with no `StudyPlanProgress` row
   - **Upcoming** (optional): collapsible section showing questions due in next 7 days

   The `study-plan-day-schedule.tsx` can add a `isDue` prop to each question card:
   ```tsx
   {isDue && (
     <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
       Review
     </span>
   )}
   ```

7. **TypeScript check + migration verify**
   ```bash
   pnpm tsc --noEmit
   pnpm prisma migrate status
   ```

## Success Criteria

- [ ] Migration adds `interval`, `easeFactor`, `repetitions`, `nextReviewAt` to `StudyPlanProgress`
- [ ] Marking a question studied sets `nextReviewAt = today + 1` on first study
- [ ] Marking again after review extends interval (1 → 6 → rounded(6×2.5)=15 …)
- [ ] Unmarking resets all SM-2 fields to defaults
- [ ] Study plan page shows "Review" badge on questions due today
- [ ] `/api/study-plan/progress` returns `dueIds` array
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm prisma migrate status` shows no pending migrations

## Risk Assessment

- **Decimal precision**: `easeFactor` stored as `Decimal(4,2)` → values like 2.50, 1.30 safe.
  Prisma returns `Decimal` objects; convert to `number` via `.toNumber()` before passing to `sm2()`.
- **Existing `studiedIds` logic**: `getStudyPlanStatus` (used by `MarkStudiedButton` and the
  `/api/study-plan/progress` route) currently returns `studiedIds` as a `Set` from all
  `StudyPlanProgress` rows. This stays correct — any row (regardless of SM-2 state) means the
  question was studied at least once. No regression.
- **TanStack Query cache**: `studyPlanKeys.all()` is already busted in `useSavePlanMutation`
  and `studyPlanKeys.progress()` is busted in `useMarkStudiedMutation.onSettled`. SM-2 data
  flows through the same invalidation path — no extra cache work needed.
