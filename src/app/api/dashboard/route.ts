import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getOverview,
  getScoreTrend,
  getTopicBreakdown,
  getTopicWeakAreas,
  getReadinessScore,
  getWeeklyComparison,
  getDailyChallenge,
} from '@/features/dashboard/server/progress-service';
import { getRecommendations } from '@/features/dashboard/server/recommendation-service';
import { getCodingChallengesStats } from '@/features/coding-challenges/server/get-coding-challenges-stats';
import type { DashboardData } from '@/features/dashboard/dashboard-types';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [overview, trend, topics, weakAreas, recommendations, readiness, weeklyComparison, dailyChallenge, codingStats] =
    await Promise.all([
      getOverview(user.id),
      getScoreTrend(user.id, 30),
      getTopicBreakdown(user.id),
      user.isPro ? getTopicWeakAreas(user.id) : Promise.resolve([]),
      getRecommendations(user.id, user.level),
      getReadinessScore(user.id),
      getWeeklyComparison(user.id),
      getDailyChallenge(user.id),
      getCodingChallengesStats(user.id),
    ]);

  const data: DashboardData = {
    overview,
    trend,
    topics,
    weakAreas,
    recommendations,
    isPro: user.isPro,
    userName: user.name,
    targetInterviewDate: user.targetInterviewDate?.toISOString() ?? null,
    readiness,
    weeklyComparison,
    dailyChallenge,
    codingStats,
  };

  return NextResponse.json(data);
}
