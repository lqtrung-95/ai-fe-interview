-- AlterTable: add SM-2 spaced repetition fields to StudyPlanProgress
ALTER TABLE "StudyPlanProgress"
  ADD COLUMN "repetitions"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "interval"     INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "easeFactor"   DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  ADD COLUMN "nextReviewAt" TIMESTAMP(3);

-- Index to efficiently query reviews due for a given plan
CREATE INDEX "StudyPlanProgress_planId_nextReviewAt_idx"
  ON "StudyPlanProgress"("planId", "nextReviewAt");
