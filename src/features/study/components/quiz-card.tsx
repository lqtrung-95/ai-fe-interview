'use client';

/**
 * Interactive quick-check quiz card shown at the bottom of every study detail page.
 * Supports MCQ (4 options) and True/False formats.
 *
 * Behaviour:
 *  - Before answer: all options show as neutral buttons
 *  - After answer:  correct option turns green, wrong selection turns red
 *  - Explanation revealed only after the user answers
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface QuizData {
  format: 'mcq' | 'tf';
  question: string;
  options: string[];   // 4 for mcq, 2 for tf
  answer: number;      // 0-indexed correct option
  explanation: string;
}

interface Props {
  quiz: QuizData;
}

export function QuizCard({ quiz }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === quiz.answer;

  function pick(i: number) {
    if (!answered) setSelected(i);
  }

  // For MCQ show A/B/C/D badges; for TF no badge needed
  const badge = (i: number) =>
    quiz.format === 'mcq' ? String.fromCharCode(65 + i) : null;

  const optionClass = (i: number) =>
    cn(
      'flex items-start gap-3 w-full rounded-lg border px-4 py-3 text-sm text-left transition-colors',
      !answered && 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/4 cursor-pointer',
      answered && i === quiz.answer && 'border-green-500/50 bg-green-500/8 text-green-700 dark:text-green-400',
      answered && i === selected && i !== quiz.answer && 'border-red-500/40 bg-red-500/8 text-red-600 dark:text-red-400',
      answered && i !== selected && i !== quiz.answer && 'border-border/40 opacity-50',
    );

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">🧩</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Quick Check
        </span>
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-foreground leading-snug">
        {quiz.question}
      </p>

      {/* Options */}
      <div className={cn(
        'grid gap-2',
        quiz.format === 'mcq' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2',
      )}>
        {quiz.options.map((opt, i) => (
          <button key={i} onClick={() => pick(i)} className={optionClass(i)}>
            {badge(i) && (
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5',
                !answered && 'bg-muted text-muted-foreground',
                answered && i === quiz.answer && 'bg-green-500 text-white',
                answered && i === selected && i !== quiz.answer && 'bg-red-500 text-white',
                answered && i !== selected && i !== quiz.answer && 'bg-muted text-muted-foreground',
              )}>
                {badge(i)}
              </span>
            )}
            <span className="leading-snug">{opt}</span>
          </button>
        ))}
      </div>

      {/* Explanation — revealed after answering */}
      {answered && (
        <div className={cn(
          'rounded-lg border px-4 py-3 text-sm leading-relaxed',
          correct
            ? 'border-green-500/30 bg-green-500/6 text-green-800 dark:text-green-300'
            : 'border-amber-500/30 bg-amber-500/6 text-amber-800 dark:text-amber-300',
        )}>
          <span className="font-semibold mr-1.5">
            {correct ? '✓ Correct!' : `✗ Not quite — the answer is ${badge(quiz.answer) ?? quiz.options[quiz.answer]}.`}
          </span>
          {quiz.explanation}
        </div>
      )}
    </div>
  );
}
