'use client';

import { Bookmark } from 'lucide-react';
import { useBookmarks } from '../hooks/use-bookmarks';
import { StudyQuestionCard } from './study-question-card';
import type { StudyQuestionSummary } from '../server/study-service';

interface Props {
  questions: StudyQuestionSummary[];
  showBookmarkedOnly?: boolean;
}

/**
 * Client component that owns bookmark state and filters the question list.
 * All questions are fetched server-side; this component simply controls
 * visibility based on localStorage bookmarks.
 */
export function StudyQuestionsGrid({ questions, showBookmarkedOnly }: Props) {
  const { ids: bookmarkedIds, toggle } = useBookmarks();

  const visible = showBookmarkedOnly
    ? questions.filter((q) => bookmarkedIds.has(q.id))
    : questions;

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-10 text-center">
        {showBookmarkedOnly ? (
          <div className="flex flex-col items-center gap-2">
            <Bookmark className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No bookmarks yet</p>
            <p className="text-xs text-muted-foreground">
              Click the bookmark icon on any question card to save it here.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No questions match your filters.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((q) => (
        <StudyQuestionCard
          key={q.id}
          question={q}
          isBookmarked={bookmarkedIds.has(q.id)}
          onToggleBookmark={() => toggle(q.id)}
        />
      ))}
    </div>
  );
}
