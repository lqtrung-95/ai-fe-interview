'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { toggleStudiedAction } from '../actions/study-plan-actions';

interface Props {
  seedQuestionId: string;
  initialStudied: boolean;
  /** If false, user has no plan — render nothing or a disabled hint. */
  hasPlan: boolean;
}

export function MarkStudiedButton({ seedQuestionId, initialStudied, hasPlan }: Props) {
  const [studied, setStudied] = useState(initialStudied);
  const [pending, startTransition] = useTransition();

  if (!hasPlan) {
    return (
      <p className="text-xs text-muted-foreground">
        <a href="/study-plan" className="underline underline-offset-2 hover:text-foreground">
          Create a study plan
        </a>{' '}
        to track your progress here.
      </p>
    );
  }

  function toggle() {
    startTransition(async () => {
      const next = await toggleStudiedAction(seedQuestionId);
      setStudied(next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
        studied
          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {studied
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <Circle className="h-4 w-4 shrink-0" />
      }
      {pending ? 'Saving…' : studied ? 'Studied ✓' : 'Mark as studied'}
    </button>
  );
}
