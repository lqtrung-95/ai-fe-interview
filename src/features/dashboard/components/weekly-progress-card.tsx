'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
  delta: number | null;
  sessionsThisWeek: number;
}

export function WeeklyProgressCard({ thisWeekAvg, lastWeekAvg, delta, sessionsThisWeek }: Props) {
  // Not enough data to show anything useful
  if (thisWeekAvg === null && lastWeekAvg === null) return null;

  const improved = delta !== null && delta > 0.05;
  const declined = delta !== null && delta < -0.05;

  const Icon = improved ? TrendingUp : declined ? TrendingDown : Minus;
  const color = improved
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : declined
    ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    : 'text-muted-foreground bg-muted/40 border-border/40';

  return (
    <section className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${color}`}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-current/10">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">
          {improved && delta !== null
            ? `Up ${delta.toFixed(1)} pts this week`
            : declined && delta !== null
            ? `Down ${Math.abs(delta).toFixed(1)} pts this week`
            : thisWeekAvg !== null
            ? `Avg ${thisWeekAvg.toFixed(1)}/5 this week`
            : 'No sessions yet this week'}
        </p>
        <p className="mt-0.5 text-xs opacity-70">
          {sessionsThisWeek === 0
            ? "Start a session to set this week's baseline"
            : sessionsThisWeek === 1
            ? '1 session this week'
            : `${sessionsThisWeek} sessions this week`}
          {lastWeekAvg !== null && ` · last week avg ${lastWeekAvg.toFixed(1)}/5`}
        </p>
      </div>
    </section>
  );
}
