/**
 * Bridges the handbook JSON quiz shape to the existing QuizCard component.
 * The QuizCard already handles MCQ interactivity (select → reveal correct/wrong).
 */

import { QuizCard } from '@/features/study/components/quiz-card';

interface QuizBlockData {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface Props {
  data: QuizBlockData;
}

export function HandbookQuizBlock({ data }: Props) {
  return (
    <div className="my-6">
      <QuizCard
        quiz={{
          format: 'mcq',
          question: data.question,
          options: data.options,
          answer: data.answer,
          explanation: data.explanation,
        }}
      />
    </div>
  );
}
