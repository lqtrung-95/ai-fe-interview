import Link from 'next/link';
import type { StudyQuestionSummary } from '../server/study-service';

const DIFFICULTY_STYLES: Record<string, string> = {
  junior: 'bg-green-500/10 text-green-600 dark:text-green-400',
  mid:    'bg-blue-500/10  text-blue-600  dark:text-blue-400',
  senior: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

const TYPE_LABELS: Record<string, string> = {
  conceptual:    'Conceptual',
  debugging:     'Debugging',
  system_design: 'System design',
  behavioral:    'Behavioral',
  tradeoff:      'Trade-off',
};

interface Props {
  question: StudyQuestionSummary;
}

export function StudyQuestionCard({ question: q }: Props) {
  return (
    <Link
      href={`/question-bank/${q.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
    >
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {q.topic}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[q.difficulty] ?? ''}`}>
          {q.difficulty}
        </span>
        <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
          {TYPE_LABELS[q.type] ?? q.type}
        </span>
      </div>

      {/* Question text */}
      <p className="flex-1 text-sm font-medium leading-snug text-foreground line-clamp-3 group-hover:text-primary transition-colors">
        {q.question}
      </p>

      {/* Subtopic */}
      {q.subtopic && (
        <span className="truncate text-xs text-muted-foreground">{q.subtopic}</span>
      )}
    </Link>
  );
}
