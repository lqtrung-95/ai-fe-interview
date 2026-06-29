'use client';

import { useState, useTransition } from 'react';
import { Target } from 'lucide-react';
import { updateDailyGoalAction } from '../server/update-daily-goal-action';

const GOAL_OPTIONS = [3, 5, 10] as const;

interface Props {
  initialGoal: number;
}

export function DailyGoalCard({ initialGoal }: Props) {
  const [goal, setGoal] = useState(initialGoal);
  const [isPending, startTransition] = useTransition();

  function select(next: number) {
    if (next === goal) return;
    const prev = goal;
    setGoal(next); // optimistic
    startTransition(async () => {
      try {
        await updateDailyGoalAction(next);
      } catch {
        setGoal(prev); // revert on failure
      }
    });
  }

  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-bold">Daily review goal</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How many topics you aim to review each day to keep your streak alive.
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-border bg-background p-1" role="group" aria-label="Daily review goal">
        {GOAL_OPTIONS.map((n) => {
          const active = n === goal;
          return (
            <button
              key={n}
              type="button"
              onClick={() => select(n)}
              disabled={isPending}
              aria-pressed={active}
              className={
                'h-8 min-w-14 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-60 ' +
                (active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground')
              }
            >
              {n}/day
            </button>
          );
        })}
      </div>
    </section>
  );
}
