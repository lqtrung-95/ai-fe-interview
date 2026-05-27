import { requireUser } from '@/lib/auth/session';
import {
  getDimensionWeakAreas,
  getOverview,
  getScoreTrend,
  getTopicBreakdown,
} from '@/features/dashboard/server/progress-service';
import { getRecommendations } from '@/features/dashboard/server/recommendation-service';
import { OverviewCards } from '@/features/dashboard/components/overview-cards';
import { ScoreTrendChart } from '@/features/dashboard/components/score-trend-chart';
import { TopicRadarChart } from '@/features/dashboard/components/topic-radar-chart';
import { WeakAreasList } from '@/features/dashboard/components/weak-areas-list';
import { RecommendedPractice } from '@/features/dashboard/components/recommended-practice';
import { DashboardEmptyState } from '@/features/dashboard/components/dashboard-empty-state';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();

  const [overview, trend, topics, weakAreas, recommendations] = await Promise.all([
    getOverview(user.id),
    getScoreTrend(user.id, 30),
    getTopicBreakdown(user.id),
    getDimensionWeakAreas(user.id),
    getRecommendations(user.id, user.level),
  ]);

  const hasAnyData =
    overview.totalSessions > 0 ||
    overview.totalQuestionsAnswered > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user.name ? `, ${user.name}` : ''}.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your interview prep at a glance — trends, weak spots, and what to drill next.
        </p>
      </header>

      {!hasAnyData ? (
        <DashboardEmptyState />
      ) : (
        <div className="space-y-6">
          <OverviewCards metrics={overview} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreTrendChart data={trend} />
            <TopicRadarChart data={topics} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <WeakAreasList dimensions={weakAreas} />
            <RecommendedPractice recommendations={recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
