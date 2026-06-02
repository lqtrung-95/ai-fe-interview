import Link from 'next/link';
import { Lock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import {
  getTopicWeakAreas,
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
    user.isPro ? getTopicWeakAreas(user.id) : Promise.resolve([]),
    getRecommendations(user.id, user.level),
  ]);

  const hasAnyData =
    overview.totalSessions > 0 ||
    overview.totalQuestionsAnswered > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Overview
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {user.name ? `Welcome back, ${user.name}.` : 'Your Dashboard'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Next best practice based on your recent performance.
          </p>
        </div>
        <Link href="/practice/new" className={buttonVariants()}>
          Start practice →
        </Link>
      </header>

      {!hasAnyData ? (
        <DashboardEmptyState />
      ) : (
        <div className="space-y-5">
          <OverviewCards metrics={overview} />
          <div className="grid gap-5 lg:grid-cols-2">
            <ScoreTrendChart data={trend} />
            <TopicRadarChart data={topics} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {user.isPro ? (
              <WeakAreasList weakAreas={weakAreas} />
            ) : (
              <section className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-8 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Per-dimension weak-area coaching</p>
                  <p className="mt-1 text-xs text-muted-foreground">See exactly which topics drag your score down and why.</p>
                </div>
                <Link href="/upgrade" className={buttonVariants({ size: 'sm' })}>
                  Upgrade to Pro
                </Link>
              </section>
            )}
            <RecommendedPractice recommendations={recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
