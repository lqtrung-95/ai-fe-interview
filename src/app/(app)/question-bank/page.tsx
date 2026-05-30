import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { Difficulty, QuestionType } from '@prisma/client';
import { listStudyQuestions, getStudyTopics, countStudyQuestions } from '@/features/study/server/study-service';
import { StudyFilterBar } from '@/features/study/components/study-filter-bar';
import { StudyQuestionsGrid } from '@/features/study/components/study-questions-grid';
import { BookmarkFilterToggle } from '@/features/study/components/bookmark-filter-toggle';

export const metadata: Metadata = { title: 'Question Bank' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuestionBankPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const topic = typeof sp.topic === 'string' ? sp.topic : undefined;
  const difficulty = typeof sp.difficulty === 'string' ? (sp.difficulty as Difficulty) : undefined;
  const type = typeof sp.type === 'string' ? (sp.type as QuestionType) : undefined;
  const showBookmarkedOnly = sp.bookmarked === 'true';

  const [topics, questions, total] = await Promise.all([
    getStudyTopics(),
    listStudyQuestions({ topic, difficulty, type }),
    countStudyQuestions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Study</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Question Bank</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse all {total} questions with explanations and diagrams before you practice.
          </p>
        </div>
        <Suspense fallback={null}>
          <BookmarkFilterToggle active={showBookmarkedOnly} />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <StudyFilterBar
          topics={topics}
          totalCount={total}
          filteredCount={questions.length}
        />
      </Suspense>

      {/* Grid — client component owns bookmark state and filtering */}
      <StudyQuestionsGrid
        questions={questions}
        showBookmarkedOnly={showBookmarkedOnly}
      />
    </div>
  );
}
