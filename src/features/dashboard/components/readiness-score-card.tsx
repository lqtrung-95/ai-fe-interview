'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface TopicBar {
  topic: string;
  readiness: number;
  answers: number;
}

interface Props {
  overall: number;
  topics: TopicBar[];
}

function scoreColor(pct: number) {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 45) return 'bg-amber-500';
  return 'bg-rose-500';
}

function scoreLabel(pct: number) {
  if (pct >= 80) return 'Ready';
  if (pct >= 55) return 'Getting there';
  if (pct >= 25) return 'Needs work';
  return 'Not started';
}

export function ReadinessScoreCard({ overall, topics }: Props) {
  return (
    <section className="app-surface-card rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <h2 className="text-sm font-bold">Interview Readiness</h2>
        </div>
        {/* Overall ring */}
        <div className="flex items-baseline gap-1">
          <span className="app-gradient-text text-2xl font-extrabold tabular-nums">{overall}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Per-topic bars */}
      <ul className="space-y-2.5">
        {topics.map(({ topic, readiness, answers }) => (
          <li key={topic}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-foreground/80">{topic}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {answers === 0 ? 'No practice yet' : scoreLabel(readiness)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreColor(readiness)}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {overall < 80 && (
        <div className="mt-4 border-t border-border/40 pt-4">
          <Link
            href="/practice/new"
            className={buttonVariants({ size: 'sm', variant: 'outline' }) + ' w-full justify-center text-xs'}
          >
            Practice to improve readiness →
          </Link>
        </div>
      )}
    </section>
  );
}
