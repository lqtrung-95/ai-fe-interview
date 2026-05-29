import type { PlanStats } from '../server/study-plan-scheduler';

interface Props {
  stats: PlanStats;
  level: string;
  prepWeeks: number;
  reviewsDue?: number;
}

const PREP_LABEL: Record<number, string> = { 1: '1 week', 2: '2 weeks', 4: '1 month', 12: '3 months' };

export function StudyPlanProgressHeader({ stats, level, prepWeeks, reviewsDue = 0 }: Props) {
  const { currentDayIndex, totalDays, questionsStudied, totalQuestions, percentComplete, questionsOverdue } = stats;
  const dayDisplay = Math.min(currentDayIndex + 1, totalDays);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 space-y-4">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {level} · {PREP_LABEL[prepWeeks] ?? `${prepWeeks}w`}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            Day {dayDisplay}
            <span className="text-base font-normal text-muted-foreground"> / {totalDays}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{percentComplete}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {questionsStudied} / {totalQuestions} studied
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-3">
        {questionsOverdue > 0 && (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            ⚠ {questionsOverdue} question{questionsOverdue > 1 ? 's' : ''} from previous days not yet studied
          </p>
        )}
        {reviewsDue > 0 && (
          <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
            🔁 {reviewsDue} spaced-repetition review{reviewsDue > 1 ? 's' : ''} due today
          </p>
        )}
      </div>
    </div>
  );
}
