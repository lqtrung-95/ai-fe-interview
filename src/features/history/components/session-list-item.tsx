'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSessionAction } from '../server/delete-session-action';

interface Props {
  session: {
    id: string;
    mode: string;
    topics: string[];
    status: string;
    overallScore: number | null;
    startedAt: Date;
    completedAt: Date | null;
    questions: unknown[];
  };
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground';
  if (score >= 4) return 'text-emerald-500';
  if (score >= 3) return 'text-primary';
  return 'text-amber-500';
}

function modeDetails(mode: string) {
  if (mode === 'quick_drill') return { label: 'Quick drill', Icon: Zap };
  if (mode === 'deep_coaching') return { label: 'Deep coaching', Icon: Sparkles };
  return { label: 'Standard mock', Icon: BookOpenCheck };
}

export function SessionListItem({ session }: Props) {
  const isInProgress = session.status === 'in_progress';
  const { label: modeLabel, Icon } = modeDetails(session.mode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => { await deleteSessionAction(session.id); });
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.preventDefault();
    setConfirmDelete(false);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-colors hover:border-primary/30">
      <Link
        href={`/history/${session.id}`}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight">{modeLabel}</h2>
            <span className={
              'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
              (isInProgress
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500')
            }>
              {session.status.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {session.startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {session.questions.length} {session.questions.length === 1 ? 'question' : 'questions'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {session.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
              >
                {topic}
              </span>
            ))}
            {session.topics.length > 3 && (
              <span className="text-[11px] font-medium text-muted-foreground">
                +{session.topics.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score</p>
          <p className={`text-2xl font-extrabold tabular-nums ${scoreColor(session.overallScore)}`}>
            {session.overallScore !== null ? session.overallScore.toFixed(1) : '—'}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/ 5</span>
          </p>
        </div>
        <div className="hidden items-center gap-1 text-xs font-semibold text-primary md:flex">
          {isInProgress ? 'Resume' : 'Review'}
          <ArrowRight className="size-4" />
        </div>
      </Link>

      {isInProgress && (
        <div className="flex items-center gap-2 border-t border-border/40 bg-muted/10 px-5 py-2.5">
          <Link
            href={`/practice/${session.id}`}
            className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue →
          </Link>
          {confirmDelete ? (
            <>
              <span className="text-xs text-muted-foreground">Remove this session?</span>
              <Button variant="destructive" size="sm" className="h-7 px-3 text-xs" onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Removing…' : 'Yes, remove'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs" onClick={handleCancelDelete} disabled={isPending}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              Remove
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
