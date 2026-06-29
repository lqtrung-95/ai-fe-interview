import 'server-only';
import { prisma } from '@/lib/db/client';
import { applySm2, INITIAL_SM2_STATE } from '../sm2';
import { nextStreak, isSameUtcDay } from '../streak-utils';

/**
 * Advances the spaced-repetition schedule for the topic of a just-scored answer,
 * then ticks the user's streak. Called from persistFeedback so EVERY scored
 * answer (live or mock-batch) feeds the loop. Fully guarded — a failure here
 * must never break feedback delivery.
 */
export async function recordReview(answerId: string): Promise<void> {
  try {
    const answer = await prisma.userAnswer.findUnique({
      where: { id: answerId },
      select: {
        userId: true,
        question: { select: { topic: true, difficulty: true } },
        feedback: { select: { overallScore: true } },
      },
    });
    if (!answer?.feedback) return; // no score yet → nothing to schedule

    const { userId } = answer;
    const { topic, difficulty } = answer.question;
    const score = answer.feedback.overallScore;
    const now = new Date();

    const existing = await prisma.reviewItem.findUnique({
      where: { userId_topic: { userId, topic } },
      select: { easeFactor: true, intervalDays: true, repetitions: true },
    });
    const next = applySm2(existing ?? INITIAL_SM2_STATE, score, now);

    const scheduled = {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      lastScore: score,
      lastDifficulty: difficulty,
      lastReviewedAt: now,
    };

    await prisma.reviewItem.upsert({
      where: { userId_topic: { userId, topic } },
      create: { userId, topic, ...scheduled },
      update: scheduled,
    });

    await touchStreak(userId, now);
  } catch (err) {
    console.error('[review-scheduler] recordReview failed:', err instanceof Error ? err.message : err);
  }
}

/**
 * Increments the user's streak once per UTC day on their first review of the day.
 * No-op when they've already been active today.
 */
async function touchStreak(userId: string, now: Date): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });
  if (!user) return;
  if (isSameUtcDay(user.lastActiveDate, now)) return; // already counted today

  const { currentStreak, longestStreak } = nextStreak(
    {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
    },
    now,
  );

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak, longestStreak, lastActiveDate: now },
  });
}
