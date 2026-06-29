-- Daily practice loop: spaced repetition (ReviewItem) + streak/goal fields on User.

-- Per-(user, topic) spaced-repetition state. Advanced by every scored answer.
CREATE TABLE IF NOT EXISTS "ReviewItem" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "topic"          TEXT NOT NULL,
    "easeFactor"     DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays"   INTEGER NOT NULL DEFAULT 0,
    "repetitions"    INTEGER NOT NULL DEFAULT 0,
    "dueAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastScore"      DOUBLE PRECISION,
    "lastDifficulty" "Difficulty",
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReviewItem_userId_topic_key" ON "ReviewItem"("userId", "topic");
CREATE INDEX IF NOT EXISTS "ReviewItem_userId_dueAt_idx" ON "ReviewItem"("userId", "dueAt");

-- FK to User (guard against re-run since ADD CONSTRAINT has no IF NOT EXISTS).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReviewItem_userId_fkey'
    ) THEN
        ALTER TABLE "ReviewItem"
            ADD CONSTRAINT "ReviewItem_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Streak + daily-goal bookkeeping on User.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyGoal"      INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentStreak"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longestStreak"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveDate" TIMESTAMP(3);
