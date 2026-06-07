import Link from 'next/link';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { ChallengeWithStatus } from './types';

const DIFFICULTY_STYLES: Record<string, string> = {
  junior: 'bg-green-500/10 text-green-600 dark:text-green-400',
  mid: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  senior: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

const STATUS_ICON = {
  solved: <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Solved" />,
  attempted: <Clock className="h-4 w-4 text-amber-500" aria-label="Attempted" />,
  unsolved: <Circle className="h-4 w-4 text-muted-foreground/40" aria-label="Not started" />,
};

interface Props {
  challenge: ChallengeWithStatus;
}

export function ChallengeCard({ challenge }: Props) {
  return (
    <Link
      href={`/coding-challenges/${challenge.id}`}
      className="group app-surface-card flex flex-col gap-3 rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {challenge.title}
        </h3>
        {STATUS_ICON[challenge.userStatus]}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[challenge.difficulty] ?? ''}`}>
          {challenge.difficulty}
        </span>
        <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
          {challenge.topic}
        </span>
      </div>

      {challenge.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {challenge.tags.map((tag) => (
            <span key={tag} className="rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
