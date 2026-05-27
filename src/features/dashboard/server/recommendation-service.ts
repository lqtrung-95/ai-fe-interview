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
    return latestSummary.recommendedTopics.slice(0, 3).map((topic) => ({
      topic,
      reason: 'From your most recent session summary.',
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
      reason: `Lowest average so far (${entry.avgScore.toFixed(1)} / 5).`,
      difficulty: userLevel,
    }));
}
