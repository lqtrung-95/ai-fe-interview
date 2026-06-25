import 'server-only';
import { cache } from 'react';
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
  ['correctness', 'correctness', 'Correctness'],
  ['completeness', 'completeness', 'Completeness'],
  ['clarity', 'clarity', 'Clarity'],
  ['depth', 'depth', 'Depth'],
  ['tradeoffThinking', 'tradeoffThinking', 'Trade-off thinking'],
  ['communication', 'communication', 'Communication'],
] as const;

/**
 * Single source of truth for "answered questions with AI feedback". The
 * dashboard derives topic breakdown, readiness, weak areas, and dimension
 * averages from this one dataset instead of issuing ~4 near-identical queries.
 * `cache()` dedupes concurrent calls within a request; `unstable_cache` persists
 * across requests (60s, busted by the dashboard tag).
 */
type AnswerWithFeedback = {
  createdAt: Date;
  topic: string;
  overallScore: number;
  whatWasMissing: string[];
  dims: Record<(typeof DIMENSION_FIELDS)[number][1], number>;
};

const getAnswersWithFeedback = cache(
  (userId: string): Promise<AnswerWithFeedback[]> =>
    unstable_cache(
      async () => {
        const rows = await prisma.userAnswer.findMany({
          where: { userId, feedback: { isNot: null } },
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            question: { select: { topic: true } },
            feedback: {
              select: {
                overallScore: true,
                whatWasMissing: true,
                scoreCorrectness: true,
                scoreCompleteness: true,
                scoreClarity: true,
                scoreDepth: true,
                scoreTradeoffThinking: true,
                scoreCommunication: true,
              },
            },
          },
        });
        return rows.map((r) => ({
          createdAt: r.createdAt,
          topic: r.question.topic,
          overallScore: r.feedback!.overallScore,
          whatWasMissing: r.feedback!.whatWasMissing,
          dims: {
            correctness: r.feedback!.scoreCorrectness,
            completeness: r.feedback!.scoreCompleteness,
            clarity: r.feedback!.scoreClarity,
            depth: r.feedback!.scoreDepth,
            tradeoffThinking: r.feedback!.scoreTradeoffThinking,
            communication: r.feedback!.scoreCommunication,
          },
        }));
      },
      ['dashboard-answers-with-feedback', userId],
      { revalidate: 60, tags: [dashboardCacheTag(userId)] },
    )(),
);

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
  const rows = await getAnswersWithFeedback(userId);
  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = acc.get(r.topic) ?? { sum: 0, count: 0 };
    cur.sum += r.overallScore;
    cur.count += 1;
    acc.set(r.topic, cur);
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
      const rows = await getAnswersWithFeedback(userId);
      if (rows.length === 0) return [];

      return DIMENSION_FIELDS
        .map(([key, dimension, label]) => {
          const sum = rows.reduce((acc, r) => acc + r.dims[key], 0);
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
      // Most recent 60 answers (the shared dataset is already ordered desc).
      const rows = (await getAnswersWithFeedback(userId)).slice(0, 60);

      // Group by topic: accumulate scores and keep the most recent whatWasMissing
      const topicMap = new Map<string, { sum: number; count: number; recentGap: string | null }>();
      for (const row of rows) {
        const topic = row.topic;
        const existing = topicMap.get(topic) ?? { sum: 0, count: 0, recentGap: null };
        existing.sum += row.overallScore;
        existing.count += 1;
        // Keep the gap from the most recent answer (rows are ordered desc)
        if (!existing.recentGap && row.whatWasMissing.length > 0) {
          existing.recentGap = row.whatWasMissing[0];
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

// Hands-on coding readiness: distinct challenges solved counts toward "ready".
// Fixed targets (not total available) so readiness stays stable as challenges
// are added — a user's score shouldn't drop when new content ships.
const CODING_SOLVE_TARGET = 8; // distinct function challenges for full readiness
const COMPONENT_SOLVE_TARGET = 6; // distinct component (build) challenges

/**
 * Computes a 0-100 readiness score per dimension and an overall score.
 * Topic dimensions: (avgScore/5)*100, confidence-gated by answer count.
 * Hands-on dimensions: distinct challenges solved vs a fixed target.
 */
export function getReadinessScore(userId: string) {
  return unstable_cache(
    async () => {
      const [rows, codingRows] = await Promise.all([
        getAnswersWithFeedback(userId),
        prisma.codingSubmission.findMany({
          where: { userId, status: 'passed' },
          select: { challengeId: true, challenge: { select: { kind: true } } },
        }),
      ]);

      const topicMap = new Map<string, { sum: number; count: number }>();
      for (const r of rows) {
        const t = r.topic;
        const cur = topicMap.get(t) ?? { sum: 0, count: 0 };
        cur.sum += r.overallScore;
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

      // Distinct solved challenges per kind.
      const fnSolved = new Set<string>();
      const compSolved = new Set<string>();
      for (const r of codingRows) {
        if (r.challenge.kind === 'component') compSolved.add(r.challengeId);
        else fnSolved.add(r.challengeId);
      }
      const codingDimensions: TopicReadiness[] = [
        {
          topic: 'Coding challenges',
          readiness: Math.round(Math.min(1, fnSolved.size / CODING_SOLVE_TARGET) * 100),
          avgScore: null,
          answers: fnSolved.size,
        },
        {
          topic: 'Component & a11y builds',
          readiness: Math.round(Math.min(1, compSolved.size / COMPONENT_SOLVE_TARGET) * 100),
          avgScore: null,
          answers: compSolved.size,
        },
      ];

      const allDimensions = [...topics, ...codingDimensions];
      const overall = Math.round(
        allDimensions.reduce((s, t) => s + t.readiness, 0) / allDimensions.length,
      );

      return { topics: allDimensions, overall };
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
