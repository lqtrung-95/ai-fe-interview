import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { Difficulty, QuestionType } from '@prisma/client';
import { listStudyQuestions, getStudyTopics, countStudyQuestions } from '@/features/study/server/study-service';
import { StudyFilterBar } from '@/features/study/components/study-filter-bar';
import { StudyQuestionCard } from '@/features/study/components/study-question-card';

export const metadata: Metadata = { title: 'Question Bank' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuestionBankPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const topic = typeof sp.topic === 'string' ? sp.topic : undefined;
  const difficulty = typeof sp.difficulty === 'string' ? (sp.difficulty as Difficulty) : undefined;
  const type = typeof sp.type === 'string' ? (sp.type as QuestionType) : undefined;

  const [topics, questions, total] = await Promise.all([
    getStudyTopics(),
    listStudyQuestions({ topic, difficulty, type }),
    countStudyQuestions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Question Bank</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse all interview questions with explanations and diagrams before you practice.
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <StudyFilterBar
          topics={topics}
          totalCount={total}
          filteredCount={questions.length}
        />
      </Suspense>

      {/* Grid */}
      {questions.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No questions match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((q) => (
            <StudyQuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
