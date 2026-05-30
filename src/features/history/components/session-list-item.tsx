'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
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

export function SessionListItem({ session }: Props) {
  const isInProgress = session.status === 'in_progress';
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
    <div className="border-b border-border/60 last:border-b-0">
      <Link
        href={`/history/${session.id}`}
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
      >
        {/* Left: topics + meta */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {session.topics.map((t) => (
              <span
                key={t}
                className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
              >
                {t}
              </span>
            ))}
            <span className={
              'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
              (isInProgress
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-emerald-500/10 text-emerald-500')
            }>
              {session.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {session.startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {session.questions.length} {session.questions.length === 1 ? 'question' : 'questions'}
            {' · '}
            <span className="capitalize">{session.mode.replace('_', ' ')}</span>
          </p>
        </div>

        {/* Right: score */}
        <div className="shrink-0 text-right">
          <p className={`text-2xl font-extrabold tabular-nums ${scoreColor(session.overallScore)}`}>
            {session.overallScore !== null ? session.overallScore.toFixed(1) : '—'}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 5</p>
        </div>
      </Link>

      {/* In-progress actions */}
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
    </div>
  );
}
