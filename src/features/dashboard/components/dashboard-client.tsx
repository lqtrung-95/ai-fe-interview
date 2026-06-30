'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';
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
import { DailyReviewCard } from './daily-review-card';

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
  const { overview, trend, topics, weakAreas, recommendations, isPro, userName, targetInterviewDate, readiness, weeklyComparison, codingStats, review } = data;
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
          <div className="grid gap-5 lg:grid-cols-2">
            <DailyReviewCard
              dueCount={review.dueCount}
              reviewedToday={review.reviewedToday}
              dailyGoal={review.dailyGoal}
              currentStreak={review.currentStreak}
            />
            <CodingChallengesStatCard solved={codingStats.solved} total={codingStats.total} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {isPro ? (
              <WeakAreasList weakAreas={weakAreas} />
            ) : (
              <WeakAreasLockedPreview topics={recommendations.slice(0, 3).map((r) => r.topic)} />
            )}
            <RecommendedPractice recommendations={recommendations} />
          </div>
          <ReadinessScoreCard overall={readiness.overall} topics={readiness.topics} />
        </div>
      )}
    </div>
  );
}

/** Blurred preview of weak-areas list shown to free users as an upgrade teaser.
 *  Uses the user's real weak topics (from free recommendations) so it matches
 *  the AI Recommendations card. Only the score + root-cause text are blurred. */
function WeakAreasLockedPreview({ topics }: { topics: string[] }) {
  // Fall back to generic placeholders if no recommendation data yet.
  const FALLBACK = ['JavaScript', 'CSS Fundamentals', 'React Patterns'];
  const rows = (topics.length > 0 ? topics : FALLBACK).slice(0, 3);

  return (
    <section className="app-surface-card relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-5">
      {/* Header — identical to WeakAreasList */}
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
          <AlertTriangle className="size-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Weak Areas</h2>
          <p className="text-xs text-muted-foreground">Topics where you score lowest, with what&apos;s missing.</p>
        </div>
      </div>

      {/* Ghost rows — topic name visible, score + gap blurred */}
      <ul className="grid flex-1 auto-rows-fr gap-2 select-none" aria-hidden="true">
        {rows.map((topic) => (
          <li key={topic} className="flex flex-col justify-between rounded-lg border border-border/50 bg-muted/15 px-3.5 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500/80" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  {/* Topic name is real — already visible in AI Recommendations */}
                  <p className="text-sm font-semibold truncate">{topic}</p>
                  {/* Score is Pro-only — blur it */}
                  <p className="shrink-0 select-none blur-sm text-xs font-bold tabular-nums text-red-500">
                    2.x<span className="font-normal text-muted-foreground">/5</span>
                  </p>
                </div>
                {/* Root-cause gap is Pro-only — blur it */}
                <p className="mt-1 select-none blur-sm text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  Specific gap analysis unlocked with Pro.
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted blur-sm">
                  <div className="h-full w-2/5 rounded-full bg-red-500/70" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Gradient overlay + CTA */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-card via-card/90 to-transparent px-5 pb-5 pt-16 text-center">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Lock className="size-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Unlock your weak spots</p>
          <p className="mt-0.5 text-xs text-muted-foreground">See exactly why these topics drag your score down.</p>
        </div>
        <Link href="/upgrade" className={buttonVariants({ size: 'sm' })}>
          Upgrade to Pro
        </Link>
      </div>
    </section>
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
