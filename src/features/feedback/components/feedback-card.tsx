import { BetterAnswerCard } from './better-answer-card';
import { DimensionScoreRow } from './dimension-score-row';
import type { FeedbackPayload } from '../feedback-types';

interface Props {
  feedback: FeedbackPayload;
}

const DIMENSIONS = [
  ['Correctness', 'correctness'],
  ['Completeness', 'completeness'],
  ['Clarity', 'clarity'],
  ['Depth', 'depth'],
  ['Trade-offs', 'tradeoffThinking'],
  ['Communication', 'communication'],
] as const;

export function FeedbackCard({ feedback }: Props) {
  return (
    <article className="space-y-5 rounded-lg border border-border/60 bg-card p-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Feedback</p>
          <h2 className="text-xl font-semibold">{feedback.overallScore.toFixed(1)} / 5</h2>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {DIMENSIONS.map(([label, key]) => (
          <DimensionScoreRow key={key} label={label} score={feedback.scores[key]} />
        ))}
      </section>

      <FeedbackList title="What went well" items={feedback.whatWentWell} />
      <FeedbackList title="What was missing" items={feedback.whatWasMissing} />
      <FeedbackList title="Technical corrections" items={feedback.technicalCorrections} />
      <FeedbackList title="How to improve" items={feedback.improvementSuggestions} />

      <BetterAnswerCard answer={feedback.betterAnswer} />

      {feedback.seniorLevelAddition && (
        <FeedbackList title="Senior-level addition" items={[feedback.seniorLevelAddition]} />
      )}
      <FeedbackList title="Recommended next practice" items={feedback.recommendedNextPractice} />
    </article>
  );
}

function FeedbackList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
