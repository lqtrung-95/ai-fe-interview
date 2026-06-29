import 'server-only';
import { prisma } from '@/lib/db/client';
import { effectiveStreak } from '../streak-utils';

export interface DueTopic {
  topic: string;
  lastDifficulty: 'junior' | 'mid' | 'senior' | null;
  lastScore: number | null;
  dueAt: Date;
}

/** Topics due for review, most-overdue and weakest first. */
export async function getDueTopics(userId: string, limit = 3): Promise<DueTopic[]> {
  const rows = await prisma.reviewItem.findMany({
    where: { userId, dueAt: { lte: new Date() } },
    orderBy: [{ dueAt: 'asc' }, { lastScore: 'asc' }],
    take: limit,
    select: { topic: true, lastDifficulty: true, lastScore: true, dueAt: true },
  });
  return rows.map((r) => ({
    topic: r.topic,
    lastDifficulty: r.lastDifficulty,
    lastScore: r.lastScore,
    dueAt: r.dueAt,
  }));
}

/** Counts for the dashboard card: how many topics are due, and how many reviewed today. */
export async function getReviewStats(
  userId: string,
  now: Date = new Date(),
): Promise<{ dueCount: number; reviewedToday: number }> {
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [dueCount, reviewedToday] = await Promise.all([
    prisma.reviewItem.count({ where: { userId, dueAt: { lte: now } } }),
    prisma.reviewItem.count({ where: { userId, lastReviewedAt: { gte: startOfToday } } }),
  ]);
  return { dueCount, reviewedToday };
}

/** Streak + daily goal for display. Streak reads as 0 if it has silently lapsed. */
export async function getStreak(
  userId: string,
  now: Date = new Date(),
): Promise<{ currentStreak: number; longestStreak: number; dailyGoal: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, dailyGoal: true, lastActiveDate: true },
  });
  if (!user) return { currentStreak: 0, longestStreak: 0, dailyGoal: 3 };
  return {
    currentStreak: effectiveStreak(user.currentStreak, user.lastActiveDate, now),
    longestStreak: user.longestStreak,
    dailyGoal: user.dailyGoal,
  };
}
