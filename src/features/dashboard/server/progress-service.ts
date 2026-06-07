import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/client';
import type {
  DimensionAverage,
  OverviewMetrics,
  ScoreTrendPoint,
  TopicBreakdownEntry,
  TopicWeakArea,
} from '../dashboard-types';

/** Cache tag for a user's dashboard data. Call revalidateTag with this after sessions complete. */
export const dashboardCacheTag = (userId: string) => `dashboard-${userId}`;

const DIMENSION_FIELDS = [
  ['scoreCorrectness', 'correctness', 'Correctness'],
  ['scoreCompleteness', 'completeness', 'Completeness'],
  ['scoreClarity', 'clarity', 'Clarity'],
  ['scoreDepth', 'depth', 'Depth'],
  ['scoreTradeoffThinking', 'tradeoffThinking', 'Trade-off thinking'],
  ['scoreCommunication', 'communication', 'Communication'],
] as const;

export function getOverview(userId: string): Promise<OverviewMetrics> {
  return unstable_cache(
    async () => {
      const [sessionCounts, answerCount, topicAverages, streak] = await Promise.all([
        prisma.interviewSession.groupBy({
          by: ['status'],
          where: { userId },
          _count: { _all: true },
          _avg: { overallScore: true },
        }),
        prisma.userAnswer.count({ where: { userId } }),
        getTopicBreakdownRaw(userId),
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
    },
    ['dashboard-overview', userId],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
}

export function getScoreTrend(userId: string, days = 30): Promise<ScoreTrendPoint[]> {
  return unstable_cache(
    async () => {
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
    },
    ['dashboard-score-trend', userId, String(days)],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
}

/** Private helper — called inside getOverview's cache. Not exported as cached. */
async function getTopicBreakdownRaw(userId: string): Promise<TopicBreakdownEntry[]> {
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

export function getTopicBreakdown(userId: string): Promise<TopicBreakdownEntry[]> {
  return unstable_cache(
    () => getTopicBreakdownRaw(userId),
    ['dashboard-topic-breakdown', userId],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
}

export function getDimensionWeakAreas(userId: string): Promise<DimensionAverage[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.answerFeedback.findMany({
        where: { answer: { userId } },
        select: {
          scoreCorrectness: true, scoreCompleteness: true, scoreClarity: true,
          scoreDepth: true, scoreTradeoffThinking: true, scoreCommunication: true,
        },
      });
      if (rows.length === 0) return [];

      return DIMENSION_FIELDS
        .map(([field, dimension, label]) => {
          const sum = rows.reduce((acc, r) => acc + (r as Record<string, number>)[field], 0);
          return { dimension, label, avgScore: Number((sum / rows.length).toFixed(2)) } satisfies DimensionAverage;
        })
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 3);
    },
    ['dashboard-weak-areas', userId],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
}

/**
 * Returns the 3 topics where the user consistently scores lowest, each with
 * the most-recently flagged "what was missing" item from AI feedback.
 * Used to power the "Weak Areas" dashboard panel with specific, actionable gaps.
 */
export function getTopicWeakAreas(userId: string): Promise<TopicWeakArea[]> {
  return unstable_cache(
    async () => {
      // Load recent answers with topic + overallScore + whatWasMissing (most recent first)
      const rows = await prisma.userAnswer.findMany({
        where: { userId, feedback: { isNot: null } },
        orderBy: { createdAt: 'desc' },
        take: 60,
        select: {
          createdAt: true,
          question: { select: { topic: true } },
          feedback: { select: { overallScore: true, whatWasMissing: true } },
        },
      });

      // Group by topic: accumulate scores and keep the most recent whatWasMissing
      const topicMap = new Map<string, { sum: number; count: number; recentGap: string | null }>();
      for (const row of rows) {
        if (!row.feedback) continue;
        const topic = row.question.topic;
        const existing = topicMap.get(topic) ?? { sum: 0, count: 0, recentGap: null };
        existing.sum += row.feedback.overallScore;
        existing.count += 1;
        // Keep the gap from the most recent answer (rows are ordered desc)
        if (!existing.recentGap && row.feedback.whatWasMissing.length > 0) {
          existing.recentGap = row.feedback.whatWasMissing[0];
        }
        topicMap.set(topic, existing);
      }

      return [...topicMap.entries()]
        .map(([topic, { sum, count, recentGap }]) => ({
          topic,
          avgScore: Number((sum / count).toFixed(2)),
          answers: count,
          specificGap: recentGap,
        }))
        .sort((a, b) => a.avgScore - b.avgScore) // weakest first
        .slice(0, 3);
    },
    ['dashboard-topic-weak-areas', userId],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
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

// ── Readiness score ───────────────────────────────────────────────────────────

const STANDARD_TOPICS = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral',
] as const;

export type TopicReadiness = {
  topic: string;
  readiness: number; // 0-100
  avgScore: number | null;
  answers: number;
};

/**
 * Computes a 0-100 readiness score per topic and an overall score.
 * Formula: (avgScore/5)*100, confidence-gated by answer count (needs ≥3 to reach full score).
 */
export function getReadinessScore(userId: string) {
  return unstable_cache(
    async () => {
      const rows = await prisma.userAnswer.findMany({
        where: { userId, feedback: { isNot: null } },
        select: {
          question: { select: { topic: true } },
          feedback: { select: { overallScore: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const topicMap = new Map<string, { sum: number; count: number }>();
      for (const r of rows) {
        if (!r.feedback) continue;
        const t = r.question.topic;
        const cur = topicMap.get(t) ?? { sum: 0, count: 0 };
        cur.sum += r.feedback.overallScore;
        cur.count += 1;
        topicMap.set(t, cur);
      }

      const topics: TopicReadiness[] = STANDARD_TOPICS.map((topic) => {
        const data = topicMap.get(topic);
        if (!data || data.count === 0) return { topic, readiness: 0, avgScore: null, answers: 0 };
        const avgScore = data.sum / data.count;
        // Gate confidence: <3 answers caps readiness at 60; ≥5 is full
        const confidence = Math.min(1, data.count / 5);
        const readiness = Math.round((avgScore / 5) * 100 * confidence);
        return { topic, readiness, avgScore: Number(avgScore.toFixed(2)), answers: data.count };
      });

      const practiced = topics.filter((t) => t.answers > 0);
      const overall =
        practiced.length === 0
          ? 0
          : Math.round(practiced.reduce((s, t) => s + t.readiness, 0) / STANDARD_TOPICS.length);

      return { topics, overall };
    },
    ['dashboard-readiness', userId],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
}

// ── Weekly comparison (before vs now) ────────────────────────────────────────

export type WeeklyComparison = {
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
  delta: number | null; // positive = improved
  sessionsThisWeek: number;
};

export function getWeeklyComparison(userId: string): Promise<WeeklyComparison> {
  return unstable_cache(
    async () => {
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - 6); // last 7 days
      const prevStart = new Date(weekStart);
      prevStart.setUTCDate(weekStart.getUTCDate() - 7); // 7-13 days ago

      const [thisWeek, lastWeek] = await Promise.all([
        prisma.interviewSession.findMany({
          where: { userId, status: 'completed', completedAt: { gte: weekStart }, overallScore: { not: null } },
          select: { overallScore: true },
        }),
        prisma.interviewSession.findMany({
          where: { userId, status: 'completed', completedAt: { gte: prevStart, lt: weekStart }, overallScore: { not: null } },
          select: { overallScore: true },
        }),
      ]);

      const avg = (rows: { overallScore: number | null }[]) => {
        const valid = rows.filter((r) => r.overallScore !== null);
        return valid.length === 0 ? null : valid.reduce((s, r) => s + r.overallScore!, 0) / valid.length;
      };

      const thisWeekAvg = avg(thisWeek);
      const lastWeekAvg = avg(lastWeek);
      const delta =
        thisWeekAvg !== null && lastWeekAvg !== null
          ? Number((thisWeekAvg - lastWeekAvg).toFixed(2))
          : null;

      return { thisWeekAvg: thisWeekAvg ? Number(thisWeekAvg.toFixed(2)) : null, lastWeekAvg: lastWeekAvg ? Number(lastWeekAvg.toFixed(2)) : null, delta, sessionsThisWeek: thisWeek.length };
    },
    ['dashboard-weekly-comparison', userId],
    { revalidate: 60, tags: [dashboardCacheTag(userId)] },
  )();
}

// ── Daily challenge ───────────────────────────────────────────────────────────

export type DailyChallenge = {
  topic: string;
  difficulty: string;
  question: string;
};

export function getDailyChallenge(userId: string): Promise<DailyChallenge | null> {
  return unstable_cache(
    async () => {
      // Deterministic daily seed from UTC day number
      const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

      // Pick from mid+senior conceptual questions the user hasn't answered recently
      const recentlyAnswered = await prisma.userAnswer.findMany({
        where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { question: { select: { seedQuestionId: true } } },
      });
      const recentSeedIds = new Set(
        recentlyAnswered.map((a) => a.question.seedQuestionId).filter(Boolean),
      );

      const candidates = await prisma.seedQuestion.findMany({
        where: {
          difficulty: { in: ['mid', 'senior'] },
          type: { in: ['conceptual', 'tradeoff'] },
          ...(recentSeedIds.size > 0 ? { id: { notIn: [...recentSeedIds] as string[] } } : {}),
        },
        select: { id: true, topic: true, difficulty: true, question: true },
        take: 200,
      });

      if (candidates.length === 0) return null;
      const idx = dayNumber % candidates.length;
      const picked = candidates[idx];
      return { topic: picked.topic, difficulty: picked.difficulty, question: picked.question };
    },
    // Daily challenge changes each UTC day — key includes the day number
    [`dashboard-daily-challenge-${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`, userId],
    { revalidate: 3600, tags: [dashboardCacheTag(userId)] },
  )();
}
