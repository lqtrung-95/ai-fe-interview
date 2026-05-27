import 'server-only';
import { prisma } from '@/lib/db/client';
import type {
  DimensionAverage,
  OverviewMetrics,
  ScoreTrendPoint,
  TopicBreakdownEntry,
} from '../dashboard-types';

const DIMENSION_FIELDS = [
  ['scoreCorrectness', 'correctness', 'Correctness'],
  ['scoreCompleteness', 'completeness', 'Completeness'],
  ['scoreClarity', 'clarity', 'Clarity'],
  ['scoreDepth', 'depth', 'Depth'],
  ['scoreTradeoffThinking', 'tradeoffThinking', 'Trade-off thinking'],
  ['scoreCommunication', 'communication', 'Communication'],
] as const;

export async function getOverview(userId: string): Promise<OverviewMetrics> {
  const [sessionCounts, answerCount, topicAverages, streak] = await Promise.all([
    prisma.interviewSession.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
      _avg: { overallScore: true },
    }),
    prisma.userAnswer.count({ where: { userId } }),
    getTopicBreakdown(userId),
    getCurrentStreakDays(userId),
  ]);

  const totalSessions = sessionCounts.reduce((acc, row) => acc + row._count._all, 0);
  const completed = sessionCounts.find((r) => r.status === 'completed');
  const completedSessions = completed?._count._all ?? 0;
  const averageScore = completed?._avg.overallScore ?? null;
  const bestTopic = topicAverages[0] ?? null;
  const weakestTopic = topicAverages.length > 1 ? topicAverages[topicAverages.length - 1] : null;

  return {
    totalSessions,
    completedSessions,
    totalQuestionsAnswered: answerCount,
    averageScore: averageScore !== null ? Number(averageScore.toFixed(2)) : null,
    bestTopic: bestTopic ? { topic: bestTopic.topic, score: bestTopic.avgScore } : null,
    weakestTopic: weakestTopic ? { topic: weakestTopic.topic, score: weakestTopic.avgScore } : null,
    currentStreakDays: streak,
  };
}

export async function getScoreTrend(userId: string, days = 30): Promise<ScoreTrendPoint[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await prisma.interviewSession.findMany({
    where: { userId, status: 'completed', completedAt: { gte: since }, overallScore: { not: null } },
    select: { completedAt: true, overallScore: true },
  });

  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    if (!r.completedAt || r.overallScore === null) continue;
    const key = r.completedAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += r.overallScore;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([date, { sum, count }]) => ({ date, avgScore: Number((sum / count).toFixed(2)) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function getTopicBreakdown(userId: string): Promise<TopicBreakdownEntry[]> {
  // Join answers → feedback (for score) → question (for topic).
  const rows = await prisma.userAnswer.findMany({
    where: { userId, feedback: { isNot: null } },
    select: {
      question: { select: { topic: true } },
      feedback: { select: { overallScore: true } },
    },
  });

  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    if (!r.feedback) continue;
    const topic = r.question.topic;
    const cur = acc.get(topic) ?? { sum: 0, count: 0 };
    cur.sum += r.feedback.overallScore;
    cur.count += 1;
    acc.set(topic, cur);
  }
  return [...acc.entries()]
    .map(([topic, { sum, count }]) => ({
      topic,
      avgScore: Number((sum / count).toFixed(2)),
      answers: count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

export async function getDimensionWeakAreas(userId: string): Promise<DimensionAverage[]> {
  const rows = await prisma.answerFeedback.findMany({
    where: { answer: { userId } },
    select: {
      scoreCorrectness: true,
      scoreCompleteness: true,
      scoreClarity: true,
      scoreDepth: true,
      scoreTradeoffThinking: true,
      scoreCommunication: true,
    },
  });
  if (rows.length === 0) return [];

  return DIMENSION_FIELDS
    .map(([field, dimension, label]) => {
      const sum = rows.reduce((acc, r) => acc + (r as Record<string, number>)[field], 0);
      return {
        dimension,
        label,
        avgScore: Number((sum / rows.length).toFixed(2)),
      } satisfies DimensionAverage;
    })
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3);
}

async function getCurrentStreakDays(userId: string): Promise<number> {
  const rows = await prisma.interviewSession.findMany({
    where: { userId, status: 'completed', completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
    take: 90,
  });
  if (rows.length === 0) return 0;

  const dayKeys = new Set(
    rows.map((r) => r.completedAt!.toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  // Allow the streak to start "today" OR "yesterday" so a user who hasn't practiced
  // yet today doesn't see their streak zeroed.
  const today = cursor.toISOString().slice(0, 10);
  if (!dayKeys.has(today)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
