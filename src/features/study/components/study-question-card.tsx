'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
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
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export function StudyQuestionCard({ question: q, isBookmarked = false, onToggleBookmark }: Props) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/70 bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      {/* Bookmark button — top-right corner, stops link navigation */}
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onToggleBookmark(); }}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
          className={
            'absolute right-3 top-3 rounded-md p-1 transition-colors ' +
            (isBookmarked
              ? 'text-primary'
              : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary')
          }
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      )}

      <Link href={`/question-bank/${q.id}`} className="flex flex-1 flex-col gap-3 p-5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pr-6">
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
    </div>
  );
}
