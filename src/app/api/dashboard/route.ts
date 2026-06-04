import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getOverview,
  getScoreTrend,
  getTopicBreakdown,
  getTopicWeakAreas,
} from '@/features/dashboard/server/progress-service';
import { getRecommendations } from '@/features/dashboard/server/recommendation-service';
import type { DashboardData } from '@/features/dashboard/dashboard-types';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [overview, trend, topics, weakAreas, recommendations] = await Promise.all([
    getOverview(user.id),
    getScoreTrend(user.id, 30),
    getTopicBreakdown(user.id),
    user.isPro ? getTopicWeakAreas(user.id) : Promise.resolve([]),
    getRecommendations(user.id, user.level),
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
  };

  return NextResponse.json(data);
}
