'use client';

import Link from 'next/link';
import { CalendarCheck, Flame, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  dueCount: number;
  reviewedToday: number;
  dailyGoal: number;
  currentStreak: number;
}

export function DailyReviewCard({ dueCount, reviewedToday, dailyGoal, currentStreak }: Props) {
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((reviewedToday / dailyGoal) * 100)) : 0;
  const goalHit = reviewedToday >= dailyGoal && dailyGoal > 0;

  return (
    <section className="app-surface-card flex h-full flex-col rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          </span>
          <h3 className="text-sm font-semibold">Daily review</h3>
        </div>
        {/* Streak badge */}
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          currentStreak > 0
            ? 'bg-orange-500/10 text-orange-400'
            : 'bg-muted/60 text-muted-foreground'
        }`}>
          <Flame className={`h-3 w-3 ${currentStreak > 0 ? 'text-orange-400' : ''}`} />
          {currentStreak > 0 ? `${currentStreak}d streak` : 'No streak yet'}
        </span>
      </div>

      {goalHit ? (
        /* Goal already hit today */
        <div className="flex flex-1 flex-col items-center justify-center py-3 text-center">
          <Sparkles className="mb-2 h-6 w-6 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-400">Goal complete!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You reviewed {reviewedToday} topic{reviewedToday !== 1 ? 's' : ''} today. Come back tomorrow.
          </p>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none">{dueCount}</span>
          <span className="pb-0.5 text-sm text-muted-foreground">
            {dueCount === 1 ? 'topic due' : dueCount === 0 ? 'topics due — keep practicing' : 'topics due'}
          </span>
        </div>
      )}

      {/* Daily goal progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Today&apos;s goal</span>
          <span className="tabular-nums">{reviewedToday}/{dailyGoal}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${goalHit ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${goalPct}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Link
          href="/review"
          className={`w-full ${buttonVariants({ variant: dueCount > 0 ? 'default' : 'outline', size: 'sm' })}`}
        >
          {dueCount > 0 ? `Review ${dueCount} topic${dueCount !== 1 ? 's' : ''} →` : 'Open review'}
        </Link>
      </div>
    </section>
  );
}
