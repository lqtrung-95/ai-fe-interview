import 'server-only';
import { prisma } from '@/lib/db/client';
import { getTopicBreakdown } from './progress-service';
import type { RecommendedTopic } from '../dashboard-types';
import type { Level } from '@prisma/client';

/**
 * MVP rule: prefer recommendedTopics from the user's most recent completed
 * SessionSummary. If none exists yet, fall back to the user's 3 weakest topics
 * (lowest avg overallScore from feedback). Difficulty defaults to the user's level.
 */
type FeedbackScores = {
  scoreCompleteness: number;
  scoreDepth: number;
  scoreTradeoffThinking: number;
  scoreCorrectness: number;
  scoreClarity: number;
};

const DIMENSION_LABELS: Record<keyof FeedbackScores, string> = {
  scoreCompleteness:     'completeness',
  scoreDepth:            'depth',
  scoreTradeoffThinking: 'trade-off thinking',
  scoreCorrectness:      'technical accuracy',
  scoreClarity:          'clarity',
};

/** Returns the human-readable label for the lowest-scoring dimension. */
function getWeakestDimension(feedback: FeedbackScores[]): string | null {
  const sums: Record<keyof FeedbackScores, number> = {
    scoreCompleteness: 0, scoreDepth: 0, scoreTradeoffThinking: 0,
    scoreCorrectness: 0, scoreClarity: 0,
  };
  for (const f of feedback) {
    for (const key of Object.keys(sums) as (keyof FeedbackScores)[]) {
      sums[key] += f[key];
    }
  }
  let weakest: keyof FeedbackScores = 'scoreCompleteness';
  for (const key of Object.keys(sums) as (keyof FeedbackScores)[]) {
    if (sums[key] < sums[weakest]) weakest = key;
  }
  return DIMENSION_LABELS[weakest] ?? null;
}

export async function getRecommendations(
  userId: string,
  userLevel: Level
): Promise<RecommendedTopic[]> {
  const latestSummary = await prisma.sessionSummary.findFirst({
    where: { session: { userId } },
    orderBy: { createdAt: 'desc' },
    select: { recommendedTopics: true },
  });

  if (latestSummary && latestSummary.recommendedTopics.length > 0) {
    // Pull weak-dimension labels from recent feedback for more specific reasons
    const recentFeedback = await prisma.answerFeedback.findMany({
      where: { answer: { userId } },
      orderBy: { answer: { createdAt: 'desc' } },
      take: 20,
      select: {
        scoreCompleteness: true,
        scoreDepth: true,
        scoreTradeoffThinking: true,
        scoreCorrectness: true,
        scoreClarity: true,
      },
    });

    const weakDimension = recentFeedback.length > 0 ? getWeakestDimension(recentFeedback) : null;

    return latestSummary.recommendedTopics.slice(0, 3).map((topic, i) => ({
      topic,
      reason: i === 0 && weakDimension
        ? `Your recent answers show room to improve on ${weakDimension} — this topic is the best place to practise it.`
        : 'Flagged in your most recent session as an area to revisit.',
      difficulty: userLevel,
    }));
  }

  const breakdown = await getTopicBreakdown(userId);
  if (breakdown.length === 0) return [];

  return breakdown
    .slice(-3)
    .reverse()
    .map((entry) => ({
      topic: entry.topic,
      reason: `Avg score ${entry.avgScore.toFixed(1)}/5 across ${entry.answers} answer${entry.answers === 1 ? '' : 's'} — your lowest in this topic.`,
      difficulty: userLevel,
    }));
}
