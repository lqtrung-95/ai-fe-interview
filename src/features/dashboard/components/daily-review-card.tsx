'use client';

import Link from 'next/link';
import { CalendarCheck, Flame } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  dueCount: number;
  reviewedToday: number;
  dailyGoal: number;
  currentStreak: number;
}

export function DailyReviewCard({ dueCount, reviewedToday, dailyGoal, currentStreak }: Props) {
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((reviewedToday / dailyGoal) * 100)) : 0;

  return (
    <section className="app-surface-card rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Daily review</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium">
          <Flame className={currentStreak > 0 ? 'h-3.5 w-3.5 text-orange-500' : 'h-3.5 w-3.5 text-muted-foreground'} />
          {currentStreak > 0 ? `${currentStreak}d` : '0d'}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums leading-none">{dueCount}</span>
        <span className="pb-0.5 text-sm text-muted-foreground">
          {dueCount === 1 ? 'topic due' : 'topics due'}
        </span>
      </div>

      {/* Daily goal progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Today&apos;s goal</span>
          <span className="tabular-nums">
            {reviewedToday}/{dailyGoal}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${goalPct >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${goalPct}%` }}
          />
        </div>
      </div>

      <Link href="/review" className={`mt-4 w-full ${buttonVariants({ variant: dueCount > 0 ? 'default' : 'outline', size: 'sm' })}`}>
        {dueCount > 0 ? 'Start review →' : 'Open review'}
      </Link>
    </section>
  );
}
