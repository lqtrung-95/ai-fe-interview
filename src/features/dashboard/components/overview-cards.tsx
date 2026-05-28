import type { OverviewMetrics } from '../dashboard-types';

interface Props {
  metrics: OverviewMetrics;
}

export function OverviewCards({ metrics }: Props) {
  const items = [
    { label: 'Sessions completed', value: String(metrics.completedSessions) },
    {
      label: 'Sessions started',
      value: String(metrics.totalSessions),
      hint: metrics.totalSessions - metrics.completedSessions
        ? `${metrics.totalSessions - metrics.completedSessions} in progress or ended early`
        : undefined,
    },
    { label: 'Answers given', value: String(metrics.totalQuestionsAnswered) },
    {
      label: 'Average score',
      value: metrics.averageScore !== null ? metrics.averageScore.toFixed(1) : '—',
      hint: metrics.averageScore !== null ? '/ 5 across completed sessions' : undefined,
    },
    {
      label: 'Best topic',
      value: metrics.bestTopic?.topic ?? '—',
      hint: metrics.bestTopic ? `${metrics.bestTopic.score.toFixed(1)} avg` : undefined,
    },
    {
      label: 'Current streak',
      value: metrics.currentStreakDays > 0 ? `${metrics.currentStreakDays} day${metrics.currentStreakDays === 1 ? '' : 's'}` : '—',
      hint: metrics.currentStreakDays > 0 ? 'Keep it rolling.' : 'Practice today to start.',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-lg border border-border/70 bg-card p-4 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
          {item.hint && (
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          )}
        </article>
      ))}
    </div>
  );
}
