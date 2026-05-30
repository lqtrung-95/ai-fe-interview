import { CheckCircle2, Layers, MessageSquare, Star } from 'lucide-react';
import type { OverviewMetrics } from '../dashboard-types';

interface Props {
  metrics: OverviewMetrics;
}

export function OverviewCards({ metrics }: Props) {
  const items = [
    {
      label: 'Sessions completed',
      value: String(metrics.completedSessions),
      icon: CheckCircle2,
      iconClass: 'bg-emerald-500/10 text-emerald-500',
      accent: false,
    },
    {
      label: 'Sessions started',
      value: String(metrics.totalSessions),
      hint:
        metrics.totalSessions - metrics.completedSessions
          ? `${metrics.totalSessions - metrics.completedSessions} in progress`
          : undefined,
      icon: Layers,
      iconClass: 'bg-sky-500/10 text-sky-400',
      accent: false,
    },
    {
      label: 'Answers given',
      value: String(metrics.totalQuestionsAnswered),
      icon: MessageSquare,
      iconClass: 'bg-violet-500/10 text-violet-400',
      accent: false,
    },
    {
      label: 'Avg score',
      value:
        metrics.averageScore !== null
          ? `${metrics.averageScore.toFixed(1)}`
          : '—',
      suffix: metrics.averageScore !== null ? ' / 5' : undefined,
      hint: metrics.averageScore !== null ? 'across all sessions' : undefined,
      icon: Star,
      iconClass: 'bg-primary/10 text-primary',
      accent: true,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className={
              'rounded-xl border bg-card p-5 ' +
              (item.accent
                ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
                : 'border-border/60')
            }
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {item.label}
              </p>
              <span className={`flex h-7 w-7 items-center justify-center rounded-md ${item.iconClass}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p
              className={
                'mt-3 text-3xl font-extrabold tracking-tight ' +
                (item.accent ? 'text-primary' : 'text-foreground')
              }
            >
              {item.value}
              {item.suffix && (
                <span className="text-lg font-medium text-muted-foreground">{item.suffix}</span>
              )}
            </p>
            {item.hint && (
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
