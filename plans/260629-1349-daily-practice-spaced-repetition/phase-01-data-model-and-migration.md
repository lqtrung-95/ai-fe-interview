# Phase 01 — Data Model & Migration

**Priority:** P0 (blocks all). **Status:** Not started.

## Overview
Add the `ReviewItem` model (per user × topic spaced-repetition state) and streak/
daily-goal fields on `User`. Raw SQL migration applied via `prisma db execute`
(this project never runs `migrate deploy`; `_prisma_migrations` is intentionally
stale — see global memory on Prisma migration drift).

## Architecture
- One `ReviewItem` per `(userId, topic)`. SM-2-lite fields (`easeFactor`,
  `intervalDays`, `repetitions`, `dueAt`). `lastScore` stores the last answer
  `overallScore` (1–5) for weak-area ordering; `lastDifficulty` informs the
  difficulty when regenerating a question for the topic.
- `User` gains `dailyGoal`, `currentStreak`, `longestStreak`, `lastActiveDate`.

## Related code files
- Modify: `prisma/schema.prisma` (new model + User fields + back-relation).
- Create: `prisma/migrations/20260629140000_add_review_items_and_streaks/migration.sql`.

## Implementation steps
1. Add to `prisma/schema.prisma`:
   ```prisma
   model ReviewItem {
     id             String      @id @default(cuid())
     userId         String
     user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
     topic          String
     easeFactor     Float       @default(2.5)   // 1.3 .. 2.5
     intervalDays   Int         @default(0)
     repetitions    Int         @default(0)
     dueAt          DateTime    @default(now())
     lastScore      Float?                       // last overallScore (1..5)
     lastDifficulty Difficulty?
     lastReviewedAt DateTime?
     createdAt      DateTime    @default(now())
     updatedAt      DateTime    @updatedAt
     @@unique([userId, topic])
     @@index([userId, dueAt])
   }
   ```
2. Add `User` fields: `dailyGoal Int @default(3)`, `currentStreak Int @default(0)`,
   `longestStreak Int @default(0)`, `lastActiveDate DateTime?`, and back-relation
   `reviewItems ReviewItem[]`.
3. Write `migration.sql`: `CREATE TABLE "ReviewItem" (...)`, unique + index,
   `ALTER TABLE "User" ADD COLUMN ...` (4 columns with defaults). FK with
   `ON DELETE CASCADE`.
4. Apply with `prisma db execute --file <migration.sql> --schema prisma/schema.prisma`,
   then `prisma generate`.

## Todo
- [ ] schema.prisma: ReviewItem model
- [ ] schema.prisma: User streak/goal fields + back-relation
- [ ] migration.sql authored
- [ ] applied via `prisma db execute` + `prisma generate`
- [ ] `pnpm tsc --noEmit` clean (Prisma client types regenerated)

## Success criteria
- `ReviewItem` + new `User` columns exist in DB; Prisma client typechecks.

## Risks
- Migration drift: do NOT `migrate deploy`. Apply SQL directly (per project convention).

## Next
- Phase 02 reads/writes `ReviewItem` via the scheduler service.
