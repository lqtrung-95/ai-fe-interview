'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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

export function SessionListItem({ session }: Props) {
  const isInProgress = session.status === 'in_progress';
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); // don't follow the parent link
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      await deleteSessionAction(session.id);
    });
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.preventDefault();
    setConfirmDelete(false);
  }

  return (
    <div className="border-b border-border/70 bg-card last:border-b-0">
      <Link
        href={`/history/${session.id}`}
        className="flex flex-wrap items-start justify-between gap-3 p-5 transition-colors hover:bg-muted/40"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{session.mode.replace('_', ' ')}</Badge>
            <Badge variant={isInProgress ? 'default' : 'secondary'}>
              {session.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{session.topics.join(' + ')}</p>
          <p className="text-xs text-muted-foreground">
            {session.startedAt.toLocaleDateString()} · {session.questions.length} questions answered
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {session.overallScore ? session.overallScore.toFixed(1) : '-'}
          </p>
          <p className="text-xs text-muted-foreground">score</p>
        </div>
      </Link>

      {isInProgress && (
        <div className="flex items-center gap-2 border-t border-border/40 bg-muted/20 px-5 py-2">
          <Link
            href={`/practice/${session.id}`}
            className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue session
          </Link>
          {confirmDelete ? (
            <>
              <span className="text-xs text-muted-foreground">Remove this session?</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? 'Removing…' : 'Yes, remove'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={handleCancelDelete}
                disabled={isPending}
              >
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
