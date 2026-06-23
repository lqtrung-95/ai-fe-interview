import { FeedbackCard } from './feedback-card';
import type { FeedbackPayload } from '../feedback-types';

/** One answered question with the user's response and AI feedback. */
export interface BreakdownQuestion {
  id: string;
  order: number;
  topic: string;
  question: string;
  answer: {
    answer: string;
    followUpAnswer: string | null;
    feedback: FeedbackPayload | null;
  } | null;
}

interface Props {
  questions: BreakdownQuestion[];
}

/**
 * Per-question debrief: question → user's answer → AI feedback → follow-up.
 * Shared by the history detail page and the mock-interview results page.
 */
export function SessionQuestionBreakdown({ questions }: Props) {
  return (
    <section className="space-y-6">
      {questions.map((question) => (
        <article key={question.id} className="space-y-4">
          {/* Question header */}
          <div className="rounded-lg border border-border/60 bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Question {question.order + 1} · {question.topic}
            </p>
            <h2 className="mt-2 text-lg font-medium leading-relaxed">{question.question}</h2>
          </div>

          {/* User's primary answer */}
          {question.answer && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your answer
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{question.answer.answer}</p>
            </div>
          )}

          {/* AI feedback */}
          {question.answer?.feedback && <FeedbackCard feedback={question.answer.feedback} />}

          {/* Follow-up answer (question text was not persisted — only the response) */}
          {question.answer?.followUpAnswer && (
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Follow-up response
              </p>
              <div className="rounded-md bg-muted/30 p-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {question.answer.followUpAnswer}
                </p>
              </div>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
