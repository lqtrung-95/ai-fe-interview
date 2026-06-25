'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DashboardPageSkeleton } from '@/components/ui/dashboard-page-skeleton';
import { useDashboardQuery } from '../hooks/use-dashboard-query';
import { InterviewCountdownBanner } from './interview-countdown-banner';
import { OverviewCards } from './overview-cards';
import { WeakAreasList } from './weak-areas-list';
import { RecommendedPractice } from './recommended-practice';
import { DashboardEmptyState } from './dashboard-empty-state';
import { ReadinessScoreCard } from './readiness-score-card';
import { WeeklyProgressCard } from './weekly-progress-card';
import { CodingChallengesStatCard } from './coding-challenges-stat-card';

// recharts (~120KB gz) is loaded only when these charts render — keeps it out of
// the dashboard's initial JS. Skeleton holds the layout while the chunk loads.
function ChartCardSkeleton() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-56 animate-pulse rounded-lg bg-muted/50" />
    </section>
  );
}

const ScoreTrendChart = dynamic(
  () => import('./score-trend-chart').then((m) => m.ScoreTrendChart),
  { ssr: false, loading: () => <ChartCardSkeleton /> },
);
const TopicRadarChart = dynamic(
  () => import('./topic-radar-chart').then((m) => m.TopicRadarChart),
  { ssr: false, loading: () => <ChartCardSkeleton /> },
);

function DashboardContent() {
  const { data } = useDashboardQuery();
  const { overview, trend, topics, weakAreas, recommendations, isPro, userName, targetInterviewDate, readiness, weeklyComparison, codingStats } = data;
  const hasAnyData = overview.totalSessions > 0 || overview.totalQuestionsAnswered > 0;

  return (
    <div className="app-page mx-auto max-w-5xl px-6 py-8">
      {targetInterviewDate && (
        <div className="mb-6">
          <InterviewCountdownBanner targetInterviewDate={targetInterviewDate} />
        </div>
      )}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Overview
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {userName ? `Welcome back, ${userName}.` : 'Your Dashboard'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Next best practice based on your recent performance.
          </p>
        </div>
        <Link href="/practice/new" className={buttonVariants({ className: 'app-primary-button' })}>
          Start practice →
        </Link>
      </header>

      {!hasAnyData ? (
        <DashboardEmptyState />
      ) : (
        <div className="space-y-5">
          <OverviewCards metrics={overview} />
          <WeeklyProgressCard
            thisWeekAvg={weeklyComparison.thisWeekAvg}
            lastWeekAvg={weeklyComparison.lastWeekAvg}
            delta={weeklyComparison.delta}
            sessionsThisWeek={weeklyComparison.sessionsThisWeek}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <ScoreTrendChart data={trend} />
            <TopicRadarChart data={topics} />
          </div>
          <ReadinessScoreCard overall={readiness.overall} topics={readiness.topics} />
          <CodingChallengesStatCard solved={codingStats.solved} total={codingStats.total} />
          <div className="grid gap-5 lg:grid-cols-2">
            {isPro ? (
              <WeakAreasList weakAreas={weakAreas} />
            ) : (
              <section className="app-surface-card flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-8 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Per-dimension weak-area coaching</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    See exactly which topics drag your score down and why.
                  </p>
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

/** Wraps DashboardContent in a Suspense boundary so useSuspenseQuery shows the skeleton on first load. */
export function DashboardClient() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
