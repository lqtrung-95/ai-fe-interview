'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { markReviewedAction } from '../actions/study-plan-actions';

interface Props {
  seedQuestionId: string;
}

/**
 * Inline "Reviewed ✓" button shown on SM-2 due-review cards.
 * Calls markReviewedAction which advances the SM-2 interval and removes the
 * question from today's review queue via revalidatePath.
 */
export function MarkReviewedButton({ seedQuestionId }: Props) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    // Prevent the parent <Link> from navigating
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await markReviewedAction(seedQuestionId);
      setDone(true);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || done}
      className={
        'shrink-0 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-60 ' +
        (done
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground')
      }
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      {done ? 'Done!' : pending ? '…' : 'Reviewed'}
    </button>
  );
}
