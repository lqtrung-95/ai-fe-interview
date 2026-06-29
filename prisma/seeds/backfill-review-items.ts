/**
 * One-off backfill: seed ReviewItem rows from existing users' answered questions
 * so the spaced-repetition queue isn't empty on launch. For each (user, topic)
 * with at least one scored answer, schedules from the most recent score using the
 * same SM-2-lite math as the live scheduler. Idempotent — skips topics that
 * already have a ReviewItem. Run: pnpm seed:backfill-reviews
 *
 * Requires the ReviewItem table (migration add_review_items_and_streaks).
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { applySm2, INITIAL_SM2_STATE } from '../../src/features/review/sm2';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();

  // Latest scored answer per (user, topic). Pull answers newest-first, then keep
  // the first seen per (userId, topic).
  const answers = await prisma.userAnswer.findMany({
    where: { feedback: { isNot: null } },
    orderBy: { createdAt: 'desc' },
    select: {
      userId: true,
      createdAt: true,
      question: { select: { topic: true, difficulty: true } },
      feedback: { select: { overallScore: true } },
    },
  });

  const latestPerTopic = new Map<string, (typeof answers)[number]>();
  for (const a of answers) {
    const key = `${a.userId}::${a.question.topic}`;
    if (!latestPerTopic.has(key)) latestPerTopic.set(key, a);
  }

  let created = 0;
  let skipped = 0;
  for (const a of latestPerTopic.values()) {
    const { userId } = a;
    const { topic, difficulty } = a.question;
    const score = a.feedback!.overallScore;

    const existing = await prisma.reviewItem.findUnique({
      where: { userId_topic: { userId, topic } },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const next = applySm2(INITIAL_SM2_STATE, score, now);
    await prisma.reviewItem.create({
      data: {
        userId,
        topic,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        lastScore: score,
        lastDifficulty: difficulty,
        lastReviewedAt: a.createdAt,
      },
    });
    created++;
  }

  console.log(`[backfill-review-items] created ${created}, skipped ${skipped} existing`);
}

main()
  .catch((e) => {
    console.error('[backfill-review-items] failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
