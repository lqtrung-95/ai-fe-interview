'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { useMarkStudiedMutation } from '../hooks/use-mark-studied-mutation';
import { useStudyPlanProgressQuery } from '../hooks/use-study-plan-progress-query';
import type { StudyPlanProgress } from '../hooks/use-study-plan-progress-query';

interface Props {
  seedQuestionId: string;
  /** SSR-rendered initial state — seeds the query cache to avoid a loading flash. */
  initialStudied: boolean;
  hasPlan: boolean;
}

export function MarkStudiedButton({ seedQuestionId, initialStudied, hasPlan }: Props) {
  // Seed initial data from SSR so the button renders correctly before first fetch
  const initialData: StudyPlanProgress | undefined = hasPlan
    ? { hasPlan: true, studiedIds: initialStudied ? [seedQuestionId] : [] }
    : undefined;

  const { data } = useStudyPlanProgressQuery(initialData);
  const mutation  = useMarkStudiedMutation(seedQuestionId);

  // Prefer live cache; fall back to SSR prop before first query resolves
  const studied = data
    ? data.studiedIds.includes(seedQuestionId)
    : initialStudied;

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

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
        studied
          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {studied
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <Circle className="h-4 w-4 shrink-0" />}
      {mutation.isPending ? 'Saving…' : studied ? 'Studied ✓' : 'Mark as studied'}
    </button>
  );
}
